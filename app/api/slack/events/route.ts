// app/api/slack/events/route.ts
// Tar emot Slack Events API-webhooks.
// Lyssnar på meddelanden med nyhetsbrevsinstruktioner → sparar i pending_instructions.
//
// Slack-app behöver:
//   Event Subscriptions → Request URL: https://[din-domän]/api/slack/events
//   Subscribe to bot events: message.channels (eller message.groups för privata kanaler)
//   Scopes: channels:history, chat:write, groups:history (valfritt)

import { NextResponse } from 'next/server';
import { waitUntil } from '@vercel/functions';
import crypto from 'crypto';
import { parseInstruction, resolveInstruction } from '@/lib/slack-instructions';
import { storePendingInstructions, getLatestDraft, updateDraft } from '@/lib/supabase';
import { runCollect } from '@/lib/collect';
import { fetchArticleById } from '@/lib/sanity';
import { buildPlaceholders } from '@/lib/placeholders';
import { getEditorForDate } from '@/lib/editors';
import { createExtraBrev } from '@/lib/extra-brev';

export const maxDuration = 60;

const SLACK_SIGNING_SECRET = process.env.SLACK_SIGNING_SECRET ?? '';
const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN ?? '';

// ─── Signaturverifiering ──────────────────────────────────────────────────────

function verifySlackSignature(
  signingSecret: string,
  signature: string,
  timestamp: string,
  body: string
): boolean {
  const fiveMinutes = 60 * 5;
  const ageSecs = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (ageSecs > fiveMinutes) {
    console.error(`[slack-verify] Timestamp för gammal: ${ageSecs}s`);
    return false;
  }

  const baseStr = `v0:${timestamp}:${body}`;
  const hmac = crypto.createHmac('sha256', signingSecret).update(baseStr).digest('hex');
  const expected = `v0=${hmac}`;

  console.log(`[slack-verify] secret[:8]=${signingSecret.slice(0, 8)} sig=${signature.slice(0, 16)}... expected=${expected.slice(0, 16)}...`);

  try {
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}

// ─── Svara i Slack-tråden ─────────────────────────────────────────────────────

async function replyInThread(channel: string, threadTs: string, text: string) {
  if (!SLACK_BOT_TOKEN) return;
  await fetch('https://slack.com/api/chat.postMessage', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${SLACK_BOT_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ channel, thread_ts: threadTs, text }),
  });
}

// ─── Huvudhanterare ───────────────────────────────────────────────────────────

export async function POST(request: Request) {
  // Ignorera Slack-retries – svara 200 direkt så Slack slutar försöka
  const retryNum = request.headers.get('x-slack-retry-num');
  if (retryNum) {
    return NextResponse.json({ ok: true });
  }

  const rawBody = await request.text();
  const payload = JSON.parse(rawBody);

  // Slack URL-verifiering – svara alltid direkt, innan signaturkoll
  if (payload.type === 'url_verification') {
    return NextResponse.json({ challenge: payload.challenge });
  }

  // Verifiera Slack-signatur för alla andra requests
  if (SLACK_SIGNING_SECRET) {
    const signature = request.headers.get('x-slack-signature') ?? '';
    const timestamp = request.headers.get('x-slack-request-timestamp') ?? '';
    if (!verifySlackSignature(SLACK_SIGNING_SECRET, signature, timestamp, rawBody)) {
      console.error('[slack/events] Signature mismatch – kontrollera SLACK_SIGNING_SECRET');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }
  }

  // Händelsehantering
  const event = payload.event;
  console.log('[slack/events] event type:', event?.type, 'bot_id:', event?.bot_id, 'subtype:', event?.subtype);
  if (!event) return NextResponse.json({ ok: true });

  // Lyssna på både direkta mentions (@bot) och kanalmeddelanden
  if (!['app_mention', 'message'].includes(event.type)) {
    console.log('[slack/events] Ignorerar event type:', event.type);
    return NextResponse.json({ ok: true });
  }

  // Ignorera bot-meddelanden för att undvika loopar
  if (event.bot_id || event.subtype) {
    console.log('[slack/events] Ignorerar bot/subtype:', event.bot_id, event.subtype);
    return NextResponse.json({ ok: true });
  }

  const text: string = (event.text ?? '').trim();
  const channel: string = event.channel ?? '';
  const threadTs: string = event.thread_ts ?? event.ts ?? '';

  // Rensa bort @mention (<@UXXXXXXX>) från texten
  const textWithoutMention = text.replace(/<@[A-Z0-9]+>/gi, '').trim();

  // ── /extrabrev [rubrikfragment] ───────────────────────────────────────────
  const extraMatch = textWithoutMention.match(/\/extrabrev\s+(.+)/i);
  if (extraMatch) {
    const titleFragment = extraMatch[1].trim();
    waitUntil(triggerExtraBrev(titleFragment, channel, threadTs).catch(console.error));
    return NextResponse.json({ ok: true });
  }

  // Kolla om meddelandet innehåller /nyhetsbrev eller slutar med "kör"
  const hasGo = /\/nyhetsbrev\b/i.test(textWithoutMention) || /\bkör\s*$/i.test(textWithoutMention);
  // Rensa bort /nyhetsbrev och "kör" från instruktionen
  const cleanText = textWithoutMention.replace(/\/nyhetsbrev\b/gi, '').replace(/\bkör\s*$/i, '').trim();

  console.log('[slack/events] hasGo:', hasGo, 'cleanText length:', cleanText.length);

  if (hasGo && cleanText.length === 0) {
    // Bara /nyhetsbrev → automatiskt brev med standardregler, ignorerar pending instructions
    waitUntil(triggerCollect(channel, threadTs, 'auto').catch(console.error));
    return NextResponse.json({ ok: true });
  }

  if (cleanText.length > 0) {
    // Instruktion (med eller utan /nyhetsbrev) → tolka och hantera
    waitUntil(processInstruction(cleanText, channel, threadTs, hasGo).catch(console.error));
  }

  return NextResponse.json({ ok: true });
}

async function triggerCollect(channel: string, threadTs: string, mode: 'auto' | 'manual' = 'auto') {
  const modeText = mode === 'manual' ? '⚙️ Kör brev med dina instruktioner...' : '⚙️ Kör automatiskt brev – hämtar schemalagda artiklar...';
  await replyInThread(channel, threadTs, modeText);
  try {
    const result = await runCollect(mode);
    await replyInThread(channel, threadTs, `✅ Brevet är byggt!\n👉 ${result.dashboardUrl}`);
  } catch (err) {
    await replyInThread(channel, threadTs, `❌ Något gick fel: ${String(err)}`);
  }
}

async function processInstruction(text: string, channel: string, threadTs: string, triggerAfter = false) {
  try {
    await replyInThread(channel, threadTs, '🔄 Tolkar instruktionen...');

    const parsed = await parseInstruction(text);
    if (!parsed || ((parsed.articleFragments ?? []).length === 0 && !parsed.editorName && !parsed.psFragment && !parsed.swapArticle && (parsed.svepHints ?? []).length === 0)) {
      await replyInThread(channel, threadTs, '❓ Kunde inte tolka instruktionen. Försök t.ex: "Byt översta artikeln mot [rubrik]" eller "artiklar: [rubrik 1], [rubrik 2] /nyhetsbrev"');
      return;
    }

    const resolved = await resolveInstruction(parsed, text);

    // Om det är ett artikelbyte → uppdatera senaste utkastet direkt
    if (resolved.swapArticle) {
      await swapArticleInDraft(resolved.swapArticle, channel, threadTs);
      return;
    }

    // Annars: spara som pending instruction
    await storePendingInstructions({
      editorOverride: resolved.editorOverride ?? null,
      articleIds: resolved.articleIds,
      psArticleId: resolved.psArticleId ?? null,
      svepHints: resolved.svepHints ?? [],
      rawText: text,
      slackChannel: channel,
      slackThreadTs: threadTs,
    });

    const summary = resolved.confirmationLines.join('\n');

    if (triggerAfter) {
      await replyInThread(channel, threadTs, `✅ *Instruktion sparad!*\n\n${summary}\n\n⚙️ Kör collect nu...`);
      await triggerCollect(channel, threadTs, 'manual');
    } else {
      await replyInThread(
        channel,
        threadTs,
        `✅ *Instruktion sparad för nästa brev!*\n\n${summary}\n\n_Skriv \`/nyhetsbrev\` när du vill köra._`
      );
    }
  } catch (err) {
    console.error('[slack/events] processInstruction error:', err);
    await replyInThread(channel, threadTs, `❌ Något gick fel: ${String(err)}`);
  }
}

async function triggerExtraBrev(titleFragment: string, channel: string, threadTs: string) {
  await replyInThread(channel, threadTs, `🔍 Söker artikel för extrabrev: _"${titleFragment}"_...`);
  try {
    const result = await createExtraBrev(titleFragment);
    const captionDebug = result.imageCaption ? `🖼 Bildtext: _${result.imageCaption}_\n` : `🖼 Bildtext: _(saknas)_\n`;
    await replyInThread(
      channel,
      threadTs,
      `✅ *Extrabrev skapat i Mailchimp!*\n📰 Artikel: *${result.articleTitle}*\n📧 Ämnesrad: _${result.subject}_\n${captionDebug}\n<${result.editUrl}|Öppna i Mailchimp →>`
    );
  } catch (err) {
    await replyInThread(channel, threadTs, `❌ Något gick fel: ${String(err)}`);
  }
}

async function swapArticleInDraft(
  swap: { position: 1 | 2 | 3; articleId: string; articleTitle: string },
  channel: string,
  threadTs: string
) {
  const draft = await getLatestDraft();
  if (!draft) {
    await replyInThread(channel, threadTs, '⚠️ Hittade inget aktuellt utkast att uppdatera.');
    return;
  }

  const article = await fetchArticleById(swap.articleId);
  if (!article) {
    await replyInThread(channel, threadTs, `⚠️ Kunde inte hämta artikeln.`);
    return;
  }

  const articleData = {
    _id: article._id,
    title: article.title,
    ingress: article.ingress,
    mainImageUrl: article.mainImageUrl,
    imageCaption: article.imageCaption,
    category: article.category,
    url: article.url,
    slug: article.slug,
    publishedAt: article.publishedAt,
  };

  const fieldMap = { 1: 'article1_data', 2: 'article2_data', 3: 'article3_data' } as const;
  const field = fieldMap[swap.position];

  const merged = { ...draft, [field]: articleData };

  // Bygg om editor från editor_day
  const d = new Date();
  const diff = (merged.editor_day ?? 1) - d.getDay();
  d.setDate(d.getDate() + diff);
  const editor = getEditorForDate(d);

  const rebuilt = buildPlaceholders({
    editor,
    subjectOptions: merged.subject_options as [string, string, string],
    intro: merged.intro,
    article1: merged.article1_data,
    article2: merged.article2_data,
    article3: merged.article3_data ?? undefined,
    svepet: merged.svepet_data,
    tocLabels: undefined,
    fundingText: merged.funding_text,
    isBetalande: merged.is_betalande,
    mostRead: [],
    psArticle: undefined,
    meetups: merged.meetups_data ?? [],
    sponsorActive: merged.sponsor_active,
    teknikActive: merged.teknik_active,
    date: new Date(merged.date),
  });

  // Bevara collect-genererade placeholders
  const saved = draft.placeholders as Record<string, string>;
  const placeholders = {
    ...rebuilt,
    '[[mostread_placeholder]]': saved['[[mostread_placeholder]]'] || '',
    '[[psarticletitle_placeholder]]': saved['[[psarticletitle_placeholder]]'] || '',
    '[[psarticlelink_placeholder]]': saved['[[psarticlelink_placeholder]]'] || '',
    '[[psarticleimage_placeholder]]': saved['[[psarticleimage_placeholder]]'] || '',
    '[[tableofcontents_placeholder]]': saved['[[tableofcontents_placeholder]]'] || '',
  };

  await updateDraft(draft.id, { [field]: articleData, placeholders });

  const BASE_URL =
    process.env.NEXT_PUBLIC_BASE_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

  await replyInThread(
    channel,
    threadTs,
    `✅ *Artikel ${swap.position} bytt!*\nNy artikel: *${article.title}*\n👉 ${BASE_URL}/dashboard?draft=${draft.id}`
  );
}

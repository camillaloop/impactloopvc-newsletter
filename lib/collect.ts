// lib/collect.ts
// Innehåller kärn-logiken för att bygga ett nyhetsbrevsutkast.
// Kan anropas direkt från kod (Slack-bot) eller via HTTP (/api/collect).

import { fetchNewsletterArticles, fetchArticlesByIds } from './sanity';
import { fetchMostRead } from './analytics';
import { generateIntro, generateSubjectLines, generateImpactSvepet, generateTocLabels, buildPreheader } from './ai';
import { fetchNewsFeed } from './news-feed';
import { fetchMeetups } from './sheets';
import { fetchFundingRounds, buildFundingTableHtml } from './funding';
import { buildPlaceholders } from './placeholders';
import { getEditorForDate } from './editors';
import { createDraft, getLatestPendingInstruction, markInstructionApplied } from './supabase';
import type { NewsletterDraftData } from './placeholders';

const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL ?? '';

export interface CollectResult {
  draftId: string;
  dashboardUrl: string;
}

// mode: 'auto' = schemalagt/automatiskt (ignorerar pending instructions)
//       'manual' = använd pending instruction från Slack
export async function runCollect(mode: 'auto' | 'manual' = 'auto'): Promise<CollectResult> {
  console.log('[collect] Starting data collection, mode:', mode);

  const today = new Date();

  // Brevet byggs idag men skickas imorgon – använd imorgondagens redaktör
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // 0. Kolla om det finns en pending Slack-instruktion (bara i manual-läge)
  const pendingInstruction = mode === 'manual' ? await getLatestPendingInstruction() : null;
  if (pendingInstruction) {
    console.log('[collect] Found pending instruction:', pendingInstruction.raw_text);
  }

  // Redaktör: pending instruction > roteringsschema (imorgondagens redaktör)
  const editor = pendingInstruction?.editor_override ?? getEditorForDate(tomorrow);

  // 1. Hämta artiklar från Sanity
  console.log('[collect] Fetching Sanity articles...');
  let articles = await fetchNewsletterArticles();

  // Om pending instruction anger specifika artiklar, ersätt med dem
  if (pendingInstruction?.article_ids?.length) {
    const instructedArticles = await fetchArticlesByIds(pendingInstruction.article_ids);
    if (instructedArticles.length >= 1) {
      if (instructedArticles.length < 4) {
        const fallback = articles.filter(
          (a) => !instructedArticles.some((ia) => ia._id === a._id)
        );
        articles = [...instructedArticles, ...fallback].slice(0, 4);
      } else {
        articles = instructedArticles.slice(0, 4);
      }
      console.log('[collect] Articles from Slack instruction:', articles.map((a) => a.title));
    }
  }

  if (articles.length < 2) {
    throw new Error('Not enough articles flagged for newsletter (need at least 2)');
  }

  const [article1, article2, article3, article4] = articles;

  // 2. Hämta mest läst från GA4 + nyhetsflöde parallellt
  console.log('[collect] Fetching GA4 data and news feed...');
  const [mostRead, newsFeed, meetups, fundingRows] = await Promise.all([
    fetchMostRead().catch((e) => {
      console.warn('[collect] GA4 failed:', e.message);
      return [];
    }),
    fetchNewsFeed().catch((e) => {
      console.warn('[collect] News feed failed:', e.message);
      return [];
    }),
    fetchMeetups().catch((e) => {
      console.warn('[collect] Google Sheets failed:', e.message);
      return [];
    }),
    fetchFundingRounds().catch((e) => {
      console.warn('[collect] Funding rounds failed:', e.message);
      return [];
    }),
  ]);

  console.log('[collect] mostRead:', mostRead.length, 'articles');
  console.log('[collect] funding rows:', fundingRows.length);
  const fundingText = buildFundingTableHtml(fundingRows);

  // 3. Generera AI-innehåll parallellt
  console.log('[collect] Generating AI content...');
  const [intro, subjectOptions, svepet, tocLabels] = await Promise.all([
    generateIntro(articles.slice(0, 2), editor.name),
    generateSubjectLines(articles.slice(0, 2)),
    generateImpactSvepet(newsFeed, pendingInstruction?.svep_hints ?? []),
    generateTocLabels([article1, article2, article3].filter(Boolean) as typeof articles),
  ]);

  // 4. PS-artikel: pending instruction > artikel nr 4 i ordningen
  let psArticle: NewsletterDraftData['psArticle'] = article4
    ? { title: article4.title, url: article4.url, imageUrl: article4.mainImageUrl }
    : undefined;

  if (pendingInstruction?.ps_article_id) {
    const { fetchArticleById } = await import('./sanity');
    const ps = await fetchArticleById(pendingInstruction.ps_article_id).catch(() => null);
    if (ps) {
      psArticle = { title: ps.title, url: ps.url, imageUrl: ps.mainImageUrl };
      console.log('[collect] PS-artikel från Slack-instruktion:', ps.title);
    }
  }

  // 5. Bygg draftdata
  const draftData: NewsletterDraftData = {
    editor,
    subjectOptions,
    intro,
    article1,
    article2,
    article3: article3 ?? undefined,
    svepet,
    tocLabels,
    fundingText,
    isBetalande: false,
    mostRead,
    psArticle,
    meetups,
    sponsorActive: false,
    teknikActive: false,
    date: today,
  };

  const placeholders = buildPlaceholders(draftData);

  // 6. Spara i Supabase
  console.log('[collect] Saving draft in Supabase...');
  const draft = await createDraft({
    date: today.toISOString().split('T')[0],
    status: 'draft',
    subject: subjectOptions[0],
    subject_options: subjectOptions,
    preheader: buildPreheader(subjectOptions),
    placeholders,
    intro,
    funding_text: fundingText,
    is_betalande: false,
    sponsor_active: false,
    teknik_active: false,
    article1_data: article1,
    article2_data: article2,
    article3_data: article3 ?? null,
    svepet_data: svepet,
    meetups_data: meetups,
    editor_day: tomorrow.getDay(),
  });

  // 7. Markera pending instruction som tillämpad
  if (pendingInstruction) {
    await markInstructionApplied(pendingInstruction.id);
    console.log('[collect] Pending instruction marked as applied.');
  }

  // 8. Skicka Slack-notis
  const dashboardUrl = `${BASE_URL}/dashboard?draft=${draft.id}`;
  await sendSlackNotification(editor.name, dashboardUrl, articles[0].title);

  console.log(`[collect] Done! Draft ID: ${draft.id}`);
  return { draftId: draft.id, dashboardUrl };
}

async function sendSlackNotification(
  editorName: string,
  dashboardUrl: string,
  firstArticleTitle: string
): Promise<void> {
  if (!SLACK_WEBHOOK_URL) {
    console.warn('[collect] SLACK_WEBHOOK_URL missing – skipping Slack notification');
    return;
  }

  const payload = {
    text: `📬 *Newsletter ready for review!*`,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `📬 *Newsletter ready for review!*\n\n*Today's editor:* ${editorName}\n*Lead story:* ${firstArticleTitle}`,
        },
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: { type: 'plain_text', text: '✏️ Review and approve' },
            url: dashboardUrl,
            style: 'primary',
          },
        ],
      },
    ],
  };

  const res = await fetch(SLACK_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    console.warn('[collect] Slack webhook failed:', await res.text());
  }
}

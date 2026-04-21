// lib/extra-brev.ts
// Delad logik för att skapa ett extrabrev i Mailchimp.
// Används av både /api/extra-brev (REST) och Slack-boten (direkt import).

import { searchArticles } from '@/lib/sanity';
import { generateExtraHtml } from '@/lib/extra-template';
import { fetchSubjectExamples } from '@/lib/ai';
import Anthropic from '@anthropic-ai/sdk';

const MC_KEY    = process.env.MAILCHIMP_API_KEY!;
const MC_SERVER = process.env.MAILCHIMP_SERVER!;
const MC_LIST   = process.env.MAILCHIMP_LIST_ID!;
const BASE      = `https://${MC_SERVER}.api.mailchimp.com/3.0`;
const AUTH      = 'Basic ' + Buffer.from(`anystring:${MC_KEY}`).toString('base64');

async function mcFetch(path: string, options: RequestInit = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: { Authorization: AUTH, 'Content-Type': 'application/json', ...(options.headers ?? {}) },
  });
  if (res.status === 204) return {};
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || `Mailchimp error ${res.status}`);
  return data;
}

async function generateExtraSubject(title: string, ingress: string): Promise<{ subject: string; preview: string }> {
  const client = new Anthropic({ apiKey: process.env.IL_ANTHROPIC_KEY });

  const examples = await fetchSubjectExamples();
  const examplesBlock = examples.length > 0
    ? `\nHär är de ${examples.length} bäst presterande ämnesraderna från Impact Loops historik (öppningsfrekvens | ämnesrad):\n${examples.join('\n')}\n\nStudera mönstren: emoji i början, konkreta siffror, citat med spänning, namngivna bolag/personer, kontrast/konflikt, max ~65 tecken.\n`
    : '';

  const msg = await client.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 150,
    messages: [{
      role: 'user',
      content: `Du skriver en ämnesrad och en preheader för ett extra nyhetsbrev från Impact Loop.
${examplesBlock}
Artikel:
Rubrik: ${title}
Ingress: ${ingress}

Ämnesraden ska utgå DIREKT från artikelrubriken – plocka ut den mest slagkraftiga frasen eller citatet ur rubriken och lägg en emoji framför. Förkorta och skärp vid behov men håll dig till rubrikens ord och känsla.

Exempel:
- Rubrik: "Lars Dahmén: Sluta kritisera alla kolkrediter – här är ett projekt som faktiskt fungerar"
  → Ämnesrad: 🌿 "Sluta kritisera alla kolkrediter"
- Rubrik: "Wallenberg-veteranen uppmanar fler att investera i impact: 'Definitivt'"
  → Ämnesrad: 💰 Wallenberg-veteranen: "Definitivt"

Regler:
1. Ämnesrad: börja med emoji, max 60 tecken, hämta fras/citat direkt ur rubriken
2. Preheader: fungerar som nedryckare – ta en ANNAN vinkel från ingress/rubrik, tillför ny info. Max 80 tecken, ingen emoji.

Svara ENBART i detta format, utan förklaring:
ÄMNESRAD: [ämnesraden]
PREHEADER: [preheadern]`,
    }],
  });

  const text = msg.content[0].type === 'text' ? msg.content[0].text : '';
  const subjectMatch = text.match(/ÄMNESRAD:\s*(.+)/);
  const previewMatch = text.match(/PREHEADER:\s*(.+)/);

  return {
    subject: subjectMatch?.[1]?.trim() ?? `🚀 EXTRA: ${title}`,
    preview: previewMatch?.[1]?.trim() ?? ingress.slice(0, 80),
  };
}

export interface ExtraBrevResult {
  campaignId: string;
  editUrl: string;
  subject: string;
  articleTitle: string;
  imageCaption: string;
}

export async function createExtraBrev(titleFragment: string): Promise<ExtraBrevResult> {
  // 1. Sök artikel i Sanity
  const results = await searchArticles(titleFragment, 5);
  if (!results.length) {
    throw new Error(`Ingen artikel hittades för "${titleFragment}"`);
  }

  const article = results[0];
  console.log('[extra-brev] Artikel hittad:', {
    title: article.title,
    imageCaption: article.imageCaption,
    mainImageUrl: article.mainImageUrl?.slice(0, 60),
  });

  if (!article.url) {
    throw new Error('Artikel saknar URL');
  }

  // 2. Generera ämnesrad och preheader
  const { subject, preview } = await generateExtraSubject(article.title, article.ingress ?? '');

  // 3. Bygg HTML
  const html = generateExtraHtml(
    {
      title: article.title,
      ingress: article.ingress ?? '',
      url: article.url,
      imageUrl: article.mainImageUrl ?? '',
      imageCaption: article.imageCaption ?? '',
    },
    subject,
    preview
  );

  const minHtml = html.replace(/\s+/g, ' ').replace(/>\s+</g, '><').trim();

  // 4. Skapa Mailchimp-kampanj
  const dateStr = new Date().toLocaleDateString('sv-SE', { day: 'numeric', month: 'long', year: 'numeric' });
  const campaign = await mcFetch('/campaigns', {
    method: 'POST',
    body: JSON.stringify({
      type: 'regular',
      recipients: { list_id: MC_LIST },
      settings: {
        subject_line: subject,
        preview_text: preview,
        title: `EXTRA ${dateStr}`,
        from_name: 'Impact Loop',
        reply_to: 'info@loop.se',
        auto_footer: false,
      },
    }),
  }) as { id: string; web_id: number };

  // 5. Lägg in HTML
  await mcFetch(`/campaigns/${campaign.id}/content`, {
    method: 'PUT',
    body: JSON.stringify({ html: minHtml }),
  });

  const editUrl = `https://${MC_SERVER}.admin.mailchimp.com/campaigns/edit?id=${campaign.web_id}`;

  return {
    campaignId: campaign.id,
    editUrl,
    subject,
    articleTitle: article.title,
    imageCaption: article.imageCaption ?? '',
  };
}

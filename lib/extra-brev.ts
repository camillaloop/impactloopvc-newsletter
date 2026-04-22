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
    ? `\nHere are the ${examples.length} best-performing subject lines from Impact Loop's history (open rate | subject line):\n${examples.join('\n')}\n\nStudy the patterns: emoji at the start, concrete figures, tension-filled quotes, named companies/individuals, contrast/conflict, max ~65 characters.\n`
    : '';

  const msg = await client.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 150,
    messages: [{
      role: 'user',
      content: `You write a subject line and a preheader for an extra newsletter from Impact Loop VC.
${examplesBlock}
Article:
Headline: ${title}
Summary: ${ingress}

The subject line should come DIRECTLY from the article headline – pick out the most compelling phrase or quote from the headline and add an emoji in front. Shorten and sharpen as needed, but stay true to the headline's words and feel.

Examples:
- Headline: "Exclusive: Former Eurazeo CEO targets over €500m for European climate fund"
  → Subject line: 💰 "Former Eurazeo CEO targets €500m+ climate fund"
- Headline: "Patient capital for impact: 26 foundations actively investing in VCs"
  → Subject line: 🌱 26 foundations backing impact VCs

Rules:
1. Subject line: start with emoji, max 60 characters, take phrase/quote directly from the headline
2. Preheader: acts as a subheading – take a DIFFERENT angle from the summary/headline, add new information. Max 80 characters, no emoji.

Reply ONLY in this format, without explanation:
SUBJECT: [subject line]
PREHEADER: [preheader]`,
    }],
  });

  const text = msg.content[0].type === 'text' ? msg.content[0].text : '';
  const subjectMatch = text.match(/SUBJECT:\s*(.+)/);
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
    throw new Error(`No article found for "${titleFragment}"`);
  }

  const article = results[0];
  console.log('[extra-brev] Artikel hittad:', {
    title: article.title,
    imageCaption: article.imageCaption,
    mainImageUrl: article.mainImageUrl?.slice(0, 60),
  });

  if (!article.url) {
    throw new Error('Article has no URL');
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
  const dateStr = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const campaign = await mcFetch('/campaigns', {
    method: 'POST',
    body: JSON.stringify({
      type: 'regular',
      recipients: { list_id: MC_LIST },
      settings: {
        subject_line: subject,
        preview_text: preview,
        title: `EXTRA ${dateStr}`,
        from_name: 'Impact Loop VC',
        reply_to: 'info@impactloop.com',
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

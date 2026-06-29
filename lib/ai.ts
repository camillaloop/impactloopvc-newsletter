// lib/ai.ts
// Claude-funktioner: intro, ämnesrader, Impact-svepet

import Anthropic from '@anthropic-ai/sdk';
import type { SanityArticle } from './sanity';
import type { NewsFeedItem } from './news-feed';

// Lazy-init så att env-variabeln hinner laddas innan klienten skapas
function getClient() {
  // Variabelnamnet är IL_ANTHROPIC_KEY för att undvika kollision med systemets ANTHROPIC_API_KEY
  return new Anthropic({ apiKey: process.env.IL_ANTHROPIC_KEY });
}

// ─── Typerna ──────────────────────────────────────────────────────────────────

export interface SvepetItem {
  emoji: string;
  boldTitle: string;
  body: string;
  link?: string;   // Länk till källartikeln
  source?: string; // Källnamn, t.ex. "Green Queen"
}

export interface SvepetResult {
  headline: string; // tex "Klimatpolitikens vägval"
  items: SvepetItem[];
}

// ─── Intro ────────────────────────────────────────────────────────────────────

/** Fetches the 10 most recent intro examples from Supabase */
async function fetchEditorExamples(_editorName: string): Promise<string[]> {
  try {
    const { supabase } = await import('./supabase');
    const { data } = await supabase
      .from('vc_intro_examples')
      .select('intro_text')
      .order('send_time', { ascending: false })
      .limit(10);
    return (data ?? []).map((r: { intro_text: string }) => r.intro_text);
  } catch {
    return [];
  }
}

/**
 * Genererar en kort redaktörsinledning (2–4 meningar) baserad på dagens artiklar.
 * Skrivs i jag-form från redaktörens perspektiv.
 * Använder de 10 senaste verkliga introna från Supabase som few-shot-träning.
 */
export async function generateIntro(
  articles: SanityArticle[],
  editorName: string
): Promise<string> {
  const articleSummary = articles
    .map((a, i) => `${i + 1}. ${a.title}: ${a.ingress}`)
    .join('\n');

  const examples = await fetchEditorExamples(editorName);
  const examplesBlock =
    examples.length > 0
      ? `\nHere are ${examples.length} real introductions that ${editorName} has previously written (most recent first):\n${examples.map((e, i) => `${i + 1}. "${e}"`).join('\n')}\n\nStudy the tone, length, sentence structure and how ${editorName.split(' ')[0]} typically opens. Match the style exactly.\n`
      : '';

  const msg = await getClient().messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 300,
    messages: [
      {
        role: 'user',
        content: `You are ${editorName} and you are writing a short introduction for Impact Loop VC's daily newsletter on impact investing and sustainable business.
${examplesBlock}
Today's articles in the newsletter:
${articleSummary}

Write an introduction of 2–4 sentences in the first person. Warm, personal and journalistic tone. No hashtags, no lists. Mention 1–2 of the articles without quoting their titles directly. Do NOT end with "Happy reading" or similar – the editor adds that themselves. Do NOT use en-dashes (–) in the text – they do not suit this style. You may use ONE single emoji at the very start (e.g. ☕) – never more than one emoji total in the whole intro. Reply ONLY with the introduction, no explanation.`,
      },
    ],
  });

  const text = msg.content[0];
  if (text.type !== 'text') throw new Error('Unexpected response from Claude');
  // Remove consecutive duplicate emojis (e.g. ☕☕ → ☕)
  const cleaned = text.text.trim().replace(/([\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}])\1+/gu, '$1');
  return cleaned;
}

// ─── Ämnesrader ───────────────────────────────────────────────────────────────

/** Hämtar top-20 ämnesrads-exempel från Supabase (lazy import för att undvika cirkulär dep) */
export async function fetchSubjectExamples(): Promise<string[]> {
  try {
    const { supabase } = await import('./supabase');
    const { data } = await supabase
      .from('vc_subject_line_examples')
      .select('subject_line, open_rate')
      .order('open_rate', { ascending: false })
      .limit(20);
    return (data ?? []).map(
      (r: { subject_line: string; open_rate: number }) =>
        `${r.open_rate}% | ${r.subject_line}`
    );
  } catch {
    return [];
  }
}

/**
 * Kortar ned artikelrubriker till superkorta innehållsförteckningsetiketter (4–6 ord).
 * Returnerar en array i samma ordning som inmatningen.
 */
export async function generateTocLabels(
  articles: Array<{ title: string; ingress?: string }>
): Promise<string[]> {
  const list = articles
    .map((a, i) => `${i + 1}. RUBRIK: ${a.title}${a.ingress ? `\n   INGRESS: ${a.ingress}` : ''}`)
    .join('\n');

  const msg = await getClient().messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 200,
    messages: [
      {
        role: 'user',
        content: `Write very short table of contents labels for these articles. Maximum 6 words per line.

RULES:
- Capture the essence in 4–6 words, like a sharp teaser
- NO prefixes such as "OVERVIEW:", "INTERVIEW:", "BREAKING:" – they take up space and should not be used
- No bullet points, no quotes, no emojis
- Write in English

EXAMPLES of correct format:
Who raised the most capital
How AI cut Voi's costs
CuspAI targets unicorn status
Building the business with AI

ARTICLES:
${list}

Reply ONLY with one label per line, in the same order, without numbering.`,
      },
    ],
  });

  const text = msg.content[0];
  if (text.type !== 'text') return articles.map((a) => a.title);

  const lines = text.text
    .trim()
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  // Fyll på med original om något saknas
  return articles.map((a, i) => lines[i] ?? a.title);
}

/**
 * Bygger preheader-texten: "Och: [ämnesrad 2 utan emoji]"
 * Syns i inkorgen under ämnesraden och kompletterar den.
 */
export function buildPreheader(subjectOptions: [string, string, string]): string {
  const second = subjectOptions[1] ?? subjectOptions[0];
  // Ta bort ledande emoji (unicode emoji-tecken + eventuellt mellanslag)
  const withoutEmoji = second.replace(/^[\p{Emoji}\uFE0F\u200D\s]+/u, '').trim();
  return `Also: ${withoutEmoji}`;
}

/**
 * Genererar 3 alternativa ämnesrader för dagens nyhetsbrev.
 * Använder top-20 historiska exempel från Supabase som few-shot-träning.
 */
export async function generateSubjectLines(
  articles: SanityArticle[]
): Promise<[string, string, string]> {
  const articleSummary = articles
    .map((a, i) => `${i + 1}. ${a.title}: ${a.ingress}`)
    .join('\n');

  const examples = await fetchSubjectExamples();
  const examplesBlock =
    examples.length > 0
      ? `\nHere are the 20 best-performing subject lines from Impact Loop's history (open rate | subject line):\n${examples.join('\n')}\n\nStudy the patterns: emoji at the start, concrete figures, tension-filled quotes, named companies/individuals, contrast/conflict, max ~65 characters.\n`
      : '';

  const msg = await getClient().messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 400,
    messages: [
      {
        role: 'user',
        content: `You write subject lines for Impact Loop VC's daily newsletter on impact investing and sustainable business.
${examplesBlock}
Today's articles:
${articleSummary}

Generate exactly 3 subject lines in Impact Loop VC's style — one subject line per article, in the same order as the articles above. Rules:
- Subject line 1 is based on article 1, subject line 2 on article 2, subject line 3 on article 3
- Start each with a relevant emoji
- Maximum 65 characters per line
- Concrete and curiosity-inducing
- FORBIDDEN: invented phrases, words or expressions not found in the article it is based on
- In English, name companies/individuals where relevant
- Use ONLY information that actually appears in each article's text

Reply ONLY with the 3 subject lines, one per line, without numbering or explanation.`,
      },
    ],
  });

  const text = msg.content[0];
  if (text.type !== 'text') throw new Error('Unexpected response from Claude');

  const lines = text.text
    .trim()
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length < 3) {
    // Pad with copies if needed
    while (lines.length < 3) lines.push(lines[0] ?? 'Impact Loop VC today');
  }

  return [lines[0], lines[1], lines[2]];
}

// ─── Impact-svepet ────────────────────────────────────────────────────────────

interface SvepetExample {
  headline: string;
  items: Array<{ emoji: string; boldTitle: string; body: string }>;
}

/** Hämtar de 20 senaste svepet-exemplen från Supabase */
async function fetchSvepetExamples(): Promise<SvepetExample[]> {
  try {
    const { supabase } = await import('./supabase');
    const { data } = await supabase
      .from('svepet_examples')
      .select('headline, items')
      .order('send_time', { ascending: false })
      .limit(20);
    return (data ?? []) as SvepetExample[];
  } catch {
    return [];
  }
}

/**
 * Genererar Impact-svepet från nyhetsflödet.
 * Tar emot färdiga nyhetsobjekt, väljer de 3 bästa enligt Impact Loops
 * redaktionella kriterier och formaterar dem i rätt stil.
 * Använder 20 historiska svepet-exempel som few-shot-kontext.
 */
export async function generateImpactSvepet(
  newsItems: NewsFeedItem[],
  mustInclude: string[] = []
): Promise<SvepetResult> {
  const examples = await fetchSvepetExamples();

  const examplesBlock =
    examples.length > 0
      ? `\nHere are ${examples.length} real Bits and Pieces examples from previous newsletters. Study the format, length and tone exactly:\n\n${examples
          .map(
            (e, i) =>
              `EXAMPLE ${i + 1} – "${e.headline}":\n${e.items
                .map((it) => `• ${it.emoji} **${it.boldTitle}** – ${it.body}`)
                .join('\n')}`
          )
          .join('\n\n')}\n`
      : '';

  // Begränsa till 60 nyheter för att hålla prompten rimlig
  const candidates = newsItems.slice(0, 60);
  const newsBlock =
    candidates.length > 0
      ? candidates
          .map(
            (n, i) =>
              `${i + 1}. [${n.source}] ${n.title}${n.description ? ' – ' + n.description : ''}\n   Länk: ${n.link}`
          )
          .join('\n')
      : '(No news available)';

  const mustIncludeBlock = mustInclude.length > 0
    ? `\nMANDATORY: The editor has specified that the roundup MUST include a news item about: ${mustInclude.map(h => `"${h}"`).join(', ')}. Find the best-matching news item(s) in the list below and include them. You may choose the remaining items freely.\n`
    : '';

  const msg = await getClient().messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 700,
    messages: [
      {
        role: 'user',
        content: `You write "Bits and Pieces" for Impact Loop VC's daily newsletter – three short impact and sustainability news items.
${mustIncludeBlock}

Impact Loop VC is aimed at European impact startups, entrepreneurs and investors. They want to know what is happening in their sector and beyond – not general sustainability awareness.

PRIORITISE (in order):
1. Reports/studies with figures and business relevance for European impact investors
2. Well-known international companies with relevant sector news
3. EU/policy with direct consequences for European companies and investors

EXCLUDE: funding rounds, venture capital raises, investments or financing news of any kind (these go in the separate "Investor funding brief" section). Also exclude: general politics without an impact/sustainability angle, large listed companies without a sustainability angle, natural disasters without market relevance, lifestyle advice. ALSO EXCLUDE: press releases that are merely certification announcements, labelling notices or similar without a concrete business story (new product, new service, new partnership, new study with figures).

International news is only relevant if it concerns a specific well-known company, a report with concrete figures, or a trend that directly affects European investors/startups.

Write plainly and directly – always with the impact entrepreneur or investor as the intended reader.
Spell out abbreviations that are not widely known.
${examplesBlock}
Choose the 3 best news items and write them in Impact Loop VC's Bits and Pieces style. ALWAYS include the source's link and name in the JSON response.

ABSOLUTE REQUIREMENT – DIVERSITY: The three items MUST cover three different companies/organisations/topics. It is forbidden to include two news items about the same person, company or topic – even if there are multiple articles about them in the list. In that case, choose the best one and find a different topic for the remaining slots.

AVAILABLE NEWS (number, source, headline, description, link):
${newsBlock}

Rules for the format:
- Headline: 3–5 words specific to today's theme (never "Impact today")
- Emoji: matches the topic exactly
- Bold headline: max 7 words, concrete and news-driven
- Body text: MAXIMUM ONE sentence, approx. 15–20 words. The core of the news item + source name as a hyperlink. Nothing more. Example: "Snack giant Mondelēz has created the world's first chocolate made with cell-based cocoa butter, reports <a href="https://greenqueen.com/article">Green Queen</a>." The source name in the body MUST be wrapped in an <a href="[article url]"> tag linking to the article. NOT two sentences, NOT background, NOT explanations.
- link: exact URL from the news list
- source: EXACTLY the same text as you write in the body (e.g. if you write "reports Bloomberg" → source: "Bloomberg", if you write "writes Green Queen" → source: "Green Queen", if you write "according to the FT" → source: "FT")
- Mix where possible: one company/startup + one report + one EU/sector news item

Reply ONLY in this JSON format:
{
  "headline": "...",
  "items": [
    {"emoji": "...", "boldTitle": "...", "body": "...", "link": "https://...", "source": "..."},
    {"emoji": "...", "boldTitle": "...", "body": "...", "link": "https://...", "source": "..."},
    {"emoji": "...", "boldTitle": "...", "body": "...", "link": "https://...", "source": "..."}
  ]
}`,
      },
    ],
  });

  const text = msg.content[0];
  if (text.type !== 'text') throw new Error('Unexpected response from Claude');

  const jsonMatch = text.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('No JSON in response');

  try {
    const result = JSON.parse(jsonMatch[0]) as SvepetResult;
    if (!result.headline || !Array.isArray(result.items) || result.items.length < 3) {
      throw new Error('Invalid roundup format');
    }
    return result;
  } catch {
    return {
      headline: 'Impact today',
      items: [
        { emoji: '🌿', boldTitle: candidates[0]?.title ?? 'Nyhet 1', body: candidates[0]?.description ?? '' },
        { emoji: '⚡', boldTitle: candidates[1]?.title ?? 'Nyhet 2', body: candidates[1]?.description ?? '' },
        { emoji: '💰', boldTitle: candidates[2]?.title ?? 'Nyhet 3', body: candidates[2]?.description ?? '' },
      ],
    };
  }
}

// ─── HTML-builder för svepet ──────────────────────────────────────────────────

/**
 * Bygger impactsvepet_placeholder HTML (exakt GAS-format).
 */
export function buildSvepetHtml(svepet: SvepetResult): string {
  const { headline, items } = svepet;
  const item1 = items[0] ?? { emoji: '', boldTitle: '', body: '' };
  const item2 = items[1] ?? { emoji: '', boldTitle: '', body: '' };
  const item3 = items[2] ?? { emoji: '', boldTitle: '', body: '' };

  function renderItem(item: SvepetItem, isLast: boolean): string {
    let body = item.body;
    // Länka källnamnet där det förekommer i brödtexten (t.ex. "skriver Green Queen" → "skriver <a>Green Queen</a>")
    if (item.link && item.source) {
      const escaped = item.source.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      body = body.replace(
        new RegExp(escaped),
        `<a href="${item.link}" target="_blank" style="color:#557755;">${item.source}</a>`
      );
    }
    const pClass = isLast ? ' class="last-child"' : '';
    return `<p${pClass}><strong>${item.emoji} ${item.boldTitle}.</strong> ${body}</p>`;
  }

  // Manual headline override wins; falls back to item 1's boldTitle
  const displayHeadline = headline || item1.boldTitle;

  return `<tr><td style="padding-top:0;padding-bottom:0;padding-right:0;padding-left:0" valign="top"><table width="100%" style="border:0;border-radius:0;border-collapse:separate"><tbody><tr><td style="padding-left:24px;padding-right:24px;padding-top:12px;padding-bottom:12px" class="mceTextBlockContainer"><div data-block-id="727" class="mceText" id="dataBlockId-727" style="width:100%"><p class="last-child"><span style="color:#d0c4de;">BITS AND PIECES</span></p></div></td></tr></tbody></table></td></tr><tr><td style="padding-top:0;padding-bottom:0;padding-right:0;padding-left:0" valign="top"><table width="100%" style="border:0;border-radius:0;border-collapse:separate"><tbody><tr><td style="padding-left:24px;padding-right:24px;padding-top:0;padding-bottom:12px" class="mceTextBlockContainer"><div data-block-id="801" class="mceText" id="dataBlockId-801" style="width:100%"><h1 class="last-child">${displayHeadline} \u2013 3 things to keep you in the loop today</h1></div></td></tr></tbody></table></td></tr><tr><td style="padding-top:0;padding-bottom:0;padding-right:0;padding-left:0" valign="top"><table width="100%" style="border:0;border-radius:0;border-collapse:separate"><tbody><tr><td style="padding-left:24px;padding-right:24px;padding-top:12px;padding-bottom:12px" class="mceTextBlockContainer"><div data-block-id="721" class="mceText" id="dataBlockId-721" style="width:100%">${renderItem(item1, false)}<p><br></p>${renderItem(item2, false)}<p><br></p>${renderItem(item3, true)}</div></td></tr></tbody></table></td></tr><tr><td style="background-color:transparent;padding-top:20px;padding-bottom:20px;padding-right:24px;padding-left:24px" class="mceBlockContainer" valign="top"><table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:transparent;width:100%" role="presentation" class="mceDividerContainer" data-block-id="709"> <tbody><tr><td style="min-width:100%;border-top-width:1px;border-top-style:solid;border-top-color:#e5e6d2" class="mceDividerBlock" valign="top"></td></tr></tbody></table></td></tr>`;
}

// ─── HTML-builder för funding rounds ─────────────────────────────────────────

/**
 * Bygger fundingrounds_placeholder HTML.
 * isBetalande = true → visar texten; false → visar "bli medlem"-bild
 */
export function buildFundingHtml(
  fundingText: string,
  isBetalande: boolean
): string {
  // fundingText is already the full responsive table HTML built by lib/funding.ts
  if (isBetalande && fundingText) {
    return fundingText;
  }
  // Free segment: show subscribe upsell image
  return '<tr><td style="padding-top:0;padding-bottom:0;padding-right:0;padding-left:0" valign="top"><table width="100%" style="border:0;border-radius:0;border-collapse:separate"><tbody><tr><td style="padding-left:24px;padding-right:24px;padding-top:12px;padding-bottom:12px" class="mceTextBlockContainer"><div data-block-id="668" class="mceText" id="dataBlockId-668" style="width:100%"><a href="https://www.impactloop.com/subscribe?utm_source=newsletter&utm_medium=banner&utm_campaign=funding+rounds" target="_blank" style="display:inline-block"><img src="https://mcusercontent.com/46f8b3dcdd581118cad2f80ee/images/7d7bd621-160d-7a58-3f2f-51aca95769a3.jpg" alt="Subscribe" style="max-width:100%; height:auto; border:0; display:block;"></a></div></td></tr></tbody></table></td></tr>';
}

// ─── HTML-builder för möten ───────────────────────────────────────────────────

/**
 * Bygger meetups_placeholder HTML (exakt GAS-format: <p><strong>titel</strong></p><p>info</p>).
 */
export function buildMeetupsHtml(
  meetups: Array<{ title: string; info: string }>
): string {
  if (!meetups.length) return '';
  const parts = meetups.map(
    (m, i) =>
      `<p><strong>${m.title}</strong></p><p${i === meetups.length - 1 ? ' class="last-child"' : ''}>${m.info}</p>${i < meetups.length - 1 ? '<p><br /></p>' : ''}`
  );
  return parts.join('');
}

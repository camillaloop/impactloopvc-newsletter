// lib/funding.ts
// Fetches funding round articles from the Impact Loop VC app and uses Claude AI
// to extract structured data (Company, What they do, Niche, Funding, Investors, Location).
// Returns a responsive HTML table matching the "Investor funding brief" design.

import Anthropic from '@anthropic-ai/sdk';

const VC_APP_URL = 'https://impactloopvc-news.vercel.app/api/funding-rounds';

export interface FundingRow {
  company: string;
  whatTheyDo: string;
  niche: string;
  funding: string;
  investors: string;
  location: string; // flag emoji, e.g. 🇸🇪
}

// ─── Fetch ────────────────────────────────────────────────────────────────────

export async function fetchFundingRounds(): Promise<FundingRow[]> {
  console.log('[funding] Fetching from VC app...');

  const res = await fetch(VC_APP_URL, { next: { revalidate: 0 } });
  if (!res.ok) throw new Error(`VC app API error: ${res.status}`);

  const data = await res.json();
  const articles: Array<{ title: string; description: string; date: string }> =
    data.articles ?? data ?? [];

  // Try last 2 days first, fallback to 3 days
  let cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 2);
  let recent = articles.filter((a) => new Date(a.date) >= cutoff);

  if (!recent.length) {
    cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 3);
    recent = articles.filter((a) => new Date(a.date) >= cutoff);
    console.log(`[funding] No articles in last 2 days, trying 3 days: ${recent.length} found`);
  } else {
    console.log(`[funding] ${recent.length} articles from last 2 days`);
  }

  if (!recent.length) return [];

  // Sort newest first
  recent.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Use Claude to extract structured data (impact/sustainability only)
  return extractFundingRows(recent);
}

// ─── AI extraction ────────────────────────────────────────────────────────────

async function extractFundingRows(
  articles: Array<{ title: string; description: string }>
): Promise<FundingRow[]> {
  const client = new Anthropic({ apiKey: process.env.IL_ANTHROPIC_KEY });

  const articleText = articles
    .map((a, i) => `${i + 1}. Title: ${a.title}\n   Description: ${a.description}`)
    .join('\n\n');

  const prompt = `You are extracting structured data from funding round news articles for an impact investing newsletter.

STRICT INCLUSION CRITERIA — only include an article if ALL of these are true:
1. It is clearly about a specific company raising a funding round (seed, Series A/B/C, grant, etc.)
2. The company operates in an impact, sustainability or climate-related sector. This includes:
   - Climate tech, clean energy, green energy, renewables, hydrogen
   - Sustainable mobility, electric vehicles, public transport
   - Circular economy, waste reduction, recycling
   - Agritech, foodtech, alternative proteins, sustainable food
   - Nature, biodiversity, ocean, conservation tech
   - Industrial sustainability, green manufacturing, emissions reduction
   - Impact investing, ESG, social impact
   - Biotech with sustainability or health equity angle

SKIP any article that is:
- About a company with no sustainability angle (pure SaaS, fintech, gaming, ads, etc.)
- An opinion piece, market report, or not about a specific funding round
- A press release without clear company + amount

For each qualifying article, extract:
- company: The name of the company that received funding
- whatTheyDo: A very short description of what the company does (max 6 words, plain English)
- niche: One of: Agritech, Foodtech, Clean Energy, Cleantech, Mobility, Circular Economy, Climate, Nature, Biotech, Industrial
- funding: The funding amount (e.g. €15m, $2M, £10m). If not mentioned, write "N/A"
- investors: Names of lead investors. If not mentioned, write "N/A"
- location: Country flag emoji (e.g. 🇸🇪 🇬🇧 🇩🇪 🇫🇷 🇳🇱 🇫🇮 🇩🇰 🇳🇴 🇺🇸 🇪🇸 🇮🇹 🇧🇪 🇦🇹 🇨🇭). If unknown, use 🌍

Return ONLY a JSON array with no other text. If no articles qualify, return [].

Example:
[
  {
    "company": "Nox Mobility",
    "whatTheyDo": "Private sleeper cabins for night trains",
    "niche": "Mobility",
    "funding": "€2M",
    "investors": "IBB Ventures",
    "location": "🇩🇪"
  }
]

Articles:
${articleText}`;

  const message = await client.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 2000,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = message.content[0].type === 'text' ? message.content[0].text : '';

  try {
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return [];
    const rows: FundingRow[] = JSON.parse(jsonMatch[0]);
    console.log(`[funding] Extracted ${rows.length} structured funding rows`);
    return rows;
  } catch (e) {
    console.error('[funding] Failed to parse Claude response:', e);
    return [];
  }
}

// ─── HTML builder ─────────────────────────────────────────────────────────────

/**
 * Builds the full "Investor funding brief" responsive HTML section.
 * Ported from the GAS buildFundingRoundsSection_ function.
 */
export function buildFundingTableHtml(rows: FundingRow[]): string {
  if (!rows.length) return '';

  const desktopRows = rows
    .map(
      (r) => `
      <tr>
        <td style="padding:10px;border-bottom:1px solid #E8E8E8;border-right:1px solid #E8E8E8;" valign="top">
          <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:12px;letter-spacing:0.4px;color:#000;font-weight:bold;">${r.company}</p>
        </td>
        <td style="padding:10px;border-bottom:1px solid #E8E8E8;border-right:1px solid #E8E8E8;" valign="top">
          <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:150%;color:#111;">${r.whatTheyDo}</p>
        </td>
        <td style="padding:10px;border-bottom:1px solid #E8E8E8;border-right:1px solid #E8E8E8;" valign="top">
          <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:150%;color:#111;">${r.niche}</p>
        </td>
        <td style="padding:10px;border-bottom:1px solid #E8E8E8;border-right:1px solid #E8E8E8;" valign="top">
          <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:150%;color:#111;">${r.funding}</p>
        </td>
        <td style="padding:10px;border-bottom:1px solid #E8E8E8;border-right:1px solid #E8E8E8;" valign="top">
          <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:150%;color:#111;">${r.investors}</p>
        </td>
        <td style="padding:10px;border-bottom:1px solid #E8E8E8;" valign="top">
          <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:14px;text-align:center;">${r.location}</p>
        </td>
      </tr>`
    )
    .join('');

  const mobileRows = rows
    .map(
      (r) => `
      <tr>
        <td style="padding:12px 14px;border-bottom:1px solid #E8E8E8;">
          <p style="margin:0 0 4px 0;font-family:Arial,Helvetica,sans-serif;font-size:13px;letter-spacing:0.4px;color:#000;font-weight:bold;">
            ${r.company} <span style="font-weight:normal;color:#555;"> · ${r.niche} · ${r.location}</span>
          </p>
          <p style="margin:0 0 6px 0;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:150%;color:#111;">${r.whatTheyDo}</p>
          <p style="margin:0 0 3px 0;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:150%;color:#111;"><strong>💰 Funding:</strong> ${r.funding}</p>
          <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:150%;color:#111;"><strong>🤝 Investors:</strong> ${r.investors}</p>
        </td>
      </tr>`
    )
    .join('');

  return `
  <tr>
    <td style="padding-top:0;padding-bottom:0;padding-right:0;padding-left:0" valign="top">
      <table width="100%" style="border:0;border-radius:0;border-collapse:separate">
        <tbody>
          <tr>
            <td style="padding-left:24px;padding-right:24px;padding-top:0;padding-bottom:6px" class="mceTextBlockContainer">
              <div class="mceText" style="width:100%">
                <p class="last-child"><span style="color:#e2baba;">€€€</span></p>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </td>
  </tr>
  <tr>
    <td style="padding-top:0;padding-bottom:0;padding-right:0;padding-left:0" valign="top">
      <table width="100%" style="border:0;border-radius:0;border-collapse:separate">
        <tbody>
          <tr>
            <td style="padding-left:24px;padding-right:24px;padding-top:0;padding-bottom:10px" class="mceTextBlockContainer">
              <div class="mceText" style="width:100%">
                <h1 class="last-child" style="font-family:Georgia,Times,'Times New Roman',serif;font-size:27px;font-weight:normal;">Investor funding brief</h1>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </td>
  </tr>
  <tr>
    <td style="padding:0 24px 18px 24px">

      <!-- DESKTOP table -->
      <table class="funding-desktop" width="100%" role="presentation"
             style="border-collapse:collapse;background:#FDFDFD;border:1px solid #e8e8e8;">
        <tbody>
          <tr style="background:#f7f7f7;">
            <td style="padding:10px;border-bottom:1px solid #E8E8E8;border-right:1px solid #E8E8E8;" valign="middle" width="17%">
              <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:12px;letter-spacing:0.4px;color:#000;font-weight:bold;">Company</p>
            </td>
            <td style="padding:10px;border-bottom:1px solid #E8E8E8;border-right:1px solid #E8E8E8;" valign="middle" width="23%">
              <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:12px;letter-spacing:0.4px;color:#000;font-weight:bold;">What they do</p>
            </td>
            <td style="padding:10px;border-bottom:1px solid #E8E8E8;border-right:1px solid #E8E8E8;" valign="middle" width="15%">
              <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:12px;letter-spacing:0.4px;color:#000;font-weight:bold;">🔍 Niche</p>
            </td>
            <td style="padding:10px;border-bottom:1px solid #E8E8E8;border-right:1px solid #E8E8E8;" valign="middle" width="13%">
              <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:12px;letter-spacing:0.4px;color:#000;font-weight:bold;">💰 Funding</p>
            </td>
            <td style="padding:10px;border-bottom:1px solid #E8E8E8;border-right:1px solid #E8E8E8;" valign="middle" width="22%">
              <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:12px;letter-spacing:0.4px;color:#000;font-weight:bold;">🤝 Investors</p>
            </td>
            <td style="padding:10px;border-bottom:1px solid #E8E8E8;" valign="middle" width="10%">
              <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:12px;letter-spacing:0.4px;color:#000;font-weight:bold;text-align:center;">📍</p>
            </td>
          </tr>
          ${desktopRows}
        </tbody>
      </table>

      <!-- MOBILE card layout -->
      <table class="funding-mobile" width="100%" role="presentation"
             style="display:none;border-collapse:separate;background:#FDFDFD;border:1px solid #e8e8e8;">
        <tbody>
          ${mobileRows}
        </tbody>
      </table>

    </td>
  </tr>
  <tr>
    <td style="padding-top:0;padding-bottom:0;padding-right:0;padding-left:0" valign="top">
      <table width="100%" style="border:0;border-radius:0;border-collapse:separate">
        <tbody>
          <tr>
            <td style="padding-left:24px;padding-right:24px;padding-top:0;padding-bottom:12px" class="mceTextBlockContainer">
              <div class="mceText" style="width:100%">
                <p class="last-child"><em>Got a tip? Email us at <a href="mailto:sion@loop.se">sion@loop.se</a>.</em></p>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </td>
  </tr>`;
}

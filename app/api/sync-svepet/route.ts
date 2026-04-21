// app/api/sync-svepet/route.ts
// POST → Hämtar 30 kampanj-HTML:ar, extraherar Impact-svepet och sparar som exempel.
// Kör manuellt 1 gång för att populera databasen.

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const MC_KEY = process.env.MAILCHIMP_API_KEY!;
const MC_SERVER = process.env.MAILCHIMP_SERVER!;
const BASE = `https://${MC_SERVER}.api.mailchimp.com/3.0`;
const AUTH = 'Basic ' + Buffer.from(`anystring:${MC_KEY}`).toString('base64');
const SEGMENT_BETALANDE = '2966632';

async function mcGet(path: string, params: Record<string, string | number> = {}) {
  const url = new URL(`${BASE}${path}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)));
  const res = await fetch(url.toString(), { headers: { Authorization: AUTH } });
  if (!res.ok) throw new Error(`Mailchimp ${path}: ${res.status}`);
  return res.json();
}

// ─── Parser ───────────────────────────────────────────────────────────────────

function stripHtml(s: string): string {
  return s
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

interface SvepetItem {
  emoji: string;
  boldTitle: string;
  body: string;
}

interface SvepetExample {
  headline: string;
  items: [SvepetItem, SvepetItem, SvepetItem];
}

function extractSvepet(html: string): SvepetExample | null {
  const idx = html.indexOf('IMPACT-SVEPET');
  if (idx === -1) return null;

  const section = html.slice(idx, idx + 6000);

  // Rubrik från h1
  const h1Match = section.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  if (!h1Match) return null;

  const headline = stripHtml(h1Match[1])
    .replace(/\s*[–\-]\s*tre saker att ha koll på idag.*/i, '')
    .trim();

  if (!headline) return null;

  // Items: <p>-taggar med <strong>emoji boldTitle </strong>body
  const pTags = [...section.matchAll(/<p(?:\s[^>]*)?>[\s\S]*?<\/p>/gi)];
  const items: SvepetItem[] = [];

  for (const p of pTags) {
    const pHtml = p[0];
    const strongMatch = pHtml.match(/<strong[^>]*>([\s\S]*?)<\/strong>([\s\S]*?)(?=<\/p>)/i);
    if (!strongMatch) continue;

    const strongText = stripHtml(strongMatch[1]).trim();
    const bodyText = stripHtml(strongMatch[2]).trim();

    if (!strongText || bodyText.length < 10) continue;

    // Emoji är vanligtvis 1-2 chars i början
    const emojiMatch = strongText.match(/^([\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}][^\w\s]*)\s*([\s\S]+)/u);
    let emoji = '🌿';
    let boldTitle = strongText;

    if (emojiMatch) {
      emoji = emojiMatch[1].trim();
      boldTitle = emojiMatch[2].trim();
    } else if (strongText.length < 4) {
      emoji = strongText.trim();
      boldTitle = bodyText.split('.')[0].trim();
    }

    // Rensa bort trailing punkt från boldTitle
    boldTitle = boldTitle.replace(/\.$/, '').trim();

    if (boldTitle && bodyText) {
      items.push({ emoji, boldTitle, body: bodyText });
    }

    if (items.length >= 3) break;
  }

  if (items.length < 3) return null;

  return {
    headline,
    items: [items[0], items[1], items[2]],
  };
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST() {
  try {
    console.log('[sync-svepet] Hämtar kampanjer...');

    const since = new Date();
    since.setFullYear(since.getFullYear() - 1);
    const sinceStr = since.toISOString().split('.')[0];

    // Hämta betalande kampanjer det senaste året
    const campaignIds: Array<{ id: string; send_time: string }> = [];
    let offset = 0;

    while (campaignIds.length < 40) {
      const data = await mcGet('/campaigns', {
        status: 'sent',
        count: 100,
        offset,
        sort_field: 'send_time',
        sort_dir: 'DESC',
        since_send_time: sinceStr,
      });

      const campaigns = data.campaigns ?? [];
      if (!campaigns.length) break;

      for (const c of campaigns) {
        const segId = String(c.recipients?.segment_opts?.saved_segment_id ?? '');
        if (segId === SEGMENT_BETALANDE) {
          campaignIds.push({ id: c.id, send_time: c.send_time ?? '' });
        }
      }

      if (campaigns.length < 100) break;
      offset += 100;
    }

    // Begränsa till 40 kampanjer (vi vill ha 20+ lyckade)
    const toFetch = campaignIds.slice(0, 40);
    console.log(`[sync-svepet] Hämtar HTML för ${toFetch.length} kampanjer...`);

    const results: Array<{
      campaign_id: string;
      headline: string;
      items: SvepetExample['items'];
      send_time: string;
    }> = [];

    for (const c of toFetch) {
      try {
        const content = await mcGet(`/campaigns/${c.id}/content`);
        const html = content.html ?? '';
        const extracted = extractSvepet(html);

        if (extracted) {
          results.push({
            campaign_id: c.id,
            headline: extracted.headline,
            items: extracted.items,
            send_time: c.send_time,
          });
        }

        await new Promise((r) => setTimeout(r, 120));
      } catch (e) {
        console.warn(`[sync-svepet] Misslyckades för ${c.id}:`, e);
      }
    }

    console.log(`[sync-svepet] Extraherade ${results.length} svepet`);

    if (results.length > 0) {
      const { error } = await supabase
        .from('svepet_examples')
        .upsert(results, { onConflict: 'campaign_id' });

      if (error) throw new Error(`Supabase: ${error.message}`);
    }

    return NextResponse.json({
      success: true,
      synced: results.length,
      skipped: toFetch.length - results.length,
      sample: results[0] ?? null,
    });
  } catch (err) {
    console.error('[sync-svepet] Fel:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

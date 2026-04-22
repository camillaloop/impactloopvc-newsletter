// app/api/sync-intros/route.ts
// POST → Fetches intro texts from sent campaigns (Impact Loop Europe, paid segment)
//        and saves them in Supabase vc_intro_examples.
//        Run manually ~once a month to keep examples fresh.

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const MC_KEY    = process.env.MAILCHIMP_API_KEY!;
const MC_SERVER = process.env.MAILCHIMP_SERVER!;
const BASE      = `https://${MC_SERVER}.api.mailchimp.com/3.0`;
const AUTH      = 'Basic ' + Buffer.from(`anystring:${MC_KEY}`).toString('base64');

const MC_LIST_ID   = 'b46477bf08';
const SEGMENT_PAID = 3452658;

async function mcGet(path: string, params: Record<string, string | number> = {}) {
  const url = new URL(`${BASE}${path}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)));
  const res = await fetch(url.toString(), { headers: { Authorization: AUTH } });
  if (!res.ok) throw new Error(`Mailchimp ${path}: ${res.status}`);
  return res.json();
}

// ─── Intro extraction from plain text ─────────────────────────────────────────

function extractIntro(plainText: string): string | null {
  const text = plainText.replace(/\r\n/g, '\n').trim();

  // Find start: "Good morning" line
  const startMatch = text.match(/Good morning[^\n]*/i);
  if (!startMatch) return null;

  const introStart = startMatch.index!;

  // Find end: "In today's newsletter" — handle straight and curly apostrophes
  const endMatch = text.slice(introStart).match(/In today[\u2019's]s newsletter/i);
  if (!endMatch) return null;

  let intro = text.slice(introStart, introStart + endMatch.index!).trim();

  // Remove bare URLs and tidy whitespace
  intro = intro.replace(/https?:\/\/\S+/g, '').replace(/[ \t]+/g, ' ').trim();

  return intro.length > 50 ? intro : null;
}

// ─── Route handler ─────────────────────────────────────────────────────────────

export async function POST() {
  try {
    console.log('[sync-intros] Fetching campaigns from Mailchimp (Impact Loop Europe, paid)...');

    // 6 months back
    const since = new Date();
    since.setMonth(since.getMonth() - 6);
    const sinceStr = since.toISOString().split('.')[0];

    // Collect all paid campaigns
    const allCampaigns: Array<{ id: string; subject: string; send_time: string }> = [];
    let offset = 0;

    while (true) {
      const data = await mcGet('/campaigns', {
        status:           'sent',
        count:            200,
        offset,
        sort_field:       'send_time',
        sort_dir:         'DESC',
        since_send_time:  sinceStr,
        list_id:          MC_LIST_ID,
      });

      const campaigns = data.campaigns ?? [];
      if (!campaigns.length) break;

      for (const c of campaigns) {
        const segId = c.recipients?.segment_opts?.saved_segment_id;
        if (segId === SEGMENT_PAID) {
          allCampaigns.push({
            id:        c.id,
            subject:   c.settings?.subject_line ?? '',
            send_time: c.send_time ?? '',
          });
        }
      }

      if (campaigns.length < 200) break;
      offset += 200;
    }

    console.log(`[sync-intros] Found ${allCampaigns.length} paid campaigns`);

    // Fetch plain text content and extract intro for each campaign
    const results: Array<{
      campaign_id:  string;
      subject_line: string;
      intro_text:   string;
      send_time:    string;
    }> = [];

    let skipped = 0;

    for (const c of allCampaigns) {
      try {
        const content   = await mcGet(`/campaigns/${c.id}/content`);
        const plainText = content.plain_text ?? '';
        const intro     = extractIntro(plainText);

        if (intro) {
          results.push({
            campaign_id:  c.id,
            subject_line: c.subject,
            intro_text:   intro,
            send_time:    c.send_time,
          });
        } else {
          skipped++;
        }

        // Rate limit
        await new Promise((r) => setTimeout(r, 120));
      } catch (e) {
        console.warn(`[sync-intros] Failed for campaign ${c.id}:`, e);
        skipped++;
      }
    }

    console.log(`[sync-intros] Extracted ${results.length} intros (skipped ${skipped})`);

    if (results.length === 0) {
      return NextResponse.json({ success: true, synced: 0, skipped });
    }

    // Upsert into vc_intro_examples
    const { error } = await supabase
      .from('vc_intro_examples')
      .upsert(results, { onConflict: 'campaign_id' });

    if (error) throw new Error(`Supabase upsert: ${error.message}`);

    console.log(`[sync-intros] Saved ${results.length} intros`);

    return NextResponse.json({
      success: true,
      synced:  results.length,
      skipped,
    });
  } catch (err) {
    console.error('[sync-intros] Error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

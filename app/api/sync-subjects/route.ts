// app/api/sync-subjects/route.ts
// POST → Fetches top subject lines from Mailchimp (Impact Loop Europe, paid segment)
//        and saves them in Supabase. Run manually ~once a month.

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const MC_KEY    = process.env.MAILCHIMP_API_KEY!;
const MC_SERVER = process.env.MAILCHIMP_SERVER!;
const BASE      = `https://${MC_SERVER}.api.mailchimp.com/3.0`;
const AUTH      = 'Basic ' + Buffer.from(`anystring:${MC_KEY}`).toString('base64');

// Impact Loop Europe list + paid subscriber segment
const MC_LIST_ID         = 'b46477bf08';
const SEGMENT_PAID       = 3452658;

async function mcGet(path: string, params: Record<string, string | number> = {}) {
  const url = new URL(`${BASE}${path}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)));
  const res = await fetch(url.toString(), { headers: { Authorization: AUTH } });
  if (!res.ok) throw new Error(`Mailchimp ${path}: ${res.status}`);
  return res.json();
}

export async function POST() {
  try {
    console.log('[sync-subjects] Fetching campaigns from Mailchimp (Impact Loop Europe, paid)...');

    // 6 months back
    const since = new Date();
    since.setMonth(since.getMonth() - 6);
    const sinceStr = since.toISOString().split('.')[0];

    // Paginate all campaigns on the Europe list
    const rows: Array<{
      campaign_id: string;
      subject_line: string;
      send_time: string;
      emails_sent: number;
      open_rate: number;
      unique_opens: number;
    }> = [];

    const seen = new Set<string>();
    let offset = 0;

    while (true) {
      const data = await mcGet('/campaigns', {
        status: 'sent',
        count: 200,
        offset,
        sort_field: 'send_time',
        sort_dir: 'DESC',
        since_send_time: sinceStr,
        list_id: MC_LIST_ID,
      });

      const campaigns = data.campaigns ?? [];
      if (!campaigns.length) break;

      for (const c of campaigns) {
        const segId = c.recipients?.segment_opts?.saved_segment_id;
        if (segId !== SEGMENT_PAID) continue;

        const subject = (c.settings?.subject_line ?? '').trim();
        if (!subject || seen.has(subject)) continue;
        seen.add(subject);

        const r         = c.report_summary ?? {};
        const openRate  = Math.round((r.open_rate ?? 0) * 1000) / 10;
        const opens     = r.unique_opens ?? 0;
        const sent      = r.emails_sent ?? 0;

        rows.push({
          campaign_id:  c.id,
          subject_line: subject,
          send_time:    c.send_time ?? '',
          emails_sent:  sent,
          open_rate:    openRate,
          unique_opens: opens,
        });
      }

      if (campaigns.length < 200) break;
      offset += 200;
    }

    console.log(`[sync-subjects] Found ${rows.length} unique subject lines`);

    // Sort by open rate, keep top 100
    rows.sort((a, b) => b.open_rate - a.open_rate);
    const top100 = rows.slice(0, 100);

    // Upsert into vc_subject_line_examples
    const { error } = await supabase
      .from('vc_subject_line_examples')
      .upsert(top100, { onConflict: 'campaign_id' });

    if (error) throw new Error(`Supabase upsert: ${error.message}`);

    console.log(`[sync-subjects] Saved ${top100.length} subject lines`);

    return NextResponse.json({
      success:     true,
      synced:      top100.length,
      topSubject:  top100[0]?.subject_line,
      topOpenRate: top100[0]?.open_rate,
    });
  } catch (err) {
    console.error('[sync-subjects] Error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

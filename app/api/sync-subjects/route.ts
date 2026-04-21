// app/api/sync-subjects/route.ts
// POST → Hämtar top-100 ämnesrader från Mailchimp och sparar i Supabase.
// Kör manuellt ca 1 gång/månad för att hålla exemplen uppdaterade.

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
  const res = await fetch(url.toString(), {
    headers: { Authorization: AUTH },
  });
  if (!res.ok) throw new Error(`Mailchimp ${path}: ${res.status}`);
  return res.json();
}

export async function POST() {
  try {
    console.log('[sync-subjects] Hämtar kampanjer från Mailchimp...');

    // Datum ett år sedan
    const since = new Date();
    since.setFullYear(since.getFullYear() - 1);
    const sinceStr = since.toISOString().split('.')[0];

    // Hämta alla kampanjer för betalande-segmentet
    const allCampaigns: Array<{
      id: string;
      subject: string;
      send_time: string;
      emails_sent: number;
    }> = [];

    let offset = 0;
    while (true) {
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
        const segId = String(
          c.recipients?.segment_opts?.saved_segment_id ?? ''
        );
        if (segId === SEGMENT_BETALANDE) {
          allCampaigns.push({
            id: c.id,
            subject: c.settings?.subject_line ?? '',
            send_time: c.send_time ?? '',
            emails_sent: c.emails_sent ?? 0,
          });
        }
      }

      if (campaigns.length < 100) break;
      offset += 100;
    }

    console.log(`[sync-subjects] Hittade ${allCampaigns.length} kampanjer`);

    // Hämta öppningsfrekvens för varje kampanj
    const results: Array<{
      campaign_id: string;
      subject_line: string;
      send_time: string;
      emails_sent: number;
      open_rate: number;
      unique_opens: number;
    }> = [];

    for (const c of allCampaigns) {
      try {
        const report = await mcGet(`/reports/${c.id}`);
        const opens = report.opens?.unique_opens ?? 0;
        const sent = report.emails_sent ?? c.emails_sent;
        const openRate = sent > 0 ? Math.round((opens / sent) * 1000) / 10 : 0;

        results.push({
          campaign_id: c.id,
          subject_line: c.subject,
          send_time: c.send_time,
          emails_sent: sent,
          open_rate: openRate,
          unique_opens: opens,
        });

        // Rate limit
        await new Promise((r) => setTimeout(r, 100));
      } catch (e) {
        console.warn(`[sync-subjects] Rapport misslyckades för ${c.id}:`, e);
      }
    }

    // Sortera och ta top 100
    results.sort((a, b) => b.open_rate - a.open_rate);
    const top100 = results.slice(0, 100);

    // Spara i Supabase (upsert på campaign_id)
    const { error } = await supabase
      .from('subject_line_examples')
      .upsert(top100, { onConflict: 'campaign_id' });

    if (error) throw new Error(`Supabase upsert: ${error.message}`);

    console.log(`[sync-subjects] Sparade ${top100.length} ämnesrader`);

    return NextResponse.json({
      success: true,
      synced: top100.length,
      topSubject: top100[0]?.subject_line,
      topOpenRate: top100[0]?.open_rate,
    });
  } catch (err) {
    console.error('[sync-subjects] Fel:', err);
    return NextResponse.json(
      { error: String(err) },
      { status: 500 }
    );
  }
}

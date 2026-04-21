// app/api/sync-intros/route.ts
// POST → Hämtar det senaste årets kampanj-HTML från Mailchimp (betalande-segmentet),
// extraherar intro-text + redaktörens namn, sparar i Supabase editor_intro_examples.
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
  const res = await fetch(url.toString(), { headers: { Authorization: AUTH } });
  if (!res.ok) throw new Error(`Mailchimp ${path}: ${res.status}`);
  return res.json();
}

// ─── HTML-parsning ────────────────────────────────────────────────────────────

// Endast dessa fyra redaktörer ska extraheras — alla andra namn ignoreras
const KNOWN_EDITORS = ['Andreas Jennische', 'Jenny Kjellén', 'Johann Bernövall', 'Camilla Bergman'];

function stripHtml(html: string): string {
  return html
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

const BOILERPLATE = [
  /läs i din webbläsare/i,
  /view this email/i,
  /avprenumerera/i,
  /avregistrera/i,
  /unsubscribe/i,
  /privacy policy/i,
  /^©/,
  /impact loop ab/i,
  /se detta i/i,
  /du får detta/i,
  /skickat till/i,
];

function extractIntroAndEditor(
  html: string
): { intro: string; editorName: string } | null {
  // Hämta alla <p>-taggar och rensa HTML
  const pTags = [...html.matchAll(/<p(?:\s[^>]*)?>[\s\S]*?<\/p>/gi)];
  const texts = pTags
    .map((m) => stripHtml(m[0]))
    .filter((t) => t.length > 10);

  // Hitta redaktör — ENDAST kända namn accepteras, inget annat
  let editorName = '';
  for (const text of texts) {
    const found = KNOWN_EDITORS.find((n) => text.includes(n));
    if (found) {
      editorName = found;
      break;
    }
  }

  if (!editorName) return null;

  // Hitta intro: första substantiella stycket (>60 tecken, ingen URL, inte boilerplate)
  let intro = '';
  for (const text of texts) {
    if (text.length < 60) continue;
    if (text.includes('http')) continue;
    if (BOILERPLATE.some((p) => p.test(text))) continue;
    if (text.includes(editorName)) continue;
    intro = text;
    break;
  }

  if (!intro) return null;
  return { intro, editorName };
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST() {
  try {
    console.log('[sync-intros] Hämtar kampanjer från Mailchimp...');

    // Datum ett år sedan
    const since = new Date();
    since.setFullYear(since.getFullYear() - 1);
    const sinceStr = since.toISOString().split('.')[0];

    // Hämta alla betalande-kampanjer det senaste året
    const allCampaigns: Array<{
      id: string;
      subject: string;
      send_time: string;
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
          });
        }
      }

      if (campaigns.length < 100) break;
      offset += 100;
    }

    console.log(`[sync-intros] Hittade ${allCampaigns.length} betalande kampanjer`);

    // Hämta HTML-innehåll för varje kampanj och extrahera intro + redaktör
    const results: Array<{
      campaign_id: string;
      editor_name: string;
      intro_text: string;
      send_time: string;
    }> = [];

    let skipped = 0;

    for (const c of allCampaigns) {
      try {
        const content = await mcGet(`/campaigns/${c.id}/content`);
        const html = content.html ?? '';

        const extracted = extractIntroAndEditor(html);
        if (extracted) {
          results.push({
            campaign_id: c.id,
            editor_name: extracted.editorName,
            intro_text: extracted.intro,
            send_time: c.send_time,
          });
        } else {
          skipped++;
          console.warn(`[sync-intros] Kunde inte extrahera intro från kampanj ${c.id}`);
        }

        // Rate limit: Mailchimp tillåter ~10 req/sek
        await new Promise((r) => setTimeout(r, 120));
      } catch (e) {
        console.warn(`[sync-intros] Misslyckades för kampanj ${c.id}:`, e);
        skipped++;
      }
    }

    console.log(
      `[sync-intros] Extraherade ${results.length} intron (hoppade över ${skipped})`
    );

    // Gruppering per redaktör (för loggning)
    const byEditor: Record<string, number> = {};
    for (const r of results) {
      byEditor[r.editor_name] = (byEditor[r.editor_name] ?? 0) + 1;
    }

    // Spara i Supabase (upsert på campaign_id)
    if (results.length > 0) {
      const { error } = await supabase
        .from('editor_intro_examples')
        .upsert(results, { onConflict: 'campaign_id' });

      if (error) throw new Error(`Supabase upsert: ${error.message}`);
    }

    console.log(`[sync-intros] Sparade ${results.length} intron`);

    return NextResponse.json({
      success: true,
      synced: results.length,
      skipped,
      byEditor,
    });
  } catch (err) {
    console.error('[sync-intros] Fel:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

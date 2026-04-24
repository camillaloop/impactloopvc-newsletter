// app/api/mailchimp/route.ts
// POST → skapar Mailchimp-kampanj från ett Supabase-utkast
//
// Body: { draftId: string; action: 'draft' | 'test'; testEmail?: string; segment?: 'betalande' | 'gratis' }
//
// Kampanjen skapas ALLTID som utkast – redaktören godkänner och skickar manuellt i Mailchimp.

import { NextResponse } from 'next/server';
import { getDraftById, updateDraft, recordSentNewsletter } from '@/lib/supabase';
import { buildPlaceholders } from '@/lib/placeholders';
import { generateNewsletterHTML } from '@/lib/template';
import { getEditorForDate } from '@/lib/editors';

const MC_KEY = process.env.MAILCHIMP_API_KEY!;
const MC_SERVER = process.env.MAILCHIMP_SERVER!;
const MC_LIST = process.env.MAILCHIMP_LIST_ID!;
const BASE = `https://${MC_SERVER}.api.mailchimp.com/3.0`;
const AUTH = 'Basic ' + Buffer.from(`anystring:${MC_KEY}`).toString('base64');

// Mailchimp segment IDs (Impact Loop Europe list b46477bf08)
const SEGMENT_BETALANDE = '3452658';
const SEGMENT_GRATIS = '3452659';

async function mcFetch(path: string, options: RequestInit = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      Authorization: AUTH,
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
  });
  if (res.status === 204) return {};
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || `Mailchimp error ${res.status}`);
  return data;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      draftId,
      action,
      testEmail,
      segment = 'gratis',
    } = body as {
      draftId: string;
      action: 'draft' | 'test';
      testEmail?: string;
      segment?: 'betalande' | 'gratis';
    };

    if (!draftId) {
      return NextResponse.json({ error: 'draftId missing' }, { status: 400 });
    }

    // Hämta utkast
    const draft = await getDraftById(draftId);
    if (!draft) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
    }

    // Bygg placeholders med korrekt segment
    const isBetalande = segment === 'betalande';

    // Hämta editor från sparade placeholders (bevarar eventuell Slack-override)
    // Fallback till roteringsschema om placeholders saknas
    const savedPlaceholders = (draft.placeholders ?? {}) as Record<string, string>;
    const editorFromPlaceholders = savedPlaceholders['[[editor_placeholder]]'];
    const editorEmailFromPlaceholders = savedPlaceholders['[[editoremail_placeholder]]'];
    const editorImageFromPlaceholders = savedPlaceholders['[[editorimage_placeholder]]'];

    let editor;
    if (editorFromPlaceholders && editorEmailFromPlaceholders) {
      editor = {
        name: editorFromPlaceholders,
        email: editorEmailFromPlaceholders,
        title: '', // fylls ej i placeholder men används inte i templaten direkt
        imageUrl: editorImageFromPlaceholders ?? '',
      };
    } else {
      const editorDate = new Date();
      const day = draft.editor_day ?? editorDate.getDay();
      const targetDate = new Date();
      const diff = day - targetDate.getDay();
      targetDate.setDate(targetDate.getDate() + diff);
      editor = getEditorForDate(targetDate);
    }

    const draftData = {
      editor,
      subjectOptions: draft.subject_options,
      intro: draft.intro,
      article1: draft.article1_data,
      article2: draft.article2_data,
      article3: draft.article3_data ?? undefined,
      svepet: draft.svepet_data,
      fundingRows: draft.funding_rows ?? [],
      isBetalande,
      mostRead: [], // fylls på nedan från sparade placeholders
      psArticle: undefined, // fylls på nedan från sparade placeholders
      meetups: draft.meetups_data ?? [],
      sponsorActive: draft.sponsor_active,
      teknikActive: draft.teknik_active,
      date: new Date(draft.date),
    };

    const placeholders = buildPlaceholders(draftData);

    // Återanvänd sparade placeholders för fält som inte beror på segment
    // (mostRead och psArticle hämtas vid collect-tidpunkt och lagras i draft.placeholders)
    if (draft.placeholders) {
      const saved = draft.placeholders as Record<string, string>;
      placeholders['[[mostread_placeholder]]'] = saved['[[mostread_placeholder]]'] ?? '';
      placeholders['[[psarticletitle_placeholder]]'] = saved['[[psarticletitle_placeholder]]'] ?? '';
      placeholders['[[psarticlelink_placeholder]]'] = saved['[[psarticlelink_placeholder]]'] ?? '';
      placeholders['[[psarticleimage_placeholder]]'] = saved['[[psarticleimage_placeholder]]'] ?? '';
      placeholders['[[tableofcontents_placeholder]]'] = saved['[[tableofcontents_placeholder]]'] ?? placeholders['[[tableofcontents_placeholder]]'];
    }

    const html = generateNewsletterHTML(placeholders);
    const subject = draft.subject;
    const dateStr = new Date(draft.date).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    // ─── Skapa Mailchimp-kampanj ──────────────────────────────────────────────
    const segmentId = isBetalande ? SEGMENT_BETALANDE : SEGMENT_GRATIS;
    const campaignTitle = `Impact Loop VC ${dateStr}${isBetalande ? ' (paid)' : ''}`;

    if (action === 'draft') {
      // Skapa alltid BÅDA kampanjerna – gratis och betalande
      const results = await Promise.all(
        (['gratis', 'betalande'] as const).map(async (seg) => {
          const segIsBetalande = seg === 'betalande';
          const segId = segIsBetalande ? SEGMENT_BETALANDE : SEGMENT_GRATIS;
          const title = `Impact Loop VC ${dateStr}${segIsBetalande ? ' (paid)' : ''}`;

          // Bygg HTML med rätt isBetalande-flagga
          const segPlaceholders = buildPlaceholders({ ...draftData, isBetalande: segIsBetalande });
          if (draft.placeholders) {
            const saved = draft.placeholders as Record<string, string>;
            segPlaceholders['[[mostread_placeholder]]'] = saved['[[mostread_placeholder]]'] ?? '';
            segPlaceholders['[[psarticletitle_placeholder]]'] = saved['[[psarticletitle_placeholder]]'] ?? '';
            segPlaceholders['[[psarticlelink_placeholder]]'] = saved['[[psarticlelink_placeholder]]'] ?? '';
            segPlaceholders['[[psarticleimage_placeholder]]'] = saved['[[psarticleimage_placeholder]]'] ?? '';
            segPlaceholders['[[tableofcontents_placeholder]]'] = saved['[[tableofcontents_placeholder]]'] ?? segPlaceholders['[[tableofcontents_placeholder]]'];
          }
          const segHtml = generateNewsletterHTML(segPlaceholders);

          const campaign = await mcFetch('/campaigns', {
            method: 'POST',
            body: JSON.stringify({
              type: 'regular',
              recipients: {
                list_id: MC_LIST,
                segment_opts: { saved_segment_id: parseInt(segId, 10) },
              },
              settings: {
                subject_line: subject,
                preview_text: draft.preheader || subject,
                title,
                from_name: 'Impact Loop VC',
                reply_to: 'info@loop.se',
              },
            }),
          });

          await mcFetch(`/campaigns/${campaign.id}/content`, {
            method: 'PUT',
            body: JSON.stringify({ html: segHtml }),
          });

          await recordSentNewsletter({
            draft_id: draftId,
            mailchimp_campaign_id: campaign.id,
            subject,
            segment: seg,
          });

          const webId = campaign.web_id ?? '';
          return {
            segment: seg,
            campaignId: campaign.id,
            editUrl: `https://${MC_SERVER}.admin.mailchimp.com/campaigns/edit?id=${webId}`,
          };
        })
      );

      await updateDraft(draftId, { status: 'approved' });

      return NextResponse.json({
        success: true,
        campaigns: results,
        // Bakåtkompatibelt: öppna gratis-kampanjen direkt
        editUrl: results.find((r) => r.segment === 'gratis')?.editUrl,
        editUrlBetalande: results.find((r) => r.segment === 'betalande')?.editUrl,
      });
    }

    if (action === 'test') {
      const email = testEmail || process.env.MAILCHIMP_TEST_EMAIL;
      if (!email) {
        return NextResponse.json({ error: 'No test email address provided' }, { status: 400 });
      }

      // Skapa temporär kampanj
      const campaign = await mcFetch('/campaigns', {
        method: 'POST',
        body: JSON.stringify({
          type: 'regular',
          recipients: { list_id: MC_LIST },
          settings: {
            subject_line: `[TEST] ${subject}`,
            title: `[TEST] ${campaignTitle}`,
            from_name: 'Impact Loop VC',
            reply_to: 'info@loop.se',
          },
        }),
      });

      await mcFetch(`/campaigns/${campaign.id}/content`, {
        method: 'PUT',
        body: JSON.stringify({ html }),
      });

      await mcFetch(`/campaigns/${campaign.id}/actions/test`, {
        method: 'POST',
        body: JSON.stringify({ test_emails: [email], send_type: 'html' }),
      });

      // Radera temporär kampanj
      await mcFetch(`/campaigns/${campaign.id}`, { method: 'DELETE' });

      return NextResponse.json({ success: true, sentTo: email });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err) {
    console.error('[mailchimp] Error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

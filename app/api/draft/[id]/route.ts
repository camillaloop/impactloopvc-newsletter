// app/api/draft/[id]/route.ts
// GET  → hämtar ett specifikt utkast
// PATCH → uppdaterar utkast (intro, artiklar, svepet, ämnesrad, etc.)

import { NextResponse } from 'next/server';
import { getDraftById, updateDraft } from '@/lib/supabase';
import { buildPlaceholders } from '@/lib/placeholders';
import { getEditorForDate } from '@/lib/editors';
import { buildSvepetHtml, buildFundingHtml, buildMeetupsHtml } from '@/lib/ai';
import { buildMostReadHtml } from '@/lib/analytics';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const draft = await getDraftById(id);

  if (!draft) {
    return NextResponse.json({ error: 'Utkast hittades inte' }, { status: 404 });
  }

  return NextResponse.json(draft);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const existing = await getDraftById(id);
  if (!existing) {
    return NextResponse.json({ error: 'Utkast hittades inte' }, { status: 404 });
  }

  const body = await request.json();

  // Fält som kan uppdateras direkt
  const directFields: (keyof typeof existing)[] = [
    'subject',
    'intro',
    'funding_text',
    'funding_rows',
    'is_betalande',
    'sponsor_active',
    'teknik_active',
    'status',
    'article1_data',
    'article2_data',
    'article3_data',
    'svepet_data',
    'meetups_data',
    'editor_day',
  ];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updates: Record<string, any> = {};
  for (const field of directFields) {
    if (field in body) {
      updates[field] = body[field];
    }
  }

  // toc_html kan skickas separat för att spara redigerad innehållsförteckning
  const tocHtmlOverride: string | null = 'toc_html' in body ? (body.toc_html as string) : null;

  // Bygg om placeholders om något innehållsmässigt ändrats
  const needsRebuild = directFields.some(
    (f) => f in body && f !== 'subject' && f !== 'status'
  );

  if (needsRebuild) {
    const merged = { ...existing, ...updates };
    const editor = getEditorForDate(
      new Date(['0', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][merged.editor_day ?? 1])
    );
    // Use day number directly
    const editorByDay = getEditorForDate(new Date(
      // Create a date with the right weekday
      (() => {
        const d = new Date();
        const day = merged.editor_day ?? 1;
        const diff = day - d.getDay();
        d.setDate(d.getDate() + diff);
        return d;
      })()
    ));

    const draftData = {
      editor: editorByDay,
      subjectOptions: merged.subject_options as [string, string, string],
      intro: merged.intro,
      article1: merged.article1_data,
      article2: merged.article2_data,
      article3: merged.article3_data ?? undefined,
      svepet: merged.svepet_data,
      fundingRows: merged.funding_rows ?? [],
      isBetalande: merged.is_betalande,
      mostRead: [], // inte ändras via PATCH
      psArticle: undefined,
      meetups: merged.meetups_data ?? [],
      sponsorActive: merged.sponsor_active,
      teknikActive: merged.teknik_active,
      date: new Date(merged.date),
    };

    const rebuilt = buildPlaceholders(draftData);

    // Bevara mostRead och psArticle från det sparade utkastet –
    // de hämtas vid collect-tillfället och ska inte skrivas över vid PATCH
    const saved = existing.placeholders as Record<string, string>;
    updates.placeholders = {
      ...rebuilt,
      // Dessa byggs vid collect-tillfället och ska aldrig skrivas över vid PATCH
      '[[mostread_placeholder]]': saved['[[mostread_placeholder]]'] || rebuilt['[[mostread_placeholder]]'],
      '[[psarticletitle_placeholder]]': saved['[[psarticletitle_placeholder]]'] || rebuilt['[[psarticletitle_placeholder]]'],
      '[[psarticlelink_placeholder]]': saved['[[psarticlelink_placeholder]]'] || rebuilt['[[psarticlelink_placeholder]]'],
      '[[psarticleimage_placeholder]]': saved['[[psarticleimage_placeholder]]'] || rebuilt['[[psarticleimage_placeholder]]'],
      // TOC: manuell override vinner, annars bevara sparat, annars auto-byggt
      '[[tableofcontents_placeholder]]': tocHtmlOverride ?? saved['[[tableofcontents_placeholder]]'] ?? rebuilt['[[tableofcontents_placeholder]]'],
    };
  } else if (tocHtmlOverride !== null) {
    // Bara TOC har ändrats – uppdatera utan full rebuild
    updates.placeholders = {
      ...(existing.placeholders as Record<string, string>),
      '[[tableofcontents_placeholder]]': tocHtmlOverride,
    };
  }

  const updated = await updateDraft(id, updates);
  return NextResponse.json(updated);
}

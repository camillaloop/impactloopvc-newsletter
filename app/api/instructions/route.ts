// app/api/instructions/route.ts
// Manuell fallback om Slack-webhooks inte fungerar.
// POST { text: string } med Authorization: Bearer CRON_SECRET

import { NextResponse } from 'next/server';
import { parseInstruction, resolveInstruction } from '@/lib/slack-instructions';
import { storePendingInstructions } from '@/lib/supabase';

export async function POST(req: Request) {
  const auth = req.headers.get('authorization') ?? '';
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { text } = await req.json();
  if (!text) return NextResponse.json({ error: 'text saknas' }, { status: 400 });

  const parsed = await parseInstruction(text);
  if (!parsed) return NextResponse.json({ error: 'Kunde inte tolka instruktionen' }, { status: 422 });

  const resolved = await resolveInstruction(parsed, text);
  await storePendingInstructions({
    editorOverride: resolved.editorOverride ?? null,
    articleIds: resolved.articleIds,
    psArticleId: resolved.psArticleId ?? null,
    svepHints: resolved.svepHints ?? [],
    rawText: text,
    slackChannel: null,
    slackThreadTs: null,
  });

  return NextResponse.json({ success: true, confirmation: resolved.confirmationLines });
}

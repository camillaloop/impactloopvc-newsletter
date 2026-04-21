// app/api/draft/route.ts
// GET → hämtar senaste utkast (eller specifikt datum via ?date=YYYY-MM-DD)

import { NextResponse } from 'next/server';
import { getDraftByDate, getLatestDraft } from '@/lib/supabase';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date');

  if (date) {
    const draft = await getDraftByDate(date);
    if (!draft) {
      return NextResponse.json({ error: 'Inget utkast för detta datum' }, { status: 404 });
    }
    return NextResponse.json(draft);
  }

  const draft = await getLatestDraft();
  if (!draft) {
    return NextResponse.json({ error: 'Inga utkast hittades' }, { status: 404 });
  }
  return NextResponse.json(draft);
}

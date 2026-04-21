// app/api/extra-brev/route.ts
// Skapar ett extrabrev direkt i Mailchimp utifrån ett artikeltitel-fragment.
// Body: { titleFragment: string }

import { NextResponse } from 'next/server';
import { createExtraBrev } from '@/lib/extra-brev';

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { titleFragment } = await req.json() as { titleFragment: string };

    if (!titleFragment) {
      return NextResponse.json({ error: 'titleFragment saknas' }, { status: 400 });
    }

    const result = await createExtraBrev(titleFragment);
    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    console.error('[extra-brev] Fel:', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Okänt fel' }, { status: 500 });
  }
}

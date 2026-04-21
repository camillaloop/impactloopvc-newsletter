// app/api/collect/route.ts
// Körs kl 16:00 varje vardag via Vercel Cron.
// Samlar data → genererar AI-innehåll → sparar utkast i Supabase → skickar Slack-notis.

import { NextResponse } from 'next/server';
import { runCollect } from '@/lib/collect';

const CRON_SECRET = process.env.CRON_SECRET ?? '';

export async function GET(request: Request) {
  // Vercel Cron skickar en Authorization-header i produktion
  const authHeader = request.headers.get('authorization');
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await runCollect();
    return NextResponse.json({
      success: true,
      draftId: result.draftId,
      dashboardUrl: result.dashboardUrl,
    });
  } catch (error) {
    console.error('[collect] Fel:', error);
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}

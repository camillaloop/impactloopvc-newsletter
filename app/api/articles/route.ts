// app/api/articles/route.ts
// GET ?q=sökterm → söker artiklar i Sanity (för att byta ut artikel i dashboard)

import { NextResponse } from 'next/server';
import { searchArticles } from '@/lib/sanity';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') ?? '';

  if (!q || q.length < 2) {
    return NextResponse.json({ articles: [] });
  }

  const articles = await searchArticles(q, 10);
  return NextResponse.json({ articles });
}

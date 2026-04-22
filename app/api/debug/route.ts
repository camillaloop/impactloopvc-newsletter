import { NextResponse } from 'next/server';
import { fetchMostRead } from '@/lib/analytics';
import { fetchMeetups } from '@/lib/sheets';
import { fetchNewsletterArticles } from '@/lib/sanity';

export async function GET() {
  const ga4Email = process.env.GA4_CLIENT_EMAIL ?? '';
  const ga4Key = process.env.GA4_PRIVATE_KEY ?? '';
  const ga4Prop = process.env.GA4_PROPERTY_ID ?? '';

  const sanityProjectId = process.env.SANITY_PROJECT_ID ?? '';
  const sanityToken = process.env.SANITY_TOKEN ?? '';

  let mostRead: unknown[] = [];
  let mostReadError = '';
  let meetups: unknown[] = [];
  let meetupsError = '';
  let sanityArticles: unknown[] = [];
  let sanityError = '';

  try {
    mostRead = await fetchMostRead();
  } catch (e) {
    mostReadError = String(e);
  }

  try {
    meetups = await fetchMeetups();
  } catch (e) {
    meetupsError = String(e);
  }

  try {
    sanityArticles = await fetchNewsletterArticles();
  } catch (e) {
    sanityError = String(e);
  }

  return NextResponse.json({
    ga4_email_set: !!ga4Email,
    ga4_email_prefix: ga4Email.slice(0, 20),
    ga4_key_set: !!ga4Key,
    ga4_key_length: ga4Key.length,
    ga4_key_starts: ga4Key.slice(0, 30),
    ga4_property: ga4Prop,
    sanity_project_id: sanityProjectId.slice(0, 8) + '...',
    sanity_token_set: !!sanityToken,
    sanity_token_length: sanityToken.length,
    sanityArticles,
    sanityError,
    mostRead,
    mostReadError,
    meetups,
    meetupsError,
  });
}

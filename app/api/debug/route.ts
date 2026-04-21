import { NextResponse } from 'next/server';
import { fetchMostRead } from '@/lib/analytics';
import { fetchMeetups } from '@/lib/sheets';

export async function GET() {
  const ga4Email = process.env.GA4_CLIENT_EMAIL ?? '';
  const ga4Key = process.env.GA4_PRIVATE_KEY ?? '';
  const ga4Prop = process.env.GA4_PROPERTY_ID ?? '';

  let mostRead: unknown[] = [];
  let mostReadError = '';
  let meetups: unknown[] = [];
  let meetupsError = '';

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

  return NextResponse.json({
    ga4_email_set: !!ga4Email,
    ga4_email_prefix: ga4Email.slice(0, 20),
    ga4_key_set: !!ga4Key,
    ga4_key_length: ga4Key.length,
    ga4_key_starts: ga4Key.slice(0, 30),
    ga4_property: ga4Prop,
    mostRead,
    mostReadError,
    meetups,
    meetupsError,
  });
}

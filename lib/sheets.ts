// lib/sheets.ts
// Hämtar kommande meetups från Google Sheets via Sheets API v4
// Använder samma service account som GA4 (GA4_CLIENT_EMAIL + GA4_PRIVATE_KEY)

const SPREADSHEET_ID = '1fYgRy0h0XomnKS7zcAsLc5mkN3SRwEMWWYefpSeA04A';
const SHEET_TAB = 'Kommande meetups';

// Återanvänd key-normalisering från analytics.ts
const GA4_CLIENT_EMAIL = process.env.GA4_CLIENT_EMAIL ?? '';
const GA4_PRIVATE_KEY = (process.env.GA4_PRIVATE_KEY ?? '')
  .replace(/\\n/g, '\n')
  .replace(/\r/g, '')
  .replace(/(-----BEGIN [^-]+-----)([^\n])/g, '$1\n$2')
  .replace(/([^\n])(-----END [^-]+-----)/g, '$1\n$2');

export interface Meetup {
  title: string; // "Datum och rubrik"-kolumnen
  info: string;  // "Brödtext"-kolumnen (kan innehålla HTML med länkar)
}

// ─── JWT / OAuth (identisk logik som analytics.ts) ───────────────────────────

function base64UrlEncode(str: string): string {
  return Buffer.from(str)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

async function signJWT(header: object, payload: object, privateKey: string): Promise<string> {
  const { createSign } = await import('crypto');
  const headerB64 = base64UrlEncode(JSON.stringify(header));
  const payloadB64 = base64UrlEncode(JSON.stringify(payload));
  const signingInput = `${headerB64}.${payloadB64}`;
  const signer = createSign('RSA-SHA256');
  signer.update(signingInput);
  const signature = signer.sign(privateKey, 'base64');
  return `${signingInput}.${signature.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')}`;
}

async function getAccessToken(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const jwt = await signJWT(
    { alg: 'RS256', typ: 'JWT' },
    {
      iss: GA4_CLIENT_EMAIL,
      scope: 'https://www.googleapis.com/auth/spreadsheets.readonly',
      aud: 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: now + 3600,
    },
    GA4_PRIVATE_KEY
  );

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });

  if (!res.ok) {
    throw new Error(`Sheets token fetch failed: ${await res.text()}`);
  }

  const data = await res.json();
  return data.access_token as string;
}

// ─── Sheets API ───────────────────────────────────────────────────────────────

/**
 * Hämtar kommande meetups från Google Sheets.
 * Förväntar kolumner: A = "Datum och rubrik", B = "Brödtext"
 * Returnerar [] om credentials saknas eller om ett fel uppstår.
 */
export async function fetchMeetups(): Promise<Meetup[]> {
  if (!GA4_CLIENT_EMAIL || !GA4_PRIVATE_KEY) {
    console.warn('[sheets] GA4_CLIENT_EMAIL eller GA4_PRIVATE_KEY saknas – returnerar tom lista');
    return [];
  }

  try {
    const accessToken = await getAccessToken();

    const range = encodeURIComponent(`${SHEET_TAB}!A2:B50`);
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${range}`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) {
      console.error('[sheets] Sheets API svarade:', res.status, await res.text());
      return [];
    }

    const data = await res.json();
    const rows: string[][] = data.values ?? [];

    return rows
      .filter((row) => row[0]?.trim()) // hoppa över tomma rader
      .map((row) => ({
        title: row[0]?.trim() ?? '',
        info: row[1]?.trim() ?? '',
      }));
  } catch (err) {
    console.warn('[sheets] Kunde inte hämta meetups:', err);
    return [];
  }
}

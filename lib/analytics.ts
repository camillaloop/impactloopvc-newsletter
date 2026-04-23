// lib/analytics.ts
// Hämtar "mest läst"-data från GA4 via Data API med service account JWT

const GA4_PROPERTY_ID = process.env.GA4_PROPERTY_ID ?? '';
const GA4_CLIENT_EMAIL = process.env.GA4_CLIENT_EMAIL ?? '';
const GA4_PRIVATE_KEY = (process.env.GA4_PRIVATE_KEY ?? '')
  .replace(/\\n/g, '\n')   // literal \n → newline
  .replace(/\r/g, '')       // ta bort carriage returns
  // Sätt till rätt format om BEGIN/END saknar radbrytning före sig
  .replace(/(-----BEGIN [^-]+-----)([^\n])/g, '$1\n$2')
  .replace(/([^\n])(-----END [^-]+-----)/g, '$1\n$2');

export interface MostReadArticle {
  title: string;
  url: string;
  sessions: number;
}

// ─── JWT / OAuth ─────────────────────────────────────────────────────────────

interface ServiceAccount {
  client_email: string;
  private_key: string;
}

function base64UrlEncode(str: string): string {
  return Buffer.from(str)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

async function signJWT(
  header: object,
  payload: object,
  privateKey: string
): Promise<string> {
  // Use Node.js crypto via dynamic import (works in Next.js API routes)
  const { createSign } = await import('crypto');

  const headerB64 = base64UrlEncode(JSON.stringify(header));
  const payloadB64 = base64UrlEncode(JSON.stringify(payload));
  const signingInput = `${headerB64}.${payloadB64}`;

  const signer = createSign('RSA-SHA256');
  signer.update(signingInput);
  const signature = signer.sign(privateKey, 'base64');
  const signatureB64 = signature
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

  return `${signingInput}.${signatureB64}`;
}

async function getAccessToken(sa: ServiceAccount): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const payload = {
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/analytics.readonly',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  };

  const jwt = await signJWT(header, payload, sa.private_key);

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });

  if (!res.ok) {
    throw new Error(`GA4 token fetch failed: ${await res.text()}`);
  }

  const data = await res.json();
  return data.access_token as string;
}

// ─── GA4 Data API ─────────────────────────────────────────────────────────────

/**
 * Hämtar de 5 mest lästa artiklarna de senaste 7 dagarna från GA4.
 * Returnerar [] om service account saknas.
 */
export async function fetchMostRead(): Promise<MostReadArticle[]> {
  if (!GA4_CLIENT_EMAIL || !GA4_PRIVATE_KEY) {
    console.warn('[analytics] GA4_CLIENT_EMAIL eller GA4_PRIVATE_KEY saknas – returnerar tom lista');
    return [];
  }

  if (!GA4_PROPERTY_ID) {
    console.warn('[analytics] GA4_PROPERTY_ID saknas – returnerar tom lista');
    return [];
  }

  console.log('[analytics] Fetching GA4 most read, property:', GA4_PROPERTY_ID.slice(0, 6) + '...');

  let accessToken: string;
  try {
    const sa: ServiceAccount = { client_email: GA4_CLIENT_EMAIL, private_key: GA4_PRIVATE_KEY };
    accessToken = await getAccessToken(sa);
  } catch (e) {
    console.error('[analytics] GA4 token error:', String(e));
    return [];
  }

  const body = {
    // Tillfälligt fast datumintervall – sajten flyttades 21 april och GA4-kopplingen är bruten
    // TODO: Återställ till '7daysAgo'/'yesterday' när GA4 är återkopplat till nya sajten
    dateRanges: [{ startDate: '2026-04-14', endDate: '2026-04-21' }],
    dimensions: [{ name: 'pageTitle' }, { name: 'pagePath' }],
    metrics: [{ name: 'sessions' }],
    dimensionFilter: {
      filter: {
        fieldName: 'pagePath',
        stringFilter: { matchType: 'CONTAINS', value: '/article/' },
      },
    },
    orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
    limit: 15,
  };

  const res = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${GA4_PROPERTY_ID}:runReport`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    console.error('[analytics] GA4 report failed:', text);
    return [];
  }

  const data = await res.json();
  const rows = data.rows ?? [];
  console.log(`[analytics] GA4 returned ${rows.length} rows`);

  return rows
    .map(
      (row: { dimensionValues: { value: string }[]; metricValues: { value: string }[] }) => ({
        // Ta bort " │ Impact Loop" och liknande suffix från GA4-sidtitlar
        title: (row.dimensionValues[0]?.value ?? '').replace(/\s*[│|]\s*Impact Loop( VC)?\s*$/i, '').trim(),
        url: `https://www.impactloop.com${row.dimensionValues[1]?.value ?? ''}`,
        sessions: parseInt(row.metricValues[0]?.value ?? '0', 10),
      })
    )
    // Filtrera bort trasiga poster (GA4 kan ha dubblerade sökvägar eller saknade titlar)
    .filter((a: { title: string; url: string; sessions: number }) => a.title && a.title !== '(not set)' && a.url.length < 300)
    .slice(0, 5);
}

/**
 * Bygger HTML-blocket för "mest läst" i Mailchimp-mallen.
 * Formatet matchar exakt GAS-skriptets mostread_placeholder.
 */
export function buildMostReadHtml(articles: MostReadArticle[]): string {
  if (!articles.length) return '';

  const items = articles
    .map((a) => `<li><p><a href="${a.url}" target="_blank">${a.title}</a></p></li>`)
    .join('');

  return `<ol>${items}</ol>`;
}

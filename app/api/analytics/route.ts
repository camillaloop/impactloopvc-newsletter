import { NextResponse } from 'next/server';

// GA4 Data API via service account
export async function GET() {
  try {
    const propertyId = process.env.GA4_PROPERTY_ID;
    const serviceAccountJson = process.env.GA4_SERVICE_ACCOUNT_JSON;

    if (!propertyId || !serviceAccountJson) {
      // Returnera tom lista om GA4 inte är konfigurerat
      return NextResponse.json({ mostRead: [] });
    }

    const serviceAccount = JSON.parse(serviceAccountJson);

    // Hämta access token via JWT
    const token = await getAccessToken(serviceAccount);

    // Hämta mest läst senaste 7 dagarna
    const res = await fetch(
      `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
          dimensions: [
            { name: 'pagePath' },
            { name: 'pageTitle' },
          ],
          metrics: [{ name: 'screenPageViews' }],
          dimensionFilter: {
            filter: {
              fieldName: 'pagePath',
              stringFilter: {
                matchType: 'CONTAINS',
                value: '/artikel/',
              },
            },
          },
          orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
          limit: 10,
        }),
      }
    );

    if (!res.ok) {
      console.error('GA4 error:', await res.text());
      return NextResponse.json({ mostRead: [] });
    }

    const data = await res.json();
    const rows = data.rows || [];

    const mostRead = rows.map((row: { dimensionValues: Array<{value: string}>; metricValues: Array<{value: string}> }) => ({
      title: row.dimensionValues[1]?.value || '',
      url: `https://impactloop.se${row.dimensionValues[0]?.value}`,
      views: parseInt(row.metricValues[0]?.value || '0'),
    }));

    return NextResponse.json({ mostRead });
  } catch (err) {
    console.error('Analytics error:', err);
    return NextResponse.json({ mostRead: [] });
  }
}

// JWT-signering för Google service account
async function getAccessToken(serviceAccount: {
  client_email: string;
  private_key: string;
}): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/analytics.readonly',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  };

  const header = { alg: 'RS256', typ: 'JWT' };

  const encode = (obj: object) =>
    Buffer.from(JSON.stringify(obj)).toString('base64url');

  const signingInput = `${encode(header)}.${encode(payload)}`;

  // Importera privat nyckel
  const privateKey = serviceAccount.private_key.replace(/\\n/g, '\n');
  const keyData = privateKey
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\s/g, '');

  const binaryKey = Buffer.from(keyData, 'base64');
  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    binaryKey,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    Buffer.from(signingInput)
  );

  const jwt = `${signingInput}.${Buffer.from(signature).toString('base64url')}`;

  // Byt JWT mot access token
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });

  const tokenData = await tokenRes.json();
  return tokenData.access_token;
}

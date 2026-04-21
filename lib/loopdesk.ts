// lib/loopdesk.ts
// Hämtar de senaste nyemissionerna från Loopdesk och beräknar pre-money-värdering.
// Pre-money = valuationPostMoneySek - amountSek

const LOOPDESK_URL =
  'https://www.loopdesk.se/api/v2/nyemissioner?key=NqJsUrnsi4ob9YByqYQAB1W7FhFOcKZpPcgt3p8o&limit=30';

export interface Nyemission {
  company: string;
  amountSek: number;
  valuationPostMoneySek: number;
  valuationPreMoneySek: number; // beräknad
  eventDate: string;
}

/** Formaterar ett belopp i SEK till "1,8 milj kr" eller "2,3 mdr kr" */
function formatSek(sek: number): string {
  if (sek >= 1_000_000_000) {
    return (sek / 1_000_000_000).toLocaleString('sv-SE', { maximumFractionDigits: 1 }) + ' mdr kr';
  }
  return (sek / 1_000_000).toLocaleString('sv-SE', { maximumFractionDigits: 1 }) + ' milj kr';
}

/** Hämtar de 5 senaste nyemissionerna och returnerar dem med pre-money */
export async function fetchNyemissioner(limit = 5): Promise<Nyemission[]> {
  try {
    const res = await fetch(LOOPDESK_URL, { cache: 'no-store' });
    if (!res.ok) {
      console.warn(`[loopdesk] API svarade ${res.status}`);
      return [];
    }
    const json = await res.json();
    const items = (json.items ?? []) as Array<{
      company: string;
      amountSek: number;
      valuationPostMoneySek: number;
      eventDate: string;
    }>;

    return items
      .filter((item) => item.amountSek >= 2_000_000)
      .slice(0, limit).map((item) => ({
      company: item.company,
      amountSek: item.amountSek,
      valuationPostMoneySek: item.valuationPostMoneySek,
      valuationPreMoneySek: item.valuationPostMoneySek - item.amountSek,
      eventDate: item.eventDate,
    }));
  } catch (err) {
    console.warn('[loopdesk] Kunde inte hämta nyemissioner:', err);
    return [];
  }
}

/** Bygger HTML för funding-sektionen från Loopdesk-data */
export function buildFundingFromLoopdesk(items: Nyemission[]): string {
  if (!items.length) return '';
  return items
    .map((item) => {
      const amount = formatSek(item.amountSek);
      const preMoney = formatSek(item.valuationPreMoneySek);
      return `<p>💰 <strong>${item.company}</strong> tar in ${amount} till värderingen ${preMoney}.</p>`;
    })
    .join('<p><br /></p>');
}

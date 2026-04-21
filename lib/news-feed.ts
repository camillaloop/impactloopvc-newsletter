// lib/news-feed.ts
// Hämtar nyheter + pressmeddelanden från impactloop-swe-news.
// Nyheter: /api/nyheter-feeds (uppdateras var 30:e minut)
// Pressmeddelanden: /api/feeds (tab=rss) + /api/gmail-press (Mynewsdesk, 15 min TTL)

const BASE_URL = process.env.NEWS_APP_URL ?? 'https://impactloop-swe-news.vercel.app';

export interface NewsFeedItem {
  title: string;
  description: string;
  link: string;
  date: string | null;
  source: string;
  sourceId: string;
  tab: string; // "nyheter" | "rss" | "eu"
}

async function safeFetch(url: string): Promise<NewsFeedItem[]> {
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) {
      console.warn(`[news-feed] ${url} svarade ${res.status}`);
      return [];
    }
    const json = await res.json();
    return (json.articles ?? json ?? []) as NewsFeedItem[];
  } catch (err) {
    console.warn(`[news-feed] Kunde inte hämta ${url}:`, err);
    return [];
  }
}

/**
 * Hämtar nyheter + pressmeddelanden parallellt.
 * Returnerar alla ihopslagna, dedupade på link.
 */
export async function fetchNewsFeed(): Promise<NewsFeedItem[]> {
  const [nyheter, rssFeeds, gmailPress] = await Promise.all([
    safeFetch(`${BASE_URL}/api/nyheter-feeds`),
    safeFetch(`${BASE_URL}/api/feeds`),
    safeFetch(`${BASE_URL}/api/gmail-press`),
  ]);

  // Rensa bort EU-flödet (innehåller auktionsmeddelanden och politisk EU-byråkrati utan affärsvinkel)
  const relevantRss = rssFeeds.filter((item) => item.tab !== 'eu');

  // Rensa HTML-skräp från gmail-beskrivningar
  const cleanGmail = gmailPress.map((item) => ({
    ...item,
    description: item.description
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 250),
  }));

  // Slå ihop och deduplicera på link
  const all = [...nyheter, ...relevantRss, ...cleanGmail];
  const seen = new Set<string>();
  const deduped = all.filter((item) => {
    if (!item.link || seen.has(item.link)) return false;
    seen.add(item.link);
    return true;
  });

  console.log(
    `[news-feed] Hämtade totalt ${deduped.length} unika nyheter ` +
    `(nyheter: ${nyheter.length}, rss-pm: ${relevantRss.length}, gmail-pm: ${cleanGmail.length})`
  );

  return deduped;
}

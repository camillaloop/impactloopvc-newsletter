// lib/sanity.ts
// Hämtar artiklar från Sanity CMS via GROQ
//
// Prioriteringsordning för nyhetsbrev-artiklar:
// 1. Publicerade poster med publishTo: ["impact-loop-vc"] (nyaste först)
// 2. Fyll på upp till 3 med de senaste publicerade posterna
// Drafts tas ALDRIG med.

const SANITY_PROJECT_ID = process.env.SANITY_PROJECT_ID!;
const SANITY_DATASET = process.env.SANITY_DATASET ?? 'production';
const SANITY_TOKEN = process.env.SANITY_TOKEN!;
const SANITY_API_VERSION = '2024-01-01';

export interface SanityArticle {
  _id: string;
  title: string;
  slug: string;
  ingress: string;
  mainImageUrl: string;
  imageCaption: string;
  category: string;
  url: string;
  publishedAt: string;
}

// ─── Fetch-helper ─────────────────────────────────────────────────────────────

async function sanityFetch<T>(query: string, perspective: 'published' | 'raw' = 'published'): Promise<T> {
  const encodedQuery = encodeURIComponent(query);
  const url = `https://${SANITY_PROJECT_ID}.api.sanity.io/v${SANITY_API_VERSION}/data/query/${SANITY_DATASET}?query=${encodedQuery}&perspective=${perspective}`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${SANITY_TOKEN}` },
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Sanity fetch failed: ${res.status} ${text}`);
  }

  const json = await res.json();
  return json.result as T;
}

// Extraherar base-ID från ett Sanity-dokument-ID
// "versions.releaseId.baseId" → "baseId"
// "drafts.baseId" → "drafts.baseId" (behålls som-är)
// "baseId" → "baseId"
function extractBaseId(id: string): string {
  const versionMatch = id.match(/^versions\.[^.]+\.(.+)$/);
  return versionMatch ? versionMatch[1] : id;
}

// ─── Typmappning ──────────────────────────────────────────────────────────────

type RawPost = {
  _id: string;
  title: string;
  slug: { current: string } | string;
  ingress: string;
  mainImageUrl: string;
  imageCaption: string;
  category: string;
  publishedAt: string;
};

function mapPost(raw: RawPost): SanityArticle {
  const slugStr =
    typeof raw.slug === 'string'
      ? raw.slug
      : raw.slug?.current ?? '';

  return {
    _id: raw._id,
    title: raw.title ?? '',
    slug: slugStr,
    ingress: raw.ingress ?? '',
    mainImageUrl: raw.mainImageUrl ?? '',
    imageCaption: raw.imageCaption ?? '',
    category: raw.category ?? '',
    url: `https://www.impactloop.com/article/${slugStr}`,
    publishedAt: raw.publishedAt ?? '',
  };
}

// ─── Huvud-funktion ───────────────────────────────────────────────────────────

/**
 * Hämtar upp till 4 publicerade artiklar för nyhetsbrevet.
 * Artikel 1–3 används som huvudartiklar, artikel 4 som PS-artikel.
 * Drafts inkluderas aldrig.
 * 1. Publicerade poster med publishTo: ["impact-loop"] — nyaste först (schemalagda)
 * 2. Fyll på med senaste publicerade poster tills vi har 4
 */
export async function fetchNewsletterArticles(): Promise<SanityArticle[]> {
  const baseProjection = `{
    _id,
    title,
    slug,
    ingress,
    "mainImageUrl": image.asset->url,
    "imageCaption": coalesce(pt::text(imageCaption), imageCaption, image.asset->altText, image.asset->description, image.asset->title, ""),
    "category": coalesce(huvudkategori->title, huvudkategori->name, ""),
    publishedAt
  }`;

  // 1. Flaggade: hämta både publicerade och drafts med publishTo: impact-loop
  // perspective=raw ger oss drafts.* (schemalagda artiklar som ännu inte publicerats)
  const scheduledQuery = `
    *[_type == "postEnglish" && "impact-loop-vc" in publishTo && defined(publishedAt)]
    | order(publishedAt desc)
    [0...10]
    ${baseProjection}
  `;

  const scheduledRaw = await sanityFetch<RawPost[]>(scheduledQuery, 'raw').catch(() => [] as RawPost[]);

  // Deduplicera på base-ID (en artikel kan finnas som både draft och publicerad)
  const seenBaseIds = new Set<string>();
  const result: SanityArticle[] = [];

  for (const raw of scheduledRaw) {
    const baseId = extractBaseId(raw._id);
    if (!seenBaseIds.has(baseId) && result.length < 4) {
      seenBaseIds.add(baseId);
      result.push(mapPost({ ...raw, _id: baseId }));
    }
  }

  // 2. Fyll på med senaste publicerade om färre än 4
  if (result.length < 4) {
    const recentQuery = `
      *[_type == "postEnglish" && "impact-loop-vc" in publishTo && defined(publishedAt)]
      | order(publishedAt desc)
      [0...20]
      ${baseProjection}
    `;

    const recent = await sanityFetch<RawPost[]>(recentQuery, 'published').catch(() => [] as RawPost[]);

    for (const raw of recent) {
      const baseId = extractBaseId(raw._id);
      if (!seenBaseIds.has(baseId) && result.length < 4) {
        seenBaseIds.add(baseId);
        result.push(mapPost(raw));
      }
      if (result.length >= 4) break;
    }
  }

  return result;
}

// ─── Artikelsökning (dashboard: byta artikel) ─────────────────────────────────

/** Tar bort accenter: é→e, ä→a, ö→o etc. */
function stripAccents(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export async function searchArticles(
  searchTerm: string,
  limit = 10
): Promise<SanityArticle[]> {
  const projection = `{
    _id,
    title,
    slug,
    ingress,
    "mainImageUrl": image.asset->url,
    "imageCaption": coalesce(pt::text(imageCaption), imageCaption, image.asset->altText, image.asset->description, image.asset->title, ""),
    "category": coalesce(huvudkategori->title, huvudkategori->name, ""),
    publishedAt
  }`;

  function escape(s: string) {
    return s.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  }

  const e = escape(searchTerm);
  const query = `
    *[_type == "postEnglish" && (title match "*${e}*" || ingress match "*${e}*")]
    | order(publishedAt desc)
    [0...${limit * 2}]
    ${projection}
  `;

  // Sök med perspective=raw för att hitta både publicerade och drafts
  let raw = await sanityFetch<RawPost[]>(query, 'raw');

  // Om inga träffar – försök med accentnormaliserad version av hela frasen
  // (t.ex. "Dahmen" matchar "Dahmén")
  if (!raw.length) {
    const normalized = escape(stripAccents(searchTerm));
    if (normalized !== e) {
      const normQuery = `
        *[_type == "postEnglish" && (title match "*${normalized}*" || ingress match "*${normalized}*")]
        | order(publishedAt desc)
        [0...${limit * 2}]
        ${projection}
      `;
      raw = await sanityFetch<RawPost[]>(normQuery, 'raw').catch(() => []);
    }
  }

  // Deduplicera: om både draft och publicerad finns, ta den publicerade
  const seenBaseIds = new Set<string>();
  const result: SanityArticle[] = [];
  for (const r of raw) {
    const baseId = extractBaseId(r._id);
    if (!seenBaseIds.has(baseId)) {
      seenBaseIds.add(baseId);
      result.push(mapPost({ ...r, _id: baseId }));
    }
    if (result.length >= limit) break;
  }
  return result;
}

// ─── Hämta flera artiklar på ID (från pending instructions) ──────────────────

export async function fetchArticlesByIds(ids: string[]): Promise<SanityArticle[]> {
  if (!ids.length) return [];

  // Inkludera även drafts.* varianter för varje ID
  const allIds = ids.flatMap((id) => [`"${id}"`, `"drafts.${id}"`]).join(', ');
  const query = `
    *[_type == "postEnglish" && _id in [${allIds}]]
    {
      _id,
      title,
      slug,
      ingress,
      "mainImageUrl": image.asset->url,
      "imageCaption": coalesce(pt::text(imageCaption), imageCaption, image.asset->altText, image.asset->description, image.asset->title, ""),
      "category": coalesce(huvudkategori->title, huvudkategori->name, ""),
      publishedAt
    }
  `;

  const raw = await sanityFetch<RawPost[]>(query, 'raw');
  // Deduplicera på base-ID, returnera i samma ordning som ids
  const map = new Map<string, SanityArticle>();
  for (const r of raw) {
    const baseId = extractBaseId(r._id);
    if (!map.has(baseId)) {
      map.set(baseId, mapPost({ ...r, _id: baseId }));
    }
  }
  return ids.map((id) => map.get(id)).filter(Boolean) as SanityArticle[];
}

// ─── Hämta enskild artikel (PS-artikel) ──────────────────────────────────────

export async function fetchArticleById(id: string): Promise<SanityArticle | null> {
  // Prova både base-ID och drafts.*-variant
  const query = `
    *[_type == "postEnglish" && (_id == "${id}" || _id == "drafts.${id}")][0]
    {
      _id,
      title,
      slug,
      ingress,
      "mainImageUrl": image.asset->url,
      "imageCaption": coalesce(pt::text(imageCaption), imageCaption, image.asset->altText, image.asset->description, image.asset->title, ""),
      "category": coalesce(huvudkategori->title, huvudkategori->name, ""),
      publishedAt
    }
  `;

  const raw = await sanityFetch<RawPost | null>(query, 'raw');
  if (!raw) return null;
  const baseId = extractBaseId(raw._id);
  return mapPost({ ...raw, _id: baseId });
}

import { NextResponse } from 'next/server';

const SANITY_PROJECT_ID = process.env.SANITY_PROJECT_ID;
const SANITY_DATASET = process.env.SANITY_DATASET || 'production';
const SANITY_API_TOKEN = process.env.SANITY_API_TOKEN;

async function sanityFetch(query: string) {
  const url = `https://${SANITY_PROJECT_ID}.api.sanity.io/v2023-01-01/data/query/${SANITY_DATASET}?query=${encodeURIComponent(query)}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${SANITY_API_TOKEN}`,
    },
    next: { revalidate: 0 },
  });
  if (!res.ok) throw new Error(`Sanity error: ${res.status}`);
  const data = await res.json();
  return data.result;
}

function buildImageUrl(ref: string): string {
  if (!ref) return '';
  // Sanity image ref format: image-{id}-{width}x{height}-{format}
  const parts = ref.replace('image-', '').split('-');
  const format = parts[parts.length - 1];
  const dimensions = parts[parts.length - 2];
  const id = parts.slice(0, parts.length - 2).join('-');
  return `https://cdn.sanity.io/images/${SANITY_PROJECT_ID}/${SANITY_DATASET}/${id}-${dimensions}.${format}`;
}

export async function GET() {
  try {
    // Hämta artiklar markerade för dagligt nyhetsbrev
    const query = `*[_type == "article" && inkluderaINyhetsbrev == true && !(_id in path("drafts.**"))] | order(publishedAt desc) [0...20] {
      _id,
      title,
      "slug": slug.current,
      "intro": pt::text(ingress[0..1]),
      "imageUrl": mainImage.asset->url,
      "imageRef": mainImage.asset._ref,
      publishedAt,
      "category": category->title,
      "categorySlug": category->slug.current,
      inkluderaINyhetsbrev,
      inkluderaIPS,
      inkluderaIVeckobrev,
      lasTid
    }`;

    const articles = await sanityFetch(query);

    // Hämta PS-artiklar
    const psQuery = `*[_type == "article" && inkluderaIPS == true && !(_id in path("drafts.**"))] | order(publishedAt desc) [0...5] {
      _id,
      title,
      "slug": slug.current,
      "intro": pt::text(ingress[0..1]),
      "imageUrl": mainImage.asset->url,
      publishedAt,
      "category": category->title
    }`;

    const psArticles = await sanityFetch(psQuery);

    // Formatera artiklar
    const formatted = (articles || []).map((a: Record<string, unknown>) => ({
      id: a._id,
      title: a.title,
      intro: a.intro || '',
      imageUrl: a.imageUrl || (a.imageRef ? buildImageUrl(a.imageRef as string) : ''),
      url: `https://impactloop.se/artikel/${a.slug}`,
      category: (a.category as string) || 'Nyhet',
      readTime: a.lasTid ? `${a.lasTid} min` : undefined,
      isPS: a.inkluderaIPS,
      isWeekly: a.inkluderaIVeckobrev,
    }));

    const formattedPS = (psArticles || []).map((a: Record<string, unknown>) => ({
      id: a._id,
      title: a.title,
      intro: a.intro || '',
      imageUrl: a.imageUrl || '',
      url: `https://impactloop.se/artikel/${a.slug}`,
      category: (a.category as string) || 'Nyhet',
    }));

    return NextResponse.json({
      articles: formatted,
      psArticles: formattedPS,
    });
  } catch (err) {
    console.error('Sanity fetch error:', err);
    return NextResponse.json({ error: 'Kunde inte hämta artiklar från Sanity' }, { status: 500 });
  }
}

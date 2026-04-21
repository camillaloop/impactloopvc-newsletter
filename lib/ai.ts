// lib/ai.ts
// Claude-funktioner: intro, ämnesrader, Impact-svepet

import Anthropic from '@anthropic-ai/sdk';
import type { SanityArticle } from './sanity';
import type { NewsFeedItem } from './news-feed';

// Lazy-init så att env-variabeln hinner laddas innan klienten skapas
function getClient() {
  // Variabelnamnet är IL_ANTHROPIC_KEY för att undvika kollision med systemets ANTHROPIC_API_KEY
  return new Anthropic({ apiKey: process.env.IL_ANTHROPIC_KEY });
}

// ─── Typerna ──────────────────────────────────────────────────────────────────

export interface SvepetItem {
  emoji: string;
  boldTitle: string;
  body: string;
  link?: string;   // Länk till källartikeln
  source?: string; // Källnamn, t.ex. "Green Queen"
}

export interface SvepetResult {
  headline: string; // tex "Klimatpolitikens vägval"
  items: SvepetItem[];
}

// ─── Intro ────────────────────────────────────────────────────────────────────

/** Hämtar de 10 senaste introna för en specifik redaktör från Supabase */
async function fetchEditorExamples(editorName: string): Promise<string[]> {
  try {
    const { supabase } = await import('./supabase');
    const { data } = await supabase
      .from('editor_intro_examples')
      .select('intro_text')
      .eq('editor_name', editorName)
      .order('send_time', { ascending: false })
      .limit(10);
    return (data ?? []).map((r: { intro_text: string }) => r.intro_text);
  } catch {
    return [];
  }
}

/**
 * Genererar en kort redaktörsinledning (2–4 meningar) baserad på dagens artiklar.
 * Skrivs i jag-form från redaktörens perspektiv.
 * Använder de 10 senaste verkliga introna från Supabase som few-shot-träning.
 */
export async function generateIntro(
  articles: SanityArticle[],
  editorName: string
): Promise<string> {
  const articleSummary = articles
    .map((a, i) => `${i + 1}. ${a.title}: ${a.ingress}`)
    .join('\n');

  const examples = await fetchEditorExamples(editorName);
  const examplesBlock =
    examples.length > 0
      ? `\nHär är ${examples.length} verkliga intron som ${editorName} tidigare skrivit (senaste först):\n${examples.map((e, i) => `${i + 1}. "${e}"`).join('\n')}\n\nStudera tonalitet, längd, meningsbyggnad och hur ${editorName.split(' ')[0]} brukar inleda. Matcha stilen exakt.\n`
      : '';

  const msg = await getClient().messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 300,
    messages: [
      {
        role: 'user',
        content: `Du är ${editorName} och skriver en kort inledning till Impact Loops dagliga nyhetsbrev om hållbart näringsliv i Sverige.
${examplesBlock}
Artiklarna i dagens nyhetsbrev:
${articleSummary}

Skriv en inledning på 2–4 meningar i jag-form. Varm, personlig och journalistisk ton. Inga hashtags, inga listor. Nämn 1–2 av artiklarna utan att citera titlarna rakt av. Avsluta INTE med "Trevlig läsning" eller liknande – det lägger redaktören till själv. Använd INTE halvlångt tankstreck (–) i texten – det hör inte hemma i den här stilen. Svara ENDAST med inledningen, ingen förklaring.`,
      },
    ],
  });

  const text = msg.content[0];
  if (text.type !== 'text') throw new Error('Unexpected response from Claude');
  return text.text.trim();
}

// ─── Ämnesrader ───────────────────────────────────────────────────────────────

/** Hämtar top-20 ämnesrads-exempel från Supabase (lazy import för att undvika cirkulär dep) */
export async function fetchSubjectExamples(): Promise<string[]> {
  try {
    const { supabase } = await import('./supabase');
    const { data } = await supabase
      .from('subject_line_examples')
      .select('subject_line, open_rate')
      .order('open_rate', { ascending: false })
      .limit(20);
    return (data ?? []).map(
      (r: { subject_line: string; open_rate: number }) =>
        `${r.open_rate}% | ${r.subject_line}`
    );
  } catch {
    return [];
  }
}

/**
 * Kortar ned artikelrubriker till superkorta innehållsförteckningsetiketter (4–6 ord).
 * Returnerar en array i samma ordning som inmatningen.
 */
export async function generateTocLabels(
  articles: Array<{ title: string; ingress?: string }>
): Promise<string[]> {
  const list = articles
    .map((a, i) => `${i + 1}. RUBRIK: ${a.title}${a.ingress ? `\n   INGRESS: ${a.ingress}` : ''}`)
    .join('\n');

  const msg = await getClient().messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 200,
    messages: [
      {
        role: 'user',
        content: `Skriv superkorta innehållsförteckningsetiketter för dessa artiklar. Max 6 ord per rad.

REGLER:
- Fånga kärnan på 4–6 ord, som en skarp teaserrad
- INGA prefix som "GENOMGÅNG:", "INTERVJU:", "JUST NU:" – de tar plats och ska inte användas
- Inga punkter, inga citat, inga emojis
- Skriv på svenska

EXEMPEL på rätt format:
De har lockat mest kapital
Så sparade Voi miljoner med AI
Recoma tar in 14 miljoner
Han byggde om bolaget med AI

ARTIKLAR:
${list}

Svara ENBART med en etikett per rad, i samma ordning, utan numrering.`,
      },
    ],
  });

  const text = msg.content[0];
  if (text.type !== 'text') return articles.map((a) => a.title);

  const lines = text.text
    .trim()
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  // Fyll på med original om något saknas
  return articles.map((a, i) => lines[i] ?? a.title);
}

/**
 * Bygger preheader-texten: "Och: [ämnesrad 2 utan emoji]"
 * Syns i inkorgen under ämnesraden och kompletterar den.
 */
export function buildPreheader(subjectOptions: [string, string, string]): string {
  const second = subjectOptions[1] ?? subjectOptions[0];
  // Ta bort ledande emoji (unicode emoji-tecken + eventuellt mellanslag)
  const withoutEmoji = second.replace(/^[\p{Emoji}\uFE0F\u200D\s]+/u, '').trim();
  return `Och: ${withoutEmoji}`;
}

/**
 * Genererar 3 alternativa ämnesrader för dagens nyhetsbrev.
 * Använder top-20 historiska exempel från Supabase som few-shot-träning.
 */
export async function generateSubjectLines(
  articles: SanityArticle[]
): Promise<[string, string, string]> {
  const articleSummary = articles
    .map((a, i) => `${i + 1}. ${a.title}: ${a.ingress}`)
    .join('\n');

  const examples = await fetchSubjectExamples();
  const examplesBlock =
    examples.length > 0
      ? `\nHär är de 20 bäst presterande ämnesraderna från Impact Loops historik (öppningsfrekvens | ämnesrad):\n${examples.join('\n')}\n\nStudera mönstren: emoji i början, konkreta siffror, citat med spänning, namngivna bolag/personer, kontrast/konflikt, max ~65 tecken.\n`
      : '';

  const msg = await getClient().messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 200,
    messages: [
      {
        role: 'user',
        content: `Du skriver ämnesrader för Impact Loops dagliga nyhetsbrev om hållbart näringsliv i Sverige.
${examplesBlock}
Artiklarna idag:
${articleSummary}

Generera exakt 3 ämnesrader i Impact Loops stil. Regler:
- Börja med en relevant emoji
- Max 65 tecken per rad
- Konkret och nyfikenhetsskapande
- FÖRBJUDET: påhittade formuleringar, ord eller fraser som inte finns i artiklarna
- Variera stil: en med siffra/fakta, en med kontrast eller paradox, en mer berättande vinkel
- Svenska, namnge gärna bolag/personer när det stämmer med artikeln
- Använd BARA information som faktiskt finns i artikeltexterna ovan

Svara ENBART med de 3 ämnesraderna, en per rad, utan numrering eller förklaring.`,
      },
    ],
  });

  const text = msg.content[0];
  if (text.type !== 'text') throw new Error('Unexpected response from Claude');

  const lines = text.text
    .trim()
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length < 3) {
    // Pad with copies if needed
    while (lines.length < 3) lines.push(lines[0] ?? 'Impact Loop idag');
  }

  return [lines[0], lines[1], lines[2]];
}

// ─── Impact-svepet ────────────────────────────────────────────────────────────

interface SvepetExample {
  headline: string;
  items: Array<{ emoji: string; boldTitle: string; body: string }>;
}

/** Hämtar de 20 senaste svepet-exemplen från Supabase */
async function fetchSvepetExamples(): Promise<SvepetExample[]> {
  try {
    const { supabase } = await import('./supabase');
    const { data } = await supabase
      .from('svepet_examples')
      .select('headline, items')
      .order('send_time', { ascending: false })
      .limit(20);
    return (data ?? []) as SvepetExample[];
  } catch {
    return [];
  }
}

/**
 * Genererar Impact-svepet från nyhetsflödet.
 * Tar emot färdiga nyhetsobjekt, väljer de 3 bästa enligt Impact Loops
 * redaktionella kriterier och formaterar dem i rätt stil.
 * Använder 20 historiska svepet-exempel som few-shot-kontext.
 */
export async function generateImpactSvepet(
  newsItems: NewsFeedItem[],
  mustInclude: string[] = []
): Promise<SvepetResult> {
  const examples = await fetchSvepetExamples();

  const examplesBlock =
    examples.length > 0
      ? `\nHär är ${examples.length} verkliga Impact-svepet från tidigare nyhetsbrev. Studera format, längd och ton exakt:\n\n${examples
          .map(
            (e, i) =>
              `EXEMPEL ${i + 1} – "${e.headline}":\n${e.items
                .map((it) => `• ${it.emoji} **${it.boldTitle}** – ${it.body}`)
                .join('\n')}`
          )
          .join('\n\n')}\n`
      : '';

  // Begränsa till 60 nyheter för att hålla prompten rimlig
  const candidates = newsItems.slice(0, 60);
  const newsBlock =
    candidates.length > 0
      ? candidates
          .map(
            (n, i) =>
              `${i + 1}. [${n.source}] ${n.title}${n.description ? ' – ' + n.description : ''}\n   Länk: ${n.link}`
          )
          .join('\n')
      : '(Inga nyheter tillgängliga)';

  const mustIncludeBlock = mustInclude.length > 0
    ? `\nOBLIGATORISKT: Redaktören har angett att svepet MÅSTE inkludera en nyhet om: ${mustInclude.map(h => `"${h}"`).join(', ')}. Hitta den/de bäst matchande nyheterna i listan nedan och inkludera dem. Övriga platser väljer du fritt.\n`
    : '';

  const msg = await getClient().messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 700,
    messages: [
      {
        role: 'user',
        content: `Du skriver "Impact-svepet" för Impact Loops dagliga nyhetsbrev – tre korta hållbarhetsnyheter.
${mustIncludeBlock}

Impact Loop riktar sig till svenska impact-bolag, entreprenörer och investerare. De vill veta vad som händer i sin bransch och omvärld – inte allmän klimatupplysning.

PRIORITERA (i ordning):
1. Svenska/nordiska aktörer med konkret nyhet (raise, lansering, partnerskap, personbyte)
2. Rapporter/studier med siffror och affärsrelevans för svenska läsare
3. Kända internationella bolag med branschnyhet (Mondelēz, H&M, IKEA etc.)
4. EU/policy med direkt konsekvens för svenska bolag

VÄLJ BORT: allmänpolitik utan impact/hållbarhets-vinkel, stora börsbolag utan hållbarhetsvinkel, USA/Trump/Kina, naturkatastrofer utan marknadskoppling, livsstilsråd. VÄLJ OCKSÅ BORT: pressmeddelanden som bara är certifieringsbesked, märkningsbesked eller liknande utan konkret affärsnyhet (ny produkt, ny tjänst, ny investering, nytt partnerskap, ny studie med siffror).

Internationella nyheter är bara relevanta om de rör ett specifikt känt bolag, en rapport med konkreta siffror, eller en trend som direkt berör svenska investerare/startups.

Skriv enkelt och rakt på sak – alltid med impact-entreprenören eller investeraren som tilltänkt läsare.
Skriv ut förkortningar som inte är allmänt kända.
${examplesBlock}
Välj de 3 bästa nyheterna och skriv dem i Impact Loops stil. Inkludera ALLTID källans länk och namn i JSON-svaret.

ABSOLUT KRAV – DIVERSITET: De tre notiserna MÅSTE handla om tre olika bolag/organisationer/ämnen. Det är förbjudet att ta med två nyheter om samma person, bolag eller ämne – även om det finns flera artiklar om dem i listan. Välj i så fall den bästa av dem och hitta ett annat ämne till de övriga platserna.

TILLGÄNGLIGA NYHETER (nummer, källa, rubrik, beskrivning, länk):
${newsBlock}

Regler för formatet:
- Överskrift: 3–5 ord specifikt för dagens tema (aldrig "Hållbarhet idag")
- Emoji: matchar ämnet exakt
- Fet rubrik: max 7 ord, konkret och nyhetsdriven
- Brödtext: MAX EN mening, ca 15–20 ord. Kärnan i nyheten + källa. Ingenting mer. Exempel: "Snacksjätten Mondelēz har skapat världens första chokladkakor med cellbaserat kakaosmör, skriver Green Queen." INTE två meningar, INTE bakgrund, INTE förklaringar.
- link: exakt URL från nyhetslistan
- source: EXAKT samma text som du skriver i brödtexten (t.ex. om du skriver "rapporterar Di" → source: "Di", om du skriver "skriver Green Queen" → source: "Green Queen", om du skriver "enligt DN" → source: "DN")
- Mixa gärna: ett bolag/startup + en rapport + ett EU/branschnyhet

Svara ENBART i detta JSON-format:
{
  "headline": "...",
  "items": [
    {"emoji": "...", "boldTitle": "...", "body": "...", "link": "https://...", "source": "..."},
    {"emoji": "...", "boldTitle": "...", "body": "...", "link": "https://...", "source": "..."},
    {"emoji": "...", "boldTitle": "...", "body": "...", "link": "https://...", "source": "..."}
  ]
}`,
      },
    ],
  });

  const text = msg.content[0];
  if (text.type !== 'text') throw new Error('Unexpected response from Claude');

  const jsonMatch = text.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Ingen JSON i svaret');

  try {
    const result = JSON.parse(jsonMatch[0]) as SvepetResult;
    if (!result.headline || !Array.isArray(result.items) || result.items.length < 3) {
      throw new Error('Ogiltigt svepet-format');
    }
    return result;
  } catch {
    return {
      headline: 'Hållbarhet idag',
      items: [
        { emoji: '🌿', boldTitle: candidates[0]?.title ?? 'Nyhet 1', body: candidates[0]?.description ?? '' },
        { emoji: '⚡', boldTitle: candidates[1]?.title ?? 'Nyhet 2', body: candidates[1]?.description ?? '' },
        { emoji: '💰', boldTitle: candidates[2]?.title ?? 'Nyhet 3', body: candidates[2]?.description ?? '' },
      ],
    };
  }
}

// ─── HTML-builder för svepet ──────────────────────────────────────────────────

/**
 * Bygger impactsvepet_placeholder HTML (exakt GAS-format).
 */
export function buildSvepetHtml(svepet: SvepetResult): string {
  const { headline, items } = svepet;
  const item1 = items[0] ?? { emoji: '', boldTitle: '', body: '' };
  const item2 = items[1] ?? { emoji: '', boldTitle: '', body: '' };
  const item3 = items[2] ?? { emoji: '', boldTitle: '', body: '' };

  function renderItem(item: SvepetItem, isLast: boolean): string {
    let body = item.body;
    // Länka källnamnet där det förekommer i brödtexten (t.ex. "skriver Green Queen" → "skriver <a>Green Queen</a>")
    if (item.link && item.source) {
      const escaped = item.source.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      body = body.replace(
        new RegExp(escaped),
        `<a href="${item.link}" target="_blank" style="color:#557755;">${item.source}</a>`
      );
    }
    const pClass = isLast ? ' class="last-child"' : '';
    return `<p${pClass}><strong>${item.emoji} ${item.boldTitle}.</strong> ${body}</p>`;
  }

  return `<tr><td style="padding-top:0;padding-bottom:0;padding-right:0;padding-left:0" valign="top"><table width="100%" style="border:0;border-radius:0;border-collapse:separate"><tbody><tr><td style="padding-left:24px;padding-right:24px;padding-top:12px;padding-bottom:12px" class="mceTextBlockContainer"><div data-block-id="727" class="mceText" id="dataBlockId-727" style="width:100%"><p class="last-child"><span style="color:#e2baba;">IMPACT-SVEPET</span></p></div></td></tr></tbody></table></td></tr><tr><td style="padding-top:0;padding-bottom:0;padding-right:0;padding-left:0" valign="top"><table width="100%" style="border:0;border-radius:0;border-collapse:separate"><tbody><tr><td style="padding-left:24px;padding-right:24px;padding-top:0;padding-bottom:12px" class="mceTextBlockContainer"><div data-block-id="801" class="mceText" id="dataBlockId-801" style="width:100%"><h1 class="last-child">${headline} \u2013 tre saker att ha koll p\u00e5 idag</h1></div></td></tr></tbody></table></td></tr><tr><td style="padding-top:0;padding-bottom:0;padding-right:0;padding-left:0" valign="top"><table width="100%" style="border:0;border-radius:0;border-collapse:separate"><tbody><tr><td style="padding-left:24px;padding-right:24px;padding-top:12px;padding-bottom:12px" class="mceTextBlockContainer"><div data-block-id="721" class="mceText" id="dataBlockId-721" style="width:100%">${renderItem(item1, false)}<p><br></p>${renderItem(item2, false)}<p><br></p>${renderItem(item3, true)}</div></td></tr></tbody></table></td></tr><tr><td style="background-color:transparent;padding-top:20px;padding-bottom:20px;padding-right:24px;padding-left:24px" class="mceBlockContainer" valign="top"><table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:transparent;width:100%" role="presentation" class="mceDividerContainer" data-block-id="709"> <tbody><tr><td style="min-width:100%;border-top-width:1px;border-top-style:solid;border-top-color:#e5e6d2" class="mceDividerBlock" valign="top"></td></tr></tbody></table></td></tr>`;
}

// ─── HTML-builder för funding rounds ─────────────────────────────────────────

/**
 * Bygger fundingrounds_placeholder HTML.
 * isBetalande = true → visar texten; false → visar "bli medlem"-bild
 */
export function buildFundingHtml(
  fundingText: string,
  isBetalande: boolean
): string {
  if (isBetalande && fundingText) {
    return `<tr>
    <td style="padding-top:0;padding-bottom:0;padding-right:0;padding-left:0" valign="top"><table width="100%" style="border:0;border-radius:0;border-collapse:separate"><tbody><tr><td style="padding-left:24px;padding-right:24px;padding-top:0;padding-bottom:12px" class="mceTextBlockContainer"><div data-block-id="723" class="mceText" id="dataBlockId-723" style="width:100%"><h1 class="last-child">Nya rundor och aff\u00e4rer</h1></div></td></tr></tbody></table></td></tr><tr><td style="padding-top:0;padding-bottom:0;padding-right:0;padding-left:0" valign="top"><table width="100%" style="border:0;border-radius:0;border-collapse:separate"><tbody><tr><td style="padding-left:24px;padding-right:24px;padding-top:12px;padding-bottom:12px" class="mceTextBlockContainer"><div data-block-id="668" class="mceText" id="dataBlockId-668" style="width:100%"><p>${fundingText}</p></div></td></tr></tbody></table></td></tr><tr><td style="padding-top:0;padding-bottom:0;padding-right:0;padding-left:0" valign="top"><table width="100%" style="border:0;border-radius:0;border-collapse:separate"><tbody><tr><td style="padding-left:24px;padding-right:24px;padding-top:12px;padding-bottom:12px" class="mceTextBlockContainer"><div data-block-id="743" class="mceText" id="dataBlockId-743" style="width:100%"><p class="last-child"><em>Alla siffror \u00e4r v\u00e4rdering f\u00f6re kapitalanskaffning (pre-money) om det inte st\u00e5r n\u00e5got annat. Tips? Maila oss p\u00e5 </em><a href="mailto:impact@loop.se"><em>impact@loop.se</em></a><em>.</em></p></div></td></tr>`;
  }
  // Gratis-segment: visa "bli medlem"-bild
  return '<tr><td style="padding-top:0;padding-bottom:0;padding-right:0;padding-left:0" valign="top"><table width="100%" style="border:0;border-radius:0;border-collapse:separate"><tbody><tr><td style="padding-left:24px;padding-right:24px;padding-top:12px;padding-bottom:12px" class="mceTextBlockContainer"><div data-block-id="668" class="mceText" id="dataBlockId-668" style="width:100%"><a href="https://www.impactloop.se/pris?utm_source=nyhetsbrev&utm_medium=kapitalrundor" target="_blank" style="display:inline-block"><img src="https://mcusercontent.com/46f8b3dcdd581118cad2f80ee/images/650757d6-8704-1a97-eb84-fab972eebcc2.png" alt="Bli medlem" style="max-width:100%; height:auto; border:0; display:block;"></a></div></td></tr></tbody></table></td></tr>';
}

// ─── HTML-builder för möten ───────────────────────────────────────────────────

/**
 * Bygger meetups_placeholder HTML (exakt GAS-format: <p><strong>titel</strong></p><p>info</p>).
 */
export function buildMeetupsHtml(
  meetups: Array<{ title: string; info: string }>
): string {
  if (!meetups.length) return '';
  const parts = meetups.map(
    (m, i) =>
      `<p><strong>${m.title}</strong></p><p${i === meetups.length - 1 ? ' class="last-child"' : ''}>${m.info}</p>${i < meetups.length - 1 ? '<p><br /></p>' : ''}`
  );
  return parts.join('');
}

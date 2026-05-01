// lib/placeholders.ts
// Bygger alla [[placeholder_name]]-värden från strukturerad data.
// Används av /api/collect för att skapa utkastet.

import type { SanityArticle } from './sanity';
import type { MostReadArticle } from './analytics';
import type { Editor } from './editors';
import type { SvepetResult } from './ai';
import type { SvepetData } from './supabase';
import { buildSvepetHtml, buildFundingHtml, buildMeetupsHtml, buildPreheader } from './ai';
import { buildFundingTableHtml } from './funding';
import type { FundingRow } from './funding';
import { buildMostReadHtml } from './analytics';

export interface NewsletterDraftData {
  // Redaktör
  editor: Editor;

  // Ämnesradsalternativ (3 st, väljs i dashboard)
  subjectOptions: [string, string, string];

  // Intro (AI-genererad, redigerbar i dashboard)
  intro: string;

  // Huvud-artiklar
  article1: SanityArticle;
  article2: SanityArticle;
  article3?: SanityArticle; // valfri tredje artikel

  // Impact-svepet
  svepet: SvepetResult | SvepetData;

  // Kapitalrundor
  fundingRows: FundingRow[]; // structured rows → HTML built at send time
  isBetalande: boolean; // true = betalande segment

  // Mest läst
  mostRead: MostReadArticle[];

  // PS-artikel
  psArticle?: {
    title: string;
    url: string;
    imageUrl: string;
  };

  // Meetups
  meetups: Array<{ title: string; info: string }>;

  // Korta innehållsförteckningsetiketter (AI-genererade)
  tocLabels?: string[];

  // Sponsor/teknik (ja/nej-toggle i dashboard)
  sponsorActive: boolean;
  teknikActive: boolean;

  // Datum
  date: Date;
}

export interface PlaceholderMap {
  [key: string]: string;
}

/**
 * Bygger den fullständiga platshållar-mappen för ett nyhetsbrev.
 * Returnerar ett objekt med [[key]] → HTML-sträng.
 */
export function buildPlaceholders(data: NewsletterDraftData): PlaceholderMap {
  const {
    editor,
    subjectOptions,
    intro,
    article1,
    article2,
    article3,
    svepet,
    fundingRows,
    isBetalande,
    mostRead,
    psArticle,
    meetups,
    tocLabels,
    sponsorActive,
    teknikActive,
    date,
  } = data;

  // Välj första ämnesraden som default (redaktören väljer i dashboard)
  const subject = subjectOptions[0];
  // Preheader = "Och: [ämnesrad 2 utan emoji]" — kompletterar ämnesraden i inkorgen
  const previewText = buildPreheader(subjectOptions);

  // Tabell med innehåll (artiklar + svepet-rubrik)
  const toc = buildTableOfContents(
    [article1, article2, article3].filter(Boolean) as SanityArticle[],
    svepet,
    tocLabels ?? []
  );

  // Artikel 3 HTML-block
  const article3Html = article3 ? buildArticle3Html(article3) : ' ';

  // Impact-svepet
  const svepetHtml = buildSvepetHtml(svepet);

  // Funding rounds: build HTML from structured rows, then apply free/paid logic
  const fundingTableHtml = buildFundingTableHtml(fundingRows);
  const fundingHtml = buildFundingHtml(fundingTableHtml, isBetalande);

  // Mest läst
  const mostReadHtml = buildMostReadHtml(mostRead);

  // Meetups
  const meetupsHtml = buildMeetupsHtml(meetups);

  // Sponsor (tom sträng = av)
  const sponsorHtml = sponsorActive
    ? '<tr><td style="padding-top:12px;padding-bottom:12px;padding-right:0;padding-left:0" class="mceBlockContainer" align="center" valign="top"><a href="https://www.innoenergy.com/" style="display:block" target="_blank" data-block-id="800"><span class="mceImageBorder" style="border:0;border-radius:0;vertical-align:top;margin:0"><img width="462" height="auto" style="width:462px;height:auto;max-width:660px !important;border-radius:0;display:block" alt="" src="https://mcusercontent.com/46f8b3dcdd581118cad2f80ee/images/4ee70486-ab4b-163c-643f-7cb6302d3664.png" role="presentation" class="imageDropZone mceImage"></span></a></td></tr><tr><td style="background-color:#f4f4f4" valign="top"><table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" data-block-id="795"><tbody><tr><td class="mceSpacerBlock" height="20" valign="top"></td></tr></tbody></table></td></tr>'
    : ' ';

  const teknikHtml = teknikActive
    ? `\n<tr>\n  <td style="background-color:transparent;padding-top:20px;padding-bottom:20px;padding-right:24px;padding-left:24px" class="mceBlockContainer" valign="top">\n    <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:transparent;width:100%" role="presentation" class="mceDividerContainer">\n      <tbody>\n        <tr>\n          <td style="min-width:100%;border-top-width:1px;border-top-style:solid;border-top-color:#e5e6d2" class="mceDividerBlock" valign="top"></td>\n        </tr>\n      </tbody>\n    </table>\n  </td>\n</tr>`
    : '';

  const divider = `<tr><td style="background-color:transparent;padding-top:20px;padding-bottom:20px;padding-right:24px;padding-left:24px" class="mceBlockContainer" valign="top"><table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:transparent;width:100%" role="presentation" class="mceDividerContainer"><tbody><tr><td style="min-width:100%;border-top-width:1px;border-top-style:solid;border-top-color:#e5e6d2;line-height:0;font-size:0" valign="top" class="mceDividerBlock">&nbsp;</td></tr></tbody></table></td></tr>`;

  // Subscription upsell: shown between article 1 and article 2 for free subscribers only.
  // Paid subscribers just get a divider.
  const subscriptionMessageHtml = isBetalande
    ? divider
    : `${divider}
  <tr>
    <td style="padding-top:0;padding-bottom:0;padding-right:12px;padding-left:12px" valign="top">
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:separate" role="presentation">
        <tbody>
          <tr>
            <td style="padding-top:0;padding-bottom:0;padding-right:0;padding-left:0" valign="top">
              <table width="100%" style="border:0;background-color:#f2f2f2;border-radius:10px;border-collapse:separate">
                <tbody>
                  <tr>
                    <td style="padding-left:24px;padding-right:24px;padding-top:12px;padding-bottom:12px" class="mceTextBlockContainer">
                      <div class="mceText" style="width:100%">
                        <p class="last-child"><strong>Follow the lead of Europe's smartest impact investors</strong> by joining Impact Loop! Daily independent journalism to keep you in the loop. Get your <a href="https://www.impactloop.com/subscribe?utm_source=newsletter&amp;utm_medium=text-block">subscription plan here</a>!</p>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
        </tbody>
      </table>
    </td>
  </tr>
  ${divider}`;

  return {
    '[[subjectfield_placeholder]]': subject,
    '[[previewtext_placeholder]]': previewText,
    '[[nameofnewsletter_placeholder]]': 'Impact Loop VC',
    '[[tableofcontents_placeholder]]': toc,

    // Redaktör
    '[[editor_placeholder]]': editor.name,
    '[[editoremail_placeholder]]': editor.email,
    '[[editorimage_placeholder]]': editor.imageUrl,
    '[[intro_placeholder]]': intro
      .replace(/\n/g, '<br>')
      .replace(/^Godmorgon!/, '<strong>Godmorgon!</strong>')
      .replace(/^Good morning!/, '<strong>Good morning!</strong>'),

    // Sponsor / teknik / subscription upsell
    '[[sponsor_placeholder]]': sponsorHtml,
    '[[teknik_placeholder]]': teknikHtml,
    '[[subscriptionmessage_placeholder]]': subscriptionMessageHtml,

    // Artikel 1
    '[[headline1_placeholder]]': article1.title,
    '[[articleimage1_placeholder]]': article1.mainImageUrl,
    '[[imagetext1_placeholder]]': article1.imageCaption,
    '[[ingress1_placeholder]]': formatIngress(article1.ingress),
    '[[readinglink1_placeholder]]': article1.url,
    '[[category1_placeholder]]': article1.category,

    // Artikel 2
    '[[headline2_placeholder]]': article2.title,
    '[[articleimage2_placeholder]]': article2.mainImageUrl,
    '[[imagetext2_placeholder]]': article2.imageCaption,
    '[[ingress2_placeholder]]': formatIngress(article2.ingress),
    '[[readinglink2_placeholder]]': article2.url,
    '[[category2_placeholder]]': article2.category,

    // Artikel 3 (valfri)
    '[[article3_placeholder]]': article3Html,

    // Impact-svepet
    '[[impactsvepet_placeholder]]': svepetHtml,

    // Kapitalrundor
    '[[fundingrounds_placeholder]]': fundingHtml,

    // Mest läst
    '[[mostread_placeholder]]': mostReadHtml,

    // PS-artikel
    '[[psarticletitle_placeholder]]': psArticle?.title ?? '',
    '[[psarticlelink_placeholder]]': psArticle?.url ?? '',
    '[[psarticleimage_placeholder]]': psArticle?.imageUrl ?? '',

    // Meetups
    '[[meetups_placeholder]]': meetupsHtml,

    // Related (töms tills vidare)
    '[[related1_placeholder]]': '',
    '[[related2_placeholder]]': '',
  };
}

// ─── Hjälpfunktioner ──────────────────────────────────────────────────────────

/**
 * Konverterar \n\n till dubbelt radavstånd (tomt stycke emellan)
 * och \n till enkelt radavstånd (<br>).
 * Bibehåller bold-formateringen runt varje stycke.
 */
function formatIngress(text: string): string {
  return text
    .split('\n\n')
    .map(para => para.replace(/\n/g, '<br>'))
    .join('</strong></p><p><br></p><p><strong>');
}

// Emojis att rotera för artiklar (väljs baserat på kategori eller index)
const ARTICLE_EMOJIS = ['📣', '👁️', '💡', '🔍', '📊', '🌍', '⚡', '🏭', '💰', '🌱'];

function pickEmoji(article: SanityArticle, index: number): string {
  const cat = (article.category ?? '').toLowerCase();
  if (cat.includes('energi') || cat.includes('energy')) return '⚡';
  if (cat.includes('invest') || cat.includes('kapital') || cat.includes('capital') || cat.includes('venture')) return '💰';
  if (cat.includes('klimat') || cat.includes('climate')) return '🌍';
  if (cat.includes('teknik') || cat.includes('tech')) return '💡';
  if (cat.includes('mode') || cat.includes('textil') || cat.includes('fashion')) return '👗';
  if (cat.includes('mat') || cat.includes('livsmedel') || cat.includes('food')) return '🍽️';
  return ARTICLE_EMOJIS[index % ARTICLE_EMOJIS.length];
}

function buildTableOfContents(
  articles: SanityArticle[],
  svepet: SvepetResult | SvepetData,
  tocLabels: string[]
): string {
  const articleItems = articles.map((a, i) => {
    const label = tocLabels[i] ?? a.title;
    return `${pickEmoji(a, i)} ${label}`;
  });

  // Svepet-rad: svepetets första emoji + headline (ingen länk)
  const svepetEmoji = (svepet as SvepetResult).items?.[0]?.emoji ?? '📰';
  const svepetItem1Title = (svepet as SvepetResult).items?.[0]?.boldTitle ?? (svepet as SvepetData).items?.[0]?.boldTitle ?? '';
  if (svepetItem1Title) articleItems.push(`${svepetEmoji} ${svepetItem1Title}`);

  return articleItems.map(item => `<p>${item}</p>`).join('\n');
}

function buildArticle3Html(article: SanityArticle): string {
  return `<tr>
        <td style="background-color:transparent;padding-top:20px;padding-bottom:20px;padding-right:24px;padding-left:24px"
            class="mceBlockContainer"
            valign="top">
            <table
                align="center"
                border="0"
                cellpadding="0"
                cellspacing="0"
                width="100%"
                style="background-color:transparent;width:100%"
                role="presentation"
                class="mceDividerContainer"
                data-block-id="726">
                <tbody>
                    <tr>
                        <td style="min-width:100%;border-top-width:1px;border-top-style:solid;border-top-color:#e5e6d2"
                            class="mceDividerBlock"
                            valign="top">
                        </td>
                    </tr>
                </tbody>
            </table>
        </td>
    </tr>
    <tr>
        <td style="padding-top:0;padding-bottom:0;padding-right:0;padding-left:0"
            valign="top">
            <table
                width="100%"
                style="border:0;border-radius:0;border-collapse:separate">
                <tbody>
                    <tr>
                        <td style="padding-left:24px;padding-right:24px;padding-top:12px;padding-bottom:12px"
                            class="mceTextBlockContainer">
                            <div data-block-id="747"
                                class="mceText"
                                id="dataBlockId-747"
                                style="width:100%">
                                <p class="last-child">
                                    <span style="color:#d0c4de;text-transform:uppercase;">${article.category}</span>
                                </p>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </td>
    </tr>
    <tr>
        <td style="padding-top:0;padding-bottom:0;padding-right:0;padding-left:0"
            valign="top">
            <table
                width="100%"
                style="border:0;border-radius:0;border-collapse:separate">
                <tbody>
                    <tr>
                        <td style="padding-left:24px;padding-right:24px;padding-top:0;padding-bottom:12px"
                            class="mceTextBlockContainer">
                            <div data-block-id="748"
                                class="mceText"
                                id="dataBlockId-748"
                                style="width:100%">
                                <h1 class="last-child">${article.title}</h1>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </td>
    </tr>
    <tr>
        <td style="padding-top:12px;padding-bottom:12px;padding-right:0;padding-left:0"
            class="mceBlockContainer" align="left" valign="top">
            <a href="${article.url}" style="display:block" target="_blank" data-block-id="749">
                <span class="mceImageBorder" style="border:0;border-radius:0;vertical-align:top;margin:0">
                    <img width="660" height="auto" style="width:660px;height:auto;max-width:900px !important;border-radius:0;display:block"
                        alt="" src="${article.mainImageUrl}" role="presentation" class="imageDropZone mceImage">
                </span>
            </a>
        </td>
    </tr>
    <tr>
        <td style="padding-top:0;padding-bottom:0;padding-right:0;padding-left:0"
            valign="top">
            <table
                width="100%"
                style="border:0;border-radius:0;border-collapse:separate">
                <tbody>
                    <tr>
                        <td style="padding-left:24px;padding-right:24px;padding-top:0;padding-bottom:12px"
                            class="mceTextBlockContainer">
                            <div data-block-id="750"
                                class="mceText"
                                id="dataBlockId-750"
                                style="width:100%">
                                <p style="text-align: right;" class="last-child">
                                    <em><span style="font-size: 14px">${article.imageCaption}</span></em>
                                </p>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </td>
    </tr>
    <tr>
        <td style="padding-top:0;padding-bottom:0;padding-right:0;padding-left:0"
            valign="top">
            <table
                width="100%"
                style="border:0;border-radius:0;border-collapse:separate">
                <tbody>
                    <tr>
                        <td style="padding-left:24px;padding-right:24px;padding-top:12px;padding-bottom:12px"
                            class="mceTextBlockContainer">
                            <div data-block-id="751"
                                class="mceText"
                                id="dataBlockId-751"
                                style="width:100%">
                                <p><strong>${formatIngress(article.ingress)}</strong></p><br>
                                <p class="last-child">
                                    <a href="${article.url}" target="_blank"><strong>Read the article here ---&gt;</strong></a>
                                </p>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </td>
    </tr>`;
}

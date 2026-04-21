// lib/slack-instructions.ts
// Parsar Slack-instruktioner med Claude och löser upp artiklar via Sanity-sökning.

import Anthropic from '@anthropic-ai/sdk';
import { searchArticles } from './sanity';
import { EDITORS } from './editors';
import type { Editor } from './editors';

function getClient() {
  return new Anthropic({ apiKey: process.env.IL_ANTHROPIC_KEY });
}

export interface ParsedInstruction {
  editorName?: string;
  articleFragments: string[];
  psFragment?: string;
  svepHints?: string[];
  swapArticle?: {
    position: 1 | 2 | 3; // 1 = översta, 2 = andra, 3 = tredje
    fragment: string;     // del av artikelrubriken att söka efter
  };
}

export interface ResolvedInstruction {
  editorOverride?: Editor;
  articleIds: string[];
  psArticleId?: string;
  svepHints: string[];
  rawText: string;
  confirmationLines: string[];
  swapArticle?: {
    position: 1 | 2 | 3;
    articleId: string;
    articleTitle: string;
  };
}

// ─── Steg 1: Låt Claude extrahera strukturen ur fri text ─────────────────────

export async function parseInstruction(text: string): Promise<ParsedInstruction | null> {
  const client = getClient();

  const response = await client.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 400,
    messages: [
      {
        role: 'user',
        content: `Du är ett verktyg som analyserar instruktioner till ett nyhetsbrev.

Redaktörerna heter: Andreas Jennische, Jenny Kjellén, Johann Bernövall, Camilla Bergman.
Sätt editorName ENDAST om ett av dessa namn nämns explicit.
Artikelfragment är rubriker eller delar av artikelrubriker — INTE personnamn som inte är redaktörer ovan.

Extrahera dessa fält (utelämna fält som inte nämns):
- editorName: string — ENDAST om en av redaktörerna ovan nämns
- articleFragments: string[] — delar av artikelrubriker att använda i brevet (1–3 st)
- psFragment: string — del av PS-artikelns rubrik
- svepHints: string[] — om användaren vill att Impact-svepet SKA inkludera en specifik nyhet. Varje hint är en kort beskrivning av nyheten/ämnet/bolaget (t.ex. "Northvolt", "Volvo cars batterier", "EU taxonomi"). Används när instruktionen nämner svepet, svepnyheter eller liknande.
- swapArticle: { position: 1|2|3, fragment: string } — om användaren vill BYTA UT en specifik artikel i ett redan byggt brev. position 1 = översta/första artikeln, 2 = andra, 3 = tredje. fragment = del av den nya artikelns rubrik.

swapArticle används BARA när instruktionen handlar om att byta ut en artikel i ett befintligt brev (t.ex. "byt översta artikeln mot X", "ersätt artikel 2 med Y", "byt ut den första mot Z").
articleFragments används när man bygger ett nytt brev från grunden.

Returnera ENDAST giltig JSON. Om meddelandet inte handlar om nyhetsbrev, returnera null.

Meddelande: """${text}"""`,
      },
    ],
  });

  const raw = response.content[0];
  if (raw.type !== 'text') return null;

  try {
    const trimmed = raw.text.trim();
    if (trimmed === 'null') return null;
    // Plocka ut JSON om Claude svarade med markdown-block
    const jsonMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/) ;
    const jsonStr = jsonMatch ? jsonMatch[1] : trimmed;
    return JSON.parse(jsonStr) as ParsedInstruction;
  } catch {
    return null;
  }
}

// ─── Steg 2: Slå upp redaktör på namn ─────────────────────────────────────────

export function findEditorByName(name: string): Editor | null {
  const lower = name.toLowerCase();
  for (const editor of Object.values(EDITORS)) {
    const firstName = editor.name.split(' ')[0].toLowerCase();
    if (
      editor.name.toLowerCase().includes(lower) ||
      lower.includes(firstName)
    ) {
      return editor;
    }
  }
  return null;
}

// ─── Steg 3: Lös upp fragment → Sanity-artikel-ID:n ──────────────────────────

export async function resolveInstruction(
  parsed: ParsedInstruction,
  rawText: string
): Promise<ResolvedInstruction> {
  const result: ResolvedInstruction = {
    articleIds: [],
    svepHints: parsed.svepHints ?? [],
    rawText,
    confirmationLines: [],
  };

  // Svep-hints
  if (result.svepHints.length > 0) {
    result.confirmationLines.push(`✅ *Svep-hints:* ${result.svepHints.join(', ')}`);
  }

  // Redaktör
  if (parsed.editorName) {
    const editor = findEditorByName(parsed.editorName);
    if (editor) {
      result.editorOverride = editor;
      result.confirmationLines.push(`✅ *Redaktör:* ${editor.name}`);
    } else {
      result.confirmationLines.push(`⚠️ Hittade ingen redaktör som matchar "${parsed.editorName}"`);
    }
  }

  // Artiklar
  for (const fragment of parsed.articleFragments ?? []) {
    const hits = await searchArticles(fragment, 5);
    if (hits.length > 0) {
      result.articleIds.push(hits[0]._id);
      result.confirmationLines.push(`✅ *Artikel:* ${hits[0].title}`);
    } else {
      result.confirmationLines.push(`⚠️ Hittade ingen artikel för "${fragment}"`);
    }
  }

  // PS-artikel
  if (parsed.psFragment) {
    const hits = await searchArticles(parsed.psFragment, 5);
    if (hits.length > 0) {
      result.psArticleId = hits[0]._id;
      result.confirmationLines.push(`✅ *PS-artikel:* ${hits[0].title}`);
    } else {
      result.confirmationLines.push(`⚠️ Hittade ingen PS-artikel för "${parsed.psFragment}"`);
    }
  }

  // Byt artikel
  if (parsed.swapArticle) {
    const hits = await searchArticles(parsed.swapArticle.fragment, 5);
    if (hits.length > 0) {
      result.swapArticle = {
        position: parsed.swapArticle.position,
        articleId: hits[0]._id,
        articleTitle: hits[0].title,
      };
      result.confirmationLines.push(`✅ *Byter artikel ${parsed.swapArticle.position}:* ${hits[0].title}`);
    } else {
      result.confirmationLines.push(`⚠️ Hittade ingen artikel för "${parsed.swapArticle.fragment}"`);
    }
  }

  return result;
}

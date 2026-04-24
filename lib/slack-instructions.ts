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
    position: 1 | 2 | 3; // 1 = top, 2 = second, 3 = third
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
        content: `You are a tool that analyses newsletter instructions.

Redaktörerna heter: Andreas Jennische, Jenny Kjellén, Johann Bernövall, Camilla Bergman.
Set editorName ONLY if one of these names is mentioned explicitly.
Article fragments are headlines or parts of article headlines — NOT personal names that are not editors listed above.

Extract these fields (omit fields not mentioned):
- editorName: string — ONLY if one of the editors above is mentioned
- articleFragments: string[] — parts of article headlines to use in the newsletter (1–3 items)
- psFragment: string — part of the PS article headline
- svepHints: string[] — if the user wants the Impact Roundup to include a specific news item. Each hint is a brief description of the news/topic/company (e.g. "Northvolt", "Volvo EV batteries", "EU taxonomy"). Used when the instruction mentions the roundup or roundup news.
- swapArticle: { position: 1|2|3, fragment: string } — if the user wants to SWAP OUT a specific article in an already-built newsletter. position 1 = top/first article, 2 = second, 3 = third. fragment = part of the new article headline.

swapArticle is used ONLY when the instruction is about swapping out an article in an already-built newsletter (e.g. "swap the top article for X", "replace article 2 with Y", "change the first one to Z").
articleFragments is used when building a new newsletter from scratch.

Return ONLY valid JSON. If the message is not about the newsletter, return null.

Message: """${text}"""`,
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
    result.confirmationLines.push(`✅ *Roundup hints:* ${result.svepHints.join(', ')}`);
  }

  // Redaktör
  if (parsed.editorName) {
    const editor = findEditorByName(parsed.editorName);
    if (editor) {
      result.editorOverride = editor;
      result.confirmationLines.push(`✅ *Editor:* ${editor.name}`);
    } else {
      result.confirmationLines.push(`⚠️ No editor found matching "${parsed.editorName}"`);
    }
  }

  // Artiklar
  for (const fragment of parsed.articleFragments ?? []) {
    const hits = await searchArticles(fragment, 5);
    if (hits.length > 0) {
      result.articleIds.push(hits[0]._id);
      result.confirmationLines.push(`✅ *Article:* ${hits[0].title}`);
    } else {
      result.confirmationLines.push(`⚠️ No article found for "${fragment}"`);
    }
  }

  // PS-artikel
  if (parsed.psFragment) {
    const hits = await searchArticles(parsed.psFragment, 5);
    if (hits.length > 0) {
      result.psArticleId = hits[0]._id;
      result.confirmationLines.push(`✅ *PS article:* ${hits[0].title}`);
    } else {
      result.confirmationLines.push(`⚠️ No PS article found for "${parsed.psFragment}"`);
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
      result.confirmationLines.push(`✅ *Swapping article ${parsed.swapArticle.position}:* ${hits[0].title}`);
    } else {
      result.confirmationLines.push(`⚠️ No article found for "${parsed.swapArticle.fragment}"`);
    }
  }

  return result;
}

// lib/supabase.ts
// Supabase-klient (server-side, använder secret key)

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY!;

export const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, {
  auth: { persistSession: false },
});

// ─── Typer som matchar Supabase-tabellerna ───────────────────────────────────

export interface NewsletterDraft {
  id: string;
  date: string; // ISO date string
  status: 'draft' | 'approved' | 'sent';
  subject: string; // vald ämnesrad
  subject_options: [string, string, string];
  preheader: string; // "Och: [ämnesrad 2 utan emoji]"
  placeholders: Record<string, string>; // fullständig placeholder-map
  // Redigerbara fält (sparade separat för enkel åtkomst i dashboard)
  intro: string;
  funding_text: string;
  is_betalande: boolean;
  sponsor_active: boolean;
  teknik_active: boolean;
  article1_data: ArticleData;
  article2_data: ArticleData;
  article3_data: ArticleData | null;
  svepet_data: SvepetData;
  meetups_data: MeetupData[];
  editor_day: number; // 1-5 (mon-fri)
  created_at: string;
  updated_at: string;
}

export interface ArticleData {
  _id: string;
  title: string;
  ingress: string;
  mainImageUrl: string;
  imageCaption: string;
  category: string;
  url: string;
  slug: string;
  publishedAt: string;
}

export interface SvepetItem {
  emoji: string;
  boldTitle: string;
  body: string;
  link?: string;
  source?: string;
}

export interface SvepetData {
  headline: string;
  items: SvepetItem[];
}

export interface MeetupData {
  title: string;
  info: string;
}

// ─── CRUD-operationer ─────────────────────────────────────────────────────────

export async function getDraftByDate(date: string): Promise<NewsletterDraft | null> {
  const { data, error } = await supabase
    .from('newsletter_drafts')
    .select('*')
    .eq('date', date)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) return null;
  return data as NewsletterDraft;
}

export async function getDraftById(id: string): Promise<NewsletterDraft | null> {
  const { data, error } = await supabase
    .from('newsletter_drafts')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) return null;
  return data as NewsletterDraft;
}

export async function getLatestDraft(): Promise<NewsletterDraft | null> {
  const { data, error } = await supabase
    .from('newsletter_drafts')
    .select('*')
    .in('status', ['draft', 'approved'])
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) return null;
  return data as NewsletterDraft;
}

export async function createDraft(
  draft: Omit<NewsletterDraft, 'id' | 'created_at' | 'updated_at'>
): Promise<NewsletterDraft> {
  console.log('[supabase] createDraft mostread längd IN:', draft.placeholders?.['[[mostread_placeholder]]']?.length ?? 0);
  const { data, error } = await supabase
    .from('newsletter_drafts')
    .insert(draft)
    .select()
    .single();

  if (error) throw new Error(`Supabase insert failed: ${error.message}`);
  console.log('[supabase] createDraft mostread längd OUT:', (data as NewsletterDraft).placeholders?.['[[mostread_placeholder]]']?.length ?? 0);
  return data as NewsletterDraft;
}

export async function updateDraft(
  id: string,
  updates: Partial<Omit<NewsletterDraft, 'id' | 'created_at'>>
): Promise<NewsletterDraft> {
  const { data, error } = await supabase
    .from('newsletter_drafts')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(`Supabase update failed: ${error.message}`);
  return data as NewsletterDraft;
}

export async function getLastSentArticleId(): Promise<string | null> {
  const { data } = await supabase
    .from('sent_newsletters')
    .select('ps_article_id')
    .not('ps_article_id', 'is', null)
    .order('sent_at', { ascending: false })
    .limit(1)
    .single();

  return data?.ps_article_id ?? null;
}

// ─── Pending instructions (Slack-styrda nyhetsbrevsinstruktioner) ────────────

import type { Editor } from './editors';

export interface PendingInstruction {
  id: string;
  editor_override: Editor | null;
  article_ids: string[];
  ps_article_id: string | null;
  svep_hints: string[];
  raw_text: string;
  slack_channel: string | null;
  slack_thread_ts: string | null;
  applied: boolean;
  created_at: string;
}

export async function storePendingInstructions(params: {
  editorOverride: Editor | null;
  articleIds: string[];
  psArticleId: string | null;
  svepHints: string[];
  rawText: string;
  slackChannel: string | null;
  slackThreadTs: string | null;
}): Promise<void> {
  // Encode svepHints into rawText (avoids requiring a separate DB column)
  const rawTextWithHints =
    params.svepHints.length > 0
      ? `${params.rawText}\n__SVEP_HINTS__:${JSON.stringify(params.svepHints)}`
      : params.rawText;

  const { error } = await supabase.from('pending_instructions').insert({
    editor_override: params.editorOverride,
    article_ids: params.articleIds,
    ps_article_id: params.psArticleId,
    raw_text: rawTextWithHints,
    slack_channel: params.slackChannel,
    slack_thread_ts: params.slackThreadTs,
    applied: false,
  });
  if (error) throw new Error(`storePendingInstructions failed: ${error.message}`);
}

export async function getLatestPendingInstruction(): Promise<PendingInstruction | null> {
  const { data, error } = await supabase
    .from('pending_instructions')
    .select('*')
    .eq('applied', false)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) return null;

  const result = data as PendingInstruction;

  // Extract svepHints that were encoded into raw_text at store time
  if (!result.svep_hints || result.svep_hints.length === 0) {
    const match = result.raw_text?.match(/\n__SVEP_HINTS__:(.+)$/);
    if (match) {
      try {
        result.svep_hints = JSON.parse(match[1]);
        result.raw_text = result.raw_text.replace(/\n__SVEP_HINTS__:.+$/, '');
      } catch {
        result.svep_hints = [];
      }
    } else {
      result.svep_hints = result.svep_hints ?? [];
    }
  }

  return result;
}

export async function markInstructionApplied(id: string): Promise<void> {
  await supabase
    .from('pending_instructions')
    .update({ applied: true })
    .eq('id', id);
}

export async function recordSentNewsletter(params: {
  draft_id: string;
  mailchimp_campaign_id: string;
  subject: string;
  segment: string;
  ps_article_id?: string;
}): Promise<void> {
  await supabase.from('sent_newsletters').insert({
    ...params,
    sent_at: new Date().toISOString(),
  });
}

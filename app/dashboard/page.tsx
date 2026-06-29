'use client';

import { useState, useEffect, useCallback } from 'react';
import type { NewsletterDraft, ArticleData, SvepetData, MeetupData } from '@/lib/supabase';
import type { FundingRow } from '@/lib/funding';
import { EDITORS } from '@/lib/editors';

// ─── Redaktörer ───────────────────────────────────────────────────────────────

const EDITORS_LIST = Object.entries(EDITORS).map(([day, editor]) => ({
  day: Number(day),
  ...editor,
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className="label">{children}</label>;
}

function Section({
  title,
  children,
  className = '',
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`bg-white rounded-xl border border-gray-200 p-6 ${className}`}>
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
        {title}
      </h2>
      {children}
    </div>
  );
}

// ─── Artikel-sökning ──────────────────────────────────────────────────────────

function ArticleSearch({
  onSelect,
  onClose,
}: {
  onSelect: (article: ArticleData) => void;
  onClose: () => void;
}) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<ArticleData[]>([]);
  const [loading, setLoading] = useState(false);

  const search = useCallback(async (term: string) => {
    if (term.length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    const res = await fetch(`/api/articles?q=${encodeURIComponent(term)}`);
    const json = await res.json();
    setResults(json.articles ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => search(q), 300);
    return () => clearTimeout(t);
  }, [q, search]);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
        <div className="p-4 border-b border-gray-200 flex gap-3">
          <input
            autoFocus
            className="input flex-1"
            placeholder="Search article..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <button
            onClick={onClose}
            className="px-3 py-2 text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>
        <div className="max-h-96 overflow-y-auto">
          {loading && (
            <p className="p-4 text-sm text-gray-500 text-center">Searching...</p>
          )}
          {!loading && results.length === 0 && q.length >= 2 && (
            <p className="p-4 text-sm text-gray-500 text-center">No results</p>
          )}
          {results.map((a) => (
            <button
              key={a._id}
              onClick={() => onSelect(a)}
              className="w-full text-left p-4 hover:bg-gray-50 border-b border-gray-100 last:border-0"
            >
              <p className="text-xs text-green-600 font-medium mb-1">{a.category}</p>
              <p className="text-sm font-semibold text-gray-800 mb-1">{a.title}</p>
              <p className="text-xs text-gray-500 line-clamp-2">{a.ingress}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Artikel-kort ─────────────────────────────────────────────────────────────

function ArticleCard({
  label,
  article,
  onSwap,
}: {
  label: string;
  article: ArticleData;
  onSwap: () => void;
}) {
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      {article.mainImageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={article.mainImageUrl}
          alt={article.title}
          className="w-full h-40 object-cover"
        />
      )}
      <div className="p-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-green-600 font-medium">{label} · {article.category}</span>
          <button
            onClick={onSwap}
            className="text-xs text-blue-600 hover:underline"
          >
            Swap article
          </button>
        </div>
        <p className="text-sm font-semibold text-gray-800 mb-1 line-clamp-2">
          {article.title}
        </p>
        <p className="text-xs text-gray-500 line-clamp-3">{article.ingress}</p>
        <a
          href={article.url}
          target="_blank"
          rel="noreferrer"
          className="text-xs text-blue-500 hover:underline mt-1 inline-block"
        >
          Open article →
        </a>
      </div>
    </div>
  );
}

// ─── Svepet-editor ────────────────────────────────────────────────────────────

function SvepetEditor({
  data,
  onChange,
}: {
  data: SvepetData;
  onChange: (d: SvepetData) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <Label>Headline (entire roundup)</Label>
        <input
          className="input"
          value={data.headline}
          onChange={(e) => onChange({ ...data, headline: e.target.value })}
        />
      </div>
      {data.items.map((item, i) => (
        <div key={i} className="border border-gray-100 rounded-lg p-3 space-y-2">
          <p className="text-xs text-gray-400 font-medium">Item {i + 1}</p>
          <div className="grid grid-cols-12 gap-2">
            <div className="col-span-2">
              <Label>Emoji</Label>
              <input
                className="input"
                value={item.emoji}
                onChange={(e) => {
                  const items = [...data.items] as SvepetData['items'];
                  items[i] = { ...items[i], emoji: e.target.value };
                  onChange({ ...data, items });
                }}
              />
            </div>
            <div className="col-span-10">
              <Label>Bold headline</Label>
              <input
                className="input"
                value={item.boldTitle}
                onChange={(e) => {
                  const items = [...data.items] as SvepetData['items'];
                  items[i] = { ...items[i], boldTitle: e.target.value };
                  onChange({ ...data, items });
                }}
              />
            </div>
          </div>
          <div>
            <Label>Body text</Label>
            <textarea
              className="input min-h-[60px] resize-y"
              value={item.body}
              onChange={(e) => {
                const items = [...data.items] as SvepetData['items'];
                items[i] = { ...items[i], body: e.target.value };
                onChange({ ...data, items });
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Meetup-editor ────────────────────────────────────────────────────────────

function MeetupsEditor({
  meetups,
  onChange,
}: {
  meetups: MeetupData[];
  onChange: (m: MeetupData[]) => void;
}) {
  const add = () => onChange([...meetups, { title: '', info: '' }]);
  const remove = (i: number) => onChange(meetups.filter((_, idx) => idx !== i));
  const update = (i: number, field: keyof MeetupData, val: string) => {
    const updated = [...meetups];
    updated[i] = { ...updated[i], [field]: val };
    onChange(updated);
  };

  return (
    <div className="space-y-3">
      {meetups.map((m, i) => (
        <div key={i} className="border border-gray-100 rounded-lg p-3 space-y-2">
          <div className="flex justify-between items-center">
            <p className="text-xs text-gray-400">Meetup {i + 1}</p>
            <button
              onClick={() => remove(i)}
              className="text-xs text-red-500 hover:text-red-700"
            >
              Remove
            </button>
          </div>
          <div>
            <Label>Title</Label>
            <input
              className="input"
              value={m.title}
              onChange={(e) => update(i, 'title', e.target.value)}
            />
          </div>
          <div>
            <Label>Info (date, location, link etc.)</Label>
            <textarea
              className="input min-h-[60px] resize-y"
              value={m.info}
              onChange={(e) => update(i, 'info', e.target.value)}
            />
          </div>
        </div>
      ))}
      <button
        onClick={add}
        className="w-full py-2 border-2 border-dashed border-gray-200 rounded-lg text-sm text-gray-400 hover:border-green-300 hover:text-green-600 transition-colors"
      >
        + Add meetup
      </button>
    </div>
  );
}

// ─── Funding-editor ───────────────────────────────────────────────────────────

const NICHE_OPTIONS = [
  'Agritech', 'Foodtech', 'Clean Energy', 'Cleantech', 'Mobility',
  'Circular Economy', 'Climate', 'Nature', 'Biotech', 'Industrial',
];

const EMPTY_FUNDING_ROW: FundingRow = {
  company: '',
  whatTheyDo: '',
  niche: 'Cleantech',
  funding: '',
  investors: '',
  location: '🌍',
};

function FundingEditor({
  rows,
  onChange,
}: {
  rows: FundingRow[];
  onChange: (r: FundingRow[]) => void;
}) {
  const add = () => onChange([...rows, { ...EMPTY_FUNDING_ROW }]);
  const remove = (i: number) => onChange(rows.filter((_, idx) => idx !== i));
  const update = (i: number, field: keyof FundingRow, val: string) => {
    const updated = [...rows];
    updated[i] = { ...updated[i], [field]: val };
    onChange(updated);
  };

  return (
    <div className="space-y-3">
      {rows.length === 0 && (
        <p className="text-sm text-gray-400 italic">
          No funding rounds – click "+ Add row" to add one manually, or they will be fetched automatically next collect.
        </p>
      )}
      {rows.map((row, i) => (
        <div key={i} className="border border-gray-100 rounded-lg p-3 space-y-2 bg-gray-50/50">
          <div className="flex justify-between items-center">
            <p className="text-xs font-medium text-gray-500">#{i + 1}</p>
            <button
              onClick={() => remove(i)}
              className="text-xs text-red-500 hover:text-red-700"
            >
              Remove
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>Company</Label>
              <input
                className="input"
                value={row.company}
                onChange={(e) => update(i, 'company', e.target.value)}
                placeholder="Nox Mobility"
              />
            </div>
            <div>
              <Label>What they do (max 6 words)</Label>
              <input
                className="input"
                value={row.whatTheyDo}
                onChange={(e) => update(i, 'whatTheyDo', e.target.value)}
                placeholder="Private sleeper cabins for night trains"
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label>Niche</Label>
              <select
                className="input"
                value={row.niche}
                onChange={(e) => update(i, 'niche', e.target.value)}
              >
                {NICHE_OPTIONS.map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>Funding (e.g. €15m)</Label>
              <input
                className="input"
                value={row.funding}
                onChange={(e) => update(i, 'funding', e.target.value)}
                placeholder="€2M"
              />
            </div>
            <div>
              <Label>Location (flag emoji)</Label>
              <input
                className="input"
                value={row.location}
                onChange={(e) => update(i, 'location', e.target.value)}
                placeholder="🇩🇪"
              />
            </div>
          </div>
          <div>
            <Label>Investors</Label>
            <input
              className="input"
              value={row.investors}
              onChange={(e) => update(i, 'investors', e.target.value)}
              placeholder="IBB Ventures, N/A"
            />
          </div>
        </div>
      ))}
      <button
        onClick={add}
        className="w-full py-2 border-2 border-dashed border-gray-200 rounded-lg text-sm text-gray-400 hover:border-green-300 hover:text-green-600 transition-colors"
      >
        + Add row
      </button>
    </div>
  );
}

// ─── Innehållsförteckning-editor ─────────────────────────────────────────────

function parseTocHtml(html: string): string[] {
  const matches = html.match(/<p>([^<]*)<\/p>/g) ?? [];
  return matches.map((p) => p.replace(/<\/?p>/g, ''));
}

function serializeTocLines(lines: string[]): string {
  return lines.map((l) => `<p>${l}</p>`).join('\n');
}

function TocEditor({
  lines,
  onChange,
}: {
  lines: string[];
  onChange: (lines: string[]) => void;
}) {
  const update = (i: number, val: string) => {
    const updated = [...lines];
    updated[i] = val;
    onChange(updated);
  };

  return (
    <div className="space-y-2">
      <p className="text-xs text-gray-400 mb-1">
        Each row is one line in the table of contents. Include emoji in the text (e.g. ⚡ Headline).
      </p>
      {lines.map((line, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="text-xs text-gray-400 w-4 shrink-0">{i + 1}</span>
          <input
            className="input flex-1"
            value={line}
            onChange={(e) => update(i, e.target.value)}
          />
        </div>
      ))}
      {lines.length === 0 && (
        <p className="text-sm text-gray-400 italic">No table of contents generated yet.</p>
      )}
    </div>
  );
}

// ─── Mest läst ────────────────────────────────────────────────────────────────

function MostReadSection({ draft }: { draft: NewsletterDraft | null }) {
  if (!draft) return null;

  const html = (draft.placeholders as Record<string, string>)?.['[[mostread_placeholder]]'] ?? '';
  const regex = /<a href="([^"]+)"[^>]*>([^<]+)<\/a>/g;
  const articles: { url: string; title: string }[] = [];
  let m;
  while ((m = regex.exec(html)) !== null) {
    articles.push({ url: m[1], title: m[2] });
  }

  return (
    <Section title="Most read (last 7 days from GA4)">
      {articles.length > 0 ? (
        <ol className="space-y-2">
          {articles.map((a, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="shrink-0 w-5 h-5 rounded-full bg-gray-100 text-gray-500 text-xs font-semibold flex items-center justify-center mt-0.5">
                {i + 1}
              </span>
              <a
                href={a.url}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-gray-800 hover:text-green-700 hover:underline"
              >
                {a.title}
              </a>
            </li>
          ))}
        </ol>
      ) : (
        <p className="text-sm text-gray-400 italic">
          No most-read articles retrieved – GA4 data is missing or empty.
        </p>
      )}
    </Section>
  );
}

// ─── Huvud-sida ───────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [draft, setDraft] = useState<NewsletterDraft | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [swapTarget, setSwapTarget] = useState<'article1' | 'article2' | 'article3' | 'article4' | null>(null);
  const [testEmail, setTestEmail] = useState('');
  const [segment, setSegment] = useState<'gratis' | 'betalande'>('gratis');
  const [sending, setSending] = useState(false);

  // Lokala redigerbara states
  const [intro, setIntro] = useState('');
  const [selectedSubject, setSelectedSubject] = useState(0);
  const [subjectOptions, setSubjectOptions] = useState<[string, string, string]>(['', '', '']);
  const [preheader, setPreheader] = useState('');
  const [fundingRows, setFundingRows] = useState<FundingRow[]>([]);
  const [sponsorActive, setSponsorActive] = useState(false);
  const [teknikActive, setTeknikActive] = useState(false);
  const [svepet, setSvepet] = useState<SvepetData>({
    headline: '',
    items: [
      { emoji: '🌱', boldTitle: '', body: '' },
      { emoji: '⚡', boldTitle: '', body: '' },
      { emoji: '💰', boldTitle: '', body: '' },
    ],
  });
  const [article1, setArticle1] = useState<ArticleData | null>(null);
  const [article2, setArticle2] = useState<ArticleData | null>(null);
  const [article3, setArticle3] = useState<ArticleData | null>(null);
  const [article4, setArticle4] = useState<ArticleData | null>(null);
  const [meetups, setMeetups] = useState<MeetupData[]>([]);
  const [editorDay, setEditorDay] = useState<number>(1);
  const [tocLines, setTocLines] = useState<string[]>([]);

  // Ladda draft från URL-param eller senaste
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const draftId = searchParams.get('draft');
    const url = draftId ? `/api/draft/${draftId}` : '/api/draft';

    fetch(url)
      .then((r) => r.json())
      .then((data: NewsletterDraft & { error?: string }) => {
        if (data && !data.error) {
          setDraft(data);
          setIntro(data.intro ?? '');
          setSelectedSubject(0);
          setSubjectOptions(data.subject_options ?? ['', '', '']);
          setPreheader(data.preheader ?? '');
          setFundingRows(data.funding_rows ?? []);
          setSponsorActive(data.sponsor_active ?? false);
          setTeknikActive(data.teknik_active ?? false);
          if (data.svepet_data) setSvepet(data.svepet_data);
          setArticle1(data.article1_data);
          setArticle2(data.article2_data);
          setArticle3(data.article3_data);
          setMeetups(data.meetups_data ?? []);
          setEditorDay(data.editor_day ?? 1);
          const placeholders = (data.placeholders as Record<string, string>) ?? {};
          const tocHtml = placeholders['[[tableofcontents_placeholder]]'] ?? '';
          setTocLines(parseTocHtml(tocHtml));
          const psTitle = placeholders['[[psarticletitle_placeholder]]'];
          const psLink = placeholders['[[psarticlelink_placeholder]]'];
          const psImage = placeholders['[[psarticleimage_placeholder]]'];
          if (psTitle && psLink) {
            setArticle4({ _id: '', title: psTitle, ingress: '', mainImageUrl: psImage ?? '', imageCaption: '', category: 'PS', url: psLink, slug: '', publishedAt: '' });
          }
        } else {
          setError(String(data.error ?? 'No draft found'));
        }
        setLoading(false);
      })
      .catch((e: unknown) => {
        setError(String(e));
        setLoading(false);
      });
  }, []);

  const save = useCallback(async () => {
    if (!draft) return;
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`/api/draft/${draft.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intro,
          subject: subjectOptions[selectedSubject],
      subject_options: subjectOptions,
          preheader,
          funding_rows: fundingRows,
          sponsor_active: sponsorActive,
          teknik_active: teknikActive,
          svepet_data: svepet,
          article1_data: article1,
          article2_data: article2,
          article3_data: article3,
          ps_article_title: article4?.title ?? '',
          ps_article_link: article4?.url ?? '',
          ps_article_image: article4?.mainImageUrl ?? '',
          meetups_data: meetups,
          editor_day: editorDay,
          toc_html: serializeTocLines(tocLines),
        }),
      });
      const updated = await res.json();
      if (!res.ok) throw new Error(updated.error ?? 'Save failed');
      setDraft(updated);
      setSuccess('Saved!');
      setTimeout(() => setSuccess(''), 2000);
    } catch (e: unknown) {
      setError(String(e));
    } finally {
      setSaving(false);
    }
  }, [draft, intro, selectedSubject, subjectOptions, preheader, fundingRows, sponsorActive, teknikActive, svepet, article1, article2, article3, meetups, editorDay, tocLines]);

  const [editUrlGratis, setEditUrlGratis] = useState('');
  const [editUrlBetalande, setEditUrlBetalande] = useState('');

  const sendToMailchimp = useCallback(
    async (action: 'draft' | 'test') => {
      if (!draft) return;
      setSending(true);
      setError('');
      setEditUrlGratis('');
      setEditUrlBetalande('');
      await save();
      try {
        const res = await fetch('/api/mailchimp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            draftId: draft.id,
            action,
            segment,
            testEmail: action === 'test' ? testEmail : undefined,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? 'Mailchimp error');

        if (action === 'draft') {
          setSuccess('Both campaigns created!');
          if (data.editUrl) setEditUrlGratis(data.editUrl);
          if (data.editUrlBetalande) setEditUrlBetalande(data.editUrlBetalande);
        } else {
          setSuccess(`Test email sent to ${data.sentTo}`);
        }
      } catch (e: unknown) {
        setError(String(e));
      } finally {
        setSending(false);
      }
    },
    [draft, save, segment, testEmail]
  );

  // ─── Rendering ──────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500">Loading draft...</p>
        </div>
      </div>
    );
  }

  if (!draft && error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <p className="text-6xl mb-4">📭</p>
          <h1 className="text-lg font-semibold text-gray-800 mb-2">No draft today</h1>
          <p className="text-sm text-gray-500 mb-6">{error}</p>
          <button
            onClick={() => fetch('/api/collect').then(() => window.location.reload())}
            className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"
          >
            Run data collection now
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-base font-semibold text-gray-900">Impact Loop VC · Newsletter</h1>
            {draft && (
              <p className="text-xs text-gray-400">
                {formatDate(draft.date)} ·{' '}
                <span
                  className={`font-medium ${
                    draft.status === 'approved'
                      ? 'text-green-600'
                      : draft.status === 'sent'
                      ? 'text-blue-600'
                      : 'text-orange-500'
                  }`}
                >
                  {draft.status === 'draft'
                    ? 'Draft'
                    : draft.status === 'approved'
                    ? 'Approved'
                    : 'Sent'}
                </span>
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 min-w-0">
            {success && (
              <span className="text-xs text-green-600 font-medium shrink-0">{success}</span>
            )}
            {error && (
              <span className="text-xs text-red-600 font-medium truncate max-w-[140px] sm:max-w-xs">{error}</span>
            )}
            <button
              onClick={save}
              disabled={saving}
              className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-lg font-medium disabled:opacity-50 shrink-0"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-5">

        {/* ─── Ämnesrad ─── */}
        {draft && (
          <Section title="Subject line — select and edit">
            <div className="space-y-2">
              {subjectOptions.map((opt, i) => (
                <div
                  key={i}
                  onClick={() => setSelectedSubject(i)}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedSubject === i
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <input
                    type="radio"
                    name="subject"
                    checked={selectedSubject === i}
                    onChange={() => setSelectedSubject(i)}
                    className="shrink-0 accent-green-600"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <input
                    type="text"
                    value={opt}
                    onChange={(e) => {
                      const updated = [...subjectOptions] as [string, string, string];
                      updated[i] = e.target.value;
                      setSubjectOptions(updated);
                      setSelectedSubject(i);
                      // Preheadern baseras alltid på ämnesrad 2 utan emoji
                      if (i === 1) {
                        const withoutEmoji = e.target.value.replace(/^[\p{Emoji}\uFE0F\u200D\s]+/u, '').trim();
                        setPreheader(`Also: ${withoutEmoji}`);
                      }
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="flex-1 bg-transparent text-sm text-gray-800 outline-none focus:outline-none placeholder:text-gray-400"
                    placeholder={`Alternativ ${i + 1}...`}
                  />
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* ─── Preheader ─── */}
        <Section title="Preheader (shown below the subject line in the inbox)">
          <input
            type="text"
            className="input"
            value={preheader}
            onChange={(e) => setPreheader(e.target.value)}
            placeholder='Also: ...'
            maxLength={90}
          />
          <p className="text-xs text-gray-400 mt-1">{preheader.length}/90 characters · Updates automatically when you change subject line 2</p>
        </Section>

        {/* ─── Intro ─── */}
        <Section title="Introduction (editor's intro)">
          <textarea
            className="input min-h-[120px] resize-y"
            value={intro}
            onChange={(e) => setIntro(e.target.value)}
            placeholder="AI-generated introduction – edit as needed..."
          />
        </Section>

        {/* ─── Innehållsförteckning ─── */}
        <Section title="Table of contents">
          <TocEditor lines={tocLines} onChange={setTocLines} />
        </Section>

        {/* ─── Redaktör ─── */}
        <Section title="Editor">
          {(() => {
            const editor = EDITORS_LIST.find((e) => e.day === editorDay) ?? EDITORS_LIST[0];
            return (
              <div className="flex items-center gap-6">
                {/* Bild */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={editor.imageUrl}
                  alt={editor.name}
                  className="w-16 h-16 rounded-full object-cover shrink-0 border border-gray-200"
                />
                {/* Info + dropdown */}
                <div className="flex-1 space-y-2">
                  <div>
                    <Label>Select editor</Label>
                    <select
                      className="input mt-1"
                      value={editorDay}
                      onChange={(e) => setEditorDay(Number(e.target.value))}
                    >
                      {EDITORS_LIST.map((e) => (
                        <option key={e.day} value={e.day}>
                          {['', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'][e.day]} – {e.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-600">
                    <div>
                      <span className="text-xs text-gray-400 block">Title</span>
                      {editor.title}
                    </div>
                    <div>
                      <span className="text-xs text-gray-400 block">Email</span>
                      {editor.email}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </Section>

        {/* ─── Artiklar ─── */}
        <Section title="Articles">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {article1 && (
              <ArticleCard
                label="Article 1"
                article={article1}
                onSwap={() => setSwapTarget('article1')}
              />
            )}
            {article2 && (
              <ArticleCard
                label="Article 2"
                article={article2}
                onSwap={() => setSwapTarget('article2')}
              />
            )}
            {article3 ? (
              <ArticleCard
                label="Article 3"
                article={article3}
                onSwap={() => setSwapTarget('article3')}
              />
            ) : (
              <button
                onClick={() => setSwapTarget('article3')}
                className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-sm text-gray-400 hover:border-green-300 hover:text-green-600 transition-colors text-center"
              >
                + Add third article
              </button>
            )}
            {article4 ? (
              <ArticleCard
                label="Article 4 (PS)"
                article={article4}
                onSwap={() => setSwapTarget('article4')}
              />
            ) : (
              <button
                onClick={() => setSwapTarget('article4')}
                className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-sm text-gray-400 hover:border-green-300 hover:text-green-600 transition-colors text-center"
              >
                + Add PS article
              </button>
            )}
          </div>
        </Section>

        {/* ─── Impact-svepet ─── */}
        <Section title="Bits and Pieces">
          <SvepetEditor data={svepet} onChange={setSvepet} />
        </Section>

        {/* ─── Kapitalrundor ─── */}
        <Section title="Funding rounds">
          <FundingEditor rows={fundingRows} onChange={setFundingRows} />
        </Section>

        {/* ─── Mest läst ─── */}
        <MostReadSection draft={draft} />

        {/* ─── Toggles ─── */}
        <Section title="Extra sections">
          <div className="flex gap-8">
            {[
              { label: 'Sponsor image', value: sponsorActive, set: setSponsorActive },
              { label: 'Tech advert', value: teknikActive, set: setTeknikActive },
            ].map(({ label, value, set }) => (
              <button
                key={label}
                onClick={() => set((v) => !v)}
                className="flex items-center gap-3 group"
              >
                <div
                  className={`relative w-10 h-6 rounded-full transition-colors ${
                    value ? 'bg-green-500' : 'bg-gray-200'
                  }`}
                >
                  <div
                    className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                      value ? 'translate-x-5' : 'translate-x-1'
                    }`}
                  />
                </div>
                <span className="text-sm text-gray-700 group-hover:text-gray-900">{label}</span>
              </button>
            ))}
          </div>
        </Section>

        {/* ─── Skicka till Mailchimp ─── */}
        <Section title="Send to Mailchimp" className="!border-green-200 !bg-green-50/50">
          <div className="space-y-4">
            {/* Testmail */}
            <div>
              <Label>Test email (select segment)</Label>
              <div className="flex flex-wrap gap-2 mt-1">
                {(['gratis', 'betalande'] as const).map((s) => (
                  <label
                    key={s}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer text-xs transition-colors ${
                      segment === s
                        ? 'border-green-500 bg-white text-green-700 font-medium'
                        : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                    }`}
                  >
                    <input type="radio" name="segment" value={s} checked={segment === s} onChange={() => setSegment(s)} className="hidden" />
                    {s === 'gratis' ? '🆓 Free' : '⭐ Paid'}
                  </label>
                ))}
              </div>
              <div className="flex gap-2 mt-2">
                <input
                  className="input flex-1"
                  type="email"
                  placeholder="your@email.com"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                />
                <button
                  onClick={() => sendToMailchimp('test')}
                  disabled={sending || !testEmail}
                  className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 whitespace-nowrap shrink-0"
                >
                  {sending ? '...' : 'Send test'}
                </button>
              </div>
            </div>

            {/* Skapa båda utkast */}
            <button
              onClick={() => sendToMailchimp('draft')}
              disabled={sending}
              className="w-full py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors text-sm"
            >
              {sending ? 'Creating campaigns...' : '✓ Create Mailchimp draft (free + paid)'}
            </button>

            {/* Länkar till skapade kampanjer */}
            {(editUrlGratis || editUrlBetalande) && (
              <div className="flex flex-col sm:flex-row gap-3">
                {editUrlGratis && (
                  <a href={editUrlGratis} target="_blank" rel="noreferrer"
                    className="flex-1 py-2 text-center text-sm font-medium bg-white border border-green-300 text-green-700 rounded-lg hover:bg-green-50 transition-colors">
                    🆓 Open free newsletter →
                  </a>
                )}
                {editUrlBetalande && (
                  <a href={editUrlBetalande} target="_blank" rel="noreferrer"
                    className="flex-1 py-2 text-center text-sm font-medium bg-white border border-yellow-300 text-yellow-700 rounded-lg hover:bg-yellow-50 transition-colors">
                    ⭐ Open paid newsletter →
                  </a>
                )}
              </div>
            )}

            <p className="text-xs text-green-700/70 text-center">
              Both campaigns are created as drafts — you approve and schedule manually in Mailchimp.
            </p>
          </div>
        </Section>

      </div>

      {/* Artikel-sökning modal */}
      {swapTarget && (
        <ArticleSearch
          onSelect={(article) => {
            if (swapTarget === 'article1') setArticle1(article);
            if (swapTarget === 'article2') setArticle2(article);
            if (swapTarget === 'article3') setArticle3(article);
            if (swapTarget === 'article4') setArticle4(article);
            setSwapTarget(null);
          }}
          onClose={() => setSwapTarget(null)}
        />
      )}
    </div>
  );
}

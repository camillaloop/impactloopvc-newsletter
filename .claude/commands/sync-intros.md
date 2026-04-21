# Synka redaktörsintron från Mailchimp

Det här kommandot hämtar det senaste årets kampanj-intron från Impact Loops Mailchimp-historia och uppdaterar Supabase-tabellen `editor_intro_examples` – uppdelat per redaktör.

## Vad det gör

1. Hämtar alla skickade kampanjer till betalande-segmentet (ID: 2966632) det senaste året
2. Hämtar HTML-innehållet för varje kampanj via Mailchimp Content API
3. Extraherar intro-stycket (första substantiella stycket) + redaktörens namn (av mönstret "Förnamn Efternamn, titel")
4. Sparar/uppdaterar i Supabase-tabellen `editor_intro_examples`

## Kör synken

Anropa `/api/sync-intros` med POST (kräver inloggning):

```bash
curl -X POST http://localhost:3000/api/sync-intros \
  -b "auth=true"
```

Eller gå till **Dashboard → Inställningar → Synka intron**.

> OBS: Tar tid (~5–10 min) eftersom Mailchimp-HTML hämtas för varje kampanj med rate limiting (120ms/kampanj).

## Hur introna används

AI-funktionen `generateIntro()` i `lib/ai.ts` hämtar automatiskt de 10 senaste introna för den aktiva redaktören och inkluderar dem som few-shot-exempel i prompten till Claude.

## Databas

Tabellen `editor_intro_examples`:
| Kolumn | Typ | Beskrivning |
|---|---|---|
| `campaign_id` | text UNIQUE | Mailchimp kampanj-ID |
| `editor_name` | text | Redaktörens fullständiga namn |
| `intro_text` | text | Extraherat intro-stycke |
| `send_time` | timestamptz | När kampanjen skickades |

## Redaktörer

| Redaktör | Dag |
|---|---|
| Andreas Jennische | Måndag + Fredag |
| Jenny Kjellén | Tisdag |
| Johann Bernövall | Onsdag |
| Camilla Bergman | Torsdag |

## SQL för att skapa tabellen (kör i Supabase Dashboard)

```sql
CREATE TABLE IF NOT EXISTS editor_intro_examples (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id text NOT NULL UNIQUE,
  editor_name text NOT NULL,
  intro_text text NOT NULL,
  send_time timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_editor_intro_examples_editor ON editor_intro_examples(editor_name);
CREATE INDEX IF NOT EXISTS idx_editor_intro_examples_send_time ON editor_intro_examples(send_time DESC);
```

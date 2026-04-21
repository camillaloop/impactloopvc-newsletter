# Synka ämnesrader från Mailchimp

Det här kommandot hämtar de bäst presterande ämnesraderna från Impact Loops Mailchimp-historia och uppdaterar Supabase-tabellen `subject_line_examples`.

## Vad det gör

1. Hämtar alla skickade kampanjer till betalande-segmentet (ID: 2966632) det senaste året
2. Hämtar öppningsfrekvens för varje kampanj via Mailchimp Reports API
3. Sorterar på öppningsfrekvens, tar top 100
4. Sparar/uppdaterar i Supabase-tabellen `subject_line_examples`

## Kör synken

Anropa `/api/sync-subjects` med POST (kräver inloggning):

```bash
curl -X POST http://localhost:3000/api/sync-subjects \
  -b "auth=true"
```

Eller gå till **Dashboard → Inställningar → Synka ämnesrader**.

## Hur ämnesraderna används

AI-funktionen `generateSubjectLines()` i `lib/ai.ts` hämtar automatiskt de 20 bäst presterande exemplen från Supabase och inkluderar dem som few-shot-exempel i prompten till Claude.

## Mönster som fungerar (från top 100)

Baserat på historiken är dessa mönster mest effektiva för Impact Loop:

- **Emoji i början** — nästan alla top-ämnesrader börjar med en relevant emoji
- **Konkreta siffror** — "600 procent", "81 miljoner", "100 kvinnor" skapar nyfikenhet
- **Citat med spänning** — `"Ingen corporate bullshit"`, `"Gör oss bättre"`
- **Namngivna personer/bolag** — Bill Gates, Peter Carlsson, H&M, Northvolt
- **GENOMGÅNG / STOR LISTA / JUST NU** — caps-ord signalerar exklusivt innehåll
- **Kontrast/konflikt** — "letar men hittar inte", "konkurs – återuppstår", "backar – men gasar"
- **Frågetecken sparas** — de bästa raderna är påståenden, inte frågor
- **Max ~65 tecken** — längre kapas i många mailklienter

## Exempel på top-10

| Öppningsfrekvens | Ämnesrad |
|---|---|
| 84.1% | 🏭 Efter räddningen – vad händer egentligen med Northvolt? |
| 82.9% | 🐄 Nya siffror – så går det för två heta bolag med fokus på lantbruket |
| 82.2% | 💸 Dold jättemarknad för impact-bolag – i avloppet |
| 82.2% | 🚚 Fordonsjätten letar "snabba" impact-bolag: "Gör oss bättre" |
| 81.5% | 👀 Bill Gates på väg till Sverige + impact-bolaget köper konkurrent |
| 81.4% | 💎 GENOMGÅNG: Det letar impact-investerarna efter just nu |
| 80.9% | 🌊 GENOMGÅNG: "Blå" bolag att hålla koll på 2026 |
| 80.9% | 🚀 Spårbarhetsbolaget ökar med 600 procent |
| 80.9% | 📈 Blir ny chef på impact-bolaget – "Ingen corporate bullshit" |
| 79.6% | 🔥 Extremväder – här är bolagen som tacklar klimatkriser |

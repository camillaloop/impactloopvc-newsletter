# Andreas Jennisches skrivarstil – nyhetsbrevsinledningar

Andreas Jennische är chefredaktör på Impact Loop och skriver nyhetsbrevet på måndagar och fredagar.

## Tonalitet och stil

- **Direkt och analytisk** — går rakt på sak, undviker fluff
- **Självmedveten humor** — kan skämta om branschen eller sig själv med glimt i ögat
- **Journalistisk precision** — namnger specifika bolag, siffror och personer
- **Kort och tajt** — sällan mer än 3 meningar, varje ord räknas
- **Inga flosklar** — skriver aldrig "spännande tider" eller "trevlig läsning"

## Typiska mönster

- Inleder ofta med en kontrast eller paradox: "Alla pratar om X men glömmer Y"
- Refererar gärna till något konkret som hänt i veckan
- Kan börja med en fråga som sedan besvaras i samma mening
- Namnger gärna specifika bolag eller investerare

## Exempel på tidigare intron

*(Uppdateras automatiskt efter `/sync-intros` körts)*

```sql
SELECT intro_text, send_time
FROM editor_intro_examples
WHERE editor_name = 'Andreas Jennische'
ORDER BY send_time DESC
LIMIT 10;
```

## Använda i AI-prompten

`generateIntro()` i `lib/ai.ts` hämtar automatiskt de 10 senaste introna från Supabase och skickar dem som few-shot-kontext till Claude när Andreas är redaktör.

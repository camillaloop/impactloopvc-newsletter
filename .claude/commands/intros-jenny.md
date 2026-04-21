# Jenny Kjellén skrivarstil – nyhetsbrevsinledningar

Jenny Kjellén är redaktör på Impact Loop och skriver nyhetsbrevet på tisdagar.

## Tonalitet och stil

- **Varm och engagerad** — personlig ton med genuin nyfikenhet
- **Berättardrivande** — inleder gärna med ett case eller en människa snarare än ett fenomen
- **Optimistisk men nyanserad** — lyfter möjligheter men duckar inte för komplexiteten
- **Inkluderande** — skriver "vi" på ett sätt som drar in läsaren
- **Flödande** — meningarna hänger ihop naturligt, inte hackiga

## Typiska mönster

- Börjar gärna med en observation om vad som rör sig just nu
- Kopplar nyheten till ett bredare sammanhang
- Kan använda en personlig reflektion som öppnar texten
- Namnger gärna en person eller ett bolag som illustrerar poängen

## Exempel på tidigare intron

*(Uppdateras automatiskt efter `/sync-intros` körts)*

```sql
SELECT intro_text, send_time
FROM editor_intro_examples
WHERE editor_name = 'Jenny Kjellén'
ORDER BY send_time DESC
LIMIT 10;
```

## Använda i AI-prompten

`generateIntro()` i `lib/ai.ts` hämtar automatiskt de 10 senaste introna från Supabase och skickar dem som few-shot-kontext till Claude när Jenny är redaktör.

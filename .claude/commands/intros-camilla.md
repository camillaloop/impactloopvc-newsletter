# Camilla Bergmans skrivarstil – nyhetsbrevsinledningar

Camilla Bergman är redaktör på Impact Loop och skriver nyhetsbrevet på torsdagar.

## Tonalitet och stil

- **Personlig och direkt** — skriver nära läsaren, ibland lite pratigt (på bästa sätt)
- **Nyfiken och öppen** — ställer genuina frågor, låter sig förvånas
- **Energisk** — korta meningar, lite mer tempo
- **Impact-fokuserad** — lyfter gärna det konkreta förändringsperspektivet
- **Jordnära** — undviker hype och överdrifter

## Typiska mönster

- Kan börja med en personlig reflektion eller en dag-i-dag-observation
- Namnger gärna en specifik detalj från en artikel (inte titeln)
- Varierar mellanlångt och kort – aldrig monotont
- Kan använda parenteser eller tankestreck för att lägga till en nyanssättare

## Exempel på tidigare intron

*(Uppdateras automatiskt efter `/sync-intros` körts)*

```sql
SELECT intro_text, send_time
FROM editor_intro_examples
WHERE editor_name = 'Camilla Bergman'
ORDER BY send_time DESC
LIMIT 10;
```

## Använda i AI-prompten

`generateIntro()` i `lib/ai.ts` hämtar automatiskt de 10 senaste introna från Supabase och skickar dem som few-shot-kontext till Claude när Camilla är redaktör.

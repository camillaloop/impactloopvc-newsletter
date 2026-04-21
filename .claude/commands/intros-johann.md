# Johann Bernövalls skrivarstil – nyhetsbrevsinledningar

Johann Bernövall är redaktör på Impact Loop och skriver nyhetsbrevet på onsdagar.

## Tonalitet och stil

- **Analytisk och strukturerad** — gillar att sätta saker i ett system
- **Europeisk utblick** — drar ofta in EU-perspektiv eller internationella jämförelser
- **Lite mer formell** — mer tidningsjournalistisk känsla
- **Faktaorienterad** — siffror och konkreta detaljer stärker texten
- **Tydlig tes** — varje intro har en klar poäng

## Typiska mönster

- Inleder med en observation eller statistik
- Kopplar snabbt till varför det spelar roll för läsaren
- Kan använda ett retoriskt grepp (kontrast, fråga, paradox)
- Neutral men engagerad ton

## Exempel på tidigare intron

*(Uppdateras automatiskt efter `/sync-intros` körts)*

```sql
SELECT intro_text, send_time
FROM editor_intro_examples
WHERE editor_name = 'Johann Bernövall'
ORDER BY send_time DESC
LIMIT 10;
```

## Använda i AI-prompten

`generateIntro()` i `lib/ai.ts` hämtar automatiskt de 10 senaste introna från Supabase och skickar dem som few-shot-kontext till Claude när Johann är redaktör.

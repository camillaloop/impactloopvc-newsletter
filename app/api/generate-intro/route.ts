import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: Request) {
  try {
    const { articles, date } = await req.json();

    if (!articles?.length) {
      return NextResponse.json({ intro: '' });
    }

    const articleSummaries = articles
      .slice(0, 5)
      .map((a: { title: string; intro: string; category: string }, i: number) =>
        `${i + 1}. ${a.title} (${a.category})\n   ${a.intro?.slice(0, 200)}`
      )
      .join('\n\n');

    const message = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 300,
      messages: [
        {
          role: 'user',
          content: `Du är redaktör på Impact Loop, ett nyhetsbrev om hållbar omställning. Idag är det ${date}.

Skriv en kort, personlig intro (3-5 meningar) till dagens nyhetsbrev baserat på artiklarna nedan.
Tonen ska vara varm, engagerad och kunnig – som en insider som pratar med en kollega.
Lyft gärna det viktigaste temat eller den mest intressanta artikeln utan att avslöja allt.
Skriv på svenska. Inga hälsningsfraser som "Hej" eller "God morgon". Börja direkt med substansen.

Artiklar idag:
${articleSummaries}

Skriv bara introtexten, inget annat.`,
        },
      ],
    });

    const intro = message.content[0].type === 'text' ? message.content[0].text : '';

    return NextResponse.json({ intro });
  } catch (err) {
    console.error('Claude error:', err);
    return NextResponse.json({ intro: '' });
  }
}

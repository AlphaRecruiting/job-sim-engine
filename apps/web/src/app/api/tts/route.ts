import { NextRequest, NextResponse } from 'next/server';

const OPENAI_KEY = process.env.OPENAI_API_KEY;

// ── Voice character prompt ──
const VOICE_INSTRUCTIONS = `Sei Gabriel, un giovane founder italiano sulla trentina. Parli in modo naturale, caldo, sicuro di te e dinamico.

Regole vocali:
- Leggi ESATTAMENTE il testo fornito, senza aggiungere o togliere nessuna parola.
- Usa un ritmo spigliato, incalzante e rapido, tipico di chi lavora in una startup in forte crescita.
- Usa un tono conversazionale e diretto, da founder che parla a tu per tu.
- Metti enfasi naturale sulle parole chiave.
- Non essere monotono: varia il ritmo e mantieni l'energia alta.`;

export async function POST(req: NextRequest) {
  const { text, voice = 'ash' } = await req.json();
  if (!text) return NextResponse.json({ error: 'text required' }, { status: 400 });

  try {
    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENAI_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini-tts',
        input: text,
        voice,
        instructions: VOICE_INSTRUCTIONS,
        response_format: 'mp3',
        speed: 1.25,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('OpenAI TTS error:', err);
      return NextResponse.json({ error: err }, { status: response.status });
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    return new NextResponse(buffer, {
      status: 200,
      headers: { 'Content-Type': 'audio/mpeg' },
    });
  } catch (e: any) {
    console.error('TTS proxy error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

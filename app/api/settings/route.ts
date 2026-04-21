import { NextResponse } from 'next/server';
import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';

const SETTINGS_FILE = join(process.cwd(), 'settings.json');

const DEFAULT_SETTINGS = {
  editor: {
    name: '',
    email: 'redaktion@impactloop.se',
    title: 'Redaktör, Impact Loop',
    imageUrl: '',
  },
  meetups: [] as Array<{ title: string; date: string; location: string; url: string }>,
  kapitalrundor: [] as Array<{ company: string; amount: string; description: string; url?: string }>,
};

async function readSettings() {
  try {
    const raw = await readFile(SETTINGS_FILE, 'utf-8');
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function GET() {
  const settings = await readSettings();
  return NextResponse.json(settings);
}

export async function POST(req: Request) {
  try {
    const updates = await req.json();
    const current = await readSettings();
    const merged = { ...current, ...updates };
    await writeFile(SETTINGS_FILE, JSON.stringify(merged, null, 2));
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Settings write error:', err);
    return NextResponse.json({ error: 'Kunde inte spara inställningar' }, { status: 500 });
  }
}

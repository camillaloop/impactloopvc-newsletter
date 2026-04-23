// lib/editors.ts
// Redaktörsrotation per veckodag (0=söndag, 1=måndag … 5=fredag, 6=lördag)

export interface Editor {
  name: string;
  email: string;
  title: string;
  imageUrl: string;
}

const SION: Editor = {
  name: 'Siôn Geschwindt',
  email: 'sion@loop.se',
  title: 'Managing editor',
  imageUrl: 'https://cdn.sanity.io/images/dez2j7lq/production/2177d94b74f63751498092d4086f9e059c2a694c-500x500.png?w=1800&h=1200',
};

const CAMILLA: Editor = {
  name: 'Camilla Bergman',
  email: 'camilla@loop.se',
  title: 'Founder and Editor-in-chief',
  imageUrl: 'https://cdn.sanity.io/images/dez2j7lq/production/e4fed83e89812498cfeae454de0ee96dc2c5f542-800x800.heif?w=1800&h=1200',
};

export const EDITORS: Record<number, Editor> = {
  1: SION,    // Monday
  2: CAMILLA, // Tuesday
  3: SION,    // Wednesday
  4: CAMILLA, // Thursday
  5: SION,    // Friday
};

/** Returnerar redaktör baserat på veckodagen (Date.getDay()). */
export function getEditorForDate(date: Date): Editor {
  const day = date.getDay(); // 0=sön … 6=lör
  return (
    EDITORS[day] ??
    EDITORS[1] // fallback till måndag
  );
}

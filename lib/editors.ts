// lib/editors.ts
// Redaktörsrotation per veckodag (0=söndag, 1=måndag … 5=fredag, 6=lördag)

export interface Editor {
  name: string;
  email: string;
  title: string;
  imageUrl: string;
}

export const EDITORS: Record<number, Editor> = {
  1: {
    // Monday
    name: 'Siôn Geschwindt',
    email: 'sion@loop.se',
    title: 'Managing editor, Impact Loop VC',
    imageUrl: 'https://cdn.sanity.io/images/dez2j7lq/production/2177d94b74f63751498092d4086f9e059c2a694c-500x500.png?w=1800&h=1200',
  },
  2: {
    // Tuesday
    name: 'Siôn Geschwindt',
    email: 'sion@loop.se',
    title: 'Managing editor, Impact Loop VC',
    imageUrl: 'https://cdn.sanity.io/images/dez2j7lq/production/2177d94b74f63751498092d4086f9e059c2a694c-500x500.png?w=1800&h=1200',
  },
  3: {
    // Wednesday
    name: 'Siôn Geschwindt',
    email: 'sion@loop.se',
    title: 'Managing editor, Impact Loop VC',
    imageUrl: 'https://cdn.sanity.io/images/dez2j7lq/production/2177d94b74f63751498092d4086f9e059c2a694c-500x500.png?w=1800&h=1200',
  },
  4: {
    // Thursday
    name: 'Siôn Geschwindt',
    email: 'sion@loop.se',
    title: 'Managing editor, Impact Loop VC',
    imageUrl: 'https://cdn.sanity.io/images/dez2j7lq/production/2177d94b74f63751498092d4086f9e059c2a694c-500x500.png?w=1800&h=1200',
  },
  5: {
    // Friday
    name: 'Siôn Geschwindt',
    email: 'sion@loop.se',
    title: 'Managing editor, Impact Loop VC',
    imageUrl: 'https://cdn.sanity.io/images/dez2j7lq/production/2177d94b74f63751498092d4086f9e059c2a694c-500x500.png?w=1800&h=1200',
  },
};

/** Returnerar redaktör baserat på veckodagen (Date.getDay()). */
export function getEditorForDate(date: Date): Editor {
  const day = date.getDay(); // 0=sön … 6=lör
  return (
    EDITORS[day] ??
    EDITORS[1] // fallback till måndag
  );
}

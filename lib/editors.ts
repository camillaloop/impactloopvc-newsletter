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
    // Måndag
    name: 'Andreas Jennische',
    email: 'andreas@loop.se',
    title: 'Nyhetschef, Impact Loop',
    imageUrl:
      'https://mcusercontent.com/46f8b3dcdd581118cad2f80ee/images/903715d9-8891-c5d4-be8b-d3902622bd3d.png',
  },
  2: {
    // Tisdag
    name: 'Jenny Kjellén',
    email: 'jenny@loop.se',
    title: 'Reporter och redaktör, Impact Loop',
    imageUrl:
      'https://mcusercontent.com/46f8b3dcdd581118cad2f80ee/images/a5912c23-472c-34a8-d789-bfd43f0b2559.png',
  },
  3: {
    // Onsdag
    name: 'Johann Bernövall',
    email: 'johann@loop.se',
    title: 'Reporter och redaktör, Impact Loop',
    imageUrl:
      'https://mcusercontent.com/46f8b3dcdd581118cad2f80ee/images/9656a354-d822-b636-20c9-30df9c2a411a.png',
  },
  4: {
    // Torsdag
    name: 'Camilla Bergman',
    email: 'camilla@loop.se',
    title: 'Chefredaktör, Impact Loop',
    imageUrl:
      'https://mcusercontent.com/46f8b3dcdd581118cad2f80ee/images/a93fb1b7-f27d-d5aa-f88a-5f7f602bf174.png',
  },
  5: {
    // Fredag
    name: 'Andreas Jennische',
    email: 'andreas@loop.se',
    title: 'Nyhetschef, Impact Loop',
    imageUrl:
      'https://mcusercontent.com/46f8b3dcdd581118cad2f80ee/images/903715d9-8891-c5d4-be8b-d3902622bd3d.png',
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

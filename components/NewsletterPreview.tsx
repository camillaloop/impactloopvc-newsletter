'use client';

import { generateNewsletterHTML } from '@/lib/template';

interface Props {
  placeholders: Record<string, string>;
}

export default function NewsletterPreview({ placeholders }: Props) {
  const html = generateNewsletterHTML(placeholders);

  return (
    <div className="w-full h-full">
      <iframe
        srcDoc={html}
        className="w-full border-0 rounded-lg"
        style={{ height: '800px' }}
        title="Förhandsvisning av nyhetsbrev"
        sandbox="allow-same-origin"
      />
    </div>
  );
}

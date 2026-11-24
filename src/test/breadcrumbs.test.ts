import { describe, expect, it } from 'vitest';
import { institutional, languages, langIndex, pageHead, tools } from '@/lib/photo/content';
import { ecosystemSlugs } from '@/lib/photo/ecosystem';

describe('localized navigation structured data', () => {
  for (const lang of languages) {
    it(`provides one canonical BreadcrumbList for every internal page in ${lang}`, () => {
      const index = langIndex(lang);
      const slugs = [
        ...tools.map(tool => tool.slugs[index]),
        ...Object.values(institutional).map(values => values[index]),
        ecosystemSlugs[lang],
      ];
      expect(slugs).toHaveLength(19);
      for (const slug of slugs) {
        const head = pageHead(lang, slug);
        expect(head.scripts).toHaveLength(1);
        const script = head.scripts[0];
        if (!script) throw new Error('Missing structured data');
        expect(script.type).toBe('application/ld+json');
        const data = JSON.parse(script.children);
        expect(data['@context']).toBe('https://schema.org');
        expect(data['@type']).toBe('BreadcrumbList');
        expect(data.itemListElement.map((item: { position: number; item: string }) => [item.position, item.item])).toEqual([
          [1, `https://molviraphoto.com/${lang}`],
          [2, `https://molviraphoto.com/${lang}/${slug}`],
        ]);
        expect(data.itemListElement[1].item).toBe(head.links.find(link => link.rel === 'canonical')?.href);
      }
    });
  }
  it('does not invent navigation for home or unknown pages', () => {
    expect(pageHead('en').scripts).toEqual([]);
    expect(pageHead('pt', 'not-a-page').scripts).toEqual([]);
  });
});
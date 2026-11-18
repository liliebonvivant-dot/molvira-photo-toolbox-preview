import { describe, expect, it } from 'vitest';
import { equivalentSlug, institutional, languages, langIndex, resolvePage } from '@/lib/photo/content';

describe('Institutional page navigation', () => {
  for (const page of ['about', 'contact', 'privacy', 'terms', 'cookies'] as const) {
    it(`retains ${page} identity across EN/PT/ES`, () => {
      for (const from of languages) for (const to of languages) {
        const slug = equivalentSlug(from, institutional[page][langIndex(from)], to);
        expect(slug).toBe(institutional[page][langIndex(to)]);
        expect(resolvePage(to, slug ?? '').institution).toBe(page);
      }
    });
  }
});
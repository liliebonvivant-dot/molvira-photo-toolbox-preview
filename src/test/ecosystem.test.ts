import { describe, expect, it } from 'vitest';
import { equivalentSlug, resolvePage } from '@/lib/photo/content';
import { ecosystemProducts, ecosystemProductUrl } from '@/lib/photo/ecosystem';

describe('MOLVIRA ecosystem catalog', () => {
  it('contains only the three existing products with their official links', () => {
    expect(ecosystemProducts.map(({ name, url }) => ({ name, url }))).toEqual([
      { name: 'MOLVIRA PDF', url: 'https://molvirapdf.com' },
      { name: 'MOLVIRA PHOTO', url: 'https://molviraphoto.com' },
      { name: 'MOLVIRA CALC', url: 'https://molviracalc.com' },
    ]);
  });
  it('preserves the selected language when opening MOLVIRA CALC', () => {
    expect(ecosystemProductUrl('calc', 'en')).toBe('https://molviracalc.com/en');
    expect(ecosystemProductUrl('calc', 'pt')).toBe('https://molviracalc.com/pt');
    expect(ecosystemProductUrl('calc', 'es')).toBe('https://molviracalc.com/es');
    expect(ecosystemProductUrl('pdf', 'pt')).toBe('https://molvirapdf.com');
    expect(ecosystemProductUrl('photo', 'es')).toBe('https://molviraphoto.com');
  });
  it('keeps catalog identity across localized routes', () => {
    expect(resolvePage('en', 'all-tools').ecosystem).toBe(true);
    expect(resolvePage('pt', 'todas-as-ferramentas').ecosystem).toBe(true);
    expect(resolvePage('es', 'todas-las-herramientas').ecosystem).toBe(true);
    expect(resolvePage('pt', 'all-tools').ecosystem).toBe(false);
    expect(equivalentSlug('en', 'all-tools', 'pt')).toBe('todas-as-ferramentas');
    expect(equivalentSlug('pt', 'todas-as-ferramentas', 'es')).toBe('todas-las-herramientas');
    expect(equivalentSlug('es', 'todas-las-herramientas', 'en')).toBe('all-tools');
  });
});
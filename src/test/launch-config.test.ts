import { describe, expect, it } from 'vitest';
import { absoluteUrl, adsTxt, ga4Id, isIndexable, robotsTxt, siteConfig } from '@/lib/site-config';
import { sitemapXml } from '@/lib/sitemap';
const live = { ...siteConfig, siteUrl: 'https://photo.example.com', indexingApproved: true, ga4Id: 'G-ABC1234', adsensePublisherId: 'pub-1234567890123456' };
describe('launch configuration', () => {
  it('keeps indexing and advertising off while the supplied GA4 ID is prepared', () => {
    expect(isIndexable()).toBe(false);
    expect(absoluteUrl('/en')).toBe('https://molviraphoto.com/en');
    expect(robotsTxt()).toContain('Disallow: /');
    expect(ga4Id()).toBe('G-8DVNVSTRCH');
    expect(adsTxt()).toBeNull();
  });
  it('does not index with a domain but without approval', () => {
    expect(isIndexable({ ...live, indexingApproved: false })).toBe(false);
  });
  it('builds absolute URLs, robots and ads.txt once configured', () => {
    expect(absoluteUrl('/en', live)).toBe('https://photo.example.com/en');
    expect(robotsTxt(live)).toContain('Sitemap: https://photo.example.com/sitemap.xml');
    expect(adsTxt(live)).toBe('google.com, pub-1234567890123456, DIRECT, f08c47fec0942fa0\n');
  });
  it('lists home, 12 available tools and 5 institutional pages in three languages', () => {
    const xml = sitemapXml(live);
    expect(xml.match(/<url>/g)?.length).toBe((1 + 12 + 5) * 3);
    expect(xml).not.toContain('remove-image-background');
    expect(xml).not.toContain('remover-fundo-de-imagem');
    expect(xml).not.toContain('eliminar-fondo-de-imagen');
    expect(xml).toContain('<loc>https://photo.example.com/pt/criador-de-imagens-para-whatsapp</loc>');
    expect(xml).toContain('hreflang="pt-BR"');
  });
});

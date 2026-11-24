import { describe, expect, it } from 'vitest';
import { absoluteUrl, adsTxt, ga4Id, isIndexable, robotsTxt, siteConfig } from '@/lib/site-config';
import { sitemapXml } from '@/lib/sitemap';
const live = { ...siteConfig, siteUrl: 'https://photo.example.com', indexingApproved: true, ga4Id: 'G-ABC1234', adsensePublisherId: 'pub-1234567890123456' };
describe('launch configuration', () => {
  it('allows owner-approved indexing while preserving GA4 and disabled advertising', () => {
    expect(isIndexable()).toBe(true);
    expect(absoluteUrl('/en')).toBe('https://molviraphoto.com/en');
    expect(robotsTxt()).toBe('User-agent: *\nAllow: /\n\nSitemap: https://molviraphoto.com/sitemap.xml\n');
    expect(ga4Id()).toBe('G-8DVNVSTRCH');
    expect(adsTxt()).toBe('google.com, pub-2354052146318758, DIRECT, f08c47fec0942fa0\n');
  });
  it('does not index with a domain but without approval', () => {
    expect(isIndexable({ ...live, indexingApproved: false })).toBe(false);
  });
  it('builds absolute URLs, robots and ads.txt once configured', () => {
    expect(absoluteUrl('/en', live)).toBe('https://photo.example.com/en');
    expect(robotsTxt(live)).toContain('Sitemap: https://photo.example.com/sitemap.xml');
    expect(adsTxt(live)).toBe('google.com, pub-1234567890123456, DIRECT, f08c47fec0942fa0\n');
  });
  it('lists home, 13 tools and 5 institutional pages in three languages (57 URLs)', () => {
    const xml = sitemapXml(live);
    expect(xml.match(/<url>/g)?.length).toBe(57);
    expect(xml).toContain('<loc>https://photo.example.com/en/remove-image-background</loc>');
    expect(xml).toContain('<loc>https://photo.example.com/pt/remover-fundo-de-imagem</loc>');
    expect(xml).toContain('<loc>https://photo.example.com/es/eliminar-fondo-de-imagen</loc>');
    expect(xml).toContain('<loc>https://photo.example.com/pt/criador-de-imagens-para-whatsapp</loc>');
    expect(xml).toContain('hreflang="pt-BR"');
  });
});

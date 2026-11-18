/**
 * Launch configuration. Every value stays empty until the owner supplies it;
 * empty values keep the site non-indexable and load no third-party scripts.
 */
export const siteConfig = {
  /** Official origin, https only, no trailing slash (e.g. https://photo.example.com). */
  siteUrl: 'https://molviraphoto.com',
  /** Set true only after owner approval to allow search indexing. Requires siteUrl. */
  indexingApproved: false,
  /** Google Search Console HTML-tag verification content value. */
  searchConsoleToken: '1QQZByrgeFpfCFLRMDEkRnUZdvxOBc3PAmk4mR19VFE',
  /** GA4 measurement ID (G-XXXXXXXX). */
  ga4Id: import.meta.env['VITE_LOVABLE_CONNECTOR_GOOGLE_ANALYTICS_API_KEY'] ?? 'G-8DVNVSTRCH',
  /** AdSense publisher ID (pub-XXXXXXXXXXXXXXXX). */
  adsensePublisherId: '',
};

const validOrigin = (u: string) => /^https:\/\/[a-z0-9.-]+\.[a-z]{2,}$/i.test(u);

export function siteOrigin(config = siteConfig) {
  return validOrigin(config.siteUrl) ? config.siteUrl : '';
}
export function absoluteUrl(path: string, config = siteConfig) {
  return siteOrigin(config) + path;
}
export function isIndexable(config = siteConfig) {
  return config.indexingApproved && !!siteOrigin(config);
}
export function ga4Id(config = siteConfig) {
  return /^G-[A-Z0-9]{4,}$/.test(config.ga4Id) ? config.ga4Id : '';
}
export function adsenseId(config = siteConfig) {
  return /^pub-\d{16}$/.test(config.adsensePublisherId) ? config.adsensePublisherId : '';
}
export function robotsTxt(config = siteConfig) {
  if (!isIndexable(config)) return 'User-agent: *\nDisallow: /\n';
  return `User-agent: *\nAllow: /\n\nSitemap: ${siteOrigin(config)}/sitemap.xml\n`;
}
export function adsTxt(config = siteConfig) {
  const id = adsenseId(config);
  return id ? `google.com, ${id}, DIRECT, f08c47fec0942fa0\n` : null;
}

import { equivalentSlug, institutional, languages, tools, type Language } from './photo/content';
import { absoluteUrl, siteConfig } from './site-config';
import { isToolAvailable } from './photo/availability';

const hreflang = (l: Language) => (l === 'pt' ? 'pt-BR' : l);

/** All public pages (home + tools + institutional) in EN/PT/ES with hreflang alternates. */
export function sitemapXml(config = siteConfig) {
  const groups: string[][] = [languages.map((l) => `/${l}`)];
  for (const t of tools.filter(t => isToolAvailable(t.id))) groups.push([...t.slugs].map((s, i) => `/${languages[i]}/${s}`));
  for (const k of Object.keys(institutional) as (keyof typeof institutional)[])
    groups.push([...institutional[k]].map((s, i) => `/${languages[i]}/${s}`));
  void equivalentSlug;
  const urls = groups.flatMap((g) =>
    g.map((path) => {
      const alts = g.map((p, i) => `<xhtml:link rel="alternate" hreflang="${hreflang(languages[i] ?? "en")}" href="${absoluteUrl(p, config)}"/>`).join('');
      const xd = `<xhtml:link rel="alternate" hreflang="x-default" href="${absoluteUrl(g[0] ?? "", config)}"/>`;
      return `<url><loc>${absoluteUrl(path, config)}</loc>${alts}${xd}</url>`;
    }),
  );
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls.join('\n')}\n</urlset>\n`;
}

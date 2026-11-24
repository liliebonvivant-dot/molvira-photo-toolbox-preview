import type { Language } from './content';

export const ecosystemSlugs: Record<Language, string> = {
  en: 'all-tools', pt: 'todas-as-ferramentas', es: 'todas-las-herramientas',
};

export const ecosystemCopy = {
  en: { title: 'Discover all our tools', link: 'View all tools', description: 'Explore MOLVIRA PDF, MOLVIRA PHOTO and MOLVIRA CALC in the MOLVIRA ecosystem.', pdf: 'Free tools to merge, split, organize, convert and edit PDF documents with ease, speed and privacy.', photo: 'Free tools to edit, resize, convert and create images for social media, business and personal use, directly in your browser.', calc: '100 free online calculators for math, finance, health, dates and much more.', visit: 'Visit website' },
  pt: { title: 'Conheça todas as nossas ferramentas', link: 'Ver todas as ferramentas', description: 'Explore o MOLVIRA PDF, o MOLVIRA PHOTO e o MOLVIRA CALC no ecossistema MOLVIRA.', pdf: 'Ferramentas gratuitas para juntar, dividir, organizar, converter e editar documentos PDF com facilidade, rapidez e privacidade.', photo: 'Ferramentas gratuitas para editar, redimensionar, converter e criar imagens para redes sociais, negócios e uso pessoal, diretamente no navegador.', calc: '100 calculadoras online gratuitas para matemática, finanças, saúde, datas e muito mais.', visit: 'Visitar site' },
  es: { title: 'Conoce todas nuestras herramientas', link: 'Ver todas las herramientas', description: 'Explora MOLVIRA PDF, MOLVIRA PHOTO y MOLVIRA CALC en el ecosistema MOLVIRA.', pdf: 'Herramientas gratuitas para unir, dividir, organizar, convertir y editar documentos PDF con facilidad, rapidez y privacidad.', photo: 'Herramientas gratuitas para editar, redimensionar, convertir y crear imágenes para redes sociales, negocios y uso personal, directamente en el navegador.', calc: '100 calculadoras en línea gratuitas para matemáticas, finanzas, salud, fechas y mucho más.', visit: 'Visitar sitio' },
};

// Add only existing, owner-approved products to this list.
export const ecosystemProducts = [
  { id: 'pdf', name: 'MOLVIRA PDF', url: 'https://molvirapdf.com' },
  { id: 'photo', name: 'MOLVIRA PHOTO', url: 'https://molviraphoto.com' },
  { id: 'calc', name: 'MOLVIRA CALC', url: 'https://molviracalc.com' },
] as const;

// MOLVIRA CALC uses localized routes (/en, /pt, /es) that match PHOTO's languages.
export function ecosystemProductUrl(productId: string, lang: Language): string {
  const product = ecosystemProducts.find(({ id }) => id === productId);
  if (!product) return 'https://molviraphoto.com';
  return product.id === 'calc' ? `${product.url}/${lang}` : product.url;
}
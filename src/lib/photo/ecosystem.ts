import type { Language } from './content';

export const ecosystemSlugs: Record<Language, string> = {
  en: 'all-tools', pt: 'todas-as-ferramentas', es: 'todas-las-herramientas',
};

export const ecosystemCopy = {
  en: { title: 'Discover all our tools', link: 'View all tools', description: 'Explore MOLVIRA PDF and MOLVIRA PHOTO in the MOLVIRA ecosystem.', pdf: 'Free tools to merge, split, organize, convert and edit PDF documents with ease, speed and privacy.', photo: 'Free tools to edit, resize, convert and create images for social media, business and personal use, directly in your browser.', visit: 'Visit website' },
  pt: { title: 'Conheça todas as nossas ferramentas', link: 'Ver todas as ferramentas', description: 'Explore o MOLVIRA PDF e o MOLVIRA PHOTO no ecossistema MOLVIRA.', pdf: 'Ferramentas gratuitas para juntar, dividir, organizar, converter e editar documentos PDF com facilidade, rapidez e privacidade.', photo: 'Ferramentas gratuitas para editar, redimensionar, converter e criar imagens para redes sociais, negócios e uso pessoal, diretamente no navegador.', visit: 'Visitar site' },
  es: { title: 'Conoce todas nuestras herramientas', link: 'Ver todas las herramientas', description: 'Explora MOLVIRA PDF y MOLVIRA PHOTO en el ecosistema MOLVIRA.', pdf: 'Herramientas gratuitas para unir, dividir, organizar, convertir y editar documentos PDF con facilidad, rapidez y privacidad.', photo: 'Herramientas gratuitas para editar, redimensionar, convertir y crear imágenes para redes sociales, negocios y uso personal, directamente en el navegador.', visit: 'Visitar sitio' },
};

// Add only existing, owner-approved products to this list.
export const ecosystemProducts = [
  { id: 'pdf', name: 'MOLVIRA PDF', url: 'https://molvirapdf.com' },
  { id: 'photo', name: 'MOLVIRA PHOTO', url: 'https://molviraphoto.com' },
] as const;
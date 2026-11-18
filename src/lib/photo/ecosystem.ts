import type { Language } from './content';

export const ecosystemSlugs: Record<Language, string> = {
  en: 'all-tools', pt: 'todas-as-ferramentas', es: 'todas-las-herramientas',
};

export const ecosystemCopy = {
  en: { title: 'Discover all our tools', link: 'View all tools', description: 'Explore MOLVIRA PDF and MOLVIRA PHOTO in the MOLVIRA ecosystem.', pdf: 'PDF tools', photo: 'Image tools', visit: 'Visit website' },
  pt: { title: 'Conheça todas as nossas ferramentas', link: 'Ver todas as ferramentas', description: 'Explore o MOLVIRA PDF e o MOLVIRA PHOTO no ecossistema MOLVIRA.', pdf: 'Ferramentas de PDF', photo: 'Ferramentas de imagem', visit: 'Visitar site' },
  es: { title: 'Conoce todas nuestras herramientas', link: 'Ver todas las herramientas', description: 'Explora MOLVIRA PDF y MOLVIRA PHOTO en el ecosistema MOLVIRA.', pdf: 'Herramientas de PDF', photo: 'Herramientas de imagen', visit: 'Visitar sitio' },
};

// Add only existing, owner-approved products to this list.
export const ecosystemProducts = [
  { id: 'pdf', name: 'MOLVIRA PDF', url: 'https://molvirapdf.com' },
  { id: 'photo', name: 'MOLVIRA PHOTO', url: 'https://molviraphoto.com' },
] as const;
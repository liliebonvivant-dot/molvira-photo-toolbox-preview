import { createFileRoute, notFound } from '@tanstack/react-router';
export const Route = createFileRoute('/experimental/birefnet')({
  // No component import: neither preloading nor navigation can ship the prototype graph.
  // This is a closed route, not a client-side authentication mechanism.
  beforeLoad: () => { throw notFound(); },
  head: () => ({ meta: [
    { title: 'MOLVIRA PHOTO — Protótipo BiRefNet-lite' },
    { name: 'description', content: 'Avaliação experimental local de remoção de fundo com BiRefNet-lite. Não aprovado para publicação.' },
    { property: 'og:title', content: 'MOLVIRA PHOTO — Protótipo BiRefNet-lite' },
    { property: 'og:description', content: 'Comparação experimental local de qualidade e desempenho, sem envio de fotografias.' },
    { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' },
    { name: 'robots', content: 'noindex, nofollow' },
  ] }),
});
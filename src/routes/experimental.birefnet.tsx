import { createFileRoute } from '@tanstack/react-router';
import { BiRefnetPrototype } from '@/components/photo/birefnet-prototype';
export const Route = createFileRoute('/experimental/birefnet')({
  head: () => ({ meta: [
    { title: 'MOLVIRA PHOTO — Protótipo BiRefNet-lite' },
    { name: 'description', content: 'Avaliação experimental local de remoção de fundo com BiRefNet-lite. Não aprovado para publicação.' },
    { property: 'og:title', content: 'MOLVIRA PHOTO — Protótipo BiRefNet-lite' },
    { property: 'og:description', content: 'Comparação experimental local de qualidade e desempenho, sem envio de fotografias.' },
    { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' },
    { name: 'robots', content: 'noindex, nofollow' },
  ] }),
  component: BiRefnetPrototype,
});
import { instagramCopy } from './instagram-copy';
const en = { ...instagramCopy.en,
  metadata: 'Prepare product images locally for online shops and catalogs. Choose dimensions, proportional framing, margins and backgrounds; export JPG, PNG or WebP with MOLVIRA PHOTO.',
  preview: 'Product image preview', preset: 'Product image dimensions', square: 'Square · 1000 × 1000', hd: 'Square HD · 1200 × 1200', high: 'High-resolution square · 2000 × 2000', portrait: 'Portrait · 1000 × 1250', landscape: 'Landscape · 1200 × 900',
  reference: 'Creation references only; marketplace requirements may differ. No platform compatibility is certified.',
  backgroundNote: 'Composition color does not remove the original photo background.', opaque: 'This photo has no declared alpha channel. Its original opaque background remains in the result.', alphaNote: 'An alpha channel does not guarantee a transparent background; opaque areas of the original photo remain unchanged.',
  margin: 'Internal margin', marginPreset: 'Margin preset', none: 'No margin', small: 'Small · 5%', medium: 'Medium · 10%', large: 'Large · 15%', center: 'Center photo', backgroundPreset: 'Composition background', white: 'White', black: 'Black', gray: 'Light gray', customColor: 'Custom color',
};
type EcommerceCopy = { [K in keyof typeof en]: string };
const pt: EcommerceCopy = { ...instagramCopy.pt,
  metadata: 'Prepare imagens de produtos localmente para lojas virtuais e catálogos. Escolha dimensões, enquadramento proporcional, margens e fundos; exporte JPG, PNG ou WebP com MOLVIRA PHOTO.',
  preview: 'Pré-visualização do produto', preset: 'Dimensões da imagem de produto', square: 'Quadrado · 1000 × 1000', hd: 'Quadrado HD · 1200 × 1200', high: 'Quadrado de alta resolução · 2000 × 2000', portrait: 'Retrato · 1000 × 1250', landscape: 'Paisagem · 1200 × 900',
  reference: 'Referências de criação; as exigências dos marketplaces podem variar. Não há certificação de compatibilidade com plataformas.',
  backgroundNote: 'A cor da composição não remove o fundo original da fotografia.', opaque: 'Esta fotografia não declara canal alfa. Seu fundo original opaco permanece no resultado.', alphaNote: 'Um canal alfa não garante fundo transparente; áreas opacas da fotografia original permanecem intactas.',
  margin: 'Margem interna', marginPreset: 'Opção de margem', none: 'Sem margem', small: 'Pequena · 5%', medium: 'Média · 10%', large: 'Grande · 15%', center: 'Centralizar fotografia', backgroundPreset: 'Fundo da composição', white: 'Branco', black: 'Preto', gray: 'Cinza-claro', customColor: 'Cor personalizada',
};
const es: EcommerceCopy = { ...instagramCopy.es,
  metadata: 'Prepara imágenes de productos localmente para tiendas online y catálogos. Elige dimensiones, encuadre proporcional, márgenes y fondos; exporta JPG, PNG o WebP con MOLVIRA PHOTO.',
  preview: 'Vista previa del producto', preset: 'Dimensiones de la imagen de producto', square: 'Cuadrado · 1000 × 1000', hd: 'Cuadrado HD · 1200 × 1200', high: 'Cuadrado de alta resolución · 2000 × 2000', portrait: 'Retrato · 1000 × 1250', landscape: 'Paisaje · 1200 × 900',
  reference: 'Referencias de creación; los requisitos de marketplaces pueden variar. No se certifica compatibilidad con plataformas.',
  backgroundNote: 'El color de la composición no elimina el fondo original de la fotografía.', opaque: 'Esta fotografía no declara canal alfa. Su fondo original opaco permanece en el resultado.', alphaNote: 'Un canal alfa no garantiza un fondo transparente; las zonas opacas de la fotografía original permanecen intactas.',
  margin: 'Margen interno', marginPreset: 'Opción de margen', none: 'Sin margen', small: 'Pequeño · 5%', medium: 'Medio · 10%', large: 'Grande · 15%', center: 'Centrar fotografía', backgroundPreset: 'Fondo de la composición', white: 'Blanco', black: 'Negro', gray: 'Gris claro', customColor: 'Color personalizado',
};
export const ecommerceCopy = { en,pt,es };
# MOLVIRA PHOTO — E-commerce Image Maker

## Implementação
- Disponível somente na prévia: `/en/ecommerce-image-maker`, `/pt/criador-de-imagens-para-ecommerce`, `/es/creador-de-imagenes-para-ecommerce`.
- JPG/JPEG, PNG e WebP com validação por cabeçalho e os limites existentes: 20 MiB, 50 MP, 12.000 px por lado. Foto exibida com dimensões originais, indicação de cópia reduzida e prévia do resultado.
- Formatos exatos: 1000×1000, 1200×1200, 2000×2000, 1000×1250 e 1200×900; dimensões personalizadas.
- Mostrar foto inteira, preencher com recorte proporcional, zoom 0,1–4×, posições independentes, arraste por mouse/toque, pinch-to-zoom, rotação 90°, centralização, desfazer/refazer até 30 passos e restauração dos ajustes iniciais.
- Margens sem/pequena/média/grande: 0/5/10/15%; ajuste personalizado de 0–40%. Cada margem usa a porcentagem do menor lado da saída, igual em pixels nos quatro lados. A área interna é recortada para manter o espaço reservado mesmo com zoom ou deslocamento.
- Fundo branco, preto, cinza-claro, cor personalizada e transparência. JPG sempre opaco com a cor selecionada; PNG/WebP preservam transparência quando solicitada.
- Avisos EN/PT/ES: os tamanhos são referências, não certificações; alterar o fundo da composição não remove o fundo original. A inspeção de canal alfa não promete transparência efetiva onde o original é opaco.
- Prévia e exportação usam o mesmo desenho em pixels de saída. Prévia limitada a 4 MP/2000 px por lado: todos os formatos predefinidos são desenhados na resolução nativa; saídas personalizadas maiores usam prévia reduzida, sem alterar o tamanho do arquivo final.
- Processamento local e temporário, sem cadastro, envio de fotos, banco de dados, nova biblioteca, serviço pago ou API externa. Recursos e URLs temporários são liberados. Redução de fonte/saída somente por confirmação explícita.
- Reutilizados validação, orçamento de memória, carregamento local, posicionamento proporcional, composição por Canvas, codificação limitada e entrega manual/compartilhamento existentes. UI/copy/desenho de e-commerce isolados; nenhuma edição nos arquivos dos processadores anteriores.
- O seletor compartilhado de ferramenta usa agora um registro tipado: a antiga apresentação não funcional ficou inalcançável com a ativação da última ferramenta e foi removida. Design global e catálogo/ordem preservados; cartão de e-commerce marcado disponível na prévia.

## Validação automatizada
- `bunx vitest run`: **336 testes em 21 arquivos aprovados** (300 anteriores + 36 novos).
- Regras testadas: cinco dimensões exatas, saída personalizada, proporções, preencher/ajustar, zoom, posições, centralização, rotações, margens, cores, alfa/JPG opaco, codificação nos três formatos, liberação de Canvas/URLs, limites e histórico.

## Verificação na interface — Chromium
- Uploads reais JPG/PNG/WebP; original e dimensões conferidos.
- **22 downloads reais**: 18 dos cinco formatos e saída personalizada 800×500 nos três tipos, três de fonte parcialmente transparente e um de fonte opaca com composição transparente.
- PNG dos cinco formatos e personalizado: **pixel a pixel idêntico à prévia nativa**, incluindo margem, rotação, zoom e posições.
- JPG/WebP: dimensões exatas e mesmas posições; diferenças de compressão esperadas. Média por canal (0–255), qualidade 95: JPG 0,3273–0,5881; WebP 0,2468–0,5166 nesta imagem de teste.
- Margens 0/5/10/15% e 7,5% personalizadas; branco/preto/cinza e cor #12AB34; centralização preservou zoom.
- PNG/WebP: alfa 0 e 128 confirmados; JPG totalmente opaco. A foto opaca permaneceu opaca dentro da composição transparente, sem segmentação.
- EN → PT → ES → EN preservou foto, zoom, margem e dimensões; metadados e noindex conferidos.
- Telas 1280×1800, 768×1024, 491×967 e 375×812 sem transbordamento horizontal.
- Toque emulado: arraste mudou posição, desfazer restaurou, dois dedos aumentaram zoom aproximadamente 2×, controle deslizante não deslocou a página.
- Fonte de 48 MP ofereceu redução para 4472×3354 antes da decodificação no perfil iPhone. Cancelar não criou fonte/cópia reduzida.
- **Doze páginas anteriores HTTP 200**, sem erros JavaScript: Resize, Crop & Rotate, Convert, Compress, Add Watermark, Remove Background, White Background, Add Text/Prices/Logos, Collage, Instagram, WhatsApp e Product Ad.
- BiRefNet permaneceu HTTP 404; nenhum POST de fotografia ou download de modelo foi observado.

## Pendências e limites
- Validação prática do proprietário e aparelhos físicos Safari/iPhone/iPad/Android ainda pendentes. Chromium emulado não certifica esses dispositivos nem seus limites de memória.
- Capacidade de processamento depende do dispositivo; orçamento de memória é estimado. Imagens maiores podem exigir cópia reduzida explicitamente aceita.
- Após aceitar redução, a visualização da fonte usa a cópia de trabalho, com dimensões originais e reduzidas informadas; não se mantém uma segunda decodificação integral para comparação.
- JPG/WebP com perdas, fontes sem metadados EXIF/ICC/HDR/animação preservados pela composição Canvas; requisitos dos marketplaces devem ser verificados pelo usuário.
- Trabalho temporário: recarregar descarta fotografia e ajustes. Apenas a preferência de idioma é persistida.
- Licença AGPL da Remover Fundo permanece pendente e inalterada; protótipo experimental continua bloqueado. Domínio final/sitemap de lançamento permanecem pendentes de aprovação.
- **Não publicado; aguardando validação prática e aprovação expressa.**
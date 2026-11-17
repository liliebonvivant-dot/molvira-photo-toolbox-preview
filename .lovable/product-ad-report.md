# MOLVIRA PHOTO — Product Ad Maker

## Situação
Implementado para avaliação prática em prévia, sem publicação e sem aprovação presumida.

- EN: `/en/product-ad-maker`
- PT: `/pt/criador-de-anuncios-de-produtos`
- ES: `/es/creador-de-anuncios-de-productos`

## Implementação
- Cinco modelos: Oferta simples, Promoção, Catálogo, Oferta para WhatsApp e Publicação para Instagram. Os modelos compartilham composição editável: Promoção acrescenta preço anterior riscado e selo quando esses campos forem preenchidos; Catálogo posiciona nome no alto e logotipo na região inferior; WhatsApp parte do formato vertical e Instagram do quadrado.
- Nenhum nome, preço, desconto, descrição ou mensagem comercial é preenchido automaticamente. Moeda/símbolo é editável e não faz cálculos ou conversão: vírgulas e pontos permanecem literais.
- Fotografia JPG/JPEG, PNG ou WebP: carregar, substituir, remover, ajustar posição, ampliar/reduzir, girar em passos de 90°, mostrar inteira ou preencher a área com recorte.
- Nome, descrição, preço atual/anterior e texto promocional editáveis; cor, fonte local, tamanho e posição por campo. Selo de promoção com cor independente. Textos ficam limitados a 500 caracteres por campo.
- Logotipo PNG/WebP, incluindo transparência: carregar/substituir/remover e ajustar tamanho e posição, mantendo proporções. Logotipos JPEG não são aceitos nesta versão.
- Quatro formatos exatos: 1080×1080; 1080×1350; 1080×1920; 1200×675. Troca de formato mantém dados e posições proporcionais. Troca de modelo mantém os textos, preços, moeda e imagens, reorganizando posições; WhatsApp e Instagram selecionam respectivamente o formato vertical e quadrado.
- Prévia em pixels nativos do formato escolhido, usando a mesma composição da exportação. Sem guias embutidas no arquivo. Textos longos são quebrados e ajustados para caber; preços usam uma linha ajustada; caixas de texto/logotipo são mantidas dentro da saída.
- Arraste por mouse/toque, posições numéricas por controles e setas do teclado, desfazer/refazer de até 30 alterações. Restaurar exige confirmação, limpa textos/preços/logotipo/ajustes e conserva foto, modelo e formato; também pode ser desfeito.
- Exportação JPG/PNG/WebP somente mediante comando, com qualidade ajustável para JPG/WebP e salvamento/abertura/compartilhamento locais já existentes. Fundo do anúncio é opaco em todos os formatos; o alfa do logotipo é composto sobre esse fundo.

## Privacidade, memória e preservação
- Processamento local, sem cadastro, APIs pagas, biblioteca nova ou persistência de fotografias. Só a preferência de idioma continua armazenada.
- Cabeçalhos validados; limites herdados de 20 MiB, 50 MP e 12.000 px por lado. Fotos e logotipos únicos retidos no histórico entram no orçamento estimado. Logotipo tem orçamento máximo de 16 MP. Cópia reduzida é oferecida antes de decodificar quando necessário, ou após falha de processamento; redução nunca é automática.
- Substituição preserva dados comerciais e permite desfazer. Recursos de imagens só são mantidos enquanto usados pela composição ou histórico; URLs/canvas são liberados ao descarte e saída da página. Histórico de fotografias grandes pode consumir memória e impedir novas cargas até remover referências antigas ou iniciar nova edição.
- As onze implementações anteriores não foram modificadas. Alterações compartilhadas ficaram restritas ao encaminhamento desta ferramenta, sua descrição específica nos metadados e seu cartão “Disponível na prévia”; status das demais ferramentas inalterados.
- BiRefNet continua bloqueado com HTTP 404. Nenhum novo modelo ou dependência AGPL foi introduzido. A licença AGPL da Remover Fundo continua pendente, sem publicação.

## Verificações realizadas
- **293 testes unitários/regressões aprovados em 20 arquivos**: 257 anteriores + 36 novos. Último registro de compilação: `build OK`.
- Navegador Chromium, arquivos reais: carga/substituição de fotografias e logotipo; retirada e restauração por desfazer; cinco modelos; preços `1.234,56` e `2,345.67`; caracteres especiais; cores; restauração confirmada/cancelada; formatos sem perda dos dados.
- Três downloads reais, JPG/PNG/WebP em 1200×675, conferidos com decodificação dos arquivos.
- Quatro downloads PNG adicionais com cada resolução exata. PNG horizontal comparado pixel a pixel com o Canvas nativo da prévia: idêntico.
- Troca EN→PT→ES preservou valores/composição. Títulos, descrições, Open Graph, canonical/hreflang e noindex conferidos nos três idiomas. Sitemap de desenvolvimento já continha os três endereços e não precisou mudar.
- Telas 1280×1800, 491×967, 375×812 e 768×1024 verificadas sem excesso horizontal; screenshots revisados.
- Toque emulado: arraste da foto alterou posições sem rolar; desfazer/refazer restaurou valores; movimento do controle de ampliação não rolou a página.
- JPG de 8000×6000 (48 MP) com identificação de iPhone: pedido explícito de cópia menor antes de decodificar; cancelamento manteve exportação indisponível, sem criar imagem reduzida.
- As onze páginas anteriores abriram com HTTP 200 e título visível; rota experimental retornou 404; nenhum erro JavaScript, POST de imagem ou download de modelo observado durante os fluxos.
- Testes detectaram e corrigiram duas questões: restaurar WhatsApp/Instagram agora respeita o formato escolhido; posicionamento da fotografia não recebe por engano a posição percentual destinada à caixa, mantendo-a visível no anúncio.

## Limitações e pendências
- Aprovação prática do proprietário ainda necessária.
- Safari/iPhone/iPad/Android físicos e compartilhamento nativo nesses aparelhos não foram testados; emulação Chromium não substitui essas verificações.
- Orçamento de memória é uma estimativa; não houve simulação de falha real do sistema operacional por falta de RAM nem garantia universal para 24/48 MP. A prévia usa no máximo os pixels do maior formato autorizado (1080×1920), mas decodificação/Canvas pode usar memória adicional.
- JPG/WebP são formatos com perdas: fidelidade significa a mesma composição, não igualdade pixel a pixel depois da compressão. Igualdade exata foi verificada para PNG na mesma resolução.
- Textos muito longos podem ficar pequenos; o ajuste garante contenção, não leitura em qualquer tamanho. Posicionamento manual pode sobrepor elementos; não há detecção automática de colisões. Enquadramento com preenchimento, ampliação ou deslocamento pode recortar a foto por escolha do usuário; o padrão mostra a foto inteira.
- Edição temporária: recarregar ou sair descarta o trabalho. Fontes locais e emojis podem variar entre sistemas. Perfis ICC, EXIF, HDR e animação não são preservados.
- Modelos não removem automaticamente o fundo da fotografia. Nenhum recurso de segmentação foi adicionado.
- URLs canonical/hreflang/sitemap permanecem relativas no inventário de desenvolvimento existente; domínio absoluto depende de aprovação antes do lançamento. Página permanece noindex/nofollow; não é declarada publicada nem indexada.

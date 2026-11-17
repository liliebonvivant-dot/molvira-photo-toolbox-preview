# MOLVIRA PHOTO — Etapa 1: correções técnicas e consistência

Data: 17/11/2026. Projeto mantido em prévia, sem publicação.

## 1. Correções efetivamente implementadas

### Preços — Add Text, Prices & Logos
- Extraída a lógica existente do Product Ad Maker para um módulo compartilhado, sem alterar o comportamento do anúncio.
- Símbolos reconhecidos nas extremidades do preço são removidos antes de aplicar uma única vez a moeda selecionada: `R$ 19,90` com moeda `R$` resulta em `R$ 19,90`.
- Preservados o valor digitado, vírgulas, pontos, espaços internos e moeda selecionada; não há conversão cambial nem reformatação numérica.
- Correção usada pela composição da prévia/exportação e pela identificação da camada na lista de elementos. Textos comuns e logotipos não são normalizados.
- Reconhecimento herdado: moeda selecionada, R$, US$, CA$, AU$, BRL, USD, EUR, GBP e símbolos monetários Unicode; não é um interpretador universal de todos os códigos monetários.

### Disponibilidade e privacidade — EN/PT/ES
- Os 13 cartões informam disponibilidade na prévia usando o componente existente.
- Corrigidos avisos, perguntas frequentes e textos de Sobre, Privacidade e Termos que negavam processamento/exportação.
- Mantido o caráter de prévia, com lançamento condicionado à aprovação do proprietário e validação física ainda pendente.
- Os textos distinguem processamento local de funcionamento offline: algumas ferramentas baixam decodificadores/modelos/runtime externos; as imagens não são enviadas para processamento.
- A política informa também que solicitações de componentes contatam seus fornecedores com dados ordinários de requisição, como IP; apenas a preferência de idioma é persistida pela aplicação.
- Preservadas informações corretas de cookies, ausência de publicidade/analytics e contato pendente. Nenhuma integração adicionada.

### Memória — White Background Maker
- Leitura única dos bytes para validação do cabeçalho, dimensões e alfa; antes o arquivo era lido duas vezes.
- Reutilização do orçamento estimado do dispositivo e da verificação de capacidade de Canvas antes da decodificação, via carregador local já existente.
- Oferta explícita de cópia proporcional reduzida quando a resolução excede a capacidade estimada; cancelar não decodifica nem reduz a imagem.
- Em falha de decodificação/exportação de imagens acima de 16 MP, reaproveitada a oferta conservadora existente; o usuário pode cancelar ou aceitar, sem redução silenciosa.
- Fonte anterior liberada antes da decodificação da substituta; URLs e resultados obsoletos liberados.
- Composições serializadas e canceláveis entre faixas para impedir sobreposição de Canvas completos após alterações/substituições.
- Composição straight-alpha sobre branco puro mantida, com memória adicional de pixels limitada a aproximadamente 4 MiB por faixa; Canvas zerado ao finalizar ou falhar.
- Resoluções nativas preservadas quando a capacidade permite; quando reduzida por escolha, a cópia e as resoluções original/de trabalho são identificadas.
- JPG, PNG, WebP e alternativas existentes de abrir/salvar/compartilhar preservados.

## 2. Arquivos/componentes modificados

Código:
- `src/lib/photo/currency.ts` — novo utilitário pequeno com a normalização existente.
- `src/lib/photo/text-editor.ts` — preço normalizado na composição compartilhada.
- `src/lib/photo/product-ad.ts` — passa a chamar o mesmo utilitário, sem mudanças nos modelos/posições/preço anterior.
- `src/components/photo/text-editor-workspace.tsx` — preço normalizado na lista de camadas.
- `src/lib/photo/content.ts` — somente textos de disponibilidade/privacidade nas três línguas; catálogo, slugs e função SEO preservados.
- `src/components/photo/tool-card.tsx` — status uniforme das 13 ferramentas.
- `src/lib/photo/white-background.ts` — validação única, carregamento/liberação de fonte e composição cancelável.
- `src/components/photo/white-background-workspace.tsx` — oferta explícita existente de redução, gerenciamento de recursos e resolução de trabalho.
- `src/lib/photo/white-background-copy.ts` — rótulo de resolução reduzida EN/PT/ES; metadados existentes inalterados.

Testes/documentação:
- `src/test/text-editor.test.ts`, `src/test/white-background.test.ts`.
- `AGENTS.md`, `roadmap.md` e este relatório.

## 3. Evidências de validação

### Automatizados
- Comando: `bunx vitest run`.
- **348 testes aprovados em 21 arquivos, zero falhas**: 336 anteriores + 7 casos monetários + 5 casos de validação/memória/cancelamento.
- Preservados todos os testes de Resize, Crop, Convert, Compress, Watermark, Remove Background, White Background, editor de camadas, Collage, Instagram, WhatsApp, Product Ad e E-commerce, além de isolamento experimental, entrega e roteamento.
- Os novos testes verificam valores concretos, leitura única, oferta de redução antes de criar imagem em iPhone, preservação de dimensões quando suportadas, liberação da fonte e cancelamento sem codificação/Canvas retido.
- Último registro disponível da prévia: **build OK**, sem erros. `git diff --check` sem problemas.

### Navegador Chromium — execução real nesta etapa
- As **39 páginas de ferramentas (13 × EN/PT/ES)** responderam 200 e exibiram título, controle de arquivo e `noindex, nofollow`.
- Catálogo com 13 cartões e status correto em cada língua; páginas de privacidade nas três línguas verificadas.
- **10 downloads reais**: seis do Fundo Branco (entradas PNG e WebP × saídas JPG/PNG/WebP), três do editor de preços e um PNG de cópia reduzida.
- Fundo Branco: 640×480 preservados nos seis arquivos; todos opacos; PNG com RGB exato nos pontos transparentes/parciais/opacos: branco 255/255/255, vermelho parcial 255/127/127 e região opaca 23/71/193.
- Editor: campo original `R$ 19,90` preservado; uma única moeda na lista e na prévia; exportações 640×480 em JPG/PNG/WebP. PNG comparado pixel a pixel com a prévia sem seleção: idêntico.
- EN→PT→ES→EN preservou o preço e a sessão de edição.
- Emulação iPhone, 491×967: fonte 8000×6000 (48 MP) ofereceu redução antes da imagem aparecer; cancelar manteve a área vazia e exportação desabilitada; aceitar gerou PNG 4618×3464, abaixo de 16 MP, identificado como reduzido. Sem transbordamento horizontal na tela verificada.
- Falha de codificação provocada uma vez no navegador, em 5000×4000: oferta explícita apresentada; cancelar preservou a fonte nativa sem resultado/sem redução; “Tentar novamente” teve sucesso na resolução original.
- Nenhum erro JavaScript observado nas páginas de desktop; nenhum POST nem download de modelo/runtime experimental durante esses fluxos. O único acesso experimental foi a solicitação intencional da própria página, que respondeu 404.
- Capturas da composição desktop, preço e cópia reduzida móvel revisadas visualmente.

## 4. Riscos identificados e não eliminados

- O orçamento é estimativo e o teste de Canvas não garante que todas as alocações posteriores terão memória suficiente.
- Uma imagem de 48 MP corresponde a cerca de 192 MB por superfície RGBA; fonte decodificada + Canvas completo já podem somar cerca de 384 MB, antes de encoder e imagens exibidas pelo navegador. Não foi realizada medição de pico de memória nesta etapa.
- O carregador reutilizado ainda pode decodificar a fonte completa depois que o usuário aceita redução, antes de produzir a cópia menor. Isso preserva o fluxo existente, mas não resolve todos os riscos em aparelhos muito limitados.
- Prévia original/resultado via imagens e composição automática existente ainda podem consumir memória adicional. A melhoria evita sobreposição de composições, não transforma o processamento em streaming integral nem altera a arquitetura de comparação.
- Após falha em imagem já pequena (até 16 MP), o mecanismo conservador herdado não oferece automaticamente outra redução; informa falha e permite nova tentativa/outro arquivo. Não há garantia contra encerramento da aba pelo sistema.
- Proposta não implementada: carregamento verdadeiramente limitado durante a decodificação e prévias separadas menores poderiam reduzir picos, mas exigem uma revisão arquitetural própria e aprovação antes de qualquer execução.
- JPG/WebP permanecem com perdas; Canvas não preserva perfis ICC, EXIF/HDR ou animação. Os limites de entrada continuam 20 MiB, 50 MP e 12.000 px/lado.
- Testes automatizados e Chromium não certificam Safari/iPhone/iPad/Android físicos. Não se repetiu inferência de Remove Background nem exportação manual de cada uma das outras 11 ferramentas: preservação dessas implementações foi verificada por testes existentes, inspeção das alterações e abertura das páginas, não por uma nova certificação ponta a ponta de todas elas.
- AGPL da IMG.LY, revisão LGPL do HEIF, qualidade da remoção de fundo, sitemap relativo/WhatsApp ausente e domínio de lançamento permanecem pendentes e intocados, fora desta etapa.

## 5. Preservação e publicação

- **13 ferramentas e 39 páginas preservadas**; nenhuma ferramenta removida, fundida ou adicionada.
- Sem alterações em identidade, CSS, logotipos, modelos existentes, estrutura de navegação, SEO/canonical/hreflang, sitemap, robots.txt, domínio ou bloqueio de indexação.
- Experimento BiRefNet, seus arquivos e bloqueios não modificados ou ativados; IMG.LY não substituída; nenhuma biblioteca instalada.
- Nenhum serviço externo novo, anúncio, persistência de imagem ou mudança de arquitetura de processamento geral.
- **Não publicado.** Aguardando validação do proprietário; qualquer publicação exige aprovação expressa.
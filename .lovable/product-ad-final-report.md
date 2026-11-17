# MOLVIRA PHOTO — Ajustes finais do Product Ad Maker

## Correções realizadas
- Reprodução prévia confirmou `R$ R$ 19,90` e ausência do preço anterior fora do modelo Promoção.
- Preços atual e anterior aceitam valores com ou sem símbolo. Marcadores monetários nas extremidades são removidos apenas na apresentação; a moeda selecionada é aplicada uma vez. Os valores digitados, pontos e vírgulas permanecem intactos, sem conversão monetária.
- Preço anterior preenchido agora aparece nos cinco modelos existentes, com fonte não negritada, tamanho menor por padrão, opacidade de 65% e risco. Campo vazio ou somente com marcadores monetários não gera preço.
- Prévia e exportação continuam usando o mesmo desenho em coordenadas da saída. Nenhum controle de posição, modelo, tradução, estilo da página ou outra ferramenta foi modificado.

## Testes e resultados
- `bunx vitest run`: **300 testes aprovados em 20 arquivos**, incluindo as regressões das onze ferramentas e sete casos adicionais líquidos do Product Ad. Testes existentes de preços foram atualizados para a nova regra; exportações simuladas também verificam as coordenadas escolhidas e a apresentação normalizada dos dois preços.
- Chromium: **12 downloads reais**, JPG/PNG/WebP nos quatro formatos: 1080×1080, 1080×1350, 1080×1920 e 1200×675.
- PNG: comparação pixel a pixel idêntica à prévia nativa nos quatro formatos.
- JPG/WebP: dimensões, textos e coordenadas de desenho iguais; diferenças esperadas de compressão com perdas. Diferença média por canal (escala 0–255): JPG 0,1322–0,1667; WebP 0,2106–0,3561, na imagem de teste e qualidade padrão 95.
- Preço atual em x=23%, y=87%; anterior em x=17%, y=81%: coordenadas confirmadas na prévia e nos três formatos, em todas as dimensões. Não houve reposicionamento durante a exportação.
- Cinco modelos verificados com ambos os preços preenchidos; anterior vazio deixou de ser desenhado. Opacidade e risco confirmados no desenho real.
- EN → PT → ES → EN manteve foto, preços e anúncio editado. Títulos e metadados internacionais verificados nos três idiomas.
- Telas 1280×1800, 768×1024, 491×967 e 375×812 sem transbordamento horizontal; composição de teste sem cortes ou sobreposição entre textos/preços.
- As onze páginas anteriores abriram com HTTP 200, sem erros de JavaScript. BiRefNet permaneceu HTTP 404. Nenhum POST de imagem nem download de modelo ocorreu durante essas verificações.
- Nenhuma biblioteca instalada. Alterações de execução limitadas a `src/lib/photo/product-ad.ts`; testes e roteiro atualizados.
- A prévia foi exercitada após as alterações e o servidor registrou o empacotamento atualizado. O arquivo específico `/tmp/observability/build-errors.log` não estava disponível nesta sessão; não foi executada compilação manual.

## Pendências e limites
- Aprovação do proprietário e testes em aparelhos físicos Safari/iPhone/iPad/Android permanecem necessários; Chromium e tamanhos de tela não certificam esses aparelhos.
- Elementos continuam com posições individuais livres: se o usuário escolher posições coincidentes, pode criar sobreposição intencional. Não foi introduzido reposicionamento automático que alteraria suas escolhas. O ajuste de limites já existente impede caixas de ultrapassar a saída.
- JPG/WebP continuam com perdas; fontes dependem do sistema. Valores de moeda personalizados são reconhecidos quando correspondem ao marcador selecionado; não há interpretação arbitrária de códigos de moeda desconhecidos.
- A licença AGPL da ferramenta Remover Fundo permanece pendente e não foi alterada.
- **Não publicado. Aguardando aprovação expressa antes de qualquer publicação.**
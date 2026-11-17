# MOLVIRA PHOTO — Texto, Preços e Logotipos

## Resultado
Implementação somente desta ferramenta, em prévia. Nenhuma publicação realizada. As sete ferramentas anteriores e o bloqueio do protótipo BiRefNet-lite foram preservados.

## Funcionalidades concluídas
- Imagem principal JPG/JPEG, PNG e WebP; validação do conteúdo, até 20 MB, 50 MP e 12.000 px por lado, conforme limites existentes.
- Múltiplos textos independentes e editáveis, inclusive quebras de linha, fonte, cor, tamanho, negrito, itálico, opacidade e posição.
- Múltiplos preços com R$, $, € e £, mantendo exatamente o valor digitado, sem câmbio; apresentação simples ou etiqueta com fundo escolhido.
- Múltiplos logotipos PNG/WebP com alfa preservado; tamanho proporcional, opacidade, substituição e exclusão individual.
- Seleção por toque/mouse ou lista de camadas; arrastar, redimensionar pelo canto inferior direito, controles de tamanho/posição, duplicar, trazer para frente e enviar para trás.
- Desfazer/refazer até 30 alterações. Até 50 elementos e 16 MP de logotipos únicos em memória, incluindo os retidos pelo histórico.
- Prévia limitada a 1200 × 800 px de área máxima, mantendo a proporção; composição calculada nas coordenadas da imagem original, não nas coordenadas da tela.
- Preparação do arquivo sob comando, sem recodificação de resolução total a cada ajuste; salvar/baixar e alternativas de abrir/compartilhar conforme o navegador.
- JPG, PNG e WebP na resolução original por padrão; branco puro sob transparência em JPG, alfa em PNG/WebP; nenhuma marca do MOLVIRA.
- Interface EN/PT/ES, com troca de idioma mantendo ferramenta e elementos durante a navegação interna.
- Recursos da imagem anterior liberados ao substituí-la; logotipos do histórico permanecem em memória apenas enquanto necessários para desfazer/refazer. Nada é persistido, exceto a preferência de idioma já existente.
- Redução de cópia de trabalho apenas após confirmação explícita, quando orçamento do dispositivo ou falha de exportação exigir. Na redução oferecida após falha, as camadas são mantidas.

## Testes
**175 aprovados, 0 reprovados, em 16 arquivos**: 155 testes existentes e 20 novos casos. Verificação de compilação: sem erros.

Verificações reais no navegador Chromium:
- Múltiplos textos, quatro moedas, etiquetas, dois logotipos, duplicação, exclusão, substituição, camadas e desfazer/refazer.
- Downloads JPG, PNG e WebP com 1600 × 1000 px; JPG branco em área transparente; PNG/WebP com alfa.
- Prévia sem contorno de seleção e PNG exportado: pixels idênticos em imagem 800 × 500 px.
- Logotipo sobre base transparente: alfa parcial 128 e alfa zero preservados.
- Exportação real de JPG com 8064 × 6048 px (48 MP) no desktop, sem redução.
- Emulação de identificação iPhone: imagem de 48 MP oferece redução antes de decodificar; cancelar não cria imagem reduzida.
- Eventos reais de toque em Chromium: movimentação e redimensionamento com mudança dos valores; desfazer/refazer do movimento; controles deslizantes sem alterar rolagem; rolagem fora da área continua funcionando.
- Telas de 1280 × 1800, 491 × 967 e 375 × 812, sem transbordamento horizontal nos estados examinados.
- Troca EN → PT → ES preservou os elementos; sete páginas anteriores abriram; protótipo retornou HTTP 404.
- Nenhum POST/upload de imagem ou download de modelo experimental observado. Somente as fontes de interface externas já existentes foram requisitadas.

Um teste inicialmente falhou por falta de File.arrayBuffer no ambiente simulado; o objeto de teste foi adaptado e a suíte completa passou. As primeiras verificações de navegador foram corrigidas para aguardar a abertura de arquivos e acionar o botão correto após substituição de logotipo; não restam verificações reprovadas.

## Dependências e licenças
**Nenhuma biblioteca instalada. Nenhum componente da IMG.LY reutilizado nesta ferramenta.**
- Canvas, Blob, File, Pointer Events e entrega nativa: APIs do navegador, sem pacote adicional.
- React e React DOM existentes: MIT.
- TanStack Router existente: MIT.
- Button existente, incluindo Radix Slot: MIT; ícones Lucide existentes: ISC.
- Fontes de edição: Arial, Georgia e Courier New através das fontes locais do dispositivo ou fallback do navegador. Não são baixados nem redistribuídos arquivos dessas fontes; não é uma declaração de que os arquivos originais dessas famílias sejam open source.
- Reuso de validação, orçamento, ciclo de imagem e exportação já existentes. A infraestrutura compartilhada contém o decodificador HEIC sob demanda, heic-to (LGPL-3.0), mas esta ferramenta rejeita HEIC/HEIF e não chama/carrega esse decodificador.
- A dependência AGPL da ferramenta Remover Fundo permanece no projeto, inalterada e pendente de regularização; esta implementação não regulariza a licença do projeto como um todo.

## Limitações e não concluído
- **Validação física de Safari/iPhone/iPad e Android não concluída**; emulação Chromium não substitui aparelhos reais, nem confirma a experiência nativa de compartilhamento/Salvar em Arquivos.
- Orçamentos de memória são estimativas; 48 MP foi validado neste desktop, não em todos os aparelhos. O navegador pode exigir redução explícita ou não concluir uma imagem pesada.
- Qualidade JPG/WebP depende do codificador e do nível escolhido; não há promessa de preservar os bytes originais ou de ausência de perda em formatos com perdas.
- Fontes locais/fallback podem variar entre sistemas. Não há arquivos de fontes distribuídos nem recursos avançados de tipografia.
- Cor aplicada a texto/etiqueta não recolore logotipos. Logotipos menores podem perder nitidez se ampliados.
- O arquivo é preparado por um comando e salvo por outro, para preservar o gesto necessário à entrega em dispositivos móveis; alterações posteriores exigem nova preparação.
- Edição temporária: recarregar ou sair da página descarta o trabalho, conforme a regra de não persistir imagens.
- Metadados EXIF/ICC não são preservados pela recodificação Canvas; orientação e cores seguem a decodificação do navegador.
- Aprovação prática do proprietário e publicação permanecem pendentes. Nenhuma outra ferramenta planejada foi habilitada.

## Regressões e escopo
Não foram alterados os módulos das sete ferramentas anteriores, arquivos do protótipo, dependências, identidade visual, publicidade ou configurações globais de SEO. O catálogo apenas recebeu a conexão para esta ferramenta e descrição própria em seus metadados existentes; a exclusão de indexação continua. Estilos novos são restritos à classe desta ferramenta. Todos os 155 testes anteriores passaram.
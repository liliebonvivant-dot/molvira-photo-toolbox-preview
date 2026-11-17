# MOLVIRA PHOTO — Relatório do Criador de Colagens

**Data:** 17 de novembro de 2026  
**Estado:** implementado em prévia; aguardando aprovação do proprietário. Nenhuma publicação realizada.

## Funcionalidades implementadas

- Seleção múltipla e arrastar arquivos JPG/JPEG, PNG ou WebP; validação pelo conteúdo, não apenas pela extensão.
- Adição durante a edição, remoção, miniaturas e reorganização manual por setas acessíveis por toque, mouse e teclado.
- De 2 a 12 fotos: grade, disposição horizontal, vertical, foto maior à esquerda ou no topo. Grades incompletas ocupam toda a composição, sem células vazias impostas.
- Espaçamento, cor do fundo, transparência opcional, cantos arredondados e dimensões personalizadas.
- Proporções 1:1, 4:5, 9:16 e 16:9. Largura e altura editáveis em pixels.
- Enquadramento individual: preencher com recorte ou ajustar foto inteira, ampliação de 1× a 4× e posição horizontal/vertical. Arraste direto na colagem com toque ou mouse e posicionamento por teclado.
- Desfazer/refazer até 30 passos, incluindo fotos, ordem e configurações. Limpeza explícita do histórico para liberar fotos removidas que ainda poderiam ser restauradas.
- Prévia limitada a 1200 × 800 pixels, usando as mesmas coordenadas de saída e composição da exportação.
- Exportação JPG, PNG e WebP, gerada somente por comando. Download e alternativas existentes de abertura/compartilhamento quando disponíveis no navegador.
- JPG compõe transparências sobre a cor escolhida; PNG/WebP preservam alfa quando o fundo transparente é escolhido.
- Inglês, português e espanhol completos, com os nomes solicitados e continuidade da edição na troca de idioma.
- Fotos apenas em memória local; sem cadastro, armazenamento persistente de imagens, serviços pagos ou envio de fotografias.

## Testes automatizados

**206 testes aprovados em 17 arquivos; nenhuma falha final.**

- Todos os **175 testes anteriores** continuam aprovados.
- **31 testes novos**: layouts para 2, 3, 4, 5, 6, 9 e 12 fotos, ausência de sobreposição e overflow, enquadramento proporcional, espaçamento, ampliação/posição, proporções de saída, ordem, desfazer/refazer, histórico limitado, orçamento agregado, resolução superior a 16 MP quando permitida, consentimento de redução antes da decodificação, arquivos inválidos, limite por arquivo, composição/transparência, dimensões de exportação, liberação de Canvas e mínimo/máximo de fotos.
- Verificação automática do projeto: **build OK** após a implementação.

## Verificações práticas no navegador

Executadas em Chromium do ambiente de prévia; não são testes em aparelhos físicos.

- Seis PNGs selecionados simultaneamente, com ajustes nos cinco layouts e nas quatro proporções.
- Reorganização, remoção, desfazer/refazer e recuperação das fotos confirmadas pela interface.
- Exportações reais: **PNG 40.751 bytes, JPG 40.446 bytes e WebP 25.164 bytes**, todas com **800 × 500 px**. Os tamanhos são desses arquivos de teste, não promessa de desempenho.
- PNG exportado **pixel a pixel idêntico** à prévia nativa de 800 × 500 px na composição testada; transparência e arredondamento preservados. JPG apresentou a cor de fundo escolhida no pixel transparente de canto.
- Continuidade EN → PT → ES → EN: seis fotos e ajustes individuais permaneceram na edição.
- Arquivo inválido apresentado com erro, sem descartar a colagem válida.
- Arraste por mouse alterou o enquadramento.
- Emulação de toque: arraste e slider alteraram valores **sem rolar a página**; rolagem fora desses controles funcionou.
- Telas **1280 × 1800, 768 × 1024, 491 × 967 e 375 × 812** sem overflow horizontal nas verificações; telas e controles inspecionados visualmente.
- Foto JPG de **8064 × 6048 (~48 MP)**: emulação de iPhone ofereceu cópia **4447 × 3335**, antes de decodificar. Cancelar não adicionou nem reduziu a foto.
- Saída **8000 × 6000** acima do orçamento emulado: cancelar manteve as dimensões; aceitar alterou explicitamente para **4501 × 3376**, mantendo aproximadamente a proporção original.
- Grade de 12 fotos carregada; 13ª recusada; remover, limpar histórico e adicionar novamente funcionou.
- Nenhum erro de JavaScript nas sessões concluídas; nenhuma requisição POST de fotografias ou carregamento dos modelos/decodificadores experimentais monitorados.
- As oito páginas existentes abriram com HTTP 200; o protótipo BiRefNet permaneceu HTTP 404.

## Preservação e dependências

- Nenhuma biblioteca instalada; arquivos de dependências e versões não foram alterados.
- Nenhuma dependência AGPL adicionada; a colagem não usa IMG.LY, BiRefNet nem modelos de IA.
- As oito ferramentas anteriores não tiveram seus arquivos de processamento, controles ou traduções alterados.
- Alterações compartilhadas restritas ao registro da colagem, nomes solicitados e seus metadados; estilos adicionados apenas sob `.collage-page`.
- Rotas e seletor de idiomas existentes reutilizados, sem alteração dos endereços. Metadados específicos da colagem em EN/PT/ES, mantendo a prévia sem indexação.
- Protótipo experimental, bloqueio de acesso e ativos não modificados. A pendência AGPL da ferramenta Remover Fundo permanece inalterada e não resolvida por esta entrega.
- Nada foi publicado.

## Limitações e pendências

1. **Aprovação expressa do proprietário** e testes físicos em **Safari/iPhone/iPad/Android** continuam pendentes. Compartilhamento nativo e “Salvar em Arquivos” não foram comprovados em aparelhos reais.
2. **Limites:** 12 fotos; 20 MiB, 50 MP e 12.000 px por foto; saída até 50 MP/12.000 px por lado, respeitando orçamento agregado estimado. Isso não garante capacidade real do aparelho.
3. Memória soma as fotos decodificadas, incluindo as retidas pelo histórico, e a saída. Os orçamentos herdados dependem do navegador/dispositivo; não representam medição de memória livre. Pouca memória pode exigir remover fotos, limpar histórico ou aceitar uma redução explícita. Nenhuma redução é automática.
4. A criação de uma cópia reduzida ainda depende da decodificação nativa da foto original; fotos muito grandes podem falhar mesmo após consentimento. Mensagens de erro permanecem disponíveis. Não se promete abertura universal de 48 MP nem de 12 fotos grandes simultaneamente.
5. JPG e WebP são exportados com compressão com perdas; a prévia representa composição e enquadramento, não os artefatos finais de compressão. A igualdade pixel a pixel foi comprovada para PNG na composição testada, não universalmente entre prévias reduzidas e saídas grandes.
6. Canvas não preserva metadados EXIF/ICC, HDR nem animação; formatos animados geram imagem estática segundo a decodificação do navegador. Não há HEIC nesta ferramenta.
7. O modo “ajustar foto inteira” reinicia a ampliação em 1×; ampliá-la novamente pode recortar partes dentro da célula. Não ocorre distorção de proporções.
8. Espaçamento/cantos são limitados geometricamente ao tamanho das células; em saídas muito pequenas podem ser menores que o valor solicitado para evitar células inválidas.
9. Edição temporária: sair da ferramenta ou recarregar descarta as fotos; apenas o idioma continua persistido. Recursos são liberados ao sair e quando deixam de ser necessários ao histórico.
10. O compartilhamento depende de suporte do navegador e gesto do usuário; o navegador não confirma que um arquivo foi efetivamente salvo.

**Conclusão:** Criador de Colagens disponível para validação do proprietário, preservando as oito ferramentas, sem novas dependências e sem publicação.

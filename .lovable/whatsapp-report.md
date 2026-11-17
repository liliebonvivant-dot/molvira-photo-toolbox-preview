# MOLVIRA PHOTO — Relatório: Criador de Imagens para WhatsApp

## Entrega
Implementado somente na prévia. Não foi feita publicação nem alteração de domínio.

### Formatos
| Opção | Arquivo de saída |
|---|---|
| Status | 1080 × 1920 px |
| Imagem quadrada | 1080 × 1080 px |
| Imagem horizontal | 1200 × 675 px |
| Foto de perfil | 1080 × 1080 px |

A foto de perfil tem guia circular sobreposta apenas no editor. O arquivo continua quadrado, sem guia e sem máscara circular. As dimensões são referências de criação; o WhatsApp pode recortar ou comprimir a imagem.

### Funcionalidades
- Upload JPG/JPEG, PNG e WebP, com validação do conteúdo do arquivo.
- Alternância entre os quatro formatos sem reenviar a foto.
- Preencher com recorte ou mostrar a foto inteira; zoom, posição horizontal/vertical, arraste, zoom com dois dedos e rotação de 90°.
- Desfazer/refazer, histórico limitado a 30 passos e restauração das configurações.
- Cor de fundo e transparência; JPG preenche áreas transparentes com a cor escolhida, PNG/WebP preservam alfa.
- Preparação sob comando, download JPG/PNG/WebP e alternativas de abrir/compartilhar oferecidas conforme suporte do navegador.
- Inglês padrão, português brasileiro e espanhol; catálogo, rotas equivalentes e metadados próprios nos três idiomas. Trocar o idioma conserva a edição.
- Processamento local, gratuito, sem cadastro e sem persistência de fotografias. Somente o idioma é lembrado no navegador.

## Reaproveitamento e preservação
O editor Instagram recebeu uma configuração opcional para evitar duplicar seu ciclo de upload, memória, gestos, histórico e exportação. Seus padrões, formatos, textos e nome do arquivo permanecem iguais. WhatsApp possui módulo de formatos, traduções e configuração próprios. A guia é um elemento visual fora do Canvas de exportação.

As dez ferramentas anteriores foram verificadas: Resize, Crop & Rotate, Convert, Compress, Add Watermark, Remove Background, White Background, Add Text/Prices/Logos, Collage e Instagram. Todas abriram com HTTP 200 e título principal, sem erros JavaScript. A regressão específica do Instagram confirmou padrão quadrado, dimensões personalizadas 800 × 500, nome molvira-instagram.png e ausência da guia WhatsApp. Não houve alteração dos processadores das outras nove ferramentas.

O catálogo agora tem 13 entradas: as 12 originais mais a ferramenta WhatsApp autorizada neste pedido; 11 possuem processamento implementado. Os dois outros espaços permanecem em desenvolvimento. Os testes de tamanho do catálogo foram atualizados para essa autorização, mantendo a exclusão do experimento.

Nenhuma biblioteca foi instalada, nenhuma dependência AGPL foi adicionada e os arquivos de dependências não mudaram. Remover Fundo e sua pendência AGPL permanecem inalterados. BiRefNet continua bloqueado com HTTP 404; não foi carregado automaticamente.

## Testes realizados
### Automatizados
**257 testes aprovados em 19 arquivos:** 237 anteriores e 20 novos de WhatsApp. Cobertura nova: quatro dimensões exatas, padrão Status, guia exclusiva de perfil e ausente da composição, enquadramento, zoom/posição, rotação, histórico/restauração, fundo sólido/alfa, três codificações, memória antes da decodificação e identidade entre idiomas. A verificação automática da prévia terminou sem erros.

### Navegador Chromium real
- Uploads reais JPG, PNG e WebP.
- Downloads PNG dos quatro formatos, dimensões verificadas no arquivo.
- Downloads JPG, PNG e WebP quadrados 1080 × 1080. Alfa 0 confirmado no canto de PNG/WebP; JPG opaco e cor escolhida confirmada com tolerância da compressão.
- Guia presente somente em perfil. Exportação de uma foto sólida de teste permaneceu inteiramente na cor original: nenhum pixel de guia foi exportado.
- Enquadramento, controles numéricos, rotação, desfazer/refazer e restauração exercitados no editor.
- Prévia e exportação usam a mesma composição em coordenadas de saída; enquadramento e fundos confirmados. Prévia limitada a 1200 × 800: perfil foi mostrado em 800 × 800 e exportado em 1080 × 1080; não se afirma identidade pixel a pixel entre resoluções diferentes.
- EN → PT → ES conservou zoom 1,5 e página equivalente.
- Telas 1280 × 1800, 768 × 1024, 491 × 967 e 375 × 812 sem excesso horizontal. Guia coincidiu com os limites do Canvas.
- Toque em Chromium com estimativa de iPhone: arraste alterou posição, dois dedos levaram zoom a 2×; arraste e slider não rolaram a página.
- Imagem 8000 × 6000 ofereceu redução explícita antes de decodificar na estimativa iPhone. Cancelar não criou imagem reduzida nem Canvas de edição.
- As dez páginas anteriores abriram sem erros; exportação real do Instagram 800 × 500 preservada.
- Nenhum envio POST de fotografia ou download de modelo/runtime de segmentação durante esses fluxos. A visita intencional ao protótipo retornou 404.

## Limitações e pendências
- Aguardam aprovação do proprietário e testes físicos Safari/iPhone/iPad/Android, incluindo compartilhamento nativo. Emulação de toque em Chromium não confirma suporte Safari nem funcionamento no aplicativo WhatsApp.
- Orçamento de memória é uma estimativa. Limites herdados: 20 MiB por arquivo, 50 MP e 12.000 px por lado; capacidade efetiva depende do dispositivo. Não há redução automática: a cópia menor requer confirmação. Falhas de exportação também podem oferecer dimensões menores explicitamente.
- JPG/WebP podem ter perdas; Canvas não preserva EXIF/ICC/HDR nem animações. Fontes não são relevantes nesta ferramenta.
- Recarregar ou sair da ferramenta descarta a edição temporária; o navegador não confirma se um download solicitado foi salvo.
- Não existe publicação automática no WhatsApp.
- O sitemap de desenvolvimento permanece sem alteração, com URLs relativas; finalização depende do domínio aprovado antes do lançamento. As páginas continuam noindex/nofollow.
- AGPL da Remover Fundo e acesso privado do protótipo continuam pendências anteriores, sem mudança neste pedido.

**Conclusão:** disponível para validação na prévia, preservando as dez ferramentas anteriores. Não publicado; publicação exige autorização expressa.

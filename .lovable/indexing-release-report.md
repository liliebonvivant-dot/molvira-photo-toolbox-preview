# MOLVIRA PHOTO — Liberação de indexação

Data: 18 de novembro de 2026 (UTC).

Endereço público: https://molviraphoto.com.

## Resultado confirmado após publicação

- A atualização foi publicada somente no MOLVIRA PHOTO. O domínio oficial respondeu às verificações.
- `robots.txt`: HTTP 200, `User-agent: *`, `Allow: /` e `Sitemap: https://molviraphoto.com/sitemap.xml`. O bloqueio global `Disallow: /` foi removido pela configuração existente.
- Todas as 54 URLs do sitemap responderam HTTP 200 ao cliente com identificação Googlebot: 18 em inglês, 18 em português e 18 em espanhol.
- Todas essas páginas retornaram `robots: index, follow` no HTML entregue pelo servidor, sem cabeçalho HTTP `X-Robots-Tag` impeditivo.
- O sitemap respondeu HTTP 200 e permaneceu idêntico ao conteúdo capturado antes da alteração, com 54 URLs únicas.
- Canonical, quatro alternativas hreflang, títulos, descrições e metadados Open Graph/Twitter principais foram comparados antes/depois nas 54 páginas e preservados.

## Remover Fundo e arquivos protegidos

- `/en/remove-image-background`, `/pt/remover-fundo-de-imagem` e `/es/eliminar-fondo-de-imagen`: HTTP 404 com `X-Robots-Tag: noindex, nofollow`.
- A variante `/en/%72emove-image-background/` também respondeu HTTP 404 com o mesmo bloqueio de indexação.
- A ferramenta continua fora das 54 URLs do sitemap. Sua indicação de indisponibilidade no catálogo foi preservada.
- O editor e o worker de Remover Fundo continuam fora das importações públicas. Nenhuma mudança foi feita no mecanismo de bloqueio de acesso.
- O antigo endereço experimental, `/AGENTS.md`, `/src/lib/photo/background.ts` e `/.lovable/publication-report.md` responderam HTTP 404. `/.env` respondeu HTTP 403: acesso negado, não exposição do arquivo.
- Essas verificações cobrem os endereços citados; não constituem revogação de antigas URLs externas de assets ou auditoria universal de todos os arquivos.

## Preservação e testes

- AdSense permanece desativado, sem identificador de editor; `/ads.txt` respondeu HTTP 404.
- Nenhum arquivo de Analytics, consentimento, estilos, logomarcas, ferramentas de processamento ou traduções foi alterado.
- Inglês padrão e português/espanhol foram preservados.
- 351 testes passaram em 24 arquivos; a compilação automática informou `build OK`.
- No navegador Chromium local, as páginas iniciais EN/PT/ES renderizaram normalmente; as 54 páginas foram também percorridas com identificação Googlebot, com um H1 e `index, follow`. Nenhum erro de página foi observado nas três páginas iniciais.
- A conferência pública foi de acesso, HTML e SEO; não repetiu os 12 downloads já validados na publicação anterior nem substitui testes em aparelhos físicos.

## Alterações mínimas realizadas

1. Ativada a autorização de indexação na configuração existente.
2. Mantido `noindex, nofollow` na geração de metadados da ferramenta sob bloqueio de licença.
3. Atualizados os testes das regras de indexação e registrada a conclusão.

## Pendências externas

- A liberação permite rastreamento e indexação; não confirma inclusão no índice, posição nos resultados ou aprovação do Google.
- O sitemap não foi reenviado. O estado anterior de processamento pendente e erro sem causa detalhada não foi consultado novamente nesta etapa; precisa de nova leitura na Search Console para confirmar eventual mudança.
- AdSense continua sem ativação ou aprovação confirmada; depende dos dados oficiais, requisitos de consentimento aplicáveis e autorização específica.
- Remover Fundo continua indisponível até resolução do licenciamento da IMG.LY.
- Recepção dos eventos nos relatórios GA4 e validações em aparelhos físicos permanecem pendências anteriores, não alteradas por esta liberação.
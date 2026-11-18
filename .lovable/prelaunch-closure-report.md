# MOLVIRA PHOTO — Encerramento da preparação pré-lançamento

Data: 18/11/2026 (UTC). Conferência do projeto existente, sem publicação.

## Conclusão

Não foi identificado impedimento técnico crítico nas verificações executadas para lançar as 12 ferramentas disponíveis, mantendo Remover Fundo indisponível. Isso não certifica compatibilidade universal nem conformidade jurídica. A publicação e a liberação da indexação continuam dependendo da autorização do proprietário. GA4 e AdSense não impedem o funcionamento dos editores.

Nenhuma correção no código, design, idiomas, configurações, DNS, licenciamento ou disponibilização do código-fonte foi necessária ou executada. Não foram instaladas bibliotecas, recriadas integrações, enviados sitemaps ou modificados MOLVIRA PDF/CALC. Apenas este relatório e o acompanhamento das pendências foram registrados.

## 1. O que está configurado

- **GA4:** integração existente com ID válido; um observador de navegação, uma instalação do script, `send_page_view: false`, eventos `page_view`, `tool_open` e `tool_image_selected`. Os dados próprios dos eventos usam caminho de página, idioma e identificador de catálogo, sem conteúdo das imagens, nomes de arquivos ou valores dos editores. Isso não significa que o GA4 não utilize cookies ou informações normais do navegador/requisição.
- **Consentimento:** Consent Mode v2 com `analytics_storage`, `ad_storage`, `ad_user_data` e `ad_personalization`; publicidade negada por padrão. Escolhas separadas por finalidade, publicidade não oferecida enquanto inativa. Aceitar/recusar com igual destaque e revisão permanente no rodapé. GPC prevalece sobre aceitação.
- **SEO:** 54 URLs únicas e absolutas em `https://molviraphoto.com`; três idiomas; canonical própria, alternativas EN/PT-BR/ES e x-default, títulos específicos por página dentro de cada idioma, descrições, Open Graph e cartão Twitter. `/` mantém metadados EN próprios e direcionamento ao idioma. Marca de verificação existente preservada.
- **Indexação:** bloqueio intencional preservado: `robots.txt` com `Disallow: /` e páginas com `noindex, nofollow`. Configuração para liberação futura existe, mas exige autorização e publicação da alteração. Publicar mantendo o bloqueio não libera a indexação.
- **Search Console:** propriedade de domínio verificada conforme auditoria anterior. O proprietário informou que o sitemap já foi enviado; esse fato foi registrado sem reenviar, reconstruir ou consultar seu processamento nesta conferência.
- **Remover Fundo:** cartão indisponível, implementação e testes preservados; três endereços de idioma bloqueados. Licenciamento continua pendente e separado, sem alterações.

## 2. O que foi efetivamente testado nesta conferência

- **348 testes automáticos passaram em 23 arquivos**, executados novamente. Registro atual do projeto: `build OK`, sem erro registrado de compilação.
- As **54 páginas** do sitemap responderam HTTP 200 no ambiente local; conferidas canonical exata, quatro alternativas, metadados necessários, um H1 e bloqueio de indexação. Títulos únicos por página dentro de cada idioma; nomes equivalentes entre idiomas podem legitimamente coincidir.
- **20 visualizações** em Chromium: início EN/PT/ES, Product Ad Maker e E-commerce Image Maker, cada uma em 1280×1800, 768×1024, 491×1067 e 375×812. Sem rolagem lateral observada. Páginas locais de navegação e idiomas preservadas.
- Áreas publicitárias reservadas com dimensões positivas, contidas na largura da página e fora dos controles de edição: duas na página inicial e uma após a área de edição dos dois editores conferidos. Inspeção visual confirmou posicionamento. São reservas de apresentação, não blocos AdSense ativos nem tamanhos publicitários finais.
- Consentimento: recusa impede o script GA4; recusa persiste após recarregar; aceitação instala um único script; navegação ao Redimensionar gera uma visualização, abertura de ferramenta e seleção de imagem; retirada impede novos eventos próprios de seleção e navegação. GPC com aceitação armazenada impede o script e desabilita o controle de análise.
- **Download real de PNG 320×240**, partindo de imagem sintética 640×480, usando Redimensionar. Resultado lido do arquivo baixado. O nome do arquivo de teste não apareceu nos eventos próprios.
- `/ads.txt` respondeu 404; nenhum script/bloco AdSense ativo observado. Remover Fundo EN/PT/ES e antigo endereço BiRefNet responderam 404. Nenhum download IMG.LY, modelo de segmentação ou BiRefNet observado nos fluxos públicos conferidos.
- Nenhum erro JavaScript não tratado capturado durante o fluxo principal. Isso não substitui auditoria de segurança, desempenho ou todas as exportações de cada editor.

## 3. O que depende da publicação ou de verificações posteriores

- **Recepção no GA4 não confirmada.** O script externo foi interceptado no teste para validar a instalação e a fila de eventos sem enviar dados de teste ao serviço. É necessário conferir recepção no Realtime/DebugView da propriedade real após publicação. Pedidos enviados ou fila local não provam recepção, contagem ou atribuição.
- Conferir a medição otimizada de alterações de histórico no GA4: a configuração local evita visualizações automáticas iniciais, mas a configuração da propriedade Google não foi lida e pode interferir na duplicidade.
- **Leitura pública do sitemap e processamento pelo Google**, sem novo envio. Indexação não é garantida por submissão, HTTP 200 ou canonical e depende também da retirada autorizada dos bloqueios e do processamento do Google.
- Confirmar domínio publicado, redirecionamento público do hostname alternativo e HTML final da implantação. DNS e propriedade verificada foram evidências da auditoria anterior, não repetidas nesta conferência.
- Safari/iPhone/iPad/Android físicos, grandes imagens e HEIF/memória em aparelhos reais continuam pendentes; simulação de largura em Chromium não comprova esses comportamentos.

## 4. AdSense: preparação versus ativação

O layout reservado está preparado; **a integração de anúncios não está completa nem ativa**. Não há ID de editor configurado, script publicitário ou blocos reais. O gerador de `ads.txt` existe, mas retorna 404 sem identificador válido.

Para ativar futuramente, são necessários:

1. Dados reais de editor/conta AdSense e definição dos blocos ou formato de anúncios. Implementação dos scripts/blocos reais exige autorização específica; nenhuma instalação fictícia foi feita.
2. Domínio acessível publicamente e análise/aprovação do Google. Aprovação não foi solicitada nem pode ser garantida.
3. Consentimento publicitário e CMP certificado pelo Google nos locais em que se aplica; o aviso atual de análise não é uma CMP certificada para AdSense. Atualizar escolhas/textos e validar sinais publicitários antes de ativar.
4. Disponibilizar `ads.txt` com dados oficiais e verificar sua leitura pública; testar anúncios reais nos tamanhos finais sem interferir nos editores.

Essas pendências impedem ativar publicidade, não usar ou publicar as ferramentas sem anúncios.

## 5. Privacidade, aprovações e limites

A análise própria do GA4 espera permissão na UE/EEE, Reino Unido, Suíça, Canadá e localização desconhecida; fora dessas regiões pode iniciar sem escolha prévia. Recusa e GPC prevalecem. A contagem nativa de visitas, duração, velocidade e erros continua sem cookies e sem identificar visitantes; cliques seguem a escolha de análise. As configurações hospedadas foram lidas: análise de visitantes e cliques estão habilitados. As regras variam por país e precisam de avaliação apropriada às regiões dos visitantes; este relatório não declara conformidade.

Remover Fundo continua desativada; IMG.LY e requisitos de fonte/licença permanecem assunto separado, sem presumir que bloquear uma página resolve todas as obrigações das dependências distribuídas. Aprovação dos textos institucionais/contato, decisões jurídicas e disponibilização de fonte continuam sob responsabilidade e autorização específicas do proprietário.

## Resultado final

Preparação técnica existente preservada, regressões aprovadas e nenhum reparo necessário nos fluxos conferidos. **Site não publicado, anúncios desligados e Remover Fundo indisponível.** Pendências externas e pós-publicação estão explicitadas acima; não há trabalho automático agendado após esta resposta.

Procedimento de consentimento avaliado segundo a habilidade `lovable-cookie-consent-banner`; nenhuma nova faixa ou instalação foi criada.
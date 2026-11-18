# MOLVIRA PHOTO — Relatório de publicação

Data: 18/11/2026, UTC. Publicação expressamente autorizada por Arthur Silveira.

## Resultado

**Endereço público: https://molviraphoto.com.** A publicação foi solicitada e o domínio foi acessado por Chromium sem sessão Lovable: HTTP 200 e navegação inicial para `/en`. `https://www.molviraphoto.com` terminou em `https://molviraphoto.com/`, HTTP 200. O diagnóstico administrativo de domínio ainda informou `project_published: false` após o agendamento; esse estado divergia da evidência pública observada. Não foi solicitada outra publicação por esse motivo.

Somente MOLVIRA PHOTO foi alterado/publicado. MOLVIRA PDF e MOLVIRA CALC não foram modificados.

## Condições preservadas

- Design, logomarcas, traduções e funcionalidades dos 12 editores públicos preservados; inglês padrão, português e espanhol disponíveis.
- Remover Fundo indisponível: as três rotas de idioma e a variante codificada testada retornaram HTTP 404. Sua implementação/testes permanecem no projeto, mas a importação do editor foi retirada do conjunto público: seu worker e IMG.LY não entram por essa ligação no pacote público. Nenhuma substituição de modelo.
- AdSense desativado: nenhum pedido de anúncio observado, nenhum editor configurado e `/ads.txt` HTTP 404.
- Não foi criado ou publicado repositório/snapshot do código-fonte, nem ativado link de fonte. `/.env`, `/.git/config`, `/.lovable/prelaunch-closure-report.md`, `/src/lib/photo/background-worker.ts`, `/LICENSE` e `/README.md` retornaram HTTP 404. Isso verifica esses caminhos, não é prova de ausência de toda vulnerabilidade.
- Aplicações com processamento local necessariamente entregam JavaScript público ao navegador; não é possível prometer sigilo do código executável cliente. Nos 12 arquivos JavaScript obtidos durante os fluxos testados não foram encontradas referências ao worker de Remover Fundo, à IMG.LY ou ao BiRefNet. Não foram expostas credenciais por essas verificações. O ID de medição e o token de verificação são identificadores públicos, não senhas.
- Configuração de indexação preservada sem liberação implícita: `/robots.txt` HTTP 200, `Disallow: /`; as páginas continuam `noindex, nofollow`. A autorização recebida pediu preservação de robots/SEO; não foi tratada como autorização para retirar o bloqueio.

## Testes no endereço público

**350 testes automáticos aprovados em 24 arquivos** (348 existentes + 2 de restrições de publicação). Registro de compilação: `build OK`.

`/sitemap.xml`: HTTP 200, **54 páginas**, todas HTTP 200 e com endereço canônico correspondente. Sem Remover Fundo ou protótipo. Sem reenviar sitemap.

Uploads e downloads reais de PNG sintético transparente; cada arquivo baixado foi aberto e suas dimensões lidas:

| Ferramenta | Resultado PNG |
|---|---|
| Resize Images | 320 × 240 |
| Instagram Image Maker | 1080 × 1080 |
| WhatsApp Image Maker | 1080 × 1920 |
| Product Ad Maker | 1080 × 1080 |
| White Background Maker | 640 × 480 |
| Add Text, Prices & Logos | 640 × 480, com texto adicionado |
| Compress Images | 640 × 480 |
| Convert Images | 640 × 480 |
| Photo Collage Maker | 1080 × 1080, duas fotos |
| Add Watermark | 640 × 480, com texto de marca-d’água |
| Crop & Rotate Images | 640 × 480 |
| E-commerce Image Maker | 1000 × 1000 |

A primeira tentativa de colagem usou apenas uma foto e o botão permaneceu corretamente desativado com aviso de mínimo de duas; repetida com duas, exportou normalmente. Nenhuma correção de funcionalidade foi necessária.

Nenhum erro JavaScript não tratado ou pedido IMG.LY/BiRefNet/publicitário observado. EN/PT/ES conferidos nas larguras 491, 768 e 1280 px, sem rolagem horizontal; screenshots de início, redimensionamento, fundo branco, anúncio e colagem inspecionados.

Estes testes cobrem o fluxo básico das 12 ferramentas, não todas as combinações de controles. Não foram repetidas neste lançamento todas as exportações JPG/WebP, HEIF, imagens grandes ou testes físicos Safari/iPhone/iPad/Android. Product Ad foi exportado com a foto, sem preencher campos comerciais nesta rodada; os testes anteriores desses campos não são nova validação pública.

## Google Analytics e consentimento

- Recusa pelo controle público: nenhuma instalação do script GA4 após recarregar.
- Aceitação pelo controle público: uma instalação do script; navegação, abertura de Redimensionar e seleção de imagem geraram `page_view`, `tool_open`, `tool_image_selected` na fila.
- Sem interceptar os pedidos ao Google: quatro respostas **HTTP 204** do endpoint real `https://www.google-analytics.com/g/collect` durante o fluxo consentido.
- Retirada de consentimento seguida de nova seleção: zero novos pedidos de coleta durante a janela observada.
- O teste não registrou conteúdos das imagens nem identificadores de sessão Google no relatório.

**Limite importante:** HTTP 204 confirma que o endpoint de coleta respondeu, não comprova que os eventos aparecem na propriedade correta, Realtime/DebugView, nem sua contagem ou atribuição. A conexão existente é de rastreamento, sem acesso aos relatórios GA4; recepção na propriedade e configuração de medição otimizada de histórico continuam não verificadas. Nenhum novo serviço foi conectado.

## Search Console, indexação e AdSense

A conexão de Arthur listou a propriedade verificada exata `sc-domain:molviraphoto.com`, com nível `siteOwner`. A leitura do sitemap já enviado retornou:

- URL: `https://molviraphoto.com/sitemap.xml`.
- Enviado em `2026-11-18T01:46:25.554Z`.
- `isPending: true`, zero avisos, **um erro sem causa detalhada**.

Não foi reenviado. A causa do erro não foi informada pelo Google e não foi presumida. HTTP 200 público não significa processamento concluído ou páginas indexadas; nenhuma URL Inspection foi executada. Indexação permanece bloqueada pela configuração preservada e depende de autorização específica para liberar, publicação dessa mudança e processamento do Google.

AdSense não foi ativado nem declarado aprovado. Pendem dados reais de editor/blocos, autorização específica, avaliação/aprovação Google, CMP certificado onde aplicável e `ads.txt` oficial.

## Pendências e limites

1. Autorizar separadamente eventual retirada de `Disallow`/`noindex`; conferir processamento do sitemap e o erro sem causa disponível, sem reenviar automaticamente.
2. Conferir eventos no Realtime/DebugView da propriedade GA4 e configurações de medição; acesso de leitura não está disponível na conexão atual.
3. Manter Remover Fundo bloqueada até resolução IMG.LY. Retirar seu worker do pacote público não certifica por si só conformidade de todas as demais licenças, incluindo HEIF/LGPL; decisões jurídicas/fonte necessárias continuam separadas.
4. Ativar AdSense somente após suas condições e autorização específicas.
5. Validar aparelhos físicos, arquivos grandes e HEIF. Textos de prévia/aguardando aprovação e contato incompleto foram preservados conforme pedido de não modificar traduções; sua atualização exige revisão separada.
6. Verificação básica de segurança não reportou problemas, mas parte dos testes não se aplicou por não haver serviço de dados conectado; não houve auditoria profunda de código. Uma análise aprofundada pode ser solicitada separadamente.

A URL Lovable pode ser renomeada nas configurações de publicação; domínio personalizado é gerenciado em Configurações do projeto → Domínios (o oficial já está conectado). Não houve alteração de DNS, visibilidade ou nome da URL nesta publicação. Não há trabalho automático pendente executando após este relatório.
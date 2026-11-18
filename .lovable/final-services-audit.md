# MOLVIRA PHOTO — Auditoria final dos serviços

Data: 18/11/2026 (UTC). **Nenhuma publicação ou alteração de DNS realizada.**

## 1. Configurações confirmadas
- A consulta de domínio da Lovable confirma `molviraphoto.com` conectado e definido como principal; `www.molviraphoto.com` conectado com direcionamento configurado para o principal. Os registros A e nameservers conferem. O projeto ainda não foi publicado: isso não constitui teste de redirecionamento HTTP ou certificado HTTPS em produção.
- O TXT de verificação fornecido está presente no DNS público, sem alteração ou duplicação.
- As conexões de Arthur com Google Analytics e Search Console estão vinculadas ao projeto. Não foi criada uma segunda instalação.
- Indexação continua bloqueada, anúncios desligados e Remover Fundo indisponível.

## 2. Correções realizadas
- Corrigidas somente as descrições de busca e Open Graph repetidas entre as cinco páginas institucionais em EN/PT/ES. Cada página agora tem descrição específica. Nenhum texto visível, modelo, logomarca ou funcionalidade foi alterado.
- Atualizado o acompanhamento de pendências: a propriedade de domínio já está verificada; não há necessidade de nova verificação META ou propriedade URL-prefix para utilizar o sitemap do domínio oficial.
- Títulos das páginas continuam específicos ao assunto. O título “Política de Cookies” é linguisticamente válido tanto em português quanto em espanhol; não foi alterado apenas por coincidir entre idiomas.

## 3. Sitemap
**54 URLs únicas e válidas**, todas no domínio oficial: três inícios + 12 ferramentas × três idiomas + cinco páginas institucionais × três idiomas.
- As 54 responderam HTTP 200 no ambiente local e correspondem às respectivas canônicas.
- Alternativas EN/PT-BR/ES e x-default presentes em cada grupo. Não há `lastmod` sem origem autoritativa.
- Remover Fundo, protótipos e endereços privados não aparecem.
- Endereço preparado: `https://molviraphoto.com/sitemap.xml`.
- Consulta do Google à propriedade verificada retornou lista vazia de sitemaps. **Não houve envio ou confirmação de processamento.**

## 4. Google Analytics 4
- A instalação existente usa um único script e configuração, com visualização automática desativada e eventos manuais `page_view`, `tool_open` e `tool_image_selected`.
- O teste real de navegador confirmou: recusa não carrega o script; aceitação carrega uma instalação; abrir Redimensionar e selecionar PNG registra os eventos locais; retirar consentimento impede novos eventos. O nome do arquivo de teste não aparece nesses eventos.
- Países dependem da atribuição do próprio Google, não de envio de país pela aplicação. Idioma, página e identificadores de ferramenta estão preparados; os eventos não comprovam conclusão de edição ou arquivo salvo.
- O script externo foi interceptado para não contaminar estatísticas. **Recepção, países, contagem no GA4 e configurações da propriedade não foram verificados.** A conexão atual é de rastreamento, não de leitura de relatórios.
- Conferir a medição otimizada de histórico no GA4 para evitar duplicação externa aos eventos manuais.

## 5. Search Console
- Consulta autenticada `GET /webmasters/v3/sites` confirmou exatamente `sc-domain:molviraphoto.com`, com permissão `siteOwner` na conexão de Arthur.
- A verificação por DNS informada pelo proprietário está corroborada pelo TXT público e pela propriedade retornada pelo Google.
- Essa propriedade já cobre protocolos/subdomínios e permite relatórios e envio do sitemap: não é preciso verificar novamente por META.
- A marcação META existente foi preservada, sem criar outra ou modificar DNS. **Indexação das páginas não foi consultada nem afirmada.**

## 6. SEO internacional e navegação
- Todas as 54 páginas conferidas possuem título, descrição, Open Graph, tipo, cartão Twitter, uma canônica própria, quatro alternativas de idioma e um H1; H2 foram inspecionados no conteúdo renderizado.
- EN é o padrão inicial. Estrutura de rotas, links e seletor de idiomas preservados; os testes de navegação e catálogo passaram.
- Inícios EN/PT/ES e páginas Product Ad, E-commerce e White Background conferidos em 406×1067 e 768×1024; as 54 páginas também foram conferidas em 1280×1800. Sem rolagem lateral nas páginas e tamanhos avaliados.
- `robots.txt` permanece `Disallow: /`, sem diretiva Sitemap enquanto todo rastreamento está bloqueado. As páginas mantêm `noindex, nofollow`. As regras para permitir páginas públicas e referenciar o sitemap estão preparadas, mas só serão ligadas com autorização.
- Não existem páginas administrativas funcionais a autorizar; bloqueio de rastreamento não substitui controle de acesso.

## 7. Consentimento e AdSense
- Aceitar, recusar, revisar pelo rodapé e persistir a recusa após recarregar foram verificados.
- Consent Mode v2 possui sinais iniciais negados; análise e publicidade têm escolhas separadas. UE/EEE, Reino Unido, Suíça, Canadá e localização desconhecida exigem escolha; Global Privacy Control prevalece.
- Fora das regiões configuradas, análise pode iniciar sem escolha prévia. Isso é o comportamento atual, não uma certificação jurídica de todas as jurisdições.
- AdSense não carregou; publicador vazio, nenhum anúncio ativo e `ads.txt` HTTP 404. O aviso atual de análise **não é uma CMP certificada para AdSense**. Dados oficiais, solução certificada aplicável e autorização específica continuam necessários antes de anúncios.

## 8. Remover Fundo
- Implementação e dependência IMG.LY preservadas, sem substituição. Catálogo mantém indicação indisponível.
- As três rotas de idioma e uma variante codificada responderam HTTP 404. O antigo endereço experimental também respondeu 404.
- Nenhum carregamento de IMG.LY, modelo de segmentação ou BiRefNet observado durante os fluxos públicos avaliados. Isso não equivale a auditoria jurídica de todos os arquivos distribuídos.
- Continua indisponível até decisão de licenciamento e condições de publicação do código-fonte.

## 9. Testes e limitações
- **348 testes aprovados em 23 arquivos**, repetidos após a correção, incluindo processadores, privacidade, navegação e disponibilidade.
- **54 páginas HTTP 200** com metadados conferidos; seis endereços bloqueados/ads.txt HTTP 404.
- Download real em Redimensionar: PNG gerado e lido, **320×240 pixels**, preservando as dimensões escolhidas no teste.
- Navegador Chromium: nenhum erro de execução observado. Último registro automático: **build OK**.
- Não foram repetidas exportações de todas as 12 ferramentas nesta auditoria: seus testes automatizados passaram e as páginas abriram, mas isso não substitui novo teste completo de cada editor.
- Computador e tamanhos de tablet/celular foram avaliados em Chromium. Safari, iPhone, iPad e Android físicos, grandes imagens/HEIF e capacidade de memória em dispositivos reais continuam sem nova validação nesta etapa. Não houve benchmark de desempenho ou auditoria abrangente de segurança.

## 10. Pendências reais
1. Autorização expressa para publicar e liberar a indexação; conferir HTTPS e redirecionamento real depois da publicação.
2. Enviar o sitemap à propriedade de domínio já verificada quando o endereço público estiver disponível; conferir processamento no Google.
3. Confirmar recepção e configuração de medição no GA4 por acesso aos relatórios/Tempo real.
4. Validação física dos editores e aprovação dos textos institucionais/contato e requisitos de fonte pública/licenças antes do lançamento, conforme pendências anteriores.
5. AdSense: dados oficiais, CMP certificado quando aplicável e autorização específica; não impede manter anúncios desligados.
6. Remover Fundo: resposta da IMG.LY e decisão definitiva; continuará indisponível, sem impedir a preservação das outras 12 ferramentas.

**Site não publicado; sem alterações nos projetos MOLVIRA PDF ou MOLVIRA CALC.**
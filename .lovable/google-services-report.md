# MOLVIRA PHOTO — Preparação final dos serviços Google

## Configurado, sem publicação
- GA4: `G-8DVNVSTRCH`, confirmado no documento, preparado por conexão de rastreamento do navegador. A referência `@secret:GOOGLE_ANALYTICS_MEASUREMENT_ID` foi reconhecida; não foi solicitada novamente. O identificador de medição é público, não uma credencial privada.
- Removida a instalação anterior incompleta: há um único carregamento, configuração sem page view automático e proteção contra registros repetidos após remontagem.
- Eventos implementados: `page_view`, `tool_open` e `tool_image_selected` para seleção por arquivo ou arrastar/soltar. Não representam conclusão de processamento, download salvo nem conversão comercial. Não enviam imagens, nomes de arquivos, preços ou valores editados.
- Consentimento de análise EN/PT/ES: aceitar/recusar com igual destaque, configurações com seleção desligada inicialmente, link permanente no rodapé e política de privacidade. Usa a implementação da skill **lovable-cookie-consent-banner**.
- O GA4 só carrega quando a finalidade análise está permitida: aguarda escolha na UE/EEE, Reino Unido, Suíça, todo o Canadá e localização desconhecida; fora dessas regiões pode iniciar antes de uma escolha. Recusa e Global Privacy Control impedem novos eventos da aplicação, inclusive após aceitação. Alterações de outra aba são propagadas sem recarregar.
- Lovable Visitor analytics e Click tracking foram consultados: ambos ligados. O aviso restringe cliques e eventos nas regiões aplicáveis; visitas, duração, velocidade e erros continuam contados sem cookies nem identificação do visitante. Nenhuma configuração de Visitor analytics foi alterada.
- Search Console: conexão de Arthur vinculada ao projeto. A lista de propriedades foi consultada e não contém MOLVIRA PHOTO. Obtido token META real do Google e inserido no HTML inicial da raiz. Não foi realizada verificação ou submissão de sitemap porque a publicação não está autorizada.
- Sitemap validado com **54 URLs absolutas** em `https://molviraphoto.com`: início, 12 ferramentas disponíveis e cinco páginas institucionais, em três idiomas. Nenhum `lastmod` artificial foi adicionado. Remover Fundo e protótipos não são incluídos.
- Canônicas, hreflang, títulos, descrições e metadados sociais por página preservados e conferidos. `robots.txt` e marcações `noindex, nofollow` mantidos até aprovação.
- Remover Fundo preservada no catálogo como indisponível, sem link operacional. Acesso direto às três versões negado no servidor e na navegação. O processador e seus testes foram preservados, sem substituição de modelo.
- AdSense permanece desligado, inclusive se um identificador for adicionado antes da futura ativação explícita. Espaços existentes preservados. `ads.txt` retorna 404 enquanto não houver identificador real; sua geração com dados reais já está preparada. Não foi inventado publicador.
- Arquivos de ambiente gerados pelos conectores foram excluídos do controle de versão; nenhuma credencial privada foi incluída no código.

## Verificações executadas
- **348 testes aprovados**, em 23 arquivos; inclui consentimento/retirada, moeda e processadores anteriores, exclusão do sitemap, bloqueio público e não duplicidade dos eventos.
- Verificação do projeto: resultado final `build OK`.
- Chromium: recusar sem carregar GA4; aceitar com um carregamento; abrir Redimensionar e selecionar PNG real; resultado visível; um page view para a página da ferramenta; retirar consentimento e selecionar novamente sem novos eventos.
- Todas as 54 páginas do sitemap responderam HTTP 200 no ambiente de teste; as três páginas de Remover Fundo, variante codificada e antigo protótipo responderam 404. `ads.txt` 404 e `robots.txt` bloqueando indexação confirmados.
- HTML da raiz contém o token exato retornado pelo Google. Consentimento português e espanhol conferido em 1280 × 1800 e 406 × 1067, sem rolagem lateral. Nenhum erro de execução observado.
- O script externo do Google foi interceptado no teste para não contaminar estatísticas. Portanto, o teste comprova a instalação e os eventos locais, **não a recepção no GA4**. Não foram verificados relatórios, contagem ou atribuição pelo Google.

## Ainda necessário
1. **Publicação:** autorização expressa do proprietário, confirmação do domínio ativo, validações em aparelhos físicos e conclusão dos requisitos de código-fonte/licenças já registrados. Nenhuma publicação foi solicitada ou executada.
2. **Search Console:** não é necessário fornecer token ou DNS para a opção URL-prefix preparada. Após publicar, conferir o token no HTML público, verificar com Google, adicionar a propriedade, listar novamente e submeter o sitemap. Essa propriedade cobre páginas, relatórios e sitemap no HTTPS desse hostname; uma propriedade Domain com DNS é opcional para cobertura adicional de protocolos e subdomínios.
3. **GA4:** confirmar recepção em Tempo real/DebugView após publicação. As configurações da propriedade Google não foram lidas; conferir se a medição otimizada de mudanças de histórico está desligada para evitar duplicação com os page views manuais.
4. **AdSense:** fornecer o ID real `pub-XXXXXXXXXXXXXXXX`. Em AdSense → Privacidade e mensagens, preparar a mensagem europeia e a solução certificada disponibilizada pelo Google para a conta/site, inclusive as demais regiões aplicáveis. O aviso atual é para análise e **não substitui um CMP certificado para AdSense**. Após obter a configuração real, estender/substituir sem criar avisos duplicados; só então ativar anúncios com autorização.
5. **Remover Fundo:** manter indisponível até esclarecer a licença ISNET; não anunciar autorização comercial nem reativar automaticamente. As outras 12 ferramentas permanecem funcionais.

As regras de privacidade variam por país; a avaliação das exigências aplicáveis continua a cargo do proprietário e de assessoria adequada.
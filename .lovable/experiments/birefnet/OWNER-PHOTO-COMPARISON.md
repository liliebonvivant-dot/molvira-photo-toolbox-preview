# MOLVIRA PHOTO — Comparação das fotos recebidas

Data: 17/11/2026. Experimento interno, sem publicação ou substituição.

## Resultado e decisão

**Não substituir a ferramenta atual nesta etapa.** O BiRefNet-lite FP32/512 melhora claramente a limpeza do fundo na mulher, não resolve o suporte do relógio e apresenta bordas mais agrupadas e claras nos pelos do cachorro. O download e a memória continuam inadequados para recomendar adoção móvel sem novos estudos. INT8 não foi produzido nem testado.

Nenhum código de ferramenta, design, tradução, configuração, rota ou SEO foi alterado. Apenas documentação da comparação e a lista de tarefas foram atualizadas. Nenhuma biblioteca instalada; nenhuma foto enviada a serviço remoto de processamento. Não houve publicação.

## Método

As três fotos anexadas foram processadas nas dimensões recebidas, 1536×1024, sem redução da saída. Todas estão abaixo do limite interno de 2 MP. BiRefNet: worker isolado interceptado pelo navegador em documento de loopback, sem nova rota da aplicação; exportação existente FP32/512, entrada com letterbox 512×341 e margens verticais, runtime CPU/WASM single-thread. IMG.LY: upload, processamento e download reais pela ferramenta existente, isnet_quint8, worker encerrado após cada foto; máscara com entrada proporcional de até 1024 px por lado e composição existente guiada por RGB.

Esta comparação avalia os dois caminhos reais disponíveis, não isola exclusivamente a diferença dos pesos: resolução da máscara, pré-processamento, runtime e reutilização da sessão diferem. Foi uma execução concluída por foto/modelo, não um benchmark estatístico. O primeiro teste da IMG.LY foi interrompido pelo roteiro de automação após selecionar o controle de salvar errado; a execução concluída usou navegador novo e o botão real. Os resultados abaixo são das execuções concluídas.

Inspeção visual em fundo claro e escuro, com recortes de borda na escala original. Não há máscara de referência anotada: não calculamos acurácia, IoU ou uma pontuação objetiva de fidelidade. Os painéis JPG são apenas apresentação; os seis PNGs preservam a saída RGBA para inspeção.

## Qualidade observada

| Foto | IMG.LY atual | BiRefNet-lite experimental | Conclusão |
|---|---|---|---|
| Mulher / cabelos | Muitas manchas isoladas do fundo próximas à cabeça e cabelo; franja clara visível no escuro. | Remove a maioria das manchas isoladas; cabelo continua com franja suave/clara e perda de fios finos. | Melhora relevante de limpeza, mas não demonstra ausência de halos. |
| Relógio / produto | Preserva corpo e pulseira; mantém suporte transparente e regiões com cor do fundo. | Resultado próximo; mantém suporte e cor do fundo nas áreas próximas à pulseira. | Não há ganho suficiente para prometer foto de produto limpa sem suporte. |
| Cachorro / pelos | Preserva alguns fios mais finos, mas suaviza e mantém resíduos nas pontas. | Bordas do peito mais agrupadas, com mechas claras/cinzentas perceptíveis. | Não é uma melhoria uniforme; o detalhe inspecionado favorece a borda atual. |

O relógio inclui material transparente, mas essas fotos não constituem teste controlado de alfa parcial de entrada. Há valores de alfa intermediários nas seis saídas; isso prova transparência parcial no arquivo, não a correção física da transparência do suporte ou a preservação exata de todos os fios.

## Desempenho medido em Chromium desktop headless

| Foto | BiRefNet: total interno | BiRefNet: inferência | BiRefNet: RSS agregado pico | IMG.LY: ação até PNG salvo no teste | IMG.LY: RSS agregado pico |
|---|---:|---:|---:|---:|---:|
| Cachorro | 24,70 s | 14,95 s | 1,80 GiB | 21,76 s | 1,45 GiB |
| Relógio | 13,29 s | 12,90 s | 1,82 GiB | 23,90 s | 1,55 GiB |
| Mulher | 13,44 s | 12,99 s | 1,65 GiB | 21,24 s | 1,58 GiB |

RSS é a soma observada de processos renderer Chromium presentes no ambiente, amostrada a cada 250 ms: **não é memória exclusiva do modelo, pico garantido ou requisito mínimo do dispositivo**. Os modelos foram executados em navegadores separados; há memória de navegador, páginas, Canvas e runtime, e diferenças no ciclo de vida. Não é justificativa para declarar um modelo mais eficiente ou seguro no celular.

Os totais também não têm a mesma fronteira: BiRefNet registra internamente download/sessão/inferência/composição/codificação; o tempo IMG.LY inclui acionamento, espera, captura da tela e gravação do download pelo teste. Não foi instrumentada a inferência isolada da IMG.LY, para preservar o código atual. BiRefNet reutilizou uma sessão para as três fotos; IMG.LY criou um worker por foto, como já implementado. Não interpretar os tempos quentes como vitória direta de inferência.

BiRefNet carregou os pesos uma vez: 180.638.623 bytes (172,27 MiB), mais WASM 14.848.852 bytes (14,16 MiB) e módulos. Download dos pesos via loopback: 1,02 s; criação inicial da sessão: 8,12 s. **Loopback não mede download pela internet.** As outras fotos reutilizaram sessão e pesos, sem nova solicitação do modelo.

IMG.LY solicitou manifesto e fragmentos dos ativos hospedados em staticimgly.com; o registro completo está em metrics.json. Content-Length e número de respostas não provam bytes efetivamente transferidos, ausência de cache ou custo de rede por foto. Não foi medido um download frio comparável em rede pública.

## Arquivos e testes

- Seis PNGs efetivamente produzidos: cachorro, relógio e mulher × IMG.LY/BiRefNet. Todos 1536×1024, RGBA, com alfa zero, intermediário e opaco.
- Três downloads IMG.LY pela interface: nomes válidos e `downloadFailure: null`. No experimento, blobs retornados pelo worker foram lidos e gravados localmente pelo teste.
- Painéis em fundo claro/escuro e detalhes de borda na escala original, incluídos no pacote de resultados.
- 353 testes automatizados aprovados em 22 arquivos; nenhuma alteração nos testes ou processadores.
- Página inicial observada após o experimento: nenhum pedido experimental; `/experimental/birefnet` permanece HTTP 404; nenhuma exceção de página nas execuções concluídas.
- Não foi repetido upload/exportação de todas as outras 12 ferramentas nesta comparação; sua preservação é sustentada por ausência de mudanças no código e pela suíte de regressão. As 13 ferramentas permanecem no projeto.

## Licenças e limites

Reutilizados os mesmos pesos/runtime previamente verificados, sem nova exportação ou mudança de licença: BiRefNet-lite, revisão oficial aa62cd87eafb9cc43056d08ef3615a14628b831d, exportação FP32 existente de SHA256 dff37bed4e94479a6a8f6b0e64d69030557bdcb79d53c9993b277f5c0cee4c93; ort-birefnet/onnxruntime-web 1.31.1. Nesta etapa não repetimos auditoria jurídica ou cálculo de hash. O resultado visual não resolve direitos de terceiros/dados de treinamento. A licença AGPL da IMG.LY atual continua pendente; não autorizamos lançamento comercial. URLs antigas dos pesos hospedados não se tornam privadas por bloquear a rota.

## Pendências

1. Foto dedicada de produto com fundo simples e objeto estreito: o conjunto recebido cobre cabelos, pelos e produto em ambiente, mas não completa os cinco casos solicitados.
2. Quantização INT8, operadores e perda de qualidade: não disponíveis/testados; exigem ambiente apropriado e autorização para a próxima etapa.
3. Medições comparáveis de rede fria, memória exclusiva e repetições; redução de download/memória antes de recomendar celular.
4. Testes físicos Safari/iPhone/iPad/Android: não realizados e não substituídos por Chromium.
5. Revisão jurídica e aprovação expressa do proprietário antes de qualquer substituição/publicação.

Recomendação: manter ambos os caminhos como estão — ferramenta atual inalterada, experimento inacessível publicamente — e decidir os próximos estudos somente após revisar estes resultados.
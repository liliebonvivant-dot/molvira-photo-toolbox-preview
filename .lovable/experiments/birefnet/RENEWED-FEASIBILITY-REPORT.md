# MOLVIRA PHOTO — Prova interna BiRefNet-lite

Data: 17/11/2026. **Recomendação: ajustar e aguardar fotos; não substituir IMG.LY nem publicar.**

## 1. Modelo e permissões

Modelo específico: **ZhengPeng7/BiRefNet_lite**, revisão oficial `aa62cd87eafb9cc43056d08ef3615a14628b831d`. Não se presume licença de outras variantes.

- [Cartão dessa revisão](https://huggingface.co/ZhengPeng7/BiRefNet_lite/blob/aa62cd87eafb9cc43056d08ef3615a14628b831d/README.md): `license: mit`; informa treinamento DIS-TR.
- [Licença oficial do código](https://github.com/ZhengPeng7/BiRefNet/blob/main/LICENSE): MIT, copyright (c) 2024 ZhengPeng.
- [Resposta do autor sobre código e pesos](https://github.com/ZhengPeng7/BiRefNet/issues/316#issuecomment-5120372022): “All the codes and weights are under the MIT license.”
- [Discussão oficial 23](https://huggingface.co/ZhengPeng7/BiRefNet/discussions/23): autor remete ao cartão de cada modelo; em 04/11/2026 declara “feel free to use it in any way under the MIT license”.

A concessão MIT permite uso comercial, cópia, modificação e distribuição; portanto permite conversão/quantização como modificações, mantendo copyright e licença nas cópias. Não foi encontrada exigência de autorização adicional ou royalty para essas operações. Isso confirma a concessão do autor, **não uma garantia jurídica sobre direitos de terceiros**. O próprio autor ressalva ImageNet e dados de treinamento. Os termos dos dados não devem ser automaticamente tratados como uma proibição comprovada dos pesos, nem ignorados como risco inexistente. Publicação comercial continua dependendo de revisão jurídica. A auditoria anterior foi excessivamente categórica ao prometer qualidade idêntica entre implementações ISNet, desempenho móvel e viabilidade INT8 sem medição: essas conclusões não são usadas aqui.

## 2. Origem, integridade e tamanhos

| Arquivo | Tamanho | Integridade/resultado |
|---|---:|---|
| Original `model.safetensors` | 177.634.392 bytes (169,41 MiB) | SHA256 declarado pelo LFS oficial: `4417d89795250e698c3cb0ae8df15743810065f646f48a694fdfa7ca052d0815`; original não baixado novamente nem recalculado nesta etapa |
| Exportação própria anterior FP32/512/opset22 | 180.638.623 bytes (172,27 MiB) | Cópia baixada uma vez e SHA256 recalculado: `dff37bed4e94479a6a8f6b0e64d69030557bdcb79d53c9993b277f5c0cee4c93` |
| WASM 1.31.1 | 14.848.852 bytes (14,16 MiB) | Arquivo instalado: SHA256 `4b884c203b0fa48d057be3332c65513ff85aa3c5bddd6946acc0fab7ecda001d` |
| Loader WASM | 24.738 bytes | Instalado e arquivado idênticos: SHA256 `30ed0b5cd1182ede931fea448afb567d4dc705ec957af09f108a2be5f770dac3` |
| INT8 | Não gerado | Sem tamanho ou desempenho medidos; não se promete 40–45 MB |

Pesos e WASM somam 195.487.475 bytes (~186,43 MiB), sem contar JavaScript e avisos. Leitura via loopback não mede download de internet real. As leituras seguintes usam a mesma cópia local; nenhuma nova mídia foi hospedada.

## 3. Dependências verificadas

Runtime experimental já instalado: alias `ort-birefnet` = `onnxruntime-web@1.31.1` (MIT); `onnxruntime-common@1.31.1` e `platform@1.3.6` MIT; `flatbuffers@25.9.23` e `long@5.3.2` Apache-2.0; `guid-typescript@1.0.9` ISC; `protobufjs@7.6.6` BSD-3-Clause. Submódulos protobuf: aspromise 1.1.2, base64 1.1.2, codegen 2.0.5, eventemitter 1.1.1, fetch 1.1.1, float 1.0.2, path 1.1.2, pool 1.1.0, utf8 1.1.2 — BSD-3-Clause; @types/node 22.20.1 MIT. Conferidos nos manifests efetivamente resolvidos. Avisos anteriores permanecem arquivados em `runtime-notices`.

Nenhuma dependência foi instalada ou atualizada. O worker interno não importa IMG.LY. A AGPL da ferramenta atual permanece inalterada: MIT experimental não elimina suas obrigações.

## 4. Conversão e INT8

A exportação anterior foi verificada antes de reutilizar. Não houve nova conversão. ONNX Runtime Python 1.20.1 está presente, mas importar o módulo de quantização falha por ausência de `onnx`; PyTorch, torchvision, safetensors, transformers, timm e onnxscript também ausentes. **Essa parte foi interrompida conforme solicitado**, sem instalações improvisadas. Não foram executadas calibração, quantização ou validação de operadores INT8/DeformConv. A medição anterior de fidelidade PyTorch/ONNX não foi repetida.

## 5. Ambiente novo e isolamento

Arquivos criados em `.lovable/experiments/birefnet/internal/`: `worker.mjs`, `geometry.mjs`, `geometry.d.mts`, `run_internal.py`, `result.json`, `portrait-result.json`, `preservation.json`. Testes novos: `src/test/birefnet-internal.test.ts`. Relatório e notas de arquitetura/roadmap atualizados; nenhum editor público alterado.

Não há nova rota, link, cartão ou entrada no sitemap. O runner abre uma página temporária em servidor vinculado apenas a `127.0.0.1:8765`, encerrado ao terminar, e intercepta os módulos exclusivamente na sessão Playwright. A página não é servida pelo MOLVIRA PHOTO. O caminho `/__internal-birefnet/worker.mjs` no aplicativo responde 404. `/experimental/birefnet` continua 404 e seu runtime público continua bloqueado. As URLs antigas dos pesos hospedados continuam públicas; este trabalho não as revogou.

Inferência em Worker próprio, WASM CPU, uma thread; encerramento por `terminate()` após execução. Não utiliza WebGPU nem headers globais COOP/COEP. Limite interno de 2 MP **recusa**, não redimensiona, entradas maiores. Padding proporcional 512×512 e corte inverso da máscara; preview/export mantêm 768×512 ou 512×768. RGB e alfa original compostos com a rotina conservadora existente, sem alterar essa rotina. Limitar pixels não limita os tensores internos do modelo: consumo continua alto e não comprova segurança móvel. Este harness não oferece interface pública nem diálogo de redução; recusas exigem decisão explícita numa etapa futura.

## 6. Execuções efetivas

Chromium headless em computador do ambiente, imagem sintética autorizada por criação própria (retângulo verde sobre fundo cinza), sem envio de imagem a serviço externo. Não é foto de produto nem prova de qualidade em cabelos/pelos.

| Medida | Horizontal, primeira execução final | Vertical, mesma sessão |
|---|---:|---:|
| Saída PNG | 768×512; 15.619 bytes | 512×768; 16.177 bytes |
| Leitura local dos pesos | 0,973 s | 0 s |
| Criação da sessão | 5,673 s | 0 s |
| Inferência | 10,636 s | 11,994 s |
| Total | 17,455 s | 12,058 s |
| Alfa | min 0, max 255; 7.145 pixels parciais | min 0, max 255; 6.830 pixels parciais |

Rodada anterior sintética: inferência 13,322 s; total 21,942 s. Variações não são benchmark universal. Resultado PNG decodificado e inspecionado: fundo transparente e borda parcialmente transparente; há franja clara no retângulo, portanto **não se afirma ausência de halos**. A sessão/modelo foi reutilizada na vertical, com apenas uma solicitação de pesos por sessão. Entrada 8064×6048 recusada antes de solicitar pesos ou alocar imagem desse tamanho; encerramento do worker realizado. Cancelamento durante inferência não foi reproduzido nesta etapa (testes anteriores simulam terminate).

Pico observado na rodada final: soma do RSS de processos renderer Chromium **1.937.756.160 bytes (~1,80 GiB)**, amostrada a cada 250 ms durante o primeiro processamento. Inclui outros renderers, não é memória exclusiva do modelo, pode perder picos e não foi coletada na segunda inferência. Não comparar diretamente com números antigos de renderer individual. **Não adequado para recomendar celulares ainda.**

## 7. Comparação com IMG.LY

**Nova comparação fotográfica não realizada.** Arquivos anteriores em `/tmp` não existem nesta sessão; o proprietário concordou em reenviar, mas as fotos ainda não foram anexadas. Permanecem pendentes: produto com fundo simples, produto com fundo complexo, cabelos finos, pelos e objeto estreito; mesmo arquivo/mesma resolução/mesmo navegador, exportação PNG de ambos e medição equivalente.

Evidência histórica, não repetida e não equivalente ao novo padding: exportação FP32 anterior deformava entrada para quadrado; nas três fotos mulher/relógio/cachorro o relatório anterior registrou melhora na mulher, pequena diferença no relógio e novos resíduos no cachorro. Não basta para dizer que BiRefNet é superior. Modelos da mesma família ISNet tampouco garantem saídas idênticas.

## 8. Regressão e compatibilidade

- **353 testes aprovados em 22 arquivos:** 348 preservados + 5 novos para padding horizontal/vertical/quadrado, recusa sem redução silenciosa e dimensões inválidas.
- Página inicial e 13 ferramentas EN: HTTP 200, zero erros de página JavaScript e zero solicitações experimentais durante visitas normais. Teste não repete uploads/exports dos 13 processadores; confirma abertura e isolamento, complementado pela regressão automatizada.
- Página inicial observada em 1280×1800 e 491×967; design preservado. Não se fez novo benchmark antes/depois do carregamento inicial.
- Rotas de conteúdo inspecionadas: index e folhas localizadas continuam usando `pageHead`; experimento mantém metadados noindex. Traduções, SEO, sitemap, catálogo, pacotes e configuração não editados. Último registro consultado: build OK.
- **Chrome desktop:** somente Chromium headless efetivamente executado; Chrome instalado em dispositivo real e Edge não testados.
- **Edge desktop:** compatibilidade WASM esperada, não medida.
- **Safari macOS/iPhone/iPad e Chrome Android:** não executados, nem físicos nem inferência emulada nesta etapa. Dependem de WASM SIMD, suporte Canvas/Worker e memória; alto RSS impede recomendar viabilidade móvel. WebGPU não avaliado.

## 9. Decisão e pendências

**Ajustar, sem substituir e sem publicar.** A execução FP32 básica funciona localmente e permanece isolada; o peso/download e RSS são impeditivos práticos para adoção móvel sem novos resultados. INT8 continua hipótese, não versão pronta. Próxima comparação depende do envio das fotos; quantização depende de ambiente apropriado; validação física e direitos dos dados dependem de revisão própria. Se esses requisitos não forem resolvidos, abandonar a substituição é preferível a reduzir silenciosamente ou prometer compatibilidade.

Confirmado: 13 ferramentas preservadas; IMG.LY intacta; nenhuma rota ativada, nenhuma biblioteca instalada, nenhum deploy/publicação, nenhuma imagem enviada para processamento remoto.
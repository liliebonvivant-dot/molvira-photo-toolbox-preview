# MOLVIRA PHOTO — Fundo Branco: relatório para aprovação

17 de novembro de 2026 · **Não publicado**

## Entrega

- Ferramenta existente Fundo Branco ativada, com nomes, URLs, identidade visual e seletor de idiomas preservados.
- Entrada PNG e WebP, validação por cabeçalho e identificação de canal alfa, inclusive transparência de paleta PNG e flags WebP.
- Detecção dos pixels realmente transparentes, distinta da simples presença de canal alfa.
- Composição sobre branco puro **#FFFFFF**, incluindo transparência parcial e bordas suavizadas, sem segmentação, erosão ou recorte.
- Dimensões nativas preservadas; sem margens adicionais, estiramento, ampliação ou redução automática.
- Antes/depois e exportação PNG, JPG ou WebP, com download acionado pelo usuário e alternativas existentes de abrir/compartilhar.
- Aviso explícito quando não há transparência: o fundo existente não será removido.
- Processamento local, sem enviar imagens, sem IMG.LY ou BiRefNet no novo processador, sem bibliotecas novas.

## Validações

**155 testes passaram em 15 arquivos:** todos os 144 anteriores, incluindo os 138 originais e os seis de isolamento, mais 11 testes novos de Fundo Branco. Compilação registrada: **build OK**.

Verificações no navegador Chromium:

| Caso | Resultado |
| --- | --- |
| PNG com transparência total e parcial | PNG/JPG/WebP baixados e reabertos com 640 × 480 px, igual à entrada |
| Área completamente transparente | Pixel de fundo [255,255,255,255] nos três formatos testados |
| WebP transparente | PNG baixado com resolução preservada e fundo branco |
| PNG totalmente transparente | PNG inteiramente branco; saída válida |
| PNG opaco | Aviso correto; pixel [23,71,193,255] preservado na saída PNG |
| Elemento azul opaco em PNG | RGB original [23,71,193] preservado |
| Vermelho com alfa 128 em PNG | Resultado [255,127,127,255], composição correta sobre branco |
| Bordas suavizadas | Progressão de alfa testada sem corte binário ou erosão; comparação visual inspecionada |
| Idiomas | Processamento em EN/PT/ES; seletor mantém a identidade da página ao alternar EN → PT → ES |
| Telas | Capturas inspecionadas em computador 1280 × 1800, celular 375 × 812 e tablet 768 × 1024; sem excesso de largura |
| Controle de qualidade | Movimento horizontal simulado não deslocou a página: diferença de rolagem 0 px; touch-action:none existente preservado |
| Privacidade | Nenhuma solicitação não-GET ou carregamento de modelo experimental/IMG.LY observado no fluxo de Fundo Branco |
| Seis ferramentas anteriores | Páginas abrem com HTTP 200, títulos esperados e sem erros JavaScript observados |
| Protótipo experimental | Continua HTTP 404, inclusive seu antigo carregador público; nenhum arquivo experimental alterado |

Foram baixados e inspecionados seis arquivos reais ao todo. Os testes adicionais de codificação verificam os três formatos, dimensões originais e liberação do canvas.

## Preservação e escopo

Nenhum arquivo dos seis processadores foi alterado. Somente a seleção da nova ferramenta no espaço compartilhado e seus metadados foram adicionados; o catálogo, nomes, estilos, traduções anteriores e dependências permanecem intactos. O protótipo e seus bloqueios não foram modificados. Nenhuma nova dependência AGPL foi incluída; a pendência AGPL da ferramenta Remover Fundo atual continua sem resolução e sem publicação.

## Limitações e aprovação pendente

- JPG e WebP têm compressão com perdas; portanto, não há promessa de fidelidade absoluta de RGB ou nitidez nesses formatos. PNG preserva os pixels compostos no espaço de cor do navegador.
- O branco puro é aplicado antes da codificação. Compressão com perdas pode produzir pequenas variações perto de bordas; não é um halo introduzido por remoção de fundo.
- A composição não corrige halos, cores contaminadas ou bordas já existentes no arquivo de entrada.
- Canvas não preserva perfis de cor originais, HDR, metadados ou animação. A ferramenta não promete equivalência de cor com todos os fluxos profissionais.
- Limites de entrada herdados: 20 MiB, 50 MP e 12.000 px por lado. Não há bloqueio artificial em 16 MP nem redução automática; a capacidade real depende da memória e dos limites de canvas do aparelho. Falhas mostram aviso, sem exportar uma cópia menor silenciosamente.
- Nenhuma execução física em Safari/iPhone/iPad/Android foi realizada; as verificações de tamanho de tela não equivalem a esses aparelhos. Salvar em Arquivos e compartilhamento nativo permanecem pendentes de validação física.
- Aprovação prática do proprietário permanece pendente. **Nenhuma publicação realizada.**
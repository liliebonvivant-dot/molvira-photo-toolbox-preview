# MOLVIRA PHOTO — Verificação do isolamento BiRefNet-lite

Data: 17 de novembro de 2026. **Nenhuma publicação realizada.**

## Resultado

O protótipo foi preservado no código, mas sua página está **bloqueada para todos, inclusive o proprietário**, até aprovação de um mecanismo real de acesso privado. Não substitui a ferramenta Remover Fundo atual.

## O que já estava implementado

- O worker experimental era criado somente ao solicitar processamento. O modelo era baixado dentro desse worker, não ao abrir a página.
- BiRefNet usava um runtime separado (`ort-birefnet`), sem importar IMG.LY no seu caminho de execução.
- A rota já tinha `noindex, nofollow`; não constava no sitemap estático nem no catálogo de 12 ferramentas.
- **Não havia controle de acesso:** conhecer a URL era suficiente para usar o protótipo. Ocultação e noindex não protegiam a página.

## Correções estritamente necessárias

1. Removida a importação do protótipo pela rota. Sua interface, worker, runtime e ponteiros de modelo ficam fora desse caminho de importação da aplicação.
2. Bloqueio na entrada do servidor: `/experimental/birefnet` e seus caminhos subordinados retornam HTTP 404, com `Cache-Control: no-store` e `X-Robots-Tag: noindex, nofollow, noarchive`.
3. Bloqueio adicional no roteador, para impedir a montagem da página em navegação interna. Não é apresentado como autenticação.
4. Carregador público de runtime e avisos de licença movidos para o arquivo interno do experimento; nada foi apagado. A retirada é necessária porque arquivos públicos podem ser servidos antes da entrada do servidor.
5. Adicionados seis testes de isolamento e atualizadas as regras técnicas e a documentação de procedência.

Não foram alterados os arquivos das seis ferramentas, o design, as traduções, o catálogo, o sitemap, `package.json` ou `bun.lock`. Nenhuma biblioteca foi instalada. Nenhuma inferência ou comparação adicional foi feita.

## Verificações realizadas

| Verificação | Resultado |
| --- | --- |
| Testes anteriores, antes das correções | 138/138 passaram, em 13 arquivos |
| Regressão final | 144/144 passaram, em 14 arquivos: os 138 originais intactos + 6 novos |
| Estado de compilação registrado pelo ambiente | build OK |
| Página inicial e seis ferramentas, Chromium | HTTP 200, títulos esperados e nenhum erro JavaScript observado |
| Downloads experimentais nessas páginas | Nenhuma solicitação de modelo, worker ou runtime BiRefNet observada |
| Acesso direto ao protótipo | HTTP 404, inclusive com `?access=owner` e variante de caminho codificada |
| Carregador experimental antes público | HTTP 404 após arquivamento |
| Catálogo | 12 ferramentas; nenhuma identidade ou ligação experimental |
| Sitemap | Sem URL experimental; arquivo existente preservado |
| Indexação | noindex existente preservado, com bloqueio HTTP e cabeçalho adicional |

As verificações de navegador foram realizadas no ambiente local de prévia, sem publicar. Não houve nova medição de tempo ou memória: o resultado comprovado é a ausência de carregamento experimental nas páginas verificadas, não uma garantia absoluta de desempenho em todos os aparelhos.

## Licenças e limites importantes

- O isolamento **não resolve a AGPL** da ferramenta Remover Fundo atual. Seus pacotes e comportamento permanecem intactos; a ferramenta e o projeto continuam sem publicação. A revisão de licença permanece pendente.
- BiRefNet-lite e seu runtime mantêm a documentação permissiva anterior; este trabalho não constitui nova auditoria jurídica nem elimina a revisão dos direitos de treinamento.
- **Bloquear a página não torna privados os arquivos de modelo já hospedados.** Seus URLs de ativos continuam fora desta proteção e não foram revogados. Não há carregamento desses ativos pela aplicação verificada, mas alguém que já conheça um URL pode tentar acessá-lo diretamente. Portanto, não se deve afirmar que os pesos estão protegidos por autenticação.
- O acesso privado do proprietário não foi habilitado. Reabrir o protótipo exige aprovação de uma proteção real; nenhum cadastro, serviço ou armazenamento novo foi criado.
- O sitemap atual é um inventário de desenvolvimento com endereços relativos. Sua regularização continua dependendo do domínio público aprovado, sem alterações nesta tarefa.
- Validação física em Safari/iPhone/iPad/Android e decisões anteriores de qualidade e licenciamento continuam pendentes. Não foram objeto de novos experimentos nesta verificação.

## Conclusão

A execução pública do protótipo está bloqueada, seus imports foram desconectados da rota e nenhum carregamento experimental foi observado na página inicial ou nas seis ferramentas. A solução conservadora preserva o código e as dependências existentes sem liberar acesso privado nem publicar o projeto.
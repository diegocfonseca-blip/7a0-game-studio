# Refinamento das etapas e acesso do bar — prévia local

Continuação sobre 205f27a1 com o lote local acumulado. Sem commit, push ou
deploy. A liberação privada de Diego continua preservada.

## Artes intermediárias

Foram geradas versões refinadas das etapas de primeiro e segundo andares,
sem acrescentar cobertura. As fontes anteriores e seus recortes permanecem
no acervo; a seleção local usa `lower-refino` e `upper-refino`.

Fontes novas:
- Primeiro andar: `/workspace/generated_images/exec-a14b47cc-37fc-4810-98cb-efc0582edf46.png`.
- Segundo andar: `/workspace/generated_images/exec-4ed51348-1341-4bbf-afac-30aa92b3a972.png`.

O empacotador `scripts/prepara-presidencia-refino.cjs` confere oito pontos de
registro contra a fonte anterior antes de gravar arquivos. Os pontos
conferidos mantiveram deslocamento zero, incluindo cantos do campo e acesso
central. Isso não certifica cada pixel da geometria; continua necessária a
revisão visual de toda a composição.

Cada etapa tem uma visão geral de 600×400 (até 60 KiB) e 24 recortes nativos
de 256×256 (até 25 KiB), carregados pelo mecanismo existente de visibilidade.
Totais: primeiro andar 631.294 bytes; segundo andar 636.302 bytes. Não são
baixados integralmente de início pelo mapa. Arquivos antigos não foram
removidos para preservar a comparação e a possibilidade de retorno.

As novas fontes continuam em 1536×1024. Este trabalho NÃO entrega resolução
4K, expansão territorial, nem elimina todos os limites do zoom. As emendas
entre fontes de etapas diferentes e o desfoque em aproximações grandes
continuam pontos de revisão. O gramado 3D e suas coordenadas não mudaram.

## Circulação

O bar agora recebe o visitante pela porta de vidro, com espera de 35 segundos
no interior e saída pelo mesmo acesso. A rota não atravessa lojas vizinhas,
e os demais obstáculos continuam ativos. Hotel e loja foram preservados.
Detalhes e pendências em `presidencia-publico-continuacao.md`.

## Validação local

- Público/portas: 640 combinações de obras e compras, além dos cenários de
  torcida, chuva e jogo; compras/saves intactos.
- Acessos e encontros: caminhos seguros e amostragem de dez minutos por cenário.
- Navegador: nove capturas de entrada/interior/saída dos três estabelecimentos,
  com os recortes carregados; sem erros de página.
- Enquadramento: quatro etapas em quatro larguras, sem fundo exposto.
- `npm run build` e `git diff --check` aprovados.

Não se testou desempenho em celular físico nem se acessou a conta real.
Ainda falta ampliar o território com ruas que encaixem, concluir artes em
resolução adequada ao zoom e os fluxos de estação, arena e chegada/dispersão.

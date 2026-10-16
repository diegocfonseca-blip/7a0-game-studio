# Continuação — torcida, circulação e sala (12/10/2026)

Base publicada: 205f27a1. Este novo lote permanece local, sem commit ou deploy.
O gate de produção continua exclusivo da conta verificada de Diego.

## Implementado

- Mapa do clube e sala recebem o mesmo contexto do clube ativo: divisão,
  ânimo da torcida e chuva já calculados pela carreira. A partida observada
  é somente a do estádio desse clube, usando a publicação existente.
- O tamanho da torcida vem de `torcidaDoEstadio`, também usado na loja;
  não existe uma segunda regra de crescimento de torcida. A lotação visual
  usa a regra existente da aba Estádio (chuva, proteção e estação).
- Amostra limitada: até seis pedestres gerais do clube, seis personagens
  de arquibancada na janela e quatro carros de tráfego. Visitantes dos
  negócios comprados, trabalhadores e segurança continuam separados.
  Não são capacidade oficial, receita, veículos comprados ou 100 mil NPCs.
- Sem partida, os grupos dinâmicos de torcida na janela ficam ausentes;
  durante a partida aparecem em arquibancadas com capacidade. A circulação
  externa aumenta conforme torcida e dia, sem alterar o save.
- Entrada da loja registrada no detalhe da arte: aproximação (1222,448),
  soleira (1230,441), interior (1230,436), na planta 1536×1024. O visitante
  atravessa somente esse acesso, é ocultado progressivamente pela fachada,
  aguarda 24 segundos dentro e retorna sem teleporte. A colisão geral da
  loja permanece intacta. O portal existe somente com a loja adquirida.
- Hotel: acesso conferido no detalhe nativo da arte, contornando o canteiro;
  aproximação (428,544), soleira (421,535) e interior (416,527). O visitante
  fica 45 segundos dentro, oculto pela fachada, antes de sair pelo mesmo acesso.
- Bar: calçada prolongada até (1166,331), porta de vidro em (1166,302),
  interior em (1166,296); permanência de 35 segundos antes do retorno.
- Loja, hotel e bar só ativam o portal quando a rota alcança sua aproximação e os
  segmentos da porta não atravessam outro obstáculo. Uma rota interrompida
  não pode teleportar o NPC para a entrada.

## Verificações

- `testa-presidencia-publico.mjs`: torcida da fonte real, chuva/proteção,
  proporção em dias com/sem jogo, limites, save intacto, circulação segura
  e continuidade do portal. Interiores permitem apenas a passagem da
  própria porta; os demais obstáculos continuam testados.
- `testa-presidencia-encontros.mjs`: ampliado para torcida pequena/grande,
  jogo/sem jogo, obras e asfalto; dez minutos por cenário, amostras de 100 ms.
- `testa-presidencia-publico-browser.cjs`: mapa e janela com mesmo contexto,
  carros, loja, imagens carregadas e largura 390 sem transbordamento.
- `qa-presidencia-publico.html`: revisão local com controles Série V/A e
  com/sem jogo. Fixtures, sem autenticar ou gravar na conta real.
- `testa-presidencia-hotel-browser.cjs`: entrada, permanência e saída com
  posições do modelo real, aguardando os detalhes nativos da imagem.
  Agora cobre hotel, loja e bar. Capturas em `test-results/publico/{hotel,loja,chopp}/`.
- `testa-presidencia-publico.mjs`: 640 combinações adicionais de construção
  parcial/completa e compras independentes, mantendo os três portais acessíveis.

## Ainda necessário para o escopo completo

- Registrar portas da estação e entradas da arena na arte;
  hoje esses destinos continuam visitas externas, sem fingir um interior.
- Conectar todos os passeios em uma rede de percursos coerente (origem,
  destino, espera, entrada e retorno), incluindo desembarque/estacionamento.
- Fluxos de chegada e dispersão após jogo, visitantes e ocupação dinâmica
  das arquibancadas também na vista aérea. Público já pintado nas imagens
  não é removido por este lote: ele não representa lotação dinâmica.
- Conferência visual de todas as etapas e sala em aparelho físico.
  As obras e compras existentes foram preservadas; não se redesenhou o
  estádio nem a sala neste incremento, nem se alterou economia.

Verificação final deste incremento: `npm run build` aprovado (TypeScript e
Vite); `git diff --check` limpo. Sala/conta: `testa-presidencia-autosave-v80.cjs`
e `testa-presidencia-clube-v69.cjs` aprovados, incluindo personagem, compra de
móveis, disposição, reload e nova carreira sem herança. São testes locais,
sem confirmar persistência na nuvem ou desempenho de um celular físico.
Captura de revisão: `test-results/publico/mapa-390.png` (não versionada).

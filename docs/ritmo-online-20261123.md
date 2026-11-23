# Troca de velocidade durante o futebol online

Correção `0b3fc162`, sobre `95cdc6b1`, integrada com a main `83a22056`.
Publicação para todos autorizada em 23/11; conclusão acompanhada no GitHub Actions.

## Falhas reproduzidas

- O efeito do desenho do Campo 2D dependia de `msPorMin`. Cada troca de
  velocidade voltava a atribuir a largura do canvas, limpando a imagem e
  reconstruindo cenário, cache e efeitos. O elemento e o motor eram os mesmos.
- Os outros placares dividiam todo o tempo passado pela duração nova. Ao
  desacelerar de 1× para 0,25×, voltaram de 27′ para 8′ enquanto o principal
  continuou em 28′.
- O avanço automático rearmava uma duração inteira; as travas de revelação e
  os relógios de copa também usavam âncoras diferentes.

## Correção

O desenho 2D lê o ritmo atual por referência. Uma troca de velocidade preserva
o loop, a superfície, os jogadores, o cenário e a memória dos efeitos.

Liga, grupos da Libertadores/Champions e mata-mata local compartilham um
relógio de apresentação por rodada/perna. A mudança de ritmo mantém a fração
percorrida e recalcula somente o tempo restante. O placar principal, os outros
jogos, a revelação da classificação e o avanço automático leem essa âncora.
O calendário de chances do cinema permanece estável durante a partida.

A folga extra após o período-base, incluindo a disputa de pênaltis, continua em
milissegundos reais. Permanecem as travas específicas da disputa no campo e
os tempos de leitura entre fases. Rodada/perna nova recebe relógio novo.

Nenhum campo novo de estado da sala, canal, RPC ou consulta. Resultados, gols,
assistências, RNG, identidade e coroa não mudam por causa da velocidade.
Cinema/campo continua sendo escolha do host para a próxima partida.

O contexto não substitui relógios controlados pelo servidor, carreira, basquete
ou Kings. Nas copas independentes, o minuto explícito continua tendo prioridade.
A retirada do reinício desnecessário do desenho também beneficia o Campo 2D
que usa o mesmo componente fora das salas.

## Validação

- Relógio: 266 verificações de continuidade, tempo restante, trocas repetidas,
  partidas encerradas, troca de rodada e folga fixa dos pênaltis.
- Interface geral: 651 verificações passaram, sem exceções JavaScript.
- Reprodução original repetida: nas três trocas 2,5→1→4→2,5, nenhuma nova
  atribuição de largura ao canvas. Cinema em 31′ antes da troca e 32′ depois;
  outros jogos em 31′, sem retrocesso.
- Navegador: 62 verificações passaram em liga, Libertadores, Champions e copa;
  continuidade, resultados e identidade preservados, canvas mantido em 390 e
  1280 px, controles só do host, avanço automático pelo tempo restante, ida/volta
  e disputa de pênaltis preservada após troca de velocidade.
- `npm run build` (TypeScript e Vite), `git diff --check` e teste de
  pausa/retomada precisa do campo passaram.
- Após integrar a main, compilação e as 62 verificações específicas de navegador
  passaram novamente. Os arquivos de publicação ficam em
  `/workspace/shared/ritmo-online-20261123/publicacao/`.

Roteiros: `scripts/testa-match-presentation-clock.mts` (via
`node scripts/testa-copa-planos.mjs /scripts/testa-match-presentation-clock.mts`),
`scripts/teste-football-full/ritmo.mjs` e
`scripts/teste-football-full/verifica.mjs`.

Evidências locais: `/workspace/shared/ritmo-online-20261123/`, incluindo
`resultado-original.json`, `resultado-corrigido.json` e `correcao/`.

## Limites e reversão

Bancada com componentes e reducer reais, rede externa simulada. Não entrou em
salas reais, não escreveu no banco e não mediu FPS físico no Samsung S25.
Continua pendente o teste nesse aparelho e com duas sessões autenticadas reais.

O relógio permanece local, como a apresentação anterior. Não foi criado um novo
protocolo para reconstruir todas as mudanças de velocidade anteriores ao abrir
uma sala no meio da partida; a reentrada conserva o ponto de partida existente.

Mudança isolada e reversível por commit. Sem migração de banco ou de saves.

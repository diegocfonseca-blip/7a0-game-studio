# Ambulantes na prévia do mapa — 14/11/2026

Diego mostrou a praça sem barracas e perguntou se tinham sumido. A captura não informa a fase oficial da partida; foi solicitada essa informação. Não houve alteração no código de produção nem publicação nesta investigação.

A bancada com o código publicado reproduziu a praça vazia quando `journey.phase=idle`. O grupo `stadium-matchday` fica invisível fora da jornada de jogo. Ao informar a fase `playing`, a mesma praça passou a mostrar as seis barracas existentes, quatro peruas e os vendedores. O teste foi feito em navegador local, 390 × 844, modo Leve, com tráfego externo bloqueado. Não acessou a conta, o save ou as salas reais.

Na chegada, as quatro barracas transportadas aguardam a descarga e montagem; durante a partida ficam montadas. Depois do encerramento, o ciclo inclui desmontagem e saída. Os dois vendedores de bebidas vão a pé. Essas regras não foram alteradas nos commits de carregamento/fluidez `43a44a98` e `5f2f0e99`.

Validação: `node scripts/teste-mapa-ambulantes/verifica.mjs` (0 barracas visíveis entre jogos; 6 visíveis com a partida ativa; nenhum erro de página), `test-vendor-delivery.mjs` (144.000 amostras) e `test-matchday.mjs`. Imagens e relatório em `/workspace/shared/mapa-ambulantes-20261114/`.

Se a captura de Diego foi feita durante um jogo, ainda é necessário conferir a jornada e as identidades enviadas pela carreira naquele momento. A reprodução local não prova o estado da sessão real e não justifica mudar a regra para manter vendedores permanentes.

# Proposta isolada — domínio de lançamento com espaço

Base: `a2fb4f5f`, ramo oficial de trabalho `fix/fundamentos-mapa-20261028`,
sem alterações adicionais. Experimento em `experiment/recepcao-aerea-20261028`,
no checkout `/workspace/leilao-recepcao-contextual`. Não integrar ou publicar
automaticamente: o usuário pediu para preservar o motor oficial de resultados.

## Diagnóstico do vídeo

O lançamento de Oséas para Cuadrado começa aos 83,90 s da semente local 1.
Aos 85,80 s, a bola chega a 2,227 m; o adversário mais próximo está a 8,409 m.
`Motor2.disputas()` chama `cabeceia()` para toda bola acima de 1,50 m. Fora
da área, `cabeceia()` devolve para o companheiro mais próximo. A decisão vem
da fonte, não de uma escolha errada de clipe no 3D.

Trocar apenas a animação por domínio faria os modos mostrarem ações diferentes.
A regra precisa avaliar o contexto antes de decidir o contato.

## Correção proposta

`recepcao-aerea.ts` identifica um passe do companheiro com espaço para receber.
Mantém finalizações na área, disputas iminentes, cortes defensivos e a lógica
dos goleiros. Considera distância, aproximação dos adversários e tempo de queda.
Usa as dimensões e contas determinísticas já existentes, sem novo sorteio.

O receptor antecipa o ponto onde a bola estará na altura de domínio. Enquanto
ela desce, esperar não consome tentativa de contato. A qualidade do domínio,
perda da bola, atributos e próximas decisões continuam nas rotinas existentes.

Esta primeira proposta usa domínio com os pés. Não simula contato de peito:
isso exige uma fase física de amortecimento que ainda não foi implementada.

## Testes

- Casos de decisão: passe livre, adversário próximo, adversário chegando,
  cruzamento na área, corte defensivo, goleiro, finalização e imutabilidade.
- Dezesseis partidas inteiras antes/depois, com 22 atletas iniciais e expulsões
  preservadas: encerramento, valores finitos e diagnósticos do motor conferidos.
- Comparação do mesmo lance: a proposta só entra aos 83 s na instrumentação
  da bancada. O estado e os eventos anteriores são idênticos. Cuadrado domina
  aos 86,05 s, com a bola no chão a 0,123 m do centro do jogador; toca para
  Júnior Baiano aos 86,55 s. Sem cabeceio automático nesse recebimento.
- Captura WebGL real no mesmo módulo do campo do mapa, com 22 personagens:
  o contato do pé na malha é medido e confirmado. Eventos desenhados coincidem
  com o motor usado em cada teste. A proposta não pode ser comparada como se
  preservasse todos os eventos do motor anterior.
- Limpeza matemática posterior verificada contra todos os registros da
  auditoria: mesmos contatos, decisões, placares e estados iniciais.
- Build TypeScript/Vite validado.
- Suíte existente `testa-motor2.mts`: 300 jogos de times parecidos e 100 de
  forte contra fraco, determinismo e regras dentro das faixas da trava. Foram
  registrados 24 reinícios sem a distância exigida nos 300 jogos; a própria
  trava admite esse resíduo. A base registrou 16. Esse aumento precisa ser
  acompanhado antes de integrar; aprovação da trava não significa regressão
  zero. Não se declara futebol sem outros problemas.

Na mesma suíte, gols por jogo passaram de 1,75 para 1,70, passes certos de
83% para 84% e vitórias do time forte de 76% para 81% (100 confrontos). São
observações dessa amostra, não prova de equilíbrio competitivo inalterado.

Artefatos em `/workspace/shared/recepcao-aerea-v7-20261028/entrega`:
vídeo antes/depois, câmera lenta, revisão HTML e diagnóstico.

## Impacto e condição para integração

Oito das 16 partidas mudaram de placar quando a proposta foi aplicada desde
o início. Isso é esperado ao mudar uma decisão que altera posse e sequência
de jogadas, mas impede tratar a mudança como refinamento puramente visual.

Nenhum arquivo do checkout de trabalho anterior foi modificado. Não houve
escrita em save, banco, resultado oficial ou publicação. Não há alteração de
overalls, categorias, descanso ou probabilidades explícitas; o efeito indireto
nas partidas existe e foi medido.

Antes de integrar, obter autorização para mudar a decisão do motor e preparar
versionamento da entrada e do cache compartilhado por 2D, 3D e placar cinema.
Partidas já registradas precisam manter a versão de origem. Esta proposta
não contém essa migração e não deve ser incorporada como atualização global.

## Reprodução

Vite da base na porta 5301; Vite do experimento na porta 5309, ambos com base `/`.

```sh
node scripts/futebol3d/testa-recepcao-aerea.mjs
node scripts/futebol3d/audita-recepcao-v7.cjs
node scripts/futebol3d/grava-recepcao-v7.cjs
node scripts/futebol3d/monta-revisao-recepcao-v7.cjs
npm run build
npm run motor2
```

`recepcao-experimento.cjs` só instrumenta o módulo servido ao navegador de
testes para comparar a mesma jogada a partir dos 83 s; não é importado pelo jogo.


## Integração V8 autorizada em 28/10/2026

O usuário autorizou corrigir a decisão no motor comum e restringiu a ativação à sua conta. Os 8 placares diferentes mencionados no experimento V7 eram a comparação **regra antiga × regra nova**. Não eram diferenças entre as câmeras/2D/cinema. Para uma mesma entrada e versão, todos os modos devem reproduzir o mesmo jogo; somente a cadência de apresentação pode variar.

- `EntradaM2.versao = recepcao-contextual-1` acompanha a partida em todas as visualizações e no cache/save. Ausência mantém o comportamento anterior.
- `motor2-recepcao-conta.ts` limita a criação de partidas nessa versão à conta autorizada, carreira individual de futebol. O reducer também verifica essa condição. Salas online, carreira compartilhada e outras contas não ativam a regra.
- `motor2RecepcaoDesde` guarda a temporada e a próxima rodada. Jogos já calculados/guardados não migram; copas nacionais já iniciadas permanecem inteiras na versão anterior. Copa do Mundo e campanha internacional novas registram a versão ao serem criadas.
- Os caches e resultados pendentes são separados por conta/save. Reabrir uma partida versionada recupera sua regra independentemente da câmera atual.
- O cálculo rápido novo aguarda o apito final (limite defensivo de 120 minutos simulados). A regra antiga limitava o cálculo a 93, mas a comemoração/cobrança podia adiar o apito: isso apareceu em 4/16 casos locais. Não se alteraram o passo da física nem o relógio das visualizações.
- Resultado/narrativa existentes continuam sendo a autoridade. Replays incompatíveis com histórico antigo permanecem bloqueados; nenhum gol é acrescentado/removido para forçar compatibilidade.

### Validação executada

- 16 partidas sem versão: eventos, placares e estatísticas idênticos à base V6.
- 16 partidas novas: resultado rápido, motor do 2D, relato do cinema e adaptador 3D coincidem em eventos, placares, autores, assistências e minutos. Teste a cada minuto, até o apito, incluindo seek/reabertura.
- Reprodução a 0,5×, 1× e 2×: mesma sequência e timestamps oficiais. Esses valores são cadências da bancada, não novos padrões do produto.
- Gate no helper e no reducer, troca de conta/save, round trip JSON, proteção de resultado legado e verificação de replay divergente.
- Liga e copas: teste da próxima rodada; 7 jogos Copa Legends, 7 Copa Brasil, 1 Supercopa, 5 internacionais e 6 da Copa do Mundo com versão propagada e resultado/replay compatíveis.
- Suíte existente: 300 jogos parecidos + 100 forte/fraco para cada regra. Ambas dentro das faixas estabelecidas. Regra antiga: média 1,75 gol; nova: 1,70. Não se afirma equivalência de resultados entre regras distintas.
- 40 Copas congeladas reabertas sem mudança; regressão da temporada internacional aprovada.
- Build completo aprovado, com os avisos já existentes sobre chunks grandes/importações dinâmicas.

### Captura e limites

Captura real WebGL do campo do mapa, 22 atletas, seed local 3. Júnior Baiano lança, Oséas domina após a descida e faz a enfiada. Contato de domínio a 56,55 s: diferença de superfície −0,000471 m, sem cabeceio automático nesse lance, eventos visuais iguais aos oficiais. Vídeo normal e câmera lenta em `/workspace/shared/recepcao-unificada-v8-20261028/`. O arquivo original do save não foi editado e esta seed é um caso de regressão local, não uma rodada gravada na conta.

A primeira captura usou seed 2 e encontrou uma devolução de primeira: a apresentação combina recepção/saída separadas por menos de 0,28 s. Portanto ela não servia como prova de domínio separado; os dados foram preservados na pasta `inversao-de-primeira`. A captura de domínio usa seed 3, cujo intervalo permite observar o amortecimento. Não se reclassificou uma ação nem se alterou a trajetória para aprovar a medição.

Continua sem um domínio de peito completo; a preferência implementada busca a descida aos pés quando há espaço. Cabeceios defensivos, disputas e finalizações na área continuam permitidos. A suíte ainda registra os avisos de distância de reinício preexistentes (16 casos na regra antiga; 24 na nova, abaixo do limite atual da suíte): não são declarados corrigidos por esta entrega.

Sem deploy, push ou escrita no banco/save real. Reversão disponível pela branch `recovery/recepcao-prototipo-aef9eca6`; integração local na branch `fix/recepcao-conta-20261028`.

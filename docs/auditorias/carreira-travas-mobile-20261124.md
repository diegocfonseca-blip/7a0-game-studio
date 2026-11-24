# Carreira: placar parado, substituições e prévia mobile — 24/11/2026

Diego recebeu relato de Flamengo, Brasil Oficial, temporada6/SérieB/rodada10, parado por mais de um minuto durante a partida com o placar rápido. A conta ainda não foi informada. Também pediu revisar o cabeçalho/escudos grandes no celular e o botão Substituir nos formatos3D,2D e placar.

## Causas encontradas e correção funcional

### Placar aguardando um lance invisível

O caminho legado (jogo ainda sem entradaM2, mantido assim para preservar resultados) ativava `privateField` mesmo sem ninguém assistir ao estádio. O relógio parava para esperar a animação física de um lance/gol/reinício que o placar rápido não mostrava.

Na bancada real do Oficial, Flamengo/T6/B/R10 em0,25×: o teste que esperava passar do minuto1 excedeu60s. Uma captura adicional de17s confirmou `min=1`, `privateField=true`, `voo=true`, `pending=true`, `pausado=false`, sem erro de página. O processamento não estava simplesmente ocupado por um minuto: o relógio aguardava a cena escondida. Após corrigir, o mesmo ensaio alcançou o minuto40 em17s, com a espera física desligada; também chegou ao apito no teste de progressão acelerada.

`privateField` agora exige uma vista do estádio realmente ativa. Placar rápido acompanha seu relógio e continua revelando os gols já definidos;3D conserva os movimentos físicos. Isso é uma causa reproduzível do sintoma, **não confirmação de que o save da foto segue esse caminho**, pois não temos a conta.

### Campo invisível consumindo CPU

Além da súmula/relato, havia um Campo2D oculto e um laço de apresentação3D funcionando no placar. Agora:

- O estado do jogo continua publicado para o mapa/HUD.
- A fonte2D fica montada, com motor e agenda preservados, mas suspende a simulação/desenho e limpa a amostra de tempo enquanto ninguém acompanha o campo. Isso evita perder trocas ao alternar vistas.
- `usePublicarPartida` recebe `simularCampo`; o placar só executa a animação3D quando há vista do campo ativa. Outros chamadores conservam o padrão anterior.
- Campo2D visível segue funcionando; abrir o estádio retoma sua fonte. Não altera sementes, gols, placares, autoria, elencos, economia, salvamento ou autoridade online.

Perfis de desenvolvimento com CPU limitada6× foram coletados. Remover trabalho invisível é verificável; **não são medição de FPS de celular nem promessa de resolver qualquer travamento**. Não usar o custo de JSX de desenvolvimento como benchmark de produção.

### Botão Substituir

A condição `subPossivel && campo2d` escondia o botão no placar rápido mesmo em partidas elegíveis. Retirada somente a exigência de2D. Reutiliza `BotaoSubstituir` e `PainelSubstituir` existentes: pausa, onze em campo, reservas e táticas na mesma área. Permanecem os limites e a elegibilidade existentes: partida de liga com motor atual, até3 trocas e mesma posição; não inventa substituição ao vivo em jogo legado que não tem esse motor. Não amplia para copas por inferência.

## Validação concluída

- UI real em390×844: Substituir aparece no placar rápido e2D, abre elenco/táticas, pausa o relógio, confirma troca e tática de ataque, retoma do mesmo ponto. XI fixo e gols anteriores preservados.
- Alternância2D→placar→2D: segunda substituição feita no placar aparece no motor retomado; quem saiu não permanece em campo. Observador3D reativa a fonte física, que volta a suspender quando a vista fecha.
- Legado: passa do minuto1 e chega ao apito; não recebe mecanismo de substituição incompatível.
- Progressão390/1440: pausa/retomada na Central, velocidade0,5×→4×, término aos93′, três opções de transmissão, confirmação do substituto de uma lesão antes da rodada seguinte e início da rodada11. Sem exceções de página.
- Regressão do motor:12 jogos, passado intacto e resultado da troca agendada igual ao motor refeito;266 verificações de relógio passaram.
- TypeScript e compilação de produção completa da raiz (`DEPLOY_BASE=/ VITE_ONLY_GAME=escalacao npm run build`) passaram.

## Prévia visual, separada das correções

CSS somente em `/workspace/shared/travas-carreira-20261124/compacto-preview.css`. Não é importado pelo produto nem commitado: o `CLAUDE.md` exige mostrar captura e esperar aprovação antes de commitar um novo visual.

Proposta para até600px: marca em faixa menor, resumo da competição compacto, escudos56px e menos espaço vazio quando ainda não houve gols. Placar continua central e o botão Substituir fica acessível mais cedo. Mantém patrocínio, rodada/divisão, torcida/posição/saldo. Desktop não recebe essas regras.

Capturas reais, com dados de teste: `proposta-controles-mobile.png`, `atual-controles-mobile.png`, `painel-substituir-quick.png` e `painel-substituir-2d.png`. Arquivos em `/workspace/shared/travas-carreira-20261124/`. Não são o save do usuário e não houve arte gerada.

## Reprodução e limites

```sh
node scripts/teste-travas-carreira/verifica.mjs
node scripts/teste-travas-carreira/substituir.mjs
QA_LABEL=legado QA_LEGADO=1 QA_CPU=1 QA_SPEED=.25 node scripts/teste-travas-carreira/perfil.mjs
# Capturar também a proposta visual local:
LL_CAREER_PREVIEW_CSS=/workspace/shared/travas-carreira-20261124/compacto-preview.css node scripts/teste-travas-carreira/substituir.mjs
```

Bancadas em5340/5341/5342, Chromium/Playwright, rede externa e WebSockets bloqueados. Instrumentação apenas no servidor de teste, sem injetar apito ou concluir partida por fora do motor. WebGL desligado: testa fluxo, relógio e CPU da apresentação; não representa a imagem/FPS3D. Salva apenas arquivos de evidência locais, nunca uma conta de produção.

`substituicoes.json`, `verificacao.json`, `perfil-legado.json`, `perfil-legado-corrigido.json` e arquivos`.cpuprofile` registram os resultados. A primeira rodada de medição foi feita antes da mudança e não deve ser sobrescrita com uma versão corrigida se usada como comparação.

**Estado:** correções funcionais implementadas/testadas, sem publicação. Novo visual somente em prévia; nenhuma migração, conta/save real ou serviço foi alterado. O caso exato ainda depende da identificação da conta. Retorno funcional pelo commit isolado, sem migração.

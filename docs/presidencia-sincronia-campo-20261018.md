# Campo, relógio e entrada nas câmeras — 18/10/2026

Correção dos prints de Diego: jogadores concentrados no círculo central aos
93′, partida visual curta e diferença entre encerramento do placar e campo.
Base de trabalho: `c5727c58`, atualizada com `014e1c83` sem conflitos,
preservando a publicação anterior e os trabalhos paralelos da main.

## Causas reproduzidas

- A duração normal de 11 segundos concedia ao motor apenas 9,02 segundos
  físicos. A velocidade 0,25× alongava a espera, mas não a quantidade de futebol.
- A troca de lado enviava os 22 atletas pelo centro. A simulação curta acabava
  antes de eles chegarem ao novo lado: até 18 atletas no raio central de 12 m.
- A liberação da próxima rodada, da tabela e do fim da temporada usava timers
  independentes, capazes de terminar antes da apresentação física dos gols.
- Na Copa, outro relógio podia iniciar a volta antes de encerrar o lance da ida.

## Comportamento corrigido

- No intervalo, o segundo XI retoma já distribuído no seu lado; a saída exige
  distância dos adversários. Após gol, a bola continua sendo buscada e levada
  ao centro, sem teleporte. Abrir um jogo encerrado não inicia outra saída.
- O placar mantém o motor CPU ativo com a câmera fechada. Mapa, sala e campo
  consultam o mesmo motor e o mesmo relógio; não reiniciam o jogo ao abrir.
- Assistir ao campo garante pelo menos 120 segundos físicos de circulação
  por partida, além das jogadas oficiais e reposições. A velocidade escolhida
  escala esse tempo. A duração ampliada permanece até o fim daquela partida.
- O minuto aguarda a jogada oficial e a saída de bola. Placar e rádio confirmam
  o gol no relógio de impacto. Finalização, tabela e próxima rodada aguardam o
  fechamento; a Copa aplica a mesma regra à troca de perna e aos pênaltis.
- Abrir uma vista visível do campo seleciona 0,25×. Atualizar o placar, começar
  outra rodada ou aproximar a câmera não desfaz a escolha manual. Sair não
  acelera. Controles locais oferecem 0,25×, 0,5× e Normal sem exigir plano.
- A abertura e o botão VER CAMPO enquadram o gramado e as duas balizas,
  mantendo a imagem sobre toda a janela. O zoom mínimo não expõe faixas
  verdes. Em tela vertical, a câmera aérea do mesmo estádio permite esse
  enquadramento; a câmera interna permanece quando cabe na tela horizontal.
- As mudanças continuam restritas à prévia verificada de Diego. Os relógios
  públicos e a autoridade da sala online conservam seu caminho anterior.

## Verificação

- Distribuição: partidas comprimidas de 12/30/60/90 segundos, primeiro e
  segundo tempos, substituição, evento atrasado aos 45′, encerramento e quatro
  reinícios após gol. No caso de 12 segundos, o pico central caiu de 18 para 2.
- Motor original e regressão de 51.930 quadros aprovados.
- Controles no navegador: entrada, preferência manual, saída, ancestral
  oculto, autorização tardia e reautorização aprovados.
- Copa no navegador: ida/volta sem minuto artificial, gols aos 92′, mudança de
  velocidade e pênaltis após encerramento aprovados.
- Partida real sem minuto artificial: 0×0 completo com nove fases de jogo;
  abertura tardia sem reiniciar; gols aos 35′/89′ com o minuto retido e placar
  confirmado no impacto; 0,25× → 4× → 0,25× durante o lance → 4× sem retrocesso.
- Gol aos 45′ mantém o lado do primeiro tempo, confirma antes do intervalo,
  pausa bola/atletas/tempo e retoma o segundo XI. Regra de período explícita
  evita trocar de lado no quadro anterior ao carregamento do planejador.
- Campo WebGL real em 390×844: 22 atletas, partida completa e placar final
  correto. Perda/retorno do gate e imports pendentes também aprovados.
- Enquadramento: 70 casos geométricos e seis vistas no navegador (várzea e
  estádio completo em 390×844, 1400×1000 e 350×1700). Balizas visíveis,
  aproximação/restauração e afastamento sem faixas. Nas telas muito altas,
  a janela se limita a 2,4 vezes sua largura para manter o campo inteiro.
- Build de produção TypeScript/Vite aprovado, com os avisos já existentes de
  tamanho de bundle e importações mistas.

Fixtures usam dados locais e rede externa bloqueada. Não alteram saves reais.
O motor continua apresentando os eventos oficiais da simulação; este reparo
não implementa regras completas de arbitragem, impedimentos ou todos os lances
do futebol. Fluidez em aparelho físico não pode ser inferida do Chromium por
software usado aqui.

Comandos reproduzíveis: `node node_modules/jiti/lib/jiti-cli.mjs
scripts/testa-presidencia-distribuicao-campo.mjs` e `node` com os scripts
`testa-presidencia-relogio-real-browser.cjs`,
`testa-presidencia-copa-sincronia-browser.cjs`,
`testa-presidencia-velocidade-browser.cjs` e
`testa-presidencia-futebol-gate-browser.cjs` em `scripts/`.

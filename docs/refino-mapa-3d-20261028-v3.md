# Campo 3D do mapa — revisão de movimento e apoio, 28/10

Pedido: continuar corrigindo os erros observados no vídeo da partida 11×11.
Escopo: apresentação do campo dentro do mapa. Mantidos o GLB atual do usuário,
rig, pesos, materiais de uniforme, cidade, estádio e resultados oficiais.
Sem publicação, acesso ao banco ou avanço de rodada nesta revisão.

## Causas reproduzidas e correções

- **Patinação na corrida.** O controlador usava 2,9 m por ciclo para todos os
  deslocamentos. No rig importado, a corrida frontal corresponde a 2,069 m;
  laterais e diagonais têm outras medidas. `map-gait.mjs` mede os pés nos clipes
  existentes ao preparar a partida. A condução contém duas passadas por clipe.
  A troca de direção agora alinha a fase de apoio da perna esquerda entre clipes.
- **Tranco na recepção.** A mudança de trajetória relativa para absoluta zerava
  a velocidade em um quadro. `prepareBodyTrack` une aproximação, domínio e
  recuperação com tangentes contínuas, preservando os pontos de contato.
  A saturação suave do limite evita outro tranco ao alcançar o orçamento de 3 m.
  O recolhimento de lateral começa a ser preparado mais cedo.
- **Pé de apoio escorregando.** `MapFootPlant` aplica IK residual, limitado a
  10 cm e 0,28 rad, sobre a captura original. Libera o apoio no balanço, salto,
  giro, queda, aproximação da bola e nos impactos calibrados. Não alonga pernas,
  não altera ossos de repouso e não move a bola.
- **Desvio para o lado errado em disputas.** A normal de separação era escolhida
  sem verificar o lado livre, podendo levar um corredor inicialmente na direção
  do adversário. O sinal agora amplia a distância lateral. A prioridade de contato
  entra gradualmente; não apaga o desvio em um único quadro.
- **Pose de passe prolongada.** A recuperação dos passes curtos começa antes,
  sem cortar o contato. Captura e reposição do goleiro têm mais tempo de transição.
- **Bola congelada no ar após reposição.** O giro era zerado ao agarrar e só
  reiniciava após sair do chão. A saída das mãos também inicia giro visual.
  Isso não aplica torque ou altera a física oficial.
- **Sombras de apoio ausentes no novo modelo.** Reutilizado o sistema existente
  de sombras sob as solas, adaptado aos nomes Mixamo. Um desenho instanciado para
  44 pés; uma geometria e uma textura de 32×32 adicionais, descartadas com a partida.

## Verificação

- Mesma entrada local salva de Rei da Bola FC × Neymarzetti: 5.401 quadros a
  60 Hz e 2.701 a 30 Hz, 22 atletas. Sem erros JavaScript. Placar, 67 eventos,
  autores, assistências e horários idênticos ao teste anterior.
- Os 64 contatos programados na amostragem de 60 Hz mantiveram distância da
  superfície entre −0,91 mm e +6,54 mm. Isso verifica os impactos programados;
  não comprova qualidade de todos os movimentos entre eles.
- A 30 Hz, 31 impactos caem entre quadros. A estimativa por interpolação de
  triângulos chega a 6,17 cm e 12 ficam fora da tolerância de 3 cm. São estimativas,
  não medições instantâneas exatas nem uma aprovação geral em baixa frequência.
- Corrida frontal a 2,5 / 3,5 / 4,5 m/s: deslizamento mediano do pé apoiado passou
  de 0,793 / 1,104 / 1,405 m/s para 0,236 / 0,360 / 0,436 m/s, redução de 67–70%.
  O teste usa a malha e o mixer reais. Os resíduos continuam visíveis em certos
  apoios; não se declara foot locking perfeito.
- Na recepção do Weah entre 15 e 17,6 s, o pico de aceleração visual caiu de
  560,7 para 107,0 m/s² a 60 Hz. Melhorou, mas o valor ainda é alto.
- Separação mínima entre centros: 44,2 cm. Esse volume não prova ausência de
  todas as interseções de braços/pernas.
- Diagnóstico ligado/desligado mantém poses, bola e eventos iguais. Trocar câmera
  em pausa não muda o quadro. Retomar durante a posse do goleiro mantém a bola
  nas mãos após a captura verificada.
- Integração real com a cidade conferida em 960×720 e 390×844, nos modos
  transmissão, tática e mapa livre. Recursos estáveis: 301 geometrias/41 texturas.
  Esses são contadores de recursos; não são bytes de RAM. Não houve perfil em
  celular físico. O FPS de exportação do vídeo não representa o FPS do aparelho.

## Evidência e reprodução

Arquivos de revisão: `/workspace/shared/fundamentos-mapa-v3-20261028/entrega`.
`fundamentos-normal.mp4` e `fundamentos-lento.mp4`: capturas reais de WebGL com
os 22 atletas atualizados. `antes-depois.mp4`: mesma jogada entre 16 e 18,5 s,
mesma câmera, ambos os lados a meia velocidade. `campo-dentro-do-mapa.mp4`:
captura do componente React da cidade. Os cortes não são uma gravação contínua
de todos os 90 segundos; a auditoria de poses percorreu a partida completa.

Testes: `testa-transicoes-mapa.mjs`, `testa-fundamentos-mapa.mjs`,
`testa-contato-mapa.mjs`, `testa-passada-mapa.cjs`,
`testa-diagnostico-opcional.cjs`, `test-collision-clusters.mjs`.
Auditoria: `AUDIT_OUT=... NO_CAPTURES=1 node scripts/futebol3d/audita-mapa.cjs`,
com `AUDIT_HZ=30` para a segunda frequência.
`resume-refinamento-v3.cjs` verifica os resultados antes/depois e exporta o relatório.
Build exigido: `npm run build`.

## Limites ainda abertos

- Sprints: a biblioteca atual tem corrida de trote; acelerar muito esse clipe
  não substitui uma captura adequada de sprint. A cadência está limitada.
- Picos de velocidade/colisão ainda aparecem em mudanças rápidas: máximo
  12,82 m/s a 60 Hz e 14,52 m/s a 30 Hz nesta amostra. Refinar a navegação antes
  do contato e as transições restantes, sem alterar o resultado oficial.
- Goleiros: voo, recuperação e alternância entre tipos de defesa ainda precisam
  de revisão em outros lances. A reposição corrigida não valida todas as defesas.
- Reunião dos atletas após o apito usa contagem de quadros no adaptador anterior;
  a marcha final ainda precisa de relógio de apresentação consistente.
- O resultado histórico dessa entrada era 1–1, mas o motor atual reproduz 3–0.
  A trava de replay continua recusando a divergência. A paridade 3–0 antes/depois
  prova preservação desta revisão, não reconstrução fiel da partida antiga.
- Outros saves, sementes, expulsões e aparelhos físicos ainda precisam ampliar
  a cobertura. Nenhuma alteração foi aplicada na conta do usuário.

Recuperação: `recovery/fundamentos-mapa-v2-50010191` preserva a versão anterior.
Reverter o commit desta revisão retira apenas estas correções; não restaurar
arquivos de outras áreas a partir de uma cópia antiga.

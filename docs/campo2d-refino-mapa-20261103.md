# Refinamento da apresentação 2D no mapa

Continua a implementação do mockup aprovado por Diego: cidade e estádio
existentes em 3D, partida do Campo2D no próprio gramado, prévia restrita à
mesma conta verificada. Substitui a projeção opaca descrita na primeira entrega.

## Alterações

- O mapa lê os mesmos estados interpolados do Campo2D, mas mantém o gramado,
  a textura, o progresso de plantio, as marcações e os gols nativos do estádio.
  Remove a cópia intermediária do canvas e seu envio contínuo à GPU.
- Círculos, números e retratos usam texturas pequenas em sprites, mantendo
  formato e leitura na perspectiva oblíqua. A arte NO FACE é a mesma já
  selecionada pelo Campo2D; nenhum jogador ganha uma identidade inventada.
- No máximo quatro nomes: prioriza posse/lendas, considera proximidade,
  preserva escolhas estáveis e evita sobreposição com nomes, ícones e bola.
  Nomes somem na vista distante. Sombras dos 23 marcadores usam uma instância
  compartilhada; mudança de posse apenas move o aro, sem recriar a textura.
- A bola tem desenho de futebol e gira conforme o deslocamento recebido da
  fonte. Sua trajetória X/Z e altura de voo não são recalculadas. O tamanho
  visual é simbólico, como os marcadores, e não representa uma bola de escala
  humana real. A rede nativa reage ao `rede` já emitido pelo Campo2D.
- A câmera aberta conserva a visão completa com mais perspectiva. O zoom
  manual aproxima e acompanha a jogada por translação, preservando ângulo e
  lente; limita o deslocamento para reduzir o vazio além dos gols.
- “Mapa” e “Ver partida” substituem o seletor com apenas duas opções nessa
  apresentação. Placar, contraste, marcações e botões de zoom ficam mais claros.

## Verificações

- Build completo TypeScript/Vite.
- Testes de fonte compartilhada, nomes, câmera em seis proporções, zoom
  máximo/cantos, preservação do ângulo e câmeras anteriores.
- Partida contínua usando a cópia local somente de leitura do save Neymarzetti:
  resultado 1–1, 22 atletas; 454 amostras sincronizadas com erro X/Z máximo
  igual a zero; até quatro nomes; bola girando e rede reagindo aos gols.
- Replay salvo: iniciar, pausar, fechar e reiniciar; retorno à fonte ao vivo.
- Controles de velocidade, ida/volta do mapa, troca de conta e logout; zero
  downloads de rigs/clipes de futebol e nenhum erro JavaScript nesses testes.
- Comparação antes/depois na mesma partida, minuto 20, posições e narração
  idênticos. Capturas da cena em desktop e celular, com renderização 1,5× em
  ambas as versões. São capturas reais da cena; não são medições de FPS em
  aparelho físico. O enquadramento de zoom também é registrado separadamente.

O motor oficial, dados, overalls, categorias, descanso e permissões permanecem
intactos. Fingerprint: `23599bdba04b0c7c2639389e2509f4d81a34796083f78b6a5d81e97c0d22bbbd`.
Nenhum serviço pago, nova conta externa ou migração de banco.

O futebol continua herdando os comportamentos e as limitações do Campo2D.
Essas alterações tratam da apresentação, e não substituem ou corrigem decisões
do motor. Desempenho e legibilidade finais dependem da avaliação no celular real.

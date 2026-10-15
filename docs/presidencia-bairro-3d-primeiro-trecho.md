# Entorno 3D — primeiro trecho de avaliação

Diego autorizou reconstruir o entorno como cena 3D e começar por um trecho
com rua, estabelecimento, pedestre e carro. Esta prévia é a execução desse
primeiro trecho; não é ainda a migração de todas as etapas do estádio.

Base preservada: `205f27a1` mais todos os incrementos locais anteriores.
Nenhum commit, push ou deploy. Nenhuma compra, estado de carreira, conta,
simulação ou regra de acesso foi alterada. O conteúdo publicado continua
como estava; a prévia é uma página local separada do jogo.

## Como revisar

No Vite deste workspace, abrir `/7a0-game-studio/qa-presidencia-bairro-3d.html`.
Os controles aproximam da entrada, pedestre ou carro, enquadram a quadra e
pausam/retomam o movimento. Um dedo gira a vista; dois dedos aproximam e
deslocam. A janela tem 72% da altura disponível no celular, mínimo de 460px.

Capturas e relatório ficam em `test-results/bairro-3d/`, fora do versionamento.
O cenário usa o Three.js já instalado. A página não importa provider de
autenticação, store da carreira ou publicadores de partida.

## O que é tridimensional neste trecho

- Rua, meio-fio, pavimento, paredes, vão da porta, interior, bancos, árvores,
  vizinhos, pessoa e veículo são volumes na mesma cena, sob a mesma câmera,
  luz e mapa de sombras. Não se usa a fotografia do mapa como chão.
- A fachada tem abertura real de 2,50m. O pedestre cruza a abertura e chega
  ao interior; a própria parede o oculta pela profundidade do renderizador.
  Nenhum corte CSS ou desaparecimento programado substitui essa oclusão.
- Metros como unidade: pedestre 1,801m; carro aproximadamente 4,2×1,8m;
  calçada a 0,16m e pneus de raio 0,32m apoiados no asfalto a 0m.
- Caminhada com cinemática de duas juntas e apoio ligado à distância real.
  Cabeça neutra, sem olhos, nariz ou boca. Rodas giram pela distância percorrida.
- O trajeto respeita o corredor e desacelera nas paradas. Há espera de oito
  segundos dentro e retorno pelo mesmo acesso. O carro passa pela faixa;
  seu reinício de percurso ocorre a ±95m, fora da quadra demonstrada.
- Objetos estáticos e partes fixas do carro agrupados por material, com
  geometria preservada no zoom. Cenário com 30 malhas e 86.952 triângulos;
  atores com 42 malhas e 11.780 triângulos antes do culling da câmera.

## Arquivos

`presidencia-bairro-3d.tsx` e `.css`: câmera, luz, renderização, controles,
pausa, visibilidade, resize, limite de pixels e descarte de recursos.

`presidencia-bairro-cenario-3d.ts`: arquitetura, solo, vegetação, mobiliário,
materiais e volumes de colisão. `presidencia-bairro-model.ts`: tempo,
coordenadas, trajetos e fases. `presidencia-bairro-atores-3d.ts`: malhas,
articulação e contato dos pés/pneus.

## Validação

- `testa-presidencia-bairro-model.mjs`: dez minutos a 100Hz, continuidade,
  orientação, porta, separação do tráfego e pausa determinística.
- `testa-presidencia-bairro-cenario.mjs`: 321 pontos do corredor, 803 poses
  reais e 1.769 verificações do piso por raycast; abertura, paredes, carro
  sobre o asfalto e descarte de recursos.
- `testa-presidencia-bairro-atores.mjs`: 15.600 quadros a 120Hz; ao menos uma
  sola apoiada, nenhuma abaixo do chão. Deslizamento máximo de 0,038mm por
  quadro nos apoios retos constantes; pneus com tolerância geométrica de
  1,541mm após o refino das rodas. Valida sombras, profundidade, pausa e
  liberação de recursos.
- `testa-presidencia-bairro-browser.cjs`: desktop e dispositivo móvel
  emulado, porta visível de frente e personagem ocluso pela parede de trás,
  câmera, zoom, pausa/retomada e contato com o chão. Também exercita toque
  nativo com um e dois dedos por CDP.

Primeira rodada funcional aprovada em 12/10: `npm run build`, os quatro scripts acima e
`git diff --check`. No celular emulado, o gesto de abrir os dedos reduziu a
distância da câmera de 125m para 52,08m; fechar restaurou 125m. A pausa e a
retomada foram conferidas nos dois tamanhos. Nenhum erro de execução.
Renderização medida da vista inicial: 89 chamadas de desenho e 72.708
triângulos; isso é carga da cena, não medição de FPS de um celular real.

## Limites e continuidade

É uma prova funcional de integração, com acabamento ainda diferente da arte
final aprovada. Não declarar o mapa completo ou fidelidade visual final
entregues. O desempenho em aparelho físico não foi medido; Chromium local
com renderização por software não representa o celular de Diego.

Ainda não há estádio, etapas de obras, janela do presidente, partida,
estacionamento, multidão ou rede inteira de ruas nesta cena. Eles continuam
na implementação anterior. A nova cena não deve substituir o mapa da conta
até essas integrações estarem prontas e o visual revisado.

Os giros parados usam transição simples da pose, ainda sem animação de giro
capturada sobre o pé de apoio. A rota evita sólidos por construção validada;
isto não é ainda navegação dinâmica para centenas de NPCs ou para qualquer
disposição futura de edifícios.

Próxima etapa: registrar a planta completa do estádio e lotes em metros,
derivar os volumes das mesmas compras já salvas, compor primeiro/segundo
andares antes da cobertura e conectar o campo existente de 105×68m à mesma
planta. A vista da sala deverá observar esse mundo, com a mesma evolução.
Manter as artes anteriores como referência e comparação, não como piso
sob personagens 3D. Só então ampliar rotas e população a partir da torcida.

## Refinamento para a arte original — 12/10

Diego reforçou que a reconstrução deve preservar a aparência e o acabamento
da arte aprovada. Referências comparadas: os recortes originais
`public/estadio-mapa/projeto/complete-2048-512.webp` e
`complete-2304-512.webp`. Não usar a primeira maquete como referência de estilo.

O trecho foi corrigido para fachada contemporânea clara, faixa e cobertura
cinza, vitrines mais altas com esquadrias estreitas, duas palmeiras com frondes
e arbustos nos canteiros existentes. Foram retirados o toldo verde e os frisos
clássicos que destoavam do original. Asfalto e piso receberam cores mais
neutras. A luz do sol ficou lateral e quente, com preenchimento mais frio e
uma fonte real no interior, bloqueada por paredes e personagens.

Uma segunda passagem acrescentou relevo aos materiais, chanfros discretos
nas peças próximas, folhas separadas nas copas, carroceria suavizada, vidros
curvos, pintura com verniz e rodas de cinco raios. O sol mantém sua direção,
mas concentra a resolução das sombras na região observada quando se aproxima.
As reflexões PBR usam uma captura estática pequena do próprio cenário, feita
uma vez, sem os atores em movimento. Elas não são espelhos atualizados em
tempo real. O teste do navegador também inspeciona as amostras dessa captura
para detectar NaN/Infinity, que poderiam escurecer todos os materiais sem
causar erro JavaScript.

Na captura dos reflexos, o relevo microscópico é suspenso: suas derivadas em
arestas da captura de baixa resolução produziam NaN e contaminavam o resultado.
O relevo continua presente na vista principal. A rodada completa do navegador
passou depois dessa correção em desktop e celular emulado, com zero amostras
inválidas, contato, porta, pausa, zoom, órbita e pinça preservados. O build
também passou. A última correção geométrica removeu duas faces coplanares do
piso interno, mantendo o mesmo piso a 0,16m; as sombras receberam filtragem
mais suave. O teste de cenário passou novamente após remover a duplicação.
As peças finas de pavimento recebem as sombras de pessoas, árvores e prédios,
mas não projetam sombras sobre a própria base: isso remove as faixas de
quantização vistas no enquadramento afastado. Guias e construções continuam
projetando sombras.

Conferência final das capturas após essas correções: desktop e celular
emulado sem erros ou amostras de iluminação inválidas; porta e apoio
preservados. A vista geral final mede 73 chamadas e 98.780 triângulos. Relatório
adicional em `test-results/bairro-3d/final-visual-report.json`; capturas de
entrada e vista geral atualizadas nos dois tamanhos. As faixas no piso interno
e a triangulação de sombras do pavimento distante foram removidas.

Piso, corredor, porta e trajetos foram preservados. As capturas anteriores
ficam em `test-results/bairro-3d/primeira-demonstracao/` para comparação local.
Este é um refinamento do trecho isolado: não comprova reprodução exata da
arquitetura, implantação ou acabamento de todo o mapa. Antes de expandir,
registrar a planta nas mesmas posições da arte, comparar silhuetas, proporções,
materiais, luz, vegetação e detalhes no zoom. Validação funcional de colisão
não substitui essa comparação visual.

Pendências visuais observadas, ainda não concluídas nesta passagem:

- A faixa opaca acima da vitrine está alta e precisa ser proporcionada à
  fachada original, junto da relação entre vidro, pilares e cobertura.
- Os edifícios de fundo ainda são volumes genéricos repetidos. A composição
  precisa ser registrada na planta original antes de virar o entorno do clube.
- Palmeiras e canteiros ainda têm menos densidade e variedade que a referência.
- Materiais, iluminação e pequenos detalhes ainda não atingem o acabamento
  da arte original. Não confundir os testes funcionais aprovados com aprovação
  artística ou com conclusão da reconstrução do estádio.

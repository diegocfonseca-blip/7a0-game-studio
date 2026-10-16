# Jogadores e NPCs sem rosto — acabamento local de 16/10/2026

Diego pediu melhorar os jogadores do campo e os NPCs das ruas, que pareciam
SVG, mantendo todos sem olhos, nariz ou boca. Esta continuação trata dos
corpos humanos do campo, passeios, visitas, passageiros e arquibancadas.
O personagem original da Presidência continua com a correção anterior.

## Implementação

- `presidencia-humano-acabamento.ts` fornece volumes próprios para tronco,
  cabeça com queixo e crânio, cabelo, quadril, membros e calçados. São malhas
  tridimensionais, com normais, UVs e materiais de pele, tecido, cabelo,
  calçado e sola. Não se usam SVGs nem planos com imagens para esses NPCs.
- A cabeça permanece lisa. O cabelo acompanha os mesmos anéis do crânio,
  evitando as falhas de cobertura detectadas na primeira prévia. Camisa,
  mangas e membros têm sobreposição nas articulações para evitar fendas.
- Jogadores têm gola, punhos, meias, mãos e calçados refinados. Uniformes
  continuam recebendo a cor do time; escala adulta, pivôs, passadas e contato
  entre a chuteira e a bola conservam o contrato do campo de 105 × 68 m.
- A revisão das luvas revelou que o ponto médio correto não bastava para
  apoiar a bola nas superfícies das mãos. O ajuste visual reposiciona as duas
  palmas simetricamente ao redor do ponto antigo e resolve os braços até elas.
  Não cria outro centro, trajetória, evento ou relógio de bola.
- Pedestres e visitas reutilizam os mesmos percursos e apoio dos pés.
  O corpo de visita também atende passageiros e torcedores em circulação.
  Não se alteraram ruas, portas, escadas, reservas de assento ou população.
- A torcida estática usa a variante econômica da mesma modelagem, mantendo
  três partes/materiais por grupo e o limite de 800 pessoas. Cabelo e calçado
  recebem acabamento por cores nos vértices, sem novos lotes por torcedor.
  São 2.312 triângulos por torcedor; pedestres têm 8.988 e visitas 8.112.
- O agrupamento de jogadores identifica a forma de cada malha e o material
  completo. Geometrias diferentes não são confundidas por terem o mesmo tipo
  `BufferGeometry`; tecido, cores, sombras e os filhos das chuteiras permanecem
  visíveis. Texturas próprias são descartadas pelo dono, uma vez.
- A primeira revisão mostrou mãos/pescoços/joelhos pretos onde primitivas
  não tinham cores nos vértices. Agora recebem branco explícito, preservando
  a cor do material. Solas de pedestres e visitas também foram arredondadas.

## Evidências locais

As verificações usam módulos de produção, fixtures locais e rede externa
bloqueada; não acessam a conta de Diego nem salvam clubes reais.

- Atleta: escala adulta, 400 poses, 47.880 verificações de apoio, 72 contatos
  de chute e 216 posições de luvas. O teste de acabamento mede os triângulos
  reais da chuteira em 36 orientações, além do envelope usado pelo motor.
  Modelo final: 11.400 triângulos, altura de 1,808 m e erro máximo de contato
  da chuteira de 3 × 10⁻⁹ m.
- Pegada: 176 poses, 352 contatos das superfícies reais, 176 alternâncias de
  pose e braços sem interseção com a bola. Centro anterior preservado até
  erro numérico de 3,6 × 10⁻¹⁵ m; extensão máxima do antebraço de 1,66 cm.
  Uma revisão independente de 312 poses comparou com o mesmo rig sem o
  refinamento, incluindo defesa parcial e mergulho: centro e piso preservados.
- Jogadas contínuas: 14 lances, 9.745 quadros, contato dos pés e colisão com
  tronco/shorts. O seletor de partes passou a usar nomes semânticos, mantendo
  a medição real dos triângulos depois da substituição das primitivas.
- Rua: 15.600 quadros; solas no piso e deriva máxima de apoio de 0,038 mm por
  quadro. Visita: caminhada, subida, sentar, levantar e descida, incluindo
  contato dos membros com escadas/arquitetura e descarte de recursos.
  Transporte final: 55.457 quadros, 5.032 apoios dos pés e 346.961 verificações
  dos corpos, incluindo portas, plataformas e passarelas.
- Agrupamento: comparação entre desenho individual e instanciado, incluindo
  mudança de cor e pose. Casos de malhas e mapas diferentes, filhos de malhas,
  visibilidade e descarte preservados.
  No teste de 22 jogadores, chamadas de desenho passaram de 837 para 20;
  diferença acima de três níveis em quatro pixels de 262.144. Não é medição
  de FPS de um aparelho, mas comparação visual dos dois métodos de render.
- Cabelo: auditoria com 61.610 raios laterais e 3.989 amostras superiores, sem
  furos nem pele atravessando a cobertura nas duas resoluções de modelagem.
- Capturas e relatórios: `test-results/humanos-20261016/`. As prévias de
  rua usam o bairro real. A revisão das arquibancadas usa um recorte com
  arquitetura, assentos e corpos reais, sem gerar o bairro inteiro.
  Foram dez capturas finais em 1200 px/DPR 1 e 390 px/DPR 2, com 587
  torcedores no recorte. Nenhum erro de shader ou transformação inválida;
  caminhada, escada, assento, cor e identidade conferidos.
- Futebol final: seis capturas próximas de poses reais e doze capturas com
  os 22 atletas, várzea/estádio completo e larguras 1200/390 px. Conferidos
  condução, chute, escala, apoio, cores e bola de 22 cm, sem erros de navegador.
  Registros em `futebol/visual.json`; os testes específicos de motor e
  condução também passaram depois da correção das luvas.
- `npm run build`: PASS. `git diff --check`: PASS. Os avisos de organização
  de imports/chunks do projeto não impediram a geração do build.

## Limites e publicação

O acabamento é 3D estilizado; não é fotorealismo nem reprodução volumétrica
da arte do criador do presidente. Capturas no Chromium com renderização por
software e celular emulado não medem FPS de um telefone físico.

Esta mudança não declara concluído o motor de futebol: permanecem as
pendências de faltas, impedimentos, disputas aéreas e física completa já
documentadas. Não há migração, alteração de saves, concessão de compras ou
mudança no acesso privado. Branch local preservada:
`fix/presidencia-revisao-motor-20261015`. Sem commit, push ou novo deploy.

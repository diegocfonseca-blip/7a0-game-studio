# Mapa sem faixas e revisão de zoom — 12/10/2026

Continuação local sobre a versão publicada 205f27a1 e o lote de torcida/acessos.
Nenhum push/deploy deste incremento.

## Correções implementadas

Os prints de Diego mostram o mapa em 43–45%, encaixado por inteiro numa
janela vertical, sobrando fundo verde em cima e embaixo. O zoom mínimo agora
cobre a área inteira. O usuário continua arrastando para alcançar as partes
laterais. O botão chama-se ENQUADRAR, pois não promete mostrar todo o mundo
simultaneamente numa tela com outra proporção. O fundo verde foi removido.

O tamanho do mundo agora acompanha o zoom no layout (largura e altura),
mantendo a proporção 3:2. A transformação CSS só desloca o mapa, sem ampliar
uma superfície já rasterizada. Recortes de detalhe, pessoas, obstáculos e
campo 3D continuam na mesma planta. Não se esticou a arte nem se alteraram
compras, posições de estabelecimentos, escala relativa ou saves.

## Limites: pedido ainda não concluído

A correção acima não é uma ampliação geográfica do mapa. O entorno adicional
precisa ser produzido e registrado sem quebrar as ruas ou esconder bens.
Foi gerado um estudo em
`/workspace/generated_images/exec-2e50f776-645b-4b2e-8f49-3b474000387b.png`.
Ele alterou o tamanho e a posição do núcleo mais do que o solicitado: não foi
integrado. O original e todos os arquivos anteriores foram preservados.

Um segundo estudo vertical, 1024×1536, foi produzido em
`/workspace/generated_images/exec-5261db42-13b1-4518-a91b-574145bbe06c.png`.
Ele acrescentou bairros, mas também alterou a escala vertical do núcleo:
suas ruas não se encaixam na planta preservada. Tampouco foi integrado.
A revisão do hotel aguardou todas as imagens de detalhe carregarem;
o desfoque da fachada intermediária também existe no arquivo
`lower-512-512.webp`, portanto não é apenas atraso no carregamento.

Também não declarar resolução de zoom resolvida: etapas intermediárias têm
fontes 1536×1024 e a final 3072×2048; desenhos maiores não criam detalhe novo.
A próxima entrega de arte precisa acrescentar detalhe real por região e etapa,
na mesma câmera/planta. Não substituir isso por nitidez artificial, imagem
repetida, preenchimento verde ou reduzir o mapa a uma janela pequena.

## Verificação

`testa-presidencia-mapa-sem-margens.cjs`: cobre enquadramento, afastar,
aproximar e rotação/redimensionamento em 320, 390, 844 e 1440 px, quatro
etapas; nenhum fundo exposto, recortes carregados e mundo sem scale CSS.
`testa-presidencia-redimensionamento.mjs`: posição preservada e limites.
Captura: `test-results/mapa-sem-margens/varzea-390.png`.
Continuação dos acessos/torcida em `presidencia-publico-continuacao.md`.

Compilação final `npm run build`: aprovada. Teste de rotação do mapa/campo
3D aprovado: foco preservado entre retrato, paisagem e desktop, bola pausada
sem deslocamento e enquadramento sem margens. Log local:
`/tmp/mapa-rotacao-final.log`. `git diff --check` limpo.

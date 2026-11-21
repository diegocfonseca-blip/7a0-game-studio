# Fluidez da partida 3D — auditoria de 21/11/2026

Diego relatou travamentos persistentes no Samsung S25. Autorizou revisar cidade,
NPCs e jogadores, inclusive substituir trabalho desnecessário. Rodada preparada
no branch `fix/fluidez-3d-profunda-20261121`. Em 21/11, após os resultados locais,
Diego autorizou publicar para testar no próprio S25. A validação física permanece
pendente; conferir conclusão da publicação no GitHub Actions.

## Diagnóstico confirmado

A melhoria anterior de CPU não demonstrava fluidez da imagem. Nesta auditoria
foram medidos quadros efetivamente desenhados, além de tempo de JavaScript,
chamadas de desenho, geometria e comportamento da partida.

- `visible=false` não retira filhos da atualização global de matrizes no Three.
  Além do entorno, permaneciam na árvore casas, comércio, moradores, jogadores
  da chegada, funcionários de fora e objetos da Presidência.
- Atualizações visuais da cidade continuavam a cada 500 ms durante o jogo;
  várias rotinas de chegada/circulação ainda eram chamadas a cada quadro.
- A terra fazia dezenas de operações de ruído/seno para cada pixel de cada
  quadro. É um desenho estático e pode ser pré-calculado.
- A torcida usava geometria de proximidade na transmissão onde pessoas ocupam
  poucos pixels. O detalhe próximo continua necessário ao sentar na arquibancada.
- O modelo leve do jogador contém 33.469 vértices, mas só 10.508 são referenciados
  pelos 7.971 triângulos. Os demais ainda entravam em preparação/cálculo de limites.
- Materiais fisicamente completos estavam sendo usados também nas superfícies
  foscas do campo, da torcida, dos jogadores leves e do concreto/cadeiras do estádio.
- A iluminação noturna atualizava matrizes da cena inteira novamente para
  localizar luminárias. Emissões eram reaplicadas sem mudança de período.
- A cobertura recebia opacidade zero na câmera do campo, mas continuava sendo
  desenhada. No celular, que já não desenha a sombra extra da cobertura, agora
  o passe também é suspenso. A cobertura volta ao mapa; no desktop com sombras
  o comportamento de sombra anterior é preservado.
- O buffer de profundidade logarítmico escreve `gl_FragDepth`, prejudicando
  otimizações de descarte de pixels em GPUs móveis; a câmera da partida não
  precisa da mesma configuração da vista distante da cidade.

## Trabalho implementado

| Sistema | Durante a partida | Fora da partida / passeio |
| --- | --- | --- |
| Cidade, Casa Luca, imóveis, comércio, feira, moradores e trânsito | Mesmos objetos retidos fora da árvore de desenho; rotinas visuais suspensas | Restaurados com suas referências, rotas e estado; relógio absoluto conservado |
| Chegada das equipes | Atualização visual limitada; delegação entra na árvore ao intervalo e saída | Cadência normal, sem mudar escalação ou ordem dos acessos |
| Campo, atletas, árbitros, técnicos e bancos | Permanecem ativos | Mesmo motor e mesmos objetos |
| Torcida | Detalhe pela distância de transmissão | Detalhe próximo volta ao passear; mesmos ocupantes, cadeiras e cores |
| Placas de patrocinadores e efeitos de lance | Mantidos | Mantidos |
| Luzes | Refletores comprados do estádio, sem luzes locais da cidade; matrizes apenas nas âncoras necessárias | Luzes locais e emissivos voltam ao contexto do bairro |
| Solo | Três níveis pré-calculados do shader original | Mesmos níveis; granularidade reaparece ao chegar perto |
| Jogador leve | Retirada apenas de vértices sem triângulo; ossos, índices visíveis, pesos e animações conservados | Mesma preparação e modelo |
| Superfícies foscas do campo, arquibancada e bonecos no modo leve/móvel | Material difuso, preservando textura, uniforme, pele, emissivos e recortes | Metais e superfícies brilhantes conservam material físico |
| Profundidade | Buffer normal e plano próximo ajustado à distância | Plano próximo ajustado também ao voltar à vista da cidade; passeio usa 8 cm |
| Leve | Sem antisserrilhamento MSAA adicional | Mesma configuração durante a sessão; Padrão/Alta mantêm suas escolhas |

O foco da partida já existia; não foi criada nova restrição de gameplay.
Não houve mudança de motor, resultado, placar, economia, saves, rede, Supabase,
identidade, hospedagem ou autoridade das salas online.

Os três WebP técnicos somam 91.888 bytes (o maior tem 50.514 bytes), baixados
uma vez e reutilizados ao aproximar a câmera; não são imagens recalculadas
em transferidas durante os lances. O solo usa a mesma arte procedimental.

## Bancada e limites

Chromium com SwiftShader (GPU por software), janela móvel 412×915, toque,
DPR 2,625 e Leve. Não é um Samsung S25 físico. Os números servem para comparar
trabalho gráfico nas mesmas condições; não garantem FPS no aparelho de Diego.

A base do código 3D é `cbcb0e9a`, idêntica em 3D a `fc3aea2a`, ponto de partida
do branch. Carreiras e partidas são sintéticas, com o catálogo real, sem login
nem leitura/escrita de saves de usuários. Requisições externas foram bloqueadas.
O estádio completo é construído na mesma carreira do Brasiliense para manter a
mesma partida e adversário; não é uma comparação de adversários diferentes.

As primeiras medições de CPU com desenho desligado, e `render()+gl.finish()`,
não são FPS completos. `gl.readPixels()` confirmou o custo de conclusão da GPU
por software. Isso impediu atribuir aos jogadores/CPU um custo que era gráfico.

### Verificações já concluídas

- Cena focada: NPCs fora da árvore não recebem atualização global de ossos;
  campo, placas, luzes e passeador preservados; carregamentos tardios e 20 ciclos
  de retorno não duplicam objetos; descarte restaura referências antes de limpar.
- Modelo GLB real: todos os atributos de cada vértice indexado conferidos antes
  e depois (posição, normal, UV, juntas e pesos), triângulos idênticos; 78 ossos
  e duas animações nativas conservados.
- Torcida: 4.392 ocupantes na bancada, mesmas cadeiras/cores e reserva de assento;
  510.272 → 52.704 triângulos no controlador (89,7% menos), sem reconstruir instâncias.
- Iluminação: compra dos refletores, estádio aberto/fechado, suporte do piso,
  restauração de dia, limite de luzes e descarte conferidos.
- Qualidade: retina, rotação, 4K, pouca memória, limites da GPU e recursos comuns.
- Solo: textura válida durante download, três camadas carregadas, callbacks
  atrasados não acordam mapa descartado; cada alocação de textura liberada uma vez. A alocação de um pixel é substituída ao chegar a imagem definitiva.
- Pré-cálculo isolado do solo: diferença RGB média 0,32/255 na TV, 2,00 de perto
  e 1,01 atrás do gol, mantendo iluminação física original. No material difuso,
  1,94 / 4,16 / 2,62, respectivamente. Não significa imagem inteira idêntica.
- `npm run build` passou. Avisos de tamanho de chunks/imports mistos já existentes.

O teste antigo `testa-presidencia-complexo-torcida-sentada.mjs` também falha na
base, por comparar apenas assentos detalhados da inspeção com todos os lotes
(incluindo pessoas distantes). A nova verificação compara os IDs e cores dos
lotes realmente desenhados, sem esconder a falha histórica.

### Validação visual e desempenho final

| Cenário, mesma partida em janela móvel | Antes | Depois | Relação |
| --- | ---: | ---: | ---: |
| Terra, estádio inicial, Brasiliense × Gama | 8,32 FPS | 26,67 FPS | 3,21× |
| Estádio completo, Brasiliense × Gama | 2,78 FPS | 5,20 FPS | 1,87× |

Janelas de 20 segundos com renderização WebGL ativa, mesma resolução efetiva e
mesmo nível Leve; 22 atores e avanço do relógio confirmados, sem erros JS ou de
compilação dos programas WebGL. Contagens por quadro variam com câmera, posse
e jogadores visíveis; não são uma comparação geométrica exata entre instantes.
A atualização visual da cidade permaneceu parada durante toda a janela medida.

O estádio completo continua sendo o caso mais caro na GPU por software. O ganho
local não comprova 30 ou 60 FPS no S25: falta a validação no aparelho físico.
Também não se trata de uma redução equivalente de tráfego ou mensagens de rede.

A partida completa chegou a 90 minutos com os mesmos 22 jogadores e o placar
0–0 do motor original. Assistir sentado, sair do passeio, câmera de volta,
coletiva e retorno à cidade no dia seguinte foram conferidos. Há um canvas 2D
auxiliar da interface e um único canvas WebGL do mapa, sem segundo mapa oculto.
A checagem noturna confirmou quatro refletores comprados, sem luzes locais da
cidade na partida; cidade, Casa Luca e luzes locais voltam à vista externa.
Cobertura suspensa no passe de cor móvel e restaurada na vista externa; painel
aberto pausa o desenho, e desmontar o mapa libera seu canvas.

Uma revisão visual encontrou e corrigiu um defeito de carga fria: a textura
provisória 1×1 era enviada à GPU antes do download. WebGL2 reserva tamanho
imutável, e a imagem maior não cabia nessa reserva (`INVALID_VALUE`). Corrigido
realocando a textura ao concluir a carga, inclusive no gramado. Os números com
chão liso foram descartados; as medições finais usam a textura correta. A
comparação isolada agora desenha o provisório primeiro e exige `gl.getError()=0`.
Os três ângulos passaram, tanto no material físico quanto no difuso leve.

Uma tentativa da bancada foi reiniciada pela atualização automática do servidor
de desenvolvimento, e outra tentou clicar na Central antes de abrir a coletiva.
Foram corrigidas a configuração HMR da bancada e a espera do roteiro; a
regressão completa passou depois. Não eram falhas novas do jogo publicado.

## Reprodução

1. Instalar dependências e abrir Vite local. Desligar HMR na bancada evita que
   alterações em scripts reiniciem uma partida medida.
2. `PERF_ORIGIN=http://127.0.0.1:4251 PERF_ROUND=8 PERF_CASE=d node scripts/perfil-partida-celular.mjs`.
   `PERF_FULL=1` constrói o estádio completo; `PERF_WALK=1 PERF_COMPLETE=1` valida
   assento, retorno da câmera, apito, placar do motor original e cidade de volta.
3. `node scripts/testa-partida-noite-cidade.mjs` usa o snapshot sintético em
   `PERF_OUTPUT/fixture-d.json` para testar iluminação e restauração da cidade.
4. `node scripts/gera-solo-textura-3d.mjs --webp` recalcula os três WebP a partir
   do shader original (Vite ativo; geração offline requer Python/Pillow).
5. No Node 24, as verificações puras usam `node --import ./scripts/loader-testes-3d.mjs scripts/testa-partida-cena-focada.mts` (mesmo carregador para `testa-material-difuso-leve.mts`, `testa-solo-precalculado.mts` e `testa-torcida-vista-partida.mts`). O teste do GLB roda com `node scripts/testa-jogador-vertices-usados.mjs`.
6. `node scripts/compara-solo-textura-3d.mjs` compara o solo; `SOIL_DIFFUSE=1`
   inclui a iluminação difusa da versão leve.

Artefatos desta execução: `/workspace/shared/fluidez-3d-profunda-20261121/`.

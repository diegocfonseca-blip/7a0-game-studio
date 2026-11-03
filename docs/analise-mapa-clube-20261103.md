# Análise a fundo — aba Clube / mapa 3D (conta do Diego) — 03/11

Só leitura. Nada foi mexido. Pedido do Diego: analisar setores, lugares que viraram aba, estádio, motor, patrocinadores,
NPCs, imóveis, ruas, lentidão, câmeras, placar/Manual no mapa e a logística aba Jogos × mapa.

## Quem vê
Só a conta do Diego (`presidente-acesso.ts:7-9`, conferido no servidor). Pra ele a aba Clube vira UM botão "🗺️ Mapa" e o 3D
toma o lugar do StadiumSvg (`estadio.tsx`, prop `presidencyView`). Todo o resto do público vê as sub-abas antigas.

## Lugares do mapa (clube-mapa-destinos.ts)
- Minha casa → casa, evolução, garagem, troféus, móveis, personagem + sub-aba Finanças (era Presidência + Finanças)
- Agência do clube → Agência/Agenciados + "Patrocínios e contratos" (era Agência + Patrocínio)
- Loja do Clube → LojaTab (só existe se a obra da loja estiver pronta)
- Vadico Veículos → compra/venda de carros
- Arena Legends → consulta das salas abertas (sem entrar)
- Estádio/arquibancada/camarote/área técnica → só câmera; embaixo continua o StadiumTab (setores, obras, SAF)
- Patrocinadores (dSouza, Tidex, OittoLabs, GECG), botecos, hotel, praça, estação → só câmera, não abrem nada

## PROBLEMAS — GRAVES
1. **Intervalo e pênalti somem no mapa** — HalftimeBanner/PenaltyBanner moram dentro da div que fica `display:none` quando a
   aba é o mapa (pyramidseason.tsx ~11232 / 11664 / 11676). Aos 45' o jogo para, o pênalti abre invisível, o Automático trava
   e a pessoa fica presa sem aviso.
2. **Fim da semana no mapa = beco sem saída** — "Ir pro jogo" some quando o calendário acaba (:10630), a barra do calendário
   só tem botão na Central (calendario-ui.tsx:88) e "▶ Começar o jogo" só existe na aba Jogos (:11789).
3. **HUD do mapa diz "o próximo jogo começa sozinho"** (presidencia-mapa-hud.tsx:35) — falso e contra a regra do calendário.
4. **Lentidão: o mapa desenha sem parar** (20–30 quadros/s) sempre que há morador, mesmo parado e sem jogo
   (presidencia-complexo-3d.tsx ~638-645) → celular esquenta e fica lento.
5. **Sala do presidente monta um 2º mapa inteiro por cima** e o de baixo continua desenhando (presidencia-sala-montagem.tsx:52).
6. Cena pesada: ~0,8–1,2 milhão de triângulos, ~556 chamadas de desenho, 300+ bonecos animados individuais; no celular ainda
   liga `logarithmicDepthBuffer` + `antialias` (complexo-3d.tsx:153), que pesam em GPU de celular. Nenhuma medição foi feita
   em celular de verdade (só Chromium/SwiftShader).

## MÉDIOS
- "Rever jogo salvo" ligado passa por cima do jogo ao vivo no mapa (presidencia-estadio-camera.tsx:40,51).
- Jogo de COPA não aparece no mapa (stadiumMatch undefined); substituição/tática não existem no HUD do mapa.
- Botão "🏟️ Ver o jogo no Campo 3D" mostra o campinho 2D desenhado no gramado (matchPresentation="2d" fixo); as câmeras 3D
  (transmissão, lateral, atrás do gol…) ficaram inalcançáveis — o nome do botão engana.
- Cidade inteira é refeita ao voltar pra aba ou mudar o save (complexo-3d.tsx:721); troca câmera livre↔automática
  recompila shaders (engasgo, :428); sombra refeita todo quadro no PC durante jogo.
- Câmera livre e "Acompanhar torcida" atravessam prédio/escada (sem colisão).
- Textos do mapa sem inglês (clube-mapa-painel, residencia-clube, arena-consulta, lista de lugares).
- Juntas no mesmo lugar contra "uma coisa só em cada aba": casa pessoal + Finanças do clube; Agência + Patrocínios;
  garagem repetida (Casa e Vadico).
- Sem a obra da loja, o lugar Loja não aparece e some a explicação do que falta.
- "Vista do camarote" provavelmente mostra camarote vazio (interior só montado no modo escritório).
- Painel reabre sozinho ao voltar pra aba Clube (clubeSub guardado).
- `officialSafe` compara o resultado guardado com ele mesmo (não prova nada).

## LEVES
- Lista de lugares: botecos/transporte embaixo do título "Patrocinadores".
- Patrocinadores (440–510 m) e Arena (~386 m) sem pedestre (moradores só até 280 m).
- Patrocinadores do mapa são fixos, não mudam com o Master da carreira.
- Ritmo 2×/4× do HUD liberado sem plano (presidencia-velocidade.tsx:3,13-14) — conferir.
- Lotação/torcida do mapa é enfeite (não sai da bilheteria).
- Bola pode entrar ~1' antes do placar mudar (campo2d-relogio.ts:13).
- Código morto: PresidenciaPrivate, bairro 3D só na página de teste; "Evolução da casa" e "Decoração" sem compra ainda.

## O que está BOM
- O jogo no estádio do mapa é o MESMO motor que decide o placar (não é teatro), com trava que desliga o campo se não bater.
- Uma fonte só: sair do mapa pra aba Jogos não para nem duplica o jogo.
- Nenhum redirecionamento automático pra Central/Jogos; nada começa sozinho de verdade.
- Ao sair, o mapa libera a memória; com a aba escondida o laço para.

# 🛡️ Carreira com CLUBES REAIS — planejamento (15/11)

> Pedido do Diego (15/11): *"dois novos modos: Brasil com 4 divisões, Série A e B com 20, C com 28 e Série D com fase de
> grupos reais com 96 times. Sem Várzea… o campo da Série D seria o mesmo da Várzea… clubes reais com divisões reais…
> estaduais pra cada time real do usuário… Libertadores, Sul-Americana, Copa do Brasil real e Mundial, tudo real com base
> na colocação"*. Só pra quem tem PLANO (decisão do mesmo dia); a carreira de time criado vira a porta de entrada grátis.
> Status: **só planejamento, nada construído.** Mockup antes de codar.

## 1. O que o modo é, em uma frase
O usuário escolhe um **clube real** (Flamengo, Bangu, Santa Cruz…), começa na **divisão real dele**, joga o **estadual
real** do clube no começo do ano, depois a **Série real**, a **Copa do Brasil**, e pela colocação vai pra
**Libertadores / Sul-Americana** e **Mundial**.

## 2. A pirâmide (Brasil)
| Divisão | Clubes | Formato | Campo |
|---|---|---|---|
| Série A | 20 | pontos corridos, ida e volta | normal |
| Série B | 20 | pontos corridos, ida e volta | normal |
| Série C | 28 | ⚠️ conferir o formato oficial (CBF) antes de codar | normal |
| Série D | 96 | fase de grupos real + mata-mata | **o de terra da Várzea** |
| ~~Várzea~~ | — | não existe neste modo | — |

Total: **164 clubes reais**. Sobe/desce pela regra real de cada série (a confirmar com o regulamento CBF do ano).

## 3. O calendário de cada temporada (igual ao real)
1. 🏟️ **Estadual** do estado do clube do usuário (Carioca, Paulista, Mineiro, Gaúcho, Pernambucano…), formato real de cada
   um. Os outros estaduais rodam por baixo, sem tela (só o campeão aparece no jornal).
2. 🏆 **Série** do clube + 🇧🇷 **Copa do Brasil** (mata-mata real, com os clubes classificados pelos estaduais/ranking).
3. 🌎 **Libertadores** (G6 da Série A + campeão da Copa do Brasil) e **Sul-Americana** (7º–12º), formato real de grupos.
4. 🌐 **Mundial** pro campeão da Libertadores.
O roteiro de fim de temporada (jornal · caixa · Copa do Mundo · decisão) continua obrigatório, como na carreira de hoje.

## 4. Elenco de cada clube
- **Clube com mais de 22 cartas** (ex.: Flamengo 85): no começo da carreira, **sorteio de 22** entre as cartas do clube.
  As que sobraram vão pro **leilão de sempre** da carreira.
- **Clube com 11 a 21 cartas**: começa com o que tem.
- **Clube sem cartas suficientes**: precisa de **pelo menos 11** cadastradas (inclusive os da Série D). É o maior trabalho.

## 5. Cartas novas (o grosso do trabalho)
Hoje o baralho Brasil tem **775 cartas de 51 clubes**: só **12 clubes têm 22+** e **35 têm menos de 11**. Pra 164 clubes com
pelo menos 11 cada, faltam por volta de **1.300+ cartas novas** e ~**110 clubes novos**.
Regras pras cartas novas:
- **Famoso de cada clube** (bom ou ruim, "lendário" no sentido de conhecido); se não achar, **jogador atual do elenco real**.
- **Uma pessoa só uma vez no baralho Brasil** (Rivaldo no Santa Cruz OU no Palmeiras, nunca nos dois). Única exceção já
  existente: K9.
- **Nada inventado**: carta só de jogador que existe/existiu de verdade naquele clube e ano (regra "não inventar pessoa").
- Força pela **régua de 02/11** (Lenda 90–97 … Profissional 55–66), auge daquela carta.
- 🚫 **As cartas novas NÃO entram no leilão das salas online** (marca própria na carta, ex.: `soOficial: true`).
  ⚠️ Decidir: entram na Partida Rápida / carreira de time criado? (Sugestão: não — ficam só neste modo.)

## 6. Escudos
Já temos **152 escudos** em `public/escudos-clubes/` (muitos estrangeiros). Faltam os brasileiros das Séries B/C/D
(~110). Arte: `.webp` leve (regra de peso dos batismos). ⚠️ Escudo é marca do clube — risco jurídico aceito pelo Diego?

## 7. Ordem de construção (por fases, cada uma vai ao ar sozinha)
1. **Fase 1 — Série A + B reais** (40 clubes), Copa do Brasil, Libertadores/Sul-Americana/Mundial pela colocação, sorteio
   dos 22, só com plano. Precisa completar ~25 clubes com cartas e escudos.
2. **Fase 2 — Série C (28) e Série D (96 em grupos, campo de terra).** O grosso das cartas novas.
3. **Fase 3 — Estaduais** (27 estados; começar pelos grandes: RJ, SP, MG, RS, PE, BA…).
4. **Fase 4 — atualização anual** das divisões reais (quem subiu/caiu no mundo real).

## 7b. Decisões e números de 15/11 (2ª conversa)
- Diego: começa pelo **Brasil Oficial**; Europa Oficial vem depois. As cartas novas ficam **SÓ neste modo** (nem Partida
  Rápida, nem online, nem carreira de time criado). Começar pela fase que eu achar certa → **Fase 1: Série A + B**.
- Clubes 2026 (conferidos na imprensa/Wikipedia): **Série A** Athletico-PR, Atlético-MG, Bahia, Botafogo, Bragantino,
  Chapecoense, Corinthians, Coritiba, Cruzeiro, Flamengo, Fluminense, Grêmio, Internacional, Mirassol, Palmeiras, Remo,
  Santos, São Paulo, Vasco, Vitória · **Série B** América-MG, Athletic, Atlético-GO, Avaí, Botafogo-SP, Ceará, CRB,
  Criciúma, Cuiabá, Fortaleza, Goiás, Juventude, Londrina, Náutico, Novorizontino, Operário-PR, Ponte Preta, São Bernardo,
  Sport, Vila Nova.
- ⚠️ **Série C real: 20 clubes em 2026, 24 em 2027 e 28 só a partir de 2028** (dois grupos de 14). Série D: 96 em 2026. Diego
  pediu C com 28 — perguntar se usa o formato de 2028 já.
- Falta pra Fase 1 (mínimo de 11 cartas por clube): **Série A = 37 cartas** (Bragantino 7, Chapecoense 4, Coritiba 5,
  Mirassol 11, Remo 10) + escudos de Mirassol e Remo · **Série B = 181 cartas** (13 clubes com zero) + 7 escudos (Athletic,
  Atlético-GO, Botafogo-SP, Cuiabá, Novorizontino, Operário-PR, São Bernardo, Vila Nova).
- Mockup da escolha: `scripts/mockups/carreira-brasil-oficial.png`.

- 15/11: **xarás podem entrar** (*"sim podem entrar nome igual qd não é a mesma pessoa"*): nome limpo, quem separa é clube+ano.
  A regra "uma pessoa só uma vez no baralho Brasil" continua valendo pra MESMA pessoa.

- 15/11: Diego pediu **pesquisa a fundo** (*"quero que pesquise a fundo"*). A sessão está sem acesso a pt.wikipedia.org,
  www.ogol.com.br, ge.globo.com e www.transfermarkt.com.br (proxy recusa): as listas em `docs/brasil-oficial/` foram feitas
  só com resumos de busca → são RASCUNHO. Antes de qualquer carta entrar no jogo, refazer a conferência com esses sites
  liberados (Diego libera no ambiente "7a0-game-studio (com Brasileirinho)" e abre sessão nova).

## 8. Perguntas abertas pro Diego
1. "**Dois** novos modos": o segundo é qual? (Europa com ligas reais?)
2. Série C com 28 e D com 96: é o formato de 2026/2027 da CBF? Conferir antes de codar.
3. Qual plano libera (sugestão: todos, desde o ⭐ Craque Salas)?
4. As cartas novas entram na Partida Rápida e na carreira de time criado, ou só neste modo?
5. Começa pela Fase 1 (A + B)?

## 9. Onde o modo encaixa no código (estudo de 15/11 — nada mexido ainda)
Regra de construção: **a carreira de time criado não muda nada**. Tudo novo fica atrás de uma marca no save
(`s.oficial = { clube, desde }`) e de um gate só na conta do Diego até ele testar (`BRASIL_OFICIAL_*` em `sport.ts`).
1. **Começo** — `START_CAREER_SOLO` (store.tsx ~8986): com `action.oficial`, o time do usuário = o clube real (nome = chave
   do escudo), SEM leilão de estreia: o elenco vem de `sorteiaElenco` (brasil-oficial.ts). Colocação = divisão real de
   cada clube (`CLUBES_BR`), sem Várzea; escada de categorias desligada; sem escolher rivais.
2. **Elenco dos outros clubes** — `seedCpuSquads` (pyramidseason.tsx ~560) via `SEED_CPU_SQUADS`: com `s.oficial`, cada
   clube real recebe o PRÓPRIO sorteio (mesma semente da carreira). As cartas que sobraram de cada clube formam o baralho
   dos leilões de sempre.
3. **Cartas novas** — num arquivo próprio (ex.: `data-oficial.ts`), somadas ao baralho SÓ quando `s.oficial` existe.
   Nunca entram em `CATALOG`/`CATALOG_EU`/`CATALOG_WORLD` (que alimentam Partida Rápida, salas e carreira criada).
4. **Acesso/queda** — `computePromotions` (pyramidseason.tsx ~568) hoje é "4 sobem / 4 caem"; no oficial vale a regra real
   (Série B: 2 diretos + mata-mata do 3º ao 6º).
5. **Copas** — Copa do Brasil (126 clubes, final única), Libertadores/Sul-Americana pela colocação, Supercopa (campeão
   brasileiro × Copa do Brasil), Intercontinental (formato real). Reaproveitar o motor das copas que já existem.
6. **Estadual** — passo novo no começo de cada temporada, antes da Série (Fase 3 do plano).
7. **Visual** — escudo oficial em todo lugar (`escudos-oficiais.ts`), taças reais redesenhadas (`competicoes-visual.tsx`).

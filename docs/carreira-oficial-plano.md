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

- 15/11: **nome da carta = o APELIDO** (como a torcida chama) quando imprensa e Transfermarkt divergem (*"Apelido"*): Douglas
  Pelé, Carlão, Yuri, Jhonathan, Augusto Fassina, Richard Costa… (Série B parte 1). Vale pra todas as cartas do modo.

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

## 10. Estado em 15/11 (fim do dia) — no branch, NÃO publicado
✅ Feito (só aparece pra conta do Diego, `brasilOficialLiberado()` em sport.ts):
- Tela "Que carreira você quer?" + "Escolha seu clube" (A/B, escudos oficiais) → presidente → começa (`brasil-oficial-tela.tsx`).
- `START_CAREER_SOLO` com `oficial`: `iniciaBrasilOficial` (store) — 20 clubes reais da divisão, elencos sorteados (22), sem
  leilão de estreia, a outra divisão (A/B) real no fundo com o sorteio dela (`seedCpuSquadsOficial`, pyramidseason).
- 269 cartas novas conferidas em `data-oficial.ts` (gerado por `scripts/gera-cartas-oficial.py`), entram SÓ com `s.oficial`.
- Trava: `npm run brasil-oficial` (escudos, sorteio, carreira nascendo certa, nada vazando pra carreira criada).
⏭️ Falta (na ordem):
1. Série C real (pesquisa rodando: 20 clubes 2026 + cartas) e Série D (96, grupos) — hoje C/D são as de sempre (provisório).
2. Acesso/queda REAL: Série B = 2 diretos + mata-mata do 3º ao 6º (hoje é o 4 sobem/4 caem de sempre).
3. Copa do Brasil no formato real (126 clubes, final única), Libertadores/Sul-Americana pelas vagas reais, Supercopa, Intercontinental.
4. Estaduais (13) no começo da temporada.
5. Taças reais redesenhadas (pesquisa das fotos rodando) + mockup.
6. Nome do clube real na tela/escudo em todo lugar (conferir no teste do Diego).
⚠️ `npm run carreira-limpa` já falhava antes (kingsBaralho), não é do Brasil Oficial.

## 11. 15/11 (noite) — Série C real + lista mestra + cartas de todos
- ✅ Série C real 2026 no modo (20 clubes, 210 cartas, escudos); escolha do clube tem aba Série C.
- ✅ Lista mestra (`docs/brasil-oficial/clubes-mestra.md`): 225 clubes (Série D 96 em 16 grupos, Copa do Brasil 126, 17 estaduais);
  168 fora de A/B/C. Regra do Diego: TODOS com cartas reais.
- 🔎 13 pesquisas em paralelo, por estado → `docs/brasil-oficial/cartas-d-<grupo>.md` (prompt-base no scratchpad, regras no
  CLAUDE.md). Ao chegarem: conferir, somar no `gera-cartas-oficial.py` (mapa CLUBE + ARQS), escudos no `escudos-oficiais.mjs`
  (acervo JoseArroyave tem quase todos), CLUBES_BR ganha os clubes de D/estaduais.
- ⏭️ Depois: motor das competições (acesso/queda real, Copa do Brasil 126, Libertadores/Sul-Americana, Supercopa,
  Intercontinental, estaduais, Série D em grupos) e o mockup das taças (`docs/brasil-oficial/trofeus-reais.md`).

## 12. 15/11 (noite, 2) — 11 de 13 lotes somados
- ✅ `src/escalacao/brasil-oficial-clubes.ts` (GERADO por `scripts/gera-clubes-oficial.py` da lista mestra): os 225, com grupo da D,
  fase da Copa e estadual. `CLUBES_BR` continua só A/B/C (é dela que a carreira monta a pirâmide); `CLUBES_BR_OUTROS` = os 168
  (div 'D' = Série D, 'E' = só estadual/Copa). Ainda NÃO dá pra escolher clube de D/E (o começo de carreira recusa).
- ✅ `gera-cartas-oficial.py` lê todos os `cartas-d-*.md` (cabeçalho = nome exato na lista mestra): **2.097 cartas**.
- ✅ `baralho-oficial.ts` = cartas do modo + as do baralho REGIONAL dos clubes do modo (CSA, Bangu, Moto Club, ABC… já moram lá;
  os lotes contaram com elas). Mesma carta nas duas → vale a da pesquisa do modo.
- ✅ `npm run brasil-oficial`: 142/168 fecham um 11; os 26 que faltam são dos 2 lotes parados no limite de uso (Norte AM/AC/AP e CE/PI).
- ⚠️ **ANTES DE PUBLICAR, 2 coisas:**
  1. **Pessoa repetida**: `docs/brasil-oficial/repetidos.md` — 141 nomes em mais de uma carta sem marca de xará (lotes feitos em
     paralelo não se viam; ex.: Gabriel Morbeck no Serra Branca 2025 e no Brasil de Pelotas 2026). Conferir um por um no
     Transfermarkt: mesma pessoa = fica UMA carta; pessoa diferente = marcar xará.
  2. **Peso**: as cartas do modo estão no arquivo principal do jogo (+124 KB gz pra TODO jogador). Carregar sob demanda (só quem
     abre o Brasil Oficial) antes de soltar pra alguém além do Diego.

## 13. 15/11 (noite, 3) — TODOS os 225 clubes com cartas reais
- ✅ **2.353 cartas** do modo; **168/168** clubes fora de A/B/C fecham um 11 (Norte e CE/PI chegaram). Nenhuma pessoa repetida no
  baralho Brasil (141 nomes conferidos no Transfermarkt; `docs/brasil-oficial/repetidos.md` é o retrato de antes).
- ✅ **302 escudos oficiais** no jogo. Ficam no selo neutro (sem escudo em fonte aberta ou baixado errado): Penedense, Galícia,
  Desportiva Ferroviária, Castanhal, Jaguar, Baré, Desportiva Aracaju, Guarany-SE, Confiança-PB, Capital-TO e Sinop (a Wikipédia
  só tem o Sinop FC antigo). Maranguape, FC Pantanal e Chapada têm escudo na Wikipédia mas o download falhou — tentar de novo.
  Conferir de novo: Primavera-MT ("P" roxo) e Nacional-AM.
- ⏭️ Próximo: escolher clube de D/E na tela; motor das competições (Série D em 16 grupos, acesso/queda real, Copa do Brasil 126,
  Libertadores/Sul-Americana, Supercopa, Intercontinental, estaduais); cartas sob demanda (peso) antes de publicar.
- ✅ **Peso resolvido (15/11, noite)**: as cartas do modo viraram pedaço separado (`baralho-oficial-carga.ts`, ~607 KB cru), baixado
  só por quem abre o Brasil Oficial. Arquivo principal −116 KB gz pra todo mundo. A escolha do clube baixa ao abrir (botão travado
  até chegar) e a carreira oficial salva mostra "Baixando as cartas do Brasil Oficial…" até chegar (com "Tentar de novo").
- 🐛 **Achado e consertado no caminho**: a atualização de ficha dos saves (`sincronizaNiveis`) não conhecia as cartas do modo e
  mandava **95 cartas pro xará do baralho de sempre** (ex.: Ronaldo, goleiro do Atlético-GO 2023, virava o Ronaldo do Cruzeiro 1993).
  Agora save oficial usa a ficha de sempre + a do modo, e sem as cartas baixadas não é tocado. Só a conta do Diego tinha o modo;
  nada publicado. Trava no `npm run brasil-oficial`.
- 🗳️ **Decisão do Diego (15/11): clube SEM divisão nacional (só estadual/Copa — div 'E', ex. Maricá, Galvez, Altos) NÃO pode ser
  escolhido.** Escolha vai de A até D. Os clubes 'E' existem no modo como rivais (estaduais, Copa do Brasil, quem sobe da D).
- 🐛 **15/11 (noite): a pirâmide do modo NÃO tinha os clubes reais de fora da divisão do usuário.** A montagem (`buildPyramid`)
  só criava os clubes "de receita" do jogo — que são clubes de jogadores do site (Crias do Bigão, Nata de SP, Neymarzetti…) —
  então numa carreira com o Remo a Série A era real e B, C e D eram de mentira. Consertado: `buildPyramid(…, oficial)` monta o
  fundo só com os clubes reais das colocações (`oficialFundo`), e a D de fundo virou **20 clubes reais da D sorteados pela
  semente (PROVISÓRIO até a D real de 96)**. Rival com 11 cartas não pega mais 4-4-2 sem ter 4 meias (o Mirassol entrava com 10).
  Trava: `npm run brasil-oficial` agora confere a pirâmide montada (20 por série, todos reais, A/B/C = as de 2026, todos escalam 11).
- ⏭️ **O motor de campeonatos do modo** (a obra grande): o formato real muda o TAMANHO das séries (C: 20 em 2026 → 24 em 2027 →
  28 de 2028; D: 96 em 16 grupos) e o FORMATO (B com playoff 3º–6º; C turno único + quadrangulares + final; D grupos + mata-mata).
  O motor de hoje força 20 times e 38 rodadas em tudo. Caminho (do mapeamento de 15/11): módulo próprio do modo que simula a
  temporada inteira de cada série pelo formato real, e a tela da carreira lê dele quando `state.oficial`.
- ✅ **Motor dos campeonatos reais** (`campeonato-oficial.ts`, trava `npm run campeonato-oficial`), ainda NÃO ligado na tela:
  A (20, 4 caem) · B (2 diretos + playoff 3º×6º/4º×5º sem pênalti, 4 caem) · C 2026/2027 (turno único 20/24 → 2 grupos de 4 com
  pontos zerados → final; 4 sobem, 2 caem) · C 2028+ (2 grupos de 14, 6 caem) · D (16×6 → mata-mata ida e volta, 6 sobem).
  Desempate CBF: pontos → vitórias → saldo → gols → confronto direto (2 empatados) → sorteio. Pesquisa em `formatos-futuros.md`.
  INCERTOS que ficaram com escolha provisória (anotada no código): grupos da 2ª fase da C 2027, final da C 2027 em ida e volta,
  formato da 2ª fase da C 2028 e quem cai (3 por grupo), chaveamento da D, pênalti no playoff da D.
- ✅ **15/11 (noite, 4): o modo já roda as séries no formato REAL** — `simulaTemporadaOficial` (B playoff depois da 38ª, C em
  fases, D com os 96 em grupos + mata-mata, datas espalhadas nas 38 rodadas sem spoiler), **aba Tabelas no formato real**
  (mockup `scripts/mockups/brasil-oficial-tabelas.png` aprovado), **escudo oficial** dos clubes reais dentro da carreira do modo,
  e **acesso/queda pelo regulamento** (`promocoesOficial`). Trava: 3 temporadas seguidas chegam em C 24 (2027) e C 28 (2028), D 96.
  Carreira de sempre idêntica (prova: `npx tsx scripts/foto-simulacao-piramide.mts`, hash 7450e107… desde o batismo Lavras FC de 16/11, que trocou um bot da Várzea).
- ⏭️ **Falta (tarefa seguinte): o usuário JOGAR o formato real da própria série** — playoff da B na tela (hoje é simulado
  sozinho e aparece no quadro), C (turno único → 2ª fase → final) e D (grupos → mata-mata). Até lá começar em C ou D fica
  travado com aviso; A e B abertos. ⚠️ Quem cair da A pra B no fim da temporada 1 cai numa B normal; o playoff dele seria
  simulado sozinho. Quem cair até a C antes disso ficaria numa C sem tela própria — prioridade antes de publicar.
- ✅ **16/11: SÉRIE C NA TELA testada de ponta a ponta no navegador** (Paysandu: 1ª fase → 2ª fase → final, rodada sem jogo
  pula sozinha) e **cabeçalho do modo**: "Brasileirão" no lugar de "Liga Legends", C/D com a fase e o jogo ("1ª fase · jogo 5/19")
  no lugar de "Rodada x/38", contrato de TV sem o texto da várzea. A C continua travada no site; no servidor de teste abre com
  `window.__boTesteC = true`.
- ✅ **16/11: PLAYOFF DA SÉRIE B NA TELA** (`computePlayoffB`): terminou entre o 3º e o 6º, o playoff (3º×6º e 4º×5º, ida na
  casa do pior, empate no agregado = melhor campanha, sem pênalti) entra como página pós-temporada na MESMA esteira da Supercopa
  (placar, Manual, campinho, motor novo no seu jogo) e é ELE que decide o acesso (`oficialEfetivo`); o quadro e o "subiu/ficou"
  só aparecem depois de jogado. Os gols do playoff não entram na artilharia (nem da liga nem da Copa) — anotado como pendente.
- ✅ **16/11 (madrugada): SÉRIE D NA TELA** — dava pra escolher clube da D e a carreira caía na de SEMPRE (leilão de estreia):
  `iniciaBrasilOficial` só aceitava A/B/C. Agora a D começa no modo, com a "turma" de 20 = o seu grupo inteiro + 14 da D sorteados
  pela semente (os outros 76 entram pelo nome). Testado no navegador: grupos → 2ª, 3ª, 4ª fase, quartas, semi, final e playoff de
  acesso, até a decisão da próxima temporada. Temporada da C também até o fim (com a trava da 38ª sem jogo seu consertada).
  C e D continuam travadas no site (abrem só no servidor de teste com `window.__boTesteC`/`__boTesteD`).
- Também falta: Copa do Brasil real (126, com os estaduais), Libertadores/Sul-Americana pelas vagas reais, estaduais.
  Hoje a carreira do modo usa a Copa Legends (top 4 de cada série) porque a Copa do Brasil antiga só fecha com 68–128 clubes.

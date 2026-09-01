# 🚀 Plano de crescimento + identidade (fechado com o Diego 16/08/2026)

> Este doc é a MEMÓRIA da conversa longa de 16/08. Tudo aqui foi **aprovado
> pelo Diego** em mockup. **Nada estava codado quando este doc nasceu** — os
> commits vêm depois, um por item. Se você é outra sessão: leia isto ANTES de
> mexer em cadastro, home, nome de time ou ranking global.

## 📊 Por que tudo isso (os números que motivaram)

Medido no banco em 16/08:

| | Sem carreira | Com carreira |
|---|---|---|
| pessoas | 3.496 | 2.727 |
| dias jogados (média) | 2,1 | **4,8** |
| voltou 4× ou mais | 14,7% | **46,6%** |
| sumiu no 1º dia | **59,8%** | 23,7% |

**Quem abre carreira volta 3× mais e some 2,5× menos. Mas 56% de quem jogou
nunca abriu uma.** O gargalo não é atrair gente — é levar quem chegou até a
carreira.

Contas novas por semana também caindo: 2.384 (20/jul) → 1.992 → 889 → **578**
(10/ago). Dois furos ao mesmo tempo.

---

## 1. 🔑 Cadastro: jogar primeiro, pedir depois

**Problema de hoje:** a carreira bate num cadeado ANTES de começar, e o botão
"Entrar" dispara `GO_LOBBY_ONLINE` — joga a pessoa na tela de salas online.
Depois de logar, **nada a traz de volta** pra carreira.

**Aprovado:**
1. **Fim da partida rápida** → botão *"Quer continuar com esse time?"* → o elenco
   vira carreira (o elenco já está na memória).
2. **A 1ª temporada roda SEM login.** Save no aparelho (já funciona: o
   `savePyramidCloud` sai calado sem usuário; `listAllCareers` lê do aparelho).
   Aviso fixo e discreto no topo: *"carreira só neste aparelho — criar conta"*.
3. **No fim da 1ª temporada**, o convite — mostrando o que a pessoa conquistou
   (posição, acessos, moedas, elenco). Recusou? **Segue jogando**; o convite só
   volta **a cada 3 temporadas**.
4. **Online:** mostrar as SALAS primeiro; o login só aparece quando ela toca em
   entrar numa sala.

**Por que o gatilho é a 1ª temporada e não o título:** medido — **56% das
carreiras nunca ganham título**, e só 11% ganham nas duas primeiras temporadas.
Prender o convite no título deixaria mais da metade das pessoas sem convite.

**Conserto que vale pros dois caminhos:** depois de logar, devolver a pessoa
**onde ela estava** (a carreira dela, ou a sala que clicou). O jogo JÁ sabe
fazer isso — existe no convite de sala (`pendingInvite`: *"Entre ou crie sua
conta — te levo direto pra sala"*). Só nunca foi ligado na carreira.

**Formato:** é uma **JANELA por cima**, não uma tela. Título *"💾 Guardar sua
carreira"* (não "LEILÃO LEGENDS · ONLINE", que assusta quem joga sozinho), com
o nome do clube dela ali.

⚠️ Risco assumido: se limpar o navegador antes de criar conta, a carreira some.
Mitigação: aviso fixo + convite chegando na 1ª temporada (≈20 min de jogo).

---

## 2. 📝 Cadastro novo: um nome só

**Problema:** hoje existem DOIS nomes brigando — o `display_name` da conta
("Nome de técnico", pergunta "Como te chamam?") e o `teamName` de cada save.
Um aparece num ranking, o outro no outro.

**Aprovado — os campos passam a ser:**
1. **Nome do seu time** (com ✓ de nome livre na hora de digitar)
2. **Time de coração** (lista de clubes BR)
3. **E-mail**
4. **Senha**

**O nome da pessoa SAI.** O jogo é sobre clube, não sobre gente.

- A trava de nome único **já existe** (`nomeLivre` → RPC `esc_nome_livre`):
  bloqueia nome de OUTRA conta e reserva nome de batismo pro dono. Só precisa
  rodar **no cadastro** também.
- **Time de coração pinta o manto** do clube (hoje só sócio tem). Precisa de uma
  tabela nova: clubes BR → 2 cores. **Nome de clube real NÃO aparece no jogo,
  só as cores** (regra de sempre).
- **Quem já tem conta não perde nada:** o nome atual vira o nome do time (é o
  que já aparece no ranking hoje). Time de coração fica em branco até escolher.

---

## 3. 🏷️ Nome de time único ENTRE OS SEUS SAVES

**Descoberta:** a trava de hoje olha só o **nome da CONTA** (`display_name`) de
outras contas. **Não olha o nome do time dentro de cada save.** Por isso hoje dá
pra ter dois saves "Neymarzetti" ao mesmo tempo — **462 contas já estão assim**
(de 905 com mais de uma carreira).

**Aprovado (regra do Diego):**
- Criar save novo com nome que já é seu → **banner**: *"Você já tem uma carreira
  chamada X (Série A · T599). Pra usar esse nome aqui, renomeie a outra."*
  Com **botão pra renomear a outra na hora** (permite inverter os dois) e
  **sugestões** (X FC · X EC · X 2).
- Mesmo banner ao renomear na Sala da Presidência.
- **Os 462 repetidos de hoje FICAM como estão** — trava só pra frente. É a mesma
  regra que o Diego já fechou em 10/08 pros nomes de conta ("quem JÁ tem nome
  repetido de antes, mantém").

⚠️ **Isto NÃO conserta o ranking global** (ver §5). O ranking sempre mostrou
**uma linha por conta**, com nome igual ou diferente. São assuntos separados.

---

## 4. ✏️ Renomear o clube durante a carreira

Hoje só dá pra trocar o nome **ao começar um jogo novo**. Aprovado: entra na
**Sala da Presidência**.

**Nada de número se perde** — conferido: `teamKey` de time humano é `m<id>`, o
ASSENTO, não o nome. Títulos, moedas, troféus, colocação, contratos e estádio
ficam presos ao id.

⚠️ **3 coisas seguem o NOME e precisam andar junto no rename:**
1. **Escudo** — `escudoDe(nome)` GERA um escudo a partir do nome quando o clube
   não tem arte. Renomear um clube de batismo **faria a arte paga sumir**.
   → atualizar `esc_socios.escudo_time` junto com o rename.
2. **Carimbo do gol** — mesma coisa, mesma solução.
3. **Selo 🌍 na linha do ranking LOCAL** — `RankingTab` conta Copa do Mundo por
   NOME (`cmTitles[m.campeao]`), porque um BOT também pode ser campeão do mundo
   e bot não tem id (todos são -1). → guardar o **assento** no mural quando o
   campeão for você; o bot continua por nome.
   (A sua ESTANTE e o RANK GLOBAL usam a marca `voce` — **não quebram**.)

---

## 5. 🌍 Ranking global: qual carreira representa você

**O furo:** `esc_pyramid_rank_snap` tem PK `(user_id, season_no)` — **não sabe de
qual carreira é o retrato**. Duas carreiras da mesma conta escrevem no mesmo
lugar. Medido: aconteceu **5 vezes** na história toda (título "diminuindo" de
uma temporada pra outra). É real mas raro.

**Aprovado (ideia do Diego):**
- **Os outros veem UMA linha sua** — a da sua **melhor** carreira. Ninguém nunca
  vê a mesma pessoa duas vezes.
- **Você vê a sua linha grande + uma linha fininha tracejada logo embaixo**, só
  sua: *"🪜 sua carreira de agora: X · Várzea · T3 · 812º"*.
- **Quando a carreira de agora passar a antiga**, ela vira a principal e a linha
  fininha **some sozinha** — não tem mais duas verdades pra mostrar.
- **A comparação é sempre NA TEMPORADA DA TELA** (trava anti-spoiler que já
  existe): as duas na T5, as duas na T7, as duas na T599. Carreira que não
  chegou naquela temporada **não entra**.

**Por que não as outras opções:** "carreira ativa representa" pune quem abre save
novo (perde o rank que suou); "melhor sempre, sem mais nada" deixa o cara em 1º
eternamente mesmo apanhando na Várzea. As duas foram descartadas pelo Diego.

⚠️ **Consequência avisada:** o ranking é sempre *o mundo da temporada em que você
está jogando*. Abrir o rank pela carreira nova (T3) mostra o mundo da T3.
Pra ver o mundo da T599, abrir de dentro daquela carreira. (Diego avisado.)

**Falta implementar:** coluna de carreira (seed) no `esc_pyramid_rank_snap` e as
RPCs escolhendo a melhor carreira por conta.

---

## 6. 🏠 Home enxuta

Hoje são **16 blocos** até o fim da página, e o 1º botão é a **partida rápida** —
o beco sem saída dos dados.

**Aprovado:**
1. **"Continuar carreira" no topo de tudo** (some se não tiver carreira).
2. **Carreira sobe, partida rápida desce** (vira "⚡ só uma partida rápida",
   botão branco menor).
3. **Cada botão diz o que ganha**: *"🪜 Nova carreira — comece na Várzea e suba
   até a Série A"*. No online: **"👥 Jogar com amigos (online)"** —
   ⚠️ **SEM número de gente online** (pedido explícito do Diego).
4. **Álbum · Ranking · Manual · Apoiar viram UMA fileira de ícones** (hoje são 4
   botões grandes empilhados).
5. **A vitrine de cartas desce, mas fica** — é a cara do jogo, só não precisa vir
   antes do botão de jogar.

---

## 7. 🎩 Sala da Presidência (aprovada, sem data)

4ª sub-aba do **Clube**: `🏗️ Estrutura · 💰 Finanças · 🤝 Patrocínio · 🎩 Presidência`.
Abrir o Clube continua caindo na Estrutura — **o desenho do estádio não sai da
frente** (regra do Diego).

Dentro: 🎩 técnico contratado · 🚗 garagem (com selo **EM BREVE**) ·
💰 patrimônio do clube (caixa + estádio + elenco + SAF) · 🎖️ troféus ·
✏️ trocar o nome do clube.

**Técnicos = cartas de gente REAL** (Telê Santana, Felipão, Parreira, Joel
Santana, Filipe Luís, Mourinho, Pep…), cada um com um jeito que muda algo de
verdade. **Contrata na Presidência com moedas, entre temporadas — nada no
leilão** (o pregão não muda em nada).

⚠️ Regra combinada: **o jogador tem que VER o técnico agindo** — uma linha no
jornal a cada vez que o jeito dele valer. Nada de bônus escondido.

**Ponto em aberto do Diego:** leilão de técnico não fecha (todos já têm clube), e
técnico não se troca toda hora. Modelo pensado: só dá pra contratar quem está
**sem clube**, e a lista de livres muda sozinha porque os clubes demitem quem vai
mal. Ainda **não aprovado**.

---

## ⚠️ Lembrete do Diego (16/08): carreira ANTIGA não conta em ranking nenhum

Confirmado no código — carreira sem **Agência 2.0** (`state.agenciaOn`) não grava
em lugar nenhum:

| Onde | Linha | Trava |
|---|---|---|
| Título de liga → `esc_results` | `pyramidseason.tsx:4419` | `if (… \|\| !state.agenciaOn) return` |
| Título de Copa → `esc_results` | `pyramidseason.tsx:4450` | idem |
| Retrato do rank global | `pyramidseason.tsx:4001` | idem |
| Copa do Mundo → `esc_results` | `copa-mundo.tsx` | `if (isYou(c) && agenciaOn)` |

**Consequências que valem pro plano:**
- Carreira antiga **não entra no rank global** e **não cresce mais no rank da
  home** (as linhas que ela já gravou antes da trava existir ficam congeladas).
- A regra da **"melhor carreira"** (§5) só enxerga carreiras com Agência 2.0 —
  carreira antiga não disputa, porque nunca esteve lá.
- ✅ O fluxo novo (§1, jogar 1ª temporada sem login) cria carreira **nova**, então
  entra normalmente. Nada a fazer.
- A carta de campeão **continua saindo pra qualquer carreira** — a trava é só de
  ranking.

---

## 📋 Ordem de trabalho aprovada

1. **Janela de cadastro sem sair do lugar** + formulário novo (nome do time,
   coração, e-mail, senha)
2. **"Continuar com esse time"** no fim da partida rápida
3. **1ª temporada livre** + aviso fixo + convite no fim dela
4. **Home nova**

Depois: nome único entre saves · renomear na Presidência · ranking global ·
Sala da Presidência.

**Um commit por item**, pra dar pra voltar atrás em qualquer um sozinho.


### ✅ Item 3 — FEITO (16/08)
1. **`startCareer` não pede mais login** (`screens.tsx`). Era um cadeado na porta
   exatamente da parte que segura as pessoas. O save já era local (a nuvem é
   backup), então nada precisou mudar embaixo.
2. **`AvisoContaCarreira`** (`pyramidseason.tsx`, no topo da tela da temporada,
   antes do `SocioBaraoBanner`):
   - **sem conta, temporada 1**: faixinha amarela discreta — *"carreira só neste
     aparelho — criar conta"*, clicável;
   - **da temporada 2 em diante**: o convite, mostrando **o que a pessoa já tem**
     (clube, temporada, títulos, moedas, tamanho do elenco). "Agora não" fecha e
     **o jogo segue**;
   - o convite volta **a cada 3 temporadas** (2, 5, 8, 11…), não toda vez;
   - **com conta, não aparece nada.**

Conferido no navegador: clicar em Carreira sem login **entra direto** (nenhum
cadeado). O aviso dentro da carreira não deu pra fotografar sem jogar um pregão
inteiro; confirmado que os textos estão no build e que a montagem está no lugar.

### 🧹 Comentários velhos acertados (16/08)
`sport.ts`, `store.tsx`: vários comentários ainda diziam *"por enquanto só o
Diego testa"* sobre Agência/Escada — desatualizados desde **03/08**, quando o
Diego liberou geral. **Já enganaram esta sessão duas vezes.** Agora dizem o que
o código faz, e deixam explícito o que "geral" NÃO significa:
**carreira ANTIGA não ganhou a Agência e não grava em ranking nenhum** (nem
global, nem da home) — só carreira criada depois de 03/08.

### ✅ Item 4 — FEITO (16/08) — home nova

Tudo em `screens.tsx`, dentro de `EscIntro` (nenhuma regra de jogo tocada — é só
a ordem da página).

| Antes | Agora |
|---|---|
| 4 cartas + legenda + novidades **antes** de qualquer botão | **botões de jogar primeiro**; vitrine e novidades descem |
| 1º botão = `⚡ PARTIDA RÁPIDA (VS CPU)` | 1º botão = **carreira** (roxo, com brilho) |
| `🪜 CARREIRA POR DIVISÕES (new)` | **`🪜 Começar carreira`** — e vira **`Nova carreira`** quando já existe save — com a linha *"Comece na Várzea e suba até a Série A · sem cadastro"* |
| `👥 JOGAR ONLINE (CHAMA OS AMIGOS!)` | **`👥 Jogar com amigos (online)`** + *"Crie a sala, mande o código no zap — até 8 no mesmo pregão"*. ⚠️ **sem contador de gente online** (pedido do Diego) |
| partida rápida em amarelo, no topo | **`⚡ Só uma partida rápida (vs CPU)`**, botão branco, embaixo |
| Álbum e Ranking em botões grandes + Manual e Apoiar soltos lá no fim | **uma fileira de 4 quadradinhos**: 📖 Álbum · 🏆 Ranking · 📘 Manual · 💛 Apoiar (`HomeIconTile`) |

- **"Continuar carreira" já era o 1º bloco da página** (o `{solo && …}` roxo vem
  antes do título) — conferido no navegador com um save de teste; não precisou
  mudar nada.
- O **Manual** e o **Apoiar** são os MESMOS de sempre, só chamados de outro
  lugar: o overlay do manual não mudou, e o `ApoieButton` entrou pelo `trigger`,
  então **a Área do Sócio continua abrindo igualzinho** pra quem é sócio.
- O painel `NewsBanner` (✨ Novidades) desceu pra **depois** dos botões: ele é
  alto e sozinho jogava o "jogar" pra fora da primeira tela.

**Dá pra voltar atrás:** é um commit só, e só de layout — `git revert` devolve a
home antiga sem mexer em save, conta, ranking ou carta de ninguém.

**Ajuste do Diego (16/08, depois de ver a foto):** o **banner roxo de novidades
do topo saiu de vez** — *"tire o banner de novidades superior, só deixe os lá de
baixo mesmo"*. Ele contava a MESMA coisa que o `NewsSection` do rodapé já conta e
era alto demais pra ficar entre a pessoa e o botão de jogar. O componente
`NewsBanner` (e o `NEWS_ITEMS` dele) foi apagado do `screens.tsx`; se um dia
quiser de volta, está no histórico do git.

### 🚫 Correção do Diego (16/08): time de coração NÃO pinta manto

A 1ª versão do cadastro mostrava a listra nas cores do time do coração e dizia
*"o manto do seu clube vai ter essas cores"*. **O Diego cortou:** *"não quero que
coloque cores de manto que isso é dos sócios apenas"*.

**Regra gravada:** **cor de manto é regalia de SÓCIO.** Dar de graça no cadastro
apagaria exatamente o que o sócio paga pra ter — mesma lógica da fidelidade de
tier (gratuito é bege, ouro é ouro, ninguém empresta cor de ninguém).

Feito: saiu a listra e saiu a promessa. A pergunta **fica** (o Diego quis saber
de que time é a torcida), agora com o texto honesto: *"Opcional — é só pra gente
saber de que time é a torcida daqui."* As cores continuam no `coracao.ts`
guardadas, **sem nenhum uso**, até o Diego decidir o contrário.

---

# 📉 REMEDIÇÃO 01/09 — o gargalo MUDOU de lugar

Ele chegou desanimado: *"preciso de networking, N sei mais como entregar o jogo
pra mais pessoas.. Tá foda e MT difícil. Pqp"*. Antes de dar palpite, medi o
banco de novo (a medição de 16/08 está no topo deste doc).

## 1. Não é falta de gente chegando

Contas novas por semana: 2.384 (20/jul) → 1.992 → 889 → 622 → **492** (17/ago)
→ **764** (24/ago). **Parou de cair e voltou a subir.** Entram ~700 pessoas por
semana sozinhas, sem ele fazer nada. O topo do funil NÃO é o problema.

## 2. O buraco é o ONLINE — e ele é gigante

Medido em quem criou conta entre 60 e 7 dias atrás (7.770 pessoas):

| | Só sozinho | Jogou ONLINE com gente |
|---|---|---|
| pessoas | **7.571** | **199** |
| dias jogados (média) | 3,5 | **9,8** |
| voltou 4× ou mais | 28,7% | **83,4%** |
| **sumiu no 1º dia** | **46,8%** | **1,5%** |

Quem joga UMA partida online com gente de verdade praticamente não vai embora
(1,5% contra 46,8% — **31× menos**). Mas são só **199 de 7.770 (2,6%)**.

⚠️ **Isso é correlação, não prova.** Quem chega no online já está mais animado.
Mas o tamanho do buraco (46,8% → 1,5%) é grande demais pra ser só isso — e é a
mesma forma do achado de 16/08 sobre a carreira, em que ele acertou ao agir.

Em 30 dias: **2.984 contas novas**, só **296 (10%)** pisaram numa sala online, e
só **107 (3,6%)** vieram por convite de amigo.

## 3. 🔑 O ACHADO: 79% dos donos sozinhos tinham OUTRO dono sozinho esperando

Salas criadas em 30 dias: **409**. Delas, **258 (63%) morreram com o dono
sozinho dentro** — abriu, esperou, ninguém veio, desistiu.

E aqui está o dinheiro: cruzando as janelas de espera dessas 258 salas,
**204 (79%) tinham pelo menos OUTRA sala sozinha aberta no mesmo momento.**

(Conferido com rigor: a 1ª conta deu 257/258, mas o `updated_at` de sala morta é
mexido depois pela limpeza e inflava a janela — média 71 min contra mediana 12,8
e um caso de 37h. Refeito com a espera **limitada a 15 min**, ainda dá 204/258.
O número honesto é 79%, não 99%.)

**Duas pessoas querendo jogar juntas, no mesmo minuto, sem se ver.** A sala só
aparece na lista enquanto o dono está sentado nela (`isFresh`, pulso de 30s,
some depois de 3 min) — então dois donos esperando em abas diferentes nunca se
encontram, porque cada um está olhando pra própria sala, não pra lista.

## 4. O que isso quer dizer pro "networking"

Trazer MAIS gente pro topo enquanto 90% nunca toca no online é encher balde
furado. O mesmo esforço rende muito mais tapando o buraco: são **204 pessoas por
mês** que QUISERAM jogar com alguém, tentaram, e não conseguiram — a gente já
sabe quem são e já sabe que estavam online na mesma hora.

**Proposta levada a ele (aguardando decisão, nada codado):** quando o dono está
sozinho na sala e existe outra sala sozinha aberta, mostrar *"tem mais alguém
esperando agora"* com um toque pra juntar os dois.

## 5. Buraco de instrumentação

`site_visits` não guarda de ONDE a pessoa veio (não tem referrer). Então hoje é
impossível saber qual canal traz gente. Enquanto isso não existir, qualquer
decisão de divulgação é no escuro.

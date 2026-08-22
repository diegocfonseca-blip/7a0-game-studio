# 📌 Pendências combinadas com o Diego (atualizado 22/08/2026)

## ✅ RESOLVIDO — o aviso "o dono sumiu" subia MENTINDO (sala NOYI87, 22/08)
O Diego mandou print: banner vermelho **"MANDA SEU LANCE DE NOVO — o dono da sala
sumiu do ar e outra pessoa assumiu o comando"**, na revelação 4/4.

**O banco desmentiu o aviso na hora** (`game_rooms` code `NOYI87`): **3 cadeiras,
3 crachás, presence `[1,2,0]` — todo mundo no ar, incluindo o dono
(Gustavinson, `player_index` 0)**. Ninguém perdeu a coroa: a trava
`ELEICAO_AUTOMATICA = false` está fazendo o trabalho dela. O que sobrou foi um
**alarme falso** de um vigia antigo.

**Causa raiz** — `RESTORE_ONLINE` (`store.tsx`, o "▶️ Voltar pra sala"
`lobby.tsx:612` e a entrada normal `lobby.tsx:1298`) zerava `submitted` nas fases
de envelope **pra todo mundo**. Isso existe porque o **dono** perde os envelopes
secretos ao recarregar (eles não são persistidos). Só que o **convidado** não
guarda envelope nenhum — o dele continua lacrado na mão do dono. Resultado: quem
lacrava e depois voltava pra sala se via "deslacrado", e o vigia do envelope
(`lanceReaberto`) concluía "trocou de dono" e cuspia o texto errado.

**Consertos (3, todos pequenos e revertíveis):**
1. `RESTORE_ONLINE` **só zera `submitted` se `action.isHost`**. Se o dono tiver
   mesmo perdido os envelopes, o estado VIVO dele chega em ~1s e deslacra o
   convidado — aí com motivo.
2. O vigia só pode acusar **depois que o primeiro estado vivo do dono chegou**
   (`jaRecebiEstadoRef`) — a foto do banco pode estar atrasada e não vale como
   prova de nada.
3. **Textos corrigidos** (não podem mais falar em "sumiu do ar / outra pessoa
   assumiu", que com a coroa travada não acontece): o aviso do envelope agora diz
   que **o dono atualizou a página** no meio da coleta, e o aviso grande de virar
   host diz que **o dono saiu da partida e passou o comando**.

## ✅ RESOLVIDO — o aviso "o dono caiu" subia SEM PROVA e prendia o convidado (22/08)
Segundo print do Diego na mesma sala NOYI87, agora na temporada: banner vermelho
**"Segura a onda! O dono da sala trocou de tela ou caiu"** às **17:39**.
**O banco desmente de novo:** o dono (Gustavinson) tinha GRAVADO a partida às
**17:38:31** — vivo, jogando. E o Diego relatou o efeito colateral: *"na hora do
monte eu não consegui apertar pra pegar jogador"*, *"na simulação travou"*.

**Causa raiz** — `hostStale` era calculado **só pelo silêncio no Realtime**
(10s sem recado do dono). Silêncio no Realtime não é prova de nada: o canal que
morre pode ser o **do convidado** (4G, celular no bolso, volta do 2º plano), e o
dono continua vivo do outro lado. Pior: o remédio era mandar `request_state`
**por um canal morto** — não chegava em ninguém. Resultado: convidado preso
debaixo de um aviso mentiroso, sem conseguir apertar nada. Repare que o batimento
REAL do dono (`game_rooms.updated_at`, gravado a cada ~3s) já era lido no
código — mas só dentro do bloco da eleição, que está DESLIGADO. Ninguém
consultava a prova.

**Descoberta extra do mesmo print** — a lista de crachás da sala estava
`[tomás, Diego, tomás]`: **o mesmo crachá DUAS vezes**, uma delas sentado na
**cadeira 0, a do dono**, e o crachá do dono **ausente**. Vem de inscrição velha
que não expirou (reconexão / segunda aba). Isso engana a rede de segurança do
crachá (3 crachás para 3 cadeiras "bate", mas são 2 pessoas) e faz o dono
"sumir" da lista sem ter saído.

**Consertos:**
1. **O banner só sobe com prova.** `hostStale` agora exige que a consulta ao banco
   confirme o batimento do dono **seco**. Recado do dono (estado ou `host_ping`)
   derruba a acusação na hora.
2. **Silêncio agora RELIGA o canal** em vez de só reclamar: se o canal do
   convidado não está `joined`, ele reinscreve, pede o estado e reanuncia
   presença — mesmo remédio que já funciona ao voltar pro app. É isto que
   destrava o "não consigo apertar nada".
3. **Uma pessoa = um crachá**: a presença descarta inscrição repetida do mesmo
   crachá.

**Ainda aberto (não é o que travou, mas é real):** o `room_players` do tomás
sumiu da sala enquanto ele seguia jogando — cadeira 1 ficou livre no banco com
gente sentada nela. Investigar quem apaga a vaga (`GO_LOBBY`/`NEW_GAME` →
`leaveOnlineRoom`) sem tirar a pessoa da partida.

## ✅ RESOLVIDO — a raiz de verdade: canal morto não ressuscita (22/08)
O Diego derrubou a minha teoria com um fato: *"mas sempre deu p jogar c o host
trocando de tela no celular"*. **Ele estava certo.** Eu tinha culpado a aba de
fundo do dono (navegador freando o `setInterval` do "tô vivo") e cheguei a
escrever um `ticker.ts` batendo em Web Worker.

**MEDI ANTES DE SUBIR, e a medição me desmentiu** (Chromium, aba no fundo, 8
minutos, contando batida por batida):
```
tempo real: 481s   PÁGINA: 481 batidas (100%)   WORKER: 481 batidas (100%)
último minuto isolado → PÁGINA: 60 · WORKER: 60
```
Nenhuma freada. **O Web Worker foi revertido** — não resolvia nada e só
adicionaria peça nova no caminho crítico das salas.
⚠️ **Pra próxima sessão: não re-tentar essa ideia.** A aba de fundo do dono NÃO é
o problema, está medido.

**A causa real** — não é a linha do DONO que cai, é a de **quem está vendo**.
Quando a conexão do convidado morre (bolso, 4G, trocou de app), o código chamava
`subscribe()` **no mesmo canal já morto**. Canal morto do Supabase **não
ressuscita**: fica ali, calado, parecendo vivo. Daí tudo o que ele relatou —
banner vermelho toda hora, botão que não responde, e **F5 resolvendo** (o próprio
banner tinha o botão "atualiza a página": era a pista na nossa cara).

E isso explica a noite inteira na ordem certa, como ele disse: *"eles só saíram de
sala pq tinha dado erros"* — o pessoal cansou do banner e saiu; só ENTÃO o dono
foi embora e a partida morreu na rodada 9. O dono sumir foi consequência.

**Conserto:** canal morto é **jogado fora** e nasce um novo pelo caminho normal.
- estado `reconexao` entra nas dependências do efeito do canal (sobe o contador →
  desmonta o velho, monta um limpo com presença, pedido de estado e as
  reperguntas de 2s/5s);
- `pedeCanalNovo()` no máximo 1x a cada 5s (não vira loop);
- limpeza agora é `supabase.removeChannel(ch)`, não só `unsubscribe()` — senão o
  canal velho fica no registro com o MESMO nome e o novo briga com o fantasma;
- chamam: o retorno pra tela (`visibilitychange`) e o vigia do convidado.

## ✅ RESOLVIDO — dono saiu de vez e a sala não avisava NEM dava saída (22/08)
Diego, ainda na NOYI87: *"eu acho q tô sozinho na sala. E travado na rodada 9 pq
os dois já saíram… Mas n tive tb nenhum aviso q o host saiu e por isso travou"*.

**Ele estava certo, e o banco confirma:** `updated_at` da sala parada em
**17:38:31**, ou seja **9min30 sem batimento** do dono (Gustavinson). Sumiço real
desta vez — e o jogo não falava nada de útil.

**O buraco:** a faixa vermelha dizia, PARA SEMPRE, *"segura a onda, a partida
espera por ele"*. Isso é verdade nos primeiros segundos e é sacanagem depois de
10 minutos: a pessoa fica olhando uma tela parada sem saber que acabou, e **sem
caminho nenhum pra sair** (o "sair da sala" nem sempre está à mão na tela em que
ela travou). Fere a regra do Diego: toda trava explica O PORQUÊ e O CAMINHO.

**Conserto:** a faixa passou a ter DOIS níveis, medindo o batimento do dono no
banco (`donoForaSeg`):
- **até 1 minuto** → segue o texto de sempre ("segura a onda", ele deve voltar);
- **passou de 1 minuto** → o texto muda e fala a verdade: **"o dono da sala
  saiu — faz X minutos que ele não dá sinal, e a partida parou aqui"**, explica o
  porquê (quem cria a sala comanda do começo ao fim), garante que **a partida
  fica guardada** (se ele voltar, continua deste ponto) e mostra os dois
  caminhos: **🔄 Ele voltou? Atualiza** e **🚪 Sair da sala** (usa o `leaveRoom`,
  que libera a vaga e vira o time em CPU pra quem ficar).

**✅ DECIDIDO 22/08 — NÃO VAI TER botão "eu assumo o comando".** Palavras do Diego:
*"acho q a melhor coisa é deixar pelo host msm e ng assume comando n"*. Antes disso
ele levantou a dúvida certa: *"é um saco ter q dar lance dnovo"*. **Assunto
encerrado — não propor de novo.** Sala sem dono PARA, e isso é o comportamento
desejado; o dever da sala é AVISAR direito e dar o botão de sair (feito acima).

**🔁 SOBROU UMA IDEIA BOA, e ela vale SOZINHA (não foi pedida ainda):** a **cópia
local do lance**. Hoje o envelope só existe na mão do dono; se ele ATUALIZA A
PÁGINA no meio da coleta, todo mundo lança de novo. Mas o aparelho de cada um sabe
o que mandou — se guardasse uma cópia (só do setor+leva atuais), o jogo reenviaria
sozinho pro dono, sem ninguém digitar nada, e o leilão continua às cegas (cada
aparelho só conhece o lance dele). Isso mataria o *"é um saco ter q dar lance
dnovo"* no caso que mais acontece. **Proposto em 22/08, ele respondeu sobre o botão
e não sobre a cópia — perguntar de novo numa próxima, sem insistir.**

## ✅ BATISMO ENTREGUE — Theuzudo FC (21/08)
Dono **matheusfilipealves@hotmail.com** · 👑 ouro + **fundador nº47** · entrou na
**Série B no lugar do Comercial do Norte** (técnico "Nortista" fica).
Mascote: **Theuzinho**, morcego de boné (coração Valência), animação `coVoa`.
Manto: **laranja `#F06000` e preto**, medidos NA ARTE que o dono mandou.
Peso: escudo 293×360 = 29,2 KB · mascote 264×351 = 23,2 KB · **total 52,5 KB**
(teto 75). Nome reservado no banco nas 4 formas.

⚠️ **Dois consertos que EU tive que fazer na arte, e o Diego precisa saber:**
1. O escudinho do peito da camisa vinha com o texto **embolado**
   ("FRIGCINIATE"). Cobri com o escudo GRANDE dele, reduzido — arte do próprio
   dono, nada inventado.
2. Minha limpeza do xadrez **comeu as letras brancas** do escudo (o Diego pegou:
   *"o d e o tá preenchido branco"*). Virou regra no CLAUDE.md: conferir arte
   recortada sobre FUNDO COLORIDO, nunca sobre branco.

❓ **Fica anotado, sem resposta ainda:** o escudo é **vermelho/amarelo**
(Valência) e o manto **laranja/preto**; o Diego falou em **Paraíba** (vermelho e
preto). E **não achei nenhum símbolo da Paraíba** no escudo — só morcego, bola,
alfinete de mapa e listras. Se ele quiser arte nova um dia, é aqui que mexe.

## 👀 A LIGA PASSA A APARECER NA LISTA DE SALAS (22/08)
Diego, testando ao vivo com as duas contas: *"mas o usuário secundário n tá vendo…
o Neymarzetti botou sala aberta e msm se fosse fechada deveria aparecer"*.

**Não era bug — era a regra de 19/08 brigando com a decisão de hoje.** A liga era
tirada de propósito da lista pública (*"ninguém consegue ver a sala se não for
Lenda"*), o que fazia sentido quando **entrar** também era só de Lenda. Como hoje
**entrar é de qualquer um e só CRIAR é do Lenda**, esconder só servia pra ninguém
achar a liga do amigo — a única porta era o código.

**Feito:** a liga entra na lista de Salas Abertas como as outras, marcada com o selo
verde **🏆 LIGA** e uma linha com o **dia marcado** ("📅 SEG, 24/8 · 21:00 · faltam
2 dias"), pra não se confundir com sala rápida. Liga com senha aparece igual, com o
🔒 — palavras dele: *"msm se fosse fechada deveria aparecer"*.
(Precisou levar o `ligaAt` na consulta da lista, que só trazia os campos da sala
rápida.)

## 🧪 LIGA — 2ª conta do Diego pra testar, e a REGRA MUDOU (22/08)
Pedido: *"Permita o usuário diego.c.fonseca2@gmail.com poder ver as coisas do liga
fechada tb como se fosse um usuário normal sem o lenda… vou testar esse usuário c o
diego.c.fonseca@gmail.com q criou uma sala agora. Aí já quero ver como ele vê tb"*.

**Feito:**
- `sport.ts` → `diego.c.fonseca2@gmail.com` entra em **`LIGA_TESTERS`** (enxerga o
  modo). ⚠️ E **NÃO** entra na lista de ouro do `apoio.tsx`, de propósito: assim ela
  é um jogador COMUM e bate na trava de criar — que é o que ele quer ver.

**🔁 REGRA DE ENTRADA MUDOU (decisão dele, hoje):** antes (19/08) só Lenda/dono de
batismo **ENTRAVA** numa liga. Ele reviu: *"vamos supor q só qm pode criar e o
lenda"* + *"qm entra se tiver aberta pode ser qlqr um"*. Agora **qualquer conta
entra** com o código; só **CRIAR** é do Lenda. Interruptor:
`LIGA_SO_LENDA_ENTRA = false` em `lobby.tsx` (voltar = `true`).

**🐛 ACHADO NO CAMINHO:** **criar liga NUNCA esteve travado no Lenda.** O código só
olhava `ligaOn` (quem enxerga o modo), nunca o tier — como enxergar era privilégio
da conta do Diego, ninguém notou; na hora de abrir pra todos, **qualquer um criaria
liga**. Agora tem trava explícita, com o porquê e o caminho ("pra JOGAR numa liga
você não precisa ser Lenda: peça o código pra quem criou").

## 🏆 LIGA FECHADA — criação igual ao mockup + editar/excluir POR FORA (22/08)
Depois do conserto do erro abaixo, o Diego olhou o modo Liga de verdade e cobrou:
*"ainda n tá legal… eu lembro q vc tinha feito um mockup maneiro mas n parece igual
qd se cria a sala"*. Comparei a tela real com
`scripts/mockup-liga-fechada.mjs` (o aprovado em 20/08) e achei DUAS diferenças
reais na criação:
1. O mockup junta as **três** coisas da liga num quadro só — **nome da liga**,
   dia/hora e bots. Na tela real o nome estava lá embaixo, solto, chamado de
   **"Nome da sala"**, como numa sala rápida qualquer.
2. Por isso a Liga *parecia a rápida com um extra*, não um modo.

Ele aprovou (*"Sim"*) e pediu mais: *"qd criar a sala, dps q ele entra ele pode
excluir claramente dentro e fora tb… Editar e etc"*.

**Feito:**
- **Criação**: o quadro da Liga agora tem `🖋️ Nome da liga` no topo, depois
  `📅 Quando vocês jogam` e `🤖 Bots na tabela` — os três juntos, com borda e
  sombra dura. E o campo genérico "Nome da sala" **some** no modo Liga (senão
  perguntaria o nome DUAS vezes — a mesma bronca dos bots). Nome padrão virou
  **"Liga do Fulano"**.
- **Por fora** (card de 🏆 Minhas ligas), só pro DONO: **✏️ Editar** (abre ali
  mesmo nome + dia + hora + bots, sem entrar na sala) e **🗑️ Excluir a liga**.
  Convidado não vê os botões.
- **Por dentro**: já existia e continua (`🗑️ Excluir a liga`, mudar dia/hora,
  regras do ranking). O excluir de dentro e o de fora agora passam pela MESMA
  função (`excluirLigaId`) — uma regra só, com o mesmo aviso do que se perde.
- **Banco**: `liga_patch` ganhou `p_nome` (renomear sem entrar na sala), com teto
  de 24 e recusa de nome vazio. As DUAS assinaturas antigas foram derrubadas de
  propósito: com um parâmetro novo opcional, a chamada antiga ficaria ambígua e o
  PostgREST recusaria. Sobrou uma assinatura só.

⚠️ Tudo isto está atrás de `LIGA_GERAL = false` (só a conta do Diego), então
ninguém mais vê. Abrir pra todos = `LIGA_GERAL = true` em `sport.ts`.

## ❌ ERRO MEU, JÁ CONSERTADO — liguei o desenho RECUSADO da Liga Fechada (22/08)
O Diego pediu: *"Liga fechada pode codar p mim por favor só o eu ver como tá lá"*.
Eu achei um `false` cravado em `lobby.tsx` e liguei — **sem conferir que aquilo era
o desenho velho, que ele já tinha recusado.**

Ele pegou na hora: *"aí cria está estranho pq mostra duas vezes sobre bots ou não ao
criar a sala e qd eu crio tá mt diferente do mockup q vc tinha feito tb"*. Certíssimo,
nos dois pontos:
1. **Duas perguntas de bot na mesma tela** — a seção ② "A partida" aparece também no
   modo Liga, então o "🤖 Bots na tabela" (do modo) e o "🌍 Aberta × 🏆 Liga Fechada"
   (o resto velho) caíam juntos.
2. **Diferente do mockup** — porque o mockup aprovado
   (`scripts/mockup-liga-fechada.mjs`) tem a Liga Fechada como **MODO DE JOGO**, na
   fileira do Rápido/Carreira/Bafo. Palavras dele em 20/08: *"tem q ser rápido, liga
   fechada, carreira e bafo"*. O que eu liguei era a versão "detalhe da sala rápida",
   que é justamente a que ele cortou.

**Conserto:** `LIGA_FECHADA_LIBERADA = false` fixo em `lobby.tsx`, com um comentário
grande explicando que aquilo é desenho RECUSADO e não feature esquecida — pra
nenhuma sessão (nem eu de novo) religar achando que faltava. `useLigaFechadaLiberada`
em `sport.ts` ficou marcada como PARADA e sem uso.

**O que vale de verdade:** o MODO Liga (`roomMode === 'liga'`, trava
`useLigaLiberada`, `LIGA_GERAL = false`, testers = Diego) — esse já está ligado na
conta dele, com data/hora marcada, dono mandando nos troféus e o próprio seletor de
bots. **É esse que ele tem que olhar e é esse que abre pra todos** (`LIGA_GERAL = true`)
quando ele mandar.

## 🎙️ De La Ó (Guilherme) — SÓCIO + LENDA feito (22/08) · batismo NÃO
Ordem do Diego: *"Add esse time aqui delaofut@gmail.com naquele usuário q eu te
falei... apenas como sócio e lenda. Sem batismo de trocar time do jogo por ele"*.

**Feito, e SÓ isto:**
- `apoio.tsx` → `'delaofut@gmail.com': 'ouro'` (👑 Lenda: cor, selo e brilho de ouro
  em todo canto).
- Banco `esc_socios` → **sócio nº28**, `desde` 22/08, `valido_ate` 2099-12-31,
  `origem` = **`assinatura`** (NÃO `batismo`). Isso importa: `souBarao()` olha
  `origem === 'batismo'`, então ele NÃO leva as regalias de dono de batismo.
- Linhas em branco de propósito: `escudo_time`, `manto_c1/c2`, `mascote_key` — nada
  de arte, porque não há batismo.

**O que NÃO foi mexido (conferido no código):** `data.ts`, `LOGOS_PRONTAS`,
`MASCOTES`, `FUNDADOR_N`, `esc_nomes_batismo`. **Nenhum clube do jogo saiu do lugar.**
Precedente idêntico: gfpicolo13 (sócio nº27, 19/08).

**⚠️ Ele ainda NÃO tem conta.** `auth.users` não tem `delaofut@gmail.com`. A linha do
sócio é por E-MAIL, então **vale sozinha no instante em que ele se cadastrar com esse
e-mail** — nada a fazer depois. Mas o 👑 dourado só aparece pra ele quando ele entrar.

**Continua em aberto:** o batismo "DE LA Ó FUT" propriamente dito — mockup pronto
(`scripts/mockup-batismo.mjs`), esperando o Guilherme aprovar. Se aprovar, aí sim
entram as 4 formas do nome em `esc_nomes_batismo`, a arte, o `FUNDADOR_N` e a troca
de clube em `data.ts`.

## ✅ BATISMO ENTREGUE — São Luiz FC (21/08)
Dono **gabrielnegreirosamaral99@hotmail.com** (**Gabriel Amaral**) · pagou
**R$ 69,90** · 👑 ouro + **fundador nº48** · coração **Flamengo**.
Entrou na **Série D no lugar do Flamengo do Sertão** (técnico "Val do Buraco" fica).
Mascote **Luizão**, o pitbull da **2ª arte** (o sozinho, de uniforme preto — escolha
do Diego), animação `coPulinho`. Manto **vermelho `#E00000` + preto**, com **branco
de 3ª cor** e o amortecedor do Arruda (vermelho não encosta em preto).
Peso: escudo 283×279 = **11,2 KB** · mascote 267×440 = **34,6 KB** · **total 45,8 KB**
(teto 75). Nome reservado nas 4 formas.

⚠️ **A vaga pedida não era essa.** O Diego pediu o **Pardemeias**, que já era o
**Sapekeiros FC** desde 20/08. Ele escolheu o Flamengo do Sertão no lugar.

🩹 **Dois furos consertados de quebra:**
1. O **Barcenite FC** aparecia como vaga LIVRE na contagem, mas é batismo do
   `ricardopessoafreire` (fundador nº31) — faltava o comentário na linha dele.
   **Quase foi vendido duas vezes.**
2. O `EXTRA_D_TEAMS` (a reserva da Série D) ainda tinha o nome VELHO
   "Flamengo do Sertão" — com o novo na divisão, o MESMO clube apareceria duas
   vezes na temporada, com o mesmo escudo. A reserva carrega o nome ATUAL.

❓ **Fica anotado:** o escudo é praticamente o do **São Paulo FC** (mesma forma,
faixas e arco de estrelas, trocando SPFC por SLFC) — avisei o Diego duas vezes e
ele seguiu com a arte do dono. É a mesma regra que barrou o Real Madrid no Zidane
hoje de manhã. Se um dia quiser trocar, é aqui que mexe.

## 👑 REGRA NOVA (21/08): a coroa não troca sozinha
Depois do conserto do crachá, o Diego fechou a regra: *"eu não quero q ng
assuma. Tem q ser sempre o host. Se o host q criou tem q ser sempre ele sem
trocar"*. **Feito**: `ELEICAO_AUTOMATICA = false` em `store.tsx`. Está em
CLAUDE.md como regra permanente — não religar sem ele pedir.
- ⚖️ **O preço, dito na cara dele:** se o dono fechar o app de vez, a sala
  **para e espera**. Ninguém assume. A saída é todo mundo sair e o dono abrir
  outra sala. Ele preferiu isso a ver o pregão embolar com o dono ali presente.
- 🟥 O aviso vermelho do "segura a onda" foi reescrito pra dizer a verdade nova:
  *"a partida espera por ele… ninguém assume no lugar (era isso que fazia o seu
  lance voltar)"*.
- Continuam de pé (é decisão de gente, não troca automática): o dono aperta SAIR
  e passa a coroa; e quem já é dono no banco reassume sozinho ao voltar.

## 🔴🔴 ABERTO E URGENTE — sala online travando e lance refeito (21/08)

### 🎯 CAUSA RAIZ ACHADA (sala `GP0LN1` "leilao", 21/08 ~17:51)
⚠️ Primeiro eu li errado e disse pro Diego que o Braguinha tinha saído da sala.
**Ele NÃO saiu** — o Diego corrigiu (*"ele sempre esteve na sala cara, ele nunca
saiu"*) e a segunda leitura provou que ele tem razão:

```
presence      = [4, 2, 1, 3, 0]   ← 5 pessoas, TODAS lá (o 0 é o Braguinha)
presenceUids  = 3 uids             ← faltam DOIS crachás
```

**Todo mundo está presente; o que some é o CRACHÁ (uid) de alguns.** Em
`store.tsx` (~7183) o canal faz `ch.track({ playerIndex, uid: state.youUid })`
lendo `youUid` do closure do efeito — as dependências são
`[roomId, onlineMode, isHost]`, então quando o `youUid` ainda não chegou na hora
que o canal assina, ele vai `undefined`. E logo acima, o `sync` **descarta quem
não tem uid** (`.filter(u => !!u)`).

**A cadeia completa do estrago:**
1. O crachá do host não entra em `presenceUids`.
2. Todo convidado calcula `hostPresente = false` → **acha que o dono é fantasma**,
   mesmo com ele ali na frente (o índice dele está em `presence`!).
3. A única coisa segurando a coroa vira o batimento de 60s. Aba de PC em segundo
   plano congela os timers do Chrome → 60s passam → **um convidado toma a coroa
   de alguém que nunca saiu**.
4. `BECOME_HOST` **devolve o envelope de todo mundo de propósito** (senão o setor
   fecharia com lance ZERO) → *"dei lance e depois aparece que não dei"*.
5. Dois donos mandando estado ao mesmo tempo → **a listagem dos goleiros troca
   antes do tempo acabar** e **pipoca erro vermelho**.

**✅ CONSERTO (E) APLICADO em 21/08** (ordem do Diego: *"ok arrume agora"*):
- **(E1) o crachá nunca some:** os três `ch.track` passaram a usar o helper
  `meuCracha()` — lê `stateRef.current.youUid` (fresco, não o closure) e, se
  ainda faltar, busca no `supabase.auth.getUser()` ANTES de anunciar presença.
- **(E2) rede de segurança:** antes de destronar alguém, compara **cadeiras**
  (`presence`) com **crachás** (`presenceUids`). Sobrou cadeira sem crachá = tem
  gente na sala que não dá pra identificar → **ninguém perde a coroa**. Errar pro
  lado de manter o dono é sempre mais barato que trocar de host no meio do pregão.
- ⚖️ **O preço, assumido de propósito:** se um crachá ficar faltando de verdade,
  a eleição automática de host novo não roda. Continuam funcionando: o handoff
  voluntário (host que sai passa a coroa) e a auto-cura "a posse no banco já é
  minha". Ficar sem eleição automática é MUITO mais barato que destronar quem
  está jogando.
- 🔁 **Reverter:** commit isolado, só `store.tsx`, não toca em regra de jogo.
- ⚠️ **Só vale pra quem recarregar depois do deploy** — partida em andamento
  segue com o código velho até dar F5.

### 🔥 (leitura anterior, incompleta) FLAGRANTE AO VIVO (sala `GP0LN1`, ~17:48)
Peguei a sala rodando, com o Diego dentro. O banco mostra a causa exata:

| técnico | é host no banco | está presente |
| --- | :---: | :---: |
| **Braguinha** (criou a sala) | ✅ **SIM** | ❌ **NÃO** |
| Intervarcional | não | sim |
| Jurema FC | não | sim |
| CHELSEA DA GAMA | não | sim |
| Neymarzetti 👑🖋️ (Diego) | não | sim |

**O dono registrado da sala não está na sala** — e mesmo assim a sala continua
sendo gravada de 5 em 5 segundos, ou seja, ALGUÉM dos quatro presentes está
agindo como host localmente.

**Por que não se resolve sozinho (o furo de verdade):** o teste "o host está
vivo?" olha `game_rooms.updated_at`. Só que **quem grava essa coluna é quem
estiver agindo como host** — então o batimento parece SEMPRE fresco, o
`hostBeatFresh` dá `true` e a eleição de host novo (👻 host fantasma) **nunca
dispara**. Ao mesmo tempo, a regra "UM DONO SÓ" manda quem está gravando
abaixar a bola (porque `host_id` não é dele). Resultado: a coroa fica
pingue-pongando e dois estados brigam — é isso que faz **a listagem dos
goleiros trocar antes do tempo acabar**, o **lance sumir** e a **mensagem
vermelha de erro pipocar**.

➡️ **Conserto (D), agora o mais importante:** o batimento do host não pode ser
`updated_at` da sala (qualquer um escreve nela). Tem que ser um carimbo do
DONO — ex.: `game_state.hostBeat = { uid, at }` gravado só por quem se acha
host, e a checagem compara o uid do carimbo com o `host_id`. Assim host
fantasma é detectado em segundos e a eleição funciona.

**Destrava na hora, sem código:** o Braguinha voltar pra sala (ele é o dono no
banco → o cliente dele reassume) OU apontar `game_rooms.host_id` pra alguém que
esteja presente (aí a auto-cura `hostId === uid` dispara em ~10s).

Relato do Diego: *"a sala szalai deu vários erros… O host braguinha criou a sala
mas travou no goleiro no PC. E o amigo no celular ficava recebendo msg de segura
onda… E vira e mexe tinham q fazer lance novamente"*. Ele lembrou, com razão, que
isso já tinha sido consertado uma vez (commit `dfc1832`, 19/08 — "dois donos").
**Aquele furo foi fechado; este é OUTRA porta pra mesma dor.**

### O que o banco mostra (não é achismo — são as salas deles)
Salas do grupo (Braguinha · Jurema FC · Intervarcional · Vaxcão da Gama):
`SLDEX1` ("Feijao") e `1BX1D7` ("To colocando"). As duas param em
**`resq_envelope`** (a rodada de RESGATE das sobras), com `submitted: []`, e o
**último gravado é ~35s ANTES do prazo do envelope**. Ou seja: o prazo estourou e
**ninguém escreveu mais nada**. Outras 2 salas de hoje (`LOL5E0`, `X50B4Y`)
morreram exatamente do mesmo jeito.

### A cadeia (lida no código)
1. **Tudo depende da aba do host.** `dispatch` em `store.tsx` (~7100): convidado
   NÃO aplica nada localmente — dispara `broadcast` pro host e pronto, sem
   confirmação (`ack: false`). Host parado = ação do convidado some no ar.
2. **A revelação só anda no host** (`canDrive = state.isHost`). Por isso o
   convidado fica eterno no *"🔨 O host está conduzindo a revelação…"* — é o
   "segura onda" do print.
3. **O vigia de prazo não salva a sala.** O comentário diz "qualquer cliente pode
   forçar o selamento", mas como o dispatch do convidado é roteado pro host, o
   `FORCE_SEAL` dele só funciona se o host estiver vivo. **O comentário está
   desatualizado.**
4. **Aba de PC em segundo plano congela o batimento.** O host grava `updated_at`
   a cada ~3s; o Chrome estrangula timer de aba escondida. Passando de 60s (o
   limite no leilão), o convidado eleito **toma a coroa** — e `BECOME_HOST`
   **devolve o envelope de todo mundo de propósito** (senão o setor fechava com
   lance ZERO). É exatamente o *"vira e mexe tinham q fazer lance novamente"*.
   O Braguinha volta, acha que ainda é host, e a briga recomeça.

### Conserto proposto (em ordem de segurança)
- **(A) BAIXO RISCO — o lance não se perde mais.** Guardar o envelope lacrado no
  próprio aparelho e **reenviar sozinho** quando `submitted` for zerado ainda na
  MESMA rodada (setor + leva + fase). Já existe o `euLacradoRef` (store.tsx
  ~7024) marcando a rodada — é só pendurar o reenvio nele. Resolve a dor
  independente do motivo (troca de host, host recarregou, reconexão).
- **(B) MÉDIO — a coroa não escorrega por aba escondida.** Manter o batimento do
  host vivo com a aba em segundo plano (Web Worker ou `visibilitychange`), pra
  não haver troca de dono por engano no meio do pregão.
- **(C) MÉDIO — sala não morre com o host mudo.** Se o prazo estourou e o host
  não escreve há X segundos, o convidado eleito pode aplicar o `FORCE_SEAL`
  local e assumir, em vez de mandar pro vazio.
⚠️ Nada disso foi feito ainda — está esperando o OK do Diego, porque é código
online ao vivo.

## ✅ LIGADA PRA TODOS — pílula grudada (22/08, OK do Diego)
*"Pílula pode fazer sim"*. `PILULAS_GERAL = true` em `sport.ts`.
Conserto que destravou: `grudaOk = subGrudadas && !sagrado` — com banner de
intervalo, de pênalti ou festa de campeão na tela, NADA gruda.
🩹 De quebra conserta uma **promessa furada**: a novidade de 21/08 ("Carreira com
menu embaixo") já dizia à galera que *"dentro do Clube e do Elenco as abas de
dentro também param de sumir quando você rola"* — e estava desligado pra todo
mundo. Agora o que está escrito na tela de novidades é verdade. Por isso **não
ganhou linha nova** em `novidades.ts`: ela já tem a dela.
Pra desligar: `false` na mesma linha.

## ✅ RESOLVIDO — pílula grudada boiando na tela do intervalo (21/08)
**REPRODUZIDO no navegador e consertado.** A receita exata pra ver o bug (guardar,
porque vai servir de novo): carreira nova → aba **Elenco** → ligar **"⏸️ Só no
intervalo"** → escolher meta + marca do patrocínio → **Começar a temporada** →
**ficar na aba Elenco** e esperar o jogo parar aos 45'. A fileira
`🎽 TIME | 🕴️ AGENCIADOS` aparece boiando no meio do banner, mais larga que o
card, escondendo dois jogadores. Medido: com a aba Elenco aberta a fileira ficava
por cima do banner em TODAS as rolagens testadas (0, 400, 900, 1500, 2200).
⚠️ O detalhe que quase me enganou: se você TROCA pra aba Elenco depois que o
intervalo já abriu, o bug NÃO aparece. Só aparece se você já estava lá.
Conserto aplicado: `grudaOk = subGrudadas && !sagrado`. Falta só religar o portão
(`PILULAS_GERAL = true`) depois do OK do Diego. O texto abaixo é o diagnóstico
original, mantido porque explica o porquê.

## 🔴 (histórico) pílula grudada boiando na tela do intervalo (21/08)
Vídeo de usuário: a fileira **TIME | AGENCIADOS** aparece **no meio da tela**,
por cima da lista de jogadores do intervalo, quando rola pra cima e pra baixo.
Palavras do Diego: *"Deu ruim na tela de alguns usuários sobre a pílula aí qd
eles sobem e descem"*.

**Ação já tomada (mesmo dia):** `PILULAS_GERAL = false` em `sport.ts`. Todo
mundo voltou ao comportamento de antes (pílulas rolam junto com o conteúdo).
Continua ligado só na conta do Diego, pra dar pra reproduzir.

**Causa mapeada no código (falta CONFIRMAR rodando):** o `HalftimeBanner` é
desenhado na linha ~5572 do `pyramidseason.tsx`, **antes** do bloco
`{tab === 'estadio' ? … : tab === 'jogos' …}` (linha ~5960). Ou seja: o banner
do intervalo aparece em **qualquer aba**, não só na Jogos. Se o usuário estiver
na aba **Elenco** ou **Clube** quando o intervalo abre, as sub-abas grudadas
(`position: sticky`, `zIndex: 60`) ficam boiando por cima do banner.

**Conserto proposto (não feito ainda):** o mesmo `sagrado` que já esconde a
barra de baixo tem que desligar o grudar também — enquanto banner de
intervalo/pênalti/festa está na tela, `SubAbasGrudadas` sai de sticky. Depois
disso, religar o portão.

⚠️ **Lição pra quem mexer:** qualquer coisa `sticky`/`fixed` dentro do conteúdo
das abas convive com banners que são desenhados FORA do bloco das abas. Antes de
grudar algo, conferir o que mais pode estar na tela ao mesmo tempo.

## 🏛️ SALA DA PRESIDÊNCIA — o mockup APROVADO foi recuperado (21/08)
Ele disse: *"eu tinha feito outro mockup da sala de presidente contigo q tinha
gostado"*. Tinha mesmo, em 16/08 — e a **imagem se perdeu** (foi feita no chat,
nunca virou script no repo). É o MESMO acidente do mockup do Coringas, que é a
razão da regra "mockup mora no repo" existir. ⚠️ Lição reforçada: TODO mockup
vira arquivo em `scripts/`, sem exceção.

✅ **O desenho não se perdeu:** o começo do código nasceu dele e está na branch
`claude/presidencia-em-breve` (commit 02d2d5c). `scripts/mockup-presidencia-v1.mjs`
reconstrói a tela **fiel a esse código**:
- título + a frase que fechou a conversa do técnico: *"Você não é o técnico.
  **Você é o dono do <clube>.**"*
- 🎩 Técnico e 🚗 Garagem em cinza com selo **EM BREVE** (sem botão);
- 💰 Patrimônio do clube (caixa + estádio investido + elenco a preço de mercado
  + SAF), só leitura;
- 🏆 **Hall de Troféus** com ×N por competição — a MESMA estante da aba Rank
  (fonte única `meusTrofeus`, de propósito: duas contas viravam duas verdades).

**Decisão desta sessão:** ficar com a versão DELE e só encaixar 3 peças novas,
sem tirar nada: retrato de posse (dentro do cabeçalho que já existe), números do
mandato (tira de 3 no mesmo cartão) e a linha do mandato (no fim).

### 💡 "O algo a mais" — 7 ideias (`scripts/mockup-presidencia-ideias.mjs`)
Ele pediu (21/08): *"queria mais coisas pessoais… como se ele fosse presidente de
um clube mesmo… acho que falta aquele algo a mais"*.

**🔎 ACHADOS NO SAVE que destravam quase tudo (`types.ts`):**
- ✅ `careerScorersAll` — **artilharia de TODOS OS TEMPOS** por jogador;
- ✅ `careerLedger` — extrato com `player`, `pos` e `buyPrice` → dá a
  **contratação mais cara** e a **venda mais lucrativa** da história do clube;
- ✅ `careerRivals` — o rival fixo já existe e tem vida própria;
- ⚠️ **NÃO existe histórico de placar jogo a jogo** — "maior goleada", "maior
  sequência" e o retrospecto do rival precisam guardar números novos por carreira,
  e **só valem da temporada em que entrarem pra frente** (carreira antiga não
  recupera o passado). Isso foi dito a ele no mockup.

**As 7:** 1) 🙋 você, o presidente (nome + apelido de imprensa) · 2) 📖 **Livro de
Recordes do clube** · 3) ⚔️ o retrospecto contra o rival · 4) 🏟️ **batizar o
estádio** (o nome entra no jornal) · 5) 🪑 a sala que cresce (cadeira/mesa/quadro
pelo patrimônio — emoji+CSS, 0 KB) · 6) 👑 galeria de ídolos · 7) 📤 cartão do
mandato pra postar (vira marketing de graça).

**Minhas 3 favoritas:** o Livro de Recordes · batizar o estádio · você, o
presidente. ⏳ Aguardando ele escolher.

### 🧍 O BONECO DO PRESIDENTE (`scripts/mockup-presidente-boneco.mjs`)
Ideia DELE (21/08): *"pensei: primeiro o usuário, quando clicar pela primeira vez
na sala do presidente, ele criar o boneco. Seria a primeira coisa"*. A sala hoje
fala do CLUBE; o boneco faz ela falar de VOCÊ, e a 1ª entrada vira uma **POSSE**.

**Fluxo:** ① prontos (6 bonecos + 🎲 surpreenda-me + ✏️ personalizar + **pular**)
→ ② criador com **3 escolhas numa tela só** (pele · cabelo/barba · jeitão) → ③
**a posse** ("É OFICIAL!", nome, clube, data — aparece UMA vez) → ④ a sala.

**⚖️ DECISÃO DE PESO — SVG PARAMÉTRICO, e é o INVERSO da regra do batismo (está
escrito no mockup pra não confundir sessão futura):** batismo é arte de UM clube,
então tem que ser `.webp` fora do bundle; o boneco é UM desenho que TODO MUNDO
usa com peças trocando de cor/forma — em `.webp` seriam dezenas de arquivos e
combinações impossíveis, em SVG é um punhado de paths com **zero download**.

**Travas combinadas:** nunca bloqueia (dá pra pular, a sala abre igual) · sem
rolagem infinita de opções · sem padrão "certo" (5 tons de pele, cabelos
variados) · a posse aparece fora de partida e fora de pregão, sem passo novo.
**Terno/gravata vêm do TIER e a faixa das cores do coração** — não se escolhem.

**🚫 Onde o boneco NÃO entra:** listas de sala e tabelas — ali quem manda é o
ESCUDO do clube (a mesma regra do furo dos clãs que o Diego pegou).

**Passos sugeridos:** 1) boneco + prontos + posse · 2) nome + apelido de imprensa
· 3) o boneco aparecendo fora da sala (festa de campeão primeiro).

## 🏛️ (descartado) primeira tentativa desta sessão — mockup novo, aguardando OK
`scripts/mockup-sala-presidente.mjs`. Retoma o que ficou parado em 16/08 (o
começo do código está na branch `claude/presidencia-em-breve`) com o pedido novo
dele: *"quero q a sala fosse algo tb pessoal do presidente e do usuário"*.

**🔢 MEDIDO NO BANCO ANTES DE DESENHAR** (é o que decidiu o que entra):
7.564 contas · 3.072 com carreira · 4.700 com carta · 27 sócios ·
68 linhas de nome batizado · **56 com time de coração (0,7%)**.

**A sala (tudo sai do save, zero dependência de fora):** retrato de posse (você
de terno, gravata na cor do tier, escudo do clube, "presidente desde <data da
conta>") · números do mandato · **linha do mandato** (T1 assumiu · T3 subiu · T7
campeão · T9 caiu…) · sala de troféus · patrimônio somado · faixa nas cores do
coração + o convite pra quem não disse. 🎩 técnico e 🚗 garagem seguem com selo
**EM BREVE**, como ele já tinha aprovado.

**🚫 A TABELA/JOGO AO VIVO DO TIME REAL FICOU DE FORA** — ele perguntou, e eu
disse não com 3 motivos: (1) **regra dele mesmo**, escrita em `coracao.ts` e
`manto.ts`: *"nome de clube real NUNCA aparece dentro do jogo — só as CORES"*;
(2) viraria um segundo produto (API de fora paga/instável + escudo de marca
registrada); (3) não é o que deixa a sala pessoal — a tabela do time é igual pra
milhões, a história de 12 temporadas é só dele.

**🚫 Não reapresentados** (lista de descartados de 08/08): recado do presidente ·
faixa da torcida · placas · aniversário · pacote coração.

⏳ **Falta ele decidir:** 3 ou 4 sub-abas no Clube. Recomendação (a mesma de
16/08): **3**, com a Presidência engolindo o Patrocínio. O mockup foi desenhado
assim.

## 🛡️ CLÃS — desenhado, ainda NÃO codado
Mockup principal: `scripts/mockup-clas.mjs` (a ideia inteira).
Conserto: `scripts/mockup-clas-escudo.mjs`.

**A ideia:** clã é uma CASA — você entra, veste o selo dela, e o que você ganha
em qualquer sala vira ponto pra casa. NÃO é a Liga Fechada (aquilo é uma SALA;
o clã é uma IDENTIDADE que anda com você). Reaproveita a arte do batismo e o
ranking que já existem; o motor do jogo não é tocado.

**🚨 REGRA QUE NASCEU DO FURO QUE ELE PEGOU (21/08):** no 1º mockup as listas
mostravam SÓ o escudo do CLÃ do lado do nome. Palavras dele: *"gostei bastante
mas o problema q tá sumindo o escudo do jogador q ele fez"*. Ele está certo, e
isso quebrava regra dele mesmo (escudo do batismo é do E-MAIL do dono, custa
arte de verdade e vem com sócio + fundador).
👉 **O ESCUDO DO JOGADOR NUNCA SAI DA TELA — por causa de nada.** O clã vira um
**SELO REDONDO** (redondo de propósito, pra não confundir com escudo), pequeno,
no canto do escudo do dono. Quem não tem batismo mostra o selo do clã sozinho —
e aí GANHA identidade em vez de perder (hoje são só 28 batismos no jogo todo).
Sair do clã tira só o selo: escudo, manto, mascote e títulos ficam.

⏳ **Falta ele decidir 3 coisas** (estão em amarelo no mockup, com minha sugestão):
1. quem pode ABRIR um clã (sugestão: só 👑 Lenda — entrar, qualquer um);
2. quantos cabem (sugestão: 12);
3. se a Guerra de Clãs entra já (sugestão: depois — primeiro a casa existir).

## 🏆 TELA DE DESFECHO DA TEMPORADA (opção 5) — só a conta do Diego (21/08)
Mockup `scripts/mockup-fim-temporada.mjs`, resposta dele: *"ok pode fazer tb"*.
`sport.ts` · `useTelaDesfecho` / `FIMTEMP_GERAL` (hoje `false`).

**O achado que motivou:** quando a temporada fecha, o CAMPEÃO ganha uma faixa
dourada de uma linha (`pyramidseason.tsx:5213`) + a carta; quem **SOBE** de
divisão não ganha **NADA** e quem **CAI** não ganha **NADA** — a pessoa descobre
pela setinha ▲/▼ na tabela. O jogo é uma pirâmide de 5 divisões: subir é a razão
de existir do Modo Carreira e não tinha momento nenhum.

**O que foi feito:** `TelaDesfecho` — UMA tela sobreposta, UM toque, com o
desfecho grande, de onde saiu → pra onde vai e "o que você levou" (premiação ·
bilheteria · patrocínio · salários, lidos do EXTRATO da temporada, mais a
torcida antes→depois). 4 versões: `campeao` (dourado) · `acesso` (verde) ·
`queda` (vermelho) · `ficou` (escuro, discreto).

**Só entra quando tudo acabou de verdade:** `done && copaFinished &&
!copaPlaying && !festaOnC` — nada aparece por cima de jogo rolando nem da festa
do mascote. Dispensa gravada em `sessionStorage` (`esc-desfecho-<seed>-<temp>`),
então não volta a cada re-render.

**⚠️ DUAS DECISÕES QUE EU TOMEI SOZINHO (ele mandou fazer sem responder):**
1. **QUEDA = respeito, não zoeira.** Vermelho, curto, "Ano que vem a gente
   volta". Zoeira é a alma do jogo, mas não em cima da derrota do cara. Trocar é
   uma linha no `DESF.queda.sub`.
2. **"FICOU na divisão" também mostra tela**, mas discreta: fundo escuro, título
   menor ("TEMPORADA FECHADA"), sem seta. Pular direto = `if (tipo === 'ficou')
   return null` no `podeDesfecho`.

**De propósito NÃO é uma sequência de telinhas** — seriam 5 toques pra ver o que
hoje aparece de uma vez, contra a regra de ouro dele (nada atrasa o ritmo).

✅ As 4 versões fotografadas no navegador.
✅ **LIBERADO PRA TODOS em 21/08** (*"esses daí pode abrir tb p todos"*) — com o
aviso dado a ele de que eu **não vi a tela rodando numa temporada de verdade**
(o robô não joga 38 rodadas aqui). Ele mandou abrir mesmo assim. Se aparecer
qualquer coisa estranha no fim de temporada, `FIMTEMP_GERAL = false` desliga.
🐛 **Dois consertos feitos ANTES de abrir**, achados relendo o código:
- o extrato mora em `careerLedger` (solo) e `careerLedgers[id]` (online) — eu só
  lia o solo, então **carreira online veria a tela sem nenhuma linha de grana**;
- o ensino do pregão passava a voltar em TODA partida rápida nova (a chave virou
  a seed). Agora a chave por-partida vale **só na carreira**; no rápido continua
  sendo do aparelho, senão quem joga várias seguidas levava a mesma aula sempre.

## 🔨 PREGÃO LIMPO (opção 4) — só a conta do Diego (21/08)
Mockup `scripts/mockup-pregao.mjs`, resposta dele: *"ok pode fazer"*.
`sport.ts` · `usePregaoLimpo` / `PREGAO_GERAL` (hoje `false`).

**Por que:** o pregão é a ÚNICA tela do jogo com relógio (42s) e abria com 4
quadros de regra antes da primeira carta — ali a explicação **cobra pedágio**.
E os quadros voltavam em todo setor de toda temporada.

**O que mudou (com o portão ligado):**
- **VAGAS subiram pra barra** (`AuctionBar` agora aceita `vagas` e `ajuda`),
  junto das moedas — sempre na tela, não rolam com as cartas.
- **`RegrasDoPregao`** (novo, `screens.tsx`): a folha do ❓ com as 5 regras.
  Avisa que **o relógio não para** e fecha com "Fechar e dar lance 👊".
- **Saíram da frente**: o quadro 🏆 + o quadro das vagas + o quadro do 🎁
  surpresa (o bloco `!rescue && canBid && bidLimit > 0`) e o quadro do 🔒 piso.
  Os dois últimos eram **redundantes**: a carta já mostra "mín 🔒 7" e o 🎁 com
  o nome borrado (`CardFace`).
- **🎓 Ensino no lugar certo**: a marca de "já ensinei" era do APARELHO
  (`esc-tip-lance-v1`) — quem começava a 2ª carreira não via ensino nenhum.
  Com o portão ligado a chave passa a ser da PARTIDA (`esc-tip-lance-s<seed>`),
  e o primeiro pregão mostra a folha dourada "SEU PRIMEIRO PREGÃO" com a regra
  de ouro + as vagas + "Entendi, bora dar lance 👊" + "o ❓ lá em cima abre isso
  de novo".

⚠️ **O risco que eu falei pra ele e ele mandou seguir:** ele mesmo disse que
*"as pessoas começam e não entendem o que fazer no leilão"*. Nenhuma regra
sumiu — todas ficam a UM toque no ❓ — mas se ele achar que ficou seco, o
**passo intermediário combinado** é ligar só metade: tirar o quadro do piso
(redundante) e subir as vagas pra barra, mantendo o 🏆 no caminho.

**🌐 VALE EM TODOS OS MODOS** (ele perguntou em 21/08: *"faça em todos modos q
tem leilão né tipo o rápido online e etc tb"*). Não precisou de nada novo: existe
**UMA tela de leilão só** — `EscAuction` (`index.tsx`, `case 'auction'`) — usada
por rápido offline, rápido online, carreira, liga fechada, duplas e basquete. A
trava é por CONTA, então vale onde ele jogar. **Conferido rodando** no jogo
rápido contra CPU, além da carreira.

🐛 **Um detalhe que ia irritar e foi corrigido junto:** `tipClosed` zerava a cada
setor (`useEffect ... [state.sectorIdx]`), então a folha do ensino voltaria
**5 vezes seguidas** na mesma partida (uma por posição), com o relógio correndo.
Agora, com o pregão limpo, o ensino aparece **só no setor 0** e, uma vez fechado,
não volta naquela partida.

✅ Testado no navegador de verdade (carreira nova E jogo rápido, setor GOL):
barra com "1 vaga · ❓ · 💰100", a folha do ensino no 1º pregão e o ❓ abrindo as
5 regras.
✅ **LIBERADO PRA TODOS em 21/08** (*"esses daí pode abrir tb p todos"*).

## 🐛 CONSERTO: a barra de baixo sumia demais (21/08, achado pelo Diego)
Print dele na **Copa do Brasil Legends**: *"quando começou as copas as abas
voltaram pro meio. E não estão no rodapé mais"*. Era erro meu na condição do
"momento sagrado" — eu tinha escrito:

```
const sagrado = penMode || halfMode || copaPlaying || festaOnC
```

Nenhum desses três primeiros é um MOMENTO; são **estados longos**:
- `copaPlaying` vale a **Copa inteira** (foi o que ele viu);
- `halfMode` vale a **partida inteira** de quem joga no modo "só no intervalo";
- `penMode` vale a partida inteira quando ela é decisiva.

Ou seja: a barra sumia em situações onde a pessoa MAIS precisa navegar. Agora:

```
const sagrado = (halftimeOpen && halfMode) || (penaltyOpen && penMode) || festaOnC
```

— o momento sagrado é quando o **banner está ABERTO** na cara da pessoa (aí sim
nada compete), mais a festa do campeão. Os dois banners já zeram a cada rodada
(`useEffect ... [round]`), então a barra volta sozinha.
⚠️ Lição pra próxima: antes de usar uma flag pra "esconder UI num momento",
conferir se ela é um INSTANTE ou um ESTADO que dura a fase inteira.

## 📌 SUB-ABAS GRUDADAS ("Ideia 1") — só a conta do Diego (21/08)
Depois da reprovada (logo abaixo), ofereci 3 ideias novas
(`scripts/mockup-subabas-v2.mjs`) e ele escolheu a 1: *"faz a 1 code só pra mim
por enquanto pra eu ver como fica antes"*. `sport.ts` · `useSubAbasGrudadas` /
`PILULAS_GERAL` — **LIBERADO PRA TODOS em 21/08** (*"perfeito pode fazer p todos
já tb em relação às pílulas"*). Voltar ao teste fechado = `false`.

**A regra que saiu disso, e vale pra sempre:** *o remédio não pode ser TIRAR
PESO das sub-abas.* Pra quem nunca jogou é o peso (borda grossa, sombra dura,
pílula cheia na cor do tier) que diz "isto é um botão e você está NESTE".

**O que foi feito:** `SubAbasGrudadas` (wrapper, `pyramidseason.tsx`). As
pílulas do 🏟️ Clube e do 👥 Elenco **não mudaram em nada** — mesmo tamanho, cor,
borda e sombra. O wrapper só faz a fileira **grudar no topo** (`position:
sticky`) pra ela parar de sumir na rolagem, que era o problema real.

🔧 **Detalhe medido no navegador:** a fileira gruda em `FAIXA_H - 6`, não em
`FAIXA_H`. Assim o padding de cima do wrapper fica **escondido atrás da faixa**
(opaca, z 99988) e não sobra fresta pro conteúdo aparecer entre as duas.
Medido: faixa 0→30 · wrapper 25→83, sem buraco.

✅ Testado no navegador (rolagem + troca de sub-aba com a página parada) e
aprovado por ele rodando na conta dele antes de abrir pra geral.

## ❌ SUB-ABAS FINAS (opção 2) — REPROVADA, NÃO REFAZER
Foi codada em 21/08 só na conta do Diego e ele **não gostou**: *"esse 2 n gostei.
Tire do meu tb"*. O commit foi **revertido inteiro** no mesmo dia — o Clube e o
Elenco continuam com as **pílulas coloridas** de sempre, pra todo mundo.

O que foi tentado (pra ninguém gastar tempo repetindo): trocar as pílulas das
sub-abas do 🏟️ Clube e do 👥 Elenco por uma **tirinha fina** grudada no topo, só
texto com sublinhado na ativa, com a ideia de "em cima é onde eu estou, embaixo é
pra onde eu vou". O problema técnico que ela resolvia é REAL (as pílulas rolam
junto com o conteúdo e somem), mas o remédio ficou **apagado demais** pro gosto
dele. O mockup segue no repo em `scripts/mockup-subabas.mjs` só como registro.

⚠️ Se um dia voltar ao assunto: ele NÃO chegou a pedir o meio-termo que eu tinha
oferecido (tirinha grudando no topo, mas com a ativa em pílula roxa cheia).
Perguntar antes de codar de novo.

## 🧹 TOPO DA TEMPORADA — regra "decisão · recibo · aba" (21/08), no ar
Mockup aprovado (`scripts/mockup-topo-temporada.mjs`), resposta dele: *"ok mas a
parte do criar conta deixe um pouco mais chamativo e pode fazer"*.

**⚠️ ACHADO IMPORTANTE PRA QUEM PEGAR ISSO DEPOIS:** o mockup mostrou numa tela
só duas telas que na verdade são SEPARADAS no código —
- **FIM da temporada** (`done`): jornal (`SeasonJornal`, aberto) + link do
  chaveamento + a caixa "Próxima temporada" (que continha o FECHAMENTO);
- **COMEÇO** (`round === 0`): resultado do patrocínio + contrato + botão verde.
`copaFinished = done && …`, então jornal e fechamento NUNCA aparecem junto do
contrato do patrocínio. Eu avisei o Diego. A regra foi aplicada nas DUAS telas,
cada uma no que ela tinha de excesso.

**O que foi feito:**
- `ReciboLinha` · `CaixaRecibos` · `SeloSuaVez` (topo do `pyramidseason.tsx`).
- **FIM**: o quadro do FECHAMENTO DA TEMPORADA (lista inteira de lançamentos)
  virou UMA linha com o saldo → leva pra Clube › Finanças, onde o extrato mora
  inteiro. Selo 👉 SUA VEZ na caixa "Próxima temporada".
- **COMEÇO**: selo 👉 SUA VEZ no contrato do patrocínio (só enquanto não
  escolheu); o resultado da temporada passada saiu da frente e virou recibo
  DEPOIS do botão verde → leva pra Clube › Patrocínio. A frase "dava pra mirar
  mais alto 😉" foi preservada dentro da linha.
- **🎴 Criar conta mais chamativo** (pedido dele): a tirinha amarela fininha
  virou um convite com a carta dourada, o que a pessoa GANHA (não só o que
  perde) e botão verde de verdade. A versão grande de 3 em 3 temporadas
  (`horaDoConvite`) continua igual.
- **🔴 na barra de baixo**: a aba Clube ganha o pontinho quando tem recibo
  esperando; some quando a pessoa abre a aba e volta na temporada seguinte.
- `SponsorBetResultCard` deixou de existir (virou recibo).

**Regra que ele bateu o martelo:** momento de EMOÇÃO nunca vira recibo — campeão,
acesso, carta ganha e o jornal continuam grandes e com festa. Recibo é rotina.

⏳ **Não testado com carreira de verdade rodando** (o robô não termina o pregão
a tempo). Testado: build limpo + as peças novas fotografadas no navegador.

## 🤝 PATROCÍNIO DA TEMPORADA — REFEITO (21/08), no ar pra todos
Reclamação dele: *"a hora do patrocínio que o usuário tem que escolher na
temporada… acho que tá sem graça o visual. E também MUITA informação perante as
coisas em volta"* + *"não quero mais aparecendo a tabela de valores aí — coloque
na aba de patrocínio que já existe. Além disso esse visual tá muito morto, não
sei, é pouco organizado"*. Mockup aprovado (`scripts/mockup-patrocinio.mjs`),
resposta dele: *"Ok pode fazer"*.

**O que virou** (`estadio.tsx`, `SponsorBetBanner` / `SponsorBetStatus` /
`SponsorBetResultCard`):
- **Passo 1** = a META (3 fichas, valor grande, uma linha). A escolhida acende na
  cor dela. **Passo 2** = só as **3 marcas daquele nível** (antes, as 9 de uma vez).
- A **fidelidade deixou de ser banner** e virou **selo 🎖️ dentro do botão da
  marca** ("garante X 🪙"). Um selinho no passo 1 avisa em QUAL meta a marca fiel
  mora — senão quem mudasse de meta nunca descobriria que perdeu a garantia.
- Resultado da temporada passada → **faixa fina**. Fechou → carimbo **ASSINADO**.
- Mudou a meta com contrato já fechado? A tela avisa em vermelho o que ainda está
  valendo até escolher a marca nova (trava explicada, do jeito que ele gosta).
- **A régua de valores mudou de casa**: aba 🏟️ Clube › 🤝 Patrocínio
  (`SponsorBetStatus ... completo`), junto do "como funciona". A tela de início
  diz onde ela está.
- ⚠️ Nada de motor mudou: valores (2/4/6 · 4/8/12 · 8/16/24 · 16/32/48 ·
  32/64/96), as 9 marcas e a regra de fidelidade seguem iguais.
- `SponsorPayTable` e `SponsorLoyaltyBanner` deixaram de existir (viraram parte
  dos dois componentes acima).

## 🪜 BARRA DE BAIXO NA CARREIRA — só a conta do Diego (21/08)
Mockup aprovado (`scripts/mockup-carreira-barra.mjs`), ordem dele: *"Faça só no
meu primeiro p eu ver"*. `sport.ts` · `useBarraCarreira` / `BARRA_CARR_GERAL`
(hoje `false`; liberar pra todos = `true`, igual foi feito com a home).
- As **mesmas 5 abas** (Jogos · Tabelas · Elenco · Rank · Clube) saíram do meio da
  página e viraram **barra fixa no rodapé**, com ícones desenhados (0 KB) e a
  ativa na cor do tier do usuário.
- **Faixa fina que gruda no topo** quando o cabeçalho preto sai da tela
  (T{n} · rodada · divisão · posição · caixa), via `IntersectionObserver` numa
  sentinela de 1px.
- 🔴 **pontinho em Jogos** enquanto a rodada está rolando.
- **Momento sagrado**: pênalti, intervalo, Copa rolando e festa de campeão fazem
  a barra e a faixa **sumirem** — nada disputa a tela com o jogo.
- ⏳ **Falta:** o Diego dizer se gostou, e então trocar o `false` por `true`.

## 🌎 LIBERTADORES no rápido — CONSTRUÍDA (20/08), só a conta do Diego vê
Desenho FECHADO com ele (palavras dele: *"a libertadores tem q ter 32 times pow!
Deveria se classificar os primeiros 8 e dps se juntar numa tabela c outros times
formando 32 c grupos.. Se classificando 2 primeiros e etc"* · *"ideal que os 8
classificados fossem cabeças de chave"* · *"Sim pode fazer tudo ja"*):

**A liga de 20 roda IGUAL** (nada mudou nela) → acaba → **bannerzão** de abertura
com as regras + 30s (ou o host aperta) → **Libertadores de 32**: os 8 primeiros
da liga como POTE 1 (cabeça de chave, um por grupo) + os 24 clubes do continente
(`LIBERTA_CLUBS` em `data.ts`) nos potes 2/3/4 → **8 grupos de 4**, 6 rodadas de
ida e volta, passam **2** → **oitavas/quartas/semi ida e volta** → **final única**.

**O que está no código (tudo commitado e buildando):**
- `data.ts` · `LIBERTA_CLUBS` — os 24 (River Preite, Boca Xuniors, Penhalol,
  Nassional, Colo do Colo…). Nomes conferidos um a um contra clube do jogo,
  `OLD_NAME` e chaves de `LOGOS_PRONTAS`.
- `store.tsx` · `seedLiberta` (sorteio por potes) · `libertaGrupo` (tabela, mesmo
  desempate do resto do jogo) · `playLibertaRodada` (16 jogos por rodada; na 6ª
  semeia as oitavas e devolve pra tela da temporada) · `LIBERTA_BONUS`.
- `screens.tsx` · `EscLiberta` (tela dos 8 grupos) · bannerzão no fim da liga ·
  o mata-mata reusa o motor da Copa dos 8 com a cara azul-noite.
- `lobby.tsx` + setup offline · a 3ª opção "🌎 Liga + Liberta" no "Depois da liga"
  (nunca junto com a Copa dos 8 — é uma OU a outra).
- `sport.ts` · `LIBERTA_GERAL = true` — **LIBERADA PRA TODOS em 20/08** (ordem
  dele: *"pode por p todos"*). Pra voltar ao teste fechado é `false`.

**📏 FORÇA DOS 24 = PADRÃO DA LIGA** (decisão dele em 20/08: *"quero q deixe
padrão liga… deixe o mais forte c 77 tb desses 24"*). Eles jogam na MESMA régua
dos bots da liga: mesmo teto (o mais forte da liga é 77 e o mais forte deles, o
River Preite, também é 77) e o MESMO ajuste de sala (`cpuAtkAdj`). Sem degrau.
📊 Os números que eu medi e mostrei ANTES dele decidir, pra quem for mexer nisso
depois: bots da liga 67,3 de média · os 8 que se classificam 72,8 · os 24 do
continente 68,2. Na régua da liga a Libertadores fica um pouco mais leve que o
top 8 — ele viu isso e escolheu o padrão da liga assim mesmo. Se um dia quiser
apertar, é voltar o `+6` que estava em `simMatch`.

**🛡️ Travas:** liga com menos de 8 clubes (Liga Fechada pequena) NÃO semeia a
Libertadores — fecha como "só liga" com o motivo no giro. E `liberta` é zerado em
todo lugar onde `quickCopa` já era, pra temporada nova não herdar chave velha.

⏳ **Falta:** ver rodando com gente de verdade. Eu NÃO consegui terminar a
partida inteira no navegador antes de publicar (o robô empacou no Monte Final) —
o que está garantido é que o build passa limpo, a home abre sem erro nenhum e a
liga/Copa dos 8 não foram tocadas. As telas novas (bannerzão, fase de grupos)
ainda não foram vistas rodando. **Primeira coisa da próxima sessão: rodar
`scripts/`-style playthrough ou pedir print pro Diego.**

⏸️ **PAUSADO — o baralho TEMÁTICO da Libertadores** (só jogadores que disputaram
a Libertadores pelo clube da carta). Palavras dele: *"Eu acho q temos q deixar
isso pausado e apenas criar a copa libertadores lá junto com o de liga e copa"*.
A pesquisa está salva em `docs/libertadores-por-clube.txt` e
`docs/libertadores-participantes.md` — se voltar, é só ligar o filtro.

## 🐝 SAPEKEIROS FC entrou na Série D (20/08) ✅ NO AR
Batismo do **tiosapeka@gmail.com / @tiosapekagg** (influencer). Ele já tinha
escudo, mascote (abelha coroada), manto preto+dourado, estádio "Clube dos
Sapekeiros", tier ouro 👑, sócio nº21 e fundador nº41 desde 12/08 — só faltava a
DIVISÃO. O Diego escolheu a vaga: **entrou no lugar do Pardemeias** (`data.ts`
Série D + `OLD_NAME`, então save antigo com Pardemeias vira Sapekeiros ao abrir).

⚠️ **A Série D acabou.** Só sobrou **1 vaga livre**: `Flamengo do Sertão`
(técnico "Val do Buraco"). Todas as outras 19 já têm dono. O próximo batismo que
pedir Série D pega essa — e depois disso **não tem mais**: ou abre vaga em outra
série, ou o desenho da pirâmide precisa crescer. Vale avisar o Diego ANTES de
prometer Série D pra alguém.

📏 A arte dele estava **acima do teto da casa** (escudo 49,4 KB/480px contra
30 KB/360px · mascote 47,1 KB contra 45 KB). Recomprimida no mesmo commit:
29,6 KB e 42,5 KB, sem diferença visível (comparação antes/depois foi pro Diego).
A largura declarada do mascote foi corrigida pra proporção real do arquivo novo
(440/373), como manda a regra 4.

## ✉️ contato@leilaolegends.com — CONFIRMADO (21/08)
O Diego confirmou: *"sim, esse e-mail agora existe sim"*. É o canal oficial de
**patrocínio**. Já está em três lugares e todos batem:
· `docs/media-kit.html` (v01) e `docs/media-kit-v02.html` — a seção de contato;
· a pergunta "Como faço pra patrocinar minha empresa no jogo?" no FAQ do jogo
  (`Duvidas`, em `screens.tsx`).

⚠️ **NÃO confundir com estes dois, que continuam sendo o gmail dele e NÃO devem
ser trocados sem ele mandar:**
· `PIX_KEY` / `BL_PIX` = **chave Pix de verdade**. Trocar isso manda dinheiro de
  apoiador pro lugar errado.
· o rodapé do jogo (`GameFooter`), que é o canal de **bug e sugestão** — é
  pessoal de propósito, combina com o "sou o Diego, faço sozinho na unha".
  (Se um dia a caixa pessoal encher, dá pra migrar esse — mas é decisão dele.)

## 🏠 HOME NOVA — no ar pra TODO MUNDO (20/08)
Queixa do Diego: *"o visual da home ainda acho que não tá legal, ainda acho que
tá poluído e desorganizado! E ainda acho que o jogo não está claro as regras
dele. As pessoas começam o jogo e não entendem o que tem que fazer no leilão, as
moedas, a disputa… e que depois tem uma simulação"*.

**A ideia que ficou (dele, e é a boa):** *scroll longo com tudo ABERTO e um MENU
FIXO no rodapé*. O menu é o que destrava o resto — se navegar não depende de
rolar de volta, o scroll pode ser comprido e nada precisa se esconder atrás de
clique. Calma vem de **espaço**, não de tirar coisa.

**Os andares:** (1) o que é o jogo · (2) as cartas deitadas, deslizando · (3) os
TRÊS modos com a CARREIRA grande · (4) continuar carreira/sala · (5) COMO
FUNCIONA UMA PARTIDA (aberto, mas embaixo) · (6) novidades enxutas · (7) apoiar.

**Duas coisas que EU errei e ele cortou** — ficam registradas pra não repetir:
1. Tirei as cartas do alto. **Errado**: a carta é o MOTIVO de jogar. Voltaram.
2. Enfiei as regras na cara. **Errado**: ninguém chega num jogo querendo ler
   manual. Viraram uma PORTA (o botão Regras).
E uma terceira: deixei **um botão só** ("Jogar agora"). Ele quer os TRÊS modos
visíveis, com a **Carreira** grande — é onde a galera fica (118 mil temporadas)
e é o modo onde o patrocinador aparece toda temporada.

**A barra de baixo FOGE do padrão visual de propósito** (fio fino, fundo quase
branco, ícones desenhados em vez de emoji, ativo em roxo sem retângulo preto).
O resto do jogo é borda grossa e sombra dura; na barra isso brigava com tudo.
É exceção consciente — não "consertar" de volta.

**O Manual do Técnico** virou a MESMA lista do "como funciona" (componente
`PassoLinha`, usado nos dois lugares): 6 passos + os 3 modos. O antigo era
quadro dentro de quadro, com texto de 8px.

**🏠 Botão Início** no canto de cima do Álbum e do Ranking (antes só havia saída
no fim da página — e o álbum tem centenas de cartas até lá).

↩️ **Reverter:** `HOME_NOVA_GERAL = false` em `sport.ts` devolve a home de hoje
pra todo mundo num commit.

## 🏆 LIGA FECHADA — em construção (só a conta do Diego)
A sala que fica de pé: horário marcado, sempre a MESMA sala, só a turma entra e
os troféus se empilham ali. Desenho aprovado em `scripts/mockup-liga-fechada.mjs`
(rode pra ver a folha). Regras ditadas pelo Diego:
1. **Sempre a mesma sala** — é o que faz o troféu acumular.
2. Só entra quem é **👑 Lenda ou dono de clube batizado**; quem não é nem vê a
   sala (como todo batismo já nasce ouro, a conta é uma só: `tier === 'ouro'`).
3. **O host começa quando quiser**, igual às salas de hoje (com 2 já dá).
4. Ao ligar a liga ele escolhe **com ou sem bot**, e pode trocar depois.
5. **O dono manda na liga**: arruma qualquer troféu de qualquer um, liga/desliga
   quais troféus existem, e escreve a **regra do ranking** (por ordem de títulos
   ou por pontos que ele define; e se cair de divisão tira título). O jogo sugere,
   ele decide, e vale toda vez que a turma entrar.

### Onde está
- ✅ **Peça 1** (`11c645c`): 🏆 Liga virou MODO de jogo, do lado do Rápido. Cria a
  sala com dia, hora e com/sem bots. Aba apagada com "em breve" pra todo mundo
  menos o Diego (`LIGA_TESTERS` em `sport.ts`).
- ✅ **Peça 2** (`079e66e`): liga sai da lista pública (é privada) e nasce a lista
  **"Minhas ligas"**, que busca por PARTICIPAÇÃO — por isso não some como some
  sala parada há 6h.
- ✅ **Peça 3** (`1a3c809`): sala de troféus na ESPERA (só leitura; quem grava
  continua sendo o fim de jogo).
- ✅ **Peça 4**: o dono (e os adms) arrumam/escrevem troféu — ✏️ por temporada,
  "➕ escrever uma temporada" e 🗑️. A trava de verdade é no BANCO (políticas
  `champions_update`/`champions_delete`: host OU quem está em `ligaAdmins`), então
  mexer no navegador não adianta.
- ✅ **Peça 5**: as regras do ranking da liga (o que vale ponto) + o ranking
  calculado na hora, na própria espera.
- ✅ **Extras pedidos depois** (`8f2b1e4` e antes): remarcar dia/hora quando quiser
  (RPC `liga_patch`, que só mexe nas chaves da liga e nunca no jogo em andamento) ·
  **adm** (o dono promove quem quiser) · **teto de 2 ligas por dono** (pra criar a
  3ª tem que excluir uma) · **o dono sair não apaga a liga** (só o "excluir" apaga,
  e só ele pode).
- ✅ **Quem abre o pregão** (`1867bb6`): o Diego escolheu a **opção A** — *só o
  DONO abre*, igual às salas de hoje ("quero algo q N dê novela pro host"). O motor
  não mudou; só a TELA passou a dizer se o dono já chegou ou não, pra ninguém ficar
  olhando um "aguardando…" sem saber o quê. **Adm nunca abre o pregão nem exclui a
  liga** — adm é só remarcar, arrumar troféu e mexer nas regras.
- ⏳ **Falta**: notificação na hora marcada — o Diego adiou de propósito
  (*"N tem notificação ainda não. Isso é pra mais pra frente"*). E o OK visual dele
  pra liberar pra todo mundo (hoje `LIGA_GERAL = false`, só a conta dele vê).

### 🧹 A FAXINA IA COMER A LIGA — consertado no banco (20/08)
Pergunta do Diego: *"e se o cara nunca apagar a liga mais??"*. Ao medir, achei
coisa pior que acumular: existe um **cron diário às 8h** que **apagava toda sala
parada há 2 dias** (só a carreira escapava). Uma liga marcada pra sábado seria
apagada na quarta, com os troféus junto, sem ninguém saber.
Agora são duas regras no mesmo cron:
- **sala comum**: 2 dias parada, como sempre;
- **liga fechada**: só depois de **90 dias sem ninguém jogar**.
Tudo que sai continua sendo copiado pro `game_rooms_cleanup_log` antes.

**Custo de guardar**: medido — 467 salas ocupam 74 MB, ~**39 kB por sala**. Mil
ligas guardadas dariam ~39 MB, e a sala NÃO cresce por temporada (é sempre o
estado atual). Ou seja, guardar liga é barato; o problema era o contrário.



## 🏢⏳ HACK DO "ESCONDE NA SAF" — FECHADO (18/08) ✅ NO AR

Relato de jogador que o Diego trouxe: *"quando um jogador é emprestado pra SAF
o contrato não acaba... ele sabe que vai encerrar o contrato do jogador aí ele
empresta. Mó hack. Aí nunca tem o banner de renovação ou deixar sair"*.

**Era verdade, e a causa é simples:** `LOAN_TO_FILIAL` faz
`you.squad = you.squad.filter(...)` — a carta SAI do elenco e vai pro elenco da
SAF. E a conferência de contrato vencido roda em cima do ELENCO
(`(m.squad).filter(c => c.contratoAte < s.seasonNo)`). Carta fora do elenco =
contrato que ninguém confere. Não era conta errada, era **esconderijo**.

Atenuante medido: as vagas de empréstimo são poucas (D1·C2·B3·A4) e cada
escondido é um jogador que não joga — o hack é pequeno e custa elenco.

**Solução escolhida pelo Diego** (ele pediu a trava, mas com a saída junto):
na hora de emprestar alguém com contrato **vencendo nesta temporada ou já
vencido**, em vez de barrar, abre uma caixa com **renovar (5/10 anos, preço
real) e emprestar** ou **deixar no elenco** — aí ele cai na janela de contratos
normal no fim da temporada. Mockup aprovado por ele antes de codar.

**Onde está:** `travaContratoSaf()` em `store.tsx` (a trava mora no REDUCER de
propósito — pela tela não dá pra burlar), chamada nos dois caminhos do
`LOAN_TO_FILIAL` (solo e online); `LOAN_TO_FILIAL` ganhou `renovarAnos?`;
a caixa em `estadio.tsx` (`travaCt` + props `loanContratoAviso` /
`onLoanToRenovando`), ligada em `pyramidseason.tsx`.

**Testado no reducer** (4 casos): sem renovar → bloqueia e não cobra · com
renovação → vai pra SAF, cobra metade do valor e estende o contrato · contrato
longe → empresta normal sem cobrar · prazo inexistente pro valor → bloqueia
(não dá pra passar de graça mandando prazo inválido).

**Decisão do Diego sobre quem já está escondido:** *"deixa quieto por enquanto.
E no próximo pega eles"* — a regra vale só pra quem emprestar daqui pra frente;
ninguém é punido retroativamente.


## 🏆❌ A COPA DO BRASIL SUMIA CALADA — ✅ CONSERTADO (19/08)
Reportado pelo **Gabriel** (`nevesgabriel95@gmail.com`) via Diego: carreira NOVA,
com Agência 2.0, **106 temporadas sem UMA Copa do Brasil nem UMA Supercopa** — e
nenhum time da carreira dele tinha título de Copa no rank local.

### A causa
`computeCopaBrasil` abria com uma trava seca: se **qualquer** das cinco divisões
não tivesse **exatamente 20** times, devolvia vazio. E quem chama não caía na
Copa Legends — `if (cbUnlocked && copaBR)` era verdade mesmo com o resultado
vazio. Resultado: **nenhuma copa, temporada após temporada, sem nenhum aviso**.

### Quanta gente (medido no banco)
| pirâmide | carreiras | tinha Copa? |
|---|---|---|
| 100 clubes (certa) | 1.276 | ✅ |
| 80 (save antigo, sem Várzea) | 2.785 | ❌ |
| 99 · 91 · 81 · 79 (torta) | 24 | ❌ |

### Por que a pirâmide do Gabriel ficou com 99
Ele batizou o time de **"Deportivo Montreal"** — que é o nome de um **clube da
Série A** do jogo. Existe uma regra (certa) que impede um clube homônimo de um
manager de nascer também como time de fundo; ela foi escrita pensando no 2º clube
do Multiclubes, com o comentário *"normalmente nenhum time A/B/C é manager, então
isto é no-op"*. Só que quando o JOGADOR escolhe um nome igual ao de um clube do
catálogo, esse clube é retirado e **nada entra no lugar** — a Série A dele ficou
com 19 pra sempre. É a mesma família do bug dos "dois Neymarzetti".

### O conserto
Chave **elástica**: se molda ao tamanho real da pirâmide e sempre fecha em 64.
`diretos = 128 − N` · `peneira = 2 × (N − 64)` (sempre par). Com a pirâmide cheia
(N=100) a conta dá **exatamente** o de hoje — 28 diretos (Série A + 8 melhores da
B) e 72 na peneira, nos mesmos arrays e na mesma ordem, então o sorteio sai
idêntico e **nenhum campeão já visto muda** (conferido por teste numérico em
100/99/91/88/81/80/79). Fora da faixa 68–128, cai na **Copa Legends** em vez de
ficar sem copa, e os rótulos passaram a seguir a copa que REALMENTE rodou
(`copaBrOk`), não o desbloqueio global.

### ⏳ FALTA DECIDIR COM O DIEGO
O buraco na pirâmide (o clube que sai e não é reposto) **não** foi tapado: só o
efeito na Copa. Tapar significa **um clube novo aparecer na Série A** dessas 24
carreiras em andamento — mudança visível, então é decisão dele. Vale lembrar que
uma divisão com 19 times também deixa a tabela com número ímpar de clubes.

## 🐛👻 A CARREIRA FANTASMA — CAUSA RAIZ ACHADA E FECHADA (19/08) ✅
O Diego achou testando na conta dele: apertou **Nova carreira**, e na tela de
montar a carreira apareceu um **banner roxo "🪜 Carreira em andamento · Série D ·
Temporada 2 · Continuar carreira (Neymarzetti)"** — de uma carreira que **não
está em "Minhas Carreiras"**. Palavras dele: *"é do modo rápido online isso...
ficou como se fosse save de carreira. Jogo do modo rápido virou um continua
carreira no modo carreira... foi oq fez essa confusão toda"*. Ele estava certo.

### O caminho do bug (linha por linha)
1. O reducer **clona o estado anterior**. Quem saía de uma **carreira** (ou da
   Dinastia) e entrava numa **sala online** levava o `careerDivision` junto —
   `START_ONLINE` zerava `careerOnline`, `sport`, `varzea`… mas **nunca zerou o
   `careerDivision`**.
2. Com esse campo preenchido, a sala online passava a se comportar como carreira
   por fora: selo 🪜 SÉRIE D na tabela, rastreador de rivais, e — no fim da
   temporada — o **painel de fim de carreira** no lugar do painel do online.
3. Esse painel **auto-salva** um save de carreira assim que aparece
   (`CareerEndPanel`, o `autoSaved`). Só que o elenco ali era o da **sala
   online**. Nascia uma carreira que ninguém criou, gravada em `esc_careers` —
   uma tabela **diferente** de `esc_pyramid_saves`, que é a de "Minhas
   Carreiras". Por isso o fantasma não aparecia na lista.
4. Quem tocasse em **"Continuar carreira"** naquele banner abria um jogo com
   elenco pronto (Suárez e cia., do leilão online) e com os **títulos que
   estavam no estado** — porque `RESTORE_CAREER` também não fazia faxina.
   **É a origem do caso do Paduz.**

### A prova (banco, não achismo)
524 linhas em `esc_careers`; **474 com `season_no = 2`** (= uma temporada jogada)
e **linhas gravadas no MESMO segundo por usuários diferentes** (16:58:51,
16:58:52, 16:58:55…) — gente da **mesma sala online** terminando junto. Ninguém
consegue **criar** uma carreira antiga desde **30/07**, quando a pirâmide entrou
(`START_CAREER_SOLO`): a tela de setup manda pra pirâmide. Ou seja, tudo que foi
escrito ali depois de 30/07 é fantasma.

### E o modo rápido OFFLINE? (pergunta do Diego, 19/08)
**Não é a origem** — e isso está provado no código, não no achismo: o `START`
(que é a ÚNICA porta do rápido offline) tem a linha
`s.careerDivision = action.career ? 'D' : null`. Rápido offline **sempre** nasce
com esse campo zerado. O que faltava era exatamente essa linha no `START_ONLINE`.

**Mas o offline mantinha o fantasma vivo, no 2º passo**: quem tocava no banner
roxo abria a carreira fantasma e jogava **offline** — e no fim de cada temporada
ela era regravada. Dá pra ver nos dados: das 384 linhas, **364 estão na
temporada 2** (a 1ª gravação, saída da sala online) e **20 passaram da 3**
(chegando à T10) — essas 20 são as que a pessoa continuou jogando offline.
Fechando a origem e o banner, as duas pontas caem.

Achado de quebra: o `esc-solo-inprogress-v1` (o "continuar de onde parou")
guarda **também a carreira**, então o jogo podia ABRIR já com a divisão da
carreira na memória, sem a pessoa ter jogado nada naquela aba. Era o segundo
caminho pra dentro da sala online — a faxina do `START_ONLINE` fecha os dois.

### 🌍 O ranking global NUNCA foi afetado (conferido 19/08)
Dúvida do Diego: *"essas carreiras não aparecerão mais no ranking global né?"*.
Conferido nos dois lugares:
- **Ranking global da carreira** (`esc_pyramid_rank_snap`, o com divisões): quem
  grava tem porta na entrada — `if (!agenciaOn || onlineMode === 'online' ||
  !careerOnline) return`. Modo rápido não é carreira-pirâmide, então **nunca**
  escreveu ali. Olhado o topo do rank: só carreiras longas de verdade (T752,
  T549, T521, T451…), nenhum modo rápido. A única exceção foi o Paduz, quando o
  fantasma foi aberto com o `careerOnline` ainda ligado — linhas já removidas, e
  a faxina do `RESTORE_CAREER` fecha esse caminho.
- **Ranking de títulos do rápido** (`esc_results` via `esc_ranking`, separado por
  modo cpu/online): não tem divisão, não se mistura com a carreira e **não foi
  tocado** — sala de troféus do rápido segue igual (ordem do Diego).

O "Série C / Série D" que ele e o Paduz viram na tela era o **próprio fantasma
aberto** (o selo de divisão vinha colado nele), não o ranking.

### 🔎 Varredura do ranking — sobrou mais alguém? NÃO (19/08)
Pergunta do Diego: *"e não tem mais times assim no rank não?"*. Varridas as
**1.513 carreiras** do `esc_pyramid_rank_snap`:
- **mais título do que temporada: 0 linhas** (as do Paduz já tinham sido
  removidas; a trava barra as novas e cura as antigas na próxima temporada);
- **topo do rank**: só carreira longa de verdade (T752, T549, T521, T451, T187);
- cruzando os **384 fantasmas** com o rank, procurando "carreira novinha que já
  entrou com taça": sobraram **9 casos**, todos entraram com **1 título** e o
  maior hoje tem **3 títulos em 16 temporadas** — número normal de quem joga.

**Por que só o Paduz apareceu feio**: o fantasma levava pro rank o que a pessoa
já tinha ATRÁS dela. Ele tinha carreira de T187 com 106 Séries A, então a
herança virou 31. Quem não tinha carreira grande não levava quase nada.

### O conserto (3 travas + limpeza)
1. **Raiz** — `START_ONLINE` agora faz faxina de carreira: `careerDivision`,
   `careerIntent`, `careerTitles/TitlesA` e `careerRivals` zerados sempre; sala
   **rápida** também zera `careerPlacements` e os títulos de todo mundo.
2. **Cinto** — o painel de fim de carreira nunca mais renderiza numa sala online
   (`state.careerDivision && !online`), então não tem como auto-salvar de novo.
3. **Cinto 2** — `RESTORE_CAREER` faz faxina completa (honras, colocação, caixa,
   estádio, `careerOnline`…). Retomar um save velho não pode mais parir uma
   carreira com títulos de outra.
4. **Banner** — só oferece save **anterior a 30/07**. O que veio depois é
   apagado sozinho ao abrir a tela (dá pra provar pela data que é fantasma).
5. **Limpeza no banco**: 384 linhas fantasmas removidas de `esc_careers`, todas
   **copiadas antes** pra `esc_backup_saves` (motivo `carreira-fantasma…`).
   Ficaram as 140 anteriores a 30/07, que podem ser carreiras de verdade da
   época em que esse modo existia.

**Dá pra reverter?** Sim: o código é um commit isolado, e as 384 linhas estão
inteiras no backup.

## 🐛🪜 CARREIRA NOVA NASCENDO COM TÍTULOS — ✅ CAUSA FECHADA (ver seção acima)
Reportado pelo Diego em 19/08 (usuário **Paduz**): *"como q ele cria carreira e
já tava C time.. já C Suárez e etc... e já C títulos"*.

### A prova (saves dele no banco, não é achismo)
| carreira (seed) | temporada | Série A | Copa |
|---|---|---|---|
| `809022121` (a antiga, legítima) | 187 | 106 | 60 |
| `460592162` (**nova, suja**) | 3 | **31** | **28** |
| `372711797` (**nova, suja**) | 14 | 37 | 28 |

Carreira nova nascia com **31 Séries A e 28 Copas**. Detalhe que aponta o
caminho: o botão "Continuar carreira" mostrava **1 título** (certo) enquanto o
`careerHonors` tinha 31 — ou seja, **o jogo guarda a conta em dois lugares e só
um vazou**.

### ❌ O que NÃO é a causa (já conferido linha por linha)
O reducer `START_CAREER_SOLO` zera `careerHonors`, `careerCopaHonors`,
`careerSupercopaHonors` e todo o resto. A sujeira entra **depois** do início.

### ✅ CAUSA DO ELENCO — ACHADA E CONSERTADA (19/08)
O Paduz confirmou o caminho: **acabou de jogar a carreira antiga e foi direto
criar a nova, na mesma conta**. Com isso o furo ficou visível:

`stashActiveBeforeNew()` arquivava a carreira atual mas **não limpava o ponteiro
da carreira ATIVA** (`esc-solo-career`). Então, logo depois do START criar a
nova, a antiga continuava marcada como "a que você está jogando". E o
`syncCareersWithCloud` — que roda ao abrir a home **e toda vez que a aba volta
pro foco** — reescreve esse ponteiro com a carreira de `at` mais recente, que é
exatamente a que a pessoa acabou de jogar. Resultado: a carreira nova era
atropelada pela velha, com elenco e tudo.

**Conserto**: ao arquivar pra começar outra, o ponteiro é zerado. A carreira
antiga não some (fica no arquivo e na nuvem); some só o "esta é a ativa", que
passa a ser a nova no primeiro autosave dela.

### ✅ CAUSA DOS TÍTULOS — ACHADA EM 19/08 (a carreira fantasma)
Faltava explicar o **número** (31 Séries A / 28 Copas, quando a antiga tinha
106). Fechou com a seção **"A CARREIRA FANTASMA"** no topo deste arquivo: o
`RESTORE_CAREER` do banner roxo não fazia faxina, então a carreira aberta ali
saía com o `careerHonors` que estivesse em memória — de qualquer partida
anterior daquela aba, não necessariamente da carreira mais recente. Daí o número
não bater com 106: não era cópia da última, era o que sobrou na memória.
As duas travas abaixo continuam de pé como cinto de segurança.

### ✅ O que já está no ar (contenção)
**Regra ditada pelo Diego:** *"N quero q NG tenha mais títulos do q temporadas...
não tem como ganhar uma Série A e B na mesma temporada"*. Virou trava em dois
lugares:
- **no ranking** (`pyramidseason.tsx`, commit `5dde174`);
- **dentro da carreira**, ao abrir (`sanearTitulos` em `store.tsx`, `cd888f4`).

Em N temporadas concluídas: no máximo **N taças de divisão no total** (só se
disputa uma divisão por temporada), N Copas, N Supercopas e N Copas do Mundo.
Quem está limpo não sente nada; quem está sujo se cura sozinho ao abrir.

### 🧹 Limpeza feita à mão (só o Paduz, autorizada pelo Diego 19/08)
- **Backup primeiro**: o save inteiro dele foi copiado pra `esc_backup_saves`
  (id 1) — dá pra restaurar tudo.
- Removidas do `esc_pyramid_saves` as carreiras **`460592162`** e
  **`372711797`**. A antiga **`809022121` (T187) NÃO foi tocada** — ordem
  explícita do Diego.
- Removidas as linhas dessas duas carreiras do `esc_pyramid_rank_snap`.
  Sobraram só `career_id 0` (T140-174) e `809022121` (T175-187), que são dele
  de verdade.

⚠️ **A carreira bugada pode voltar**: ela também vive no **aparelho** do Paduz.
Se ele abrir o jogo com ela ainda lá, a junção com a nuvem republica. Por isso a
mensagem pede que ele apague no ✕ ao lado de "Continuar carreira".

## 📸 ROSTO PRONTO (GPT/Gemini) × PEÇA DESENHADA — a conta (19/08)
Pergunta do Diego: *"e se o chat gpt fizer as imagens dos jogadores? c base no
tamanho q precisamos... pq hj tem mais d mil jogadores mas em breve terão 3 mil"*.

### Os números MEDIDOS (não chute)
- Na carta, o espaço do rosto é um círculo de **66px** (carta normal) e **100px**
  (carta grande). Então o arquivo só precisa de **200px** no lado maior (2× pra
  retina). Mais que isso é peso jogado fora.
- Peso real de uma arte chapada nesse tamanho, medido aqui: **~10 KB** a 200px
  (7 KB a 160px · 14 KB a 256px · 19 KB a 320px), webp q85.
- Baralho hoje: **1.419 linhas de jogador**. Por fama: **108 são fama 5** (7,6%),
  400 fama 4, 410 fama 3, 326 fama 2, 175 fama 1.

### A conta
| | Foto pronta em TODOS | Foto só nos CRAQUES (fama 5) | Peça desenhada |
|---|---|---|---|
| Arquivos hoje | 1.419 | **108** | 0 |
| Arquivos a 3.000 jogadores | 3.000 | **~230** | 0 |
| Peso no repositório | **~30 MB** | **~2,3 MB** | **0 KB** |
| O Diego consegue conferir um a um? | ❌ não | ✅ sim | ✅ (são ~12 peças) |
| Jogador novo custa | +10 KB pra sempre | +10 KB só se for craque | **0 KB** |

⚠️ O peso **não é o maior problema** — imagem separada só desce pra quem cruza
com o jogador, então 30 MB no repo não viram 30 MB no celular de ninguém. Os
dois problemas de verdade são:
1. **TRABALHO**: 3.000 imagens pra pedir, baixar, nomear e conferir. A 1 minuto
   cada, são **50 horas** — e cada jogador novo repete o ciclo pra sempre.
2. **A REGRA DO DIEGO (18/08)**: *"qd vc N souber qm é a pessoa é como é me fala"*.
   O GPT **não sabe** quem é o lateral folclórico do Série D — e não avisa: ele
   desenha qualquer um com cara de retrato. Rosto errado com cara de foto é pior
   que rosto genérico, que foi exatamente o que ele falou do Vozinha.

### ✅ O caminho recomendado: HÍBRIDO
1. **PEÇA desenhada pra todos os 1.419 (e pros 3.000)** — 0 KB, ninguém fica sem
   cara, e nada quebra quando entra jogador novo.
2. **FOTO pronta só pros ~108 fama 5** — os que todo mundo reconhece e o GPT
   sabe desenhar. 108 × 10 KB = **1,1 MB**, e dá pra conferir os 108 no olho.
3. Regra no código: **tem foto → usa foto; não tem → cai na peça.** Nunca falha.

### A esteira já está pronta: `scripts/rosto/foto-jogador.py`
O Diego joga a pasta de imagens do GPT e sai tudo no formato do jogo:
```
python3 scripts/rosto/foto-jogador.py --pasta ~/rostos-gpt
```
Ele casa o nome do arquivo com o jogador REAL do `data.ts` (ignora acento e
caixa: `Pele.png` acha o "Pelé"), tira o fundo branco, corta no limite do
desenho, reduz pra 200px, salva webp e **avisa todo arquivo que passar de
12 KB**. Arquivo que não casa com jogador nenhum é recusado — não nasce rosto
órfão no jogo. Testado.

### 📋 O que pedir pro GPT/Gemini (pra vir no formato certo de primeira)
> Ilustração de busto (cabeça e ombros) do jogador **[NOME]** no **[CLUBE, ANO]**.
> Estilo vetorial chapado, cores sólidas, **sem fundo** (ou fundo branco liso),
> de frente, centralizado, com pouca margem sobrando. Cabelo e barba fiéis ao
> jogador naquele ano; camisa nas cores do clube, **sem escudo e sem patrocínio**.
> Entregar em **PNG 1024×1024**.

Nome do arquivo = **nome do jogador igualzinho ao do jogo** (`Lionel Messi.png`).

⏳ **Falta o Diego decidir**: (a) fica o híbrido? (b) o estilo do rosto (a última
peça foi a SEM olho/boca/nariz, que ele mandou fazer e ainda não avaliou).

## 🧑 ROSTO DE JOGADOR (18/08) — ⏳ MOCKUP ENTREGUE, AGUARDA O OK DO DIEGO
O Diego viu o `meuonze.app.br` e gostou da arte dos jogadores. Pediu algo
parecido **na personalidade da casa**, não igual: *"não sendo idêntico ao do
jogo q mandei… o cabelo parecido C jogador camisa de time Tb parecida mas sem
escudo… Faça um C a nossa personalidade"*.

### A decisão de peso (é o coração disso)
**NÃO é uma figura por jogador.** São 1.414 jogadores — 1.414 arquivos seria
insustentável. É **um boneco só, desenhado em código**, com PEÇAS trocáveis:
pele · cabelo · barba · as 2 cores do clube + o padrão da camisa (lisa, listras,
faixa, meio, banda). Cada jogador guarda ~4 letrinhas no baralho. O desenho
entra **uma vez** no bundle e vale pros 1.414 — **0 KB por jogador novo**.
É a mesma lógica do MANTO do jogo, que já é listra em CSS.

⚠️ Isto é o OPOSTO da regra de batismo (lá a arte TEM que ser `.webp` fora do
bundle). Não é contradição: batismo é arte ÚNICA de um clube só (pesada, e só
desce pra quem cruza com ele); rosto é arte GENÉRICA reaproveitada por todos.

### Onde está
- `scripts/rosto/rosto.mjs` — as peças (6 peles · 10 cabelos · 4 barbas · 5
  padrões de camisa) e o boneco montado, no traço da casa (tinta `#0C0C0C`,
  borda 4–4.5px, cores chapadas, sem degradê).
- `scripts/rosto/folha.mjs` — a folha de mockup com os 17 que o Diego escolheu:
  `node scripts/rosto/folha.mjs --saida /tmp/rostos.png`

### 🚫 Regra que nasceu aqui (18/08): não inventar cara de gente real
Eu chutei o rosto do **Vozinha** (goleiro de Cabo Verde) — pele, careca, barba
cheia — sem ter referência nenhuma. O Diego: *"qd vc N souber qm é a pessoa é
como é me fala pow"*. Virou regra permanente no `CLAUDE.md`. Na prática, no
sistema de rosto: **quem eu não conheço leva a peça NEUTRA e a carta fica
marcada** (❓), em vez de um chute com cara de retrato.
Dos 17 do mockup, o único sem referência é o **Vozinha** — falta o Diego mandar
uma foto (ou dizer como ele é) pra montar as peças dele.

### Falta (só depois do OK visual)
1. Mover as peças pro jogo (`src/escalacao/rosto.tsx`) e ligar na
   `CollectibleCard`.
2. Preencher as peças dos 1.414 no `data.ts` (campo opcional; quem não tiver
   cai num rosto neutro sorteado pelo nome — nunca fica sem cara).
3. ↩️ **Reverter é fácil**: é um arquivo novo + um campo opcional no baralho.
   Tirando o campo, a carta volta exatamente como está hoje.

## 🐛 DOIS BUGS REPORTADOS PELO GIOVANI PICOLO (18/08) — ✅ CORRIGIDOS
Ele mandou áudio + prints. Os dois eram reais, e o primeiro estava escondido
num erro clássico de React.

### 1. A partir do 3º gol, o goleador novo não aparecia
Palavras dele: *"o jogo registra dois gols; quando sai o terceiro ele fica meio
que dando aquela tremidinha e não mostra quem fez o terceiro"*. No print: **3 a 0
mostrando só os dois primeiros**.

**A causa não era a rolagem — era o LUGAR onde o componente estava declarado.**
`GoalsCol` nascia DENTRO do `LiveScoreCard`. A cada render ele virava um
componente NOVO pro React, que desmontava e remontava a subárvore — e a animação
CSS voltava pro zero. Como o placar ao vivo re-renderiza **a cada tique do
relógio**, a rolagem reiniciava várias vezes por segundo e nunca saía do lugar.
A "tremidinha" era exatamente esse reinício.

**Corrigido:** `GoalsCol` foi pra fora do componente (escopo do módulo), então é
o MESMO entre renders e a animação corre até o fim. De quebra: a duração agora
cresce com o número de gols (7s fixos ficavam rápidos demais numa goleada) e a
janela tem a altura EXATA de 2 linhas (`GOL_LINHA * 2`), que antes cortava.

⚠️ **Lição pra próxima sessão:** componente declarado dentro de outro componente
**quebra qualquer animação CSS** em tela que re-renderiza sozinha. Se aparecer
"animação tremendo/reiniciando", é o primeiro lugar pra olhar.

### 2. O aviso dizia 24 clubes, mas o ranking mostrava 20
Palavras dele: *"veio o aviso que são 24 clubes de acordo com o ranking. Só que
no ranking tem 20 times, aí fica meio complicadinho"*.

Ele estava certo: a Copa do Mundo passou a levar o **TOP 24** (mudança da outra
sessão, 17/08), mas a tela do **RANKING GERAL** continuou com `slice(0, 20)`.
Quem ficava em **21º-24º se classificava e não se via na lista**. É a MESMA
família do bug de 10/08 (o que aparece na tela ≠ o que qualifica).

**Corrigido:** o Ranking Geral mostra **24**, a legenda diz *"os 24 primeiros
pegam vaga na 🌍 Copa do Mundo"*, e a linha do **24º ganha um corte tracejado
roxo** marcando a última vaga.

## 🏅 RANKING VIROU PONTUAÇÃO (decisão do Diego, 17/08) — ✅ NO AR
Antes o ranking era uma **fila de desempate**: olhava a Copa do Mundo; se
empatasse, a Série A; depois a Copa… O problema apareceu quando o Diego viu um
time com **1 Copa do Mundo e mais nada** na frente de quem tinha **44 Séries A** —
porque o 2º critério nunca chegava a ser comparado.

**Agora cada título vale ponto e o ranking SOMA:**

| Título | Pontos |
|---|---|
| 🌍 Copa do Mundo | **200** |
| 🏆 Copa do Brasil | **30** |
| 🏆 Série A | **20** |
| 🏆🔵 Supercopa | **15** |
| 🏆 Série B | **10** |
| 🏆 Série C | **5** |
| 🏆 Série D | **3** |
| 🌱 Várzea | **1** |

Empatou nos pontos, o 💰 desempata (como já era).

**Por que esses pesos** (medido nos 10 melhores, não chutado):
- **Copa > Série A (30 × 20)**: TODOS os 10 melhores ganham **menos Copa do que
  Série A** — Xurupitas 23% × 35%, Paduz 33% × 56%. Mata-mata perdoa menos que 38
  rodadas. A razão medida (~1,4-1,5×) bate com 30/20.
- **Supercopa < Série A (15)**: é **UM jogo**, e você só entra nela por já ter
  ganho a liga ou a copa — o ponto grande já veio antes.
- **Mundo 200**: endgame (só da T100, 1 a cada 10 temporadas). Vale 10 Séries A.
  ⚠️ Fica registrado que ele tem MUITA sorte no meio: entre os melhores, o
  aproveitamento vai de **0%** (Império Samambaia, 8 chances) a **62,5%** (5°
  Série "B"). Quem escolhe o país primeiro pega o Brasil e passeia.
- **Supercopa NÃO dá pra medir por raridade hoje**: ela é recente. O Xurupitas
  jogou **750 temporadas** e tem 11; o Império jogou **179** e tem 43. O número
  dela mede idade da funcionalidade, não dificuldade. Remedir daqui a 1-2 meses.

### ⚠️ SÃO TRÊS LUGARES, e os três TÊM que usar a mesma conta
`PTS_TITULO` + `pontosDeTitulos()` em `pyramidseason.tsx` são a fonte única:
1. **Ranking global** (`cmpRank`) — o mural entre contas;
2. **Ranking Geral do save** (o `rows.sort` do top 20 da carreira);
3. **O mural que classifica pra COPA DO MUNDO** (o `rws.sort` do top 24).

O nº 3 é o perigoso: **é ele que decide quem entra na Copa do Mundo**. Se as
ordens discordarem, a pessoa vê uma colocação e se classifica por outra — foi
exatamente o bug de 10/08. Mexeu numa, confere as três.

### O que mudou na prática (rodado nos dados reais)
Quem ganha **Copa** subiu, quem vive de **Supercopa** desceu: Paduz 8º→6º,
Marinheiros 9º→11º→ subiu vs a 1ª ideia, FLAMENGO SAF (Diego) 14º→12º; Império
Samambaia (43 supercopas) e Tôka10 (34) desceram. O topo (Xurupitas, Derisvits,
Dérick) não mudou — monstro é monstro em tudo.

**Na tela:** as duas tabelas ganharam a coluna **PTS** com o total de cada um, e
a legenda agora explica quanto vale cada troféu — ninguém precisa adivinhar por
que está naquela posição.

**Reverter:** é um commit isolado; `git revert` volta pra fila de desempate.

## 🐛🌍 BUG ACHADO PELO DIEGO (17/08): Copa do Mundo VAZAVA pra carreira nova
Ele estranhou no ranking global: o **"Real Manha"** aparecia lá em cima, acima de
gente com **A44 + Copa33**, tendo **só 1 🌍 Copa do Mundo e nenhum outro título**.
Conferido no código e no banco — não era impressão.

**Duas coisas diferentes, e só uma é bug:**

1. ✅ **NÃO é bug o Mundo passar na frente de tudo.** A ordem do ranking é regra
   do Diego (16/08) e está escrita na própria tela: 🌍 Copa do Mundo › 🏆 Série A
   › 🏆 Copa › 🏆🔵 Supercopa › B › C › D › Várzea › 💰. É uma fila de desempate —
   **1 Mundo passa na frente de QUALQUER quantidade de Série A**.
2. 🐛 **É bug ele TER o Mundo.** A Copa do Mundo só desbloqueia na **temporada
   100** (`COPA_ANCHOR` em `copa-mundo.tsx`). O Real Manha tem `world_titles = 1`
   **desde a temporada 1** — o que nenhuma regra do jogo permite.

**Causa:** `state.copaMundoMural` **não era zerado ao começar carreira nova**. Os
dois blocos de "FAXINA ANTI-HERANÇA" do `store.tsx` limpavam honras, copas,
supercopas, agência, elencos de CPU… e esse campo tinha ficado de fora. Quem
ganhou um Mundo numa carreira antiga levava o título pra carreira nova — e, como
🌍 é o PRIMEIRO critério, a carreira recém-nascida (sem título, sem dinheiro)
pulava pro TOPO do ranking mundial. Mesma família do bug "Copa21 em 8
temporadas" (04/08).

**Corrigido:** `s.copaMundoMural = undefined` nos dois blocos de reset.

**Tamanho do estrago (medido, não estimado):** de **646 linhas** do ranking com
Copa do Mundo, só **9** estão antes da T100 — e são todas da **mesma carreira, de
uma conta só**. Ou seja: raro, mas real, e bem visível porque joga a pessoa pro
primeiro lugar do mundo.

✅ **ZERADO (17/08, com OK do Diego):** `update esc_pyramid_rank_snap set
world_titles = 0 where world_titles > 0 and season_no < 100` — 9 linhas, todas da
career_id 261025288. Conferido depois: **0 linhas tortas**, e a menor temporada
com Copa do Mundo agora é a **115** (dentro da regra da T100).

🛡️ **E foi posto um cinto de segurança**, senão voltava sozinho: o UPDATE limpa o
banco, mas o mural continua no APARELHO do jogador — na próxima temporada dele o
jogo regravaria `world_titles = 1`. Agora a contagem do rank só aceita edição que
**cabe na carreira**: `m.season >= 100 && m.season <= seasonNo` (a Copa não existe
antes da T100, e ninguém ganha uma edição futura — mesmo princípio do "ninguém vê
o futuro de ninguém" que o ranking já usa). Isso **limpa sozinho** qualquer save
já contaminado na próxima temporada jogada, sem ninguém precisar mexer no
aparelho de ninguém.
## 🌍 COPA DO MUNDO VIROU 24 SELEÇÕES (17/08) — ✅ NO AR

A Copa era de **20 seleções** (4 grupos de 5). Agora são **24** (4 grupos de 6).
Entraram **Croácia, Dinamarca, Peru e Equador**, cada uma fechando as 22 cartas.

**Como a decisão foi tomada** (pra outra sessão não refazer a conta):
- Só entra na Copa quem tem **22 cartas** no molde `2 GOL · 4 LAT · 4 ZAG ·
  6 MEI · 6 ATA`. Antes eram exatamente 20 seleções nesse patamar.
- Com 20 vagas fixas, completar 2 seleções novas **derrubaria 2 antigas**
  (o desempate é ordem de inserção, não mérito — cairiam Coreia do Sul e Japão).
  Por isso subimos as vagas junto: 24 seleções ↔ **TOP 24 do ranking de clubes**
  (os dois números andam JUNTOS, `COPA_TEAMS` e o `slice` do gate).
- O Diego escolheu as 4: começou com Equador/Peru/Suécia/Dinamarca, **vetou a
  Bolívia** ("muito ruim") e depois **trocou a Suécia pela Croácia**.
- Hoje há exatamente 24 seleções com 22+; a 25ª tem 4 cartas. O corte no top 24
  é limpo (tem um abismo natural ali) — não é corte arbitrário.

**⚠️ Regra nova do Diego (17/08) — em que baralho a carta nasce:**
> *"colocar esses jogadores no jogo mas de maneira inteligente.. Trauco por
> exemplo no Flamengo no ano certo então é baralho do Brasil mas seleção Peru"*

A carta nasce no baralho de **ONDE O CARA JOGOU** (BR/EU/MUNDO), e a
**nacionalidade** vem da etiqueta em `paises.ts`. Os dois são independentes.
Por isso a leva ficou espalhada: 45 no EU, 17 no MUNDO, **3 no BR** (Trauco e
Cueva no Peru, Erazo no Equador). O `countryPool` da Copa já varre os três
baralhos e junta pela etiqueta, então isso funciona sem gambiarra.

**O que foi mexido:** `data.ts` (blocos `L24_BR_*`, `L24_EU_*`, `L24_WORLD_*`) ·
`paises.ts` (65 etiquetas + as 29 que estavam faltando, abaixo) ·
`copa-mundo.tsx` (`GROUP_SIZE 5→6`, textos "TOP 20"→"TOP 24") ·
`pyramidseason.tsx` (`slice(0, 20)`→`slice(0, 24)`).

**Conferido antes de subir:** as 4 seleções batem 22 exatos no molde certo e
escalam 4-3-3 e 4-4-2 · zero carta repetida (nome+clube) · zero carta sem país ·
grupo de 6 dá turno completo (5 rodadas, 15 jogos, todos se enfrentam 1×, e
**cada seleção joga 5 jogos em vez de 4** — no grupo de 5 sobrava um "bye").
O mata-mata NÃO mudou: top 2 de cada grupo = 8 → quartas/semi/final.

**Antes disso, no mesmo dia:** 29 cartas dos baralhos EU/MUNDO estavam **sem
etiqueta de país** (caíam em `'??'` e sumiam da contagem de seleção). Corrigidas
— entre elas Rakitić, Perišić, Mandžukić, Brozović e Kovačić, que sozinhas
puxaram a Croácia de 3 pra 8 cartas e mudaram a ordem da fila.

**⏳ Próximas da fila** (se o Diego quiser 28 um dia): Bolívia, Polônia, Costa
do Marfim, Egito, Arábia Saudita — todas com 4 cartas, faltando 18 cada.
A Bolívia está **vetada** por ele.

## 🃏 BAFO — ✅ CODADO INTEIRO (17/08), invisível pra todo mundo menos o Diego

O modo abaixo foi desenhado no dia 17/08 e **está codado do começo ao fim** —
passos 1 a 5. Trava por conta: `SALA_ELENCO_TESTERS` em `src/escalacao/sport.ts`
(só `diego.c.fonseca@gmail.com` vê o modo). O leilão normal **não foi tocado**.

### O que já está de pé
1. **Modo na criação da sala** (`🃏 Bafo`, ao lado de Leilão e Carreira) + a Copa
   sai da tela (o Bafo é só a liga de 38 rodadas) + **🃏 Valendo carta / 🤝
   Amistoso** (escolha do host). Sala antiga/sem o campo = **valendo**.
2. **Escolha da carreira dentro da sala** (`BafoEscolha`), com a trava dos 11
   explicada e o caminho pra destravar, por porta (elenco × cofre).
3. **A escolha vai pro banco** (coluna `bafo` jsonb em `room_players`) e o host vê
   quem está apto (`✅ N jog.` / `⏳ montando`).
4. **Trava do início**: o botão só liga com **2 times montados**; se alguém ainda
   está montando, abre o banner *"Ainda tem gente montando — seguir sem eles ou
   aguardar?"*. Quem não montou **sai da sala antes da renumeração** — nunca
   entra em campo com time sorteado.
5. **A partida começa SEM leilão**, com os times trazidos (ids novos por carta,
   `bafo{mgrId}-{i}`, pra não colidir com o save do adversário).
6. **A CASCATA no fim** (`BafoCascata` em `screens.tsx`) + a troca de dono de
   verdade no servidor.

### Como a troca de dono funciona (conferido no banco, com teste)
- Função `bafo_cascata(p_room, p_ordem, p_casa)` no Supabase, `security definer`.
  **Só o host** chama (`auth.uid() = game_rooms.host_id`), **uma vez por sala**
  (trava na tabela `esc_bafo_trocas`, que também guarda o resultado — todo mundo
  da sala lê a MESMA cascata).
- Ela **muda o `user_id` da linha em `user_cards`** e **re-etiqueta o
  `season_key`** pro seed da carreira do vencedor (`co:solo{seed}:bafo{CODIGO}:{i}`),
  então a carta some do cofre de um e aparece no do outro — inclusive no filtro
  "esta carreira" do álbum.
- Colunas novas em `user_cards`: `taken_from`, `taken_from_name`, `taken_at`. O
  álbum mostra **"🃏 arrancada do Fulano"** embaixo da carta, pra sempre.
- **Piso de 1**: quem tem 1 (ou 0) carta naquela carreira **não entrega**; a casa
  cobre e o de cima ganha uma carta do baralho que ele ainda não tem (o jogo
  manda os candidatos em `p_casa`, porque o servidor não conhece o baralho).
- **Teste rodado no banco de produção dentro de transação com ROLLBACK** (nada
  ficou gravado): 3 técnicos, um deles com carta única. Resultado — cascata certa
  (3º→2º→1º), piso respeitado (a carta única ficou), marca gravada, carta da casa
  sem `taken_from`, **2ª chamada devolve o mesmo e não move nada** (idempotente),
  convidado barrado, deslogado barrado, ordem com repetido barrada.
- **No aparelho**, o cofre da carreira (`empresarioCards`, que mora no save) é
  ajustado por `patchCareerCofre()` — cada celular aplica só o que é DELE,
  idempotente por chave da troca, e **sem quebrar o lacre** (o carimbo é feito de
  moedas/títulos/divisão/temporada, o cofre não entra nele).

### ⚠️ O que ainda NÃO está resolvido
- **Se o host sair antes da tela do fim, a cascata não fecha.** Nenhuma carta
  troca de dono (é seguro), mas o convidado vê o aviso *"o host precisa chegar
  nesta tela"*. Fechar sozinho exigiria um robô no servidor.
- **Host-autoritativo, como o resto do jogo**: a ordem da cascata é a que o
  aparelho do host manda. O servidor confere que são jogadores daquela sala e que
  não tem repetido, mas não recalcula a tabela. Mesmo modelo do leilão.
- **`patchCareerCofre` só mexe no aparelho de quem está na tela.** Se a pessoa
  nunca voltar, o **álbum já está certo** (o servidor mandou), mas o cofre do save
  dela fica desatualizado até a caixa de entrada existir (ver abaixo).
- As **duas decisões abertas** continuam abertas (fim desta seção).

### 🔁 Dá pra reverter?
Sim, em dois níveis: (1) o modo inteiro some pra todo mundo com uma linha em
`sport.ts`; (2) o commit é isolado — `git revert` volta o código sem tocar no
leilão. O que **não volta sozinho** é carta já trocada de dono (por design: "não
tem como desfazer" foi a decisão). Se precisar, dá pra desfazer no banco à mão
(`taken_from`/`taken_at` dizem exatamente o que foi, de quem e quando).

## 👔🃏 SALA DE ELENCO — o desenho original (17/08), pra consulta

Ideia dele, e é a melhor que apareceu na conversa: **no rápido online, em vez de
leiloar, cada um traz o time da PRÓPRIA carreira**. Resolve três coisas de uma
vez — a carreira ganha plateia (hoje você monta um elenco por 179 temporadas e
**ninguém nunca vê**), o veterano joga com amigos **sem repetir o pregão** (o
enjoo que o próprio Diego relatou), e a partida com amigos passa a caber em
minutos.

Mockups aprovados: `scratchpad/lobby-a.png` (lobby) e `lobby-b.png` (a cascata).

### 🎛️ O LOBBY
Ao criar a sala, o host escolhe o modo: **🔨 Leilão** (como é hoje) · **👔 Elenco
da carreira** · **🧢 Convocar 22 do cofre**. Depois, **já dentro da sala**, cada
um (host inclusive) faz o mesmo caminho:

1. **escolhe QUAL carreira** traz (o save já guarda várias em `careers[]`);
2. **escolhe como entra**: os 22 do elenco atual **ou** 22 convocados do cofre;
3. vira **✅ apto**.

- **Mistura pode**: quem trouxe elenco joga contra quem convocou agenciados. Pro
  motor são 22 cartas dos dois lados; é escolha de arma.
- **Mínimo pra começar**: host + pelo menos 1 apto (a regra que a sala já tem).
- **Se o host tentar começar com gente faltando**, abre o banner no MESMO padrão
  do leilão (`waitingFor` → *"Faltam lacrar: X, Y"*): diz quem falta e oferece
  **aguardar** ou **seguir sem eles**. Quem não montou **fica de fora da partida**
  — nunca vira bot com time sorteado (regra do Diego: nada de perna-de-pau
  entrando em campo por regra nova).
- **Trocar de carreira depois de apto volta pra "montando"** — senão entra o
  time errado.
- **Mínimo de 11 jogadores** pra ficar apto (elenco ou convocados). Quem não tem
  **entra na sala mesmo assim** e vê a trava explicada, com o caminho:
  *"Sua carreira tem 8 jogadores — precisa de 11. Jogue mais uma temporada ou
  convoque 11 do cofre."* Na lista do host ele aparece como **⚠️ sem elenco**,
  não como "pensando". E o card da sala já avisa antes de entrar.

### 🔻 O PRÊMIO: a cascata (regra do Diego, e é melhor que a minha)
Eu propus pares (1º↔último); ele corrigiu pra **cascata**, que é melhor:

> **Cada um paga uma carta pro que está logo acima.** Só o 1º não paga; só o
> último não recebe.

Com 5: 5º→4º→3º→2º→1º. Saldo: **+1 só pro campeão, −1 só pro lanterna, o meio
troca**. Com 2 pessoas vira "1º pega do 2º" **sem precisar de regra especial**.
Uma regra só, de 2 a 20 — e todo mundo tem os dois lados (medo de cair, vontade
de subir).

- **É SORTEIO**, não escolha (decisão dele) — e sorteio **entre as cartas
  DAQUELA carreira**, não do álbum inteiro. Ponto que ele levantou: *"o João pode
  ter uma carreira com 3 cartas e um álbum com 500"*.
- 🛡️ **Piso de 1 carta: ninguém zera.** Quem está com 1 ou 0 não perde nada e
  **a casa cobre** (o de cima ganha uma carta do baralho que ainda não tem).
  Isso importa: **37% das contas não têm nenhuma carta**, e punir justo o mais
  frágil piora o número que o modo quer melhorar.
- Toda carta trocada fica **marcada**: *"arrancada do Tôka10 · 17/08"*.
- 🎛️ Host **liga/desliga "valendo carta"** ao criar a sala.

### ✅ O QUE DÁ e ❌ O QUE NÃO DÁ (conferido no banco, não é achismo)
- ✅ **Roubo no ÁLBUM dá.** `user_cards` é gravado **linha por linha** no servidor
  (`resilientWrite`, uma linha por carta) e tem leitura pública. Uma função no
  banco move a linha e **não tem como desfazer**.
- ✅ **Dá pra saber de qual CARREIRA é cada carta**: o `season_key` traz o seed —
  `co:solo791372628:178`. Medido: **30.187 cartas** do jogo seguem esse formato.
  Prova numa conta real (leodiniz85): álbum de 108 cartas → **85 da carreira
  791372628** e **23 da 915673221**. Filtrar por carreira é uma linha de SQL.
- ❌ **Tirar do ELENCO da carreira NÃO dá** (hoje). `esc_pyramid_saves` é
  **upsert do save inteiro** feito pelo aparelho do dono → o celular dele
  sobrescreve por cima. **Isso não é teoria**: em 16/08 eu troquei o nome do time
  do Gabriel direto no servidor e **o aparelho dele desfez em 3 minutos**.
  - O que faltaria: uma **caixa de entrada no servidor** — mudanças pendentes que
    o aparelho APLICA ao abrir, em vez de sobrescrever cego. É **a mesma peça que
    falta pra trocar o nome do clube**, que já está pendente. Não é trabalho
    perdido: resolve os dois.
- ⚠️ **10.330 cartas vieram de jogo rápido** (sem carreira) e **3.776 de formatos
  antigos** — essas ficam **fora** do sorteio, não pertencem a carreira nenhuma.
- 🔧 Falta uma **coluna nova** em `room_players` pro convidado mandar os 22 pro
  host (migração pequena). O `is_ready` **já existe** na tabela — hoje entra
  sempre `true`, é só passar a usar de verdade.

### 🚫 TETO DE FORÇA — DESCARTADO pelo Diego (17/08)
Eu insisti duas vezes num teto (orçamento por time, usando o `valorOficial` que
já existe) porque **o cofre pode ser mais forte que o elenco**: o pacote de
campeão sorteia *"entre todas as cartas do jogo"*, então quem foi campeão 30
vezes tem 30 sorteios no baralho inteiro — inclusive Lendas que ele nunca
compraria no leilão. **O Diego decidiu que NÃO tem teto.** Fica registrado que a
consequência é conhecida e aceita: **quem construiu mais ganha mais**, e novato
em sala de veterano toma baile.
- Alternativa guardada, se um dia incomodar: **mostrar a força de cada time no
  lobby** — informação em vez de trava, pra pessoa decidir se entra.

### ✅ DECIDIDO pelo Diego (17/08) — as duas últimas dúvidas fecharam
1. **Quem não pode jogar SÓ VÊ O CONVITE.** Palavras dele: *"quem não tem só vê o
   convite de começar carreira ou completar time"*. Nada de elenco emprestado,
   nada de time sorteado. São dois textos, um por caso:
   - **nunca começou carreira** → convite pra começar (e volta pra sala depois);
   - **começou, mas nenhuma carreira tem 11 no elenco NEM 11 no cofre** → convite
     pra completar o time, dizendo o que falta em cada carreira.
   Nos dois casos a pessoa **fica na sala assistindo** — não leva porta na cara.
2. **O sorteio vale o COFRE DA CARREIRA** (inteiro), não só os 22 convocados —
   e nunca o álbum todo da conta. Já era assim no código (o filtro é
   `season_key like 'co:solo{seed}:%'`); agora está escrito na tela também.

## 🔨 A MESA DO MARTELO — visual APROVADO, falta codar (17/08)

Ideia do Diego, a partir de uma imagem que ele viu: no rápido online, os técnicos
ficam **em volta da carta** no momento do martelo, em vez da lista de hoje.
Mockups aprovados na conversa (`scratchpad/mesa*.png`, somem na troca de máquina;
os HTMLs que geraram estão descritos aqui).

⚠️ **Só do RÁPIDO ONLINE.** Não encosta na carreira.

### ✅ O que ficou DECIDIDO
1. **A mesa**: carta no meio, rivais em volta, **você embaixo** num assento maior.
2. **Escudo, não mascote**, no assento. Todo mundo já tem escudo (o automático do
   `escudos.tsx` nasce do nome), então **ninguém fica sem** — e quem batizou entra
   com a arte que pagou.
3. **Nome EMBAIXO da figura** (do lado ele corta: virava "Manfr…", "Sapek…").
4. **NADA DE REGRA MUDA — é SÓ moldura.** O Diego cortou isso com todas as
   letras (17/08): *"quero tudo igual sem mudar nada, nada nada. Só tô mudando
   visualmente o resultado da oferta que vai ser revelado, só isso, com
   animações"*.
   - ⚠️ **Correção de rota:** numa volta anterior desta conversa eu entendi que
     ele queria ESCONDER o dinheiro (tirar o `💰 {m.money}` do bloco "A sala" e os
     lances do martelo) e cheguei a montar mockup assim. **Estava errado.** Ele
     falava do caixa no mockup, não de mudar o jogo. **Fica tudo como está:** os
     lances continuam abrindo no martelo, o "A sala" continua mostrando o dinheiro
     de cada rival, o `😱 QUASE` continua dizendo por quanto. Não encostar em
     `RivalsStrip`.
5. **Cor do tier**: como o escudo ocupa o lugar do quadradinho colorido, o tier
   desce pra **barra do assento** (degradê do `APOIO_PERKS`, + `ApoioSheen` nos
   pagos). Fidelidade de tier continua sagrada.
6. **A festa de quem leva o lote** — pedido do Diego ("igual quando tem gol no
   placar"): o **mascote SALTA de dentro do escudo**, quica com confete e some
   sozinho. **Reusar o CARIMBO DO GOL que já existe** (`CARIMBO_GOL` em
   `mascotes.tsx`, no ar desde 15/08) — mesmas regras: só de quem ganha, overlay
   por cima, ~1,7 s, não adiciona passo nem espera.
   - **Quem NÃO tem mascote**: o **escudo dele** é que pula, mesmo confete. Ganha
     festa, mas sem personagem — é a diferença que vende o batismo sem cobrar
     nada na cara de quem acabou de ganhar. Palavras dele: *"a ideia é justamente
     pra comprarem hehe"*.
   - Animação **em CSS puro (0 KB)** — regra de peso do `CLAUDE.md` §5.

### 📐 Como a mesa cresce (2 → 20)
- **até 6**: assento grande (escudo 44px, nome, barra de estado).
- **7 a 12**: assento médio, 2 colunas.
- **13 a 20**: fichinhas — 5 de cada lado da carta + fileiras embaixo.
  **A carta nunca encolhe** e **ninguém some da mesa**.

### ⏳ Falta
- Decidir se os envelopes viram **todos juntos** (mockup, sem custo de tempo) ou
  **um por um** (mais suspense, ~1 s a mais). O Diego ainda não respondeu.
- Mostrar print da tela DE VERDADE (não mockup) antes de fundir na main.

## 🏆🔒 "GANHEI A COPA E O RANK NÃO CONTOU" — CAUSA REAL ACHADA E CONSERTADA (17/08)

O leodiniz85 (`leonardodiniz403@gmail.com`) insistiu que continuava sem contar —
**e ele estava certo**. O conserto de 16/08 (recibo por temporada) tapou um
buraco de verdade, mas não era este. Este é o de verdade.

### 🔍 O que acontecia
A Copa do Brasil (e a Supercopa) nascem **inteiras de uma vez**, a partir da
FORÇA dos times — e a força do time humano sai da **escalação**, lida no slot da
rodada 38.

Só que a liga joga as rodadas **0 a 37**. Quando a temporada acaba,
`state.round` vira **38** — o MESMO slot onde o jogo grava a escalação que você
salva **depois** do fim (pra começar a próxima temporada com o time montado).
Dois caminhos escreviam ali: **mexer no ELENCO** e **trocar de FORMAÇÃO**.

Resultado: você assistia à final, ganhava, ia ajeitar o time — e a **Copa
inteira era re-sorteada por baixo**. O campeão podia virar outro e o rank
contava o novo. Você via a taça na tela e o rank mostrava outra coisa.

**Medido (`scratchpad/prova-copa.mjs`, com a semente real da carreira dele):**
com UMA troca de titular depois da final, o campeão da Copa mudou em **7%** das
temporadas testadas — e no caso que mudou foi exatamente *"eu era campeão e
deixei de ser"*. A Supercopa mudava junto: é também a explicação do outro
relato, *"meu amigo nem ganhou a Supercopa e apareceu que ganhou"*.

### ❌ A 1ª tentativa foi REPROVADA pelo Diego (e ele estava certo)
A primeira versão fazia a Copa ler a escalação da rodada 37, ignorando o que
fosse salvo depois. Funcionava, mas resolvia **tirando liberdade do técnico**.
Palavras dele:

> *"O técnico tem que ter liberdade pra mudar no intervalo ou no modelo dinâmico,
> que seja... O que importa é o título: se aparecer pra ele, tem que contar.
> Não tem essa de XI não. A substituição deve contar naturalmente. E o que
> aparecer no final, se ele ganhou o título, ele ganha sala de troféu, ganha
> título nos ranks, ganha premiações. Não importa se ele substituiu ou não."*

Revertida (commit de revert no histórico) e refeita pelo lado certo.

### ✅ O conserto que ficou: congela o RESULTADO, não a liberdade
Na hora em que a liga acaba — que é exatamente quando a Copa nasce — a
escalação de cada humano é **congelada no save** (`copaXi` / `copaXiSeason`, em
`types.ts`; ação `FREEZE_COPA_XI` no `store.tsx`). A Copa passa a ser sempre
recalculada a partir dela.

Com isso:
- **chave, placares, artilheiros, campeão, Supercopa, prêmios e carta** ficam
  idênticos pra sempre — o que apareceu na tela é o que vai pro rank, pra sala
  de troféus e pra premiação;
- **o técnico segue 100% livre** pra mexer no elenco, trocar formação e
  substituir quando quiser. Nada foi bloqueado;
- **congela UMA vez por temporada e nunca regrava** (toque dublado, F5,
  re-render: não regravam). É essa trava que garante que título já visto não
  some.

**Verificado (`scratchpad/prova-copa3.mjs`):** 40 temporadas, mexendo no elenco
depois da final → **Copa inteira idêntica em 40/40** (comparando chave jogo a
jogo, artilheiro, campeão, Supercopa e prêmios). Mais a trava do reducer testada
à parte. `tsc` e `npm run build` passando.

### ↩️ Dá pra voltar atrás?
Dá: commit isolado. `git revert` e volta como estava. O campo novo no save é
opcional — save antigo sem ele funciona igual.

### ⚠️ Correção de rota: a auditoria de 16/08 errou aqui
A tabela das 120 temporadas marcava *"Campeão da Copa é estável ✅"*. **Aquele
teste estava errado**: ele mexia na escalação num slot que a Copa não lia, então
nunca reproduzia o problema. Corrigido pra ❌ lá embaixo.

### ⏳ O que este achado NÃO resolve
- As **31 Copas do leodiniz85 estão certas** no banco e no rank (conferido no
  save e nos snapshots: a Copa da temporada 178 contou, 30 → 31).
- **Título perdido no passado não tem como devolver**: quando a Copa era
  re-sorteada, o campeão anterior não ficava guardado em lugar nenhum. Não
  existe registro pra restaurar. Daqui pra frente não acontece mais.
- Falta **avisar o Leonardo** — combinar com o Diego o recado.

## 🚀 PLANO DE CRESCIMENTO — tudo aprovado 16/08, ver `docs/plano-crescimento.md`
Conversa longa do Diego em 16/08 virou doc próprio. Resumo do que foi aprovado
(detalhe, números e motivos estão no doc):

1. **Cadastro: jogar primeiro, pedir depois** — 1ª temporada roda SEM login;
   convite no fim dela; janela por cima da carreira, não manda pro lobby online.
2. **Cadastro novo**: nome do TIME + time de coração + e-mail + senha.
   O nome da pessoa sai.
3. **Nome único entre os SEUS saves**, com banner pra renomear a outra.
   Os 462 que já têm repetido ficam como estão.
4. **Renomear o clube na Presidência** — leva escudo, carimbo e o assento no
   mural da Copa do Mundo junto (senão a arte paga do batismo SOME).
5. **Ranking global**: os outros veem UMA linha (a melhor carreira); você vê a
   sua + uma linha fininha da carreira de agora, comparadas na MESMA temporada.
6. **Home enxuta** — Continuar no topo, carreira antes da partida rápida,
   "Jogar com amigos (online)" SEM número de gente online.
7. **Sala da Presidência** (4ª sub-aba do Clube) com técnicos reais e a garagem
   marcada "em breve".

Ordem combinada: janela de cadastro → continuar com esse time → 1ª temporada
livre → home nova.

**Andamento (branch `claude/denis-save-file-x1osct`, um commit por item):**
- ✅ **Item 1 — Janela de conta** (`conta.tsx` + `coracao.ts`): entrar/criar sem
  sair de onde a pessoa está; cadastro novo = nome do TIME (com "✓ livre" ao
  vivo) + time de coração + e-mail + senha. Já está na `main`.
- ✅ **Item 2 — "Continuar com esse time"** no fim da partida rápida
  (`CAREER_FROM_QUICK`): o time que ela acabou de montar vira carreira, com a
  liga inteira do jeito que estava.
- ✅ **Item 3 — 1ª temporada livre**: a carreira NÃO pede mais login pra
  começar; aviso fixo "só neste aparelho" e convite pra criar conta no fim da
  1ª temporada, mostrando o que ela já conquistou (`AvisoContaCarreira`).
- ✅ **Item 4 — Home nova**: botões de jogar antes das cartas, carreira em cima
  da partida rápida, cada botão dizendo o que ganha, "👥 Jogar com amigos
  (online)" **sem contador de gente**, e Álbum/Ranking/Manual/Apoiar numa
  fileira de ícones.
- ✅ **NO AR na `main` (16/08)** — o Diego viu as fotos e mandou publicar
  (*"Fazendo isso dps sobe a home aí"* / *"vamos fazer a home publique a home"*).
  Foi tudo junto: itens 2, 3 e 4 + o banner de novidades fora + o cadastro sem a
  promessa de manto. Cada um é um commit sozinho, então dá pra reverter um sem
  desfazer os outros.
- ⏸️ **Sala da Presidência: PARADA a pedido do Diego (16/08)** — *"eu falei pra
  não fazer isso agora, falar que fazemos depois... deixa salvo aí"*. O começo do
  código está guardado na branch **`claude/presidencia-em-breve`**, LONGE da
  `main` (ela nem compila como está — falta trocar `PURPLE` por `'#7C3AED'`
  naquele arquivo). Mockups aprovados: técnico e garagem os dois com selo **EM
  BREVE**, patrimônio do clube e sala de troféus dentro.
  **Decisão que falta do Diego:** 4 sub-abas no Clube (Estrutura · Finanças ·
  Patrocínio · Presidência) ou 3, com a Presidência engolindo o Patrocínio
  (recomendação desta sessão: 3, porque 4 fica apertado no celular e fechar
  patrocínio é trabalho de presidente).
- ⏳ Falta: nome único entre saves (§3) · renomear na Presidência (§4) ·
  ranking global melhor carreira + linha de hoje (§5) · Sala da Presidência (§7).


## 📡 MARKETING: o diagnóstico e o Radar do Reddit (16/08)
O Diego: *"o nosso marketing está muito ruim… preciso entrar no Reddit, mandar
bastante mensagem, procurar bastante comunidade — não tem como automatizar?"*.

### 📉 O diagnóstico (medido no banco, não achismo)
| Cadastros por dia | |
|---|---|
| 27/07 | **446** |
| 30/07 | 281 |
| 05/08 | 165 |
| 16/08 | **64** |

**Caiu 86% em 3 semanas.** Total: **7.200 contas**.

**Mas o jogo NÃO é o problema:** das 1.920 pessoas que entraram no pico (26 a
31/07), **91,4% chegaram a jogar de verdade**. Isso é conversão altíssima.
**A torneira é que fechou** — algo trouxe 446 pessoas num dia no fim de julho e
parou. ⏳ **Perguntei ao Diego o que foi e ele não respondeu ainda** — descobrir
isso vale mais que qualquer estratégia nova, porque já está provado que funciona
com o público dele.

### 💤 O ativo parado
- **7.202** contas com e-mail · **2.890** já jogaram carreira
- **1.196** jogaram e **sumiram há 14+ dias** ← o melhor alvo que ele tem
- **509** jogaram nas últimas 48h ← alcançáveis por recado dentro do jogo

### ✅ Feito: `npm run reddit` (`scripts/reddit-radar.mjs`)
Automatiza a parte que DEMORA — achar onde falar — **sem publicar nada**:
1. procura comunidades que combinam com o jogo (PT e EN);
2. **lê as REGRAS de cada uma** e marca 🟢 aceita divulgação · 🔴 proíbe ·
   🟡 leia antes — postar no lugar errado é o que queima o domínio;
3. acha **conversas abertas** onde alguém está pedindo justamente um jogo assim
   (responder quem perguntou nunca é spam e é o que converte);
4. gera `reddit-radar.html` pra ele abrir e sair respondendo.

⚠️ **Roda na máquina DELE** — o sandbox do Claude não alcança o Reddit (só passa
npm/pypi). Testado aqui com respostas simuladas; a lógica e o relatório
funcionam, a chamada real nunca foi exercitada.

### 🚫 O que NÃO foi feito, e por quê
O Diego insistiu 3× em disparo automático (*"escrever a mensagem aqui e chegar
automática em vários locais"*). **Não montei** — mandar o mesmo texto pra vários
subs/DMs banem o **DOMÍNIO** `leilaolegends.com`, e aí o link dele some de todo
lugar de uma vez, sem volta fácil. Trocaria semanas de trabalho por um problema
permanente. O que existe de legítimo pra esse desejo (uma escrita → vários
lugares) é **agendador nos canais DELE** (Postiz/Buffer/Metricool: Instagram, X,
Facebook, TikTok, subreddit próprio, Discord).

### ⏳ Ofertado e ainda não feito
1. **Recado dentro do jogo** — ele escreve e aparece pra quem está jogando (509
   em 48h). É o canal mais forte dele e está desligado.
2. **E-mail pros 1.196 que sumiram** (o Diego disse "do e-mail já entendi").
3. **Marcar a origem dos links** (`?de=insta`, `?de=grupo`) — hoje ele não sabe
   de onde vem ninguém, então qualquer marketing é chute.

## 👑🐛 "DE REPENTE VIREI HOST NO LEILÃO" — régua da coroa afrouxada (16/08)
Relato do Diego, ao vivo, na sala do Manfré (código `4FTOS5`, ele e o Manfré):
*"do nada apareceu na minha tela que virei host no leilão, e tive que dar lance
novamente"*.

**Conferido no banco na hora:** a sala estava sã (rodada 30, temporada 1, host =
Manfré, batimento de 1,8s). Ou seja, houve uma troca de dono e a sala voltou
sozinha — o estrago foi só o susto e o lance refeito.

**Causa:** a eleição de "host fantasma" era **rápida demais**. Ela assumia a
coroa quando: 10s sem mensagem do host + o host fora da presença + o batimento
do banco parado há **9s**. O host grava esse batimento a cada ~3s — **mas
celular que vai pro fundo (abriu o zap, tela apagou) CONGELA os cronômetros na
hora**. Com 9s, bastava o dono olhar uma mensagem por dez segundos pra o
convidado achar que ele tinha morrido. E como o Diego tem o menor uid da sala,
era sempre ELE o eleito.

O "tive que dar lance novamente" é consequência: na troca de dono, quem está na
fase de envelope reabre o input e reenvia (isso é de propósito — senão ficaria
preso como "enviado" e o setor resolvia com lance ZERO).

**Conserto (`store.tsx`):**
- batimento do host: **9s → 25s**;
- e agora exige **duas checagens seguidas** (~10s de intervalo) com o host
  sumido antes de trocar a coroa — uma piscada de rede não basta mais.
- Uma sala com o dono REALMENTE fora ainda se recupera em menos de meio minuto.

**Segunda pergunta do Diego — "e se ele demorar 45s pra dar lance, troca o
host?" — resposta: NÃO.** Com o app ABERTO o dono manda um "tô vivo" a cada 4s
mesmo parado (`host_ping`), então pode pensar o tempo que quiser. O relógio do
sumiço só corre quando o celular vai pro FUNDO (tela apagada / trocou de app),
que é quando o navegador congela os cronômetros.

Mesmo assim, apertei mais onde dói: **60s de sumiço no LEILÃO, 25s no resto.**
Trocar de dono no meio do pregão custa caro (todo mundo que já lacrou o envelope
reenvia o lance); fora dele é barato, ninguém perde nada.

### 📢 E o aviso passou a dizer a VERDADE
O Diego: *"o erro que deu com o Manfré foi isso, tive que lacrar de novo um lance
novo… aí pareceu bug brabo"*. E parecia mesmo — porque a tela **não explicava**:
- o aviso dizia *"o host anterior SAIU da sala e passou o comando"*. **Mentira**:
  ele não saiu nem passou nada, o celular dele foi pro fundo;
- e **não falava uma palavra sobre o lance** que tinha acabado de sumir.

Agora o aviso conta o que aconteceu de verdade e, **só quando a virada pega o
pregão**, abre uma tarja vermelha com o porquê e o caminho (regra do Diego):
*"🔨 Dá o seu lance de novo neste setor. Na troca de comando os envelopes voltam
pra mão de cada um — se ficassem lacrados no dono antigo, o setor fecharia com
lance ZERO. Ninguém viu o que você tinha mandado: lance secreto continua
secreto. 🔒"*

### 🚨 O Diego achou algo PIOR olhando isso (e estava certo)
*"Mas as outras pessoas da sala teriam que dar lance e não entenderiam nada… o
novo host ainda vê essa msg. Tem necessidade mesmo de dar de novo lance?"*

Fui atrás e havia **dois furos**, não um:

**1. Lance ZERO silencioso (grave).** `BECOME_HOST` só fazia `isHost = true`. O
novo dono **herdava a LISTA de quem já lacrou**, mas **não os envelopes** — os
lances secretos só existiam na memória do dono antigo e nunca trafegam. Se o
setor fechasse assim, **todo mundo que já tinha lacrado entrava com lance ZERO** e
perdia o jogador calado. Bem pior que reenviar.
**Conserto:** ao assumir DENTRO da fase de envelope, o novo dono fica só com o
PRÓPRIO lance (que está no aparelho dele) e devolve o envelope dos outros, que
reabre na tela de cada um. Fora da fase de envelope, não mexe em nada.
Testado (`scratchpad/teste-becomehost.mjs`), 4/4.

**2. Quem NÃO virou host não via explicação nenhuma** — o aviso grande só
aparecia pra quem pegou a coroa. Os outros viam o botão de lance voltar do nada.
**Conserto:** um vigia percebe quando o MEU envelope estava lacrado e deixou de
estar, ainda na fase de envelope, e mostra a tarja com o porquê e a garantia de
que ninguém viu o lance.

**E respondendo a pergunta dele — "tem necessidade mesmo?":**
- **Pra quem virou host: NÃO, e isso foi consertado.** O lance dele está no
  aparelho dele; agora ele segue lacrado.
- **Pros outros: hoje sim.** O lance deles só existia no aparelho do dono que
  sumiu. Acabar com isso significa **gravar o lance secreto de todo mundo** em
  algum lugar, nem que por segundos. **Decisão do Diego — não mexi.**

## 👥🐛 RÁPIDO ONLINE: fantasma no leilão + partida que não contava (16/08)
Relato do Diego jogando com dois amigos (B e C), passo a passo dele:
1. Acabou a liga + Copa dos 8. O **amigo C saiu** da sala e não votou. Certo.
2. O host começou o **novo leilão** com o amigo B — e **o amigo C entrou junto**,
   mesmo tendo saído e sem ter votado. Ele ficou aparecendo no pregão e
   **atrasando todo mundo**; o host teve que ir no "gerenciar" e remover na mão.
3. Depois disso, jogaram a **2ª partida** (só ele e o B) — e ela **não apareceu**
   no Hall da Fama da sala.

### ✅ Bug 1 — o fantasma no leilão (`screens.tsx`, `startLeilao`)
A montagem do novo leilão lia `room_players` **do banco**, que guarda todo mundo
que um dia entrou na sala. Quem fechou o app continuava lá, então ganhava assento
de novo e o pregão ficava esperando o envelope de alguém que nem estava.

**Régua nova:** entra quem está **online agora** (presença) **ou quem votou**
(votar prova que estava lá) — e o host sempre. É a MESMA régua que a lista de cima
da tela já usa pra marcar "🚪 saiu", então o que o host vê é o que acontece.
**Trava de segurança:** se a presença não chegou (realtime caindo), **não corta
ninguém** — melhor um a mais, que o host remove, do que cortar quem estava
jogando. E o host recebe um aviso dizendo quantos ficaram de fora: nada acontece
no escuro. Testado nos 5 casos (`scratchpad/teste-sala.mjs`), 5/5.

### ✅ Bug 2 — a 2ª partida apagava a 1ª no Hall da Fama
A linha do Hall era gravada por **(sala, número da temporada)**. O "novo leilão"
(`START_ONLINE` com rematch) **zerava o `seasonNo` de volta pra 1** — então a 2ª
partida achava a linha da 1ª e escrevia **por cima**. Só o "mesmo time"
(`REPLAY_SEASON`) somava temporada, por isso aquele caminho nunca deu problema.

**Conserto, em duas pontas:**
- `game_champions` ganhou **`match_seed`** (a semente do leilão, que muda a cada
  novo leilão) + índice único `(room_id, match_seed)`. **Partida diferente = linha
  diferente, sempre.** Linhas antigas ficam com NULL e seguem pela regra velha.
- O "novo leilão" agora **continua a contagem da sala** (`seasonNo + 1`) em vez de
  voltar pra 1 — é a próxima temporada da mesma resenha, e a linha do tempo do
  Hall fica na ordem certa.

## 🌍🏷️ RANKING GLOBAL POR CARREIRA — servidor PRONTO (16/08)
Aprovado pelo Diego com mockup (`scratchpad/rankglobal.png`). A raiz de TODA a
confusão de nomes: **o ranking identificava a pessoa pelo NOME do time**. Daí
vinham as três dúvidas dele de uma vez (dois saves com o mesmo nome, deixar ou
não renomear, separar ou não os modos). A resposta é uma só: **a identidade
passa a ser CONTA + CARREIRA; o nome vira só a plaquinha.**

### ✅ Feito (invisível — nenhuma tela mudou)
1. **`esc_pyramid_rank_snap` ganhou `career_id`** (o *seed* do save, o mesmo
   número que separa "Minhas carreiras"). Chave nova:
   `(user_id, career_id, season_no)` — era `(user_id, season_no)`, e por isso
   duas carreiras da mesma conta se apagavam. Linhas antigas ficaram com
   `career_id = 0`: **ninguém perdeu nada**, e o cliente velho (quem não
   recarregou a página) continua escrevendo normalmente em 0.
2. **`esc_pyramid_rank` / `esc_pyramid_my_rank` reescritas**: cada carreira vira
   uma candidata (a foto mais nova dela) e de cada pessoa entra **só a MELHOR**,
   pelo mesmo desempate do rank local (Mundo · A · Copa · Supercopa · B · C · D ·
   Várzea · $). Antes entrava a carreira com a temporada mais ALTA — era a
   reclamação do Diego: *"o cara se matou pra gabaritar e quando faz uma nova não
   conta mais as coisas dele?"*.
3. **`esc_pyramid_career_rank` (NOVA)**: diz em que posição a carreira que você
   está jogando AGORA ficaria. É a linha fininha roxa do mockup — **só a própria
   pessoa vê, não entra na tabela e não empurra ninguém**.
4. **Cliente já manda o `career_id`** no snapshot (`pyramidseason.tsx`).

### ✅ A TELA (16/08) — regra final do Diego, invertida na segunda rodada
O Diego mudou o desenho depois do 1º mockup: *"pro usuário que tá jogando deve
mostrar a carreira dele ATUAL na linha principal, e a linha abaixo mostrar a
melhor caso esteja melhor"*. Mockup aprovado: `scratchpad/rankglobal2.png`.

- **Sua linha grande é a carreira de AGORA**, na posição que ela merece hoje. A
  lista é reordenada localmente pelo mesmo critério do servidor (`cmpRank`), pra
  a posição que você vê ser a de verdade.
- **Logo embaixo, colada, a fininha roxa**: `↳ sua melhor: 3º · Coringas do
  Diniz` com os troféus dela. **Some sozinha** quando a de agora vira a melhor.
- **Não ocupa posição** e **ninguém mais enxerga** — os outros continuam vendo
  uma linha por pessoa (a melhor dela).
- ⚠️ **Setinha ▲▼ arrumada junto**: ela compara com a temporada passada, onde
  cada um estava com a MELHOR carreira. Se comparasse com esta lista, todo mundo
  entre as duas posições ganhava um ▲1 FALSO só porque você trocou de carreira.
  Agora a seta dos outros sai da posição deles entre as melhores, e a sua linha
  não leva seta (a carreira de agora não tem "ontem" pra comparar).
- Fotografado na tela de verdade (`scratchpad/rr-4-tabela.png`), com as
  respostas do servidor simuladas — o navegador desta máquina não alcança o
  Supabase.

### ⏳ Falta (só depois de OK visual do Diego)
- **Renomear o clube na carreira** — agora é seguro: o título está preso na
  carreira, não no nome.
- **Nome único entre os seus saves** — com a identidade consertada, isso deixa de
  ser obrigatório; virou preferência do Diego, ainda sem decisão.

## 🏆🐛 TÍTULO DE COPA QUE SUMIA — ACHADO E CONSERTADO (16/08)
Dois relatos que chegaram pro Diego: *"ganhou a Copa do Brasil e não contou"* e
*"um amigo dele nem ganhou a Supercopa e apareceu que ganhou"*.

### ✅ O bug REAL, reproduzido e consertado
Em `store.tsx` existia uma "cura" de 04/08 (feita pra um bug antigo em que
carreira nova herdava as Copas da anterior). Ela rodava **toda vez que a pessoa
CONTINUAVA a carreira**: somava as Copas de TODO MUNDO e, se a soma passasse do
número de temporadas, **jogava tudo fora** e reconstruía as Copas do jogador só
pelos recibos de CARTA. **Quem ganhou a Copa e não pegou a carta perdia o
título.**

**Medido no teste (`scratchpad/teste-copa.mjs`):** save com **3 Copas + 2
Supercopas** → depois de simplesmente CONTINUAR a carreira: **0 e 0**.

**Conserto:** todo título de Copa/Supercopa agora nasce com **recibo por
temporada** (`careerCopaSeasons` / `careerSupercopaSeasons`, novos em
`types.ts`), gravado por `creditaCopa()`:
- **não duplica** — se a temporada já está na lista, não soma de novo (toque
  dublado, F5 na hora errada, dispatch repetido: nada inventa título);
- **não some** — a conta agora só SOBE, nunca desce (regra de ouro do Diego:
  *título ganho não some*). Se a lista tiver menos que o contador, quem manda é
  o contador e a lista é completada — o contrário do que a cura antiga fazia.
- **save antigo não perde nada**: a lista nasce do que já estava gravado.
- De quebra: a **Supercopa agora acompanha o rename de clube** (o mapeamento de
  nomes cuidava de liga e Copa, mas passava batido pela Supercopa — renomear
  apagava a Supercopa do clube).

### 🔬 Simulação de 120 temporadas (passando da Copa do Mundo, T100)
`scratchpad/audit-titulos.mjs` — roda o MESMO reducer e o MESMO motor de copa da
tela, e compara temporada a temporada o campeão que a tela mostra com o título
que o jogo grava, **pra TODOS os 100 clubes**, não só pro jogador:

| O que foi conferido | Resultado |
|---|---|
| Título de liga (A · B · C · D · Várzea) — todos os clubes | ✅ bate 100% |
| Copa do Brasil — todos os clubes | ✅ bate 100% |
| Supercopa — todos os clubes | ✅ bate 100% |
| Supercopa premiou quem venceu no placar (60 finais) | ✅ 60/60 |
| Campeão da Copa é estável (não muda depois de mostrado) | ❌ **este teste estava ERRADO** — ver a seção de 17/08 no topo |
| Rank local · sala de troféus · total da home | ✅ saem todos da MESMA conta (`meusTrofeus`) |
| Carta por título (liga e copa) | ✅ 1 chave única por título, nenhuma colisão |

### ⏳ Ainda em aberto (achados NOVOS desta auditoria)
1. **4 de 120 temporadas ficaram SEM Copa do Brasil** (T27, T52, T76, T80): o
   motor exige 20 times em CADA divisão e devolve vazio se faltar alguém. Num
   teste separado (`check-piramide.mjs`) a pirâmide veio completa 120/120, então
   falta achar o que difere. **Ninguém perde título por isso** — simplesmente
   não há Copa naquela temporada.
2. **2 de 120 temporadas o prêmio não caiu no caixa** — nas duas o caixa estava
   NEGATIVO (−5 e −167). Suspeita: a trava de fechamento (`booksSeason`).
3. **Supercopa continua sem dar carta** — decisão do Diego pendente.
4. **O "apareceu que ganhou" não foi reproduzido.** O motor está certo (60/60) e
   as chaves de título não trocam de dono (testado, 15 temporadas, 20 chaves).
   Suspeita principal: o **ranking GLOBAL**, onde duas carreiras da mesma conta
   colidem na chave `(user_id, season_no)` — já medido antes: 5 ocorrências.

## 📢 NOVIDADES AUTOMÁTICAS + baralho automático (16/08)
Pedido do Diego olhando a home no ar: *"as novidades lá embaixo está muito
exagerado… novidade não deve ficar sempre lá, vai reduzindo aos poucos, tem que
ser menos que metade do tamanho daquele banner"*, + *"todas novidades você vai
lançando lá automaticamente, menos bugs que nunca lance"*, + *"jogadores mesma
coisa: sempre que eu incluir, remover ou mudar níveis ou categorias, joga
automático na área de recém-lançados também"*.

**Feito:**
- `src/escalacao/novidades.ts` — a lista ÚNICA, com data. A home mostra só os
  **últimos 45 dias, no máximo 5** (`novidadesDaVez`): novidade velha some
  sozinha. **Bug nunca entra** (está escrito no topo do arquivo e no CLAUDE.md).
- `npm run novidades` (`scripts/novidades-jogadores.mjs`) — compara o baralho de
  hoje com a foto `scripts/catalogo-snapshot.json` e **escreve sozinho** quem
  entrou, quem saiu e quem mudou de nível/categoria em
  `src/escalacao/novidades-jogadores.ts`. Testado: mudei um jogador de craque
  pra lenda e ele apareceu como `Dida: craque → lenda` sem eu escrever nada.
  A foto fica FORA do `src/` — **0 KB no bundle**.
- A caixa da home caiu de **17 avisos** empilhados pra **5 linhas + o baralho**:
  **391 px** medidos na tela (era mais que o dobro disso).
- Partida rápida voltou a ser **uma linha só**, agora alinhada à esquerda igual
  aos outros dois.
- Online: **até 20** (o texto dizia 8 — estava errado, `MAX_PLAYERS` é 20).

**Pra próxima sessão:** mexeu em jogador? Roda `npm run novidades` e commita os
três arquivos juntos (`data.ts` + foto + gerado). Ligou uma feature? Escreve UMA
linha em `novidades.ts`. Consertou bug? **Não escreve nada lá.**

## 💰 AUDITORIA DAS PREMIAÇÕES ATÉ O CAIXA (16/08) — 18/18 ✅
Pedido do Diego: não bastava conferir a tabela, tinha que conferir se o dinheiro
**cai mesmo no caixa**. Teste dirige o REDUCER de verdade na virada de temporada
(`OPEN_RESERVE_LIST` com `mesmo:true`), com uma carreira solo completa (sala de
20 na Várzea, Copa do Brasil + Supercopa rodando).

Conferido e passando:
- **O extrato fecha com a variação do caixa** (soma dos lançamentos = delta real).
- Linha **"Prêmios da temporada"** = exatamente o que `seasonRewards` +
  `copaBrasilRewardsAsCopaRewards` + `scorerRewards` calcularam.
- Linha **"Cota de TV"** = a régua da divisão (A 20 · B 15 · C 10 · D 5 · V 1).
- Linha **"Folha salarial"** = a folha do elenco.
- **Cada linha tem rótulo próprio** — nada cai no rótulo genérico do `kind`
  (o render usa `e.label || lbl(e.kind)`; a TV é `kind: 'reward'` mas com rótulo
  próprio, então aparece separada dos prêmios, e não somada).
- **Trava anti-dobra**: disparar a virada 2× NÃO credita de novo nem duplica
  linha (`booksSeason`).
- Título de divisão, Copa do Brasil e Supercopa entram no histórico na virada.
- A régua de campeão + G4 conferida nas **5 divisões**: A 95 · B 75 · C 55 ·
  D 35 · Várzea 25 (campeão + zona somados).

⚠️ Armadilha de teste anotada: a **cota de TV também é `kind: 'reward'`**. Somar
por `kind` mistura TV com prêmios — comparar pelo RÓTULO.


## 🔬 SIMULAÇÃO DEFINITIVA DE 150 TEMPORADAS (16/08) — o que ela achou
Refeita a pedido do Diego. Time com as melhores lendas do jogo, começando na
Várzea, 150 temporadas. **Nada gravado no Supabase** (roda em memória).

⚠️ **A 1ª versão da simulação estava errada em 2 pontos** (registrado pra
ninguém repetir):
1. Usou `computeCopa` (Copa Legends). **Hoje é COPA DO BRASIL** — o
   `COPA_BRASIL_GERAL = true` liberou pra todo mundo, e ela vem com a
   **Supercopa** junto.
2. O mundo foi montado com `placements = { m0: 'V' }` só. A Várzea **não tem
   times de fundo no `data.ts`** (o `DIVISION_TEAMS` só tem A/B/C/D): quem
   preenche a V é a SALA do jogador. Com 1 manager só, a Várzea ficava com 1
   time e a **Copa do Brasil nem rodava** (ela exige 20 em cada divisão).
   → Ao simular carreira com escada, criar os **20 assentos da sala**.

**Resultado válido (v2):** 216 troféus · 138 cartas · 19.746 moedas de premiação.
Chegou na Série A na T5. Copa do Brasil ganha 44% das vezes (66/150) mesmo com o
melhor elenco possível — mata-mata de 100 clubes é loteria de verdade.

### 🚨 FURO ENCONTRADO — a Supercopa não dá carta
Ganhou **78 Supercopas**, ganhou **0 cartas** por elas. A conta fecha exata:
`216 troféus − 138 cartas = 78 = nº de Supercopas`. Nenhum outro troféu está
sem carta.

A Supercopa hoje: sala de troféus ✅ · rank local ✅ · rank global ✅ (desde
hoje) · **carta ❌** · **linha no `esc_results` ❌** (então não conta como
título no botão Ranking da home).

Contradiz a regra escrita no código com data do Diego: *"tudo que é campeão
conta carta" (04/08)*. A Supercopa nasceu 16/08 e ficou de fora.
~~⏳ **NÃO IMPLEMENTAR sem OK do Diego**~~

✅ **RESOLVIDO 18/08 — a carta da Supercopa está no ar.** O OK veio do próprio
Diego, do jeito que ele costuma dar: *"toda hora estão reclamando também que
não está contando carta quando você ganha a Copa do Brasil ou a Supercopa"*.
`CardCollectPrompt` com `seasonKey` sufixo `:supercopa` em `pyramidseason.tsx`,
logo abaixo do da Copa, usando o `superChamp.you` que já existia. Quem ganhar
divisão + Copa + Supercopa na mesma temporada pega as **três** cartas (as três
seasonKeys são diferentes, então uma não come a outra).
⏳ **Ainda falta** a linha em `esc_results` pra Supercopa (o botão Ranking da
home ainda não conta ela como título) — é escrita no Supabase, fora do repo.


## 🏆🔵 SUPERCOPA ENTROU NO RANKING GLOBAL (16/08)
Correção de uma coisa que eu (sessão) tinha dito ERRADO pro Diego: falei que a
Copa do Brasil "só o Diego enxerga". **Não é.** `sport.ts` tem
`COPA_BRASIL_GERAL = true` desde 16/08 ("atualiza já p td mundo") — está
**liberada pra todo mundo** e a lista de testers virou só reserva.

Consequência real: o rank **local** desempata por Mundo · A · Copa · **Supercopa**
· B · C · D · Várzea · $ (§7.3), mas o **global** não tinha nem a coluna de
Supercopa. Medido no banco: **73 pessoas já somam 396 títulos de Supercopa**.
Era ao vivo, não hipotético. E já estava anotado como pendência no
`docs/conceito-copa-brasil.md` (linha 34-35: "ranking GLOBAL — só falta a
Supercopa lá").

✅ Feito:
- Supabase: coluna `supercopa_titles` na `esc_pyramid_rank_snap` (default 0) +
  `esc_pyramid_rank` e `esc_pyramid_my_rank` recriadas desempatando por ela
  **logo depois da Copa**, igual ao local.
- `pyramidseason.tsx`: o retrato por temporada passa a gravar `supercopa_titles`;
  a linha do rank global ganhou o selo 🏆🔵 (mesmo selo do rank local) e o total
  passou a somar Supercopa **e Várzea** (faltavam os dois).
- Legenda dos DOIS rankings corrigida: a do local dizia "Série A › B › C › D e
  depois dinheiro" (ordem antiga, errada há tempo) e a do global não citava
  Supercopa nem Várzea.

⚠️ **Sem backfill de propósito**: o retrato é por temporada e a gente não sabe
EM QUE temporada cada Supercopa foi ganha. Preencher o passado com o total de
hoje quebraria a trava anti-spoiler (mostraria troféu que a pessoa ainda não
tinha naquela temporada). Cada um entra no rank com a Supercopa na próxima
temporada que jogar.


## 🌍🏆 VARREDURA DAS COPAS DO MUNDO NO RANKING (16/08) — 10 títulos devolvidos
Pergunta do Diego depois do caso do Gabriel: *"e as copas do mundo que ele disse
que ganhou e não contou?"*

**Prova usada**: o `copaMundoMural` do save de cada um (registro do próprio jogo,
com `voce: true`). É o mesmo critério do caso do leodiniz85.

**Gabriel Cozendey**: jogou 14 Copas do Mundo, ganhou **1** (temporada 480) — e
essa **já estava** no ranking, com carta (Raphaël Guerreiro). **Nenhuma perdida.**
O que ele viu foi o bug do agregado invertido (seção acima).

**Mas a varredura geral achou 10 títulos de OUTRAS pessoas fora do ranking:**
- `denilson.stifler10` — temporadas 200, 210, 240
- `eltonfrossard45` — 130, 190, 270
- `santospedreiraantonio958` — 120, 130
- `diegodsgalindo` — 160
- `zeroseisjulio` — 100

Todos de temporadas ANTIGAS (100-270): são anteriores à gravação do título de
Copa do Mundo no ranking. O mesmo denilson tem as de 320+ registradas certinho —
ou seja, é corte de época, não problema de conta.

✅ **Gravados no `esc_results` em 16/08** (autorização do Diego de 15/08: "tem que
consertar pra todo mundo"). A varredura foi **só ADITIVA** — nenhuma linha
apagada ou alterada, `on conflict do nothing`. Conferido depois: **50 Copas do
Mundo ganhas no mural, 0 fora do ranking.**

⏳ Falta (decisão do Diego): esses 10 **não ganharam a carta** de campeão da
época. Se ele quiser compensar, é ficha do Banco Legends ou moedas — dizer
quanto. (Mesma pendência aberta do leodiniz85.)


## 🐛🏆 BUG DO AGREGADO DA COPA (Gabriel Cozendey, 15/08) — CONSERTADO 16/08
Ele relatou: *"fiz 10 no agregado e contou 8"* · *"ganhei o título e deu vice
pra mim"*.

**O motor NUNCA esteve errado.** Auditado com script: 18.000 confrontos da Copa
Legends (agregado = soma dos jogos · quem passa = maior agregado · campeão =
vencedor da final · vice = perdedor da final · gols animados = placar) — **zero
erros**. Idem no motor da Copa do Mundo.

**O que mentia era a LINHA da tela.** Em `copa-mundo.tsx` o `g2` (jogo de volta)
nasce na ordem `[mandante da volta, visitante]`, ou seja INVERTIDO em relação ao
`g1` da ida. A tela escrevia `volta: {g2[0]}×{g2[1]}` cru, embaixo de um
cabeçalho `H × A`, **sem agregado nenhum**. Quem somava a coluna chegava num
total diferente do jogo — e num vencedor diferente. Medido: em **41% dos
confrontos de ida e volta** somar a coluna dava o vencedor ERRADO.

Correção (só exibição, não muda resultado nenhum):
- `copa-mundo.tsx`: helper puro **`placaresDoConfronto(t)`** devolve ida, volta e
  agregado SEMPRE na mesma ordem (H × A). A linha agora mostra o **agregado
  sempre**, não só quando vai a pênaltis.
- `pyramidseason.tsx` (`MyCopaMatch`, Copa Legends + Copa do Brasil): a volta
  saía invertida pelo mesmo motivo (pra bater com o card, que troca de lado no
  jogo de volta) e não fechava com o agregado escrito ao lado. Agora os três
  placares saem em A × B, **com os nomes dos dois times por cima**.

**O que NÃO era bug** (conferido no banco antes de responder): a carta de
campeão. Nos ~1.000 registros do Gabriel, **todo título gravado gerou carta** —
inclusive a temporada 480, em que ele ganhou os três (liga + Copa Legends + Copa
do Mundo) e recebeu as três cartas. Na noite de 15/08 ele não ganhou três: a
temporada 545 foi Copa sim, liga não. Ele acreditou que tinha ganhado por causa
da linha invertida acima.

⚠️ Regra que continua valendo (não é bug, mas vale saber): o título da Copa do
Mundo só entra no RANKING se a carreira for nova (`agenciaOn`). A carta vem de
qualquer jeito.


## 🃏⚫⚪ Batismo CORINGAS DO DINIZ (Lucas Calefi · lucas_calefi@outlook.com) — 16/08
Lenda **fundador nº44** + **sócio nº24**. ❤️ **Corinthians**, manto **branco e
preto** (só as listras). Substituiu o **Vanguarda Nacional** na Série A.
Mockup vertical aprovado pelo Diego antes de subir.

✅ **FEITO (16/08)** — código:
- `img/coringas-escudo.webp` (219×248, 30,3 KB) + `img/coringas-mascote.webp`
  (248×320, 44,0 KB). Arte **do próprio dono**, só recortada/reduzida/convertida
  — nada redesenhado. Os dois dentro dos tetos do CLAUDE.md.
- `escudos.tsx`: `coringasEscudoRender` sob `Coringas do Diniz` / `Coringas` /
  `Coringas do Diniz FC`.
- `mascotes.tsx`: `MASCOTES.coringa_diniz`, `MASCOTE_NOME` = "O Coringa",
  `CARIMBO_GOL['Coringas do Diniz'] = 'coringa_diniz'` (carimba o placar no gol).
- `data.ts`: entrada na Série A + `OLD_NAME['Coringas do Diniz'] = 'Vanguarda
  Nacional'` (save antigo é renomeado ao carregar, ninguém perde carreira).
- `apoio.tsx`: comentários atualizados (ouro nº44 já estava).

✅ **FEITO (16/08)** — Supabase (`esc_socios`, sócio nº24):
`escudo_time = Coringas do Diniz` · `mascote_key = coringa_diniz` ·
`time_coracao = Corinthians` · manto `#FFFFFF` + `#0C0C0C` · origem `batismo`.

⏳ Falta (mesma fila de todos os batismos): **festão de campeão** e **coringa do
pênalti** dependem de o `mascote_key` estar no banco — já está, então entram
na próxima carreira que ele abrir.

🎽 O arquivo `kit.webp` (228×280, 23,4 KB) da arte do manto **não foi pro repo**:
hoje o manto no jogo é listra em CSS (0 KB), não imagem. A arte fica guardada
como referência; se um dia tiver tela de uniforme, é só subir.


## 🎟️🪙 BRINDE DE BOAS-VINDAS DE SÓCIO — 39 moedas, uma vez só (16/08)
Decisão do Diego: **todo sócio que entrar ganha 39 🪙 UMA VEZ SÓ** (não é
mensal), e isso aparece **no extrato** como ganho.
- Supabase: RPC **`esc_socio_boas_vindas()`** — devolve 39 na primeira vez e 0
  nas seguintes. A trava é a PK `(email, mes)` da `esc_socio_resgates`, com a
  linha `mes = 'boas-vindas'`. Testado: 1ª = 39, 2ª = 0.
- `store.tsx`: action **`SOCIO_CREDIT`** (`motivo: 'mensal' | 'boas-vindas'`).
  O **valor vem do código** (`SOCIO_MENSAL = 30`, `SOCIO_BOAS_VINDAS = 39`),
  nunca da action — ninguém consegue pedir um número inventado.
- `types.ts`: novo `kind: 'socio'` no extrato · `pyramidseason.tsx`: rótulo
  "🎟️ Moedas de sócio" + toast amarelo somando o que caiu.

🐛 **BUG ANTIGO CORRIGIDO JUNTO**: as **30 🪙 mensais de sócio nunca caíam**.
Elas eram despachadas via `BANCO_CREDIT`, que só aceita os valores de ficha
`[10, 50, 100, 500, 1000]` — 30 não está na lista, então o reducer **recusava
em silêncio** desde 09/08. Agora vão por `SOCIO_CREDIT` e caem de verdade.
⚠️ Consequência: quem já tinha resgate marcado no servidor nos meses passados
**não recebe retroativo** (a linha do mês já existe na `esc_socio_resgates`).
Se o Diego quiser compensar, é apagar as linhas antigas da tabela ou creditar
por ficha do Banco Legends.


## 🐍🔴⚫⚪ Batismo Tricolor do Arruda FC (Geovany Souza · souzact12@gmail.com) — 16/08
Homenagem ao **Santa Cruz** (time do coração dele) e ao Arruda. Substituiu o
**Legado EC** na Série A. Dono virou **ouro/Lenda** (era prata/Craque) +
**fundador nº43**.

Feito no repo (já na main, já no ar):
- `img/arruda-escudo.webp` + `img/arruda-mascote.webp` (recortados da arte que
  o Diego mandou); registrados em `escudos.tsx` e `mascotes.tsx`
  (`mascote_key = cobra_arruda`).
- `data.ts`: `OLD_NAME['Tricolor do Arruda'] = 'Legado EC'` + entrada na Série A.
- `mascotes.tsx`: `CARIMBO_GOL['Tricolor do Arruda'] = 'cobra_arruda'` — a cobra
  **carimba o placar** quando o clube faz gol (isso funciona já, é só código).

✅ **RESOLVIDO 16/08** — gravado no Supabase por outra sessão (a que tinha o
acesso liberado), a pedido do Diego: `esc_socios` **sócio nº23** ·
`mascote_key = cobra_arruda` · `escudo_time = Tricolor do Arruda FC` ·
`time_coracao = Santa Cruz` · manto `#0C0C0C` + `#FFFFFF` (o vermelho sai do
código, `MANTO_TRI`). Conferido ANTES de gravar: a chave `cobra_arruda` existe
mesmo em `MASCOTES` e o tier ouro + fundador nº43 já estavam em `apoio.tsx` —
então nada ficou apontando pra arte inexistente. Ele não tinha linha de sócio
ainda (foi INSERT, não update). Texto original do pedido abaixo, pra histórico:

~~PENDENTE — precisa de escrita no Supabase (`esc_socios`), fora do repo.~~
Sem essa linha, DUAS coisas do batismo NÃO acontecem pro Geovany:
- o **FESTÃO de campeão** (a cobra tomando a tela após o apito) e
- a **cobra pulando no pênalti convertido**,

porque as duas leem `mascote_key` da conta no banco, não do código. Também
falta gravar o **manto**: TRÊS listras — preto → branco → vermelho
(a 3ª cor já vem do código, em `MANTO_TRI`; faltam as duas primeiras).
Valores: `p_email = souzact12@gmail.com` · `p_mascote = cobra_arruda` ·
`p_time = Santa Cruz` · manto `p_c1 = #0C0C0C` (preto), `p_c2 = #FFFFFF`
(branco) — o vermelho é a 3ª cor e sai do código. Dá pra fazer pelo painel de admin (`🎨 Personalizar sócio`) ou eu
faço se o Diego liberar o acesso ao banco (a chamada foi recusada por
aprovação pendente).

## 🧢 Batismo Crias do Bigão (giovannecastro784@hotmail.com) — ✅ FECHADO 17/08
Substituiu a **Ferroviária do Vale** na **Série B** (técnico *Seu Ferreira*
continua — só o clube muda, como em todo batismo). O dono virou **ouro 👑 +
fundador nº46 + sócio nº26**, pela regra permanente do CLAUDE.md.

⚡ O charme deste: **a mascote é o próprio dono**. O escudo é a cara dele de
boné, e a mascote é ele mesmo de uniforme chutando a bola.

**Arte** (recortada das imagens que ele mandou):
- `img/bigao-escudo.webp` — 302×360, **28,0 KB** (teto 30)
- `img/bigao-mascote.webp` — 319×440, **38,1 KB** (teto 45) — total **66,1 KB**
- 🧹 Fundo era **BRANCO** (não o quadriculado dos outros). Limpeza só a partir
  da BORDA, de propósito: aqui o branco preso dentro do desenho é **parte da
  arte** (dente, olho, brilho do escudo). É o inverso do caso Skyy, onde o
  buraco preso era fundo. **Olhar a arte antes de escolher o método.**

**Código** (os lugares de sempre):
- `escudos.tsx`: `bigaoEscudoRender` + `LOGOS_PRONTAS` nos 4 nomes
  (`Crias do Bigão` / `Crias do Bigao` / `Crias` / `Crias do Bigão FC`).
- `mascotes.tsx`: `MASCOTES.bigao` + `MASCOTE_NOME.bigao = 'O Bigão'` +
  `CARIMBO_GOL['Crias do Bigão'] = 'bigao'`.
- `data.ts`: Série B + `OLD_NAME['Crias do Bigão'] = 'Ferroviária do Vale'`
  (save antigo é renomeado ao carregar, ninguém perde carreira).
- `apoio.tsx`: ouro + `FUNDADOR_N = 46`.

**Banco** (`esc_socios`, INSERT — sócio **nº26**, permanente):
`mascote_key = bigao` · `escudo_time = Crias do Bigão` · manto **`#0E62AA`**
(azul) + **`#FCD111`** (amarelo), **medidas na camisa** que ele mandou.

**Mockup**: gerado pelo padrão (`scripts/mockup-batismo.mjs`), agora **com a
camisa DE VERDADE** que ele mandou (`scripts/kits/bigao-camisa.webp`).
🐛 Achado e corrigido no gerador durante este batismo: `line-height` apertado
no cartão dourado **cortava o til** — saía "DO BIGAO". Nome de clube brasileiro
tem acento, então isso ia acontecer de novo. Corrigido pra todos.

⏳ **Falta só o TIME DO CORAÇÃO do Giovanne** (`time_coracao` NULL).

## 🦅 Batismo Skyy FC (matheusncruz1@gmail.com) — ✅ FECHADO 17/08

O Diego mandou a arte (uma imagem só, com águia + escudo + camisa) e disse:
*"faça com o mesmo padrão de qualidade e locais pra pôr igual fizemos com
Coringas do Diniz. Aliás todas logos serão mesmo formato e ideia"*. Feito
exatamente assim.

**Arte** (recorte feito aqui, a partir da imagem única):
- `img/skyy-escudo.webp` — 348×360, **28,2 KB** (teto 30) — o escudo azul-piscina
  com a águia de asas abertas segurando a bola, borda dourada.
- `img/skyy-mascote.webp` — 354×440, **41,2 KB** (teto 45) — a águia de pé.
- **Total 69,4 KB**, dentro do teto de 75 KB. Os dois saem do bundle (viram
  arquivo à parte), como manda a regra de peso.
- 🧹 Dois passes de limpeza do quadriculado falso: o normal (a partir da borda)
  **e um segundo pra buracos PRESOS dentro do desenho** — sobrava um retângulo
  cinza entre as pernas da águia, que o preenchimento de borda não alcança. O
  segundo passe só apaga região que tem os **dois tons** do xadrez, então pena
  cinza do bicho não some. Fica registrado: **toda arte de mascote com vão
  fechado (pernas, alças, alça de caneca) precisa desse segundo passe.**

**Código** (mesmos lugares do Coringas):
- `escudos.tsx`: `skyyEscudoRender` + `LOGOS_PRONTAS['Skyy FC'/'Skyy'/'Skyy FC SAF']`.
- `mascotes.tsx`: `MASCOTES.skyy_aguia` + `MASCOTE_NOME.skyy_aguia = 'A Águia'`
  + `CARIMBO_GOL['Skyy FC'] = 'skyy_aguia'`.
- `data.ts` e `apoio.tsx` **já estavam prontos** de antes (clube na Série D,
  `OLD_NAME`, ouro 👑, fundador nº24).

**Banco** (`esc_socios`, UPDATE — ele já era sócio **nº9**, permanente):
`mascote_key = skyy_aguia` · `escudo_time = Skyy FC` · manto **`#237581`**
(azul-piscina) + **`#0D3558`** (azul-marinho) — as duas cores foram **medidas na
camisa** que ele mandou, não chutadas.

**Mockup do post**: gerado pelo padrão novo (`scripts/mockup-batismo.py`),
mandado pro Diego pra ele postar.

⏳ **Única coisa que falta: o TIME DO CORAÇÃO do Matheus** (`time_coracao` está
NULL). Sem ele o card do clube não mostra o time de coração — o resto todo
(escudo, mascote, manto e as três animações) já funciona.

## 🎬 CADA MASCOTE COMEMORA DO SEU JEITO — gol E título (17/08)
Pedido do Diego: *"na comemoração do gol cada mascote tem que ter suas
individualidades. Se é águia tem que ser algo relacionado a águia. Cada um
depende do que ele é, as coisas que faz"*.

⚠️ **Teve ida e volta, e o histórico fica registrado pra ninguém desfazer sem
querer**: no meio do caminho ele disse *"no gol tem que ser igual pra todos, o
que eu disse diferente é quando é campeão"*, eu tirei o do gol — e logo depois
ele mandou *"volte o gol como estava, que você tinha feito no anterior"*.
**Vale o estado atual: os DOIS momentos são por mascote.**

**⚽ No GOL** (`CARIMBO_ANIM` + `CARIMBO_KEYFRAMES` em `mascotes.tsx`, usados
pelo `LiveScoreCard`): antes todo mundo entrava igual (`coCarimba` — caía girado
e sumia). Agora:
- 🦅 águia `coVoa` — mergulha de cima e sobe planando de volta
- 🤡 palhaço `coQuica` — entra quicando, gingando pros dois lados
- 🐍 cobra `coRasteja` — entra pelo lado ondulando
- 🃏 coringa `coCarta` — vira no ar como carta sendo dada
- 🐝 abelha `coZumbe` · 🐶 cachorrinha `coPulinho`

**🏆 No TÍTULO** (`FESTA_JEITO`, usado pelo `FestaoMascote`): `voa` · `rasteja`
· `quica`. Quem voa plana lá no alto e **sem sombra no chão** — era o mais
errado de todos: a águia atravessava a tela **quicando no gramado**, com
sombrinha, feito bola.

🛡️ **O que NÃO mudou, e não pode mudar:** o tempo é o mesmo (1,7s no carimbo) e
nada pede toque — regra de ouro do Diego, zoeira nova nunca atrasa o ritmo do
jogo. E mascote fora das listas cai no comportamento de sempre, então ninguém
perde o que tinha e batismo novo já nasce funcionando.

⏳ **Ainda genérico de propósito**: no **pênalti convertido** o mascote pula
igual pra todos (`penJump`). O mockup também fala genérico ali — post não pode
prometer o que a tela não faz. Se o Diego quiser, é o mesmo padrão.

## 🎨 MOCKUP PADRÃO DE BATISMO — agora mora no repo (17/08)
O Diego mandou o modelo (o do Nata de SP) e foi direto: *"esse aqui é o mockup
padrão cara powww, e tem que ter as animações também"*. Então **o formato é
esse**, e virou arquivo versionado: **`scripts/mockup-batismo.mjs`**.

Antes ele era montado à mão a cada batismo e morava só no scratchpad da sessão
— o do Coringas do Diniz **sumiu** quando a máquina trocou. Agora não some mais,
e nenhuma sessão inventa layout novo.

```
node scripts/mockup-batismo.mjs \
  --clube "Skyy FC" --serie D --antigo "Fortuna SAF" \
  --escudo src/escalacao/img/skyy-escudo.webp \
  --mascote src/escalacao/img/skyy-mascote.webp \
  --mascote-nome "A Águia" --mascote-emoji "🦅" \
  --c1 "#237581" --c1-nome "azul-piscina" --c2 "#0D3558" --c2-nome "azul-marinho" \
  --dono "Matheus" --coracao "Corinthians" --fundador 24 \
  --saida /tmp/skyy-post.png
```

**A ordem do post (não mexer sem o Diego mandar):** pílula "BATISMO DE LENDA" →
manchete "NASCEU O <CLUBE>" (a 1ª palavra em vermelho) → a frase de quem é o
dono, a divisão e de quem tomou a vaga → cartão dourado com escudo + nome +
❤️ coração → **mascote e manto lado a lado** → 🎬 **"ONDE A <MASCOTE> APARECE"**,
com as **TRÊS animações** escritas pro jogador (carimbo no gol · festão de
campeão · pulo no pênalti) → rodapé com quem batizou + selos Lenda/fundador.

Detalhes de como foi feito, pra próxima sessão não penar:
- **HTML + Chromium** (Playwright), não PIL — é o único jeito de bater o
  espaçamento e o degradê do modelo. `playwright-core` está no `devDependencies`;
  o Chromium do ambiente fica em `/opt/pw-browsers/chromium` (dá pra sobrescrever
  com a variável `PW_CHROME`).
- **A Oswald de verdade** mora em `scripts/fonts/` (4 pesos, **64 KB no total**).
  Veio do npm (`@fontsource/oswald`) porque o proxy bloqueia o Google Fonts.
  ⚠️ Isso **não pesa no jogo**: é `scripts/`, nunca entra no bundle nem é baixado
  por jogador nenhum.
- **A camisa do manto é desenhada no próprio script** (SVG, listras nas 2 cores
  do clube + o escudo no peito). É molde do post, não arte de batismo — por isso
  não vale a regra de peso nem vai pra `src/escalacao/img/`.
- O artigo da mascote ("**a** Águia" × "**o** Palhaço") sai automático do nome.

## 🤡🟡⚫ Batismo Nata de SP (pedrinhocamisa8@gmail.com) — 17/08
Substituiu o **Paris São Geraldo** na Série D. Dono vira **ouro/Lenda +
fundador nº45** (regra nova: todo batismo já nasce sócio + fundador, ver
CLAUDE.md). Time do coração: **Corinthians**. Manto: duas cores, amarelo e
preto (arte enviada pelo próprio dono, sem 3ª cor).

Feito no repo:
- `img/nata-escudo.webp` (312×360, 28,3 KB) + `img/nata-mascote.webp`
  (369×440, 42,8 KB) — recortados da arte que o Diego mandou (removido o
  fundo quadriculado falso); total 71,1 KB, dentro do teto de 75 KB.
- `escudos.tsx`: `nataEscudoRender` + `LOGOS_PRONTAS['Nata de SP'/'Nata SP'/'Nata de SP FC']`.
- `mascotes.tsx`: `MASCOTES.nata_palhaco` + `CARIMBO_GOL['Nata de SP'] = 'nata_palhaco'`
  + `MASCOTE_NOME.nata_palhaco = 'O Palhaço'` — o palhaço carimba o placar no gol (funciona já, é código).
- `data.ts`: `OLD_NAME['Nata de SP'] = 'Paris São Geraldo'` + troca do time na
  Série D (`DIVISION_TEAMS.D`, mantendo o técnico "Cabeção da Vila" — só o
  clube muda, igual nos outros batismos).
- `apoio.tsx`: `FOUNDERS['pedrinhocamisa8@gmail.com'] = 'ouro'` +
  `FUNDADOR_N['pedrinhocamisa8@gmail.com'] = 45`.

✅ **RESOLVIDO 17/08** — gravado no Supabase por outra sessão (a que tinha o
acesso liberado), a pedido do Diego: `esc_socios` **sócio nº25** ·
`mascote_key = nata_palhaco` · `escudo_time = Nata de SP` ·
`time_coracao = Corinthians` · manto `#FFC400` (amarelo) + `#0C0C0C` (preto),
**duas cores só** (este batismo não tem 3ª cor, não entra em `MANTO_TRI`) ·
`origem = 'batismo'` · `valido_ate = 2099-12-31` (permanente, igual a todo
batismo/fundador — não é assinatura de 33 dias).

Conferido ANTES de gravar, pra não apontar pra arte que não existe:
`nata_palhaco` existe mesmo em `MASCOTES` e em `CARIMBO_GOL['Nata de SP']`;
`FOUNDERS` e `FUNDADOR_N` (nº45) já estavam em `apoio.tsx`; e o Pedrinho **não
tinha linha nenhuma** em `esc_socios` (foi INSERT, não update). O nº25 é o
próximo livre — o maior até então era o 24 (lucas_calefi). Depois de gravar,
conferido de novo: 25 sócios, 25 números distintos, uma linha só pra ele.

📝 Detalhe pra quem for gravar o próximo: o RPC `esc_admin_socio_perso` **não
serve sozinho** aqui — ele só faz UPDATE (dá erro *"esse e-mail não é sócio
ainda"* em quem não tem linha), não tem parâmetro pro `escudo_time`, e exige o
e-mail do Diego no JWT. Por isso o caminho foi o mesmo do Arruda: INSERT direto
na tabela. Texto original do pedido abaixo, pra histórico:

~~PENDENTE — precisa de escrita no Supabase (`esc_socios`), fora do repo.~~
Sem essa linha, o **festão de campeão** e o **palhaço pulando no pênalti
convertido** não aconteciam pro Pedrinho (leem `mascote_key` da conta no banco,
não do código), e o **card do clube do coração** não mostrava Corinthians.
Agora os três funcionam.

## 🔓🏆🇧🇷 COPA DO BRASIL LEGENDS + SUPERCOPA NO AR PRA TODO MUNDO (16/08)
Ordem do Diego: "atualiza já p td mundo pow". `COPA_BRASIL_GERAL = true`
em `src/escalacao/sport.ts` — a trava por conta saiu, vale pra todos os
jogadores. **A Copa Legends saiu de cena** (o motor dela, `computeCopa`,
continua no código mas não é mais chamado — só o histórico de títulos
segue valendo, no mesmo contador).

O que todo jogador vê agora, ao terminar a rodada 38:
- Banner grande verde/amarelo "chegou a Copa do Brasil Legends" (1x, com
  o passo a passo das fases e quem entra direto vs quem joga a peneira).
- Peneira (72) → chave de 64 → rodada de 32 → oitavas → quartas → semi
  (ida e volta) → final. Seu jogo no MESMO placar grande da liga; os
  outros numa lista compacta com o relógio rolando.
- Supercopa Legends logo depois (azul/amarelo), campeão da Liga ×
  campeão da Copa do Brasil, jogo único.
- Jornal com a sua campanha na Copa (fase que caiu / vice / campeão, com
  tom próprio quando foi zebra) + Supercopa (só se você jogou a final).
- Ranking: Supercopa virou critério próprio; a Copa mantém o MESMO
  contador de títulos de antes (ninguém perdeu nada na troca de nome).

**Pra reverter**: `COPA_BRASIL_GERAL = false` em `sport.ts` — volta na
hora pra Copa Legends pra todo mundo, sem perder save nem título.

⏳ Ainda pendente: ranking GLOBAL (RPC `esc_pyramid_rank` no Supabase,
fora deste repo) não conhece a Supercopa — precisa de 1 coluna nova
(`supercopa_titles`) + ajuste da função, mudança em produção que só faço
com o Diego confirmando. O `copa_titles` de lá continua correto.
## 🐛🧊 Trava do leilão (caixa negativa) — RODADA 2, causa ESTRUTURAL achada (15/08)
O conserto de 14/08 era um CHUTE (aba em 2º plano) e o Diego confirmou que
continua. Com o relato novo dele (*"trava na PRIMEIRA carta, F5 destrava, aí vai"*)
achei um caminho sem saída de verdade no código:
- `EscAuction` (screens.tsx ~2276) roteia assim: envelope → `<Envelope/>`,
  tiebreak → `<Tiebreak/>`, **e TODO O RESTO cai em `<Reveal/>`** (catch-all).
- Quando o jogo vai pro **monte/cerimônia**, o reducer muda só o `screen` — a
  `phase` fica pra trás (conferido: `advanceSectorOrFinish` e `enterCerimonia`
  mexem em `screen`, não em `phase`). Se a tela ficar em `auction` com a fase já
  passada, o app renderiza a REVELAÇÃO **sem carta** → "Preparando o pregão…".
- A auto-cura dessa tela era **UMA tentativa de 80ms** de `ADVANCE_REVEAL` — e
  essa ação é **recusada** se a fase não for `reveal`/`resq_reveal`. Resultado:
  preso pra sempre, sem timer e sem retry. O F5 resolve porque re-roteia do zero.
- Pior: a auto-cura só rodava pra quem CONDUZ (`canDrive = solo || host`). No
  online, o **convidado** que perdesse o sync ficava esperando eternamente.
- ✅ **Fix:** (1) a auto-cura agora **insiste** a cada 700ms em vez de uma vez só;
  (2) depois de **5s preso**, aparece um botão **"🔄 Destravar o pregão"** pra
  TODO MUNDO (inclusive convidado), com o aviso de que **nada se perde**. Ninguém
  mais precisa adivinhar sozinho que o F5 resolve.
- ⚠️ **Honestidade:** o harness NÃO conseguiu reproduzir a trava dirigindo o
  leilão por reducer com caixa -5, 0 e 100 (os três terminam igual) — o buraco é
  de TELA, não de regra. Por isso o fix ataca a tela e garante a saída, em vez de
  fingir que achou a causa raiz. Se voltar a acontecer, pedir print da tela
  travada: agora ela mostra há quanto tempo está presa.
- Ritmo normal intocado (`AutoAdvance` não mudou). Reversível: `git revert`.


## 📝🐛 "Apertei RENOVAR TODOS e não renovou" — ✅ CORRIGIDO (15/08, relato via Diego)
**O bug era real e tinha causa exata.** Os botões em massa mandavam SEMPRE
`anos: 5` ou `anos: 10` pra todo mundo — mas a tabela `RENEW_TABLE_LOW` não tem
esses prazos pra jogador barato, e o reducer tem `if (custo <= 0) return s` → o
jogador era **pulado em silêncio**.
⚠️ **NÚMEROS EXATOS (medidos 15/08, corrigindo a 1ª análise que era teórica):** o
valor oficial tem PISO por categoria (`CONTRATO_TABELA`): 🪵 foi profissional = 3 ·
🎯 bom jogador = 8 · 💎 promessa = 12 · ⭐ craque = 20 · 👑 lenda = 30. Então valor
1 e 2 são IMPOSSÍVEIS no jogo. O que dava pra acontecer de verdade:
| botão | quem era pulado |
|---|---|
| Renovar todos **5 anos** | **ninguém** — todo valor ≥3 tem 5 anos |
| Renovar todos **10 anos** | **🪵 de valor 3 e 4** (os prazos 3/4 não têm 10 anos) |
Ou seja: só o botão **DOURADO de 10 anos** (o mais chamativo, o que a pessoa
aperta) deixava perna-de-pau barato pra trás, sem aviso.
- ✅ **Fix:** o botão em massa agora escolhe, POR JOGADOR, o prazo mais próximo
  que existe pro valor dele (valor 2 pedindo 10 → renova por 3). "Renovar TODOS"
  renova todos de verdade. Testado: **nenhum valor de 1 a 200 fica de fora**.
- ℹ️ **A renovação AUTOMÁTICA (avançar sem decidir) NUNCA teve esse buraco** —
  ela usa `valorOficial/2` direto, não a tabela. Ninguém perdeu jogador por isso.
- 🎨 **Visual (pedido do Diego na mesma mensagem):** os 3 botões pareciam iguais.
  Agora os dois de RENOVAR ficam juntos em cima (verde claro / dourado) e o de
  SOLTAR fica sozinho embaixo, **largura total, vermelho forte #C2452F com texto
  branco** — cor E posição diferentes. (Segue reversível: cada jogador solto vira
  botão "desfazer" no card dele.)
- ➕ **RODADA 2 (15/08, Diego perguntou: "e quando ele olha o time e não parece
  ter renovado todos?")** — achei mais DOIS casos, os dois confirmados por teste
  do reducer:
  1. **Jogador no "⏳ último ano"** aparece na MESMA janela, mas o botão não
     renova ele (nem pode: só dá pra renovar depois que o contrato ENCERRA). A
     pessoa apertava "Renovar TODOS", olhava o Elenco e via "último ano" ali →
     achava que falhou. **Fix:** o botão agora diz **quantos** vai renovar
     ("Renovar os 6 encerrados") e o aviso do último ano explica que eles NÃO
     entram e que aparecem na próxima janela.
  1b. **✅ REGRA FINAL DO DIEGO (15/08, ele foi categórico):** *"só deve aparecer
     contrato ENCERRADO. Contrato encerrando não precisa aparecer — o cara ainda
     pode continuar jogando"*. Então o "último ano" saiu de vez do banner: a
     janela agora só abre com contrato **vencido** (`expirados + expDorm === 0`
     → não renderiza), o parágrafo de último ano foi removido e o título virou
     **"CONTRATO(S) ENCERRADO(S) — DECIDA"**. Antes o banner abria SEM ninguém
     ter vencido, só porque alguém estava no último ano — era isso que fazia a
     pessoa apertar "renovar todos" e achar que tinha falhado.
     ⚠️ O aviso "⏳ último ano" **continua no card do jogador, na aba Elenco** —
     lá ele é informação, não decisão. A regra de 1 vencido = card só / 2+ =
     botão "renovar todos" segue igual.
  2. **Time na VÁRZEA:** o reducer recusa renovar (regra do Diego 14/08), mas o
     botão aparecia igual — apertava e **nada acontecia, sem aviso nenhum**.
     **Fix:** na Várzea o botão some e entra a explicação (por quê + o caminho):
     "contrato acaba → jogador vai pro leilão e o clube embolsa; subiu pra Série
     D, os contratos passam a valer".
Reversível: `git revert`.


## 🌍 VARREDURA: quem mais perdeu Copa do Mundo no ranking (15/08, ordem do Diego)
Diego: *"tem que consertar pra todo mundo né cara? Como é que ganha a copa e não
ganha porra do troféu?"*. Feita a varredura **casando carreira com carreira**
(título é da SEMENTE, não da conta — sem isso o resultado engana: título de uma
carreira aparecia como "faltando" na outra).
**Achados (só 2 divergências em todo o jogo):**
- **mickael (Dérick FC, seed 696865076):** 7 títulos gravados pelo próprio jogo
  em `esc_results`, ranking mostrava **6** → **+1 restaurado**. Mural da nuvem
  populado com as 7 edições provadas (seleção vai neutra: o jogo não grava qual
  seleção foi, e inventar país seria mentir) + snapshots ≥390 pra 7.
- **denilson (Xurupitas FC):** ranking mostra **9** e `esc_results` só tem 6 —
  **NÃO é bug e não se mexe**: o registro em `esc_results` só existe pra carreira
  com Agência 2.0 (regra de 09/08), então títulos anteriores existem só no mural.
  ⚠️ **`esc_results` NÃO é registro completo** — nunca usar sozinho pra "corrigir
  pra baixo". Regra: só ADICIONA título provado, nunca tira.
- **leodiniz85:** +1 título da temporada 170 (Inglaterra/FLAMENGO SAF, print como
  prova), gravado nos 3 lugares (mural da nuvem, `esc_results`, snapshots ≥170).
  A carta do campeão do mundo daquela edição ele não recebe (a janela passou).
- Os outros 3 casos que apareceram na 1ª busca (souzact12, gaabriel, victordudu)
  eram **falso positivo**: o título é de uma carreira diferente da que está no
  ranking (ou de carreira apagada). Nada a fazer.
**Conserto de código junto:** `mergedMundialMural` agora deixa o TÍTULO vencer o
empate entre aparelho e nuvem (antes o aparelho ganhava sempre e apagava vitória
de quem trocou de celular/limpou navegador) + bandeira ganha fallback 🏳️.


## 🌍🐛 "Ganhei a Copa do Mundo 2× e nenhuma contou" (leodiniz85) — ✅ CORRIGIDO (15/08)
**Investigação no banco (conta leonardodiniz403@gmail.com, carreira seed
791372628, FLAMENGO SAF):** 0 linhas `:copamundo` em `esc_results`; mural na
nuvem com as 8 edições (100…170) TODAS com `voce:false`; `world_titles = 0` em
todos os 42 snapshots. A liga e a Copa Legends da MESMA temporada 170 gravaram
normal (18:55 e 18:57) — não era falha geral de gravação (o jogo inteiro tem
66 títulos de Copa do Mundo, de 28 usuários).
**Causa (achada no código, não no chute):** `CopaMundoGate` memoizava o save
SÓ por `seed` (`useMemo(..., [seed])`). Quando o torneio terminava e gravava
`played`, o memo continuava VELHO → `copaNow` seguia true → **o botão
"DISPUTAR A COPA DO MUNDO" continuava na tela**. Entrando de novo, a
convocação sorteava outra seleção → chaveamento DIFERENTE → dava pra "ganhar".
Só que a gravação é barrada por `cur.played.includes(seasonNo)` — então NADA
era registrado (nem título, nem 100 moedas, nem esc_results) **enquanto a
cerimônia continuava cantando "VOCÊ É CAMPEÃO DO MUNDO + 100 MOEDAS"**.
A tela mentia. Mesmo tronco do "hack do F5" de 14/08 (aquele fechou só o caso
do refresh no meio do torneio, não o do botão que sobrava depois).
**Consertos (commit isolado, revertível):**
1. O portão RELÊ o save quando a Copa fecha (`saveVer` + `onClose`) — edição
   decidida, botão some. Ninguém joga a mesma Copa duas vezes.
2. Se por qualquer caminho a edição já estiver gravada, a cerimônia mostra
   **"esta edição já tinha sido decidida — foi só treino, não conta título nem
   prêmio"** em vez de prometer o que não vai cumprir.
3. A **carta do campeão** também não sai nesse caso (era farm de carta).
Testado com o save REAL dele reproduzido no harness: 7 checagens ✅.
- ⏳ **PRO DIEGO DECIDIR — títulos dele:** as provas dizem que TODAS as 8
  edições que ele jogou foram vencidas pela CPU na 1ª ida; as vitórias dele
  foram re-jogadas (que a regra anti-hack não conta). **Não restaurei nada** —
  seria inventar título, e a regra é nunca inventar número. MAS a culpa do
  engano é do JOGO (o botão ficou lá e a tela cantou o título). Se quiser
  compensar, sugiro **moedas** e não título — título falso sujaria o ranking
  global que ele faz questão de manter verdadeiro.


## 🐛 Bugs de tela achados pelo Diego jogando de verdade — corrigidos (16/08)
Ele testou ao vivo e mandou print: a tela toda ainda tava com a cara
(cores, textos) da Copa Legends, mesmo com a Copa do Brasil rolando por
baixo — muito confuso, "não sabe aonde que ela entrou". Achei 3 bugs
reais:
1. **`copaNLegs` errado** — o código assumia "só a Final é jogo único, o
   resto é sempre ida e volta" (verdade pra Copa Legends, com só 4 fases).
   Na Copa do Brasil (Peneira/Rodada de 64/Rodada de 32 também são jogo
   único) isso fazia aparecer "IDA E VOLTA" errado em telas de jogo único.
   Corrigido pra ler direto do confronto (`ties[0].legs.length`) em vez de
   adivinhar pelo nome da fase.
2. **Cabeçalho fixo do topo nunca trocava de cara** — sempre mostrava
   "🏆 Copa Legends" + o texto antigo "Os 4 melhores de cada série", não
   importa se era Copa do Brasil ou Supercopa rolando. Esse cabeçalho
   fica em cima de TODA aba, é a única coisa sempre visível — agora troca
   de verdade: verde/amarelo brilhante na Copa do Brasil, azul/amarelo na
   Supercopa (cores já combinadas), mostrando fase atual + jogo único/ida
   e volta.
3. **Aviso "agora começa a Copa Legends" repetindo em toda fase** — 8
   vezes a mesma frase (uma por fase) virava poluição. Agora só aparece
   1x, na primeira fase, com o nome certo.
   Também corrigi textos soltos com "Copa Legends" hardcoded (artilharia,
   jornal/O Martelo, notícias da Agência) pra todos trocarem de nome
   dinamicamente.

⚠️ Não consegui fazer um teste visual automatizado dessa parte (o
harness de screenshot bate num bug de import circular quando carrega
`pyramidseason.tsx` isolado, mesmo problema de antes) — só `tsc -b` e
`build` limpos. Pedir pro Diego conferir ao vivo se ficou bom.

## 🏆📊 Ranking LOCAL: Supercopa vira critério próprio (Copa do Brasil é RENOMEAÇÃO, não nova) (16/08)
Peça seguinte depois da Supercopa — **corrigida** depois que o Diego
esclareceu um ponto importante: a Copa do Brasil **NÃO é uma competição
nova pro histórico** — é a MESMA Copa Legends, só com nome e formato
novos. "Não são coisas novas, só alterou o nome e o formato... tudo que a
pessoa ganhou não vai perder." Só a **Supercopa** é de fato nova.
- **Reverti** a ideia inicial de um contador separado
  (`careerCopaBrasilHonors`) — voltou a usar o MESMO `careerCopaHonors`
  pras duas (Legends e Copa do Brasil), preservando o histórico contínuo
  de quem já tinha títulos.
- **Continua novo** (de verdade): `careerSupercopaHonors`.
- Ordem do desempate (sem mudar a POSIÇÃO da Copa — só insere a Supercopa
  logo depois dela): 🌍 Mundo → 🏆 Série A → 🏆 Copa (Legends/do Brasil,
  mesmo contador) → 🏆🔵 Supercopa → 🏆 B → C → D → Várzea → 💰 dinheiro.
- O nome exibido do troféu/selo troca sozinho conforme a conta é tester
  ou não (`brasil` prop no `RankingTab`): "Copa do Brasil" 🏆🇧🇷 verde pra
  quem já está na Copa do Brasil, "Copa Legends" 🏆 dourado pra quem ainda
  não — mas é o MESMO número por baixo, ninguém perde nada na troca.
- Atualizado nos 3 lugares que usam essa lista (`RankingTab`, o "copaGate"
  da Copa do Mundo, Hall de Troféus) — sempre juntos, pra nunca ficarem
  incoerentes entre si.
- Testado: `tsc -b`+`build` limpos + teste rápido confirmando a ordem
  nova do comparador.

⚠️ **NÃO MEXI no ranking GLOBAL** (a tela "Rank Global", RPC
`esc_pyramid_rank` no Supabase) — ele vive fora deste repositório, no
banco de dados. `copa_titles` já existe lá e não precisa mudar (mesmo
contador, Legends+Copa do Brasil somados). Só falta a Supercopa: pra ela
também aparecer no rank global, precisaria (1) adicionar 1 coluna nova
(`supercopa_titles`) na tabela `esc_pyramid_rank_snap`, (2) atualizar a
função `esc_pyramid_rank` no banco pra usar essa coluna na ordenação, (3)
mandar o contador novo no upsert que já existe em `pyramidseason.tsx`
(~linha 3970). É uma mudança em PRODUÇÃO fora do site — só faço com o
Diego confirmando antes.

## 🔵🏆 Supercopa Legends construída (16/08)
Peça seguinte depois do chaveamento novo da Copa do Brasil. Campeão da
Série A × campeão da Copa do Brasil da mesma temporada, jogo único, azul
brilhante (identidade INVERTIDA da Copa do Brasil de propósito — verde lá,
azul aqui — pra dar pra saber qual é qual só de olhar). Empate técnico
(mesmo time ganha as duas): joga o VICE da Série A no lugar.
- `computeSupercopa` / `supercopaRewards` novos em `copa-brasil.ts` —
  genérico por design (recebe "quem é o campeão da copa" como parâmetro,
  não hard-coded pra Copa do Brasil especificamente, igual o doc pedia).
- **Zero state machine nova**: a Supercopa entra como a 8ª (e última)
  "página" no mesmo mecanismo de revelação fase-a-fase que a Copa do
  Brasil já usa (`copaRound`/reveal) — reaproveita 100% o ritmo, sync
  online, anti-spoiler. A temporada só "fecha" de verdade depois que a
  Supercopa também for revelada.
- Prêmio: vice 8 · campeão 20 (docs/conceito-copa-brasil.md §7.1).
- Testado isolado: 119 verificações, 0 falhas (jogo normal, empate
  técnico troca pro vice certo, sem campeão de copa ainda retorna null).
- Continua atrás da mesma trava de teste — zero risco pra quem não é
  tester.

⏳ **Ainda falta**: ranking (Copa do Brasil e Supercopa ainda não são
critério próprio no desempate — soma tudo meio misturado hoje), o
ranking GLOBAL vive no Supabase (fora deste repo).

## 🔨 Copa do Brasil: chaveamento REFEITO do zero — mata-mata puro (16/08)
Depois de uma sessão LONGA de idas-e-vindas com o Diego (ele foi mudando
de ideia várias vezes, testei simulações e mockups no meio do caminho),
a especificação da Copa do Brasil mudou BASTANTE — ver
`docs/conceito-copa-brasil.md` seção "1-NOVA" (fonte de verdade agora; a
seção 1 antiga com fase de grupos está marcada como histórico/descartada).

**Resumo da mudança**: SEM fase de grupos nenhuma (a versão de 16 grupos
de 4 que eu tinha construído e até ligado ao jogo atrás de trava de teste
foi jogada fora — o Diego achou complicado demais de acompanhar). Agora é
mata-mata puro: peneira (72 times: Várzea+C+D+12 piores da B) → chave de
64 (junta com Série A inteira + 8 melhores da B) → rodada de 64 → rodada
de 32 → oitavas (aqui trava o chaveamento, estilo olímpico) → quartas →
semi (ida e volta) → final (jogo único). **Tudo roda de uma vez, só
depois que a rodada 38 termina** (Diego cogitou adiantar parte pro meio
da temporada, mas descartou — não economizava tempo de exibição, só
mudava quando se assiste).

**Estado atual**: `src/escalacao/copa-brasil.ts` (o motor v1, de grupos)
está DESATUALIZADO — precisa reconstruir do zero com a lógica nova. A
trava de teste (`COPA_BRASIL_TESTERS` em `sport.ts`) e os adaptadores em
`pyramidseason.tsx` continuam valendo como MECANISMO (zero risco, só a
conta liberada testa) — só a lógica de dentro do motor muda.

**✅ Feito (16/08)**: `computeCopaBrasil` reconstruído do zero com o funil
novo (peneira 72→36 + direto 28 = 64 · Rodada de 64 · Rodada de 32 ·
Oitavas · Quartas · Semifinal · Final — 7 fases, chave trava a partir das
oitavas). `tsc -b`+`build` limpos. Testado isolado: harness Node/Vite-SSR
com 40 temporadas sintéticas, **522 verificações, 0 falhas** (peneira sem
duplicata, funil de tamanhos certo [32,16,8,4,2,1], pernas certas por
fase, chave travada de verdade da Rodada de 32 pras Oitavas — conferido
que ninguém é reembaralhado —, premiação paga o campeão certo, adaptador
produz as 7 fases). Os adaptadores (`copaBrasilAsCopaResult` /
`copaBrasilRewardsAsCopaRewards`) e a trava de teste continuam os mesmos
de antes, só a lógica de dentro do motor mudou — zero risco extra pra
quem não está em `COPA_BRASIL_TESTERS`.

⏳ **Ainda pendente**: os componentes de tela da fase de grupos
(`CopaBrasilGroupTable`/`CopaBrasilGroupsSummary`/`CopaBrasilGroupsBlock`
em `pyramidseason.tsx`) ficaram órfãos — nunca mais renderizam nada,
porque `groups` agora é sempre `[]`. Não atrapalham (não rodam, zero
risco), mas é lixo de código — limpar numa próxima passada. Falta também:
ranking (Copa do Brasil ainda soma no mesmo contador da Copa Legends),
Supercopa Legends (ainda não existe).

## ⚽🎉 CARIMBO DO GOL: todo clube batizado estampa a cara dele — ✅ NO AR (15/08)
Nasceu do batismo do Seven City: o Diego viu o mockup animado do "7 carimbando a
tela", adorou ("pqp mt bom") e mandou estender — *"já faça o de todos os mascotes
tb aparecer alguma coisa deles no gol"*.
- **Como funciona:** `CARIMBO_GOL` (mascotes.tsx) liga NOME DO CLUBE → arte. Quando
  esse clube marca, a arte carimba o placar (`LiveScoreCard`) por 1,7s e some.
  20 clubes mapeados. O **Seven City carimba com o SETE dourado** (`SETE_SEVEN`,
  fica fora de MASCOTES de propósito — é carimbo, não mascote de festão); todos os
  outros carimbam com o **próprio mascote**.
- **Travas (as mesmas do martelo/festão):** só de QUEM MARCA (gol do rival não
  carimba nada) · **não adiciona passo nem espera** (overlay por cima do que já
  rola, o relógio não para, ninguém toca em nada) · clube SEM batismo = placar
  exatamente como sempre foi · **basquete intocado** (gate `!basket`).
- Nome antigo de save resolve sozinho (`newestTeamName`): Olimpo FC → Remoçada,
  Apogeu FC → Seven City, Painitto FC → SC Ferrari etc., todos carimbam.
- 🩹 Arte em `scale(.55)`: as artes nascem com 168px (tamanho do festão) e o corpo
  do placar tem ~103px — sem encolher, o carimbo **cortava a cabeça do mascote**.
  Conferido num teste que renderiza cada arte dentro de uma caixa do tamanho real.
- ⚠️ Marinheiros AS / Eros FC / Sapekeiros FC estão no mapa e **não** aparecem na
  pirâmide de propósito: são batismos de RESERVA DE NOME (clube do próprio
  jogador). NÃO limpar do mapa.
- **Reverter:** commit isolado — `git revert` tira só a comemoração, o batismo do
  Seven City e todo o resto ficam de pé.

## 📊 Tela da fase de grupos da Copa do Brasil — EM REVISÃO (15/08)
4ª peça, ainda não finalizada. Primeira versão mostrava a tabela do grupo já
pronta (calculada em silêncio). Diego pediu 3 ajustes depois de ver o
preview:
1. **Progressiva**: a fase de grupos deve tocar em rodadas (como a Liga),
   não aparecer pronta de uma vez — dá suspense de verdade.
2. **Sem a palavra "bye"** em lugar nenhum visível ao jogador — ninguém
   entende esse termo. Já corrigido no texto que existia ("32 já
   classificados direto" / "64 disputam a fase de grupos").
3. **Pra TODOS, não só teste**: Diego não quer manter isso atrás da trava
   `COPA_BRASIL_TESTERS` pra sempre — a intenção é substituir a Copa Legends
   de vez, pra todo mundo. Perguntei se é AGORA (mesmo faltando ranking
   separado e Supercopa) ou depois de eu terminar essas peças — aguardando
   resposta.
Nada disso foi commitado ainda (só a troca do motor — item "🔌 Copa do
Brasil LIGADA ao jogo" mais abaixo — está no ar, atrás da trava).

## 🦁7️⃣ BATISMO Seven City (glaucomiranda) — ✅ NO AR (15/08, mockup aprovado)
Homenagem ao **Seven Gamer** (@sevengamersp), criador de conteúdo de games.
Aprovado no formato oficial de prévia (o mesmo do Remoçada) depois de 4
rodadas de ajuste (rosto do leão, corpo forte, bola no PÉ, cabeça colada,
faixa única de listras, placar do 7 junto do festão).
- **Série A:** `Apogeu FC` → **`Seven City`** (`data.ts`). ⚠️ **O nome saiu
  errado primeiro** ("Seven FC") e ficou ~1h no ar — o Diego corrigiu: é
  **Seven City**. Corrente de nomes: Apogeu FC → Seven FC → Seven City, e o
  escudo registrado nos 3 nomes pra ninguém cair no escudo automático.
- **Escudo** (`escudos.tsx`, sevenCityRender): coroa dourada + 7
  dourado no escudo azul-marinho, inspirado na arte que o Glauco mandou.
- **Mascote** (`mascotes.tsx`, `leao_seven`): leão forte de uniforme
  completo, juba azul-marinho, 7 no peito e no calção, bola dominada no pé.
  ⚠️ Os "7" são **path desenhado**, não `<text>` — não depende de fonte.
- **Banco** (`esc_socios`, sócio nº22): manto_c1 `#C9A227` (dourado fosco) +
  manto_c2 `#12256B` (o mesmo azul do Remoçada), mascote_key `leao_seven`,
  escudo_time `Seven City`.
- ⏳ **Combinado e NÃO codado ainda**: a comemoração de gol com o **7 dourado
  carimbando a tela** quando o Seven City marca (estava no mockup aprovado).
  Mexe no `LiveScoreCard` (futebol ao vivo, código sensível) — fazer como
  commit isolado e revertível, e só depois de conferir com o Diego se ele
  quer só pro Seven City ou um sistema de "carimbo do clube" pra todo batismo.
Reversível: `git revert` do commit + `update esc_socios set manto_c1=null...`.

## 👑 Novo Lenda fundador nº42 + sócio nº22: glaucomiranda@outlook.com (15/08)
Glauco — tier ouro (user_colors já estava ouro/manual no banco), fundador
nº42 no código (apoio.tsx), sócio nº22 criado no esc_socios (origem
batismo, válido até 2099). ⏳ **Batismo pendente**: Diego vai escolher o
time da SÉRIE A pra trocar (lista enviada no chat — livres: Metrópole FC,
Soberano Nacional, Coliseu United, Galáxia EC, Imperador SAF, Fênix
Dourada, Continental Real, Monarca EC, Vanguarda Nacional, Aurora Suprema,
Dragão Imperial, Cosmopolita FC, Zênite United, Excelsior SAF, Prestígio
FC, Legado EC, Apogeu FC; já batizados: Scorporila, Deportivo Montreal,
Remoçada). Quando ele mandar nome/cores/escudo/mascote, fazer igual aos
outros batismos (mockup vertical → OK → shipping).

## 🔌 Copa do Brasil LIGADA ao jogo — só na conta do Diego por enquanto (15/08)
3ª peça da construção (Diego autorizou "pode sim amigo meu"). A pirâmide de
carreira agora RODA a Copa do Brasil de verdade no lugar da Copa Legends,
mas atrás de trava por CONTA (`COPA_BRASIL_TESTERS` em `src/escalacao/sport.ts`
— mesmo padrão do teste do basquete): só `diego.c.fonseca@gmail.com` joga a
Copa do Brasil; **todo mundo continua na Copa Legends de sempre, sem
mudar NADA pra eles.**
- Dois adaptadores novos em `copa-brasil.ts` (`copaBrasilAsCopaResult`,
  `copaBrasilRewardsAsCopaRewards`) encaixam o resultado da Copa do Brasil
  na MESMA forma que a Copa Legends sempre teve — por isso deu pra
  REAPROVEITAR 100% da tela que já existe (chaveamento, placar ao vivo,
  ritmo manual/auto, sincronização online, prêmios, carta de campeão) sem
  reescrever nada dela. A "Rodada de 64" virou só mais uma fase da lista
  (como oitavas/quartas/semi/final já eram) — a tela nem precisa saber
  qual das duas Copas está rolando.
- Reskin já aplicado (mockup aprovado antes): título "COPA DO BRASIL
  LEGENDS" + verde/amarelo brilhante no lugar do verde-escuro da Legends,
  premiação certa (+50 campeão / +25 vice, batendo com `CB_PAY`).
- **Testado**: `tsc -b` + `npm run build` limpos (bundle sem crescer fora
  do esperado); harness Node/Vite-SSR novo conferindo que o adaptador
  produz exatamente a forma que os componentes da tela esperam (6 fases,
  32→16→8→4→2→1, campos de cada confronto, prêmios) — 261 verificações,
  0 falhas, em 20 temporadas sintéticas.
- **Ainda FALTA** (próximas peças, "em pedaços"):
  - Tela da fase de grupos/potes (hoje os 64 clubes da peneira já entram
    calculados e pagos certinho, mas não tem NENHUMA tela mostrando os
    grupos — o jogo pula direto pra chave de 64). Mockup já aprovado,
    falta construir.
  - Ranking (local e global): a Copa do Brasil ainda soma no MESMO
    contador da Copa Legends (`careerCopaHonors`) — não é um critério
    próprio ainda como a especificação pede. O ranking GLOBAL de verdade
    vive numa função dentro do banco (Supabase, fora deste repo) —
    precisa mexer lá também, com cuidado, fora do site.
  - Supercopa Legends (ainda não existe em lugar nenhum).
- **Reversível**: sim, fácil — é só apagar `diego.c.fonseca@gmail.com` de
  `COPA_BRASIL_TESTERS` (ou `git revert` deste commit) que volta 100% pra
  Copa Legends pra todo mundo, sem sobrar rastro.

## 🏆 Motor da Copa do Brasil construído e TESTADO — ainda NÃO ligado ao jogo (15/08)
2ª peça da construção (indo "em pedaços", pedido do Diego — ver
`docs/conceito-copa-brasil.md` pro plano completo). `src/escalacao/copa-brasil.ts`
novo: simula os 96 clubes (32 de bye pela posição real da tabela + 64 na
fase de grupos com 4 potes de força), a fase de grupos (16 grupos de 4,
round-robin), a chave de 64 com a regra do azarão no empate da 1ª rodada,
e o mata-mata até o campeão (sorteio puro do mando das oitavas em diante,
pênaltis reaproveitando a mesma trava da Copa Legends). Reusa o MESMO
motor de simulação de jogo da Copa Legends (`rollForm`/`poisson`/etc.,
exportados de `pyramidseason.tsx` sem mudar nenhuma linha de lógica).
**Testado isolado**: harness Node com Vite SSR, 30 temporadas sintéticas,
421 verificações, 0 falhas. **Zero risco pro jogo ao vivo** — nada chama
essa função ainda, bundle de produção não mudou de tamanho (confirmado).
Achei 2 furos na conta da especificação original e resolvi com uma
escolha minha, sinalizada no código e no doc de conceito (Várzea perde os
4 últimos pra fechar 96, e uma fase sem nome virou "Rodada dos 32") — o
Diego ainda não confirmou essas duas escolhas.

**Próxima peça**: integrar de fato (trocar a Copa Legends pela Copa do
Brasil no reducer/telas) — essa é a parte que precisa de mais cuidado,
porque mexe em coisa que já está no ar.

## ⚽ Placar ao vivo: goleadores deslizando embaixo de cada time — ✅ NO AR (15/08)
1ª peça da construção da Copa do Brasil (ver `docs/conceito-copa-brasil.md`
— Diego pediu pra ir "em pedaços", começando pelo mais seguro). Reskin
final do `LiveScoreCard` (`pyramidseason.tsx`), mockup já aprovado antes:
- **Escudos maiores** (34→40px, 28→32 no basquete).
- **Topo virou o único lugar de narração** (apito inicial/intervalo/final
  + o flash de gol) — fundo escuro, vira dourado/vermelho só durante o
  flash do gol. Antes eram 2 lugares repetindo o nome do artilheiro.
- **Embaixo agora é a lista de GOLEADORES** de cada time (nome + minuto),
  deslizando sozinha quando passa de 2, no fundo/brilho da competição
  (`footTint`, já existia). Usa `shown` (a lista de gols já travada pelo
  relógio) — **sem risco de spoiler**: nenhum nome aparece antes do
  minuto certo, mesma trava de sempre.
- Testado isolado antes de subir (jogo simulado com 4 gols, print a
  print) — confirmado que escudo, narração e lista de goleadores batem
  certinho, inclusive o alinhamento (casa à direita, visitante à
  esquerda, coluna do meio do tamanho do placar).
Vale pra TODO mundo que usa o `LiveScoreCard`: liga da carreira, jogo
rápido/online, Copa dos 8 e Copa do Mundo — 1 componente só. Reversível:
`git revert`.

**Próximas peças da Copa do Brasil** (não começadas ainda): motor do
chaveamento (96 clubes, potes, fase de grupos) e depois a troca de fato
da Copa Legends pela Copa do Brasil. Especificação inteira já fechada em
`docs/conceito-copa-brasil.md`.

## 🃏 AUDITORIA DO BARALHO INTEIRO (1.351 cartas) — 108 correções ✅ NO AR (15/08)
Diego pediu conferir Marcos/Juninho Paulista/Luís Fabiano/Valdivia; 3 dos 4
estavam com ano errado → ele mandou checar TODAS ("devem ter mts jogadores
errados"). Processo em 2 etapas: 16 auditores em paralelo (carta por carta,
web nos incertos) + re-verificação de cada suspeita antes de mexer (teve
alarme falso, ex. Marta/Antony). Placar final: 1.237 cartas ok de primeira,
**95 anos corrigidos** (Ibra Milan 2013→2012, Hagi Gala 1994→2000, Zizinho
Fla 1950→1943, Gérson Botafogo 1970→1968 — na Copa de 70 ele era do São
Paulo!, Renato Augusto Cor. 2018→2015, Grafite SPFC 2008→2005, Elano Santos
2009→2004, Ochoa América 2014→2009 etc.) e **13 trocas de clube/nome** onde
o jogador NUNCA jogou no clube impresso (Apodi Fortaleza→Ceará, Fumagalli
Goiás→Guarani + bio, Vladimir Coritiba→Santos, Cláudio Pitbull
Coritiba→Grêmio, Ceará-lateral Fluminense→Cruzeiro, Marcelinho Paraíba
Corinthians→São Paulo, Nonato Bahia→Fluminense + bio, Rodrigo Alvim
Inter→Grêmio + bio, Finazzi Barueri→América-SP + bio, Leynny→Lenny (grafia),
"Nacho"→Gianluca Prestianni, Joel Sánchez Necaxa→Guadalajara, Caniza
Necaxa→Cruz Azul). Folclóricos PROPOSITAIS mantidos: Adriano Gol Contra,
Zina (Ceará), GarrinSha. Só exibição — lo/hi, fama e regras intactos; saves
guardam a carta inteira (ident = nome|clube), nada quebra em elenco existente.
- ✅ **2 casos decididos pelo Diego (15/08)**: Digão → **Milan 2007** (é o
  irmão do Kaká mesmo, que nunca jogou no Flu; bio conta os 3 jogos + elenco
  campeão mundial 2007) e Evandro Roncatto → **Guarani 2004** (cria da base,
  craque do mundial sub-17 de 2003, 2º melhor atrás só do Fàbregas). NO AR.
- 📏 **CRITÉRIO DO DIEGO PRA CATEGORIA (15/08, gravar)**: 👑 LENDA não é pra
  ídolo de clube ("foi lenda NO clube", tipo Fernandão no Inter, Bobô no
  Bahia, Hulk no Galo — esses são ⭐ CRAQUE). LENDA = jogador que seria lenda
  em QUALQUER clube NAQUELE ano da carta (grandeza universal, avaliada no
  ano). Diego pediu análise SEM mexer — parecer entregue no chat 15/08:
  sugestões de descer Cássio 2012/Mauro Galvão 97/Marcelinho Carioca 95/
  Evair 93/Adriano-Fla 2009 (e subir Adriano-Inter 2005 no lugar), subir
  Tostão 70; casos borderline Renato Gaúcho 83 e Dirceu Lopes 76; zoeira
  Vozinha (Cabo Verde 2026) mantida como está até ele decidir.
- 💎 **CRITÉRIO DO DIEGO PRA PROMESSA (15/08, gravar)**: 💎 = carta cujo ano
  é a fase de JOVEM/hype do jogador naquele clube (padrão Pato-no-Inter /
  Kaká-no-SP), "apenas os tops". Decisão aplicada (NO AR): TIRARAM o selo
  Júlio César (Fla 2003, já era titular consolidado), Pato do MILAN 2009
  (já era estrela — a promessa dele é o do Inter 2007) e Götze (Bayern
  2014, já herói de Copa); GANHARAM o selo Ronaldo (Cruzeiro 93), Lucas
  Moura (SPFC 2012), Paquetá (Fla 2018), Alex Teixeira (Vasco 2009) e
  Antony (SPFC 2020). Reinier ficou de fora (Diego não incluiu). Flops
  lendários (Adu, Mamute, Neilton) MANTÊM o 💎 — a aposta/risco é a graça.
- 🎯🪵 **REVISÃO FOI PROFISSIONAL/BOM JOGADOR (15/08, decisões aplicadas, NO
  AR)**: subiram pra ⭐ CRAQUE **Conca** (Flu 2010, melhor do Brasileirão
  daquele ano — estava fame 2!) e **Hulk do Porto 2012**; subiram pra 🎯 BOM
  JOGADOR (fame 2) **Velloso** (Palmeiras 94), **Durval** (Santos 2013) e
  **Marcelo Lomba** (Bahia 2012). Diego NÃO incluiu Léo Lima nem Henrique
  Dourado (artilheiro 2017 segue 🪵 folk) — ficam como estão até ele querer.
  Júlio César (Fla 2003) e Götze (Bayern 2014) também subiram pra ⭐ (pedido
  dele na mesma conversa). Zoeiras intocáveis confirmadas: Balotelli,
  Materazzi, Dudek, Heurelho Gomes, Kaiser, Ali Dia etc.
- ⭐ **PACOTE 3 — força 80+ com selo 🎯 no baralho EU (15/08, "aprovo tudo",
  NO AR)**: subiram pra ⭐ CRAQUE 12 (Fowler, Aimar, Payet, Élber, Amoroso,
  Yorke, Maignan, Saliba, Lizarazu, Gattuso, Seaman, Walter Samuel — eram A
  estrela do time naquele ano). Tiveram a FORÇA reduzida ~3 pts mantendo 🎯
  15 coadjuvantes de luxo (Onana, Lloris, Costacurta, Laporte, Giménez,
  Alaba, Willian, Oscar, Ramires, Arshavin, Coman, Giroud, Bierhoff, Andy
  Cole, Paquetá-West Ham 80-87→76-84). ⚠️ Força mexe no desempenho em
  partidas futuras (elenco existente mantém o nível já revelado). Pepe
  (Real 2012) intocado (folk/zoeira). ✅ **ENCERRADO pelo Diego ("deixa
  assim msm", 15/08)**: Sol Campbell, Fernandinho/Fabinho/Gilberto Silva,
  Léo Lima e Henrique Dourado FICAM COMO ESTÃO — decisão tomada, não é
  pendência. A revisão de categorias (👑⭐💎🎯🪵) está COMPLETA; só resta a
  varredura fina de força lo/hi das 1.351 (aguardando limite da conta).
- ⭐ **PACOTE 2 DA REVISÃO (15/08, aprovado pelo Diego, NO AR)**: subiram pra
  ⭐ CRAQUE 12 cartas cuja força já era de craque mas o selo ficou pra trás —
  BR: Washington Coração Valente (ATH 2004, artilheiro-recorde), Jhon Arias
  (Flu 2023, melhor da Libertadores), Paulinho (Galo 2024, artilheiro da
  Libertadores), Emerson Sheik (Corinthians 2012); EU: Grafite (Wolfsburg
  2009, artilheiro+melhor da Bundesliga), Zé Roberto (Bayern 2004, estava
  invertido com o do Palmeiras), Desailly, Makélélé, Cambiasso, Klose,
  Simeone, Mendieta. Desceram pra 🪵: Defederico (flop famoso) e Kerlon
  Foquinha. ⏳ AINDA EM ABERTO (Diego não decidiu): Léo Lima (Vasco 2003) e
  Henrique Dourado (Flu 2017, ARTILHEIRO do Brasileirão como 🪵!) subirem
  pra 🎯; ~30 cartas EU com força 80+ e selo 🎯 (Fowler, Gattuso, Aimar,
  Morientes, Élber...) — resolver subindo selo OU baixando força, um dia.
- ✅ **DECISÃO DO DIEGO APLICADA (15/08, NO AR)**: subiram pra 👑 LENDA
  **Tostão** (Cruzeiro 70) e **Adriano Imperador** (Inter 2005); desceram
  pra ⭐ CRAQUE **Evair**, **Adriano** (Fla 2009) e **Cássio**. Mauro Galvão
  e Marcelinho Carioca ele NÃO mandou mexer — continuam 👑. Renato Gaúcho,
  Dirceu Lopes e Vozinha ficaram como estavam (sem decisão = sem mexer).
- ⏳ **PRÓXIMA ETAPA combinada (15/08)**: auditoria de NÍVEL (lo/hi) e
  CATEGORIA (fame: 👑5/⭐4/🎯2-3/🪵1/💎promessa) — entregar LISTA de sugestões
  pro Diego bater o martelo ANTES de mudar (nível mexe no equilíbrio).
  ⚠️ Travou no limite mensal de gastos da conta Claude (os verificadores
  morreram no meio; terminei a verificação na mão). Rodar quando o limite
  for aumentado/renovar (claude.ai/settings/usage).

## 🎨 Placar ao vivo: barra de baixo com a cor de cada Copa — ✅ NO AR (15/08)
Diego pediu pra estender a ideia (barra de baixo brilhante com a cor da
competição) que mockei pra Copa do Brasil também pras copas que JÁ EXISTEM
de verdade: Copa do Mundo Legends e Copa dos 8 (online). Implementado:
- `LiveScoreCard` (`pyramidseason.tsx`) ganhou um prop novo opcional
  `footTint={{ bg, border, holo }}` — quando não passado, a barra de baixo
  continua bege de sempre (Liga normal, carreira e online, **sem
  mudança**). Reusa o mesmo `ApoioSheen` (brilho holográfico) já usado em
  todo canto.
- **Copa dos 8** (`screens.tsx`): barra de baixo agora roxo clarinho
  brilhante, mesma família de cor do roxo já usado no banner/borda dela.
- **Copa do Mundo** (`copa-mundo.tsx`): barra de baixo dourada brilhante —
  ela já usa dourado no botão de entrada, então é a MESMA identidade,
  só chegando também no placar ao vivo.
- Testado isolado (3 cards lado a lado: sem tint / roxo / dourado) antes
  de subir — confirmado que o tint normal não mudou em nada.
Reversível: `git revert`, é só cor de fundo + brilho, nenhuma lógica de
jogo mudou. Quando a Copa do Brasil/Supercopa saírem do papel, é só
passar `footTint` verde/azul nelas também — o prop já tá pronto pra isso.

## 🧪 SIMULAÇÃO COMPLETA dos 3 bugs relatados — 14 ✅ · 0 ❌ (15/08, pedido do Diego)
Diego: "Rode uma simulação e teste tudo isso q falamos p ver se vc encontra
os erros exatos... se vc encontrar outros me fale". Montado harness Node
(scratchpad `bugtest.mjs`, mesmo método Vite/ssrLoadModule do agenciatest)
que monta uma carreira REAL via reducer (leilão inteiro dirigido por actions)
e roda a temporada com o `simulatePyramid` de produção. 14 invariantes, TODOS
passando:
- **A) Gol só de quem está em campo** (cobre o bug do "reserva fez gol"):
  38 rodadas × todos os jogos — nenhum gol do meu time fora do XI travado,
  nenhum gol de jogador fora do elenco, e placar do jogo == soma da lista
  de gols em TODOS os jogos (cobre "gol com o jogo 0x0": o motor NUNCA
  registra gol que o placar não tenha — era exibição/spoiler, já corrigido).
- **C) Tabela atualiza TODA rodada** (cobre o bug "pontos não atualizam nas
  finais"): pontos somados crescem nas 38 rodadas, inclusive 35→38. No
  MOTOR não existe rodada que não pontua — reforça que o relato era a
  segurada anti-spoiler da tela (fixes de 13-14/08) e segue o plano de
  observação.
- **D) Determinismo**: mesma semente 2× = tabelas e gols byte-idênticos
  (garante que F5 não muda resultado — base do carimbo da Copa do Mundo).
- **E) Buraco na escalação** (o caso Roberto Carlos): escalação salva com
  id fantasma (jogador que "saiu do clube") não crasha, o fantasma NUNCA
  marca, e a vaga é completada só por gente do ELENCO.
- **F) Temporada inteira via reducer + varredura**: a rodada 0 NÃO avança
  sem a aposta de patrocínio (o cinto de segurança do reducer de 07/08
  funcionando — virou teste positivo), 38 rodadas via PLAY_ROUND, nenhum
  NaN no estado, caixas todas finitas, nenhum artilheiro negativo, nenhum
  jogador duplicado no elenco.
**Nenhum bug novo encontrado no motor.** Os 3 relatos batem com os
mecanismos de TELA já corrigidos (aviso do buraco + reveal esperando
pendência + carimbo da Copa). Único ❌ da 1ª rodada do teste era erro do
PRÓPRIO teste (não fazia a aposta de patrocínio — a trava do jogo estava
certa).

## 💭 Copa do Brasil Legends + Supercopa Legends (3ª/4ª competição da carreira) — CONCEITO AVANÇADO, ainda não codado
Evoluiu bastante desde o brainstorm inicial (14/08): o Diego mandou a
**especificação COMPLETA e literal** do chaveamento (64 clubes: 16 Série A
de bye + fase de grupos com 16 grupos de 5 peneirando 80 times até 32,
sorteio em 2 potes pra formar a chave de 64, regra de mando de campo) —
essa Copa do Brasil **SUBSTITUI a Copa Legends**. Também fechou a
**Supercopa Legends** (Liga × Copa do Brasil, jogo único, vice da Série A
entra se o mesmo time ganhar as duas) e a **identidade visual das duas**
(Copa do Brasil = verde brilhante + amarelo detalhe; Supercopa = azul
brilhante + amarelo detalhe — invertida de propósito pra não confundir).
Mockup de tabela/potes/funil/placar das duas já **mostrado e aprovado no
visual**. **AINDA NÃO aprovado pra codar** — falta fechar o calendário
(sequencial x misturada) e outros detalhes. Tudo documentado em
**`docs/conceito-copa-brasil.md`** — ler antes de qualquer trabalho nisso.

## 🎯 Copa dos 8: tática pra DEPOIS do placar + box mais clean (igual liga) — ✅ NO AR (14/08)
Dois pedidos direto do celular do Diego, na tela da Copa dos 8 (`screens.tsx`):
1. **Ordem errada**: a caixa "Sua tática na Copa" vinha ANTES do placar ao
   vivo (o jogo principal) — Diego: "tá errado". Movida pra DEPOIS do placar
   (banner da Copa → intro "chegou a copa" quando aplicável → placar ao vivo
   → tática → todos os jogos da fase). Bate com o padrão da Liga, onde o
   placar sempre vem primeiro.
2. **Box de tática mais limpo**: comparando os dois (Copa × Liga), o da Copa
   é mais clean — só título + botões + explicação. O da Liga tinha, além
   disso, uma barra de progresso da temporada + "⏱️ Temporada rolando
   sozinha — sente e assista." (decorativo, a Copa nunca teve isso). Tirei
   essa barra+texto da Liga também, pra ficar igual. Mantive a linha
   "PRÓXIMO: Time × Time (casa/fora)" — é informação real (quem é o
   próximo adversário), não decoração; só a Copa não tinha porque ali o
   próximo jogo já é óbvio pelo contexto do mata-mata.
Reversível: `git revert`. Só reordenação/remoção de elementos, nenhuma
regra ou dado mudou.

## ⚽ Placar ao vivo: 2 ajustes finos depois do reskin — ✅ NO AR (14/08)
Diego testou o reskin (item abaixo) no ar e pediu 2 ajustes pontuais:
1. **Escudo tava pequeno demais** — tinha reduzido de 34→26px pra "arejar" o
   card; voltei pro tamanho original (34px, 28px no basquete).
2. **A linha do relógio embaixo do placar "não fazia sentido"** — perguntei
   e ele confirmou: queria o relógio DE VOLTA como pilulazinha flutuando por
   cima do placar (como sempre foi), não uma linha própria separada. Voltei
   exatamente pro pill original — só que agora ele flutua sobre uma área
   `position:relative` própria (não mais sobre o card inteiro), porque a
   faixa de GOOOL no topo (essa sim ficou, ele gostou) agora ocupa espaço
   de verdade acima em vez de ficar por baixo de tudo.
Testado de novo isolado (mesmo método: jogo simulado, prints a cada 150ms)
antes de subir. Reversível: `git revert`.

⚠️ Diego também comentou que "a arte do giro da rodada e da área de tática
não mudou" — conferido: a tática JÁ batia com o mockup desde antes (não
precisava mudar) e o giro JÁ está girando sozinho com bolinhas (dá pra ver
no print dele mesmo). Deixei uma pergunta pra ele: o que falta é a ROTAÇÃO
(que já existe) ou ele quer uma ARTE nova pros dois quadros (cores/ícones
diferentes, tipo um mockup novo)? Não mexer sem essa resposta.

## 🚨 3 BUGS SÉRIOS relatados por usuário no Carreira (14/08) — 1 corrigido, 2 investigando
Relato via Diego. Status de cada um:
1. **⏳ Gol de jogador NO BANCO com o jogo 0x0** (Roberto Carlos reserva
   com ⚽5 na aba Elenco › Time — print do leodiniz85 recebido 14/08).
   Diagnóstico REFINADO com o print (2 mecanismos combinados, ambos reais):
   a) **Auto-preenchimento silencioso**: quando a escalação salva fica com
      buraco (titular vendido/emprestado/contrato vencido — o elenco dele
      tem Cerezo "vencido" e Beckenbauer "último ano"!), o `lineupAt`
      completa a vaga com o MELHOR do banco na posição — que no caso é o
      Roberto Carlos (LAT 94, o melhor reserva). Ele entra em campo pela
      porta dos fundos SEM o usuário saber, marca, e "volta pro banco"
      quando o usuário arruma a escalação. Os gols ficam no contador.
   b) **Contador na frente da animação**: o ⚽ da aba Elenco vem do
      `goalsByCard`, que já inclui a rodada que AINDA está animando no
      placar — por isso "fez gol com o jogo 0x0" (spoiler, que o Diego
      odeia). Correção precisa de cuidado: atrasar a estatística até o
      apito sem quebrar tabela/artilharia (mexem na mesma fonte).
   ✅ PARTE (a) CORRIGIDA (14/08): aviso visível na aba Elenco › Time
   sempre que a escalação salva tem buraco (titular saiu do clube) e
   alguém do banco está completando a vaga automaticamente — lista QUEM
   está completando e manda o técnico escolher. Some sozinho quando ele
   salva a escalação de novo. Regra do Diego: completar pode (nunca joga
   com 10), mas NUNCA em silêncio.
   ✅ PARTE (b) CORRIGIDA (14/08): o anti-spoiler (`revealed`) já existia
   pra tabela/artilharia/contador, mas o relógio dele era FIXO — quando a
   partida PAUSAVA no meio (intervalo dos 45' ou pênalti decisivo
   esperando o técnico), o relógio disparava mesmo assim e entregava os
   gols com o placar parado em 0x0 (o caso exato do relato). Agora, com
   pendência aberta, o relógio nem arma — só depois que o técnico resolve
   o intervalo/pênalti é que a contagem pro reveal começa. Atraso é
   seguro; vazamento, nunca. (Efeito movido pra depois das definições de
   halfMode/penMode no pyramidseason.tsx.)
2. **✅ CORRIGIDO — "hack" do F5 na Copa do Mundo**: dava pra assistir o
   torneio, não gostar, atualizar a página e escolher OUTRA seleção (a
   escolha só era gravada no FIM, na final). Agora a escolha é CARIMBADA
   no momento em que o torneio começa (`emAndamento` no save local da
   Copa): F5 volta pro MESMO torneio, mesma seleção, mesmo time, mesmo
   resultado (a simulação é semeada). O carimbo limpa quando a final é
   gravada de verdade. ⚠️ Não dá pra desfazer os títulos que já foram
   "farmados" assim — sem registro de quantas vezes cada um refez.
3. **⏳ Pontos da classificação "não atualizam" nas rodadas finais da
   liga** (intermitente). Detalhe novo do Diego 14/08: era a SÉRIE A do
   próprio usuário, últimas rodadas, ele não lembra mais que isso.
   Análise: as últimas rodadas de Série A são exatamente onde o PÊNALTI
   DECISIVO é sorteado ("jogo de última hora que um gol empata/vira") —
   e a tabela é segurada DE PROPÓSITO (anti-spoiler `revealed`) enquanto
   a rodada anima/tem pendência. O auto já pausa e os banners abrem
   sozinhos (conferido: linhas ~4356-4363), então não é rodada travada
   muda. Possibilidades restantes: (a) percepção — a tabela fica mesmo
   parada até o apito/decisão, e nas retas finais o usuário olha ela sem
   parar; (b) algum caso raro que os fixes de 13-14/08 (sincronia do
   pênalti + reveal esperando pendência) já mudaram. COMBINADO: observar
   — se acontecer DE NOVO depois do deploy de 14/08, pedir print da
   tabela congelada + o que a aba Jogos mostrava no momento (tem banner
   aberto? partida animando?). Sem novo caso, considerar resolvido pelos
   fixes de sincronia.

## ⚽ Placar ao vivo (`LiveScoreCard`) refeito na forma exata do mockup — ✅ NO AR (14/08)
Diego pediu explicitamente a forma EXATA do mockup animado que ele já tinha
aprovado. Reskin do `LiveScoreCard` (`pyramidseason.tsx`, usado em TUDO: liga
da carreira, jogo rápido/online, Copa dos 8 e Copa do Mundo Legends — 1
componente só, muda em todo lugar de uma vez):
- **GOOOL virou faixa no topo** (largura total, some sozinha) — antes era um
  carimbo tombado em cima do time que marcou.
- **Relógio ganhou linha própria** embaixo do placar (●AO VIVO … minuto) —
  antes era uma pílula preta flutuando por cima, fácil de não notar.
- Painel de time mais compacto (escudo menor, menos respiro) — cara mais
  parecida com o card "mini" do mockup.
- **NADA da lógica mudou**: frases variadas de gol (GOOOL/PINGOU/GOLAÇO/gol
  nos acréscimos), narração de apito inicial/intervalo/final, selo 🥊
  CLÁSSICO, cor do TIER de quem paga (sagrado — não virou gradiente único
  como no mockup, cada lado mantém a cor de verdade) e a trava anti-spoiler
  seguem 100% como estavam — só toquei no JSX/CSS do render final.
- **Testado de verdade antes de subir**: montei o componente isolado com um
  jogo simulado (gol aos 21', empate aos 58', fim aos 90') e conferi
  print a print que a faixa de gol aparece/some, o placar dá bump, o
  relógio sobe e o apito final aparece — sem precisar jogar uma temporada
  inteira pra validar.
Reversível: `git revert`. Se algo parecer estranho no celular, é só falar.

## 📣 Giro da rodada agora GIRA sozinho (uma manchete por vez) — ✅ NO AR (14/08)
Diego insistiu (com print do mockup do lado) que o giro da rodada devia
"rolar" igual o mockup mostrava, não ficar empilhado. Antes: lista fixa
com até 4 manchetes juntas. Agora: componente novo `GiroDaRodada`
(`screens.tsx`) mostra UMA manchete por vez, troca sozinha a cada ~3,2s com
fade, bolinhas embaixo marcando qual tá ativa — igual o mockup animado.
A trava anti-spoiler NÃO mudou (quem decide o que pode aparecer continua
sendo a mesma lógica de antes, `giroReady`/`isCopaReveal`); só a VITRINE
virou carrossel. Usado no Jogo Rápido/Online (liga e Copa dos 8); a
carreira não tem esse quadro de notícias (nunca teve, fora de escopo).
Reversível: `git revert`.

⚠️ Nota pro Diego: o placar com relógio/GOOOL/flash (`LiveScoreCard`) já
existe e funciona nos dois modos — mas só anima ENQUANTO o jogo está
rolando (relógio contando). Se olhar depois do apito ("FIM"), não tem mais
nada pra animar. Se depois de ver ao vivo ele achar que o ESTILO (não a
existência) devia ficar mais parecido com o mockup (faixa colorida por
time, banner de GOOOL em vez de carimbo), é um pedido de reskin — avisar
explicitamente, não mexer sem ver de novo (componente já é bem afinado,
com direito a frases variadas de gol/apito e trava anti-spoiler própria).

## 🏆 Tabela da CARREIRA (Série A/B/C/D): mesma cara da tabela nova — ✅ NO AR (14/08)
Diego reclamou que a carreira não tinha mudado nada visualmente. Certo: eu
tinha só mexido no Jogo Rápido/Online de propósito (lá tinha um descompasso
real G4≠Copa dos 8; na carreira G4=4 já é a Copa Legends E o acesso, sem
descompasso). Mas fiquei devendo a MESMA CARA visual. Ajustado em
`pyramidseason.tsx` (`DivTable`/`zone`/`ZoneLegend`):
- G4 (topo) de azul → **verde** (`#D8F0DE`, mesmo tom da tabela do rápido).
- Etiquetas **G4** (dourada) e **Z4** (vermelha) nas linhas, do mesmo jeito
  que a tabela do rápido — antes só tinha a cor de fundo, sem etiqueta.
- Legenda do topo (G4/Meio/Z4) com as mesmas cores/bordas.
- **Número do G4 continua 4** (não vira G8) — na carreira é 4 mesmo, tanto
  pra acesso de divisão quanto pra vaga na Copa Legends (top-4 de cada
  série = 16 no mata-mata). Não tinha bug de régua aqui, só de visual.
Reversível: `git revert`, só cor/etiqueta.

## ⚽ Placar animado: NÃO precisa implementar, JÁ EXISTE (`LiveScoreCard`)
Confusão minha numa sessão anterior: cheguei a dizer ao Diego que o placar
com relógio/GOOOL/flash "só existia no mockup". Errado — o `LiveScoreCard`
(`pyramidseason.tsx`) é real, já roda na carreira E no jogo rápido/online
(`myLast` em `screens.tsx`), com relógio 0→93 em tempo real, flash+bump no
gol, narração variada (apito inicial/intervalo/final). O que o Diego via
nos prints era o jogo já em "FIM" (93') — não tem animação porque já
acabou, não porque não existe. **Giro da rodada** também não é bug: mostra
uma lista fixa das últimas 4 manchetes (não gira uma por vez) DE PROPÓSITO,
por causa da trava anti-spoiler (só troca no apito). Se o Diego quiser o
efeito de "girar uma de cada vez" tipo o mockup, é uma mudança de ESTILO a
pedir explicitamente — não uma correção de bug.

## 🏆 Tabela: badge G8/Z4 simétrico + legenda embaixo — ✅ NO AR (14/08)
Diego testou no ar e achou que só o G4 (1-4) ter etiqueta e o Z4 não ter
ficava capenga, e que o rótulo devia ser G8 (bate com quem classifica de
verdade pra Copa dos 8), não G4. Ajustado em `screens.tsx` (`TableBox`):
- Etiqueta dourada nas linhas agora é `G{copaN(n)}` (G8 numa liga de 20) e
  cobre as MESMAS 8 linhas do fundo verde — não é mais um subconjunto de 4.
- Etiqueta vermelha `Z{zoneN(n)}` (Z4) adicionada nas últimas 4 linhas,
  simétrica à G8 (antes só tinha a cor de fundo, sem etiqueta).
- Legenda do cabeçalho da tabela ajustada pra bater (G8 em vez de G4).
- Frase nova embaixo da tabela (só no futebol): "🏆 G8 = os 8 primeiros —
  quando a liga acaba, disputam a Copa dos 8." Proporcional ao tamanho da
  liga (`copaN`/`zoneN`), igual o resto do sistema de zonas.
Reversível: `git revert`, só rótulo/legenda, nenhum dado mudou.

## ✨🏆 Brilho holográfico na Copa dos 8 (roxo) e Copa Legends (verde) — ✅ NO AR (14/08)
Mockup aprovado (artifact enviado no chat). Diego pediu "roxo brilhante,
igual ao Promessa" pra Copa dos 8 (online) e o mesmo brilho no verde-escuro
da Copa Legends (carreira) — reaproveitando o MESMO mecanismo de brilho que
a carta 💎 Promessa já usa (degradê + feixe de luz varrendo em diagonal),
sem inventar efeito novo:
- **Copa dos 8** (`screens.tsx`): `PURPLE_HOLO` = mesmo degradê da carta
  Promessa (`#C9A9FF → #8B5CF6 → #5B2FB0`). Aplicado nos 2 banners de
  cabeçalho ("COPA DOS 8"/"Chegou a Copa dos 8!") com `ApoioSheen`
  reaproveitado de `apoio.tsx`, e na borda/barra de progresso do card do
  jogo ao vivo.
- **Copa Legends** (`pyramidseason.tsx`): `COPA_LEG_HOLO` = degradê verde
  (`#3E8F5C → #14401f → #0a2612`) com um brilho novo `CopaLegSheen`
  (mesma keyframe `apoioSheen` global, só que o feixe sai dourado/quente em
  vez de branco — reforça "troféu"). Aplicado no banner "COPA LEGENDS" da
  aba Tabelas e na borda/barra do card do jogo ao vivo.
- **NÃO mexi** no cabeçalho grande do clube (torcidômetro/moedas/rodada, que
  também fica verde durante a Copa Legends) — não estava no mockup aprovado
  e é uma área densa demais pra arriscar sem Diego ver antes.
- **NÃO mexi** na tabela de divisão da carreira (Série A/B/C/D) — o G4/Z4 de
  lá já é a regra real de acesso/queda, sem descompasso pra corrigir.
Reversível: `git revert`, é só cor/gradiente/CSS, nenhuma regra mudou.

## 🏆 Tabela do Jogo Rápido/Online: faixa "classifica" única (Copa dos 8) — ✅ NO AR (14/08)
Mockup aprovado (`docs` — ver artifact enviado no chat). A tabela (Modo Rápido
offline/online, `TableBox` em `screens.tsx`) tinha 4 faixas de cor proporcionais
(G4 azul/Pré amarelo/Meio branco/Z4 vermelho) que NÃO batiam com a regra real
da Copa dos 8 (top 8 = 40%, não os 20% do G4 antigo). Trocado por:
- **Faixa verde única (1 a 8 numa liga de 20)** = "Classifica" pra Copa dos 8
  — `copaN(n)`, proporcional (40% de cima), nova função em `screens.tsx`.
- **Etiqueta dourada "G4"** só no número da posição das 4 primeiras linhas —
  não é mais uma cor de fundo própria, fica dentro da faixa verde.
- **Faixa vermelha nos últimos 4** (zona de risco) — mantida exatamente como
  já era (`zoneBot`, 20% de baixo — não mexi nessa conta).
- Tabela continua **inteira** (todas as linhas, todos os dados: P/V/E/D/SG) —
  Diego pediu explicitamente pra NÃO resumir depois de ver a 1ª proposta.
- Artilharia (`TopScorersBox`) já usava a mesma linguagem visual (caixa/
  colunas #·Jogador·Time·Gols) — não precisou mexer.
- Não toquei nas tabelas de DIVISÃO da carreira (`DivTable`, pyramidseason.tsx)
  — lá o G4/Z4 já É a regra real de acesso/queda, sem descompasso. Reversível:
  `git revert`.
## 🛡️ BATISMO Barcenite FC (Ricardo, ricardopessoafreire@gmail.com) — ✅ COMPLETO (14/08)
Diego aprovou o card vertical (escudo + mascote + manto) — tudo no ar:
- **Escudo** em `LOGOS_PRONTAS` (escudos.tsx, chave 'Barcenite FC' — o nome
  velho Milanesa FC resolve via newestTeamName). Estilo Barcelona sem
  copiar: topo azul + BFC dourado, faixa dourada, base listrada com bola.
- **Mascote "gatao_bfc"** em MASCOTES (mascotes.tsx) — Gatão amarelo/azul
  inspirado no CAT do Barça, desenhado em código (SVG). Se o Diego quiser
  versão IA depois, regerar quando o OpenArt MCP voltar.
- **Banco**: manto #FFC400/#0E3E86 · mascote_key 'gatao_bfc' ·
  time_coracao 'Flamengo' — tudo em esc_socios.
Detalhes do processo abaixo (entrada original):

## 🛡️ BATISMO Barcenite FC — histórico (14/08)
Ricardo é o Sócio Barão nº 12; o NOME já estava batizado (Barcenite FC,
ex-Milanesa FC, Série D). Diego pediu o kit completo:
- ✅ **Manto**: amarelo #FFC400 + azul #0E3E86 — JÁ APLICADO no banco
  (esc_socios, entrega sem deploy). Time de coração (Flamengo) registrado
  no campo time_coracao.
- ⏳ **Escudo**: proposta desenhada (mockup enviado pro Diego 14/08) —
  formato que LEMBRA o brasão do Barcelona sem copiar nada (regra da casa:
  escudo de clube real é marca registrada): topo azul com "BFC" dourado,
  faixa dourada, base listrada amarelo/azul com bola. AGUARDANDO OK do
  Diego pra entrar em LOGOS_PRONTAS (escudos.tsx).
- ⏳ **Mascote**: será um gato caricato amarelo/azul inspirado no CAT
  (gato-selvagem, mascote real do Barcelona desde os 125 anos do clube).
  A ferramenta de gerar imagem (OpenArt MCP) estava FORA DO AR em 14/08 —
  gerar quando reconectar, mandar pra aprovação, aí converter pra webp
  ≤40KB e registrar em mascotes.tsx + mascote_key no esc_socios.
- 📋 Série D — times ainda LIVRES pra futuros batismos (lista pedida pelo
  Diego): principais = Paris São Geraldo · Pardemeias · Flamengo do
  Sertão; leva extra (carreiras novas com Várzea) = Ferroviário da Serra,
  Operário do Sul, Comercial da Baixada, Nacional do Agreste, Independente
  do Norte, Esportivo da Colônia, União da Fronteira, Guarani do Cerrado,
  Marítimo da Ilha, Rural EC (10, todos livres).

## 🎭🐛 FIX: machucado voltava pro time pela troca de formação/intervalo — ✅ NO AR (14/08)
Relato de usuário (via Diego): jogador se lesionou, o Cria da Base entrou,
o machucado foi pro banco — mas ao "alterar a escalação" o usuário
conseguiu colocar o machucado DE VOLTA no time antes da rodada da volta.
Investigação: a troca direta no campinho já era travada (tela + motor),
mas existiam DUAS portas laterais sem trava:
1. **Troca de formação** (a principal): o `CHANGE_FORMATION` remontava o
   "melhor XI" da formação nova com o elenco INTEIRO — incluindo o
   suspenso (lesão/gancho/noitada). Agora o suspenso fica fora da
   remontagem até a rodada da volta.
2. **Intervalo** (2º tempo): a troca de jogador e a troca de formação do
   `HalftimeBanner` não checavam o suspenso. Agora a tela bloqueia o
   toque nele (mesma regra da escalação normal) e o motor (`SET_HALFTIME`)
   tem a trava de verdade — mesma dupla proteção do `SET_LINEUP`.
Regra preservada: trava sempre com o aviso do porquê (o banner "fulano
está fora — volta na rodada X" já existia e continua). Reversível:
`git revert`, não muda nenhuma regra de jogo além de fechar o furo.

## 🤝📊 MEDIA KIT pra apresentar a marcas/patrocinadores — ✅ entregue v1 (14/08)
Diego pediu um media kit de alta qualidade pra apresentar o jogo a
empresas (bets e outras) e buscar patrocínio. Entregue como página HTML
na identidade do jogo (creme/tinta/dourado/Oswald), cópia salva em
**`docs/media-kit.html`** (abre no navegador; NÃO deploya — docs/ fica
fora do build). Estrutura: capa · como funciona · números · gráfico de
volume diário · engajamento · público · tese · formatos · contato.
- **Métricas 100% REAIS**, tiradas do banco de produção em 14/08 (nada
  estimado): 7.030 contas (desde jun/2026) · 178.808 títulos desde 15/07
  (3–12 mil/dia) · 104.411 temporadas nas carreiras ativas · 1.128
  técnicos de carreira ativos/7d · 443 ativos/24h · +565 contas na última
  semana · recorde 783 temporadas · 317 carreiras com 100+ temporadas ·
  6.119 usuários com troféu · 40% retenção semanal (carreira).
- **Tese central** (o pulo do gato do kit): "patrocínio não é banner, é
  MECÂNICA" — o técnico ESCOLHE o patrocinador toda temporada e joga pela
  meta da marca; Max Joias/Rei das Tintas/Vadico/Ero citadas como prova
  de conceito já rodando.
- Formatos ofertados: Patrocínio Master jogável · naming rights de copa ·
  marca no estádio · torneio patrocinado com prêmio.
- ⚠️ Honestidade dos números: o jogo tem ~2 MESES (1ª conta 11/06), não
  30 dias — o kit fala "2 meses" e o gráfico cobre os últimos 30 dias
  (registro de títulos começou 15/07). Não inventei demografia (idade/
  gênero) — não temos esse dado; o "quem joga" é qualitativo.
- Pendente de o Diego revisar: textos, se quer foto/print do jogo dentro
  do kit, e se o e-mail de contato tá certo. Iterar aqui mesmo no HTML.

## 🕴️ Bico de Folga: visual novo (card "emprego" + 1 botão) — ✅ NO AR (14/08)
Diego não gostou do card de status do Bico (texto corrido + 2-3 botõezinhos
"trocar" espremidos, piorou com a 4ª marca). Mockup aprovado, implementado:
- Vira um cartão de "carteirinha" — ícone grande, nome, cargo e valor em
  destaque num topo verde, igual à cara dos outros cards do jogo.
- Embaixo, **um botão só**: "🔁 Trocar de bico". Ao tocar, o botão vira a
  lista das 4 marcas (a atual marcada em verde "atual"), com "cancelar" pra
  fechar sem trocar. Escolheu outra → troca na hora e a lista fecha sozinha.
- Só mudou layout/CSS — valor, regra de desbloqueio (T3+ Várzea/D) e a
  lista de marcas continuam 100% iguais. Reversível: `git revert`.

## 🥅 Várzea entra no desempate do Ranking (última posição, antes do dinheiro) — ✅ NO AR (14/08)
Pedido do Diego: título de Várzea (V) passa a contar no desempate — como
ÚLTIMO critério de título, depois de D e antes do dinheiro. Ordem final
(igual nos 3 lugares): Copa do Mundo · Série A · Copa Legends · Série B ·
Série C · Série D · **Várzea** · dinheiro.
- Ajustado no Ranking Local (Rank › Local), no cálculo de quem entra na
  Copa do Mundo (Top 20), e nas duas funções do banco (`esc_pyramid_rank`
  e `esc_pyramid_my_rank`) que alimentam o Rank Global — os 3 ficam
  consistentes entre si.
- Os selos visuais (🏆B 🏆C 🏆D 🏆V) já apareciam nessa ordem antes — só o
  CRITÉRIO de desempate que não usava Várzea, agora usa.
- Reversível: `git revert` no código; a função do banco tem a versão
  anterior salva no histórico de migrations do Supabase.

## 🔧 Copa do Mundo perdida: recuperados 3 casos reais (dado verificado, não invenção) (14/08)
Diego pediu pra tentar repor a Copa do Mundo que o dono do "Dérick FC"
tinha perdido. Achei uma saída honesta: existe uma tabela separada
(`esc_results`) que grava CADA título de Copa do Mundo no momento exato
que acontece, na nuvem, desde 04/08 — é registro real, não invenção.
- **Dérick FC**: tinha 7 títulos de verdade (não 6 como eu tinha achado
  antes) — repus certinho, contando só da carreira com Agência 2.0 dele
  (ele tem 2 carreiras; a outra não conta pro ranking).
- **Conferi TODO MUNDO** com esse mesmo método (comparando o registro real
  com o que tava salvo) e achei mais **2 contas** genuinamente sub-
  contadas: **Kata-Kata** (tinha 0, eram 3) e **Smith** (tinha 0, era 1).
  Corrigi as duas do mesmo jeito.
- **Importante**: só "consertei" quando achei EVIDÊNCIA real (registro na
  esc_results maior que o salvo) — não inventei número pra ninguém. Pra
  quem a gente não tem esse cruzamento possível (ex.: título ganho antes
  de 04/08, quando essa tabela nem existia ainda), não dá pra recuperar —
  ficou perdido de vez, como já expliquei antes.
- Isso foi correção de DADO (via SQL), não mudou nenhum código novo além
  do que já tinha sido commitado antes (mural na nuvem).

## 🎨 Rei das Tintas — novo patrocinador real — ✅ NO AR (14/08)
Diego mandou a logo real (`src/escalacao/reidastintas.ts`, embutida como
data URI igual Vadico/Ero/Max Joias). Entrou em dois lugares:
- **Bico de Folga** (Clube › Patrocínio): 4ª opção ao lado de Vadico/Max
  Joias/Ero — "pintor de parede nas folgas", mesmo valor por divisão de
  sempre (2🪙 Várzea · 4🪙 Série D, não muda por marca).
- **Patrocínio por aposta** (tier 2, tela de início de temporada): substituiu
  a Borracharia do Gordo — agora mostra a logo real do Rei das Tintas.
Saves antigos que tinham escolhido a Borracharia como aposta da temporada
não quebram (nome só fica em branco no card antigo, sem crashar) —
reversível: `git revert`.

## 🌍☁️ COPA DO MUNDO agora "anda" com o save na nuvem (14/08)
Continuação da investigação do ranking global: um usuário (Dérick FC) notou
que, depois do bug do 2º clube corrigido, o número de Copa do Mundo dele
tinha CAÍDO (tinha 6, apareceu 2). Analisei a fundo — Diego perguntou se
tinha algo errado com mais gente, então audite a tabela inteira:
- **A causa raiz** (bem diferente do bug do multiclube): TUDO no jogo já
  sincroniza pela nuvem (títulos de liga, Copa Legends, dinheiro) — MENOS a
  Copa do Mundo Legends, que sempre foi guardada só no APARELHO da pessoa
  (decisão antiga, feita de propósito isolada pra ser fácil de reverter se
  desse problema). Resultado: quem troca de aparelho, limpa o navegador etc.
  perde a CONTAGEM de Copa do Mundo no ranking (o resto continua intacto).
- **Conferi todo mundo**: só essa 1 conta tinha uma queda registrada — não é
  espalhado, mas o RISCO é de todo mundo (é estrutural, não um bug pontual).
- **O que já não dava mais pra recuperar**: o histórico perdido dele (as 4
  conquistas que sumiram) já não existe em lugar nenhum acessível — nunca
  foi salvo fora do aparelho antigo dele. Isso não tem conserto.
- **O que consertei pra não acontecer de novo com ninguém**: agora, toda vez
  que a Copa do Mundo é disputada (ou a tela dela é aberta), uma CÓPIA do
  "mural" (histórico de conquistas) viaja junto com o save que já sincroniza
  na nuvem — sem mexer no motor de verdade da Copa do Mundo (que continua
  100% isolado, do jeito que foi feito por segurança). O ranking passa a
  somar as duas fontes (aparelho + nuvem), então a partir de agora ninguém
  mais perde essa contagem trocando de aparelho — e quem AINDA tem o
  histórico intacto no aparelho vai "sincronizar" ele automaticamente na
  próxima vez que abrir a tela da Copa do Mundo (sem precisar fazer nada).
- Reversível: `git revert` (é só um campo novo espelhando, não mexe em nada
  que já existia).

## 🐛🌍 RANKING GLOBAL: achado e corrigido o bug do "time some do rank" (14/08)
Diego reportou reclamação real (dono do "Xurupitas FC", que tem 232 títulos
de Série A — muito provavelmente o time mais decorado do jogo — sumindo do
ranking global de todo mundo). Investiguei a fundo, achei a causa raiz:
- **A causa**: quando um técnico usa o Multiclube (compra um 2º clube e
  troca o comando pra ele — recurso oficial, "troca livre"), o retrato do
  ranking global gravava os troféus do clube QUE ESTIVER NO COMANDO
  naquele momento — inclusive quando era o 2º clube (fraco, recém-
  comprado, quase sem título nenhum). Isso sobrescrevia o histórico do
  clube PRINCIPAL: o Xurupitas FC (232 títulos) sumiu do rank porque a
  última gravação, com o 2º clube ("Excelsior SAF") no comando, tinha 0
  títulos — o sistema achou que ele tinha "regredido" do nada.
- **Confirmei que não é só ele**: auditei TODA a tabela e achei mais 3
  contas com o mesmíssimo problema (2 delas trocando de comando várias
  vezes, iam e voltavam entre os 2 clubes o tempo todo).
- **Consertei os dois lados**:
  1. Código: agora o retrato SÓ grava quando o clube PRINCIPAL está no
     comando — o 2º clube (multiclube) nunca mais entra no ranking global,
     exatamente a regra que o Diego pediu ("segundo time não conta").
  2. Dados: apaguei as 32 linhas erradas (gravadas com o 2º clube) das 4
     contas afetadas — o histórico do clube principal delas volta a valer.
     Conferido: Xurupitas FC já aparece de novo em 1º lugar no rank.
- Achei também 2 casos bem menores (diferença de 1 troféu, times quase
  zerados) que são outro bug já conhecido e registrado antes (dado velho
  de `careerCopaHonors` às vezes ficando torto num restart de carreira) —
  não mexi, é separado e de impacto bem menor.
- Reversível: o código é `git revert`; os dados apagados eram só as linhas
  erradas (o histórico bom continua intacto — nada foi perdido).

## 🔁 Leilão de Reservas com cara diferente do inicial — ✅ NO AR (14/08)
Último item da auditoria de UX (item 5, parte 2). O leilão de reservas/
transferências (meio da carreira, repõe o elenco) usava o MESMO topo
branco do leilão inicial — só um textinho pequeno perto do campo avisava
que era outro leilão. Agora o topo (barra fixa de posições + moedas, em
TODAS as telas do leilão — lance, revelação, desempate) fica **lilás**
com o rótulo "🔁 Leilão de Reservas" (ou "🔁 Leilão de Transferências" a
partir da 2ª vez), pra bater o olho e já saber de cara que não é o leilão
inicial. Sem mockup prévio dessa vez — o Diego pediu pra seguir direto
("pode fazer"). Se não gostar da cor/lugar, é só `git revert`.
- A "fase X de 4" (item 5, parte 1) segue **fechada, não vamos fazer**
  (ver decisão abaixo) — isso aqui foi só a parte do leilão de reservas.
- ⏳ Ainda em aberto da auditoria original (sem decisão do Diego, NÃO
  começar sem OK): reorganização visual da **Home** (muitos botões com o
  mesmo peso, "em breve" no meio dos que funcionam — mandei recomendação
  por texto, ofereci mockup, Diego não confirmou ainda). Fora isso, os
  itens 3, 4 e 5 (avisos, Copa do Mundo, leilão de reservas) estão feitos
  e o item da fase do leilão foi fechado como "não vamos fazer".

## 🌍 Copa do Mundo: "(aba Rank)" virou link de verdade — ✅ NO AR (14/08)
Item 4 da auditoria de UX, mockup aprovado — mas o Diego pediu escopo
menor: só o link, sem o cartão de status fixo que eu tinha sugerido junto.
No texto que explica a regra da Copa do Mundo Legends (precisa estar no
TOP 20 do ranking de clubes), "(aba Rank)" agora é um link de verdade —
toca e já cai direto na aba Rank › Local. Aparece nos dois avisos que
citam essa regra (antes da temporada 100 destravar, e quando a temporada
é de Copa mas seu clube não tá no Top 20). Não mexi em mais nada — sem
cartão fixo, sem ícone novo, só o texto virou clicável. Reversível:
`git revert`.

## 🚨 Fila de avisos (1 por vez) no Modo Carreira — ✅ NO AR (14/08)
Item 3 da auditoria de UX, com mockup aprovado pelo Diego antes de codar.
Quando bate mais de um aviso "que some quando resolve" na mesma hora
(exemplo real dele: evento de jogador/lesão + crise financeira + contrato
de TV), agora aparece **UM POR VEZ**, com um contadorzinho ("1 de 3 avisos
pendentes") — em vez de empilhar tudo antes da barra de abas, obrigando
rolar a tela passando por todo mundo. Resolveu o de cima, o de baixo já
aparece sozinho, sem precisar de botão extra de "próximo".
- Entram na fila: 🎭 evento de jogador, 🚨 crise financeira, 📺 contrato de
  TV — os três "somem" da tela assim que resolvidos.
- **Fora da fila, de propósito**: 🤝 patrocínio (continua na tela mesmo
  depois de escolher, não é um item que "some" como os outros — misturar
  ia confundir mais que ajudar) e o aviso de suspenso (não é decisão, é só
  um lembrete curto, continua aparecendo normal).
- Não mexi em nada do intervalo/pênalti (banners de partida ao vivo) —
  ficam como sempre foram, essa fila é só pros avisos de temporada.
- A regra de "não pode fugir de decisão pendente" continua 100% igual —
  só mudou COMO aparece na tela. Reversível: `git revert`.

## 🚪 Confirmação antes de "Sair da conta" no Online — ✅ NO AR (14/08)
Item 6 da auditoria de UX (ver mais abaixo), só a parte que o Diego topou:
o botão "Sair da conta" da tela de Online (deslogava direto, sem aviso,
colado embaixo de "← Menu inicial" que só volta) agora pergunta antes
("Sair da conta? Você vai precisar entrar de novo..."), igual ao padrão
que outros botões de sair já usam no jogo. Não mudei o resto: não trocou
a aba padrão do Online, não mudou cor de nada. Reversível: `git revert`.

## 🔜 Status da auditoria de UX (14/08)
1. ~~Avisos empilhados~~ — ✅ feito (ver acima).
2. ~~Copa do Mundo sem "porta"~~ — ✅ feito (ver acima).
3. ~~Indicador de fase do leilão (X de 4)~~ — ❌ **DECIDIDO NÃO FAZER**
   (14/08). Diego: quem joga só vai acompanhando o leilão, não repara/não
   precisa desse contador extra. Fechado de vez, não é pendência — não
   precisa remexer nisso em sessão futura.
4. **Leilão de reservas com cara igual ao leilão inicial** (mesmo
   cabeçalho dourado, só um textinho pequeno avisa que é outro leilão) —
   combinado com o Diego trocar a cor do cabeçalho pra ficar diferente de
   cara. Vou mandar mockup antes de mexer. PRÓXIMO a fazer.

## 🕴️ Reorganização Elenco/Agência (passo 2 e 3 da auditoria de UX) — ✅ NO AR (14/08)
Continuação da auditoria de organização (ver entrada abaixo). Diego aprovou
os 3 pontos da aba Clube/Elenco:
- **Sub-aba duplicada corrigida**: dentro da aba "Elenco", a sub-aba padrão
  se chamava "👥 Elenco" — MESMO nome/ícone da aba-mãe. Agora é "🎽 Time".
  Só troca de rótulo/ícone, o conteúdo é o mesmo de sempre.
- **Agência num lugar só**: a escada de desbloqueios da Agência (🪵→👑, quanto
  do estádio libera cada categoria) morava em Clube›Estrutura, longe da
  escalação de verdade (Elenco›Agenciados). Mudei ela pra dentro de
  Elenco›Agenciados — agora tudo de Agência mora junto. Tirei o botão "Ver
  meus agenciados" que existia nela (não faz mais sentido, já estamos lá).
- **Ícone da aba "Clube" trocado** (💰 → 🏟️): a aba-mãe "Clube" usava 💰,
  IGUAL ao ícone da sua própria sub-aba "💰 Finanças" lá dentro — parecia
  a mesma coisa duas vezes. Agora a aba-mãe usa 🏟️ (estádio) e só a
  sub-aba "Finanças" fica com 💰. Ajustei também o texto do Manual do
  Técnico que citava o ícone antigo.
- Reversível: `git revert`. Não mexe em nenhuma regra/valor de jogo, só
  onde cada painel aparece e como se chama a sub-aba/ícone.

## 🥇 Sub-aba "Clubes" do Rank renomeada pra "Local" — ✅ NO AR (14/08)
Diego notou que "🥇 Clubes" (ranking com você + os bots da SUA carreira,
por títulos) tinha nome parecido com a aba-mãe "Clube" (finanças/estádio) —
confundia. Sugeri "Liga", ele recusou (dava impressão de só divisão/tabela).
Escolha final dele: **"🥇 Local"** — fica: Artilheiros | Local | Global.
Só troca o rótulo do botão, o conteúdo/ordenação do ranking não mudou em
nada. Reversível: `git revert`.

## 🗂️ AUDITORIA DE ORGANIZAÇÃO/UX do jogo inteiro (14/08) — análise feita, aprovado só o passo 1
Diego pediu análise MUITO a fundo de toda a navegação (Home, Carreira offline,
Leilão em todos os modos, Online/salas) — mandei 4 investigações em paralelo
mapeando TODAS as abas/sub-abas/botões. Achados principais (relatório
completo foi na conversa, não copiado aqui por ser longo — perguntar ao Diego
ou re-analisar se precisar):
1. **Nomes inconsistentes pro mesmo modo/botão** em vários lugares (Rápido,
   Online, Voltar) — cada tela usava um rótulo/ícone diferente.
2. Aba **"Clube"** é a mais confusa: nome não bate com o conteúdo (é o
   estádio), sub-aba padrão muda de nome (Estádio↔Estrutura) conforme
   `agenciaOn`, e "Agência" (antiga) vs "Agenciados" (nova) quase-homônimos.
   Sub-aba "Elenco" dentro da aba "Elenco" (nome duplicado).
3. Até **17 banners condicionais** podem empilhar ACIMA da barra de abas da
   temporada, ao mesmo tempo, enterrando a navegação.
4. Copa do Mundo Legends não tem aba/ícone fixo — só aparece dentro da pilha
   de banners de fim de temporada.
5. Leilão não tem indicador único de "fase X de 4" — cada fase tem seu
   próprio contador diferente. Leilão de reservas é visualmente idêntico ao
   inicial (só um detalhe pequeno no rodapé avisa a diferença).
6. Lobby online abre na aba "Salas abertas" em vez de "Criar sala"; botões
   "Sair da conta"/"Menu inicial" ficam parecidos e colados.

### ✅ FEITO (14/08): passo 1 — padronizar nomes (só texto, baixo risco)
- **Modo Rápido offline**: agora sempre "⚡ Rápido (offline)" (Manual do
  Técnico e filtro do Ranking já usavam nomes diferentes — unificado; filtro
  do Álbum virou "⚡ Offline" compacto, mesmo ícone).
- **Modo Rápido online**: agora sempre "👥 Rápido (online)" (Manual usava
  🌐+"Rápido Online", Ranking usava "Rápido online" sem parênteses —
  unificado com o ícone 👥 que já era o mais usado).
- **Botão "voltar pro início"**: unificado pra "🏠 Voltar ao início" em todo
  lugar que volta pra HOME de verdade (Setup, Álbum, Ranking já tinham a
  MESMA ação `GO_LOBBY` com rótulos diferentes: "← Home", "← Voltar" ×2).
  ⚠️ NÃO mexi no botão da sala online "🏠 Voltar pro menu" nem no link de
  emergência do rodapé "Travou na tela?" — esses dois fazem coisas
  DIFERENTES de verdade (um mantém a vaga na sala, o outro tem confirmação
  de segurança), então o texto diferente ali é correto, não é bug.
- Reversível: `git revert`. Só troca texto/ícone de botão, nenhuma ação
  (destino) mudou — testado conferindo o `dispatch` de cada botão antes de
  mexer, pra não juntar coisas que na verdade vão pra lugares diferentes.
- ⏳ PENDENTE (esperando Diego decidir prioridade): os itens 2-6 acima são
  mudanças de estrutura/visual maiores — não mexer sem aprovação.

## 🌍 FIX: 20 jogadores estrangeiros caindo em "Brasil" na Copa do Mundo — ✅ CORRIGIDO (14/08)
Diego: "MT gente reclamando... vários jogadores em países errados... Lodeiro,
Pochettino, Yotún e muito mais". Causa: `paises.ts` (`PAIS`, o mapa nome→país
usado pela Copa do Mundo Legends) — o baralho BR assume Brasil por padrão
quando o nome NÃO está no mapa; jogador estrangeiro esquecido cai errado.
Escrevi um script (Node, comparando os bios de `data.ts` que citam
nacionalidade contra as chaves de `PAIS`) e achei **20 faltando** — bem mais
que os 3 que ele citou:
- 🇦🇷 Argentina (11): Brítez, Pochettino, Matías Defederico, Lucas Pratto,
  Scocco, Machuca, Gabriel Mercado, Rodrigo Garro, Lucho González, Alexander
  Barboza, Marcelino Moreno.
- 🇺🇾 Uruguai (3): Martín Silva, Nicolás Lodeiro, Beto Acosta.
- 🇨🇴 Colômbia (2): Kevin Viveros, Rafael Borré.
- 🇪🇨 Equador (2): Félix Torres, Juan Cazares.
- 🇵🇾 Paraguai (1): Ángel Romero. 🇵🇪 Peru (1): Yoshimar Yotún.
- Todos com a nacionalidade tirada direto do BIO de cada carta (nunca
  inventei — é o texto que já existe no jogo descrevendo o jogador).
- Rodei o script de novo depois do fix: **zero faltando**. Não achei jeito
  de testar a Copa do Mundo ao vivo (só destrava na temporada 100 + Top 20),
  mas a correção é só dados (mapa nome→país), sem lógica nova — risco baixo.
- Reversível: `git revert`. Só mexe em `paises.ts`.

## 🏅 SELOS de troféu: ordem visual agora bate com a ordem de desempate — ✅ NO AR (14/08)
Diego mandou print de grupo (Gabriel comentando "caí pra terceiro mas olha a
diferença") — reparou que os selos apareciam Mundo→Copa→A→B..., mas quem
decide quem fica na frente é Mundo→A→Copa→B→C→D (mudança de hoje mais cedo).
Reordenei o visual dos selos pra bater com o peso de verdade — Mundo, depois
A, depois Copa, depois B/C/D/V — nos DOIS rankings (local `RankingTab` e
`GlobalRankTab`). Dinheiro continua por último em tudo (ele confirmou).
Reversível: `git revert`. Só troca a ORDEM que os selos aparecem, não muda
nenhum número nem a lógica de quem ganha de quem (isso já tava certo).

## 🌍 RANKING GLOBAL: Copa do Mundo decide ANTES da Série A — ✅ NO AR (14/08)
Diego pediu explicitamente (só o rank GLOBAL, não mexeu no local do save):
Copa do Mundo Legends na frente da Série A no desempate. Ordem nova:
**🌍 Mundo › 🏆 A › 🏆 Copa Legends › 🏆 B › 🏆 C › 🏆 D › 💰 dinheiro**
(antes era A › Mundo › Copa). Mudei as duas funções (`esc_pyramid_rank` e
`esc_pyramid_my_rank`, têm que ficar sempre iguais) + o texto da tela pra não
mentir "mesma régua do save local" (agora é diferente, de propósito).
⚠️ O rank LOCAL de cada save (aba Clubes, `RankingTab`) continua A › Mundo ›
Copa — Diego não pediu mudar esse. Testei: usuário com 1 título de A mas 6 de
Mundo agora fica na frente de outro com 107 de A e só 5 de Mundo. Reversível.

## 🔢 RANKING GLOBAL: posição real de quem tá fora do Top 50 — ✅ NO AR (14/08)
Diego: "quem fica fora do Top 50 dá pra mostrar a posição atual dele, além de
'fora do Top 50'?". RPC nova `esc_pyramid_my_rank(p_season, p_user_id)` —
mesma ordem/régua da `esc_pyramid_rank`, mas calcula a posição de UM usuário
só (mesmo fora do top 50), via `row_number()` sobre todo mundo. `GlobalRankTab`
chama ela só quando o técnico não aparece no Top 50 (não pesa a busca de
quem já tá na lista). Mostra "127º de 674" em vez de só "fora do Top 50".
⚠️ Se um dia mudar a ordem de desempate na `esc_pyramid_rank`, mudar as DUAS
funções junto (a lógica tá duplicada de propósito, são queries pequenas).
Reversível: `git revert`.

## 🔼🔽 RANKING GLOBAL: setinhas de quem subiu/desceu posição — ✅ NO AR (14/08)
Pedido do Diego: mostrar quantas posições cada um subiu/caiu de uma temporada
pra outra "passando ou sendo passado por alguém". `GlobalRankTab` agora busca
o rank da temporada ATUAL e da ANTERIOR (2 chamadas da mesma RPC
`esc_pyramid_rank`, em paralelo) e compara a posição de cada usuário nas duas.
- Como o rank é uma fila sem empate de posição, a diferença de posição JÁ É
  exatamente quantas pessoas a pessoa passou (ou foi passada) — não precisou
  de conta nova. ▲N verde = subiu N (passou N pessoas) · ▼N vermelho = caiu N
  (foi passado por N) · "novo" roxo = não tava no Top 50 ontem · "–" cinza =
  ficou na mesma posição.
- Temporada 1 não tem "ontem" pra comparar (fica tudo em branco, sem setinha).
- Reversível: `git revert`. Só a sub-aba Global, mais nada.
- ⏳ PENDENTE (mockup mostrado, Diego disse "depois falamos disso" — NÃO
  aprovado ainda, não codar sem OK): ajuste visual da tela de Patrocínio/Bico
  de Folga — dourado errado (#F5B301→#FFC400), fundo dos níveis fora da
  paleta (azul/amarelo claro → creme/dourado), sombra dura faltando nos
  botões de marca.

## 🌱 FIX: Cria da Base sem reserva não tinha banner — ✅ CORRIGIDO (13/08)
Diego mandou print de jogo real: "Denílson Show está fora... Pintinho segurou a
vaga" apareceu como notícia PRONTA, sem banner nenhum — a correção anterior (ver
entrada mais abaixo, "malandro de 11 jogadores") subia um cria SOZINHO, sem o
técnico escolher nem saber que rolou lesão. Corrigido: o banner do evento agora
abre normal (`EventoSemReservaBanner`, mesma cara do de sempre), mostrando 3
nomes GERADOS da base pra escolher — só o escolhido sobe de verdade pro elenco.
Noitada continua oferecendo "escalar assim mesmo" como alternativa. Nova função
`previewCriaNomes` (store.tsx) gera candidatos sem gravar nada até a escolha.

## 🕴️ BICO DE FOLGA — ✅ NO AR (13/08, mockup aprovado)
Pedido do Diego: dinheiro extra pra quem tá preso na Várzea/Série D, escolhendo
um patrocinador real do jogo pra "trabalhar na folga". Desenhado a fundo em
várias rodadas de dúvida antes de codar (onde mora, quando desbloqueia, se
duplica banner) — decisão final:
- **Nova sub-aba "🤝 Patrocínio"** em Clube (do lado de Estrutura/Finanças) —
  também passou a mostrar o status do patrocínio por aposta pra carreiras com
  Agência 2.0 (antes não tinha onde ver isso ali).
- **Libera na Temporada 3**, só enquanto o clube tá na Várzea ou Série D.
- **Valores**: +2🪙/temporada na Várzea · +4🪙/temporada na Série D.
- **3 patrocinadores reais**: Vadico Veículos 🚗 · Max Jóias 💍 · Ero Dentista 🦷 —
  escolha livre, de graça, troca quando quiser.
- **Sobe pra Série C**: desliga sozinho + notícia no mural ("virou patrão").
  **Cai de volta pra D**: reabre sozinho, MESMO patrocinador ("pediu emprego de
  volta") — a escolha nunca esquece, só pausa. Repete quantas vezes acontecer
  na carreira (não é banner de uma vez só — usa o mural/marketLog).
- Renda entra sozinha na virada de temporada, mesmo padrão de TV/Agência/Patrocínio.
- `state.careerBico`, ações `SET_BICO`/`BICO_NEWS` (store.tsx).
- ⚠️ Reversível: sub-aba isolada, não mexe em Estrutura/SAF/Agência.

## 🧹 LIMPEZA VISUAL — ✅ 1ª leva NO AR (13/08, mockup aprovado)
Diego reportou telas confusas depois de olhar prints do jogo ao vivo:
- **Controles da partida** (velocidade/próxima rodada/pular/modo auto) ficavam
  soltos, colados na navegação de abas — agora entram num cartão só
  ("🎮 Controle da partida"), separado visualmente da navegação. Vale na liga e
  na Copa.
- **Agenciados** ganhou um banner de apresentação (Guia da Carreira) explicando
  o conceito ("Agora você é empresário...") antes do painel técnico.
- **✅ Cores do Elenco — CORRIGIDO (13/08, mockup aprovado)**: Diego reportou
  (print) que a aba Elenco virava "parede amarela" — aba selecionada, tática
  (Equilíbrio) e substituição (Dinâmico) todas dourado. Corrigido: dourado
  segue só pra navegação; **tática selecionada = azul** (`#2F6BAE`);
  **substituição selecionada = verde** (`GREEN`) — cores já usadas em outras
  partes do jogo, nada de arte nova.

## 🌍 RANKING GLOBAL de usuários (aba Rank) — ✅ NO AR (14/08, mockup aprovado)
Pedido do Diego: rank mundial de USUÁRIOS de verdade (bots já têm o rank local),
mesma régua do ranking do save (títulos A›Mundo›Copa›B›C›D, depois dinheiro),
**top 50**, sub-aba própria do lado de Clubes/Artilheiros. Regra de ouro dele:
**anti-spoiler por temporada** — se eu tô na T15 e o outro já foi pra T89, só
vejo o que ele tinha feito ATÉ a T15 (nem um pouco do futuro dele). Só conta
carreira feita com **Agência 2.0** (`agenciaOn` — a mesma trava das 2 sub-abas
em Elenco); carreira antiga fica de fora.
- **Banco** (projeto certo é `faabglpjutwursgmrpny` — o `supabase/config.toml`
  do repo aponta pra OUTRO projeto errado/morto, cuidado se for usar ele de
  referência): tabela nova `esc_pyramid_rank_snap` (user_id, season_no, nome do
  time, títulos A/B/C/D/V, Copa Legends, Copa do Mundo, dinheiro) — um retrato
  POR TEMPORADA de cada usuário, não só o estado atual. RLS: todo mundo LÊ,
  cada um só grava a PRÓPRIA linha. Função `esc_pyramid_rank(p_season, p_limit)`
  pega, pra cada usuário, o retrato mais recente **ATÉ** p_season (nunca depois)
  — é isso que impede o spoiler — e devolve já ordenado/limitado. Testado na mão
  (2 usuários fake, um "do futuro") — bateu certinho.
- **Grava o retrato**: `pyramidseason.tsx` (dentro de `PyramidSeasonScreen`), um
  `useEffect` que dispara 1× por temporada nova (só carreira offline com
  `agenciaOn`) e sobe pro Supabase (melhor esforço — sem login/net, o jogo
  segue normal, só o rank de quem tá sem conta que não atualiza).
- **Lê o retrato**: `GlobalRankTab` (nova, mesmo arquivo) — sub-aba "🌍 Global"
  (só aparece com Agência 2.0 liberada), busca via RPC, mostra banner roxo
  fixo explicando o trava-por-temporada, badges de troféus iguais ao rank
  local, sua linha destacada (mesmo fora do Top 50).
- ⚠️ Não consegui testar dentro do jogo de ponta a ponta (precisaria de 2
  contas jogando carreiras de verdade) — testei a função do banco isolada e o
  build passou limpo. Se aparecer algo estranho, avisar.
- **✅ BACKFILL (14/08, mesmo dia — Diego reclamou "só 10 gente, mas muita gente
  já jogou"):** o rank só grava retrato em temporada NOVA a partir de quando foi
  ao ar — quem já tava jogando (729 contas com Agência 2.0 salva) não tinha
  nenhum retrato ainda. Rodei uma migração única puxando o estado ATUAL de cada
  um direto de `esc_pyramid_saves` (a carreira mais avançada com Agência 2.0 de
  cada conta) e gravei como retrato de hoje — 728 contas populadas na hora.
  - 🐛 **Bug separado, achado no caminho**: 3 saves tinham `careerCopaHonors`
    "herdado" de uma carreira anterior — números impossíveis (ex.: 49 títulos de
    Copa Legends numa carreira de 2 temporadas). Não é bug da minha feature, é o
    campo em si vindo sujo do save (provavelmente não reseta direito nalgum
    fluxo de reiniciar carreira/repescar) — **o Hall de Troféus LOCAL dessas 3
    contas também deve estar mostrando esse número errado**, vale investigar
    outro dia. Por enquanto, blindei os dois lados (backfill + a função
    `esc_pyramid_rank`) pra nunca mostrar mais títulos do que temporadas
    jogadas (`least(titulo, season_no)`) — mesmo se o jogo gravar sujo nesse
    campo de novo, o rank nunca mais expõe número impossível.
  - Copa do Mundo Legends fica 0 pra todo mundo NO BACKFILL (é dado só local no
    aparelho, nunca subiu pro banco — não dá pra recuperar histórico). Os
    retratos NOVOS (a partir de agora, a cada temporada) já gravam certo.
- **✅ FIX (14/08, Diego notou "Copa" no topo do rank sem sentido)**: o
  `least(titulo, season_no)` do item acima só limitava o TAMANHO do número
  errado, não zerava — as 4 contas com `careerCopaHonors` sujo (temporada 1-2,
  0 moedas gastas/0 título de divisão, mas "1-2 Copa Legends") ainda furavam
  pro topo do rank por causa do peso da Copa no critério de ordem. Zerei
  `copa_titles` nessas 4 contas especificamente (temporada ≤2 com copa>0 —
  ganhar Copa Legends exige terminar a temporada inteira, praticamente
  impossível legítimo nesse ponto). Rank confere: zero conta com Copa fake
  no topo agora.
- Diego achou estranho o rank ter muita conta "temporada 1, dinheiro variado"
  enchendo o Top 50 — CONFERIDO: é dado real (56% das 728 contas estão nas
  temporadas 1-3, é só quem começou a jogar Agência 2.0 há pouco tempo — a
  feature é recente). Cross-check numa conta específica ("Gru", T216) provou
  o retrato acompanhando o save AO VIVO, atualizando a cada poucos minutos
  enquanto a pessoa jogava (T201→T216, títulos e dinheiro evoluindo de
  verdade). Ele perguntou se queria esconder quem nunca deu lance — respondeu
  que NÃO, só queria confirmar que os dados batem (bateram).
- **✅ AUDITORIA COMPLETA (14/08, pedido explícito do Diego)**: ele lembrou a
  regra certa — só conta carreira com a Agência 2.0 DE VERDADE (a que tem as
  2 sub-abas em Elenco E convocação de 22, `agenciaOn`); a carreira antiga
  tinha "agenciados" só que DIFERENTE, sem essa forma — não vale. Rodei uma
  auditoria nas 728 contas do rank comparando com o save ATUAL de cada uma no
  banco: **achei 2 contas órfãs** (`Samba do Argumento`, `Well`) cujo save
  mudou depois do backfill (uma apagou a carreira, a outra ficou só com uma
  carreira SEM Agência 2.0) — removidas do rank. As outras 726 conferem
  100% (0 órfãs depois da limpeza).
- Reversível: `git revert` no código; a tabela nova no banco fica órfã mas
  inofensiva (não é lida em lugar nenhum se reverter o código).
- ⏳ PRÓXIMO PASSO (pedido pelo Diego): montar mockup pra Stories/Feed do
  Instagram anunciando essa feature.

## 🗺️ GUIA DA CARREIRA — banners de desbloqueio explicado — 🚧 EM ANDAMENTO (13/08)
Diego: muita gente começa a carreira e não entende nada (Agenciados, Estádio, quando
o salário chega, etc.) — pediu um sistema de avisos que explica cada mecânica NA
HORA em que ela passa a valer, uma vez só. Fiz mockup visual (aprovado) antes de
codar. Pesquisei as condições REAIS no código (nada de números inventados) e simulei
uma carreira de 120 temporadas pra achar TODOS os marcos (SAF, Multiclubes, Copa do
Mundo, extras do estádio, Departamento Médico etc.) — relatório completo na sessão,
não copiado aqui por ser longo demais; qualquer sessão que continuar isso deve pedir
o relatório de novo se precisar (perguntar ao Diego ou re-analisar o código).
- **Infra nova**: `unlockbanner.tsx` (`UnlockBanner`, componente reusável — módulo à
  parte pra não criar import circular entre `estadio.tsx` e `pyramidseason.tsx`).
  `state.careerSeen: Record<string, true>` (types.ts) marca banners já fechados
  ("Entendi!" → dispatch `MARK_CAREER_SEEN`) — nunca mais aparece NESTA carreira,
  zera só na fundação de carreira nova (mesmo lugar da "faxina anti-herança").
- **✅ 1ª leva NO AR (13/08)**: Substituições liberadas (T2) · Salário chegou (T4) ·
  Seu estádio já rende (base +20 fixa) · Departamento Médico pronto (acaba com lesão
  pra sempre) · Você comprou a SAF · Virou profissional (saiu da Várzea).
- **⏳ PENDENTE (próxima leva, planejado no mockup)**: Agenciados (versão rica —
  como ganha carta, convoca 22, as 2 formas de renda), Premiações (valores reais por
  divisão: campeão V15/D20/C35/B50/A65 + acesso + queda), Categoria Lenda destrava
  (junto com a SAF), Multiclubes comprado. Diego pediu explicitamente pra NÃO fazer
  banner de "Dinastia" (6 títulos da Série A) — achou bobeira / incentiva o cara a se
  gabar. Não reintroduzir essa ideia.
- **Bônus corrigido no caminho (13/08)**: 2 números errados na tela de artilharia —
  prêmio do artilheiro por divisão mostrava METADE do valor real (D+4/C+8/B+12/A+16
  → corrigido pra V+6/D+10/C+15/B+20/A+30) e o piso do artilheiro da Copa Legends
  mostrava +16 (correto é +10, igual à liga). Só texto, os valores que o jogo já
  pagava sempre estavam certos.
- ⚠️ Reversível: cada banner é independente (`git revert` no commit, ou remover 1
  chamada de `UnlockBanner` não afeta as outras). Não mexe no online nem no futebol.
- **✅ Malandro de 11 jogadores — CORRIGIDO (13/08)**: Diego reportou que quem nunca
  compra reserva (fica sempre com exatamente 11) driblava TODO evento de jogador
  (noitada/expulsão/lesão) — sem reserva na posição, virava só manchete de zoeira,
  nada travava. Corrigido: `EVENTO_SET_NO_RESERVE` (store.tsx) sobe um 🌱 Cria da
  Base pra tapar o buraco de verdade (mesmo mecanismo da crise financeira/contrato
  vencido) — ruim, sem contrato, some sozinho quando compra reforço de verdade. Vale
  em qualquer divisão (Diego não tinha certeza se devia travar só a partir da Série
  D — deixei valendo geral por consistência com os outros casos de Cria da Base; se
  ele quiser restringir depois é só adicionar a checagem de divisão). Banner novo
  (`k="criabase"`) explica na 1ª vez que acontece.
- **✅ Backfill pra quem já tá em carreira (13/08)**: Diego apontou que carreira EM
  ANDAMENTO (de antes do Guia) ia mostrar TODOS os banners de uma vez, mesmo etapa
  antiga (ex: "Salário chegou" pra quem já paga desde a T4 e tá na T20). Corrigido
  com `BACKFILL_CAREER_SEEN` (store.tsx): roda 1x nesses saves (só quando
  `careerSeen` nunca existiu), marca como "já visto" o que já passou — só o que
  ainda vem pela frente (Médico, SAF, próximas etapas) avisa de verdade. Carreira
  NOVA não passa por aqui (já nasce com `careerSeen: {}` na fundação).

## ⚡🧤 FIX: pênalti interativo — goleiro "não pega" a bola + acertar o verde não fazia gol — ✅ NO AR (14/08)
Diego reportou dois problemas no pênalti (🎯 Você bate): "o goleiro defende e a bola
nem parece que tá na luva" + "acertando várias vezes na cor verde na hora de bater
e ainda assim não sai gol". Achados os dois no código de `PenaltyBanner`
(`pyramidseason.tsx`):
1. **Bug real de lógica**: em `travar()`, mesmo acertando o VERDE (`onTarget`), só
   valia gol se TAMBÉM tivesse mirado num canto de CIMA (`aimZ<3`) E acertado uma
   faixa ainda mais fina dentro do verde (`err<half*0.55`) — trava escondida que a
   tela nunca avisa. Mirando canto de BAIXO (3/4/5), era IMPOSSÍVEL sair gol mesmo
   acertando o verde na mosca. Corrigido: acertar o verde agora É perigo de gol de
   verdade — só defende se o goleiro "ler" o canto (32%, mesmo de antes), sem mais
   depender de qual canto ou de precisão extra escondida.
2. **Bug visual**: `moveKeeper` usava uma escala fixa (`×2.3`/`×1.05`) sem relação
   nenhuma com o tamanho real do gol na tela, enquanto `flyBall` (a bola) calculava
   a posição em % do tamanho de verdade (`goalRef.clientWidth/Height`) — os dois
   apontavam pra lugares DIFERENTES na mesma "zona", por isso a defesa nunca parecia
   pegar a bola de verdade. Corrigido: goleiro agora usa a MESMA base de cálculo da
   bola (% do goalRef). Testei visualmente as 6 zonas num teste isolado (mesma
   fórmula, fora do app) — bola e luva caem juntas no mesmo canto agora.
- Também removido o SELO de categoria (👑 Lenda / ⭐ Craque / etc.) da escolha do
  cobrador, a pedido do Diego.
- Build ok. Não consegui testar no jogo real de ponta a ponta (precisa cair numa
  temporada com jogo decisivo) — se ainda estiver estranho, avisar que reverto.
- Reversível: `git revert`. Só mexe no banner de pênalti, nada mais.

## 🐛🕰️ FIX: tela do leilão "travava" pra quem tá com saldo negativo — ✅ NO AR (14/08)
Relato do Diego (com print): técnico devendo (saldo negativo — vira espectador,
sem lance pra dar) via a tela de revelação/martelo travar de vez em quando, só
resolvia dando F5. Não achei um bug de LÓGICA do jogo (Monte Final e desempate
foram descartados com prova — não travam por saldo negativo). Explicação mais
provável: quem tá de espectador não toca na tela, então se a aba do navegador
fica em 2º plano nesse meio tempo (troca de janela/app), o navegador ATRASA ou
pausa o `setTimeout` que passa a carta sozinha — o timer nunca disparava e a
revelação ficava presa até recarregar.
- Correção em `AutoAdvance` (`screens.tsx`, componente que avança a revelação
  do leilão sozinho): trocado o `setTimeout` cego por PRAZO com relógio real
  (`Date.now()`) + um poll de reforço a cada 1s + um gatilho no
  `visibilitychange` (quando a aba volta a ficar visível). Se o navegador
  atrasou o timer, assim que ele volta a rodar de verdade (ou você volta pra
  aba) o jogo vê que o prazo já passou e avança na hora — sem precisar de F5.
- Escopo mínimo, só a tela de revelação do leilão (onde o print mostrava a
  trava) — não mexe em Monte Final, desempate, liga ou Copa.
- Reversível: `git revert`. Não muda o RITMO nem o TEMPO normal de ninguém —
  só destrava quem ficaria preso esperando um timer atrasado.
- ⚠️ Ainda não é 100% certeza (não consegui reproduzir a trava de propósito) —
  se voltar a acontecer mesmo com essa correção, o próximo passo é logar o
  `state.phase`/`revealIdx` no momento da trava pra achar outra causa.

## 📝💰 RENOVAÇÃO DE CONTRATO: escada por valor + Várzea sem renovação — ✅ NO AR (14/08)
Reforma pedida pelo Patrick (usuário) + retrabalhada a fundo com o Diego (várias
rodadas calibrando pra nunca ter "opção dominada" — prazo mais longo NUNCA pode
custar igual ou menos que um mais curto, senão ninguém escolheria o curto).
- ⚠️ **CORRIGIDO (14/08, entendimento errado na 1ª tentativa)**: Várzea NÃO manda
  jogador pro leilão quando o contrato "venceria" — o relógio do contrato **pausa**
  enquanto o time tá lá. `applySeasonMoney`-adjacent (a virada de temporada, logo
  após `s.careerPlacements = action.placements`): se a divisão nova do manager é
  'V', soma +1 em `contratoAte` de TODO o elenco, junto com o `seasonNo++` que vem
  logo depois — cancela o avanço, "congela" quantos anos faltavam. Quando o time
  sobe de novo pra Série D+, o relógio RETOMA do ponto exato onde parou (2 anos
  faltando quando caiu → ainda 2 anos faltando quando sobe, não importa quantas
  temporadas ficou lá embaixo). Efeito: a lista de "vencidos" fica SEMPRE vazia em
  Várzea → a tela de contratos inteira some sozinha (nem aparece botão de renovar
  nem de "deixar ir" — não existiam pra sumir, o painel só não renderiza).
  RENEW_CONTRACT e RELEASE_CONTRACT também têm trava explícita de divisão (reforço,
  já que o freeze sozinho já deveria bastar). Vale JÁ pra quem já tá na Várzea.
- **Série D pra cima**: `renewOptions(oficial)` / `renewCost(oficial, anos)` em
  `store.tsx`. Abaixo de 10 moedas = tabela fixa calibrada valor a valor pelo Diego
  (1 a 9, cada um com só os prazos que fazem sentido — 1/2/3/5 anos, nunca 10). A
  PARTIR de 10 moedas (jogador "de verdade") = só 5 e 10 anos, fórmula: 5 anos =
  metade (ceil), 10 anos = 90% arredondado pro mais PRÓXIMO (não é floor — testado
  contra 15 moedas = 14, não 13). Testei em script isolado: **nenhuma opção
  dominada de 1 a 600 moedas**, todas as âncoras do Diego batem.
- UI (`pyramidseason.tsx`, tela reserveList): os botões de renovar agora são
  DINÂMICOS — só aparecem os prazos que `renewOptions` liberar pra aquele valor,
  cada um com sua cor (dourado=10, verde=5, azul claro=1-3).
- Reversível: `git revert`. Não muda nada da lógica do leilão/liga.
- ❌ "Saída de emergência" (quebrar contrato com multa) e "vender reserva pro
  banco": foram cogitadas mas o Diego NÃO quer — descartadas, não implementar.

## 🏎️⚽ Ferrari SC (batismo adriano.ferrari) — ✅ NO AR (14/08)
Kit visual do time do adriano.ferrari@quepazseguros.com.br. Arte AUTORAL (piloto de
macacão vermelho + capacete do Brasil dirigindo uma BOLA de futebol gigante com rodas).
- ⚠️ **REGRA DE MARCA**: o Diego pediu MUITAS vezes o cavalo/escudo IDÊNTICO da Ferrari
  (inclusive "só mudando detalhes"). **NÃO foi feito** — é marca registrada e poria o
  site (ao vivo, no nome dele) em risco. Mesma regra dos clubes reais. A arte final é o
  piloto-na-bola, SEM o emblema/cavalinho da Ferrari (esse detalhe do render dele ficou
  de fora de propósito). Se ele insistir de novo: continua sendo NÃO.
- **Manto** vermelho/preto: `manto.ts` MANTO_CONTAS (por e-mail) — já vale, é só cor.
- **Escudo/Mascote = ARTE PRÓPRIA do dono** (imagens webp que o Diego mandou, exceção de
  batismo — igual Sapekeiros/Eros). Cavalo-piloto de macacão vermelho + capacete do Brasil,
  SEM emblema da Ferrari (o Diego regerou sem a marca; conferido). TROCA pedida pelo Diego:
  `img/ferrari-escudo.webp` = cavalo gritando GOL; `img/ferrari-mascote.webp` = cavalo no
  carrinho de bola. A pilotBallSC vetorial ficou em `escudos.tsx` só como fallback (não é usada).
  - 🧼 **RECORTE DE FUNDO (14/08)**: o "fundo transparente" dos PNGs dele era FALSO — o
    xadrez vinha PINTADO nos pixels e apareceu atrás da arte no jogo (reclamação dele).
    Recorte real por inundação a partir das bordas + limpeza dos retalhos presos entre as
    rodas e do chão quadriculado. Se ele mandar arte nova, CONFERIR se o fundo é
    transparência de verdade antes de embutir.
  - Escudo: `ferrariSCRender` → `<img ferrari-escudo.webp>`. LOGOS_PRONTAS: 'Ferrari SC'/
    'Ferrari FC'/'Ferrari'. Vale pelo NOME — já aparece.
  - Mascote: MASCOTES['piloto_bola'] → `<img ferrari-mascote.webp>`. Pro festão.
- **Manto**: vermelho/preto/**branco** (3 cores). MANTO_CONTAS (email) dá vermelho+preto;
  MANTO_TRI['piloto_bola'] = branco (3ª cor).
- ✅ **DB do sócio ATUALIZADO (14/08, direto pelo Claude no Supabase — sócio nº10, já
  existia desde 09/08 com validade até 2100, só faltava a personalização)**: `esc_socios`
  manto_c1='#C2452F', manto_c2='#141414', mascote_key='piloto_bola', escudo_time='Ferrari SC',
  time_coracao='Corinthians', origem='batismo'. Nada mais pendente no painel — escudo,
  mascote (festão) e manto tricolor valem pra ele já na próxima aberta do jogo.
- Reversível: `git revert` (código) / UPDATE esc_socios (banco). Só afeta esse time/conta.
- 🔧 Pendente do gosto do Diego: ele queria a qualidade de RENDER (imagem gerada). Vetor
  à mão não chega lá; se um dia ele mandar o ARQUIVO (webp) de uma arte SEM marca, dá pra
  embutir igual Sapekeiros/Eros.



## 🐞🌐 FIX GRAVE: ONLINE virava DOIS HOSTS (dessincronia total na Copa) — ✅ NO AR (13/08)
Relato do Diego (sala "Sapekeiro FC", jogo rápido online): no meio do leilão o host
(Sapekeiro) foi TROCADO sozinho — apareceu pra outro que ELE virou host — mesmo com o
Sapekeiro **online, na mesma tela, sem trocar de app**, só demorando pra jogar. Daí a sala
ficou com **dois donos** e cada aparelho passou a rodar a própria simulação: liga e Copa
**dessincronizadas** (campeão diferente pra cada um, eliminado pra um e pra outro não,
jogador sumindo do campinho). A Copa é determinística (mesma tabela + mesma semente = mesmo
campeão) → só diverge com >1 host rodando com semente/tabela própria.
- **RAIZ**: pra economizar egress, o host fica CALADO no Realtime até ~12s quando não há
  jogada nova (leilão parado). O convidado lia esse silêncio como "host caiu" em 10s e, com
  um piscar de presença, se auto-promovia — e o host antigo NUNCA era rebaixado → dois donos.
- **FIX (5 partes, `store.tsx`, só online; futebol offline/normal intocado):**
  1. Ação **STEP_DOWN_HOST** (host antigo abaixa a bola → vira convidado).
  2. **Ping "tô vivo"** do host a cada 4s (broadcast de POUCOS BYTES no canal já aberto —
     NÃO é o estado de ~100KB, NÃO toca no banco). Convidado marca "host vivo" por aqui →
     ficar quieto não parece mais que caiu.
  3. Convidado escuta o `host_ping` (zera o relógio de "host sumiu").
  4. **Anti-roubo**: a promoção de novo host só rola se o **batimento do banco**
     (`game_rooms.updated_at`, que o host já grava a cada ~3s) estiver SECO (>9s). Host vivo
     e batendo NUNCA é usurpado. (Custo zero: é a MESMA leitura, só +1 coluna.)
  5. **Regra de ouro (UM DONO SÓ)**: o host confere no banco quem é o `host_id` a cada 5s
     (usando `youUid`, sem chamada de auth na rede); se a posse já é de OUTRO, ABAIXA A BOLA
     na hora. Impossível ficar com dois hosts. Leitura nula/erro NÃO rebaixa (rede ruim não
     tira o dono legítimo).
- ⚠️ Reversível: `git revert` desse commit volta ao de hoje. Não muda o fluxo normal
  (leilão/liga/Copa com rede boa) — só o "e se o dono cair" passa a se comportar direito.
- 🔎 A investigar se reincidir: janela de ~5s em que um host que RECONECTA pode mandar 1
  estado velho antes de detectar que deve ceder (auto-corrige no próximo estado do novo dono).



## ⚽ CARREIRA: pênalti decisivo — ✅ NO AR (12/08, deploy junto com a reforma do estádio)
Feature nova SÓ na carreira OFFLINE (online intocado). Aprovada visualmente pelo Diego
via protótipo (artifact pen_full). Aparece **0-2x/temporada** (sorteio fixo por semente),
SÓ em **jogo de última hora onde um gol empata ou vira** (você empatando = 1 gol vira;
perdendo por 1 = 1 gol empata). Abre no FIM da animação (tempo morto — não atrasa ritmo).
- `types.ts`: `careerPenalty` (mgrId → índice 0-based do jogo → {scored, taker}). Zera
  por temporada. `store.tsx`: action **SET_PENALTY** (travas: só offline; cobrador REAL
  do elenco, sem fake; grava 1x — não re-bate no reload).
- **MOTOR** (`pyramidseason.tsx`): `penaltyPlan(seasonSeed)` sorteia 0-2 índices de jogo
  (rodadas 5..35). O motor SÓ soma **1 gol** ao humano no min 90 se `scored` — sem rng,
  resultado já decidido pelo jogador. Com `careerPenalty` vazio a simulação é
  **byte-idêntica** (não afeta ninguém). ⚠️ Chave = índice 0-based do jogo atual
  (`round-1`) — o motor lê por esse índice. (A substituição do intervalo usava `round`
  por engano → CORRIGIDO, ver abaixo.)
- UI: `PenaltyBanner` com **2 modos num toggle** (🎯 Você bate: mira 6 cantos + trava a
  força no verde; 🎙️ Bate sozinho: narração de suspense, pontinhos um a um). Header mostra
  o JOGO (mandante 🏠 esquerda × visitante ✈️ direita, placar de cada, SEU time em ouro).
  Categoria do cobrador (Foi Profissional→Lenda) manda no acerto/tamanho do verde. Gol →
  GOOOOL + confete (+ **mascote de quem TEM mascote**; sem mascote = só a festa). Depois
  de BATER **não volta** (trava modo/cobrador). Fundo = manto do tier do usuário.
- ⚠️ Reversível: `git revert`. Não toca no futebol online nem em carreiras sem pênalti.

## 🐞 FIX: pênalti decisivo disparando toda hora (só na conta do Diego) — ✅ CORRIGIDO (13/08)
Diego reportou: "está passando duas, três rodadas está tendo pênalti... dá nem pra jogar
direito" — quando o certo é 0-2x/temporada (às vezes zero). Causa: `PEN_TEST_TESTERS` em
`sport.ts`, um modo de teste temporário criado em 12/08 (ligado SÓ na conta dele) pra ele
conferir os dois modos do `PenaltyBanner` sem esperar a raridade sortear — e esquecido
ligado. `usePenaltiTeste()` fazia `penPlanned || penTeste` pular direto o `penaltyPlan()`
raro. Corrigido esvaziando `PEN_TEST_TESTERS` (`new Set<string>([])`) — a conta dele volta
a seguir a mesma raridade sorteada de todo mundo. Motor (`penaltyPlan`) nunca teve bug,
sempre foi só o teste ligado. ⚠️ Reversível: `git revert`. Não mexe em mais nada.

## 🐞 FIX: pênalti "aparecia do nada já com o placar pronto" — ⚠️ diagnóstico incompleto (13/08)
Primeira tentativa: achei que era só o técnico estar em Tabelas/Elenco/Rank enquanto a
rodada decisiva rolava — corrigi trocando pra aba Jogos sozinho quando `penMode` liga
(igual a Copa já faz). Isto ficou (é bom de qualquer forma), MAS Diego confirmou que
mesmo JÁ na aba Jogos, olhando o jogo, o pênalti continuava abrindo com placar de OUTRO
jogo — não era isso. Causa real, achada depois: ver entrada abaixo (corrida de timers).

## 🐞 FIX: pênalti abria com o placar de OUTRO jogo (corrida de timers) — ✅ CORRIGIDO (13/08)
Causa raiz de verdade, achada com o relato específico do Diego ("o jogo 1 tava
terminando, quando acaba já abriu o pênalti mostrando resultado de 2x2 EM OUTRO jogo" +
"depois do leilão mal começou o jogo já abrindo pênalti, como se nem visse a simulação").
Existiam DOIS relógios (`setTimeout`) rodando em paralelo e independentes: um decidia
quando a rodada troca sozinha (`roundMs` cheio) e outro decidia quando o pênalti pode
abrir (`roundMs*0.85+250`, sempre um pouco ANTES). Em corrida (mais comum em rodada
rápida/decisiva), a rodada podia virar ANTES do banner abrir — e quando abria, já lia os
dados da rodada NOVA (o jogo seguinte), não da que o Diego via na tela. Corrigido em
`pyramidseason.tsx`: os dois agora usam o MESMO sinal (`roundReady`) — a troca de rodada
só acontece DEPOIS que o jogo atual terminou de animar, no mesmo instante em que o
pênalti decide se abre. Não tem mais corrida entre os dois relógios. Ritmo do resto da
carreira não muda (a troca de rodada fica só ~250ms mais rápida). ⚠️ Reversível:
`git revert`. Não mexe no online (o auto-avanço aqui é só da carreira offline solo).

## 🐞 FIX: substituição no intervalo estava 1 rodada adiantada — ✅ CORRIGIDO (12/08)
Bug encontrado ao codar o pênalti e **comprovado em teste** (rodando `simulatePyramid`):
a troca do intervalo gravava em `careerHalftime[mgr][round]`, mas o jogo que está
rolando é o índice **`round-1`** (o motor lê por esse índice). Resultado: a substituição
não fazia efeito nenhum no jogo que você assistia — ela caía no PRÓXIMO jogo (1 rodada
adiantada). Corrigido pra `round-1` (dispatch do SET_HALFTIME + leitura do `halftimeDone`
em `pyramidseason.tsx`). O motor NÃO mudou → colocações de saves antigos não mudam
retroativamente; só as trocas NOVAS passam a valer no jogo certo. Só offline. Reversível.

## 🏟️ ESTÁDIO: renda por ocupação + 4 estabelecimentos — ✅ NO AR (12/08)
Reforma do torcidômetro (Diego): a renda deixa de ser bônus solto e passa a vir da
**LOTAÇÃO** — o estádio construído é o TETO (potencial); quanto enche de verdade sai da
**colocação final** (1º-4º lotado → … → 17º-20º às moscas). Piso pequeno garantido.
Gate: `agenciaOn` (carreira NOVA); carreiras antigas seguem no esquema velho (grandfather
via `extraNovaOnly`). 4 estabelecimentos novos pagos e encadeados: 🍔 Praça de Alimentação,
🍺 Choperia, 🚉 Estação/Acesso Fácil (+8% lotação), 🏨 Hotel do Clube. Ver `estadiodata.ts`
(`occByPos`, `stadiumOccupancy`, `stadiumIncomeAt`, `NEW_EXTRAS`) e `estadio.tsx`.
- 🎪 Casou com o "torcidômetro AO VIVO" de outra sessão (medidor reage à posição atual —
  `torcidaDeltaByPos`): são coisas separadas (medidor % vs renda 🪙), sem dupla contagem.
- ⚠️ Reversível: `git revert`. Só carreira NOVA (offline); antigas intocadas.

## 🐝👑 BATISMO: Sapekeiros FC (tiosapeka@gmail.com / @tiosapekagg) — ✅ NO AR (12/08)
Batismo do Tio Sapeka (Gaming Content Creator / Streamer / UGC Creator, presidente do
Sapekeiros FC). Coração **Santos**. Logo REAL do clube (abelha coroada com a bola) vira
escudo; a **abelha coroada** (arte do Gemini no mesmo estilo, recortada) vira mascote.
- `escudos.tsx`: `sapekEscudoRender` (webp `img/sapek-escudo.webp`, redondo) em
  `LOGOS_PRONTAS` pros nomes **'Sapekeiros FC'** e **'Sapekeiros'**.
- `mascotes.tsx`: `MASCOTES.sapek_abelha` (webp `img/sapek-mascote.webp`).
- `apoio.tsx`: FOUNDERS ouro + FUNDADOR_N **nº 41**.
- DB: `esc_socios` (sócio **nº21**, escudo_time='Sapekeiros FC', mascote_key='sapek_abelha',
  manto #0C0C0C/#C9A227 preto+dourado, time_coracao='Santos', origem='batismo') +
  `esc_nomes_batismo` (sapekeiros fc / sapekeiros) + `user_colors` tier ouro.
- ⚠️ Reserva de nome + kit (não substitui time de CPU). Reversível: `git revert` + apagar DB.

## 🔁 CARREIRA: substituição no intervalo — ✅ NO AR (12/08)
Feature nova SÓ na carreira OFFLINE solo (online intocado). Aprovada pelo Diego 12/08.
Toggle no Elenco: **Dinâmico** (padrão, como sempre foi) vs **Só no intervalo** (o jogo
pausa aos 45' e abre banner pra mexer no 2º tempo).
- `types.ts`: `careerSubMode` ('dinamico'|'intervalo') + `careerHalftime` (mgrId→rodada→
  {xi2, formation?, tactic?}). `store.tsx`: actions SET_SUBMODE/SET_HALFTIME (travas: 11
  reais distintos, sem fake, batendo a formação; só offline). Reset por temporada.
- **MOTOR** (`pyramidseason.tsx`): 2º tempo re-simulado com **rng ISOLADO** (semente =
  seed+rodada+time) só quando há decisão de intervalo do humano. Com `halftime` vazio o
  caminho é **byte-idêntico** ao de hoje → NÃO cascateia em outros jogos (não repete o
  bug "gols mudaram de dono"). `scoreGoals` agora devolve id e aceita rng/faixa própria.
- UI: relógio pausável aos 45' (`LiveScoreCard`) + `HalftimeBanner` (titulares|reservas,
  troca mesma posição até 3, formação, tática; **vale só o 2º tempo, não muda o próximo
  jogo**). Fundo = manto do TIER do usuário (perk.grad + brilho, igual Elenco); selo de
  posição neutro (não parecer Lenda). Rodada não anda enquanto o banner está aberto.
- ⚠️ Copa fica FORA (não anima 1º/2º tempo por jogo). Reversível: `git revert`.

## 🎮🐶 BATISMO: Eros FC (erosreis@outlook.com.br / @erosreis) — ✅ NO AR (12/08)
Batismo do Eros Reis, influencer de games nostálgicos (@erosreis). Time **Eros FC**,
mascote a cachorrinha **Nina**, manto **vermelho e cinza**. Escudo = arte própria do
dono (Eros com o videogame retrô). Aprovado pelo Diego 12/08 (mockup padrão v7).
- ✅ `escudos.tsx`: `erosEscudoRender` (webp `img/eros-escudo.webp`) em `LOGOS_PRONTAS`
  pros **4 nomes**: 'Eros FC', 'Eros Reis FC', 'Eros Reis', 'Eros' (todos mesmo escudo).
- ✅ `mascotes.tsx`: `MASCOTES.eros_nina` (webp `img/eros-nina-mascote.webp` — Nina nos
  cartuchos, controle no peito).
- ✅ `apoio.tsx`: FOUNDERS ouro + FUNDADOR_N **nº 40**.
- ✅ DB: `esc_socios` (sócio **nº20**, escudo_time='Eros FC', mascote_key='eros_nina',
  manto #C2452F/#7C7C7C, origem='batismo') + `esc_nomes_batismo` (os 4 nomes → eros) +
  `user_colors` tier ouro.
- ⚠️ NÃO substitui time de CPU (é só reserva de nome + kit do sócio) — Diego não indicou
  divisão. Se um dia quiser o Eros FC como time na pirâmide, aí entra em `data.ts`.
- ✅ **Na main (deploy 12/08)** — escudo/mascote/Lenda no ar; DB já estava no ar.
- Reversível: `git revert` do commit + apagar as linhas do DB.

## 🎽 CARREIRA: formações novas 3-4-3 e 5-3-2 ✅ NO AR (12/08)
Aprovado. **Só na carreira, meio de temporada** (o início segue só 4-3-3/4-4-2 — base do
leilão, `screens.tsx:1875`). Igual o 4-5-1.
- `types.ts`: FormationKey + FORMATIONS → **3-4-3** (GOL1 LAT2 ZAG1 MEI4 ATA3, ousado) e
  **5-3-2** (GOL1 LAT2 ZAG3 MEI3 ATA2, muralha). LAT fixo em 2 (igual todas), varia ZAG.
- `dinastia.tsx`: FORM_NEED ganhou as 2 (senão o Record<FormationKey> quebra o tsc).
- `pyramidseason.tsx`: seletor do meio de carreira (botões + dica) lista as 5 agora,
  com flexWrap (3+2). A **trava** que já existe segura: só troca se tem os jogadores
  REAIS por posição (5-3-2 pede 3 zagueiros; se faltar, botão travado com aviso claro).
- Força de ataque/defesa sai EMERGENTE do XI (mais ATA = mais ataque; rollForm usa o XI,
  não a formação) — nada hardcoded, nada a balancear. Reversível: `git revert`.
- ✅ FEITO (12/08): **substituição no intervalo** (toggle "só no intervalo" vs "dinâmico";
  pausa aos 45' + banner) — ver seção "🔁 CARREIRA: substituição no intervalo" no topo.
- ⏳ PENDENTE: **pênalti interativo** (mockup jogável feito e ideia aprovada, mas Diego
  NÃO liberou codar ainda).


## 🦁⚡ BATISMO: Remoçada (luiz.maia.luiz) — Série A ✅ NO AR
Batismo do luiz.maia.luiz@gmail.com, aprovado 12/08. Time **Remoçada**, coração **Remo**.
O **Leão Azul do Remo fantasiado de Thor** (elmo alado + Mjölnir), azul-marinho + branco,
capa vermelha. Entrou na **Série A no lugar do Olimpo FC**. luiz **já era Lenda(ouro) +
FUNDADOR nº35** (código + banco) — não precisou mexer nisso.
- ✅ `data.ts`: DIVISION_TEAMS.A Olimpo FC → Remoçada + OLD_NAME 'Remoçada':'Olimpo FC'.
- ✅ `escudos.tsx`: `LOGOS_PRONTAS['Remoçada']` — leão dourado do Remo, elmo alado,
  2 Mjölnir cruzados, "REMOÇADA" branco em faixa navy (clipPath id `rmcEsc`).
- ✅ `mascotes.tsx`: `MASCOTES.leao_thor` — leão dourado, elmo alado, Mjölnir erguido +
  faísca, camisa navy/branca, capa vermelha, pé na bola. Festão genérico (Campeão!).
- ✅ Manto azul-marinho `#12256B` + branco `#FFFFFF` (2 cores, vertical).
- ✅ DB: `esc_socios` (sócio nº19, escudo_time='Remoçada', mascote_key='leao_thor',
  manto navy/branco, time_coracao='Remo', origem='batismo') + `esc_nomes_batismo`
  ('remoçada'→luiz). `user_colors` já era ouro.
- ⚠️ luiz precisa colocar o nome do time como **"Remoçada"** (hoje é "PES FC") pra a
  logo aparecer (Escudo casa pelo nome EXATO; o fallback newestTeamName cobre saves
  com "Olimpo FC"). Reversível: `git revert` + apagar as 2 linhas do banco.


## ⚽🧊 BUG "gols mudam ao trocar formação" (VOLTOU — reforço 12/08)
Relato do Diego (niko.messias/Aracaju Saf, carreira solo): trocou 4-5-1↔4-4-2 e os
gols dos jogadores mudaram ("os gols do Evaristo foram pro Jairzinho"). Já tinha o
band-aid de 10/08 (commit 5533e39) mas CONTINUAVA. Causa real: a temporada re-simula
do seed a cada render; as rodadas SEM escalação gravada caíam no `bestXI` da formação
ATUAL → trocar formação re-atribuía os gols do passado. O band-aid só congelava no
CHANGE_FORMATION e, pior, sobrescrevia com `bestXIids` uma SUBSTITUIÇÃO MANUAL que
valia dali pra frente (buraco do carry-forward). Correção (2 frentes, `store.tsx`):
1. **Congela CADA rodada AO JOGAR** (`PLAY_ROUND`/`SIM_MANY`, SÓ solo): grava o XI real
   de cada humano em todas as rodadas já jogadas, com a MESMA regra da simulação
   (`frozenXIids` = última escalação <= r, senão bestXI). Gravar = capturar o que a
   tela já mostra (mesmo XI), então NADA muda na hora — só trava o passado pra sempre.
2. **Band-aid do CHANGE_FORMATION agora é carry-forward aware** (usa `frozenXIids`, não
   `bestXIids` cru) → não atropela mais a troca manual.
Verificado: `bestXI`(sim) == `bestXIids`(store) idênticos, até com empate de nível →
gravar é transparente. Reversível: `git revert`. ⚠️ FALTA: mesmo congelamento no
ONLINE (por ora só solo, pra não mexer no host-autoritativo sem teste).


## 🛡️ LIÇÃO (11/08): logo do batismo no JORNAL + em carreira antiga
Diego: "a logo do Império Samambaia não aparece no jornal quando ele joga carreira".
Duas causas achadas e corrigidas (commit isolado, reversível com `git revert`):
1. **Carreira antiga fica com o nome VELHO do time** (`store.tsx:1706` migra o nome
   de todo mundo com `newestTeamName`, MENOS o humano — pra não trocar nome que a
   pessoa escolheu). Então quem começou a carreira antes do batismo continua com
   "Cuiabagre" e caía no escudo automático. FIX: `Escudo()` agora tenta
   `LOGOS_PRONTAS[nome] ?? LOGOS_PRONTAS[newestTeamName(nome)]` — a logo comprada
   aparece mesmo com o nome antigo. NÃO renomeia nada (seguro).
2. **A IMAGEM do jornal que vai pro grupo** (`buildJornalBlob`) desenhava só a 1ª
   LETRA do time no lugar do brasão. FIX: agora rasteriza o `<Escudo>` de verdade
   (react-dom já no bundle) e desenha o brasão; se falhar, cai na letra de antes.
   Vale pra TODO time (futebol também ganha brasão na figura de compartilhar).
👉 Se algum dia quiser o NOME do time também migrar pro do batismo em carreira antiga,
   é tirar o `m.isHuman ? m :` da linha 1706 — mas aí renomeia o time do cara (pedir OK).


## ⚠️ LIÇÃO (11/08): TIER ao vivo = tabela `user_colors` (banco), NÃO só o código!
`apoio.tsx:214` → `const tier = dbTier ?? FOUNDERS[email]`. O tier que o jogo mostra
(e que os OUTROS jogadores enxergam) vem da tabela **`user_colors`** (email, tier,
manual). O `FOUNDERS` do código é só fallback do próprio aparelho. Mudei só o código
e o Gabriel continuou prata (tinha user_colors='prata' do tempo de Craque).
👉 Pra dar/trocar tier: **gravar em `user_colors` (upsert email→tier)** — código é só backup.
Corrigido hoje: Gabriel/paisagensetrilha/agrostinho/lucas=ouro, lipeh/pedronovikoff=prata.

## ⚠️ LIÇÃO (11/08): escudo do batismo é pelo NOME EXATO do time (LOGOS_PRONTAS[nome])
O `Escudo(nome)` faz `LOGOS_PRONTAS[nome]` (match exato do nome do time). Cadastrei
"Desportivo Montreal" (com S) mas o time do Gabriel é "Deportivo Montreal" (sem S,
clube real) → escudo caía no automático. Renomeado pra "Deportivo Montreal" no código
(escudos.tsx + data.ts) e no banco (esc_socios.escudo_time + esc_nomes_batismo).
👉 Conferir a grafia EXATA do nome do time do dono antes de cadastrar o batismo.

## ⚠️ LIÇÃO (11/08): batismo TEM que entrar em `esc_nomes_batismo` também!
A trava de nome único (`esc_nome_livre`) reserva o nome do batismo pro dono
**pela tabela `esc_nomes_batismo`** (colunas: nome_norm, nome, email). Publiquei
Scorporila/Montreal/Marolados só no `esc_socios` e ESQUECI dessa tabela → o dono
do Marolados não conseguia salvar o nome (batia no lucasjogomes, que já usava o
nome por coincidência). CORRIGIDO: registrei os 3 em `esc_nomes_batismo`.
👉 CHECKLIST batismo daqui pra frente: data.ts (OLD_NAME + CPU) · apoio.tsx (ouro
+ FUNDADOR_N) · escudos/mascotes · `esc_socios` (kit) · **`esc_nomes_batismo` (reserva do nome)**.

## 🌱🤙 BATISMO: Marolados FC (paisagensetrilha) — Série D ✅ FEITO
Batismo do paisagensetrilha@gmail.com, aprovado 11/08. Ideia da casa: a molecada de
periferia que joga na várzea ("fumaçou o campo"), coração Palmeiras. Entrou no lugar
do **Real Madruga** na Série D. Craque? não — direto **Lenda(ouro) + FUNDADOR nº 38**.
- ✅ `data.ts`: DIVISION_TEAMS.D Real Madruga → Marolados FC + OLD_NAME.
- ✅ `apoio.tsx`: FOUNDERS ouro + FUNDADOR_N 38.
- ✅ `escudos.tsx`: `LOGOS_PRONTAS['Marolados FC']` — cabeça do moleque RASTAFARI
  (dreadlocks + touca rasta, sem blush) no escudo verde "AQUI É RAIZ" + fumaça (full+mini).
- ✅ `mascotes.tsx`: `MASCOTES.marolado` — moleque rasta descalço com bola RASGADA,
  fazendo joia. Festão "É GOL, FIRMEZA!".
- ✅ Manto verde/branco (Palmeiras) — 2 cores normais.
- ⏳ FALTA: DB `esc_socios` do paisagensetrilha (escudo_time='Marolados FC',
  mascote_key='marolado', manto_c1='#1B7A3D' manto_c2='#FFFFFF', time_coracao='Palmeiras').
- Reversível: `git revert` + apagar linha do banco.

## 🛡️ BATISMO: Desportivo Montreal (nevesgabriel95) — Série A ✅ FEITO (código)
Batismo do Gabriel (nevesgabriel95@gmail.com), aprovado 11/08. Recriação em SVG
(estilo da casa) do escudo real do clube dele (verde, estrela-bússola, faixas
DEPORTIVO/MONTREAL, **2026**, bola). Entrou no lugar do **Titan Capital** na Série A.
Gabriel: **Craque(prata) → Lenda(ouro) + FUNDADOR nº 37**.
- ✅ `data.ts`: DIVISION_TEAMS.A Titan Capital → Desportivo Montreal + OLD_NAME.
- ✅ `apoio.tsx`: FOUNDERS ouro + FUNDADOR_N 37.
- ✅ `escudos.tsx`: `LOGOS_PRONTAS['Desportivo Montreal']` (full + mini).
- ✅ `mascotes.tsx`: `MASCOTES.maite` — a MAITÊ, bebê brava de óculos escuros
  (homenagem do Gabriel à filha). Festão "É GOL DA MAITÊ!".
- ✅ **Manto 3 cores** (preto/branco/verde): `manto.ts` ganhou `MANTO_TRI` + `meuMantoC3()`
  e `mantoStripes` aceita 3ª cor opcional. Passado como prop SÓ nos renders do DONO
  (screens.tsx Campinho + pyramidseason) — NÃO pinta o manto dos outros na sala.
- ⏳ FALTA: DB `esc_socios` do Gabriel (escudo_time='Desportivo Montreal', mascote_key='maite',
  manto_c1='#0C0C0C' manto_c2='#FFFFFF', time_coracao='Internacional', origem='batismo') + `esc_fundadores`.
- Reversível: `git revert` + apagar linha do banco. Manto 2-cores dos outros intocado.

## ⏸️ PAUSADOS (esperando email do Diego pra publicar):
- **Allan Stag** (arte pronta: escudo-foto/arte + cobra Dibrados) — falta email + batismo/person.
- **Ligeiro FC** (Artur; escudo-arte + robô-TV, homenagem Túlio Ligeiro) — falta email + batismo/person.

## 🦍🦂 BATISMO: Scorporila FC (lucassrribeiroo2023) — kit visual (11/08)
Escudo + mascote + manto do batismo (ex-Realeza FC, Série A). O Diego rejeitou
várias tentativas SVG e TAMBÉM a imagem do Gemini (pesada: PNG cru ~275KB; webp
otimizado ~30KB, mas ele preferiu vetor). Decisão FINAL **aprovada**: SVG leve
estilo Nightfull. Gorila RUGINDO (silverback preto + máscara facial cinza) fundido
com ESCORPIÃO (cauda dourada segmentada + ferrão vermelho + pinças), sobre listras
P&B do Santos. Coração: Santos → manto branco com listras pretas (verticais).
- ✅ `escudos.tsx`: `LOGOS_PRONTAS['Scorporila FC']` (versão detalhada + MINI pra tabela).
- ✅ `mascotes.tsx`: `MASCOTES.scorporila` (corpo inteiro, aparece no festão).
- ✅ `data.ts` (OLD_NAME + CPU_MANAGERS) e `apoio.tsx` (ouro/Lenda) — já feitos por outra sessão.
- ⏳ FALTA: DB `esc_socios` do lucassrribeiroo2023 (escudo_time='Scorporila FC',
  mascote_key='scorporila', manto_c1='#FFFFFF' manto_c2='#0C0C0C', time_coracao='Santos').
- Reversível: `git revert` do commit + 1 UPDATE no banco. Futebol intocado.

## 💰 CARREIRA: reforma da economia (11/08) ✅ NO AR
Simulação até T140 mostrou que subir/competir levava ao vermelho (folha > renda de
meio de tabela da Série C pra cima). Ajustes aprovados pelo Diego (valores dele) e
implementados, cada um em commit isolado:
- 🔻 **Quedas aliviadas** — QUEDA em pyramidseason: C −10 · B −15 · A −20 (era 20/25/30).
- 🏆 **Copa Legends por fase** — `copaRewards` paga por fase alcançada (participação
  20% → quartas 40% → semi 65% → vice 80% → campeão 100%), total/divisão A30/B20/C15/D10.
- 🌍 **Copa do Mundo por participação** — campeão 100 · vice 70 · semi 50 · quartas 32 ·
  grupos 10 (ação COPA_MUNDO_PRIZE ganhou `coins`; copa-mundo.tsx calcula a fase).
- 📺 **Cota de TV** — renda por divisão no fim de temporada: V0 D5 C10 B15 A20
  (`applyTVIncome` em store.tsx, linha própria "📺 Cota de TV" no extrato) +
  **banner "a TV descobriu seu clube"** 1x por divisão (D/C/B/A), antes do patrocínio,
  só carreira SOLO (estado `tvBannerSeen`, ação TV_BANNER_SEEN).
- Simulação final: frugal 100→6.201, equilibrado 100→11.526 (nunca no vermelho);
  só quem estoura a folha na A/B ainda aperta (realista). Sem erro financeiro.
- Reversível: `git revert` em cada commit. Futebol (jogo) intocado — só economia da carreira.

## 🐛 ONLINE: host sai na votação → identidade embaralha (11/08) — EM CONSERTO
Bug relatado + CONFIRMADO no servidor (sala ABVYLU/68036bfb): o host (SucodeFruta,
cadeira 0) saiu na votação de fim de temporada; o `game_rooms.host_id` continuou
apontando pra ele (**host fantasma**) e ninguém assumiu direito; ao começar o
próximo jogo as cadeiras vazias foram renumeradas e cada aparelho continuou no
"quem sou eu" pela CADEIRA antiga → todos escorregaram de assento → nomes trocados
no chat, "lacrando pelo outro", voto de um caindo na conta de outro.
CAUSA-RAIZ: identidade amarrada à CADEIRA (youIdx/player_index) em vez do CRACHÁ
(manager.id) em vários pontos + carreira sem migração de host (store.tsx:5893).
Plano em 3 passos revertíveis:
- ✅ **Passo 1 (feito)**: `OnlineEndVote` (screens.tsx) usa CRACHÁ no voto/placar/
  presença/tag de host (era `youId = state.youIdx`). `duplas` continua por cadeira
  (`youSeat`). Presença convertida cadeira→crachá.
- ✅ **Passo 2 (feito)**: chat e alfinetada carimbam pelo CRACHÁ. `EmoteEvent`/
  `ChatMsg` ganharam `fromId` (crachá); `sendChat`/`emote` usam `myMgrIdRef`
  (âncora estável, movida pra cima no provider) pra achar "meu técnico" mesmo se
  a cadeira deslizou; `FloatingEmotes` resolve o autor por crachá (fallback índice).
- ✅ **Passo 3 (feito)**: eleição de host DETERMINÍSTICA no vigia do host
  (store.tsx ~6289). Quando o `host_id` aponta pra alguém fora da presença (host
  fantasma: fechou app/caiu/saiu sem passar coroa — rápido E carreira), os
  presentes elegem o MENOR uid presente → exatamente um assume, grava host_id e
  vira autoritativo; ganha o aviso "você virou host". Sem sorteio, sem dois hosts.
Futebol não foi tocado; cada passo é commit isolado e revertível.
CONSERTO COMPLETO (3 passos no ar). Falta o Diego testar em sala real com amigos.

## 🔴⚫🌿 KITS: Murriz FC + Império Samambaia (batismo) (10/08) ✅ NO AR
Dois batismos novos publicados juntos:
- **Murriz FC** (msb102010@hotmail.com, sócio nº7) — careca de barba ruiva
  ESTRESSADO, rubro-negro (Flamengo). Escudo faixas HORIZONTAIS + cabeça;
  mascote `careca_ruivo` corpo inteiro; manto vermelho/preto HORIZONTAL.
- **Império Samambaia** (jorgericardo777@gmail.com, sócio nº4) — samambaia BRABA
  coroada (cara de bravo + coroinha), verde sobre diagonais vermelho/branco
  (Rio Branco). Escudo + mascote `samambaia` (cabeça-vaso, corpo, punhos);
  manto vermelho/branco DIAGONAL; **festão CHOVE FOLHA** no lugar do confete.
- **Código**: `escudos.tsx` (2 entradas em LOGOS_PRONTAS), `mascotes.tsx`
  (`careca_ruivo` + `samambaia` + folhas no FestaoMascote), `manto.ts`
  (`mantoStripes` ganhou ângulo + `meuMantoAngle()` por mascote:
  samambaia=45° diagonal, careca_ruivo=0° horizontal, resto 90° vertical),
  `screens.tsx`/`pyramidseason.tsx` passam o ângulo só pro time do próprio dono.
- ⚠️ No online (manto dos OUTROS na sala) a listra sai VERTICAL por enquanto
  (o RPC esc_mantos_sala só devolve cor, não o mascote) — detalhe pequeno na
  faixinha de 14px; dá pra evoluir depois se o Diego quiser.
- **Banco**: 2 linhas em esc_socios + nomes reservados em esc_nomes_batismo.
- Reversível: `git revert` no commit + apagar as 2 linhas do banco.

## 🐷⚓ KIT: Marinheiros AS — 1ª ASSINATURA (10/08) ✅ NO AR
Primeira ASSINATURA do jogo (feehcamp11@gmail.com)! NÃO é batismo — é
personalização da conta do assinante (origem='assinatura', sócio nº15).
- Porco marinheiro ESTRESSADO (boina branca, vapor, dentes trincados), verde e
  branco (Palmeiras). Escudo = brasão verde + boia salva-vidas + porco de boina;
  mascote `porco_marinheiro`; manto verde/branco HORIZONTAL (marujo).
- **Código**: `escudos.tsx` ('Marinheiros AS'), `mascotes.tsx`
  (`porco_marinheiro`), `manto.ts` (porco_marinheiro=0° horizontal).
- **Banco**: 1 linha em esc_socios (origem assinatura, valido_ate 2099 — Diego
  ajusta se a assinatura vencer; não há hook de cobrança automático).
- Reversível: `git revert` + apagar a linha do banco.

## 🖤🤍 KIT: Bicho da Seda vira PRETO E BRANCO (Davi/davisantana1312) (10/08) ✅ NO AR
Diego corrigiu: o coração do Davi é **BOTAFOGO**, não Palmeiras. Então o
Bicho da Seda trocou de verde pra **preto e branco (alvinegro)**.
- **escudos.tsx** `'Bicho da Seda'`: brasão PRETO (#141414) com listras brancas
  + mariposa BRANCA (#F4F4F4) com pintas/veias/tufos pretos.
- **mascotes.tsx** `mariposa`: idem, branca com detalhes pretos.
- **Banco** `esc_socios` do Davi: manto_c1='#141414', manto_c2='#FFFFFF',
  time_coracao='Botafogo'.
- PENDENTE (perguntei ao Diego): botar ou não uma estrelinha branca no escudo
  (cara de Botafogo do Rio) — só se ele pedir.
- Reversível: `git revert` + voltar os campos no banco.

## 🐷 KIT: Xurupitas FC (batismo do denilson.stifler10) (10/08) ✅ NO AR
O denilson (sócio nº14, ouro) trocou o time de batismo "Tokyo City Esperion"
por **Xurupitas FC** — nome escolhido pra BATER com o "Xurupitas" que ele já
usa na carreira/ranking. Kit aprovado pelo Diego: **porco** verde/branco
(Palmeiras de coração), com as presas apontadas PRA CIMA (igual foto que o
Diego mandou), cabeça colada no corpo, porco forte.
- **escudos.tsx**: `'Xurupitas FC'` em LOGOS_PRONTAS (SVG do porco, presas p/ cima).
- **mascotes.tsx**: `porco` (corpo inteiro, camisa verde, short/tênis brancos).
- **data.ts**: ponte de renome `'Xurupitas FC' → 'Tokyo City Esperion' → 'FC Galáticos'`;
  desmanchei o elo velho da corrente do Davi (`'Bicho da Seda' → 'Red Bull Diet'`,
  sem passar mais pelo Xurupitas). CPU manager "Neguinho do Apito" agora joga
  pelo Xurupitas FC.
- **Banco**: `esc_socios` do denilson (escudo_time='Xurupitas FC', mascote_key='porco',
  manto_c1='#0B4D2C', manto_c2='#FFFFFF', time_coracao='Palmeiras');
  `esc_nomes_batismo` reserva **Xurupitas FC** pra ele (mantive "Tokyo City
  Esperion" reservado também, pra ninguém pegar o nome antigo).
- Reversível: `git revert` no commit + trocar de volta os campos no banco.

## 🖼️ PATROCÍNIO: logo da Vadico/ERO saía BRANCA quando selecionada (09/08) ✅ NO AR
Achado ao fazer o mockup do banner de fidelidade (pedido do Diego pra usar a
Vadico no lugar do Açougue): a logo virava um retângulo branco liso. Causa: o
PNG da Vadico e da ERO não tem fundo transparente (é RGB puro, fundo branco
"colado" na imagem) — o filtro que deixava a logo branca em cima do fundo
verde/preto (`brightness(0) invert(1)`) inverte a imagem TODA, não só o
desenho, e sem transparência isso vira um bloco branco sem nada visível.
A MaxJoias não tinha esse problema (o PNG dela tem transparência).
- **Confirmado que também acontecia na tela REAL** (não só no mockup): no
  cartão de escolha do patrocínio (`SponsorTierCard`), ao SELECIONAR a Vadico
  ou a ERO, a logo sumia (virava branco).
- **Corrigido** (`estadio.tsx`, 2 lugares — `SponsorTierCard` e o
  `SponsorLoyaltyBanner` novo de hoje): troquei o filtro de inverter cor por
  uma "chapinha branca" atrás da logo — funciona com QUALQUER logo, tenha ou
  não transparência, selecionada ou não.
- Reversível: `git revert` no commit desse fix.

## 🎖️ PATROCÍNIO: garantia de fidelidade (09/08, mockup aprovado) ✅ NO AR
Bateu a meta do patrocínio com uma marca → na temporada SEGUINTE, antes de
escolher de novo, aparece um banner da <b>Diretoria Comercial</b> da própria
marca (nome da empresa aparece), parabenizando e propondo: escolha a MESMA
marca de novo essa temporada e, mesmo que não bata a meta dessa vez, o
patrocínio garante pelo menos o mínimo (nível 1) em vez de zero. Só vale
UMA temporada (a que vem logo depois do acerto) — se não usar na hora, some.
Combinado com o Diego: **não usar a palavra "aposta" nesse banner novo**
(o resto da tela de patrocínio continua com "aposta" normal, só esse banner
evita).
- **Lógica** (`pyramidseason.tsx`, `sponsorBetRewards`): novo parâmetro
  `lastResults` (o `careerSponsorResult` de ANTES da virada, ainda não
  sobrescrito) — se não bateu a meta mas bateu na temporada anterior E
  escolheu a MESMA marca, aplica o piso (`sponsorBetValue(div, 1)`) e marca
  `floored: true` no resultado. Os 2 call-sites (`CLOSE_SEASON_BOOKS` solo e
  o builder de `args()` do online) passam `state.careerSponsorResult`.
- **UI** (`estadio.tsx`): `SponsorLoyaltyBanner` novo (só aparece quando
  `result.hit`, antes do técnico escolher de novo — some depois que ele
  decide). `SponsorBetResultCard` ganhou o caso `floored` (ícone 🎖️, texto
  explicando que a fidelidade pagou o mínimo, pílula verde em vez de
  vermelha) — sem isso a pessoa não entenderia de onde veio o dinheiro numa
  temporada que "não bateu".
- Reversível: `git revert` no commit desse fix.

## 💰 CARREIRA: prêmio de acesso da D/Várzea + campeão da Várzea subiram (09/08) ✅ NO AR
Contexto: investiguei relato de "carreira tá difícil" e achei que o handicap
subiu MUITO exatamente na Várzea/D (04/08) — é a primeira coisa que todo
mundo enfrenta. Diego decidiu dar uma força de caixa logo na entrada:
- **Acesso (top-4) da Série D**: 0 → **15**
- **Acesso (top-4) da Várzea**: 0 → **10**
- **Campeão da Várzea**: 12 → **15** (campeão da Várzea agora leva 15+10=25)
- `pyramidseason.tsx`: constantes `CAMPEAO`/`ZONA`. Vale carreira em andamento
  (não precisa começar save novo).
- **Bug de exibição achado e corrigido junto** (o Diego reparou sozinho e
  pediu pra conferir): o painel "🏆 Prêmios da temporada" (aba Tabelas)
  tratava a Série D como especial no "Queda" (mostrava "—" hardcoded pro "D"
  só), mas não fazia o mesmo pra Várzea — a Várzea mostrava "−0" em vermelho
  (parece penalidade, mas o valor real sempre foi zero). Trocado pra checar
  `QUEDA[d] > 0` (mesmo padrão que a coluna Top-4 já usava), corrige as duas.
  Textos da legenda também tavam desatualizados ("Da Série D ninguém cai — é
  a última") — isso ficou errado desde que a Várzea existe (os últimos 4 da D
  caem pra Várzea todo ano, só que sem desconto). Reescrito.
- **Os NÚMEROS pagos sempre bateram certo** (o painel lê a mesma constante
  que o jogo usa pra pagar) — o problema era só a aparência/texto do "—", não
  o dinheiro em si.
- Reversível: `git revert` no commit desse fix.

## 💰 BATIZA TEU CLUBE: Pix da Série D não copiava o valor certo (09/08) ✅ NO AR
Diego reparou que os dois cards de preço (Série A·B·C·Várzea R$59,90 · Série
D R$69,90) eram só enfeite fixo — o botão "COPIAR PIX" sempre gravava 59,90,
mesmo pra quem ia batizar clube na Série D.
- Mockup aprovado ("ficou bom") antes de codar, como sempre pra visual.
- **Corrigido** (`screens.tsx`, `ApoieButton`): os dois cards agora são
  TOCÁVEIS — escolhe a série, o card escolhido fica destacado (dourado) e o
  botão de copiar Pix já muda pro valor certo sozinho (59,90 ou 69,90).
  Padrão: A·B·C·Várzea (59,90), igual já era.
- Reversível: `git revert` no commit desse fix.

## ⚽ COPA LEGENDS (carreira): reserva fazendo gol + substituição não valia (09/08) ✅ NO AR
Diego repassou relato de usuário: "reserva fazendo gol" na Copa (só valem os
11 titulares — reserva só entra COM troca) e "não dá pra substituir na Copa".
- **Causa (uma só, pros dois relatos)**: a Copa Legends (mata-mata dos 16, fim
  de temporada) é calculada TODA DE UMA VEZ (`computeCopa`), diferente da liga
  (que já usava a escalação certa por rodada, `lineupAt`). A Copa sempre usava
  o `bestXI` cru do elenco inteiro — o "melhor 11 pelo nível" recalculado do
  zero — ignorando por completo a escalação que o técnico realmente montou
  (`careerLineup`). Por isso: (1) quem aparecia jogando podia ser diferente de
  quem o usuário escalou (parecia reserva fazendo gol) e (2) qualquer troca
  feita não tinha efeito nenhum na Copa — daí "não dá pra substituir".
- **Corrigido** (`pyramidseason.tsx`, `computeCopa`): agora o time HUMANO
  entra na Copa com a escalação DE VERDADE (a mesma que valeu no fim da liga,
  via `lineupAt`), não mais o `bestXI` cru.
- **Por que a troca não muda fase a fase**: a Copa inteira já sai pronta de
  uma vez (só é REVELADA fase a fase depois, pra não dar spoiler) — trocar o
  time NO MEIO da Copa reabriria resultado que já foi mostrado. Por isso a
  escalação usada é fixa: a mesma que valeu no fim da liga (rodada 38). Pra
  mudar quem joga a Copa, o técnico troca no Elenco ANTES da liga acabar (ou
  no fim, antes de entrar na Copa) — vale pra ela inteira.
- Reversível: `git revert` no commit desse fix.

## 🎁 CARTA DO CAMPEÃO: achado o motivo de sumir mesmo campeão de verdade (09/08) ✅ NO AR
Diego relatou um usuário que foi campeão DUAS vezes e não recebeu carta
NENHUMA das duas — pediu pra analisar a fundo os dois pontos possíveis: (1)
tem algum modo/cenário onde o pacote nem aparece pro campeão? (2) quando
falha, a carta some do álbum de vdd (quebra a GARANTIA) ou só o banner
visual que não aparece?
- **Ponto 1 (nunca aparece pro campeão): não achei nenhum buraco.** Conferi
  TODOS os lugares que abrem `CardCollectPrompt` — Rápido CPU/online (liga
  e Copa dos 8), Carreira liga/divisão (D/C/B/A **e Várzea**), Copa Legends,
  Copa do Mundo, e o guardado de multiclube — e em todos o pacote só depende
  de "você é campeão", nunca de `agenciaOn` ou qualquer outro flag que
  pudesse excluir um campeão de verdade. Inclusive conferi que meu fix de
  09/08 do ranking (item acima) só mexeu na GRAVAÇÃO DO TÍTULO, não na carta
  — carta continua garantida em qualquer carreira, nova ou antiga.
- **Ponto 2: achei e corrigi uma falha real, que apaga a carta de verdade
  (não é só o banner que some).** O `CardCollectPrompt` checava a conta com
  `supabase.auth.getUser()` — essa chamada BATE NO SERVIDOR (não é local).
  Se a rede engasgasse bem naquele instante (comum em carreira, que roda
  horas — celular volta do fundo, wifi cai um segundo), o código tratava
  "deu erro de rede" IGUAL a "não tem conta": mostrava a tela de "criar
  conta grátis" pra um campeão que JÁ TINHA conta, e a carta nunca era
  gravada (nem entrava na fila de retry — essa parte só existe pra falha na
  GRAVAÇÃO, não pra falha no check de login). Pior: o `persist()` fazia
  outro `getUser()` por conta própria — ou seja, DOIS pontos onde uma rede
  ruim podia derrubar a carta, não só um.
- **Corrigido** (`screens.tsx`, `CardCollectPrompt`): troquei o check pra
  `getSession()` (lê local, sem bater na rede — não trava por wifi ruim),
  com até 3 tentativas antes de desistir de vdd; e o `persist()` agora
  REUSA a conta já resolvida no check inicial em vez de checar de novo. Isso
  fecha os dois pontos onde uma instabilidade passageira podia fazer o
  campeão sumir sem carta.
- **Achado à parte, NÃO mexido**: esse padrão de `getUser()` (bate na rede,
  sem retry) se repete em ~40 lugares do jogo todo (vários arquivos) — não
  mexi em nada além do fluxo da carta (é o único que Diego pediu pra
  investigar, e mexer nos outros 39 é risco desnecessário pro futebol ao
  vivo sem pedido). Se aparecer outro relato parecido em outro lugar (ex.:
  perfil não carrega, apoio não reconhece a conta), é candidato a levar o
  mesmo tratamento.
- Reversível: `git revert` no commit desse fix (só mexe no
  `CardCollectPrompt`, não muda visual nenhum — sem precisar de mockup).

## 🏆 RANKING: carreira antiga (sem Agência) parou de somar título (09/08, print do Falido FC) ✅ NO AR
Diego mandou print de um técnico (Falido FC) com 391 títulos/quase 49 mil
gols — carreira antiga, sem a Agência 2.0, virou um jeito fácil de inflar o
ranking sem jogar o modo de verdade. Pedido: só carreira NOVA (com Agência)
soma título pro ranking daqui pra frente; quem quer subir tem que jogar
carreira nova.
- **Achado**: os 3 lugares que gravam título de carreira no `esc_results`
  (o que a aba "🪜 Carreira" do ranking lê) — liga/divisão e Copa Legends em
  `pyramidseason.tsx`, Copa do Mundo em `copa-mundo.tsx` — não checavam
  `state.agenciaOn` (o flag que marca carreira nova vs antiga). Corrigido:
  os 3 agora só gravam com `agenciaOn` true. A Copa do Mundo precisou o flag
  passado por prop (`CopaMundoGate → CopaMundo → CupScreen`).
- **A carta de campeão continua garantida em QUALQUER carreira** (antiga ou
  nova) — só o TÍTULO do ranking que parou de contar em save antigo.
- **NÃO retroativo**: título já gravado de carreira antiga continua lá (não
  apaguei histórico de ninguém) — só parou de SOMAR mais daqui pra frente.
  Se quiser também esconder/zerar o que o Falido FC (e outros) já grindaram
  assim, é outro passo — avisar antes de eu mexer (apaga dado de gente).
- **Achado à parte, NÃO mexido**: o modo "carreira online" LEGADO
  (`careeronline.tsx`, tela antiga) grava `season_key` sem o prefixo `co:`
  — por isso nem cai na aba Carreira hoje, cai ERRADO na aba Rápido Online
  (o filtro do RPC `esc_ranking` só exclui `co:%`, não confere o formato
  certo do rápido). Pode ser OUTRA fonte da inflação do Falido FC — decisão
  em aberto, e mexer aí é do lado do banco (RPC `esc_ranking`), mais
  delicado. Reversível com `git revert d55c35b`.

## 🤝 DUPLA: formar vaga virou PEDIDO com aceite (09/08, pedido do Diego) ✅ NO AR
Mudança combinada em conversa: tocar numa vaga não vira dupla mais na hora —
manda um PEDIDO, a pessoa vê um banner e ACEITA ou RECUSA (ou deixa expirar
em 30s). O 🔒 cadeado continua igual (a própria pessoa marca na vaga dela,
bloqueia qualquer pedido de fora — mostra "guardando a vaga pra um amigo").
- **Schema** (`supabase/dupla_pedido_schema.sql`, JÁ aplicado no projeto real
  `faabglpjutwursgmrpny` via MCP): 2 colunas em `room_players`
  (`dupla_request_to`, `dupla_request_at` — moram na linha de QUEM PEDIU,
  por causa da RLS) + função `dupla_responder` (SECURITY DEFINER: só ela
  grava `dupla_partner_of` na linha de quem pediu, depois de confirmar no
  servidor que o pedido é mesmo pra quem tá aceitando/recusando).
- **Código** (`lobby.tsx`, commit `8efba3c`): `pedirDupla` (manda o pedido,
  com conferência fresca pra não deixar 2 pedidos brigando pela mesma vaga),
  `cancelarPedido` (self-clear, inclusive o auto-expira em 30s via
  `useEffect`), `responderPedido` (chama a RPC). Tela mostra: pra quem pediu
  "⏳ esperando [nome] responder…" com botão cancelar; pra quem recebeu, o
  banner com ✅ Aceitar / ✕ Recusar; pra um terceiro olhando a mesma vaga,
  "⏳ já mandou pedido, aguardando resposta" (não deixa pedir por cima).
- Reversível: código com `git revert 8efba3c`; schema com o comando no topo
  do `.sql`.
- **Não mexido**: nada na formação de dupla durante um REMATCH (aquilo já
  usa outro caminho, `startLeilao`/`redraftSeason`, que preserva a dupla que
  JÁ EXISTIA — não passa por pedido/aceite de novo).

## 🐛 DUPLA ONLINE: relato do próprio Diego jogando com o Didico — 2 corrigidos, 1 em aberto
Diego jogou de dupla com o host numa sala e relatou dois problemas (fotos):
**(1) virou "rival" do próprio parceiro** — no fim do jogo, o host apertou
"🔨 Novo leilão" e Diego, que era DUPLA do host, apareceu como time
SEPARADO/adversário, sem ninguém ter pedido pra desfazer a dupla.
**Causa achada e CORRIGIDA ✅**: o botão "Novo leilão" (`startLeilao` em
`screens.tsx`) remontava os times só pela ordem crua da tabela
`room_players`, sem saber que uma das linhas era CARONA de dupla
(`dupla_partner_of`) — tratava o parceiro como um técnico próprio. A sala
de espera já resolvia isso certinho; só copiei o mesmo jeito pro "novo
leilão" (só DONO de assento vira time; `duplasMode`/`duplas`/`youUid` agora
vão junto no `START_ONLINE`, que antes não mandava nada disso — ficava
sempre sem dupla nenhuma no leilão novo).
**(2) chat mostrando "Você" pro parceiro também** — no chat da partida,
quando o Diego e o parceiro (Didico/Alfacehh) escreviam, os dois apareciam
como "Você", sem dar pra saber quem tinha falado o quê.
**Causa achada e CORRIGIDA ✅**: o chat decidia "é minha mensagem?" pelo
TIME (`from === youIdx`) — numa dupla os dois COMPARTILHAM o mesmo time,
então a msg do parceiro batia como sendo seguida. `ChatMsg` ganhou um
campo `uid` (a pessoa de verdade, não o time); a checagem agora usa esse
uid quando existe. Reversível com `git revert 9bc346e`.
**(3) host podia começar sem o parceiro votar — CORRIGIDO ✅ (09/08)**: a
tela de votação do fim de jogo (`OnlineEndVote`) conta voto por TIME, e
numa dupla o parceiro do host compartilha o mesmo time — nunca aparecia
na lista de pendência do host, que achava "só falta gente de fora" e
destravava sozinho. Corrigido: o host agora enxerga se tem parceiro
(`state.duplas`) e usa a MESMA chave (`votes[youId]`, que só o parceiro
escreve — o host nunca vota, decide) pra saber se ele já confirmou.
Botões travam com aviso "🤝 Aguardando seu parceiro [nome] votar…", igual
já acontecia pros outros times. O modal "nem todo mundo votou" ganhou
opção própria pro parceiro (não dá pra "excluir" ele — só esperar ou
"▶️ Começar mesmo assim", nunca trava o jogo). Reversível com
`git revert 3f4dfba`.
Também relatado, ainda **NÃO confirmado/investigado**: um amigo que entrou
pra ser dupla do Diego não apareceu no nome da dupla (apareceu o nome de
OUTRA pessoa) — pode ser sintoma do mesmo bug (1) com dado velho no
`room_players`, mas não tracei a fundo ainda; avisar se acontecer de novo
depois desse conserto.

## 🐛 AGÊNCIA: carta de campeão podia não entrar (relato do Diego sobre o Luiz Filipe Maia, campeão da Série D) ✅ NO AR
Print do jogador: ganhou a Série D (troféu confirmado no Hall), álbum tem a
carta certinha, mas "Seus agenciados" tava vazio (0/22, busca sem resultado).
Perguntei se era travado por tier (Lenda/Craque) — **não é**: `AGENCIA_GERAL
= true`, liberada geral, comentário antigo dizia "só o Diego" mas isso mudou
em 03/08. Achei a causa de verdade: `CardCollectPrompt` já GARANTIA a carta
no ÁLBUM na hora (efeito "conta mesmo sem abrir"), mas o aviso pra Agência
(`ADD_EMPRESARIO_CARD`) só disparava dentro de `openPack()` — ou seja, só se
a pessoa tocasse no pacote OU esperasse o timer acabar. Quem avança rápido
pra próxima temporada antes disso: álbum ok, Agência vazia.
**Regra confirmada pelo Diego (nesta conversa)**: "deve qualquer título
ganhar carta... serve pra qualquer modo rápido/carreira/online/offline...
até na várzea... e qualquer outro novo que eu invente." Ou seja: card da
Agência tem que ser GARANTIDO igual o álbum, sem depender de interação.
**Corrigido**: novo callback `onGuaranteed` no `CardCollectPrompt`, disparado
no MESMO instante da garantia do álbum. Trocado nos 4 lugares que alimentam
a Agência: liga (solo/online), Copa Legends, multiclube pendente e Copa do
Mundo. `onClaimed` continua como estava (o broadcast pros outros da sala
online ainda espera a revelação de verdade — sem spoiler pra ninguém, regra
separada e não mexida). Reversível com `git revert da5c24a`.
⚠️ **Não corrigido retroativamente**: a Série D do Luiz já passou (ele tá na
Série C agora) — a carta dele NÃO vai aparecer na Agência sozinha, porque a
tela daquele título específico não existe mais pra remontar. Se quiser
compensar ele, precisa de um ajuste manual no save dele (não fiz — precisa
acesso ao Supabase, que essa sessão não tinha liberado).
✅ **Segunda pergunta do Diego, respondida**: e se o prêmio sortear uma carta
de categoria ainda TRANCADA (ex.: 👑 Lenda antes de comprar a SAF)? Já
funciona do jeito certo: a carta APARECE e CONTA (mostra no "Sua Agência",
inclusive pode ser convocada pros 22 ativos), só a RENDA em moedas fica
"🔒 destrava: [requisito]" até desbloquear aquela categoria — nunca esconde
nem perde a carta, só a moeda que ela renderia.

## 🏪 APOIE v14 COMPLETO — NO AR (09/08, commit 9087922; Diego reclamou
"quase não mudou" vendo só o card do sócio): o MIOLO do modal foi trocado
pelos cards aprovados — ⭐ Craque (Manual/prata/overall até ⭐ + chips 4
fichas e sócio 4,90) · 👑 Lenda (ouro/VIP/overall total + caixa dourada
Carreira Online/Ligas Fechadas + chips 6 fichas, +R$20, sócio 2,90) ·
🖋️ Batismo preto-e-ouro (nome no jogo, preços com motivo A·B·C·Várzea
59,90 / Série D rivais 69,90, tudo da Lenda, SÓCIO INCLUSO, FUNDADOR até
nº100, regra do barão, 8 fichas). Tocar no card abre o fluxo de compra de
cada um (cores prata/ouro · dream). "Só apoiar (Pix)" virou botão fino.
Caixa antiga "Só pra quem é Lenda" saiu (conteúdo mora no card da Lenda).
+ 🗳️ BANCO DA VOTAÇÃO PRONTO (migração votacao_e_mural_dos_socios):
esc_votacoes/esc_votos + RPCs esc_admin_votacao_criar/fechar,
esc_votacao_atual (% ao vivo, só sócio), esc_votar (troca permitida
enquanto aberta) e esc_mural (nome+nº+desde+tier, sem e-mail). FALTA a UI
(área do sócio no modal + seção votação no painel) — próxima leva.

## 🐊 FESTÃO DA MASCOTE — NO AR (09/08, commit 9c1d24f):
src/escalacao/mascotes.tsx = registro MASCOTES (chave→desenho; 1ª: 'alface',
a alface brava de corpo inteiro) + <FestaoMascote>: overlay do GIF aprovado
em CSS 60fps — fundo verde radial + raios girando + chuva de confete +
"🏆 CAMPEÃO!" pulsando + a mascote ATRAVESSANDO a tela quicando (sombra,
gingado), ~4,2s, toque pula. Gatilhos: RÁPIDO (EscEnd, youWon) e CARREIRA
(campeão da divisão, pós-animação da 38ª). Só o campeão vê; 1x por
temporada (sessionStorage). A chave vem de esc_socios.mascote_key — campo
novo "mascote (chave: alface)" no painel 🎨. Pra estrear: setar
mascote_key='alface' pro matheus223lms (Alfacehh) no painel.
FALTAM da fila grande: votação+mural · cards v14 no modal · patch
quase-nomes · mascotes novas conforme os barões pedirem (desenhar em
mascotes.tsx, mesma receita da alface).

## 📰 ESTÁDIO NO JORNAL — NO AR (09/08, commit 3298204): a capa do jornal
de fim de temporada (na tela E na imagem compartilhada pro zap/IG) agora
fecha o subtítulo com "Direto do 🏟️ {nome batizado}." quando o sócio tem
estádio batizado. Propaganda do batismo de estádio em toda capa postada.

## 🚪 PORTA DOS OLHEIROS NO AR (09/08, commit 95119d0): no topo do elenco
da carreira, quem NÃO tem tier vê o convite discreto "🕵️ Quer ver o
overall? ⭐ vê até craque · 👑 vê TUDO — toca aqui" → abre o APOIE (tela
choice). Some pra Craque/Lenda (regra das portas: botão só pra quem não
tem). Obs: a arte antiga olheiro-porta.png dizia "olheiros do sócio" —
DESATUALIZADA, olheiros são dos TIERS agora.

## 🎟️ FICHAS DE CARREIRA POR TIER — NO AR (09/08, commit ee324df, Diego
confirmou 2/4/6/8): grátis 2 · ⭐ Craque 4 · 👑 Lenda 6 · 🖋️ Batismo 8.
careerSlotLimit(count) em store.tsx: GRANDFATHER LITERAL — limite pessoal
nunca fica abaixo do que a pessoa JÁ tem (nada apagado, nada travado; a
régua só vale pra criar ALÉM). MAX_CAREER_SLOTS virou teto de GUARDA = 8
(o slice do arquivo nunca corta ninguém). Trava com aviso claro + caminho
("apague uma ou vire ⭐4/👑6/🖋️8") na tela Minhas Carreiras; linha "💾
Fichas de carreira" adicionada no card de cores do APOIE.

## 🕵️ OLHEIROS NO AR (09/08, commit 9f7825f — Diego cobrou ao vivo "não tô
vendo over no meu elenco"): overall "lo–hi" com FUNDO na cor da categoria
(ouro lenda · prata craque · roxo promessa · verde bom · bege resto) ao
lado de "clube · ano" nas listas Titulares/Reservas do elenco da CARREIRA.
Escadinha: 👑 ouro/batismo vê TUDO · ⭐ prata vê fame<5 · resto nada.
Gates duros: olheiros={onlineMode!=='online'} (nunca online), só
ElencoField (nunca leilão/monte/YourPitch), cartas fake não mostram,
NUNCA a palavra da categoria. + MANTO AGORA LÊ DO BANCO: manto.ts busca
esc_meu_socio (cache com auth listener + hook useMeuSocio), fallback
MANTO_CONTAS do código; migração socio_personalizacao_admin criou RPC
esc_admin_socio_perso(email, c1, c2, estadio, mascote) gated no Diego.
✅ ENTREGUE (commit caf9ff8): inputs de personalização no painel (🎨
"Personalizar sócio": email + 2 cores do manto com PREVIEW das listras +
nome do estádio → esc_admin_socio_perso) e o NOME BATIZADO no título da
área do clube ("🏟️ Alfacehh Arena" no lugar do nome de nível; desenho
intocado, só pro dono sócio ativo).
AINDA FALTA: mascote/festão animado · votação de categoria + mural ·
cards v14 do craque/lenda/batismo no modal · patch quase-nomes · nome do
estádio nas manchetes do jornal · link avulso Craque 19,90 (Diego).

## 🏪 LOJA v1 NO AR (09/08, commit 556f697): o modal APOIE ganhou o SÓCIO
- Card 🎫 SÓCIO LEGENDS no TOPO da tela "choice" (roxo com brilho, selo
  NOVO): benefícios em 1 linha (manto/escudo/mascote/estádio/30 moedas/
  cor roxa+carteirinha) e o BOTÃO JÁ ABRE O PLANO CERTO do Mercado Pago
  pelo tier da pessoa (grátis 9,90 · prata 4,90 · ouro 2,90 — MP_SOCIO em
  screens.tsx) + logApoio pro funil.
- 💛 História do Luca v3 substituiu a antiga NOS DOIS lugares do modal
  (card preto-e-ouro, assinada "fundador nº 1").
- ❌ "100% grátis" REMOVIDO do jogo inteiro (grep = 0) → "grátis pra jogar".
- FALTA na loja (próximas levas): cards do Craque/Lenda/Batismo no formato
  v14 (hoje seguem o fluxo antigo de cores/Pix, funcionando) · link avulso
  Craque 19,90 na trava do Manual (esperando o Diego criar) · área do
  sócio · manto/mascote/estádio pelo admin · votação/mural · patch nomes.

## 🖋️🎫 BARÕES VIRARAM SÓCIOS — NO AR (09/08, commit 6ea494c + migração
baroes_socios_inclusos_e_resgate_mensal):
- 11 contas de batismo inseridas no esc_socios com validade 2099 e
  origem='batismo' (achadas nos comentários do FOUNDERS; LISTA CONFIRMAR
  com Diego): danielmanfre5 (Manfré FC) · matheus223lms (Alfacehh) ·
  jorgericardo777 (Império Samambaia) · davisantana1312 (Bicho da Seda) ·
  guilhermevictor539 (Nightfull FC) · msb102010 (Murriz FC) · ofc.toka10
  (Tôka10) · matheusncruz1 (Skyy FC) · adriano.ferrari@quepazseguros (SC
  Ferrari) · lucasigorbortoliniii (Marreco FC) · ricardopessoafreire
  (Barcenite FC). Eles já têm carteirinha roxa no perfil + selo 🎫.
- 🪙 RESGATE MENSAL: RPC esc_socio_resgatar (30 🪙, 1× por conta/mês,
  trava no servidor via esc_socio_resgates) → cliente credita com
  BANCO_CREDIT no caixa da carreira ativa. Vale pra TODO sócio ativo.
- 📢 BANNER DO BARÃO no topo da carreira solo (SÓ origem='batismo'):
  boas-vindas "seu batismo vale um Sócio", lista das vantagens (30 moedas
  — "as deste mês JÁ caíram" quando o resgate acontece —, escudo, mascote,
  manto, estádio, carteirinha) + botão "chamar no direct" (copia msg e
  abre o IG) + fechar com memória. Aviso pós-fechado quando moedas caem.

## 🚀 FECHA GERAL DADO (09/08, madrugada): "E pode implementar tudo já"
TUDO aprovado — specs finais: loja em cards v14 (sócio → HISTÓRIA v3 →
craque → lenda → batismo), história v3 com o LUCA (sem barra de servidor,
sem "100% grátis"), estilo v11 (título forte + 1 linha de tempero), preços
9,90/4,90/2,90 com os 3 links MP no diário, batismo com sócio incluso +
fundador. ✅ JÁ ENTREGUE nesta leva: carteirinha ROXA de sócio no perfil
(commit 81fc7c0: card roxo com nº/meses de casa/desde + selo 🎫 no nome —
o 1º sócio que o Diego liberar no painel já aparece). PRÓXIMAS OBRAS na
ordem: (1) LOJA NOVA no jogo (substituir modal APOIE: cards v14 + história
v3 + botões abrindo os links MP por tier + corrigir "100% grátis" do
paywall vivo) · (2) área do sócio (pedidos de escudo/mascote/manto/nome do
estádio → admin) · (3) manto pelo admin (tirar do hardcode) · (4) nome do
estádio no jogo · (5) mascote/festão · (6) votação+mural · (7) patch
quase-nomes. Falta do Diego: link avulso Craque 19,90.

## 🏗️ PLANO DE OBRA DA LOJA/SÓCIO — "pode implementar" dado pelo Diego (09/08)
Ele aprovou as carteirinhas ("Perfeito") e mandou construir TUDO que foi
decidido + um PERFIL COMPLETO do usuário. Ordem de obra combinada (cada
entrega = commit isolado, buildar antes, main = deploy):
1. ✅ PERFIL DO TÉCNICO v1 NO AR (commit 942e03e; mockup aprovado "Perfeito"
   + regra dele: 1 carteirinha só = tamanho grande — aplicada, a de fundador
   sozinha já ocupa a largura toda). O que entrou: tocar no técnico do
   ranking abre PERFIL (stats 🏆👟⚽🎴 da RankRow + sala de troféus em chips +
   carteirinha de FUNDADOR — por ora SÓ no próprio perfil, pois FUNDADOR_N é
   por e-mail local) e o álbum virou seção "🎴 Álbum de cartas" (chips
   carreira/conta e ordenação intactos). FALTA (fase 2, depende da infra
   item 2): carteirinhas dos OUTROS + header na cor do tier de cada um (RPC
   esc_perfil por user_id) + carteirinha de sócio.
   ✅ FASE 2 TAMBÉM NO AR (commit 6d20601 + migração
   perfil_publico_tiers_e_fundadores): Diego questionou ("se eu te dou o
   e-mail pra fazer craque/lenda, como não dá pra saber?") — e ele tinha
   razão: a ponte foi construída. (a) tiers do código FOUNDERS upsertados no
   user_colors com DO NOTHING (não sobrescreve o painel; 54 linhas);
   (b) tabela esc_fundadores (email→nº, RLS trancada, 28 fundadores);
   (c) RPC esc_perfil(p_user) SECURITY DEFINER: user_id → tier + fundador_n
   SEM expor e-mail. No jogo: header do perfil na COR DO TIER de cada um
   (grátis=bege) + selos no nome + carteirinha de fundador visível em
   QUALQUER perfil. ⚠️ Regra nova: ao dar tier/fundador novo, atualizar
   TAMBÉM o banco (user_colors/esc_fundadores) — ou só pelo painel, que já
   grava no banco.
   (era: 👤 PERFIL DO TÉCNICO — mockup perfil-ex.png aprovado):
   tocar num nome (ranking etc.) abre perfil completo — header na cor do
   tier + selos, stats (títulos/artilharias/gols/cartas — RankRow já tem),
   Documentos (carteirinha fundador preta-e-ouro / sócio roxa, só se
   existirem), Sala de Troféus, e o álbum de cartas vira UMA seção ("ver as
   N →" abre o álbum de hoje). Fundador nº: precisa expor por user_id (hoje
   FUNDADOR_N é por e-mail, client-side) — criar view/RPC ou coluna no
   ranking.
2. ✅ INFRA SÓCIO NO AR (09/08, migração infra_socio_legends + commit
   b3b4453): tabela esc_socios (email PK, socio_n identity FIXO, desde,
   valido_ate ~33d, manto_c1/c2, estadio_nome, mascote_key; RLS trancada) ·
   RPCs: esc_admin_socio_set (liberar/renovar +33d; p_dias<=0 EXPIRA sem
   apagar — nº e tempo de casa preservados, regra do Diego) ·
   esc_admin_socio_list · esc_meu_socio (status próprio) · esc_perfil
   AMPLIADO (agora devolve socio_n/desde/ativo também). Painel ganhou a
   seção "🎫 Sócio Legends · mensal" (roxa, entre Apoiadores e Fichas).
   💳 LINKS MP DOS SÓCIOS — COMPLETOS (09/08) e PREÇOS OFICIAIS CORRIGIDOS
   pra terminação ,90 (Diego): grátis R$ 9,90 · Craque R$ 4,90 · Lenda
   R$ 2,90 (batismo = incluso, sem plano):
   · 9,90/mês (grátis): https://mpago.la/2G3nmQq
   · 2,90/mês (Lenda): https://mpago.la/2CGoqiJ
   · 4,90/mês (Craque): https://mpago.la/1jqtK38
   ✔️ 09/08: eltonfrossard45@gmail.com virou LENDA (ouro+manual) + FUNDADOR nº 36
   + SÓCIO nº 12 (origem batismo, validade 2099) — direto no banco.
   ✔️ 09/08: TIME DE CORAÇÃO no perfil (só sócio; batismo já é sócio): coluna
   time_coracao em esc_socios + esc_perfil devolve + rótulo embaixo do escudo
   vira o clube REAL (Palmeiras, Cruzeiro...). Painel 🎨 ganhou o campo. Já
   setados: Xurupitas=Palmeiras · Manfré=Paraná Clube · Elton=Cruzeiro ·
   Nightfull=Atlético Mineiro · Diego=Flamengo. 💡 FUTURO combinado: ranking de
   TORCIDAS no jogo usando time_coracao.
   🔁 CORREÇÃO DE DONO (09/08, confirmada pelo Diego): o batismo Xurupitas FC
   (ex-Bicho da Seda) é da conta denilson.stifler10@gmail.com — a conta que
   JOGA de Xurupitas no ranking (registro de 07/08 tinha trocado pra
   davisantana1312). Movido o pacote inteiro: sócio nº 5 origem batismo,
   mascote mariposa, escudo_time Xurupitas FC, manto verde/branco.
   davisantana1312 segue Lenda paga + Fundador nº 11 (status original), SEM
   sócio. Atenção: o batismo Tokyo City também consta nessa mesma conta
   denilson — Diego vai checar com a galera se está certo.
   ✔️ 09/08: REGRA DO CLONE no ar — nunca dois times com o mesmo nome na mesma
   competição: humano jogando com o nome do próprio batizado esconde o robô
   homônimo DAQUELA partida/carreira (reserva entra; batizado segue normal pro
   resto do mundo). Pontos: makeManagers (online/rápido, c/ backfill),
   initCareerRivals, soloRivalDefs e fillerDefs. Saves em andamento intocados.
   📌 REGRA PRA TODA SESSÃO (09/08): liberar Craque/Lenda = setar user_colors
   (tier + manual). Essa é a CHAVE-MESTRA — overall dos olheiros, fichas de
   carreira e preço do sócio derivam dela sozinhos, não existe trava separada.
   E ANTES de explicar o que um tier dá, ler este diário (o mundo mudou 09/08).
   ✔️ pereirigor@outlook.com = Craque completo (conferido: prata+manual no banco).
   ✔️ 09/08: PERFIL ganhou "🛡️ O clube do coração": escudo artesanal + mascote
   de quem TEM (esc_perfil agora devolve mascote_key + escudo_time; coluna nova
   escudo_time em esc_socios com os 5 barões). Sem placeholder pra quem não tem.
   Troféus da Sala de troféus MAIORES (14px, borda 3px, Oswald).
   ✔️ 09/08: KIT NIGHTFULL FC publicado (Atlético-MG do Guilherme): escudo
   alvinegro c/ lua+estrela e o GALO BALADEIRO de óculos escuro; mascote 'galo'
   (corrente de ouro, pose Travolta, bola); manto preto/branco no banco.
   Total: 5 escudos artesanais + 6 mascotes no ar.
   ✔️ 09/08: KIT MANFRÉ FC publicado (Paraná Clube do Manfré): escudo azul c/
   faixa vermelha + CABEÇONA da gralha-azul (molde da referência oficial que o
   Diego mandou — só a cabeça no escudo, pedido dele); mascote 'gralha' inteira
   (camisa metade/metade, mão na cintura, pé na bola); manto azul/vermelho no
   banco. 4º escudo artesanal + 5ª mascote.
   ✔️ 09/08 (noite): KIT NEYMARZETTI publicado (aprovado v5): escudo artesanal
   de perfil c/ crista ÚNICA preto+loiro, brincão, sorrisão c/ dentes; mascote
   'moicano' (camisa 11, meião, bota amarela, bola). Diego virou SÓCIO Nº 1 no
   banco (todos os outros desceram +1: Manfré 2, Alface 3...), manto vermelho/
   preto agora no DB. Mascotes setadas: alface (matheus223lms), mariposa (davi),
   raposa (elton), moicano (diego). 4 escudos artesanais no ar.
   ✔️ 09/08: ÁREA DO SÓCIO no ar (mockup aprovado; SEM votação criada — quem
   cria as perguntas é o Diego pelo painel): no APOIE, sócio ativo vê "Você é o
   Sócio nº X" no lugar da propaganda → abre votação (barras SÓ depois de votar,
   anti-spoiler) + mural (cor do próprio tier, nº, origem, desde). Painel ganhou
   seção 🗳️ criar/parciais/fechar. ✔️ Xurupitas FC no lugar do Bicho da Seda
   (davisantana1312) — kit mariposa APROVADO e no ar: escudo SÓ asas de cima (pedido do Diego), mascote inteira (chave mariposa), manto verde/branco no banco.
   ✔️ 09/08: sócio agora BATIZA O PRÓPRIO ESTÁDIO na área do estádio (✏️ no
   título → formzinho ABAIXO do StadiumSvg; RPC esc_socio_estadio_nome valida
   sócio ativo — batismo entra junto pois é sócio). Vazio = volta ao padrão.
   Aparece no clube + capa do jornal. Diego segue podendo trocar pelo painel.
   ✔️ 09/08: KIT completo do La Bestia Negra aprovado e no ar — escudo artesanal
   (LOGOS_PRONTAS em escudos.tsx: azul cruzeirense + raposa + estrela creme),
   mascote 'raposa' (mascotes.tsx, cara igual à do escudo) e manto azul/creme
   (#0E3E86/#F4ECD6) + mascote_key no banco. Estádio dele ainda SEM nome — se o
   Elton quiser, Diego seta pelo painel.
   ✔️ batismo do Elton: "Lá Bestia Negra" no lugar do River Prato (SÉRIE D, a
   dos rivais) — DIVISION_TEAMS.D + CPU_MANAGERS + ponte OLD_NAME pros saves.
   ✔️ 09/08 (tarde): LOJA DE TELA ÚNICA no ar (mockup v3 aprovado, "e publique"):
   o modal APOIE virou acordeão — 4 pacotes (Sócio/Craque/Lenda/Batismo), um
   amplia por vez com TUDO dentro (simulação da cor c/ nome real, botões do
   Manual, overall Djalminha ⭐ 83–88 no Craque e Romário 👑 93–99 no Lenda,
   grupo VIP, Carreira Online em preto+ouro, tabela do batizado + fundador).
   Botão do Craque em prata, do Lenda em ouro. Escolheu → tela 'pay' (Pix +
   comprovante + voltar). Telas 'cores' e 'dream' REMOVIDAS (rotas do Manual e
   ?apoie=lenda apontam pro novo fluxo). PENDENTE: Diego mandar os 4 links de
   pagamento avulso do MP (Craque 19,90 · Lenda 39,90 · Batismo 59,90 · Batismo
   Série D 69,90) → aí entra o botão 💳 "Pagar no cartão" na tela 'pay' e no
   batismo. Sócio no cartão já funciona (links de assinatura corrigidos).
   ✔️ 09/08: telas INTERNAS (cores/manual/dream/batismo) corrigidas pro mundo novo:
   Promessa 💎 fora da vitrine (roxo agora é cor do Sócio; quem tinha, mantém),
   FUNDADOR só via batismo (saiu do Lenda; contador de vagas foi pro dream),
   sem "pra sempre" no batismo, preços 59,90 (A/B/C/Várzea) e 69,90 (Série D)
   explicados, Sócio incluso citado no dream/batismo.
   (⚠️ 09/08: Diego trocou — os links antigos 32tTjqE/1BiaXQ6/2xzZmiC estavam ERRADOS, era por isso que o botão "Pagar assinatura" ficava cinza)
   ⚠️ NUNCA usar 4,99/2,99 em arte/código — é 4,90/2,90. Artes de referência
   (m1/m2/olheiro-porta/portas-ex) já corrigidas; m1 também ganhou a
   caixinha FINAL (manto, escudo, mascote+festão, batizar estádio, roxa,
   voto, 30 moedas, carteirinha/mural — sem olheiro, sem cobertura).
   FALTA SÓ: link avulso do ⭐ Craque R$ 19,90 (pra trava do Manual).
   ✍️ ESTILO DE TEXTO DA LOJA — LEI DO DIEGO (calibrada em 3 rodadas,
   09/08): v9 "escrevendo demais" → v10 bullets secos "resumiu demais" →
   ✅ v11 É O PONTO: cada benefício = TÍTULO FORTE em negrito (5-6
   palavras) + UMA linha de tempero em cinza menor (a frase que dá água
   na boca), mini-amostra visual na linha (chip do overall), letras
   miúdas viram chips. APLICAR esse formato em TODA a loja final
   (m1/m3 idem quando virarem código).
   v12 (5 ajustes do Diego, 09/08): chip "⭐→👑 depois vira Lenda por +20"
   TAMBÉM no card do Craque · bullet "Por que a Série D custa mais?"
   (série dos RIVAIS, todo mundo começa lá) · SEM "pra sempre" no nome do
   batismo · bullet do sócio incluso sem o "mesmo se perder o nome" (a
   regra do barão embaixo já explica, não repetir) · linha da Carreira
   Online/Ligas Fechadas na Lenda com DESTAQUE (caixa dourada).
   v13 (Diego, 09/08): chip do upgrade "+R$20" fica SÓ na Lenda (saiu do
   Craque — "já tem no craque falando isso" → decisão final: como estava) ·
   preço do batismo explicado NA LISTAGEM, curto: "Série A·B·C e Várzea —
   59,90 · times de todas as divisões do modo carreira" e "Série D — 69,90
   · os rivais escolhidos pra te enfrentar" (bullet longo do porquê saiu;
   header do card virou só "uma vez"). ⚠️ NOVO: batismo agora inclui
   VÁRZEA na faixa de 59,90.
   v14 (Diego reafirmou 09/08): overall NUNCA no leilão — SÓ no elenco da
   pessoa, APÓS contratação, e SÓ no modo carreira. Regra já era lei; agora
   os cards DIZEM isso na cara ("no leilão segue todo mundo às cegas — a
   emoção não muda"), pra ninguém comprar esperando ver overall no pregão.
   ⚠️ NA IMPLEMENTAÇÃO: overall aparece apenas em ElencoField/carreira,
   jamais em YourPitch/leilão/monte/online.
   💛 HISTÓRIA DO DIEGO NA LOJA (pedido dele 09/08: "mais aparente"):
   reescrita e virou CARD de destaque preto-e-ouro (historia.png):
   "Quem faz isso aqui 🔴⚫" — vende carro de dia com o pai, faz o jogo de
   madrugada sozinho; filho com condição rara (120 casos no mundo), o jogo
   existe por ele; apoio = vida melhor pro filho + jogo 100% grátis;
   "apoio nenhum dá vantagem em campo"; assinatura "🖋️ Diego · fundador
   nº 1" + barra "sócios seguram o servidor" INTEGRADA no card. POSIÇÃO:
   logo abaixo do card do Sócio, antes do Craque. Aguardando OK.
   v2 da história (09/08): ❌ BARRA "sócios seguram o servidor" CORTADA
   (recomendação aceita: número baixo público anuncia fraqueza + tom
   pedinte; prova social volta só quando houver número bonito) · ❌ "100%
   grátis com tudo liberado" REMOVIDO (Diego: "não está mais") → virou
   "este jogo vivo, crescendo toda semana". ⚠️ Checar o paywall AO VIVO:
   o texto atual da tela principal também promete "100% grátis pra sempre,
   com tudo liberado" (screens.tsx ~linha 238 e 367) — corrigir junto com
   a loja nova pra não prometer o que não é.
   🕵️→🎨 PEDIDO DO DIEGO (09/08, madrugada): nos cards de Craque/Lenda o
   olheiro tem que DIZER "overall do jogador" e MOSTRAR mini-amostra visual
   (chip colorido tipo "Djalminha 82–91") — feito na v9 do m2 (Craque:
   Djalminha 82–91 + Zagallo "?" com nota "lendas só com 👑"; Lenda: tudo
   revelado). E a ÁREA DO SÓCIO (m3) foi reformada pra caixinha final:
   carteirinha roxa + votação + "mimos à mão" (escudo/mascote/manto, pede
   ali) + batizar estádio + 30 moedas + mural. Saíram do m3: cobertura
   (virou obra), olheiros (viraram dos tiers), manual.
   ⚖️ PREÇO DO BATISMO RESOLVIDO — REGRA FINAL (09/08, ajustada pelo senso
   de justiça do Diego): 🖋️ BATISMO INCLUI O SÓCIO LEGENDS, e o incluso é
   DE QUEM PAGOU o batismo — NÃO do nome. Perdeu o nome no leilão dos
   barões (não cobriu)? Perde SÓ a placa; ouro/VIP/olheiros/clube de sócio
   continuam com a conta que pagou ("eu acho que seria justo quando ele
   perder o nome continuar com sócio pelo menos" — Diego). O novo barão
   também pagou → também tem o dele. Vetos anteriores mantidos: sem meio-
   termo de meses, sem 3,90, sem a palavra "pra sempre" na comunicação.
   Lenda segue 2,99; preços intactos (9,90/4,99/2,99). Escadinha final:
   grátis→9,90 · craque→4,99 · lenda→2,99 · batismo→INCLUSO (da conta).
   Planos MP necessários: 4,99 e 2,99 + link avulso Craque 19,90.
   🖋️ FUNDADOR MUDOU DE CASA (decisão do Diego 09/08): a partir de agora o
   selo FUNDADOR (numerado até o 100) vem do BATISMO, não mais da Lenda.
   Lenda vira 39,90 SECO (sem "→49,90", escadinha de fundador saiu do card).
   Quem JÁ é fundador por Lenda (nº 1-35) CONTINUA — "nº gravado é nº
   gravado", não remover ninguém. Arte loja-m2 v7 atualizada e enviada
   (Lenda sem caixa de fundador; Batismo com "agora é o batismo que faz
   FUNDADOR" + chip "SÓCIO INCLUSO — é da conta").
   + v8 (pedido do Diego 09/08): card da Lenda ganhou de volta a caixa "🔜
   já garante o que vem chegando: a nova Carreira Online e as Ligas
   Fechadas SEM BOTS — só entre amigos" (promessa que já existe no paywall
   ao vivo hoje; não esquecer na loja final).
3. 🪪 CARTEIRINHAS no jogo (área do apoiador + perfil) — visual APROVADO
   (carteirinhas.png), compartilháveis via motor do shareElenco.
4. 🏟️ NOME DO ESTÁDIO (campo aprovado por Diego no admin; aparece na área do
   clube ABAIXO do StadiumSvg + manchetes do jornal).
5. 🐊 MASCOTE: MASCOTES_PRONTAS (símbolo por conta, tipo LOGOS_PRONTAS) +
   FESTÃO do título aprovado (GIF): overlay ~4s pós-apito, só o campeão vê,
   60fps, toque pula; mora na área do clube na carreira.
6. 🗳️ VOTAÇÃO de categoria (ORIENTA — default recomendado, Diego não vetou)
   + 🧱 MURAL dos sócios (com selos e tempo de casa).
7. 🏪 LOJA NOVA (artes v6 aprovadas em série) — TRAVADA esperando Diego criar
   os planos/links no Mercado Pago (9,90/4,99/2,99 + link Craque 19,90 pra
   trava do Manual).
8. 🩹 PATCH QUASE-NOMES estilo PES (toggle por pagante no admin) — depois da
   infra (2).
SEM VEREDITO (não fazer): capa de campeão · camisa aposentada · batizar
torcida/clássico · bots com nomes batizados no online.
JÁ NO AR: manto beta (conta do Diego) · campinhos de todos no rápido online ·
retrátil como obra do estádio.

## 🆕 Banner verde removido + home com novidades atualizada (08/08, pedido do Diego) ✅ NO AR
Diego: "remove esse banner verde q atualizou do jogo toda hora" (culpado: com o
volume de deploys do dia, o `VersionWatcher` — `index.tsx` — avisava sem parar)
+ "atualize a home c várias novidades... banner de cima que fala de hall
troféus... e o banner novo da novidade do modo online de duplas".
- **Banner verde removido**: `VersionWatcher` não mostra mais o toast "O jogo
  atualizou". O auto-reload SILENCIOSO continua (só na tela inicial/home,
  no máx. 1x/5min) — ninguém fica preso numa versão velha, só não avisa mais.
- **Banner de cima** (`NewsBanner`, dispensável, em cima do menu): trocado o
  `NEWS_ID` (→ `2026-08-duplas`) pra reaparecer pra todo mundo, com Duplas
  (beta), Patrocínio-aposta, Contratos em massa e o Hall da Fama que já tinha.
- **Seção de baixo** (`NewsSection`, embaixo do botão de tema noturno): 3
  itens novos no topo da lista "📢 Últimas novidades" — Duplas, Patrocínio-
  aposta, Contratos em massa.
- Revertível com `git revert 89c442b`.

## 💛 LOJA — MOCKUPS VISUAIS ENVIADOS (08/08 à noite) — aguardando OK do Diego
4 artes na identidade do jogo (scratchpad da sessão: loja-m1..m4.png):
1. loja-m1 — vitrine: card SÓCIO LEGENDS 9,90/mês + preço de fidelidade
   (Craque 4,99 · Lenda/Batismo 2,99) + 8 benefícios + barra "sócios seguram
   o servidor" (meta do mês).
2. loja-m2 — vitalícios: Craque 19,90 · Lenda 39,90 (fundador até nº100 →
   49,90) · BATISMO "leilão dos barões" A/B/C 59,90 · D 69,90.
3. loja-m3 — área do sócio: carteirinha tempo de casa, votação com % ao vivo,
   cobertura retrátil (ABAIXO do StadiumSvg sagrado), escudo à mão (barra
   3 meses), mural dos sócios (cada nome na cor do próprio tier).
4. loja-m4 — onde o nome batizado aparece: tabela Série D (fundinho dourado
   + 🖋️) + jornal + PROPOSTA NOVA mostrada: times dos barões entram no
   sorteio dos BOTS (sala online + modo rápido) — precisa de OK explícito.
DECISÕES NOVAS DO DIEGO (08/08 à noite):
- Manter o desenho DELE (preços/fidelidade como estavam). SEM 1º mês grátis.
- ⚠️ NUNCA usar "pra sempre" na comunicação do BATISMO: batismo é LEILÃO DOS
  BARÕES — se alguém oferecer mais e o dono atual não cobrir/igualar, o nome
  do time MUDA de dono. (Craque/Lenda vitalícios seguem permanentes.)
- Ele pediu mockup completo incluindo COMO O NOME aparece "na sala online,
  carreira e todos os modos" → por isso a proposta dos bots batizados no m4.
DECISÕES NOVAS DO DIEGO (rodada v2 dos mockups, mesma noite):
- 💜 ROXO É A COR DO SÓCIO (mensal). Língua de cores: dourado = Lenda E
  Batismo · prata = Craque · roxo = sócio · bege = grátis. (No banco o único
  tier roxo era conta de teste pessoa@email.com — cor livre, sem conflito.)
- 🖋️ BATISMO GANHA TUDO DA LENDA incluso (ouro/qualquer cor com brilho,
  selo, grupo VIP) — escrito no card do batismo.
- 🛡️ ESCUDO À MÃO já no 1º MÊS de sócio (era 3 meses — ele cortou a espera).
- Lenda+sócio ao mesmo tempo: PROPOSTA enviada (cor mais alta manda — ouro
  continua em todo canto — e o sócio vira selinho 🎫 ao lado do nome; sócio
  puro fica roxo). Aguardando OK dele nessa regra.
- 🎮 MANUAL: ⚖️ DECIDIDO PELO DIEGO (08/08) — Manual FORA do sócio de vez
  ("N pode ter botão de manual pra sócio não em três meses... Só se ele
  pagar msm o craque tb"). Manual = EXCLUSIVO do ⭐ Craque 19,90. A trava do
  Manual fica com UM botão só (Craque). O card do Craque na loja vende isso:
  "Manual seu pra sempre — SÓ o Craque tem, nem o sócio destrava". A ideia
  do 3º mês foi descartada. Artes v5 atualizadas (m1 sem linha de Manual,
  m2 e portas-ex reforçando a exclusividade).
- 📐 ORDEM DOS BENEFÍCIOS no card do sócio (pedido dele, v4): 1º olheiros/
  overall · 2º escudo à mão · 3º cor roxa no nome · 4º carteirinha · depois
  o resto (votação, cobertura, moedas, manual 3º mês, mural).
- 🛡️ ESCUDO ganhou EXEMPLO DE IMPACTO próprio (igual o do overall):
  scratchpad/escudo-ex.png — antes (automático) → Alfacehh FC à mão
  (reaproveita os símbolos #alfacehh/#alfacehhMini do mock-alface de outra
  entrega), + como fica na tabela e no placar com versão mini.
- 🚪 REGRA ANTI-CANSAÇO das portas de venda (Diego temeu "muito botão de
  apoie" e cansar quem já pagou; arte portas-ex.png enviada): (1) todo botão
  é atalho pra MESMA loja, não existem lojas separadas; (2) botão/cadeado SÓ
  aparece pra quem NÃO tem aquilo. Craque nunca mais vê o cadeado do Manual;
  sócio não vê botão nenhum. Cobertura = item com cadeado na estrutura
  (abaixo do estádio), SEM botão "apoie" solto.
- 🕵️→🎫 PORTA DO OLHEIRO — REFINO DO DIEGO (decidido): o botão de sócio nos
  olheiros aparece pra TODO não-sócio, de QUALQUER categoria (grátis, craque,
  lenda, batismo). Ao tocar, a pessoa VÊ a diferença: R$ 9,90 RISCADO + "você
  paga 4,99/2,99" + a escadinha completa com a linha DELA marcada (VOCÊ) — de
  propósito, pra ela ver o que os outros pagam e sentir o desconto do tier.
  Arte: scratchpad/olheiro-porta.png.
- 🕵️ OLHEIROS POR ESCADINHA DE TIER — IDEIA DO DIEGO aplicada na v6 (raciocínio
  dele: "sócio torcedor não tem a ver com olheiros" — sócio é torcida, olheiro
  é estrutura/status; bate com o funil, status vende). Distribuição:
  🆓 grátis = nada · 🎫 sócio = olheiro de BASE (💎 promessas + 🪵 ex-
  profissionais) · ⭐ Craque = de craque pra baixo (tudo menos lendas) ·
  👑 Lenda = TODOS · 🖋️ Batismo = todos (tudo da Lenda, SEM escudo — Diego
  devolveu o escudo à mão pro SÓCIO). Elenco misto (parte colorida, parte
  "?") vira vitrine: quem vê metade quer o resto → upsell natural
  Craque→Lenda. Sócio pra Lenda fica como clube de torcida (votação,
  cobertura, moedas, escudo, mural, 2,99 simbólico). AGUARDANDO o "fecha"
  final do Diego nessa distribuição.
- ❌ CARDÁPIO DE IDEIAS DESCARTADO PELO DIEGO ("N gostei nda disso"):
  placas, aniversário, batizar folclórico, bônus de fichas, recado do
  presidente, faixa da torcida, conselho mensal, pacote coração (manto/
  carteirinha-coração/escudo-com-alma) e o modelo "comunidade fornece o
  patch". NÃO reapresentar.
- ✅ O QUE ELE QUER (decidido 08/08): além dos itens fixos da caixinha, DOIS
  mimos de ENTREGA MANUAL pelo admin (modelo igual cor/tier de hoje), por
  e-mail do pagante: (1) 🩹 toggle NOMES REAIS — patch de exibição na
  carreira (tabela/jornal/placar; de-para preenchido 1x pelo Diego numa
  tabelinha editável no admin; chave interna intocada; batizado imune);
  (2) 🥁 CANTO DA TORCIDA — Diego sobe MP3s (1x, Supabase Storage) e escolhe
  qual toca pra cada pagante na temporada da carreira (mudo com memória;
  rugido nunca antes do gol na tela). Aviso legal dado 1x (marca/direitos:
  entrega manual não muda o risco); decisão dele, seguimos.
- ⚖️ QUADRO LEGAL EXPLICADO AO DIEGO (08/08, pergunta direta dele): nomes
  reais = marca registrada, precisa licença (por isso Cartola paga e
  Brasfoot nunca embutiu); canto real = pior ainda (música + gravação,
  ECAD). Risco prático: pequeno hoje, cresce com o sucesso → notificação
  pra remover. Alternativa 0-risco com 90% do efeito: QUASE-NOMES estilo
  PES ("Rubro-Negro Carioca") + som de arquibancada genérico. A TOMADA
  técnica é idêntica nos dois cenários; conteúdo = escolha/risco dele.
- 💡 REENQUADRAMENTO PROPOSTO (08/08, após "tô mt na dúvida... N sei se tá
  tendo vantagem" — o esvaziamento era real): nomes+som viram A COROA do
  sócio, EXCLUSIVOS do sócio (nunca avulsos, nunca de brinde em tier) — é o
  único benefício desejado igual por grátis/craque/lenda, sustenta 9,90/
  4,99/2,99 pros três. Retenção embutida: cancelou → nomes voltam a ser
  fictícios e estádio fica MUDO. Caixinha final enxuta: nomes reais + som
  do estádio + voto + 30 moedas/cobertura + escudo à mão + carteirinha/
  mural/cor roxa. AGUARDANDO O "FECHA" → aí arte final da loja completa.
- 🥁 IDEIA 8 (do Diego): TORCIDA SONORA na simulação da carreira — loop de
  arquibancada, volume cresce com o estádio da SAF, rugido junto com o
  carimbo do gol (NUNCA antes — lei do spoiler), só gol do próprio time,
  botão de mudo com memória. Só pra sócio. REFINO DO DIEGO: ele quer SUBIR
  os MP3 ele mesmo (canto real por clube do coração, ex. Flamengo) pelo
  painel admin → Supabase Storage, um arquivo por clube; sem arquivo → som
  genérico. ⚠️ Avisado 1x do risco autoral de cantos reais (paródias de
  músicas protegidas + venda de assinatura); decisão é dele. Alternativa
  segura sugerida (e MUITO a cara do jogo): a COMUNIDADE grava os próprios
  cantos (grupo VIP), Diego aprova e sobe — mesmo esquema técnico, zero
  risco, zoeira máxima. Aguardando decisão.
- 🩹 IDEIA 10 (do Diego): PATCH DE NOMES REAIS (estilo Brasfoot) como
  benefício de sócio. ⚖️ Modelo legal do Brasfoot: o jogo vende o SUPORTE a
  patch (importar arquivo de apelidos), a COMUNIDADE cria/compartilha o
  arquivo com nomes reais — o jogo nunca embute marca registrada. 🔧 Lei
  técnica: patch é APELIDO DE EXIBIÇÃO apenas (tabela/jornal/placar/ficha);
  a chave interna do time NUNCA muda (lição van der Sar — senão quebra
  cpuSquads/valores/histórico). Liga/desliga sem efeito no save. 🖋️ REGRA
  SAGRADA: patch jamais renomeia time BATIZADO (barão pagou pelo nome). Só
  carreira solo (online precisa de nomes iguais pra todos). Esforço médio.
  Aguardando decisão.
- ❤️ IDEIA 9 (do Diego): PACOTE CORAÇÃO — usuário torce por um clube REAL
  (ex.: Flamengo) e o jogo usa isso SEM nome/escudo oficial (marca
  registrada; cores e padrões são livres): (a) MANTO DO CORAÇÃO — o time
  dele (ex.: Bagres FC) veste as cores/listras do clube do coração no
  campinho/ficha (⚠️ nome do usuário SEGUE na cor do tier, intocável);
  (b) carteirinha/mural com "❤️ torço pro X" (texto declarado pelo próprio
  usuário) + coraçãozinho nas cores; (c) escudo à mão nasce "com alma" do
  coração; (d) tempero no estilo da torcida sonora. Manto = o mais
  trabalhoso (mexe no campinho, mockup antes). Aguardando decisão.
PERGUNTA ABERTA (segue sem resposta): voto dos sócios DECIDE ou só orienta?
Depois do OK: ordem combinada = loja nova → trava do Manual 2 botões →
olheiros (só elenco) → votação/área do sócio → cobertura retrátil (mockup
antes, StadiumSvg intocável) → carteirinha/mural. Diego cria os 3 planos no
Mercado Pago e manda os links; validade 30d do sócio entra no admin.

## 💛 (histórico) LOJA — SPEC COMPLETA ENVIADA (08/08) — texto antes das artes
Spec final em texto (antes do mockup, como ele pediu). Decisões DELE já dentro:
- Preços: Sócio 9,90/mês (Craque 4,99 · Lenda/Batismo 2,99) · Craque 19,90 ·
  Lenda 39,90→49,90 pós-fundador nº100 · Batismo D 69,90 / ABC 59,90 ·
  upgrade Craque→Lenda por R$20 · vale-presente (código estilo fichas).
- Caixinha do sócio: votação de categoria das cartas novas (enquete estilo IG,
  % ao vivo, Diego escolhe a urna) · 3 olheiros · cobertura retrátil
  (+10/temporada enquanto sócio; cancela → fecha) · 30 moedas/mês · manual ·
  carteirinha tempo de casa · escudo a dedo após 3 meses · mural dos sócios.
  SEM carta do mês (cortada por ele) e SEM copa anunciada.
- 🕵️ OLHEIRO — REGRAS DO DIEGO (08/08): aparece SÓ NO ELENCO do usuário
  (⚠️ NÃO no leilão — decisão dele, e concordo: leilão às cegas é a alma/anti-
  spoiler + ranking). Mostra SÓ o overall "de tanto a tanto" com o FUNDO na cor
  da categoria (dourado lenda · prata craque · roxo promessa · verde bom · bege
  foi-profissional). NUNCA a palavra escrita. Exemplo: Zagallo 92–97 fundo
  dourado (scratchpad/olheiro-ex.png). Sem olheiro = como hoje. NUNCA online.
  Ideia guardada (não fazer agora): olheiro no MONTE como meio-termo futuro.
- Pagamento: 3 planos no MP (cartão) + recarga Pix 30d; entrega pelo painel
  (já no ar) + validade de 30 dias a construir.
PERGUNTA ABERTA: o voto dos sócios DECIDE a categoria ou só orienta?
⚖️→🎨 DECISÃO DO DIEGO (09/08): NADA de nome real ("Flamengo") nem canto
real — ele acatou o quadro legal. Cardápio REABERTO a pedido dele (a nota
"não reapresentar" caiu — ele pediu "fale todas aqui novamente"). Lista
completa reenviada com as versões LEGAIS destacadas: quase-nomes estilo PES
+ som de estádio genérico + manto do coração (cores são livres) — mesmas
tomadas técnicas, zero risco. Escudo à mão explicado de novo (desenho manual
do Diego via LOGOS_PRONTAS/admin; aparece no elenco, tabela, placar,
carteirinha, mural; 1º mês). Seleção recomendada pra caixinha: fixos +
quase-nomes + som genérico + manto do coração + placas do campinho +
aniversário do sócio; resto vira novidade mês a mês. AGUARDANDO ele escolher.
AMOSTRAS ENVIADAS (09/08): 🔊 torcida-demo.wav (28s sintetizado: murmúrio +
bateria 104bpm + apito + rugido de GOL aos 15s + olé; gerado 100% em código,
zero direito autoral — é a vibe, produção final pode usar loops CC0 melhores)
+ 🎽 manto-ex.png (antes/depois da camisa, campinho com o Bagres FC de manto
rubro-negro, 6 opções de cores, regra "cancelou → manto volta pro genérico").
CORREÇÃO DO DIEGO (09/08): "hoje não tem camisa, é balãozinho/fichinha com o
nome" — verdade (ElencoField usa chips brancos pos+nome). Arte refeita no
visual REAL (manto-real.png): fichinha branca FICA (nome legível), o coração
entra como FAIXINHA LISTRADA no topo de cada chip + placa do time nas cores.
Mudança mínima. A camisa da arte anterior era só conceito.
✅ ENTREGUE NA MAIN (09/08): Diego aprovou a faixinha ("Gostei assim!") →
- 🎽 MANTO NO AR (commit 88496b9, beta SÓ diego.c.fonseca@gmail.com):
  src/escalacao/manto.ts (MANTO_CONTAS email→cores, meuManto() via
  loggedEmail); faixinha nas fichinhas do Campinho (rápido) e do ElencoField
  (carreira) + barrinha de título listrada. Vermelho/preto na conta dele.
  Pra liberar mais gente: adicionar e-mail no MANTO_CONTAS (depois migra
  pro admin).
- 🌐 CAMPINHOS DE TODOS NO RÁPIDO ONLINE (commit ffbd922): na temporada do
  rápido online, abaixo do seu campinho entram os de TODOS os times da sala
  (👤 humanos e 🤖 bots), um embaixo do outro, com o nome do time na
  barrinha. Offline/carreira intocados. Sem spoiler (elencos já públicos).
- ❌ ÁUDIO SINTETIZADO REPROVADO ("ficou ruim") — torcida sonora parada;
  se voltar, caminho é gravação CC0 real de multidão (não sintetizar).
  Obs.: já existe um startCrowd() tocando na temporada hoje (sound.ts).
🔥 AÇÃO IMEDIATA COMBINADA (09/08 00h, print do admin: 8 toques na trava do
Manual em 1h, Akatsuki FC apertou "quero o Craque"): assim que o Diego criar
e mandar o LINK DE PAGAMENTO do Mercado Pago do Craque (R$ 19,90 — app MP:
Cobrar → Link de pagamento), trocar a trava do Manual de Pix+DM pra abrir o
link direto (cartão/Pix em 3 toques) + aviso "libera em minutos" (entrega
pelo painel já no ar). Commit isolado e revertível. Fase 2 futura: webhook
do MP → entrega automática. AGUARDANDO O LINK DELE.
🏟️ RETRÁTIL ENTREGUE NA MAIN (commit 24532da, decisão do Diego 09/08: "não
tem a ver com sócio-torcedor → põe nos desbloqueios, mantém padrão de
valores"): Cobertura Retrátil agora é OBRA da árvore do estádio — 180 🪙,
+10/temporada, exige a ☂️ Cobertura comum. SAIU DO SÓCIO de vez. Mesmo gate
do Dep. Médico (só carreiras novas com agenciaOn veem/exigem — save antigo
intocado, incl. régua da SAF nos DOIS pontos do reducer + renda de craque da
agência com grandfather). StadiumSvg NÃO mudou (sagrado). Reversível: 1
commit isolado.
⚖️ MARTELOS DO DIEGO (09/08): (1) OLHEIROS: sócio NÃO vê nenhuma categoria;
escadinha final = ⭐ Craque vê de craque pra baixo · 👑 Lenda e 🖋️ Batismo
veem TUDO · grátis nada. DECIDIDO. (2) SOM DE ESTÁDIO: fora do sócio DE VEZ.
(3) Ele quer ENGORDAR o sócio com coisas "que funcionem" estilo escudo
("que a pessoa queira ser sócio e não faça por caridade"). 5 propostas
enviadas: nome do próprio estádio (aprovado por ele à mão, sai no jornal;
abaixo do StadiumSvg) · gramado à escolha (skins do campinho: noturno/chuva/
várzea/premium — turfColors já existe) · fichas de carreira em dobro +
backup na nuvem (dor real) · martelo do sócio (som/estampa própria SÓ pra
quem ganha — lei do som pessoal) · pacote de cantadas prontas no chat.
Recomendação: as 3 primeiras. AGUARDANDO a escolha dele.
→ RESPOSTA DO DIEGO (09/08): 🏟️ NOME DO ESTÁDIO ENTROU no sócio ✅; gramado,
carreiras/nuvem, martelo e cantadas REJEITADOS ("quero mais interessantes" —
não reapresentar). Padrão do que ele aprova: feito à mão/patrimônio do clube
(escudo, manto, nome do estádio). NOVAS 4 propostas nessa família enviadas:
🐊 mascote do clube desenhada à mão (irmã do escudo) · 🗞️ capa de jornal de
CAMPEÃO compartilhável (motor do shareElenco já existe) · 🐐 camisa
aposentada/ídolo eterno no museu do clube (gols já são contados) · 🧣 batizar
a torcida organizada + o clássico (careerRivals já existe; manchetes usam).
AGUARDANDO escolha.
→ Diego perguntou como seria a MASCOTE ("apareceria aonde? dançando fazendo
o quê?"). Mockup enviado (scratchpad/mascote-ex.png, alface brava de corpo
inteiro): (1) mora na ÁREA DO CLUBE ao lado do escudo, abaixo do StadiumSvg,
com balancinho leve (sem dança maluca — 2 poses 2D); (2) na FESTA DE
CAMPEÃO de qualquer modo, pose levantando a taça no confete, SÓ pós-apito
(zero spoiler), só o dono vê a sua; (3) sairia na capa de campeão se essa
entrar; (4) NUNCA no leilão. Feita à mão pelo Diego igual o escudo
(2 desenhos por mascote: parada + com taça). Aguardando o veredito dele.
→ Diego: "QUERO a animação quando ganha título!" e pediu mockup REAL no
rápido online. Enviado (scratchpad/mascote-festa.png), 2 quadros: (1) o
FESTÃO — overlay de ~4s POR CIMA da tela de fim de temporada, pós-apito:
fundo verde com raios dourados girados, chuva de confete, "🏆 CAMPEÃO!" +
nome do time, mascote GRANDE pulando com a taça; só o time campeão vê
(regra do som do martelo); toque pula. (2) DEPOIS: a mascote fica em cima
do quadro preto do "Fim da temporada" segurando a taça até a sala votar.
Mesma festa no rápido offline e na carreira. AGUARDANDO OK do visual pra
esse ser o comportamento oficial da mascote.
→ Diego achou o quadro estático "parecendo a carta que já se ganha" e pediu
INTERATIVO, "boneco solto na tela". Resposta: GIF ANIMADO enviado
(scratchpad/mascote-festa.gif, 36 frames gerados de mascote-anim.html com
?f=N + JS posicionando por frame): a mascote ATRAVESSA a tela real de fim
de temporada quicando POR CIMA da UI (tabela, botão de voto), com um pulão
no meio, sombra no chão, rotação de gingado, banner CAMPEÃO pulsando e
confete caindo em loop. Na implementação real: CSS/JS a 60fps, ~4s,
toque pula. AGUARDANDO veredito do GIF.
→ 🪪 CARTEIRINHAS — mockup enviado a pedido dele (scratchpad/
carteirinhas.png): (1) SÓCIO roxa — nome grande, nº de sócio, tempo de casa,
escudo à mão + chips do manto (❤️🖤) e do nome do estádio; tier pago leva o
selo sem perder o roxo; (2) FUNDADOR preta-e-ouro — PRA SEMPRE, independe de
assinatura: nº gravado (ex. 34) + carimbo redondo "dos 100 primeiros", faixa
dourada, nome do batismo, e chip-lembrete "sócio por R$ 2,99". As duas moram
na área do apoiador e são COMPARTILHÁVEIS como imagem (motor do shareElenco).
Resposta ao medo do ciúme Lenda/Batismo também dada: eles pagam 2,99 (o
menor preço), artesanal contínuo só existe com mensalidade, e a carteirinha
de fundador é presente de prestígio pra eles SEM assinar. AGUARDANDO OK.
→ ✅ APROVADO PELO DIEGO (09/08): "Gostei desse pra quem é sócio torcedor".
A MASCOTE ENTRA NO SÓCIO como benefício oficial: desenhada à mão pelo Diego
(entrega manual, tipo escudo), mora na área do clube (carreira) e faz o
FESTÃO ANIMADO do título em todos os modos (versão do GIF: solta na tela,
quicando por cima da UI, pulão, sombra, confete; 60fps, ~4s, toque pula;
só o time campeão vê; pós-apito). Pendentes ainda: capa de campeão, camisa
aposentada, batizar torcida/clássico, bots batizados, voto decide/orienta.
📌 STATUS FINAL DA RODADA (08/08, noite): Diego travou na dúvida olheiros-
no-sócio vs escadinha ("só sei que quero que venda MT"). RECOMENDAÇÃO FIRME
enviada: ESCADINHA por tier (4 produtos, 4 desejos: sócio=jogo do seu
jeito · craque=manual+prata+olheiros até ⭐ · lenda=ouro+VIP+olheiros
totais · batismo=tudo+nome na história; o "?" nas lendas do elenco do
Craque é o vendedor da Lenda). + Defaults propostos pros 2 martelos
finais: bots batizados=SIM (propaganda do batismo) · voto=ORIENTA
(segurança, lei nº1). AGUARDANDO "FECHA TUDO" → arte final da loja →
aprovação visual → código.

## 💛 (histórico) desenho anterior — desconto por fidelidade + caixinha v2
EVOLUÇÃO (ideia do PRÓPRIO Diego, ele gostou): mensal com a MESMA caixinha pra
todos e preço por fidelidade — grátis paga R$9,90/mês · ⭐ Craque R$4,99 ·
👑 Lenda/Batismo R$2,99. O vitalício vira "carteirinha de desconto" (fortalece
a venda da Lenda em vez de canibalizar). Vitalícios intocados.
CAIXINHA (recomendada, Diego vai cortar o que não quiser vendo a arte):
📀 Carta do Mês numerada/datada (dia 1, nunca reimpressa) · 🗳️ voto na próxima
lenda (dia 10) · 🏆 Copa dos Sócios (1ª sexta) · 🎮 Manual · 🕵️ 3 Olheiros ·
🪙 30 moedas/mês · 🪪 carteirinha com tempo de casa · 🛡️ personalizar o escudo
GERADO (cores/símbolo). Escudo ARTESANAL fica FORA do mensal (item avulso, não
escala e é permanente por natureza) — decisão explicada ao Diego.
Mensagem de custo aprovada pelo conceito: "sócios seguram o servidor" (barra
de meta na loja). História pessoal reformulada (rodapé escuro, mais clara).
Arte final: scratchpad/loja-final.png — AGUARDANDO cortes/OK do Diego.
Já no ar independente: entrega na hora no admin (seção Apoiadores).

## 💛 (histórico) menu de 3 modelos apresentado antes do desenho acima (08/08)
Diego não gostou do pacote "utilidades" (manual+olheiro+moeda = genérico) e
NÃO aprovou nada ainda (nem copa mensal, nem preços). Diagnóstico novo: o que
VENDE no jogo é STATUS/HISTÓRIA (cores, fundador numerado, batismo), não
ferramenta. Menu apresentado:
- MODELO 1 "Álbum Vivo": Carta do Mês numerada/datada (só sócios do mês; nunca
  reimpressa) — mesmo mecanismo do fundador, que comprovadamente vende.
- MODELO 2 "Clube de Sócios": voto mensal na próxima lenda do baralho,
  carteirinha com tempo de casa, mural de sócios.
- MODELO 3 "Temporada Premium" (utilidades) — só como tempero.
Recomendação: 1+2 com 3 de brinde, "SÓCIO LEGENDS" R$9,90/mês (1º mês trava
7,90 pra sempre), calendário mensal (dia 1 carta, dia 10 votação). Avulsos:
Kit do Mês R$4,90, Vale-presente (código estilo fichas). Descartados: patrono
de carta (vira anúncio), caixas/sorteio (cheiro de aposta), XP pago (fere a
lei nº1). Vitalícios intocados; Lenda ganha olheiros + carta do lançamento.
✅ JÁ NO AR independente disso: entrega na hora no admin (seção Apoiadores).
AGUARDANDO: Diego escolher modelo/misturar → aí mockup final.

## 💛 (histórico) proposta v1 enviada antes do menu acima (08/08)
Diego pediu análise a fundo da área de vendas ("MT gente abrindo os pacotes mas
não fechando") + plano mensal ~R$5,99 + olheiros por baralho + torneios/escudos
+ qual ferramenta de cobrança mensal. Mockup: `scratchpad/vendas-mock.png`.
NÚMEROS (30 dias, apoio_intents): 1.347 pessoas abriram a trava do Manual
(5.647 aberturas — ~4× por pessoa!); só ~101 copiaram o Pix de 19,90 e ~83
clicaram "quero". Funil vaza no CHECKOUT (Pix manual → DM comprovante → até
24h de espera), não no interesse.
PROPOSTA (nada implementado):
- Plano ⚽ SÓCIO TORCEDOR R$5,99/mês: Manual (enquanto assinar) + os 3
  Olheiros + 20 moedas/mês no Banco + Copa dos Sócios mensal. Vitalícios
  intocados; 👑 Lenda GANHA os 3 olheiros de presente (pra sempre).
- 🕵️ Olheiros (BR/Europa/Mundo): na carreira SOLO a carta mostra a cor da
  categoria antes do lance. REGRA SAGRADA: nunca no online/rápido.
- Trava do Manual com 2 saídas (5,99/mês ou 19,90 vitalício) + "libera em
  minutos" + garantia de 1ª semana.
- Cobrança mensal: recomendação Mercado Pago Assinaturas (link pronto, sem
  código); entrega via user_colors (sem deploy). Alternativas: Asaas/Efí
  (Pix Automático), Kiwify/Hotmart (mais taxa, zero trabalho).
DECISÕES DO DIEGO PENDENTES: preço final do Sócio; se o Craque também leva
Olheiro BR; aprovar o mockup; criar o plano no Mercado Pago.

## 🤝 DUPLA — NO AR (08/08) ✅ — ajustes da 1ª sala real de duplas
Diego testou com a galera e foram vários acertos no mesmo dia (todos na main,
cada um em commit próprio e revertível):
- **Vaga nasce ABERTA**; só o 🔒 cadeado fecha. "Me esperem" foi cortado ("é a
  mesma coisa que qualquer um"). Botão único põe/tira o cadeado.
- **Sem "jogar sozinho"** dentro da sala de duplas ("tem q ter dupla").
- **Trava do host = 2 duplas fechadas, só isso.** Quem sobrar sem parceiro NÃO
  segura a sala (com gente ímpar ela nunca abriria) — entra com o time dele.
- **Nome do time da dupla**: campo na sala de espera (qualquer um dos dois
  escreve); em branco vira `Neymarzetti|Alfacehh` — formato escolhido pelo Diego,
  sem espaços em volta do risco. Coluna nova `dupla_name` (aditiva).
- **Chat**: os dois dividem o MESMO técnico, então falavam com nome idêntico.
  Quem está em dupla passa a falar com o próprio nome.
- **Parceiro que CAI** (não sai pelo botão) travava o time pra sempre. Presença
  agora carrega o crachá; o host libera sozinho após 25s fora (25s de propósito:
  trocar de app derruba a conexão por segundos e perder o foco não pode liberar)
  + botão "Fulano caiu — assumir o time" no leilão e no monte.
- **Novo pregão**: os DOIS da dupla confirmam (antes o 1º clique decidia pelos
  dois) e a dupla CONTINUA junta, com a mesma divisão e o mesmo nome. ⚠️ Achado
  ao conferir: o redraft RENUMERA os técnicos, então as duplas tiveram que ser
  remapeadas — sem isso, se alguém saísse, a dupla caía no time de OUTRO.
- **Lista de salas**: selo roxo 🤝 DUPLAS + contagem em pessoas. (O flag também
  passou a vir na lista magra e a sala de espera pergunta direto ao banco — a
  falta disso foi o "não aparece o botão de duplas".)
- **✕ do host** num time de dupla deixava o parceiro pendurado sem time
  (família do "virei bot"): agora ele é solto antes e vira time próprio.
- ⏸️ **DECIDIDO ADIAR** (Diego, 08/08): time de dupla NÃO leva selo de tier
  (👑/⭐) — "deixe com os nomes deles mesmo por enquanto". Cada um continua vendo
  a própria cor na tela dele; o time fica neutro. Rever se ele pedir.

## 🤝 DUPLA — como nasceu (08/08) ✅
Diego mandou "Faz. O modo da dupla aí cara", viu o mockup
(`scratchpad/dupla-telas.png`) e aprovou ("Pode fazer. Publicar"). Feito ponta a
ponta **só no Rápido Online**, tudo atrás do toggle da sala.
- **Criar sala**: escolha nova "Quem comanda cada time" — 👤 Solo (de sempre) ou
  🤝 Duplas (beta). Grava `duplasMode` no `game_state` (padrão de `varzea`).
  Sala de duplas nasce com `max_players` dobrado (20 times = até 40 pessoas).
- **Formar**: lista da sala vira por TIME (1/2 · 2/2). "🌍 Chamar qualquer um" /
  "🔒 Esperar um amigo"; o outro TOCA na vaga e vira parceiro (sem aceite). Tem
  "Sair da dupla" e "Desistir de esperar". Iniciar TRAVA com vaga pendurada, com
  o porquê e o caminho embaixo do botão; mínimo = 1 dupla completa.
- **Dividir**: 6 categorias (Monte é categoria própria), 3 pra cada, primeiro
  que toca leva, dá pra soltar, e ao fechar 3 as outras caem pro parceiro. Host
  abriu antes? sorteia 3-e-3 com o RNG da partida (determinístico).
- **Leilão**: o pregão já anda setor a setor, então cada leva tem UM dono — só
  ele lacra; o parceiro vê as MESMAS cartas com o aviso de quem decide. Monte
  igual. Se um sair de verdade, o outro assume tudo (em vez de virar CPU).
- **Onde mora a regra**: `duplaPodeAgir` e `duplaToggleCat` em `types.ts` — UMA
  função só, usada pela tela E pelo host. Se fossem duas, poderiam discordar e é
  daí que vêm os bugs de assento.
- **Trava no HOST, não só na tela**: `SUBMIT_ENVELOPE`, `MONTE_PICK` e
  `MONTE_PASS` levam o crachá (`by`) e o reducer recusa quem não manda na
  categoria. ⚠️ Honestidade técnica: isso mata o caso REAL (corrida entre os dois
  aparelhos, tela defasada) — o modelo online do jogo nunca teve identidade
  assinada, então um cliente adulterado ainda poderia forjar o crachá, exatamente
  como já podia forjar um `mgrId` hoje. Não é regressão; é limite antigo.
- **Assento**: a linha do parceiro é CARONA (`dupla_partner_of`) e fica FORA da
  deduplicação/renumeração — senão viraria time fantasma. A renumeração passou a
  mirar `user_id` (com carona, `player_index` deixou de ser único).
- **Regressão**: `scratchpad/duplatest.mjs`, 40 checagens, incluindo a prova de
  que sala Solo lacra/pega monte exatamente como antes.
- **Falta (combinado, depois do OK)**: Duplas na Carreira online (lá cada técnico
  tem caixa e temporada própria — passo separado).

## 🤝 DUPLA — schema APLICADO no Supabase de verdade (08/08) ✅
O `supabase/dupla_schema.sql` (escrito no branch `claude/pontosafe-repo-setup-qzjo89`,
commit `437853d`) **já rodou no banco de produção** (projeto `faabglpjutwursgmrpny`,
o do Leilão Legends — é o que `src/lib/supabase.ts` usa; o `.env` aponta pra
OUTRO projeto que o jogo não usa, não confundir).
`public.room_players` ganhou 3 colunas opcionais, todas NULL:
`dupla_partner_of` (uuid → auth.users, on delete set null) · `dupla_categories`
(jsonb) · `dupla_seek` (text, check 'aberta'/'privada').
Conferido depois de aplicar: **1.232 linhas existentes, as 3 colunas 100% NULL**
— nenhuma sala/jogo mexido. Rodei o script 2× pra provar que é idempotente.
⚠️ Pro outro branch: a anotação de lá ("falta aplicar no Supabase") está VELHA.
Reverter (some tudo, zero rastro):
`alter table public.room_players drop column if exists dupla_partner_of, drop column if exists dupla_categories, drop column if exists dupla_seek;`
O código ainda NÃO lê essas colunas — próximo passo é reducer/telas.

## ⭐ Novo Craque (07/08): gabriel.alves.martins.2010@gmail.com ✅
Entrou em `FOUNDERS` (apoio.tsx) como `'prata'` → cor/selo ⭐ prata em TODO
canto do jogo + Modo Manual liberado. Craque NÃO ganha número de fundador
(isso é só do Lenda 👑), então nada mexeu em `FUNDADOR_N`.

## 🐛 LIVRO DE PREÇOS: preço compartilhado por NOME (relato de jogador, Neymar) ✅ NO AR
Jogador reportou: renovar o Neymar do Santos estava pedindo o preço do Neymar
do BARCELONA (vendido por 200+) — são cartas diferentes (nome igual, clube
diferente), mas o "livro de preços" (piso de mercado/renovação) só guardava
pelo NOME do jogador, então uma inflava a outra. Bug real, valia pra QUALQUER
jogador com 2+ cartas (clubes/anos diferentes) — bem comum no baralho.
Corrigido: a memória de preço agora é por CARTA (nome+clube, usando o `ident`
que o jogo já usa pra tudo mais), não só nome. Mesma correção aplicada no
bônus de artilheiro (tinha o mesmo problema escondido). Reversível com
`git revert fdcc41f`.

## 🐛 COPA DO MUNDO: pular a FINAL podia perder carta e troféu — CORRIGIDO ✅ NO AR
Relato de jogador (via Diego, 07/08): "pulei a final, ganhei, mas não veio
carta nem troféu". Conferido Liga, Copa Legends e Copa do Mundo — só a Copa do
Mundo tinha o problema. Causa: lá o "Pular" tem 2 estágios (1º toque só corta
a animação e mostra o placar da final; 2º avança pra "🎉 Cerimônia" de
verdade) — só DEPOIS desse 2º clique é que o prêmio/carta gravavam. Quem via
o placar da final (achando "já era, acabou") e não clicava de novo nunca
recebia nada — não tem mais nenhum jogo pra assistir depois da final, então
era fácil parar aí achando que tinha terminado.
Corrigido: prêmio e carta agora gravam assim que o placar da FINAL aparece na
tela, sem depender do clique extra da cerimônia. Visual não mudou em nada
(banner/estatísticas continuam iguais) — só a GRAVAÇÃO ficou mais cedo e
garantida. Reversível com `git revert 79af73c`.

## 🐛 BOTÃO "⏭️ PULAR" travado — CORRIGIDO (07/08, relato de jogador) ✅ NO AR
Jogador (craque/lenda, com Modo Manual) reportou que o Pular parou de
funcionar. Causa: era EU MESMO, mais cedo hoje — pra fechar o buraco do
patrocínio (Pular pulando a escolha da meta), botei uma trava no botão Pular
que na verdade é COMPARTILHADO por vários modos (carreira, rápido, Copa do
Mundo). Sem querer, isso fez o Pular esperar "a rodada acabar" pra liberar —
ou seja, perdeu a função dele (que é JUSTAMENTE pular a animação e ir direto
pro resultado, sem esperar nada). Como a trava do patrocínio já tinha sido
resolvida de outro jeito (um botão PRÓPRIO só na hora de escolher a meta, fora
desse componente), a trava no Pular ficou sobrando e não fazia mais falta —
tirei ela. Agora o Pular volta a ser IMEDIATO em todo lugar (carreira, rápido,
Copa do Mundo), e a trava do patrocínio continua funcionando (ela nunca
dependeu do Pular). Reversível com `git revert 8c2664c`.

## 🤝 Patrocínio: mais 2 ajustes (07/08) ✅ NO AR
- **Trava reforçada**: além da tela bloquear o botão "Começar a temporada" até
  escolher a meta, agora o PRÓPRIO reducer recusa avançar a rodada 0 sem a
  escolha — cinto de segurança extra (Diego relatou que "se demorar, começa
  sozinho"; não achamos o buraco exato mas essa trava cobre qualquer caminho).
- **Logos maiores** na tela de escolha das marcas (quase dobrou de tamanho).
- **Max Joias** (amigo do Diego) entrou no tier 1 (🛡️ Não cair de divisão), no
  lugar do "Paredão Materiais" fictício. Logo recortada (fundo preto virou
  transparente) pra combinar com o cartão. Aprovado pelo Diego.

## 🐛 SELO DE GOL NO 0×0 — CORRIGIDO (07/08, relato do Diego) ✅
Diego mandou print: jogo **0 × 0 aos 16'** com o selo "🔥 GOL NO FIM!" na tela,
e a frase **trocando sozinha em looping** ("passando todas as frases").
Eram DOIS defeitos no `LiveScoreCard` (pyramidseason.tsx):
- **(a) o selo ficava preso**: o `setTimeout` que apagava o selo vivia no
  *cleanup* do efeito. Quando a rodada virava, o React rodava o cleanup
  (matando o timer) e o efeito caía no `return` do rebase — ninguém apagava o
  selo, que atravessava pra rodada seguinte.
- **(b) a frase corria com o relógio**: `goalSeed = last?.min ?? min`. Sem gol,
  `last` é `null`, então a semente era o MINUTO CORRENTE → frase nova a cada
  tique.
Consertos: timer numa `ref` (o cleanup não o mata mais), rodada nova chama
`apaga()` explícito, frase **congelada** no minuto do gol (`goalSeedFix`) e uma
**trava final**: `temGolNaTela` — placar 0×0 na tela = nenhum selo e nenhum
flash, aconteça o que acontecer com o estado.
Regressão nova: `scratchpad/goltest.mjs` (reproduz o bug na versão antiga e
prova os 6 comportamentos certos na nova) + eventotest/copatest/dormtest 🟢.

## ✅ ENTREGUE 07/08 — Patrocínio virou APOSTA + correções da carreira (já na MAIN, ao vivo)
1. **Patrocínio reformulado pra sistema de APOSTA por temporada** (pedido do
   Diego, inspirado em jogos tipo Motorsport Manager): saiu o patrocínio fixo
   por divisão, entrou escolha no INÍCIO de cada temporada (banner logo após o
   leilão, antes do botão "Começar a temporada" — trava o botão até escolher).
   Três níveis de aposta, cada um com 3 marcas pra escolher (visual): 🛡️ Não
   cair de divisão · 📈 Acesso (top 4) · 👑 Campeão (liga OU copa, as duas não
   dobra). Pagamento por divisão (dobra a cada degrau): Várzea 1/2/3 · D 2/4/6
   · C 4/8/12 · B 8/16/24 · A 16/32/48 (moedas conforme o nível apostado).
   **Errou a meta = ZERO** (apostou seguro e foi além = só ganha o que apostou,
   "deu mole" — regra explícita do Diego). Aviso sutil disso no próprio banner.
   Logo do amigo dentista (ERO Odontologia) e do Vadico Veículos entram como
   marcas reais no tier 👑 Campeão. Caixa/extrato atualiza sozinho no fim da
   temporada junto com os outros prêmios (reaproveita o motor que já existia).
   Multiclube: cada clube tem sua própria aposta (não mistura). Story pra
   divulgar já entregue (scratchpad/story-patrocinio.html/png).
2. **Hack do "mesmo time" corrigido** — apertar "mesmo time" ao fim da
   temporada abria uma brecha que pulava a área de contratos sem o jogador
   decidir nada. Agora abre o MESMO banner de contratos de sempre (sem leilão
   depois) — o usuário decide (renovar/deixar ir) e só depois avança.
3. **Timer da tela de contratos**: offline (modo carreira solo) não tem mais
   tempo nenhum — decide na hora que quiser. Online continua com tempo, mas
   reduzido pra 1 minuto (era 45s).
4. **Caixa em tempo real**: confirmado que compra/venda/renovação no leilão já
   atualizavam o caixa na hora (motor `mirrorWallets` já fazia isso, achado
   ao investigar — nenhum bug aqui). Premiação de artilheiro/títulos/folha
   salarial continuam batendo só no fechamento da liga/copa, como já era.
5. **Bug dos eventos de zoeira (baladeira/pavio-curto/lesão) sempre na MESMA
   rodada todo ano** — corrigido. Causa: a semente do sorteio tava sendo
   embaralhada duas vezes com o mesmo número (cancelava e voltava a ser
   sempre igual). Também aumentei bastante a variedade de jogadores e de
   frases de cada evento, e o evento agora evita repetir o MESMO jogador do
   evento anterior (antes reclamavam que era sempre o Romário, por exemplo).
6. **Desconto da renovação de 10 anos**: tinha um arredondamento errado que às
   vezes cobrava o preço CHEIO em vez dos 90% combinados. Corrigido.

## 🐛 BUG DA TRAVA DO PATROCÍNIO consertado (07/08, relato do Diego) ✅
No Modo Manual tinha um botão "⏭️ Pular" que NÃO respeitava a trava de "precisa
escolher a meta do patrocínio antes de começar a temporada" — só o botão grande
"Começar a temporada" travava; o Pular avançava direto. Corrigido nos dois
lugares (screens.tsx: botão Pular agora fica cinza/desabilitado igual o
grande; pyramidseason.tsx: o clique também é bloqueado no código, não só
visual). Confirmado com o Diego como já estava certo: o prêmio da meta é
sempre calculado com base na temporada que ACABOU de terminar (a mesma em que
foi escolhida) e cai no caixa/extrato junto com os outros prêmios no fechamento
daquela temporada — não é preciso trocar nada aí, já funciona assim.
✅ MAIS UM PONTO (07/08, Diego: "não pode ter tempo nessa área de escolher
patrocínio no carreira offline"): achado outro buraco — no modo AUTO (sem
manual ligado) da carreira solo, a rodada 0 tinha um cronômetro ESCONDIDO de
9s (o mesmo tempo de qualquer rodada) que avançava sozinho mesmo sem escolher
a meta. Agora esse relógio também espera a escolha — carreira offline fica
sem tempo nenhum pra escolher o patrocínio, seja no manual ou no automático.
✅ MAIS UM PONTO (07/08, Diego: "escolheu o patrocínio já inicia a temporada
sozinho, tem que ter o botão de iniciar — pra quem tem Manual E pra quem não
tem"): a rodada 0→1 (começo da temporada) agora SEMPRE exige um clique
explícito no botão "▶️ Começar a temporada", pra TODO mundo — inclusive quem
não é craque/lenda (não tem Modo Manual) e antes ficava só no automático puro,
sem botão nenhum, e a temporada começava sozinha 9s depois de escolher.
A partir da 1ª rodada em diante nada mudou (quem não tem Manual continua 100%
automático como sempre foi — só o INÍCIO da temporada ganhou a trava).

## 🚀 Contratos: botões de ação em massa (07/08, pedido do Diego) ✅ NO AR
Quando vence contrato de vários jogadores de uma vez, agora tem 3 botões em
cima da lista (só aparecem com 2+ contratos vencendo): "🔟 Renovar TODOS 10
anos", "5️⃣ Renovar TODOS 5 anos", "😢 Deixar TODOS ir". Um clique aplica a
mesma decisão pra lista inteira de uma vez (multiclube: os dois clubes
juntos), sem precisar clicar jogador por jogador. Mockup enviado ANTES de
subir (mesmo visual dos botões individuais já aprovados); pushado já — se o
Diego não curtir a posição/texto, é reverter o commit 426713d.

## 🖥️ Campinho do Elenco com mais espaço (07/08, Diego: "tá muito apertado") ✅ NO AR
Celular ganhou um respiro pequeno (gap/padding um pouco maiores). No desktop
(onde sobrava tela vazia dos dois lados e as casinhas ficavam espremidas
mesmo assim) o ganho é bem maior: casinha maior e mais espaço entre elas —
só dentro do `@media (min-width: 1024px)` já usado no resto do "Modo
Desktop", então o celular não muda em nada além do respiro combinado. Mockup
antes/depois enviado e aprovado.

## 🆕 Bannerzinho de "o jogo atualizou" voltou (07/08, pedido do Diego) ✅ NO AR
Tinha sido tirado antes (aparecia toda hora nos dias de muito deploy). Diego
pediu de volta: banner pequeno no topo pra quem JÁ ESTÁ com o jogo aberto
quando sai versão nova, com botão "Atualizar" (recarrega na hora) e ✕ pra
fechar — uma vez fechado, some e NÃO volta nessa versão (só a PRÓXIMA versão
nova avisa de novo). ⚠️ Efeito colateral esperado nesta primeira leva: quem
já estava com o jogo aberto ANTES deste deploy não viu o banner aparecer,
porque o código rodando na aba dele ainda era o ANTIGO (o antigo tinha o
banner desligado) — só um F5 manual pega a versão nova. A partir de agora
(próximos deploys), o banner detecta e avisa normalmente.

## ✅ ENTREGUE 05/08 — 3 pedidos do Diego (já na MAIN, ao vivo)
1. **Escudos nos confrontos da Copa dos 8** — a lista "Todos os jogos da fase"
   (screens.tsx, `tieRow`) agora mostra o escudo (gerado do nome, o mesmo
   `<Escudo>` do placar grande) nos dois lados. A Copa do Mundo já tinha a
   bandeira do país (`nm()` prefixa FLAG), então lá não mexi.
2. **Expulso SAI da sala de verdade (online)** — o handler do evento `kick`
   (store.tsx) trocou o `alert()` (que o celular às vezes engolia → pessoa
   continuava assistindo) por: `KICKED_OUT` na hora + banner vermelho na tela
   ("VOCÊ FOI EXPULSO", estado `kickedOut`). Não fica mais de penetra.
3. **Patrocínio da Várzea = zoeira do lanche, SEM dinheiro** — `SPONSOR_PAY.V=0`
   (várzea não paga nada). Marcas REAIS de esquina: Guaravita, Trakinas, Fofura
   (estadiodata.ts). O cartão (estadio.tsx, `varzeaLanche`) mostra as 3 com o
   aviso "não pinga dinheiro, paga em lanche — suba pra Série D pra faturar".
   Régua nova de renda: D +5 · C +10 · B +15 · A +20 (antes era D0·C5·B10·A20).
   ⚠️ Diego aprovou TUDO sem pedir mockup ("ta td aprovado").

## ⏳ AINDA PENDENTE (combinado, ainda não feito)
- **Zoeira dos banners de evento (OCULTO nas cartas)**: ampliar as categorias
  escondidas que disparam os banners na simulação — 🍺 baladeiro (noitada),
  🟥 pavio curto (expulsão), 🤕 vidro (lesão) + novas (frangueiro, mercenário,
  guerreiro, maestro, matador…). NADA escrito na carta; só dispara evento.
  Analisar TODAS as cartas e classificar mais jogadores + banco de frases.
  (Regras em eventos.ts: baladeiro→noitada, pavio→expulsão, peso 4× cada.)
- **Copa dos 8 — visual mais bonito dos jogos simulados** (os que você NÃO tá):
  Diego achou "muito feio". Mockup em scratchpad/copa-bonita.html. Aguardando.
- **Modo Libertadores** — conceito agora tem doc próprio:
  **`docs/conceito-libertadores.md`** (16/08). Mockup refeito e mostrado ao
  Diego: ele gostou ("gostei bastante") mas **mandou NÃO fazer agora** — quer
  pensar no lado do negócio (as 12 vagas além das 20 mexem com o preço do
  batismo). O doc guarda o formato fechado, a regra de encher a tabela (humanos
  até 20 + clubes do jogo completando 32, igual à sala de leilão), a contagem
  real de batismos por divisão e as 4 decisões que faltam dele (nome — marca
  registrada —, cor, quem completa, e se mora no rápido ou também na carreira).


## ⚽ Batismo: Bicho da Seda (04/08)
Clube do **davisantana1312** (👑 Lenda, fundador nº 11) entrou no lugar do
**Red Bull Diet** na Série D. OLD_NAME atualizado ('Bicho da Seda': 'Red Bull
Diet') — save antigo carrega já com o nome novo. Escudo automático pelo nome.
👉 Com ele, são **12 clubes de batismo** na Série D.


## ⚽ Batismo novo + apoiadores (04/08)
· **Barcenite FC** (batismo do ricardopessoafreire / xRichard56, 👑 Lenda +
  fundador nº 31) entrou no lugar do **Milanesa FC** na Série D. OLD_NAME
  atualizado ('Barcenite FC': 'Milanesa FC'), então save antigo com Milanesa
  carrega já com o nome novo. Escudo automático: escudo vermelho-telha com faixa
  dourada e inicial B (o nome não tem palavra do dicionário).
· **victordudu.monte14@gmail.com** (Kings Fc) entrou como ⭐ **Craque** (prata).


## 👑 Novo Lenda (04/08): ricardopessoafreire@gmail.com
Entrou em FOUNDERS como 'ouro' + FUNDADOR **nº 31** (apoio.tsx). Ganha cor/selo
👑🖋️, Modo Manual, tudo do ouro e direito a batismo de clube (ainda não usou).
⚠️ Se o Diego NÃO quiser dar o selo de fundador a ele, é só tirar a linha do
FUNDADOR_N (o tier ouro fica igual).


## 🃏 Baralho: Philipp Lahm virou LENDA (04/08, pedido do Diego)
Era craque (fame 4, 86-92) — agora 👑 lenda (fame 5, **88-93**), entre Roberto
Carlos (88-93) e Cafu (87-92). Bio já existia. Efeito: entra no pacote de lendas
do leilão (Série A da escada), rende como 👑 na agência e sobe o piso dele.


## 🥬 Escudo do Alfacehh: verde + pé de alface (04/08) — AGUARDANDO OK VISUAL
Pedido do Diego: "a logo do Alfacehh quero que seja verde e emoji de alguma
planta que pareça alface". Feito em `escudos.tsx`: símbolo `alface` (roseta de
folhas) + **paleta TRAVADA no verde** (o DICIO agora aceita um 3º item que fixa
a cor, pra palavra cuja cor faz parte da identidade). Pega alfac/couve/folha/
horta/salada/rúcula. Prévia enviada ao Diego (scratchpad/alface.png).
✅ APROVADO pelo Diego (04/08) e PUBLICADO na main.


## ⏱️ Revelação do leilão: folga na SURPRESA e na ÚLTIMA carta (04/08, Diego)
"a surpresa passa tão rápido que nem consigo ver quem foi o jogador". A 🎁
surpresa só mostra o nome NO MARTELO, então ganhava menos tempo de leitura que
as outras. Agora, em `AutoAdvance` (screens.tsx):
· carta surpresa VENDIDA: **+1,6s** · ÚLTIMA revelação da rodada: **+1,2s**
(somam com o extra de desempate). O resto do pregão segue no ritmo de sempre —
a regra de ouro do Diego ("nada atrasa o jogo") vale pro fluxo normal.


## 🐛 BUG DA COPA DO MUNDO CORRIGIDO (04/08, relato de jogador) ✅
Dois problemas no manual da Copa, ambos consertados:
1. **"Apertei pular 2× e a partida voltou"** — `next`/`skip` liam o passo da
   renderização (`const s = step + 1`). Dois toques rápidos liam o MESMO número:
   o 2º não avançava fase, mas reiniciava o relógio (roundKey) e o jogo parecia
   voltar do zero. Agora o passo é calculado DENTRO do setState (valor mais novo)
   e o relógio só reinicia quando a fase realmente mudou.
2. **"Mudou o resultado da Copa"** (grave) — o torneio era calculado num useMemo
   que usava o `rng` COMPARTILHADO da tela de cima (gerador COM ESTADO). Como a
   lista de participantes (`top16`) nasce de um array recriado a cada render, o
   useMemo refazia o torneio de vez em quando com o gerador JÁ AVANÇADO → outros
   placares e outro campeão. Agora a simulação virou função pura EXPORTADA
   (`simulaCopaMundo`) com semente própria fixa: recalcular N vezes dá sempre o
   mesmo campeão/placar.
🧪 `scratchpad/copatest.mjs`: 5 recálculos × 3 sementes = idênticos; lista
recriada = mesmo resultado; sementes/temporadas diferentes = Copas diferentes.


## 🛡️ ESCUDOS DOS CLUBES (04/08) — motor PRONTO, aguardando autorização
`src/escalacao/escudos.tsx` — brasão desenhado POR CÓDIGO (SVG), peso ZERO no
servidor (viaja pelo GitHub Pages junto com o jogo; NÃO encosta no Supabase).
O gerador lê o NOME: 35 símbolos + dicionário de palavras ("Sertão"→cacto,
"meias"→par de meias, "fogo"→labareda, "Ferroviária"→trem...). Sem palavra
conhecida = sorteio FIXO do nome (inicial + padrão/cor), igual em todo aparelho.
Cobertura medida: 114 de 146 nomes (78%) com símbolo pelo significado.
⚠️ REGRA: paródia de clube real NUNCA vira cópia (Flamengo do Sertão lê
«Sertão», não «Flamengo») — marca registrada não entra.
💰 `LOGOS_PRONTAS` (mapa vazio) = onde entram as logos ARTESANAIS pagas: o
usuário manda a arte, o Diego aprova, eu redesenho em SVG (~2 KB) e cadastro ali;
ela passa na frente do automático.
✅ **NO AR (04/08, autorizado pelo Diego)** — `<Escudo nome={} />` ligado em 6
lugares (o Diego pediu na tabela do modo RÁPIDO também):
· modo RÁPIDO: tabela da Liga Legends (18px) e artilharia (15px) — só futebol
🧼 O nome é LIMPO de emoji antes de gerar (`nomeLimpo`): na tabela o nome vem com
o selo do tier ("Fulano 👑🖊️") e sem isso o escudo MUDARIA ao trocar de tier.
Testado em scratchpad/escudocheck.mjs.
· carreira: tabela de classificação (19px), ranking de clubes (19px), lista de jogos
da rodada (16px, um de cada lado do placar) e placar AO VIVO (34px). Vale igual
pros times de batismo (o motor só olha o nome). 🏀 O basquete segue com a inicial
(visual dele ainda não passou pelo Diego).
📲 Story do Instagram pronto (scratchpad/story-escudos.png, 1080×2100, selo
"já no ar 🔥") — Diego vai postar.
📸 Amostras aprovadas pelo Diego: mockup dos 6 times + folha dos 146
(scratchpad: mock-6times.png, escudos-todos.png, mock-alface.png).
ESCADA DE VENDA combinada: (1) escudo automático grátis pra todos · (2) editor
de brasão pro usuário montar (perk de apoio ou compra barata — entrega sozinho)
· (3) logo artesanal, a cara, feita sob encomenda quando o cara paga.


## 🏆 Ranking Carreira: saiu a sub-aba "Total da conta" (04/08, Diego) ✅
A aba Carreira mostra SÓ a lista por carreira (cada save uma linha). O total
da conta inteira já aparece ao tocar no técnico (álbum, chip "📊 Conta toda")
— tinha ficado redundante. O modo 'carreiratotal' segue no servidor (RPC),
só não tem mais botão; pra voltar é só recolocar o chip na EscRanking.

## 🏦 Banco Legends: regra do TRIPLO (04/08, decisão do Diego) ✅
+ (04/08) Banco TAMBÉM no FIM da aba Estrutura (ideia do Diego): logo depois
do teaser dourado — momento em que o técnico viu os preços das obras/SAF.
Segue em Finanças também. Estádio continua a 1ª coisa visível (sagrado).
Cada R$ 1 de Pix vira **3 moedas** — sempre o triplo (R$10→30 🪙 · R$50→150 ·
R$100→300 · R$500→1.500 · R$1.000→3.000). Vitrine no jogo mostra a regra e os
pacotes ×3; admin escolhe pelo valor do Pix (R$) e a ficha nasce com ×3
automático (BL_TRIPLO/TRIPLO = 3). Fichas ANTIGAS não resgatadas seguem valendo
o que foi gravado nelas — se o Diego quiser, gerar de novo pelas novas contas.

## 💰 AdSense instalado no site (04/08) — AGUARDANDO APROVAÇÃO DO GOOGLE
Diego mandou o Publisher ID: **pub-7150600438130611**. Instalado:
- Script do AdSense no `<head>` do index.html (async, não atrasa nada; nenhum
  anúncio aparece sem a gente criar bloco — é só a fundação/verificação).
- `public/ads.txt` com a linha padrão do Google (vale pros dois domínios).
PRÓXIMOS PASSOS: (1) Diego volta no painel do AdSense → Sites → confirma
leilaolegends.com e pede a REVISÃO (o site já tem o código, o Google acha
sozinho); (2) aprovação leva de dias a ~2 semanas; (3) SÓ DEPOIS: vídeo
recompensado via H5 Games Ads (adBreak type 'reward') — UI passa por MOCKUP
antes, reward provável em moedas da carreira (a combinar com o Diego).
⚠️ MAQUETE VIRTUAL: transferida pra org gratuita (04/08, feito pelo Diego —
verificado: sumiu da org paga). Falta SÓ o "Disable spend cap" até 09/08!

## 🎭 EVENTOS DE JOGADOR na carreira solo — NO AR (04/08) ✅
Aprovado pelo Diego e implementado completo (mockup mock-eventos.html ok'd):
- Máx. **1 evento por temporada**, só carreira SOLO (online 100% intacto), só a
  partir da T2, janela rodadas 3..31 (nunca na reta final; volta máx. rodada 36).
- **Noitada 🍾** (baladeiros): banner roxo, escolhe "banco 1 jogo" (reserva da
  MESMA posição assume) ou "escalar assim mesmo" (-2 de força SÓ naquele jogo,
  via mods POR RODADA na simulação — nunca mexe na carta, o passado não muda).
- **Expulsão 🟥** (pavio-curto, 1-3 rodadas) e **lesão 🩹** (qualquer um, 1-5):
  troca obrigatória — só escolhe QUEM assume. Suspensão vive no careerLineup
  (entrada na rodada + volta automática na rodada certa); SET_LINEUP rejeita o
  suspenso até a volta; formação NUNCA quebra (reserva = mesma posição, senão
  nem dispara).
- **Sem reserva na posição = só manchete de zoeira**, nada trava (regra do Diego).
- **🏥 Departamento Médico** no estádio: 1.000 🪙, rende 0, destrava depois da
  Cobertura; construiu = lesões ACABAM pra sempre. SAF agora exige ele também
  (era o combinado: última obra antes da SAF). Grandfather protegido: quem já
  tinha estádio 100% NÃO perde a renda de Craque da agência.
- **Jornal ganhou página "📻 Aconteceu na temporada"** com as manchetes dos causos.
- Traits curados à mão em eventos.ts (BR/EU/mundo + folclóricos inventados):
  só folclore LEVE (Romário/Vampeta/Balotelli baladeiros; Edmundo/Zidane/Cantona
  pavio) — NUNCA tragédia/lesão real de ninguém (Garrincha/Sócrates/Gascoigne
  ficaram DE FORA de propósito). Lesões são 100% fictícias e bobas.
- Trava dupla: banner pendente PAUSA o auto e trava PLAY_ROUND no reducer;
  multiclube seguro (banner decide no clube DO evento mesmo se trocar o seletor).
- Testes: eventotest.mjs (21 checks verdes) + regressões cria/dorm/herança ok;
  auditoria segue só com o "bot com 10" raro já conhecido (pendência antiga).
- 📣 Story regenerado com "JÁ NO AR 🔥" e entregue pro Diego postar (04/08).
- 🔒 CORREÇÃO (04/08, relato do Diego — usuário viu banner em carreira ANTIGA):
  eventos + Departamento Médico agora SÓ em carreira com `agenciaOn` (o novo
  modo empresário, ligado nas carreiras criadas após 03/08). Carreira antiga:
  zero banner, zero médico na lista de obras, SAF com a régua de sempre (sem
  os 1.000 extras) e CURA automática pra quem pegou banner vazado no lançamento
  (PLAY_ROUND limpa e destrava a rodada). Testes: +5 checks no eventotest.

## 🔑 Redefinir senha consertado (04/08, relato do Didico) ✅
Bug: clicava no link do e-mail de "esqueci a senha" e voltava pro site SEM a
tela de nova senha. Causa: o link de recuperação dispara TAMBÉM o evento de
"logou" (ordem varia) e o handler jogava pro MENU por cima da tela de
redefinição; o auto-reconectar de sala podia atropelar também. Conserto
(lobby.tsx): trava recoveringRef — armada pelo evento PASSWORD_RECOVERY E pela
marca type=recovery na URL (hash/query, já no carregamento); enquanto armada,
nenhum caminho troca de tela (menu/salas/convite); "Salvar nova senha" solta.
Pedir pro Didico testar de novo (F5 antes).

## 🏆 Sub-filtro na aba Carreira do ranking (04/08, pedido do Diego) ✅
Dois chips dentro da aba Carreira: "🪜 Por carreira" (padrão — cada save uma
linha, cartas daquela carreira) e "📊 Total da conta" (todas as carreiras
somadas + todas as cartas de carreira — o jeito antigo). RPC ganhou o modo
'carreiratotal' (migração esc_ranking_carreira_total); EscRanking com carSub.
Contexto: reclamações de "sumiu título/carta" eram a separação por carreira
(caso Alface) — verificado no banco que NADA sumiu (39/40 campeões recentes com
carta; liga+copa contando exato). Agora o usuário escolhe a visão.

## 🌱 CRIA DA BASE na renovação — MOCKUP enviado, AGUARDANDO OK (03/08)
Crítica justa do Diego: quando a saída do contrato vencido quebraria o XI, o
jogo FORÇA a renovação no aperto (dívida) sem dar escolha. Proposta desenhada
(mockup-base.html no scratchpad):
- Janela de renovação: Renovar 10 (90%) · Renovar 5 (metade) · "😢 Deixar ir —
  sobe um CRIA" SEMPRE habilitado (sem caixa, os renovar ficam apagados
  mostrando o preço).
- Escolheu deixar ir e quebraria o XI → entra um 🌱 CRIA DA BASE: nível 🪵 de
  base, valor 1, salário simbólico, contrato ~3 anos, nome folclórico sorteado
  (Zezinho, Guri, Pituquinha…), selo 🌱 claro no elenco + BANNER com historinha
  emotiva na virada ("o menino realizou um sonho").
- Anti-malandragem: cria fraco de verdade (deixar craque ir nunca compensa "de
  graça"), não vira carta de álbum, valor de mercado 1.
- AFK/sem decisão: mantém a regra de hoje (renova NO APERTO, cheque especial) —
  dívida forçada só por OMISSÃO, nunca contra a escolha do usuário.
- Só carreiras com contratos.
✅ AJUSTE 2 (03/08, Diego): avançou a janela SEM escolher = renova AUTOMÁTICO
por 5 anos (metade) pra TODOS os vencidos — com ou sem caixa (negativa; valor
REAL no extrato, caixa nunca fura). Jogador só vai pro leilão por ESCOLHA
("deixar ir"). O caso "quebraria o XI" deixou de existir na omissão (todos
renovam); o cria só nasce no deixar-ir explícito. Textos da janela atualizados.
✅ AJUSTE (03/08, Diego): renovar por ESCOLHA também pode NEGATIVAR — caiu a
trava de saldo do RENEW_CONTRACT (botões sempre ativos; sem caixa mostram 💳 e
o rodapé explica o cheque especial + transfer ban). Dívida por escolha OU por
omissão; nunca sem saber.
✅ IMPLEMENTADO (03/08) com os ajustes finais do Diego:
- Cria SEM contrato nenhum (cerimônia pula ele no sorteio), RUIM mesmo (48-58 —
  derruba o nível do time; 2-3 crias = time capenga), INVENDÁVEL (não lista,
  nunca entra em leilão/monte, bot nenhum paga nada), SOME DE GRAÇA quando
  chega reforço que fecha a formação sem ele ("voltou pra base de cabeça
  erguida", no resumo), nome NOVO a cada entrada (CRIA_NOMES ~30, sem repetir
  na carreira; esgotou → sufixo).
- Historinha melhorada e honesta (3 variações: "é RUIM de doer... mas dá pra
  tapar o buraco") — banner verde na CERIMÔNIA (criaNews) + linha no resumo.
- Botão "😢 Deixar ir" na janela (toggle; marcado = renovar apaga) via
  RELEASE_CONTRACT; aviso no rodapé: "não decidiu e avançou? renova SOZINHO
  por 5 anos (metade), mesmo no vermelho" (pedido dele de avisar).
- Aperto forçado agora SÓ por omissão. Selo "🌱 cria da base — sem contrato"
  na linha do elenco.
- TESTADO (criatest.mjs): 2 carreiras ×9 temporadas soltando TODO vencido —
  crias nomes únicos, zero dívida forçada, XI nunca fura, vencido não volta
  (anti-malandragem segue), invariantes todos verdes.

## 🚑 SUPABASE ESTOURANDO (03/08, pós-liberação geral): egress/realtime/lentidão
Sintomas: salas lentas, admin com "Could not query the database for the schema
cache", Diego avisado de limite de egress + realtime messages no plano Pro $25.
MEDIDO (pg_stat_statements): (1) upsert do esc_pyramid_saves = 1s de banco ×651
(autosave da carreira BAIXAVA+SUBIA o save inteiro a cada 6s por jogador);
(2) lista pública de salas = 850ms ×207 (baixava o game_state INTEIRO de até 50
salas A CADA 5s por pessoa na aba — nº 1 de egress); (3) realtime processando
esses estados gigantes.
✅ CONSERTOS (03/08):
- Autosave nuvem: throttle 6s→60s (save LOCAL continua instantâneo; force=true
  nos momentos-chave permanece). Corta ~10× as escritas/leituras gigantes.
- fetchOpenRooms: LISTA MAGRA — só os campos exibidos via game_state->>x
  (roomName/deck/varzea/mode/careerOnline/manual/copaMode/ligaFechada/locked/
  stream/pwHash/chatOff). De ~MBs por refresh pra ~KBs.
- fetchMyCareers: idem (nome/temporada/tipo) — carreira tem o maior estado do
  jogo e a lista baixava até 30 deles.
- triggerStart: TRAVA — se o fetch fresco falhar e a linha for magra (sem
  managers), aborta em vez de "começar do zero" (nunca reseta sala).
✅ ITEM 1 EXECUTADO (03/08, ordem do Diego: "parada há 2 dias já pode"):
7.736 salas rápidas paradas 2+ dias DELETADAS (de 8.603 → 882; as 13 carreiras
online 100% intactas — carreira NUNCA entra na limpeza). Registro leve do que
saiu em game_rooms_cleanup_log. FKs room_players/game_champions caíram por
CASCADE (game_champions é placar vivo da sala; títulos permanentes = esc_results,
intocados). LIMPEZA AUTOMÁTICA ligada: pg_cron 'limpa-salas-rapidas' todo dia
08:00 UTC (05:00 BRT) com o MESMO critério; desligar =
select cron.unschedule('limpa-salas-rapidas'). VACUUM (analyze) rodado (o
espaço vira reuso; o VACUUM FULL que encolhe o arquivo fica pra madrugada,
junto do item 2).
✅ MAIS 3 EXECUTADOS (03/08, "pode fazer o que não impacta nada"):
- RLS initplan das tabelas QUENTES consertado (migração
  rls_initplan_tabelas_quentes): esc_pyramid_saves, esc_results, game_rooms,
  room_players, user_cards, user_colors — auth.uid()/jwt() viram
  (select auth.uid()), semântica idêntica, CPU por consulta despenca.
  Restam as tabelas frias do advisor (profiles, boloes etc.) pra janela calma.
- Índices duplicados de analytics dropados (idx_game_plays_created_at,
  idx_site_visits_created_at ~14 MB). O unique do room_players FICA (é a trava
  anti-vaga-duplicada do jogo).
- Host só re-sobe o game_state (100-180 KB) quando ele MUDOU — estado idêntico
  vira só batimento do updated_at (ex.: 45s de envelope = 15 uploads idênticos
  → 1). lastUpRef em store.tsx; reconexão intacta (primeiro save sempre sobe).
⚠️ Advisors pendentes (fazer em janela calma): auth_rls_initplan ×39 (RLS
reavaliando auth.uid() por LINHA — trocar por (select auth.uid()) nas policies
quentes: esc_pyramid_saves, game_rooms, room_players, esc_results, user_cards);
multiple_permissive_policies ×35; índices duplicados em game_plays.
💡 Billing dito ao Diego: NÃO é o plano de $500 (Team). Opções no Pro $25:
manter spend cap (estoura = degrada) ou desligar spend cap e pagar excedente
(egress ~$0.09/GB, realtime ~$2.50/milhão de msgs — dezenas de reais, não
centenas de dólares). Com os consertos, o consumo deve despencar.

## 📝 Contrato SUTIL no Elenco — MOCKUP enviado, AGUARDANDO escolha (03/08)
Pedido do Diego: info discreta do contrato embaixo do nome no Elenco ("quantos
anos faltam, algo sutil"). Era o combinado antigo do sistema de contratos
("mostrar contrato até T__ na carta do Elenco"). Mockup com 2 opções
(mockup-contrato-elenco.html no scratchpad):
- OPÇÃO A (sugerida): na linha que já existe sob o nome — "São Paulo · 2005 ·
  📝 7 anos"; estados: cinza normal · ⏳ último ano âmbar · ❗ vencido vermelho.
- OPÇÃO B: selinho compacto na direita junto do 💰/💸 (📝7 / ⏳1 / ❗0).
Regras nas duas: emprestado/incógnito sem selo; só carreiras com contratos.
✅ IMPLEMENTADO (03/08): Diego escolheu a A ("faz a opção A e já atualize").
ctInfo() no ElencoField: linha do clube vira "São Paulo · 2005 · 📝 7 anos"
(cinza) / "⏳ último ano" (âmbar) / "❗ vencido — decida na janela" (vermelho).
Contagem: contratoAte − seasonNo + 1 (inclui a atual). Emprestado/incógnito sem
selo; gate contratosOn (só carreiras com contratos). Campinho de cima intocado.

## 🏆 Ranking Carreira: uma linha POR CARREIRA, sem unificar (03/08) ✅
Dúvida do Diego (caso Alface, 379 títulos): carreira NOVA com o mesmo nome
unificaria? SIM, unificava (esc_ranking agrupava só por user_id). Regra dele:
"unificar não pode — é uma nova carreira; dois Alface pode". Migração
esc_ranking_carreira_por_save: a aba 'carreira' agora agrupa por conta+SAVE
(prefixo do season_key até o seed: co:solo<seed> / co:<room>:<seed>), e o
total de CARTAS também sai por carreira (prefixo igual no user_cards).
Alface antigo fica intacto com os 379; carreira nova dele = linha nova do
zero. Abas rápido online/offline intocadas (por conta, como sempre).
Verificado no banco: top da aba continua batendo (Alfacehh 379/384 cartas).

## 💰 Renovação de 10 anos agora custa 90% (03/08, decisão do Diego)
Análise que embasou (amigo sugeriu 80%): por temporada, 5 anos=10%/ano e 10
anos a 100% também 10%/ano (dilema fraco); a 80% os 10 anos dominavam demais e
secavam o mercado. A 90% nasce o dilema: rico trava preço por 10 (9%/ano),
apertado paga metade à vista por 5. Mudança: RENEW_CONTRACT (custo ×0.9) +
botão da tela de venda mostra "(-10%)". Renovação NO APERTO e CPU rival seguem
na regra de 5 anos/metade (sem mudança). Arte dos stories de Contratos
atualizada ("90% do valor 🤑") e reenviada. Fatos confirmados pro Diego:
valorização de jogador parado no elenco = SÓ artilharia (liga/Copa); o livro
só muda quando ele é negociado; renovar NÃO mexe no piso.

## 🔓 CARREIRA NOVA LIBERADA PRA TODOS (03/08, ordem do Diego)
`AGENCIA_GERAL = true` em sport.ts: Agência 2.0 + Escada/Várzea + baralho
'todos' + Clube›Estrutura valem pra QUALQUER conta em carreira criada a partir
de agora (o pacote todo usa o mesmo gate). Saves antigos seguem exatamente
iguais. Rollback: AGENCIA_GERAL=false volta ao teste fechado (lista de
testers preservada no código). Basquete e tema seguem só na conta do Diego.

## 📝 ANTI-MALANDRAGEM dos contratos vencidos (03/08, achado do tester) ✅
Golpe: deixar o contrato vencer (jogador vai pro leilão com selo SEM CONTRATO)
e RECOMPRAR barato no pregão/monte — "renovação" mais barata que renovar.
Regra do Diego: o ex-dono NÃO pode recomprar nem pegar de graça; só se OUTRO
clube levar e o jogador voltar ao mercado um dia. Travado em 4 pontos (vale
humano E bot; a compra por outro clube limpa o selo, então o retorno futuro
libera sozinho):
- resolve(): lance do ex-dono em carta sem-contrato é ANULADO (e fora do
  desempate);
- cpuEnvelope(): CPU nem gasta lance no próprio vencido;
- montePickable(): ex-dono não pesca o vencido de graça no monte;
- sweepMonteToBackstops(): o comprador forçado de última hora nunca é o ex-dono.
UI: no leilão, a carta "⏳ seu — sem contrato" mostra caixa "🔒 SEM RECOMPRA —
você deixou o contrato vencer; só se outro clube levar" no lugar dos botões.
TESTADO (malandragem.mjs, scratchpad): 2 carreiras ×9 temporadas SEM renovar
nada e dando lance em tudo — todo vencido saiu e NENHUM voltou (leilão, empate,
monte e varredura). Renovação NO APERTO (trava do XI) segue funcionando.

## 🃏 Verificação de cartas (03/08) — pesquisa web clube+ano+posição
✅ ADICIONADOS hoje (todos conferidos): Saulo (GK Sport 22), Bosco (GK Sport 00),
Max Walef (GK Fortaleza 22), Brítez (LAT Fortaleza 23), Zizão (MEI Corinthians 13),
Preto Casagrande (MEI Santos 04), Pochettino (MEI Fortaleza 24), Feijão (MEI Bahia 13),
Felipe Cabeleira (MEI Náutico 22), Gonçalo Paciência (ATA Sport 25), Alef Manga
(ATA Coritiba 22), Wallace Pernambucano (ATA Confiança 14), Mascote (ATA Retrô 24),
Neto Baiano (ATA Vitória 09), Robgol (ATA Bahia 02), Rogério "Neymar do Nordeste"
(ATA Ceará 20), Machuca (ATA Fortaleza 24), Vagalume (ATA Maranhão 25).
🔧 CORRIGIDOS: Gustavo Geladeira (Portuguesa→Flamengo 11), Rodrigo Arroz (GK→ZAG),
Rodrigo Alvim (ZAG→LAT). ❌ REMOVIDO: Sérgio Escobar (não existe no Vasco).
⚠️ SEGURADOS (não bater ano/clube): Yamada (Diego pediu p/ NÃO botar — não achei
no Palmeiras), Milagres (real é GOL do América-MG, não bate c/ nordeste atacante),
Sandro Gaúcho (2 jogadores diferentes — ambíguo), Everton Páscoa (passagem nordeste
não confirmada). Andrés Escobar já estava no baralho Mundo (Atlético Nacional 91).


## 🎨 Artes de stories entregues (03/08): Contratos + Empresário + Várzea + PROPAGANDA da carreira
Quarta arte (03/08, pós-liberação geral): "🪜 SUBA NA VIDA — da várzea à glória"
com a ESCADA visual das 5 divisões (degraus subindo, Várzea marrom → Série A
premium com 👑), régua por divisão nos degraus e a zoeira pedida pelo Diego:
"acabou a mordomia: LENDA não aparece mais na Série D — quer o Pelé? Come
poeira subindo até a elite 😤". CTA dourado "JÁ DISPONÍVEL — crie uma carreira
nova" (fonte: story-carreira.html no scratchpad).
Três PNGs 1080×1920 no visual do jogo, todas com carimbo vermelho "SÓ PRA
CARREIRAS NOVAS": (1) Contratos (carta-contrato assinada); (2) Modo Empresário
— REFEITA a pedido do Diego (03/08): agora a estrela é a prancheta "CONVOQUE
SEUS 22" (5 cartinhas por categoria com renda + vagas tracejadas + contador
5/22) e os 3 bullets são as comissões que ele gostou (artilheiro · campeão em
qualquer time · negociado no leilão); (3) Várzea
(campinho de TERRA MARROM já de teaser, placa "Bar do Zé", bullets escada/
régua/baralho gigante). Fontes em scratchpad (story-*.html).

## 🎨 MOCKUP dos 5 CAMPOS por divisão — AGUARDANDO OK do Diego (03/08)
Pedido (áudio): campinho do leilão/pregão MARROM na Várzea, verde tradicional
nas outras, e o verde da Série A "mais bonito". Mockup enviado com os 5:
🌱 Várzea terra batida #8B5E3C/#7A4E2E (placa de zoeira "Bar do Zé") ·
D/C/B verde de hoje #1B7A3D/#166332 · 👑 Série A premium #23984F/#1A7F40.
Formato/casinhas idênticos (Campinho em screens.tsx usa
repeating-linear-gradient 34px — é trocar o par de cores por divisão).
✅ APROVADO E IMPLEMENTADO (03/08, "adorei tudo, já faça valer"):
- turfColors() em screens.tsx: 🌱 marrom #8B5E3C/#7A4E2E na divisão V da
  carreira nova E TAMBÉM no modo várzea do rápido (state.varzea — pedido
  explícito dele); 👑 Série A da carreira nova = verde premium #23984F/#1A7F40;
  resto = verde tradicional (tudo que existia fica idêntico).
- ⚠️ DECISÃO DO DIEGO: a placa/logo de patrocínio (Vadico) FICA em todo campo —
  o "Bar do Zé" do mockup era só zoeira de mockup, NUNCA trocar a placa.

## 🎨 Arte de stories "CONTRATOS chegaram" entregue (03/08)
PNG 1080×1920 no visual do jogo (creme/Oswald/sombras duras): carta-contrato,
3 bullets (renovar/deixar ir, teto + família gananciosa, rivais no mercado) e
carimbo vermelho grandão "SÓ PRA CARREIRAS NOVAS — save antigo segue igual".
Enviada pro Diego postar; fonte em scratchpad (story-contratos.html). Se pedir
variações (cores/texto), é editar o HTML e re-renderizar (chromium headless
1080×2100 + crop 1920 — o viewport do headless come ~180px do window-size).

## 💰 PREÇOS INTELIGENTES na carreira nova (03/08, relato do tester Maurice) ✅
Relato: "🪵 vendido por 40 e ⭐ pelos mesmos 40; CPU pagando alto em jogador
ruim". MEDIDO em simulação (25 temporadas × runs, todas as vendas do leilão):
médias eram saudáveis (🪵12 · 🎯15 · 💎29 · ⭐40) mas as CAUDAS estouravam
(🎯 max 42 = mediana de ⭐; 🪵 p90 35 na Série B) e o LIVRO inflava sem teto
(🎯 com piso 100! — bônus de artilheiro somando toda temporada sem limite).
✅ CONSERTO (tudo atrás de `escadaOn` — jogo ao vivo e saves antigos intocados):
- `catPriceCap` (store): teto de mercado por categoria 🪵16 · 🎯26 · 💎42 ·
  ⭐65 · 👑90 (derivado das distribuições saudáveis medidas).
- `applyScorerValues`: bônus de artilheiro não empurra piso/livro além do teto
  da categoria (nunca REDUZ valor já gravado; carta não achada → teto médio 42).
- `cpuEnvelope(smart)`: lance da CPU capado no teto da categoria (×0.8-1.05 de
  variação) — bot rico/agressivo não fura o nível do jogador.
- `resolveOneTiebreak`: CPU não cobre EMPATE além do teto (era a última rota —
  empate a 25 escalava pra 38). Humano segue livre pra pagar o que quiser.
RESULTADO re-simulado: inversões 3.8%→0.0% (nenhum 🪵/🎯 acima da média ⭐ da
época); max 🎯 42→27; livro capado; escada por divisão limpa (V:🪵10/🎯14 →
B:💎36/⭐42). Regressão escadafina toda verde. Relista barato de encalhado
continua existindo (Diego: "é do jogo").
### ➕ Ajuste do Diego (03/08): "quero algo REAL — mercado sobe conforme avança,
### time rico paga mais (mas inteligente)" → TETO DINÂMICO
- `escadaEconFactor` (store): teto por categoria × riqueza média da sala (caixa
  dos humanos + clubCash de rivais/bots). Caixa ~100 = fator 1; cresce até 4×.
  Aplica no lance da CPU (os DOIS tetos escalam: fairPrice e categoria), na
  cobertura de empate e no piso de artilheiro. A PROPORÇÃO entre categorias é
  o que nunca muda (🪵 não alcança ⭐ da mesma época).
- Simulado 28 temporadas ×3: mercado SOBE com a era (🎯 12.9→20.5 · 💎 30→36 ·
  ⭐ 34.7→42.7 max 65) e inversões seguem 0.0%. Time rico já pagava mais pelo
  motor (fatia de orçamento + starHunger) — agora o teto deixa, sem pagar burro.
### ➕➕ Diego de novo (03/08): "Pelé por 409 depois de muitas temporadas" →
### teto estendido pra TODA CARREIRA (não só escada)
- Os 4 gates (lance CPU, empate, piso de artilheiro) mudaram de `escadaOn` pra
  `careerOnline` — carreira ANTIGA/longa também ganha o teto dinâmico. Modos
  rápidos seguem intocados (não têm inflação de livro).
- Piso JÁ inflado num save velho (ex.: Pelé 409) NÃO é reduzido na marra: a CPU
  para de cobrir (acima do teto), o jogador encalha e o piso CAI PELA METADE a
  cada relista (mecânica que já existia) até voltar pro teto — deflação natural
  em 2-3 temporadas, sem mexer em save.
- Regressões re-rodadas: preços ok, inversões 0.0%, escadafina toda verde.
## 📈 "SUBIU COM TIME RUIM?" — verificado, é percepção da régua (03/08)
Nas 15 promoções simuladas o promovido era SEMPRE mais forte que a MÉDIA da
divisão (XI ~77-80 vs ~75). Como a régua nivela todo mundo por baixo, o time
parece "ruim" no absoluto mas é o melhor do pelotão — funcionamento desenhado.
Obs.: a força média dos elencos CPU é ~constante entre divisões (a dificuldade
por divisão vem do handicap A2 B4 C5 D3 V4, não do elenco) — se o Diego quiser
elencos visivelmente melhores em cima, é outra alavanca (não mexida).

## 👥 TESTADORES da carreira nova (03/08): msb102010@hotmail.com + denilson.stifler10@gmail.com
Diego pediu pra liberar essas contas com o pacote COMPLETO da carreira nova de
teste, "igual o meu": entrou em AGENCIA_TESTERS (sport.ts) — a mesma lista
libera Agência 2.0 + Escada/Várzea + baralho 'todos'. Basquete e tema seguem
SÓ na conta do Diego (não fazem parte da carreira nova; se ele quiser, é
adicionar nas outras listas do mesmo arquivo).

## ⚠️ LIÇÃO DE DEPLOY (03/08): commitar no branch NÃO põe no ar!
O hotfix do loop ficou 2 commits só no branch `claude/denis-...` enquanto o site
(main) seguia sem ele — por isso o Diego continuou vendo bugs "já consertados".
Protocolo: depois de commitar/pushar no branch, conferir `git log origin/main` e
publicar com `git push origin HEAD:main` (fast-forward). Feito agora — main tem
o hotfix do leilão de reservas.

## 🕴️ AGÊNCIA NO ESTÁDIO — mockup mostrado, AGUARDANDO OK do Diego (03/08)
Pedidos do áudio do Diego:
1. "Aba antiga de Agência ainda aparece" — no código ela JÁ está escondida
   (filter em pyramidseason ~3117, main tem). Provável bundle em cache no
   aparelho dele (pedir F5/atualizar). ⚠️ MAS ao esconder a sub-aba, a tela
   AgenciaDesbloqueios ficou INALCANÇÁVEL — resolve junto com o item 2.
2. Mover os desbloqueios das categorias da agência pra DENTRO da área do
   estádio (Clube), visualmente integrado ("no estádio fica fácil de entender").
   Mockup enviado (scratchpad `mockup-estadio-agencia.html/png` + artifact):
   seção "🕴️ Agência de Jogadores" DENTRO da aba do estádio, escada de 5
   categorias com estado/falta/renda: 🪵 grátis de cara · 🎯 1 setor · 💎 3
   setores · ⭐ estádio 100% · 👑 SAF (= a régua que JÁ existe em empCatUnlocked
   — Diego confirmou no áudio que lenda é pós-SAF e prof ~de início; sugeri
   manter grátis de cara). CTA aponta pra Elenco › Agenciados. Texto stale da
   AgenciadosTab ("desbloqueios seguem na aba Clube › Agência", linha ~881)
   deve passar a apontar pra nova casa QUANDO implementar.
3. Nome da sub-aba: Diego APROVOU "🏗️ Estrutura" (áudio 03/08: "gostei do nome
   estrutura, gostei das ideias das três: estádio, patrocínio e o empresário").
4. Feedback do Diego no mockup v1: ele AMA o estádio ABERTO de cara ("uma
   pessoa via o estádio de cara, eu achava bonito") → mockup v2 enviado com a
   ordem: 1) StadiumSvg no TOPO (intacto, primeira coisa visível) · 2) obras/
   melhorias · 3) patrocínio · 4) caixa escura da Agência por último (destaca,
   não confunde com a obra). Aguardando OK do v2.
✅ IMPLEMENTADO (03/08) — Diego aprovou o v2 ("Gostei", com a ressalva de NÃO
   mexer no visual do estádio; o desenho do mockup era só marcador meu):
   - Sub-aba vira "🏗️ Estrutura" e ordem StadiumTab (desenho intacto, primeiro)
     → SponsorCard → AgenciaDesbloqueios (escada escura nova com progresso real:
     você tem X setores, falta camarote/telão…, chips ✓ABERTA/🔒N-de-M, CTA
     "Ver meus agenciados" que pula pra Elenco › Agenciados).
   - TUDO atrás de `agenciaOk` (agenciaOn && conta liberada) — jogo clássico e
     saves antigos 100% intocados (patrocínio continua em cima, aba Agência
     clássica continua existindo pra eles).
   - clubeSub 'escritorio' herdado numa carreira 2.0 cai na Estrutura (nada de
     tela órfã); texto da AgenciadosTab agora aponta pra Clube › Estrutura.

## 🔬 AUDITORIA FINA da carreira nova (escada) — pedido do Diego pós-loop (03/08) ✅
Diego pediu: (a) confirmar leilão de reservas na 2ª + listar na 3ª; (b) contratos
com a MESMA ordem de avisos/liberação da carreira antiga; (c) "analisar cada
pontinho" da carreira nova de novo. Feito com harness novo `escadafina.mjs`
(scratchpad, dirige o reducer REAL com asserções duras, monte via MONTE_PICK/PASS
de verdade — sem o atalho antigo que duplicava carta). Resultado TUDO VERDE:
- Gates: T2 compra reservas ✓ (leilão vende ~45-55 lotes; deepSquad ligado);
  T2 listar BLOQUEADO ✓; T3 listar libera ✓ — carta listada sai do elenco, vai
  pro baralho com seller, termina em EXATAMENTE 1 elenco (inclui times de fundo
  via cpuSquads) e a venda aparece no extrato ✓.
- Contratos: ordem JÁ ERA idêntica à carreira antiga (tudo por seasonNo, nada
  de código novo): T1 sorteio 5-10 na cerimônia ✓ · fim da T4 primeira folha ✓
  (antes disso só a linha 0 forçada do resumo) · T5 avisos "último ano" com
  conteúdo ✓ · T6-T7 primeiro selo ⏳ SEM CONTRATO no baralho ✓ · nenhum
  contrato vencido sobrevive pós-cerimônia (renova/aperto/leilão) ✓.
- Invariantes por temporada (10 temporadas × vários runs): caixa×extrato EXATO
  em toda virada ✓ · sem NaN (careerCoins/clubCash/money) ✓ · sem duplicata de
  jogador real entre elencos ✓ · sem FAKE no baralho de reservas ✓ · régua da
  divisão respeitada (fora dela SÓ mercado secundário: seller/sem-contrato, por
  design) ✓ · placements 20 times × 5 divisões ✓ · sem multiclube fantasma ✓ ·
  leilão sempre termina ✓.
- 🎁 Bônus: o achado da auditoria anterior (rival de várzea com incógnito preso
  no XI) SUMIU — com o leilão de reservas funcionando, os rivais repõem de
  verdade. Sem warnings em nenhum run.
Nenhuma mudança de código precisou nesta rodada (contratos já alinhados).

## 🪜 HOTFIX — "loop 1→12" no leilão de reservas da escada (03/08, Diego bravo) ✅
Relato (carreira nova com escada/Várzea): iniciou o leilão de reservas na virada
T1→T2, tela dizia "não liberado" mas rodou mesmo assim, e virou um desfile de
resultados 1→12→1 sem leilão de verdade (teve que sair do jogo).
CAUSA-RAIZ: a trava "banco de reservas só depois do 1º acesso" (benchOK em
RESERVE_AUCTION_ONLINE) deixava TODO MUNDO mirando 11 — e a sala inteira já tem
11/11 na virada. Ninguém podia dar lance em NADA → cada leva de 12 lotes
(BATCH_SIZE=12) lacrava sozinha, tudo "não vendido", leva após leva, setor após
setor (~10 levas de 12 = o "looping de 1 a 12"). Não era infinito (terminava na
cerimônia), mas era um leilão 100% inútil e parecia travado.
✅ CONSERTO (regra nova do Diego: "o leilão de reservas deve funcionar sim, e na
3ª temporada libera a venda"):
- Trava do banco REMOVIDA: leilão de reservas da escada funciona desde a T2 igual
  à carreira normal (todo mundo mira 22; venda continua liberando na T3, regra
  global que já existia). A RÉGUA de categorias por divisão FICA (na Várzea o
  banco enche de 🪵+🎯, etc.).
- `escadaSubiu` virou só marco de "virou profissional" (persiste; muda a régua) —
  textos e mensagem de acesso atualizados; caixa "banco travado" da tela de venda
  substituída por explicação da régua; banner T2 "🔓 Desbloqueado: Reservas!"
  voltou a aparecer na escada (antes era suprimido e contradizia o fluxo).
- Simulação headless (simescada) re-rodada: 30 temporadas sem stall, elenco chega
  a 22, régua respeitada, arco V→A preservado.
- SOBRE O "caixa aumentou estranhamente" ao iniciar o leilão: é a VIRADA legítima
  — prêmios da temporada + bilheteria − folha entram exatamente no
  OPEN_RESERVE_LIST e BATEM com o extrato (invariante auditado caixa×extrato).
  Explicar pro Diego; se ele suspeitar de valor, pedir print do extrato.

## 🏛️ BUG — SEGUNDO CLUBE não compra depois que o técnico SOBE da Série D (04/08)
Relato: Lenda com 4.000 moedas, botão fica CINZA com "Nenhum clube da Série D
disponível agora." (SOLO/offline — não é o online.) CAUSA: a lista `opcoes`
(pyramidseason ~2761) e o motor `BUY_MULTICLUBE` (store ~3217) só olham `state.managers`
placeados em 'D'. Mas `state.managers` = só ~20 times da SUA divisão atual
(buildPyramid usa `managers.slice(0,20)`); os outros 60 (outras divisões) são times de
FUNDO gerados por `buildCpuSquads`, que NÃO estão em `state.managers`. Então, assim que
o técnico sobe pra C/B/A, a Série D vira só times de fundo → lista vazia → botão cinza.
Justo quem tem 4.000 moedas (várias temporadas) já subiu → não consegue comprar.
✅ FEITO (04/08) — "comprar de qualquer divisão, igual à SAF":
- `opcoes` (pyramidseason) agora vem de `sortDiv(tables.D).slice(4)` (a Série D DE
  VERDADE, exista você onde existir), filtrando você/humanos/rivais/SAF/2º-clube — igual
  à lista da SAF.
- `BUY_MULTICLUBE` (store): CASO 1 (estou na D) = transforma o bot como antes; CASO 2
  (outra divisão) = CRIA o 2º clube dormindo (id novo, squad via `cpuSquads`, placement
  D, mine+dormindo), e um preenchimento cede o lugar pra liga seguir com 20. Resultado é
  um assento `mine+dormindo` IDÊNTICO ao do Caso 1 → reusa o caminho já testado (dorme/
  joga/troca). Travas: nunca você/rival/SAF; alvo TEM que estar na D; sem filler livre →
  não compra (nunca cria estado inválido). Regra do Diego: 1º time em qualquer divisão;
  2º escolhido entre os que HOJE jogam a Série D; depois cada um vai pra onde o mérito
  levar. Escolha "todos que vão jogar a D" (inclui caídos da C) atendida por usar tables.D.
- `buildCpuSquads` agora exclui nomes que viraram MANAGER (evita time DUPLICADO na
  pirâmide quando um clube de fundo vira 2º clube). No-op no jogo normal.
Testado: build OK + app sobe sem erro de JS no navegador. NÃO deu pra fazer playthrough
multi-temporada aqui (Supabase bloqueado no ambiente de teste → sem login/carreira).
⚠️ FALTA: Diego (ou tester) testar em carreira real: subir pra Série A, comprar 2º clube
da D, passar 1-2 temporadas e conferir que o clube PERSISTE e dá pra assumir. Reversível
(commit isolado). FALTA TB: textinho informativo no painel (visual → aguardando OK do
Diego). WORKAROUND enquanto valida: comprar ainda na Série D.

## 🚨🚨 BUG SÉRIO — IDENTIDADE/ASSENTO EM SALA GRANDE (03/08) — Diego quer MANTER 20
Sala LOTADA (18/20) na noite 03/08. Relatos do jogador "Viria" (host): (1) "no começo
tinha DOIS eu; o 2º não dava lance (fantasma), aí expulsei"; (2) depois ficou
**jogando com o NOME DE OUTRO técnico**; (3) deu **F5 e trocou pra OUTRO nome, ainda
não o dele**. Sintomas colaterais: leilão lacrando sozinho + time montado sozinho.
Diego escolheu **MANTER limite 20** (não capar sala) → precisa consertar a RAIZ.

### O que já apurei no código (03/08):
- **KICK NÃO desloca o array** (era minha suspeita, ERRADA): `KICK_PLAYER` (store.tsx
  ~2547) acha o manager por **id** e só faz `isHuman=false` **no lugar** (vira CPU).
  Não faz splice → não empurra índices. Então o kick sozinho não é o vilão.
- **A âncora de identidade é FRÁGIL**: `FIX_YOU_IDX` (auto-cura, store.tsx ~5145-5160)
  reancora o `youIdx` **pelo NOME** (device display_name × manager.name), e só quando
  há EXATAMENTE 1 humano com aquele nome. Fura quando: (a) existe **fantasma com nome
  igual** (cands≠1 → não cura); (b) o **nome do device ≠ nome do time** no jogo (nunca
  casa → nunca cura); (c) **carreira online reordena os managers entre temporadas** →
  `player_index` do room_players deixa de bater com a posição no array.
- No reconnect, `RESTORE_ONLINE` faz `youIdx = room_players.player_index` (lobby ~270),
  e o **host-recreate usa `seatIdx = mineMgr.id`** (lobby ~256) — id NÃO é
  necessariamente a posição do array. Somados, dá pra cair no assento errado.
- Dedup "1 técnico = 1 assento" só roda no **startOnline** (lobby ~1139-1151); um
  fantasma criado por corrida/reconexão DEPOIS do start escapa.

### 🎯 SMOKING GUN (04/08) — "expulsar" mistura ID com ÍNDICE DE ASSENTO:
A UI chama `kickPlayer(m.id)` (screens.tsx 745/5937/5941) → passa o **id** do manager.
Mas dentro do fluxo o mesmo número é tratado como **índice de assento** em 3 pontos:
- `kickPlayer` guard (store ~4854): `playerIndex === youIdx` compara **id × índice**.
- `room_players.delete().eq('player_index', playerIndex)` (store ~4858): apaga a vaga
  pelo **id** achando que é player_index → apaga a vaga ERRADA (ou nenhuma) → o
  expulso reconecta na mesma partida / sobra fantasma.
- Handler do cliente (store ~4952): `payload.playerIndex !== youIdx` compara **id ×
  índice** → o banner "você foi removido" pode ir pra pessoa ERRADA, e o expulso pode
  continuar dentro. (O reducer KICK_PLAYER em si usa id e está certo; submitted/
  monteOrder/tiebreak usam id — OK. O erro está nesses 3 pontos da BORDA.)
Como `id` só coincide com `youIdx`/`player_index` quando os assentos são 0,1,2… (some
na carreira online reordenada / salas grandes), é AÍ que "vira outro / removido errado".
FIX: usar o **id** de ponta a ponta no expulsar → guard compara com o MEU id
(`managers[youIdx].id`); handler compara `managers[youIdx].id` com o id expulso; e a
vaga do banco tem que ser apagada pelo assento/usuário certo daquele id (parte que
depende do item 1 do plano — âncora por id estável).

### 📏 REGRA DO EXPULSAR (Diego, 04/08): expulsou → a pessoa SAI (banner "removido
pelo host"), NÃO vira CPU. Vira CPU (auctionRival) SÓ quando eram 2 jogadores (pra
quem ficou não jogar sozinho). O reducer já faz `auctionRival = humansLeft<=1`, mas o
"exclui de verdade" precisa remover o expulso do fluxo/vaga sem virar filler ativo.

### PLANO DO FIX (área sensível — testar antes de subir pra sala grande):
1. **Assento ancorado por ID ESTÁVEL, não por nome**: guardar o `manager.id` do técnico
   por usuário (ex.: gravar no room_players no START_ONLINE) e no reconnect fazer
   `youIdx = managers.findIndex(m => m.id === meuManagerId)`. Sobrevive a reordenação
   de temporada e a nome de time custom. (Fallback: nome, só se não achar por id.)
2. **1 técnico = 1 assento SEMPRE**: rodar a dedup por usuário também na reconexão/no
   meio do jogo, não só no start → fantasma nunca existe.
3. Revisar auto-lacra do espectador (screens.tsx ~2197-2213) pra assento fantasma não
   forçar SEAL.
⚠️ NÃO hot-patchar na sala ao vivo de 20; **reproduzir num teste de 2-3 pessoas** e
subir validado. Deploy não derruba quem já joga (só vale em F5/próxima sala).

### ✅ Já consertado nesta noite (03-04/08):
- **Velocidade** (commit 6a42317): sala AUTO rodava "ultra rápida" porque `simSpeed`
  (sincronizado na sala) vinha alto de um jogo anterior e o online não tem botão pra
  voltar. `START_ONLINE` agora zera `simSpeed=1`. Só afeta jogos NOVOS. Reversível.
- **EXPULSAR + IDENTIDADE por CRACHÁ (id), não por cadeira (04/08)**: 3 pontos que
  misturavam id×índice foram alinhados pro id:
  · `kickPlayer` guard → compara o expulso com o MEU id (`managers[youIdx].id`).
  · handler do 'kick' no cliente → idem (banner vai pra pessoa certa).
  · `RESTORE_ONLINE` → `youIdx` acha a posição atual do meu manager pelo id
    (`findIndex(m.id===player_index)`), fallback pro cru. Corrige "F5 trocou de nome"
    na carreira reordenada e o "virei outro" ao expulsar em sala grande.
  Em sala pequena/temporada 1 (id===cadeira) o comportamento é IDÊNTICO ao de antes —
  só corrige os casos desalinhados. Não toca em partida em andamento (vale em novo
  kick/reconexão). Reversível.
- **AUTO-CURA por CRACHÁ (id), não por nome (04/08)**: a `FIX_YOU_IDX` agora guarda o
  id do meu técnico (bootstrap: 1º nome único da sala) e daí reancora pela POSIÇÃO
  ATUAL desse id — imune a nome repetido (fantasma), nome de time trocado e reordenação
  de temporada. Zera o crachá ao trocar de sala (ids se repetem entre salas). Fecha o
  último band-aid do "virei outro / F5 trocou de nome".
  ⚠️ FALTA SÓ: **TESTE de 2-3 pessoas** (idealmente reproduzindo a carreira online
  entre temporadas: F5 no meio + expulsar) pra confirmar em campo antes de sala cheia
  confiar 100%. Regra do expulsar (sai; CPU só p/ 2) já batida pelo reducer
  (auctionRival=humansLeft<=1) — o "virava CPU errado" era o id×índice, agora alinhado.

## 🚨 CUSTO SUPABASE — estourou cota (03/08) — fix REVERTIDO, RE-APLICAR com calma
Pro Plan. Ciclo passou da cota: **Realtime Messages 20mi/5mi (400%)** e **Egress
555/250 GB (222%)**. Grace até **29/ago**; até lá funciona e **NÃO cobra** (spend cap
ON — "not billed for overages"). Causa: heartbeat do host reemitia o ESTADO INTEIRO
a cada 3s sem parar (pior com sala de 20). ⚠️ NUNCA "Disable spend cap" (é o que
cobraria). NÃO precisa Team ($599) nem trocar de plano — resolve no código.
- Fix feito (commit b72a847) e **REVERTIDO (cffa33d)** na mesma noite só por PRECAUÇÃO
  quando apareceu o bug do jogador-em-dobro (que NÃO era do fix). O fix era: heartbeat
  só reemite quando a sala está quieta (>12s sem envio), checando a cada 6s — mesma
  proteção contra trava, fração do tráfego. **RE-APLICAR com o Diego quando acalmar**
  (não urgente — 26 dias). Próximos alvos seguros: enxugar `packState`; throttle do
  broadcast por-mudança na simulação da temporada.

## ⚽ Leilão Legends
1. **Painel "PRÓXIMO" do modo rápido (online + offline) — APROVADO em mockup, falta implementar:**
   - Botões de tática ~40% menores (pílulas de uma linha; a escolhida ganha ✓).
   - Micro-legenda EMBAIXO de cada botão: retranca "segura o ataque" · equilíbrio "fura a retranca" · ataque "atropela o equilíbrio".
   - REMOVER a linha "⏱️ Temporada rolando sozinha — sente e assista".
   - NOVO: scout do adversário (posição · pontos · últimos 5 jogos V/E/D).
   - NOVO: chip 🔥 CLÁSSICO com retrospecto do confronto quando o próximo rival é humano.
   - Barrinha de progresso continua (fina, embaixo).
   - Mockup de referência: artifact "Mockup — Painel PRÓXIMO (rápido)" (sessão de 26/07).
2. (Opcional, oferecido) Brilho ANIMADO (sheen) na faixa do tier nas tabelas — hoje é só o degradê parado.
3. (Opcional, oferecido) CPU/rivais escolherem a própria formação (4-3-3/4-4-2) na carreira — hoje só humano troca.
4. 🏆 **COPA DO MUNDO LEGENDS (conceito aprovado; construção COMEÇOU 27/07):** a cada 10 temporadas da carreira, entre temporadas. Desbloqueio: já foi campeão de alguma série. Jogador escolhe uma SELEÇÃO e monta o XI por leilão cego só com cartas daquele país; 16 seleções, grupos + mata-mata. Prêmio = status (carta dourada + estrela mundial + mural).
   - ✅ **Passo 1 FEITO**: país etiquetado nas 1032 cartas (`src/escalacao/paises.ts`, não importado pelo jogo ainda — zero risco). Ranking + buracos por posição: `docs/copa-paises-worklog.md`.
   - ✅ **Decisões novas do Diego (27/07)**: as 16 vagas = TOP-16 do ranking por Nº DE CARTAS no baralho (atualiza sozinho; Brasil 1º disparado com 510); fluxo de entrada = botão dourado "🌍 DISPUTAR A COPA" na tela "novo leilão/mesmo time" nas temporadas múltiplas de 10 + notícia-hype na temporada anterior + trava "só campeões" com aviso claro.
   - ✅ Lote de 36 cartas NO AR (28/07): todas as 16 seleções com 22+ e formação fechando.
   - ✅ **MODO NO AR (28/07, v1 SOLO)**: `src/escalacao/copa-mundo.tsx` — tudo local (localStorage llcopa:<seed>, ZERO mexida no reducer). Gate no fim de temporada solo (trava temporada 100 com barra · chip contagem · botão dourado), escolha de seleção travada pela posição no TOP 16 do ranking de clubes, convocação (listão A-Z sem categoria, versões dedupe, 4-3-3/4-4-2 com trava por elenco, campinho enchendo), bots convocam os melhores 11, torneio AO VIVO (28/07, pedido do Diego após teste): SEU jogo roda no LiveScoreCard oficial (relógio 0→90 em 9s = ritmo da liga, GOOOL pingando com nome do convocado), tabela/resultados dos outros SÓ após o apito, pênaltis no PensShootout cobrança a cobrança, MODO AUTO por padrão (a Copa anda sozinha, igual a liga) + Modo Manual completo pra quem tem (🐢/⚡, pular, próxima fase — SimControls/SpeedControls oficiais; QuickManualLock/APOIE pro resto) + eliminado ASSISTE todos os confrontos ao vivo — 6 rodadas de grupo → sorteio → QF/SF ida-volta → final única → cerimônia + mural.
   - ✅ **ONLINE liberado (28/07)**: o gate aparece também na carreira online — cada técnico disputa a SUA Copa no próprio aparelho (demais clubes do top 16 viram CPU; nada sincroniza → zero risco pra sala; jogar não trava a votação). **FALTA (fase 3)**: Copa SINCRONIZADA na sala (votação/host, humanos se enfrentando) · notícia-hype no O Martelo · ⭐ fora do mural · carta dourada física · testes com save real do Diego.
5. 🏛️ **SEGUNDO CLUBE (spec do Diego 28/07 — aguardando 2 confirmações p/ mockup):** compra por **4.000 moedas do jogo** (tem que TER); botão de compra **exclusivo do tier Lenda 👑** (Lenda não ganha de graça, paga igual); ✅ CONFIRMADO (28/07): aparece quando o **modo Empresário** estiver desbloqueado (+ tier Lenda + 4.000 moedas). **Seletor de clube** na carreira; o clube NÃO selecionado DORME: não lista, não compra, não dá lance, elenco travado — NUNCA entra em leilão sozinho. Fim de temporada: mesmo time = os DOIS seguem; leilão = SÓ o clube selecionado vai (o outro aguarda e segue mesmo time); pra levar o outro, seleciona ele ANTES. Jogo entre os dois clubes do mesmo dono = 100% simulado, sem interferência. ✅ CONFIRMADO (28/07): a compra é IGUAL À SAF — escolhe um clube JÁ EXISTENTE da **Série D**, o clube vira a COR do comprador (não nasce do zero; herda nome/histórico do time de fundo). **SPEC FECHADA — mockup aprovado (artifact b0791c0d).** SAF continua como é (é outra coisa).
   - **NOME OFICIAL (29/07, escolha do Diego): 🏛️ MULTICLUBES.** Modo Empresário = a AGÊNCIA (💼 cartas), que já existe — então o gate é ter a carreira solo + Lenda + 4.000. Escopo: **SÓ SOLO** (online seria pesadelo de sync). Copa do Mundo: se os DOIS clubes estiverem no top-16, você joga com o SELECIONADO; o que dorme é auto-jogado pela CPU (pode até ser campeão pela máquina). Você escolhe qual joga selecionando antes.
   - **EM CONSTRUÇÃO, INVISÍVEL PRO PÚBLICO** (igual basquete): trava `MULTICLUBE_TESTERS` em `pyramidseason.tsx` (só `diego.c.fonseca@gmail.com` vê). Liberar só quando pronto+aprovado.
   - ✅ **FASE 1 (a COMPRA) FEITA (29/07):** estado `multiClube` (types.ts) · ação `BUY_MULTICLUBE` (store.tsx: solo, 4.000 moedas, clube da Série D não-seu/não-rival) · painel `MultiClubeBuy` na aba Clube (gated + travas: só Lenda / faltam X moedas / lista de clubes da Série D). Reversível, isolado.
   - ✅ **FASE 2 (motor da troca) FEITA (1º corte, 29/07):** DECISÕES do Diego: TUDO SEPARADO (não mistura caixa/extrato/rank/títulos/estádio/agência/SAF); troca SÓ entre temporadas (tela de fim); clube que dorme = congelado "mesmo time" (não vai ao leilão, mesma escalação); carta do clube que dormia APARECE quando você troca pra ele (você abre). Motor: BUY vira o clube da Série D num assento MEU independente (id próprio → caixa/títulos/estádio já separados); SWITCH_MULTICLUBE troca youIdx + swap dos campos únicos (extrato/SAF/patrocínio/agência) via stash; `dormindo` excluído de `auctioningManagers` (não dá lance); seletor na tela de fim de temporada. Gated (MULTICLUBE_TESTERS). **FALTA testar/afinar:** (a) extrato do clube que dorme pode cair no do ativo (campo único do solo) — rever.
   - ✅ **FASE 3 FEITA (1º corte, 29/07):** (a) **CARTA-esperando** — quando o clube que DORMIA foi campeão (título de divisão e/ou Copa Legends), a carta fica GUARDADA (`multiClubePendingCards`, keyed por id → separado) e o pacote aparece na tela de fim de temporada pra VOCÊ abrir assim que passa o comando pra ele (`recordDormantCards` no fim de temporada + `CLEAR_MULTICLUBE_PENDING` ao abrir). (b) **Copa do Mundo** e (c) **jogo entre os 2 clubes** já saem de graça da arquitetura da Fase 2: o clube que dorme entra no top-16 como CPU (auto-jogado, pode ser campeão pela máquina) e o assento dele NÃO tem input humano (`youIdx` só aponta pro ativo) → jogo entre os dois é 100% simulado. **BUG corrigido de tabela:** o 2º clube é `isHuman` (assento meu), então o SOLO ia cair no fluxo de VOTAÇÃO online — agora `humans` exclui `dormindo`. Gated. **REVERSÍVEL** (tudo atrás da trava de tester; nada toca o jogo do público). **FALTA testar com save real do Diego** + afinar extrato do clube dormindo.
   - ✅ **SELETOR LIVRE — Opção B (FEITO 31/07, aprovado pelo Diego, commit af96129):** trocar de clube A QUALQUER HORA (não só entre temporadas). Seletor na aba **Clube** (`pyramidseason.tsx`): mostra os 2 clubes (ativo/dormindo) + botão. **Travas com aviso claro:** no meio de rodada/Copa animando → "deixe a rodada/Copa acabar"; fora do leilão é garantido (leilão é outra tela). **AUTO:** botão "Trocar no fim desta rodada" → espera o apito e abre o confirmar sozinho (`multiPending` + efeito). **MANUAL:** troca direto entre rodadas. **Modal de confirmar** com a explicação (o outro dorme "mesmo time"; empréstimo acaba na virada e repõe titular; nada mistura). Reducer `SWITCH_MULTICLUBE` já suportava mid-season (era só a UI que limitava). Só solo/tester. **FALTA CONFIRMAR num teste real:** (a) trocar no meio da temporada não bagunça a sim; (b) o empréstimo do clube DORMINDO realmente acaba na virada e o titular do próprio clube repõe (nunca 10) — o texto do modal promete isso; validar. **Falta (opcional):** banner mais festivo "acabei de comprar o 2º clube" (hoje o seletor + nota já explicam ao aparecer).
   - ✅ **BUG "virei o bot / não consigo dar lance" no ONLINE RÁPIDO após "novo leilão" (FEITO 31/07 — ocorreu com o Diego, não-host):** depois do "novo leilão" (rematch, mesma sala, ninguém saiu), o índice local "quem sou eu" (youIdx) DESLIZOU e passou a apontar pra um assento de BOT (o "Biriba United", elenco completo, 💰0) — a pessoa só ASSISTIA, não dava lance, e o assento humano dela ("Neymarzetti", 💰100, 0/11) ficava órfão esperando lacrar. **RAIZ (screens.tsx `startLeilao`):** o INÍCIO da sala (lobby) DEDUPLICA os `room_players` por usuário e usa a POSIÇÃO na lista limpa como número do assento; o "novo leilão" lia os `room_players` CRUS (sem dedup) e montava os assentos noutra ordem. Reconexão/refresh no meio do jogo pode deixar vaga DUPLICADA no banco → a revanche montava os assentos deslocados e o youIdx (preservado do jogo 1) caía num bot. **Fix (raiz):** o `startLeilao` agora deduplica igual ao início e usa a posição na lista limpa (`playerIndex = minha posição`) — ordem dos assentos IDÊNTICA ao jogo anterior, ninguém desliza. **Rede de segurança (store.tsx):** a AUTO-CURA de identidade tinha um buraco — só reancorava quando eu caía em cima de OUTRO HUMANO; caindo num BOT, desistia. Agora reancora também no bot/assento vazio (se existe exatamente 1 humano com o meu nome) e o nome tem fallback pro começo do e-mail. Identidade 100% LOCAL. Isolado, revertível.
   - ✅ **BUG do LEILÃO TRAVANDO no 2º clube (FEITO 31/07 — testers denilson/"Denis" travados no "TEMPO 0s"):** RAIZ (commit 25cf656): em `RESERVE_AUCTION_ONLINE`, TODO clube `isHuman` virava `deepSquad` (mira 22) — inclusive o DORMINDO. Aí os DOIS clubes entravam no MESMO leilão de reservas, o pregão pulava entre eles (o tester relatou: travou no zagueiro do time 2 e "pulou pro time 1" que também faltava zagueiro) e travava (o dormindo nunca lacra). **Fix: só o clube ATIVO (`isHuman && !dormindo`) vira deepSquad e entra no leilão** — o dormindo segue "mesmo time" fora do pregão. **Redes de segurança (commits e8ff0ef, dd9eb24, 8088a5f, 70e283d):** no SOLO, só o assento ATIVO (youIdx) conta pra lacrar (`humansToSubmit`), pescar (`buildMonteOrder`) e reiniciar (`humanManagerIds`); e um **FORCE_SEAL no tempo-0** destrava QUALQUER leilão solo já preso (inclusive quem já tinha lacrado — no solo a tela de lance aparece mesmo pós-lacre, então o auto-lacre não re-disparava). **No-op em jogo normal (ninguém `dormindo`; 1 humano = youIdx).** Save preso se recupera ao pegar a versão NOVA (recarregar forte).
   - ✅ **BUG "os 2 clubes com o MEU nome" + "Dedé bigode aguardando na sala" (FEITO 31/07 — Denis, save do 2º clube):** RAIZ: `RESUME_CAREER_SOLO` (store.tsx) forçava `youIdx: 0` ao recarregar. Na carreira normal o técnico é sempre o assento 0 — mas com MULTICLUBES o comando pode estar em OUTRO assento (você trocou de clube). Aí, no reload, o jogo voltava pro assento 0 enquanto `multiClube.team` ainda apontava pro clube que ESTAVA no 0 → o seletor mostrava **os DOIS clubes com o mesmo nome (o seu)**, e o clube que você comandava de verdade virava "outro humano na sala" (aparecia como `Fulano aguardando na sala` no leilão, mesmo sendo carreira SOLO). **Fix: com multiclube, ao recarregar eu reancoro no assento ATIVO (o humano que NÃO está `dormindo`); sem multiclube segue 0 — no-op no jogo normal.** Só solo/tester, isolado, revertível (1 commit).
   - ✅ **SAF ÚNICA COMPARTILHADA pelos 2 clubes (decisão do Diego 31/07, FEITO):** só existe UMA SAF; ela fica **grudada no clube ativo** pra novos empréstimos, e é um **bolo compartilhado** — se a SAF tem 4 jogadores e um clube pega 2, sobram 2 pro outro (o jogador emprestado sai fisicamente do elenco da SAF, então o outro clube só vê o que restou). **Implementação (store.tsx):** (1) `SWITCH_MULTICLUBE` **não faz mais swap da `careerFilial`** — a SAF segue igual ao trocar de comando (migra automático uma SAF que save antigo tenha guardado no clube que dormia). (2) cada empréstimo é carimbado com `byClub` (qual clube fez) → na virada/venda o `revertFilialLoans` devolve pro clube CERTO e tira o jogador da SAF de QUALQUER elenco seu por id (nunca duplica, mesmo se estava no clube que dormia). (3) o limite de vagas por divisão conta só o que ESTE clube emprestou (o do outro não gasta a sua vaga). **No-op na carreira normal (1 humano, sem `byClub` = comportamento idêntico ao de antes).** Só solo/tester, isolado, revertível. **FALTA testar num save real:** trocar de clube + emprestar dos dois + virar a temporada e conferir que cada empréstimo volta certo e ninguém joga com 10.
   - ✅ **BUG "carreira OFFLINE caindo em VOTAÇÃO" + "Você" no lugar do nome do time (FEITO 31/07 — Diego):** a tela de fim de temporada mostrava a VOTAÇÃO online (chips "Tokyo City Esperion ✓" + "Você", "Aguardando votos 1/2") numa carreira SOLO. RAIZ: `humans = managers.filter(isHuman && !dormindo)`; num save de multiclube TORTO os DOIS clubes estavam como humanos ATIVOS (o dormindo perdeu a flag) → `humans.length === 2` → caía no ramo online da votação. **Fix A (pyramidseason.tsx):** a votação é SÓ do online — `if (state.onlineMode !== 'online' || humans.length <= 1)` cai sempre no ramo solo (decisão de UM clube, sem voto). **Fix B (store.tsx `normalizeMultiSeats`):** ao carregar/retomar, crava exatamente 1 humano ativo + o `dormindo` certo (usa `multiClube.id`, que é sempre o que dorme) e reancora o `youIdx` — repara o save torto e protege o leilão de reentrar o dormindo. Roda nos 2 caminhos de retomada. No-op sem 2º clube. Isolado, revertível.
   - ✅ **BUG "entrei com outra conta no meu aparelho e ela viu meus saves" (FEITO 31/07 — Diego logou na conta do Denis no celular DELE pra testar; depois a carreira "Neymar" do DIEGO apareceu na conta do DENIS):** RAIZ: na nuvem cada carreira já é por CONTA (`esc_pyramid_saves`, `user_id`) — o backup de cada um está intacto. Mas os saves LOCAIS do aparelho (`esc-solo-career` + `esc-career-archive` + resume) eram COMPARTILHADOS: quando o Diego logou na conta do Denis, o `savePyramidCloud`/`syncCareersWithCloud` juntou os saves LOCAIS do Diego na nuvem do DENIS (vazou a carreira do Diego pra conta do Denis). **Fix (store.tsx):** carimbo de DONO do aparelho (`esc-career-owner` = user_id) + COFRE por conta (`esc-career-vault::<uid>`). `ensureCareerOwner(uid)` roda antes de subir/juntar na nuvem: mesma conta = no-op (caminho quente intocado); 1ª vez sem dono = a conta atual assume o que já está no aparelho (grandfather, ninguém perde); conta DIFERENTE = guarda a anterior no cofre (não perde nada), limpa o compartilhado e restaura o cofre da conta que entrou. Agora **o que manda é o login, nunca o aparelho.** No-op pra 99% (1 conta/aparelho). Isolado, revertível. **FALTA:** limpar o que JÁ vazou pra conta do Denis (as carreiras do Diego que já subiram) — apagar pelo seletor de saves na conta do Denis (o delete tira da nuvem também) OU limpeza cirúrgica no Supabase (com OK do Diego).
   - ✅ **VERIFICADO no save REAL do Denis (denilson.stifler10) — "cartas embaralhando entre os 2 clubes" NÃO reproduz mais (31/07):** o Denis relatou que o elenco do time 1 aparecia no time 2 (comandava o time 2 no leilão e os jogadores caíam no time 1). Inspeção do save de verdade (`esc_pyramid_saves` no Supabase, projeto `faabglpjutwursgmrpny`): carreira multiclube na temp. 180 (Tokyo City Esperion id 0 · Inter Estadual id 11), os **DOIS elencos 100% separados (0 carta em comum), cada um batendo com o próprio extrato — nada foi perdido**. Peguei o Denis JOGANDO ao vivo: passou o comando pro Inter (time 2), arrematou o Ronaldinho no leilão → entrou no **Inter**, e o **Tokyo ficou intacto** (mesmos 16). Ou seja, na versão de hoje o roteamento está certo (carta vai pro assento no comando = `youIdx`; o clube que dorme fica fora de leilão/monte/lacre). O relato era da versão ANTIGA — a leva de fixes de multiclube de hoje (dormindo fora do leilão de reservas · reancorar assento no reload · `normalizeMultiSeats`) fechou a classe do bug. **Denis reconfirmou por teste: deu certo.** Regras reconfirmadas com o Diego e batidas com o código: (a) compra um clube da Série D e as lendas/jogadores que ele JÁ tinha **continuam** (BUY_MULTICLUBE não toca no `squad`); (b) o **nome do clube comprado se mantém** (não renomeia — só veste a cor do dono, igual à SAF); (c) fake/perna-de-pau do clube comprado **fica** (cerimônia só tira fake de BOT, `if (m.isHuman) continue`); (d) **um leilão por temporada, só do time no comando** — o outro fica "mesmo time" congelado; pra renovar o outro, seleciona ele antes numa temporada seguinte (alterna, nunca os dois no mesmo ano). Nenhuma linha de código mexida nesta sessão (só diagnóstico) → nada a reverter. **Oferta em aberto:** trava defensiva "carta arrematada sempre vai pro assento no comando; se os 2 clubes divergirem, corrige na hora" (no-op em carreira de 1 clube) — só se o Diego pedir.
   - ✅ **EMPRÉSTIMO DA SAF AGORA PERSISTE (pedido do Diego 01/08 — "muita gente reclamando que tinha que refazer o empréstimo TODA temporada"; aprovou "pode fazer tudo"):** o empréstimo NÃO volta mais sozinho na virada — **fica valendo até você trazer de volta** (quem quiser mexer mexe, quem não quiser mantém). As 4 travas combinadas e feitas (store.tsx): (1) `trimFilialLoansToDivision` substitui `revertFilialLoans` em `NEXT_SEASON_ONLINE` e `OPEN_RESERVE_LIST` — roda DEPOIS de gravar `careerPlacements` (divisão nova) e só devolve o **EXCEDENTE** quando você **rebaixa** e a SAF perde vaga (D1·C2·B3·A4); (2) emprestado **travado pra venda/lista** — guarda novo em `TOGGLE_RESERVE_LIST` (`if (card.emprestado) return s`) + a UI já bloqueava (`canList`); (3) **botão manual "↩️ trazer de volta / devolver pra SAF"** em cada empréstimo (ação `RETURN_FILIAL_LOAN`, os 2 sentidos, online+solo+multiclube por `byClub`); (4) **vender a SAF** (`SELL_FILIAL`) e **novo leilão** (`REAUCTION_ONLINE`) continuam devolvendo TUDO (mantêm `revertFilialLoans`/`returnFilialLoansFor` — reset total). **Aviso na tela:** `filialTrimNotice` (types.ts) conta quantos voltaram por rebaixamento → banner âmbar na aba Estádio/SAF (dispensa no ×, ação `CLEAR_FILIAL_TRIM_NOTICE`). Textos da SAF atualizados ("fica valendo até você trazer de volta"; regra "só volta sozinho o excedente se cair de divisão"). **No-op pra quem tem 1 clube e não rebaixa.** Isolado, revertível (reverter os commits desta entrega volta ao "devolve tudo na virada"). **FALTA testar num save real:** emprestar, virar 2-3 temporadas sem mexer (deve continuar valendo), rebaixar com a vaga cheia (deve voltar só o excedente + aviso), e usar o botão de trazer de volta pra depois vender.
6. 📯 Buzina da Zoeira (sala de espera online) FEITA (3 memes: 📞 posso-te-ligar · 🎙️ meme2 · 🗣️ SIIIIUU (28/07) + regras: 30s/pessoa, 1 som por vez, assinatura, mudo). Áudio "faah" na LENDA (pega/vende) FEITO. **Ampliar cardápio**: Diego manda MP3s novos (myinstants) → entram como botões novos. Futuro possível: buzina TAMBÉM dentro do leilão.
7. 🖋️ **FUNDADOR + grupo VIP no APOIE — ✅ NO AR (27/07, aprovado em mockup):**
   - Lenda 👑 agora anuncia: **grupo privado no WhatsApp** (galera do online + Diego criador) e **os 100 primeiros Lendas = FUNDADORES** (selo 🖋️ eterno do lado do 👑 → "Nome 👑🖋️" + mural "Fundadores do Leilão Legends"). Textos em: tela inicial do APOIE (box roxo "Só pra quem é Lenda"), fileira/expandido do ouro na tela de cores, escadinha do Manual e box do Batismo. Clareza de cor por tier (💎/⭐ dizem "nome, elenco, estádio — todos os modos"; ouro só "dourada em todos os modos").
   - **Contador de vagas é MANUAL**: const `FUNDADOR_VAGAS` em `screens.tsx` (começou em 77). Cada Lenda confirmado no Instagram → baixar 1 aqui.
   - ✅ **Grants de FUNDADOR ativos (28/07, apoio.tsx: FOUNDERS ouro + FUNDADOR_N)**: nº 3 cesar.verissimo27@gmail.com · nº 9 dasilva1227br@gmail.com · nº 11 davisantana1312@gmail.com · nº 12 ambielvictor@gmail.com · nº 13 denilson.stifler10@gmail.com (número 13 foi ESCOLHIDO pela sessão — Diego não informou; se ele corrigir, trocar no FUNDADOR_N) — selo 🖋️ gruda no 👑 via apoioSelo/apoioName. Prata (Craque) avulsos: victorreservauso@gmail.com · venturakaua2@gmail.com. Grant novo = 2 linhas nesses dois mapas.
   - **FALTA (combinado, ainda não feito):** (a) mural "Fundadores do Leilão Legends" dentro do jogo (tela/lista); (b) mecanismo de GRANT do selo 🖋️ (hoje: quando o Diego confirmar um fundador, a sessão adiciona o 🖋️ junto do selo 👑 no nome — perkFromSelo continua achando o 👑, então a cor/tier não quebra); (c) criar o grupo real no WhatsApp (Diego cria, link fica com ele — o jogo só anuncia); (d) stories futuros: um SÓ do fundador (Diego pediu pra depois).
   - Artes prontas: mockup APOIE (artifact d08cedfd) · stories em VÍDEO MP4 1080×1920 sem preço (Lenda completo + Fundador 77 vagas) — enviados no chat de 27/07.
8b. 🃏 **2º lote de cartas do Diego — ✅ NO AR (30/07):** +16 cartas novas. **BR:** Edinho (goleiro filho do Pelé, Santos), Leandro Ávila (Botafogo 95), Vinícius Pacheco (Paraná), Gonzalo Plata (Flamengo), Vitor Roque (Barcelona)=foi profissional. **EU:** Luca Zidane (goleiro filho do Zidane, foi prof.), Federico Valverde (craque), Çalhanoğlu (craque), Arda Güler (promessa), Brahim Díaz (bom jog.), Ben Arfa (craque folk), Roque Santa Cruz (bom jog.). **WORLD:** Papa Bouba Diop (bom jog. folk), Gilberto Mora (promessa), Carlos Vela (bom jog.), Hirving Lozano (bom jog.). **Ajuste:** Vitor Roque (Athletico-PR) virou promessa (par com a carta do Barcelona). **JÁ EXISTIAM (não dupliquei):** Zamorano, Recoba, Marcelo Salas, Son Heung-min, Makélélé (Chelsea), Fábio Baiano, Carlos Germano, Hélton. Cada carta = 1 linha em `data.ts`, revertível.
8. 🃏 **Cartas novas do Diego (reais + folclóricos) — ✅ NO AR (30/07):** 19 cartas nos 3 baralhos (BR/EU/WORLD) + Leynny. **ESCALA OFICIAL DO DIEGO (gravar): fame 1=foi profissional · 2=bom jogador · 3=promessa · 4=craque · 5=lenda; folclórico é marca à parte (`folk`), pode estar em qualquer categoria.** Ajustes 30/07: James Rodríguez (SP)=bom jogador (2) e removida a carta DUPLICADA (já existia no baralho); Loide Augusto (Vasco)=foi profissional (1, topo da faixa); Fabrício/Douglas Barriga de Cadela/Valdir Papel/Leynny=foi profissional (1); Sérginho/Javi Varas(folk)/Sugawara=bom jogador (2); craques (Doku/Koke/Marcos Senna/Kagawa/Caicedo/Kubo)=4. **A CONFIRMAR com o Diego:** Kubo ficou craque (4) — ele pode querer promessa (3). Cada carta é 1 linha em `data.ts` (revertível fácil).

## 🎴 Carta do campeão (visibilidade + garantia) — EM ANDAMENTO (30/07)
Diego: "muita gente diz que às vezes NÃO CONTA ou NÃO APARECE" a carta do campeão. Quer o banner **na cara** na hora que ganha, 1 toque pra abrir (mais suspense), e **conta mesmo sem abrir/sair**. **Regra nova (importante): a carta é PRIVADA do campeão** — cada um só vê a SUA; amigo ganhou não muda nada na minha tela (CPU e online). Vale campeão de QUALQUER série (A·B·C·D), Copa Legends, **Copa do Mundo** e qualquer copa/liga NOVA. **Sempre só o vencedor.** **Mockup APROVADO** (artifact "Mockup — Carta do Campeão (banner na cara)", favicon 🎁).
- ✅ **"Conta mesmo sem abrir" (FEITO, commit eca786c):** `CardCollectPrompt` (screens.tsx) grava a carta na conta ASSIM QUE o campeão cai na tela (sorteia + `persist` resiliente), antes de qualquer toque. Abrir vira só a cerimônia. Idempotente pelo `season_key`. Na carreira online (careeronline.tsx, escolher do elenco) adicionei guardião de SAÍDA: sair sem escolher grava uma do time. Isso conserta o "não conta" e boa parte do "não aparece [no álbum depois]" (que era save perdido por rede/saída).
- ✅ **Copa do Mundo agora dá carta (FEITO, commit b9803fd):** antes só dava estrela no mural; agora o campeão do mundo ganha a carta surpresa (privada, mesma garantia). `CardCollectPrompt` na cerimônia de `copa-mundo.tsx` (`you` virou opcional no componente). seasonKey `copamundo:seed:temporada`.
- ✅ **Privacidade já estava certa no modo normal:** só o campeão renderiza `CardCollectPrompt` (`youWon`/`copaChampIsYou`); o `StreamSpectatorCard` (sala vê a carta) é EXCLUSIVO do modo STREAM (broadcast proposital). Ninguém mais vê no CPU/online comum.
- ✅ **"Pular NA CARA" (popup, FEITO — commit 7beadc7):** `CardCollectPrompt` virou POPUP por cima da tela (portal, fundo escurecido, entra com pop) na hora do título. Diego escolheu **"toca fora e segue"**: tocar fora / no ✕ fecha e segue o jogo na hora; fechou vira pílula "🎁 Ver a carta do campeão" pra reabrir. A carta já está gravada (não depende de abrir). Vale nos sites que usam `CardCollectPrompt`: fim de temporada do rápido (liga+copa), carreira pirâmide (divisão+Copa Legends), Copa do Mundo.
- ✅ **Trava online SOLTA (FEITO — commit 7beadc7):** `awaitingCard = false`. Como a carta é garantida na hora, a sala não espera mais o campeão abrir. "Amigo ganhou não trava ninguém" (decisão do Diego).
- 🔜 **Falta afinar/rever:** (a) `careeronline.tsx` (carreira online legado, escolher-do-elenco) ganhou a garantia de gravar, mas ainda NÃO virou popup — decidir se entra no mesmo popup ou fica inline. (b) Se ganhar liga E copa na mesma temporada = 2 popups empilhados (raro) — ver se incomoda. (c) Testar com conta real: campeão vê o popup, fecha, carta no álbum; amigo não vê nada.

## 💾 Save de carreira (integridade) — EM ANDAMENTO (30/07)
- ✅ **Bug Felipe (perdeu tudo):** celular limpou os dados → gravava carreira zerada por cima do backup. **CONSERTADO**: `savePyramidCloud` agora LÊ a nuvem e JUNTA (`mergeCareers`), nunca sobrescreve o cheio com o vazio.
- ✅ **Bug Matheus (rollback 370→345):** em "conflito" a nuvem atrasada ganhava do local mais novo. **CONSERTADO**: ganha sempre a carreira MAIS AVANÇADA (maior `seasonNo`; empate = `at` mais novo). Removida a trava de versão (pyrCloudBaseIso). Apagar carreira usa `removeCareerFromCloud(seed)` (preciso, não ressuscita no merge). Commit isolado, reversível. **FALTA o Matheus testar e confirmar.**
- 🔜 **Felipe:** carreira antiga não recuperável (não está mais no backup); daqui pra frente não perde. Ver se Supabase tem backup antigo (chance baixa).
- ✅ **LOGIN OBRIGATÓRIO NA CARREIRA — FEITO (30/07, mockup aprovado):** `CareerLoginGate` (screens.tsx) — tela "Sua carreira mora na sua conta" (roxo/creme/Oswald) com Entrar/Criar conta (reusa GO_LOBBY_ONLINE → "esqueci a senha" vem junto). Gate `startCareer()` confere `getSession()` em TODA entrada de carreira (botão CARREIRA POR DIVISÕES, banner "Continuar", lista trocar-save, nova carreira, e o SoloContinueBanner secundário). Sem login/sessão caída → mostra a tela; dá pra voltar pra home (✕). Partida rápida/leilão avulso seguem sem login. Save local não é apagado — sobe pra conta ao logar (merge). **FALTA testar com conta real.**
- 🔜 **PLANO base (decisão do Diego 30/07): LOGIN = a verdade.** Exigir login pra carreira (anônimo perde ao limpar navegador/trocar de navegador — é o buraco que sobra). Cuidado: NÃO quebrar quem já joga carreira local sem login (grandfather + subir o save ao logar). UI nova (tela de login na hora) = mockup primeiro. Regra mestra: a conta manda; multi-carreira/multi-aparelho já resolvido pelo merge (mais avançada por seed).

## ⚙️ Mecânica de carreira (formação / elenco / lesão) — 30/07
- ✅ **Troca de formação pelo MÍNIMO por posição (FEITO):** não exige mais 22 nem "teto". Troca pra qualquer formação que consiga preencher com jogadores REAIS e SEUS por posição; emprestado NÃO conta (volta na virada, nunca deixa sem jogador em campo); fake nunca entra. Aviso claro do que falta. (`CHANGE_FORMATION` store.tsx + UI pyramidseason).
- ✅ **Formação 4-5-1 (FEITO):** GOL1·LAT2·ZAG2·MEI5·ATA1. Troca TÁTICA na carreira (precisa de 5 meias) — INÍCIO segue só 4-3-3/4-4-2 (base do leilão; seletor do setup fixado). Motor/campo/escalação dirigidos pela formação (se adaptam sozinhos). **FALTA:** olhar o campo do 4-5-1 no olho (5 meias na linha) e testar troca com save real.
- ✅ **Aviso de VENDA de reserva (FEITO):** a tela "Listar pra leilão" ganhou banner vermelho + texto que abre com a PERDA, badge "🔴 N à venda", jogador listado fica vermelho "🔴 À VENDA (tirar)". Trava de venda conta só jogadores SEUS por posição (emprestado não conta — fechou o furo). O jogo nunca tira ninguém sem a pessoa listar de propósito.
- ✅ **Goleiro não é mais artilheiro (FEITO):** peso de gol do GOL zerado (só Chilavert/Ceni levam 0.05 de brincadeira) — em `pyramidseason.tsx` e `store.tsx`.
- ✅ **Fim da "temporada idêntica" (FEITO, 30/07):** a carreira ONLINE mantinha a MESMA semente entre temporadas → todo ano a mesma goleada, contra o mesmo time, na rodada 1. Corrigido em 2 camadas: (1) `seasonSeed = seed ^ seasonNo` → RESULTADOS variam a cada temporada; (2) rodízio de calendário (embaralha qual time ocupa cada vaga do round-robin pela semente da temporada) → o ADVERSÁRIO de cada rodada muda a cada ano. Determinístico (mesmo calendário/placar em todos os aparelhos no online). Solo já variava (re-sorteia a semente). Copa já variava (`seed ^ seasonNo`, linha 227). Commits isolados/revertíveis (0ce2547 + 92fc05c). Elenco de CPU segue estável entre temporadas de propósito (memória de mercado — não é bug).
- 🔜 **LESÃO (a bolar depois, decisão do Diego): regra-mestra de segurança = só lesiona se tiver RESERVA de verdade na posição** (real na posição > o que a formação usa) → banco cobre, nunca fica furado. Raro, 1-3 rodadas, substituto automático, cura sozinho, aviso sem spoiler. Empréstimo pode servir de reserva na temporada.

## 🚫 Auditoria de SPOILER / previsibilidade (pedido do Diego 30/07 — "está tudo escrito antes de jogar")
- ✅ **Artilharia da COPA LEGENDS vazava (FEITO, print do Diego — Temp. 4, oitavas rolando, Neymar já com 9 gols):** o mata-mata é pré-calculado inteiro, mas a artilharia somava TODAS as fases (quartas/semi/final que nem rolaram na tela). Agora conta só as fases JÁ APITADAS (`copaScorersShown` reconstruído dos gols revelados por fase): oitavas rolando → artilharia da Copa vazia (mostra a do campeonato); a cada fase que fecha, entram os gols dela; no fim, tudo. Commit c64e617, isolado/revertível.
- ✅ **Varredura do resto do reveal (auditado, JÁ estava certo):** liga usa `shown`=`revealed` (tabela e artilharia só até a rodada apitada); chave da Copa Legends fatia por `reveal` (`copaFinished ? n : copaRound`); Copa do Mundo (`copa-mundo.tsx`) grupos por `shownRounds`, mata-mata ao vivo, artilharia só na cerimônia. Só `live.matches` (o jogo que anima na tela agora) usa o resultado completo — é intencional (é o placar rolando).
- ✅ **SPOILER dos PÊNALTIS (FEITO 30/07, commit b060f25 — print do Diego):** a disputa de pênaltis mostrava "✅ Fulano avança" + riscava o perdedor NA HORA do apito, antes das cobranças animarem. Corrigido: `CopaLiveMatch` (Copa Legends) e `tieRow`/final (Copa do Mundo) seguram o "avança"/placar dos pênaltis até `pensRevealDelay` (última cobrança na tela). A Copa dos 8 do rápido já fazia certo (modelo). **A auditoria anterior tinha PASSADO BATIDO nos pênaltis — lição: conferir todo reveal de mata-mata, não só tabela/artilharia.**
- ✅ **Auditoria independente do MOTOR (30/07, "joguei" 5+ temporadas via SSR):** tabelas íntegras (pts=3V+E, 38 jogos, GF=GA), Copa consistente (pênalti só em empate, chave 8→4→2→1, sempre campeão), determinístico (online seguro), goleiro não marca (só Ceni). **Conclusão: o motor/lógica está limpo; os erros que o Diego vinha sentindo são todos da família "tela revela antes da animação" (spoiler) — goleada idêntica, artilharia da Copa e pênaltis, os três já corrigidos.**
- ℹ️ **Tática/formação/substituição VALEM mesmo:** a simulação usa a tática e a escalação do humano por rodada (`tacAt`/`lineupAt` em `simDivTo`/`rollForm`) — não é enfeite. O que dava a sensação de "escrito" era o spoiler (ver o resultado antes) + a repetição idêntica entre temporadas — os dois já corrigidos.
- ✅ **AUDITORIA COMPLETA — TODOS os modos/ligas/copas (pedido do Diego 30/07, "ataque tudo"):** varri o reveal e a semente de cada modo. Achei **UM** spoiler real (artilharia da Copa Legends, já corrigido acima); todo o resto **já tinha trava**. Também rodei o motor REAL por 6 temporadas (SSR do Vite + Node) e confirmei por número: adversário da rodada 1 = 6 de 6 diferentes; campeão = 5 de 6 diferentes; goleiro não marca (só Rogério Ceni 1 gol, exceção proposital); artilharia da Copa cresce fase a fase (39→50→63→65).
  - **SPOILER por modo:** Carreira liga (segura com `revealed`) ✅ · Copa Legends chave (`reveal` fase a fase) ✅ · Copa Legends artilharia (era o furo → `copaScorersShown`) ✅ · Copa Legends campeão (só quando `finished`, ChampionsPanel gated) ✅ · Jogo rápido liga (`resultRevealed`/`holdResults`/`leagueBeforeResults`) ✅ · Copa dos 8 do rápido (jogada perna a perna, `qc.scorers` acumula no `PLAY_COPA_LEG`) ✅ · Copa do Mundo (grupos por `shownRounds`, mata-mata ao vivo, artilharia só na cerimônia) ✅ · Dinastia (mesmo motor round-a-round do rápido) ✅ · Basquete liga/playoffs (mesmo motor, "zero spoiler") ✅ · Giro/manchetes e aviso pessoal G4/Z4 (usam a posição EXIBIDA) ✅.
  - **PREVISIBILIDADE por modo:** Carreira online "mesmo time" (era semente fixa → corrigido: `seasonSeed` + rodízio de calendário) ✅ · Carreira solo (re-sorteia) ✅ · Jogo rápido/Dinastia (`redraftSeason` re-sorteia a semente e o baralho) ✅ · Copa Legends e Copa do Mundo (`seed ^ seasonNo`) ✅ · Basquete (`NEXT_NBA_SEASON` re-sorteia) ✅ · Online por sala (`hashCode(roomCode)`, revanche muda a semente) ✅. **Intencional (não é bug):** elenco dos times de CPU é estável entre temporadas (memória de mercado — quando sobe/desce leva o mesmo elenco).
- ✅ **2ª VARREDURA (31/07 — 5 frentes paralelas de auditoria de código; Diego mandou "arruma tudo menos o patrocínio + mais narração"). A 1ª auditoria tinha PASSADO BATIDO em spoilers de TEMPO/UI — corrigidos agora:**
  - **[ALTA] Spoiler na marcha LENTA (🐢) da carreira pirâmide:** o `revealed` (segura tabela/artilharia) usava `ROUND_MS` FIXO em vez de `ROUND_MS/velocidade` — no 🐢2×/4× a partida animava 15-30s mas a tabela/artilharia soltavam aos ~7,7s (jogo ainda no 24'-48'). Corrigido em `pyramidseason.tsx` (acompanha a velocidade, igual ao card e ao `endShown`). Lição de novo: **spoiler de TEMPO, não só de gate.**
  - **[ALTA] Leilão — vencedor VERDE antes do martelo:** a linha do maior lance entrava já verde em ~0s (martelo só em `hammerDelay`). Agora: lances revelam do MENOR pro MAIOR (casa com "pote crescente") e o verde só no `hammered` (martelo). `screens.tsx`.
  - **[MÉDIA] Artilharia da liga OFFLINE não segurava:** o total do artilheiro subia com o jogo animando (entregava gol do adversário). Novo `state.scorersPrev` (foto pré-rodada no `PLAY_ROUND`) + `hold` no `TopScorersBox`. `types.ts`/`store.tsx`/`screens.tsx`.
  - **[MÉDIA] Carta surpresa:** nome real estava no HTML (só borrado por CSS → lia no "inspecionar"). Trocado por placeholder mascarado. `screens.tsx`.
  - **[BAIXA-MÉDIA] "Giro" da carreira:** os outros jogos mostravam placar final na hora; agora ficam "🟢 em jogo" e revelam junto com o seu apito (`reveal` no `DivMatches`).
  - **[MÉDIA — bug de dado] Manchete do 17º dizia "escapou"** sendo que o 17º é REBAIXADO (caem 4). Séries A/B/C reescritas pra tom de queda. `jornal.tsx`.
  - **[MÉDIA — motor] Teto de 7 gols** no `poisson` (store + pyramid): jogo desigual não vira goleada irreal (8×0/9×0). **[BAIXA] goleiro não vira artilheiro** em elenco degenerado (total de peso 0 → não credita ninguém).
  - **NARRAÇÃO turbinada (pedido do Diego):** `LiveScoreCard` ganhou bancos variados de apito inicial (6), volta do intervalo (5), apito final (6) e selo de gol (GOOOL!/PINGOU!/NA REDE!/GOLAÇO!/ESTUFOU!... + variações de gol no fim) — determinístico por rodada/minuto (a sala vê o mesmo no online). "QUASE!" do leilão: 8→16 frases + 2º tempero (`revealIdx`). **NÃO reativei** `src/engine/commentary.ts` (52 narrações, mas CÓDIGO MORTO e com cadência de gol FIXA que o Diego odeia) — a variedade nova foi feita direto no card ao vivo.
  - **NÃO mexido de propósito (pedido do Diego):** logo de patrocínio repetido (Vadico) em `estadio.tsx` — ele quer manter.
  - **Buildado (tsc+vite OK). 4 commits isolados (pyramidseason · jornal · store+types · screens). Reversível.**

## ⚖️ Balanceamento / realismo da carreira pirâmide (31/07)
- **Análise a fundo com o MOTOR REAL** (SSR do Vite headless, centenas de temporadas simuladas — sonda de nível 60→88 em cada divisão + baseline). Veredito: **mérito e escada de dificuldade já estavam BONS** (melhor time fica na frente; D→C→B→A exige time melhor; Série A no talo = ~metade dos anos de título, corrida real). Os 2 furos reais eram **gol demais** (Série A 4,2/jogo, arcade) e **Série A com freguês** (lanterna ~12 pts; folga 1º-20º de 75, a elite era a MAIS bagunçada).
- ✅ **FEITO (só simulação da partida; NÃO tocou leilão, divisões nem dificuldade):** fórmula de gol **v3** — base/casa/peso-da-diferença menores + teto de qualidade 1.12. Resultado medido: Série A **4,2→3,1 gols/jogo**, lanterna **12→17 pts**, folga **75→66** (elite mais equilibrada); mérito/escada intactos (nível 88 = campeão da A em ~56% dos anos). **Travado por `simV`** (v3): temporada em andamento (simV<3) termina no modelo antigo, a próxima nasce no novo; carreira nova já nasce v3. Medido: **v2 byte-idêntico ao de hoje** (in-progress não muda). `pyramidseason.tsx` (GOAL_TUNE + gating) + `store.tsx` (simV 2→3). Reversível.
- ❌ **DESCARTADO com o Diego (não fazer):** "mundo evolui" (rival ganha força sozinho — briga com o leilão, que os bots já disputam) e "envelhecimento de elenco" — Diego não quis. Regra do leilão (quem vai, quantos) **NÃO se mexe**.
- 💤 **Na gaveta (ideia do Diego, é DIVERSÃO não balanceamento):** 👑 "peso da coroa" — quando você é campeão, começam a pintar **machucado / expulsão / zoeira** (Romário pulou o muro, Edmundo faltou o treino…), **mas só se tiver reserva na posição** (senão nem aparece o banner — profundidade importa, nunca deixa o time quebrado). Conteúdo em 2 camadas: banco genérico (serve pra todos) + pérolas folclóricas (`folk`) pingadas aos poucos. Fazer mockup do banner antes. Não decidido — quando o Diego quiser.

## 🏀 BidLegends
- Conceito completo: `docs/conceito-basquete.md` (pirâmide, 82 jogos, conferências, elenco 15, domínio bidlegendsarena.com).
- **Fase 1 — ✅ NO AR (fundida na main 26/07, aprovada pelo Diego):**
  - `src/escalacao/sport.ts` — detecção de esporte (hostname + override `?sport=` de teste) e **trava por conta**: basquete SÓ aparece pra `diego.c.fonseca@gmail.com` (regra do Diego 26/07: nada de basquete visível pra ninguém ainda). Pra todo o resto o app é idêntico ao futebol de hoje.
  - Seletor ⚽/🏀 no topo da home (só pro Diego) + home do BidLegends "chegando" (mesma cara, conteúdo de basquete) em `screens.tsx` (`SportTabs`, `BidLegendsHome`). Título da aba vira "BidLegends" só pra ele.
  - 🌐 **Bilíngue BR/EN**: `src/escalacao/lang.ts` (`useT()`) + botão `LangToggle` no canto direito do header do BidLegends. TODO texto novo do basquete daqui pra frente NASCE em PT+EN. Futebol NÃO se traduz.
- **Baralho NBA — 243 cartas (`src/escalacao/data-basquete.ts`), crescendo:** 5 posições (PG 52/SG 48/SF 46/PF 46/C 50), bio bilíngue PT+EN. Mistura de tiers + folclóricos/busts/brasileiros. Regras: SÓ quem jogou NBA; apelido no nome só nos marcantes. Formato espelha o `data.ts` do futebol (motor pluga direto). Prévia gerável por `scratchpad/gen-deck-preview.mjs`.
  - ✅ **Lote HOF (27/07):** +37 lendas do Hall da Fama das ERAS ANTIGAS (Oscar Robertson, Jerry West, Elgin Baylor, Havlicek, Mikan, Pettit, Cousy, Frazier, Drexler, Elvin Hayes, Nate Thurmond, McAdoo, Gilmore, English, Dantley, Bernard King, Mullin, Earl "The Pearl" Monroe, Chauncey Billups…).
  - ✅ **Lote HOF 2 — variedade (27/07):** +44 cartas VARIANDO posições E categorias (pedido do Diego): craques/modernos (SGA, Jalen Brunson, Jrue, Siakam, Randle, Sabonis, Dražen Petrović HOF), sextos-homens (Lou Williams, Kukoč, Vinnie "Microwave" Johnson), promessas (Haliburton, Franz Wagner, Paolo Banchero, Chet Holmgren), folclóricos/memes (LaMelo, VanVleet, Ben Simmons, Aaron Gordon, Kurt Rambis, Steve Francis), busts fame 1 (Anthony Bennett, Sam Bowie, Olowokandi, Thabeet), gigantes fofos (Tacko Fall) e brasileiro (Raul Neto). Agora ~48/posição → 20 times enchem quase 100% com jogador real.
  - **FALTA no baralho:** dá pra continuar (HOFers nichados + mais modernos/folclóricos) — o Diego curte engordar sempre.
- **🚨 DIREÇÃO (decisão firme do Diego 27/07): basquete = MESMO MOTOR do futebol, IDÊNTICO.** Nada de módulo/tela separada. Mesmas telas, botões, cores, fluxo (envelope→lacrar→martelo→cerimônia→temporada). Quem sai do futebol tem que entender o basquete NA HORA. Só muda o CONTEÚDO: cartas NBA, rótulo das posições (armador no lugar de goleiro), cesta no lugar de gol. Futebol fica EXATAMENTE igual (mesmo código, valores do futebol intactos; testar antes/depois; commit isolado revertível).
  - ✅ Baralho no formato do motor: `basquete-deck.ts` (`buildNbaDeck`/`buildNbaCatalog`), mapeando PG→GOL·SG→LAT·SF→ZAG·PF→MEI·C→ATA. `sportcfg.ts` = rótulos por esporte + vagas por modo.
  - ✅ **Motor sport-aware** (`store.tsx`, guardado por `ACTIVE_SPORT`, futebol byte-idêntico): `setActiveSport`, `slotsOf`/`makeBotSquad` via `baseSlots`, ação `START_NBA` (jogo rápido = 1 vaga/posição = quinteto 5, rivais = franquias NBA), `EscState.sport`.
  - ✅ **Pregão do basquete JOGÁVEL** (mesmo motor/telas do futebol): botão "Partida Rápida" na home do BidLegends → pregão cego → martelo → cerimônia. Rótulos PG/SG/SF/PF/C (`posTag`/`secLabel`), sem campinho de futebol, sem formação.
  - ✅ **QUADRA** (`NbaCourt`, aprovada pelo Diego: madeira, garrafão laranja, logo BidLegends no centro) no lugar do campinho — só no basquete, anti-spoiler reusado.
  - ✅ **Bilíngue**: textos do pregão em PT+EN (helper `L` no Envelope/RivalsStrip; futebol sempre PT).
  - ✅ **Fim coerente**: cerimônia do basquete → "Quinteto fechado! Temporada chegando" → home (NÃO cai na temporada de futebol).
  - ✅ **TEMPORADA de basquete de verdade** (rápido offline): `simMatch` com placar de PONTOS (~100, sem empate/prorrogação), `buildLeague` com franquias NBA (`NBA_CLUBS`), CESTINHA/Pontos/SC (não artilharia/gols/SG), táticas Defesa/Equilíbrio/Run-and-gun, notícias adaptadas (atropelou/pontos), `LiveScoreCard` com placar subindo até o total + selo 🏀 CESTA (via prop `basket`, só basquete). TODAS as mudanças guardadas por `sport==='basquete'` → futebol byte-idêntico (verificado no diff + setup/intro do futebol limpos).
  - ✅ **STREET LEAGUE JOGÁVEL (carreira — a base da pirâmide, 27/07):** botão "🛝 CARREIRA · STREET LEAGUE" na home do BidLegends → `START_NBA_CAREER`: liga cheia de **20 times** (CREWS DE RUA/streetball — `NBA_STREET_TEAMS`, NÃO franquias NBA, essas ficam pro topo da pirâmide; espelha a Série D de várzea do futebol), **rotação de 10** (2/posição via `setActiveSport('basquete','career')`), **100 moedas** (`NBA_CAREER_BUDGET`), pontos corridos no motor atual. Aprovado pelo Diego (print) e NO AR.
    - ✅ **Fillers/incógnitas por esporte** (`makeIncognita` com flag `nba`, `fillerCard` via `ACTIVE_SPORT`, helper `isFillerClub`): no basquete viram lendas de STREETBALL em quadras REAIS (Rucker Park, Barry Farm, Tri-State…), NUNCA mais jogador de futebol vazando. Futebol byte-idêntico (guardas caem no caminho de sempre).
    - ✅ Dica do pregão diferencia rápido (5 vagas/50 moedas) de carreira (10 vagas/100).
  - ✅ **Temporada REALISTA (27/07):** 82 jogos (não 38 — `buildFixtures` concatena turnos-returno até 82 só no basquete; ritmo do autoplay dinâmico p/ caber em ~3min). Tabela por **V-D + aproveitamento %** (sem "P"/pontos de futebol nem "E"/empate). Cestinha por **MÉDIA (ppg)** com total ao lado. **Placar inteligente:** só a rotação (~9) pontua, decaimento de posto (astro ~28%), cestinha da liga ~30/jogo com variação — calibrado por simulação. Tudo guardado `sport==='basquete'`, futebol byte-idêntico.
  - ✅ **CARREIRA COMPLETA — CICLO NO AR (28/07, autocontida no basquete, `nbaCareer`/`nbaTier`; futebol e rápido INTOCADOS):**
    - Modelo aprovado: todo time começa com o **quinteto (5)**; só VOCÊ cresce **5→10 (T2)→15 (T3)** via `Manager.nbaSlots` (slotsOf no basquete usa nbaSlots; bots ficam no 5). Reservas MANTÊM o quinteto — leiloa só as vagas novas (`NEXT_NBA_SEASON` + `NbaCareerEndPanel`, botão "Próxima temporada").
    - ✅ **Reservas** (T2 5→10, T3 10→15): leilão só pras suas vagas, `buildDeck([you])`, orçamento `NBA_RESERVE_BUDGET`. ✅ **Vender** (T3+): `TOGGLE_NBA_RELEASE` dispensa reserva fraca (trava do quinteto: mín. 1 real/posição) → repõe no leilão. ✅ **Salvar/continuar**: autosave ISOLADO na chave `bl-nba-career` (não mexe no `esc-solo-career`), card "Carreira em andamento" na home, `RESUME_NBA_CAREER` + `useResumableNbaCareer`.
    - ✅ **Subir de liga** (`nbaTier` street→gleague→nba, `NBA_TIERS`): top 4 sobe um andar; você leva o elenco, adversários viram os do andar de cima (Street 20 crews → G League 24 afiliados reais → NBA 30 franquias). Ninguém cai. Aviso "🔼 SUBIU DE LIGA" no fim.
    - 🔨 **FALTA (refinamento dos andares de cima):** conferências Leste×Oeste + playoffs top-8 + Finals + anel (cartas de campeão) na G League/NBA · dificuldade crescente por andar (hoje mesmo nível) · NBA Cup.
      - 🗳️ **REGRAS DOS JOGOS DE MATA-MATA (lembrete firme do Diego 28/07) — os playoffs/Finals do basquete SÃO IGUAIS À COPA LEGENDS do futebol:** (1) **cronômetro rolando progressivo** — placar sobe ao vivo com o relógio (reusar `LiveScoreCard`/`COPA_LEG_MS`, o mesmo do futebol; o basquete já tem o relógio de 4 quartos na partida ao vivo); (2) **simulação INDEPENDENTE do usuário** — TODOS os jogos do chaveamento simulam (não só o seu), esteja você jogando a partida ou vendo a tabela; (3) **NUNCA SPOILER em liga NENHUMA** — tabela/artilharia/chaveamento/giro NÃO revelam resultado antes da animação/apito na tela (o basquete já herda o anti-spoiler do futebol: `holdResults`/`leagueBeforeResults`).
      - ✅ **PLAYOFFS NO AR (28/07, reusa a Copa dos 8):** copaMode='liga_copa' nos andares G League/NBA (street = só pontos corridos). Cronômetro ao vivo + tudo simula + zero spoiler (herdado). ✅ **CONFERÊNCIAS Leste × Oeste**: `seedQuickCopa(nba)` = top 4 de cada conferência (id par=Leste/ímpar=Oeste), cada conf é metade da chave → campeões se cruzam nas FINAIS pelo anel. Rótulos bilíngues (SEMIS/FINAIS DE CONF. → FINAIS). **FALTA refino:** top 8 por conf (hoje 4) · séries melhor-de (hoje ida-volta agregada) · standings split por conf na tela · dificuldade já cresce por andar (Street 0/G+3/NBA+6).
  - **FALTA além da carreira:** (a) online (rápido + carreira); (b) placar com relógio de 48min/4 quartos (a partida ao vivo já tem o de quartos; o resto reusa o de 90'); (c) i18n dos textos do MARTELO/cerimônia; (d) baralho pode engordar mais.
- **DNS do bidlegendsarena.com**: registrado na **Hostinger**, falta configurar. Host = GitHub Pages, que serve 1 domínio custom só (hoje leilaolegends.com via CNAME) → 2º domínio direto no Pages redireciona pro principal. Caminho limpo p/ dividir por hostname = Cloudflare grátis na frente (Fase 2+). Pra Fase 1 NÃO precisa do domínio: a trava é por conta, o Diego testa logado no leilaolegends.com.

---

## 🔧 ONLINE travando ("erro de host" / preso no "Enviando…") — CORRIGIDO (01/08)
**Sintoma (relato do Murriz FC, sala de 8):** todo convidado (menos o host) dava
"erro de host" já no 1º leilão (goleiro); só destravava dando F5, e a cada leilão
de novo; alguém entrou na sala e não apareceu pros outros.

**Causa RAIZ (confirmada no log do Realtime do Supabase):**
`UnprocessableEntity: "Payload size exceeds tenant limit" → Sent 422`. O host
manda o estado INTEIRO do jogo pros convidados a cada mudança + a cada 3s
(heartbeat). Esse estado chega a **~80 KB** (baralho + elencos + monte + bios) e
**estoura o limite de tamanho de mensagem** do Supabase Realtime → a mensagem é
**descartada em silêncio** → o convidado nunca recebe a confirmação → trava no
"Enviando…" e acende o "host caiu". F5 só pegava o estado atual uma vez.

**Correção (`src/escalacao/netpack.ts` + `store.tsx`):** o estado agora vai
**COMPRIMIDO** no fio (lz-string vendorizado, sem dependência nova no npm).
Medido: **82 KB → ~36 KB** (round-trip idêntico, testado). Empacota como
`{ z: <base64> }`; **nada é cortado** (deck, bios, troca de host, reconexão: tudo
igual). O recebedor aceita os dois formatos (comprimido e cru) pra não quebrar na
janela de deploy; pacote corrompido é ignorado (heartbeat conserta em ~3s). Cache
por identidade evita reempacotar o mesmo estado. Futebol/solo/offline intactos
(só mexeu no broadcast do evento 'state' do online). **Revertível** (1 commit).
- ⚠️ Depois do deploy, quem estava no meio de uma sala precisa dar **F5 uma vez**
  pra carregar o código novo (host E convidados). Salas novas já nascem certas.
- 💡 Rede de segurança do lado do servidor (opcional, não feito): dá pra **subir o
  teto de payload do Realtime** no painel do Supabase — protegeria até clientes em
  cache antigo. Confirmar plano.

---

## ⚖️ JUSTIÇA DA CARREIRA — escada menos injusta (01/08)
**Problema (medido, time de lendas + forte + médio, 150 temporadas/série):** o
"bônus escondido" que os bots ganhavam por divisão era altíssimo
(`CPU_DIV_BOOST {A:6,B:9,C:12,D:2}`) — e o humano/rivais NÃO ganham. Resultado:
só time de LENDA competia na Série A (10% título), time FORTE (80) era rebaixado
94% na A / 93% na B, e time MÉDIO (68) ganhava a D e era **rebaixado da C em 99%**
→ ioiô eterno ("campeão num dia, rebaixado no outro"). O bônus ainda era torto
(C ganhava +12, mais que a A). Detalhe importante: esse bônus é somado IGUAL a
todos os bots, então nem deixava as divisões de CPU mais disputadas entre si — só
segurava o jogador (handicap invisível).
**Ajuste (aprovado pelo Diego = 2/3/4/2):** `CPU_DIV_BOOST_FAIR {A:2,B:3,C:4,D:2}`,
travado por **simV>=4** (temporada em andamento termina na escada antiga; a
próxima já entra na nova). Agora o NÍVEL REAL do time manda: lendas brigam/ganham
a A (27% título, 71% acesso, ~nunca rebaixa), forte é dono da C e briga na B,
médio ganha a D e precisa reforçar pra firmar. A sorte NÃO foi mexida (testado:
quase não muda — o vilão era o bônus). Só a simulação da carreira (solo+online);
leilão, online e futebol ao vivo intactos. `computeCopa` não usa esse bônus (Copa
inalterada). **Revertível** (1 commit).
- PRÓXIMO passo combinado: leilão mais esperto pra bots+rivais (valorizar
  lenda/craque) pra o desafio vir de adversário forte de verdade; e "real na
  frente de fake" (bot compra sobra pra tirar perna-de-pau do banco). Medir antes.

---

## 🧹 Bug "dois Van der Sar" no leilão — CORRIGIDO (01/08)
**Relato do Diego:** no leilão apareceu o MESMO jogador (Van der Sar) duas vezes —
um num time (com dono) e outro solto, como se fosse uma "sobra". Só existe 1 Van
der Sar no baralho, então é duplicata de verdade.
**Investigação:** a trava anti-duplicata (por nome+clube, `ident`) é minuciosa em
todas as fontes (mercado/listados/sobras/fichas). Rodei 6 temporadas de carreira
solo (com o mercado das fichas ativo) e NÃO reproduzi — indício de que a cópia
escapa num caso específico (online, "novo pregão", ou um SAVE ANTIGO que já
carregava a duplicata de uma versão anterior).
**Correção (universal):** `dedupeDeck` — uma peneira final que roda no ARRANQUE de
todo leilão (1ª posição, antes de distribuir), tirando qualquer jogador real
repetido do baralho (mantém o 1º; incógnitos/fake ficam, cada um é único).
Guardado por `sectorIdx===0 && sectorCursor===0` → roda 1x por leilão. Pega TODOS
os casos, inclusive save antigo. Não importa por onde a cópia entrou, ela não
chega mais na tela. Testado (2 Van der Sar → 1, fakes preservados). Revertível.
- FALTA (se voltar a aparecer): achar a ORIGEM exata — provavelmente online ou o
  "novo pregão"/REAUCTION. A peneira já mata o sintoma pra todo mundo enquanto isso.

---

## 🥅 Categoria "Várzea" (Sem craques) no rápido ONLINE (02/08)
No criar-sala do **jogo rápido online**, quando o host escolhe o baralho **🇧🇷 Brasil**,
abre embaixo a **Categoria**: **Todos (padrão)** ou **🥅 Várzea (sem craques)**.
Várzea = leilão só com **Bom jogador (fame 2/3) + Foi profissional (fame 1)** — sem
lenda/craque/promessa. Todo mundo no mesmo nível (peladão).
- Medido: BR "sem craques" = **342 cartas**, enche os **20 times sem nenhum fake**.
- Implementação: `filterVarzea` + `setActiveCatalog(league, varzea)`; aplicado no
  `START_ONLINE` SÓ quando `!career && deck==='br' && varzea` (filtra o baralho pro
  leilão E os bots de uma vez), e **restaura o baralho cheio logo após montar**.
  Testado: várzea sem craque em lugar nenhum; normal segue com craque; baralho
  restaurado depois. Europa/Todos e a carreira NÃO têm a opção. Futebol offline e
  carreira intactos. Flag `varzea` viaja na sala (game_state) → host e convidados
  pegam igual. Marca "🥅" na lista de salas. Revertível.

## 🏷️ Auditoria de nível do baralho BR — craques presos na várzea (02/08)
O Diego reclamou que a Várzea tinha **craque de verdade** (Zinho, Weverton,
Veiga…) marcado como "bom jogador" → apareciam no peladão. Auditei as 340 cartas
do pool (BR, fame ≤ 3). **40 correções** aprovadas pelo Diego:
- **Subiram pra CRAQUE (fame 4) → saíram da várzea (37):** Weverton, Leonardo,
  David Luiz, Lugano, Edmílson, Oscar, Zinho, Raphael Veiga, Mascherano,
  Zé Roberto, Gerson, Renato Augusto, Denílson, Giovanni, Hernanes, Depay,
  Everton Cebolinha, Müller, Amoroso, Guerrero, Félix, Maicon, Sorín, Belletti,
  Rafinha, Dedé, Gustavo Gómez, Everton Ribeiro, Fernandinho, Juninho Paulista,
  Pedro, Casagrande, Dudu, Grafite, Germán Cano, Serginho Chulapa, Calleri.
- **Folclórico mal avaliado (o selo 🃏 não é categoria — é PLUS):** Valdivia
  fame 2 → **craque** (sai da várzea); Dadá Maravilha e Vampeta fame 2 →
  **craque** também (o Diego pediu subir os três juntos — saíram do peladão).
  Selo folk mantido nos três.
- ⚠️ **Só mexi no `fame` (etiqueta/curadoria) — `lo/hi` (força de jogo) INTACTO**,
  então nenhuma partida muda de resultado; futebol ao vivo e carreira seguem
  iguais em equilíbrio. Só muda a etiqueta exibida e a raridade. Revertível
  (1 número por linha).
- Pool da várzea: 340 → **302 cartas** (ainda enche os 20 times sem fake).
- FALTA (se o Diego quiser depois): decidir se algum desses craques deve ficar
  mais FORTE (subir lo/hi) — hoje viraram craque mas jogam no mesmo nível de antes.

## ⚖️ Várzea online estava DESEQUILIBRADA (bots ganhavam fácil) (02/08)
Diego notou: no rápido online da várzea "todo mundo ficou muito longe de ganhar
dos bots". **Medi e confirmei a causa (2 assimetrias):**
1. O baralho do LEILÃO (o que o humano disputa) vinha com **27% de "foi
   profissional"** (cota `low` de 29%, pensada pra um baralho que TAMBÉM tinha
   lenda/craque compensando — na várzea não tem). Média do leilão caía pra **72.8**.
2. Os BOTS pegam elenco pronto filtrado por fame (médio = fame 2/3, forte = fame≥3),
   então **fugiam do "foi profissional"** (14/16 bots com ZERO perna-curta) e
   ficavam com média **74.0** — mais fortes que o time que o humano montava.
   Resultado: o humano pegava o refugo e ficava atrás. (No modo normal é o
   contrário: leilão 77.6 > bots 76.1, porque o humano compra craque/lenda.)
**Correção (v2 — o Diego corrigiu: NÃO é pra diminuir foi profissional; tem que
ser PARELHO entre bom jogador e foi profissional, e os bots seguem a regra de
força que o normal já usa — 9%/76%/15%).**
- Descoberta: 50/50 de verdade é IMPOSSÍVEL sem fake. O baralho BR só tem **74
  foi profissional** pra **226 bom jogador**; 20 times = 220 vagas → meio a meio
  pediria 110 perna-curta. Teto REAL sem inventar fake = **~1/3 foi profissional**.
- `buildDeck(..., varzea)`: cota de foi profissional (fame 1) na várzea = **33%**
  (era 29% no normal; a graça do modo pede mais perna-curta). Leilão = 33% foi
  prof / 67% bom jogador, média 72.1.
- `makeBotSquad(..., varzea)` / `dealBotSquads(..., varzea)`: mantém o rateio de
  força 9/76/15 (igual ao normal), mas cada tier carrega foi profissional na
  proporção parelha — forte 15%, médio 33%, fraco 60% (média ≈ 1/3, o teto real).
  Antes os bots FUGIAM da perna-curta (14/16 sem nenhuma); agora todos sentem a
  várzea (2.6 por time). Top dos bots caiu de 77-78 → 75-76.
- Placar: leilão 72.1 / bots 72.8 — parelho. E como no leilão o humano ESCOLHE
  (pega os bons, deixa a perna-curta pros bots), o time montado fica acima da
  média → dá pra brigar pelo título de igual pra igual. Modo normal, carreira e
  offline NÃO mudam (77.6/76.1). Só vale com `varzea` ligado. Revertível.
- FALTA (se o Diego quiser 50/50 mesmo): só criando cartas de foi profissional
  novas no baralho BR (mais nomes reais), pra ter estoque pra encher 20 times.
- ✅ **AJUSTE FINAL da várzea (02/08, aprovado + simulado):** sem adicionar cartas.
  - **LEILÃO dos usuários = 70/30 foi profissional** (pedido do Diego "deixe 70 a 30
    sendo mais foi profissional 70"): `buildDeck` cota `low` da várzea = **0.70**.
    Simulado (40 seeds × tamanhos de sala): 2–6 humanos = 69–74% foi prof; 8 = 62%;
    12 = 50% (sala grande esgota os ~74 foi-prof → completa com bom jogador, nunca
    fake). Baralho embaralha a cada leilão novo (semente nova no rematch) →
    variedade; só lembrar que foi-prof tem menos cartas (GOL 8) então repetem mais.
  - 🚫 **SEM FAKE (pedido explícito do Diego):** simulado 40 seeds × 6 tamanhos de
    sala = **0 fakes** em todos. Se acabar um tipo na posição, o bot completa com o
    OUTRO tipo REAL (bom jogador ↔ foi profissional) — a incógnita (`makeIncognita`)
    nunca dispara na várzea porque o pool real (foi+bom) sempre cobre a demanda.
  - **BOTS espalhados + fraco mais foi prof (opção 1 do Diego):** `dealBotSquads`
    monta os times FRACOS primeiro (o baralho BR só tem ~74 foi-prof pra 20 times →
    dando pros fracos antes, o perna-curta cai no time certo e o tier de força vale
    de verdade); `makeBotSquad` foiRate da várzea = fraco 0.55 · médio 0.40 · forte
    0.22. Simulado (4 e 2 humanos): **0 times sem foi profissional** (antes metade
    da liga ficava só com bom jogador), fracos ~68 de força, fortes ~74-76. Se um
    tipo acaba na posição, completa com o outro — nunca fake.
  - Modo PADRÃO 100% intocado (só `START_ONLINE` passa `varzea`; makeBotSquad/
    buildDeck/dealBotSquads têm branch `if (varzea)` — fora dela, idêntico). Revertível.
  - ✅ **EQUILÍBRIO da força dos bots (02/08, Diego perguntou "tá rivalizando ou muito
    fortes?"):** medido — com o alvo do `fillerAdj` em 74 (igual ao normal), na várzea
    o humano terminava **~14-16º** (bots fortes demais), porque o leilão 70% foi prof
    deixa o time do humano mais fraco (~71 vs ~76 do normal). Fix: `VARZEA_BASE = 69`
    em `cpuAdjFor` (só quando `s.varzea` no online) — puxa a média dos bots pra 69 →
    humano ~2 acima → briga pelo título (top 5-6 em sala de 2, top 2-4 em sala de 4,
    medido em 40 seeds). A `fillerAdj` aplica UM offset a todos os fillers, então a
    variação fraco/médio/forte (das cartas) continua — só desce a média. Normal (74)
    intocado. Revertível (1 número).
- ✅ **BUG "novo leilão perdia a várzea" (FEITO 02/08 — Diego relatou):** ao acabar
  o jogo da várzea online e a galera votar "novo leilão" pra continuar na MESMA sala,
  o leilão novo vinha em modo PADRÃO (com craque/lenda). RAIZ: o `startLeilao`
  (screens.tsx) montava o `START_ONLINE` do rematch passando só `deck: state.deckLeague`,
  **sem o `varzea`** → `onlineVarzea` caía em false. Fix: passa `varzea: state.varzea`
  junto (o estado já guarda a escolha da sala, e é sincronizado pros convidados). O
  "mesmo time" (REPLAY_SEASON) não monta baralho, então nunca teve o problema. Revertível.

## 🐛 Bug do 4-4-2 (faltava 1 meia / time com 10) — CORRIGIDO (02/08)
Amigo começou carreira no 4-4-2 e o time entrava com 10 (faltava 1 meia; o 4º
meia ficava no banco). CAUSA: em `pyramidseason.tsx` o `bestXI` e o `lineupAt`
usavam uma constante fixa `NEED` = 4-3-3 (`MEI:3, ATA:3`) pra montar o XI de TODO
mundo, ignorando a formação real do técnico. No 4-4-2 (4 MEI, 2 ATA) isso jogava
o 4º meia pro banco e tentava um 3º atacante que não existe → só 10 em campo.
CORREÇÃO: `bestXI(squad, formation)` e `lineupAt(..., formation)` passam a usar
`FORMATIONS[formation]`; a formação viaja no `SimTeam` (via `mk`/`buildPyramid`) e
nos dois pontos de exibição do Elenco e na simulação da partida. CPU de fundo
segue no padrão (montado 4-3-3), então nada muda pra eles. Vale pra 4-4-2 E 4-5-1.
Testado (4-4-2 → XI=11 com 4 meias). 4-3-3 intacto. Revertível.

## 🌍 Copa do Mundo começando na 110 em vez da 100 — CORRIGIDO (02/08)
A 1ª Copa do Mundo Legends abria só na temporada 110 (a âncora nascia 110).
Diego quer que comece na **100** e siga de 10 em 10 (100, 110, 120…). CORREÇÃO em
`copa-mundo.tsx`: `COPA_ANCHOR = 100`; saves que ainda NÃO jogaram nenhuma Copa
são realinhados pra 100 (o save antigo que nasceu com 110 se corrige sozinho);
quem já jogou uma edição mantém a agenda. Tela de "🔒 desbloqueia na 100"
aparece pra todo mundo abaixo da 100. Revertível.

## 🥅 Várzea online: bots MUITO difíceis + fakes + cartas novas (02/08 — Diego relatou)
Diego: no rápido online da várzea os bots estavam quase imbatíveis (no padrão a
dificuldade está "certinha"). MEDIDO: o leilão do usuário vinha **70% foi
profissional (nível 67.9)** e os bots só **~17% foi prof (nível 73.6)** → o time
do humano nascia **6 pontos mais fraco**. E ACHEI FAKES entrando nos bots (9 no
teste) — Diego proíbe fake.
**O que foi feito:**
- **+18 cartas reais de "foi profissional" (BR)** pedidas/aprovadas pelo Diego
  (auges reais, clube+ano, bio de auge; folk onde cabe). Total foi-prof: 74 → 92.
  GOL: Júlio César (Corinthians), Renan Ribeiro. LAT: China, Jorge. ZAG (array
  NOVOS_BR_ZAG novo): Erazo, Rafael Vaz, Lucão, Bressan. MEI: Lulinha, Renato
  Cajá, Camacho, Marlone, Giovanni Augusto, Rivaldinho. ATA: Léo Gamalho, Finazzi,
  Maxi Lopez, Paulinho Bóia. (Cortados por já existirem: Renato Abreu = craque no
  Fla; Carlos Alberto = já está pelo Flu.)
- **Equilíbrio:** cota de foi profissional do LEILÃO baixou de 0.70 → **0.40**
  (`buildDeck` várzea) pra bater com o nível dos bots. Medido: leilão 71.4 vs bots
  72.5 (gap 6 → 1); bots agora carregam foi-prof de verdade (3.3/time, era 1.9).
- **ZERO fakes** agora (medido em salas de 2/4/8 humanos) — as cartas novas + o %
  menor tiram a pressão que fazia o incógnito disparar.
- `VARZEA_BASE=69` mantido (calibrado por simulação, escala de "power").
- FALTA: Diego mandar clube/ano de 3 que ele pediu mas não achei o auge — **goleiro
  Saulo, lateral Gedeílson, Wellington Saci**. E PLAYTEST do Diego pra dizer se a
  dificuldade ficou boa (aí eu afino o VARZEA_BASE). Conforme entrar mais foi-prof,
  dá pra subir o % do leilão de volta rumo aos 70% que ele curte.

## 🗑️ Botão de excluir carreira "não fazia nada" — CORRIGIDO (02/08 — Diego relatou)
Amigo tentou apagar uma carreira no 🗑️ e não conseguia. CAUSA: o botão usava
`window.confirm(...)`, que é **bloqueado no navegador embutido do WhatsApp/
Instagram** (volta "cancelado" sozinho) — aí o apagar nunca rodava. É onde a
galera mais abre o jogo. CORREÇÃO: troquei por confirmação DENTRO do jogo (dois
toques): 1º toque no 🗑️ mostra "🗑️ Apagar" (vermelho) + ✕ cancelar; 2º toque
apaga. Vale na lista "Minhas Carreiras" (`MinhasCarreiras`) e no banner antigo
de carreira em andamento (`CareerContinueBanner`). Funciona em qualquer
navegador. Seeds das carreiras são únicos (não era colisão). Revertível.

## 🥅 Campinho: linha de defesa "quebrando" (lateral em cima do goleiro) — FEITO (02/08)
Diego (com print): no elenco/campinho (`ElencoField`, pyramidseason.tsx) alguns
times pareciam com "formação errada" — um lateral flutuando sozinho em cima do
goleiro. RAIZ: a linha de defesa do 4-3-3 tem 4 cartas (LAT-ZAG-ZAG-LAT) e o row
usava `flexWrap: wrap` → no celular a 4ª carta não cabia e pulava pra outra linha,
parecendo formação torta. A formação estava CERTA (3-3-4-1 no desenho = 4-3-3), era
só o layout. Fix: row com `flexWrap: nowrap` + cartas `flex: 1 1 0; minWidth: 0`
(encolhem pra caber lado a lado) — a linha de trás fica reta. Nome trunca com "…" se
faltar espaço. Só visual, revertível.

## 🏆 Hall da Fama campeão ERRADO + carta de campeão não aparece/não conta — DIAGNÓSTICO (02/08, Diego relatou)
Diego (2 prints): Cess FC foi campeão da liga (1º, 77 pts) e no aparelho dele aparece
campeão certo; mas no HALL DA FAMA (aparelho do host) mostra "Temporada 1: 🏆 Caue"
(que é só o 7º!). A Copa (Cess FC) está certa. E vários reclamam que a CARTA de campeão
não aparece e às vezes não conta no álbum/ranking.

**RAIZ ÚNICA encontrada (por código; não deu pra consultar o banco desta sessão —
aprovação do Supabase MCP só na outra sessão do Diego):** o **"novo leilão" reseta
`s.seasonNo = 1`** (`START_ONLINE`, store.tsx ~2994). Mas TRÊS coisas guardam por
**sala + nº da temporada**, e como a temporada volta a ser "1" a cada novo leilão na
MESMA sala, os registros de jogos diferentes se ATROPELAM:
1. **Hall da Fama (`game_champions`, chave room_id+season_no):** o campeão da "temporada
   1" de um jogo anterior (Caue) fica, e a regravação do novo (Cess) falha/atropela. Pior:
   a gravação é CRUA (`supabase...update`, screens.tsx ~4330) SEM retry → no navegador do
   WhatsApp falha fácil e fica o velho. (A ordenação da tabela é determinística — Caue com
   63 nunca seria table[0] sobre Cess com 77 — logo NÃO é cálculo, é registro atropelado.)
2. **Carta (`user_cards`, season_key = `${roomId}:${seasonNo}`, screens.tsx 6025/6054):**
   se já foi campeão da "temporada 1" nessa sala antes, o check acha o registro velho e
   não dá carta nova.
3. **Ranking (`esc_results`, mesmo season_key, `onConflict: user_id,season_key`,
   RankResultWriter ~5214/5231):** o upsert do jogo novo grava POR CIMA do antigo → título
   some ("não conta no ranking").

**FIX PROPOSTO (aguardando OK do Diego — mexe em como TODO campeão/carta/título é
gravado; risco alto de quebrar geral, então NÃO fiz blind):**
- Botar a "impressão digital" do jogo (o `s.seed`, que já é único por leilão =
  hashCode(roomCode+rematch)) nas chaves, pra jogos diferentes na mesma sala não
  colidirem. season_key online → algo curto tipo `on:${seed}:${seasonNo}` (⚠️ a coluna
  season_key tem limite ~48 — a outra sessão precisa confirmar o limite exato).
- Hall da Fama: distinguir por jogo (seed) — provavelmente precisa de uma coluninha
  `seed`/`game_id` em `game_champions` (migration) OU limpar os registros da sala no
  novo leilão. E tornar a gravação RESILIENTE (retry, como a `resilientWrite`).
- Conferir também o ângulo `youIdx` (identidade local): `champion: champ.id === you.id`
  usa `managers[youIdx]` — se o assento deslizou, o flag de campeão sai errado pra alguém.
**A outra sessão (com Supabase) deve confirmar:** (a) os registros de `game_champions`
dessa sala (pra ver o "Caue" atropelado); (b) o limite da coluna `season_key`. Aí dá
pra implementar certo e seguro.

### ✅ CONFIRMAÇÃO da sessão com Supabase (02/08) — responde o que faltava acima
Rodei as consultas de leitura no banco. Resultados:
- **Limite da coluna `season_key` (a dúvida acima): NÃO TEM.** Em `user_cards` E
  `esc_results` a coluna é **`text` (ilimitada)**. Então o FIX pode usar a chave
  INTEIRA com o seed (ex.: `on:${seed}:${seasonNo}`) sem medo de estourar/cortar.
- **Limpei 4 truncamentos legados `.slice(0, 48)`** (careeronline, CardCollectPrompt,
  2 na pirâmide) — eram inúteis (coluna é text) e a leitura da carta usava a chave
  inteira enquanto a escrita cortava (não batia). Agora chave inteira sempre. Só 1
  linha no banco tinha sido cortada, então era fragilidade latente, não o estrago.
- `game_champions`: sem BURACOS (3 em 4.131) — mas o bug é ATROPELO (update por
  cima), que não aparece como buraco. Bate com o diagnóstico do rematch acima.
- Ranking global (`esc_ranking`): agrupa por `user_id` (soma certo; o "Cess" tem 3
  nomes no mesmo cadastro = 148-149 títulos numa entrada só). Cess: 149 títulos ≈
  146 cartas.
- **CONCLUSÃO conjunta:** a RAIZ é o rematch resetando `seasonNo=1` + gravação por
  sala+temporada (diagnóstico da outra sessão). O fix é **botar o `seed` (único por
  jogo) nas chaves** de `game_champions` / `user_cards` / `esc_results`, com chave
  INTEIRA (a coluna aguenta) + gravação com retry. FALTA: OK do Diego pra implementar
  (mexe em como todo campeão/carta/título é gravado — risco alto, então não fiz blind).

### ✅ CONSERTO APLICADO (02/08) — "faça o que achar melhor" (Diego)
Implementado o fix do atropelo (rematch reseta seasonNo=1):
- **Cartas (`user_cards`) e Títulos (`esc_results`):** a season_key ONLINE agora
  inclui o **seed** (impressão digital do jogo): `${roomId}:${seed}:${seasonNo}`
  (e `:copa`). Vale no rápido (RankResultWriter + CardCollectPrompt liga/copa) e na
  carreira pirâmide (2 writers). Solo/dinastia já tinham o seed. Assim jogo novo e
  antigo na MESMA sala não colidem → título/carta não somem. Coluna é `text`, chave
  inteira, sem cortar.
- **Hall da Fama (`game_champions`):** a coluna `room_id` é `uuid` COM foreign key
  (aponta pra sala) — então NÃO dá pra botar chave composta ali (quebraria). Como o
  Hall da Fama é um placar VIVO da sala (não registro permanente), a correção certa
  era a GRAVAÇÃO com **retry (3x)**: o bug era o host gravar cru e falhar no
  navegador do WhatsApp, deixando o campeão de um jogo anterior. Com retry, a
  regravação vinga e o campeão certo aparece. (Sem migração, sem mexer no uuid/FK.)
- Tudo forward-safe (dados antigos ficam; jogos novos usam a chave nova). Buildado.
  Revertível.

## 📝 CONTRATOS na carreira — IMPLEMENTADO (02/08, mockup aprovado pelo Diego)
Sistema desenhado COM o Diego em longa conversa (+ simulações de 9.000 temporadas):
- **Todo jogador de humano/rival ganha contrato sorteado de 5-10 temporadas** ao
  chegar (atribuído na cerimônia — vale save antigo tb, ganha na próxima). Fake não.
- **Desbloqueia junto da folha (T4-T5):** como o menor contrato é 5, o primeiro
  vencimento cai no fim da T5 — a tela explica na primeira vez ("CONTRATOS
  CHEGARAM!"), e mostra "último ano" na anterior.
- **Venceu → tela de venda (reserveList):** renova **10 anos = valor oficial
  CHEIO** · **5 anos = METADE** · ou deixa ir → vai pro leilão com selo
  **⏳ SEM CONTRATO** e a venda tem **TETO no valor oficial** (o excedente "fica
  com a família gananciosa" — msg no resumo do mercado). Vender ANTES de vencer
  segue preço cheio. Listar manualmente um vencido também leva o selo (anti-furo).
- **Valor oficial** = max(livro de preços, paid, TABELA por categoria: lenda 30 ·
  craque 20 · promessa 12 · bom 8 · foi-prof 3) — mata a "renovação de graça"
  (piso de leilão nasce 1-2). `valorOficial()` exportado.
- **Prazo temperado:** renovação de 5 assina 4-6, de 10 assina 9-11 (preço igual)
  — sem isso os vencimentos re-alinhavam (simulado: até 13 juntos; agora máx ~5).
- **Trava do XI:** se a saída do vencido quebrar a formação (ou ele estiver
  emprestado na SAF), renova sozinho "NO APERTO" (5 anos, metade, pode ficar no
  vermelho — dívida já existe) com aviso no mercado. Ninguém fica sem time.
- **RIVAIS na mesma regra:** renovam com o clubCash (craque 85% · bom 60% ·
  fraco 35%, se a grana der), gastando verba que fazia falta no leilão. O MELHOR
  solto por posição entra no leilão com selo + zoeira ("Paixandu NÃO renovou
  fulano! 🍿"); o resto volta pro mundo em silêncio (sem inflar). Bots de fundo:
  o sorteio de famoso de sempre (sem mudança).
- **Comprou = contrato novo:** os 4 pontos de compra (leilão/desempate/monte/
  varredura de bot) limpam selo+prazo; a cerimônia sorteia 5-10 novo.
- Ações: `RENEW_CONTRACT {mgrId, cardId, anos:5|10}` (guest roteia pro host
  normal). UI: painel na reserveList (pyramidseason) + selo vermelho na carta do
  leilão (screens). Campos: `WonCard.contratoAte`, `Card.semContrato`.
- TESTADO headless (carreira solo até T7): atribuição ✓ renovação ✓ trava do XI
  ("renovou NO APERTO") ✓ rival soltando com zoeira ✓ selo no baralho ✓ recompra
  limpa contrato ✓. Rápido/várzea/dinastia intocados (tudo atrás de careerOnline).
- FALTA (combinado, próximos passos): mostrar "contrato até T__" na carta do
  Elenco; banner T4 dedicado (hoje a explicação aparece na 1ª tela de renovação);
  Diego fazer playtest de dificuldade/custos (tabela é 1 lugar só pra calibrar).

### 🔒 Ajuste (02/08, pedido do Diego): contratos SÓ pra carreira NOVA
Flag `contratosOn` no estado: nasce `true` só em START_CAREER_SOLO e START_ONLINE
com career. **Save antigo (sem a flag) fica exatamente como era** — sem atribuição,
sem renovação, sem vencidos no mercado (3 portões: cerimônia, leilão de reservas,
RENEW_CONTRACT). Testado: carreira nova com contratos ✓, save antigo intocado ✓.
## 🌍 Copa do Mundo: "seleção ??" com jogadores misturados + gate de escolha torto — FEITO (02/08)
Diego (print do Giovani Picolo): a convocação mostrava "CONVOCAÇÃO · ??" com jogadores
de países misturados (Frank de Boer, Pau Torres, Sugawara, Luisão...); e um usuário ~4º
do rank só conseguia escolher seleção do 6º pra baixo. RAIZ: em `paisDe` (paises.ts) as
cartas dos baralhos EU/MUNDO SEM etiqueta de país viram '??', e `rankingSelecoes` CONTAVA
o balde '??'. Como 32 cartas novas (adicionadas em sessões anteriores) não tinham país,
o '??' juntou 32 cartas e virou a **6ª "seleção"** do top 16 — com elenco de nacionalidades
misturadas, e empurrando as seleções reais pra baixo (por isso o gate `locked = i < myPos`,
que está CERTO, mostrava as reais em posições piores). **Fix:** (1) etiquetei os 32 com o
país real (Espanha: Pau Torres/Koke/Javi Varas/Marcos Senna; Holanda: de Boer/Obispo/Promes;
França: Mendy/Ben Arfa; Japão: Sugawara/Kagawa/Kubo; México: Vela/Lozano/Gilberto Mora;
Alemanha: Cacau/Rummenigge; etc. — alguns órfãos: Argélia/Luca Zidane, Marrocos/Brahim Díaz,
Congo/Kidiaba, Senegal/Bouba Diop, Turquia/Çalhanoğlu+Güler, África do Sul/Mudau). (2) `rankingSelecoes`
agora FILTRA '??' fora (segurança pra qualquer carta futura sem país). Resultado: **0 cartas
sem país**, top 16 limpo (Brasil…Coreia do Sul), gate alinhado (4º escolhe do 4º pra baixo).
Só dados (paises.ts), revertível. ⚠️ FALTA: rodar `scripts/checa-paises` a cada carta EU/MUNDO
nova pra nunca mais acumular '??' (o comentário "não importado pelo jogo" em paises.ts está
DESATUALIZADO — copa-mundo.tsx importa paisDe/rankingSelecoes).

## 🌍 Copa do Mundo: expandir 16 → 20 seleções quando +4 países fecharem 11 (pedido do Diego 02/08)
Hoje **16 países fecham um XI válido** (4-3-3 ou 4-4-2) → a Copa é top-16. O Diego quer
subir pra **20** quando MAIS 4 países conseguirem montar 11 (formação válida). **AVISAR O
DIEGO** quando isso acontecer. Medição atual (script scratchpad/copafield.mjs — G/L/Z/A/M
por posição; "falta" = jogadores pra fechar o XI):
- ✅ FECHAM (16): Brasil, Argentina, Espanha, França, Inglaterra, Holanda, Alemanha, Itália,
  Portugal, México, Bélgica, Uruguai, Colômbia, Chile, EUA, Coreia do Sul.
- ⏳ PRÓXIMOS: **Paraguai falta 4** (precisa de MEIAS — tem 0 meia! [G2 L1 Z3 M0 A3]) ·
  **Japão falta 4** [G0 L1 Z1 M3 A2] · Equador/Camarões/Senegal faltam 6 · Bolívia/Dinamarca/
  Suécia/Egito/Arábia Saudita faltam 7.
- Pra chegar aos 20: fechar Paraguai + Japão + 2 de {Equador, Camarões, Senegal}. A cada
  carta EU/MUNDO nova, rodar copafield.mjs e conferir se cruzou +4.
- QUANDO FOR HORA (o Diego autoriza subir pra 20): trocar `.slice(0, 16)` → `.slice(0, 20)`
  em `copa-mundo.tsx` (rankingSelecoes) e o `top16` em `pyramidseason.tsx` (~2492) pra pegar
  os 20 primeiros do rank de clubes. (1-2 números; hoje NÃO fazer — só 16 fecham.)

## 📖 Manual do Técnico + 🎙️ Narrador da 1ª partida — FEITOS (02/08, mockup aprovado)
Sugestão de usuário (via Diego): jogo confuso pra quem chega ("fui explicar pro
cunhado…"). Plano de 4 partes aprovado em mockup; as 2 primeiras publicadas:
1. **Manual do Técnico** (`ManualDoTecnico` em screens.tsx): overlay aberto por
   botão na home (abaixo da grade "como funciona"). Capítulo-mãe "Como funciona o
   LEILÃO" (envelope → revelação → martelo → monte, + desempate/nível oculto) e um
   card por modo SÓ com o que muda: ⚡ Rápido offline · 🌐 Rápido online (cita
   Várzea) · 🪜 Carreira. Dinastia/Carreira online/Liga Fechada FICAM DE FORA até
   liberar (decisão do Diego). PT-só (futebol).
2. **Narrador da 1ª partida** (`NarradorDica`): balão de dica com zoeira que
   aparece UMA vez por fase (envelope/revelação/monte) e some no "✅ Entendi";
   "pular todas as dicas" desliga geral. Guarda no aparelho (esc-dica-*/
   esc-dicas-off). SÓ futebol (basquete é bilíngue, ficou de fora por ora).
FALTAM (combinados): 3. **Respiro** — SÓ depois do Diego vetar/aprovar a lista
classificada de avisos (regra dura: aviso de REGRA DA JOGADA — ex. "2 vagas de
lateral", piso, saldo — NUNCA some; ensino contextual vira pílula após 2 vistas;
banner de novidade some após 1-2). 4. **Tema Noturno** — todas as telas, fundo
escurece e cartas/caixas seguem idênticas; claro NÃO muda 1 pixel (camada
opt-in). Cada parte em commit separado (reversíveis).

## 🧹 Respiro (parte 3 do plano) — FEITO (02/08, lista vetada pelo Diego)
Só os 2 avisos de ENSINO aprovados viram pílula, e com a régua que o Diego pediu:
**ficam INTEIROS nas primeiras 6 temporadas** em que aparecem (constante
`ENSINO_VEZES = 6` em pyramidseason.tsx — 1 número pra calibrar) e depois viram
pílula pequena que ABRE NO TOQUE (informação nunca é apagada):
- "💡 O que acontece ao listar" → pílula "ℹ️ como funciona a venda"
- "🔒 Não dá pra vender esses" → pílula "🔒 tem jogador travado (por quê?)"
Conta 1 vista por TEMPORADA (não por render; localStorage esc-ensino-*). TODOS os
avisos de regra da jogada (transfer ban, chip à venda, aviso "sai do time",
contratos, vagas/piso/saldo do leilão) INTOCADOS — a tela do leilão nem foi
tocada. FALTA (parte 4): 🌙 Tema Noturno (todas as telas; claro intocado).

### ✅ 4 seleções novas FECHADAS (02/08) — 20 países agora dão time
Adicionadas 62 cartas famosas (baralho MUNDO) → **Paraguai, Japão, Camarões, Senegal a 22 cada**.
Agora **20 seleções fecham XI válido** (verificado: rank + copafield). Faltava isso pra Copa de 20.
⚠️ PORÉM virar a Copa de 16→20 NÃO é 1 número: a chave (`copa-mundo.tsx`, CupScreen ~452) é
**4 grupos de 4 (6 rodadas ida-volta) → 8 melhores → QF/SF/final**. Pra 20 = **4 grupos de 5
(8 rodadas)** → top 2 de cada = 8 → mesmo mata-mata. Precisa: (a) `rankingSelecoes().slice(0,16)`
→ 20 (linha 188); (b) `top16`/entrants pra 20 clubes (pyramidseason ~2492 — hoje pega top 16 do
rank de clubes; virar 20); (c) montar grupos de 5 e fixtures de 8 rodadas; (d) trocar "Rodada X
de 6" → "de 8" e o groupTable(g,6)→8. Copa é LOCAL (localStorage, sem reducer) → risco baixo,
não toca futebol ao vivo. AGUARDANDO OK do Diego pra fazer a chave de 20.

## 🌙 Tema Noturno — NO AR, SÓ pra conta do Diego (03/08)
Parte 4 do plano (mockup + screenshots reais aprovados). "Estádio à noite":
camada CSS opt-in (classe `noturno` no html) — o PALCO escurece (Shell +
wrappers da carreira marcados `.palco`) e o texto direto nele clareia; CARTAS/
CAIXAS claras seguem IDÊNTICAS (cascata re-escurece o texto interno). Claro não
muda 1 pixel (sem a classe, o CSS nem existe). Botão na home ("🌙 Tema noturno")
+ escolha salva no aparelho + ?tema= na URL.
- 🔒 **Decisão do Diego: por enquanto SÓ a conta dele** (`TEMA_TESTERS` em
  sport.ts, mesmo padrão do basquete). Conta sem direito: botão nem aparece, e
  se o noturno estiver ligado por localStorage/URL é DESLIGADO quando o login
  resolve. **Futuro combinado: virar REGALIA DE PLANO PAGO** (trocar a trava de
  e-mail pra tier de apoio, 1 lugar só).
- ⚠️ Detalhe técnico pra próximas sessões: React serializa cores inline como
  rgb(...) — os seletores [style*=] do CSS noturno usam ESSA forma, não hex.
  Home verificada com screenshot real; telas internas usam os mesmos padrões —
  se escapar texto escuro num canto, é 1 linha de CSS (lista de containers).
### ✅ Copa do Mundo virou 20 seleções (02/08) — FEITO
Chave de 16→20: `copa-mundo.tsx` agora **4 grupos de 5, turno único (5 rodadas, 1 folga/rodada)
→ top 2 de cada = 8 → QF/SF/final** (mata-mata igual). Parametrizado: `NUM_GROUPS=4, GROUP_SIZE=5,
GROUP_ROUNDS=5, COPA_TEAMS=20` + helper `roundRobin()` + a máquina de passos agora usa `GR`
(=GROUP_ROUNDS) em vez de números fixos (grupos 1..GR · sorteio GR+1 · QF GR+2/GR+3 · SF GR+4/GR+5 ·
final GR+6 · fim GR+7). `rankingSelecoes().slice(0,20)` e o top-20 do rank de clubes (pyramidseason
~2510). Aviso de FOLGA (bye) na rodada que sua seleção descansa. Textos "TOP 16"→"TOP 20". Copa é
LOCAL (localStorage, sem reducer) → não toca futebol ao vivo/online. Simulado: 4×5, todos jogam 4x,
40 jogos de grupo. Build ok. Revertível.

## 🛟 Online: sala travada no "ENVIANDO…" na largada (Diego + Rocha, 02/08) — FEITO (03/08)
Sintoma (print do Diego): ele era o HOST, criou a sala, e na 1ª tela do leilão o
jogo travou no "ENVIANDO…" COM o banner "o host caiu" — no aparelho DO HOST. F5
resolvia pra sala toda. DIAGNÓSTICO: a leitura "sou host?" (game_rooms.host_id
=== user.id, lida na largada/reconexão) pode piscar errada (corrida na criação/
handoff de presença) → o dono se acha CONVIDADO → ninguém é host → os lances de
todo mundo vão pro nada e a sala congela até alguém recarregar (o F5 relê o banco
e conserta — por isso "voltava pra todo mundo").
FIX (2 defesas):
1. **Auto-cura**: o vigia de host (que já pedia estado a cada 2,5s) agora, quando
   fica >10s sem notícia, também confere no BANCO se o host da sala é o PRÓPRIO
   aparelho — se for, dispara BECOME_HOST e reassume o comando sozinho (o canal
   re-inscreve como host, heartbeat volta, sala destrava SEM F5). Fonte da
   verdade = game_rooms.host_id (não memória local — sem risco de host duplo).
2. **Aviso de recuperação** (pedido do Diego): o banner vermelho ganhou o botão
   "🔄 Travou? Atualiza a página — a partida continua de onde parou".
Revertível. Se voltar a acontecer, o print novo mostra se a auto-cura disparou.

## 🏛️ MULTICLUBES: caixas se misturando / premiação sumindo — 3 CONSERTOS (03/08, Diego relatou)
Usuários com 2º clube: prêmios contando só pra um, caixa "se misturando", extrato
incompleto. INVESTIGADO — 3 causas reais:
1. **A BOMBA (caixa "se mistura"/premiação some):** no FINISH_CEREMONY o troco do
   leilão era gravado na carteira de TODO humano — e o clube DORMINDO é humano mas
   NÃO joga o leilão, então a carteira dele era SOBRESCRITA com um `m.money` velho
   TODA temporada, apagando os prêmios ganhos dormindo. Fix: só grava quem jogou
   (`isHuman && !dormindo`). Testado: caixa do dormindo preservada (200→256→256;
   antes viraria 77).
2. **Extrato do dormindo vazio:** `logFin` agora ROTEIA lançamento cujo mgrId é o
   clube dormindo (s.multiClube.id) pro ledger DELE no stash — quando o dono troca
   de clube, o Extrato mostra tudo que rolou dormindo. E o resumo de fim de
   temporada (5 linhas) agora sai pros DOIS clubes (ids = [ativo, dormindo]).
3. **Dormindo não faturava patrocínio/empresário:** applySeasonMoney agora paga o
   patrocínio (pela divisão DELE) e a renda da agência DELE (cartas do stash +
   estádio dele + SAF compartilhada) na caixa DELE. Independência total.
O que É compartilhado POR DESENHO (não é bug): o ÁLBUM de cartas é da CONTA (mesmo
dono) e a SAF é uma só pros 2 clubes (decisão antiga do Diego). Prêmio de tabela/
título do dormindo já entrava certo (rewards por id) — só era apagado pela bomba 1.
Revertível (3 pontos).

## 🏛️ Multiclubes: Cerimônia abria no clube ERRADO — FEITO (03/08, print do Diego)
Após o leilão do 2º clube, a Cerimônia da Revelação abria mostrando o clube
ORIGINAL (ex.: Carecamburgo) em vez do que leiloou. CAUSA: a tela sempre abria no
time nº 0 da lista (na carreira normal você É o nº 0 — com o 2º clube no comando,
o nº 0 é o original dormindo). FIX: `EscCerimonia` abre no índice do SEU clube
ativo (youIdx) na lista filtrada. Navegar pelos outros times segue igual. Revertível.

## 🕴️ AGÊNCIA 2.0 (22 convocados do álbum) — FEITO (03/08, spec + mockups aprovados pelo Diego)
Reforma do empresário de cartas, SÓ CARREIRA SOLO NOVA (save antigo segue no
empresário clássico, nada muda). Decidido com o Diego nesta sessão:
- Convoca **até 22 cartas do ÁLBUM** (global da conta) pra "ativa" — só elas
  rendem. Mesma PESSOA só 1 vez (auges diferentes = 1 vaga). Cap 22 travado no
  motor (SET_AGENCIA). Convocação estilo COPA: filtro por posição + busca + selo
  do tier em cada nome. Troca quando quiser.
- **Mensalidade por categoria** (paga na virada): 👑 lenda **5** (≠ clássico 6,
  decisão do Diego) · ⭐ 4 · 💎 3 · 🎯 2 · 🪵 1 · carta **🃏 Folclórica +1** por
  cima. Desbloqueios = os MESMOS do estádio/SAF, e a tela deles CONTINUA em
  Clube › Agência (AgenciaDesbloqueios) — decisão do Diego.
- **Comissões por acontecimento** (+1 cada): 🥇 artilheiro de cada série + Copa;
  🏆 campeão em QUALQUER time (as 4 séries + Copa Legends, elenco do campeão);
  💸 negociado no leilão/monte (qualquer comprador — banner dourado no tempo
  morto do martelo, comissão paga NA HORA).
- **Renda 100% no 1º CLUBE** (agenciaClubeId = clube da fundação), mesmo se ele
  estiver DORMINDO no Multiclubes (cai na caixa dele + extrato do stash).
- UI: sub-aba **Elenco › 🕴️ Agenciados** (grade com cor do tier; toque abre a
  carta IGUAL álbum + "já te rendeu X"); fatura na **Cerimônia** (mensalidades +
  eventos + transações); extrato com 2 linhas 🕴️ (mensalidades / comissões).
- Motor testado headless (agenciatest.mjs): cap/dedupe, eventos idempotentes,
  virada pagando no clube 0, transações +1 na hora somando na fatura, folclórico
  +1, save antigo intacto (linha clássica 💼, sem 🕴️). Pegadinha corrigida: o
  leilão roda com seasonNo já virado → fatura carimbada com a temporada NOVA
  (senão a transação criava fatura vazia por cima e a Cerimônia perdia tudo).
Revertível: commit isolado; agenciaOn só nasce em carreira nova.
- 🔒 **TRAVA DE CONTA (03/08, pedido do Diego DEPOIS do deploy): Agência 2.0 por
  enquanto SÓ diego.c.fonseca@gmail.com** (AGENCIA_TESTERS em sport.ts, mesmo
  padrão do noturno/basquete). Carreira nova de conta comum nasce SEM a flag; e
  mesmo save com flag (criado na janela pública de ~2h) não mostra NADA pra
  conta comum — motor e telas checam agenciaLiberada(). Liberar geral = esvaziar
  a checagem num lugar só. ⚠️ O teste headless (agenciatest.mjs) agora precisa
  de mock do tester pra rodar (sem auth, gate=false).
### Combinados que FICARAM (não fazer sem OK):
- ✅ 📰 **Jornal página 2 "Caderno do Empresário" — FEITO (03/08, mockup v2 aprovado)**:
  capa 100% IGUAL a hoje (donos da temporada intactos — exigência do Diego) + vira
  SOZINHA após 5s (só 1x; bolinhas pra ir/voltar) pra página com as notícias dos
  agenciados — SÓ EMOÇÃO, SEM MOEDA (exigência do Diego): artilheiro/campeão da
  temporada + negociações do último mercado + "Palavra do empresário" (frase
  rotativa). Sem notícia ou save antigo = só a capa, como hoje (nem pager aparece).
- 🏦 **Divisão da renda entre os 2 clubes** (futuro): caixinha na sub-aba
  Agenciados, SÓ aparece com 2 clubes — tudo pro 1º / 50-50 / tudo pro 2º
  (mockup já mostrado). Por enquanto renda é 100% do 1º clube.
- 🎮 Futuro maior: jogos ONLINE usando as cartas do álbum (os 22 convocados são a
  base natural). Só ideia, sem spec.
- 📖 Manual do Técnico ainda não fala da Agência 2.0 — adicionar quando o Diego
  liberar a feature pro público (hoje só carreiras novas dele em teste? NÃO — já
  vale pra TODO MUNDO que criar carreira nova; visual aprovado).

## 🪜 ESCADA DE CATEGORIAS na carreira — FEITO Fase 1 (03/08, SÓ conta do Diego)
Ideia do Diego: divisão dita as categorias do leilão. Fase 1 (sem a divisão
Várzea real ainda — essa é a Fase 2, pendente, com mockup antes):
- D (estreia) = 🪵 foi-prof + 🎯 bom (baralho estilo Várzea, bots parejos) ·
  C = 🎯 bom + 💎 promessa · B = 💎 promessa + ⭐ craque · A = ⭐ craque + 👑 lenda.
- 🔓 LIBERA GERAL depois de **2 temporadas COMPLETAS jogadas na Série A**
  (decisão do Diego) — vira o jogo normal pra sempre (escadaLivre).
- 🔒 BANCO DE RESERVAS só destrava no **1º acesso** (sai da divisão de estreia);
  não tranca de novo se cair. Rivais/bots seguem a MESMA regra (deepSquad).
- Mercado secundário (sobras, contratos vencidos, venda de jogador existente)
  NÃO respeita a régua de propósito — palavras do Diego ("tem as sobras").
- Gate: ESCADA_TESTERS = mesma lista da agência (sport.ts). Carreira nova de
  conta comum nasce SEM escadaOn. Caixa informativa na tela de venda
  (ReserveListScreen) explica régua/banco/progresso 2-na-A.
- SIMULAÇÃO 40 temporadas ×2 (simescada.mjs no scratchpad, usa sportstub.js):
  régua 100% no baralho novo (0 fake, 0 furo), zoeira perfeita na estreia
  (Falcão do Futsal, Walter Gordinho...), sobe RÁPIDO (A na T4-T7, livre T6-T10)
  — se o Diego quiser arco mais longo, opções: mínimo de temporadas por degrau
  ou régua só sobe quando é CAMPEÃO. Dinheiro: harness sem vender jogador não
  chega na SAF 2000 em 40 temporadas (venda de jogador é o motor real de grana).
### Pendências da escada:
- Fase 2: divisão VÁRZEA real embaixo da D (20 times zoeiros, acesso) — mockup 1º.
- Decisão do Diego: manter subida livre (rápida) ou segurar o arco?
- Banco Legends (comprar moeda de verdade) segue parado aguardando ele.
## 🃏 AUDITORIA DOS BARALHOS (04/08) — feita
Analisadas as 1204 cartas (BR 516 · Europa 534 · Mundo 154). ZERO duplicado exato,
zero mesmo-nome+mesmo-clube, zero erro factual de clube/ano/posição encontrado (dataset
muito bem curado). Nomes repetidos (54) são de PROPÓSITO (auge BR + auge Europa do mesmo
craque). Único ajuste: PADRONIZAÇÃO de clubes escritos de 2 jeitos (mesmo clube virava
dois no álbum) — grafia por maioria: Manchester United→Man United, Manchester City→Man
City, Bayern München→Bayern, Borussia Dortmund→Dortmund, Bayer Leverkusen→Leverkusen,
Inter de Milão→Inter, FC Porto→Porto, Sporting CP→Sporting, Olympique Lyon→Lyon,
Olympique Marseille→Marseille, Leicester City→Leicester, Schalke 04→Schalke,
Pohang→Pohang Steelers, Suwon Bluewings→Suwon, Birmingham City→Birmingham (35 cartas).
Mantidos de propósito: Bernard (ATA-BR/MEI-EU) e Denílson (MEI-BR/ATA "Denílson Show"-EU)
= auges diferentes em países diferentes. Falsos-alarme (clubes DIFERENTES, não mexer):
América×América de Cali×América-RJ · Inter×Internacional · Sport×Sporting · Grêmio×
Grêmio Barueri · Bragantino×Red Bull Bragantino (renome de época).

## 🌍 Baralho TODOS (BR+Europa+Mundo) na carreira — FEITO (04/08, só conta do Diego)
Pedido do Diego (print da tela de criação): carreira nova da conta liberada usa
`deckLeague='todos'` = CATALOG_BOTH + CATALOG_WORLD (dedup por auge, ~850+ nomes).
setActiveCatalog/pickCatalog sabem 'todos' (cpuSquads também). Todo mundo mais
segue no both fixo. Texto da tela de criação muda só pra ele. Confirmações dadas:
rivais escolhidos começam TODOS na divisão de estreia junto do usuário; conta
dele ativa (precisa criar a carreira LOGADO).

## 🌱 FASE 2 — DIVISÃO VÁRZEA REAL (V) — FEITO (04/08, só conta do Diego)
Diego cobrou "tudo novo já" na conta dele → a 5ª divisão entrou de verdade:
- Tipo Div = A/B/C/D/**V**; carreiras normais têm V VAZIA (guards em promotions/
  balanceamento/UI — nada muda pra ninguém sem escadaOn; placements sem 'V').
- Escada com escadaOn: sala inteira (você+rivais+fillers) nasce na **Várzea**;
  fillers usam VARZEA_TEAMS (20 times zoeiros novos em data.ts: Unidos da
  Resenha, Perna de Pau City, Doze Contra Onze…); Série D vira divisão de fundo
  (DIVISION_TEAMS.D − rivais escolhidos + EXTRA_D_TEAMS, 20 times, fichas na
  fatia mais fraca do pool em buildCpuSquads comVarzea).
- Régua Fase 2 (spec original do Diego): V=🪵+🎯 · D=🎯+💎 · C=💎+⭐ · B=💎+⭐ ·
  A=⭐+👑. Banco de reservas destrava ao SUBIR PRA D; livre = 2 temporadas na A.
- Copa Legends: Várzea NÃO joga (top-4 de A-D como sempre). Promoções V↔D só
  quando V existe. 20 manchetes de jornal da Várzea (tom peladão). Prêmios/caixa/
  boost com valores de várzea (CAMPEAO.V=12, base 60, boost 0, patrocínio 0).
- Vazamento corrigido: as "sobras do mundo" (cartas left- que voltavam do
  catálogo pro leilão) agora respeitam a régua. Mercado secundário (vendedor real)
  segue fora da régua DE PROPÓSITO (palavra do Diego).
- SIMULADO (30 temporadas ×2): mundo 5×20 ✅, arco ÉPICO (ex.: V1→D1→8 anos de
  Série C→B→A na T14, livre T20, com quedas e voltas), 0 fake, régua do baralho
  novo 100%. agenciatest ✅ (agência no mundo V) + save antigo clássico ✅.
- Harnesses (scratchpad): simescada.mjs/agenciatest.mjs usam sportstub.js (alias
  ./sport com travas ligadas).

## 🏦 BANCO LEGENDS — FEITO (04/08, mockup aprovado; visível SÓ pro Diego até a chave Pix real)
Pacotes 10/50/100/500/1000 (1 real = 1 moeda). Supabase: tabela bl_fichas (RLS só
admin) + RPC bl_redeem (atômica, security definer, 1 uso por ficha, exige login).
Jogo: botão "🏦 Banco Legends" em Clube › Finanças (SÓ carreira solo) → gerente
Seu Creuzebek 🤵 + pacotes + passos do Pix + resgatar ficha (anti-chute 3 erros =
1min) → BANCO_CREDIT credita no caixa do clube ativo + extrato "🏦 Empréstimo do
Banco Legends" (kind 'banco'). Admin: "Caixa do Gerente" (gera ficha BL-XXXX-XX,
copia no toque, lista quem usou). ✅ RESOLVIDO 04/08: chave Pix real = diego.c.fonseca@gmail.com; Banco LIBERADO GERAL (sem gate de conta, segue só carreira solo; comprovante via Instagram @leilaolegendscom ou e-mail). Nota antiga: ⚠️ BL_PIX = banco@leilaolegends.com é
PLACEHOLDER — Diego precisa passar a chave real; aí troca e libera geral (gate
useAgenciaLiberada hoje).

## 🌱 VÁRZEA — 4 correções do 1º teste do Diego (04/08, prints)
1. Patrocínio dizia "Série D" na Várzea → texto próprio ("A Várzea não atrai
   patrocínio (ainda 🍺)"); telas de criação/manual também falam Várzea (conta dele).
2. Clube › Agência (sub-aba) REMOVIDA quando Agência 2.0 ligada (a agência mora
   em Elenco › Agenciados; desbloqueios aparecem lá na caixinha de travas).
3. 🚨 Convocação puxava o ÁLBUM GLOBAL da conta → agora SÓ cartas de título DESTA
   carreira (empresarioCards + stash do 2º clube), com TRAVA no motor
   (SET_AGENCIA valida contra o cofre) e SANEAMENTO na virada (convocação antiga
   com carta de fora é limpa e para de render).
4. Bots da várzea tinham PROMESSA no elenco → makeBotSquad (modo várzea) exclui
   promessa (vale também pro modo rápido Várzea — lá o catálogo já vinha filtrado).

## 🏆 RANKING reformulado — FEITO (04/08, pedido do Diego com print)
Abas novas (saiu o "Geral"): 🪜 **Carreira** (primeira aba, EM BREVE — lista
ZERADA de propósito, aviso "contagem começa do zero quando abrir") · 👥 **Rápido
online** · 🤖 **Rápido offline**. RPC esc_ranking ganhou modos 'ronline'/'rcpu'
que EXCLUEM temporadas de carreira (season_key like 'co:%'); modos antigos
seguem funcionando (compat com app aberto). ✅ RESOLVIDO 04/08: Diego decidiu
MANTER O HISTÓRICO — aba 🪜 Carreira liberada GERAL com o modo RPC 'carreira'
(todos os títulos co:, liga+Copa juntos) e títulos novos de carreira seguem
contando normal. Ordem final das abas: Rápido online · Rápido offline · Carreira.
Ideias futuras (sem decisão): separar liga/Copa na exibição; régua por divisão.

## 💀 KFC — LIMPEZA EXECUTADA (04/08, AUTORIZADA pelo Diego: "sei q ele fez hacker, coloque 57")
user_id 9ba06350-8b24-4ba2-85b6-b045a5a9c28d. Antes: 191 títulos rápido-cpu +
216 cartas CPU (fabricados). Feito: (1) champion=false nos 134 títulos rápido-cpu
mais NOVOS (ficam os 57 mais antigos — número escolhido pelo Diego); (2) álbum
CPU enxugado pra 85 cartas mais antigas (= 57 rápido + 28 carreira) — SEM isso o
reconcileCardsToTitles do cliente RECRIAVA os títulos pra bater com as cartas;
(3) BACKUP integral antes de apagar: tabela kfc_cards_backup_20260804 (217 rows,
RLS on). Verificado: cartas_cpu=85 = títulos_cpu=85 → reconcile neutro. Online
(17) e carreira (28) intocados.
⚠️ AINDA ABERTO: o buraco em si (cliente grava esc_results/user_cards direto —
qualquer um pode fabricar). Fechar com validação server-side ANTES de abrir o
ranking da Carreira.

## 🏛️ BUG AO VIVO: Multiclubes FANTASMA em carreira nova — CONSERTADO (04/08, print do Murriz)
Sintoma: usuário criou carreira NOVA e na virada apareceu o seletor "MULTICLUBES
— quem você comanda?" com o PRÓPRIO time duplicado (M10 × M10) + aviso de 2
clubes. CAUSA-RAIZ: START_CAREER_SOLO nunca limpava s.multiClube/
multiClubePendingCards — o stash da carreira ANTERIOR (ou de sessão carregada)
vazava pro save novo. FIX duplo: (1) START limpa os dois campos; (2) AUTO-CURA
em normalizeMultiSeats: ao carregar QUALQUER save, se o multiClube aponta pra um
"2º clube" que não existe entre os managers (ou só há 1 humano), o stash é
PURGADO e a carreira volta a clube único — cura o save do Murriz e de quem mais
foi afetado, sem perder nada (o fantasma nunca teve nada dentro).
## 🃏 Cartas corrigidas (04/08, relato do Diego): China → Flamengo 2004 (ano
estava 2013) · Léo Gamalho → Criciúma 2013 (clube estava Vasco). ⚠️ Diego:
confirmar se prefere OUTRO auge pra esses dois (chutei o mais conhecido).

## 🎁 Cartinha "do nada" (sem título) — CONSERTADA (04/08, relato de amigo do Diego)
CAUSA: mesmo fantasma do Multiclubes — recordDormantCards fabricava "pacotes
guardados" (multiClubePendingCards) pro clube-fantasma, e o bloco "Enquanto
dormia, seu time foi campeão! Abra o pacote" renderiza SÓ pela lista de pacotes,
independente do seletor. FIX triplo: (1) auto-cura do fantasma agora purga os
pacotes também; (2) pacotes ÓRFÃOS (fantasma curado antes do fix) são limpos ao
carregar o save; (3) recordDormantCards nunca grava pacote quando o "dormindo"
é o próprio clube ativo. Basta o afetado ATUALIZAR a página.

## 🃏 Auditoria das 18 cartas foi-prof adicionadas — 9 CORREÇÕES aplicadas (04/08, OK do Diego)
Paulinho Bóia → São Paulo 2019 (era "Flamengo", nunca jogou lá) · Maxi Lopez →
Vasco 2017 (era "Grêmio") · Bressan → Grêmio 2014 + bio corrigida (a antiga
dizia "bicampeão da Libertadores 2017" — ele saiu antes) · Rafael Vaz →
Flamengo 2016 · Camacho → Corinthians 2017 · Júlio César goleiro → Corinthians
2010 + bio ("antes do Cássio") · Renan Ribeiro → Atlético-MG 2016 · Léo Gamalho
→ Goiás 2019 · Renato Cajá → Ponte Preta 2012. Mantidas como estavam: Jorge,
Lulinha, Marlone, Giovanni Augusto, Rivaldinho, Lucão, Erazo, Finazzi, China
(Flamengo 2004 — ⚠️ ano ainda é chute; Diego confirma quando souber).
REGRA NOVA: carta nova SEMPRE passa a ficha (clube+ano+bio) pelo Diego ANTES de
entrar no jogo.

## 🤖 DIFICULDADE da carreira nova — handicap SUBIU (04/08, decisão do Diego "tá fácil")
Amigo do Diego subiu rápido demais e ganhou muitos títulos. Simulei 5 receitas
(30 temporadas cada) antes de mexer:
- 6/9/12/2 (antigo) e 4/6/8/3/4: RESSUSCITAM o ioiô (A19→cai, C20→cai) ❌
- 3/4/5/3/4: ioiô no topo (A:3 pune quem acabou de subir) ❌
- ✅ APLICADO: **A:2 · B:4 · C:5 · D:3 · V:4** (era A:2 B:3 C:4 D:2 V:0→3) —
  chegada na Série A vai de T4-T7 pra **T13-T23**, títulos 30T caem pra 1-3,
  topo continua justo (A fica em 2; o vai-e-vem A↔B restante é elenco limitado,
  não handicap). Vale pra TODA carreira da fórmula nova (simV>=4) — inclusive
  em andamento, a partir da próxima temporada. Carreiras antigas seguem 6/9/12/2.
Alavancas NÃO usadas (anotadas): G3/G2 no acesso (sobem 3/2 — visível, muda a
régua de todo mundo) e bots mais espertos no leilão. Se ainda reclamar de fácil,
próxima é G3.

## 🔎 AUDITORIA GERAL (04/08, pedido do Diego) — auditoria.mjs no scratchpad
15 temporadas ×2 no reducer real (carreira nova completa). ✅ PASSARAM: caixa ×
extrato batem EXATO na virada (prêmios+bilheteria+folha+patrocínio+agência);
tabelas fecham (pts=3V+E, 38 jogos, gols pró=contra); artilharia 100% (todo gol
tem dono, por divisão); mundo 100 times sem duplicação; Copa Legends sempre 16
de A-D (Várzea fora); contratos presentes em todo real de humano/rival; XI de
HUMANOS nunca quebra; fatura da agência fecha; caixa nunca NaN.
⚠️ ACHADO MENOR (aberto): na escada, 1-2 RIVAIS de várzea podem ficar com 1
INCÓGNITO no XI persistente (perderam a posição no leilão V e o monte esgotou;
a IA não prioriza repor). Não quebra jogo (jogam com 11, incógnito é fraco), mas
fere o "nunca fake em rival" — consertar: IA do bot prioriza posição com fake no
leilão de reservas. Bots de FUNDO da várzea com incógnito = ok temático.
## 👻 Cartas :mc no Supabase (04/08): 157 cartas de 4 usuários desde 31/07 —
MISTURA de legítimas (donos reais de 2º clube) e do bug fantasma (mc0 sem 2º
clube real). Separar exige abrir os saves — aguardando decisão do Diego (dá pra
cruzar esc_pyramid_saves × user_cards se ele quiser limpeza fina).

## 📝 Contrato no Elenco não cortava mais (04/08, screenshot de amigo do Diego)
Em celular estreito (duas colunas Titulares|Reservas), a linha "clube · ano ·
📝 N anos" cortava pela direita e escondia JUSTAMENTE o contrato ("Milan ·
2007 · 📝 ..."). Conserto em ElencoField (pyramidseason.tsx): (1) contrato
agora vem PRIMEIRO na linha — "📝 7 anos · Milan · 2007" — então se cortar,
some o ano, nunca o contrato; (2) textos compactados: "❗ vencido — decida na
janela" → "❗ vencido" e "🌱 cria da base — sem contrato" → "🌱 sem contrato"
(cores e regras iguais). Reverter = 1 commit.
↳ AJUSTE do Diego (04/08, aplicado): contrato saiu da linha "clube · ano" e
foi pra coluna da DIREITA, embaixo do 💰 piso e 💸 salário (ali nunca corta).
A linha "clube · ano" voltou a ficar inteira, com o ano. Textos continuam
compactos: "📝 N anos" / "⏳ último ano" / "❗ vencido" / "🌱 sem contrato".

## 👑 Arte de compartilhar elenco com o MANTO do tier (04/08, mockup aprovado)
Foto do Kata-Kata 👑 mostrou a arte saindo num mostarda apagado: a imagem
compartilhada usava só a cor CHAPADA do tier (o.color), nunca o degradê+brilho
da aba Elenco. Agora (jornal.tsx buildElencoBlob): topo e listas pintam com o
degradê do tier (gradStops/fillTier parseiam o grad CSS de apoio.tsx) + faixa
de brilho congelada (sheenRect, intensidade = holo do tier). Texto escolhe
contraste sozinho (ouro/prata/bege → escuro; roxo/verde → branco). Sem tier →
arte igualzinha à de hoje. Vale pra todos os tiers, cada um com o SEU manto.

## 🏆 Ranking "Total da conta": nome agora é o da MAIOR carreira (04/08)
Diego estranhou: "HAHAHA · 394" no topo do Total sem existir no Por carreira.
Causa: o RPC esc_ranking batizava a conta com o nome da ÚLTIMA partida jogada
— o Alface tinha acabado de jogar numa carreira nova "HAHAHA" (1 título), e o
Tokyo aparecia como "Xurupitas FC" (45). Somas estavam CERTAS (394 = 379+15;
333 = 269+45+18+1) — só o nome enganava. Migration
ranking_total_nome_da_maior_carreira: no modo carreiratotal o nome vem da
carreira com MAIS títulos da conta (empate → mais recente). Por carreira e
modos rápidos intocados. Verificado ao vivo: Alfacehh FC 394 · Tokyo 333.

## 📖 Álbum do técnico com os DOIS totais (04/08, mockup aprovado)
O que o Diego tinha pedido de verdade no caso Alface: ao tocar num técnico no
ranking CARREIRA, o álbum abre com dois botões-total — "🪜 Esta carreira · N
cartas" (só as cartas daquela linha/carreira) × "📊 Conta toda · M cartas"
(tudo somado) — e a grade de cartas troca junto; filtros Tier/Recentes/etc.
seguem funcionando. Feito: RPC esc_ranking agora devolve career_key (drop+
create, coluna extra não quebra chamador antigo — único chamador é o próprio
ranking); openAlbum busca season_key e guarda SEM dedup (dedup por visão);
chips só aparecem quando a linha tocada é uma carreira (sub-aba Por carreira);
no Total da conta e nos rápidos o álbum fica igual era. Sub-abas do ranking
MANTIDAS (Diego confirmou) e conserto do nome (maior carreira) mantido.

## 🏛️ MULTICLUBES × CONTRATOS: dormindo renova sozinho (04/08, decisão do Diego)
Diego: "dormindo não quer dizer que não faz as coisas — conta prêmios, títulos,
cartas, gasta salários... e renovação também". Conferido no código, TUDO já
rodava pro dormindo: prêmios por colocação (seasonRewards t.human), bilheteria
(applyStadiumIncome), folha T4+ (chargeSalaries), patrocínio e agência/empresário
(blocos dorm explícitos), títulos (honors por teamKey), cartas de campeão
(multiClubePendingCards, abre ao assumir), extrato no stash (logFin roteia).
FALTAVA só contrato: o bloco de vencidos PULAVA o dormindo (if m.dormindo
continue). Agora: vencido de clube dormindo renova AUTOMÁTICO 5 anos pela
metade, pagando da caixa DELE (pode negativar, valor real no extrato guardado
+ linha no resumo do mercado "💤"). Dormir NUNCA perde jogador nem manda
ninguém pro leilão (ninguém decide por ele — auto-renova tudo). Cerimônia já
dava contrato 5-10 ao elenco dele (isHuman). Teste novo: scratchpad/dormtest.mjs
(🟢 verde: contrato na cerimônia, renovação, caixa×extrato EXATO, nada vaza
pro leilão). criatest/malandragem seguem verdes.
↳ MUDANÇA do Diego (04/08): NADA de renovar sozinho no dormindo. Feito no
lugar (mockup lado a lado aprovado): (1) janela de contratos ganha modo 2
COLUNAS quando o dormindo tem vencidos — 🟡 ativo × 💤 dormindo, mesmos 3
botões por jogador (RENEW/RELEASE já aceitavam mgrId), renovação do dormindo
sai da caixa DELE (saldo na tela); sem 2º clube a janela fica idêntica.
(2) Avançar sem decidir = regra de sempre nos dois clubes (auto 5 anos metade).
(3) 😤 MAGOADO: soltou em QUALQUER clube seu → o jogador vai a leilão e NENHUM
clube seu recompra (mesmoDono() em resolve/tiedTop/montePickable; selo "😤
magoado com você" + aviso "🙅 não joga pra você!" no leilão; só solo — online
nunca bloqueia outro humano). (4) BUG evitado: venda de jogador do dormindo
creditava no money (nunca reconciliado) — agora credita direto na careerCoins
dele. dormtest.mjs reescrito (🟢): solta 1 no banner → leilão com selo, monte
bloqueado pros 2 clubes, não volta; 2 sem decisão → renovam automático; caixa
× extrato guardado EXATO. criatest/malandragem verdes.

## 🏛️ AUDITORIA DE INDEPENDÊNCIA dos 2 clubes + toggle da agência (04/08)
Pedido do Diego: "nada passa de um clube pro outro, tudo independente". Varri
TODAS as escritas de caixa (careerCoins/money/logFin) do store:
✅ JÁ INDEPENDENTES: prêmios de liga/Copa/artilheiro (por teamId), bilheteria
(estádio próprio), folha, patrocínio (divisão de cada um), obras do estádio
(id + extrato casados), títulos/honras (teamKey), cartas de campeão (pacote
guardado por clube), extrato (stash roteado), renovações (caixa do dono),
Banco Legends (ativo), leilão (só o ativo joga; money re-semeado da caixa).
🔧 VAZAMENTOS ACHADOS E CONSERTADOS (2):
1. (entrega anterior) venda de jogador solto do DORMINDO caía no money nunca
   reconciliado → evaporava. Agora: caixa oficial do dormindo + extrato.
2. Comissão da SAF (50% da campanha) ia pro "PRIMEIRO humano da lista" — podia
   cair no clube errado (até no dormindo) com extrato no outro. Agora: sempre
   no clube ATIVO (a SAF anda grudada nele) e extrato com o id certo.
🤝 COMPARTILHADO DE PROPÓSITO (decisões antigas mantidas): SAF única (bolo,
byClub devolve certo) · álbum/cofre de cartas ÚNICO da conta (títulos dos 2
clubes enchem o mesmo cofre — "as cartas é única", Diego).
📝 NOTA: prêmio da Copa do Mundo de seleções (+100) só o clube ATIVO recebe.
💰 TOGGLE DA AGÊNCIA (pedido de hoje): na tela Elenco › Agenciados, com 2
clubes aparece "A renda da agência cai no caixa de: [🟡 A] [💤 B]" — renda
INTEIRA (mensalidades+comissões) pro marcado, destraves olham o estádio dele,
troca quando quiser (SET_AGENCIA_CLUBE, só solo, só clube seu). Sem 2º clube,
tela idêntica. dormtest/criatest 🟢.
↳ 🤝 OPÇÃO "DIVIDIR OS DOIS" no toggle da agência (04/08, pedido do Diego):
terceiro botão na tela dos Agenciados — mensalidades E comissões da virada
racham meio a meio entre os 2 clubes (moeda ímpar fica com o clube NO COMANDO;
comissão de negociação de 1 🪙 idem). No dividir, os destraves usam o estádio
QUE RENDE MAIS dos dois (agenciaEstadio). Extrato de cada clube mostra a sua
metade sozinho (linhas por variação de caixa por id). Estado agenciaDividir +
SET_AGENCIA_CLUBE{dividir}. Esclarecido com o Diego: "cartas é única" = cofre
de cartas da agência (um só da conta); estádio segue um por clube.

## 🏆 HALL DA FAMA DA SALA repaginado (04/08, mockup aprovado) — modo rápido online
Era uma linha seca de texto por temporada; agora é a ESTANTE (visual da sala de
troféus da carreira), pra quem fica jogando várias partidas na mesma sala:
- Cartão por jogador com faixa na COR DO TIER (perkFromSelo no nome; ouro/prata
  brilham com ApoioSheen; sem selo = bege) + contador "N troféus".
- Troféus empilhados: 🏆 Liga (dourado c/ brilho) · 🏆 Copa · ⚽ Artilharia
  (verde, por TIME do artilheiro — coluna nova top_scorer_team) · 🙈 TROFÉU
  MICO do lanterna (marrom, BALANÇA — animação escMicoWiggle).
- Zoeira do Mico: 12 frases BR rotativas, sorteio estável por temporada (todo
  mundo da sala vê a mesma) — "música no Fantástico", "ônibus de ré" etc.
- 📜 Linha do tempo embaixo (mais novo em cima): T{n} · campeão · copa ·
  artilheiro · 🙈 mico.
- Banco: game_champions += top_scorer_team, mico_name (migration
  hall_da_fama_time_artilheiro_e_mico); host grava, temporadas antigas seguem
  aparecendo (sem ⚽/🙈 retroativos). Lanterna = último da tabela (pode ser bot,
  zoeira vale). Ideias anotadas sem decisão: 🐔 Frango de Ouro (defesa mais
  vazada) · 🥶 Geladeira (temporada sem vitória).

## ✉️ AVISO DO SUPABASE: bounce alto de e-mail — TRAVA APLICADA (04/08)
Supabase mandou e-mail: taxa alta de e-mails devolvidos (risco de suspenderem o
envio = ninguém recupera senha). Causa medida no banco: cadastros com e-mail
digitado errado — gmail.con (15), gmai.com (8), gnail.com (6), "gmail" sem
.com (6), gmail.com.br (4) — e temporários (temp-mail.org 18, bolaoww.temp 22).
Confirmação de cadastro está DESLIGADA (0 pendentes de 5.958 contas), então o
bounce vem do "esqueci a senha" indo pra endereço errado.
FEITO (emailProblema em apoio.tsx, ligada nos 3 formulários — cadastro do
lobby, esqueci-a-senha, modal salvar-carreira): corrige typo clássico com
sugestão ("@gmail.con → não seria @gmail.com? 🧐"), barra e-mail temporário
(aviso do porquê) e final incompleto. Mensagem do cadastro corrigida ("✅ Conta
criada" — não pede mais confirmação que não existe).
⏳ PENDENTE (precisa do Diego): SMTP próprio no Supabase (Auth → SMTP) com
Brevo (300/dia grátis) ou Resend — tira o envio do pool compartilhado do
Supabase. Volume de reset é baixo, plano grátis sobra.

## 📉 CORTES DE CONSUMO rodada 2 (04/08, OK do Diego — itens 4-7 da lista)
Contexto: aviso do Supabase — restrição em 09/08 se seguir sobre a cota
(Realtime 424%, Egress 240%); Diego orientado a DESLIGAR O SPEND CAP (senão o
jogo trava dia 9; custo estimado R$ 500-600 no ciclo, caindo).
(4) ✅ ECO DO CHAT DO LOBBY removido JÁ (ordem do Diego, sem esperar sexta):
sendLobbyChat mandava 'chat' + 'emote' (dobro de mensagem Realtime) → agora só
'chat'; ouvinte de 'emote' MANTIDO (aba antiga ainda é ouvida; aba muito antiga
precisa de F5 pra ver as novas — custo aceito). Chat/emotes DENTRO da sala já
eram 1× (sem eco).
(5) ✅ live_beats 30s→60s: JÁ ESTAVA FEITO por sessão anterior.
(6) ✅ ~90% já feito antes (estado comprimido ~15-35KB, envia só quando muda,
reenvio de parado a cada 12s). Resto = migalha com risco no online — NÃO mexer.
(7) ✅ Lista de salas: refresh 5s→8s (−37% dessas queries; botão 🔄 segue
na hora).
PENDENTE (Diego): apertar "Disable spend cap" ANTES de 09/08 · transferir
projeto MAQUETE VIRTUAL pra org Free (API não pausa projeto em org paga) ·
SMTP Brevo. EU: monitorar consumo diário e reportar a fatura em R$.

## 🏆 BUG: "Copa21 na temporada 8" — Copas herdadas de carreira antiga (04/08, print do leodiniz85)
No Ranking Geral DENTRO da carreira, clubes (e o próprio usuário) apareciam com
mais Copas que temporadas existentes. CAUSA: START_CAREER (solo E online)
zerava careerHonors mas ESQUECIA careerCopaHonors — as Copas de todas as
carreiras anteriores do aparelho se acumulavam (chave por nome de clube, que
repete entre carreiras: 'Coliseu United' etc.). CONSERTO: (1) os dois STARTs
agora zeram careerCopaHonors junto; (2) CURA no migrateTeamNames (roda em todo
load de save): se a soma de Copas guardada > nº de temporadas (impossível — é
1 Copa por temporada), o histórico tá contaminado → recomeça a contagem.
Efeito colateral aceito: save contaminado perde também as Copas legítimas da
carreira atual NA TELA (recomeça a contar dali). Cartas e ranking da home
NUNCA usaram careerCopaHonors — sempre estiveram certos (esc_results).
↳ CORREÇÃO da cura (bronca do Diego, certíssima): zerar apagava as Copas
LEGÍTIMAS. Agora a cura RECONSTRÓI as copas do jogador pelos recibos de carta
DESTA carreira (empresarioClaimKeys com ':copa'; stash do 2º clube idem) — só
os bots (sem registro por temporada) recomeçam do zero. herancatest.mjs 🟢.
## 🧹 FAXINA ANTI-HERANÇA nos STARTs (04/08 — "analise a fundo", Diego)
Varri TODOS os campos do EscState × o que START_CAREER_SOLO/ONLINE zeram.
MAIS 3 VAZAMENTOS reais achados e corrigidos (mesma família do Copa21):
1. cpuSquads: carreira nova REUSAVA as fichas/elencos dos 60 times de fundo da
   carreira anterior (o semeador só roda "se não existe"). Agora zera → re-semeia.
2. copaDoneSeason: valor velho podia PULAR a Copa da temporada de mesmo nº na
   carreira nova. Zerado.
3. varzea (modo rápido) vazava pro campo da carreira (pintaria marrom errado).
   Zerado no START solo (online já setava da sala).
+ criaNames/criaNews/contratoRelease/agenciaDividir zerados por higiene.
Testes: herancatest.mjs novo (carreira A 3 temporadas → START B: nada herda;
cura reconstrói 2 copas reais e limpa 32 fantasmas) 🟢 · criatest 🟢.
⚠️ auditoria.mjs: 153 falhas PRÉ-EXISTENTES (com e sem as mudanças dá igual) —
todas "XI quebrado/bot com 10 jogadores" em bots de VÁRZEA, efeito do handicap
novo (A:2 B:4 C:5 D:3 V:4) aplicado hoje. Decidir: IA repõe elenco dos bots de
fundo OU atualizar a invariante da auditoria. NÃO mexido sem o Diego.

## 📉 CORTES DEFINITIVOS rodada 3 (04/08, escolhas do Diego item a item)
1️⃣2️⃣ RANKING DIÁRIO: esc_ranking_cache (tabela + esc_ranking_cache_refresh +
pg_cron 'ranking-diario' 06:00 UTC, 4 modos) — a home lê a foto pronta;
fallback pro RPC ao vivo se a foto faltar. reconcileCardsToTitles roda 1×/dia
por aparelho (localStorage esc-reconcile-dia). Aviso sutil na tela: "🕐 O
ranking e as cartas atualizam 1× por dia".
3️⃣ BOLÃO APOSENTADO (Diego: "não tô usando"): REVOKE anon/authenticated em
boloes/participantes/palpites/placares_tempo_normal (dados preservados;
reverter = GRANT). + 🔒 game_rooms_cleanup_log estava SEM RLS (alerta crítico
do advisor) → RLS ligado sem política (só servidor acessa; cron intacto).
6️⃣ esc_admin_dashboard: bloco 'daily' virou UMA passada agrupada (era 4
varreduras × dia) + índices created_at em game_plays/site_visits. Saída igual.
4️⃣5️⃣ NÃO feitos (Diego não entendeu ainda): amostragem de visitas e batimento
ao-vivo — re-explicados no chat, aguardando decisão.
⚠️ Tabelas de um app morto de VISTORIA DE VEÍCULOS (vehicles, inspections,
escrow_records etc., todas 0 linhas) seguem no projeto — perguntar ao Diego se
aposenta igual ao bolão.

## 🔬 SIMULAÇÃO 200 TEMPORADAS ×2 + varredura (04/08, pedido do Diego — SÓ RELATÓRIO, nada consertado)
Harness: scratchpad/simulacao200.mjs (motor real, 200 temporadas; run A jogador
"passivo" nunca vende/solta; run B "ativo" vende 1 sobra/temporada e solta todo
vencido). Resultados completos em sim200.log / sim200b.log.
✅ PASSOU NAS 400 TEMPORADAS: golpe "comprou 15+→saiu por ≤2" = 0 casos (o caso
"Ronaldo de graça" NÃO reproduz — travas de 03-04/08 seguram); monte de graça
de carta valiosa = 0; XI do humano nunca furou (cria SEMPRE tapa); contrato
vencido sobrando pós-cerimônia = 0; duplicatas = 0; NaN = 0; Copa Legends
exatamente 1/temporada (contador são); rivais renovam com inteligência (~95%
dos bons/craques; ZERO lenda solta tendo caixa); rivais listam sobras; preços
mantêm hierarquia por era (craque máx 105 e bom máx 94 em eras ricas — dentro
dos tetos×economia; sem inversão na mesma era).
🚨 ACHADOS REAIS (decisões pro Diego):
1. ESPIRAL DE DÍVIDA SEM RESGATE: jogador passivo (só auto-renova) afunda no
   vermelho PRA SEMPRE (-2.282 na T200, transfer ban eterno, 193 temporadas de
   auto-renew). O jogo nunca quebra, mas também nunca oferece saída da dívida.
2. HANDICAP NOVO É SECO: passivo ficou 200 temporadas preso em D↔C (13 títulos);
   soltador afundou na Várzea com 0 título. Estratégias burras, mas mede o peso.
3. Bots de FUNDO da várzea com XI furado/10 jogadores (auditoria: 153 avisos)
   — efeito do handicap V:4; decidir se IA repõe ou se é "temático".
4. Carta da COPA DO MUNDO (chave copamundo:) NÃO conta no ranking Carreira da
   home (que só soma chaves co:) — decidir se deveria.
5. Prêmio da Copa do Mundo (+100) só existe pro clube ATIVO (dormindo nunca
   concorre) — coerente?, decidir.
📋 ESTÁTICO OK: Copa do Mundo âncora T100 + de 10 em 10 + played[] trava
rejogar; venda nunca quebra XI (inclusive com emprestado); SAF byClub/trim/
revert ligados nos 2 caminhos de virada (segue pendente: teste em save real);
multiclube contratos ✓ (dormtest); heranças entre carreiras zeradas hoje.
⚠️ LIMITES DA SIMULAÇÃO: harness não clica telas/botões (testa o MOTOR);
"deadlock" do run B (dinheiro parado) é em parte artefato do lance burro do
robô — re-testar com estratégia esperta antes de concluir.

## 🔬 RODADA 2 da simulação profunda + CONSERTOS (04/08, ordens do Diego)
PEDIDO: analisar lances de rivais/bots a fundo + consertar XI furado de bot,
Copa do Mundo pro 2º clube e carta/título da CdM contando em tudo.
📊 RAIO-X DOS LANCES (150 temporadas instrumentadas, cada lote registrado):
lances de bots/rivais SENSATOS — craque máx 65 (=teto), lenda 66, médias sobem
com a era sem inversão; rivais renovam ~95% dos bons/craques e NUNCA soltam
lenda com caixa; venda cai de 83% (eras cedo) pra ~60% (eras ricas).
🚨 CONFIRMADO "encalhe do caro": lote com piso ≥30 encalha e CRESCE por era
(14→26→33→67→85 por bloco de 25 temporadas) — o caro roda leilão sem comprador
(piso alto), vai pro monte/varredura, MAS NUNCA sai de graça (0 golpes em 550+
temporadas somadas). PROPOSTA (não feita, decidir): piso do relistado = min(
paid, valorOficial atual) ou decaimento de 20%/temporada encalhada.
🔧 CONSERTO 1 — XI DOS BOTS (auditoria: 153 falhas → ~4): reposição na
cerimônia (FINISH_CEREMONY) com cascata: baralho livre na régua → fama ≤3 →
(rival) qualquer fama mais fraco → PUXA DO FUNDO (cpuSquads doa o real mais
fraco e tampa com zé) → (rival) fundo qualquer fama → incógnito só em último
caso. ⚠️ BUG MEU no meio do caminho (pego pela auditoria): carta de catálogo
não carrega `pos` — injetar é obrigatório (cartas sem posição nasceram e
morreram no mesmo dia). Resta caso raro "bot com 10" (~4 em 30 temporadas
auditadas) — anotado, não crítico.
🔧 CONSERTO 2 — COPA DO MUNDO × MULTICLUBE: os DOIS clubes seus contam pro
top-20 e CADA classificado recebe os +100 (COPA_MUNDO_PRIZE agora com logFin —
extrato do dormindo no stash). 
🔧 CONSERTO 3 — CARTA/TÍTULO DA CdM CONTAM EM TUDO: chave da carta virou
co:solo<seed>:<temporada>:copamundo (origin cpu) → soma nas CARTAS do ranking
Carreira; vitória grava esc_results (champion) → soma nos TÍTULOS; onCard novo
leva a carta pro COFRE do empresário (ADD_EMPRESARIO_CARD), igual liga/Copa.
Cartas copamundo: antigas (chave legada) não migram — só as novas contam.
✅ REGRESSÕES: auditoria 153→4 · criatest 🟢 · dormtest 🟢 · herancatest 🟢 ·
sim 150 temporadas: golpes 0, monte-grátis 0, XI humano 0, vencidos 0,
duplicatas 0, NaN 0. (Métrica "bots XI furado" do sim usa 4-3-3 fixo pra todo
bot — artefato de medição; a régua real é a da auditoria/xiHoles.)

## 🧢 KIT TÔKA10 PUBLICADO (10/08 — aprovado pelo Diego "Ok publica aí")
FEITO: escudo + mascote do Tôka10 (ofc.toka10) com ARTE PRÓPRIA do dono em
IMAGEM (webp): `src/escalacao/img/toka10-{escudo,mascote}.webp` — escudo 22 KB
(entrada 'Tôka10' em LOGOS_PRONTAS via <img>), mascote 15 KB (chave `toka` em
MASCOTES). DB: esc_socios do ofc.toka10 → manto #F0CD23/#1B7A3D (canarinho),
mascote_key 'toka', escudo_time 'Tôka10'. Time já existia em data.ts
('Tôka10', ex-Biriba United, ponte OLD_NAME ok).
📌 REGRA NOVA (decisão do Diego, anotada em escudos.tsx): batismo PODE usar
imagem quando o dono manda a arte — webp comprimido, kit ≤ ~40 KB. O medo de
"estourar KB" foi desfeito com números (37 KB = 1,2% do site de 3,2 MB; limite
de hospedagem 1 GB). Desenho em código continua o padrão dos demais.
🗒️ HISTÓRIA (pra não repetir): 6 versões desenhadas em código foram rejeitadas
("não parece o menino") — o que destravou foi recuperar o ARQUIVO da referência
do transcript da sessão (imagens do chat ficam no .jsonl em base64) e depois o
Diego mandar a arte final pronta (print). Fica a lição: batismo com referência
de imagem → pedir/usar o arquivo, não desenhar de olho.
~~PENDENTE: time_coracao do ofc.toka10~~ ✅ FEITO 10/08: Santos (Diego
confirmou; gravado direto em esc_socios.time_coracao).

## 🦋 CORREÇÃO FINAL Xurupitas/Bicho da Seda/Tokyo (10/08 — Diego esclareceu)
QUEM É QUEM (gravar com e-mail pra NUNCA mais confundir):
- davisantana1312@gmail.com (Davi) = batismo BICHO DA SEDA 🦋 → dono da
  mariposa + manto verde/branco + coração Palmeiras + sócio nº 5.
- denilson.stifler10@gmail.com (Denilson) = batismo TOKYO CITY ESPERION →
  ganhou sócio PRÓPRIO nº 14 (batismo é vitalício). Joga online com o NOME
  "Xurupitas" (camisa livre, não é clube batizado).
FEITO: clube volta a se chamar 'Bicho da Seda' em data.ts (corrente de nomes:
Red Bull Diet → Xurupitas FC [janela 09-10/08] → Bicho da Seda; saves das 3
épocas acham o clube); mariposa em LOGOS_PRONTAS mudou de chave pra 'Bicho da
Seda'; comentários de apoio.tsx/mascotes.tsx corrigidos; DB: pacote inteiro
movido de volta pro Davi (escudo_time='Bicho da Seda') + linha nova do
Denilson (nº 14, sem kit ainda).
LIÇÃO: escudo artesanal segue o NOME do time ("camisa"); perfil/mascote seguem
a CONTA ("tatuagem"). Explicado pro Diego de novo nesse episódio.
PENDENTE: kit do TOKYO CITY ESPERION (escudo+mascote+manto do Denilson) —
Diego vai perguntar o tema pro dono; time_coracao do Denilson idem.

## 🔒 NOME DE TIME ÚNICO — tipo @ do Instagram (10/08, pedido do Diego)
REGRA: nome de time/técnico agora é único. (1) Nome já usado por OUTRA conta →
novo jogador não consegue pegar (quem JÁ tinha repetido, mantém — sem mexer nos
antigos). (2) Nome de clube de BATISMO fica RESERVADO pro dono — só a conta
dona pode usar, mesmo que ainda não use (ex.: denilson pode virar "Tokyo City
Esperion" quando quiser; mais ninguém pode).
COMO: RPC esc_nome_livre(p_nome) (SECURITY DEFINER; normaliza lower/trim;
consulta reservas + display_name de auth.users) + tabela esc_nomes_batismo
(nome_norm→email dono, 14 batismos semeados). Cliente checa nos 4 pontos que
gravam display_name: setup do jogo (screens.tsx start), dinastia, chip ✏️ do
lobby e CADASTRO (signUp) — aviso claro embaixo do campo com o porquê e o
caminho (mensagens em NOME_MSG no manto.ts). Servidor fora → deixa passar
(padrão "não trava o jogo").
⚠️ White Thigs do GuGu ficou FORA das reservas (dono desconhecido) — se o
Diego souber a conta, é só inserir em esc_nomes_batismo.
📌 BATISMO NOVO = lembrar de inserir a reserva em esc_nomes_batismo!

## 🎽 MANTO NO CARD — Opção C aprovada (10/08)
Diego achou a faixinha de 5-7px tímida ("tá MT pouco o detalhe"). Mockup A/B/C
mostrado; ele escolheu a C perguntando se aumentava o card — NÃO aumenta: a
linha da posição foi PRA DENTRO da faixa (topo do card vira manto ~14-16px com
a POSIÇÃO num selinho preto por cima; altura total igual). Aplicado nos DOIS
campinhos: screens.tsx (Campinho do leilão/jogo, variantes small/normal) e
pyramidseason.tsx (campinho da temporada — o do print dele). Vale pra todo
sócio com manto, cada um nas SUAS cores.
+ ONLINE (mesmo dia): os campinhos dos OUTROS times da sala também vestem o
manto do dono — RPC esc_mantos_sala(p_room) devolve SÓ assento→cores (e-mail
nunca viaja; manager.id === room_players.player_index). Bot fica sem manto.

## 📝 CONTRATOS "não aparecem" (10/08 — investigação do caso pedrohenriquedasilva315)
DIAGNÓSTICO (2 causas separadas):
1. BUG REAL (consertado agora): a tela "📝 CONTRATOS · MESMO TIME"
   (ReserveListScreen → SquadTab, pyramidseason.tsx:4241) NÃO passava
   contratosOn/seasonNo → os selos ❗vencido/⏳último ano/📝N anos e o chip 💸
   sumiam JUSTO na tela de decidir contratos. Uma linha, corrigida.
2. CASO DO PEDRO: save dele está na TEMPORADA 178 — carreira ANTIGA (criada
   antes de 02/08). Carreira antiga NÃO tem contratos por decisão de produto
   (contratosOn só nasce em START_CAREER_SOLO/START_ONLINE; sem backfill).
   Não é bug — mas o usuário não tem como saber. PROPOSTO ao Diego (aguardando
   decisão): avisinho na carreira antiga tipo "📝 contratos são das carreiras
   novas — comece uma nova pra ter" OU backfill (arriscado em save T178).
   Comentário desatualizado do types.ts:108 corrigido junto.

## 🌍 COPA DO MUNDO — auditoria profunda + consertos (10/08)
RELATOS: "tá dando erro" (sem detalhe) + "ganhei com o Brasil escalando os
piores" (carreira antiga).
CONSERTADO (commit único, reversível):
1. 🔴 CAUSA MAIS PROVÁVEL DO "ERRO": o Modal era declarado DENTRO do
   componente CopaMundo → todo re-render do pai REMONTAVA a Copa inteira
   (voltava pros grupos, perdia convocação) e no título entrava em LOOP
   (prêmio→re-render→remonta→prêmio). Modal movido pra fora (CMModal).
2. Save llcopa antigo sem played/mural dava tela branca no fim de temporada —
   ensureSave agora normaliza; ?.mural?.find no jornal.
3. scorerPick com XI vazio e país undefined não quebram mais (guardas).
4. Convocação: 2 toques rápidos furavam o limite da posição (guardas liam
   estado velho) → agora contam no prev; travava o botão sem explicação.
5. Título da CdM sumia do Rank após rename do clube (cmTitles sem ponte
   oldChain) → ponte aplicada (Neymarzetti/Tôka10/etc mantêm a estrela).
VEREDITO DO "ganhei com os piores" (Monte Carlo 2.000 copas no motor real):
escalação PESA SIM — 11 piores do Brasil = 0,0% de título (nem sai do grupo);
11 melhores = 34,8%. O que engana: a tela de convocação NÃO mostra
overall/fama (de propósito), então "escalar desconhecidos" ≈ força média ≈
level dos bots. OU o usuário viu o bug 1 (copa dupla). Carreira antiga × nova:
motor IDÊNTICO; só a gravação do título no ranking é gated (agenciaOn).
PENDENTE (decisões do Diego):
- Mostrar nível (fama/estrelas) na convocação? Hoje é escolha às cegas de
  propósito — mas o resultado depende 100% disso.
- ~~Aviso em carreira ANTIGA de que contratos são só das novas~~ ✅ FEITO
  10/08 (Diego aprovou): caixinha na aba Elenco da carreira sem contratosOn.
  Texto ampliado no mesmo dia (pedido dele): primeiro ACALMA ("carreira raiz
  continua valendo e NÃO vai ser interrompida") e depois lista o que só as
  novas têm (contratos, Agência 2.0 na aba Elenco, crias) + caminho.
- Multiclube na Copa: 2 clubes seus no top-20 = duas seleções IGUAIS no
  torneio (Brasil × Brasil possível) — visual estranho, prêmio ok.
- esc_results da CdM usa season_key/mode de solo mesmo em carreira online
  (inconsistência anotada, sem mexer).

## 🔍 AUDITORIA PROFUNDA DO JOGO (10/08 — Diego cobrou "acha os que eu NÃO peço")
5 frentes (finanças, leilão, online, telas, carreira) + 150 temporadas rodadas
no motor real. NÚCLEO LIMPO (div sempre 20, ninguém some, 0 carta duplicada, 0
dinheiro NaN/negativo, sobe4/desce4, determinístico, cerimônia conserta XI de
bot). CONFIRMADO pelo Diego: Agência 2.0 JÁ está solta pra geral (AGENCIA_GERAL
= true) — de propósito. Doc/tasks antigas que diziam "só Diego" estão obsoletas.

BUGS ENCONTRADOS — aguardando o Diego escolher a ordem (NADA foi mexido):
🔴 ALTO 1. Gols mudam ao trocar formação (re-simula o passado; formação não é
   congelada por rodada como escalação/eventos). pyramidseason: world usa
   mgrMe.formation global → lineupAt refaz todas as rodadas. [o que o Diego viu]
🔴 ALTO 2. OPEN_RESERVE_LIST não idempotente: double-tap credita 2× + folha 2× +
   pula temporada. store.tsx:4637 (fix: `if s.screen==='reserveList' return s`).
🔴 ALTO 3. Modal inline em ApoieButton (screens.tsx:297): campo "nome do clube"
   do batismo perde foco a cada letra. MESMO bug da Copa (mover Modal p/ módulo).
🟠 MÉD 4. COPA_MUNDO_PRIZE: +100 pode se perder se app fecha na hora do título
   (idempotência terceirizada ao localStorage, fora do caixa).
🟠 MÉD 5. Host recarrega na fase de envelope → sanitize tira pendingEnvelopes
   também na persistência DB; RESTORE_ONLINE zera envelopes mas mantém submitted
   → lances somem. (fix: limpar submitted ao restaurar em envelope).
🟡 6. Sala host-manual/stream ainda força tiebreak(30s)/monte(45s) escondido.
🟡 7. Copa do Mundo multiclube paga +100 por clube classificado (confirmar).
🟡 8. SUBMIT_TIEBREAK não checa duplaPodeAgir (parceiro errado relança).
🟡 9. DIV_BASE_CASH sem 'V' → várzea nasce com 100 (devia 60). store.tsx:386.
🟢 higiene: key={i} no álbum; resumo de fechamento esconde kind 'saf'; componentes
   inline (Stat/Face/PickList/Team) sem bug hoje mas mesmo padrão do #3.
🟣 LATENTE: restart-ready e voto de fim de temporada mistura youIdx×manager.id
   (ok hoje pq batem; trava sala se algum dia reordenar os times). Blindar.

## ✅ CONSERTOS DA AUDITORIA (10/08 — Diego mandou "faça os 3 que doem, depois médios, depois menores")
FEITOS E NO AR (cada um commit isolado, buildado, reversível):
🔴 1. Campo "nome do clube" do batismo não perde mais o foco (ApoieModal movido
   pra fora do componente — mesmo padrão do fix da Copa).
🔴 2. Anti-toque-dublado no fim de temporada: OPEN_RESERVE_LIST ignora 2º toque
   (`if s.screen==='reserveList' return s`) — não dobra mais dinheiro/folha/temporada.
🔴 3. Gols não mudam mais ao trocar formação: CHANGE_FORMATION congela o XI das
   rodadas já jogadas na formação ANTIGA (bestXIids por rodada); a nova vale do
   jogo atual em diante. Provado com teste (XI da rodada passada fica idêntico).
🟠 4. Prêmio da Copa do Mundo (+100) não some mais: credita ANTES de marcar
   played + trava idempotente por `${mgrId}:${temporada}` (copaPrizeDone no
   estado). Anti-perda e anti-dobro.
🟠 5. Host recarrega na coleta de lances → zera `submitted` só nas fases de
   envelope no RESTORE_ONLINE (guests reabrem input e reenviam; não resolve mais
   com lance zero).
🟡 6. Várzea nasce com 60 (DIV_BASE_CASH ganhou 'V'). 🟡 7. Prêmio da SAF aparece
   no resumo de fim de temporada (kind 'saf' no filtro). 🟡 8. Desempate em dupla
   respeita o dono da categoria (SUBMIT_TIEBREAK ganhou `by` + duplaPodeAgir).

PENDENTE (precisa de decisão/UI nova — NÃO mexido):
- ⏱️ Timer escondido do DESEMPATE/MONTE em sala host-manual/stream: setar "sem
  tempo" TRAVA (não há botão de host pra fechar o desempate, só o envelope tem).
  Pra consertar direito = adicionar botão "fechar desempate e avançar" na UI do
  online. Item menos urgente (não corrompe estado, só contraria o "show pausado").
- 🟢 Cosméticos deixados: álbum key={i} (risco de key duplicada se mexer);
  componentes inline sem bug hoje (Stat/Face/PickList/Team).
- 🟣 LATENTE de assento (restart-ready/voto de fim de temporada usam youIdx×id):
  ok hoje pq batem; blindar preventivamente antes de qualquer reorder de times.
- Copa do Mundo multiclube paga +100 por clube classificado (Diego confirmar se
  é isso mesmo — comentário diz intencional "independência dos 2 clubes").

## ✅ CONSERTOS DA AUDITORIA DE DINHEIRO & DADOS (10/08 — Diego: "conserte todos")
FEITOS E NO AR (commits isolados, buildados, reversíveis):
🔴 1. Removida a rotina reconcileCardsToTitles: ela igualava títulos ao nº de
   cartas e, com a trava do Falido FC, FABRICAVA título de carreira antiga e
   APAGAVA título real (2 títulos c/ a mesma carta). Rodava 1×/dia → corrompia
   sempre. Ranking agora reflete só o que o jogo grava. (screens.tsx)
🔴 2. Vaga/ordem da Copa do Mundo agora usa a MESMA ordenação do Rank
   (A·Mundo·Legends·B·C·D·dinheiro) — antes o gate ignorava wc/copas e a
   colocação exibida ≠ a que qualificava. (pyramidseason copaGate)
🟠 4. Título de Copa do Mundo sobrevive ao rename: ponte pela corrente de NOMES
   (oldChain(t.name)), não oldChain('m{id}') que era vazio. (pyramidseason mural+gate)
🟠 3. Artilheiro de todos os tempos separa xarás: chave nome+cardId (94 nomes
   repetidos no baralho somavam junto). Teto subiu 300→1000 (menos perda de
   quem sai/volta ao top). (store RECORD_SEASON_STATS)
🟠 5. Álbum conta por AUGE (nome|clube|ano), não só nome — 2 versões da mesma
   lenda contam separado, bate com o servidor. (screens dedupByName)
🟡 9. REAUCTION_ONLINE (caminho legado) blindado contra toque-dublado.

✅ CONFIRMADO REDONDO (150 temporadas + leitura): dinheiro conservado nas
transferências (comprador debita = vendedor credita), premiações no momento
certo e 1×, folha piso÷10 por jogador só da 4ª, renovação bate com a tela,
transfer ban trava compra, campeão 1/divisão sem dobrar, idempotência OK.

DEIXADOS PRA CONFIRMAÇÃO DO DIEGO (são DECISÃO DE DESIGN, não bug claro —
mexer muda semântica/arrisca; NÃO mexidos):
- #7 "Artilharia" na Sala de Troféus conta só o artilheiro GERAL da pirâmide
  (scorers[0]), não o de cada divisão (B/C/D). Contar por divisão inflaria o
  nº de artilharias de todo mundo. Quer contar por divisão?
- #8 Bot-fiador varrendo o monte credita o vendedor SEM se debitar (cria
  graninha na caixa do humano-vendedor). É o que GARANTE que quem lista carta
  sempre recebe. Impacto ínfimo. Deixar como está (garante pagamento) ou fazer
  o bot pagar (conservação)? ✅ RESOLVIDO 10/08: Diego escolheu "robô paga" —
  o bot debita o próprio caixa quando fica com carta LISTADA (conservação 100%).
  Banner da carreira antiga ganhou botão ✕ (fecha e não volta, por aparelho).

## ⚽ NOVOS JOGADORES ADICIONADOS (10/08 — lista grande do Diego)
Adicionadas 25 cartas novas reais no baralho BR (+ 1 no baralho EU) em
`data.ts` (blocos `NOVOS_BR2_*`), build ok. Conferido no catálogo o que já
existia antes de adicionar (evitar duplicata):
- JÁ ESTAVAM no jogo (Diego pode conferir in-game): Kaio Jorge (Cruzeiro),
  Alan Patrick (Inter), Bernabei (Inter), Robgol (Bahia), Luciano Juba (Bahia),
  Nino (Fluminense), Nonato (Bahia), Ronaldo Giovanelli (Corinthians),
  Diego Tardelli (Atlético-MG), Tinga (Inter), Dario Conca (Fluminense),
  Thorgan Hazard (irmão do Eden, baralho EU).
- NOVOS adicionados: Lucas Arcanjo e Marcelo Lomba (gol); Cuiabano,
  Matheuzinho, Natanael (lat); Félix Torres, Gabriel Mercado, Titi, Jemerson,
  Rafael Tolói (zag); Rodrigo Garro, Breno Bidon (promessa), Arthur (Grêmio),
  Bitello, Juan Cazares, Edu (Corinthians), Gabriel Bontempo (promessa),
  Lucas Crispim, Lucho González (mei); Gabriel Pec, Lingard, Elkeson,
  Rafael Borré, Dirceu Lopes, Nikão, Marcelo Cirino, Jesé Rodríguez,
  Alex Alves, Osvaldo (ata); Jobe Bellingham (baralho EU, irmão do Jude).

RESOLVIDO (10/08, 2ª leva): Diego confirmou 3 (Kevin Viveros Athletico-PR,
zagueiro é Alexander BARBOZA não "Barbosa" — do Botafogo campeão da
Libertadores 2024, Willian Bigode é atacante do Cruzeiro bicampeão 13/14) e
mandou pesquisar o resto a fundo (usei WebSearch). Todos entraram em
`data.ts` (blocos `NOVOS_BR3_*` + 1 no baralho EU):
Kevin Viveros (Athletico-PR, artilheiro do Brasileirão 2026), Alexander
Barboza (Botafogo, zag, seleção da Libertadores/Brasileirão 2024), Willian
Bigode (Cruzeiro, ata, bi 13/14), Newton (Botafogo, volante do elenco campeão
2024), Leozinho (Athletico-PR, ex-futsal, promessa confirmada), Marcelino
Moreno (Coritiba, meia camisa 10), Allan Delon (Vitória, meia-artilheiro,
campeão baiano 2002), Alex Dias "Pantaneiro" (Goiás, vice-artilheiro
Brasileirão 2004 c/ 22 gols), Beto Acosta (Náutico, vice-artilheiro 2007),
Cédric Soares (São Paulo, lateral, campeão Euro 2016 — bem mais forte que
"foi profissional", ajustei o nível), Valdívia "Poko Pika" (Internacional,
NÃO é o Mago do Palmeiras — outro Valdívia, top de gols entre meias do
Brasil em 2015; nome da carta ficou "Valdívia (Poko Pika)" pra não confundir
com o outro), Roger Machado (Grêmio, lateral-esquerdo, 10 anos e 6 títulos —
achei bem mais decorado do que a pergunta original sugeria), Mariano
(Fluminense 2010 — foi o AUGE real dele, campeão brasileiro e um dos
melhores laterais do país no ano, não "promessa"; passagem de 2008 no
Atlético-MG foi curta e sem brilho, não usei essa), Mancini (foi pro baralho
EU, clube Roma — pesquisa confirmou que o auge mesmo foi lá, 222 jogos/59
gols, ídolo da torcida, "Tacco di Dio"; começou no Atlético-MG onde fez 15
gols numa Brasileirão como lateral, citado na bio).

PENDENTE — só sobrou 1 sem confiança suficiente pra não arriscar errar:
"Boiadeiro" do Goiás — achei o Ricardo Boiadeiro (atacante, mas o Wikipédia
lista Atlético-GO, não Goiás EC) e outros 2 jogadores diferentes com esse
apelido ligados ao futebol goiano — preciso do nome completo ou ano pra
saber qual dos 3 é.

## 🎚️ AJUSTE DE NÍVEL — leva de jogadores (10/08, à noite)
Diego revisou os níveis e pediu ajustes (já no ar em `main`):
subiu p/ CRAQUE: Arthur, Rodrigo Garro, Edu, Mancini. Subiu p/ LENDA: Dirceu
Lopes. Desceu de lenda p/ craque: Andrade (Flamengo 81 — o Adílio já tava
craque certo, não mexi). Desceu p/ bom jogador: Alexander Barboza. Desceu p/
foi profissional: Cédric Soares, Lingard. Careca (São Paulo 1986) já era
lenda, conferido, não precisou mexer.
PERGUNTA EM ABERTO pro Diego: ele perguntou se o Mariano (lateral) não seria
"promessa" no auge (2010, Fluminense, campeão brasileiro) — respondi no chat
que naquele ano ele já estava consagrado (não estreante), então mantive
"bom jogador"; só mudo se ele confirmar que quer assim mesmo.

## 🖼️ ARTE STORIES — 44 reforços
Gerada arte vertical (1080×1920) com todos os 44 jogadores agrupados por
posição, identidade visual do jogo (creme/preto/Oswald/sombra dura). SEM
cor por raridade e SEM texto de categoria — Diego pediu que os cards
fiquem todos iguais (só nome+clube). Arquivo:
`/tmp/.../scratchpad/story-novos-jogadores.html` (+ fontes Oswald ttf no
mesmo scratchpad) — gerada a screenshot via `playwright screenshot
--viewport-size "1080,1920"`. Já entregue ao Diego, aguardando OK final
pra postar.

## 🔍 AUDITORIA DE DATAS/FATOS — leva de jogadores (10/08, à noite)
Diego achou 2 problemas (Kaio Jorge duplicado + Lingard com ano errado — ele
chegou em 2026, não 2023) e pediu pra conferir TODAS as cartas novas. Fui
carta por carta com WebSearch e achei **16 erros reais** de ano/fato/clube
(taxa de erro alta — quase 40% das 44 cartas novas tinham algo errado):
- Lingard: ano 2023→2026 (chegou É este ano, não em 2023)
- Cuiabano: ano 2023→2024 (contratação foi abril/2024)
- Titi: ERA TOTALMENTE ERRADO — inventei "convocação pra Seleção" que não
  achei confirmação nenhuma; o Titi real jogou no Bahia 2011-2015 (não 2023),
  tricampeão baiano no período. Corrigido ano e bio.
- Gabriel Bontempo: ano 2024→2025 (estreou profissional em jan/2025)
- Natanael: bio dizia "lateral-esquerdo...foi pra Europa" — ele é
  lateral-DIREITO e não foi pra Europa, foi pro Atlético-MG em 2025.
- Bitello: ano 2022→2023 (foi vendido em set/2023)
- Rafael Tolói: ano 2011→2014 (saiu pra Atalanta em 2015, não logo em 2011)
- Edu: bio citava "Deportivo" errado — foi Arsenal e Valencia. Ano 1997→1999.
- Lucho González: ERRO GRAVE — disse que foi do Athletico-PR PRO Porto, mas é
  o contrário (jogou no Porto ANTES, no início da carreira, e chegou no
  Athletico já veterano em 2016, saindo em 2021). Ano corrigido 2005→2019,
  bio reescrita.
- Gabriel Pec: ano 2022→2023 (foi vendido em jan/2024)
- Elkeson: bio dizia "revelado no Botafogo" — ele foi revelado no VITÓRIA,
  só chegou no Botafogo em 2011. Ano 2010→2012, bio corrigida.
- Osvaldo: card dizia "Ceará" mas os anos que pus (2019-2021) eram do
  FORTALEZA — o Osvaldo no Ceará foi 2010-2011. Ano corrigido pra 2011.
- Lucas Arcanjo: ERRO GRAVE — inventei que ele era "cria do Athletico-PR
  emprestado ao Vitória" e "pegou pênaltis decisivos". Na real ele é cria
  da BASE do próprio Vitória (lá desde 2016), sem nenhum vínculo com
  Athletico-PR. Bio reescrita do zero.
- Marcelo Cirino: joguei ele em 2015, mas nesse ano ele tava EMPRESTADO ao
  Flamengo, não jogando pelo Athletico-PR. Ano corrigido pra 2019 (ano que
  fez o gol do título da Copa do Brasil) + bio mais precisa.
- Alex Alves: ERRO GRAVE de década — pus "2013" mas o auge dele no Cruzeiro
  foi 1998-1999 (artilheiro, vendido pro Hertha Berlin por US$7mi). Corrigido
  + adicionei o apelido real "Capoeira" (comemorava com golpes de capoeira).
- Félix Torres: bio dizia que ele foi "rumar ao futebol mexicano" mas é o
  contrário — ele VEIO do México (Santos Laguna) pro Corinthians. Corrigido.

Todas as correções já buildadas e no `main` (ao vivo). Conferido também se
"Kaio Jorge" tem duplicata na base — NÃO tem (só uma carta, Cruzeiro 2024).
Então a duplicata que o Diego viu no leilão não é erro de dado — pedi pra
ele mandar print/mais detalhe pra caçar se é bug de embaralhamento
(store.tsx) ou só duas telas mostrando a mesma carta (normal).

## 💰 GRANA MAIS FÁCIL NO CARREIRA (10/08, à noite)
Diego: "pessoal reclamando que tá difícil fazer grana no carreira" — 2 ajustes:
- Agência 2.0: carta LENDA sobe de 5→6 moedas/temporada (bate com o valor que
  o Empresário clássico já pagava).
- Patrocínio por aposta: tabela inteira DOBROU. Várzea 1/2/3→2/4/6, D
  2/4/6→4/8/12, C 4/8/12→8/16/24, B 8/16/24→16/32/48, A 16/32/48→32/64/96.
  Mira ajudar quem tá começando (Várzea/D), onde a bilheteria-base (20 fixo)
  ainda é quase a única renda garantida.
Ambos já no ar em `main`, build ok, reversível (só valor de tabela).

## 🎨 Mata-mata mais vivo — Copa dos 8, Copa Legends e Copa do Mundo (11/08)
Diego achava os jogos simulados (que ele não tá jogando) "muito feio" —
mockup aprovado, aplicado nos 3 sistemas de mata-mata do jogo:
- **Copa dos 8** (Jogo Rápido, `screens.tsx` `tieRow`/`copaFill`)
- **Copa Legends** (Carreira, `pyramidseason.tsx` `CopaLiveMatch`/`fillFor`)
- **Copa do Mundo** (`copa-mundo.tsx` `MiniLive`/`tieRow` — não tinha NEM cor
  antes, era texto puro; ganhou o visual dos outros dois)
O que mudou nos 3: time de ROBÔ ganha cor de verdade (antes era cinza
apagado de propósito — combinado com o Diego que pode perder essa "pista
visual" de bot); barrinha de progresso do tempo; flash dourado + "GOOOL
agora!" quando alguém acaba de marcar (só destaca o que JÁ apareceu no
placar — zero mudança no timing de revelação/anti-spoiler, conferido com
cuidado porque é ponto sensível do Diego); lista de jogos rolando vira
grade que se ajusta ao espaço (1 coluna no celular, mais em tela larga).
`copaSideColor`/`CopaHalves`/`copaCenterChip` viraram export de
`pyramidseason.tsx` pra dar pra reusar no `copa-mundo.tsx` sem duplicar.
Build ok, já no ar em `main`. NÃO consegui testar ao vivo num navegador de
verdade (sandbox sem acesso de rede configurado direito pro Supabase —
o jogo caía numa tela de manutenção) — pedido ao Diego pra conferir na
próxima Copa dele e avisar se tiver algo estranho (reversão é 1 commit).
Pendente ainda combinado, não mexido: melhorar visual da disputa de
pênaltis (ideias sugeridas no chat: ⚽/🧤 em vez de ✓/✕, destaque na
cobrança decisiva, cor diferente na morte súbita).

## 🏆 Copa do Mundo: visual preto e dourado + cor real das seleções (11/08)
Mockup aprovado pelo Diego ("ficou perfeito"). Aplicado de verdade em
`copa-mundo.tsx`: cabeçalho do torneio, caixas de grupo e caixa do
mata-mata agora em preto com detalhe dourado (tema de troféu). Criada
`PAIS_COLORS` com a cor real de cada uma das 16 seleções que já jogam
(Brasil amarelo, Argentina celeste, Alemanha preto, Holanda laranja
etc.) — usada em `MiniLive`/`tieRow` no lugar do hash genérico
(`copaSideColor`, que era o mesmo dos outros dois sistemas de copa).
Build ok, no ar. Não dava pra testar ao vivo de qualquer forma (Copa do
Mundo só destrava na temporada 100 da carreira — não rola simular até lá
numa sessão de teste rápida), então fica pro Diego conferir na conta dele
quando chegar lá (ele já tem carreiras avançadas, deve ser em breve).
Se aparecer alguma seleção nova no futuro, falta adicionar a cor dela em
`PAIS_COLORS` (cai no fallback do hash automático, só não vai ser a cor
real até alguém completar).

## 🎯 Disputa de pênaltis mais chamativa (11/08) ✅ NO AR
Retomando a pendência anotada acima. Mostrei 6 ideias em 2 mockups pro
Diego, ele escolheu 3 ("4-5-6"): implementadas em `PensShootout`
(`pyramidseason.tsx`), componente ÚNICO reusado pelas 3 copas do jogo
(Copa dos 8, Copa Legends, Copa do Mundo — mexeu 1 vez, valeu nas 3):
- **Morte súbita** ganha caixa vermelha com textura listrada + título em
  destaque (antes era só um texto pequeno "· MORTE SÚBITA" no cabeçalho).
- **Confete + tremidinha** no instante exato que o resultado final
  aparece (mesmo timing de antes — não adianta nem atrasa nada).
- **Telão final**: o placar vira uma caixa preta/dourada com um quadrado
  da cor de cada time dos lados (na Copa do Mundo é a cor REAL do país,
  via `PAIS_COLORS`; nas outras copas é a cor já sorteada do time —
  passado por um novo prop opcional `colorOf` no `PensShootout`).
Ideias NÃO escolhidas (1: ⚽/🧤 em vez de ✓/✕; 2: pausa de suspense na
cobrança decisiva; 3: bolinha de cada cobrança com a cor do time) ficam
guardadas caso o Diego queira depois — não implementadas.
Build ok, no ar em `main`. Revertível (1 commit:
`git revert 235160f` no main / `f076855` na branch de trabalho).

## 🏆 Auditoria "Libertadores" no baralho (11/08) ✅ NO AR
Diego perguntou pelo modo **"Glória Eterna Libertadores"** achando que já
tinha um baralho separado pra conferir — na real esse modo **NUNCA foi
programado**, só tem a ideia anotada mais acima ("Modo Libertadores
temático... AINDA PENDENTE") + mockups antigos. Expliquei isso a ele e, como
prep pro dia que o modo for feito de verdade, auditei as ~45 cartas do
baralho ÚNICO cuja bio cita Libertadores (clube+ano bate com a história
real?). Rodei em agente separado (pesquisa na web pros casos mais obscuros),
conferi cada achado eu mesmo antes de mexer. 7 cartas corrigidas em
`data.ts`:
- Alex Mineiro: não tava no Athletico em 2005 (emprestado ao Kashima
  Antlers no Japão) — ano 2005→2002, tirei o claim de Libertadores da bio.
- Andrés Escobar: título (1º colombiano campeão) foi 1989, card tinha 1991.
- Aranha: bio dizia "vice" 2011, Santos foi CAMPEÃO naquele ano.
- Carlos Germano: título do Vasco foi 1998, card tinha 1997.
- Deyverson: gol histórico do título é 2021, card tinha 2018 (1ª passagem,
  antes do feito).
- Nino: título de capitão do Flu foi 2023, card tinha 2021.
- Piquerez: bio dizia "bicampeão", só tem 1 título (chegou depois da final
  de 2020, jogada em jan/2021).
- Gabigol (Inter de Milão, 2017): card sem bio própria HERDAVA a bio do
  Flamengo dele (que fala de finais de Libertadores) por compartilhar o
  mesmo nome no dicionário de bios — bug estrutural, ganhou bio própria.
  ⚠️ Vale considerar se tem mais algum card assim (nome repetido em clubes
  diferentes, sem bio própria, herdando bio errada de outra fase da
  carreira) — não fiz uma varredura geral disso, só resolvi este caso.
NÃO mexido (fica pro Diego decidir, não tive certeza suficiente): Antony de
Ávila (ano 1990 não bate exato com nenhuma das finais de vice que achei —
1985/86 — mas ele jogou lá 1988-96 então não é erro grosseiro) e a bio do
Gabriel Mendoza (diz "Corinthians 99", pode ser Tigres UANL/México — não
afeta o veredito Libertadores do card, só um detalhe da frase).
44 cartas conferidas e certas, sem mexer. Build ok, no ar em `main`.

## 🎨 Cor do time na Copa = cor do escudo dele (11/08) ✅ NO AR
Diego notou no print da Copa Legends que o Guarani (fictício, "Guarani do
Cerrado") tava com fundo laranja — perguntou se não dava pra basear na cor
da LOGO do time, "não importa se é genérico ou não". Confirmado: os times
da Copa Legends (Guarani do Cerrado, Napolitano, Nacional da Serra etc.)
são fictícios das divisões, não têm "cor real" tipo seleção da Copa do
Mundo — mas o Diego só queria que a cor do card BATESSE com a do escudo do
mesmo time, sorteada ou não. Antes eram DOIS sorteios separados (escudo E
card de jogo), podendo dar cores diferentes pro mesmo time. Agora
`copaSideColor` (usada nas 3 copas: dos 8, Legends, Mundo) puxa direto o
`c1` (fundo) do `escudoDe()` — o MESMO gerador que desenha o brasão — então
card e escudo do time são sempre a mesma cor, para qualquer nome (real ou
fictício). Mexido em `screens.tsx` e `pyramidseason.tsx`. Build ok, no ar
em `main`. Revertível (1 commit: `e9a238c` no main).

## 🎨 Copa: faixa branca no meio com o placar (11/08) ✅ NO AR
Diego mandou print da Copa Legends + print do card de partida do próprio
jogo dele, perguntando se dava pra manter as cores dos times mas com um
fundo branco separando os dois no meio (onde fica o placar), igual ao card
do jogo dele. Mockup aprovado ("Pode fazer"). Aplicado nos 5 lugares que
mostravam o card de confronto da Copa (nos 3 sistemas: Copa dos 8, Copa
Legends — card grande ao vivo + lista de confrontos decididos do
chaveamento, Copa do Mundo — MiniLive + lista de confrontos): trocou o
fundo colorido cobrindo o card INTEIRO (placar flutuando numa pilulazinha
preta por cima) por 3 zonas lado a lado — cor cheia do time à esquerda,
faixa BRANCA no meio com o placar, cor cheia do time à direita. Resto
(barra de progresso ao vivo, flash de gol, escudo, anti-spoiler dos
pênaltis) preservado, só que agora fica embaixo da faixa colorida em vez
de por cima dela. O componente antigo `CopaHalves` (fundo full-bleed) foi
REMOVIDO do código — não sobrou nenhum uso dele. ⚠️ Cuidado que resolvi na
hora: o brilho holográfico do tier pago (ApoioSheen, aparece no lado
"você" quando é verde/roxo/prata/ouro) tinha ficado de fora na primeira
versão da troca — recolocado nos 3 lugares que precisavam (Copa dos 8,
Copa Legends card grande, Copa Legends lista). Build ok, no ar em `main`.
Revertível (1 commit: `d6b7346` no main).

## 🎨 Identidade da Copa dos 8 (roxo) e Copa Legends (verde-escuro) (11/08) ✅ NO AR
Diego pediu identidade visual por copa (tinha mostrado um mockup antigo da
"Glória Eterna" Libertadores — CONFIRMADO que não existe no código, é só
mockup salvo, expliquei de novo). 1ª tentativa com nomes novos ("Copa
Relâmpago", "Hall da Fama") foi REJEITADA — ele quer os nomes ORIGINAIS
(Copa dos 8, Copa Legends), só a cor entrando mais. 2ª versão aprovada
("Isso aí!! Pode aprovar"):
- **Copa dos 8** (`screens.tsx`): roxo `PURPLE` (#7C3AED) no cabeçalho da
  fase + no aviso "Chegou a Copa dos 8!".
- **Copa Legends** (`pyramidseason.tsx`): verde-escuro `COPA_LEG_GREEN`
  (#14401f) + dourado no cabeçalho da temporada (só na fase da Copa) e no
  painel do chaveamento "🏆 COPA LEGENDS".
- **Card de partida** (nos 2 sistemas): pedido do Diego — escudo agora fica
  EM CIMA do nome (não mais lado a lado, dá mais espaço pra ler); barra de
  progresso ao vivo subiu pro TOPO do card (antes ficava embaixo, entre
  placar e infos); moldura do card ganha a cor do tema (roxo/verde) SÓ
  enquanto tá rolando ao vivo — decidido volta pro preto normal, "seu jogo"
  continua vermelho (prioridade sobre o tema).
Copa do Mundo (preto/dourado) e Glória Eterna Libertadores (mockup, não
programada) ficam de fora dessa rodada — não foram pedidas dessa vez.
Build ok, no ar em `main`.

## 🐛 Copa Legends ONLINE: fase agora sincronizada pelo host (11/08)
Diego repassou relato de jogadores: "atualiza [a página] e muda o placar
todo" na Copa Legends. Investiguei com agente de pesquisa (só leitura) e
depois confirmei com o Diego que precisava mesmo ser corrigido. Achado:
- O RESULTADO final (campeão, placares, artilheiros) sempre foi 100%
  determinístico (semente + temporada) — refresh NUNCA mudou isso, nem
  antes desta correção.
- O problema real: a FASE da Copa (oitavas/quartas/semi/final) era um
  `useState` LOCAL de cada tela — cada convidado avançava sozinho no
  próprio relógio, sem nenhum dado sincronizado. Um F5/reconexão podia
  mostrar uma fase (e portanto um placar) diferente do que o host via na
  mesma sala. O aviso que já existia na tela pro convidado ("a próxima
  fase anda quando o host avançar") não era verdade — hoje passou a ser.
Corrigido: novo campo `EscState.copaRound` (só o HOST escreve, via
`dispatch({type:'SET_COPA_ROUND'})`, gate por `state.isHost` — igual o
`state.round` da liga) — o mecanismo de sync que já existe (host reemite o
estado a cada mudança) propaga sozinho, nada novo de rede. Carreira SOLO
(offline) continua 100% em `useState` local, zero mudança de
comportamento. Mexeu em `types.ts`, `store.tsx`, `pyramidseason.tsx`.
Build ok, no ar em `main`. Não dava pra testar ao vivo numa sala online de
verdade nesta sessão (sandbox sem 2 abas simultâneas de teste) — pedido
ao Diego pra avisar se algo parecer estranho numa sala online (reversão é
1 commit).

## 🐛 Fundo roxo da Copa dos 8 sumido (bug de CSS) — corrigido (11/08)
Diego mandou print: a caixa "Chegou a Copa dos 8!" e o cabeçalho da fase
apareciam esbranquiçados, texto quase ilegível (era pra ser roxo). Causa:
o componente `Box` (screens.tsx) usava a prop `bg` como CSS
`backgroundColor`, que NÃO aceita degradê — só cor sólida. A identidade
roxa da Copa dos 8 (adicionada hoje) usa `linear-gradient(...)`, o
navegador ignorava o valor inválido e a caixa ficava sem fundo nenhum.
Corrigido: `backgroundColor` → `background` no componente (aceita sólido
E degradê, sem quebrar quem já usava cor sólida — só 2 lugares usavam
degradê, os 2 novos de hoje). Build ok, no ar em `main`.

## 🐊 Festão do mascote também no Jogo Rápido/Copa dos 8 (11/08)
Diego: ganhou a Copa dos 8 no Jogo Rápido online e o festão do mascote
(feature nova de "Sócio Legends" — `mascotes.tsx`/`manto.ts`, de outra
sessão) não apareceu. Achado em `screens.tsx` (`EscEnd`): a condição só
olhava campeão da LIGA (`youWon`), igual o mesmo recorte que já existe na
Copa Legends da carreira (`pyramidseason.tsx`, só liga também, não mexido
por enquanto — fora do escopo combinado). Agora conta liga OU Copa dos 8
(`state.quickCopa?.champion?.id === you.id`, "por quem vê" — nunca o flag
`.you` global, que no online marca todo humano por igual). Mesma trava de
1x por sessionStorage (ganhar os dois no mesmo jogo festeja só 1 vez).
Build ok, no ar em `main`.
⚠️ Nota pra próxima sessão: `mascotes.tsx`/`manto.ts` (Sócio Legends: 30
moedas/mês, escudo à mão, mascote+festão, manto do coração, nome do
estádio) foram adicionados por outra sessão em paralelo — ainda sem
entrada própria nesse diário explicando o desenho completo (RPC
`esc_meu_socio`, tabela `esc_socios`, painel `esc_admin_socio_perso`). Se
mexer nessa área de novo, vale ler o código direto (`manto.ts` tem os
comentários) antes de assumir o que já existe.

## 🎪 Torcidômetro + 🚨 Riscômetro financeiro (Modo Carreira) — parte 1 (11/08)
Longa conversa de design com o Diego (várias idas e voltas — vale ler o
histórico do chat se precisar do racional completo). Fechado e IMPLEMENTADO:

**Torcidômetro** (`state.careerTorcida`, `Record<string, number>` 0-100 por
time humano, chave `m<id>`, começa em 50): atualiza **1x por temporada**
(no fim, junto com título/colocação — reaproveita o `tables` que já
calcula `computePromotions`/`seasonChampions`, função nova
`torcidaDeltas()` em `pyramidseason.tsx`) pela colocação final:
- 1º-4º: **+5** · 5º-6º: **+4** · 7º-14º: **0** · 15º-16º: **−4** ·
  17º-20º: **−5** · subiu/caiu de divisão DE VERDADE: **+5/−5** a mais
- ✅ Régua CONFIRMADA pelo Diego (12/08) pra TODOS os 20 lugares — a 1ª
  versão tinha 3 degraus chutados por mim (1º/2º/4º), corrigido.
- Aparece no cabeçalho do clube (escudo/nome/dinheiro) — carinha + barra
  + %. **Nunca** perto de jogador/elenco (pedido explícito do Diego).

**Riscômetro** (usa `state.careerCoins` que já existe, NADA de campo novo):
barra verde/amarelo/vermelho dentro do Extrato, só aparece quando o caixa
fica negativo, aviso vago ("coisas piores podem acontecer com o time")
— nunca cita jogador.

**✅ TUDO IMPLEMENTADO (12/08, 3 entregas seguintes no mesmo dia):**
- **Bônus de moedas** (`torcidaBonusRewards` em `pyramidseason.tsx`): torcida
  ≥55% no fim da temporada paga +8 🪙, ≥80% paga +15 🪙 — sempre por cima do
  que o clube já ganha (misturado no mesmo balde de "Prêmios da temporada"
  do extrato; dar uma linha própria exigiria mexer na contabilidade de
  fechamento de temporada, código sensível — fica pra depois se o Diego
  quiser).
- **Histórico sutil** (`careerTorcidaHist`, `torcidaHistEntries`): chips tipo
  "+5 · 3º lugar · +5 · subiu de divisão" embaixo da barra, guarda os
  últimos 6, mostra os últimos 3 — igual ao mockup aprovado.
- **Lotação + chuva/Camarote** (`StadiumTab` em `estadio.tsx`, props novas
  `torcidaPct`/`chuvaHoje`): card "Lotação do próximo jogo" logo depois do
  desenho do estádio (StadiumSvg) e da bilheteria fixa — a lotação segue o
  torcidômetro; dia de chuva (sorteio determinístico por seed+rodada, ~28%
  dos jogos, calculado em `pyramidseason.tsx`) derruba a lotação SÓ daquele
  jogo, a menos que o clube já tenha o Camarote construído. Nunca toca na
  bilheteria fixa por temporada (isso é outro número, intocado).
  ⚠️ Mockup mostrado (`mockup-lotacao-chuva.png`) e aprovado pelo Diego
  ("Já dei ok pode fazer") antes de codar.
Build ok em cada passo, tudo no ar em `main`. Não testado ao vivo (precisa
jogar de verdade pra ver o número da torcida mudar, o bônus cair no caixa e
pegar um dia de chuva) — pedido ao Diego pra conferir.

**🎨 Stories pro Instagram**: 3 imagens 1080x1920 feitas e entregues (não
fazem parte do jogo, só material de divulgação): torcidômetro sozinho,
riscômetro com tom de MEDO (ligado ao evento "jogador vai embora"), e uma
versão "tudo junto" com os 3 recursos numa imagem só (fontes reduzidas pra
caber). Arquivos ficaram só no scratchpad da sessão (não versionados).

## 🚨 Crise financeira (Modo Carreira) — parte 2, IMPLEMENTADA (12/08)
"Pode iniciar" do Diego → construí o EVENTO GRANDE que tava pendente da
entrega acima. Design já vinha 100% fechado do chat (releitura antes de
codar), resumo do que ficou:

**Gatilho** (`state.careerDebtBarrier`, `Record<number, number>` por
técnico, e a lógica em `pyramidseason.tsx`): quando o caixa cruza uma
barreira NOVA de −500 (−500, −1000, −1500...), o jogador de MAIS FAMA do
elenco (empate: maior `hi`) anuncia que vai embora. Matemática confirmada
com o Diego: barreira já cruzada = `Math.ceil(caixa/500)*500`. A 1ª vez
que o app observa o caixa de uma conta, ele só GRAVA essa marca (sem
disparar banner) — assim quem já tava fundo no vermelho quando a feature
foi ao ar não "deve" as barreiras antigas, só a PRÓXIMA conta daqui pra
frente. Só carreira SOLO (mesmo padrão do banner de evento de jogador —
online tem estado compartilhado, fica de fora por segurança, igual o
banner da TV e o dos eventos de jogador já faziam).

**Banner** (`CriseBanner` em `pyramidseason.tsx`): é um AVISO, não uma
pergunta — "Não jogo em time duro assim, não." + o nome do jogador + tag
vermelha "CAIXA NO VERMELHO". Duas respostas:
- **"Aqui não tem mercenário"** → lista de gente da categoria **"foi
  profissional"** (fame 1), filtrada pela posição que abriu.
  ⚠️ CORREÇÃO (12/08, mesmo dia): a 1ª versão desta entrega inventou uma
  lista nova (`FOLCLORICOS_LIVRES`) com bios escritas por mim — o Diego
  apontou o erro: Mauro Shampoo, Carlos Kaiser, Adriano Gol Contra e o
  resto da categoria "foi profissional" **já existem de verdade no
  catálogo** (`CATALOG`/`CATALOG_EU`/`CATALOG_BOTH`/`catalogTodos()`,
  `fame===1`), com bio/clube/ano reais. Removi a lista inventada; agora a
  tela busca direto no catálogo REAL da carreira (mesmo baralho
  br/eu/both/todos que o jogo já usa), priorizando quem tem selo
  folclórico (`folk:true`) — cai pra "foi profissional" sem selo só se a
  posição não tiver folclórico nenhum. **Lição pra quem mexer aqui de
  novo:** antes de inventar conteúdo novo pro jogo, checar se já não
  existe no catálogo — "foi profissional"/folclórico já é um sistema
  grande e pronto.
  - Quem já tá jogando em ALGUM time (seu ou de bot) some da lista —
    evita duplicar a mesma pessoa em 2 lugares. Vende/solta depois? Ele
    volta a aparecer sozinho (calculado on-the-fly, sem flag "usado").
- **"Nunca gostei dele mesmo"** → sobe alguém da BASE, reaproveitando 100%
  o `spawnCria()` que já existia pro tapa-buraco de contrato vencido
  (mesmos nomes de `CRIA_NOMES`, mesma mecânica) — esses sim são
  inventados, igual sempre foram.
- O jogador que saiu só é removido do elenco — não narra pra onde ele foi
  (pedido explícito do Diego: "não precisa falar nada no jogo dessa troca").
- Trava a tela igual o banner de evento de jogador (não anda "Próxima
  rodada"/Copa enquanto não decide) e nunca aparece em cima da Copa Legends
  ao vivo nem da tela de fim de temporada.
- 🤡 Piada pedida pelo Diego: o botão "Aqui não tem mercenário" faz bravata
  ("temos gente MELHOR, pode confiar") e um aviso embaixo dos 2 botões
  zoa que, seja base ou "foi profissional", ninguém ali é bom de bola —
  é de graça mesmo.

**Reversível:** é só um novo jogador de graça entrando (mesma mecânica do
Cria da Base que já existe há meses) — se algo sair torto, é reverter o
commit, não tem save quebrado nem estado que trava o jogo.

**Arquivos:** `types.ts` (`careerDebtBarrier`, `careerCrise`), `store.tsx`
(3 ações novas: `SEED_DEBT_BARRIER`, `START_CAREER_CRISE`,
`RESOLVE_CAREER_CRISE`), `data.ts` (`FOLCLORICOS_LIVRES`),
`pyramidseason.tsx` (gatilho + `CriseBanner`).
Build ok. **Não testado ao vivo** (precisa realmente deixar o caixa
negativo numa carreira solo de verdade pra ver o banner disparar) — avisar
o Diego pra testar e conferir se o texto/fluxo tá do jeito que ele
imaginou.

## 🐛 Medalha errada (3º lugar mostrava "2") + 🎯 tática na Copa dos 8 (12/08)
Relato de um jogador (print de WhatsApp que o Diego repassou), jogo rápido
vs CPU:

- **Bug real**: a carta de compartilhar (`buildShareCardBlob` em
  `screens.tsx`) e o cabeçalho de fim de temporada (`placementHeader`)
  usavam 🥈 pra QUALQUER posição dentro da zona de acesso (ex.: top 4 de
  20) — só que 🥈 É literalmente a medalha "2º lugar" (tem um "2" desenhado
  nela nos emojis). Quem ficava em 3º ou 4º via a medalha de prata com "2"
  do lado do texto certo "3º LUGAR"/"4º LUGAR" — visual contraditório.
  Trocado por 🏅 (medalha genérica, sem número) nos 2 lugares. Não mexi na
  lógica de zona (continua sendo "zona de acesso" proporcional, só o ícone
  não promete mais uma posição que não é a de verdade).
- **Pedido do jogador**: a tática (🧱 Retranca / ⚖️ Equilíbrio / 🔥 Ataque)
  já existia no jogo rápido, mas só na LIGA — sumia na Copa dos 8. Conferi
  o motor (`simMatch` em `store.tsx`): ele SEMPRE leu `state.tactics[id]`,
  inclusive nos jogos da Copa — só faltava o BOTÃO pra trocar durante a
  Copa (ficava travada na última escolha da liga). Adicionei o mesmo
  seletor (reaproveitando 100% o componente que já existia) na tela da
  Copa dos 8, logo depois do cabeçalho roxo da fase.
- ⚠️ **Pendência em aberto, NÃO mexida**: o Diego reclamou que a arte da
  carta de compartilhar do jogo rápido/CPU (fundo creme, faixa amarela
  "🔨 LEILÃO LEGENDS", texto em lista "Pontos:/Artilheiro:/Campeão da
  temporada:") tá "muito feia" pro nível visual atual do jogo. Não mexi
  nisso ainda — é redesign de verdade (precisa mockup + OK do Diego antes,
  regra do próprio Diego pra qualquer visual novo). Se for pedido de novo,
  o arquivo é `buildShareCardBlob`/`buildChampionShareBlob` em `screens.tsx`.
Build ok, no ar em `main`. Reversível (2 emojis trocados + 1 bloco de UI
reaproveitado — sem campo novo no estado).

## 🐛 Botão do estádio prometia "+20" mesmo quando ia cobrar menos (12/08)
Relato de usuário (via Diego): "Cadeiras custa 90 mas os investimentos vão
de 80 pra 100 — paga 10 a mais". **Investiguei e o jogo NUNCA cobrou a
mais**: o reducer (`STADIUM_INVEST` em `store.tsx`) já fazia
`Math.min(STADIUM_STEP, custo - investido, carteira)` — o clique final de
Cadeiras (80/90) sempre cobrou só +10, nunca +20; total pago sempre bate
exatamente o "custo total" mostrado. O bug de verdade era só o BOTÃO
(`StadiumTab` em `estadio.tsx`), que sempre escrevia "Investir +20 💰"
mesmo no clique que ia cobrar menos — dava a entender (corretamente, pela
lógica do próprio jogador) que o total ia estourar. Corrigido pra mostrar
o valor REAL do próximo clique. De brinde, achei e corrigi um bug
funcional junto: a trava de "sem grana" (`poor`) comparava com o +20 fixo
também, então podia travar o clique final barato de alguém que já tinha o
suficiente pra completar o setor (ex.: 15 moedas não bastam pra "+20", mas
bastam pra completar os 10 que faltavam).
Só afeta Cadeiras (90) e Camarote (150) — os únicos setores que não são
múltiplo de 20 (Gramado/Geral/Visitante fecham exato, sem clique parcial).
Build ok, no ar em `main`. Reversível — só troca o número mostrado no
botão e a conta da trava, nenhum campo de estado novo.

## 👑 Novo Lenda: chiarentin.dyno127@gmail.com (12/08)
Pedido do Diego: "add esse usuário, como Lenda e tudo que tem direito".
Adicionado em `apoio.tsx` — tier `ouro` no `FOUNDERS` + `FUNDADOR_N`
(tudo do ouro: cor/selo 👑, brilho, Modo Manual + selo de fundador 🖋️).
Sem batismo (Diego não passou nome de clube — só entra quando for pedido
explicitamente, igual todo mundo dessa lista).
⚠️ **Colisão com sessão concorrente**: outra sessão adicionou o Tio Sapeka
(@tiosapekagg, batismo Sapekeiros FC) como fundador nº41 quase na mesma
hora — o cherry-pick pro `main` bateu de frente (os 2 tentaram usar o
nº41). Resolvido mantendo os DOIS: **Tio Sapeka = 41, chiarentin = 42**
(o commit local ficou com a mensagem desatualizada dizendo "41" por
engano — o número de verdade no código é 42, mais confiável que a
mensagem do commit).
Build ok, no ar em `main`. A fonte oficial de tier é a tabela
`user_colors` do Supabase (o Diego gerencia no painel dele) — isto aqui é
só a lista de reserva no código, que o jogo usa se o banco não responder.

## 🎪 Torcidômetro ao vivo + 🗑️ banner preto do batismo removido (12/08)
Duas pendências rápidas do Diego:
- **Torcidômetro ao vivo**: o medidor ficava travado a temporada toda,
  só atualizando na virada. Agora o número exibido é `banco + degrau da
  posição ATUAL na tabela` (recalculado a cada render, nunca grava nada
  novo) — sobe/desce em tempo real conforme a rodada avança. O valor
  BANCADO (`state.careerTorcida`, o que paga bônus e vira histórico)
  continua intocado, só muda de verdade na virada como sempre foi.
- **Banner preto do sócio-batismo removido**: `SocioBaraoBanner` em
  `pyramidseason.tsx` mostrava uma lista grande de vantagens (30
  moedas/mês, escudo, mascote, manto, estádio) + botão de Instagram toda
  vez que um sócio de batismo abria a carreira — o Diego achou repetitivo
  e pediu pra tirar (confirmado explicitamente: remoção total, não só
  encurtar). A CREDITAÇÃO das 30 moedas/mês continua rodando sozinha
  (nunca dependeu do banner aparecer) — só sobrou um avisinho pequeno e
  discreto ("🪙 as 30 moedas caíram") quando cai, sem a lista de
  vantagens nem botão nenhum.
Build ok, no ar em `main`. Reversível nos dois — nenhum campo de estado
novo, só lógica de exibição.

## 💸 Investigação: "difícil ganhar dinheiro na Várzea" (12/08)
Pessoal reclamando pro Diego. Fui atrás e mapeei TODA fonte de renda da
carreira, comparando Várzea × resto — a Várzea é a ÚNICA divisão que:
- Fica de fora da **Copa Legends** inteira (`COPA_DIV_STRENGTH`, comentário
  já dizia "Várzea não joga a Copa — só A-D") → perde campeão/vice/
  artilheiro da Copa.
- Tinha **ZERO cota de TV** (`TV_COTA`, era `{ A:20, B:15, C:10, D:5, V:0 }`).
- Tem os MENORES prêmios em tudo que É proporcional (artilheiro +6 vs +30
  na A; patrocínio 2/4/6 vs 32/64/96 na A).
- Some com a maior parte do que construiu no estádio se não tiver bem
  colocada (sistema de OCUPAÇÃO — `occByPos` em `estadiodata.ts`, já
  existia de outra sessão: top4=100%, meio=55%, Z4=18% do que foi
  construído).
**Implementado (só isto, o resto ficou pra decisão futura do Diego)**:
Várzea agora tem cota de TV = **1** (era 0). Não resolve tudo (a Copa
fora do escopo, e a ocupação continua igual) — foi só o "buraco" mais
fácil e barato de tapar, símbolico mas tira o zero. `TV_COTA` em
`store.tsx`.
**Ainda em aberto (perguntei, Diego não decidiu ainda)**: subir o PISO da
ocupação só na Várzea (hoje 18% no rebaixamento — ficaria tipo 40%) pra
quem tá começando não ficar preso no fundo do poço.
Build ok, no ar em `main`.

## 🔒 BATISMO SEM RESERVA DE NOME — 8 clubes achados (20/08) ✅ 6 consertados

Relato do Diego: o Lucas (lucas_calefi@outlook.com) não conseguia pôr **Coringas
do Diniz** como nome do time — a tela dizia *"⚠️ Já existe um técnico com esse
nome"*. Investigado, eram **dois problemas somados**:

1. **O batismo dele nunca foi cadastrado na tabela de reserva** (`esc_nomes_batismo`).
   A RPC `esc_nome_livre` (manto.ts:137) olha ESSA tabela primeiro: se o nome é de
   batismo e o e-mail bate, libera. Como a linha não existia, o nome caiu na regra
   comum de "nome único" e foi tratado como nome de estranho.
2. **Outra conta já usava o nome**: `brenodinoliveira@gmail.com`, com "Coringas do
   diniz", conta criada em **17/07** — um mês ANTES do batismo (16/08).

Auditoria: dos **26 clubes batizados no código, 8 estavam SEM reserva** —
Coringas do Diniz · Crias do Bigão · Futpoint FC · Nata de SP · Seven City ·
Tricolor do Arruda FC · Vasco da Grana · White Thigs do GuGu. Ou seja, não era
caso isolado: **o cadastro da reserva estava saindo do roteiro do batismo**.

✅ **Consertado agora** (insert só-adiciona, reversível): Coringas do Diniz →
lucas_calefi@outlook.com · Crias do Bigão → giovannecastro784@hotmail.com ·
Futpoint FC → gfpicolo13@gmail.com · Nata de SP → pedrinhocamisa8@gmail.com ·
Seven City → glaucomiranda@outlook.com · Tricolor do Arruda FC → souzact12@gmail.com.

⏳ **Falta o Diego decidir**:
- **Breno × Lucas**: o Lucas agora consegue salvar o nome, mas o Breno continua
  com "Coringas do diniz" — dois técnicos com o mesmo nome, o que fura a regra do
  "@ único". O que fazer com o Breno?
- **Vasco da Grana**: quem é o dono? Hoje quem usa o nome é `caiovvzmx@gmail.com`.
- **White Thigs do GuGu**: qual o e-mail do GuGu? Ninguém usa o nome hoje.

📌 **Pra não repetir**: cadastrar em `esc_nomes_batismo` tem que virar passo FIXO
do roteiro de batismo, junto com `LOGOS_PRONTAS`, `MASCOTES`, `data.ts` e
`apoio.tsx` (a regra 8 do CLAUDE.md).

### 🛡️ O ESCUDO COLA PELO NOME, NÃO PELA CONTA (achado 20/08)

Pergunta do Diego: *"o Breno ganha o escudo do Coringas do Diniz, ou não?"*
Conferido no código: `Escudo()` (escudos.tsx:1130) faz
`LOGOS_PRONTAS[nome] ?? LOGOS_PRONTAS[newestTeamName(nome)]` — **bate pelo NOME
EXATO da string, sem olhar quem é a conta**. Então:

- **O Breno NÃO tem o escudo hoje** — por sorte: o nome dele é "Coringas do
  **d**iniz", com d minúsculo, e a chave no código é "Coringas do **D**iniz".
- ⚠️ **A ideia de renomear o Breno pra "…FC" é justamente a pior saída**:
  `'Coringas do Diniz FC'` **é uma das chaves do escudo** (as variações existem
  pro DONO não perder o escudo se acrescentar FC). Renomear ele pra FC
  **entregaria o escudo do Lucas pra ele**. Nome novo do Breno tem que ser um que
  não bata em NENHUMA das 48 chaves de `LOGOS_PRONTAS`.

**Auditoria completa das 48 chaves × todas as contas** achou 2 estranhos já com
escudo de batizado (ambos criaram conta ANTES da trava de nome único, de 10/08,
então passaram por baixo dela):
- `lucasjogomes@gmail.com` está com **"Marolados FC"** (batismo do paisagensetrilha) — criou 02/08.
- `arrudabernardo213076@gmail.com` está com **"Arruda"**, que é chave do escudo do
  **Tricolor do Arruda FC** (Geovany) — criou 06/08. Provável coincidência de sobrenome.

E **"Marinheiros AS"** (`feehcamp11@gmail.com`) tem escudo artesanal no código e
**nenhuma reserva** — falta descobrir de quem é esse batismo.

**Correção de raiz sugerida (não feita — precisa de OK do Diego)**: o escudo
artesanal só aparecer pra quem é o DONO (cruzar com `esc_nomes_batismo`), em vez
de bater só pela string. Mexe em tela que está no ar, então entra em commit
isolado e revertível.

### ✅ CONSERTADO (20/08): chave do escudo passa a ser o NOME INTEIRO

Ordem do Diego: *"não tem nada a ver o cara escreveu o nome de Arruda, e isso ser
uma chave dos escudos do tricolor do Arruda, está errado. A chave igual é nome
seja maiusculo ou minúsculas e fc"*.

**No código** (`escudos.tsx`):
1. **Apagadas as 11 chaves-APELIDO** que gente de fora digita sem querer:
   `Arruda` · `Tricolor Arruda` · `Coringas` · `Ferrari` · `Ferrari FC` ·
   `Ferrari SC` · `Seven` · `Seven FC` · `Crias` · `Nata SP` · `Eros`.
2. **A busca virou `chaveEscudo()`**: ignora maiúscula/minúscula, ignora acento
   (Bigão = Bigao) e ignora o "FC" no fim. Então o dono acha o escudo dele
   escrevendo como quiser, e **só o nome COMPLETO vale**.

**No banco** (tudo reversível numa linha; o nome velho ficou guardado em
`raw_user_meta_data->>'nome_antigo_ccr'`):
- `brenodinoliveira@gmail.com`: "Coringas do diniz" → **"Coringas do Breno"**.
  Conta com **1 acesso só (17/07)**, 1 carreira, 0 linhas de rank, 0 salas. A
  troca era obrigatória: com a chave ignorando maiúscula, ele passaria a usar o
  escudo do Lucas.
- `lucasjogomes@gmail.com`: "Marolados FC" → **"Time do Lucas G"**. Conta com
  **1 acesso (02/08) e ZERO carreira** — estava com o escudo do paisagensetrilha.
- `arrudabernardo213076@gmail.com`: **não precisou mexer** — só apagar a chave
  'Arruda' já resolveu. Ele fica com o nome dele e escudo automático.
- Reserva criada pra **"Marinheiros AS"** (`feehcamp11@gmail.com`): não é batismo,
  é **assinatura paga de personalização**, e o nome estava sem proteção.

⚠️ **Sobra um caso pro Diego olhar**: `Eros FC` normaliza pra `eros`, então quem
escrever só **"Eros"** pega o escudo. É consequência da regra do "FC" — e as 4
variações (Eros, Eros FC, Eros Reis, Eros Reis FC) estão reservadas pro
erosreis@outlook.com.br no banco, então ninguém novo consegue tomar. Só quem já
tinha o nome antes da trava é que passaria.

**Decisão do Diego (20/08): "deixa assim mesmo"** — os dois casos que sobraram
ficam como estão, sem renomear:
- `alexandrelourenco1238@gmail.com` com "Nata de SP fc" (tem carreira jogada);
- `danielnfilho@gmail.com` com "Manfré" (é sobrenome, pode ser parente/2ª conta
  do próprio dono).
Não reabrir esses dois sem ele pedir. A trava nova já impede que apareçam NOVOS
casos — estes dois são de antes dela.

---

## ✅ 21/08 — Desempate das tabelas: VITÓRIA antes do saldo

Usuário (Guilherme) mandou print do Modo Carreira: três times com **68 pontos**,
e a tabela colocou em 1º quem tinha **19 vitórias e saldo 32**, na frente de
quem tinha **20 vitórias e saldo 25**. Palavras do Diego: *"Tá errado esse 2º
lugar… o desempate tem q ser qm tem mais vitórias. E dps é por gols. E não gol
primeiro não"* — e vale pra **qualquer tabela do jogo**.

Regra oficial agora, em TODA classificação:
**1º pontos · 2º mais vitórias · 3º saldo de gols · 4º gols marcados.**

Quatro tabelas estavam pulando a vitória e já foram corrigidas:
- `pyramidseason.tsx` → `sortDiv` (Modo Carreira — a da foto)
- `careeronline.tsx` → `sortDiv` (carreira online antiga)
- `pyramid.tsx` → `sortSim` (pirâmide simulada)
- `dinastia.tsx` → `sortTable` (Dinastia; o sorteio aleatório continua por último)

Já estavam certas (não mexer): `store.tsx` (liga e grupos da Libertadores do
Rápido), `screens.tsx` (tabela do Rápido) e `copa-mundo.tsx` (grupos da Copa).

⚠️ Isso muda a ORDEM de tabelas de carreiras já em andamento (G4, Z4, acesso).
É de propósito: a tabela passa a mostrar o que sempre deveria. Não é novidade de
home — é conserto.

---

## ✅ 21/08 — A Chape no jogo (7 cartas) + gerador do post

Diego pediu pra completar a homenagem à Chapecoense e postar marcando o clube,
a família e os sobreviventes. Entraram no baralho BR:
- **Follmann** (GOL 2016, foi profissional) — fecha o trio de sobreviventes do voo
  junto de Alan Ruschel e Neto, que já estavam.
- **Cléber Santana** (MEI 2016, bom jogador) — o capitão de 2016.
- **Bruno Rangel** (ATA 2016, bom jogador) — maior artilheiro da história do clube.
- **Kempes** (ATA 2016, bom jogador) — entrou como `Kempes (Chape)` porque o
  baralho europeu já tem o **Mario Kempes**, e ele foi batizado em homenagem a ele.
- **Everaldo saiu** do baralho a pedido do Diego.

Total hoje: 7 cartas com `club: 'Chapecoense'`.

**Toda bio saiu de fato conferido em pesquisa** — nada de chute. É gente real e
uma tragédia real: a regra do Diego (*"não inventar como uma pessoa real é"*)
vale em dobro aqui. Se entrar mais alguém da Chape, pesquisar ANTES de escrever.

📸 O post mora em **`scripts/mockup-chape.mjs`** (1080×1920, Stories). Ele lê a
lista direto do `data.ts` filtrando `club === 'Chapecoense'`, então **quando
entrar mais gente é só rodar de novo** e o post se atualiza sozinho:
`node scripts/mockup-chape.mjs --saida chape.png`

⚠️ Detalhe do gerador: o `Ã` do Oswald em corpo grande precisa de
`line-height >= 1.2`, senão o til escapa da linha e aparece solto na linha de
cima. Não baixar disso.

---

## 🏐 21/08 — Parceria Futevôlei Depressão (@futevoleidepressao, 266 mil)

Patrocinador que o Diego trouxe: página de humor de futevôlei, o Pedrinho.
Mockup da proposta: **`scripts/mockup-futevolei.mjs`** (roda com `--logo` e os
números). Cinco encaixes desenhados e aprovados visualmente pelo Diego:
1. **Torneio dos 4 últimos da Várzea** — 2 semis + final, **jogo único, set até
   18**, **dupla SORTEADA** do elenco. Prêmio: 🩴 Chinelo de Ouro (0 ponto no ranking).
2. **A quadra** — a marca NA REDE, no meio da tela da partida. Mais o "busca-bola".
3. **Bico de Folga** — a marca vira o 5º bico (`BICO_BRANDS` em store.tsx +
   a lista `BRANDS` em pyramidseason.tsx). Cargo: "busca-bola na quadra de areia".
   👉 **É o menor de todos** — dá pra subir sozinho, sem tela nova.
4. **Patrocinador do clube** — entra em `SPONSOR_BRANDS` (estadiodata.ts), na
   meta tier 1 ("não cair").
5. **Zoeira do folclórico** — aviso ANTES da partida: o cara faltou o treino pra
   jogar futevôlei. Trava combinada: só carta `folk`, só Várzea/Série D, e o
   aviso aparece antes de escalar (nunca no meio do jogo).

⚠️ **FATO CONFERIDO NO CÓDIGO**: o Diego achava que a Várzea não jogava a Copa do
Brasil. Joga sim — `copa-brasil.ts` diz explicitamente *"Várzea joga a Copa do
Brasil inteira, ao contrário da Copa Legends, que a exclui"*. Quem exclui a
Várzea é a Copa **Legends**, a antiga. Por isso o critério do torneio virou
"os 4 últimos da Várzea" (fundo do mundo: não sobem, não caem, já caíram da copa).

🖼️ O **logo** usado no mockup foi recortado do print do Instagram. Pra valer,
**pedir o arquivo original** ao Pedrinho (igual foi feito com o Rei das Tintas).

### 📊 SQL dos números do mockup (esta sessão não tem acesso ao Supabase)
O mockup mostra "—" enquanto ninguém rodar isto. **Não inventar número.**

```sql
-- 1) contas criadas nos últimos 30 dias
select count(*) as contas_30d
from auth.users
where created_at >= now() - interval '30 days';

-- 2) carreira mais longa + média de temporadas
--    (o save é { __multi:1, careers:[{save:{seasonNo,...}}, ...] };
--     rows antigas guardam o EscState cru, por isso o CASE)
with c as (
  select (car->'save'->>'seasonNo')::int as temporada
  from esc_pyramid_saves s,
       lateral jsonb_array_elements(
         case when jsonb_typeof(s.save->'careers') = 'array'
              then s.save->'careers'
              else jsonb_build_array(jsonb_build_object('save', s.save)) end
       ) as car
)
select max(temporada) as carreira_mais_longa,
       round(avg(temporada), 1) as media_temporadas,
       count(*) as total_carreiras
from c
where temporada is not null;
```

Com os números na mão:
`node scripts/mockup-futevolei.mjs --logo fd_logo.png --contas "7.1 mil" --recorde 106 --media 4.2`

---

## ✅ 21/08 — O nível da carta agora acompanha o baralho (elenco da carreira)

Diego viu um usuário na carreira com **Marcelo Vieira e John Terry** e perguntou:
*"mas lembra que a gente adicionou várias lendas? Não atualizou não???"*

**Conferido no código antes de responder:** o baralho ESTÁ certo — os dois são
`fame: 5` desde 19/08 (commits `6efc7a8` e `e451253`) e estão no ar. O furo era
outro: quando alguém arremata, a carta é **copiada pro save** com o nível
daquele dia (`WonCard extends Card`), e congela. Quem já tinha o Marcelo no
elenco continuava vendo ⭐ CRAQUE numa carta que virou 👑 LENDA.

🎯 **A CAUSA DE VERDADE (corrigido depois que o Diego insistiu):** minha
primeira explicação foi a carta já ganha, e estava incompleta — ele viu **AO
VIVO, no leilão**. Na carreira, **da 2ª temporada em diante o baralho do pregão
NÃO é montado do catálogo**: ele é montado a partir do **elenco guardado dos
bots** (`managers[].squad` dos bots de mercado) e dos **60 times de fundo**
(`cpuSquads`, que o próprio comentário diz que é *"semeado 1x"*). Ou seja: um
Marcelo Vieira parado no elenco de um bot desde que a carreira começou vai a
leilão com o nível daquele dia. Por isso apareceu ⭐ CRAQUE no martelo.

O **álbum** já resolvia isso sozinho (`CARD_META` em `screens.tsx` regrava o
nível do catálogo por cima do salvo). Faltava o resto do save.

Agora `sincronizaNiveis()` (store.tsx) faz o mesmo ao ABRIR a carreira — nos
três caminhos: carreira ativa, arquivo ("Minhas carreiras") e nuvem.

⚠️ **Só o RÓTULO** (`fame`, `folk`, `promessa`). **`lo` e `hi` NÃO são tocados**
— são a força do jogador, e mexer neles mudaria resultado de carreira em
andamento. Conferido nas duas promoções de 19/08: das 27 cartas, **26 só
trocaram de rótulo**; a única que também subiu de teto foi o **Dida** (79-86 →
85-92), que fica com o teto antigo pra quem já o tinha e sai certo em leilão novo.

🔒 O **lacre anti-trapaça** não é afetado: `lacreDe()` só soma caixa, títulos,
divisão e temporada — carta não entra na conta. Testado: caixa e temporada
intactos depois do sync.

Testado por SSR pelo caminho REAL de load (`readActiveCareer` com localStorage
de mentira). Sobem juntos: seu elenco, o **elenco dos bots**, o **cpuSquads dos
times de fundo**, o **deck do pregão em andamento**, o monte e os emprestados
pra SAF. Quem não foi promovido (Gabigol) não muda; carta que não existe no
baralho é deixada em paz. É por isso que a varredura é genérica no save inteiro
em vez de lista de campos: carta mora em lugar demais pra enumerar.

⚠️ **Sobra um caso que o código não alcança:** quem estiver com a ABA ABERTA
desde antes de 19/08 tem o baralho velho na memória do navegador — só recarregar
a página resolve. Não tem service worker no projeto, então basta o F5.

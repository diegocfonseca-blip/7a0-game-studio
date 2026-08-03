# 📌 Pendências combinadas com o Diego (atualizado 03/08/2026)

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
  ⚠️ FALTA: (a) TESTE de 2-3 pessoas (idealmente reproduzindo a carreira online entre
  temporadas) pra confirmar antes de sala cheia confiar; (b) a auto-cura `FIX_YOU_IDX`
  (store ~5150) ainda reancora por NOME — deixei como está (tem guarda cands≠1), mas é
  o próximo band-aid a trocar por id se ainda aparecer troca de assento; (c) confirmar
  a regra do expulsar (sai, CPU só p/ 2) na prática — o reducer já faz auctionRival=
  humansLeft<=1; o "virava CPU errado" era o id×índice, teoricamente resolvido agora.

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

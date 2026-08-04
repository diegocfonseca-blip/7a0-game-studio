# 📌 Pendências combinadas com o Diego (atualizado 04/08/2026)

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

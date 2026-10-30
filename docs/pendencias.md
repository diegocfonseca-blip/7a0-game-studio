## 📉 PLANO PRA ALIVIAR O BANCO (30/10, depois da queda) — esperando o Diego escolher
Medido nas últimas 24h (chamadas/dia): PATCH game_rooms 530k · GET game_rooms 500k · GET room_players 330k · /auth/v1/user 277k ·
room_acoes 136k · live_beats 134k · esc_retrospecto 132k · user_cards 119k · esc_avisos 113k · esc_copa_salas 106k. E o realtime
decodifica TODA gravação do game_rooms (game_state médio 53 KB, máx 167 KB) porque game_rooms/room_players estão na publicação.
**Grupo A — seguro (não encosta em sala, lance, coroa nem relógio):**
1. `MaintenanceBanner` (index.tsx:177) lê user_cards a cada 60 s por aba aberta só pra testar a rede → só quando houver pendência.
2. `getSession` (local) no lugar de `getUser` (vai ao servidor) num helper único; e os `onAuthStateChange` (manto, sport, online-preview,
   presidente-*, aviso-conta, presente, apoio, aviso-semana) só agem se a CONTA mudou — hoje rodam em todo volta-pro-app.
3. `useHasManual` (apoio.tsx:417) e `esc_meu_socio` (manto.ts) com cache por conta.
4. Retrospecto (screens.tsx:7312): ler por temporada, não por rodada (~38× menos).
5. esc_avisos 60→120 s; esc_avisos_semana throttle 10–30 min; vitrine 60 s→5 min; live_beats 60→120 s; medidor 30 min.
6. Lista de salas abertas: não ler com a aba escondida + 20 s.
7. Cache no banco (como o do ranking) em esc_vitrine_salas, esc_meu_nome_fake, esc_cla_painel.
**Grupo B — mexe no coração da sala (só com OK dele, risco explicado):**
8. Sala de espera: o batimento do dono (lobby.tsx:1420-1426) roda de novo a CADA eco do banco (deps `room` inteiro) — provável laço
   de várias gravações por segundo por dono esperando. Conserto: deps `room?.id`.
9. Dono gravando "tô vivo" a cada 3 s sem mudança → 12–15 s (a coroa lê `saveFresco < 9s` em store.tsx:14641 — mexer junto).
10. Dono conferindo a coroa a cada 5 s → 15–20 s. 11. Tela de votação do fim (screens.tsx:11289) 3 s → 10 s.
12. Copa online lendo a cada 2 s → 4–5 s. 13. room_acoes do dono 3 s → 5 s.
14. Tirar game_rooms da publicação do realtime (largada por broadcast) — o maior ganho, o maior risco.

## 🚑 Banco travou 29/10 ~23h58 (Brasília) — online parado ~10 min
- Causa: `esc_cla_ranking()` (caixa "Clãs da semana" na lista de salas) custava ~3 s por chamada e rodava a cada abertura da lista:
  2.498 chamadas = 7.584 s de banco. Com o pico da noite, o banco engasgou (timeouts, "connect timeout", 500 em ~60% das chamadas).
- ✅ Conserto no BANCO (03:06 UTC, sem deploy): cache de 2 min em `esc_cache_rpc` + trava pra não calcular em paralelo. Erros
  zeraram às 03:08. Arquivo: `supabase/migrations/20261030030500_cla_ranking_cache.sql`.
- Mesmo com o cache, o banco Small (2 GB, 90 conexões) seguiu sem fôlego (timeouts até em leitura simples). O Diego subiu o
  servidor de **Small pra Medium** às ~00h18 de Brasília: erro zero desde 03:19 UTC, ~4 mil chamadas/min normais, 24 salas andando.
- ⏳ Pra poder voltar ao Small um dia (é ele que paga): baixar o custo das contas pesadas abaixo + medir a carga num pico.
- ⏳ Outros pesados pra cuidar com calma (pedir OK): `esc_avisos` (40 mil chamadas, ~100 ms), `esc_vitrine_salas` (~300 ms),
  `esc_meu_nome_fake` (~320 ms), `esc_cla_painel` (~730 ms).

## ✕ Aviso fechado não volta (29/10) — regra nova no CLAUDE.md
- Auditoria: 6 avisos voltavam depois do ✕ (só `useState`/`sessionStorage`). Agora todos usam `avisos-fechados.ts`: celular sem espaço
  (`aviso-espaco`), "💾 guarde sua carreira · agora não" (`AvisoContaCarreira`), sugestão de troca da Agência "deixa assim", "abra no
  navegador" (Instagram/TikTok), "sua sessão caiu", e a janela dos planos que abria sozinha depois do salvamento (1 vez por aviso).
- Ficaram como estão (de propósito, são do momento): popup da carta de campeão, túnel da final, "VOCÊ VIROU O HOST", "MANDA SEU LANCE
  DE NOVO", "VOCÊ FOI EXPULSO", toasts de amigo.

## 🚫 Moderação 29/10: "Abusa Rindo" → "A Rindo" · "Exu Tranca Ru4" → "E Tranca Ru4"
- mateus.eduardo.ribeiro: `display_name` virou "A Rindo" (+ linhas abertas do room_players) e aviso de uma vez (`esc_avisos_conta`).
- daniagustosan23 (0af7af1e): jogou como "Exu Tranca Ru4" à tarde, mas o nome da conta JÁ estava "Danielvorcarofc" — não sobrescrevi;
  o aviso dele foi CANCELADO (Diego: "se ele já trocou, tudo bem"). Se voltar a jogar como "Exu Tranca…", manda o aviso (id 4 é o modelo).
- ⏳ Diego: *"se a pessoa aperta X no banner deve sumir pra sempre"* — o `AvisoConta` já marca visto no banco (os 2 avisos antigos ainda
  estão sem visto porque as contas nunca mais logaram). Perguntei QUAL banner volta depois do X pra achar o certo.

## 🎨 Tema da sala: automático + miniaturas + tema dos 3 Fundadores de 29/10 — ✅ publicado
- Diego: *"já deixe no automático… todos que já têm tema do fundador mascote, cria sala e já vem com tema"*. `createRoom` grava o 1º
  tema de CLUBE/MASCOTE da conta em `game_state.tema` (coração não entra sozinho). O dono troca/tira na sala de espera.
- A caixa do tema (já ficava logo embaixo do código) virou DOURADA com miniaturas (`MiniTemaSala`, temas-sala.tsx) e "✓ NA SALA".
- Tema de mascote do plano pro Lulubaba (`lulubaba`), Piranhão (`piranhao`) e Neymar_FC (`neymarfc`) — eu tinha esquecido na entrega.
  ⚠️ Roteiro de Fundador: o TEMA DE MASCOTE (`temaFundador` + `TEMAS_DA_CONTA` + `TEMAS_POR_CLUBE`) faz parte da entrega.

## 🪜 Bônus da casa: Série C e Série B +4 → +3 (29/10, *"série C coloque 3 e série B coloque 3 tb"*) — no branch, esperando "publica"
`CPU_DIV_BOOST_V7` = A 2 · B 3 · C 3 · D 2 · V 2, travado por `simV = 7` (só de temporada nova). Reverter = `s.simV = 7` → 6.

## 🪜 Bônus da casa da Série D: +3 → +2 (29/10, *"coloque a série D +2 então"*) — ✅ PUBLICADO
Análise pedida (*"acho que tá difícil subir da várzea pra D e da D pra C"*): no banco, 66% das carreiras param nas 4 primeiras
temporadas; com 10–19 temporadas só 29% ganharam a D e 5% a C. Causa (já anotada em 28/10): V e D só compram até "Bom" + o bônus dos
times da casa. Feito: `CPU_DIV_BOOST_V6` = A 2 · B 4 · C 4 · **D 2** · V 2, travado por `simV = 6` (só de temporada NOVA; a que está rolando
termina na tabela antiga). Reverter = trocar os `s.simV = 6` de volta pra 5. ⚠️ Tentei medir numa bancada rápida (buildPyramid + simulatePyramid
com elenco sintético) e ela deu 100% de acesso em tudo — o mundo montado sem as colocações reais não representa a carreira; NÃO usar
esses números. Medida de verdade = a simulação pela tela (sessão de 28/10).

## 🐐👑 Neymar_FC vira FUNDADOR nº97 + canto do São Paulo + gala própria (29/10) — ✅ publicado (frase "SAI DA FRENTE QUE O GOAT CHEGOU")
- Dono `sheeryarie772@gmail.com` (já tinha comprado o plano Fundador: `esc_compras_batismo` = 'plus'). Código no branch:
  `FUNDADOR_N` 97, saiu do `SEM_FUNDADOR`, canto = o MESMO do Wen Milan B (`torcida-spfc-wen-v1.mp3`), gala única `gala-neymarfc.tsx`
  ("O G.O.A.T.": as letras G·O·A·T carimbam, o 10 dourado, o Bode Rei no pedestal, BÉÉÉ!, a coroa na cabeça do bode, moedas).
- ⏳ **Banco, NA HORA DE PUBLICAR**: `esc_fundadores` (sheeryarie772, 97).
- Vídeo `scripts/posts/gala-neymarfc.mp4` · quadros `scripts/posts/gala-neymarfc-quadros.png`.

## 🐟🏛️ Batismo FUNDADOR Piranhão FC (29/10) — ✅ publicado (a salva de 21 tiros saiu da gala: o Diego não gostou)
- Dono `bruno.cunha2007@gmail.com` (conta de 29/10 02:02 UTC, "Piranhao FC", coração **Botafogo**; já comprou o plano Fundador —
  `esc_compras_batismo` = 'plus').
- Código (no branch): escudo (o 2º que o Diego mandou, com "LÁ EM CASA TODO MUNDO É 13"; 269×290, 29 KB — 290 e não 360 pra caber
  no teto), mascote **O Presidente** `piranhao_presidente` (407×440, 44 KB), manto **preto #100F0E + branco #E2E1E1**, Série D no
  assento do bot **Continental Real**, `FUNDADOR_N` **96**, canto = o MESMO do Lulubaba (`torcida-lulubaba-v1.mp3`), gala única
  `gala-piranhao.tsx` ("A Posse": Palácio, tapete vermelho, salva de 21 tiros, faixa presidencial, piranhas, frase "LÁ EM CASA
  TODO MUNDO É 13"). Combinado com o Diego: tema presidencial, sem desenhar rosto além da arte do dono.
- ⏳ **Banco, NA HORA DE PUBLICAR**: `user_colors` ouro+manual · `esc_socios` (próximo nº, manto, `piranhao_presidente`,
  `escudo_time` 'Piranhão FC', Botafogo, origem batismo, 2099) · `esc_fundadores` 96 · `esc_nomes_batismo` "Piranhão" (+ "Piranhao").
- Post: `scripts/posts/batismo-piranhao-fc.png` · vídeo `scripts/posts/gala-piranhao.mp4`.

## 🧤🖤 Lulubaba FC vira FUNDADOR + arte nova + canto + gala própria (29/10) — ✅ publicado (29/10)
- Pedido: *"atualize o time do lulubaba fc c/ canto de torcida, novo visual… quero ele fundador agora e c/ entrada personalizada
  lembrando q ele é goleiro do Botafogo"*.
- Código (no branch): escudo/mascote novos (328×360 26 KB · 440×342 42 KB), manto **preto #161516 + branco #E3E2E2** medido na
  camisa nova (`manto.ts` + `batismos.ts`), camisa da Loja `lulubaba-camisa-v2.webp`, `FUNDADOR_N` **95**, saiu do `SEM_FUNDADOR`,
  canto `sfx/torcida-lulubaba-v1.mp3` (9 s da torcida do Botafogo, −20,6 dB) na carreira e na gala, gala única `gala-lulubaba.tsx`
  ("O Paredão Alvinegro": estrela solitária, 3 chutes, o Goleiro pega no ângulo).
- ⏳ **Banco, NA HORA DE PUBLICAR**: `esc_fundadores` (lucasfonseca363, 95) · `esc_socios` manto → #161516/#E3E2E2 (o banco
  ganha do código!) · `esc_compras_batismo` plano 'lenda' → 'plus'.
- Post: `scripts/posts/batismo-lulubaba-fc-v2.png` · vídeo `scripts/posts/gala-lulubaba.mp4`.

## 📺🚫 Pódio da semana (técnicos e clãs) SAIU do telão (29/10) — no branch, esperando "publica"
Diego: *"tire o rank da semana e clã da semana do telão das salas… e tire a info lá do rank da semana e do clã… não prometam mais
isso"*. `PODIO_NO_TELAO = false` (patrocinio.ts); textos tirados da vitrine (ranking e clãs), do aviso de fim de semana
(`aviso-semana.tsx`), da descrição do escudo do clã (`cla.tsx`) e de 2 linhas das novidades.

## 📅 LEILÃO DE DÉCADAS (28/10) — MOCKUP enviado, esperando OK (`scripts/mockups/leilao-decadas.png`)
Ideia do Diego: igual ao 🧱 Clubes, mas o pacote é CLUBE + DÉCADA ("Atacantes do Flamengo · anos 80"); o mesmo clube pode sair em
décadas diferentes. 3ª opção do "Tipo de leilão" (🃏 Jogador · 🧱 Clubes · 📅 Décadas), baralho Todos, selo 📅 DÉCADAS na lista e na
espera. Conta medida nos 3 baralhos (pacote viável = vaga do 4-3-3 + 1): GOL 28 · LAT 22 · ZAG 30 · MEI 37 · ATA 43 → cabe sala de ~20.
⚠️ Anos 80 ≈ 1 pacote por setor (nenhum de MEI/ATA), anos 90 1–5; o grosso é 2000/2010/2020. Recomendado: lotes de cartas 80/90.
Código: chave `clubCanon(club)|década` em `buildDeckClubes` + `nomePacote` com a década.

## 🧤💛 Batismo Lulubaba FC (29/10) — ✅ código + banco feitos
- Dono `lucasfonseca363@gmail.com` (conta de 29/10 00:40 UTC, nome "Lulubaba FC", coração **Botafogo**). ⚠️ O Diego tinha mandado
  `lucasfgbarreto@gmail.com` (conta "Lucas_14", criada 2 min antes); ele confirmou: *"ele fez nesse e-mail aí q tá lulubaba"*.
- **Série D**, no assento do bot **Fênix Dourada** (`OLD_NAME`; o nome velho também desenha o escudo — só existia na pirâmide).
  Técnico "Lucas". Batismo de 79,90 → SEM número de fundador (`SEM_FUNDADOR`).
- Arte do dono (prancha com fundo verde; recorte com peso maior no azul pra não comer o verde da tinta atrás do goleiro; pontinhos
  soltos tirados): escudo 297×360/27 KB · mascote **O Goleiro** 440×351/42 KB · camisa da Loja 536×620/35 KB.
  Manto medido: amarelo #D9D811 + preto #090906.
- Banco: user_colors ouro+manual · esc_socios **80** (manto, `lulubaba_goleiro`, Botafogo) · esc_nomes_batismo "Lulubaba" ·
  esc_compras_batismo 'lenda'. Gala: a PADRÃO de batismo (liga sozinha pelo e-mail).
- Post: `scripts/posts/batismo-lulubaba-fc.png`.

## 🟢 Envelope único LIBERADO PRA TODOS (28/10) + selos
Selo NOVO na criação (sala e partida rápida); Relâmpago trocou "em testes" por NOVO; selo ⚡ ENVELOPE ÚNICO na lista de salas, no filtro
"⚡ Único" e na sala de espera (o banco grava `ls_pregao = 'unico'`, migration `20261028200000_ls_envunico.sql`). Duplas: ainda NÃO.

## ⚡🔁 Envelope único: 2ª LISTA antes do Monte (28/10) — ✅ PUBLICADO
Diego testou: *"tá ficando muita carta no monte… depois da primeira leva volta pras sobras… uma segunda lista… só depois disso que vai
ter monte"*. Agora: 1ª lista (as 5 posições, 180s) → revelação → **2ª lista** com o que sobrou, só nas posições em que ainda tem GENTE
com vaga e dinheiro (90s, `ENVELOPE_UNICO_2_MS`; bot entra no modo repescagem) → revelação → Monte. Sobra de posição que ninguém
precisa vai direto pro Monte. Estado: `euRodada` (1|2) e `euSobras`. Trava `npm run envelope-unico` confere as duas listas.

## 🐶💚 Batismo FUNDADOR dSouza FC (28/10) — ✅ PUBLICADO (*"pode aprovar tudo"*)
- Dono `alexandre12cdm@gmail.com` (conta de 27/10 ✔; o time dele "Pits FC" virou **dSouza FC** no `display_name`; sem carreira
  na nuvem). **Série C**, no assento do bot **Kombi United** (`OLD_NAME`; o Kombi segue no jogo rápido, nome velho NÃO desenha o
  escudo). Técnico "Alexandre". Coração **Palmeiras**. Empresa: **dSouza Empreendimentos** (quadros de futebol, anúncio fixo nº8).
- Arte (prancha com fundo verde chroma, recorte por distância de cor; neon do desenho intacto): escudo 360×334/26 KB · mascote
  **O Pitbull** 398×440/32 KB · camisa da Loja 585×620/33 KB. Manto medido: preto #0A0A09 + verde-neon #73E541.
- Banco: user_colors ouro+manual · esc_socios **79** · esc_fundadores **94** · esc_nomes_batismo "dSouza" · esc_compras_batismo 'plus'.
- Gala única **"A Galeria"** (`gala-dsouza.tsx`): parede com 6 quadros de futebol (bola · embaixadinha · foto do time · taça · gol ·
  chuteira, pedido do Diego) com flash, a caixa "dSouza · frete grátis" cai e abre, o Pitbull sobe, escudo com anel neon, QUADRO NA
  PAREDE · LENDA NO ELENCO · TAÇA NA ESTANTE e a faixa "O DONO DA GALERIA". Vídeo `scripts/posts/gala-dsouza.webm`.
- Temas da sala: `dsouza` (clube, com o Pitbull) e `dsouza_emp` (🖼️ dSouza Empreendimentos — galeria + recado da loja na faixa).
- Post: `scripts/posts/batismo-dsouza-fc.png`. ⏳ **Canto da torcida: o Diego manda depois** (a gala entra sem som até lá).

## 🏟️ Queda repetida na saída do Neymarzetti (28/10) — correção de apresentação

Reproduzida a carreira atual em cópia local da tela real (`PyramidSeasonScreen` → Clube → mapa/replay), com todo tráfego externo bloqueado. Leitura autorizada do save em `esc_pyramid_saves`, projeto `faabglpjutwursgmrpny`: o nome administrativo “Copa Mania” também contém as tabelas do Leilão. Nenhum write de save/banco. Temporada 8, rodada 1, Neymarzetti × Leão da Estradinha.

- Falta oficial de Alex Alves em Cuadrado aos 5,30 s: o blend antigo colocava o caído em pé antes de começar `levanta`, derrubando o corpo de novo. `cai_parado` e `cai_carrinho` já contêm recuperação e também recebiam um `levanta` redundante. Removida essa cadeia automática.
- `map-foul-reaction.mjs`: sequências completas dos mesmos clipes, verificadas por equipe e distância, com recuperação antes da próxima preparação de passe. Corpo fica no ponto da falta enquanto está no chão. Apito por vantagem revogada não representa um novo impacto. Se o intervalo oficial não comporta queda/recuperação, o jogador permanece em pé; a falta e a cobrança continuam oficiais.
- Carrinhos e dribles identificam também o lado, evitando animar a lenda homônima do adversário. HUD do replay recebe seu próprio quadro; antes podia mostrar placar final/FIM por cima de uma reprodução ainda no início. Mapa ampliado fica acima do cabeçalho/abas fixas da carreira, que cobriam o campo; mesma cena/canvas, sem reinício.
- Validação: `testa-quedas-mapa.mjs`, testes de relógio/contato/transições/fundamentos, build completo e `npm run recarga`. `testa-saida-partida-browser.cjs` percorreu 3.001 quadros do save, com 22 atletas, placar 0×1 e um gol de Alex Alves, assistência de Paulo Wanchope. Passes iniciais e cobrança aos 7,40 s com contato confirmado. Queda inicial passou de duas descidas do corpo para uma; raiz apoiada sem deslocamento no intervalo medido no chão.
- Bancada da carreira: `abre-saida-carreira.cjs` + `saida-carreira.html`; captura com relógio de navegador controlado em `grava-saida-ui-clock.cjs`. Exige cópia privada do save em `test-results/saida-bola/private/`; fixtures, credenciais e vídeos NÃO entram no bundle nem no commit. Evidências locais em `test-results/saida-bola/`.
- **Limites registrados:** três contatos da partida completa ainda não confirmados: recolha às 25,70 s (1,73 m), reposição às 26,10 s (23 cm) e recepção aérea às 85,05 s (1,36 m; diagnóstico ainda classifica peito como pé). Não declarar o futebol inteiro aprovado. A captura por renderizador de software não é medição de FPS de celular. Motor, eventos, overalls, acesso exclusivo aos campos e carreira preservados.

## 🅾️🎨 Master sem Uomo e sem Rei das Tintas (28/10) — no branch, esperando "publica"
Diego: *"remova a Uomo dos patrocinadores master e coloque a Uomo no lugar de alguma marca de fornecedor de material… remova Rei das
Tintas também"*. Mesa do Master agora: OittoLabs 1 · Grêmio Campo Grande 3 · dSouza 3 · Tidex 5 · Vadico 5. Contrato delas que já corre
em save antigo vai até o fim. A Uomo Concetto virou fornecedor de material no lugar da GuchiGuchi (Série A, 1 temporada, mesmo id
`guchiguchi` pra contrato correndo não quebrar). Travas `npm run master`/`master-historia` atualizadas (5 contratos).

## 🐶 Patrocinador Master dSouza Empreendimentos (28/10) — ✅ NO AR (linha do telão id 8 em `esc_anuncios_fixos`)
Loja de quadros decorativos (futebol nacional/internacional, personalizados) no Mercado Livre:
https://www.mercadolivre.com.br/pagina/dsouzaempreendimentos/futebol . Arte em `scripts/parceiros/dsouza-*.jpg`.
- Master da carreira: **7ª marca, 3 temporadas** (= Grêmio Campo Grande; escolha do Diego), `dsouza` em `estadiodata.ts`; logo `patro-dsouza.webp`.
- Placa do campinho: pitbull + nome (`patro-dsouza-placa.webp`, tirei a frase da arte deles, que vinha com acento errado "Confiànça/Rapìdo").
- "Apresentada por": **Libertadores** (online e carreira) — a única grande sem patrocinador; o Diego não teve preferência.
- Telão: `🐶 dSouza · Quadros do seu time pra decorar a parede · Frete grátis · Clique aqui` → página do Mercado Livre.
  ⚠️ NA HORA DE PUBLICAR: inserir a linha em `esc_anuncios_fixos` (o banco manda; o código é só reserva).
- Aviãozinho da home: agora é a dSouza (regra: patrocinador novo = avião). Saiu o Grêmio Campo Grande do avião (segue no resto).
- Aviso da comunidade: `scripts/avisos/2026-10-28-parceiro-dsouza.json` → `scripts/posts/aviso-2026-10-28-parceiro-dsouza.png`.
  Foto dos lugares: `scripts/posts/dsouza-no-leilao-legends.png`.

## 🤖 Simulação REAL da carreira pela tela (28/10) — 19 temporadas, achados (nada mexido no jogo)
Pedido: *"simulação completa até a T120 começando na várzea… descobrir pq MT gente fala q é difícil na várzea… premiação… erros… ideias"*.
Robô (Playwright) jogando pela TELA de verdade: leilão às cegas escolhendo pelos mais famosos, Master, coletivas, pular jogo (como Craque),
leilão de transferências. Roteiro e dados ficaram no scratchpad da sessão (não no repo). ~5–10 min por temporada pela tela.
- **Várzea é sorteio**: XI do robô nível médio 79 × rivais de gente 76–80 → 4º num ano, 20º no outro com o mesmo time. Saiu da V na T2,
  ioiô V↔D↔C até a T19 (chegou na C na T9 e caiu na hora).
- **Elenco cheio (27) trava o reforço**: da T7 em diante o leilão não ofereceu vaga nenhuma e o robô ficou 12 temporadas sem comprar, com
  ~390 🪙 parados. A saída é VENDER — não é óbvio. **Ideia pro Diego**: no leilão, com elenco cheio, avisar "venda alguém pra abrir vaga" com o botão ali.
- **Dinheiro na V**: ~45/temp (bilheteria 20 · TV 10 · Master 10 · prêmio 2–5) − folha 28 (elenco cheio) ≈ +17/temp.
- **Conferidos e pagando certo**: colocação (só top 4 + campeão), queda C −10, TV 10/20/30 (V/D/C), Master (renova +25%, multa+rescisão na
  queda), Bico de Folga, coletiva +2, renovação automática. **Não deu pra conferir** (time não passou da C): Copa, Liberta/Champions, Mundial, Copa do Mundo.
- **Estranhos**: bilheteria fixa em 20 em V, D e C (sem obra não cresce ao subir — conferir se é de propósito); linha "🤝 Patrocínio 0" em todo
  extrato (resíduo do pontual); botão CONTINUAR do caixa pode ficar atrás da barra de abas (rolar resolve).
- **Sorte medida no motor real** (`simulatePyramid`, 60 temporadas por linha, rivais ~78): nível 78 sobe 18% · 80 → 37% · 82 → 55% ·
  **84 → 87%** · 86 → 92%. A sorte é justa (4 pontos acima = sobe quase sempre). **A injustiça está no leilão**: (1) o bot avalia a carta
  pelo NÍVEL escondido (`perceived`, erro de só ±3 em fama 3+) e o humano só vê nome/clube/ano; (2) bot com elenco cheio ainda dá 1 lance
  de reforço por setor (`reforco` em `cpuEnvelope`) e o humano com 27 não tem lance nenhum até vender na mão.
- **CAUSA PRINCIPAL achada (escada de categorias, `escadaAllows`)**: V só negocia foi-prof + bom (fama ≤3) e D só bom + promessa. O teto
  é "Bom" (76–85) nas DUAS — depois do 1º leilão não existe carta melhor pra comprar, os 20 times ficam iguais (76–80) e a tabela vira
  loteria. Só na C entra o Craque. Explica o ioiô V↔D de 17 temporadas do robô. Também: o aviso "VIROU PROFISSIONAL! Saiu da Várzea!"
  aparece na tela de vender mesmo depois de cair de volta pra V (aviso da subida da T2 preso).
- **BÔNUS DOS TIMES DA CASA (`CPU_DIV_BOOST_FAIR`, carreira nova simV 4)**: V +4 · D +3 · C +5 · B +4 · A +2 pros CPU nativos; humano e
  rivais não ganham. Somado ao teto da escada (V = time todo "Bom" ≈ 80), o melhor time possível da Várzea fica no máximo igual ao CPU
  da casa (77+4). Medido no motor real (60 temp): humano 80 sobe 48% SEM o bônus × **12% COM** (35% de cair pro 15º–20º); 84 com bônus
  sobe 65%. O bônus é de 04/08 (*"tá fácil"*), de antes da escada existir. Técnico pesa 1/12 (`(atk*11+nível)/12`) — quase nada.
- ✅ **PUBLICADO (28/10, *"Sim"*) — consertos do extrato e do aviso, pedidos do Diego depois da simulação**: (1) o aviso "Virou profissional!
  Saiu da Várzea!" só aparece com o time FORA da Várzea (quem caiu de volta não lê mais isso; o aviso espera a próxima subida);
  (2) a linha "🤝 Patrocínio" (sobra do pontual, sempre 0) e as linhas de "Agência"/"Empresário" só entram no extrato com dinheiro de
  verdade — o patrocinador de verdade já entra com o nome da marca ("🏆 Master · Vadico", "👟 Material", "🎯 Meta batida").
  🚫 Bilheteria do estádio: NÃO mexer (*"da bilheteria não mexe não"*).
- ✅ **PUBLICADO PRA TODOS (28/10, *"publique sim. P todos"*) — bônus da casa novo (simV 5)**, ordem do Diego: *"na várzea bote pra 2. Série D mantém 3, série C coloque 4 e
  série A coloque 3"* (B fica 4). `CPU_DIV_BOOST_V5` = A 2 (*"série a deixe 2 msm"*) · B 4 · C 4 · D 3 · V 2. Só vale de temporada NOVA (trava simV, inclusive no
  "mesmo time" — `CONFIRM_MESMO_TIME` agora também carimba): temporada em andamento termina na tabela antiga. Medido no motor: time no teto
  da Várzea (80) sobe 8% → **28%**; 82 → 35%; 84 → 80%. Reverter = trocar os `s.simV = 5` de volta pra 4.
- Pendente: ensinar o robô a VENDER e rodar até a T120 (≈12 h+) pra conferir os prêmios das copas — esperando o Diego dizer se quer.

## ⚽ Campo 3D do mapa — revisão 4, goleiro e bola solta (28/10, LOCAL, sem publicação)
- Pedido: goleiro de costas no chute/recolhimento; continuar refinando os fundamentos com bola.
- Causa: antecipação usava a velocidade do rebote futuro, virava para a baliza e suprimia a reação.
  Sequência oficial é **trave → recolhimento → lançamento**, não defesa; significado preservado.
- Orientação corrigida, reação importada antes da coleta, IK residual das mãos, apoio dos pés
  conferido na malha deformada e seek sem mergulho durante posse nas mãos.
- Domínio que escapa: corpo acompanha a bola solta; a trajetória, a perda de posse e o receptor
  seguem iguais. Condução exige proximidade/altura; orientação usa a bola realmente apresentada.
- Saída da disputa reserva espaço para os braços. Verificação das malhas deformadas removeu
  duas interseções; não é apenas uma checagem da distância entre os centros dos atletas.
- Limites: esta entrada não cobre todas as defesas; mãos ainda têm pequeno resíduo de interseção,
  impactos a 30 Hz usam estimativas, sprint e mudanças rápidas continuam em refinamento.
- Sem publicar, acessar banco ou avançar rodada. Replay histórico 1–1 versus 3–0 continua bloqueado.
  Evidências, testes e recuperação: `docs/refino-mapa-3d-20261028-v4.md`.

## ⚽ Campo 3D do mapa — revisão 3 dos fundamentos (28/10, LOCAL, sem publicação)
- Pedido: continuar corrigindo erros vistos no vídeo. Modelo atual, rig e uniforme preservados.
- Corrigidos: passada medida nas capturas (2,069 m no trote), fases de apoio entre direções,
  IK residual do pé de apoio, aproximação/domínio/recuperação sem troca instantânea de velocidade,
  escolha do lado livre nas disputas, saída do passe, transição captura/reposição do goleiro,
  giro da bola após sair das mãos e sombras das solas no novo modelo.
- Verificação: partida inteira a 60 e 30 Hz, 22 atletas, mesmos 67 eventos e placar; 64 contatos
  programados preservados a 60 Hz; corrida com 67–70% menos deslizamento mediano no teste.
  Cidade real em celular/desktop e três câmeras; pausa e diagnóstico não alteram poses/eventos.
- Ainda aberto: sprint, picos de velocidade em colisões, outros voos/recuperações do goleiro,
  marcha após o apito e desempenho em celular físico. Interpolação dos impactos a 30 Hz ainda
  tem 12 estimativas fora da tolerância. Não declarar futebol inteiro aprovado.
- Save histórico: trava mantém bloqueado 1–1 versus 3–0 produzido pela entrada no motor atual.
  Sem banco, avanço de rodada ou publicação. Detalhes, artefatos e reprodução em
  `docs/refino-mapa-3d-20261028-v3.md`. Recuperação: `recovery/fundamentos-mapa-v2-50010191`.

## ⚡ Mata-mata Relâmpago (28/10) — ✅ PUBLICADO PRA TODOS com selo verde "EM TESTES" (*"qd publicar pode por o todos e apenas escrever em testes"*)
- Regras dele: *"faz c 16 então msm e 32 a pessoa escolhe ao criar e pênalti padrão igual as outras normais"* e *"tem q ter ida
  e volta, somente final que não"*. Então: quem cria escolhe CHAVE DE 16 (começa nas oitavas) ou 32 (Rodada de 32); a sala cabe
  esse tanto de gente e os bots completam; leilão de sempre → sorteio → IDA E VOLTA em toda fase, FINAL EM JOGO ÚNICO; empate no
  agregado = pênaltis AUTOMÁTICOS de sempre (o pênalti manual só existe na carreira offline — eu tinha escrito errado no mockup).
- Código: `copaMode: 'relampago'` + `relampagoChave` (marca de modo) · `abreRelampagoSePrecisa`/`seedRelampago`/`posicaoNaChave`
  (store) · fase nova `'r32'` · telas da Copa, fim sem liga (bloco da Só Champions), ranking/estante sem "campeão de liga" falso ·
  O MARTELO edição Relâmpago (`montaEdicaoRelampago`) · criar sala: opção na prateleira "Com o seu time" (só sala rápida, sem
  duplas) + "Tamanho da chave" · rótulos na lista de salas e na sala de espera.
- Trava: `npm run relampago` (chave 16 e 32, de 2 a 20 pessoas, ida e volta, pênaltis no empate, campeão, sem jogador fake,
  "mesmo time" sorteia de novo, Liga + Copa intacta). Fotos reais: `scripts/mockups/relampago-real-*.png`.
- ⚠️ A tela de CRIAR sala não deu pra fotografar (a bancada não loga) — conferir na conta dele. Liberar geral = `RELAMPAGO_GERAL = true`.
- 🎨 28/10 (*"o desenho do mata-mata relâmpago deve ser algo com raio… túnel da final, festa do título, tudo padrão igual aos
  outros campeonatos… terá suspense do sorteio"*): `relampago` virou competição no `competicoes-visual.tsx` (paleta roxo-elétrica,
  taça com RAIO, raios no fundo, frase "o raio não cai duas vezes", festa "caiu como um raio") → tema da tela, túnel da final, festa
  do título e taça do fim. `SorteioRelampago` (online-match-visual): na 1ª abertura os confrontos saem um por um com ⚡, no MESMO
  relógio de 10s da abertura (nada de espera a mais). Fotos: `scripts/mockups/relampago-sorteio.png`, `-tunel.png`, `-festa.png`.
- 📲 Stories do lançamento: `node scripts/stories-relampago.mjs` → `scripts/posts/stories-relampago.png`.
- Ainda não: Relâmpago no Minhas Ligas e com Duplas (não pedido).
- Veio da lista de ideias novas pras salas (Clã × Clã, Liga dos Bagres, Copa das Décadas, Leilão de Seleções, Relâmpago, Leilão
  das Pistas, Rei da Noite). Ele escolheu ver o Relâmpago.
- Proposta: nova opção no bloco "O campeonato" ao lado de Só a liga / Liga + Copa / Só Champions. Leilão DE SEMPRE → sorteio da
  chave → mata-mata em jogo único, empate = pênalti manual, sem liga. Até 8 pessoas chave de 8 (quartas); 9–16 chave de 16
  (oitavas); vaga que sobra vira bot. Quem cai fica assistindo. Usa o motor de mata-mata que já existe (quickCopa) e as mesmas
  telas da Copa — nada de tela nova (regra da Kings: modo novo nunca ganha placar/tabela própria).
- Mockup: `scripts/mockup-mata-relampago.mjs` → `scripts/mockups/mata-relampago.png`.

## 🧭 Abas da carreira + logo + faixa da comunidade (27/10) — ✅ PUBLICADO (*"pode publicar"*)
- Logo oficial LL (`img/logo-ll.webp`, 96px, 1 KB — enviada pelo Diego) ao lado do nome no PC.
- Veio da análise do Brasileirinho: *"abas em cima e melhoradas pois acho tão apagadas, e também do móvel as abas de baixo
  melhoradas… além da logo Leilão Legends no PC lá no header e também o aviso da comunidade do zap"*.
- PC: abas EM CIMA, num cartão com o nome do clube (T · série · posição · rodada); aba aberta = botão preto com ícone dourado e
  sombra vermelha; as outras brancas com borda preta. Logo "Leilão LEGENDS" no topo. A barra de baixo some no PC.
- Celular: barra de baixo com ícone/nome em PRETO (hoje cinza 45%), letra 11,5px (hoje 9,5), aba aberta = botão preto/dourado,
  borda preta grossa no topo da barra.
- Faixa da comunidade: "Já somos 16.703 técnicos… Entre na comunidade" (botão verde). ⚠️ Em 23/10 ele pediu a faixa CLEAN
  (*"sem esse exagero todo do whatsapp"*) — a nova tem botão verde de novo; confirmar.
- Faixa do topo: sem número de técnicos. Opção B do mockup `faixa-zap-insta.png` (*"bote os dois"*): "Entre na comunidade do Zap
  💬 Entrar | Siga no Instagram 📸 Seguir" (@leilaolegendscom); no celular "Comunidade · Entrar | Instagram · Seguir".
  `ComunidadeBanner` (index.tsx), vale pro site todo. Fotos: `scripts/mockups/faixa-zap-insta-real-*.png`.
- 💾 *"Pra salvar sua carreira crie uma conta, coloque na parte de baixo"*: `AvisoContaCarreira` saiu do topo e mora no FIM da
  página, logo acima do "Sair e salvar carreira" (no PC: última linha da grade, de ponta a ponta). Fotos `scripts/mockups/conta-embaixo-*.png`.
- Logo do PC numa plaquinha creme com borda: na aba Jogos (foto escura do estádio) o "LEILÃO" preto sumia.
- ⚠️ Visto na foto (já era assim, não mexi): no celular de 375px o título "CENTRAL LEGENDS" encosta no "ROD. 0/38".
- Código: `BarraCarreira` (pyramidseason.tsx) com classes + `career-abas.css`; no PC (carreira nova ≥1024px) a logo e o cartão do
  clube (escudo · nome · T · série · lugar · rodada) aparecem; de 1024 a 1259px as abas descem pra linha de baixo do cartão.
- Fotos reais: `scripts/mockups/abas-carreira-real-pc.png` e `abas-carreira-real-celular.png`.
- Mockups: `scripts/mockup-abas-carreira.mjs` → `scripts/mockups/abas-carreira-pc.png` e `abas-carreira-celular.png`.
- 🔁 v2 (27/10, *"não gostei de você fazer várias coisas num lugar só… é uma coisa só em cada lugar"*): **cada aba mostra só o
  que é dela** (nada de 3 colunas misturando clube/tabela na Central) e **Jogos + Tabela é UMA aba** → 5 abas: Central · Jogos +
  Tabela · Elenco · Rank · Clube.

## 🔒 Nome reservado pra quem tem plano (27/10) — ✅ FEITO (mockup aprovado: *"aprovado"*)
- Pedido: *"quem tem plano reserva o nome p sempre… quem não tem alguém pode fazer igual… o grátis irá aparecer joaquim fc fake"*.
  E entra como benefício em TODO plano, do ⭐ Craque Salas pra cima.
- Hoje (`esc_nome_livre`): o nome já é único pra TODO MUNDO (grátis inclusive) + batismo reservado pro dono. Muda: grátis deixa de travar.
- Medido: 201 contas pagantes (user_colors), 197 com nome; 37 contas grátis já usam o nome de um pagante (ex.: Neymar FC, São Paulo FC).
- Mockup: `scripts/mockup-nome-reservado.mjs` → `scripts/mockups/nome-reservado.png` (selo 🔒 no dono, 🎭 FAKE na cópia grátis,
  linha "🔒 Seu nome reservado no jogo" nos planos, avisos na hora de escolher o nome).
- Mensal cancelado = perde a reserva (Diego: *"se cancelar… não continua reservado"*) — é a régua `pago` do `esc_direitos_de`.
- Banco (`20261027230000_nome_reservado_plano.sql`): `esc_nome_livre` só barra nome de OUTRA conta com plano (e só pra quem também
  tem plano; grátis recebe `fake: true`); `esc_meu_nome_fake()` diz se o nome da MINHA conta é cópia. Testado numa transação desfeita:
  grátis→nome de pagante = livre+fake · pagante→nome de pagante = em_uso · dono re-salva = livre · grátis→nome de grátis = livre.
- Jogo: `MARCA_FAKE`/`carregaNomeFake`/`separaFake`/`SeloFake`/`NomeComFake` em `apoio.tsx`; o selo vai grudado no nome pelo
  `apoioSelo()` (o mesmo da medalha) e vira etiqueta vermelha na lista da sala de espera e no chat. Nos outros lugares aparece como
  texto ("🎭FAKE"). A identidade na sala é pela conta, nunca pelo nome — o selo não mexe em assento.
- Planos: linha "🔒 Seu nome reservado no jogo" (NOVO) no Craque Salas e no Lenda; o Completo cita no "Tudo do Craque Salas"; o Batismo já tinha.
- ⚠️ Quem vira fake só vê o selo depois de entrar de novo (a leitura é no login / troca de nome).

## 🦁 Batismo Vila Esporte Clube (27/10) — ✅ PUBLICADO (código + banco)
- Dono: oluisantonio.contato@gmail.com (pagou Craque → Lenda → Batismo 79,90 no Pix). Plano Batismo = tier ouro, SEM número de fundador.
- Série D, no assento do bot Imperador SAF (`OLD_NAME`). Coração: Atlético Mineiro. Gala = a PADRÃO (vem sozinha pela `esc_socios`).
- Arte: `vila-escudo.webp` 360×359 28,9 KB · `vila-mascote.webp` 401×440 42,9 KB (O Leão, `vila_leao`) · camisa `vila-camisa-v1.webp`.
  Manto medido na camisa: preto `#0C0C0C` / branco `#DADADA`.
- Banco: `esc_socios` nº 78 (até 2099) · `esc_nomes_batismo` 'vila esporte clube' (+FC/EC pelo gatilho) · `user_colors` já era ouro+manual.
- Post: `scripts/posts/batismo-vila-esporte-clube.png`. Dono: Luis.
- Publicado sozinho na main (cherry-pick); a trava da carreira grátis T50 foi publicada depois, no "publique td".

## ⚽🧍 Boneco novo do 3D jogando futebol (27/10) — só na conta do Diego, no branch
- Queixa dele: *"a bola rola estranho, jogador domina estranho, cai do nada, passe e chute estranhos"*.
- `players-novo.mjs`: um motor de PREVISÃO roda 1 s na frente e agenda chute/passe/cabeçada pra o pé (ou a cabeça) bater na bola
  no instante exato do lance (medido: cruzamento 12,98 × pé 12,97; cabeçada 13,19 × cabeça 13,16). Recebe com domínio/peito
  (não no toque de primeira), bola GRUDADA no pé de quem conduz, e só cai em FALTA (na "vantagem" o jogador segue correndo).
- 2ª rodada (27/10, *"chuta pra frente e a bola vai pro lado"*): a previsão rodava no relógio errado (o motor anda em MINUTOS,
  93 em 90 s) e não enxergava nada adiantado — o chute começava DEPOIS de a bola sair. Agora o corpo MIRA pra onde a bola vai
  (medido o pé de cada movimento do Mixamo: o chute correndo varre ~20° pra esquerda), escorrega até o pé ficar no ponto da batida
  e quem conduz continua com a bola no pé. Medido na bancada: perna × bola com ±5°.
- Bola: o Diego decidiu NÃO aumentar (27/10).
- 3ª rodada (27/10, *"dá impressão que ele faz o mesmo lance pra chutar e passar"*): passe/enfiada = toque de lado do pé
  (`passe`) · cruzamento/lançamento/inversão/bola de 26 m+ = batida por baixo (`cavadinha`) · chute = a bomba. Só existe UM
  movimento de passe no Mixamo baixado; mais variedade (passe correndo, de chapa, de trivela) precisa de arquivo novo do Mixamo.
- 4ª rodada (27/10): o Diego já mandou TUDO que o Mixamo tem de futebol (63; o "Soccer Pass" que ele mandou depois é o mesmo
  passe). Variedade tirada do que existe: **pé esquerdo** (espelho feito no carregamento, `espelhar` em jogador-novo.mjs: canhoto
  famoso de canhota, destro famoso de direita, o resto pelo lado da bola, 1 em 4 de canhota) · **passe curto** (Low Kick, bola de
  menos de 13 m) · **queda de carrinho** (correndo/parado) · **goleiro**: bloqueio com o corpo e lançamento longo com a mão.
- 5ª rodada (27/10, *"o domínio não parece real… o passe parece colado… não parece que foi com o pé"* → *"quero perfeição"*):
  a bola do DESENHO virou uma peça própria (`bolaDoDesenho` em players-novo.mjs). Livre = a bola do motor, que se desvia aos
  poucos até cair no pé/peito/cabeça de quem vai tocar, no instante do toque (o corpo também anda metade do caminho até ela, com
  a passada acompanhando; bola parada = o corpo anda tudo). Posse = a bola rola sozinha com atrito e só anda quando a ponta do pé
  do boneco encosta nela; no passe/chute ela espera no pé que bate e sai DELE. Medido na bancada (40 s): bola × osso no contato
  2–22 cm (antes 0,6–1,7 m). O giro da bola segue a bola desenhada. Previsão agora olha 1,8 s adiante.
- 6ª rodada (27/10, *"a bola parece puxada por uma linha… muda de direção sozinha… passe de cabeça no meio-campo"*):
  condução por FASE da passada (2 toques do pé direito por ciclo, 37% e 86%; cada toque manda a bola rolar até o pé do próximo
  toque — sem coleira) e quem conduz no desenho faz o movimento de conduzir · voo em LINHA do pé que bateu ao pé que recebe
  (andamento e altura da bola do motor) · cabeçada só na área ou em finalização (`deCabeca`; no meio-campo a bola desce pro pé)
  · o corpo anda 70% do caminho até a bola. Saltos de bola na bancada: 64 → 16 em 40 s (os que sobram: gol/reinício).
- 7ª rodada (27/10, *"a bola é ruim quando vai de encontro até outro jogador"*): no passe a bola desenhada saía devagar e
  ACELERAVA no caminho (7→17 m/s) e parava 1 quadro no pé. Agora o voo tem física de bola: sai forte e freia na grama (2,3 m/s², o
  atrito do motor), do instante do contato até um PONTO DE ENCONTRO fixo (70% onde a bola do motor vai estar, 30% onde o pé do
  jogador vai estar); o corpo de quem recebe anda até esse ponto sem atraso. Medido: passe 13→8 m/s freando liso; contato 2–20 cm.
- 🏙️ CIDADE E ENTORNO MAIS CHEIOS, LIGADOS À TORCIDA (28/10, *"a cidade está muito vazia… tem que ter ligação com o número de
  torcedores… muito pouco NPC rondando, muito pouco carro"*): moradores da cidade = 10 + cresce com a torcida (dobrou a torcida
  → +6) + 2 por obra, teto 48 no PC / 20 no celular (`population.mjs`; antes 2–24/10) e espalhados em até 32 calçadas. Entorno do
  estádio: o orçamento de sempre (transporte, visitas, contas) NÃO mudou; por cima dele, `rua` (fluxo.ts) soma torcedores a pé
  (até 10 da casa / 5 de fora) e carros na rua (até 10, vários por pista, espaçados) pela torcida. Dia de jogo com relógio da
  jornada continua 1 torcedor por lado. Bonecos da cidade continuam os pequenos de sempre (pedido dele). Medido na bancada:
  carros 2 → 9, torcedores a pé 0 → 9. Testes do complexo: fluxo/circulação/torcidas/transporte/lifecycle/luzes passam
  (transporte-assento e jornada-movimento já falhavam antes, sem relação).
- ⚽ MOVIMENTOS DE JOGADOR DE VERDADE (27/10): o Diego baixou o pacote de futebol do Anderson Rohr (21 arquivos, esqueleto do
  Unreal) e subiu no Drive. Ficam fora do git em `tmp-rohr/ue5/` (baixar de novo pelo Drive: títulos `NN_Nome_ue5.fbx`). O
  `monta-jogador.mjs` converte o esqueleto do Unreal (Z pra cima, cm, nomes `pelvis/thigh_l/...`) pro do Mixamo (`UE5` no script,
  prefixo `rohr:` nos CLIPS). No jogo: **passe de chapa** (passe/enfiada) e **chute forte** (chute) são os gravados, com espelho
  pra canhota; **drible3** nas fintas; **3 comemorações** no gol (sorteadas pelo autor). Trechos usados em `TRECHOS`
  (players-novo.mjs). Medido: passe de chapa bola × pé 3–6 cm. Ficaram de fora (pesam no arquivo e ainda não têm lugar): dribles
  1/2, pênaltis, desarmes, lateral (o lateral converteu estranho) e defesas de goleiro. GLB 2,67 → 2,97 MB.
- 🎞️ Movimentos grátis achados (27/10, a conferir com o Diego): pacote de futebol do Anderson Rohr (Gumroad, "pague o quanto
  quiser", FBX 60 fps, esqueleto Rokoko/UE5/iClone — precisa de mapa de ossos no `monta-jogador.mjs`, uso comercial liberado
  segundo a série) · pacote pago barato de 28 animações na CGTrader (US$ 7) · Quaternius (CC0, sem futebol específico).

## 🧩 Criar sala em blocos (26/10) — ✅ PUBLICADO PRA TODOS (*"agora pode publicar pra todos isso já"*)
- Mockup aprovado: `scripts/mockup-criar-sala-organizada.mjs` → `scripts/mockups/criar-sala-organizada.png` (v5).
- Tela (lobby.tsx, criar2): 1 O jogo · 2 O leilão (jeito do lance + jogador/clubes) · 3 O time (solo/duplas, baralho, formação) ·
  [Rivais, só carreira] · 4 O campeonato (depois da liga) · 5 A partida (ritmo + placar/2D) · 6 A sala (nome, senha, chat, stream).
  Números saem na ordem (`proxSec`).
- ⭐ = precisa de plano pra CRIAR: Minhas ligas, Liga Draft, Carreira, Manual e Campo 2D. **Criar sala no Manual e com o 2D agora é
  do plano** (`useHasManual`, a régua do Modo Manual) — jogar na sala dos outros continua grátis. ⚠️ aviso "só com quem conhece" no Manual.
- Faixa roxa "LANÇA COM NK 👤 NO INSTA" (Instagram @leilaolegendscom): Liga Draft 5K · Carreira 7K · Campo 2D 3K · 🃏 Bafo OCULTO pra quem não pode criar (26/10, *"deixa oculto, pra não confundir"*; meta dele seria 3K, sem plano)
  (selo no botão). Modo travado NÃO abre nada embaixo: só o quadro roxo (meta, jogar grátis, criar com plano); a Carreira tem propaganda
  própria (Várzea → Série A com o amigo, técnico, vender jogador, coletiva). A Liga Draft agora aparece pra todos (travada).
- Tempo do envelope continua SÓ no Modo Stream (*"deixa só pro modo stream"*), com "45s · padrão".
- 🌎 Baralho MUNDO sozinho na sala (`deck: 'world'`, START_ONLINE; o `setActiveCatalog` já sabia montar). Testado: leilão de 38 cartas,
  todas do Mundo. Clubes e Liga Draft continuam travados no Todos. Só sala online (carreira/partida rápida não mudam).
- Quando bater as metas: ligar o modo pra todos é o interruptor de sempre (`*_GERAL` em sport.ts) — a faixa some sozinha com `on`.

## 📻 Faixa do gol pisca, estilo FM (26/10) — ✅ PUBLICADO PRA TODOS
- No gol, a faixa da rádio (placar cinema) e a do locutor (Campo 2D) gritam "⚽ GOOOOOOL DO <TIME>! <bordão com o autor>" piscando
  verde do Bom Jogador #2E9E5B ⇄ creme (`radio-pisca.ts`/`.css`). No normal: uma linha só, creme com letra preta, sem "Rádio/Lance/Jogo".
- **O pisca dura EXATAMENTE a cena do gol** (*"quando a mascote sai… o pisca para ao mesmo tempo"*): placar = até a cena fechar
  (`goalSide` volta a null; reserva 1,8 s), 2D = enquanto dura a `festa`. Gol em cima de gol recomeça com o autor novo.
- 🎙️ **Rádio com os jogadores tocando na bola (26/10, publicado pra todos)**: 45 toques entre companheiros (rodam pela escalação
  inteira), +20 lances, até 22 frases por jogo com escalação. Vale em todo placar novo (carreira, copas, salas online, Minhas Ligas).
  ✅ Partida Rápida OFFLINE também (26/10, *"óbvio"*): `publicOnlineVisual` não exige mais sala online.
- ✅ Calendário no MANUAL (26/10, print dele): os dias passam nos dois modos; a coletiva abre sozinha depois do apito com o
  calendário (senão segurava a semana no domingo); quem caiu na Copa não vê mais a quarta azul/rótulo COPA/Quartas na lista.
- ✅ Faixa fina de sábado agora diz "AMANHÃ" quando o jogo é no domingo.
- Ainda em aberto: clã da semana no
  telão junto do pódio (pergunta sem resposta); preço do Campeonato Oficial (30/20/15/10/5 × 10/7/5/4/2).

## ⚽ Motor novo — futebol de verdade no 11×11 (25/10, conta de prévia; Diego: *"quero futebol real lá dentro do campo"*)
- Medido ANTES em 120 jogos: 76% dos chutes de fora da área (23 m de média) e 55% viravam gol; bola no pé dentro da área 0,05 s por
  jogo; os 20 jogadores num quadrado de 40×30 m em volta da bola (filmado no 2D, `scratchpad/film2d.mjs`).
- FEITO (`motor2/`): chute vale a chance de gol na mesma moeda do passe (`ESCALA_CHUTE`, `CHUTE_PERTO`, meia distância só livre);
  goleiro com alcance pelo TEMPO da bola (`goleiroNoChute`: reação + mergulho); bloco defensivo com tamanho real (26 m, largura 0,82) e
  zaga do time que ataca perto do meio; marcação por zona colada só perto da bola; **a linha é do bloco** (marcador não sobe atrás do
  atacante — era o abraço a 18 m que esvaziava a área); centroavante entre os zagueiros e ponta oposto no 2º pau; quem ataca/defende
  perto da área se move com pressa; domínio orientado (`toque1`); curva na bola (`giro`: cruzamento, falta/colocado de quem tem o golpe);
  corte de TV no intervalo; escanteio mais rápido; empurrão com teto; faltas menos frequentes.
- DEPOIS (300 jogos, `npm run motor2`): 1,9 gol · 0×0 10% · 4,0 chutes (58% de dentro da área, 16 m) · conversão ~37% · forte ganha
  81%, perde 4% · lendas × fracos 2,2 gols e 35% de goleada · bola parada 18 s/jogo (era 21). Scripts de medição no scratchpad
  (`motor/m2stats.mts`, `perdas.mts`, `passes.mts`, `trace.mts`, `onde.mts`, `paradas.mts`).
- FEITO depois: 🤝 TABELA (toca apertado e sai pro espaço; quem recebe devolve de primeira — 3,4 iniciadas e 1,1 completada por jogo).
- FEITO (2ª leva, 25/10): bola não "voa" mais pro pé depois de desarme (toque de domínio ≤ 12 m/s); chutão/lançamento no máx. 28 m/s;
  quem recebe livre segura 0,2–0,8 s (bola no pé 25% → 30% do tempo); cobertura/cavadinha no goleiro adiantado; drible muda de direção;
  bola gira de lado com o efeito (`curl` em `RotacaoBola3D`); cabeçada com pulo no 3D; chute procedural (perna bate) em todo passe/chute
  sem captura; cai na falta, bote no desarme, ginga no drible; câmera de TV mais perto no celular em pé (~40 px de boneco).
- FEITO (3ª leva): 🎉 torcida do time que fez o gol PULA (shader, `festa()` em `presidencia-complexo-torcida.ts`) · 🪑 ESTÁDIO CHEIO: 2ª camada
  de torcedores de baixo-polígono (`farGeometry`, ~96 tris, `LIMITE_TORCIDA_LONGE` 7000) além dos 800 detalhados — medido 472 + 3670
  torcedores = 1,44 M triângulos (era 1,09 M só com 472) · tática: lateral vira ala, marcado = passe ruim, circulação pelo zagueiro/
  lateral livre, tabela · voleio/bicicleta · cobertura/cavadinha · drible muda de direção.
- FEITO (4ª leva): 🚀 lançamento de verdade (0,3 → 0,8/jogo) · bolo na transição (ponta e meia aberto no mesmo ponto) 0,59 → 0,36 par/quadro ·
  bloco recompõe a 6,5 m/s · conferido no 3D: bola na rede (entra, bate, volta 60 cm, cai), quique, goleiro no chute, desarme, cabeçada.
  Bancadas novas no scratchpad: `anomal.mts` (bola parada/jogador plantado/goleiro longe/dentro de outro), `bolo.mts`, `lat.mts`, `quem.mts`,
  `recep.mts`, `vmax.mts`, `golpes.mts`, `capdata.mjs` (lê a bola do 3D quadro a quadro).
- FEITO (5ª leva, 25/10 de manhã): ⏱️ TRANSIÇÃO × POSSE MONTADA (`posseDesde` no motor, `transicao`/`direto` em `decide.ts`): nos 3 s
  depois de roubar a bola o time joga direto; com o bloco rival montado o bônus de ganhar metros cai (×0,65 no próprio campo) e o
  zagueiro/lateral livre vale mais (`CIRCULA` ×3) — recepções do zagueiro 5% → 7%, do lateral 9% → 16%, atacante 61% → 54%; quem está
  LIVRE vê o companheiro atrás do corpo (a "visão" só esconde quem está atrás quando apertado). Pra manter o placar: `GK_BASE` 0,34 → 0,25
  e `CHUTE_LONGE` 0,75 → 1,0 (300 jogos: 1,6 gol · 0×0 11–13% · 3,2 chutes · forte ganha 75–78%). 💫 DRIBLE COM JEITO: quem não tem
  golpe assinatura dribla pelo que a carta É — veloz = arrancada (28%), forte com o marcador na frente = protege e gira (7%), o resto finta
  de corpo (60%); narração PT/EN e corpo próprio no 3D (`teatro` em `players.mjs`: inclina / agacha e protege / ginga; roleta e Cruyff
  rodam inteiro). 🤝 APITO FINAL: os 22 andam pro meio-campo (1,5 m/s) em vez de congelar onde estavam. Defendendo perto do gol a linha
  não se amontoa no lado da bola (pilha de 6+ na área 4% → 3% dos quadros). Limpeza: `qa-tmp-cams.html` e `public/qa-tmp-input.json`
  saíram do repo (o json ia junto no build) e entraram no `.gitignore`.
  📏 Limite que vale saber: o jogo tem 90 s e cada passe custa ~2 s (segurar + voo), então são ~43 passes por jogo — circular mais na
  defesa tira ataques; 7% de toques do zagueiro é o compromisso entre "a zaga joga" e "tem gol". Bancadas novas: `opsagg.mts`/`opsdec.mts`
  (utilidade de cada opção de passe por grupo do alvo), `passout.mts` (resultado do passe por zona e alvo), `jeitos.mts` (jeitos do drible).
- FEITO (6ª leva, 25/10): 🤾 LATERAL de verdade — o cobrador FREIA chegando na bola (a 9 m/s cravado passava dela, voltava e a cobrança
  atrasava ~1 s), pega a bola na MÃO e segura em cima da cabeça até o arremesso (`naMao` na `Parada`; braços pra cima em `players.mjs`);
  🧤 GOLEIRO: o tipo do pulo (pra cima × de lado) se decide UMA vez por chute (`vertical` no `dive` do adaptador — antes começava curvado
  e terminava reto) e a postura de prontidão deixa de ser reverência (`KeeperReady_Loop` misturada ×0,55 com o parado); 🤝 APITO FINAL
  no mapa: o relógio para em 93' mas cada quadro desenhado leva o motor 1/60 s adiante por até 45 s (`fimQuadros`), então os 22 andam
  mesmo até o meio-campo (medido: 21,6 m → 3,1 m do centro em 30 s). Bancada: `rev/cap2.mjs` foca QUALQUER jogador pelo nome (o
  `cap.mjs` só achava quem tinha plano de chute — por isso o goleiro nunca aparecia); `rev/evs.mts` regrava os eventos da fixture com o
  motor ATUAL (os eventos gravados no `mkfix` envelhecem a cada mudança do motor — o 3D replica o código de agora).
- FEITO (7ª leva): 🧱 BARREIRA de verdade na falta frontal — os 3 são escolhidos UMA vez na hora da falta (`barreira` na `Parada`; antes
  era "os 3 mais perto" refeito a cada passo e eles trocavam de lugar correndo a 7 m/s até a cobrança), ficam a 9,9 m (fora da régua
  de 9,6 m que empurra rival — em cima dela tremiam) e OMBRO A OMBRO (a folga de 2,2 m entre companheiros não vale pra eles). Filmado:
  três parados de frente pra bola 1,5 s depois da falta. Falta frontal a <30 m é rara (0,2/jogo) e leva até 4,5 s porque os 5 que sobem
  são os melhores cabeceadores (zagueiro vem lá de trás) — teto que já existia.
- FEITO (8ª leva): 🟨 o JUIZ MOSTRA O CARTÃO (2 s depois do amarelo/vermelho: braço pra cima e pra fora — reto pra cima sumia atrás da
  cabeça grande do boneco — com o cartão da cor na mão; `sidelines.mjs`, só desenho) · 🎉 a COMEMORAÇÃO VARIA por gol (preso no autor +
  minuto): braços pra cima com pulinhos · aviãozinho (braços abertos correndo pra lateral) · dedo pro céu; os companheiros do abraço
  seguem de braços pra cima. Bancada: câmera `referee-front` no `mechanics-audit`. ⚠️ `test-sidelines.cjs`/`test-referee-clearance.cjs`
  do Codex precisam de servidor em 127.0.0.1:4197 com base `/7a0-game-studio/` e da fixture `neymarzetti-current` — não rodam aqui (já era assim).
- FEITO (9ª leva): 💫 golpes assinatura com corpo próprio no 3D (pedalada, elástico, chapéu, caneta, croqueta, corta pra dentro —
  `teatro` em `players.mjs`); 🧑‍⚖️ o juiz guarda 9 m da bola e sai do caminho de quem chega a 3 m (antes ficava DENTRO do drible —
  medido: distância mínima a jogador 0,08 m → 1,67 m); quem passa pelo marcador avança 0,35 s com a bola antes de soltar.
  🧪 Descartado: colar a bola no pé por 0,3 s depois do drible (0×0 10% → 17% em 300 jogos; nem goleiro mais fraco compensava) e
  ponta colado na linha a 4,5 m (passes pra linha 3% → 13%, mas a bola não ficou mais perto da linha, caiu chute e subiu 0×0).
  📏 A bola sai pela lateral ~1×/jogo porque ninguém joga a menos de 4 m da linha (2,9% do tempo) — largura é escolha do bloco, não bug.
- FEITO (10ª leva): 🧤 GOLEIRO COM A BOLA NA MÃO — encaixou ou saiu buscando bola do rival = bola no peito (`gkMao`, h 0,9 m; o recuo
  do companheiro continua no pé) e a reposição sai DA MÃO: arremesso baixo e rápido até ~32 m, chutão de voleio além disso; no 3D os
  dois braços vão do ombro até a bola (segura na frente do corpo). ⚠️ Pra isso a bola na mão vai SEM `owner` no quadro: a apresentação
  do Codex (`ball-control`) gruda a bola do dono no pé — por isso a 1ª versão ficava no chão. Medido: 0,4 encaixe/saída por jogo, 0,38
  arremesso/jogo. Bancada: câmera `front` (de frente pro jogador focado) no `mechanics-audit`.
- ✅ 🔁 REPLAY DO GOL — FEITO (aprovado pelo Diego 25/10, *"Ok aprovado tudo"*; mockup `scripts/mockups/replay-gol.png`): na festa do gol
  (2,5 s, relógio parado), dos 0,35 s aos 1,95 s a tela mostra de novo os 2,4 s antes de a bola entrar (câmera lenta ~0,67×), da câmera
  'Atrás do gol', com o selo 🔁 REPLAY piscando, e volta pra festa. Só apresentação: o adaptador (`comReplay` em
  `presidencia-futebol-oficial.ts`) guarda os últimos 4 s de quadros e devolve o quadro antigo com `replay:true`; a câmera contínua
  recebe `forcar:'goal'` e entra/sai em CORTE seco guardando a distância do preset do usuário; o selo é `.pc3-replay` no mapa. Motor,
  placar e festa não mudam. Confirmado no mapa de verdade no celular (selo na tela) e na bancada (relógio volta de 14.7' pra 12.6').
  Bancada: `cap2.mjs` agora anda em passos de 0,05 s entre fotos (o replay e a marcha precisam do histórico denso, como no jogo).
- FEITO (11ª leva): 🤝 no MAPA de verdade o laço de desenho segue 45 s depois do apito (`cumprimentos()` em `presidencia-complexo-3d`) e a
  TV passa a seguir os JOGADORES indo pro meio (`foco` no `update` da câmera contínua) — antes o último quadro congelava com todo
  mundo plantado e, depois do conserto do motor, a câmera ficava olhando a bola parada enquanto eles saíam do quadro. 🎯 Chute comum
  com nome pelo que aconteceu: de longe (> 24 m) · rasteiro no canto · cruzado (narração PT/EN) — "normal" caiu de 79% pra 46%.
  🧪 Descartado: jogador comum ajeitar a bola na área antes de bater (1,57 gol, 18% de 0×0) e etiqueta "de primeira" (seria 64% dos
  chutes — na área o motor bate no instinto, a narração repetiria).
- FEITO (12ª leva, 25/10 — análise lance a lance no 3D, pedido dele: *"esqueça o Codex, faça por você… olhe minha conta"*): bancada
  `rev/strip.sh <fixture> <nome> <câmera> <jogador> <t0> <t1> <passo>` filma qualquer fundamento em 10–20 quadros/s. Achados e consertos:
  🧍 quem espera o passe corria DE COSTAS pra bola (tronco reto, só a cabeça virava) → o tronco abre até 0,4 rad pro lado da bola
  (`orientOpenPlay`); 🗣️ o corte de cabeça do zagueiro vinha como `desvio` sem `golpe` e o 3D não pulava (ficava parado embaixo da bola)
  → `golpe:'cabeca'` no lance e `requiredContact:'head'` no adaptador; 🧤 goleiro no passinho lateral ficava DE LADO pro chute (a marcha
  virava o corpo pro deslocamento) → abaixo de 3,4 m/s ele encara a bola (adaptador + `players.mjs`); 🧤 bola na mão a 0,62 m (o boneco é
  baixinho: a 0,9 m ficava na cara); 🧍 bola parada: o 2º homem passava POR DENTRO do cobrador → companheiro guarda 2,5 m na âncora,
  2 m na separação e contorna a bola (raio 1,8 m, ≤ 0,1 m/passo) — medido: companheiro a < 1 m do cobrador 0% em todas as paradas.
  ⚠️ **Lição da bancada**: `captureWithScore` rodava a AUDITORIA do Codex (`players.audit()`) antes da foto e a auditoria MEXE na pose
  (deixava o goleiro de pé no meio do mergulho); e buscar a chave do jogador com `seek(1)` recriava a partida e o goleiro aparecia
  "frio". Agora a foto é `audit:false` e a chave vem de um mapa nome→chave feito uma vez. Meia hora de "mergulho que não aparece" era a bancada.
  Câmeras novas na bancada: `front` (de frente pro focado), `goalreal` (a câmera 'Atrás do gol' do JOGO), `referee-front`.
- FEITO (13ª leva): 🏃 CORRIDA na bola parada — escanteio, falta e pênalti: o cobrador espera 2,2 m atrás da bola (no escanteio, 2,2 m
  pra dentro do campo pela lateral: atrás da linha de fundo ele ficava "atrás do gol" e a decisão não via o cruzamento — 38% dos
  escanteios saíam em passinho) e vem bater chegando; a corrida começa 0,6 s antes de a cobrança poder sair, então o tempo parado não
  mudou (`correndo` na `Parada`). O contador de "reinício sem a distância" conta UMA vez na cobrança (contava a cada passo da corrida:
  10 → 152). `GK_BASE` 0,25 → 0,23 pra segurar o placar (1,62 gol · 0×0 15%). 💫 toque de condução curto por 0,5 s depois do drible.
  🥅 CÂMERA 'ATRÁS DO GOL' estava presa atrás do gol de +X — com a bola no outro gol virava formiga a 120 m. Agora fica atrás do gol
  da metade onde a bola está e CORTA seco quando a bola cruza o meio (nada de voar por cima do campo); teste de presets atualizado.
  Bancada: `cap2.mjs` aceita `away:Nome`/`home:Nome` (o fixture fc tem dois Roberto Carlos — a câmera seguia o errado).
  📏 Medido: diferença de ±0,07 gol entre duas versões em 300 jogos é RUÍDO (erro padrão ≈ 0,075) — só mexer no goleiro quando o
  `npm run motor2` reprova, não a cada décimo.
- FEITO (14ª leva): 🦘 BARREIRA PULA no chute direto de falta (só quem está na linha bola→gol, a 7,5–12 m) · ✈️ DISPUTA AÉREA: quem
  chega na bola alta vira de frente pra ela e sobe (até 0,34 m) com os braços · o cabeceador olha pra bola na hora da cabeçada.
  Conferido quadro a quadro no 3D (falta do Ronaldinho, cabeçada do Thiago Silva).
- 🟢 LOJA NOVA · ETAPA 2 NO AR (26/10): link do ⭐ Craque Completo 14,90 (`https://app.vendria.com.br/c/mfwRSubfQriKTXsTdkPerrMGJulG04GX`).
  Diego: *"planos atuais de quem já se deu bem não mude… não mude o visual que já existia no padrão dos planos… até aquele texto de pra
  onde vai o dinheiro"*. Feito no MESMO padrão (mesmos cartões `SupportPlanCard`, "pra onde vai o dinheiro" intacto):
  · Vitrine (`support-plans.tsx`): seção "📅 POR MÊS" com ⭐ Craque Salas 9,90 e ⭐ Craque Completo 14,90 (botão abre a Vendria; aviso de
    usar o MESMO e-mail da conta) no lugar do Craque de 29,90; Lenda 59,90 · dupla 107,90. FAQ (screens.tsx) e Loja do Clube (seção
    "⭐ Craque por mês"; o Craque de 29,90 sumiu do "Sobe de plano") atualizados. Presente: sem o Craque de uma vez.
  · Banco (`supabase/migrations/20261026170000_loja_lenda_5990.sql`): `esc_mp_preco` Lenda 59,90, Craque de uma vez = não vende;
    `esc_plano_rank_fixo` (o mensal NÃO conta como plano pra sempre: assinante paga o Lenda cheio); quem comprou o Lenda a 44,90 continua
    subindo pela diferença de 44,90 (Batismo 40 · Fundador 60, conferido); presente Lenda 59,90 e dupla 107,90.
  · Código: `planoFixo` (preço/subida) × `planoAtual` (o que GANHA — mensal = Craque: presidente e clã). Trava `npm run planos` atualizada.
  FALTA: avisos na hora (sala extra / Manual trancado), Passe 24h R$ 9,90, conferir a 1ª renovação real (17/11), apagar `tmp_direitos_antes`.
- 🟡 LOJA NOVA · ETAPA 1 FEITA (26/10, invisível pro jogador): o CRAQUE MENSAL já liga sozinho pelo servidor. Diego mandou o link da
  Vendria do ⭐ Craque 9,90 (`https://app.vendria.com.br/c/5NdmF6I4FEuAFrhelEWUS0Ttft_aMNbG`) e lembrou: *"quem já tem plano não muda nada"*.
  · Banco (`supabase/migrations/20261026150000_craque_mensal_vendria.sql`): tabela NOVA `esc_assinatura_mensal` (só soma por cima do que a
    conta já tem) + `esc_vendria_aplica` (só a chave de serviço; plano pelo VALOR assinado pela Vendria: 990 = `craque_salas`, 1490 =
    `craque_completo`; prazo = `accessEndsAt`, nunca encurta; só ativa se a CONTA do jogo com aquele e-mail já existia, `conta_ok`) +
    `esc_direitos_de` com `mensal_plano`: mensal ativo = tier PRATA (ouro continua ouro), salas à vontade, nuvem; Manual SÓ no Completo.
    Conferido: 346 contas (todas as pagantes + 150 recentes) com direitos IDÊNTICOS antes/depois; simulação desfeita: anon barrado,
    Salas = prata sem Manual, Completo = prata com Manual, evento velho não tira mês, valor estranho ignorado.
  · Webhook `vendria-webhook` v5 (fase 2): depois de conferir a assinatura e guardar, evento `subscription.*` chama `esc_vendria_aplica`.
  · Jogo: `planos-regras.ts` lê `mensalPlano`; `tierEfetivo` dá prata; `temManual` recebe o tier COMPRADO (não o da tela) e libera
    Manual só pro Completo. Trava `npm run planos` com 9 casos novos.
  ⚠️ FALTA: (1) apagar a tabela `tmp_direitos_antes` (foto de conferência; a ferramenta pediu confirmação ao Diego e expirou) ·
  (2) link da Vendria do ⭐ Craque COMPLETO 14,90 · (3) a TELA da loja (sem Craque 29,90 à venda, dois mensais com o link, Lenda 59,90
  no Pix — muda `PRECOS_UNICO` E `esc_mp_preco_ref`) · (4) avisos na hora (sala extra / Manual trancado) · (5) Passe 24h R$ 9,90 (produto
  novo no Pix + direito de 24 h) · (6) conferir a 1ª RENOVAÇÃO real: o assinante de teste de 17/10 renova em 17/11 — ver se a Vendria manda
  `subscription.*` na renovação (senão o mês não estende) · (7) o Craque Salas leva 2 fichas e nuvem (vem do prata) — o mockup punha isso
  só no Completo; perguntar ao Diego se tudo bem.
- ✅ APROVADO (26/10, *"aprova assim então"*; `scripts/mockups/loja-craque-mensal-lenda-vez.png`, sem "cancela quando quiser", Manual trancado = 24 h 9,90 · 14,90/mês · ver planos). ⚠️ Taxa da Vindi: R$ 2 FIXOS por cobrança recorrente (9,90 → 7,90 líquido, 20%). Proposto subir só o Craque Salas pra 11,90 — esperando resposta: a proposta DELE depois de 4 rodadas
  (*"deixar como tá hoje mas remover o plano de 29,90… quando o cara for criar sala extra que não pode aparece avulso 4,90 ou mensal
  9,90 ou ver todos os planos… teria também 14,90 pra ter sala extra e botão manual + campo 2D; esses dois seriam planos craques; o
  Lenda seria 59,90 com as coisas do Lenda e do Craque uma vez só; mantenha 79,90 e 99,90"*). Então: SAI o Craque 29,90 (quem tem
  fica) · ⭐ Craque Salas 9,90/mês (salas à vontade + Minhas Ligas + criar personagem + criar clã + prata — personagem e clã nos DOIS Craques, pedido dele) · ⭐ Craque Completo 14,90/mês (+ Manual + 2D em breve +
  nível até Craque + 2 carreiras + boneco) · 👑 Lenda 59,90 UMA VEZ (tudo dos dois + até Lenda + 4 carreiras + dourado) · Batismo
  79,90 e Fundador 99,90 iguais. Oferta na hora: criar sala sem poder → 4,90 avulso · 9,90/mês · ver planos; Manual trancado →
  14,90/mês · Lenda 59,90 · ver planos. O que vai em cada Craque é proposta minha — ele ajusta.
- ⏳ MOCKUP ENVIADO, ESPERANDO OK (26/10, `scripts/mockups/loja-mensal-pecas-vitalicio.png`): a 3ª opção do Diego — mensal
  obrigatório pra jogar (⭐ 9,90 / 👑 14,90), o CLUBE VENDIDO PEÇA POR PEÇA (proposta de preço: escudo 29,90 · mascote 34,90 · manto
  19,90 · nome 9,90 · gala 14,90 · canto 10 · tema 6,90; kit completo 79,90 = 29,60 mais barato que separado) e UM vitalício caro sem
  mensal, 💎 Presidente Vitalício 249,90 (Lenda pra sempre + kit + gala única + canto + nº fundador + tema + roupas + 500 🪙 + 2 fichas;
  o que o assinante pagou nos últimos 6 meses desconta). Regra: peça do clube NÃO dá Manual nem sala.
- ⏳ MOCKUP ENVIADO, ESPERANDO OK (26/10, `scripts/mockups/loja-dois-mensais.png`): DOIS MENSAIS + TUDO AVULSO. Diego perguntou
  *"e se todo mundo tivesse que pagar dois planos mensais, e o resto é tudo coisa avulsa, ou kit com manto, mascote e escudo"*.
  Proposta: só ⭐ Craque 9,90/mês e 👑 Lenda 14,90/mês dão acesso de jogo (Manual, 2D, níveis, carreiras, salas, cor, boneco); 🛡️ Kit do
  Clube 79,90 e 🖋 Kit Fundador 99,90 (o Batismo/Fundador de hoje SEM plano dentro, uma vez, segue o e-mail) com 6 MESES DE LENDA DE
  BRINDE; peças soltas como hoje. Quem já pagou fica como está (13/10). Frase do modelo: "Jogar é mensal. Ter um clube é seu pra sempre".
- ⏳ MOCKUP ENVIADO, ESPERANDO OK (26/10, `scripts/mockups/loja-mensal-vitalicio.png`): LOJA COM MENSAL E PRA SEMPRE. Diego recusou
  a loja só com planos de uma vez (*"não tô gostando… quero plano de valores baixos mensal e vitalício e etc e alto também"*). Ele tem
  Pix recorrente na Vindi. Proposta: a MESMA escada com um botão 📅 MENSAL / ♾️ PRA SEMPRE: Craque 9,90/mês ou 29,90 · Lenda 14,90/mês
  ou 44,90 · Batismo 79,90 e Fundador 99,90 só pra sempre (arte feita à mão) · degrau novo 💎 Presidente 199,90 (conteúdo a decidir).
  🔁 Diego (26/10): *"29,90 não tem sentido tendo mensal… e o de 49,90 coloque 59,90"* → CRAQUE SÓ MENSAL (9,90; quem já comprou
  fica, regra de 13/10) · LENDA 14,90/mês OU 59,90 pra sempre · 4 meses pagos de Lenda = pra sempre (14,90×4 = 59,60). Mockup refeito. Passe
  24h 4,99 (desconta se assinar). Só o webhook da Vindi libera o mês (camada de assinatura que vence sozinha já existe desde 08/10).
- ⏳ MOCKUP ENVIADO, ESPERANDO OK (26/10, `scripts/mockups/loja-estrategia.png`): LOJA PRA VENDER MAIS. Diego trouxe uma proposta
  de loja com mensal 9,90 + vitalício 199,90 + combo 249,90 + passe 24h e pediu análise. Vendas reais (Pix, 30 dias): 21 compradores
  (~1 em 100 dos 1.859 que jogaram online na semana); Craque 7 · Lenda 5 (3 eram subida de 20) · Fundador 3 (1 cheio, 2 subidas) ·
  Batismo 2. Conclusão: a escada funciona (metade do dinheiro dos planos caros é de quem SUBIU), o vitalício de 199,90 mataria a
  venda e o mensal com tudo engoliria Craque/Lenda (e o Sócio mensal saiu em 14/10). Proposta: mesma escada e mesmos preços, 👑 Lenda
  em destaque ("mais escolhido"), 🎁 boas-vindas pra conta nova (Craque 19,90 nas primeiras 48 h, só 1ª compra), ⏱️ Passe 24h R$ 4,99
  (vira Craque por 24,90) e venda NA HORA DA VONTADE (Manual trancado · sala do dia acabou · fichas cheias), com "agora não" que não
  insiste no mesmo dia. Nada disso existe ainda: boas-vindas e Passe 24h precisam de produto/preço no banco (`esc_mp_preco_ref`).
- FEITO (26/10, Diego aprovou com "Sim"; foto `scripts/mockups/telao-cla-semana.png`): no telão, o anúncio do PÓDIO DA SEMANA ganha uma
  linha dourada embaixo dos técnicos: "⚔️ CLÃ DA SEMANA: <campeão>" (Diego: *"no mesmo momento que aparece os vitoriosos, coloque após
  eles clã da semana e o nome do clã vitorioso"*). O anúncio separado dos 3 clãs continua girando depois.
- FEITO (26/10, mockup aprovado com "Sim", incluindo 2º e 3º): 🏆⚔️ AVISO DE FIM DE SEMANA em qualquer tela (`aviso-semana.tsx`,
  montado no `index.tsx`; espera o fim do leilão se a pessoa estiver no pregão). Técnico no pódio (+30/20/10, medalha 30 dias, telão) e
  membro de clã no pódio (+30/20/10 cada, telão); o CAMPEÃO dos clãs ganha a zoeira com o 2º colocado (8 frases PT/EN, presas na
  semana) e o botão "Zoar o <rival> no Zap". ✕ ou BORA = `esc_aviso_semana_visto` (marca `visto_em` NA CONTA — não volta em
  nenhum aparelho). Banco: `supabase/migrations/20261026120000_avisos_semana.sql` (`esc_avisos_semana` traz só a última semana
  fechada e chama os dois fechamentos, que já eram juntos na segunda 0h de Brasília). Moeda continua sendo dada SÓ pelo resgate
  da carreira (servidor, 1× por semana) — o aviso não dá nada. Quem não abre a carreira vê o aviso, e as moedas caem quando abrir.
- FEITO (26/10, partida inteira filmada no mapa em tela de PC): 🔁 a faixa de narração ficava em "Intervalo!" com a bola rolando aos
  55' — o 2º tempo recomeçava sem frase. Agora a saída do 2º tempo diz "Começa o segundo tempo!" (3 versões, PT e EN). ⚠️ O narrador
  usa o MESMO sorteio do jogo: a frase nova é escolhida SEM sorteio e não segura a faixa (segurar calava as frases seguintes e mudava o
  sorteio — 5 de 60 jogos mudavam). Conferido: 60 partidas idênticas lance a lance à versão anterior. Também conferido no 3D: o jogo
  pelas pontas (cruzamento do Hulk pela direita) fica natural.
- FEITO (25/10, Diego: *"tô achando o mapa pesado… quando aperta em Clube já fica pesado… sem prejudicar o real"*): ⚡ MAPA MAIS LEVE,
  mesma imagem. Medido no quadro do JOGO no mapa: eram ~3,7 milhões de triângulos por quadro (2,04 mi na tela + 1,63 mi no passe de
  SOMBRA), agora ~1,8 mi (1,24 mi + 0,57 mi). O que mudou: (1) a sombra dos torcedores detalhados (2300 triângulos cada) é feita por
  um boneco simples invisível no mesmo lugar — a sombra de um torcedor tem 1–4 pontinhos no mapa de sombras, fica igual
  (`complexo-torcida-sombra`, fora do grupo da torcida); (2) os ~260 torcedores detalhados ficam nos lugares MAIS PERTO da câmera
  (refaz quando ela anda 12 m); os mesmos assentos continuam ocupados, com as mesmas cores, e quem está longe usa o boneco simples, que
  já era 90% da torcida. De perto ficou MELHOR: antes, os da 1ª fila muitas vezes eram o simples; (3) o que faz sombra no
  bairro é juntado por quadra de 400 m, então o que está longe sai do quadro. Na ABERTURA do Clube: as texturas de chão
  calculam o ruído uma vez só (pixel a pixel idênticas, conferido), as peças juntadas saem da cena de uma vez (antes, uma a uma, com
  custo ao quadrado) e os moradores usam o índice espacial dos raios. JavaScript da abertura 7,2 s → 6,1 s na máquina de teste.
  Conferido: cidade idêntica (moradores, circulação, ruas, pedestres) e vista aérea igual. ⚠️ A trava
  `testa-presidencia-complexo-torcida-sentada.mjs` já falhava ANTES ("instância renderizada corresponde à inspeção") — não é desta
  entrega. Fica pra depois: a abertura ainda trava num bloco só (montar a cidade em etapas, quadro a quadro, é cirurgia grande).
- FEITO (15ª leva, Diego: *"faz o que deixa mais real… depois melhora se precisar"*): ↔️ JOGO PELOS LADOS — o ponta do lado da bola
  pisa na linha antes do último terço (3,5 m), o lateral do lado da bola abre colado na linha (4 m), quem conduz pela ponta longe da
  área corre pela linha em vez de cortar logo pra dentro, e o passe pro companheiro livre aberto no campo de ataque ganha preferência
  (`PELO_LADO`). 🎯 mais chute e goleiro que defende mais: `ESCALA_CHUTE` 1,2 → 2,0 · `CHUTE_LONGE` 1,0 → 1,6 · `GK_BASE` 0,23 → 0,25.
  Medido (300 jogos): bola a menos de 10 m da lateral 9% → 13% · dono da bola perto da linha 5% → 9% · laterais 0,98 → 1,3 · chutes
  3,1 → 3,7 · defesas 0,85 → 1,16 · gols 1,6 → 1,75 · 0×0 13% · forte ganha 76%. Chute de fora = 22% das finalizações.
  Testei e NÃO usei: goleiro mais fraco (gols 1,8 mas defendia só 1 em 4 no gol — feio no 3D) e chute ainda mais solto (os chutes quase
  não sobem: num jogo de 1:30 o time chega pouco na área; forçar só derrubava gols).
- MEDIDO (25/10, depois da 14ª leva): a bola sai pouco pela lateral (~1/jogo) porque o jogo roda PELO MEIO — a bola passa só 3% do
  jogo a menos de 5 m da lateral e 9% a menos de 10 m; o dono da bola está a menos de 8 m da linha só 5% do tempo. Testei soltar o
  ponta pra conduzir pela linha (o puxão pro meio de 0,12/m vira 0,025/m longe da área): a faixa perto da linha subiu pouco e o 0×0
  bateu 15% (estourou a trava). DESFEITO. Abrir o jogo de verdade muda o placar da carreira → só com OK do Diego. Junto: a média de
  gols está em ~1,6 (era 1,97 quando a trava nasceu, em 21/10) — dentro da faixa, mas encostando. O "2º homem colado no cobrador"
  já estava resolvido (guarda 2,5 m da bola).
- PRÓXIMO:
  a câmera "goal" da bancada não é a do jogo (fica em cima do goleiro — não serve pra julgar defesa).
- ⚠️ Testes do Codex `test-three-presentations`/`official-parity`/… precisam de `test-results/animation-library/neymarzetti-current/`
  (fixture local, fora do repo) — já falhavam antes de hoje por ENOENT.

## 🎥 3D do jogo no mapa (25/10) — 1ª leva NO BRANCH (conta de prévia)
- Diego: *"simule o jogo vendo rolar o 3D e arrume… jogadores, campo, câmeras, bola, traves, juiz… mas principalmente o jogo em si"*.
  Bancada de revisão: `mechanics-audit.html` com fixture gerada do motor atual (scratchpad `rev/mkfix.mts`, `rev/cap.mjs` tira foto
  em qualquer segundo exato; `watch3d.mjs` roda o mapa de verdade com o estádio completo).
- FEITO: 📺 câmera de TRANSMISSÃO de verdade (`presidencia-enquadramento-futebol.ts`): parada no alto da arquibancada principal, só
  gira e dá zoom (antes voava a ~40° em cima do campo e os bonecos viravam formiga); a LATERAL PRÓXIMA é a mesma no anel de baixo,
  colada no campo (sobe pra principal quando o lance não cabe). Foto: `scripts/mockups/mapa-camera-tv.png`. Testes de câmera do Codex verdes.
  🎉 COMEMORAÇÃO do gol (`players.mjs`, `levantaBracos`): quem fez e os companheiros perto levantam os braços e dão pulinhos na festa.
  🏁 escanteio/falta ensaiada esperam 4+ na área (teto +4,5 s) — antes saía com 3 e os zagueiros subindo.
- FEITO: 🧤 o GOLEIRO PULA no 3D (`presidencia-futebol-oficial.ts` prevê onde o chute cruza a linha dele; `players.mjs` tomba o corpo
  pro lado, desliza, sobe se a bola vem alta, braços esticados). Só desenho — defesa/gol continua decidido pelo motor. Bola no meio e baixa =
  sem pulo. Foto: `scripts/mockups/mapa-goleiro-pulo.png`.
- 🐛 25/10 (print do Diego, 00:52: *"não consigo ver o jogo pelo campo 3D"*): na aba Clube a SEMANA ficava pausada (só andava em
  Jogos/Central) e o mapa só mostrava jogo EM CASA. Agora, com o mapa na aba Clube: os dias passam ali, o mapa mostra a data e
  "⏩ Ir pro jogo", o jogo fora de casa também roda no campo, e quando um jogo começa a câmera vai sozinha pro campo na Transmissão
  (uma vez por jogo). "VER JOGO" na faixa rola até o mapa em vez de trocar de aba. A faixa da Copa ainda puxa pra aba Jogos.
- 🗓️ 25/10 (Diego: *"domingo é 16h dia de jogo e quarta 21h à noite"*): no mapa a LIGA é sempre domingo 16h de dia e a COPA quarta 21h
  de noite (antes saía do número da rodada: metade da liga virava noite). E no domingo de jogo EM CASA a torcida chega antes do apito
  (fase 'arrival'): no Automático o apito vem depois de 1 dia do calendário (3 s), no Manual quando aperta. Dias sem jogo = bairro normal.
  🚌 JOGO FORA DE CASA (decisão dele, 25/10): *"deixe o estádio como o estádio do jogo e minha torcida menor… mantenha o mapa da cidade
  o mesmo… dia de fora de casa vai tá tudo mais vazio"*. FEITO: a cidade é a dele; no lugar do estádio entra o do DONO DA CASA (save dele
  se for gente; bot = `estadioPadraoDaDivisao`, todo com setor visitante); arquibancada com a torcida da casa e a dele no visitante, pela
  torcida de verdade × 0,45; ruas mais vazias (`fora` no Complexo). Foto: `scripts/mockups/mapa-jogo-fora.png`. Regra que segue valendo:
  quanto mais torcida, mais gente na cidade e no estádio (`publicoDoEstadio`).
- PRÓXIMO: cobrador chegar mais rápido na bandeira, animação de chute em todo chute, replay do gol,
  torcida reagindo, juiz.

## 📺 Placar e controle DENTRO do mapa 3D (25/10) — FEITO no branch (só a conta de prévia; esperando "publica")
- Diego: *"não gostei do placar fora do mapa… botão manual, placar e etc. deveria ser lá"*; mockup v2 `scripts/mockups/clube-mapa-hud.png`
  ("aprovado"). Foto real: `scripts/mockups/clube-mapa-hud-real.png`.
- `presidencia-mapa-hud.tsx` (`MapaHud`) dentro do `pc3-stage` do complexo (prop `hud`, vale na tela cheia): placar de TV + minuto ao
  vivo, ⏭️ Próxima rodada/fase (Manual), 🔁 Auto/🎮 Manual, velocidade 1/2/4× (fora do jogo) ou ritmo 0,25/0,5/1× (com jogo), narração.
  A carreira publica o MESMO controle via `controle-partida-mapa.ts` (`publicaControleMapa`) — mesmas funções do "🎮 Controle da
  partida" (regra contra botão mudo). "Ritmo para acompanhar" e "Créditos" saíram de cima do mapa (créditos no pé).
- Falta: "Próximo jogo · ▶ Ir pro jogo" quando não tem jogo (precisa do calendário mandar o adversário), testar numa carreira de verdade.

## ⚽ Futebol "de profissional" no motor novo (25/10) — 1ª leva NO BRANCH (só a conta do Diego joga o Motor2)
- Pedido: *"simule a partida 11×11… corrigir pra ficar uma partida com os jogadores atuando igual profissionais"*. Bancada de 300
  jogos (scratchpad da sessão, `motor/harness.mts`). TRAVA DE FUNDO: o motor roda 89 s de futebol em velocidade real pra um jogo de
  93' (regra do Diego: jogo corrido em 1:30) — números por jogo (25 chutes, 1.000 passes) são impossíveis; dá pra deixar cada LANCE real.
- FEITO (gols iguais: 1,94/jogo; `npm run motor2` e `npm run campo2d` verdes):
  · ritmo de gente (`coletivo.ts`, `ritmo`): anda/trota/corre conforme a distância — velocidade média 4,8 → 3,6 m/s, sprint 13% → 3%.
  · domínio perto do pé (`ALCANCE_PE` 1,45 → 1,2 m; média 1,04 → 0,83 m) e a bola NÃO teletransporta mais pro pé: vai no toque de
    domínio (~0,3 s); condução mais colada (`CONDUCAO` 0,75 → 0,6).
  · passe rasteiro chega mais manso (13 → 11 m/s no pé; média 17 → 15,6 m/s).
- 🔁 25/10 (Diego: *"não é sobre gols… é a simulação em si… quero que acerte tudo isso"*) — ETAPAS FEITAS no branch:
  1. corpo com frente que gira (`fx/fy`, `gira`/`deCostas` em fisica.ts): passe/chute/recepção de costas custam; quem recebe abre o corpo.
  2. condução no TOQUE (`TOQUE_V`, `ESCAPOU`): correndo, a bola vai à frente e ele busca; toque longo = bola perdida; bote mais fácil
     com a bola longe do pé; só passa/chuta com a bola no pé.
  3. jogo sem bola/passe: toque curto de 3 m, apoio a 6 m quando apertado, passe NA FRENTE de quem corre, VISÃO (atrás do corpo só o
     craque enxerga), bloco defensivo 20 m, gatilhos de pressão (de costas/na lateral/acabou de receber), infiltração no tempo do passador.
  4. bolas paradas: lateral com a MÃO (arco curto) e 2 companheiros oferecendo; tiro de meta curto com zagueiros abertos.
  5. cruzamento: ataque à área com a bola na ponta (1º pau · 2º pau · marca do pênalti), corte pra trás da linha de fundo, cruzamento
     rasteiro; menos chute de longe pra quem chuta mal (`CHUTE_LONGE` 0,75 × (finalização−60)/20) — o craque ainda arrisca.
  Medido (300 jogos): gols 2,05 · chutes de 25 m+ 60% → ~45% · forte × fraco ganha 88%. Goleada continua existindo (parecidos: 9% por 3+;
  lendas × fracos: 39% por 3+, até 6×0) — antes 47% nas lendas × fracos (o time bom ficou um pouco menos goleador).
- TESTADO E VOLTADO (antes das etapas): menos chute de longe + goleiro melhor. Os gols do motor vêm quase todos de chute de fora (90%): o time fica só ~3 s
  por jogo com a bola no último terço e ~0 s na área. Tirar o chute de longe derrubou os gols pra ~1/jogo. Precisa de obra maior:
  ataque/defesa no último terço (corte, enfiada na área, defesa que não fecha tudo) — PROPOR pro Diego antes.
- Análise do 3D/cidade (bonecos cartoon): câmera "transmissão" é alta demais (parece tática), sem replay nem comemoração, goleiro não
  pula, 3 de 4 chutes sem animação de chute, cobrança (escanteio/tiro de meta) com ninguém na bola NA TELA (o motor espera o cobrador
  — é a apresentação), moradores vão e voltam num trecho reto (o que o Diego NÃO quer), dia de jogo com ~3 pessoas na rua.
  Lista priorizada no relatório desta data (sessão do Claude). Nada disso foi mexido ainda.

## ⚡ Mapa 3D travando na aba Clube (25/10) — análise + 1ª leva de conserto NO BRANCH (esperando "publica")
- Medição (celular simulado 4× mais lento, scripts no scratchpad da sessão): ~167 s de trava somada num ciclo abrir+jogo → ~92 s.
  Montagem do bairro 3,3–5,4 s → 1,3–2,8 s (PC) com cidade IDÊNTICA (comparada objeto a objeto, matrizes e malhas). Trava do apito
  (torcida mudando) ~10 s → ~0,4 s (PC).
- O que entrou (nada perde qualidade, nada fica pré-gravado — regra do Diego: *"não quero que perca qualidade… nada preso, o boneco
  não pode ir sempre no mesmo local… no futuro treinadores vão se encontrar em tempo real"*):
  · `presidencia-raio-rapido.ts` (three-mesh-bvh): os raios que conferem por onde as pessoas andam testam só os triângulos perto —
    mesmo resultado, rotas continuam calculadas ao vivo.
  · `indiceTrechos` no entorno: "perto de rua/rota/obra?" olha só a vizinhança (resposta idêntica).
  · pixels das texturas de chão calculados 1x por página (`RUIDO_PRONTO`).
  · 1º desenho com `compileAsync` (placa compila em paralelo quando o aparelho suporta).
  · campinho 2D ESCONDIDO não desenha (o relógio segue) — Diego: *"2D escondido tá errado"*.
- Ainda pesa: abrir o Clube de novo e ABRIR/FECHAR TETO remontam a cidade inteira (o teto muda a malha da arquitetura); guardar o
  mundo entre aberturas é a próxima leva. Laço de desenho 60 fps sempre (Diego não quer perder qualidade — não baixar).
- Aprovado pelo Diego, falta fazer (MOCKUP antes): 📺 ASSISTIR em janela por cima (placar + controle de sempre + 2D + 3D), mapa
  primeiro na aba e ritmo (0,25×…) dentro dele só com jogo, "Créditos dos modelos" sai de cima, "carregando seu estádio…" com barra.

## 🗺️ Clube da conta do Diego piscando MAQUETE ↔ MAPA 3D no meio do jogo (24/10, 20:20) — consertado no branch, esperando "publica"
- Causa: `presidente-acesso.ts` derrubava a prévia pra `false` em TODO aviso do login (a renovação do acesso, de hora em hora e
  quando o celular volta pro navegador) e em toda falha de rede da conferência — a aba Clube trocava pra maquete até o servidor
  responder. Os prints mostram junto o "GESTÃO · sua agência" sem "presidência" (mesma chave caindo).
- Conserto: só cai com saída/troca de conta ou resposta 401/403 do servidor; renovação da mesma conta e falha de rede mantêm.

## Publicação autorizada da prévia da conta (24/10)

Diego pediu publicar todas as melhorias atuais na própria conta. Integração de relato/cinema e pausa permanece sob `usePresidentPreview`; demais contas conservam o caminho anterior. Atualização concorrente do calendário integrada sem reintroduzir seletor cinema/2D na aba do mapa da conta de prévia. Build e workflow de deploy devem terminar antes de afirmar publicação concluída. Nenhuma alteração de DB/save.

## Aba do mapa exclusivamente 3D (24/10)

Diego reforçou: na aba do mapa somente cidade/estádio/partida 3D; campinho 2D e placar cinema ficam nas abas próprias. Compartilhar acontecimentos não significa misturar interfaces. O painel acima das abas (cinema/campinho) fica oculto também na aba estádio, mas permanece montado para preservar o relógio e a publicação da partida. Removida a alternativa “Vista ilustrada do estádio” da carreira e substituído o fallback ilustrado/aéreo por `PresidenciaComplexo3D`. Fonte/relógio/resultados e controles de câmera do complexo preservados. Verificação local: `scripts/cartoon-football/test-map-only-3d.cjs`. Sem publicação ou DB.

## Pausa do campo compartilhado (24/10) — correção local

Campo2D agora recebe a pausa do placar/intervalo. Enquanto pausado, conserva o minuto fracionário publicado ao mapa/cinema e reposiciona a âncora de tempo para a retomada não consumir o tempo parado. Encerramento mantém a finalização existente. Sem mudança de Motor2, resultados, atributos ou DB. Teste real de navegador manteve o minuto estável nas duas pausas, retomou a marcha do relógio e não registrou erros JavaScript. Testes: `test-field-pause.mjs`, `test-field-pause-browser.cjs` e paridade das três apresentações (três entradas completas, resultados/eventos preservados). Domínio e naturalidade continuam pendentes; esta correção é do relógio.

## Partida única nas três apresentações (24/10) — esclarecimento e integração local

Diego reafirmou: cinema, campinho 2D e mapa 3D compartilham resultado, gols/minutos/autores/assistências, narrações e comentários; apenas a visualização muda. Corrigido caminho Motor2 do cinema que ainda gerava chances/frases próprias e atrasava o placar pela animação. Agora lê a sequência oficial no relógio do campo; narração acompanha o mapa. Verificação de replay inclui assistências e protege também o 2D contra reprodução incompatível com o save. Testes com três entradas locais preservam 1×1/82, 1×0/77 e 2×0/72. Sem mudanças de regras, atributos ou DB; não publicado. Detalhes/limites: `docs/partida-unica-tres-visuais-20261024.md`. A naturalidade de domínio/condução permanece pendente; não confundir fidelidade dos eventos com qualidade das animações.

## Recepção e força do chute 3D (24/10) — correção parcial, não publicada

Removida a atração posicional extra da bola; aproximação limitada do avatar agora alimenta a marcha. Capturas de chute usam preparação antecipada e amplitude nativa medida, mantendo contato/resultado oficial. Partida completa 1×1/82 e 52/44/36 contatos nas três entradas preservados. Persistem domínios fora do alcance: Motor2 adquire posse em raio de 1,45 m e depois ancora bola 75 cm à frente; interpolação também antecipa a posse em relação à chegada visível. Corrigir a regra compartilhada pode alterar partidas futuras e está separado da apresentação para respeitar a proteção expressa do motor. Não considerar recepção aprovada. Evidências e próximos passos: `docs/recepcao-forca-3d-20261024.md`.

## Bola e continuidade corporal 3D (24/10) — naturalidade ainda reprovada

Diego mantém os Civis e quer futebol natural, sem trocar a arte. Corrigidas rolagem composta incorretamente nas curvas, puxões na aproximação da bola ao pé, dupla rotação na continuação do passe, troca de arco e giro da recuperação do goleiro. Fonte oficial e escala preservadas. Mesmo replay1×1/82eventos, 2.821quadros; erros de rolagem em jogo corrido822→0 e giros extremos do suporte10→0. Não é aprovação visual: domínio segue provisório, distância à chuteira211→228amostras e mudanças rápidas ainda existem. Ajuste que aumentava passos de costas foi descartado. Relatório, comandos/evidências e limites: `docs/continuidade-bola-corpo-3d-20261024.md`. Revisar partida inteira e lances próximos em toda manutenção; não prometer padrão FIFA/PES baseado em testes de contato.

## Revisão da partida e área técnica 3D (24/10)

Juiz, dois técnicos e reservas passaram ao mesmo rig Civil NO FACE; poses Idle/Walk/Run/SitDown adquiridas, assentos compatíveis, solas apoiadas, LOD e atlas compartilhados. Presidente vinculado ao lado da própria conta quando disponível; roupa/acessórios 3D ainda provisórios. Bancos usam suplentes reais, sem fillers/duplicatas/expulsos; save exportado do Neymarzetti só tem11atletas, portanto zero reservas. Bancada com14suplentes é sintética e não entra na carreira. Partida completa novamente revisada: mesmos1×1/82eventos, sem penetração pé–bola/piso ou falso toque; correções bruscas fora das saídas1→0. Seguem lacunas de domínio/condução, cabelo e ações especiais. Vermelho reproduzido em variante local: mapa apagava o jogo ao cair para21; corrigido sem recriar avatares ou resultado, teste de UUID/visibilidade/continuidade. Registrar/repetir a revisão de partidas e trechos próximos a cada manutenção 3D, como Diego pediu. Relatório/testes/limites: `docs/revisao-partida-area-tecnica-3d-20261024.md`. Sem DB/save; prévia privada autorizada, confirmar build e publicação antes de anunciar.

## Fundamentos 3D por partida (24/10) — correção da limitação a um replay

Capturas CMU agora ajustadas por entrada oficial em segundo plano, compartilhadas pelos 22 Civis NO FACE, sem reiniciar relógio/cena ou alterar Motor2. Banco de 64 amostras, validação de preparação/contato/continuação e cache por entrada/motor. Recepção antecipa trajetória real, cabeça comunica intenção e IK residual deixa de afastar o pé excessivamente após o domínio; toque só é confirmado na malha final. Chute revisado preservado sob compatibilidade estrita. Três entradas locais: 52/44/36 contatos, mesmos 1×1/82, 1×0/77 e 2×0/72; duas últimas são variações locais de QA, não rodadas da carreira. Escala mantida: atleta1,78m, bola22cm, campo105×68m, gol7,32×2,44m. Permanecem domínio/condução provisórios, contatos sem solução segura, pequenos conflitos de cabelo e correções bruscas pontuais. Relatório e reprodução: `docs/fundamentos-por-partida-3d-20261024.md`. Sem DB/save; publicação somente na prévia privada autorizada, após build/testes e confirmação do workflow.

## Bola, domínio e passes 3D (24/10) — histórico anterior, limitação a uma fixture superada acima

Preservados Civis NO FACE, rig, uniformes, cidade, estádio e Motor2. Corrigida a preparação que invadia o domínio; quatro passes ajustados com CMU existente, quadril aberto, aproximação de raiz separada da pose e continuação orientada novamente à marcha. Dois contatos antes rejeitados foram recuperados (50 contatos revisados). Nas quatro sequências a 60 Hz, amostras de tronco contrário ao deslocamento caíram 42→0. Bola conserva 22 cm, recebe sombra de contato e rolagem correspondente à condução visual limitada; correção retorna ao ponto oficial antes do impacto, não entra em reinícios/rede/goleiro e fica desativada sem perfis compatíveis. Paridade manteve 1×1/82 eventos e erro zero nas 20.702 posições. Auditoria completa 5.641 quadros: sem penetrações pé–bola/piso ou excesso do orçamento de raiz; seguem uma aproximação conservadora de cabelo numa falta e quatro correções bruscas fora das saídas. Cinco ações de pé e quatro de mãos continuam sem captura ajustada. Domínio é provisório e **os perfis ainda pertencem à fixture revisada, não a qualquer partida nova**. Evidências normais/lentas e limites em `docs/bola-dominio-passes-3d-20261024.md` e `test-results/cartoon-football/bola-passe-v2/`. Publicação somente na prévia já autorizada; confirmar workflow antes de dizer que está no ar. Nenhuma escrita em save/DB.

## Refino dos fundamentos 11×11 (24/10) — revisão realizada

Revisada a partida inteira do Neymarzetti (22 atletas, 2.821 quadros/30Hz, mesmos1×1/82eventos). Corrigida orientação integral antes da captura: amostras de corrida contrária ao corpo fora dos reinícios caíram51→7. Recepção só antecipa passe ainda em andamento; posse após recepção usa condução, sem arrastar atleta ao controle do adversário. Goleiros acompanham a bola com ajuste limitado de cabeça/tronco sobre a animação existente; captura de agarrada fica protegida.48contatos de pé e pega de duas mãos mantidos; sem novos conflitos de volumes/penetrações/piso/raiz nas amostras. Avanço extra de8cm testado e descartado. Domínio/condução e deslizamento ainda provisórios; perfis revisados continuam específicos da fixture, não universais. Evidências reais normal/lenta e partida completa em `test-results/cartoon-football/refino-atual/`; causas, testes e limites em `docs/refino-fundamentos-3d-20261024.md`. Fonte/save/DB preservados; cidade/NPCs não foram declarados concluídos neste bloco.

## Uniformes de contraste no 3D (24/10) — implementação autorizada

Diego aprovou variante temporária: próprio clube sempre padrão, rival só muda se houver conflito, usando cores relacionadas à identidade dele. Observador identificado por ID real, inclusive fora de casa; cores públicas reaproveitadas, sem novos IDs/DB. Tecido recolorido com símbolos/inscrições protegidos nas receitas UV existentes, numeração legível e meiões coerentes. Cache separado e liberado no encerramento; sem mudar rig, resultado ou dados oficiais. Teste real 22 Civis: Neymarzetti branco/preto vs Rei da Bola vermelho escuro com faixas e escudo; fonte do save intacta. Biblioteca ainda tem só duas receitas completas de arte; outros clubes mantêm o uniforme genérico existente com cores de contraste. Detalhes/testes/limites em `docs/uniformes-contraste-3d.md`, capturas locais `test-results/kit-contrast/`.

## Câmeras do futebol 3D (24/10) — implementadas e validadas para publicação privada

Pedido de Diego: Ver campo abre transmissão de futebol e oferece câmeras padrão. Transmissão, Lateral próxima, Ampla, Atrás do gol, Tática e Mapa livre implementadas. Lentes próprias, bola alta, panorâmica suave e zoom estável; escolha em controle nativo que cabe no celular. Trocar câmera não remonta mundo/partida; resize mantém preset e mapa recupera lente/pose. Corrigido caso de giro landscape→portrait com partida pausada: zoom pendente não podia encerrar o RAF antes de enquadrar a bola. Teto recebe recorte somente visual durante câmeras automáticas, preservando sombras e save. Build passou; 300 enquadramentos, 4.496 quadros em movimento e 20 giros pausados passaram. Componentes reais validados em desktop e celular emulado, cinco câmeras na mesma jogada, resize, avanço oficial, retorno livre e retrato→paisagem→retrato; sem erros JS/HTTP ou alteração da fonte. Nenhuma lógica oficial/DB alterada. Não equivale a FPS em aparelho físico. Testes e limites em `docs/cameras-futebol-3d.md`; capturas locais `test-results/camera-qa/`. Segue a publicação autorizada na mesma prévia privada; confirmar o workflow verde antes de informar que está no ar.
## 🏆 Festa do campeão + túnel da final NA CARREIRA (24/10) — PUBLICADO PRA TODOS (*"a festa é final pode publicar p todos no carreira"*)
- Pedido: *"a pessoa hoje é campeão e não tem graça nenhuma… não tem os troféus, não tem nada"* — todo título (Várzea → A, Copa,
  Supercopa, Liberta/Champions/Mundial, Copa do Mundo). Proposta `scripts/mockups/carreira-festa-campeao.png`: as MESMAS peças do
  online (`TunelFinal` antes da final das copas · `FestaCampeao` no apito, com canto do clube, artilheiro/garçom, mascote) e o troféu
  da Sala de Troféus. Ordem: festa → tela "o que você levou" de sempre → roteiro. Paletas `carV…carA/copabr/supercopa` já estão em
  `competicoes-visual.tsx`. Bancada `scripts/teste-festa-carreira`.
- Onde mora: `pyramidseason.tsx` (`festasC`: liga no apito da 38ª, Copa depois da final, Supercopa — a Copa PAUSA enquanto a festa
  ou o túnel estão na tela, `pausaFesta`; túnel 4s antes da Final/Supercopa em que o seu time joga, `tunelSeg`) ·
  `career-international-view.tsx` (Liberta/Champions/Mundial, troca o festão antigo) · `copa-mundo.tsx` (Copa do Mundo da carreira,
  só se a SUA seleção ganhar). O festão antigo da mascote (só sócio) saiu da carreira: a mascote vai dentro da festa.
- 24/10 (2ª entrega, *"túnel da final e festa são todas copas"*): túnel também na final da Libertadores/Champions, no Mundial
  (`tunelIntl`, o placar grande só monta quando ele fecha) e na final da Copa do Mundo da carreira (`tunelMundo`, o toque que leva
  pra final abre o túnel e a bola só rola quando ele fecha).
- 24/10 (3ª): artilheiro/garçom também na festa da Supercopa (gols do confronto) e das internacionais (`destaquesDaComp`, por carta).
- Ficou de fora: túnel no Campo 2D (o campinho tem relógio próprio). A festa reaparece 1x se recarregar a página no fim da
  temporada (mesma régua do festão antigo).

## 🔗 Entrosamento na carreira (24/10) — RECUSADO pelo Diego (*"entrosamento n faça"*), código revertido. Não repropor.
- `entrosamento.ts` (regra) · simulação da liga (`simDivTo`, pelo `entroDesde`, liga a partir do próximo jogo) · selo 🔗+N no
  campinho do Elenco + caixa embaixo · etiqueta no leilão (envelope). Trava `npm run entrosamento`. Liberar: `ENTRO_GERAL` (sport.ts).
  Falta: copas da carreira (hoje só a liga usa) e as linhas tracejadas do mockup (no lugar, cor do selo por grupo).

## (ideia original do entrosamento)
- Diego gostou da ideia (*"gostei do entrosamento… talvez ganha cada um +1 de over"*). Proposta no mockup
  `scripts/mockups/carreira-entrosamento.png`: cartas do MESMO clube e MESMO ano juntas no TITULAR → 2 juntas +1 cada · 3+ juntas
  +2 cada (teto) · banco não conta · só carreira. No campinho: selo 🔗+1/+2 no boneco e linha tracejada ligando o grupo; caixa
  "Entrosamento no time titular" embaixo; no leilão, etiqueta "entrosa com X e Y" (só o que ele JÁ tem — nível segue escondido).
  368 grupos com 2+ cartas no baralho hoje. Narração própria quando o grupo tabela. Nada feito no código ainda.

## 🌪️🔴 Guimarães SCI virando 🖋 Fundador — gala "O Saci chega no redemoinho" (23/10) — PUBLICADO ("coloque esse áudio e publique")
- Pedido: *"entrada de gala personalizada… o saci chegando num furacão… em breve dou o canto"*. `gala-guimaraes.tsx` (8,6 s):
  vento e folhas, o redemoinho nasce e cresce, trovão, o Saci sai girando e pousa numa perna só, fumacinha do cachimbo, escudo
  com anel de vento, frase ONDE TEM REDEMOINHO, TEM SACI e faixa CHEGOU NA SALA. Ligada em `GALA_UNICA` ('Guimarães SCI').
  Vídeo `scripts/posts/gala-guimaraes.webm` (`node scripts/video-gala-guimaraes.mjs`).
- ✅ Canto: o vídeo que o Diego mandou (10 s) → `public/sfx/torcida-guimaraes-v1.mp3` (mono 56 kbps), na gala e na carreira
  (`AMBIENTE_CARREIRA_POR_EMAIL`, jadriovani). ✅ Plano: ele pagou por fora pro Diego (permuta por indicação, 23/10) → registrado
  na mão `esc_compras_batismo` (jadriovani, 'plus' = Fundador). Ouro/manual já estavam em `user_colors`.
- ✅ Tema da sala `guimaraes` (vermelho e branco com o Saci, *"vermelho e branco com o saci o tema"*): `temas-sala.tsx`, foto
  `scripts/mockups/tema-guimaraes-*.png`. Publicado.
  o PLANO Fundador no banco entra pelo Pix da subida (Batismo → Fundador = 29,90) — ele já tem fundador nº82 e sócio 63.

## 🔌 Caixa de entrada do dono caía e não religava (23/10, sala RGP7P7 do Futpoint) — CONSERTADO e publicado
- Sintoma (Diego): convidados não pegavam sobra, não mudavam tática, times completados com os piores. Prova no
  `esc_realtime_medidor`: a caixa do dono recebeu 116 ações até 22:25 UTC e só 4 nos 9 min seguintes, com os convidados mandando
  centenas. Às 22:25 a aba do dono ficou escondida (live) → a ligação caiu e voltou; o canal da sala voltou, a caixa não.
- Conserto (só no aparelho do DONO, nada muda pro convidado): `supabase.channel(tópico)` devolve o canal que já existe — o velho
  agora é tirado antes; a assinatura olha o status e religa em 2 s se der erro/tempo/fechar; e religa ao voltar pra aba.
- 🔁 Mesmo dia, 2ª parte (Diego: *"o chat também não aparecia pro Futpoint"*): o canal da SALA tinha a mesma armadilha —
  `supabase.channel(nome)` devolve o canal velho morto, o dono falava mas não ouvia. `canalLimpo()` (store.tsx) tira o velho da
  lista NA HORA antes de criar o novo, no canal da sala e na caixa do dono. Provado em node: sem ele, mesmo objeto; com ele, novo.
  Publicado com o OK dele ("Sim").
- ⏸️ Ficou de fora, por escolha do Diego (*"tô com medo do convidado fazer algo"*): o reenvio do convidado pela sala quando a caixa
  não responde em 8 s. Só fazer se ele pedir.
- Ele perguntou do AVISO pro dono não sair da tela: não existe pro dono (só o banner do convidado, que pede pra chamar o dono). Proposta
  em aberto, precisa de mockup.

## 🎬🏆 Túnel da final em TELA CHEIA + festa larga no PC + artilheiro/garçom na festa (23/10) — FEITO e publicado
- Diego viu uma live e *"não vi nada disso"*: o túnel era um cartão de 5 s dentro do quadro do topo. Mockup
  `scripts/mockups/tunel-festa-hoje-ficaria.png` → *"ok pode fazer"*. `TunelFinal` vira tela cheia na contagem do AUTOMÁTICO
  (toque fecha; no manual fica só o cartão pra não esconder os controles). `FestaCampeao` ocupa a tela toda no computador.
- E *"já poderia aparecer o artilheiro que ganhou a copa"* → a festa mostra ⚽ artilheiro + 🅰️ garçom DAQUELA competição, em
  todas as copas das salas (liga, Copa dos 8, Liberta, Champions, Copa do Mundo, regionais). `garconsRegional` novo em copa-regional.ts.
- *"Depois que tiver campeão dá pra sair da tela?"*: sim — toque fecha a festa e o botão VOLTAR À SALA já existia embaixo.
- Bancada: `scripts/teste-tunel-festa/index.html?v=tunel|festa`.

## ⚽ Parceiro Grêmio Esportivo Campo Grande (23/10) — PUBLICADO 23/10
Clube de várzea com estádio próprio (~10 mil) em Jurubatuba, Zona Sul de SP. Objetivo: gente no estádio no fim de semana + aluguel
do campo. Link = WhatsApp (11) 97650-9180 com mensagem pronta.
- Master da carreira: entra no lugar da ERO (3 temporadas, `gecg`); contrato da ERO correndo vai até o fim. Logo `patro-gecg.webp`.
- Placa do campinho: faixa DEITADA feita pra ela (escudo + "GRÊMIO ESPORTIVO CAMPO GRANDE", `patro-gecg-placa.webp`), logo depois da Tidex.
  Vadico, OittoLabs e Grêmio refeitas IGUAL à Tidex (2ª versão; a de caixa branca + frase ele reprovou: *"só a da Tidex ainda"*):
  só o LOGO claro e grande, sem caixa, sobre placa escura da cor da marca (`placa-vadico.webp`/`placa-oittolabs.webp`/`patro-gecg-placa.webp`).
- ✈️ AVIÃOZINHO NA HOME (ideia dele, publicado): o título "O PREGÃO ESTÁ ABERTO." fica no meio (sem a frase de baixo); 10s depois
  de abrir a home o avião passa UMA vez puxando a faixa do parceiro (tocar = link) e o título some enquanto ele passa.
  Config: `AVIAO_HOME` (patrocinio.ts; `null` tira). Componente `AviaoDaHome` (patrocinio-visual.tsx). Regra no CLAUDE.md.
- Link do Grêmio (telão + avião) = Instagram `https://www.instagram.com/gremiocampo` (pedido dele; antes era o WhatsApp).
- 🧼 Faixa da comunidade do WhatsApp ficou FINA (uma linha escura, 32px, sem verdão/📲/botão amarelo) — pedido dele.
- Nome SEMPRE inteiro: "Grêmio Esportivo Campo Grande" (pedido dele).
- "Apresentada por": Copas Regionais (`regional`) e a liga da carreira NA VÁRZEA (`career-varzea`; as outras divisões seguem Tidex).
- Telão: linha nova em `esc_anuncios_fixos` NA HORA DE PUBLICAR (reserva no código: `GECG_GIRO`).
- Aviso da comunidade: `scripts/avisos/2026-10-23-parceiro-gecg.json` → `scripts/posts/aviso-2026-10-23-parceiro-gecg.png` (escudo dentro da caixa).
- Mockup pro cliente (todos os lugares): `scripts/posts/gecg-no-leilao-legends.png`. Bancada: `scripts/teste-parceiro/`.
## 🎙️ Coletiva no computador (23/10) — FEITO e publicado pra todos ("perfeito pode fazer")
- Mockup `scripts/mockups/desktop-coletiva.png`. ≥1100px (`useTelaPC`): tela inteira em 2 colunas — esquerda painel das marcas +
  mesa (presidente maior) + placar; direita repórter, pergunta e respostas em letra grande. O jornal (O MARTELO) largo e centrado.
  Celular igual. Bancada: `scripts/teste-coletiva-pc/index.html` (`?lendas=1`).
- Regra dele no mesmo pedido: **na bancada só sentam as lendas que JÁ têm rosto** (sem rosto não entra mais a carta com a inicial);
  sem lenda com rosto, vale o de sempre: o presidente da conta, ou o botão pra criar o presidente.

## 🏆 Minhas Ligas: trocar também o que vem depois da liga (23/10) — FEITO e publicado
- Pedido: *"no minhas ligas falta deixar a pessoa poder mudar as ligas também, tipo liga sozinha, liga mais copa, regionais…
  igual já funciona ao criar salas"*. O "🔁 Trocar o modo" da sala de espera ganhou **Depois da liga** com as MESMAS opções e
  prateleiras do criar sala (Com o seu time · Convocando), mesmas travas (Liberta/Champions/regionais pelo que a conta tem; Só
  Champions fora do pregão aberto e das duplas; Liga Draft sem copa). Banco: `esc_liga_modo2` (a antiga continua viva).
- Testado no banco (troca Mundo → Rio×SP → Liberta, marcas antigas saem, travas recusam). Tela não foi fotografada.
## 🖥️ Carreira no computador no padrão do online (23/10) — PUBLICADO pra todos
Diego: *"aumentamos os tamanhos do modo online… placar cinema e aonde vai entrar o campinho… deixa ajustado no modo carreira
também"*. Mockups hoje × como ficaria de Jogos, Tabelas, Clube e Elenco aprovados: *"pode fazer tudo pra todo mundo"*.
Tudo em `career-desktop.css` (bloco de 23/10, só ≥1100px; o celular foi medido igual, mesma altura em todas as abas).
- **Jogos**: cabeçalho em faixa larga e o placar na LARGURA TODA, tamanho do placar cinema do online (escudos 118, números 56)
  — é o mesmo lugar onde entra o campinho 2D deitado.
- **Tabelas · Elenco · Rank · Clube**: cabeçalho + placar + "Acelerar" numa FAIXA FINA em cima (o jogo segue rolando, compacto)
  e o conteúdo da aba com a largura toda. Com o 2D ligado, o campinho só aparece em Jogos (nas outras abas fica escondido rodando).
- **Tabelas**: colunas J, GP e GC (classe `ll-dk-col`) e a divisão em BOTÕES (`ll29-div-botoes`) — só no computador.
- **Clube**: estádio continua a 1ª coisa, à esquerda, com lugares/torcida/bilheteria ao lado (`ll-est-box` em estadio.tsx);
  setores 4 por linha.
- **Cabeçalho da liga** ganhou fundo próprio (sala escura): no Rank o título amarelo sumia no creme.
- Ainda NÃO feito: Rank com as séries lado a lado (proposta de antes, não estava nos 4 mockups finais).
- Desligar: apagar o bloco de 23/10 do `career-desktop.css`.


## 🏢👑 Lenda da Agência travada pra quem JÁ teve SAF (23/10) — CORRIGIDO e publicado
- Caso do Fabulous EC (T130+): trocou a SAF pelo 2º clube (Pantera Negra) na migração do SAF 2.0 e a 👑 Lenda da Agência
  voltou a pedir "comprar a SAF" — as 2 Lendas na ativa rendiam 0 (por isso 88 → 80). Regra do Diego: comprou uma vez, destrava
  pra sempre. `jaTeveSaf` (store) + marca `safJaTeve` na compra; saves antigos pelo `saf2.migrado` e pelo extrato.
- ⚠️ Limite: save antigo que vendeu a SAF ANTES do SAF 2.0 e cujo extrato já passou de 250 linhas não tem como provar — se
  alguém reclamar, dá pra marcar `safJaTeve` na mão no save dele.

## 💾 Escalação A e B salvas no Elenco da carreira (23/10) — PUBLICADO pra todos ("ok")
- FEITO: `escalacao-salva.ts` (puro: quem entra/quem não/quem substitui), `escalacao-ab-ui.tsx` (o cartão, embaixo de
  Formação/Trocas, da 2ª temporada em diante), ações `SALVA_ESCALACAO`/`APLICA_ESCALACAO` (tudo ou nada) e `careerEscalacoes`
  no save (zera ao começar carreira nova). O cardápio do técnico virou função única (`cardapio-formacoes.ts` +
  `formacaoLiberadaNoEstado`) lida pelo seletor, pelo cartão e pelo reducer. Trava: `npm run escalacao-ab`.
- Decisões dele no caminho: técnico novo sem a formação salva → entra na formação atual com aviso; *"não pode seguir a partida
  faltando um jogador"* → se não fecha 11, nada muda e o cartão diz o que falta. Quem chegou depois de salvar só tapa vaga se
  não houver mais ninguém na posição.
- 🔁 23/10, mesmo dia: o cartão aberto empurrava o campinho; ele escolheu o **"enxuto fechado"** (mockup
  `carreira-escalacao-ab-fechado.png`): 3ª PÍLULA ao lado de Formação/Trocas ("💾 Time A ▾"), abre no toque, fecha sozinha ao
  trocar; faixa verde some em 5 s, amarela (alguém não pôde) fecha no toque, vermelha quando não fecha 11. A pílula lê
  `careerEscalacoes[id].ativo` (o último usado com aqueles 11). **Não voltar o cartão sempre aberto.**
- ⏳ Carreira online v2: entra quando ela for liberada (anotar na `docs/carreira-online-checklist.md`).
- Pedido: salvar Time A e Time B e trocar na hora. Mockup `scripts/mockups/carreira-escalacao-ab.png`. Regras dele: vendido/
  contrato acabou/machucado/suspenso NÃO entra; cansado entra (escolha dele); jogador comprado depois de salvar não entra.
- Proposta minha no mockup (confirmar): na vaga de quem não pôde entra o reserva mais inteiro da posição (regra do rodízio);
  formação do B que não fecha → entra na atual com aviso; guardado por CARTA (nome|clube|ano, nunca cardId) no SAVE; vale do
  próximo jogo (SET_LINEUP + CHANGE_FORMATION, as mesmas portas de hoje).

## ⚔️ Tática (retranca/equilíbrio/ataque) nas copas do online (23/10)
- Pedido: *"a tática não está aparecendo em várias coisas como mundo, regionais…"*. Mapa medido: liga ✅ · Copa dos 8/mata-mata ✅ ·
  Champions ✅ · **Liberta fase de grupos: faltava só o botão** (o motor já lia `state.tactics`) → FEITO e publicado.
- ✅ Copa do Mundo e regionais: FEITO (*"sim pode fazer"*). Regra (`copa-taticas.ts` + `docs/sql/copa-tatica.sql`):
  só se escolhe com JOGO ROLANDO (o banco carimba o passo e recusa depois do apito) e vale do PRÓXIMO jogo em diante; a leitura
  só devolve linha congelada; a tela segura o passo até chegar a tática que decide o jogo da vez. O jogo com tática sai de um
  DADO PRÓPRIO depois do sorteio normal — nenhum outro jogo muda, e quem fica em ⚖️ equilíbrio joga igual a sempre.
  O 1º jogo da copa é sempre em equilíbrio (ainda não rolou jogo pra escolher). Só Copa criada depois da publicação
  (`TATICA_DESDE`/ficha `tatica`), porque quem está com o jogo aberto desde antes não conhece tática. Trava: `npm run copa-tatica`.
- ⚠️ Achado no caminho (não é meu): `npm run copamundo` reprova "jogo de copa só conta com a Copa encerrada" — já falhava antes
  desta mudança (linha da carreira em pyramidseason.tsx). Conferir com quem mexeu.

## 🎨 Simulação (liga/copa) com a cara de cada campeonato (23/10) — PUBLICADO pra todos ("ok")
- Feito com o contexto `TemaCompCtx` (competicoes-visual.tsx): só as telas das SALAS e da PARTIDA RÁPIDA embrulham
  (EscSeason liga/copa, EscLiberta, EscChampions, Copa do Mundo online, regionais). Carreira, basquete e Kings: `null`, nada muda.
  ① troféu no canto do `CompetitionStage` + faixa de status na paleta · ② relógio do placar (`OnlineScorePresentation`) ·
  ③ grupos da Liberta (cabeçalho + 2 que passam em dourado), faixas de corte da Champions (azul/prata/cinza), regionais
  (cabeçalho + zona na cor da copa); Copa do Mundo já era verde · ④ `FraseCopa` no pé de cada tela. Bancada `scripts/teste-tema-real/`.
- Pedido: *"simulação das ligas e depois copas temáticas nas cores… sem sair muito dos padrões"*. Mockups
  `scripts/mockups/simulacao-tema-copas-1.png` / `-2.png` (bancada `scripts/teste-tema/`). Mesma tela; muda só: ① faixa do topo
  com o troféu e a paleta da copa · ② relógio na cor da copa · ③ cabeçalho e zonas da tabela nas cores · ④ frase da copa no pé.
  Paletas = as mesmas do túnel/festa (`COMPS`). O 1º mockup (caixas soltas) ele não entendeu; este é o de telas lado a lado.

## 🎬 Salas: túnel da final + festa do campeão, com a cara de cada campeonato (23/10) — PUBLICADO pra todos
- ✅ Aprovado (*"cor do campeonato, pode fazer o túnel da final e o campeão"*) e feito em `competicoes-visual.tsx`: `COMPS` (paleta,
  frase do túnel, frase do campeão, confete), `Trofeu` (desenho vetorial inspirado no real), `TunelFinal` e `FestaCampeao` (5,6s,
  toque pula, som `playCampeao`: canto do clube se o campeão for você e tiver canto; senão a torcida do gol).
- Onde liga: abertura da FINAL da Copa dos 8/Liberta/Champions (screens.tsx), da Copa do Mundo (copa-mundo.tsx) e dos regionais
  (copa-regional-online.tsx); festa no fim da liga e da copa (EscEnd, no lugar do festão da mascote), da Copa do Mundo online e dos
  regionais. Uma vez por edição (sessionStorage). Basquete e Kings ficam de fora. Bancada: `scripts/teste-competicoes/`.
- 🏆 O cartão parado de campeão (Copa dos 8/Liberta/Champions, Copa do Mundo e regionais) também mostra o troféu certo (23/10,
  *"o campeão já aparecer também com o troféu correto"*): prop `trofeu` no `CampeaoCopaCard`.
- 🎨 Pendente (quando ele quiser): trocar os troféus desenhados por arte gerada em `.webp` (regra de peso dos batismos vale).
- 📝 Frases trocadas por ele (23/10): Liga = *"a liga lendária"* (na festa: *"campeão da Liga Legends"*) · Rio×SP = *"biscoito × bolacha"*.
- 🚫 Túnel NUNCA mais verde/vermelho fixo (*"só não tô gostando do fundo ser sempre verde e vermelho"*).
- Mockup `online-momentos-cinema.png` + vídeo `scripts/posts/online-momentos-cinema.mp4` (fora do git): Diego quer SÓ o 2 (festa do
  campeão) e o 3 (túnel da final) — *"faz só o 2 e 3 melhor"*. O ⚡ martelo de lenda (carta grande + VENDIDO) ficou de FORA (o "faah"
  já existe: `sfx/lenda.mp3`, só pra quem leva a lenda). Final aprovada (*"final ok tb td certo"*). Som no campeão: ele quer.
- Pedido novo: cada campeonato com troféu, paleta e estilo PRÓPRIOS, inspirados no real (Liga, Copa dos 8, Liberta, Champions,
  Copa do Mundo, Mundial, Rio×SP, Sul×Minas-PR, Nordeste). Túnel: fundo com a cor de cada time OU a paleta da copa. Mockup das
  paletas e troféus: `scripts/mockups/campeonatos-paletas-trofeus.png` (rascunho de formato; a arte final dos troféus vira imagem).

## 🗂️ Salas online com visual novo (23/10) — ③ SALA DE ESPERA liberada pra todos; ① ② ④ seguem só na conta do Diego
- 23/10: *"gostei dessa tela… só vou aprovar essa daqui pra todos, a parte de criação de sala e etc ainda não"* →
  `useSalasEsperaNova` (`SALAS_ESPERA_GERAL = true`, sport.ts) liga só a ③ Espera; lista/criar/Minhas Ligas continuam em
  `useSalasVisualNovo` (só ele). Ele perguntou do DESKTOP da espera (coluna estreita no meio, laterais vazias) — opinião dada,
  esperando ele dizer se quer mockup.
- 🖥️ Mockups de COMPUTADOR (23/10): `scripts/mockups/desktop-salas-d1/d2/d3.png` — ① espera em 2 colunas (técnicos + convite |
  zoeira + chat sempre aberto, botão do dono largo no pé) · ② criar sala com o resumo "📋 Sua sala" fixo à direita · ③ salas
  abertas em grade de 3 + coluna lateral (Criar sala, Minhas ligas, carreiras, zap). Celular não muda. Esperando OK.
  🔁 23/10 (2ª rodada, `desktop-hoje-ficaria-*.png`): **② CRIAR SALA APROVADO** — mas com as 5 etapas (modo · time e
  baralho · partida · sala…) TODAS ABERTAS, nada recolhido (*"ficam tudo abertas, sem recolher"*). Liga/Copa rolando em 2
  colunas (tabela inteira / chave fixa à direita): ele gostou, só achou o PLACAR menor ruim, porque o campinho 2D vai entrar ali.
  Sugestão dada: placar no tamanho de hoje na coluna da esquerda (com 2D, o campinho toma o lugar dele, como já é regra),
  outros jogos embaixo. Esperando resposta. Leilão: sem resposta ainda. A fazer só depois do OK de cada tela, só no desktop.
  ✅ **FEITO E LIBERADO PRA TODOS (23/10)** — *"aprovado pode fazer"* + *"o resumo é pra todos"* + *"liga e copa com duas colunas
  ficam pra todos já"*. Mockups finais `desktop-{liga,copa}-{placar,campinho}.png`. Só ≥1100px (celular igual):
  · criar sala: `useTelaPC()` (lobby `desk`) — modos lado a lado, etapas 2–4 sempre abertas, coluna "📋 Sua sala" com o botão;
  · liga/copa rolando: `useDesktopNovo()` (`DESKTOP_NOVO_GERAL`, sport.ts) → `Shell desk2` + `.ll-dir` (online-visual.css). A tática
    e a tabela (na Copa: tática + jogos da fase) entram por PORTAL na coluna fixa da direita; placar/campinho 2D, telão e outros jogos
    ficam na esquerda. Fora da Kings e do basquete. Bancada: `scripts/teste-desktop-hoje/index.html?desk2=1&fase=season|copa`.
  · Leilão no computador (cartas em grade de 3 + caixa/time/chat ao lado) e salas abertas em grade (d3): *"ainda não!!"* (23/10)
    — NÃO fazer até ele pedir.
Mockup `salas-hoje-x-proposta` (4 partes). Pedido: *"só pra mim essas formas de visualização, quero testar antes"*. Trava
`SALAS_VISUAL_GERAL` em `sport.ts` (false = só a conta dele). Só muda o DESENHO — regras, lances, envio e coroa iguais.
- ① Lista: faixa fina do zap (só se a de cima já foi fechada), sem o título grande, aba "Salas abertas (N)", filtros de um toque
  (Envelope · Tocaia · Pregão · Clubes · Duplas), vagas em número grande ao lado do Entrar; carreiras descem pro pé da página.
- ② Criar: o modo escolhido vira uma linha (trocar ›), as seções 2/3/4 viram linhas com o que está marcado (a 3 já abre), e o
  "📋 SUA SALA:" com o resumo antes do botão.
- ③ Espera: nome + código (toque copia) no topo, regras em selos (regras ▾), convite logo embaixo em toda sala, técnicos em 2
  colunas com "+ N vagas livres", zoeira numa fileira que corre pro lado, Abrir o pregão FIXO no pé da tela.
- ④ Minhas Ligas: caixinhas temporada · técnicos · bots no cartão. "Último campeão" ficou de fora (não vem na lista magra).
- 🐞 Pra TODOS (conserto, não visual novo): a faixa "ÀS CEGAS" da sala de espera saía com as letras espalhadas — herdava o
  espaçamento do código gigante (`online-visual.css`, regra agora só no `.online-room-code-num`).

## 💼 Kit de patrocínio (22/10) — FEITO (online + PDF)
Pedido do Diego: PDF/online com os números da Loja (só os que favorecem), as artes de onde a marca aparece (Tidex de exemplo) e o
clube batizado no padrão Fundador incluso pro patrocinador (Neymarzetti de exemplo; R$ 99,90 pros jogadores). Online:
https://claude.ai/artifact/WoZZALpLsJosqmcG4wX3z6 (privado até ele compartilhar). Fonte guardada em `scripts/kit-patrocinio/`
(HTML + imagens; o PDF sai com o Playwright, largura 1100px). Números = os mesmos de `marca-mensal.tsx` (18/10). Fora de propósito:
LED do estádio e anúncio no O MARTELO (desligados). O campinho 2D entrou marcado "lançamento em breve" (ainda só na conta dele).


## 🎭 Cerimônia: lendas apresentadas + a conta do pregão nova (22/10) — PUBLICADO pra todos
Mockup `online-cerimonia-lendas-conta.png` aprovado (*"aprovado pode fazer"*). Ideias 2 (capa do Martelo da sala) e 3 (coletiva
relâmpago) do mockup `online-apresentacao-lendas.png` foram RECUSADAS (*"gostei só do 1"*) — não repropor.
- No cartão do time (`FotoLendasCerimonia`): só as LENDAS (fame 5, não promessa) que ele levou NESTE pregão (carreira: pelo
  `careerMercado` da temporada; rápido/salas: elenco menos o filler `via:'bot'`). 1–4 rostos, 5+ = 4 + "+N". Sem lenda, sem foto.
- Depois do Anterior/Próximo: ⭐ As lendas do pregão (sala inteira, mais cara primeiro) e, por último, 🧾 A conta do pregão
  (mesmos prêmios de `premiosDaResenha`, cartões lado a lado; perna-de-pau numa faixa). Basquete: sem lendas.
- Zero tempo e zero mensagem nova: tudo calculado no aparelho com o estado que já chega. Bancada: `scripts/teste-cerimonia/?n=0..5`.

## ⭐ Apresentação das lendas + coletiva com mais ocasiões (22/10) — PUBLICADO pra todos
Diego aprovou A + C do mockup `coletiva-apresentacao-lendas.png` (*"pode fazer a letra A e C junto… às vezes vai ser uma lenda,
duas, três, quatro… ajustar a imagem… pode publicar já"*).
- Rodada 0 (antes da temporada): se o leilão trouxe LENDA (fame 5, não promessa) pro seu clube (`careerMercado` da temporada),
  a coletiva abre sozinha com as lendas na bancada (`LendasNaMesa`: 1–4 rostos, tamanho pela quantidade, 5+ = 4 + "+N";
  sem rostinho = carta dourada com a inicial). Situações `apresentacao_uma`/`apresentacao_varias` (7 perguntas, 4 respostas por
  estilo, 3 manchetes). Uma vez por temporada. Quem fala é SEMPRE o presidente (nunca frase na boca de jogador real).
- C: a foto (`FotoLendas`) vira a capa do Martelo na Central (pré-temporada e rodada 1), com a manchete da resposta.
- Variedade: ocasiões NOVAS na coletiva (não mais textos por pergunta — pedido dele: *"mais tipos de pergunta… em outras ocasiões"*).
- Bancada: `scripts/teste-apresentacao/?n=1..5`.

## 💪 Elenco: força do time · Rank em 3 grupos · Jogos com trilha · Coletiva pra todos (22/10) — PUBLICADO
- 💪 **Força do time** (SquadTab, só no Elenco da carreira): DEF (gol+lat+zag) · MEI · ATA = média do meio da faixa lo–hi dos 11
  titulares + CONDIÇÃO (gás médio, só com o gás ligado). Overall na MESMA regra do Olheiro (*"mantém como funciona hoje"*): 👑 vê
  tudo · ⭐ vê sem lenda (setor com lenda = 🔒) · sem olheiro = 🔒.
- 🏆 **Rank em 3 grupos**: ⚽ Jogadores (gols · garçons · bola de ouro) · 🏟️ Clubes · 🌍 Global.
- 🗓️ **Jogos**: trilha da temporada no topo (Liga R/38 → Copa → Supercopa → Internacional T40+ → Copa do Mundo quando vale) e os
  outros jogos em 3 cartões + "ver os N jogos" (`CareerLeagueGames limite`). Ordem de sempre (nunca por placar — spoiler).
- 🎤 **Coletiva liberada pra todos** (`COLETIVA_GERAL = true`): um usuário reclamou que não aparecia — estava só na conta do Diego.
- 🔒 **Campo 2D e Motor novo continuam SÓ na conta do Diego** (22/10, *"Campo 2d e motor novo só p minha conta msm"*) — não liberar sem ele pedir.
- 🎨 **Elenco arrumado (parte 2)**: selo POS com cor por posição e a pílula 🏛️ Comissão dizendo quem é o técnico e o preparador (ou "sem técnico · sem preparador"). Elenco em grupos foi descartado (a lista faz a troca junto com o campinho).

## 📝 Renovação em cartas + Central na Copa + Clube em 3 grupos + bolinha nas abas (22/10) — PUBLICADO pra todos
Diego aprovou os dois mockups (`carreira-abas-ideias.png`, *"adorei"*; `carreira-renovacao-nova.png`, *"perfeito pode fazer e publicar já a b e c mais a tela de renovação"*).
- 📝 **Renovação em cartas** (`renovacao-mesa.tsx`, chamada no `ReserveListScreen`): placar de cima (pra decidir · caixa · renovar todos 5a),
  técnico 🧢, preparador 🏋️ (novo aqui — a decisão continua também no Depto. Técnico do Elenco) e jogadores em cartas com jogos/gols/assist.
  NO SEU CLUBE (`condicaoCarry`) e gás (só com a condição ligada). Prazo em chips (padrão 5 ou o mais perto), ✍️ Renovar / 👋 Deixar ir.
  Decidiu → faixa verde (renovou, SEM desfazer: o reducer já cobrou — igual era) ou vermelha (vai embora, COM desfazer). Regras e ações
  do reducer NÃO mudaram. Bancada: `scripts/teste-renovacao/` (?tela=mesa|copa).
- 🏆 **Central na Copa**: durante a Copa do Brasil/Legends, card da CHAVE (fases com ≤4 jogos: quartas → final; placar só de fase apitada,
  fase que não chegou = "?") e ⚽ Artilheiros da Copa (top 3 de `copaScorersShown`, já anti-spoiler). Supercopa/internacional: não mostra.
- 🗂️ **Clube em 3 grupos**: 🏟️ Clube (estádio · loja) · 💰 Dinheiro (finanças · patrocínio) · 💼 Gestão (agência · presidência). Estádio
  continua a 1ª coisa.
- 🔴 **Bolinha com número**: Elenco = titular fora (lesão/suspensão) + titular 🥵/🚑 · Clube = recibo novo. Jogos segue com o pontinho.
- 🧭 **Rodapé da carreira: FICA COMO ESTÁ** (22/10, mockup `carreira-rodape.png` recusado: *"deixa como está tendo apenas a bolinha vermelha… qd tiver coisas p clicar"*). Não repropor redesign do rodapé.
- Ideia pendente: bolinha na Central (coletiva virou tela cheia, então não sobrou o que contar lá).

## 📰 Histórias do vestiário em tela própria + mais variedade (22/10) — NO BRANCH, esperando "publica"
Diego: *"fica o placar em cima, a história embaixo e mais coisas embaixo… muita coisa misturada"* e *"quero que tenha mais variedade
ainda de histórias"*. Mockup aprovado. Feito: evento de jogador (noitada/lesão/expulsão) e crise financeira abrem POR CIMA de tudo
(portal, fundo escuro, selo "📰 Notícia do vestiário" / "🚨 Aviso da diretoria", "1 de N avisos"); cartinha antes da história e
"O que você faz, presidente?" na noitada. Mesmos botões e ações. Histórias: noitada 10→25, expulsão 8→22, lesão 9→25, desgaste 5→15
(PT e EN do mesmo tamanho; zoeira leve e inventada). Bancada: `scripts/teste-evento/?tipo=noitada|lesao|expulsao`.

## 🕵️ Sondar à vista (22/10) — FEITO NO BRANCH, esperando "publica" do Diego
Diego: *"a área de sondar técnico… não está muito clara… tem que estar em algum lugar melhor"*. Mockup aprovado (*"ok pode fazer
mas mantém regra de over, categoria e etc. se mostra ou não"*). Feito: a janela antes do leilão ABRE no Sondar (1º passo, com
"Agora não → vender reservas"); dois cartões 🧢 Técnico / ⚽ Jogador com 0/1 e quantos estão sem contrato; tocando, a LISTA direta
(sem abrir clube por clube), filtro 🆓 sem contrato / todos. Regras iguais: técnico de outro clube só com o NOME; jogador só se o
olheiro alcança (`sondarLiberado`), também só o nome; 1+1 por temporada; trava no reducer. Central Legends ganhou o aviso "a janela
vai abrir" da rodada 33 em diante (só aviso, sem botão — marcar fora da janela não foi testado). Bancada: `scripts/teste-sondar/`.
Na mesma conversa: a carreira perdeu gente desde set/out (temporada de 10 → 16 min, fichas/nuvem em 05/10, metade das carreiras
novas para na 1ª temporada). Ideias levadas pro Diego, nenhuma aprovada ainda: Carreira Online pra todos, rival no jornal, Copa das
Carreiras, meta da diretoria pelo tamanho do elenco, verba de reconstrução pra quem termina lá embaixo.

## ⚽ Motor novo: GOLEADA EXISTE (22/10, 2ª rodada) — SÓ NO BRANCH, esperando OK pra publicar
Diego: *"não dá pra ter goleada então… tem momento que pode ter goleada, como tem momento que pode ser 1-0"*. Medido antes: numa liga
misturada alguém fazer 4+ gols era 0,7%. A causa: cada gol custava ~6,5 s de tela (todo mundo voltando a pé pra saída) — num 5×0, 1/3
do jogo parado. Feito:
- 📺 **Corte de TV depois do gol**: o "GOOOOL!" já cobre o campinho; quando ele sai, o time está arrumado pra saída (igual ao início
  do jogo e ao intervalo). A saída continua com todo mundo no seu campo.
- 🌞 **Dia do time** (`DIA_DO_TIME`): em 60% dos jogadores o dia é o mesmo do time, sempre DENTRO da faixa lo–hi de cada um.
- 😵 **Time abalado** (`ABALO`): tomando 2+ de diferença, marca/posiciona/decide pior (goleiro também).
- 📣 Perdendo no 2º tempo, o time sobe o bloco (+1 na tática).
- Medido (300 jogos): liga misturada 2,3 gols · 1×0 22% · alguém faz 4+ 6% · 5+ 1,3% · lenda × profissional até 7×0, 5+ em 14% ·
  craque × bom até 6×0 · trava `npm run motor2` ok (parecidos 1,96, forte ganha 80%).
- ⚠️ Mudança VISUAL (o recomeço depois do gol): mostrar pro Diego jogando antes de liberar pra mais alguém.

## ⚽ Motor novo: placar pela FORÇA dos dois times (22/10) — SÓ NO BRANCH, esperando OK pra publicar
Resposta do Diego à média de 1,5: *"não quero que seja uma coisa travada… time muito bom com time muito ruim pode ter goleada,
5-0, 4-0, 5-1. Jogo muito difícil pode ter empate, menos gols. Real em relação aos dois times"*. Feito:
- **Duelo atacante × goleiro** (`DUELO_GK`): o craque contra goleiro fraco faz de qualquer lugar; o fraco contra o paredão quase não faz.
- **A distância pesa pelo chute de quem bate**: pro perna-de-pau, chute de longe vira tiro de meta; pro craque continua perigoso.
- **Craque bate de primeira e de mais longe** (`CRAQUE_PRIMEIRA`, alcance até 35 m); o fraco precisa ajeitar antes.
- **O nível aparece no passe e no domínio** (`ERRO_PASSE`, `DOMINIO`), **na leitura do passe rival** (`LEITURA`), **na visão de
  quem passa** (`CEGUEIRA`: o fraco força passe e entrega) e **no bote** (`BOTE`).
- Depois do gol, só 2 vão abraçar e o resto já volta correndo; a comemoração vai na direção do próprio campo.
- Medido (300 jogos cada): parecidos 2,0 gols, 1×1 o mais comum, 31% empate · forte × médio 1,6×0,5, até 6×0 · lendas × fracos
  2,1×0,2, 34% com 3+ gols de diferença, 4×0 em 11%, até 5×0 · fracos × fracos 1,3 gol, 0×0 em 24%.
- ⚠️ Limite que não sai no ajuste: em 1:30 de tela cabem ~3,5 chutes por jogo (a bola anda na velocidade de verdade). Por isso o
  chute de time BOM ainda entra muito (~58%); o que mudou é que agora depende de quem chuta e de quem defende.

## ⚽ Motor novo: juiz, zaga e finalização (21/10)
Pedido dele depois da análise de uma partida inteira: *"faça 2 3 e 6"*.
- **6 · finalização**: o chute de longe entrava 54% das vezes (igual ao de dentro da área). Causa: o chute no canto passava fora do
  alcance do goleiro, de qualquer distância. Agora o alcance do goleiro cresce com a distância do chute (`LONGE_GK`, `PULO_LONGE`)
  e a mira de longe abre mais (`MIRA_LONGE`). Medido: <11 m ~80% · 11–22 m ~70% · 22 m+ ~30%.
- **3 · juiz**: faltas 1,5→2,9 · amarelos 0,09→0,36 · vermelhos 0→0,03 · laterais 0,05→1,1 · escanteios 0,7→0,6 (`FALTA_*`,
  `AMARELO_BASE`, `DESVIO_LATERAL`, `DESVIO_ESCANTEIO`, `CORTE_ESCANTEIO`, empurrão na bola alta).
- **2 · zaga/laterais/goleiro**: recuo pro zagueiro sob pressão, lateral que ultrapassa pede a bola, goleiro comum sai curto,
  mais cruzamento (`SAIDA_TRAS`, `RECUO_MAX`, `LAT_APOIO`, `GOLEIRO_CURTO`, `CRUZA`). Ganho pequeno: laterais 5%→8% dos passes.
- ⚠️ **O preço**: em 1:30 cabem ~3,5 chutes por jogo. Com o chute de longe entrando pouco, a média caiu de **2,0 para 1,5 gol**
  (a trava `npm run motor2` ainda passa, no limite). Perguntei ao Diego se aceita ou se prefere voltar pra 2 com o chute de longe
  entrando mais. O tempo morto depois do gol (7 s) foi medido e NÃO resolve: ganharia só ~0,1 gol.

## 📺 Motor 2D v2 (experimental, SÓ NO BRANCH `claude/pontosafe-repo-setup-qzjo89`) — calibração do jogo corrido (20/10)
Decisão do Diego: *"quero o jogo igual tá sendo hoje… sem ser lances"* → formato B (bola rolando os 93' em 1:30 de tela), formato
A (lances, estilo FM) descartado. Calibração feita e medida (diário completo em `docs/motor-2d-v2.md`, seção 11): de 0,03 pra
**~1,0 gol/jogo**, 0×0 de 98% pra ~30%, ~3,8 chutes (80% no gol), passes 82%, ~1 falta, ~1 escanteio, forte ganha ~70%.
⚠️ **Teto estrutural medido**: em 90 s a bola voa ~55 s entre passes e fica ~15 s parada → 12–13 posses por jogo → 4–6 chutes é o
máximo com velocidade de gente. Pra ter 2–3 gols por jogo (como o v1, que recebe o placar pronto) só com alavanca "de jogo":
goleiro mais batível, chute de fora valendo mais ou relógio do 2D mais lento — **perguntar ao Diego** (uma frase, sim/não).
✅ **Lendas uma a uma (20/10, *"não precisa montar, já pode fazer"*):** as 186 lendas agora têm 1ª marca (185; só o Zagallo
fica neutro, com a 2ª marca "volta pra marcar"), golpe-assinatura (183) e **2ª marca** (143) em `campo2d-estilos.ts` — só fato
conhecido, nunca chute. No v2 a 2ª marca entra com metade do peso nos atributos e nas tendências (`atributos.ts`). Gol não é
número fixo (ordem dele): depende do goleiro (trocar o goleiro rival de profissional pra lenda: 0,85 → 0,55 gol sofrido), do
elenco (lendas × profissionais 1,6 × 0,07, 55 vitórias em 60), do gás e das marcas de cada um.
📌 **A vaga do campinho é lei** (20/10, ordem dele): o motor segue a ordem da escalação do usuário; só time de bot é escalado pelo
jeito do jogador. Individualidade (20/10, 2ª passada): quem gosta de driblar segura a bola, enxerga o marcador mais longe, vai PRA CIMA dele
(alvo 2,5 m além do rival) e o duelo acontece no contato; o time procura o craque (passe pro melhor jogador vale mais). Romário no
meio: 1,2 drible · 0,8 chute · 0,3 gol por jogo. ⚠️ Teto estrutural: num jogo de 1:30 cada jogador pega a bola ~3 vezes (o
Ronaldinho fica 0,8 s com ela por jogo), então a marca da lenda aparece na TEMPORADA, não em cada jogo.
✅ **(21/10) BUG: CARREIRA NOVA ABRIA NO PREGÃO ABERTO** (print de um amigo do Diego: *"carreira é sempre o envelope padrão… misturou
coisas da sala online pro carreira"*). Causa: começar carreira não zerava a marca `pregaoAberto`/`holandes` do jogo rápido anterior.
Conserto em 3 camadas: toda carreira nova nasce com pregão aberto/Tocaia desligados · o leilão da carreira nunca abre os dois
(`!state.careerOnline` em `startAuctionPhase`) · save de carreira que já nasceu assim é curado ao abrir (`sincronizaNiveis` tira a marca
e, se estava no pregão, reabre no envelope). Testado: rápido de pregão aberto → carreira nova = envelope.
   ➕ Mesmo dia, *"poden"*: TODA escolha de partida rápida/sala online é zerada no começo da carreira (`MARCAS_DE_MODO` +
   `limpaMarcasDeModo` no store: pregão aberto, Tocaia, tempo do leilão, 2D da sala, Liga Draft, sem bots, duplas, dinastia, copa
   regional, Bafo, senha…). Trava `npm run carreira-limpa` reprova escolha nova de modo que a carreira não zera.
✅ **(21/10) Comunidade do zap virou PROPAGANDA FIXA no telão** (`esc_anuncios_fixos` id 6, ordem 6, com o link da comunidade) e o
Super Chat dele sobre a comunidade (recado id 7) saiu do ar. Diego: o Super Chat fica *"como sempre foi"*, sem link — a 1ª tentativa
(Super Chat com link) foi desfeita no mesmo minuto.
✅ **(21/10) CAMPINHO 2D — APROVADO (*"aprovado, faça tudo no meu"*), só na conta do Diego:** 🌙 noite com refletores (30%,
`noiteDoJogo`) · 🌱 gramado pelo estádio do MANDANTE da carreira (terra da várzea → perfeito, `estadioNoCampinho`) · 🏟️ torcida
pela lotação construída (cadeira vazia aparece) · 🌍 Copa do Mundo com a cor de cada seleção no 2D · 🧑‍💼 presidente na beira do
campo (o boneco da conta, do lado do SEU time, pula no gol) · 🎬 replay dos gols depois do apito, botão verde, só fora do online.
Bot em casa e os outros modos = gramado perfeito e casa cheia, como antes. ⏳ Presidente na beira do campo nas SALAS (de cada um)
ainda não: hoje só o do próprio time, na tela de quem joga.
✅ **(21/10) Placas: a marca segue o padrão da Tidex** (`tamanhoMarcaNaPlaca`): todas miram a largura da Tidex e a mais quadrada
cresce até 92% da altura — Vadico e OittoLabs ~30% maiores, Tidex igual. Vale nas placas atrás do gol e nas laterais (pra todos).
✅ **(21/10, sala de duplas do Futpoint) PUBLICAR NÃO DERRUBA MAIS NINGUÉM + PARCEIRO DE DUPLA NÃO É MAIS TIRADO DA SALA.** Causa:
2 publicações seguidas (22h46 e 22h52) → todo mundo recarregou → o parceiro de dupla, ao voltar, não achava o time (o `seatUids` só
tem os donos) e era apagado do `room_players`. Feito: sem recarga automática nenhuma, deploy mantém a versão anterior no ar 3 dias,
`assentoDoCracha` acha o parceiro pela dupla. ⏳ Conferir no 1º deploy que o passo "Mantém a versão anterior no ar" imprimiu
"N arquivos… mantidos" (o ambiente do Claude não alcança o site, só testei contra uma cópia local: 215 arquivos, 13 MB).
✅ **MOTOR NOVO NA CARREIRA — FASE 1 FEITA (20/10, só a conta do Diego):** decisão dele = motor novo na carreira offline, carreira
online e partida rápida; salas online/Minhas Ligas seguem no teatro. Feito: a LIGA da carreira solo — o jogo de cada técnico de gente
é decidido pelo motor v2 (`motor2/carreira.ts`, gancho em `simDivTo`), a partir do próximo jogo de quando liga (`motor2Desde`); a troca
do intervalo vale no motor (`trocaTime`, 1º tempo idêntico); o campinho anima o mesmo motor (`elencos.m2`). Provado numa temporada
inteira: rodadas antigas iguais, jogos de bot iguais (29/29), placar = campinho em 28/28. Custo: ~80 ms por jogo novo; ao abrir uma
carreira no meio da temporada, ~2,3 s na 1ª conta (depois fica na memória).
✅ (21/10) o DIA do jogador pesa pros 22: faixa inteira lo–hi + forma ±8% (dia ruim 23% de vitória · bom 56%, mesmos times).
✅ (20/10) média de gols do motor novo subida pra perto da simulação (bots seguem nela): parecidos 1,9 · forte×médio 2,2 · lendas×profissionais 2,6, com goleada quando um time é muito melhor.
✅ (20/10) o motor novo usa o nível do DIA (faixa lo–hi), o cansaço na técnica, o técnico e o evento da rodada. Partida rápida FICA no
teatro (decisão dele).
✅ **FASE 2 — COPAS FEITAS (21/10, só a conta do Diego):** Copa Legends, Copa do Brasil, Supercopa, Libertadores/Champions/Mundial
e Copa do Mundo da carreira: o jogo do seu time é decidido pelo motor novo e o campinho anima o MESMO motor. Regras: a conta antiga
roda antes (dado do torneio gasto igual — jogo de bot só muda se o SEU resultado mudou quem passou de fase); pênalti de confronto que
o motor novo empatou sai de dado próprio; nas copas nacionais só liga se o motor já estava ligado ANTES da copa começar
(`m2Copa`); internacional e Copa do Mundo ficam CARIMBADAS quando nascem (campanha congelada / `emAndamento.m2`), e com o motor novo
a Champions anda com dado próprio (a sua Liberta não reembaralha a Champions). Provado: placar = campinho em 23/23 (copas nacionais),
15/15 (internacional), 15/15 (Copa do Mundo); jogos de bot iguais quando o chaveamento é o mesmo. Gol contra não conta pra
artilharia. 🐛 De carona: a Copa do Mundo da carreira ignorava o próprio carimbo na 1ª abertura (potes/peso novo só valiam depois de
um F5 — a Copa podia trocar no meio); agora a 1ª vez e o F5 dão a mesma Copa.
🌐 **(21/10, PUBLICADO junto do conserto das duplas):** carreira online v2 com o motor novo. Quem comanda a sala (e só
se a conta dele tem o motor novo) carimba `mundo.m2 = temporada` no preparo; todo aparelho lê o MESMO carimbo e liga junto da rodada 1
dessa temporada em diante (liga, copas, internacional, Copa do Mundo). Falta testar com 2 aparelhos antes de publicar.
✅ (21/10, no branch) resultado do motor novo GUARDADO NO SAVE (`m2Res`, sobe pra nuvem junto): o mesmo save no celular e no PC
mostra o MESMO placar (Diego: *"às vezes joga pelo telefone… às vezes o mesmo save pelo PC… não pode ter erros"*), reabrir a carreira
não refaz os jogos e ajuste de motor publicado não muda placar já visto. Fica a temporada atual e a anterior (~90 bytes por jogo).
Testado: aparelho 1 calcula e grava; aparelho 2 lê do save sem recalcular. ⚠️ Caso raro: jogo calculado numa versão e ASSISTIDO
noutra (recarregou no meio da rodada logo depois de uma publicação) — o placar que vale é o guardado; o campinho poderia desenhar
outro lance.
✅ (21/10) pênalti decisivo manual FICA no motor novo (*"sim mantém"*): convertido soma 1 gol por cima do placar do campinho.
⏳ **FASE 3 (falta):** testar a carreira online com 2 aparelhos.
🚪 **PORTA DE ENTRADA NO JOGO (decisão do Diego, perguntada em 20/10):** hoje o campinho ENCENA o placar que a simulação da liga
já decidiu (v1). O motor novo decide o placar sozinho. Então, pra ele entrar no jogo de verdade, o placar das partidas em 2D passa a
SER o que acontece no campinho (liga, copas, online — tudo que o v1 desenha hoje), ou o v2 fica só de bancada. Sem essa resposta
não tem integração — não ligar o v2 em nada do jogo por conta própria.
Goleiro: diferença profissional × lenda vale ~0,35 de chance de defesa (0,80 × 0,33 gol sofrido, mesmo time na frente).
✅ (21/10) `npm run motor2` agora REPROVA se o placar sair da faixa calibrada (gols 1,5–2,7 · 0×0 ≤ 15% · forte ≥ 60%).
Pendente: ligar o v2 na bancada visual e FILMAR
(`scripts/teste-campo2d/v2.html`) antes de qualquer foto pra ele; nada vai pra main. ✅ Clima visual (sol/nublado/chuva) APROVADO (21/10, *"ok siga"* depois da foto).

## 🏀 BidLegends NO AR (20/10) — só na conta do Diego (BASQUETE_TESTERS)
Diego: *"já pode [pôr] o basquete pra eu ver como tá, trocando a aba lá em cima do futebol pelo basquete"*. O branch
`claude/bidlegends-fase-1-7vtrzu` recebeu a main (90 commits: Carreira Online v2, Liga Draft…) e foi pra main. Conflitos
resolvidos juntando os dois lados (saf2On com `!s.co2` E sem basquete; START_ONLINE com `fracoInicial` + Liga Draft + o
basquete; autosave da pirâmide pulando basquete E co2). **Liga Draft escondida no basquete** (usa baralho de futebol).
Na home do futebol, a conta liberada vê a etiqueta **"🏀 IR PRO BIDLEGENDS"** embaixo da marca (no cabeçalho não cabia:
quebrava a marca e MINHA CONTA no celular); a home do basquete volta pelo ⚽. Pra todo o resto a home é a de sempre.
Testes: todos os que passam na main passam aqui; os 9 que já falham na main (mascote-botao, tracos, elenco27, mascote,
giro, ritmo, copamundo, holandes, relogio) seguem iguais — não são do basquete.
Consertado no caminho: começar carreira de basquete zerava cestinhas e não assistências (`npm run artilharia`).

## 🏀 BidLegends: carreira solo = economia do futebol — REAPLICADA SOBRE A MAIN (19/10)

**Contexto (importante pra outras sessões):** a branch `claude/bidlegends-fase-1-7vtrzu`
estava com HISTÓRIA SEPARADA da main (sem ancestral comum) e ATRASADA ~177 mil linhas de
futebol. Ela tinha a economia do basquete (Fatias 0–4) mas apagaria o futebol novo se fosse
pra main. Decisão: **recriar a branch a partir da main de hoje** (backup da antiga guardado em
`origin/backup/bidlegends-economia-ca33ac63`) e **reaplicar só a economia do basquete por cima**.
Assim o futebol fica INTOCADO (é a base). Reverter = apontar pro backup.

**FEITO (núcleo, commit `45268924`):** carreira do basquete agora usa `careerOnline=true` (a
mesma máquina de economia do futebol: caixa, folha, prêmios por colocação, patrocínio, estádio,
extrato). A SIMULAÇÃO segue a própria do basquete (EscSeason) — o roteador (index.tsx) bifurca por
esporte. `tierDivKey` mapeia andar→divisão (street=D, gleague=B, nba=A) e liga as tabelas de
economia de graça. Travas `sport!=='basquete'` em PLAY_ROUND/SET_TACTIC/FINISH_SEASON/SET_LINEUP/
CHANGE_FORMATION/SEED_CPU_SQUADS + autosave do futebol: **todas inertes pro futebol** (byte-idêntico).
Save do basquete isolado em `bl-nba-career`.

**FEITO (arte da arena):** `StadiumSvg`/`StadiumTab`/`estadiodata` ganharam `bb` → QUADRA de madeira
(garrafão, lance livre, aros dourados), nome de ARENA no lugar de estádio, telão "CESTA!/88", e a
LENDA da agência destrava pela ARENA 100% (não pela SAF, que o basquete não tem). Tudo com default
`bb=false` → futebol idêntico. Builda limpo.

**FEITO (tela 🏢 Clube, commit `b814f265`):** BbClubeOverlay (pyramidseason.tsx) com 3 abas que
funcionam 100% — 🏟️ Arena (StadiumTab bb, investir/construir a quadra), 💰 Finanças (extrato/caixa),
💼 Agência (cartas ganhas + renda; LENDA destrava pela arena 100%). Botão 🏢 Clube no EscSeason só no
basquete solo. Reusa os componentes do futebol com `bb` (default false → futebol idêntico).

**FEITO (CARREIRA ONLINE do basquete, commit `41c120f0`):** a sala de basquete ganhou o modo 🌐 Carreira
(só testers; basquete já é da conta do Diego). START_ONLINE semeia a economia por andar + crews da Street
League; NEXT_NBA_SEASON_ONLINE (host-autoritativo) avança a temporada, sobe de andar com SEGURANÇA DE
ASSENTO; fim de temporada = host avança, convidado espera. Lobby: aba 🌐 Carreira no basquete, config
football-only escondida. Tudo guardado por `nbaCareerRoom`/`onlineNba` (false no futebol → byte-idêntico).
⚠️ **NÃO TESTADO AO VIVO** (online precisa de Supabase realtime + 2 aparelhos) — precisa do teste do Diego.

**VALIDADO OFFLINE (Playwright headless):** home do BidLegends + começar carreira + leilão inteiro (PG/SG,
cartas reais da NBA, lendas, pote crescente) = **0 erros de console**; economia certa (caixa 50, posições
PG/SG/SF/PF/C). A quadra (StadiumSvg bb) renderizada e aprovada pelo Diego (19/10).

**FEITO (👕 Patrocínio, commit `ac12cde5`):** aba 👕 Patrocínio no BbClubeOverlay com o MESMO Patrocinador
Master do futebol (MasterBanner — 4 papéis, meta, renovação por ligada). Paga pela divisão do andar
(tierDivKey: Street=D sem marca, G League=B e NBA=A pagam); cai no caixa na virada (applyMasterIncome, que
já roda pro basquete). Motor intocado — SET_MASTER/MASTER_RENOVAR/MASTER_MERCADO já valiam com careerOnline.
⚠️ As marcas são as paródias do futebol (placeholder) — marcas com cara de NBA são conteúdo do Diego ('não inventar').

**FEITO (🏛️ 2º Clube, commit `8c31a62d`):** o basquete ganhou o 2º clube no modelo pré-SAF (compra direta,
4.000 🪙, Lenda — o basquete não tem SAF). Os dois clubes jogam a MESMA liga de 20; comanda um por temporada,
o outro dorme; troca no fim (SWITCH_MULTICLUBE). saf2On ganhou exceção pro basquete; NEXT_NBA_SEASON pina os
DOIS clubes no mesmo assento ao subir de andar (caminho de 1 clube fica byte-idêntico). Aba 🏛️ 2º Clube no
overlay + botão de troca na tela de fim. Reusa as ações testadas do futebol.

**VARREDURA (19/10) — 3 auditorias (texto · modos futebol × basquete · home/nav/bilíngue). CONSERTADO:**
- 🧹 **Lobby não mostra NEM aplica config de futebol no basquete** (commit `4ad2f633`): tipo de leilão
  (Jogador/Clubes), formação 4-3-3/4-4-2 e o seletor de baralho somem no basquete; "Depois da liga" vira
  card de PLAYOFFS. MOTOR: START_ONLINE **sanitiza o copaMode do basquete** (nunca roda Libertadores/
  Champions/Copa do Mundo, mesmo que o game_state mande). Carreira online agora aparece no card de criar
  sala NOVO também (antes só no modo-aba).
- 🧹 **Textos "futebolês" fora das telas de basquete** (commit `8598e8a7`): Série D→Street League,
  estádio/SAF→arena (o basquete não tem SAF), Patrocínio mostra o ANDAR (Street/G League/NBA) no lugar de
  "Série D/B/A", e o aviso de "G4/zona de rebaixamento" vira "TOP 4 = subir de andar" (basquete não rebaixa).
- 🧹 **Botão MEU ÁLBUM na home** (commit `db5ca916`): a home prometia álbum e não abria — agora abre.
- ✅ **Bilíngue OK**: a auditoria não achou texto PT-only nas telas de basquete.
- ✅ **Features só do futebol (Central, Coletiva, Presidente, Copas internacionais, Kings, roteiro de fim,
  pirâmide de 4 divisões) estão TODAS bem trancadas** — o basquete nunca entra no pyramidseason.

**✅ HOME DO BIDLEGENDS = IGUAL À DO FUTEBOL (19/10, commit `a752313d`, OK do Diego).** Diego cobrou DUAS
vezes que a home tinha que ser EXATAMENTE a home ilustrada do futebol (ll-home, arte cinematográfica), só com
conteúdo de basquete — *"não é pra mudar visual, não é pra mudar nada"*. `BidLegendsHome` (screens.tsx) agora
é uma réplica fiel de `HomeIlustradaDiego`: mesmo header (marca BIDLEGENDS / "NBA ÀS CEGAS", BR/EN, ⚽ volta
pro futebol, MINHA CONTA), mesma arte de fundo (a do futebol **por enquanto** — ainda não há arte de basquete,
OpenArt sem crédito), 3 modos (Partida Rápida · Jogar Online · Modo Carreira "Street League à NBA"), **Loja do
Clube + Amigos** (tinham ficado de fora) e Salão · Regras · Álbum. Só a conta do Diego vê (BASQUETE_TESTERS).
- ✅ 19/10: **arte de fundo própria do basquete** (o Diego mandou): `img/home-bidlegends-v01.webp` (900px, ~200 KB,
  só baixa quem abre o basquete — classe `.ll-home-bb`). A arte é EM PÉ (a do futebol é deitada), então no celular
  ela desenha com 660px de altura pra lustre/vitrines/martelo caírem nas MESMAS alturas do futebol; a sobra dos lados
  é a própria arte desfocada. Consertado junto: o botão ⚽ ficava escondido embaixo do 🔇 (som é fixo na tela).
- ⚠️ A arte tem o **logo oficial da NBA** (bandeiras e cartas). Avisado ao Diego: ok enquanto só ele vê; antes de
  liberar o basquete pra todos, trocar por versão sem o logo.
- ✅ 19/10 (2ª varredura, 19 achados): CONSERTADO — (1) o convite "COMECE UMA CARREIRA" no fim da partida
  rápida abria a carreira de FUTEBOL com o save marcado basquete → some no basquete; (2) campeão do basquete
  (liga, NBA Cup, playoffs) ganhava carta do baralho de FUTEBOL → sem carta até existir o álbum da NBA; (3) o
  autosave do basquete não via obra/patrocínio/2º clube/caixa (mudança no 🏢 Clube se perdia) → entra na
  assinatura; (4) LARGAR apagava a carreira sem perguntar → confirma; (5) textos: fim de temporada (Playoffs, sem
  "Rebaixado"/🪦, "Fora dos playoffs", "💍 CAMPEÃO DOS PLAYOFFS"), revelação "Seu quinteto", Monte "time completo"
  no lugar de "os 11", prêmio "Tijolo no quinteto", extrato "Obra na arena", aba Arena sem "estádio"/"Z4" e
  Gramado → "🪵 Piso da quadra", ligas "cestinha", e o painel "Trocar o modo" da liga sem baralho BR/EU e sem Clubes.
  Tudo guardado por `bbEnd`/`state.sport`/`bb`/`nbaSala` → futebol idêntico. Testes ok: monte cartinha pernadepau
  sala fim telas saf2 master-historia jornal.
- 🏀 FALTA (decisão do Diego, mexe em coisa compartilhada com o futebol):
  · ✅ **Álbum da NBA (19/10)**: gaveta PRÓPRIA no banco (`user_cards_nba`, `docs/sql/bidlegends-user-cards-nba.sql`) —
    o futebol nunca lê. O pacote do campeão do basquete (liga, NBA Cup, playoffs; offline e online) sorteia do
    baralho da NBA (`nbaPool`, sem repetir o que já tem) e grava lá (`CardCollectPrompt nba`). `EscAlbum` virou
    porteiro: basquete → `EscAlbumNba` (mesma cara, contador /432 lendas, sem Coleções/Trocas), futebol →
    `EscAlbumFutebol` (o de sempre). Na carreira a carta entra na 💼 Agência (`agenciaNba`, chave = bilhete).
    FALTA: perfil de outro técnico no Ranking mostra só cartas de futebol (o basquete não tem ranking ainda).
  · ✅ **REGRAS do basquete (19/10)**: `ManualDoTecnico bb` (home do basquete) — 50 moedas, PG·SG·SF·PF·C, quinteto,
    sem empate (prorrogação), Street League só pontos corridos, top 4 sobe, ninguém cai, G League/NBA com Playoffs e
    NBA Cup, banco 10→15. Tudo conferido no código (`NEXT_NBA_SEASON`, `simMatch`). As Dúvidas (FAQ) ficaram de fora
    no basquete (são de futebol).
  · ✅ **O MARTELO e COMPARTILHAR no basquete (19/10)**: "🏀 O DIÁRIO DO BIDLEGENDS", pós-temporada no lugar de Copa dos 8,
    CESTINHA/pontos, sem frase de rebaixamento nem de "primeiro de fora" (vaga é por conferência). Imagem/texto de
    compartilhar com BidLegends/NBA, V-D sem empate, cestinha. ⚠️ O link que vai junto ainda é o leilaolegends.com —
    trocar pro bidlegendsarena.com quando o basquete for liberado (hoje ninguém além do Diego veria o basquete lá).
  · ✅ Zoeira do Monte online no basquete: 🧱 Tijoleiro e 🤡 Rei do air ball. Final dos playoffs mostra JOGOS na série.
  · ✅ **Minhas Carreiras do basquete + nome do time (19/10)**: `NbaMinhasCarreiras` (screens.tsx) = a MESMA tela do
    futebol, com o ANDAR no lugar da Série; ➕ abre o passo do NOME (pré-preenchido com o nome da conta, checado no
    `nomeLivre` — batismo alheio não passa; NÃO troca o nome da conta, que é do futebol). Guardar/trocar/apagar em
    `nba-carreiras.ts` (ativa `bl-nba-career` + arquivo `bl-nba-career-archive`, grava antes de apagar; aparelho
    cheio = não troca e avisa). Cada carreira ganhou código fixo `nbaCareerId` (a seed muda por temporada). Fichas:
    a MESMA régua do futebol (`careerSlotLimit`), contada SÓ entre carreiras de basquete — ou seja, quem é grátis tem
    1 de futebol E 1 de basquete (Diego aprovou a tela em 19/10; contar separado foi decisão minha — ele pode mudar). LARGAR saiu da home (apagar = 🗑️ em dois
    toques na lista). Trava: `npm run nba-carreiras`.
  · ⏸️ Salão dos Batismos / Loja / Amigos: **o Diego AINDA NÃO DECIDIU (19/10)** se cada jogo terá os seus ou se são da conta. Até lá ficam como estão (os mesmos do futebol) — não mexer nem perguntar de novo; esperar ele trazer.

**FALTA / PENDENTE DE TESTE:**
- ✅ **PARTIDA RÁPIDA DO BASQUETE COM TELA DE AJUSTES (19/10)**: antes o botão começava direto (3 rivais, envelope).
  Agora passa pela MESMA `EscSetup` do futebol: tipo (Jogador/🧱 Clubes da NBA), jeito do lance (Envelope/Tocaia/
  Pregão aberto), nome do time e rivais (3·5·7·9; 7+ = Playoffs, a régua do START_NBA). Saem Kings, baralho, "depois
  da liga" e formação. Sem a tela de regras (ela usa exemplos do futebol — Romário, Kaká; as salas de basquete já
  pulavam). ⚠️ Lição: na tela de ajustes o esporte vem da ESCOLHA da home (`useSport`), NUNCA do `state.sport` — ele
  guarda a partida ANTERIOR e no 1º teste a home do basquete abriu uma partida de futebol.
  ✅ Tela de regras do pregão no basquete (19/10, Diego: "regra pode fazer"): a Partida Rápida passa pela `EscStreamIntro`
  com cartas DA NBA (Marcelinho Huertas no envelope; Nash/Lin/Raul Neto na Tocaia). No baralho da NBA cada jogador
  tem UMA carta, então a lição "mesmo jogador, dois níveis" (Kaká) virou "🎭 O nome engana": Magic Johnson (Lenda) ×
  Jeremy Lin (Linsanity = Folclórico). As salas online de basquete continuam pulando essa tela.
- ✅ **MODOS ONLINE DO BASQUETE (19/10, Diego: "de resto já pode criar todos os modos do online")** — auditoria +
  conserto. Rápido e Minhas Ligas com os 3 jeitos de lance: ✉️ Envelope ok · 🐊 Tocaia ok (abre em 50; os textos
  diziam 100) · 🔨 **Pregão aberto LIGADO** (a sala oferecia e o START_ONLINE desligava calado — rodava envelope).
  Motor conferido com a NBA: fila e sobras saem do ACTIVE_CATALOG, nunca entra jogador de futebol (trava nova
  `npm run pregao-aberto-nba`: 4, 10 e 16 times). Tela do pregão com PG/SG/SF/PF/C e "Seu quinteto". 🤝 Duplas
  ok, agora com as posições da NBA na escolha. Sala de basquete não leva mais marca de Copa do Mundo/regional/
  várzea/clubes de uma sala de futebol mexida antes, e a tela final nunca abre a Copa do Mundo no basquete.
  Partida Rápida offline do basquete não herda mais o jeito de lance da última partida de futebol.
  Fora do basquete (são do futebol): Copa do Mundo, Libertadores, Champions, Kings League, Bafo.
  🧱 **Leilão de Clubes com franquias da NBA — FEITO (19/10, Diego: "quero da NBA"), esperando o OK visual.** Pacote =
  POSIÇÃO de uma franquia ("🏀 Armadores dos Lakers" · "Lakers Point Guards", `nomePacote`). Memória de "franquias que
  já saíram" PRÓPRIA do basquete (`bl-clubes-recentes-v1`, só no aparelho — não suja a do futebol nem a do servidor).
  Convocação (`convocacao-clubes.tsx`) agora lê as vagas da MESMA régua do motor (`vagasBase` = `baseSlots`): 1 por
  posição no basquete, com PG/SG/SF/PF/C e uma quadra de madeira no lugar do campo. Opção liberada na sala de basquete
  (Rápido e Minhas Ligas). `START_NBA` aceita `clubes` por dentro (sem botão offline). Trava `npm run clubes-nba`:
  4, 10, 16 e 20 times fecham o quinteto só com NBA, sem repetir jogador, sem tapa-buraco.
  ❓ O Diego perguntou se o basquete tem baralho Europa/Mundo: NÃO — só a NBA (432 cartas, ~30 franquias). Fazer
  EuroLeague/FIBA = cartas novas de gente real (lista por lote, com aprovação dele). Ele acha que o público dos EUA
  conhece mais a NBA; ficou de decidir.
- ⏸️ **CARREIRA ONLINE DO BASQUETE: ESPERAR A DO FUTEBOL (19/10, ordem do Diego).** Palavras dele: *"eu ainda tô
  construindo lá no do futebol. Quando eu terminar do futebol, aí você faz aqui no basquete também"*. A do futebol
  está sendo refeita (Carreira Online v2 na main: sala, clube, dono/vice/comandante do dia, PRONTO). A versão do
  basquete de hoje (commit `41c120f0`, `NEXT_NBA_SEASON_ONLINE`) foi feita em cima da carreira online VELHA — **não
  mexer nem testar até a v2 do futebol fechar**; aí refazer o basquete copiando a v2.
- ~~Teste de 2 aparelhos da carreira ONLINE do basquete~~ → espera a v2 do futebol (nota acima).
- **Teste em jogo** do Patrocínio e do 2º Clube offline (eu valido só até o leilão; a partir do Monte o
  harness headless não navega — mas as duas abas reusam componentes do futebol já aprovados).
- **Marcas de patrocínio com cara de NBA** (conteúdo do Diego).
- Varredura final "tudo igual ao futebol": conferir modo a modo/aba a aba o que ainda falta.
## 🌐 CARREIRA ONLINE COMPLETA, ATÉ 20 AMIGOS (19/10) — ⏳ LEVANTAMENTO FEITO, esperando OK do Diego pra etapa 1
- Pedido: *"tudo que existe no modo carreira offline… tem que funcionar no modo carreira online… até 20 amigos"*.
- HOJE: a Carreira Online existe, mas só a conta do Diego cria (`CAREER_ONLINE_TESTERS`); 0 salas de carreira no banco. Sala já aceita 20
  (`MAX_PLAYERS`). Funciona: pirâmide (todos começam na D), leilão da virada, contratos/renovação, Copa do Brasil/Legends/Supercopa,
  dinheiro por clube, Master/fornecedor/estádio básico, Cria da Base, votação no fim da temporada, Copa do Mundo (cada um no seu aparelho).
- DESLIGADO no online (portão `onlineMode !== 'online'` ou `agenciaOn`, que o START_ONLINE nunca liga): Central, roteiro, Agência,
  gás/lesão/rodízio, técnicos/preparadores/olheiros, 15 formações, SAF nova, 2º clube, obras novas, Presidência, internacional, coletiva,
  coleções, ranking global, Banco Legends/Pix, bots com banco.
- ⚠️ DOIS BLOQUEIOS antes de ligar qualquer coisa: (1) o dono manda o ESTADO INTEIRO comprimido a cada mudança (até 2,5×/s) pra todos;
  carreira de 20 clubes ≈ 1,5–2 MB cru / 250–450 KB comprimido → passa do limite do canal (mensagem some e a sala trava, como a de 27
  da Champions) e estoura a cota; (2) várias ações da carreira solo mexem em `managers[youIdx]` (o time de quem está no aparelho): no
  online o reducer roda no DONO, então a compra do convidado cairia no time do dono (BUY_PREPARADOR, RENOVAR_TECNICO, ALICIAR_*…).
- 🔁 **19/10, regra do Diego: é um modo INDEPENDENTE** — nada da carreira online pode mexer nas salas rápidas, Minhas Ligas ou outro
  modo online. Então a base nova é um caminho PRÓPRIO (canal e tabela só dela; cada aparelho roda o PRÓPRIO clube como na solo e o servidor
  guarda o que é de todos: calendário, resultados, leilão), e o envio das salas de hoje fica intocado.
- ✅ **DECISÕES DO DIEGO (19/10, "ok pode começar"):**
  · o DONO da sala manda no tempo: começa a rodada, automático/manual, velocidade, pausa. Antes de cada rodada cada um tem um tempo pra
    mexer no time e aperta PRONTO; a partida roda igual pra todos, ao mesmo tempo. Cada um mexe SÓ no próprio clube.
  · SALVA SOZINHO, NA HORA, NA NUVEM DO JOGO (não no celular nem na nuvem do dono): cada clube tem a "gaveta" dele no servidor, ligada à
    CONTA de quem joga; mexeu no time → só aquela gaveta atualiza (pedaço pequeno, não o save inteiro de 1 MB). Sem botão de salvar, só
    "Sair". Entra em qualquer aparelho (celular, PC) com a mesma conta e está tudo lá. A solo NÃO muda (continua com o botão).
  · No dia seguinte: SÓ O DONO abre (regra da coroa). Todo mundo entra numa SALA DE ESPERA da carreira (igual Minhas Ligas), vê quem
    chegou, e o dono aperta "▶️ Continuar carreira". Quem faltou continua com o clube guardado e joga com a última escalação.
- ✅ **PROVA FEITA (19/10)**: o motor da solo é determinístico — 20 clubes, dois aparelhos só com os pedaços chegaram na MESMA temporada.
  Gaveta de 1 clube 4,4 KB · o que é de todos 0,3 KB · escalação da rodada 0,1 KB. Desenho completo: `docs/carreira-online-v2.md`.
- ✅ **19/10: mockups APROVADOS** (`carreira-online-espera.png` e `carreira-online-pronto.png`) + **VICE** igual ao das Minhas Ligas: o dono escolhe 1 vice;
  o vice só continua/manda no tempo quando o dono NÃO está; quando o dono chega, volta a ser dele; vice não apaga nem muda regra.
- 🔨 **19/10, etapa 1 em andamento**: banco feito e testado — tabelas `esc_carr_sala`/`esc_carr_clube`/`esc_carr_privado` + funções (criar,
  entrar, vice, presença, continuar, pronto, começar, apito, ritmo, encerrar dia). Teste das regras (dono/vice/convidado): `scripts/carreira-online/testa-regras.sql`.
  Falta: as telas (sala de espera e barra do PRONTO, mockups aprovados) + o motor rodando a rodada igual em todo aparelho.
- 🔒 **19/10, decisão do Diego**: *"carreira online só pra minha conta ainda… tem que ser igual a carreira que temos hoje em tudo, menos ter
  segundo clube"*. Então: **SEM 2º clube/SAF-2º clube** no online; TODO o resto da solo tem que existir. Antes de liberar pra qualquer
  um: lista completa do que a solo tem (`docs/carreira-online-checklist.md`) e cada item conferido + teste de 20 robôs.
- 🔨 **20/10: 1ª temporada de ponta a ponta (só contas do Diego)** — entrada no menu online "🌐 Carreira Online (nova)", sala de
  espera, leilão de estreia com todos (o dono calcula, os outros assistem e lançam), cada um passa a tocar o próprio clube, barra
  do PRONTO e rodadas no relógio do dono. Falta: a VIRADA de temporada (próxima), copas no relógio do dono, intervalo/pênalti.
  Situação item a item em `docs/carreira-online-checklist.md`.
- 🏢 **19/10: SAF no online = a REGRA ANTIGA, da SAF sozinha** (*"a saf na regra antiga qd tinha saf sozinha"*): filial na D, 50% dos
  prêmios, empréstimo, comissão e venda pelo `SELL_FILIAL` — nada da saf2 (venda pela divisão, assumir, 2º clube).
- PLANO proposto: 1) fundação — separar o que é de cada clube do que é de todos, mandar só o que mudou, teste com 20 robôs (só na conta
  do Diego); 2) ligar o que é POR CLUBE consertando as ações pra usar `mgrId`; 3) o que é de TODOS (internacional, ranking, coletiva);
  4) teste fechado com amigos e só então liberar. Mexe no envio do online → regra de 25/09: só com OK dele.


## 🤝🌍 Copa da sala com DUPLAS convocando o país errado (20/10, sala ZESM9K do Futpoint) — ✅ CONSERTADO E NO AR
- Causa: a Copa do Mundo/regional da sala achava o time de cada pessoa pelo `player_index` do banco, que estava desencontrado
  do time de verdade (Bonança: time 3 no jogo, número 5 no banco). Agora o assento sai do ESTADO da partida (`seatUids` +
  `duplas`, `quemAgePeloEstado` em dupla-copa.ts) e a renumeração da largada também desfaz par cruzado. Trava: `npm run dupla-copa-estado`.
## 🤖 Tema da Tidex na sala (19/10) — ✅ NO AR (mockup `scripts/mockups/tema-tidex-cel.png`, "tá aprovado")
- O dono do Wen Milan B (vittor@tidex) é dono da Tidex, patrocinadora do jogo. A conta dele tem 2 temas: 😈 Wen Milan B (o do
  Fundador) e 🤖 Tidex (azul-marinho + turquesa, grade de IA, logo embaixo, faixa "sua marca dentro das IAs"). Vale em sala rápida e
  Minhas Ligas. Código: `TEMAS_SALA.tidex` + `TEMAS_DA_CONTA` (temas-sala.tsx).

## 🤝 Dupla cruzada virava DOIS times (19/10, sala WUQGBH do Futpoint) — ✅ CONSERTADO
- Relato (Matheus Barros, via Diego): campeão em dupla, não conseguiu escolher clube/convocar no Rio × São Paulo; o time aparecia
  duas vezes ("Quase nada|Quebrador d" 1º e "Quebrador d|Quase nada" 13º). Causa: os dois pediram dupla um ao outro e os dois
  aceitaram → cada um virou parceiro do outro → dois assentos espelhados; quando o parceiro saiu, o `soloUid` do assento do Matheus
  ficou com o OUTRO e ele perdeu o comando. Conserto (OK do Diego): banco barra o par cruzado (`dupla_responder`) e a largada junta
  qualquer par cruzado numa dupla só (`desfazParCruzado`, dono = cadeira mais baixa). Trava `npm run dupla-cruzada`.

## 😈🔴⚫ BATISMO WEN MILAN B (17/10, plano 🖋 Fundador) — ⛔ PRONTO NO BRANCH, **NÃO PUBLICADO**: falta a CONTA
- ✅ **19/10: NO AR.** A conta foi criada às 14:49 (Brasília); código publicado na main + banco feito: `user_colors` ouro manual, `esc_socios` nº76,
  `esc_fundadores` nº92, `esc_compras_batismo` plano Fundador (plus), `esc_nomes_batismo` (Wen Milan B + FC + EC). Tema do Fundador junto.
- Dono: **vittor@tidex.com.br** (coração São Paulo). ⛔ Em 17/10 esse e-mail NÃO existe em `auth.users` → regra de 07/09: nada no
  banco e nada na main até a conta existir (o `apoio.tsx`/`manto.ts` também seguem o e-mail). Assim que a conta aparecer:
  publicar o commit + banco: `esc_socios` (sócio nº76, manto #DF1224/#180F0E, mascote_key `wenmilan_diaba`, escudo_time
  'Wen Milan B', time_coracao 'São Paulo', origem 'batismo', valido_ate 2099-12-31) · `esc_fundadores` n=92 · `esc_nomes_batismo`
  'Wen Milan B' (nome_norm minúsculo) · `user_colors` ouro manual.
- Assento: Série A no lugar do **Al Takhadao FC**, que desce pra **Série C** na vaga do bot Leve-cuscuz (ordem do Diego).
- Arte recortada da prancha (escudo 247×360/29 KB · mascote 250×440/37 KB · camisa na Loja). Mascote "A Diabinha" (confirmado pelo Diego).
  Nome do clube: Diego escreveu "Wen Milan N", a arte diz "WEN MILAN B" → **Wen Milan B** (confirmado pelo Diego).
- ✅ Gala APROVADA pelo Diego (17/10, "aprovado esse"). Gala "Inferno Rubro-Negro" (`gala-wenmilan.tsx`): fogo, tridente cravando, o ROSTO da Diabinha colado na tela LAMBENDO o vidro 2× com rastro molhado (SLURP!) — a língua solta foi reprovada (*"quero ela lambendo a tela"*),
  escudo das chamas, a Diabinha rebolando. Canto: "Vai lá de coração" (São Paulo), 11 s, `sfx/torcida-spfc-wen-v1.mp3`, na gala e
  na carreira. Vídeo `scripts/posts/gala-wenmilan-com-canto.mp4`, post `scripts/posts/wenmilan-post.png`.

## 📢 Telão (Anúncio do dia/Super Chat/pódio) em TODAS as competições do online (19/10) — ✅ NO AR
- Pedido: *"aquele telão… deve ser em todas as competições… Copa do Mundo, Copa dos Oito, qualquer tipo de Copa, regional"*.
- Liga e Champions já tinham. Agora também: Copa dos 8/Kings/Liberta do mata-mata (subiu pra cima dos jogos; o de baixo some na
  copa), fase de grupos da Libertadores, Copa do Mundo da sala (`CupScreen` com `online`) e copas regionais. Componente: `GiroDaRodada`.

## 🚫 Faixa de LED verde (Vadico) tirada (19/10) — ✅ NO AR
*"esse lugar de verde da Vadico Veículos pode tirar que não tô gostando"* → `LED_LIGADO = false` (patrocinio.ts). Some do topo de
todas as competições (online e carreira). A Vadico continua no telão, na placa do campinho e na Champions. Voltar = `true`.

## 🤖 Parceiro Tidex (19/10) — ✅ NO AR
Copa dos 8 "apresentada por Tidex" (`POR_COMPETICAO.copa8`) · Liga Legends da CARREIRA também (`'career-league'`, só a liga — copas e internacionais da carreira ficam sem; `CareerCompetitionStage` passa `patroKind`) · placa atrás do gol no lugar da Max Joias (`patro-tidex.webp`, fundo
escuro) · telão: a linha 3 de `esc_anuncios_fixos` (era a Max Joias) virou "🤖 Tidex · Sua empresa aparece no ChatGPT? Clique aqui"
→ WhatsApp +55 11 98118-1888 com a mensagem pronta. Aviso da comunidade: `scripts/avisos/2026-10-19-parceiro-tidex.json`.
A Max Joias saiu do campinho e do telão (o logo dela continua em `maxjoias.ts`, usado no estádio).
**+ 6ª marca do Patrocinador Master na carreira**, 🔁 *"igual a Vadico… cada temporada uma pode ser melhor com base nos bônus"*: prazo 5,
mesmo valor da Vadico; quem desempata é a meta sorteada de cada uma. Travas `npm run master` e `master-historia` atualizadas pra 6.

## ☁️ Salvar carreira sem plano → janela com os planos (19/10) — ✅ NO AR
Amigo do Diego achou que o salvar estava com bug: conta grátis (carreira nova salva só no aparelho desde 07/10) e o aviso era uma
faixinha que sumia. Agora `JanelaNuvemPlanos` (nuvem-planos.tsx) abre ao apertar 💾 Salvar (FaixaSalvar, central.tsx) ou 🚪 Sair e
salvar (pyramidseason) sem plano: só ⭐ Craque · 👑 Lenda (Pix na hora) + "Conheça todos os planos" (`?apoie=nuvem`). Ordem dele:
NÃO falar "salvo no celular". Fechar a janela do "Sair e salvar" sai pro menu, como antes. Mockup `scripts/mockups/salvar-gratis.png`.
Pendente: passe mensal (mockup `passes-mensais.png`) entra como 3ª opção aqui quando sair.

## 📊 Perfil: ranking global da carreira (19/10) — ✅ NO AR (regra final do Diego)
- *"o save dele atual que tá com melhor ranking em temporada"*: cada save tem a posição dele no ranking global NA temporada em que
  está (`esc_pyramid_career_rank`); o perfil mostra o save com a MELHOR posição. Na tela: só o número grande e a temporada embaixo
  (nada de clube, save ou total). `esc_perfil_rank`, até as 8 carreiras mais recentes.
- ✅ Online "Todos os tempos" (desde 02/09): 3ª caixa ao lado de semana e mês (Diego: "Ok"). Chave `sempre` em `esc_perfil_publico2`.

## 📌 Anúncios fixos do telão editáveis no #admin (19/10) — ✅ NO AR
- Pedido: *"como eu faço p tirar e escrever novas?? Deveria aparecer no painel as três p eu remover editar ou add nova"*.
- Vadico, K9 e Max Joias saíram do código e foram pro banco (`esc_anuncios_fixos`). No #admin, caixa "📌 Anúncios fixos · telão":
  editar texto/link, ⬆️ subir na fila, tirar, e ➕ novo. Até 90 letras; link só https://. Quem está com o jogo aberto vê em até 30 min.
- Se o banco não responder, o jogo mostra os 3 antigos do código (reserva). As PLACAS do campinho (logo Vadico/Max Joias) continuam no código.
- 💬 Mesmo dia: Super Chat MANUAL no #admin (caixa rosa "Recados dos jogadores"): o Diego escreve como um time, 1 h ou dia todo (`esc_admin_recado`).

## 📧 E-mail da campanha com as novidades de outubro (19/10) — ✅ NO AR (Diego: "Pode"), vale a partir do próximo disparo
- Pedido: *"atualizamos MT coisas já… vc deveria mudar o visual do e-mail"*. O texto no ar ainda fala de Várzea/técnicos/Copa do Brasil.
- Novo: 6 blocos só com o que está liberado pra todos (pregão aberto · Liberta/Champions/Mundial na carreira · Central Legends ·
  SAF 2º clube + rivais com banco · Champions de 36 + leilão de clubes · Amigos + medalha da semana), assunto novo.
- Gerador: `node scripts/email/campanha-volta.mjs --foto <pasta>` (faz a foto e o `campanha-volta.sql`). Com o OK: rodar o SQL no banco
  (troca só `esc_email_html`/`esc_email_assunto`; fila, disparo e medidor iguais). Voltar: `scripts/email/campanha-volta-antes.sql`.
- 👀 O placar mostra Abriu 0 / Clicou 0 em todos os dias: o rastreio de abertura e clique do Resend parece desligado (o "voltou" funciona).

## 🧑‍💼🛍️ Peças avulsas do presidente no Pix (19/10) — ✅ NO AR pra todos
- Pedido: *"ok pode fazer tudo nisso já pelo pix do mercado pago"*. Preço pelo nível: Craque 1,99 · Lenda 2,99 · Batismo 3,99 · Fundador 4,99.
- Grátis: 1ª compra = roupa, que dá o boneco careca (pele à vontade); depois cabelo/barba/acessório a 1,99. Com plano: compra as de cima.
- Editor: toda peça fora do que a conta tem mostra 🛒 preço e dá pra PROVAR; a caixa "🛒 Ainda não é seu" lista o que falta, com
  COMPRAR (Pix numa janela) e ✕ pra tirar a peça do rosto. Salvar só com tudo comprado (`visualCabeNaPosse`, mesma régua no salvar da conta).
- Banco: catálogo (61 peças) + `esc_presidente_pecas` + `esc_preco_peca` (só o servidor ou o dono perguntam) + `esc_mp_preco_ref`/`esc_mp_entregar`.
  Edge `mp-criar-pix` v10 (nome da peça, ref até 40 letras). Fotos: `node scripts/foto-pecas-presidente.mjs`.
- ⏳ Falta: carreira de quem é grátis com boneco comprado usa o presidente da conta? (a régua da carreira já aceita a roupa comprada).
- 🔙 Reverter: tirar a caixa de compra = voltar o commit; o banco pode ficar (sem a tela, ninguém gera Pix de peça).

## 🏀💵 Basquete: preços em dólar (19/10) — ⏳ BASE COMBINADA, cobrança NÃO feita
Craque US$ 9,99 · Lenda 19,99 · Batismo 49,99 · Fundador 79,99 (*"isso aí, mais ou menos isso!"*). Detalhe em
`docs/conceito-basquete.md` (§ Preços nos EUA). Falta: conta Stripe ou PayPal do Diego + ligar a cobrança em cartão no jogo.

## 🚫🤖 "Sem bots" só com 4+ pessoas (19/10) — ✅ NO AR
`LIGA_FECHADA_MIN = 4` (store). START_ONLINE: `ligaFechada` = escolha do dono E 4+ times; a escolha fica em `ligaFechadaEscolha` e o
"novo leilão" manda a ESCOLHA (com 4+ volta a valer). Avisos: embaixo do "Sem bots" ao criar/editar e na faixa da sala de espera
("vale com 4+ pessoas — agora são N, então começa com bots"). Testado no motor: 3 pessoas → 20 times; 4 → 4 times.

## 🚫👤 Sala online não recomeça com 1 pessoa só (19/10) — ✅ CONSERTADO
Relato do Diego: dois jogam liga + copa, um sai no fim e o que ficou *"consegue reiniciar sozinho e joga com a máquina… só dá pra jogar
com mínimo de 2"*. O "Abrir novo leilão" já barrava; o furo era o **"Começar (mesmo time)"** (`startMesmo` → REPLAY_SEASON). Agora o fim
da partida conta as PESSOAS da sala no banco (`room_players`, por conta, a cada 3 s): sozinho, os dois botões somem e aparece
"📣 Ir pra sala de espera chamar gente"; e o `startMesmo` confere o banco de novo no toque (mesma régua do novo leilão).

## 🪟 Loja/Amigos fechando sozinhos (19/10) — ✅ CONSERTADO
Relato do Diego: *"vira e mexe a página do amigos ou loja fecha depois de alguns segundos"*. Causa: o `VersionWatcher` (index.tsx)
recarrega a página sozinho 6 s depois de achar versão nova, sempre que a tela é a home ('intro') — e a Loja/Amigos/Pix/Carreiras são
janelas POR CIMA da home, então a tela continuava 'intro'. Com muita publicação no dia, quem estava na Loja via ela sumir. Agora só
recarrega com a home limpa (`temJanelaAberta()` = nenhum elemento fixo cobrindo a tela) e a pessoa parada há 15 s.

## 📅 Patrocínio mensal na Loja com números e fotos (18/10) — PUBLICADO pra todos
- `marca-mensal.tsx` + fotos em `public/patrocinio-mensal/`. Números medidos no banco em 18/10 e escritos à mão (`NUMEROS`):
  atualizar de tempos em tempos (só os GRANDES — regra do Diego). Fotos do LED, Master e vitrine ainda são dos mockups
  aprovados; trocar por foto real do jogo quando der (o LED do mockup mostra "Leilão Legends", que hoje não passa).

## 🎨 Tema do Fundador (18/10)
- PUBLICADO: 1 tema por Fundador, uma versão, com as cores do manto + escudo + mascote — Tricolor do Arruda, Fabulous,
  Gaviões SCCP, Cuiudos, Seven City (`temas-sala.tsx`, mockup `scripts/mockups/temas-fundadores.png`). Rei do K9 maior também.
- ✅ Wen Milan B: tema subiu junto com o batismo em 19/10 (a conta do dono existe).
- Bug "lance bugando no online" (18/10): sem causa achada, esperando o Diego dizer sala/tipo.

## 🎨 TEMA DA SALA NA LOJA (18/10) — ✅ NO AR
- `temas-loja.tsx` (🎨 Tema da sala na Loja): ❤️ time de coração (todo clube com escudo oficial, entra na hora após o Pix) pra todos;
  🛡️ tema do clube só Batismo+ (nasce "em produção": montar a arte em temas-sala.tsx e o Diego libera no #admin); Fundador ganha 1
  (o Diego dá no #admin). Banco: `esc_temas_conta` + produtos tema_coracao/tema_clube; edge mp-criar-pix v8. Detalhe no branch do Claude.

## 18/10/2026 — Retomada da publicação privada da Presidência

- Pedido de Diego para seguir com a publicação; pacote de 16/10 preservado.
  O push anterior foi recusado porque a main avançou, sem sobrescrita.
- Main atual `6716bb2e` incorporada com editor público, patrocínios e rádio
  unificado. Estádio/sala/futebol aprimorado continuam exclusivos da conta
  verificada `diego.c.fonseca@gmail.com`.
- Narração privada integrada ao rádio novo, com fases reais e gol no impacto.
  [Registro da publicação](presidencia-publicacao-20261016.md) reúne o escopo
  e as evidências. Conferir o deploy do commit final para confirmar a entrega.

## 16/10/2026 — Publicação do pacote acumulado autorizada

- Diego solicitou publicar tudo que foi feito até agora em seu usuário.
  [Registro da publicação](presidencia-publicacao-20261016.md) reúne escopo,
  testes e limites. Não considerar os estados “sem commit/deploy” abaixo
  como bloqueio atual: são históricos.
- Pacote `56d8d4c5` integrado à main `44c33a64` pelo merge `bf4001ce`.
  Compras e mudanças do criador já publicadas foram preservadas, assim como
  a atualização posterior `94e4ea04` do Pregão Aberto.
- Novidades do estádio, sala e futebol aprimorado continuam restritas à conta
  verificada `diego.c.fonseca@gmail.com`. Sem migração ou escrita na conta.
- Conferir o resultado do GitHub Pages do commit final para confirmar o deploy.
  Publicar o trabalho atual não elimina as pendências do motor e acabamento.

## 16/10/2026 — Jogadores e NPCs sem rosto (acabamento local)

- Melhorados volumes, cabelo, roupas e calçados dos jogadores, pedestres,
  visitas/passageiros e torcida, mantendo rostos sem olhos, nariz ou boca.
- Registro, capturas e limites em
  [acabamento dos humanos](presidencia-humanos-acabamento-20261016.md).
- Preservados percursos, escala, obras, assentos, cores e a arte original
  do presidente. Restrição à conta verificada de Diego inalterada.
- PASS: contatos reais de pés/mãos com a bola, passadas, transporte/visitas,
  dez capturas de NPCs, doze capturas de campo em duas etapas e build.
- Trabalho local; ainda sem novo commit ou deploy.

## 16/10/2026 — Personagem original na sala (correção local)

- Diego rejeitou o boneco geométrico, mesmo usando os IDs da conta. A sala
  passa a reutilizar as artes originais do criador: roupa, pele, cabelo,
  barba e acessórios, em pé/sentado e com profundidade diante dos móveis.
- Registro e verificações em
  [personagem original](presidencia-personagem-original-20261016.md).
  PASS: comparação com o editor, 66 roupas/poses, ciclo de carga/retry,
  timeout com evento atrasado, sala em 1200/390 px, gestos, etapas e build.
- A arte tem vista frontal; não é um modelo volumétrico de 360°. Sala,
  janela e trabalho anterior do futebol preservados. Sem novo deploy.

## 16/10/2026 — Continuidade das jogadas oficiais (validada localmente)

- Continuação de “Siga”: preparação, recepção, passe, condução e finalização
  compartilhados pelo campo, narração e miniatura. Autor e assistente se
  movimentam no plano; o resultado continua pertencendo à competição.
- Alvos variados de gol, erros laterais/altos, postes e travessão; condução
  considera a geometria real das chuteiras e as poses interpoladas.
- Registro atual em [jogadas contínuas](presidencia-jogadas-continuas-20261016.md).
  Build, auditoria independente, 51.926 quadros da regressão do motor, dez
  reposições, navegador e 40 capturas 3D passaram. Bola nova com painéis
  legíveis, escala e contato conferidos; condução natural também corrigida.
- O vídeo revelou passe atravessando quadril/shorts. Corrigida a orientação
  do recebedor para o passador; nova regressão passou em 832 medições da
  malha real, além das 4.326 verificações de chuteira e da recaptura visual.
- Continuam pendentes faltas/impedimentos, disputas aéreas, jogadas ensaiadas,
  acabamento e física livre. A cauda dos chutes para fora é amortecimento
  guiado, inclusive no ar; não confundir com física completa.
- Sala e trabalho anterior preservados. Sem commit, push ou novo deploy;
  restrição à conta verificada de Diego mantida.

## 16/10/2026 — Futebol revisado e sala 3D unificada (local)

- Pedido mais recente de Diego prioriza o futebol real no estádio. Corrigidos
  reposições sem teletransporte, contato pé/bola, apoio das passadas,
  cruzamentos naturais, linha do gol, IDs de atletas, intervalo e viés das defesas.
- Calendário de chances permanece ao trocar velocidade; narração privada só
  descreve ações executadas e anuncia desfechos no impacto. Testes do motor
  e navegador passaram; o motor ainda não executa todos os lances de futebol.
- A sala passa a usar o ambiente 3D, presidente sem rosto, compras e coleção.
  Integração e visibilidade verificadas em desktop/celular emulado, incluindo
  gestos e alternativa WebGL. Sem publicação; acabamento visual ainda pendente.
- Referências atuais: [revisão do futebol](presidencia-futebol-revisao-20261016.md)
  e [sala unificada](presidencia-sala-unificada-20261016.md). As pendências de
  faltas, impedimentos, cabeceios, jogadas ensaiadas e física completa continuam.
- Preservada a restrição a `diego.c.fonseca@gmail.com`; nenhum novo deploy.

## 15/10/2026 — Revisão do motor, etapas e janela após a publicação

- A versão `2aa90a0d` teve deploy confirmado no GitHub Pages (run
  `38810648788`), mantendo o acesso privado de Diego. A revisão seguinte está
  local em `fix/presidencia-revisao-motor-20261015`, ainda sem publicação.
- Corrigidos duração de passes/chutes por distância, relógio compartilhado
  entre campo e placar, pausa/troca de velocidade e encerramento do último
  lance. A janela da sala passa a usar a geometria do mapa; refletores comprados
  iluminam o campo sob teto fechado também de dia.
- Ainda faltam incidentes completos de faltas, impedimentos, cartões/expulsões,
  jogadas ensaiadas e um roteiro comum com a narração. Reposições ainda têm
  saltos de bola; acabamento fiel à arte e presidente físico continuam pendentes.
- Análise, testes e limites estão em
  [presidencia-revisao-motor-etapas-janela-20261015.md](presidencia-revisao-motor-etapas-janela-20261015.md).


## 🧹 Branch `claude/denis-save-file-x1osct` virou espelho da main (19/10)
- O branch acumulava cherry-picks e brigava em todo merge. Resetei pra `origin/main`. O ÚNICO trabalho que só existia nele era o
  **tema do Fundador Wen Milan B** (commit `7ac20672`, `temas-sala.tsx`): quando a conta do dono (vittor@tidex.com.br) existir,
  `git cherry-pick 7ac20672` (ou refazer pelo padrão `temaFundador`) junto com o batismo. Não se perdeu nada da main.

## 🗳️ PRESIDENTE VIRA POLÍTICO (19/10) — 💛 ELE GOSTOU (*"gostei"*), mockup ainda não feito
- Pedido de origem: *"história da vida do presidente pessoal e coisas no jogo pra vida dele pessoal"* + *"me surpreenda"*.
- Escada: Vereador (verba pro estádio) → Deputado (lei de incentivo = patrocínio extra) → Presidente da Federação (sede da final da
  Copa / horário do clássico) → Presidente da CBF (Supercopa no seu estádio, entrega o troféu) → Presidente da FIFA (Copa do Mundo no
  seu estádio, o "zerei"). Eleição pelo que fez (títulos, caixa, fama da coletiva: Polemista = povão, Diplomata = cartolas), santinho com
  o boneco, debate contra o presidente do arquirrival, apuração ao vivo. Risco: CPI (promessa quebrada, caixa vermelho, polêmica) com 1
  toque (nega/acordo/culpa o técnico); perde o mandato, nunca a carreira. Poder = regra explícita (nada de efeito escondido).

## 🧠 IDEIAS PRA CARREIRA (19/10, depois da coletiva) — ❌ NENHUMA APROVADA (*"não gostei de nada… tá foda"*)
- Ele quer **"algo mais real, igual vida real de futebol, na qual o usuário é presidente do time"**. Recusou TODAS, em 4 rodadas:
  propostas de bot pelos seus jogadores · estadual no começo da temporada · bastidores com escolha rápida · entrevista do jogador ·
  técnico com voz · linha do tempo do clube · recordes do clube · torcida viva · excursão de pré-temporada · conselho com meta ·
  Copa das Carreiras (seu clube × carreira de outros usuários) · Mesa do Presidente (negociação, empresário, eleição do clube).
- 5ª rodada (mesmo dia, ele pediu *"analise tudo que tem de histórias… base, boate, entrevista… o que dá pra implementar e acrescentar"*):
  levantamento completo feito (causos noitada 10 · expulsão 8 · lesão 9 · desgaste 5, 1 por temporada; Cria 9 PT-only; Central 17 tipos
  com 1 frase cada; manchete do causo FIXA; crise 1 texto; jornal 100 manchetes presas à posição). Propus contos novos no banner do causo
  (filho nascendo · polêmica na rede · briga no treino · acima do peso · carrão batido · pai reclama no rádio · veterano se aposenta · lei
  do ex · peneira) + subir pra 2–3 causos/temporada e variar manchete/Central/Cria. Resposta: *"não gostei"*. O inventário fica valendo
  como mapa (o que é fino e repete), mas a proposta foi recusada.
- 6ª rodada (ancorada no jogo, depois da regra "tem que ter sentido"): presidentes rivais (bots com perfil) com voz no leilão/Central ·
  história real da carta (bio das 1.388 cartas) ao arrematar/brilhar. Resposta: *"não"*. **PAREI de propor.** Próximo passo é dele.
- ⚠️ MESMA LIÇÃO de 04/10 (cartas do álbum): rodada de ideias seguidas trava ele. **Não despejar lista de novo.** Esperar ele trazer a
  ideia, ou fazer UMA pergunta sobre o que ele imagina (um exemplo de jogo/momento que ele gostaria de viver como presidente).

 — ✅ APROVADA (*"adorei… quero sim efeito"*), CODADA, SÓ NA CONTA DO DIEGO
- Decisões dele na aprovação: **com efeito** no jogo (pequeno e explicado) · **pular** não pune, mas 3 pulos seguidos acordam o
  Rogério e a fama vira "O Mudo" · junto vão o **item 2** (coletiva antes da final) e o **4** (frases da temporada no jornal do fim).
  Ficaram pra depois: 🎤 entrevista do jogador (é um CARTÃO na Central com 1 toque, não vídeo — ele perguntou *"tenho que
  assistir?"*) e 🧢 técnico respondendo junto.
- 🔥 **ARQUIRRIVAL** (ele notou: *"o jogo não sabe quem é o rival de verdade"*): um só, escolhido entre os rivais da carreira
  (mesma divisão / quem mais enfrentou), trocável só na virada (round 0) pela Sala de imprensa. A pirâmide não guardava
  retrospecto: agora `careerColetiva[mgr].h2hPor` soma cada jogo contra rival uma vez.
- Código: `coletiva.ts` (motor puro: 36 situações · 4 repórteres · 648 textos PT+EN · efeito · fama · promessas · arquirrival),
  `coletiva-ui.tsx` (cartão pós-jogo na fila de avisos, Sala de imprensa, quadro da Central), `store.tsx` (COLETIVA_*),
  `pyramidseason.tsx` (contexto da rodada no tempo morto, mods na simulação, Copa, jornal), `jornal.tsx` (página 🎙️),
  `central.tsx` (quadro). Gate `COLETIVA_GERAL` em sport.ts; bancada `esc-coletiva-dev`. Trava `npm run coletiva`.
  Foto real: `node scripts/foto-coletiva.mjs` (precisa do save do `navega-carreira.mjs --fase nova`).
- Efeitos: moral ±2 de força no próximo jogo · clássico −3 pra você (= rival motivado) · renda = 10% da bilheteria de 1 jogo,
  na hora, com linha no Extrato. Entram pela MESMA porta do evento (`RoundMods`): save sem coletiva = simulação idêntica.
- Automático: a coletiva fecha sozinha em 12s sem contar pulo. Manual: espera o toque; "Próxima rodada" com ela aberta = pulou.
- Ainda sem gatilho (o contexto não tem o dado barato): goleiro pegou pênalti · reserva reclamando · proposta por craque ·
  patrocinador cobrando · internacional · Copa do Mundo · Bola de Ouro. Os textos já existem; ligar quando tiver o dado.
- (histórico do mockup abaixo)
## 🎙️ COLETIVA — mockup (19/10)
- Contexto: ele sente que a galera está largando a carreira pelo online (números: solo caiu ~30% desde o pico de fim de
  setembro, online ~25%; contas salvando carreira na nuvem caíram de ~750 → ~410/semana, a queda forte começa na semana de
  05/10, quando grátis ficou com 1 ficha e sem nuvem). Ele escolheu **entrevistas**, com a condição: *"se não tiver variedade
  não quero… se não tiver histórias e com MUITA variedade não quero"*.
- Mockup `scripts/mockups/coletiva.png`: ① coletiva pós-jogo (1 toque ou pular, só quando TEM assunto — nunca todo jogo) com
  3 respostas (😈 provoca · 🧊 diplomata · 🚪 desconversa) · ② resposta vira história (manchete no Martelo + efeito PEQUENO e
  explicado: rival motivado, +renda, repórter cobra depois — dá pra desligar o efeito) · ③ 4 repórteres com personalidade
  (Rogério Provoca · Clarice Planilha · Tião Puxa-Saco · Mila Vestiário) × ~40 situações, 3+ perguntas cada e 3+ frases por
  resposta = ~300 textos PT+EN, sem repetir na mesma temporada · ④ Sala de imprensa: contagem por estilo, fama do presidente
  (Polemista · Diplomata · Mudo · Sonhador · Pão-duro) e frases que marcaram; promessa feita volta como manchete.
- Regras de ouro que já valem: nada atrasa o ritmo (tempo morto, 1 toque), nomes dos repórteres são INVENTADOS (nada de gente
  real), textos em PT e EN.
- Outras ideias que ofereci no mesmo dia e ficaram de fora (ele escolheu entrevista): 📞 propostas de bots pelos seus jogadores ·
  🏟️ estadual curto antes da liga · 🎲 bastidores com escolha rápida. Vale lembrar se ele pedir "mais coisas na carreira".
- Também ofereci (e ele disse NÃO, *"quero coisas no modo carreira"*): desafios da semana, ranking semanal da carreira, nuvem
  pro grátis em 1 carreira. Não repropor como está.

## 👥 AMIGOS + PERFIL ("estilo Orkut", ideia do Diego 18/10) — ✅ LIBERADO PRA TODOS EM 19/10 (`AMIGOS_GERAL = true`)
- **v2 (19/10, *"pode fazer p todos"*, mockup `scripts/mockups/amigos-todos.png`)**: abas Amigos / 🏆 Ranking dos amigos (títulos de
  sala da semana) · 📣 CHAMAR amigo online (só quando EU estou numa sala de espera; botão "👥 Chamar amigos online" no convite da
  sala) · 🚪 ENTRAR na sala do amigo **só se ela ainda espera** (começou = "🎮 jogando agora · a sala já começou", sem botão) · já
  estou numa sala? não sai sozinho (sair mexe na coroa) — avisa · 🔥 rival (1 por pessoa, só amigo, só zoeira: chama na lista de
  técnicos + placar de títulos no perfil + 1 zoeira no chat quando ganho título com ele na sala) · perfil "📊 No online" (posição
  da semana e do mês + medalhas 🥇🥈🥉 do pódio semanal) · 🔔 sininho embaixo de MINHA CONTA (convites, pedidos, aceitos) · aviso
  "fulano entrou no jogo" (1 por amigo a cada 30 min) · convite em janela em qualquer tela, MENOS partida/leilão.
- ✅ **ÁLBUM DENTRO DOS AMIGOS (pedido 19/10, *"seria mais fácil fazer a troca de cartas por lá"*)** — APROVADO (*"ok pode fazer"*) e
  NO AR em 19/10 (`AlbumNosAmigos` + `CartasDele` em album-colecoes.tsx; aba 📖 Álbum + botões no perfil do amigo em amigos.tsx): `scripts/mockups/amigos-album.png` (aba 📖 Álbum nos Amigos = o mesmo `EscAlbum`/`AbaTrocas`; no perfil do amigo
  "📖 Ver cartas dele" + "🤝 Propor troca" abrindo `NovaTroca` com ele já escolhido; nas trocas, amigos primeiro). Home mantém o MEU ÁLBUM.
- ⏳ **⚔️ CLÃS (19/10, ele preferiu à Torcida, SEM rivalidade entre clãs: *"faça o mockup sem esse negócio de rival"*)** — mockup
  enviado, ESPERANDO OK: `scripts/mockups/clas.png`. Qualquer um cria (nome com filtro + emblema pronto; batismo pode usar o
  escudo do clube), até 20 membros, líder, títulos online somam pro clã, ranking semanal de clãs, selo na sala. Criar = QUALQUER PLANO PAGO (Craque+ ou o mensal que vai sair) — ordem dele 19/10. APROVADO ("pode fazer os clãs assim").
  (ver acima: qualquer plano pago); entrar é grátis. ⑤ Procurar clã: busca + filtros (com vaga · mais títulos · batismo); líder escolhe 🔓 aberto (entra direto) ou 🔒 fechado (pede, chega no 🔔 do líder). Dono de batismo entra em qualquer clã como todo mundo.
  🗂️ **GUARDADO (19/10, *"deixa guardado… em breve daremos os clãs"*)**. Selo do clã SÓ onde aparece a PESSOA: lista de técnicos da
  sala, crachá do chat, perfil e lista de amigos — nunca em tabela/placar/jogo (lá é o escudo do clube). SQL do banco já escrito
  (tentativa de aplicar foi cancelada; reaplicar só com OK dele).
  🖼️ 21/10: mockup de ONDE aparece (exemplo Clã Futpoint, Futpoint líder + Didico grátis): `scripts/mockups/clas-onde-aparece.png` —
  pílula escura (emblema + "⚔️ Clã X") SEMPRE na linha de baixo do nome, sem mexer em escudo/presidente/cor do plano/medalha. APROVADO ("ok pode fazer").
  ✅ FEITO 21/10 (só nas contas do Diego — `CLAS_GERAL` em `cla.tsx`): banco `20261021040000_clas.sql` (testado: grátis não cria, nome
  ofensivo barrado, escudo do batismo, fechado→pedido→líder aceita, 7 dias de espera, líder sozinho sai = clã fecha) + aba ⚔️ Clã nos
  Amigos (criar/procurar/ranking/chamar amigo/pedidos/tirar/abrir-fechar/sair) + selo na sala de espera, chat, amigos e perfil.
  Foto: `scripts/mockups/clas-tela-real.png`. 🔁 21/10: selo do clã SAIU do chat (Diego: "no chat não precisa") e entrou a caixa ⚔️ Clãs da semana
  (top 5) embaixo do Ranking da semana nas salas online (`scripts/mockups/clas-ranking-salas.png`). Máximo de membros: 22. ⏳ Liberar pra todos = `CLAS_GERAL = true` quando o Diego testar. ⏳ Convite de clã
  ainda não aparece no 🔔 (só na aba ⚔️ Clã).
  🔁 21/10 (2ª rodada, *"selo no chat pode ter mas ainda menor… prêmio 30/20/10… telão… não entra no lugar do usuário, só abaixo"*):
  prêmio por MEMBRO do top 3 de clãs da semana fechada: 🥇 30 · 🥈 20 ·
  🥉 10 🪙 pra carreira (`esc_premio_cla_semana`, fechada sozinha por `esc_fecha_semanas_clas`, resgate no `PremioSemana` →
  `CLA_SEMANA_CREDIT`) · telão: linha "⚔️ CLÃS DA SEMANA" logo DEPOIS do pódio dos usuários (`esc_cla_podio_passado`, leitura a cada
  10 min, nada pelo canal). Foto: `scripts/mockups/clas-premio-telao-chat.png`. Trava dos clãs agora mora em `cla-gate.ts`.
  🔁 21/10 (3ª rodada): **máximo 22 membros** (*"coloque 22"*; `CLA_MAX` no código + `esc_cla_cabe`/`esc_cla_lista` no banco,
  migration `20261021060000_clas_22_membros.sql`) · **selo do clã SAIU do chat de novo** (*"no chat não precisa ter selo de clã não"*
  — não repropor) · a página do clã continua sendo a aba ⚔️ Clã dentro de 👥 Amigos, do lado do 📖 Álbum (ele aprovou o lugar).
  🔁 21/10 (4ª rodada): **TROCAR DE CLÃ COM AVISO** (*"você já participa do clã do Futpoint, gostaria de confirmar?"*). Quem já tem
  clã agora PODE aceitar convite ou pedir pra entrar em outro: o banco responde `confirmar` e a tela abre o aviso "⚔️ Trocar de clã?"
  (clã de agora ➜ novo, o que acontece com a liderança, espera de 3 dias, "Sim, ir pro X" / "Não, ficar no Y"). Clã fechado: o pedido
  🔓 **21/10 (Diego): SEM ESPERA pra trocar de clã** (*"tira essa regra, não precisa"*). Era 7 dias, depois 3, agora zero: `esc_cla_espera_ate` devolve sempre null (banco, valeu na hora). Não repropor espera.
  🔒 **22/10 (Diego): TRAVA DE 7 DIAS DEPOIS DE ENTRAR** (*"pra sair do clã e entrar em outro, pelo menos 7 dias a partir do momento que entra"*). Até `desde + 7 dias` ninguém sai nem troca daquele clã (`esc_cla_trava_ate`); vale em sair, trocar por convite/pedido, criar o seu estando nele. Liberado: o presidente tirar, fechar ou guardar o clã, e entrar num 2º pela 2ª vaga paga. A espera DEPOIS de sair continua zero. Banco já valendo; aviso com a data na tela (branch).
  🪙 **22/10 (Diego: "sim"): PRÊMIO DA SEMANA DO CLÃ SÓ PRA QUEM ESTÁ DESDE SEGUNDA.** Quem entra no meio da semana soma título pro clã, mas a moeda (30/20/10) só a partir da semana seguinte (`esc_fecha_semanas_clas`: `desde <= segunda 0h`). Exceção: a semana de estreia (19/10) vale pra todos, porque os clãs nasceram na terça. Quem entra vê o motivo na mensagem de "entrou no clã" (`ENTROU_CLA`). Banco valendo; texto na tela no branch.
  🔓 **22/10 (Diego): criar o 1º clã SEM PLANO custa R$ 4,90** (era 9,90). Banco (`esc_mp_preco_ref`, produto `cla_criar`) já cobra 4,90; os textos da tela no branch. 2º clã R$ 9,90 não mudou. 🛡️ E o ESCUDO personalizado foi pra R$ 14,90 (22/10, era 19,90).
  🌍 **22/10 (Diego: "esse caixa dos rivais troque pelo rank global de usuários"): CENTRAL LEGENDS** — a caixa "💰 Caixa dos rivais" saiu e no lugar entrou "🌍 Ranking global": top 5 + a SUA carreira de agora (mesma busca e mesma conta da aba Rank → Global; `useRankGlobalCentral`), toque abre a aba Rank já no Global. Só lê com a Central aberta. Prévia `scripts/mockups/central-rank-global.png`; no branch esperando OK + "publica".
  ⚔️⚔️ **21/10 (Diego): SEMPRE SÃO DOIS.** Até 2 clãs por pessoa, em qualquer combinação (membro dos 2 · presidente dos 2 · um de cada), MAS a 2ª vaga só pra quem pagou o "2º clã" (`cla_extra`, R$ 9,90, uma vez, vale pra sempre: criar o 2º OU entrar em outro). Pra um 3º: sair de um; presidente com gente = passar (já vem marcado o mais antigo com plano) ou fechar; presidente sozinho = 📦 GUARDAR (sai do ar, nome reservado, reabre só se tiver lugar) ou fechar. Banco: `esc_cla_membros.vaga` (1/2), `esc_clas.guardado`; a tabela velha ficou como `esc_cla_membros_v1` (cópia). Regra escrita na aba ⚔️ Clã. Fotos `scripts/mockups/clas-dois-*.png`. Banco já valendo; tela no branch esperando "publica".
  📝 **21/10 (Diego): DESCRIÇÃO DO CLÃ.** Opcional ao criar, até 200 letras, sem link e sem palavrão (régua do Super Chat, `esc_cla_desc_erro`); o presidente edita depois (📝). Aparece no CONVITE, na lista de clãs e na página do clã. Banco já valendo (`esc_clas.descricao`); tela no branch. Fotos `scripts/mockups/clas-desc-*.png`. Se ele quiser link do grupo do zap na descrição, é só liberar `wa.me` na régua.
  👆 **21/10 (Diego): RANKING CLICÁVEL.** No ranking da semana (os 5 + o pódio da semana passada) tocar no técnico abre o PERFIL (➕ amigo e o novo 📣 "Chamar pro <meu clã>", um botão por clã meu). No ranking dos clãs tocar no clã abre a janela `ClaVer` (`cla-ver.tsx`): membros (tocar = perfil), descrição e Entrar (aberto) / 🔒 Pedir (fechado) / "Clã fechado com 22/22" ou "Clã cheio" — com as mesmas travas da aba (trocar pergunta, presidente preso, sempre são dois). Banco: `esc_vitrine_salas` manda `uid`; `esc_cla_ver`. Fotos `scripts/mockups/clas-rk-*.png`.
  🔔 **21/10 (Diego): SININHO COM CLÃ.** A mesma leitura de 60s (`esc_avisos`) ganhou `clas` (convite pra clã: entrar/✕) e `cla_pedidos` (pedido pra entrar no clã que EU presido: aceitar/✕). Pedido de amizade, convite de clã e pedido pro meu clã também PULAM na tela (faixa de cima, igual ao "entrou no jogo"), só os que chegam depois da 1ª leitura. Se aceitar o convite exige trocar de clã, o sininho só avisa e manda pra 👥 Amigos → ⚔️ Clã. Foto `scripts/mockups/clas-sino.png`.
  🥊 **21/10 (Diego): INTER VALE FC virou 🖋 FUNDADOR.** Banco já tinha o plano (esc_compras_batismo plus, 21/10) e o fundador nº89 (de 12/10). Feito no branch: gala única "Noite de Luta" (`gala-intervale.tsx`: ringue, gongo, o Lutador soca e trinca a tela, escudo como cinturão, DISCIPLINA·FORÇA·VALE), canto = o MESMO do Wen Milan B (`sfx/torcida-spfc-wen-v1.mp3`, gala + carreira) e tema da sala `intervale` (preto e branco). Vídeo `scripts/posts/gala-intervale.webm`, foto `scripts/mockups/tema-intervale-*.png`. Esperando OK + "publica".
  🔎 **21/10 (Diego): botão sutil "Procurar ou criar clã ›"** embaixo do ranking dos clãs da semana → abre os Amigos SOLTO já na aba ⚔️ Clã (`abreAmigosSolto('cla')`, `MeusAmigos abaInicial`).
  📊 **21/10: "online de todos os tempos" conta só desde 21/09** (quando o jogo passou a guardar o resultado de CADA pessoa, `human_results`). Antes só existia o nome do campeão (21 linhas, de 02/09 a 21/09, só 1 com a conta) — nada de antes de 02/09 foi guardado. Caso que o Diego viu: a conta "Xurupitas FC" não entra desde 03/08; o título de 05/09 com esse nome não tem conta ligada.
  🗑️ **21/10 (Diego: "30 dias ou mais, grátis, apaga definitivamente"): LIMPEZA DE SAVES NA NUVEM.** Apagados de vez 577 saves de conta GRÁTIS (sem plano, `esc_plano_rank = 0`) parados na nuvem há 30+ dias (`esc_pyramid_saves.updated_at`); sobraram 1.742, e os 55 parados que ficaram são todos de conta paga. O save no APARELHO de cada um não foi mexido. Pendente: regularizar as contas PAGAS acima do limite de fichas (25 contas, 38 carreiras a mais, 33 paradas há 30+ dias) — esperando o Diego dizer se vai.
  💾 **21/10 (Diego: "quem passou do limite nas contas pagas, apague os que estão mais tempo sem mexer"): FEITO.** 25 contas pagas acertadas pro número exato do plano (Craque 2 · Lenda/Batismo/Fundador 4): ficaram as carreiras MAIS RECENTES, saíram 38 (as mais velhas) pra `esc_saves_lixeira` e o seed de cada uma entrou em `esc_carreiras_barradas`. O gatilho `esc_saves_tira_barradas` tira essas carreiras de qualquer gravação nova (o celular manda tudo de volta no "Sair e salvar"). No APARELHO elas continuam. Conta do Diego fora (8 carreiras). Rotina: `esc_ajusta_fichas_pagos(p_testar)`. Devolver uma: tirar a linha de `esc_carreiras_barradas` + pôr o slot da lixeira de volta.
  guarda `trocar` e a troca acontece quando o líder aceita. Quem saiu/trocou nos últimos 3 dias (era 7; Diego mudou pra 3 em 21/10) não troca de novo. Botão "🔎 Outros
  clãs" dentro do clã. Migration `20261021080000_clas_trocar.sql`; testado no banco. Foto: `scripts/mockups/clas-trocar.png`.
  🟢 21/10 (*"aprovado"*): **`CLAS_GERAL = true`** (cla-gate.ts) no branch, esperando o "publica". Quem não tem plano e toca em
  Criar clã vê a caixa "Criar clã é de quem tem plano" + ⭐ Ver os planos + atalho pra entrar de graça (`scripts/mockups/clas-sem-plano.png`).
  Reels: `scripts/video-clas-reels.mjs` → `scripts/posts/clas-reels.mp4` · aviso do zap: `scripts/avisos/2026-10-21-clas.json`
  (tag nova `premio` no `aviso-comunidade.mjs`). Novidade na home escrita.
  🔁 21/10: espera depois de sair/trocar = **3 dias** (era 7). 👑 **PRESIDENTE PRESO** (*"não pode uma pessoa ser dona de um clã e
  querer participar em outro"*): o líder com gente no clã não sai nem troca — a tela abre "Você é o presidente do X" com 👑 Passar a
  presidência (lista do clã; SÓ quem tem plano pode receber) ou 🗑️ Fechar o clã (solta todo mundo sem espera). Sozinho no clã: sair/
  trocar fecha o clã, como antes. A coroa NÃO passa mais sozinha pro mais antigo. Migration `20261021100000_clas_presidente.sql`,
  testado no banco. Foto: `scripts/mockups/clas-presidente.png`.
  🔁 21/10: **CRIAR CLÃ ESTANDO EM OUTRO** (*"pra ele criar clã ele precisa sair do clã onde ele está e aí também aparece o banner"*):
  botão "⚔️ Criar meu clã" dentro do clã → aviso "você sai do X" (presidente com gente: passar/fechar antes) → tela de criar com
  "🚪 Ao criar, você sai do X"; o banco sai e cria na mesma hora (`esc_cla_criar(..., p_trocar)`, migration
  `20261021110000_clas_criar_saindo.sql`). E na tela **"líder" virou "presidente"** (pedido dele).
- ⏳ **🚩 TORCIDAS (ideia 19/10, no lugar de "clãs")** — mockup enviado, ESPERANDO OK: `scripts/mockups/torcidas.png`. Cada um
  entra na torcida de UM clube batizado (dono já nasce na dele; troca 1x por mês), todo título online soma pra torcida, ranking
  semanal das torcidas, ⚔️ clássico da semana (2 torcidas sorteadas), selinho da torcida na sala. Só placar, sem chat (zap) e sem
  mexer no jogo. Lembrar: ele cortou "comunidades" em 18/10 — torcida é só placar, sem post.
- 🚫 **SEM CHAT 1:1** (*"tenho uma comunidade no zap"*): vai o botão "💬 Entrar na comunidade do zap". Não repropor chat.
- Tráfego: `esc_avisos` ao abrir + a cada 60s só com a aba visível (nada de canal). Banco: migration `20261019120000_amigos_v2.sql`.
- 🚫 **COMUNIDADES: NÃO FAZER** (*"esse negócio de comunidade é doideira, melhor não"*). Não repropor.
- Feito: `amigos.tsx` (PerfilPublico · MeusAmigos · BotaoAmigos), botão "👥 AMIGOS" na HOME, do lado da Loja (18/10: Diego tirou da área de Minhas ligas — "não tem nada a ver"), toque no nome na sala de
  espera abre o perfil. Banco: `esc_amizades` + 5 funções (migration 20261018030000). Falta: "chamar pra sala"/"entrar" (precisa de
  aviso entre contas), toque no nome no chat/ranking/Campeões de hoje, e liberar pra todos quando ele mandar.


## 💸 META DO MÊS SOMA SOZINHA (17/10) — ✅ NO AR
- Diego: *"a barra deve somar sozinha. Só da Vadico que eu tenho que te avisar"*. A % agora é `esc_meta_mes_pct(mes)` =
  (Pix integrado liberado no mês, fora a conta do Diego + `esc_meta_entradas`) ÷ `esc_meta_mes.custo` (R$ 1.600 = Supabase
  1.000 + Claude 600). Mês sem linha usa o último custo (novembro começa em 0% sozinho).
- 📌 **PATROCÍNIO DA VADICO É MENSAL (R$ 250)**: toda vez que o Diego avisar que pagou, lançar
  `insert into esc_meta_entradas (mes, valor, descricao) values ('AAAA-MM', 250, 'Patrocínio mensal Vadico …')`. Outubro já lançado (17/10).

## 🏆 MINHAS LIGAS: "não consigo continuar a liga" (17/10) — ✅ itens 2 e 4 + o DONO do item 1 CONSERTADOS; resto abaixo
- ✅ FEITO 17/10: (1) o DONO da liga não apaga mais a própria cadeira ao sair (`leaveRoom` ramo liga + `GO_LOBBY`); (2) "Voltar"
  que não abre a partida agora tenta reabrir a sala de espera da liga (`esc_liga_reabre`) e, se não der, AVISA o porquê;
  (4) dono sozinho no "novo leilão" e o `catch` do `startLeilao` gravam `screen:'lobby'` (`voltaEsperaNoBanco`, screens.tsx).
- ⏳ FICOU: guardar a cadeira dos CONVIDADOS ao sair (risco de assento — "virei bot" — estudar antes), item 3 e item 5.
- Diego: *"quando acaba o jogo e eles querem continuar a liga… não conseguem, sempre dá um erro"*. Leitura do código (sem rodar):
  1. **Quem aperta "Voltar pra tela inicial"/"Sair" PERDE A CADEIRA** — `GO_LOBBY` → `leaveOnlineRoom` apaga a linha de
     `room_players` também em liga (store.tsx ~13142, 11651). A liga some de "Minhas ligas" do convidado, no "mesmo time" ele vira
     CPU, e até o DONO sem linha não restaura (`triggerStartRaw`: `if (!myPl) return false`, lobby.tsx ~1392).
  2. **"Voltar" mudo** — `enterRoom` ignora o `false` do `triggerStart` (lobby.tsx ~2361): o botão não faz nada e não avisa.
  3. **Faixa "voltar pra partida" velha** depois do "Chamar mais gente": 5 tentativas e "Não consegui retomar" (lobby.tsx ~1467/1596).
  4. **Dois caminhos voltam pra espera sem zerar a tela no banco** (mesma raiz do bug do Bruno 18/09): dono SOZINHO no "Abrir novo
     leilão" (screens.tsx ~10418, só `status:'waiting'`) e o `catch` do `startLeilao` (~10493, status fica 'started'). Resultado:
     reabre o jogo VELHO sem os amigos novos.
  5. Menores: número da temporada pula 1 (`ligaRepeteTemporada` não chega no banco), liga antiga sem `ligaMode` não tem "Chamar mais
     gente", sala de espera com 1 pessoa não avisa nada.
- Proposta (esperando OK): liga GUARDA a cadeira de todo mundo ao sair; "Voltar" que falha avisa e tenta o caminho de reabrir;
  os 2 caminhos do item 4 gravam `screen:'lobby'` igual o "Chamar mais gente".
- ⭐ **Vice da liga** (mockup `scripts/mockups/liga-vice.png`, ✅ APROVADO 17/10 *"está sim"*, reconfirmado 19/10 *"aprova o da minhas ligas tb"*).
  ✅ **FEITO 19/10, em teste SÓ nas contas do Diego** (`LIGA_VICE_GERAL = false` em `sport.ts`; true = todos). Banco
  (`20261019260000_liga_vice.sql`): `game_rooms.liga_dono` (o dono pra sempre; `host_id` = quem comanda a partida) e `liga_vice`;
  `esc_liga_vice` (só o dono marca/tira) · `esc_liga_vice_abrir` (só o vice, só na espera, dono sem sinal há 2 min) ·
  `esc_liga_dono_aqui` (o dono na espera avisa a cada 60s e RETOMA o comando — só na espera, nunca no meio do pregão; ao
  "Guardar e sair" avisa que saiu e o vice não espera os 2 min). `liga_patch`/`esc_liga_modo` = só o DONO. O vice não exclui
  a liga (RLS) e não tira o dono da sala (`players_delete`). Testado no banco: as 14 regras deram certo.
  ⏳ Falta: o Diego testar com as 2 contas dele (diego e diego2) e dar OK pra liberar pra todos.
- ✅ **Trocar o modo da liga: NO AR 17/10** (*"perfeito, pode fazer, pode publicar"*). Caixa "🎮 Modo da próxima temporada" na
  sala de espera da liga (lobby.tsx); só o dono troca, pela função do banco `esc_liga_modo` (recusa não-dono e partida rolando;
  Clubes força baralho Todos; Só Champions não aceita pregão aberto). Amigos recebem UM aviso no canal (`liga_modo`). O save do
  dono agora grava `clubes` a partir do estado da partida (senão a guarda velha devolvia Clubes). Pra trocar no fim de uma
  temporada, o dono vai pra sala de espera ("📣 Chamar mais gente" ou "Guardar e sair" e voltar). Excluir a liga continua no 🗑️.
- (pedido original) 🔁 **Trocar o modo da liga** (pedido 17/10, MOCKUP ANTES): dono troca entre temporadas o lance (envelope/Tocaia/pregão aberto),
  o tipo (Jogador/Clubes) e o baralho (BR/EU/Todos/Mundo) — *"continua com os mesmos troféus e etc"* (estante e ranking ficam).

## 🍀7️⃣ Seven City: ARTE NOVA preta e dourada (17/10) — ✅ NO AR
- O dono não gostou da gala com a arte verde e mandou escudo/mascote/camisa NOVOS (*"ele quer esse escudo manto e mascote aqui e
  faça a gala com esse também"*). Arquivos `-v2` (escudo 266×360/29 KB · mascote 363×440/40 KB · camisa da Loja v2); os antigos
  ficam no repo sem uso. Manto remedido: preto #0F0E0D + dourado #D99E44 (código + `esc_socios`), 3ª cor `trevo_seven` = branco
  #F0EDE2 da faixa central. Mascote agora é o boleiro de chapéu preto com a moeda: nome PROVISÓRIO "O Sortudo" (confirmar).
- Gala "Jackpot da Sorte" refeita em preto e dourado com o mascote novo (`scripts/posts/gala-seven-com-canto.mp4`).

## 🍀7️⃣ Seven City: gala "Jackpot da Sorte" (17/10) — ✅ NO AR (*"pode publicar"*), gala + canto na carreira
- Pedido do Diego: supersticioso, 7 é o número da sorte, trevos, canto do Gaviões. `gala-seven.tsx` (8,6 s): máquina caça-níquel
  dourada "SEVEN CITY", roletas param 7·7·7, JACKPOT com chuva de moedas e trevos, escudo com SETE trevos em volta, o Trevo do
  clube jogando a moeda, faixa "SORTE TAMBÉM JOGA". Vídeo `scripts/posts/gala-seven-com-canto.mp4`.
- Pra ligar: `'Seven City': { ms: SEVEN_MS, Show: GalaSeven }` em `GALA_UNICA` (entrada-gala.tsx) + canto na carreira
  (`'glaucomiranda@outlook.com': 'sfx/torcida-gavioes-v1.mp3'` em `AMBIENTE_CARREIRA_POR_EMAIL`). Gala única é do plano Fundador:
  conferir/gravar `esc_compras_batismo` = plus pro glaucomiranda se for o caso.

## 🤠🔵 Batismo Cuiudos FC (17/10, plano 🖋 Fundador) — ✅ NO AR
- Dono `matheussoaresg2018@gmail.com` (conta desde 14/09; compra 'plus' já registrada). **Série A**, no assento do
  **Papão United Madrid**, que DESCEU pra **Série C** (decisão do Diego) na vaga do bot Goiaba FC (saiu da pirâmide). Sem OLD_NAME.
- Arte do dono (prancha chroma com as peças encostadas — recorte por região, não pelo script padrão): escudo 276×360/29 KB ·
  mascote "O Cuiudo" 267×440/39 KB · camisa da Loja. Manto medido: azul #02308B (77%) + amarelo #E7AC0B.
- Banco: ouro/manual · fundador nº91 · sócio nº75 · nome "Cuiudos" reservado (+FC/EC pelo gatilho).
- ⚠️ A mascote segura um cartaz com um político de terno (arte do dono). Avisei o Diego; ele não pediu pra mudar.
- 📣 Canto: o MESMO do Corinthians do Gaviões (`torcida-gavioes-v1.mp3`) na carreira dele — ✅ no ar (17/10).
- ✨ Gala "Rodeio dos Cuiudos" (`gala-cuiudos.tsx`, 8,6 s): porteira fecha/abre, caminhonete freia, chapéu de vaqueiro sobe,
  laço laça o escudo, placa "SÓ OS CUIUDOS", fogos verde/amarelo. SEM a mascote (cartaz com político). Vídeo
  `scripts/posts/gala-cuiudos-com-canto.mp4`. ✅ APROVADA e no ar (17/10, *"publica"*).
- Falta: time de coração e nome do dono pro post (`scripts/posts/cuiudos-post.png`).

- 📢 17/10: mais 2 anúncios MANUAIS na placa depois da Vadico (`GIRO_MANUAIS`): ▶️ Kelvin Oliveira · canal do K9 no YouTube
  (youtube.com/@kelvink9oliveira) e 💍 Max Joias · Compramos ouro (WhatsApp +55 21 96471-7601, com mensagem pronta).

- 📢 17/10: o Anúncio do dia entrou também na CARREIRA (aba Jogos, embaixo do giro de frases), nas duas caras da carreira
  (visual novo `ll29-board` e o antigo). Antes só existia na temporada da partida rápida/online (`EscSeason`).

- 📰❌ 17/10: anúncio do O MARTELO REMOVIDO (*"remova propaganda do martelo"*, `ANUNCIO_MARTELO_LIGADO = false`). Na Loja
  (patrocínio mensal) o item virou "⚽ Placa digital atrás dos gols, nos campinhos do pregão". Não repropor anúncio no jornal.

## 📡 MENSAGENS DO SUPABASE (17/10) — Diego: *"só o que for seguro… não quero nenhum bug na sala… e que eu possa reverter"*
- Medidor (3 dias, `esc_realtime_medidor`): estado da sala 42% · sala de espera recebendo a linha inteira a cada 3s 23% ·
  emojis 13% · presença 7% · pedido de tela 5%. O medidor vê ~20 mi/mês; a fatura diz ~50 mi.
- ✅ FEITO: reação/zoeira no máximo 1 a cada 2s por pessoa (`EMOTE_ESPERA_MS`, partida + sala de espera). Reverter = 0.
- 🚫 NÃO FEITO (não é 100% seguro): o batimento de 3s do save do dono é lido pela checagem da COROA (`saveFresco` < 9s);
  espaçar mexe na regra da coroa. O "pedido de tela só pro dono" tem janela de deploy (convidado novo × dono velho).
  Só reabrir com o Diego.
- ⚠️ `npm run` da trava `scripts/testa-mascote-lance.mjs` já falhava antes de 17/10 (7 falhas) — olhar.

- 🎬 Vídeo do pregão aberto no PADRÃO dos reels (17/10, Diego: *"o vídeo tá saindo cortado… quero no padrão dos outros"*): `node scripts/video-pregao-aberto-reels.mjs` → `scripts/posts/pregao-aberto-reels.mp4` (1080×1920, 42s). Gravar a tela do jogo com o recordVideo saiu cortado — o padrão é o reel animado em cenas.

- 🧹 17/10 (Diego: *"no máximo 4 emojis… cada modo tem um tipo"*): zoeira do envelope 5→4 (saiu o 💸, que já é cantada da carta);
  Monte 6→4 por modo — Jogador: 👆 🐢 🗑️ 🤡 · 🧱 Clubes: 👆 🐢 🧱 "pacote de reserva" 🤏. Tocaia (4), cantada da carta (3) e sala de
  espera (4) já estavam no teto. Pregão aberto: atalhos de lance **+1 · +2 · +5 · +10** numa mesa e **+1 · +5 · +10** na carta dupla ("lance de dez… seria mais rápido"), com o "outro" na linha de baixo. Criar sala: com 🔨 Pregão aberto
  marcado, a ⭐ Só Champions fica travada com o selo "fora do pregão" (36 clubes = pregão longo demais).

- 👑 17/10 (Diego, jogando com 5: *"apareceu poucas lendas… aumente proporcionalmente… só para o pregão aberto"*): `paMaisLendas` troca craques por lendas da mesma posição até `PA_LENDAS_POR_CLUBE` = 2,4 por clube (2 → 5 · 5 → 12 · 10 → 24 · 20 → 48; antes ~1,5). Catálogo ativo (Várzea fica sem lenda), nunca repete nome. Envelope/Tocaia/Clubes intactos.
- 💬 18/10: **Recado em destaque** (recado 1 h 2,99 · dia 9,90) e **anúncio de 1 hora** (4,99) FEITOS e publicados. Banco: migração `20261018120000_recado_e_anuncio_1h.sql` + filtro de palavrão por começo de palavra; função do Pix `mp-criar-pix` v9. As funções antigas (`esc_mp_anuncio_giro`/`esc_mp_anuncio_pendente`) continuam pra quem estiver com o jogo velho aberto. Testado no banco com pedido de mentira dentro de transação desfeita (nada ficou salvo). ⚠️ Ainda não teve um Pix de verdade desses produtos — no 1º, conferir no #admin.
- 🏆📞 17/10: **Patrocinador Master com história** FEITO e publicado (meta + bônus, ligação pra renovar, rescisão de quem cai). Contrato antigo (sem meta) continua igual; ele ainda pode receber a ligação se terminar no top 4. Fornecedor de material NÃO mudou.
- 🖥️ 17/10: **análise do jogo no COMPUTADOR** (prints em 1440px). Consertado: pregão aberto com 2 mesas (carta com teto de 230px, o lance não sai mais da tela) e Patrocinador Master (5 contratos lado a lado no PC; texto "cinco contratos"). **Ficou de sugestão, sem OK ainda:** no PC, leilão envelope/Tocaia/revelação/Monte em 2 colunas (lista de um lado, campinho do outro) e nomes cortados na lista do Elenco da carreira. **Não analisado:** online por dentro (salas, espera, Minhas Ligas) — precisa de login; pedir print do Diego.
- 🔠 17/10: mesa dupla com letra maior foi publicada e **desfeita no mesmo dia** (Diego: "muito exagerado o tamanho das fontes"). Ficou só o alinhamento (nome com 2 linhas + linha do "uma… duas…" reservada). Ofereci só passar o nome de quem lidera pra linha de baixo (sem aumentar letra) — sem resposta.
- 📦 17/10: **Leilão de Clubes = pessoas + 1 pacote por posição** (regra do leilão de jogador), nos três jeitos de lance. Antes pessoas + metade. Simulado: envelope e Tocaia com 2, 8 e 20 pessoas, todo mundo fecha o time (sala de 20 às vezes vem com 20 meias, sem sobra, por falta de clube — ok). Continua havendo a repescagem antes do Monte no envelope.
- 🔁 17/10: a ÚLTIMA CHAMADA (11 cartas no fim) SAIU (Diego ficou com medo de 1 pessoa sozinha esperando). No lugar: **+1 carta de sobra por clube** misturada desde o começo (`paSobraExtra`, `PA_SOBRA_POR_CLUBE`; antes eram só ~5 a mais no total: 2 pessoas 27→29 pra 22 vagas · 20 pessoas 225→245 pra 220) — 🔁 **e SAIU no mesmo dia**: Diego quis a sobra no padrão do envelope/Tocaia (demanda + 1 por posição, ~+5 no total). Medido antes: a +1 por clube custava ~1 min numa sala de 20 + faixa vermelha **"⏳ FALTAM N CARTAS · corre que tá acabando!"** nas últimas 11 (`PA_ALERTA_FIM`). Vaga vazia no fim continua ganhando jogador de graça. Também: janela "seu time fechou de graça" com letra preta.
## 🔨🌐 PREGÃO ABERTO NA SALA ONLINE (17/10) — ✅ NO AR PRA TODOS (`PREGAO_ABERTO_GERAL = true`, Diego: "pode publicar… para todo mundo")
- Criar sala: "Como é o leilão" ganha a 3ª opção 🔨 Pregão aberto (só contas de teste via `usePregaoAberto`; some na Só
  Champions = teto de 20 clubes). `game_state.pregaoAberto` → `START_ONLINE` → `s.pregaoAberto` (e no "novo leilão").
  Selo verde 🔨 PREGÃO ABERTO na lista (coluna nova `ls_pregao`, trigger `game_rooms_colunas_magras` já atualizado no banco)
  e na sala de espera. Print: `scripts/mockups/criar-sala-pregao-aberto.png`.
- 📡 Mensagens: tique sem novidade devolve o MESMO estado (`paAssinatura`), então o dono só manda a tela quando há lance/
  martelo/carta nova — 26% dos tiques em vez de 100% (trava mede). O dado do robô passou a usar o relógio, não `pa.tiques`.
- ⏱️ Contagem pelo relógio do dono (`agoraSala`); martelo online espera +400 ms (`PA_FOLGA_ONLINE_MS`) pelo lance em trânsito.
- 🌐 Lance leva `cardId` (lance atrasado de carta que já saiu é recusado) e vai pela estrada reserva (`room_acoes`), igual
  ao PEGAR da Tocaia. Lance que não valeu mostra o porquê ("alguém cobriu antes… mínimo agora X" / "o martelo bateu antes"
  / "não chegou, tenta de novo"). Tetos dos robôs saem do que viaja (`sanitize`).
- Duplas: funciona pela trava de sempre (`duplaPodeAgir`: só quem manda na posição lança). Categoria MONTE não se usa.
- Depois de publicar: medir no `esc_realtime_medidor` as salas com `ls_pregao = 'true'` antes de liberar geral.

## 🧱🔨 PREGÃO ABERTO + LEILÃO DE CLUBES (17/10) — ✅ NO AR
- Diego: *"apareceu envelope de clubes e não o leilão aberto… teria que aparecer o escudo dos times, quantos jogadores por
  posição e sem precisar se transformar em carta dourada"*. Causa: `!state.leilaoClubes` no `startSector` mandava Clubes pro envelope.
- Agora o lote na mesa é o PACOTE: escudo + "Goleiros do Corinthians" + "👥 9 jogadores" (`PacoteMesa`, pregao-aberto.tsx), sem
  carta coberta e sem virar. Nomes continuam só na convocação (regra 27/09). Duas mesas a partir de 11 vale igual.
- Motor: teto do robô pelo PESO do setor na formação (`paTeto`), setor sem pacote no fim ganha um pacote que sobrou de graça
  (`paCompletaElencos`), pacotes que ninguém levou viram sobra da convocação (`paFecha` → `monte`). Trava `npm run pregao-aberto`
  ganhou a partida de clubes (8 clubes ≈ 8 min, termina na convocação). Prints em `scripts/mockups/pregao-aberto-clubes*.png`.

## 💳 LENDA 44,90 · BATISMO→FUNDADOR 29,90 · 💾 FICHA DE CARREIRA 9,99 NA LOJA (17/10) — ✅ NO AR
- Lenda 49,90 → **44,90**. Subidas: Craque→Lenda 20 · Lenda→Batismo 40 · Lenda→Fundador 60 · Craque→Batismo 55 ·
  Craque→Fundador 75 · **Batismo→Fundador 29,90 fixo** (era 25). Duplo do Lenda 89,90 → **80,90**. Código (`planos-regras.ts`)
  e banco (`esc_mp_preco`/`esc_mp_preco_ref`) mudados juntos — SQL em `docs/sql/loja-ficha-e-precos-1710.sql`.
- 💾 Ficha extra de carreira R$ 9,99 na Loja (só Pix novo, só logado): `esc_fichas_extras` + `esc_minhas_fichas_extras()`,
  entrega no `esc_mp_entregar`, função `mp-criar-pix` v7. Some da Loja quando plano + extras chega em 8 (teto de guarda).
  Testado no banco com rollback: 9,99 → liberado → +1.
- 🐛 de quebra: o produto `giro_dia` (Anúncio no giro, R$ 25) NÃO estava na trava `esc_mp_pedidos_produto_check` — o Pix dele
  ia falhar. Entrou junto.
- 💛 Plano duplo na VITRINE de planos também (Diego: "sim"): `DuploLinha` (presente.tsx), embaixo do botão de cada plano.
  ✅ no ar (Diego: "sim", 17/10).
- 🔒 Botão Manual da carreira (sem plano) agora abre a VITRINE de planos pelo topo ("pra onde vai o dinheiro"), não mais a
  trava do Craque (Diego 17/10). ✅ no ar. (O cadeado da partida rápida, `QuickManualLock`, continua na trava do Craque.)

## 🏆🪙 PRÊMIO DO RANKING DA SEMANA (17/10) — ✅ NO AR (avisos em scripts/posts/aviso-2026-10-17-*)
- Diego: *"quem ficar entre os 3 ganha moedas na carreira… cai direto na conta após acabar a semana… 1º 20 · 2º 10 · 3º 5"*.
- Banco (já no ar, não paga nada sozinho): `esc_fecha_semanas()` fecha toda semana terminada desde 12/10 (mesma régua da
  vitrine: títulos online, segunda 0h Brasília, `rank()` — empate divide a posição e os dois levam) e grava o top 3 em
  `esc_premio_semana`. `esc_meus_premios_semana()` / `esc_resgata_premio_semana(semana, seed)` (1× por semana). SQL em
  `docs/sql/ranking-semana-premio.sql`. Só quem tem conta (user_id).
- Jogo: `PremioSemana` (pyramidseason) credita na 1ª carreira solo que a pessoa abrir depois da semana fechar, com aviso
  verde "🏆 +20 🪙 · 1º no Ranking da Semana!" e linha no extrato. Valor em `RANKING_SEMANA_MOEDAS` (store.tsx).
- Linha verde discreta embaixo do ranking: "🪙 E leva moedas pra carreira quando a semana fecha: 1º 20 · 2º 10 · 3º 5".
- 1ª semana paga: 12/10 → 18/10 (fecha segunda 19/10). Hoje o top 3 seria Labubu F.C 45 · NeymarJR 36 · Gama FC 34.

## 🏟️ PLACAS ATRÁS DOS GOLS em todo campinho + Anúncio do dia mais discreto (17/10) — ✅ NO AR
- Diego escolheu a ideia 1 de `scripts/mockups/campinho-outras-ideias.png` (*"perfeito pode fazer mas no momento coloque Vadico
  Veículos e Max Joias"*). `PlacaGol` (patrocinio-visual.tsx): placa em cima e embaixo do campo, cada uma numa marca, trocando
  juntas a cada 7 s pelo relógio (Date.now). Lista `PLACAS_CAMPO` em patrocinio.ts (Vadico no branco, Max Joias no preto); com 1
  marca só a outra placa vira "Leilão Legends". Nos 5 campinhos: leilão (`Campinho`), elenco da carreira, convocação da Copa do
  Mundo, convocação do Leilão de Clubes e convocação internacional. Saiu a faixa branca fixa da Vadico embaixo do campinho.
- Anúncio do dia (*"falta espaço entre a propaganda e a tabela… tire essa faixa de anúncio do dia"*): saiu a faixa creme de
  título; "📢 ANÚNCIO DO DIA" virou etiqueta DENTRO da placa; 16 px de folga embaixo. (O atalho pra Loja pelo título saiu junto.)

## 🥅 Cena do GOOOL cortada no topo (17/10) — ✅ consertado
- Print do Diego: a arte do gol (mascote + GOOOL) começava 36–46px abaixo do topo do placar (o lugar da faixa de narração,
  que foi pro rádio em 16/10) e os escudos apareciam por cima. Com a narração no rádio, a cena agora cobre o placar inteiro
  (`ll43-sem-faixa` em online-match-visual).
- 📢 Letreiro "Anúncio do dia" virou a PLACA (17/10, ✅ NO AR — *"é melhor esse aqui mesmo… publique já"*, escolheu o mockup
  `scripts/mockups/anuncio-do-dia-placa.mp4` contra as 4 outras ideias): um anúncio por vez, parado e inteiro, marca em cima
  (cor do anúncio) e oferta embaixo, letras virando a cada 7 s (`PLACA_MS`), barrinha de tempo, relógio pelo Date.now (a sala
  vê o mesmo anúncio e nada recomeça quando a tela remonta). Marca = texto até o 1º " · " (se tiver até 30 letras).
  🔗 Tocar na Vadico abre a oferta do Haval H6 no site dela (`GIRO_ANUNCIO_LINK`). Só anúncio MANUAL leva link; o pago de
  24 h não (texto do comprador vai pro ar sem revisão — link ali seria porta pra golpe).

## 🥇 ARTILHEIRO DAS OUTRAS COMPETIÇÕES PAGA 30 🪙 (17/10) — ✅ NO AR
- Diego perguntou se o artilheiro ainda ganhava moeda (ganha: liga A 30 · B 20 · C 15 · D 10 · V 6 · Copa Legends 16 · Copa do
  Brasil 10, mas cai MISTURADO na linha "🏆 Prêmios da temporada" do extrato). Aí pediu: *"falta mundo, libertadores,
  champions, mundial e supercopa, então coloque 30 moedas"*. Feito: Copa do Mundo (artilheiro jogando pela SUA seleção) ·
  Libertadores · Champions · Mundial (time que você comandou; cada competição tem o próprio artilheiro) · Supercopa. As 4
  primeiras ganham linha própria no extrato ("🥇 Artilheiro da …"); a Supercopa entra nos prêmios da temporada.
- ✅ **17/10: o artilheiro ganhou LINHA PRÓPRIA no extrato** (Diego: *"tem usuário reclamando que parece que não tem ganho com
  artilheiro… não aparece em lugar nenhum"*). Liga por série, Copa Legends/Copa do Brasil e Supercopa saem de dentro de "Prêmios da
  temporada" e viram "🥇 Artilheiro da Série A: Johan Cruyff (20 gols) +30" (`artilheirosDaTemporada` monta a lista; `applySeasonMoney`
  separa sem mudar o total). Na tela do Caixa do roteiro a linha 🥇 aparece SEMPRE, mesmo fora dos 5 maiores.
- ⚠️ `npm run copamundo` já falhava ANTES desta mudança ("jogo de copa só conta com a Copa encerrada na tela") — não é daqui.

## 🦁🔵 Batismo Chelsão da Massa FC (16/10) — ✅ NO AR
- Dono `ccaonta@gmail.com` (conta desde 12/10, já tinha comprado o Batismo: `esc_compras_batismo` = lenda). **Série C**, no
  assento do bot **CRBebê** (`OLD_NAME` leva save com CRBebê/Peteca FR pro nome novo).
- Arte do dono (prancha no verde chroma, `recorta-prancha-chroma.py`): escudo 246×360/28 KB · mascote "O Leão da Massa"
  297×440/44 KB · camisa da Loja (`public/mantos-salao/chelsao-camisa-v1.webp`). Manto medido: azul #032169 (77%) + dourado
  #E4A745 (frisos e leão do peito).
- Banco: ouro/manual (já estava) · sócio nº74 · nomes reservados "Chelsão da Massa" e "Chelsao da Massa" (+FC/EC pelo gatilho).
  **Sem número de fundador** (regra 14/10) → `SEM_FUNDADOR` no checa-batismos.
- Falta: **time de coração** e **nome do dono** pro post (`scripts/posts/chelsao-post.png` saiu com "batizado por —").

## 📣 ANÚNCIO DO DIA SELF-SERVICE + LOJA DE ANÚNCIO PRA TODOS (16/10) — ✅ NO AR
- Diego: *"pode liberar tudo já pro geral, mostrar pra todos e Pix também"* → `PATROCINIO_GERAL = true` (seção "Sua marca no jogo").
- O comprador do 📣 Anúncio do dia (R$ 25) ESCREVE o próprio texto logo depois do Pix (`EscreveAnuncio`, pix-mp.tsx), até **82
  letras** (`ANUNCIO_MAX` = o tamanho do texto da Vadico), confirma e ele entra no ar NA HORA por 24 h. Quem decide é o servidor
  (`esc_mp_anuncio_giro`: dono + produto `giro_dia` + pedido pago/liberado, 1 anúncio por pedido). Fechou sem escrever? A Loja mostra
  o campo de novo (`AnunciosPendentes` / `esc_mp_anuncio_pendente`).
- No letreiro: pago em VERDE, a Vadico (manual) em DOURADO, um depois do outro.
- ⚠️ Não tem moderação antes de ir pro ar: se alguém escrever besteira, o Diego tira no #admin (📣 Anúncio do dia → "tirar").

## 📢 O GIRO DA RODADA ACABOU: AGORA É "ANÚNCIO DO DIA" (16/10) — ✅ NO AR
- Diego: *"não vai ter mais giro da rodada… agora é só propaganda ali… não quero mais nada em relação ao jogo"*. O letreiro
  (`GiroDaRodada`, screens.tsx) mostra SÓ anúncio (avulso do dia `esc_giro_anuncio` + mensal `GIRO_ANUNCIO`), dourado e devagar.
  Título "📢 ANÚNCIO DO DIA" (o botão "Anuncie aqui" SAIU — *"tire esse Anuncie aqui, já tem anúncio do dia"*; o próprio título
  leva pra Loja onde a seção existe). Sem anunciante: "Este espaço pode ser seu".
- ⏱️ **REGRA (16/10): anúncio PAGO dura 24 h desde que entra no ar**; só os MANUAIS (mensal, tipo Vadico, no código) ficam até o
  Diego trocar. Tabela única `esc_anuncios` (tipo 'marca' = Dia da marca na Copa dos 8 · 'giro' = Anúncio do dia), #admin com
  "Pôr no ar" (data/hora, padrão agora) e "tirar". `esc_dia_marca`/`esc_giro_anuncio` ficaram vazias e sem uso.
  Nada de "Clássico da sala"/resultado ali. `traduzManchete`/`corDoLed` ficaram exportadas caso ele queira o giro de volta.
- ⚠️ O botão "Anuncie aqui" só aparece onde a seção "Sua marca no jogo" da Loja existe — hoje só nas contas do Diego
  (`PATROCINIO_GERAL = false`). Pra ele aparecer pra TODOS, ligar `PATROCINIO_GERAL` (falta o OK dele: quem não tem o Pix MP
  pagaria no Pix de sempre + comprovante no Instagram).

## 🚗 VADICO NOS 3 ESPAÇOS DA TELA (16/10) — ✅ NO AR PRA TODOS (*"o resto já pode publicar… LED no estádio faça também"*)
- Champions Legends "apresentada por Vadico Veículos" liberada pra todos (`ESPACOS_GERAL = true` em `patrocinio.ts`).
  Copa dos 8 **sem** Vadico (ordem dele: *"já vai ter na Champions"*) — ela só ganha marca no Dia da marca.
- 🏟️ LED do estádio: letreiro verde passando no topo do palco das partidas online (`LedEstadio`, `patrocinio-visual.tsx`),
  lista `LED_ESTADIO` (mais de um mensal = passam um atrás do outro). Placar não mudou.
- 📰 Anúncio no O MARTELO: quadro com a logo no FIM do jornal — **Diego NÃO gostou** (*"até agora gostei só do apresentado por"*);
  desligado e RELIGADO no mesmo dia (*"coloque o anúncio no Martelo no final sim"*). LED corrigido: só "VADICO VEÍCULOS" passando.
- 📣 Anúncio no GIRO DA RODADA (`GIRO_ANUNCIO`): última manchete do letreiro, em BRANCO, com o letreiro um pouco mais lento
  quando tem anúncio. Texto de hoje: "Vadico Veículos · Oferta do dia: GWM Haval H6 0 km blindado · Menor valor do Rio".
  Trocar a oferta = trocar essa linha.
- 📣 **ANUNCIE AQUI (16/10)**: o título do giro virou o botão "📣 Anuncie aqui ›", que abre a Loja já na seção "Sua marca no
  jogo". Lá, embaixo do Dia da marca (R$ 50), entrou o **Anúncio no giro · 1 dia — R$ 25** (Pix MP, produto `giro_dia`; preço no
  banco `esc_mp_preco_ref`; Edge `mp-criar-pix` v6). Depois do Pix aparece o WhatsApp do Diego. O Diego marca dia + texto no
  #admin (📣 Anúncio no giro → `esc_giro_anuncio`) e naquele dia o texto passa em branco no giro de todo mundo, antes do mensal.
  ⚠️ O botão "Anuncie aqui" e a seção da Loja ainda aparecem SÓ nas contas do Diego (`PATROCINIO_GERAL`/`patrocinioLojaOk`) e o
  Pix MP também (`PIX_MP`). Pra abrir pra todos: ligar os dois (falta o 1º pagamento real de teste).
- A seção da Loja "Sua marca no jogo" continua só nas contas do Diego (`PATROCINIO_GERAL = false`).
- Falta: Vitrine dos patrocinadores; o anúncio ainda não entra na IMAGEM de compartilhar do jornal (só na tela).

## 🎙️ NARRAÇÃO NUM LUGAR SÓ (16/10) — ✅ NO AR (ele escolheu a OPÇÃO B: *"B"*)
- Feito: com `narracaoNoRadio` a faixa de cima do placar SAI e o 📻 RÁDIO LEGENDS leva tudo, por prioridade (apito final ·
  gol · chance do golzinho · apito inicial/intervalo · cartão da Kings · frase do rádio · retrospecto), com selo por tipo
  (⚽ GOL · 🥅 LANCE · 📻 JOGO) e a fala anterior apagadinha embaixo (`falaMem` em `pyramidseason.tsx`, `LinhaFala` em
  `online-match-visual.tsx`). Chance agora fala o NOME do jogador em todo jogo (antes só Kings) e ganhou +8 frases por tipo
  (defendeu · trave · fora · isolou = 14 cada). Basquete e rodada instantânea seguem como antes (sem rádio = faixa de cima).
- Reverter: tirar o `narracaoNoRadio` do `LiveScoreCard` volta as duas falas como eram.
- Diego: *"não tá tendo muito sentido o rádio com as legendas no topo… em cima tem narração e no rádio também. Tem que juntar
  todo tipo de frase num lugar só… e mais variedade, falar mais o nome dos jogadores: vai chutar, chutou pra fora, fez o gol"*.
- Hoje: topo do placar (`ll25-narration`, frases de chance/gol de `chances.ts`/`lances.ts`) + 📻 rádio embaixo do golzinho
  (`ll42-radio`, `radio.ts`, que é PROIBIDA de narrar chute e gol). Mockup `node scripts/mockup-narracao-um-lugar.mjs` →
  `scripts/mockups/narracao-um-lugar.png`: A = tudo numa faixa no TOPO (recomendei) · B = tudo no rádio embaixo.
- Depois do OK: juntar as três fontes numa fila só por minuto, liberar a rádio pra chute/trave/defesa/gol COM NOME, e manter
  pênalti fora e nada que entregue o placar antes da hora. Vale pro online, carreira e Kings (mesmo placar).

## 🦅⚫⚪ GAVIÕES SCCP VIROU 🖋 FUNDADOR (16/10) — ✅ NO AR: banco + gala v3 "Aqui é Fiel" + canto (aprovado pelo Diego)
- kauealves584 já tinha fundador nº83; gravado `esc_compras_batismo` = plus (16/10).
- 📣 Canto: 12 s de "Todo Poderoso Timão" (o áudio que o Diego mandou, trecho 3,2 s → 15,2 s, de pausa a pausa) →
  `public/sfx/torcida-gavioes-v1.mp3` (mono 32 kHz 56 kbps, −20,6 dB igual ao Fabulous). Carreira (`AMBIENTE_CARREIRA_POR_EMAIL`) + gala.
- ✨ Gala `gala-gavioes.tsx` (8 s): estádio preto e branco, bandeiras listradas, bando de gaviões no céu, fumaça P&B, o Gavião
  do clube mergulha e solta penas, escudo acende → "O BANDO DE LOUCOS CHEGOU". Nada de marca oficial do Corinthians/torcida.
  🔁 v2 "O ataque do Gavião" (Diego: *"quero outra ideia melhor, mais impactante"*): olho gigante pisca → o Gavião voa na câmera →
  a tela estilhaça → bandeirão listrado sobe → bando gira em volta do escudo + LED "TODO PODEROSO" (8,6 s).
  🔁 v3 "AQUI É FIEL" (Diego não entendeu o olho e sentiu falta do Corinthians → *"ok faz"*): torcida P&B pulando +
  sinalizadores → bandeirão "TIMÃO" sobe e desce → mosaico de cartões vira o escudo → escudo sobe e o Gavião sai do mosaico
  com rajada de vento → faixa "CHEGOU NA SALA · AQUI É FIEL" (8,6 s).
  Vídeo: `node scripts/video-gala-gavioes.mjs` → `scripts/posts/gala-gavioes-com-canto.mp4`. Registrada em `GALA_UNICA`.

## 💼 LOJA: "SUA MARCA NO JOGO" + WhatsApp do Diego (16/10) — ✅ publicado (seção de marca só nas contas do Diego)
- WhatsApp do Diego **(21) 99888-6982** (`WHATSAPP_CONTATO` em pix-mp.tsx): aparece depois do Pix de Batismo/Fundador/canto (briefing),
  na linha "💬 Dúvida sobre Batismo ou Fundador?" embaixo dos planos na Loja (pra TODOS) e depois do Pix do Dia da marca.
- Seção "💼 Sua marca no jogo" (gate `patrocinioLojaOk`): ⚡ Dia da marca R$ 50 (Pix MP, produto `dia_marca`; depois do Pix mostra
  WhatsApp + Instagram pra combinar dia/nome/bio/cupom) e 📅 mensal SEM preço (o que vem + direct @leilaolegendscom + e-mail).
- ✅ Edge Function `mp-criar-pix` v5 PUBLICADA (16/10, OK do Diego) com `dia_marca`,
  `moedas_500`, `moedas_1000`. Banco aceita (`esc_mp_preco_ref` → 50,00). Mensal: **link de pagamento da VENDRIA** que o Diego gera na hora de fechar com o mensalista (16/10:
  *"faça o mensal pelo Vendria e repasse o custo… 1,99 fixo"*) → valor + R$ 1,99. Sem código.
- 🏷️ 16/10: "naming rights" — mensal = naming rights da competição; ⚡ Dia da marca leva os naming rights da **Copa dos 8** por 24 h
  ("Copa dos 8 apresentada por…"). ✅ FEITO 16/10: o Diego marca data+marca no #admin (⚡ Dia da marca · `esc_dia_marca`) e o
  selo liga SOZINHO naquele dia pra todo mundo (`usePatrocinio` em patrocinio.ts). Champions/Vadico segue só na conta do Diego.
- 🏢 16/10: entrou **Patrocinador Master na carreira** (a marca vira uma das propostas do início da temporada, como Vadico/ERO/Max
  Jóias/Rei das Tintas/Uomo em `SPONSOR_BRANDS`) por R$ 150, e **o pacote completo (os 4) fica em R$ 500** (Diego: *"tudo de 500 pra quem
  fechar tudo"*), e **post no Instagram + aviso na comunidade do WhatsApp em QUALQUER plano** (Dia da marca, espaço mensal avulso ou pacote — Diego 16/10). Avulsos: competição 300 · LED 200 · O MARTELO 100 (Diego 16/10) · Master 150.
- 🏦 Loja segue com SÓ 3 pacotes de moedas (10 · 50 · 100); 500/1000 aceitos no Pix mas escondidos (Diego 16/10: *"deixe como tava"*).

## 🚗 VADICO VEÍCULOS: "Champions Legends apresentada por" (16/10) — ✅ NO AR só nas contas do Diego
- Diego: *"publique agora da Vadico Veículos pra eu ver como fica… deixe a Champions Legends apresentada por Vadico Veículos"*.
- `src/escalacao/patrocinio.ts` (`POR_COMPETICAO`, uma marca por competição) + selo no `CompetitionStage` (online-match-visual.tsx).
- Liberar pra todos: `PATROCINIO_GERAL = true`. Falta: logo oficial (hoje é 🚗 + nome), LED do estádio, O MARTELO, Vitrine.
- 🚫 **"Placar oferecido por" NÃO** (16/10, minha opinião aceita como pergunta dele): o placar fica limpo; o LED fica no FUNDO do
  estádio, parado ou bem devagar. Valores mantidos: competição 300 · LED do estádio 200 · O MARTELO 150 · os 3 juntos 500 · Dia 50.
- Combinado em conversa (16/10): vários mensais convivem — 1 marca por competição (até ~6), LED gira até 4 marcas, O MARTELO
  reveza por edição, Vitrine mostra todas. Combo proposto: competição + LED R$ 450 (esperando OK).

## 💛 PLANO DUPLO (✅ NO AR no Pix novo, 16/10) + 🔄 REPAGINAR CLUBE (proposta, esperando OK)
- **Plano duplo**: 2 do MESMO plano (um pra você, outro de presente) com 10% a menos, **num Pix só, já com desconto**
  (Diego: *"o valor tem que ser um só pagando, já com desconto"*). Linha discreta embaixo do plano. Proposta: Craque R$ 53,90 ·
  Lenda R$ 89,90 (arredondado pro ,90); Batismo/Fundador fora (trabalho de arte). O 2º chega como 🎁 presente (`esc_presentes`).
  Mockup: `scripts/mockups/plano-duplo.png`. ✅ FEITO (*"pode fazer isso aí"*), com Batismo 143,90 e Fundador 179,90 também:
  vai como 'presente' com ref `d-<id>` (sem deploy da Edge Function) — `esc_mp_preco_ref`/`esc_mp_entregar` + `PRECOS_DUPLO` +
  `PresenteBox duplo` + linha "💛 Leve 2" na Loja (só aparece com o Pix novo, que hoje é só das contas do Diego) + #admin mostra
  "💛 DUPLO" e põe Batismo/Fundador de presente/duplo na lista de clubes pra fazer. Nenhum pagamento real testado ainda.
- **Repaginar clube** (só batismo/Fundador, sem batismo novo; ele escolhe o que troca): proposta mascote R$ 29,90 · escudo
  R$ 24,90 · os dois R$ 44,90 · manto R$ 9,90. Briefing por escrito, sem imagem; o velho sai quando o novo entra. Esperando OK.
- Contexto (16/10): 70 clubes batizados, só 2 com canto (Geovany, Fabulous) e 5 Fundador → canto e subida pro Fundador são o
  dinheiro parado mais fácil.

## 🎁 PREGÃO ABERTO SEM MONTE + CARTA COBERTA (16/10) — ✅ NO AR (só Diego e Rossini)
- Diego: sem Monte no fim do pregão aberto; quem ficou com vaga vazia ganha profissional/bom DE GRAÇA (das sobras da mesa,
  depois do catálogo livre; só se acabar tudo entra o incógnito). Perguntei se cobrava a abertura: *"deixa sem mesmo porque
  ele já vai ter jogador fraco no time"*. Motor: `paCompletaElencos` + `paFecha` (store.tsx) → vai direto pra cerimônia;
  `state.paPresentes` guarda o que cada time ganhou. Trava: `npm run pregao-aberto` (todo time fecha, Monte vazio, tudo grátis).
- Telas (mockup `scripts/mockups/pregao-sem-monte.png`): faixa verde no topo · "ninguém quis" sem falar de Monte · janela
  "🎁 Seu time fechou de graça!" no fim com as cartas. A fazer depois do OK.
- 🔁 Ajustes do Diego (16/10): a janela do fim NÃO tem botão (some sozinha em 6s, não segura sala online) e o aviso do topo
  diz só "nunca craque nem lenda" (sem falar "profissional/bom").
- 🃏 **Carta coberta (ideia dele, mockup `scripts/mockups/carta-coberta.png`)**: no pregão aberto a carta aparece SEM
  categoria, cor, estrela e ROSTO até o martelo; aí vira e mostra tudo. Exige abrir TODA carta no mesmo preço (1), senão o
  preço de abertura (`paAbertura`) entrega a categoria. ✅ FEITO (*"ok pode fazer"*): toda carta abre em 1 (`PA_ABRE`);
  `paAbertura` ficou só como régua interna do robô. A carta vendida VIRA NO MESMO LUGAR por 2s (`PA_VIRA_MS`, Diego: *"a carta
  tem que apenas se transformar, não precisa ter uma do lado da outra"*) e ninguém lança nesse meio-tempo. A janela do fim
  (`PresentesPregao`, index.tsx) some sozinha em 6s. ⚠️ A ÚLTIMA carta do pregão não vira (vai direto pra cerimônia).

## 🧑‍💼 PRESIDENTE LIBERADO PRA TODOS (16/10) — ✅ NO AR
- Diego: *"já pode publicar p todos p personagem"* → `PRESIDENTE_CONTA_GERAL = true`. Vale: editor na 🛒 Loja (régua por plano) + Presidência da carreira.
- 🧑‍💼 **Na sala online (16/10, ✅ NO AR — Diego: "pode")**: lista de técnicos, chat (os 2) e martelo de quem levou.
  Banco: `esc_presidentes_publicos2` (docs/sql/presidente-publico.sql) devolve só visual + plano de quem é Craque+.
  Fundo do busto = cor do PLANO (Diego 16/10: ouro Lenda/Batismo/Fundador · prata Craque · grátis bolinha bege de sempre).
  Código: `presidente-avatar.tsx` (busto montado 1x por visual, guardado como imagem). Foto: `scripts/mockups/presidente-sala-online.png`.
- ⏳ Ainda faltam: capa do O MARTELO, Central Legends, perfil; e linha de gala (batismo) ainda mostra só o escudo.
- Reverter: `PRESIDENTE_CONTA_GERAL = false` em `presidente-conta.ts`.

## 💼 Patrocínio de verdade (marca real) — 3 espaços (16/10) — 👀 MOCKUP ENVIADO
- 1) nome da competição ("apresentada por") · 2) LED do estádio + linha embaixo do placar · 3) anúncio no pé do O MARTELO.
- Uma marca por espaço (ele cortou o patrocinador DENTRO do jogo por excesso). Sem casa de aposta no começo (lei + menores).
- Mockup: `node scripts/mockup-patrocinio.mjs` → `scripts/mockups/patrocinio.png`. Falta: OK dele + números de jogadores pra tabela de preço.
- Diego gostou dos 3 + **⚡ Dia da marca** (pontual: 24h tomando os 3 espaços + cartão na home com bio/cupom/relógio) e da
  **🏪 Vitrine dos patrocinadores** (logo, bio, Instagram, cupom; ordem de quem mais apoiou, **SEM ouro/prata/bronze**, só o nº).
  Cobrança: ele está entre mensal, único e leilão — recomendei MENSAL fixo (1º mês mais barato; leilão só se tiver fila).
  Dia da marca NÃO tira o mensal: home só da marca do dia · LED alternando as duas · competição e O MARTELO seguem com a do mês.
  Mockup 2: `node scripts/mockup-patrocinio-2.mjs` → `scripts/mockups/patrocinio-2.png`.

## 🛒 Loja: FICHA EXTRA DE CARREIRA — R$ 14,90 (16/10) — ⏳ A FAZER
- Diego escolheu entre as ideias de avulso: *"Ficha extra do carreira. 9 90 — guarde isso"*, e na mesma conversa subiu:
  *"ficha avulsa pode botar aí R$ 14,90"*. Mockup do cartão + 6 ideias novas pra ele escolher:
  `node scripts/mockup-loja-ideias.mjs` → `scripts/mockups/loja-ideias.png` (frase do martelo 4,90 · pacote de áudios de zoeira
  4,90 · figurinhas do chat 3,90 · capa do O MARTELO 4,90 · vitrine semanal do presidente 2,90+ · presente de avulso). ⏳ ele escolher.
- 2ª leva de ideias (mesmo dia, ele pediu *"mais ideias"*), também só visual/zoeira, ⏳ ele escolher: 🏆 taça com nome da sala
  online (4,90 por sala) · 👕 aposentar a camisa de um ídolo na carreira, vai pra Sala de Troféus (2,90) · ✨ carta brilhante do seu
  craque, só no seu elenco (2,90) · 🎉 mosaico da torcida com o nome do clube no jogo do título (4,90) · 🌧️ tema da sala online
  (noite, chuva, neve) escolhido pelo dono (4,90) · 🎙️ narrador gritando o nome do seu clube no gol, carreira (9,90) · 💌 convite de
  sala com a arte do seu clube pra mandar no zap (1,90).
- +1 ficha de carreira além do limite do plano (grátis 1 · Craque 2 · Lenda 4 · Batismo 4), igual às 🎟️ salas extras.
- Vende pelo Pix do Mercado Pago (produto novo no `esc_mp_preco`/`esc_mp_entregar` + nome na edge function).
- Mockup na Loja ANTES de codar. Nunca apagar/travar save por causa do limite.
## 🔨 PREGÃO ABERTO — o 3º jeito de dar lance (16/10) — ✅ NO AR, SÓ PRA CONTA DO DIEGO (Partida Rápida)
Diego aprovou o mockup: *"Deixa assim msm c 20 e faça aí acontecer. Siga padrões do nosso jogo de motor do leilão… e faça
apenas p meu usuário q irei testar no partida rápida"*. Feito assim:
- **Onde liga**: Partida Rápida → "Como é o leilão" ganha o 3º botão "🔨 Pregão aberto" (selo *teste*), só pra
  `PREGAO_ABERTO_TESTERS` (sport.ts; `PREGAO_ABERTO_GERAL = false`). Pra todo o resto a tela é a de sempre (2 botões).
  Não existe em carreira, dinastia, salas online nem Leilão de Clubes (lá cai no envelope de sempre).
- **Motor** (store.tsx, bloco `abrePregaoAberto`/`paTick`/`paMartelo`/`paFecha`): a fila é o BARALHO INTEIRO embaralhado
  (`pa.fila`); uma carta por vez; abre em 1, cada lance é +1 ou mais; o relógio de 6s (`PA_MARTELO_MS`) zera a cada lance;
  o arremate entra pela MESMA porta do envelope (`pendingEnvelopes` + `sealAndResolve`, com `holFechando` pra silenciar os
  bots — o mesmo caminho da Tocaia), então pagamento, livro de preços, elenco e resenha ficam idênticos. Sem lance = Monte.
  Carta que NINGUÉM pode levar (posição fechada em todo mundo) nem entra na mesa. No fim, `advanceSectorOrFinish` → Monte/
  cerimônia/temporada os de sempre.
- **Bots**: teto por carta vem do `cpuEnvelope` (perfil, economia, necessidade, os mesmos de sempre); por tique, UM bot
  cobre com uma chance que cai conforme chega perto do teto. Nunca cobre o próprio lance, nunca sem vaga, nunca sem caixa.
- **Tela** (`pregao-aberto.tsx`): carta em tamanho de vitrine (a grande empurrava os botões pra fora do celular), faixa
  do lance atual + ⏱ (vira vermelha nos 2s finais: UMA… DUAS… TRÊS… VENDIDO!), últimos 4 lances, botões mínimo/+1/+4 e
  "outro", travas explicadas (posição cheia · já está na frente · caixa não cobre), resenha do último martelo, campinho.
  Só o aparelho que joga tica (`PREGAO_ABERTO_TICK`); no online, quando for ligado, só o dono tica — por isso o lance já
  vai com `by` (uid), pronto pra rotear pro dono.
- 🔁 **1º teste do Diego (16/10, 02:57): *"tem certeza que os bots estão inteligentes? só tem 100 moedas e teve gente que de
  primeira já chegou em quase 50 num jogador"*.** Dois robôs duelaram até 49 num craque. Causa: o teto vinha do `cpuEnvelope`,
  que divide o caixa por SETOR na ordem GOL→ATA — ATA é o último, então uma carta de ATA ganhava o bolso INTEIRO. Virou
  `paTeto`: caixa ÷ vagas que faltam × categoria (lenda 2,6× · craque 1,8× · bom 1,1× · pro 0,8× · perna 0,5×), tempero por
  bot+carta, preso ao `fairPrice`, e nunca mais que 35% do caixa numa carta (40% lenda). Medido: média 8 🪙 por carta, maior ~26,
  todo robô fecha os 11. No caminho achei outro bug: `rngOf(state)` é fixo por estado e o tique não muda nada do estado — o
  sorteio se REPETIA em todo tique e em toda carta do setor, então setores inteiros iam pro Monte sem lance (`paRng` agora anda
  por carta e por tique). E ele pediu *"reduzir mais o tempo"*: martelo 6s → 4s → **5s** (ele cravou: *"eu falei 5s p martelar"*), o robô que abre já abre com uma fatia do
  teto ("dou 8!") e pula 2–3 com folga. Medido: ~9s por carta, ~18 min com 10 clubes (115 cartas), ~33 min com 20.
- 🔁 **2º teste (16/10, *"tô achando MUITO lento… diminua pra 5s"*)**: martelo em **5s** (`PA_MARTELO_MS`, ele cravou o número) e, com o
  OK dele (*"Isso"*): **a carta já abre no preço da categoria** — lenda 10 · craque 5 · promessa 4 · bom 3 · profissional/perna 1
  (`paAbertura`, é o lance mínimo da carta na mesa) — e **o robô age a cada meio segundo** (`PA_TICK_MS = 500`). Bot de caixa curto no
  fim topa pelo menos a abertura se o caixa cobre e sobra pro resto das vagas (senão terminava com 9). Medido: ~8s por carta
  (~15 min com 10 clubes · ~29 min com 20), média 8,7 🪙, maior ~26, todo robô fecha os 11. Pergunta dele em aberto: ordem das
  posições ALEATÓRIA (como está) ou POR ORDEM — recomendei aleatória (ninguém fica parado esperando o setor dele).
- 👥 **16/10: Rossini Money (luizeduardorossini0013) liberado como testador** do Pregão Aberto E da 👑 Kings League, a pedido do Diego
  (`PREGAO_ABERTO_TESTERS` / `KINGS_TESTERS`).
- 🟩 **17/10: o campinho virou o PADRÃO** (`YourPitch`, o mesmo do envelope e da Tocaia, com rosto das lendas e manto). Diego:
  *"deve ser os campinhos padrões igual os outros modos… aparece o avatar da lenda"*.
- ⏳ **17/10: "tá muito demorado… quanto mais pessoas, mais lento"**. Proposta em mockup (`node scripts/mockup-pregao-duas-cartas.mjs`
  → `scripts/mockups/pregao-duas-cartas.png`): DUAS cartas na mesa, sempre de posições diferentes, cada uma com o próprio relógio
  de 5s (martelou uma, a próxima entra no lugar dela). Corta pela metade (~30 → ~15 min com 20 pessoas). A 2ª mesa liga sozinha
  a partir de 7 clubes. ✅ **FEITO (17/10)** com a régua dele: *"a partir de 11 pessoas será duplo, até 10 mantém individual"*
  (`PA_DUPLO_A_PARTIR = 11`, conta só quem DISPUTA: gente + robôs rivais). A 2ª mesa mora em `pa.m2` com os mesmos campos da 1ª;
  `paMesa(state, k)` lê qualquer uma; o lance leva `mesa`; o caixa já preso como líder na outra mesa não conta (`paComprometido`).
  Na tela, `MesaPregao` é desenhada 1× ou 2× lado a lado. Medido: 10 clubes 18 min (uma mesa) · 11 clubes 11 min · 16 clubes 16 min.
- **Trava**: `npm run pregao-aberto` (partida inteira no reducer: fila embaralhada, lance inválido recusado, uma carta =
  um dono, pagou o lance final, ninguém negativo, termina no Monte/cerimônia).
- **Reverter**: `PREGAO_ABERTO_TESTERS` vazio esconde o botão; sem o botão nenhum save entra no modo.
- ⏳ **Falta** (depois do teste dele): liberar pra todos (`PREGAO_ABERTO_GERAL = true` + linha em `novidades.ts`), levar pras
  salas online (rotear `PREGAO_ABERTO_LANCE` pro dono via `hostInbox`, só o dono tica) e pro lobby ("Como é o leilão").
Histórico do pedido:
Ideia do Diego: leilão aberto clássico, UMA carta por vez, lance à vista ("dou 10… 11… uma, duas, três, vendido"), e ninguém
sabe qual carta vem depois. Medo dele: 20 pessoas = 20 goleiros e o 1º que pegar fica esperando. Respondido: o baralho dá de
sobra (só o BR tem 82 GOL · 90 LAT · 93 ZAG · 198 MEI · 240 ATA; o Envelope de 20 já tira 220 cartas), o problema é TEMPO.
Proposta no mockup (`scripts/mockup-pregao-aberto.mjs` → `scripts/mockups/pregao-aberto.png`): ordem das POSIÇÕES embaralhada
(ninguém fica parado: quem já tem goleiro briga pelas outras), martelo em 6s sem lance novo, quem já fechou a posição só
assiste (trava explicada), botões +1/+2/+5/outro valor, lista dos últimos lances, campinho do que falta. ~25 min com 20 pessoas,
~10 com 6–8. Encaixa como "jeito do lance" ao lado de ✉️ Envelope e 🐊 Tocaia; Monte/cerimônia/temporada os de sempre.

## 🛒 Painel do Criador: "Quem quase comprou" (16/10) — ✅ NO AR
Diego perguntou se os toques da Loja já caíam no painel. Caíam (`apoio_intents`), mas na lista dos 40 últimos, afogados por
"abriu o modo manual"/"abriu a loja" (267/225 em 3 dias). Caixa nova `QuaseComprouAdmin` (admin.tsx). Diego corrigiu na hora: *"abriu Pix também — é importante saber
quem apertou mas não seguiu"* → virou POR PESSOA (7 dias): a trilha dos toques (abriu → viu plano → gerou Pix → copiou → caiu) com a
cor de até onde chegou; cinza = só abriu e parou (o lead pra chamar). No mesmo commit o
Pix do Mercado Pago foi liberado pra todos (`PIX_MP_GERAL = true`). ⚠️ Pendência que já existia: cupom de influenciador no
batismo ainda não vale no Pix novo (o preço do servidor ignora cupom).

## 📮 FECHAR CONVOCAÇÃO DO LEILÃO DE CLUBES NÃO FECHAVA (16/10, Arroganthi) — ✅ NO AR
- Relato: *"tinha selecionado os jogadores… não deixou eu confirmar o time e todos os selecionados mudaram"* (sala QRNW8G,
  7 pessoas, noite de 14→15/10, a sala toda engasgando). O pedido "Fechar convocação" do convidado ia pro dono UMA vez, sem
  reenvio e sem resposta na tela; perdido, o relógio dos 90s estourava e ele levava o PIOR de cada pacote. E o dono "valia a 1ª"
  lista: se o envio automático dos 0s saía pela metade, o Fechar de depois era ignorado.
- Ordem do Diego: *"ele tem que apertar o botão e tem que funcionar fechar"*. Feito: o botão vira "⏳ Enviando pro dono…" e
  reenvia a lista ATUAL a cada 3s até o dono confirmar (`convocacao-clubes.tsx`); o dono aceita a lista mais NOVA enquanto a
  convocação está aberta (`CONVOCAR_CLUBES`, só fora de dupla). O 1º reenvio registra `esc_travas_salvas` fase 'convocacao'
  (evidência pra próxima vez — o `room_acoes` é apagado pelo dono e não serve de prova). Trava das duplas (`npm run duplas`) ok.


## 15/10/2026 — Presidência: candidata à publicação privada autorizada

- Diego pediu **“Publique tudo no meu usuário q fez até agora”**. Isso substitui
  a pausa de publicação dos registros históricos abaixo. A versão de teste
  permanece restrita ao email verificado `diego.c.fonseca@gmail.com`.
- Complexo 3D integrado à carreira em **Clube → Estrutura**, com obras reais,
  estacionamento gradual, contexto da partida e agenda quarta 21h/domingo 16h.
  Main preservada até `3dc79cc3`, incluindo personagem da conta e planos.
- Build, TypeScript, CPU e navegador passaram; percursos e tela integrada foram
  conferidos em desktop/celular emulado, incluindo outra conta e logout.
- Permanecem acabamento/fidelidade à arte, rotas da massa restante da torcida,
  antecipação de transporte e presidente físico. Detalhes e limites em
  [presidencia-publicacao-20261015.md](presidencia-publicacao-20261015.md).
  Declarar publicado somente após confirmar sucesso do GitHub Pages.

## 14/10/2026 — Presidência: continuação do transporte até o assento

- Mesmo passageiro do veículo até a cadeira, com escadas e retorno físico;
  propriedade/reserva do assento impede duplicação e aguarda o dono anterior.
  Visitas antigas terminam na origem. Metrô também recebe rota mandante até
  o portão frontal, além da visitante lateral, conforme obras e demanda.
- Corredores coordenam transporte/visitas e coorte de **até seis torcedores,
  três por lado**, dentro da mesma quota da amostra sentada. Saída e retorno
  ocorrem um por corredor, por pisos reais; corpos continuam visíveis em pontos
  distintos da calçada. A câmera permanece no mesmo corpo escolhido.
- CPU confirmado: fluxo **864 + 1.194**, calendário **1.338**, movimento
  **1.843**, carreira **165**; transporte/assento **9.568 verificações lógicas,
  36 de corpo, 4.299 de transferência e 9.824 verificações físicas**. Coorte **87.786 poses, 35.774 apoios
  e 219.465 separações**; registro em
  `test-results/complexo-3d/torcida-saida-cpu.log` e `torcida-saida-report.json`.
  A correção de orçamento da coorte passou em cinco cenários lógicos, mantendo
  os seis corpos: lado sem quota sai fisicamente e fica fora; restauração permite
  retorno andando. Log `test-results/complexo-3d/torcida-orcamento-cpu.log`.
  Metrô mandante passou em três estágios: 20.784 apoios de sola,
  1.056.202 verificações de corpo, 23.430 amostras de rota e 2.598 poses.
  **Build PASS, exit 0**, em `test-results/complexo-3d/percurso-build.log`.
  Navegador desta continuação ainda em execução neste registro. Os PASS
  abaixo são históricos; aprovação visual do acabamento continua pendente.
- Pendências: rotas para a massa de até 800 sentados (**só seis evacuáveis nesta
  coorte**), antecipar transporte ao calendário — caminhada atual leva tempo
  humano real —, telas reais da carreira, personagem da Presidência e acabamento
  fiel do estádio/entorno/sala-camarote. Calendário preservado: **quarta 21h/noite;
  domingo 16h/dia**. Sem publicar ou modificar conta real; acumular até concluir,
  com acesso inicial apenas para `diego.c.fonseca@gmail.com`.
  Se a coorte nasceu sem quota, permanece vazia nesta vida da cena; o crescimento
  posterior da amostra estática não cria personagens nas cadeiras da coorte.

## 14/10/2026 — Presidência: jornadas e iluminação validadas localmente

Registro histórico; a continuação acima substitui as pendências de ligação
transporte/assento e metrô mandante desta rodada.

- Agenda explícita, corrigida por Diego: **quarta às 21h/noite e domingo às
  16h/dia**, por partida; `kickoffTime` registra o horário do calendário do jogo
  e `period` aciona a iluminação, sem depender do dispositivo. Prévias e
  expectativas do teste de navegador atualizadas; CPU calendário (1.338 casos)
  e adaptador (165 visuais, mais cenários de agenda) passaram após a correção. Sem inventar
  calendário quando os dados não existem. Chegada, permanência e saída físicas,
  orçamento reservado e troca de uniforme na origem preservam os NPCs.
- Refletores conforme compras/teto; postes, asfalto/passeios, passarelas,
  fachadas, faróis e cabines iluminados. Fontes próximas têm orçamento fixo;
  piso recebe atlas de luz com cotas separadas e oclusão estática de paredes.
- Build e CPU passaram. Navegador final: desktop 9 checkpoints, celular emulado
  8; nove imagens, sem erros. Inclui remover partida encerrada e novo adversário
  azul/branco sem trocar corpos/posições. Fonte da falha de uniformes corrigida.
  Evidências: `test-results/complexo-3d/jornada-browser-report.json` e imagens
  `*-jornada-*.png`. Resumo completo em `presidencia-retomada-sessao.md`.
  Essa rodada de navegador antecede a correção dos horários: nomes de capturas
  quarta-dia/domingo-noite são históricos; a suíte completa não foi repetida
  para a correção.
  Build após a correção **PASS, exit 0**:
  `test-results/complexo-3d/horarios-corrigidos-build.log`.
- Pendências naquela rodada: integração à carreira e calendário real, mesmo passageiro do
  transporte até o assento, metrô para mandantes, esvaziamento da massa sentada,
  personagem físico e acabamento fiel à arte. Nenhuma publicação/conta alterada.
  Manter eventual liberação inicial só para Diego e publicação acumulada ao final.

## 14/10/2026 — Presidência: rodada local de mapa amplo e zoom validada

- Área maior em desktop/celular, expansão na tela sem remontar a cena, destinos
  em **Locais**, zoom acessível e rotação explícita. Arraste com um dedo/botão
  esquerdo move; pinça e roda aproximam/afastam. Teclado atua apenas com foco
  no mapa. Resize/expansão preservam o local explorado; projeção limita bordas.
- Resolução limitada por GPU/área (até 2,5 MP/DPR 2,5 celular, 4 MP/DPR 2
  desktop; perfil conservador para até 2 GB), anisotropia de superfícies e
  fibras próximas no gramado, preservando imagem, cores, faixas e metragem.
  Geometria, NPCs, bola, etapas, compras e relógio permanecem preservados.
- Build e helpers CPU de câmera/qualidade/material **PASS**; regressão da
  partida **136 quadros PASS**. Desktop **1400×1000** e celular emulado
  **390×844 PASS**, oito checkpoints por aparelho, sem erros/transbordamento.
  Bug real de pinça com página rolada corrigido no helper por ancoragem client,
  sem tocar dependência/APIs privadas. CPU e nova rodada mobile preservam
  scrollY de 249, alvo no gramado e distância de 40 m; capturas próximas conferidas.
  Foco/rolagem/estado preservados; canvas expandido celular **780×1688/DPR 2**.
  Build após correção touch passou; relatório consolidado
  `test-results/complexo-3d/navegacao-report.json`.
- Após o reinício, helpers CPU de câmera/qualidade/material e **301 etapas de
  plantio PASS**. Corrigido `Shift +` no teclado principal, com um render por
  ação; demais atalhos modificados continuam livres.
- Faixas curvas na praça/teto Vadico diagnosticadas como autossombra PCF.
  A/B com bias escalado remove as faixas e mantém as sombras. **Correção já
  integrada em `updateShadows`**; build final **PASS, exit 0**, e recaptura
  final **PASS em desktop 1400×1000 e celular emulado 390×844/canvas 780×1688**.
  Conferência visual final sem faixas, com sombras, gramado e atletas próximos
  preservados. Logs da rodada atual:
  `test-results/complexo-3d/qualidade-final-build.log` e
  `test-results/complexo-3d/qualidade-final-browser.log`.
  Relatório `test-results/complexo-3d/qualidade-final-report.json` e imagens
  `*-qualidade-final-mapa.png` / `*-qualidade-final-campo.png` na mesma pasta.
  Primeiro script falhou usando roda no contexto móvel; corrigido para pinça
  via CDP, mantendo a tolerância **40 m ± 0,1 m**. PNG móvel teve textos/ícone
  confirmados por pixels/OCR; sem bug de interface nem alteração adicional.
  Evidências/limites no primeiro tópico de `presidencia-complexo-3d-reconstrucao.md`.
- Logs `/tmp` citados no histórico são registros de execuções anteriores e
  não foram recuperados após o reinício; não são evidência da rodada atual.
- Acabamento fiel/aprovação visual, personagem físico e integração à carreira
  continuam pendentes. Sem commit/push/deploy ou acesso à conta real; eventual
  liberação inicial apenas para `diego.c.fonseca@gmail.com`.

## 14/10/2026 — Presidência: rede de ruas e pedestres validada localmente

- Ruas sobrepostas consolidadas sem preencher vãos; rede conectada com oito
  ligações na várzea/nove no completo asfaltado. Rua leste contorna estacionamento;
  oeste deixa de cortar o hotel e ganha retorno, passeio e ramal à via pública.
- Anel decorativo que atravessava estabelecimentos removido; dez conexões
  pedestres respeitam compras e preservam percursos dos NPCs. Vãos nas cercas
  vivas e entradas de parques somente onde existe calçada válida.
- Calçada e acesso lateral do estacionamento noroeste corrigidos. Física final
  **PASS: sete cenários/221.848 sondagens**, incluindo 2.709 da esquina e 2.535
  do acesso/vagas. Pedestres: **17 cenários/4.590 verificações**, geometria com
  **7.344 pisos/594 raios de corpo**, todos PASS. Planejador, build final,
  circulação (cinco minutos a 20 Hz/1.464 quinas de solas) e transporte PASS.
- Entorno final: **nove estados PASS**, máximo **46 malhas/292.613 triângulos**
  (várzea: 40/244.060). Browser desktop/celular: 12 capturas mais seis
  recapturas finais PASS, sem erros ou transbordamento; entrada aberta e
  continuidade da calçada conferidas visualmente. Evidências em
  `test-results/complexo-3d/ruas-browser-report.json` e
  `test-results/complexo-3d/ruas-parking-browser-report.json`.
- Manobra noroeste: carro 1,9×4,6 m/curva 3,5 m PASS em 7.928 poses geométricas
  e 11.910 sondagens de piso. **Passagem apertada**, com limite contínuo de
  folga acima de 11,03 cm; valida um trajeto específico, sem implementar
  animação de estacionamento nem garantir qualquer manobra.
- No completo, apenas uma travessia norte é elevada (16 cm/rampas de 2,2 m);
  ligação sul redesenhada para evitar a rodovia, sem travessia elevada.
- Personagem físico, integração visual à carreira e acabamento/aprovação de
  Diego continuam pendentes. Sem commit, deploy ou acesso à conta real.

## 14/10/2026 — Presidência: metrô e Vadico Veículos validados localmente

- Revisão de 13/10 passou na suíte física completa: duas passarelas, ida/volta,
  desembarque fora do asfalto, apoio de pés, portas, carrocerias e rodas.
  Build e recaptura `--views-only` passaram em desktop 1280×960 e celulares
  emulados 390×844/320×844; cinco carros na estação, partida preservada em
  14 segundos com 22 jogadores. Contagens e evidências na seção do metrô em
  `presidencia-complexo-3d-reconstrucao.md`.
- **Vadico Veículos implementada e validada localmente**: loja no bairro
  oeste, letreiro vermelho, seis carros físicos e câmera responsiva. Acesso
  público independente de asfalto comprado, pedestres separados, sem nova
  economia/save. Guia de 0,17 m no acesso corrigida sem relaxar tolerâncias;
  build final, nove estados do entorno e física na várzea/completo passaram,
  preservando 38 rotas, 17 reservas de obras e tráfego. Navegador desktop passou
  no completo/várzea. Inspeção do celular reprovou carros ocultos pelo hotel,
  apesar de o teste de enquadramento passar. Câmera de retrato corrigida com
  superfícies/rotas/carros preservados. Build e recaptura finais passaram em
  desktop 1280×960 e celular 390×844, completo/várzea: sete raios livres por
  cenário, sem transbordamento nem erros JS/WebGL. Relatório
  `test-results/complexo-3d/vadico-browser-report.json` e capturas
  `*-vadico-complete.png`, `*-vadico-empty.png`, `*-vadico-mapa.png`.
  Validação da equipe; aprovação visual de Diego continua pendente.
- Acabamento fiel à referência e integração visual à carreira continuam
  pendentes. Nenhum commit/push/deploy/login real; acesso futuro inicial só Diego.

## 12/10/2026 — Presidência: complexo inteiro em revisão local, SEM PUBLICAR

- Diego reafirmou fidelidade à arte original em todas as etapas e melhorias.
- Correção em 13/10: reset da prévia do estacionamento removia também a
  estação e produzia a foto sem metrô. Agora conserva as outras compras;
  estação mantida na avenida acima/à direita do estádio conforme referência.
  Compras 0..4 passaram em desktop/celular. Corrigido também enquadramento
  que cortava a extremidade da estação no retrato; build aprovado. Recapturas
  e projeção passaram em desktop/390/320 px, sem erros JS/WebGL. Nenhuma
  publicação ou mudança de conta.
- Continuação atual em revisão: transporte físico (metrô, ônibus e van),
  dois pontos e desembarque/retorno por portas. Estacionamento comprado por
  etapas 20/20/20/10, vagas 9/16/46/79, compra antiga preservada. Lotes/acessos
  aparecem conforme compra, sem conceder estação. Público exterior compartilhado.
  Nova integração de compra preparada com flag desligada até o mapa representar
  etapas na carreira. Van ainda inicia na portaria; conversão com tráfego geral
  pendente. Build final, domínio/reducer, física/lifecycle e browser passaram;
  desktop quatro compras, celular primeira compra e três transportes. Câmera do
  metrô corrigida e recapturada à altura humana na plataforma em ambos formatos.
  Resultados finais no primeiro registro de
  `presidencia-complexo-3d-reconstrucao.md`. Sem commit/push/deploy.
- Continuação anterior: oito acessos (seis inferiores + primeira fila superior por
  lado), escadas internas com patamar/corrimãos, recortes reais e reserva por
  torcida. Loja/hotel/choperia recebem até três pedestres limitados ao público,
  com entrada/espera/retorno e rotas separadas das torcidas/carros. Variação suave
  no terreno residual asfaltado. Testes puros, build e browser superior/destinos
  passaram desktop/celular emulado. Demais filas superiores, acabamento fiel,
  personagem físico e instalação controlada na carreira seguem pendentes.
  Capturas e limites no primeiro registro de `presidencia-complexo-3d-reconstrucao.md`.
  Refino de concreto/UVs também passou: geometria idêntica em 11 estados,
  compilação final e capturas de mapa/subida/assento desktop/celular emulado.
  Tudo local; nenhum commit/push/deploy/login real.
- Continuação anterior: destinos nas filas 0/5/10 do primeiro andar por entrada,
  um ator por lado, apoio nos degraus reais e câmera que acompanha o percurso.
  Adaptador de leitura da carreira + fixture local preservam estádio/carteira,
  identidade, roupas/tons/poses e relógio compartilhado. Testes puros e build
  passaram, assim como browser desktop/celular emulado de visitas e carreira.
  Corrigidos o reinício do torcedor da casa ao mudar visitantes e o carregamento
  inicial do retrato na fixture. Capturas `*-visita-*-fila10-*.png` e
  `*-carreira-*.png`; detalhes no primeiro registro de
  `presidencia-complexo-3d-reconstrucao.md`. Não instalado na conta.
- Incremento anterior: dois acessos físicos até cadeira inferior, com o mesmo
  NPC entrando/subindo/sentando/saindo; reservas impedem duplicação. Escadas entre
  filas agora alinhadas. Mobília do camarote lê compras válidas (13 IDs), com piso,
  corredor livre, câmera humana e luminárias fixas. Testes puros e browser de
  mobília/visitas/lifecycle passaram desktop/celular emulado. Capturas novas em
  `*-mobilia-sala-*.png` e `*-visita-*.png`. Ainda faltam ampliar acessos internos,
  personagem físico, fidelidade de acabamento e integração à carreira. Detalhe
  de até 96 cadeiras próximas acrescenta espessura/encosto/suportes sem duplicação
  ou mudar posições e permanece abaixo de 190 mil triângulos na arquitetura.
- Continuação local: árvores apoiadas, casas orientadas aos acessos, texturas e
  fachadas refinadas. Torcida sentada usa as cadeiras construídas, com modos
  explícitos de QA/carreira e limite de 800 personagens; sem dados não inventa
  visitantes. Updates de público preservam câmera, pausa, canvas e relógios.
  Testes puros, lifecycle e capturas desktop/celular emulado passaram. Mapas
  recentes: `*-paisagismo-*.png`; aproximações: `*-acabamento-*.png`. Ainda falta
  ampliar os dois percursos novos a outros assentos/andares e integrar à carreira.
- Pedido seguinte: preencher vazios bege. Praças públicas, passeios e arborização
  adicionados à revisão 3D; parque regional prolonga a vista afastada no celular.
  Corrigidas a névoa nessa câmera e invasões de casas/árvores nas reservas de obras
  e acessos futuros. Conferência em `testa-presidencia-complexo-paisagismo.mjs` e
  capturas `*-paisagismo-*.png`; não é publicação nem acabamento final aprovado.
- Correção seguinte: formato **oval**, grande camarote presidencial integrado;
  retirar subida/rua e carro diante da sala. Casa futura fora do escopo. Planta
  oval, camarote, portões frontal/mandantes e lateral/visitantes implementados na
  revisão local; torcedores entram e saem por corredores físicos separados.
- Carros retirados da janela da sala nas fontes, mantendo propriedade e garagem.
  Teste de torcida passou em cinco etapas, com 300 verificações de solas e bloqueio
  real do portão. Mobília e dois percursos até cadeiras acrescentados na revisão
  local; integração à carreira e demais acessos continuam pendentes.
- Navegador desktop/celular aprovado: portões/camarote, campo e relógio/gestos/gol.
  Corrigida também a terra sobreposta ao gramado na câmera baixa sob o teto fechado;
  capturas e teste de pixels em `testa-presidencia-complexo-gramado.cjs`.
- Nova revisão `qa-presidencia-complexo-3d.html`: 16 obras do save, arquibancadas,
  cobertura após dois andares, estabelecimentos, vias e campo/partida compartilhados.
- Correção na janela original para setores completos comprados fora da sequência.
- A reconstrução 3D ainda precisa de acabamento e população completa; não substituir
  a arte aprovada nem considerar visual concluído pelos testes técnicos.
- Estado detalhado e limites: `docs/presidencia-complexo-3d-reconstrucao.md`.
  Alterações acumuladas locais, acesso futuro inicial só Diego; nenhum novo deploy.
## 🧑‍💼 CRIAÇÃO DE PERSONAGEM NA CONTA (15/10) — ✅ feito, SÓ NA CONTA DO DIEGO
- Diego: *"já bote pra fazer tudo sobre a criação do personagem… sempre com base no e-mail… já pode fazer pro meu usuário apenas"*.
- Onde mora: tabela `esc_presidente` (1 linha por conta, `docs/sql/presidente-conta.sql`, aplicada em 15/10, RLS só o dono).
  Porta de entrada: 🛒 Loja do Clube › "🧑‍💼 Meu presidente" (`presidente-loja.tsx`). A Presidência da carreira
  (`presidencia-clube.tsx`) passa a mostrar/editar o presidente DA CONTA e grava nos dois (conta + save da carreira, que
  guarda só a posse `sinceSeason`). Trava de conta: `PRESIDENTE_CONTA_TESTERS`/`PRESIDENTE_CONTA_GERAL` em `presidente-conta.ts`.
- Régua por PLANO (`presidente-plano.ts`, `npm run presidente`): grátis monta e NÃO salva (trava diz o porquê e o caminho) ·
  ⭐ Craque = pele + cabelos/barbas + 14 roupas básicas · 👑 Lenda = + 9 especiais · 🖋 Batismo/Fundador = + 10 de gala.
  O antigo `presidente-tier-conta.ts` (tier do Diego lido do user_colors) SAIU; tudo lê `getPlanoConta()` (a régua da Loja).
- 🧹 Cabelo e barba CLÁSSICOS consertados (`public/presidente-v17`): o cabelo tinha restos de contorno de barba no queixo e a
  barba estava cortada reta do lado direito (espelhada a metade boa). Os outros 19 cabelos e 6 barbas estão limpos
  (`scripts/mockups/presidente-classicos-antes-depois.png`).
- ⏳ Falta decidir com ele: preço dos AVULSOS (cabelo de craque, roupa especial fora do plano) e se o grátis pode comprar o boneco
  avulso. ⏳ Mostrar o presidente nos 12 lugares do mockup de 14/10 (hoje só Loja + Presidência). ⏳ Liberar geral.

## 🪪 5 Garrinchas no elenco do Fabulous EC (15/10) — ✅ NO AR (15/10)
- ✅ 👑 **KINGS v2 NO AR (15/10, só na conta do Diego)** — `scripts/mockups/kings-v2.png` (bola caindo da gaiola, 1×1→7×7, dado gigante 👑/2×2/3×3, presidente sem botão com contagem e minuto fixo por rodada, carta secreta sorteada, roteiro). Detalhes em `docs/conceito-kings-league.md` (v2). Feito: bola caindo da gaiola, faixa 1×1→7×7, dado gigante 3D, presidente e cartas sorteadas na agenda da rodada com cobrança de 5 s (bate/defende; não escolheu = sorteio), liga e mata-mata. ⏳ Falta: versão online gente × gente (a agenda e o `KINGS_DECIDIR` já foram feitos pensando nela).

- 👑 **KINGS LEAGUE NA TELA DE SEMPRE (15/10)** — Diego: *"está tudo deformado o placar… tudo é padrão do nosso jogo"*. A tela própria (`kings-rapida.tsx`) saiu; a temporada é a `EscSeason` com a regra por cima (`kings-liga.ts`): relógio 40', banners que param o jogo (dado, presidente, intervalo, bola), tabela com SH, mata-mata jogo único com o 1º direto na semi, SHOOTOUT de verdade (1×1 do meio, 5 s, ~55%). Só na conta dele. Trava `npm run kings` (motor, 6 combinações de leilão, liga, mata-mata). ⏳ Falta: carta secreta e o presidente/shootout BATIDOS na mão (hoje sorteados) — perguntar se ele quer; versão online gente × gente.

- 🦅⚡ **FABULOUS EC VIROU 🖋 FUNDADOR (15/10)**: koeppfabio já tinha fundador nº76; gravado `esc_compras_batismo` = plus (o mesmo do Arruda). ✅ **GALA ÚNICA NO AR (15/10, com o canto)**: `gala-fabulous.tsx` (guerreiro PRETO entra pela esquerda e VERMELHO pela direita → giram e viram luz num clarão → céu fecha, nuvens, raios e a tela pisca → o escudo acende e a águia sobe → "CHEGOU NA SALA"). Guerreiros são NOSSOS (capacete + raio no peito), nada da marca Power Rangers. Vídeo: `node scripts/video-gala-fabulous.mjs` → `scripts/posts/gala-fabulous.mp4`. Registrada em `GALA_UNICA`. 📣 CANTO DA TORCIDA (15/10): 11 s do vídeo que o Diego mandou → `public/sfx/torcida-fabulous-v1.mp3` (mono 32 kHz 56 kbps, −20,6 dB igual ao do Geovany), toca na carreira (`AMBIENTE_CARREIRA_POR_EMAIL`, o gol continua o de todos) e na gala (`playMp3Gala`). Vídeo com som: `scripts/posts/gala-fabulous-com-canto.mp4`.

- Causa: sondagem de clube de FUNDO dava à carta o id `sond-<id do fundo>`, e o id de fundo (`ATA-25`) se repete entre
  clubes. Garrincha (sondado antes) e Pelé (agora) nasceram os dois `sond-ATA-25`; a tela desenha o elenco pelo id e
  embaralhou (5 Garrinchas na lista; no elenco de verdade eram 1 Pelé + 1 Garrincha).
- Conserto (`store.tsx`): id novo leva a temporada + sufixo se ainda bater; `curaIdRepetido` (no `sincronizaNiveis`)
  troca o id da 2ª carta repetida nos clubes de GENTE e acerta a 2ª ocorrência em `careerLineup`/`careerHalftime`/`copaXi`.
  Testado no save real dele (T103): 22 ids únicos, Pelé e Garrincha nos 2 lugares do ataque.
- Labubu FC (caelborba): "bug no 1º leilão" — sala CAYJZH parou no envelope porque o aparelho do DONO (ele, iPhone)
  não fechou o prazo; o motor fecha normal. Esperando o print dele. Proposta (sem OK ainda): dono fecha o envelope
  vencido assim que volta pra frente do jogo.

## 👑 KINGS LEAGUE — 🟢 NO AR NA PARTIDA RÁPIDA, SÓ NA CONTA DO DIEGO (15/10, "faça tudo e publique apenas no partida rápida")
🔁 **15/10 (madrugada), Diego: *"o leilão é sempre igual ao de sempre nosso"*** — o leilão inventado SAIU. Agora o botão dá
`START` com `kings: true` → o LEILÃO DE SEMPRE (envelope, revelação, monte, cerimônia) com a formação `'kings'` (types.ts:
GOL 1 · LAT 0 · ZAG 2 · MEI 2 · ATA 2), 10 times (você + 9 rivais que dão lance, sem preenchimento) e o campinho de 7
(`kings-campinho.tsx`) no `YourPitch`. Na tela 'season' o Router abre `EscKingsSeason` → `kings-rapida.tsx` com os 10 elencos
do pregão. Trava: `npm run kings` (motor + leilão real chegando na temporada com 7 por time, sem fake, e o rápido normal intacto).
(texto antigo:) `src/escalacao/kings-rapida.tsx`: jogo À PARTE por cima da tela de configurar a Partida Rápida (botão preto "👑 KINGS LEAGUE ·
TESTE · SÓ VOCÊ VÊ", trava `useKingsLiberada`/`KINGS_TESTERS` em sport.ts). Estado próprio (não passa pelo reducer), guarda no
aparelho em `kings-rapida-v1`. Fluxo: regras → leilão às cegas de 7 (GOL·ZAG·MEI·ATA, 100 🪙, bots dão lance, sobra vai pro
monte de graça) → 9 rodadas (vestiário 20s com a carta → partida de ~3 min com banners de 7s: início, dado, intervalo,
bola, shootout) → pênalti do presidente nos dois sentidos (você bate com o PenaltyArt; o do bot você defende) → carta
(pênalti/shootout você bate; suspensão/gol em dobro entram na conta) → empate = shootout manual 5+5 e morte súbita →
mata-mata (1º direto na semi) → campeão. Testado no navegador do começo ao campeão, sem erro.
⏳ Falta: levar pras SALAS ONLINE (duelo gente × gente) quando ele aprovar o rápido; o nome "Kings League" é marca registrada (avisado).
(histórico da etapa 1 abaixo)

Conceito inteiro: **`docs/conceito-kings-league.md`** (regras da Kings League BRASIL, nome "Kings League", ritmo mais
lento: ~3 min/partida, banners de 6–8s explicando cada regra, intervalo 15s, vestiário 20s). Mockups:
`scripts/mockups/kings-league.png` + `campinho-reis.png` (o campinho; o selo vira "KINGS LEAGUE").
✅ Etapa 1: motor PURO `src/escalacao/kings.ts` (10 times/9 rodadas, 3·2·1·0, calendário, chave 1º-na-semi, partida com
dado no 18, bola dourada/vermelha no 38, cartas, pênalti do presidente, shootout, duelo de canto). Trava `npm run kings`.
Média medida: ~6,3 gols/jogo, ~18% vai pro shootout. Não está ligado em tela nenhuma ainda.
⏳ Etapas 2–5 (só na conta do Diego até ele aprovar): tipo de sala + leilão de 7 com campinho · liga de 10 + partida ·
vestiário/carta/pênalti do presidente (online) · duelo manual + banners + mata-mata.

## 🤝 Dupla nas copas com convocação: só UM escolhe e convoca (15/10, "Ok pode fazer") — ✅
Bug da sala do Futpoint (dupla Futpoint + Cativeiro): no Rio × SP cada um escolheu um clube, e o Cativeiro escolheu na
vez da dupla Gui|Palmolego. Causa: Copa do Mundo/regional montavam "assento → pessoa" com TODAS as linhas do
room_players, e a linha do parceiro guarda um `player_index` velho (a renumeração só mexe nos donos) que caía no
assento de outro. Agora `dupla-copa.ts` (`quemAgePorAssento`): linha de parceiro nunca vira assento, e quem age pela
dupla é o marcado na sala de espera (**🏳️ Quem escolhe o clube e convoca**, `dupla_categories.CONV`; ninguém marcou =
dono). O outro vê o aviso roxo "👀 Fulano escolhe e convoca pela dupla", a fila mostra "Fulano escolhe · Ciclano
assiste", e os botões dele somem (nada de botão mudo). Mockup: `scripts/mockups/dupla-convoca.png`.
⚠️ "Ao vivo" pro parceiro = ele vê o clube na hora e o time quando o outro CONFIRMA os 11 (a convocação não grava
escolha por escolha).
🛡️ "As 2 listas": a sala "Rio-SP no YouTube" (ARJSUE) tinha `mundoNaLiga` E `regionalNaLiga` → abria as duas copas
lendo as mesmas escolhas (e a convocação do "São Paulo" procurava o PAÍS São Paulo = 0 jogadores). Agora com as duas
marcas vale só a regional. 🚫 Sala "🌐 Copa do Mundo" direta não oferece mais Duplas (15/10, ordem dele). ⏳ Achar COMO a sala ganhou as duas marcas (a criação é exclusiva; 3 salas assim desde 13/10).

## 🚪 Quem aperta SAIR depois do apito continua dono do título (14/10, sala do Futpoint) — ✅
Guimarães SCI ganhou liga + Copa do Mundo e não apareceu no ranking/"Campeões de hoje". Causa: a partida é gravada 2×
(fim da liga e fim da Copa do Mundo); na 2ª, quem já tinha apertado SAIR era CPU no estado do dono e sumia do
`human_results` — o título ficava "de um bot". Conserto: a tela manda TODOS os times com `humano`, e o LigaHub herda a
gravação anterior da mesma partida (time já anotado como de alguém continua dele, com o user_id). Banco: a linha da
sala 3C6RII ganhou o Guimarães (liga + mundial) e os user_id de Real Pirituba/NICOLAS/Palmolego.
🚫 **Regra do Diego (14/10): quem SAI antes de acabar não ganha troféu** (*"isso não quero dar troféu p eles"*). Quem saiu
antes da 1ª gravação (fim da liga/copa) nem entra; quem saiu depois leva SÓ o que a gravação anterior já tinha anotado —
taça que o time dele ganhar depois, jogado pela CPU, não é dele.

## 🏆 Ranking da Semana: nome = o MAIS RECENTE da conta (14/10) — ✅ no banco
Diego: *"tem que ser com base no e-mail… quando ele trocar o nome, troca ali também"*. A vitrine já somava por conta
(user_id); só o NOME vinha errado (max = último no alfabeto → "M.D.REAL" no lugar de "LABUBU F.C"). `esc_vitrine_salas`
agora usa o nome mais recente da semana (`docs/sql/vitrine-nome-mais-recente.sql`). **A regra de contar NÃO mudou** (ordem dele).
✅ CASO 2 CONSERTADO (14/10, "Faça"): título de sala que o dono apagou (SAIR) ia pro lixo junto (`game_champions`
ON DELETE CASCADE). Agora vai pro `game_champions_arquivo` (gatilho que nunca trava o SAIR) e a vitrine soma os dois.
Semana de 12/10 recuperada: 214 temporadas (1 descartada por 2 campeões). Labubu 13 → 23, 1º da semana.
`docs/sql/titulos-sala-apagada.sql`. Só o RANKING DA SEMANA usa o arquivo (ordem dele). ✅ Conferido ao vivo (14/10 22h UTC): 3 títulos
de salas apagadas já caíram sozinhos no arquivo (origem `sala_apagada`).
⏳ O ranking GERAL (`esc_ranking_cache`) está com foto parada em 02/09 — avisado, sem mexer.

## 🐍 Tricolor do Arruda FC virou 🖋 FUNDADOR (14/10) — banco feito
souzact12 (Geovany, coração Santa Cruz, mascote cobra_arruda): `esc_compras_batismo` = plus. Já tinha fundador nº43 e o canto. ✅ GALA ÚNICA NO AR (14/10, v2 aprovada): `gala-arruda.tsx` (estádio com teto/refletores/degraus/torcida pulando, mosaico PRETO · BRANCO · VERMELHO igual à foto do Arruda, bandeirão com o escudo, a cobra numa BANDEIRA GIGANTE subindo de dentro da torcida em 2 mastros, "Ô ARRUDA!") + o CANTO DA TORCIDA dele tocando junto (`playMp3Gala`, abaixa no fim; respeita mudo), registrada em `GALA_UNICA`. Vídeo: `scripts/video-gala-arruda.mjs` → `scripts/posts/gala-arruda.mp4` (com som: `gala-arruda-com-canto.mp4`, áudio juntado com o ffmpeg do `pip install imageio-ffmpeg`). ⏳ Decidir se sobe pra Série A.

## 🛒 Loja (14/10, tarde) — ✅ NO AR
Gala única avulsa SAIU (custava o mesmo que subir pro Fundador, que traz tudo); fica 📣 canto avulso R$ 10 + dica "a gala vem no Fundador". Salas extras só aparecem pra quem NÃO cria à vontade (grátis/Craque novo).


## 14/10/2026 — 💪 COPA DO MUNDO COM MENOS ZEBRA ✅ NO AR
- Reclamação: "Camarões campeão" nas salas. Causa medida: gente pega as seleções fortes, a máquina fica com as do meio
  (Escócia, Suécia, Camarões…) e, quando a máquina ganha, é sempre um país "estranho" (9 de ~83 Copas).
- Peso da força no jogo da Copa 0,05 → 0,08 (`PESO_FORCA`, copa-mundo.tsx). Bots só: campeã fora das 9 fortes ~25% → ~10%.
  A força é a média do XI convocado, então convocação ruim continua perdendo (Brasil dos piores 11 × Camarões dos melhores:
  BR vence ~2%). Vale online (Copa criada depois de `FORCA_DESDE`) e carreira (carimbo `forte` no `emAndamento`); Copa já
  rolando termina com o peso velho.
- ⏳ Copas regionais continuam com 0,05 (motor próprio em `copa-regional.ts`) — mudar só se o Diego pedir.
- ⚠️ `npm run copamundo` já falhava ANTES desta mudança ("jogo de copa só conta com a Copa encerrada") — investigar.

## 🎟️ Salas extras do dia (14/10) — ✅ NO AR
(14/10, prints do Diego) Na Loja, tocar num plano abre a tela padrão do Apoie DO COMEÇO (Pra onde vai o dinheiro → todos os planos; "não joga ele no Lenda"). No aviso de limite de sala, os dois botões um embaixo do outro: 👑 ver os planos · 🎟️ 3 salas extras, e tem o botão 💛 VER TODOS OS PLANOS no topo.
Loja: 3 salas por R$ 4,90, só pra quem não cria à vontade (grátis e Craque novo); também no aviso amarelo de "já criou a sala de
hoje". Paga Pix + comprovante → Diego dá +3 no #admin (🎟️ Salas extras). O gatilho `esc_sala_por_dia` gasta 1 extra quando a sala
grátis do dia já foi usada; não vencem. SQL: `docs/sql/salas-extras.sql` (aplicado).


## 14/10/2026 — 🧑‍💼 PRESIDENTE DO USUÁRIO EM TODO CANTO (⏳ mockup enviado, esperando o OK final)
- Regra fechada: escudo = clube · presidente = pessoa (ver CLAUDE.md). 12 lugares no mockup (sala, chat, martelo, pódio,
  vitrine, jornal, presidência, troféus, caixa, convite, Central, perfil). Sugestão minha: começar por sala + pódio + presidência + jornal.
- Guarda-roupa por plano com as roupas que JÁ estão em `public/presidente-v*` + roupa avulsa (sugestão R$ 4,90).
- 🔁 15/10 (Diego): **boneco só do ⭐ Craque pra cima** — grátis não ganha nada (mostra o escudo no lugar). Quer VENDER
  boneco/roupa. Proposta enviada: Craque = boneco + roupas básicas · Lenda = + roupas de gala · Batismo/Fundador = + roupa com o
  manto do clube · Loja = roupa/cabelo avulso R$ 4,90. ⏳ Falta ele dizer se o GRÁTIS pode comprar o boneco avulso na Loja.
  Ele esclareceu: é a CRIAÇÃO DE PERSONAGEM. 2ª proposta (15/10): grátis monta pra ver mas não salva · Craque = pele + 14 roupas
  básicas + cabelos/barbas clássicos · Lenda = + 9 roupas especiais · Batismo/Fundador = + 10 roupas de gala · cabelos de craque
  (Neymar, Messi, CR7…) avulsos R$ 2,90 e roupas especiais R$ 4,90 na Loja. ⏳ esperando o OK.
  ➕ 15/10: quer VENDER CAMISA DE TIME DE CORAÇÃO pro personagem. Proposta: camisa nas CORES do time (listra/faixa do
  jeito do clube), SEM escudo oficial e SEM patrocinador — vender a camisa oficial com escudo é usar marca de clube pra
  cobrar. R$ 4,90 cada, começando pelos 20 da Série A. ⏳ esperando ele escolher.
  ✅ Decidido (Diego): *"nem o fundador terá"* — camisa de time NÃO vem em plano nenhum, nem no Fundador; é só comprada.
  ✅ Decidido (Diego): **camisa OFICIAL, com escudo** (avisado do risco de marca; a escolha é dele). Lista = os times de coração
  dos donos de batismo (`esc_socios.time_coracao`, 15/10): Corinthians 13 · Flamengo 7 · São Paulo 7 · Palmeiras 6 · Inter 4 ·
  Atlético-MG 3 · Grêmio 3 · Santos 3 · Cruzeiro 2 · Vasco 2 · Botafogo · CRB · Paraná · Paysandu · Remo · Rio Branco-PR ·
  Santa Cruz (17 do Brasil). ⏳ Próximo: mockup com 3 (Corinthians, Flamengo, São Paulo) no boneco antes de fazer o resto.
  🎽 15/10: 1ª versão (listrado genérico) reprovada: *"N ficou bom pq N é oficial"*. Ele mandou pesquisar a oficial SEM
  patrocínio. 2ª versão = Flamengo 2025 jogo 1 (6 pretas/5 vermelhas com filete, gola V preta, manga preta, 3 listras vermelhas
  no ombro, escudo e Adidas brancos) pintada SOBRE a camiseta branca da base (mesma arte, webp). Gerador:
  `python3 scripts/camisas-presidente/flamengo-2025.py <pasta>`; mockup em `scripts/mockups/camisa-presidente-flamengo-2025.png`.
  ⛔ 15/10, 2ª versão também reprovada: *"tá muito ruim a camisa do Flamengo. Melhor você não fazer isso agora"*. Camisa de
  time PARADA até ele pedir de novo (precisa de arte de verdade, não de pintura por cima da camiseta). O gerador fica guardado.
- FALTA: o editor (`presidente-editor.tsx`) está só na conta do Diego e a arte do rosto (`presidente-v2/*`) não está no repo.

## 🌐 Ideias pro online/Minhas Ligas (14/10) — ⏳ MOCKUP enviado
🏅 Prêmios da noite (fim de toda sala, sai dos dados do leilão) + 🏛️ Galeria da Minha Liga (campeões por temporada, quem manda
na liga, rivalidade). Mockup: `scripts/mockup-online-premios-galeria.mjs` → `scripts/mockups/online-premios-galeria.png`.
Outras na mesa: cartão pro grupo do zap, rivalidade, sala marcada. 🎨 Cor do nome NÃO se vende (reconfirmado 14/10).

## 🎁 Presente de plano + subida +R$ 5 (14/10) — ✅ NO AR
- Presente: Loja → escolhe plano, e-mail do amigo, nome, recado → `esc_pedir_presente` (servidor confere conta, plano, não é
  pra si) → Pix + comprovante → Diego ENTREGA no #admin (🎁 Presentes de plano). Craque/Lenda ligam o tier; Batismo/Fundador só
  marcam (montar pelo roteiro). Amigo vê "FULANO TE DEU UM PRESENTE!" ao entrar (`PresenteRecebido`). SQL: `docs/sql/presentes.sql` (aplicado).
- Subir de plano = diferença + R$ 5 (`TAXA_SUBIDA`). Cor do nome saiu do Lenda e NÃO virou item (Diego: pra não confundir).

## 🛍️ Itens novos da Loja (14/10) — ⏳ MOCKUP enviado, NÃO fazer ainda (ordem do Diego)
Escolhidos por ele: 🎁 dar de presente · 🎖️ título do lado do nome (troca quando quiser) · 😂 figurinhas da sala · 🎨 tema da
sala (quem cria escolhe, todos veem) · 🎆 festa do título com as cores e o canto do TIME DE CORAÇÃO (sem escudo de clube real).
Mockup: `scripts/mockup-loja-itens.mjs` → `scripts/mockups/loja-itens.png` (preços de exemplo).
🎁 14/10: presente APROVADO, mas **só de PLANO** (Craque/Lenda/Batismo/Fundador) — *"presente é só dos planos, nada de títulos figurinhas"*.

## 💳 Mercado Pago · PIX ÚNICO automático (15/10) — 🟢 NO AR SÓ NA CONTA DO DIEGO (`PIX_MP_GERAL = false`)
Diego trocou a Vendria pelo MP: *"somente Pix direto… tudo no Pix, Pix único só"* (nada mensal, nada de cartão).
✅ Diego: aplicação "Leilao Legends" (Checkout Transparente) · Secrets `MP_ACCESS_TOKEN` (renovado depois que a foto vazou)
e `MP_WEBHOOK_SECRET` · webhook do MP → `.../functions/v1/mp-webhook` (evento Pagamentos).
✅ Banco (`supabase/migrations/20261015220000_mercado_pago_pix.sql` + `…230000_mercado_pago_pix_v2.sql`): pedidos, preço NO
SERVIDOR (29,90/49,90/79,90/99,90, subida = diferença + 5, salas 4,90, teste R$ 1 só na conta dele), só conta se o MP disser
approved E o valor bater, `auto_liberar = true` (decisão dele: o automático entra sozinho — Craque prata · Lenda ouro · Batismo/
Fundador = ouro + `esc_compras_batismo` · salas +3). O personalizado (escudo, mascote, manto, canto, gala, nº de fundador, sócio)
continua no roteiro de batismo.
✅ Edge Functions `mp-criar-pix` (login obrigatório, sem pedir nada antes do Pix (o WhatsApp opcional vem DEPOIS de pagar, `esc_mp_telefone`), Pix vale 24h, guarda o QR pro "Pix esperando") e
`mp-webhook` (assinatura + busca o pagamento no MP antes de acreditar).
✅ Tela (`pix-mp.tsx`): gerar → COPIAR grande + QR → "esperando" (confere a cada 5s e ao voltar do banco) → "Pagamento
confirmado!". Batismo/Fundador: "✍️ Conta como você imagina o seu clube" (nome, coração, cores, escudo, mascote, canto no
Fundador) — POR ESCRITO, *"não quero que mandem imagem… eu que quero fazer as artes"* — + falar com o Diego por WhatsApp ou
e-mail. Ligada em: Craque (manual e pay), Lenda, Batismo/Fundador e salas extras da Loja. #admin: "💳 Pix do Mercado Pago"
(lista, 🖋 Batismos pra fazer, não pagos com WhatsApp, botão LIBERAR se precisar, 🧪 Pix de teste R$ 1).
⏳ Falta: (1) Diego fazer o Pix de teste de R$ 1 no #admin e ver o ✅; (2) o NÚMERO de WhatsApp dele (`WHATSAPP_CONTATO` em
pix-mp.tsx; sem número só aparece o e-mail); (3) ✅ LIBERADO PRA TODOS em 16/10 (Diego: *"pode liberar já o pix novo e configuração nova p todos"*; `PIX_MP_GERAL = true`); (4) cupom de influenciador no
batismo ainda não vale no Pix novo (preço do servidor ignora cupom); (5) ✅ moedas (ficha do Banco Legends nasce sozinha), canto avulso (registra + "conta qual canto") e presente
(entregue pro amigo) já vão pelo Pix novo (`…240000_mercado_pago_pix_v3.sql`); 2ª conta do Diego também testa; 🏦 moedas: comprou na Loja da home → escolhe a carreira na hora (cai sozinha quando ela abrir, `DepositoPix`); comprou pela 🛒 Loja aberta DE DENTRO da carreira (Clube › Finanças, no lugar do Banco Legends — Diego: "não deveria ter Banco Legends… apenas a loja direto"; só pra quem tem o Pix novo) → cai direto no caixa; o campo de código antigo mora dentro da Loja na carreira; sem escolher → aparece no Banco Legends com "Depositar neste clube" (`esc_mp_minhas_fichas` + `bl_redeem`) — Diego: "compra na tela que tá e depois escolhe o save" (creditar direto em save fechado = mexer em save guardado, não); (6) apagar a Vendria (`vendria-webhook`, `esc_vendria_eventos`, secret) quando ele confirmar.

## 🏅 Pódio da semana: medalha de 30 dias + avisos (19/10) — ✅ NO AR
Diego, segunda 0h09: *"Labubu, Gama e Paçoca foram o pódio… nenhum aviso embaixo, nada?"*. Feito (mockup `scripts/mockups/podio-30d.png`):
- `esc_vitrine_salas` ganhou `podio` (uids do top 3 de agora), `passada` (última semana fechada, de `esc_premio_semana`) e `ganhas`
  (medalhas da conta nos últimos 30 dias). Migration `20261019140000_podio_semana_30d.sql`.
- Nome = selo + medalha de agora + medalhas ganhas (`carregaMedalhaDaSemana`). Moldura/fita da sala e do chat pelo id (`podioDeUid`).
- Chat: `ChatCracha` mostra as medalhas e, pra quem está no pódio agora, borda de metal + "1º DA SEMANA" em cima.
- Ranking: caixa "🏆 PÓDIO DA SEMANA PASSADA" fixa; aparece mesmo com o ranking zerado na segunda.
- Telão: `useAnunciosGiro` põe o pódio em roxo (`podio: true`), a semana toda, sem mensagem nova no canal.
- Ainda não feito (não pedido): a moldura em outros lugares além de sala/chat (placar, martelo) — o nome com a medalha já vai.

## 🏆 Moldura do pódio da semana (15/10) — ✅ NO AR
Pedido do Diego: o top 3 do Ranking da Semana ganha algo MAIS FORTE que a medalha, sem mexer no fundo (fundo = cor do plano).
`podio-semana.tsx`: moldura de metal girando POR FORA da linha na lista de técnicos da sala (ouro · prata · bronze), coroinha
no 1º e fita "1º DA SEMANA" (ele testou "1º RANKING SEMANAL" e voltou pro "da semana"). Posição = a medalha 🥇🥈🥉 que já vai no nome (vem do banco).
Mockup: `scripts/mockup-podio-semana.mjs`. Ideia futura (não pedida): levar a moldura pra outros lugares (placar, chat).
✅ 16/10 (Diego: *"no ranking coloque a moldura que falamos"*): a MESMA moldura no top 3 do 📊 Ranking da Semana da home
(`vitrine-salas.tsx`), e o rodapé diz que o top 3 leva medalha + moldura + fita nas salas. ⏳ Ele falou *"além das moedas"* —
hoje o ranking da semana NÃO dá moeda; perguntado se quer criar prêmio em 🪙 (e quanto). Não inventar sem resposta.

## 🟢 Batismo ComVerissimo FC (15/10) — ✅ código + banco + deploy
cesar.verissimo27@gmail.com (conta existe desde 30/07). Plano 🖋 FUNDADOR. Série D no assento do bot Soberano Nacional
(`OLD_NAME` leva save antigo pro nome novo). Escudo 254×360/29 KB, mascote O Verissimo 241×440/38 KB, manto verde #034727 +
branco #F0F0EC medidos, camisa na Loja (`comverissimo-camisa-v1.webp`). Coração Palmeiras.
Banco: esc_socios nº73 (origem batismo, até 2099), esc_nomes_batismo 'comverissimo' (+FC/EC), esc_compras_batismo 'plus',
user_colors ouro manual. ⚠️ **Ele JÁ era fundador nº3 desde agosto** (Lenda pago) — ficou com o nº3, NÃO ganhou outro número.
Post: `scripts/posts/comverissimo-post.png`.
✅ Gala única NO AR (15/10): `gala-comverissimo.tsx`, no formato dos vídeos do Instagram dele (parede de camisas, notícia em
cima com a tarja @comverissimo, legenda branca com palavra amarela). O Diego recusou a 1ª versão (celular gravando com REC)
e mandou tirar o "NA SEMANA PASSADA". Vídeo: `scripts/posts/gala-comverissimo.webm`.
⏳ Falta só o **canto da torcida** (o Diego vai mandar) → carreira (`AMBIENTE_CARREIRA_POR_EMAIL`) + `playMp3Gala` na gala.

## 🐰 Batismo Labubu FC (14/10) — ✅ código + banco + deploy
caelborba@gmail.com (conta existe). Série A no assento do Só Deus Sabe FC, que DESCEU pra Série C na vaga do bot Napolitano (sem
OLD_NAME). Escudo 230×360/28 KB, mascote O Labubu 252×440/31 KB, manto branco #EFEEED + marinho #03101F medidos, camisa na Loja.
Banco: esc_socios nº72 (origem batismo, até 2099), esc_nomes_batismo 'labubu' (+FC/EC), esc_compras_batismo 'lenda', user_colors
ouro manual. **Sem número de fundador** (regra nova). Post: `scripts/posts/labubu-post.png`. ⏳ Falta: nome do dono pro rodapé do
post ("Batizado por —") (coração Real Madrid, confirmado pelo Diego e gravado no banco).

## 💳 Planos novos (14/10) — ✅ NO AR
✅ Vitrine pública: Craque 29,90 · Lenda 49,90 · Batismo 79,90 · 🖋 Fundador 99,90 (ex-Batismo Lenda), todos "PAGAMENTO ÚNICO", Sócio
fora, subida pela diferença no botão e no Pix. V2 (mensal) desligada até pra conta do Diego. FAQ atualizado.
✅ BANCO (já valendo): `esc_craque_antigo` (70 Craques de antes) + `salas_pagas` só Lenda+ ou Craque antigo (`docs/sql/salas-so-lenda.sql`).
✅ Conta do Diego = Fundador (`esc_compras_batismo` plus). K9 segue Batismo (antigo).
⏳ Falta: canto da torcida do Diego (Fundador tem direito); Loja do Clube de verdade; nº de fundador fora do Batismo é PROCESSO
(não inserir `esc_fundadores` em Batismo de 79,90).

## 🛒 Loja do Clube (14/10) — ✅ NO AR (faixa dourada na home; Ranking saiu da home). Canto = o do TIME DE CORAÇÃO do dono. Fundador aparece nas salas online dos outros em rodízio, mesmo sem jogar.
Botão 🛒 LOJA dourado no rodapé da home (no lugar do ÁLBUM repetido; no header não coube por causa do som). Mostra por plano:
subir de plano (só a diferença) · 🚁 gala única R$ 25 e 📣 canto R$ 10 SÓ pra Batismo (somam 35 > Fundador +25 = desconto de
quem sobe) · Fundador vê "já incluso" · 🏦 moedas (10/50/100 → ficha do Banco Legends, resgata na carreira que quiser).
Pagamento = Pix + comprovante (libera o Diego); nada é liberado pelo cliente. Fotos: `scripts/foto-loja-clube.mjs`.
(Mockup antigo abaixo, só pra história.)
Decisão em construção: volta Craque R$ 19,90 / Lenda R$ 39,90 (uma vez só) + SOBE DE PLANO pagando a diferença (Craque→Lenda
+20 · Craque→Batismo +60 · Lenda→Batismo +40) + vitrine de avulsos que gira toda semana (canto da torcida, comemoração, frase do
martelo, manto pronto, entrada de gala) + moedas do Banco Legends como FICHA guardada na conta, que a pessoa manda pra carreira
que quiser. Mockup: `scripts/mockup-loja-clube.mjs` → `scripts/mockups/loja-clube.png`. A Vitrine do Sócio ficou em espera.

## 🎽 Vitrine do Sócio (14/10) — ⏳ MOCKUP enviado, esperando OK do Diego
Ideia pra o mensal valer a pena: Sócio escolhe 1 escudo, 1 mascote e 1 manto de uma vitrine PRONTA (~10 de cada, iguais pra
todo sócio, feitas uma vez só = zero trabalho por pessoa). Abre só no 2º mês pago (contra "paga 1 mês e cancela"). Parou de
pagar → volta ao visual normal. Batismo segue sendo a arte única e pra sempre. Mockup: `scripts/mockup-vitrine-socio.mjs` →
`scripts/mockups/vitrine-socio.png` (artes de EXEMPLO). Ainda em aberto: plano anual R$ 79,90.

## 🤖 Bots voltaram a dar lance no leilão da carreira (14/10) — ✅ NO AR
Reclamação do Leão da Estradinha. Causa: banco de 22 cheio = bot sem vaga = sem lance. Conserto: 1 lance de reforço por setor
(só carta bem melhor que o pior titular); o jogador que perde a vaga vai LISTADO pelo bot no próximo leilão (bot recebe se vender;
ninguém comprando, cai no monte pela metade como qualquer lista). Código: `cpuEnvelope` (reforco), `resolve`, `marcaAVender`.
👀 Acompanhar: se o pessoal achar que bot agora disputa demais, subir o corte de `ganho >= 6`.

## 🧪 Trava `npm run copamundo` está vermelha (achado 13/10, JÁ vinha assim antes da abertura das copas)
Falha: *"🙈 jogo de copa só conta com a Copa encerrada na tela (sem spoiler)"* — reproduz no main anterior (bf9d63d), então não é da abertura. Conferir se é a trava desatualizada ou a ficha contando jogo de copa antes do apito.

## 💰 Preços novos (14/10) — ✅ NO AR: mensal R$ 9,90 · Batismo R$ 79,90 (era 69,90) · Batismo Lenda R$ 89,90 (igual)
Diego: *"coloca 9,90 o valor mensal, melhor"*. `PRECOS.craqueMensal` = 9.9 e todos os textos (vitrine, ajuda, Pix, liga, admin). Não havia link de cartão do Mercado Pago ligado (MP_CRAQUE_CARTAO = null), então nenhuma cobrança real ficou com o preço velho. Quem já paga continua igual.

## 🏟️ 1 sala por dia no grátis (14/10) — ✅ NO AR, DECIDIDO: fica 1 (*"1 sala só mesmo"*)
Gatilho no banco (`docs/sql/sala-por-dia.sql`), contagem zerada em 14/10; quem apoia cria à vontade; aviso amigável na tela com "entrar é sempre de graça" + link pro apoie. Medido nos 7 dias anteriores: com 1/dia, 349 de 731 salas do grátis seriam barradas (153 de 304 pessoas); com 3/dia, 84 salas (38 pessoas). Proposta levada: subir pra 3 (troca de uma linha no gatilho, sem deploy). ⏳ esperando resposta.
🗑️ Apagar save GRÁTIS parado há 30 dias — Diego: *"pode ser de antes já"* (vale pros que JÁ estão parados). Alvo medido: 90 saves de nuvem de conta grátis (17 MB de 624 MB) sem salvar, sem login e sem temporada jogada há 30+ dias; pagantes nunca. Feito: lixeira `esc_pyramid_saves_apagados` (7 dias pra devolver). ⛔ BLOQUEADO: o execute_sql cancelou a função 3 vezes (apaga dados → pede aprovação). Pronto pra o Diego rodar no SQL Editor: `docs/sql/limpa-saves-parados.sql` (cria, roda uma vez, agenda diário 4h07; tem como devolver e como parar). NADA foi apagado até agora.
📢 Post da comunidade: `scripts/avisos/2026-10-14-meta-apoio.json` → `scripts/posts/aviso-meta-apoio.png` (meta 22%, Luca, preços novos, 1 sala/dia). Tags novas no gerador: `apoio` e `regra`.

## ✉️ E-mail válido nas contas NOVAS (14/10) — ⏳ esperando o Diego decidir o serviço de e-mail
Diego: *"as novas contas têm que ser e-mail válido e as duas senhas iguais"* + **regra: "quem já tem conta não mude nada e permita normal ele jogar, mesmo com e-mail errado"**. Já existe no cadastro (`conta.tsx`): senha + confirmar senha (`erroSenhaNova`) e e-mail com formato/typo/temporário barrados (`emailProblema`). Falta só a confirmação por link: precisa de SMTP (Resend, 3 mil/mês grátis) porque o e-mail padrão do Supabase manda poucos por hora e entram ~770 contas/semana. As 14.721 contas atuais já estão confirmadas — ligar a confirmação NÃO trava nenhuma delas.

## 🔌 Integração com a Vendria (14/10) — 🟡 FASE 1 NO AR (recebe e guarda; NÃO libera nada ainda)
Docs que o Diego mandou (prints): POST com `Webhook-Id`, `Webhook-Timestamp`, `Webhook-Signature`, `Webhook-Secret-Version`; assinatura = `v1,` + base64url(HMAC-SHA256(segredo, id.timestamp.corpo_bruto)); entrega at-least-once (dedupe pelo `id`); eventos order.paid (completionKind PAYMENT/FREE), order.refunded, order.chargeback, subscription.started/renewed/past_due/cancelled/ended…
Feito: Edge Function `vendria-webhook` (código em `supabase/functions/vendria-webhook/index.ts`, verify_jwt off porque quem prova é a assinatura) → URL `https://faabglpjutwursgmrpny.supabase.co/functions/v1/vendria-webhook`; guarda em `esc_vendria_eventos` (RLS sem política = só o servidor). Sem o segredo configurado responde 500 (a Vendria tenta de novo).
✅ 14/10: endpoint criado e `VENDRIA_WEBHOOK_SECRET` salvo pelo Diego nas Secrets. ⚠️ Sobrou uma cópia do segredo na tabela `esc_segredos` (sem grant pra anon/authenticated, RLS sem política) — apagar no SQL Editor: `delete from public.esc_segredos where nome = 'VENDRIA_WEBHOOK_SECRET';` (o execute_sql cancelou). Como o segredo passou pelo chat, recomendado rotacionar na Vendria e salvar o novo direto nas Secrets. ⏳ Esperando a compra teste. (Antes:) Falta (Diego): criar o endpoint na Vendria com essa URL + eventos order.paid/refunded/chargeback e subscription.*; copiar o `whsec_` e salvar no Supabase (Edge Functions → Secrets → `VENDRIA_WEBHOOK_SECRET`); fazer 1 compra teste (pode ser gratuita/cupom 100% → completionKind FREE).
Falta (fase 2, eu): ler o 1º evento real guardado, achar e-mail do comprador e produto, e ligar a entrega (Sócio = esc_assinaturas; Batismo/Lenda = esc_compras_batismo + aviso pro Diego fazer a arte); refund/chargeback/subscription.ended revogam. Pedido FREE (cupom) não pode virar batismo sem o Diego conferir.

## 💸 Apoie: "Pra onde vai o dinheiro" + META DO MÊS (13–14/10) — ✅ NO AR (`SupportMoney` no fim dos dois modais de planos, no lugar do bloco "Quem faz isso aqui"; meta em `esc_meta_mes`, `docs/sql/meta-mes.sql`). Outubro em **22%** por escolha do Diego (*"não sei ainda quanto entrou, mas vamos colocar 22%"*). Custos conhecidos: Claude R$ 600/mês; Supabase ainda sem número. Quando ele souber o total de Pix e a fatura, atualizar a % (`update esc_meta_mes …`). Foto: `scripts/foto-apoie-dinheiro.mjs`.
Diego mandou o print do Brasileirinho: *"dizer aonde vai o dinheiro mas sempre com nossa forma de falar… padrões visuais"* + barra do mês (recebido × custo: Supabase + ~600 de Claude), com marca de "o jogo se paga" (100%) e "sustentável" (lucro; mockup usa 150%). Mockup `scripts/mockup-apoie-dinheiro.mjs` → `scripts/mockups/apoie-dinheiro.png` (52% é EXEMPLO).
⚠️ O jogo NÃO tem registro dos Pix recebidos (`esc_pagamentos` vazia — Mercado Pago ainda não ligado). Estimativa de outubro pelo que foi liberado no banco: 10 batismos (~R$ 650) + 16 ouros e 12 pratas mexidos no mês (parte é batismo/renovação) → algo na faixa de R$ 1.100. Falta o Diego dizer: quanto ENTROU de verdade e quanto o Supabase cobrou (e se os 600 de Claude são reais ou dólar). 🧩 Formato combinado (14/10): NÃO é tela nova nem título "Apoie o jogo" — é só a seção "Pra onde vai o dinheiro" + meta, DENTRO do modal de apoio, perto dos planos; a história do Diego vai INTEIRA dentro do quadro "Uma vida melhor pro Luca" (e sai o bloco separado do fim do modal); sem o subtítulo de cima (a faixa dourada já diz que não dá vantagem). 💛 Diego (13/10): o texto DELE ("Quem faz isso aqui", `SupportStory` em support-plans.tsx — o Luca, 120 casos no mundo) é melhor que o meu e SOBE pro topo da tela de apoio; na lista do dinheiro fica uma linha curta "Uma vida melhor pro Luca". Nunca reescrever o texto dele. ✂️ 14/10 ele encurtou a 1ª frase: *"Sou o Diego. De madrugada, faço esse jogo sozinho."* (sai o "de dia vendo carro com meu pai"). Ideia de produção: tabela de meta do mês que só o Diego edita (custo + recebido) e a tela mostra só a %.

## 📱☁️ "Volto e estou na 189 de novo" — Pé de Breque (13/10) — ✅ CONSERTADO
Causa: aparelho CHEIO (save de ~1 MB, 193 temporadas). O autosave no aparelho falhava CALADO e a cópia dele ficou na 189; o "Sair e salvar" subia a certa (193) pra nuvem e marcava o carimbo como "aparelho em dia" — então a home nunca mais baixava e o Continuar abria a 189. Diego: *"ele tem que usar o save onde ele quiser, seja PC, Chrome, celular"*.
Conserto (`store.tsx`): (1) `nuvemNaFrente` — mesmo com carimbo igual, pergunta à nuvem só o resumo (`esc_pyramid_progresso`, `docs/sql/pyramid-progresso.sql`, APLICADO) e baixa se ela estiver na frente; (2) se o aparelho não consegue gravar, a versão certa fica na MEMÓRIA (`carreiraAtivaPraAbrir`) e é ela que o Continuar abre; (3) o "Sair e salvar" só marca o carimbo se a cópia do aparelho estiver em dia; (4) autosave que falha mostra o aviso `AvisoSemEspaco` (pede pra apertar "Sair e salvar carreira" antes de fechar; sem botão de limpar — Diego: *"vai ter risco?"*). Nada apaga save; a nuvem continua só no Salvar.
⚠️ Limite: progresso jogado DEPOIS do último "Sair e salvar" num aparelho cheio só vive na aba aberta — por isso o aviso.

## 🆚⭐ Retrospecto entre amigos + craque do jogo (13/10) — ✅ NO AR (Diego: *"pode fazer o 1 e 2… copa dos campeões não quero"*)
- **Retrospecto**: `src/escalacao/retrospecto.ts` + banco `docs/sql/retrospecto.sql` (APLICADO: `esc_retrospecto` por par de contas, `esc_retrospecto_log` contra contagem dupla, RPC `esc_retrospecto_soma` só do host e só de quem está em `room_players`). RLS: cada um só lê os próprios pares; as tabelas não têm política de escrita (só a função escreve). Permissões fechadas também por grant (13/10, rodado em partes depois de um cancelamento): anon não lê nem escreve; logado só LÊ os próprios pares; o log não é acessível a ninguém; só a função escreve. Liga: grava na revelação da rodada; Copa dos 8/Liberta/Champions (mata-mata): grava quando a perna fecha. Leitura relê a cada rodada (anti-spoiler: o jogo da vez ainda não foi gravado). Só sala online de futebol, nunca carreira, nunca dupla. Fica de fora: grupos da Liberta, tabela da Champions, Copa do Mundo e regionais (seleções/clubes regionais, não o time da pessoa).
- **Craque do jogo**: no apito, a linha da rádio vira "⭐ CRAQUE DO JOGO" (gol 3, assistência 2; sem autor = sem craque). Vale em todo placar com a rádio (online e carreira).
- Trava `npm run retrospecto`. Foto `scripts/foto-radio.mjs` → `scripts/mockups/radio-real.png`.
- 🚫 Copa dos campeões do dia: ele NÃO quis. Não repropor.

## 🎮 Online: 3 IDEIAS (13/10) — resolvido acima
Mockup `scripts/mockup-3-ideias-online.mjs` → `scripts/mockups/online-3-ideias.png`:
1. **🆚 Retrospecto entre amigos** — antes da bola rolar, a linha da Rádio vira "VOCÊ × <dono>: 1V 0E 4D" + provocação. Só gente × gente, histórico de todas as salas (precisa de tabela nova no banco por par de contas).
2. **⭐ Craque do jogo** — no apito final, a linha mostra o melhor em campo (nome, carta, gols/assistências). Gol e assistência juntos (regra 19/09). Fake nunca é craque (regra 19/09).
3. **👑 Copa dos campeões do dia** — cartão na lista de salas, acima de "Campeões de hoje": os campeões de sala de ontem jogam uma copa automática à meia-noite com o time que montaram; campeão ganha carta. (Precisa guardar o elenco do campeão + rotina noturna no banco.)
Nada feito. Só codar o que ele escolher.

## 📻 Rádio Legends no placar (13/10) — ✅ NO AR pra todos (Diego: *"pode fazer isso aí! e coloque muita coisa variada… não quero toda hora repetições"*)
Módulo puro `src/escalacao/radio.ts` (trava `npm run radio`), ligado no `LiveScoreCard` → linha `ll42-radio` no `OnlineScorePresentation`. ABERTURA × LANCE × FECHO = 22 mil frases no meio do jogo (+ começo e fim próprios); 2000 jogos simulados = 93% de frases diferentes; nenhum lance repete no mesmo jogo. Nunca a menos de 3′ de gol ou de chance (o golzinho já narra chance — régua do "mesmo teatro duas vezes"); nunca fala de gol, pênalti, placar, jogador ou dono. Determinística (sala inteira ouve igual). Termômetro NÃO entrou (ele achou informação demais). Foto: `scripts/foto-radio.mjs` → `scripts/mockups/radio-real.png`.
💡 Pra crescer o acervo: mais linhas em `LANCES`/`ABRE`/`FECHA`, sempre o par PT/EN, sem gol/pênalti/placar (a trava reprova).

## 🥅 "Acertei todos os pênaltis e perdi" (13/10) — conferido
Simulei 200 mil disputas pelo caminho inteiro da tela (sequência real e remontada → `exactPenaltyRows`): **nunca** sai perdedor com todas as cobranças certas, a soma sempre fecha e nenhuma cobrança acontece depois de decidido. O motor está certo. O que existia era a TELA cortando a disputa no meio (Copa do Mundo e regionais da sala — consertado às 18:27 UTC de 13/10, commit `962dc5b`): o jogador via as próprias cobranças todas certas, a disputa sumia antes do erro dele e aparecia o resultado. A última Copa do Mundo de sala antes da conversa terminou às 18:20 UTC — 7 min ANTES do conserto. Se aparecer de novo depois disso, pedir o código da sala.

## ⚽ Simulação dos jogos: 3 IDEIAS (13/10) — ✅ virou a Rádio no placar (acima); craque do jogo e termômetro ficaram de fora
Diego: *"o que mais poderíamos implementar nas simulações dos jogos… coisas pra engajar"* → *"quero dos 3 mockup"*. Mockup `scripts/mockup-simulacao-3.mjs` → `scripts/mockups/simulacao-3-ideias.png` (placar real + peças desenhadas por cima). Nenhuma mexe em resultado, regra ou ritmo:
1. **📻 Rádio Legends** — narração correndo o jogo inteiro (falta, trave, defesaça, drible) com banco grande de frases PT/EN; o gol segue com o lance grande no placar (não repete); NUNCA narra pênalti; semeada à parte, sem saber do gol antes da bola entrar.
2. **⭐ Craque do jogo** — no apito: melhor em campo com nota, escudo, carta + 2 destaques; sai de gol + assistência (goleiro: defesa); na carreira soma na ficha.
3. **🌡️ Termômetro de pressão** — barra embaixo do placar pendendo pra quem está em cima, pulando nos "QUASE!" que já existem; só visual.
Nada feito. Só codar o que ele escolher.
🤔 Diego, vendo os dois juntos (`simulacao-termometro-radio-junto.png`): *"não sei se gostei… tem também a tática ofensivo/retranca/equilíbrio, a tabela, os jogos… tô na dúvida das informações"*. Proposta levada: nada de caixa nova; UMA frase da rádio dentro do placar, entre a faixa da bola e os autores dos gols, trocando a cada lance; termômetro fora. Mockup `scripts/mockup-radio-no-placar.mjs` → `scripts/mockups/radio-no-placar.png` (hoje × com a frase). ⏳ Esperando OK.

## 🥅 Pênaltis da Copa do Mundo online cortados na final (13/10) — ✅ CONSERTADO (+ regionais) · ⏱️ jogo da Copa → 16s
Diego: *"os pênaltis da Copa do Mundo deram bug na final, não apareceu todas as cobranças… e aumente mais 1s em cada jogo da copa"*.
- **Causa**: a disputa só entrava na tela em `liveDone`, que é DEPOIS de `duration + extra` — e o `extra` era exatamente a reserva pra disputa. A reserva passava em branco, a disputa começava no fim dela e a cerimônia (1,6s depois) cortava no meio. Nas outras fases o respiro da abertura (5–10s) disfarçava. **Agora a disputa entra aos 93'** (`liveMin >= 93`, ainda dentro do `extra`) em `copa-mundo.tsx` (seu confronto + final) e `copa-regional-online.tsx`; `sobraPens` segura o "avança" só pelo que ainda falta. Vale pra carreira também (mesmo código).
- **16s**: `docs/sql/online-copa-clock-16s.sql` APLICADO no banco (13/10). Achado: o +1s de 19/09 (`mais-1s.sql`, 15000) **nunca tinha chegado ao banco** — a função no ar era a de `oitavas.sql`, em 14000. Foi direto pra 16s (15 combinado + 1). Regionais também foram pra **16s** (*"sim, quero"*): `docs/sql/regional-clock-16s.sql` APLICADO + `ROUND_MS` local.

## 🏆 Copas do online: AS 3 PRÓXIMAS (13/10) — ✅ NO AR o resumo da fase e o artilheiro; ⛔ a CHAVE DESENHADA saiu no mesmo dia
Diego, depois de ver o fluxo tela por tela (`scripts/foto-copas-fluxo.mjs` → `scripts/mockups/copas-fluxo.png`): *"deixa só o resumo mesmo, sem chaveamento"* — chave e resumo contavam a mesma coisa. As fases recolhidas "ver resultados" e o "quem pega quem" da regional voltaram como eram. `ChaveCopa` continua em `online-match-visual.tsx` sem ninguém usar (o bundle tira), pronta caso ele queira de volta — não religar sem ele pedir.
Mockup `scripts/mockup-copas-proximos.mjs` → `scripts/mockups/copas-proximos.png`; foto dos componentes REAIS `scripts/foto-copas-proximas.mjs` → `scripts/mockups/copas-proximos-real.png`. Peças em `online-match-visual.tsx` (CSS `ll41-*`): `ChaveCopa` · `ResumoFase` · `CampeaoCopaCard` · `ArtilheiroCopaCard`. Só apresentação: nenhuma regra, relógio ou resultado mudou.
1. **Chaveamento desenhado** — Copa dos 8/Liberta/Champions (screens.tsx, no lugar das fases recolhidas "ver resultados"; 🏀 segue com as recolhidas), Copa do Mundo online (`chaveMundo`, do sorteio em diante) e regionais (no lugar da lista "quem pega quem" + fases recolhidas). Anti-spoiler: a fase de agora só com NOMES; placar só de fase fechada (passo virou, ou apitou e os pênaltis já rolaram — `liveDone` inclui a disputa). Toque num jogo fechado abre o `CompetitionMatch` (agregado + pênaltis).
2. **Resumo da fase** — 5s antes da abertura, só em virada de FASE (`RESUMO_MS` em `copa-passos.ts`, `respiroAntes(…, comResumo)`): quickCopa (`resumoOn`, respiro da virada 5s → 10s; no manual também troca resumo → abertura, sem contagem), Copa do Mundo (`resumoAberto` em `copa-clock-preview.ts`, `passoComResumo` = oitavas/quartas/semi/final; antes das oitavas é o resumo dos GRUPOS, com os 16 que caíram em linha corrida) e regionais (fases do mata-mata; antes da 1ª é o resumo das rodadas, os classificados dos dois lados). SQL do relógio intacto (o respiro é decidido no aparelho do dono). Carreira (Copa do Mundo offline) NÃO mudou.
3. **Artilheiro no fim** — tela de fim do rápido/Minhas Ligas (campeão em cartão com escudo, dono e a final; artilheiro com gols/clube/carta + 2º/3º; a tabela completa recolhida), cerimônia da Copa do Mundo online e das regionais (a lista de 5 virou o cartão).
⚠️ Dourado no cartão de campeão SÓ pra quem ganhou (regra de tier); pros outros, branco.

## 🎬 Abertura da rodada nas copas das salas online (13/10) — ✅ NO AR em TODAS: Copa dos 8 / Libertadores / Champions / Copa do Mundo / regionais
Diego: *"quero que some depois da abertura… e sempre aparece quando for começar outro confronto… pode fazer"*. Feito em `AberturaCopa` (online-match-visual.tsx) dentro do `CompetitionStage` do quickCopa (screens.tsx): aparece no `firstLegPending` (10s de leitura de sempre) e em toda fase nova (`copaJustAdvanced`, respiro 3,2s → 5s); some quando a bola rola. A caixa "aguardando o pontapé" some junto. Só no visual online público; NBA/basquete fora.
- [x] **Copa do Mundo e regionais do online** (Diego: *"ok mas faça os outros também"*): a pausa entre passos é decidida no APARELHO DO DONO (`dueClockCommand` / `useRelogioRegional`), o banco só carimba — então `respiroAntes()` em `copa-passos.ts` (5s antes de passo que roda bola, 0,5/1,6s nos outros) resolveu SEM mexer no SQL. A abertura aparece no palco (`CupScreen` só com `online`; `CopaRegionalTorneio`) com a contagem lida do `updated_at` do relógio (todo mundo vê igual). Carreira (Copa do Mundo offline) NÃO mudou. Rodada grande lista o seu jogo + 5 e "+N confrontos".
Diego: *"o que fazer pra deixar as telas das copas quando começam os jogos mais organizadas… todas: Mundo, Champions, regionais, Libertadores"*. Mockups `scripts/mockup-abertura-copas.mjs` → `scripts/mockups/abertura-copas.png` e o HOJE × DEPOIS `scripts/mockup-abertura-copas-antes-depois.mjs` → `scripts/mockups/abertura-copas-antes-depois.png` (ele cobrou: *"tô falando do online, tá? sala rápida e Minhas Ligas"*): 5s antes da bola rolar, tela com o CAMINHO da copa (fases, o seu marcado) + CONFRONTOS da rodada escudo×escudo (o seu em destaque) + contagem; a bola rola sozinha. Mesma peça pra Copa do Mundo, Liberta, Champions, Copa dos 8 e regionais (só troca cor/arte). Sem passo novo, sem toque.

## 🦁⬆️ Leão da Estradinha volta pra Série A (13/10) — ✅ NO AR
Diego: *"coloque o Leão da Estradinha de volta na Série A… troque pelo Vidraceiro, e Vidraceiro entra no lugar dele"*. Troca 1:1 em `DIVISION_TEAMS` (sem OLD_NAME). Arte nova do dono (jorgericardo777): escudo 256×360 · mascote 370×440 · camisa da Loja sem shorts (saiu o `RECORTE_CAMISA`) · manto remedido `#950C0D`/branco no `batismos.ts`, `MANTO_CONTAS` E no `esc_socios`. Post: `scripts/posts/leao-estradinha-cara-nova.png` (flag nova `--volta` no `mockup-batismo.mjs`). Nome do dono no post ficou em branco (não sei o nome — não inventar).

## 🚫🔴 Tirar destaque de live falsa (13/10) — ✅ NO AR
Diego: *"com algum botão de fácil acesso tiro o destaque… o usuário recebe uma faixa… quando fecha não aparece mais… se fizer de novo aparece novamente"*. Botão na lista de salas (só a conta do Diego vê; o banco confere o e-mail) grava em `esc_live_tirada` (`docs/sql/live-tirada.sql`); a lista deixa de destacar a sala. O dono da sala de stream recebe a faixa (`aviso-live.tsx`, leitura a cada 2 min só pra dono de sala com Modo Stream). O jogo da sala nunca é tocado.


## 13/10/2026 — 💳 PLANOS V2 COM NOMES NOVOS (⏳ esperando OK visual — NÃO está na main)

Decisões do Diego: **Sócio** = o mensal R$ 12,90 (ganha NÚMERO DE SÓCIO; tier ouro dourado pros NOVOS — antigos não
mudam, e isso já era a regra de `tierEfetivo`). **Batismo** = R$ 69,90 · **Batismo Lenda** = R$ 89,90 (gala única +
canto). Os dois batismos ganham **Fundador nº** e MANTÊM moedas + estádio ("batismo mantém tudo"). **Sem desconto** do
Sócio pro batismo (ok dele). Exemplo dos cartões do batismo = **Neymarzetti** (escudo, mascote, camisa, helicóptero).
Listas de cada plano mais compridas ("parecer que tem bastante coisa"). Sócio: 1º Modo Manual, 2º ♾️ "Cria quantas salas
quiser por dia" (A FAZER: hoje o limite é `LIMITES_SALA.rapidasAbertas`), manto SEM "2 cores". Os dois batismos listam
tudo do Sócio item por item (`ItensSocio batismo`).
⚠️ FALTA fazer de verdade, depois do OK: o Sócio mensal ganhar número de sócio + manto 2 cores + estádio com nome
(hoje a assinatura não cria linha em `esc_socios`), e trocar os nomes "Craque"/"Plus" no Pix (`apoie-v2.tsx`) e no
texto das regras (screens.tsx). Planos v2 seguem só nas contas do Diego (`PLANOS2_GERAL = false`).
🛡️ REGRA DO DIEGO (13/10): **quem JÁ é Craque ou Lenda hoje fica EXATAMENTE como está** — continua criando salas do
jeito de hoje, mantém a cor do tier de hoje e tudo o que já tem. Os planos novos (Sócio, limite de 1 sala/dia do grátis,
dourado do Sócio) valem só pra quem entrar DEPOIS. Ao implementar os limites, conferir que nenhum Craque/Lenda antigo
cai na régua nova.
Pedido seguinte (13/10): Sócio diz "4 carreiras guardadas PRA SEMPRE na nuvem — todos os saves, mesmo parados";
Gratuito diz "entra em quantas salas quiser" + "🌐 cria 1 sala online por dia" + "carreira parada há mais de 30 dias
sem jogar é apagada". ⚠️ TUDO ISSO É SÓ TEXTO: falta o limite de 1 sala/dia no grátis e a limpeza dos saves parados
(no grátis o save fica no APARELHO — confirmar com o Diego antes de apagar qualquer coisa).
🗑️ PEDIDO DO DIEGO (13/10): apagar carreira PARADA há mais de 30 dias de quem NÃO paga — conta POR CARREIRA (a conta pode
ter 3 saves e só 1 estar parado). Contagem na nuvem (`esc_pyramid_saves`, `careers[*].at`) em 13/10: 5.282 contas, 1,3 GB.
Grátis: ~3.280 contas com carreira parada · ~4.550 carreiras paradas (2.973 contas paradas por inteiro + 463 carreiras
paradas em 307 contas que jogaram no mês). Pagantes (167 contas) NÃO entram. Save do aparelho não dá pra contar daqui —
o próprio jogo limpa quando abrir. ⚠️ Revoga o "quem já tem save na nuvem continua igual" de 07/10 — é ordem dele.
✅ FEITO 13/10 (lado da NUVEM, "pode… só os que devem ser mesmo"): `esc_limpa_saves_parados` tirou **3.977 carreiras
de 2.892 contas** grátis que não abriram o jogo em 30 dias (login + renovação de sessão) e nunca pagaram nada. Contas
intactas (2.892/2.892), 0 pagante na lixeira, carreira jogada no mês ficou. Tudo em `esc_saves_lixeira`, volta até
12/11 (`apagar_em`). Roteiro: `docs/sql/lixeira-saves.sql`.
⚠️ FALTA criar no banco `esc_lixeira_devolve` e `esc_lixeira_esvazia` (estão no roteiro; o pedido foi cancelado na tela
do Diego) — o esvazia tem que rodar a partir de 12/11. E a lixeira ainda ocupa espaço até lá.
A FAZER (precisa mockup): aviso NO JOGO "essa carreira apaga em 7 dias se você não jogar" pra carreira grátis parada há
+30 dias (o celular decide, porque só ele sabe a data real) e depois apaga.

## 13/10/2026 — 🛡️ COPAS REGIONAIS COM ESCUDO OFICIAL
- `copa-regional-online.tsx` usava o `Escudo` genérico; agora usa `SeloClube` (o mesmo do Leilão de Clubes), que pega o
  escudo oficial de `public/escudos-clubes/` quando existe. ~28 dos 48 clubes já têm.
- ⏳ FALTA arte oficial de: Juventude, Caxias, Figueirense, Avaí, Criciúma, Paraná, Ipatinga, Londrina, America-RJ,
  Madureira, Volta Redonda, ABC, América-RN, Botafogo-PB, CRB, CSA, Confiança, Sampaio Corrêa, Moto Club, River-PI
  (seguem no selo genérico até entrar em `scripts/escudos-oficiais.mjs`).

## 13/10/2026 — 💳 PAGAMENTOS AUTOMÁTICOS (decidido com o Diego, ⏳ a fazer)
- **Mercado Pago:** Batismo (69,90) e Batismo Lenda (89,90) em Pix de uma vez OU cartão; Sócio (12,90/mês) SÓ no cartão
  (assinatura que cobra sozinha). Webhook do MP avisa o jogo e libera sozinho.
- **Vendria:** Sócio no **Pix Automático** (ordem dele: *"pix normal no mercado pago do sócio não quero… tem que ser
  automático no vendria"*). Taxa vista no site: 4,9% + R$ 1,99 (ou 3% + 1,99 no simulador) — de 12,90 ficam ~10,30.
- Falta: o Diego colocar a chave do MP no Supabase (nunca pelo chat) e mandar o link de integração/webhook da Vendria.
- Sócio que não paga volta pro grátis sozinho; Craque/Lenda antigos não mudam (regra de 13/10).

## 13/10/2026 — 🖋 BATISMO e 🖋✨ BATISMO LENDA NA VITRINE DE TODO MUNDO (ordem do Diego: "já pode alterar e fazer")
- Os dois cartões viraram um componente só (`CartoesBatismo`, support-plans-v2.tsx), usado na vitrine PÚBLICA e na v2:
  exemplo Neymarzetti, lista inteira com "tudo do Sócio" item por item.
- Regra de série que vale HOJE na pública: **Batismo R$ 69,90 = Série B/C/D/Várzea · Batismo Lenda R$ 89,90 = Série A +
  gala exclusiva + canto**. (Na v2, `serieA`, os dois dizem Série A — decisão antiga da v2; confirmar com o Diego antes de
  liberar a v2.) O botão de cada cartão abre o Pix já na série certa (`setSerieBatismo`).
- Nomes trocados também no Pix (v1 e v2), nas perguntas de ajuda e na lista de planos (agora "São 5"); corrigido o
  "Série A custa mais (R$ 69,90)" → 89,90.
- Sócio mensal, Gratuito novo e os limites continuam SÓ nas contas do Diego (`PLANOS2_GERAL = false`).

## 🐛 Marcelo repetido no leilão (13/10) — ✅ CONSERTADO
Causa: em 26/09 a carta "Marcelo Vieira" (Real Madrid 2017) virou só "Marcelo" no catálogo. Quem já tinha a carta (Renaton) ficou com o nome VELHO no save; pro jogo eram duas pessoas, então o "Marcelo" de nome novo ficou livre, um bot (Leite de Verdade FC) pegou e listou. Conserto: `CARTAS_RENOMEADAS` (data.ts) + `sincronizaNiveis` troca o nome velho pelo novo em todo save que abre (livro de preços, "no seu clube" e artilharia vão junto) e `curaCartaRepetida` tira a cópia de bot/ficha de fundo/baralho/mesa do pregão/monte quando um HUMANO tem a carta. Trava: `npm run renomeada`.



## 13/10/2026 — 🥇🥈🥉 MEDALHA DO TOP 3 DA SEMANA AO LADO DO NOME

Diego: *"quem tiver no ranking da semana no top 3 fica com a medalhinha ao lado do nome no tier… se passar ele
perde… se tiver empate todos que estiverem empatados ganham também"*.
- A posição vem de `esc_vitrine_salas` (`eu.pos`, `rank()` → empate divide: 1º,2º,2º = ninguém 🥉).
- `apoio.tsx`: `carregaMedalhaDaSemana()` (chamada no lobby quando a conta aparece) + `apoioSelo()`/`apoioName()`
  grudam 🥇/🥈/🥉 depois do selo do plano (vale pra grátis também). Cache de 60s em `vitrine-dados.ts`
  (a vitrine e a medalha usam a MESMA chamada).
- ⚠️ O nome é montado ao CRIAR/ENTRAR na sala: quem perde o top 3 no meio da sala só perde a medalha na PRÓXIMA.
- Ninguém forja: `stripEmoji` tira 🥇🥈🥉 de nome digitado.

## 13/10/2026 — 🏆📊🖋️ VITRINE EMBAIXO DO "ATUALIZAR LISTA" (mockup aprovado: "sim pode fazer e publicar")

- `src/escalacao/vitrine-salas.tsx` (`VitrineSalas`), chamado no lobby logo depois do 🔄 Atualizar lista.
- 🏆 Campeões de hoje: ORDEM DE QUEM VAI GANHANDO (mais recente em cima), 5 linhas, só gente (`human_results`).
- 📊 Ranking da semana: títulos online desde segunda 0h (Brasília), top 5 + "você" tracejado. Liga + cup_titles.
- 🖋️ Último batismo: maior `socio_n` com origem 'batismo' (hoje Rossini Money — o Diego confirmou), escudo +
  mascote + botão que abre a vitrine dos PLANOS rolando até o cartão do batismo (startScreen `batismoInfo`, 13/10 —
  o Diego reclamou que antes caía direto no Pix, sem explicar o que o batismo ganha).
- Tudo numa chamada: RPC `esc_vitrine_salas()` (aplicada no banco; nota em docs/sql/vitrine-salas.sql). Banco
  sem resposta = a vitrine some, a lista nunca trava. Mockup: `scripts/mockup-lobby-engaja.mjs`.

## 🔁 Rival com banco: cansa, se machuca e tem 22 + mais dinheiro pros bots (13/10) — 🟢 LIBERADO PRA TODOS em 13/10 (`BOT_BANCO_GERAL = true`; Diego: "pode publicar pra todos já")
Diego: "pode fazer" + 3 avisos separados (`scripts/avisos/2026-10-13-rivais-{22,cansam,dinheiro}.json` → `scripts/posts/aviso-rivais-*.png`).
- Motor puro `src/escalacao/bots-banco.ts` (`planoCansacoBot`, `PATROCINIO_BOT`, `premioColocacaoBot`); trava `npm run bots-banco`.
- Cansaço: só bots da SUA divisão, só com o seu gás ligado (C+), só a partir de `botFadigaDesde` (marcado na 1ª virada depois de ligar → temporada em andamento nunca muda). Plano derivado (passado imutável); `botCarry` atravessa a virada (vem da tela, na action). Começando a 100 ninguém cansa na 1ª temporada (escada −1,4/jogo) — aparece da 2ª em diante.
- 22: no Leilão de Reservas todo bot vira `deepSquad` e gasta o caixa; no FINISH_CEREMONY `completaBancoDosBots` fecha 2 por posição com sobra REAL pagando `justoDaCarta` (nunca incógnito).
- Os 3 caminhos da virada (Diego: *"o bot também pode participar de qualquer leilão novo"*): **Leilão de Transferências** (bot mira 22 no pregão + completa depois) · **Leilão novo do zero** (todo mundo monta 11, o bot completa o banco no fim da cerimônia) · **Mesmo time** (sem leilão: o bot completa o banco no `CONFIRM_MESMO_TIME`).
- 🧠 Bot ESPERTO no banco (Diego: *"ele pega se ele quiser… e vai melhorando aos poucos"*): separa uma parte do caixa pelo perfil (gastador 60% · pão-duro 25% · …), em cada vaga leva o MELHOR que cabe na verba (caro demais = não pega), e todo começo de temporada faz 1 troca (2 o gastador) se tiver sem-clube +6 de nível melhor que o pior do elenco — dispensa o pior.
- 🧠 O bot PENSA COMO GENTE no leilão (Diego 13/10, "pode fazer e publique"): teto = categoria (lenda 90 › craque 65 › promessa 42 › bom 26 › prof 16) × economia × NECESSIDADE (bem melhor que o pior titular 1,15 · parecido 0,6 · reserva 0,35) × tempero fixo por bot+carta (0,85–1,15) × perfil; bolso: até ½ do caixa se vira titular, ⅓ se reserva. Mínimo acima do que vale pra ele → não dá lance; senão lance entre o mínimo e o teto. `travaPisoDoBot` vale pra TODO bot (exagero não sobe piso). Substituiu o "ir até o mínimo do dono" do mesmo dia. Valores da tabela NÃO mudaram (decisão: piso mexe em salário/renovação de todo save).
- Dinheiro: patrocínio no `balancoBot` + prêmio de colocação (`premiosColocacaoBots`) no `clubRewards` da virada.
- Central: notícias de DM, poupados e desfalque do seu próximo adversário.
- [x] Liberado pra todos + linha em novidades.ts. Os 3 avisos prontos em `scripts/posts/aviso-rivais-*.png` (Diego posta).
Diego gostou de "rival também cansa e machuca" + "pode comprar 22" + "bots têm que ganhar mais dinheiro". Mockup `scripts/mockup-rival-banco.mjs` → `scripts/mockups/rival-banco.png`: todo bot 2 por posição (hoje só rival/backstop tem `deepSquad`), gás/lesão pros bots (`guardaCansaco` pula bot; lesão só rola o XI humano), notícias no giro, e 2 receitas novas no `balancoBot`: patrocínio = `masterPorTemporada(div, 2)` + prêmio por colocação. Só carreira. Números de folha no mockup são estimativa — medir antes de cravar.

## 🔜 "Não sai, ainda tem competição" (13/10) — ✅ NO AR (Diego: "Perfeito. Pode fazer. E serve pra todas competições que tem convocação")
Código em `src/escalacao/proxima-competicao.tsx`. Faixa (últimas 5 rodadas, toda competição da sala) em `EscSeason`; colocação desce e diz "Agora tem X ↑" no fim; "Não sai!" + chamada na vez (vibra/apito/título da aba/cartão) no portão da Copa regional e da Copa do Mundo (as que têm convocação). Na convocação só vibra/apita — a tela dos 11 já abre sozinha. 🔁 Mesmo dia: Diego lembrou que Copa dos 8/Liberta/Champions da sala NÃO têm convocação → a faixa e o "Agora tem X" ficaram SÓ pra Copa do Mundo e regionais. E a escolha de clube/seleção caiu de 45 → **40s** (`SEG_ESCOLHA`/`SEG_BANDEIRA`).
Gente sai da sala no fim da liga sem saber que vem Copa regional/Copa do Mundo/Liberta/Champions/Copa dos 8, e na hora de escolher clube já saiu. Mockup `scripts/mockup-proxima-competicao.mjs` → `scripts/mockups/proxima-competicao.png`: (1) faixa nas últimas 5 rodadas · (2) competição no TOPO do fim com "Não sai! Sua vez em ~2 min" e sai o "Ano que vem tem pregão de novo" (screens.tsx ~10628/10752) · (3) na sua vez: vibra + apito + título da aba "⚠️ SUA VEZ!".

## 💬 Chat da sala melhorado (13/10) — ✅ NO AR o 1, 3 e 4 (Diego: "faz 1, 3 e 4 somente"). 🚫 O 2 (zoeira rápida em botões) ele NÃO quis — não repropor. 🔁 E no mesmo dia tirou o ESCUDO do 1: *"deixa apenas o nome dourado… pra não ficar muita informação"* — só o nome na cor do plano.
Peças em `src/escalacao/chat-sala.tsx` (usadas pelos dois chats). Responder = campo `re` na mensagem (versão velha ignora). Aviso: `scripts/avisos/2026-10-13-chat-sala.json` → `scripts/posts/aviso-chat-sala.png`.
`scripts/mockup-chat-sala.mjs` → `scripts/mockups/chat-sala.png`. 4 ideias: (1) escudo do clube + cor do PRÓPRIO tier no nome · (2) zoeira rápida (botões prontos, espera de 3s) · (3) responder com citação · (4) gaveta mais baixa sem escurecer o pregão. Sem "digitando" (não pode gastar realtime a mais). Mexe só no `ChatWidget` (screens.tsx) e no `LobbyChatDock` (lobby.tsx).


## 13/10/2026 — 💳 BATISMO PLUS AGORA É R$ 89,90 (era 79,99)

Diego: *"coloque o mais top por 89 que ganha a mais canto da torcida… e entrada de gala exclusiva"* → perguntei e ele
escolheu **"Plus passa a custar 89"** (continua com gala única + canto; Lenda segue R$ 69,90). Preço mora em
`PRECOS.batismoPlus` (planos-regras.ts); tela, Pix e painel do admin leem dali. Trava: `npm run planos`.
⚠️ Os planos v2 ainda estão SÓ nas contas do Diego (`PLANOS2_GERAL = false`); pro público continua a tela velha
(Batismo B/C/D/Várzea 69,90 · Série A) — e nela, a pedido dele (*"só os valores novos do batismo"*), a **Série A virou
R$ 89,90 e ganhou gala exclusiva + canto da torcida na Carreira** (screens.tsx `precoCheioBatismo`, support-plans.tsx e
o texto das regras). Quem já comprou a 79,99 fica como está.

## 📏 Medidor de mensagens ao vivo (13/10, Diego: "Ok pode") ✅ NO AR — invisível pro jogador
Motivo: a conta do Supabase passou de ~40 milhões de mensagens ao vivo no mês (o plano inclui 5 milhões).
Cada aparelho conta o que RECEBE e o que MANDA por tipo (estado, ação, chat, emoji, mascote, som, presença,
banco) e grava UMA linha a cada 10 min em `esc_realtime_medidor` (`src/escalacao/medidor-realtime.ts`,
`docs/sql/medidor-realtime.sql`). Desligar = `MEDIDOR_LIGADO = false`.
- [ ] Depois de 1–2 dias: rodar a consulta do `.sql` e dizer pro Diego quanto é chat × emoji × jogo.
- [ ] Propor o corte (suspeito nº 1: o dono mandando o ESTADO inteiro pra sala toda) — explicar e esperar OK antes de mexer.
- [ ] Depois da medição, desligar o medidor (ele mesmo gera uma gravação por pessoa a cada 10 min).


## 12/10/2026 — 🐛 CAMPINHO DO 3-5-2 ESPREMIDO (print do Arudo FC)

Os alas (laterais) do 3-5-2 descem 14px num embrulho `<div>` sem `flex: 1 1 0` — o ala ficava com a largura do
NOME inteiro e os 3 meias eram espremidos no meio, um por cima do outro. Conserto: o embrulho ganha o mesmo
`flex: 1 1 0; minWidth: 0` da raiz do `JogadorNoCampo` (pyramidseason.tsx, aba Elenco). Vale pra TODO mundo
de 3-5-2 (e o líbero do 5-3-2 líbero, que usa o mesmo recuo). Conserto não vira novidade.

## 🟢 LIBERADO PRA TODOS (13/10, Diego: "pode publicar"): economia dos bots + SAF que vira 2º clube
- `ECON_BOTS_GERAL = true` e `SAF2_GERAL = true` (sport.ts). Linhas novas em `novidades.ts`. Vídeo (`scripts/video-saf-reels.mjs`)
  e aviso (`scripts/posts/aviso-2026-10-13-saf-2o-clube.png`) liberados pra postar.
- Decisões dele na hora de liberar: **o auxiliar NUNCA dá lance no leilão** (*"quem manda é o usuário"*) — o clube parado fica fora
  do leilão (como já era: `auctioningManagers` tira quem está `dormindo`); **ranking global conta só o clube principal** (já era:
  `pyramidseason.tsx` não manda o retrato quando `multiClubeAtivo`). Dinheiro: caixa separado por clube; só passa por aporte
  (principal → 2º), transferência de jogador pelo valor oficial ou venda do 2º clube. Taças: cada clube guarda as suas.
- Conserto junto: com as duas ligadas, a SAF pagava o emprestado 2× (metade do empréstimo + folha do bot) — emprestado saiu da
  `folhaDoBot`.

## 💰 Economia dos bots na carreira (13/10) ✅ NO AR — liberado pra todos no mesmo dia (ver acima)
- Mockup aprovado: `scripts/mockups/carreira-bots.png` ("Perfeito pode fazer"). Na virada, cada clube bot ganha a MESMA
  TV da divisão (`TV_COTA`) + bilheteria (`BOT_BILHETERIA` A 40 · B 30 · C 20 · D 12 · V 6) e paga a folha (maior entre
  pago e tabela ÷ 10). O que passa do teto (`BOT_CAIXA_TETO` A 900 · B 700 · C 500 · D 300 · V 150) "vira obra"; quem já
  estava acima (save antigo) não perde nada. O teto do LANCE não mudou (categoria × fator da sala, máx 4×).
- Central ganhou "💰 Caixa dos rivais" (4 mais ricos + você + o mais liso, com nota do Martelo quando ele chega liso).
- Código: `aplicaEconomiaBots`/`balancoBot`/`folhaDoBot` (store.tsx), trava `npm run econ-bots`.
- ⏳ Diego testar numa carreira dele → liberar pra todos (`ECON_BOTS_GERAL = true`).
- 🎬 Vídeo da SAF→2º clube pronto (`scripts/video-saf-reels.mjs`) — NÃO postar antes da SAF nova estar no jogo.
- ✅ SAF que vira 2º clube CODADA (ver a seção logo abaixo) — só nas contas do Diego.

## 🏢➡️⚽ SAF que vira 2º clube — REGRAS APROVADAS PELO DIEGO (13/10, "Ok pode ser assim") · ✅ CODADO, SÓ NAS CONTAS DO DIEGO
- **Chave:** `SAF2_GERAL = false` em `sport.ts` (testers: as duas contas do Diego). Desligada = SAF e 2º clube antigos
  EXATAMENTE como eram (a trava `npm run saf2` confere isso também). Liberar pra todos: `SAF2_GERAL = true` + linha em
  `novidades.ts` (PT/EN) na mesma entrega.
- **Código:** regras puras em `src/escalacao/saf2.ts` (tela e reducer usam as mesmas) · telas em `saf2-telas.tsx` (mockup
  ②③④⑤⑥⑦⑧) · estado em `EscState.saf2` · ações `SAF2_ASSUMIR / VENDER_SAF / VENDER_2O / APORTE / TRANSFERIR / EMPRESTAR /
  MIGRAR` (store.tsx). Trava: `npm run saf2` (82 conferências, inclusive a virada de verdade).
- **"Janela" = a tela da temporada ANTES da 1ª rodada** (rodada 0, as "decisões da virada"). Assumir, vender, migrar,
  emprestar e transferir só ali. Empréstimo vale 1 temporada e volta sozinho na virada seguinte; cada lado paga METADE
  do salário (a SAF paga a metade dela do `clubCash`).
- **Decisões tomadas sem perguntar (conferir com o Diego):** (1) as 10 temporadas contam do `careerFilial.since` (todo
  save já tem a data da compra); (2) taça conta enquanto o clube é SEU 2º clube — inclusive ganha com o auxiliar no
  comando; a internacional só conta se era ele no comando; (3) 2º clube antigo começa a coleção do zero na 1ª virada com
  a chave (o histórico velho não separa título "antes/depois"), por isso vale o piso de 3.000; (4) na migração "fica com
  a SAF" o caixa POSITIVO do 2º clube antigo volta junto pro principal ("ninguém perde dinheiro"); (5) o 2º clube que
  nasce da SAF continua destravando a categoria 👑 Lenda na Agência (senão subir de degrau tirava um destrave);
  (6) empréstimo entre os dois clubes: 2 de cada lado (mockup "1 DE 2"); (7) com 2º clube não se compra SAF (escada única).
- ⏳ Diego testar numa carreira dele (com SAF antiga, com 2º clube antigo e com os dois) → liberar.
Análise: `docs/analise-carreira-2026-10-13.md`. **Mockup completo: `scripts/mockups/carreira-saf-completo.png`** (os
mockups `carreira-saf.png`/`carreira-saf-venda.png` são versões velhas — valem os números daqui).
- **Escada:** compra a SAF (**2.000**, igual hoje; precisa estádio completo; clube da Série D; bot no comando) → depois de
  **10 temporadas como dono da SAF** pode "assumir o comando" (**4.000**, igual hoje), só na virada da temporada, e ela vira
  o 2º clube jogável.
- **2º clube só pra PAGANTE — qualquer um** (Craque, Lenda, Batismo; antigo ou plano novo). Aviso visível: "⭐ Só pra quem
  apoia o jogo: Craque, Lenda ou Batismo" + link pros planos. (Hoje o código pede só `ouro`.)
- **Vender é pra dar prejuízo; lucro no máximo +500** (Diego: *"gosto mais do prejuízo porque ninguém mandou ele comprar"*):
  · **SAF = pela DIVISÃO dela na hora da venda:** Várzea 500 · D 1.000 · C 1.500 · B 2.000 (empata) · A 2.500 (+500).
  · **2º clube = pela COLEÇÃO DE TAÇAS ganhas com você no comando**, cada uma UMA vez: Série A · Copa do Brasil · Supercopa ·
    Libertadores · Champions · Mundial (Copa do Mundo NÃO conta). 0 taças = 3.000 · 6 taças = 6.500 (+500) · proporcional
    no meio (2 = 4.170). O caixa do clube volta junto (dívida desconta).
  · RECUSADO (não repropor): 2º clube vendendo por divisão (*"se pegar já na Série A e vende já ganha"*), venda por "quanto
    subiu" em %, título de Série B/C/D somando, título repetido somando, lucro acima de 500.
- **Empréstimos:** na fase SAF continuam com a SAF; virou 2º clube → **entre o principal e o 2º clube**, mesmas regras (só na
  janela, 1 temporada, volta sozinho, metade do salário pra cada lado — fecha o furo do salário). Transferência de vez pelo
  valor oficial, 1 por janela.
- **2º clube no dia a dia:** troca entre rodadas de graça; o clube sem você fica com o **auxiliar** (escala, renova, repõe com
  o caixa dele); caixa próprio; caixa no vermelho = sem lance no leilão (destrava vendendo ou com **aporte**, que só vai do
  principal pro 2º e não volta).
- **Quem hoje tem SAF e 2º clube SEPARADOS:** na próxima virada aparece UMA tela "O jogo mudou: escolha qual manter". Fica com
  o 2º clube → a SAF sai e devolve **2.000 inteiros**; fica com a SAF → o 2º clube sai e devolve **4.000 inteiros**, e a SAF
  já pode virar 2º clube na hora (sem as 10 temporadas). Ninguém perde dinheiro.
- **Quem tem só a SAF:** continua; as 10 temporadas contam desde a compra. **Quem tem só o 2º clube antigo:** continua igual;
  na venda recebe o MAIOR entre o jeito antigo (3.000) e a coleção de taças.
- Também na fila: 💰 dinheiro dos bots (mockup `scripts/mockups/carreira-bots.png`, esperando OK).

## 🏢➡️⚽ SAF que vira 2º clube — REGRAS FECHADAS COM O DIEGO (13/10, "Sim") · ⏳ AINDA NÃO CODADO
Análise: `docs/analise-carreira-2026-10-13.md`. Mockups: `scripts/mockups/carreira-saf.png` + `carreira-saf-venda.png`
(⚠️ os números do mockup de venda são VELHOS — valem os daqui).
- **Escada:** compra a SAF (**2.000**, igual hoje) → depois de **10 temporadas como dono da SAF** pode "assumir o comando"
  (**4.000**, igual hoje) e ela vira o 2º clube jogável. Assumir só na virada da temporada.
- **2º clube só pra PAGANTE — qualquer um** (Craque, Lenda, Batismo; antigo ou plano novo). Aviso bem visível na tela:
  "⭐ Só pra quem apoia o jogo: Craque, Lenda ou Batismo" + caminho pra apoiar. (Hoje o código pede só `ouro`.)
- **Venda é difícil de lucrar de propósito** (Diego: *"gosto mais do prejuízo porque ninguém mandou ele comprar"*;
  lucro NO MÁXIMO +500):
  · **SAF = pela DIVISÃO dela na hora da venda:** Várzea 500 · D 1.000 · C 1.500 · B 2.000 (empata) · A 2.500 (+500).
  · **2º clube = pela COLEÇÃO DE TAÇAS ganhas com você no comando**, cada uma conta UMA vez: Série A · Copa do Brasil ·
    Supercopa · Libertadores · Champions · Mundial (Copa do Mundo NÃO conta). 0 taças = 3.000 (metade dos 6.000);
    6 taças = 6.500 (+500); entre os dois, proporcional (3 taças = 4.750).
  · Ele RECUSOU (não repropor): venda por divisão no 2º clube (*"se pegar já na Série A e vende já ganha"*), venda por
    "quanto subiu" em %, títulos de Série B/C/D somando, títulos repetidos somando.
- **Quem já tem (grandfather, ninguém perde nada):** SAF antiga continua, as 10 temporadas contam desde a compra.
  2º clube antigo continua igual; na venda recebe o MAIOR entre o jeito antigo (3.000) e a coleção de taças.
- Do mockup aprovado em conceito (detalhar números na hora de codar): empréstimos só na janela, 1 temporada, metade do
  salário pra cada lado (fecha o furo do salário); auxiliar toca o clube que ficou sem você (escala, renova, repõe);
  transferência interna pelo valor oficial; caixa próprio, dívida trava lance, aporte só principal → 2º clube.
- Também na fila: 💰 dinheiro dos bots (mockup `scripts/mockups/carreira-bots.png`, esperando OK).

## 💴🔴⚫ Batismo Rossini Money (12/10) ✅ NO AR
- Dono `luizeduardorossini0013@gmail.com` (conta já existia ✔). **Série A**, no assento do **Bagres de Wall Street FC**,
  que DESCEU pra Série B no lugar do bot **Fatality FC** (o último bot da B; segue no jogo rápido). Sem OLD_NAME (ninguém
  foi renomeado). ⚠️ Agora A e B estão 100% batizadas: o próximo batismo de A/B precisa que alguém desça pra C.
- Arte do dono (prancha chroma): escudo 287×360/28 KB (tirada uma pena solta) · mascote "O Ninja" 295×440/40 KB (tirado o
  texto "Disciplina, Estratégia, Dinheiro" que encostava) · camisa da Loja. Manto: preto #120D0D (79%) + vermelho vivo #C21C1B.
- Banco feito: user_colors ouro · esc_fundadores 90 · esc_socios 71 · esc_nomes_batismo "Rossini Money" (FC/EC pelo gatilho).
- Post: `scripts/posts/rossini-post.png`. ⏳ Falta time do coração e apelido (usei "Rossini").
- ⚠️ A mascote é o Itachi (Naruto) — avisei o Diego que é personagem de outra empresa; decisão dele.

## 💰 Batismo mais caro nos planos de hoje (12/10) ✅ NO AR
- Diego: *"aumente o valor dos batismos pra 69 e 79"*. Planos v1 (os que todo mundo vê): Série B·C·D·Várzea **59,90 → 69,90**
  e Série A **69,90 → 79,99** (os mesmos números do v2: Lenda 69,90 · Plus 79,99). Pix, vitrine, FAQ PT/EN e cupom seguem o valor novo.


## 12/10/2026 — 📲 FAIXA DA COMUNIDADE TAMBÉM FORA DA HOME (some de vez ao fechar/entrar)

Pedido: *"coloque p todos… seja carreira ou online. Mas se fecharem essa aba ou entrarem no link N precisa mais
aparecer… só desse novo. Já o aviso na home e nas salas mantenha sempre"*.
- `ComunidadeBanner` (index.tsx) agora aparece em TODA tela; fora da home usa a chave própria
  `esc-comunidade-zap-jogo-vista`, gravada no ✕ **ou** no toque em ENTRAR → some pra sempre naquele aparelho.
- A faixa da HOME (chave `esc-comunidade-zap-fechada`) e o quadro verde da lista de salas NÃO mudaram.
- 📲 13/10: o quadro verde da página de salas subiu pro TOPO (antes ficava no fim da lista), pedido dele.
- 🔨 Some DURANTE o leilão (auction · monte · convocacao · streamIntro) — pedido dele pra não comer tela no pregão.
- Tirar tudo: `COMUNIDADE_LINK = null` (comunidade.ts).

## 🤝🛡️ Escudo errado em sala de DUPLAS (12/10) ✅ NO AR (OK do Diego: "Ok")
- Sala 0TTPMC: o time "Neymarzetti|Fabulous EC" (5º dono) apareceu com o escudo e o saci do **Guimarães SCI** (assento
  cru nº 4, parceiro de outra dupla). Causa: `esc_mimos_sala` devolve o assento CRU do banco (conta parceiros e buracos);
  o time do jogo é numerado só pelos DONOS (`seatUids`). Também podia acontecer em sala normal com buraco de quem saiu.
- Conserto (`store.tsx`): assento cru → conta (`room_players`) → posição em `seatUids` → time. Estado velho sem
  `seatUids` = casamento de antes. Trava: `npm run mimos`.
- 🤝 Regra de dupla aplicada (proposta minha, confirmada pelo Diego): o time veste o batismo do **DONO** do assento;
  se o dono não tem e o parceiro tem, veste o do **parceiro**; nenhum = escudo pelo nome. O aparelho do parceiro segue a
  mesma regra (não pinta o time com o batismo dele).

## 🏆 Premiação da resenha embaixo do time desde a 1ª tela da cerimônia (12/10) ✅ NO AR
- Diego (print da sala zoando os 55 nos goleiros do Bayern): zoeira *"na cerimônia de revelação, embaixo dos times das
  pessoas… já no início, sem ter que passar todos os times"*. A premiação (achado · mico · 💸 mão furada · mão de vaca ·
  perna-de-pau) já existia, mas só aparecia depois do ÚLTIMO elenco (`isLastMgr`). Agora fica embaixo do time sempre.
- Mão furada de pacote do Leilão de Clubes escreve "Goleiros do Bayern" (campo `pac` no `resenha.furada`), não "Bayern".
- ❌ A faixa por carta na revelação (1ª leitura minha, errada) foi desfeita — não usar.

## 🥊⚫⚪ Batismo Inter Vale FC (12/10) ✅ NO AR
- Dono `marcus.viniciuslopessantos79@gmail.com` (conta de 30/08, existia antes do batismo ✔). **Série C**, no assento do
  bot **Tetéia SAF** (1º bot sem dono da C; `OLD_NAME` leva save antigo pro nome novo; o Tetéia SAF segue no jogo rápido,
  por isso o nome velho NÃO desenha o escudo novo). Técnico na pirâmide: "Marcus". Fundador nº89 · sócio nº70.
- Arte do dono (prancha chroma, recorte limpo): escudo 346×360/29 KB · mascote "O Lutador" (muay thai, na pedra
  "Disciplina Força Vale") 322×440/42 KB · camisa da Loja. Manto medido: preto #0E0E0E (73%) + branco #E4E3E1.
- Banco feito: user_colors ouro · esc_fundadores 89 · esc_socios 70 · esc_nomes_batismo "Inter Vale" (FC/EC pelo gatilho).
- Post: `scripts/posts/intervale-post.png`. ⏳ Falta o time do coração (post e `esc_socios.time_coracao`) e o nome/apelido
  que ele quer no post (usei "Marcus", do e-mail).

## 🎬 Pênaltis de verdade nas salas rápidas e Minhas Ligas (12/10) ✅ NO AR
Queixa do pessoal: *"sempre perde… sempre tem algo óbvio… às vezes buga nos pênaltis"*. Auditoria: o sorteio é justo
(76% por cobrança, 50/50, sem força de time), MAS a tela **reconstruía** a sequência a partir do placar — mesmo placar =
mesma cena, e na morte súbita todo mundo "acertava". Agora `disputaPenaltisComSequencia` guarda cada cobrança em
`QuickCopaTie.pensSeq` ('1' gol / '0' erro) e a `PensShootout` mostra a fita real (`sequenciaGuardada`). O placar NÃO
mudou (mesmo consumo do rng — trava `npm run penaltis`, 20 mil disputas). Sala/save antigo sem fita = reconstrução de antes.
Copa do Mundo e copa regional seguem reconstruindo (motores próprios) — se ele quiser, é o mesmo passo lá.
- ⏳ **Propostos, SEM OK**: (b) o PULAR do dono esperar a disputa acabar (hoje corta pra todos); (c) morte súbita mais
  rápida depois de ~8 cobranças. Peso de time mais forte no pênalti: decisão separada, não pedida.
- Também: a disputa da lista de jogos da copa regional passou a dizer se tem gente (`lento`), igual à disputa grande.

## 🏟️ Lista de salas mostra a copa extra (12/10) ✅ NO AR
- Sala de estadual aparecia "só liga": a lista lê colunas magras e não tinha a do estadual nem a da Copa do
  Mundo depois da liga. Nova coluna `ls_copa2` no gatilho (`docs/sql/lista-salas-copa-extra.sql`, aplicado) +
  degrau novo na busca. Rótulo por escrito, sem emoji: "Liga + Rio × São Paulo" / "Liga + Copa do Nordeste" /
  "Liga + Sul × Minas-Paraná" (também nas opções de criar sala).
- 📲 Lista de salas: quadro verde da COMUNIDADE do WhatsApp no lugar da linha do grupo VIP (`comunidade.ts`).

## 📲 Faixa da comunidade do WhatsApp (11/10) ✅ NO AR
- Faixa verde SÓ na home (`ComunidadeBanner` em index.tsx), no fluxo da página (não tampa nada), link
  `chat.whatsapp.com/KfSkVvbjjdiHptHfJE5hQN`, ✕ esconde no aparelho. Tirar: `COMUNIDADE_LINK = null`.
- Saiu a faixa amarela "As lendas ganharam cara" (`AvisoVersaoNova`) da home, a pedido dele.

## 🏛️🃏 Cartinha dos dois clubes (Multiclubes) (11/10) ✅ NO AR
- Reclamação: usuário ganhou a Série B com o 2º clube e ficou sem carta. Causa: bilhete do pacote era UM por
  temporada (`co:solo{seed}:{N}`) → com os dois clubes campeões, o 2º batia no bilhete usado; clube dormindo só
  recebia via "pacote guardado" (que só abria trocando o comando) e a Supercopa dele não dava nada.
- Agora: principal = bilhete de sempre; 2º clube = `…:mc{id}` (chave pelo CLUBE, trocar o comando não duplica);
  clube que dorme ganha a carta NA HORA (divisão, Copa do Brasil/Legends, Supercopa); `recordDormantCards`
  não guarda mais pacote (`CARTA_DORMINDO_NA_HORA`), os antigos ainda abrem. Trava: `npm run cartinha`.
- Agência continua UMA lista pros dois clubes (Diego: "deixe uma mesmo pros dois"). SAF não ganha carta.
- ⏳ Devolver a carta da Série B desse usuário: falta o e-mail dele.


## 12/10/2026 — 🤝 DUPLAS NA TOCAIA E NO LEILÃO DE CLUBES (OK do Diego: "Ok")

Pedido: *"teria como fazer o jogando dupla para esses dois modos também… tocaia e jogador,
tocaia e clubes, envelope e clubes"*. Achado na análise: a sala JÁ deixava escolher Duplas
com Tocaia/Clubes, mas **Tocaia + Duplas estava quebrada** (o PEGAR ia sem crachá → o motor
recusava os DOIS da dupla) e na **convocação dos Clubes** valia só quem mandasse primeiro.
Regra única, a mesma divisão 3 e 3 do envelope:
- 🐊 Tocaia: `holPodeAgora(…, uid)` checa `duplaPodeAgir` (tela = motor) e o PEGAR leva `by`.
  O parceiro vê o preço caindo com a caixa "🔒 Quem pega GOLEIRO é Fulano" + botão assumir.
- 🧱 Clubes/envelope: já seguia a divisão (o pacote é de um setor). Nada mudou.
- 🧱 Convocação: cada um marca SÓ os seus setores (aba do parceiro com 🔒 e o nome); o host
  junta as duas metades (`donosDaConvocacao` + `convocacaoDuplaFeitos`); o time fecha quando
  os dois mandam ou o relógio acaba (vaga vazia = pior do pacote, como sempre).
- Peças novas: `useDuplaVez` + `CaixaDuplaTrava` (screens.tsx). Trava: `npm run duplas`.
- 🟢 Publicado em 12/10 depois do "Sim" dele às fotos.

## 🏟️ Relógio da Copa regional no banco (11/10) ✅ APLICADO
- `docs/sql/regional-clock.sql` rodado no Supabase a pedido do Diego: tabela `esc_regional_clock` (RLS + 3 regras:
  ler = dono/jogador da sala · criar/mudar = só o dono) e função `esc_regional_clock` (só logado; só o dono comanda).
  Teste: sem login barrado · sala inexistente = relógio nulo · não-dono barrado. Foi em pedaços (a versão inteira
  estourava o tempo da ferramenta). Desfazer: `drop function public.esc_regional_clock(...)` + `drop table public.esc_regional_clock`.




## 11/10/2026 (noite) — 📰 COPA REGIONAL NO JORNAL, NO HISTÓRICO E NOS TROFÉUS DA SALA

Pergunta dele: *"o jornal qd acaba tb tá dando o campeão da Copa do Nordeste…?"* — NÃO
dava. Ordem: *"pode fazer e publicar… tudo deve ser igual… troféus, motor, tudo parecido c
outros modos de liga mais alguma copa"*.
- `screens.tsx`: o `aoStatus` da copa regional agora entrega o campeão (`setCampeaoDoMundo`),
  igual à Copa do Mundo → libera o jornal, o `LigaHub` grava `copa_champion_name`.
- `jornal-sala.tsx`: `mundo.copa` = nome da copa regional. Manchete "O X LEVA A LIGA, O Y
  (Clube) LEVA A COPA DO NORDESTE!" / "COPA RIO × SÃO PAULO" / "FAZ OS DOIS".
- `ligahub.tsx`: título novo `'regional'` (5 pts no placar da sala, chip 🏟️ Regional, igual
  Copa/Liberta/Mundial). Nenhuma função do banco lê `cup_titles` (conferido).
- Ranking GLOBAL não ganha pontos (a Copa do Mundo online também não dá) — se ele quiser,
  é outra conversa.

## 11/10/2026 (noite) — 🏟️ COPA REGIONAL: TABELA ANTES DOS JOGOS, PLACAR GRUDADO E CHAT

Prints dele na Copa do Nordeste ao vivo: *"a tabela tem q ficar em cima dos jogos rolando…
qd descer a tela… a aba do placar header aparecer em cima… o chat sumiu qd começou o
campeonato… isso serve p todos estaduais"*.
- Ordem nas rodadas: placar grande → controle → **as duas tabelas** → clássicos da rodada.
- 🪶 Tira do placar no topo ao rolar = a MESMA peça da liga online (`FaixaPlacarMini` +
  `usePlacarFora`), só com os gols até o minuto da tela (`PlacarQueGruda`).
- 💬 O modal da copa (`CMModal`, z 99996) cobria o botão do chat (z 99990). Agora o
  `ChatWidget` vai DENTRO do modal do torneio regional.
- O título "🎮 CONTROLE DA PARTIDA" saiu: o CSS do cinema já escreve "RITMO DA PARTIDA"
  no mesmo lugar (estava embolado no print).
- ⚠️ A **Copa do Mundo online** usa o mesmo modal — o chat provavelmente some lá também.
  Não mexi (ele pediu os estaduais); perguntar se quer igual.

## 11/10/2026 (noite) — ⏱️ COPA REGIONAL: 45s PRA ESCOLHER + AVISO DE 15s ANTES

Print dele numa Copa do Nordeste ao vivo: *"reduza o tempo p 45s p escolha do time nos
estaduais… tem q ter um banner avisando antes c 15s que irá abrir a contagem por ordem de
classificação e o time n escolhe no tempo o sistema dará o pior time"*.
- `SEG_ESCOLHA` 60 → **45** (`copa-regional-online.tsx`) + textos do lobby, novidade e vídeo.
- Fase nova **`aviso`** (15s, `SEG_AVISO`) gravada pelo dono ao abrir a copa; só depois dela
  a vez do 1º abre. Banner dourado igual ao da convocação: ordem da tabela · 45s cada · não
  escolheu = pior clube que sobrou. Aparelho com versão velha vê só "aguardando" nesses 15s.
- A Copa do Mundo online NÃO mudou (ele pediu só os estaduais).

## 🌍 Copa do Mundo online "muita zebra" (10/10) — investigado, SEM mudança (decisão do Diego: "Não")
- Refeitas as 22 Copas online da noite com a mesma semente: campeão bateu em todas → não é bug.
- Causas: (1) quem estoura o tempo da convocação leva os piores do país (regra dele) — Espanha 76, Brasil 58;
  (2) zebra de jogo único: Itália x Camarões = 17% zebra / 24% empate (peso 0.05 em `playMatch`).
- Proposta de subir o peso pra 0.08 (zebra 17%→8%, só Copa nova) foi RECUSADA. Não repropor sem ele pedir.

## 🏟️ Copas regionais convocadas nas salas online (10/10) 🟢 LIBERADA PRA TODOS EM 11/10 (`REGIONAL_GERAL = true`)
- Diego: *"pode publicar, vamos testar pra todos"*. Ficou com 16 na Rio × SP (simulação: os 8 grandes ganham ~98% das copas; Bangu ~1 em 170). Se ele achar chato, a saída combinada é cortar pra 12 (8 grandes + Bangu, America, Portuguesa, Guarani).
- Código: motor puro `copa-regional.ts` (trava `npm run regional`) · tela `copa-regional-online.tsx` (portão + escolha 60s +
  convocação 90s + torneio) · opção no lobby (só tester) · marca da sala `regionalNaLiga` · baralho regional em
  `cartas-regionais.ts` (vazio até o Diego aprovar a lista) entrando no leilão SÓ na sala regional (`regionalSala`/`setActiveCatalog`).
- O tamanho sai do baralho: hoje Rio × SP joga com 4 por lado (semi + final), Sul × Minas com 2 (final direta) e o Nordeste
  aparece "em breve" (só o Bahia fecha time). Com as cartas, cresce sozinha até 16.
- ⏳ SQL `docs/sql/regional-clock.sql` (relógio sincronizado da sala) NÃO aplicado — a criação pelo MCP voltou "cancelled".
  Sem ele cada aparelho conta o próprio relógio (mesmo resultado, ritmo não anda junto e sem botão manual pro dono).
- ❓ DECISÃO PENDENTE ANTES DA LISTA: metade dos nomes famosos dos clubes pequenos JÁ está no baralho BR em clube grande
  (Zizinho Flamengo, Djalma Santos Palmeiras, Careca SP, Evair Palmeiras, Luís Fabiano SP…). Como a carta regional se mistura
  com o baralho BR na sala regional, isso bate na regra de 26/09 (mesmo jogador só em baralho diferente). Perguntei ao Diego:
  abrir exceção só na sala regional (Zizinho Bangu + Zizinho Flamengo, igual os dois Cafu na seleção) ou só usar quem não
  está no baralho.
- ✅ CARTAS FEITAS (10/10, 444 no baralho regional): as TRÊS copas fecham 16 clubes (8 por lado), com os clubes que o
  Diego escolheu. Ele VETOU trocar clube (*"eu quero que seja Volta Redonda mesmo… não quero que tire o Moto Club e o
  River"*): Volta Redonda (Taça GB 2005/vice carioca), Moto Club (campeão maranhense 1977) e River-PI (Copa do NE 2024)
  ficaram, e o Índio do Juventude saiu (trocado por Capone, Wallace, Patrício, Alcir e Mário Tilico, da final de 1999).
  Regra pra próximas: NUNCA trocar clube da lista sem ele mandar — pesquisa até achar. Lista em `docs/listas/cartas-regionais.md`.
- ✅ DECIDIDO (10/10): só entra jogador FAMOSO (bom ou ruim) que NÃO esteja no baralho BR. Indicação da Rio × SP enviada
  (conferida contra o `data.ts`; xará de outra pessoa pode): Bangu 1966 fecha (14) · Guarani 1978 fecha (11 + Amoroso que já
  existe) · Ponte 1977, São Caetano 2000-02, Portuguesa e America-RJ parciais (6–10) · Madureira e Volta Redonda sem nomes
  famosos suficientes → sugeri trocar. Esperando o OK dele pra virar carta (com categoria e ano).
- ⏳ Lista de jogadores dos clubes pequenos pra aprovação · ⏳ jornal O MARTELO ainda não fala da copa regional ·
  ⏳ título da copa regional ainda não vai pro Rank (de propósito, até ele dizer quanto vale).

- Ideia fechada com o Diego: Liga + Rio × SP · Liga + Sul × Minas-PR · Liga + Nordeste. 16 clubes por copa, dois lados de 8,
  cada clube joga contra os 8 do OUTRO lado (formato real da Copa do Nordeste 2018-22, 8 rodadas); 4 de cada lado → quartas
  cruzadas (1º × 4º do outro lado), semi e final. Os 16 primeiros da liga escolhem o clube na ordem da tabela e convocam (90s).
- 🃏 Clube pequeno (Bangu, Olaria, Treze…) ganha cartas num BARALHO REGIONAL que NUNCA entra no leilão normal (pedido dele).
  Regra fechada (10/10): carta regional NÃO entra na carreira nem em sala nenhuma de outro modo (nem 🃏 Jogador, nem 🧱 Clubes).
  Na sala de copa regional ela entra no leilão MISTURADA com o baralho inteiro, do jeito de sempre, sem regra nova.
- Cartas que faltam (meta 14 por clube): Rio × SP ~50 · Sul × Minas ~85 · Nordeste ~150. Rio × SP é a mais perto.
- Regras dele na aprovação: escolha pela ordem da tabela da liga (só os 16 primeiros, não 20); o 1º escolhe qualquer clube,
  depois o 2º e assim por diante; **60s por pessoa**, quem não escolher fica com o **pior clube que sobrou**; convocação com o
  MESMO tempo da convocação do Leilão de Clubes (`CONVOCACAO_MS` = 90s).
  A LIGA continua com 20 (padrão de hoje); os 16 primeiros vão pra copa e os 4 últimos ficam de fora, assistindo (10/10).
- Mockup: `node scripts/mockup-copas-regionais.mjs`. Ideia extra ainda sem decisão: "⚡ direto no estadual" (sem liga).



## 11/10/2026 — 🧩 "DEPOIS DA LIGA" EM DUAS PRATELEIRAS (print do Diego)

*"Tá sem a separação do mockup q vc tinha feito"*. Agora o seletor da sala tem as duas
prateleiras do mockup aprovado: **⚽ COM O SEU TIME** (Liga + Copa · Liga + Liberta · Só
Champions · Só liga) e **📋 CONVOCANDO** (Liga + Mundo · Rio × SP · Sul × Minas-PR ·
Nordeste). É o mesmo `Seg` dividido em dois — o valor escolhido continua um só. A tarja
"TESTE" que ele viu era da versão antiga no celular dele (a nova diz NOVO).

## 11/10/2026 — 🎬 REELS DAS COPAS REGIONAIS

Pedido dele: *"quero vídeo de mockup tb padrão.. anunciando as ligas estaduais"*.
`node scripts/video-regionais-reels.mjs` · 1080×1920 · ~37s · molde dos outros reels.
Cenas: chegaram as 3 copas · a liga de sempre (16 de 20 vão pra copa) · escolha na ordem
da tabela (60s, não escolheu = pior que sobrou) · convoca 11 em 90s (Garrincha/Didi/Jairzinho
do Botafogo) · dois lados de 8 → quartas cruzadas → final · +444 cartas de clube pequeno
(só nas copas regionais) · onde jogar + marca. Os relógios do vídeo correm acelerados e a
tela avisa. Texto do post mandado no chat.

## 💳 Planos v2 NO AR SÓ PRO DIEGO (09/10) + plano de pagamento — mensal R$ 12,90
- `PLANOS2_GERAL = false` (sport.ts): diego e diego2 veem a vitrine nova, o mensal (Pix/WhatsApp · 💳 cartão no
  link de assinatura do MP — escondido até existir o de R$ 12,90 · Direct), batismo Lenda/Plus, Dúvidas e
  travas novas. Todo o resto vê o V1 intacto. Liberar = `true` (e depois apagar o V1: `ApoieButtonV1`, `support-plans.tsx`).
- 🔁 09/10: o mensal virou **R$ 12,90** (Diego: *"pensei em 12,90 na verdade"*). O link de R$ 9,90 do MP NÃO serve mais —
  o botão 💳 do cartão está escondido (`MP_CRAQUE_CARTAO = null`, screens.tsx) até o Diego criar o plano de R$ 12,90 no MP e mandar o link.
- ⏳ Automático (cartão): webhook do MP → função do Supabase → `esc_admin_craque_pagamento` sozinho. Precisa do
  Access Token do MP cadastrado pelo Diego como segredo da função (nunca colar no chat). Sem isso, segue manual.
- ⏳ Pix Automático: exige CNPJ com 6+ meses (dito antes). Até lá: Pix mensal com WhatsApp + confirmação manual.

## 🚁 Galas únicas (09/10)
- ✅ NO AR: gala e "solta a mascote" 1,8× no computador (celular igual) · 🚁 Neymarzetti desce de helicóptero
  (`gala-helicoptero.tsx`, tabela `GALA_UNICA` em `entrada-gala.tsx` — clube de batismo → show + duração).
- ✅ NO AR (09/10, "pode publicar"): 🧊👑 K9 FC "O Rei Gelado" (`gala-k9.tsx`; mockup `scripts/mockup-entrada-k9.mjs`):
  sala congela (-40°), bloco de gelo despenca e racha, o Rei K9 sai esfregando os braços de frio (as mãos são
  dois recortes da arte deslizando — mexer mais exige a arte com os braços em camada separada), coroa sobre o escudo.

## 💳 PLANOS V2 (08/10) ⏳ PRÉVIA NO BRANCH, esperando o OK visual do Diego (NADA publicado)
Gratuito · ⭐ Craque completo **R$ 9,90/mês** · 🖋 Batismo Lenda **R$ 69,90** · 🖋✨ Batismo Plus **R$ 79,99**.
Ordem dele no meio do trabalho: *"Calma, não bloqueie ninguém ainda. Só faça as escritas e artes lá dos planos"* →
**nenhuma trava nova no jogo**. O que existe:
- ✅ **Banco (no ar, só ACRESCENTA)** — `supabase/migrations/20261008230000_planos_v2_direitos.sql`: tabelas
  `esc_assinaturas` · `esc_pagamentos` (ID único = pagamento repetido não conta 2×) · `esc_compras_batismo` ·
  `esc_pedidos_craque` (WhatsApp) · `esc_legado_codigo` (as 4 contas que só existiam na lista do código). Função
  `esc_direitos_de` junta legado + assinatura + batismo; o jogo lê `esc_meus_direitos()`. `esc_nuvem_regra` passou a
  usar a mesma régua (conferido nas 184 contas pagantes: **ninguém perdeu nada**). Teste: `docs/sql/testa-planos-v2.sql`
  (20/20 ok, desfeito no fim). Nenhuma linha antiga foi mexida.
- ✅ **Código (commitado no branch)**: `planos-regras.ts` (preços, limites de sala centralizados com os MESMOS números,
  regras puras) · `apoio.tsx` (assinante ativo/batismo = ouro; venceu = volta pro tier de sempre) · `store.tsx`
  (fichas pela régua). Trava: `npm run planos`.
- ⏳ **Visual (NÃO commitado, esperando OK)**: vitrine nova dos 4 planos (`support-plans.tsx/.css`), tela do mensal
  com WhatsApp/Direct (`CraqueMensal` em screens.tsx), batismo com escolha Lenda/Plus, trava do Manual a R$ 9,90/mês,
  dúvidas (FAQ) e textos de trava (liga, 2º clube) sem "vire Lenda", painel do Diego `CraqueMensalAdmin` (pedidos,
  📲 WhatsApp, confirmar pagamento com ID, cancelar, registrar batismo Lenda/Plus).
- 🧾 **Como o mensal funciona hoje**: pessoa deixa o WhatsApp (precisa estar logada) ou chama no Direct → Diego manda
  o link → pagou: Painel do Criador › ⭐ Craque completo › e-mail + ID do pagamento › CONFIRMAR. Cancelar só marca
  (vale até o fim). Venceu: perde só o que veio da assinatura; saves/ligas/histórico ficam.
- 🔒 **PROPOSTA, não aplicada** (ele mandou não bloquear): `docs/sql/sala-exige-plano.sql` — trava no servidor pra só
  dono pagante CRIAR liga/Carreira Online/Bafo (convidado nunca paga; sala rápida segue grátis). Testada em transação
  desfeita (8/8). Também ficou pra decidir: Craque antigo (prata) e sócio criarem liga (hoje só ouro cria).
- ⏳ Depende do Diego: link de pagamento recorrente de verdade (Mercado Pago assinatura R$ 9,90) · Pix Automático
  exige CNPJ com 6+ meses · gala única e canto do Plus são feitos caso a caso (arte/áudio).
## 🕵️ Sondar da Série A sem técnico nenhum + camisa da Loja (relato do Elton, 09/10) ✅ no branch, aguardando OK pra publicar
## 🕵️ Sondar da Série A sem técnico nenhum + camisa da Loja (relato do Elton, 09/10) ✅ NO AR (09/10)
- Save dele (carreira "Cruzeiro Esporte Clube²", T387, Série A): 70 clubes no mapa de técnicos, **49 com `null`**, e os 22 técnicos
  da A presos em clubes da C, D e Várzea (Guardiola no Ressaca United, Ferguson no SC Ferrari…). Causa: clube que caía levava o
  técnico junto e NADA devolvia o técnico pro mercado; clube que subia pra A ganhava `null` (e `null` era "já semeado", pra sempre).
- Conserto (`ALICIAR_SEED`, store.tsx): clube que não está na minha divisão (nem é rival/convidado do meu leilão, nem gente) solta o
  técnico; clube da minha divisão com `null` pega um livre se houver. Cura sozinha ao abrir o Sondar. Trava: `npm run tecnicos`.
- 🎽 Camisa da Loja: `CAMISAS_SALAO` era só pelo NOME do clube; ele joga como "Cruzeiro Esporte Clube²" e via a camisa genérica.
  Agora `camisaSalaoDe()` (salao-camisas.ts) cai na camisa do batismo pelo E-MAIL (`ehMeuClube` + `meuEscudoBatismo`, mimos.ts),
  igual escudo e mascote já faziam. Manto no banco dele está certo (#011B8A/#E8E8EB).
- Reverter: `git revert` dos commits.

## ⏱️ "Aparece FIM e ainda sai gol" (relato de jogador, 09/10) ✅ NO AR (09/10)
- Causa: o relógio do placar escrevia FIM aos 93' enquanto, no visual novo, a bola do gol dos acréscimos ainda estava NO AR
  (entra na rede 0,9 s depois de sair, e cada gol espera o anterior). O gol já existia no resultado; só a etiqueta chegava antes.
- Conserto (`LiveScoreCard`, pyramidseason.tsx): FIM/FT, a bolinha verde e o minuto 93 avisado pra fora (`onMinuteChange`: faixinha,
  outros jogos, fim da internacional) só saem quando a ÚLTIMA bola entrou (`fechado`); enquanto espera, o relógio fica em 90+3'.
  Vale pra carreira, online e copas (mesmo componente). Testado em página de bancada com gols aos 91' e 93'.
- Reverter: `git revert` do commit (uma linha de lógica + duas etiquetas).

## 😜🔵⚫ Batismo Arrogantchi FC (08/10) ✅ NO AR
- Dono `heitormonaco98@gmail.com` (conta de julho, era grátis → 👑 Lenda). **Série A**, no assento do **Bagres 1993**, que
  DESCEU pra **Série B** na vaga do bot **Fluminense de Caicó** (decisão do Diego). Sem OLD_NAME. Fundador nº88 · sócio nº69.
- Arte do dono (recorte chroma automático limpo): escudo 266×360/27 KB · mascote "O Arrogantchi" (o boleiro com a boneca
  Mavie e a bola, cena inteira) 299×440/41 KB · camisa da Loja. Manto medido: azul-celeste #4EC3FC (65%) + preto #141716.
- Banco feito: user_colors ouro · esc_fundadores 88 · esc_socios 69 · esc_nomes_batismo "Arrogantchi" (FC/EC pelo gatilho).
- ⏳ Falta o time do coração. Nome no post = "Heitor" (do e-mail — confirmar). Série B agora só tem 1 bot: Fatality FC.

## 📣 Faixa amarela de aviso no topo (08/10) ✅ TIRADA no mesmo dia (pedido do Diego)
- Pedido do Diego: avisar a todos que o jogo vai passar por manutenção e volta em minutos. Mora em `AVISO_TOPO`
  (`src/escalacao/index.tsx`), mesma cara da faixa de servidor-fora. **Pra tirar: `AVISO_TOPO = null` e publicar.**

## 08/10/2026 — 📡💸 Broadcast agrupado em todos os modos online ✅ NO AR
- O Product Reports (últimos 60 min) mostrou **4.064 Broadcast Events**, contra 281 Postgres Changes e 105 Presence:
  Broadcast era ~91% dos eventos identificados. O payload mediano de 125 B mostrado ali era de recados pequenos; o estado
  completo já viaja compactado, mas cada cópia entregue a cada pessoa ainda conta como mensagem e como egress.
- A janela de 400 ms que já estava aprovada e funcionando na Champions agora vale para **toda sala online da Escalação**.
  O dono manda somente o estado mais novo dentro da janela, em vez de retransmitir vários estados completos quase iguais.
- Sem atraso nas ações: lance/voto/lacre continuam indo imediatamente à caixa do dono. Entrada, F5, volta do app,
  reconexão e pedido explícito de estado continuam com resposta imediata. Só o leque repetido dono → sala foi agrupado.
- Egress: o estado já usa `netpack` (em vez de JSON bruto); esta mudança reduz também o volume transferido porque elimina
  cópias completas intermediárias. Trocar agora para protocolo de deltas seria uma alteração bem mais arriscada antes da live.
- Trava automática em `npm run canal`. Depois de publicar, comparar **Broadcast Events** e **Egress per day** por 24 h.

## 🐓👑 Batismo Le Prince FC (08/10) ✅ NO AR
- Dono `henriquejunger07@gmail.com` (CHINESINHO; conta de 25/09, era grátis → 👑 Lenda). **Várzea**, no assento do bot
  **Perna de Pau City** (`VARZEA_TEAMS`; `OLD_NAME` leva save antigo pro nome novo). Fundador nº87 · sócio nº68.
- Arte do dono (prancha chroma; a capa encostava no escudo e o dedo na manga da camisa — recorte por máscara linha a
  linha): escudo 251×360/27 KB · mascote "O Galo Rei" (galo de coroa surfando no lobo azul, cena inteira) 333×440/44 KB ·
  camisa da Loja. Manto medido: preto #0F0E0D (66%) + branco #E6E2DD (20%).
- Banco feito: user_colors ouro · esc_fundadores 87 · esc_socios 68 · esc_nomes_batismo "Le Prince" (FC/EC pelo gatilho).
- ⏳ Falta o time do coração (post e `esc_socios.time_coracao`). Nome no post = "Chinesinho" (o nome da conta).

## 👑 Cartas do K9 (08/10) ✅ NO AR
- Kelvin Oliveira (K9): G3X 2025 **lenda** (87–94) e Grêmio 2023 **bom** no teto (80–88). As duas no BR — exceção à regra de
  26/09 aberta pelo Diego só pra ele (motivo dele, não divulgar). O Grêmio dele foi o de Fut7 (2023); a bio conta isso.
- `mockup-cartas-novas.mjs` ganhou `--nomes` e mantém apelido entre parênteses (só clube de xará sai). Stories enviados.
- ⏳ G3X sem escudo no jogo (selo genérico) — se o Diego mandar a arte, cadastrar.
- 🚫 AVATAR do K9: a tentativa daqui (Canva, 200px, chapada) o Diego achou "horrível" — **ele faz no Codex. Não refazer aqui.**
  Quando chegar: 600×400 webp transparente em `public/avatars/lendas-v2/` + linha em `legend-avatars.json` (G3X 2025).

## ☁️⭐ NUVEM SÓ PRO CRAQUE nas carreiras NOVAS (07/10) ✅ NO AR (Diego aprovou o mockup: "Sim")
- Diego: *"Nuvem só pra quem paga. O grátis e quem joga sem conta continuam salvando no aparelho… Só deixe avisado pra
  essa pessoa no momento do save… Quem já tem save na nuvem continua igual. Ninguém perde nada."*
- Medido 07/10: 5.191 contas grátis = 972 MB (92% do espaço de saves); 4.175 delas paradas há +7 dias (703 MB).
  Pagantes: 161 contas, 85 MB. Quem joga SEM conta não pesa nada (save só no aparelho).
- Plano: RPC no banco diz se a conta paga (Craque/Lenda/batismo/sócio) e quais carreiras dela JÁ estão na nuvem. Grátis:
  só essas continuam subindo; carreira nova fica no aparelho. Falha da RPC = sobe como hoje (nunca prejudica pagante).
  Aviso na faixa 💾 da Central + no "Sair e salvar". Mockup: `scripts/mockup-nuvem-craque.mjs`.
- FEITO: RPC `esc_nuvem_regra` (docs/sql/nuvem-so-craque.sql, aplicada) · `nuvemRegra`/`nuvemAceita`/`useNuvemSoAparelho` +
  `savePyramidCloud` devolvendo 'nuvem'|'aparelho' (store.tsx) · faixa com botão roxo ⭐ Craque → `?apoie=nuvem` (todos os
  planos, Craque aceso). Trava: `npm run nuvem-craque`.
- ⏳ Opcional que ficou pra depois (mexe em quem já joga, só se o Diego pedir): apagar da nuvem save de conta grátis parado há
  muito tempo (ex.: 30 dias), avisando antes.

## 🔥 CALDEIRÃO (07/10) — mockups enviados, ⏳ aguardando OK do Diego (nada no jogo ainda)
- Ideia tirada do Brasileirinho FC: o empurrão de jogar EM CASA passa a depender da lotação do próximo jogo
  (o quadro "🎟️ Lotação do próximo jogo" que já existe na aba Clube: humor da torcida, chuva/cobertura, estação).
- Decisão do Diego: versão FRACA, "tipo 2,3 pts". Medido no motor (G.v3, 6 mil temporadas): empurrão de casa ×2,1 ≈
  +2 pts/temporada com estádio lotado (≥80%); sem empurrão ≈ −2 com estádio vazio (<30%); meio-termo = igual a hoje.
- Só o time do usuário, só em casa, só carreira solo, só rodada ainda não jogada. Bots iguais. Dinheiro NÃO muda
  (a bilheteria já segue a lotação). Quadro novo na aba Clube ABAIXO do estádio. Stories: `scripts/mockup-caldeirao.mjs`.
## 07/10/2026 — 🎭 Bots com personalidade no leilão da carreira ✅ NO AR

Diego: *"pode fazer tudo isso que você disse dos bots, mais imprevisíveis e reais"*, depois da conversa em que
ele perguntou se o piso mudaria. `src/escalacao/perfis-bot.ts` + `cpuEnvelope(…, perfil, obsessao)` no store.
- 5 perfis: 💸 gastador (estica ×1,5 por craque/lenda) · 🐷 pão-duro (nunca passa do justo, guarda pra repescagem)
  · 🎯 obcecado (um setor por temporada, ×2,2 de orçamento e ×1,7 de teto nele) · 🃏 imprevisível (18% de chance de
  endoidecer numa carta média) · ⚖️ equilibrado (o leilão de antes, mesmo sorteio).
- 🎲 sorteado POR CARREIRA (nome do clube + semente): fixo dentro dela, muda na próxima. Vale pra batismo também —
  medido: os 5 rivais do leilão de uma carreira real eram TODOS batismo; com "batismo sem perfil" nada mudava.
- 🚫📈 o exagero (gastador/obcecado/imprevisível acima do justo) NÃO entra no piso: livro e `paid` da carta ficam
  em `justoDaCarta`; quem VENDEU recebe o valor cheio. Só carreira; partida rápida e salas intocadas.
- Trava: `npm run perfis`. 🔌 desligar = `PERFIS_BOT_ON = false`.
- ⏳ Falta (com mockup antes): mostrar o perfil pra quem joga (Central/jornal: "nesta carreira o Bagres é pão-duro").
  O texto curto de cada perfil já está em `PERFIL_INFO` (PT/EN).

## 07/10/2026 — 📊 Simulação da carreira (2 temporadas reais + 100 do motor) — achados guardados
- Leilão às cegas: espalhar ~10 por carta perde tudo pros bots (1 jogador em 11, lanterna da Várzea).
- Salário só cobra da T4 · estádio completo 1.440 (renda 20 → 55-138/temp) · SAF 2.000 (≥40 temporadas pra se
  pagar) · 2º clube 4.000 · nada tem manutenção. Liberta T40, Copa do Mundo T100.
- Trava `npm run copamundo` reprova por estar DESATUALIZADA (procura o `copaJogos` antigo; a regra mudou em 03/10).
- Propostas levadas ao Diego e ainda NÃO decididas: SAF = clube parceiro (base que revela promessa, empréstimo que
  valoriza, preferência no leilão, se paga em ~10 temp) · 2º clube = investimento (valoriza com títulos, transferência
  interna, Clássico do Presidente).

## 🦅🔴⚫ Batismo Mengão Malvadão (06/10) ✅ NO AR
- Dono `atilasoaresjr21@gmail.com` (conta de 01/10, era ⭐ Craque — subiu pra 👑 Lenda). **Série A**, no assento do
  **Nata de SP**, que DESCEU pra **Série B** na vaga do bot **Nacional da Serra** (decisão do Diego). Sem OLD_NAME nos
  dois: ninguém foi renomeado, só mudou de divisão. Fundador nº86 · sócio nº67 · coração Flamengo (deduzido do clube).
- Arte do dono (prancha chroma, recorte automático limpo): escudo 266×360/29 KB · mascote "O Urubu Malvadão" (o urubu
  de coroa pisando no porco — cena inteira) 330×440/41 KB · camisa da Loja. Manto medido: vermelho #CE1313 (35%) +
  preto #171514 (59%).
- Banco feito: user_colors ouro · esc_fundadores 86 · esc_socios 67 · esc_nomes_batismo "Mengão Malvadão" (FC/EC pelo
  gatilho). Post: `scripts/posts/mengao-post.png` (nome do dono no post = "Atila", tirado do e-mail — confirmar).

## 👑🧊 Batismo K9 FC (06/10) ✅ NO AR — 1º batismo da VÁRZEA
- Dono `kelvinoliveiraandradeenunes@gmail.com` (conta já existia, criada 28/09). **Várzea**, no assento do bot
  **Meia-Boca FC** (`VARZEA_TEAMS` = os bots da liga de quem começa carreira na escada; `OLD_NAME` leva save antigo pro
  nome novo). Fundador nº85 · sócio nº66 · Lenda.
- Arte do dono (prancha com escudo, o próprio jogador, camisa e troféus no fundo verde — recortada por máscara à mão):
  escudo 226×360/27 KB · mascote "O Rei K9" (o jogador de coroa ENTRE AS DUAS TAÇAS, no gelo — a 1ª versão só com ele o Diego achou "horrível") 328×440/42 KB · camisa da Loja. Manto medido: branco
  #E5E8F3 (81%) + azul #0723B4 (listras/gola).
- Banco feito: user_colors ouro · esc_fundadores 85 · esc_socios 66 (escudo_time K9 FC, mascote k9_rei) ·
  esc_nomes_batismo "K9" (o gatilho criou K9 FC/EC).
- `checa-batismos.mjs` agora reconhece vaga na Várzea; `mockup-batismo.mjs` escreve "na Várzea" com `--serie V`.
- ⏳ Falta saber o time do coração dele (pro post e `esc_socios.time_coracao`). Post: `scripts/posts/k9-post.png`.

## 06/10/2026 — 🌎 Convocação da Libertadores/Champions "travando" no botão Confirmar os 11 ✅ NO AR
Print do Diego (Seven City, T251, Palmeiras): o botão "Confirmar os 11 e começar a Libertadores" não fazia nada.
- Simulei o motor com os 72 clubes × 2 formações × várias temporadas/sementes (3.648 campanhas) e com o 11 EXATO do
  print: nenhuma falha. Quem recusava era a conferência do reducer (`START_INTERNATIONAL_CAMPAIGN`), que devolvia o
  estado igual SEM avisar — botão mudo.
- Causa achada: o clube aceito ficava gravado no aparelho só pela TEMPORADA (`esc-intl-clube-v1`). Outra carreira
  na mesma temporada (ou a mesma temporada rejogada com outra colocação) abria direto na convocação de um clube que
  não era convite DESTA carreira → reducer recusava pelo bloco, pra sempre.
- Conserto: a escolha agora leva a semente da carreira (`-v2`) e só vale se estiver entre os convites de agora; a regra
  do reducer virou `motivoRecusaInternacional` (store.tsx) e a TELA lê a mesma função antes de mandar — se recusar, diz o
  porquê e devolve os convites (motivo `liberacao` = conta sendo conferida: espera e aperta de novo, a convocação fica).
- ⏳ Se aparecer de novo com "código: X" no aviso, o código diz qual regra recusou — pedir o print.

## 06/10/2026 — 📱 Linha do WhatsApp embaixo das salas: agora "grupo VIP junto com o dono do jogo" ✅ NO AR
Pedido do Diego. Só o texto mudou (PT/EN, as duas versões: quem já tem vaga e quem ainda não tem). "VIP" em negrito;
o brilho verde da palavra WhatsApp e o link continuam iguais.

## 06/10/2026 — 💸 CONTA DO SUPABASE (2ª rodada): 3 cortes de tráfego que o Diego aprovou ("Ok pode fazer") ✅ NO AR
Medido nos logs de 24h (~1,4 mi de chamadas/dia). Os 3 cortes não mudam nada no jogo:
- **Faixa "voltar pra sala" da home** (`lobby.tsx`): baixava o `game_state` INTEIRO (40–500 KB por sala, até 21 salas)
  toda vez que a home abria. Agora a conferência puxa só os campos (`__game`, `screen`, 1º técnico, `mode`,
  `careerOnline`) e o save completo só desce quando a pessoa aperta VOLTAR (`resume()`, que se o banco não devolver
  o save não restaura nada). Estimativa: 80–100 GB/mês a menos.
- **Memória do Leilão de Clubes** (`store.tsx`): saiu o `setInterval` de 2 min pra TODO jogador. Agora puxa no boot
  e 3s depois de cada sala de clubes montada (pra próxima), com trava de 1 min. ~10 GB/mês.
- **Teste de "servidor no ar"** (`index.tsx`, `MaintenanceBanner`): de 20s pra 60s e não roda com a aba escondida.
  Continua com 2 falhas seguidas pra mostrar a faixa e re-tentando as gravações pendentes. ~3 GB/mês.
- ⏳ Ainda grandes e NÃO mexidos (precisam de conversa antes): PATCH de game_rooms do dono (save a cada ~3s com
  sala jogando) e GET de game_rooms/room_players do lobby.

## 05/10/2026 — 🧱 Leilão de Clubes: mais variedade (Colo-Colo em todo leilão, Flamengo nunca no ataque) ✅ NO AR (código) · ⏳ banco

Diego: *"toda hora aparece goleiro do Colo-Colo… lateral só Flamengo… não aparece ataque do Flamengo… serve
pra todos os clubes"*. Ele RECUSOU baixar o mínimo do pacote (*"tem que aparecer clubes com no mínimo 2"*).
Causa medida (`buildDeckClubes`): fila fixa de setores + 1 clube por partida → a defesa levava os grandes, o
ataque ficava com a sobra e o goleiro com quem SÓ tem goleiro; a memória contava "saiu em outro setor" (o que
punia de novo os grandes); e a memória morava no celular de quem cria a sala (dono novo = do zero).
- Clube em até **2 setores** por partida · ordem dos setores **sorteada** · memória conta **só o mesmo setor**
  (chave nova `clube·setor`, lê a velha também) · mínimo de 2 (folgado) **intacto**.
- Simulado (30 salas, 3 baralhos): sala de 10, o que mais repetia caiu de 30/30 (Laterais do Monaco) pra ~12;
  sala de 6, de 11 pra 6. Flamengo sai em todos os setores. Nenhuma sala sem pacote.
- 🌐 **Memória compartilhada entre salas**: o código já chama `esc_clubes_recentes`/`esc_clubes_grava`, mas o
  SQL (`docs/sql/clubes-recentes.sql`) **ainda não foi aplicado no banco** (aprovação não veio). Sem ele, cada
  aparelho usa a própria memória, como antes — nada quebra. Aplicar = liga sozinho.

## 04/10/2026 — 📚 COLEÇÕES DE CLUBES + 🤝 TROCAS: regras que o Diego fechou (mockup v2 enviado, aguardando OK)
- *"Ok vamos fazer"*. Só COLEÇÃO DE CLUBES (nada de feitos/títulos misturados). 74 clubes com 11+ cartas; fechar = 11
  cartas do mesmo clube, qualquer época. Prêmio = metade da soma do valor de TODAS as cartas do clube no baralho
  (Lenda 5 · Craque 3 · Promessa 2 · Bom 1 · Foi profissional 0,5) — tabela em `docs/colecoes-clubes.md`.
- O jogador APERTA pra receber e escolhe a carreira; as moedas caem no caixa dela. As 11 cartas usadas ficam marcadas
  "usadas na carreira X": **continuam no álbum da home** (escurecidas com o nome da carreira) mas não contam mais pra
  fechar aquele clube. Fechar de novo (pra outra carreira) = mais 11 cartas → **o sorteio passa a poder dar REPETIDA**.
- Coleção NASCE sozinha quando um clube chega a 11 cartas no baralho (selo 🆕), e o prêmio acompanha o baralho.
- Trocas: aba no álbum (Recebidas · Enviadas · Nova); busca técnico pelo nome do time + quem já jogou com você primeiro,
  com selo de quem tem carta que falta numa coleção sua; até 3 cartas de cada lado; só carta LIVRE (não usada); recado
  de até 120 letras; vale 48 h; Aceitar · Contra (contraproposta) · Recusar; nada sai do álbum até aceitar.
- ✅ Regras FINAIS (04/10): fechar = **TODAS as cartas do clube** (clube com 11+); prêmio = **soma cheia arredondada
  pra cima** (Real Madrid 162 · Flamengo 141 · tudo 3.263); troca vale **carta única E repetida**; baralho **Mundo
  entra no sorteio**. Tabela: `docs/colecoes-clubes.md`. Trava: `npm run colecoes`.
- 🚧 EM CONSTRUÇÃO no branch, só a conta do Diego (`COLECOES_GERAL = false`, sport.ts): `colecoes.ts` (regra pura),
  `album-colecoes.tsx` (abas Coleções e Trocas, já ligadas no álbum), `creditaColecao` / `aplicaSaidasDeTroca` no
  store, sorteio com Mundo + repetida atrás da trava, legenda no álbum (x2 · ⚫ usada · 🔒 em troca — nada some),
  bancada `esc-colecoes-demo=1` (álbum de mentira, só no vite). Cópia tem 3 estados: 🟢 livre · 🔒 em troca · ⚫ usada;
  na troca/coleção o jogo escolhe a cópia livre sozinho.
- 🔁 MUDOU (04/10, Diego: *"ele já vai tá na carreira dele"*): **no Álbum você VÊ e TROCA; na carreira você RECEBE.** O
  "Receber" saiu do álbum e foi pra dentro da carreira, na Agência (Sua Agência 2.0, e no Escritório clássico dos
  saves antigos) — `ColecoesDaCarreira`, sem perguntar carreira: o reducer `COLECAO_RECEBIDA` põe as moedas NESTA
  carreira (uma vez por marca). Ordem: prontas primeiro, depois a mais completa em %; já recebidas (e não prontas de
  novo) num bloco "✔️ Já recebidas" no fim. Repetida aparece como aviso: "🔁 você tem N repetidas · troque no Álbum".
- 🎲 SORTEIO DA CARTA DO TÍTULO (04/10, *"antes não era raro aparecer lenda, agora tem que ser um pouco mais"*): com a
  trava ligada, `sorteiaCarta` (colecoes.ts) sorteia primeiro a CATEGORIA — 👑 Lenda 4% · ⭐ Craque 16% · 💎 Promessa 4% ·
  🎯 Bom 58% · 🪵 Foi profissional 18% — e depois a carta dentro dela; pode repetir. Antes era carta por carta, lenda ~9%.
  Quem já tem as cartas fica com elas (*"não vou prejudicar eles"*): só vale pros pacotes novos. Na carreira continua a
  regra da Agência (não repete carta do mesmo save).
- 🎒 DIVERSOS (04/10, *"cartas que não têm clube o usuário deve ganhar também… quando o time completar 11, o jogador
  vai pro clube"*): carta de clube com menos de 11 no baralho aparece no bloco "🎒 Diversos" da lista de coleções
  (álbum e Agência). A lista vem do baralho, então no dia em que o clube chegar a 11 ele vira coleção e as cartas
  mudam de lugar sozinhas. O sorteio já dava essas cartas (usa o baralho inteiro).
- 🃏 LOTE 42 ✅ NO AR (04/10): Fiorentina (+6, Europa), New York Cosmos (+6), Inter Miami (+7), Kashima (+7) e Al-Nassr
  (+7, Mundo) chegaram a 11+ cartas e viraram coleção (80 clubes, 3.395 moedas). Vozinha saiu de "Cabo Verde" pro
  Colo-Colo 2026 (*"acho que ele está atualmente"* — palavra do Diego), segue lenda. ⏭️ Dínamo de Moscou, West Ham e
  Stoke City ficaram com as listas propostas esperando ele (vai decidir junto com a troca de clube das lendas
  Valderrama, Simonsen, Banks, Moore e Yashin). Deportivo Cali: só ~4 nomes certos, pedi ajuda a ele.
- 🦊 LEICESTER ✅ (04/10, *"coloque o Banks no Leicester mesmo e add mais algum grande famoso… que ganhou o título
  inglês"*): Gordon Banks saiu do Stoke 1972 pro **Leicester 1966** (era goleiro de lá quando ganhou a Copa; segue lenda)
  e entrou o **Wes Morgan** (capitão do título de 2016, bom jogador). O Mahrez está como "Leicester City" e os outros
  como "Leicester": a coleção conta os dois como o MESMO clube (`CLUBE_MESMO` em colecoes.ts + a mesma conta na
  função do banco), sem mexer na carta dele. Leicester virou coleção (11 cartas, 19 🪙). Stoke City ficou com 0 cartas.
  Save antigo com o Banks do Stoke mantém a carta velha (identidade da carta não muda em save).
- 🛡️ TROCA DE CARREIRA NUNCA MAIS PERDE CARREIRA ✅ (06/10). Caso: **Elton (eltonfrossard45@gmail.com)** trocou de
  carreira com o celular cheio (7 carreiras gigantes, ~4 MB) e a **La Bestia Negra, temporada 378 (seed 492430748)**
  sumiu do aparelho E da nuvem. Causa: `activateCareerSlot` guardava a atual no arquivo sem tirar a escolhida (dobra),
  o erro de espaço era engolido, e a subida pra nuvem com carimbo igual NÃO juntava com a nuvem → gravou sem ela.
  Conserto: troca vira TROCA DE LUGAR (sem dobra; falhou = não troca e avisa); começar carreira nova sem espaço não
  apaga a atual; a nuvem guarda a lista de seeds (`esc-nuvem-seeds:`) e, se o aparelho perdeu alguma, a subida junta
  com a nuvem antes de gravar — só o 🗑️ tira carreira da nuvem. Trava: `npm run troca`.
  🎁 Compensação decidida pelo Diego (não quis o backup do Supabase): na carreira **Cruzeiro Esporte Clube² (seed
  16378525)** do Elton entrou o elenco da La Bestia (foto da T261, 18 trocas com os bots + Garrincha/Di Stéfano/Romário
  criados), caixa 42.000, +2 Libertadores (376/377), +1 Copa do Mundo (310), Série A 118, Copa 56, Supercopa 108.
  Feito direto na nuvem (função `esc_fix_elton_16378525` + `esc_lacre_ll`, que refaz o lacre). As duas funções ficaram
  no banco (o celular cancela `drop`); são inofensivas, dá pra apagar pelo computador.
- ⚽ CARTA NOVA (05/10, pedido do Diego): **Gilberto, Bahia 2020**, atacante, bom jogador (baralho Brasil, `L43_BR_ATA`). Novidades geradas.
- 🎖️ SALA DE ESPERA: o áudio do 🐊 jacaré virou o **"Dictador"** (05/10, áudio que ele mandou, 23 s, `public/sfx/ditador.mp3`).
  A chave continua `jacare` (versão velha aberta recebe a mesma chave); o `jacare.mp3` também foi trocado pelo áudio novo.
- 🎶 CANTO DA TORCIDA DO GEOVANY ✅ (05/10, Diego mandou o áudio): na carreira do `souzact12@gmail.com` o AMBIENTE
  vira `public/sfx/torcida-geovany-v1.mp3` (10 s em loop, mono 32 kHz 56 kbps, mesmo volume médio do original, 72 KB).
  O gol continua o de todos. Mora em `AMBIENTE_CARREIRA_POR_EMAIL` (`sound.ts`) — nova conta = uma linha + o arquivo.
  🐛 Mesmo dia, ele disse que não tocava: quem abre direto na carreira com o 🔊 ligado acendia a torcida ANTES do
  login ser lido (entrava a padrão e ficava). Agora a torcida troca sozinha quando a conta chega (`conferePraConta`).
- 💾 FICHAS DE CARREIRA ✅ (05/10): grátis 1 · Craque 2 · Lenda 4 · Batismo 4 (era 2·4·6·8). Saves existentes intocados
  (grandfather). Textos dos planos (Apoie, vitrine, aviso de fichas cheias) atualizados em PT/EN.
- 🧱 MEMÓRIA COMPARTILHADA DO LEILÃO DE CLUBES ✅ NO BANCO (05/10): `docs/sql/clubes-recentes.sql` aplicado em 2 pedaços
  (tabela `esc_clubes_saidos` + `esc_clubes_recentes` + `esc_clubes_grava`); `select esc_clubes_recentes()` → `[]`.
  ⚠️ Diferença do arquivo: o `esc_clubes_grava` subiu SEM a linha `delete … max(id) - 50` (a limpeza das partidas antigas)
  e sem o `revoke … from public` — o app do celular cancela comando com delete/revoke. Não muda nada pro jogo (a leitura
  pega só as últimas 8); a tabela só cresce ~1 linha por partida de Clubes. Pôr a limpeza quando der pelo computador.
  ⏭️ PENDENTE (pedido do Diego, interrompido): no Modo Stream, só o pregão ENVELOPE esconde os lances; na TOCAIA não esconde.
- 🔴 SALA AO VIVO NA LISTA (05/10, Diego: *"nessa área da sala, pra quem é streamer, com link… tem que ser streamer que
  tá rolando ao vivo mesmo, e com link do ao vivo"*; mockup `scratchpad/mockup-live.png` aprovado — *"faz"*): na criação,
  com o Modo Stream ligado, aparece o campo do link (só https de YouTube/TikTok/Twitch/Kick/Instagram/Facebook —
  `plataformaDaLive`). Vai em `game_state.liveUrl` (guardado em `salaFixaRef`, senão o 1º save apagava) → coluna magra
  `ls_live` pelo gatilho (`docs/sql/lista-salas-live.sql`, ✅ aplicada). Na lista: sala com link sobe pro topo, faixa
  vermelha "AO VIVO AGORA NO X" e botão "▶ Assistir a live". Acabou/sumiu a sala, some junto (é da sala). Novidade PT/EN.
  ✅ NO AR em 05/10 (*"Sim"*).
  🔁 Ordem ajustada no mesmo dia: sala ABERTA sempre em cima; entre as que estão jogando, a do streamer primeiro. Não testei com sala real (precisa de login) — conferir na 1ª live de verdade.
- 📖 HOME: cartão "Meu Álbum" ao lado do Salão dos Batismos ✅ NO AR (04/10, pedido dele). O botão ÁLBUM do rodapé
  continua (ele não respondeu se tira). ⛔ A reorganização da Agência em duas abas (Agenciados / Coleções, mockup
  `scratchpad/mockup-agencia.png`) ele NÃO aprovou agora (*"só o 1 mesmo"*) — não fazer sem ele pedir.
- 🌎 CARTA PRO CAMPEÃO DA LIBERTADORES / CHAMPIONS / MUNDIAL ✅ (04/10, *"já quero que ligue as cartas nas copas"*):
  a carreira internacional (01/10) nunca tinha ligado o pacote. Agora cada título dá uma carta (seasonKey `:liberta`,
  `:champions`, `:mundial`), lida do histórico gravado no FIM da campanha. Trava no `npm run colecoes`. Conferido: as
  outras competições (liga, Copa Legends/Brasil, Supercopa, Copa do Mundo, partida rápida/online liga+copa, Só Champions)
  já davam carta.
- 🚀 COLEÇÕES + TROCAS ✅ NO AR PRA TODOS (04/10, *"pode fazer tudo e publicar pra todos"*): banco aplicado (3 tabelas,
  7 funções, troca até 10 de cada lado), `COLECOES_GERAL = true`, novidade na home, vídeo `scripts/video-colecoes-reels.mjs`.
  ⚠️ Lição do banco: desde 04/10 o conector do Supabase pede confirmação pra comando com `drop`/`revoke` e o app do celular
  CANCELA sozinho. Mandando em pedaços SEM `drop policy`/`revoke` passou direto. (Ficou de fora só o `revoke` do
  `esc_carta_presa` pra anon — inofensivo: só diz se uma carta está numa troca.)
  ⏭️ Falta: teste de verdade com duas contas (receber + uma troca) e o aviso na home de proposta recebida.
- 🔲 GRADE DAS COLEÇÕES (04/10, *"tá muito gigante a lista vertical"* → aprovou a grade e pediu *"com escudos oficiais que
  já temos"*): 4 clubes por linha, escudo oficial (`SeloClube`, 81 de 82 — o Cosmos cai no selo), rodinha verde do
  progresso, 🔁 repetidas, filtros Todas/Prontas/Começadas/Brasil/Europa/Mundo. Tocar abre o clube embaixo da linha
  dele (faltam quais, cartas, botão Receber na Agência). Vale no Álbum e na Agência. Ainda travado (só a conta dele).
- 🌟 LENDAS AVULSAS (04/10, *"coloque alguma categoria pra eles… 5 moedas pra cada, mas tem que completar todos juntos"*;
  as lendas NÃO trocam de clube): coleção especial com as lendas de clube que ainda não é coleção — hoje Yashin,
  Bobby Moore, Allan Simonsen e Valderrama = 20 🪙 (o Banks saiu pro Leicester), só com as 4 juntas. Monta-se sozinha (lenda sai quando
  o clube dela chegar a 11). Nome FECHADO pelo Diego: **"Lendas Avulsas"** (*"o nome será do restante também"* → o bloco "Diversos" virou **"🎒 Cartas Avulsas"**). Banco:
  `esc_colecao_receber(..., p_especial)` aceita clubes diferentes, só lenda (migração ainda não aplicada).
- ⛔ FALTA pra ligar de verdade: **aplicar a migração `20261004150000_colecoes_clubes_trocas.sql` no banco** (pediu
  aprovação do Diego e não foi aplicada); testar com conta de verdade (receber + trocar entre duas contas); badge de
  proposta recebida na home; e o OK visual dele nas fotos das telas reais.

## 04/10/2026 — 🃏 CARTAS DO ÁLBUM: o Diego quer dar sentido a elas, NENHUMA ideia aprovada ainda
- Pedido dele: *"as cartas… o pessoal tá ganhando e tá cagando pra elas"*, *"quero algo maior, mais profundo, que dê
  água na boca pra ter as cartas"*. Hoje: cada título (liga/copa, off e on) dá direito a ESCOLHER uma carta, sem
  repetida; ela vai pro álbum (`user_cards`, ~91 mil cartas, ~5 mil donos, tem gente com 900+) e funciona como
  carta da Agência (empresário) na carreira. O Bafo nunca tomou carta de ninguém.
- ❌ JÁ DESCARTADAS por ele (não repropor do mesmo jeito): coleções com prêmio + troca entre amigos (fez mockup,
  sem aprovação) · time do álbum / desafio de álbum · carta favorita na entrada · carta do dia · carta que sobe de
  nível · raridade ("só 12 têm") · ranking de colecionador · **direito de cobrir no leilão** (*"não gostei"*) · nome
  do dono na carta · 1º dono · carta destrava celebração · torneio dos colecionadores · pacote com repetida · prêmio
  de verdade · carta com validade de lote · Clube Eterno (*"gostei… mas quero outra melhor"*) · Carta Viva (história
  por carta) · Edições Especiais estilo FUT com pacote (*"ainda não tô gostando"*).
- ⚠️ Lição: 6 rodadas de ideias seguidas e ele travou (*"não gostei de nada, tá foda"*). Próxima vez: perguntar o que
  ELE imagina, ou esperar ele trazer — não despejar lista. O dado que pesa: gente com 900+ cartas, então "ter" já
  não é difícil pra quem joga muito.

## 04/10/2026 — 🏆 MINHAS LIGAS: a estante apagava a 1ª temporada de cada largada (liga KD1TUL, 11 troféus → 7)
- Relato do Loopesmiranda FC (via Diego): acabou a liga, voltou pra sala de espera pra entrar um amigo e os troféus
  caíram de 11 pra 7 ou 8. Causa, confirmada no banco: toda largada da sala de espera (`START_ONLINE`) nascia com a
  MESMA semente (`hashCode(código da sala)` — KD1TUL → 2211528947) e a estante (`game_champions`) guardava a linha
  por `(room_id, match_seed)` desde 16/08. A 1ª temporada de cada largada fazia UPSERT por cima da 1ª da largada
  anterior: na liga dele as temporadas 1, 4 e 10 viraram uma linha só (a 11). Mesmo estrago em QSJA12 (1, 2, 3 →
  "4") e em 5U7M8N / CP3VN1.
- 🧱 O MESMO bug explica *"no leilão de clubes nunca aparecia ataque bom"*: mesma semente = mesmo sorteio de clubes
  (`buildDeckClubes(…, rng)` com `rng = mulberry(s.seed)`) em toda temporada daquela liga. Não era coincidência.
- ✅ Feito: (1) em Minhas Ligas a estante grava por TEMPORADA (`matchSeed: undefined` quando `ligaMode`; o número
  nunca repete numa liga); sala rápida segue por semente; (2) a semente da largada da liga leva o número da temporada
  (`hashCode(code + '#t' + seasonNo)`), continua igual em todo aparelho. Trava: `npm run estante`.
- ✅ Recuperadas no banco, a partir de `esc_results` (que guarda por temporada quem foi campeão/artilheiro): 10
  temporadas em 4 ligas — KD1TUL 1·4·10 · QSJA12 1·2·3 · 5U7M8N 6·20·26 · CP3VN1 6. Sem `human_results` (posição
  de cada um não existe lá); nome com emoji casado com o que a estante já usava. Temporadas que faltam SEM campeão
  humano (bot campeão) ficaram de fora: 5U7M8N 1·5·13·14·17·19·23, 9GBYBQ 2, BWVWGK 1 — a coluna `champion_name` é
  obrigatória e não dá pra inventar o nome do bot.

## 04/10/2026 — ☁️💸 CONTA DO SUPABASE: o save da carreira na nuvem só sobe no "Sair e salvar"
- O Diego mandou a fatura: ~US$ 125/mês, com **Total egress** (US$ 31) e **Realtime Message Count** (US$ 65) estourados.
- 📏 Medido no banco: save de carreira ativo tem em média **~950 KB** (p90 1,7 MB), e a tabela recebia ~20 mil
  downloads do save inteiro por dia (≈ 20 GB/dia ≈ 590 GB/mês — bate com a fatura). Dois culpados: o autosave subia pra
  nuvem a cada minuto e, pra juntar antes de subir, BAIXAVA o save inteiro; e a home (abrir, voltar o foco, Continuar)
  baixava tudo e subia de novo.
- ✅ Feito: regra do Diego (*"o save do usuário na carreira só deve salvar após ele apertar em salvar"*). A NUVEM só recebe
  no botão "Sair e salvar carreira" (e em trocar de carreira / troca do Bafo). O save do APARELHO continua instantâneo.
  E o aparelho guarda o carimbo (`updated_at`) da nuvem que já juntou: antes de baixar, pergunta só o carimbo; save
  inteiro só desce quando outro aparelho salvou depois. Trava: `npm run nuvem`.
- ⚠️ Consequência aceita: quem fecha o jogo sem apertar "Sair e salvar" continua com a carreira no aparelho, mas não
  na nuvem (trocar de celular leva o que foi salvo pelo botão).
- 📡 Mensagens ao vivo (US$ 65, ~36 milhões no mês contra 5 milhões da cota): o "tô vivo" do dono saía a cada 4s pra
  cada pessoa da sala, mesmo parado (15 recados/min por convidado). Ele servia pra segurar o convidado de pedir o estado
  depois de 10s calado, acertar o relógio e acender a faixa vermelha — tudo já tem outro caminho. Diego: *"não ligo
  praquela faixa vermelha mesmo… ok pode fazer"*.
  ✅ Feito no branch (04/10): (1) sem "tô vivo"; (2) heartbeat de estado do dono só depois de 20s quieto, conferindo a
  cada 10s (era 12s/6s); (3) convidado pede estado só depois de 60s calado, ou em 8s se o PRÓPRIO lance ficou sem
  resposta (`acaoPendenteRef`), e consulta a coroa no banco só depois de 45s (era 6s); (4) `hostInbox = true` pra toda
  sala — o lance do convidado vai só pro dono (era só Champions). Coroa, SAIR, dono que volta: nada mudou. Trava:
  `npm run canal`. ⚠️ **Não deu pra testar com 2 aparelhos daqui** (o Supabase não responde de dentro da bancada): a
  primeira sala de verdade depois do deploy é o teste — acompanhar `esc_travas` e o log do Realtime.
  ⏭️ Conferir a fatura uns dias depois do deploy (egress e mensagens).

## 03/10/2026 — 📺 CENTRAL LEGENDS, a home do modo carreira ✅ NO AR PRA TODOS (liberada em 03/10: *"pode publicar pra todos já!!"*)
- Pedido: *"queria alguma central no modo carreira… giro da rodada, notícias, transferências… precisa ter alguma
  central"*. Mockup v4 aprovado (cel + desk) depois de 3 rodadas (a 1ª *"muito feia"* → artes cinematográficas; a 3ª
  com notícia demais/giro de menos; a 4ª com o Martelo preenchendo o desktop).
- O que é: aba nova, a PRIMEIRA da barra, e a carreira ABRE nela. Camarote (`online-estadio-v25`) com o próximo jogo e
  o MESMO botão de jogar (`avancarRodada`, uma função só pro controle e pro camarote) · 📣 Giro da rodada revelada ·
  📰 O MARTELO do meio da temporada (`central-noticias.ts`, redação pura, PT/EN, trava `npm run central`) · 💸 Mercado
  (compras do extrato + carta mais cara da divisão) · 📊 Tabela (toque abre Tabelas) · 🗓️ Agenda (Copa, Libertadores,
  Copa do Mundo; toque abre Jogos). Desktop em 2 colunas, divisão reta no meio (ajuste dele 03/10): esquerda camarote →
  giro → tabela+agenda; direita Martelo → mercado (`central.css`, ordem do celular por `order`).
- Como foi feito sem simular nada novo: `confrontoDaRodada()` reproduz o calendário do `simDivTo` (mesma semente) pra
  achar o adversário; a forma (bolinhas) vem de até 4 `simulaAte(r)` extras, só com a aba aberta e nunca além de
  `revealed`. O lado (placar/controle) fica ESCONDIDO na aba Central, mas continua montado (ver 7º ajuste).
- 🏆 6º ajuste (04/10, *"todas copas após a liga devem ir mexendo também na central"*): depois da liga o camarote, o
  giro e a manchete seguem a fase da vez — Copa do Brasil/Legends, Supercopa, Libertadores/Champions/Mundial (técnico
  convidado, nome do clube grande) e Copa do Mundo, com a arte de cada uma. Botão na mesma ordem dos controles.
- ⏱️ 7º ajuste (04/10, bug dele: *"quando volto na aba de jogos tá reiniciando a partida"*): a Central TIRAVA o placar da
  tela, e o relógio do jogo morre junto (ele mora dentro do `LiveScoreCard`). Agora só esconde (`display: none`): o
  jogo segue rolando por trás, sem pausa e sem botão novo. Medido na bancada: troca no 6', volta no 22'.
- 🟢 `CENTRAL_GERAL = true` em `sport.ts` desde 03/10 (`false` volta a ser só `diego.c.fonseca@gmail.com`; bancada do vite liga com
  `localStorage esc-central-dev=1`, chave que some do build). Só carreira SOLO.
- 💸 2º ajuste (03/10): o MERCADO mostra TODOS os negócios do pregão da temporada, de todo clube (*"não só os
  meus"*): o reducer anota cada arremate em `careerMercado` (`anotaMercado`, só carreira solo, 80 lotes, só exibição;
  virou o ano, lista nova). A Central mostra os 5 maiores e "ver os N negócios" abre o resto. Carreira que já estava
  no meio da temporada só enche no próximo pregão (até lá cai nas compras do extrato). O Martelo ganhou "💰 Maior
  lance da temporada". Borda do giro saiu do dourado (misturava com o camarote) e virou creme.
- 🖥️ 5º ajuste (04/10, *"agora sim, muito melhor e mais organizado e perfeito"*): a AGENDA desceu pra baixo do giro
  (sem agenda em cima) e as duas colunas ESTICAM juntas — o fim do Mercado cai na mesma linha do fim da tabela
  (`align-items: stretch` + mercado `flex: 1`, botão "ver os N negócios" no pé). Pra fechar a altura: 8 negócios e
  até 9 notícias no monitor (celular segue 5 e 5). ⚠️ `flex: 0 0 100%` das caixas do celular vira 100% de ALTURA
  numa coluna flex — por isso o Mercado sumiu na 1ª foto; no desktop as caixas da direita voltam a `flex: 0 0 auto`.
- 🖥️ 4º ajuste (03/10, print dele): no desktop a TABELA vai INTEIRA (20 linhas) à esquerda embaixo, com o GIRO DA
  RODADA INTEIRO ao lado, no padrão creme das caixas; a AGENDA (pequena) subiu pro lugar do giro, em linha, abaixo
  do camarote. Celular não mudou (giro com 3 jogos, tabela com 5). Grade por `grid-template-areas` em `central.css`;
  as linhas extras só existem no monitor (`ll-central-not-desk`). Lição: `display` inline na linha vence a classe
  que esconde — virou classe (`ll-central-giro-row`).
- 📰 3º ajuste (03/10, *"faz Z4 e títulos, jogador lesionado, cria da base jogando, qualquer copa nova chegando"*):
  entraram 🏆 título à vista/matemático (só pontos possíveis, 3 por rodada que falta), 🚨 Z4 na cola / no Z4 /
  🪂 rebaixado (a Várzea não rebaixa: `temRebaixamento`), 🩹 titular fora (lesão/suspensão/noitada, em quantos jogos
  volta), 🌱 cria da base de titular, 🏆 copa chegando (≤5 rodadas), 🗓️ Libertadores/Copa do Mundo na próxima
  temporada ou nesta. Ficaram de fora (ele não pediu): zebra, goleada, maior subida/queda, artilheiro do seu time.
  E a tabela do desktop passou a 10 linhas (celular segue com 5).
- 💾 8º ajuste (04/10, *"ok pode"*): faixa **💾 Salvar** no topo da Central, logo abaixo do título. Diz em que pé está a
  nuvem (verde em dia · âmbar atrasado/nunca · cinza sem conta) e o botão faz o mesmo que "Sair e salvar carreira",
  sem sair. `savePyramidCloud` anota quando e em que rodada cada carreira subiu (`ultimaSubidaNuvem`, chave
  `esc-nuvem-subiu:<seed>` no aparelho). Bancada: `esc-central-dev-logado=1` finge logado (só no vite).
- ⏭️ Decidir com ele: abrir na Central ficou como padrão; se preferir abrir em Jogos é 1 linha (`useEffect` do
  `centralOn`). Ideias que ficaram de fora de propósito: "ler a edição completa" (não existe jornal de meio de
  temporada ainda) e o 🔊 "ouvir" do giro.

## 😈🔴⚫ Batismo Vieira FC (03/10)
- Dono `felipe.vrod10@gmail.com` (já era ⭐ Craque pago — subiu pra 👑 Lenda). **Série D**, no assento do bot
  **Prestígio FC** (só existia na pirâmide; `OLD_NAME` + escudo/carimbo no nome velho levam save antigo pro clube novo).
  Fundador nº84. Coração: **Corinthians**.
- Arte do dono (fundo verde, mascote e camisa grudados pelo tridente — separados na mão): escudo 196×360/23 KB ·
  mascote "O Diabo" 258×440/45 KB · camisa da Loja. Manto medido: preto #171212 (91%, mediana #110D0D) + vermelho #DE1B19.
- Banco GRAVADO (03/10): conta existe desde 26/07 · user_colors ouro/manual · esc_fundadores 84 · esc_socios nº65
  (Corinthians, vieira_diabo, escudo_time Vieira FC) · esc_nomes_batismo Vieira/FC/EC. Falta só o nome do dono pro post.

## 03/10/2026 — 🧾 Ficha do jogador funcionando SEMPRE ✅ NO AR (Diego: *"deve funcionar a estatística do jogador sempre"*)
- Auditoria: gols/assistências da TEMPORADA já somavam liga + Copa do Brasil/Legends + Supercopa + Copa do Mundo +
  Libertadores/Champions/Mundial, e a Bola de Ouro/artilheiros usam a mesma soma. O total "no seu clube" já era
  gravado em toda virada (`guardaCansaco`).
- Consertado: (1) a ficha de duas colunas (jogos · gols · assistências, temporada × no seu clube) e a coluna JOGOS só
  apareciam com o GÁS ligado (Série C+ com Agência) — agora `EstatUI`/`estatJogos` em toda carreira solo, qualquer
  divisão; (2) jogo de Copa ia todo pros 11 da 1ª fase e só no fim — agora cada fase vai pra escalação DAQUELA fase
  (`r.slot`), e durante a Copa conta fase já jogada. Trava: `npm run artilharia` (também atualizada pras copas
  internacionais, que reprovavam por texto velho).
- Fora de escopo por ordem dele: carreira online em sala (*"esquece salas, rápido online agora"*).

## Presidência — lote 2 privado (03/10)

Base publicada 97faf8bd. Agora habilitados estádio/vista aérea, móveis,
garagem e teto estrutural para Diego; nenhuma concessão de obras ou saldo.
Build e oito suítes passaram. Detalhes e limitações visuais ainda pendentes:
`docs/presidencia-lote2-entrega.md`. Arte parcial não é estádio final pronto.
Publicar incrementos aprovados/testados é autorizado, somente para a conta
diego.c.fonseca@gmail.com. Confirmar deploy após push, não só build.

## Presidência — lote 1 privado reconciliado (03/10, histórico)

Integração sobre main `3336f1ea`, em `work/presidencia-lote1-main-20261003`.
Criação, perfil e sala preparados somente para Diego; economia, garagem,
teto e substituição da aba do estádio desligados. Build e testes locais
passaram, com identidades simuladas e sem gravação em contas reais.
Plano, testes e limitações: `docs/presidencia-lote1-entrega.md`.
O acervo original permanece em `work/presidencia-integracao-20260921`.
Publicação autorizada por Diego para sua conta; não confundir preparação
com deploy confirmado. Não alterar as competições cuidadas no Cloud.

## 03/10/2026 — 🗜️ Save da carreira internacional enxuto ✅ NO AR (caso marcomak03: "joguei 2 temporadas, salvei e voltou atrás")
- Suspeita (NÃO confirmada no banco — a leitura do save dele ficou esperando aprovação): o celular tem ~5 MB pro jogo e a
  carreira internacional guardava, POR TEMPORADA, a lista inteira de gols/assistências dos ~780 jogadores da máquina
  (`botPlayerStats`, ~45 KB/ano, que nenhuma tela lia). Cota estourada = `setItem` falha calado e fica o save velho.
- Feito (OK do Diego: *"faz"*, com a condição *"não quero perder as coisas que acontecem na carreira internacional"*):
  a lista vira um placar ACUMULADO `careerIntlBotTotals` (chave da carta → [jogos, gols, assistências]). Nenhum número
  se perde; o resto da temporada (campeões, artilheiros, jogadores do usuário, teamRecords do ranking) fica igual.
  Saves antigos migram ao abrir (`compactaHistoricoIntl` em `sincronizaNiveis`, idempotente). 6 temporadas: 291 → 82 KB.
  Trava: `npm run save-intl`.
- ⏭️ FALTA: (1) conferir no banco o save do marcomak03 (temporada da nuvem × do celular) e recuperar as 2 temporadas se
  a nuvem estiver mais nova; (2) avisar na tela quando o save não couber (hoje falha calado — `catch { /* cota cheia */ }`).
- ⚠️ `npm run artilharia` já reprovava 2 linhas ANTES desta mudança ("a virada manda LIGA + COPA + COPA DO MUNDO pro
  histórico" e o mesmo de assistências): conferência por texto desatualizada pela carreira internacional. Reescrever.

## 03/10/2026 — 🧱 Leilão de Clubes depois dos Lotes 40/41: conta feita, Europa sozinho NÃO liberado (Diego: *"ainda não"*)
- Clubes que fecham setor (3 baralhos, pior caso MEI 4 / ATA 3): antes do Lote 40 → agora: GOL 81→114 · LAT 46→81 ·
  ZAG 42→75 · MEI 47→49 · ATA 64→97 · clubes diferentes 110→136. Entram sozinhos (`buildDeckClubes` não tem lista fixa).
- Baralho sozinho (técnicos que cabem, com a sobra mínima): **Europa 11** (fecha sala cheia, mas no aperto — com
  folga de pacote só 5) · Brasil 5 · Mundo 6 (falta meia). Ofereci liberar o Europa sozinho: ele disse **"ainda não"**.
  Não repropor sem ele puxar o assunto. Brasil sozinho continua sem fechar.
- Gargalo é o MEIO (clube precisa de 4 meias): caminho, se ele quiser, é meia famoso em clube que já tem 2–3.

## 🦅⚫⚪ Batismo Gaviões SCCP (02/10)
- Dono `kauealves584@gmail.com` (conta desde 15/09). **Série C**, no assento do bot **Zorra FC** (que segue vivo em
  CLASSIC_CLUBS; `OLD_NAME` leva save antigo pro nome novo). Lenda + fundador nº83 + sócio nº64 — banco gravado
  (user_colors ouro/manual, esc_fundadores, esc_socios, esc_nomes_batismo com FC/EC pelo gatilho).
- Arte do dono (fundo verde): escudo 200×360/29 KB · mascote "O Gavião" 224×440/36 KB · camisa da Loja.
  Manto medido: preto #161314 (77%) + branco #F9F8F8 (gola/punhos). Só o nome INTEIRO tem escudo (nunca "Gaviões" sozinho).
- Time de coração: Corinthians (confirmado pelo Diego). gravado em esc_socios (03/10). Falta só o nome do dono pro post.

## 02/10/2026 — ✉️ Convite com CARTA DE CADA CLUBE + "técnico" no lugar de "presidente" ✅ NO AR
- Pedido do Diego (print do Fabao Fabulous EC): *"esses textos não podem ser mais pessoal? falar da Vila… de Porto
  Alegre… trazer a família"* e *"não fale presidente, até agora não sei o que sou sendo convidado"*.
- `src/escalacao/convite-cartas.ts`: 72 cartas (PT/EN), uma por clube — estádio, cidade, torcida e um agrado pra
  família. Só fato público, nenhuma pessoa real. Clube novo na lista internacional precisa ganhar carta aqui.
- Manchete virou "O <clube> quer você como técnico"; a carta termina dizendo o convite com todas as letras ("ser o
  técnico do X na Libertadores… o seu clube continua seu"). Jornal e linha do tempo trocaram "presidente" por
  "dono"/"técnico" ("Sua carreira de técnico").

## 02/10/2026 — 🌎 CARREIRA INTERNACIONAL LIBERADA PRA TODOS ✅ NO AR (*"pode publicar… liberar pra todos"*)
- Jogo: `INTERNATIONAL_CAREER_GERAL = true` (`career-international.ts`) → toda conta logada, da T40 em diante.
- Banco: `esc_private_international_rank_allowed()` agora = qualquer conta logada (migração
  `20261002120000_carreira_internacional_para_todos.sql`, já aplicada). O gatilho continua só deixando
  gravar a PRÓPRIA linha e sem número negativo.
- Novidade PT/EN na home. Vídeo de lançamento: `scripts/video-internacional-reels.mjs` (agora com a Copa de 32).
- ⚠️ `scripts/testa-ranking-privado-internacional.mjs` já reprovava ANTES da liberação (espera 90 pontos e o banco
  dá 110 desde os pesos 60/50 de 01/10) e várias asserções dele são do teste fechado por e-mail — precisa ser
  reescrito pro mundo liberado.
- Reverter: `INTERNATIONAL_CAREER_GERAL = false` + voltar a função do banco pro teste por e-mail (corpo na
  migração 20261001173507).

## 02/10/2026 — 🌍 COPA DO MUNDO DE 32 SELEÇÕES ✅ NO AR (pedido do Diego: *"vamos fazer 32"*)
- **Formato sai do TAMANHO da Copa** (`formatoCopa(n)` em `copa-mundo.tsx`): 32 → 8 grupos de 4, passam os 2
  primeiros = 16 (sem quadro de 3ºs). 24 → o formato velho (6 grupos + 4 melhores 3ºs). Assim sala online
  que já guardou 24 times e carreira que **começou** a Copa de 24 antes da mudança terminam com 24
  (`emAndamento.n`; sem o campo = 24). Os passos (`copa-passos.ts`/`esc_copa_preview_clock`) NÃO mudaram:
  continuam 3 rodadas de grupo + mata-mata.
- Carreira: `VAGAS_MUNDO = 32` e o `cmVaga` pega o TOP 32 do ranking de clubes.
- **Lote 41 (baralho Europa, 44 cartas famosas)** pra fechar 11+ em cada país novo: Escócia 17 · Suécia 17 ·
  Turquia 16 · Sérvia 14 · Gana 14 · Irlanda 13 · Costa do Marfim 13 · Argélia 12 (contando as cartas que já
  existiam). Bandeira e cor de cada uma em `FLAG`/`PAIS_COLORS` e no jornal da sala.
- Próximos da fila (se um dia for 36/48): Polônia 6 · Ucrânia 6 · Nigéria 6 · China 5.
- Reverter: `COPA_TEAMS = 24` em `copa-mundo.tsx` + `VAGAS_MUNDO`/`slice(0, 32)` de volta pra 24 no
  `pyramidseason.tsx` (as cartas podem ficar).

## 01/10/2026 — 🖥️ Carreira no MONITOR em duas colunas ✅ NO AR (OK do Diego nas fotos antes/depois)

🐛 **02/10 — jornal espremido no fim da temporada (print do amigo do Diego, depois da Libertadores).**
O jornal O MARTELO, o roteiro e as decisões da rodada 0 ficam ANTES do placar no HTML, então
caíram na coluna da esquerda (360px) e as palavras quebravam no meio. Conserto: a classe
`ll-cx-fim` (sem jogo ao vivo = `done && !copaPlaying` ou `round === 0`) desliga a grade e volta a
UMA coluna de 900px. Medido com um save na rodada 37 jogado até o fim (`--fase destrava`).

Diego: *"analise o desktop do modo carreira… todas as telas, abas, menus, botões. Está muito
desalinhado… organize tudo. Não mexa no dispositivo móvel."* Medido em 1440px com
`node scripts/navega-carreira.mjs --desk --fase abas`: tudo numa coluna só, o placar vinha primeiro em
TODA aba e a tabela/elenco/rank só depois de uma tela de rolagem; a largura mudava de aba pra aba
(1040 nos Jogos/Tabelas, 760 no Elenco/Rank/Clube).
- `src/escalacao/career-desktop.css` (novo, TUDO dentro de `@media (min-width:1100px)`): grade de
  **360px + o resto, 1320 no total, igual em toda aba**. Esquerda = cabeçalho da competição, placar
  ao vivo, controle da partida, caixa da conta e Sair. Direita = o conteúdo da aba, começando no topo.
- `pyramidseason.tsx` só ganhou duas divs sem estilo (`ll-cx-lado` e `ll-cx-aba`) e classes-gancho
  (`ll-cx-conta/sair/placar/campo/grama/lista`). Abaixo de 1100px nada tem regra: celular medido
  igual (caixa da conta no mesmo y, mesma rolagem). Campinho do Elenco: 560→490px de largura e
  860→740 de altura pra sobrar lista ao lado.
- 🔌 Desligar = trocar `1100px` por `99999px` no CSS (ou reverter o commit).
- Diego viu as fotos antes/depois das 5 abas e disse "Ok" → publicado. Pra refotografar: `--desk` no
  `navega-carreira.mjs`.


## 🔴⚪ Batismo Guimarães SCI (02/10)
- Dono `jadriovani@gmail.com` (conta desde 23/09). **Série A** no assento do **Tôka10**, que desceu pra **Série B** (no
  lugar do bot Botafogo da Colônia, que segue vivo em CLASSIC_CLUBS). Lenda + fundador nº82 + sócio nº63.
- Arte do dono (fundo verde): escudo com o Saci espiando 229×360/27 KB · mascote "O Saci" 320×440/41 KB · camisa da Loja.
  Manto medido: vermelho #C50208 (84%) + branco #FEFBFC (gola/punhos). Só o nome INTEIRO tem escudo (nunca "Guimarães" sozinho).
- ❤️ Time de coração: Internacional (Diego confirmou 02/10; gravado em esc_socios). Falta só o nome do dono pro rodapé do post.

## 👒⚪ Batismo Real Madruga (02/10)
- Dono `luck.45@live.com` (conta existe desde 25/09). **Série A**, no assento do **Bicho da Seda**, que desceu pra
  **Série B** (no lugar do bot Operário das Docas, que segue vivo em CLASSIC_CLUBS). Lenda + fundador nº81 + sócio nº62.
- Arte do dono (prancha com fundo verde): escudo 258×360/28,9 KB · mascote "O Madruga" 440×416/43,5 KB · camisa da Loja
  `madruga-camisa-v1.webp`. Manto medido: branco #F3F1F0 (66%) + preto #161412 (28%); dourado (2%) fora.
- ⚠️ "Real Madruga" ERA o nome velho do **Marolados FC** (paisagensetrilha). Cortado o `OLD_NAME` e o carimbo antigo —
  o Marolados segue pelo nome atual e pelo e-mail. Save muito antigo ainda chamado "Real Madruga" passa a mostrar o clube novo.
- Banco: user_colors ouro · esc_fundadores 81 · esc_socios 62 · esc_nomes_batismo "Real Madruga".
- ❤️ Time de coração: **CRB** (Diego, 03/10) — gravado em esc_socios e no post. Falta só o nome do dono pro rodapé.

## 01/10/2026 — 🌎 CARREIRA INTERNACIONAL: fluxo passo a passo ✅ FEITO (só a conta do Diego; mockups aprovados)

Diego mandou o Codex parar e manter esta sessão. `career-international-view.tsx` foi REESCRITA por cima do motor do
Lucas (motor, reducer e save intocados): 1 competição (2 banners) → 2 clube (só os blocos daquela competição) →
3 convocação (cópia da `ConvocacaoScreen` da Copa, `JogadorNoCampo` sem fundo) → 4 cada noite da MINHA competição no
`LiveScoreCard` da liga (noite sem a minha competição anda sozinha; ida/volta em dois cards; agregado/pênaltis
embaixo; classificação PARCIAL só do que já foi revelado — `tableFor` exportada) → 5 Mundial só no fim → sem vaga:
PULAR (roda tudo e encerra sozinho) ou ASSISTIR (as duas em lista, noite a noite). Ritmo segue o `useSimMode` (auto
avança sozinho; manual tem botão).
- 🏅 **Ranking global**: Mundial **60** · Libertadores/Champions **50** (antes 50/40/40). Mudou em `PTS_TITULO`,
  `internationalCareerRanking` e na RPC `esc_pyramid_rank_rows_v2` (migração
  `20261001210000_ranking_internacional_mundial_60_continental_50.sql`). Copa do Mundo continua 200, acima de tudo.
- 💰 **Premiação por etapa** (`summarizeInternationalCampaign`): fase inicial 6 · repescagem 8 · oitavas 10 · quartas 14 ·
  semi 20 · vice 30 · campeão 60 (um pouco acima da Copa do Brasil: 6/10/16/25/50); Mundial vice +10 · campeão +25 (um
  pouco acima da Supercopa 8/20). Palavras dele: *"um pouco mais do que a Copa do Brasil… por etapas… Mundial um pouco
  mais que a Supercopa"*. Testes `testa-temporada-internacional.mjs`/`testa-fixtures-carreira-internacional.mjs` atualizados.
- 🧢 **2ª rodada do teste (01/10, 18:50)**: *"eu escolhi o Flamengo… não tá aparecendo os jogadores do baralho do
  Flamengo pra eu convocar"*. Agora a convocação é entre as **lendas do clube escolhido no baralho** (igual à seleção
  na Copa do Mundo): `internationalClubCards` em `career-international.ts` (id `intl:nome|clube|ano`), e o reducer
  aceita carta do elenco OU do clube (`isInternationalClubCard`). Medido: **30 dos 72 clubes fecham um 11 sozinhos**
  (Flamengo 77 cartas, Real Madrid 52…; Libertad/Emelec/Olimpia 0). Clube que não fecha completa com o SEU elenco,
  marcado "seu elenco", com aviso do porquê. E o "ranking internacional de clubes" saiu da tela (*"não serve pra nada"*).
- 🔁 **3ª rodada (01/10, 19:05)**: *"eu NÃO levo meu elenco… é todo jogador do Flamengo no baralho, todo jogador do
  Real Madrid, do River Plate"*. Então: convocação SÓ entre as cartas do clube (todas, não só lendas); elenco do
  usuário nunca entra (reducer exige `isInternationalClubCard` em todas as 11); clube sem carta pra fechar 4-3-3/4-4-2
  aparece **trancado** no passo 2 (🔒 + quantos tem no baralho). ⚠️ **Só 30 dos 72 fecham**: blocos 5–9 estão quase
  vazios (Libertad, Emelec, Olimpia, Millonarios, Nacional-URU, Estudiantes, Racing, Cerro, Newell's, Rosario, Argentinos,
  U. de Chile = 0 cartas; Galatasaray 2, Rangers 3, Celtic 4…). Quem termina do 5º pro 8º pode não ter clube pra
  convocar — a tela avisa e oferece Pular/Assistir. **Precisa de carta nova desses clubes** (lotes) pra fechar.
- 🃏 **Lote 40 (01/10, aprovado pelo Diego: *"pode fazer esses e coloque Renato Augusto também no Leverkusen e o
  Ponte"*)**: **322 cartas** (226 no baralho Mundo, 96 no Europa) pra os 42 clubes fecharem um 11 só com gente do
  próprio clube — agora **72/72 fecham**. Tudo em `L40_WORLD_*`/`L40_EU_*` (`data.ts`), país por carta em
  `PAIS_POR_CARTA`, 33 nomes repetidos em `MESMO_JOGADOR` (+ linha por carta das antigas), apelido
  `'Bayer Leverkusen': ['Leverkusen']` na lista internacional, `npm run paises` ✅, `npm run novidades` rodado
  (snapshot + 60 linhas na home). Stories: `mockup-cartas-novas.mjs --lotes L40` em 4 imagens (GOL+LAT · ZAG · MEI · ATA).
  Categoria — decisão do Diego (01/10, régua: *"do nível de Riquelme, Alex do Cruzeiro"*): **lenda só Pedro Rocha,
  Kempes (Rosario 73), Di Stéfano e Spencer**; Morena, Mazurkiewicz, Perfumo, van Hanegem e Lolo Fernández são craque.
  ⚠️ Lição: ao ajustar a foto do baralho (`catalogo-snapshot.json`, formato `DECK|nome|clube|ano` → `f`), LER antes de
  abrir pra escrever — um `open(sp,'w')` dentro da chamada zerou o arquivo e isso foi publicado por alguns minutos
  (restaurado em seguida; o jogo não lê esse arquivo, só o gerador de novidades).
- 🛡️ **Escudos + Leilão de Clubes dos 42 clubes novos (01/10, pedido do Diego: *"os times que não tem escudos, busque
  na internet… seja carreira ou online"*)**: conferido com script — **72/72 têm arquivo oficial** em
  `public/escudos-clubes/` (`escudos-oficiais.ts` + `escudos-internacionais.ts`, resolvidos por `escudoOficialDoClube`,
  que o `SeloClube` já usa na carreira e no online) e **72/72 fecham um 11**. Grafia das 13 cartas do Chile unificada em
  `U. de Chile` (`CLUB_GRAFIA` + apelido internacional + `paises.ts` + foto do baralho). Leilão de Clubes não tem lista
  fixa: `buildDeckClubes` pega qualquer clube do baralho com carta sobrando no setor, então os novos já entram sozinhos.
- 🔁 **2ª rodada de teste do Diego (02/10)** — *"tá estranho… cadê o botão de manual padrão?… a tabela aparece de cara…
  na final deveria aparecer as duas finais ao mesmo tempo… se eu quiser assistir, eu assisto qual?"*. A tela que subiu em
  01/10 tinha fugido do mockup aprovado (tabela dobrada num `<details>`, botão "Próximo" solto, sem controle). Mockup v2
  aprovado (*"Ok, pode fazer tudo"*) e FEITO: a campanha usa as MESMAS peças da Copa da carreira — faixa → placar grande →
  **🎮 Controle da partida** (`SpeedControls` + `SimControls`: Próxima rodada / Pular / Modo auto; `QuickManualLock` pra
  quem não tem Modo Manual; régua `!careerEra || useHasManual()`) → **tabela sempre à vista** (grupos com MEU GRUPO /
  TODOS, tabela de 36 com faixas de corte; mata-mata em cartões) → outros jogos (pílulas compactas nas noites de 17–18
  jogos). **As duas finais caem na mesma noite** (motor: mata-mata da Liberta andou pra noites 10–13; a Liberta descansa
  na noite do repescão) — a minha no placar grande, a outra no cartão `OutraFinal`. **Sem vaga**: Pular, ou Assistir
  escolhendo UMA (Libertadores/Champions) na mesma tela de quem joga; o Mundial vem pros dois (escolha guardada em
  `esc-intl-modo-v1` por temporada). 🔓 **Champions só abre depois de ganhar a Libertadores** (`championsLiberada(history)`;
  banner trancado "🔒 Ganhe a Libertadores pra liberar"). Formato dos grupos mantido: 6 de 6, passam 2 + 4 melhores 3ºs.
  Conferido com `scripts/fotografa-carreira-internacional.mjs` (fotos reais em 7 cenários) — gate continua só na conta dele.
- 🔁 **3ª rodada (02/10, 23h50)** — *"a final da Libertadores que eu não participei faltou um destaque… as simulações
  estão dando resultado pronto, quero simulação real com o tempo passando… e pênaltis… depois de escolher o clube não quero
  botão de trocar clube, escolheu já era"*. FEITO: todo jogo da noite roda no MESMO relógio do placar grande (cartões no
  mata-mata, pílulas nos grupos), ida e volta uma perna de cada vez, e no apito da última o cartão diz agregado + pênaltis +
  quem passa. A final que você só ASSISTE (Liberta/Champions/Mundial) vai no cartão `FinalCard` com a arte da competição,
  rolando ao vivo — o placar grande (`LiveScoreCard`) é sempre "você × rival" e narra "vitória", por isso não serve pra
  jogo neutro. Saiu o "Trocar de clube"; a escolha fica gravada por temporada (`esc-intl-clube-v1`).
- 🔁 **4ª rodada (02/10, 01h25)** — *"o header das ligas novas não tá aparecendo a fase… nada a ver ficar aparecendo a
  Série A… a parte da Libertadores/Champions pequena… no jornal tem que ter destaque dos campeões… gols e assistências das 3
  competições contam pros totais e pra Bola de Ouro"*. FEITO: com a campanha na tela (`intlNoAr`), o cabeçalho fixo da
  carreira vira o da competição em foco (`topoInternacional` → `CareerCompetitionStage` kind liberta/champions/mundial, arte
  grande, fase e formato) e a faixa pequena some de dentro da tela. Jornal: a capa ganhou Mundial (Campeão do mundo),
  Libertadores (Rei da América) e Champions (Rei da Europa) com foto. Gols/assistências: JÁ contavam (`intlListas` entra no
  `RECORD_SEASON_STATS` e no `melhorDoMundo`), e a campanha já roda ANTES do jornal (`fimOrdem` [3,1,2,4]) — conferido.
- ✉️ **O CONVITE (02/10, mockup aprovado: *"adorei… perfeito"*)** — narrativa: o presidente do seu clube é chamado
  pra ser o TÉCNICO CONVIDADO de um clube grande por uma campanha. No lugar de escolher competição + clube num cardápio,
  chegam **2 convites sorteados do bloco da sua posição** (`convitesDaTemporada`, preso na semente + temporada; campeão
  da A = bloco 1, campeão da Copa do Brasil = bloco 2, 2º–8º depois); depois de ganhar a Libertadores, **2 da Liberta +
  2 da Champions**. Carta estilo O MARTELO (`CartaConvite`), aceitou = travado. Na campanha o clube aparece com nome e
  escudo DELE (`comNomeDoClube`), o placar diz "TÉCNICO: <seu clube>" no lugar de "VOCÊ" e a mascote do gol continua a
  SUA (`LiveScoreCard` ganhou `mascotHome/mascotAway`). Jornal: manchete "Presidente do X leva o Flamengo ao título da
  América" + capa com o escudo do clube e "técnico: X". Ranking, moedas e histórico continuam no seu clube (save igual).
- 🔁 **Renovação + G8 (02/10)** — quem foi campeão da Libertadores/Champions na temporada passada recebe o convite de
  RENOVAR com o mesmo clube (`clubeDaRenovacao`, carta dourada "Campeão, o X quer renovar…") + 1 da mesma competição do
  bloco da posição + os 2 da outra (se aberta) — sempre 2 por competição. O reducer aceita a renovação mesmo de bloco
  melhor (mesma régua da tela). Tela sem "bloco"/"prioridade": a tabela da Série A marca **G8** (5º–8º; 1º–4º já têm G4)
  com a legenda do convite, só pra quem tem a carreira internacional.
- ✅ **Sala de Troféus: a carreira do presidente** (02/10, mockup aprovado: *"ok tudo aprovado"*). `CarreiraPresidente`
  embaixo da estante do Hall de Troféus (aba Rank): clubes comandados (temporadas e títulos), números (campanhas, jogos,
  títulos, artilheiro) e a linha do tempo (dourado = título; selos Renovação, Campeão do mundo, Champions liberada, Estreia
  na Europa). Lê só o histórico gravado. Saiu o `<details>` antigo de texto corrido. A legenda dos pontos do ranking agora
  lê o `PTS_TITULO` (mostrava Mundial +50/Liberta +40, os números antigos).
- ✉️ **O convite que você recusou + 💬 recado da lenda (02/10, "faz o 1 e 3")**. A campanha guarda `recusados` (os
  convites que ficaram na mesa) e o histórico leva junto; se um deles for campeão (Liberta/Champions/Mundial), o jornal
  abre a faixa "O convite que você recusou" com provocação. Na convocação, o maior nome do clube no baralho assina um
  recado de boas-vindas (`RECADOS`, 8 frases PT/EN genéricas de vestiário — não imitam o jeito de ninguém).
- 🎬 **Vídeo de lançamento das 3 competições (02/10)** — `scripts/video-internacional-reels.mjs` (reels 9:16, ~38 s, molde
  do vídeo do Leilão de Clubes). Só as competições, SEM falar de convite (ordem dele). ⚠️ No ar, a carreira internacional
  ainda é só da conta do Diego: o vídeo é pra quando ele liberar pra todos.
- Ficou pra depois: cara do placar com arte da competição DENTRO do card (hoje só a faixa de cima tem a arte).
  ✅ A narração do apito no mata-mata/final agora é de copa (`apitoFrases` no `LiveScoreCard`, `frasesDoApito` na tela internacional): ida, volta e final com taça/pênaltis. Grupos seguem com as da liga.

### (pedido original, pra memória)

Diego testou o teste fechado (prints às 16:41) e mandou REFAZER o fluxo, passo a passo, no padrão do jogo.
Palavras dele: *"primeiro deveria aparecer só o banner da competição que quero jogar, como passo a passo… se for
Libertadores mostrar só os blocos dos times da Libertadores… depois convocar igual já temos (Copa do Mundo)… se
tô na Liberta não vejo da Champions e vice-versa… a simulação deve ser bonita, estilo Libertadores ou Champions,
padrão das Copas, rolando o tempo, lento… depois que acabar vem o banner do Mundial, jogo único contra quem ganhou
a outra… quem não se classificou pode pular ou assistir"*. Traduzindo em passos (um toque por passo, como o roteiro):
1. **Escolher a competição**: só os DOIS banners (🌎 Libertadores · 🌎 Champions). Nada de tabela de 72 clubes nem
   lista das duas competições juntas. O banner do Mundial NÃO aparece aqui.
2. **Escolher o clube**: só os blocos DA competição escolhida (Libertadores → só Conmebol; Champions → só UEFA),
   respeitando a prioridade (blocos liberados).
3. **Convocar os 11**: a MESMA tela de convocação que já existe (Copa do Mundo/Clubes: campinho `JogadorNoCampo`
   com rosto das lendas, abas por posição, relógio) — não a janela nova de busca/checkbox. 🐛 No teste, ele escolheu
   **Flamengo** e a janela abriu dizendo *"representando Real Madrid"* e com jogadores que não eram os dele
   (*"apareceu jogador do Botafogo"*). Conferir o vínculo clube escolhido → inscrição → elenco.
4. **A campanha**: só a competição dele na tela (quem está na Liberta não vê a Champions, e vice-versa). Partidas com
   o placar padrão do jogo (o mesmo das Copas: tempo rolando, ritmo lento, lance do gol), com a cara da competição
   (Libertadores ou Champions). Nada de "14 etapas" em texto.
5. **Mundial**: só DEPOIS de acabar a continental aparece o banner do 🌐 Mundial — **jogo único** contra o campeão
   da outra competição (empate = pênaltis, padrão da Copa do Mundo).
6. **Quem não se classificou**: pode PULAR ou ASSISTIR a simulação (com ou sem Modo Manual).
⚠️ UI nova = mockup primeiro e OK do Diego antes de codar. O dono deste código é a série de commits do Lucas
(`74743d2…06c6ab6`, teste fechado só na conta do Diego). Esta sessão só registrou o pedido.

## 01/10/2026 — 🧪 Save de TESTE do Diego pra carreira internacional (editado no banco, só nuvem)

Diego quis testar Libertadores/Champions/Mundial (teste fechado da conta dele) e disse *"só quero testar, depois eu
excluo essa carreira"*. A carreira mais nova dele (seed 562010372, T43 rodada 1) estava na Série C e, pelo motor
(mesma `buildPyramid`+`simulatePyramid` da tela), terminaria entre 14º e 20º da A em qualquer troca de clubes —
sem vaga (top 8). Então, SÓ NESSE SAVE, via `esc_pyramid_saves` (slot 0, `at` renovado pra nuvem ganhar do celular):
`careerPlacements.m0 = 'A'` (Leão da Estradinha desceu pra C, 20 por série mantidos) e o elenco dele virou 19 lendas
reais do baralho (ids das cartas preservados → `careerLineup` continua válido; `isRealInternationalCard` = 19/19).
Simulado: campeão da A com 76 pts, 14 à frente. ⚠️ Não é regra nem ferramenta: carreira pra apagar depois do teste.
Scripts da simulação ficaram só no scratchpad.

## 01/10/2026 — 🧢💰 Preço do técnico com TETO (bug do Renato, antonelli.renato@gmail.com) ✅

Prints do Renato (carreira na **temporada 116**): Parreira vendido por 12.426 pra um bot com 1 moeda, Mourinho por
13.542. No save dele Unai Emery valia 84.991. Dois furos, agora fechados:
- O mercado "aprendia" cada venda como piso da próxima, e a contratação de bot entre temporadas multiplicava pela
  inflação de 4%/temporada (5,6× na 116) em cima do preço já inflado. Agora a inflação para em 2×.
- No pregão de técnico o bot dava lance de até 2× o piso **sem olhar o bolso** (no de jogador ele é limitado).
Regra do Diego: *"o técnico fica com o valor do que foi negociado no leilão, igual jogador… e baixar os exorbitantes
pra um piso realista"*. → `tetoTecnico` em `tecnicos.ts` = **4× o piso da categoria** (A 100 · B 72 · C 48 · D 24 ·
V 8). Piso do lote, lance do bot (e só do que ele tem) e preço entre temporadas respeitam o teto. **Cura ao abrir o
save** (`sincronizaNiveis`): qualquer `careerTecnicoPago` acima do teto desce pro teto — vale carreira ativa,
arquivo, nuvem e partida em andamento; salário (pago ÷ 10) e multa de demissão caem junto. Humano pode pagar mais
que o teto se quiser (o valor negociado fica), mas o bot nunca força isso. Reverter = 1 commit.

## 01/10/2026 — 🖼️ Mascote inteira na janelinha do placar ✅

Print do Diego (foto pro Twitter): no gol do Neymarzetti o placar mostrava só as PERNAS do Mascarado. A janela do
escudo recebia o BUSTO do carimbo (recorte de 176px dentro de uma div) e a caixa de 76px do placar só encolhe
`<img>` direto. Agora o placar usa `mascoteInteiraDoTime` (a mesma da Entrada de Gala); o carimbo grande que
atravessa a tela continua o busto, como sempre.

## 30/09/2026 — 🌐 Copa do Mundo online: 45s por seleção + "gerenciar" na tela dos países ✅

Diego, vendo a live do canalmeianacanela: *"tempo de escolha de seleção… passe pra 45s por seleção. E coloque
também botão de gerenciar no final da tela dos países, pro host poder remover o usuário que tá demorando"*.
- `SEG_BANDEIRA` 75 → **45s** (`copa-mundo-online.tsx`). Convocação (90s) e banner (15s) iguais.
- 🧑 Convocação da Copa (`ConvocacaoScreen`): campinho igual ao da carreira, com o rosto das lendas (vale online e carreira).
- ⚙️ "gerenciar técnicos" no fim do `PortaoDaCopa`, só pro dono: remover = o mesmo `kickPlayer` do rodapé
  (o time vira CPU, sai da fila e a vez passa pro próximo). Era preciso porque a tela da Copa cobre o rodapé.

## 30/09/2026 — 🎟️ Cupom do Canal Meia na Canela renomeado ✅ (só banco)

`esc_cupons`: CANALMEIACANELA → **CANALMEIANACANELA** (influenciador "Canal Meia na Canela"), 10% no batismo.
Tinha 0 usos, então a troca não mexeu em nenhum registro de uso. O código antigo deixou de valer.
Conferido: `esc_cupom_validar('canalmeianacanela','batismo')` devolve o cupom (maiúscula/minúscula tanto faz).

## 28/09/2026 — 🛡️ ESCUDOS OFICIAIS no Leilão de Clubes ✅ NO AR

Diego: *"faz oficial mesmo"* e *"pega da internet… webp, que fica menor"*. Avisei do risco de marca
registrada (escudo é marca do clube; o jogo tem apoio pago) — decisão dele. Se algum clube reclamar:
apagar o arquivo dele em `public/escudos-clubes/` + a linha em `escudos-oficiais.ts` → volta pro selo B.
- `node scripts/escudos-oficiais.mjs` baixa (a rede daqui só alcança GitHub e npm): Europa do
  github luukhopman/football-logos; Brasil/América do Sul dos npm `football-badges` (MIT) e
  `react-brasileirao-logos` (ISC). Recorta, reduz pra 160 px e salva webp. 82 escudos, ~9 KB cada,
  fora do bundle. `SeloClube` usa o oficial quando existe e cai no selo estilo B quando não.
- 🔎 28/09 (Diego: *"pesquise os que faltam na internet e bote"*): +23 de 3 acervos do GitHub (FCLOGO/fclogo.top,
  hugomiura/escudos-times-brasil-svg, sportlogos/football.db.logos) → **106 escudos**. Os GIF/PNG antigos vinham
  com fundo branco: o script apaga o fundo ligado à borda. FALTAM 7 (sem fonte que a rede alcance): Bangu,
  Blackburn, América de Cali (estão em assets.football-logos.cc, bloqueado) e Guarani, São Caetano, TP Mazembe,
  MetroStars (em lugar nenhum daqui) → imagem do Diego, ou liberar o host.
- ➕ 28/09: Orlando City entrou (npm `mls-team-logos`, ISC) → 83. E o script já sabe buscar mais 24 no
  catálogo do npm `football-logos` (Sport, Santa Cruz, Náutico, Ponte Preta, Bangu, Blackburn, Stoke, Vélez,
  Atlético Nacional, América de Cali, Alianza Lima, U. de Chile, América do México, Cruz Azul, Pumas, Tigres,
  Toluca, Necaxa, Al-Hilal, Al-Nassr, Al Ahly, Pohang, Suwon, Yokohama) — a imagem mora em
  `assets.football-logos.cc`, que a REDE desta sessão bloqueia. 👉 Liberar esse host na configuração de rede
  do ambiente e rodar `node scripts/escudos-oficiais.mjs` de novo: entram sozinhos.
  Fora do catálogo (precisa imagem do Diego): Guarani, São Caetano, River Plate, Chivas, TP Mazembe, MetroStars.
- ⏳ (lista antiga) SEM escudo oficial ainda (31), ficam no selo: Sport Recife, Santa Cruz, Náutico, Guarani, Ponte Preta, Bangu, São Caetano, Blackburn Rovers, Stoke City, River Plate, Vélez Sarsfield, Atlético Nacional, América de Cali, Alianza Lima, Universidad de Chile, América do México, Chivas Guadalajara, Cruz Azul, Pumas UNAM, Tigres UANL, Toluca, Necaxa, Orlando City, MetroStars, Al-Hilal, Al-Nassr, Al Ahly, TP Mazembe, Pohang Steelers, Suwon Bluewings, Yokohama F. Marinos.
  Pra esses: o Diego manda a imagem, ou a gente acha outra fonte que a rede alcance.
- É o escudo ATUAL do clube (ex.: Juventus com o "J" novo, Marseille com o "M" de 2024), não o da época da carta.

## 28/09/2026 — 👑 ENTRADA DE GALA do batismo na sala online ✅ NO AR

Ideia pra dar "água na boca" em quem não tem batismo. Mockup aprovado (`scripts/mockup-entrada-gala.mjs`)
com uma ordem: *"sem pôr por enquanto número de sócio"* → nada de nº de sócio/fundador na tela.
`src/escalacao/entrada-gala.tsx` + 3 pontos no `lobby.tsx` (sala de espera, só futebol):
- dono de batismo que CHEGA depois de mim → ~5,6 s de show na minha tela (holofote, escudo no
  telão "CHEGOU NA SALA", grito "Ô Ô Ô, NOME!", mascote atravessando); fila se chegam juntos; quem
  já estava quando eu abri não ganha (só eu mesmo, se sou batismo). Memória só da página.
- linha dourada na lista (escudo no lugar da bolinha + mascote pulando); fora do modo duplas.
- tocar no escudo de outro batismo → "entra assim em toda sala" + botão que abre o Batismo.
Sem som (martelo/torcida seguem as regras de som dele). Batismo = `batismoDe(nome)` com
`tipo: 'batismo'` (sócio não entra). Trava: `npm run gala`. ↩️ Desligar = tirar o
`useEntradaGala`/`gala` do lobby (3 linhas).
💡 Próximos passos possíveis (não combinados): som da torcida, dono renomeado seguir pelo e-mail.
🩹 28/09 (Diego: *"o Jurubeba e o Berretinho não tiveram gala, o Fala D10 sim"*): a gala só reconhecia o
nome EXATO da lista de batismos; o dono do Jurubeba joga como "Meia na Canela de Desportos" e o do Cruzeiro
como "Cruzeiro do Berretinho". Agora `clubeDeGala` segue o MESMO caminho do carimbo de gol
(`mascoteKeyDoTime`: nomes velhos/variações + o que o servidor diz sobre a conta de cada assento). Trava
`npm run gala` confere os 58 batismos e os 306 nomes/variações.
🩹 28/09 (print do Diego): a mascote saía CORTADA na linha dourada e no show — eu usava a arte do
carimbo de gol, que é um BUSTO recortado. Agora é `mascoteInteiraDoTime` (mascotes.tsx), a arte inteira.
💭 Ideia do Diego pra DEPOIS (28/09): *"entradas individuais, cada um com a sua… tipo Neymarzetti, que a
mascote é jogador"* — entrada própria por batismo, no jeito da mascote (igual o `FESTA_JEITO`/`CARIMBO_ANIM`
do gol). Ainda não combinado o quê nem quando.

## 28/09/2026 — 📣 Giro um pouquinho mais rápido de novo ✅ NO AR

Diego: *"giro da rodada deixe só um pouquinho mais rápido"*. `GiroDaRodada`: 0,145 → 0,13 s por
letra, piso 16 → 14 s (~10% mais rápido). ↩️ Voltar = os números antigos.
## 28/09/2026 — 🃏 LOTE 36: 23 famosos que não estavam no jogo (baralho Europa) — esperando OK pra publicar

Aprovado por ele (*"aprovo os 16 e os bônus"*). 16 fecham setor de clube no Leilão de Clubes + 7 bônus.
Conferidos por nome E sobrenome nos 3 baralhos (Robbie Keane ≠ Roy Keane; Christian Fuchs ≠ Bruno Fuchs).
Europa sozinho, clubes com pacote: LAT 21→26 · ZAG 24→26 · MEI 26→29 · ATA 24→30.
Baralho Brasil: os famosos que fechariam os clubes quase-prontos (Petkovic, Alex, Rivaldo, Durval, Careca) já
estão no baralho BR por outro clube — regra do mesmo jogador só em baralho diferente.

## 28/09/2026 — 🔁 Cruyff: carta sai do Barcelona 1974 e vai pro AJAX 1972 ✅ NO AR (camisa aprovada)

Diego: *"qual ele é mais lenda?"* → Ajax (tri da Champions 71-73). Ajax e Barça são do mesmo
baralho, então é UMA carta: `data.ts` troca o endereço (mesma faixa 90-95). Saves antigos mudam
sozinhos (`sincronizaNiveis`, nome com carta única). Avatar: a camisa do Barça foi REPINTADA pra
do Ajax (branca com a faixa vermelha larga) → `johan-cruyff-ajax-1972.webp` (24 KB); a carta velha
no álbum aponta pro rosto novo (`legend-avatars.ts`). `check-legend-avatars` atualizado pra 188.
⚠️ `npm run novidades` apagou 2 linhas que não tinham nada a ver (Maniche, João Moutinho) —
devolvi o arquivo gerado como estava; a troca do Cruyff não vira novidade (mesmo jogador).

## 27/09/2026 — 🐓 BATISMO EL MINEIRO (bastosmbc) — Série C, no assento do bot Brodeiragem

Escudo alvinegro com o galo e a estrela, mascote O Galo Doido (`el_mineiro_galo_doido`), manto preto
#100C0C + branco #E1D9D5 medido na camisa, coração Atlético Mineiro. Sócio nº61 · fundador nº80.
Conta dele conferida antes (criada 17/08, era prata). Recorte com `recorta-prancha-chroma.py`
(ganhou `CHROMA_GB=30` pro fundo verde-água) + tirada a sombra verde do chão debaixo do galo.
SQL em `docs/sql/batismo-el-mineiro.sql`.

## 27/09/2026 — 👑 Van Nistelrooy (Man United 2003) vira LENDA ✅ NO AR

Diego: *"coloque Van Nistelrooy como lenda também"*. Carta única, já no auge; `fame` 4 → 5,
nível 86-92 mantido. Falta a FOTO.

## 27/09/2026 — 👑 Juninho Pernambucano (Lyon 2006) vira LENDA ✅ NO AR

Diego: *"add Juninho Pernambucano lenda do Lyon, ano certo também"*. A carta já era Lyon
2006 (auge: 5º dos 7 títulos seguidos, faltas) → só `fame` 4 → 5 e nível 84-90 → 85-91.
Vasco 1997 (baralho BR) segue craque (lenda = uma carta só). `npm run novidades` e
`npm run paises` rodados. Falta a FOTO dele (entra na lista das lendas sem rosto).
## 27/09/2026 — 🧱 LEILÃO DE CLUBES · Etapas 1 e 2 — ✅ OFFLINE NO AR PRA TODOS · online TRAVADO

Diego (27/09, 14h40): *"no partida rápida já pode liberar"* e, no online, *"deixa à mostra escrito, bota
novo, mas sem poder apertar ainda"*. Então: Partida Rápida offline mostra "🃏 Jogador (padrão) / 🧱 Clubes
[NOVO]" pra todo mundo. Na sala online ⚡ Rápido as duas opções aparecem, Jogador vem marcado, e Clubes
fica com NOVO mas **apagado e sem apertar** — menos pra `CLUBES_TESTERS` (conta do Diego, pra testar).
👉 **Pra liberar o online**: `CLUBES_GERAL = true` em `sport.ts` (só isso; o motor já está pronto).


Pedido: *"o usuário ao criar escolheria agora o padrão leilão de jogador ou por leilão de clubes… comece a
fazer já"*. Feito (trava `CLUBES_TESTERS` em `sport.ts`; pra abrir pra todos é `CLUBES_GERAL = true`):
- Criar partida rápida: **Tipo de leilão 🃏 Jogadores / 🧱 Clubes**. Clubes força os 3 baralhos juntos.
- Cada lote é um SETOR de um clube ("🧤 Goleiros do Palmeiras"): escudo + **só a QUANTIDADE de
  jogadores** (Diego 27/09: *"não quero que mostre os jogadores nas listas do leilão"* — nomes só na
  convocação), **sem nível** (pacote nasce com fame neutro — senão a revelação pintava de dourado com 👑 LENDA).
  Cada técnico leva 1 pacote por setor. Clube não repete entre setores; memória das últimas 3 partidas
  (`RECENT_CLUBES`) pra variar. Com 10 técnicos pode repetir 1 clube (último recurso).
- Pregão/martelo/monte: os de sempre. Embaixo, no lugar do campinho, a lista "🧱 Seus pacotes".
- **Convocação** (`convocacao-clubes.tsx`, tela `'convocacao'`): formação travada, abas por setor,
  lista alfabética, campinho; o preço do pacote é dividido entre os convocados. Bots convocam sozinhos.
  Quem sobra (e pacote que ninguém quis no monte) vai reforçar os times de fundo. Setor sem pacote é
  completado com sobra DE VERDADE (nunca fake).
- Teste de ponta a ponta (rivais 5/7/9, 4-3-3/4-4-2): todo mundo com 11, sem carta repetida.

- ✅ Campinho da convocação igual ao da carreira + rosto + relógio 90s no topo — NO AR (27/09, ~21h, ordem dele).
- 🧑 Convocação mostra o ROSTO da lenda que tem arte no jogo (mesma peça do campinho/jornal) e o relógio
  subiu pra **90s**, no TOPO e grudado: *"Não escolheu a tempo? O sistema escolhe o PIOR do pacote pra você."*
- ⏱️ **Convocação com relógio de 80s** (OK dele: "sim"): segue na hora quando todos fecham; quem estoura
  fica com o que marcou e a vaga vazia leva o PIOR do pacote. Quem já fechou vê "esperando X técnicos".
- 🌐 **ONLINE (Etapa 2) feito** (só pra `CLUBES_TESTERS`): "Tipo de leilão 🃏/🧱" na criação da sala
  ⚡ Rápido (grava `clubes` no `game_state`); força os 3 baralhos e envelope cego. A convocação vai
  pelas duas estradas (rádio + `room_acoes`), o host fecha no tempo (+4s de folga pro "o que eu já
  marquei" dos convidados chegar) e as escolhas não viajam no pacote do estado. Testado no motor com
  3 e 10 pessoas (todos com 11, sem repetido, sem fake); **ainda não testado com 2 aparelhos de verdade.**
- 🔁 **A sala de Clubes CONTINUA de Clubes** (28/09, regra dele: *"se continuarem jogando na mesma sala deve
  ser respeitado tudo que foi criado"*): o "novo leilão" reenvia `clubes`, e o campo entrou na guarda do save
  (`salaFixaRef`) — sem isso o 1º save apagava a escolha (o estado chama de `leilaoClubes`).
- 🏷️ **Nome de clube INTEIRO, nunca abreviado (28/09)**: "América" → **América do México** (6 cartas), "Vélez" →
  Vélez Sarsfield, "Guadalajara" → Chivas. No modo Clubes o mesmo clube escrito de dois jeitos virava 2 pacotes,
  e "América" parecia o América-RJ. `CLUB_GRAFIA` guarda o nome velho pros saves antigos.
  ✅ Achado junto e corrigido: **Evandro Roncatto (Guarani 2004)** saiu do baralho Europa e foi pro BR ("arrume então").
- 🏷️ **Selo 🧱 CLUBES na lista de salas** (28/09): ✅ código no ar + banco rodado (`docs/sql/lista-salas-clubes.sql`).
  Quem abriu o jogo ANTES do banco ganhar a coluna precisa recarregar (a lista desiste da coluna na sessão).
- 🎬 **Vídeo de lançamento** (reels 9:16, ~39s): `node scripts/video-clubes-reels.mjs`.
- 🟢 **ONLINE LIBERADO (28/09, ordem dele)**: `CLUBES_GERAL = true` — salas ⚡ rápidas e 🏆 Minhas Ligas.
- 🐊 **Clubes + Tocaia**: tipo (Jogador/Clubes) e jeito do lance (Envelope/Tocaia) são escolhas
  SEPARADAS (Diego: *"uma coisa não tem nada a ver com a outra"*). Testado CPU (5 e 9) e online (4 e 10).
- 🔝 "Tipo de leilão" vem ANTES do baralho (offline e sala online); Clubes trava o baralho em Todos.
- 📣 **AVISAR O DIEGO** quando der pra liberar Brasil sozinho ou Europa sozinha no Clubes (ele pediu).
  Medido em 27/09 (clubes com jogador suficiente no setor, 4-3-3): BR — GOL 23 · LAT 15 · ZAG 12 ·
  MEI 13 · ATA 19; EU — GOL 37 · LAT 21 · ZAG 24 · MEI 25 (19 no 4-4-2) · ATA 23. Clube não repete
  entre setores, então precisa de ~5×(pessoas+metade) clubes distintos. Toda leva de cartas nova:
  remedir e, se BR ou EU fechar uma sala de 10, avisar.
- 🛡️ **Selos dos clubes — ESTILO B com NOME VERDADEIRO** (28/09, escolha dele): `selos-clubes.ts` (115 clubes:
  nome inteiro, 2 cores, bicho/símbolo da torcida — ⚽ neutra onde não há símbolo conhecido —, ano de fundação) +
  `selo-clube.tsx` (SVG). Aparece no pacote do pregão, no martelo, em "Seus pacotes" e na convocação. Seleção
  (Cabo Verde) saiu do modo Clubes. "Atlético-PR" (cartas 2002/2004) = Athletico-PR no agrupamento.
  ⏭️ Etapa 2: o bicho DESENHADO de verdade (arquivo leve) começando pelos 36 clubes grandes; e o vídeo usar o selo.
**Falta:** teste online com 2 aparelhos · aviso de tamanho de sala.

## 27/09/2026 — 🏅 CONQUISTAS + 📅 MISSÃO DIÁRIA (carreira) — MOCKUP mandado, esperando OK

Ideia pedida por ele (*"sistema de conquistas e missão diária pro modo carreira"*). Mockup mostrado:
estante de medalhas no clube ABAIXO do estádio (Campo · Leilão · Zoeira, 24 medalhas, trancadas em
cinza), bloco "Conquistas desta temporada" dentro do jornal que já existe (sem tela nova), e cartão
"Missões de hoje" (3 por dia, +5 🪙 cada, sequência de 7 dias = +20 🪙) com aviso rápido no tempo
morto. Conquista paga SELO, não dinheiro. Nada construído ainda.


## 27/09/2026 — 🕵️🐊 ENIGMA NA TOCAIA online ✅ NO AR (Diego: "aprovado pode publicar")

Diego: *"quero sim"* (Enigma também na Tocaia). `sorteiaEspeciais` tirou o `!s.holandes`:
agora vale nos rápidos online de futebol nos DOIS pregões. Na mesa da Tocaia a carta vem
com 🕵️ e a dica da época, com o mesmo preço caindo; quando alguém fisga, o nome abre na
hora (o `Holandes` só esconde enquanto a carta não tem dono). Sem tocar na fila do `rng`.
Fotos: `node scripts/mockup-enigma.mjs --tocaia` (mockups/enigma-tocaia-*.png).

## 27/09/2026 — 🌎 Clubes do continente da Liberta marcam com jogador de verdade ✅ NO AR

Print do Diego na final da Liberta (El Mineiro × Boca Xuniors): *"por que os times restantes
da Libertadores não tão com jogadores reais? olha o gol do Boca Xuniors"* — saía "Gol de
Boca Xuniors". Era o mesmo furo que a outra sessão fechou na Champions em 26/09: o clube
convidado só tinha força, sem elenco. `elencoConvidado` (`store.tsx`) agora serve os
convidados da Liberta (900+) e da Champions (1800+): 11 cartas de verdade das SOBRAS do
baralho da sala, na faixa de nível do clube, sem repetir carta entre convidados. Placar não
muda (dado próprio, `rng` do jogo intocado). Sala só de Champions monta os mesmos elencos
de antes. Testado: Boca Xuniors com 11 cartas, River com outras 11, zero repetidas.

## 26/09/2026 — 📰 Jornal da sala: linha fina da "taça dividida" reescrita ✅ NO AR

Diego achou estranho *"dois campeões e uma sala inteira sem saber de quem foi a noite"*.
Agora (PT/EN, `jornal-sala.tsx`): *"Taça dividida na noite. A liga ficou com o X, e a
Libertadores foi pro Y. Cada um com a sua festa."* (na carreira/offline: "na temporada").

## 26/09/2026 — 📣 Giro sem o "R1 · / R2 ·" e letreiro um tiquinho mais rápido ✅ NO AR (Diego: "pode fazer agora")

Diego: *"a parte do giro da copa que começa com R1 R2 não precisa aparecer, fica muita
coisa. Aumenta também só um pouco mais a velocidade, quase nada"*. `GiroDaRodada`
(`screens.tsx`) tira o prefixo só na TELA (a manchete guardada continua com a rodada,
o anti-spoiler lê ela). Velocidade: 0,16 s → 0,145 s por letra, piso 18 s → 16 s.
Pedido às 23h → segurado pela regra do horário de pico; sobe na manhã/tarde.

## 26/09/2026 — 🎬 GOL EM DUAS ETAPAS no placar ao vivo ✅ NO AR (27/09, "Ok publique")

Pedido dele (depois de ver o golzinho no online de 9 s): *"quando for gol, teria que
sair a bolinha e SOMENTE quando entrar no gol que entraria o mascote com grito de gol
e etc. Quem não tem mascote, só o grito. Só vai ser difícil quando tiver sequência
muito rápida de gols"*.

O que mudou (`LiveScoreCard`, `pyramidseason.tsx`): no minuto do gol o placar só
SOLTA A BOLA (`voo`). Ela entra na rede em `GOL_ENTRA_MS` (0,9 s, mesmo tempo do CSS
`ll32-entra` em `chances.ts`) e SÓ AÍ o gol vira "mostrado" — placar sobe, selo GOOOL,
carimbo da mascote, goleador na lista e urro da torcida saem desse mesmo instante, sem
mexer em nenhum deles (a mascote continua igual, só espera a bola). Apito final e
texto de resultado esperam a última bola entrar (`fechado`). Enquanto uma bola de gol
está no ar, chance perdida nenhuma começa.
- 🔁 Sequência rápida: FILA. O 2º gol espera o 1º entrar (0,9 s) e solta a própria
  bola; nunca dois no ar. Em 9 s de rodada, dois gols grudados nos acréscimos ainda
  cabem antes da rodada virar (≈ 8,8 s).
- Só no visual novo (`cinematic`); visual antigo, basquete e jogo já encerrado
  ficam como sempre. ↩️ Voltar = `teatro = false`.
- Fotos/vídeo: `node scripts/foto-golzinho.mjs` (agora com `--rodada 9000` e
  `--so-video`; a foto `33-gol-bola-no-ar` mostra 0×0 com a bola voando e a
  `33-gol-mascote` o 1×0 com o papagaio — a prova da sequência).
## 26/09/2026 — ⭐ Champions: convidado com NOME no mata-mata e gol com JOGADOR DE VERDADE ✅ NO AR

Print do Diego (sala do Futpoint, 19h43): no mata-mata da Só Champions o rival aparecia como
"?" (nome e escudo) e os gols dele saíam "Gol de Neymarzetti" — o nome do CLUBE no lugar do autor.
- **"?"**: o `nameOf` da tela da Copa (e o do último jogo) procurava na liga e na Liberta, mas
  não nos 28 convidados da Champions. Agora procura (`screens.tsx`).
- **Gol sem autor**: convidado só tinha força (atk/def), zero jogador. Diego: *"não quero jogador
  fake"*. Agora `elencoConvidado` (store.tsx) dá a cada convidado 11 cartas DE VERDADE do baralho
  da sala, tiradas das sobras (nunca carta de time da sala, nunca repetida entre convidados), na
  faixa de nível da força dele. Só pra dizer quem fez o gol e o passe: a força continua atk/def e
  o autor sai de dado PRÓPRIO — medido: a tabela inteira das 8 rodadas sai IDÊNTICA antes/depois.
  Numa Só Champions simulada: 122 gols de convidado, todos com autor (Dybala, Gattuso, Camavinga…).

## 26/09/2026 — ⏱️ Rodada ONLINE vai pra 9 s (offline fica em 7 s) ✅ NO AR

Diego, em duas mensagens na mesma noite: *"aumente pra 8s por rodada no online. Tá 7 né,
então aumente pra 8"* e logo depois *"aumente pra 9s pq tá mt rápido na verdade, não tá
dando nem pra ver direito as coisas novas"* (o golzinho com lances).
`ROUND_MS_ONLINE = 9000` em `screens.tsx`, usado na rodada da LIGA (sala rápida e
Minhas Ligas) e na fase de grupos da Liberta (que roda no ritmo da liga). O rápido
OFFLINE segue em 7 s (`ROUND_MS`), a tabela da Champions (ROUND_MS + 4 s = 11 s) e os
jogos de Copa (16–17 s) não mudam. 38 rodadas online ≈ 5,7 min. As chances do golzinho
continuam 1 por lado (`npm run chances`). ↩️ Voltar = trocar o número.

## 26/09/2026 — 👑 MISTURA DA LENDA nos rápidos ✅ NO AR

Diego: *"1 em cada 5 lendas… craque isso aí"* (e o foi profissional ↔ bom jogador fica 1 em 4, como
já estava). `MISTURA_LENDA = 0.2` em `store.tsx` (`buildDeck`, só `mergeSP` = rápido; carreira/escada
e Várzea não mudam). Só troca se tiver craque livre no setor. Medido em 150 levas de sala de 20
(4-3-3), com a bancada `montaBaralhoParaTeste`: lenda 13,7% → 12,1% · craque 35,1% → 36,7% ·
bom e foi profissional iguais. ↩️ Voltar = `MISTURA_LENDA = 0`.


## 26/09/2026 — ⚽🥅 O GOLZINHO COM LANCES no placar ao vivo ✅ NO AR (online e offline)

Pedido do Diego, em três rodadas de mockup: primeiro *"uma animação institucional no
placar dos jogos de 90 min"* → depois *"um golzinho, igual na disputa de pênalti, de um
lado e do outro"* → depois *"vários estilos: por cima, na trave, pra fora, isolou… a
narração no momento certo, a bola entrando só quando é gol, o placar só muda aí. Não
mudaria a dinâmica dos gols, mas teria coisas acontecendo enquanto não sai gol"*.
Aprovado (*"adorei"*) com dois ajustes: a bola PARA DENTRO da rede e balança junto; o
isolou sai rasteiro, sobe e passa por cima do gol. 🚫 A 3D de CSS ele não gostou.

### O que entrou
- **`src/escalacao/chances.ts`** (módulo puro): decide QUANDO acontece uma chance
  perdida, de quem e como termina (🧤 defendeu · 🥅 trave · 💨 fora · 🚀 isolou), e o
  texto dela em PT/EN (6 frases por final, falando do CLUBE — nunca inventa jogador).
  Semente = rodada + os dois clubes → a sala inteira vê a mesma chance no mesmo minuto.
  Quantas cabem é o `roundMs` que diz: online/Minhas Ligas (7 s) = **1 por lado**;
  carreira (11 s) = 2; rodada lenta (30 s+) = até 4; rodada instantânea = nenhuma. Chance nunca cai a menos de 3' de um gol nem no
  intervalo (43'–47'); sempre entre 4' e 88'.
- **`OnlineScorePresentation`** (`online-match-visual.tsx` + CSS `ll32-`): a faixa do
  palco dos pênaltis embaixo do placar — 🥅 de cada lado, pista com a cor de cada time,
  bola no meio. A casa ataca a DIREITA. No gol a bola entra na rede de quem tomou e
  balança junto; nas chances, o final (luva, poste, lado, por cima). O veredito pula na
  faixa igual aos pênaltis. Só nos placares `cinematic` (online/rápido e carreira
  grande); basquete fora.
- **`LiveScoreCard`** (`pyramidseason.tsx`): detecta a chance cujo minuto acabou de
  passar (janela de 4', pra quem abre a tela no 70' não ver a do 12' atrasada), mostra
  por `CHANCE_MS` (1,9 s) e troca a NARRAÇÃO pelo texto dela — que ganha do apito
  inicial/intervalo enquanto está na tela. Gol continua exatamente como era (mesmo
  timer, mesmo selo); só ganhou a bola entrando.
- 🎭 **A MASCOTE NÃO MUDOU** (pergunta dele: *"não vai interferir nos mascotes?"*): a
  cena do gol (carimbo + GOOOL + raios) está intocada; a bola entra na rede embaixo
  dela. Conferido com o Al Takhadao FC marcando: papagaio na tela + bola na rede.

**Travas**: `npm run chances` (determinismo, longe dos gols, contagem por ritmo, sem
cobrança de pênalti, PT+EN, cita o clube) · `telas` · `penaltis` · `build` verdes.
**Foto/vídeo do componente REAL**: `node scripts/foto-golzinho.mjs` (monta o
`LiveScoreCard` sozinho via vite, congela o relógio nos minutos das chances).
Mockups no repo: `mockup-golzinho.mjs` · `mockup-golzinho-3d.mjs` (recusado) ·
`mockup-golzinho-lances.mjs` (o aprovado).

↩️ **Reverter**: `palcoOn={!basket}` → `false` tira a faixa; o resto do placar é o
de antes. As chances vivem só na tela (nada no save, nada na simulação).

## 26/09/2026 — 🏟️ O Giro vira LETREIRO DE ESTÁDIO + 🎤 manchetes sobre a GALERA da sala ⏳ ESPERANDO OK PRA PUBLICAR

Pedido do Diego: *"uma mudança visual melhor no giro da copa, com alguma animação…
qual sua melhor ideia?"* → mockup do letreiro de LED aprovado (*"Aprovo"*), com um
pedido junto: *"nos modos rápido online e minhas ligas você poderia pôr mais textos
em relação aos usuários que estão jogando"*.

### 🏟️ O letreiro (`GiroDaRodada`, screens.tsx)
A caixinha bege que trocava de frase a cada 3s virou a faixa de LED que corre em
volta do gramado: fundo preto com matriz de pontinhos, letra Oswald âmbar com
brilho, manchetes CORRENDO da direita pra esquerda com ◆ entre elas.
· A cor da luz conta a história: 🎯 pênalti/prorrogação = vermelho · 👑 campeão =
  dourado · resto = âmbar. Sem confete, sem faixa (regra de 19/09).
· 0 KB (radial-gradient + keyframes). Anti-spoiler intacto (recebe a MESMA lista
  segurada até o apito). Com "reduzir movimento" ligado, mostra uma frase parada
  por vez, com o fade de antes.
· Mockup: `node scripts/mockup-giro-letreiro.mjs` · foto/vídeo do componente REAL
  montado sozinho via vite: `node scripts/foto-giro-letreiro.mjs`.

### 🎤 As manchetes da galera (`src/escalacao/giro-galera.ts`, módulo puro)
Só no ONLINE (sala rápida e Minhas Ligas). Sai do que ACONTECEU — nada inventado:
· 🥊 **Clássico da sala** (humano × humano) com placar, vencedor e um fecho de
  zoeira sorteado (*"leva a rodada no papo"*, *"vai ficar de castigo no grupo"*,
  *"já pediu revanche no privado"*…) + o retrospecto entre os dois quando existe.
· 🤝 empate entre humanos · 😴 0×0 entre humanos.
· 🤡 humano tomou 3+ de BOT · 🧨 humano goleou bot por 4+ · 🤖 perdeu apertado pra bot.
· 🎩 o melhor técnico da sala MUDOU (só com tabela e posição de antes) ·
  🐌 o pior da sala perdeu de novo (3+ humanos).
Onde entra: rodada da liga (`narrateRound`, na frente das neutras, corte sobe pra 5),
rodada da **tabela da Champions** (que até hoje não gerava manchete NENHUMA — o
giro ficava mudo 8 rodadas), rodada de grupo da Liberta e cada perna do mata-mata.
· 🎲 a frase é presa na semente: mesma rodada, mesma frase no host e nos convidados.
· 🌐 PT guardado, EN por `traduzGalera` (mora no mesmo arquivo do texto).
· 🙈 toda manchete abre com um emoji fixo (`GALERA_ABERTURAS`) e o anti-spoiler da
  copa segura essas também (o "clássico da sala 2 × 1" entrega placar igual).

**Travas**: `npm run galera` (18 conferências: vencedor certo, bot×bot nunca, semente,
teto, não inventa sem tabela, toda frase tem inglês e abertura) · `telas` ·
`champions` verdes.

⏳ **Não publiquei**: vai junto com o campinho da Champions e os 3 consertos do giro/
jornal, todos no branch, esperando o "pode subir" (sala dele pode estar rolando).

## 26/09/2026 — ⭐ Champions: nota do campeão sem pé nem cabeça, giro chamando de Libertadores, e o anti-spoiler cego ⏳ ESPERANDO OK PRA PUBLICAR

Dois prints do Diego, numa sala de Só Champions. Consertos:

**1️⃣ A nota do campeão não casava com a posição** (`jornal-sala.tsx`). O Futpoint foi
campeão sendo **5º** e o jornal escreveu *"terminou a tabela em 5º e **não soltou
mais**"*. Palavras dele: *"ficou estranho"*. E está: "não soltou mais" é frase de
quem LIDEROU. Agora são três notas, cada uma dizendo a verdade do caminho:
· **1º** → "terminou a tabela de 36 em 1º e confirmou na chave"
· **2º–8º** → "fez Nº na tabela, foi direto pras oitavas e não parou mais"
· **9º+** → a do REPESCÃO, que já existia.

**2️⃣ O giro dizia "avançou na LIBERTADORES" numa sala de CHAMPIONS** (`store.tsx`).
O `copaWord` já sabia qual competição era (Copa · Liberta · Champions), mas a linha
do "avançou" só tinha DOIS caminhos — Copa, ou *senão é Liberta* — então a Champions
caía no nome errado. Agora lê o mesmo `copaWord` do resto. O inglês (`screens.tsx`)
ganhou a Champions no padrão da frase, que também não casava.

**3️⃣ 🚫 E O ANTI-SPOILER ESTAVA CEGO PRA CHAMPIONS E LIBERTA** (achado no caminho,
não foi relatado). O filtro que segura as manchetes enquanto a perna ANIMA só
conhecia a palavra "Copa" — "⚽ Champions QUARTAS…" e "avançou na Champions" passavam
direto e podiam entregar quem passou antes do apito. A rede principal (o `giroNews`
segurado) continua valendo; esta é a segunda, e agora cobre as quatro competições
(Copa · Champions · Liberta · Playoffs).

Verdes: `build`, `champions`, `campinho`, `telas`, `jornal`.
⏳ **Não publiquei** — sala dele rolando (regra de 25/09). Vai junto com o conserto do
campinho, que está no mesmo branch.

## 26/09/2026 — ⚽🅰️ Campinho pelado na Champions (gols/assistências não apareciam) ⏳ ESPERANDO OK PRA PUBLICAR

Print do Diego, sala de Champions ao vivo: *"nos jogos rápidos / minhas ligas
online não tá aparecendo gols e assistência dos jogadores no campinho no modo
Champions"*.

**A causa**: o campinho (`Campinho`, em `screens.tsx`) lia SÓ `state.scorers` — a
artilharia da LIGA. Na **"⭐ Só Champions" não existe liga**, então a lista está
vazia e todo boneco aparece pelado. Os gols da Champions moram em
`champions.scorers`, os da Liberta em `liberta.scorers` e os do mata-mata em
`quickCopa.scorers`.

**O conserto** (`golsNoJogo` / `assistsNoJogo`, em `store.tsx`): a conta saiu da
tela e virou função do store, que sabe olhar TODAS as listas.
⚠️ **E não é "somar tudo"**: na Champions e na Liberta o `quickCopa` NASCE com a
lista da fase de tabela/grupos dentro dela (é cumulativa), então somar as duas
contaria cada gol DUAS VEZES. Já na liga + Copa dos 8 as listas são separadas e aí
sim somam. A régua é: **liga sempre, mais UMA das outras**.

**Trava**: `npm run campinho` — mede os 5 casos (só Champions · Champions no
mata-mata · Liberta · liga+Copa · liga sozinha), mais "quem não marcou fica
zerado" e "gol de xará em outro time não vaza".

⏳ **NÃO publiquei**: ele estava com sala de Champions rolando, e publicar derruba
quem está com o jogo aberto (regra de 25/09 — *"me fale antes de fazer"*). Está no
branch, buildado e testado, esperando o OK.
## 26/09/2026 — 🧱 LOTE 35: 83 cartas novas (pro Leilão de Setores) ✅ NO AR (19h, com o OK dele: "pode publicar já")

Diego: *"pode fazer todos eles, botando ano certo, clube certo, baralho certo, nível certo e
categoria certa"*. Em `data.ts` (`L35_EU_*` e `L35_WORLD_*`).
- **Baralho = o do PAÍS DO CLUBE**: clube europeu → Europa; Boca, River e Cruz Azul → Mundo. ⚠️ Eu
  tinha posto Parma e Espanyol no Mundo porque as cartas ANTIGAS deles (Mboma, Coly, N'Kono) estão
  lá — ele cortou: *"Parma é da Itália"*. Não seguir a maioria das cartas velhas do clube.
- Conferido carta por carta: o mesmo jogador não fica duas vezes no mesmo baralho (por isso
  Thuram, Zola e Stoichkov do Parma saíram — os três já estão no Europa; entraram Benarrivo,
  Enrico Chiesa e Tomas Brolin).
- Categoria = a do jogador NAQUELE clube e ano (ele corrigiu: lenda em outra carta não impede).
  3 lendas (Maradona Boca 81, Passarella River 78, Neeskens Ajax 72) · 14 craques (Shilton desceu
  de lenda: *"não vejo fama"*) · 9 promessas · 59 bons jogadores.
- País carta a carta em `paises.ts` + nomes em `MESMO_JOGADOR`; `npm run paises` verde. Home: as
  lendas de hoje ficam na frente das entradas (gerador guarda 60 linhas; juntei na mão) + 1 linha
  em `novidades.ts`. Posts de stories (2 partes) com `mockup-cartas-novas.mjs --setores`.
- **Enxugado pra 68 (26/09)**: ele pediu a lista dos mais desconhecidos e mandou tirar 17
  (Begović, Boruc, Goram, Javi Navarro, Pellegrino, Humberto Coelho, Albrighton, Mista, Lee Dixon,
  Olaf Thon, Bernd Schneider, Chalana, Albelda, Kießling, Waddle, Brolin, Benarrivo). Alguns
  clubes perderam o pacote de setor por isso — fica anotado, não é problema pra agora.
- **+24 famosos (Luis Díaz, Liverpool 2023, entrou depois) que não estavam em NENHUM baralho (26/09, aprovados por ele)**: Mijatović,
  Savićević, Valdano, Boniek, Futre, Blokhin (lenda, Bola de Ouro 75), Belanov, Dasayev, Rüştü,
  Rosický, Koller, Kewell, Darwin Núñez, Vlahović, Milinković-Savić, Pjanić, Bentancur, Taremi,
  Raúl Jiménez, Aboutrika (Mundo), Stanković, Muntari, Kuffour. Dínamo Kyiv, Spartak e Fenerbahçe
  no baralho Europa (clube europeu). Mijatović e Savićević com país Montenegro.
- **−10 (26/09, pedido dele)**: saíram Boniek, Futre, Belanov, Kewell, Blokhin, Raúl Jiménez,
  Valdano, Kirsten, Maddison e Diego López. Ficaram 82. (Com o Blokhin fora, a leva tem 3 lendas.)
- **+ José Altafini** (Milan 1963, craque) — era ESSE o "João Afatini"; o Albertini (que eu tinha entendido) saiu.

## 26/09/2026 — 🧱 LEILÃO DE SETORES (ideia do Diego) — EM CONVERSA, nada construído

Modo novo: o lote é o SETOR de um clube ("Goleiros do Palmeiras"); depois do leilão, convocação
igual à da Copa do Mundo, na formação da sala. Decidido até aqui (mockups no chat):
- sem dica de nível (nomes iguais, ordem alfabética, sem dourado/coroa);
- cerimônia do martelo no padrão de hoje, com ESCUDO do clube — escudo PARÓDIA (oficial é marca
  registrada); ele ainda não escolheu entre estilo A (clássico) e B (mascote);
- monte em PACOTES (os que ninguém comprou); não convocados vão direto pros bots;
- ele quer UM CLUBE SÓ POR PARTIDA e variação entre partidas (memória de onde o clube saiu).
⚠️ Esbarra no baralho: com clube único por partida cabem ~10 pessoas (medido: pacotes "com escolha"
= GOL≥2 · LAT≥3 · ZAG≥3 · MEI≥4 · ATA≥4). Lote 1 proposto (84 cartas conferidas, nenhuma repetindo
jogador no mesmo baralho) leva pra ~12. Pra 20 precisa de ~110 clubes diferentes — muito mais carta.
Esperando ele aprovar o Lote 1.

## 26/09/2026 — 🕵️ JOGADOR ENIGMA LIGADO ✅ NO AR

Diego viu as fotos (`npm run enigma`) e deu *"ok"* pra dica da ÉPOCA e o nome "Enigma".
`ENIGMA_LIGADO = true`, mas ele só vale nos **rápidos online de futebol no pregão às cegas**
(`sorteiaEspeciais`: online · não carreira · não basquete · não Tocaia). Carreira, partida contra
bots, Tocaia e basquete ficam sem até ele pedir. `npm run enigma-trava` verde e `npm run ascegas`
com as MESMAS digitais de antes (90a1c57e · 3faeb4a1 · a54c75f5): o pregão não muda.
Junto: 3 linhas novas em `novidades.ts` (Enigma, jornal novo, Copa do Mundo antes do jornal) e a
linha da mascote corrigida de 30s pra 5s.
↩️ Desligar = `ENIGMA_LIGADO = false`.

## 26/09/2026 — 👑 Ballack (Bayern 2002) VOLTA a lenda · Dunga (Internacional 1984) vira LENDA ✅ NO AR

Diego: *"pode manter Ballack de lenda e coloque Dunga também"*. Os dois só têm UMA carta cada
(regra da lenda = carta do melhor clube; aqui não tem escolha). `fame: 5`, home avisada pelo
`npm run novidades`, `npm run paises` verde.

## 26/09/2026 — 👟 Reserva batia pênalti (a lista saía do elenco inteiro) ✅ NO AR

Print do Diego, tela de pênalti aos 90+2': *"Zico e Garrincha estavam no banco de
reserva e mesmo assim apareceram pra bater pênalti. Tá errado"*.

**A causa, de uma linha**: `takers` saía de `mgr.squad` — o elenco INTEIRO (22
cartas) ordenado por nível. Como a lista mostra os 8 melhores, os craques do banco
apareciam sempre na frente de quem estava jogando. É o comportamento fora das
regras que ele não aceita: **jogador em campo sem ter sido escalado**.

**O conserto** (`cobradoresDoJogo`, em `pyramidseason.tsx`): a lista é de quem está
EM CAMPO aos 90+2', nesta ordem de régua —
1. quem foi escalado, **contando a troca do INTERVALO** (`careerHalftime.xi2` é
   quem termina o jogo; sem troca, o XI da rodada);
2. sem o **suspenso/lesionado**;
3. sem o **goleiro** (ele está no outro gol);
4. sem carta de mentira.
🛟 E **nunca volta vazia**: sem escalação cai no elenco, como era antes — pênalti
sem ninguém pra bater seria pior que a lista errada. O escolhido também cai no
primeiro da lista se sumir dela (senão o BATER ficaria mudo).

**Trava**: `npm run cobrador` — monta elenco de 22, escala 11 e exige: ninguém do
banco, sem goleiro, ordem por nível, quem entrou no intervalo aparece, quem saiu
some, suspenso fora, e lista nunca vazia. `penaltis` e `telas` verdes junto.

↩️ **Reverter**: a função está isolada; voltar ao elenco inteiro é uma linha.

## 26/09/2026 — 📰 Jornal: capa dos TÍTULOS GRANDES + artilheiros de cada competição ✅ NO AR

Mockup aprovado pelo Diego (*"sim"*). Na capa (`CareerNewspaperStories`): toda temporada a foto
grande é o campeão da **Série A**, com Copa do Brasil (ou Copa Legends) e Supercopa embaixo; no
ano de Copa do Mundo a foto grande é a **seleção campeã** (foto NEUTRA de silhuetas + bandeira,
não existe arte própria — se ele quiser, gerar uma) e Série A/Copa/Supercopa descem. O quadrinho
do artilheiro da série do jogador saiu da capa.
Página da Bola de Ouro: ela continua o destaque e as duas listas (gols × assistências) ficam; o
jornal só CRESCE com a caixa "⚽ Os artilheiros do ano" — Série A, Copa, Supercopa e Copa do
Mundo (quando tem). Competição nova = uma linha em `artilheirosDoAno` (pyramidseason.tsx).

## 26/09/2026 — 🌍 Copa do Mundo ANTES do jornal + gols dela contam em tudo ✅ NO AR

Diego: *"tem que contar todos os gols dele ali no jogo… contando também a Copa do Mundo… e
também deve contar pra Bola de Ouro"* e depois *"a copa do mundo deveria ser jogada antes então
de chegar o passo 1 do jornal"*.
- **Ordem do roteiro**: nos anos de Copa com o SEU clube nela (TOP 24, temporada 100, 110…), o
  roteiro fica 🌍 Mundo → 📰 Jornal → 💰 Caixa → 🔨 Próxima, e o CONTINUAR da Copa fica travado
  (cinza, com o porquê) até ela ser jogada. Ano sem Copa: igual sempre. Só solo.
- **Números**: a Copa grava o que cada CARTA fez (`copaMundoStats`, ação `COPA_MUNDO_STATS`,
  `estatisticasDaCopa` em copa-mundo.tsx). Entram na ficha (temporada e "no seu clube"), na
  Bola de Ouro, no top 5 do jornal e na artilharia/garçons de todos os tempos. Bola de Ouro,
  histórico da temporada e comissão da Agência ESPERAM a Copa acabar (`mundoPendente`).
- **Jogos**: os jogos de copa (Copa do Brasil/Legends + Supercopa, com o XI congelado da 38) e
  da Copa do Mundo agora somam no 🏃 jogos da tela e no acumulado da virada (`jogosCard`). Só
  contam com a Copa encerrada na tela (sem spoiler). Os eventos de jogador no meio da temporada
  continuam lendo só a liga.
- Copa do Brasil/Supercopa na ficha já tinham sido consertadas em 25/09 (temporada fechada
  antes disso ficou sem).
- Trava nova: `npm run copamundo`. `npm run fim` e `npm run artilharia` atualizadas.
- ⚠️ Fica de fora: carreira ONLINE (a Copa do Mundo online é outra tela e o roteiro lá é votação).

## 26/09/2026 — ✏️ "Marcelo Vieira" (Real Madrid 2017) vira só "Marcelo" ✅ NO AR

Pedido do Diego. Continua lenda, no baralho Europa. Junto: rosto mantido (alias em
`legend-avatars.ts`), `MESMO_JOGADOR` ganhou 'Marcelo' (é o mesmo lateral do Fluminense 2006,
carta promessa do baralho Brasil), país Brasil, e a foto do catálogo renomeada pra home não
anunciar "entrou/saiu". Save antigo com "Marcelo Vieira" fica como está (bio e rosto antigos
seguem valendo pro nome velho).
💡 Ele perguntou por que quase não vê o Marcelo e vê Júnior e Carlos Alberto toda hora:
Marcelo é do baralho EUROPA; os dois são do baralho BRASIL, onde lateral tem só 7 lendas e o
leilão de 20 usa as 7 — por isso aparecem SEMPRE (ver o achado do baralho acima).

## 26/09/2026 — 👑 Dembélé (PSG 2024) vira LENDA · 🃏 Higuita e Chilavert viram FOLCLÓRICOS ✅ NO AR

Pedidos do Diego. Bio do Dembélé agora diz campeão do mundo (França 2018) e Bola de Ouro.
Higuita e Chilavert ganharam `folk: true` (selo 🃏 FOLCLÓRICO, continuam lenda). Vozinha já era
folclórico. `sincronizaNiveis` leva `folk` e `bio` pros saves sozinho.

## 26/09/2026 — ↩️ Maicon (Inter 2010) VOLTA a craque ✅ NO AR

Diego: *"Maicon não bote lenda também não"*. Ele tinha virado lenda numa sessão de 23/09.
Voltou a `fame: 4`; pra home não anunciar "caiu de categoria", a foto do catálogo ganhou o
f:4 dele e a linha antiga "Maicon virou lenda" saiu do arquivo gerado (conferido depois com
`npm run novidades`: 0 mudança).

## 26/09/2026 — ↩️ Ballack e Júlio César VOLTAM a craque ✅ NO AR

Diego: *"não coloque mais Ballack e Júlio César como lendas"*. Os dois voltaram a `fame: 4`.
O aviso da home foi regerado a partir da foto de ANTES das promoções de hoje, então eles
simplesmente somem da lista (nada de "caiu de categoria"): ficam 13 promoções + a troca do
Riquelme.

## 26/09/2026 — 👑 Laudrup (Barcelona 1992) e Chilavert (Vélez 1998) viram LENDA ✅ NO AR

Pedido do Diego. Papin (Marseille 1991), que ele pediu junto, já era lenda.

## 26/09/2026 — 👑 Busquets (Barcelona 2015) vira LENDA ✅ NO AR

Pedido do Diego. Carta única dele no jogo (Barcelona, o clube da carreira).

## 26/09/2026 — 👑 Cantona (Man United 1996) vira LENDA ✅ NO AR

Pedido do Diego. Raúl (Real Madrid 2001) e Hugo Sánchez (Real Madrid 1990), que ele perguntou
junto, **já eram lenda** e já estão no jogo (a 1ª busca minha errou por causa dos acentos).
Riquelme do Boca fica no baralho Mundo (decisão dele: *"não deixa de ser da parte mundo"*).

## 26/09/2026 — 👑 Riquelme troca de carta: sai Villarreal 2005, entra BOCA JUNIORS 2007 (lenda) ✅ NO AR

Pedido do Diego. A carta nova mora no baralho **Resto do Mundo** (é onde estão os clubes
argentinos), então ela aparece no "Mundo" e no "Todos juntos" — **não mais no Europa**. Mesma
faixa de nível (84-90). Bio atualizada (ídolo do Boca, Libertadores 2007). `npm run novidades`
(1 entrou · 1 saiu) e `npm run paises` verdes. Save antigo com a carta do Villarreal fica com
ela (carta é cópia congelada no save).

## 26/09/2026 — 👑 Júlio César (Inter 2010) vira LENDA ✅ NO AR

Pedido do Diego (goleiro). Só a carta da Inter 2010 (melhor clube), a do Flamengo 2003 fica
craque. O Maicon da Inter 2010, que ele pediu junto, **já era lenda** (desde a promoção antiga).

## 26/09/2026 — 👑 13 cartas viram LENDA ✅ NO AR

Pedido do Diego: Marta, Seedorf, Riquelme, Di María, Hierro, Thomas Müller, Klose, Lúcio,
Schweinsteiger, Fernando Redondo e Ballack. Mesmo jeito do Maicon/Bergkamp: só `fame` 4 → 5,
faixa de nível (lo/hi) igual. **11 cartas.** 🔁 Primeiro subi as DUAS cartas de quem tem duas e ele
corrigiu: *"óbvio que é só uma, e no melhor clube da carreira deles"* → ficou lenda só o
**Seedorf do Milan 2003** e o **Lúcio da Inter 2010**; Botafogo 2013 e Internacional 2000 voltaram
a craque (o aviso da home foi regerado do zero, sem anunciar "caiu de categoria").
📏 **Regra pra próxima vez: promoção a lenda é UMA carta, a do melhor clube da carreira.**
`npm run novidades` escreveu as 13 na home; `sincronizaNiveis` atualiza todo save sozinho.

## 26/09/2026 — 🎲 Baralho: 1 em cada 4 "foi profissional" vira "bom jogador" (TESTE) · 🕗 PRONTO NO RAMO

Diego acha que o baralho repete demais. Ele quis testar uma mistura LEVE só no fundo do
baralho (*"pode fazer isso com o foi profissional pra testarmos, porque o lenda todo mundo já
quer"*). `MISTURA_FOI_PRO = 0.25` em `buildDeck` (store.tsx), só no rápido (online e
offline); carreira (escada) e Várzea intactas. Medido em 60 leilões de 20 pessoas:
foi profissional **29% → ~20%**, bom jogador **~17% → ~25%**; lenda (16%) e craque (38%)
iguais; zero fake.
📌 Achado pra resolver a repetição de verdade (explicado pro Diego, sem decisão ainda):
(1) no baralho Brasil, lateral e zagueiro têm tão poucas lendas (7 e 6) que o leilão de 20
usa TODAS, toda vez; (2) a memória do rodízio (`RECENT_DECK`, últimas 3 levas) vive só na
página aberta do DONO da sala — recarregou ou trocou de dono, ela zera.

## 26/09/2026 — 🐊 Mascote da sala de espera: 5 s (relógio próprio) · 🕗 PRONTO NO RAMO

Diego: *"coloque pra 5s o tempo do mascote na sala de espera que tava 30s"*. O bicho ganhou
relógio PRÓPRIO de 5 s (`MASC_COOLDOWN_S`, lobby.tsx); os áudios continuam com os 30 s deles
(antes os dois dividiam o mesmo relógio).

## 25/09/2026 — ⭐🐺 Batismo CRUZEIRO DE BERRETINHO (weslleygomes749) — banco ✅ · código 🕗 SOBE DE MANHÃ

Série D, no assento do bot **Metrópole FC** (`OLD_NAME` leva save antigo pro nome novo).
E-mail achado pelo nome que ele usava ("Cruzeiro do Berretinho", sala 9LSKXI) e confirmado
pelo Diego. Conta existe desde 04/09. Coração: **Cruzeiro**. Mascote **O Lobo Rei**
(`cruzeiro_lobo_rei`). Manto medido na camisa: **#0130AD / #F2F9FF**. Arte: escudo 347×360
29,1 KB · mascote 392×440 42,8 KB (limpei o verde-água das caudas dos lobos, a grama sob a
chuteira e a sombra da camisa). Escudo/carimbo valem pras 4 formas com "de", as 4 com "do"
(como ele escrevia) e o nome velho.
- **Banco — FEITO 25/09 à noite** (`docs/sql/batismo-cruzeiro-berretinho.sql`): sócio nº60 ·
  fundador nº79 · 6 nomes reservados (de/do + FC/EC) · `user_colors` ouro + manual.
- **Código — no ramo, esperando a manhã** (regra do horário de pico): escudos, mascotes,
  apoio (ouro + FUNDADOR_N 79), manto, batismos, salão (camisa `-v1`), data.ts, checa-batismos.
  build + batismos + piramide + mimos + salao verdes.
- Post: "Batizado por **Berretinho**" e **sem dizer a Série** (pedido do Diego: *"não coloque Série D não"*) — `mockup-batismo.mjs` ganhou a opção `--sem-serie`.

## 25/09/2026 — 📮 Sala de Champions de volta a 36, com conserto SÓ na Champions ✅ NO AR

Diego: *"não quero mexer nos outros modos… estamos falando da Champions, só a alternativa"*.
Só quando `copaMode === 'champions'` (flag `hostInbox`, ligada pelo host no START_ONLINE):
1. **Caixa de entrada do dono**: o convidado manda o recado por `httpSend` pro canal
   `escalacao-in:<sala>`, que SÓ o host escuta — uma entrega por lance em vez de uma por
   pessoa. Qualquer falha (404/401/rede) cai no rádio de sempre; o lance do envelope ainda
   tem a estrada do banco (`room_acoes`). Host de versão velha não liga a flag → convidado
   segue no caminho antigo.
2. **O dono junta os envios de estado**: no máximo 1 a cada 400 ms (`CHAMPIONS_ENVIO_MS`),
   sempre o mais novo.
Conta (limite medido ≈ 500 msg/s — sala de 20 fazia ~250/s e ia bem; a de 27 fazia ~470/s e
travou): sala de 36 com o conserto ≈ 100/s. `MAX_PLAYERS_CHAMPIONS = 36` de novo.
⚠️ **Não deu pra testar ao vivo daqui** (o ambiente não alcança o servidor). O endereço do
envio foi conferido no código da biblioteca. Se uma sala de Champions travar de novo:
baixar `MAX_PLAYERS_CHAMPIONS` pra 20 e desligar a flag (`s.hostInbox = false`).

## 25/09/2026 — 🚨 Sala da Champions voltou pro limite de 20 pessoas ✅ NO AR

Sala **9LSKXI** (27 pessoas, host Fridão) travou no "ENVIANDO… confirmando com o host".
Banco: o host chegou a receber 21 envelopes e parou de gravar às 16h14. Causa: o host
**reenvia o estado INTEIRO pra cada pessoa a cada ação** (`channelRef.send('state')` no
efeito de `[state]`, store.tsx). Com 27 pessoas cada lance vira 26 entregas; no fim do
envelope, quando todo mundo lacra junto, passa do limite de mensagens/segundo do
Realtime e as mensagens se perdem. O pacote em si é pequeno (33 KB comprimido com 36).
Conserto de emergência: `MAX_PLAYERS_CHAMPIONS = 20` (e salas em espera com 36 no banco
baixadas pra 20). A tabela de 36 continua cheia com clubes de batismo.
📌 **Pra voltar a 36**: enxugar o reenvio do host — juntar as ações que chegam no mesmo
instante e mandar UM estado a cada ~300-500 ms (ou mandar só o "lacrou" em vez do estado
inteiro durante o envelope). Mexe em TODA sala online → fazer com calma, de dia, testado.
⚠️ E vale conferir o plano do Supabase: o limite de mensagens é por PROJETO, então sala
pesada pode atrapalhar as outras salas ao mesmo tempo.

## 25/09/2026 — 🟢 CHAMPIONS LIBERADA PRA TODOS ✅ NO AR

Diego: *"já tá funcionando o online, pode liberar"*. `CHAMPIONS_GERAL = true` (`sport.ts`).
A "⭐ Só Champions" aparece destravada na partida rápida, nas salas online e no Minhas
Ligas (selo "novo" por uns dias no online no lugar do "em breve"). Novidade na home (PT/EN).
CLAUDE.md atualizado (a regra "não liberar" virou histórico).

## 25/09/2026 — ⭐ Só Champions no ONLINE (salas rápidas + Minhas Ligas) + jornal da Champions ✅ NO AR (só na conta do Diego)

Diego: *"ok agora faça no modo online! Vamos fazer!! Além disso quando acaba tem jornal,
né? Porque no partida rápida não teve"*.
- **Jornal O MARTELO · edição Champions** (`montaEdicaoChampions` em `jornal-sala.tsx`):
  manchete "X É O CAMPEÃO DA CHAMPIONS", destaque principal = campeão da Champions,
  posição = a da tabela de 36, nota de cada um pela campanha (tabela → repescão →
  mata-mata; lanterna da tabela; "a uma posição do repescão"). Mesmo desenho do jornal
  de sempre — só troca "liga" por "Champions/tabela". Vale offline e online.
- **Online**: no seletor "depois da liga" da criação de sala, **"⭐ Liga + Champions" virou
  "⭐ Só Champions"** (igual ao rápido offline). O mesmo seletor serve sala rápida e
  Minhas Ligas. Continua travado com EM BREVE fora de `CHAMPIONS_TESTERS`. O motor
  (`abreChampionsDiretoSePrecisa`) agora roda no online **só no host**.
- **Sala de até 36 técnicos** quando é Só Champions (`MAX_PLAYERS_CHAMPIONS`, sem duplas —
  dupla segue em 20 times). Testado no motor: 36 pessoas → 36 na tabela, 0 fake, todo
  mundo com 11; 5 pessoas → 5 + 31 de batismo/liga. Lista de salas mostra "⭐ só champions".
- **Histórico/Salão da liga**: na Só Champions a temporada grava o CAMPEÃO DA CHAMPIONS no
  lugar do campeão da liga (antes gravaria o 1º de uma liga que nunca rolou, com 0 pts),
  posição da tabela de 36, artilheiro da Champions e lanterna da tabela.
📌 A conferir com a sala de verdade: peso da sala com 36 (lembrar do Tocaia, 24/09) e se
o Salão da liga deve chamar esse título de "Champions" em vez de "Liga" (hoje entra como
o título da temporada). Salas "Liga + Champions" que já existiam seguem funcionando.

## 25/09/2026 — 🥊 Repescão da Champions no MOTOR DA COPA (relógio, pênaltis, cobrança) ✅ NO AR

Print do Diego no repescão: placar parado, sem o relógio de 1' em diante. *"não teve
simulação rolando padrão… podendo também aparecer pênaltis… normal a simulação dos
mata-matas"*. Agora o repescão é a fase **'repescao' do `quickCopa`** (`CopaFase` ganhou
o valor): nasce no fim da 8ª rodada (`playChampionsRodada`), a tela da Champions mostra o
banner do fim da tabela (6s) e o `START_COPA` leva pra tela da Copa, onde roda IGUAL ao
mata-mata (relógio, gols, pênaltis, cartaz de fase). No fim, `PLAY_COPA_LEG` monta as
oitavas com o top 8 × os 8 que passaram (mesmo cruzamento de antes) e vira
`champions.fase = 'mata'`. O A de cada confronto é o PIOR colocado (a ida é na casa do A;
a volta, na do melhor, como na Champions de verdade). Na tela da Copa, quem está no top 8
lê "✅ você já está nas oitavas, aguardando"; quem ficou fora lê "❌ não se classificou".
Save antigo parado no portão ganha o repescão novo no `START_COPA`; com perna já jogada no
jeito antigo, segue o jeito antigo (`playChampionsRepescao` ficou só pra isso).

## 25/09/2026 — ⏱️ Champions: fase de tabela agora ~11s por rodada ✅ NO AR

Diego: *"aumente mais 2s por jogo no modo Champions na primeira fase de pontos corridos"*.
`CHAMPIONS_EXTRA_MS` 2000 → **4000** (rodada da liga 7s + 4s = **11s**). Repescão e
mata-mata seguem no tempo de Copa (~17s). Só Champions ≈ **4 min 40 s** no automático.

## 25/09/2026 — 📏 Champions: "8 jogos · 8 adversários diferentes · formato oficial" no topo ✅ NO AR

Linha miúda embaixo do "⭐ CHAMPIONS · RODADA x/8" (no repescão: "ida e volta · 8 vagas
nas oitavas"). Aprovado pelo Diego (*"perfeito, publique"*).
📌 **PRÓXIMO PASSO COMBINADO**: ele vai testar a Só Champions na partida rápida e, se der
certo, levar **tudo pro ONLINE — salas rápidas e Minhas Ligas**. Junto entra a ideia da
sala de até 36 pessoas (ver abaixo). Não começar sem ele mandar.

## 25/09/2026 — ⏱️ Rodada da liga cravada em 7s + repescão da Champions no tempo de Copa ✅ NO AR

Diego: *"repescão pode manter igual mata-mata também. E liga normal que tava 6,7s aumente
pra 7s"*.
- `ROUND_MS = 7000` (`screens.tsx`) — rodada da liga no rápido/online (e a fase de grupos
  da Liberta, que usa o mesmo número). Basquete segue na conta antiga. Trava
  `npm run ritmo` atualizada pro número novo.
- Champions: fase de tabela = liga + 2s (**9s**); **repescão e mata-mata = jogo de Copa
  (~17s no auto)**. A régua em `EscChampions` é o JOGO na tela (`jogoDeCopa`), porque a 8ª
  rodada anima com a fase já no repescão e a volta anima com a fase já em 'mata'.

## 25/09/2026 — ⏱️ Champions +2s por jogo SÓ na fase de tabela (e repescão) ✅ NO AR (só na conta do Diego)

🔁 Corrigido na mesma tarde: *"copa não aumente, digo só na liga mesmo"*. O mata-mata
da Champions voltou pro tempo da Copa dos 8 (~17s no auto). Tabela e repescão seguem
com ~8,7s por rodada. Só Champions ≈ **3 min 50 s** no automático.

### (versão anterior, desfeita) Champions +2s por jogo (tabela, repescão e mata-mata)

Diego achou a Só Champions rápida demais (~3,5 min contra ~6 min da Liga + Copa dos 8)
e pediu *"mais 2 segundos por jogo da champions, seja liga e copa, pra ver como
ficaria"*. `CHAMPIONS_EXTRA_MS = 2000` (`screens.tsx`): rodada da tabela/repescão
~6,7s → ~8,7s; jogo do mata-mata ~17s → ~19s (vale nos dois modos com Champions).
Só Champions agora dura **~4 min** no automático. Reverter = zerar a constante.

## 25/09/2026 — 🚪 Champions: banners entre as fases + faixa de situação de cada um (aguardando OK)

Pedido do Diego: *"tem que ter banner separando a repescagem… e deixando claro quem tá
ou não nessa parte… qm tá classificado dizer que já passou e tá aguardando… qm tá na
repescagem avisa… qm não se classificou avisa lá em cima igual na Copa dos 8… e ele
só assiste"*.
- **Banner que separa as fases** = o próprio palco da Champions (um teatro só): "FIM
  DA TABELA · VEM O REPESCÃO" (explica 1-8 / 9-24 / 25-36 e conta 10s) e "FIM DO
  REPESCÃO · VÊM AS OITAVAS" (conta 6s). No manual, quem manda é o botão ("Começar o
  repescão" / "Ir pras oitavas"). `PORTAO_REPESCAO_MS` / `PORTAO_OITAVAS_MS`.
- **Faixa de situação** logo abaixo do banner, em qualquer aba: ✅ JÁ ESTÁ NAS
  OITAVAS (aguardando) · ⚔️ ESTÁ NO REPESCÃO (contra quem) · ❌ NÃO SE CLASSIFICOU (só
  assiste) · ✅ PASSOU / ❌ CAIU NO REPESCÃO. Só aparece depois do apito da 8ª rodada.
  Quem não joga o repescão tem PULAR. No mata-mata, quem não entrou lê "❌ Você não se
  classificou pro mata-mata — agora é só assistir".
- **Conserto de spoiler/sumiço**: a 8ª rodada agora anima como TABELA (antes a tela
  virava pro repescão no meio do jogo), e a VOLTA do repescão agora aparece rolando
  (antes o motor pulava direto pras oitavas — `playChampionsRepescao` não troca mais
  de tela; quem leva é o `START_COPA`). Placar dos confrontos só entra após o apito.
- Duração medida (automático, velocidade normal): **Só Champions ≈ 3,5 min** (8
  rodadas ~55s · repescão ~15s · oitavas→final ~2 min + banners) contra **Liga +
  Libertadores ≈ 7,5 min**.

## 25/09/2026 — 🎨 Tela da Champions = MESMAS peças da tela da liga (aguardando OK pra publicar)

Diego: *"visual segue padrões do q já tem nos modo hj seja placar botões cores
tabelas… outros jogos e tudo mais.. Tudo igual"*. O `EscChampions` foi remontado
com as peças do `EscSeason`, na mesma ordem: barra do topo (⭐ CHAMPIONS · RODADA
x/8 · posição · pts), placar que encolhe (`PlacarOnlineQueEncolhe`), manual/auto,
abas JOGOS+TABELA / ESTATÍSTICAS / ELENCO, faixa dos outros jogos, PRÓXIMO JOGO com
Retranca/Equilíbrio/Ataque (a tática vale no motor da Champions — `tacticOf` lê
`state.tactics`), tabela de 36, TODOS OS JOGOS da rodada, artilharia e garçons DA
CHAMPIONS na aba de estatísticas (`TopScorersBox fonte` / `TopAssistsBox
competition="champions"`), campinho na aba elenco, e o fundo de estádio
(`ll25-shell` passa a valer na tela `champions`). O repescão usa o cartão de
confronto da Copa (`CompetitionMatch`). Só o que é DA Champions ficou dela: o
banner, as faixas de corte da tabela e a espera do top 8.

## 25/09/2026 — 🩹 Só Champions caía na liga de 20 depois de outra partida ✅ NO AR

Print do Diego no 1º teste de verdade: "RODADA 1/38 · 13º · 0 pts", sem tabela. Causa:
o `START` da partida rápida **não limpava** a Champions/Copa/Liberta da partida
ANTERIOR — a `abreChampionsDiretoSePrecisa` via a Champions velha, achava que já
tinha semeado e deixava a liga rodar. No meu teste não aparecia porque eu sempre
partia do estado zerado. Conserto: (1) o `START` zera `quickCopa`/`liberta`/`champions`
(mesma faxina do REPLAY); (2) com a rodada em 0, a função trata qualquer copa no
estado como resto e limpa; (3) ao abrir o save da partida em andamento, ela roda de
novo — quem ficou preso na liga **se cura sozinho** ao reabrir. Testado: partida
velha → partida nova vai pra tabela de 36; save preso → reabre na Champions.

## 25/09/2026 — ⏱️ Monte das sobras = 10s nas salas com Champions ✅ NO AR

Diego: *"o monte da sobra do leilão gratuita do modo Champions será sempre com 10s e
não 15s"*. `monteMsDe()` (`store.tsx`): Liga + Champions ou Só Champions = **10s**;
todo o resto continua **15s**. O relógio e o texto "⏱️ Xs por vez" da tela leem a
mesma função. Como sempre, o relógio do Monte só existe no ONLINE (contra a CPU não
tem prazo). **Reverter**: `git revert` do commit.

## 25/09/2026 — ⭐ "SÓ CHAMPIONS" na partida rápida offline ✅ NO AR (só na conta do Diego)

Pedido do Diego: *"continua começando com 20… deveria ser só champions direto… deve
ter todos padrão de tabela, de placar, botões etc igual aos outros"*. Proposta
aprovada com um "Sim".

- **Botão novo na montagem da partida rápida: "⭐ Só Champions"** (no lugar do
  "Liga + Champions"). Continua travado com o selo EM BREVE pra todo mundo menos o
  Diego (`useChampionsLiberada`; `CHAMPIONS_GERAL = false` NÃO mexido).
- **Acabou o leilão → vai direto pra tabela de 36**, sem liga. Entram o seu time +
  os times do leilão (os 20 com elenco) + 16 clubes de batismo na ordem de sempre
  (`championsConvidados`). Mora em `seedChampionsDireto`/`abreChampionsDiretoSePrecisa`
  (`store.tsx`), que roda DEPOIS de qualquer ação (`reducer` virou um invólucro do
  `reducerBase`) — assim pega fim do leilão, "Nova temporada" e "Novo leilão" sem
  lembrar caminho por caminho. A liga fica montada por baixo com a rodada no fim
  (é de lá que o motor lê a força), mas ninguém joga ela.
- **Tela da Champions no padrão da liga**: banner de cinema, placar ao vivo
  (`LiveScoreCard`), tabela com escudo/P/V/E/D/SG, faixas de corte e a sua linha na
  cor do seu tier, `SimControls` de sempre.
- **Mata-mata e fim sem resto de liga**: some o "15º · 0 pts" do topo (vira IDA/VOLTA),
  some a artilharia da liga, o texto das oitavas explica "8 primeiros + 8 do
  repescão" (vale também pro Liga + Champions, que tinha o texto da Copa dos 8), a
  artilharia do mata-mata diz CHAMPIONS, o Rank não grava campeão de liga falso, o
  `FINISH_SEASON` não coroa liga nesse modo, e a tela do fim é "🏁 Fim da Champions"
  sem o jornal O MARTELO (que só fala de liga/Copa dos 8).
- **Fechar o app no meio não perde a Champions**: a tela `champions` entra no save
  da partida em andamento SÓ nesse modo (`isSoloGameScreen`).

Testado de ponta a ponta com o motor de verdade (leilão → 8 rodadas → repescão →
oitavas → campeão → "Nova temporada" volta direto pra tabela), prints conferidos.
**Reverter**: é um commit só — `git revert` dele.

⚖️ **Nível dos convidados: DECIDIDO, fica como está (25/09).** Medido: rival do
leilão = 100%, bot de enchimento ≈ 82%, os 16 batismos convidados ≈ 72% (levam o
mesmo desconto dos bots em cima de uma força menor). Propus subir pra 82% e ele
disse: *"Não. Deixa como tá"*. **Não repropor.**

🧑‍🤝‍🧑 **IDEIA DELE (25/09), pra QUANDO liberar a Champions no online:** sala do modo
Champions com **até 36 pessoas** (*"somente nesse modo… qd eu liberar no online"*).
Hoje a sala online tem teto de 20 times (`MAX_PLAYERS` em `lobby.tsx`; duplas = 40
pessoas mas 20 times). Pra fazer: (1) criar a Só Champions no ONLINE (hoje o online só
tem Liga + Champions); (2) teto 36 só nesse modo; (3) conferir se o baralho fecha 36
elencos e se a sala aguenta 36 envelopes (lembrar da sala pesada do Tocaia, 24/09);
(4) vaga que sobrar continua virando clube de batismo. **Baralho medido em 25/09** (START_ONLINE com 36
nomes): 401 cartas, **zero fake** em Brasil, Europa, Brasil+Europa e Todos, cada um
sozinho, nas duas formações que a sala oferece (4-3-3 e 4-4-2). Só faltaria zagueiro
brasileiro com formação de 3 zagueiros (5-3-2/5-4-1) — que a sala NÃO oferece. **Não começar antes de ele
mandar liberar.**

📌 Pendente (não fazer sem ele pedir): liberar a Champions pra todos
(`CHAMPIONS_GERAL`); Só Champions no ONLINE; jornal O MARTELO com edição da Champions.

## 25/09/2026 — ⚽🅰️ O gol do jogador estava perdendo a Supercopa (e o total, os clubes de grafia dupla) ✅ NO AR

Relato do Diego, olhando a aba Elenco de uma carreira encerrada: *"os gols no modo
carreira não tão aparecendo gols da copa e supercopa, eu acredito. Assistência
também não, no jogador. E quando aperta no jogador, que mostra o modal de infos
dele, também não tá totalizando certo os gols totais e assistências totais"*.

**Medido antes de mexer** (`npm run gols`, 12 temporadas simuladas com o código de
verdade): **28 gols e 20 assistências de Supercopa** fora da ficha do jogador, e
**4 cartas** com a chave do acumulado divergente. Dois furos diferentes:

### 1️⃣ 🏆🔵 A Supercopa contava no Rank e sumia do jogador
`copaBrasilAsCopaResult` juntava os gols da Supercopa em `scorersAll` (histórico de
todos os tempos e prêmio do artilheiro) mas **não** nos mapas POR CARTA
(`goalsByCard`/`assistsByCard`) — e é deles que saem a coluna ⚽/🅰️ do elenco, a
ficha do jogador, a imagem de compartilhar e o acumulado que atravessa a virada
(o `guardaCansaco` recebe o MESMO mapa). A Copa do Brasil e a Copa Legends sempre
estiveram lá; só a Supercopa, que é calculada FORA da Copa e entra na chave como
uma fase a mais, ficava de fora. Conserto: os dois mapas agora somam a Supercopa.

### 2️⃣ 🗝️ O "NO SEU CLUBE" zerava pra quem joga em clube de grafia dupla
`guardaCansaco` (store.tsx) **gravava** o acumulado em `nome|clubCanon(clube)|ano`
e a tela (pyramidseason.tsx) **lia** em `nome|clube|ano` cru. Pras cartas de clube
com duas grafias — Bayer Leverkusen→Leverkusen, Manchester United→Man United,
Leicester City→Leicester, Inter de Milão→Inter — a leitura nunca achava a linha, e
jogos, gols e assistências "NO SEU CLUBE" voltavam a ZERO a cada virada.
Conserto: a chave virou **uma função só** (`chaveCarry`, em `condicao.ts`), e quem
grava e quem lê chamam a mesma. **Não precisou migrar save**: o que está gravado já
está na grafia canônica — os números perdidos VOLTAM sozinhos.
💡 É a mesma lição do "botão mudo" (19/09): regra escrita em dois lados vira duas
regras. A trava reprova se alguém voltar a montar a chave na linha.

**Trava**: `npm run gols` — simula 12 temporadas, exige que nenhum gol/assistência
de Supercopa fique fora do mapa por carta, que a chave normalize a grafia do clube
e que ninguém a monte à mão. Rodaram junto e passaram: `artilharia`, `condicao`,
`congela`, `fim`, `agencia`.

🌍 **Fica anotado o que NÃO mudei**: a **Copa do Mundo** é de SELEÇÃO, e o acumulado
do jogador é "no seu clube" — gol de Copa do Mundo continua fora da ficha do clube
(ele entra no Rank de todos os tempos e na comissão da Agência). Se o Diego quiser
somar, é decisão dele.

↩️ **Reverter**: dois pontos isolados — o `somaPorCarta` em `copa-brasil.ts` e o
`chaveCarry` em `condicao.ts`.

## 25/09/2026 — 🐊 A página de regras ensinava o pregão ERRADO na Tocaia ✅ NO AR

Relato do Diego: *"após criar sala pelo modo stream sempre aparece uma página
ensinando o jogo. Porém no Tocaia também aparece, mas fica mostrando regras do
modo envelope… só altere quando for Tocaia, ensinar a forma certa. Mesma coisa
serve pro modo partida rápida"*.

**Por que era grave**: a pessoa entrava na Tocaia acreditando que ia escrever
lance secreto. Na Tocaia ninguém escreve nada — o preço CAI e quem aperta
primeiro leva. É a mesma família do "botão mudo": a tela dizia uma coisa e o
motor fazia outra.

**Feito** (`EscStreamIntro`, em `screens.tsx`): a página passou a ter dois textos,
escolhidos por `state.holandes`. No 🐊 Tocaia:
- 🪙 *"Um preço só — e ele CAI"* (abre em `HOL_ABERTURA`: 100 no futebol, 50 no
  basquete), ninguém escreve lance, quem aperta PEGAR primeiro leva.
- 👇 o desenho do que ela vai ver: o preço grudado no topo com a barra esvaziando
  e a MESA com **3 atacantes** (Romário · Obina · Dodô, cartas de verdade), cada
  um com PEGAR pelo mesmo preço. Os três da MESMA posição de propósito — a leva é
  por setor, e misturar GOL com ATA ensinaria um pregão que não existe. Pedido
  dele: *"bote outra posição e não só um jogador… coloque uns 3 pra dar a entender
  o jogo"* (antes era uma linha só, com o Alex Muralha).
- 🎰 *"Dois no mesmo preço? Roleta"* — e, o que mais assusta quem é novo: **quem
  não leva não paga nada**.
- No quadro do AUGE só mudou uma frase: *"o nível abre na revelação"* →
  *"abre quando o jogador é seu"* (na Tocaia não existe revelação).
- Botão final: ▶️ COMEÇAR A TOCAIA 🐊.

⚠️ **O ENVELOPE ÀS CEGAS NÃO FOI TOCADO** (ordem dele). Tudo é `tocaia ? … : …` e
o lado de trás dos dois-pontos é idêntico ao que já estava no ar — conferido com
foto dos DOIS modos, pelo `node scripts/foto-intro-tocaia.mjs`, que abre o jogo de
verdade e fotografa a página nas duas escolhas de pregão.

Vale nos dois lugares em que a página aparece (🎥 Modo Stream e ⚡ Partida Rápida),
porque é a mesma tela.

↩️ **Reverter**: apagar o lado `tocaia` dos ternários — o envelope volta a ser o
único texto, sem tocar em mais nada.

## 25/09/2026 — ⭐ Banner cinematográfico da Champions (fim da liga) ✅ PUBLICADO

Pedido do Diego: *"o mesmo estilo de banner da Copa do Mundo… com o troféu da Champions no
lugar, e escrever Champions League"*. Mockup mandado; ok dele: *"faça aí"*.
- `CompetitionStage kind="champions"` (novo `kind`) + `.ll25-champions-art` com
  `img/online-champions-v25.webp` (1280×852, 40 KB): a MESMA sala da Copa do Mundo, o
  troféu dourado tirado por inpaint, o troféu de orelhas (recortado da foto que ele mandou,
  emblema desfocado) no pedestal, cena puxada pro azul `#1B3FA0` + estrelas. Receita em
  `scratchpad` (não versionada) — refazer é: recorte por luminância + inpaint + blend.
- O bannerzão azul liso do fim da liga saiu; regras e o botão "⭐ COMEÇAR A CHAMPIONS" ficam
  na área creme embaixo do palco, igual ao portão da Copa do Mundo. Vale online e offline.
- Texto do banner: **"Champions League"**, como ele pediu (no resto do jogo segue "Champions
  Legends"). ⚠️ Foto real do troféu + nome "Champions League" são marcas da UEFA — avisado a
  ele; decisão dele. Um troféu em DESENHO foi gerado no OpenArt (conta dele, histórico
  9vTX9jlxc1AcjGUageCR) mas a rede daqui não baixa do cdn.openart.ai — se ele mandar a
  imagem, é só trocar o webp.

## 25/09/2026 — ⭐ Champions offline: tabela zerada no Modo Manual ✅ CONSERTADO

1º teste do Diego com bot: *"a Champions não deu certo"* (print da tabela de 36 toda zerada).
Causa: em `EscChampions` o botão "próxima rodada" só aparecia no AUTOMÁTICO (`!manual`) e no
MANUAL o relógio não dispara — quem joga no Modo Manual (ele) ficava sem nada que puxasse a
rodada. Conserto: o mesmo `SimControls` da Liberta (manual → botão puxa rodada/perna do
repescão; automático → relógio puxa e o botão adianta), com anti-spoiler (`canNext` só depois
de animar) e o aviso "o host puxa" pro convidado online. Regra de ouro contra botão mudo.
💭 Ele também sugeriu *"começar a liga com 32 de cara"* em vez de 20 — perguntado a ele se
é isso mesmo (a Champions decidida em 21/09 é 8 da liga + 28 batismos); NÃO mexer sem resposta.

## 25/09/2026 — ⚡ Partida rápida OFFLINE: as mesmas copas do online ✅ PUBLICADO

Diego: *"esses modos já têm pra partida rápida também? Tem que ter todos. Liga a Champions já
no partida offline, vai ser o primeiro teste que vou fazer com bot"*.
- "Depois da liga" no rápido offline virou grade 2×2: **Liga + Copa · Liga + Liberta ·
  Liga + Champions · Só Liga** (antes não tinha Champions).
- Champions com a MESMA trava do online (`useChampionsLiberada`): aparece pra todo mundo com
  a tarja EM BREVE e só `CHAMPIONS_TESTERS` (a conta dele) marca. **Continua NÃO liberada
  geral** — a regra de 21/09 segue de pé; o que mudou é que agora ele consegue testar sozinho
  contra bot. O motor já rodava sem sala (`canDriveCopa = !online || isHost`).
- ⚠️ **Liga + Mundo NÃO entrou no offline**: no online a Copa do Mundo é um modo de SALA
  (`CopaDaSala`, ficha + relógio no banco). Pra rodar sozinho precisa de um caminho novo
  (a carreira tem o `CupScreen` com save — dá pra reaproveitar). Fica pra ele decidir.

## 25/09/2026 — 📱✨ A palavra "WhatsApp" acende na linha das salas abertas ✅ NO AR

Pedido do Diego: *"aquele texto sutil embaixo das salas abertas onde fala do grupo
do WhatsApp. Coloque algum tipo de brilho na parte escrita WhatsApp, pra quem tá
procurando galera pra jogar junto… pra pessoa ler que entra no grupo do WhatsApp
se quiser"*.

**Achado no caminho**: a linha NÃO escrevia "WhatsApp". Dizia só *"Tem um grupo de
quem joga online"* — quem batia o olho achava que era coisa de dentro do jogo.
Então o trabalho virou dois: **escrever a palavra** e **acender ela**.

**Feito** (`src/escalacao/lobby.tsx`, bloco embaixo do 🔄 Atualizar lista):
a frase agora é *"Tem um grupo no **WhatsApp** de quem joga online"* (PT e EN, nos
dois finais — quem já tem vaga e quem não tem), e só a palavra ganha o verde
`#25D366` com um respiro de 2,4s (`@keyframes zapRespira`) — **e a bolinha verde
viva antes da frase** (opção ③, escolha dele), respirando no MESMO tempo da
palavra pra as duas luzes não brigarem. O resto da linha
continua no cinza de rodapé, porque a ordem de 29/08 (*"de forma mais sutil"*)
continua valendo. Brilho em CSS = **0 KB**, e `prefers-reduced-motion` desliga a
animação e deixa o brilho parado.

**Mockup**: `node scripts/mockup-brilho-whatsapp.mjs` — mostra o de hoje + as 3
formas de brilho (① respira · ② luz passando · ③ respira + bolinha viva).

✅ **OK dele: "3"** — a opção ③ (respira + bolinha viva). Foi pra main no mesmo
dia. Reverter é apagar as classes `zap-brilha` e `zap-ponto`; nada mais na tela
depende delas.

📢 **De propósito NÃO virou novidade na home**: o grupo já existia e a linha já
estava lá — isto é só deixar a palavra visível. Novidade é feature nova pra quem
joga, não realce de coisa que já estava no ar.

## 25/09/2026 — ⚡ Partida rápida OFFLINE: as mesmas copas do online ✅ PUBLICADO

Diego: *"esses modos já têm pra partida rápida também? Tem que ter todos. Liga a Champions já
no partida offline, vai ser o primeiro teste que vou fazer com bot"*.
- "Depois da liga" no rápido offline virou grade 2×2: **Liga + Copa · Liga + Liberta ·
  Liga + Champions · Só Liga** (antes não tinha Champions).
- Champions com a MESMA trava do online (`useChampionsLiberada`): aparece pra todo mundo com
  a tarja EM BREVE e só `CHAMPIONS_TESTERS` (a conta dele) marca. **Continua NÃO liberada
  geral** — a regra de 21/09 segue de pé; o que mudou é que agora ele consegue testar sozinho
  contra bot. O motor já rodava sem sala (`canDriveCopa = !online || isHost`).
- ⚠️ **Liga + Mundo NÃO entrou no offline**: no online a Copa do Mundo é um modo de SALA
  (`CopaDaSala`, ficha + relógio no banco). Pra rodar sozinho precisa de um caminho novo
  (a carreira tem o `CupScreen` com save — dá pra reaproveitar). Fica pra ele decidir.

## 25/09/2026 — ❤️ Salão: "dois Vasco" na lista de torcidas ✅ CONSERTADO (banco)

Print do Diego: "Vasco da Gama 3,7%" e "Vasco 1,9%" na mesma lista (*"tem dois Vasco, cuidado
com isso"*). Culpa minha no dia anterior: gravei o coração do Vasco SAF como "Vasco" enquanto o
Skyy FC estava como "Vasco da Gama" — e o cadastro (seletor de `coracao.ts`) escreve "Vasco".
Mesma coisa esperando pra acontecer com "Atlético Mineiro" × "Atlético-MG".
Conserto: migração `salao_torcidas_unifica_apelidos` — a função `esc_salao_torcidas` junta os
apelidos no nome do SELETOR antes de agrupar; linhas velhas corrigidas. Cópia em
`docs/sql/salao-torcidas-unifica-apelidos.sql`. **Regra pro roteiro de batismo:** o
`time_coracao` em `esc_socios` usa o MESMO nome do seletor (`CORACAO_CLUBES`).

## 24/09/2026 — 🧊 Depois do apito, o passado não muda mais ✅ CONSERTADO

Relato do Futpoint FC, trazido pelo Diego: *"eu não ganhei nada nessa temporada,
mas quando fui pegar o jogador que tinha emprestado, o jogo bugou e deu que eu
tinha sido campeão"*. Ele trouxe o Roberto Carlos de volta da SAF, foi no jornal
e estava campeão das DUAS copas; voltou na janela de empréstimo, mexeu de novo, e
perdeu as copas e ganhou a LIGA.

**A causa**: o resultado da temporada NÃO é guardado — a tela refaz as 38 rodadas
na hora, a partir do elenco que está no clube NAQUELE momento
(`buildPyramid(state.managers…)`). A janela de empréstimo fica na MESMA tela, e
trazer alguém da SAF mexe em `cpuSquads` — que é dependência do `useMemo`. Conta
refeita com outro time = temporada inteira diferente.
💡 O `useMemo` já tentava se proteger (a lista de dependências tem
`state.managers.length`, não `state.managers`), mas o `cpuSquads` vazava a
mudança por baixo.

⚠️ **E dava pra abusar**: o prêmio só é gravado quando a pessoa AVANÇA a
temporada, então bastava mexer no elenco até cair um título bom e só então
avançar. Ninguém achou de propósito — o Futpoint tropeçou — mas estava aberto.

**O conserto** (`src/escalacao/congela-temporada.ts`): no apito final o mundo
daquela temporada é FOTOGRAFADO, e a tela passa a ler a foto. O que acontecer
depois (empréstimo, SAF, venda, compra) não reescreve o que já foi jogado. A foto
é presa ao NÚMERO DA TEMPORADA: na virada ela se desfaz sozinha.

**Trava**: `npm run congela` — refaz a história do Futpoint passo a passo e exige
que o campeão NÃO mude depois do apito (e que a foto da T6 não vaze pra T7).

🕳️ **O QUE AINDA FALTA, e é honesto anotar**: a foto vive na MEMÓRIA da tela. Se
a pessoa RECARREGAR a página com a temporada encerrada e o elenco já mexido, a
conta é refeita e pode dar outro campeão. Pra fechar de vez, a foto precisa ir
pro SAVE (tabela + copa + artilharia), que é mudança maior e mexe no tamanho do
save. Enquanto isso, o caminho que o Futpoint andou — mexer no elenco e ver a
história mudar na frente dele — está fechado.

↩️ **Reverter**: trocar `world` de volta por `worldVivo` na tela da temporada.

## 24/09/2026 — ⚽🏴‍☠️ Batismo VASCO SAF (brunnodeluca90) = o antigo Vasco da Grana ✅ PUBLICADO

O Vasco da Grana era batismo SEM dono (pedido do Diego em 03/08); ele achava que era deste
usuário. Ordem dele: *"ele entra no lugar do Vasco da Grana"*. Então é RENOMEAÇÃO: mesmo
assento da Série D, `OLD_NAME['Vasco SAF'] = 'Vasco da Grana'`, e o "Vasco da Grana" saiu
do Salão (`batismos.ts`). Escudo/mascote também respondem pelo nome velho. Coração **Vasco**.
- Arte: escudo 266×360 29,0 KB + mascote (O Pirata) 277×440 40,0 KB = 69 KB. Recorte só do
  chroma forte — as NOTAS de dinheiro do mascote são esverdeadas e ficaram inteiras.
- Manto preto `#161414` (subido de #080707) + branco `#ECE6E1`, medidos na camisa.
- Banco rodado (`docs/sql/batismo-vasco-saf.sql`): sócio 59, fundador 78, 3 nomes, ouro.
- ⏳ Post `mockups/vasco-saf-post.png` — falta o nome do dono no rodapé (e o do Julia também).

## 24/09/2026 — 🔄 Publicar no meio da partida derrubava a tela ✅ CONSERTADO

Relato dele: *"tá com erros nas salas online da Tocaia, travando… minha sala do
Neymarzetti tava com 10 pessoas e travou, bugou dos usuários, não entendi nada"*.
E, importante, ele CORRIGIU a minha primeira teoria: *"hoje já teve gente jogando
até com 20 na mesma sala; esse erro começou tem pouco tempo, seja com 10 ou menos,
e deu com outra pessoa sendo host e agora comigo"*. Ou seja: não era a Tocaia, não
era o relógio do dono, não era lotação.

**A PROVA veio do banco**, não de achismo: a tabela `esc_quedas` (o registro de
quedas de tela) tem **50 quedas nos últimos 10 dias e as 50 são a MESMA coisa** —
`Failed to fetch dynamically imported module …/assets/salao-XXXX.js` (e as
variações de Safari e do CSS).

**O que acontecia**: o jogo carrega dois pedaços SÓ NA HORA (a Loja do Clube e a
Copa da liga). O nome do arquivo carrega um código que muda a cada publicação, e a
publicação APAGA os antigos. Quem está com o jogo ABERTO ficou com o nome velho:
na hora de abrir a Loja, o arquivo não existe mais e a tela cai no "😵 Ops".
E quem mais sofre é justamente quem a gente protege: o `VersionWatcher` só
atualiza sozinho quem está na TELA INICIAL, pra não interromper partida — então
quem está DENTRO DA SALA nunca atualiza, e é ele que quebra. Em 23/09 foram TRÊS
publicações à noite (17h38, 19h19, 01h26), em cima das salas dele.

**O conserto** (`src/escalacao/recarga.ts`): pedaço que falha ao carregar
recarrega a página e a pessoa volta pro lugar — piscada de 1-2s em vez de tela
quebrada. Em dois lugares: o `pedaco()` que embrulha os dois `lazy()` (caminho
normal) e o `ErrorBoundary` (rede de segurança pro que escapar).

⚠️ **UMA VEZ SÓ — ordem dele**: *"ok mas no máximo uma vez hein"*. A marca fica no
`sessionStorage` da aba; se falhar de novo, aparece a tela de erro (se
recarregasse sempre viraria pisca-pisca e ninguém veria o que houve). E bug DE
VERDADE nunca recarrega — senão a gente esconderia problema real.

**Trava**: `npm run recarga` — prova as duas coisas (recarrega na 1ª, nunca na 2ª;
e não confunde bug de verdade com pedaço que sumiu).

📌 **E o combinado de processo**: não publicar à noite quando ele estiver com sala
cheia. Enquanto o jogo tiver pedaço carregado na hora, publicação no meio da
partida sempre vai incomodar alguém — agora incomoda uma piscada, não uma queda.

↩️ **Reverter**: tirar o `pedaco()` dos dois `lazy()` e a linha do ErrorBoundary.

## 25/09/2026 — 🐊 Solta o mascote na SALA DE ESPERA ✅ PUBLICADO (ok dele: *"pode"*)

Pedido dele: *"após criar sala, onde seus amigos entram na espera e tem áudios… daria pra pôr o
solta o mascote ali também? Mas com a mesma regra do áudio, sem poder apertar disparado"*.
Decisões dele: relógio de 30 s **único** com os áudios (*"pode ser sim"*) e bichos **podem se
cruzar** (*"o bicho não precisa ser um por vez não"*).
- `MascoteAtravessa`/`MascoteMini`/`moneySeed` saíram de `screens.tsx` pra
  `mascote-atravessa.tsx` (o lobby não pode importar a tela do leilão — ela importa o lobby).
- `store.tsx` expõe `addEmote` no contexto; o lobby manda o emote pelo canal DA SALA (`masc`)
  e cada aparelho entrega em `addEmote` → o mesmo bicho do leilão atravessa.
- Botão roxo abaixo dos áudios, só pra quem tem `mascoteKey` (régua de sempre); divide
  `sfxLastRef`/`sfxCoolLeft` com a buzina. Linha nas novidades (PT/EN) já escrita.
- build, telas e penaltis verdes. Print aprovado e publicado em 25/09.

## 25/09/2026 — ⚽ Pênaltis: A BOLA VIAJA até o gol ✅ PUBLICADO
🔓 **E vale nos DOIS modos** (ordem dele, na sequência: *"online e offline"*): a Copa do jogo
rápido OFFLINE e a Copa da carreira (Brasil/Legends) também passaram pra tela nova — antes só
as contas de teste viam. Chaves: `compactCareer && CAREER_VISUAL_RELEASED` no `PensShootout`
e `compactOnline` no ramo antigo do jogo rápido (`screens.tsx`). Só a disputa muda; o resto
do cartão segue como era.

Mockup (`scripts/mockup-penaltis-bola.mjs`, tira + GIF) aprovado: *"pode fazer, já pode
funcionar já"*. Em `CompactPenalties`: a bola nasce no pé de quem bate, atravessa a pista
(animação CSS com atraso congelado por cobrança — o relógio de 80 ms só liga/desliga, nunca
reposiciona) e só na chegada sai o final: gol (rede balança) · defendeu (luva no lugar do gol)
· fora (passa e some) · trave/travessão (bate e volta) · isolou (sobe e some).
- 🙈 Sem spoiler por construção: a viagem é idêntica pra todo resultado e o `ok` só é lido
  quando a cobrança chegou (`shown`), o mesmo instante da bolinha na linha.
- ⏱️ Nenhum segundo a mais: veredito 35% do passo, viagem 55%, bola parada no pé no resto.
- 🩹 De quebra: a ÚLTIMA cobrança fica no palco até a linha do classificado (antes sobrava
  ~1 s de "uma cobrança de cada vez…").
- Conferido no navegador nos dois ritmos, com os 5 finais.
💡 Ideias que ficaram na gaveta (ele escolheu a bola): aviso "PRA CLASSIFICAR / PRA FICAR VIVO"
na cobrança decisiva; o AVATAR do batedor (162 lendas já têm) no palco, sem inventar rosto.

## 25/09/2026 — 🎭 Pênaltis com gente ficam mais lentos + bolinhas começam na esquerda · ⏳ NO BRANCH, sobe de manhã

Diego: *"tô achando que a emoção não tá tendo, tá muito rápido… bot contra bot tudo bem ser
rápido, mas tendo humano usuário aí não acho legal. Além da disputa ter que começar certo, com
os pontinhos na esquerda"*.
- ⏱️ **Ritmo por quem está na disputa**: bot × bot segue 0,85 s por cobrança; com time de GENTE
  (você ou outro humano) 1,6 s (`pensPasso`/`PENS_PASSO_LENTO` em pyramidseason.tsx). O palco
  fica mais tempo em "quem bate" e o lance aparece com calma.
- 🔗 **Tela e relógio na mesma conta**: `pensRevealDelay(pens, lento)` em TODO lugar que segura
  a fase — Copa do Mundo (carreira e online, `koTemGente`; o online marca `humano` pela ficha),
  Copa do jogo rápido (`copaTemGenteQ`; os 13 s fixos viraram a disputa mais longa da fase, com
  piso de 13 s) e Copa da carreira (`copaTemGente`). Achado no caminho: o texto do campeão da
  final da Copa do Mundo esperava o ritmo rápido — corrigido junto.
- 📏 **Bolinhas ancoradas na esquerda**: a coluna começa num ponto fixo (40%) nas duas linhas;
  antes ela encostava na direita e crescia pra esquerda (a 1ª andava). A tela antiga deixou de
  centralizar pelo mesmo motivo. Morte súbita comprida quebra linha.
- 🧪 Trava `npm run penaltis`: confere a espera nos DOIS ritmos e exige `lento` em toda tela e
  todo relógio (provado: sem um `lento=`, ela acusa a linha).
- Conferido no navegador (disputa 5×6 com gente, 6 momentos).

## 23/09/2026 — 🐊💰 "Apertei no 11 e outro pegou por 8" ✅ CONSERTADO (sala do Fridão)

Diego, com a sala 3QAPF7 (Tocaia, host `fridao fc`) rolando: *"tem gente que apertou
no jogador pra dar lance quando tava 11 e outro pegou pagando 8"*.

**A CAUSA, achada no reducer**: havia a linha `if (action.preco !== s.hol.preco)
return s`. Ou seja: **se o preço mudou enquanto o toque viajava, o toque ia pro LIXO,
calado**. O cara apertou vendo 11, a mensagem demorou um tiquinho, chegou com o host
já em 10 — e ele ficou sem nada enquanto a carta caía até outro levar por 8. Ele
apertou PRIMEIRO e perdeu.
📮 **E isso inutilizava a ESTRADA RESERVA**: o toque que vai pelo banco (`room_acoes`)
é lido de 3 em 3s, então o preço SEMPRE tinha mudado — o caminho que existe justamente
pra salvar o toque quando o rádio falha era descartado na chegada, **100% das vezes**.

**O CONSERTO**: o toque atrasado agora VALE, e paga **o que estava na tela dele**.
Nunca mais caro — que era exatamente o que a trava velha queria proteger, e segue
protegido. Só o caso impossível é recusado (preço da tela MENOR que o de agora = tela
do futuro; o preço só cai). `holandesPegar` ganhou o parâmetro `precoDaTela`.
⚖️ **O que NÃO mudou**: quem chega primeiro no host leva (decisão dele de 20/09,
*"tem que ser por tempo"*) e carta com dono continua trancada. A mudança não inverte
disputa nenhuma — ela só para de **jogar fora** toque que não disputava com ninguém.
🗣️ E o aviso amarelo virou **"SE PERDEU"** (era "TARDE") e agora espera 4,5s antes de
aparecer: com o toque atrasado valendo e a estrada reserva de 3s, avisar cedo seria
mentira na cara da pessoa.
✅ Provado que o leilão às cegas não foi tocado: rodei a prova com e sem a mudança, e
deu idêntico nos dois.

## 24/09/2026 — ⚽🏴‍☠️ Batismo VASCO SAF (brunnodeluca90) = o antigo Vasco da Grana ✅ PUBLICADO

O Vasco da Grana era batismo SEM dono (pedido do Diego em 03/08); ele achava que era deste
usuário. Ordem dele: *"ele entra no lugar do Vasco da Grana"*. Então é RENOMEAÇÃO: mesmo
assento da Série D, `OLD_NAME['Vasco SAF'] = 'Vasco da Grana'`, e o "Vasco da Grana" saiu
do Salão (`batismos.ts`). Escudo/mascote também respondem pelo nome velho. Coração **Vasco**.
- Arte: escudo 266×360 29,0 KB + mascote (O Pirata) 277×440 40,0 KB = 69 KB. Recorte só do
  chroma forte — as NOTAS de dinheiro do mascote são esverdeadas e ficaram inteiras.
- Manto preto `#161414` (subido de #080707) + branco `#ECE6E1`, medidos na camisa.
- Banco rodado (`docs/sql/batismo-vasco-saf.sql`): sócio 59, fundador 78, 3 nomes, ouro.
- ⏳ Post `mockups/vasco-saf-post.png` — falta o nome do dono no rodapé (e o do Julia também).

## 24/09/2026 — 🦈 Batismo JULIA BARRANQUILA (dondeestasleomessi10) · ✅ PUBLICADO

Série A, no assento do **Leão da Estradinha**, que desceu pra Série B (decisão do Diego:
*"troque pelo Leão da Estradinha e coloque o Leão na Série B"*) na vaga do bot Esporte do
Cerrado. Coração **Corinthians**. Mascote: a 2ª arte que ele mandou (o tubarão de óculos
dourado) — a 1ª (óculos preto) foi trocada por ele.
- ✅ **Código**: escudo 251×360 26,4 KB + mascote 440×366 43,7 KB = 70,1 KB (teto 75); manto
  vermelho `#E60205` + branco `#F7F5F3` medidos na camisa (o marinho é só gola, fica fora);
  4 formas do nome; apoio ouro + FUNDADOR_N 77; batismos.ts; Loja (`julia-camisa-v1.webp`);
  trava. Mascote LARGO: o lado maior (largura) fica em 176.
- ✅ **Banco** (`docs/sql/batismo-julia-barranquila.sql`, rodado e conferido): sócio 58,
  fundador 77, 3 nomes reservados, ouro em user_colors (esse já vale sem deploy).
- ✅ **Deploy na main**: publicado à noite por ordem dele (*"agora"*) — exceção à regra do horário de pico.
- ⏳ **Post**: `mockups/julia-barranquila-post.png` pronto, falta o NOME do dono no rodapé.

## 24/09/2026 — 🧳 Tocaia travando: a sala levava a CARREIRA do dono na mala ✅ CONSERTADO

Diego, sala "SALÃO DO BOSS" (TVBA0Q, dono FINAL BOSS): *"deu erro, travou a sala, os
valores e etc… já saiu todo mundo, mas ache o erro na Tocaia"*. A TVBA0Q já tinha sido
apagada (dono saiu por último), mas a MESMA turma abriu a P7KF2U (dono Neymarzetti —
pelo estado, é o mesmo aparelho/pessoa do Final Boss FC) e ela travou igual: preço
parado em 38 no resgate desde 22:58.
**🔎 A causa, medida no banco**: o estado da sala pesava **881 KB** (sala normal: 60–170
KB). **745 KB eram da CARREIRA do dono** que ficaram no estado quando ele saiu dela e
abriu a sala: `cpuSquads` 279 KB, `careerScorersAll` 259 KB, `careerAssistsAll` 208 KB.
O jogo rápido não usa nada disso, mas ia inteiro em TODA gravação do dono — e a Tocaia
grava a cada degrau (0,3–3 s). Banco e rádio engasgam, o preço para na tela de todo
mundo, e o convidado ainda guarda os 881 KB no celular (é o que enche o armazenamento e
desloga — a mesma turma do Neymarzetti de 21/09). **15 salas** acima de 300 KB desde
22/09, várias acima de 800.
**✅ Conserto**: o `sanitize` (o que VIAJA: banco + rádio) tira esses 4 campos quando a
sala não é carreira (`SEM_BAGAGEM_DE_CARREIRA` em `store.tsx`). O aparelho do dono não
perde nada; carreira online segue levando tudo. O livro-caixa FICA (o jogo rápido anota
compra nele). Trava: `npm run bagagem` (provado que pega: sem o conserto, 5 falhas).
⏳ **Não feito, fica anotado**: por que o jogo rápido HERDA esses campos da carreira em
memória (a raiz). Com o conserto isso deixou de viajar, que é o que travava; limpar a
herança mexe em como a carreira volta depois, então só com calma e teste.

## 24/09/2026 — 🎯 Pênaltis: spoiler e desalinhamento ✅ CONSERTADOS · arte nova ✅ PUBLICADA

Diego, com print de uma morte súbita 4×4 no online: *"o pênalti tá dando spoiler…
às vezes começa a bater sem tá alinhado, como se tivesse faltando o primeiro pênalti
de um time. E outro erro é mostrar já até aonde vai as bolinhas, já dando spoiler
onde vai parar"*.

**🐛 DESALINHAMENTO — a causa, provada rodando o motor**: em `sequenciaPenaltis`
(`penaltis.ts`), a rodada DECISIVA da morte súbita punha o **vencedor primeiro**.
Quando quem vencia era o B (linha de baixo), o B batia ANTES do A bem no lance que
decide — a bolinha de baixo pipocava com a de cima vazia. Medido: `5×6 → … A✓ B✓ B✓
A✗` (rodada 6 com o B na frente). Conserto: a ordem é uma só, A e depois B, sempre;
quem vence é quem converte. **Não muda placar nem vencedor de nada.**
🧪 A trava `npm run penaltis` ganhou a verificação 4 (*"a ordem nunca muda"*), que
confere TODA rodada de TODO placar que o jogo gera (~14 mil rodadas). **Provado que
ela pega o erro**: rodando sem o conserto, ela acusa *"ordem trocada em 8×9: na
rodada 9 quem bateu primeiro foi o B"*.

**🙈 SPOILER — eram DOIS vazamentos, nas DUAS telas** (a nova `CompactPenalties` do
online e a antiga `PensShootout`, que ainda roda na Copa do Mundo e no mata-mata do
jogo rápido):
1. **bolinha pro futuro**: toda cobrança que AINDA IA acontecer já ganhava lugar na
   tela. Na nova, uma bolinha vazia por cobrança — dava pra contar quantas faltavam
   (o print dele tinha 14 por linha). Na antiga, as bolinhas nasciam INVISÍVEIS mas
   ocupando espaço, e a linha centralizada entregava o tamanho pela posição do nome.
2. **"MORTE SÚBITA" aceso desde a 1ª cobrança**, porque o título vinha do TAMANHO da
   disputa (`nSlots > 5`) — anunciava o empate nos 5 antes dele acontecer.
Conserto: bolinha só EXISTE depois da cobrança (mais a da vez, piscando, na nova) e o
título só vira MORTE SÚBITA quando a 5ª rodada fecha empatada. A antiga ganhou um
relógio (antes era só CSS) e as duas linhas ficaram ALINHADAS ENTRE SI — nome com
largura fixa, coluna 1 de cima exatamente sobre a coluna 1 de baixo.
✅ Conferido no navegador de verdade, nas duas telas, em 4 momentos da disputa
(começo, fim do tempo normal, início da morte súbita, final).

**🎨 ARTE NOVA COM OS BATEDORES — ✅ APROVADA E PUBLICADA (24/09)**. Ok dele: *"ok pode
publicar, só tem que fazer de um jeito que caiba os nomes dos jogadores"*. Como coube:
nome longo ENCOLHE (14 → 10,5 px pelo tamanho) e quebra em até 2 linhas, nunca corta
no meio; o lance (GOL!/COMO ERROU) fica no meio sem quebrar. Mora em `CompactPenalties`
(`online-match-visual.tsx`) + `ordemBatedores`/`siglasDoTime`/`jeitoDoErro` em
`penaltis.ts`. Os times entram por `aSquad`/`bSquad` do `PensShootout`: Copa do Mundo
(convocados), Copa do online (elenco de cada técnico) e Copa da carreira (o XI, só
nas telas da prévia por enquanto). Sem elenco → volta a linha de sempre.
🐛 **E junto saiu um desalinhamento que ainda existia na tela NOVA**: cada linha de
bolinhas encostava sozinha na direita, então com o de cima uma cobrança à frente a
1ª de baixo ficava deslocada. Agora as duas linhas têm a mesma largura.
⚠️ Diferença do mockup ③: no FIM volta a linha do classificado ("São Luiz FC ·
CLASSIFICADO") no lugar do palco — na Copa do online ela é o único lugar que diz quem
passou. O último lance fica ~1 s no palco antes disso.
Histórico do mockup:
(`node scripts/mockup-penaltis-batedores.mjs` → `mockups/penaltis-batedores.png`).
Pedido: *"tô achando sem graça demais… poderia aparecer os jogadores que batem, de
alguma forma que não aumentasse o tamanho do modal demais"*. A proposta:
- um **PALCO** embaixo (faixa preta): quem bate · contra qual goleiro · e o lance
  ("GOL!"/"DEFENDEU!" por meio segundo). Ele entra NO LUGAR da linha "Uma cobrança de
  cada vez…", então o cartão cresce **14px** (medido: 180 → 194).
- cada bolinha ganha as **INICIAIS** de quem bateu (Adriano Imperador → AI, Zico →
  ZI). **Dois do mesmo time nunca ficam com a mesma sigla** (Romário RO, Ronaldinho RN).
- **ordem dos batedores**: os 5 melhores em campo, do ataque pra trás; morte súbita
  segue a fila; goleiro por último. Mesma ordem em todos os aparelhos.
- respeita as regras dele: nada do futuro (o próximo batedor não aparece), um teatro
  só (quem grita é o palco), sem confete nem faixa colorida.
⚠️ **Pra implementar vai precisar de uma coisa que a tela hoje NÃO recebe: o ELENCO
dos dois times** (`CompactPenalties` só ganha nome e escudo). Na Copa do Mundo são os
convocados; no online, o XI de cada técnico.
- ❌ **COMO ERROU** (pedido dele: *"pra fora.. trave... travessão.. isolou"*): o erro
  deixa de ser sempre "defendeu". 5 jeitos com peso de futebol de verdade — 🧤
  DEFENDEU 45% · 💨 PRA FORA 20% · 🚀 ISOLOU 15% · 🔔 NA TRAVE 12% · 🔔 NO TRAVESSÃO
  8%. Só o palco conta; a bolinha continua o ✗ vermelho. ⚠️ Na hora de implementar,
  o jeito do erro tem que sair da MESMA semente da disputa (senão cada aparelho da
  sala vê um lance diferente) e sem gastar rng do placar.

## 23/09/2026 — 🅾️ Uomo Concetto como 5ª marca do Master ✅ PUBLICADA (24/09, ok dele: *"pode publicar a Uomo também"*)

Está no branch `claude/denis-save-file-x1osct`, commit "Uomo Concetto vira a 5a marca
do Master", **NÃO na main** — é tela nova e ele vê antes. Contrato de **4 temporadas**
(a escada virou 1·2·3·4·5) e a **Vadico continua a mais cara em toda divisão** (a
condição dele). Detalhes, números e o conserto da trava `npm run master` (que estava
vermelha havia 8 dias) estão no commit.

## 23/09/2026 — 🛑 O "vigia do prazo" na Tocaia: ELE DISSE NÃO. Não propor de novo.

Resposta dele, seca, depois de eu explicar a proposta: *"não, não quero isso. Não mexa
em nada então"*. **É NÃO. Nada foi alterado, e não se mexe nisso sem ele pedir.**

Fica aqui só o ACHADO, porque é verdadeiro e outra sessão pode topar com ele:
- No envelope às cegas existe `useVigiaPrazo` pra fase `envelope`/`resq_envelope`:
  se o host congela, **qualquer cliente** força o lacre quando o prazo estoura.
- **A Tocaia não tem isso.** O preço só cai pelo `setTimeout` do aparelho do host
  (`euTico = !online || isHost`), e o `hol` **não guarda prazo nenhum** no estado —
  ninguém mais sabe quando o degrau deveria virar. Host congelado = sala parada no
  mesmo preço, sem contagem e sem quem destrave.
- A proposta recusada era: escrever o prazo do degrau no estado e registrar o mesmo
  vigia pra fase `holandes`, com o empurrão carimbado pelo número do degrau (pra dois
  aparelhos não pularem dois preços).

⚠️ **Antes dessa conversa ele já tinha recusado outra ideia minha no mesmo assunto** —
recriar o cadastro do convidado pra ele voltar. Ou seja: **duas propostas recusadas
sobre "o convidado que trava/não volta". Parem de trazer variação disso.** Se o
assunto voltar, quem levanta é ele.

## 23/09/2026 — 🧊 O convidado que "trava e não consegue voltar" ⏳ RECUSADO (ver acima)

Mesma noite, mesma sala: *"o time chamado Brazucas também travou e ele acabou não
conseguindo voltar"*.

**A PROVA, no banco (sala `efca06da…`, código 3QAPF7)**: a `room_players` dessa sala
tem os assentos **0, 2, 3, 4, 5, 6, 7, 8, 11, 13, 14, 15, 16, 18, 19** — ou seja,
**faltam os assentos 1, 9, 10, 12 e 17**. São CINCO pessoas cujo assento existe no
jogo mas **não tem mais linha na tabela**.

**POR QUE ELES NÃO VOLTAM** (`lobby.tsx`): quem perde a linha fica sem caminho de
volta, e **em silêncio**:
- na hora de reancorar a sala: `if ((!mySlot && !amHostHere)) return` — a sala nem
  aparece mais pra ele;
- no `resume()`: `if (!myPl) return` — não faz nada, não explica nada.
⚠️ **O HOST tem conserto e o CONVIDADO não.** Quando o host perde a linha, o código
recria a vaga **no assento dele**, achado pelo NOME nos managers do save (linhas
~292-298). Pro convidado esse caminho simplesmente não existe.

**PROPOSTA levada a ele (ainda NÃO feita)**: dar ao convidado o MESMO conserto que o
host já tem — se ele não tem linha mas o save tem um assento humano com o nome dele,
recria a linha naquele assento e deixa voltar. 🔒 Com uma trava a mais que o host não
precisa: **só se aquele assento não estiver ocupado por outro `user_id`** — é terreno
de índice de assento, a família de bug que já mordeu ("virei bot", "dei lance por
outro"), então não entra sem rede.
⏳ Por isso **perguntei antes de fazer**: regra 1 do CLAUDE.md (*na dúvida, perguntar*).

## 23/09/2026 — 🐊 Tocaia: o toque no preço 1 que "não pega" ✅ APROVADO E NO AR

Relato do Diego: *"às vezes quando o cara deixa pra dar o lance no 1, na contagem, às
vezes não pega. Sabe por quê? E o que sugere fazer?"*

**O PORQUÊ (conferido no código, não chutado)**: o **1 é o último degrau de todos** —
a escada é …3 · 2 · 1 · 0, e o 0 não é preço, é o `fechaHolandes`. Em qualquer outro
número, quem perde o tempo só vê o preço cair e aperta de novo; **no 1 não existe
próximo**. Soma-se a isso que **no online quem conta o tempo é SÓ o host**
(`euTico = !online || isHost`): a tela do convidado ainda mostra "1" enquanto o aviso
de fechamento viaja, ele aperta olhando pro 1, e quando o toque chega o host já
fechou — `holandesPegar` cai no `if (!hol) return` e **morre calado**.

**O QUE FOI FEITO** (ele escolheu a opção simples: *"mas se demorasse um segundo a
mais não teria problema também"* → *"Sim"*):
- ⏱️ **O preço 1 passou de 2s pra 3s** (`HOL_MS_ULTIMO`), e **saiu de graça**: os 5
  degraus do topo (100→60) foram de 500ms pra **300ms** (`HOL_MS_ALTO`). Lá ninguém
  aperta nunca — 5 × 200ms = exatamente o segundo que foi pro 1. A descida continua
  em **49,1s** (a trava reprova acima de 50s).
- ⏳ **A tela passou a dizer o porquê**: quando o degrau vira e o seu toque não pegou,
  aparece 3s um aviso amarelo "TARDE · não deu tempo — tenta neste preço", no lugar
  do botão, e o botão volta sozinho. 🚫 **Não** pus aviso pro caso de "outro levou" —
  a linha já troca pra "Arrematado · nome do time", e repetir seria o teatro duplicado
  que ele reprovou em 21/09.
- 🎬 O espelho do vídeo (`scripts/escada-tocaia.mjs`) foi junto — a trava pegou ele
  desatualizado. **Mudou o tempo no `store.tsx`? Muda lá também.**

⚠️ **Eu avisei na hora, e fica registrado**: 1 segundo **ajuda mas não mata 100%** — a
diferença entre a tela do convidado e o relógio do host continua existindo, só anda 1
segundo pra frente. **Se voltar a escapar, o próximo passo já combinado é CARIMBAR o
degrau no toque**: o aperto leva o número que estava na tela e o host aceita quem
apertou enquanto ainda dava tempo. 💡 O caminho já está meio pronto — o
`HOLANDES_PEGAR` **já carrega `preco`** na ação, e o motor hoje simplesmente ignora.
Não fazer sem ele pedir.

🔢 **Digitais do `npm run ascegas` de hoje**: `7d251395` · `67909d18` · `34c587c1`.
Mudaram por causa das **cartas de hoje**, não da Tocaia — provei rodando a prova com e
sem a mudança da Tocaia, e deu idêntico nos dois.

✅ **APROVADO** (*"sim pode fazer"*, depois de ver o mockup `mockups/tocaia-tarde.png`)
e publicado na main.

## 23/09/2026 — 🐊🔇 "Solta a mascote" do Monte não fazia nada ✅ CONSERTADO

Relato dele, com print da sala: *"o solta o mascote não tá funcionando quando aperta
ele… era pra mascote passar pela tela igual funciona no modo padrão às cegas"*.

**O que era**: o botão entrou no Monte de sobras em 21/09 (ordem dele), mas quem
desenha o bicho GRANDE é o `MascoteAtravessa` — e ele só estava montado no
`EscAuction` (o pregão). A tela do Monte montava só a fila de reações, que desde
25/08 **esconde de propósito** a mascote que ela sabe desenhar, pra não contar o
mesmo teatro duas vezes. Somando as duas coisas: a fila escondia e não existia
ninguém pra desenhar. **Apertar o botão não fazia absolutamente nada** — no pregão
do envelope cego funcionava normal, porque lá o desenho está montado.

**O conserto**: `<MascoteAtravessa />` montado no `EscMonte`, do lado da fila. Uma
linha. Nada mais muda: mesma arte, mesma travessia de 2,2s, mesmo confete.

**A trava nova** (`npm run mascote-botao`): agora ela lê o código e reprova se
QUALQUER tela render o botão sem ter o desenho junto — a mensagem sai com o nome do
componente. Testei tirando a linha de propósito: a trava acusa.

💡 É a mesma família do "botão mudo" que já pegou o monte e a rodada 0: **o botão e o
desenho são duas peças, e quem leva uma leva a outra**.

↩️ **Reverter**: tirar a linha do `MascoteAtravessa` volta ao estado anterior.

## 22/09/2026 — 🚫📈 Prêmio não encarece mais o jogador (Bola de Ouro e artilheiro)

Ordem dele: *"não quero mais que o jogador bola de ouro aumente o piso do valor dele.
Nem artilheiro tb não"*.

**O que existia** (dois bônus de piso, os dois de +10):
- 🥇 **Bola de Ouro** — `careerBolaOuroPiso` somava +10 por título e o `valorOficial`
  somava isso por cima do maior entre livro/pago/tabela.
- ⚽ **Artilheiro** — liga (`scorerRewards`), Copa Legends (`copaRewards`) e Copa do
  Brasil (`CB_SCORER_FLOOR_BONUS`) mandavam +10 fixo pro `applyScorerValues`, que
  subia o livro de preços **e** o `paid` de TODA carta com aquele nome, em qualquer
  elenco (humano, bot e rival).

**Por que incomodava**: piso é a base de três contas ao mesmo tempo — salário
(= piso ÷ 10), preço de renovação e teto de venda. O craque premiado ia encarecendo
temporada após temporada e a folha dele explodia justamente no time que o revelou.

**O que ficou**: o prêmio continua, só que **em dinheiro no caixa** — artilheiro por
divisão (A 30 · B 20 · C 15 · D 10 · Várzea 6), artilheiro de Copa, e as 20 🪙 da Bola
de Ouro. Nada mudou no caixa.

**No código**: saíram `BOLA_OURO_PISO`, `pisoBolaOuro`, `SCORER_PISO_BONUS`,
`CB_SCORER_FLOOR_BONUS`, o `applyScorerValues` inteiro e o campo `scorerValues` das
duas actions da virada. O `valorOficial` voltou a ser só o `Math.max` de sempre.
Os textos de tela que prometiam o piso (regras da temporada, rodapé da artilharia da
liga e da Copa) foram corrigidos em PT e EN, e a novidade de 19/09 na home foi
reescrita pra não prometer mais o que o jogo não faz.
🗃️ `careerBolaOuroPiso` continua nos saves antigos como **resíduo**: ninguém escreve,
ninguém lê. Não precisa migração — e o valor que a carta já tinha no LIVRO de preços
(de artilharias passadas) continua lá, porque aquilo já virou preço de mercado.

↩️ **Reverter**: o commit é único e isolado. Voltar ele devolve os dois bônus.
✅ Travas rodadas: `npm run artilharia` · `melhor` · `fim` · `roteiro` · `monte` ·
`agencia` — todas verdes, e o `npm run build` fechou.

## 22/09/2026 — ❌ Erick, Carlos Bianchi e Artur removidos ✅ FEITO

Palavras dele: *"Erick pode remover, e Carlos Bianchi também. Não quero mais eles não.
Artur do Bragantino também remova"*. Saíram do baralho no mesmo dia em que entraram:
- ❌ `Erick · Vitória 2026` (era `L33_BR_ATA`)
- ❌ `Artur · Bragantino 2021` (era `L33_BR_ATA`)
- ❌ `Carlos Bianchi · Reims 1977` (era `L32_WORLD_ATA`) — a etiqueta de país dele
  saiu junto do `paises.ts`.
**Não recriar sem ele pedir.** A home não anunciou nada: a regra de "entrou e saiu no
mesmo dia" (logo abaixo) engoliu as três. O lote de cartas novas foi de 46 → **43**.

## 22/09/2026 — 🍷 SÓ EXISTE UM PINGA: o zagueiro do Inter de 1984 ✅ FECHADO

Decisão final dele, depois de eu criar cartas demais: *"remova o Pinga do
Corinthians"* e *"deixe apenas o Pinga zagueiro do Internacional de **1984**. Só terá
ele de Pinga no jogo"*.
- ❌ **Saiu** `Pinga · Corinthians 1995` (o mesmo zagueiro num 2º auge).
- ❌ **Saiu** `Pinga (Vasco) · Vasco 1955` (o atacante José Lázaro Robles — outra
  pessoa). **Não recriar nenhum dos dois sem ele pedir.**
- 📅 **Ficou** `Pinga · Internacional · 1984` — o ano mudou de 1992 pra 1984 por ordem
  dele. 84 é a **prata olímpica**, ANTES da lesão que arrebentou o joelho em 87; a bio
  foi ajustada, porque em 84 a volta por cima ainda não tinha acontecido.
- 🔑 Mudar o ano muda a CHAVE da carta (`nome|clube|ano`), que amarra histórico de
  gol/assistência e livro de preços. Aceitável aqui porque a carta de 1992 tinha um
  dia de ar. Quem for mudar ano de carta VELHA: pensar duas vezes.
- 🧹 `'Pinga'` saiu do `MESMO_JOGADOR` — com uma carta só, a chave não serve mais.

🫧 **E NASCEU UMA REGRA NOVA DO GERADOR DE NOVIDADES** (`scripts/novidades-jogadores.mjs`):
**carta que ENTRA e SAI no mesmo dia não vira novidade.** Sem isso, a home ia anunciar
*"Pinga entrou · Pinga saiu · Pinga saiu · Pinga (Vasco) entrou · Pinga (Vasco) saiu"*
— cinco linhas sobre cartas que jogador nenhum chegou a ver. É irmã da regra dele de
16/08 (*"bug nunca vira novidade"*): a home conta o que mudou PRO JOGADOR. O par
inteiro some, não só metade. Na prática limpou 6 linhas.

## 22/09/2026 — 🍷 (histórico) o Pinga certo era OUTRO (o do Vasco) — REVERTIDO acima

Diego: *"o Pinga que falei foi o meio-campo do Vasco, segundo maior artilheiro atrás
do Roberto Dinamite"*. Ou seja: **não era o zagueiro** que eu tinha entendido.

⚠️ **AGORA SÃO TRÊS CARTAS "PINGA" E DUAS PESSOAS DIFERENTES** — quem mexer numa não
está mexendo na outra:
- **Pinga** · Internacional 1992 · ZAG · e **Pinga** · Corinthians 1995 · ZAG →
  **a mesma pessoa**, Jorge Luís da Silva Brum, campeão da Copa do Brasil com os dois.
  (`'Pinga'` está em `MESMO_JOGADOR`.)
- **Pinga (Vasco)** · Vasco 1955 · ATA → **outra pessoa**, José Lázaro Robles. Leva o
  clube no nome de propósito, pra NÃO cair na chave do MESMO_JOGADOR.

📚 **Quem é o do Vasco**: canhota letal dos anos 50. Virou o **maior artilheiro da
história da Portuguesa**, chegou ao Vasco em 1953 e fez **250 gols** pelo clube. Foi
eleito **jogador do ano do Vasco cinco vezes** e artilheiro do time em 55 (34 gols),
58, 59 e 60. O auge da carta é **1955**.

⚠️ **Duas correções de fato que eu devo ao Diego, e que ficam aqui pra não se
perderem:**
1. As fontes o descrevem como **atacante/ponta canhoto**, não meia — por isso a carta
   nasceu em ATA. Se ele quiser como meia, é trocar de array, uma linha.
2. Com 250 gols ele é o **4º** artilheiro da história do Vasco (Roberto Dinamite 708,
   depois Romário e Ademir), não o 2º. Não muda o tamanho dele; muda o que a gente
   escreve em post.

❓ **Esperando ele decidir**: a carta **Pinga (Corinthians 1995)**, do zagueiro, nasceu
do meu mal-entendido. Ela é real e legítima (ele foi campeão da Copa do Brasil de 95
ali), então eu **não removi por conta própria** — tirar carta mexe em save de gente.
Se ele quiser fora, é um `git revert` daquela linha.

## 22/09/2026 — 🔍 Os 12 pesquisados a fundo + 9 campeões (lotes L33 e L34) ✅ FEITO

Diego: *"não sei quem são, então pesquise MAS A FUNDO até descobrir"*. Pesquisei um
por um (fontes no commit) e as 12 cartas saíram. Nenhuma foi chutada.

| carta | quem é, de verdade |
|---|---|
| **Douglas Franklin** · Bahia 1976 · 🎯 | Ídolo do HEPTA baiano (73-79): 184 gols em 456 jogos, **2º maior artilheiro da história do Bahia** e líder de assistências. Formado no Santos, companheiro de Pelé no Brasileiro de 68. Morreu em 9/8/2026. |
| **Viáfara** · Vitória 2010 · 🎯🃏 | Julián Viáfara, goleiro **colombiano**, tricampeão baiano (08-09-10) e peça do vice da Copa do Brasil de 2010 — **batia pênalti**, o que fez a torcida amar ele. |
| **Paulinho McLaren** · Santos **1991** · 🎯🃏 | ⚠️ O Diego pediu "do Porto", mas lá foram **16 jogos e 1 gol**. O auge é o Santos de 91: 23 gols no ano, 15 no Brasileirão, **artilheiro do Campeonato Brasileiro**. E o apelido nasceu ali — comemorou um gol (contra o Vitória!) imitando piloto de F-1 em homenagem ao Senna, uma semana antes do Senna vencer em Interlagos pela McLaren. Regra do baralho é "toda carta é o AUGE", então ficou Santos. Trocar é uma linha. |
| **Esquerdinha** · Vitória 1997 · 🎯 | José Marcelo Januário de Araújo. **Eleito pela torcida o melhor lateral-esquerdo da história do Vitória** (2017), tricampeão baiano, bicampeão do Nordeste — saiu do Leão pro Porto e foi campeão do penta português. Morreu em 2018, aos 46, de infarto numa pelada. |
| **John Lennon** · Cruzeiro 2017 · 🪵🃏 | John Lennon Silva Santos, goiano, lateral-direito. Cruzeiro em 2017 = **7 jogos e rescisão**; depois rodou Botafogo, CSA, Vila Nova, Juventude, Ypiranga. Exatamente a categoria que ele pediu. Escrito **John**, é como ele assina. |
| **Erick** · Vitória 2026 · 🎯 | Erick de Arruda Serafim, ponta-direita. Destaque da permanência de 2025 e a **contratação mais cara da história do Vitória** (R$ 7 mi por 50%). |
| **Yaya Banana** · Olympiacos 2018 · 🎯🃏 | Zagueiro camaronês de Maroua: ES Tunis, Sochaux, Platanias e **Olympiacos** (o maior clube dele, e o auge da carta). |
| **João Pica** · Académico de Viseu 2019 · 🪵🃏 | Zagueiro português de Moura, 1,85m, 337 jogos na carreira. Quatro temporadas e meia no Viseu, parou aos 35 e foi pra formação do clube. |
| **Neto Berola** · Vitória 2010 · 🎯 | Vice-artilheiro do Baiano de 2009 e destaque do vice da Copa do Brasil de 2010. (O auge absoluto dele foi o Atlético-MG — 13 gols em 2011, Libertadores em 2013 —, mas o Diego pediu a carta do Vitória.) |
| **Magrão (Palmeiras)** · Palmeiras 2004 · 🎯 | Márcio Rodrigues, volante alto. Melhor fase no Palmeiras (2000-05, 229 jogos), **convocado pra Seleção em 2004 e 2005**; depois Sul-Americana de 2008 com o Inter. Venceu um câncer no meio da carreira. ⚠️ **NÃO é o Magrão goleiro do Sport**, que FICOU no jogo — ordem dele: *"não remova o goleiro, são cartas diferentes"*. Leva o clube no nome pra ninguém confundir. |
| **Marllon** · Remo 2026 · 🎯 | ⚠️ O nome é **Marllon**, com dois L — então não bateu com o Marlon Freitas e não precisou de sufixo. Zagueiro e **capitão do Remo na Série A de 2026**, jogou todos os 1.620 minutos das 18 primeiras rodadas. Antes: Cuiabá (4 temporadas), bicampeão paulista no Corinthians. |
| **Pinga** · Corinthians 1995 · 🎯 | ⚠️ Ele **É ZAGUEIRO**, não meia — Jorge Luís da Silva Brum, prata olímpica em 84. A carta que já existia (Inter 1992) está certa; esta é a **2ª carta do mesmo cara**, a da Copa do Brasil de 95 com o Corinthians. Mesmo nome nas duas + `'Pinga'` em `MESMO_JOGADOR`, igual ao Roberto Firmino (Figueirense/Liverpool). |

🏆 **E 9 CAMPEÕES DO MUNDO** (`L34_*`), escolha dele na lista do `npm run campeoes`:
Ronaldão (São Paulo 1993 — **foi campeão em 94 sem jogar um minuto**, entrou no lugar
do Ricardo Gomes cortado na véspera) · Ricardinho (Corinthians 2000) · Khedira (Real
Madrid 2014) · Matuidi (PSG 2015) · Tolisso (Bayern 2020) · Fekir (Lyon 2018) ·
Exequiel Palacios (Leverkusen 2024) · Podolski (Colônia 2006, ⭐) · Mertesacker
(Arsenal 2015).
📊 **Os campeões foram de 160 → 169 no jogo; faltam 18.** E agora o **Brasil de 2002
está INTEIRO** (23/23), junto com a Espanha de 2010. Ainda faltam: 🇮🇹 06 (Peruzzi,
Oddo, Perrotta, Barone, Iaquinta) · 🇩🇪 14 (Weidenfeller, Höwedes, Mustafi, Durm,
Kramer) · 🇫🇷 18 (Areola, Adil Rami) · 🇦🇷 22 (Rulli, Nahuel Molina) · 🇫🇷 98 (Laurent
Blanc, Boghossian, Guivarc'h, Dugarry).

↩️ **Reverter**: `git revert` do commit tira as 21 cartas e nada mais.

## 22/09/2026 — 👑 Edmundo LENDA · Sandro Hiroshi · Lacraia · e o mapa dos CAMPEÕES

**Feito:**
- 👑 **Edmundo virou LENDA** (*"add Edmundo como lenda também, do Vasco da época
  dele"*). A carta já ERA o Vasco de 1997 — a época certa, a dos 29 gols e do prêmio
  de melhor do Brasileirão —, então só a categoria mudou (⭐→👑) e o nível foi de
  80-91 pra **84-93**. 🃏 O `folk` FICOU e a faixa segue larga de propósito: "dia de
  decidir sozinho, dia de ser expulso" é a alma da carta do Animal.
- 🆕 **Sandro Hiroshi** (São Paulo 2000, 🎯, 🃏) — chegou ao SPFC como vice-artilheiro
  do Paulistão de 99 e fez dupla com o França; entrou pra história pelo escândalo do
  "gato" (era um ano mais velho que a certidão). Nível modesto porque a passagem dele
  foi de 6 gols em 39 jogos: a fama é a história, não a artilharia.
- 🖤 **Lacraia** (Santa Cruz **1914**, 🎯, 🃏) — *"pesquise também"*, e valeu a pesquisa:
  **Teófilo Batista de Carvalho**, estudante de engenharia, foi um dos 11 meninos que
  fundaram o Santa Cruz em 3/2/1914, **desenhou o escudo** e foi o **primeiro jogador
  negro do futebol de Pernambuco e do Norte-Nordeste**. O preto do escudo do Santa
  está lá por causa dele. É a **carta mais antiga do baralho**. Fontes:
  santacruzpe.com.br/historia e pt.wikipedia.org/wiki/Lacraia_(futebolista).
  ⚠️ Nada foi chutado — e o nível é modesto porque não existe estatística de 1914 pra
  inventar craque. Ele é gigante pela história.

🏆 **NASCEU O `npm run campeoes`** (`scripts/campeoes-do-mundo.mjs`), pra responder
*"me fale campeões do mundo desde 1994 que ainda não estão no jogo"*. Ele guarda as 8
delegações campeãs (94 BRA · 98 FRA · 02 BRA · 06 ITA · 10 ESP · 14 ALE · 18 FRA · 22
ARG) e cruza com os três baralhos usando a régua do `npm run acha`.
**Resultado: 160 campeões já estão no jogo, 27 faltam** — e a Espanha de 2010 está
**inteira** (23/23). Os 27 (todos conferidos um a um):
- **1994 🇧🇷 (1)**: Ronaldão
- **1998 🇫🇷 (4)**: Laurent Blanc · Boghossian · Guivarc'h · Dugarry
- **2002 🇧🇷 (1)**: Ricardinho
- **2006 🇮🇹 (5)**: Peruzzi · Oddo · Perrotta · Barone · Iaquinta
- **2014 🇩🇪 (8)**: Weidenfeller · Mertesacker · Höwedes · Mustafi · Durm · Khedira ·
  Kramer · Podolski
- **2018 🇫🇷 (5)**: Areola · Adil Rami · Matuidi · Tolisso · Fekir
- **2022 🇦🇷 (3)**: Rulli · Nahuel Molina · Exequiel Palacios
⚠️ **As delegações são escritas à mão no script e podem ter furo** (um reserva
esquecido). Nome que o Diego citar e não aparecer lá = lista incompleta, não "não foi
campeão". Quem for completar, edita a lista no próprio arquivo.
⏳ **Esperando ele dizer quais desses 27 quer** — nenhum foi criado ainda.

## 22/09/2026 — 🃏 Lote L33 + Koeman e Félix viraram LENDA ✅ FEITO (parte pendente abaixo)

Dois áudios do Diego com uma lista comprida de jogadores. **Feito:**
- 👑 **Ronald Koeman virou LENDA** (*"além desse Koeman zagueiro, quero que vire
  lenda"*) — fame 4→5, nível 83-89 → **86-92**.
- 👑 **Goleiro Félix virou LENDA** (*"coloque goleiro Félix como lenda também, já que
  hoje acho que ele tá craque ainda"*) — fame 4→5, nível 80-84 → **84-89**. ⚠️ O nível
  subiu POUCO de propósito: a lenda dele é histórica (goleiro do tri de 70), e inflar
  o nível mudaria resultado de jogo — ele pediu a categoria, não a força.
- 🆕 **10 cartas novas** (`L33_BR_*` e uma no `L31_EU_GOL`): Ronald Koeman Jr (Oostende
  2019, 🪵 foi profissional, 🃏 — a fama é o sobrenome) · Claudinho (Bragantino 2021,
  ⭐) · Carrascal (Flamengo 2025, ⭐) · Lucho Acosta (Fluminense 2025, 🎯) · Maicon
  (Grêmio) (Grêmio 2017, 🎯) · Álvaro Montoro (Botafogo 2025, 💎) · Artur (Bragantino
  2021, 🎯) · Allan (Palmeiras) (Palmeiras 2026, 💎) · Márcio Santos (Botafogo 1995,
  🎯) · Puma Rodríguez (Vasco 2024, 🎯).
- ⚠️ **NOME REPETIDO**: "Maicon (Grêmio)" e "Allan (Palmeiras)" levam o clube no nome
  porque já existiam Maicon (lateral) e Allan Delon. Nome igual emboladaria o
  histórico por carta (chave `nome|clube|ano`). Mesmo caminho do "Vitor Roque
  (Barcelona)".

**JÁ ESTAVAM (respondendo o que ele perguntou):** Magno Alves (Ceará 2010) · Edu
Dracena (Santos 2011) · Chicão (Corinthians 2009) · Gatito Fernández (Botafogo 2017 —
ele falou "Garoto Fernandez") · Vitor Roque (Athletico-PR 2023, já como 💎) · Marlon
Freitas (Botafogo 2024).

🔎 **NASCEU O `npm run acha`** (`scripts/acha-carta.mjs`), por causa de DOIS erros meus
no mesmo dia montando lista de carta nova:
1. comparei **nome inteiro** e disse que 82 nomes faltavam — 5 já estavam, porque no
   baralho eles vivem só pelo APELIDO (Figueroa, Asprilla, Tevez, Guerrero, Rincón);
2. refiz por sobrenome mas **li a saída com `tail`** — e mandei pro Diego o
   **Chicharito** (Man United 2011) e o **Rafael Márquez** (lá é "Rafa Márquez",
   Barcelona 2006) como faltando, quando os dois estavam.
A ferramenta compara PALAVRA INTEIRA, separa achado forte (apelido igual) de fraco (só
o primeiro nome) e **nunca corta linha**. Quem for montar lista de carta nova: rode
ela primeiro, e não leia com `tail`.

⏳ **PENDENTE — 12 nomes esperando o Diego, pela regra dele de 18/08** (*"qd vc N souber
qm é a pessoa é como é me fala pow"*). Não inventei nenhum:
- **Não sei quem é / não tenho referência**: Douglas Franklin (meio do Bahia) ·
  goleiro Viáfara (Vitória) · Paulinho McLaren (Porto) · João Pica (zagueiro
  português) · Esquerdinha (lateral-esquerdo do Vitória, não sei a época) · Jhon
  Lennon (lateral-direito, 🪵 — falta clube e ano) · Erick (Vitória — falta posição e
  época) · Yaya Banana (zagueiro camaronês — sei quem é, não sei o clube do auge).
- **Existe carta com esse apelido, mas é OUTRA pessoa — preciso que ele confirme**:
  **Pinga** (o do baralho é ZAGUEIRO do Internacional 1992; ele falou de um MEIA) ·
  **Magrão** (o do baralho é o GOLEIRO do Sport 2008; ele falou de um meia do
  Internacional e do Palmeiras) · **Marlon do Remo 2026** (o do baralho é o Marlon
  Freitas do Botafogo) · **Neto Berola** (não está no jogo; sei quem é, não sei o ano
  dele no Vitória).

↩️ **Reverter**: `git revert` do commit devolve tudo, inclusive o Koeman e o Félix
pra craque.

## 22/09/2026 — 🌍 14 famosos novos no baralho MUNDO (lote L32) ✅ FEITO

Diego: *"acho que tem poucas cartas no baralho mundo… precisa de bem mais. Só que
tem que ser famoso, sendo ruim ou bom tanto faz, e qualquer posição. Me manda aí os
faltantes que não poderiam faltar"*. Eu cruzei 153 nomes com os três baralhos, mandei
a lista, e ele escolheu 14 na mão: *"add esse com categoria, nível, ano e clube auge"*.

**Quem entrou** (`L32_WORLD_*` em `data.ts`): 🧤 Bono (Sevilla 23) · ↔️ Serge Aurier
(PSG 16) · 🛡️ Iván Córdoba (Inter 10) · 🎩 Ariel Ortega e Gallardo (River 97),
Michael Essien (Chelsea 07), Thomas Partey (Atlético 20), Lakhdar Belloumi (GCR
Mascara 82) · ⚡ Martín Palermo (Boca 00), Claudio Caniggia (Atalanta 90), Carlos
Bianchi (Reims 77), Frédéric Kanouté (Sevilla 07), Emmanuel Adebayor (Arsenal 08),
Asamoah Gyan (Sunderland 11).
O baralho Mundo foi de **178 → 192 cartas** e de 16 → **25 craques** (as 5 lendas
seguem as mesmas). Gana ganhou 3 cartas, Togo estreia com 1, Mali vai a 2.

⚠️ **A LIÇÃO QUE VALE PRA TODA CARTA NOVA: conferir pelo SOBRENOME, não só pelo nome
inteiro.** Minha primeira checagem (nome inteiro, normalizado) disse que 82 nomes
faltavam. A segunda, por sobrenome, pegou **5 que JÁ EXISTEM** com a carta brasileira
deles e que eu quase mandei de novo: **Elías Figueroa** (Internacional 76),
**Asprilla** (Palmeiras), **Tevez** (Corinthians), **Guerrero** (Corinthians) e
**Freddy Rincón** (Corinthians). No baralho eles estão só pelo sobrenome, então
comparar nome inteiro nunca acha.

📏 **Nível calibrado pelas cartas que já existiam**, pra não inflar: craque ≈ 81-87 /
88-92 (referências Godín 84-90, Riquelme 84-90, Yaya 85-91, Mahrez 83-89) · bom ≈
74-79 / 84-87 (Édouard Mendy 78-86, Lauren e Nagatomo 74-84). 🃏 `folk` só em quem é
lembrado pela HISTÓRIA além do futebol: Ortega, Palermo (os 3 pênaltis perdidos),
Caniggia, Belloumi (a zebra de 82) e Gyan (o pênalti nos acréscimos de 2010).

**Passos do roteiro cumpridos**: `npm run paises` verde (as 14 nacionalidades
etiquetadas — carta do Mundo sem etiqueta fica FORA de toda Copa) · `npm run
novidades` rodado, com `data.ts` + `catalogo-snapshot.json` + o gerado commitados
juntos · `npm run build`, `carta`, `rank`, `copa`, `piramide` e `telas` verdes.
↩️ **Reverter**: `git revert` do commit — as cartas somem do baralho e nada mais é
tocado (save que já tiver um deles guarda a cópia da carta, como toda carta do jogo).

**Sobrou pra depois**: tenho **45 nomes de segunda onda** já conferidos e fora de
todos os baralhos (Wataru Endo, Doan, Kamada, Hasebe, Zaha, Kolo Touré, Naybet,
Timoumi, Tshabalala, Seydou e Naby Keïta, Al-Dawsari, Al-Qahtani, Akram Afif, Younis
Mahmoud, Omar Abdulrahman, Azmoun, Hao Haidong, Zheng Zhi, Sun Jihai, Fan Zhiyi,
Schwarzer, Kasey Keller, Leon Bailey, David Suazo, Bryan Ruiz, Bacca, Adolfo
Valencia, Willington Ortiz, Rubén Sosa, Justo Villar, Haedo Valdez, Antonio Valencia,
Erwin Sánchez, Nelsen, Finidi George, Obafemi Martins, Mikel, Muntari, Pavel Pardo,
Luis García, Inamoto, Enyeama, Radebe, Grobbelaar, Ndlovu, Schiaffino, Obdulio
Varela, Alberto Spencer, Ghiggia, Negrete, Aboutrika, Chicharito, Rafael Márquez,
Mahdavikia, Kudus, Kewell). **Esperando ele dizer quais quer.**

## 21/09/2026 — 🔬 ACHADO: lenda vai pro leilão e NINGUÉM dá lance (é o PISO)

Diego, olhando a carreira antes de jogar: *"tô vendo ir pro leilão Paul Scholes,
lenda, nenhum lance. Cafu do Milan indo pro leilão, nenhum lance. E aí do nada
aparece um jogador craque no leilão, aí vai um monte de lance. Tô achando
estranho"*. Ele está certo, e **não é acaso**.

**A causa, medida (não deduzida)**: da 2ª temporada em diante o baralho vem do
elenco dos bots, e cada carta volta com um PISO (`paid`, tirado do livro
`marketValues`). No `cpuEnvelope` (`store.tsx`) a regra é
`if (wallet < floor || cap + 3 < floor) continue` — ou seja, **se o piso passa do
que o bot acha que a carta vale, ele não dá lance NENHUM**, nem um lance baixo.
Carta nova do catálogo tem piso ZERO, então leva lance de todo mundo. É por isso
que o craque "que aparece do nada" é disputado e a lenda sai de graça.

**A medição** (`node scripts/bancada-piso-lenda.mjs` — joga o pregão de verdade,
3 salas de 8, acaso travado, mudando SÓ o piso). % de LENDAS sem nenhum lance:

| piso | bot pobre (jogo rápido) | bot com 230 🪙 (Série A) |
|-----:|------------------------:|-------------------------:|
| 0    | 2%                      | 5%                       |
| 30   | 61%                     | 7%                       |
| 40   | 61%                     | 32%                      |
| 60   | 73%                     | 43%                      |
| 80   | 100%                    | 100%                     |

⚠️ **CORREÇÃO IMPORTANTE (a 1ª rodada desta bancada mentiu).** A primeira medição
rodou só com o bolso do JOGO RÁPIDO, que é pobre, e deu "61% das lendas sem lance
com piso 30". Isso era **falta de dinheiro** (`wallet < floor`), não o teto do
bot — com o caixa de carreira (Série A = 230) o mesmo piso 30 dá só 7%. Quem
copiar número desta bancada: **sempre com o bolso da divisão**, senão exagera.

**O que É verdade, e é o problema real**: o teto do bot por carta vem de uma
curva FIXA no nível dela (`fairPrice` em `store.tsx`) — pra lenda dá **33 a 64,
e nunca cresce**. O preço da carta, esse cresce: `recordPrice` grava o que foi
pago (inclusive pelo usuário) e o bônus de artilheiro soma por cima. Então, numa
carreira adiantada, o piso passa dos 64 e **a partir daí o bot fica mudo pra
sempre** naquela carta — que é exatamente o que o Diego está vendo com Paul
Scholes e Cafu. Acima de piso 80 é 100% de silêncio nos DOIS bolsos.

**E o que ele já respondeu**: propus que a carta fosse cedendo de preço quando não
vende, e ele cortou na hora — *"mas isso já acontece, quando ninguém pega ele vai
pro monte valendo metade, não?"*. Está certo (`montePush` → `halveListed` →
`recordPrice`); essa metade do plano foi descartada. O que falta é só o outro
lado: **o teto do bot acompanhar o mercado daquela carreira em vez de ser número
fixo.** Esperando o sim/não dele.
🚫 **Nada foi mexido no jogo** — só a bancada entrou no repo.

## 21/09/2026 — ❤️🖤 Pantera Negra FC é FLAMENGO de coração ✅ FEITO

Diego, depois do batismo pronto: *"ah, time de coração do Pantera Negra FC é
Flamengo hein"*. O batismo do ericrabelo29 tinha entrado em 20/09 **sem** time de
coração (a linha do banco estava com `time_coracao` nulo e o post saiu sem o selo).
Agora: `update esc_socios set time_coracao = 'Flamengo'` feito e conferido, o
comentário do clube em `data.ts` registra o coração, e o post foi gerado de novo com
`--coracao Flamengo` (regra: ❤️ o time de coração VAI no post sempre que a gente
souber).

## 21/09/2026 — 🔵⚫⚪ Batismo Grêmio FBPA (danieldias11) ✅ FEITO

Pedido: *"novo time de batismo danieldias11@gmail.com / Grêmio FBPA / time de coração
Grêmio também / segue artes, no lugar de um time da Série A. Me fale os que tem ainda
pra eu trocar"*. Mandei a lista dos bots da Série A e ele escolheu: *"troque pelo SC
Ferrari e botei o SC Ferrari na Série B no lugar de um bot"*.

**Quem é**: o gaúcho de chapéu, manto rasgado e chimarrão. Preto + azul com filete
branco. Fundador **nº75** · sócio **nº56** · tier ouro · coração **Grêmio**.

**Arte** (dentro do teto de 75 KB): escudo 270×360 · **29,7 KB** · mascote 252×440 ·
**41,7 KB** — **71,4 KB** no total. A prancha veio em chroma VERDE, e o recorte
precisou de `scripts/tira-chroma-gremio.py`: neste clube **nenhum verde é do desenho**
(é azul/preto/branco), então todo pixel esverdeado virou vão, com despill de 2 px na
franja nova. ⚠️ Quem copiar esse script pra outro clube **confere a paleta antes** —
em clube que tem verde de verdade, isso come o desenho.

**As três pernas, as três fechadas**:
- **Código** — `LOGOS_PRONTAS` · `MASCOTES` + `MASCOTE_NOME` + `CARIMBO_GOL` ·
  `data.ts` · `apoio.tsx` (ouro + `FUNDADOR_75`) · `manto.ts`
  (`#141C24`/`#0B6397`, com `MANTO_TRI.gremio_gaucho = '#EDECEB'` pro filete) ·
  `batismos.ts` (linha + campo `manto` com as MESMAS 2 cores) · `salao-camisas.ts` +
  `public/mantos-salao/` · e a linha em `scripts/checa-batismos.mjs`.
- **Banco** — `user_colors` (ouro, manual) · `esc_socios` (nº56, `valido_ate`
  2099-12-31, manto, mascote, `escudo_time`, coração) · `esc_fundadores` (n=75) ·
  `esc_nomes_batismo` (nome puro; o gatilho criou FC e EC). Todas conferidas por
  query depois de gravar.
- **Deploy** — na `main`.

**A troca de assento** (`data.ts`): Grêmio FBPA entra na **Série A** no lugar do
**SC Ferrari**, e o SC Ferrari **desce pra Série B** no assento do 🤖 Comercial das
Gerais (que some da pirâmide mas continua existindo em `CLASSIC_CLUBS`). ⚠️ **Nenhum
`OLD_NAME` novo**: o Ferrari não foi renomeado, só mudou de divisão — e ele já tem
corrente própria (Painitto FC). Mapear faria os dois desenharem o mesmo escudo.
🚫 E, pela regra de 05/09, **o post não diz de quem era o assento** (sem `--antigo`):
o Ferrari continua no jogo.

🔢 **AS DIGITAIS DO `npm run ascegas` MUDARAM — e está certo.** Novas oficiais:
`81961c21` · `40c43c96` · `f4e7a655`. Antes de trocar eu **provei** que o leilão em si
não mudou: `scripts/prova-as-cegas.mjs` inclui `m.teamName` no resumo, então trocar o
nome de um clube da Série A muda a digital mesmo sem nada de mecânica mudar. Rodando
o mesmo resumo **sem o nome do time**, os dois lados (antes e depois) deram idênticos:
`2256464b` · `aca7a932` · `83793089`. O porquê ficou escrito dentro do próprio script,
pra próxima sessão não entrar em pânico.

↩️ **Reverter**: `git revert` dos dois commits do batismo devolve tudo (o Ferrari volta
pra Série A e o Comercial das Gerais pra Série B). O banco é à parte — sairia com
`delete` nas 4 linhas do e-mail dele.

## 21/09/2026 — 🛡️ Linhazinha na Sala de Troféus ✅ FEITA (opção C)

Pedido dele: *"na área do online, um dos troféus, coloque uma linhazinha assim
também: quer ter escudo e mascote pulando na tela? clique aqui… ou algo assim: tá
vendo todos esses times com escudo e mascote? todos eles são usuários reais… é pra
pessoa não achar que é um bot… mas tudo pequeno ali pra não ficar muita informação.
Me dá ideias aí"*.

**O problema que ele viu**: quem chega novo olha os escudos e mascotes no ranking da
sala e não sabe que tem GENTE DE VERDADE atrás deles — acha que é bot.

**O lugar**: `ligahub.tsx`, logo abaixo da linha de pontuação ("🏆 Título +5 · 🎟️
Top 8 +1 · 🔻 Rebaixamento −1…"), no MESMO tamanho miúdo. O clique abre a tela de
apoio, que é onde mora o batismo (o que dá escudo e mascote).

🖊️ **A FRASE VIROU DELE** (2ª rodada): *"o escudo que aparece nos times e o mascote
que pula na tela são de jogadores de verdade. Algo assim, melhore"*. Ele acertou o
miolo — citar as DUAS coisas que a pessoa vê.
⚠️ **A única palavra trocada: "jogadores" → "gente".** No jogo, **jogador é a CARTA**
(Pelé, Romário); "jogadores de verdade" leria como *carta real*, não *pessoa real* —
o contrário do que ele quer dizer. Vale pra qualquer texto novo: quando o assunto é
a PESSOA que joga, escrever "gente"/"usuário", nunca "jogador".

🔁 **3ª rodada**: *"mas tem que falar MASCOTE PULANDO na tela, algo assim"*. Ele tem
razão — "pulando" é o que a pessoa está VENDO acontecer, e é o que liga a frase ao
bicho que acabou de atravessar a tela. As três versões passaram a usar a palavra dele.

**Os 3 acabamentos** (`node scripts/mockup-trofeus-convite.mjs`):
- **A** 🛡️ *Esse escudo no time e esse mascote pulando na tela são de gente de verdade.* → Quer o seu aqui?
- **B** 🛡️ *Escudo no time, mascote pulando na tela — tudo de gente de verdade, não de bot.* → Quer o seu?
- **C** ✅ 🛡️ *Cada escudo e cada mascote pulando aí na tela tem dono de verdade.* → Quer ser um deles?

✅ **ESCOLHA DELE: a C** (*"Letra C"*), e está no ar. Como ficou, em `ligahub.tsx`
(`SalaTrofeusRapida`): uma linha só, `text-[10px]` — o MESMO tamanho da regra de
pontuação —, separada dela por um tracinho tracejado leve, com **pulando aí na tela**
e **dono de verdade** em negrito e o convite em roxo, sublinhado. O clique abre
`ApoieButton startScreen="batismo"`, ou seja cai DIRETO no batismo (que é o que dá
escudo e mascote), sem passar pela tela de escolha. Nasceu BR/EN.
↩️ **Reverter**: apagar o `<p>` novo e o import do `ApoieButton` — a linha é solta,
não mexe em nada do ranking nem do banco.

## 21/09/2026 — 📬 O contato sutil voltou pras salas online

Diego: *"esse mesmo texto sutil falando do Instagram e etc também deve aparecer em
cima do apoia nas salas online também"*.

O `GameFooter` tem um ramo próprio pro lobby que mostrava SÓ o bloco de apoio — os
contatos tinham sido tirados de lá pra "não duplicar". Só que a lista de salas é uma
das telas mais vistas do jogo, e quem achava bug JOGANDO ONLINE ficava sem saber
onde falar. Agora a linha aparece logo acima do Apoie, no mesmo tom apagado do
rodapé da home (é recado, não banner) e com a cor ajustada pro fundo preto
(`.ll-support-home-tail` é `#0c0c0c`).

## 21/09/2026 — ⭐ CHAMPIONS LEGENDS construída (no ar com selo EM BREVE)

Ele viu o mockup e mandou: *"pode fazer"*, com quatro ordens juntas — e as quatro
foram cumpridas:
1. *"N terá nomes europeus pois usarmos usuários de batismos mms por ordem de série
   a e dps série b C d e várzea q tiver bots na ordem de preferência"* ✅
2. *"já pode colocar lá juntos das ligas"* ✅
3. *"organize melhor no modo de criar sala pois estão apertadas demais"* ✅
4. *"N libere ainda ela pra todos não, coloque um selo de em breve"* ✅

### O formato (real, 2024+)
**Sem grupo.** 36 numa tabela só = os **8 primeiros da liga** + **28 convidados**;
cada clube joga **8 adversários diferentes**; **1º-8º** oitavas direto · **9º-24º**
repescão ida e volta (8 sobem) · **25º-36º** fora. Das oitavas em diante é o motor
da Copa dos 8 (ida e volta, final única), igual à Liberta.

### Onde mora
- **`src/escalacao/champions.ts`** (novo) — quem entra, potes, calendário e cortes.
  Fora do `store.tsx` porque é conta pura e dá pra travar sozinha.
  · `championsConvidados()` varre a pirâmide **A → B → C → D → Várzea** pondo clube
    **com DONO na frente** do genérico. Medido: **28 de 28 têm dono**.
  · `calendarioChampions()` — 8 rodadas × 18 jogos. Cada clube pega 8 adversários de
    **potes diferentes do seu**, nunca repetindo, **4 em casa e 4 fora**.
    ⚠️ O mando deu trabalho: alternar por rodada punha um pote inteiro em casa, e o
    guloso simples deixava 9 com 3 e 9 com 5. O que fecha é um **acerto por
    CORRENTE** (A manda em B, B em C, e o C é que está devendo — vira os três).
- **`store.tsx`** — `seedChampions` · `playChampionsRodada` · `playChampionsRepescao`
  (ida e volta com pênalti no agregado) · ações `START_CHAMPIONS`,
  `PLAY_CHAMPIONS_RODADA`, `PLAY_CHAMPIONS_REPESCAO`. Zera junto com a Liberta na
  virada de temporada (é POR TEMPORADA).
- **`screens.tsx`** — `EscChampions` (tabela INTEIRA dos 36 + tela da espera) e o
  bannerzão de abertura com as regras, do lado do da Liberta.
- **`sport.ts`** — `CHAMPIONS_GERAL = false` + `CHAMPIONS_TESTERS`. **Pra liberar
  geral é só virar pra `true`** — nada mais precisa mudar.

### 🧩 E a tela de criar sala saiu do aperto
O `Seg` punha tudo numa linha só com `nowrap`; com 4 opções já espremia (e a
Champions seria a 5ª). Agora, **de 4 opções em diante vira grade de 2 colunas**, e
no número ímpar a última ocupa a linha toda. **Até 3 continua na linha** — nada do
que já estava bom mudou. Ganhou também `travados`, que é o que sustenta o selo
EM BREVE (a opção aparece e não deixa escolher). Mockup antes/depois:
`node scripts/mockup-criar-sala.mjs`.

### Trava
**`npm run champions`** — 4 blocos: os convidados (ordem e dono), o calendário (8
jogos, sem repetir, 4×4 de mando, potes), os cortes/repescão, e uma **competição
INTEIRA jogada** até sobrar um campeão (16→8→4→2).

### 🐛 BUG PEGO NA HORA (21/09) — o clube convidado sumia do motor
Ele perguntou *"mas tem jogador suficiente pra não ter bot com 36 times?"* e, indo
conferir pra responder, achei que eu tinha repetido **o bug que foi pro ar em 20/08
com a Liberta** (print do wfreitasp): `simMatch` resolve nome e força procurando em
`state.league` e `state.liberta.times` — e eu **não tinha posto** `state.champions`.
Os 28 convidados apareceriam com nome `'?'` e jogariam como time mediano 70/70 em
vez da força deles. Consertado nos 2 lugares.
🔒 **E virou trava de CÓDIGO**: o `npm run champions` agora lê o `store.tsx` e
reprova se existir lugar que acha clube da Liberta e não acha o da Champions. Quem
criar a 4ª competição e esquecer, o teste pega.

### ✅ E a resposta pro "tem jogador suficiente?"
**Tem — porque os 28 convidados NÃO usam carta nenhuma.** Eles não têm elenco: jogam
por `baseAtk`/`baseDef`, exatamente como os 24 clubes do continente da Liberta.
Quem tem elenco de verdade são só os **8 que vieram da liga**. Ou seja, **zero
perna-de-pau entra por causa da Champions** — a regra nº 1 dele está de pé.

### ⏳ Falta (esperando ele)
1. **Liberar pra todos** (`CHAMPIONS_GERAL = true`) + a linha em `novidades.ts` —
   🚫 não entra novidade enquanto está EM BREVE, senão anuncia o que ninguém joga.
2. Ele ainda não disse se o **tamanho** da competição incomoda (8 rodadas +
   repescão + oitavas + quartas + semi + final é mais longo que a Liberta).

## 21/09/2026 — ⭐ CHAMPIONS LEGENDS no formato REAL (mockup mandado, esperando ele)

Ele perguntou *"como seria a competição Champions League, igual fizemos da Libertadores
no modo online"*. Ofereci a cópia da Liberta com clubes europeus e ele cortou:
*"quero formato real de hj como seria"*. Depois: *"manda.. principalmente da parte q os
8 primeiros tem q ficar aguardando tb o mata mata da repescagem sei lá"*.

### O formato real (Champions 2024+), traduzido pro jogo
- **Sem grupo.** 36 clubes numa TABELA ÚNICA: os 8 primeiros da liga + **28 europeus**.
- Cada clube joga **8 adversários diferentes** (4 casa / 4 fora), 2 de cada pote.
- Corte: **1º-8º** direto pras oitavas · **9º-24º** repescão ida e volta (8 sobem) ·
  **25º-36º** fora. Das oitavas em diante é igual à Liberta (ida e volta, final única).

### ⚠️ O QUE ELE PEGOU — e é o ponto que decide
Quem termina no **top 8 fica uma fase inteira parado**, esperando o repescão dos outros.
Na Liberta isso não existe (quem passa joga as oitavas direto). Bate na regra de ouro
dele: *"nada pode atrasar o ritmo do jogo"*.
👉 Saída desenhada no mockup: repescão **simulado corrido (~20s)**, botão
**⏩ PULAR PRO SORTEIO** desde o 1º segundo, e a tela vende a espera como PRÊMIO
("você já está dentro") em vez de castigo.

### Mockup
`node scripts/mockup-champions.mjs /tmp/champions.png` — duas telas (a tabela de 36
INTEIRA; e a tela da espera) + as 4 notas de decisão.
⚠️ **A 1ª versão saiu com JANELA** (só o topo + a vizinhança dele) e ele cortou na hora:
*"pq n cabe a tabela toda? queria ela toda poow"*. E ele tinha razão — a tabela da liga
já mostra 20 e ninguém reclama de rolar. **Régua: tabela é INTEIRA.** O que segura a
leitura não é esconder linha, são as **faixas de corte** grudadas no topo enquanto rola
(verde 1-8 · amarelo 9-24 · cinza 25-36), o **🔨** marcando quem veio da liga do usuário
e a borda preta no clube dele.
Mora no repo de propósito: mockup fora do repo se perde com o scratchpad.

### ⏳ ESPERANDO A PALAVRA DELE
1. Formato real (36 numa tabela, com repescão) **ou** cópia da Liberta com clubes europeus?
2. Se for o real: aprovar a solução da espera (corrido + pular).
3. A lista dos **28 nomes europeus** de paródia (o mockup tem um rascunho: Baião de
   Munique · Ajax de Limpeza 🧽 · Livrapul · Pariz São Germano · Juve Tudo Nosso…).
🚫 **Nada codado** — só o gerador do mockup.

## 21/09/2026 — 🎭 A faixa roxa do "SOLTOU O BICHO" saiu da tela

Diego: *"essas frases roxas subindo não precisa aparecer quando solta o mascote,
porque já tem o mascote passando na tela. Pra não poluir muito né"*. Tinha as duas
coisas ao mesmo tempo: o bicho atravessando E uma faixa roxa escrita embaixo (uma por
emote, empilhadas). Saiu a faixa, o `@keyframes escMascFaixa` e o `idx` do map —
o bicho cruzando continua igual. A fila de reações já escondia a mascote quando
consegue desenhá-la, então não sobrou duplicata em lugar nenhum.
Regra gravada no CLAUDE.md: animação grande não ganha legenda escrita repetindo.

## 21/09/2026 — 🐊 O "SOLTA A SUA MASCOTE" NO MONTE DE SOBRAS (só na Tocaia)

*"Coloque o solta mascote botão embaixo do campinho. Apenas no modo Tocaia e
quando aparece o monte de sobras… porque o solta o mascote já tem no modo
envelope às cegas."* E, confirmando depois: *"é no monte final de sobras que
aparece 15s pra pessoa pegar o jogador de graça. Mas só no modo Tocaia."*

### 🧨 EU ESPALHEI, ELE CORTOU — e a lição vale pra qualquer pedido de lugar
Na primeira volta eu pus o botão em DUAS telas: o pregão da Tocaia **e** o Monte.
Resposta dele, na hora: *"como assim em cada um?? Eu disse APENAS no monte de
sobras."*

👉 **"Apenas no X" quer dizer apenas no X.** Quando ele nomeia UM lugar, não é
"esse e os parecidos" — mesmo quando o outro lugar parece fazer sentido pra mim.
Se eu achar que falta em outro canto, eu PERGUNTO; não emendo por conta.

### ✅ Como ficou
Um lugar só: **`EscMonte`, logo abaixo do campinho**, e travado em
`state.holandes` — sala de envelope cego não mostra nada. O botão do envelope
continua exatamente onde sempre esteve (na barra "😈 CUTUCA QUEM TÁ PENSANDO" do
pregão, que só nasce depois de lacrar). A regra de sempre segue valendo: só
aparece pra quem tem clube batizado, sem placeholder pra quem não comprou.

**Por que faltava:** na Tocaia ninguém lacra (quem corre é o preço), então aquela
barra do envelope não existe — e quem tem mascote ficava sem soltar o bicho a
noite inteira nesse modo.

### 🔒 `npm run mascote-botao`
- exige **2** usos do botão no `screens.tsx` (o do envelope + o do Monte). Três
  significa que eu espalhei de novo — a trava nasceu desse erro;
- exige o `state.holandes &&` na frente do botão do Monte;
- prova, no jogo de verdade, que ele **não** aparece no pregão da Tocaia;
- e o Monte fica atrás de `-- --completo`, porque pra chegar nele a máquina tem
  que jogar o pregão inteiro (~8-10 min, medido: ~2 min por setor). Trava que
  demora 10 minutos ninguém roda, e trava que ninguém roda não protege nada.

### 🧪 `bancadaSocio` (novo, em `manto.ts`)
O botão só existe pra quem tem clube batizado, e a bancada não faz login — então
não dava pra fotografar nem conferir. Agora um hook de bancada finge o sócio na
página aberta. Ninguém do jogo chama isso.

### ⚠️ Duas vezes a trava mentiu antes de prestar (de novo)
1. a janela do casamento `YourPitch → MascoteJab` era curta demais e reprovava
   código CERTO (conferido na foto);
2. ela procurava o texto **"MONTE FINAL"** pra saber se tinha chegado no Monte —
   só que essa frase também aparece na REVELAÇÃO (*"Nenhum lance. Vai pro Monte
   Final 🪣"*). A trava achava que já estava no Monte enquanto ainda rolava o
   pregão, e cobrava um botão que ali nem devia existir. A marca boa é
   *"As sobras do pregão"*, que só a tela do Monte tem.

---
## 21/09/2026 — 🔑 "ENTRO NA SALA, ATUALIZO E ME DESLIGA" (Neymarzetti, sala JCQO35)

Relato do Diego: *"quando eu entro numa sala e atualizo a página tá me desligando…
quando atualizo não desliga em qualquer área do site, mas quando entro numa sala e
atualizo tá desligando"*.

### 🔍 O que os logs do Supabase mostraram
- A conta dele fez **8 logins em 11 minutos** (03:37→03:48 UTC), sem nenhum
  `token_refreshed` entre eles e sem `logout`.
- O servidor **nunca recusou nem revogou** nada (zero 401/403, zero refresh falhado).
- No reload, o celular **não fez chamada nenhuma de auth**: abriu sem sessão.
👉 Conclusão: a sessão vivia **só na memória da página**. É o que a biblioteca de
login faz quando o **armazenamento do navegador está CHEIO**: `supportsLocalStorage()`
(auth-js) faz um `setItem` de teste ao criar o cliente; estourou a cota → desiste do
localStorage pela página inteira e guarda a sessão na memória → morre no reload.
E o jogo enchia o armazenamento com **o chat de cada sala** (`esc-chat-<id>` e
`esc-lobbychat-<id>`, 60 mensagens cada, um par por sala, NUNCA apagados) — meses
de salas viram centenas de chaves mortas, somadas ao save da carreira (grande) e ao
cofre de carreiras por conta.

### ✅ O que foi feito
- **`src/storage-guard.ts`** — PRIMEIRO import do `main.tsx` (roda antes de o
  cliente do Supabase nascer): apaga o chat de toda sala que não é a atual e mede
  o armazenamento. Nunca toca save, arquivo, cofre, login ou preferências.
- **Faixa "sua sessão caiu"** (`index.tsx`): faz o mesmo teste de escrita; se der
  CHEIO, diz isso com todas as letras e dá o botão **🧹 Liberar espaço** (limpa e
  recarrega). "detalhes ▸" mostra KB, nº de chaves e as 5 maiores — pra print.
- **Painel do Criador** ganhou a seção **🗄️ Armazenamento deste aparelho** — o Diego
  abre `#admin` no próprio celular e vê o teste, o total e as maiores chaves.
- Trava: **`npm run storage`**.

### ⏳ Se o Diego mandar o print e NÃO for "cheio"
Aí a hipótese cai e o próximo suspeito é outro: aba privada/"limpar ao sair" do
Chrome, ou as 12 abas do site brigando. O print do "detalhes ▸" decide.

## 20/09/2026 (parte 4) — 📊 O TETO DO BOT: ANÁLISE, NADA MEXIDO NO JOGO

O Diego contou que usuários estão **pagando muito acima do mercado** pra nenhum bot
disputar, depois **listando** a carta: ninguém cobre, ela cai no monte **pela metade**
e ele repesca de graça. Ordem dele: *"não faz nada, só analisa e me fala o que tu
acha"*. Depois: *"não acha que deveria subir um pouco mais o piso com base no nível e
categoria do jogador… e conforme o jogo avança? Igual é no mundo real"* e *"não quero
prender somente a Série A — se tem time com dinheiro lá embaixo, deixe ofertar sim"*.

### Bancadas (não mexem em nada do jogo)
- **`scripts/simula-economia.mts`** — 250 temporadas, 3 estratégias (honesto ·
  lavador · inflador). Achado: o teto do bot **congela em 360** (lenda 90 × econ 4×)
  por volta da temporada 25 e nunca mais sobe; o lance do USUÁRIO é a única coisa
  sem teto no jogo; `recordPrice` grava o lance inteiro no livro de preços.
- **`scripts/simula-teto.mts`** — 40 clubes espalhados nas 5 divisões, 250 temporadas,
  4 réguas de teto comparadas (hoje · pelo bolso · bolso+nível · bolso+nível+tempo).

### O que a segunda bancada mostrou
- **Hoje o teto não olha pro bolso de ninguém.** É a média da sala. Clube com
  **8.396** de caixa dá o mesmo lance de um com **35** — e por isso o dinheiro
  EMPOÇA (o mais rico termina as 250 temporadas com 8.396 sem ter no que gastar).
- **Teto pelo bolso DAQUELE clube** resolve o pedido do Diego: time rico da Várzea
  volta a ofertar de verdade (chegou a 390 quando o melhor da liga era 435) e o
  dinheiro deixa de empoçar (mais rico termina com 718 em vez de 8.396).
- **Só isso NÃO faz o preço subir com o tempo** — os prêmios são fixos por divisão,
  então a economia estabiliza. Pra ter "igual mundo real", a RECEITA tem que subir
  junto. Testado: +1,2%/temporada nos dois, parando em 2,5×. Maior lance da liga vai
  de 360 (congelado) pra **612 na temporada 100**; a lenda sai de ~99 pra ~207 em 250
  temporadas (dobrou, não explodiu); o rico da Várzea alcança **68%** do bolso da elite.
- **Contra a artimanha**: hoje basta passar de ~355 *pra sempre* (número decorável).
  Com teto pelo bolso + tempo, o alvo sobe junto com o jogo e nunca vira número fixo.

### 📈 E A IDEIA DELE: o teto sair do que o MERCADO PAGOU naquele nível
Pergunta dele: *"sobre o nível do jogador e valor e o que o mercado pagou naquele
nível… pra entender qual piso máximo pode chegar com base no que saiu"*. Ou seja: em
vez da tabelinha chutada (16 · 26 · 42 · 65 · 90 por estrela), o teto sai do HISTÓRICO
de preços de cartas daquele nível. Testado na bancada (modelo `mercado`):
- **Funciona e não explode**: o índice se auto-corrige, sobe quando a liga enriquece e
  desce quando empobrece. Em 250 temporadas ficou estável (~223 de teto máximo).
- **Mas dá pra ENVENENAR.** Com o inflador reciclando dinheiro (lista → monte pela
  metade → repesca), a referência do nível 90-94 foi de 72 pra **477 (6,7×)** quando o
  índice usa MÉDIA. Com MEDIANA cai pra 137 (1,9×). Com **mediana + só o que BOT pagou
  entrando no índice**, cai pra 85 (**1,2×** — resíduo de mercado, não distorção).
- 👉 Conclusão pra quando ele aprovar: se o teto vier do histórico, tem que ser
  **mediana** e **sem contar o lance de quem joga**. O usuário não é mercado.

### 🚨 PERGUNTA DELE: *"não pode correr risco do bot do nada pagar dois mil?"*
Medido: o MAIOR lance que um bot deu em qualquer das 250 temporadas, com o inflador
solto na liga. E o risco **não estava no índice** — estava na perna do BOLSO (bot que
juntou 2.400 dá 840 num lance só).

| régua | pico sem inflador | pico com inflador | veredito |
|---|---|---|---|
| hoje | 360 | 360 | ✅ seguro (mas congelado) |
| bolso+nível | 546 | 959 | ⚠️ sobe |
| bolso+nível+tempo | 704 | 941 | ⚠️ sobe |
| mercado (índice) | 350 | 854 | 🚨 dispara |
| **recomendado** | **450** | **450** | ✅ **seguro** |

### ✅ RECOMENDAÇÃO FECHADA (esperando o OK dele)
`recomendado` = **categoria × nível da carta × bolso DAQUELE clube**, com **TETO DURO**
por cima (`catPriceCap × 5` → 👑450 ⭐325 💎210 🎯130 🪵80) que nenhum caminho fura.
- Nunca passa de 450, com ou sem trapaceiro na liga — não existe "bot pagando 2 mil".
- Time rico da Várzea volta a ofertar (43% do bolso da elite, contra os 100% FALSOS de
  hoje — hoje é 100% só porque o teto ignora o dinheiro de todo mundo).
- O dinheiro para de empoçar: mais rico termina com 975 em vez de 8.396.
- 🚫 **Índice de mercado DESCARTADO**: se alimenta do próprio resultado, e foi o único
  modelo que disparou (854) — é exatamente o tipo de comportamento emergente que o
  Diego não quer.

### 🧠 A IDEIA DELE (20/09) — "o teto persegue o que o usuário pagou"
Palavras dele: *"se um usuário pagar no nível 90 mil, o teto máximo que o bot pode
chegar agora é mil também… porém sendo inteligente"* — e o medo, que é o certo:
*"pode ser que no próximo ele pague 1500, aí o bot aumenta pra 1500 e daqui a pouco
o jogo tá em 10k hahaha"*.

Bancada (modelo `persegue`): teto anda no máximo **25% por temporada** na direção do
preço que SE SUSTENTOU (mediana — um lance maluco sozinho não move, dois já é preço),
e desce do mesmo jeito.

| régua | pico sem trapaceiro | pico com trapaceiro |
|---|---|---|
| persegue (só com freio) | 511 | **955** ⚠️ |
| **persegue + teto duro** | **450** | **450** ✅ |

👉 **O freio sozinho NÃO impede o 10k** — só faz demorar, porque o trapaceiro
realimenta o índice toda temporada. Quem realmente fecha a porta é o **teto duro**.
Ou seja: o teto duro é a resposta pro medo QUE ELE MESMO levantou, não um capricho meu.

### 💰 A SAÍDA PRO "MAS AÍ TRAVA NOS 450 DE NOVO" — teto pelo DINHEIRO DA LIGA
Reclamação justa dele: parede fixa é o mesmo problema de hoje, só com número maior.
E ele sugeriu usar a MÉDIA dos preços. Duas respostas:
- ⚠️ **Mal-entendido meu**: o modelo nunca usou o MAIOR preço, usa o DO MEIO (mediana).
  E a **média é a pior** das três — medido: com média, um lance de 1000 leva a
  referência de 72 pra **477**; com o do meio, 137.
- ✅ **A saída de verdade**: o teto não sair de PREÇO nenhum, e sim do **dinheiro que
  existe na liga** (caixa MEDIANO dos clubes × 2,5 × a proporção da categoria). Moeda
  no jogo só nasce de prêmio, patrocínio e estádio — **pagar caro não cria moeda**, só
  troca de bolso. Então não existe bola de neve, e **não precisa de parede**.

| régua | pico normal | pico com trapaceiro | cresce com o jogo? | precisa de parede? |
|---|---|---|---|---|
| hoje | 360 | 360 | 🚫 congela | — |
| índice de preço | 350 | 527 | sim | sim |
| persegue + parede | 450 | 450 | até a parede | sim |
| **dinheiro da liga** | **433** | **574** | **acompanha a liga** | **não** |

⚠️ **ERRO DE BANCADA CORRIGIDO**: os picos "com trapaceiro" que eu tinha reportado
antes (955 / 854 / 696) contavam o teto DO PRÓPRIO trapaceiro, cujo caixa a bancada
abastece de propósito. A pergunta é se um **BOT** paga absurdo — a medição agora
exclui o clube dele. Os números certos são os da tabela acima.

### 🛑 ASSUNTO ENCERRADO (20/09): o teto do bot FICA COMO ESTÁ
Depois de 6 rodadas de bancada ele respondeu *"N entendi ndi nadaaa.. e ainda não sei
o que fazer"*. Erro meu: despejei simulação em cima dele em vez de entregar decisão.
**Não reabrir o teto do bot sem ele pedir** — nem "índice de mercado", nem "teto
duro", nem "teto perseguindo o preço", nem "teto pelo dinheiro da liga". Tudo isso
está medido e guardado em `scripts/simula-teto.mts` caso um dia ele queira.
O que ficou na mesa pra ele decidir é UMA coisa só, com sim ou não:
**a carta que volta pro próprio dono no monte volta COMO SAIU, não pela metade** —
mata o lucro da artimanha sem encostar no bot nem em teto nenhum.

### ✅ FEITO (20/09, aprovado): a carta que o dono recupera no monte VOLTA COMO SAIU
Palavras dele: *"gostei disso de voltar pro dono sem custo pelo mesmo valor de mil, se
ele botou por mil"*. `halveListed` guarda `paidAntes`; `takeFromMonte` devolve ao PRÓPRIO
dono `paid = paidAntes` + o contrato de quando saiu, e regrava o livro com o valor
verdadeiro. De graça, como sempre. Pros outros clubes, metade e contrato zerado.
Tela do Monte mostra o valor de antes na sua carta e o texto de ajuda diz "volta como
saiu". Novidade PT/EN na home. Trava: `npm run monte` (seção 1a).

### ⏳ PENDENTE
1. ✅ (13/10: resolvido pelo "bot alcança o mínimo do dono") **Teto do bot crescer sem extrapolar** — ele pediu de novo (20/09, depois do
   "não entendi nada"): *"precisamos bolar alguma ideia pro piso dos bots de todos os
   clubes aumentar e não ficar preso no 450… algo inteligente que funcione mas também
   não extrapole"*. As réguas medidas estão em `scripts/simula-teto.mts`. Levar UMA
   proposta, em uma frase, com sim/não — nunca mais tabela atrás de tabela.
2. Livro de preços gravar só até o teto de mercado (`recordPrice`) — não decidido.
## 20/09/2026 (parte 52) — 🏺 COPA DO MUNDO COM CABEÇA DE CHAVE (4 potes de 6)

*"A Copa do Mundo deveria sempre ter os países mais fortes sendo cabeça de chave,
seja em qualquer modo. Não acha não?"*

Achava. E o buraco era maior do que parecia: **não existia pote nenhum**. O
sorteio embaralhava as 24 e cortava em 6 grupos de 4, cru. Medido em 20 mil
Copas do jeito velho:

| | antes | agora |
|---|---|---|
| 2 das 4 mais fortes no mesmo grupo | **63,8%** | 0% |
| 3 das 4 mais fortes juntas | 4,4% | 0% |
| 2 cabeças de chave no mesmo grupo | 97,3% | 0% |

Ou seja: em **2 de cada 3 Copas** tinha grupo da morte, e um gigante caía fora na
primeira fase por azar de sorteio — enquanto do outro lado da chave alguém
passeava até a final.

### 🏺 Como ficou
**4 potes de 6** — o formato de Copa de 24 de verdade (México 86, Itália 90). O
pote 1 espalha uma em cada grupo; os potes 2, 3 e 4 caem por cima, um por grupo.
Dois cabeças de chave só se encontram no mata-mata.

💪 **A força é a do time que ENTROU** (`Entrant.str`), não uma lista fixa de
países. Então quem convoca um 11 bom com um país médio vira cabeça de chave, e
não fica refém do nome da seleção. Vale na carreira e no online — "em qualquer
modo", como ele pediu.

🎲 **E continua sendo SORTEIO**: o embaralhamento agora é DENTRO do pote. O pote
diz a força, o acaso diz o grupo — a trava exige que a seleção mais forte caia em
pelo menos 5 grupos diferentes em 60 Copas, senão virou fila e a Copa fica igual
todo ano.

### 🔒 O cuidado que custou o dobro do trabalho (e valeu)
A Copa é **recalculada da semente toda vez que a tela abre**. Ligar o sorteio
novo numa Copa JÁ ROLANDO trocaria o chaveamento no meio do caminho — é o mesmo
estrago do *"mudou o resultado da Copa"* de 04/08, e aqui seria pior: não é um
placar, é a chave inteira.

Então a regra vale **só pra Copa que NASCEU depois da mudança**, e cada modo tem
o seu carimbo, sem migração de banco nenhuma:
- **online**: a tabela `esc_copa_salas` já tinha `criada_em` — agora ela entra na
  leitura, e `copaTemPotes()` compara com `POTES_DESDE`;
- **carreira**: o `emAndamento` do `CopaSave` (o carimbo anti-F5 que já existia)
  ganhou o campo `potes`, gravado quando a pessoa confirma a convocação. Save
  velho não tem o campo → sorteio velho até aquela Copa acabar.

E `simulaCopaMundo` nasce **sem** potes por padrão: quem liga é o chamador. Assim
qualquer caminho esquecido cai no comportamento de hoje, não no novo.

🛡️ `npm run potes` (trava nova, com a tabela antes×agora) · `npm run copa` ·
`npm run ascegas` com as mesmas digitais (`28bea2df` · `d65041f6` · `06bab491`).
Linha em `novidades.ts` (PT + EN) — é regra de jogo, não conserto.

### ↩️ Dá pra voltar atrás?
Dá, num commit. E mesmo sem reverter: é só o chamador parar de passar a bandeira
que tudo volta ao sorteio de hoje.

---
## 20/09/2026 (parte 51) — 🐆👑 BATISMO: PANTERA NEGRA FC (Série C)

Dono: **ericrabelo29@gmail.com** (Eric). Assento da **Série C** que era do
🤖 Miúdo EC. Arte inteira mandada pelo dono (escudo, mascote e camisa).

### 🎨 A arte
- escudo `292×360` · **27,7 KB** (teto 30)
- mascote `400×440` · **40,6 KB** (teto 45) · **total 68,4 KB** (teto 75)
- camisa `626×760` · 67,4 KB — em `scripts/kits/` (post) e `public/mantos-salao/`
  (Loja), com `-v1` no nome de propósito (endereço fixo = cache de navegador).
- recorte: `scripts/recorta-prancha-pantera.py` (chroma verde, corte por LIGAÇÃO
  com a borda, despill só na franja, poeira de alfa apagada, bbox medido com
  alfa ≥ 40 e ≥ 3 pixels).

### ⚠️ O ERRO QUE ELE PEGOU, e a lição
Na 1ª versão eu tirei o **balão de fala** e a **plaquinha de madeira** do mascote,
achando que eram peça de POST. Ele corrigiu: *"faltou a plaquinha com frase
embaixo do mascote ao lado da bola e também em cima o balão com frase"*. O
mascote dele é a **CENA inteira** — balão em cima, jogador com a bola-galáxia no
pé, plaquinha embaixo.
👉 **Regra pra qualquer arte que venha do dono: o que entra e o que sai é decisão
DELE.** Na dúvida, perguntar — não podar por conta própria. (Irmã da regra de
18/08: "quando você não souber como a pessoa é, me fala".)

### 🎽 O manto: preto e dourado, MEDIDOS
Medição nas três peças, e elas concordam: dourado `#CB9D3E` na camisa (11,3%
dela), `#DEA152` no escudo, `#D38952` no mascote; escuro `#0E0C0C` na camisa
(82,8%). O preto foi **levantado pra `#191615`** pelo mesmo motivo já escrito na
linha do Futpoint: preto de arte escura, na listra fininha do jogo, lê como
buraco. O tom quente é o medido; só a luz subiu.

### ✅ As TRÊS pernas da entrega (código + banco + main)
**Código:** `escudos.tsx` (4 formas do nome + o nome velho) · `mascotes.tsx`
(`pantera_negra` + `MASCOTE_NOME` + `CARIMBO_GOL`) · `data.ts` (`OLD_NAME` +
o assento da Série C) · `apoio.tsx` (ouro + `FUNDADOR_N` 74) · `manto.ts` ·
`batismos.ts` (com o MESMO par de cores) · `salao-camisas.ts` + o arquivo
público · a lista do `checa-batismos.mjs`.

**Banco (rodado e CONFERIDO no mesmo dia):**
- ⛔ a trava de segurança de 07/09 passou primeiro: **a conta existe**
  (`auth.users`), então o batismo não ficou à espera de quem criasse a conta
  com esse e-mail;
- `user_colors` → ouro, manual ✅ · `esc_fundadores` → **74** ✅ ·
  `esc_socios` → sócio **55**, manto `#191615`/`#CB9D3E`, `mascote_key`,
  `escudo_time`, válido até 2099-12-31 ✅ · `esc_nomes_batismo` → o nome PURO,
  e o gatilho criou FC e EC sozinho (**3 formas travadas**) ✅.

### 👟❌ A NIKE SAIU (ordem dele, no mesmo dia)
*"Tire a Nike do peito do manto também."* A prancha vinha com o símbolo em TRÊS
lugares: o peito da camisa e as DUAS chuteiras do mascote. Marca registrada de
outra empresa não entra no jogo — é a mesma decisão das chuteiras do Pontinho
(Futpoint, 19/09) e do letreiro da bola de ouro. Script:
`scripts/tira-marcas-pantera.py`.

⚠️ **A receita do Futpoint NÃO serviu nas chuteiras.** Lá (e no pelo da pantera
aqui) funciona ajustar uma superfície quadrática no RETÂNGULO e repintar com
grão. No couro da chuteira isso deixou um **remendo quadrado de borda dura, com
granulado cinza** — porque o brilho do couro muda rápido demais dentro da janela
pra uma superfície suave acompanhar. A saída foi mais humilde e melhor:
**mexer só nos pixels da marca** — marca o dourado, engorda 2 px e deixa o
`inpaint` do OpenCV costurar pelo que está em volta. O couro, o brilho e o grão
do lado nem são tocados.
👉 Pra próxima marca a apagar: **comece pelo inpaint do risco**; a superfície
quadrática é pra fundo LISO, não pra material brilhante.

🟩 De quebra saíram **36 px de chroma** presos entre a chuteira e a bola-galáxia
(escaparam do recorte por serem menores que o corte de buracos presos, > 700 px).
Viraram vão, não pintura. A grama do pé da plaquinha também é verde e **não foi
tocada** — o alvo foi só a janela da chuteira.

### 📮 O post
`node scripts/mockup-batismo.mjs` com `--camisa` (a que ele mandou). **Sem
`--antigo`**, pela regra de 05/09: o post diz só "chega na Série C", nunca de
quem era o assento.

### ⏳ Falta
❤️ **O time de coração dele.** O post leva `--coracao` sempre que a gente sabe —
aqui ninguém disse. Quando o Diego souber, é só regerar o post e preencher
`time_coracao` em `esc_socios`.

🛡️ `npm run batismos` (Pantera Negra completo) · `salao` · `piramide`
(C segue com 20) · `mimos` · `telas` · `carta` · e `npm run ascegas` com as
mesmas digitais (`28bea2df` · `d65041f6` · `06bab491`).

---
## 20/09/2026 (parte 50) — 🕵️ O JOGADOR ENIGMA (no branch, esperando OK visual)

Ele perguntou se já estava feito. **Não estava** — dos dois modos que saíram
daquela conversa de ideias, só a 🐊 Tocaia foi construída; este ficou parado no
"mockup" desde então.

### 🎯 A regra, com as palavras dele
- *"Ele só tira o lugar de outro jogador, igual já existe com o jogador surpresa.
  É um jogador que já iria pro leilão, e aí a gente faz essa opção nele, dele
  ficar escondido com a dica. **Mas não vai ter que botar um jogador a mais**."*
- *"Ele pode aparecer uma vez só no leilão… pode ser algum leilão no gol, no
  ataque ou outro, mas só uma vez."*
- *"É só revelar igual é com o surpresa."*
- *"Tem que entrar na posição que é a do leilão no momento que ele entra. Então a
  dica já é a posição do momento que tão todos listados, mais a dica que o jogo
  vai dar."*

### 🆚 A diferença pro 🎁 Surpresa, que já existia
O Surpresa esconde **só o nome** — clube e ano continuam à mostra, e com esses
dois muita gente adivinha quem é. O Enigma esconde **nome, clube E ano**. Sobra
a POSIÇÃO (que já é dica) + **uma dica**: a ÉPOCA (`🕰️ dos anos 2010`). Escolhi
a época porque dá pra apostar ("craque velho ou moleque novo?") sem entregar
ninguém — mas é justamente o que ele tem que aprovar.

### ⚙️ Onde mora
`mudoId` no estado (irmão do `surpriseId`) · `pickMudo` + `sorteiaEspeciais` +
`dicaDoEnigma` no `store.tsx` · a prop `mudo` do `CardFace` no `screens.tsx`.
Nome numa fonte ÚNICA e com identificador NEUTRO (`ENIGMA_NOME`/`ENIGMA_EMOJI`)
— lição da Tocaia, que mudou de nome cinco vezes num dia.

### 🎲 Ele NÃO puxa número da fila do acaso — e isso foi de propósito
Todo sorteio do leilão sai da mesma fila de números aleatórios. Se o Enigma
puxasse UM número a mais, todos os lances dos bots andariam pra frente e o
pregão às cegas fecharia diferente — exatamente o que o `npm run ascegas`
existe pra impedir. Então o Enigma é escolhido por uma CONTA em cima da semente
da sala (a mesma sala sorteia o mesmo Enigma), sem encostar na fila.
✅ As três digitais seguem `28bea2df` · `d65041f6` · `06bab491`.

### 🔒 `npm run enigma-trava` (e como ela quase nasceu inútil)
Confere: não é carta a mais · não consome acaso · nunca cai na mesma carta do
Surpresa · a dica é verdade e não entrega nome/clube/ano · e o principal:
**nome, clube e ano NÃO estão no HTML antes do martelo** (o Surpresa já teve
esse bug — ia pro HTML e só era borrado por CSS, dava pra ler no "inspecionar").

⚠️ **Duas vezes a trava mentiu pra mim antes de prestar:**
1. ela rodava com o remendo que fixa o Enigma na 1ª carta (pro mockup) e acusava
   "o sorteio está viciado" — estava mesmo, **por culpa do remendo**. Sumiu o
   remendo: agora o modo liga por um interruptor de bancada (`bancadaEnigma`) na
   página que já está aberta, sem editar arquivo nenhum. De quebra, acabou o
   risco de o processo morrer no meio e a bandeira ir ligada pro commit.
2. o recorte que tirava a dica apagava "tudo do 🕰️ pra frente" — então um
   clube+ano colados DEPOIS da dica sumiam junto e **a trava passava num
   vazamento de verdade** (testei: passou). Agora ela remove só os textos que a
   função de dica sabe gerar, e o que sobrar tem que ser posição + 🕵️ + "?".
   Testada nos dois sentidos: com o vazamento plantado, ela pega
   (`"GOL🕵️ ? ? ? ? Sport · 2008"`).

### ⏳ O que falta
1. **OK visual do Diego** — nasce DESLIGADO (`ENIGMA_LIGADO = false`) e nada vai
   pra `main` antes disso.
2. Ele decidir a **DICA** (fiquei na época; dá pra ser "🌍 jogou na Europa",
   "🏆 jogou Copa do Mundo"…) e o **NOME** do bicho (fiquei em "Enigma").
3. Linha em `novidades.ts` — só na entrega que ligar isso pro pessoal.

### ↩️ Dá pra voltar atrás?
Dá, e nem precisa reverter: com `ENIGMA_LIGADO = false` o `mudoId` fica vazio e
todas as telas caem no caminho de sempre. Pra sumir de vez, reverter o commit.

---
## 20/09/2026 (parte 49) — 🐊 O SELO DO PREGÃO NA LISTA (e por que ele não acendia)

*"Ainda não tá aparecendo o selo do modo Tocaia… pode ser um jacaré talvez. E o
padrão às cegas coloque outro emoji."*

### 🔍 A causa: não era o selo, era o DADO
O selo lia `game_state.holandes` — mas a **lista de salas abertas não baixa o
`game_state`** desde 09/09. Naquela noite ela extraía 15 campos com `->>` e o
Postgres descomprimia o JSON (50–200 KB) **uma vez por campo**: 3,5 s por
consulta, 400 consultas/min, o banco parou (timeout em login, sala e save).
Desde então os campos moram em colunas magras `ls_*`, preenchidas por gatilho.

`holandes` nasceu depois e **nunca ganhou coluna**. Então na lista ele chegava
sempre `undefined` e o selo nunca tinha como acender. O código do selo estava
certo desde ontem; faltava o dado chegar até ele.

👉 **Lição pra quem for pôr qualquer coisa nova na lista de salas abertas:** não
basta gravar no `game_state`. **Tem que ter coluna `ls_*`** — a lista não lê o
JSON e nunca mais vai ler.

### ✅ O que foi feito
- **`docs/sql/lista-salas-modo-pregao.sql`** — cria `ls_holandes` e um gatilho
  **próprio e separado**, que NÃO encosta no `game_rooms_colunas_magras` que já
  está no ar (a lição do `online-copa-clock-preview.sql`). Coluna nula =
  instantâneo, sem travar a tabela; não precisa preencher as salas de pé, porque
  toda sala viva é regravada em segundos.
- **Os DOIS modos têm selo agora**: 🐊 TOCAIA (vermelho) e ✉️ ÀS CEGAS (branco).
  Só carimbar a Tocaia não diferenciava nada pra quem olha a lista.
- **Três estados, não dois**: `true` = Tocaia · `false` = envelope cego ·
  `undefined` = a lista não conseguiu ler. **Sem leitura, nenhum selo** — senão
  um banco ainda sem a coluna faria toda sala, inclusive as de Tocaia, se
  anunciar como "às cegas", que é mentir pra quem vai entrar.
- 🛟 **Rede na consulta**: se a coluna não existir, o Postgres devolve erro e a
  lista voltaria **VAZIA** — ninguém entraria em sala nenhuma. O primeiro erro
  faz a consulta cair pro formato antigo pelo resto da sessão. Por isso o código
  pode subir antes do SQL, em qualquer ordem, sem risco.
- 🏟️ **E dentro da sala de espera também**, logo abaixo do código da sala — e
  essa parte **não depende de banco nenhum** (lá o `game_state` inteiro está na
  mão). Quem entrou pelo código precisa saber em que jogo se meteu.

### ✅ BANCO RODADO em 20/09 — a entrega está COMPLETA (código + banco + main)
`docs/sql/lista-salas-modo-pregao.sql` aplicado no Supabase. Conferência na hora:
**44 salas** nas últimas 6h — **4 de 🐊 Tocaia** (todas em jogo) e 40 de envelope
cego, 3 delas com a coluna nula (o normal: sala às cegas não grava a chave).
Permissões conferidas (`anon`/`authenticated` leem a coluna nova) e
`notify pgrst, 'reload schema'` disparado — sem isso o PostgREST poderia demorar
a enxergar a coluna, a consulta daria erro e a lista cairia na rede do formato
antigo (funcionando, mas sem o selo).

⚠️ **Armadilha pra quem for conferir isso à mão:** NÃO peça `ls_deck` num
`select` de várias salas. Em sala velha "estragada" essa coluna guarda o baralho
INTEIRO — um `select` de 20 linhas voltou com 209 mil caracteres.

O arquivo foi escrito **em cima do `pg_get_functiondef` LIDO DO BANCO** (não de
memória): é o mesmo gatilho `game_rooms_colunas_magras`, com UMA linha a mais e
nada mais tocado. Dois achados da leitura que mudaram o plano:
- o gatilho é `BEFORE INSERT OR UPDATE **OF game_state**` — e a sala parada na
  espera só grava `updated_at` (batimento do host de 30s). Sem o passo 3
  (o `update` de preenchimento) as salas que já estão de pé ficariam sem selo
  até o pregão começar. O plano original dizia que elas se preencheriam
  sozinhas; **estava errado**, e só a leitura do banco mostrou isso;
- as outras 15 colunas guardam o `->>` cru, então sala às cegas fica com
  `ls_holandes` **NULL** (ela não grava a chave). O código já trata: NULL = às
  cegas, campo AUSENTE (consulta velha) = não sei, não carimbo nada.

🛡️ `npm run holandes` (com 6 travas novas, inclusive a que reprova quem voltar a
procurar o modo no `game_state`) · `npm run ascegas` com as mesmas digitais
(`28bea2df` · `d65041f6` · `06bab491`) · `npm run sala` e `npm run relogio` verdes.

---
## 20/09/2026 (parte 48) — 🎬 REELS DA TOCAIA (`npm run tocaia`)

*"Preciso de um vídeo top agora, padrão de vídeos que fazemos, falando dessa
baita novidade!! E mostrando o tempo rolando e etc."*

`scripts/video-tocaia-reels.mjs` · 1080×1920 · ~36s · mesmo padrão dos outros
reels (creme, bordas grossas, sombra dura, Oswald, cenas por `animation-delay`).

### 🎞️ As 7 cenas
1. 🐊 **CHEGOU A TOCAIA** — a novidade antes de qualquer regra (regra do reels do
   Bola de Ouro: *"primeiro você tem que começar o vídeo falando da novidade"*);
2. às cegas × Tocaia — envelope lacrado × preço à vista de todo mundo;
3. ⭐ **O PREÇO ROLANDO** — a parte que ele pediu: a leva inteira listada com o
   botão PEGAR, o número gigante caindo `100·90·80·70·60·55·50·46·42·38·34·30·27·24·21·18`
   e uma barrinha vermelha esvaziando. No 18 o 🫵 desce e a carta vira dourada
   com **PEGUEI! · 18 🪙**;
4. quem aperta **primeiro** leva — é por TEMPO, não por valor (PEGUEI! × 😤 QUASE!);
5. o jogador **cai no campinho na hora**;
6. ninguém quis? preço até zero → Monte de sobras, e **o às cegas não mudou nada**;
7. onde jogar (rápida · sala online · Minhas Ligas) + marca.

### ✅ Os números do vídeo são os DO JOGO
A escada saiu pra `scripts/escada-tocaia.mjs` (espelho em JS puro do `holEscada`
do `store.tsx` — `.mjs` não importa `.tsx`), e o **`npm run holandes` agora
compara as duas**: mexeu na escada do jogo e esqueceu o espelho, a trava reprova.
Motivo: vídeo é o que vai pro Instagram — anunciar preço que o jogo não tem é
propaganda enganosa.

⏱️ **A descida do vídeo corre em DOBRO** (100→18 leva 17,1s de verdade, no vídeo
leva 8,5s). A ordem e os números são os reais e **a própria tela avisa**:
*"no jogo a descida inteira leva ~49s · aqui está acelerada"*. Reel não aguenta
17s de contagem, mas ninguém pode chegar no jogo e se sentir enganado.

### 🚫 O que ficou DE FORA de propósito
O conserto do relógio (parte 47) **não entra no vídeo nem nas novidades**: é
bug, e a regra dele é *"menos bugs, que nunca lance"*.

---
## 20/09/2026 (parte 47) — ⏱️ UM RELÓGIO SÓ PRA SALA (o "154s" do print dele)

Ele mandou cinco prints da Copa do Mundo online e o recado:
*"os tempos de escolhas estão MT longos… tem que ser igual ao modo às cegas. E o
monte de sobras também, que era 15s e tava bem mais também."*

### 🔍 O que estava acontecendo (não era a Copa, nem o Monte)
Nos prints: **154s** onde são 75s (escolher a seleção), **84s** onde são 15s (o
banner) e **129s** onde são 90s (a convocação). Os três batem com a MESMA conta:
o número certo **+ 79 segundos**.

O relógio do celular dele estava **~79 segundos atrasado**. Todo prazo do online
nasce no aparelho do **DONO** da sala (`Date.now() + 15s`) e viaja como um
INSTANTE; quem recebia fazia a conta com a hora do **próprio** celular. Celular
atrasado = todo prazo parece maior do que é.

A prova de que era relógio, e não a Copa: o **Monte de sobras** deu o mesmo erro,
e ele vem por um caminho de código **completamente diferente** (broadcast do
estado, não a tabela `esc_copa_salas`). Dois lugares sem nenhuma ligação, o mesmo
desvio — é a assinatura de relógio torto.

E o pior não era o número feio: a fase acabava **na hora certa** (quem manda é o
relógio do dono), então quem tinha o celular atrasado levava um susto — *"mas
ainda tinha um minuto!"*.

### ✅ O conserto — `src/escalacao/relogio.ts`
O dono carimba a hora dele nas **duas mensagens que já manda** (o estado e o "tô
vivo" de 4 em 4 segundos — uns 20 bytes, zero mensagem nova, zero banco). Cada
convidado aprende o **desvio** entre os dois relógios, e daí pra frente toda
contagem do online é lida com `agoraSala()` — a hora do DONO.

Vale pra **tudo** de uma vez: envelope do leilão às cegas (45s), desempate,
🐊 Tocaia, Monte de sobras (15s), cerimônia e os três relógios da Copa do Mundo
(75s · 15s · 90s).

🛡️ Por que não quebra nada:
- pro **DONO** o desvio é SEMPRE zero (ele não recebe carimbo de ninguém, e
  `souODono()` zera na hora que alguém assume) → o jogo dele fica idêntico;
- **offline** nunca recebe carimbo → desvio zero, idêntico;
- host numa versão velha (janela de deploy) não manda carimbo → o convidado fica
  exatamente como era hoje, sem erro novo;
- **zona morta de 1,5s**: a variação da rede não faz a contagem pular na tela;
- carimbo inválido ou absurdo (> 12h) não encosta no relógio;
- só **PRAZO** usa essa hora. Salvar, assinar, ordenar e registrar continuam no
  relógio do próprio aparelho.

### ⚙️ E o botão que ele pediu junto
*"no final também tem que ter o botão de gerenciar técnicos perto de sair, igual
também tem no outro modo."* Durante a partida o ⚙️ mora no rodapé do `Shell` — só
que a tela de FIM do online abre com `hideExit`, e o rodapé inteiro some. Agora
ele aparece na linha das saídas do quadro roxo "🗳️ E agora?", ao lado de
🏠 Voltar pro menu e 🚪 Sair da sala. Mesmas regras de sempre: **só o host**, só os
OUTROS técnicos, humanos e rivais CPU, com os buracos (`−N 🕳️`) à mostra. É
justamente aqui que ele é mais útil: o host está decidindo o "novo leilão" e
precisa tirar da frente quem largou o jogo.

### 🛡️ Trava nova: `npm run relogio`
Confere a conta do desvio, a zona morta, o lixo que não pode entrar, que o DONO
nunca tem desvio, que assumir a coroa zera na hora — e, por texto, que nenhuma
das telas de contagem (leilão, desempate, Monte, cerimônia, Copa) voltou a usar
`Date.now()` cru.

`npm run ascegas` com as mesmas digitais (`28bea2df` · `d65041f6` · `06bab491`) ·
`npm run holandes`, `npm run revanche`, `npm run copa`, `npm run sala` e
`npm run vigias` verdes.

### ↩️ Dá pra voltar atrás?
Dá, e é um commit só. Voltando, tudo fica exatamente como estava hoje (o número
inflado volta pra quem tem o celular fora de hora, e o ⚙️ some do fim).

---
## 20/09/2026 (parte 46) — 🐊 FECHADO: o modo é TOCAIA, com o jacaré

*"Coloque Tocaia mesmo, com emoji de jacaré."* Decisão final dele, depois de o
nome passar por **Holandês → Queda Livre → Holandês → Pescaria → Tocaia** em um
único dia.

### 🐊 Como ficou
- nome: **🐊 Tocaia / Ambush**;
- emoji: **🐊** em todas as telas (montar partida, montar sala, selo da lista de
  salas abertas, topo do pregão, novidade da home);
- grito do arremate: **PEGUEI! / GOT IT!** na tarja da carta que é sua (era
  "FISGOU!" na versão Pescaria, que durou uma mensagem);
- a faixa do último martelo segue com **🔨** — é o martelo do leilão, símbolo do
  jogo, e não é do modo.

### 🧠 Por que Tocaia é o nome certo (e fica registrado)
É o único dos cinco que carrega o **RIVAL**. A emoção do modo não é o preço
caindo — é o amigo te passando na frente. Tocaia tem alvo e tem disputa; pescaria
é você contra o peixe, e o peixe não está competindo com você. O jacaré fecha a
imagem: fica parado, de olho, e dá o bote na hora certa.

⚠️ **Não repropor outro nome sem ele pedir.** Os descartados, pro caso de ele
voltar ao assunto: Queda Livre (Free Fall) · Pescaria (Fishing) · Bote (virava
"bot") · Às Claras · Chapéu · Caçada · Sniper · Anzol.

### 💡 O que essa novela ensinou, e que vale pra qualquer coisa "de gosto"
O nome mudou **cinco vezes**. Custou barato porque, na terceira troca, eu parei de
espalhar a palavra pelas telas e criei uma **fonte única com identificador
NEUTRO**: `MODO_NOME` / `MODO_EMOJI` / `MODO_FISGOU`. Da quarta em diante, trocar
o nome do modo virou **trocar uma string** — não renomear código em sete lugares.
👉 Quando um assunto for de GOSTO do Diego, assuma que vai mudar e **prepare o
código pra mudar barato desde a primeira vez**.

E a chave do estado nunca se mexeu: continua `holandes` no save, no reducer e no
`game_state` da sala. Sala criada com o nome antigo abre normalmente.

🛡️ `npm run holandes` verde · `npm run ascegas` com as mesmas digitais
(`28bea2df` · `d65041f6` · `06bab491`).

---

## 20/09/2026 (parte 45) — 🎣 O modo virou PESCARIA (votação do pessoal dele) — PRONTO, NÃO PUBLICADO

Depois de rodar vários nomes com ele, o pessoal votou: *"pescaria, pessoal tá
votando aqui"*. Feito — e com o **FISGOU!** junto, que era a condição pra Pescaria
funcionar (ver abaixo).

### 🎣 O que mudou na tela
- nome: **🎣 Pescaria / Fishing** (era Holandês / Dutch);
- emoji do modo: 🔻 → **🎣** em todo lugar (telas de montar, selo da lista de salas,
  topo do pregão, novidade da home);
- **o grito do arremate**: quando a carta é SUA, a tarja não diz "Arrematado", diz
  **FISGOU!** (**HOOKED!** em EN). É o que resolve o único problema do nome.

### 🔑 Duas decisões de engenharia que vão importar na PRÓXIMA troca de nome
1. **O identificador virou NEUTRO**: `MODO_HOLANDES` → **`MODO_NOME`** (e
   `MODO_EMOJI`, `MODO_FISGOU`, `MODO_NOME_NASCEU`). Este nome mudou **duas vezes
   em um dia**; deixar "PESCARIA" no identificador obrigaria a renomear código
   toda vez. Agora trocar o nome do modo é trocar **uma string**.
2. **A chave do estado continua `holandes`** — no save, no reducer e no
   `game_state` da sala. Nome que o código compara ou guarda NUNCA se rebatiza:
   sala criada ontem continua abrindo hoje.

### 🗣️ O que eu respondi quando ele perguntou se eu achava mesmo Pescaria melhor
Ele cobrou franqueza (*"fala verdade"*). Minha resposta, registrada porque é uma
opinião de design que pode voltar à mesa: **na minha opinião Tocaia é o melhor nome
pro modo**, porque *na pescaria não existe rival* — a emoção do modo não é o preço,
é o amigo te passando na frente, e tocaia tem alvo e disputa. **Mas o voto do
pessoal ganha da minha opinião**: nome de modo existe pra ser FALADO, e quem vai
falar é a turma dele, não eu.

### ⏸️ ESTÁ NO BRANCH, NÃO NA MAIN
Parei antes de publicar porque ele pediu a minha opinião no meio da troca — é
decisão dele, não minha. A `main` segue com **Holandês** até ele bater o martelo.
Pra publicar: `git checkout main && git merge claude/denis-save-file-x1osct`.
Pra voltar pra Tocaia (ou qualquer outro): uma string em `MODO_NOME`.

🛡️ Conferido no branch: `npm run holandes` verde · `npm run ascegas` com as mesmas
digitais (`28bea2df` · `d65041f6` · `06bab491`).

---

## 20/09/2026 (parte 44) — 🏷️ Tarja "NOVO" no Holandês (nas duas telas de montar)

Pedido dele, com o print da tela de criar sala: *"aonde tá holandês coloque uma obs
de novo"* — igual à que o **🌐 Liga + Mundo** já tem ali do lado.

### O que foi feito
O componente `Seg` do `lobby.tsx` **já sabia** desenhar essa tarja (`selos`), então
não teve desenho novo — só faltava usar. Mas ela estava presa numa data FIXA
(`NOVO_ATE = 16/10`), que era a validade da Copa do Mundo online (nascida em 01/09).
Se eu reaproveitasse, a tarja do holandês morreria 26 dias antes da hora.

Virou genérica: **`seloNovoDe(nascimento)`** — a tarja some sozinha **45 dias**
depois de o modo nascer, e a data da Copa do Mundo continua a dela.

### 📍 E está nas DUAS telas de montar
- **Sala online** (`lobby.tsx`), via o `Seg`;
- **Partida Rápida** (`screens.tsx`), onde o seletor é feito à mão — a tarja foi
  desenhada com o MESMO estilo (mesma pílula, mesmo tamanho, mesma inversão de cor
  quando o botão está escolhido).

Se ficasse só numa, as duas telas contariam histórias diferentes sobre o mesmo modo.

### 🗓️ A data mora junto do NOME
`MODO_HOLANDES_NASCEU = '2026-09-20'` ficou em `store.tsx`, ao lado de
`MODO_HOLANDES`. É a mesma informação ("este é o modo novo") — separar os dois seria
pedir pra um envelhecer sem o outro. E, como as novidades da home, **ninguém precisa
lembrar de tirar**: em 04/11 a tarja some sozinha.

🛡️ `npm run ascegas`: `28bea2df` · `d65041f6` · `06bab491` — iguais.
---

## 20/09/2026 (parte 3) — 👟 AS 20 MARCAS DE MATERIAL ESPORTIVO

Ele mandou as 20 paródias e perguntou: *"vai ser com base na divisão ou você acha
melhor variar? A pessoa pode renovar contrato com a atual?"*. Depois montou a escada
inteira, corrigiu dois nomes (**Abibas**, e **Luis Vitão** no lugar de Bibas) e
cortou a ideia de marca com regra própria: *"não quero que diferencie marca por ser
Havaianas e coisas do tipo"*.

### O que entrou
- **20 marcas** em 5 andares, com o `desde` de cada uma (a escada é dele).
- **`fornOfertas(div, seed, season, excluir)`**: 4 papéis, um de cada prazo,
  sorteados no seu andar (70%) ou no de baixo, com dado preso em semente+temporada
  — reabrir o jogo devolve a MESMA vitrine. A marca que já é sua sai dos papéis.
- **Renovação** (`LOJA_FORNECEDOR` com `fidelidade: true`): só com a marca que já era
  dele, valor recalculado na divisão de hoje, `+5` pontos de loja via
  `fornBonusLoja(contrato)` — que virou a fonte única do bônus (vendas, Loja e faixa).
- **Aviso do contrato longo** na tela, pra o custo parar de ser invisível.

### 🔁 E NO MESMO DIA ELE TIROU A RENOVAÇÃO
A faixa "a marca quer ficar" com +5% de loja viveu ~20 minutos na main. Ele leu a
explicação, achou confuso (*"confuso demais, entendi nada"*) e mandou: *"mantenha
nosso padrão mesmo e sem renovar com 5% também, deixa ele escolher normal... mas pelo
menos já deixe todas as marcas novas em cada divisão"*. Então a tela voltou a ser
EXATAMENTE a de sempre (4 papéis e só), ficou o que ele quis: as 20 marcas se
revezando por divisão. Saiu junto o aviso do contrato longo. O campo `fidelidade`
continua no tipo só pra não quebrar save de quem pegou aquela janela.

### O que ele decidiu NÃO mexer
Preço, prazo e formato. Levantei que o contrato de 5 temporadas domina (paga mais por
temporada **e** dá mais loja) e ele respondeu *"mantenha preços iguais já eram e
formatos / prazos"*. **Se um dia quiser resolver**: bônus de loja pelo ANDAR em vez do
prazo, ou inverter a régua (curto paga mais por temporada). As duas estão medidas na
conversa — e a segunda esbarra na trava de que o fornecedor paga menos que o Master.

**Reverter**: `git revert` volta as 4 marcas de antes; contrato correndo não quebra
porque os 4 ids e prazos antigos continuam os mesmos.

**Bancada**: `scripts/teste-rosto/index.html?fornecedor&div=A` (ou `&div=D`).

---

## 20/09/2026 (parte 43) — ⏱️ No holandês o host NÃO escolhe tempo (ele desfez o que eu tinha feito)

Na parte 42 eu tinha "consertado" o `auctionSecs` (o tempo do pregão da sala de
stream) fazendo ele ESTICAR ou ENCOLHER a descida do holandês. Ele leu e mandou
desfazer:

*"No stream não quero que tenha tempo pra escolher não, quando ele selecionar
holandês e stream remova a opção de escolher esse tempo. Só se for no padrão que
ele pode, senão vai dar merda — porque tem que ser com base na regra que fizemos
pro modo rápido."*

### ✅ Ele está certo, e é mais simples
Meu conserto criava **duas regras pro mesmo modo**: o pregão holandês da sala de
stream sairia com um ritmo e o da Partida Rápida com outro. Isso é exatamente a
fábrica de bug que ele odeia — e ainda por cima eu tinha inventado um PISO
(`HOL_PISO_MS`) pra segurar o caso em que o tempo pedido não cabia. Peça a mais pra
manter, problema a mais pra acontecer.

**Agora: o holandês tem UM relógio só, em toda sala.** Quem manda é a escada de
preços, e ela é idêntica na Partida Rápida, no Rápido online, no Minhas Ligas e no
Stream. `HOL_PISO_MS` e o escalonamento saíram do código.

### 🎛️ E o seletor de tempo SOME da tela
Na sala de stream, escolher 🔻 Holandês **tira o seletor de segundos** e põe no
lugar um aviso que explica (regra dele: toda trava diz o porquê):
> 🔻 No pregão Holandês não tem tempo pra escolher: quem manda o relógio é o PREÇO
> caindo, e a descida é a mesma em toda sala — igual à da Partida Rápida. O Modo
> Stream continua valendo (os valores ficam escondidos e você dá o start).

E o tempo não é nem **gravado** no estado da sala quando o pregão é holandês —
senão ficaria um número morto guardado lá, esperando alguém ler por engano.

### 🔒 A trava virou do avesso
`npm run holandes` agora reprova o CONTRÁRIO do que reprovava ontem:
- se o `holPassoMs` voltar a aceitar um tempo de sala (assinatura com 3 parâmetros);
- se a descida da sala ficar diferente da descida da Partida Rápida;
- se o seletor de tempo voltar a aparecer com o holandês ligado;
- se faltar o aviso explicando o porquê;
- se a sala holandesa voltar a gravar um tempo de pregão.

⚠️ **Lição**: quando uma opção da sala não faz sentido num modo, o certo é **tirar a
opção da tela**, não fazer o modo se contorcer pra atender. Eu fui pelo caminho
difícil primeiro.

🛡️ `npm run ascegas`: `28bea2df` · `d65041f6` · `06bab491` — iguais.

---

## 20/09/2026 (parte 42) — 🎥🏆 Holandês no STREAM e no MINHAS LIGAS: funciona, e achei um furo de ritmo

Pedido dele: *"agora veja se vai funcionar normal no modo stream e também em
minhas ligas"*. Fui rodar o pregão INTEIRO em cada uma em vez de supor.

### ✅ As cinco salas rodam até o fim
| sala | resultado |
|---|---|
| 🎥 stream (`auctionSecs = 0`) | 310 degraus · host deu o start · fecha no Monte |
| 🎮 manual | 310 degraus · fecha no Monte |
| ⏱️ tempo do host (20s) | 310 degraus · fecha no Monte |
| 🏆 Minhas Ligas | 310 degraus · fecha no Monte |
| 🏆 liga + stream | 310 degraus · host deu o start · fecha no Monte |

Nenhuma trava, nenhuma caixa negativa. O detalhe que o teste me ensinou: a **sala
de stream não abre no pregão** — ela abre no `streamIntro` e espera o HOST apertar
(`START_STREAM_AUCTION`). O holandês sobrevive a esse degrau a mais, e a trava
agora confere que depois do start a sala abre o pregão **holandês** e não o cego.

⚠️ Na 1ª rodada a trava acusou "stream travou" e "manual travou" — **era o meu
teste**, não o jogo: ele não sabia passar pelo `streamIntro` e não aceitava o Monte
Final como fim válido (o teste principal aceita). Consertado. Fica a lição: teste
novo que acusa bug em código que já roda merece uma segunda olhada NO TESTE antes
de sair mexendo no jogo.

### 🐛 O furo que apareceu: o tempo do host virava enfeite
Na sala de stream o host escolhe o tempo do pregão (`auctionSecs`) porque está
**narrando pra plateia**. O holandês **ignorava** esse número: ele pedia 20s e a
descida insistia nos 49s dela. É a família do "botão mudo" — a tela promete uma
coisa e o motor faz outra.

**Consertado**: a descida inteira passa a CABER no tempo pedido, mantendo a
proporção entre as marchas (corre em cima, respira embaixo).

| host pede | descida de verdade |
|---|---|
| 20s | **27s** ← o piso segurou |
| 30s | 30s |
| 45s | 45s |
| 60s | 60s |
| 90s | 90s |

🕳️ **O piso (`HOL_PISO_MS = 1200`) é deliberado**: por mais apertado que o host
peça, o degrau do fundo nunca fica mais curto que 1,2s — são esses milissegundos
que impedem meio segundo de internet ruim de decidir quem leva a carta. Quando o
tempo pedido não cabe, **o pregão estoura o relógio em vez de roubar carta de quem
está no 4G**. É a troca certa, e está escrita no código.

E `auctionSecs = 0` ("o host avança no botão") **não** virou 32 cliques por leva: o
host já deu o start na tela de abertura, daí pra frente a escada toca sozinha.

### 🔒 Travas novas em `npm run holandes`
Roda o pregão inteiro nas 5 salas · confere que a sala de stream passa pela tela do
host e abre HOLANDESA · que pedir mais tempo estica e pedir menos encurta · que o
piso do fundo segura mesmo num pedido absurdo (5s) · e que `0` não muda o ritmo.

🛡️ `npm run ascegas`: `28bea2df` · `d65041f6` · `06bab491` — iguais.

---

## 20/09/2026 (parte 41) — 🎚️ A escada afina a partir do 50 — e o holandês passou a ser MAIS LENTO que o cego

2º pedido dele sobre o relógio: *"sobre o tempo ainda acho q qd chegar no 50 na
regressiva pode ter mais números próximos… não tem problema demorar um pouco mais o
leilão não"*.

### 🎚️ A escada agora
```
100 · 90 · 80 · 70 · 60          ← pulo de 10 (enfeite puro)
55 · 50                          ← pulo de 5
46 · 42 · 38 · 34 · 30           ← pulo de 4   ← ERA 52 · 44 · 36 (de 8 em 8)
27 · 24 · 21                     ← pulo de 3
18 · 16                          ← pulo de 2
14 · 13 · 12 … 2 · 1 · 0         ← de 1 em 1
```
`v > 60 ? 10 : v > 50 ? 5 : v > 30 ? 4 : v > 20 ? 3 : v > 14 ? 2 : 1`.
De 50 pra baixo eram **3 degraus** (52·44·36), agora são **12** até o 14.

### 🕰️ E a marcha do meio passou a começar no 55 (era 40)
De nada adianta pôr mais número na faixa dos 50 se ele passar voando. Então:
| faixa | por degrau |
|---|---|
| acima de 55 | 0,5s (era 0,6 — acelerou, porque ali NUNCA acontece nada) |
| 23 a 55 | 1,4s |
| 22 pra baixo | 2,0s |

### ⚠️ O NÚMERO QUE ELE PRECISA SABER: o holandês virou o modo MAIS LENTO
| | pregão inteiro (93 cartas) |
|---|---|
| 🔻 holandês | **12:05** |
| ✉️ cego (hoje) | 11:15 |

Ele autorizou (*"não tem problema demorar um pouco mais"*), então **fica** — mas
registrando: até a parte 37 o holandês era a opção mais RÁPIDA (9:36, depois
10:57). Agora é **50s mais lento** que o pregão de hoje. Se um dia isso incomodar,
a alavanca mais barata é **abrir em 50 em vez de 100** (o topo 100→60 nunca vende
nada): corta ~2,5s por leva sem tocar na parte fina que ele pediu. A segunda é
baixar a marcha do fundo de 2,0s pra 1,7s — mas aí encosta no anti-delay, que é o
que protege quem tem internet pior.

Economia segue igual: 52 × 46 arremates · preço médio 12,1 × 13,3.

### 🔒 Travas novas
`npm run holandes` agora também reprova se: de 50 pra baixo aparecer pulo maior que
4 · houver menos de 20 degraus abaixo de 50 · o degrau do 50 durar menos de 1,2s
(passaria voando) · a descida passar de **55s** (teto novo, autorizado por ele — não
subir mais sem pedido).

🛡️ `npm run ascegas`: `28bea2df` · `d65041f6` · `06bab491` — iguais.

---

## 20/09/2026 (parte 40) — ↩️ O nome VOLTOU a ser HOLANDÊS (eu tinha lido errado)

*"Eu falei pra manter holandês mesmo."*

**Erro meu de leitura, e vale anotar como se deu**: ele perguntou *"qual nome eu
poderia dar pra esse modo, sem ser o nome holandês?"*, eu ofereci quatro opções, ele
respondeu **"[sem preferência]"** nas duas perguntas — e logo em seguida mandou
*"tô falando as salas abertas, colocar ali holandês sei lá, pra diferenciar"*.

Eu li aquele "holandês" como EXEMPLO ("põe o nome do modo aí, sei lá"). Era
**decisão**: manter Holandês. As duas leituras cabiam na frase, e eu escolhi a
errada — e, pior, escolhi sozinho num assunto que é 100% gosto dele.

👉 **Lição pra qualquer sessão**: "[sem preferência]" numa pergunta de GOSTO não é
carta branca — é sinal de que a pergunta não era a que ele queria responder. Quando
a resposta seguinte usar uma das palavras da pergunta, ela provavelmente É a
resposta. Na dúvida em assunto de gosto, perguntar de novo com uma frase, não
decidir.

### O que voltou e o que FICOU
- **Voltou**: o nome visível é **🔻 Holandês / 🔻 Dutch** em todas as telas e na
  novidade da home. `MODO_QUEDA` → **`MODO_HOLANDES`**.
- **Ficou** (foi o que ele pediu de verdade nesta rodada): o **selo na lista de
  salas abertas** (`🔻 HOLANDÊS`, vermelho, no nome da sala) e o **nome no topo do
  pregão**. Era isso o *"colocar ali… pra diferenciar"*.
- **Ficou também** a fonte única: o nome mora em UM lugar (`MODO_HOLANDES` em
  `store.tsx`) e toda tela puxa de lá. Foi o que fez este desfazer custar uma
  linha em vez de sete telas — e é o que vai deixar barato se ele um dia trocar.
- 🔒 A trava agora **segura o nome**: `npm run holandes` reprova se alguém
  rebatizar sem ele pedir, e reprova se alguma tela escrever o nome na mão.
- ⛔ **Não repropor outro nome.** Os quatro que ofereci (Queda Livre · Quem Pega,
  Leva · Liquidação · Quem Pisca, Perde) ficam só como registro.

---

## 20/09/2026 (parte 39) — 🏷️ O modo virou 🔻 QUEDA LIVRE, e aparece nas salas abertas

Ele pediu: *"qual nome eu poderia dar pra esse modo do leilão, sem ser o nome
holandês? Outra coisa: o nome do modo tem que aparecer nas salas criadas né, de
alguma forma"* — e depois, com o print da lista: *"tô falando as salas abertas,
colocar ali holandês sei lá, pra diferenciar"*. Ofereci quatro nomes e ele deixou a
escolha comigo.

### 🔻 Ficou **Queda Livre** (Free Fall)
Por quê, entre os quatro:
- **nomeia o que a pessoa VÊ** — o número despencando na tela;
- **cabe no selo** da lista de salas (duas palavras);
- **não mente**: "Liquidação" e "Pechincha" prometeriam que tudo sai barato, e
  nesse modo o craque sai CEDO e CARO (o barato é o que sobra no fim);
- **traduz limpo** (Free Fall), e o jogo é BR/EN.
Os descartados ficam registrados caso ele mude de ideia: Quem Pega, Leva (First to
Grab) · Liquidação (Clearance) · Quem Pisca, Perde (Blink and Lose).

### 🔑 A chave no código CONTINUA `holandes`
De propósito, e é regra da casa: nome que o código compara, guarda no save ou grava
no `game_state` da sala **não é rebatizado** — senão toda sala criada antes desta
linha deixaria de abrir. O que mudou é só o que a pessoa LÊ.

### 📍 Onde o nome aparece agora
1. **Lista de salas abertas** — selo VERMELHO no nome da sala, do lado do `BR`
   (`🔻 QUEDA LIVRE`). Foi pra lá e não pra linha de baixo porque essa é a
   diferença mais grossa entre duas salas: quem entra sem saber cai num jogo com
   outra regra de lance. Tem `title` explicando, pra quem passa o dedo.
2. **Topo do pregão** — `🔻 QUEDA LIVRE` em vermelho miúdo, acima de `GOLEIROS`.
   Quem entrou numa sala que outra pessoa criou descobre ali.
3. **As duas telas de montar** (partida rápida e sala online) — o botão de escolha.
4. **A novidade da home** (PT + EN) — reescrita com o nome novo.

### 🔒 Trava: o nome mora num lugar SÓ
`MODO_QUEDA` em `store.tsx` é a fonte única; toda tela puxa de lá. O
`npm run holandes` agora reprova se: a lista de salas não souber ler a bandeira ·
o selo não for desenhado · alguma tela escrever o nome na mão em vez de puxar da
fonte · ou se sobrar "🔻 Holandês" escrito em qualquer tela.

📷 **O que não deu pra fotografar**: a lista de salas exige login, e eu não entro na
conta dele. Por isso o selo é conferido na FONTE (existe, lê a bandeira certa, usa o
nome da fonte única) em vez de por print.

---

## 20/09/2026 (parte 38) — 🐛 Dois bugs que ele pegou JOGANDO com o pessoal (os dois do mesmo print)

Ele terminou uma sala com os amigos e mandou duas fotos.

### 🐛 1 — o "novo leilão" voltava pro ENVELOPE CEGO
Palavras dele: *"tava no modo holandês e todo mundo votou pra uma nova. Porém foi
criado no modo às cegas. Sendo que estávamos jogando modo holandês… então tem que
seguir com a mesma regra e modos e tudo que foi feito a sala"*.

**Causa, e ela é estrutural**: o `START_ONLINE` **zera tudo que não vier na ação**.
Então cada escolha da sala tem que ser REENVIADA na revanche, uma a uma, na mão. Eu
liguei o holandês e não reenviei. **É a MESMA falha de 08/08** (naquele dia o que
sumiu foi o modo stream) — ou seja, a 2ª vez que a revanche come uma regra da sala.

**Consertado**: a revanche reenvia `holandes` — e também **`sport`**, que estava
faltando do mesmo jeito e é pior: uma sala de **BidLegends virava futebol** no novo
leilão. Ninguém tinha reclamado só porque o basquete abre pra uma conta só.

### 🐛 2 — o campinho do LEILÃO mostrava ⚽ e 🅰️ antes de a bola rolar
Na 2ª foto, o Bernabei aparece na escalação com gol e assistência **durante a
revelação do pregão**, sem nenhuma partida jogada.

**Causa**: o campinho acha o número pelo **NOME + time** (`golsDe`/`assistDe` em
`screens.tsx`), e os **sete** caminhos de "começar leilão novo" zeravam `news`,
`champion` e `round` — mas **não** `scorers`, `assists` e `lastResults`. Quem
reaparecia na mesma cadeira herdava o número do ano anterior.

**Consertado em CINCO dos sete**, e a escolha foi deliberada:
- ✅ zeram: `START` (rápido) · `START_NBA` · `START_NBA_CAREER` ·
  `START_CAREER_SOLO` · `START_ONLINE`;
- ⛔ **NÃO zeram**: `REAUCTION_ONLINE` e `RESERVE_AUCTION_ONLINE` — esses dois são
  de MEIO de carreira (o `round` nem volta a 0). Zerar ali apagaria a artilharia da
  temporada **em andamento**, que seria um bug pior que o consertado.
- **A régua**: zera junto com o `round = 0` e o `champion = null`. Se a temporada
  virou, a artilharia vira junto.
- ⚠️ `rivalries` fica FORA: o retrospecto entre amigos atravessa temporada (é o
  "Rivalidade V=2 D=1" da tela de próximo jogo).
- 🅰️ E, como manda a regra permanente, **gol e assistência zeram na MESMA linha** —
  pra ninguém esquecer metade.

### 🔒 Trava nova: `npm run revanche`
Ela confere as duas coisas, e a 1ª é a que importa pro futuro:
1. **as 15 escolhas da sala** têm que estar na chamada do "novo leilão" (baralho,
   várzea, copa, **holandês**, **esporte**, stream, manual, chat, tempo, liga sem
   bots, Minhas Ligas, senha, hash, temporada, duplas). Esquecer uma é bug MUDO —
   a sala volta pro padrão e ninguém entende;
2. artilharia/assistência/resultados zeram nos três caminhos principais, e o
   retrospecto entre amigos **não** zera.

⚠️ Detalhe pra quem for mexer nela: o Vite serve o `.tsx` **já transpilado**, então
cortar o bloco por indentação ou por número de caracteres não funciona (tentei, e a
trava acusou falta de campo que estava lá). A janela é achada **contando chaves** a
partir do `type: 'START_ONLINE'`.

### 🛡️ `npm run ascegas` depois de tudo
`28bea2df` · `d65041f6` · `06bab491` — iguais. O leilão cego segue intocado mesmo
com o `START` dele tendo ganhado a linha de zerar artilharia.

---

## 20/09/2026 (parte 37) — 🎚️ A escada afina perto do 30 (pedido dele, com o jogo já no ar)

Ele jogou e aprovou (*"tô adorando"*), com um pedido: *"só acho q tem q qd começa a
chegar próximo do 30 começar a cair os números cada vez mais próximo de um por um
sabe"*. E logo depois: *"sim, pode aumentar um pouco mais, não tem problema… só um
pouco mais também"* — ou seja, autorizou a descida ficar mais longa.

### 🎚️ A escada agora
```
100 · 90 · 80 · 70 · 60 · 52 · 44   ← pulos de 10 e 8 (enfeite: ninguém paga isso)
36 · 31                             ← pulos de 5
26 · 23                             ← pulos de 3
20 · 18 · 16                        ← pulos de 2
14 · 13 · 12 · 11 · 10 · 9 … 1 · 0  ← de 1 em 1
```
A conta é `v > 60 ? 10 : v > 40 ? 8 : v > 30 ? 5 : v > 20 ? 3 : v > 14 ? 2 : 1`.
Bate com o que ele quis: **de 30 pra baixo o pulo vai encolhendo até virar 1**. E
faz sentido no jogo — o preço médio de arremate medido é ~12 🪙, então é ali que a
carta troca de mão de verdade.

### ⏱️ E o relógio virou TRÊS marchas (senão o modo perdia a vantagem)
Só afinar a escada engordava a descida em ~11s e o holandês passaria a ser mais
LENTO que o envelope cego — matando a única vantagem de tempo que ele tem. Então o
relógio desce junto com a escada:
| faixa | tempo por degrau | por quê |
|---|---|---|
| acima de 40 | 0,6s | enfeite, ninguém paga |
| 23 a 40 | 1,4s | a tensão começa |
| 22 pra baixo | 2,0s | é aqui que a carta troca de mão |

Os **2,0s do fundo** são a peça do anti-delay: com dois segundos pra reagir, meio
segundo de internet ruim não decide carta nenhuma.

### 📊 Medido depois (`npm run holandes`)
- descida da leva: **43,8s** (era 39,4s) — ainda **abaixo** dos 45s do envelope cego;
- pregão inteiro: **10:57** contra **11:15** do cego. Continua mais rápido, com folga
  menor — que foi exatamente o que ele autorizou;
- economia igual: 49 × 51 arremates · 40 × 38 vagas vazias · 12,3 × 11,6 de preço.

### 🔒 E virou LEI na trava
`npm run holandes` agora reprova se: algum pulo **aumentar** na descida · de 30 pra
baixo aparecer pulo maior que 5 · os 14 últimos degraus não caírem de 1 em 1 · o
fundo não for a marcha mais lenta das três. Ninguém desfaz isso sem o teste gritar.

### 🛡️ `npm run ascegas` depois de tudo
`28bea2df` · `d65041f6` · `06bab491` — iguais.

---

## 20/09/2026 (parte 36) — 🙈 "Ainda não tô vendo no online ao criar sala" — dois motivos, os dois meus

Ele foi olhar e não achou. Duas coisas, e a segunda era bug meu:

### 1️⃣ Não está na `main` — nada disso foi pro ar
O trabalho todo do holandês vive no branch `claude/denis-save-file-x1osct`. O site
ao vivo é a `main`, que não tem uma linha disso. **Ele estava olhando o jogo no
ar.** Enquanto não houver o OK dele + merge, não vai aparecer.

### 2️⃣ E, quando aparecesse, estaria NO LUGAR ERRADO (bug meu)
Eu pus o campo "Como é o leilão" na seção velha da tela de criar sala. Só que a
tela **v2 está ligada pra todo mundo** (`CRIAR2_GERAL = true` em `sport.ts`) e ela
**recolhe aquelas seções dentro de um ⚙️ Ajustes**. Ou seja: o campo existia, mas
escondido atrás de uma engrenagem. Escolher o tipo de pregão é a decisão mais
importante da sala — não pode ficar lá.

**Movido pra Section "⚽ A partida"**, que é visível nas DUAS telas (a v2 e a
antiga).

### 3️⃣ E ele aparecia em modo que NEM TEM LEILÃO
O `{!isCareer && …}` que eu usei liberava também o **🃏 Bafo** (*"SEM LEILÃO — cada
um traz o time da própria carreira"*) e a **🌍 Copa do Mundo** (sala de seleções,
sem leilão). Perguntar "como é o leilão" numa sala sem leilão é justo o tipo de
tela torta que ele odeia.

Agora a condição é explícita e é a ordem dele: **`roomMode === 'rapido' || liga`**
— ⚡ Rápido online e 🏆 Minhas Ligas, mais nada. E a gravação no `game_state`
ganhou a MESMA condição, senão escolher Holandês no rápido e depois trocar pro
Bafo deixava `holandes: true` guardado numa sala sem pregão.

⚠️ **Lição**: `!isCareer` **não** quer dizer "tem leilão". Esta tela tem 5 modos, e
dois deles não leiloam nada. Quem for pôr opção de pregão aqui, liste os modos na
mão.

### 🛡️ Conferido depois de tudo
`npm run holandes` verde · `npm run ascegas` com as MESMAS digitais da main
(`28bea2df` · `d65041f6` · `06bab491`).

---

## 20/09/2026 (parte 35) — 🌐 Holandês LIGADO no online (Rápido online + 🏆 Minhas Ligas)

Ordem dele: *"ok pode criar no partida rápida e no modo rápido online e minhas
ligas"*. Os três estão ligados. **A Carreira online fica de fora** de propósito: lá
o pregão é o de sempre, e carreira é save longo — não é lugar de estrear modo.

### 🎛️ Onde o host escolhe
Na tela de montar a sala, um `SegField` novo — **"Como é o leilão"**, com `✉️
Envelope cego` (padrão) e `🔻 Holandês` — no mesmo lugar e estilo do "Baralho de
craques" e da "Formação". A escolha **é do HOST e vale pra sala inteira**: vai
gravada no `game_state` (`holandes: true`), então quem entra depois joga o mesmo
pregão, não o que o aparelho dele preferia. **Sala antiga não tem o campo → leilão
cego**, como sempre.

### 🔒 O SEGREDO QUE NÃO PODE VAZAR (o perigo real do online)
O estado do holandês é quase todo público — o pregão acontece na cara de todo
mundo. **Menos os `tetos`**: eles dizem por quanto cada robô vai apertar em cada
carta. Convidado com isso na mão sabe a hora exata de cortar o bot em TODA carta do
pregão — acabou o jogo. Então o `sanitize` (o mesmo que já esconde o
`pendingEnvelopes`) passou a **zerar `hol.tetos`** antes de o host mandar o pacote
pra sala. **Trava nova (seção 7)** confere as duas pontas: que o teto NÃO sai, e
que preço/degrau/`levados` SAEM (senão a tela do convidado não desenha nada).

### 📮 E o toque do convidado ganhou ESTRADA RESERVA
O `HOLANDES_PEGAR` entrou na lista dos recados que também vão **pelo banco**
(`room_acoes`, por HTTPS), além do rádio — e o host passou a lê-lo. Motivo: é o
recado mais urgente do jogo. Se o lance cego se perde, dá pra reenviar em 4s; aqui
**o preço está caindo**, cada toque vale por um preço que não volta. Diferente dos
outros, ele vai **sem folga de espera** — e chegar pelas duas estradas não compra
duas vezes, porque o reducer recusa toque com preço velho e carta que já tem dono.
O vigia do host também passou a acordar na fase `'holandes'`.

### 👑 Host sumido no meio da descida
Continua valendo a **regra permanente da coroa**: a sala PARA e espera o dono. No
holandês o `phaseDeadline` é `null` (quem manda o relógio é a escada de preços),
então não existe "fecha sozinho". É o comportamento desejado, não bug.

### 🛡️ E o às cegas continua intocado
`npm run ascegas` rodado DEPOIS de toda a fiação do online: `28bea2df` · `d65041f6`
· `06bab491` — as mesmas três digitais da `origin/main`.

### 📷 O que eu NÃO consegui mostrar
A tela de criar sala **exige login**, e eu não vou entrar na conta dele pra tirar
print. Então o botão novo do lobby é a única peça deste trabalho que ele ainda não
viu em foto — as do pregão (partida rápida) estão todas conferidas. Quando ele abrir
uma sala, é o 3º campo da tela, logo acima da Formação.

---

## 20/09/2026 (parte 34) — 🛡️ PROVA de que o leilão às cegas não foi tocado (`npm run ascegas`)

Ordem dele: *"tudo q estamos fazendo aqui, não mexa em nada o que já funciona no
modo às cegas, pelo amor de Deus"*.

Ler o diff e dizer "não mexi" **não vale** — é exatamente assim que bug entra.
Então virou prova, e a prova mora no repo: **`npm run ascegas`**.

### 🔬 Como ela funciona
Ela joga **três pregões às cegas INTEIROS** (sala de 6 · 8 · 12, formações e
baralhos diferentes) com o acaso **travado** — o `Math.random` é trocado por um
gerador de semente fixa, então baralho, bots, lances, empates e monte saem sempre
iguais. No fim imprime uma **impressão digital**: caixa + elenco + preço pago +
via, de todos os técnicos, resumido num número.

Se um dígito mudar, alguma coisa do modo às cegas mudou.

### ✅ O resultado (rodado nos dois lados)
| pregão | meu branch (com o holandês) | `origin/main` pura |
|---|---|---|
| sala de 6 · 4-3-3 · BR | `28bea2df` | `28bea2df` |
| sala de 8 · 4-4-2 · BR | `d65041f6` | `d65041f6` |
| sala de 12 · 4-3-3 · Europa | `06bab491` | `06bab491` |

**Idênticas.** Todo o trabalho do holandês (partes 25 a 33) não muda **uma moeda**
do pregão de hoje.

### 🧰 Como repetir
```
git worktree add /tmp/antes origin/main
ln -s "$PWD/node_modules" /tmp/antes/node_modules
cp scripts/prova-as-cegas.mjs /tmp/antes/scripts/
cd /tmp/antes && node scripts/prova-as-cegas.mjs --porta 5246
```
⚠️ **Compare sempre contra a MESMA base.** Na 1ª tentativa eu comparei com a
`origin/main` que já tinha as 49 cartas novas de outra sessão — as digitais não
bateram por causa do BARALHO, não do meu código. Ou se compara contra o
`git merge-base`, ou se traz a main pro branch antes (foi o que fiz).

### 🔀 Main trazida pro branch
`origin/main` andou (49 cartas novas, e a agência pagando por artilheiro/Bola de
Ouro). Merge feito; o único conflito foi este arquivo, com as duas sessões
escrevendo no topo — ficaram as duas.

Com o baralho novo, o holandês continua batendo o cego: **51 × 51 arremates,
37 × 37 vagas vazias, 12,5 × 12,2 de preço médio — e 9:36 contra 11:15.**

---

## 20/09/2026 (parte 33) — 🛟 A repescagem FAZ falta (eu estava errado) — e virou descida holandesa

Ele perguntou: *"e sobre repescagem acha q não deve ter mesmo?"*. Fui medir em vez
de opinar, e **a medição me desmentiu**.

### ❌ Onde eu errei
Eu concordei em tirar a repescagem com o argumento: *"o preço já passou por 1 moeda
na frente de todo mundo, todo mundo teve chance"*. Isso vale pra **GENTE** — você vê
a lista e pega o que quiser por 1 moeda. **Robô não funciona assim**: o teto dele sai
do `cpuEnvelope`, que só olha as `need` cartas mais bem ranqueadas. Carta que ele
nunca ranqueou, ele **não pega nem de graça**. E a pirâmide é quase toda robô.

Com a repescagem simplesmente removida: **55 vagas vazias** (contra 38 do cego) e
**32 moedas encalhadas** por técnico. 17 perna-de-pau a mais por leilão — justo a
reclamação dele de 19/09.

### 🛟 O que ficou (e respeita o que ele pediu)
Ele disse *"não tem negócio de repescagem nesse leilão"* — e quanto à **TELA** ele
está certo: envelope cego no meio de um leilão holandês é outro jogo. Então:
- **a repescagem continua existindo, mas como DESCIDA HOLANDESA**: as sobras do
  setor voltam pra mesa e o preço cai de novo. Mesmo visual, mesma lista, mesmo
  botão. Nenhuma tela nova;
- e antes disso, **dentro da própria descida**, quando o preço cruza 25% da
  abertura, os robôs que ainda têm buraco **reavaliam o que sobrou na mesa**
  (`holResgate`, usando o `cpuEnvelope(rescue)` que a repescagem de hoje já usa).

### 📊 E aí a conta fecha — inclusive o TEMPO, que eu vinha medindo errado
⚠️ **Segundo erro de medição desta série**: eu vinha dizendo que o pregão cego leva
"6:00". Mentira — eu contava só as levas e **esquecia as rodadas de repescagem
dele**, que também custam 45s cada. O cego de verdade leva **11:15**.

| | arremates | vagas vazias | moeda encalhada | pregão |
|---|---|---|---|---|
| 🔻 holandês | 53 | **36** | 23,4 🪙 | **9:51** |
| ✉️ cego (hoje) | 48 | 41 | 21,4 🪙 | 11:15 |

Ou seja, com a repescagem holandesa o modo novo ficou **melhor em tudo**: menos
perna-de-pau (36 × 41), mais carta colocada (53 × 48) e **1min24 mais rápido** que
o pregão de hoje.

### 🎬 E a tela depois da descida: FICA O REVEAL (decisão dele)
*"A manter revelando quem pagou valor e etc… se for lenda mostrará avatar e etc"*.
Nada a construir: o holandês já cai no `Reveal` de sempre, que mostra carta por
carta com o vencedor e o valor, e já trata lenda (selo 👑 LENDA, chime dourado,
áudio e o festão). O holandês passa por ele igual ao pregão cego.

### 🧠 Lição (a terceira desta série, e a mais cara)
**Toda comparação entre os dois modos tem que incluir as FASES INTEIRAS dos dois.**
Comparar "a leva do holandês" com "a leva do cego" e esquecer a repescagem do cego
deu 6:00 × 9:51 (holandês perdendo) quando a verdade é 11:15 × 9:51 (holandês
ganhando). Erro de escopo de medição, igual ao seed da parte 27 e ao arremate
contado duas vezes da parte 26.

---

## 20/09/2026 (parte 32) — ⏱️ O Diego escolheu POR TEMPO. E o holandês perdeu a repescagem.

Ele leu a parte 31 (roleta) e decidiu o contrário: *"eu ainda acho que deveria ter
que ser por tempo… só quando der alguma merda e o jogo não entender é aí sim iria
pro desempate. Eles não precisariam saber disso também, pra eles é como se fosse ao
mesmo tempo"*. Eu tinha levantado o argumento da internet; ele ouviu e escolheu.
**Decisão dele, implementada.**

### ⏱️ A regra agora
- **Pessoa aperta → a carta é dela NO MESMO TOQUE.** Sem janela, sem esperar
  degrau. Entra em `levados` na hora, e o campinho desenha na hora.
- **Chegou em segundo → recusado**, e a carta já aparece com o nome do outro.
- **Robô continua atrás da gente**: ele entra numa fila (`pedidos`) e só é servido
  no FIM do degrau. Se uma pessoa apertar naquele degrau, ela passa na frente.
  Regra antiga dele, mantida — senão o robô apertaria no milissegundo e ganharia
  sempre.
- **A roleta virou REDE INVISÍVEL**, que é exatamente o que ele pediu: ela só age
  na fila dos robôs (dois com o mesmo teto) ou se algum caminho novo um dia
  depositar dois pedidos na mesma carta. Ninguém vê: pra quem joga, "o outro
  chegou antes".

### 🔒 E o medo dele — "os dois põem o jogador no campinho?" — fica ainda MAIS seguro
Por tempo é mais simples de garantir que por janela: quem escreve `levados` é **só
o host, uma ação de cada vez**, e a primeira linha da carta tranca todas as outras.
Não existe ordem de execução em que os dois passem.
**Trava**: 40 disputas seguidas, alternando quem aperta primeiro — *quem apertou
primeiro levou **40/40***, e a carta nunca saiu duas vezes.

### 📱 A regra que o ONLINE vai ter que respeitar (ainda não ligado)
O convidado **não escreve `levados` no próprio aparelho**. Ele mostra **"✋
ENVIANDO"** e só desenha o jogador no campinho quando o host confirmar — o mesmo
padrão do "ENVIANDO…" do envelope cego. Se a tela dele entregasse na hora e o host
dissesse "não foi você", o jogador **apareceria e sumiria** do campinho. O estado
da tela já está pronto pra isso (`enviando` local); falta só o cano.

### 🗑️ E o holandês NÃO TEM MAIS REPESCAGEM
Palavras dele: *"não tem negócio de repescagem nesse leilão eu acho… quem não pegou
se ferra que vai ter que ir pro monte mesmo então. No 0 não tem empate também, é
monte direto"*. **Ele está certo**: a repescagem existe pra dar uma última chance de
PAGAR pelas sobras — mas no holandês essa chance já foi dada, o preço passou por 1
moeda na frente de todo mundo. Repescar depois seria leiloar a mesma carta duas
vezes. Agora, no holandês: **acabou a descida → o que sobrou vai direto pro Monte
Final**. (No pregão cego a repescagem continua exatamente como sempre.)

### ❓ O QUE FICOU EM ABERTO — precisa da decisão dele
Ele levantou, e eu NÃO construí pra não chutar: *"a próxima tela eu acho que já
seria outra lista não?? Ou apenas mostrar as cartas de quem pegou quem?? Até porque
se tiver lendas mostra também a carta da lenda com avatar também faz sentido assim.
E aí nessa área apareceria o desempate."*

São duas perguntas:
1. **Depois da descida, vai direto pra próxima lista (próximo setor) ou tem uma
   tela de resumo** mostrando quem levou quem, com a carta da lenda e avatar?
   → hoje está indo pro `Reveal` de sempre, que já mostra carta por carta com o
   vencedor. Dá pra: (a) manter, (b) pular direto pro próximo setor, ou (c) fazer
   um resumo novo em grade, com destaque pra lenda.
2. Ele falou em pôr o **desempate nessa área**. Com a regra por TEMPO isso perdeu a
   função (não sobra empate pra decidir) — mas se ele quiser o re-lance cego de
   volta pros casos de empate, é aqui que ele moraria.

---

## 20/09/2026 (parte 31) — 🎰 O desempate afunilado: NEM valor, NEM tempo — roleta. E o número numa sala de 20

Perguntas dele: *"e se der ao mesmo tempo alguém pegando junto? Como desempata…
ou já vai mostrar na hora alguma informação q o outro pegou um milésimo de segundo
na frente? E é com base no valor ou no tempo?? Precisamos afunilar tudo isso pq
imagina uma sala c/ 20 pessoas, tudo pode ocorrer"*.

### 📏 A REGRA, afunilada (é esta, e não muda)
Na janela de meio segundo, **a ordem de chegada NÃO conta**. Quem apertou naquele
preço está na disputa, ponto. Aí, nesta ordem:
1. **Gente ganha de robô.** Sempre. Se tem uma pessoa na fila, nenhum bot leva.
2. **Gente × gente → 🎰 roleta**, chance igual pra todos.
3. **Preço**: é o MESMO pra todo mundo (é o número da tela), então valor não
   desempata — não tem como, ninguém ofereceu mais que ninguém.

### 🤔 Por que NÃO é por tempo
"Quem apertou um milésimo antes" = **quem tem a internet melhor**. No online o
toque viaja até o host, e essa viagem não é igual pra todo mundo. Decidir por
tempo é decidir por operadora. Numa sala de 20 isso vira "o host e o do wifi bom
ganham tudo" — e o resto larga a sala.

### 🤔 E por que NÃO é por valor (mas o valor JÁ decidiu antes)
Não dá pra desempatar por valor porque os dois ofereceram **o mesmo preço**: o da
tela. Mas repare que o valor decide o jogo inteiro **antes** disso: quem quer o
Cafu de verdade aperta em **44**, não espera chegar em 16. Quem espera ganha
preço e arrisca dividir. **A roleta é só o que sobra quando duas pessoas quiseram
exatamente igual** — e aí o sorteio é o único juiz que não é a operadora de
celular.

### 📊 E COM 20 PESSOAS, QUANTO ISSO ACONTECE? (medido)
| sala | cartas resolvidas | deram empate | % | roleta média | maior roleta |
|---|---|---|---|---|---|
| 8 técnicos | 35 | 6 | **17%** | 2,2 técnicos | 3 |
| 20 técnicos | 78 | 17 | **22%** | 2,6 técnicos | 4 |

Ou seja: **4 em cada 5 cartas vão pra quem quis mais** (apertou mais cedo, pagou
mais). A roleta é 1 em 5, quase sempre entre 2 ou 3, e nunca passou de 4 numa sala
cheia. A trava reprova se passar de **34% das cartas** ou se der roleta com **mais
de 6 técnicos** — se um dia passar disso, o leilão virou sorteio e a regra precisa
mudar.

### 👀 E mostra na hora?
Mostra, e agora com o número da briga:
- pra todos: `🎰 Cafu → Rei da Bola FC por 16 🪙 · 3 pediram no mesmo preço — a
  roleta girou`;
- pra **quem perdeu**, faixa vermelha própria: *"Você pediu o Cafu por 16 🪙 — 3
  pediram no mesmo preço e a roleta deu pro Rei da Bola FC. Sua moeda continua no
  bolso. Pra não depender de sorteio, aperte MAIS CEDO: quem paga mais caro não
  divide com ninguém."* — a trava explica o porquê **e o caminho**, como ele exige.

### 🔀 A ALTERNATIVA que existe e NÃO foi ligada (decisão dele)
Dava pra mandar o empate pro **re-lance cego** que o pregão já tem
(`resolveOneTiebreak`): os empatados escrevem escondido e quem paga mais leva.
É mais "leilão" que sorteio. **Não liguei** porque, com 22% de empate e 21 levas
numa sala de 20, seriam **~17 paradas** no meio do pregão — e a regra de ouro dele
é que *nada pode atrasar o ritmo do jogo*. Se ele preferir o re-lance mesmo assim,
é ligar: o motor do desempate já existe e está testado.

---

## 20/09/2026 (parte 30) — ⚡ "Quando o cara aperta ele não pega na hora?" — agora pega (meio segundo)

Ele leu a parte 29 e estranhou, com razão: *"não entendi. Qd o cara aperta ele não
pega na hora e já não vai pro campinho dele??"*.

**Eu tinha exagerado na dose.** Na parte 29 o arremate só saía quando o DEGRAU
fechava — até 2 segundos parado olhando pra tela sem saber se era seu. Chato, e
contra a regra de ouro dele (*"nada pode atrasar o ritmo do jogo"*).

Agora a entrega tem **janela própria de meio segundo** (`HOL_JANELA_MS = 500`,
ação `HOLANDES_JANELA`), separada do relógio do preço:
- **apertou e ninguém mais apertou → a carta é sua em 0,5s**, sem esperar o degrau.
  O preço nem se mexe. Do lado de quem joga, é "na hora";
- **alguém apertou junto** → os dois entram na 🎰 roleta, como na parte 29.

### 🤔 Por que não pode ser ZERO (a pergunta por trás da pergunta)
No online o toque do convidado **precisa viajar até o host** de qualquer jeito. As
opções eram:
- **entregar na hora na tela dele** e o host responder depois "não foi você" → aí o
  jogador APARECE no campinho e SOME. É exatamente o estado quebrado que ele odeia
  (regra nº 3 do CLAUDE.md);
- **esperar o host** → a espera existe do mesmo jeito, só que honesta.

Ou seja: a espera não é escolha minha, é a rede. O que dá pra escolher é o tamanho
dela e se ela é justa. Meio segundo é maior que a diferença de internet entre dois
celulares na mesma partida e menor que o que a mão sente.

### 🧪 Travas (`npm run holandes`)
- **5-zero** (nova): aperta SOZINHO → `HOLANDES_JANELA` entrega a carta, o degrau
  **não anda**, o preço **não muda**, paga o que estava na tela e entra em
  `levados` (que é o que o campinho desenha). Com contador anti-verde-falso.
- `HOL_JANELA_MS` tem que ficar entre **250ms e 700ms** — abaixo disso não cabe a
  diferença de internet, acima disso a mão sente.
- A disputa de dois humanos (parte 29) passou a fechar pela JANELA também. Roleta:
  **20 × 20** em 40 disputas.

### 🏷️ E o texto mudou junto
O botão travado deixou de dizer "✋ PEDI" (que soava "torce pra dar certo") e passou
a dizer **"✋ É SEU!"**. A explicação de baixo agora é: *"Apertou, é seu — o jogador
cai no seu campinho em meio segundo. Esse tiquinho existe só pro caso de outra
pessoa apertar junto."*

---

## 20/09/2026 (parte 29) — 👥👥 "E se os DOIS apertarem quase junto? Vão os dois pôr o jogador no campinho?"

Pergunta dele, e é o pesadelo clássico do leilão ao vivo: *"agora é sobre o delay e
sobre o usuário apertar pegar ao mesmo tempo quase?? E aí?? Será q vai os dois pôr
o jogador no campinho e tal?? O mesmo jogador"*.

**NÃO VAI — e não é promessa, é como o código foi montado.** Apertar não arremata:
vira um PEDIDO do degrau. Quando o degrau fecha, o `holResolvePedidos` junta TODOS
os pedidos daquela carta e escreve **UMA linha** em `hol.levados`. E `levados` é a
fonte ÚNICA de tudo: o campinho (`YourPitch`), a caixa, a vaga e o
`pendingEnvelopes` que fecha a leva. Não existe caminho no código em que a mesma
carta saia com dois donos.

### 🧪 A trava que prova (`npm run holandes`, seção 5-bis)
Simula a sala online de verdade: **dois assentos HUMANOS** pedindo a MESMA carta no
MESMO degrau. Confere, uma a uma:
- antes do degrau fechar, **nenhum dos dois** tem a carta (pedido ≠ arremate — é o
  arremate por ordem de chegada que ele temia);
- depois de fechar, a carta sai com **1 dono**, e pelo preço que estava na tela;
- **quem perdeu não paga NADA** e continua com a vaga aberta (a caixa dele nem se
  mexe — conferido moeda a moeda);
- quem perdeu **vê o porquê** numa faixa 😤 (`ultimo.perdedores`), em vez da carta
  sumir em silêncio;
- **o mesmo jogador não entra em dois campinhos** (soma dos `levados` dos dois = 1);
- e o botão apaga pros DOIS: ninguém aperta numa carta já arrematada.

### 🎲 E a roleta não é viciada
40 disputas repetidas deram **22 × 18**. A trava reprova se um dos dois nunca ganhar
ou se ficar abaixo de 25%. Isso importa: se o host ganhasse sempre, o convidado
largava a sala na primeira noite — e "o host manda" (regra dele) é sobre QUEM
arbitra, não sobre quem leva a carta.

⚠️ **E a trava confere que ela própria RODOU** (`disputaTestada`). A simulação tem
`if`s (precisa achar uma carta que os dois possam pegar); sem esse contador, ela
podia ficar verde sem ter conferido nada. Teste que não roda é pior que teste nenhum.

### 📶 E o delay, em uma frase
Cada degrau dura **~2 segundos**. O host não olha quem chegou primeiro — ele espera
o degrau FECHAR e resolve todo mundo junto. Então meio segundo de internet ruim não
tira a carta de ninguém: quem apertou naquele preço está na disputa, ponto.

### ⏳ O que ainda falta pra isso valer online de verdade
O **roteamento** (`HOLANDES_PEGAR` do convidado → host, e o host transmitindo preço
e `levados`). A REGRA que decide já está pronta e travada; o que falta é o cano.
Enquanto não for ligado, o holandês só aparece na partida rápida offline.

---

## 20/09/2026 (parte 28) — ⚽ O campinho enche NA HORA no holandês

Pedido dele: *"além disso conseguiu o jogador aparece no campinho do usuário embaixo
também"*. Feito — e o campinho é o `YourPitch` de sempre, o MESMO que o pregão cego
já mostra embaixo da tela. Nada de desenho novo.

**O detalhe que precisou de código**: no holandês a carta arrematada só entra no
elenco de verdade quando a LEVA FECHA (quem paga e move é o `resolve` de sempre —
foi assim que a gente garantiu que o holandês não mexe no dinheiro). Então, no meio
da descida, o campinho mostraria só as levas ANTERIORES e o jogador que você acabou
de levar não apareceria. Agora o `YourPitch` desenha também o que está em
`hol.levados` no seu nome.

✅ **E isso não vaza nada**: no holandês o martelo cai na frente de todo mundo, não
existe revelação escondida pra estragar. O NÍVEL continua secreto até a Cerimônia —
o campinho nunca mostrou nível, só nome e posição. A trava anti-spoiler da
revelação (`pendingIds`) continua intacta e vem depois, então o pregão cego não
mudou em nada.

Conferido na tela: apertei PEGAR no Cortês a 16 🪙 → a carta saiu da lista pra "🫵
VOCÊ", a caixa foi de 100 pra 84, a vaga de lateral foi de 2 pra 1 e ele apareceu
no campinho de baixo, tudo no mesmo instante.

### 👥 E a regra do baralho por número de usuários (ele repetiu)
Continua valendo o que a parte 27 mediu: **é a mesma regra de hoje**, e o holandês
não encosta nela. O baralho sai do `buildDeck(auctioningManagers(...))` antes do
pregão; o holandês só entra no `startAuctionPhase`, depois. 20 técnicos = 220 vagas
= 225 cartas = 21 levas, idêntico nos dois modos.

---

## 20/09/2026 (parte 27) — 👥 "O baralho segue a quantidade de usuários, igual à regra que já funciona?" — SIM

Pergunta dele: *"tem q ser msm regra c/ base na quantidade de jogadores usuários q
entram no online igual a regra q já funciona ou tô errado?"*.

**Ele está certo, e já é assim** — não precisou mexer em nada. O baralho é montado
pelo `buildDeck(auctioningManagers(s.managers), rng, 1.0, …, extra = 1)` **antes**
do pregão começar. O holandês só entra em `startAuctionPhase`, que roda DEPOIS. Ele
não encosta no baralho, na formação, na vaga nem na leva.

Medido, sala por sala (`npm run holandes`):

| técnicos | vagas (11 cada) | cartas no baralho | levas | pregão 🔻 holandês | pregão ✉️ cego |
|---|---|---|---|---|---|
| 3 | 33 | 38 | 5 | 3:17 | 3:45 |
| 6 | 66 | 71 | 7 | 4:36 | 5:15 |
| 8 | 88 | 93 | 10 | 6:34 | 7:30 |
| 12 | 132 | 137 | 12 | 7:53 | 9:00 |
| 20 | 220 | 225 | 20 | 13:08 | 15:00 |

Sempre **demanda + 1 carta por posição**, e a leva continua sendo a de hoje
(`BATCH_SIZE = 12`, `batchCount`). De brinde: o holandês fecha **mais rápido** que o
cego em toda sala, porque a descida da leva custa 39s contra 45s do envelope.

### 🧨 E a trava pegou um erro meu DE NOVO — vale a lição
A primeira versão desta trava comparava o baralho dos dois modos **carta a carta** e
acusava diferença em MEI e ATA em toda sala acima de 6. Não era o modo: o `START`
sorteia um `seed` NOVO a cada partida, então nas duas partidas os bots sorteavam
formações diferentes (4-3-3 × 4-4-2) e a divisão MEI/ATA mudava **por sorteio**.

👉 **Regra pra quem for medir dois modos deste jogo**: `START` é aleatório. Ou se
pina o seed, ou se compara a **CONTA** (cada posição cobre a demanda daquela
partida; a demanda é 11 × técnicos; o baralho é demanda + folga), nunca o número
cru de uma partida contra o da outra. É o segundo erro de medição meu em dois dias
— o primeiro foi o "80 × 47" da parte 26.

Com o ruído do seed fora, a comparação de 8 técnicos ficou **49 arremates × 49** e
**39 vagas vazias × 39**: a economia é a MESMA, como ele previu.

---

## 20/09/2026 (parte 26) — 🔻 Holandês virou LISTA (ideia dele) e ganhou o anti-delay

Ele bateu em dois pontos ao ver a primeira versão (uma carta por vez):

1. *"Qd alguém apertar vai sair o jogador na hr?? Pq o problema é alguém apertar e o
   botão não atualizar e com isso ainda ter esse botão de apertar e o outro jogador
   apertar… tô preocupado com delay também."*
2. *"Achei q fosse tipo aparecer todos listados igual já é no nosso leilão e a barra
   de 100 moedas caindo c/ botão ali da pessoa pegar… mas por mim tanto faz, quero
   o que seja melhor. Só me explique por que você acha assim."*

**A ideia dele é melhor, e os dois problemas são O MESMO problema.** Com uma carta
por vez, a leva de 12 precisava de 12 descidas — pra caber no tempo de hoje, cada
degrau durava ~0,2s. Nesse ritmo quem tem internet melhor ganha a carta, sempre.
Com a leva INTEIRA na tela e **uma descida só**, o degrau passa a durar **~2
segundos** (10× mais folga) e a leva fecha em ~39s, contra os 45s do envelope cego.

### ✋ O anti-delay, em três camadas
1. **Apertar não arremata na hora — vira um PEDIDO daquele degrau.** A carta tranca
   na hora **no seu aparelho** (vira "✋ PEDI"), antes do host responder. Não existe
   apertar duas vezes: o motor também engole o 2º toque, não é só a tela escondendo.
2. **O host não decide por ordem de chegada.** Ele espera o degrau FECHAR e resolve
   todos os pedidos daquele preço juntos. Internet melhor não vale nada.
3. **Empate no mesmo preço**: 🎰 roleta entre as pessoas — e **gente sempre passa na
   frente de robô** (o robô aperta no milissegundo; se competisse na reação, ganharia
   sempre). Quando o degrau fecha, a carta sai da lista pra TODO MUNDO, em cinza, com
   o nome de quem levou e por quanto.
4. E a trava velha continua: **toque com preço VELHO não vale** (nada de pagar um
   preço que ninguém viu na tela).

### 📊 O que mudou nos números — e o ERRO que ele pegou

⚠️ **Primeiro a correção, porque foi feia.** Eu mandei pra ele *"o holandês vende
muito mais: 80 × 47"* e contei isso como coisa boa (menos perna-de-pau). Ele
respondeu: *"não entendi pq ter mais jogadores… pq se não perde oferta e demanda"*.
**Ele estava certo e o número era MEU ERRO**: a medição contava o mesmo arremate
duas vezes no holandês — uma vez ao vivo (`hol.levados`) e outra na revelação —
enquanto no pregão cego contava só uma. O pregão cego não tem "ao vivo", então a
comparação era torta desde o começo. Agora só a REVELAÇÃO conta, que é o mesmo
lugar nos dois modos.

Medido de novo, direito (`npm run holandes`, 93 cartas, 8 técnicos):

| | arremates | no pregão | na repescagem | desceram p/ repescagem | vagas vazias | preço médio | tempo |
|---|---|---|---|---|---|---|---|
| 🔻 holandês | 48 | 32 | 16 | 61 | 41 | 12,5 🪙 | ~6:23 |
| ✉️ cego (hoje) | 51 | 33 | 18 | 60 | 37 | 12,7 🪙 | ~6:00 |

**São a MESMA coisa.** E tem que ser mesmo, pelo motivo que ele deu: a oferta (93
cartas) e a procura (as vagas dos 8 técnicos) não mudaram — o holandês só troca o
jeito de DESCOBRIR o preço, não quantos jogadores existem nem quantas vagas tem.
Se vendesse muito mais, era sinal de bug, não de feature.

A única diferença de verdade são os **23 segundos a mais** no pregão inteiro.

🧠 **Lição pra quem mexer nisto depois**: quando um modo novo parecer "melhor" num
número de balanço, desconfiar da MEDIÇÃO antes de comemorar. Os dois modos têm que
ser medidos no MESMO ponto do código (aqui: a revelação), senão a conta mente.

### 🔒 Travas novas no `npm run holandes`
Além das de ontem: apertar 2× na mesma carta não vira 2 pedidos · a carta sai com UM
dono só quando duas pessoas pedem no mesmo preço · gente ganha de robô no empate ·
a carta arrematada não volta a acender botão · e o degrau de baixo tem que durar
**≥1,5s** (é a conta que faz o delay parar de decidir a partida).

### ⏳ Continua faltando
1. **OK visual do Diego.**
2. **Roteamento online** do `HOLANDES_PEGAR` (convidado → host) e uma rede pra host
   que some no meio da escada (hoje `phaseDeadline` é `null` no holandês).
3. Linha em `novidades.ts` — só na entrega que ligar isso pro pessoal.
4. **Envelope Mudo** segue sem construir (falta ele dizer se a carta muda ENTRA a
   mais na leva ou SUBSTITUI uma, e se pode dividir leilão com o 🎁 Surpresa).

---

## 20/09/2026 (parte 25) — 🔻 LEILÃO HOLANDÊS: o modo novo, pronto e esperando o OK visual

Ideia aprovada por ele em 19/09, com as regras ditadas: *"a hi q tem q começar com
100 p qlwr jogador até pq ng tem 200… todo mundo começa C 100"* · *"preço cair até
0… se ng pegar esse jogador vai pras sobras igual ocorre hoje Tb já"* · *"oq manda
e o ID do host sempre"* · *"quantidade de jogadores q aparece no leilão e regras
com quantidades q jogam tudo igual Tb"* · *"quero usar tudo parecido C oq já
funciona hoje no motor e visual"*.

### 🔑 A decisão de arquitetura que faz isso NÃO poder quebrar o jogo no ar
O holandês **só troca o jeito de COLETAR o lance**. Quando a leva acaba, ele
escreve os arremates em `pendingEnvelopes` — o MESMO lugar de onde o pregão cego lê
— e chama o `sealAndResolve` de sempre. Daí pra frente é 100% código antigo:
`resolve` paga, move a carta pro elenco, anota no livro de preços, credita o
vendedor, cobra a comissão do agente, monta a revelação e manda o que ninguém quis
pra repescagem/monte. **Nenhuma regra nova toca em dinheiro.**

A bandeira `holFechando` liga por um instante só pra avisar o `sealAndResolve` que
não é pra gerar envelope de CPU (senão o bot disputaria contra o próprio arremate).

### 📐 Como ficou
- **Escada de preços** (`holEscada`): 100 · 90 · 80 · 70 · 60 · 52 · 44 · 36 · 31 ·
  26 · 21 · 16 · 14 · 12 · 10 · 8 · 7 … 1 · 0. Degrau **gordo em cima** (ninguém
  paga 90 num lateral) e **miúdo embaixo**, que é onde a decisão acontece. No
  basquete abre em 50, que é o bolso de lá.
- **Abertura IGUAL pra toda carta** — de propósito: preço de abertura diferente
  entregaria o nível, que é segredo até a Cerimônia.
- **O bot** não ganhou cérebro novo: o teto dele sai do MESMO `cpuEnvelope`,
  calculado uma vez quando a leva abre. Ele só passa a "apertar o botão" quando o
  preço desce até o valor que ele teria escrito no envelope.
- **Repescagem e setor técnico continuam no envelope cego.** Sobra é sobra.
- **Online**: quem faz o preço cair é SÓ o host (`HOLANDES_TICK`), e o toque do
  convidado vai roteado pra ele. ⚠️ A perna de roteamento online ainda **não foi
  ligada** — ver pendências abaixo.

### ⏱️💰 Medido, não chutado (`npm run holandes`)
O MESMO pregão (93 cartas, 8 técnicos, humano só assistindo), nos dois modos:

| | cartas | arremates | preço médio | tempo de pregão |
|---|---|---|---|---|
| 🔻 holandês | 93 | 54 | 10,4 🪙 | ~5:52 |
| ✉️ cego (hoje) | 93 | 48 | 12,4 🪙 | ~6:00 |

Ou seja: **não atrasa o ritmo** (regra de ouro dele) e a economia fica praticamente
igual. As duas diferenças naturais do formato, que ele precisa saber:
- o holandês **vende um pouco mais** (54 × 48): quem perdeu uma carta ainda pega a
  seguinte quando o preço chega nela — no envelope cego o lance perdido é lance
  jogado fora;
- e **paga um pouco menos** (10,4 × 12,4), porque a escada é de degraus: o bot leva
  no primeiro degrau ABAIXO do teto dele, nunca exatamente no teto.

### 🔒 Travas
`npm run holandes` roda um pregão INTEIRO no motor de verdade e reprova se:
abertura ≠ 100 · a escada não chegar a 0 · alguém ficar com caixa negativa · alguém
estourar vaga de posição · uma carta cair em dois elencos · a tela acender PEGAR e
o motor recusar (botão mudo) ou o contrário (arremate fantasma) · um toque com
**preço velho** for aceito · e — o mais importante — se o **pregão cego de hoje**
deixar de fechar igualzinho.

`npm run mockup-holandes` tira as fotos da tela no jogo de verdade (não é desenho).

### ⏳ O que FALTA (não está pronto)
1. **OK visual do Diego** — ele decide o visual, e nada disso vai pra `main` antes.
2. **Roteamento online** (`HOLANDES_PEGAR` do convidado → host, e o host
   transmitindo o preço). Hoje o modo só aparece na **partida rápida offline**.
   Quando ligar: o vigia de prazo do online precisa de uma rede pra host sumido no
   meio da escada (hoje `phaseDeadline` é `null` no holandês).
3. **Linha em `novidades.ts`** — só entra na entrega que ligar isso pro pessoal.
4. **Envelope Mudo** (a outra ideia que ele gostou) continua sem construir; faltava
   ele responder se a carta muda ENTRA a mais na leva ou SUBSTITUI uma, e se pode
   dividir leilão com o 🎁 Surpresa.

### ↩️ Dá pra voltar atrás?
Dá, e é barato: o modo nasce DESLIGADO (`holandes: false` no `INITIAL`) e só liga
por escolha na tela de montar a partida rápida. Sem a escolha, o jogo roda o mesmo
código de sempre — o `npm run holandes` prova isso a cada rodada. Pra sumir de vez:
reverter o commit.
---

## 20/09/2026 (parte 2) — 🥇 A AGÊNCIA PAGA POR ARTILHEIRO E POR BOLA DE OURO

Ordem dele, no mesmo dia da tela nova: *"o usuário tem q ganhar 1 moeda na temporada
se o jogador for artilheiro de qlqr competição ou mais uma se for bola de ouro também.
Desses ativos logicamente"*.

### Como ficou
- **Artilheiro de QUALQUER competição = 1 🪙.** Já valia pra cada série da liga e pra
  Copa (a Supercopa entra dentro dela, porque o `copaBrasilAsCopaResult` soma os gols
  do jogo do título). **Faltava a Copa do Mundo — agora entra.**
- **Bola de Ouro = mais 1 🪙**, em linha separada: quem foi artilheiro *e* melhor do
  mundo leva as duas. Cai na virada, junto das outras comissões.
- **Só quem está NA ATIVA** (`agenciados`). Quem espera a vez não paga nada e não
  acumula nada — a mesma regra das mensalidades.
- 🚫 **Campeão continua sem pagar** (ordem de 16/09). Nada mudou aí.

### O pulo do gato da Copa do Mundo
Ela acontece no **passo 3 do roteiro**, ou seja **depois de o caixa fechar** — então
não dava pra pendurar em `agenciaEventos` (que já foi pago na virada). A comissão dela
é paga **na hora**, pela ação nova `AGENCIA_COMISSAO_MUNDO`, com trava por
`nome+temporada` dentro do `copaPrizeDone` (o mesmo mapa do prêmio de 100 🪙, que
persiste no autosave). Reabrir o jogo não paga duas vezes.
O artilheiro sai do `artilhariaDaCopa()` — a MESMA conta que a tela da Copa já
mostrava, agora em função. **Ela só LÊ o torneio simulado: não encosta no `rng`**,
então placar e campeão continuam idênticos.

### Travas
`npm run agencia` (novo) — paga 1 pro ativo, 0 pra quem espera a vez, não paga duas
vezes e não mexe em carreira antiga (`agenciaOn` desligado).

**Reverter**: commit só de regra de dinheiro + textos; `git revert` volta tudo e
nenhum save quebra (o que já foi pago fica pago, como qualquer moeda do jogo).

---

## 20/09/2026 — 🕴️ SUA AGÊNCIA: saiu do Elenco, foi pro Clube e ficou legível

Decisão dele depois de recusar seis direções novas (transferências, fantasy, álbum,
ranking de empresários, museu de ídolos, telefone do empresário): *"a minha forma
dos 22 ainda parece melhor. Quero que melhore, aperfeiçoe"* + *"tem que tirar do
elenco e pôr lá no clube também, mostrar dinheiro onde ela olha"* + *"E pode
fazer"*. A MECÂNICA não mudou nada: título dá carta · até 22 na ativa · cada
categoria rende o mesmo de sempre · as obras destravam igual.

### O que entrou (`src/escalacao/pyramidseason.tsx`)
- **Mudou de lugar**: `Clube › 🕴️ Sua Agência` (era `Elenco › Agenciados`; a
  sub-aba do Elenco sumiu, o `elencoSub` foi embora). A escada de desbloqueios
  (`AgenciaDesbloqueios`) veio junto — agência num lugar só.
- **A frase que explica o negócio** no cabeçalho + o dinheiro em cima:
  "mensalidades desta temporada", onde ele cai (extrato 🕴️ Agência) e o
  **total que a agência já rendeu na carreira** (soma do `agenciaHist`).
- **O 22 deixou de ser número mágico**: a regra que ele ditou está escrita na
  tela — *"quem não está ativo não recebe nada e nem o que teria ganhado; só
  quando ativo, a partir daquele momento"*.
- **⚡ um toque** põe na ativa quem mais rende (o que PAGA hoje manda; carta
  travada não fura fila) e **🧢 escolher na mão** continua pra quem gosta.
- **💤 Esperando a vez**: quem está fora aparece, apagado, com o número do que
  renderia. Antes era cofre invisível.
- **🆕 Aviso de troca** quando chega carta que rende MAIS que a pior da ativa
  (só quando a troca põe dinheiro hoje — nada de "ele rende +0 e o outro +0").
- **🔒 O dinheiro parado virou chamada** ("+24 🪙 por temporada parados"), com o
  caminho da obra.
- **🃏 E a ESCOLHA virou CARTA** (*"ao ele escolher os jogadores ele vê as
  cartinhas também né?"*): a convocação era uma LISTA de nomes e virou grade de
  cartinhas (cor do tier, rosto quando existe, clube · ano, quanto rende), com
  🔍 pra abrir a carta inteira com bio. O quadradinho virou um componente só
  (`AgMini`), usado na ativa, na espera e na convocação.
- Correção de régua: a legenda dizia 👑 **5** e o valor real é **6**.

**Reverter**: é um commit só, e é só de tela — `git revert` põe a agência de volta
no Elenco sem mexer em save nenhum (nada de economia mudou).

**Bancada**: `scripts/teste-rosto/index.html?agencia2` monta a tela com carteira
cheia (31 clientes, 22 na ativa, SAF por fazer) — é de lá que saíram os prints.

---

## 19/09/2026 (parte 24) — 🔀 DUAS SESSÕES fizeram o perna-de-pau, e ficou UMA régua

Na hora de publicar, a `main` já tinha o commit `6f2754c` de OUTRA sessão fazendo a
MESMA coisa que eu tinha feito no branch: tirar o perna-de-pau da estatística. Sete
conflitos, todos nos mesmos pedaços.

**Resolvi tudo pro lado da `main`**, e desfiz a minha metade. Motivo, e vale pra
próxima vez que isso acontecer:
- a versão deles **já estava no ar** — é a que o Diego está vendo;
- ela vai mais longe e do jeito certo: o filler **nem entra no sorteio** do gol
  (`xi.filter(c => !ehFake(c))`), em vez de marcar e ser peneirado depois;
- ela trouxe junto o **prêmio da Bola de Ouro** (20 moedas + 10 de piso), que é
  pedido dele e eu não tinha;
- e, acima de tudo: **duas réguas pra mesma regra é fábrica de bug.** Meu
  `fake.ts` foi APAGADO e tudo passou a usar o `ehFake()` do `store.tsx`.

### 🎯 O que sobrou de meu, porque a `main` não tinha
- **Sobra de verdade antes do perna-de-pau** (`sobrasReais` + `fillToEleven`) — o
  pedido dele de *"ele poderia ganhar um atacante de sobra"*. Não tem equivalente lá.
- **O jogo rápido e a sala online** (`simMatch`): a régua deles pegou a carreira
  (liga e copa), mas o rápido/online roda em **outro motor** — e é lá que a sala
  grande enche de incógnita. Agora peneira nos dois, com a MESMA régua.

⚠️ **A diferença de comportamento que o Diego precisa saber**: ele me disse *"eles
podem fazer gols durante o jogo, não tem problema"*, e a versão que ficou é mais
dura — o perna-de-pau **nem marca na súmula** (o gol sai como gol do time). Como é a
que já está no ar e ele não reclamou, fica. Se ele quiser o meio-termo (marcar na
súmula mas não no ranking), é voltar o sorteio e peneirar só a lista.

**Trava: `npm run fake`** — reapontada pra régua da `main` e ampliada com as duas
partes que sobraram (rápido/online e sobra antes do filler).

---

## 19/09/2026 (parte 23) — 🏋️💸 Troco de 200 pra quem já tinha o preparador 👑

Ordem dele: *"aumente 200 de moedas pra quem tem o preparador [👑 Lenda], igual o
time Rei da Bola — porque eu diminuí o valor de 1000 pra 800"*.

Quem comprou o 👑 antes pagou **1.000** por uma coisa que agora custa **800**. O
troco entra no caixa quando o save abre, com **recibo na tela** (mesmo formato do
reembolso do Dep. Médico de 15/09 — não inventei layout novo).

Garantias, as mesmas do irmão dele:
- **uma vez só**: `preparadorDevolvidoV1` é gravada ao abrir, inclusive em quem não
  tem preparador nenhum (assim o save não é varrido toda vez);
- **só clube SEU** (principal + 2º clube); time de máquina nunca entra;
- **nada mais é tocado**: contrato, salário e tanque do preparador ficam iguais;
- **vai pro Extrato**, então dá pra conferir de onde veio a moeda.

A tabela `PREPARADOR_DEVOLVE` é uma linha por preparador de propósito.

### ✅ E o ⭐ também (ele liberou: *"perfeito, pode tb"*)
O ⭐ caiu de **600 pra 500** na mesma mexida, então quem comprou antes recebe **100**
pelo mesmo motivo. A tabela ficou: `{ seirulo: 200, paixao: 100 }` — 🟢 e 💎 não
mudaram de preço e não têm troco. O texto do recibo virou genérico (cita os dois
preços novos), porque agora são dois valores diferentes na mesma tela.

### 🩹 E de quebra: a trava do preparador estava REPROVANDO há dois dias
`npm run preparador` falhava em duas linhas desde a mexida de preços de 19/09 (a
outra sessão baixou 600→500 e 1000→800 e fez a renovação virar metade, mas os dois
números estavam escritos à mão na trava). Consertado — agora os preços **saem do
catálogo**, então a próxima mudança de preço não quebra a trava de novo.

---

## 19/09/2026 (parte 22) — ⚔️ A linha do próximo jogo mais sutil + rivalidade só entre usuários

Mockup aprovado por ele (*"sobre o mockup anterior está aprovado"*). O pedido veio
vendo a tela da sala em live: *"tá mt exagerado esse negócio de próximo jogo e
equilíbrio retranca e ataque… não precisa escrever o que é retranca, equilíbrio e
ataque, só bote. E de forma mais sutil também o próximo jogo"*.

### O que mudou
1. 🧹 **Saiu a explicação das táticas** ("retranca segura ataque · ataque atropela
   equilíbrio…"), nos DOIS blocos — o da liga e o da Copa. Ele mexe na tática toda
   rodada; a explicação era ruído fixo. **A regra no jogo continua a mesma.**
2. 🔇 **O título encolheu**: "PRÓXIMO" e "(em casa)" viraram uma etiqueta miúda em
   cima (10px, cinza), e o nome do jogo caiu de 18px pra 15px. No celular ele
   ocupava três linhas.
3. ⚔️ **A rivalidade virou pílula**: `⚔️ RIVALIDADE V=2 · E=1 · D=1`.

### A regra da rivalidade (palavras dele)
*"Se tiver alguma rivalidade mostre se já teve jogo entre usuários APENAS. Se for
usuário e bot não mostre nada… mas só vale entre usuários"*. Dois cortes:
- o adversário tem que ser **gente** (`isHuman`) — **rival-bot da carreira não
  conta**, mesmo continuando a ser "clássico" pra cor da caixa e pra etiqueta;
- e eles já têm que **ter se enfrentado** — no primeiro duelo não existe
  retrospecto, e "0 × 0" seria ruído.

O `rivalry` velho (que misturava usuário e rival-bot num retrospecto por extenso)
foi embora junto com o parágrafo de clássico.

**Trava: `npm run proximo`** — 3 seções: a explicação não volta · a pílula sai do
corte de usuário e exige jogo · o título continua miúdo.

### ⏳ Ficou de fora, e ele ainda não respondeu
A **faixa de DEPOIS do jogo** ("⚔️ CLÁSSICO VENCIDO contra X · Rivalidade: você 2 ×
1") ainda mostra retrospecto **contra rival-bot da carreira**. Ele falou só do
próximo jogo, e eu não quis estender por conta — perguntei e está esperando.

---

## 19/09/2026 (parte 21) — ⏱️ Mais 1 segundo na partida, agora incluindo TODAS as copas

Ordem dele: *"aumente mais um segundo qualquer copa do online e offline… e também
no jogo normal… qualquer modo offline carreira ou online… enfim aumente 1 segundo
da simulação da partida pras copas todas e ligas"*.

| onde | era | ficou |
|---|---|---|
| rodada do rápido/online (e basquete) | ~5,7s | **~6,7s** |
| carreira · manual | 10s | **11s** |
| carreira · auto | 11s | **12s** |
| Copa da carreira (Legends / Brasil) | 9s | **10s** |
| Copa dos 8 (rápido/online) | 15s | **16s** |
| Copa do Mundo · offline | 9s | **10s** |
| Copa do Mundo · online | 14s | **15s** |

Um número só por lugar: `ROUND_EXTRA_MS` (rápido/online), `ROUND_MS` (carreira),
`COPA_LEG_MS` (as duas copas de clube — a do rápido sai dele com +6s) e o par do
`copa-mundo.tsx`.

### 🗄️ ⚠️ FALTA RODAR O SQL — e sem ele a sala online fica pra trás
Na sala **sincronizada**, quem manda no relógio da Copa do Mundo é o BANCO
(`esc_copa_clock_preview.duration_ms`), pra todo mundo ver o mesmo minuto. O
código só usa o número dele quando não há relógio sincronizado. Então:

👉 **rodar `docs/sql/online-copa-clock-mais-1s.sql`** (única mudança: `14000` →
`15000`). Sem isso, a Copa da sala continua em 14s enquanto o resto do jogo já
está 1s mais devagar — e nada na tela avisa.

**Trava: `npm run ritmo`, seção 1b** — confere os sete tempos E se o SQL bate com
o código (se alguém mexer num e esquecer do outro, reprova).

---

## 19/09/2026 (parte 20) — 🎯 Sobra de VERDADE antes do perna-de-pau (e o que eu desfiz)

### ⛔ Primeiro: o que eu desfiz, porque passei do ponto
Vendo o print do Geovany (`ATA · Zé Ninguém (Várzea 2000) · pagou 50`), eu concluí
que o perna-de-pau estava vazando pro LEILÃO e fechei a porta: pus `fake: true` nas
quatro fábricas de filler e troquei 6 guardas do leilão. **O Diego mandou desfazer**:
*"não queria que você fizesse muito bem assim não… o Geovany comprou no SONDAR
jogador. Deixa ele poder ir pro sondar, não tem problema não — o usuário pode
comprar sim lá no sondar se ele quiser"*.

E ele estava certo também no efeito colateral: com o selo, o perna-de-pau comprado
**deixaria de contar pra fechar os 11** no elenco de quem comprou, perderia contrato
e sumiria da sondagem. Mudança grande demais. **Tudo revertido.**
👉 Quem mantém o perna-de-pau fora de RANKING continua sendo o `ehCartaFake()`
(`fake.ts`), que reconhece pelo clube e pelo id — não precisa de selo nenhum.

### ✅ O que ele pediu de verdade, e que está feito
Palavras dele: *"a gente tem um sorteio de um jogador que vai pro leilão, e o time
desse jogador também participa do leilão. Se ele também não comprar nenhum atacante
nesse leilão, ele poderia ganhar um jogador que está sobrando das sobras, de
atacante de sobra. Mas só se ele não conseguir repor esse atacante no leilão"*.

Era exatamente o buraco: `fillToEleven` (a rede que devolve o time de fundo pra 11
depois do mercado) ia **direto pro perna-de-pau**, sem nunca olhar as sobras. Por
isso nascia um Zé Ninguém ATACANTE com 31 de nível enquanto dezenas de atacantes
reais estavam sem dono — a resposta pra pergunta dele.

Agora a ordem é **1º sobra real · 2º perna-de-pau**:
- `sobrasReais(s)` monta a fila por posição com quem não está em elenco nenhum
  (nem de técnico, nem de fundo, nem no baralho do leilão);
- ordenada do mais FRACO pro mais forte — quem tapa buraco de time de fundo é a
  sobra modesta, não o craque esquecido (esse continua aparecendo no leilão);
- consumida com `shift()`, então dois times nunca levam a mesma carta;
- o perna-de-pau **continua existindo** como última rede: sem ele, time de fundo
  entraria em campo com 10.

**Trava: `npm run fake`, seção 6.**

### 📊 Quantas cartas faltam pra acabar com o perna-de-pau de vez
Medido (`npm run pernadepau`), com 20 técnicos de elenco CHEIO (27 cartas):
| posição | faltando |
|---|---|
| GOL | 47 |
| LAT | 77 |
| ZAG | 58 |
| MEI | **0** |
| ATA | **0** |

Ou seja: **não falta atacante nem meia — falta goleiro, lateral e zagueiro.** E o
corte em 4 faixas de força pede margem, então na prática são ~+100 GOL, ~+150 LAT e
~+120 ZAG (≈ 370 cartas novas, baralho indo pra ~1.840). Não precisa de 2.500.

---

## 19/09/2026 (parte 19) — 🧮 Por que aparece perna-de-pau se o baralho tem 1.466 cartas

Pergunta do Diego: *"se eu tenho 1466 cartas, por que essas cartas todas não estão
preenchidas no baralho? Por que está aparecendo um monte de jogador fake?"*

Medido com o código de verdade (`npm run pernadepau` → `scripts/mede-perna-de-pau.mjs`,
que roda o `seedCpuSquads`, o mesmo que monta os times de fundo). **Não é que as
1.466 não são usadas — é que elas têm o FORMATO errado.**

### 1. O baralho não é uma pilha só: são CINCO, uma por posição
| posição | tem no baralho | a pirâmide precisa (80 times × 11) |
|---|---|---|
| GOL | 153 | 80 |
| LAT | **204** | **160** |
| ZAG | **202** | **160** |
| MEI | 413 | 240 |
| ATA | 494 | 240 |

Sobra atacante (494 pra 240) e quase não sobra lateral. Atacante que sobra **não
tapa buraco de lateral** — o sorteio é posição por posição.

### 2. E o pool ainda é cortado em QUATRO faixas de força (uma por divisão)
Cada faixa precisa, sozinha, de 20 GOL · 40 LAT · 40 ZAG · 60 MEI · 60 ATA:

| faixa | GOL | LAT | ZAG | MEI | ATA |
|---|---|---|---|---|---|
| A (mais forte) | 37 | **23** 🔴 | 41 | 121 | 145 |
| B | 42 | 44 | 64 | 95 | 122 |
| C | 30 | 57 | 47 | 115 | 118 |
| D | 44 | 80 | 50 | 82 | 109 |

A Série A tem **23 laterais pra 40 vagas** — e sobra lateral na D (80 pra 40). Hoje
a faixa A **não empresta** da B: inventa filler. São 17 fillers só por isso, com o
baralho INTEIRO disponível.

### 3. E as cartas do usuário e dos rivais saem do pool ANTES
| elencos em campo | cartas fora do pool | tapa-buraco na pirâmide |
|---|---|---|
| 20 × 11 | 220 | 46 |
| 20 × 15 | 300 | 70 |
| 20 × 20 | 400 | 100 |
| 20 × 27 (elenco cheio) | 540 | **182** |

### 🔧 Os dois consertos possíveis (decisão do Diego)
1. **Faixa empresta da vizinha** antes de inventar filler: falta lateral na A, pega
   o melhor lateral da B. Custa uma linha de código e derruba quase todo o
   tapa-buraco. Só vale pra carreira NOVA (elenco de bot já salvo não muda).
2. **Mais cartas de LAT/ZAG/GOL no baralho** — o conserto de raiz. Hoje o baralho
   tem 2,4 atacantes pra cada lateral.

⏳ **Não fiz nenhum dos dois ainda**: é mudança de regra de carreira, ele decide.

---

## 19/09/2026 (parte 18) — 🃏🚫 Jogador tapa-buraco fora de artilharia, garçons e Bola de Ouro

Ordem do Diego: *"tem um monte de jogador fake, Zé Ninguém, Trapalhão, ganhando a
bola de ouro… eles podem fazer gols ou assistência durante o jogo, não tem problema
nenhum. Mas não podem contar pra estatística de artilharia, assistência e bola de
ouro"*.

### A regra, em uma linha
**Tapa-buraco joga, marca e some.** O gol dele conta no PLACAR, sai na narração e
entra na ficha do time — ele só não aparece em NENHUMA classificação.

### Quem é tapa-buraco (são DOIS tipos, e valem os dois)
| tipo | como é | de onde vem |
|---|---|---|
| **filler de várzea** | `fil-…`, clube `Várzea` (no basquete, `Pickup`), nível 30–40, nome de zoeira | `filler()` em `pyramidseason.tsx` — fecha elenco de time de CPU |
| **incógnita** | `inc-…`, `fake: true`, nome e clube inventados | `makeIncognita()` em `data.ts` — quando o catálogo real de uma posição acaba |

Quem responde "é tapa-buraco?" é `src/escalacao/fake.ts`, um arquivo só — assim não
existe lista de ranking que peneirou com régua diferente.

### Onde a peneira entrou
- **Liga** (`simulatePyramid`): artilharia, garçons **e o artilheiro da divisão** —
  este último paga caixa pro clube e sobe o PISO do jogador, e filler não tem piso
  nem salário, então o prêmio ia pro ralo e ainda tirava o troféu de quem jogou.
- **Copa Legends** e **Copa do Brasil**: artilharia, garçons e o artilheiro da Copa.
- **Jogo rápido / sala online** (`simMatch`), inclusive a **cestinha do basquete**.
- **Bola de Ouro** (`melhorDoMundo`): peneira repetida de propósito — é o prêmio que
  ele viu indo pro Zé Ninguém, é o último lugar onde eu quero depender de quem chamou.
- **Porta do histórico** (`RECORD_SEASON_STATS`): peneira de novo, pra competição
  nova que nasça esquecendo de peneirar não furar o acumulado.

### 🧹 E o PASSADO é limpo
Trava nova só impede que entre MAIS. Ao abrir o save (`migrateTeamNames`), sai quem
já entrou: artilheiros e garçons de todos os tempos, e **o ano de Bola de Ouro
ganho por tapa-buraco some do quadro de campeões** — não dá pra recalcular quem
seria o certo (os números daquela temporada não ficam guardados), e some é melhor
do que mentir.

### 🛡️ O medo, e como ele foi medido
O risco desta mudança é o contrário dela: sumir com jogador DE VERDADE do Rank.
Varri o baralho inteiro (**1.466 cartas**): zero cartas reais com clube
Várzea/Pickup, zero com nome de filler e zero que batem nome de incógnita E clube de
incógnita ao mesmo tempo. **Nenhum falso positivo.** A varredura é parte da trava,
então ela reprova sozinha se um dia entrar no baralho um jogador que caia na regra.

**Trava: `npm run fake`** (5 seções: reconhecimento · zero falso positivo · Bola de
Ouro · limpeza do passado · gol e assistência peneirados igual).

🚫 **Não virou novidade da home**: é conserto, e a regra dele é *"menos bugs, que
nunca lance"*.

---

## 19/09/2026 (parte 17) — 🌑🐺 Mascote NOVA do Pesadelo Verde FC

Ordem dele, curta: *"troque o mascote do pesadelo verde por esse aqui"*. Saiu o
lobo uivando na pedra, entrou o **lobo de armadura** com capa esfarrapada, espada
fincada e o pé em cima da bola — mesma cena atrás (lua, fumaça verde, pinheiros),
que é a cara do clube e já era assim na arte antiga. **Só a mascote trocou**:
escudo e camisa continuam os de 18/09.

- 📏 **287×440 · 43,8 KB** (com o escudo de 29,0 KB dá **72,8 KB** dos 75 do teto).
  A largura mudou (era 312×440), então a proporção foi atualizada junto.
- ⚠️ **O corte mais perigoso até hoje, e por isso tem script próprio**
  (`scripts/recorta-pesadelo-mascote.py`): o clube é VERDE-NEON sobre fundo VERDE
  CHROMA. Medi antes de cortar — o critério de sempre (`g > 150 e muito acima de
  R/B`) apagava **20% do desenho**: a fumaça, o brilho da espada, as rachaduras da
  bola e os olhos do lobo. A saída foi mirar a **COR EXATA** do chroma
  (`(10,243,94)`, distância RGB < 60): a distância é bimodal (41,4% abaixo de 40 e
  só +1,9% entre 40 e 100), ou seja o fundo é um bloco isolado e a arte não encosta.
- ✂️ **A mascote estava GRUDADA na camisa** — a fumaça encosta no ombro dela e não
  existe coluna vazia entre as duas, então régua não separa e erosão não quebra a
  ponte. Quem separa é a CAMISA: maior ilha sem neon da direita, contorno
  preenchido e tirada do quadro.
- 🩹 **E isso deixava um RISCO RETO na nuvem** (pareceu tesourada na conferência).
  A borda nascida do corte agora recua numa **onda** de 8–38 px, só nos pixels de
  fumaça: nuvem tem borda irregular, reta não.

⏳ **O nome da mascote segue provisório** ("O Pesadelo") — as duas artes vieram sem
nome. Vale perguntar pro dono.

---

## 19/09/2026 (parte 16) — 📍 Futpoint FC de CARA NOVA (arte que o dono refez)

Ele mandou a prancha nova do **Futpoint FC** (gfpicolo13, **SÓCIO nº27** — não é
batismo, não tira o lugar de ninguém): escudo, mascote e camisa, tudo redesenhado.
Recorte, peso e cadastro feitos; **esperando o OK visual dele pra publicar**.

### ✅ O que ficou pronto (no branch)
- **Escudo novo** 228×360 · 17,7 KB (saiu o alfinete de mapa, entrou o brasão
  preto/dourado com o monograma FP em prata). **Mascote novo** 285×440 · 39,0 KB —
  **total 56,7 KB** dos 75 do teto.
- **Camisa nova na Loja** como `futpoint-camisa-v2.webp`: nome novo de propósito,
  porque `public/` tem endereço fixo e quem já abriu a Loja veria a velha pra
  sempre (a lição do Neymarzetti, 16/09).
- **Manto REMEDIDO na camisa nova**: preto `#0C0909` e dourado `#BE8F47` — ou seja,
  a arte nova **confirmou** a cor que o jogo já usa (`#181818`/`#B89040`, com o
  preto levantado de propósito pra listra fininha não virar buraco). O branco da
  faixa foi remedido pra `#EAE2E0` (era `#FFFFFF` chutado em 19/08).
- **`MANTO_CONTAS` ganhou a linha dele** (`gfpicolo13@gmail.com`), que faltava
  desde sempre: a chave lá é o E-MAIL e é ela que decora a tela do próprio dono.
  Por isso o `npm run batismos` cobrava "manto medido" no Futpoint — agora são
  **45 completos** (era 44).
- **Recorte virou script de todo mundo**: `scripts/recorta-prancha-chroma.py`
  (o do Marreco era só do Marreco). Prancha sobre fundo verde é o padrão agora.

### 🚫 Marca de terceiro que SAIU da arte
A mascote vinha com o **símbolo da Nike nas duas chuteiras**. É marca de outra
empresa e ia DENTRO do arquivo que todo jogador baixa (e que carimba o gol), então
saiu — `scripts/tira-marcas-futpoint.py`. Ficou a chuteira preta, o friso e as
travas douradas. Mesma régua do letreiro da bola de ouro (19/09).
⚠️ **Lição de método**: nessa reconstrução **não se põe grão**. Em pano claro o grão
salva; em couro PRETO o desvio que a conta estima vem dos vincos e do brilho, e as
duas janelas viraram dois retângulos chuviscados bem visíveis. Só a superfície fecha.

### ⏳ O que falta (perguntado pro Diego)
- **▶️ O botão de play na mão da mascote** é o do YouTube. Mandei as duas opções:
  como veio (vermelho) e **dourado com o play preto** (as cores do clube — vira uma
  plaquinha de ouro, que combina com dono de canal). **Ele escolhe.**
- **O nome do dono** pro rodapé do post ("CLUBE DE ___"): não invento nome de gente
  de verdade — está em branco até ele falar.
- 🗄️ **Banco**: `meuManto()` lê `esc_socios` ANTES do código. Se a linha do
  gfpicolo13 lá tiver outra cor, é ela que ele vê. Conferir junto das linhas do
  **Marreco FC** (`manto_c1`/`manto_c2`/`mascote_key`/`escudo_time`), que continuam
  pendentes porque a chamada do Supabase precisa da autorização dele.

---

## 19/09/2026 (parte 26) — 📝 LISTAR NÃO É ABANDONAR (o Garrincha e o Maradona voltam)

Ele juntou as peças depois de três relatos (Rei da Bola FC, Raiva Cajuri FC e o print do
Garrincha): *"o erro que eles estão reclamando não é apertar SAIR na renovação de
contrato — aí tudo bem. É que ele está LISTANDO o jogador, ainda em contrato. O jogador
é dele, pô. Ele pode pegar o jogador dele de volta se ninguém pegar e for pro monte.
Quando lista, ele pode até vender por mais; se ninguém comprar vai pro monte e aí sim
vale a metade. É diferente do caso de sair por contrato."*

### 🔎 A causa (e era antiga, não veio de hoje)
Ao consumir a lista de transferências, o reducer carimbava `semContrato` na carta
listada se o contrato dela já tivesse acabado. **Só que essa linha roda DEPOIS do
`s.seasonNo++` da virada.** Então o contrato que valia durante a temporada recém
encerrada já contava como vencido: quem listou o próprio jogador na janela levava o selo
de quem ABANDONOU, e o `semContrato` faz duas coisas ao mesmo tempo — limita o dinheiro
da venda **e** proíbe o ex-dono de recuperar a carta (no leilão e no monte).
Resultado: o dono listava, ninguém comprava, a carta caía no monte e ele não podia mais
pegá-la de volta. Foi o Garrincha e o Maradona.

### ✅ Conserto: um selo pra cada coisa
- **`semContrato`** = saiu por CONTRATO ENCERRADO (o dono apertou DEIXAR IR). Continua
  fazendo as duas coisas: teto de venda **e** proibição de recuperar. A regra dele não
  mudou uma vírgula.
- **`tetoOficial`** (novo) = só o TETO. É o que a listagem usa quando o contrato já tinha
  acabado, pra não virar atalho de quem deixou vencer — **mas o dono mantém o direito de
  recuperar a carta que ele mesmo pôs à venda**.
- Os dois selos morrem quando a carta entra num elenco.
- **Perdão único no save**: as cartas presas HOJE no leilão/monte com o selo errado e
  dono humano viram `tetoOficial` na abertura do save. O Garrincha e o Maradona voltam a
  poder ser recuperados. Carta de bot não muda.
  ⚠️ Efeito colateral aceito: quem REALMENTE apertou DEIXAR IR nesta virada também ganha
  o perdão nessas cartas específicas, uma vez só. Sem registro no save, não há como
  separar os dois casos no passado — e o erro foi nosso.
- Travas novas em `npm run monte`: carta listada é recuperável mesmo com teto; carta de
  contrato vencido segue barrada.

## 19/09/2026 (parte 25) — 🚨 A REMOÇÃO DO PONTUAL PRENDEU TODO MUNDO NA RODADA 0

Print do **Cr7 Leilão** minutos depois do deploy: T48, Série A, botão verde
**"▶️ Começar a temporada"** aceso, e o jogo não começava de jeito nenhum.

### ❌ O erro foi meu, e é o MESMO do monte, no mesmo dia
O `PLAY_ROUND` tinha um "cinto de segurança" de 07/08: **a rodada 0 não anda sem a
aposta do patrocinador pontual da temporada**. Eu tirei a TELA que fazia a aposta e
deixei o cinto lá. Sem tela, a aposta nunca existia → o reducer devolvia o estado
igual, calado → botão mudo, carreira parada. Valia pra TODO mundo em carreira solo,
não só pra quem virou temporada agora.

### ✅ Conserto
- O cinto saiu (o comentário no lugar conta a história, pra ninguém reintroduzir).
- **Trava nova** em `scripts/testa-loja.mjs`: rodada 0 → 1 sem aposta nenhuma, e
  também com resíduo de aposta velha no save.
- 🧠 **REGRA que vale pra sempre**: quando uma regra sai da TELA, tem que sair também
  do REDUCER. Duas regras decidindo a mesma coisa = botão que não faz nada. Hoje isso
  aconteceu duas vezes (monte e início de temporada).

## 19/09/2026 (parte 24) — 🚫🤝 O PATROCINADOR PONTUAL FOI REMOVIDO

Ordem dele: *"eu acho que eu vou tirar esse patrocinador pontual. Tá ficando muito
patrocinador, patrocinador, patrocinador, tá ficando chato. Tira esse patrocinador
pontual e a pessoa também não vai mais ganhar esse dinheiro. Hoje vai ter o
patrocinador master ali no início, aí logo depois vai pro próximo passo."*

### ✅ O que saiu
- O **passo do roteiro** da virada. A ordem agora é 🏆 Master → 👟 Fornecedor →
  🛍️ Camisas → 🕴️ Bico. A pílula "PASSO X DE N" conta sozinha, então o N caiu junto.
- A **trava de começar a temporada** não olha mais o pontual (só Master e crise).
- O **pagamento**, nos DOIS caminhos que existiam: o `CLOSE_SEASON_BOOKS` (temporada
  que fecha sem leilão) e o `OPEN_RESERVE_LIST`/`REAUCTION_ONLINE` (virada com leilão).
  Ninguém recebe mais nada da aposta, nem quem tinha aposta feita na temporada passada.
- O **recibo** "o patrocínio pagou", as telas de acompanhamento (`SponsorBetStatus` e
  `CareerSponsorOverview`) e a action `SET_SPONSOR_BET`.

### 🗄️ O que FICOU de propósito
- `careerSponsorBet` / `careerSponsorResult` continuam no save e nos tipos: apagar
  campo de save não desfaz nada e só arrisca quebrar quem está no meio da temporada.
  Ninguém escreve e ninguém lê.
- `sponsorBetRewards` e a tabela `SPONSOR_BET_PAY` seguem exportadas (as simulações de
  caixa `sim-caixa-120`/`sim-caixa-divisoes` ainda importam). Se ele mandar voltar, é
  religar o passo e os dois pontos de pagamento.
- O componente `SponsorBetBanner` continua em `estadio.tsx`, sem quem chame.

### 💰 Quanto some do caixa (por temporada, se batesse a meta)
Várzea 4/6/8 · D 8/12/16 · C 14/22/30 · B 24/40/56 · A 42/74/106 (nível 1/2/3).
Master, bilheteria, Loja, TV e bico não mudaram. Novidade na home avisando.
Reverter: `git revert` do commit desta parte.

## 19/09/2026 (parte 23) — 🐛🔒 TELA TRAVADA NO MONTE (Rei da Bola FC) — sem PEGAR e sem PASSAR

Relato dele: *"deu um erro no leilão do Rei da Bola FC. Quando foi pro monte, aparecia
um jogador pela metade pra ele pegar. Ele tentava pegar, pegar, pegar e não acontecia
nada — ficou travado na tela. Se aconteceu com ele, pode acontecer com outros."*

### 🔎 Eram DUAS regras diferentes decidindo a mesma coisa
1. **A tela** montava a lista com régua PRÓPRIA (`openSlots` + `monteLocked`).
   **O reducer** recusava por MAIS duas que a tela não conhecia: a anti-malandragem do
   **contrato vencido** (carta que saiu do seu clube não volta de graça pelo monte) e o
   **caixa**. Resultado: botão verde PEGAR que não fazia nada, sem dizer por quê.
2. **Pior**: com buraco no XI, o botão **PASSAR A VEZ some** se existir "alguma carta" —
   e essa conta só olhava o caixa. A carta travada contava como disponível, então ele
   ficava **sem PEGAR e sem PASSAR**: tela morta, exatamente o relato.

### ✅ Conserto
- **`monteBloqueio(state, m, c)`** no `store.tsx` é agora o ÚNICO juiz, e devolve o
  MOTIVO: `vaga` · `reservado` · `semcontrato` · `caixa` · `null`. O `montePickable`
  (que o reducer usa) virou uma linha em cima dele, então tela e regra não podem mais
  divergir.
- A tela esconde só `vaga` e `reservado` (nada de novidade pra quem olha). `caixa` e
  `semcontrato` **aparecem com o motivo e o caminho** — regra da casa pra toda trava:
  *"ele não volta de graça pro seu clube. Outro time pode levar — e um dia você
  recompra."*
- **PASSAR A VEZ fica liberado sempre que nenhuma carta for pegável DE VERDADE**,
  mesmo com buraco no XI. Ninguém mais fica preso.
- Trava nova: **`npm run monte`** (`scripts/testa-monte.mts`) — 11 checagens, incluindo
  a situação exata do Rei da Bola.
- Sem novidade na home (é conserto). Reverter: `git revert` desta parte.

## 19/09/2026 (parte 22) — 🚫🧍 PERNA-DE-PAU NÃO TEM ESTATÍSTICA (nem gol, nem assistência)

Ele mandou um print do jornal da T43 dele: **🥇 Zé Ninguém (Várzea · 2000) BOLA DE OURO**,
com 10 gols e 39 assistências, e a lista de garçons inteira tomada por Perna-de-pau,
Bola Murcha, Pé de Anjo e Meia-Boca. Palavras dele: *"jogadores fakes não quero que
tenha estatísticas pra eles, nem assistência e nem gols"*. É o "estado quebrado" nº 1
da casa: jogador de mentira premiado.

### 🔎 Por que acontecia
O peso por nível (`goalW`) só DIMINUÍA a chance do filler, não zerava. Nos times de
fundo da Várzea **todo mundo é filler** — então alguém de mentira tinha que marcar, e
com 38 rodadas ele acumulava mais que os craques das divisões de cima.

### ✅ Como ficou
- **`ehFake(c)`** (`store.tsx`), a régua única: `fake === true` **ou** clube de filler
  (`Várzea`/`Pickup` — o filler dos bots não carrega a flag, só o clube).
- **Gol e assistência na liga e na Copa** só sorteiam jogador de verdade. Time 100% de
  mentira faz o gol no PLACAR e **o gol fica sem dono na súmula** — nada trava.
- ⚠️ **O dado (rng) é consumido igual, com autor ou sem** — o minuto do gol passou pra
  antes da guarda de propósito. Sem isso, um gol sem autor desalinharia o sorteio e
  mudaria PLACAR de rodada já jogada (o passado é imutável, regra da casa).
- **Segunda tranca** no `RECORD_SEASON_STATS`: fake não entra no histórico de todos os
  tempos nem leva Bola de Ouro, mesmo que um caminho novo deixe passar.
- **Limpeza do passado na abertura do save**: os fakes somem de `careerScorersAll`,
  `careerAssistsAll` e `careerMelhorMundo`. O save dele perde o 🥇 Zé Ninguém sozinho,
  sem migração manual. **Cria da Base não é fake** — o guri é jogador de verdade do
  clube e mantém tudo o que fez.
- Sem novidade na home (é conserto, regra da casa). Reverter: `git revert` desta parte.

## 19/09/2026 (parte 21) — 🥇💰 A Bola de Ouro passa a PAGAR (20 🪙 + 10 de piso)

Ordem dele, junto com o pedido de mockup e vídeo: *"todo bola de ouro q o time tiver o
clube ganhará 20 moedas extras e a jogador passa a valorizar mais 10 de piso"*.

### ✅ A regra (no ar)
- Mora no `RECORD_SEASON_STATS` (`store.tsx`), **dentro do portão idempotente**
  (`statsSeason`), então nenhuma temporada paga duas vezes nem recarregando a tela.
- **20 🪙 pro CLUBE do premiado**, e só pra clube de gente (`teamId >= 0` = id do
  manager, a mesma régua do `teamKey`). Entra no caixa e escreve linha no extrato
  (`logFin` tipo `reward`) e no `marketLog`.
- **+10 de piso pro JOGADOR**, em campo próprio `careerBolaOuroPiso` (chave `ident` =
  `nome|clube`), somado DEPOIS do `max` dentro de `valorOficial`. Dois motivos pra não
  escrever no `marketValues`: o livro de preços é reescrito por toda venda/leilão (o
  bônus sumiria) e, com o `max`, um craque de tabela alta (fame 5 = 30) não sentiria
  o prêmio. Como está, vale em renovação, teto de venda, SAF e ficha.
- **Acumula**: 2 bolas = +20. E o piso sobe **mesmo quando o premiado é de bot** — a
  carta encarece pra todo mundo no leilão seguinte (só as moedas exigem dono humano).
- Os dois números moram em `BOLA_OURO_MOEDAS` / `BOLA_OURO_PISO`, lado a lado.
- Novidade na home. Reverter: `git revert` do commit desta parte.

### ⏳ O visual está ESPERANDO O OK DELE (mockup + vídeo entregues)
`node scripts/mockup-bola-ouro.mjs` desenha os três lugares onde o prêmio aparece, e
`node scripts/video-bola-ouro-reels.mjs` é o reels de ~27s explicando. O que ainda NÃO
foi codado, porque é visual novo e a regra da casa é esperar o OK:
1. a **faixa dourada do prêmio** na página da Bola de Ouro do jornal ("+20 🪙 pro clube
   · +10 de piso"),
2. o **selo 🥇 2× BOLA DE OURO** na ficha do jogador, com o valor mostrando `30 + 20 🥇`.
Hoje o jogador só vê o prêmio pelo **extrato** e pelo **mural de mercado**.

## 19/09/2026 (parte 20) — 🔓 A carreira nova saiu da prévia: PUBLICADA PRA TODOS

Ele olhou a aba Jogos no celular e fechou três coisas de uma vez:
1. *"Essa frase 'acompanhe sua divisão e os jogos etc' não precisa escrever."* → o
   subtítulo da liga saiu do palco (`CareerCompetitionStage`). O `CompetitionStage` só
   desenha o `<p>` quando tem texto, então **a Copa continua dizendo o formato da fase**
   (quantos confrontos · jogo único/ida e volta) — quem perdeu a linha foi só a liga.
2. *"Texto de pênalti não pode ter, porque quando é pênalti tem batida manual pra eu
   bater, lembra?"* → as 3 frases de pênalti saíram de `lances.ts` e foram **trocadas
   por outras 3** (o acervo continua com 80). Motivo, que vale pra qualquer frase nova:
   o pênalti tem TELA PRÓPRIA (mira + força); narrar "pênalti no canto" num gol de
   jogada normal seria contar uma história que não aconteceu.
3. *"Pode publicar p todos."* → a apresentação da carreira saiu da trava de conta.

### 🔓 Como ficou a liberação (e como reverter)
- `privateCareer` agora é `privatePreview || publicCareerVisual(state)`, e o placar
  (`grande`/`cinematic`) e as duas telas da Copa da carreira usam a MESMA chave:
  **`CAREER_VISUAL_RELEASED` em `career-feature-release.ts`**.
- 👉 **Reverter é UMA linha**: essa chave pra `false` devolve a carreira inteira ao
  visual antigo, **sem tocar no online** (que tem a chave dele, `ONLINE_VISUAL_RELEASED`).
- A casca da carreira (fundo de estádio, abas) já era pública desde antes — quem não
  era a conta dele via casca nova com miolo velho. Agora está coerente.
- Novidade na home (a do placar que conta o lance). O conserto do som não entra em
  novidade, que é regra da casa.

## 19/09/2026 (parte 19) — 🐛 O som AMBIENTE sumiu (só tocava o gol)

Ele: *"não sei por que não tá parecendo o som ambiente mais durante os jogos, só tô
ouvindo o do gol"*. Duas causas, as duas em `sound.ts`:
1. **O ambiente só era ligado UMA vez, ao abrir a tela do jogo.** Se naquele instante o
   som estava MUDO (é o padrão) ou ainda não liberado (o `setSoundAllowed(true)` do
   componente-pai roda DEPOIS do efeito da tela filha), `startCrowd` desistia — e
   ligar o 🔊 depois não tentava de novo. O gol funcionava porque é criado na hora.
   👉 Agora a tela só diz que QUER o ambiente (`crowdWanted`); ligar o 🔊 ou liberar o
   áudio acende a torcida sozinho. Desligar apaga sem esquecer; religou, volta.
2. **A Copa do Mundo abre DENTRO da carreira e as duas pedem o ambiente**; quando a
   Copa fechava, o `stopCrowd` dela matava a torcida da carreira, ainda aberta.
   👉 `crowdWanted` virou CONTADOR: cada tela soma 1 ao abrir, tira 1 ao fechar.
3. Bônus: AudioContext que nasce SUSPENSO (som já ligado de outra visita, tela abriu
   sem toque) agora acorda no primeiro toque em qualquer lugar (`acordaNoGesto`).
Sem novidade (é conserto). Reverter: `git revert` do commit desta parte.

E o header da prévia: o "TEMPORADA 28 · LIGA LEGENDS" ficou numa linha só, com 5px de
respiro antes da "Rodada N" (ele achou colado).

## 19/09/2026 (parte 18) — 🎙️ Placar GRANDE com o LANCE do gol (só na prévia do Diego)

Ele olhou a aba Elenco no celular: *"esse header (temporada, rodada, torcidômetro)
está muito grande — diminui um cadinho e aumenta a área do placar; ampliar as frases
também; e dar mais emoção ao placar"*. Mockup em `scripts/mockup-placar-emocao.mjs`
(3 colunas: antes · com faixa · sem faixa). Decisões dele no caminho:
- 🚫 **Faixa colorida de resultado (verde/vermelha/dourada): NÃO.** *"Não gostei."*
- 🚫 **Confete na vitória: NÃO.** (o confete do GOL, que já existia na cena dourada,
  ficou como estava — ele não falou dele.)
- ✅ **A emoção é o LANCE DO GOL**: *"driblou dois, chutou de fora da área, gol
  olímpico, tabelou, chutou cruzado, só colocou pra dentro na cara do gol… muitas e
  muitas frases, senão fica chato; alguns cômicos, tipo gol de barriga após um lindo
  cruzamento, mas sem exagerar no cômico"*.
- 🔒 **Só pra conta dele por enquanto** (*"code só pro meu usuário"*).

### ✅ O que subiu (tudo atrás de `useOnlinePreview()` = e-mails do Diego)
- **`src/escalacao/lances.ts`** (novo): 32 lances COM assistência (citam quem deu o
  passe) + 48 SEM (individual, bola parada, rebote), PT e EN com a mesma contagem.
  Sorteio determinístico por nome+minuto+rodada (a sala online lê o mesmo; o texto não
  troca a cada tique). Cômico ≈ 1 em 8, nunca humilhando o jogador real.
- **Placar (`OnlineScorePresentation` com `big`)**: no GOL o selo vira *"⚽ GOOOL!
  Petit 90+1′ — tabelou com Gerson e só empurrou"*; depois do flash a barra escura
  fica com *"⚽ 90+1′ Petit — <lance>"* até o próximo evento (antes voltava pra "bola
  rolando"). Apito final diz o RESULTADO na própria frase (4 variações × vitória/
  derrota/empate), escudo de quem ganhou brilha e o do outro apaga.
- **Tamanhos** (`.ll30-big` em `online-match-visual.css`): frase 17px em até 2 linhas ·
  escudo 92 · nome 18 · número 44 · goleadores 14 com ⚽.
- **Header compacto** (`privateCareer`): 176 → 118px; rodada e divisão na mesma linha;
  torcida numa linha com o histórico ("14º · 13º · 9º") ao lado.
- Bancada: `scripts/teste-placar-grande/` (`?cena=rolando|gol|fim&res=v|d|e`, print
  com `print.mjs`).

✅ **PUBLICADO PRA TODOS no mesmo dia** — ver a parte 20 logo abaixo.

## 19/09/2026 (parte 17) — 🔁 No rodízio entra o MAIS CHEIO (e o cria só sem reserva de verdade)

Ele perguntou como o preparador escolhe entre dois reservas, e ao saber que era "o
mais forte entre os inteiros" decidiu: *"Tem que pôr o cheio. Número 1. Somente o 2
se for jogador da base. Agora quando só tem a base no banco também vai ela mesma né."*

### ✅ Regra nova (`sugerirRodizio` em `condicao.ts` — vale pro botão E pro automático)
1. Entre os reservas da posição que estão inteiros, entra o de **mais gás**. Nível só
   desempata gás igual.
2. **Cria da Base** entra **só se não houver reserva de verdade inteiro** na posição
   (era excluído desde 13/09 — o titular jogava cansado). Um jogador de verdade
   inteiro sempre passa na frente do cria, mesmo o cria mais cheio.
3. O resto não mudou: sai o mais cansado primeiro, mesma vaga no campinho, reserva
   já 😓 não entra, suspenso/lesionado não entra.
- Trava: `npx tsx scripts/testa-condicao.mjs` seção 5 ganhou 4 checagens disso.
- Novidade na home. Reverter: `git revert` do commit desta parte.

## 19/09/2026 (parte 16) — 🐛 O botão 🤖 AUTOMÁTICO "sumiu" pro Rei da Bola FC

Ele avisou: o dono do Rei da Bola FC comprou o Seirulo (👑, o único com automático),
*"apertou, mas depois que apertou sumiu o botão"*.

### 🔎 O que acontecia
O interruptor do automático mora na caixa **😓 Quem está cansado**, em cima do campinho.
Essa caixa só existia (a) com alguém cansado ou (b) com o automático **LIGADO**. Então:
- De 13 a 15/09 o automático era de graça pra todo mundo, e a preferência
  (`condicaoAuto`) ficou gravada no save de quem ligou na época. Quem comprava o
  Lenda achava o botão **já verde (✔ ligado)**, tocava pra "ligar" e na verdade
  **desligava** → ninguém cansado → a caixa sumia → o botão junto. É a história dele.
- Sem preferência antiga o mesmo buraco existia: desligou de propósito, sem cansado,
  a caixa some e não tem como religar até alguém cansar.

### ✅ Conserto (commit desta parte)
- **Quem tem o direito (Lenda) vê a caixa SEMPRE**, ligado ou desligado. Desligado e
  sem cansado ela diz: *"Todo mundo inteiro (💪). 🤖 O automático está desligado —
  ligue e o preparador troca os cansados sozinho."*
- **Comprar preparador ZERA a preferência**: o automático nasce desligado, ninguém
  encontra botão verde sem ter apertado (regra dele: nada liga sem a pessoa mandar).
- No Departamento Técnico a linha do 🤖 agora diz o ESTADO (ligado/desligado) e ONDE
  fica o interruptor. Se o gás ainda não ligou na carreira (antes da Série C), diz que
  o automático liga junto com o gás.
- ⚠️ Continua igual: na **1ª temporada** não existe substituição (`canSub`), então nem
  RODIZIAR nem AUTOMÁTICO aparecem — o gás nem liga antes da Série C, então isso não
  chega a aparecer na prática.

Pro Rei da Bola: não precisa fazer nada — abrir a aba Elenco depois do deploy, a caixa
😓 estará lá com o botão 🤖 AUTOMÁTICO, é só tocar uma vez (fica verde ✔).

## 19/09/2026 (parte 15) — 🏋️ Renovar preparador = METADE do preço + o texto do gás que confundia

Duas cobranças dele no mesmo áudio, olhando a loja do preparador:

1. *"tá mt caro renovar contrato de preparador, principalmente o de mil… quero q seja
   metade todos eles, como se o valor desse é mil mas fosse 500 p cálculos de
   renovação… e serve p outros preparadores tb"*.
2. *"tá mt confuso esse negócio de joga 8 seguidas e senta 1… tá difícil entender pq o
   jogador q nem tem preparador cansa só dps de 50 partidas"*.

### ✅ 1. Renovação pela metade (`precoRenovacaoPreparador` em `preparadores.ts`)
- `RENOVAR_PREPARADOR` cobra `round(preco/2)`. Antes copiava o técnico e cobrava o
  preço cheio.
- 💰 **E logo depois ele baixou o catálogo**: *"coloque preço principal de 100, 300,
  500, 800"* (era 100/300/600/1000). Ficou: contratar **100 · 300 · 500 · 800** ·
  salário **10 · 30 · 50 · 80** · renovar **50 · 150 · 250 · 400**. Quem já tem o
  Paixão ou o Seirulo contratado não devolve nem paga nada — só o salário da
  próxima temporada já sai menor, porque é calculado do catálogo na hora.
- O botão RENOVAR mostra o valor novo e escreve "(metade do preço)"; o extrato e o
  aviso da renovação dizem o mesmo. Salário não mudou (10% do preço cheio).
- **Só o preparador.** O técnico continua renovando pelo valor dele — ele não pediu.
- Reverter: um commit só, `git revert`.

### ✅ 2. O texto "joga N seguidas e senta 1" tinha razão de confundir
Ele estava certo. Aquela frase era o **ritmo em que o tanque nunca desce** (banco
devolve +N ÷ 1,4 por jogo), não o ponto em que o cara cansa. E o jogador aguenta
**54 jogos seguidos** antes do 😓 **com ou sem** preparador — o preparador não mexe na
escada, mexe em quanto **uma rodada no banco devolve** (+4 sem ele; +6/+9/+12/+20 com).
Agora a tela diz exatamente isso:
- Loja: cabeçalho explica os 54 jogos e o +4 do banco sem preparador; cada card diz
  *"🔋 banco devolve +N de gás por rodada (sem preparador: +4)"* e *"1 rodada sentado
  paga X jogos de titular — descansando nesse ritmo, o gás nunca baixa"*.
- Departamento Técnico: a linha do preparador contratado ficou *"banco devolve +N…
  — 1 descanso paga X jogos"*.
- A conta mora em `jogosPorDescanso(banco)` (`preparadores.ts`), em vez de
  `Math.floor(banco/1.4)` espalhado.
- 🔁 **Segunda rodada de texto** (ele: *"tá confuso ainda… ng entendeu"*): saiu
  "gás/descanso/paga" e entrou **FÔLEGO**, uma linha só: *"🔋 1 rodada no banco =
  8 jogos de fôlego"* + *"sem preparador, 1 rodada no banco devolve o fôlego de só
  2 jogos"*. O cabeçalho da loja explica os 54 jogos e que o preparador só muda o
  quanto RECUPERA no banco. Se ainda confundir, o próximo passo é um desenho
  (barra de gás antes/depois do banco), não mais texto.

## 19/09/2026 (parte 14) — 🥇 A aba da Bola de Ouro no Rank (o que eu tinha ESQUECIDO)

Ele cobriu no ar: *"n tô vendo na área de rank a aba de bola de ouro e nem tô vendo
em aba de assistência o item de assistências de todos os tempos"*, e logo depois
*"já vi q garçons de todos tempos está na aba de artilheiro sendo q era p tá na de
garçom"*.

### ❌ Os dois erros eram meus
1. **A aba da Bola de Ouro no Rank eu simplesmente não fiz.** Desenhei ela no
   mockup, ele aprovou, e eu montei **só a página do jornal**. Lição: quando o
   mockup tem DUAS telas, a entrega tem duas telas — conferir o mockup item a item
   antes de dizer "publicado".
2. **O garçom de todos os tempos estava na aba de GOLS**, colado no irmão dele (o
   artilheiro de todos os tempos). Fazia sentido pra quem escreveu o código e
   nenhum pra quem usa.

### ✅ O que ficou
- **Aba nova 🥇 OURO** no Rank (5 abas agora: ⚽ Gols · 🅰️ Garçons · 🥇 Ouro ·
  🏟️ Local · 🌍 Global). Medido a 430px: **nenhuma aba corta o texto** — a lição do
  "Estatísticas" (cabe ≠ fica bom) virou medição antes de subir.
- ⚠️ **Troquei o ícone do ranking de clubes de 🥇 pra 🏟️**: com a aba nova, ficavam
  **duas medalhas iguais** lado a lado. Estádio diz melhor o que aquela aba é.
- **A caixa 🥇 BOLA DE OURO · TODOS OS TEMPOS**: o último a levar em destaque
  (preto/dourado) + a lista dos **DONOS**, com as temporadas como etiquetas
  (`T3 T5 T6 +9`) — a resposta da dúvida das mil temporadas.
- **O garçom de todos os tempos mudou pra aba de GARÇONS.**
- Trava: `npm run artilharia` seção 8 — reprova se a caixa de garçons voltar pra
  aba de gols ou se a aba de ouro sumir.

⏳ As duas listas **nascem vazias** e explicam isso na tela: o prêmio é entregue na
virada da temporada, então o primeiro nome só aparece depois que ele fechar a T27.
## 19/09/2026 (parte 9) — 🐛 As pílulas Comissão/Base jogavam pro fim da tela no celular

Diego, com três prints do celular: *"quando aperto nessas pílulas de comissão e base
tá me jogando pro final da tela e nem consigo subir mais"* — um vazio amarelo de mais
de uma tela embaixo da folha, e a rolagem presa.

**Causa:** `abrePainel` fazia `setPainel` e, no `requestAnimationFrame`, um
`scrollIntoView({ behavior: 'smooth' })` pro painel. Só que no mesmo instante a lista
de 27 linhas (~1400px) sai e o painel curto (~600px) entra: a página encolhe ~800px
NO MEIO da animação de rolagem, e o Chrome do celular se perde (para num ponto que
não existe mais, deixa um vazio e trava a rolagem). Na bancada de desktop não
reproduz; com emulação de celular também não — é coisa do Chrome Android real.

**Conserto:** saiu a animação. O painel entra onde a lista estava (logo abaixo das
pílulas); um `useLayoutEffect` só dá um empurrão SECO (`scrollBy` com `behavior:
'auto'`, depois do layout) se o topo do painel ficou fora da tela. Rolagem
instantânea depois do layout não tem como brigar com o encolhimento.
⚠️ Lição pra qualquer tela: **nunca rolar com `smooth` na mesma batida em que o
conteúdo muda de tamanho** — primeiro o React desenha, depois (se precisar) um
`scrollBy` seco. O atalho do cabeçalho (`ID_TITULARES`) continua suave porque lá a
página não muda de tamanho.

## 19/09/2026 (parte 13) — 🎬 ROTEIRO SEMPRE (pergunta fechada)

Eu tinha deixado uma pergunta aberta no mockup e no commit: o roteiro do fim de
temporada é obrigatório **sempre**, ou só na **primeira vez** (com um "ver tudo de
novo" depois)? Meu medo era a 20ª temporada cansar.

**Resposta dele: *"Roteiro sempre."*** Fechado, e virou regra permanente no
`CLAUDE.md`. **Não propor de novo** botão de pular, atalho pra decisão nem "só na
estreia". Nada a mudar no código — é exatamente como já subiu.

O que segura o risco do cansaço continua sendo o CUSTO do roteiro: um toque por
passo, nenhum passo pede pra pensar (só o último), e dá pra voltar. Se um dia ele
reclamar de ritmo, o lugar de mexer é aí — encurtar os passos —, nunca pular.

## 19/09/2026 (parte 12) — 🎬 ROTEIRO + 📰 JORNAL QUE VIRA PÁGINA + 🥇 BOLA DE OURO (FEITO)

Ele aprovou os mockups (*"pode seguir faça e publique já tb"*). O que entrou:

### 🎬 O roteiro do fim de temporada
4 passos, um por tela: **📰 jornal → 💰 caixa → 🌍 Copa do Mundo → 🔨 decisão**.
Barrinha de progresso em cima; dá pra VOLTAR num passo já feito, não dá pra pular
pra frente. O caixa deixou de ser uma linha fininha e virou quadro com o saldo em
número grande + os 5 maiores lançamentos. A Copa do Mundo saiu do topo (onde
competia com a decisão) e virou um passo discreto depois do jornal.
- ⚠️ **O buraco que eu tive que fechar**: passo a passo é lugar de PRENDER gente.
  Temporada sem lançamento nenhum não desenha o quadro do caixa → passo 2 ficaria
  sem botão → carreira travada. Agora tem aviso com saída, e o `npm run fim` reprova
  se qualquer passo ficar sem porta.
- 🌐 **O ONLINE não foi tocado** (lá é votação entre os técnicos da sala).
- 🧹 Os chips das fases saíram da aba JOGOS no fim; em TABELAS continuam.

### 📰 O jornal: as páginas já existiam — faltava AVISAR
🔑 **Achado**: `SeasonJornal` já tinha páginas (`capa`/`agencia`/`eventos`/`memoria`)
desde sempre. O convite eram **duas bolinhas de 8px e uma linha de 9px** — por isso
*"ninguém percebe"*. Agora tem as quatro pernas: **orelha** do papel no canto ·
**barra** dizendo pra qual página vai **e o que tem lá** · **"PÁG. X DE Y"** ·
**"NESTA EDIÇÃO"** na capa (e cada linha dela leva direto pra página).

### 🥇 A página da Bola de Ouro
Arte dele (com a marca apagada), o nome do melhor do mundo, a conta
`gols + assistências = total`, a frase que explica o prêmio, e os **top 5
artilheiros e top 5 garçons** do ano lado a lado — tudo por CARTA, com o clube
embaixo do nome. A página só existe quando houve Bola de Ouro na temporada.

### ⏳ O que ficou de fora (e por quê)
- **O compartilhar ainda manda a imagem inteira.** A pergunta "esta página ou o
  jornal todo?" é obra à parte (o canvas é outro código); não entrou agora.
- **A página 4 do mapa ("MERCADO")** não foi criada: o que ela teria já mora no
  Caderno do Empresário, que é uma página do jornal desde antes.
- **O flip automático da capa depois de 5s** continua como era. Ele existia
  justamente porque ninguém achava a página 2 — agora que a capa ANUNCIA as
  páginas, talvez ele só atrapalhe quem está lendo a manchete. Candidato a sair;
  não mexi porque ninguém pediu.

## 19/09/2026 (parte 11) — 🎬 O FIM DE TEMPORADA VIRA UM ROTEIRO

Ideia dele, com o print da tela na mão: *"e se fizéssemos de uma forma q tivesse q
ter o passo a passo obrigado e c isso teria q ler.. pq hj aparece essas coisas aqui
misturadas embaixo tb q n estão legais… A copa do mundo quero algo sutil msm mas
após o jornal, seria algo novo, tudo novo pra essa tela"*.

### 📋 O diagnóstico (conferido no print dele)
Seis coisas empilhadas na MESMA rolagem: aviso das Tabelas · cadeado da Copa do
Mundo · fechamento do caixa · a decisão da próxima temporada · os chips das fases ·
sair e salvar. **O que mais importa (a decisão) divide espaço com o que menos
importa agora** — um cadeado que só abre daqui a 74 temporadas. E o fechamento do
caixa, que é a melhor parte de ver, virou uma linha fininha que ninguém abre.
👉 Ninguém lê porque **está tudo com o mesmo peso**, não por falta de vontade.

### 🎯 A proposta (`npm run roteiro`)
Um passo por tela, na ordem que a cabeça pede, com barrinha de progresso em cima:
| passo | o quê |
|---|---|
| 1 📰 **JORNAL** | a notícia. A capa já anuncia as 4 páginas; a orelha chama a próxima; a Bola de Ouro mora aqui |
| 2 💰 **CAIXA** | o fechamento ganha a tela e um NÚMERO GRANDE (+50 🪙), com os lançamentos embaixo |
| 3 🌍 **MUNDO** | a Copa do Mundo **discreta**, como ele pediu: aparece uma vez, mostra "faltam 74", sai de cena |
| 4 🔨 **PRÓXIMA** | a decisão SOZINHA na tela — a única hora em que ele precisa pensar |

### ⚡ O risco, e o que fiz pra segurar
A regra de ouro dele é *"nada pode atrasar o ritmo do jogo"*, e passo a passo
obrigatório pode virar pedágio. Por isso: cada passo é **um toque**, nenhum pede pra
pensar (só o último), o jornal tem **"pular pro fim"**, e os 4 toques levam ~3s.
- ⏳ **PERGUNTA ABERTA PRA ELE**: obrigatório **sempre**, ou só na **primeira vez**
  (e depois um "ver tudo de novo")? Minha dúvida é a 20ª temporada cansar.

⏳ Esperando o OK. Nada no código.

## 19/09/2026 (parte 10) — 📰 O MARTELO VIRA JORNAL DE VÁRIAS PÁGINAS

Ele viu o mockup da página 2 e pegou o buraco de cara: *"agora q eu vi q já dava p
passar a página do jornal... Porém ng percebe... Tem q ter alguma dobra sei lá..
Algo q de vontade de virar a página… Outras páginas na verdade q são mais de duas"*.

### 🔑 O problema não é CABER, é AVISAR
O jornal já cresce pra baixo. O que falta é o papel **dizer** que tem mais. Num
jornal de verdade isso se resolve com **três coisas**, e o mockup
(`npm run jornalpags`) propõe as três:

1. **A ORELHA** — o canto do papel levantado no fim da página, com a de baixo
   espiando. É o sinal mais antigo que existe de "tem mais", e dá vontade de puxar.
   Tocar nela vira a página.
2. **A BARRA QUE DIZ O QUE TEM LÁ** — "próxima página" não convence ninguém; o que
   convence é *"🥇 Os prêmios do ano — quem levou a Bola de Ouro, e não foi o
   artilheiro"*. Fica grudada no fim de cada página.
3. **A CHAMADA DE CAPA ("nesta edição")** — logo abaixo da manchete. É ela que faz a
   pessoa saber que existem 4 páginas **antes mesmo de rolar**.
4. (+ o **número da página** sempre à vista, com bolinhas: some a dúvida de
   "acabou ou não?")

### 🗺️ Mapa proposto (4 páginas)
| pág | assunto |
|---|---|
| 1 | **CAPA** — a manchete e os teus números (fica LEVE de novo; hoje ela carrega tudo) |
| 2 | **PRÊMIOS** — Bola de Ouro · artilharia · garçons |
| 3 | **DONOS** — campeões de A, B, C, D, Copa, Supercopa e Mundial |
| 4 | **MERCADO** — a agência, quem valorizou, quem despencou |

### 🤔 E o compartilhar (pergunta que o multipágina cria)
Numa IMAGEM ninguém vira página. Proposta: o botão passa a perguntar **"esta
página"** (curta, boa pro grupo) ou **"o jornal inteiro"** (as 4 emendadas, com as
dobras desenhadas). O palpite é que a maioria mande só a página.

⏳ Esperando o OK dele. Nada no código — os três mockups do dia (página 2, páginas,
e o da Bola de Ouro) são só desenho.

## 19/09/2026 (parte 9) — 📰 A SEGUNDA PÁGINA DE O MARTELO

Ideia dele: *"acho q vc deveria prolongar o jornal p baixo… como se fosse uma
segunda página, mas embaixo, com mesmo estilo e arte, pra poder caber mais coisas"*.

### ✅ E dá, sem obra grande
O jornal **já cresce pra baixo**: o canvas é desenhado num buffer alto e depois
**cortado na altura que o conteúdo usou** (`const H = Math.min(MAXH, Math.round(y))`
em `jornal.tsx`). O que existe é um **teto**: `MAXH = 2520` no jornal de temporada
(2600 no de elenco). "Segunda página" = **subir o teto e desenhar mais blocos**.
A página 1 não precisa ser tocada.

### O que o mockup propõe pra página 2 (`npm run jornal2`)
1. **A dobra** — filete duplo + "CONTINUA NA PÁGINA 2", e o masthead menor repetido
   ("PÁGINA 2 · OS PRÊMIOS DO ANO"). É o que faz parecer jornal, e não rolagem.
2. **🥇 A BOLA DE OURO** — a arte dele em cima, o nome do melhor do mundo por cima
   do degradê, e a conta `24 GOLS + 13 ASSIST. = 37` embaixo, com a linha
   *"Não foi o artilheiro do ano, nem quem mais deu passes. Foi o único que fez as
   duas coisas."*
3. **🏆 Artilharia do ano** e **🅰️ Os garçons do ano**, lado a lado, top 5 de cada,
   com o clube da carta embaixo do nome (a identidade que virou regra hoje).
4. **🥇 A galeria das bolas de ouro** — os donos, com as temporadas como etiquetas.
   É a mesma solução da dúvida das mil temporadas: lista DONOS, não anos.

📏 A página 2 mede **~1900px** de altura em 1080 de largura, então o jornal inteiro
passaria de ~2500 pra ~4400px. **O teto (`MAXH`) precisa subir junto** — se ficar em
2520, a página 2 é desenhada e cortada fora, e ninguém entende por quê.

⏳ Esperando o OK visual dele. Nada no código ainda.

## 19/09/2026 (parte 8) — 🥇 BOLA DE OURO (melhor do mundo do ano)

### A regra
Ideia dele: *"o jogador que teve mais gols COM assistência junto… será considerado
o melhor do mundo no ano… NÃO é o artilheiro e também NÃO é o garçom, é o cara que
conseguiu unir os dois"*. Depois batizou: **Bola de Ouro**, por temporada, *"não
importa se o cara ganhar vários anos seguidos"*, e *"começa a contar a partir de
agora"*.

**Motor FEITO e testado** (`npm run melhor`): gols + assistências somados · liga +
todas as copas · o mundo inteiro (5 divisões, humano, rival e bot) · **por CARTA** ·
desempate fixo (total → mais gols → divisão mais alta → alfabético), **sem sorteio**,
porque no online cada aparelho calcula no próprio celular e dois amigos não podem ver
campeões diferentes. Guardado em `careerMelhorMundo`, por temporada, ~100 bytes/ano.
**Não mexe em dinheiro** — é honraria (ele disse "não" a prêmio de garçom, então não
inventei caixa nova).

### 🧩 A dúvida dele: "e se o cara tem mil temporadas?"
*"Não sei como seria o mockup disso… não sei como apareceria uma por uma"*.
👉 **Resposta: a lista não mostra TEMPORADAS, mostra DONOS.** Quem ganhou 12 bolas
ocupa **uma** linha, com as temporadas dele como etiquetas (`T3 T5 T6 T9 +8`). Mil
temporadas cabem numa tabela de 20 linhas, porque os ganhadores são muito menos que
os anos. Mockup mandado.

### ⚠️ A ARTE VEIO COM MARCA DE TERCEIRO
A imagem que ele mandou tinha **"FIFA BALLON D'OR"** escrito na bola. Não pode entrar
num jogo no ar. **Apaguei só o escrito**: o painel do pentágono foi RECONSTRUÍDO —
superfície quadrática ajustada nos pixels limpos do próprio painel + grão do mesmo
desvio, com a borda desvanecida dentro da margem que já era limpa. Sem letra, sem
fantasma, sem emenda. O resto da arte é exatamente a dele.
📦 `src/escalacao/img/jornal-bola-ouro-v1.webp` · 1080×608 · **57 KB** (a chuteira do
artilheiro tem 56 KB).
⚠️ Lição pra qualquer arte que chegar pronta: **procurar marca escrita antes de usar**.

### ⏳ O QUE FALTA (esperando o OK visual dele)
1. O bloco no **jornal** (Os donos da temporada, no topo).
2. A seção **🥇 BOLA DE OURO · TODOS OS TEMPOS** no Rank, por donos.
Nada disso está no código ainda — só a arte e o motor.

## 19/09/2026 (parte 7) — 🅰️ Assistência anda junto com gol · 🕳️ o "—" na ficha

### 📏 REGRA PERMANENTE NOVA (19/09): gol e assistência andam JUNTOS
Palavras dele: *"todos dados q tá fazendo de gols sempre serve p assistência tb
hein"*. Vale daqui pra frente, sem precisar pedir caso a caso. Já está gravado no
`CLAUDE.md`. O `npm run artilharia` tem uma seção só pra isso — inclusive
conferindo que os dois são ZERADOS nos mesmos lugares, pra nenhum reinício de
carreira esquecer um deles.

**Feito hoje**: `careerAssistsAll` (não existia — assistência nunca teve histórico
em canto nenhum), pela mesma chave (a carta), nas mesmas competições (liga +
Copa do Brasil + Copa Legends + Supercopa), com o mesmo teto de 2500, e a caixa
🅰️ GARÇONS · TODOS OS TEMPOS no Rank, do lado da artilharia.
⚠️ Ela **nasce vazia pra todo mundo** — não há passado pra trazer, e inventar não
é opção.

### 🕳️ A ficha: o "—" (o que ele estranhou)
Dúvida dele: *"pra quem chega hoje e vê gols iguais na temporada e no total…
porém jogos ele vê poucos da temporada e 300 total. Tá estranho. Não sei o que
fazer"*.

🔑 **A chave que faltava, e que eu só achei agora**: **o 337 jogos TAMBÉM é
parcial**. Jogos só começaram a ser gravados em **13/09** (vieram com o gás); gol
e assistência, em **19/09**. Não são "um certo e um errado" — são **dois números
com datas de nascimento diferentes**, e é isso que faz a coluna parecer torta.

**O que ficou** (a opção B do mockup, que eu tinha recomendado): enquanto a
carreira não tem passado de gol, a coluna dourada mostra **`—`** em GOLS e ASS,
com a linha `⚽ 🅰️ COMEÇAM A CONTAR NA PRÓXIMA TEMPORADA` embaixo. JOGOS continua
à mostra. Assim ninguém compara "337 jogos × 10 gols", e o jogo **assume que não
sabe** em vez de mostrar um número que parece defeito.

🔁 **Some sozinho**: a marca é "tem carry mas nenhuma carta com `gl` gravado", o
que só acontece em carreira anterior a hoje. Depois da 1ª virada toda carta tem
`gl` (mesmo que 0) e o `—` vira número, sem ninguém mexer. Carreira nova nunca vê
o aviso.

⏳ **Falta o OK visual dele** — está no branch, não publicado. Trocar pro aviso da
opção A (mostrar o número com uma notinha) é uma linha.

## 19/09/2026 (parte 6) — 🏆 A artilharia de todos os tempos virou POR CARTA

Veio do 337 jogos × 10 gols do Álvarez. Ele perguntou *"não seria melhor você
conferir os gols que o cara já fez, pelo usuário? Não dá?"* — fui procurar no
save e **achei um histórico que ninguém estava usando direito**.

### 🔎 O que eu achei
`careerScorersAll` (o Rank › Artilheiros) soma os gols de todo mundo desde a 1ª
temporada. O save da carreira T25 dele tem **1000 jogadores guardados, com 24
temporadas somadas**. Só que com **três defeitos**:

1. **A chave era o NOME.** O reducer até previa `nome|cardId`, mas quem despacha
   nunca mandou `cardId` — então caía no nome sempre, e dois jogadores diferentes
   com o mesmo nome somavam num registro só. Medido no baralho inteiro:
   **1466 cartas · 1403 nomes · 62 nomes repetidos em 125 cartas**.
2. **Só contava LIGA.** Copa do Brasil, Copa Legends e Supercopa ficavam de fora.
3. **Teto de 1000**, e o save dele estava EXATAMENTE em 1000 — lotado. Quem caía
   abaixo do 1000º perdia o histórico.

### ✅ O que ficou (decisões dele, 19/09)
- **Chave = a CARTA** (`nome|clube|ano`), a mesma identidade do `condicaoCarry`.
  **Não é o `cardId`**: o leilão dá id novo pra mesma pessoa todo ano.
- **O passado embolado foi DIVIDIDO**, não zerado — palavras dele: *"pros 62
  divida entre eles"*. Partes iguais, sobra pras primeiras em ordem fixa de
  clube+ano. **O total é preservado**, e é uma repartição DECLARADA, não um
  palpite sobre quem fez o gol.
- **Liga + TODAS as copas** contam. A Supercopa precisou de trabalho à parte: ela
  é calculada FORA da Copa do Brasil (`computeSupercopa`) e entra na chave só
  como uma fase a mais, então os gols dela não estavam em lugar nenhum.
- **Teto 1000 → 2500**: o baralho tem 1466 cartas, então ninguém mais é
  descartado.
- **Na tela**: o clube da carta aparece miúdo embaixo do nome. Escolha dele
  (*"sobre os gols quero que seja pelo clube da carta apenas"*), depois de eu
  medir que a letra (M)/(E) que ele tinha sugerido **não fecha**: em 6 dos 62 os
  dois xarás são do MESMO baralho (Marcelo Lomba Internacional × Bahia, Felipe,
  Diego, Reinaldo, Paulinho, Andreas Pereira) e levariam a mesma letra.
- ⚠️ **ASSISTÊNCIA continua sem histórico nenhum** — não existe `careerAssistsAll`
  em lugar nenhum do código. Se ele pedir, é obra nova.

### 🛡️ Travas: `npm run artilharia` (novo)
Roda o código DE VERDADE no navegador (não uma cópia da regra): a chave é a
carta · a divisão preserva o total · é **determinística** (dois aparelhos migram
igual — senão no online viraria briga de números) · é **idempotente** (abrir o
save 10 vezes não pica o histórico em migalhas) · cria da base fica pelo nome ·
e liga + Copa Legends + Copa do Brasil + Supercopa estão ligadas.

### 📌 O QUE ISSO **NÃO** RESOLVE (e ele já sabe)
Esse histórico é **gol em QUALQUER clube**, não "no seu clube". Então **não serve
pra ficha do jogador** — ele foi claro: *"quero apenas esse modal preto… apenas
dados do jogador do meu clube"*. A coluna dourada continua sendo só do clube dele,
e continua começando do zero nesta temporada.
- ⏳ **PENDENTE, esperando ele**: na ficha, **A** (notinha "contando desde esta
  temporada") ou **B** (tracinho "—" no lugar do número). Mockup já mandado.
## 19/09/2026 (parte 7) — 🧾 A ficha "NO SEU CLUBE": jogos passam a contar junto com os gols

Diego, olhando a ficha preta do Álvarez: *"300 partidas com 10 gols apenas, tá
estranho… se coloco os totais também contando no mesmo dia do gol?"*. Tinha razão: os
JOGOS vinham sendo guardados no `condicaoCarry` desde a condição física (12/09), e
gol/assistência só desde hoje de manhã — a ficha somava os dois como se fossem do
mesmo período.

**Regra (a proposta dele):** a história no clube começa no dia em que o gol passou
a contar. Carry ainda sem `gl` → os jogos de trás ficam de fora; jogos, gols e
assistências nascem juntos, da mesma temporada. Vive em DOIS lugares com a mesma
linha: `guardaCansaco` (store.tsx, a virada) e `condInicio` (pyramidseason.tsx, a
tela). O gás (`g`) continua vindo de trás — ele é de agora, não é histórico.
⚠️ Quem virou temporada entre o deploy da manhã (ficha nova) e este, já tem `gl` no
carry e ficou com os jogos velhos somados — não dá pra separar depois; é um punhado de
saves, e o número só cresce dali pra frente com os três juntos.

## 19/09/2026 (parte 6) — 🌐 Copa do Mundo: jogo único, relógios +10s, e o portão grande (em andamento)

Pedido do Diego, num áudio só: *"a Copa do Mundo o mata-mata tem que ser um jogo
único, porque Copa do Mundo é único, e isso serve também pra carreira… tá tendo
oitavas de final? acho que vi quartas apenas… quero que aumente mais 10s pra cada
um escolher seu país… e a convocação também mais dez segundos… esse quadrinho da
Copa pra escolher o país está MUITO pequeno… tem que ser parecido com o modelo da
Copa dos 8 e da Libertadores: acabou a liga, já aparece grande o banner da Copa, a
tabela da liga vai pra baixo, e embaixo maior a escolha dos países, e depois segue
pra convocação"*.

### ✅ 1. Mata-mata em JOGO ÚNICO (online e carreira)
`mkTie` em `simulaCopaMundo` jogava ida e volta com agregado. Agora é uma partida
(`g1`/`ev1`), empate = pênaltis. Como é o MESMO motor da carreira, vale nos dois.
Os passos mudaram de 12 pra 10 (5 rodadas · sorteio 6 · quartas 7 · semi 8 ·
final 9 · cerimônia 10) e agora moram num lugar só, `src/escalacao/copa-passos.ts`
— antes a tela, o `copa-stats` e o relógio da sala escreviam "8", "10", "11", "12"
na mão, cada um no seu canto.
- ⚠️ **O BANCO TEM CÓPIA**: a função `esc_copa_preview_clock` (o relógio
  sincronizado da sala) tinha `r.step<12` e "roda bola em 7–11". Virou `<10` e
  "7–9" — `docs/sql/online-copa-clock-jogo-unico.sql`. Foi aplicada via MCP
  (se a aprovação não passou, rodar o arquivo no SQL Editor; sem ela a Copa
  continua funcionando, só que o relógio marca "bola rolando" na cerimônia por
  14s à toa).
- `npm run copa` (o guarda "todo mundo vê a mesma Copa") continua verde.
- 🎲 **A mesma semente dá outro resultado a partir das quartas** (o `rng` andava
  mais com a volta). Copa encerrada não muda (campeão gravado). Sala no MEIO do
  mata-mata na hora do deploy: todo aparelho recalcula igual — ninguém racha.
- `placaresDoConfronto` (o agregado do bug do Gabriel, 15/08) saiu: sem volta não
  tem coluna pra somar errado.

### ✅ 2. Relógios da Copa online: bandeira 65 → 75s · convocação 80 → 90s
Constantes em `copa-mundo-online.tsx` (histórico no comentário: 45 → 65 → 75 e
65 → 135 → 80 → 90). O banner entre as duas continua 15s.

### ✅ 3b. OITAVAS — feito ("Ok ok ok", 19/09): 6 grupos de 4 + 4 melhores 3ºs = 16
`NUM_GROUPS 6 · GROUP_SIZE 4 · RODADAS_GRUPO 3`, `PASSO_COPA` ganhou `OITAVAS` (9
passos: 3 rodadas · sorteio 4 · oitavas 5 · quartas 6 · semi 7 · final 8 · fim 9),
`melhoresTerceiros()` (mesma régua da tabela: pontos → vitórias → saldo → gols;
empate total = letra do grupo), sorteio das oitavas sem reencontro de grupo (até 40
tentativas semeadas), prêmio da carreira ganhou o degrau **oitavas = 20**, e a CÓPIA do
banco (`docs/sql/online-copa-clock-oitavas.sql`, `r.step<9`, bola em 1–3 e 5–8) —
aplicada via MCP (se a aprovação não passou, rodar no SQL Editor).
Tela: 🟩 verde nos 2 primeiros · 🟨 amarelo no 3º **só enquanto está entre os 4
melhores** (recalculado a cada rodada apitada — a rodada rolando não entra, zero
spoiler) · quadro **OS MELHORES TERCEIROS** com os seis lado a lado · legenda com a
régua de desempate. `npm run copa` verde. Bancada: `scripts/teste-copa-grupos/`
(`?passo=3` grupos fechados · `4` sorteio · `5` oitavas).
⚠️ O que ele perguntou e eu respondi: a régua de desempate é **pontos → vitórias →
saldo → gols marcados** (ele achava "vitórias → gols → saldo"); trocar gols ↔ saldo é
uma linha em `groupTable`/`melhoresTerceiros` se ele quiser.

### ✅ 3c. Tabela em colunas + VOCÊ em roxo (19/09, "faça tudo") — no ar
Depois das oitavas ele pegou dois problemas: *"tá faltando organizar melhor os pts,
vitória e saldo"* e *"a cor amarela é a mesma do usuário selecionado?"* — era. Agora:
cabeçalho **# · SELEÇÃO · PTS · V · SG · GP** com colunas fixas (`cabecalhoTabela` /
`linhaTabela` no `CupScreen`), e a cor da linha é SÓ a zona (verde/amarelo); o
usuário é contorno **roxo #7C3AED + selo "VOCÊ"** (mesma linguagem do "SEU JOGO").
⚠️ Selo em `<em>`, não `<span>`: o CSS `.ll26-world-group>div span span{display:block}`
vira qualquer span interno em bloco e esticava o selo.

### ❓ 3. Oitavas: NÃO EXISTIAM — e ele viu certo (histórico)
Formato de hoje: 4 grupos de 6, passam 2 = **8 seleções → quartas direto**. Se
ele quiser oitavas, o formato natural de 24 seleções é o da **Copa de 86/90/94**:
6 grupos de 4 (3 rodadas), passam os 2 primeiros + os 4 melhores 3ºs = 16 →
oitavas → quartas → semi → final. Muda `NUM_GROUPS/GROUP_SIZE/RODADAS_GRUPO`,
`copa-passos.ts` (12 passos de novo: 3 rodadas · sorteio · oitavas · quartas ·
semi · final · fim), a régua dos melhores 3ºs, o prêmio da carreira (oitavas =
degrau novo) e a CÓPIA no banco. **Decisão dele — não fazer sem OK.**

### ✅ 4. O portão grande da Copa no fim da liga — APROVADO ("Ok correto", 19/09) e no ar
Feito (não está na main): `PortaoDaCopa` em `copa-mundo-online.tsx` (o desenho, sem
banco), `GradeDeSelecoes` (escudo 56px, 2/3 colunas, sem rolagem, CONFIRMAR grudado no
pé), CSS `ll27-*` em `online-match-visual.css`, e em `screens.tsx` o portão subiu pra
CIMA da liga com a liga recolhida (`mundoEsperando`). Bancada:
`scripts/teste-copa-portao/` (`?fase=inicio|bandeira|espera|banner|convocacao|torneio`);
mockup: `scripts/mockup-portao-copa.mjs`. **Aprovado e na main em 19/09.** Junto foi a 🟩 faixa verde dos 2 primeiros de cada grupo (era um branco a 6%, invisível — igual no online e na carreira). O formato 6 grupos de 4 → oitavas ficou pra ele confirmar à parte (muda o motor).

Como era o pedido:
Hoje o fim da liga com Copa do Mundo mostra a tabela da liga PRIMEIRO e o portão
da Copa depois, como uma caixinha; a escolha de país só fica grande pra quem está
na vez (modal), e os quadrinhos são pequenos (2 colunas, 320px de altura com
rolagem). O pedido: igual à Copa dos 8/Libertadores (`CompetitionStage` no TOPO com
a arte do mundial, liga recolhida em `<details>` embaixo), e a escolha de país
grande, inline, sob o banner; depois a convocação. Regra #2: mockup e OK antes de
subir.


## 19/09/2026 (parte 5) — ⏱️ +1s por rodada · 📣 a regra do apito · 🏟️ o SOM fechado

### ⏱️ A simulação da partida ficou 1 segundo mais longa (FEITO, no branch)
Ordem dele: *"aumente em mais 1s a simulação de uma partida tanto no modo off-line
qlqr ou modo online qlqr Tb"*. Medido pelo `npm run ritmo` (novo):

| modo | antes | agora |
|---|---|---|
| carreira no manual | 9,0s | **10,0s** |
| carreira no auto | 10,0s | **11,0s** (o +1s do auto, de 13/09, continua por cima) |
| rápido / online | 4,7s | **5,7s** |
| basquete | 2,2s | **3,2s** |

Temporada online inteira: 180s → **218s**.

⚠️ **Onde o segundo mora** (pra ninguém somar de novo depois): `ROUND_EXTRA_MS`
em `screens.tsx`, somado no `ROUND_MS` e no `baseRoundMs` do basquete — **nunca**
no `SEASON_TOTAL_MS`, que é o orçamento da temporada E divide os 82 jogos do
basquete. Na carreira é o `ROUND_MS` próprio do `pyramidseason.tsx`. O teste
`npm run ritmo` reprova se aparecer um segundo `ROUND_MS` em qualquer um dos dois.

### 🔔 O APITO tem REGRA agora (FEITO, no branch)
Isto virou pergunta dele, e a pergunta foi boa: *"não entendi sobre o apito.. vai
ter em uma partida só ou no início de todas as partidas?"*. Eu tinha lido o
*"apito coloque só no início do jogo p N ficar repetitivo"* como **um por
temporada**, e ele quis o meio-termo. Escolha dele: *"isso número 3.. qd for copa
e sempre a primeira partida tb né.. e qlqr copa nova ou liga.. e vale tb pro modo
online qlqr modo tb"*.

**A regra, em três linhas:**
1. A **primeira partida de qualquer competição** apita — liga nova, copa nova.
2. **Toda partida de COPA** apita — mata-mata é jogo grande, sempre.
3. Da **2ª rodada de liga** em diante, silêncio — era isso que ficava repetitivo
   (38 apitos por temporada).

Mora num lugar só: **`useApitoDeLargada`** (em `pyramidseason.tsx`, ao lado do
`LiveScoreCard`). As 6 telas de partida chamam esse gancho e nenhuma apita por
fora — o `npm run som` reprova `playWhistle()` solto:

| tela | competição | apita |
|---|---|---|
| liga da carreira | `liga-carreira-<temporada>` | só na largada |
| Copa da carreira (Brasil/Legends/Supercopa) | `copa-carreira` | **toda partida** |
| liga do rápido/online | `liga-<temporada>` | só na largada |
| Copa dos 8 / NBA Cup / playoffs | `copa-rapida` | **toda partida** |
| Libertadores | `libertadores` | **toda partida** |
| Copa do Mundo | `copa-mundo` | **toda partida** |

⚠️ **Por que o gancho tem DUAS chaves** (competição + partida): sem a competição, a
temporada nº 2 não apitaria (a rodada volta a ser 1, que o gancho já teria visto);
sem a partida, a copa não apitaria a cada jogo. São perguntas diferentes, e juntar
as duas numa chave só quebra uma das pontas.

🏟️ **DE QUEBRA: a Copa do Mundo estava MUDA e ninguém tinha notado.** Ela tem tela
própria (`copa-mundo.tsx`), não é a da liga — então o som de 18/09 passou por fora
dela. Ganhou ambiente + apito agora. O `npm run som` passou a varrer as telas pelo
`LiveScoreCard`, pra nenhuma outra ficar de fora de novo.

### 🔊 O SOM DA PARTIDA ESTÁ FECHADO (FEITO, no branch)
Palavras dele: *"quero só os áudios que eu mandei, do ambiente, gol, e o apito que
você já tinha mesmo"*. Isso respondeu de uma vez as três perguntas que estavam
abertas. A lista do som de partida é **FECHADA em três**:

| o quê | de onde vem | peso |
|---|---|---|
| 🏟️ ambiente | `public/sfx/torcida-estadio-v1.mp3` (arquivo DELE), em loop | 137 KB |
| 🥅 gol | `public/sfx/gol-torcida-v1.mp3` (a opção **B**, que ele escolheu) | 21 KB |
| 📣 apito | sintetizado, o de sempre (`playWhistle`) | 0 KB |

🗑️ **Aposentados**: o murmúrio de ruído rosa que fazia de ambiente, o urro
sintetizado do gol e o **canto de palmas + "ôôô"** — o ambiente dele já tem torcida
cantando ao longe, e os dois juntos embolavam. O `crowdChant` foi APAGADO do código
(não é chave desligada: sumiu mesmo), e o `npm run som` reprova se voltar.

🔑 `TORCIDA_NOVA = true` desde 19/09. **É o botão de pânico**: `false` numa linha
devolve o jogo ao silêncio de hoje, sem mexer em mais nada.

**As 4 regras de convivência do gol** (isto era a pendência nº 1, agora codada):
1. **Um gol por vez** — o anterior sai de fininho em 0,12s se vier outro.
2. **O gol nunca passa da rodada** — cortado em 85% do tempo dela, com 0,25s de
   saída (o tempo vem do `roundMs` do próprio placar, não de estado solto).
3. **Rodada abaixo de 2s (o ⚡4×) fica SÓ com o ambiente** — gol nenhum cabe ali.
4. **Ducking**: o ambiente cai pra 35% durante o gol e volta em 1,2s.

📏 **Medido nos arquivos dele** (não estimado): ambiente pica em 9,8%, gol em 32,5%,
os dois somados no gol dão 35,9% com ducking e 42,3% sem. **Nenhum estoura** — o
número de 107% que eu tinha anotado antes era de outra montagem, sem o master de
0.32. Então o ducking aqui é decisão de SOM (fazer o gol saltar), não conserto de
estouro. ⚠️ Corrigido também no comentário do código, que repetia o 107%.

✅ **Conferido de ponta a ponta no navegador**, não só no papel: o módulo real roda,
os dois arquivos baixam (200) e decodificam, apito + ambiente + dois gols
sobrepostos + um gol de ⚡4× (ignorado) + saída da tela, tudo sem erro.

🎚️ Se ele achar o ambiente baixo ou alto: `AMBIENTE_VOL` em `sound.ts`, uma linha.
## 19/09/2026 (parte 4) — 🪑 O banco do leilão parou de mentir · 🌱 o cria sai na hora · 🏢 a SAF parou de comer vaga

Tudo isto nasceu de UMA pergunta do Diego: *"todo time que tem formação com 4-2-3-1,
4-5-1 etc, sempre tão ficando preso o atacante e o usuário não consegue mais pôr pra
4-3-3, porque preenche o campo de titular e reserva"*. Depois ele fechou o caso:
*"é se não tiver ninguém da SAF e apenas 2 atacantes, um titular e um reserva. Mas
quero ir pro leilão pegar novo atacante, não deixa porque o campinho do titular tá
ocupado e o campinho do reserva tá ocupado"*. E, quando eu respondi olhando a aba
Elenco, ele corrigiu: **"o campinho que eu tava falando era o do leilão, quando vai
pro leilão aparecem dois campinhos"**.

Antes de mexer em qualquer coisa eu MEDI, com as funções do jogo
(`scripts/mede-vaga-atacante.mts` — roda com `npx tsx`). O que os números disseram:

| situação (4-2-3-1, ATACANTE) | tem | alvo do pregão | teto do elenco | vaga pra comprar |
|---|---|---|---|---|
| fora do leilão de reservas, 2 atacantes | 2 | 1 | 3 | **0** |
| dentro do leilão de reservas, 2 atacantes | 2 | 2 | 3 | **1** |
| dentro, com 1 atacante EMPRESTADO da SAF | 3 | 2 | 3 | **0** |

Ou seja: **a vaga existia** (o elenco de 27 separa 3 atacantes no 4-2-3-1) — quem
mentia era o DESENHO.

### 🪑 1. O campinho do BANCO mostrava a formação, não o banco
`Campinho` (`screens.tsx`) desenhava, no modo `bench`, exatamente `slots` lugares —
um espelho do time titular. Dois estragos de uma vez:
1. **parecia cheio quando não estava** (o caso do Diego: 1 lugar de ATA, ocupado);
2. **quem passasse de `2× a formação` na posição SUMIA** — ficava no elenco, dava
   lance, jogava, e não aparecia em campinho nenhum. Já acontecia desde o elenco de
   27 (o +1 por posição, 16/09) e com o emprestado da SAF.

Agora: `max(slots, slotsCheio - slots, have.length - slots)`. A vaga livre aparece
como **lugar VAZIO** (que é a verdade) e ninguém mais fica invisível. O campinho dos
**Titulares não mudou** — lá o número de lugares é regra de jogo.

### 🌱 2. O cria da base não saía na compra — e o jogo PROMETIA que saía
A tela do Sub-20 diz, com todas as letras: *"ele some sozinho assim que você comprar
um reforço de verdade pra vaga"* (`pyramidseason.tsx:5060`), e o botão repete
*"volta pra base sozinho quando chegar reforço"*. **Não era verdade**: o único lugar
que tirava o cria era a virada (`OPEN_RESERVE_LIST`). No meio do ano ele ficava — e
atrapalhava, porque o cria conta vaga igual a qualquer um (`filled`), é invendável e
não entra em "deixar ir": o técnico não tinha NENHUM jeito de se livrar dele.

Agora a conta virou um ajudante só, `voltaCriaSeSobrou(s, m, pos)`, com a MESMA régua
da virada (só sai se a posição continuar fechando a formação sem ele), chamado em:
leilão (`resolve`), desempate (`tiebreak`) e monte/mercado. A varredura da virada
continua, como rede de segurança (pega o que fechou por outro caminho — troca de
formação, volta de empréstimo, contrato renovado).

⚠️ Não quebra escalação: `lineupAt` já trata "um titular saiu" completando SÓ aquela
vaga com o melhor do banco na posição. E o cria só sai quando existe jogador real
naquela posição pra assumir.

### 🔓 3. `careerOpenSlots` cortava o humano no alvo do pregão
`Math.min(slotsOf, openSlots + cpuFakes)` existe por causa do BOT (o zé dele não
segura vaga). Só que pegava o humano junto e comia o +1 por posição do elenco de 27
no monte da carreira. O humano não tem fake pra descontar, então pra ele a trava só
tirava vaga que era dele. Agora `if (m.isHuman) return openSlots(m, pos)`.
Fora do leilão de reservas nada muda — lá `openSlots` já mira o time titular.

### 🧪 Bancadas novas (pra próxima sessão não refazer na mão)
- `scripts/teste-campinho-leilao/` — monta os DOIS campinhos do leilão de verdade
  (`?form=4-2-3-1&ata=3`). O `Campinho` virou `export` só por causa disto.
- `scripts/mockup-banco-leilao.mjs` — gera o antes/depois lado a lado (`--antes`,
  `--ata`, `--so-tira`).
- `scripts/teste-elenco/` ganhou `?form=` e `?ata=`; antes era 4-4-2 escrito na mão
  e mentia em qualquer outra formação.
- `scripts/mockup-terceiro-atacante.mjs` — o desenho que mostra onde o 3º atacante
  aparece na aba Elenco (campinho = 11; reserva = LISTA).
- `scripts/mede-vaga-atacante.mts` — a medição acima.

### 🏢 4. O emprestado da SAF gastava vaga do elenco — CONSERTADO no mesmo dia
Eu tinha deixado isto como "fica pra depois", e o Diego fechou a questão na hora:
*"uma coisa que te digo é que o elenco é de 27 jogadores + a SAF, que pode ser de
um ou até 4 emprestados conforme regras"*. Com a regra dita assim, não tem dúvida
nenhuma pra resolver — era só conta errada.

`filled()` olhava o `squad` inteiro, então **cada jogador pego emprestado comia uma
das 27 vagas que são dele**. Medido: no 4-2-3-1 com 2 atacantes **+ 1 atacante
emprestado**, a vaga de atacante caía de 1 pra **ZERO**. Na prática: *pegar reforço
na SAF te impedia de comprar reforço*.

Agora `filled()` ignora quem está `emprestado`. São só 3 chamadas dela, todas conta
de vaga (`openSlots`, `vagaCheio` e a poda de zé do bot — e bot não pega
emprestado), então o alcance é exatamente esse.

⚠️ **O que continua contando o emprestado, de propósito: `xiHoles`.** São duas
perguntas diferentes e elas têm que responder diferente:
- *"cabe mais um no meu elenco?"* → o emprestado **não** conta (ele é o +1 da SAF);
- *"falta gente em campo?"* → o emprestado **conta**, porque ele JOGA e tapa buraco
  de escalação.

⏳ **Sobrou um pedaço menor, anotado**: o jogador SEU que está emprestado NA SAF
(`loanOut`) sai do `squad`, então ele libera vaga enquanto está fora — se você
comprasse um substituto, na volta dele o elenco passaria de 27. **Já era assim
antes** (não é regressão) e quase não acontece, porque o empréstimo volta na virada
e a compra vem depois. A conta certa já existe pronta em `ownedRealCount` (ela soma
o `loanOut`), se um dia morder.

### ↩️ Como reverter
Os quatro consertos são pequenos e independentes: o do banco é uma linha em
`Campinho`, o do cria é o `voltaCriaSeSobrou` + 3 chamadas, o do teto é um `if`, e
o da SAF é um `&& !c.emprestado` no `filled`. Cada um volta atrás num commit
sozinho.

## 19/09/2026 (parte 3) — 🟢⚪ Dirceu Krüger entra no baralho + o coração do White Thigs

### ❤️ White Thigs do GuGu é CORITIBA
Ordem do Diego. Este é o **1º batismo da história** e **não tem dono nem e-mail
conhecido** — logo não existe linha em `esc_socios` pra guardar o coração. Ficou
anotado no `batismos.ts`, junto do clube. No dia em que o dono aparecer, o coração
vai pro banco junto com o nº de fundador.

### 🃏 A carta do Dirceu Krüger
Pedido dele na mesma mensagem: *"pesquise qual auge, o ano dele, e nível e
categoria se enquadraria"*. **Nada aqui foi chutado** — a regra dele de 18/08 vale
justamente pra isso.

**O que a pesquisa deu** (ESPN, Gazeta do Povo, Gazeta Esportiva, Câmara de
Curitiba):
- Coritiba **1966–1976**: **252 jogos, 58 gols**
- **7 títulos paranaenses**: 1968, 1969 e o **penta de 1971 a 1975**
- Apelido **"Flecha Loira"**
- **1999**: eleito numa enquete da imprensa esportiva o **melhor jogador da
  história do Coritiba** (53,3%) e escalado no **MEIO** do time de todos os tempos
- **Estátua** em tamanho real na frente do Couto Pereira (2016)
- Em 1970 quase morreu em campo; a dor no local da cirurgia o **aposentou aos 30**,
  em 1975. Depois virou o técnico com mais jogos pelo clube (185)

**A carta que saiu:**
`Dirceu Krüger · Coritiba · 1973 · MEI · fame 3 · 70-86`

**Por que cada número** (e o que é decisão, não fato):
- **MEI** — é FATO: foi escalado no meio no time de todos os tempos do clube.
- **fame 3 (BOM JOGADOR)** — calibrado pelos VIZINHOS, não pelo olho. O perfil
  "ídolo máximo de clube grande de estado, recordista e multicampeão, **sem
  Seleção**" já existe no baralho: **Pedro Basílio** (Fortaleza, 1973) é fame 3. O
  **Givanildo Oliveira** (Santa Cruz, 1976) é fame 4 *porque foi convocado* —
  Krüger não foi. Faixa 70-86, larga como as outras cartas de ídolo de clube.
- **1973** — ⚠️ **isto é CURADORIA, e o Diego sabe**: as fontes dão um CICLO de
  títulos, não um "melhor ano" isolado. 1973 é o meio do penta, ele com 28 anos,
  depois de se recuperar do lance de 70 e antes da dor que o aposentou. **Trocar o
  ano é uma linha** se ele preferir outro.

Rodados junto, como manda a regra: `npm run novidades` (1 entrou) e
`npm run paises` (nenhuma carta sem seleção, nenhum nome repetido). Commitados os
três: `data.ts`, a foto do catálogo e o arquivo gerado.

## 19/09/2026 (parte 2) — 🔎 VARREDURA DOS BATISMOS: código + banco, clube por clube

O Diego pediu: *"me fale quais de batismos q faltam"*. Com o acesso ao Supabase
liberado, deu pra conferir as DUAS metades pela primeira vez — o código
(`npm run batismos` + `npm run salao`) **e o banco**, que nenhuma trava enxerga
porque os guardas rodam offline.

❤️ Antes disso: **Pesadelo Verde FC é PALMEIRAS** (ordem dele). Gravado em
`esc_socios.time_coracao` de `portaltech.ep@gmail.com`.

### ~~🔴 Buraco de verdade — 1 clube~~ ✅ FECHADO em 19/09
- ~~**Marreco FC** (lucasigorbortoliniii) — é o único batismo sem **escudo próprio**,
  sem **mascote que carimba o gol**, sem **manto** (nem no código nem no banco) e
  sem **camisa na Loja**.~~ O dono mandou a prancha em 19/09 e as quatro coisas
  entraram de uma vez (escudo 241×360 · mascote 321×440 · manto `#04512A`/`#E4CDA6`
  · camisa `marreco-camisa-v1.webp`). **Publicado na main em 19/09.**
  🗄️ **Falta só o BANCO**: `esc_socios` dele (`manto_c1`/`manto_c2`/`mascote_key`/
  `escudo_time`) ainda não foi gravado, e o banco GANHA do código no manto — sem
  isso ele continua vendo a cor velha.

### 🟠 A linha OFICIAL do ouro não existe — 3 clubes
`user_colors` é a fonte oficial do tier, e **não tem linha nenhuma** pra:
**Crias do Bigão** · **Coringas do Diniz** · **Nata de SP**.
Hoje os três **veem dourado assim mesmo**, porque o `apoio.tsx` é a reserva e o
Modo Manual também sai do tier. Ou seja: não há prejuízo na tela HOJE — mas no dia
em que alguém limpar a reserva do código, os três perdem tudo de uma vez.

### 🟡 Nome reservado pela METADE — 4 clubes
A regra das 4 formas depende do gatilho, e o gatilho só dispara quando entra o
**nome PURO**. Nestes quatro entrou direto a forma com sufixo, então o gatilho
nunca rodou e **o nome puro está LIVRE pra qualquer um pegar**:
| clube | reservado | livre |
|---|---|---|
| Skyy FC | `skyy fc` | `skyy`, `skyy ec` |
| Marreco FC | `marreco fc` | `marreco`, `marreco ec` |
| Futpoint FC | `futpoint fc` | `futpoint`, `futpoint ec` |
| Marinheiros AS | `marinheiros as` | `marinheiros`, `marinheiros fc/ec` |
Conserto: inserir o nome puro em `esc_nomes_batismo` que o gatilho completa sozinho.
(Os outros 49 estão com as 3+ formas certas.)

### 🎽 Camisa na Loja do Clube — 6 sem arte (era 7; o Marreco saiu em 19/09)
Deportivo Montreal · SC Ferrari · Coringas do Diniz · Nata de SP · Sapekeiros FC ·
Eros FC. **Não é defeito**: é lista de a-quem-pedir. Todos os 7 já
aparecem com a cor certa na foto do campeão (o manto deles vem do painel).

### ❤️ TIME DE CORAÇÃO — e a conta que eu tinha errado
⚠️ **CORREÇÃO do relatório de mais cedo.** Eu disse "13 sem time de coração"
olhando SÓ o `esc_socios.time_coracao`. Errado: o ranking do Salão (aba TORCIDAS,
RPC `esc_salao_torcidas`) tem **TRÊS fontes**, e eu só tinha olhado a primeira:
1. `esc_socios.time_coracao` — o que a gente preenche na mão;
2. **`auth.users.raw_user_meta_data->>'time_coracao'`** — o time que a pessoa
   escolheu **no próprio cadastro**. É por isso que Fridão e Sistematizados já
   apareciam no ranking sem eu ter gravado nada;
3. **`esc_torcida_sem_dono`** — tabela pra clube SEM dono (era só o Vasco da Grana).

O Diego soltou 6 em 19/09, todos gravados no banco e anotados no código:
Pesadelo Verde → **Palmeiras** · Bagres 1993 → **São Paulo** · Leite de Verdade →
**Grêmio** · Seven City → **Corinthians** · Milhaça → **São Paulo** · Skyy FC →
**Vasco da Gama**.

🥇 E o **White Thigs do GuGu → Coritiba** entrou em `esc_torcida_sem_dono`, que é
o lugar certo pra clube sem dono. **Seguro**: a aba TORCIDAS mostra só o time e a
%, nunca o nome do clube (o `clubes[]` da RPC nem é lido na tela) — então o clube
continua oculto no Salão, como o Diego pediu em 13/09.

**Estado de hoje: 49 dos 55 no ranking.** Faltam **6**:
Marreco FC · Jurubeba FC (hoje Meia na Canela) · Stocco FC ·
Corporação Capsule FC · Eros FC · Crias do Bigão.
(19/09, mais tarde: **Bonança SSFC torce pro São Paulo** — `update esc_socios set
time_coracao='São Paulo'`, anotado também no `manto.ts` e no `batismos.ts`.)

📌 O ranking **não precisa de deploy**: a tela lê a RPC ao vivo. Gravou no banco,
aparece no próximo F5.

### ✅ O que está inteiro
**43 dos 53** completos no código. No banco, todos os 53 têm `esc_socios` com
sócio, manto, mascote e escudo apontados, e `valido_ate` de batismo eterno.
Fundador bate com o código em todos (os dois sem número são **sócios**, que por
regra não têm mesmo: Futpoint FC e o assinante `delaofut`).

### ✅ Dois dos três consertos, feitos no mesmo dia (ele mandou: *"2 ok"* · *"3 são
todos times de batismo igual aos outros"*)
- 🟠 **Ouro oficial criado** pros três: `user_colors` (tier ouro + manual) pra
  **Crias do Bigão**, **Coringas do Diniz** e **Nata de SP**. Conferido depois:
  **zero** batismo sem a linha oficial. Não mudou nada na tela deles (já viam
  dourado pela reserva do código) — o que mudou é que agora a fonte oficial
  concorda com o código, e é a única perna que funciona sem deploy.
- 🟡 **Os 4 nomes puros foram trancados**: entrou `skyy`, `marreco`, `futpoint` e
  `marinheiros` em `esc_nomes_batismo`, e **o gatilho completou o FC e o EC
  sozinho**, como manda a regra das 4 formas. Antes dava pra qualquer um criar um
  time chamado "Skyy" — agora não dá. (Marinheiros ficou com as 4 + o `as`.)
  📌 **A lição**: o gatilho só dispara com o **nome PURO**. Quem cadastrar direto a
  forma com sufixo deixa o nome puro livre e não percebe, porque nenhuma trava
  olha o banco. Vale conferir isso a cada batismo novo.

### 🏛️ E o Salão ficou SEM NINGUÉM oculto (19/09)
Ordem dele: *"pode tirar ele de ser oculto, pode mostrar já. Marreco também"*.
`SALAO_OCULTOS` foi esvaziado — **Marreco FC** e **White Thigs do GuGu** entraram
na lista de clubes.
O que aparece, conferido na bancada nova `scripts/teste-salao/`:
- **ESCUDO**: os dois TÊM escudo — não é o de letra, é o automático de cor + bicho
  (o do Marreco é um peixe amarelo em roxo). Fica bonito, não parece buraco.
- **MASCOTE e MANTO**: as folhas abrem com o aviso *"Este clube ainda não tem arte
  de mascote disponível no salão"* / *"A arte da camisa… não está disponível"*. A
  tela já tinha esse texto pronto; não quebra nada.
🔒 A lista `SALAO_OCULTOS` **ficou no código, vazia** — é a porta pra esconder um
clube de novo sem mexer em mais nada.

### Pendências que saem daqui
- 🔴 **Marreco FC**: segue sem mascote, sem manto e sem camisa (o escudo é o
  automático). Pedir arte ao dono — agora ele está VISÍVEL no Salão, então a falta
  aparece pra todo mundo.
- 🦁 Confirmar com o Luiz o nome da mascote do Remoçada ("O Leão de Thor" é chute).
- 📅 O ano do **Dirceu Krüger** (1973) ficou aprovado por ele: *"1- ok segue"*.

## 19/09/2026 — 🧾 A ficha do jogador: "esta temporada" × "no seu clube"

Pedido do Diego, com o print da barra preta: *"eu quero que tenha gols na temporada,
gols totais… e também jogos totais, e assistência na temporada e assistências
totais… poderia ter um espaço embaixo"*. Mandei três mockups; ele escolheu a
**letra C** (duas colunas).

### 🔑 O que a pergunta dele esclareceu
Depois do 1º mockup ele perguntou: *"são dados dele no clube que ele tá atual né?
Não são jogos totais contando outros clubes"*. Fui conferir e **ele está certo**:
`guardaCansaco` tem `if (!m.isHuman) continue` — **só o elenco do usuário é
anotado**, bot nunca acumula. Então jogo feito em outro clube não entra em lugar
nenhum. Por isso o rótulo virou **"NO SEU CLUBE"**, nunca "carreira" (isso virou
regra no `CLAUDE.md`).
Detalhe de propósito: vender e recomprar a mesma carta **devolve o número inteiro**.

### O que estava errado antes
Os três números ficavam lado a lado falando de tempos diferentes, sem avisar:
**JOGOS** já vinha somado de todas as temporadas (o 304 do Gilmar), **GOLS** e
**ASS** eram só da temporada. Dá pra ler tudo errado.

### O que foi feito
- **Motor**: `condicaoCarry` passou a carregar `gl` (gols) e `as` (assistências)
  junto do `g`/`j` que já levava. Os números da temporada vão na ação da virada
  (`golsCard`/`assCard`), porque quem os calcula é a tela, não o reducer.
- **Tela**: a ficha virou duas colunas — `ESTA TEMPORADA` (cinza) e `NO SEU CLUBE`
  (dourada), com jogos/gols/assistências nas duas. **Gás, valor e salário** desceram
  pra faixa própria, porque não são de temporada nem de total: são de AGORA.
- O "nesta temporada" sai por **subtração** (`jogos` já vem somado menos o `antes`),
  então não existe segunda contagem pra desencontrar da primeira.

### Onde NÃO mudou nada
Sem condição física (Várzea, Série D, carreira antiga sem Agência) não existe
contagem de jogos — lá fica a faixa única de sempre, sem coluna vazia inventada.

### ⚠️ O que o Diego já sabe e aceitou
Carreira que já está rolando **começa o total de gols e assistências do ZERO** — o
passado nunca foi gravado, não dá pra recuperar. Os **jogos** continuam certos.
- ⏳ **Pendente**: ele não respondeu se quer o aviso **"desde agora"** escrito na
  tela na 1ª temporada. Não pus, porque é texto novo e ele decide o visual.

### ✅ Fechado no mesmo dia: a COPA SOMA, e sem aviso
Perguntei as duas coisas que tinham ficado; resposta dele: *"deve somar sim. E não
precisa de aviso não"*.
- 🧮 **Gol e assistência de COPA agora contam** na temporada do jogador. Não dava
  pra usar a lista `scorers` da Copa: ela é cortada no **top 20 da competição**, e
  quem fez 1 gol de copa simplesmente não aparecia. Então `CopaResult` e
  `CopaBrasilResult` ganharam `goalsByCard`/`assistsByCard` — a conta COMPLETA por
  carta —, e a tela soma liga + copa num mapa só (`golsTemporada`/`assTemporada`).
  Os QUATRO lugares passaram a usar o mesmo número: a ficha, a coluna ⚽/🅰️ do
  elenco, a imagem de compartilhar e o acumulado que atravessa a virada.
  ⚠️ **O `goalsByCard` CRU ficou intocado de propósito**: é ele que alimenta a
  ARTILHARIA e o prêmio do artilheiro, que são do CAMPEONATO. Misturar copa lá
  mudaria quem leva o prêmio, e isso ninguém pediu.
- 🔕 **Sem aviso "desde agora"** na tela — ele dispensou.

### Pendências
- **Dá pra voltar atrás?** Dá: reverter o commit. O `gl`/`as` do save são campos
  opcionais — save novo aberto em versão velha simplesmente ignora os dois.

## 18/09/2026 (parte 10) — 🏟️ ETAPA 3 FECHADA: o batismo aparece pra TODA a sala ✅ NO AR

Diego, depois do conserto da mascote do Leite de Verdade: *"ué, pra mim já era assim
normalmente… o mascote, seja no modo carreira ou online, ele deve aparecer nos times de
batismo pra todo mundo"*.

**Ele estava meio certo — e a diferença importa.** Pra clube batizado jogando com o NOME
DO BATISMO, sempre foi assim: a lista fixa (`CARIMBO_GOL`/`LOGOS_PRONTAS`) é pública, todo
mundo enxerga, na carreira e no online. O furo era só quando o DONO joga com **outro
nome** — o normal no online, onde o nome do clube é digitado. Aí a arte vinha pelo E-MAIL
(regra de 08/09) e e-mail só decora a tela do próprio dono.
👉 Era exatamente a **"Etapa 3"** anotada em 08/09. **Fica fechada aqui.**

### O caminho já existia
Desde 10/08 o MANTO de cada assento viaja pra sala inteira por `esc_mantos_sala`
(assento → conta → `esc_socios`, devolvendo SÓ assento → cores; o e-mail nunca sai do
servidor). Agora a MASCOTE e o ESCUDO usam a mesma porta.
- **Banco**: `esc_mimos_sala`, **irmã** da antiga e não substituta — a `esc_mantos_sala`
  fica intocada, pra nenhum navegador aberto quebrar no meio de um jogo.
- **Código**: o registro mora no **provider** (`store.tsx`), não numa tela — o carimbo do
  gol é desenhado em vários lugares, e assim sala rápida, liga e carreira online passam a
  enxergar de uma vez.

### ⚖️ A ordem da busca É a segurança (não mexer sem entender)
1. **lista FIXA** (clube batizado pelo nome) — ganha de tudo, então ninguém rouba arte
   alheia digitando o nome do clube dos outros;
2. o que o **servidor** disse sobre os assentos DESTA sala;
3. o **meu próprio** batismo (vale offline, onde sala não existe).
E ao sair da sala a lista é **zerada**: mimo de sala sobrando viraria arte de outra pessoa
num bot do jogo solo seguinte.
🧪 `npm run mimos` seções 5–8 guardam isso, incluindo a tentativa de roubo de arte.

### 🚫 Sem linha de novidade — de propósito
Anunciar "agora aparece pra todo mundo" é dizer "antes não aparecia". Regra da casa:
**bug nunca vira novidade**.

---

## 18/09/2026 (parte 9) — 🎁📝🤖 Três pedidos dele numa tacada ✅ NO AR

### 🐮 A mascote de gol do dono sumia no ONLINE — e não era cadastro
*"O usuário do Leite de Verdade, que tem batismo, disse que quando ele joga online o
gol do mascote dele não tá aparecendo"*.
**Causa (medida no banco, não chutada):** no online o nome do clube é o que a pessoa
DIGITA, e o jogo cola o selo do apoiador. No banco o clube dele está como
**"Loopesmiranda FC 👑🖋️"**, não "Leite de Verdade FC" — então `CARIMBO_GOL` não acha, e
quem deveria salvar é a regra de 08/09 (mimo segue o E-MAIL). Só que as duas pontas
usavam chaves diferentes:
- REGISTRO ("qual é o meu clube") → `loopesmiranda fc 👑🖋️`
- BUSCA (a tela, com `nomeLimpo`) → `loopesmiranda`

A tela limpava o selo; o registro guardava com ele. E o emoji no fim ainda impedia o
corte do "FC", dobrando o estrago. **Conserto num lugar só**: `chaveEscudo` (mimos.ts)
tira selo, "(você)" e acento ANTES de cortar FC/EC/SC — como é a chave dos DOIS lados,
acerta registro e busca juntos, e vale pro escudo e pro manto pelo mesmo caminho.
A linha dele em `esc_socios` estava completa (sócio 45, escudo_time, mascote_key).
🧪 Trava nova: **`npm run mimos`**. Cobre o caso real, a limpeza do que é enfeite, e —
o que mais importa — que **mimo meu nunca vai pro clube de outro humano nem de bot**.

### ⚠️ PENDÊNCIA QUE FICA: os OUTROS ainda veem pelo nome
Isto conserta a tela **do dono**. Os outros jogadores da sala continuam desenhando o
clube dele pelo NOME — é a "Etapa 3" aberta desde 08/09. Pra a sala inteira ver a
Mimosa no gol dele, ou o nome que ele usa online entra em `CARIMBO_GOL`, ou o mimo
passa a viajar pelo e-mail na sala. **O Diego foi avisado e não decidiu ainda.**

### 📝 O contrato da comissão passou a VARIAR
*"Sobre contratos: mesmo tempo, igual faz pro jogador"* e, sobre o sorteio curto que
ofereci, *"opção A, mas quero mais tempos, acho que falta um de dez, sei lá"*.
O prazo agora é **sorteado na assinatura: 3 · 5 · 10** — a MESMA escada do jogador
(`renewOptions` já oferece 1/2/3/5/10). Pesos 30/45/25 → média **5,65**, de propósito:
item PAGO não pode virar aposta ruim, então ninguém fica pior que os 5 fixos de antes.
O número sorteado **aparece no log da assinatura** — a tela nunca promete 5 e entrega 3.
⚠️ O teto da cura e o da tela subiram de 5 pra `CONTRATO_MAX` (10) junto — senão o
conserto de hoje de manhã cortaria contrato legítimo.

### 🤖🌱 O automático avisa quando fica sem reserva
*"Os três meio-campos cansaram, o automático ligado e não tem reserva. Tem que aparecer
uma pergunta: você quer que suba um jogador da base? Aí ele responde sim e cai na área
da base"*. Feito — **só com o automático ligado**, por ordem dele (quem troca na mão
segue com o aviso curto). Faz sentido: com o automático ligado o botão verde de
RODIZIAR nem aparece, então nada na tela dizia que ele tinha travado.
A caixa diz **qual posição** está faltando, e o "AGORA NÃO" guarda a situação recusada
(volta sozinho quando muda quem está cansado). **Nada sobe sozinho.**

---

## 18/09/2026 (parte 8b) — 🏛️🌱 As pílulas do Elenco viram DESTINO ✅ NO AR

Ele pegou AO VIVO: *"hoje quando apertava nessas pílulas tava jogando pro final da tela
sem nada"*. Culpa da entrega de 18/09 de manhã: eu limpei o meio da tela e deixei as
caixas no PÉ da página, com as pílulas só ROLANDO até lá — com elenco de 27 a lista
ficou comprida e o rolar terminava no rodapé.
1. **A pílula de SAF saiu** (*"já tem embaixo SAF"* — a ABA continua).
2. **Base** abre a área da Base no lugar da lista.
3. **Comissão** abre o Departamento Técnico ali mesmo — e por isso ele saiu do pé.
Detalhe da causa: a área só existe DEPOIS do React desenhar, então rolar no mesmo
instante do clique não achava nada. Agora rola no `requestAnimationFrame`.

---

## 18/09/2026 (parte 11) — 🗄️ O banco ganha do código: o manto errado do Manfré e mais 9 clubes no jornal

O Diego liberou o Supabase pra eu fechar a perna do banco do Remoçada. Fechei — e
a varredura que fiz de carona achou duas coisas.

### 1. 🔴 O Manfré FC estava com o manto errado há 19 dias
`meuManto()` lê `esc_socios` PRIMEIRO e só cai no `MANTO_CONTAS` se o banco não
tiver nada. Ou seja: **remedir a cor e mexer só no código não muda nada pro dono**.

Foi exatamente o que aconteceu. A cor do Manfré foi medida na 2ª camisa que o dono
mandou (30/08), o código virou `#EC121C/#0135A3` — e o banco continuou com
`#0E3E86/#C2452F`. O Daniel passou 19 dias vendo o manto velho, e **nenhuma trava
pegava**, porque `checa-batismos.mjs` roda offline.
✅ Corrigido no banco. E a lição virou regra no `CLAUDE.md`: **remediu manto, roda
o `update esc_socios` junto.**

Varri os 52 clubes com manto no banco contra o código: **era o único em desacordo**.

### 2. 🎽 9 clubes ficariam de fora da foto do campeão
A peça de hoje à noite lê a cor de `batismos.ts`, que eu tinha preenchido a partir
do `MANTO_CONTAS` — e o `MANTO_CONTAS` só tem quem **mandou camisa**. Clube cujo
manto o Diego escolheu no painel mora só em `esc_socios`, então ficou sem cor no
código e a foto ia sair genérica pra ele.

Entraram agora, com a cor que já está valendo no jogo: **Coringas do Diniz ·
Crias do Bigão · Deportivo Montreal · Eros FC · Futpoint FC · Leão da Estradinha ·
Nata de SP · Sapekeiros FC · Skyy FC**. Conferi os quatro primeiros na bancada: o
Nata sai amarelo e preto, o Bigão azul e amarelo, o Montreal preto e branco, o
Manfré vermelho e azul (já com a cor corrigida).

Isso segue a regra que ele deu — *"quando for genérico, mantém genérico"* vale pra
clube de CPU, não pra batismo que tem manto.

O guarda foi ajustado pra entender a diferença: **cor só em `batismos.ts` é
normal** (manto do painel); **cor só em `MANTO_CONTAS` é furo** (a foto sairia
genérica pra quem tem camisa).

### Remoçada: as outras pernas conferidas
Fundador ✅ · tier ouro ✅ · nomes reservados (`remoçada`, `remoçada fc`,
`remoçada ec`) ✅ · `esc_socios` com manto novo, `mascote_key = leao_thor` e
`escudo_time = Remoçada` ✅.

- **Dá pra voltar atrás?** Nas duas coisas. No banco é um `update` de volta
  (`#0E3E86/#C2452F` no Manfré, `#12256B/#FFFFFF` no Remoçada); no código é
  reverter o commit.
## 18/09/2026 (parte 10) — 🦁⚡ Remoçada de cara nova: a arte do dono entrou

O Diego mandou a prancha do clube (escudo + mascote + camisa, em tela verde) com
*"Remoçada eu fiz já ué"* — respondendo à lista dos 8 clubes que eu tinha dado
como "sem camisa". Ele tinha razão: a arte existia, só não estava no jogo.

O Remoçada era um dos **poucos que ainda tinham escudo e mascote em SVG desenhado
à mão** (de 08/08, antes da regra de peso). Agora os dois são `.webp` fora do
bundle, como manda a regra.

| peça | antes | agora | peso |
|---|---|---|---|
| 🛡️ escudo | SVG à mão no `.tsx` | `remocada-escudo.webp` 291×360 | 27,5 KB (teto 30) |
| 🦁 mascote | SVG à mão no `.tsx` | `remocada-mascote.webp` 280×440 | 43,1 KB (teto 45) |
| 🎽 camisa | não existia | Loja + acervo do post | 42,5 KB (fora do bundle) |

**Total do batismo: 70,6 KB** — dentro do teto de 75 KB.

### 🎨 O manto, medido (não chutado)
`['#072246', '#F8F8F8']` — azul-marinho e branco. O azul é **86% da camisa** e o
branco **4%** (gola, punhos e as duas listras da manga).
⚠️ A mediana crua dava `#031936`, quase preto, porque a arte tem sombreado pesado
e um leão estampado escuro no peito. A leitura boa veio do **pano dos ombros**,
longe da sombra — mesmo cuidado que o La Bestia Negra exigiu hoje de manhã.
❤️ Clube do Remo (o Leão Azul do norte, e daí o "impondo respeito no norte do
Brasil" da faixa do escudo). **Sem 3ª cor**: o vermelho é da CAPA da mascote, não
da camisa.

### Onde foi cadastrado
`escudos.tsx` (4 formas do nome) · `mascotes.tsx` (`leao_thor` — **a chave não
mudou**, é a que está no banco; entraram as 4 formas + o nome velho Olimpo FC, e
o `MASCOTE_NOME`) · `manto.ts` · `batismos.ts` (campo `manto`) ·
`salao-camisas.ts` + `public/mantos-salao/remocada-camisa-v1.webp` ·
`scripts/kits/remocada-camisa.webp` (a do post).

Com isso ele já entra de graça na foto do campeão de O MARTELO (a peça de hoje à
noite) — azul e branco, sem mais nenhum passo.

### ⛔ A PERNA DO BANCO AINDA FALTA — e ela GANHA do código
`meuManto()` lê `esc_socios` PRIMEIRO e só cai no `MANTO_CONTAS` se o banco não
tiver nada. Se a linha do `luiz.maia.luiz@gmail.com` tiver manto antigo gravado,
**ele vai continuar vendo o manto velho na própria tela** mesmo com o deploy
verde. Falta rodar (não consegui: o MCP do Supabase pediu aprovação):
```sql
update esc_socios set manto_c1 = '#072246', manto_c2 = '#F8F8F8',
       mascote_key = 'leao_thor', escudo_time = 'Remoçada'
 where email = 'luiz.maia.luiz@gmail.com';
```
É o mesmo erro do Al Takhadao (01/09): código pronto ≠ jogador atendido.

- 🦁 **Nome da mascote ("O Leão de Thor") é PROVISÓRIO** — a arte veio sem nome.
  Confirmar com o dono, igual às outras da lista.
- **Dá pra voltar atrás?** Dá: os SVGs antigos estão no histórico do git; é
  reverter o commit. Nada do jogo depende da arte nova.
## 18/09/2026 (parte 9) — 📰 A foto do campeão em O MARTELO sai com o manto do clube

Pergunta do Diego, com o print do jornal na mão: *"teria como, principalmente
quando for algum time de batismo, aparecer a camisa do time de batismo no lugar
desses jogadores? Ou seria muito trabalho? Ou você quer fazer uma arte nova… ou
mantém a mesma arte que já tem da foto, mas só botando a camisa?"*

**Escolhido (e aprovado por ele): manter a arte e repintar o uniforme.** Foi
mockup antes, commit depois — ele viu as cinco variações e respondeu *"Ok pode
fazer"*.

### Por que não foi arte nova por clube
~60 KB vezes 53 clubes, e o alvo dele é **10 mil batismos**. Morre na regra de
peso (a mesma que mandou escudo e mascote virarem `.webp` fora do bundle). Aqui é
**UM arquivinho de máscara por foto** — `jornal-liga-manto-v1.webp` (2,6 KB) e
`jornal-copa-manto-v1.webp` (3,7 KB) — que serve pra **todos os clubes**,
inclusive os que ainda não mandaram camisa e os batismos que nem existem ainda.
**Zero KB por clube.**

### Como funciona
1. A máscara marca, pixel a pixel, o que é listra CLARA e o que é listra ESCURA.
   Gerada por `python3 scripts/mascara-jornal.py` (roda uma vez; se a arte do
   jornal trocar, roda de novo).
2. `src/escalacao/jornal-manto.tsx` desenha a foto num canvas e troca as duas
   cores **mantendo o brilho original** — por isso dobra de pano, sombra e vinco
   continuam lá; muda só a cor.
3. As 2 cores saem de `batismos.ts` (campo `manto`), pelo **NOME do clube**.

### 🔑 A parte que não é óbvia: por que o manto agora vive em dois lugares
`MANTO_CONTAS` (manto.ts) é chaveado por **e-mail** — e e-mail só serve pra
decorar a tela do PRÓPRIO dono. A foto do campeão é diferente: quem lê o jornal
pode ser qualquer um, e o campeão é achado pelo **nome do clube**. Então a cor
(que já é pública — está à vista na Loja do Clube) desce em `batismos.ts`, e o
**e-mail continua fora** desse arquivo, como sempre foi.
🔒 `npm run batismos` compara as duas listas clube a clube e **reprova** se
discordarem — duas listas sem trava sempre acabam brigando.

### Onde aparece
Carreira (`jornal-career-visual`), online (`jornal-online-visual`) e as **duas
imagens de compartilhar** (o canvas de `jornal.tsx` e o `buildOnlineSalaBlob`) —
a capa que ele manda no grupo sai igual à tela. Vale pro campeão da liga **e**
pro dono da Copa.

### O que NÃO muda
- **Genérico continua genérico**, como ele pediu: clube de CPU e batismo sem
  camisa cadastrada ficam com a foto de sempre.
- **Não atrasa nada** (regra de ouro do leilão): a pintura roda uma vez por
  clube, na abertura do jornal — fim de temporada, hora de pausa — e fica
  guardada. A tela mostra a arte genérica no mesmo instante e troca quando a
  pintada fica pronta. Qualquer erro (canvas bloqueado, arte que não carregou) cai
  na genérica, sem buraco na tela.
- **Dá pra voltar atrás**: apagar os 2 arquivos de máscara e o
  `jornal-manto.tsx`, e devolver o `<img src={ligaArt}>` nos três lugares. Nada
  do jogo depende disso.

### 🧪 Bancada nova: `scripts/teste-jornal/` + `node scripts/print-jornal.mjs`
Monta `CareerNewspaperStories` DE VERDADE e mostra os três casos de uma vez:
batismo com camisa (pinta), batismo sem camisa (genérico) e clube de CPU
(genérico). Existe porque a pintura roda no NAVEGADOR — medir a máscara em
Python prova metade do caminho.

### Pendências que ficam
- 🎽 **A manga sobra**: em uns jogadores o ombro/manga continua na cor velha,
  porque ali o pano não tem listra clara ao lado pra ancorar. Não parece bug (lê
  como manga de outra cor), mas dá pra melhorar numa próxima rodada da máscara.
- A foto do **artilheiro** não tem camisa listrada (é a chuteira de ouro), então
  fica fora disso de propósito.

## 18/09/2026 (parte 8) — 📱 A TELA DA SALA ONLINE NO CELULAR ✅ NO AR

Fecha o pedido dele depois de aprovar o desktop: *"quero uma ideia melhor visual também
pra dispositivos móveis igual fez pro desktop. Consegue? **Sem diminuir a área dos gols e
tamanhos de mascote e etc**"*.

### 😅 Antes: seis versões de mockup e ele se perdeu
Fui mandando desenho atrás de desenho e ele parou tudo: *"mas não o giro da rodada, as
zoeiras e etc? Sei lá, tô confuso, não sei o que faço"*. **A culpa era do método**, não
dele: eu nunca mostrei a LISTA do que existe na tela, só recortes.
Parei de desenhar e fui conferir bloco por bloco no código (`scripts/mockup-celular-lista.mjs`).
Duas coisas caíram por terra ali:
- **Os OUTROS JOGOS já estavam certos.** `.ll27-ticker` já é `overflow-x:auto` com card de
  230px logo abaixo do placar. Eu tinha inventado um problema — e na v4 encolhi o card pra
  132px, que foi o *"não gostei de você diminuir o tamanho dos jogos"*.
- **A zoeira nunca esteve na fila.** `ChatWidget` é montado no `index.tsx`, nível de app,
  como balão flutuante. Não tinha o que decidir sobre ela.
Sobraram 3 decisões de 12 blocos. Ele respondeu: *"ok publique"*.

### O que foi ao ar (3 commits isolados, cada um revertível sozinho)
1. **🏆 A tabela sobe.** No celular ela era a ÚLTIMA da fila. A fila passa a seguir o
   relógio: placar → outros jogos ao vivo → próximo jogo + tática → **TABELA** → giro.
2. **⚖️ A tática vira pílula.** O padrão que ele aprovou no Elenco no mesmo dia
   (`🎽 4-4-2 ▾`). Medido: a caixa cai de **197px → 94px** fechada.
3. **🧭 Uma navegação só.** As abas de cima (jogos · números · elenco) descem pra barra
   que já existe embaixo; Rank/Estante/Temporadas viram **📚 Estante** com as três em
   pílulas dentro do painel. Eram 7 botões de navegação; viraram 5.

### 🛡️ O desktop não foi tocado — e isso foi condição, não sorte
Ele aprovou a tela larga poucas horas antes. Tudo que é novo mora em
`@media (max-width:1099.98px)` e exige `.ll25-shell`:
- a coluna da direita virou duas metades dentro de um invólucro (`.ll-lado`) que no
  desktop é UM bloco na coluna 2 e no celular se dissolve (`display:contents`);
- a barra desenha os DOIS conjuntos de botões e a CSS escolhe qual aparece
  (`ll-barra-cel` / `ll-barra-desk` / `ll-abas-topo`) — **nada é remontado pelo React no
  meio da rodada**.
Medido na bancada com a CSS do build: desktop com tabela e próximo jogo no **mesmo y=502**
e o giro colado embaixo (sem buraco); barra de 5 botões cabe em **320px** em PT e EN.

### Não existe estado sem navegação
Sem a barra na tela (preview do Diego offline, ou durante a Copa) as abas de cima
continuam onde sempre estiveram. Foi a primeira coisa conferida antes de mexer.

### 📌 Lição pro repo
**Mockup não substitui inventário.** Quando o dono se perde entre versões, o problema
quase nunca é a versão — é que ninguém listou o que existe hoje. A lista fez duas das
seis versões virarem pó e o trabalho encolher de 12 decisões pra 3.

---
## 18/09/2026 (parte 7) — 👕 A GAVETA ESQUECIDA: 5 camisas de batismo que nunca chegaram na Loja

Cobrança do Diego, com a foto da Loja do Clube na mão: *"a camisa do La Bestia Negra não
atualizou… então outros de batismo ainda não devem? Ou só ele?"*

**Não era cache nem arte errada — o clube nunca esteve na lista.** A camisa que o dono
manda no batismo é usada em DOIS lugares diferentes:
- `scripts/kits/` → o ACERVO, que o **post** usa (por isso o post do batismo sempre saiu
  com a camisa certa, e ninguém desconfiou);
- `public/mantos-salao/` + `CAMISAS_SALAO` em `salao-camisas.ts` → o que o **site** serve
  na Loja do Clube.

Quando só o acervo é alimentado, a Loja cai no molde genérico (camisa creme/preta de
galão + escudo com a letra do clube) — exatamente o print que ele mandou.

**A varredura dos 53 batismos/sócios**: 40 tinham camisa, 13 não. Desses 13, **5 já
tinham a arte parada no acervo** e foram publicadas agora:

| clube | dono | arte parada desde |
|---|---|---|
| 🦊 La Bestia Negra | eltonfrossard45 | 09/08 (renovada 18/09) |
| 🌑🐺 Pesadelo Verde FC | portaltech.ep | 18/09 |
| 🐴 Fridão FC | felipe.ofrida | 16/09 |
| 😇🐷 São Marcos Antônio FC | marcomak03 | 13/09 |
| 👑 Internacional de Madrid | matheusstefanello372 | 14/09 |

Os **8 restantes** (Deportivo Montreal · SC Ferrari · Coringas do Diniz · Remoçada ·
Nata de SP · Sapekeiros FC · Marreco FC · Eros FC) seguem no molde genérico porque o
**dono nunca mandou camisa** — e isso é o certo até a arte chegar (nada de inventar
manto: regra do Diego de 18/08).

### 🛡️ A trava que deixou passar, e o conserto dela
`scripts/checa-salao.mjs` (`npm run salao`) conferia só as camisas **cadastradas** —
então no dia em que o clube não estava na lista, ele dava ✅. Agora ele lê a lista de
batismos/sócios do próprio `checa-batismos.mjs` (uma lista só, pra não discordarem) e
cobra clube por clube, separando:
- ❌ **arte no acervo e nunca publicada** → erro nosso, quebra o guarda (exit 1);
- ⏳ **dono nunca mandou arte** → aviso, não quebra.

### 🧪 Bancada nova: `scripts/teste-camisa/`
Monta a `CamisaLoja` DE VERDADE (o componente do jogo, com fornecedor no peito e Master
na barriga) pra qualquer clube cadastrado. `?molde=1` desenha o ANTES. Serve pra conferir,
em toda camisa nova, se a arte encaixa na janela e se as estampas caem no pano.

- **Dá pra voltar atrás?** Dá, e é barato: são 5 arquivos novos em `public/mantos-salao/`
  e 5 linhas em `CAMISAS_SALAO`. Tirando as linhas, o clube volta ao molde genérico na
  hora. Nada do jogo mudou — só o que a Loja serve.

### Pendências que ficam
- 🎽 **Pedir a camisa** pros 8 clubes sem arte (lista acima) — é o que falta pra Loja
  ficar 100% batizada.
- ⏳ 28 camisas antigas ainda sem `-vN` no nome (o guarda avisa). Não quebra nada hoje;
  no dia em que a arte de uma delas trocar, trocar o nome junto.

## 18/09/2026 (parte 6) — 🔓 O banco de 16 ABRIU PRA TODO MUNDO

Ordem dele, no fim do dia: *"publique isso pra todos já, não só no meu usuário"*.
`ELENCO27_GERAL = true` em `sport.ts`. A lista `ELENCO27_TESTERS` virou RESERVA — pra
fechar de novo é voltar pra `false` e ela reassume (o e-mail dele continua lá).

**As três pernas saíram juntas, como manda o roteiro** (código + o que o jogador vê + o
anúncio):
1. **Trava aberta** → elenco 27, aba Elenco nova, pílulas, aba SAF, atalhos, barrinha de
   gás no campinho: tudo de todo mundo agora.
2. **Linha em `novidades.ts`** (PT + EN) — o banco de 11 → 16, com o aviso do salário e
   da renovação na mesma frase. Era a pendência que estava aberta desde 16/09.
3. **A fita trocou o fecho**: `chegando` (dourado) → **`já está no ar`** (verde).
   Regravada. Fita não pode contradizer o jogo — a mesma regra que o reels do preparador
   registrou em 15/09.

### 🧪 A trava quebrou — e era pra quebrar
`npm run elenco27` reprovou na hora: a seção 1 dela guardava o mundo ANTIGO ("trava
fechada = elenco 22"), que deixou de existir. **Isso é o serviço dela**, não um defeito.
Atualizada pro mundo novo: hoje a seção 1 prova que **qualquer conta** chega a 27.
📌 Mesma limpeza no que virou herança: o alvo `elenco-antigo-celular` (`?novo=0`) saiu do
`print-elenco.mjs` — o `?novo=0` não fecha mais nada (o GERAL ganha da lista de e-mails),
então aquele print só enganaria quem viesse conferir depois.

## 18/09/2026 (parte 5) — 🌐 Minhas Ligas: os DOIS bugs do Bruno, com a causa achada

Diego trouxe o áudio do Bruno + a cobrança: *"eu já tinha pedido pra você arrumar o
Minhas Ligas do online, mas pelo visto ainda tem erros"*. Tinha mesmo. As duas causas:

### 1) 📣 "Chamar mais gente" — o amigo novo não entrava e o pregão continuava de onde parou
Bruno: *"tô jogando entre duas pessoas, chega um amigo, eu clico pra voltar pra sala de
espera, ele entra, eu abro o pregão de novo e continua só eu e o outro — o novo não entra
e o pregão continua de onde parou"*.
**Eram DUAS travas engolindo a largada nova, e em 15/09 eu consertei só UMA:**
- ✅ (15/09) `jaTocoAquiComoDono` — a guarda do eco da largada. Ganhou o `emJogoVivo`.
- ❌ **`jaIniciouRef`** — guarda "já montei ESTA sala" pela VIDA do componente. A 2ª
  largada da MESMA sala caía num `return true` e **não montava nada**. Agora o aviso do
  banco zera esse ref quando a sala volta pra `waiting` (chega em TODO aparelho, então
  host e convidados voltam a largar juntos).
- ❌ **o `game_state` guardava a partida inteira.** O `status: 'waiting'` sozinho não
  bastava: o estado salvo continuava com `managers` + `screen: 'auction'`, então a
  largada seguinte caía no ramo *"partida em andamento"* do `triggerStart`, que
  **RESTAURA** em vez de montar. Daí os dois sintomas de uma vez. Agora o
  `chamarMaisGente` grava `screen: 'lobby'` DENTRO do game_state — cirúrgico: é o campo
  exato que a conta olha, e liga/regras/baralho/senha ficam intactos.

### 2) 🌎 Baralho do MUNDO virando BRASIL
Bruno: *"colocou baralho mundo, porém quando jogou de novo apareceu baralho do Brasil…
depois de um tempo na sala começa a aparecer só jogador brasileiro"*.
**CAUSA: dois bichos com o mesmo nome.** A sala guardava a escolha em
`game_state.deck` — e `deck` é TAMBÉM o baralho de CARTAS do estado do jogo
(`Record<Sector, Card[]>`). No **primeiro save do host** (3 s depois de abrir o pregão)
as cartas gravavam **por cima** da escolha. Daí em diante `gs.deck` era um objeto; como
não é `'todos'` nem `'eu'`, caía no padrão: **Brasil**.
**Não dava pra só proteger o `deck`** — quem reconecta PRECISA das cartas nesse campo.
Então a escolha mudou de nome: **`deckSala`**, que entrou na lista protegida do save
(`salaFixaRef`, store.tsx) junto com `rivals`/`rivalTeams` (que sumiam pelo mesmo
motivo: não existem no estado do jogo). O `deck` velho só é lido se ainda for TEXTO.

📊 **O tamanho do estrago, medido no banco** (últimos 7 dias): **773 de 844 salas** com a
escolha destruída (`deck` virou objeto) — 92%. As 71 intactas são salas que nunca
abriram o pregão, ou seja, nunca chegaram no primeiro save.
🛟 **RECUPERAÇÃO DAS SALAS ANTIGAS (21/09):** embora o `deck` textual tenha sido
sobrescrito, o estado da partida guarda a escolha real separadamente em `deckLeague`.
Agora o primeiro save do host reconstrói `deckSala` por esse valor — inclusive após F5 —
e o botão **Chamar mais gente** leva a escolha junto ao voltar pra espera. Vale para
Minhas Ligas e Rápido, Europa e Mundo. Só uma sala tão velha/quebrada que não tenha
nem `deckSala` nem `deckLeague` continua no padrão Brasil, porque aí não existe dado
honesto do qual recuperar a escolha.

🧪 **Trava nova: `npm run sala`** (`scripts/testa-sala-online.mjs`) — as duas contas do
jogo copiadas (a de "restaura o pregão velho?" e a do baralho da sala), incluindo sala
velha intacta, recuperação Europa/Mundo em Minhas Ligas/Rápido, F5 e dez saves seguidos.
⚠️ **O que a trava NÃO cobre:** a sala de verdade. Este ambiente **não alcança o
Supabase**, então o que está travado é a REGRA, não a fiação.
↩️ Reverter: `git revert` do commit — são três pontos pequenos (lobby, screens, store).

## 18/09/2026 (parte 4) — 🐊 "Solta a mascote": agora ATRAVESSA A TELA ✅ CODADO E NO AR

Diego: *"esse solta o mascote das salas online está mt pequeno e sem graça… sei lá"*.

**Ele tem razão, e dá pra medir:** hoje o botão SOLTA A SUA MASCOTE (`MascoteJab`,
screens.tsx) manda um emote `masc:<chave>`, e o que aparece é uma **fichinha de 52px** na
fila de reações, do lado de *"soltou o bicho!"*. Comparando com o que já existe no jogo:
a cantada 💸 tem **chuva de dinheiro na tela inteira** (`MoneyRain`, ~2,4 s). Ou seja, a
mascote do **clube batizado** — a coisa mais pessoal que o jogo tem — tem MENOS teatro
que um emoji.

### A proposta (nada codado no jogo; só a bancada)
A mascote **ATRAVESSA a tela**, grande, por ~2,2 s: entra por um lado, cruza a parte de
baixo do jeito DELA, solta confete e deixa a faixa roxa *"Fulano soltou o bicho!"*.
- **Zero arte nova**: é a mesma arte e os mesmos keyframes da festa de campeão, incluindo
  o `FESTA_JEITO` (🦅 quem voa plana alto e sem sombra · 🐍 quem rasteja ondula rente ·
  o resto quica).
- **Não atrasa o jogo** (regra de ouro): camada fixa, `pointer-events: none`, fora do
  reducer — a MESMA receita da chuva de dinheiro. Não toca em lance, tempo nem resultado.
- Quem não tem clube batizado continua sem ver botão nenhum (régua dele).

🎥 **Bancada: `scripts/teste-mascote/` + `node scripts/print-mascote.mjs [--masc chave]`**
— grava ANTES × PROPOSTA lado a lado num mp4. Animação não se julga em print parado.

### ✅ Aprovado e feito
Ele escolheu: ***"atravessa a tela"*** — uma passada só, ~2,2 s. Entrou como
`MascoteAtravessa` (screens.tsx), montado ao lado do `MoneyRain`. **Este vale pra TODO
MUNDO** (não tem trava de conta): é cosmético, e quem não tem clube batizado continua
sem botão nenhum.
- 🧹 **A fichinha de 52px SAIU da fila de reações** quando o bicho grande está cruzando —
  senão era a mesma coisa duas vezes na tela, exatamente a bronca da faixa dos cansados.
  Chave que o aparelho NÃO sabe desenhar continua na fila com o 🎭 (nada se perde).
- 👥 Dois ao mesmo tempo cruzam juntos, em alturas diferentes (`MASC_ALTURAS`, sorteadas
  pelo id do emote, então re-render não faz o bicho pular).

### ⚠️ O que NÃO deu pra testar daqui — e por quê
O `MascoteAtravessa` lê `useEsc()` (estado da SALA + fila de emotes), que **só existe
numa sala online de verdade** — e este ambiente **não alcança o Supabase** (o proxy
bloqueia `faabglpjutwursgmrpny.supabase.co`, achado em 18/09 no bug do host).
Então a bancada é **ESPELHO, não importação**: ela copia os keyframes com os MESMOS
nomes e valores, e o `print-mascote.mjs` **compara os dois arquivos antes de gravar** e
falha se um mudar sozinho (hoje: 6 animações em sincronia). Ou seja, o movimento está
provado; o que falta ver com gente de verdade é a **fiação** (o emote chegando na sala).
↩️ Reverter é tirar `<MascoteAtravessa />` de uma linha no `screens.tsx`.
## 18/09/2026 (parte 3) — 🎬 Reels do banco de 16 (com o aviso de salário/renovação)

Pedido dele: *"preciso de mockup agora com vídeo padrão q sempre fazemos, dizendo q agora
aumentou o número de reservas incluindo mais um por posição, tendo agora mais 5. Porém,
abrindo mais vagas tb tem q tomar cuidado com salário e renovação. Portanto é algo mt bom
ter mais reservas e tal, mas com cuidado"*.

**`node scripts/video-reservas-reels.mjs`** — 1080×1920, ~26 s, mesma técnica dos outros
(cenas em keyframes de CSS, Playwright grava a tela, ffmpeg converte). Roteiro: banco
11→16 · +1 em cada posição · a conta (11+16=27, e a SAF por cima até 31) · ⚠️ o cuidado
(salário todo ano · renovação · o emprestado é de graça) · vaga a mais não é obrigação ·
marca.

🧾 **Os números saíram do CÓDIGO, não de cabeça** (pra fita não mentir):
- salário = `salaryOfCard`: **piso ÷ 10** por jogador, por temporada
- emprestado da SAF paga **ZERO** (primeira linha da mesma função) — virou cena
- renovar (`renewCost`): **5 temporadas = metade** · **10 = 90%**
- caixa no vermelho trava contratar/investir (já existia; entrou como aviso)

⚠️ **A FITA FINAL DIZ "CHEGANDO", NÃO "JÁ ESTÁ NO AR"** — de propósito: o banco de 16 está
travado na conta dele (`ELENCO27_GERAL = false`). **No dia de abrir pra geral**, trocar a
pílula da cena ⑥ pra `pill('já está no ar', GREEN, '#fff', 40)` **e** pôr a linha em
`novidades.ts` (com o campo `en`). Fita não pode contradizer o jogo — foi o cuidado que o
reels do preparador registrou em 15/09.

## 18/09/2026 (parte 2) — 😓 Gás volta ao campinho · 📤 compartilhar com o banco LISTADO

1. **A barrinha de energia VOLTOU pro campinho** (*"tá faltando a barrinha de energia no
   time titular do campinho"*). ⚠️ Isto **revoga a regra de 12/09** (*"não quero que
   apareça no campinho, só onde tem a listagem"*) — CLAUDE.md atualizado. Por que mudou:
   em 12/09 a barra dividia o boneco com ⚽, 🅰️ e cia., e virava painel; hoje o campinho
   está limpo (gol e assistência são COLUNA), então sobrou lugar pra única coisa que
   importa olhando o time que vai entrar. Vai a **barra crua**, sem número (o % vive na
   lista), e **só na tela nova**.
2. **📤 O compartilhar: banco LISTADO, não um segundo campinho** (*"ajuste o botão de
   compartilhar pra vir apenas os titulares do campo + o time reserva listado"*).
   Antes a arte desenhava **dois gramados** — o segundo era o banco —, o que dava a
   entender que os reservas também estavam em campo; e com o banco de 16 aquilo virava
   um campão de 4 linhas. Agora: campinho = quem JOGA; banco = ficha em **duas colunas**
   (rosto · POS · nome · clube·ano · ⚽), no fundo creme com a borda e a sombra da casa.
   🧹 De quebra: `titulares` saiu do pacote do compartilhar — era **dado morto**, ninguém
   desenhava com ele, e ficava parecendo que existia uma lista de titulares na arte.
3. 🧪 **Bancada nova: `scripts/teste-share/` + `node scripts/print-share.mjs`.** A arte é
   CANVAS — o `tsc` não enxerga UM erro de desenho ali. Sem bancada, eu só ia descobrir
   que quebrou quando ele tentasse postar. Ela desenha o pior caso (16 reservas) e o
   script falha com o stack na tela se a arte estourar.
   ⚠️ E ela caiu na primeira tentativa por culpa minha: usei `find(...)!` num nome que não
   está no catálogo de rostos e o `undefined` derrubou tudo. Agora tem fallback.
## 18/09/2026 — 🌑🐺 BATISMO: Pesadelo Verde FC (portaltech.ep) na Série C + 🦊 arte nova do La Bestia Negra

### 🌑🐺 Pesadelo Verde FC — batismo novo, 3 pernas fechadas
Pedido do Diego: *"faça batismo desse usuário aqui, que hoje é craque mas vai ser
batismo, troque por um time da Série C"*. Ele era **prata (Craque)** e subiu.

⛔ **Conta conferida ANTES de qualquer linha** (regra de 07/09): existe em `auth.users`.

- **Assento**: Série C, na vaga do bot **Zé Colmeia**, com
  `OLD_NAME['Pesadelo Verde FC'] = 'Zé Colmeia'`. O bot segue vivo em `CPU_MANAGERS`.
- **Manto**: quase-preto `#030A04` + verde-musgo `#597751`, **medidos na camisa**
  (84% e 7%); branco `#D8D6D1` da gola como 3ª cor (`MANTO_TRI`).
- **Banco** (feito e conferido): `esc_socios` nº **54** (`valido_ate 2099-12-31`,
  `origem batismo`) · `esc_fundadores` nº **73** · `user_colors` **ouro + manual** ·
  `esc_nomes_batismo` com **3 nomes travados** (o gatilho criou FC e EC).

### 🎨 RECEITA NOVA: recortar arte VERDE em chroma VERDE
Vale guardar, porque vai repetir. Medido nesta prancha: **5.319 pixels do pelo do
lobo e 3.553 do halo da lua** estão a menos de 60 de distância da cor EXATA do
fundo. Cortar por "verde forte" (o jeito das outras pranchas) comeria o raio e o
brilho — que é a identidade do clube.
👉 **A saída é cortar por LIGAÇÃO, não por cor**: o fundo é a mancha cor-de-chroma
que **encosta na borda da imagem**. Verde igualzinho dentro do desenho não encosta
em borda nenhuma, então fica. Buraco preso (vão entre as patas) só sai se for
grande. Está em `scripts/recorta-prancha-pesadelo.py` — é o script a copiar quando
a arte tiver a cor do chroma.

### 🦊 La Bestia Negra — arte nova do dono (renovação)
- Escudo e mascote **eram SVG desenhado à mão dentro do código** (de 09/08, antes
  da regra de peso). Saíram e viraram `.webp` fora do bundle.
- **Manto remedido**: azul `#011B8A` + branco `#E8E8EB`. O azul saiu da leitura do
  PANO (p65-p75 do brilho) — a mediana crua puxava pro quase-preto por causa do
  sombreado pesado. ⚠️ E a 2ª cor que estava no banco era `#F4ECD6`, que é
  **exatamente o creme da tela do jogo**: a listra clara dele sumia no fundo.
  Corrigido no banco também.
- 🕳️ **Buraco antigo fechado de lambuja**: ele tinha `FUNDADOR_N` mas **não tinha a
  linha de tier ouro** em `apoio.tsx` desde 09/08. No banco (`user_colors`, a fonte
  oficial) já era ouro, então nunca deixou de ver o dourado — a RESERVA é que
  estava vazia. `npm run batismos` foi de 40 → **42 completos**.

### ⏳ Pendente (avisar o Diego quando souber)
- 🦊 Nome da mascote do La Bestia (**"A Bestia"**) e do Pesadelo (**"O Pesadelo"**)
  são PROVISÓRIOS — as artes vieram sem nome.
- ❤️ Time de coração do dono do Pesadelo Verde: não sei, `time_coracao` vazio e o
  post saiu sem a linha.
- 📝 O escudo do La Bestia escreve **"LÁ BESTIA NEGRA"** (com acento). O clube no
  jogo é "La Bestia Negra" — **não renomeei**, nome de clube batizado é identidade
  e chave de save.

---

## 18/09/2026 — 👥 Aba Elenco: aba SAF, fora o Nº, o meio limpo, pílulas e a Base no banco ✅ NO AR (só a conta dele)

Diego, olhando a tela NO CELULAR dele (não mais a bancada): *"faltou a aba da SAF, como
pode ver na primeira foto q tá ótimo… Número n entendi pq significa… e já disse q nível n
precisa pq já basta o over c gás e a regra q o tier do usuário pode ver… e quero ver no
desktop e móveis como ficará, pois do jeito q tá c essa segunda foto n gostei, c mts coisas
no meio atrapalhando"*.

✅ **OK DADO E PUBLICADO** (*"ok faça tudo aí… como falei atualize apenas pro meu usuário"*).
Segue travado em `ELENCO27_TESTERS`.

1. **🏢 Aba SAF** — agora são três (⭐ TITULARES · 🔁 RESERVAS · 🏢 SAF). Ela estava no
   desenho aprovado e eu tinha entregado só com duas. Emprestado tem lugar próprio porque é
   outra coisa: não é do elenco, não gasta vaga e volta na virada. Quem está emprestado **e
   escalado** aparece nos titulares também, com o selo 🔁 EMP — esconder ele do time em
   campo seria mentira. Dentro da aba SAF o selo some (ali todo mundo é emprestado).
2. **🔢 Coluna Nº saiu** — e ele está certo: a carta NÃO tem número de camisa, então aquilo
   era só a ordem da linha. Número que não quer dizer nada, comendo a largura que o NOME
   precisava no celular. Inventar camisa seria pior: seria dado falso.
3. **Nível já estava fora** — a foto 1 dele é do DESENHO velho, que ainda tinha a coluna. O
   código mostra só OVERALL, com a trava do tier de sempre.
4. **🧹 O MEIO DA TELA (a bronca principal)** — entre o campinho e a lista moravam TRÊS
   caixas grandes (Departamento Técnico · Base · Folha), então pra ver o elenco ele rolava
   meia tela de coisa que não é elenco. Agora embaixo do campo ficam só **atalhos de uma
   linha** (🏛️ Comissão · 🌱 Base, quando tem vaga · 🏢 SAF) e a lista vem em seguida. As
   caixas inteiras desceram pro PÉ da tela — **nada sumiu**, o atalho rola até elas
   (`ID_COMISSAO`/`ID_BASE`) e o de SAF troca a aba na hora.
5. **📝 Contrato enxuto no estreito** — por extenso ele cortava o clube no meio ("São Paulo ·
   2005 · ⏳ ú…"). No celular sobrou só o EMOJI, e só quando é aviso (❗ vencido · ⏳ último
   ano · 🌱 sem contrato); "📝 4 anos" (tudo certo) saiu da linha e vive na barra do
   selecionado. No monitor continua por extenso.
6. 🏷️ O selo 🔁 EMP saiu de DENTRO do nome que corta — em nome comprido (David Beckham) o
   "…" comia justamente o selo.

🖨️ `node scripts/print-elenco.mjs` agora tira o print **em português** (`bl_lang`) e espera
por `domcontentloaded`, não `networkidle` — o ambiente não alcança o Supabase, então o
`networkidle` pendurava pra sempre. E ganhou o alvo `elenco-celular-saf` (n=31).

7. **🎽🔁 O TOPO TAMBÉM ESTAVA CHEIO** (*"essa foto tb tá c mt informação"* — a foto era o
   topo: Formação + Trocas + Quem está cansado, tudo aberto ao mesmo tempo). Medi: a caixa
   da **Formação sozinha tem 171px** no celular — e isso **com UMA formação só** (sem
   técnico), ou seja, um botão e um parágrafo explicando que não dá pra trocar. A de Trocas
   é do mesmo tipo. As duas viraram **PÍLULA** (`🎽 4-4-2 ▾` · `🔄 Dinâmico ▾`) e só abrem no
   toque — os botões e os textos são os MESMOS, só pararam de ficar abertos o tempo todo.
   Régua que decidiu: **campo e lista você olha toda rodada; formação e modo de troca você
   mexe de vez em quando.** Altura fixa pra ação rara é troca ruim.
   ⚠️ O que NÃO virou pílula: 😓 **Quem está cansado**. Aquilo é ação com hora marcada (os
   nomes + o 🔁 RODIZIAR) — esconder seria esconder o problema.
8. **🌱 SUBIR DA BASE dentro do banco** (*"tem algum botão da base na área do banco? pra
   poder subir da base pros reservas se o cara quiser"*). Entrou no pé da aba 🔁 RESERVAS,
   que é onde se sente a falta de reserva. **Não duplica nada**: leva pra MESMA caixa da
   Base. Só aparece quando existe vaga (a caixa da Base já respeita `vagaCheio`).

9. **🚑 A FAIXA VERMELHA SAIU — eram duas caixas dizendo a mesma coisa** (*"não entendi
   por que tá aparecendo duas linhas da mesma coisa, esgotados em cima e embaixo também
   falando dos nomes cansados. Tá muita informação pra uma coisa só"*). Ele está certo: a
   faixa dizia *"9 esgotados — toque pra ver quem"* e, 100px abaixo, a caixa 😓 QUEM ESTÁ
   CANSADO já mostrava QUEM.
   👉 **Por que a faixa existia, e por que não precisa mais:** ela nasceu em 15/09 pra
   resolver *"o cara tem q descer lá embaixo p ver os cansados"*. Nesta tela isso **acabou**
   — a lista subiu, porque comissão/base/folha desceram pro pé. O atalho virou atalho pra
   uma coisa que já está na tela.
   Ficaram as duas que **não** se repetem: o **RESUMO** na linha do gás (`68% · 1 🥵`, com os
   contadores de volta, já que era a faixa que os carregava) e os **NOMES** na caixa.
   🔒 Trava fechada: `atalhoGas` ganhou `&& !elencoNovoOk`, então pra todo mundo a
   condição é a de sempre — não é screenshot, é o próprio `&&`.

### ⏭️ Pendente
- [ ] Mockup da novidade (11 → 16 reservas), só quando ele mandar abrir pra geral.

## 18/09/2026 — 👑 O DONO ENTRA NA PRÓPRIA SALA COMO CONVIDADO (medido: ~18% das travas)

Relato do Diego, com dois prints da live do canalmeianacanela (sala KIKO6I):
*"toda vez que um streamer vai fazer live… ele vem pra essa sala e, mesmo sendo
host, aparece no final o botão escrito 'o host vai começar o leilão', sendo que a
tela dele era pra ter o botão de iniciar… e quando ele atualiza no F5 volta ao
normal. Muita gente não sabe que precisa atualizar e acaba desistindo"*.

### 🧾 A PROVA (caixa-preta `esc_travas` × `game_rooms`)
Cruzei cada trava com o dono da sala no banco (`papel = 'convidado'` E
`game_rooms.host_id = esc_travas.uid` = o aparelho do DONO se achando convidado):

| dia | travas com a sala ainda no banco | dono como convidado | % |
| --- | --- | --- | --- |
| 18/09 | 263 | **51** (29 pessoas) | 19,4% |
| 17/09 | 738 | **129** (67 pessoas) | 17,5% |
| 16/09 | 634 | **118** (58 pessoas) | 18,6% |

⚠️ **NÃO é regressão nova** — eu quase disse que era. A conta crua parecia um salto
no dia 16 (2 → 118), mas é ilusão: sala some do banco quando o dono sai, e de 15/09
pra trás só **1%** das salas ainda existe, então os casos velhos ficam invisíveis.
Olhando só onde dá pra ver, a taxa é **estável em ~18%** — o defeito é antigo.

### O que isso significa de verdade
Não é só o botão sumido. As linhas têm `momento = 'envelope'`: o dono **entra no
pregão** como convidado. Com o jogo host-autoritativo, aí **ninguém é host** — e é
por isso que essas linhas existem, elas são relatos de "travou". Ou seja: 1 em cada
5 salas travadas é uma sala **sem dono nenhum**, com o dono lá dentro.

### 🚨 E o socorro que deveria consertar isso está MORTO
Existe desde 07/09 (sala do Sistematizados) um resgate no `store.tsx` (~9870): na
tela de abertura ele pergunta ao banco a cada 5 s quem é o dono e, se for este
aparelho, dá `BECOME_HOST` sozinho. Ele grava `extra.quando = 'reassumiu'`.
**Em 10 dias ele gravou UMA linha — e nenhuma na `streamIntro`.** Na prática não
roda. Conferido que não é o registro que falha: `anotaTrava` é à prova de erro e o
resgate chama com `semFreio = true`.
👉 Isso é o conserto de maior retorno: devolver a coroa a quem **o banco já diz que
é o dono** não é troca de dono — é exatamente o que o Diego permite (*"quem já é
dono no banco reassume sozinho ao voltar"*).

### 🔎 Mecanismo mais provável (hipótese, ainda não provada)
No `lobby.tsx` o `triggerStart` roda DUAS vezes no aparelho do dono na largada:
uma pelo botão (`startGame` → `update status='started'` → relê → `triggerStart`) e
outra pelo ECO do banco (`postgres_changes` → `if (r.status === 'started')
triggerStart(r)`). Desde **83735ee (15/09)** a guarda `jaTocoAquiComoDono` exige
`emJogoVivo` (tela ≠ lobby) — e o dono está EXATAMENTE no lobby quando aperta o
botão, então a guarda não cobre. As duas chamadas correm juntas; o `jaIniciouRef`
só é marcado no fim, depois de vários `await`, então as duas passam por ele e as
duas despacham `START_ONLINE`. A última a chegar manda — e a do eco calcula o dono
a partir de um `host_id` que o próprio código já avisa que "chega picado".
⚠️ Marcado como HIPÓTESE de propósito: a taxa estável desde antes de 15/09 diz que
existe pelo menos mais uma porta. Não mexer sem instrumentar primeiro.

### ✅ CONSERTADO (18/09) — o Diego liberou: *"faz os 2 logo cara, lembrando que o
host que cria a sala nunca pode mudar"*. Dois commits separados, revertíveis um a um:

**1. `store.tsx` — a coroa volta sozinha pro dono.** Efeito PRÓPRIO, fora do vigia
(era lá que o socorro velho morria). Pergunta ao banco quem é o dono e só age se a
resposta for ELE MESMO; se for outro uid, ou se a leitura falhar, não faz nada.
1ª checagem em 800 ms (é a que resolve o caso do streamer, sem F5); depois só
insiste quando o aparelho não ouve host NENHUM há 6 s — convidado de verdade ouve
o "tô vivo" do dono a cada ~4 s, então pra ele roda uma vez e para (isso segura o
custo de banco: sem esse freio seriam 13 aparelhos consultando a cada 4 s numa
sala de 14).

**2. `lobby.tsx` — a coroa só cai com PROVA, e uma largada por vez.**
- `donoDaSala === user.id` tratava "não sei quem é o dono" e "o dono é outro" como
  a MESMA coisa: as duas leituras falhando davam `undefined === user.id` = FALSE e
  o dono se rebaixava sozinho. Agora, sem dono na leitura, quem já é dono DESTA
  sala continua dono. Handoff de verdade (banco apontando outro uid) segue igual.
- Cadeado de largada: o `triggerStart` rodava DUAS vezes no aparelho do dono (o
  botão e o eco do banco), as duas penduradas em `await`, e o `jaIniciouRef` só era
  marcado no fim — as duas passavam e as duas montavam o jogo. Agora, enquanto uma
  largada da sala está em voo, a outra devolve na hora.
- Registro novo na caixa-preta: `coroa_preservada` (leitura sem dono, coroa
  mantida) e `coroa_devolvida` (o socorro agiu). É com isso que dá pra conferir
  amanhã se funcionou, sem depender de relato.

🚫 **A COROA CONTINUA SEM TROCAR DE DONO.** Conferido no diff: **nenhuma das duas
mudanças escreve `host_id`** em lugar nenhum. Não há eleição, candidato nem votação
— o aparelho só pergunta "sou eu o dono?" e, se for, volta a ser. É o caso que o
Diego sempre autorizou (*"quem já é dono no banco reassume sozinho ao voltar"*).

### 📊 COMO CONFERIR SE DEU CERTO (rodar amanhã)
```sql
select date_trunc('day', t.created_at)::date dia,
       count(*) filter (where t.extra->>'quando' = 'coroa_devolvida')  as socorro_agiu,
       count(*) filter (where t.extra->>'quando' = 'coroa_preservada') as rebaixamento_evitado,
       count(*) filter (where t.papel = 'convidado' and g.host_id = t.uid) as dono_como_convidado,
       count(*) filter (where g.id is not null) as base
from esc_travas t left join game_rooms g on g.id = t.room_id
where t.created_at > now() - interval '4 days' group by 1 order by 1 desc;
```
O que esperar: `dono_como_convidado / base` cair dos ~18% de hoje. Se não cair mas
`coroa_devolvida` subir, o socorro está tapando o buraco sem fechá-lo — aí a caça
continua na largada. **Se `coroa_preservada` aparecer muito, a hipótese da leitura
picada estava certa.**

---

## 16/09/2026 (parte 2) — 🚨 A trava da crise NUNCA EXISTIU (ligada agora)

Diego, depois do primeiro conserto: *"eu não entendi que, se foi menos 500 lá atrás,
a mensagem deveria aparecer, ele deveria resolver, fazer as coisas que ele tem que
fazer na hora, OBRIGADO a fazer, e seguir. Eu não entendi como é que ele conseguiu
seguir jogando, fazendo dinheiro, e a mensagem está aparecendo"*.

Ele estava certo, e a resposta é pior do que parecia: **a trava nunca foi ligada.**

### O que estava no código
O comentário da fila de avisos dizia, desde 12/08: *"a crise trava até o técnico
escolher"*. Mentira do comentário. Na prática:
- `decisoesOk = sponsorBetOk && masterOk` — a crise não estava lá;
- `SimControls canNext = roundReady && !intervalo && !pênalti` — a crise não estava lá;
- o efeito do modo automático parava em `eventoPendente` (evento de JOGADOR) — **mas
  não em `criseAtual`**.
Ou seja: o evento de jogador travava a rodada; a crise financeira tinha ficado de fora.
Era literalmente por isso que o dono do Divizeiro seguiu jogando e faturando com o
aviso pendurado — o modo automático dele andava sozinho por cima da crise.

### O que foi ligado
`criseTrava` entra nos três portões: `decisoesOk`, o `canNext` do controle e o
botão de começar a temporada. O rótulo vira **"🚪 Decida quem fica no lugar dele"**, e
o selo da virada conta a crise como uma decisão pendente.

### ⚠️ Por que travar só é seguro JUNTO com o conserto da parte 1
A saída *"Nunca gostei dele mesmo"* (sobe alguém da base) não depende de nada — nem de
moeda, nem de folclórico livre, nem de vaga. Sempre há caminho pra destravar.
**Mas**: se a trava fosse ligada sozinha, os saves que já estavam PRESOS com o aviso e
o caixa recuperado (o Divizeiro, +3.870) ficariam travados PRA SEMPRE numa tela que
não faz mais sentido. É o conserto da parte 1 (o aviso expira fora do vermelho) que
solta esses saves. As duas coisas são uma entrega só.

### Provado no jogo rodando, não no papel
`node scripts/navega-carreira.mjs --fase crise` — abre o jogo, injeta a crise e espera:
- caixa **-900** + crise → a rodada FICA na 34 com o aviso na tela ✅
- caixa **+3.870** + crise → o aviso expira sozinho e o jogo segue ✅
E `npm run crise` (18 conferências no motor) continua cobrindo a escada -500/-1000.

### Lição pro repo
**Comentário não é trava.** O comentário dizia "trava" e ninguém conferiu por um mês.
Toda regra que promete bloquear alguma coisa precisa de um teste que ABRE o jogo e
confere que bloqueou — foi assim que este aqui foi pego.
---

---

## 16/09/2026 (parte 18) — 🏢 A SAF entra POR CIMA: 27 + 4 = 31
Diego: *"tem a SAF também, né? A SAF o usuário pode pegar emprestado quatro jogadores.
Então pode ir de 27 para 31. Era isso que dava para marcar."*

**No MOTOR já estava certo** e eu conferi antes de mexer: `LOAN_FROM_FILIAL` limita o
empréstimo pela **vaga da DIVISÃO** (`FILIAL_SLOTS` — A 4 · B 3 · C 2 · D 1), nunca pelo teto
do elenco. O emprestado sempre entrou por cima, e volta pra SAF na virada.

**Errada estava a CONTA DA TELA**, e era erro NOVO, meu, da entrega de hoje: a aba dizia
`(${'{'}reservas{'}'}/16)` contando o emprestado junto, então com 4 da SAF ia aparecer
**"20/16"** — número impossível, cara de bug. Consertado: o teto conta só o que é SEU e o
empréstimo aparece à parte.
- selo do cabeçalho: **`27/27 +4 🏢`** (era `31/31`, que fazia o teto parecer outro)
- aba do banco: **`🔁 RESERVAS (16/16 +4 🏢)`**
- com a trava fechada, o selo fica **byte a byte** o texto de sempre.

🧪 Entrou no `npm run elenco27`: elenco próprio cheio em 27 fecha o pregão · os 4 da SAF
levam a 31 · e o teto DELE segue 27 (empréstimo não gasta vaga).

📌 **Lição:** quando um teto muda, **toda conta que usava o teto velho vira suspeita**. Eu
mexi no número e não varri quem mais o lia — quem varreu foi ele, de cabeça.

## 16/09/2026 (parte 17) — ⚠️ CORREÇÃO: o leilão de reservas NÃO muda (são 11, sempre)

Diego, logo depois da entrega da parte 16: *"o leilão de reserva são 11 jogadores sempre.
Poder comprar mais cinco jogadores agora não tem nada a ver com o leilão de reserva, leilão
de titulares, não tem nada a ver. É durante o jogo, durante as temporadas, o usuário, se ele
quiser comprar para ter mais cinco reservas, ele compra. Se ele não quiser, também tá tudo
certo. O leilão de reserva mantém-se igual, que são 11."*

**Eu tinha posto o +1 por posição nos DOIS lugares** (`slotsOf` e `slotsCheio`) e escrito no
commit que era obrigatório mexer nas duas. **Estava errado** — `slotsOf` é o ALVO DO PREGÃO,
e o pregão ele não quer mexer. Revertido: `slotsOf` volta a `baseSlots × 2` (22), então o
leilão de reservas é byte a byte o de antes, pra ele e pra todo mundo.
O +1 por posição fica **só em `slotsCheio`** = **teto do elenco** (27), que é o número que a
tela mostra e o que limita quem entra fora do pregão.

### ✅ RESOLVIDO na mesma conversa — onde ele compra os 5
Perguntei e ele respondeu: *"ele contrata quando ele quiser, quando aparecer leilão ou
mesmo time… não tem exigência nenhuma"*. Ou seja: **é no leilão mesmo**, sem obrigação
nenhuma e sem tela nova.

Como ficou no código (duas regras que não brigam):
1. **O pregão é montado igual ao de sempre** — `slotsOf` (a mira, que decide o tamanho do
   baralho e a fome dos bots) segue **22**. "O leilão de reserva mantém-se igual, que são 11."
2. **Mas o técnico HUMANO nunca é BARRADO no 22º.** `openSlots` — que é quem ANULA lance,
   libera a repescagem e deixa pegar do monte — passou a usar o **teto do elenco**
   (`slotsCheio`, 27) **quando o pregão está aberto** (`deepSquad`). Se ele quiser gastar e
   levar o 27º, leva; se não quiser, fica em 22 e está tudo certo.
   ⚠️ **Só com o pregão aberto**, de propósito: fora dele o alvo volta pra 11 e esse mesmo
   número alimenta o "−N 🕳️" do gerenciar e a vez do monte — se crescesse o ano inteiro, a
   tela ia dizer que falta gente sem faltar. (Peguei isso porque `npx tsx
   scripts/testa-cria-base.mjs` quebrou na hora.)
3. Bot, rival e **o online inteiro** seguem em 22.

🧪 **Trava nova: `npm run elenco27`** (`scripts/testa-elenco-27.mjs`) — 15 conferências que
viram a regra dele em teste: trava fechada não muda nada · trava aberta mantém a mira em 22
e ainda deixa 1 vaga por posição · elenco 27 fecha · bot/rival/online intocados · fora do
pregão o número de vagas não muda.

#### (o levantamento que gerou a pergunta, guardado pra memória)
Hoje, na carreira, **não existe comprar jogador durante a temporada**. As entradas de jogador
são: **leilão** (entre temporadas, agora travado em 22), **Base/cria** (respeita `vagaCheio`,
ou seja, já usa o teto 27 ✅) e **empréstimo da SAF** (limite por divisão, `filialSlots`, e
entra POR CIMA do teto). A própria tela diz isso: *"Contrate no leilão ou traga da SAF"*.

Foi por isso que eu perguntei em vez de chutar — e a resposta dele (acima) fechou pelo
caminho mais barato: **nada de tela nova, é no pregão que já existe**.

## 16/09/2026 (parte 16) — ✅ CODADO: banco de 16 + aba Elenco nova, TRAVADA na conta do Diego

Ordem dele: *"antes eram 11 reservas, agora são 16 reservas, mais um por posição — um
goleiro, um zagueiro, um lateral, um meio e um atacante"* + *"você só vai publicar agora,
da forma que eu quero para desktop e dispositivos móveis"*, e no fim do dia:
***"só p meu usuário msm por enquanto"*.**

### O que foi pro ar (e pra quem)
🔒 **TUDO abaixo só aparece pra `diego.c.fonseca@gmail.com`.** Trava:
`ELENCO27_GERAL = false` + `ELENCO27_TESTERS` em `src/escalacao/sport.ts`
(`useElencoNovo()` na tela · `elencoNovoLiberado()` no motor).
Pra soltar pra geral: **`ELENCO27_GERAL = true`, e mais nada**.
Com a trava fechada a aba é **byte a byte a de sempre** — conferido com print
(`node scripts/print-elenco.mjs`, alvo `elenco-antigo-celular`).

1. **Banco de 11 → 16 (elenco 22 → 27)**, `+1 por posição`, em `store.tsx`:
   `extraDoDono()` entra em **`slotsOf` E `slotsCheio`** (as duas! só uma não adianta:
   `slotsOf` é o alvo do LEILÃO e `slotsCheio` é o teto da Base).
   - Vale **só pro técnico HUMANO** (bot/rival seguem 22) — palavras dele:
     *"eu não tô falando de bot, de rivais, eu tô falando do usuário principal"*. Por isso
     a demanda do baralho cresce 5 cartas NO TOTAL, não 5 por time.
   - Vale **só no OFFLINE** (`MODO_ONLINE`, espelhado do `state.onlineMode` a cada ação do
     reducer): o online no ar não muda sozinho.
   - **Ninguém é obrigado a comprar** — vaga a mais é vaga vazia até você dar o lance.
     Conferido: o leilão de reservas roda com `noFake`, então **nunca entra perna-de-pau**
     pra tapar a vaga nova.
   - O selo do cabeçalho agora lê `elencoCheio(mgr)` — acabou o `22` escrito na mão.
2. **Aba Elenco nova** (`ElencoField`, pyramidseason.tsx):
   - 🖥️ monitor: a caixa do clube **sai da coluna de 576px** (vai a ~1180px, centrada) e
     fica **campo à esquerda (560px, boneco 88px) · lista à direita**; comissão, Base e
     folha descem pro pé da lista, senão sobrava vão verde. 📱 celular: **empilhado**,
     igual sempre.
   - A lista virou **TABELA com abas** (⭐ TITULARES · 🔁 RESERVAS n/16):
     `Nº · rosto · NOME (clube·ano + contrato) · POS · OVERALL · JOGOS · GOLS · ASS · GÁS · STA`.
     Coluna que depende de direito (OVERALL, do olheiro) ou de regra ligada (JOGOS/GÁS, da
     condição) **só existe quando tem o que mostrar** — coluna vazia com título parece bug.
   - **Sem coluna NÍVEL** (ordem dele: *"o nível n aparece… só overall msm q já vem c a cor"*).
   - **Campinho limpo**: saíram os selos ⚽ e 🅰️ de cima do boneco — os dois viraram coluna.
   - **Barra do selecionado** (o "Aldair preto"): rosto + jogos · gols · ass · gás · valor ·
     salário + o estado dele.
   - O rostinho da lista é a **mesma arte e a mesma trava** do campinho (`avatarLote1`).

### 🧪 A bancada mentia — lição do dia
Mandei pro Diego um print da bancada com **nomes e clubes inventados**: sem rosto (o rosto
é achado pela trinca nome+clube+ano), sem gás, sem overall. Ele: *"essa arte q vc mandou tá
bem diferente do meu anexo q vc tinha feito antes tb"*. **Estava mesmo — e a culpada era a
bancada, não a tela.** `scripts/teste-elenco/main.tsx` agora monta o elenco com trincas
REAIS de `legend-avatars.json`, liga a condição e liga o Olheiro; e `scripts/print-elenco.mjs`
tira as fotos sempre nos mesmos tamanhos.
📌 **Régua nova: print de bancada só vale com dado REAL do jogo.** Bancada com dado
inventado não prova tela — cria discussão à toa.

### ↩️ Como voltar atrás
- Só o visual/banco: `ELENCO27_GERAL` já está `false` e a lista de testers é uma linha.
  Tirando o e-mail dele de `ELENCO27_TESTERS`, o jogo inteiro volta ao de hoje sem deploy
  de código novo... (precisa de deploy, sim — mas é UMA linha).
- Tudo: `git revert` do commit. As duas listinhas antigas e o `rowOf` continuam no
  arquivo, inteiros, justamente porque a trava está fechada.

### ⏭️ O que falta (combinado, ainda não feito)
- [ ] **Mockup de novidade** ("antes 11 reservas, agora 16 — um por posição"), **sem falar
      da mudança visual** (ordem dele). Só faz sentido mandar quando a trava abrir.
- [ ] **Linha em `novidades.ts`** — NÃO entrou de propósito: anunciar pra todo mundo algo
      que só a conta dele vê seria mentira. Entra junto com `ELENCO27_GERAL = true`.
- [ ] **Aba 🏢 SAF na tabela** (o mockup tinha): hoje o emprestado aparece na lista com o
      selo de empréstimo, como já era. Só vale separar se ele pedir.
- [ ] Ideias da SAF 1/3/4 (forma do jogador, luva, jornal) — decisão dele.

## 16/09/2026 (parte 15) — 🕵️ O overall na tabela (com a trava do olheiro) + as 2 abas que EU INVENTEI

Diego: *"lembrando q temos q por o overall tb e tb temos regras né pra aparecer o overall
de acordo c o usuário pagante q pode ver como já funciona hoje. Além disso n entendi q
aba é aquela escrito números, conquistas…"*.
Material: `node scripts/mockup-elenco-overall.mjs`. **Desenho, nada codado.**

### 1) O overall entra — e a regra foi COPIADA do código, não inventada
`ElencoField` (pyramidseason.tsx):
```
if (olheiroTier !== 'ouro' && !(olheiroTier === 'prata' && c.fame < 5)) return null
```
- 👑 **ouro (Lenda) e batismo** → vê TUDO
- ⭐ **prata (Craque)** → vê de craque pra baixo; **a LENDA fica escondida** (`fame < 5`)
- **sem olheiro** → não vê, e aparece a **porta** (o mesmo texto que já existe no jogo)

⚠️ **Dois detalhes que eu quase errei:**
- **Não é um número só, é a FAIXA `lo–hi`** (ex. 90–96), no degradê do tier da carta.
- **Lei do Diego escrita no código:** *"nunca a palavra da categoria escrita — só a cor"*.

O material mostra as **três visões lado a lado** (ouro / prata / sem olheiro) com o mesmo
elenco. A do prata é a mais interessante: Rogério Ceni, Cafu, Zico e Romário (lendas)
ficam **só com o 👑** — o buraco cai **exatamente nos melhores jogadores dele**. A coluna
vira vitrine sozinha, sem anúncio.

👉 **A tabela não muda de forma nas três visões** — muda só o que a coluna mostra. Ninguém
fica com buraco de layout.

### 2) 🙋 As abas NÚMEROS e CONQUISTAS: eu inventei, e ele pegou
Ele estava certo em não entender: **elas não existem no jogo**. Eu copiei da referência
dele ("ESTATÍSTICAS" e "CONQUISTAS") **sem conferir se tinham correspondente aqui**.
E pior: o que elas mostrariam **já existe** —
**NÚMEROS** = artilharia e garçons, que estão na aba **📊 Tabelas**;
**CONQUISTAS** = títulos, que estão na aba **🏆 Rank**.
**Tiradas.** Ficam só as três reais: **ELENCO · TÁTICA · COMISSÃO**.

📌 **Lição:** criar aba que duplica navegação é exatamente o defeito que eu apontei no
levantamento de telas — e eu fui e fiz igual, por copiar a referência sem checar.
**Antes de trazer um elemento de outro jogo, perguntar: isso já existe aqui? onde?**

### Estado
Nada codado. Ofereci montar de verdade com o elenco real dele, **testando as três visões
do olheiro na bancada** (ouro, prata, sem) antes de qualquer commit.

## 16/09/2026 (parte 14) — 🖥️ "O campinho ficou pequeno pro espaço?" — sim, era o do CELULAR

Diego, olhando o desktop: *"mas o campinho ficou mt pequeno pro espaço que tem, não? Ou
ele tá do tamanho q sempre foi??"*.

**Resposta: estava do tamanho de sempre — o do celular.** Eu tinha feito o erro clássico
de responsivo mal feito: **cresci a COLUNA e deixei o CONTEÚDO dela igual**. A coluna do
campo tinha 330px de 980 (34%) com o rosto em 44px, que é a medida do telefone.

**Consertado** (`scripts/mockup-elenco-final.mjs`): no desktop o campo passa a ocupar
**480px de 1120 (~45%)** e o rosto vai de **44 → 64px**; o campinho ganhou linha de meio
de campo e círculo central proporcionais. **No celular nada mudou** — lá o tamanho já
estava certo.

### 📌 Lição pro repo (vale pra QUALQUER tela nova de desktop)
`checa-telas.mjs` já garante que a tela não fica presa em 384px no PC. Mas ele olha a
**caixa**, não o **conteúdo**. Uma tela pode passar no guarda e ainda assim ser "o celular
esticado". Quando desenhar desktop, perguntar: **o que dentro da coluna também deveria
crescer?** (aqui: o rosto, o gap entre linhas, a espessura das linhas do campo).

## 16/09/2026 (parte 13) — 👥 A ABA ELENCO FECHADA NO DESENHO (desktop lado a lado · celular empilhado)

Ordem do Diego: *"talvez p desktop vc deixa lateral o campo e a lista lateral ao campo…
e dispositivo móvel deixe o campo em cima e lista dos jogadores embaixo… e c esses dados
assim. Faça agora c seu visual, sem pôr gols no campinho e assistência no campinho tb,
pq a pessoa já vê na lista"*.
Material: `node scripts/mockup-elenco-final.mjs`. **Desenho, nada codado.**

### ⚠️ Duas correções que ELE fez em mim (anotar, pra não repetir)
1. **O campinho mostra ROSTO, não camisa com número.** Eu tinha copiado a camisa da
   referência. Os rostos existem no repo: `src/escalacao/legend-avatars.json` →
   **157 avatares** em `public/avatars/lendas-v1/`. O mockup agora usa os de verdade.
   Lição: **antes de desenhar peça do jogo, procurar a peça no repo.**
2. **Sem selo de gol/assistência no campinho** — e o motivo dele é melhor que o meu:
   agora GOLS e ASS são **coluna da tabela**, com o número de todo mundo alinhado; o
   selo virava repetição. (A régua de ontem — campinho = história, lista = operação —
   continua válida: a lista passou a dar conta da história também.)
3. A barrinha de gás ganhou **6px + borda + número**; no tracinho de 4px ela sumia.

### O layout fechado
- **Desktop**: campo à ESQUERDA (330px) · tabela à DIREITA · barra do selecionado FIXA no
  pé · atalhos Comissão/Base/SAF embaixo do campo · abas do topo
  ELENCO/TÁTICA/COMISSÃO/NÚMEROS/CONQUISTAS.
- **Celular**: campo EM CIMA · abas TITULARES/RESERVAS/SAF · tabela EMBAIXO · barra do
  selecionado no pé (peça PRÓPRIA — a do desktop não cabe no estreito, vira sopa).
- **Colunas**: Nº · NOME (clube · ano) · POS · NÍVEL · JOGOS · GOLS · ASS · GÁS · STATUS.
- **Barra do selecionado** (o "Aldair preto" que ele gostou): jogos · gols · ass · gás ·
  valor · salário · contrato + a faixa do que está acontecendo + botão DETALHES.

### ⛔ O GER continua fora (decisão mantida)
A referência tem coluna GER (overall) = **perk pago do olheiro**. A coluna é **NÍVEL**
(🪵🎯💎⭐👑) e, pra quem TEM olheiro, o número aparece **no lugar do selo**, na mesma
coluna. Ninguém perde nada e a loja continua de pé.

### De onde vem cada dado (tudo já existe)
jogos → `condicao.jogos[id]` · gols/ass → `goals`/`assists` · gás e volta de lesão →
`condicao` · valor → `c.paid` · contrato → `c.contratoAte` · nível → `c.fame` ·
bio → `c.bio` · salário = piso ÷ 10.

### Estado
**Nada codado.** Próximo passo, já oferecido: montar DE VERDADE com o elenco real dele.

## 16/09/2026 (parte 12) — ⚽🅰️ Gol e assistência no campinho do layout novo: cabe?

Diego: *"gostei, porém teria q continuar mostrando gols e assistência tb no campinho.
Daria ou ficaria MT informação???"*.
Material: `node scripts/mockup-campinho-gols.mjs`. **Desenho, nada codado.**

### Resposta: cabe — e a prova é o PIOR CASO
Não dá pra responder "fica muita informação?" com a tela vazia, então o material mostra
**três momentos da mesma temporada**, contando os selos:
- **Rodada 1 → 0 selos.** O campo é só o time. Os selos só existem com número > 0.
- **Rodada 19 → 13 selos.**
- **Rodada 38 → 21 selos** — e esse é o teto prático (máximo absoluto 22: 2 por jogador
  × 11, que nem acontece porque zagueiro e goleiro quase não pontuam).
👉 A tela mais cheia possível tem **21 selinhos de 8px, nos cantos, sem encostar em nome
nenhum**.

### Por que cabe (o desenho, não a sorte)
- Selos no canto de **CIMA** da camisa; o nome fica **embaixo**. Nunca disputam espaço.
- São **dois no máximo**, empilhados — e sem gol a assistência **sobe** pro lugar de cima
  (regra dele de 24/08, já no código).
- São a **única coisa colorida** sobre a camisa, então o olho vai direto neles.

### 🔧 O ajuste necessário (achado ao desenhar)
No código hoje os selos ficam **pendurados 10px pra fora** da camisa (`right: -10` em
`jogadorcampo.tsx`). No campinho do layout novo, com 4 meias na mesma linha, eles
**encostam no vizinho**. No desenho ficaram em `right: -7, top: -5` — mesmo tamanho e
mesma cor, só não invadem mais o colega.

### 🎯 E isto FECHA a conversa do gás, com uma régua
Os dois selos dizem **o que o jogador FEZ** (gol, assistência = história, orgulho).
O gás diz **como ele ESTÁ** (estado, operação, decisão da próxima rodada).
👉 **O campinho é o lugar da HISTÓRIA; a lista é o lugar da OPERAÇÃO.**
Por isso gol e assistência ficam e o gás não — e por isso a ordem dele de 12/09
(*"não quero no campinho, só onde tem a listagem"*) **estava certa desde o começo**, só
não tinha sido dito o porquê. Guardar essa régua: serve pra decidir o que entra no
campinho daqui pra frente, sem ter que perguntar caso a caso.

### Estado
Nada codado. Se o layout for aprovado, os selos entram junto — são os mesmos de hoje,
reposicionados 3px pra dentro.

## 16/09/2026 (parte 11) — 👥⚡ O elenco de 31 no layout novo + "como se vê o gás dos titulares?"

Diego: *"eu teria q ver a foto de +1 por posição q dá 5 e +4 da saf pra ver como fica…
E como q vê a energia dos titulares? No campo? N sei…"*.
Material: `node scripts/mockup-elenco-31-e-gas.mjs`. **Desenho, nada codado.**

### A conta de 31 (4-4-2, +1 por posição)
`GOL 3 · LAT 5 · ZAG 5 · MEI 9 · ATA 5 = 27` · titulares 11 → **reservas 16** · +4 da SAF
= **31 na tela**. No layout campo|lista isso vira **três abas** sobre uma tabela:
`⭐ TITULARES (11)` · `🔁 RESERVAS (16)` · `🏢 SAF (4)`.

### 🔑 A pergunta dele achou o FURO do layout
Se **só uma lista aparece por vez**, quem está vendo os reservas **não vê o gás dos
titulares**. Isso é um defeito real do layout da referência, e não tinha sido notado por
mim — foi ele que achou. Anotar: **toda vez que um layout esconde metade da informação,
perguntar "e a parte escondida, quando é que ela importa?"**.

### ⚠️ E tem uma ORDEM DELE no meio (12/09, está no código com as palavras dele)
`pyramidseason.tsx`: *"não quero que apareça no campinho, só onde tem a listagem"*.
Então as três opções foram apresentadas com isso na mesa:
1. **A aba TITULARES mostra o gás** — já resolve, e respeita a regra. Bônus: hoje é PIOR,
   porque a lista de titulares é a coluna estreita da esquerda; no layout novo ela ocupa
   a largura toda.
2. **Faixa de aviso em cima do campinho** (⚡ "1 no vermelho (Edmundo 🥵) · 3 no amarelo ·
   VER") — **recomendada junto com a 1**. Não põe gás no campinho (respeita a regra), mas
   avisa que existe problema, e o VER pula pra lista filtrada. Resolve o caso REAL: ele não
   quer olhar o gás de 11, quer saber **se tem alguém ruim**.
3. **Gás embaixo da camisa no campinho** — desenhado, mas marcado como
   **"PRECISA VOCÊ MUDAR DE IDEIA"**, porque contraria a ordem dele. Minha opinião dada:
   ele tinha razão — 11 barrinhas transformam o campinho em painel de indicadores.

### 📐 A conta de altura com 31
A maior das três listas é a de reservas (16 linhas). Como **só uma aparece por vez**, a
tela tem sempre a altura da MAIOR, não a soma: **31 jogadores cabem na mesma altura que
os 16 reservas de hoje**. E se o elenco crescer de novo, a tela **não cresce junto** — só
a rolagem de dentro da tabela.

### Estado
Nada codado. Próximo passo oferecido: montar de verdade, com o elenco real dele.

## 16/09/2026 (parte 10) — 👥 O elenco no estilo da REFERÊNCIA que ele mandou

Diego mandou o print de um jogo de futebol (tela "MEU TIME · ESCALAÇÃO E ELENCO",
escura/cromada, campinho à esquerda com só os 11 e tabela de reservas à direita):
*"e algo inspirado nisso aqui, claro q no nosso padrão de arte. Os reservas de um lado
e no campinho só os titulares e etc"*.

Material: `node scripts/mockup-elenco-referencia.mjs`. **Desenho, nada codado.**

### 🔑 Por que a referência dele é MELHOR que as minhas duas saídas
Transbordo e empilhado tentavam **consertar** o problema de duas listas de tamanhos
diferentes na mesma linha. A referência **não tem esse problema**: troca o par
`titulares | reservas` pelo par **`campo | lista`**. Não são duas listas competindo, são
duas coisas diferentes — **nunca sobra buraco**, e o elenco pode ir a 27 que a tabela só
ganha linha. Anotar isso: quando o layout tem o problema embutido, **trocar o par** é
melhor que remendar.

### O que peguei dela
- No campinho, **só os 11** (já é assim hoje — a referência confirma).
- A lista vira **TABELA densa**: Nº · camisa · nome · POS · nível · gás.
- Botão **TITULARES / RESERVAS** em cima da tabela (uma lista por vez).
- Comissão técnica no pé.

### O que mudei, e por quê
- **Sem as setas "PARA RESERVAS / PARA TITULARES"**: o nosso jogo troca por toque-toque,
  que é mais rápido no celular e ele já aprovou. As setas existem lá porque é jogo de mouse.
- **No CELULAR, um em cima do outro** (430px não comporta campinho em metade da tela);
  **lado a lado só no PC**, onde hoje o jogo desperdiça mais da metade do monitor
  (~620px de 1440).
- **O jogador tocado mostra a CARTA dele**, não ficha genérica de atributos — a carta
  colecionável já existe no jogo.

### ⛔ O que NÃO dá pra copiar (achado importante)
A coluna **"GER"** (overall de cada jogador). No nosso jogo isso é **perk pago**:
`olheiros` + tier (⭐ Craque vê até craque · 👑 Lenda vê tudo, ver `ElencoField`).
Pôr o número pra todo mundo **entrega de graça o que a loja vende**.
👉 Na versão desenhada a coluna mostra o **NÍVEL** (🪵🎯💎⭐👑), que todo mundo já vê, e
o **número** aparece no lugar do selo só pra quem tem olheiro. Mesma tabela, sem furar a loja.

### Estado
Nada codado. Próximo passo oferecido: montar a tela DE VERDADE com o elenco real dele
(como já foi feito com o bloco da SAF e com o transbordo) antes de qualquer commit.

## 16/09/2026 (parte 9) — 👥 A aba ELENCO refeita do zero (OPINIÃO, corrigindo a parte 8)

⚠️ **Correção de leitura minha**: na parte 8 ele perguntou *"e se fosse reformular na sua
cabeça todo visual"* e eu respondi do JOGO INTEIRO. Ele corrigiu: *"eu falei do elenco,
cara, que a gente tava falando"*. Era a **aba Elenco**. Lição: quando a conversa está
num assunto há várias mensagens, "todo visual" quer dizer **o visual DAQUILO**.

Material: `node scripts/mockup-elenco-do-zero.mjs`. **Opinião, nada codado.**

### A pergunta antes do desenho: pra que serve a aba?
Ela faz **três** trabalhos: **escalar** (quem joga a próxima) · **conhecer** (quem eu
tenho e como está) · **gerir** (técnico, preparador, base, folha, agência). Hoje eles vêm
**intercalados**: campinho → Depto Técnico → Base → folha → e só então a lista. Quem
entrou pra trocar um jogador **atravessa a gerência no caminho**.

### Os 5 pontos
1. **Agrupar por POSIÇÃO, não por titular/reserva.** Um bloco por setor (GOL/LAT/ZAG/
   MEI/ATA), bolinha cheia = titular, vazia = reserva. Motivo forte: **a troca do jogo já
   exige a mesma posição** (`a.pos !== b.pos` bloqueia), então a tela passa a falar a
   língua da regra. Técnico não pensa "quem é reserva", pensa "quem substitui meu goleiro".
2. **A escassez aparece sozinha**: o contador vai no título do setor — `GOLEIROS 2`, em
   vermelho quando está no osso. O problema dos 2 goleiros vira óbvio sem texto.
3. **Uma linha diz tudo do jogador**: nome · clube·ano · barra de gás · selo (🚑 😓 🔄 SAF).
4. **A gerência sai do meio do caminho**: Depto Técnico, Base e Agenciados viram três
   atalhos pequenos no pé, com o número que importa.
5. **O buraco nem existe**: cada setor é um bloco de 2 colunas, então no máximo sobra
   meia linha num setor ímpar.

### 🔑 A conta que amarra tudo (é o que fecha a conversa do elenco maior)
Hoje a lista são **16 linhas** (a coluna mais comprida) + 2 títulos.
Agrupada por posição: **11 linhas** + 5 títulos, **sem buraco**.
Com elenco de **27**: **14 linhas** + 5 títulos — ainda **menos** que as 16 de hoje com 22.
👉 **A mesma mudança que deixa a tela mais fácil também abre espaço pro elenco maior.**
Ele não precisa escolher entre as duas coisas.

### Estado
Nada codado. Ofereci montar a tela de VERDADE com o elenco real dele (como fiz com o
bloco da SAF e com o transbordo) antes de qualquer decisão.

## 16/09/2026 (parte 8) — 🎨 "Se fosse você, como reformularia o visual?" (OPINIÃO)

Diego: *"e se fosse reformular na sua cabeça todo visual sem ser influenciado por mim,
como vc faria?"*. Material: `node scripts/mockup-se-fosse-eu.mjs`.
**É opinião, está marcada como opinião, e nada foi codado.**

### A tese
**Não trocaria o estilo — trocaria a HIERARQUIA.** A identidade (creme, borda preta
grossa, sombra dura, Oswald) é patrimônio: quase todo jogo de celular parece o mesmo
app cinza, e este parece álbum de figurinha. O problema é que ela está aplicada em
TUDO IGUAL — a faixa "Torcida 45%" tem a mesma borda, a mesma sombra e o mesmo peso do
jogo ao vivo. Quando tudo grita, nada é ouvido.

### Os 6 princípios (com a tela redesenhada da aba Jogos, lado a lado com a real)
1. **Três pesos de superfície, não um** — moldura+sombra só no HERÓI; contexto vira
   linha lisa; ajuste vira texto. ⭐ **É a que eu faria se pudesse fazer só uma**: não é
   redesenho, é RÉGUA, e melhora toda tela junto, inclusive as que ainda não existem.
2. **Uma tela, um assunto** — a 1ª tela de cada aba responde UMA pergunta; o resto é um
   toque, não um rolar ("ver a tabela inteira →" em vez de 100 linhas).
3. **O botão mora sempre no mesmo lugar** — barra de ação fixa no pé, acima das abas; só
   o rótulo muda (Começar a temporada · Próxima rodada · Decida quem fica).
4. **O dourado só pode querer dizer UMA coisa** — hoje é tier 👑 E botão E destaque E
   moeda. Dourado = identidade de quem você é; botão vira verde. Reforça a regra dele de
   "cor é sagrada" em vez de enfraquecer.
5. **Oswald é para número e título** — parágrafo em fonte de sistema, caixa normal.
6. **O vazio trabalha** — borda 2px/sombra 2px no secundário encolheria ~20% de toda tela.

### E o ELENCO POR POSIÇÃO (a mudança que eu mais defenderia)
Hoje são duas colunas (titulares | reservas) e a pessoa **filtra por posição com o olho**.
Técnico não pensa "quem é reserva" — pensa **"quem substitui meu goleiro?"**. Agrupado por
setor (GOL/LAT/ZAG/MEI/ATA) com bolinha cheia = titular, o problema dos **2 goleiros**
aparece sozinho na tela, sem precisar de texto explicando.

### Onde eu discordo dele — dito na cara (e ele pediu assim)
1. **A caixa grande de "criar conta"** (que ELE pediu chamativa em 21/08): é a 1ª coisa
   das 5 abas e só some pra quem JÁ fez conta — quem mais joga sem conta é quem mais
   apanha dela. Eu faria discreta no dia a dia e GRANDE uma vez, na hora que dói (acabou
   de ser campeão e a carta só existe com conta).
2. **A faixa do Desbloquear**: aparece em toda aba de toda rodada e TIRA do jogo. Uma vez
   por temporada, como modal. A regra de ouro dele é "nada atrasa o ritmo".
3. **O estádio sagrado**: concordo com a regra, discordo da execução — hoje ele começa em
   y=740. A regra está certa; falta ela valer na prática.

### O que eu jamais tocaria, mesmo com carta branca
Paleta · Oswald · sombra dura · campinho · desenho do estádio · zoeira dos textos.
O jogo tem cara própria, que é a coisa mais difícil de conseguir. O trabalho seria
**fazer essa cara aparecer mais, usando ela menos.**

## 16/09/2026 (parte 7) — 🕳️ "Ficou um buraco na esquerda" (duas saídas, ele escolhe)

Diego, olhando a tela real do elenco de 27: *"não sei se gostei pq ficou um buraco na
esquerda"*. Ele está certo, e a causa é estrutural: as duas colunas da lista são
**FIXAS** (⭐ Titulares | 🔁 Reservas). Com 27, os titulares continuam **11** e os
reservas viram **16** — a esquerda acaba antes e sobra vazio verde.

Material: `node scripts/mockup-buraco-elenco.mjs`.
Rascunho (não commitado no jogo): `docs/rascunhos/2026-09-16-elenco-27-e-bloco-saf.patch`,
agora com `layoutListas?: 'hoje' | 'empilhado' | 'transbordo'` em `ElencoField`/`SquadTab`.
A bancada aceita `?layout=` pra ver as três: `/scripts/teste-elenco/index.html?n=27&layout=transbordo`

### As duas saídas, medidas na tela real (454px, PT)
| layout | elenco 27 | elenco 22 (o que está no ar) |
|---|---|---|
| como está | 2427px | 2152px |
| **transbordo** | **2339px** (−88) | **2152px — IDÊNTICO** |
| empilhado | 2350px (−77) | 2240px (**+88**) |

- **transbordo** = o reserva que não cabe **continua na coluna da esquerda**, embaixo dos
  titulares, com um risquinho `🔁 RESERVAS (CONTINUA)`. Nada some, nada muda de lugar.
- **empilhado** = cada lista ocupa a largura toda em 2 colunas próprias (titulares em
  cima, reservas embaixo). Título mais legível.

### 👉 Recomendado: TRANSBORDO — e o motivo é o número da direita
No elenco de **22**, que é o que está no ar pra todo mundo, o transbordo dá **2152px,
exatamente igual** ao de hoje: com 11 e 11 as colunas já batem, então a conta
(`porColuna - titulares.length`) dá 0 e **o risquinho nem aparece**. Ele só entra em ação
quando o elenco cresce — que é quando o buraco existiria.
O **empilhado** custa **+88px na tela de TODO MUNDO**, inclusive de quem nunca vai querer
elenco maior. Por isso é a 2ª opção.

### O que isso muda na decisão do elenco
O buraco **deixa de ser motivo** pra não fazer o +1 por posição: com transbordo, 27 fica
mais curto (2339) que 27 de hoje (2427). **Mas o que continua de pé** é o que já estava
anotado na parte 6: o meio-campo vira **9** (já sobrava com 8) e o leilão passa a precisar
de **5 cartas a mais por técnico** na mesa. **MEDIR ANTES.**

### Estado
Nada no ar. Esperando ele dizer qual layout quer.

## 16/09/2026 (parte 6) — 👥🏢 A tela DE VERDADE: +1 por posição e a SAF em bloco

Diego: *"e como ficaria real com um jogador a mais por posição a imagem do elenco…
e a SAF com bloco à parte?"*. Então saiu do desenho e foi pra tela real.

### ⛔ O rascunho NÃO está no código do jogo
Mora em **`docs/rascunhos/2026-09-16-elenco-27-e-bloco-saf.patch`**.
Ligar quando ele aprovar: `git apply docs/rascunhos/2026-09-16-elenco-27-e-bloco-saf.patch`
Material pro post: `node scripts/mockup-elenco-real.mjs`.

### O que o rascunho faz (2 mudanças)
1. **`slotsCheio()` em store.tsx**: `baseSlots * 2` → `baseSlots * 2 + 1` (elenco 22 → 27).
2. **`ElencoField` em pyramidseason.tsx**: o emprestado sai da lista de reservas
   (`reserves` agora filtra `!c.emprestado`) e ganha **bloco próprio** no pé da tela —
   cinza-ardósia, duas colunas, contador de vagas da divisão (`4/4`) e a frase
   *"eles jogam por você, mas são da sua SAF — não ocupam vaga do seu elenco"*.
   Props novas `safDiv` / `safSlots`, passadas por `SquadTab`.

### Medido na tela real (SquadTab de verdade, celular 454px, em PT)
| | rolagem | titulares | reservas | bloco SAF |
|---|---|---|---|---|
| hoje (22) | 2152px · 2,4 telas | 11 | 11 | — |
| +1 por posição (27) | 2427px · 2,7 telas | 11 | **16** | — |
| 27 + 4 da SAF (31) | 2630px · 2,9 telas | 11 | 16 | **4/4** |

**O campinho não muda em nada** — são sempre os 11 da formação. Todo o crescimento é
na coluna da direita. E tirar os emprestados da lista deixa a coluna de reservas
**mais curta** do que se eles ficassem misturados.

### 🐛 Consertado de lambuja: a bancada montava o XI errado
`scripts/teste-elenco/main.tsx` usava `squad.slice(0, 11)` como titulares — o que punha
**3 goleiros em campo** e deixava o campinho com cara de bug. Quem olhasse o print ia
achar que o JOGO estava quebrado. Agora o XI sai por posição (4-4-2), como o jogo escala.
Isso é conserto de bancada e **foi commitado** (não é visual do jogo).

### O que continua ABERTO
O **+1 por posição** mexe na régua "2× a formação", que **não é só do elenco**: o leilão
usa pra saber quantas cartas pôr na mesa, o Monte pra ordenar quem escolhe, a base pra
saber se cabe guri. Na tela custa 5 linhas; **no jogo custa 5 cartas a mais por técnico
na mesa do leilão** e folha salarial maior. **MEDIR ANTES de soltar.**
O **bloco da SAF**, esse, melhora a tela mesmo SEM mexer no tamanho do elenco.

## 16/09/2026 (parte 5) — 🏢 As 4 ideias da SAF DESENHADAS + a quantidade do elenco visual

Diego: *"quero todas ideias pra saf e pro elenco quantidade visual"*.
Material: `node scripts/mockup-saf-ideias.mjs`. **Nada foi codado** — é desenho pra ele
aprovar ou vetar.

### A quantidade do elenco, camisa por camisa
Grade por posição (4-4-2, Série A) nas três opções, com as vagas desenhadas:
bege = elenco próprio · roxo = vaga nova · cinza tracejado = emprestado da SAF (entra
POR CIMA do teto). **Hoje 22 · +1 goleiro 23 · +1 em tudo 27.** A linha do GOL mostra
sozinha o argumento: 2 em todas as 7 formações, contra 8 no MEI.

### As 4 ideias, cada uma como TELA
1. 🌱 **A SAF forma jogador** — painel da SAF com barra de jogos ("24 de 38 · piso 66→71")
   e o cartão da virada ("Kerlon voltou da SAF · piso 66 → 71"). Quem fica no banco lá
   volta quase igual: tem que JOGAR. Reaproveita a mecânica de piso que já existe
   (artilheiro +10). ⚠️ mexe em ficha dentro do save (não no catálogo) e precisa de teto.
2. 🎽 **A SAF é o teto do elenco** — a aba Elenco com bloco próprio "SEU ELENCO 22/22" +
   "🏢 DA SUA SAF · SÉRIE B 2/3", e a escada Várzea 22 → Série A 26. Quase só leitura de
   tela: hoje o emprestado se mistura na lista com um chip "EMP" cinza.
3. 💰 **Emprestar vira dinheiro** — janela de empréstimo com luva por temporada
   (+8 🪙 · +12 🪙). Vira a TERCEIRA saída da crise do caixa no vermelho (a de hoje de
   manhã), sem perder ninguém. ⚠️ medir a régua antes: pouco dinheiro, senão vira torneira.
4. 📰 **A SAF no jornal** — página 2 (que já existe) com "Sua SAF subiu pra Série C",
   "Kerlon foi artilheiro da Série D", "a SAF quase se enrolou". Zero regra nova.

### Ordem recomendada, se ele quiser todas
1º jornal (mais barata, zero regra) · 2º +1 goleiro · 3º bloco da SAF no elenco ·
4º a SAF forma jogador (a que muda o jogo — fazer com calma e com teto) ·
5º a luva (mexe em dinheiro → medir antes).

### Continua pendente
O **+1 em todas as posições** (caminho A). Se ele mandar, MEDIR ANTES o efeito no
tamanho da mesa do leilão (5 cartas a mais por técnico) e na folha salarial.

## 16/09/2026 (parte 4) — 👥🏢 Elenco maior + o que fazer com a SAF (LEVANTAMENTO, nada codado)

Diego: *"poder colocar mais jogadores no elenco… mais um goleiro, mais um meia, mais
um lateral, mais um zagueiro e mais um atacante. Mas o meu problema é esteticamente…
porque também tem a SAF, que pode pegar até quatro emprestados. Tô com medo de ficar
muito exagerado… ou eu limitar a SAF se eu já tiver com o elenco cheio. Mas aí pode
ser que a SAF também não tenha mais sentido ter. E já me fale sobre a SAF também, se
tem alguma ideia nova pra reformular"*.

Material pra ele: `node scripts/mockup-elenco-e-saf.mjs`.

### As regras de hoje (conferidas no código, não de cabeça)
- **Elenco** = `slotsCheio()` em `store.tsx` → `FORMATIONS[f][pos] * 2`. Sempre 22.
- **Empréstimo da SAF** (`estadio.tsx`) = **por lado**, por divisão: D 1 · C 2 · B 3 · A 4.
  **Não é troca** — dá pra pegar sem emprestar. E quem entra vem **por cima** do teto,
  então o teto real na Série A já é **26**, não 22.
- **Troca em campo exige MESMA posição** (`a.pos !== b.pos` → bloqueia).

### 1) Cabe na tela? CABE.
Medido na bancada `scripts/teste-elenco/` (SquadTab de verdade, celular 454px, em PT):
**22 → 2152px · 27 → 2427px (+275) · 31 → 2647px (+495)**. De 2,4 pra 2,7 telas; no teto
com a SAF, 2,9. A lista é em DUAS COLUNAS, então cada jogador novo empurra meia linha.

### 2) O achado: o aperto NÃO é igual em todas as posições
`FORMATIONS[f][pos] * 2` dá **MEI 8** no 4-4-2 (sobra) e **GOL 2** — e **GOL é 2 nas 7
formações do jogo**, sem exceção. Titular machucado + reserva suspenso (ou os dois
cansados, agora que existe gás) = buraco, e **não dá pra pôr zagueiro no gol**. Entra
perna-de-pau, que é o que ele mais odeia.
👉 **+1 no meio resolve um problema que não existe; +1 no gol resolve o único que existe sempre.**

### 3) Três caminhos apresentados
- **A) +1 em cada posição** (27, +4 SAF = 31): é o pedido dele. Mexe na régua "2× a
  formação" que o leilão, o Monte, a base e a SAF usam — o leilão passa a precisar de
  **5 cartas a mais por técnico** na mesa, e a folha cresce.
- **B) só +1 goleiro** (23, +4 SAF = 27): +55px. **Foi a minha recomendação.**
- **C) não mexe; a SAF é o caminho de passar de 22.** Custo zero.

### 4) A SAF — o medo dele TEM fundo
Hoje quase todo mundo só **PEGA** da SAF; ninguém manda ninguém pra lá. Se o elenco
sobe pra 27, sobra mais gente própria e **cai o motivo de pegar emprestado**:
**aumentar o elenco enfraquece a SAF de graça.** Ideias oferecidas:
1. 🌱 **A SAF FORMA jogador** (recomendada): quem passa uma temporada jogando NA SAF
   volta com o piso maior — mecânica que JÁ existe no jogo (o artilheiro sobe +10 de
   piso). Emprestar vira investimento, e o valor da SAF para de depender do tamanho
   do elenco. Custo médio.
2. 🎽 **A SAF é o teto do elenco** (= caminho C visto do lado dela). Custo zero.
3. 💰 **Emprestar vira dinheiro**: luva por temporada. Hoje é de graça dos dois lados.
4. 📰 **A SAF aparece no jornal** (página 2 já existe): "sua SAF subiu pra Série C".

### Estado
**NADA foi codado.** Esperando ele escolher. Se ele pedir o caminho A, o passo seguinte
é MEDIR o efeito no tamanho da mesa do leilão e na folha salarial ANTES de mexer.


## 👑📧 Entrada de Gala pela CONTA do dono (28/09)
Ordem do Diego: *"é pelo e-mail de batismo a entrada de gala e N pelo nome do time"*.
- ✅ A sala pergunta ao servidor (`esc_mimos_sala`) de quem é cada assento e acha o clube
  pelo `esc_socios` da conta (escudo_time → mascote_key). Nome digitado não vale mais:
  quem escreve "Neymarzetti" sem ser o dono não ganha gala; o dono que renomeou
  (Jurubeba → Meia na Canela) ganha.
- ✅ Eros FC estava como `socio` em `batismos.ts` por engano (no banco e no `apoio.tsx` é
  batismo nº 40) — corrigido.
- 🔒 Trava: `npm run gala` confere as 61 linhas reais de `esc_socios`
  (`scripts/gala-socios.json`, sem e-mail). Batismo novo → acrescentar a linha lá.
- ⚠️ Dono sem linha em `esc_socios` NÃO ganha gala — mais um motivo pro passo fixo do banco.
- ✅ 28/09 (Diego: "Libera"): sócio por assinatura COM clube próprio (Futpoint FC, Marinheiros AS)
  também ganha a gala — sempre pela conta. Sócio sem clube (linha sem escudo/mascote) continua sem.

## 29/09/2026 — 🧱 Leilão de Clubes repetindo (Fiorentina ataque, Flamengo lateral) — ✅ LOTE 37 NO AR
Diego: *"toda hora aparece ataque da Fiorentina… lateral do Flamengo… precisa diversificar"*.
Causa: o pacote só sai de clube com jogador SOBRANDO no setor (4-3-3: GOL 2 · LAT 3 · ZAG 3 · MEI 4 · ATA 4)
e o clube não repete entre setores. Nos 3 baralhos: GOL 37 · LAT 32 · ZAG 35 · MEI 39 · ATA 41 clubes.
Os grandes somem pra defesa primeiro (setor mais apertado escolhe antes) e o ataque fica com o que sobra.
E a memória de "não repetir" (`RECENT_CLUBES`) guarda só 3 partidas e zera ao recarregar.
Proposta (conferida nome+sobrenome no MESMO baralho): 30 cartas que fecham 1 setor cada —
LAT: Spinazzola (Roma) · Gayà (Valencia) · Lee Dixon (Arsenal) · Seamus Coleman (Everton) · Benarrivo (Parma) ·
Mancini (Atlético-MG) · Kurzawa (Monaco) · Chilwell (Leicester) — ZAG: Smalling (Roma) · Subotić (Dortmund) ·
Garay (Valencia) · Javi Navarro (Sevilla) — MEI: Malouda (Lyon) · Xhaka (Leverkusen) · Parejo (Valencia) ·
Riquelme (Villarreal) · Lincoln (Schalke) · Gaitán (Benfica) — ATA: Defoe (Tottenham) · Tadić (Ajax) ·
Paco Alcácer (Valencia) · Chris Waddle (Marseille) · Ulf Kirsten (Leverkusen) · Brolin (Parma) · Louis Saha (Fulham) ·
Oribe Peralta (América do México) · Charles (Bahia) — GOL: Marcelo Grohe (Grêmio) · Peruzzi (Lazio) · Weidenfeller (Dortmund).
+ ideia no código: guardar no aparelho as últimas ~8 partidas (não 3, e sem zerar no reload).
✅ Diego aprovou (*"coloque… junto desses"*) + pediu Raul (já existia: Raul Plassmann Cruzeiro 1976) e Palhinha
(Cruzeiro 1976, ATA, entrou). = LOTE 37, 31 cartas (BR 4 · EU 26 · Mundo 1). Clubes com pacote (4-3-3, 3 baralhos):
GOL 37→40 · LAT 32→40 · ZAG 35→39 · MEI 39→45 · ATA 41→50. Mancini e Riquelme em MESMO_JOGADOR; os dois
Lincoln (Schalke 2006 × Flamengo 2019) são pessoas DIFERENTES, cada um em PAIS_POR_CARTA.
⏳ Falta resposta dele: a memória de "não repetir clube" guardar ~8 partidas no aparelho (hoje 3, zera no reload).
✅ 29/09 (Diego: *"varie mais… quando for escolhido o leilão de clubes"*): o sorteio do Leilão de Clubes
(`buildDeckClubes`) virou RODADAS — um clube por setor de cada vez, o setor mais apertado escolhe primeiro
em cada rodada. Antes cada setor pegava tudo de uma vez e o ATAQUE ficava sempre com a mesma sobra.
Simulação (20 partidas seguidas, 8 técnicos): clubes diferentes no ataque 27 → 50; Fiorentina/Fulham/Goiás/
Santa Cruz saíam em 20 de 20. Memória "não repetir": 3 partidas só na memória → 8 partidas no aparelho
(`esc-clubes-recentes-v1`, chave ÚNICA, não é por sala), com nota por recência e setor.
⚠️ Sala de 10+: pede ~75 clubes de ~90 que servem — aí só MAIS CLUBE resolve (lista do Mundo mandada ao Diego).
✅ 29/09 LOTE 38 NO AR — 🌍 40 cartas de clubes do MUNDO (Diego: *"time do Japão, da Arábia… só famoso"*; categorias
aprovadas: Neymar no Al-Hilal = Bom Jogador, Zico no Kashima = Lenda). Pacotes novos: Al-Nassr/Al-Hilal/Al-Ittihad/
Al-Ahli/Inter Miami/LA Galaxy (ATA) · Toronto/Vissel Kobe/Guangzhou (ATA) · LA Galaxy/Kashima (MEI) · Al-Hilal (GOL).
8 escudos oficiais novos (`escudos-oficiais.mjs`: MLS + FCLOGO) + selos. Irlanda: nenhum famoso em clube irlandês.
Clubes com pacote agora: GOL 41 · LAT 40 · ZAG 39 · MEI 47 · ATA 59.
📏 Simulação (20 partidas): sala de 8 → o mais repetido sai 13 de 20; sala de 10 → LATERAL vira o gargalo
(PSV, Monaco, Leicester em 20 de 20). ⏭️ Próximo lote, se ele quiser: LATERAIS famosos (e goleiros).
✅ 29/09 LOTE 39 NO AR — 🗽 Ataque do NEW YORK COSMOS (Diego: *"Pelé no Cosmos… complete… Pelé será lenda"*):
Pelé 1977 (Lenda) · Chinaglia 1978 (Craque) · Raúl 2015 · Dennis Tueart 1978 → pacote "Ataque do Cosmos".
+ Romerito no FLUMINENSE 1984 (Craque, baralho BR; a carta do Cosmos 1982 continua no Mundo).
Ele disse "só isso": o MEIO do Cosmos (Neeskens, Marcos Senna, Arango) e os zagueiros (Beckenbauer, Carlos
Alberto) NÃO entraram. ⚠️ A bio do Romerito no Cosmos diz "o Cosmos de Pelé" — ele chegou em 1980, o Pelé
parou em 1977 (ofereci corrigir; sem resposta). Escudo oficial do Cosmos: só no football-logos (host bloqueado).
⏭️ Pedido dele: MOCKUP de stories com TODOS os novos (Lotes 37, 38, 39).
✅ 29/09 — 🔁 Michael saiu do Flamengo 2020 (BR) e foi pro AL-HILAL 2022 (Mundo, Lote 39), mesma força. Na home
aparece SÓ como carta nova (Diego: *"coloque como se fosse nova"*) — tirei o "saiu" do gerado; a foto do baralho já
está atualizada, então o `npm run novidades` não traz de volta. Stories: `node scripts/mockup-novos-stories.mjs`
(carta CEGA por padrão — Diego: *"sem categorias eu disse"*).
✅ 29/09 — 🔁 Fabrício Bruno: Flamengo 2023 → CRUZEIRO 2025 (mesma força, baralho BR). Flamengo fica com 14 zagueiros; Cruzeiro vai a 4 (pacote de zaga com folga). Troca no mesmo baralho não vira novidade na home.

## 29/09/2026 — ⏭ TELA DA TRAVA DO MODO MANUAL redesenhada ✅ NO AR
Registros de 30 dias: 1.422 pessoas bateram na trava (⏭/velocidade da carreira), só 49 copiaram o Pix do Craque
(últimos 7 dias: 458 × 9). Diego: *"muita gente tá apertando mas tá saindo e desistindo"*. A tela virou o mockup
aprovado (`scripts/mockup-trava-manual.mjs`): "Quer acelerar? Isso é do Craque." · controles desenhados · a mesma
carta "hoje ??" × "com o Craque 82" (é NÍVEL, nunca "nota"/"overall") · faixa "e vem junto" (nome prata nas salas
online · Olheiro acha jogador fora do leilão até Craque · 4 carreiras · grupo VIP no WhatsApp com o Diego) · preço ·
Pix · 3 passos (o 2 é o botão do Instagram) · botões 👑 Ver o Lenda / 🖋 Ver o Batismo (abrem os planos já no card).
`SupportManualPreview`/`SupportCraqueBenefits`/`SupportPlanCard` continuam em `support-plans.tsx` (a tela de planos usa).
✅ A TELA DE PLANOS ("água na boca", `scripts/mockup-planos-agua-na-boca.mjs`) TAMBÉM FOI PRO AR (Diego: *"após isso
publique"*): `SupportPlans` em `support-plans.tsx` virou vitrines — a sala com Neymarzetti/Al Takhadao em ouro, Bolacha em
prata e "Seu Time" na cor do usuário (a linha "bora mudar isso?" só aparece pra quem é bege); Craque/Lenda com a linha
prata/ouro, controles e carta com NÍVEL; Batismo com escudo + mascote (componentes reais) + camisa da Loja
(`public/mantos-salao/al-takahdao-camisa.webp`) e as 3 miniaturas (gala, carimbo, tabela); teaser "vem por aí" só com os 2
que ele deixou. Sócio (add-on mensal) e história do Luca continuam. Medir em 2 semanas:
Pix do Craque copiado ÷ pessoas que bateram na trava (hoje 3,4%).

## 29/09/2026 — 🐊 Solta a mascote no MONTE: qualquer sala + 5s de espera ✅ NO AR
Diego (print do Monte de um Leilão de Clubes por envelope, com o bicho empilhado): *"nessa área aqui seja pra
qualquer tipo: Clubes, Jogador, Tocaia ou Envelope… coloque com 5s apenas pra poder enviar"*. REVOGA a regra de
21/09 ("só no Monte da Tocaia"): `MascoteJab` aparece no Monte de todo tipo de sala (o `MascoteAtravessa` já era
montado lá sem condição, então não nasce botão mudo) e ganhou `MASC_JAB_COOLDOWN_S = 5` com contagem no botão,
igual ao lobby. O pregão do envelope cego continua com a mascote na barra "😈 CUTUCA". Só pra clube batizado.
✅ 29/09 — 🔁 Rafael Vaz: Flamengo 2016 → VASCO 2015 (auge, bi carioca) · Erazo: Flamengo 2014 → GRÊMIO 2016 (Copa do Brasil). Mesma força, baralho BR; troca no mesmo baralho não vira novidade.

## 📋 DRAFT nas Minhas Ligas (19/10) — ideia do Diego, MOCKUP enviado, aguardando OK
Lembrança dele do PES 19 com os amigos: *"tinha só um Neymar pra todo mundo… o primeiro escolhia primeiro"*.
- Cada jogador é ÚNICO na liga.
- Temporada 1 = leilão de sempre, mas só com jogador FRACO (*"todo mundo começou com time ruim"*).
- A cada temporada: noite do draft, **1 jogador por técnico**, de **TODOS os jogadores do jogo** (lenda inclusa).
- Ordem = tabela, **campeão escolhe primeiro**.
- Cada escolha é revelada na hora pra sala inteira (carta coberta → vira), suspense.
- Mockup: `scripts/mockup-draft.mjs` → `scripts/mockups/draft.png` (tempo de 60s (pedido dele), "quem sai pra ele entrar" são propostas minhas).
- Anúncio com suspense (pedido dele: *"o suspense tem q ser grande"*): pistas a cada 2s — posição → cor da categoria → país+década com as cores do clube → vira a carta. `scripts/mockup-draft-anuncio.mjs` → `scripts/mockups/draft-anuncio.png`.
- A carta que vira é a CARTA REAL do jogo (`CollectibleCard`: lenda com avatar, craque prata com a inicial) — pedido dele: *"o resultado tem q ser a carta real do jogador"*. No mockup, cartas de verdade do baralho (Romário Vasco 2000, Thiago Silva Fluminense 2008, Alex Muralha Flamengo 2017).
- 🔁 Virou MODO PRÓPRIO "📋 Liga Draft" (ao lado de Rápido/Minhas ligas/Carreira/Bafo), que fica de pé igual Minhas Ligas. Criar: nome + senha + jeito do lance (Envelope/Tocaia/Pregão aberto). Fixo: só jogador (sem Clubes), baralho Todos, 1ª temporada só profissional e bom, campo normal. Mockup `scripts/mockup-draft-criar.mjs` → `scripts/mockups/draft-criar.png`.
- ✅ **PUBLICADO 19/10 SÓ NA CONTA DO DIEGO** (*"pode publicar só pro meu usuário… ninguém pode ver"*). Trava `LIGA_DRAFT_GERAL = false` +
  `LIGA_DRAFT_TESTERS` (sport.ts). Quem ele chamar com código + senha entra e joga; a sala NÃO aparece na lista de salas abertas
  (coluna `ls_draft`, migration `20261019200000_ls_draft.sql`). Código: `liga-draft.ts` (regras), `liga-draft-tela.tsx` (tela),
  DRAFT_ABRIR/ESCOLHER/TICK no store, botão "📋 Abrir a noite do draft" no fim da temporada. Trava: `npm run liga-draft`.
  Bancada de print: `scripts/teste-draft/` (`DEPLOY_BASE=/ VITE_ONLY_GAME=escalacao npx vite`, abrir `/scripts/teste-draft/?cena=revela&t=5000`).
  Decisões MINHAS (confirmar com ele no 1º teste): **bots não escolhem no draft** (só gente) · quem sai do time fica livre na liga ·
  sem Copa (só a liga) · solo (sem duplas) · se entrar gente nova (ou alguém sair) a liga recomeça no leilão fraco (troféus ficam).
  Pra liberar geral: `LIGA_DRAFT_GERAL = true` + linha em `novidades.ts`.

## 📺 JOGO AO VIVO NO CAMPINHO (20/10) — mockup enviado, aguardando OK
Diego: *"tá chato… começa a simulação, fica parado… preciso de uma ideia imersiva… mas tem outros usuários reais, tem que ser
tudo ao mesmo tempo"*. Ele recusou várias listas de ideias (lenda relâmpago, eventos, missões, botões soltos…) e topou ver ESTA:
cada rodada vira ~90 s de jogo pra assistir (campo de cima, 22 com rosto das cartas, bola, narração), reação ao vivo
(🔥 pra cima · ⚖️ · 🧱 fecha), preleção de 5 s no intervalo e a "rádio" com os jogos dos amigos. O gol mostrado é o que o motor
já calculou (mesmo autor/minuto/placar pra sala toda; relógio do dono). Base possível: a partida no estádio da Presidência
(`presidencia-partida*.tsx`). Mockup: `scripts/mockup-jogo-ao-vivo.mjs` → `scripts/mockups/jogo-ao-vivo.png`.
- ✅ **20/10 — ELE ADOROU O VÍDEO** (*"achei sensacional… gostei muito do motor, a bola batendo na trave"*). Decisões dele:
  · Vira uma opção na hora de CRIAR A SALA: **⚡ Padrão rápido** (o de sempre, o de hoje) **ou 📺 2D** (o novo). Nome: "2D".
  · **Velocidade do 2D no automático = a do vídeo.** Só no MODO MANUAL o dono muda a velocidade.
  · **Estilo do jogador** (*"Ronaldinho, Neymar driblam; Xavi passa; Gattuso rouba bola"*): o lance que aparece puxa pelo estilo
    da carta. ⚠️ Regra dele de não inventar pessoa real: estilo marcado À MÃO só pra quem é conhecido por aquilo; o resto fica no
    estilo neutro da posição.
  · **MUITA variedade de lance**: chute por cima, escanteio batido, gol de cabeça, falta, trave, defesa, desarme, contra-ataque…
  · Gol: mascote grande (quem tem) ou "GOOOL" + escudo (quem não tem) + faixinha "⚽ AUTOR min · 🅰️ assist" — sem rosto.
  · Bolinha na COR DA CAMISA do time (nunca da categoria); lenda = rostinho com anel na cor do time; camisa parecida → visitante
    com a 2ª cor.
  · Sem intervalo.
  ✅ **Tempo: 1:30 por jogo** (*"pode ser 1:30"*), mesma velocidade de bola do vídeo, menos lances por partida (liga ≈ 1h).
  ✅ **Estilo só das LENDAS** (*"não precisa fazer 2.500, só das lendas… são menos de 200"*): 196 cartas / 184 nomes de lenda
  ganham estilo à mão; o resto joga no estilo neutro da posição.
- ✅ **20/10 — PARTE 1 FEITA, SÓ NA CONTA DO DIEGO** (*"não coda pra todo mundo não, mas já começa a fazer"*): o 📺 Campo 2D na
  CARREIRA SOLO. Botão "📺 Ver o jogo no Campo 2D" no 🎮 Controle da partida (junto do Manual); ligado, o jogo dura 1:30 no auto
  (`DUR_2D_MS`) e no Manual a marcha de sempre acelera. Motor: `campo2d-motor.ts` (monta as jogadas em volta dos gols e das
  chances que o jogo já calculou; 8 moldes: enfiada, cruzamento, chute de fora, drible, tabela, contra-ataque, escanteio, falta;
  enfeite com PRAZO pra o gol sair no minuto) · estilos das 184 lendas em `campo2d-estilos.ts` · tela `campo2d.tsx` (mascote
  grande no gol e o carimbo do placar some — `semCarimbo`). Trava `npm run campo2d` (300 jogos: placar do campinho = do jogo;
  mediana de atraso 0,5'). Bancada: `scripts/teste-campo2d/`. Gate `CAMPO2D_GERAL`/`CAMPO2D_TESTERS` (sport.ts).
  ⏳ Falta: (2) salas online — escolha "⚡ Padrão rápido · 📺 2D" ao criar; (3) Copa/Liberta na carreira; (4) trava de PLANO
  (⭐ Craque+) quando liberar; (5) mais variedade de lances (pênalti NÃO — tem tela própria); (6) a narração da faixa do placar
  ainda pode falar de outro lance que o campinho.
- ✅ **20/10 — CARA DE ESTÁDIO** (pedido: placas atrás dos gols, telão embaixo, técnico na beira): as MESMAS placas do campinho
  do jogo (`PlacaGol`, Vadico/Tidex trocando) em cima e embaixo do campo · arquibancada nas laterais com a torcida nas cores
  dos dois times (pula no gol) · os dois TÉCNICOS na beira do campo (nome do `careerTecnicos` + balão "🔥 Pra cima!" /
  "🧱 Fecha a casinha!" no começo, "🙌 É GOL!" / "🤦 Não acredito…" no gol) · selo da TV no canto (sigla · placar · minuto).
  O telão (GiroDaRodada) continua EMBAIXO de tudo, sem mudança. 🐛 Consertado junto: a tela do GOL ficava presa até o fim do
  jogo (o efeito do desenho rodava de novo e esquecia que o GOL estava aberto — agora a memória fica num `useRef`).
- ✅ **20/10 — 📐 ORGANIZAÇÃO E SINCRONIA DAS DUAS EQUIPES NO 2D** (Diego: *"olhar a movimentação das duas equipes, o controle de bola,
  a organização… a sincronia principalmente de todos, sincroniza quando a bola para por ser falta… analise a fundo"*). Auditoria lance a
  lance em 150 jogos, antes → depois: 🏃 jogador "pulando" (mais de 13 m/s) 15.540 → ~60 amostras (teto de corrida 13 m/s; o empurrão
  do espaçamento virou passo de lado; a saída depois do gol não teletransporta mais — o time CORRE pro lugar e a bola só rola com cada
  um no seu campo e o rival fora do círculo) · 🧍 dois grudados com a bola rolando 2.607 → ~110 (o recebedor do passe era SORTEADO de
  novo a cada instante e vários corriam pro mesmo ponto; "vai buscar a bola" ficava com quem já tinha perdido a bola; ordem cumprida e
  não renovada expira em 3 s; duas ordens pro mesmo ponto → um vai pro lado; marcador a 1,7 m do dono, não dentro dele) · 🧤 tiro de
  meta com rival dentro da área 119/285 → ~5 (o rival sai e o goleiro espera) · 🧱 falta com rival a menos de 9,15 m 38/42 → 0 (a
  barreira é dos 4 mais perto dela; quem fez a falta sai; a bola não anda mais com o batedor sendo empurrado; o batedor chega na bola;
  só bate com a barreira armada) · 📏 lateral sem ninguém pra receber 20 → 0 (dois companheiros vêm dar opção; rival a 2 m) · 🚀 a
  jogada do gol que "tocava pro mais perto" podia voltar pro zagueiro e virar chutão de 75 m — agora só toca pra quem está à frente ·
  ⛳ escanteio de enchimento só com ~10 s livres (empurrava o gol). 🎯 Chute de fora da área: já existe (~1 em 5 chutes, de 22 a 33 m;
  nenhum do meio-campo) e agora a narração AVISA ("arrisca de fora da área…", 7 frases). Trava `npm run campo2d` cobra tudo isso
  (cobrança fora da regra de distância ≤ 1%, pulos, grudados). Atraso de gol: mediana 0,5', pior 5,5'.
- ✅ **20/10 — 📺 CAMPO 2D EM TODO LUGAR (só na conta do Diego até ele mandar liberar)** (*"tem que ser esse tempo aí também nas
  salas online… todos os tipos de liga, copa, Libertadores, Champions, Mundial, Copa dos Oito, regionais, Copa do Mundo… e o telão sempre
  embaixo… na carreira offline e online, só pra quem é Craque pra cima… botão manual e campo 2D com cadeadozinho"*). Feito:
  · sala online: a escolha 📺 2D vale em toda competição, também na sala de carreira e na revanche; Copa do Mundo e regionais pelo
    relógio do banco (2D = 1:30 e fecha 3 s depois do apito; sala normal igual a antes) — `docs/sql/copa-regional-clock-campo2d.sql`.
  · carreira offline, carreira online nova (botão junto da barra do PRONTO) e partida rápida offline: 2D = mesmo direito do Manual
    (Craque+). Cadeado único "🎮 Manual + 📺 Campo 2D"; carreira antiga com Manual de graça vê "📺 Campo 2D 🔒 Craque".
  · telão sempre embaixo do campinho (o da página se esconde enquanto o campinho está na tela).
  Decisão dele: **qualquer um cria sala com 2D** (não é pago no online). ⏳ Liberar pra todos = `CAMPO2D_GERAL = true` (sport.ts) quando ele mandar.
  ⚠️ Kings fica sem 2D (relógio e regras próprios).
- 🧪 **20/10 — MOTOR v2, FASE 1b (só no branch, NÃO publicado): goleiro · gás · bola parada ensaiada · árbitro · clima.** Diego:
  *"Pode fazer goleiro cara a cara, rebote pro lado certo, reposição curta ou longa pelo estilo; o gás caindo dentro do jogo
  (quem entra 😓 começa pior) com a régua que já existe; bola parada ensaiada (1º pau, 2º pau, curta) e árbitro de verdade
  (vantagem, cartão pela gravidade, acréscimo pelo que aconteceu); chuva, sol, sombras — às vezes sim, às vezes não, chuva mais
  rara"*. Feito em `motor2/` + `campo2d-clima.ts`: 🧤 sai pra fechar o ângulo no 1×1 (quanto sai = `saida`), "fica grande" (alcance
  cresce fora da linha), rebote pro LADO/longe se é bom e NA FRENTE se é fraco ou na chuva, `goleiro_linha`/`saida` alta repõe
  curto; 😓 `gasMod` vai junto do elenco (`comMods`) → entra em 0,82/0,68/0,55, cai ~0,2 no jogo (físico, correr, chuva) e pesa
  em velocidade, arranque, passe e decisão (medido: inteiro termina 0,83 · 😓 termina 0,65); 🏁 rotina por time (1º pau · 2º pau ·
  curta, 1 em 4 varia), barreira de 3 a 9,15 m, falta direta só pra quem é batedor; 🧑‍⚖️ vantagem (volta se perder a bola em
  2,5 s), cartão por carrinho/por trás/último homem/reincidência, acréscimos 1–3 e 1–5 pelos gols, cartões e faltas; 🌤️ clima
  preso na semente (sol 60% com sombra da arquibancada · nublado 28% · chuva 12%), chuva = bola corre mais e domínio erra mais.
  ⚠️ Vantagem e cartão ainda aparecem pouco porque o v2 dá poucas faltas (0,25/jogo) — é a calibração que depende da escolha
  A × B. 📸 O VISUAL do clima (campo2d.tsx, vale no v1 também) está no branch ESPERANDO O OK do Diego — não publicar na main
  sem ele ver a foto. Pendente alinhar com o `chuvaHoje` do estádio da Presidência (hoje são dois sorteios).
- 🧪 **20/10 — 📺 MOTOR 2D v2 (EXPERIMENTAL) — FASE 1 PRONTA, SÓ NO BRANCH, ESPERANDO DECISÃO DO DIEGO.** Pedido dele: motor
  com inteligência (estilo CM/FM), jogadas que emergem dos atributos, resultado que NÃO é decidido antes, lendas únicas,
  sem câmera lenta; **não publicar pra ninguém**. Diagnóstico, plano e números em `docs/motor-2d-v2.md`. Fase 1: `motor2/`
  (decisão a cada 0,25 s, física, duelos por atributo, goleiro, impedimento, faltas/cartões, narração só de evento real,
  estatística) + bancada `scripts/teste-campo2d/v2.html` + trava `npm run motor2`. Passes, física e determinismo OK.
  ⏳ **FALTA A DECISÃO DELE (seção 8 do doc): formato A "lances estilo FM" (recomendado) × B "jogo corrido intenso"** — futebol
  real dá ~1 chute por 1:30 de tela; sem roteiro, um dos dois. Depois: calibrar o bloco (hoje todo mundo embola no meio) e
  as "2 marcas por lenda" (lista pra ele aprovar).
- ✅ **20/10 — 🙂 ROSTINHO DAS LENDAS NAS COPAS DO 2D** (Diego: *"as lendas não estão aparecendo com rostinho… tô vendo só o
  Romário"*). Na liga o placar manda os 11 pro campinho; na Copa da carreira (Copa do Brasil/Legends, Supercopa) e nas
  internacionais (Liberta, Champions, Mundial) NÃO mandava — o campinho montava o time sem nome nem rosto. Agora vai o XI (e a
  formação, na Copa). Conferido no save dele: os 11 titulares (todos lendas) têm rosto desenhado. Efeito junto: a 📻 rádio dessas
  copas passa a citar o jogador pelo nome. ⚠️ Quem criar placar novo com o 2D: SEMPRE passar `elencos`.
- ✅ **20/10 — 🐌 FIM DA CÂMERA LENTA NO 2D + JOGO INTEIRO ANALISADO LANCE A LANCE** (Diego: *"daqui a pouco ela começa a andar
  em câmera lenta do nada… analisa um jogo completo… se tá tendo sentido igual um jogo de futebol real"*). Causas achadas:
  (1) 🐛 na conta dele (estádio do presidente liberado) o relógio do placar PARAVA a cada chance e gol esperando a cena do
  estádio, que com o 2D nem aparece — o campinho encostava no limite e freava. Com o 2D, o relógio é o de todo mundo.
  (2) chutão do goleiro e lançamentos a 13 m/s (59 m = 4,5 s boiando) → 22–28 m/s. (3) todo passe freava até ZERO no pé de
  quem recebe → chega com ~¼ da velocidade. (4) quem tinha a bola e esperava a jogada andava a 2,2 m/s (25% do tempo com a bola!)
  → 4,6 m/s; esperando o lance, faz tabelinha. (5) saída de bola recuava 30–40 m devagar → toque curto de ~12 m. (6) passe de 66 m
  rasteiro → acima de 30 m vai pelo alto. (7) armador/ala escolhidos PERTO da bola (passes longos pra trás caíram ~25%; o lateral
  não conduz mais 60 m sozinho pra cruzar). O campinho também passou a medir o ritmo do relógio (online/Copa) em vez de supor.
  Medido: bola no pé em passo de caminhada 25% → 5%; bola parada no meio do jogo 31 → 21 em 40 jogos. Travas novas na tela.
- ✅ **20/10 — 📐 FORMAÇÃO DO TÉCNICO NO CAMPO 2D** (Diego: *"não adianta ser 4-5-1 e ter três atacantes cravados na frente… 5-3-2
  e ter dois zagueiros na zaga… ele naturalmente está naquele local"*). Três furos achados e fechados: (1) nas salas online
  (Minhas Ligas depois do leilão de reservas) o campinho pegava os 11 PRIMEIROS COMPRADOS do elenco — agora escala pela formação
  do técnico (`onzeDaFormacao`, a formação vai em `elencos.fCasa/fFora`); (2) a troca de jogador/formação no INTERVALO da
  carreira não chegava no 2D — agora o 2º tempo joga com o time novo e os gols novos (`trocaTime`/`trocaEventos`, SimMatch leva
  `hxi2`/`hf2`); (3) 🐛 na Copa do Mundo/regional as cartas guardam a posição em `sec`: o campinho via todo mundo como
  atacante, sem goleiro, e QUEBRAVA ao montar o time. E a linha de trás agora defende alinhada (5-3-2 mostra 5 atrás).
  Medido em 20 jogos por formação: posição média de cada setor bate com a formação. Trava no `npm run campo2d`.
- ✅ **20/10 — 📺 MOTOR 2D OLHANDO O QUE A TELA MOSTRA** (Diego: *"ainda tá muito ruim… não tem sincronia… a bola às vezes para
  do nada… dá uma congelada… jogador fazendo coisas que não têm sentido, goleiro também… precisa melhorar muito mais"*). Nova trava
  `scripts/testa-campo2d-tela.mts` (vem no `npm run campo2d`): roda o motor a 60 quadros/s com o relógio do placar e mede o que o
  olho vê; e filmei a bancada quadro a quadro. Achados e consertos (60 jogos, antes → depois):
  ⚽ BOLA PARADA NO CHÃO 242 → ~20: o passe "na frente" saía a 27 m/s e a bola esperava 2–3 s parada o jogador correr 12 m —
  agora bola e jogador CHEGAM JUNTOS (`encontro`) · 🏓 pingue-pongue (tocava pro companheiro, recebia e tocava de novo) — 1 vez
  por jogada, e o companheiro com a bola sempre devolve · 🧍 34% → 4% de jogadores PLANTADOS com a bola rolando: cada um tem um
  vaivém próprio em volta do lugar dele (atacante se desmarca mais), quem chegou no ponto da jogada briga por posição, e o dono da
  bola que chegou no ponto protege andando · 🧱 a LINHA do time anda como bloco (~7 m/s) em vez de saltar 10–20 m quando a posse
  troca · ↔️ o time desliza pro lado da bola ENCOLHENDO (antes 3–4 jogadores ficavam presos na lateral, longe da bola) · 🧩 dois
  jogadores nunca ganham o mesmo lugar da formação, e companheiros ficam a 3,2 m (a bolinha tem ~4 m na tela) · 🫂 GOL: só os 4
  mais perto abraçam e o abraço dura ~1,3 s; o resto já volta trotando, contornando o círculo — a saída caiu de 3,6 s pra 2,8 s
  (máx. 5,3 → 3,5) e ninguém mais "pula" de volta pro campo do rival no meio segundo antes do toque · 🧤 sem MARCADOR na bola
  parada (o atacante rival entrava na área no tiro de meta pra "marcar" o goleiro).
- ✅ **20/10 — TORCIDA 70% DA CASA, PUBLICADA** (OK do Diego: *"ok pode fazer também"*). Uma arquibancada toda da casa; na outra,
  a rival em cima/à direita (60% de uma faixa = 30% do estádio) atrás de uma grade preta; no gol pula a torcida de quem fez. Tamanho
  da rival = `FRACAO_RIVAL` (`campo2d.tsx`).
- ✅ **20/10 — 🎙️ COLETIVA VIROU PASSO DEPOIS DO JOGO** (mockup `scripts/mockups/coletiva-passo.png`, OK do Diego no mesmo
  *"ok pode fazer também"*). Embaixo do jogo fica só o AVISO (`ColetivaAviso`: "a imprensa está te esperando"); no toque de
  avançar/pular (liga e Copa) abre a SALA DE IMPRENSA EM TELA CHEIA (`ColetivaPasso`, portal por cima de tudo: backdrop Vadico/Tidex,
  mesa com microfones, repórter, pergunta, 3 respostas, pular) → a MANCHETE do O MARTELO com o efeito → "▶ Ir pra rodada N". O
  próximo jogo só aparece depois. No AUTOMÁTICO a sala abre sozinha quando o jogo acaba e segue sozinha (12 s na sala sem contar
  pulo, 6 s na manchete); a Copa no automático espera a coletiva (`avancaCopaAuto`). Frequência não mudou (só jogo com assunto,
  ~5–8 por temporada). Ainda só na conta do Diego (`COLETIVA_GERAL`).
- ✅ **20/10 — 🧑‍⚖️ O JUIZ DO CAMPO 2D** (Diego: *"já vi até atacante do time rival bater tiro de meta pro rival… já vi jogada parar
  e do nada voltar ao jogo como se nada tivesse parado… simular e ver com calma as duas equipes jogando"*). Achados lendo 300
  jogos lance a lance, e consertados: 🔁 TIRO DE META EM DOBRO (a chance ia pra fora, o juiz cobrava, e o roteiro da jogada
  cobrava de novo — 333 em 300 jogos) · 📏 LATERAL DO NADA (o enfeite que mandava a bola pra fora era cortado, mas a cobrança
  ficava na fila e saía com a bola rolando — 146) · 🙋 LATERAL PRO TIME ERRADO (um molde chutava a bola pra fora e o MESMO time
  cobrava; e o desvio da zaga pra escanteio/lateral contava como toque do atacante — 190) · 🧊 JOGO CONGELADO (o zagueiro que ia
  desarmar ficava preso no empurrão do espaçamento ou numa ordem velha de "fica aqui"; agora quem corre pra bola não é empurrado e
  o desarme sempre mira a bola) · 🧍 DONO PLANTADO (quem está com a bola e sem ordem protege e leva a bola devagar, em vez de ficar
  parado esperando) · 🪄 ROUBADA A 20 M (o time do gol "pegava" a bola de longe: agora o rival erra o passe e ela ROLA até ele) ·
  🚩 CHUTE DA BANDEIRINHA (no escanteio curto o parceiro podia ser o próprio cobrador) · 🎙️ o resultado da chance ("Isolou!",
  "DEFESA MILAGROSA") ficava 0,3 s na tela porque o "Tiro de meta" passava por cima — agora fica 1,5 s · ⏭️ chance que chega uns
  segundos atrasada sai mesmo assim (antes era pulada; só cai se atrasar o próximo GOL). Trava `npm run campo2d` ganhou o FISCAL
  (0 cobrança pro time errado · 0 toque com a bola fora sem cobrança · 0 lateral/tiro de meta/escanteio sem a bola ter saído · 0
  chute da bandeirinha · bola parada com jogo rolando < 5%) e um VIGIA no motor (ordem que trava com todo mundo parado cai sozinha;
  hoje ele não precisa agir nenhuma vez em 300 jogos). Atraso de gol: mediana 0', 90% até 2,5', pior 6'.
  ⏳ Ainda é limite do formato: ~metade das chances sem gol não cabe (são ~10 lances em 90 s e cada jogada leva 8–15 s).
- ✅ **20/10 — MOTOR 2D "PELÉ E GALVÃO"** (Diego: *"muito chute do meio-campo, nunca vi isso… a bola meio que para no meio do
  caminho e depois vai sozinha pro gol… melhorar posicionamento… simule partidas como se fosse o Pelé e o Galvão"*). No motor:
  🚫 NENHUM chute de mais de 33 m (antes ~6 por jogo): antes de bater a bola tem que estar na entrada da área (`aproxima`/`aLevaAte`:
  conduz ou recebe um passe rápido lá), cruzamento só da LINHA DE FUNDO e com o atacante JÁ na área · 🚫 a bola NUNCA desliza
  sozinha: dono longe = ele corre até a bola; passe e chute só saem com a bola no pé; passe cai num ponto que o recebedor alcança
  · 🧍 espaçamento (ninguém a menos de 2,2 m de outro, menos quem disputa a bola), linhas de meio/ataque em "V", defesa fecha
  menos o lado · ⏱️ pra o gol continuar no minuto sem teletransporte: a jogada começa mais cedo quanto mais longe a bola está, a
  CHANCE (sem gol) que atrapalharia um gol logo depois é pulada (o gol nunca), e atrasado = todo mundo dá um PIQUE (até 1,8×) ·
  🚚 transição: jogada que começa lá atrás primeiro leva a bola pro campo de ataque · 🎙️ narração da condução ("avança com a
  bola", "toca na frente pro…"). Revisão lendo a narração inteira de jogos simulados. Trava `npm run campo2d`: 0 chute de longe,
  atraso mediano 0' (teto 6' fora dos 5 primeiros minutos), 0 jogador fora, 0 frase repetida.
- ✅ **20/10 — MOTOR 2D COM VARIEDADE + GOLPES DAS LENDAS + NARRAÇÃO VARIADA** (Diego: *"mais lances, mais jogadas… chute colocado,
  trivela, gol de cabeça, bicicleta, barriga, canhota… mano individuais únicos com as lendas… narrações têm que acompanhar tudo
  e ter variedade"*). `campo2d-estilos.ts`: `GOLPES` (122 lendas, 1–3 golpes cada, só FATO conhecido: elástico do Ronaldinho,
  roleta do Zidane, folha seca do Juninho, três dedos do Roberto Carlos, bicicleta do Hugo Sánchez/Rooney/Ibra, barriga do Renato,
  cobertura do Romário, drible no goleiro do Ronaldo…) + `CANHOTOS`/`DESTROS` (a narração só diz o pé de quem a gente SABE).
  `campo2d-motor.ts`: 14 moldes de jogada (+ lançamento, passe na frente, jogada individual com 2 dribles nomeados, escanteio curto
  ensaiado, erro da zaga, rebote, drible no goleiro), 15 acabamentos (`Acab`: rasteiro · colocado · trivela · folha seca · três dedos ·
  bomba · cobertura · cavadinha · voleio · bicicleta · calcanhar · cabeça · bico · de primeira · barriga) com altura/força/CURVA
  próprias (a bola faz curva de verdade: `Voo.curva`) e a jogada começa em lateral 40% das vezes. `campo2d-narracao.ts`: 50
  acontecimentos × 3–5 frases PT/EN (a trava exige PT = EN e 3+). 🐛 Consertos da varredura: ações de reinício (`pos`) não são
  mais apagadas pelo prazo do lance anterior (era isso que deixava a bola morta no tiro de meta); quem segura a bola roda em volta
  de si (não fica plantado na linha de fundo); reinício apressado quando o lance seguinte está perto; festa do gol nos ACRÉSCIMOS
  fecha depois do apito (bug "mascote travado") e o jogo congela sem saída fantasma; torcida visitante só no cantinho atrás do
  próprio gol (nas duas faixas). Trava `npm run campo2d` agora também confere: jogador fora das linhas, bola parada 5s+,
  narração repetida, gol nos acréscimos. ⏳ Falta: (a) 🎤 COLETIVA vira PASSO depois do jogo (aparece ao avançar/pular, sem mostrar o
  próximo jogo) com visual novo — MOCKUP antes; (b) o mesmo golpe repetido nos 2 dribles de quem só tem 1; (c) jogadores um em
  cima do outro na marcação do escanteio (cosmético).
- ✅ **20/10 — CAMPO 2D COM CARA DE ESTÁDIO, DEITADO NO DESKTOP** (mockup `scripts/mockups/campo2d-desktop.png` aprovado:
  *"Sim"*; e *"no móvel não vai diminuir o espaço do campo?"* → não: em pé a torcida tem a largura de sempre e as placas ficam
  só atrás dos gols). `campo2d.tsx`: caixa ≥ 700 px → campo DEITADO (mandante ataca pra esquerda; `tr()`/`rect()` trocam os eixos,
  nada de conta solta) com 3 fileiras de torcida em cima/embaixo, placas Vadico/Tidex nas laterais desenhadas no canvas (trocam a
  cada 7 s) e bandeirão de cada torcida atrás do próprio gol; nos dois formatos: listras cortadas, meia-lua e marca do pênalti,
  rede com varetas, sombra da arquibancada, jogadores com CAMISA + número (número pela posição: 1 · 2/6 · 3/4/5 · 8/10 · 9/11),
  pezinhos que alternam quando correm, seta + tracejado em quem tem a bola, rastro da bola em passe/chute, juiz de preto que segue
  o lance. Carreira no desktop (≥ 1100 px): `.ll-cx-2d` faz o placar ocupar as duas colunas (`career-desktop.css`). Bancada
  `scripts/teste-campo2d/` agora abre larga.
- ✅ **20/10 — REGRAS DO FUTEBOL NO CAMPO 2D** (Diego: *"bola sai pela lateral e não é cobrado lateral… escanteio e o time não
  subiu… sai na linha de fundo e não começa pelo goleiro no tiro de meta… quando sai gol tem que iniciar no meio"*). No motor
  (`campo2d-motor.ts`): ⚽ gol → todo mundo volta pro próprio campo, bola no centro, o rival FORA do círculo, e quem tomou dá a saída
  (a saída nunca é cortada) · 🧤 chute pra fora → a bola passa a linha e PARA lá → tiro de meta na pequena área com o goleiro
  batendo · 🧤 defesa → o goleiro segura e repõe · 📏 lateral (bola afastada pela linha lateral → quem não tocou por último cobra
  com as mãos) · ⛳ escanteio: o ataque SOBE (atacantes, 2 zagueiros, 1 meia; a defesa toda marca) e o cobrador só bate com 4+
  na área · 🟥 falta: o zagueiro derruba, barreira a 9 m, o batedor vai até a bola · a bola NUNCA aparece no pé de alguém longe
  (rola até ele) e ninguém se posiciona fora das linhas. Quando o lance do jogo está em cima, o campinho vai no CURTO (o gol tem
  que sair no minuto). Trava `npm run campo2d` agora confere as regras (lateral, tiro de meta, escanteio cheio, saída no meio,
  bola fora ≤ 4s) além do placar.
- ✅ **20/10 — 2D SEM TRAVADA + sem "1:30" no texto** (Diego: *"o jogo dando umas travadas com a bola rolando"* e *"esse negócio
  de 1:30 tem que tirar"*): o desenho não reinicia mais a cada minuto do placar (props num `useRef`), o relógio do campinho
  anda liso e só corrige aos poucos pro minuto do placar (antes esperava o minuto e pulava), o fundo parado (grama, linhas,
  torcida) é desenhado 1 vez, e a bola/jogadores são desenhados MISTURANDO o passo anterior com o atual (`entre`/`ax`/`ay` no
  motor — motor em 50 passos/s, tela em 60). Tempo por velocidade no 2D: ¼× 6:00 · ½× 3:00 · normal 1:30 · 2× 0:45 · 4× 0:22.
- ✅ **20/10 — 2D EM TODO JOGO** (*"serve para tudo, pô"*), PUBLICADO só na conta do Diego (OK dele: "Sim"; foto da sala 2D
  enviada): o campinho mora DENTRO do `LiveScoreCard` (placar de toda competição) e, com o 2D escolhido, TOMA O LUGAR do
  placar (correção do Diego: *"qd tiver escolhido o 2D o placar padrão rápido não aparece"*); o telão de propaganda segue
  embaixo. Carreira: placar de sempre, quem tem o 2D liberado troca no botão. Quem decide: `useCampo2DLigado` (`campo2d-modo.ts`) — fora da sala
  online é o aparelho (botão `Botao2D` junto do Manual em todo `SimControls`), na sala online é `state.campo2d` (dono escolhe
  "⚡ Padrão rápido · 📺 2D" ao criar). Tempo 1:30 em liga, Copa, Liberta, Champions, internacional, Copa do Mundo offline e
  regional sem relógio. ⏳ Falta (pedir OK — é RELÓGIO): Copa do Mundo e regional ONLINE seguem nos 16s do banco
  (`esc_copa_preview_clock`/`esc_regional_clock`, `duration_ms = 16000/speed`). Bancada: `scripts/teste-placar-2d/`.

## 🤖 Copa do Mundo: máquina mais fraca nas seleções pequenas (20/10)
- Pedido do Diego depois da Escócia campeã na live do Fridão: *"bots da máquina um pouco só mais fraco mas só se for seleção mais fraca"*.
- ✅ Seleção da MÁQUINA (ninguém jogando com ela) fora das 10 grandes (Brasil, Alemanha, Itália, Argentina, França, Uruguai,
  Inglaterra, Espanha, Holanda, Portugal) joga com 1 nível a menos por carta. Achado junto: o time da máquina repetia a mesma
  pessoa em 2 cartas (Argentina, Paraguai, Colômbia, Portugal, Chile, Senegal, Irlanda, Argélia) — agora não repete.
- Só Copas criadas depois de 20/10 19h30 UTC (`maquina2` na ficha); Copa já em andamento não muda. Trava `npm run copa-maquina`
  (máquina fraca campeã: 4,0% → 2,4%).

## 🎤 Coletiva: o boneco sentado na mesa (20/10) — APROVADO ("Adorei")
- O presidente da CONTA (o mesmo da Loja; trocou lá, troca aqui) aparece sentado, do peito pra cima, atrás da mesa com os 3
  microfones (`PresidenteNaMesa` em `presidente-avatar.tsx`, pose `seated`). Grátis sem boneco = mesa como antes.
  Mockup: `scripts/mockups/coletiva-presidente.png`. Sem boneco: convite discreto na cadeira vazia ("Crie seu presidente e apareça
  aqui ›" / com plano "Seu plano já tem presidente · monte o seu ›") que abre a Loja em `#loja-presidente` ("Perfeito").
  ✅ Publicado 20/10 (junto da Copa/máquina e do aviso do dono).

## 🧪 OittoLabs, parceiro novo (21/10) — contabilidade e BPO pra PJ e PF (oittolabs.com.br)
- Pedido do Diego: aviso da comunidade + texto pra postar · placas do campinho revezando com a Vadico · telão · "apresentado por"
  na Copa do Brasil da carreira e na Copa dos 8 online · mais uma marca no Master da carreira.
- ✅ PUBLICADO 21/10 ("publique o OittoLabs"): logo `img/patro-oittolabs.webp` (21 KB) · `PLACAS_CAMPO` Vadico → OittoLabs →
  Tidex (cima/baixo trocam a cada 7 s) · Copa dos 8 = OittoLabs (era Tidex; a Tidex segue na Liga Legends da carreira) · Copa do
  Brasil da carreira = OittoLabs (`career-copa`) · Master: a OittoLabs entrou NO LUGAR da Max Joias, 1 temporada (Diego: "tira Max
  joias e bote ele"); contrato da Max Joias já correndo em save antigo vai até o fim (`npm run master`).
- ✅ Aviso: `scripts/posts/aviso-2026-10-21-parceiro-oittolabs.png`. Mockup do jogo: `scripts/mockups/oittolabs-no-jogo.png`.
- ✅ Telão no ar (`esc_anuncios_fixos` id 5):
  "🧪 OittoLabs · Contabilidade e BPO financeiro pra sua empresa ou PF · Clique aqui" (ordem 5). Diego quer o clique no
  WhatsApp deles com mensagem pronta (igual Tidex) — ⏳ falta o NÚMERO; até lá vai pro site.

## 🚫 Moderação: nome de sala com preconceito (21/10)
- Sala "Sala do Nazistaisaque卍" (1O8OTJ, conta pedroisaque604@gmail.com). ✅ Nome trocado pra "Sala Isaque" (o gatilho segura:
  o `ls_name` é recopiado do game_state a cada jogada, então rename direto VOLTAVA).
- ✅ Banco barra criar sala com "nazi/nazista", "crioulo" ou suástica (`esc_nome_ofensivo`, gatilho `zz_esc_sala_nome_ofensivo`,
  erro `NOME_PROIBIDO` → a tela explica) e limpa o nome nos `room_players`. Palavrão continua liberado (ordem do Diego).
  Pra palavra nova: mudar o regex em `esc_nome_ofensivo` E em `esc_nome_limpo`. Falso positivo conhecido: nome com "nazi" no
  meio (ex. "Anazinho"). Hoje no histórico só aparece também "Otavinazifc".
- ✅ Aviso pra conta (`esc_avisos_conta` + `AvisoConta`, publicado 21/10): aparece uma vez, o X marca visto no banco. Pra mandar
  outro aviso a alguém: `insert into esc_avisos_conta (user_id, titulo, texto)`.
- ✅ 2ª parte (Diego: "nem palavras referentes ao nazismo ao fazer novo time e nova sala"): régua = nazi(solto)/nazista/nazismo,
  hitler, suástica/swastika, führer, sieg heil, crioulo e os símbolos 卍卐࿕-࿘. Vale na SALA (barra), no PERFIL/TIME (gatilho em
  `auth.users` troca o nome na hora de gravar) e na TELA (`nome-ofensivo.ts` dentro do `nomeLivre` + início de carreira/dinastia
  + criar sala). "Internazionale" (Inter) liberado. Perfil dele trocado pra "N Isaque".
- ✅ Limpeza dos ANTIGOS (Diego: "tudo que é Hitler coloque Ht e nazismo ou nazista coloque N"): 19 perfis (Real Nazista → Real N,
  Castelo nazista FC → Castelo N FC, Hitler FC → Ht FC…) + o histórico do ranking (`esc_results`, `esc_pyramid_rank_snap`,
  `game_champions`, `_arquivo`, `room_players`). Suástica e "crioulo" do histórico saíram pelo `esc_nome_limpo` (Gui crioulo → Gui,
  LOS DICTADORES卍 → LOS DICTADORES). Zero nome ofensivo sobrando pela régua.
- 👀 Fora da régua (não está na lista do Diego): "donigga50k" (variação de xingamento racista em inglês) apareceu num vice-campeão.

## 🐊 Chat: figurinha do mascote (21/10) — FEITO ("gostei… pode fazer")
- Diego gostou de "figurinha da mascote" e "reagir a uma mensagem"; pediu mockup só da figurinha (`scripts/mockups/chat-figurinha-mascote.png`):
  botão 🐊 ao lado do campo → bandeja com 4 figurinhas do SEU mascote → cai no chat sem balão. Legendas do Diego: CHORA! · É TUDO
  NOSSO! · PAI TÁ ON! · BORAAA! (`FIG_LEG`, screens.tsx). A mensagem leva só o índice (`ChatMsg.fig`); quem recebe acha a mascote pelo
  nome do clube de quem mandou (ninguém manda a mascote alheia); 1 a cada 2 s. Custo = 1 mensagem normal.
  ⏳ Sem mascote (grátis/sem batismo) = sem botão por enquanto; Diego não decidiu se ganham mascotes genéricas.
- ⏳ Reagir a mensagem: aprovado em ideia (1 reação a cada 2s, custo de 1 mensagem); sem mockup ainda.

## 🧊⏯️ Copa do Mundo da carreira não recomeça mais (21/10, caso do Gimenes Junior Barranquila)
- Bug: a Copa guardava só a SUA seleção; fechou/recarregou no meio → voltava pro 1º passo e simulava tudo de novo (com o catálogo
  de agora, o sorteio podia sair outro). Ele tinha eliminado a Inglaterra nas quartas e reabriu num chaveamento novo (Turquia nas oitavas).
- ✅ O carimbo (`emAndamento`) agora guarda as 32 seleções com as cartas inteiras (`ents`, ~19 KB, some quando a Copa acaba) e a
  última fase VISTA (`passo`); reabrir = mesmo torneio, do mesmo ponto (jogo que não terminou volta do apito). Copa carimbada
  antes disso congela na próxima abertura. Trava `npm run copa-congelada`; testado no navegador (reabriu nas quartas, jogou a semi,
  recarregou e voltou na semi com os mesmos placares).
- ⏳ A Copa do Gimenes não volta (save no aparelho dele; eliminação já gravada). Diego decide se compensa com moedas.

## 🔁 Copa com duplas: relógio da escolha reiniciando pra sempre (21/10, Rio × SP da sala do Futpoint)
- Causa: desde 20/10 quem escolhe pela dupla sai do estado da partida (`quemAgePeloEstado`). O parceiro marcado pra convocar
  tinha sido TIRADO da sala (sem linha no room_players — bug que a outra sessão consertou no df344478): a escolha dele não gravava,
  nem o castigo do dono (pior clube na linha dele) → a vez voltava pra mesma dupla e o relógio reiniciava.
- ✅ `soQuemEstaNaSala` (dupla-copa.ts): quem age sem linha na sala passa pro outro da dupla que está; ninguém da dupla = o time
  sai da fila. Vale na regional E na Copa do Mundo da sala (tela + dono da sala). Trava `npm run dupla-copa-estado`.

- ✅ **🚫 MODERAÇÃO 21/10 (2ª): "estupr…" barrado** (time "ESTUPRADOR DE JUDEU" campeão na sala do mengao caxiense, conta
  vitorguiotgame@gmail.com). Banco: `esc_nome_ofensivo` pega "estupr" e o nome NÃO é aproveitado (vira "Técnico"/"Sala"), migration
  `20261021070000_nome_ofensivo_estupro.sql` — já valendo. "Judeu" sozinho NÃO é barrado (ordem dele). Conta renomeada pra "Técnico",
  histórico de campeões limpo, aviso de uma vez mandado (`esc_avisos_conta`, com o alerta de remoção se repetir). A sala NÃO foi
  apagada: era do mengao caxiense (outras 4 pessoas), parada desde 12h29 — só o nome dele foi trocado lá dentro.
  ⏳ Outros 8 perfis antigos com "estupr…" no nome (desde agosto) — perguntei ao Diego se renomeia todos.

- ✅ **🐐👑 BATISMO NEYMAR_FC (21/10)** — o nome do clube é **Neymar_FC**, com underline (é como ele joga, "NEYMAR_FC"; o Diego corrigiu); "Neymar FC"/"Neymar"/EC/SC também desenham o escudo. Post batizado por **Arie**. — sheeryarie772@gmail.com (conta existe, nome "SPFC/NEYMAR"), Série D no assento do bot
  **Galáxia EC** (1º bot sem dono da D; `OLD_NAME['Neymar FC'] = 'Galáxia EC'`). Coração São Paulo. Escudo dourado com o bode coroado,
  mascote **O Bode Rei** (`neymarfc_bode` — nome escolhido por mim, o Diego pode trocar), manto creme #F2D8B8 + preto #090806 MEDIDOS na
  camisa, camisa na Loja. Banco: ouro manual (já estava, veio do pagamento), sócio nº77, "Neymar" reservado (+FC/EC). Batismo de 79,90 =
  sem número de fundador (`SEM_FUNDADOR`). Post: `scripts/posts/neymarfc-post.png`. ⏳ Falta publicar na main (código).
- ✅ **🔤 NOME DE TIME ARRUMADO (21/10, regra do Diego)**: *"todo time do usuário, quando for feito, mesmo que ele bote maiúscula…
  primeira letra maiúscula e o restante minúscula. E FC sempre maiúscula"*. `nomeDeTime` (`nome-time.ts`): cada palavra com 1ª
  maiúscula, "de/da/do/dos/das/e" no meio minúsculas, FC/EC/SC/AC/SAF maiúsculas, separador (_ - / .) mantido. Vale no cadastro,
  carreira, dinastia, carreira do basquete e no chip do nome das salas. Nome já existente só muda quando a pessoa salva de novo.
  Só trocar maiúscula do PRÓPRIO nome não passa pela checagem de nome único.
- ⏳ **🛡️ ESCUDO DE CLÃ PERSONALIZADO NA LOJA (21/10, pedido do Diego)** — R$ 19,99 no Pix do Mercado Pago. Depois do Pix: campo
  "nome do clã" + "ideia do escudo" + botão "Mandar no WhatsApp do Diego" com tudo escrito. Mockup `scripts/mockups/clas-escudo-loja.png`
  enviado e APROVADO (*"sim"*, zap 21 99888-6982, pronto em até 24 h). FEITO no branch: `EscudoClaLoja` (cla.tsx) na Loja (seção
  "⚔️ Seu clã") e dentro do clã do presidente; produto `escudo_cla` (19,99, só presidente — `esc_cla_presidente_email`), nome + ideia
  só depois do Pix (`esc_cla_escudo_escrever` / `esc_cla_escudo_meus`, tabela `esc_cla_escudo_pedidos`), botão do zap com o código do
  pedido. Testado no banco de ponta a ponta (com desfazer). ⚠️ AO PUBLICAR: fazer o deploy da função `mp-criar-pix` (ganhou o nome
  'escudo_cla' — sem isso o Pix responde "produto"). Quando o Diego mandar a arte: registrar em LOGOS_PRONTAS com o NOME DO CLÃ, pôr
  `emblema = 'escudo:<nome do clã>'` em `esc_clas` e `pronto_em = now()` em `esc_cla_escudo_pedidos`.
  🩹 Junto: as listas de produto de `esc_mp_pedidos`/`esc_pagamentos` estavam atrasadas (peça do presidente nem gerava Pix; giro, recado,
  ficha e temas quebrariam o webhook ao pagar). Corrigido em 21/10 — ninguém tinha pago nenhum deles ainda.
- ✅ **PUBLICADO EM 21/10 ~13h30 (Diego: "pode")**: clãs liberados pra todos (`CLAS_GERAL = true`), escudo de clã na Loja (função
  `mp-criar-pix` v11 com 'escudo_cla'), batismo Neymar_FC, nome de time arrumado. Deploy verde. Reels e aviso do zap prontos em
  `scripts/posts/clas-reels.mp4` e `scripts/posts/aviso-2026-10-21-clas.png` (o Diego posta).
- ⏳ **⚔️⚔️ 2º CLÃ PAGO (21/10, Diego: "sim")**: cada conta CRIA 1 clã (criar continua só com plano); o 2º vem na Loja por R$ 19,99
  (`cla_extra`, só presidente do seu clã e sem 2º ainda) e já nasce com escudo personalizado (Diego desenha; zap). Os títulos somam
  nos DOIS; o selo mostra o 1º (quem só tem o 2º mostra o 2º). No banco: `esc_clas.extra = true`, presidente = quem comprou, e ele
  NÃO vira linha de membro (a trava "1 membro = 1 clã" ficou intacta) — entra por `esc_cla_gente()` em títulos, vagas (22), prêmio
  (1 prêmio por pessoa por semana: o melhor lugar). A presidência do 2º não se passa; ele pode fechar ("🗑️ fechar este clã").
  Aba do clã ganha as duas abas no topo. Migration `20261021130000_cla_extra.sql`, testada no banco (compra, criação, entrar, tirar,
  fechar). Foto: `scripts/mockups/clas-2o-cla.png`. No branch esperando o "publica" — e AO PUBLICAR: deploy da `mp-criar-pix` (ganhou 'cla_extra').
- ✅ **🖋 CLÃ DO BATISMO = NOME + ESCUDO JUNTOS (21/10)**. Diego viu o escudo do batismo no selo de quem estava em clã de OUTRO nome
  (Pontuadores com o escudo do Futpoint, Oliver Clã com o da Julia Barranquila): *"tá errado"*. E pediu: *"faltou aparecer a opção de quem
  tem batismo entrar com seu escudo e nome do time"*. Agora: na tela de criar, quem tem batismo escolhe "🖋 Clã do <time>" (nome E escudo
  do batismo) ou "⚔️ Clã com outro nome" (emblemas prontos). O banco (`esc_cla_criar`, migration `20261021150000`) só aceita o escudo junto
  com o nome. Os 2 clãs antigos ganharam emblema pronto (e:3 · e:4). Já tendo clã, o do batismo como 2º é pela Loja (`cla_extra`): o time do
  batismo vira o 2º clã e o escudo personalizado vai pro 1º (migration `20261021140000`). Foto: `scripts/mockups/clas-criar-batismo.png`.
- ✅ **🎨 TROCAR EMBLEMA DO CLÃ (21/10)**: o presidente troca entre os emblemas prontos (botão "🎨 emblema" no clã). Clã do batismo e escudo
  personalizado pago não trocam por aqui (`esc_cla_emblema`, migration `20261021160000`). Regra confirmada pelo Diego: sem clã → o do batismo é
  de graça (1º); criar outro depois = 2º pago (R$ 19,99, personaliza o novo). Fez ao contrário (criou outro antes) → ativar o batismo é o 2º
  pago, e o escudo personalizado vai pro 1º.
- ✅ **🔓 CRIAR CLÃ SEM PLANO = R$ 9,90 (21/10, Diego: "tá ótimo, gostei")**: com plano é de graça; sem plano, o "Criar clã 🔒" abre
  "Libere o seu clã" com o Pix de R$ 9,90 (produto `cla_criar`, um Pix = um clã criado, crédito em `esc_clas.pedido_criar`). Escudo
  desenhado continua R$ 19,99. Migration `20261021170000_cla_criar_avulso.sql`, testado no banco. Ao publicar: deploy da `mp-criar-pix`.
- ✅ **PUBLICADO 21/10 (~15h, Diego: "publique tudo")**: tela de criar com o clã do batismo (nome + escudo), 2º clã pago, troca de
  emblema, cadeado de R$ 9,90 pra quem não tem plano, caixa dos clãs sempre visível. `mp-criar-pix` v12 (escudo_cla · cla_criar · cla_extra).
  Regra confirmada: Futpoint (sem clã) cria o "Clã do Futpoint FC" de graça; Julia Barranquila (tem o Oliver Clã) fecha e cria o do
  batismo, OU paga R$ 19,99 e fica com os dois (o batismo vira o 2º e o Oliver ganha o escudo personalizado).
- ✅ **✂️ CLÃ SEM "FC" (21/10, Diego: "não precisa ter FC nos clãs")**: `esc_cla_sem_fc` tira FC/EC/SC/AC/SAF do fim do nome do clã (o do batismo
  e o digitado; "Futpoint FC" → "Futpoint"). O escudo continua o do time. Banco já valendo (migration `20261021180000_cla_sem_fc.sql`); o rótulo
  "Clã do Futpoint" na tela de criar está no branch.
- ⏳ **💸 PREÇOS DOS CLÃS (21/10, Diego)**: 2º clã = R$ 9,90 só pra criar (emblema pronto; quem tem batismo ativa o time, nome sem FC + escudo) ·
  escudo personalizado = R$ 19,90 à parte, pra qualquer clã. Banco já valendo (migration `20261021190000_cla_precos.sql`, testado). Loja nova
  (`Extra2Form`) no branch. Julia Barranquila (Oliver Clã) e Tricolor do Arruda (Lado A-DPA) já tinham criado outro clã: pra ativar o do batismo
  pagam os R$ 9,90 do 2º. Falta: texto do Pix/edge "2º clã" (sem "+ escudo") e publicar + deploy da `mp-criar-pix`.


### 23/10 — prévia privada de cidade viva e replay 3D
- Pedido atual autoriza publicar a prévia da conta Diego; não ampliar a outras contas. A autorização anterior de não publicar foi substituída pelo pedido explícito atual.
- Civis Quaternius CC0 com roupas próprias, AnimationMixer e clipes Idle/Walk/SitDown/StandUp; oito variantes. Adultos e idosos usam modelos de origem. Crianças são escalas uniformes provisórias; maior volume corporal é uma variante civil localizada, sem alterações no jogador de futebol. O estilo dos civis é cartunesco, diferente dos atletas.
- Reutilizar ruas/calçadas/circulação/carros existentes. População decorativa limitada a 24 desktop/10 móvel, ligada à torcida calculada pelas regras existentes e às melhorias compradas; não equivale a público pago e não gera renda/compras. LOD só visual. Torcida distante continua simplificada.
- Replay privado no estádio do mapa: usa a entrada oficial e confere autores/minutos/placar contra o resultado salvo antes de habilitar; não grava carreira e não avança rodada. Jogo fora de casa aparece explicitamente como reprodução de teste no mapa. Câmera livre é padrão; transmissão opcional.
- Save Neymarzetti conferido: Rei da Bola FC 1×1 Neymarzetti, Souza 16′ e Denis Law 43′; 82 eventos. A referência antiga 2×0 era recálculo de branch antigo, não o resultado congelado. Não usar essa referência antiga como resultado real.
- Validações: 5.701 amostras idênticas ao motor oficial; auditoria visual de 950 quadros com 22 jogadores; 48 contatos habilitados e janelas a 60 Hz sem penetração, piso negativo ou desancoragem acima dos limites. Onze ações seguem sem captura aprovada (inclusive um passe removido após colisão na aproximação); outras capturas não são inventadas. Cobertura de goleiros/dribles/faltas ainda provisória.
- Galeria: oito civis, dez vistas, caminhada e sentar/levantar com piso validado. Replay: pausa/continuação, fim oficial, reinício, troca de fonte e encerramento ao sair da conta. Relógio 2D/3D: 30.383 amostras, velocidades 0,5/1/2/4. Campo 105×68 m, gol livre 7,32×2,44 m, bola raio 0,11 m.
- Cidade completa QA: circulação de carro/pedestres e 22 jogadores em sete etapas até o fim, sem erro JS. Captura aproximada adicional com população da regra real; estádio completo da bancada não representa compras da conta. Reexecução durante merge/HMR foi interrompida por recarga da página; não confundir com aprovação de nova rodada gravada.
- Testes locais usam Chromium/SwiftShader, não comprovam FPS em celular físico. Cena completa observada: cerca de 267 draw calls / 1,73 milhão de triângulos. Desempenho e anatomia infantil definitiva seguem para melhoria. Nenhuma sessão autenticada da conta foi manipulada e nenhuma migração executada.
- Fontes e créditos em public/creditos-3d.txt e manifests de proveniência. Shorts: atribuição literal CC BY por Elvaerwyn, sem inventar versão.

## 📅 CALENDÁRIO DA CARREIRA: QUARTA 21H E DOMINGO 16H (24/10) — ⏳ MOCKUP, esperando OK do Diego
- Ideia dele: *"ter jogo toda quarta e domingo… quarta 21h e domingo 16h… e com isso teria o tempo passando… começar na central"*.
- Mockup `scripts/mockups/carreira-calendario.png`: domingo 16h = Liga · quarta 21h = Copas · quarta sem jogo = semana livre ·
  temporada fevereiro → dezembro, janeiro = virada. Data no topo da Central/Jogos/Tabelas, agenda "próximos compromissos" na
  Central, semana (seg–dom) no Jogos, luz de tarde × refletores no estádio. O tempo passa por partida (nada de relógio de verdade)
  e o botão de jogar é o de sempre.
- Minha recomendação: 1ª etapa só visual (data + agenda + luz). "Semana livre recupera gás" = 2ª etapa, só se ele aprovar
  (é a única parte que mexe em regra).
- ✅ 24/10 ele aprovou AS DUAS ETAPAS (*"pode fazer as duas etapas"*). Logística explicada: hoje a Copa só começa DEPOIS da Liga
  (`copaPlaying = done && …`); pra ter Copa na quarta ela passa a ser intercalada na Liga (Copa do Brasil/Legends nas quartas;
  Liberta/Champions/Mundial seguem no fim do ano). Só TEMPORADA NOVA, só a conta dele primeiro, com chave pra voltar.
- 📅 DIAS VAGOS (24/10, regra dele): *"só poderia passar direto próxima partida se apertar em pular, ou próximo adversário no manual..
  já no auto teria que aguardar mesmo"*. Mockup `scripts/mockups/carreira-calendario-dias.png`: AUTOMÁTICO = os dias passam sozinhos
  (~3s por dia vazio, proposta) com o recado do dia + botão "⏩ Pular pro jogo"; MANUAL = fica parado no dia até "▶ Próximo
  adversário". Recado por dia: seg O MARTELO · ter cansados/voltou/suspensos · qui rivais · sex véspera/clássico · sáb concentração.
  ⏳ Esperando ele aprovar este mockup (e confirmar a pergunta: Copa do Brasil nas quartas + internacionais no fim do ano).
- 🧭 24/10: ele achou as outras abas "embaralhadas" (*"na central funciona certinho mas quando aperto outra aba e vejo o próximo
  jogo, embaralha tudo"*) e pediu como EU faria. Proposta `scripts/mockups/carreira-calendario-um-relogio.png`: UM relógio só —
  a mesma barra no topo de TODA aba (data + próximo jogo + ⏩/▶), Central = o dia, Jogos = lista de jogos com datas (vira o
  estádio no dia do jogo), Elenco/Tabelas/Rank/Clube = escritório que pausa o tempo. Copas seguem o mesmo calendário (quartas).
- Pendente da conversa: espera no automático (recomendei 1s por dia vazio) e vaga da Copa pela temporada anterior.
- ✅ 24/10 *"faça apenas no meu usuário… code pro meu tudo isso"* → ETAPA 1 FEITA (gate `CALENDARIO_*` em sport.ts, só a conta
  dele): `calendario.ts` (datas puras: T1 = 2026, rodada r = r-ésimo domingo de fevereiro, Copa nas quartas DEPOIS da Liga por
  enquanto; recado do dia seg/ter/qua/qui/sex/sáb) + `calendario-ui.tsx` (`CalendarioBarra`) + o bloco "CALENDÁRIO DA CARREIRA"
  no pyramidseason: 1 s por dia vazio só com Central/Jogos na tela (escritório pausa), ⏩ Pular / ▶ Próximo adversário vão
  direto, "▶ Ir pro jogo" quando o domingo chega com a Central aberta (lá o jogo nunca roda). O auto só faz `PLAY_ROUND`
  com a semana acabada (`calDiasOk`). Conserto junto: o apito fica GUARDADO (`calApitado`) — na Central o `roundReady`
  voltava a dizer "rodada rolando" com o jogo já acabado. Testado numa carreira de verdade (celular e PC).
  ⏱️ 24/10: 1 s por dia foi rápido demais (*"não deu nem para ler"*) → 3 s por dia (`CAL_MS_POR_DIA`).
  🗓️ 24/10 ABAS ARRUMADAS (mockup `carreira-calendario-abas-antes-depois.png`, *"aprovado só p minha conta"*): sai a barra
  separada no Jogos — a data vira selo no cabeçalho da liga e, nos dias, o lugar do placar vira o cartão PRÓXIMO JOGO
  (`CalendarioProximo`: escudos, dia/hora, semana do próximo jogo, recado, ⏩ Pular/▶ Próximo adversário, "Seus jogos"). Central
  segue com o cartão do dia. Outras abas: faixa fina (⏸️ nos dias · 🔴 AO VIVO no jogo). CLUBE: o jogo NÃO pausa mais (o 2D
  escondido desenha num tamanho de reserva — é o laço dele que anda o relógio) e tem 📺 Assistir → Placar (todos) · 2D (Craque+,
  `temManual`/pago) · 3D no mapa (só conta em teste). Placar velho não reaparece nos dias.
  📺 24/10: na Central a faixa do calendário só aparecia nos DIAS; 25/10 (*"a faixa fina não saiu do topo da Central"*): saiu de vez da Central (jogo, dias e Copa). ⏳ Mockup da Central reorganizada
  (`carreira-central-antes-depois.png`: jogo primeiro, cartão único, Agenda com as datas do calendário, Salvar/Ranking discretos)
  mandado — ele pediu SÓ a faixa por enquanto; o resto espera o OK.
  ✅ ETAPA 2 (Copa nas quartas) FEITA, só na conta dele: temporada que COMEÇA com o calendário ligado ganha `calCopaSeason`
  (ação `CAL_COPA_LIGA`, só na rodada 0 — temporada em andamento termina do jeito antigo). A Copa (Copa do Brasil/Legends) nasce
  na LARGADA a partir do `world` (ordem dos clubes no começo da temporada — a tabela final ainda não existe) e as fases são
  reveladas nas QUARTAS: fase k na semana da rodada `round(38·(k+1)/(n+1))` (`copaSemanas`). A semana PARA na quarta (`copaMidOn`)
  se você está na fase; caiu/não entrou = a fase roda por trás e a quarta é livre. ⏩ Pular nunca pula a Copa (para na quarta).
  XI da Copa congela na 1ª fase (`FREEZE_COPA_XI`). Supercopa (precisa do campeão da Liga) e internacionais seguem DEPOIS da Liga.
  Motor novo na Copa do meio: só se ligado antes da rodada 5. ⏳ Ainda NÃO feito: "quarta livre devolve gás" (hoje Copa não
  cansa ninguém — gás só conta jogo de Liga; mexer nisso é regra nova, perguntar antes).
- 🏟️ 24/10 ABA CLUBE SEM JOGO (mockup `carreira-clube-sem-jogo.png`, *"pode publicar na minha conta"*): com o calendário ligado
  a aba Clube esconde o lado do jogo (placar/2D/rádio/tática/controle) — classe `ll-cx-clube-limpo` + regra no
  career-desktop.css. Escondido, não desmontado (igual à Central): o jogo segue rolando por trás. Na conta dele o Clube já é o
  MAPA (não a maquete) — nada muda nisso. Publicado junto com a etapa 1 do calendário, só na conta dele.
### 23/10 — jogador cartoon no estilo dos civis aprovado como direção visual
- Diego aprovou o conceito gerado por IA (cabeça grande, corpo compacto, NO FACE, uniforme branco/preto) e pediu seguir o conjunto visual, incluindo gramado, roupa e sombras. A imagem conceitual não é captura do jogo. O novo modelo real ainda precisa atingir aquele acabamento.
- Bancada `scripts/cartoon-football/review.html`, exportação GLB e corrida real. Corpo original civil CC0, 23 ossos, hierarquia/pesos preservados; camisa em V e barra do short alteradas apenas nas peças de roupa clonadas. Faixas de meião e acabamento das chuteiras por material. Neymarzetti usa arte/atlas existentes; combinação de short/meias/chuteiras provisória.
- Pipeline reutiliza Idle/Walk/Run/Jump nativos e retargeta 12 clipes existentes de futebol, total 17. Sprint usa cadência do Run. Capturas não comerciais ou movimentos de luta não foram acrescentados.
- A adaptação compacta tem orçamento visual de aproximação até 0,60 m, correção residual até 0,18 m e IK de até 0,08 m. Posição/bola/eventos oficiais não mudam. Teste de contato inclui direção da saída, além de distância e piso; números não substituem revisão visual de fluidez.
- Modelo novo permanece optativo no carregador (`civil-cartoon`); padrão publicado continua `athlete`. Sem nova publicação ou escrita de banco nesta etapa. Overalls, descanso e motor preservados. Prévia real e relatórios em `test-results/cartoon-football/` (locais, não versionados).
- Validação da nova base: integridade de vértices de corpo/cabeça, pesos, hierarquia e matrizes de bind conferida; 17 clipes e 23 ossos. Sete vistas/poses sem erros JS; solas a 2 mm do piso na bancada. Exportação GLB real e MP4 H.264 baseline para compatibilidade.
- Replay cartoon: 48 contatos com distância/direção aprovadas, 3.303 amostras de janelas a 60 Hz e 950 quadros da partida com 22 jogadores; sem penetração acima da tolerância, piso negativo ou desancoragem fora do orçamento. Mesmo 1×1/82 eventos. Onze lances continuam sem captura aprovada. Isso não comprova qualidade FIFA/PES, ausência de escorregamento em todos os quadros ou FPS em aparelho físico. O runtime anterior também passou novamente na auditoria completa.
- Gramado existente ganhou relevo milimétrico no shader, com frequências filtradas à distância, sem nova textura ou draw call. Ainda não replica o gramado da imagem conceitual.
- Correção após foto de Diego (buraco acima da perna): o encurtamento de 4,5 cm da barra expôs a ausência de superfície de coxa sob o short da fonte original. Removido somente esse ajuste; barra e pesos originais restaurados, sem criar anatomia ou remendar com primitivas. Teste de integridade agora confere também as posições originais do short para impedir regressão. Sete vistas/poses recapturadas; vídeo e GLB regenerados. Short mais curto exigirá roupa/corpo com cobertura compatível, não apenas levantar a barra.

### 23/10 — primeiro replay completo gravado com o jogador cartoon
- Diego aprovou a correção da abertura da perna e pediu assistir ao 11×11 mantendo o cartoon. Perguntou se poderia voltar ao humanoide anterior: sim, modelo/clipes e opção `style:'athlete'` preservados; não pediu a troca agora.
- Bancada `scripts/cartoon-football/watch-match.html`: 22 personagens cartoon, uniforme Neymarzetti existente, câmera de acompanhamento e campo completo opcionais. Não modifica a câmera livre do mapa nem publica o novo estilo.
- Gravação concluída em `test-results/cartoon-football/11x11/`: replay inteiro de 94,08 s no tempo acelerado da fonte, 1.129 quadros reais a 12 fps; Rei da Bola FC 1×1 Neymarzetti, mesmos 82 eventos. Bola conferida dentro do frustum em cada quadro da gravação completa. Três trechos próximos de passe/chutes em câmera lenta. Sem erro JS, escrita de save ou avanço de rodada.
- A cena gravada usa o campo existente isolado, não o estádio completo da cidade; não apresentar como filmagem na conta. Arquivos H.264 baseline/yuv420p/faststart e página local com controles de vídeo; evidências e MP4 não entram no Git. Taxa de quadros do arquivo não é benchmark de telefone físico. Goleiro/domínio/dribles e fluidez ainda têm adaptações provisórias.

### 23/10 — correções de fundamentos sobre o replay cartoon
- Pedido de Diego: corrigir o que falta no futebol. Prioridade executada: domínio/condução, transições de passe/chute e erro de acumulação nos controles dos pés. Sem mudança no motor, eventos, posicionamento oficial, atributos ou save.
- Clearance agora restaura posição E rotação em cada tentativa; os pés do civil são controles independentes, portanto restaurar só quaternion deixava deslocamentos de tentativas anteriores.
- Mistura de entrada aumentada para 0,60 s; saída considera o alinhamento visual e mantém a última pose válida se o clipe adquirido terminar. Corrigido retorno brusco ao acabar o arquivo. Camada de tronco usa 70% da captura no passe e 85% no chute, com a postura nativa preservada como base; pernas/contatos continuam vindos da captura.
- Controle provisório sobre a corrida nativa: alinhamento visual amortecido até 18 cm para jogador em movimento, IK até 8 cm/0,35 rad. Só tenta alcançar bola baixa, próxima e oficialmente atribuída ao atleta; não muda posse, velocidade, impulso ou posição da bola. Ajustes que atravessariam a bola/o chão são recusados. Uma posse atribuída antes da chegada da bola interpolada não é tratada automaticamente como contato.
- Comparação do replay a 10 Hz: 28→3 passos com deslocamento visual extra acima de 12 cm em 100 ms; maior excesso 23,1→13,0 cm. Nos 53 quadros de posse fora de captura de passe/chute, proximidade pé-bola até 2,5 cm passou de 1→19. São métricas de apresentação, não prova de drible/domínio físico completo.
- Varredura a 30 Hz: 2.821 quadros com 22 jogadores; 305 avaliações do controle, 37 alinhamentos próximos e 3 tentativas recusadas pelo limite de colisão/piso; nenhuma penetração acima da tolerância, piso negativo ou desancoragem fora do orçamento. Mesmo 1×1 e 82 eventos. Os 48 contatos e o runtime do humanoide anterior também passaram nos testes; anatomia, pesos, rig e barra do short conferidos intactos.
- Cabeceios, desarmes/carrinhos, faltas com queda, fintas e defesas específicas continuam sem capturas adequadas adquiridas/validadas. Não afirmar que foram implementados por esses ajustes. Próxima evidência gravada usa saída separada `11x11-melhorado`, preservando a gravação anterior.
- Nova gravação concluída: replay 11×11 inteiro com 1.129 quadros e cinco trechos próximos (controle, dois passes e duas finalizações), 450 quadros em câmera lenta. Resultado 1×1/82 eventos; nenhuma rodada avançada. MP4 e capturas em `test-results/cartoon-football/11x11-melhorado/`, separados da versão anterior. Build completo aprovado; vídeo ainda não é teste de FPS em telefone físico.

### 23/10 — consolidação cartoon no mapa e câmeras da mesma partida
- Diego confirmou o estilo NO FACE dos Civis e pediu estabilizar a versão atual, sem retorno ao humanoide anterior e sem publicação automática. `loadPlayers` passa a usar cartoon por padrão local; humanoide/clipes anteriores preservados como opção explícita.
- Auditoria encontrou diferenças reais: mapa ainda usava atleta antigo, Rei da Bola estava vermelho genérico apesar da arte cadastrada clara com faixas vermelha/preta, e havia três enquadramentos diferentes de transmissão. Corrigidos carregamento e catálogo dos dois clubes, com gola redonda original no Rei e V no Neymarzetti. Não inventados IDs, variantes reservas ou artes traseiras oficiais; shorts/meias/chuteiras e costas continuam provisórios.
- Câmera compartilhada ajusta campo de visão conforme aspecto, bola e atletas próximos. Transmissão e Tática têm controles separados; entrada e navegação livre da cidade permanecem. Nenhuma alteração de escala/posições/IA para maquiar silhuetas pequenas ou sobrepostas à distância. Visão retrato exigiu ampliar limite da tática. Transição da câmera também conclui com replay pausado.
- Escala real conferida novamente: campo 105×68 m, abertura de gol 7,32×2,44 m, bola raio 0,11 m e jogador referência 1,78 m. Corpo/cabeça, pesos, bind, hierarquia e barra do short preservados; 23 ossos e 17 clipes.
- Partida completa: 950 quadros; 48 contatos habilitados e 3.429 amostras de suas janelas a 60 Hz; sem penetração/piso negativo/âncora fora dos limites nos testes. Comparação profunda dos 82 eventos com a linha do tempo original confirma placar 1×1, autores, assistências e tempos idênticos. Onze ações continuam sem captura aprovada. Não equivale a aprovação visual universal dos movimentos.
- Corrigida apenas a legenda de minutos do gravador, cuja conversão estava invertida. Relógio oficial do produto não foi alterado. Fonte de carreira continua fixture local de leitura; sem avançar rodada, banco ou publicação.
- Evidências consolidadas em `test-results/cartoon-football/consolidado-cameras/` (estádio QA existente; não compras da conta) e `11x11-consolidado/` (gravação no campo isolado existente). Emulação de telas/SwiftShader não valida desempenho em celular físico. Camisas claras de ambos exigem futura variante reserva real para melhorar contraste distante. Cabeceio, faltas, goleiro e dribles específicos continuam sem catálogo completo.
- Validação adicional da movimentação coletiva: `test-official-parity.mjs` compara uma execução independente do Motor2 com o adaptador 3D em 941 instantes: 20.702 posições (20.496 sem bola), erro de conversão zero, funções/goleiros/visibilidade preservados. Registra funções forma/marca/cobre/pressiona/opção/infiltra/ultrapassa e fases reais, sem afirmar que isso prova fluidez das animações.
- Comparação concluída nas três câmeras × três viewports: nove capturas do mesmo quadro oficial (14,1 s), mesmo placar/eventos/bola e 22 atletas; nenhuma exceção JS. Recursos estáveis em 139 geometrias/146 texturas durante essas trocas. Desenho do estádio QA variou entre 86 e 234 draw calls; não é medição de FPS físico.
- Vídeos consolidados gerados e decodificados/reproduzidos em Chromium: partida H.264 baseline 960×540, 94,083 s; trechos próximos em câmera lenta 14,8 s. Gravação completa a 12 fps, não benchmark. O vídeo é do campo isolado; o painel comparativo mostra o estádio/cidade.
- Relógio: regressão de 30.383 amostras, oito partidas, velocidades 0,5×/1×/2×/4× e pausa/fim passou; usa exatamente a fórmula e o minuto publicado pelo Campo2D. QA de continuidade deve fornecer `visualClock` e ticks oficiais, como o produto; `paused:false` sozinho com minuto estático não testa avanço real.

### 23/10 — bola congelada no vídeo e rotação compartilhada
- Diego identificou bola deslizando sem giro. Confirmado: `mechanics-audit.mjs`, usado pelo gravador, só atualizava posição. Nos dois renderizadores do produto a rotação Euler dependia da coordenada absoluta, inadequada para curvas/reinícios.
- `posicionarBolaFutebol3D` agora aplica a mesma posição/quaternion no mapa, visualizador e gravador. `RotacaoBola3D` integra rolamento por distância/raio no chão e para em repouso; mantém composição por quaternions nas mudanças de direção. Saltos de reposicionamento e bola carregada não geram rotação espúria.
- Adaptador visual usa amostragem canônica de 120 Hz na MESMA instância Motor2, sem segundo jogo ou mudança no motor oficial. Garante orientação repetível em seek/pausa/FPS diferentes. Giro aéreo é estimativa visual da velocidade de saída, limitada a 40 rad/s; não é spin físico medido, não aplica efeito/torque à trajetória.
- Escala conferida na geometria: raio 0,11 m, diâmetro 0,22 m e circunferência ~0,691 m. Campo 105×68 m, gol 7,32×2,44 m e referência do personagem 1,78 m. Não foi aumentada a bola para compensar distância de câmera/cabeça cartoon.
- Testes: circunferência/eixo/repouso/voo/bola carregada/reinício; 48 comparações de orientação a 12/30/60/120 Hz e seek com erro angular máximo <3e-8 rad. Paridade com Motor2 ampliada para XYZ da bola, além de 20.702 posições e 82 eventos. Auditoria completa 950 quadros + 3.429 amostras de janelas mantém 48 contatos e 1×1 sem penetrações/piso/âncora inválidos.
- Evidência nova gerada e reproduzida em `test-results/cartoon-football/bola-corrigida/`: foco na bola e em condução/passe/finalização, 60 fps, velocidade normal e trechos a 0,5×. O vídeo anterior a 12 fps não representa adequadamente movimentos rápidos dos painéis. Sem publicação/banco.

- Validação final do vídeo: 720 quaternions realmente renderizados conferidos, MP4 H.264 baseline 800×450/60 fps/12 s aberto e reproduzido em Chromium, inclusive busca no trecho final. Build de produção passou. Sem publicação.

### 23/10 — rede, continuação do gol e auditoria de futebol
- Pedido de Diego: rede deve reagir à bola; revisar o que ainda destoa do futebol. Rede anterior era rígida e tinha grade lateral incompleta. Agora fundo/teto/laterais têm grade e reação localizada amortecida ao impacto oficial, sem atualização de buffers em repouso. Não é simulação integral de tecido.
- Detectados no save original: 303 quadros de comemoração com bola suspensa e 94 com esfera além do plano traseiro. Fonte 2D também confirma um dos gols com altura interpolada que não cabe no vão real. Correção exclusiva de apresentação após confirmação: desaceleração de encaixe, entrada, contato, rebote, queda e pequeno quique. Campo `presentation`/`netImpact` separado de XYZ oficiais, usados também no giro visual. Sem mudar resultado, tempo, autores/assistências ou posições oficiais.
- Corrigidas marcas de pênalti (anel virou ponto preenchido), ponto central e arcos de escanteio de 1 m. Campo/estádio existentes preservados.
- Auditoria da partida: 49 passes, seis enfiadas, quatro interceptações, quatro dribles, três laterais, dois lances de falta, três chutes, dois gols e uma defesa. Não há nesta fixture todos os casos de bola parada/finalização.
- Pendências reais documentadas no README: captura de goleiro (encaixe pode parecer brusco), lateral/falta, poses de disputa corporal (centros mínimos ~0,33 m), corte/reposição do Motor2 após comemoração perceptível no mapa, uniforme reserva real para contraste. Origem civil disponível tem PickUp/Punch etc, sem defesa/cobrança de lateral adequada: não usar luta para fingir futebol.
- Teste das redes: dois gols, 606 amostras de continuação, deslocamento máximo ~0,239 m, rede oposta/antes do contato paradas, recuperação e seek. Paridade de fonte, rotação, escala e auditoria 950 quadros/48 contatos passaram novamente. Build passou. Sem banco/publicação.
- Revisão visual próxima mostrou o recuo dos gols sempre em terra, mesmo com gramado completo. Acrescentada faixa de gramado de 4 m atrás de cada linha de fundo somente quando a evolução já cobriu aquela extremidade; base de terra e modo registrado preservados. Usa os mesmos materiais/lotes, sem reconstruir o estádio. Gravação dos gols será atualizada para essa correção.
- Outro erro visual encontrado na aproximação: marcações eram tubos com topo ~8,5 cm acima do piso. Convertidas para faixas planas de 12 cm sobre o gramado, mantendo linhas/medidas e lote existente; postes/travessão continuam tubos reais. Pontos também baixados ao plano das marcações. Isso reduz geometria e elimina o aspecto de obstáculos brancos.
- Entrega visual concluída: vídeo dos dois gols atualizado com recuo gramado e linhas planas, 960×540/60 fps/8 s a 0,5×; posições realmente renderizadas e movimento das redes conferidos por quadro. MP4 reproduzido no Chromium, inclusive trecho final. Nada publicado.

### 23/10 — arquitetura das ações e três fundamentos
- Pedido: preservar Civis e motor oficial, corrigir primeiro disputa, passe e chute. Vídeo anterior auditado. Causas confirmadas: ações/posse/bola vêm antes da animação; encaixe aceitava tronco ~120° oposto ao passe; retarget descartava root motion horizontal; não havia controlador de ação nem volumes entre atletas.
- `FootballActionController`: seis estados, seleção pelo contato mais próximo, preparação/orientação, validação de distância/postura e proteção do contato. Nunca aplica impulso ou atrasa bola oficial. Contexto readonly `officialAction` auxilia antecipação do receptor; atributos/erros continuam no Motor2.
- Recalibrados 48 lances com clipes já existentes, considerando corpo, apoio e velocidade do pé. Nenhuma animação especial adicionada. Translação horizontal CMU extraída, escala medida das pernas (~0,658), velocidade de raiz ajustada por Hermite sob orçamento total de 0,60 m. Apoio usa âncora/rotação adquiridas e IK limitado 8 cm/0,35 rad, com guarda.
- Navegação visual prevê cruzamentos (0,45 s), desvia e separa volumes de tronco/cabeça/cabelo medidos; limite local 0,38 m e total 0,60 m. Não altera posições táticas/decisões oficiais. Dono pode ceder levemente fora do contato, sem mover a bola; contatos agendados ficam protegidos. Há diagnóstico explícito para restrições incompatíveis.
- Três trechos a 60 Hz sem conflito de volumes; 48 contatos com distância ~1 mm e orientação até ~31° após ajustes limitados de tronco/cabeça. Janela efetivamente plantada: velocidade do apoio ~0,0024 m/s no passe, ~0,097 m/s no chute. Medida bruta de pé baixo é registrada separadamente e não equivale a prova de ausência de deslizamento em todas as transições.
- Regressão completa: 950 amostras, 48 contatos e 3.803 amostras de janelas, sem penetração/piso/âncora inválidos ou sobreposição dos volumes de cabeça nas amostras. Mesmos 82 eventos e 1×1, fonte/overalls/descanso preservados. Indicador de direção oficial vs orientação visual ainda precisa interpretação/revisão em transições; não marcar toda a locomoção como aprovada.
- Bancada `scripts/cartoon-football/action-lab.html` com nove casos reais do mesmo replay. Vídeos normal/lento dos três fundamentos e dos seis complementares em `test-results/cartoon-football/action-controller/`. Quatro MP4 reproduzidos em Chromium. Reação das redes e giro da bola preservados.
- Limites: 11 ações sem captura aprovada; domínio/cruzamento sem gesto específico; primeiro toque e transições ainda provisórios. Perfis revisados por hash continuam específicos da fixture, sem calibração universal aprovada de qualquer save. Desempenho em aparelho físico pendente. Nada publicado, nenhum banco alterado.

### Futebol 3D — saída do pé (24/10/2026, local)

Revisado o ritmo dos contatos do passe inicial de Denis Law e chute de Souza no mesmo replay oficial 1×1. Captura agora acelera até o contato e continua avançando após a saída; relógio monotônico, marcador oficial fixo, raiz e apoio recalibrados. Dois lances inspecionados de perto e gravados em normal/lenta. Outras ações não receberam aprovação temporal automática. Paridade oficial, 48 contatos e regressão da partida inteira passaram; nenhuma publicação, alteração de banco ou dos modelos Civis. Detalhes e limites em `scripts/cartoon-football/README.md`, evidências locais `test-results/cartoon-football/release-sync/`.

### Futebol 3D — apoio, cadência e flexibilidade (24/10/2026, local)

Novo estilo Civil/NO FACE preservado. Corrida passa a usar as fases de apoio medidas no clipe e blending contínuo; foot locking residual de locomoção, inclinação leve de quadril/tronco e sombras suaves das solas. Anatomia/rig/skinning intactos; escala medida (personagens 1,78 m, bola 22 cm, campo 105×68 m) coerente, sem redimensionamento. Mesma partida 1×1/82 eventos; contatos e regressão completa passaram. Comparação de seis cenas antes/depois, normal/lenta, em `test-results/cartoon-football/fundamentos-refinados/`. Apoio ainda tem cobertura limitada e deslizamento residual; sprint usa Run e domínio continua provisório. Pausar/trocar câmera já não reinicia a correção dos pés. Sem publicação/DB; recuperação `recovery/antes-refino-apoio-20261024` em `613dec46`. Detalhes e métricas no README da bancada.

### Futebol 3D — partida completa e auditoria minuciosa (24/10/2026, local)

Mesma partida oficial 1×1 Rei da Bola FC/Neymarzetti, 82 eventos, 22 atletas; varredura a 60 e 30 Hz. Corrigidos trancos de navegação/disputas, espaço de grupos coincidentes nos reinícios, um pé penetrando a bola após grounding, conflito condução/desvio e reposicionamento da pose ao pausar. Reinícios usam posições correntes do mesmo motor sem interpolar voo fictício da bola; coordenadas brutas continuam preservadas. Câmera considera a bola efetivamente desenhada. Resultado final das amostras: zero conflitos de volumes, penetração pé–bola, piso inválido ou tranco extra fora dos reposicionamentos oficiais. 48 contatos revisados mantidos. Persistem transições, domínio/condução e captura específica de goleiro; ambos os uniformes claros também precisam de contraste/variante disponível. Não aprovar cabeceio/carrinho ausentes desta fixture.

Partida completa real em bancada do campo existente, 94 s/30 fps, mais sete trechos próximos em lenta, em `test-results/cartoon-football/partida-minuciosa/video/`. Relatório navegável `analise.html` e métricas `summary.json`. Sem publicação/DB/nova rodada; cidade/estádio e modelos aprovados preservados. Recuperação prévia `recovery/antes-auditoria-11x11-20261024` (`b4b5d1c4`). Detalhes e comandos no README da bancada.

### Futebol 3D — corrigir bola afastada, chute e goleiro (24/10/2026, local)

Diego reprovou o domínio/condução e o goleiro do vídeo anterior; não bastava contato pontual passar na métrica. Bola do Motor2 fica 75 cm à frente do dono e `encaixa` acaba apresentado como bola no chão. Corrigida a adaptação visual: avanço suave do corpo até 46 cm, passagem desse avanço ao chute, recuperação de três finalizações mais curta e liberação de avanço sem tranco. Rig Civil/NO FACE, anatomia, uniformes e motor preservados.

Recepção alta do mesmo replay recebe adaptação CMU 34_01 (recepção/lançamento de futebol americano, NÃO captura dedicada de goleiro), combinada com Jump/Crouch Quaternius CC0 e IK residual. Bola fica nas mãos após o evento oficial e é reposta por trajetória visual contínua até o receptor oficial. Renderizadores do mapa/campo consomem a mesma apresentação; entrada/versão de motor continuam validadas, sem criar outro jogo. JSON compacto de dois clipes, origem/licença/hashes preservados. Nenhuma compra, conta externa, DB ou publicação.

Varreduras finais 30/60 Hz, 22 atletas, mesmos 1×1/82 eventos: zero penetração pé–bola, piso inválido, conflitos dos volumes, raiz fora do orçamento e tranco extra fora de reinícios oficiais. Condução com afastamento acima de 22 cm diminuiu ~30%, mas não desapareceu. Domínio/condução ainda não têm captura própria, defesas rasteiras/mergulhos e outros saves não foram aprovados, contraste dos dois uniformes claros e celular físico continuam pendentes. Comparação normal/lenta e relatórios locais em `test-results/cartoon-football/posse-visual/`; campo isolado, não gravação na conta/estádio da cidade. Recuperação `recovery/antes-posse-visual-20261024` (`bf10f711`); detalhes no README da bancada.

### Futebol 3D — passe de costas e pega no peito reprovados (24/10/2026, local)

Diego encontrou passe para trás sem orientação e goleiro recebendo no peito no vídeo anterior. Confirmado Abedi Pelé→Danny McGrain23,7s: corpo155° contrário à saída, lance rejeitado ausente dos48contatos auditados. Adaptada captura `soccer` já existente, corpo orienta antes/na saída; diagnóstico agora inclui rejeitados explicitamente sem contato aprovado. Nove ações ainda sem captura de pé, não ocultar. Corrigida também identidade do passe46,8s: evento oficial é Oséas, metadado rejeitado apontava Denis Law; plano rejeitado sem janela agora entra no controlador sem fingir animação.

Goleiro usa CMU33_02 para pega alta com duas mãos,34_01 só na reposição; mesma permissão comercial, clips/hashes registrados. Não inventar rebote num evento oficial`encaixa`. Superfícies das mãos conferidas em todo intervalo de retenção, bola fora da cabeça/peito e transferência contornando punho; sem alterações de anatomia/rig/pesos. Duas mãos por80ms, salto adicional~10,5cm. Não é validação de defesas rasteiras/mergulhos. Vídeo próximo normal/lento e captura limpa sem placar cobrindo as mãos em `test-results/cartoon-football/passe-pega/`.

Cobertura completa:59passes/enfiadas/cruzamentos/chutes oficiais,49comcontato revisado,1reposição manual adaptada,9semcaptura. Partida inteira30Hz/2.821quadros: mesmos1×1/82eventos, zero conflito de volumes, penetração pé–bola, piso inválido, raiz fora do orçamento e tranco extra fora dos reinícios oficiais. Flags de deslocamento para trás e deslizamento ainda precisam revisão; o apoio do novo passe rápido NÃO está aprovado como fixo. Tentativas de root motion/plant pioravam transição e foram descartadas. Build/paridade/integridade preservados. Não considerar todos os fundamentos aprovados. Sem DB/publicação; recuperação `recovery/antes-passe-e-pega-20261024` em`2cedd6ce`.

### Futebol 3D — variedades de passe e chute (24/10/2026, local)

Diego pediu variedade real de passes baixos/altos/lançamentos e chutes fortes/altos/colocados/curvos. Integrados metadados canônicos de saída, altura, velocidade, distância e família de apresentação, com perfis revisados alimentados por catálogo real. Receptor acompanha bola alta com ajuste limitado de cabeça sobre as animações existentes; não afirmar domínio aéreo concluído. Paridade preservada e tipos/velocidades iguais em12/30/60/120Hz/seek. Chute colocado/cavadinha não inferidos apenas da altura ou atributo, curva explicitamente ausente no motor oficial.

No mesmo save1×1/82eventos, catálogo59lances,58metadados observáveis,56velocidades medidas antes de interferência. Arthur2,05s sem janela observável identificado. Chutes reais possuem picos0,94/3,91/2,72m; cruzamento3,74m. Não equivalem a novas técnicas de animação. Ajuste de cruzamento12,35s falhou na checagem3D(pé tocava acima do centro/afastava-se), apesar de encaixes horizontais: candidatos rejeitados, não fingir lançamento pronto. Necessários gesto de levantamento e recepção aérea apropriados. Sem curva lateral/Magnus no Motor2; não criar efeito só no3D divergindo do2D. Modelo/rig/skinning intactos; nada publicado/DB. Bancada/relatórios`test-results/cartoon-football/variedades/`, recuperação`recovery/antes-variedades-20261024`(`d3ab4978`).

### Futebol3D — auditoria como partida completa e correção de regras (24/10/2026, local)

Diego: não precisa ensinar/listar cada jogada; revisar o futebol inteiro. Criada matriz39eventos+25grupos implícitos com fontes e critérios:P0controle/contatos/organização/reinício,P1disputas/faltas/bolas paradas/cabeça/goleiros,P2especiais. Relatório local`test-results/cartoon-football/futebol-completo/coverage.html`; não representa todos os gestos prontos.

P0real: lateralOséas11,3s era`passe`genérico e usava chute de pé, dentro dos49contatos auditados. Novo contexto canônico preserva parada/cobrador/lado/ponto/motivo e origem da cobrança; três laterais exigem mãos e nunca selecionam chute. Retirado um falso aprovado: agora48contatos de pé+1reposição manualGK,7ações de pé e3laterais ainda sem captura. Acervo não forneceu lateral legal; não improvisar arma/uma mão/catch como arremesso pronto. Cabeceio é contato de cabeça, não de pé.

Faltoso/vítima/vantagem mapeados corretamente(`lado`da vantagem é da vítima); assistente/receptor no mesmo time, cartões não apagam falta no mesmo instante, impedimento não vira falta sofrida, acréscimo não vira atleta. Exposta recuperação temporária sem inventar queda.69amostras paradas com velocidade bruta alta agora usam pose/velocidade de apresentação imóvel; dados oficiais preservados. Árbitro olha o ponto da cobrança até em pausa. Testes de43comparações/12-120Hz/seek e auditoria11x11 inteira30Hz preservam1×1/82eventos; sem volumes/penetrações/piso/raiz/tranco extra nas amostras. Ainda há deslizamento,75flags de orientação e capturas ausentes; não declarar futebol finalizado. Fixture sem escanteio/pênalti/cabeceio não valida esses casos. Sem motor2/overalls/DB/produção alterados. Recuperação`recovery/antes-contexto-futebol-20261024`(`b4769104`).

`audit-whole-match.cjs` passa a executar a matriz geral automaticamente antes da varredura física, impedindo que novos tipos de evento fiquem fora da revisão por serem ignorados na contagem de chutes.

## 🗂️ 25/10 — Carreira organizada (proposta, ESPERA OK do Diego)
Pedido: *"tá muito embolado… as abas… no Clube tem outras abas que não é embaixo, é em cima… analise tudo"*. Mockup:
`scripts/mockups/carreira-organizada.png`. 4 regras pra todas as abas (só na conta dele primeiro):
1. O jogo só aparece em JOGOS (inteiro) e TABELAS (faixinha). 2. Nas outras abas nada de jogo — ele segue rolando e a aba
Jogos ganha selo "AO VIVO" na barra de baixo. 3. Sub-abas SEMPRE logo abaixo do título, UMA fileira (Clube perde o 2º andar:
Estádio · Loja · Dinheiro · Gestão). 4. 5 abas embaixo: o Rank vira sub-aba de Tabelas (Tabela · Artilharia · Bola de Ouro);
avisos (criar conta/salvar) só na Central.
- 25/10 (2ª parte): ele perguntou se dá pra JUNTAR Jogos e Tabelas (*"o pessoal gosta mais de ver tabela do que jogos"*). Mockup
  `scripts/mockups/carreira-jogo-e-tabela.png`: 🅰️ JUNTO (placar grande em cima, tabela à vista logo abaixo) × 🅱️ TABELA PRIMEIRO
  (jogo vira faixa preta que abre, tabela ocupa a tela e mexe ao vivo com ▲▼ e o placar de cada time do lado do nome — sempre no
  ritmo do relógio da tela, nunca antes: anti-spoiler). Barra de baixo com 4 abas. ⏳ Espera ele escolher.
- 25/10 (3ª parte) — ele corrigiu: *"o placar ou campo 2D não pode ser faixinha… eu tava falando dos jogos restantes"*. Ou seja:
  o SEU jogo continua GRANDE (placar ou Campo 2D); quem vira tabela é a lista de OUTROS JOGOS da rodada → tabela ao vivo com o placar
  de cada time do lado do nome e ▲▼. Ele cobrou *"cadê os jogos do restante do pessoal?"* → os outros jogos ficam num QUADRO COMPACTO (2 colunas, amarelo = gol recente) entre o seu jogo e a tabela. Mockup `scripts/mockups/carreira-jogo-tabela-ao-vivo.png` (placar × 2D). ⏳ Espera OK.
- 25/10 (4ª parte) — *"não ficou bom… o que o pessoal mais gosta é tabela… embaixo os jogos da rodada organizado por liga… e copa,
  quando for copa, a tabela passa a ser chaveamento"*. Leitura: a aba JOGOS segue com o seu jogo grande; a aba TABELAS vira a estrela —
  tabela ao vivo em cima + jogos da rodada por divisão embaixo (a sua aberta, as outras fechadas); na quarta de Copa abre no
  CHAVEAMENTO + jogos da Copa da noite. Mockup `scripts/mockups/carreira-tabelas-estrela.png`. ⏳ Espera OK.
- 25/10 (5ª parte, a CERTA) — *"era como tava antes: o placar cinema ou campinho 2D e embaixo a tabela da liga e os jogos da liga embaixo
  da tabela… e quando for copa é só trocar: tabela da copa em chaveamento e jogos da copa embaixo, mas o campinho ou placar ainda em cima"*.
  Aba JOGOS = ① placar cinema / Campo 2D + Manual/Auto/2D ② tabela da liga ao vivo ③ jogos da liga. Na Copa: ① o mesmo placar ②
  CHAVEAMENTO ③ jogos da Copa da noite. Mockup `scripts/mockups/carreira-jogos-placar-tabela.png`. ⏳ Espera OK.
- 25/10 (6ª parte): ✅ Jogos + Tabela numa aba só FEITO no branch (só conta dele, junto do calendário — `jogoTabela` em
  pyramidseason): placar/2D do mesmo tamanho em cima, tabela da liga e jogos embaixo; na Copa, chaveamento + jogos da Copa; a aba
  Tabelas sai da barra (Central · Jogos + Tabela · Elenco · Rank · Clube). Foto real: `scripts/mockups/carreira-jogos-tabela-real.png`.
  ✅ 25/10 *"ok publique tudo na minha conta"*: PUBLICADO (só conta dele) junto com o Clube numa fileira só (arrasta pro lado,
  foto `carreira-clube-uma-fileira-real.png`) e o selo "AO VIVO" na aba Jogos + Tabela. ⏳ Ainda falta: tabela com o placar de cada
  time do lado do nome + ▲▼ (mockup aprovado); Elenco com Titulares/Reservas/SAF logo abaixo do título (hoje ficam lá embaixo).
  (O aviso "criar conta" só aparece pra quem joga sem conta — na conta dele nunca aparece.)
  ✅ 25/10: Elenco e Rank também SEM o jogo (faixa e placar escondidos, não desmontados — o relógio segue: 8' → 84' no teste).
  Ele cobrou: *"a gente não combinou que não era pra aparecer mais o jogo rolando nas abas de elenco e rank?"*. O jogo agora só
  aparece em Jogos + Tabela (e no Clube, quando ele aperta Assistir).

- 25/10 ⚡ **Modo Pokémon (salas online)**: conceito FECHADO em `docs/conceito-pokemon.md` (leilão de sempre sem Clubes, 6 tipos, 8 treinadores com bot, liga só de ida + semi/final jogo único, decisão a cada batalha, rival só visível na cerimônia). Nada codado. Fechado também: batalha "quem ganha fica" e, na hora da escolha, só aparecem os tipos dos BOTS (pessoa: tem que lembrar da cerimônia).

## ⚡ 25/10 — MODO POKÉMON na Partida Rápida (FEITO, só a conta do Diego, em teste)
Pedido: *"faz na minha no partida rápida porque quero jogar com bots só pra minha conta pra eu testar"*. Conceito: `docs/conceito-pokemon.md`.
- Gate `POKEMON_TESTERS` (sport.ts). Botão "⚡ POKÉMON · TESTE · SÓ VOCÊ VÊ" na tela de montar a partida rápida.
- Leilão DE SEMPRE (envelope/Tocaia/pregão aberto, 100 moedas, sem Clubes): formação `pokemon` (6 vagas nos 5 setores, que viram
  LOTES 1–5; o 5º vale 2). Baralho = os 200 espalhados nos lotes por categoria (`baralhoPokemon`, muda a cada partida).
- Arte: só Lenda tem arte própria (26 webp em `img/pokemon/`, ~23 KB, artes oficiais sem olhos/nariz/boca — marca da Nintendo,
  avisado); o resto = desenho do TIPO (18, em código). Cartas mostram os tipos OFICIAIS.
- Depois da cerimônia: `pokemon-liga.tsx` — 9 rodadas (10 treinadores), escolha 3 + ordem + tática em 12s, batalha animada
  ("quem ganha fica", narração com SUPER EFETIVO), tabela só mexe no fim, semifinal 1×4/2×3 e final jogo único, campeão.
- Motor puro `pokemon-batalha.ts` + dados `pokemon-dados.ts`. Trava `npx tsx scripts/testa-pokemon.mts`. Fotos: `scripts/mockups/pokemon-real-*.png`.
- ⏳ Falta/ideias: salas online (ele quer no futuro), som, animação do golpe, o "dia" (nível) aparecer na revelação do pokémon.

## 💳 25/10 — PLANOS NOVOS (em discussão com o Diego, NADA mudou no jogo)
Escada que está saindo da conversa (ele ainda vai fechar o valor do vitalício):
1. 🎣 Iscas: **Manual + Campo 2D por 1 dia R$ 4,99** (*"por um dia 4.99"*) · **3 salas extras R$ 4,90**. Ficha de carreira NÃO é isca
   (*"ficha não é isca"*) — volta pros avulsos.
2. ⭐ **Mensal R$ 9,90** = jogo todo liberado (Manual, 2D, salas à vontade, nuvem, fichas, cor de apoiador) **+ o personagem (presidente), criar clã e o NOME DO PERFIL RESERVADO** (25/10, pedido dele) **+ participação em campeonatos oficiais + Minhas Ligas + Carreira Online (EM BREVE)**. Na tela da isca: "2 dias já pagam o mês".
3. 🛒 Avulsos (25/10, ele cobrou os que já existem): **entrada de gala R$ 14,90** · **Gala Exclusiva (sob medida) R$ 49,90** — hoje a gala única NÃO é vendida avulsa (só no Fundador); vender muda essa regra, ⏳ ele confirmar · **canto da torcida R$ 10** · tema da sala (coração R$ 6,90 · clube R$ 6,90 · Fundador R$ 9,90) · ficha R$ 9,99 · Super Chat R$ 2,99 · **presidente: criar o personagem = 1ª roupa R$ 1,99 (já dá o boneco), roupas/peças R$ 1,99–4,99 pelo nível** (regra de 19/10). Iscas ganharam **⚔️ criar clã R$ 4,90 (grátis no Craque)** — como já é hoje. Preços de gala são PROPOSTA minha.
4. 🛡️ Clube: escudo R$ 39,90 · mascote R$ 39,90 · manto R$ 19,90 · **combo R$ 79,90** (ele achou os primeiros valores baratos).
5. 💎 **Vitalício completo** (tudo pra sempre + combo do clube): ele quer BEM caro (*"senão não paga mais mensal"*); **R$ 299,90 (confirmado 25/10: *"sim 299"*)**. Mockup `scripts/mockups/loja-planos-novos.png`. ⏳ Espera OK do visual antes de codar.
⚠️ Quem já pagou Lenda/Batismo/Fundador fica com tudo pra sempre (regra "planos novos não mexem em quem já paga").
- 🏆 25/10 — "CAMPEONATOS OFICIAIS" (o item do Plano Craque) = **O CAMPEONATO OFICIAL** que ele descreveu: transmissão com narrador +
  comentarista, 1ª Divisão Fundador / 2ª Divisão Batismo, rodadas alternando Cartas cegas · Tocaia · Pregão aberto, inscrição R$ 10,
  pote pros 5 primeiros (3× · 2× · 1× · 1× · 1×). Mockup `scripts/mockups/campeonato-oficial.png` (só pra ver). ⏳ Nada codado.
  ⚠️ Inscrição paga + prêmio em dinheiro pode cair em regra de jogo/aposta no Brasil — consultar antes de abrir.

### 🏆 Campeonato Oficial — 25/10, 2ª conversa (nada codado)
- Diego: *"tá errado os valores… preciso ganhar dinheiro"* — o pote 100% devolvido em prêmio não deixa nada pro jogo.
- Proposta levada: prêmio em COISA DO JOGO (plano, batismo, ficha, gala), não em dinheiro → a inscrição fica inteira pro jogo e sai do risco de "aposta".
- Formato proposto: UMA liga oficial por divisões (Várzea → D → C → B → A), temporada de 1 mês, sobe/desce no fim; as copas (Mundo, Liberta, regionais, Copa dos 8) viram EVENTOS avulsos de fim de semana, com inscrição própria.
- Esperando o OK dele nos dois pontos.
- Modo da noite: cada noite = uma sala online normal (leilão + campeonato da sala), pontos pela colocação somam na tabela do mês da divisão. Diego sugeriu SORTEIO do modo; proposta: 🎰 roleta na abertura da noite, igual pra divisão inteira, sem repetir modo no mês (os 3 aparecem). Esperando OK.
- Quem falta: inscrição não volta (só se o JOGO cancelar a noite). Proposta: faltou = 0 ponto na noite, mas no fim do mês a PIOR noite de cada um é descartada (conta as 3 melhores de 4). Esperando OK.
- 📐 PLANO em mockup (`scripts/mockups/campeonato-plano.png`, gerador `scripts/mockup-campeonato-plano.mjs`): pirâmide A(20)·B(20)·C(2 grupos)·D(4 grupos)·Várzea(sem limite), 4 sobem/4 caem por mês; 1ª temporada pelo Ranking Global; 4 sábados 20h (~45 min a noite), roleta sem repetir no mês, pontos 25·20·16·13…1, descarta a pior noite; inscrição por divisão A 30 · B 20 · C 15 · D 10 · Várzea 5; prêmios em itens (Vitalício pro campeão da A…). Exemplo: 180 inscritos = R$ 2.500/mês. Esperando OK.
- 🔁 25/10: Diego quer **5 salas FIXAS** (Várzea·D·C·B·A = 100 vagas), não grupos. Mockup refeito: fila de espera (4 últimos da Várzea saem, 4 da fila entram; quem não paga libera vaga), prêmios melhores por divisão (A: Vitalício + clube completo · vice clube completo · 3º 6 meses Craque · campeões B/C/D/Várzea Craque + avulso · quem sobe ganha a inscrição seguinte · Campeão do Ano = Fundador + carta), aba "por que entrar" (selo, telão, final ao vivo). 100 vagas = R$ 1.600/mês. Esperando OK.
- 🔁 25/10 (mais tarde): proposta nova — cada noite é o dia de UMA divisão (seg Várzea · ter D · qua C · qui B · sex A), o campeonato começa e acaba na mesma noite (leilão com roleta + 38 rodadas), 4 sobem/4 caem na hora, temporada = semana. Diego: **"todo mundo pagar por temporada a inscrição"** → leitura: A 30 · B 20 · C 15 · D 10 · Várzea 5 POR TEMPORADA (semana) = R$ 1.600/semana ≈ R$ 6.400/mês com 100 vagas. Perguntei se é isso.
- ✅ FORMATO DO DIEGO (25/10, mockup final `scripts/mockups/campeonato-plano.png`): precisa do ⭐ Craque R$ 9,90/mês pra jogar · 5 divisões de 20 (100 vagas) + fila · seg Várzea · ter D · qua C · qui B · sex A (ao vivo) · temporada começa e acaba na noite (roleta do leilão + 38 rodadas, sem bot) · 4 sobem/4 caem na hora (4 últimos da Várzea saem, fila entra) · inscrição POR TEMPORADA A 30 · B 20 · C 15 · D 10 · V 5 · prêmio até o 3º, campeão leva ~o dobro do que gastou: A 1º Batismo completo OU R$ 79,90 Pix · 2º escudo/mascote OU R$ 40 · 3º próxima grátis; B escudo/mascote · manto · grátis; C escudo/mascote · gala · grátis; D manto+canto · canto · grátis; V gala+grátis · tema · grátis. Dinheiro só na Série A (Diego: "tem que ter na série A dinheiro"; metade do pote = NÃO). Mais: selo da divisão, moldura de campeão 1 semana, telão, taça no perfil. ~R$ 1.600/semana. Esperando OK pra virar telas de verdade; checagem jurídica antes de lançar.

### 📊 Abas da carreira organizadas — LIBERADO PRA TODOS (25/10)
- Diego: *"bota organizar pra todos agora as abas… jogos e tabela juntos… e as outras abas sem ter mais jogos… N é p por p todos nada de novo do mapa e nem do campo 2d"*.
- `ABAS_JUNTAS_GERAL = true` (pyramidseason.tsx): `jogoTabela` vale pra toda carreira solo (fora online/co2/basquete), sem depender do calendário. Junto: aba Clube sem o jogo (`ll-cx-clube-limpo`), Elenco/Rank sem o jogo, tática no cartão do Elenco e embaixo dos gols, sub-abas do Clube numa fileira, selo AO VIVO, sem NA COLA/trilha. As pílulas antigas (quando a barra de baixo está desligada) também perderam a "Tabelas".
- Fica SÓ na conta dele: calendário (dias passando, Copa nas quartas), Mapa 3D, Campo 2D.
- Avião da home já estava pra todos (`ESPACOS_GERAL = true`, Grêmio EC Campo Grande).
- Reverter: `ABAS_JUNTAS_GERAL = false`.
- Testado na bancada sem login: rodada 1→2 andou com o jogo escondido em Elenco/Rank/Clube, sem erro na página; `npm run carreira-limpa` ok.

### 📅 Calendário nas abas — mockup (25/10, esperando escolha do Diego)
- Pedido: *"aperfeiçoe melhor ainda… e melhore nas outras abas… fica em todas as abas ou não?"*. Mockup `scripts/mockups/calendario-abas.png` (gerador `scripts/mockup-calendario-abas.mjs`), 3 jeitos:
  A) Jogos com a semana DOM→SÁB (hoje amarelo, ⚽ domingo liga, 🏆 quarta copa) + próximo jogo grande com contagem "2 DIAS"; nas outras abas uma faixa fina no topo (data + próximo jogo + ⏩ Pular) — minha recomendação.
  B) outras abas sem nada; data no cabeçalho e selo "QUA 18" em cima de Jogos na barra de baixo.
  C) o cabeçalho preto vira a semana em bolinhas + ⏩.
- Hoje (só conta dele): Elenco/Rank/Central sem faixa; Clube com a faixa. Selo da barra de baixo com contagem ainda não existe.
- 🔁 25/10 (mesma conversa): ideia DELE — **a Central é a casa**: os dias passam na Central (semana DOM→SÁB + próximo jogo com contagem); no dia do jogo aviso "Dia de jogo!" e vai sozinho pra aba Jogos em 3s (dá pra "ficar aqui"); apitou (e a coletiva) → volta pra Central com o resultado em cima até o próximo jogo. Elenco/Rank/Clube: faixa fina com a data e ⏸️. Mockup `scripts/mockups/calendario-fluxo.png` (gerador `scripts/mockup-calendario-fluxo.mjs`). Esperando OK; depois faz na conta dele.

### 📅 A CENTRAL É A CASA — FEITO (25/10, só conta do Diego, junto do calendário)
- Mockup aprovado `scripts/mockups/calendario-fluxo.png` (*"sim faz"*). Na Central, nos dias vazios, o cartão da semana (`CalendarioProximo`: semana, próximo jogo, boletim, ⏩ Pular, seus jogos) entra NO LUGAR do camarote (`semana` do CentralCarreira).
- Dia de jogo: na Central, quando a semana acaba (automático), a Copa da quarta entra ou a rodada já está no ar → "⚽ Dia de jogo!" e em 3s vai pra aba Jogos (botão "ficar aqui"). Apitou e nada pendente → 3s depois volta pra Central. Elenco/Rank: faixa fina SÓ nos dias (no jogo, nada); o "Voltar" da faixa leva pra Central.
- 🏟️ Botão "Ver o jogo no Campo 3D" no Controle da partida (só onde o mapa existe = conta dele): pede a câmera 'broadcast' (`pedeCameraDoMapa`, controle-partida-mapa.ts) e vai pra aba Clube, rolando até o mapa.
- Testado na bancada: Central → aviso → Jogos (rodada 2) → Central (seg→sáb) → aviso → Jogos (rodada 3) → Central, sem erro.
- 📢 Aviso da comunidade pronto: `scripts/posts/aviso-2026-10-25-calendario-carreira.png` — só postar quando o calendário for liberado pra todos (hoje é só da conta dele).
- 🟢 LIBERADO PRA TODOS em 25/10 (`CALENDARIO_GERAL = true`, sport.ts; *"publique pra todos já sem o mapa 3D e campo 2D"*). Reverter = `false`. Testado sem login: semana na Central, aviso, jogo, volta; sem botão 3D. Pendente: o 3D ainda não foi testado com o mapa aberto na bancada (precisa da conta dele).
- 🛑 26/10 (Diego, print da Central): *"não quero que pule de maneira automática… chegou o dia do jogo, para e o usuário decide se vai"*. Saiu o relógio de 3s: o "Dia de jogo!" fica parado com "⚽ Ir pro jogo" / "agora não" (aí vai pelo ⏩ do cartão). Conserto junto: o cartão da semana na Central não ocupava a linha toda (faltava `flex: 0 0 100%` no lugar do camarote) e ficava estreito/fora de ordem. A volta pra Central depois do apito continua.
- 🛑 26/10 (2º print, 22h16): *"não quero que apareça esse botão de ir pro jogo [na Central]… se eu não for pro jogo e apertar na aba de jogos, já começa automático, tem que ter o botão ao lado do auto pra iniciar… o usuário tem que tá livre pra dar uma volta nas abas… tire o rank global da central"*. Feito:
  - Nenhum jogo começa sozinho com o calendário: `jogoOk` (chave `temporada:rodada:l|c`) só é marcado no "⚽ Ir pro jogo" do aviso ou no "▶ Começar o jogo" (aba Jogos, pra todo plano). O auto-avanço da rodada e a Copa da quarta esperam essa chave.
  - O aviso "Dia de jogo!" aparece na Central E no Jogos (sem relógio); "agora não" some com ele até o próximo jogo.
  - Saiu a volta automática pra Central depois do apito (a pessoa fica livre).
  - Central sem "⏩ Pular pro jogo" (no Manual o "Próximo adversário" fica, é o único caminho); no Jogos o ⏩ some quando a semana já acabou.
  - Ranking global saiu da Central (e a leitura dele no banco junto) — fica só na aba Rank.
  - Testado sem login: 8s parado no Jogos sem começar; "Começar o jogo" leva da rodada 3 pra 4; sem erro.
- 🔧 26/10: saiu a faixa amarela "Manutenção rápida no servidor" (*"toda hora aparece"*) — o teste do servidor fica, só re-tenta as pendências (`MaintenanceBanner`, index.tsx). O convite de conta da carreira virou UMA linha: "💾 Pra salvar sua carreira, crie uma conta." + botão "✏️ Criar conta".
- ⏳ PEDIDO 26/10 (a decidir com ele): conta GRÁTIS salvar na nuvem, mas avisando no 1º salvamento que fica guardado 7 dias; quem apoia = ilimitado e mais de uma carreira. Mexe na regra de 07/10 ("nuvem só pra quem paga") e precisa de limpeza no banco depois dos 7 dias — perguntei as regras antes de fazer.
- ☁️ 26/10 FEITO: **conta grátis salva na nuvem, com prazo** (*"se passar de 7 dias sem uso ela é excluída automaticamente pra quem é grátis… só pra quem não tem plano… só quem não tem usado o save"*). Revoga o "nuvem só pra quem paga" de 07/10.
  - Jogo: `nuvemAceita` aceita toda carreira; `savePyramidCloud` devolve 'nuvem7' pra conta sem plano; no 1º salvamento (por aparelho, `esc-nuvem7-visto`) a faixa diz "sem plano fica 7 dias" e abre a janela dos planos com o aviso (`JanelaNuvemPlanos aviso7`).
  - Banco (`supabase/migrations/20261026020000_nuvem_gratis_7_dias.sql`): `esc_nuvem_gratis` marca quem é SEM PLANO e sobe pela 1ª vez a partir de hoje (gatilho no insert de `esc_pyramid_saves`); `esc_nuvem_gratis_limpa()` todo dia 09:17 UTC (cron `esc-nuvem-gratis-7d`) esvazia a carreira da NUVEM de quem está marcado, sem plano e 7 dias sem salvar. Quem já tinha save antes de 26/10 não tem marca → nunca é tocado. Quem paga nunca é tocado. A cópia do aparelho fica.
  - (A versão que APAGAVA a linha pedia confirmação no Supabase e travou 2×; ficou ESVAZIAR, que pro jogador é o mesmo.)
  - Trava: `npm run nuvem-craque` (reescrita pra regra nova).
- 🛑 26/10: o "Dia de jogo!" não aparece mais com a rodada JÁ rolando (ele perguntou por que aparecia) — só no dia que chegou e ainda não começou.
- 🛑 26/10 (3º e 4º prints): **a janela "Dia de jogo!" SAIU de vez** (*"continua aparecendo esse modal que eu disse que não quero"*) — chegou o dia, a semana para e o cartão da semana troca o ⏩ por "⚽ Ir pro jogo" (`irJogo` do `CalendarioProximo`); na aba Jogos fica o "▶ Começar o jogo". E onde a faixa do calendário aparece (Elenco/Rank nos dias, Clube), a faixinha grudada "Rodada N/38" do topo some (`faixaCalAqui`) — *"a faixa de calendário deve continuar… o selinho da rodada é que não deve nessas outras abas"*.
- 🔧 26/10 (prints 23h51–23h54): aba Jogos nos dias = só a semana na horizontal + "▶ Começar o jogo" (a lista vertical "Seus jogos" e o "Ir pro jogo" ficam SÓ na Central); o "Ir pro jogo" aparece mesmo com decisão/evento pendente (a pendência se resolve no Jogos; o jogo só anda depois); saiu o "⚽ ACOMPANHAR NO ESTÁDIO" de baixo do placar (o mapa 3D continua recebendo o jogo via `PublicarPartidaEstadio`); o selinho grudado "Rodada N/38" sai de TODAS as abas menos Jogos.
- 📻 26/10 (prints do Football Manager): **a faixa de narração pisca no GOL** — verde do Bom Jogador (#2E9E5B) ⇄ creme, fundo e letra trocando, ~2,4 s (`radio-pisca.ts`/`.css`, `PISCA_GOL_MS`), por cima da cena do mascote. Placar cinema (gatilho = número de gols subir) e Campo 2D (gatilho = festa do gol). E a rádio da carreira virou UMA linha, no creme, sem os selos "Rádio Legends/Lance/Jogo" (*"são 3 coisas iguais… tudo numa linha só"*). Vídeos: `scripts/posts/radio-gol-placar.mp4` e `radio-gol-2d.mp4`. **No branch, esperando OK** pra publicar.
- 📻 26/10 (OK do Diego: *"gostei, só acho que tem que piscar mais rápido"*): no gol a faixa grita "⚽ GOOOOOL DO <TIME>!" e pisca SEM PARAR verde (#2E9E5B) + letra bege ⇄ bege + letra preta, 0,18 s cada cor, por 6 s (`PISCA_GOL_MS`). Placar cinema (carreira e salas) e Campo 2D. Rádio da carreira = uma linha, bege com letra preta, sem selos. PUBLICADO.

### 💸 26/10 — Clã: 2º clã R$ 4,90 e escudo personalizado R$ 9,90
- Pedido do Diego: *"segundo clã na loja coloca 4,90 e escudo a 9,90"*. 2º clã (`cla_extra`) 9,90 → **4,90**; escudo de clã
  (`escudo_cla`) 14,90 → **9,90**. Banco (`esc_mp_preco_ref`, migration `20261026190000`) e textos da tela (cla.tsx, cla-ver.tsx). Criar
  o 1º clã sem plano continua R$ 4,90. Reverter = voltar as duas linhas (9.90 / 14.90).

### 📊 26/10 — Painel "Quem apertou nos planos" no #admin
- Pedido do Diego: ver quantos apertam no Craque Salas 9,90 · Craque Completo 14,90 · ver todos os planos, e quem tenta criar sala e
  não consegue. Quadro `FunilPlanosAdmin` (admin.tsx) lendo `esc_admin_funil_mensal` (hoje/7 dias, toques e pessoas + assinantes do
  mensal). Novos registros em `apoio_intents`: "🏟️ bateu no limite de sala do dia", "🏟️ limite de sala → ver os planos" e a Loja
  aberta pelo limite (`ancora="loja-salas"`, que agora abre rolada nas Salas extras). O limite só começa a contar a partir de hoje.
- Ainda combinado e NÃO feito: a janela de ofertas na hora da trava (sala: 4,90 · 9,90/mês · ver planos; Manual: 24h 9,90 · 14,90/mês · ver planos).

### 〰️ 26/10 (noite) — Mapa 3D: tremedeira, trava e câmeras — NO BRANCH, esperando "publica"
Pedido: *"ainda acho q tá MT lento… os jogadores meio q se tremendo… quero escolha de câmera q dê p ver legal o jogo"*.
- Medido quadro a quadro a 60 Hz (bancada `jit.mjs` no scratchpad: roda o 3D sem desenhar e grava cabeça/raiz de cada boneco):
  · o motor anda em passos de 1/20 s e o desenho ligava os pontos em reta → velocidade mudava a cada 3 quadros. Agora curva lisa
    (B-spline de 3 pontos, `FutebolOficial3D.avanca/curva`), bola junto. Trancos >1 cm: 11% → 0,1% dos quadros.
  · o "pé no chão" recolava o corpo pelo pé mais baixo: na corrida o corpo afundava 15 cm de uma vez. Agora sobe na hora e desce devagar.
  · a corrida importada sobe-e-desce a cabeça ~17 cm; amortecido pra ~55% (osso `Body_1`).
  · boneco médio (8–32 px) mexia o corpo só 12×/s → agora todo quadro.
  · sombra dos bonecos andava em degraus (15×/s no celular) → com a câmera do jogo: todo quadro no PC, 30×/s no celular.
- Trava: o ajuste fino do pé (locomotion-grounding) era 59% do custo do quadro; agora só nos bonecos GRANDES. Custo do quadro
  no PC daqui ~15,6 ms → ~8,3 ms. (Não dá pra medir FPS de celular aqui — placa simulada.)
- Câmeras: nova **🎥 Acompanhar o lance** (atrás da jogada, no sentido do ataque de quem tem a bola; troca de lado com corte seco
  depois de ~0,9 s de posse). **Transmissão** e **Lateral próxima** no celular em pé subiram (mais campo, menos arquibancada).
  Textos do seletor seguem só em PT (o componente todo é PT) — falta EN quando liberar geral.
- Ainda dá pra fazer: o campinho 2D escondido roda um 2º motor igual ao do 3D (~4% do quadro cada).
- ✅ **Estádio caldeirão** (pedido 26/10 com print, arte aprovada: *"Aprovado"*): a arena inteira apertou em volta do campo e ficou
  quase retangular (superelipse) — `APERTO` (15,5 m × 12 m) e `FORMA` no `outline` de presidencia-complexo-arquitetura.ts; as medidas
  da planta seguem no tamanho antigo e o contorno aplica o aperto. Portaria: a entrada fica onde a praça/transporte chegam e o
  corredor coberto vai até a fachada nova (`inside` dos portões). Chão que sobra em volta do campo = grama quando o campo já é de
  grama. Testes: os mesmos de antes passam (arquitetura com a sonda dos bancos em −39 em vez de −42; LOD aceita 80–96 cadeiras na
  fila 1 nos cantos). O camarote ficou onde estava (atrás do 2º anel) — dá pra trazer pra dentro depois, se ele pedir.

### 🧍 26/10 (noite) — Boneco novo de jogador + movimentos de futebol do Mixamo (TESTE, fora do jogo)
- Diagnóstico: o boneco do 3D só tinha 5 movimentos gravados (parado/andar/trotar/correr/pular) + 1 chute; passe, domínio, giro,
  cabeçada, carrinho e goleiro eram improviso em código → *"todos fundamentos do jogador ruins"* (Diego).
- Diego baixou 63 movimentos de futebol do Mixamo (passe, condução, chute, cabeçada, carrinho, lateral, domínio de peito,
  jogging pra trás/lado, goleiro: defesas, encaixes, reposição…). Arquivos crus ficam FORA do repo (licença Adobe).
- Estilo escolhido por ele: corpo de jogador de verdade no traço da carta (arte do Pirlo de corpo inteiro), não o cabeçudo.
  Boneco 3D feito no Meshy (10.378 triângulos, textura 2K) com **esqueleto Mixamo** do próprio Meshy → os movimentos entram direto.
- Conversão que funciona (bancada `verrig3.mjs` no scratchpad): rotação de mundo com as poses de referência casadas — a fonte
  (pose em T do Mixamo) é dobrada pra pose em A do boneco, osso a osso, antes de copiar o movimento. Sem isso o tronco deformava.
- Falta (próximas levas): boneco BASE branco pra pintar a cor de cada clube; cabelos por jogador; trocar o boneco do campo 3D
  por este; ligar cada movimento ao lance do motor (passe/domínio/chute/cabeçada/carrinho/goleiro/lateral) com o contato no
  tempo certo; correr de costas/de lado (jogging do Mixamo); peso pro celular (22 bonecos). Mostrar prints antes de publicar.
- ✅ 27/10 (no branch, NÃO publicado): `public/futebol3d/jogador.glb` (3,2 MB) montado por `scripts/futebol3d/monta-jogador.mjs`
  — roupa BRANCA pintada no jogo pela cor do time (máscara `jogador-roupa.png`: R camisa · G calção · B meião; alfa = pele/cabelo),
  e alvo de forma **careca** (o cabelo encolhe até o crânio). Regra do Diego: *"pra quem não é lenda, pode deixar o boneco careca"*;
  lenda com rosto na carta = pele e cabelo tirados do rosto da carta (`players-novo.mjs`, `aparenciaDaCarta`).
- ✅ 27/10: `src/escalacao/futebol3d/players-novo.mjs` = controlador dos 22 com o boneco novo (corrida em 8 direções, conduz com a
  bola, passe/chute/cabeceio/lateral/falta sofrida/carrinho/giro/voo do goleiro pelos lances do motor). Ligado em
  `presidencia-complexo-partida.ts` (o 3D já é só da conta do Diego); se falhar, volta sozinho pro boneco antigo.
  `localStorage['esc3d-boneco']='antigo'` força o antigo. Falta: prints pro Diego aprovar → publicar; medir peso no celular.

### ⭐📅 27/10 — Craque mensal (Vendria) NÃO liberou sozinho: a Vendria só mandou `order.paid`, sem e-mail
- 26/10 21h08 e 22h52 (Brasília): 2 compras de **Craque Completo** (R$ 16,89 com taxa). Chegou só `order.paid` com
  `customer: null` — sem e-mail não dá pra saber de quem é. O evento `subscription.started` (que traz o e-mail e é o que
  `esc_vendria_aplica` usa) NÃO veio, ao contrário do Parceiro de 17/10, que veio certinho.
- Liberado À MÃO (Diego mandou o e-mail, conta conferida): matheusribeiro201777@gmail.com (Cifrão SAF) → craque_completo até
  27/11 01:52 UTC (`vendria_sub` = 'manual-diego-27/10'). 2º comprador também liberado à mão: jesusolhoupramim97@gmail.com (Robgol FC), mesmo prazo — e REMOVIDO no mesmo dia: ele cancelou (Diego mandou tirar; plano encerrado em 27/10 02:15 UTC). O produto na Vendria
  está certo (Assinatura · Mensal · Pix Automático); suspeita: o comprador paga o 1º Pix e não autoriza o automático no banco.
- A CONSERTAR na Vendria: conferir se o produto Craque Salas/Completo é ASSINATURA e se o webhook tem os eventos
  `subscription.*` marcados. Sem isso a renovação do mês que vem também não liga sozinha.
- ✅ 27/10 madrugada — **LIBERAÇÃO NA HORA PELA API DA VENDRIA** (pedido do Diego: *"o jogo precisa liberar o e-mail de quem
  paga na hr"*). Diego criou a chave (só Pedidos · Assinaturas · Clientes · Checkout) e salvou em Secrets `VENDRIA_API_KEY`.
  API = `https://app.vendria.com.br/api/v1` (Bearer). Achado: as assinaturas EXISTEM lá (Matheus ACTIVE até 27/11, Robgol
  CANCELLED 22 s depois de pagar), só o aviso `subscription.started` que não veio. Novo fluxo:
  · `vendria-checkout` (Edge, JWT): logado aperta Assinar → cria o pedido pela API SEM itens (9,90/14,90, mensal, Pix automático,
    taxa repassada = +1,99) com o e-mail da conta + `reference` → anota em `esc_vendria_pedidos` → devolve o link de pagamento.
  · `vendria-webhook` v7 (fase 3): `order.paid` → acha o dono na anotação → confere na API que está PAID → liga até o fim do
    período da assinatura (`esc_vendria_libera`, nunca encurta; `ENDED` corta). Renovação acha pelo `sub_id`.
  · Botões (vitrine, Loja, limite de sala) chamam `assinarMensal` (`vendria-checkout.ts`); se o servidor falhar, cai no link antigo.
  · Matheus já anotado (sub_15453373…), então a renovação dele em 27/11 liga sozinha. Testado: pedido criado pela API (201) e
    cancelado. Falta: publicar o site (os botões) e a 1ª compra real pelo fluxo novo. `vendria-sonda` desligada (pode apagar no painel).
  · Vendria: também tem um 2º PARCEIRO pago em 26/10 21h01 (R$ 250/mês, assinatura ativa até 26/11) — avisar o Diego.
- ✅ 26/10 **Manual trancado da carreira com 3 opções**: ⏱️ Manual 24 h avulso R$ 9,90 (Pix `manual_24h`, banco libera por 24 h em `esc_direitos_de`) · ⭐ Craque Completo 14,90 · 💛 todos os planos. Painel 📊 manteve as linhas antigas e ganhou o caminho de cada lugar (Manual / limite de sala) + quantos pagaram o 24 h.

### 👕 27/10 — SISTEMA DE UNIFORMES do 3D (boneco do Tripo) — no branch, desligado (`localStorage['esc3d-boneco']='novo'`)
- Diagnóstico do GLB do Tripo: 1 malha · 1 material · 1 textura-atlas pra tudo (pele, cabelo, roupa) em 98 pedaços, 26 deles
  misturando pele e pano. Por isso trocar a cor do material pintava a pele, e adivinhar pela cor manchava (sombra de pele ×
  pano cinza). Não precisa de Blender: nada de geometria, rig, animação ou textura original é mexido.
- Solução: `monta-jogador.mjs` rasteriza cada triângulo no espaço da textura e grava `public/futebol3d/jogador-uniforme.png`
  (R região·20 +10 costas · G altura · B posição lateral). Região sai do osso + posição 3D do ponto (manga = perto do eixo
  ombro→cotovelo; gola = anel do pescoço; barra pela altura) + cor original (pano × pele). Cabeça/antebraço = sempre pele.
  Medidas do corte em `MEDIDAS` (KGOLA_*, KMANGA_*, KCINT); foto de conferência: `verreg.mjs debug` no scratchpad.
- Runtime: `jogador-novo.mjs` (shader só recolore regiões de roupa, volume do pano = luminância original ÷ branco de
  referência) + `uniformes.mjs` (ficha por time: liso · listras_v · listras_h · faixa · metade · padrao, mangas/gola/calção/
  meião/chuteira próprios; times sem ficha saem lisos das cores do clube; contraste do kit-contrast vira o corpo). Um programa
  de shader só pra todos; valores divididos por ficha.
- Testado no mesmo jogador: branca · vermelha listrada de preto (calção preto, meião vermelho) · azul com mangas/gola brancas ·
  verde com faixa diagonal — pele, rosto, braços e cabelo intactos. Falta: OK do Diego → ligar no 3D dele; o careca saiu (o
  pedido novo é preservar cabelo); fichas dos clubes de verdade (UNIFORMES) a preencher conforme ele mandar.
- 🩹 27/10 **Aviso de fim de semana (pódio + clã) voltava depois do ✕**: `void supabase.rpc(...)` não envia nada (o supabase-js só manda no `.then`), então `visto_em` nunca gravou pra ninguém (conferido: 50 linhas da semana 19/10, todas nulas) e a checagem de 60s trazia o aviso de volta. Agora o ✕ chama de verdade + o aparelho lembra o que fechou. Mesmo erro consertado no convite de amigo (`esc_convite_visto`), no aviso da conta (`esc_aviso_visto`) e na presença da carreira online. **Regra: rpc sem await precisa de `.then(() => {}, () => {})`.**

- 👥⚔️ 27/10 **Amigos e clãs à vista — MOCKUP esperando OK** (`scripts/mockups/amigos-clas-visiveis.png`). Medido: 159 pedidos de amizade sem resposta (137 há +2 dias), 4 clãs, 34 pedidos pra entrar em clã sem resposta, chat sem "adicionar". Proposta: (1) pedidos na HOME com aceitar na hora; (2) no jogo só pilulinha 🤝 N no topo (nada pula); (3) tocar no nome no chat → ➕ adicionar + no fim de jogo "adicionar todo mundo da sala"; (4) bloco ⚔️ Clãs da semana na home (top + ENTRAR nos abertos + criar).
- ✅ 27/10 **Pedidos na home (item 1 do mockup)**: `PedidosNaHome` (amigos.tsx) em cima dos modos — pedidos de amizade, convites de clã e pedidos pro meu clã, com aceitar ali (mesmas funções do 🔔: `responderAmizade`/`responderClaAviso`). ⚔️ O bloco Clãs da semana na home SAIU (Diego: "o clã N é pra ficar na home… o ranking do clã já fica lá embaixo das salas abertas") — não repropor. Chat: já abria o perfil com ➕ desde 18/10 (Diego confirmou). Item 2 (pilulinha no jogo) e "adicionar todo mundo da sala" NÃO foram pedidos.
- 🔒 27/10 **Carreira grátis até a temporada 50** — ✅ PUBLICADO (*"ok publique td sim"*) (mockup `scripts/mockups/carreira-50.png` aprovado). Sem plano, a decisão do fim da T50 troca "Continuar/Trocar tudo" pelo 🔒 + ⭐ Ver os planos e destravar (toque vai pro painel: "🔒 carreira grátis T50 → ver os planos"); o motor (`CAREER_ADVANCE`) recusa com a mesma régua (`travaCarreiraGratis`, `carreira-gratis.ts`). Quem já passou da 50 segue livre (333 carreiras na nuvem em 27/10); acima da 50 = livre, então mensal cancelado depois da 51 também segue. Plano = `ehPagante` (mensal conta; Manual 24 h não). Trava: `npm run carreira-gratis`. 🔁 Mesmo dia: quem JÁ estava acima da 50 sem plano ganha **+10 temporadas** (a 1ª virada grava `careerGratisAte` = temporada + 10; trava no fim dela, banner diz a temporada certa). Com plano nunca aparece nada; pagou = destrava na hora.

## 👁️ Modo espectador "fantasma" (28/10) — FEITO NO BRANCH, mockup aprovado ("Perfeito"); falta o Diego mandar publicar
Pedido do Diego (pra campeonatos): só contas que ele liberar; entra em qualquer sala (esperando ou já jogando, cheia ou não),
vê tudo, fala no chat, NÃO joga. *"O nome do telespectador não aparece na lista dos usuários que estão na partida… nem no
gerenciar do host… como um fantasma"*. Mockup: `scripts/mockups/espectador.png`.
Plano seguro (cadeiras intocadas): o espectador NUNCA entra em `room_players` nem em `seatUids`, NUNCA faz `track()` de
presença (nem no canal da partida nem no `esclobby`), youIdx = -1, nunca manda estado, nunca vira host (ignora toda lógica de
coroa). Liberação por e-mail numa tabela nova lida no #admin. Na dúvida, não entra como espectador.
FEITO (28/10): banco `esc_espectadores` + `esc_sou_espectador`/`esc_admin_espectadores`/`esc_admin_espectador_set` (migration
20261028020000) · #admin "👁️ Espectadores liberados" · botão 👁️ ASSISTIR na lista (não aparece em Copa do Mundo, Bafo, carreira
nem na própria sala) · espera do fantasma (`espectador-ui.tsx`, confere só status a cada 4s, baixa o estado pesado só quando começou)
· `ASSISTIR_ONLINE` no motor (tela pelos olhos do DONO, `espHostUid`) · chat com selo 👁️ · faixa roxa "VOCÊ ESTÁ ASSISTINDO" + SAIR ·
no envelope some o lance ("👁️ Você está só assistindo"). TRAVAS: dispatch não manda nada · sem `track()` · BECOME_HOST/RECOVER/
FIX_YOU_IDX/host_change/kick ignorados · e `espectador.ts` barra toda gravação no banco do aparelho do fantasma (só leitura passa).
Teste: `npm run espectador`. Foto real: `scripts/mockups/espectador-real.png`.
Ainda não: no pregão aberto/Tocaia/Monte os botões de lance APARECEM pro fantasma mas não fazem nada (o motor barra) — esconder
igual ao envelope se o Diego pedir. Sala de espera sem chat pro fantasma (o chat dele é o da partida).
✅ 28/10 1º teste do Diego numa sala ao vivo: *"deu muito certo e não influenciou em nada… sem bugs"*. Pedido: o fantasma só LÊ o chat (não escreve) e precisa ver o papo — FEITO no branch: caixa do chat sem campo de escrever + o chat da sala de espera (canal `esclobby`, só escuta). O chat mostra as mensagens de quando ele entrou pra frente (o histórico vive no aparelho de cada um).
🔎 28/10: no 1º teste o chat da PARTIDA não apareceu pro fantasma (os jogadores escreveram). Lendo o código não achei a causa (o chat vem pelo mesmo canal do estado, que chegou). Ligado o medidor no aparelho do fantasma (`papel = 'espectador'` em `esc_realtime_medidor`, única gravação liberada pra ele): no próximo teste, `select rx from esc_realtime_medidor where papel='espectador'` mostra se 'chat' e 'state' chegaram.

## ⚡ Envelope único (28/10) — FEITO, só na conta do Diego ("pode fazer… apenas na minha conta… e faça tb pro partida rápida… 180s")
Pedido do Diego: um jeito de leilão mais rápido. Proposta: 4º jeito de dar lance (✉️ · 🐊 · 🔨 · ⚡). As 5 posições numa tela só,
um envelope de 90s, uma revelação só (carta por carta), empate = sorteio na hora, Monte em 30s. Sala rápida, Minhas Ligas e Partida
Rápida; carreira fica no envelope de sempre. Mockup: `scripts/mockups/envelope-unico.png`.
FEITO (28/10): motor (`abreEnvelopeUnico`/`selaEnvelopeUnico` em store.tsx — o miolo de uma leva virou `leilaoResolveLeva`, sem mudar
nada dentro; as 5 posições resolvem em ordem GOL→ATA com o MESMO motor, empate = `resolveOneTiebreak(…, sorteio)`), relógio de 180s
(`ENVELOPE_UNICO_MS`), revelação única só com carta que teve lance, Monte de sempre (15s por vez, não mudou). Tela `EnvelopeUnico`
(screens.tsx): barra de posições pra pular, limite de lances = vagas de cada posição, LACRAR TUDO. Opção ⚡ na Partida Rápida e no criar
sala (Rápido e Minhas Ligas, fora de duplas e carreira). Gate `ENVELOPE_UNICO_GERAL` em sport.ts. Trava: `npm run envelope-unico`.
Fotos: `scripts/mockups/envelope-unico-real.png` e `envelope-unico-revelacao.png`.
Falta: a lista de salas ainda mostra o selo do envelope de sempre (às cegas) pra sala de envelope único; o Monte NÃO foi pra 30s (é o de sempre).

## 🏆 Perfil com taças (28/10) — FEITO no branch (Diego: "rank do online… só global e não mensal"), falta publicar
Pedido do Diego (print do perfil): rankings da carreira e do online LADO A LADO e mais sutis; títulos da carreira com as IMAGENS das taças
(as da Sala de Troféus `public/trofeus-v137/` + o `Trofeu` de `competicoes-visual.tsx`); embaixo, o mesmo pro online. Mockup:
`scripts/mockups/perfil-trofeus.png`. ⚠️ `game_champions` não guarda QUAL competição a sala jogou — os títulos antigos do online caem na
taça da Liga; separar por competição exige anotar o tipo daqui pra frente (coluna nova + quem grava o campeão).
FEITO: rankings lado a lado (carreira = melhor save + temporada · online = TODOS OS TEMPOS, nunca o mensal) · grade de taças da carreira
(Série A, ligas, Copa, Supercopa, Liberta, Champions, Mundial, Copa do Mundo) e do online por competição (`esc_tacas_online`, lê
`human_results`: liga · copa · libertadores · mundial(=Copa do Mundo) · regional; Só Champions/Relâmpago ganharam a etiqueta `comp` a partir
de 28/10 — os de antes contam como Liga) + medalhas. O quadro "semana/mês/sempre" saiu do perfil.

## 🧭🏆 Barra da carreira igual à do online + taças nos rankings das salas (28/10) — FEITO ("Aprovado"), no branch esperando ordem de publicar
Pedido do Diego: (1) a barra de baixo da carreira (celular) com o visual da barra das salas online (`LigaHub`: creme, ícone/nome finos,
aba aberta em dourado); (2) na Sala de Troféus da sala rápida (`SalaTrofeusRapida`) e no Rank das Minhas Ligas (`AbaRank`), a TAÇA de
cada título do lado do nome — só de quem ganhou, mesmo tamanho do perfil. Mockup: `scripts/mockups/barra-trofeus-salas.png`.
⚠️ Lembrar: em 27/10 ele pediu as abas da carreira MAIS fortes ("tão apagadas"); a barra do online é mais clara — o mockup mostra as duas.
🔁 Corrigido no mesmo dia: eu entendi AO CONTRÁRIO e mudei a barra da carreira. O pedido era a barra das SALAS ONLINE (sala rápida
e Minhas Ligas) ficar com a cara da barra da CARREIRA, **sem mudar nome nenhum** (*"não mexer em relação ao modo carreira… eu só
pedi pra você melhorar visualmente o que tem hoje"*). A carreira voltou a ser como era; a barra do `LigaHub` agora é a da carreira
(fundo claro, linha preta grossa, aba aberta = botão preto com ícone dourado) — foto `scripts/mockups/barra-online-igual-carreira.png`.
✅ Taças: `TacasNome` em `ligahub.tsx` — pequenas (17px), em fila depois do nome, ×N do lado
(*"precisa ser menor e alinhado"*), só o que ganhou; Só Champions/Relâmpago usam a taça deles (`comp`). Os chips de Liga/Copa da sala
rápida saíram (a taça diz isso); Top 8 e rebaixamento continuam.

## 👀 ONLINE ABERTO PRA VISITANTE (28/10, pedido do Diego)
*"o botão de online na home deixe que qualquer pessoa mesmo sem conta entre na página. Porém apertar pra criar sala ou entrar em alguma
sala aberta não deixe, aí sim aparece com a informação de criar conta"*. Sem conta: a página de salas abre (lista, busca, filtros,
atualizar, abas Salas abertas/Entrar). Qualquer outro botão (Criar sala, entrar numa sala, código, Minhas Ligas, vitrine…) abre a janela
da conta com o porquê escrito; "agora não" volta pras salas. Mora em `lobby.tsx` (`visitante`, `pedeConta`, `travaVisitante` no `wrap`;
o que é só de olhar leva `data-livre`). Convite pendente continua abrindo direto no login. Fotos: `scripts/mockups/online-visitante*.png`.

## ⚡ Envelope único liberado também pro Futpoint FC (28/10) — partida rápida e salas, mesma trava (`ENVELOPE_UNICO_TESTERS`)

## 📖 MEU ÁLBUM saiu da home (28/10)
Diego: *"a página meu álbum da home pode tirar… dentro da página amigos já tem"*. O botão some da home (futebol e basquete) pra quem tem
os 👥 Amigos; deslogado (sem Amigos) ele continua, senão a pessoa perderia o caminho. A tela do álbum continua existindo (é a mesma dos Amigos).

## 🛒 30/10 — Mercado da bola (Sondar jogador, carreira) — FEITO e publicado
- Mockup `scripts/mockups/carreira-mercado-sondar.png` aprovado (*"pode publicar"*). Cada linha mostra a carta virada (só a posição), a etiqueta 🎴 clube · ano DA CARTA e "📍 está no <clube>"; botões de posição; faixa verde por setor; quem tem contrato dobrado em "🔒 Com contrato ainda (N) — ver".
- ✔ Sondado agora só pinta a linha do clube escolhido (antes, a mesma carta em 2 clubes pintava as duas).
- ⚠️ PENDENTE (investigar): no print de um jogador apareceram DOIS Figueroa (Nacional do Agreste e Wen Milan B) — só existe UMA carta Figueroa (Internacional 1976). Ou seja, a mesma carta em 2 clubes daquela carreira (provavelmente times de fundo / ficha `cpuSquads`). Achar a origem antes de mexer.

# ✅ Carreira Online — lista do que a SOLO tem (19/10)

Regra do Diego (19/10): *"tem que ser igual a carreira que temos hoje em tudo. Menos ter segundo clube"*. Só na conta dele até ele mandar.
Cada linha só vira ✅ depois de: funcionar no online pelo clube CERTO (nunca `managers[youIdx]` — no online isso cai no clube do dono)
**e** passar no teste de 20 robôs numa temporada inteira.

Legenda: **[C]** = de um clube só (vai na gaveta do clube) · **[M]** = de todos (tabela, copas, bots, ranking).
Situação HOJE no online antigo: 🟢 funciona · 🟡 funciona mas preso no `youIdx`/meio ligado · 🔴 desligado.

## ⚠️ Os dois furos de base (resolver antes de qualquer item)
- 🔴 `START_ONLINE` não liga `agenciaOn` nem `escadaOn` → tudo que depende deles fica desligado no online (Agência, condição, eventos,
  bico, obras novas, títulos no ranking, Várzea).
- 🔴 ~63 ações do reducer usam `s.managers[s.youIdx]` em vez do `mgrId` de quem mandou (técnico, preparador, Master, loja, fornecedor,
  bico, formação, aliciar…). Na v2 cada aparelho roda só o PRÓPRIO clube e manda a gaveta — então tem que ser por `mgrId` sempre.

## 🔨 Leilão / pregão da virada
- [ ] 🟢 Pregão de estreia (envelope) [M]
- [ ] 🔴 Escada de categorias / começar na Várzea [M]
- [ ] 🟢 Monte de sobras (carta com piso é paga) [M]
- [ ] 🟡 Cerimônia (ajuste dos bots, contratos, mercado CPU — pedaços só solo) [M]
- [ ] 🟡 Vagas e reservas da virada (travada até o internacional só na solo) [C]
- [ ] 🟢 Seguir com o mesmo time + votação leilão × mesmo time [C/M]
- [ ] 🟢 Listar e vender jogador (T3+) [C]
- [ ] 🟡 Leilão de reservas / transferências (banco dos bots só solo) [M]
- [ ] 🔴 Aliciar técnico/jogador [C]
- [ ] 🟡 Perfis dos bots no leilão (gastador, pão-duro…) [M]
- [ ] 🔴 Registro do mercado pra Central [M]
- [ ] 🟢 Dicas do pregão [C]

## ⚽ Elenco / escalação / táticas
- [ ] 🟢 Tática por jogo · escalação por rodada · campinho/elenco · compartilhar elenco [C]
- [ ] 🟡 Formação + destravar formação [C]
- [ ] 🔴 15 formações do técnico [C]
- [ ] 🔴 Modo de substituição · conversa de intervalo · pênalti planejado/cobradores [C]
- [ ] 🟡 Modo Manual e velocidade (no online quem manda é o dono — ok pela regra) [M]
- [ ] 🔴 Olheiros [C]

## 🏟️ Partidas
- [ ] 🟢 Motor determinístico (prova feita: 20 clubes, 2 aparelhos, mesma temporada) [M]
- [ ] 🟢 Placar ao vivo, lances, rádio, craque do jogo, chuva, pênaltis [C/M]
- [ ] 🟡 Simular várias rodadas [M]
- [ ] 🟢 Torcidômetro [C]
- [ ] ⏳ Partida no estádio da Presidência (ainda fechada na solo também) [C]

## 🏆 Competições
- [ ] 🟢 Divisões V/D/C/B/A, acesso/queda, tela de desfecho [M/C]
- [ ] 🟢 Copa Legends / Copa do Brasil / Supercopa / XI da copa [M]
- [ ] 🔴 Libertadores · Champions · Mundial (T40+) + metas internacionais do Master [M/C]
- [ ] 🔴 Copa do Mundo Legends (T100+) [C]

## 💰 Dinheiro
- [ ] 🟢 Caixa · salários · cota de TV · prêmios (colocação, artilheiro, copas) [C]
- [ ] 🟡 Extrato / finanças / fechamento da temporada [C]
- [ ] 🔴 Cota extra de TV (vídeo) [C]
- [ ] 🟡 Patrocinador Master com história [C]
- [ ] 🟡 Fornecedor de material [C]
- [ ] 🔴 Bico de folga [C]
- [ ] 🔴 Crise financeira (craque anuncia saída) [C]
- [ ] 🔴 Banco Legends · depósito Pix · prêmio do ranking da semana · moedas do sócio [conta]

## 🏢 Clube
- [ ] 🟡 Estádio e obras (obras novas desligadas) [C]
- [ ] 🔴 Estacionamento / Presidência / criador do presidente [C]
- [ ] 🟢 SAF clássica (filial na D, empréstimo, comissão) — ⚠️ decidir: regra antiga ou a de venda pela divisão (sem a parte do 2º clube) [C]
- [ ] 🟡 Loja do clube (preço das camisas) [C]
- [ ] 🔴 Loja de planos/extras dentro da carreira [conta]

## 👥 Pessoas
- [ ] 🟡 Técnico (efeito só solo) [C]
- [ ] 🟡 Preparador físico + rodízio automático [C]
- [ ] 🔴 Condição / gás / lesão por desgaste (liga na Série C) [C]
- [ ] 🔴 Eventos de jogador (noitada, expulsão, cria) [C]
- [ ] 🟢 Cria da base · contratos e renovação · empresário/escritório [C]
- [ ] 🔴 Agência 2.0 (mensalidade, comissões, convocação) [C]

## 🤖 Bots
- [ ] 🟢 Fichas dos times de fundo · dificuldade da CPU [M]
- [ ] 🔴 Rival com banco (22, cansaço, lesão, patrocínio) [M]
- [ ] 🟢 Economia dos bots [M]

## 📺 Mídia
- [ ] 🔴 Central Legends + Martelo do meio da temporada [C]
- [ ] 🟢 Jornal O Martelo do fim [M]
- [ ] 🔴 Coletiva de imprensa (ainda fechada na solo pra todos) [C]
- [ ] 🟢 Giro da rodada / ticker de rivalidade [M]

## 🎬 Fim de temporada
- [ ] 🔴 Roteiro dos 4 passos (obrigatório SEMPRE) [C]
- [ ] 🟢 Congelar o passado · gravar artilharia/assistências [M]

## 📜 Histórico
- [ ] 🟢 Artilharia e garçons · Bola de Ouro · troféus · ranking de clubes [M]
- [ ] 🔴 Ranking global (foto só solo) · títulos no `esc_results` [conta]
- [ ] 🟢 Cartinha-lembrança de título [conta]
- [ ] 🔴 Coleções de clubes no álbum [conta]

## Outros
- [ ] 🔁 Salvar: na v2 é automático por gaveta (sem botão) — substitui a nuvem da solo
- [ ] 🔴 Guia da carreira (banners, pílulas, desbloqueios) · barra de abas com a Central [C]

## 🚫 FORA (2º clube — decisão do Diego)
- Multiclubes (`BUY_/SWITCH_/SELL_MULTICLUBE`, clube que dorme)
- SAF que vira 2º clube (`SAF2_ASSUMIR`, `SAF2_VENDER_2O`, `SAF2_MIGRAR`…)
- Agência dividida entre 2 clubes (`SET_AGENCIA_CLUBE`, `agenciaDividir`) — a renda vai sempre pro clube único

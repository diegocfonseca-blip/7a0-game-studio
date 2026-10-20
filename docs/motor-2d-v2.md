# 📺 Motor 2D v2 — diagnóstico, plano e fase 1 (20/10)

Pedido do Diego (20/10): *"transformar o motor atual em uma simulação de futebol dinâmica, inteligente, variada e
coerente… as jogadas acontecerem naturalmente, com jogadores tomando decisões baseadas em atributos, posicionamento,
contexto, táticas e comportamento coletivo… as lendas são únicas… e melhorar as sincronizações (câmera lenta do nada)"*.
Regras dele pra esta obra: **não substituir às cegas · motor antigo preservado · fase por fase, com teste e reversão ·
NÃO publicar pra ninguém (nem pra ele) até validar · não mexer fora da partida sem necessidade**.

---

## 1. Diagnóstico do motor atual (v1 — `campo2d-motor.ts`, 1.530 linhas)

| Pergunta | Como é hoje |
|---|---|
| **Quem decide o resultado?** | **Antes do jogo.** O placar sai do motor rápido do jogo (`simMatch` no online, `simDivTo` na carreira): força do time (média das cartas `lo`–`hi` por setor + técnico + tática + sorte) → Poisson de gols → autor e garçom sorteados. As chances perdidas saem de `chances.ts` (sorteio preso na semente). |
| **E o 2D?** | **Encenação.** `Jogo2D` recebe a lista de gols/chances (minuto, lado, autor, fim) e monta EM VOLTA de cada um uma das 14 "jogadas-molde" (enfiada, cruzamento, tabela, contra, escanteio, falta…), começando ~8,5 s antes do minuto. Entre os lances, "enchimento" (troca de passe, desarme, lateral). |
| **Como escolhe passe/drible/chute?** | Não escolhe: o molde diz quem faz o quê. Sorteio entre jogadores do setor certo, com preferência por estilo (`preferido`). |
| **Disputas individuais** | Não existem como cálculo: o desarme e o drible "acontecem" porque o molde mandou. |
| **Atributos das cartas** | No 2D, só o **estilo** da lenda (11 tipos, `campo2d-estilos.ts`) e os **golpes** (jogada assinatura, fato conhecido). `lo`/`hi`/`fame` **não influenciam** nada no campinho — só no placar do motor rápido. |
| **Sem bola** | Formação como "bloco" que sobe/desce com a bola e a posse, desliza pro lado, ginga; ordens pontuais das jogadas por cima. |
| **Posições/formação** | Respeitadas desde 20/10 (`onzeDaFormacao`): linhas pela posição da carta. |
| **Goleiro** | Anda na linha; nos lances, o molde diz se defende, espalma ou leva o gol. |
| **Gols, faltas, impedimento, escanteio** | Gol = o do motor rápido. Falta/escanteio/lateral = moldes. **Impedimento e cartão não existem.** Pênalti não existe no 2D (tem tela própria, regra de 19/09). |
| **Sincronia narração/placar/animação** | A narração é a do molde (o texto acompanha o que o molde encena). O placar do 2D é contado pelo próprio campinho quando a bola entra (bate com o de cima — trava `npm run campo2d`). |
| **Online × offline** | Igual nos dois: **cada aparelho roda o 2D sozinho**, a partir da semente + lista de gols que o dono da sala já espalhou. Nada do 2D vai pela rede nem pro banco. |

### O que a v1 faz bem (e tem que continuar)
- Placar do 2D sempre igual ao placar oficial (300 jogos na trava).
- Determinístico: todo mundo da sala vê o mesmo jogo, sem tráfego extra.
- As regras de bola parada (fiscal: lateral do time certo, distância de 9,15 m, saída no meio, tiro de meta fora da área).
- Formação do técnico, troca do intervalo, rostinho das lendas, golpes de fato, narração PT/EN sem pênalti.
- Leve no celular (canvas, 50 passos/s, fundo em cache).

### O que mais tira o realismo (em ordem de peso)
1. **É teatro, não jogo.** Ninguém decide nada: o atacante "conduz" porque o molde mandou, o zagueiro "erra" porque o gol tem que sair. Daí vêm quase todos os defeitos que o Diego já pegou (bola parada esperando, jogador plantado, chute do meio-campo, câmera lenta, atacante batendo tiro de meta) — são costuras entre moldes.
2. **O tempo é dono do lance.** A jogada tem que acabar no minuto do gol; quando atrasa, o motor corta, acelera (`pressa`) ou encurta — e isso aparece na tela.
3. **Atributo não existe no campo.** Uma lenda e um "foi profissional" só diferem pelo estilo; a força da carta não aparece no 2D.
4. **Coletivo raso.** O bloco anda junto, mas não há pressão coordenada, cobertura, linha de impedimento, apoio por ângulo de passe, ultrapassagem — tudo isso só aparece quando um molde pede.
5. **Repetição.** 14 moldes + enchimento. Com o tempo dá pra reconhecer o "filme".

---

## 2. O que o Football Manager faz (e a diferença pra nós)

Fonte: o que o FM divulgou do motor do FM21 (o site deles não abre daqui; uso o que é público) + os dois projetos
abertos citados — **OpenFootManager (GPLv3)**, motor de eventos/texto; **Global Soccer Manager (Apache 2.0)**,
"possession chains" com duelos por atributo e um *Pacer* separado que ritma a saída pro espectador.
Só ideias: **nenhuma linha de código copiada** (GPLv3 contaminaria o jogo).

| Princípio | FM / referências | Nós (v1) |
|---|---|---|
| Ciclo de decisão | cada jogador reavalia a cada **0,25 s** de jogo | não há decisão — o molde decide |
| Escolha da ação | compara opções (passe, drible, chute, conduzir, segurar) por chance de sucesso × valor, com atributos de decisão/visão | quem faz e o que faz vêm do molde |
| Sem bola | papéis (pressionar, cobrir, dar opção, infiltrar, abrir) a partir de referências da formação | bloco + ordens pontuais |
| Duelos | probabilidade por atributo, nunca 0% nem 100% | resultado fixo |
| Resultado | **emerge** das jogadas | **decidido antes**, encenado depois |
| Apresentação | separada da simulação (o *Pacer*) | misturada (o motor encena pro tempo da tela) |

---

## 3. Arquitetura proposta (v2)

```
src/escalacao/motor2/
  tipos.ts        tipos comuns (atleta, bola, evento, estatística)
  atributos.ts    (B) o PERFIL de cada carta, derivado dos dados que já existem
  motor.ts        (A) estado + passo fixo · (C) coletivo · (D) física · reinícios/regras · (G) estatística
  decide.ts       (B) inteligência individual: a decisão de quem tem a bola e de quem está sem ela
  narra.ts        (F) narração = tradução de EVENTO que aconteceu (PT e EN na mesma posição)
campo2d.tsx       (E) o MESMO desenho de hoje — o v2 fala a mesma "língua" que ele lê (atl, bola, festa, narra, placar)
```

- **A — simulação**: passo fixo de 1/20 s, relógio próprio, nada de tempo de tela. Determinística: só `+ − × ÷ √`,
  sorteio próprio (mulberry32), **sem `Math.sin/cos/exp/hypot`** nas contas que decidem algo (esses variam de navegador
  pra navegador e quebrariam o online). A trava confere isso.
- **B — individual**: cada jogador decide a cada **0,25 s** (escalonado, nunca os 22 no mesmo passo), e quem tem a bola
  também decide **na hora** quando o marcador chega. Opções avaliadas por *chance de dar certo × valor do lugar onde a bola
  vai ficar − custo de perder ali*, com um pouco de sorteio (mais frio pra quem tem boa decisão). Isso dá variedade sem
  perder a coerência.
- **C — coletivo**: formação = **referência flexível** (bloco que sobe, desce, estreita e desliza). Papéis por momento:
  1 pressiona, 1 cobre, zagueiros seguram a linha (e a linha de impedimento nasce daí), os outros guardam a zona; com a
  bola: 2 dão opção em ângulo, atacante infiltra entre os zagueiros, ponta abre, lateral apoiador ultrapassa.
  **Ninguém corre todo mundo atrás da bola.**
- **D — física**: bola com velocidade e atrito (rasteira freia, pelo alto quase não), altura, quique; jogador com
  aceleração e velocidade máxima pelo atributo; distância mínima entre bonecos (sem atravessar ninguém).
- **E — desenho**: o de hoje, sem mudar o campo, as arquibancadas nem os bonecos. Interpolação entre passos (20 passos/s
  desenhados a 60 quadros/s).
- **F — narração**: só narra evento registrado (`drible` com golpe só se o drible deu certo, `espalma` → `escanteio` na
  ordem certa). Rodízio de frases pra não repetir.
- **G — estatística**: posse, passes certos/errados, chutes, no alvo, xG, faltas, cartões, escanteios, impedimentos,
  desarmes, dribles, defesas — tudo contado no próprio motor.

### Atributos (proposta compatível — **sem mudar a carta nem o save**)
A carta só tem `pos`, `fame`, `lo`/`hi` (nível), `folk`, `promessa` e, pras lendas, o **estilo** e os **golpes** (fato).
O v2 deriva um perfil de 13 números (velocidade, aceleração, condução, passe, visão, finalização, cabeceio, desarme,
posicionamento, físico, reflexo, saída do gol, decisão):
1. **base** = nível da carta (meio da faixa `lo`–`hi`);
2. **molde da posição** (zagueiro desarma e cabeceia mais, atacante finaliza, meia passa e vê o jogo…);
3. **estilo da lenda** (driblador +condução, passador +passe/visão, velocista +velocidade, paredão +reflexo…);
4. **golpes** viram tendência e repertório (quem tem `pedalada`/`elastico` tenta mais drible e a narração conta o golpe
   QUE ELE USOU; `bomba` chuta mais forte; `lancamento` arrisca mais bola longa; `cabecada` +cabeceio).
Não é bônus fixo nem jogada obrigatória: muda a probabilidade, e o jogador ainda escolhe pela situação.
👉 **Pra frente (fase 2, precisa do OK do Diego):** dar a cada lenda **duas marcas** (a principal = estilo de hoje + uma
segunda), escritas à mão com base em fato, igual foi com os golpes. Ex.: Ronaldinho = driblador + passe inesperado;
Zidane = driblador + domínio do ritmo; Maldini = desarmador + antecipação. A lista vai pra ele aprovar antes.

---

## 4. A decisão grande: quem manda no placar?

Hoje o placar oficial (tabela, artilharia, prêmio, Bola de Ouro, online) vem do motor rápido e **é recalculado da semente**
toda vez que a carreira abre. Um placar que *emerge* do 2D muda isso. Caminhos:

| Caminho | Como | Risco |
|---|---|---|
| **A. Sandbox** (fase 1) | v2 joga sozinho, só na bancada; mede estatística | nenhum |
| **B. v2 decide SÓ o jogo que você assiste** (carreira) | o resultado do v2 vira um "registro" do jogo, igual o pênalti e o intervalo já são guardados (`careerPenalty`/`careerHalftime`); os outros jogos seguem no motor rápido, calibrado pra ter a mesma distribuição | médio: artilharia/garçom passam a vir do v2 nesse jogo; precisa trava de que nada fora daquele jogo muda |
| **C. v2 em todo jogo** | todas as partidas rodam o v2 sem tela | alto: ~2.000 jogos por temporada recalculados a cada abertura = lento no celular |
| **Online** | o dono da sala roda o v2 e espalha só o resultado (como já faz) — ou todos rodam com a mesma semente (por isso a regra de conta determinística) | médio |

**Recomendação:** A agora → B na carreira solo (só a conta do Diego) → online por último.

---

## 5. Plano por fases

| Fase | Entrega | Onde roda |
|---|---|---|
| **1 (feita aqui)** | motor v2 isolado: decisão a cada 0,25 s, física, duelos por atributo, goleiro, reinícios, impedimento, faltas/cartões, eventos → narração, estatística; bancada própria; trava com milhares de jogos | só bancada (dev) |
| 2 | calibrar com o Diego assistindo (vídeo); 2 marcas por lenda (lista pra aprovar); bola parada ensaiada; vantagem; acréscimos; pênalti ligado à tela manual dele | bancada |
| 3 | botão "motor novo (teste)" no Campo 2D **só na conta dele**, ainda sem mexer no placar oficial (o v2 joga, o placar oficial é do motor rápido — mostra a diferença numa linha só pra ele) | conta dele |
| 4 | caminho B: o v2 decide o jogo dele na carreira (com trava "nada fora deste jogo muda") | conta dele |
| 5 | online (dono da sala), depois liberação | — |

---

## 6. Riscos

- **Tempo de tela**: o jogo inteiro dura **1:30**. Futebol de verdade em velocidade real, em 90 s, teria ~0,3 chute. O v2
  precisa ser um jogo **mais intenso** (mais ataques por minuto de tela) e ainda assim parecer futebol — é a calibração
  mais difícil. Alvo: ~10–16 finalizações e ~2,5–3 gols por jogo, com placar parecido com o do jogo hoje.
- **Determinismo entre aparelhos** (online): conta só com operações exatas; trava automática.
- **CPU no celular**: 22 jogadores × decisão a cada 0,25 s = ~90 decisões/s — leve; a trava mede o custo por jogo.
- **Pênalti**: o v2 pode gerar falta na área; ligar isso à tela manual de pênalti é da fase 2 (até lá: falta na área =
  cobrança direta sem narração de pênalti, regra de 19/09).
- **Viradas de regra do Diego** que o v1 já obedece (sem chute do meio-campo, sem câmera lenta, festa curta, saída no
  meio…) têm que virar teste do v2 também.

## 7. Estratégia de testes
- `npm run motor2`: milhares de jogos com semente fixa → média e espalhamento de gols, chutes, posse, passes certos,
  faltas, cartões, escanteios, impedimentos; time forte × fraco; times iguais (variação).
- Regras: ninguém fora do campo, nenhum "pulo" (> 13 m/s), reinício do time certo, distância nas bolas paradas,
  narração só de evento que aconteceu.
- Determinismo: mesma semente → mesmo jogo, e nada de função que varia de navegador.
- Custo: tempo médio por jogo inteiro.
- Bancada visual: `scripts/teste-campo2d/v2.html` (filme de quadros pra olhar com os olhos).

---

## 8. Fase 1 — o que foi feito e o que ela mostrou (20/10)

**Feito (isolado, só no branch, NÃO publicado):** `src/escalacao/motor2/` (tipos · atributos · física · coletivo ·
decisão · narração · motor), a bancada `scripts/teste-campo2d/v2.html` (o MESMO desenho de hoje rodando o v2 — o
`Campo2D` ganhou a entrada opcional `motorExperimental`, que nenhuma tela do jogo passa) e a trava `npm run motor2`.

**Medido em 300 jogos (times parecidos) + 100 forte × fraco:**
| | v2 hoje | alvo |
|---|---|---|
| passe curto certo | ~85% | 80–90% ✅ |
| passe longo / inversão certo | ~60% | 55–70% ✅ |
| enfiada certa | ~45% | 30–50% ✅ |
| jogador "pulando", fora do campo | 0 | 0 ✅ |
| mesma semente = mesmo jogo · sem conta que varia de navegador | sim | sim ✅ |
| custo | ~0,1 s pra simular o jogo inteiro (no Node) | < 0,15 s ✅ |
| **chutes por jogo** | **~1,2** | 8–28 ❌ |
| **gols por jogo** | **~0,1** | 1,8–3,6 ❌ |
| forte × fraco | forte ganha ~10%, 89% empate | forte ≥ 55% ❌ (consequência do placar zerado) |

**O que isso quer dizer (a decisão que é do Diego):** o v2 joga futebol de verdade, em velocidade de verdade — e
futebol de verdade dá ~1 lance perigoso a cada 1,5 minuto. O jogo inteiro dura **1:30 de tela**. O v1 resolvia isso
ENCENANDO um lance a cada poucos segundos (o roteiro que o Diego não quer mais). Sem roteiro, só há dois formatos:

- **A. LANCES (estilo Football Manager — recomendado):** o v2 simula os 93 minutos inteiros por dentro, rápido e sem
  tela, e o campinho mostra os **momentos de perigo** jogados de verdade (cada um com 6–10 s de futebol real); entre
  um e outro o relógio pula. O placar sai do que acontece nesses lances. É como o FM mostra os "melhores momentos".
- **B. JOGO CORRIDO MAIS INTENSO:** a partida corre sem cortes, mas o futebol é "turbinado" (defesa mais lenta pra
  recompor, ataque bem mais direto, chute mais cedo) pra caber 10+ chutes em 1:30. Parece mais arcade.

Também ficou pra fase 2: os dois blocos ainda ficam curtos demais (todo mundo embolado no meio-campo) — calibrar a
profundidade/largura de cada linha depois de escolhido o formato, porque o formato muda o que é "certo".

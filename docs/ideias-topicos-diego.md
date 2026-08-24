# 🧠 Os 8 tópicos do Diego — pensados a fundo (24/08/2026)

Pedido dele: *"pense bem a fundo sobre todos esses tópicos e me fale
profundamente, com ideias e exemplos práticos"*. Tópicos DELE: técnicos, carros,
nomes de times reais (pago?), assistências, Bola de Ouro com artilheiro geral,
sala do presidente (mockup já existe de outra sessão), cansaço/condição, e
olheiros que aliciam por tier do usuário. Resposta completa foi no chat (24/08);
aqui fica o resumo estrutural pra nenhuma sessão perder.

## 1-BIS. 🎩🚗 BENEFÍCIOS FECHADOS (24/08) — `scripts/mockup-tecnico-carro-beneficios.mjs`
Pedido dele: *"Sobre o técnico e o carro precisamos definir... Benefício e coisas
práticas.."* + o anterior: *"tem q ser coisa óbvia tipo ganhar desconto em
negociação ou salário e renovação"*. **Cada benefício foi amarrado a uma alavanca
CONFERIDA no código** (regra dele: *"só faça se tiver sentido e funcionar, não ser
fake"*):

| Técnico | Benefício (número na cara) | Alavanca REAL |
|---|---|---|
| O Negociador | renovação −25% · folha −15% | `renewCost()` · `squadPayroll()` (store.tsx) |
| O Artilheiro | 3 atacantes → atk +4 | `rollForm().atk` · `FORMATIONS` |
| O Muralha | 3 zagueiros (5-3-2) → def +5 | `rollForm().def` · `FORMATIONS` |
| O Copeiro | copas → +4 atk e def | `COPA_DIV_STRENGTH` |
| O Paizão | metade dos perrengues | `sorteiaEvento()` (eventos.ts) |
| O Olheiro | venda +20% | `marketValues` |

🚫 **CORTADOS POR NÃO EXISTIR ALAVANCA** (e isso foi dito a ele na cara):
- *"Professor: promessa evolui mais rápido"* — **jogador NÃO sobe de nível hoje**;
  não há progressão de `lo`/`hi` no motor. Seria construir um sistema inteiro.
- *"Ônibus/avião cansam menos"* — **cansaço não existe**. Era a amarração da ideia
  velha de carros; sem ela, viagem vira enfeite.

🚗 **REGRA DE COERÊNCIA DO CARRO (minha proposta):** *o carro é do PRESIDENTE,
então ele mexe em **GRANA e IMAGEM — nunca na bola**.* Motivo: carro se compra com
MOEDA; se moeda virasse gol, juntar moeda ganharia jogo e o leilão (a alma) perde
sentido. Escada: 🚗 Fusca 40 (status) · 🛻 Picape 120 (bico +10%) · 🏎️ Esportivo
300 (manchete) · 🚌 Ônibus 600 (bilheteria +10%) · ✈️ Avião 1.500 (os dois +10%).

😂 **O PULO DO GATO — a zoeira VIRA mecânica:** cada técnico tem esquema preferido;
jogando nele o bônus vale, e **mudar é sempre permitido** (só perde o bônus
daquele jogo, com aviso claro na tela — nunca trava). Assim "quem manda é você"
deixa de ser piada solta e vira DECISÃO com preço.

⚖️ **Freios contra desbalanceio:** salário na folha · contrato de 2 temporadas ·
UM técnico por vez · **sem técnico o jogo é idêntico a hoje** (carreira antiga não
muda). O +4 é do MESMO tamanho que a tática já dá (retranca/ataque = ±4).

⏳ **Falta ele decidir:** ① os 6 estão bons? ② nome real ou apelido (recomendo
**apelido** — "o Tite dá desconto de folha" seria inventar como pessoa real é,
regra dele de 18/08) ③ rota de entrada (recomendo **3 candidatos na virada**, não
o 7º setor do pregão, que alongaria o leilão) ④ preço dos carros.

## 1-TER. 📋 FORMAÇÕES-ESPELHO + OS 5 EIXOS DO TÉCNICO (24/08)
`scripts/mockup-formacoes-espelho.mjs`. Ideia DELE, e está certa: *"formações como
442 losango, 4231, 4321… são formações q iremos deixar bonita no campo. Como o
usuário quer, mas na verdade é um espelho da 442… tipo N mudaria nada"*.

✅ **CONFERIDO NO CÓDIGO:** `ElencoField` (pyramidseason ~2970) monta 4 linhas —
ATA · MEI · DEF(lat+zag+lat) · GOL — e `rollForm()` só lê POSIÇÃO e NÍVEL.
Quebrar a linha do meio em duas é **100% visual**: nenhum número muda, nenhum
save antigo muda. Custo quase zero, risco zero.

⚠️ **Correção honesta feita a ele:** 4-2-3-1 **e** 4-3-2-1 dão os dois no
**4-5-1** (`1·2·2·5·1`), não no 5-4-1 — o 5-4-1 tem 3 ZAGUEIROS e nenhum dos dois
tem. A conta foi desenhada na tela pra ele conferir.

**A lista de 11 fechada:** JÁ EXISTEM 4-4-2 · 4-3-3 · 4-5-1 · 3-4-3 · 5-3-2 ·
NOVAS DE VERDADE (mudam a contagem, 1 linha cada em `FORMATIONS`) 5-4-1
`1·2·3·4·1` · 4-2-4 `1·2·2·2·4` · 3-5-2 `1·2·1·5·2` · ESPELHOS (só desenho)
4-4-2 losango ≡ 4-4-2 · 4-2-3-1 ≡ 4-5-1 · 4-3-2-1 ≡ 4-5-1.
🚨 **TRAVA OBRIGATÓRIA:** a tela tem que DIZER que é o mesmo time (um "≡ 4-5-1"
pequeno do lado). Senão o cara escolhe 4-2-3-1 achando que ficou mais ofensivo,
perde e reclama — o "comportamento que nenhuma regra previu" que ele proíbe.

### 🎩 O problema que ele levantou, e a solução
Ele: *"a Lenda Telê Santana N poderia ter apenas 5 formações e o craque Renato
Gaúcho C 3 fosse a única diferença… preciso de mais ideias"*. Certíssimo: número
de formação sozinho é ESCADA, e escada faz todo mundo querer só o topo.

**Técnico passa a ter 5 EIXOS** (o tier mexe em uns, não em todos):
1. 🎯 **Especialidade** — o benefício (os 6 já fechados no mockup anterior);
2. 📋 **Formações que domina** — lenda 5 · craque 4 · bom 3 · profissional 2 · estreante 1;
3. ⚠️ **PONTO FRACO** — todo técnico tem um. É o que impede lenda de ser só "melhor";
4. 😤 **Temperamento** — como reage quando você muda o esquema (a zoeira ganha cara);
5. 💰 **Salário e exigência** — lenda é CARO e COBRA título; craque é barato e FIEL.

**O exemplo que responde a pergunta dele:** Telê (lenda) = atk +5 com 3 atacantes,
MAS def −2 pra sempre, salário alto e **pede pra sair se não for campeão em 2
temporadas**. Renato (craque) = +4 nas copas, liga desligado (−2 atk nas 10
primeiras rodadas), salário médio, **fiel pra sempre**. → Renato é MELHOR que Telê
pra quem quer ganhar copa. Escolher técnico vira DECISÃO, não compra do mais caro.

**+4 ideias oferecidas:** ① técnico EVOLUI (cada título no seu clube destrava +1
formação até o teto do tier — segurar um craque 8 temporadas vira história) ·
② rival ROUBA o técnico no fim da temporada (usa a rivalidade que já existe) ·
③ técnico demitido VOLTA anos depois com rancor no jornal · ④ frase de assinatura
de cada um (é o que faz lembrar do técnico, não do número).

⏳ **Falta ele decidir:** ① fecha as 11 formações assim? ② os 5 eixos servem?
③ **20 ou 100 técnicos** (recomendo começar com **20** bem feitos, 4 por tier —
adicionar depois é 1 linha de dado) ④ nome real ou apelido (se real, só fato
público e documentado, tipo Telê = futebol-arte; nunca inventar jeito de ser).

## 1-QUATER. 🎩 OS 100: RARIDADE, "NÍVEL" E EXPLICAR OU NÃO (24/08)
`scripts/mockup-tecnicos-100-niveis.mjs`. Perguntas dele: *"tem q bolar tb em
relação a NÍVEL nessa tabela de 100, principalmente de lendas q ficariam na
frente… de 100 técnicos quais seriam lendas e craques? como diferenciar o Telê
Santana sendo lenda pro Pep Guardiola sendo lenda? No football manager N explica
MT né.. então eu N sei se quero explicar tb p ng as coisas"*.

**① TELÊ × PEP — a regra que responde:** *o TIER diz QUANTO, a IDENTIDADE diz O
QUÊ.* As 5 formações de uma lenda não são "5 quaisquer" — são um **conjunto com
cara própria**. Telê domina 5 OFENSIVAS (4-2-4 · 4-3-3 · 3-4-3 · losango · 3-5-2)
e leva gol; Pep domina 5 DE MEIO (4-2-3-1 · 4-5-1 · 4-3-2-1 · 4-3-3 · 3-5-2) e
precisa de elenco caro. Escolher a lenda escolhe o SEU estilo — duas lendas nunca
competem entre si, então não existe "a melhor".

**② A PIRÂMIDE DOS 100:** 👑 Lenda **8** (5 formações) · ⭐ Craque **17** (4) ·
🟢 Bom **25** (3) · 🔵 Profissional **30** (2) · ⚪ Estreante **20** (1).
Lenda RARA de propósito — se fosse comum ninguém olhava pro resto.

**③ O "NÍVEL" SEM NÚMERO (resolve a pergunta dele):** técnico bom **não aceita
qualquer clube**. Várzea → estreante/profissional; Série C → craque; **só A e B a
lenda atende o telefone**. O nível vira coisa SENTIDA (subir destrava gente
melhor) em vez de número numa tabela — e casa com a pirâmide de divisões que já
existe.

**④ EXPLICAR OU NÃO — recomendação: EXPLICA A REGRA, ESCONDE O NÚMERO.** Não é
opinião solta, é a DNA que o jogo já tem: (a) o leilão esconde o NÍVEL até a
revelação, mas explica as REGRAS com narrador e tudo; (b) `olheiros`
(pyramidseason ~2950) já mostra o overall só pra prata/ouro — o número já é
prêmio. Então: *"com 3 atacantes seu time cria muito mais"* todo mundo lê; o
**+4** só quem tem olheiro vê.
🚫 **Não dá pra copiar o FM:** o público do FM quer passar 3h descobrindo (gente
de planilha); o dele joga 6 min no ônibus. E fere lei dele mesmo — *"toda trava
explica o porquê e o caminho"* / *"saber o que pode e o que não pode"*. Técnico
que muda o time em segredo é o "comportamento fora das regras mapeadas" que ele
chama de bug. Risco prático: cara escolhe lenda, perde 3 jogos, não entende, some.

⏳ **Falta ele responder:** ① fecha a pirâmide 8/17/25/30/20? ② fecha o filtro por
divisão? ③ fecha regra explicada + número escondido? ④ se sim, escrever **os 20
primeiros técnicos** (5 linhas cada) num doc pra ele aprovar nome por nome ANTES
de qualquer código.

## 1. 🧠 Técnicos famosos
- Carta de técnico com nome real (mesmo critério dos jogadores: fatos públicos,
  bio de traço largo; rosto só com referência, senão neutro).
- **1 estilo = 1 benefício claro**: Paizão (blinda vestiário) · Estrategista (vê
  tática adversária) · Ofensivo (+gols −defesa) · Retranqueiro (nunca sofre 4+)
  · Professor (promessas sobem mais rápido) · Negociador (folha −20%) · Copeiro
  (+força em mata-mata).
- Nível OCULTO com revelação (alma do leilão preservada).
- **Duas rotas de entrada** (decidir com o Diego): (a) 7º setor do pregão —
  disputa entre amigos, MAS alonga o leilão; (b) mercado de 3 candidatos na
  virada de temporada — zero tempo extra (recomendada pra estreia).
- Salário pesa na folha; contrato 2-3 temporadas; rival pode roubar no fim.
- Sem técnico = jogo igual hoje (camada 100% opcional).

## 2. 🚗 Carros / Garagem (na Vadico Veículos)
- Comprados com MOEDAS (não fere a regra de ouro). Garagem na aba Clube, ABAIXO
  do estádio (sagrado).
- Escada: Fusca 76 (30🪙, +torcida) → Picape (80, bico/patrocínio +20%) →
  Esportivo (150, chegada filmada no clássico + raiva pós-derrota) → Ônibus
  (300, bônus fora de casa) → Avião (800, Série A, zera desgaste de viagem).
- 🔑 A amarração que dá SENTIDO: ônibus/avião mexem no CANSAÇO (tópico 7) —
  transporte vira mecânica, não enfeite.
- Depreciação/revenda, leilão-relâmpago de raridade, evento zoeira (reboque).

## 3. 🏷️ Nomes de times reais (pago?)
- ⚠️ ALERTA JURÍDICO: nome/escudo de CLUBE é marca registrada — clubes processam
  (jogador avulso é zona cinza tolerada; clube não). Vender "Flamengo" = risco
  real de derrubar o jogo.
- Caminho seguro estilo Brasfoot: **EDITOR DE NOMES local** — o usuário renomeia
  os times NO APARELHO dele (o jogo não distribui nada), e pode exportar/importar
  "patch" por código pra sala dos amigos. O que se paga é a FERRAMENTA (perk de
  tier Craque/Lenda), não os nomes — responde o "qual o sentido de pagar".
- Meio-termo grátis: pack de APELIDOS de torcida (risco menor, não zero).

## 4. 🅰️ Assistências
- Motor: cada gol sorteia um garçom ponderado (MEI forte > LAT > 2º ATA);
  `assistsByCard` igual ao goalsByCard. Custo baixo, profundidade alta.
- Aparece: G/A no elenco, aba Garçons na artilharia, jornal, valor de mercado do
  líder sobe (igual artilheiro), critério da Bola de Ouro.

## 5. 🏅 Bola de Ouro Legends (gala de fim de temporada)
- Depois do jornal (tempo morto, sem atrasar nada). Prêmios: **Chuteira de Ouro
  = artilheiro GERAL somando TODAS as divisões** (pedido do Diego; scorersAll já
  existe) · Bola de Ouro (G/A + campanha) · Luva de Ouro · Garçom de Ouro ·
  Revelação · Técnico do ano · Seleção da Temporada (XI ideal entre divisões).
- Efeito: selo dourado na carta na temporada seguinte (+valor, +salário).
- Online: amigos VOTAM no craque da galera. Anti-spoiler: só após o último apito.

## 6. 🏛️ Sala do Presidente (mockup já existe — de outra sessão)
- Papel: o presidente define METAS trimestrais/da temporada (3 pedidos com
  prêmio/punição), orçamento (quanto da caixa vai pra folha × estrutura),
  decisões políticas (preço do ingresso × humor da torcida).
- Liga com a ideia da simulação: pressão da diretoria/demissão.
- ⚠️ Antes de codar: achar o mockup aprovado dessa sala (outra sessão) e seguir
  ELE — não inventar por cima.

## 7. 😓 Cansaço / condição
- 3 estados simples na carta (💪/😓/🥵), sem micro-gestão: −8 de gás por jogo,
  +15 por rodada no banco; <40 = 😓 (−0,5 força), <15 = 🥵 (−1 força, 2× lesão).
- Dá SENTIDO ao banco (a simulação mostrou XI fixo pra sempre) e cria sinergia:
  Dep. Médico reduz desgaste · avião/ônibus (tópico 2) cortam viagem ·
  preparador físico recupera · Data FIFA cansa convocados.
- UI de 1 toque: aviso do preparador nos tempos mortos + botão "rodiziar" que
  sugere o XI descansado. Nunca passo obrigatório.

## 8. 🕵️ Olheiros que ALICIAM (por tier do usuário)
- ⚠️ Colisão com a regra de ouro IMPRESSA no jogo ("nenhum apoio dá vantagem em
  campo"). MAS há precedente fiel: o tier já limita o que você VÊ (overall:
  Craque vê até craque, Lenda vê lendas).
- **Síntese recomendada**: aliciar usa a MESMA escada da informação — você só
  alicia jogador cujo nível consegue VER (grátis: bom jogador p/ baixo · Craque:
  craques p/ baixo · Lenda: lendas). O pagamento continua comprando INFORMAÇÃO
  (como hoje); o aliciamento em si custa MOEDAS do jogo (proposta = valor ×1,5 +
  luvas) e salário. Jogador pode recusar por lealdade (ídolo com estátua nunca
  sai); rival pode aliciar os SEUS (com direito de cobrir a oferta).
- Janela: entre temporadas, no mercado — tempo morto.

## Ordem que eu sugeri ao Diego (sinergia entre eles)
1º Assistências (base de tudo, barato) → 2º Bola de Ouro (usa assistências) →
3º Cansaço (dá sentido ao banco) → 4º Carros (ganham mecânica com o cansaço) →
5º Técnicos → 6º Olheiros/aliciar → 7º Sala do Presidente (achar o mockup) →
8º Editor de nomes (decidir o jurídico primeiro).

**Status: NADA implementado — aguardando o Diego escolher por onde começa.**

---

## 🚦 VEREDITO DE VIABILIDADE (24/08, análise contra o motor real)
Pedido do Diego: *"veja se realmente daria certo no nosso jogo, funcionar de
verdade e ter sentido, não ser fake — só faça se tiver sentido"*.

**🟢 VERDE (encaixa no motor que existe, funciona de verdade):**
- **Assistências** — o motor já sorteia autor de gol por partida (`Goal`);
  sortear o garçom no mesmo lugar é orgânico. `assistsByCard` espelha o
  `goalsByCard` que já existe.
- **Bola de Ouro / Chuteira geral** — `scorersAll` já cruza as divisões; o selo
  que valoriza a carta usa o MESMO mecanismo do artilheiro (`applyScorerValues`
  sobe piso). É celebrar dado que já existe e ninguém vê.
- **Cansaço** — o motor JÁ aceita modificador por rodada (`RoundMods`, usado
  pelos eventos: noitada = -2 na rodada). Gás por jogador + mod por rodada
  encaixa sem tocar na fórmula. Lesão/Dep. Médico já existem pra sinergia.
  Condição: CPUs precisam de rodízio automático silencioso (ou baseline plano)
  pra não virar vantagem/desvantagem torta.
- **Olheiro/aliciar** — `cpuSquads` é elenco MATERIALIZADO dos 60 times: tirar
  jogador do Zorra FC e pôr no seu é operação real, não teatro. Trava por tier =
  mesma escada da REVELAÇÃO de overall (precedente que não fere a regra de ouro).

**🟡 AMARELO (funciona SE a condição for cumprida):**
- **Carros** — metade da escada (ônibus/avião) só tem sentido SE o cansaço
  existir antes. Sem cansaço, é enfeite (fake). Ordem obrigatória: cansaço → carros.
- **Técnicos** — todos os benefícios mapeiam em alavancas que existem (folha,
  promessas, tática, teto de goleada, copa) — mas é trabalho grande. Entrada
  pela rota (b) (3 candidatos na virada) pra não alongar o pregão.
- **Sala do Presidente** — VIÁVEL, mas as "metas do presidente" COLIDEM com a
  aposta do patrocínio (que já é um sistema de metas). Tem que fundir, não
  duplicar — senão o jogador vê dois chefes pedindo a mesma coisa = fake.
- **Editor de nomes** — display-only por cima (NUNCA renomear as chaves:
  placements/cpuSquads são keyed por NOME — mexer ali é a família de bug
  "virei bot"). Jurídico resolvido antes.

**🔴 VERMELHO (não fazer — seria fake ou quebra o conceito do jogo):**
- **Envelhecimento/aposentadoria** — o baralho é de LENDAS CONGELADAS no auge
  (a identidade da carta é nome+clube+ANO: "Pelé Santos 1962"). Envelhecer o
  Pelé de 62 quebra o conceito central. A cura da monotonia vem por cansaço +
  rivais que evoluem, não por idade.
- **Data FIFA / convocações no meio da temporada** — o sim não tem calendário
  semanal, e tirar jogador do XI no meio conflita com o pin de escalação e com
  a regra "mexeu em jogador, todo save atualiza". Forçado = fake.
- **Ser técnico da Seleção na Copa do Mundo** — a Copa do Mundo Legends é
  simulação-espetáculo separada; virar modo jogável é um jogo inteiro novo.
  Não agora.
- **Duelo de mascotes animado, boteco, vidente etc.** — o Diego já recusou; ficam
  fora.

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

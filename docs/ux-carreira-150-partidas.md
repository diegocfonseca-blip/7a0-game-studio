# 🪜 Carreira no celular e no desktop — o que melhorar (02/09/2026)

Pedido do Diego: *"O que pode melhorar visualmente e organizacional pra
dispositivos móveis e desktop em relação ao modo carreira? Simule 150 partidas
e me fale suas indicações, com mockup de antes e depois."*

## Como foi medido
- Um robô (Playwright + Chromium) criou uma carreira do zero e jogou como um
  jogador GRÁTIS (sem conta, sem Modo Manual), em dois aparelhos ao mesmo
  tempo: **celular 390×844** e **desktop 1440×900**.
- Jogou o pregão inteiro (5 setores + repescagens), a Cerimônia, e as
  temporadas em modo AUTO (9 s por rodada), passando por Copa, pênalti
  decisivo, promoção da base, "mesmo time" e a virada de temporada.
- Total: **celular 4 temporadas completas + início da 5ª (152 rodadas);
  desktop 4 temporadas (≈ 150 rodadas)**, com foto de cada tela nova, das
  rodadas 1/10/20/30/38 e das 5 abas no fim.
- ⚠️ Neste ambiente o Supabase é bloqueado, então aparecia a faixa
  "Manutenção rápida no servidor" — é do sandbox, não do jogo.

## O que apareceu (ordenado pelo que mais atrapalha)

### 1. 📱 A tela da rodada é um rolo de 2.500 px — o jogo compete com 100 linhas
Na aba JOGOS, a cada rodada, o celular mostra: cartão de "criar conta", header,
seu jogo, Modo Manual, NA COLA e **os jogos das 5 divisões inteiras** (≈ 50
jogos). Na pré-temporada é pior: **as 5 tabelas completas (100 linhas) + a
tabela de prêmios**, tudo abaixo da decisão do patrocínio. O jogador que quer só
acompanhar o SEU jogo rola quilômetros pra achar as outras coisas.
- **Depois:** seu jogo + botão Pular em cima; só os jogos da SUA divisão; as
  outras 4 divisões viram 4 atalhos ("Série A · 10 jogos ▸") que abrem na aba
  TABELAS. As tabelas completas moram na TABELAS (sua divisão aberta, as outras
  fechadas). A tabela de prêmios vai pra Clube › Patrocínio (já tem link).

### 2. 📱 O cartão "Sua carreira só existe neste aparelho" fica ACIMA do jogo
É o primeiro bloco da tela em TODA rodada, empurrando o placar pra baixo. Vale
o aviso, mas não vale o lugar (regra do Diego: nada entra antes da coisa
principal).
- **Depois:** vira uma tira de 1 linha logo acima da barra de abas
  ("☁️ Carreira só neste aparelho · criar conta ›"). Some quando cria a conta.

### 3. 🖥️ No desktop o jogo é um celular no meio da tela
A coluna tem ~620 px; em 1440 px sobram **57% de tela vazia**. As 5 tabelas se
espremem 2 por linha nessa coluna; a barra de abas fica no rodapé da janela
com 5 ícones a 300 px um do outro.
- **Depois (rodada):** 3 colunas — seu jogo + Pular + NA COLA + narrador à
  esquerda · a tabela da sua divisão inteira no meio · jogos da rodada, outras
  divisões e "seu clube" à direita. Abas viram botões no topo.
- **Depois (pregão):** jogadores em **2 colunas** com o lance ao lado do nome
  (hoje o +/− fica a 700 px do nome); envelope + LACRAR, campinho e A SALA numa
  coluna fixa à direita, sempre à vista.

### 4. 📱 Criar carreira: o campo do nome fica fora da tela
Duas caixas de explicação ("Como funciona" + "Baralho") vêm antes do nome do
time — a única coisa obrigatória fica a ~1.100 px do topo.
- **Depois:** nome, formação e rivais primeiro; as explicações viram duas
  linhas que abrem se a pessoa quiser.

### 5. O bloco de cima se repete em TODA aba
Trocar pra ELENCO, RANK ou CLUBE não troca o topo: cartão de conta + header da
temporada + placar do jogo + Modo Manual continuam lá (≈ 540 px de 900 no
desktop; no celular é a tela inteira). O conteúdo da aba começa abaixo da
dobra — a pessoa toca em ELENCO e vê… o placar de novo.
- **Depois:** fora da aba JOGOS, o topo vira UMA linha fina ("T4 · Rodada 34 ·
  20º · 🪙 114 · ⚽ 0×0 33'") e o conteúdo da aba começa logo abaixo.

### 6. Coisas menores que vi jogando
- **Pênalti decisivo, intervalo e lesão** já aparecem no lugar certo (o
  pênalti é uma janela por cima; a lesão vem logo abaixo do placar). Nada a
  fazer aí.
- **Fim de temporada:** o jornal "O Martelo" é ótimo, mas os botões "Leilão de
  reservas / Mesmo time" ficam depois do cartão da Copa do Mundo. A decisão
  merece um selo "SUA VEZ" no topo, igual ao patrocínio.
- **Nome dos times cortado** no placar do celular ("Juventude do Chu…"):
  reduzir a fonte em nomes longos, em vez de cortar.
- **Cerimônia da Revelação:** 20 páginas no celular (1/20). Um atalho "ver só
  o meu time e os rivais" resolve 90% dos casos.
- **Modo Manual trancado** aparece como cartão inteiro em toda rodada pra quem
  é grátis. Um botão pequeno com cadeado ao lado do Pular já diz a mesma coisa.

## Mockups
Gerados em `scratchpad` (não entram no repo): antes × depois de
Criar carreira · Pré-temporada · Rodada (celular) · Rodada (desktop) · Pregão
(desktop). Enviados pro Diego no chat em 02/09. O gerador dos "depois" está em
`scripts/mockup-carreira.mjs`.

## O que NÃO mexer
- Regras do jogo, ritmo (9 s por rodada), textos de zoeira, o jornal, o
  patrocínio de 2 passos — tudo isso funciona bem. É reorganização de tela,
  não de regra.
- Tudo aqui é visual e reversível commit a commit; nada muda save, banco ou
  online.

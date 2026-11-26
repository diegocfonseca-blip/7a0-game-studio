# 🌐 Carreira Online (Tradicional) — logística e plano (26/11)

Pedido do Diego (26/11): *"organizar e fazer tudo que tiver que ser feito pra podermos fazer a carreira online… pensar como vai ser
a logística… hoje a Liga Draft funciona muito bem… pessoas que entram e depois não jogam no dia seguinte… o host quer passar ou não
passa… até quantos times, 20 seria o ideal?"*

## Onde está (conferido em 26/11, depois da publicação do Codex na tradicional)
- Motor da v2 OK: `npm run carreira-online` (20 aparelhos = mesmo placar/tabela/artilharia) e `npm run carreira-online-fluxo`
  (3 clubes, leilão → 10 rodadas iguais) **passam** com a main de hoje. A publicação do Codex não quebrou a v2.
- Desenho: cada aparelho roda a CARREIRA TRADICIONAL do próprio clube; os clubes dos amigos chegam pelas gavetas
  (`carreira-online-v2.ts`); o leilão e o relógio rodam no aparelho de quem comanda a noite (`co2.ts`, canal `co2:<sala>`).
- Banco: `esc_carr_sala` / `esc_carr_clube` (até **20 assentos**) / `esc_carr_privado`. Criar = só as contas do Diego.
- Só 2 salas existem (as de teste), nenhuma passou da temporada 1.

## Os buracos que impedem liberar (técnicos, não dependem de decisão)
1. **A virada da temporada** trava com aviso (`if (s.co2) return s` no fim da temporada): falta leilão/mesmo time → sobe/cai → T2.
2. **Quem faltou não "alcança" a sala**: o caixa, os salários, a Agência e o resto do clube só andam no aparelho do dono do clube.
   Se ele faltou 15 rodadas, ao voltar o aparelho dele tem que JOGAR as rodadas perdidas em segundos (mesma gaveta congelada, mesmo
   resultado que os outros viram) antes de deixar ele mexer em nada. Hoje isso não existe.
3. **Entrar no meio**: o banco deixa entrar sempre que a sala está "em espera" — e entre uma noite e outra ela fica em espera. Quem
   entrar no meio da temporada fica sem lugar na tabela. Tem que ser só na virada (igual Liga da Turma/Draft).
4. **Tudo que a tradicional ganhou depois de 20/10** (Central direta, 3D, cenas, janela nova, SAF clássica, contratos novos…) está
   desligado na v2 (`!s.co2`). Cada um entra em bloco, com print.

## Proposta de funcionamento (espelhada na Liga Draft, que funciona)
- **Tamanho**: até **20 clubes de gente** (= a Várzea inteira; todo mundo começa lá). Bom de jogar: 6 a 12.
- **Noite**: o dono abre a noite, a sala joga rodada a rodada (prazo de PRONTO de ~60 s) e o dono encerra quando quiser. Meta:
  **uma temporada por noite** (~38 rodadas).
- **Quem não veio**: o clube NÃO sai — joga sozinho com a última escalação e o rodízio automático de cansaço (como o time de quem caiu
  na Liga). Ao voltar, o aparelho dele alcança as rodadas em segundos e ele continua de onde a sala está.
- **Quem não veio na virada**: fica com o MESMO time (não entra no pregão), contrato que vence renova sozinho se o caixa der, senão
  sai; vaga vazia ganha jogador profissional/bom de graça (régua do pregão aberto). Nunca jogador fake.
- **Quem sai de vez**: o clube vira bot com o elenco (regra da Liga Draft); só o dono da sala remove alguém.
- **Gente nova**: só entra na virada da temporada, com aceite do dono, começando na Várzea.
- **A coroa**: quem cria manda sempre (regra de 21/08). ⚠️ O código de 20/10 tem um **vice** escolhido pelo dono que pode ABRIR a noite
  quando o dono não deu sinal há 2 min (nunca no meio da noite). Isso precisa do OK explícito do Diego — senão sai.
- **Custo**: cada clube guarda o próprio save no banco (gaveta privada) — por isso criar sala com plano, como a Liga da Turma.

## Decisões que só o Diego toma (perguntadas em 26/11)
1. Até 20 clubes de gente? (recomendação: sim)
2. Vice escolhido pelo dono pode abrir a noite quando o dono não vem? (o código tem; regra das salas é "não")
3. Quem não veio na virada fica com o mesmo time? (recomendação: sim)
4. Criar sala = quem tem plano (como a Liga da Turma); entrar = qualquer conta? (recomendação: sim)
5. Uma temporada por noite como meta? (recomendação: sim)

## ✅ Decisões do Diego (26/11)
1. **Até 20 clubes de gente.**
2. **Vice: SAI.** Sem o dono a carreira espera (regra da coroa).
3. **Criar = só quem tem plano.**
4. **Entrar**: antes de começar, todo mundo de graça; depois que começou, **só com plano**, pedindo convite e com o aceite do dono
   (igual à Liga Draft). Sem plano não entra nunca, nem na virada.
5. **Quem não jogou não perde o clube**: o time joga sozinho; quando ele volta pra carreira, alcança onde todo mundo está. Na virada
   (o leilão) é a mesma coisa: quem não está fica com o mesmo time (*"não é a mesma coisa de quem não jogou?"* — é).

## 🔀 Dois jeitos de jogar (Diego, 26/11: *"eu queria testar os dois"*) — o dono escolhe ao criar
**⚡ Dinâmica** (igual às salas online / Liga Draft):
- Começou a temporada, as rodadas ROLAM uma atrás da outra, com as copas no meio, sem parar.
- Só PARA quando começa uma competição nova (Copa do Brasil, Libertadores…): banner com quem se classificou e
  *"tem 60 s pra mexer no time/estratégia"*; relógio no canto pra todos. Quem não está nela segue livre pelas abas (mercado,
  ver os jogos de quem joga…).
- O relógio é AVISO; quem manda seguir é o DONO (igual o draft): acabou o tempo, ele dá ok; antes do tempo, pede confirmação
  ("avançar mesmo sem o tempo acabar?"). Avançou = avança pra todo mundo.
- 🎬 **Visual da pausa = OPÇÃO C, anúncio de cinema** (Diego, 26/11: *"C"*) — mockup `scripts/mockups/carreira-online-dinamica-opcoes-bc.png`:
  troféu + nome da competição, escudos de TODOS os classificados (o seu em dourado), relógio grande, Escalação/Tática. Quem não está
  nela vê o mesmo anúncio com "Assistir" e "Fechar". Dono: ▶️ Seguir (pergunta se for antes do tempo). Opções A e B ficaram de fora.
**🧭 Livre** (a proposta anterior): o que é seu no seu tempo; jogo da rodada, leilão e virada juntos, com ✋ Pronto e o dono mandando seguir.
Construir primeiro a ⚡ Dinâmica (mais perto do que já existe nas salas), depois a 🧭 Livre.

## ✍️ Contratos e caixa (Diego, 26/11)
- **Renovar ou deixar sair = decisão de cada um, no dia dos contratos** (jogando ou não). 🔁 Corrigido pelo Diego no mesmo dia: NÃO existe
  chave de "renovação automática". Se a pessoa NÃO escolheu nada até o dono avançar → **renova sozinho**. Quem escolheu "deixar sair"
  perde o jogador e a vaga é completada com Cria da Base (nunca fake).
  🏷️ **Aviso SUTIL (Diego, 26/11)**: uma linha miúda na tela do dia dos contratos ("se você não escolher, renova sozinho") e, pra quem
  não estava, um recado discreto ao voltar ("enquanto você estava fora, renovamos Fulano e Ciclano"). Nada de banner grande.
- **Caixa a cada -500 = o melhor jogador vai embora** (regra da tradicional, `START_CAREER_CRISE`; no Brasil Oficial ela já roda, é a
  mesma tela). No online ela está desligada (`onlineMode === 'online'`) → ligar na carreira online, com o ausente trocando pela Cria da Base.
- **Dia dos contratos**: um dia FIXO da temporada, igual pra todos (todo contrato termina no mesmo momento). Pausa de 60 s com banner
  "o contrato de fulano acabou"; cada um mexe no time; o relógio é aviso e o dono avança (confirmação antes do tempo).
- Pausas da ⚡ Dinâmica: começo de competição nova (60 s) · dia dos contratos (60 s) · leilão.

## 📱💻 Mesma conta em 2 aparelhos (Diego, 26/11: *"gosto de como é na liga draft… só não quero novela"*)
Igual à Liga Draft: só o aparelho do DONO salva a carreira; os outros só recebem. Celular e PC da mesma conta abertos juntos veem o
mesmo time e qualquer ação vai pro dono. Gaveta do clube (coisas só dele) grava com carimbo de hora e o banco só aceita a mais nova.
Nada de "o último que entrou manda / o outro só assiste".

## 📲 Extras aprovados (Diego, 26/11)
- **Resumo da turma** na Central (cartões: divisão/posição, último jogo, jogando/fora há X dias, etiquetas) — mockup `carreira-online-central-turma.png`.
- **TUITER** (*"Twitter com U"*, paródia igual às marcas do fornecedor): rede da turma com cara de Twitter (branco, azul #1D9BF0,
  passarinho amarelo com martelo), posts de 80 letras (banco barra palavrão/link), @ responder, reações; posts automáticos do
  O Martelo e das copas; bots postam com selo BOT. Abas Para você · Só a turma · Meus. Mockup `carreira-online-tuiter.png` (aguarda OK).
- ⚔️ Clássico da turma · 🏆 Galeria da turma (+ Sala de Troféus do clube) · 🥇 Prêmios da turma no fim (só zoeira, sem dinheiro).
- 🤝 Troca/venda entre amigos: **DEPOIS** (*"deixa pra depois"*). Sem ranking global; vale a tabela da carreira.

## 🕵️ Sondar e leilão na carreira online (Diego, 26/11: *"pode ser sim"*)
- **Sondar de amigo** (regra aprovada): só RESERVA (titular protegido, igual bot) · gasta a sondagem de jogador daquele leilão · vai pro
  leilão de todos com mínimo = valor dele · dinheiro vai pro DONO · ninguém deu lance = volta pro dono com o mesmo contrato · quem
  sondou tem preferência de IGUALAR o maior lance no fim (igual à Liga Draft) · o dono não dá lance no próprio jogador.
- **Bots no leilão = configuração do DONO** (*"ele escolhe o número… nenhum bot ou até 5"*): 0 a 5 bots dão lance; são rivais da(s)
  divisão(ões) de quem está jogando e mudam quando a divisão muda. Motivo: com 2 amigos e 1 sem dar lance, o outro não leva tudo de
  graça. Tela de CONFIGURAÇÕES do dono vai ganhar mais opções depois.
- **Bot que perde jogador** (Diego, 26/11): SEMPRE avisa (Central/Tuiter: quem levou, por quanto, de quem). Só repõe se ficar com MENOS
  de 11 pro time; a reposição é uma SOBRA REAL do leilão com over PARECIDO (nunca jogador genérico/fake) — vale também quando o dono
  configurou 0 bots no leilão (o bot não dá lance, mas não fica com buraco). Base que já existe: `completa` (store ~1530) usa
  "carta real livre" por referência; conferir que pega a de over mais próximo da que saiu.
- 💡 Feito no branch: linha no Sondar do Mercado (carreira normal e Oficial, com gestão nova) — "Pode ser sondado: 🆓 sem contrato e
  🪑 reserva de outro clube (paga a transferência). Titular nunca."

## Ordem de trabalho
1. Alcance de quem faltou (`co2` + simulação das rodadas perdidas) — trava nova: aparelho que volta = mesmo estado do que ficou.
2. A virada (leilão de todos no aparelho do comandante · ausente fica com o time · sobe/cai · T2) — trava: 3 clubes, 2 temporadas.
3. Entrada só na virada (banco) + sair/remover = vira bot.
4. Teste com 2 contas de verdade (Diego + conta 2).
5. Blocos da tradicional (`docs/carreira-online-checklist.md`), cada um com print.

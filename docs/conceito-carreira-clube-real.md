# 🌍 Carreira com Clube Real (planejamento — 01/11)

Ideia do Diego. Na hora de começar a carreira, a pessoa escolhe entre criar o próprio clube (como sempre) ou **assumir um
clube de verdade** (Flamengo, Real Madrid, Boca…). Daí pra frente é a carreira de sempre, com o clube real no lugar do
clube inventado.

Mockups: `scripts/mockups/carreira-clube-real-2.png` (fluxo) · `scripts/mockups/carreira-clube-real.png` (1ª versão).
Nada disto está no jogo ainda. Os itens marcados **❓** ainda precisam de resposta do Diego.

---

## 1. Quem pode jogar
- **A partir do ⭐ Craque** (Craque, Lenda, Batismo, Fundador). Sem plano: a opção aparece com 🔒 e o botão ⭐ Ver planos.
- Cada carreira de clube real **gasta uma ficha de carreira normal** (grátis 1 · Craque 2 · Lenda 4 · Batismo 4 + fichas
  extras da Loja). Não cria ficha nova.
- Só na **carreira solo**. Salas online, Minhas Ligas e partida rápida não mudam.

## 2. O começo
1. **Nova carreira → como você quer começar?** 🛡️ Meu clube (como sempre) · 🌍 Clube real (⭐ com plano).
2. **Escolha o clube.** Lista com escudo e filtro 🇧🇷 Brasil · 🇪🇺 Europa · 🌎 Mundo.
3. **O sorteio dos 11.** O jogo sorteia 11 cartas DO CLUBE **só pela posição** (formação escolhida). Ninguém escolhe a dedo.
4. **Todo mundo começa na Várzea** e sobe a escada inteira, igual à carreira de sempre.
   - Pra fazer sentido na Várzea, o sorteio usa **só as cartas fracas do clube** (bom jogador e profissional — a régua
     da Várzea de hoje). As lendas e craques do clube ficam no baralho e **aparecem no leilão conforme você sobe**
     (Zico, Romário, Gabigol… você vai ter que ganhar no envelope).
   - ❓ Ideia a mais: jogador do SEU clube que aparece no leilão ganha um selo ❤️ "é da casa" (só visual, sem vantagem).

## 3. Os clubes da lista
- Entra quem consegue montar **11 só com cartas fracas, no 4-3-3 e no 4-4-2**.
- **Hoje dá pra 17 clubes:** Flamengo, Corinthians, Palmeiras, São Paulo, Santos, Vasco, Botafogo, Grêmio, Internacional,
  Real Madrid, Man United, Juventus, Chelsea, Liverpool, Arsenal, Sevilla, Newcastle.
- **Mais 31 clubes** têm time completo, mas faltam cartas fracas (só têm craque/lenda numa posição — Milan sem goleiro
  fraco, Barça e Bayern sem meia/zagueiro fraco, River e Peñarol quase sem carta fraca). São **73 cartas** de jogador
  conhecido e comum (o reserva famoso, o folclórico do clube) pra todos entrarem.
- ❓ **Lançar já com os 17** e ir somando, **ou** fazer as 73 cartas antes e lançar com os 48.
- Clube novo na lista = rodar a conferência (vai virar trava: `npm run clube-real`).

## 4. O leilão e o elenco
- O leilão é **o envelope de sempre**, com a **escada de categorias de sempre** (Várzea só bom/profissional, e por aí vai).
- As outras cartas do seu clube (as que não saíram no sorteio) vão pro baralho como qualquer carta.
- Contrato, salário, piso, renovação, condição física, Agência, técnico, preparador — **tudo igual**.
- Os rivais na tabela são **os bots de sempre**. Os outros clubes reais não viram rivais; são só a lista de escolha.

## 5. A cara do clube
- **Nome e escudo do clube real** (o escudo oficial que o jogo já usa no Leilão de Clubes). O nome não muda.
- **Manto nas cores do clube.**
- **NÃO tem:** mascote, carimbo de gol do mascote, entrada de gala, canto, nome reservado. Isso continua sendo **só de
  quem tem o próprio clube** (batismo/fundador) — é o que mantém o batismo valendo, e a cara dele aparece mesmo é no
  online, que não muda.
- Depois de um título, uma linha leve: *"Imagina isso com o SEU escudo e o SEU mascote. 🖋 Batize seu clube"* (aparece
  uma vez e, fechada, não volta — regra do aviso fechado).

## 6. As competições (o que muda de verdade)
- **Liga (pirâmide) e Copa:** iguais.
- **Libertadores / Champions — agora com o SEU clube, sem convite:**
  - Clube da **América do Sul** (Flamengo, Santos, Boca, River…) que se classificar **vai pra Libertadores com ele mesmo**.
  - Clube da **Europa** (Real Madrid, Man United…) **vai pra Champions com ele mesmo** — não precisa ganhar a Libertadores
    antes (a trava "Champions só depois da Liberta" é da carreira de sempre e não vale aqui).
  - O **Mundial** continua: campeão da sua competição contra o campeão da outra, jogo único.
  - Mesma régua de classificação de hoje (quem tem vaga, pular/assistir quando não tem), mesmo placar, mesmos prêmios
    e pontos.
  - ❓ Clube real de **outros lugares** (se um dia entrar Al-Hilal, Inter Miami…): decidir depois.
- **Copa do Mundo** do roteiro de fim de temporada: igual.

## 7. SAF e 2º clube
- **Pode tudo, igual à carreira de sempre:** comprar SAF, assumir o comando dela, ter o 2º clube, vender, emprestar
  entre os dois. O clube real é o **principal**.
- ❓ Se o 2º clube também puder ser real ou só inventado — sugestão: só inventado (simples e mantém o batismo).

## 8. Ranking global, troféus, cartinhas
- **Ranking global:** conta normal, como a carreira de sempre. ❓ (antes eu tinha sugerido contar só clube próprio — o
  Diego decide).
- Sala de troféus, cartinha de título, Bola de Ouro, artilharia, coleção: **tudo igual**.

## 9. O que NÃO muda (segurança)
- Quem cria o próprio clube: **nada muda**, nem uma linha da carreira dele.
- Saves antigos: nada muda. O clube real é uma marca nova no save de carreira nova.
- Salas online, Minhas Ligas, partida rápida, batismo, mimos: nada muda.
- Marca nova de modo entra na lista `MARCAS_DE_MODO` (zerada em todo começo de carreira) — trava `npm run carreira-limpa`.

## 10. Como construir (etapas)
1. **Lista de clubes + sorteio** (motor puro, sem tela) + trava `npm run clube-real`: todo clube da lista fecha 11 fraco
   nos dois esquemas, o sorteio nunca repete carta, as cartas do clube voltam pro baralho.
2. **Tela de começo** (3 passos do mockup) — só na conta do Diego primeiro.
3. **Escudo/manto/nome** do clube real em todos os lugares onde aparece o clube do usuário.
4. **Libertadores/Champions com o próprio clube.**
5. Teste completo da Várzea à Champions na bancada (simulação da carreira pela tela).
6. Liberar pra todos com selo NOVO + novidade + story.

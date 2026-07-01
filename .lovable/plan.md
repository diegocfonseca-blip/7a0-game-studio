Vou reformular a economia e o fluxo de descoberta do modo Empresário pra ficar mais duro, mais realista e recompensar quem sabe cuidar de jogador. Cinco frentes:

## 1. Escritório mais caro (e mais decisivo)

Em `src/empresario/data/*` (upgrades/escritório):
- Multiplicar custos de escritório e upgrades por ~3–5x (níveis 2–5 viram investimento de médio prazo, não compra de uma semana).
- Custo semanal do escritório também sobe por nível — manter estrutura pesa no caixa.
- Escritórios internacionais viram itens caros e específicos: **Escritório em Buenos Aires**, **Madrid**, **Milão**, **Paris**, **Londres**, **Lisboa**, **Amsterdã**, **Berlim**. Cada um custa uma fortuna e libera propostas de clubes daquele país (ver item 5).

## 2. Lendas começam JOVENS e ANÔNIMAS

Em `src/empresario/data/legends.ts` e `screens/ScoutsScreen.tsx`:
- Rating inicial de uma lenda quando aparece = **28–45** (moleque de pelada / base), não 70+.
- Status inicial passa a ser `pelada` ou `base` na esmagadora maioria — `pro` só se o ano atual ≥ `emergenceYear`, `estrela` só dentro do `peakYear`.
- Texto de descoberta reforça o contexto ("jogando pelo São Cristóvão", "peneira no CT", "várzea em Diadema"), sem citar fama.
- `signingFee` e `luva` da lenda quando ainda é pelada/base ficam BAIXOS (é um moleque), mas `monthlyFee` de manutenção sobe conforme ele ganha fama.

## 3. Propostas não caem no dia seguinte — precisa cuidar

Em `src/empresario/store/index.tsx` (avanço semanal) e geração de `ClubOffer`:
- Nova regra: um cliente só entra na "fila de propostas" depois de **N semanas cuidado direito**, onde N depende de:
  - status atual (pelada: 40+ semanas, base: 20+, pro: 8+, estrela: 2+)
  - felicidade (baixa felicidade = zero propostas)
  - manutenção em dia (fee mensal pago sem atraso)
- Custo mensal por cliente escala com **fama × idade × país** (europeu novo custa mais que brasileiro moleque; estrela custa muito mais que base).
- Enquanto está incubando, o jogador SOBE de rating semanalmente se você paga bem e tem escritório/base adequados.

## 4. Draft/Leilão respeitam scouts regionais

Em `src/draft/*` e no leilão do empresário:
- Cada leilão/pick tem um `region` (BR, AR, EU-SUL, EU-NORTE, etc.) derivado da nacionalidade da lenda.
- Se você TEM o scout regional: vê nome, rating, atributos normais — pode dar lance.
- Se NÃO tem: card aparece **borrado** com "❓ Jogador desconhecido — sem scout em {região}". Botão de lance fica desabilitado com tooltip "Contrate o Scout {região} para participar".
- CPUs com o scout certo continuam competindo normalmente, então o leilão acontece — você só fica de fora.

## 5. Propostas de clubes dependem do escritório no país

Na geração de `ClubOffer` no store:
- Cada clube tem um país. Antes de emitir a proposta, checa `hasOfficeIn(country)`.
- Sem escritório no país → nenhuma proposta daquele mercado chega, mesmo que o jogador esteja estrelado.
- Exceção: o **escritório principal do Brasil** sempre existe (você começa nele), então clubes BR sempre podem propor.
- Interface: no card do cliente, mostrar chips dos mercados abertos ("🇧🇷 🇦🇷 🇪🇸 …") — mercados fechados aparecem cinza com cadeado, deixando óbvio que falta escritório.

## Arquivos a mexer

- `src/empresario/data/legends.ts` — ratings iniciais, status, textos de descoberta
- `src/empresario/data/career.ts` / upgrades — preços novos, escritórios internacionais
- `src/empresario/store/index.tsx` — regras de propostas (tempo de cuidado, país, custo mensal escalado)
- `src/empresario/screens/ScoutsScreen.tsx` — mostrar rating real baixo, contexto de moleque
- `src/empresario/screens/NegotiationsScreen.tsx` / `DashboardScreen.tsx` — chips de mercado, indicador "incubando"
- `src/draft/screens.tsx` e leilão do empresário — bloqueio por scout regional
- `src/empresario/ui.tsx` — componentes de "card borrado" e "mercado fechado"

## Detalhes técnicos

- Adicionar `weeksAsClient` e `careCount` em `Client` pra medir cuidado.
- Adicionar `officesOwned: string[]` no `GameState` (códigos de país: 'AR', 'ES', 'IT', …).
- Função `canReceiveOffersFrom(client, state)` centraliza as regras dos itens 3 e 5.
- Função `visibleInAuction(legend, state)` centraliza a regra do item 4.
- Rebalancear economia inicial: começa com pouco menos de dinheiro, escritório BR base grátis, tudo mais é conquistado.

Posso tocar tudo isso agora?

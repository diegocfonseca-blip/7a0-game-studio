# Pista Legends: Fórmula 1, Partida Rápida privada — 25/11/2026

## Pedido e apresentação

Diego pediu implementar o jogo na própria conta, apenas Partida Rápida: “já pode fazer pro Fórmula 1… só pro partida rápida pra minha conta… Pode ir fazendo”. Solicitou pilotos de categorias diferentes, grandes campeões e carros identificados pelo modelo e ano, e citou o mockup anterior como referência.

O mockup foi localizado em `/workspace/shared/mockup-pista-legends-20261122/`: pista de Interlagos vista de cima, posições, rádio e muro dos boxes. A implementação usa essa composição, com três compras efetivas e estratégias por piloto. O pedido atual autoriza concretizar a referência; não se está solicitando nova aprovação para executar o que já foi pedido.

## Padrão compartilhado — correção pedida em 25/11

Diego rejeitou a mini-home e o pregão independente: pediu os mesmos padrões visuais, menus e motores de futebol/basquete, alterando apenas o que faz sentido para automobilismo. Esta correção substitui as diferenças da primeira entrega.

- `HomeV03` é a mesma home dos três esportes. F1 troca marca, textos e elementos da pista. Os três segmentos do seletor têm as mesmas classes, altura e alinhamento, com apenas um ativo. Online/carreira da F1 aparecem como indisponíveis; só Partida Rápida joga.
- `QuickMatchLayout` foi extraído da Partida Rápida existente e passou a ser usado por futebol, basquete e F1. Mantém accordions, confirmação, resumo lateral e barra móvel. `OwnerOnlineHeader` aceita identidade do esporte sem introduzir navegação de futebol na F1.
- Envelopes, ordem pelo total apostado, anulações, adjudicação, limite de caixa, desempate, registro do pregão aberto, martelo, escada e tempos da Tocaia vêm de `auction-core.ts`. O motor publicado de futebol/basquete delega essas mesmas operações ao núcleo compartilhado. Contratos, pisos, duplas, reservas e autoridade online continuam nos seus adaptadores existentes.
- `AuctionIdentity` e `AuctionPositions` são usados pelas cartas/barras de futebol/basquete e pela F1. A F1 reutiliza `Shell`, `Box`, `Btn`, `HoldButton`, `AuctionDesktopLayout` e seus slots. A antiga grade que antecipava categoria e atributos foi removida.
- Envelope cego por etapa, envelope único com pilotos/carros juntos, pregão aberto carta por carta e Tocaia com escada/tempos comuns. No cego, empate permite novo lance antes do sorteio; no envelope único o empate vai a sorteio como no jogo existente. Revelação individual, sem antecipar notas antes do martelo.
- A montagem, vagas, planejamento dos bots e corrida são adaptações de automobilismo. O núcleo compartilhado não insere pilotos no `Card`, nem redefine partidas online de futebol como corridas.

## Regras atuais

- Uma pessoa contra 3, 5, 7 ou 9 escuderias controladas pelo computador. Todos começam com 100 moedas próprias deste jogo.
- Três compras: primeiro piloto, segundo piloto, modelo histórico de carro (juntos no formato envelope único). O modelo equipa duas unidades, uma por piloto.
- Nos envelopes fechados, os bots decidem sem receber o lance humano; vence o maior lance elegível. Empates seguem o mesmo novo lance/sorteio do formato escolhido no futebol/basquete.
- A compra reserva pelo menos uma moeda por vaga restante. Só se desconta de quem leva a carta. Perdeu o lance: conserva o caixa e tenta outra carta. Os rivais completam as vagas no mesmo mercado.
- 48 pessoas reais, uma carta por pessoa, e 20 modelos/anos reais. Cinco categorias crescentes: Profissional, Bom piloto/carro, Promessa, Craque, Lenda. Notas e atributos são avaliações de balanceamento relativas à época; não são medidas oficiais nem comparação absoluta de motores entre décadas.
- Interlagos, 24 voltas e 8 a 20 carros conforme os rivais escolhidos. Velocidade normal mostra cerca de quatro minutos; a transmissão permite 1×/2×/4× sem mudar o resultado de um segundo virtual.
- Cada piloto tem pneus próprios, desgaste, ritmo, composto da próxima parada e ordem de box. A ordem vale na passagem seguinte; a troca completa custa 22 segundos. Durante o serviço, pneu e nova ordem de box ficam bloqueados. Cancelar antes de entrar continua possível.
- Poupar preserva pneu e custa tempo; atacar ganha ritmo, desgasta mais e aumenta o risco de erros breves. A habilidade do piloto e a qualidade do carro influenciam o rendimento; menor confiabilidade aumenta a chance de falhas breves com perda de segundos, sem eliminar carros nesta versão.
- Seco ou clima variável escolhido antes da largada. A chuva pune slicks e favorece intermediários. Na corrida que permanece seca, usar um só composto de seco gera 30s na chegada. Bots cumprem a mesma regra.
- Pilotos pontuam 25/18/15/12/10/8/6/4/2/1 até o décimo; a soma define as escuderias. Resultados incluem penalidades.
- Pausa é global. Ocultar a página pausa a corrida; retornar não salta minutos. Trocar de esporte preserva a sessão em memória, pausada; recarregar/fechar a página não é salvamento de carreira.

## Isolamento e acesso

- A entrada e a própria tela usam `useOwnerPresentation`, a identidade principal já verificada em `online-preview.ts` por `getUser`. A conta secundária, Futpoint, usuários comuns e visitantes não recebem a aba. Logout/troca de conta retira a tela. Não há novo fluxo de Auth ou alteração nas listas existentes.
- A escolha de F1 é local e separada do tipo `Sport` e do `EscState`. O roteamento só acontece na tela inicial; uma URL não sequestra uma carreira/sala em andamento.
- O jogo é carregado sob demanda. Dados, corrida, orçamento e seleção não entram nos elencos, salas, saves, coleção ou moedas de futebol/basquete.
- Não adiciona tabela, RPC, migration, política, canal Realtime, upload ou escrita na nuvem. Não consulta dados privados novos. Conta e sessão continuam com a infraestrutura anterior.
- Supabase: consultados changelog e documentação de `auth.getUser`; não houve alteração de SDK/API. A autenticação da bancada é simulada com backend local e rede externa bloqueada; não acessa nem modifica uma conta real.
- Não anunciar na lista pública de novidades enquanto a versão permanecer exclusiva do Diego.

## Fontes históricas e traçado

As notas são do jogo. Os exemplos históricos foram conferidos nas referências abaixo; nomes, temporadas e modelos não são carros genéricos por marca.

- [McLaren MP4/4, 1988](https://www.mclaren.com/racing/heritage/formula-1/cars/1988-formula-1-mclaren-mp4-4/): 15 vitórias em 16 GPs.
- [Red Bull RB19, 2023](https://www.redbullracing.com/int-en/cars/rb19): 21 vitórias em 22 GPs.
- [Ferrari F2004 e o sétimo título de Schumacher](https://www.formula1.com/en/latest/article/mick-schumacher-to-drive-a-ferrari-f2004-in-hockenheim.6bg5pLJswXMMqZ0OyGECSc).
- [Williams FW14B e Nigel Mansell](https://www.williamsf1.com/articles/22794892-7962-4c82-b00b-90aac32870b8/nigel-mansell-and-the-fw14b-an-iconic-duo).
- [Campeões históricos da Fórmula 1](https://www.formula1.com/en/drivers/hall-of-fame).
- [Circuitos por Tomislav Bacinger](https://github.com/bacinger/f1-circuits), MIT. Geometria de Interlagos reutilizada do mockup; boxes esquemáticos. Crédito no jogo e licença distribuída em `public/formula1/LICENSE-track.txt`.

## Verificação da correção

- `core.mts`: 1.000 cenários comparados com snapshot do resolver publicado em `8ef74189`, incluindo reforços, pisos, vendedor, elegibilidade, vagas, saldo e empates. Resultados e efeitos de compras iguais; orçamento, desempate e tempos conferidos.
- `motor.mts`: 128 combinações de quatro pregões × quatro tamanhos de grid × oito sementes, mais os 50 leilões/50 corridas completos e suas proteções anteriores. Sem saldo negativo, duplicatas ou escuderia incompleta na largada.
- `padroes-browser.mjs`: homes dos três esportes em 320/390/1440, mesma posição/altura dos segmentos, um ativo; menus rápidos reais; leilão completo, revelação, desempate, corrida, pausa, pit individual, ida/volta ao futebol e retirada no logout. Corrida completa em 390. `modes-browser.mjs` verifica os outros pregões pela interface.
- `gate-root.mjs`: entrada real, visitante/segunda conta sem acesso e sem carregar a corrida; principal permitida; troca de esporte/logout. Capturas e relatórios: `/workspace/shared/formula1-padroes-20261125/`.
- Regressões do envelope único, pregão aberto de futebol e NBA e Tocaia. O teste antigo da Tocaia foi atualizado para aceitar o guarda de pregão aberto que já existia na criação da sala; não houve mudança de regra nessa criação.
- Build TypeScript e produção passaram. Regressão da carreira passou em 390 com pausa, três substituições, bloqueio da quarta, retomada e apito final. Os outros três pregões passaram também pela interface real.
- Publicação da correção: em preparação. Manter o acesso privado e confirmar o deploy antes de anunciar como disponível.

## Verificação e publicação inicial (substituída visualmente pela correção)

- `scripts/teste-formula1/motor.mts`: 50 leilões e 50 corridas completos, todas as categorias, unicidade, saldo e reserva, preço debitado, bots sem ler envelope humano, duplo toque, controle apenas dos próprios pilotos, pit de 22s, bloqueios de serviço, determinismo, chegada, pontos e consequência de ritmo/desgaste, pneu de chuva e confiabilidade.
- `scripts/teste-formula1/browser.mjs`: 320/390/1440, leilão real até equipe completa, pausa, troca de pneus, cancelamento de pit, retorno, chuva e corrida completa no celular, troca de conta bloqueada. Sem vazamento horizontal nem erros JavaScript.
- `scripts/teste-formula1/gate-root.mjs`: passou na entrada pelo aplicativo principal, alternância Futebol/Basquete/F1, visitante e segunda conta bloqueados sem baixar a corrida, e retirada da tela no logout.
- Capturas reais e relatórios em `/workspace/shared/formula1-privada-20261125/`.
- Build de produção e smoke test compilado 390/1440: passaram, sem erros TypeScript/JavaScript. Regressão da carreira de futebol passou com pausa, três substituições, bloqueio da quarta, retomada e apito final. Fonte `6edf7ecdac41eaf2e89a819ef8d5c60705881b61`; [GitHub Pages 45531787439](https://github.com/diegocfonseca-blip/7a0-game-studio/actions/runs/45531787439), build e deploy concluídos com sucesso em 25/11/2026. Acesso permanece somente pela conta principal.

Reversão: reverter o commit desta entrega. Não exige migração, remoção de dados ou conversão de saves.

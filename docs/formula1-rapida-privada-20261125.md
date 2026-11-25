# Pista Legends: Fórmula 1, Partida Rápida privada — 25/11/2026

## Pedido e apresentação

Diego pediu implementar o jogo na própria conta, apenas Partida Rápida: “já pode fazer pro Fórmula 1… só pro partida rápida pra minha conta… Pode ir fazendo”. Solicitou pilotos de categorias diferentes, grandes campeões e carros identificados pelo modelo e ano, e citou o mockup anterior como referência.

O mockup foi localizado em `/workspace/shared/mockup-pista-legends-20261122/`: pista de Interlagos vista de cima, posições, rádio e muro dos boxes. A implementação usa essa composição, com três compras efetivas e estratégias por piloto. O pedido atual autoriza concretizar a referência; não se está solicitando nova aprovação para executar o que já foi pedido.

## Regras da primeira versão

- Uma pessoa contra três escuderias controladas pelo computador. Todos começam com 100 moedas próprias deste jogo.
- Três compras: primeiro piloto, segundo piloto, modelo histórico de carro. O modelo equipa duas unidades, uma por piloto.
- Envelopes fechados: cada participante escolhe carta e preço; os bots não recebem o lance humano antes de decidir. Vence o maior lance; empate tem critério pseudoaleatório reproduzível pela semente.
- A compra reserva pelo menos uma moeda por vaga restante. Só se desconta de quem leva a carta. Perdeu o lance: conserva o caixa e tenta outra carta. Os rivais completam as vagas no mesmo mercado.
- 48 pessoas reais, uma carta por pessoa, e 20 modelos/anos reais. Cinco categorias crescentes: Profissional, Bom piloto/carro, Promessa, Craque, Lenda. Notas e atributos são avaliações de balanceamento relativas à época; não são medidas oficiais nem comparação absoluta de motores entre décadas.
- Interlagos, 24 voltas e oito carros. Velocidade normal mostra cerca de quatro minutos; a transmissão permite 1×/2×/4× sem mudar o resultado de um segundo virtual.
- Cada piloto tem pneus próprios, desgaste, ritmo, composto da próxima parada e ordem de box. A ordem vale na passagem seguinte; a troca completa custa 22 segundos. Durante o serviço, pneu e nova ordem de box ficam bloqueados. Cancelar antes de entrar continua possível.
- Poupar preserva pneu e custa tempo; atacar ganha ritmo, desgasta mais e aumenta o risco de erros breves. A habilidade do piloto e a qualidade do carro influenciam o rendimento; menor confiabilidade aumenta a chance de falhas breves com perda de segundos, sem eliminar carros nesta versão.
- Seco ou clima variável escolhido antes da largada. A chuva pune slicks e favorece intermediários. Na corrida que permanece seca, usar um só composto de seco gera 30s na chegada. Bots cumprem a mesma regra.
- Pilotos pontuam 25/18/15/12/10/8/6/4 no grid de oito; a soma define as escuderias. Resultados incluem penalidades.
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

## Verificação e publicação

- `scripts/teste-formula1/motor.mts`: 50 leilões e 50 corridas completos, todas as categorias, unicidade, saldo e reserva, preço debitado, bots sem ler envelope humano, duplo toque, controle apenas dos próprios pilotos, pit de 22s, bloqueios de serviço, determinismo, chegada, pontos e consequência de ritmo/desgaste, pneu de chuva e confiabilidade.
- `scripts/teste-formula1/browser.mjs`: 320/390/1440, leilão real até equipe completa, pausa, troca de pneus, cancelamento de pit, retorno, chuva e corrida completa no celular, troca de conta bloqueada. Sem vazamento horizontal nem erros JavaScript.
- `scripts/teste-formula1/gate-root.mjs`: passou na entrada pelo aplicativo principal, alternância Futebol/Basquete/F1, visitante e segunda conta bloqueados sem baixar a corrida, e retirada da tela no logout.
- Capturas reais e relatórios em `/workspace/shared/formula1-privada-20261125/`.
- Build de produção e smoke test compilado 390/1440: passaram, sem erros TypeScript/JavaScript. Regressão da carreira de futebol passou com pausa, três substituições, bloqueio da quarta, retomada e apito final. Registrar commit e conclusão do deploy privado antes de comunicar disponibilidade.

Reversão: reverter o commit desta entrega. Não exige migração, remoção de dados ou conversão de saves.

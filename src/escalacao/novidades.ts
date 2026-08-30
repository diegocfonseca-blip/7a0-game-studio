// ─── 📢 NOVIDADES DO JOGO — a lista ÚNICA (Diego 16/08) ──────────────────
//
// Regras que o Diego deu, em ordem de importância:
//
// 1. **TODA novidade do jogo entra aqui, sozinha.** Ligou uma coisa nova pro
//    pessoal? A mesma entrega que liga escreve a linha aqui. Não existe
//    "depois eu aviso" — o que não está aqui, ninguém fica sabendo.
// 2. **BUG NUNCA ENTRA.** *"Menos bugs q nunca lance"*. Conserto não é
//    novidade: quem joga não quer ler que alguma coisa estava quebrada. Se a
//    entrega é só conserto, ela NÃO ganha linha aqui — vai pro
//    `docs/pendencias.md` e pro commit, que é onde isso mora.
// 3. **Novidade não fica pra sempre.** A tela mostra só o que é RECENTE e some
//    sozinho com o tempo (ver `novidadesDaVez` embaixo). Antes eram 17 avisos
//    empilhados, alguns de meses atrás — virou um paredão que ninguém lia.
//
// Como escrever a linha: o QUE mudou pra quem joga, em uma frase, com o modo
// entre parênteses. Sem tecniquês, sem nome de arquivo, sem "implementamos".
export interface Novidade {
  /** dia em que ISSO ficou disponível pra galera (YYYY-MM-DD) — é o que faz a lista encolher sozinha */
  data: string
  emoji: string
  titulo: string
  /** uma frase. Se não couber numa frase, provavelmente são duas novidades. */
  texto: string
}

// ⚠️ SEMPRE em ordem: a mais NOVA em cima.
export const NOVIDADES: Novidade[] = [
  { data: '2026-08-29', emoji: '⚖️', titulo: 'O Rank agora é por pontos', texto: 'Na barrinha de troféus da sala (Rápido e Minhas Ligas), a aba 🏆 Rank passou a somar pontos em vez de comparar títulos: título da liga vale +30, a copa vale +20 e cair pra zona de rebaixamento tira 10 — mas ninguém fica negativo, o pior caso é zero. Artilheiro continua ganhando troféu na Estante, só não conta ponto. As regras ficam escritas ali embaixo do Rank, e na sua liga o dono pode mudar tudo isso em ⚙️ Ajustes.' },
  { data: '2026-08-29', emoji: '🔨', titulo: 'Criar sala ficou simples', texto: 'A tela de criar sala foi refeita: agora começa perguntando UMA coisa — o que vocês vão jogar — em cartões grandes que explicam cada modo. Escolheu, as configurações daquele modo abrem embaixo já no ponto, e o botão de criar fica no fim. Nenhuma opção sumiu: baralho, formação, duplas, chat, tempo do leilão e o resto continuam lá, só na ordem certa.' },
  { data: '2026-08-29', emoji: '🏆', titulo: 'MINHAS LIGAS — a sala da sua turma que NÃO acaba', texto: 'Sala rápida some quando a galera sai. A Liga não: é sempre a MESMA sala, com dia e hora combinados, e a estante guardando campeão, artilheiro e rebaixado temporada após temporada — com o ranking somando tudo pela regra que o dono escolher. Ela é só da sua turma: entra com o código + a senha, e não aparece em lista nenhuma. Criar é benefício do 👑 Lenda (até 5 ligas); pra JOGAR não precisa de nada — é só alguém te passar o código.' },
  { data: '2026-08-28', emoji: '🧢', titulo: 'CHEGARAM OS TÉCNICOS!', texto: 'No Modo Carreira agora seu clube tem TÉCNICO: 105 comandantes com categoria igual à das cartas (👑 Lenda a 🤎 Foi profissional), cada um com o nível dele — que soma no time em toda partida da liga — e com os esquemas que ele usa de verdade. Pra contratar: na janela antes do leilão, aba 🕵️ SONDAR, você marca o técnico que quer e briga por ele no pregão, no envelope, igual jogador. Contrato de 5 temporadas, com salário na folha.' },
  { data: '2026-08-28', emoji: '🎽', titulo: '15 formações — mas quem abre elas é o técnico', texto: 'O jogo passou de 5 pra 15 esquemas (4-2-4, 5-4-1, losango, árvore de Natal, 3-5-2 com alas, líbero e mais) e o campinho ficou maior, com goleiro, zaga e ataque sempre no mesmo lugar. Atenção, que é a parte nova: SEM técnico o time só joga o esquema que ele já treina — quem abre as outras formações é o técnico que você contratar, e quanto maior a categoria dele, mais esquemas ele traz (👑 Lenda traz 5).' },
  { data: '2026-08-27', emoji: '📰', titulo: 'O MARTELO agora sai no Rápido Online', texto: 'Quando a liga (e a Copa) acabam numa sala online, o jornal do jogo fecha a noite: manchete com quem levou a liga e quem levou a Copa, os donos da noite, e uma linha escrita pra CADA técnico da sala — do campeão ao lanterna, passando por quem ficou a uma posição de se classificar. Tem botão pra mandar a capa no grupo como imagem.' },
  { data: '2026-08-27', emoji: '🎁', titulo: 'O pacote do campeão espera você', texto: 'No Rápido, o pacote de carta do campeão não abre mais sozinho quando o tempo acaba: ele fica lacrado até você tocar, pra ninguém perder a hora de ver qual carta saiu. A carta continua sendo sua de qualquer jeito, mesmo se você fechar a tela.' },
  { data: '2026-08-24', emoji: '🅰️', titulo: 'Gols e assistências também no Rápido', texto: 'No Rápido (online e contra a CPU): o campinho do seu time agora mostra os selos de ⚽ gols e 🅰️ assistências em cada jogador — antes o campinho vinha sem número nenhum — e do lado da artilharia nasceu a lista dos 🅰️ Garçons, com quem mais dá passe pro gol na liga.' },
  { data: '2026-08-24', emoji: '🔁', titulo: 'Dá pra trocar os jogadores de lado', texto: 'No Modo Carreira, no campinho do Elenco: toque em dois titulares da mesma posição e eles trocam de lugar — o canhoto vai pra esquerda, o destro pra direita, os dois atacantes invertem. É só a organização do seu campinho: não muda a força do time nem o resultado.' },
  { data: '2026-08-24', emoji: '🅰️', titulo: 'Chegaram as assistências', texto: 'Todo gol agora mostra quem deu o passe — na liga e em QUALQUER copa (Copa Legends, Copa do Brasil, Supercopa e Copa do Mundo). Aparece embaixo do placar, no seu elenco (⚽ e 🅰️ lado a lado) e numa aba nova no Rank com os melhores garçons de cada série. Gol de jogada individual aparece assim mesmo, com todas as letras. Nenhum resultado das suas temporadas mudou.' },
  { data: '2026-08-24', emoji: '📼', titulo: 'O jornal ganhou memória', texto: 'No Modo Carreira: o jornal do fim de temporada agora guarda a história do seu clube e abre a página "O Jornal Lembra" quando ela merece manchete — 3º título seguido, dinastia, o jejum que acabou, a 10ª temporada seguida na Série A, a primeira vez na elite, a primeira Copa. Cada taça (ou seca) vira memória.' },
  { data: '2026-08-23', emoji: '📺', titulo: 'A TV agora paga cota extra pelo seu vídeo', texto: 'No Modo Carreira: a Rede Martelo TV ganhou casa fixa em Clube › Patrocínio — lá dá pra ver quanto o contrato da sua divisão paga por temporada e televisionar seu jogo: grava um vídeo (15s+) da tela jogando, posta no Instagram, TikTok ou YouTube marcando @leilaolegendscom, cola o link e ganha +15 moedas na caixa do clube. Um vídeo por temporada — e, como toda cota de TV, pode atrasar um pouquinho, mas cai.' },
  { data: '2026-08-23', emoji: '🦁', titulo: 'O Império Samambaia virou Leão da Estradinha', texto: 'O dono rebatizou o clube em homenagem ao time do coração dele, o Rio Branco-PR — o Leão da Estradinha de 1913. Escudo, mascote e manto novos (vermelho e branco), mesma vaga na Série A e mesmo elenco. Quem já tinha carreira com o Império Samambaia continua no mesmo time, só com a cara nova.' },
  { data: '2026-08-23', emoji: '🏅', titulo: 'A sala online ganhou estante de troféus', texto: 'No Rápido online: apareceu uma barrinha no rodapé, do jeito da carreira, com o histórico da sala — 🏆 Rank mostra quem lidera somando as temporadas, 🏅 Estante empilha os troféus de cada um (e o Troféu Mico do lanterna) e 📜 Temporadas guarda campeão, campeão da copa e artilheiro de cada partida. Só a galera pontua: bot não entra.' },
  { data: '2026-08-23', emoji: '🐺', titulo: 'Nasceu o Papão United Madrid', texto: 'Mais um clube batizado por apoiador: o Papão United Madrid entra na Série D no lugar do Santos Dumont, com escudo e mascote próprios — O Papão, um lobo chifrudo de faixa azul e branca que carimba a tela quando o time faz gol. O Alfacehh desceu pra Série B e segue com tudo dele. Quem já tinha carreira com o Santos Dumont continua no mesmo time, só com a cara nova.' },
  { data: '2026-08-21', emoji: '🐶', titulo: 'Nasceu o São Luiz FC', texto: 'Mais um clube batizado por apoiador: o São Luiz FC entra na Série D no lugar do Flamengo do Sertão, com escudo e mascote próprios — o Luizão, um pitbull que carimba a tela quando o time faz gol. Quem já tinha carreira com o Flamengo do Sertão continua no mesmo time, só com a cara nova.' },
  { data: '2026-08-21', emoji: '🦇', titulo: 'Nasceu o Theuzudo FC', texto: 'Mais um clube batizado por apoiador: o Theuzudo FC entra na Série B no lugar do Comercial do Norte, com escudo e mascote próprios — o Theuzinho, um morcego laranja e preto que carimba a tela quando o time faz gol. Quem já tinha carreira com o Comercial do Norte continua no mesmo time, só com a cara nova.' },
  { data: '2026-08-21', emoji: '🏆', titulo: 'O fim da temporada virou momento', texto: 'No Modo Carreira: quando a temporada fecha, uma tela conta o que aconteceu com o clube — subiu de divisão, caiu, foi campeão — com a divisão de onde saiu, pra onde vai e o que você levou de prêmio, caixa, patrocínio e torcida.' },
  { data: '2026-08-21', emoji: '🔨', titulo: 'Pregão mais direto', texto: 'No leilão de todos os modos: suas vagas e o dinheiro ficam sempre na barra de cima, as regras do pregão viraram um botão ❓ ali do lado — e quem está começando ganha a explicação inteira no primeiro pregão da partida.' },
  { data: '2026-08-21', emoji: '🧹', titulo: 'Virada de temporada mais limpa', texto: 'No Modo Carreira: a escolha que trava o jogo agora fica sozinha em cima, com o selo "sua vez" — e o que já aconteceu (fechamento do caixa, patrocínio pago) virou uma linha que leva direto pro lugar onde a coisa está inteira.' },
  { data: '2026-08-21', emoji: '🪜', titulo: 'Carreira com menu embaixo', texto: 'No Modo Carreira: Jogos, Tabelas, Elenco, Rank e Clube saíram do meio da página e viraram um menu fixo no rodapé — e dentro do Clube e do Elenco as abas de dentro também param de sumir quando você rola. Role até onde rolar, você troca de aba na hora e continua vendo rodada, posição e caixa numa faixa fina no topo.' },
  { data: '2026-08-21', emoji: '🤝', titulo: 'Patrocínio mais direto', texto: 'No Modo Carreira: a escolha do patrocínio virou dois toques — primeiro a meta da temporada, depois a marca que estampa a camisa — e a tabela de quanto cada divisão paga foi pra aba Clube › Patrocínio.' },
  { data: '2026-08-20', emoji: '🏠', titulo: 'Home nova, com menu embaixo', texto: 'A tela de abertura ficou mais limpa: um menu fixo no rodapé (Início, Regras, Álbum, Ranking, Apoiar) e o passo a passo de como funciona uma partida, pra quem está chegando agora entender o jogo sem precisar perguntar.' },
  { data: '2026-08-20', emoji: '🌎', titulo: 'Libertadores', texto: 'No Rápido (online e contra a CPU): escolha "Liga + Liberta" e, quando a liga acabar, os 8 primeiros entram numa Libertadores de 32 clubes — 8 grupos de 4, passam 2, e a final é jogo único.' },
  { data: '2026-08-17', emoji: '🏅', titulo: 'Ranking agora é por pontos', texto: 'No Modo Carreira: Copa do Mundo vale 200, Copa do Brasil 30, Série A 20, Supercopa 15, B 10, C 5, D 3 e Várzea 1 — quem tem mais título soma mais, e a coluna PTS mostra a conta.' },
  { data: '2026-08-17', emoji: '🌍', titulo: 'Copa do Mundo com 24 seleções', texto: 'No Modo Carreira: entraram Croácia, Dinamarca, Peru e Equador — agora são 4 grupos de 6, e o TOP 24 do ranking de clubes garante vaga.' },
  { data: '2026-08-16', emoji: '🏠', titulo: 'Home nova', texto: 'A tela de abertura mudou: quem já tem carreira continua de cara, e cada botão diz o que você ganha ali.' },
  { data: '2026-08-16', emoji: '🔓', titulo: 'Carreira sem cadastro', texto: 'Dá pra jogar a primeira temporada inteira sem criar conta — o time fica guardado no aparelho.' },
  { data: '2026-08-16', emoji: '🪜', titulo: 'Continuar com esse time', texto: 'No fim da partida rápida, o time que você montou pode virar uma carreira, com a liga inteira junto.' },
  { data: '2026-08-16', emoji: '🏆', titulo: 'Copa do Brasil e Supercopa', texto: 'No Modo Carreira: a Copa virou Copa do Brasil, e o campeão dela encara o campeão da Série A na Supercopa.' },
  { data: '2026-08-08', emoji: '🤝', titulo: 'Duplas (beta)', texto: 'No Rápido Online: chame um amigo pra dividir o comando do MESMO time — cada um manda em 3 das 6 posições.' },
  { data: '2026-08-05', emoji: '💰', titulo: 'Patrocínio virou aposta', texto: 'No Modo Carreira: escolha a meta da temporada (não cair, acesso ou título) e fature de acordo.' },
  { data: '2026-08-04', emoji: '🏥', titulo: 'Departamento Médico', texto: 'No Modo Carreira: a última obra do estádio acaba com as lesões do seu elenco pra sempre.' },
  { data: '2026-08-02', emoji: '🚀', titulo: 'Contratos em massa', texto: 'Venceram vários contratos de uma vez? Renove ou libere TODOS num botão só.' },
  { data: '2026-07-28', emoji: '💰', titulo: 'Finanças do clube', texto: 'No Modo Carreira: extrato de tudo que entra e sai, e o lucro de cada venda.' },
  { data: '2026-07-20', emoji: '💼', titulo: 'SAF', texto: 'No Modo Carreira: compre a SAF de um clube da Série D, leve metade dos lucros dele e empreste jogadores.' },
  { data: '2026-07-12', emoji: '🏟️', titulo: 'Estádio', texto: 'No Modo Carreira: construa arquibancada, refletor, telão e cobertura — o desenho cresce e a bilheteria rende.' },
]

/**
 * As novidades que a HOME mostra — e é isto que faz ela encolher sozinha:
 * só entra o que é recente, e nunca mais que `max`. Novidade velha some sem
 * ninguém precisar apagar nada (era o problema: 17 avisos empilhados pra
 * sempre). O piso de `min` existe só pra tela nunca ficar vazia numa semana
 * parada.
 */
export function novidadesDaVez(hoje = new Date(), dias = 45, max = 5, min = 3): Novidade[] {
  const corte = hoje.getTime() - dias * 86400000
  const recentes = NOVIDADES.filter(n => {
    const t = Date.parse(n.data)
    return Number.isFinite(t) && t >= corte
  })
  const lista = recentes.length >= min ? recentes : NOVIDADES.slice(0, min)
  return lista.slice(0, max)
}

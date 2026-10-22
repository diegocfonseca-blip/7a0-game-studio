// ─── 🎙️ COLETIVA DE IMPRENSA DA CARREIRA (19/10) ───────────────────────────────────────────────────────────────
//
// Pedido do Diego, quando sentiu a galera largando a carreira pelo online: *"quero coisas no modo carreira"* →
// entrevistas, com UMA condição: *"se não tiver variedade não quero… se não tiver histórias e com MUITA variedade
// não quero"*. Mockup aprovado (*"adorei"*): `scripts/mockups/coletiva.png`.
//
// Como funciona, em linguagem de jogo:
//  · A coletiva só acorda quando ACONTECEU algo (clássico, goleada, 5 sem vencer, artilheiro em alta, caixa, Copa…).
//    Nunca todo jogo, nunca segura o jogo: um toque numa das 3 respostas, ou "pular".
//  · 3 estilos de resposta: 😈 provoca · 🧊 diplomata · 🚪 desconversa. Cada um tem um EFEITO pequeno e explicado
//    (rival motivado no clássico, torcida em festa = renda, moral do elenco) e vira MANCHETE no Martelo.
//  · 4 repórteres inventados com mania própria (ninguém de verdade — regra do 18/08).
//  · Variedade: cada situação tem 3+ perguntas e cada estilo 3+ frases, PT e EN com a MESMA contagem (sorteio por
//    índice). A mesma frase não repete na mesma temporada (`usadas`); esgotou, libera de novo.
//  · Promessa feita na coletiva VOLTA: no fim da temporada vira "prometeu e cumpriu"/"prometeu e…".
//  · Pular também conta história: 3 pulos seguidos acordam o Rogério ("sumiu da imprensa?") e a fama vira "O Mudo".
//  · 🔥 ARQUIRRIVAL: um só, escolhido entre os rivais da carreira (quem mais te enfrentou / está na sua divisão).
//    É ele que faz a coletiva falar em "clássico". Trocável só na virada de temporada.
//
// Este arquivo é PURO (sem React, sem estado): quem liga é o store (efeito/save) e a tela (pyramidseason).
// Trava: `npm run coletiva` (scripts/testa-coletiva.mts).
import { getLang } from './lang'

export type Par = [pt: string, en: string]
export type Estilo = 'provoca' | 'diplomata' | 'desconversa'
export const ESTILOS: Estilo[] = ['provoca', 'diplomata', 'desconversa']
export type ReporterId = 'rogerio' | 'clarice' | 'tiao' | 'mila'
export interface Reporter { id: ReporterId; nome: string; veiculo: Par; mania: Par; cor: string; inicial: string }
export const REPORTERES: Record<ReporterId, Reporter> = {
  rogerio: { id: 'rogerio', nome: 'Rogério Provoca', veiculo: ['Rádio Pregão', 'Pregão Radio'], mania: ['só quer briga: rival, promessa, cobrança', 'only wants a fight: rivals, promises, pressure'], cor: '#C2452F', inicial: 'R' },
  clarice: { id: 'clarice', nome: 'Clarice Planilha', veiculo: ['Jornal do Caixa', 'The Ledger'], mania: ['dinheiro, salário, patrocínio, SAF', 'money, wages, sponsors, ownership'], cor: '#1B7A3D', inicial: 'C' },
  tiao: { id: 'tiao', nome: 'Tião Puxa-Saco', veiculo: ['TV Legends', 'TV Legends'], mania: ['elogia tudo, pergunta de sonho e título', 'praises everything, asks about dreams and titles'], cor: '#FFC400', inicial: 'T' },
  mila: { id: 'mila', nome: 'Mila Vestiário', veiculo: ['Blog Bastidores', 'Locker Room Blog'], mania: ['jogador cansado, lesão, reserva reclamando', 'tired players, injuries, benched players moaning'], cor: '#7C3AED', inicial: 'M' },
}

// ── efeito da resposta (pequeno, sempre explicado na tela) ──────────────────────────────────────────────────────
export type EfeitoTipo = 'rival_motivado' | 'renda' | 'moral_alta' | 'moral_baixa' | 'cobranca' | 'nenhum'
export interface Efeito { tipo: EfeitoTipo; valor: number; txt: Par }
// valores: moral ±2 de força (atk e def) no PRÓXIMO jogo · renda = 10% da bilheteria de um jogo, já no caixa · rival = −3 de força
// SUA no próximo clássico (o motor só modifica o humano; "rival +3" e "você −3" dão no mesmo, e a tela diz a verdade)
const EF: Record<string, Efeito> = {
  rival: { tipo: 'rival_motivado', valor: 3, txt: ['🔥 Rival motivado: o próximo clássico fica mais duro (−3 de força sua nele)', '🔥 Rival fired up: the next derby gets harder (−3 strength for you in it)'] },
  renda: { tipo: 'renda', valor: 10, txt: ['📣 Torcida em festa: +10% de bilheteria (já no caixa)', '📣 Fans buzzing: +10% gate money (already in the till)'] },
  moralMais: { tipo: 'moral_alta', valor: 2, txt: ['💪 Elenco gostou: +2 de força no próximo jogo', '💪 Squad liked it: +2 strength in the next match'] },
  moralMenos: { tipo: 'moral_baixa', valor: 2, txt: ['😶 Vestiário sentiu: −2 de força no próximo jogo', '😶 Locker room felt it: −2 strength in the next match'] },
  cobranca: { tipo: 'cobranca', valor: 0, txt: ['🎙️ A imprensa vai cobrar essa frase', '🎙️ The press will hold you to that line'] },
  nada: { tipo: 'nenhum', valor: 0, txt: ['— sem efeito no jogo', '— no effect on the game'] },
}

export type Promessa = 'titulo' | 'subir' | 'nao_cair' | 'copa' | 'classico'
interface Resposta { txt: Par; promessa?: Promessa }
export type SituacaoId =
  | 'goleada_pro' | 'goleada_contra' | 'vitoria_rival' | 'derrota_rival' | 'empate_rival' | 'seca' | 'embalo' | 'virada'
  | 'artilheiro' | 'goleiro_penalti' | 'zaga_furada' | 'craque_cansado' | 'lesao' | 'cria_estreou' | 'reserva_reclamando'
  | 'pressao_tecnico' | 'vai_subir' | 'vai_cair' | 'lider' | 'copa_final' | 'copa_eliminado' | 'copa_campeao'
  | 'caixa_cheio' | 'caixa_vazio' | 'proposta_craque' | 'patrocinador_cobrando' | 'classico_proximo'
  | 'internacional' | 'copa_mundo' | 'bola_ouro' | 'marco_temporada' | 'ultima_rodada' | 'estreia_temporada'
  | 'vespera_final' | 'vespera_classico' | 'fuga'
  | 'zero_a_zero' | 'vitoria_magra' | 'jogo_maluco' | 'vitoria_fora' | 'derrota_casa' | 'muralha'
  | 'meio_temporada' | 'temporada_morna' | 'lanterna' | 'vice_lider' | 'pobre_mas_feliz' | 'varzea'
  | 'apresentacao_uma' | 'apresentacao_varias'

// o que a coletiva precisa saber da rodada (quem monta é o store/tela; tudo opcional menos o básico)
export interface Ctx {
  rodada: number; totalRodadas: number; temporada: number; div: string; clube: string
  placar?: { gf: number; ga: number; adv: string; casa: boolean; virada: boolean; arquirrival: boolean }
  semVencer: number; vitoriasSeguidas: number
  pos: number; total: number; zonaSubir: boolean; zonaCair: boolean; lider: boolean
  artilheiro?: { nome: string; gols: number }
  goleiroPenalti?: string; jogosSofrendo?: number
  cansado?: string; lesionado?: string; criaEstreou?: string; reserva?: string
  caixa: number; caixaAlto: boolean; caixaBaixo: boolean
  proposta?: { nome: string; valor: number; clube: string }
  patrocinadorCobrando?: boolean
  proximoClassico?: boolean; rival?: string
  copa?: 'final' | 'eliminado' | 'campeao'
  intl?: 'liberta' | 'champions' | 'mundial'; mundo?: boolean
  bolaOuro?: string
  /** ⭐ APRESENTAÇÃO (22/10): as LENDAS que o leilão acabou de trazer (nomes). Só existe no momento da apresentação. */
  apresentacao?: string[]
  vespera?: 'final' | 'classico'
  pulosSeguidos: number
}

interface Situacao {
  id: SituacaoId; rep: ReporterId[]; prioridade: 1 | 2 | 3; dinheiro?: boolean
  quando: (c: Ctx) => boolean
  perguntas: Par[]
  respostas: Record<Estilo, Resposta[]>
  efeito: Record<Estilo, Efeito>
  manchete: Record<Estilo, Par[]>
}

const meio = (c: Ctx) => c.rodada >= Math.floor(c.totalRodadas / 2)
const venceu = (c: Ctx) => !!c.placar && c.placar.gf > c.placar.ga
const perdeu = (c: Ctx) => !!c.placar && c.placar.gf < c.placar.ga
const r = (txt: Par, promessa?: Promessa): Resposta => (promessa ? { txt, promessa } : { txt })

// ── O BANCO ─────────────────────────────────────────────────────────────────────────────────────────────────────
// Placeholders: {adv} adversário · {n} jogador · {g} gols · {pos} posição · {div} divisão · {seq} sequência ·
// {rival} arquirrival · {clube} seu clube · {valor} moedas · {temp} temporada · {gf}/{ga} placar · {comp} competição
export const SITUACOES: Situacao[] = [
  {
    id: 'goleada_pro', rep: ['rogerio', 'tiao'], prioridade: 2,
    quando: c => !!c.placar && c.placar.gf - c.placar.ga >= 3 && !c.placar.arquirrival,
    perguntas: [
      ['Presidente, {gf} a {ga} no {adv}. Foi o time que cresceu ou eles que entregaram?', 'Mr. President, {gf}–{ga} against {adv}. Did your side grow or did they simply give up?'],
      ['Goleada dessas assusta a concorrência ou é só um dia bom?', 'Does a thrashing like this scare the rest or was it just a good day?'],
      ['Que show! Dá pra dizer que esse é o melhor {clube} dos últimos tempos?', 'What a show! Can we say this is the best {clube} in years?'],
    ],
    respostas: {
      provoca: [r(['Entregaram? O {adv} entrou em campo, só não conseguiu sair.', 'Gave up? {adv} walked onto the pitch, they just couldn’t find the way out.']), r(['Se a concorrência assustou, imagina quando a gente acordar de verdade.', 'If the rest got scared, imagine when we actually wake up.']), r(['Dia bom é todo dia que a gente joga. Pro adversário é que foi um dia ruim.', 'Every day we play is a good day. It was a bad day for the opponent.'])],
      diplomata: [r(['Placar grande engana. Teve mérito nosso e um dia difícil deles.', 'Big scorelines deceive. There was merit on our side and a tough day on theirs.']), r(['Vitória importante, mas segunda-feira o jogo começa do zero.', 'Important win, but Monday the score goes back to zero.']), r(['Respeito total ao {adv}. Hoje a bola entrou, outros dias ela não entra.', 'Full respect to {adv}. Today the ball went in; other days it doesn’t.'])],
      desconversa: [r(['Goleada é assunto pros jogadores. Eu cuido do resto.', 'Thrashings are a matter for the players. I handle the rest.']), r(['Já tô pensando na próxima rodada. Pergunta sobre ela?', 'I’m already thinking about next round. Any questions on that?']), r(['Falo de resultado no fim da temporada. Um jogo não diz nada.', 'I talk results at the end of the season. One match says nothing.'])],
    },
    efeito: { provoca: EF.cobranca, diplomata: EF.renda, desconversa: EF.nada },
    manchete: {
      provoca: [['"{frase}": presidente do {clube} debocha do {adv} após goleada', '"{frase}": {clube} president mocks {adv} after thrashing'], ['Goleada e deboche: {clube} não poupa o {adv} na coletiva', 'Thrashing and mockery: {clube} spares {adv} nothing at the presser']],
      diplomata: [['Pés no chão: {clube} goleia e presidente pede calma', 'Feet on the ground: {clube} win big and president asks for calm'], ['"{frase}": presidente do {clube} respeita o {adv} mesmo após {gf} a {ga}', '"{frase}": {clube} president respects {adv} even after {gf}–{ga}']],
      desconversa: [['Presidente do {clube} foge do assunto goleada', '{clube} president dodges the thrashing talk'], ['{gf} a {ga} e nenhuma palavra: presidente do {clube} despacha a imprensa', '{gf}–{ga} and not a word: {clube} president shoos the press away']],
    },
  },
  {
    id: 'goleada_contra', rep: ['rogerio', 'mila'], prioridade: 2,
    quando: c => !!c.placar && c.placar.ga - c.placar.gf >= 3 && !c.placar.arquirrival,
    perguntas: [
      ['{ga} a {gf}. Presidente, alguém vai pagar a conta dessa goleada?', '{ga}–{gf}. Mr. President, is anyone paying for this thrashing?'],
      ['O vestiário tá rachado depois de hoje? Ouvi gritos lá dentro.', 'Is the locker room split after today? I heard shouting in there.'],
      ['Foi vexame ou foi acidente? A torcida quer saber qual dos dois.', 'Was it a disgrace or an accident? The fans want to know which.'],
    ],
    respostas: {
      provoca: [r(['Quem paga a conta é o {adv}, na volta. Anota aí.', '{adv} will pay the bill in the return game. Write it down.']), r(['Gritos? Era eu cantando pra animar. Semana que vem canto mais alto.', 'Shouting? That was me singing to lift them. Next week I’ll sing louder.']), r(['Acidente. E acidente a gente conserta na oficina, não na imprensa.', 'An accident. And accidents get fixed in the workshop, not in the press.'])],
      diplomata: [r(['A conta é minha. Eu monto o time, eu respondo por ele.', 'The bill is mine. I build the team, I answer for it.']), r(['Dia pra esquecer. O grupo está unido e vai responder em campo.', 'A day to forget. The group is united and will answer on the pitch.']), r(['Nem vexame nem acidente: foi um jogo ruim. Acontece com todo mundo.', 'Neither disgrace nor accident: a bad game. Happens to everyone.'])],
      desconversa: [r(['Não vou falar de placar hoje. Obrigado a todos.', 'Not talking about the score today. Thank you all.']), r(['O que acontece no vestiário fica no vestiário.', 'What happens in the locker room stays in the locker room.']), r(['Próxima pergunta, por favor. Essa eu passo.', 'Next question, please. I’ll pass on that one.'])],
    },
    efeito: { provoca: EF.cobranca, diplomata: EF.moralMais, desconversa: EF.moralMenos },
    manchete: {
      provoca: [['Toma {ga}, promete troco: "{frase}"', 'Takes {ga}, promises payback: "{frase}"'], ['Presidente do {clube} bate boca com a imprensa após vexame', '{clube} president trades barbs with the press after the humiliation']],
      diplomata: [['"{frase}": presidente do {clube} assume a goleada', '"{frase}": {clube} president owns the thrashing'], ['{clube} apanha, presidente segura a barra do grupo', '{clube} take a beating, president shields the group']],
      desconversa: [['Silêncio após {ga} a {gf}: presidente do {clube} não responde', 'Silence after {ga}–{gf}: {clube} president has no answer'], ['Dia de goleada é dia de coletiva curta no {clube}', 'Thrashing day means a short presser at {clube}']],
    },
  },
  {
    id: 'vitoria_rival', rep: ['rogerio', 'tiao'], prioridade: 3,
    quando: c => venceu(c) && !!c.placar?.arquirrival,
    perguntas: [
      ['Presidente, {gf} a {ga} no {rival} e o lado de lá disse que vocês tiveram sorte. Vai deixar passar?', 'Mr. President, {gf}–{ga} against {rival} and their side said you got lucky. Letting that slide?'],
      ['Clássico é clássico. Esse hoje vale uma temporada inteira?', 'A derby is a derby. Is today’s worth a whole season?'],
      ['Que vitória! Já pode dizer que o {clube} é o dono da cidade?', 'What a win! Can we say {clube} own the city now?'],
    ],
    respostas: {
      provoca: [r(['Sorte? A gente treina sorte segunda, quarta e sexta.', 'Luck? We train luck on Mondays, Wednesdays and Fridays.']), r(['Vale uma temporada pra eles. Pra nós é só mais um clássico ganho.', 'Worth a season for them. For us it’s just another derby won.']), r(['Dono da cidade a gente sempre foi. Hoje só renovamos a escritura.', 'We’ve always owned the city. Today we just renewed the deed.'])],
      diplomata: [r(['Respeito o {rival}. Hoje fomos melhores, só isso.', 'I respect {rival}. Today we were better, that’s all.']), r(['Clássico vale três pontos como qualquer jogo. A emoção é que é diferente.', 'A derby is worth three points like any game. The emotion is what differs.']), r(['A cidade é grande pros dois. Hoje ela amanhece com a nossa cor.', 'The city is big enough for both. Today it wakes up in our colours.'])],
      desconversa: [r(['Não vou responder atacante. Pergunta de futebol?', 'I won’t answer a striker. Any football questions?']), r(['Clássico acabou no apito. Agora é o próximo jogo.', 'The derby ended at the whistle. Now it’s the next game.']), r(['Prefiro que a torcida fale por mim hoje.', 'I’d rather the fans speak for me today.'])],
    },
    efeito: { provoca: EF.rival, diplomata: EF.renda, desconversa: EF.nada },
    manchete: {
      provoca: [['"{frase}": presidente do {clube} cutuca o {rival}', '"{frase}": {clube} president pokes {rival}'], ['Clássico ganho e boca aberta: {clube} provoca o {rival}', 'Derby won and mouth open: {clube} taunt {rival}']],
      diplomata: [['Vence o clássico e respeita o {rival}: "{frase}"', 'Wins the derby and respects {rival}: "{frase}"'], ['{clube} leva o clássico com discurso de campeão', '{clube} take the derby with a champion’s speech']],
      desconversa: [['Clássico ganho, presidente do {clube} prefere o silêncio', 'Derby won, {clube} president prefers silence'], ['"{frase}": {clube} não entra na provocação do {rival}', '"{frase}": {clube} don’t take {rival}’s bait']],
    },
  },
  {
    id: 'derrota_rival', rep: ['rogerio', 'mila'], prioridade: 3,
    quando: c => perdeu(c) && !!c.placar?.arquirrival,
    perguntas: [
      ['Perdeu pro {rival} em casa. A torcida já pede a sua cabeça. Resposta?', 'Lost to {rival}. The fans are already asking for your head. Your answer?'],
      ['O {rival} disse que foi passeio. Doeu?', '{rival} said it was a stroll. Did that hurt?'],
      ['Ouvi que teve bronca no vestiário depois do clássico. Quem levou?', 'I heard there was a dressing-down after the derby. Who got it?'],
    ],
    respostas: {
      provoca: [r(['Minha cabeça fica. A do {rival} vai rolar no jogo de volta.', 'My head stays. {rival}’s will roll in the return game.'], 'classico'), r(['Passeio? Então que aproveitem. O parque fecha na volta.', 'A stroll? Let them enjoy it. The park closes for the return.'], 'classico'), r(['Bronca levou quem mereceu. O {rival} vai levar a dele em campo.', 'Whoever deserved it got it. {rival} will get theirs on the pitch.'])],
      diplomata: [r(['Torcida tem razão de cobrar. Eu também cobro. Vamos dar a volta por cima.', 'The fans are right to demand. So do I. We’ll bounce back.']), r(['Doeu como dói em todo torcedor. Agora é trabalhar.', 'It hurt like it hurts every fan. Now it’s work.']), r(['Conversa de vestiário é normal. Perdeu, conversa. Ganhou, comemora.', 'Locker room talk is normal. Lose, you talk. Win, you celebrate.'])],
      desconversa: [r(['Não falo de clássico perdido. Só de clássico ganho.', 'I don’t talk about lost derbies. Only won ones.']), r(['O {rival} falou? Não ouvi. Tava ocupado trabalhando.', '{rival} said something? Didn’t hear. I was busy working.']), r(['Bronca é assunto interno. Próxima.', 'Dressing-downs are internal. Next.'])],
    },
    efeito: { provoca: EF.cobranca, diplomata: EF.moralMais, desconversa: EF.moralMenos },
    manchete: {
      provoca: [['Perde o clássico e promete troco: "{frase}"', 'Loses the derby and promises payback: "{frase}"'], ['Presidente do {clube} compra briga com o {rival} mesmo derrotado', '{clube} president picks a fight with {rival} even in defeat']],
      diplomata: [['"{frase}": presidente do {clube} assume a derrota no clássico', '"{frase}": {clube} president owns the derby defeat'], ['{clube} perde o clássico e presidente segura o grupo', '{clube} lose the derby, president holds the group together']],
      desconversa: [['Clássico perdido e coletiva de 40 segundos no {clube}', 'Derby lost and a 40-second presser at {clube}'], ['Presidente do {clube} não quis falar do {rival}', '{clube} president refused to talk about {rival}']],
    },
  },
  {
    id: 'empate_rival', rep: ['rogerio'], prioridade: 2,
    quando: c => !!c.placar && c.placar.gf === c.placar.ga && c.placar.arquirrival,
    perguntas: [
      ['Empate no clássico. Gosto de pouco ou alívio?', 'A draw in the derby. Bitter taste or relief?'],
      ['O {rival} saiu comemorando o empate. Isso diz algo sobre quem é maior?', '{rival} left celebrating the draw. Does that say who’s bigger?'],
      ['Clássico sem vencedor. A torcida vai dormir tranquila?', 'A derby with no winner. Will the fans sleep easy?'],
    ],
    respostas: {
      provoca: [r(['Se eles comemoram empate, imagina o que fazem quando ganham: feriado.', 'If they celebrate a draw, imagine when they win: a public holiday.']), r(['Diz tudo. Quem comemora empate já sabe o lugar dele.', 'It says it all. Whoever celebrates a draw knows their place.']), r(['Dorme tranquila. Quem não dorme é o {rival}, pensando na volta.', 'They’ll sleep fine. {rival} won’t, thinking about the return.'])],
      diplomata: [r(['Clássico equilibrado, resultado justo. Segue o jogo.', 'A balanced derby, a fair result. On we go.']), r(['Cada um comemora o que quer. Eu olho a tabela.', 'Everyone celebrates what they want. I look at the table.']), r(['Ponto fora de casa num clássico nunca é ruim.', 'A point away in a derby is never bad.'])],
      desconversa: [r(['Empate é empate. Não tem muito o que dizer.', 'A draw is a draw. Not much to say.']), r(['Não acompanho o que o {rival} faz depois do jogo.', 'I don’t follow what {rival} do after the game.']), r(['Pergunta pra torcida. Eu só assisti.', 'Ask the fans. I only watched.'])],
    },
    efeito: { provoca: EF.rival, diplomata: EF.nada, desconversa: EF.nada },
    manchete: {
      provoca: [['"{frase}": presidente do {clube} ironiza festa do {rival} pelo empate', '"{frase}": {clube} president mocks {rival}’s party over a draw'], ['Empate no clássico vira guerra de palavras entre {clube} e {rival}', 'Derby draw turns into a war of words between {clube} and {rival}']],
      diplomata: [['Clássico empatado e discurso sereno no {clube}', 'Derby drawn and a calm speech at {clube}'], ['"{frase}": presidente do {clube} aceita o empate', '"{frase}": {clube} president accepts the draw']],
      desconversa: [['Empate e pouca conversa: coletiva rápida no {clube}', 'A draw and little talk: quick presser at {clube}'], ['Presidente do {clube} não entra no clima do clássico', '{clube} president stays out of the derby mood']],
    },
  },
  {
    id: 'seca', rep: ['rogerio', 'mila'], prioridade: 3,
    quando: c => c.semVencer >= 5,
    perguntas: [
      ['{seq} jogos sem vencer, presidente. Em que momento vira crise?', '{seq} games without a win, Mr. President. When does it become a crisis?'],
      ['O vestiário ainda acredita no projeto ou já tem gente olhando o celular?', 'Does the locker room still believe in the project or are people checking their phones?'],
      ['Se não ganhar na próxima, cai alguém?', 'If you don’t win the next one, does someone go?'],
    ],
    respostas: {
      provoca: [r(['Crise é quem usa essa palavra. A gente usa trabalho.', 'Crisis is a word for people who use it. We use work.']), r(['Celular? Eu recolho na porta. Lá dentro só tem bola.', 'Phones? I collect them at the door. Inside there’s only football.']), r(['Cai alguém sim: o próximo adversário.', 'Someone goes down, yes: the next opponent.'])],
      diplomata: [r(['Crise é não saber o que fazer. A gente sabe, só falta a bola entrar.', 'A crisis is not knowing what to do. We know, the ball just has to go in.']), r(['O grupo está incomodado, e isso é bom sinal. Quem não se incomoda não reage.', 'The group is bothered, and that’s a good sign. Who isn’t bothered doesn’t react.']), r(['Não trabalho com ultimato. Trabalho com planejamento.', 'I don’t work with ultimatums. I work with planning.'])],
      desconversa: [r(['Sequência é número. Eu não comento número.', 'Streaks are numbers. I don’t comment on numbers.']), r(['Vestiário é assunto interno.', 'The locker room is internal business.']), r(['Vamos falar da próxima partida quando ela chegar.', 'We’ll talk about the next match when it arrives.'])],
    },
    efeito: { provoca: EF.cobranca, diplomata: EF.moralMais, desconversa: EF.moralMenos },
    manchete: {
      provoca: [['"{frase}": {seq} jogos sem vencer e presidente do {clube} desafia a crítica', '"{frase}": {seq} winless games and {clube} president defies the critics'], ['Presidente do {clube} nega crise na marra', '{clube} president denies the crisis, loudly']],
      diplomata: [['{clube} vive seca de {seq} jogos e presidente pede confiança', '{clube} endure a {seq}-game drought and president asks for trust'], ['"{frase}": presidente do {clube} banca o grupo na má fase', '"{frase}": {clube} president backs the group through the slump']],
      desconversa: [['{seq} sem vencer e presidente do {clube} não quer falar de número', '{seq} without a win and {clube} president won’t talk numbers'], ['Má fase no {clube} e coletiva no automático', 'Bad spell at {clube} and a presser on autopilot']],
    },
  },
  {
    id: 'embalo', rep: ['tiao'], prioridade: 2,
    quando: c => c.vitoriasSeguidas >= 5,
    perguntas: [
      ['{seq} vitórias seguidas! Presidente, esse time tem teto?', '{seq} wins in a row! Mr. President, does this team have a ceiling?'],
      ['A torcida já fala em título. O senhor também?', 'The fans are already talking title. Are you?'],
      ['Qual é o segredo dessa sequência? Pode contar pra TV Legends?', 'What’s the secret of this run? Can you tell TV Legends?'],
    ],
    respostas: {
      provoca: [r(['Teto? A gente mora na cobertura. Quem tem teto é o resto.', 'Ceiling? We live in the penthouse. The rest have ceilings.']), r(['Título? Pode falar. Eu já encomendei a faixa.', 'Title? Go ahead. I’ve already ordered the sash.'], 'titulo'), r(['O segredo é o {rival} ter ficado olhando a gente passar.', 'The secret is {rival} standing there watching us go by.'])],
      diplomata: [r(['Teto é a próxima partida. Depois a gente vê o próximo.', 'The ceiling is the next match. Then we look at the next one.']), r(['Título se fala em maio. Agora é pé no chão e bola na rede.', 'Titles are for May. Now it’s feet on the ground and ball in the net.']), r(['Não tem segredo: elenco unido e dever de casa feito.', 'No secret: a united squad and homework done.'])],
      desconversa: [r(['Sequência boa a gente não comenta, senão quebra. Superstição.', 'You don’t comment on a good run or you jinx it. Superstition.']), r(['Título a torcida pode falar. Eu não.', 'Fans can talk title. I can’t.']), r(['Segredo é segredo. Se contar, deixa de ser.', 'A secret is a secret. Tell it and it isn’t one.'])],
    },
    efeito: { provoca: EF.cobranca, diplomata: EF.renda, desconversa: EF.nada },
    manchete: {
      provoca: [['"{frase}": presidente do {clube} já fala em faixa', '"{frase}": {clube} president already talking sashes'], ['{seq} vitórias e muita confiança: {clube} se vê na frente de todos', '{seq} wins and plenty of swagger: {clube} see themselves ahead of everyone']],
      diplomata: [['{seq} seguidas e pé no chão: "{frase}"', '{seq} in a row and feet on the ground: "{frase}"'], ['{clube} embala e presidente evita falar em título', '{clube} on a roll and president avoids title talk']],
      desconversa: [['Superstição: presidente do {clube} não comenta sequência', 'Superstition: {clube} president won’t discuss the run'], ['{seq} vitórias e boca fechada no {clube}', '{seq} wins and lips sealed at {clube}']],
    },
  },
  {
    id: 'virada', rep: ['tiao', 'mila'], prioridade: 2,
    quando: c => venceu(c) && !!c.placar?.virada && !c.placar.arquirrival,
    perguntas: [
      ['Que virada! O que o senhor disse no intervalo?', 'What a comeback! What did you say at half-time?'],
      ['Tava perdendo e virou. Foi coração ou foi tática?', 'You were losing and turned it around. Heart or tactics?'],
      ['O {adv} reclamou que relaxou. O senhor concorda?', '{adv} complained they relaxed. Do you agree?'],
    ],
    respostas: {
      provoca: [r(['Disse que quem perdesse pagava a pizza. Eles entenderam rápido.', 'I said whoever lost would pay for the pizza. They understood quickly.']), r(['Foi coração. Tática o {adv} tinha e não adiantou nada.', 'It was heart. {adv} had tactics and it did them no good.']), r(['Relaxou? Então relaxa de novo na volta, por favor.', 'Relaxed? Then please relax again in the return.'])],
      diplomata: [r(['Pedi calma. O time sabia que dava, só precisava acreditar.', 'I asked for calm. The team knew it was possible, they just had to believe.']), r(['Um pouco dos dois. Coração pra correr, cabeça pra acertar.', 'A bit of both. Heart to run, head to get it right.']), r(['Cada um analisa o seu lado. Eu analiso o nosso: reagimos bem.', 'Everyone analyses their own side. I analyse ours: we reacted well.'])],
      desconversa: [r(['Intervalo é dos jogadores e da comissão. Eu só torço.', 'Half-time belongs to the players and staff. I just cheer.']), r(['Virou, tá virado. O resto é detalhe.', 'It turned, it’s turned. The rest is detail.']), r(['Não ouvi a reclamação do {adv}.', 'Didn’t hear {adv}’s complaint.'])],
    },
    efeito: { provoca: EF.cobranca, diplomata: EF.renda, desconversa: EF.nada },
    manchete: {
      provoca: [['Virada e deboche: "{frase}"', 'Comeback and mockery: "{frase}"'], ['Presidente do {clube} zoa o {adv} depois da virada', '{clube} president ribs {adv} after the comeback']],
      diplomata: [['"{frase}": a receita da virada do {clube}', '"{frase}": the recipe for {clube}’s comeback'], ['{clube} vira o jogo e presidente exalta o grupo', '{clube} turn the game around and president praises the group']],
      desconversa: [['Virada histórica e presidente do {clube} entrega o mérito ao vestiário', 'Historic comeback and {clube} president hands the credit to the locker room'], ['"{frase}": presidente do {clube} fala pouco após a virada', '"{frase}": {clube} president says little after the comeback']],
    },
  },
  {
    id: 'artilheiro', rep: ['tiao', 'rogerio'], prioridade: 1,
    quando: c => !!c.artilheiro && c.artilheiro.gols >= 10 && venceu(c),
    perguntas: [
      ['{n} já tem {g} gols. É o melhor jogador que passou pelo {clube}?', '{n} already has {g} goals. Is he the best player ever at {clube}?'],
      ['Com {g} gols do {n}, o time depende demais de um homem só?', 'With {n}’s {g} goals, does the team depend too much on one man?'],
      ['O {n} vai renovar ou vai pro leilão? A Europa tá de olho.', 'Is {n} renewing or going to auction? Europe is watching.'],
    ],
    respostas: {
      provoca: [r(['Melhor? Ele ainda nem começou a jogar sério.', 'Best? He hasn’t even started playing seriously.']), r(['Depende de um homem só? O resto do time também joga. Vai contar os gols deles.', 'Depend on one man? The rest of the team plays too. Go count their goals.']), r(['A Europa pode olhar. Tocar, só com a minha autorização.', 'Europe can look. Touching requires my permission.'])],
      diplomata: [r(['É um grande momento dele, e do time que serve ele.', 'It’s a great moment for him, and for the team that serves him.']), r(['Gol é consequência de time. {n} finaliza o trabalho de todos.', 'Goals come from the team. {n} finishes everyone’s work.']), r(['Contrato se resolve na mesa, no tempo certo.', 'Contracts get sorted at the table, at the right time.'])],
      desconversa: [r(['Comparação é coisa de torcedor. Eu só agradeço os gols.', 'Comparisons are for fans. I just thank him for the goals.']), r(['Não comento dependência. Comento vitória.', 'I don’t comment on dependence. I comment on wins.']), r(['Leilão é assunto da janela. Hoje é dia de jogo.', 'Auctions are a window matter. Today is match day.'])],
    },
    efeito: { provoca: EF.moralMais, diplomata: EF.moralMais, desconversa: EF.nada },
    manchete: {
      provoca: [['"{frase}": presidente do {clube} blinda {n}', '"{frase}": {clube} president shields {n}'], ['{n} com {g} gols e presidente do {clube} aumenta a aposta', '{n} on {g} goals and {clube} president raises the stakes']],
      diplomata: [['Presidente do {clube} divide os {g} gols de {n} com o elenco', '{clube} president shares {n}’s {g} goals with the squad'], ['"{frase}": {clube} celebra {n} sem perder a linha', '"{frase}": {clube} celebrate {n} without losing composure']],
      desconversa: [['{n} brilha e presidente do {clube} evita comparações', '{n} shines and {clube} president avoids comparisons'], ['Futuro de {n}? Presidente do {clube} muda de assunto', '{n}’s future? {clube} president changes the subject']],
    },
  },
  {
    id: 'goleiro_penalti', rep: ['mila', 'tiao'], prioridade: 1,
    quando: c => !!c.goleiroPenalti && !perdeu(c),
    perguntas: [
      ['{n} pegou pênalti hoje. Ele é o verdadeiro craque desse time?', '{n} saved a penalty today. Is he the real star of this team?'],
      ['Goleiro decidindo jogo é mérito dele ou falha do ataque?', 'A keeper deciding games: credit to him or a failing of the attack?'],
      ['O {n} estudou o batedor? Ou foi chute?', 'Did {n} study the taker? Or was it a guess?'],
    ],
    respostas: {
      provoca: [r(['Craque é ele, sim. Os outros dez estão em período de experiência.', 'He’s the star, yes. The other ten are on probation.']), r(['Falha do ataque é do adversário, que não acertou o gol.', 'The failing attack was the opponent’s, they missed the goal.']), r(['Estudou. O batedor é que não estudou o {n}.', 'He studied. The taker is the one who didn’t study {n}.'])],
      diplomata: [r(['Goleiro grande é metade do time. {n} é grande.', 'A great keeper is half the team. {n} is great.']), r(['Mérito dele, sem tirar do ataque. Todo mundo fez a parte.', 'Credit to him, without taking from the attack. Everyone did their part.']), r(['Trabalho de semana inteira. Nada é chute aqui.', 'A whole week’s work. Nothing is a guess here.'])],
      desconversa: [r(['Pergunta pro {n}. Ele que pegou.', 'Ask {n}. He saved it.']), r(['Não separo o time em pedaços.', 'I don’t split the team into pieces.']), r(['Isso é detalhe técnico. Não me cabe.', 'That’s a technical detail. Not for me.'])],
    },
    efeito: { provoca: EF.moralMais, diplomata: EF.moralMais, desconversa: EF.nada },
    manchete: {
      provoca: [['"{frase}": presidente do {clube} coroa o goleiro {n}', '"{frase}": {clube} president crowns keeper {n}'], ['Pênalti defendido e piada na coletiva do {clube}', 'Penalty saved and a joke at {clube}’s presser']],
      diplomata: [['{n} pega pênalti e presidente do {clube} fala em time completo', '{n} saves a penalty and {clube} president talks about a complete team'], ['"{frase}": elogio a {n} no {clube}', '"{frase}": praise for {n} at {clube}']],
      desconversa: [['Presidente do {clube} manda perguntar pro goleiro', '{clube} president says ask the keeper'], ['Dia de {n} e coletiva curta no {clube}', '{n}’s day and a short presser at {clube}']],
    },
  },
  {
    id: 'zaga_furada', rep: ['rogerio'], prioridade: 1,
    quando: c => (c.jogosSofrendo ?? 0) >= 3,
    perguntas: [
      ['Três jogos tomando gol de monte. A zaga do {clube} é feita de papel?', 'Three games conceding in bunches. Is {clube}’s defence made of paper?'],
      ['Vai pro leilão atrás de zagueiro ou vai rezar?', 'Going to the auction for a defender or going to pray?'],
      ['O goleiro já reclamou da defesa? Eu reclamaria.', 'Has the keeper complained about the defence yet? I would.'],
    ],
    respostas: {
      provoca: [r(['Papel? Então foi papel que segurou o {adv} no segundo tempo.', 'Paper? Then it was paper that held {adv} in the second half.']), r(['Vou ao leilão, e vou comprar o melhor zagueiro antes de todo mundo.', 'I’m going to the auction, and I’m buying the best defender before anyone.']), r(['O goleiro reclamou de você, não da defesa.', 'The keeper complained about you, not the defence.'])],
      diplomata: [r(['A defesa é o time inteiro. Vamos ajustar coletivamente.', 'Defence is the whole team. We’ll adjust collectively.']), r(['Toda opção está na mesa, inclusive reforço.', 'Every option is on the table, including signings.']), r(['Goleiro e zaga conversam toda semana. É assim que se melhora.', 'Keeper and defence talk every week. That’s how you improve.'])],
      desconversa: [r(['Gol sofrido faz parte do jogo.', 'Conceding is part of the game.']), r(['Leilão eu comento na janela.', 'I’ll comment on auctions in the window.']), r(['Conversa de vestiário não sai daqui.', 'Locker room talk stays here.'])],
    },
    efeito: { provoca: EF.cobranca, diplomata: EF.moralMais, desconversa: EF.nada },
    manchete: {
      provoca: [['"{frase}": presidente do {clube} rebate crítica à defesa', '"{frase}": {clube} president fires back at defence critics'], ['Zaga vazada e presidente do {clube} promete reforço de peso', 'Leaky defence and {clube} president promises a big signing']],
      diplomata: [['{clube} sofre gols demais e presidente fala em ajuste coletivo', '{clube} concede too much and president talks collective fixes'], ['"{frase}": presidente do {clube} protege a zaga', '"{frase}": {clube} president protects the backline']],
      desconversa: [['Defesa do {clube} vaza e presidente minimiza', '{clube}’s defence leaks and president plays it down'], ['Presidente do {clube} evita falar de zagueiro', '{clube} president avoids defender talk']],
    },
  },
  {
    id: 'craque_cansado', rep: ['mila'], prioridade: 2,
    quando: c => !!c.cansado,
    perguntas: [
      ['{n} está visivelmente cansado. Vai poupar ou vai espremer até a última gota?', '{n} is visibly tired. Will you rest him or squeeze every last drop?'],
      ['Dizem que {n} pediu descanso e o senhor negou. Verdade?', 'They say {n} asked for a rest and you refused. True?'],
      ['O preparador físico do {clube} ainda tem emprego depois de hoje?', 'Does {clube}’s fitness coach still have a job after today?'],
    ],
    respostas: {
      provoca: [r(['Cansado? Ele cansa, descansa no ônibus e joga de novo. É craque.', 'Tired? He tires, rests on the bus and plays again. He’s a star.']), r(['Ele pediu descanso e eu pedi gol. Fiquei com a melhor parte.', 'He asked for a rest and I asked for a goal. I got the better deal.']), r(['O preparador tem emprego. Quem não tem é a pergunta.', 'The fitness coach has a job. The question doesn’t.'])],
      diplomata: [r(['Vamos gerenciar. Jogador cansado é jogador que rende menos, e eu sei disso.', 'We’ll manage it. A tired player performs less, and I know that.']), r(['Conversamos, sim. A decisão é sempre junto com ele.', 'We talked, yes. The decision is always made with him.']), r(['A preparação física está fazendo um ótimo trabalho num calendário pesado.', 'The fitness staff is doing a great job in a heavy calendar.'])],
      desconversa: [r(['Condição física é assunto do departamento.', 'Fitness is the department’s business.']), r(['Não comento conversa particular com atleta.', 'I don’t comment on private talks with athletes.']), r(['Próxima pergunta.', 'Next question.'])],
    },
    efeito: { provoca: EF.moralMenos, diplomata: EF.moralMais, desconversa: EF.nada },
    manchete: {
      provoca: [['"{frase}": presidente do {clube} minimiza cansaço de {n}', '"{frase}": {clube} president shrugs off {n}’s fatigue'], ['{n} no limite e presidente do {clube} faz piada', '{n} on his last legs and {clube} president cracks jokes']],
      diplomata: [['Presidente do {clube} promete gerenciar {n}', '{clube} president promises to manage {n}'], ['"{frase}": cansaço de {n} vira pauta no {clube}', '"{frase}": {n}’s fatigue becomes a topic at {clube}']],
      desconversa: [['Cansaço de {n}? Presidente do {clube} empurra pro departamento', '{n}’s fatigue? {clube} president passes it to the department'], ['{clube} não fala da condição física de {n}', '{clube} won’t discuss {n}’s fitness']],
    },
  },
  {
    id: 'lesao', rep: ['mila'], prioridade: 2,
    quando: c => !!c.lesionado,
    perguntas: [
      ['{n} saiu machucado. Qual é a gravidade e quem entra no lugar?', '{n} went off injured. How bad is it and who comes in?'],
      ['Perder {n} agora muda o planejamento da temporada?', 'Losing {n} now, does it change the season plan?'],
      ['O vestiário sentiu a lesão do {n}? Ele é líder lá dentro.', 'Did the locker room feel {n}’s injury? He’s a leader in there.'],
    ],
    respostas: {
      provoca: [r(['Quem entra vai jogar tanto que vocês vão esquecer o nome do {n}.', 'Whoever comes in will play so well you’ll forget {n}’s name.']), r(['Muda nada. Planejamento bom é o que aguenta lesão.', 'Changes nothing. A good plan is one that survives injuries.']), r(['Sentiu. E vai responder em campo, por ele.', 'They felt it. And they’ll answer on the pitch, for him.'])],
      diplomata: [r(['Ainda vamos avaliar. O importante é a recuperação dele.', 'We still have to assess. What matters is his recovery.']), r(['Lesão faz parte. O elenco foi montado pensando nisso.', 'Injuries are part of it. The squad was built with that in mind.']), r(['O grupo está com ele. Isso une mais do que separa.', 'The group is with him. That unites more than it divides.'])],
      desconversa: [r(['Boletim médico sai amanhã. Não antecipo nada.', 'Medical bulletin out tomorrow. I won’t anticipate anything.']), r(['Planejamento é interno.', 'Planning is internal.']), r(['Não falo pelo vestiário.', 'I don’t speak for the locker room.'])],
    },
    efeito: { provoca: EF.moralMais, diplomata: EF.moralMais, desconversa: EF.nada },
    manchete: {
      provoca: [['"{frase}": presidente do {clube} minimiza baixa de {n}', '"{frase}": {clube} president plays down losing {n}'], ['{n} machucado e presidente do {clube} confia no banco', '{n} injured and {clube} president trusts the bench']],
      diplomata: [['Presidente do {clube} pede calma com lesão de {n}', '{clube} president asks for calm over {n}’s injury'], ['"{frase}": {clube} fecha com {n}', '"{frase}": {clube} rally around {n}']],
      desconversa: [['Lesão de {n}: {clube} só fala amanhã', '{n}’s injury: {clube} will only talk tomorrow'], ['Presidente do {clube} não detalha situação de {n}', '{clube} president gives no detail on {n}']],
    },
  },
  {
    id: 'cria_estreou', rep: ['tiao', 'mila'], prioridade: 1,
    quando: c => !!c.criaEstreou,
    perguntas: [
      ['{n} estreou hoje! Dá pra dizer que nasceu um ídolo?', '{n} made his debut today! Can we say an idol was born?'],
      ['A base do {clube} tem mais {n} por vir ou ele é exceção?', 'Does {clube}’s academy have more like {n} coming or is he the exception?'],
      ['O menino tremeu? Ou entrou como veterano?', 'Did the kid tremble? Or did he come on like a veteran?'],
    ],
    respostas: {
      provoca: [r(['Nasceu um ídolo e vai nascer uma proposta. Não vendo.', 'An idol was born and so will an offer. Not selling.']), r(['Tem mais vindo. O {rival} que se prepare.', 'More are coming. {rival} had better get ready.']), r(['Tremeu foi o adversário quando ele pegou na bola.', 'The one trembling was the opponent when he got the ball.'])],
      diplomata: [r(['Ídolo se constrói com tempo. Hoje foi um bom começo.', 'Idols are built over time. Today was a good start.']), r(['A base é prioridade. {n} é fruto de trabalho.', 'The academy is a priority. {n} is the fruit of hard work.']), r(['Entrou bem. Normal ter nervosismo, e ele soube lidar.', 'He came on well. Nerves are normal, and he handled them.'])],
      desconversa: [r(['Deixa o menino jogar. Rótulo não ajuda.', 'Let the kid play. Labels don’t help.']), r(['Não comparo garotos da base.', 'I don’t compare academy kids.']), r(['Pergunta pra ele, com calma, em outro dia.', 'Ask him, gently, another day.'])],
    },
    efeito: { provoca: EF.moralMais, diplomata: EF.moralMais, desconversa: EF.nada },
    manchete: {
      provoca: [['"{frase}": presidente do {clube} já blinda o cria {n}', '"{frase}": {clube} president already shields academy kid {n}'], ['Estreia de {n} e presidente do {clube} fecha a porta pra propostas', '{n} debuts and {clube} president slams the door on offers']],
      diplomata: [['{n} estreia e presidente do {clube} exalta a base', '{n} debuts and {clube} president praises the academy'], ['"{frase}": cautela com {n} no {clube}', '"{frase}": caution with {n} at {clube}']],
      desconversa: [['Presidente do {clube} protege {n} dos holofotes', '{clube} president keeps {n} away from the spotlight'], ['Estreia de {n} e pouca conversa no {clube}', '{n}’s debut and little talk at {clube}']],
    },
  },
  {
    id: 'reserva_reclamando', rep: ['mila'], prioridade: 1,
    quando: c => !!c.reserva,
    perguntas: [
      ['{n} disse a um amigo que merece ser titular. O senhor concorda?', '{n} told a friend he deserves to start. Do you agree?'],
      ['Tem jogador no banco do {clube} insatisfeito. Isso é saudável?', 'There are unhappy players on {clube}’s bench. Is that healthy?'],
      ['{n} vai ser negociado na próxima janela?', 'Will {n} be sold in the next window?'],
    ],
    respostas: {
      provoca: [r(['Se ele merece, prova no treino. Amigo não escala time.', 'If he deserves it, he proves it in training. Friends don’t pick the team.']), r(['Insatisfeito é bom. Satisfeito no banco é que me preocupa.', 'Unhappy is good. Happy on the bench is what worries me.']), r(['Negociado? Ele ainda não jogou o bastante pra alguém querer.', 'Sold? He hasn’t played enough for anyone to want him.'])],
      diplomata: [r(['Todo jogador quer jogar, e é assim que tem que ser.', 'Every player wants to play, and that’s how it should be.']), r(['É normal. A competição interna faz o time crescer.', 'It’s normal. Internal competition makes the team grow.']), r(['Ninguém está à venda. Todos têm espaço pra mostrar serviço.', 'Nobody is for sale. Everyone has room to show their worth.'])],
      desconversa: [r(['Não comento conversa de amigo.', 'I don’t comment on what friends say.']), r(['Banco é assunto do treinador.', 'The bench is the coach’s business.']), r(['Janela é janela. Hoje foi jogo.', 'A window is a window. Today was a match.'])],
    },
    efeito: { provoca: EF.moralMenos, diplomata: EF.moralMais, desconversa: EF.nada },
    manchete: {
      provoca: [['"{frase}": presidente do {clube} devolve recado a {n}', '"{frase}": {clube} president sends a message back to {n}'], ['Clima no banco do {clube}: presidente não alivia pra {n}', 'Bench mood at {clube}: president gives {n} no slack']],
      diplomata: [['Presidente do {clube} acalma {n} e fala em competição sadia', '{clube} president calms {n} and talks healthy competition'], ['"{frase}": {clube} segura {n}', '"{frase}": {clube} hold on to {n}']],
      desconversa: [['Insatisfação de {n}? Presidente do {clube} não entra', '{n} unhappy? {clube} president stays out of it'], ['{clube} evita falar do banco de reservas', '{clube} avoid talking about the bench']],
    },
  },
  {
    id: 'pressao_tecnico', rep: ['rogerio'], prioridade: 2,
    quando: c => c.semVencer >= 3 && c.semVencer < 5 && c.zonaCair,
    perguntas: [
      ['Três sem vencer e na zona. O treinador fica?', 'Three without a win and in the drop zone. Does the coach stay?'],
      ['A torcida vaiou. O senhor vaiaria também?', 'The fans booed. Would you boo too?'],
      ['Falta time ou falta vergonha na cara, presidente?', 'Is it the team that’s lacking or the pride, Mr. President?'],
    ],
    respostas: {
      provoca: [r(['Fica. E você fica sem matéria.', 'He stays. And you stay without a story.']), r(['Eu vaiaria quem vaia. Torcida de verdade empurra.', 'I’d boo the booers. Real fans push.']), r(['Vergonha falta em quem faz essa pergunta.', 'Pride is lacking in whoever asks that.'])],
      diplomata: [r(['Fica. Mudança agora seria desespero, e desespero não ganha jogo.', 'He stays. Changing now would be panic, and panic doesn’t win games.']), r(['A vaia é legítima. Nós é que temos que mudar o som.', 'The boos are legitimate. We’re the ones who must change the sound.']), r(['Falta resultado. O resto a gente tem.', 'Results are lacking. The rest we have.'])],
      desconversa: [r(['Treinador é assunto da diretoria.', 'The coach is a board matter.']), r(['Não comento vaia.', 'I don’t comment on boos.']), r(['Pergunta ofensiva não tem resposta.', 'Offensive questions get no answer.'])],
    },
    efeito: { provoca: EF.cobranca, diplomata: EF.moralMais, desconversa: EF.moralMenos },
    manchete: {
      provoca: [['"{frase}": presidente do {clube} bate de frente com a torcida', '"{frase}": {clube} president clashes with the fans'], ['Pressão no {clube} e presidente parte pro ataque na coletiva', 'Pressure at {clube} and president goes on the offensive']],
      diplomata: [['Presidente do {clube} banca o treinador na zona de rebaixamento', '{clube} president backs the coach in the drop zone'], ['"{frase}": {clube} aceita a vaia e promete reação', '"{frase}": {clube} accept the boos and promise a reaction']],
      desconversa: [['Zona de rebaixamento e coletiva sem resposta no {clube}', 'Drop zone and a presser with no answers at {clube}'], ['Presidente do {clube} se esquiva de pergunta sobre o treinador', '{clube} president dodges coach question']],
    },
  },
  {
    id: 'vai_subir', rep: ['tiao', 'rogerio'], prioridade: 2,
    quando: c => c.zonaSubir && !c.lider && meio(c) && c.div !== 'A',
    perguntas: [
      ['Na zona de acesso com {pos}º lugar. Dá pra prometer a subida pra torcida?', 'In the promotion zone in {pos}th. Can you promise the fans promotion?'],
      ['Se não subir esse ano, é fracasso?', 'If you don’t go up this year, is it a failure?'],
      ['O time está pronto pra divisão de cima ou vai só passear lá?', 'Is the team ready for the division above or just going sightseeing?'],
    ],
    respostas: {
      provoca: [r(['Prometo. Pode escrever: o {clube} sobe.', 'I promise. Write it down: {clube} are going up.'], 'subir'), r(['Fracasso é quem fica embaixo torcendo contra.', 'Failure is whoever stays below rooting against us.']), r(['Passear quem vai é o {rival}, no shopping, enquanto a gente joga.', 'The one sightseeing is {rival}, at the mall, while we play.'])],
      diplomata: [r(['Prometo trabalho. A subida é consequência.', 'I promise work. Promotion is the consequence.']), r(['Não gosto da palavra fracasso. Seria um ano abaixo do planejado.', 'I don’t like the word failure. It would be a year below plan.']), r(['Vamos nos preparar. Subir é bom, se manter é melhor.', 'We’ll prepare. Going up is good, staying up is better.'])],
      desconversa: [r(['Promessa não ganha ponto.', 'Promises don’t win points.']), r(['Vamos falar disso no fim do campeonato.', 'We’ll talk about that at the end of the championship.']), r(['Divisão de cima? Primeiro a de baixo.', 'The division above? First the one below.'])],
    },
    efeito: { provoca: EF.cobranca, diplomata: EF.renda, desconversa: EF.nada },
    manchete: {
      provoca: [['"{frase}": presidente do {clube} promete acesso', '"{frase}": {clube} president promises promotion'], ['{clube} na zona de acesso e presidente já comemora', '{clube} in the promotion zone and president already celebrating']],
      diplomata: [['Presidente do {clube} evita promessa de acesso', '{clube} president avoids promising promotion'], ['"{frase}": pé no chão no {clube} rumo à subida', '"{frase}": feet on the ground at {clube} on the road up']],
      desconversa: [['{clube} briga pelo acesso e presidente não promete nada', '{clube} fight for promotion and president promises nothing'], ['Acesso? Presidente do {clube} muda de assunto', 'Promotion? {clube} president changes the subject']],
    },
  },
  {
    id: 'vai_cair', rep: ['rogerio', 'mila'], prioridade: 3,
    quando: c => c.zonaCair && meio(c) && c.semVencer < 3,
    perguntas: [
      ['{pos}º lugar, zona de rebaixamento. O senhor já pensou em renunciar?', '{pos}th place, relegation zone. Have you thought about resigning?'],
      ['A torcida pergunta: cai ou não cai?', 'The fans ask: going down or not?'],
      ['Tem jogador pedindo pra sair antes do navio afundar?', 'Are players asking to leave before the ship sinks?'],
    ],
    respostas: {
      provoca: [r(['Renunciar? Eu vim pra levantar taça, não pra levantar a mão.', 'Resign? I came to lift trophies, not to raise my hand.']), r(['Não cai. Escreve aí e cobra depois.', 'Not going down. Write it and hold me to it.'], 'nao_cair'), r(['Navio? Isso aqui é porta-aviões. Quem quiser pular, pula no mar.', 'Ship? This is an aircraft carrier. Whoever wants to jump, jumps into the sea.'])],
      diplomata: [r(['Não. Momento difícil pede liderança, não fuga.', 'No. Hard times call for leadership, not flight.']), r(['Vamos lutar até a última rodada. É o que posso garantir.', 'We’ll fight to the last round. That’s what I can guarantee.']), r(['Ninguém pediu pra sair. O grupo sabe da responsabilidade.', 'Nobody asked to leave. The group knows its responsibility.'])],
      desconversa: [r(['Não respondo hipótese.', 'I don’t answer hypotheticals.']), r(['A tabela responde no fim.', 'The table answers at the end.']), r(['Elenco é assunto interno.', 'The squad is internal business.'])],
    },
    efeito: { provoca: EF.cobranca, diplomata: EF.moralMais, desconversa: EF.moralMenos },
    manchete: {
      provoca: [['"{frase}": presidente do {clube} garante permanência', '"{frase}": {clube} president guarantees survival'], ['Na zona, presidente do {clube} desafia: não cai', 'In the drop zone, {clube} president defiant: not going down']],
      diplomata: [['Presidente do {clube} descarta renúncia e pede luta', '{clube} president rules out resigning and calls for a fight'], ['"{frase}": {clube} promete lutar até o fim', '"{frase}": {clube} promise to fight to the end']],
      desconversa: [['Zona de rebaixamento e presidente do {clube} não responde se cai', 'Drop zone and {clube} president won’t say if they go down'], ['Coletiva tensa e curta no {clube}', 'Tense, short presser at {clube}']],
    },
  },
  {
    id: 'lider', rep: ['tiao'], prioridade: 1,
    quando: c => c.lider && meio(c) && c.vitoriasSeguidas < 5,
    perguntas: [
      ['Líder da {div}! A faixa já está encomendada?', 'Top of the {div}! Is the sash already on order?'],
      ['Quem é o maior rival na briga pelo título: o {rival} ou o próprio {clube}?', 'Who’s the biggest rival in the title race: {rival} or {clube} themselves?'],
      ['Liderar é mais pesado que perseguir?', 'Is leading heavier than chasing?'],
    ],
    respostas: {
      provoca: [r(['Encomendada e bordada. Só falta a data da festa.', 'Ordered and embroidered. Only the party date is missing.'], 'titulo'), r(['O {rival} não briga por título. Briga por manchete.', '{rival} don’t fight for titles. They fight for headlines.']), r(['Pesado é olhar pra trás e ver o {rival} lá embaixo.', 'Heavy is looking back and seeing {rival} way down there.'])],
      diplomata: [r(['Faixa se encomenda com a conta fechada. Ainda falta muito.', 'You order the sash when the maths is done. There’s a long way to go.']), r(['Nosso rival é a gente mesmo. Manter o nível é o desafio.', 'Our rival is ourselves. Keeping the level is the challenge.']), r(['Liderar é privilégio. Pesado é ficar fora da briga.', 'Leading is a privilege. Heavy is being out of the race.'])],
      desconversa: [r(['Não falo de faixa.', 'I don’t talk sashes.']), r(['Rival tem muito. Eu olho a tabela.', 'Plenty of rivals. I look at the table.']), r(['Pergunta filosófica. Passo.', 'A philosophical question. Pass.'])],
    },
    efeito: { provoca: EF.cobranca, diplomata: EF.renda, desconversa: EF.nada },
    manchete: {
      provoca: [['"{frase}": líder, presidente do {clube} já fala em festa', '"{frase}": top of the table, {clube} president already talking party'], ['Presidente do {clube} alfineta o {rival} na liderança', '{clube} president needles {rival} from top spot']],
      diplomata: [['Líder, {clube} mantém discurso de pé no chão', 'Leaders {clube} keep the feet-on-the-ground speech'], ['"{frase}": presidente do {clube} freia euforia', '"{frase}": {clube} president curbs euphoria']],
      desconversa: [['Liderança e silêncio: presidente do {clube} não fala em título', 'Top spot and silence: {clube} president won’t say title'], ['Presidente do {clube} foge da pergunta sobre a faixa', '{clube} president dodges the sash question']],
    },
  },
  {
    id: 'copa_final', rep: ['tiao', 'rogerio'], prioridade: 3,
    quando: c => c.copa === 'final',
    perguntas: [
      ['Final da {comp}! O senhor dorme essa semana?', '{comp} final! Will you sleep this week?'],
      ['Chegar na final já é vitória ou só vale com a taça?', 'Is reaching the final a victory or does it only count with the cup?'],
      ['Promete a taça pra torcida?', 'Do you promise the fans the cup?'],
    ],
    respostas: {
      provoca: [r(['Durmo tranquilo. Quem perde o sono é o adversário.', 'I sleep fine. The opponent is the one losing sleep.']), r(['Vice é o primeiro dos perdedores. A gente vem pela taça.', 'Runner-up is first among losers. We’re coming for the cup.'], 'copa'), r(['Prometo. E prometo a festa depois.', 'I promise. And I promise the party after.'], 'copa')],
      diplomata: [r(['Durmo pouco, confesso. Final é final.', 'I sleep little, I confess. A final is a final.']), r(['Chegar é mérito. Levantar a taça é o sonho.', 'Getting there is merit. Lifting the cup is the dream.']), r(['Prometo entrega. A taça a gente busca em campo.', 'I promise commitment. The cup we chase on the pitch.'])],
      desconversa: [r(['Durmo como todo mundo.', 'I sleep like everyone.']), r(['Final se fala depois da final.', 'Finals are discussed after finals.']), r(['Não faço promessa.', 'I don’t make promises.'])],
    },
    efeito: { provoca: EF.cobranca, diplomata: EF.renda, desconversa: EF.nada },
    manchete: {
      provoca: [['"{frase}": presidente do {clube} promete a taça da {comp}', '"{frase}": {clube} president promises the {comp} trophy'], ['Rumo à final: {clube} chega provocando', 'Heading to the final: {clube} arrive taunting']],
      diplomata: [['{clube} na final e presidente pede os pés no chão', '{clube} in the final and president asks for calm'], ['"{frase}": sonho da {comp} no {clube}', '"{frase}": the {comp} dream at {clube}']],
      desconversa: [['Final da {comp} e presidente do {clube} fala pouco', '{comp} final and {clube} president says little'], ['Presidente do {clube} evita promessas antes da final', '{clube} president avoids promises before the final']],
    },
  },
  {
    id: 'copa_eliminado', rep: ['rogerio', 'mila'], prioridade: 2,
    quando: c => c.copa === 'eliminado',
    perguntas: [
      ['Fora da {comp}. A temporada já acabou pro {clube}?', 'Out of the {comp}. Is the season over for {clube}?'],
      ['Eliminação dói mais no bolso ou no orgulho?', 'Does elimination hurt more in the pocket or in the pride?'],
      ['Quem é o culpado pela queda na {comp}?', 'Who’s to blame for the {comp} exit?'],
    ],
    respostas: {
      provoca: [r(['Acabou? A liga ainda tá aí e eu vou buscar.', 'Over? The league’s still there and I’m going for it.'], 'titulo'), r(['Dói no orgulho de quem nos eliminou, porque sabe que teve sorte.', 'It hurts the pride of whoever knocked us out, because they know they got lucky.']), r(['Culpado é o juiz, o gramado e o horário. O time não.', 'Blame the ref, the pitch and the kick-off time. Not the team.'])],
      diplomata: [r(['Temporada tem liga. Vamos focar nela.', 'The season has a league. We’ll focus on it.']), r(['Dói em tudo. Copa é sonho de torcedor.', 'It hurts everywhere. The cup is a fan’s dream.']), r(['Culpa é coletiva, e a resposta também será.', 'Blame is collective, and so will the answer be.'])],
      desconversa: [r(['Não comento eliminação.', 'I don’t comment on eliminations.']), r(['Bolso é assunto do financeiro.', 'The pocket is the finance department’s business.']), r(['Não aponto dedo.', 'I don’t point fingers.'])],
    },
    efeito: { provoca: EF.cobranca, diplomata: EF.moralMais, desconversa: EF.nada },
    manchete: {
      provoca: [['"{frase}": eliminado, presidente do {clube} culpa o mundo', '"{frase}": knocked out, {clube} president blames the world'], ['{clube} cai na {comp} e presidente mira a liga', '{clube} crash out of the {comp} and president targets the league']],
      diplomata: [['Presidente do {clube} assume eliminação e foca na liga', '{clube} president owns the exit and focuses on the league'], ['"{frase}": a dor da {comp} no {clube}', '"{frase}": the pain of the {comp} at {clube}']],
      desconversa: [['Fora da {comp}, {clube} faz coletiva relâmpago', 'Out of the {comp}, {clube} hold a lightning presser'], ['Presidente do {clube} não quer falar da eliminação', '{clube} president won’t talk about the elimination']],
    },
  },
  {
    id: 'copa_campeao', rep: ['tiao', 'rogerio'], prioridade: 3,
    quando: c => c.copa === 'campeao',
    perguntas: [
      ['CAMPEÃO da {comp}! Presidente, dedica a quem?', '{comp} CHAMPIONS! Mr. President, who do you dedicate it to?'],
      ['Essa taça cala quem?', 'Who does this cup silence?'],
      ['Agora é bicampeonato ou o senhor se contenta?', 'Now it’s back-to-back or are you content?'],
    ],
    respostas: {
      provoca: [r(['Dedico ao {rival}, que assistiu de casa.', 'I dedicate it to {rival}, who watched from home.']), r(['Cala todo mundo que duvidou. A lista é longa, eu guardei.', 'It silences everyone who doubted. The list is long, I kept it.']), r(['Bi, tri, tetra. Pode ir reservando as páginas.', 'Two, three, four in a row. Go ahead and book the pages.'], 'copa')],
      diplomata: [r(['À torcida, ao grupo e a quem trabalha no clube sem aparecer.', 'To the fans, the group and everyone who works at the club unseen.']), r(['Taça não cala ninguém. Taça celebra.', 'A cup silences no one. A cup celebrates.']), r(['Hoje é festa. Amanhã a gente planeja o próximo.', 'Today is a party. Tomorrow we plan the next one.'])],
      desconversa: [r(['A dedicatória é particular.', 'The dedication is private.']), r(['Não penso em calar ninguém.', 'I don’t think about silencing anyone.']), r(['Deixa eu comemorar essa primeiro.', 'Let me celebrate this one first.'])],
    },
    efeito: { provoca: EF.rival, diplomata: EF.renda, desconversa: EF.nada },
    manchete: {
      provoca: [['"{frase}": campeão da {comp}, presidente do {clube} provoca', '"{frase}": {comp} champion, {clube} president taunts'], ['Taça e deboche: {clube} comemora cutucando o {rival}', 'Cup and mockery: {clube} celebrate by poking {rival}']],
      diplomata: [['Campeão da {comp}, presidente do {clube} agradece a todos', '{comp} champions, {clube} president thanks everyone'], ['"{frase}": a dedicatória do título do {clube}', '"{frase}": {clube}’s title dedication']],
      desconversa: [['{clube} campeão da {comp}: presidente só quer festa', '{clube} win the {comp}: president just wants to party'], ['Título da {comp} e coletiva curta no {clube}', '{comp} title and a short presser at {clube}']],
    },
  },
  {
    id: 'caixa_cheio', rep: ['clarice'], prioridade: 1, dinheiro: true,
    quando: c => c.caixaAlto && c.rodada % 4 === 0,
    perguntas: [
      ['O {clube} tem {valor} em caixa. Vai gastar no leilão ou vai sentar em cima?', '{clube} have {valor} in the bank. Spending at the auction or sitting on it?'],
      ['Dinheiro parado é dinheiro perdido. Cadê o reforço?', 'Idle money is lost money. Where’s the signing?'],
      ['Com esse caixa, o salário do elenco vai subir?', 'With that balance, are squad wages going up?'],
    ],
    respostas: {
      provoca: [r(['Vou gastar tanto que o leilão vai pedir pra eu parar.', 'I’ll spend so much the auction will beg me to stop.']), r(['Reforço vem. E vem do tipo que faz o {rival} chorar.', 'A signing is coming. The kind that makes {rival} cry.']), r(['Salário sobe pra quem faz gol. Pra quem pergunta, não.', 'Wages go up for whoever scores. Not for whoever asks.'])],
      diplomata: [r(['Caixa saudável é segurança. Vamos investir com critério.', 'A healthy balance is security. We’ll invest wisely.']), r(['Reforço certo, na hora certa. Pressa custa caro.', 'The right signing, at the right time. Haste is expensive.']), r(['Salário acompanha desempenho e planejamento.', 'Wages follow performance and planning.'])],
      desconversa: [r(['Finanças eu discuto com o conselho.', 'Finances I discuss with the board.']), r(['Leilão a gente vê na janela.', 'Auctions we handle in the window.']), r(['Salário é sigilo.', 'Wages are confidential.'])],
    },
    efeito: { provoca: EF.cobranca, diplomata: EF.nada, desconversa: EF.nada },
    manchete: {
      provoca: [['"{frase}": presidente do {clube} promete gastar no leilão', '"{frase}": {clube} president vows to splash out at the auction'], ['Caixa cheio e promessa de reforço no {clube}', 'Full coffers and a signing promise at {clube}']],
      diplomata: [['{clube} tem {valor} em caixa e presidente prega cautela', '{clube} have {valor} in the bank and president preaches caution'], ['"{frase}": planejamento financeiro no {clube}', '"{frase}": financial planning at {clube}']],
      desconversa: [['Presidente do {clube} não abre o caixa pra imprensa', '{clube} president keeps the books closed to the press'], ['{valor} em caixa e silêncio no {clube}', '{valor} in the bank and silence at {clube}']],
    },
  },
  {
    id: 'caixa_vazio', rep: ['clarice'], prioridade: 2, dinheiro: true,
    quando: c => c.caixaBaixo && c.rodada % 3 === 0,
    perguntas: [
      ['O caixa do {clube} está no vermelho. Vai vender alguém pra fechar o mês?', '{clube}’s accounts are in the red. Selling someone to close the month?'],
      ['Salários em dia? Ouvi reclamação.', 'Wages paid on time? I heard complaints.'],
      ['SAF, patrocínio ou milagre: qual o plano?', 'Investors, sponsors or a miracle: what’s the plan?'],
    ],
    respostas: {
      provoca: [r(['Vender? Eu compro. Vocês é que não entendem de futebol.', 'Sell? I buy. You just don’t understand football.']), r(['Reclamação de quem? Me dá o nome que eu resolvo agora.', 'Complaints from whom? Give me the name and I’ll sort it now.']), r(['O plano é ganhar. Ganhando, dinheiro aparece.', 'The plan is to win. Win, and money shows up.'])],
      diplomata: [r(['Vamos equilibrar as contas. Venda só se fizer sentido esportivo.', 'We’ll balance the books. A sale only if it makes sporting sense.']), r(['Em dia. Momento apertado não é momento irresponsável.', 'Paid. A tight moment isn’t an irresponsible one.']), r(['Patrocínio e gestão. Milagre a gente deixa pros santos.', 'Sponsorship and management. Miracles we leave to the saints.'])],
      desconversa: [r(['Finanças não se discutem em coletiva.', 'Finances aren’t discussed at pressers.']), r(['Folha salarial é assunto interno.', 'Payroll is internal.']), r(['Tem plano. Não é público.', 'There’s a plan. It’s not public.'])],
    },
    efeito: { provoca: EF.cobranca, diplomata: EF.moralMais, desconversa: EF.moralMenos },
    manchete: {
      provoca: [['"{frase}": presidente do {clube} nega crise financeira na bravata', '"{frase}": {clube} president denies money troubles with bravado'], ['Caixa no vermelho e presidente do {clube} bate boca', 'Red ink and {clube} president trades barbs']],
      diplomata: [['Presidente do {clube} admite aperto e descarta venda forçada', '{clube} president admits the squeeze and rules out a fire sale'], ['"{frase}": contas do {clube} em pauta', '"{frase}": {clube}’s accounts on the agenda']],
      desconversa: [['Caixa do {clube} em baixa e presidente não responde', '{clube}’s coffers low and president has no answer'], ['Perguntas sobre dinheiro e silêncio no {clube}', 'Money questions and silence at {clube}']],
    },
  },
  {
    id: 'proposta_craque', rep: ['clarice', 'mila'], prioridade: 2, dinheiro: true,
    quando: c => !!c.proposta,
    perguntas: [
      ['O {adv} ofereceu {valor} pelo {n}. É verdade que o senhor recusou?', '{adv} offered {valor} for {n}. Is it true you turned it down?'],
      ['{n} quer ouvir a proposta. O senhor deixa?', '{n} wants to hear the offer. Will you let him?'],
      ['Por {valor} qualquer um sai. Qual é o preço do {n}?', 'For {valor} anyone goes. What’s {n}’s price?'],
    ],
    respostas: {
      provoca: [r(['Recusei e ri. {valor} não paga nem a chuteira dele.', 'I refused and laughed. {valor} wouldn’t even cover his boots.']), r(['Ele ouve o que eu deixar. E eu não deixo.', 'He hears what I allow. And I don’t allow it.']), r(['Preço do {n}? Não tem. Ele não é mercadoria, é patrimônio.', '{n}’s price? None. He’s not goods, he’s heritage.'])],
      diplomata: [r(['Proposta existiu, não atendia ao clube. Segue conosco.', 'There was an offer, it didn’t suit the club. He stays with us.']), r(['Conversamos com transparência. Ele sabe da nossa confiança.', 'We talk openly. He knows our trust in him.']), r(['Todo jogador tem valor. O dele é alto, e com razão.', 'Every player has a value. His is high, and rightly so.'])],
      desconversa: [r(['Não comento negociação.', 'I don’t comment on negotiations.']), r(['Isso fica entre mim e o atleta.', 'That stays between me and the player.']), r(['Preço é assunto de mesa, não de microfone.', 'Prices are for the table, not the microphone.'])],
    },
    efeito: { provoca: EF.moralMais, diplomata: EF.moralMais, desconversa: EF.nada },
    manchete: {
      provoca: [['"{frase}": presidente do {clube} ri de proposta por {n}', '"{frase}": {clube} president laughs at offer for {n}'], ['{clube} fecha a porta: {n} não sai nem por {valor}', '{clube} shut the door: {n} isn’t leaving even for {valor}']],
      diplomata: [['Presidente do {clube} confirma proposta por {n} e segura o craque', '{clube} president confirms offer for {n} and keeps the star'], ['"{frase}": {n} fica no {clube}', '"{frase}": {n} stays at {clube}']],
      desconversa: [['Proposta por {n}? Presidente do {clube} não confirma nem nega', 'Offer for {n}? {clube} president neither confirms nor denies'], ['Mistério no {clube} sobre o futuro de {n}', 'Mystery at {clube} over {n}’s future']],
    },
  },
  {
    id: 'patrocinador_cobrando', rep: ['clarice'], prioridade: 2, dinheiro: true,
    quando: c => !!c.patrocinadorCobrando,
    perguntas: [
      ['O patrocinador master está incomodado com os resultados. Risco de rescisão?', 'The main sponsor is unhappy with results. Risk of termination?'],
      ['Sem o master, o {clube} fecha a temporada?', 'Without the main sponsor, can {clube} finish the season?'],
      ['A marca pediu reunião de emergência. O que o senhor vai dizer?', 'The brand asked for an emergency meeting. What will you say?'],
    ],
    respostas: {
      provoca: [r(['Incomodado? Que troque de time. Tem fila pra entrar na nossa camisa.', 'Unhappy? Let them switch teams. There’s a queue for our shirt.']), r(['Fecha e abre a próxima. Camisa do {clube} nunca fica vazia.', 'We finish and start the next one. {clube}’s shirt is never empty.']), r(['Vou dizer que patrocinador torce, não escala.', 'I’ll say sponsors cheer, they don’t pick the team.'])],
      diplomata: [r(['Parceria é pra momentos bons e ruins. Vamos conversar.', 'Partnerships are for good and bad times. We’ll talk.']), r(['Temos planejamento pra qualquer cenário.', 'We have a plan for every scenario.']), r(['Vou ouvir primeiro. Depois a gente alinha.', 'I’ll listen first. Then we align.'])],
      desconversa: [r(['Contrato é sigiloso.', 'The contract is confidential.']), r(['Não trabalho com hipóteses.', 'I don’t work with hypotheticals.']), r(['Reunião é reunião. Falo depois dela.', 'A meeting is a meeting. I’ll speak after it.'])],
    },
    efeito: { provoca: EF.cobranca, diplomata: EF.nada, desconversa: EF.nada },
    manchete: {
      provoca: [['"{frase}": presidente do {clube} peita o patrocinador', '"{frase}": {clube} president squares up to the sponsor'], ['Crise com o master e presidente do {clube} não recua', 'Sponsor crisis and {clube} president won’t back down']],
      diplomata: [['Presidente do {clube} acalma patrocinador e fala em parceria', '{clube} president calms the sponsor and talks partnership'], ['"{frase}": {clube} e o master vão conversar', '"{frase}": {clube} and the main sponsor will talk']],
      desconversa: [['Patrocinador insatisfeito e silêncio no {clube}', 'Unhappy sponsor and silence at {clube}'], ['Presidente do {clube} não comenta pressão da marca', '{clube} president won’t comment on brand pressure']],
    },
  },
  {
    id: 'classico_proximo', rep: ['rogerio'], prioridade: 2,
    quando: c => !!c.proximoClassico && !c.vespera,
    perguntas: [
      ['Semana de clássico contra o {rival}. Já tem recado pra eles?', 'Derby week against {rival}. Any message for them?'],
      ['O {rival} vem embalado. Medo?', '{rival} come in on a roll. Scared?'],
      ['Clássico decide temporada ou é só mais um jogo?', 'Does the derby decide the season or is it just another game?'],
    ],
    respostas: {
      provoca: [r(['Recado? Que tragam lenço. Vai ter choro.', 'A message? Bring tissues. There’ll be tears.'], 'classico'), r(['Medo eu tenho de dentista. Do {rival}, não.', 'I’m scared of the dentist. Not of {rival}.']), r(['Decide a temporada deles. A nossa já tá encaminhada.', 'It decides their season. Ours is already on track.'])],
      diplomata: [r(['Recado é pra nossa torcida: lotem o estádio.', 'The message is for our fans: pack the stadium.']), r(['Respeito. Clássico não tem favorito.', 'Respect. Derbies have no favourites.']), r(['É mais um jogo com gosto especial. Três pontos, como sempre.', 'One more game with a special taste. Three points, as always.'])],
      desconversa: [r(['Não mando recado por microfone.', 'I don’t send messages through microphones.']), r(['Não comento o adversário.', 'I don’t comment on the opponent.']), r(['Jogo é jogo.', 'A game is a game.'])],
    },
    efeito: { provoca: EF.rival, diplomata: EF.renda, desconversa: EF.nada },
    manchete: {
      provoca: [['"{frase}": presidente do {clube} esquenta o clássico contra o {rival}', '"{frase}": {clube} president heats up the derby against {rival}'], ['Semana de clássico começa com provocação do {clube}', 'Derby week starts with a taunt from {clube}']],
      diplomata: [['Presidente do {clube} convoca a torcida pro clássico', '{clube} president rallies the fans for the derby'], ['"{frase}": respeito ao {rival} antes do clássico', '"{frase}": respect for {rival} before the derby']],
      desconversa: [['Clássico à vista e presidente do {clube} não entra no clima', 'Derby ahead and {clube} president stays out of the mood'], ['{clube} evita provocação na semana do clássico', '{clube} avoid taunts in derby week']],
    },
  },
  {
    id: 'internacional', rep: ['tiao', 'rogerio'], prioridade: 2,
    quando: c => !!c.intl,
    perguntas: [
      ['{comp}! O {clube} está pronto pra representar o país?', '{comp}! Are {clube} ready to represent the country?'],
      ['Entre a liga e a {comp}, qual vem primeiro se tiver que escolher?', 'Between the league and the {comp}, which comes first if you must choose?'],
      ['A torcida sonha com a taça da {comp}. O senhor também sonha ou só trabalha?', 'The fans dream of the {comp} trophy. Do you dream too or just work?'],
    ],
    respostas: {
      provoca: [r(['Pronto e passando. O {rival} que assista pela TV.', 'Ready and more. {rival} can watch on TV.']), r(['Escolher? Eu quero as duas. Quem escolhe é quem não tem elenco.', 'Choose? I want both. Choosing is for those without a squad.'], 'titulo'), r(['Sonho acordado. E já mandei limpar a sala de troféus.', 'I dream wide awake. And I’ve had the trophy room cleaned.'])],
      diplomata: [r(['Pronto pra competir com respeito e ambição.', 'Ready to compete with respect and ambition.']), r(['Jogo a jogo. Não escolho filho.', 'Game by game. I don’t choose between children.']), r(['Sonho e trabalho. Um sem o outro não funciona.', 'Dream and work. One without the other doesn’t work.'])],
      desconversa: [r(['Jogar bem é representar. O resto é discurso.', 'Playing well is representing. The rest is talk.']), r(['Não respondo "se".', 'I don’t answer "ifs".']), r(['Trabalho. Sonhar eu deixo pra noite.', 'I work. Dreaming I leave for the night.'])],
    },
    efeito: { provoca: EF.cobranca, diplomata: EF.renda, desconversa: EF.nada },
    manchete: {
      provoca: [['"{frase}": presidente do {clube} já mira a taça da {comp}', '"{frase}": {clube} president already eyes the {comp} trophy'], ['{clube} chega na {comp} com a língua afiada', '{clube} arrive at the {comp} with sharp tongues']],
      diplomata: [['Presidente do {clube} fala em respeito e ambição na {comp}', '{clube} president talks respect and ambition at the {comp}'], ['"{frase}": {clube} e o sonho da {comp}', '"{frase}": {clube} and the {comp} dream']],
      desconversa: [['{comp}: presidente do {clube} corta sonho e fala em trabalho', '{comp}: {clube} president cuts the dream talk and speaks of work'], ['Pouca conversa no {clube} antes da {comp}', 'Little talk at {clube} before the {comp}']],
    },
  },
  {
    id: 'copa_mundo', rep: ['tiao'], prioridade: 2,
    quando: c => !!c.mundo,
    perguntas: [
      ['Copa do Mundo com jogadores do {clube} na seleção! Orgulho ou medo de lesão?', 'A World Cup with {clube} players in the national team! Pride or fear of injury?'],
      ['O {clube} é um clube que forma seleção?', 'Are {clube} a club that supplies the national team?'],
      ['Vai torcer pela seleção ou pelo elenco voltar inteiro?', 'Rooting for the national team or for the squad to come back in one piece?'],
    ],
    respostas: {
      provoca: [r(['Orgulho. Medo é do adversário que vai enfrentar nossos meninos.', 'Pride. Fear is for the opponent facing our boys.']), r(['Forma seleção e forma manchete. O {rival} forma o quê?', 'We supply the national team and the headlines. What do {rival} supply?']), r(['Torço pela seleção ganhar com gol do {clube}.', 'I root for the national team to win with a {clube} goal.'])],
      diplomata: [r(['Orgulho enorme. É o sonho de qualquer clube.', 'Enormous pride. It’s every club’s dream.']), r(['Trabalhamos pra isso. Ver nossos atletas lá é reconhecimento.', 'We work for it. Seeing our players there is recognition.']), r(['Pelos dois. Que voltem campeões e inteiros.', 'For both. May they return champions and in one piece.'])],
      desconversa: [r(['Seleção é assunto de seleção.', 'The national team is the national team’s business.']), r(['Não me comparo a ninguém.', 'I don’t compare myself to anyone.']), r(['Torço em silêncio.', 'I cheer quietly.'])],
    },
    efeito: { provoca: EF.moralMais, diplomata: EF.renda, desconversa: EF.nada },
    manchete: {
      provoca: [['"{frase}": presidente do {clube} infla o peito pela Copa do Mundo', '"{frase}": {clube} president puffs out his chest for the World Cup'], ['Copa do Mundo e provocação no {clube}', 'World Cup and a taunt at {clube}']],
      diplomata: [['{clube} na Copa do Mundo: presidente fala em orgulho', '{clube} at the World Cup: president talks pride'], ['"{frase}": o {clube} e a seleção', '"{frase}": {clube} and the national team']],
      desconversa: [['Copa do Mundo e presidente do {clube} evita o assunto', 'World Cup and {clube} president avoids the subject'], ['Presidente do {clube} torce em silêncio', '{clube} president cheers in silence']],
    },
  },
  {
    id: 'bola_ouro', rep: ['tiao'], prioridade: 2,
    quando: c => !!c.bolaOuro,
    perguntas: [
      ['{n} é Bola de Ouro! O senhor sabia que tinha um gênio em casa?', '{n} is the Ballon d’Or winner! Did you know you had a genius at home?'],
      ['Agora o salário do {n} dobra?', 'Does {n}’s salary double now?'],
      ['Bola de Ouro traz proposta. O {clube} segura o {n}?', 'A Ballon d’Or brings offers. Will {clube} keep {n}?'],
    ],
    respostas: {
      provoca: [r(['Sabia antes dele. Eu que escolhi, lembra?', 'I knew before he did. I picked him, remember?']), r(['Dobra o troféu na sala. O salário já era justo.', 'The trophy count doubles. The salary was already fair.']), r(['Segura. Quem quiser, traz o clube inteiro de troco.', 'We keep him. Anyone who wants him can bring their whole club in exchange.'])],
      diplomata: [r(['Sabia do talento. O prêmio é mérito dele e do grupo.', 'I knew the talent. The award is his merit and the group’s.']), r(['Vamos conversar. Reconhecimento faz parte.', 'We’ll talk. Recognition is part of it.']), r(['Faremos o possível. Ele sabe o que representa aqui.', 'We’ll do what we can. He knows what he represents here.'])],
      desconversa: [r(['Prêmio é dele. Eu só aplaudo.', 'The award is his. I just applaud.']), r(['Salário é sigilo.', 'Wages are confidential.']), r(['Proposta, quando vier, a gente vê.', 'Offers, when they come, we’ll see.'])],
    },
    efeito: { provoca: EF.moralMais, diplomata: EF.renda, desconversa: EF.nada },
    manchete: {
      provoca: [['"{frase}": presidente do {clube} chama pra si a Bola de Ouro de {n}', '"{frase}": {clube} president claims credit for {n}’s Ballon d’Or'], ['Bola de Ouro e bravata no {clube}: {n} não sai', 'Ballon d’Or and bravado at {clube}: {n} isn’t leaving']],
      diplomata: [['Presidente do {clube} celebra Bola de Ouro de {n} com o grupo', '{clube} president celebrates {n}’s Ballon d’Or with the group'], ['"{frase}": {n} e o {clube} no topo', '"{frase}": {n} and {clube} on top']],
      desconversa: [['Bola de Ouro de {n} e presidente do {clube} só aplaude', '{n}’s Ballon d’Or and {clube} president just applauds'], ['{clube} não fala de salário nem proposta por {n}', '{clube} won’t discuss {n}’s wages or offers']],
    },
  },
  {
    id: 'marco_temporada', rep: ['clarice', 'tiao'], prioridade: 1,
    quando: c => c.temporada % 10 === 0 && c.rodada === 2,
    perguntas: [
      ['Temporada {temp} do {clube}. O que mudou do primeiro dia pra hoje?', 'Season {temp} at {clube}. What changed from day one to today?'],
      ['{temp} temporadas. Já pensou em parar?', '{temp} seasons. Ever thought about stopping?'],
      ['Qual foi o maior erro dessas {temp} temporadas?', 'What was the biggest mistake of these {temp} seasons?'],
    ],
    respostas: {
      provoca: [r(['Mudou que antes a gente sonhava. Agora os outros têm pesadelo.', 'What changed is we used to dream. Now the others have nightmares.']), r(['Parar? Só quando o {rival} ganhar alguma coisa. Ou seja, nunca.', 'Stop? Only when {rival} win something. So, never.']), r(['Não ter comprado o {rival} quando era barato.', 'Not buying {rival} when they were cheap.'])],
      diplomata: [r(['Mudou a estrutura, o elenco e a cabeça. O amor é o mesmo.', 'The structure, the squad and the mindset changed. The love is the same.']), r(['Enquanto tiver vontade e resultado, sigo.', 'As long as there’s will and results, I carry on.']), r(['Vários. O importante é que cada um ensinou algo.', 'Several. What matters is each one taught something.'])],
      desconversa: [r(['Balanço se faz no fim, não no meio.', 'You take stock at the end, not the middle.']), r(['Não penso nisso hoje.', 'I’m not thinking about that today.']), r(['Erro a gente guarda pra si.', 'Mistakes you keep to yourself.'])],
    },
    efeito: { provoca: EF.renda, diplomata: EF.renda, desconversa: EF.nada },
    manchete: {
      provoca: [['Temporada {temp}: presidente do {clube} comemora cutucando o {rival}', 'Season {temp}: {clube} president celebrates by poking {rival}'], ['"{frase}": {temp} temporadas de {clube}', '"{frase}": {temp} seasons of {clube}']],
      diplomata: [['{temp} temporadas: presidente do {clube} faz balanço', '{temp} seasons: {clube} president takes stock'], ['"{frase}": o legado do {clube}', '"{frase}": {clube}’s legacy']],
      desconversa: [['Temporada {temp} e presidente do {clube} evita balanço', 'Season {temp} and {clube} president avoids taking stock'], ['Marca histórica no {clube} passa em silêncio', 'Historic milestone at {clube} passes in silence']],
    },
  },
  {
    id: 'ultima_rodada', rep: ['rogerio'], prioridade: 3,
    quando: c => c.rodada === c.totalRodadas - 1 && (c.zonaSubir || c.zonaCair || c.lider) && !c.vespera,
    perguntas: [
      ['Última rodada decide tudo. Dorme hoje, presidente?', 'The last round decides everything. Sleeping tonight, Mr. President?'],
      ['Se der errado na última rodada, o senhor continua?', 'If it goes wrong in the last round, do you stay on?'],
      ['A torcida tá à beira de um ataque. E o senhor?', 'The fans are on the edge of a breakdown. And you?'],
    ],
    respostas: {
      provoca: [r(['Durmo de boa. Quem vai acordar chorando é o adversário.', 'I’ll sleep fine. The opponent is the one waking up in tears.']), r(['Não vai dar errado. Guarda essa pergunta pra outro clube.', 'It won’t go wrong. Save that question for another club.']), r(['Eu tô ótimo. Ataque quem vai ter é a defesa deles.', 'I’m great. The attack will be on their defence.'])],
      diplomata: [r(['Pouco. Mas a equipe fez a parte dela, e eu confio.', 'Not much. But the team did its part, and I trust them.']), r(['Continuo. Projeto não se mede por uma rodada.', 'I stay. A project isn’t measured by one round.']), r(['Ansioso como todo torcedor. É o futebol.', 'Anxious like every fan. That’s football.'])],
      desconversa: [r(['Durmo cedo. Boa noite.', 'I sleep early. Good night.']), r(['Hipótese eu não respondo.', 'Hypotheticals I don’t answer.']), r(['Tô bem, obrigado.', 'I’m fine, thanks.'])],
    },
    efeito: { provoca: EF.cobranca, diplomata: EF.moralMais, desconversa: EF.nada },
    manchete: {
      provoca: [['"{frase}": presidente do {clube} chega confiante à decisão', '"{frase}": {clube} president arrives confident for the decider'], ['Última rodada e provocação no {clube}', 'Last round and a taunt at {clube}']],
      diplomata: [['Presidente do {clube} confia no grupo pra decisão', '{clube} president trusts the group for the decider'], ['"{frase}": nervos à flor da pele no {clube}', '"{frase}": nerves on edge at {clube}']],
      desconversa: [['Decisão à vista e presidente do {clube} dorme cedo', 'Decider ahead and {clube} president sleeps early'], ['Pouca conversa no {clube} antes da última rodada', 'Little talk at {clube} before the last round']],
    },
  },
  {
    id: 'estreia_temporada', rep: ['tiao', 'clarice'], prioridade: 1,
    quando: c => c.rodada === 1 && c.temporada % 10 !== 0,
    perguntas: [
      ['Começa a temporada {temp}. Qual é a meta do {clube}?', 'Season {temp} begins. What’s {clube}’s target?'],
      ['O elenco está fechado ou ainda vem gente do leilão?', 'Is the squad done or is more coming from the auction?'],
      ['Promete algo pra torcida nessa estreia?', 'Promising the fans anything at this opener?'],
    ],
    respostas: {
      provoca: [r(['Meta é título. Meta de ficar no meio é pro {rival}.', 'The target is the title. Mid-table targets are for {rival}.'], 'titulo'), r(['Vem gente. E vem do tipo que vocês vão gastar tinta.', 'More are coming. The kind you’ll spend ink on.']), r(['Prometo a melhor temporada da história. Pode cobrar.', 'I promise the best season in history. Hold me to it.'], 'titulo')],
      diplomata: [r(['Evoluir em relação ao ano passado. Passo a passo.', 'Improve on last year. Step by step.']), r(['Estamos atentos ao mercado. Oportunidade boa a gente aproveita.', 'We’re watching the market. Good opportunities we take.']), r(['Prometo dedicação. Resultado é consequência.', 'I promise dedication. Results follow.'])],
      desconversa: [r(['Meta é interna.', 'The target is internal.']), r(['Leilão a gente comenta na hora.', 'Auctions we discuss when they happen.']), r(['Não faço promessa em estreia.', 'I don’t make promises at openers.'])],
    },
    efeito: { provoca: EF.cobranca, diplomata: EF.renda, desconversa: EF.nada },
    manchete: {
      provoca: [['"{frase}": {clube} abre a temporada {temp} prometendo título', '"{frase}": {clube} open season {temp} promising the title'], ['Estreia com promessa grande no {clube}', 'Opener with a big promise at {clube}']],
      diplomata: [['{clube} estreia na temporada {temp} com discurso de evolução', '{clube} open season {temp} talking progress'], ['"{frase}": a meta do {clube} pra temporada', '"{frase}": {clube}’s target for the season']],
      desconversa: [['Estreia do {clube} sem metas públicas', '{clube} opener with no public targets'], ['Presidente do {clube} guarda os planos da temporada', '{clube} president keeps the season plans to himself']],
    },
  },
  {
    id: 'vespera_final', rep: ['rogerio', 'tiao'], prioridade: 3,
    quando: c => c.vespera === 'final',
    perguntas: [
      ['Véspera da final da {comp}. O time está pronto ou está nervoso?', 'Eve of the {comp} final. Is the team ready or nervous?'],
      ['O adversário disse que é favorito. Concorda?', 'The opponent said they’re favourites. Agree?'],
      ['Se perder amanhã, qual é a desculpa?', 'If you lose tomorrow, what’s the excuse?'],
    ],
    respostas: {
      provoca: [r(['Pronto. Nervoso tá o adversário, que já perdeu a final na cabeça.', 'Ready. The nervous one is the opponent, who already lost the final in their head.'], 'copa'), r(['Favorito ganha no papel. Amanhã é na grama, e a grama é nossa.', 'Favourites win on paper. Tomorrow it’s on grass, and the grass is ours.'], 'copa'), r(['Desculpa? Não vou precisar. Guarda a pergunta pra eles.', 'Excuse? Won’t need one. Save the question for them.'], 'copa')],
      diplomata: [r(['Pronto e concentrado. Nervosismo bom é o que dá energia.', 'Ready and focused. Good nerves give energy.']), r(['Final não tem favorito. Tem quem acerta mais.', 'Finals have no favourites. Just whoever gets more right.']), r(['Não trabalho com desculpa. Trabalho com preparação.', 'I don’t work with excuses. I work with preparation.'])],
      desconversa: [r(['Pronto. Próxima.', 'Ready. Next.']), r(['Cada um fala o que quer.', 'Everyone says what they want.']), r(['Não respondo "se".', 'I don’t answer "ifs".'])],
    },
    efeito: { provoca: EF.cobranca, diplomata: EF.moralMais, desconversa: EF.nada },
    manchete: {
      provoca: [['"{frase}": presidente do {clube} já dá a final da {comp} como ganha', '"{frase}": {clube} president already calls the {comp} final won'], ['Véspera de final e provocação no {clube}', 'Eve of the final and a taunt at {clube}']],
      diplomata: [['Presidente do {clube} fala em foco antes da final da {comp}', '{clube} president talks focus before the {comp} final'], ['"{frase}": a final da {comp} vista pelo {clube}', '"{frase}": the {comp} final as seen by {clube}']],
      desconversa: [['Véspera de final e coletiva curta no {clube}', 'Eve of the final and a short presser at {clube}'], ['{clube} se fecha antes da final da {comp}', '{clube} shut up shop before the {comp} final']],
    },
  },
  {
    id: 'vespera_classico', rep: ['rogerio', 'mila'], prioridade: 3,
    quando: c => c.vespera === 'classico',
    perguntas: [
      ['Amanhã tem clássico decisivo contra o {rival}. Quem ganha?', 'Tomorrow is the decisive derby against {rival}. Who wins?'],
      ['O {rival} disse que o {clube} treme em decisão. Resposta?', '{rival} said {clube} shake in deciders. Your answer?'],
      ['O vestiário dormiu ou ficou acordado pensando no {rival}?', 'Did the locker room sleep or stay up thinking about {rival}?'],
    ],
    respostas: {
      provoca: [r(['A gente. E não vai ser pouco.', 'We do. And not by a little.'], 'classico'), r(['Treme quem tem motivo. Quem treme amanhã é o {rival}.', 'Shaking is for those with reason. Tomorrow the shaking one is {rival}.'], 'classico'), r(['Dormiu como anjo. Quem contou carneirinho foi o {rival}.', 'Slept like angels. {rival} were the ones counting sheep.'])],
      diplomata: [r(['Quem errar menos. Clássico é detalhe.', 'Whoever makes fewer mistakes. Derbies are about details.']), r(['Palavra não ganha jogo. Amanhã a gente responde em campo.', 'Words don’t win games. Tomorrow we answer on the pitch.']), r(['Dormiu tranquilo. A preparação foi feita.', 'Slept well. The preparation is done.'])],
      desconversa: [r(['Palpite é pra vocês.', 'Predictions are your job.']), r(['Não ouvi o {rival}.', 'Didn’t hear {rival}.']), r(['Vestiário é assunto interno.', 'The locker room is internal.'])],
    },
    efeito: { provoca: EF.rival, diplomata: EF.moralMais, desconversa: EF.nada },
    manchete: {
      provoca: [['"{frase}": véspera de clássico e presidente do {clube} crava vitória', '"{frase}": derby eve and {clube} president calls the win'], ['Guerra de palavras antes do clássico entre {clube} e {rival}', 'War of words before the {clube}–{rival} derby']],
      diplomata: [['Presidente do {clube} prega calma antes do clássico', '{clube} president preaches calm before the derby'], ['"{frase}": {clube} responde ao {rival} sem provocar', '"{frase}": {clube} answer {rival} without taunting']],
      desconversa: [['Clássico decisivo e silêncio no {clube}', 'Decisive derby and silence at {clube}'], ['Presidente do {clube} não entra na guerra com o {rival}', '{clube} president stays out of the war with {rival}']],
    },
  },
  {
    id: 'fuga', rep: ['rogerio'], prioridade: 2,
    quando: c => c.pulosSeguidos >= 3,
    perguntas: [
      ['Presidente, três coletivas seguidas sem aparecer. Tá fugindo da imprensa?', 'Mr. President, three pressers in a row without showing up. Running from the press?'],
      ['A torcida acha que o senhor sumiu. Onde o senhor estava?', 'The fans think you vanished. Where were you?'],
      ['Falar com a imprensa é obrigação ou favor?', 'Is talking to the press an obligation or a favour?'],
    ],
    respostas: {
      provoca: [r(['Fugindo? Eu tava trabalhando. Experimenta um dia.', 'Running? I was working. Try it some day.']), r(['Sumi pra não ter que ouvir pergunta boba. Voltei pra confirmar que continuam.', 'I vanished to avoid silly questions. I’m back to confirm they continue.']), r(['É favor. E hoje tô generoso.', 'It’s a favour. And today I’m feeling generous.'])],
      diplomata: [r(['Não fugi. Tive semanas cheias, e o clube vem antes do microfone.', 'I didn’t run. Busy weeks, and the club comes before the microphone.']), r(['Dentro do clube, resolvendo o que precisava. Agora estou aqui.', 'Inside the club, sorting what needed sorting. Now I’m here.']), r(['É parte do trabalho. E eu respeito quem faz a cobertura.', 'It’s part of the job. And I respect those who cover us.'])],
      desconversa: [r(['Tô aqui agora. Pergunta de futebol?', 'I’m here now. Any football questions?']), r(['Onde eu estava não interessa.', 'Where I was doesn’t matter.']), r(['Sem comentários.', 'No comment.'])],
    },
    efeito: { provoca: EF.cobranca, diplomata: EF.moralMais, desconversa: EF.nada },
    manchete: {
      provoca: [['"{frase}": presidente do {clube} reaparece batendo boca', '"{frase}": {clube} president reappears trading barbs'], ['Depois do sumiço, presidente do {clube} volta provocando a imprensa', 'After vanishing, {clube} president returns taunting the press']],
      diplomata: [['Presidente do {clube} reaparece e explica o sumiço', '{clube} president reappears and explains his absence'], ['"{frase}": {clube} volta a falar com a imprensa', '"{frase}": {clube} talk to the press again']],
      desconversa: [['Presidente do {clube} reaparece, mas segue sem dizer nada', '{clube} president reappears but still says nothing'], ['Sumiço e silêncio: a relação do {clube} com a imprensa', 'Vanishing and silence: {clube}’s relationship with the press']],
    },
  },
  // ── OCASIÕES NOVAS (22/10, pedido do Diego: *"mais tipos de pergunta e mais tipos de respostas em outras ocasiões…
  // as pessoas jogam muitas temporadas, não pode ficar cansativo"*). Placar de cada tipo, momento da tabela, Várzea e
  // caixa apertado com o time ganhando. Quase todas prioridade 1 (esperam 4 rodadas e são uma vez por temporada).
  {
    id: 'zero_a_zero', rep: ['rogerio', 'tiao'], prioridade: 1,
    quando: c => !!c.placar && c.placar.gf === 0 && c.placar.ga === 0 && !c.placar.arquirrival,
    perguntas: [
      ['0 a 0 com o {adv}. Presidente, o senhor pediria o dinheiro do ingresso de volta?', '0–0 with {adv}. Mr. President, would you ask for your ticket money back?'],
      ['Noventa minutos e nenhum gol. Os atacantes esqueceram onde fica o gol?', 'Ninety minutes and no goals. Did the strikers forget where the goal is?'],
      ['A torcida bocejou mais do que gritou hoje. Foi jogo de xadrez?', 'The fans yawned more than they shouted today. Was it a chess match?'],
      ['Zero a zero é um ponto ganho ou dois perdidos?', 'Is a goalless draw a point won or two dropped?'],
    ],
    respostas: {
      provoca: [r(['Pediria sim: pro {adv}, que veio só pra estacionar o ônibus na área.', 'I would: from {adv}, who only came to park the bus in the box.']), r(['Esqueceram nada. O goleiro deles é que escolheu logo hoje pra ter o dia da vida dele.', 'Forgot nothing. Their keeper just picked today to have the game of his life.']), r(['Xadrez era o {adv}. A gente jogava bola, eles empilhavam peça na área.', '{adv} were playing chess. We played football, they stacked pieces in the box.']), r(['Ponto ganho pra eles, que vão comemorar como título. Pra nós foi ensaio.', 'A point won for them, they’ll party like it’s a title. For us it was a rehearsal.'])],
      diplomata: [r(['Jogo travado, dois times organizados. Nem todo dia sai festival.', 'A tight game, two organised sides. Not every day is a festival.']), r(['Faltou capricho no último passe. É o que vamos treinar a semana inteira.', 'We lacked care in the final pass. That’s what we’ll train all week.']), r(['Defesa sólida é bom sinal. Agora falta a bola topar entrar.', 'A solid defence is a good sign. Now the ball just has to agree to go in.']), r(['Um ponto é um ponto. No fim da temporada ele pode valer muito.', 'A point is a point. At the end of the season it may be worth a lot.'])],
      desconversa: [r(['Não teve gol, então não tem muito o que comentar, né?', 'There were no goals, so there’s not much to comment on, is there?']), r(['Vou rever o jogo em casa. Se eu não dormir no meio, comento depois.', 'I’ll rewatch it at home. If I don’t fall asleep halfway, I’ll comment later.']), r(['Placar zerado, coletiva zerada. Obrigado.', 'Blank scoreline, blank presser. Thanks.']), r(['Pergunta pro travessão. Ele participou mais que todo mundo.', 'Ask the crossbar. It got more involved than anyone.'])],
    },
    efeito: { provoca: EF.cobranca, diplomata: EF.moralMais, desconversa: EF.nada },
    manchete: {
      provoca: [['"{frase}": presidente do {clube} culpa a retranca do {adv}', '"{frase}": {clube} president blames {adv}’s bus-parking'], ['0 a 0 sem graça e presidente do {clube} cheio de graça', 'A dull 0–0 and a {clube} president full of jokes'], ['{clube} não faz gol, mas o presidente faz barulho', '{clube} can’t score, but the president makes noise']],
      diplomata: [['Empate sem gols e paciência no {clube}', 'Goalless draw and patience at {clube}'], ['"{frase}": presidente do {clube} vê o copo meio cheio no 0 a 0', '"{frase}": {clube} president sees the glass half full after 0–0'], ['{clube} trava no {adv} e presidente promete treino de finalização', '{clube} stall against {adv} and president promises finishing drills']],
      desconversa: [['0 a 0 em campo, 0 a 0 na coletiva do {clube}', '0–0 on the pitch, 0–0 at {clube}’s presser'], ['"{frase}": presidente do {clube} despacha o empate sem gols', '"{frase}": {clube} president waves off the goalless draw'], ['Nem gol nem resposta: noite morna no {clube}', 'No goals, no answers: a lukewarm night at {clube}']],
    },
  },
  {
    id: 'vitoria_magra', rep: ['tiao', 'rogerio'], prioridade: 1,
    quando: c => !!c.placar && c.placar.gf === 1 && c.placar.ga === 0 && !c.placar.casa && !c.placar.arquirrival,
    perguntas: [
      ['1 a 0 na casa do {adv}. Vitória de campeão ou vitória sofrida?', '1–0 at {adv}’s ground. A champion’s win or a scrappy one?'],
      ['Um golzinho e depois foi só segurar. Esse é o estilo do {clube} agora?', 'One little goal and then hang on. Is that {clube}’s style now?'],
      ['Quantas unhas o senhor roeu nos minutos finais?', 'How many fingernails did you chew in the final minutes?'],
      ['Vitória magra fora de casa. Dá pra chamar de bonita?', 'A narrow away win. Can we call it pretty?'],
    ],
    respostas: {
      provoca: [r(['De campeão. Bonito é pra desfile, a gente veio buscar os três pontos.', 'A champion’s. Pretty is for parades, we came for the three points.']), r(['Um gol basta quando o outro time não faz nenhum. Matemática simples.', 'One goal is enough when the other side scores none. Simple maths.']), r(['Nenhuma. Quem roeu foi a torcida do {adv}, até o cotovelo.', 'None. {adv}’s fans chewed theirs, all the way to the elbow.']), r(['Bonita foi a cara do {adv} no apito final.', 'The pretty part was {adv}’s faces at the final whistle.'])],
      diplomata: [r(['Vitória fora de casa nunca é fácil. Valeu pela entrega.', 'Away wins are never easy. It was about commitment.']), r(['Às vezes o jogo pede sofrimento. O grupo soube sofrer junto.', 'Sometimes a game demands suffering. The group knew how to suffer together.']), r(['Algumas, confesso. Mas confiei na defesa até o fim.', 'A few, I confess. But I trusted the defence to the end.']), r(['Bonita ou não, vale igual na tabela. Isso me deixa tranquilo.', 'Pretty or not, it counts the same in the table. That keeps me calm.'])],
      desconversa: [r(['Ganhou, tá ganho. O resto é opinião.', 'Won is won. The rest is opinion.']), r(['Estilo é com a comissão técnica. Eu só assino o cheque.', 'Style is for the coaching staff. I just sign the cheques.']), r(['Minhas unhas são assunto particular.', 'My fingernails are a private matter.']), r(['Beleza a gente discute em concurso. Hoje é estrada e volta pra casa.', 'Beauty is for pageants. Today it’s the road home.'])],
    },
    efeito: { provoca: EF.cobranca, diplomata: EF.moralMais, desconversa: EF.nada },
    manchete: {
      provoca: [['"{frase}": presidente do {clube} defende o 1 a 0 com unhas e dentes', '"{frase}": {clube} president defends the 1–0 tooth and nail'], ['Vitória magra, boca cheia: {clube} provoca o {adv}', 'Thin win, big mouth: {clube} taunt {adv}'], ['{clube} vence fora e presidente zoa a torcida da casa', '{clube} win away and president teases the home fans']],
      diplomata: [['{clube} sofre, vence fora e presidente elogia a entrega', '{clube} suffer, win away and president praises commitment'], ['"{frase}": o 1 a 0 suado do {clube}', '"{frase}": {clube}’s hard-earned 1–0'], ['Três pontos na mala: {clube} volta da casa do {adv} com vitória', 'Three points in the suitcase: {clube} return from {adv} with a win']],
      desconversa: [['1 a 0 e poucas palavras no {clube}', '1–0 and few words at {clube}'], ['"{frase}": presidente do {clube} não discute estilo', '"{frase}": {clube} president won’t debate style'], ['Vitória magra, coletiva mais magra ainda no {clube}', 'Thin win, even thinner presser at {clube}']],
    },
  },
  {
    id: 'jogo_maluco', rep: ['rogerio', 'mila'], prioridade: 2,
    quando: c => !c.copa && !!c.placar && c.placar.gf >= 3 && c.placar.ga >= 3 && !c.placar.arquirrival,
    perguntas: [
      ['{gf} a {ga}! Presidente, isso foi futebol ou handebol?', '{gf}–{ga}! Mr. President, was that football or handball?'],
      ['A torcida saiu rouca e o goleiro saiu traumatizado. Quem o senhor consola primeiro?', 'The fans left hoarse and the keeper left traumatised. Who do you comfort first?'],
      ['Com tanto gol, alguém defendeu hoje?', 'With so many goals, did anyone defend today?'],
      ['Se todo jogo fosse assim, o senhor chegava vivo no fim da temporada?', 'If every game were like this, would you survive to the end of the season?'],
    ],
    respostas: {
      provoca: [r(['Handebol tem goleiro melhor. Hoje foi show, e show não pede desculpa.', 'Handball has better keepers. Today was a show, and shows don’t apologise.']), r(['O goleiro tá ótimo. Traumatizado ficou o placar eletrônico.', 'The keeper’s fine. The scoreboard is the one traumatised.']), r(['Defender pra quê, se dá pra fazer um a mais? Filosofia de presidente.', 'Why defend when you can score one more? Presidential philosophy.']), r(['Chegava. Quem não chega é o técnico do {adv}, que tá respirando por aparelho.', 'I would. {adv}’s coach is the one on life support.'])],
      diplomata: [r(['Jogo aberto demais. Lindo pra quem assiste, perigoso pra quem dirige.', 'Too open. Lovely to watch, dangerous to manage.']), r(['Os dois. E vou conversar com a defesa com carinho, mas com firmeza.', 'Both. And I’ll talk to the defence kindly, but firmly.']), r(['Defender, defendeu pouco. É o primeiro item do treino de segunda.', 'Not much defending. It’s item one on Monday’s training plan.']), r(['Difícil. Coração de presidente não foi feito pra isso toda semana.', 'Hard to say. A president’s heart isn’t built for this every week.'])],
      desconversa: [r(['Perdi a conta dos gols no meio. Pergunta pro estatístico.', 'I lost count of the goals halfway. Ask the stats guy.']), r(['Não consolo ninguém. Vou é tomar um chá de camomila.', 'I’m not comforting anyone. I’m having a camomile tea.']), r(['Sobre defesa eu falo outro dia, com calma.', 'I’ll talk about defending another day, calmly.']), r(['Meu cardiologista pediu pra eu não comentar.', 'My cardiologist asked me not to comment.'])],
    },
    efeito: { provoca: EF.renda, diplomata: EF.moralMais, desconversa: EF.nada },
    manchete: {
      provoca: [['"{frase}": {gf} a {ga} e presidente do {clube} vende o espetáculo', '"{frase}": {gf}–{ga} and {clube} president sells the show'], ['Jogo maluco e presidente do {clube} mais maluco ainda na coletiva', 'A crazy game and an even crazier {clube} president at the presser'], ['{clube} e {adv} fazem chover gol, e o presidente faz chover frase', '{clube} and {adv} make it rain goals, the president makes it rain quotes']],
      diplomata: [['{gf} a {ga}: presidente do {clube} promete ajustar a defesa', '{gf}–{ga}: {clube} president promises to fix the defence'], ['"{frase}": o {clube} depois do jogo dos {gf} a {ga}', '"{frase}": {clube} after the {gf}–{ga} thriller'], ['Festival de gols assusta até o presidente do {clube}', 'Goal fest scares even the {clube} president']],
      desconversa: [['Presidente do {clube} perde a conta dos gols e encerra a coletiva', '{clube} president loses count of the goals and ends the presser'], ['"{frase}": camomila e silêncio no {clube}', '"{frase}": camomile and silence at {clube}'], ['{gf} a {ga} em campo e quase nada na coletiva do {clube}', '{gf}–{ga} on the pitch and almost nothing at {clube}’s presser']],
    },
  },
  {
    id: 'vitoria_fora', rep: ['tiao', 'rogerio'], prioridade: 1,
    quando: c => venceu(c) && !!c.placar && !c.placar.casa && c.placar.ga > 0 && c.placar.gf - c.placar.ga < 3 && !c.placar.virada && !c.placar.arquirrival,
    perguntas: [
      ['Vitória na casa do {adv}, com a torcida deles pegando no pé o jogo todo. Sentiu a pressão?', 'A win at {adv}’s place with their fans on your back all game. Feel the pressure?'],
      ['O {clube} joga melhor fora do que em casa?', 'Do {clube} play better away than at home?'],
      ['Como foi a viagem de volta? Teve pagode no ônibus?', 'How was the trip home? Was there samba on the bus?'],
      ['{gf} a {ga} fora de casa. Qual foi o segredo pra calar o estádio deles?', '{gf}–{ga} away. What was the secret to silencing their stadium?'],
    ],
    respostas: {
      provoca: [r(['Pressão? A torcida deles cantou tão bonito que a gente resolveu dar um motivo pra parar.', 'Pressure? Their fans sang so nicely we decided to give them a reason to stop.']), r(['Fora a gente capricha: visita educada nunca sai de mãos vazias.', 'Away we make an effort: polite guests never leave empty-handed.']), r(['Teve pagode, churrasquinho na parada e o {adv} de tema das piadas.', 'There was samba, a roadside barbecue and {adv} as the theme of the jokes.']), r(['O segredo é simples: gol. Estádio nenhum canta depois de levar gol.', 'The secret is simple: goals. No stadium sings after conceding.'])],
      diplomata: [r(['Sentimos, claro. Mérito do grupo, que manteve a cabeça fria.', 'We felt it, of course. Credit to the group for keeping cool heads.']), r(['Em casa ou fora, a ideia é a mesma. Hoje encaixou.', 'Home or away, the idea is the same. Today it clicked.']), r(['Tranquila. O grupo merecia uma viagem de volta feliz.', 'Smooth. The group deserved a happy trip home.']), r(['Paciência e respeito ao {adv}. Quem joga fora tem que saber sofrer.', 'Patience and respect for {adv}. Away sides must know how to suffer.'])],
      desconversa: [r(['Não ouvi a torcida. Tava concentrado no jogo.', 'Didn’t hear the fans. I was focused on the game.']), r(['Casa, fora… três pontos são três pontos.', 'Home, away… three points are three points.']), r(['O que acontece no ônibus fica no ônibus.', 'What happens on the bus stays on the bus.']), r(['Segredo de vestiário. Não posso contar.', 'Locker room secret. Can’t tell.'])],
    },
    efeito: { provoca: EF.cobranca, diplomata: EF.moralMais, desconversa: EF.nada },
    manchete: {
      provoca: [['"{frase}": {clube} cala a casa do {adv} e presidente provoca', '"{frase}": {clube} silence {adv}’s ground and president taunts'], ['Visita mal-educada: {clube} vence fora e ainda tira onda', 'Rude guests: {clube} win away and show off too'], ['Pagode no ônibus e alfinetada no {adv}: a volta do {clube}', 'Samba on the bus and a jab at {adv}: {clube}’s trip home']],
      diplomata: [['{clube} vence fora e presidente exalta a cabeça fria do grupo', '{clube} win away and president praises the group’s cool heads'], ['"{frase}": a vitória do {clube} longe de casa', '"{frase}": {clube}’s win away from home'], ['{gf} a {ga} fora: {clube} volta com três pontos e respeito ao {adv}', '{gf}–{ga} away: {clube} return with three points and respect for {adv}']],
      desconversa: [['Vitória fora e presidente do {clube} guarda os segredos', 'Away win and {clube} president keeps the secrets'], ['"{frase}": {clube} vence longe de casa e fala pouco', '"{frase}": {clube} win away and say little'], ['O que rolou no ônibus do {clube}? O presidente não conta', 'What happened on {clube}’s bus? The president won’t tell']],
    },
  },
  {
    id: 'derrota_casa', rep: ['mila', 'rogerio'], prioridade: 1,
    quando: c => perdeu(c) && !!c.placar && c.placar.casa && c.placar.ga - c.placar.gf < 3 && !c.placar.arquirrival,
    perguntas: [
      ['Derrota em casa pro {adv}, com estádio cheio. O torcedor merecia isso?', 'Home defeat to {adv} with a full stadium. Did the fans deserve that?'],
      ['Ouvi vaia no apito final. O senhor ouviu também?', 'I heard boos at the final whistle. Did you hear them too?'],
      ['O {adv} saiu daqui sorrindo. Nossa casa virou a casa da mãe Joana?', '{adv} left here smiling. Has our ground turned into a free-for-all?'],
      ['Perder em casa dói mais. Quem pede desculpa pro torcedor?', 'Losing at home hurts more. Who apologises to the fans?'],
    ],
    respostas: {
      provoca: [r(['Não merecia. Mas o {adv} também não merecia ganhar, e ganhou. Futebol é injusto.', 'They didn’t. But {adv} didn’t deserve to win either, and they did. Football is unfair.']), r(['Ouvi. E achei afinada. Nossa torcida até vaia com qualidade.', 'I did. Nicely in tune, too. Our fans even boo with class.']), r(['Sorrindo hoje. Na volta, o sorriso deles fica esquecido no vestiário.', 'Smiling today. In the return, they’ll leave the smile in the locker room.']), r(['Desculpa eu peço quando tomar goleada. Hoje foi detalhe.', 'I’ll apologise when we get thrashed. Today was a detail.'])],
      diplomata: [r(['Não merecia. O torcedor fez a parte dele e a gente ficou devendo.', 'They didn’t. The fans did their part and we fell short.']), r(['Ouvi e entendo. Vaia em casa é sinal de que esperam mais da gente.', 'I heard and I understand. Home boos mean they expect more from us.']), r(['Nossa casa precisa voltar a ser difícil. Esse é o recado pro grupo.', 'Our ground has to become hard to visit again. That’s the message to the group.']), r(['Eu peço, em nome de todos. E a gente paga em campo no próximo jogo aqui.', 'I do, on behalf of everyone. And we’ll repay it on the pitch at the next home game.'])],
      desconversa: [r(['O torcedor sabe o que merece. Eu não falo por ele.', 'The fans know what they deserve. I don’t speak for them.']), r(['No apito final eu tava no celular. Não ouvi nada.', 'At the final whistle I was on my phone. Didn’t hear a thing.']), r(['Não comento o humor do adversário.', 'I don’t comment on the opponent’s mood.']), r(['Próxima. Essa o placar já respondeu.', 'Next. The scoreboard already answered that one.'])],
    },
    efeito: { provoca: EF.cobranca, diplomata: EF.moralMais, desconversa: EF.moralMenos },
    manchete: {
      provoca: [['"{frase}": presidente do {clube} perde em casa, mas não perde a pose', '"{frase}": {clube} president loses at home but keeps the swagger'], ['Derrota em casa e ironia com a vaia: o dia do {clube}', 'Home defeat and irony about the boos: {clube}’s day'], ['{clube} cai diante da própria torcida e presidente jura troco no {adv}', '{clube} fall in front of their own fans and president vows payback on {adv}']],
      diplomata: [['Presidente do {clube} pede desculpas à torcida após derrota em casa', '{clube} president apologises to the fans after home defeat'], ['"{frase}": {clube} quer a casa difícil de novo', '"{frase}": {clube} want their ground to be a fortress again'], ['Vaia entendida: presidente do {clube} assume a derrota pro {adv}', 'Boos understood: {clube} president owns the defeat to {adv}']],
      desconversa: [['Derrota em casa e presidente do {clube} diz que não ouviu a vaia', 'Home defeat and {clube} president says he didn’t hear the boos'], ['"{frase}": silêncio no {clube} depois do tropeço em casa', '"{frase}": silence at {clube} after the home slip-up'], ['{adv} vence no estádio do {clube} e a coletiva acaba rápido', '{adv} win at {clube}’s ground and the presser ends fast']],
    },
  },
  {
    id: 'muralha', rep: ['tiao', 'mila'], prioridade: 1,
    quando: c => !!c.placar && c.placar.gf === 2 && c.placar.ga === 0 && !c.placar.arquirrival,
    perguntas: [
      ['2 a 0 e o goleiro nem sujou o uniforme. A defesa é a estrela do {clube}?', '2–0 and the keeper didn’t even get his kit dirty. Is the defence {clube}’s star?'],
      ['O {adv} não deu um chute com perigo. O senhor mandou trancar a área com cadeado?', '{adv} didn’t have a single dangerous shot. Did you padlock the box?'],
      ['Jogo sem sofrer gol é o jogo preferido de presidente?', 'Is a clean sheet a president’s favourite kind of game?'],
      ['Placar limpo, sem susto. Dá pra se acostumar com isso?', 'Clean scoreline, no scares. Could you get used to this?'],
    ],
    respostas: {
      provoca: [r(['Estrela? A defesa é a constelação inteira. O ataque só veio de enfeite.', 'Star? The defence is the whole constellation. The attack was just decoration.']), r(['Cadeado, corrente e um cachorro bravo. E ainda sobrou espaço pros nossos gols.', 'Padlock, chain and an angry dog. And there was still room for our goals.']), r(['É. Ainda mais quando o adversário volta pra casa sem saber a cor da nossa rede.', 'Yes. Especially when the opponent goes home without knowing the colour of our net.']), r(['Me acostumo fácil. O {adv} é que vai ter que se acostumar a ver de longe.', 'I get used to it easily. {adv} will have to get used to watching from afar.'])],
      diplomata: [r(['A defesa foi muito bem, mas quem defende primeiro é o atacante. Mérito de todos.', 'The defence was great, but defending starts with the strikers. Credit to all.']), r(['Organização e concentração. O grupo cumpriu o plano à risca.', 'Organisation and focus. The group followed the plan to the letter.']), r(['Todo presidente gosta. Garante uma noite de sono que não tem preço.', 'Every president does. It buys a night’s sleep you can’t put a price on.']), r(['Dá, mas não pode acomodar. O próximo adversário vai testar de novo.', 'I could, but we can’t get comfortable. The next opponent will test us again.'])],
      desconversa: [r(['Pergunta pro goleiro se ele quer ser estrela. Acho que ele quer é folga.', 'Ask the keeper if he wants to be a star. I think he wants a day off.']), r(['Cadeado é assunto de segurança. Não posso revelar.', 'Padlocks are a security matter. Can’t reveal.']), r(['Meu jogo preferido é o próximo.', 'My favourite game is the next one.']), r(['Hábito é coisa de freira. Eu sou presidente.', 'Habits are for nuns. I’m a president.'])],
    },
    efeito: { provoca: EF.moralMais, diplomata: EF.moralMais, desconversa: EF.nada },
    manchete: {
      provoca: [['"{frase}": presidente do {clube} tranca a área e joga a chave fora', '"{frase}": {clube} president locks the box and throws away the key'], ['2 a 0 e cadeado: {clube} não dá chance ao {adv}', '2–0 and a padlock: {clube} give {adv} no chance'], ['A muralha do {clube} vira piada na coletiva', '{clube}’s wall becomes a punchline at the presser']],
      diplomata: [['{clube} vence sem sofrer gol e presidente divide o mérito', '{clube} win without conceding and president shares the credit'], ['"{frase}": a defesa do {clube} em noite perfeita', '"{frase}": {clube}’s defence on a perfect night'], ['Placar limpo e pés no chão no {clube}', 'Clean sheet and feet on the ground at {clube}']],
      desconversa: [['Goleiro sem trabalho e presidente sem assunto no {clube}', 'Keeper with no work and president with no topic at {clube}'], ['"{frase}": {clube} fecha a área e a boca', '"{frase}": {clube} shut the box and their mouths'], ['2 a 0 tranquilo e coletiva mais tranquila ainda no {clube}', 'A calm 2–0 and an even calmer presser at {clube}']],
    },
  },
  {
    id: 'meio_temporada', rep: ['tiao', 'clarice'], prioridade: 1,
    quando: c => c.totalRodadas >= 10 && c.rodada === Math.floor(c.totalRodadas / 2),
    perguntas: [
      ['Metade da temporada e o {clube} em {pos}º. Que nota o senhor dá até aqui?', 'Halfway through and {clube} sit {pos}th. What grade would you give so far?'],
      ['Metade da temporada {temp}. O {clube} está onde o senhor planejou?', 'Halfway through season {temp}. Are {clube} where you planned?'],
      ['Se a segunda metade fosse um filme, seria comédia, drama ou terror?', 'If the second half of the season were a film, would it be comedy, drama or horror?'],
      ['O que o senhor mudaria se pudesse voltar pra rodada 1?', 'What would you change if you could go back to round 1?'],
    ],
    respostas: {
      provoca: [r(['Nota dez. Pros outros eu daria nota também, mas não quero humilhar ninguém.', 'Ten out of ten. I’d grade the others too, but I don’t want to humiliate anyone.']), r(['Estamos acima do planejado. O planejamento é que foi modesto.', 'We’re above plan. The plan was just modest.']), r(['Filme de ação. E o resto da {div} faz figuração.', 'An action film. And the rest of the {div} are extras.']), r(['Nada. Eu só voltaria pra assistir de novo.', 'Nothing. I’d only go back to watch it again.'])],
      diplomata: [r(['Nota sete. Tem coisa boa e tem coisa pra corrigir daqui pra frente.', 'Seven out of ten. Some good things, some to fix from here on.']), r(['Perto disso. Metade do caminho, metade do trabalho.', 'Close. Halfway there, half the work.']), r(['Drama com final feliz, espero. Futebol sempre tem um pouco dos dois.', 'A drama with a happy ending, I hope. Football always has a bit of both.']), r(['Algumas escolhas no leilão. Mas erro bom é erro que ensina.', 'A few choices at the auction. But a good mistake is one that teaches.'])],
      desconversa: [r(['Nota quem dá é a torcida. Eu só assino a súmula.', 'The fans give the grades. I just sign the paperwork.']), r(['Planejamento é documento interno.', 'The plan is an internal document.']), r(['Faz tempo que não vou ao cinema. Não sei responder.', 'I haven’t been to the cinema in ages. Can’t answer that.']), r(['A rodada 1 já passou. Eu só ando pra frente.', 'Round 1 is gone. I only move forward.'])],
    },
    efeito: { provoca: EF.cobranca, diplomata: EF.renda, desconversa: EF.nada },
    manchete: {
      provoca: [['"{frase}": presidente do {clube} se dá nota máxima no meio da temporada', '"{frase}": {clube} president gives himself top marks at the halfway point'], ['Meio de temporada e o presidente do {clube} já fala como campeão', 'Halfway through and {clube} president already talks like a champion'], ['{clube} em {pos}º e presidente chama o resto da {div} de figurante', '{clube} in {pos}th and president calls the rest of the {div} extras']],
      diplomata: [['Balanço da metade: presidente do {clube} vê pontos a corrigir', 'Halfway review: {clube} president sees things to fix'], ['"{frase}": o {clube} na metade da temporada {temp}', '"{frase}": {clube} at the halfway point of season {temp}'], ['{clube} chega à metade em {pos}º com discurso de pé no chão', '{clube} reach halfway in {pos}th with a feet-on-the-ground speech']],
      desconversa: [['Meio de temporada e presidente do {clube} não faz balanço', 'Halfway point and {clube} president refuses to take stock'], ['"{frase}": {clube} chega à metade sem dar nota', '"{frase}": {clube} reach halfway without a grade'], ['Presidente do {clube} só olha pra frente na metade da temporada', '{clube} president only looks ahead at the halfway mark']],
    },
  },
  {
    id: 'temporada_morna', rep: ['clarice', 'mila'], prioridade: 1,
    quando: c => c.totalRodadas >= 10 && c.rodada === c.totalRodadas - 5 && !c.zonaSubir && !c.zonaCair && !c.lider,
    perguntas: [
      ['Faltam cinco rodadas e o {clube} está no meio da tabela, sem briga lá em cima nem lá embaixo. Já dá pra mandar o elenco de férias?', 'Five rounds left and {clube} are mid-table, nothing to fight for at either end. Can the squad go on holiday already?'],
      ['Meio da tabela, sem pressão. O torcedor deve continuar indo ao estádio?', 'Mid-table, no pressure. Should fans keep coming to the stadium?'],
      ['Dizem que tem jogador pesquisando passagem pra praia. Procede?', 'They say some players are already searching for beach flights. True?'],
      ['Fim de temporada sem emoção na tabela. O senhor vai usar essas rodadas pra quê?', 'A season ending with nothing at stake. What will you use these rounds for?'],
    ],
    respostas: {
      provoca: [r(['Férias? O próximo que falar em praia treina em dois períodos até o fim do ano.', 'Holiday? The next one who says beach trains twice a day until the end of the year.']), r(['Deve. Quem vem agora é torcedor de verdade, não turista de final.', 'They should. Whoever comes now is a real fan, not a finals tourist.']), r(['Procede. Já confisquei o chinelo de todo mundo.', 'True. I’ve already confiscated everyone’s flip-flops.']), r(['Pra estragar a temporada dos outros. Tem muito time precisando de ponto, e a gente não vai dar.', 'To ruin other people’s seasons. Plenty of teams need points, and we’re not giving any.'])],
      diplomata: [r(['Não. Cada rodada vale posição, premiação e respeito.', 'No. Every round is worth position, prize money and respect.']), r(['Deve, e eu agradeço muito quem vem. A gente vai dar motivo.', 'They should, and I thank everyone who comes. We’ll give them a reason.']), r(['Ninguém aqui está de férias. Ainda tem contrato e camisa pra honrar.', 'Nobody here is on holiday. There are still contracts and a shirt to honour.']), r(['Pra testar jogador e pensar no leilão da próxima temporada.', 'To test players and plan for next season’s auction.'])],
      desconversa: [r(['Férias é assunto do departamento pessoal.', 'Holidays are an HR matter.']), r(['Ingresso tá à venda. O resto é com o torcedor.', 'Tickets are on sale. The rest is up to the fans.']), r(['Não sigo jogador em site de passagem.', 'I don’t follow players on travel sites.']), r(['Vou usar pra descansar da imprensa, se possível.', 'I’ll use them to rest from the press, if possible.'])],
    },
    efeito: { provoca: EF.cobranca, diplomata: EF.moralMais, desconversa: EF.moralMenos },
    manchete: {
      provoca: [['"{frase}": presidente do {clube} cancela a praia do elenco', '"{frase}": {clube} president cancels the squad’s beach trip'], ['Meio da tabela, nada de folga: {clube} promete atrapalhar os outros', 'Mid-table, no slacking: {clube} vow to spoil others’ seasons'], ['Presidente do {clube} confisca chinelo e promete fim de temporada quente', '{clube} president confiscates flip-flops and promises a hot finish']],
      diplomata: [['Sem briga na tabela, {clube} fala em honrar a camisa até o fim', 'Nothing to play for, {clube} talk about honouring the shirt to the end'], ['"{frase}": o {clube} na reta final sem pressão', '"{frase}": {clube} in the run-in with no pressure'], ['{clube} já pensa no leilão da próxima temporada', '{clube} already thinking about next season’s auction']],
      desconversa: [['Fim de temporada morno e coletiva mais morna ainda no {clube}', 'A lukewarm season finish and an even more lukewarm presser at {clube}'], ['"{frase}": clima de férias no {clube}?', '"{frase}": holiday mood at {clube}?'], ['Presidente do {clube} também parece querer férias', '{clube} president seems to want a holiday too']],
    },
  },
  {
    id: 'lanterna', rep: ['rogerio', 'mila'], prioridade: 2,
    quando: c => !c.copa && c.total > 1 && c.pos === c.total && c.rodada >= 5 && c.rodada <= c.totalRodadas,
    perguntas: [
      ['Lanterna da {div}. Presidente, pelo menos a lanterna ilumina o caminho?', 'Rock bottom of the {div}. Mr. President, is there any light down there?'],
      ['Daqui de baixo só dá pra subir, ou ainda tem porão?', 'From down here you can only go up, or is there a basement?'],
      ['Hoje o {clube} é o pior time da {div}. Dói ouvir isso?', 'Right now {clube} are the worst team in the {div}. Does that hurt?'],
      ['Tem torcedor dizendo que o time tá na lanterna e sem pilha. O senhor troca a pilha ou a lanterna?', 'Some fans say the team is bottom and out of batteries. Do you change the batteries or the whole torch?'],
    ],
    respostas: {
      provoca: [r(['Ilumina, sim: dá pra ver direitinho quem vai ficar pra trás quando a gente subir.', 'There is: you can clearly see who’ll be left behind when we climb.']), r(['Porão é onde vai morar quem tá rindo da gente agora.', 'The basement is where those laughing at us now will end up living.']), r(['Dói nada. Tabela de agora é rascunho. O {clube} não cai, anota aí.', 'Not at all. Today’s table is a draft. {clube} aren’t going down, write that down.'], 'nao_cair'), r(['Troco a pilha. Lanterna boa a gente tem, só esqueceu de ligar.', 'I change the batteries. The torch is fine, we just forgot to switch it on.'])],
      diplomata: [r(['É o momento mais difícil. Cabe a mim trazer calma e trabalho.', 'It’s the hardest moment. It’s on me to bring calm and work.']), r(['Só dá pra subir. E vamos subir degrau por degrau.', 'You can only go up. And we’ll climb one step at a time.']), r(['Dói, e tem que doer. Quem não se incomoda com o último lugar não sai dele.', 'It hurts, and it should. Whoever isn’t bothered by last place never leaves it.']), r(['Primeiro a pilha: confiança. Ninguém vai ser jogado fora no meio do caminho.', 'Batteries first: confidence. Nobody gets thrown away halfway.'])],
      desconversa: [r(['Não comento tabela antes do fim.', 'I don’t comment on the table before the end.']), r(['Porão, sótão… não entendo de arquitetura.', 'Basement, attic… I don’t know architecture.']), r(['Pior ou melhor, quem diz é o campo.', 'Worst or best, the pitch decides.']), r(['Pilha e lanterna é com o almoxarifado.', 'Batteries and torches are for the storeroom.'])],
    },
    efeito: { provoca: EF.cobranca, diplomata: EF.moralMais, desconversa: EF.moralMenos },
    manchete: {
      provoca: [['"{frase}": na lanterna, presidente do {clube} promete reação', '"{frase}": rock bottom, {clube} president promises a turnaround'], ['Último lugar e boca grande: o presidente do {clube} não se rende', 'Last place and a big mouth: {clube} president won’t surrender'], ['Presidente do {clube} troca a pilha e jura que a lanterna acende', '{clube} president changes the batteries and swears the torch will shine']],
      diplomata: [['Lanterna da {div}, presidente do {clube} pede calma e trabalho', 'Bottom of the {div}, {clube} president calls for calm and work'], ['"{frase}": o {clube} encara o último lugar', '"{frase}": {clube} face up to last place'], ['{clube} no fundo da tabela e discurso de reconstrução', '{clube} at the bottom and a rebuilding speech']],
      desconversa: [['Último lugar e nenhuma explicação no {clube}', 'Last place and no explanation at {clube}'], ['"{frase}": presidente do {clube} não quer falar da lanterna', '"{frase}": {clube} president won’t talk about the bottom spot'], ['Lanterna apagada e coletiva às escuras no {clube}', 'Torch off and a presser in the dark at {clube}']],
    },
  },
  {
    id: 'vice_lider', rep: ['tiao', 'rogerio'], prioridade: 1,
    quando: c => c.total > 2 && c.pos === 2 && !c.lider && meio(c) && c.rodada < c.totalRodadas - 1,
    perguntas: [
      ['Vice-líder da {div}! O líder já tá sentindo o bafo do {clube} no cangote?', 'Second in the {div}! Can the leaders feel {clube} breathing down their neck?'],
      ['Dizem que o segundo lugar é o primeiro dos perdedores. O senhor concorda?', 'They say second place is the first loser. Do you agree?'],
      ['Olhando pra cima, só tem um time. Dá pra dormir com essa vista?', 'Looking up, there’s only one team. Can you sleep with that view?'],
      ['O que falta pro {clube} passar do segundo pro primeiro?', 'What’s missing for {clube} to go from second to first?'],
    ],
    respostas: {
      provoca: [r(['Sentindo e suando. Já pediram até pra gente escovar os dentes.', 'Feeling it and sweating. They’ve even asked us to brush our teeth.']), r(['Concordo. Por isso não pretendo ficar aqui muito tempo.', 'I agree. That’s why I don’t plan on staying here long.'], 'titulo'), r(['Durmo ótimo. Quem tem insônia é quem tá na frente, olhando pelo retrovisor.', 'I sleep great. The insomniac is the one in front, staring at the rear-view mirror.']), r(['Falta o líder tropeçar. E ele vai, porque as pernas já estão tremendo.', 'For the leaders to trip. And they will, their legs are already shaking.'])],
      diplomata: [r(['A gente olha pra nós, não pro cangote de ninguém. Respeito ao líder.', 'We look at ourselves, not at anyone’s neck. Respect for the leaders.']), r(['Não concordo. Segundo lugar com trabalho é degrau, não derrota.', 'I don’t. Second place earned through work is a step, not a defeat.']), r(['Durmo, sim. A vista é boa e dá vontade de subir mais um andar.', 'I do. It’s a nice view and it makes you want to go up one more floor.']), r(['Regularidade. Ganhar os jogos que a gente tem que ganhar.', 'Consistency. Winning the games we’re supposed to win.'])],
      desconversa: [r(['Não fico reparando no cangote alheio.', 'I don’t go staring at other people’s necks.']), r(['Ditado é coisa de vó. Eu olho a tabela no fim.', 'Sayings are for grandmas. I check the table at the end.']), r(['Vista é assunto de corretor de imóvel.', 'Views are for estate agents.']), r(['Faltam rodadas. Quando acabarem, a gente vê.', 'Rounds are what’s missing. When they’re done, we’ll see.'])],
    },
    efeito: { provoca: EF.cobranca, diplomata: EF.renda, desconversa: EF.nada },
    manchete: {
      provoca: [['"{frase}": vice-líder, presidente do {clube} assusta o primeiro colocado', '"{frase}": in second, {clube} president rattles the leaders'], ['{clube} em 2º e presidente já mede o tamanho da faixa', '{clube} in 2nd and president already measuring the sash'], ['Bafo no cangote: {clube} provoca o líder da {div}', 'Breathing down their neck: {clube} taunt the {div} leaders']],
      diplomata: [['Vice-líder, {clube} mantém o respeito e a ambição', 'In second, {clube} keep respect and ambition'], ['"{frase}": o {clube} de olho no topo da {div}', '"{frase}": {clube} eyeing the top of the {div}'], ['Presidente do {clube} chama o 2º lugar de degrau', '{clube} president calls 2nd place a stepping stone']],
      desconversa: [['{clube} em 2º e presidente nem olha pra cima', '{clube} in 2nd and president won’t even look up'], ['"{frase}": vice-liderança sem discurso no {clube}', '"{frase}": second place with no speech at {clube}'], ['Presidente do {clube} deixa a tabela pro fim', '{clube} president leaves the table for the end']],
    },
  },
  {
    id: 'pobre_mas_feliz', rep: ['clarice'], prioridade: 1, dinheiro: true,
    quando: c => c.caixaBaixo && c.vitoriasSeguidas >= 3 && c.vitoriasSeguidas < 5,
    perguntas: [
      ['Caixa no vermelho e {seq} vitórias seguidas. Presidente, dinheiro não traz felicidade mesmo?', 'Accounts in the red and {seq} wins in a row. Mr. President, money really doesn’t buy happiness?'],
      ['O time ganha, mas a conta não fecha. Qual dos dois o senhor comemora hoje?', 'The team wins but the books don’t balance. Which one are you celebrating today?'],
      ['Tem credor batendo na porta e torcida cantando na arquibancada. Como o senhor lida com isso?', 'Creditors at the door and fans singing in the stands. How do you handle that?'],
      ['Se o time continuar vencendo, o caixa se resolve sozinho?', 'If the team keeps winning, will the money sort itself out?'],
    ],
    respostas: {
      provoca: [r(['Não traz. Mas paga a pizza da comemoração, e essa tá parcelada em dez vezes.', 'It doesn’t. But it pays for the celebration pizza, and that one’s on ten instalments.']), r(['Comemoro a vitória. A conta não foi convidada pra festa.', 'I celebrate the win. The books weren’t invited to the party.']), r(['Com o credor eu canto junto. Quem sabe ele vira sócio-torcedor.', 'I sing along with the creditors. Maybe they’ll buy season tickets.']), r(['Se resolve. Vitória enche estádio, estádio enche caixa. Economia da bola.', 'It will. Wins fill the stadium, the stadium fills the till. Football economics.'])],
      diplomata: [r(['Traz tranquilidade. Mas vencer ajuda a pagar as contas também.', 'It brings peace of mind. But winning helps pay the bills too.']), r(['Comemoro a vitória com responsabilidade. A conta a gente arruma com gestão.', 'I celebrate the win responsibly. The books we fix with management.']), r(['Com transparência. Cada credor vai receber, no tempo certo.', 'With transparency. Every creditor will be paid, in due time.']), r(['Ajuda muito, mas não resolve sozinho. Vamos cortar onde der.', 'It helps a lot, but won’t fix it alone. We’ll cut where we can.'])],
      desconversa: [r(['Felicidade não aparece no balanço. Próxima.', 'Happiness doesn’t show up on the balance sheet. Next.']), r(['Conta é com a contabilidade. Vitória é com a torcida.', 'Books are for the accountants. Wins are for the fans.']), r(['Em dia de jogo eu não atendo a porta.', 'I don’t answer the door on match days.']), r(['Não faço previsão financeira em coletiva.', 'I don’t make financial forecasts at pressers.'])],
    },
    efeito: { provoca: EF.renda, diplomata: EF.moralMais, desconversa: EF.nada },
    manchete: {
      provoca: [['"{frase}": duro, mas vencendo, presidente do {clube} faz piada com o caixa', '"{frase}": broke but winning, {clube} president jokes about the money'], ['{seq} vitórias e conta no vermelho: o {clube} vive de bola', '{seq} wins and red ink: {clube} live on football alone'], ['Presidente do {clube} quer o credor na arquibancada', '{clube} president wants creditors in the stands']],
      diplomata: [['{clube} vence em campo e promete arrumar as contas fora dele', '{clube} win on the pitch and promise to fix the books off it'], ['"{frase}": o {clube} entre a vitória e a planilha', '"{frase}": {clube} between wins and spreadsheets'], ['Sequência boa e caixa apertado: presidente do {clube} pede responsabilidade', 'Good run and tight finances: {clube} president calls for responsibility']],
      desconversa: [['Presidente do {clube} não abre a porta nem pro credor nem pra imprensa', '{clube} president won’t open the door to creditors or the press'], ['"{frase}": {clube} separa o campo do caixa', '"{frase}": {clube} keep the pitch and the till apart'], ['Vitória em campo, silêncio na planilha do {clube}', 'Wins on the pitch, silence on {clube}’s spreadsheet']],
    },
  },
  {
    id: 'varzea', rep: ['tiao', 'mila'], prioridade: 1,
    quando: c => c.div === 'V' && c.rodada === 4,
    perguntas: [
      ['Presidente, o {clube} está na Várzea. Como é a vida longe dos holofotes?', 'Mr. President, {clube} are in the Várzea. How’s life away from the spotlight?'],
      ['O vestiário aqui tem chuveiro quente ou é na base da coragem?', 'Does the locker room here have hot showers or is it pure courage?'],
      ['Campo esburacado, bola murcha, cinco torcedores e um cachorro. É aqui que nasce campeão?', 'A bumpy pitch, a flat ball, five fans and a dog. Is this where champions are born?'],
      ['Quanto tempo o {clube} pretende ficar na Várzea?', 'How long do {clube} plan to stay in the Várzea?'],
    ],
    respostas: {
      provoca: [r(['Longe dos holofotes? A gente é o holofote. A Várzea nunca teve tanta luz.', 'Away from the spotlight? We are the spotlight. The Várzea has never been so bright.']), r(['Chuveiro frio forma caráter. Quem aguenta isso aguenta qualquer clássico.', 'Cold showers build character. Survive that and you survive any derby.']), r(['E o cachorro é nosso maior torcedor. Late mais que muita organizada por aí.', 'And the dog is our biggest fan. Barks louder than plenty of ultras.']), r(['O mínimo possível. Já mandei fazer a mala.', 'As little as possible. I’ve already packed the bags.'], 'subir')],
      diplomata: [r(['Com humildade. Muito clube grande já pisou em terra batida um dia.', 'With humility. Plenty of big clubs walked on a dirt pitch once.']), r(['Tem o que dá pra ter. O resto a gente compensa com vontade.', 'It has what it can. The rest we make up for with heart.']), r(['Nasce, sim. Aqui se aprende a jogar com o que tem.', 'Yes. Here you learn to play with what you’ve got.']), r(['O tempo de construir uma base sólida. Sem pular etapa.', 'As long as it takes to build a solid base. No skipping steps.'])],
      desconversa: [r(['Holofote é assunto da companhia de luz.', 'Spotlights are the power company’s business.']), r(['Chuveiro eu não comento. Tem criança ouvindo.', 'I won’t comment on the showers. There are children listening.']), r(['O cachorro não dá entrevista, e eu também não.', 'The dog doesn’t give interviews, and neither do I.']), r(['A tabela decide. Eu só pago a gasolina da van.', 'The table decides. I just pay for the van’s fuel.'])],
    },
    efeito: { provoca: EF.cobranca, diplomata: EF.moralMais, desconversa: EF.nada },
    manchete: {
      provoca: [['"{frase}": presidente do {clube} se acha o dono da Várzea', '"{frase}": {clube} president thinks he owns the Várzea'], ['{clube} promete sair da Várzea e já fez a mala', '{clube} vow to leave the Várzea and have already packed'], ['Chuveiro frio e boca quente: o {clube} na terra batida', 'Cold showers and hot words: {clube} on the dirt pitch']],
      diplomata: [['Humildade na terra batida: {clube} encara a Várzea com os pés no chão', 'Humility on the dirt: {clube} face the Várzea with feet on the ground'], ['"{frase}": o {clube} recomeça de baixo', '"{frase}": {clube} start again from the bottom'], ['Presidente do {clube} vê a Várzea como escola', '{clube} president sees the Várzea as a school']],
      desconversa: [['Presidente do {clube} não fala do chuveiro nem do cachorro', '{clube} president won’t discuss the showers or the dog'], ['"{frase}": a Várzea do {clube} fica em sigilo', '"{frase}": {clube}’s Várzea life stays private'], ['Na Várzea, o {clube} prefere falar pouco', 'In the Várzea, {clube} prefer to say little']],
    },
  },
  // ⭐ APRESENTAÇÃO DAS LENDAS (22/10, mockup coletiva-apresentacao-lendas.png, Diego: *"pode fazer a letra A e C junto"*).
  // Depois do leilão, se o presidente trouxe LENDA, ela é apresentada na sala de imprensa. Quem fala é SEMPRE o presidente —
  // nunca frase na boca de jogador de verdade (regra do 18/08). {lendas} = os nomes ("Romário, Zico e Kaká"), {lenda1} = o 1º.
  {
    id: 'apresentacao_uma', rep: ['tiao', 'rogerio', 'clarice', 'mila'], prioridade: 3,
    quando: c => (c.apresentacao?.length ?? 0) === 1,
    perguntas: [
      ['Presidente, {lendas} chegou! Foi a contratação da sua vida?', 'Mr. President, {lendas} has arrived! Is this the signing of your life?'],
      ['{lendas} vem pra ser titular absoluto ou vai brigar por posição?', 'Is {lendas} here as an undisputed starter or to fight for a place?'],
      ['O leilão foi pesado. Quanto do caixa ficou em {lendas}?', 'The auction was heavy. How much of the till went on {lendas}?'],
      ['A torcida já fez fila na loja pela camisa do {lendas}. Esperava isso?', 'Fans are queuing at the shop for a {lendas} shirt. Did you expect it?'],
      ['Os rivais dizem que {lendas} é golpe de marketing. Responde?', 'Rivals say {lendas} is a marketing stunt. Your reply?'],
      ['Com {lendas} no elenco, o {clube} muda de patamar já nesta temporada?', 'With {lendas} in the squad, do {clube} step up a level this season?'],
      ['{lendas} vai ter regalia no vestiário ou é igual a todo mundo?', 'Will {lendas} get perks in the dressing room or be like everyone else?'],
    ],
    respostas: {
      provoca: [r(['Da minha vida não. Da vida da {div} inteira.', 'Not of my life. Of the whole {div}’s life.']), r(['Titular? Ele é o motivo de existir escalação.', 'Starter? He’s the reason team sheets exist.']), r(['Golpe de marketing é o elenco deles. O nosso é golpe de futebol.', 'Their squad is the marketing stunt. Ours is a football one.']), r(['Patamar? A gente mudou de prédio.', 'A level? We moved buildings.'], 'subir')],
      diplomata: [r(['Grande contratação, mas quem ganha jogo é o grupo.', 'A great signing, but it’s the group that wins games.']), r(['Vai brigar como todo mundo. Lenda também treina.', 'He’ll fight like everyone else. Legends train too.']), r(['Investimento pensado. O caixa segue saudável.', 'A planned investment. The till is still healthy.']), r(['Chega pra somar. Ninguém aqui é maior que o {clube}.', 'He comes to add. Nobody here is bigger than {clube}.'])],
      desconversa: [r(['Valor de contratação fica entre o clube e o leilão.', 'Signing fees stay between the club and the auction.']), r(['Deixa ele jogar primeiro. Depois a gente conversa.', 'Let him play first. Then we talk.']), r(['Pergunta pra ele em campo, na primeira rodada.', 'Ask him on the pitch, in the first round.']), r(['Hoje é dia de foto, não de discurso.', 'Today is a day for photos, not speeches.'])],
    },
    efeito: { provoca: EF.renda, diplomata: EF.moralMais, desconversa: EF.nada },
    manchete: {
      provoca: [['{clube} apresenta {lendas}: "{frase}"', '{clube} unveil {lendas}: "{frase}"'], ['Presidente do {clube} solta o verbo na chegada de {lendas}', '{clube} president lets rip as {lendas} arrives'], ['{lendas} chega e o {clube} já fala grosso', '{lendas} arrives and {clube} already talk big']],
      diplomata: [['{lendas} é do {clube}: "{frase}"', '{lendas} joins {clube}: "{frase}"'], ['Pés no chão na chegada de {lendas} ao {clube}', 'Feet on the ground as {lendas} joins {clube}'], ['{clube} apresenta {lendas} com discurso de grupo', '{clube} unveil {lendas} with a team-first speech']],
      desconversa: [['{lendas} chega ao {clube} em apresentação curta', '{lendas} joins {clube} in a short unveiling'], ['Foto, sorriso e pouca conversa: {clube} apresenta {lendas}', 'Photo, smile and little talk: {clube} unveil {lendas}'], ['"{frase}": presidente do {clube} guarda o discurso', '"{frase}": {clube} president saves the speech']],
    },
  },
  {
    id: 'apresentacao_varias', rep: ['tiao', 'rogerio', 'clarice', 'mila'], prioridade: 3,
    quando: c => (c.apresentacao?.length ?? 0) >= 2,
    perguntas: [
      ['Presidente, {qtd} lendas de uma vez! Isso é time pra subir já?', 'Mr. President, {qtd} legends at once! Is this a side built to go up right away?'],
      ['{lendas}… o leilão virou excursão de museu?', '{lendas}… did the auction turn into a museum trip?'],
      ['Com {lendas}, quem fica no banco? Vai ter ciúme no vestiário?', 'With {lendas}, who sits on the bench? Jealousy in the dressing room?'],
      ['Quanto custou trazer {lendas}? O caixa aguenta a folha?', 'How much did it cost to bring {lendas}? Can the till handle the wage bill?'],
      ['A cidade parou pra ver {lendas}. Qual o recado pra torcida?', 'The city stopped to see {lendas}. What’s your message to the fans?'],
      ['Os rivais dizem que encher de lenda não ganha campeonato. Concorda?', 'Rivals say stacking legends doesn’t win titles. Agree?'],
      ['De {lendas}, qual foi o que mais deu trabalho no pregão?', 'Of {lendas}, which one gave you the most work at the auction?'],
    ],
    respostas: {
      provoca: [r(['Subir? A gente vai passar direto pela {div}, só acenando.', 'Go up? We’ll wave as we drive straight through {div}.'], 'subir'), r(['Museu é o elenco deles. O nosso é galeria de troféu.', 'Their squad is the museum. Ours is a trophy gallery.']), r(['Ciúme vai ter no vestiário dos rivais, vendo a nossa escalação.', 'The jealousy will be in the rivals’ dressing room, looking at our team sheet.']), r(['Diz isso pra quem perder pra gente.', 'Tell that to whoever loses to us.'])],
      diplomata: [r(['Grandes reforços, mas nome não entra em campo sozinho.', 'Great signings, but names don’t take the field on their own.']), r(['Banco forte é sinal de time grande. Todo mundo vai jogar.', 'A strong bench is a sign of a big team. Everyone will play.']), r(['Contratamos dentro do que o caixa permite. Tudo planejado.', 'We signed within what the till allows. All planned.']), r(['Recado pra torcida: venham, o estádio é de vocês.', 'Message to the fans: come, the stadium is yours.'])],
      desconversa: [r(['Valor fica entre o clube e o leilão.', 'Fees stay between the club and the auction.']), r(['Pregão é pregão. Ganhou, levou.', 'An auction is an auction. You win it, you take it.']), r(['Hoje é dia de foto. A conversa fica pra depois da 1ª rodada.', 'Today is for photos. The talking waits until after round one.']), r(['Escalação eu decido na hora. Próxima pergunta.', 'I pick the team on the day. Next question.'])],
    },
    efeito: { provoca: EF.renda, diplomata: EF.moralMais, desconversa: EF.nada },
    manchete: {
      provoca: [['{clube} apresenta {lendas}: "{frase}"', '{clube} unveil {lendas}: "{frase}"'], ['{qtd} lendas e muita provocação na apresentação do {clube}', '{qtd} legends and plenty of trash talk at the {clube} unveiling'], ['O {clube} abriu o cofre e a boca: chegaram {lendas}', '{clube} opened the vault and their mouth: {lendas} have arrived']],
      diplomata: [['{clube} apresenta {lendas} com pé no chão: "{frase}"', '{clube} unveil {lendas} with feet on the ground: "{frase}"'], ['{qtd} lendas de uma vez: {clube} faz a festa da torcida', '{qtd} legends at once: {clube} throw a party for the fans'], ['Reforços de peso: {lendas} vestem a camisa do {clube}', 'Heavyweight signings: {lendas} pull on the {clube} shirt']],
      desconversa: [['{lendas} chegam ao {clube} em apresentação curta', '{lendas} join {clube} in a short unveiling'], ['Muita lenda e pouca palavra na apresentação do {clube}', 'Plenty of legends and few words at the {clube} unveiling'], ['"{frase}": presidente do {clube} deixa a foto falar', '"{frase}": {clube} president lets the photo do the talking']],
    },
  },
]

// ── sorteio preso na semente ───────────────────────────────────────────────────────────────────────────────────
function rng(seed: number): () => number {
  let a = (seed >>> 0) || 1
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
}
const pick = <T,>(arr: T[], rand: () => number): T => arr[Math.floor(rand() * arr.length) % arr.length]
// escolhe um índice ainda não usado nesta temporada; esgotou, libera tudo
function idxLivre(n: number, usadas: Set<string>, chave: string, rand: () => number): number {
  const livres: number[] = []
  for (let i = 0; i < n; i++) if (!usadas.has(`${chave}:${i}`)) livres.push(i)
  return livres.length ? pick(livres, rand) : Math.floor(rand() * n)
}

// ── o que fica no SAVE ──────────────────────────────────────────────────────────────────────────────────────────
export interface ColetivaFeita {
  t: number; r: number; sit: SituacaoId; rep: ReporterId; estilo: Estilo | 'pulou'
  pergunta: Par; frase: Par | null; manchete: Par | null; promessa?: Promessa; dinheiro?: boolean
}
export interface PromessaFeita { t: number; r: number; tipo: Promessa; frase: Par; cumprida?: boolean }
export interface ColetivaSave {
  feitas: ColetivaFeita[]        // histórico (as últimas 60)
  usadas: string[]               // chaves "sit:q:i" / "sit:estilo:i" / "sit:m:estilo:i" usadas NESTA temporada
  usadasTemporada: number        // temporada a que `usadas` pertence (virou a temporada, zera)
  contagem: Record<Estilo | 'pulou', number>
  dinheiroDesconversa: number    // perguntas de dinheiro respondidas com "desconversa" (pra fama Pão-duro)
  promessas: PromessaFeita[]
  pulosSeguidos: number
  ultimaRodada: number           // última rodada em que houve coletiva (pra não acordar toda hora)
  ultimaTemporada: number
  arquirrival: string | null     // 🔥 o rival de verdade (nome do clube)
  arquirrivalDesde: number       // temporada em que foi definido/trocado
  h2hPor: Record<string, [number, number, number]> // retrospecto contra CADA rival da carreira (V, E, D), na pirâmide
  h2hChaves: string[]            // "t:r" já contados (as últimas 10), pra não somar o mesmo jogo duas vezes
  efeitos: EfeitoPendente[]      // o que a resposta fez e ainda não aconteceu (moral no próximo jogo, rival no clássico)
  ultimoClassico?: { t: number; res: 'V' | 'E' | 'D' } // o último jogo contra o ARQUIRRIVAL (pra cobrar a promessa de troco)
}
/** `r` = ÍNDICE 0-based do jogo em que o efeito entra (o mesmo índice do `RoundMods` do motor). */
export interface EfeitoPendente { tipo: 'moral' | 'rival'; delta: number; t: number; r: number }
export const COLETIVA_VAZIA = (): ColetivaSave => ({ feitas: [], usadas: [], usadasTemporada: 0, contagem: { provoca: 0, diplomata: 0, desconversa: 0, pulou: 0 }, dinheiroDesconversa: 0, promessas: [], pulosSeguidos: 0, ultimaRodada: -99, ultimaTemporada: 0, arquirrival: null, arquirrivalDesde: 0, h2hPor: {}, h2hChaves: [], efeitos: [] })
/** save antigo/sem os campos novos → completa com o vazio (nunca quebra) */
export const coletivaSana = (s: Partial<ColetivaSave> | undefined | null): ColetivaSave => ({ ...COLETIVA_VAZIA(), ...(s ?? {}), contagem: { ...COLETIVA_VAZIA().contagem, ...(s?.contagem ?? {}) } })
/** soma o resultado de um jogo contra um rival (uma vez por jogo) */
export function somaH2H(save: ColetivaSave, rival: string, chave: string, res: 'V' | 'E' | 'D'): ColetivaSave {
  if (save.h2hChaves.includes(chave)) return save
  const [v, e, d] = save.h2hPor[rival] ?? [0, 0, 0]
  const novo: [number, number, number] = [v + (res === 'V' ? 1 : 0), e + (res === 'E' ? 1 : 0), d + (res === 'D' ? 1 : 0)]
  return { ...save, h2hPor: { ...save.h2hPor, [rival]: novo }, h2hChaves: [...save.h2hChaves.slice(-9), chave] }
}
/** os modificadores de força que o motor lê (mgr → índice do jogo → delta), só da temporada atual */
export function modsDaColetiva(save: ColetivaSave | undefined, temporada: number): Record<number, number> {
  const out: Record<number, number> = {}
  for (const e of save?.efeitos ?? []) if (e.t === temporada) out[e.r] = (out[e.r] ?? 0) + e.delta
  return out
}

export interface ColetivaPronta {
  sit: SituacaoId; rep: Reporter; pergunta: Par; qi: number
  opcoes: { estilo: Estilo; ri: number; frase: Par; efeito: Efeito; promessa?: Promessa }[]
  vars: Record<string, string>
}

// ⏱️ a frequência: prioridade 3 sempre que acorda; 2 só se a última coletiva foi há 2+ rodadas; 1 só se há 4+ rodadas.
// Resultado: numa temporada normal dá umas 5–8 coletivas, nunca duas seguidas por motivo pequeno.
const ESPERA: Record<1 | 2 | 3, number> = { 3: 0, 2: 2, 1: 4 }
// assuntos que podem voltar na MESMA temporada (cada jogo é um jogo); o resto é uma vez por temporada
const REPETE = new Set<SituacaoId>(['goleada_pro', 'goleada_contra', 'vitoria_rival', 'derrota_rival', 'empate_rival', 'virada', 'classico_proximo', 'vespera_classico', 'vespera_final', 'copa_final', 'copa_eliminado', 'copa_campeao', 'caixa_vazio', 'fuga', 'proposta_craque', 'jogo_maluco'])

/** Monta a coletiva da rodada (ou null se não tem assunto / é cedo demais). Determinística: mesma semente, mesma coletiva. */
export function montaColetiva(ctx: Ctx, save: ColetivaSave, seed: number): ColetivaPronta | null {
  const usadas = new Set(save.usadasTemporada === ctx.temporada ? save.usadas : [])
  const desdeUltima = save.ultimaTemporada === ctx.temporada ? ctx.rodada - save.ultimaRodada : 99
  const rand = rng((seed * 7919 + ctx.temporada * 131 + ctx.rodada * 17 + (ctx.vespera ? 5 : 0)) >>> 0)
  const feitasTemp = new Set(save.feitas.filter(f => f.t === ctx.temporada).map(f => f.sit))
  const candidatas = SITUACOES.filter(s => {
    if (ctx.vespera ? !(s.id === 'vespera_final' || s.id === 'vespera_classico') : (s.id === 'vespera_final' || s.id === 'vespera_classico')) return false
    const ehApres = s.id === 'apresentacao_uma' || s.id === 'apresentacao_varias'
    if (ctx.apresentacao?.length ? !ehApres : ehApres) return false // ⭐ a apresentação só acontece no momento dela, e nada mais acontece nele
    if (feitasTemp.has(s.id) && !REPETE.has(s.id)) return false // o mesmo assunto só volta na temporada que vem
    try { if (!s.quando(ctx)) return false } catch { return false }
    return desdeUltima >= ESPERA[s.prioridade]
  })
  if (!candidatas.length) return null
  const top = Math.max(...candidatas.map(s => s.prioridade))
  const sit = pick(candidatas.filter(s => s.prioridade === top), rand)
  const qi = idxLivre(sit.perguntas.length, usadas, `${sit.id}:q`, rand)
  const rep = REPORTERES[pick(sit.rep, rand)]
  const opcoes = ESTILOS.map(estilo => {
    const ri = idxLivre(sit.respostas[estilo].length, usadas, `${sit.id}:${estilo}`, rand)
    const resp = sit.respostas[estilo][ri]
    return { estilo, ri, frase: resp.txt, efeito: sit.efeito[estilo], promessa: resp.promessa }
  })
  return { sit: sit.id, rep, pergunta: sit.perguntas[qi], qi, opcoes, vars: variaveis(ctx) }
}

function juntaNomes(ns: string[]): string { return ns.length <= 1 ? (ns[0] ?? '') : `${ns.slice(0, -1).join(', ')} ${getLang() === 'en' ? 'and' : 'e'} ${ns[ns.length - 1]}` }
function variaveis(c: Ctx): Record<string, string> {
  const n = c.artilheiro?.nome ?? c.goleiroPenalti ?? c.cansado ?? c.lesionado ?? c.criaEstreou ?? c.reserva ?? c.proposta?.nome ?? c.bolaOuro ?? ''
  const comp = c.intl === 'liberta' ? 'Libertadores' : c.intl === 'champions' ? 'Champions' : c.intl === 'mundial' ? 'Mundial' : c.copa ? 'Copa' : ''
  return {
    adv: c.proposta?.clube ?? c.placar?.adv ?? '', n, g: String(c.artilheiro?.gols ?? ''), pos: String(c.pos), div: c.div === 'V' ? 'Várzea' : `Série ${c.div}`,
    seq: String(Math.max(c.semVencer, c.vitoriasSeguidas)), rival: c.rival ?? '', clube: c.clube,
    valor: String(c.proposta?.valor ?? c.caixa), temp: String(c.temporada), gf: String(c.placar?.gf ?? ''), ga: String(c.placar?.ga ?? ''), comp,
    lendas: juntaNomes(c.apresentacao ?? []), qtd: String(c.apresentacao?.length ?? 0), lenda1: c.apresentacao?.[0] ?? '',
  }
}
export function preenche(p: Par, vars: Record<string, string>, lang: 'pt' | 'en' = getLang() === 'en' ? 'en' : 'pt'): string {
  return p[lang === 'en' ? 1 : 0].replace(/\{(\w+)\}/g, (_, k: string) => vars[k] ?? '')
}
/** a manchete do Martelo pra resposta escolhida (a frase entra já preenchida no lugar de {frase}) */
export function mancheteDe(sit: SituacaoId, estilo: Estilo, vars: Record<string, string>, frase: Par, usadas: Set<string>, rand: () => number): { manchete: Par; mi: number } {
  const s = SITUACOES.find(x => x.id === sit)!
  const mi = idxLivre(s.manchete[estilo].length, usadas, `${sit}:m:${estilo}`, rand)
  const m = s.manchete[estilo][mi]
  const fill = (txt: string, lang: 'pt' | 'en') => txt.replace('{frase}', preenche(frase, vars, lang)).replace(/\{(\w+)\}/g, (_, k: string) => vars[k] ?? '')
  return { manchete: [fill(m[0], 'pt'), fill(m[1], 'en')], mi }
}

/** Aplica a escolha do jogador no save (pura: devolve save novo + o que o store tem que fazer). `estilo` null = pulou. */
/** `alvo`: índice do próximo jogo (moral) e do próximo clássico (rival) — quem chama sabe o calendário; null = não há. */
export function respondeColetiva(save: ColetivaSave, pronta: ColetivaPronta, estilo: Estilo | null, ctx: Ctx, seed: number, alvo: { proximo: number | null; classico: number | null } = { proximo: null, classico: null }): { save: ColetivaSave; efeito: Efeito | null; manchete: Par | null } {
  const base = save.usadasTemporada === ctx.temporada ? save : { ...save, usadas: [], usadasTemporada: ctx.temporada }
  const usadas = new Set(base.usadas)
  usadas.add(`${pronta.sit}:q:${pronta.qi}`)
  const sitDef = SITUACOES.find(x => x.id === pronta.sit)!
  const feita: ColetivaFeita = { t: ctx.temporada, r: ctx.rodada, sit: pronta.sit, rep: pronta.rep.id, estilo: estilo ?? 'pulou', pergunta: pronta.pergunta, frase: null, manchete: null, dinheiro: sitDef.dinheiro }
  const contagem = { ...base.contagem }
  let efeito: Efeito | null = null, manchete: Par | null = null
  let promessas = base.promessas, dinheiroDesconversa = base.dinheiroDesconversa
  let pulos = base.pulosSeguidos
  if (estilo) {
    const op = pronta.opcoes.find(o => o.estilo === estilo)!
    usadas.add(`${pronta.sit}:${estilo}:${op.ri}`)
    const vars = pronta.vars
    const m = mancheteDe(pronta.sit, estilo, vars, op.frase, usadas, rng((seed * 31 + ctx.temporada * 7 + ctx.rodada) >>> 0))
    usadas.add(`${pronta.sit}:m:${estilo}:${m.mi}`)
    manchete = m.manchete
    efeito = op.efeito
    // frase guardada JÁ preenchida nas duas línguas (o save não guarda o contexto)
    feita.frase = [preenche(op.frase, vars, 'pt'), preenche(op.frase, vars, 'en')]
    feita.manchete = manchete
    feita.promessa = op.promessa
    contagem[estilo]++
    if (sitDef.dinheiro && estilo === 'desconversa') dinheiroDesconversa++
    if (op.promessa) promessas = [...promessas.slice(-30), { t: ctx.temporada, r: ctx.rodada, tipo: op.promessa, frase: feita.frase }]
    pulos = 0
  } else { contagem.pulou++; pulos++ }
  let efeitos = (base.efeitos ?? []).filter(e => e.t === ctx.temporada)
  if (efeito?.tipo === 'moral_alta' && alvo.proximo != null) efeitos = [...efeitos, { tipo: 'moral', delta: efeito.valor, t: ctx.temporada, r: alvo.proximo }]
  if (efeito?.tipo === 'moral_baixa' && alvo.proximo != null) efeitos = [...efeitos, { tipo: 'moral', delta: -efeito.valor, t: ctx.temporada, r: alvo.proximo }]
  if (efeito?.tipo === 'rival_motivado' && alvo.classico != null) efeitos = [...efeitos, { tipo: 'rival', delta: -efeito.valor, t: ctx.temporada, r: alvo.classico }]
  return {
    save: { ...base, feitas: [...base.feitas.slice(-59), feita], usadas: [...usadas], contagem, dinheiroDesconversa, promessas, pulosSeguidos: pulos, ultimaRodada: ctx.rodada, ultimaTemporada: ctx.temporada, efeitos },
    efeito, manchete,
  }
}

// ── 🏷️ fama do presidente ──────────────────────────────────────────────────────────────────────────────────────
export type FamaId = 'novato' | 'polemista' | 'diplomata' | 'escorregadio' | 'mudo' | 'sonhador' | 'paoduro'
export const FAMAS: Record<FamaId, { nome: Par; desc: Par; emoji: string }> = {
  novato: { nome: ['Novato na imprensa', 'New to the press'], desc: ['ainda deu poucas coletivas', 'has given few pressers so far'], emoji: '🎙️' },
  polemista: { nome: ['O Polemista', 'The Firebrand'], desc: ['não deixa provocação sem resposta', 'never lets a taunt go unanswered'], emoji: '😈' },
  diplomata: { nome: ['O Diplomata', 'The Diplomat'], desc: ['respeita até quem não merece', 'respects even those who don’t deserve it'], emoji: '🧊' },
  escorregadio: { nome: ['O Escorregadio', 'The Slippery One'], desc: ['nunca responde o que perguntam', 'never answers what is asked'], emoji: '🚪' },
  mudo: { nome: ['O Mudo', 'The Silent One'], desc: ['some da coletiva mais do que aparece', 'skips more pressers than he attends'], emoji: '🤐' },
  sonhador: { nome: ['O Sonhador', 'The Dreamer'], desc: ['promete título toda semana', 'promises a title every week'], emoji: '🌙' },
  paoduro: { nome: ['O Pão-duro', 'The Tightwad'], desc: ['muda de assunto quando falam em dinheiro', 'changes the subject when money comes up'], emoji: '🪙' },
}
export function famaDoPresidente(save: ColetivaSave): FamaId {
  const c = save.contagem
  const respondidas = c.provoca + c.diplomata + c.desconversa
  const total = respondidas + c.pulou
  if (total < 3) return 'novato'
  if (c.pulou >= 4 && c.pulou * 2 >= total) return 'mudo'
  if (save.dinheiroDesconversa >= 3 && save.dinheiroDesconversa >= c.provoca) return 'paoduro'
  const prom = save.promessas.length
  if (prom >= 3 && prom * 3 >= respondidas) return 'sonhador'
  if (c.provoca >= c.diplomata && c.provoca >= c.desconversa) return 'polemista'
  if (c.diplomata >= c.desconversa) return 'diplomata'
  return 'escorregadio'
}

// ── 📰 fim de temporada: promessas cobradas + melhores frases ───────────────────────────────────────────────────
export interface ResultadoTemporada { campeao: boolean; subiu: boolean; caiu: boolean; copaCampeao: boolean; ganhouClassicos: boolean }
const PROMESSA_TXT: Record<Promessa, { ok: Par; falhou: Par }> = {
  titulo: { ok: ['Prometeu o título e CUMPRIU: "{frase}"', 'Promised the title and DELIVERED: "{frase}"'], falhou: ['Prometeu o título… e a faixa ficou na loja: "{frase}"', 'Promised the title… and the sash stayed in the shop: "{frase}"'] },
  subir: { ok: ['Disse que subia, e subiu: "{frase}"', 'Said they’d go up, and they did: "{frase}"'], falhou: ['Garantiu o acesso e ficou pelo caminho: "{frase}"', 'Guaranteed promotion and fell short: "{frase}"'] },
  nao_cair: { ok: ['Garantiu que não caía. Não caiu: "{frase}"', 'Guaranteed they wouldn’t go down. They didn’t: "{frase}"'], falhou: ['"Não cai", disse ele. Caiu: "{frase}"', '"Not going down," he said. They did: "{frase}"'] },
  copa: { ok: ['Prometeu a taça e levantou: "{frase}"', 'Promised the cup and lifted it: "{frase}"'], falhou: ['Prometeu a taça e voltou de mãos vazias: "{frase}"', 'Promised the cup and came home empty-handed: "{frase}"'] },
  classico: { ok: ['Prometeu troco no clássico e deu: "{frase}"', 'Promised derby payback and delivered: "{frase}"'], falhou: ['Prometeu troco no clássico e levou mais um: "{frase}"', 'Promised derby payback and took another one: "{frase}"'] },
}
/** Fecha as promessas da temporada: marca cumprida/falhou e devolve as manchetes (já preenchidas). */
export function fechaPromessas(save: ColetivaSave, temporada: number, res: ResultadoTemporada): { save: ColetivaSave; manchetes: Par[] } {
  const manchetes: Par[] = []
  const ok: Record<Promessa, boolean> = { titulo: res.campeao, subir: res.subiu, nao_cair: !res.caiu, copa: res.copaCampeao, classico: res.ganhouClassicos }
  const vistos = new Set<Promessa>()
  const promessas = save.promessas.map(p => {
    if (p.t !== temporada || p.cumprida !== undefined) return p
    const cumpriu = ok[p.tipo]
    if (!vistos.has(p.tipo)) {
      vistos.add(p.tipo)
      const m = PROMESSA_TXT[p.tipo][cumpriu ? 'ok' : 'falhou']
      manchetes.push([m[0].replace('{frase}', p.frase[0]), m[1].replace('{frase}', p.frase[1])])
    }
    return { ...p, cumprida: cumpriu }
  })
  return { save: { ...save, promessas }, manchetes }
}
/** As frases que marcaram a temporada (provocações e promessas primeiro), pro jornal do fim e pra Sala de imprensa. */
export function melhoresFrases(save: ColetivaSave, temporada: number | null, n = 3): ColetivaFeita[] {
  const peso = (f: ColetivaFeita) => (f.promessa ? 3 : 0) + (f.estilo === 'provoca' ? 2 : f.estilo === 'diplomata' ? 1 : 0)
  return save.feitas.filter(f => f.frase && (temporada === null || f.t === temporada)).sort((a, b) => peso(b) - peso(a) || b.t - a.t || b.r - a.r).slice(0, n)
}

// ── 🔥 ARQUIRRIVAL ─────────────────────────────────────────────────────────────────────────────────────────────
// Um só. Entre os rivais da carreira, pesa: quantas vezes já se enfrentaram (h2h), estar na MESMA divisão agora e ter
// terminado perto na tabela. Na carreira nova é o 1º rival escolhido. Só troca na virada (`arquirrivalDesde`).
export function escolheArquirrival(rivais: { team: string; division: string; h2h: [number, number, number]; lastPos: number | null }[], minhaDiv: string, minhaPos: number | null): string | null {
  if (!rivais.length) return null
  let melhor = rivais[0], nota = -1
  for (const rv of rivais) {
    const jogos = rv.h2h[0] + rv.h2h[1] + rv.h2h[2]
    const perto = rv.lastPos != null && minhaPos != null ? Math.max(0, 4 - Math.abs(rv.lastPos - minhaPos)) : 0
    const n = jogos * 2 + (rv.division === minhaDiv ? 5 : 0) + perto
    if (n > nota) { nota = n; melhor = rv }
  }
  return melhor.team
}
export function retrospectoTexto(h2h: [number, number, number], rival: string): string {
  const [v, e, d] = h2h
  if (v + e + d === 0) return getLang() === 'en' ? `first ever meeting against ${rival}` : `primeiro confronto da história contra o ${rival}`
  return getLang() === 'en' ? `vs ${rival}: ${v}W ${e}D ${d}L` : `contra o ${rival}: ${v}V ${e}E ${d}D`
}

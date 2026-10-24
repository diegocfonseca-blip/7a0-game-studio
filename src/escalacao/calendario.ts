// 📅 CALENDÁRIO DA CARREIRA (24/10, ideia do Diego: *"ter jogo toda quarta e domingo… quarta 21h e domingo 16h… e com isso
// teria o tempo passando"*). Regras PURAS — nenhuma tela, nenhum estado, nenhum dado da partida:
//   · a temporada N acontece no ano 2025 + N, de fevereiro a dezembro (janeiro é a virada);
//   · rodada r da Liga = o r-ésimo DOMINGO a partir do 1º domingo de fevereiro, 16h;
//   · fase da Copa = QUARTA, 21h (etapa 1: nas quartas depois da última rodada, que é quando a Copa roda hoje);
//   · entre um jogo e outro, cada dia vazio tem um RECADO (segunda O MARTELO · terça boletim · quinta rivais · sexta véspera ·
//     sábado concentração) montado só com o que a tela já sabe — nunca com resultado que ainda não apareceu.
// A data é só a régua da tela: a simulação continua contando rodadas, então nada aqui muda placar, tabela ou save.
import { tr } from './lang'

export const CAL_MS_POR_DIA = 1000 // ⏱️ automático: 1 s por dia vazio (Diego aceitou a recomendação, 24/10)
export const HORA_LIGA = 16
export const HORA_COPA = 21

export const anoDaTemporada = (temporada: number): number => 2025 + Math.max(1, temporada || 1)

const DIA_MS = 86400000
function primeiroDomingoDeFevereiro(ano: number): number {
  const t = Date.UTC(ano, 1, 1)
  const dow = new Date(t).getUTCDay() // 0 = domingo
  return t + ((7 - dow) % 7) * DIA_MS
}
/** dia (em ms UTC) da rodada `r` (1..38) da Liga — sempre domingo */
export function diaDaRodada(temporada: number, r: number): number {
  return primeiroDomingoDeFevereiro(anoDaTemporada(temporada)) + (Math.max(1, r) - 1) * 7 * DIA_MS
}
/** dia (em ms UTC) da fase `f` (0 = 1ª) da Copa — sempre quarta, depois da última rodada da Liga */
export function diaDaFaseCopa(temporada: number, f: number): number {
  return diaDaRodada(temporada, 38) + 3 * DIA_MS + Math.max(0, f) * 7 * DIA_MS
}
/** a véspera da 1ª rodada (sábado): o "hoje" da pré-temporada */
export const diaPreTemporada = (temporada: number): number => diaDaRodada(temporada, 1) - DIA_MS
export const somaDias = (dia: number, n: number): number => dia + n * DIA_MS
/** os dias VAZIOS entre dois jogos (sem contar nenhum dos dois) */
export function diasEntre(de: number, ate: number): number[] {
  const out: number[] = []
  for (let d = de + DIA_MS; d < ate; d += DIA_MS) out.push(d)
  return out
}

const DOW_PT = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado']
const DOW_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const DOW_CURTO_PT = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb']
const DOW_CURTO_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MES_PT = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']
const MES_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
export interface DiaFmt { dow: number; semana: string; curto: string; dia: number; mes: string; mesIdx: number; ano: number; longo: string }
export function fmtDia(t: number): DiaFmt {
  const d = new Date(t)
  const dow = d.getUTCDay(), dia = d.getUTCDate(), mesIdx = d.getUTCMonth(), ano = d.getUTCFullYear()
  const semana = tr(DOW_PT[dow], DOW_EN[dow]), curto = tr(DOW_CURTO_PT[dow], DOW_CURTO_EN[dow]), mes = tr(MES_PT[mesIdx], MES_EN[mesIdx])
  const longo = tr(`${semana[0].toUpperCase()}${semana.slice(1)}, ${dia} de ${mes}`, `${semana}, ${mes} ${dia}`)
  return { dow, semana, curto, dia, mes, mesIdx, ano, longo }
}
/** os 7 dias (segunda → domingo) da semana que contém `t` */
export function semanaDe(t: number): number[] {
  const dow = new Date(t).getUTCDay()
  const seg = t - ((dow + 6) % 7) * DIA_MS
  return Array.from({ length: 7 }, (_, i) => seg + i * DIA_MS)
}

// ─── 📰 o RECADO DO DIA ─────────────────────────────────────────────────────────────────────────────────────────────────
export interface CtxRecado {
  temporada: number
  proxAdv?: string; proxCasa?: boolean; proxClassico?: boolean; proxCopa?: boolean
  pos?: number; divNome?: string; lider?: string; liderPts?: number; meusPts?: number
  ultimo?: { gf: number; ga: number; adv: string }
  cansados: number; suspensos: string[]; machucados: string[]
}
export interface Recado { k: string; titulo: string; texto: string }
// a mesma semana sempre escolhe a mesma frase (preso no dia), mas cada semana muda
const escolhe = <T,>(lista: T[], t: number): T => lista[Math.abs(Math.floor(t / DIA_MS)) % lista.length]

export function recadoDoDia(t: number, c: CtxRecado): Recado {
  const dow = new Date(t).getUTCDay()
  const adv = c.proxAdv ?? tr('o adversário', 'the opponent')
  const casa = c.proxCasa ? tr('em casa', 'at home') : tr('fora de casa', 'away')
  const fora = [...c.suspensos.map(n => `${n} (${tr('suspenso', 'suspended')})`), ...c.machucados.map(n => `${n} (${tr('machucado', 'injured')})`)]
  if (dow === 1) { // segunda: O MARTELO da rodada
    const u = c.ultimo
    if (!u) return { k: tr('📰 O MARTELO · segunda', '📰 THE HAMMER · Monday'), titulo: tr('A semana começa', 'The week begins'), texto: tr(`${c.pos ? `${c.pos}º lugar na ${c.divNome}. ` : ''}Domingo tem ${adv}, ${casa}.`, `${c.pos ? `${c.pos}th in the ${c.divNome}. ` : ''}Sunday: ${adv}, ${casa}.`) }
    const v = u.gf > u.ga, e = u.gf === u.ga
    const titulo = v ? escolhe([tr(`Vitória sobre o ${u.adv} anima a semana`, `Win over ${u.adv} lifts the week`), tr(`${u.gf} a ${u.ga}: a torcida dorme feliz`, `${u.gf}-${u.ga}: the fans sleep happy`), tr(`Três pontos e moral em alta`, `Three points and morale up`)], t)
      : e ? escolhe([tr(`Empate com o ${u.adv} deixa gosto amargo`, `Draw with ${u.adv} leaves a bitter taste`), tr(`${u.gf} a ${u.ga}: um ponto e muita resenha`, `${u.gf}-${u.ga}: one point and a lot of talk`)], t)
        : escolhe([tr(`Derrota pro ${u.adv} liga o alerta`, `Loss to ${u.adv} sounds the alarm`), tr(`${u.gf} a ${u.ga}: semana de cobrança no CT`, `${u.gf}-${u.ga}: a tough week at the training ground`), tr(`Torcida cobra reação`, `Fans demand a reaction`)], t)
    return { k: tr('📰 O MARTELO · segunda', '📰 THE HAMMER · Monday'), titulo, texto: tr(`${c.pos ? `${c.pos}º lugar na ${c.divNome}, ${c.meusPts ?? 0} pontos.` : ''}`, `${c.pos ? `${c.pos}th in the ${c.divNome}, ${c.meusPts ?? 0} points.` : ''}`) }
  }
  if (dow === 2) { // terça: boletim do elenco
    const partes: string[] = []
    if (c.cansados) partes.push(tr(`${c.cansados} ${c.cansados === 1 ? 'jogador cansado' : 'jogadores cansados'} 😓`, `${c.cansados} tired ${c.cansados === 1 ? 'player' : 'players'} 😓`))
    if (fora.length) partes.push(tr(`fora: ${fora.join(', ')}`, `out: ${fora.join(', ')}`))
    return { k: tr('🩺 Boletim · terça', '🩺 Squad report · Tuesday'), titulo: partes.length ? tr('Como está o elenco', 'How the squad is doing') : tr('Elenco inteiro', 'Full squad available'), texto: partes.length ? partes.join(' · ') : tr('Ninguém cansado, ninguém fora. O técnico sorri no CT.', 'Nobody tired, nobody out. The coach is smiling.') }
  }
  if (dow === 3) return { k: tr('🏋️ Quarta sem jogo', '🏋️ Midweek, no match'), titulo: tr('Treino no CT', 'Training day'), texto: tr('Semana sem Copa: o elenco treina e o domingo é da Liga.', 'No cup this week: the squad trains and Sunday is for the league.') }
  if (dow === 4) { // quinta: os rivais
    const gap = c.liderPts != null && c.meusPts != null ? c.liderPts - c.meusPts : null
    const titulo = c.pos === 1 ? escolhe([tr('Todo mundo de olho no líder', 'Everyone is chasing the leader'), tr('Na ponta, e com alvo nas costas', 'Top of the table, with a target on the back')], t)
      : c.lider ? escolhe([tr(`${c.lider} segura a ponta`, `${c.lider} holds on at the top`), tr(`${c.lider} lidera a ${c.divNome}`, `${c.lider} leads the ${c.divNome}`)], t) : tr('A divisão esquenta', 'The division heats up')
    const texto = c.pos === 1 ? tr('Você é o time a ser batido nesta rodada.', 'You are the team to beat this round.')
      : gap != null ? tr(`${gap === 0 ? 'Mesmo número de pontos que o líder.' : `${gap} ${gap === 1 ? 'ponto' : 'pontos'} pro líder.`}`, `${gap === 0 ? 'Level on points with the leader.' : `${gap} ${gap === 1 ? 'point' : 'points'} behind the leader.`}`) : ''
    return { k: tr('📰 Rivais · quinta', '📰 Rivals · Thursday'), titulo, texto }
  }
  if (dow === 5) { // sexta: a véspera
    const titulo = c.proxClassico ? tr(`Clássico contra o ${adv}!`, `Derby against ${adv}!`) : escolhe([tr(`Clima de jogo: ${adv}`, `Match mood: ${adv}`), tr(`O ${adv} vem aí`, `${adv} is coming`), tr(`Véspera contra o ${adv}`, `Eve of the ${adv} game`)], t)
    return { k: tr('🔥 Véspera · sexta', '🔥 Match eve · Friday'), titulo, texto: c.proxCopa ? tr(`Quarta tem Copa, ${casa}.`, `Cup game on Wednesday, ${casa}.`) : tr(`Domingo, 16h, ${casa}.`, `Sunday, 4pm, ${casa}.`) }
  }
  if (dow === 6) { // sábado: concentração
    return { k: tr('🏨 Concentração · sábado', '🏨 Team hotel · Saturday'), titulo: fora.length ? tr(`${fora.length === 1 ? 'Um desfalque' : `${fora.length} desfalques`} pro domingo`, `${fora.length === 1 ? 'One absence' : `${fora.length} absences`} for Sunday`) : tr('Time completo pro domingo', 'Full team for Sunday'), texto: fora.length ? tr(`${fora.join(', ')}. Dá tempo de mexer no Elenco.`, `${fora.join(', ')}. There is still time to change the squad.`) : tr('Ninguém suspenso nem machucado.', 'Nobody suspended or injured.') }
  }
  return { k: tr('⚽ Dia de jogo', '⚽ Match day'), titulo: tr(`Hoje: ${adv}`, `Today: ${adv}`), texto: casa }
}

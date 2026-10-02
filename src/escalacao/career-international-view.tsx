// ─── 🌎 CARREIRA INTERNACIONAL — a tela, PASSO A PASSO (01/10, pedido do Diego) ────
//
// Palavras dele no 1º teste: *"primeiro deveria aparecer só o banner da competição
// que quero jogar, como passo a passo… se for Libertadores mostrar só os blocos
// dos times da Libertadores… depois convocar igual já temos… se tô na Liberta não
// vejo da Champions e vice-versa… a simulação deve ser bonita, padrão das Copas,
// rolando o tempo… depois que acabar vem o banner do Mundial, jogo único… quem não
// se classificou pode pular ou assistir"*.
//
// 🔁 2ª rodada (02/10), depois de ele jogar a 1ª versão: *"tá estranho… cadê o botão de
// manual que é padrão?… tem que ser com base no que já existe… a tabela aparece de
// cara… na final deveria aparecer as duas finais ao mesmo tempo… se eu quiser
// assistir, eu assisto qual?"*. Então a campanha agora é montada com as MESMAS peças da
// Copa da carreira e da Liberta do online, nesta ordem: faixa da competição → o SEU jogo
// no placar grande → 🎮 Controle da partida (velocidade · Próxima rodada · Pular · Modo
// auto, ou o cadeado de quem não tem Modo Manual) → a TABELA sempre à vista (grupo /
// tabela de 36 / chaves do mata-mata) → os outros jogos da noite. Nada de "Próximo".
//
// O MOTOR não mudou (`makeInternationalCampaign` + as 3 ações do reducer): a campanha
// continua congelada no save com 14 "noites" e o contador `reveal`. Noite em que a
// competição em foco não joga é pulada sozinha — por isso "não vejo a outra". As duas
// FINAIS caem na mesma noite (13ª): a sua no placar grande, a outra num cartão.
// 🔓 A Champions só abre depois de ganhar a Libertadores (`championsLiberada`).
import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import type { Card, WonCard } from './types'
import { INTERNATIONAL_BLOCKS, INTERNATIONAL_CLUBS, championsLiberada, internationalCardKey, internationalClubCards, validInternationalXI, type InternationalClub, type InternationalCompetition } from './career-international'
import { makeInternationalCampaign, tableFor, type InternationalCampaign, type InternationalHistoryEntry, type InternationalMatch, type InternationalPhase, type InternationalTableRow, type InternationalTie } from './career-international-season'
import { summarizeInternationalCampaign } from './career-international-summary'
import { CompetitionStage, RoundMatchPresentation, useRoundPresentationStart } from './online-match-visual'
import { Escudo } from './escudos'
import { SeloClube } from './selo-clube'
import { mascoteKeyDoTime, FestaoMascote } from './mascotes'
import { tr, getLang } from './lang'
import { JogadorNoCampo, VagaNoCampo } from './jogadorcampo'
import { useLegendPresentation } from './presentation-release'
import { LiveScoreCard, COPA_LEG_MS, copaSideColor, useApitoDeLargada, type ScoreGoal } from './pyramidseason'
import { useSimMode, SimControls, SpeedControls, QuickManualLock } from './screens'
import { useEsc } from './store'
import { useHasManual } from './apoio'
import libertaImg from './img/online-liberta-v25.webp'
import championsImg from './img/online-champions-v25.webp'
import mundialImg from './img/carreira-mundial-clubes-v1.webp'
import { CARTA_CLUBE } from './convite-cartas'

type Props = {
  season: number; seed: number; userTeam: string; userId: number; squad: WonCard[]
  choices: InternationalClub[]; priority: number | null
  campaign: InternationalCampaign | null; history: InternationalHistoryEntry[]
  onStart: (campaign: InternationalCampaign) => void; onAdvance: () => void; onFinish: (entry: InternationalHistoryEntry) => void
  /** o cabeçalho de cima da carreira já mostra a competição e a fase (não repetir a faixa) */
  topoGrande?: boolean
}

const INK = '#0C0C0C', GOLD = '#FFC400', GREEN = '#1B7A3D', CREME = '#F4ECD6'
const OSWALD: CSSProperties = { fontFamily: 'Oswald, sans-serif', textTransform: 'uppercase' }
const frame: CSSProperties = { background: CREME, border: `3px solid ${INK}`, borderRadius: 16, boxShadow: `4px 4px 0 ${INK}`, padding: 14, marginBottom: 18 }
const card: CSSProperties = { background: '#fff', border: `3px solid ${INK}`, borderRadius: 16, boxShadow: `4px 4px 0 ${INK}`, padding: 12, marginBottom: 12 }
const btn = (bg = GOLD, color = INK): CSSProperties => ({ display: 'block', width: '100%', border: `3px solid ${INK}`, borderRadius: 13, padding: '11px 10px', fontWeight: 700, fontSize: 15, ...OSWALD, textAlign: 'center', boxShadow: `3px 3px 0 ${INK}`, background: bg, color, cursor: 'pointer' })
const btnOff: CSSProperties = { ...btn('#CBBF9E', '#555'), boxShadow: 'none', cursor: 'not-allowed' }
const hint: CSSProperties = { fontSize: 10.5, fontWeight: 700, color: '#555', textAlign: 'center', margin: '8px 0 0', lineHeight: 1.35 }
const kicker: CSSProperties = { fontSize: 9.5, fontWeight: 900, letterSpacing: 1.4, color: '#6b6b6b', textTransform: 'uppercase', textAlign: 'center', display: 'block' }
const sections = ['GOL', 'LAT', 'ZAG', 'MEI', 'ATA'] as const
type Section = typeof sections[number]
type Shape = '4-3-3' | '4-4-2'
const needs: Record<Shape, Record<Section, number>> = {
  '4-3-3': { GOL: 1, LAT: 2, ZAG: 2, MEI: 3, ATA: 3 },
  '4-4-2': { GOL: 1, LAT: 2, ZAG: 2, MEI: 4, ATA: 2 },
}
const SEC_LABEL: Record<Section, [string, string]> = { GOL: ['goleiros', 'keepers'], LAT: ['laterais', 'full-backs'], ZAG: ['zagueiros', 'centre-backs'], MEI: ['meias', 'midfielders'], ATA: ['atacantes', 'forwards'] }
type Comp = InternationalCompetition | 'mundial'
const nomeComp = (c: Comp) => c === 'libertadores' ? 'Libertadores' : c === 'champions' ? 'Champions League' : tr('Mundial de Clubes', 'Club World Cup')
const emojiComp = (c: Comp) => c === 'libertadores' ? '🌎' : c === 'champions' ? '🌍' : '🌐'
const artComp = (c: Comp) => c === 'libertadores' ? libertaImg : c === 'champions' ? championsImg : mundialImg
const orgComp = (c: Comp) => c === 'libertadores' ? 'CONMEBOL' : c === 'champions' ? 'UEFA' : 'FIFA'
// 🎨 cor/brilho da barra de goleadores por competição (mesma ideia das Copas da liga)
const tintComp = (c: Comp) => c === 'libertadores' ? { bg: '#e6f0e8', border: GREEN } : c === 'champions' ? { bg: '#e3e8f5', border: '#0D4FCC' } : { bg: '#fff3c4', border: GOLD, holo: 0.5 }
const outra = (c: InternationalCompetition): InternationalCompetition => c === 'libertadores' ? 'champions' : 'libertadores'
const tituloFase = (t: string) => t.startsWith('Grupos') ? tr(t.replace('Grupos', 'Grupos'), t.replace('Grupos · rodada', 'Groups · round')) : t.startsWith('Tabela') ? tr(t, t.replace('Tabela · rodada', 'Table · round')) : t === 'Oitavas' ? tr('Oitavas', 'Round of 16') : t === 'Quartas' ? tr('Quartas', 'Quarter-finals') : t === 'Semifinal' ? tr('Semifinal', 'Semi-final') : t === 'Repescagem' ? tr('Repescagem', 'Play-off') : t
// 💾 o que a pessoa escolheu quando ficou SEM VAGA (pular / qual acompanhar), por temporada,
// pra não perguntar de novo se a tela recarregar no meio.
const MODO_KEY = 'esc-intl-modo-v1'
type ModoSemVaga = 'pular' | InternationalCompetition
const leModo = (season: number): ModoSemVaga | null => { try { const v = JSON.parse(localStorage.getItem(MODO_KEY) ?? 'null'); return v && v.season === season ? v.modo : null } catch { return null } }
const ESCOLHA_KEY = 'esc-intl-clube-v1'
const leEscolha = (season: number): { comp: InternationalCompetition; club: string } | null => { try { const v = JSON.parse(localStorage.getItem(ESCOLHA_KEY) ?? 'null'); return v && v.season === season ? v : null } catch { return null } }
const gravaEscolha = (season: number, comp: InternationalCompetition, club: string) => { try { localStorage.setItem(ESCOLHA_KEY, JSON.stringify({ season, comp, club })) } catch { /* sem espaço */ } }
const gravaModo = (season: number, modo: ModoSemVaga) => { try { localStorage.setItem(MODO_KEY, JSON.stringify({ season, modo })) } catch { /* sem espaço */ } }

// 🏷️ O CABEÇALHO DE CIMA DA CARREIRA (Diego 02/10: *"o header das ligas novas não tá
// aparecendo a fase… nada a ver ficar aparecendo a Série A"*). Enquanto a campanha
// internacional está na tela, o cabeçalho fixo vira o da competição em foco — mesma peça
// (`CareerCompetitionStage`) e mesmo lugar do da Copa do Brasil, com a arte grande.
export function topoInternacional(campaign: InternationalCampaign | null, season: number): { kind: 'liberta' | 'champions' | 'mundial'; titulo: string; fase: string; detalhe: string; status: string } {
  const geral = { kind: 'mundial' as const, titulo: tr('Futebol internacional de clubes', 'International club football'), fase: tr('Libertadores · Champions · Mundial', 'Libertadores · Champions · Club World Cup'), detalhe: '', status: tr('Escolha a sua competição', 'Pick your competition') }
  if (!campaign || campaign.season !== season) return geral
  const rep = campaign.representedClub
  const modo = leModo(season)
  const foco: InternationalCompetition | null = rep ? (INTERNATIONAL_CLUBS.find(c => c.name === rep)?.competition ?? null) : modo && modo !== 'pular' ? modo : null
  if (!foco) return geral
  const kindDe = (c: Comp) => c === 'libertadores' ? 'liberta' as const : c
  const step = campaign.steps[campaign.reveal]
  if (!step) return { kind: kindDe(foco), titulo: `${orgComp(foco)} ${nomeComp(foco)}`, fase: tr('Campanha encerrada', 'Campaign over'), detalhe: '', status: tr('Confira os campeões', 'Check the champions') }
  const fase = step.mundial ?? step[foco]
  if (!fase) return { kind: kindDe(foco), titulo: `${orgComp(foco)} ${nomeComp(foco)}`, fase: '…', detalhe: '', status: '' }
  const c = fase.competition
  const formato = fase.ties?.length ? (fase.ties[0].matches.length === 2 ? tr('ida e volta', 'two legs') : tr('jogo único', 'single match')) : ''
  const detalhe = c === 'mundial' ? tr('Campeão da Libertadores × campeão da Champions · jogo único', 'Libertadores champion × Champions champion · single match')
    : fase.title.startsWith('Grupos') ? tr('6 grupos de 6 · passam os 2 primeiros e os 4 melhores 3ºs', '6 groups of 6 · top 2 and the best four 3rds go through')
    : fase.title.startsWith('Tabela') ? tr('36 clubes numa tabela só · 1º–8º direto · 9º–24º repescão', '36 clubs in one table · 1st–8th straight through · 9th–24th play-off')
    : `${fase.ties?.length ?? 0} ${tr('confrontos', 'ties')} · ${formato}`
  return { kind: kindDe(c), titulo: `${tr('Temporada', 'Season')} ${season} · ${orgComp(c)} ${nomeComp(c)}`, fase: c === 'mundial' ? tr('Final', 'Final') : tituloFase(fase.title), detalhe, status: rep ? `${rep} · ${tr('técnico convidado', 'guest coach')}: ${campaign.userTeam}` : `📺 ${tr('você acompanha', 'you are following')}` }
}

// ✉️ OS CONVITES (Diego 02/10, mockup aprovado: *"adorei… perfeito"*). Você não escolhe o
// clube num cardápio: o clube grande é que CHAMA o presidente pra ser o técnico convidado
// dele numa campanha. Chegam 2 convites sorteados do BLOCO DA SUA POSIÇÃO (campeão da A =
// bloco 1, campeão da Copa do Brasil = bloco 2, depois 2º–8º da A); depois de ganhar a
// Libertadores uma vez, chegam 2 da Libertadores + 2 da Champions. O sorteio é preso na
// semente + temporada: recarregar a tela não muda os convites.
export type Convite = { club: string; comp: InternationalCompetition; renova?: boolean }
// 🔁 A RENOVAÇÃO (Diego 02/10): *"ganhando a Libertadores com o Flamengo na T40, na 41 vai aparecer
// pra eu renovar com o time que ganhou… mais 1 da Libertadores do mesmo bloco pra formar sempre dois…
// serve também quando ganhar a Champions"*. Quem foi CAMPEÃO continental na temporada passada recebe o
// convite de renovar com aquele clube (mesmo que ele seja de um bloco melhor que a sua posição de
// agora) + 1 clube da mesma competição do bloco da posição + os 2 da outra (se aberta). Sempre dois
// por competição. Vale de novo enquanto ele seguir ganhando.
export function clubeDaRenovacao(history: readonly InternationalHistoryEntry[], season: number): Convite | null {
  const ant = history.find(e => e.season === season - 1)
  if (!ant?.representedClub || !(ant.libertadores || ant.champions)) return null
  const comp = INTERNATIONAL_CLUBS.find(c => c.name === ant.representedClub)?.competition
  return comp ? { club: ant.representedClub, comp, renova: true } : null
}
export function convitesDaTemporada(seed: number, season: number, priority: number | null, choices: readonly InternationalClub[], champsOk: boolean, renovacao: Convite | null = null): Convite[] {
  if (priority == null || !choices.length) return []
  const liberados = (comp: InternationalCompetition) => {
    // o bloco da sua posição; se nele ninguém fecha time, desce pro próximo bloco liberado
    for (let b = priority; b <= INTERNATIONAL_BLOCKS.length; b++) {
      const nomes = INTERNATIONAL_BLOCKS[b - 1][comp].filter(n => choices.some(c => c.name === n) && clubeFechaTime(n))
      if (nomes.length) return nomes
    }
    return [] as string[]
  }
  let x = (seed ^ Math.imul(season, 0x9E3779B1) ^ Math.imul(priority, 0x85EBCA6B)) >>> 0 || 1
  const rnd = () => { x ^= x << 13; x >>>= 0; x ^= x >>> 17; x ^= x << 5; x >>>= 0; return x / 4294967296 }
  const sorteia = (comp: InternationalCompetition) => {
    const renova = renovacao?.comp === comp && clubeFechaTime(renovacao.club) ? [renovacao] : []
    const novos = [...liberados(comp)].filter(n => n !== renovacao?.club).map(n => ({ n, r: rnd() })).sort((a, b) => a.r - b.r).slice(0, 2 - renova.length).map(({ n }) => ({ club: n, comp }))
    return [...renova, ...novos]
  }
  return [...sorteia('libertadores'), ...(champsOk ? sorteia('champions') : [])]
}

function clubLeaders(rows: InternationalHistoryEntry[]) {
  const merged = new Map<string, { name: string; goals: number; assists: number }>()
  for (const entry of rows) for (const player of entry.playerStats ?? []) {
    const current = merged.get(player.key) ?? { name: player.name, goals: 0, assists: 0 }
    current.goals += player.goals; current.assists += player.assists
    merged.set(player.key, current)
  }
  const all = [...merged.values()]
  return { scorer: all.sort((a, b) => b.goals - a.goals)[0], assistant: [...all].sort((a, b) => b.assists - a.assists)[0] }
}

// 🎞️ a faixa de cima: arte da competição + título + subtítulo (fase/noite)
function Faixa({ comp, titulo, sub }: { comp: Comp; titulo: string; sub?: string }) {
  return <div style={{ position: 'relative', border: `3px solid ${INK}`, borderRadius: 14, overflow: 'hidden', minHeight: 74, boxShadow: `3px 3px 0 ${INK}`, marginBottom: 10, backgroundImage: `linear-gradient(90deg,rgba(0,0,0,.86),rgba(0,0,0,.45)),url(${artComp(comp)})`, backgroundSize: 'cover', backgroundPosition: 'center 30%' }}>
    <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: 74 }}>
      <span style={{ color: CREME, fontWeight: 700, fontSize: 17, lineHeight: 1, ...OSWALD }}>{emojiComp(comp)} {titulo}</span>
      {sub && <span style={{ color: GOLD, fontWeight: 600, fontSize: 11, letterSpacing: 1, marginTop: 3, ...OSWALD }}>{sub}</span>}
    </div>
  </div>
}

// 🧢 O CONVITE (02/10): na campanha o clube aparece como ele é — Flamengo, com o escudo do
// Flamengo. Você é o TÉCNICO convidado: seu escudo vira o selo "técnico" e a sua mascote
// continua comemorando o gol. (No save o nome do time segue sendo o seu, pra ranking/prêmio.)
const crestOf = (campaign: InternationalCampaign, id: string, size: number) => {
  const t = campaign.teams.find(x => x.id === id)
  return <SeloClube clube={t?.institution ?? id} size={size} />
}
/** a campanha com o nome de TELA de cada clube (o seu aparece com o nome da instituição) */
const comNomeDoClube = (c: InternationalCampaign): InternationalCampaign => ({ ...c, teams: c.teams.map(t => t.you ? { ...t, name: t.institution } : t) })

// 🎬 OS JOGOS DOS OUTROS RODAM AO VIVO (Diego 02/10: *"as simulações estão dando resultado
// pronto… quero simulação real, com o tempo passando, como sempre foi, e pênaltis também"*).
// Cada jogo da noite anda no MESMO relógio do placar grande (mesmo `startedAt`, mesmo
// tempo de perna): o gol só aparece no minuto em que saiu. No mata-mata a noite tem IDA e
// VOLTA — uma perna de cada vez, igual à Copa — e, no apito da última, o cartão diz o
// agregado e os pênaltis de quem empatou.
type JogoDaNoite = { match: InternationalMatch; tie?: InternationalTie; ultimaPerna: boolean }
function jogosDaPerna(phase: InternationalPhase, perna: number): JogoDaNoite[] {
  if (!phase.ties?.length) return phase.matches.map(match => ({ match, ultimaPerna: true }))
  return phase.ties.map(tie => { const i = Math.min(perna, tie.matches.length - 1); return { match: tie.matches[i], tie, ultimaPerna: i === tie.matches.length - 1 } })
}
const desfechoTie = (campaign: InternationalCampaign, tie: InternationalTie) => {
  const nome = (id: string) => campaign.teams.find(t => t.id === id)?.name ?? id
  const [a, b] = tie.matches.length === 2 ? [tie.matches[0].hg + tie.matches[1].ag, tie.matches[0].ag + tie.matches[1].hg] : [tie.matches[0].hg, tie.matches[0].ag]
  const agg = tie.matches.length === 2 ? `${tr('agregado', 'aggregate')} ${a}×${b} · ` : ''
  const pen = tie.penalties ? `🥅 ${tr('pênaltis', 'penalties')} ${tie.penalties[0]}×${tie.penalties[1]} · ` : ''
  return `${agg}${pen}${nome(tie.winner)} ${tr('passa', 'goes through')}`
}
function minutoDe(startedAt: number, legMs: number) { return Math.min(93, Math.round((Date.now() - startedAt) / Math.max(400, legMs * .82) * 93)) }
function useMinuto(startedAt: number, legMs: number, chave: number) {
  const [m, setM] = useState(() => minutoDe(startedAt, legMs))
  useEffect(() => { const tick = () => setM(minutoDe(startedAt, legMs)); tick(); const t = setInterval(tick, 250); return () => clearInterval(t) }, [startedAt, legMs, chave])
  return m
}

// 📋 mata-mata (≤ 8 jogos): um cartão de jogo por confronto, rolando
function ListaDaNoite({ jogos, campaign, titulo, startedAt, legMs, roundKey, finished }: { jogos: JogoDaNoite[]; campaign: InternationalCampaign; titulo?: string; startedAt: number; legMs: number; roundKey: number; finished: boolean }) {
  const teams = new Map(campaign.teams.map(t => [t.id, t]))
  if (!jogos.length) return null
  return <div style={{ marginBottom: 12 }}>
    {titulo && <p style={{ ...OSWALD, fontWeight: 700, fontSize: 12, margin: '0 0 6px 2px', color: INK }}>{titulo}</p>}
    <div className="ll29-match-grid">{jogos.map(({ match, tie, ultimaPerna }, i) => {
      const home = teams.get(match.home)!, away = teams.get(match.away)!
      return <RoundMatchPresentation key={`${roundKey}-${match.home}-${match.away}-${i}`} home={home.name} away={away.name}
        homeCrest={crestOf(campaign, match.home, 28)} awayCrest={crestOf(campaign, match.away, 28)}
        mine={home.you || away.you} score={[match.hg, match.ag]} finished={finished} roundKey={roundKey} roundMs={legMs} startedAt={startedAt}
        goals={match.goals.map(g => ({ name: g.name, min: g.min, home: g.home }))}
        detail={finished && tie && ultimaPerna ? desfechoTie(campaign, tie) : undefined} />
    })}</div>
  </div>
}

// 🥅 a MESMA pílula compacta da Liberta do online ("Peñarol 1×1 Olimpia") pras noites de
// grupos/tabela, que têm 17–18 jogos — cartão grande pra cada um viraria um paredão. O placar
// sobe com o relógio, igual aos cartões.
function PilulasDaNoite({ jogos, campaign, titulo, startedAt, legMs, roundKey, finished }: { jogos: JogoDaNoite[]; campaign: InternationalCampaign; titulo: string; startedAt: number; legMs: number; roundKey: number; finished: boolean }) {
  const nome = (id: string) => campaign.teams.find(t => t.id === id)?.name ?? id
  const minuto = useMinuto(startedAt, legMs, roundKey)
  if (!jogos.length) return null
  const placar = (m: InternationalMatch) => finished ? [m.hg, m.ag] : [m.goals.filter(g => g.home && g.min <= minuto).length, m.goals.filter(g => !g.home && g.min <= minuto).length]
  return <div style={{ ...card, padding: '9px 10px' }}>
    <p style={{ ...OSWALD, fontWeight: 700, fontSize: 11, margin: '0 0 6px', color: INK, display: 'flex', justifyContent: 'space-between' }}><span>{titulo}</span><span style={{ color: finished ? GREEN : '#C2452F' }}>{finished ? tr('ENCERRADO', 'FULL TIME') : `${Math.min(90, minuto)}′ · ${tr('AO VIVO', 'LIVE')}`}</span></p>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 230px), 1fr))', gap: 5 }}>
      {jogos.map(({ match: m }, i) => { const [h, a] = placar(m); return <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 800, borderRadius: 9, padding: '4px 6px', background: CREME, border: '2px solid rgba(0,0,0,.18)', color: INK }}>
        <span style={{ flex: 1, minWidth: 0, textAlign: 'right', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{nome(m.home)}</span>
        {crestOf(campaign, m.home, 16)}<b style={{ ...OSWALD, fontSize: 12, flex: 'none', fontVariantNumeric: 'tabular-nums' }}>{h}×{a}</b>{crestOf(campaign, m.away, 16)}
        <span style={{ flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{nome(m.away)}</span>
      </div> })}
    </div>
  </div>
}

// 🏆 CARTÃO DE FINAL — a OUTRA final da noite, e também a final que você só ASSISTE (Diego
// 02/10: a final da Libertadores sem ele ficou sem destaque). Arte da competição atrás, os dois
// escudos e o placar. Com `startedAt` ele roda ao vivo (o placar sobe no minuto do gol) e só
// conta quem é campeão no apito; sem `startedAt` já chega encerrado.
function FinalCard({ phase, campaign, titulo, startedAt, legMs = 1, finished = true, roundKey = 0 }: { phase: InternationalPhase; campaign: InternationalCampaign; titulo: string; startedAt?: number; legMs?: number; finished?: boolean; roundKey?: number }) {
  const tie = phase.ties?.[0]; const m = phase.matches[0]
  const minuto = useMinuto(startedAt ?? 0, legMs, roundKey)
  if (!tie || !m) return null
  const nome = (id: string) => campaign.teams.find(t => t.id === id)?.name ?? id
  const comp = phase.competition
  const fim = finished || startedAt === undefined
  const hg = fim ? m.hg : m.goals.filter(g => g.home && g.min <= minuto).length
  const ag = fim ? m.ag : m.goals.filter(g => !g.home && g.min <= minuto).length
  const gols = m.goals.filter(g => fim || g.min <= minuto)
  // 🪙 escudo escuro (Juventus, Newcastle…) sumia no fundo escuro: vai num disco creme
  const disco: CSSProperties = { display: 'inline-grid', placeItems: 'center', width: 52, height: 52, borderRadius: '50%', background: CREME, border: `2px solid ${INK}` }
  const lado = (id: string, home: boolean) => <div style={{ textAlign: 'center', color: CREME }}><span style={disco}>{crestOf(campaign, id, 40)}</span><b style={{ display: 'block', ...OSWALD, fontWeight: 700, fontSize: 14, marginTop: 3 }}>{nome(id)}</b>
    {gols.filter(g => g.home === home).map((g, i) => <span key={i} style={{ display: 'block', fontSize: 10, fontWeight: 700, opacity: .85 }}>⚽ {g.name} {g.min}′</span>)}</div>
  return <div style={{ position: 'relative', border: `3px solid ${INK}`, borderRadius: 16, overflow: 'hidden', boxShadow: `4px 4px 0 ${INK}`, marginBottom: 12, backgroundImage: `linear-gradient(90deg,rgba(0,0,0,.87),rgba(0,0,0,.6)),url(${artComp(comp)})`, backgroundSize: 'cover', backgroundPosition: 'center 30%', padding: '10px 12px' }}>
    <span style={{ color: GOLD, ...OSWALD, fontWeight: 700, fontSize: 11, letterSpacing: 1.5 }}>{emojiComp(comp)} {titulo}</span>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'start', gap: 8, marginTop: 6 }}>
      {lado(m.home, true)}
      <div style={{ background: CREME, color: INK, border: `2.5px solid ${INK}`, borderRadius: 11, padding: '5px 10px', textAlign: 'center', ...OSWALD, fontWeight: 700, fontSize: 24, lineHeight: 1, marginTop: 6 }}>
        <small style={{ display: 'block', fontSize: 8, fontWeight: 900, letterSpacing: 1, fontFamily: 'Inter, system-ui, sans-serif', color: fim ? INK : '#C2452F' }}>{fim ? tr('ENCERRADO', 'FULL TIME') : `${Math.min(90, minuto)}′ · ${tr('AO VIVO', 'LIVE')}`}</small>{hg} × {ag}
        {fim && tie.penalties && <small style={{ display: 'block', fontSize: 9, fontWeight: 900, fontFamily: 'Inter, system-ui, sans-serif' }}>🥅 {tie.penalties[0]}×{tie.penalties[1]}</small>}
      </div>
      {lado(m.away, false)}
    </div>
    {fim && <p style={{ color: 'rgba(244,236,214,.85)', fontSize: 10.5, fontWeight: 800, margin: '8px 0 0', textAlign: 'center' }}>🏆 {nome(tie.winner)} {tr('é campeão', 'is champion')}{comp === 'mundial' ? tr(' do mundo!', ' of the world!') : ` ${tr('da', 'of the')} ${nomeComp(comp)} ${tr('e vai pro 🌐 Mundial — jogo único, na próxima noite.', 'and goes to the 🌐 Club World Cup — single match, next night.')}`}</p>}
  </div>
}

// 📊 classificação (só noites já reveladas — a tabela nunca entrega resultado antes do apito)
function Tabela({ rows, me, cortes, titulo, campaign, legenda, apagaDepoisDe }: { rows: InternationalTableRow[]; me: string | null; cortes: (i: number) => string | null; titulo: string; campaign: InternationalCampaign; legenda?: { cor: string; txt: string }[]; apagaDepoisDe?: number }) {
  const teams = new Map(campaign.teams.map(t => [t.id, t]))
  return <div style={{ background: '#fff', border: `3px solid ${INK}`, borderRadius: 14, overflow: 'hidden', boxShadow: `3px 3px 0 ${INK}`, marginBottom: 12, fontSize: 12 }}>
    <div style={{ background: INK, color: '#fff', fontWeight: 700, fontSize: 12, padding: '6px 10px', display: 'flex', justifyContent: 'space-between', ...OSWALD }}><span>{titulo}</span><span>J · PTS · SG</span></div>
    {rows.map((r, i) => {
      const t = teams.get(r.team); const cor = cortes(i)
      return <div key={r.team} style={{ display: 'grid', gridTemplateColumns: '22px 26px 1fr 24px 30px 30px', gap: 6, alignItems: 'center', padding: '5px 10px', borderBottom: '2px solid #00000010', fontWeight: 700, color: INK, borderLeft: cor ? `5px solid ${cor}` : '5px solid transparent', background: r.team === me ? '#FFF3C4' : '#fff', outline: r.team === me ? `2px solid ${GOLD}` : 'none', outlineOffset: -2, opacity: apagaDepoisDe !== undefined && i >= apagaDepoisDe ? .5 : 1 }}>
        <span>{i + 1}º</span><SeloClube clube={r.team} size={22} /><span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t?.name ?? r.team}{t?.you && <small style={{ color: '#777' }}> · {tr('técnico', 'coach')}: {campaign.userTeam}</small>}</span><span style={{ color: '#777' }}>{r.played}</span><span>{r.points}</span><span style={{ color: '#777' }}>{r.gf - r.ga > 0 ? `+${r.gf - r.ga}` : r.gf - r.ga}</span>
      </div>
    })}
    {legenda && <div style={{ display: 'flex', gap: 10, padding: '6px 10px', fontSize: 9, fontWeight: 800, color: 'rgba(0,0,0,.6)', background: CREME, flexWrap: 'wrap' }}>{legenda.map(l => <span key={l.txt}><i style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 3, background: l.cor, verticalAlign: -1, marginRight: 3 }} />{l.txt}</span>)}</div>}
  </div>
}

// ✉️ a CARTA do convite — O MARTELO, edição extra (mockup aprovado 02/10)
function CartaConvite({ convite, userTeam, season, onAceitar }: { convite: Convite; userTeam: string; season: number; onAceitar: () => void }) {
  return <div style={{ marginBottom: 14 }}>
    <div style={{ background: '#FBF5E4', border: `3px solid ${INK}`, borderRadius: 6, boxShadow: `4px 4px 0 ${INK}`, padding: '12px 13px 10px', color: INK }}>
      <div style={{ ...OSWALD, fontWeight: 700, fontSize: 22, textAlign: 'center', letterSpacing: 1, borderBottom: `3px double ${INK}`, paddingBottom: 3 }}>O MARTELO</div>
      <div style={{ fontSize: 8.5, fontWeight: 800, letterSpacing: 1.4, textAlign: 'center', color: '#6c604a', margin: '4px 0 8px', textTransform: 'uppercase' }}>{tr('Edição extra', 'Special edition')} · {tr('Temporada', 'Season')} {season} · {emojiComp(convite.comp)} {nomeComp(convite.comp)}</div>
      <h3 style={{ ...OSWALD, fontWeight: 700, fontSize: 20, lineHeight: 1.05, margin: '0 0 8px' }}>{convite.renova ? tr(`Campeão, o ${convite.club} quer renovar com você`, `Champions ${convite.club} want to renew with you`) : tr(`O ${convite.club} quer você como técnico`, `${convite.club} wants you as their coach`)}</h3>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, margin: '6px 0 8px' }}><SeloClube clube={convite.club} size={60} /><span style={{ ...OSWALD, fontWeight: 700, fontSize: 22, color: '#999' }}>×</span><Escudo nome={userTeam} size={60} /></div>
      {convite.renova ? <p style={{ fontFamily: 'Georgia, serif', fontSize: 12.5, lineHeight: 1.45, margin: '0 0 6px' }}>{getLang() === 'en' ? <>After lifting the {nomeComp(convite.comp)} together last season, the board wants <b>the same coach for the title defense</b>. {userTeam} stays home — and the trophy cabinet keeps growing.</> : <>Depois de levantar a {nomeComp(convite.comp)} juntos na temporada passada, a diretoria quer <b>o mesmo técnico pra defender o título</b>. O {userTeam} fica em casa — e a galeria só cresce.</>}</p> :
      <>{CARTA_CLUBE[convite.club] && <p style={{ fontFamily: 'Georgia, serif', fontSize: 12.5, lineHeight: 1.45, margin: '0 0 6px' }}>{getLang() === 'en' ? CARTA_CLUBE[convite.club][1] : CARTA_CLUBE[convite.club][0]}</p>}
      <p style={{ fontFamily: 'Georgia, serif', fontSize: 12.5, lineHeight: 1.45, margin: '0 0 6px' }}>{getLang() === 'en' ? <>The invitation: <b>be {convite.club}’s coach in the {nomeComp(convite.comp)}</b> this season. {userTeam} is still yours and stays home — and the trophy, if it comes, goes into your cabinet.</> : <>O convite: <b>ser o técnico do {convite.club} na {nomeComp(convite.comp)}</b> desta temporada. O {userTeam} continua seu e fica em casa — e a taça, se vier, entra na sua galeria.</>}</p></>}
      <div style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 11.5, textAlign: 'right', color: '#444' }}>— {tr('Diretoria do', 'The board of')} {convite.club}</div>
    </div>
    <button type="button" style={{ ...btn(convite.renova ? GOLD : GREEN, convite.renova ? INK : '#fff'), marginTop: 10 }} onClick={onAceitar}>{convite.renova ? `🔁 ${tr('Renovar e convocar', 'Renew and call up')}` : `✍️ ${tr('Aceitar o convite e convocar', 'Accept the invitation and call up')}`}</button>
  </div>
}

// 🧢 PASSO 3 — a convocação, IGUAL à da Copa do Mundo (`ConvocacaoScreen`): escolheu o
// Flamengo, convoca entre TODOS os jogadores do Flamengo que existem no baralho
// (Diego 01/10: *"eu não levo meu elenco… é todo jogador do Flamengo no baralho, todo
// jogador do Real Madrid, do River Plate"*). O elenco do usuário NÃO entra. Clube sem
// carta pra fechar um 4-3-3/4-4-2 nem chega aqui: fica trancado no passo 2.
type PoolCard = Card
const fechaForm = (cards: { pos: string; name: string; club: string; year: number }[], form: Shape) => sections.every(pos => new Set(cards.filter(c => c.pos === pos).map(internationalCardKey)).size >= needs[form][pos])
/** o clube tem jogadores no baralho pra fechar um time? (72 dos 72 desde o Lote 40) */
export const clubeFechaTime = (clube: string) => { const cs = internationalClubCards(clube); return fechaForm(cs, '4-3-3') || fechaForm(cs, '4-4-2') }
// 💬 O RECADO DA LENDA (Diego 02/10: "faz o 3"). Ao aceitar o convite, o maior nome do clube no
// baralho manda boas-vindas curtas. Entra no tempo morto da convocação, sem passo novo.
// ⚠️ Frases GENÉRICAS de vestiário: não imitam o jeito de nenhum jogador real (regra "não inventar
// como uma pessoa real é") — o nome só assina o recado. PT e EN na mesma posição.
const RECADOS: [string, string][] = [
  ['Chegou o técnico do {voce}? Aqui no {clube} a gente não perde nem pelada de treino. Bem-vindo.', 'So the {voce} coach is here? At {clube} we don\u2019t even lose training scrimmages. Welcome.'],
  ['Professor, só uma coisa: no {clube} quem senta no banco tem que gostar de taça.', 'Boss, one thing: at {clube} whoever sits on the bench has to like trophies.'],
  ['Pode escalar sem medo. O resto a gente resolve dentro de campo.', 'Pick the team without fear. We\u2019ll sort out the rest on the pitch.'],
  ['Disseram que você manda lá no {voce}. Aqui você é técnico — e técnico daqui tem que ganhar.', 'They say you run things at {voce}. Here you\u2019re the coach — and coaches here have to win.'],
  ['Bem-vindo ao {clube}! A torcida já está cantando seu nome. Por enquanto.', 'Welcome to {clube}! The fans are already singing your name. For now.'],
  ['Trouxe a prancheta? Ótimo. Agora esquece ela e bota a gente pra jogar.', 'Brought the clipboard? Great. Now forget it and let us play.'],
  ['Primeiro dia e já tem convocação? Gostei. Só não esquece de mim, hein.', 'First day and already picking the squad? I like it. Just don\u2019t forget me, eh.'],
  ['Aqui no {clube} a camisa pesa. Mas com você no banco, a gente aguenta.', 'At {clube} the shirt is heavy. But with you on the bench, we can carry it.'],
]
function RecadoDaLenda({ clube, userTeam, pool }: { clube: string; userTeam: string; pool: Card[] }) {
  const lenda = [...pool].sort((a, b) => (b.fame ?? 0) - (a.fame ?? 0) || (b.hi ?? 0) - (a.hi ?? 0))[0]
  if (!lenda) return null
  let h = 0; for (const ch of clube + userTeam) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  const [pt, en] = RECADOS[h % RECADOS.length]
  const txt = (getLang() === 'en' ? en : pt).replaceAll('{clube}', clube).replaceAll('{voce}', userTeam)
  return <div style={{ display: 'flex', gap: 9, alignItems: 'flex-start', marginBottom: 10 }}>
    <span style={{ flex: 'none', width: 40, height: 40, borderRadius: '50%', border: `2.5px solid ${INK}`, background: CREME, display: 'grid', placeItems: 'center' }}><SeloClube clube={clube} size={28} /></span>
    <div style={{ position: 'relative', flex: 1, background: '#fff', border: `2.5px solid ${INK}`, borderRadius: 14, boxShadow: `3px 3px 0 ${INK}`, padding: '8px 11px', color: INK }}>
      <span style={{ display: 'block', ...OSWALD, fontWeight: 700, fontSize: 11, letterSpacing: .5, color: '#6c604a' }}>💬 {tr('Recado de', 'Message from')} {lenda.name}</span>
      <span style={{ fontSize: 12, fontWeight: 700, lineHeight: 1.4 }}>“{txt}”</span>
    </div>
  </div>
}

function InscricaoClube({ userTeam, clube, comp, onConfirm }: { userTeam: string; clube: string; comp: InternationalCompetition; onConfirm: (xi: Card[]) => void }) {
  const faces = useLegendPresentation()
  const doClube = useMemo<PoolCard[]>(() => internationalClubCards(clube).map(c => c as unknown as Card), [clube])
  const real = doClube
  const shapeAvailable = (form: Shape) => fechaForm(real, form)
  const [shape, setShape] = useState<Shape>(shapeAvailable('4-3-3') ? '4-3-3' : '4-4-2')
  const [tab, setTab] = useState<Section>('GOL')
  const [q, setQ] = useState('')
  const [xi, setXi] = useState<string[]>([])
  const [aviso, setAviso] = useState<string | null>(null)
  const need = needs[shape]
  const selected = xi.map(id => real.find(c => c.id === id)).filter((c): c is PoolCard => !!c)
  const bySec = (s: Section) => selected.filter(c => c.pos === s)
  const registered = validInternationalXI(selected) && sections.every(s => bySec(s).length === need[s])
  const toggle = (c: PoolCard) => {
    if (xi.includes(c.id)) { setXi(ids => ids.filter(id => id !== c.id)); setAviso(null); return }
    if (selected.some(o => internationalCardKey(o) === internationalCardKey(c))) { setAviso(tr(`${c.name} (${c.club} ${c.year}) já está convocado.`, `${c.name} (${c.club} ${c.year}) is already called up.`)); return }
    if (bySec(c.pos as Section).length >= need[c.pos as Section]) { setAviso(tr(`${c.pos} já está completo no ${shape} — tire um pra convocar ${c.name}.`, `${c.pos} is already full in the ${shape} — remove one to call up ${c.name}.`)); return }
    setXi(ids => [...ids, c.id]); setAviso(null)
  }
  const list = real.filter(c => c.pos === tab && c.name.toLowerCase().includes(q.toLowerCase()))
  const linha = (slots: { sec: Section; c: PoolCard | null }[]) => <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: 4 }}>
    {slots.map((sl, i) => sl.c ? <JogadorNoCampo key={i} nome={sl.c.name} clube={sl.c.club} ano={sl.c.year} tag={sl.sec} alt={52} fonteNome={10} rosto={faces} /> : <VagaNoCampo key={i} tag={sl.sec} alt={52} />)}
  </div>
  const slotsDe = (s: Section) => { const picked = bySec(s); return Array.from({ length: need[s] }, (_, i) => ({ sec: s, c: picked[i] ?? null })) }
  const lat = slotsDe('LAT'), zag = slotsDe('ZAG')
  return <>
    <RecadoDaLenda clube={clube} userTeam={userTeam} pool={doClube} />
    <div style={{ background: INK, border: `3px solid ${INK}`, borderRadius: 13, padding: '9px 11px', display: 'flex', alignItems: 'center', gap: 9, marginBottom: 9, color: '#fff' }}>
      <SeloClube clube={clube} size={34} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ ...OSWALD, fontWeight: 900, fontSize: 15, margin: 0 }}>{tr('Convocação', 'Call-up')} · {clube}</p>
        <p style={{ fontSize: 8.5, fontWeight: 700, color: 'rgba(255,255,255,.65)', margin: '2px 0 0' }}>{doClube.length} {tr('jogadores do', 'players of')} {clube} {tr('no baralho — só nome, clube e ano. Convoque 11.', 'in the deck — just name, club and year. Call up 11.')}</p>
      </div>
      <div style={{ background: GOLD, border: `2px solid ${INK}`, borderRadius: 10, padding: '4px 9px', textAlign: 'center', color: INK }}>
        <b style={{ display: 'block', fontSize: 15, lineHeight: 1, ...OSWALD }}>{selected.length}/11</b>
        <span style={{ fontSize: 7, fontWeight: 900, letterSpacing: 1 }}>{tr('CONVOCADOS', 'CALLED UP')}</span>
      </div>
    </div>
    <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
      {(['4-3-3', '4-4-2'] as Shape[]).map(f => { const ok = shapeAvailable(f); return <button key={f} type="button" disabled={!ok} onClick={() => { setShape(f); setXi([]); setAviso(null) }}
        style={{ flex: 1, border: `2.5px solid ${INK}`, borderRadius: 10, padding: '6px 4px', fontWeight: 900, fontSize: 12, ...OSWALD, cursor: ok ? 'pointer' : 'not-allowed', color: INK, background: !ok ? '#CBBF9E' : shape === f ? GOLD : '#fff', boxShadow: shape === f ? `2px 2px 0 0 ${INK}` : 'none', opacity: ok ? 1 : .7 }}>{ok ? f : `🔒 ${f}`}</button> })}
    </div>
    <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
      {sections.map(s => { const done = bySec(s).length >= need[s]; return <button key={s} type="button" onClick={() => setTab(s)} style={{ flex: 1, border: `2.5px solid ${INK}`, borderRadius: 10, padding: '4px 2px', fontWeight: 900, fontSize: 10.5, ...OSWALD, cursor: 'pointer', background: done ? GREEN : tab === s ? GOLD : '#fff', color: done ? '#fff' : INK, boxShadow: tab === s ? `2px 2px 0 0 ${INK}` : 'none' }}>
        {s}<span style={{ display: 'block', fontSize: 7.5, fontWeight: 800, opacity: .8, fontFamily: 'Inter, system-ui, sans-serif' }}>{bySec(s).length}/{need[s]}{done ? ' ✓' : ''}</span></button> })}
    </div>
    {aviso &&<div role="status" style={{ border: `2.5px solid ${INK}`, borderRadius: 11, padding: '7px 10px', marginBottom: 8, background: '#FDE9C8', fontWeight: 800, fontSize: 10.5, lineHeight: 1.4 }}>✋ {aviso}</div>}
    <input value={q} onChange={e => setQ(e.target.value)} placeholder={`${tr('🔎 buscar nos', '🔎 search the')} ${real.filter(c => c.pos === tab).length} ${tr(...SEC_LABEL[tab])}…`}
      style={{ width: '100%', border: `3px solid ${INK}`, borderRadius: 11, padding: '7px 11px', fontWeight: 800, fontSize: 12, background: '#fff', marginBottom: 8, boxSizing: 'border-box' }} />
    <div style={{ background: '#fff', border: `3px solid ${INK}`, borderRadius: 12, overflow: 'hidden', marginBottom: 10, boxShadow: `3px 3px 0 0 ${INK}` }}>
      <div style={{ maxHeight: 250, overflowY: 'auto' }}>
        {list.map(c => { const on = xi.includes(c.id); const full = !on && bySec(c.pos as Section).length >= need[c.pos as Section]; return <button key={c.id} type="button" onClick={() => toggle(c)}
          style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', border: 'none', borderBottom: '2px solid rgba(0,0,0,.07)', background: on ? '#E9F5EC' : full ? '#EFE7D2' : '#fff', cursor: 'pointer', opacity: full ? .62 : 1, textAlign: 'left' }}>
          <span style={{ width: 22, height: 22, border: `2.5px solid ${INK}`, borderRadius: 7, background: on ? GREEN : '#fff', color: on ? '#fff' : 'rgba(0,0,0,.45)', display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 900, flexShrink: 0 }}>{on ? '✓' : full ? '🔒' : ''}</span>
          <span style={{ ...OSWALD, fontWeight: 900, fontSize: 12.5, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</span>
          {on && <span style={{ background: GREEN, color: '#fff', border: `2px solid ${INK}`, borderRadius: 999, fontSize: 7, fontWeight: 900, padding: '1px 5px', flexShrink: 0 }}>{tr('toque pra tirar', 'tap to remove')}</span>}
          <span style={{ fontSize: 8.5, fontWeight: 700, color: 'rgba(0,0,0,.5)', whiteSpace: 'nowrap', flexShrink: 0 }}>{c.club} · {c.year}</span>
        </button> })}
        {list.length === 0 && <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(0,0,0,.45)', textAlign: 'center', padding: 14 }}>{tr('ninguém com esse nome aqui… 🔎', 'nobody with that name here… 🔎')}</p>}
      </div>
    </div>
    <div style={{ border: `3px solid ${INK}`, borderRadius: 14, overflow: 'hidden', boxShadow: `4px 4px 0 0 ${INK}`, marginBottom: 10 }}>
      <div style={{ background: INK, color: '#fff', height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
        <span style={{ ...OSWALD, fontWeight: 900, fontSize: 11, letterSpacing: .5 }}>{clube} · {selected.length}/11 · {shape}</span>
      </div>
      <div style={{ background: `repeating-linear-gradient(180deg, ${GREEN} 0 34px, #166332 34px 68px)`, padding: '10px 8px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {linha(slotsDe('ATA'))}{linha(slotsDe('MEI'))}{linha([lat[0], ...zag, lat[1]])}{linha(slotsDe('GOL'))}
      </div>
    </div>
    <button type="button" disabled={!registered} onClick={() => registered && onConfirm(selected)} style={registered ? btn(GREEN, '#fff') : btnOff}>
      {registered ? `✓ ${tr('Confirmar os 11 e começar a', 'Confirm the 11 and start the')} ${nomeComp(comp)}` : `${tr('Faltam', 'Missing')} ${11 - selected.length} ${tr('pra fechar os 11', 'to complete the 11')}`}
    </button>
    {/* 🔒 02/10 (Diego): *"depois de escolher o clube não quero opção de trocar clube. Escolheu, já era"*. */}
    <p style={hint}>{tr('Igual à Copa do Mundo: os jogadores do', 'Like the World Cup: the players of')} {clube} {tr('jogam pelo clube deles. A convocação fica congelada durante a campanha. ', 'play for their club. The call-up is frozen for the whole campaign. ')}{userTeam} {tr('mantém escudo e mascote.', 'keeps its crest and mascot.')}</p>
  </>
}

// ⚽ UMA PARTIDA no placar padrão da liga (tempo rolando, lance do gol, mascote). É o SEU
// jogo — ou, pra quem só assiste, a final do Mundial (um jogo só, merece o placar grande).
// 📢 APITO FINAL DE COPA (Diego 02/10: na final aparecia "três pontos no bolso", frase de liga).
// Grupos e tabela continuam com as frases da liga (lá tem ponto mesmo); mata-mata e final ganham as suas.
function frasesDoApito(fase: 'liga' | 'ida' | 'volta' | 'final', comp: Comp, voce: string) {
  if (fase === 'liga') return undefined
  const taca = comp === 'mundial' ? tr('o mundo', 'the world') : nomeComp(comp)
  if (fase === 'final') return {
    win: [tr(`🏆 Apito final — É CAMPEÃO! O ${voce} levanta a ${taca}`, `🏆 Final whistle — CHAMPIONS! ${voce} lift the ${taca}`), tr('🏆 Acabou — A TAÇA É NOSSA! Volta olímpica 🎉', '🏆 It’s over — THE CUP IS OURS! Lap of honour 🎉'), tr('🏆 O juiz encerrou: CAMPEÃO! Noite pra entrar na história', '🏆 The referee ends it: CHAMPIONS! A night for the history books')],
    lose: [tr('📢 Apito final — vice. Doeu, mas chegou até a final 😤', '📢 Final whistle — runners-up. It hurts, but we reached the final 😤'), tr('📢 Acabou — a taça escapou na decisão 😤', '📢 It’s over — the cup slipped away in the final 😤'), tr('📢 O juiz encerrou: vice-campeão. Cabeça erguida 😤', '📢 The referee ends it: runners-up. Heads up 😤')],
    draw: [tr('📢 Fim do tempo normal — empate! A taça vai pros PÊNALTIS 🥅', '📢 End of normal time — a draw! The cup goes to PENALTIES 🥅'), tr('📢 Tudo igual na decisão — vai pros pênaltis 🥅', '📢 All square in the final — penalties decide it 🥅')],
  }
  if (fase === 'ida') return {
    win: [tr('📢 Fim do jogo de ida — VITÓRIA! Vantagem pra volta 🎉', '📢 End of the first leg — WIN! An edge for the return 🎉'), tr('📢 Acabou a ida — saímos na frente. Falta a volta 🎉', '📢 First leg over — we lead. The return is next 🎉')],
    lose: [tr('📢 Fim do jogo de ida — derrota. Dá pra virar na volta 😤', '📢 End of the first leg — defeat. We can turn it around 😤'), tr('📢 Acabou a ida — saímos atrás. Tudo na volta 😤', '📢 First leg over — we trail. It all comes down to the return 😤')],
    draw: [tr('📢 Fim do jogo de ida — empate. Tudo aberto pra volta 🤝', '📢 End of the first leg — a draw. Wide open for the return 🤝')],
  }
  return {
    win: [tr('📢 Apito final — VITÓRIA na volta! Confira o agregado 🎉', '📢 Final whistle — WIN in the return leg! Check the aggregate 🎉'), tr('📢 Acabou — ganhamos a volta 🎉', '📢 It’s over — we won the return leg 🎉')],
    lose: [tr('📢 Apito final — derrota na volta. Confira o agregado 😤', '📢 Final whistle — lost the return leg. Check the aggregate 😤')],
    draw: [tr('📢 Apito final — empate na volta. O agregado decide 🤝', '📢 Final whistle — a draw in the return. The aggregate decides 🤝')],
  }
}

function JogoGrande({ match, campaign, comp, roundKey, speed, onFim, fase = 'liga' }: { match: InternationalMatch; campaign: InternationalCampaign; comp: Comp; roundKey: number; speed: number; onFim: () => void; fase?: 'liga' | 'ida' | 'volta' | 'final' }) {
  const teams = new Map(campaign.teams.map(t => [t.id, t]))
  const home = teams.get(match.home)!, away = teams.get(match.away)!
  const goals: ScoreGoal[] = match.goals.map(g => ({ name: g.name, min: g.min, home: g.home, assist: g.assist }))
  const [fim, setFim] = useState(false)
  useEffect(() => { setFim(false) }, [roundKey])
  useApitoDeLargada('intl-carreira', roundKey, true)
  const tecnico = `${tr('TÉCNICO', 'COACH')}: ${campaign.userTeam.toUpperCase()}`
  return <LiveScoreCard enhancedCareer homeName={home.institution} awayName={away.institution}
    homeColor={copaSideColor(home.institution)} awayColor={copaSideColor(away.institution)}
    homeEmblem={<SeloClube clube={home.institution} size={58} />} awayEmblem={<SeloClube clube={away.institution} size={58} />}
    homeOwner={home.you ? tecnico : undefined} awayOwner={away.you ? tecnico : undefined}
    mascotHome={home.you ? campaign.userTeam : undefined} mascotAway={away.you ? campaign.userTeam : undefined}
    apitoFrases={frasesDoApito(fase, comp, home.you ? home.institution : away.institution)}
    youIsHome={home.you} goals={goals} roundKey={roundKey} roundMs={Math.round(COPA_LEG_MS / 0.82 / speed)} footTint={tintComp(comp)}
    onMinuteChange={m => { if (m >= 93 && !fim) { setFim(true); onFim() } }} />
}

export function CareerInternationalView(p: Props) {
  const { state, dispatch } = useEsc()
  // 🎮 RITMO — a MESMA régua da Copa da carreira: manual só pra quem tem Modo Manual (ou
  // carreira antiga, sem `careerEra`); a preferência fica no aparelho (`useSimMode`).
  const [manualPref, toggleSim] = useSimMode()
  const hasManual = useHasManual()
  const manualAllowed = !state.careerEra || hasManual
  const manual = manualPref && manualAllowed
  const speed = state.simSpeed && state.simSpeed > 0 ? state.simSpeed : 1
  const toggleManual = () => { const goingManual = !manual; toggleSim(); if (!goingManual && speed !== 1) dispatch({ type: 'SET_SIM_SPEED', speed: 1 }) }
  // 🔒 o clube escolhido fica GRAVADO por temporada: recarregar a tela não reabre a escolha
  const escolhaSalva = leEscolha(p.season)
  const [comp, setComp] = useState<InternationalCompetition | null>(escolhaSalva?.comp ?? null)
  const [club, setClubRaw] = useState<string | null>(escolhaSalva?.club ?? null)
  const aceita = (cv: Convite) => { gravaEscolha(p.season, cv.comp, cv.club); setComp(cv.comp); setClubRaw(cv.club) }
  const [modo, setModo] = useState<ModoSemVaga | null>(() => leModo(p.season))
  const [celebrate, setCelebrate] = useState(false)
  const champsOk = championsLiberada(p.history)
  // 🧢 tem vaga E algum clube liberado (e aberto: Champions só depois da Liberta) fecha um time
  const podeInscrever = p.choices.some(c => clubeFechaTime(c.name) && (c.competition === 'libertadores' || champsOk))
  const convites = useMemo(() => convitesDaTemporada(p.seed, p.season, p.priority, p.choices, champsOk, clubeDaRenovacao(p.history, p.season)), [p.seed, p.season, p.priority, p.choices, champsOk, p.history])
  const current = useMemo(() => p.campaign?.season === p.season ? comNomeDoClube(p.campaign) : null, [p.campaign, p.season])
  const finished = p.history.some(entry => entry.season === p.season)
  const rep = current?.representedClub ?? null
  const myComp: InternationalCompetition | null = rep ? (INTERNATIONAL_CLUBS.find(c => c.name === rep)?.competition ?? null) : null
  // 👀 a competição EM FOCO: a minha, ou a que escolhi acompanhar (sem vaga)
  const foco: InternationalCompetition | null = myComp ?? (modo && modo !== 'pular' ? modo : null)
  const begin = (representedClub: string | null, xi: Card[]) => {
    const c = makeInternationalCampaign({ season: p.season, seed: p.seed, representedClub, userTeam: p.userTeam, userId: p.userId, priority: representedClub ? p.priority : null, userXI: representedClub ? xi : [] })
    // ✉️ guarda os convites que ficaram na mesa — o jornal cobra se um deles levantar a taça
    const recusados = representedClub ? convites.filter(cv => cv.club !== representedClub).map(cv => cv.club) : []
    p.onStart(recusados.length ? { ...c, recusados } : c)
  }
  const escolheModo = (m: ModoSemVaga) => { gravaModo(p.season, m); setModo(m); if (!current) begin(null, []) }
  // ── a noite atual ──────────────────────────────────────────────────────────
  const reveal = current?.reveal ?? 0
  const step = current && reveal < current.steps.length ? current.steps[reveal] : null
  const faseFoco: InternationalPhase | undefined = step ? (step.mundial ?? (foco ? step[foco] : undefined)) : undefined
  const compDaFase: Comp | null = faseFoco ? faseFoco.competition : null
  const meusJogos = useMemo(() => faseFoco && rep ? faseFoco.matches.filter(m => m.home === rep || m.away === rep) : [], [faseFoco, rep])
  const minhaTie: InternationalTie | undefined = faseFoco?.ties?.find(t => rep && (t.home === rep || t.away === rep))
  const [jogo, setJogo] = useState(0)
  const [fimJogo, setFimJogo] = useState(false)
  // 📊 grupos da Liberta: MEU GRUPO / TODOS OS GRUPOS — o mesmo seletor da Liberta do online
  const [grupoView, setGrupoView] = useState<'meu' | 'todos'>('meu')
  useEffect(() => { setJogo(0); setFimJogo(false) }, [reveal])
  // 🎬 o jogo do placar grande: o meu — ou, quem não está nele, a FINAL (da competição em foco
  // ou do Mundial). Diego 02/10: a final da Libertadores que ele não jogou ficou sem destaque.
  const ehFinal = compDaFase === 'mundial' || faseFoco?.title === 'Final'
  const jogoGrande: InternationalMatch | undefined = meusJogos[jogo]
  // 🏆 a final que eu só ASSISTO vai no cartão de destaque (o placar grande é sempre "você × rival")
  const finalNeutra: InternationalPhase | undefined = !meusJogos.length && ehFinal ? faseFoco : undefined
  // 🦵 quantas PERNAS a noite tem (ida e volta no mata-mata; uma nos grupos e nas finais)
  const pernas = Math.max(1, meusJogos.length, ...(faseFoco?.ties?.map(t => t.matches.length) ?? [1]))
  const ultimoJogo = jogo >= pernas - 1
  const pronto = fimJogo && ultimoJogo // a NOITE inteira acabou (tabela e a outra final só depois disso)
  // ⏱️ o relógio da perna: o MESMO do placar grande, pra todo jogo da noite andar junto
  const legMs = Math.round(COPA_LEG_MS / 0.82 / speed)
  const startedAt = useRoundPresentationStart(reveal * 10 + jogo)
  const avancar = () => {
    if (!current) return
    if (rep && (faseFoco?.title === 'Final' && (current.libertadoresChampion === rep || current.championsChampion === rep) || faseFoco?.competition === 'mundial' && current.mundialChampion === rep) && mascoteKeyDoTime(p.userTeam)) setCelebrate(true)
    p.onAdvance()
  }
  const proximo = () => { if (!ultimoJogo) { setJogo(j => j + 1); setFimJogo(false) } else avancar() }
  // 🤫 noite em que a competição EM FOCO não joga: passa sozinha (é assim que "não vejo a outra")
  const noiteVazia = !!current && !!step && !!foco && !faseFoco
  useEffect(() => { if (noiteVazia) p.onAdvance() }, [noiteVazia, reveal]) // eslint-disable-line react-hooks/exhaustive-deps
  // ⏭️ PULAR (sem vaga): a campanha roda inteira sem mostrar nada e já encerra
  const pulando = !!current && !rep && modo === 'pular' && !finished
  useEffect(() => {
    if (!pulando || !current) return
    if (current.reveal < current.steps.length) p.onAdvance()
    else p.onFinish(summarizeInternationalCampaign(p.campaign!))
  }, [pulando, current?.reveal]) // eslint-disable-line react-hooks/exhaustive-deps
  // ⏩ ritmo AUTO: depois do apito o jogo de volta / a próxima noite vêm sozinhos
  useEffect(() => {
    if (manual || !current || !fimJogo) return
    const t = setTimeout(proximo, ultimoJogo ? 2600 : 1400)
    return () => clearTimeout(t)
  }, [manual, fimJogo, ultimoJogo]) // eslint-disable-line react-hooks/exhaustive-deps
  // 🎬 perna SEM placar grande (não estou nela): o apito vem do relógio, igual aos cartões
  useEffect(() => {
    if (!current || !faseFoco || jogoGrande || noiteVazia || fimJogo) return
    const t = setTimeout(() => setFimJogo(true), Math.max(0, startedAt + legMs * .82 + 250 - Date.now()))
    return () => clearTimeout(t)
  }, [reveal, jogo, !!jogoGrande, noiteVazia, legMs, startedAt, fimJogo]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── classificação (anti-spoiler: a noite de hoje só entra depois do apito) ──
  const tabelas = useMemo(() => {
    if (!current || !foco || !faseFoco || faseFoco.competition === 'mundial') return null
    const emGrupos = faseFoco.title.startsWith('Grupos') || faseFoco.title.startsWith('Tabela')
    if (!emGrupos) return null
    const reveladas = current.steps.slice(0, reveal + (pronto ? 1 : 0))
    if (foco === 'libertadores') {
      const jogos = reveladas.flatMap(s => s.libertadores?.title.startsWith('Grupos') ? s.libertadores.matches : [])
      const grupos = current.libertadoresGroups.map((g, gi) => ({ letra: String.fromCharCode(65 + gi), ids: g.map(r => r.team) }))
      const meu = grupos.findIndex(g => rep && g.ids.includes(rep))
      const ordem = meu >= 0 ? [grupos[meu], ...grupos.filter((_, i) => i !== meu)] : grupos
      return ordem.map(g => ({ titulo: `${tr('Grupo', 'Group')} ${g.letra}${rep && g.ids.includes(rep) ? tr(' · o seu', ' · yours') : ''}`, rows: tableFor(g.ids, jogos.filter(m => g.ids.includes(m.home) && g.ids.includes(m.away))), cortes: (i: number) => i < 2 ? GREEN : i === 2 ? GOLD : null, legenda: [{ cor: GREEN, txt: tr('2 primeiros passam', 'top 2 go through') }, { cor: GOLD, txt: tr('3º entre os 4 melhores', '3rd among the best 4') }], apaga: undefined as number | undefined }))
    }
    const ids = current.championsTable.map(r => r.team)
    const jogos = reveladas.flatMap(s => s.champions?.title.startsWith('Tabela') ? s.champions.matches : [])
    return [{ titulo: tr('Tabela · 36 clubes', 'Table · 36 clubs'), rows: tableFor(ids, jogos), cortes: (i: number) => i < 8 ? GREEN : i < 24 ? GOLD : '#9A9384', legenda: [{ cor: GREEN, txt: tr('1º–8º direto pras oitavas', '1st–8th straight to the last 16') }, { cor: GOLD, txt: tr('9º–24º repescão', '9th–24th play-off') }, { cor: '#9A9384', txt: tr('25º–36º fora', '25th–36th out') }], apaga: 24 as number | undefined }]
  }, [current, foco, faseFoco, reveal, pronto, rep])
  // 🔵 progresso: quantas noites da competição em foco já passaram, de quantas
  const progresso = useMemo(() => {
    if (!current || !foco) return null
    const noites = current.steps.filter(s => s[foco] || s.mundial)
    const feitas = current.steps.slice(0, reveal).filter(s => s[foco] || s.mundial).length
    return { total: noites.length, feitas }
  }, [current, foco, reveal])

  // ── ESTANTE (fica embaixo de tudo, dobrada) ────────────────────────────────
  const rodape = <>
    {p.history.filter(e => e.representedClub).length > 0 && <details style={{ marginTop: 15 }}><summary><b>{tr('ESTANTE · CLUBES REPRESENTADOS', 'SHELF · CLUBS REPRESENTED')}</b></summary>{INTERNATIONAL_CLUBS.filter(c => p.history.some(e => e.representedClub === c.name)).map(c => { const rows = p.history.filter(e => e.representedClub === c.name); const total = (key: 'games' | 'wins' | 'draws' | 'losses' | 'goalsFor' | 'goalsAgainst' | 'libertadores' | 'champions' | 'mundial' | 'runnerUp') => rows.reduce((n, e) => n + e[key], 0); const leaders = clubLeaders(rows); return <p key={c.name} style={{ fontSize: 12 }}><SeloClube clube={c.name} size={20} /> <b>{c.name}</b> · {rows.length} {tr('participações', 'entries')} ({rows.map(e => e.season).join(', ')}) · {total('games')} J · {total('wins')} V · {total('draws')} E · {total('losses')} D · {total('goalsFor')} GP · {total('goalsAgainst')} GC · {total('libertadores')} Libertadores · {total('champions')} Champions · {total('mundial')} {tr('Mundiais', 'Club World Cups')} · {total('runnerUp')} {tr('vices', 'runner-ups')} · {tr('artilheiro', 'top scorer')}: {leaders.scorer?.name ?? '—'} ({leaders.scorer?.goals ?? 0}) · {tr('garçom', 'top assists')}: {leaders.assistant?.name ?? '—'} ({leaders.assistant?.assists ?? 0})</p> })}</details>}
    {/* 🚫 01/10 (Diego): o "ranking internacional de clubes" saiu da tela — *"não serve pra nada"*. O que conta pro usuário é o ranking GLOBAL (aba Rank). */}
  </>

  // 🎮 o cartão de controle — a MESMA peça da Copa da carreira (velocidade + Próxima/Pular/Auto;
  // no auto só o botão de pausar; sem Modo Manual, o cadeado que leva pro Apoie)
  const controle = (label: string, canNext: boolean) => manualAllowed ? (
    <div className="ll-cx-controle" style={{ ...card, padding: 10 }}>
      <p style={{ ...OSWALD, fontWeight: 900, fontSize: 9.5, letterSpacing: 1, color: 'rgba(0,0,0,.45)', margin: '0 0 7px 2px' }}>{tr('🎮 Controle da partida', '🎮 Match controls')}</p>
      {manual && <SpeedControls speed={speed} onSet={v => dispatch({ type: 'SET_SIM_SPEED', speed: v })} />}
      <SimControls manual={manual} onToggle={toggleManual} canNext={canNext} onNext={proximo} onSkip={proximo} nextLabel={label} />
    </div>
  ) : <QuickManualLock />

  // ══════════════════════════════════════════════════════════════════════════
  // 1) CAMPANHA ENCERRADA nesta temporada: só o resumo
  if (finished && current) {
    const mine = p.history.find(e => e.season === p.season)
    return <section style={frame} aria-label="Futebol internacional de clubes">
      <span style={kicker}>{tr('Temporada', 'Season')} {p.season} · {tr('Futebol internacional de clubes', 'International club football')}</span>
      <div style={{ ...card, textAlign: 'center', marginTop: 8 }}>
        <p style={{ margin: 0, fontWeight: 800 }}>🏆 Libertadores: <b>{current.libertadoresChampion}</b> · Champions: <b>{current.championsChampion}</b><br />🌐 {tr('Mundial', 'Club World Cup')}: <b>{current.mundialChampion}</b></p>
        {mine?.representedClub && <p style={{ margin: '8px 0 0', fontSize: 12 }}>{p.userTeam} ({mine.representedClub}): <b>{mine.bestCampaign}</b> · {mine.wins}V {mine.draws}E {mine.losses}D · {mine.goalsFor}–{mine.goalsAgainst}{mine.prizeCoins > 0 && <> · 🪙 +{mine.prizeCoins}</>}</p>}
      </div>
      {rodape}
    </section>
  }

  // 2) AINDA NÃO COMEÇOU: passo 1 (competição) → 2 (clube) → 3 (convocação) · ou sem vaga
  if (!current) {
    const temVaga = p.choices.length > 0 && podeInscrever && convites.length > 0
    const passos = <div style={{ display: 'flex', gap: 5, justifyContent: 'center', margin: '8px 0 2px', flexWrap: 'wrap' }}>
      {([tr('convite', 'invitation'), tr('convocação', 'call-up')]).map((n, k) => { const i = club ? 1 : 0; return <span key={n} style={{ border: `2px solid ${INK}`, borderRadius: 999, padding: '2px 8px', fontSize: 9, fontWeight: 900, background: k < i ? GREEN : k === i ? GOLD : '#fff', color: k < i ? '#fff' : INK }}>{k < i ? '✓ ' : `${k + 1}· `}{n}</span> })}
    </div>
    return <section style={frame} aria-label="Futebol internacional de clubes">
      {!temVaga ? <>
        {/* ── SEM VAGA: pula, ou escolhe QUAL acompanhar (Diego 02/10: *"eu assisto qual?"*) ── */}
        <div style={card}>
          <span style={kicker}>{tr('Temporada', 'Season')} {p.season} · {tr('Futebol internacional de clubes', 'International club football')}</span>
          <h2 style={{ ...OSWALD, fontWeight: 700, fontSize: 22, margin: '4px 0 2px', textAlign: 'center', lineHeight: 1.05, color: INK }}>{p.choices.length ? tr('Sem clube pra convocar', 'No club to call up') : tr('Sem vaga este ano', 'No spot this year')}</h2>
          <p style={{ fontSize: 12, fontWeight: 600, lineHeight: 1.4, textAlign: 'center', margin: '6px 0 0', color: INK }}>
            {p.choices.length
              ? champsOk
                ? tr('Você terminou no G8, mas nenhum clube que te chamaria tem jogadores suficientes no baralho pra fechar um time. Termine mais alto pra receber convites de clubes maiores.', 'You finished in the top 8, but no club that would call you has enough players in the deck to field a team. Finish higher to get invitations from bigger clubs.')
                : tr('Você terminou no G8, mas nenhum clube da Libertadores que te chamaria fecha um time — e a Europa só manda convite depois que você ganhar a Libertadores.', 'You finished in the top 8, but no Libertadores club that would call you can field a team — and Europe only sends invitations after you win the Libertadores.')
              : tr('Os convites vão pro G8 da Série A e pro campeão da Copa do Brasil. Ano que vem tem mais.', 'Invitations go to the Série A top 8 and the Copa do Brasil winner. There is always next season.')}
          </p>
          <button type="button" style={{ ...btn('#fff'), marginTop: 12 }} onClick={() => escolheModo('pular')}>⏭️ {tr('Pular as competições', 'Skip the competitions')}</button>
        </div>
        <div style={card}>
          <span style={kicker}>📺 {tr('ou assistir — qual você quer acompanhar?', 'or watch — which one do you want to follow?')}</span>
          <div className="ll37-intl-heroes" style={{ marginTop: 8 }}>
            <CompetitionStage kind="liberta" title="CONMEBOL" phase="LIBERTADORES" detail="">
              <div style={{ padding: '0 12px 12px' }}><button type="button" style={{ ...btn(), fontSize: 12, padding: 8 }} onClick={() => escolheModo('libertadores')}>{tr('Acompanhar a Libertadores', 'Follow the Libertadores')} ›</button></div>
            </CompetitionStage>
            <CompetitionStage kind="champions" title="UEFA" phase="CHAMPIONS LEAGUE" detail="">
              <div style={{ padding: '0 12px 12px' }}><button type="button" style={{ ...btn('#fff'), fontSize: 12, padding: 8 }} onClick={() => escolheModo('champions')}>{tr('Acompanhar a Champions', 'Follow the Champions')} ›</button></div>
            </CompetitionStage>
          </div>
          <p style={hint}>{tr('Você segue UMA, na mesma tela de quem joga (tabela + jogos da noite, mesmo controle auto/manual). No fim, o Mundial aparece pros dois lados.', 'You follow ONE, on the same screen as the players (table + matches of the night, same auto/manual controls). At the end, the Club World Cup shows up for both sides.')}</p>
        </div>
        <p style={hint}>⏭️ {tr('Pulou? A temporada fecha os campeões por trás e segue pro jornal. Nada trava.', 'Skipped? The season settles the champions behind the scenes and moves on to the paper. Nothing gets stuck.')}</p>
      </> : !club || !comp ? <>
        {/* ── ✉️ OS CONVITES (no lugar de escolher competição e clube num cardápio) ── */}
        <div style={card}>
          <span style={kicker}>{tr('Temporada', 'Season')} {p.season} · {tr('Futebol internacional de clubes', 'International club football')}</span>
          <h2 style={{ ...OSWALD, fontWeight: 700, fontSize: 22, margin: '4px 0 2px', textAlign: 'center', lineHeight: 1.05, color: INK }}>✉️ {convites.length} {tr('convites chegaram', 'invitations arrived')}</h2>
          <p style={{ fontSize: 12, fontWeight: 600, lineHeight: 1.4, textAlign: 'center', margin: '6px 0 0', color: INK }}>{tr('Pela sua campanha na Série A, clubes grandes querem você como técnico convidado. Aceite UM — depois de aceitar, não troca.', 'After your Série A campaign, big clubs want you as guest coach. Accept ONE — once accepted, no switching.')}</p>
        </div>
        {convites.map(cv => <CartaConvite key={cv.club} convite={cv} userTeam={p.userTeam} season={p.season} onAceitar={() => aceita(cv)} />)}
        <p style={hint}>🌐 {tr('O Mundial de Clubes vem só no fim: o campeão da sua competição pega o campeão da outra, em jogo único.', 'The Club World Cup comes only at the end: your champion faces the other champion in a single match.')}{!champsOk && <> 🔒 {tr('A Europa (Champions) só manda convite depois que você levantar a Libertadores — e aí fica aberta pra sempre nesta carreira.', 'Europe (Champions) only sends invitations after you lift the Libertadores — then it stays open for good in this career.')}</>}</p>
      </> : <>
        {/* ── PASSO 3: a convocação ── */}
        {passos}
        <InscricaoClube userTeam={p.userTeam} clube={club} comp={comp} onConfirm={xi => begin(club, xi)} />
      </>}
      {rodape}
    </section>
  }

  // 3) CAMPANHA RODANDO
  const acabou = reveal >= current.steps.length
  const teams = new Map(current.teams.map(t => [t.id, t]))
  const nomeDe = (id: string) => teams.get(id)?.name ?? id
  const fimDaTie = minhaTie && fimJogo && ultimoJogo
  const compBanner: Comp = compDaFase ?? foco ?? 'libertadores'
  // 🏆 noite das finais: a outra final aparece num cartão (depois do apito da minha)
  const outraFinal = step && foco && faseFoco?.title === 'Final' ? step[outra(foco)] : undefined
  const finalDaOutraTambem = outraFinal?.title === 'Final' ? outraFinal : undefined
  const rotuloProximo = !fimJogo ? tr('⏳ Deixa o jogo acabar…', '⏳ Let the match finish…')
    : !ultimoJogo ? tr('▶️ Jogo de volta', '▶️ 2nd leg')
    : compDaFase === 'mundial' ? tr('🏆 Ver o campeão', '🏆 See the champion')
    : faseFoco?.title === 'Final' ? tr('▶️ Ir pro Mundial', '▶️ On to the Club World Cup')
    : tr('▶️ Próxima rodada', '▶️ Next round')
  // 🚶 "pulando" (sem vaga, modo pular) ou sem foco (recarregou no meio e a escolha se perdeu)
  if (!rep && (pulando || !foco)) {
    return <section style={frame} aria-label="Futebol internacional de clubes">
      <span style={kicker}>{tr('Temporada', 'Season')} {p.season} · {tr('Futebol internacional de clubes', 'International club football')}</span>
      {pulando ? <p style={{ textAlign: 'center', fontWeight: 800, padding: 12 }}>⏭️ {tr('Pulando as competições…', 'Skipping the competitions…')}</p> : <div style={{ ...card, marginTop: 8 }}>
        <span style={kicker}>📺 {tr('qual você quer acompanhar?', 'which one do you want to follow?')}</span>
        <button type="button" style={{ ...btn(), marginTop: 10 }} onClick={() => escolheModo('libertadores')}>🌎 Libertadores ›</button>
        <button type="button" style={{ ...btn('#fff'), marginTop: 8 }} onClick={() => escolheModo('champions')}>🌍 Champions League ›</button>
        <button type="button" style={{ ...btn('#fff'), marginTop: 8, fontSize: 12, padding: 8 }} onClick={() => escolheModo('pular')}>⏭️ {tr('Pular as competições', 'Skip the competitions')}</button>
      </div>}
      {rodape}
    </section>
  }
  return <section style={frame} aria-label="Futebol internacional de clubes">
    {celebrate && mascoteKeyDoTime(p.userTeam) && <FestaoMascote nome={p.userTeam} mascote={mascoteKeyDoTime(p.userTeam)!} onDone={() => setCelebrate(false)} />}
    {acabou ? <>
      {/* ── FIM: campeões + encerrar ── */}
      <Faixa comp={foco ?? 'libertadores'} titulo={tr('Campanha encerrada', 'Campaign over')} sub={rep ? `${rep} · ${tr('técnico', 'coach')}: ${p.userTeam}` : tr('você acompanhou a', 'you followed the') + ' ' + nomeComp(foco!)} />
      <div style={{ ...card, textAlign: 'center' }}>
        <p style={{ margin: 0, fontWeight: 800 }}>🏆 Libertadores: <b>{nomeDe(current.libertadoresChampion)}</b> · Champions: <b>{nomeDe(current.championsChampion)}</b><br />🌐 {tr('Mundial', 'Club World Cup')}: <b>{nomeDe(current.mundialChampion)}</b></p>
        {rep && <p style={{ margin: '8px 0 0', fontSize: 12 }}>{summarizeInternationalCampaign(current).bestCampaign}{summarizeInternationalCampaign(current).prizeCoins > 0 && <> · 🪙 +{summarizeInternationalCampaign(current).prizeCoins}</>}</p>}
      </div>
      <button type="button" style={btn()} onClick={() => p.onFinish(summarizeInternationalCampaign(p.campaign!))}>{tr('Encerrar e ver o jornal', 'Finish and read the paper')} ›</button>
    </> : noiteVazia || !faseFoco || !step ? <p style={{ textAlign: 'center', fontWeight: 800, padding: 12 }}>⏳</p> : <>
      {/* ── A NOITE DA COMPETIÇÃO EM FOCO ── (a competição e a fase moram no cabeçalho de
          cima, grande, no padrão da Copa; aqui fica a faixa só fora do cabeçalho novo) */}
      {!p.topoGrande && <Faixa comp={compBanner} titulo={compDaFase === 'mundial' ? tr('Mundial de Clubes · final', 'Club World Cup · final') : `${nomeComp(compBanner)} · ${tituloFase(faseFoco.title)}`}
        sub={compDaFase === 'mundial' ? `${tr('jogo único', 'single match')} · ${nomeDe(current.libertadoresChampion)} × ${nomeDe(current.championsChampion)}`
          : faseFoco.title === 'Final' ? `${tr('jogo único', 'single match')} · ${tr('noite das finais', 'night of the finals')}`
          : rep ? `${rep} · ${tr('técnico', 'coach')}: ${p.userTeam}${minhaTie && minhaTie.matches.length === 2 ? ` · ${jogo === 0 ? tr('jogo de ida', '1st leg') : tr('jogo de volta', '2nd leg')}` : ''}`
          : `📺 ${tr('você acompanha', 'you are following')} · ${orgComp(compBanner)}`} />}
      {progresso && <div style={{ display: 'flex', gap: 4, justifyContent: 'center', margin: '0 0 10px', flexWrap: 'wrap' }}>{Array.from({ length: progresso.total }, (_, i) => <i key={i} style={{ width: 18, height: 6, borderRadius: 3, background: i < progresso.feitas ? GREEN : i === progresso.feitas ? GOLD : '#0003', outline: i === progresso.feitas ? `2px solid ${INK}` : 'none' }} />)}</div>}
      {p.topoGrande && minhaTie && minhaTie.matches.length === 2 && <p style={{ ...OSWALD, fontWeight: 700, fontSize: 12, textAlign: 'center', margin: '-4px 0 8px', color: INK }}>{jogo === 0 ? tr('⚽ Jogo de ida', '⚽ 1st leg') : tr('⚽ Jogo de volta', '⚽ 2nd leg')}</p>}
      {/* 📺 o placar grande */}
      {jogoGrande && <JogoGrande match={jogoGrande} campaign={current} comp={compBanner} roundKey={reveal * 10 + jogo} speed={speed} onFim={() => setFimJogo(true)} fase={!minhaTie ? 'liga' : minhaTie.matches.length === 1 ? 'final' : jogo === 0 ? 'ida' : 'volta'} />}
      {finalNeutra && <FinalCard phase={finalNeutra} campaign={current} titulo={compDaFase === 'mundial' ? tr('A final do Mundial de Clubes', 'The Club World Cup final') : `${tr('A final da', 'The final of the')} ${nomeComp(compDaFase!)}`} startedAt={startedAt} legMs={legMs} finished={fimJogo} roundKey={reveal * 10 + jogo} />}
      {!meusJogos.length && rep && !ehFinal && <div style={{ ...card, textAlign: 'center' }}><p style={{ margin: 0, fontWeight: 800, fontSize: 12, color: INK }}>{tr('Você já está fora desta fase. Os jogos da noite:', 'You are out of this stage. Tonight\'s matches:')}</p></div>}
      {fimDaTie && minhaTie && <div style={{ background: '#fff', border: `3px solid ${INK}`, borderRadius: 12, padding: '6px 10px', marginTop: -4, marginBottom: 10, textAlign: 'center' }}>
        {minhaTie.matches.length === 2 && <p style={{ fontSize: 9.5, fontWeight: 800, color: 'rgba(0,0,0,.55)', margin: '0 0 3px' }}>{tr('ida', '1st leg')} {minhaTie.matches[0].hg}×{minhaTie.matches[0].ag} · {tr('volta', '2nd leg')} {minhaTie.matches[1].hg}×{minhaTie.matches[1].ag} · <b>{tr('agregado', 'aggregate')} {minhaTie.matches[0].hg + minhaTie.matches[1].ag}×{minhaTie.matches[0].ag + minhaTie.matches[1].hg}</b> ({nomeDe(minhaTie.home)} × {nomeDe(minhaTie.away)})</p>}
        {minhaTie.penalties && <p style={{ margin: '2px 0', fontWeight: 900, ...OSWALD, fontSize: 13 }}>🥅 {tr('Pênaltis', 'Penalties')} {minhaTie.penalties[0]} × {minhaTie.penalties[1]}</p>}
        <p style={{ margin: '3px 0 0', fontWeight: 900, fontSize: 11, ...OSWALD, color: minhaTie.winner === rep ? GREEN : '#C2452F' }}>{minhaTie.winner === rep ? `✅ ${p.userTeam} ${compDaFase === 'mundial' || faseFoco.title === 'Final' ? tr('é campeão!', 'is champion!') : tr('avança', 'advances')}` : `❌ ${nomeDe(minhaTie.winner)} ${compDaFase === 'mundial' || faseFoco.title === 'Final' ? tr('é campeão', 'is champion') : tr('avança', 'advances')}`}</p>
      </div>}
      {/* 🎮 o controle, logo abaixo do placar — igual à Copa */}
      {controle(rotuloProximo, fimJogo)}
      {/* 🏆 noite das finais: a outra final, depois do apito da minha */}
      {pronto && finalDaOutraTambem && <FinalCard phase={finalDaOutraTambem} campaign={current} titulo={`${tr('A outra final', 'The other final')} · ${nomeComp(finalDaOutraTambem.competition)} · ${tr('mesma noite', 'same night')}`} />}
      {/* 📊 a tabela SEMPRE à vista (grupos / tabela de 36); no mata-mata, as chaves da noite */}
      {tabelas && tabelas.length > 1 && rep && <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
        {(['meu', 'todos'] as const).map(v => <button key={v} type="button" onClick={() => setGrupoView(v)} style={{ flex: 1, border: `2.5px solid ${INK}`, borderRadius: 11, padding: '7px 4px', fontWeight: 900, fontSize: 11.5, ...OSWALD, background: grupoView === v ? GOLD : '#fff', color: INK, boxShadow: grupoView === v ? `2px 2px 0 ${INK}` : 'none', cursor: 'pointer' }}>{v === 'meu' ? tr('Meu grupo', 'My group') : tr('Todos os grupos', 'All groups')}</button>)}
      </div>}
      {tabelas?.filter((_, i) => i === 0 || !rep || grupoView === 'todos').map(t => <Tabela key={t.titulo} rows={t.rows} me={rep} cortes={t.cortes} titulo={t.titulo} campaign={current} legenda={t.legenda} apagaDepoisDe={t.apaga} />)}
      {/* 🥅 os outros jogos da noite — só depois do apito, senão o placar grande é entregue aqui embaixo.
          Noite de grupos/tabela (17–18 jogos) vai em pílulas compactas; mata-mata (≤ 8) em cartão. */}
      {(() => {
        const jogos = finalNeutra ? [] : jogosDaPerna(faseFoco, jogo).filter(j => !jogoGrande || (j.match.home !== jogoGrande.home && j.match.away !== jogoGrande.home))
        const props = { jogos, campaign: current, startedAt, legMs, roundKey: reveal * 10 + jogo, finished: fimJogo, titulo: jogoGrande ? tr('🥅 Os outros jogos da noite', '🥅 The other matches tonight') : tr('🥅 Os jogos da noite', '🥅 Tonight\'s matches') }
        return tabelas ? <PilulasDaNoite {...props} /> : <ListaDaNoite {...props} />
      })()}
    </>}
    {rodape}
  </section>
}

// 🧢 A CARREIRA DO PRESIDENTE (Diego 02/10, mockup aprovado: *"ok tudo aprovado"*). Mora no Hall
// de Troféus, embaixo da estante: os clubes que o presidente comandou como TÉCNICO CONVIDADO,
// os números dele e a linha do tempo temporada a temporada (dourado = ano de título). Lê só o
// histórico já gravado (`careerInternationalHistory`) — nada novo no save.
export function CarreiraPresidente({ history }: { history: readonly InternationalHistoryEntry[] }) {
  const camp = [...history].filter(e => e.representedClub).sort((a, b) => a.season - b.season)
  if (!camp.length) return null
  const voce = camp[camp.length - 1].userTeam
  const porClube = new Map<string, { n: number; titulos: number }>()
  for (const e of camp) { const c = porClube.get(e.representedClub!) ?? { n: 0, titulos: 0 }; c.n++; c.titulos += e.libertadores + e.champions + e.mundial; porClube.set(e.representedClub!, c) }
  const jogos = camp.reduce((n, e) => n + e.games, 0)
  const titulos = camp.reduce((n, e) => n + e.libertadores + e.champions + e.mundial, 0)
  const art = new Map<string, { name: string; g: number }>()
  for (const e of camp) for (const pl of e.playerStats ?? []) { const a = art.get(pl.key) ?? { name: pl.name, g: 0 }; a.g += pl.goals; art.set(pl.key, a) }
  const artilheiro = [...art.values()].sort((a, b) => b.g - a.g)[0]
  const primeiraLiberta = camp.find(e => e.libertadores)?.season
  const primeiraEuropa = camp.find(e => e.competition === 'champions')?.season
  const eventos = [...camp].reverse()
  const chip = (txt: string, bg: string, color = INK) => <span key={txt} style={{ display: 'inline-block', ...OSWALD, fontWeight: 700, fontSize: 10, border: `2px solid ${INK}`, borderRadius: 7, padding: '1px 6px', margin: '4px 4px 0 0', background: bg, color }}>{txt}</span>
  return <div style={{ background: '#fff', border: `3px solid ${INK}`, borderRadius: 16, boxShadow: `4px 4px 0 ${INK}`, overflow: 'hidden', marginTop: 12 }}>
    <div style={{ background: INK, color: '#fff', padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
      <Escudo nome={voce} size={40} />
      <div style={{ minWidth: 0 }}><b style={{ ...OSWALD, fontSize: 16, display: 'block', lineHeight: 1 }}>🧢 {tr('Sua carreira de técnico', 'Your coaching career')}</b>
        <small style={{ fontSize: 9.5, fontWeight: 700, color: 'rgba(255,255,255,.7)' }}>{tr(`os clubes que você comandou como técnico convidado, sem largar o ${voce}`, `the clubs you led as guest coach, without leaving ${voce}`)}</small></div>
    </div>
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', padding: '10px 12px', borderBottom: '2px dashed rgba(0,0,0,.12)' }}>
      {[...porClube].map(([club, c]) => <span key={club} style={{ display: 'flex', alignItems: 'center', gap: 5, border: `2px solid ${INK}`, borderRadius: 999, padding: '2px 9px 2px 3px', fontSize: 10.5, fontWeight: 900, background: CREME, color: INK }}>
        <SeloClube clube={club} size={20} />{club} · {c.n} {tr('temp.', 'season' + (c.n > 1 ? 's' : ''))}{c.titulos ? ` · ${'🏆'.repeat(Math.min(c.titulos, 5))}` : ''}</span>)}
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 6, padding: '10px 12px', borderBottom: '2px dashed rgba(0,0,0,.12)', textAlign: 'center' }}>
      {([[String(camp.length), tr('CAMPANHAS', 'CAMPAIGNS')], [String(jogos), tr('JOGOS', 'GAMES')], [String(titulos), tr('TÍTULOS', 'TITLES')], [artilheiro?.g ? artilheiro.name : '—', tr('ARTILHEIRO', 'TOP SCORER')]] as [string, string][]).map(([v, k]) => <div key={k} style={{ border: `2px solid ${INK}`, borderRadius: 10, padding: '5px 2px', background: '#FBF5E4', color: INK, minWidth: 0 }}>
        <b style={{ display: 'block', ...OSWALD, fontSize: v.length > 6 ? 13 : 18, lineHeight: 1.1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{v}</b><small style={{ fontSize: 8, fontWeight: 900, letterSpacing: .5 }}>{k}</small></div>)}
    </div>
    <div style={{ padding: '12px 12px 4px' }}>
      {eventos.map((e, i) => {
        const titulo = e.libertadores || e.champions || e.mundial
        const ant = camp.find(x => x.season === e.season - 1)
        const renovou = !!ant && ant.representedClub === e.representedClub && !!(ant.libertadores || ant.champions)
        const comp = e.competition ?? 'libertadores'
        const fase = e.libertadores || e.champions ? (titulo && (ant?.representedClub === e.representedClub && (ant.libertadores || ant.champions)) ? tr('BICAMPEÃO', 'BACK-TO-BACK') : tr('CAMPEÃO', 'CHAMPION')) + ' 🏆' : e.bestCampaign
        return <div key={e.season} style={{ display: 'grid', gridTemplateColumns: '44px 1fr', gap: 10, position: 'relative', paddingBottom: 14 }}>
          {i < eventos.length - 1 && <span style={{ position: 'absolute', left: 21, top: 40, bottom: 0, width: 3, background: INK }} />}
          <span style={{ width: 44, height: 44, borderRadius: '50%', border: `3px solid ${INK}`, background: titulo ? GOLD : CREME, boxShadow: titulo ? `0 0 0 3px ${GOLD}55` : 'none', display: 'grid', placeItems: 'center', position: 'relative' }}><SeloClube clube={e.representedClub!} size={30} /></span>
          <div style={{ minWidth: 0, color: INK }}>
            <span style={{ fontSize: 9, fontWeight: 900, letterSpacing: 1.2, color: '#6c604a', textTransform: 'uppercase' }}>{tr('Temporada', 'Season')} {e.season} · {emojiComp(comp)} {nomeComp(comp)}{renovou ? ` · ${tr('renovou', 'renewed')}` : ''}</span>
            <h4 style={{ ...OSWALD, fontWeight: 700, fontSize: 15, margin: '1px 0 2px', lineHeight: 1.05 }}>{e.representedClub} · {fase}{e.mundial ? ` + ${tr('Mundial', 'Club World Cup')} 🌐` : ''}</h4>
            <p style={{ fontSize: 10.5, fontWeight: 700, color: '#444', margin: 0 }}>{e.games} {tr('jogos', 'games')} · {e.wins} {tr('vitórias', 'wins')}{e.topScorer ? ` · ${e.topScorer.name} ${e.topScorer.goals} ${tr('gols', 'goals')}` : ''}</p>
            {renovou && chip(`🔁 ${tr('Renovação', 'Renewal')}`, GOLD)}
            {!!e.mundial && chip(`🌐 ${tr('Campeão do mundo', 'World champion')}`, '#7C3AED', '#fff')}
            {e.season === primeiraLiberta && chip(`🔓 ${tr('Champions liberada', 'Champions unlocked')}`, '#BFE6CB')}
            {e.season === primeiraEuropa && chip(tr('Estreia na Europa', 'European debut'), '#e3e8f5')}
            {e.season === camp[0].season && !titulo && <p style={{ fontSize: 10, fontWeight: 700, color: '#666', margin: '3px 0 0' }}>{tr('a primeira vez como técnico convidado', 'the first time as guest coach')}</p>}
          </div>
        </div>
      })}
    </div>
  </div>
}

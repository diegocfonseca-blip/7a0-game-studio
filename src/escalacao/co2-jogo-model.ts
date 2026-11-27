// A fotografia da partida é do dono da carreira; cada clube só acrescenta suas próprias decisões.
import type { EscState, FormationKey, WonCard } from './types'
import { FORMATIONS } from './types'
import type { SimMatch, RoundCardMods } from './pyramidseason'
import { compactarEntrada, taticaM2, type EntradaM2 } from './motor2/carreira'
import { liveInitialIds, liveFormations, validateLivePlan, type CareerLiveDecision } from './career-live-plan'
import { pack, unpack } from './netpack'
export const CO2_JOGO_DURACAO = 90_000
/** Emergência: false impede novas decisões, mas mantém os registros e o relógio já compartilhados. */
export const CO2_TROCAS_HABILITADAS: boolean = true
export type Co2JogoSlot = { partida: string; lado: 0 | 1; xi: string[]; formation: FormationKey; allowed: FormationKey[]; squad: WonCard[]; blocked: string[];lesao?:import('./lesao-partida').LesaoPartida }
export type Co2JogoFoto = { partidas: Record<string, EntradaM2>; clubes: Record<number, Co2JogoSlot> }
export type Co2JogoMeta = Record<number, { partida: string; xi: string[]; pos: Record<string, string>; formation: FormationKey; allowed: Partial<typeof FORMATIONS>; blocked: string[];lesao?:import('./lesao-partida').LesaoPartida }>
export type Co2Jogo = { clinica?:Record<string,import('./lesao-partida').LesaoPartida&{abriu:string}>;lesoes?:Record<string,unknown>; sala: string; chave?:string; temporada: number; rodada: number; z: string; meta: Co2JogoMeta; comandos: Record<number, CareerLiveDecision[]>; revisao: number; duration_ms?: number; elapsed_ms: number; inicio_em: string; velocidade: number; pausado: boolean; encerrado: boolean }
export type Co2Entrada = { initial: EntradaM2; rosters: [WonCard[], WonCard[]] }
export function fotoJogoCo2(state: EscState, matches: readonly SimMatch[], mods: RoundCardMods, repertorios: Record<number, FormationKey[]> = {}) {
  const foto: Co2JogoFoto = { partidas: {}, clubes: {} }, meta: Co2JogoMeta = {}
  for (const match of matches) {
    const e = match.m2
    if (!e?.partidaId) continue
    foto.partidas[e.partidaId] = compactarEntrada({ ...e, preservarGuardado: false })
    for (const [lado, id] of [[0, match.hId], [1, match.aId]] as const) {
      const m = state.managers.find(x => x.id === id && x.isHuman)
      if (!m) continue
      const base = liveInitialIds(e, m), ev = state.eventoTemporada
      const blocked = ev?.mgrId === id && ev.season === state.seasonNo && ev.status === 'banco' && (ev.volta ?? 0) > state.round ? [ev.cardId] : []
      const allowed = [...(repertorios[id] ?? liveFormations(state, m, m.formation, true).filter(f => f.available).map(f => f.motor))]
      if (!allowed.includes(base.formation)) allowed.push(base.formation)
      const squad = m.squad.filter(c => !c.fake).map(c => ({ ...c, gasMod: mods[id]?.[state.round - 1]?.[c.id] ?? (c as {gasMod?:number}).gasMod }))
      const lesao=(id===state.managers[state.youIdx]?.id?state.careerMatchInjury:state.co2?.gavetas.find(g=>g.mgrId===id)?.lesao)
      const clinica=e.partidaId.startsWith('liga:')&&lesao?.status==='programada'&&lesao.season===state.seasonNo&&lesao.round===state.round-1&&base.ids.includes(lesao.cardId)?lesao:undefined
      foto.clubes[id] = {lesao:clinica, partida: e.partidaId, lado, xi: base.ids, formation: base.formation, allowed, squad, blocked }
      meta[id] = {lesao:clinica, partida: e.partidaId, xi: base.ids, pos: Object.fromEntries(squad.map(c => [c.id, c.pos])), formation: base.formation,
        allowed: Object.fromEntries(allowed.filter(k => !!FORMATIONS[k]).map(k => [k, FORMATIONS[k]])), blocked }
    }
  }
  return { z: pack(foto), meta }
}
const fotos = new Map<string, Co2JogoFoto | null>()
export function leFotoCo2(jogo: Co2Jogo): Co2JogoFoto | null {
  if (fotos.has(jogo.z)) return fotos.get(jogo.z)!
  let foto: Co2JogoFoto | null = null
  try { const f = unpack<Co2JogoFoto>(jogo.z); if(f?.partidas&&f.clubes)foto=f } catch { /* pacote inválido */ }
  fotos.set(jogo.z,foto); if(fotos.size>80)fotos.delete(fotos.keys().next().value!)
  return foto
}
/** Os dois lados podem trocar: não reutilizar o antigo `hd`, que escolhe só o primeiro humano do confronto. */
export function entradasJogoCo2(jogos: readonly Co2Jogo[]): Record<string, Co2Entrada> {
  const out: Record<string, Co2Entrada> = {}
  for (const j of jogos) {
    const foto = leFotoCo2(j)
    if (!foto) continue
    for (const [id, e] of Object.entries(foto.partidas)) out[id] = { initial: { ...e, preservarGuardado: false, atualizarIntervalo: true, intervaloRevisao: 1000 + j.revisao, aoVivo: [...(e.aoVivo ?? [])] }, rosters: [[], []] }
    for (const [key, c] of Object.entries(foto.clubes)) {
      const match = out[c.partida], comandos = j.comandos[+key] ?? []
      if (!match) continue
      match.rosters[c.lado] = c.squad
      if (!validateLivePlan({ squad: c.squad, initial: c.xi, formation: c.formation, commands: comandos, allowed: c.allowed, blocked: new Set(c.blocked) })) continue
      const byId = new Map(c.squad.map(x => [x.id, x]))
      match.initial.aoVivo!.push(...comandos.map(x => ({ t: x.t, lado: c.lado, sai: x.sai ? byId.get(x.sai)?.name : undefined,
        entra: x.entra ? byId.get(x.entra) as never : undefined, tatica: x.tactic ? taticaM2(x.tactic) : undefined, formacao: x.formation,...(x.injury?{lesao:true}:{}),...(x.emergencyKeeper?{goleiroEmergencia:byId.get(x.emergencyKeeper)?.name}:{}) })))
    }
    for (const id of Object.keys(foto.partidas)) out[id].initial.aoVivo!.sort((a, b) => a.t - b.t || a.lado - b.lado)
  }
  return out
}
export function minutoJogoCo2(jogo: Co2Jogo | null | undefined, agora: number): number {
  if (!jogo) return 0
  if (jogo.encerrado) return 93
  const delta = jogo.pausado ? 0 : Math.max(0, agora - Date.parse(jogo.inicio_em)) * jogo.velocidade
  const limite=Math.min(93,...Object.entries(jogo.meta??{}).flatMap(([id,m])=>m.lesao&&!jogo.lesoes?.[id]&&!jogo.comandos[+id]?.some(x=>x.sai===m.lesao?.cardId)?[m.lesao.minute]:[]))
  return Math.max(0, Math.min(limite, (jogo.elapsed_ms + delta) / (jogo.duration_ms ?? CO2_JOGO_DURACAO) * 93))
}

import '../../src/App'
import { StrictMode, useReducer, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { EscCtxBancada, INITIAL, reducer } from '../../src/escalacao/store'
import { Co2Temporada } from '../../src/escalacao/co2-telas'
import * as C from '../../src/escalacao/co2'
import { supabase } from '../../src/lib/supabase'
import { useCo2Envio } from '../../src/escalacao/co2-envio'
import { minhaGaveta } from '../../src/escalacao/carreira-online-v2'
import '../../src/index.css'
const W = window as any, q = new URLSearchParams(location.search), modo = q.get('modo') ?? 'livre'
const dono = 'teste-0', uid = q.has('guest') ? 'teste-1' : dono, room = 'teste-co2', entradas = { tactics: {}, lineups: {}, halftime: {}, penalty: {}, mods: {}, cardMods: {} }
let seed = reducer(structuredClone(INITIAL), { type: 'START_CAREER_SOLO', teamName: 'Dono FC', formation: '4-3-3', rivals: 0, co2: { sala: room, nomes: ['Dono FC', 'Amigo FC'], assento: 0 } })
seed = { ...seed, screen: 'season', round: 4, ...(q.has('guest') ? {youIdx:1,co2:{...seed.co2!,assento:1,comanda:false}} : {}) }
let sala = { id: room, codigo: 'QA1234', nome: 'Carreira de teste', dono, vice: null, versao: '', temporada: 1, rodada: 4, fase: 'preparo', prazo: new Date(Date.now() + 60_000).toISOString(), inicio_rodada: null, auto: false, velocidade: 1, pausado: false, comandante: dono }
const mundo = { ordem: [dono, 'teste-1'], modo }
const clubes = seed.managers.filter(m => m.isHuman).map(m => ({ sala: room, assento: m.id, user_id: mundo.ordem[m.id], nome: m.teamName, pronto_rodada: null as number | null, publico: minhaGaveta(m, entradas) }))
W.qa = { falhaEnvio: true, falhaLeitura: false, falhaInicio: false, gravacoes: 0, prontos: 0, inicios: 0, plays: 0, privados: [] as number[], falhaPrivado: true }
const sb = supabase as any
sb.auth.getUser = async () => ({ data: { user: { id: uid } } })
sb.channel = () => ({ on() { return this }, subscribe() { return this }, unsubscribe() {}, send() {}, track() {} })
sb.rpc = async (name: string, args: any) => {
  if(name==='esc_carr_comando'){name=args.p_funcao;args=args.p_args}
  if(name==='esc_carr_sinais_le')return{data:{estado:null,acoes:[]}}
  if (name === 'esc_carr_gaveta') { W.qa.gravacoes++; return { data: W.qa.falhaEnvio ? 'erro' : 'ok' } }
  if (name === 'esc_carr_pronto') { W.qa.prontos++; clubes.find(c=>c.user_id===uid)!.pronto_rodada = args.p_rodada }
  if (name === 'esc_carr_comecar') { W.qa.inicios++; if (W.qa.falhaInicio) return { data: 'erro' }; sala = { ...sala, fase: 'jogando' } }
  return { data: 'ok' }
}
sb.from = (table: string) => {
  let cols = ''
  const get = async () => table === 'esc_carr_clube' ? (W.qa.falhaLeitura ? { data: null, error: { message: 'offline' } } : { data: structuredClone(clubes) }) : { data: cols === 'mundo' ? { mundo } : structuredClone(sala) }
  return { select(s: string) { cols = s; return this }, eq() { return this }, maybeSingle: get, order: get }
}
await C.co2Abrir(room)
W.qaSala = async (patch: any) => { sala = { ...sala, ...patch }; await C.co2RecarregaSala() }
W.qaTodosProntos = async () => { clubes.forEach(c => c.pronto_rodada = sala.rodada + 1); await C.co2RecarregaClubes() }
function App() {
  const [state, dispatch] = useReducer((s: any, a: any) => { if (a.type === 'PLAY_ROUND') { return { ...s, round: s.round + 1 } }; return reducer(s, a) }, seed)
  const [gestao,setGestao]=useState(0)
  W.qaGestao=setGestao
  const privado=useCo2Envio(C.co2Contexto(),String(gestao),gestao,async n=>{if(W.qa.falhaPrivado)return false;W.qa.privados.push(n);return true},1500)
  W.qaPrivadoFalhou=privado.falhou
  W.qa.plays = state.round - 4
  W.qaState = state
  return <EscCtxBancada.Provider value={{ state, dispatch } as any}><main style={{ maxWidth: 1050, margin: 'auto', padding: 16, background: '#F4ECD6', color: '#0C0C0C' }}><h1>Carreira online · {modo}</h1><Co2Temporada entradasLocais={entradas} round={state.round} roundReady={false} seasonOver={false} onEscalacao={() => {}} /></main></EscCtxBancada.Provider>
}
createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>)

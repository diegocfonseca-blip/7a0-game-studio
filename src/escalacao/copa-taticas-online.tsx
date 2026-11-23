import {useOwnerLayout,useOwnerFootballPilot,OwnerSlot,OwnerTactics} from './owner-online-visual'
import {CupPlanPanel,type CupPlanController} from './copa-plano-panel'
// ─── ⚔️ A TÁTICA NA SALA: Copa do Mundo e regionais (23/10) ──────────────────
// O lado do APARELHO da regra de `copa-taticas.ts`:
//   · lê do banco SÓ as linhas congeladas (`esc_copa_taticas`) a cada virada do relógio da copa;
//   · SEGURA a tela no passo anterior enquanto as táticas que decidem o jogo da vez não chegaram — assim nenhum aparelho
//     mostra um placar calculado sem elas (a espera normal é zero: as linhas congelam no apito, 5 s+ antes da bola rolar);
//   · escreve a escolha da pessoa (`esc_copa_tatica_set`) — o banco só aceita com jogo rolando, e ela vale no PRÓXIMO jogo.
// Nenhuma mensagem nova no canal da sala: é leitura/escrita direta, ~2 por jogo por pessoa.
import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { tr } from './lang'
import { TATICAS_COPA, type LinhaTatica, type TaticaCopa } from './copa-taticas'
import type {CupPlanRow} from './copa-planos'
import type {FootballPlan} from './football-live-tactics'

type RowTat = { revision: number; step: number; running: boolean }
type Dado = { key:string;rev:number;linhas: LinhaTatica[]; coberto: number;planos:CupPlanRow[];plansEnabled:boolean }
type PlanPayload={rev:number;step?:number;running?:boolean;linhas:LinhaTatica[];planos?:CupPlanRow[];planos_ativos?:boolean}
const tacticData=(d:PlanPayload,key:string):Dado=>({key,rev:d.rev,linhas:Array.isArray(d.linhas)?d.linhas:[],coberto:d.rev<0||d.step==null?-1:d.running?d.step-1:d.step,planos:Array.isArray(d.planos)?d.planos:[],plansEnabled:!!d.planos_ativos})
/** se o banco não responder, a tela não pode ficar presa pra sempre: depois disto ela segue (só acontece em falha) */
const ESPERA_MAX_MS = 8000

export function useTaticasCopa(tipo: 'mundo' | 'regional', roomId: string, edicao: number, seed: number, row: RowTat | null | undefined, meuUid?: string) {
  const identity=`${roomId}:${tipo}:${edicao}:${seed}:${meuUid??''}`
  const currentIdentity=useRef(identity);currentIdentity.current=identity
  const [stored,setDado]=useState<Dado|null>(null)
  const dado=stored?.key===identity?stored:null
  const [minha,setMinha]=useState<{key:string;value:TaticaCopa}|null>(null)
  const [warning,setWarning]=useState<{key:string;text:string}|null>(null)
  const aviso=warning?.key===identity?warning.text:''
  const pedindo=useRef(false),ativo=!!row
  const accept=useCallback((payload:PlanPayload)=>{
    if(currentIdentity.current!==identity)return
    const next=tacticData(payload,identity)
    setDado(previous=>previous?.key===identity&&previous.rev>next.rev?previous:next)
  },[identity])
  const ler=useCallback(async()=>{
    if(pedindo.current)return
    pedindo.current=true
    try{
      const {data,error}=await supabase.rpc('esc_copa_taticas',{p_room:roomId,p_tipo:tipo,p_edicao:edicao,p_seed:seed})
      if(!error&&data)accept(data as PlanPayload)
    }finally{pedindo.current=false}
  },[tipo,roomId,edicao,seed,accept])
  useEffect(()=>{if(ativo)void ler()},[ativo,row?.revision,ler])
  useEffect(()=>{
    if(!ativo||!meuUid)return
    let alive=true
    void supabase.rpc('esc_copa_plano_registrar',{p_room:roomId,p_tipo:tipo,p_edicao:edicao,p_seed:seed}).then(({data})=>{if(alive&&(data as {ok?:boolean}|null)?.ok)void ler()})
    return()=>{alive=false}
  },[ativo,meuUid,roomId,tipo,edicao,seed,ler])
  const precisa=row?row.step-1:-1,coberto=dado?.coberto??-1
  useEffect(()=>{if(!ativo||coberto>=precisa)return;const timer=setInterval(()=>{void ler()},1500);return()=>clearInterval(timer)},[ativo,coberto,precisa,ler])
  const [venceu,setVenceu]=useState<{key:string;revision:number}|null>(null)
  useEffect(()=>{
    if(!row||coberto>=precisa)return
    const revision=row.revision,timer=setTimeout(()=>{if(currentIdentity.current===identity)setVenceu({key:identity,revision})},ESPERA_MAX_MS)
    return()=>clearTimeout(timer)
  },[row?.revision,coberto,precisa,identity])
  const pronto=!row||coberto>=precisa||venceu?.key===identity&&venceu.revision===row.revision
  const escolher=useCallback(async(t:TaticaCopa)=>{
    const before=minha
    setMinha({key:identity,value:t});setWarning(null)
    const {data,error}=await supabase.rpc('esc_copa_tatica_set',{p_room:roomId,p_tipo:tipo,p_edicao:edicao,p_seed:seed,p_tatica:t})
    if(currentIdentity.current!==identity)return
    const reply=data as {ok?:boolean;motivo?:string}|null
    if(error||!reply?.ok){setMinha(before);setWarning({key:identity,text:reply?.motivo==='aguardando_versoes'?tr('Aguardando a versão atualizada dos participantes.','Waiting for participants to update their version.'):tr('O jogo já apitou — escolha durante o próximo jogo.','The match is over — pick during the next match.')})}
  },[minha,identity,roomId,tipo,edicao,seed])
  const ultima=meuUid?[...(dado?.linhas??[])].filter(l=>l.uid===meuUid).sort((a,b)=>b.passo-a.passo)[0]?.tatica:undefined
  const enviarPlano=useCallback(async(plan:FootballPlan,live:boolean,id:string)=>{
    const {data,error}=await supabase.rpc('esc_copa_plano_set',{p_room:roomId,p_tipo:tipo,p_edicao:edicao,p_seed:seed,p_plan:plan,p_id:id,p_live:live})
    const reply=data as {ok?:boolean;motivo?:string;from?:number;state?:PlanPayload}|null
    if(error||!reply?.ok)throw new Error(reply?.motivo==='janela_encerrada'?tr('A janela desta partida encerrou. O plano continua salvo para o próximo jogo.','The window for this match has closed. The plan remains saved for the next match.'):reply?.motivo==='aguardando_versoes'?tr('Aguardando os participantes atualizarem a versão da Copa.','Waiting for participants to update their Cup version.'):tr('Não foi possível confirmar o plano. Tente novamente.','The plan could not be confirmed. Try again.'))
    if(reply.state)accept(reply.state)
    return reply.from??0
  },[roomId,tipo,edicao,seed,accept])
  return{linhas:dado?.linhas??[],pronto,escolher,minha:(minha?.key===identity?minha.value:null)??ultima??'equilibrio' as TaticaCopa,podeEscolher:!!row?.running,aviso,planos:dado?.planos??[],plansEnabled:dado?.plansEnabled??false,enviarPlano}
}

const ROTULO: Record<TaticaCopa, [string, string]> = { retranca: ['🧱 Retranca', '🧱 Park the bus'], equilibrio: ['⚖️ Equilíbrio', '⚖️ Balanced'], ataque: ['🔥 Ataque', '🔥 Attack'] }
const INK = '#0C0C0C', GOLD = '#FFC400'

/** o MESMO cartão de tática da liga/Champions, com a regra da copa escrita embaixo */
export function CartaoTaticaCopa({ minha, podeEscolher, aviso, onEscolher,plan }: { minha: TaticaCopa; podeEscolher: boolean; aviso?: string; onEscolher: (t: TaticaCopa) => void;plan?:CupPlanController }) {
  const owner=useOwnerLayout()
  const pilot=useOwnerFootballPilot()
  if(pilot&&plan)return <OwnerSlot name="tactic"><CupPlanPanel key={plan.key} control={plan}/></OwnerSlot>
  if(owner&&!pilot)return <OwnerTactics value={minha} disabled={!podeEscolher} note={aviso} onChange={onEscolher}/>
  return <div style={{ background: '#fff', color: INK, border: `3px solid ${INK}`, borderRadius: 14, boxShadow: `4px 4px 0 ${INK}`, padding: 12, margin: '0 0 10px' }}>
    <p style={{ fontFamily: 'Oswald, sans-serif', fontWeight: 900, fontSize: 11, letterSpacing: '.12em', textTransform: 'uppercase', color: 'rgba(0,0,0,.5)', margin: '0 0 8px' }}>
      ⚔️ {tr('Tática do próximo jogo', 'Tactic for the next match')}
    </p>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
      {TATICAS_COPA.map(t => <button key={t} disabled={!podeEscolher} onClick={() => onEscolher(t)}
        style={{ border: `3px solid ${INK}`, borderRadius: 12, padding: '8px 2px', fontFamily: 'Oswald, sans-serif', fontWeight: 900, fontSize: 12.5, textTransform: 'uppercase', cursor: podeEscolher ? 'pointer' : 'default',
          background: minha === t ? GOLD : '#fff', color: INK, boxShadow: minha === t ? `3px 3px 0 ${INK}` : 'none', opacity: podeEscolher || minha === t ? 1 : 0.55 }}>
        {tr(ROTULO[t][0], ROTULO[t][1])}
      </button>)}
    </div>
    <p style={{ fontSize: 10.5, fontWeight: 700, color: aviso ? '#B23B2E' : 'rgba(0,0,0,.55)', margin: '7px 0 0', textAlign: 'center' }}>
      {aviso || (podeEscolher
        ? tr('Escolha enquanto a bola rola — vale a partir do PRÓXIMO jogo.', 'Pick while the ball is rolling — it counts from the NEXT match.')
        : tr('⏳ Abre quando a bola rolar. O que você escolher vale no jogo seguinte.', '⏳ Opens when the ball is rolling. Your pick counts in the following match.'))}
    </p>
  </div>
}

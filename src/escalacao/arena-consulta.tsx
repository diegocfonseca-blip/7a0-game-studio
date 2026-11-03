import {useEffect,useState} from 'react'
import {supabase} from '../lib/supabase'
import {useSalaElencoLiberada,useMundoLiberado} from './sport'
import {consultarSalasArena,salasPublicasArena,type ConsultaArena} from './arena-salas-leitura'
/** Do not mount EscLobby here: it can join, publish presence and clean rooms. */
export function ArenaConsulta(){
 const [result,R]=useState<ConsultaArena|null>(null),[busy,B]=useState(true),[error,E]=useState(false),[cooldown,C]=useState(0),[request,Q]=useState(0)
 const elenco=useSalaElencoLiberada(),mundo=useMundoLiberado()
 useEffect(()=>{
  let active=true;const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),12000)
  B(true);E(false);C(30);let remaining=30
  const cooldownTimer=setInterval(()=>{remaining-=1;C(remaining);if(remaining<=0)clearInterval(cooldownTimer)},1000)
  consultarSalasArena(supabase,controller.signal).then(value=>{if(active&&!controller.signal.aborted)R(value)},()=>{if(active){E(true);R(null)}})
   .finally(()=>{clearTimeout(timeout);if(active)B(false)})
  return()=>{active=false;controller.abort();clearTimeout(timeout);clearInterval(cooldownTimer)}
 },[request])
 const rooms=result?salasPublicasArena(result,{elenco,mundo}):[]
 return <section className="arena-consulta" aria-label="Consulta de salas abertas">
  <p>Veja as salas públicas sem sair da cidade. Nesta consulta você não cria nem entra em salas.</p>
  <div className="arena-consulta-barra"><strong>Salas abertas</strong><button type="button" aria-label="Atualizar lista" disabled={busy||cooldown>0} onClick={()=>Q(n=>n+1)}>{busy?'Consultando…':cooldown>0?`Atualizar em ${cooldown}s`:'Atualizar lista'}</button></div>
  {busy?<p role="status">Consultando salas…</p>:error?<p role="alert">Não foi possível consultar as salas agora. Seu jogo continua aberto no mapa. Tente atualizar em instantes.</p>:<>
   <p className="arena-consulta-hora">Consultado às {result?new Date(result.at).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}):'—'} · atualização manual.</p>
   {rooms.length===0?<p role="status">Nenhuma sala pública disponível nesta consulta.</p>:<ul className="arena-consulta-lista">{rooms.map(room=><li key={room.id}><div><strong>{room.name}</strong><span>{room.mode}{room.restricted?' · Acesso restrito':''}</span></div><div><b>{room.status==='waiting'?'Aguardando jogadores':'Em jogo'}</b><span>{room.count} / {room.capacity} participantes</span></div></li>)}</ul>}
  </>}
  <small>Para consultar novamente, use Atualizar lista. Você continua na mesma carreira.</small>
 </section>
}

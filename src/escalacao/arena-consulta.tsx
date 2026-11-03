import {useT,getLang} from './lang'
import {useEffect,useState} from 'react'
import {supabase} from '../lib/supabase'
import {useSalaElencoLiberada,useMundoLiberado} from './sport'
import {consultarSalasArena,salasPublicasArena,type ConsultaArena} from './arena-salas-leitura'
/** Do not mount EscLobby here: it can join, publish presence and clean rooms. */
export function ArenaConsulta(){
 const t=useT()
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
 return <section className="arena-consulta" aria-label={t('Consulta de salas abertas','Open rooms')}>
  <p>{t('Veja as salas públicas sem sair da cidade. Nesta consulta você não cria nem entra em salas.','See the public rooms without leaving the city. Here you do not create or join rooms.')}</p>
  <div className="arena-consulta-barra"><strong>{t('Salas abertas','Open rooms')}</strong><button type="button" aria-label={t('Atualizar lista','Refresh list')} disabled={busy||cooldown>0} onClick={()=>Q(n=>n+1)}>{busy?t('Consultando…','Checking…'):cooldown>0?t(`Atualizar em ${cooldown}s`,`Refresh in ${cooldown}s`):t('Atualizar lista','Refresh list')}</button></div>
  {busy?<p role="status">{t('Consultando salas…','Checking rooms…')}</p>:error?<p role="alert">{t('Não foi possível consultar as salas agora. Seu jogo continua aberto no mapa. Tente atualizar em instantes.','Could not check the rooms right now. Your game is still open on the map. Try refreshing in a moment.')}</p>:<>
   <p className="arena-consulta-hora">{t('Consultado às','Checked at')} {result?new Date(result.at).toLocaleTimeString(getLang()==='en'?'en-US':'pt-BR',{hour:'2-digit',minute:'2-digit'}):'—'} · {t('atualização manual.','manual refresh.')}</p>
   {rooms.length===0?<p role="status">{t('Nenhuma sala pública disponível nesta consulta.','No public rooms available right now.')}</p>:<ul className="arena-consulta-lista">{rooms.map(room=><li key={room.id}><div><strong>{room.name}</strong><span>{room.mode}{room.restricted?t(' · Acesso restrito',' · Restricted access'):''}</span></div><div><b>{room.status==='waiting'?t('Aguardando jogadores','Waiting for players'):t('Em jogo','In game')}</b><span>{room.count} / {room.capacity} {t('participantes','players')}</span></div></li>)}</ul>}
  </>}
  <small>{t('Para consultar novamente, use Atualizar lista. Você continua na mesma carreira.','To check again, use Refresh list. You stay in the same career.')}</small>
 </section>
}

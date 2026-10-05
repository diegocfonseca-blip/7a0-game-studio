import {PresidenteVestido} from './presidente-editor'
import {PresidenciaBensLista} from './presidencia-bens-lista'
import type {ReactNode} from 'react'
import {totalTrofeus} from './presidencia-trofeus'
import {patrimonioTotal,patrimonioDosBens} from './presidencia-patrimonio'
import type {PresidenteVisual} from './presidente-model'
import type {PresidenciaDados} from './presidencia-model'
import {presidenteBaseValido,type PresidenteBaseSave} from './presidencia-carreira'
import {camadasDoPresidente} from './presidente-aparencia'
import {PresidenteCamadas} from './presidente-camadas'
import {tr} from './lang'
import './presidente-perfil.css'

export function PresidentePerfil({visual,base,data,onClose,onEdit,portraitPreview}:{visual?:PresidenteVisual;base?:PresidenteBaseSave;data:PresidenciaDados;onClose:()=>void;onEdit:()=>void;portraitPreview?:ReactNode}){
 const saved=base!==undefined,valid=presidenteBaseValido(base)
 const total=patrimonioTotal(data)
 const bens=data.owned===undefined?null:patrimonioDosBens(data.owned)
 const stats=[
  ['📅',data.season,tr('TEMPORADAS','SEASONS')],['⚽',data.games,tr('JOGOS','GAMES')],
  ['🏆',data.trophies?totalTrofeus(data.trophies):undefined,tr('TÍTULOS','TITLES')],['↗',data.promotions,tr('ACESSOS','PROMOTIONS')],
  ['💰',total?.toLocaleString(),tr('PATRIMÔNIO','ASSETS')],['🛡',data.bestDivision,tr('MELHOR DIVISÃO','BEST DIVISION')],
 ]
 return <div className="pp-card">
  <p className="pp-subtitle">{tr('A história do dirigente à frente do clube.','The story of the leader behind the club.')}</p>
  <div className="pp-overview">
   <section className="pp-identity">
    <div className={'pp-portrait'+(saved?' pp-portrait-modular':portraitPreview?' pp-portrait-approved':'')} aria-label={!saved&&portraitPreview?tr('Referência visual aprovada, ainda não personalizável','Approved visual reference, not customizable yet'):tr('Presidente vestido com seu visual personalizado','President dressed with your custom appearance')}>
     {saved?(valid?<PresidenteCamadas ids={camadasDoPresidente(base)}/>:<p role="alert">{tr('Visual salvo indisponível.','Saved appearance unavailable.')}</p>):portraitPreview??(visual?<PresidenteVestido value={visual}/>:<p role="alert">{tr('Visual não carregado.','Appearance not loaded.')}</p>)}
    </div>
    {!saved&&portraitPreview&&<small>{tr('REFERÊNCIA VISUAL','VISUAL REFERENCE')}</small>}
    <strong>{(saved?(valid?base.name:''):visual?.name)||tr('Presidente','President')}</strong>
    <span className="pp-club">{data.club}</span>
    <small>{data.sinceSeason!==undefined?tr('Assumiu na temporada ','Took office in season ')+data.sinceSeason:tr('Mandato não carregado','Tenure not loaded')}</small>
   </section>
   <dl className="pp-stats">{stats.map(([icon,value,label])=><div key={label}><span aria-hidden="true">{icon}</span><dd>{value??'—'}</dd><dt>{label}</dt></div>)}</dl>
  </div>
  <section className="pp-history" aria-label={tr('Linha do tempo','Timeline')}>
   <p>{tr('TEMPORADAS REGISTRADAS · O histórico antigo pode estar incompleto.','RECORDED SEASONS · Older history may be incomplete.')}</p>
   {data.timeline?.length?<ol>{data.timeline.map(e=><li key={e.id}><i aria-hidden="true"/><span>{e.label}</span></li>)}</ol>:<p>{tr('Ainda não há temporadas encerradas registradas neste clube.','No completed seasons are recorded for this club yet.')}</p>}
  </section>
  <section className="pp-assets" aria-label={tr('Composição do patrimônio','Asset breakdown')}>
   <h2>{tr('PATRIMÔNIO DO CLUBE','CLUB ASSETS')}</h2>
   <dl className="pp-stats">{([
    [tr('CAIXA','CASH'),data.cash],[tr('ESTÁDIO','STADIUM'),data.stadiumValue],
    [tr('ELENCO','SQUAD'),data.squadValue],[tr('BENS','OWNED ITEMS'),bens?.total],
   ] as [string,number|undefined][]).map(([label,value])=><div key={label}><dd>{typeof value==='number'&&Number.isSafeInteger(value)&&value>=0?value.toLocaleString():'—'}</dd><dt>{label}</dt></div>)}</dl>
   <p className="pp-subtitle">{tr('Estádio: investimento nos setores e valor atual das melhorias. Elenco e bens: valor de aquisição, não de revenda. Dados ausentes ficam sem valor.','Stadium: sector investment and current upgrade value. Squad and owned items: acquisition value, not resale value. Missing data is left unvalued.')}</p>
  </section>
  {bens&&<section className="pp-assets" aria-label={tr('Patrimônio em bens','Owned assets')}>
   <h2>{tr('SEUS BENS','YOUR ASSETS')}</h2>
   <dl className="pp-stats">{([
    [tr('CARROS','CARS'),bens.cars],[tr('MOTOS E BIKES','MOTORCYCLES & BIKES'),bens.twoWheels],
    [tr('MOBÍLIAS','FURNITURE'),bens.furniture],[tr('TOTAL PAGO','TOTAL PAID'),bens.total],
   ] as [string,number][]).map(([label,value])=><div key={label}><dd>{value.toLocaleString()}</dd><dt>{label}</dt></div>)}</dl>
   <p className="pp-subtitle">{tr('Inclui todos os bens comprados, mesmo os que não estão expostos. Revenda estimada: ','Includes all purchased items, even those not on display. Estimated resale: ')}{bens.resale.toLocaleString()} {tr('moedas.','coins.')}</p>
  </section>}
  {bens&&data.owned&&<PresidenciaBensLista owned={data.owned}/>}
  <footer className="pp-actions"><button onClick={onClose}>{tr('FECHAR','CLOSE')}</button><button onClick={onEdit}>{tr('EDITAR VISUAL','EDIT APPEARANCE')}</button></footer>
 </div>
}

import {useT} from './lang'
import {Escudo} from './escudos'
import {MASCOTES} from './mascotes'
import {CAMISAS_SALAO,RECORTE_CAMISA} from './salao-camisas'
import type {IdentidadePresidencia} from './presidencia-identidade-conta'
export function IdentidadeNaSala({identity,desk,frame}:{identity:IdentidadePresidencia;desk:boolean;frame:boolean}){
 const t=useT()
 const shirt=identity.shirt?CAMISAS_SALAO[identity.shirt]:null,cut=identity.shirt?RECORTE_CAMISA[identity.shirt]:null
 const mascot=identity.mascot?MASCOTES[identity.mascot]:null
 return <>
  <div className="pr-crest" data-club-crest={identity.crest?'owned':'automatic'}><Escudo nome={identity.crest??identity.name} automatic={!identity.crest} size={72}/></div>
  {frame&&<div className="pr-shirt" data-club-shirt={shirt?'owned':'automatic'}>{shirt?(cut?<svg viewBox={`0 0 ${cut[0]} ${cut[2]}`} overflow="hidden" role="img" aria-label={t('Camisa frontal do clube','Club shirt front')}><image href={import.meta.env.BASE_URL+'mantos-salao/'+shirt} width={cut[0]} height={cut[1]}/></svg>:<img src={import.meta.env.BASE_URL+'mantos-salao/'+shirt} alt={t('Camisa frontal do clube','Club shirt front')}/>):<svg viewBox="0 0 100 110" role="img" aria-label={t('Camisa lisa automática','Automatic plain shirt')}><path d="M30 8 10 22 2 48 21 55 27 40 27 104 73 104 73 40 79 55 98 48 90 22 70 8Q50 23 30 8Z" fill={identity.color} stroke="#171717" strokeWidth="3"/><path d="M38 11Q50 29 62 11" fill="none" stroke="#171717" strokeWidth="3"/></svg>}</div>}
  {desk&&mascot&&<div className="pr-mascot" data-club-mascot={identity.mascot} aria-label={t('Miniatura do mascote','Mascot miniature')}>{mascot}</div>}
 </>
}

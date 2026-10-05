import {useT} from './lang'
import {itemPresidencia,type PresidenciaBem,type PresidenciaItemId} from './presidencia-economia'
import {duplaDaGaragem,trocarPosicaoGaragem,veiculosPossuidos,type DuplaGaragem} from './presidencia-garagem'
/** A mesma regra nas vistas normal e ampliada; escolher nunca compra um bem. */
export function GaragemDuplaSeletores({owned,display,onDisplay,onError}:{owned:readonly PresidenciaBem[];display?:DuplaGaragem;onDisplay:(pair:DuplaGaragem)=>boolean;onError:(message:string)=>void}){
 const t=useT(),pair=duplaDaGaragem(owned,display)
 return <div className="gp-filters">{([0,1] as const).map(i=><label key={i}>{i===0?t('POSIÇÃO ESQUERDA','LEFT POSITION'):t('POSIÇÃO DIREITA','RIGHT POSITION')}<select value={pair[i]??''} onChange={e=>{const next=trocarPosicaoGaragem(owned,pair,i,(e.target.value||null) as PresidenciaItemId|null);if(next&&!onDisplay(next))onError(t('Não foi possível salvar a dupla.','Could not save display pair.'))}}><option value="">{t('Vazia','Empty')}</option>{veiculosPossuidos(owned).map(b=><option key={b.id} value={b.id}>{t(itemPresidencia(b.id)!.pt,itemPresidencia(b.id)!.en)}</option>)}</select></label>)}</div>
}


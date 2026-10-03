import {useT} from './lang'
import {itemPresidencia,valorRevenda,type PresidenciaBem} from './presidencia-economia'
import {patrimonioDosBens} from './presidencia-patrimonio'

/** Consulta o inventário completo; não compra, vende ou altera a exposição. */
export function PresidenciaBensLista({owned}:{owned:readonly PresidenciaBem[]}){
 const t=useT()
 if(!patrimonioDosBens(owned))return null
 if(!owned.length)return <p className="pp-subtitle">{t('Você ainda não comprou bens para a presidência.','You have not purchased any presidential assets yet.')}</p>
 return <ul className="pp-owned-list" aria-label={t('Bens comprados','Purchased items')}>
  {owned.map(b=>{const item=itemPresidencia(b.id)!
   return <li key={b.id} data-owned-item={b.id}>
    <strong>{t(item.pt,item.en)}</strong>
    <span>{t('Pago: ','Paid: ')}{b.paid.toLocaleString()} {t('moedas','coins')}</span>
    <span>{t('Revenda: ','Resale: ')}{valorRevenda(b.paid).toLocaleString()} {t('moedas','coins')}</span>
   </li>
  })}
 </ul>
}

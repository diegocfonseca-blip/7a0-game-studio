import {useT} from './lang'
import {getSport} from './sport'
import './presidencia-mapa-preparando.css'
export type EtapaAbrirMapa='cidade'|'bairro'|'imagem'
/** Espera real do desenho: não simula porcentagem nem oferece ações incompletas. */
export function MapaPreparando({etapa='cidade',moldura=false}:{etapa?:EtapaAbrirMapa;moldura?:boolean}){
 const t=useT(),bb=getSport()==='basquete',textos={cidade:bb?t('Montando a cidade e a arena…','Building the city and arena…'):t('Montando a cidade e o estádio…','Building the city and stadium…'),bairro:t('Organizando o movimento do bairro…','Preparing neighbourhood activity…'),imagem:t('Preparando a imagem do mapa…','Preparing the map image…')}
 return <div className={moldura?'pc3-start-screen':'pc3-loading'} role="status" aria-live="polite"><div className="pc3-start-card"><span className="pc3-start-mark" aria-hidden="true">{bb?'BL':'LL'}</span><strong>{t('PREPARANDO SEU MAPA','PREPARING YOUR MAP')}</strong><span>{textos[etapa]}</span><div className="pc3-start-steps" aria-hidden="true">{(['cidade','bairro','imagem'] as const).map(e=><i key={e} className={e===etapa?'is-current':''}/>)}</div></div></div>
}

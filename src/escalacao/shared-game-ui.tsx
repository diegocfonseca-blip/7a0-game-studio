import './shared-game-ui.css'
import type {ReactNode} from 'react'
import {Shell} from './screens'
import {OnlineCreateLayout} from './online-create-layout'
import {useT} from './lang'

const OSWALD={fontFamily:'Oswald, sans-serif'}
/** A mesma moldura da Partida Rápida. Cada esporte fornece apenas suas escolhas. */
export function QuickMatchLayout(p:{onBack:()=>void;description:string;rows:[string,string][];summaries:Record<string,string>;name:string;button:ReactNode;children:ReactNode;extraMode?:ReactNode;error?:ReactNode;errorKey?:string;footer?:ReactNode;modeDescription?:string;header?:ReactNode}) {
 const t=useT()
 return <Shell className="ll-quick-shell" presentationHeader={p.header}>
  <style>{'.ll-qs .cs-claro{background:#F4ECD6;border:4px solid #0C0C0C;border-radius:24px;box-shadow:5px 5px 0 #0C0C0C;padding:12px;color:#0C0C0C}'}</style>
  <button onClick={p.onBack} className="flex items-center gap-1 font-black text-sm pt-4 -mb-2 active:opacity-60" style={{...OSWALD,color:'#c9c5b8'}}><span className="text-lg leading-none">🏠</span> {t('Voltar ao início','Back to start')}</button>
  <div className="pt-2"><p className="text-[11px] font-black uppercase tracking-[.16em]" style={{...OSWALD,color:'#FFC400'}}>{t('⚡ Partida rápida · você contra a máquina','⚡ Quick match · you vs the machine')}</p><h1 className="font-black uppercase leading-[.95] mt-1" style={{...OSWALD,fontSize:40,color:'#F4ECD6'}}>{t('Monte sua','Set up your')} <span style={{color:'#FFC400'}}>{t('partida.','match.')}</span></h1><p className="text-sm font-semibold mt-1" style={{color:'#c9c5b8'}}>{p.description}</p></div>
  <div className="ll-qs"><OnlineCreateLayout enabled rotulo={t('SUA PARTIDA','YOUR MATCH')} modes={<div className="space-y-3" style={{background:'#F4ECD6',color:'#0C0C0C',border:'3px solid #0C0C0C',borderRadius:18,boxShadow:'4px 4px 0 #0C0C0C',padding:12}}><div className="flex items-center gap-3"><span className="grid place-items-center rounded-xl shrink-0" style={{width:44,height:44,background:'#FFC400',border:'3px solid #0C0C0C',fontSize:22}}>⚡</span><span><b className="block uppercase" style={{...OSWALD,fontSize:18}}>{t('Partida rápida','Quick match')}</b><span className="block text-[12px] font-semibold" style={{color:'#6b6250'}}>{p.modeDescription??t('Uma temporada contra a máquina. Começa agora.','One season against the machine. Starts now.')}</span></span></div>{p.extraMode}</div>} rows={p.rows} summaries={p.summaries} name={p.name} button={p.button} responsibility={null} error={p.error??null} errorKey={p.errorKey??''} notice={t('Escolha como quer jogar.','Choose how you want to play.')}>{p.children}</OnlineCreateLayout></div>{p.footer}
 </Shell>
}

/** Identidade cega comum: nome e edição; categoria e nota só na revelação. */
export function AuctionIdentity({badge,name,subtitle,big=false,color='#0C0C0C',highlight=false,light=false}:{badge:string;name:string;subtitle:string;big?:boolean;color?:string;highlight?:boolean;light?:boolean}) {
 return <div className="text-left"><div className="flex items-center gap-2"><span className="border-2 border-black rounded-full px-2 py-0.5 text-[10px] font-black" style={{backgroundColor:'#0C0C0C',color:'#fff'}}>{badge}</span><p className={`font-black ${big?'text-2xl':'text-base'}`} style={{...OSWALD,color}}>{name}{highlight?' 🎁':''}</p></div><p className={`${big?'text-sm':'text-xs'} font-semibold mt-0.5 ${light?'text-white/75':'text-black/60'}`}>{subtitle}</p></div>
}
export function AuctionPositions({labels,current}:{labels:string[];current:number}) {
 return <div className="ll-auction-bar-positions flex gap-1.5">{labels.map((label,i)=><span key={label} className="ll-auction-bar-position border-2 border-black rounded-full px-2 py-0.5 text-[10px] font-black" style={{backgroundColor:i<current?'#0C0C0C':i===current?'#FFC400':'#fff',color:i<current?'#fff':'#0C0C0C'}}>{label}</span>)}</div>
}

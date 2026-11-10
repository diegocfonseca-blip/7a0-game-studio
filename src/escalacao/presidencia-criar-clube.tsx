import {useId,type ReactNode} from 'react'
import {useT} from './lang'
import {IdentidadeNaSala} from './presidencia-identidade-visual'
import type {IdentidadePresidencia} from './presidencia-identidade-conta'
import type {FormationKey} from './types'
import './presidencia-criar-clube.css'

// Demonstration only: never copied to the user's identity or career save.
const example:IdentidadePresidencia={name:'Leite de Verdade FC',crest:'Leite de Verdade FC',shirt:'Leite de Verdade FC',mascot:'leiteverdade_vaca',color:'#F4ECD6'}
export function CriarClubePresidencia({name,onName,formation,onFormation,identity,error,onContinue,support,accountName}:{
 name:string;onName:(name:string)=>void;formation:FormationKey;onFormation:(formation:FormationKey)=>void;
 identity:IdentidadePresidencia;error?:string;onContinue:()=>void;support?:ReactNode;accountName?:string|null;
}){
 const t=useT(),nameId=useId()
 return <section className="pc-create cse-club" aria-labelledby="cse-club-title">
  <header className="cse-intro"><small>{t('A SUA HISTÓRIA COMEÇA AQUI','YOUR STORY STARTS HERE')}</small><h1 id="cse-club-title">{t('Primeiro, o seu clube.','First, your club.')}</h1><p>{t('Dê um nome ao time que vai sair da Várzea e buscar o topo.','Name the team that will rise from Várzea to the top.')}</p></header>
  <div className="cse-club-grid"><div className="cse-club-identity"><small>{t('SUA IDENTIDADE','YOUR IDENTITY')}</small><div className="pc-identity" data-identity="account"><IdentidadeNaSala identity={identity} frame desk/></div><h2>{name||t('Seu clube','Your club')}</h2><p>{identity.crest?t('Seu escudo, manto e mascote acompanham sua conta.','Your crest, kit and mascot stay with your account.'):t('O jogo cria seu escudo e sua camisa básica. Você pode começar sem comprar um plano.','The game creates your crest and basic shirt. You can start without buying a plan.')}</p></div>
  <form className="cse-paper" onSubmit={e=>{e.preventDefault();onContinue()}}><label htmlFor={nameId}>{t('Nome do clube','Club name')}</label><input id={nameId} maxLength={60} value={name} onChange={e=>onName(e.target.value)} placeholder={t('Ex.: Lendas FC','E.g.: Legends FC')} autoComplete="off"/>
   {accountName&&name.trim()!==accountName&&<p className="cse-account-note">{t('Ao começar, este nome também será atualizado na sua conta.','When you start, this name will also update on your account.')}</p>}
   <h2>{t('Como seu time entra em campo?','How does your team line up?')}</h2><div className="cse-formations" role="group" aria-label={t('Formação inicial','Starting formation')}>{(['4-3-3','4-4-2'] as const).map(f=><button type="button" key={f} aria-pressed={formation===f} onClick={()=>onFormation(f)}><strong>{f}</strong><span>{f==='4-3-3'?t('4 defensores · 3 meias · 3 atacantes','4 defenders · 3 midfielders · 3 forwards'):t('4 defensores · 4 meias · 2 atacantes','4 defenders · 4 midfielders · 2 forwards')}</span></button>)}</div><p className="cse-note">{t('Mais um goleiro: são 11 jogadores. Você pode trocar a formação durante a carreira.','Add a goalkeeper: 11 players in total. You can change formation during your career.')}</p>
   {error&&<p role="alert" className="cse-error">{error}</p>}
   <button type="submit" className="csg-primary">{t('Continuar para o presidente →','Continue to the president →')}</button>
  </form></div>
  {!identity.crest&&<details className="cse-baptism"><summary>{t('Quer um escudo, manto e mascote feitos para você?','Want a crest, kit and mascot made for you?')} <span>{t('Conheça o Batismo','Discover Naming')}</span></summary><div><p>{t('Personalização opcional para o seu clube. Este é um exemplo de outro jogador: as artes não serão aplicadas ao seu time.','Optional club customization. This example belongs to another player: this artwork will not be applied to your team.')}</p><div className="pc-identity" data-identity="example"><IdentidadeNaSala identity={example} frame desk/></div>{support}</div></details>}
 </section>
}

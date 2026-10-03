import {useId,type ReactNode} from 'react'
import {useT} from './lang'
import {Box,Btn} from './ui-primitives'
import {IdentidadeNaSala} from './presidencia-identidade-visual'
import type {IdentidadePresidencia} from './presidencia-identidade-conta'
import type {FormationKey} from './types'
import './presidencia-criar-clube.css'

// Demonstration only: never copied to the user's identity or career save.
const example:IdentidadePresidencia={name:'Leite de Verdade FC',crest:'Leite de Verdade FC',shirt:'Leite de Verdade FC',mascot:'leiteverdade_vaca',color:'#F4ECD6'}
export function CriarClubePresidencia({name,onName,formation,onFormation,identity,error,onContinue,onBack,support}:{
 name:string;onName:(name:string)=>void;formation:FormationKey;onFormation:(formation:FormationKey)=>void;
 identity:IdentidadePresidencia;error?:string;onContinue:()=>void;onBack:()=>void;support?:ReactNode;
}){
 const t=useT(),nameId=useId()
 return <section className="gp-root pc-create" aria-label={t('Criar clube','Create club')}>
  <h1>{t('CRIE SEU CLUBE','CREATE YOUR CLUB')}</h1><p>{t('Primeiro o clube. Depois, o presidente que vai comandá-lo.','First your club. Then the president who will lead it.')}</p>
  <Box bg="#F4ECD6" style={{padding:16}}><label htmlFor={nameId}>{t('NOME DO CLUBE','CLUB NAME')}</label><input id={nameId} maxLength={60} value={name} onChange={e=>onName(e.target.value)} placeholder={t('Ex.: Lendas FC','E.g.: Legends FC')}/>
   <h2>{t('SUA IDENTIDADE','YOUR IDENTITY')}</h2>
   <div className="pc-identity" data-identity="account"><IdentidadeNaSala identity={identity} frame desk/></div>
   <p>{identity.crest?t('As artes do seu Batismo acompanham sua conta, mesmo com outro nome de clube.','Your account keeps its Baptism artwork, even with a different club name.'):t('Escudo automático e camisa lisa na cor do seu apoio. Mascote só aparece quando você tiver um.','Automatic crest and a plain shirt in your support color. A mascot appears only when you own one.')}</p>
   <h2>{t('FORMAÇÃO INICIAL','STARTING FORMATION')}</h2><div className="gp-tabs">{(['4-3-3','4-4-2'] as const).map(f=><button type="button" key={f} aria-pressed={formation===f} onClick={()=>onFormation(f)}>{f}</button>)}</div>
   {error&&<p role="alert">{error}</p>}
  </Box>
  {!identity.crest&&<Box bg="#fff" style={{padding:16}}><h2>{t('CONHEÇA O BATISMO','DISCOVER BAPTISM')}</h2><p>{t('Exemplo: Leite de Verdade FC. Estas artes são desse clube, não serão aplicadas ao seu.','Example: Leite de Verdade FC. This artwork belongs to that club and will not be applied to yours.')}</p><div className="pc-identity" data-identity="example"><IdentidadeNaSala identity={example} frame desk/></div>{support}</Box>}
  <div className="gp-confirm-actions"><Btn onClick={onContinue}>{t('CRIAR CLUBE','CREATE CLUB')}</Btn><Btn bg="#fff" onClick={onBack}>{t('VOLTAR','BACK')}</Btn></div>
 </section>
}

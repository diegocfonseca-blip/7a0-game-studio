import {Children,isValidElement,type ReactNode} from 'react'
import {useT} from './lang'
import type {DestinoClubeMapa} from './clube-mapa-destinos'
import './clube-organizacao.css'

/** Navegação da carreira, publicada para todos em 15/11. Cada atalho abre o mesmo painel usado pelo prédio. */
export function ClubeOrganizacao({children,onSelect,store,museum,home,balance,club,semCaixa=false,bb=false}:{children:ReactNode;onSelect:(id:DestinoClubeMapa)=>void;store:boolean;museum:boolean;home:boolean;balance:number;club:string;/** 🪙 18/11: o caixa já está na etiqueta do título — sem o bloco grande */semCaixa?:boolean;/** 🏀 18/11: o Clube do basquete (arena, 2º clube sem SAF, fundo creme) */bb?:boolean}){
 const t=useT()
 const groups:{name:string;items:[DestinoClubeMapa,string,string][]}[]=[
  {name:t('Meu clube','My club'),items:[['financas',t('Finanças','Finances'),t('Caixa e extrato do clube','Club balance and statement')],['estrutura',bb?t('Arena e obras','Arena and construction'):t('Estádio e obras','Stadium and construction'),bb?t('Arquibancadas e melhorias','Stands and upgrades'):t('Estrutura e melhorias','Facilities and upgrades')],['patrocinio',t('Patrocínios','Sponsorships'),t('Contratos e metas','Contracts and goals')],...(bb?[]:[['loja',t('Loja da torcida','Supporters’ store'),store?t('Manto e vendas','Kit and sales'):t('Conheça a loja e sua construção','Store and construction')] as [DestinoClubeMapa,string,string]]),...(museum?[['museu',t('Museu do clube','Club museum'),t('Troféus e história','Trophies and history')] as [DestinoClubeMapa,string,string]]:[])]},
  {name:t('Meus negócios','My businesses'),items:[['agencia',t('Minha agência','My agency'),t('Clientes e cartas','Clients and cards')],['negocios',bb?t('2º clube','Second club'):t('SAF e 2º clube','SAF and second club'),bb?t('Comprar uma crew da Street','Buy a Street crew'):t('Participações e comando','Ownership and management')]]},
  {name:t('Minha vida','My life'),items:home?[['presidencia',t('Casa e garagem','Home and garage'),t('Móveis, veículos e personagem','Furniture, vehicles and character')]]:[]},
 ]
 return <div className={`clube-organizacao${bb?' clube-organizacao-claro':''}`}><div className="clube-organizacao-mapa">{children}</div><aside className="clube-organizacao-acessos">
  {!semCaixa&&<div className="clube-caixa-context"><small>{t('Caixa do clube no comando','Managed club balance')}</small><strong>{balance.toLocaleString('pt-BR')} 🪙</strong><span>{club}</span></div>}
  {groups.filter(g=>g.items.length).map(g=><section key={g.name}><h2>{g.name}</h2><nav aria-label={g.name}>{g.items.map(([id,label,detail])=><button type="button" key={id} onClick={()=>onSelect(id)}><b>{label}</b><span>{detail}</span></button>)}</nav></section>)}
 </aside></div>
}

/** Concluídas ficam disponíveis para consulta; compras usam os callbacks existentes. */
export function ObrasDoClube({enabled,children}:{enabled:boolean;children:ReactNode}){
 const t=useT();if(!enabled)return <>{children}</>
 const all=Children.toArray(children),done=all.filter(c=>isValidElement<Record<string,unknown>>(c)&&c.props['data-work-done']),pending=all.filter(c=>!done.includes(c))
 return <div className="clube-obras-lista">{pending.length?<div className="clube-obras-grid">{pending}</div>:<p className="clube-obras-completas">{t('Tudo concluído nesta seção.','Everything in this section is complete.')}</p>}{done.length>0&&<details className="clube-obras-concluidas"><summary>{t('Concluídas','Completed')} · {done.length}</summary><div className="clube-obras-grid">{done}</div></details>}</div>
}

export function InformacoesDoEstadio({organized,label,children}:{organized:boolean;label?:string;children:ReactNode}){
 const t=useT();return organized?<details className="clube-estadio-detalhes"><summary>{label??t('Torcida e bilheteria','Supporters and ticket income')}</summary>{children}</details>:<>{children}</>
}

export function PendenciaDaTemporada({checking,international,world,onGames}:{checking:boolean;international:boolean;world:boolean;onGames:()=>void}){
 const t=useT();if(!international&&!world)return null
 return <aside className="clube-temporada-pendente" role="status"><div><strong>{checking?t('Conferindo sua temporada…','Checking your season…'):international?t('Temporada internacional pendente','International season pending'):t('Copa do Mundo pendente','World Cup pending')}</strong><p>{checking?t('Aguarde a confirmação da sessão da carreira.','Waiting for your career session to be confirmed.'):international?t('Conclua a campanha em Jogos para seguir à próxima temporada.','Finish the campaign in Matches to start the next season.'):t('Jogue a Copa do Mundo em Jogos para continuar o encerramento.','Play the World Cup in Matches to continue the season wrap-up.')}</p></div><button type="button" onClick={onGames}>{t('Ver em Jogos →','View in Matches →')}</button></aside>
}

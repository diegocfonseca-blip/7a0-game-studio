import {Children,isValidElement,type ReactNode} from 'react'
import {useT} from './lang'
import type {DestinoClubeMapa} from './clube-mapa-destinos'
import './clube-organizacao.css'

/** Navegação da carreira, publicada para todos em 15/11. Cada atalho abre o mesmo painel usado pelo prédio. */
export function ClubeOrganizacao({children,onSelect,store,museum,home,balance,club,oficial}:{children:ReactNode;onSelect:(id:DestinoClubeMapa)=>void;store:boolean;museum:boolean;home:boolean;balance:number;club:string;
 /** 🇧🇷 20/11 (mockup `scripts/mockups/clube-oficial-organizado.png`, Diego: "gostei… aumente um pouco a área do mapa"): no Brasil Oficial a aba
  *  Clube = o mapa grande em cima + o caixa + 6 cartões (sem 2º clube). `saf` = a linha da SAF; `safTrava` = o cadeado com o porquê. */
 oficial?:{saf:string;safTrava?:string}}){
 const t=useT()
 if(oficial){
  const cards:[DestinoClubeMapa,string,string,string][]=[
   ['financas','💰',t('Dinheiro','Money'),t('Extrato da temporada, salários e empréstimo','Season statement, wages and loans')],
   ['patrocinio','🤝',t('Contratos','Contracts'),t('Patrocínio Master, fornecedor de material e TV','Master sponsor, kit supplier and TV')],
   ['estrutura','🏗️',t('Estádio e obras','Stadium and works'),t('Setores, melhorias e museu','Sectors, upgrades and museum')],
   ['loja','🛍️',t('Loja da torcida','Supporters’ store'),store?t('Camisas e vendas','Kits and sales'):t('Conheça a loja e sua construção','Store and construction')],
   ['agencia','🕴️',t('Agência','Agency'),t('Seus jogadores agenciados','Your agency clients')],
   ['negocios','🏢','SAF',oficial.saf],
  ]
  return <div className="clube-organizacao clube-organizacao--oficial"><div className="clube-organizacao-mapa">{children}</div><aside className="clube-oficial-lista">
   <div className="clube-oficial-caixa"><small>{t('Caixa do clube','Club balance')}</small><strong>{balance.toLocaleString('pt-BR')} 🪙</strong><span>{club}</span></div>
   <nav aria-label={t('Gestão do clube','Club management')}>{cards.map(([id,ic,label,detail])=><button type="button" key={id} className={id==='negocios'&&oficial.safTrava?'trava':undefined} onClick={()=>onSelect(id)}>
    <i aria-hidden="true">{ic}</i><span><b>{label}</b><small>{detail}</small>{id==='negocios'&&oficial.safTrava&&<em>🔒 {oficial.safTrava}</em>}</span><span aria-hidden="true" className="seta">›</span></button>)}</nav>
   {home&&<button type="button" className="clube-oficial-casa" onClick={()=>onSelect('presidencia')}>🏠 {t('Casa e garagem','Home and garage')}</button>}
  </aside></div>
 }
 const groups:{name:string;items:[DestinoClubeMapa,string,string][]}[]=[
  {name:t('Meu clube','My club'),items:[['financas',t('Finanças','Finances'),t('Caixa e extrato do clube','Club balance and statement')],['estrutura',t('Estádio e obras','Stadium and construction'),t('Estrutura e melhorias','Facilities and upgrades')],['patrocinio',t('Patrocínios','Sponsorships'),t('Contratos e metas','Contracts and goals')],['loja',t('Loja da torcida','Supporters’ store'),store?t('Manto e vendas','Kit and sales'):t('Conheça a loja e sua construção','Store and construction')],...(museum?[['museu',t('Museu do clube','Club museum'),t('Troféus e história','Trophies and history')] as [DestinoClubeMapa,string,string]]:[])]},
  {name:t('Meus negócios','My businesses'),items:[['agencia',t('Minha agência','My agency'),t('Clientes e cartas','Clients and cards')],['negocios',t('SAF e 2º clube','SAF and second club'),t('Participações e comando','Ownership and management')]]},
  {name:t('Minha vida','My life'),items:home?[['presidencia',t('Casa e garagem','Home and garage'),t('Móveis, veículos e personagem','Furniture, vehicles and character')]]:[]},
 ]
 return <div className="clube-organizacao"><div className="clube-organizacao-mapa">{children}</div><aside className="clube-organizacao-acessos">
  <div className="clube-caixa-context"><small>{t('Caixa do clube no comando','Managed club balance')}</small><strong>{balance.toLocaleString('pt-BR')} 🪙</strong><span>{club}</span></div>
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

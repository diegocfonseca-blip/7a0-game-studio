import {Children,isValidElement,type ReactNode} from 'react'
import {useT} from './lang'
import type {DestinoClubeMapa} from './clube-mapa-destinos'
import './clube-organizacao.css'

/** Navegação da carreira, publicada para todos em 15/11. Cada atalho abre o mesmo painel usado pelo prédio. */
export function ClubeOrganizacao({children,onSelect,store,museum,home,balance,club,oficial,semCaixa=false,bb=false}:{children:ReactNode;onSelect:(id:DestinoClubeMapa)=>void;store:boolean;museum:boolean;home:boolean;balance:number;club:string;
 /** 🇧🇷 20/11 (mockup `scripts/mockups/clube-oficial-organizado.png`, Diego: "gostei… aumente um pouco a área do mapa"): no Brasil Oficial a aba
  *  Clube = o mapa grande em cima + o caixa + 6 cartões (sem 2º clube). `saf` = a linha da SAF; `safTrava` = o cadeado com o porquê. */
 oficial?:{saf:string;safTrava?:string};/** 🪙 18/11: o caixa já está na etiqueta do título — sem o bloco grande */semCaixa?:boolean;/** 🏀 18/11: o Clube do basquete (arena, 2º clube sem SAF, fundo creme) */bb?:boolean}){
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
/** 🧭 22/11 (Diego: *"N está claro q o usuário tem q fazer melhorias no estádio… os itens N sei se estão escondidos"*): atalhos logo embaixo
 *  do mapa, com bolinha vermelha onde tem coisa pra fazer, e a faixa das obras enquanto o estádio não fica pronto. Abrem os MESMOS painéis do prédio. */
export function AtalhosDoClube({onSelect,obra,pronto,contratos,bb=false}:{onSelect:(id:DestinoClubeMapa)=>void;/** dá pra pagar alguma obra agora */obra:boolean;pronto:number;/** falta fechar o Patrocinador Master */contratos?:boolean;bb?:boolean}){
 const t=useT()
 const itens:[DestinoClubeMapa,string,string,boolean][]=[
  ['estrutura','🏗️',t('Obras','Works'),obra&&pronto<100],
  ['financas','💰',t('Dinheiro','Money'),false],
  ['patrocinio','🤝',t('Contratos','Contracts'),!!contratos],
  ['loja','🛍️',t('Loja','Store'),false],
  ['agencia','🕴️',t('Agência','Agency'),false],
 ]
 return <><nav className="clube-atalhos" aria-label={t('Atalhos do clube','Club shortcuts')}>{itens.map(([id,ic,label,ponto])=><button type="button" key={id} onClick={()=>onSelect(id)} aria-label={ponto?`${label} · ${t('tem coisa pra fazer','something to do')}`:label}>
  <i aria-hidden="true">{ic}</i><span>{label}</span>{ponto&&<em aria-hidden="true"/>}</button>)}</nav>
  {pronto<100&&<button type="button" className="clube-atalhos-obra" onClick={()=>onSelect('estrutura')}>🏗️ {bb?t(`Sua arena está ${pronto}% pronta · toque em OBRAS pra melhorar ›`,`Your arena is ${pronto}% done · tap WORKS to upgrade ›`):t(`Seu estádio está ${pronto}% pronto · toque em OBRAS pra melhorar ›`,`Your stadium is ${pronto}% done · tap WORKS to upgrade ›`)}</button>}</>
}

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

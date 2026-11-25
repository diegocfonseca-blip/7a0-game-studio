/** Decorative moments only: never pays rewards, advances time or simulates matches. */
export type AcaoBairro='torcida'|'classico'|'recorde'|'loja'|'obra'|'despedida'|'lazer'|'noitada'|'titulo'|'acesso'|'recuperacao'|'retorno'|'contratacao'|'tecnico'|'marca'|'coletiva'|'patrocinio'|'viagem'|'base'
export type CenaVista={id:string;season:number;round:number;kind:AcaoBairro;group:string}
export type DiarioBairro={seen:CenaVista[];sales:{season:number;count:number}[]}
export type AtorCena={nome:string;club?:string;year?:number;id?:string}
export type PedidoCena={view:string;key:string;kind:AcaoBairro;manual?:boolean;replay?:boolean;ator?:AtorCena}
export const DURACAO_CENA=7
const KINDS:AcaoBairro[]=['torcida','classico','recorde','loja','obra','despedida','lazer','noitada','titulo','acesso','recuperacao','retorno','contratacao','tecnico','marca','coletiva','patrocinio','viagem','base']
export function pedidoCena(view:string,key:string,kind:AcaoBairro,manual=false,replay=false,ator?:AtorCena){return `cena:${view}?evento=${encodeURIComponent(key)}&acao=${kind}${manual?'&manual=1':''}${replay?'&replay=1':''}${ator?'&ator='+encodeURIComponent(JSON.stringify(ator)):''}`}
export function lerPedidoCena(value:string):PedidoCena|undefined{
 if(!value.startsWith('cena:'))return
 const [view,query]=value.slice(5).split('?'),p=new URLSearchParams(query)
 const kind=p.get('acao') as AcaoBairro,key=p.get('evento')
 if(!/^[a-z0-9-]{1,50}$/.test(view)||!key||key.length>500||!KINDS.includes(kind))return
 let ator:AtorCena|undefined
 try{const raw=p.get('ator');if(raw&&raw.length<=500){const a=JSON.parse(raw);if(typeof a.nome==='string'&&a.nome.length<=100)ator={nome:a.nome,...(typeof a.club==='string'?{club:a.club.slice(0,100)}:{}),...(Number.isInteger(a.year)?{year:a.year}:{}),...(typeof a.id==='string'?{id:a.id.slice(0,100)}:{})}}}catch{/* old or malformed cue keeps its generic scene */}
 return {...(ator?{ator}:{}),view,key,kind,manual:p.get('manual')==='1',replay:p.get('replay')==='1'}
}
export function marcarCena(diario:DiarioBairro|undefined,cena:CenaVista):DiarioBairro{
 const old=diario??{seen:[],sales:[]}
 if(old.seen.some(s=>s.id===cena.id))return old
 return {...old,seen:[...old.seen,cena].slice(-100)}
}
export function registrarVendas(diario:DiarioBairro|undefined,values:({season:number;camisas:number}|undefined)[]):DiarioBairro{
 const old=diario??{seen:[],sales:[]},sales=[...old.sales]
 for(const v of values){if(!v||!Number.isInteger(v.season)||!Number.isInteger(v.camisas)||v.camisas<0||sales.some(s=>s.season===v.season))continue;sales.push({season:v.season,count:v.camisas})}
 if(sales.length===old.sales.length)return old
 return {...old,sales:sales.sort((a,b)=>a.season-b.season).slice(-12)}
}
export function cenaPodeAparecer(c:{chave:string;grupo:string;prioridade:number;acao:AcaoBairro},diario:DiarioBairro|undefined,season:number,round:number){
 if(diario?.seen.some(s=>s.id===c.chave||s.group===c.grupo))return false
 if(c.prioridade>=90)return true
 const last=diario?.seen.at(-1)
 return !last||last.season!==season||round-last.round>=3
}

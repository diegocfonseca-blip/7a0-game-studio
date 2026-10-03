import {PRESIDENCIA_CATALOGO,itemPresidencia,type PresidenciaItemId} from './presidencia-economia'
export type OrdemCatalogo='price-asc'|'price-desc'|'name'
export function ordemCatalogoValida(v:unknown):v is OrdemCatalogo{return v==='price-asc'||v==='price-desc'||v==='name'}
const busca=(v:string)=>v.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase().trim()
/** Navegação local: não altera catálogo, preços, seleção da garagem ou save. */
export function filtrarCatalogoPresidencia({furniture=false,tab='carro',owned=[],search='',order='price-asc',english=false}:{furniture?:boolean;tab?:'carro'|'duas-rodas'|'owned';owned?:readonly {id:PresidenciaItemId}[];search?:string;order?:OrdemCatalogo;english?:boolean}){
 const query=busca(search),name=(p:{pt:string;en:string})=>english?p.en:p.pt
 // Meus Bens inclui IDs antigos reconhecidos, que só podem ser revendidos.
 // A loja continua limitada ao catálogo atual: nunca oferecer recompra legada.
 const source=!furniture&&tab==='owned'
  ?[...new Set(owned.map(b=>b.id))].map(id=>itemPresidencia(id)).filter((p):p is NonNullable<typeof p>=>!!p)
  :[...PRESIDENCIA_CATALOGO]
 return source.filter(p=>(furniture?!['carro','duas-rodas'].includes(p.slot):tab==='owned'||p.slot===tab)&&busca(name(p)).includes(query)).sort((a,b)=>{
  const price=order==='price-desc'?b.price-a.price:a.price-b.price
  return (order==='name'?0:price)||name(a).localeCompare(name(b),english?'en':'pt-BR')||a.id.localeCompare(b.id)
 })
}

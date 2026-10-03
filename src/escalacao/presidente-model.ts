import { PRESIDENTE_REFERENCIAS } from './presidente-referencias'
import {normalizarRoupa,type PresidenteRoupaId} from './presidente-roupas'

export const PRESIDENTE_BASE = {id:'presidente-base-v2',src:'presidente-v2/base-v2.webp',width:384,height:512} as const
export const PRESIDENTE_DRAFT_KEY = 'll-presidente-v2-preview'
export type PresidentePeca = {
  id:string; source:string; kind:'hair'|'beard'|'accessory'; label:string; labelEn?:string;
  front:string; back?:string; approved:boolean; skinId?:string; hairClipFrom?:number;
}
// Nenhuma peça antiga é reaproveitada automaticamente. Só entra após conferir
// a referência e o encaixe na cabeça única. A lista de 62 não é lista de peças.
// approved = conferência técnica para a bancada LOCAL; não é aprovação de publicação.
export const PRESIDENTE_PECAS: PresidentePeca[] = [
  {id:'neymar-2011-hair',source:'neymar-santos-2011',kind:'hair',label:'Neymar · Santos 2011',front:'presidente-v2/neymar-santos-2011-hair.webp',approved:true},
  {id:'neymar-2011-earrings',source:'neymar-santos-2011',kind:'accessory',label:'Neymar · ◇',front:'presidente-v2/neymar-santos-2011-earrings.webp',approved:true},
  {id:'ronaldo-1998-hair',source:'ronaldo-fenomeno-inter-1998',kind:'hair',label:'Ronaldo Fenômeno',front:'presidente-v2/ronaldo-1998-hair.webp',approved:true},
  {id:'messi-2023-hair',source:'lionel-messi-inter-miami-2023',kind:'hair',label:'Messi · Inter Miami',front:'presidente-v2/messi-2023-hair.webp',approved:true},
  {id:'messi-2023-beard',source:'lionel-messi-inter-miami-2023',kind:'beard',label:'Messi · Inter Miami',front:'presidente-v2/messi-2023-beard.webp',approved:true},
  {id:'cristiano-2014-hair',source:'cristiano-ronaldo-real-madrid-2014',kind:'hair',label:'Cristiano Ronaldo',front:'presidente-v2/cristiano-2014-hair.webp',approved:true},
  {id:'dani-2011-hair',source:'dani-alves-barcelona-2011',kind:'hair',label:'Dani Alves',front:'presidente-v2/dani-2011-hair.webp',approved:true},
  {id:'dani-2011-beard',source:'dani-alves-barcelona-2011',kind:'beard',label:'Dani Alves',front:'presidente-v2/dani-2011-beard.webp',approved:true},
  {id:'didi-1958-hair',source:'didi-botafogo-1958',kind:'hair',label:'Didi',front:'presidente-v2/didi-1958-hair.webp',approved:true},
  {id:'didi-1958-moustache',source:'didi-botafogo-1958',kind:'beard',label:'Didi · bigode',labelEn:'Didi · moustache',front:'presidente-v2/didi-1958-moustache.webp',approved:true},
  {id:'maldini-1994-hair',source:'paolo-maldini-milan-1994',kind:'hair',label:'Maldini',front:'presidente-v2/maldini-1994-hair.webp',back:'presidente-v2/maldini-1994-hair-back-v3.webp',approved:true},
  {id:'ronaldinho-2005-headband',source:'ronaldinho-gaucho-barcelona-2005',kind:'accessory',label:'Ronaldinho · faixa',labelEn:'Ronaldinho · headband',front:'presidente-v2/ronaldinho-2005-headband.webp',approved:true},
  {id:'vini-2024-hair',source:'vinicius-junior-real-madrid-2024',kind:'hair',label:'Vini Jr.',front:'presidente-v2/vini-2024-hair.webp',approved:true},
  {id:'vini-2024-beard',source:'vinicius-junior-real-madrid-2024',kind:'beard',label:'Vini Jr. · cavanhaque',labelEn:'Vini Jr. · goatee',front:'presidente-v2/vini-2024-beard.webp',approved:true},
  {id:'rivaldo-1999-hair',source:'rivaldo-barcelona-1999',kind:'hair',label:'Rivaldo',front:'presidente-v2/rivaldo-1999-hair.webp',approved:true},
  {id:'junior-1981-hair',source:'junior-maestro-flamengo-1981',kind:'hair',label:'Júnior Maestro',front:'presidente-v2/junior-1981-hair.webp',back:'presidente-v2/junior-1981-hair-back.webp',approved:true},
  {id:'platini-1984-hair',source:'michel-platini-juventus-1984',kind:'hair',label:'Platini',front:'presidente-v2/platini-1984-hair.webp',back:'presidente-v2/platini-1984-hair-back.webp',approved:true},
  {id:'cerezo-1980-hair',source:'toninho-cerezo-atletico-mg-1980',kind:'hair',label:'Cerezo',front:'presidente-v2/cerezo-1980-hair.webp',back:'presidente-v2/cerezo-1980-hair-back.webp',approved:true},
  {id:'cerezo-1980-moustache',source:'toninho-cerezo-atletico-mg-1980',kind:'beard',label:'Cerezo · bigode',labelEn:'Cerezo · moustache',front:'presidente-v2/cerezo-1980-moustache.webp',approved:true},
  {id:'nilton-1958-hair',source:'nilton-santos-botafogo-1958',kind:'hair',label:'Nílton Santos',front:'presidente-v2/nilton-1958-hair.webp',approved:true},
  {id:'nilton-1958-moustache',source:'nilton-santos-botafogo-1958',kind:'beard',label:'Nílton Santos · bigode',labelEn:'Nílton Santos · moustache',front:'presidente-v2/nilton-1958-moustache.webp',approved:true},
  {id:'ribery-2013-hair',source:'franck-ribery-bayern-2013',kind:'hair',label:'Ribéry',front:'presidente-v2/ribery-2013-hair.webp',approved:true},
  {id:'ribery-2013-beard',source:'franck-ribery-bayern-2013',kind:'beard',label:'Ribéry',front:'presidente-v2/ribery-2013-beard.webp',approved:true},
  {id:'ribery-2013-scar',source:'franck-ribery-bayern-2013',kind:'accessory',label:'Ribéry · cicatriz',labelEn:'Ribéry · scar',front:'presidente-v2/ribery-2013-scar.webp',approved:true},
  {id:'yashin-1963-cap',source:'lev-yashin-dinamo-de-moscou-1963',kind:'accessory',label:'Yashin · boné',labelEn:'Yashin · cap',front:'presidente-v2/yashin-1963-cap.webp',approved:true,hairClipFrom:35},
]
export const PRESIDENTE_PELES = [
  {id:'skin-kevin-de-bruyne-manchester-city-2020',pt:'Tom 1',en:'Tone 1',src:'presidente-v2/skin-kevin-de-bruyne-manchester-city-2020.webp'},
  {id:'base-tan',pt:'Tom 2 · base',en:'Tone 2 · base',src:PRESIDENTE_BASE.src},
  {id:'skin-kylian-mbappe-psg-2022',pt:'Tom 3',en:'Tone 3',src:'presidente-v2/skin-kylian-mbappe-psg-2022.webp'},
  {id:'skin-vinicius-junior-real-madrid-2024',pt:'Tom 4',en:'Tone 4',src:'presidente-v2/skin-vinicius-junior-real-madrid-2024.webp'},
]
export type PresidenteVisual = {version:2;head:'presidente-base-v2';name:string;skin:string;hair:string;beard:string;accessories:string[];outfit:PresidenteRoupaId}
export const PRESIDENTE_PADRAO: PresidenteVisual = {version:2,head:PRESIDENTE_BASE.id,name:'',skin:'base-tan',hair:'none',beard:'none',accessories:[],outfit:'polo-azul'}
export function normalizarPresidente(raw:unknown,pecas=PRESIDENTE_PECAS):PresidenteVisual {
  if(!raw||typeof raw!=='object') return {...PRESIDENTE_PADRAO,accessories:[]}
  const v=raw as Partial<PresidenteVisual>
  const permitida=(id:unknown,kind:PresidentePeca['kind'])=>typeof id==='string'&&pecas.some(p=>p.id===id&&p.kind===kind&&p.approved&&PRESIDENTE_REFERENCIAS.some(r=>r.id===p.source))
  return {version:2,head:PRESIDENTE_BASE.id,name:typeof v.name==='string'?v.name.slice(0,40):'',
    outfit:normalizarRoupa(v.outfit),
    skin:PRESIDENTE_PELES.some(s=>s.id===v.skin)?v.skin!:'base-tan',
    hair:permitida(v.hair,'hair')?v.hair!:'none',beard:permitida(v.beard,'beard')?v.beard!:'none',
    accessories:Array.isArray(v.accessories)?[...new Set(v.accessories.filter(id=>permitida(id,'accessory')))]:[]}
}
export const PRESIDENCIA_SECOES = [
  {id:'sala',pt:'Minha sala',en:'My office'},
  {id:'moveis',pt:'Mobiliar a sala',en:'Furnish the office'},
  {id:'presidente',pt:'Editar presidente',en:'Edit president'},
  {id:'trofeus',pt:'Troféus',en:'Trophies'},
  {id:'mandato',pt:'Linha do tempo',en:'Timeline'},
  {id:'patrimonio',pt:'Patrimônio',en:'Assets'},
] as const
// Patrocínio, TV, agência e finanças mantêm os fluxos atuais. Este módulo
// não compra móveis, não concede troféus e não altera save/economia/permissões.

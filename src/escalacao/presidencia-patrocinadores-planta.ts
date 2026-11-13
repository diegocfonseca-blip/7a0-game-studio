import type {PontoComplexo} from './presidencia-complexo-model'

export type PatrocinadorCidadeId='vadico'|'dsouza'|'tidex'|'oittolabs'|'gecg'
export const LOGOS_PATROCINADORES_CIDADE={
 vadico:{src:new URL('./img/patro-vadico-alfa.webp',import.meta.url).href,width:496,height:140,background:'#eee6d3'},
 dsouza:{src:new URL('./img/patro-dsouza.webp',import.meta.url).href,width:440,height:361,background:'#050805'},
 tidex:{src:new URL('./img/patro-tidex.webp',import.meta.url).href,width:837,height:120,background:'#0b1220'},
 oittolabs:{src:new URL('./img/patro-oittolabs.webp',import.meta.url).href,width:331,height:120,background:'#f4ecd6'},
 gecg:{src:new URL('./img/patro-gecg.webp',import.meta.url).href,width:305,height:360,background:'#11225a'},
} as const
const rectangle=(x:number,z:number,w:number,d:number):PontoComplexo[]=>[{x:x-w/2,z:z-d/2},{x:x+w/2,z:z-d/2},{x:x+w/2,z:z+d/2},{x:x-w/2,z:z+d/2}]
// Avenida comercial ao sul do anel do estádio. Todos os prédios mostram a
// fachada à câmera de abertura; nenhum lote ocupa o estádio ou seus acessos.
export const LOTES_PATROCINADORES_CIDADE={
 dsouza:{id:'dsouza',label:'dSouza Empreendimentos',x:-40,z:281,width:60,depth:70,height:10,buildingWidth:48,buildingDepth:28,frontWalkZ:330,footprint:rectangle(-40,281,60,70)},
 tidex:{id:'tidex',label:'Tidex',x:-100,z:252,width:34,depth:70,height:32,buildingWidth:24,buildingDepth:20,frontWalkZ:302,footprint:rectangle(-100,252,34,70)},
 oittolabs:{id:'oittolabs',label:'OittoLabs',x:-143,z:252,width:34,depth:70,height:25,buildingWidth:23,buildingDepth:20,frontWalkZ:302,footprint:rectangle(-143,252,34,70)},
 gecg:{id:'gecg',label:'Grêmio Esportivo Campo Grande',x:69,z:270,width:74,depth:84,height:7,buildingWidth:55,buildingDepth:35,frontWalkZ:330,footprint:rectangle(69,270,74,84)},
} as const
// Rótulo na avenida, livre dos logos pintados nos telhados.
export const CENTRO_PATROCINADORES_CIDADE={x:13,z:324}
export const ACESSO_GECG_CIDADE={id:'acesso-gecg',points:[{x:7.15,z:212.95},{x:13,z:225},{x:13,z:330}],width:8,walk:2.2} as const
export const RUAS_PATROCINADORES_CIDADE=[
 ACESSO_GECG_CIDADE,
 {id:'avenida-parceiros',points:[{x:-180,z:330},{x:120,z:330}],width:8,walk:2.2},
 {id:'acesso-escritorios',points:[{x:-174,z:302},{x:-76.5,z:302},{x:-76.5,z:330}],width:5.8,walk:1.5},
] as const
const reservaRua=(road:typeof RUAS_PATROCINADORES_CIDADE[number])=>{const pad=road.width/2+road.walk+1,xs=road.points.map(p=>p.x),zs=road.points.map(p=>p.z);return rectangle((Math.min(...xs)+Math.max(...xs))/2,(Math.min(...zs)+Math.max(...zs))/2,Math.max(...xs)-Math.min(...xs)+pad*2,Math.max(...zs)-Math.min(...zs)+pad*2)}
export const RESERVAS_PATROCINADORES_CIDADE=[...Object.values(LOTES_PATROCINADORES_CIDADE).map(p=>p.footprint),...RUAS_PATROCINADORES_CIDADE.map(reservaRua),rectangle(-40,312,5,36)]
export function reservaPatrocinadorCidade(p:PontoComplexo,margin=0){
 return RESERVAS_PATROCINADORES_CIDADE.some(poly=>p.x>=poly[0].x-margin&&p.x<=poly[1].x+margin&&p.z>=poly[0].z-margin&&p.z<=poly[2].z+margin)
}

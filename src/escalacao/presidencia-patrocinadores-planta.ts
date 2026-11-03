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
// Independent city blocks. Only the two offices share a neighbourhood; the
// society pitch stays south-west, clear of their height and roof silhouettes.
// No stadium purchase, fan entrance, coach lane or rail platform is displaced.
export const LOTES_PATROCINADORES_CIDADE={
 dsouza:{id:'dsouza',label:'dSouza Empreendimentos',x:-425,z:-277,width:60,depth:70,height:10,buildingWidth:48,buildingDepth:28,footprint:rectangle(-425,-277,60,70)},
 tidex:{id:'tidex',label:'Tidex',x:-220,z:-277,width:34,depth:70,height:32,buildingWidth:24,buildingDepth:20,footprint:rectangle(-220,-277,34,70)},
 oittolabs:{id:'oittolabs',label:'OittoLabs',x:-175,z:-277,width:34,depth:70,height:25,buildingWidth:23,buildingDepth:20,footprint:rectangle(-175,-277,34,70)},
 gecg:{id:'gecg',label:'Grêmio Esportivo Campo Grande',x:-425,z:-115,width:74,depth:84,height:7,buildingWidth:55,buildingDepth:35,footprint:rectangle(-425,-115,74,84)},
} as const
export const ACESSO_GECG_CIDADE={id:'acesso-gecg',points:[{x:-475,z:-231.34},{x:-475,z:-74}],width:5.8,walk:1.8} as const
export const RUAS_PATROCINADORES_CIDADE=[
 {id:'acesso-dsouza',points:[{x:-350.94,z:-231.34},{x:-475,z:-231.34}],width:8,walk:2.2},
 ACESSO_GECG_CIDADE,
] as const
export const RESERVAS_PATROCINADORES_CIDADE=[...Object.values(LOTES_PATROCINADORES_CIDADE).map(p=>p.footprint),rectangle(-475,-152.5,14,171),rectangle(-413,-231.34,142,17)]
export function reservaPatrocinadorCidade(p:PontoComplexo,margin=0){
 return RESERVAS_PATROCINADORES_CIDADE.some(poly=>p.x>=poly[0].x-margin&&p.x<=poly[1].x+margin&&p.z>=poly[0].z-margin&&p.z<=poly[2].z+margin)
}

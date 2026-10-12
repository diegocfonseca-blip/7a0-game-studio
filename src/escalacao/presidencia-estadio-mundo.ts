import type {StadiumSave} from './estadiodata'
import {estadioVisualValido} from './presidencia-estadio-validacao'
import {progressoVisualSetor} from './presidencia-estadio-camadas'
import {segundoAndarConcluido,primeiroAndarConcluido} from './presidencia-estadio-projeto'
export type ArteMundo='plots'|'empty'|'lower'|'upper'|'complete'|'closed'
export type AreaMundo=readonly (readonly [number,number])[]
export type CamadaMundo={id:string;art:ArteMundo;area?:AreaMundo;progress:number;depth:number;brightness?:number;window?:readonly [number,number,number,number]}
/** Todas as coordenadas pertencem à mesma planta. Compras nunca reposicionam lotes. */
export const AREAS_MUNDO:Readonly<Record<string,AreaMundo>>={
 estadio:[[384,351],[417,270],[478,211],[559,175],[955,175],[1055,234],[1093,309],[1119,412],[1105,459],[1047,514],[929,565],[913,588],[586,588],[565,566],[446,497],[386,420]],
 grama:[[588,311],[911,312],[933,425],[575,425]],
 hotel:[[170,411],[298,389],[454,471],[463,568],[327,618],[190,552]],
 loja:[[1168,317],[1230,312],[1270,428],[1205,453],[1173,405]],
 chopp:[[1047,271],[1155,267],[1207,292],[1196,325],[1092,317]],
 praca:[[1068,477],[1124,459],[1232,485],[1298,454],[1289,515],[1184,587],[1093,626],[963,587],[944,548]],
 estacao:[[940,87],[1500,192],[1510,315],[1310,315],[1232,304],[1168,277],[1236,213],[1020,153],[934,242],[896,225],[930,174]],
 estac:[[115,357],[284,225],[399,155],[553,175],[478,216],[409,279],[328,357],[185,421]],
 parkingRight:[[1260,325],[1431,364],[1490,445],[1442,534],[1390,600],[1227,733],[1046,827],[872,851],[855,724],[974,680],[1025,631],[1134,622],[1232,562],[1314,477]],
 parkingLeft:[[338,643],[458,622],[569,664],[662,714],[651,848],[500,820],[362,746]],
 telao:[[730,194],[775,194],[775,221],[730,221]],
}
export const clipMundo=(area:AreaMundo)=>'polygon('+area.map(([x,y])=>`${x/1536*100}% ${y/1024*100}%`).join(', ')+')'
const LOWER_AREA:AreaMundo=[[385,358],[442,295],[527,238],[908,236],[992,266],[1060,325],[1105,414],[1088,458],[1026,501],[920,553],[913,588],[586,588],[572,566],[446,497],[386,420]]
const UPPER_AREA:AreaMundo=[[385,351],[425,293],[487,237],[551,199],[925,199],[1003,241],[1067,304],[1105,385],[1110,445],[1047,514],[929,565],[913,588],[586,588],[565,566],[446,497],[386,420]]
export function camadasMundo(st?:StadiumSave):CamadaMundo[]{
 if(st!==undefined&&!estadioVisualValido(st))return []
 const save=st??{inv:{},ext:[]},ext=new Set(save.ext),layers:CamadaMundo[]=[]
 // Fundo completo apenas quando pavimentado. Os lotes não adquiridos são
 // cobertos pelo terreno: nenhuma construção vem grátis com o asfalto.
 layers.push({id:'terreno',art:ext.has('asfalto')?'complete':'empty',progress:1,depth:0})
 if(ext.has('asfalto'))for(const [key,area] of Object.entries(AREAS_MUNDO)){
  if(key==='grama'||key==='telao')continue
  layers.push({id:'lote:'+key,art:key==='estadio'||key==='estacao'?'empty':'plots',area,progress:1,depth:1})
 }
 for(const key of ['estacao','estac','hotel','loja','chopp','praca'])if(ext.has(key)){
  const areas=key==='estac'?['estac','parkingLeft','parkingRight']:[key]
  for(const name of areas)layers.push({id:key+':'+name,art:'complete',area:AREAS_MUNDO[name],progress:1,depth:2})
 }
 const sections:Readonly<Record<string,readonly [number,number,number,number]>>={geral:[380,170,745,140],cadeiras:[380,310,375,280],visitante:[755,310,375,280]}
 for(const [key,window] of Object.entries(sections)){
  const progress=progressoVisualSetor(save,key)
  if(progress)layers.push({id:key,art:'lower',area:LOWER_AREA,window,progress,depth:3})
 }
 const upper=progressoVisualSetor(save,'camarote')
 if(upper&&primeiroAndarConcluido(save))layers.push({id:'camarote',art:'upper',area:UPPER_AREA,progress:upper,depth:4})
 const roof=segundoAndarConcluido(save)&&progressoVisualSetor(save,'grama')===1&&ext.has('cober')
 if(roof)layers.push({id:'cober',art:'complete',area:AREAS_MUNDO.estadio,progress:1,depth:5})
 // Mantém o gramado independente de arquibancadas e cobertura.
 layers.push({id:'solo-campo',art:'empty',area:upper||!['geral','cadeiras','visitante'].some(k=>progressoVisualSetor(save,k)>0)?AREAS_MUNDO.grama:[[596,287],[916,287],[942,428],[565,428]],progress:1,depth:6})
 const grass=progressoVisualSetor(save,'grama')
 if(grass)layers.push({id:'grama',art:'complete',area:AREAS_MUNDO.grama,progress:grass,depth:7,brightness:ext.has('refl')&&progressoVisualSetor(save,'geral')===1?1:.76})
 if(roof&&!ext.has('telao'))layers.push({id:'sem-telao',art:'upper',area:AREAS_MUNDO.telao,progress:1,depth:8})
 if(ext.has('refl')&&grass&&progressoVisualSetor(save,'geral')===1)layers.push({id:'refl',art:'complete',area:AREAS_MUNDO.grama,progress:grass,depth:7})
 if(ext.has('telao')&&progressoVisualSetor(save,'cadeiras')===1)layers.push({id:'telao',art:'complete',area:AREAS_MUNDO.telao,progress:1,depth:8})
 if(roof&&ext.has('retratil')&&save.roofClosed)layers.push({id:'retratil',art:'closed',area:AREAS_MUNDO.estadio,progress:1,depth:9})
 return layers
}

/** Recortes registrados: a travessa do acesso e copas ocultam quem passa atrás. */
export const OCLUSORES_MUNDO:readonly {id:string;area:AreaMundo;groundY:number;requires?:string}[]=[
 {id:'acesso-externo',groundY:823,area:[[812,786],[862,786],[866,809],[810,809]]},
 {id:'acesso-interno',groundY:750,area:[[809,716],[867,716],[867,735],[809,735]]},
 {id:'arvore-acesso-norte',groundY:648,area:[[820,617],[834,609],[849,617],[852,635],[843,645],[825,640]]},
 {id:'arvore-acesso-sul',groundY:672,area:[[820,648],[834,636],[851,646],[850,665],[831,669],[817,659]]},
 // Estas copas pertencem ao lote da estação, mesmo antes do asfalto.
 {id:'palmeira-estacao-oeste',requires:'estacao',groundY:302,area:[[1298,278],[1303,276],[1308,280],[1314,284],[1310,289],[1305,292],[1301,289],[1295,292],[1294,286],[1290,284],[1295,281]]},
 {id:'palmeira-estacao-leste',requires:'estacao',groundY:311,area:[[1326,286],[1331,285],[1334,290],[1339,293],[1335,298],[1330,300],[1325,298],[1320,301],[1319,295],[1322,290]]},
 {id:'palmeira-calcada-leste',groundY:740,area:[[1278,715],[1282,716],[1285,723],[1289,727],[1287,732],[1282,732],[1278,735],[1273,731],[1271,725],[1275,724]]},
 {id:'palmeira-calcada-oeste',groundY:755,area:[[1247,726],[1251,726],[1255,731],[1259,737],[1256,745],[1250,741],[1244,746],[1239,740],[1238,735],[1243,731]]},
 {id:'arvore-acesso-hotel',groundY:580,area:[[457,552],[466,552],[471,558],[476,559],[471,567],[468,571],[460,569],[453,571],[454,563],[449,560]]},
]

/** A oclusão acompanha a compra que realmente desenha o objeto. */
export const oclusoresDoMundo=(st?:StadiumSave)=>OCLUSORES_MUNDO.filter(o=>st?.ext.includes(o.requires??'asfalto'))

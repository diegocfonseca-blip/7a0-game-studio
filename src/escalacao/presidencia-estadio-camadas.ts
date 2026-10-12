import {STADIUM_SECTORS,STADIUM_EXTRAS,type StadiumSave} from './estadiodata'
import {estadioVisualValido} from './presidencia-estadio-validacao'
import {estruturaEstadioCompleta,estadioCompletoNaAerea,estadioCompletoNaJanela} from './presidencia-estadio-completo'

export type CameraEstadio='window'|'aerial'
export type CamadaEstadio={id:string;src:string;clip:string;progress:number;bounds?:{left:number;top:number;width:number;height:number};sourceBounds?:{left:number;top:number;width:number;height:number};depth?:number}
const polygon=(points:string)=>`polygon(${points})`
// Recortes de apresentação dos rasters aprovados. Nenhuma arte rejeitada ou
// cobertura redesenhada: os pixels continuam nos arquivos originais.
const aerial='estadio-v104/aberto.webp',windowOpen='estadio-v115/aberto-janela.webp'
const sprites:Record<string,Partial<Record<CameraEstadio,readonly {src:string;left:number;top:number;width:number;height:number}[]>>>={
 loja:{aerial:[{src:'loja',left:73,top:44,width:11,height:14}]},
 praca:{aerial:[{src:'praca',left:79,top:52,width:15,height:15}]},
 chopp:{aerial:[{src:'chopp',left:86,top:40,width:12,height:14}]},
 estac:{aerial:[{src:'estac',left:65,top:65,width:16,height:14}]},
 estacao:{aerial:[{src:'estacao',left:70,top:5,width:19,height:14}]},
 hotel:{aerial:[{src:'hotel',left:3,top:42,width:16,height:23}]},
 refl:{aerial:[{src:'refletor-aerea',left:23,top:8,width:4,height:24},{src:'refletor-aerea',left:67,top:8,width:4,height:24}],window:[{src:'refletor-janela',left:9,top:4,width:3,height:28},{src:'refletor-janela',left:89,top:4,width:3,height:28}]},
}
export const EXTRAS_CAMADAS:Readonly<Record<string,Partial<Record<CameraEstadio,readonly string[]>>>>={
 telao:{aerial:[polygon('47% 11%, 52% 11%, 52% 15%, 47% 15%')],window:[polygon('46% 22%, 53% 22%, 53% 29%, 46% 29%')]},
 cober:{aerial:[polygon('27% 19%, 31% 18%, 29% 34%, 27% 43%, 24% 40%'),polygon('65% 18%, 70% 19%, 75% 40%, 72% 43%, 69% 34%')],window:[polygon('0% 0%, 29% 20%, 24% 22%, 0% 8%'),polygon('100% 0%, 71% 20%, 76% 22%, 100% 8%')]},
 retratil:{aerial:[polygon('31% 18%, 65% 18%, 72% 42%, 67% 48%, 32% 48%, 26% 42%')],window:[polygon('0% 0%, 100% 0%, 100% 20%, 0% 20%')]},
}
const files:Record<string,Record<CameraEstadio,string>>={
 geral:{aerial:'estadio-v104/geral.webp',window:'estadio-v112/geral-janela.webp'},
 cadeiras:{aerial:'estadio-v223/cadeiras-aerea.webp',window:'estadio-v223/cadeiras-janela.webp'},
 visitante:{aerial:'estadio-v225/visitante-aerea.webp',window:'estadio-v225/visitante-janela.webp'},
 camarote:{aerial:'estadio-v226/camarote-aerea.webp',window:'estadio-v225/visitante-janela.webp'},
}
const sectors:Record<string,Partial<Record<CameraEstadio,string>>>={
 geral:{aerial:polygon('24% 19%, 64% 19%, 64% 26%, 33% 26%, 29% 44%, 24% 43%'),window:polygon('0% 24%, 77% 24%, 77% 33%, 0% 41%')},
 cadeiras:{aerial:polygon('24% 19%, 64% 19%, 64% 26%, 33% 26%, 29% 44%, 24% 43%'),window:polygon('0% 24%, 77% 24%, 77% 33%, 0% 41%')},
 visitante:{aerial:polygon('64% 23%, 69% 23%, 73% 42%, 68% 44%'),window:polygon('77% 24%, 100% 29%, 100% 44%, 77% 35%')},
 camarote:{aerial:polygon('29% 40%, 70% 40%, 70% 49%, 29% 49%')},
}
/** Sem arredondar: 99,99% não libera teto nem troca a base por obra pronta. */
export function progressoVisualSetor(st:StadiumSave,key:string):number{
 const sector=STADIUM_SECTORS.find(s=>s.k===key)
 if(!sector)return 0
 if(key==='grama'&&st.ext.includes('grama'))return 1
 return Math.max(0,Math.min(1,(st.inv[key]??0)/sector.cost))
}
export function camadasEstadio(st:StadiumSave|undefined,camera:CameraEstadio):CamadaEstadio[]{
 if(!estadioVisualValido(st)||camera==='window'&&estadioCompletoNaJanela(st))return []
 const layers:CamadaEstadio[]=[]
 for(const sector of STADIUM_SECTORS){
  const progress=progressoVisualSetor(st,sector.k),clip=sectors[sector.k]?.[camera]
  if(progress>0&&(camera==='aerial'||progress<1)&&clip)layers.push({id:sector.k,src:files[sector.k][camera],clip,progress,depth:camera==='aerial'?2000:undefined})
 }
 for(const extra of STADIUM_EXTRAS){
  if(!st.ext.includes(extra.k))continue
  // A cobertura de referência pertence à estrutura completa. Em estados
  // legados incompletos permanece registrada, sem inventar setores prontos.
  if(extra.k==='cober'&&!estruturaEstadioCompleta(st))continue
  if(extra.k==='retratil'&&!estruturaEstadioCompleta(st))continue
  if(extra.k==='retratil'&&(!st.ext.includes('cober')||st.roofClosed!==true))continue
  if(extra.k==='refl'&&progressoVisualSetor(st,'geral')<1)continue
  if(extra.k==='telao'&&progressoVisualSetor(st,'cadeiras')<1)continue
  if(sprites[extra.k]){
   for(const [index,sprite] of (sprites[extra.k][camera]??[]).entries()){
    const {src,...bounds}=sprite
    layers.push({id:extra.k+':'+index,src:'estadio-infra/'+src+'.webp',clip:polygon('0% 0%, 100% 0%, 100% 100%, 0% 100%'),progress:1,bounds,depth:camera==='aerial'?Math.round((bounds.top+bounds.height)*42.7):undefined})
   }
   continue
  }
  const src=extra.k==='retratil'?(camera==='aerial'?'estadio-v104/fechado.webp':'estadio-v115/fechado-janela.webp'):(camera==='aerial'?aerial:windowOpen)
  for(const [index,clip] of (EXTRAS_CAMADAS[extra.k]?.[camera]??[]).entries()){
   if(extra.k==='cober'&&index===1&&progressoVisualSetor(st,'visitante')<1)continue
   layers.push({id:extra.k+':'+index,src,clip,progress:1,sourceBounds:camera==='aerial'&&extra.k!=='telao'?{left:6,top:11,width:88,height:85}:undefined,depth:camera==='aerial'?2100:undefined})
  }
 }
 return layers
}
/** Movimento decorativo local, sem mensagens online ou mudanças no save. */
export function populacaoEstadio(st?:StadiumSave):{workers:number;fans:number;security:number}{
 if(!estadioVisualValido(st))return {workers:0,fans:0,security:0}
 const progress=STADIUM_SECTORS.map(s=>progressoVisualSetor(st,s.k))
 const completed=progress.slice(1).filter(p=>p===1).length
 return {workers:progress.some(p=>p>0&&p<1)?2:0,fans:completed===0?0:Math.min(6,completed+(st.ext.includes('estacao')?2:0)+(st.ext.includes('praca')?1:0)),security:completed>=3?1:0}
}
export function personagensEstadio(st:StadiumSave|undefined,camera:CameraEstadio){
 const population=populacaoEstadio(st)
 const sources=['workers','groundskeepers','security','fans-beige','fans-green','family']
 const people=[...Array.from({length:population.workers},(_,i)=>({source:i%2,stand:false})),...Array.from({length:population.fans},(_,i)=>({source:3+i%3,stand:i%2===0})),...Array.from({length:population.security},()=>({source:2,stand:false}))]
 const closed=estruturaEstadioCompleta(st)&&st?.ext.includes('retratil')&&st.ext.includes('cober')&&st.roofClosed===true
 const complete=estadioCompletoNaAerea(st)
 return people.map(({source,stand:initialStand},index)=>{
  const stand=initialStand&&!closed
  return {
  src:'estadio-npcs/'+sources[source]+'.webp',kind:source<2?'worker':source===2?'security':'fan',placement:stand?'stand':'grounds',
  left:camera==='aerial'?(stand?35+index*3:35+index*3.2):(stand?26+index*6:16+index*8),
  top:camera==='aerial'?(stand?22:(complete?65:53)+index%3*4):(stand?30:56+index%2*2),delay:-index*2,
 }})
}
export function extrasSemArte(st?:StadiumSave):string[]{
 if(!estadioVisualValido(st))return []
 const represented=new Set(camadasEstadio(st,'aerial').map(layer=>layer.id.split(':')[0]))
 return st.ext.filter(key=>key!=='grama'&&key!=='medico'&&key!=='asfalto'&&!represented.has(key)&&!(key==='retratil'&&estruturaEstadioCompleta(st)&&st.ext.includes('cober')&&st.roofClosed!==true))
}
export function vistaTemPendencias(st?:StadiumSave):boolean{
 if(!estadioVisualValido(st))return st!==undefined
 return extrasSemArte(st).length>0||Object.entries(st.inv).some(([key,value])=>value>0&&!STADIUM_SECTORS.some(sector=>sector.k===key))
}

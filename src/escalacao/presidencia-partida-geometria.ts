import {projetarCampo} from './presidencia-partida-model'
/** Coordenadas registradas na arte 1536×1024. A bola e os pés usam o mesmo
 * gramado; as faces da rede são primeiro plano transparente. */
export const CAMPO_INTERNO=[[220,400],[1290,400],[108,818],[1415,818]] as const
export const CAMPO_MAPA=[[588,311],[911,312],[575,425],[933,425]] as const
type Ponto=readonly[number,number]
type Face=readonly[Ponto,Ponto,Ponto,Ponto]
/** Baliza oficial: 7,32 m de boca, 2,44 m de altura e 2 m de rede. */
export function balizasDoCampo(corners:typeof CAMPO_INTERNO|typeof CAMPO_MAPA=CAMPO_INTERNO){
 const half=7.32/68/2,ys=[.5-half,.5+half]
 return [false,true].map(right=>{
  const front=right?1:0,back=right?1+2/105:-2/105
  const p=(x:number,y:number,height=0):Ponto=>{const q=projetarCampo(x,y,corners);return [q.x,q.y-height*escalaNoGramado(corners,y).athleteHeight/1.8]}
  const a=p(front,ys[0]),b=p(front,ys[1]),at=p(front,ys[0],2.44),bt=p(front,ys[1],2.44)
  const c=p(back,ys[0]),d=p(back,ys[1]),ct=p(back,ys[0],2.44),dt=p(back,ys[1],2.44)
  const faces:Face[]=[[ct,dt,d,c],[at,ct,c,a],[bt,dt,d,b]]
  return {faces,posts:[a,at,bt,b],backFrame:[c,ct,dt,d]}
 })
}
export const FACES_REDE=balizasDoCampo().flatMap(g=>g.faces)
export function linhasDaRede(corners:typeof CAMPO_INTERNO|typeof CAMPO_MAPA=CAMPO_INTERNO){
 const mix=(a:readonly[number,number],b:readonly[number,number],t:number)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t] as const
 return balizasDoCampo(corners).flatMap(g=>g.faces).flatMap((face,side)=>{const [tl,tr,br,bl]=face;return Array.from({length:17},(_,i)=>{const q=i/16;return [{id:side+':v:'+i,a:mix(tl,tr,q),b:mix(bl,br,q)},{id:side+':h:'+i,a:mix(tl,bl,q),b:mix(tr,br,q)}]}).flat()})
}

/** Escala física comum às duas câmeras: campo de 105 m, atleta de referência
 * com 1,80 m e bola com 22 cm. A largura projetada varia com a profundidade. */
export function escalaNoGramado(corners:typeof CAMPO_INTERNO|typeof CAMPO_MAPA,y:number){
 const depth=Math.max(0,Math.min(1,y))
 const left={x:corners[0][0]+(corners[2][0]-corners[0][0])*depth,y:corners[0][1]+(corners[2][1]-corners[0][1])*depth}
 const right={x:corners[1][0]+(corners[3][0]-corners[1][0])*depth,y:corners[1][1]+(corners[3][1]-corners[1][1])*depth}
 const pixelsPerMeter=Math.hypot(right.x-left.x,right.y-left.y)/105
 // Aproximação da inclinação pela projeção dos 68 m de profundidade.
 // A altura vertical encurta na vista aérea; uma bola esférica não achata.
 const midWidth=(Math.hypot(corners[1][0]-corners[0][0],corners[1][1]-corners[0][1])+Math.hypot(corners[3][0]-corners[2][0],corners[3][1]-corners[2][1]))/2/105
 const depthPixels=Math.hypot((corners[2][0]+corners[3][0]-corners[0][0]-corners[1][0])/2,(corners[2][1]+corners[3][1]-corners[0][1]-corners[1][1])/2)/68
 const verticalProjection=Math.sqrt(Math.max(0,1-Math.min(1,depthPixels/midWidth)**2))
 return {athleteHeight:pixelsPerMeter*1.8*verticalProjection,ballDiameter:pixelsPerMeter*.22,verticalProjection,pixelsPerMeter}
}

/** Tamanho projetado da mesma amostra de material nas duas câmeras. */
export const larguraTexturaCampo=(corners:typeof CAMPO_INTERNO|typeof CAMPO_MAPA)=>140*escalaNoGramado(corners,.5).athleteHeight/escalaNoGramado(CAMPO_INTERNO,.5).athleteHeight
export const texturaCampoDetalhada=(corners:typeof CAMPO_INTERNO|typeof CAMPO_MAPA,displayPixels:number)=>displayPixels/1536*larguraTexturaCampo(corners)>256

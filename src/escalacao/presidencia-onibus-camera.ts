/** 🚌🎥 CÂMERA SEGUINDO OS ÔNIBUS DOS DOIS TIMES (04/11, só no mapa 3D da conta do Diego).
 * Regras PURAS (sem three.js). É cena de TEMPO MORTO: roda sozinha enquanto os ônibus chegam ao estádio no dia de jogo,
 * sem botão, sem passo e sem espera — o jogo não depende dela. Regras que não se mexem:
 *  · só começa com o mapa parado (ninguém mexeu nos últimos `CALMA_S`) e nunca durante o jogo/câmera do jogo;
 *  · QUALQUER toque (dedo, roda, tecla, botão de lugar) devolve a câmera NA HORA, e ela não volta mais naquela chegada;
 *  · não acorda a cidade: só mexe a câmera nos quadros que o mapa já ia desenhar (a cidade só anda depois de um toque);
 *  · acabou a chegada sem ninguém tocar → a câmera volta sozinha, suave, pra onde estava.
 * Ordem: o ônibus do mandante chegando → a porta dele (desembarque) → o do visitante chegando → a porta dele → volta. */

export type Vec3=readonly [number,number,number]
export type OnibusNoMapa={x:number;y:number;z:number;heading:number;visible:boolean}
export type Pose={camera:Vec3;target:Vec3}
/** fases que a chegada das equipes já publica (`vehiclePhases` em presidencia-cidade-equipes) */
const CHEGANDO=new Set(['arriving'])
const PARADO=new Set(['opening','alighting'])
const ACABOU=new Set(['closing','departing','gone'])
export const CALMA_S=3
export const VOLTA_S=1.6

/** Qual ônibus a câmera olha agora: o que está CHEGANDO (mandante primeiro), senão o que está desembarcando.
 * `espera` = um já terminou e o outro ainda não saiu (a câmera fica na baia); `fim` = os dois terminaram. */
export function focoDoOnibus(fases:readonly (string|undefined)[]):{lado:0|1;como:'chegando'|'porta'}|'espera'|'fim'|null{
 if(fases.length<2)return null
 for(const lado of [0,1] as const)if(CHEGANDO.has(fases[lado]??''))return {lado,como:'chegando'}
 for(const lado of [0,1] as const)if(PARADO.has(fases[lado]??''))return {lado,como:'porta'}
 if(fases.every(f=>ACABOU.has(f??'')))return 'fim'
 if(fases.some(f=>ACABOU.has(f??''))&&fases.some(f=>f==='waiting'))return 'espera'
 return null
}

/** Enquadramento de "câmera de perseguição": atrás e um pouco acima do ônibus, olhando pra frente dele.
 * O ônibus anda pra +z local (`heading` = rotation.y). Em pé (celular) recua mais pra caber o ônibus inteiro. */
export function enquadraOnibus(o:OnibusNoMapa,como:'chegando'|'porta',retrato:boolean):Pose{
 const fx=Math.sin(o.heading),fz=Math.cos(o.heading),lx=Math.cos(o.heading),lz=-Math.sin(o.heading)
 const k=retrato?1.35:1
 if(como==='chegando'){
  const atras=17*k,lado=5*k,alto=7.5*k
  return {camera:[o.x-fx*atras+lx*lado,o.y+alto,o.z-fz*atras+lz*lado],target:[o.x+fx*5,o.y+1.6,o.z+fz*5]}
 }
 // na porta: de lado, pra ver os jogadores descendo
 const lado=13*k,alto=5*k
 return {camera:[o.x+lx*lado+fx*4,o.y+alto,o.z+lz*lado+fz*4],target:[o.x,o.y+1.4,o.z]}
}

const mix=(a:Vec3,b:Vec3,u:number):Vec3=>[a[0]+(b[0]-a[0])*u,a[1]+(b[1]-a[1])*u,a[2]+(b[2]-a[2])*u]
const suave=(x:number)=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x)}

export type EntradaCameraOnibus={
 /** chave do dia (fixture): toque cancela só a chegada DESTE jogo */
 key:string
 /** tudo que precisa ser verdade pra cena poder rodar (dia de jogo em casa, sem jogo rolando, câmera livre, fora do escritório…) */
 permitido:boolean
 fases:readonly (string|undefined)[]
 onibus:readonly OnibusNoMapa[]
 /** a baia (onde o ônibus para): pra onde olhar entre um ônibus e outro */
 baia:Pose
 atual:Pose
 /** segundos (relógio da tela) */
 agora:number
 /** segundos desde o último toque do usuário no mapa */
 desdeToque:number
 retrato:boolean
}

export function criarCameraOnibus(){
 let key='',cancelado=false,seguindo=false,salvo:Pose|null=null,ultimo=-1
 let volta:{de:Pose;para:Pose;t0:number}|null=null,entrouEm=0
 let pose:Pose|null=null
 const reset=(k:string)=>{key=k;cancelado=false;seguindo=false;salvo=null;volta=null;pose=null;ultimo=-1}
 return {
  /** 👆 o usuário tocou: devolve a câmera na hora (fica onde está) e não retoma nesta chegada */
  tocou(){if(seguindo||volta)cancelado=true;seguindo=false;volta=null;pose=null},
  /** a pose que a câmera deve ter NESTE quadro, ou null (= não mexer na câmera) */
  quadro(e:EntradaCameraOnibus):Pose|null{
   if(e.key!==key)reset(e.key)
   const dt=ultimo<0?0:Math.max(0,Math.min(.25,e.agora-ultimo));ultimo=e.agora
   if(volta){
    const u=suave((e.agora-volta.t0)/VOLTA_S)
    const p={camera:mix(volta.de.camera,volta.para.camera,u),target:mix(volta.de.target,volta.para.target,u)}
    if(u>=1){volta=null;cancelado=true}
    return p
   }
   if(cancelado)return null
   const foco=e.permitido?focoDoOnibus(e.fases):null
   if(!seguindo){
    // só entra com o mapa quieto e com um ônibus de fato chegando (nunca no meio do jogo, nunca brigando com o dedo)
    if(!foco||foco==='fim'||foco==='espera'||foco.como!=='chegando'||e.desdeToque<CALMA_S)return null
    const o=e.onibus[foco.lado];if(!o?.visible)return null
    seguindo=true;entrouEm=e.agora;salvo={camera:[...e.atual.camera],target:[...e.atual.target]};pose={camera:[...e.atual.camera],target:[...e.atual.target]}
   }
   // a cena não pode mais rodar (jogo começou, abriu o escritório…) ou acabou: volta suave pra onde estava
   if(!foco||foco==='fim'){
    seguindo=false
    if(salvo&&pose){volta={de:pose,para:salvo,t0:e.agora};return pose}
    cancelado=true;return null
   }
   const alvo=foco==='espera'?e.baia:(()=>{const o=e.onibus[foco.lado];return o?enquadraOnibus(o,foco.como,e.retrato):e.baia})()
   // entrada: desce suave de onde a câmera estava até atrás do ônibus (VOLTA_S); depois acompanha com folga
   const u=(e.agora-entrouEm)/VOLTA_S
   if(u<1&&salvo){pose={camera:mix(salvo.camera,alvo.camera,suave(u)),target:mix(salvo.target,alvo.target,suave(u))};return pose}
   const k=1-Math.exp(-dt*4)
   pose=pose?{camera:mix(pose.camera,alvo.camera,k),target:mix(pose.target,alvo.target,Math.min(1,k*1.6))}:alvo
   return pose
  },
  inspect:()=>({key,cancelado,seguindo,voltando:!!volta,salvo,pose}),
 }
}
export type CameraOnibus=ReturnType<typeof criarCameraOnibus>

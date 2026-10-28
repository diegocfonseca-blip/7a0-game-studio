import {MathUtils,PerspectiveCamera,Vector3} from 'three'
export type AlvoCameraFutebol={mx:number;mz:number;visible?:boolean;presentation?:{x:number;z:number}}
export type BolaCameraFutebol={x:number;y:number;z:number;presentation?:{x:number;y:number;z:number}}
export type CameraFutebolPreset='broadcast'|'follow'|'tele'|'wide'|'goal'|'tactical'
const PRESETS={
 follow:{fov:50,elevation:.5,depth:.86,halfWidth:10,halfDepth:7,radius:18,count:6,minimum:24},
 broadcast:{fov:46,elevation:.64,depth:.77,halfWidth:12,halfDepth:7,radius:19,count:6,minimum:28},
 tele:{fov:36,elevation:.52,depth:.85,halfWidth:8,halfDepth:5,radius:13,count:4,minimum:25},
 wide:{fov:52,elevation:.78,depth:.63,halfWidth:20,halfDepth:12,radius:28,count:10,minimum:42},
 goal:{fov:48,elevation:.63,depth:.78,halfWidth:11,halfDepth:8,radius:19,count:6,minimum:32},
 tactical:{fov:48,elevation:.96,depth:.28,halfWidth:55,halfDepth:36,radius:120,count:22,minimum:90},
} as const
/** Metres only. Fits the ball and nearby action, never scales characters. */
export function enquadramentoFutebol(camera:PerspectiveCamera,ball:BolaCameraFutebol,subjects:readonly AlvoCameraFutebol[]=[],preset:CameraFutebolPreset|boolean=false,ataque:1|-1=1){
 // Boolean callers retain their existing lens; the named spectator presets
 // carry a lens of their own and cannot inherit an office/map zoom.
 const mode=typeof preset==='boolean'?(preset?'tactical':'broadcast'):preset,settings=PRESETS[mode],tactical=mode==='tactical'
 const fov=typeof preset==='boolean'?camera.fov:settings.fov
 ball=ball.presentation??ball;subjects=subjects.map(p=>p.presentation?{...p,mx:p.presentation.x,mz:p.presentation.z}:p)
 const portrait=camera.aspect<1,radius=settings.radius*(portrait?.68:1)
 const near=subjects.filter(p=>p.visible!==false&&Number.isFinite(p.mx)&&Number.isFinite(p.mz)&&Math.hypot(p.mx-ball.x,p.mz-ball.z)<radius).sort((a,b)=>Math.hypot(a.mx-ball.x,a.mz-ball.z)-Math.hypot(b.mx-ball.x,b.mz-ball.z)).slice(0,portrait?Math.ceil(settings.count/2):settings.count)
 const focusHeight=.6+MathUtils.clamp((ball.y-2)*.3,0,5)
 const target=tactical?new Vector3(0,.6,0):new Vector3(MathUtils.clamp(ball.x,-44,44),focusHeight,MathUtils.clamp(ball.z,-25,25))
 const halfWidth=settings.halfWidth*(portrait?.68:1),halfDepth=settings.halfDepth*(portrait?.82:1)

 // 📺 25/10 (Diego: "câmeras… quero futebol real, como PES/FIFA"): a TRANSMISSÃO é a câmera de TV de verdade — fica PARADA no alto
 // da arquibancada principal, no meio-campo (anda só um pouco junto do lance), e só GIRA e dá ZOOM atrás da bola. Antes ela voava em
 // cima do campo, a ~40° pra baixo, e os jogadores viravam formiguinhas. Mesmos metros: nunca aumenta boneco, só a lente fecha.
 if(typeof preset!=='boolean'&&(mode==='broadcast'||mode==='tele')){
  // (a LATERAL PRÓXIMA é a mesma câmera de TV, só que no anel de baixo, colada no campo: mais perto e mais fechada. Se o lance não cabe
  // nela — bola muito alta, no canto colado — ela sobe pra posição da TV principal naquele quadro)
  target.set(MathUtils.clamp(ball.x,-54,54),focusHeight,MathUtils.clamp(ball.z,-36,36)) // (a TV gira até a bandeirinha: mira na bola mesmo)
  const aspect=Math.max(.1,camera.aspect),maxTan=Math.tan(MathUtils.degToRad(38))
  const fitPts=[new Vector3(ball.x,ball.y,ball.z),...near.flatMap(p=>[new Vector3(p.mx,0,p.mz),new Vector3(p.mx,1.78,p.mz)])]
  const tenta=(tele:boolean)=>{
   // 📱 25/10 (Diego: "boa experiência com base nos jogadores… e no tamanho da imagem"): no CELULAR EM PÉ a tela é estreita — a TV
   // de verdade (a 70 m) deixava o boneco com 25 px. Em pé, a TV fica mais baixa e mais perto (anel do meio) e mostra ~13 m de
   // largura: boneco com ~40 px, 6–7 jogadores em volta da bola. Deitado continua a TV clássica
   // (📱 26/10, Diego: "as câmeras não tão legais… que dê pra ver bem o jogo": em pé a TV olhava de 18° e metade da tela era
   // arquibancada. Em pé ela sobe ~33° — a tela estreita se enche de CAMPO em volta da bola. Deitado continua igual)
   // (📺 28/10, Diego no mapa de verdade: "a câmera está longe e alta demais… os jogadores viram bonequinhos": no computador a TV
   // desce do anel de cima pro anel do meio — 46 m da lateral em vez de 76 — e a lateral próxima cola no gramado, a 30 m)
   const cam=tele?new Vector3(MathUtils.clamp(target.x*.9,-50,50),portrait?15:6.5,portrait?40:30):new Vector3(MathUtils.clamp(target.x*(portrait?.5:.4),portrait?-24:-20,portrait?24:20),portrait?31:15,portrait?50:46)
   const forward=target.clone().sub(cam).normalize(),right=new Vector3().crossVectors(forward,new Vector3(0,1,0)).normalize(),up=new Vector3().crossVectors(right,forward)
   const dist0=cam.distanceTo(target)
   // (o pedaço de campo que a TV mostra em volta da bola: ~34 m de largura deitado, ~22 m em pé; a lateral, bem menos)
   let tanH=(tele?(portrait?5:7):(portrait?6.5:13))/dist0,tanV=0
   for(const pt of fitPts){const rel=pt.clone().sub(cam),depth=Math.max(1,rel.dot(forward));tanH=Math.max(tanH,Math.abs(rel.dot(right))/depth/.82);tanV=Math.max(tanV,Math.abs(rel.dot(up))/depth/.78)}
   return{cam,dist0,need:Math.max(tanV,tanH/aspect)}
  }
  let r=tenta(mode==='tele');if(mode==='tele'&&r.need>maxTan)r=tenta(false)
  const tv=MathUtils.clamp(r.need,Math.tan(MathUtils.degToRad(5)),maxTan)
  return{position:r.cam,target,distance:r.dist0,direction:r.cam.clone().sub(target).normalize(),fov:MathUtils.radToDeg(2*Math.atan(tv)),subjects:near.length,tactical:false,preset:mode}
 }
  // 🎥 ACOMPANHAR O LANCE (26/10): a câmera vem ATRÁS da jogada, no sentido do ataque de quem tem a bola, um pouco acima — o campo
 // corre de baixo pra cima na tela (é a que mais encaixa no celular em pé). `ataque` = pra que lado (±X) o time com a bola ataca
 if(typeof preset!=='boolean'&&mode==='follow'){
  const dir=ataque,aspect=Math.max(.1,camera.aspect)
  target.set(MathUtils.clamp(ball.x+dir*(portrait?6:6),-50,50),focusHeight,MathUtils.clamp(ball.z,-32,32))
  const cam=new Vector3(MathUtils.clamp(target.x-dir*(portrait?19:24),-80,80),portrait?13:10,MathUtils.clamp(target.z*.8,-30,30))
  const forward=target.clone().sub(cam).normalize(),right=new Vector3().crossVectors(forward,new Vector3(0,1,0)).normalize(),up=new Vector3().crossVectors(right,forward)
  let tanH=(portrait?7:12)/cam.distanceTo(target),tanV=0
  for(const pt of [new Vector3(ball.x,ball.y,ball.z),...near.flatMap(p=>[new Vector3(p.mx,0,p.mz),new Vector3(p.mx,1.78,p.mz)])]){const rel=pt.clone().sub(cam),depth=Math.max(1,rel.dot(forward));tanH=Math.max(tanH,Math.abs(rel.dot(right))/depth/.85);tanV=Math.max(tanV,Math.abs(rel.dot(up))/depth/.8)}
  const tv=MathUtils.clamp(Math.max(tanV,tanH/aspect),Math.tan(MathUtils.degToRad(17)),Math.tan(MathUtils.degToRad(36)))
  return{position:cam,target,distance:cam.distanceTo(target),direction:cam.clone().sub(target).normalize(),fov:MathUtils.radToDeg(2*Math.atan(tv)),subjects:near.length,tactical:false,preset:mode}
 }
 const points=tactical?[-55,55].flatMap(x=>[-36,36].flatMap(z=>[0,2.5].map(y=>new Vector3(x,y,z)))):[
  new Vector3(ball.x-.2,ball.y-.1,ball.z),new Vector3(ball.x+.2,ball.y+.2,ball.z),
  ...near.flatMap(p=>[new Vector3(p.mx,0,p.mz),new Vector3(p.mx,1.78,p.mz)]),
  ...[-halfWidth,halfWidth].flatMap(x=>[-halfDepth,halfDepth].map(z=>new Vector3(target.x+x,0,target.z+z))),
 ]
 // 🥅 (25/10, filmado: com a bola no gol de −X a câmera 'Atrás do gol' ficava a 120 m, atrás do OUTRO gol, e o lance virava formiga)
 // a câmera fica atrás do gol da metade onde a bola está — troca de lado quando a bola cruza o meio, como um corte de TV
 const goalAnchor=mode==='goal'?new Vector3(ball.x>=0?72:-72,24,0):undefined
 const direction=goalAnchor?goalAnchor.clone().sub(target).normalize():new Vector3(0,settings.elevation,settings.depth).normalize()
 const right=new Vector3(direction.z,0,-direction.x).normalize(),up=new Vector3().crossVectors(direction,right)
 const tanV=Math.tan(MathUtils.degToRad(fov)/2),tanH=tanV*Math.max(.1,camera.aspect)
 let distance:number=goalAnchor?goalAnchor.distanceTo(target):settings.minimum
 // Solve the perspective bounds directly. This avoids binary-searching a
 // second camera for every frame, while retaining real 3D high-ball fitting.
 for(const point of points){const relative=point.clone().sub(target),depth=relative.dot(direction)
  distance=Math.max(distance,depth+Math.abs(relative.dot(right))/(tanH*.8),depth+Math.abs(relative.dot(up))/(tanV*.7),depth+camera.near*2)
 }
 distance=Math.min(distance,Math.min(900,camera.far*.85))
 const position=target.clone().addScaledVector(direction,distance)
 return{position,target,distance,direction,fov,subjects:near.length,tactical,preset:mode}
}

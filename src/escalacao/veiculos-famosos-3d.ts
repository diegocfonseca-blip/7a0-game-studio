import * as T from 'three'
import type {PerfilVeiculo} from './veiculos-modelos'

/** 🚗 04/11 (Diego: *"não parecem com os veículos reais… só precisa ser mais parecido"*, e *"não quero foto"*).
 * Os 6 carros do pátio da Vadico ganham modelagem própria, medida na silhueta do carro real: casco por SEÇÕES
 * (como um loft de prancheta: cada seção é um retângulo arredondado com a largura, a altura e o caimento daquele
 * ponto do carro), pintura por face (vidro, coluna, saia-e-blusa) e as peças que fazem o carro ser ele mesmo
 * (para-lama do Fusca, "V" da Kombi, faixas do Opala SS, aerofólio da F40…). Rodas continuam separadas, girando.
 * Tudo é geometria colorida no MESMO material dos outros carros: sem textura, sem download, sem luz nova. */

type V2=[number,number];type V3=[number,number,number]
type Pintura=(c:V3,n:V3)=>string
type Add=(g:T.BufferGeometry,c:string,x?:number,y?:number,z?:number,rx?:number,ry?:number,rz?:number,wheel?:boolean)=>void
/** Seção do casco: z (frente +), meia-largura embaixo (w) e no alto (wt), base y0, topo y1, raio dos cantos de baixo/cima, abaulado do teto. */
type Secao={z:number;w:number;wt?:number;y0:number;y1:number;rb?:number;rt?:number;crown?:number}
type OpLoft={step?:number;denso?:[number,number][];suave?:boolean;cortes?:number[];lado?:number[];arco?:number;topo?:number;base?:number;fundo?:(z:number)=>number;tampa?:boolean;x0?:number;cor:Pintura;liso?:boolean}

const CROMO='#c8cfd0',PRETO='#1c2022',BORRACHA='#1f2122',VIDRO='#29404a',FAROL='#f4efd8',LANTERNA='#b3241d',SETA='#e48a2a',BRANCO='#f1eee4'

export function construirFamoso(p:PerfilVeiculo,parts:T.BufferGeometry[],add:Add):boolean{
 const f=FAMOSOS[p.id];if(!f)return false
 const k=kit(parts,add);f(p,k);return true
}

function kit(parts:T.BufferGeometry[],add:Add){
 const cor=(c:string)=>new T.Color(c)
 /** Superfície em grade (linhas × colunas), com normais suaves e cor decidida face a face. */
 function malha(rows:V3[][],fechado:boolean,pinta:Pintura,liso=true){
  const nu=rows[0].length,nv=rows.length,pos=new Float32Array(nu*nv*3);rows.forEach((r,v)=>r.forEach((q,u)=>pos.set(q,(v*nu+u)*3)))
  const idx:number[]=[],uMax=fechado?nu:nu-1
  for(let v=0;v<nv-1;v++)for(let u=0;u<uMax;u++){const a=v*nu+u,b=v*nu+(u+1)%nu,c=(v+1)*nu+(u+1)%nu,d=(v+1)*nu+u;idx.push(a,b,c,a,c,d)}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(pos,3));g.setIndex(idx);if(liso)g.computeVertexNormals()
  const n=g.toNonIndexed();g.dispose();if(!liso)n.computeVertexNormals()
  const P=n.getAttribute('position'),cols=new Float32Array(P.count*3),A=new T.Vector3(),B=new T.Vector3(),C=new T.Vector3()
  // A cor é decidida por QUADRADO (os 2 triângulos juntos): borda de vidro/pintura sai reta, sem dente de serra.
  const D=new T.Vector3()
  for(let i=0;i<P.count;i+=6){A.fromBufferAttribute(P,i);B.fromBufferAttribute(P,i+1);C.fromBufferAttribute(P,i+2);D.fromBufferAttribute(P,i+5)
   const ce:V3=[(A.x+B.x+C.x+D.x)/4,(A.y+B.y+C.y+D.y)/4,(A.z+B.z+C.z+D.z)/4],nn=B.clone().sub(A).cross(C.clone().sub(A)).add(C.clone().sub(A).cross(D.clone().sub(A))),l=nn.length()||1,co=cor(pinta(ce,[nn.x/l,nn.y/l,nn.z/l]))
   for(let k=0;k<6;k++){cols[(i+k)*3]=co.r;cols[(i+k)*3+1]=co.g;cols[(i+k)*3+2]=co.b}}
  n.setAttribute('color',new T.BufferAttribute(cols,3));n.setAttribute('uv',new T.BufferAttribute(new Float32Array(P.count*2),2));parts.push(n)
 }
 /** Anel da seção: retângulo arredondado (trapézio, por causa do caimento das laterais), anti-horário visto de frente. */
 function anel(s:Required<Secao>,o:{arco:number;topo:number;base:number;lado:number[]}):V2[]{
  const h=Math.max(.004,s.y1-s.y0),rb=Math.max(0,Math.min(s.rb,h*.45,s.w*.9)),rt=Math.max(0,Math.min(s.rt,h*.55-rb*.0,s.wt*.95,h-rb)),half:V2[]=[],bx=s.w-rb
  for(let i=0;i<o.base;i++)half.push([bx*i/o.base,s.y0])
  for(let i=0;i<o.arco;i++){const a=-Math.PI/2+i/o.arco*Math.PI/2;half.push([bx+Math.cos(a)*rb,s.y0+rb+Math.sin(a)*rb])}
  const sa:V2=[s.w,s.y0+rb],sb:V2=[s.wt,s.y1-rt];for(const f of[0,...o.lado])half.push([sa[0]+(sb[0]-sa[0])*f,sa[1]+(sb[1]-sa[1])*f])
  for(let i=0;i<o.topo;i++){const a=i/o.topo*Math.PI/2;half.push([s.wt-rt+Math.cos(a)*rt,s.y1-rt+Math.sin(a)*rt])}
  const tx=Math.max(1e-3,s.wt-rt),nt=Math.max(2,o.topo-1);for(let i=0;i<nt;i++){const x=tx*(1-i/nt);half.push([x,s.y1+s.crown*(1-(x/tx)**2)])}
  half.push([0,s.y1+s.crown]);const ring=[...half];for(let i=half.length-2;i>=1;i--)ring.push([-half[i][0],half[i][1]]);return ring
 }
 const completa=(s:Secao):Required<Secao>=>({wt:s.w,rb:.05,rt:.05,crown:0,...s}) as Required<Secao>
 const CAMPOS=['w','wt','y0','y1','rb','rt','crown'] as const
 /** Casco por seções (loft): interpola as seções ao longo de z (reta ou curva suave) e fecha as pontas. */
 function casco(secs:Secao[],o:OpLoft){
  const S=secs.map(completa).sort((a,b)=>a.z-b.z),step=o.step??.07,ro={arco:o.arco??2,topo:o.topo??3,base:o.base??1,lado:o.lado??[.25,.5,.75]},x0=o.x0??0
  // Curva suave: amostra em passo fixo. Reta: só as seções + as faixas densas (arco de roda, para-brisa) + os cortes de cor.
  const zs=new Set<number>();for(let i=0;i<S.length-1;i++){const a=S[i].z,b=S[i+1].z,n=o.suave?Math.max(1,Math.ceil((b-a)/step)):1;for(let k=0;k<n;k++)zs.add(+(a+(b-a)*k/n).toFixed(4))}
  for(const[a,b]of o.denso??[]){const n=Math.max(1,Math.ceil((b-a)/(o.suave?step:.07)));for(let k=0;k<=n;k++)zs.add(+(a+(b-a)*k/n).toFixed(4))}
  zs.add(S[S.length-1].z);for(const z of o.cortes??[])zs.add(z);for(const z of[...zs])if(z<S[0].z||z>S[S.length-1].z)zs.delete(z)
  const rows:V3[][]=[];for(const z of[...zs].sort((a,b)=>a-b)){let i=0;while(i<S.length-2&&z>S[i+1].z)i++;const a=S[i],b=S[i+1],t=(z-a.z)/((b.z-a.z)||1),s:Required<Secao>={...a,z}
   for(const c of CAMPOS){if(o.suave){const p0=S[Math.max(0,i-1)][c],p1=a[c],p2=b[c],p3=S[Math.min(S.length-1,i+2)][c];s[c]=.5*((2*p1)+(-p0+p2)*t+(2*p0-5*p1+4*p2-p3)*t*t+(-p0+3*p1-3*p2+p3)*t*t*t)}else s[c]=a[c]+(b[c]-a[c])*t}
   if(o.fundo)s.y0=Math.max(s.y0,o.fundo(z));if(s.y1<s.y0+.004)s.y1=s.y0+.004
   rows.push(anel(s,ro).map(([x,y])=>[x+x0,y,z]))}
  malha(rows,true,o.cor,o.liso??true)
  if(o.tampa!==false)for(const[k,frente]of[[rows.length-1,true],[0,false]]as const){const r=rows[k],c=r.reduce((m,q)=>[m[0]+q[0]/r.length,m[1]+q[1]/r.length,m[2]],[0,0,r[0][2]] as V3),lv=[1,0].map(s=>r.map(q=>[c[0]+(q[0]-c[0])*s,c[1]+(q[1]-c[1])*s,q[2]] as V3));malha(frente?lv:lv.reverse(),true,o.cor,false)}
 }
 /** Polígono plano (leque a partir do 1º ponto), virado pro lado `fora`. */
 function placa(pts:V3[],c:string,fora:V3){const pos:number[]=[];const n=new T.Vector3(...pts[1]).sub(new T.Vector3(...pts[0])).cross(new T.Vector3(...pts[2]).sub(new T.Vector3(...pts[0])));const inv=n.dot(new T.Vector3(...fora))<0
  for(let i=1;i<pts.length-1;i++){const tri=[pts[0],pts[i],pts[i+1]];if(inv)tri.reverse();for(const q of tri)pos.push(...q)}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.computeVertexNormals();add(g,c)}
 const caixa=(c:string,w:number,h:number,d:number,x:number,y:number,z:number,rx=0,ry=0,rz=0)=>add(new T.BoxGeometry(w,h,d),c,x,y,z,rx,ry,rz)
 const bola=(c:string,w:number,h:number,d:number,x:number,y:number,z:number,seg=12)=>{const g=new T.SphereGeometry(1,Math.min(seg,10),Math.max(5,seg/2|0));g.scale(w/2,h/2,d/2);add(g,c,x,y,z)}
 /** Cilindro entre dois pontos. */
 function tubo(c:string,a:V3,b:V3,r:number,seg=10,r2=r){const va=new T.Vector3(...a),vb=new T.Vector3(...b),v=vb.clone().sub(va),g=new T.CylinderGeometry(r2,r,v.length(),seg);g.applyQuaternion(new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),v.normalize()));const m=va.add(vb).multiplyScalar(.5);add(g,c,m.x,m.y,m.z)}
 /** Disco/lente redonda virada pra frente (+1) ou pra trás (−1). */
 const lente=(c:string,r:number,x:number,y:number,z:number,lado=1,esp=.03)=>tubo(c,[x,y,z],[x,y,z+lado*esp],r,12)
 const aro=(c:string,r:number,x:number,y:number,z:number,lado=1,grosso=.016)=>{const g=new T.TorusGeometry(r,grosso,4,14);add(g,c,x,y,z+lado*.012)}
 /** Fita fina (faixa, friso, adesivo) de a até b, com largura e espessura, deitada no plano indicado pela normal. */
 function fita(c:string,a:V3,b:V3,larg:number,normal:V3,esp=.008){const va=new T.Vector3(...a),vb=new T.Vector3(...b),d=vb.clone().sub(va),L=d.length(),nz=new T.Vector3(...normal).normalize(),x=d.clone().normalize(),y=nz.clone().cross(x).normalize(),m=new T.Matrix4().makeBasis(x,y,nz)
  const g=new T.BoxGeometry(L,larg,esp);g.applyMatrix4(m);const mid=va.add(vb).multiplyScalar(.5);add(g,c,mid.x,mid.y,mid.z)}
 /** Letreiro em blocos (fonte 3×5) sobre um plano: origem, direção do texto e "pra cima". */
 function letreiro(txt:string,c:string,o:V3,dir:V3,up:V3,px:number,esp=.01){const F:Record<string,string[]>={G:['111','100','101','101','111'],T:['111','010','010','010','010'],I:['1','1','1','1','1'],S:['111','100','111','001','111']}
  const D=new T.Vector3(...dir).normalize(),U=new T.Vector3(...up).normalize(),N=D.clone().cross(U),m=new T.Matrix4().makeBasis(D,U,N);let cx=0
  for(const ch of txt){const L=F[ch];if(!L){cx+=2;continue}L.forEach((row,ry)=>[...row].forEach((b,rx)=>{if(b!=='1')return;const g=new T.BoxGeometry(px*1.02,px*1.02,esp);g.translate((cx+rx+.5)*px,(4-ry+.5)*px,0);g.applyMatrix4(m);add(g,c,...o)}));cx+=L[0].length+1}}
 /** Roda: pneu + aro + o desenho típico do carro (calota, liga, esportiva, estrela), dos dois lados. */
 function roda(r:number,larg:number,estilo:'calota'|'liga'|'esportiva'|'estrela',corAro:string){
  const W=(g:T.BufferGeometry,c:string,x=0,rx=0)=>add(g,c,x,0,0,rx,0,0,true)
  const pneu=new T.CylinderGeometry(r,r,larg,18,1,true);pneu.rotateZ(Math.PI/2);W(pneu,BORRACHA)
  for(const s of[-1,1]){const x=s*(larg/2)
   // disco de uma face só, virado pra fora (o lado de dentro nunca aparece)
   const disco=(rr:number,c:string,dx:number,seg=16)=>{const g=new T.CircleGeometry(rr,seg);g.rotateY(s*Math.PI/2);W(g,c,x+s*dx)}
   disco(r,BORRACHA,-.001,18)
   if(estilo==='calota'){disco(r*.66,corAro,.004);const cal=new T.SphereGeometry(r*.44,12,3,0,Math.PI*2,0,Math.PI/2);cal.scale(1,.32,1);cal.rotateZ(-s*Math.PI/2);W(cal,CROMO,x+s*.01);disco(r*.12,'#8d969a',.05,10)}
   else if(estilo==='liga'){disco(r*.66,corAro,.004,20);for(let i=0;i<4;i++){const a=i*Math.PI/2+Math.PI/4,g=new T.CylinderGeometry(r*.13,r*.13,.016,10);g.rotateZ(Math.PI/2);g.translate(0,Math.cos(a)*r*.38,Math.sin(a)*r*.38);W(g,'#4c5356',x+s*.008)}disco(r*.14,'#2a2f31',.012,10);disco(r*.08,CROMO,.016,8)}
   else if(estilo==='esportiva'){disco(r*.66,corAro,.004,20);const tr=new T.TorusGeometry(r*.64,.016,3,18);tr.rotateY(Math.PI/2);W(tr,CROMO,x+s*.008);for(let i=0;i<6;i++){const g=new T.BoxGeometry(.016,r*.22,r*.1);g.translate(0,r*.4,0);g.rotateX(i*Math.PI/3);W(g,'#151819',x+s*.006)}disco(r*.16,CROMO,.012,12)}
   else{disco(r*.7,'#141617',.002,20);for(let i=0;i<5;i++){const g=new T.BoxGeometry(.03,r*.58,r*.14);g.translate(0,r*.34,0);g.rotateX(i*Math.PI*2/5);W(g,corAro,x+s*.01)}const tr=new T.TorusGeometry(r*.66,.014,3,18);tr.rotateY(Math.PI/2);W(tr,corAro,x+s*.008);disco(r*.11,'#d8b23a',.03,6)}
  }
 }
 /** Para-choque cromado de lâmina com as pontas dobrando pra trás. */
 function lamina(c:string,z:number,y:number,meia:number,alt:number,lado:1|-1,dobra=.16,prof=.06){caixa(c,meia*2-.08,alt,prof,0,y,z);for(const s of[-1,1]){const g=new T.BoxGeometry(prof,alt,dobra);add(g,c,s*(meia-.04),y,z-lado*dobra/2+lado*prof/2,0,s*lado*.35,0)}}
 /** Arco de roda: o fundo do casco sobe em semicírculo sobre cada eixo. */
 const zonas=(eixos:number[],r:number):[number,number][]=>eixos.map(e=>[e-r-.01,e+r+.01])
 const arcos=(eixos:number[],r:number,cy:number)=>(z:number)=>Math.max(0,...eixos.map(e=>Math.abs(z-e)<r?cy+Math.sqrt(r*r-(z-e)**2):0))
 return{malha,casco,placa,caixa,bola,tubo,lente,aro,fita,letreiro,roda,lamina,arcos,zonas}
}
type Kit=ReturnType<typeof kit>

/** Pintura padrão: fundo escuro (vão de roda / assoalho), resto da cor dada. */
const comFundo=(c:string,resto:Pintura=()=>c):Pintura=>(q,n)=>n[1]<-.55?PRETO:resto(q,n)
const entre=(v:number,a:number,b:number)=>v>a&&v<b

const FAMOSOS:Record<string,(p:PerfilVeiculo,k:Kit)=>void>={
 // ── FUSCA: corpo em bolha, para-lamas soltos, faróis redondos em cima dos para-lamas, estribo, vidro traseiro pequeno.
 fusca(p,k){
  const pt=p.color,eb=p.wheelbase/2
  k.roda(p.radius,.16,'calota','#d9dcd6')
  k.casco([
   {z:1.90,w:.36,wt:.26,y0:.44,y1:.58,rb:.08,rt:.12},{z:1.82,w:.48,wt:.40,y0:.38,y1:.68,rb:.12,rt:.2},{z:1.55,w:.55,wt:.47,y0:.36,y1:.78,rb:.16,rt:.24},
   {z:1.15,w:.6,wt:.52,y0:.36,y1:.86,rb:.18,rt:.27},{z:.8,w:.68,wt:.6,y0:.36,y1:.95,rb:.22,rt:.32},{z:.6,w:.7,wt:.6,y0:.36,y1:1.24,rb:.24,rt:.38},
   {z:.42,w:.71,wt:.61,y0:.36,y1:1.42,rb:.24,rt:.42},{z:.1,w:.71,wt:.62,y0:.36,y1:1.5,rb:.24,rt:.44},{z:-.4,w:.71,wt:.62,y0:.36,y1:1.48,rb:.24,rt:.44},
   {z:-.85,w:.7,wt:.6,y0:.36,y1:1.36,rb:.24,rt:.44},{z:-1.2,w:.68,wt:.56,y0:.36,y1:1.17,rb:.24,rt:.4},{z:-1.5,w:.64,wt:.52,y0:.37,y1:.98,rb:.22,rt:.34},
   {z:-1.8,w:.58,wt:.46,y0:.39,y1:.8,rb:.18,rt:.28},{z:-2.02,w:.48,wt:.36,y0:.42,y1:.63,rb:.12,rt:.18},{z:-2.11,w:.34,wt:.24,y0:.47,y1:.55,rb:.05,rt:.08},
  ],{suave:true,step:.13,topo:5,arco:2,lado:[.33,.66],cortes:[.46,.78,-.12,-.02,-.9,-.94,-1.24],cor:comFundo(pt,([x,y,z],n)=>{
   const ax=Math.abs(x)
   if(entre(z,.47,.8)&&y>1.0&&ax<.5&&n[2]>.2)return VIDRO // para-brisa
   if(y>1.0&&y<1.37&&entre(z,-.9,.44)&&ax>.4&&!entre(z,-.12,-.02))return VIDRO // janelas laterais (porta + quebra-vento traseiro)
   if(entre(z,-1.24,-.94)&&entre(y,1.06,1.33)&&ax<.34&&n[2]<-.15)return VIDRO // vigia traseira pequena
   return pt})})
  // Para-lamas soltos (a cara do Fusca) — dianteiros com o farol redondo em cima, traseiros com a lanterna.
  for(const s of[-1,1]){
   k.casco([{z:1.94,w:.12,wt:.08,y0:.42,y1:.54,rb:.04,rt:.06},{z:1.8,w:.15,wt:.11,y0:.38,y1:.7,rb:.05,rt:.1},{z:1.55,w:.165,wt:.12,y0:.36,y1:.77,rt:.12},{z:1.2,w:.17,wt:.12,y0:.36,y1:.8,rt:.13},{z:.9,w:.16,wt:.11,y0:.36,y1:.72,rt:.12},{z:.72,w:.14,wt:.09,y0:.35,y1:.54,rt:.1},{z:.6,w:.1,wt:.06,y0:.34,y1:.4,rt:.03,rb:.02}],
    {x0:s*.62,suave:true,step:.12,topo:3,lado:[.5],fundo:k.arcos([eb],.39,.3),cor:comFundo(pt)})
   k.casco([{z:-.62,w:.1,wt:.06,y0:.34,y1:.4,rt:.03,rb:.02},{z:-.78,w:.15,wt:.1,y0:.35,y1:.6,rt:.1},{z:-1.0,w:.175,wt:.12,y0:.36,y1:.78,rt:.13},{z:-1.25,w:.18,wt:.13,y0:.36,y1:.84,rt:.14},{z:-1.6,w:.175,wt:.12,y0:.38,y1:.8,rt:.13},{z:-1.88,w:.15,wt:.1,y0:.42,y1:.68,rt:.1},{z:-2.02,w:.1,wt:.06,y0:.47,y1:.56,rt:.04}],
    {x0:s*.63,suave:true,step:.12,topo:3,lado:[.5],fundo:k.arcos([-eb],.4,.3),cor:comFundo(pt)})
   // farol redondo de Fusca: copo cromado + lente
   k.tubo(pt,[s*.62,.66,1.6],[s*.62,.67,1.78],.1,16,.11);k.aro(CROMO,.1,s*.62,.67,1.77,1,.014);k.lente(FAROL,.092,s*.62,.67,1.77,1,.02)
   k.lente(SETA,.03,s*.5,.8,1.18,1,.02) // pisca em cima do para-lama
   k.bola(LANTERNA,.1,.16,.08,s*.64,.74,-1.86,10) // lanterna traseira "fafá"
   k.caixa(PRETO,.18,.04,1.25,s*.66,.355,0) // estribo de borracha
   k.caixa(CROMO,.012,.012,1.2,s*.755,.37,0)
   k.caixa(CROMO,.03,.025,.11,s*.705,.93,-.05) // maçaneta
   k.tubo(CROMO,[s*.66,1.02,.36],[s*.78,1.1,.36],.012);k.bola(CROMO,.05,.08,.1,s*.79,1.12,.36,8) // retrovisor
   k.tubo(CROMO,[s*.4,.42,2.0],[s*.4,.6,2.0],.024) // garra do para-choque
   k.tubo(CROMO,[s*.4,.42,-2.2],[s*.4,.6,-2.2],.024)
  }
  k.lamina(CROMO,1.98,.44,.72,.08,1,.18);k.lamina(CROMO,-2.19,.44,.72,.08,-1,.18)
  // capô: friso cromado e o VW redondo na ponta
  k.fita(CROMO,[0,.775,1.55],[0,.62,1.86],.03,[0,1,.4]);k.aro(CROMO,.07,0,.6,1.86,1,.012)
  // tampa do motor com as grelhas de ventilação
  for(let i=0;i<5;i++)k.fita(PRETO,[-.17,1.0-i*.03,-1.49-i*.05],[.17,1.0-i*.03,-1.49-i*.05],.018,[0,.6,-.8])
  k.caixa(BRANCO,.32,.1,.02,0,.62,-2.08) // placa
 },
 // ── BRASÍLIA: perua 2 portas compacta, traseira reta e alta, faróis retangulares, grade baixa, vidrão, cintura reta.
 brasilia(p,k){
  const pt=p.color,eb=p.wheelbase/2,F=1.92,R=-2.09
  k.roda(p.radius,.17,'calota','#c9ccc6')
  k.casco([{z:R,w:.74,wt:.73,y0:.37,y1:.85,rb:.05,rt:.04},{z:R+.04,w:.79,wt:.78,y0:.31,y1:.9,rb:.06,rt:.05},{z:1.0,w:.8,wt:.79,y0:.3,y1:.88,rb:.06,rt:.06},{z:F-.04,w:.79,wt:.78,y0:.3,y1:.83,rb:.06,rt:.06},{z:F,w:.75,wt:.74,y0:.34,y1:.8,rb:.05,rt:.05}],
   {denso:k.zonas([eb,-eb],.39),lado:[.4,.75,.9],fundo:k.arcos([eb,-eb],.39,.3),cor:comFundo(pt)})
  const aPil=(y:number)=>1.05-(y-.88)/(1.43-.88)*.62
  k.casco([{z:1.06,w:.77,wt:.76,y0:.86,y1:.89,rt:.02},{z:.42,w:.76,wt:.66,y0:.86,y1:1.43,rt:.09},{z:-1.84,w:.76,wt:.66,y0:.86,y1:1.42,rt:.09},{z:-2.02,w:.76,wt:.67,y0:.86,y1:.92,rt:.04}],
   {denso:[[.42,1.06]],topo:3,lado:[.1,.5,.9],cortes:[-.2,-.1,-1.72,-1.0,-.95,-1.76],cor:([x,y,z],n)=>{
    const ax=Math.abs(x),hw=.76-(y-.86)/.57*.1
    if(n[1]>.8)return pt // teto
    if(n[2]>.3)return ax<hw-.07&&y<1.39?VIDRO:pt // para-brisa com moldura
    if(n[2]<-.3)return ax<hw-.08&&y>.95&&y<1.37?VIDRO:pt // vidro traseiro reto
    if(y<.92||y>1.37)return pt
    if(z>aPil(y)-.08||entre(z,-.2,-.1)||z<-1.76||entre(z,-1.0,-.95))return pt // colunas A, B, D e divisão
    return VIDRO}})
  for(const s of[-1,1]){
   // frente: farol RETANGULAR com moldura preta, pisca embaixo
   k.caixa(PRETO,.33,.19,.03,s*.53,.64,F+.005);k.caixa(FAROL,.27,.13,.02,s*.53,.64,F+.02);k.caixa(CROMO,.3,.012,.022,s*.53,.715,F+.018)
   k.caixa(SETA,.12,.06,.02,s*.6,.5,F+.02)
   // traseira: lanterna retangular vermelha + âmbar
   k.caixa(LANTERNA,.2,.16,.02,s*.62,.69,R-.01);k.caixa(SETA,.2,.05,.02,s*.62,.585,R-.01)
   // friso cromado da cintura e maçaneta, retrovisor, vinco da porta
   k.caixa(CROMO,.012,.016,3.7,s*.795,.87,-.08);k.caixa(CROMO,.03,.025,.12,s*.802,.8,-.02)
   k.caixa(PRETO,.012,.5,.012,s*.802,.62,-.1);k.caixa(PRETO,.012,.5,.012,s*.802,.62,1.02)
   k.tubo(PRETO,[s*.77,.93,.92],[s*.86,.98,.9],.012);k.caixa(PRETO,.1,.07,.03,s*.88,1.0,.9)
  }
  // grade baixa e VW no meio da frente
  k.caixa(PRETO,.9,.07,.02,0,.4,F+.01);for(let i=-3;i<=3;i++)k.caixa('#3a4043',.012,.06,.025,i*.12,.4,F+.015)
  k.aro(CROMO,.06,0,.64,F,1,.011);k.caixa(PRETO,.5,.02,.02,0,.73,F+.005)
  k.lamina(CROMO,F+.06,.45,.8,.09,1,.14);k.lamina(CROMO,R-.06,.45,.8,.09,-1,.14)
  // traseira: grelha do motor e placa
  for(let i=0;i<4;i++)k.caixa(PRETO,.6,.014,.02,0,.76+i*.03,R-.008)
  k.caixa(BRANCO,.34,.11,.02,0,.6,R-.01)
 },
 // ── GOL GTI quadrado: hatch pequeno e quadradão, frente reta, faróis retangulares, grade fina, para-choque preto envolvente, faixa e rodas de liga.
 'gol-gti'(p,k){
  const pt=p.color,eb=p.wheelbase/2,F=1.96,R=-1.85
  k.roda(p.radius,.19,'liga','#c4c8ca')
  k.casco([{z:R,w:.75,wt:.74,y0:.4,y1:.88,rb:.05,rt:.04},{z:R+.04,w:.79,wt:.78,y0:.31,y1:.93,rb:.05,rt:.05},{z:.95,w:.8,wt:.79,y0:.3,y1:.9,rb:.05,rt:.06},{z:F-.08,w:.79,wt:.78,y0:.3,y1:.8,rb:.05,rt:.06},{z:F,w:.75,wt:.73,y0:.36,y1:.76,rb:.05,rt:.06}],
   {denso:k.zonas([eb,-eb],.37),lado:[.25,.5,.75],fundo:k.arcos([eb,-eb],.37,.29),cor:comFundo(pt)})
  const aPil=(y:number)=>.98-(y-.9)/(1.36-.9)*.68
  k.casco([{z:.98,w:.77,wt:.76,y0:.88,y1:.91,rt:.02},{z:.3,w:.75,wt:.64,y0:.88,y1:1.36,rt:.08},{z:-1.26,w:.75,wt:.64,y0:.88,y1:1.35,rt:.08},{z:-1.78,w:.75,wt:.68,y0:.88,y1:.97,rt:.04}],
   {denso:[[.3,.98]],lado:[.1,.5,.9],cortes:[-.36,-.28,-.98],cor:([x,y,z],n)=>{
    const ax=Math.abs(x),hw=.76-(y-.88)/.48*.11
    if(n[1]>.85)return pt
    if(n[2]>.3)return ax<hw-.07&&y<1.32?VIDRO:pt
    if(n[2]<-.3)return ax<hw-.09&&y>.98&&y<1.3?VIDRO:pt
    if(y<.94||y>1.31)return pt
    if(z>aPil(y)-.07)return pt
    if(entre(z,-.36,-.28))return PRETO // coluna B preta
    if(z<-.98)return pt // coluna C larga, a marca do Gol quadrado
    return VIDRO}})
  // frente: dois faróis retangulares, grade fina com friso vermelho e VW, para-choque preto envolvente com faróis de milha
  for(const s of[-1,1]){
   k.caixa(PRETO,.36,.17,.02,s*.54,.62,F+.002);k.caixa(FAROL,.31,.12,.02,s*.54,.62,F+.012);k.caixa(SETA,.07,.12,.02,s*.73,.62,F-.01)
   k.caixa(FAROL,.12,.06,.02,s*.44,.43,F+.075) // milha no para-choque
   k.caixa(LANTERNA,.3,.15,.02,s*.55,.73,R-.008);k.caixa(SETA,.1,.15,.021,s*.36,.73,R-.009);k.caixa(BRANCO,.06,.15,.022,s*.27,.73,R-.01) // lanternas largas
   // faixa preta lateral (moldura de proteção) + friso vermelho e adesivo GTI
   k.caixa(PRETO,.02,.13,1.6,s*.8,.5,0);k.caixa('#e23b2f',.022,.014,1.6,s*.802,.575,0)
   k.letreiro('GTI',BRANCO,[s*.812,.455,s>0?-.12:.12],[0,0,-s],[0,1,0],.022)
   k.tubo(PRETO,[s*.77,.93,.85],[s*.87,.98,.83],.014);k.caixa(PRETO,.11,.08,.04,s*.89,1.0,.83)
   k.caixa(PRETO,.014,.03,.11,s*.802,.82,-.2)
  }
  k.caixa(PRETO,.6,.13,.02,0,.62,F+.002);for(let i=0;i<4;i++)k.caixa('#3d4447',.58,.01,.022,0,.57+i*.03,F+.006)
  k.caixa('#e23b2f',.58,.014,.024,0,.555,F+.008);k.aro(CROMO,.05,0,.63,F+.004,1,.01)
  k.caixa(PRETO,1.62,.2,.16,0,.44,F+.02);k.caixa(PRETO,1.4,.06,.08,0,.32,F+.06) // para-choque + defletor
  k.caixa(PRETO,1.62,.2,.14,0,.45,R-.02);k.caixa(BRANCO,.34,.11,.02,0,.48,R-.095)
  k.letreiro('GTI','#c9cdd0',[-.42,.83,R-.012],[-1,0,0],[0,1,0],.016)
  k.caixa(PRETO,1.3,.025,.16,0,1.318,-1.36,.32) // aerofólio pequeno em cima do vidro
 },
 // ── KOMBI: caixote de cantos redondos, frente com o VW grande e o "V" saia-e-blusa, para-brisa dividido, faróis redondos, janelas em fila.
 kombi(p,k){
  const pt=p.color,eb=p.wheelbase/2,teto=p.roof??BRANCO,F=2.2,R=-2.3
  k.roda(p.radius,.18,'calota',BRANCO)
  // Saia-e-blusa de verdade: casco de baixo (cor) e casco de cima (branco) se encontram numa linha reta na cintura.
  const cinta=1.1,plan:[number,number,number][]=[[R,.66,.08],[R+.05,.8,.1],[R+.16,.85,.1],[F-.18,.86,.1],[F-.08,.82,.1],[F-.02,.72,.09],[F,.64,.08]]
  const janela=(z:number)=>entre(z,1.38,1.94)||entre(z,.62,1.18)||entre(z,-.18,.42)||entre(z,-.98,-.38)||entre(z,-1.72,-1.18)
  k.casco(plan.map(([z,w,rb],j)=>({z,w,wt:w,y0:j===0?.44:j===1?.36:.33,y1:cinta,rb,rt:0})),{denso:k.zonas([eb,-eb],.42),lado:[.5],fundo:k.arcos([eb,-eb],.42,.33),cor:comFundo(pt)})
  k.casco(plan.map(([z,w],j)=>({z,w,wt:w-.04,y0:cinta,y1:j===0?1.8:j===1?1.9:j>=5?1.93-(j-5)*.02:1.96,rb:0,rt:j===0?.2:j===1?.26:.3})),
   {lado:[.18,.93],topo:4,arco:1,cortes:[1.38,1.94,1.18,.62,.42,-.18,-.38,-.98,-1.18,-1.72],cor:([,y,z],n)=>y>1.2&&y<1.62&&Math.abs(n[0])>.6&&janela(z)?VIDRO:teto})
  // frente: o "V" branco descendo até o VW, para-brisa dividido, faróis e os dois piscas altos (a "corujinha")
  const zf=F+.003,v:V3[]=[[0,1.32,zf],[0,.66,zf],[.6,1.04,zf],[.6,1.62,zf],[.48,1.86,zf],[0,1.9,zf],[-.48,1.86,zf],[-.6,1.62,zf],[-.6,1.04,zf],[0,.66,zf]]
  k.placa(v,teto,[0,0,1])
  for(const s of[-1,1]){
   k.placa([[s*.05,1.24,zf+.004],[s*.56,1.24,zf+.004],[s*.56,1.7,zf+.004],[s*.05,1.72,zf+.004]],VIDRO,[0,0,1])
   k.tubo(teto,[s*.6,.78,F-.06],[s*.6,.78,F+.03],.1,16);k.aro(CROMO,.1,s*.6,.78,F+.02,1,.016);k.lente(FAROL,.09,s*.6,.78,F+.02,1,.02)
   k.lente(SETA,.045,s*.46,1.12,F,1,.03);k.aro(CROMO,.045,s*.46,1.12,F+.02,1,.008)
   k.caixa(LANTERNA,.08,.16,.03,s*.62,1.02,R-.01) // lanterna traseira
   k.caixa(CROMO,.03,.025,.12,s*.865,1.0,1.5)
   k.tubo(PRETO,[s*.82,1.5,1.95],[s*.95,1.55,1.95],.012);k.bola(PRETO,.06,.12,.04,s*.97,1.55,1.95,8)
   // grelhas de ventilação do motor, no alto das laterais traseiras
   for(let i=0;i<5;i++)k.caixa(PRETO,.012,.018,.32,s*.856,1.3+i*.045,-1.95)
  }
  // logo VW redondo grande
  k.aro(CROMO,.17,0,.98,zf+.01,1,.018);const vw=(a:V2,b:V2)=>k.tubo(CROMO,[a[0],a[1],zf+.03],[b[0],b[1],zf+.03],.011,6)
  vw([-.1,1.1],[0,.94]);vw([.1,1.1],[0,.94]);vw([-.15,1.0],[-.08,.84]);vw([-.08,.84],[0,.96]);vw([0,.96],[.08,.84]);vw([.08,.84],[.15,1.0])
  // porta dupla do lado direito (−x) e vidro traseiro
  for(const z of[-.1,.45,1.0])k.caixa(PRETO,.012,1.22,.012,-.862,.95,z)
  k.placa([[-.5,1.3,R-.004],[.5,1.3,R-.004],[.48,1.66,R-.004],[-.48,1.66,R-.004]],VIDRO,[0,0,-1])
  k.caixa(PRETO,.9,.012,.012,0,1.18,R-.004);k.caixa(BRANCO,.34,.11,.02,0,.62,R-.01)
  k.lamina(CROMO,F+.06,.46,.86,.1,1,.12);k.lamina(CROMO,R-.06,.46,.86,.1,-1,.12)
 },
 // ── OPALA SS: cupê longo, capô comprido, traseira fastback, faixas pretas SS, faróis duplos redondos, rodas esportivas.
 'opala-ss'(p,k){
  const pt=p.color,eb=p.wheelbase/2,F=2.19,R=-2.38
  k.roda(p.radius,.2,'esportiva','#4a5053')
  k.casco([{z:R,w:.82,wt:.8,y0:.36,y1:.86,rb:.05,rt:.05},{z:R+.06,w:.87,wt:.85,y0:.31,y1:.9,rb:.06,rt:.06},{z:-1.1,w:.88,wt:.86,y0:.3,y1:.9,rb:.06,rt:.07},{z:-.6,w:.87,wt:.85,y0:.3,y1:.86,rb:.06,rt:.07},{z:.65,w:.87,wt:.85,y0:.3,y1:.86,rb:.06,rt:.07},{z:F-.05,w:.86,wt:.85,y0:.31,y1:.8,rb:.06,rt:.06},{z:F,w:.8,wt:.79,y0:.35,y1:.77,rb:.05,rt:.05}],
   {denso:k.zonas([eb,-eb],.41),lado:[.3,.55,.8],fundo:k.arcos([eb,-eb],.41,.32),cor:comFundo(pt)})
  const aPil=(y:number)=>.7-(y-.86)/(1.35-.86)*.66
  k.casco([{z:.72,w:.83,wt:.82,y0:.84,y1:.87,rt:.02},{z:.05,w:.81,wt:.65,y0:.84,y1:1.35,rt:.1},{z:-.68,w:.81,wt:.65,y0:.84,y1:1.34,rt:.1},{z:-1.0,w:.82,wt:.67,y0:.84,y1:1.27,rt:.1},{z:-1.35,w:.83,wt:.71,y0:.84,y1:1.11,rt:.08},{z:-1.72,w:.84,wt:.76,y0:.84,y1:.92,rt:.04}],
   {denso:[[.05,.72],[-1.2,-.68]],lado:[.1,.5,.9],cortes:[-.78,-.86,-1.16],cor:([x,y,z],n)=>{
    const ax=Math.abs(x),hw=.81-(y-.84)/.51*.16
    if(n[1]>.85)return pt
    if(n[2]>.3)return ax<hw-.07&&y<1.31?VIDRO:pt
    if(n[2]<-.2)return ax<hw-.1&&y>.97&&y<1.24?VIDRO:pt // vidro do fastback
    if(y<.91||y>1.3)return pt
    if(z>aPil(y)-.07)return pt
    if(entre(z,-.86,-.78))return pt // sem coluna B (hardtop): só a divisão do quebra-vento
    if(z<-1.16||y>1.3-(-.86-z)*.6)return pt // coluna C larga do fastback
    return VIDRO}})
  for(const s of[-1,1]){
   // faróis DUPLOS redondos com aro cromado
   for(const x of[.56,.74]){k.aro(CROMO,.075,s*x,.6,F,1,.013);k.lente(FAROL,.068,s*x,.6,F,1,.02)}
   k.caixa(SETA,.14,.05,.03,s*.6,.4,F+.06)
   k.caixa(LANTERNA,.42,.11,.02,s*.5,.7,R-.01);k.caixa(CROMO,.44,.012,.021,s*.5,.765,R-.011)
   // faixa preta lateral baixa com o "SS"
   k.caixa(PRETO,.02,.07,1.82,s*.875,.44,0);k.letreiro('SS',PRETO,[s*.882,.53,s>0?-.55:.55],[0,0,-s],[0,1,0],.03)
   k.caixa(CROMO,.03,.025,.13,s*.88,.8,-.4);k.tubo(CROMO,[s*.82,.92,.55],[s*.92,.97,.55],.012);k.bola(CROMO,.05,.08,.12,s*.94,.99,.55,8)
  }
  // grade preta larga com frisos e a gravata no meio, capô com as duas faixas pretas SS
  k.caixa(PRETO,.68,.2,.02,0,.6,F+.003);for(let i=0;i<4;i++)k.caixa('#555c60',.66,.012,.022,0,.53+i*.045,F+.008)
  k.caixa('#e2b33a',.12,.04,.03,0,.6,F+.012);k.caixa('#e2b33a',.05,.07,.03,0,.6,F+.013)
  for(const x of[-.14,.14])k.fita(PRETO,[x,.806,F-.04],[x,.866,.7],.16,[0,1,.04])
  k.lamina(CROMO,F+.05,.42,.88,.09,1,.16);k.lamina(CROMO,R-.05,.42,.88,.09,-1,.16)
  k.caixa(BRANCO,.34,.11,.02,0,.52,R-.01)
 },
 // ── FERRARI F40: cunha baixa e larga, aerofólio grande em ponte, entradas NACA, faróis escamoteáveis, tampa traseira com aletas.
 f40(p,k){
  const pt=p.color,eb=p.wheelbase/2,F=2.25,R=-2.18
  k.roda(p.radius,.27,'estrela','#9aa0a3')
  k.casco([{z:R,w:.94,wt:.88,y0:.26,y1:.92,rb:.06,rt:.06},{z:R+.08,w:.99,wt:.93,y0:.18,y1:.95,rb:.06,rt:.08},{z:-1.4,w:.99,wt:.93,y0:.16,y1:.92,rb:.06,rt:.12},{z:-.8,w:.98,wt:.9,y0:.16,y1:.86,rb:.06,rt:.12},{z:0,w:.95,wt:.84,y0:.16,y1:.8,rb:.06,rt:.12},{z:.7,w:.97,wt:.88,y0:.16,y1:.74,rb:.06,rt:.14},{z:1.3,w:.97,wt:.88,y0:.16,y1:.66,rb:.06,rt:.16},{z:1.85,w:.95,wt:.84,y0:.16,y1:.57,rb:.06,rt:.16},{z:2.17,w:.9,wt:.76,y0:.18,y1:.48,rb:.06,rt:.13},{z:F,w:.82,wt:.66,y0:.26,y1:.42,rb:.05,rt:.08}],
   {step:.15,suave:true,lado:[.35,.7],topo:3,fundo:k.arcos([eb,-eb],.4,.33),cor:comFundo(pt)})
  // para-lamas dianteiros altos (o capô fica mais baixo no meio), com as tampas dos faróis escamoteáveis
  for(const s of[-1,1])k.casco([{z:1.98,w:.1,wt:.06,y0:.46,y1:.52,rt:.04},{z:1.85,w:.17,wt:.11,y0:.42,y1:.64,rt:.1},{z:1.3,w:.22,wt:.15,y0:.4,y1:.76,rt:.12},{z:.8,w:.21,wt:.14,y0:.4,y1:.78,rt:.12},{z:.4,w:.17,wt:.1,y0:.4,y1:.72,rt:.08}],
   {x0:s*.75,suave:true,step:.13,topo:3,lado:[.5],fundo:k.arcos([eb],.4,.33),cor:comFundo(pt)})
  const aPil=(y:number)=>.95-(y-.74)/(1.12-.74)*.75
  k.casco([{z:.95,w:.8,wt:.79,y0:.72,y1:.75,rt:.02},{z:.2,w:.77,wt:.56,y0:.72,y1:1.12,rt:.12},{z:-.32,w:.77,wt:.56,y0:.72,y1:1.13,rt:.12},{z:-.6,w:.81,wt:.64,y0:.72,y1:1.07,rt:.1},{z:-1.95,w:.86,wt:.78,y0:.72,y1:.99,rt:.08},{z:-2.06,w:.86,wt:.78,y0:.72,y1:.95,rt:.06}],
   {denso:[[.2,.95]],cortes:[-.36,-1.9],lado:[.2,.5,.85],topo:3,cor:([x,y,z],n)=>{
    const ax=Math.abs(x),hw=.77-(y-.72)/.4*.21
    if(z<-.6)return n[1]>.7&&ax<.62&&z>-1.9?'#2a2e30':pt // tampa do motor em policarbonato escuro
    if(n[1]>.9)return pt
    if(n[2]>.25)return ax<hw-.06&&y<1.09?VIDRO:pt
    if(n[2]<-.25)return y>.95&&ax<.5?VIDRO:pt
    if(y<.8||y>1.09)return pt
    if(z>aPil(y)-.06||z<-.36)return pt
    return VIDRO}})
  // aletas da tampa do motor
  for(let i=0;i<8;i++){const z=-.8-i*.14,y=1.06-(i*.14+.2)*.064;k.caixa(PRETO,1.12,.025,.03,0,y+.01,z,-.3)}
  // aerofólio grande em PONTE: as laterais sobem do para-lama e seguram a asa
  for(const s of[-1,1]){k.placa([[s*.97,.88,-1.78],[s*.97,1.17,-2.12],[s*.97,1.2,-2.24],[s*.97,.92,-2.2]],pt,[s,0,0]);k.placa([[s*.9,.88,-1.78],[s*.9,1.17,-2.12],[s*.9,1.2,-2.24],[s*.9,.92,-2.2]],pt,[-s,0,0])
   k.caixa(pt,.07,.3,.12,s*.935,1.04,-2.04,-.9)}
  k.caixa(pt,1.94,.04,.36,0,1.18,-2.13,-.12);k.caixa(PRETO,1.9,.012,.3,0,1.155,-2.13,-.12)
  // NACA no capô e na porta, tomada grande antes da roda traseira
  for(const s of[-1,1]){
   k.placa([[s*.2,.701,1.25],[s*.3,.73,.86],[s*.14,.73,.86]],PRETO,[0,1,0])
   k.placa([[s*.958,.5,.5],[s*.93,.58,.05],[s*.93,.44,.05]],PRETO,[s,0,0])
   k.placa([[s*.97,.62,-.42],[s*.97,.84,-.5],[s*.97,.84,-.82],[s*.97,.58,-.76]],PRETO,[s,0,0])
   k.placa([[s*.52,.77,1.95],[s*.88,.62,1.95],[s*.92,.66,1.6],[s*.56,.79,1.6]],'#b0141a',[0,1,.2]) // tampa do farol escamoteável (fechada)
   k.caixa(FAROL,.3,.06,.02,s*.42,.37,F-.012);k.caixa(SETA,.1,.06,.02,s*.64,.36,F-.045,0,s*.5,0) // luzes fixas retangulares no bico
   for(const x of[.52,.76]){k.aro(PRETO,.075,s*x,.72,R-.01,-1,.012);k.lente(LANTERNA,.068,s*x,.72,R-.01,-1,.02)} // 4 lanternas redondas
   k.tubo(pt,[s*.78,.86,.5],[s*.95,.9,.48],.014);k.bola(pt,.06,.09,.13,s*.98,.92,.48,8)
  }
  k.caixa(PRETO,.9,.08,.05,0,.27,F-.02);k.caixa('#e9c534',.04,.05,.02,0,.42,F+.002)
  k.caixa(PRETO,1.82,.42,.02,0,.62,R-.005);for(const x of[-.08,0,.08])k.tubo('#9aa0a3',[x,.36,R+.05],[x,.36,R-.07],.035,10)
  k.caixa(PRETO,1.9,.1,.5,0,.2,R+.25)
 },
}

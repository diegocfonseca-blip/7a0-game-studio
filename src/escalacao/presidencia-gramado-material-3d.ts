import * as THREE from 'three'

export const CLARO_GRAMADO=1.5
/** Native image supplies grass detail without a custom normal shader. */
export function materialGramado3D(color:string,map:THREE.Texture,desgaste?:THREE.Texture){
 const material=new THREE.MeshStandardMaterial({color,map,roughness:1})
 // ☀️ 21/11 (Diego: "a grama não tá muito escura?"): a foto da grama é escura e a tinta já era quase branca — então a tinta passa de 1
 // (CLARO_GRAMADO) pra clarear o verde sem trocar a textura nem a luz do estádio. Vale pros dois tons da listra.
 material.color.multiplyScalar(CLARO_GRAMADO)
 material.name='gramado-textura-padrao'
 if(desgaste){
  // 🌱 19/11 (Diego: *"tudo que é muito liso fica fake… parecer mais gramado"*): no 3D do mapa o gramado ganha (1) manchas grandes
  // de tom (o campo nunca é um verde só), (2) o DESGASTE onde se joga mais — boca do gol, pequena área, marca do pênalti, meio-campo
  // e o corredor do bandeirinha — puxando pra terra, e (3) uma 2ª leitura da MESMA textura em outra escala, que quebra a repetição
  // de azulejo vista de longe. Tudo no desenho do chão: nenhuma malha nova, nenhuma sombra nova, a física do jogo não muda.
  material.name='gramado-textura-desgaste'
  material.onBeforeCompile=shader=>{
   shader.uniforms.desgasteMap={value:desgaste}
   shader.fragmentShader=shader.fragmentShader
    .replace('#include <common>','#include <common>\nuniform sampler2D desgasteMap;')
    .replace('#include <map_fragment>',`#include <map_fragment>
 {
  vec2 campoUv=clamp(vMapUv/vec2(26.,17.),0.,1.);
  vec4 d=texture2D(desgasteMap,campoUv);
  vec3 outra=texture2D(map,vMapUv*.27+vec2(.37,.11)).rgb;
  float l=dot(outra,vec3(.299,.587,.114));
  diffuseColor.rgb*=mix(.92,1.08,d.r)*(.94+.18*l);
  // ☀️ 22/11 (Diego, comparando com o campo do 2D: *"esse nosso gramado tá muito escuro… o outro tá bem mais vivo"*): a foto da grama
  // quase não tem azul (o verde saía fechado, puxando pro oliva) e as manchas escureciam demais. Clareia e puxa um pouco pra um
  // verde vivo de gramado de TV, mantendo a textura, as listras e o desgaste. Só a cor do chão: nenhuma luz, sombra ou malha nova.
  diffuseColor.rgb=mix(diffuseColor.rgb*1.28,vec3(.14,.44,.16),.3);
  diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.42,.34,.21)*(.75+.5*l),d.g*.78);
 }`)
  }
  material.customProgramCacheKey=()=>'gramado-desgaste-v3-balanced'
 }
 return material
}

/** Mapa de desgaste do campo inteiro (105 × 68 m, 1 px ≈ 10 cm): R = tom (0,5 = neutro), G = terra aparecendo. */
let desgasteCache:THREE.CanvasTexture|undefined
/** uma só pro jogo inteiro (1050×680, ~0,7 MB de vídeo): nunca é refeita nem descartada */
export function desgasteGramadoCompartilhado(){return desgasteCache??=texturaDesgasteGramado()}
export function texturaDesgasteGramado(semente=7):THREE.CanvasTexture{
 const W=1050,H=680,c=document.createElement('canvas');c.width=W;c.height=H
 const g=c.getContext('2d')!,img=g.createImageData(W,H),px=img.data
 let s=semente>>>0||1;const rnd=()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296}
 // ruído de valor em 3 escalas (grade aleatória suavizada)
 const grade=(cel:number)=>{const gw=Math.ceil(W/cel)+2,v=new Float32Array(gw*(Math.ceil(H/cel)+2));for(let i=0;i<v.length;i++)v[i]=rnd();return{cel,gw,gh:Math.ceil(H/cel)+1,v}}
 const camadas=[grade(140),grade(55),grade(18)],pesos=[.55,.3,.15]
 const amostra=(c2:{cel:number;gw:number;gh:number;v:Float32Array},x:number,y:number)=>{const fx=x/c2.cel,fy=y/c2.cel,x0=Math.floor(fx),y0=Math.floor(fy),ix=x0%(c2.gw-1),iy=y0%c2.gh,tx=fx-x0,ty=fy-y0,sx=tx*tx*(3-2*tx),sy=ty*ty*(3-2*ty),a=c2.v[iy*c2.gw+ix],b=c2.v[iy*c2.gw+ix+1],cc=c2.v[(iy+1)*c2.gw+ix],d=c2.v[(iy+1)*c2.gw+ix+1];return a+(b-a)*sx+(cc-a)*sy+(a-b-cc+d)*sx*sy}
 // pontos de desgaste em metros (x ao longo do campo, z na largura): [x, z, raioX, raioZ, força]
 const focos:[number,number,number,number,number][]=[]
 for(const lado of [-1,1]){
  focos.push([lado*51.6,0,2.4,3.6,.9],[lado*50,0,4,5.5,.42],[lado*41.5,0,1.4,1.4,.5],[lado*45,0,7,9,.14])
 }
 focos.push([0,0,2.5,2.5,.3],[0,0,10,8,.08])
 const H2=68,W2=105
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){
  let n=0;for(let k=0;k<3;k++)n+=amostra(camadas[k],x,y)*pesos[k]
  const mx=x/W*W2-W2/2,mz=y/H*H2-H2/2
  let w=0
  for(const [fx,fz,rx,rz,f] of focos){const dd=((mx-fx)/rx)**2+((mz-fz)/rz)**2;if(dd<1)w=Math.max(w,f*(1-dd)**1.6)}
  // corredor do bandeirinha (meia lateral de cada lado, perto da linha) e pé da linha de fundo
  const corredor=Math.max(0,1-Math.abs(Math.abs(mz)-33.3)/1.1)*(Math.abs(mx)<52?.18:0)
  w=Math.max(w,corredor)
  // o desgaste é irregular: o ruído fino come a borda
  const fino=amostra(camadas[2],x*2.3,y*2.3)
  w=Math.max(0,Math.min(1,w*(.45+fino*1.1)-.05))
  const i=(y*W+x)*4
  px[i]=Math.round(Math.max(0,Math.min(1,.5+(n-.5)*1.25))*255);px[i+1]=Math.round(w*255);px[i+2]=0;px[i+3]=255
 }
 g.putImageData(img,0,0)
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.NoColorSpace;t.anisotropy=4;t.wrapS=t.wrapT=THREE.ClampToEdgeWrapping
 return t
}

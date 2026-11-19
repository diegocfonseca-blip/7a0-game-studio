import * as THREE from 'three'

/** Soil detail evaluated in field coordinates, so adjacent construction strips
 * have neither seams nor stretched grains. No new image downloads at zoom.
 *
 * 🟫 19/11 (Diego: *"tá parecendo pouca textura… tudo que é muito liso fica fake"*): o campo de TERRA da Várzea ganha, só na conta
 * do shader (0 KB, nenhuma imagem nova):
 *  · manchas grandes de terra mais clara/seca, mais avermelhada e mais escura/úmida (ruído suave em camadas — antes era um ruído só,
 *    que de longe virava quadradões);
 *  · o DESGASTE onde se joga mais (boca do gol, pequena área, marca do pênalti, meio-campo) mais batido e escuro;
 *  · pedrinhas claras e escuras e marca de chuteira, que só aparecem de perto (de longe somem em vez de virar chuvisco);
 *  · tufos de grama teimosa nas beiradas e nos cantos, longe de onde a bola passa.
 * `antigo = true` devolve o solo de antes. */
export function materialSolo3D(antigo = false){
 const mat=new THREE.MeshStandardMaterial({color:'#99774f',roughness:1})
 mat.customProgramCacheKey=()=> antigo?'presidencia-soil-v1':'presidencia-soil-v2'
 mat.onBeforeCompile=shader=>{
  shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec2 vSoilUv;')
   .replace('#include <begin_vertex>','#include <begin_vertex>\nvSoilUv=uv;')
  shader.fragmentShader=shader.fragmentShader.replace('#include <common>',`#include <common>
varying vec2 vSoilUv;
float soilHash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float soilNoise(vec2 p){
 vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);
 return mix(mix(soilHash(i),soilHash(i+vec2(1.0,0.0)),f.x),mix(soilHash(i+vec2(0.0,1.0)),soilHash(i+vec2(1.0,1.0)),f.x),f.y);
}
float soilFbm(vec2 p){float v=0.0,a=0.5;for(int k=0;k<4;k++){v+=a*soilNoise(p);p=p*2.03+vec2(17.1,9.7);a*=0.5;}return v;}`)
   .replace('#include <color_fragment>',antigo?`#include <color_fragment>
 vec2 soilPoint=vSoilUv*vec2(105.0,68.0);
 float patches=soilNoise(soilPoint*0.7);
 float grit=soilNoise(soilPoint*16.0);
 float detail=1.0-smoothstep(0.025,0.12,length(fwidth(soilPoint)));
 diffuseColor.rgb*=0.78+0.36*patches+detail*(grit-0.5)*0.16;
`:`#include <color_fragment>
 {
  vec2 sp=vSoilUv*vec2(105.0,68.0);           // metros do campo (0..105 × 0..68)
  vec2 c=sp-vec2(52.5,34.0);                   // a partir do meio-campo
  float px=length(fwidth(sp)), perto=1.0-smoothstep(0.035,0.14,px), medio=1.0-smoothstep(0.12,0.45,px);
  float grande=soilFbm(sp*0.06), media=soilFbm(sp*0.32+5.1), fino=soilNoise(sp*14.0);
  vec3 base=diffuseColor.rgb;
  vec3 seca=base*vec3(1.16,1.10,0.98), vermelha=base*vec3(1.10,0.90,0.78), umida=base*vec3(0.70,0.66,0.62);
  vec3 cor=mix(base,seca,smoothstep(0.42,0.70,grande));
  cor=mix(cor,vermelha,smoothstep(0.55,0.80,soilFbm(sp*0.045+31.0))*0.65);
  cor=mix(cor,umida,smoothstep(0.62,0.82,media)*0.55);
  // desgaste: boca do gol, pequena área, pênalti e meio-campo (mais batido = mais escuro e liso)
  float gx=52.5-abs(c.x);
  float boca=(1.0-smoothstep(0.0,7.5,gx))*(1.0-smoothstep(3.0,10.0,abs(c.y)));
  float penalti=1.0-smoothstep(0.6,2.2,length(vec2(gx-11.0,c.y)));
  float meio=1.0-smoothstep(1.0,5.5,length(c));
  float gasto=clamp(max(max(boca,penalti*0.8),meio*0.6)*(0.55+0.9*soilNoise(sp*1.3)),0.0,1.0);
  cor=mix(cor,base*vec3(0.74,0.68,0.60),gasto*0.7);
  cor*=0.90+0.18*media;
  cor*=1.0+(fino-0.5)*0.22*perto;
  // pedrinhas (claras e escuras), só de perto
  vec2 cel=floor(sp*3.0); float h=soilHash(cel);
  if(h>0.86){ vec2 q=fract(sp*3.0)-0.5+(vec2(soilHash(cel+3.1),soilHash(cel+7.7))-0.5)*0.55;
   float pedra=(1.0-smoothstep(0.05,0.11,length(q)))*perto;
   cor=mix(cor,h>0.95?vec3(0.86,0.82,0.74):base*0.5,pedra*0.85); }
  // marca de chuteira: risquinhos escuros onde a terra é mais batida
  float risco=smoothstep(0.92,0.98,soilNoise(vec2(sp.x*9.0,sp.y*2.2)))*perto*(0.3+gasto);
  cor*=1.0-0.25*risco;
  // tufos de grama nas beiradas e nos cantos (longe da bola)
  float borda=smoothstep(29.0,34.0,abs(c.y))+smoothstep(46.0,52.5,abs(c.x))*(1.0-boca);
  float tufo=smoothstep(0.58,0.74,soilFbm(sp*0.9+11.0))*clamp(borda,0.0,1.0)*(0.4+0.6*medio);
  cor=mix(cor,vec3(0.36,0.48,0.24)*(0.85+0.3*fino),tufo*0.75);
  diffuseColor.rgb=cor;
 }
`)
 }
 return mat
}

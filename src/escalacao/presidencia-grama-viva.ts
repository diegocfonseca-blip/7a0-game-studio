import * as THREE from 'three'

// 🌿 GRAMA COM TEXTURA (18/11, Diego: *"sinto que o verde não tem textura… fica muito liso e feio"*). A grama do mapa era UMA cor com
// grão fino — de longe virava uma folha lisa. Aqui o próprio material ganha, de graça (só conta no shader, nenhuma imagem nova):
//  · manchas grandes (~30 m) de verde mais fechado e de verde mais seco/amarelado, como gramado de verdade;
//  · variação média (~5 m) e tufos escuros (~1 m);
//  · florzinhas brancas e amarelas espalhadas, que só aparecem de perto (de longe somem em vez de virar chuvisco).
// Tudo pela posição no MUNDO, então não repete ladrilho nem marca a borda dos polígonos de grama.
const NOISE = /* glsl */`
varying vec2 vGramaW;
float gHash(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
float gNoise(vec2 p){vec2 i=floor(p),f=fract(p);vec2 u=f*f*(3.-2.*f);
 return mix(mix(gHash(i),gHash(i+vec2(1,0)),u.x),mix(gHash(i+vec2(0,1)),gHash(i+vec2(1,1)),u.x),u.y);}
float gFbm(vec2 p){float v=0.,a=.5;for(int k=0;k<4;k++){v+=a*gNoise(p);p=p*2.03+vec2(17.1,9.7);a*=.5;}return v;}
`
export function gramaViva(material: THREE.MeshStandardMaterial) {
  const anterior = material.onBeforeCompile
  material.onBeforeCompile = (shader, renderer) => {
    anterior?.call(material, shader, renderer)
    shader.vertexShader = 'varying vec2 vGramaW;\n' + shader.vertexShader.replace('#include <project_vertex>',
      '#include <project_vertex>\n vGramaW=(modelMatrix*vec4(transformed,1.0)).xz;')
    shader.fragmentShader = NOISE + shader.fragmentShader.replace('#include <map_fragment>', `#include <map_fragment>
 {
  vec2 w=vGramaW;
  float grande=gFbm(w*.034), media=gFbm(w*.19+7.3), touceira=gFbm(w*.55+1.7), tufo=gNoise(w*1.35+3.1);
  float px=length(fwidth(w)), perto=1.-smoothstep(.18,.55,px), medio=1.-smoothstep(.6,1.6,px);
  vec3 fechado=diffuseColor.rgb*vec3(.80,.93,.74), seco=diffuseColor.rgb*vec3(1.16,1.09,.80);
  diffuseColor.rgb=mix(fechado,seco,smoothstep(.36,.74,grande));
  diffuseColor.rgb*=.88+.24*media;
  diffuseColor.rgb*=1.-.20*smoothstep(.58,.74,touceira)*(.35+.65*medio);
  diffuseColor.rgb*=1.+.10*smoothstep(.30,.16,touceira)*medio;
  diffuseColor.rgb*=1.-.16*smoothstep(.62,.86,tufo)*perto;
  vec2 cel=floor(w*.9); float h=gHash(cel);
  if(h>.95){
   vec2 c=fract(w*.9)-.5+(vec2(gHash(cel+3.),gHash(cel+9.))-.5)*.5;
   float pet=(1.-smoothstep(.10,.17,length(c)))*perto;
   vec3 flor=h>.977?vec3(.95,.93,.86):vec3(.98,.80,.22);
   diffuseColor.rgb=mix(diffuseColor.rgb,flor,pet);
  }
 }`)
  }
  const chave = material.customProgramCacheKey?.bind(material)
  material.customProgramCacheKey = () => (chave ? chave() : '') + '|grama-viva-1'
  material.needsUpdate = true
  return material
}

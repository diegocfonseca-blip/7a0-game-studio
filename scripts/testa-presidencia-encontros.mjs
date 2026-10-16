await import('./testa-presidencia-evolucao.mjs')
import assert from 'node:assert/strict'
const {atoresDoMapa,quadroAtor,raioCorpoAtor}=await import('../src/escalacao/presidencia-estadio-mapa-model.ts')

// Carroceria orientada como no DOM, em vez de confundir círculos de margem
// sobrepostos com colisão de dois carros paralelos. Pessoas colidem pelos pés.
function corpo(actor,p){
 const car=actor.kind==='car',angle=(car?p.angle:0)*Math.PI/180
 const cs=Math.cos(angle),sn=Math.sin(angle)
 const w=(car?actor.width/2:raioCorpoAtor(actor))*p.scale
 const h=(car?actor.height/2:raioCorpoAtor(actor))*p.scale
 return [[-w,-h],[w,-h],[w,h],[-w,h]].map(([x,y])=>({x:p.x+x*cs-y*sn,y:p.y+x*sn+y*cs}))
}
function sobrepostos(a,p,b,q){
 // Rejeição ampla barata; só calcula eixos quando os corpos estão próximos.
 const ra=raioCorpoAtor(a)*p.scale,rb=raioCorpoAtor(b)*q.scale
 if(Math.hypot(p.x-q.x,p.y-q.y)>Math.SQRT2*(ra+rb))return false
 const x=corpo(a,p),y=corpo(b,q)
 return [x,y].every(rect=>rect.slice(0,2).every((v,i)=>{
  const n=rect[i+1],axis={x:v.y-n.y,y:n.x-v.x}
  const px=x.map(z=>z.x*axis.x+z.y*axis.y),py=y.map(z=>z.x*axis.x+z.y*axis.y)
  return Math.min(...px)<Math.max(...py)&&Math.min(...py)<Math.max(...px)
 }))
}
for(const day of [undefined,{division:'V',support:0,match:'idle'},{division:'A',support:100,match:'playing'}])for(const works of [false,true])for(const paved of [false,true]){
 const stadium={inv:{grama:30,geral:40,cadeiras:90,visitante:120,camarote:works?50:150},ext:[...(paved?['asfalto']:[]),'hotel','loja','chopp','praca','estacao','estac',...(!works?['cober']:[])]}
 const actors=atoresDoMapa(stadium,day)
 for(let sample=0;sample<6000;sample++){
  const seconds=sample/10,frames=actors.map(actor=>quadroAtor(actor,seconds))
  for(let i=0;i<actors.length;i++)for(let j=i+1;j<actors.length;j++){
   assert.ok(!sobrepostos(actors[i],frames[i],actors[j],frames[j]),`${actors[i].id}/${actors[j].id} aos ${seconds}s, obras=${works}, asfalto=${paved}`)
  }
 }
}
console.log('PASS: dez minutos por cenário, com/sem obras e asfalto, sem sobrepor pés e carrocerias entre quaisquer rotas. Amostragem de 100 ms; fixture local.')

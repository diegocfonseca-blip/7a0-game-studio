// Inspeção da geometria realmente criada, sem depender do contador do gerador.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const dir=process.argv[2]??'/workspace/shared/mapa-arquitetura-cobertura';
const before=JSON.parse(fs.readFileSync(dir+'/antes.json','utf8'));
const after=JSON.parse(fs.readFileSync(dir+'/depois.json','utf8'));
assert.deepEqual(after.errors,[]);
const a=after.samples[0],b=before.samples[0],pieces=a.landscape.qaPieces;
const houses=pieces.filter(p=>p.name==='bairro-residencia');
assert.deepEqual(houses,b.landscape.qaPieces.filter(p=>p.name==='bairro-residencia'),'Casas conservam endereço, volume e orientação');
assert.equal(houses.length,594);
const walls=pieces.filter(p=>p.name==='bairro-muro'),gates=pieces.filter(p=>p.name==='bairro-portao-aberto');
const balconies=pieces.filter(p=>p.name==='bairro-sacada-sobrado');
assert.ok(walls.length>400&&gates.length===walls.length,'Cobertura real de muros/portões pelo bairro');
assert.ok(balconies.length>100,'Sacadas fora das primeiras quarenta construções');
assert.equal(new Set(walls.map(w=>Math.sign(w.position[0])+':'+Math.sign(w.position[2]))).size,4,'Muros nos quatro lados do mapa');
assert.ok(walls.some(w=>Math.abs(w.position[2])>400),'Bairro afastado visitável também tem fachadas completas');
// Um morador com raio de 25 cm passa inclusive pelas bordas do caminho de
// 1,30 m de largura entre a porta e a calçada, sem atravessar nenhum muro.
const solids=a.landscape.qaSolids;
const blocked=(p,s,r=.25)=>{
 if(p.x<s.minX-r||p.x>s.maxX+r||p.z<s.minZ-r||p.z>s.maxZ+r)return false;
 let inside=false;const poly=s.footprint;
 for(let i=0,j=poly.length-1;i<poly.length;j=i++){
  const a=poly[j],b=poly[i],dx=b.x-a.x,dz=b.z-a.z,t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.z-a.z)*dz)/(dx*dx+dz*dz)));
  if(Math.hypot(p.x-a.x-t*dx,p.z-a.z-t*dz)<r)return true;
  if((a.z>p.z)!==(b.z>p.z)&&p.x<(b.x-a.x)*(p.z-a.z)/(b.z-a.z)+a.x)inside=!inside;
 }
 return inside;
};
let checks=0;
for(const h of houses){
 const [x,,z]=h.position,d=h.size[2],c=Math.cos(h.angle),s=Math.sin(h.angle);
 const nearby=solids.filter(o=>o.maxX>x-15&&o.minX<x+15&&o.maxZ>z-15&&o.minZ<z+15);
 for(let along=d/2+.5;along<=d/2+6.5;along+=.15)for(const across of [-.65,0,.65]){
  const p={x:x+across*c+along*s,z:z-across*s+along*c};
  assert.ok(!nearby.some(s=>blocked(p,s)),`Entrada obstruída em ${x},${z}: ${p.x},${p.z}`);checks++;
 }
}
assert.ok(a.residentRoutes.routes>0&&a.residentRoutes.journeys>0,'Moradores ainda dispõem de trajetos reais');
assert.equal(new Set(a.residentRoutes.gatherings.map(g=>g.destination)).size,4,'Preservar encontros nos botecos e pontos de ônibus');
// Orçamento deste cenário completo: até 8% a mais de triângulos desenhados.
// Não equivale a uma medição de FPS ou memória em aparelho físico.
assert.ok(a.triangles<=b.triangles*1.08,'Teto de geometria adicional na vista geral');
assert.ok(a.memory.geometries<=b.memory.geometries+4,'Detalhes agrupados: não manter uma geometria por muro');
assert.equal(a.memory.textures,b.memory.textures,'Nenhuma nova textura/modelo externo');
for(const old of before.samples){
 const current=after.samples.find(s=>s.name===old.name);
 assert.deepEqual(current.camera,old.camera);assert.deepEqual(current.target,old.target);
}
const summary={ok:true,houses:houses.length,walledHomes:{before:b.landscape.qaPieces.filter(p=>p.name==='bairro-muro').length/2,after:walls.length/2},balconies:balconies.length,doorwayChecks:checks,renderViews:after.samples.map(s=>({name:s.name,drawCalls:s.drawCalls,triangles:s.triangles,memory:s.memory})),physicalPhoneFPS:'não medido'};
fs.writeFileSync(dir+'/validacao.json',JSON.stringify(summary,null,2));console.log(JSON.stringify(summary,null,2));

import {lots as LOTES,roads as ROADS,housePositions} from './layout.mjs';
import * as T from '../../node_modules/three/build/three.module.js';
import {OrbitControls} from '../../node_modules/three/examples/jsm/controls/OrbitControls.js';
import {STADIUM_SECTORS,STADIUM_EXTRAS} from '../../src/escalacao/estadiodata.ts';
import {complexoDoEstadio,PLANTA_COMPLEXO} from '../../src/escalacao/presidencia-complexo-model.ts';
import {criarArquiteturaComplexo} from '../../src/escalacao/presidencia-complexo-arquitetura.ts';
import {criarEntornoComplexo} from '../../src/escalacao/presidencia-complexo-entorno.ts';
import {criarCampo3D} from '../../src/escalacao/presidencia-complexo-partida.ts';
import {criarCasaLuca} from '../../src/escalacao/presidencia-casa-luca-3d.ts';
import {criarPredioMuseu,LOTE_MUSEU_CLUBE} from '../../src/escalacao/museu-clube-predio.ts';
import {criarClubeLazer} from '../../src/escalacao/presidencia-clube-lazer.ts';
import {criarTradicoesBairro} from '../../src/escalacao/presidencia-bairro-tradicoes-3d.ts';
const W=window as any;const complete={inv:Object.fromEntries(STADIUM_SECTORS.map(s=>[s.k,s.cost])),ext:[...STADIUM_EXTRAS.map(e=>e.k),'asfalto']};const state=complexoDoEstadio(complete);
const source=new T.Scene();const entorno=criarEntornoComplexo(source,state,()=>{}, {name:'Leilão Legends',residence:true,arena:true,museum:true});
const trad=criarTradicoesBairro(source,{bairro:entorno.bairro,botecos:entorno.botecos,solids:entorno.solids,onReady:()=>{}});trad.configure({canteiros:[],humor:'normal',carreata:false,dia:Date.UTC(2027,1,7),hora:10} as any,{period:'day',weekday:'domingo'} as any,{enabled:true,mobile:false});
source.updateMatrixWorld(true);
function desc(o:any):any{const b=new T.Box3().setFromObject(o);return {name:o.name,type:o.type,min:b.min.toArray(),max:b.max.toArray(),children:o.children.filter((x:any)=>x.type==='Group'||x.type==='Scene').map(desc)}}
W.inventory={scene:source.children.map(desc),bairro:entorno.bairro,trad:trad.inspect(),state,lots:PLANTA_COMPLEXO.lots};W.source=source;
const scene=new T.Scene();scene.background=new T.Color('#f4ecd6');scene.add(new T.HemisphereLight('#e5efff','#7d8261',1.8));const sun=new T.DirectionalLight('#fff3d5',2.2);sun.position.set(-180,350,220);scene.add(sun);
const renderer=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setPixelRatio(1.5);renderer.setSize(innerWidth,innerHeight);renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.0;document.body.appendChild(renderer.domElement);
const aspect=innerWidth/innerHeight;const camera=new T.OrthographicCamera(-320*aspect,320*aspect,320,-320,.1,3000);camera.position.set(460,650,680);camera.lookAt(0,0,10);const controls=new OrbitControls(camera,renderer.domElement);controls.target.set(0,0,10);controls.update();
const arch=criarArquiteturaComplexo(scene,state,{semSala:true});criarCampo3D(scene,complete);const museu=criarPredioMuseu(4);scene.add(museu.root);museu.root.position.set(-115,0,90);
W.scene=scene;W.camera=camera;W.renderer=renderer;W.render=()=>{controls.update();renderer.render(scene,camera)};W.render();W.ready=true;W.excludeStatic=new Set(scene.children);
// Isolated spatial extraction: preserve original geometry, UVs, materials and instance colours.
// Only positions/scales of lots change in this study. Production modules are imported unchanged.
const placements:any[]=[];
function lot(name:string,b:[number,number,number,number],x:number,z:number,s=1,which:T.Object3D=source){
 if(name==='Estação')return new T.Group();const plan=LOTES.find(p=>p.name===name);if(plan){b=plan.source;x=plan.x;z=plan.z;s=plan.scale}if(name.startsWith('Casa ')){const hp=housePositions[Number(name.slice(5))];if(hp){x=hp.x;z=hp.z}}const group=new T.Group();group.name='mockup-'+name;const cx=(b[0]+b[1])/2,cz=(b[2]+b[3])/2;
 which.updateMatrixWorld(true);
 which.traverse((o:any)=>{if(!o.isMesh||!o.geometry?.attributes.position)return;if(o.name.includes('civilian'))return;
 const instances=o.isInstancedMesh?o.count:1;
 for(let it=0;it<instances;it++){
 let matrix=o.matrixWorld.clone();let tint:any=null;if(o.isInstancedMesh){const im=new T.Matrix4();o.getMatrixAt(it,im);matrix.multiply(im);if(o.instanceColor){tint=new T.Color();o.getColorAt(it,tint)}}
 const geom=o.geometry;const pos=geom.attributes.position,ix=geom.index;const normals=new T.Matrix3().getNormalMatrix(matrix);const out:any={};for(const k of Object.keys(geom.attributes))out[k]=[];if(tint&&!out.color)out.color=[];
 const p=[new T.Vector3(),new T.Vector3(),new T.Vector3()];const groups:any[]=[];let offset=0;
 for(let a=0;a<(ix?ix.count:pos.count);a+=3){const ids=[0,1,2].map(j=>ix?ix.getX(a+j):a+j);ids.forEach((id,j)=>p[j].fromBufferAttribute(pos,id).applyMatrix4(matrix));
 if(!p.every(v=>v.x>=b[0]-.1&&v.x<=b[1]+.1&&v.z>=b[2]-.1&&v.z<=b[3]+.1&&v.y>=-.22))continue;
 const mi=geom.groups.find((g:any)=>a>=g.start&&a<g.start+g.count)?.materialIndex??0;
 if(groups.length&&groups.at(-1).materialIndex===mi)groups.at(-1).count+=3;else groups.push({start:offset,count:3,materialIndex:mi});offset+=3;
 ids.forEach((id,j)=>{for(const k of Object.keys(geom.attributes)){const attr=geom.attributes[k];if(k==='position'){out[k].push(p[j].x-cx,p[j].y,p[j].z-cz)}else if(k==='normal'){const n=new T.Vector3().fromBufferAttribute(attr,id).applyMatrix3(normals).normalize();out[k].push(n.x,n.y,n.z)}else{for(let c=0;c<attr.itemSize;c++)out[k].push(attr.array[id*attr.itemSize+c]*(k==='color'&&tint?[tint.r,tint.g,tint.b][c]:1))}}if(tint&&!geom.attributes.color)out.color.push(tint.r,tint.g,tint.b)});
 }
 if(!out.position.length)continue;const g=new T.BufferGeometry();for(const k of Object.keys(out))g.setAttribute(k,new T.Float32BufferAttribute(out[k],geom.attributes[k]?.itemSize??3));groups.forEach(a=>g.addGroup(a.start,a.count,a.materialIndex));const material=o.material;let mats=Array.isArray(material)?material:[material];if(tint&&!geom.attributes.color)mats=mats.map((m:any)=>{const c=m.clone();c.vertexColors=true;return c});const mesh=new T.Mesh(g,Array.isArray(material)?mats:mats[0]);mesh.castShadow=mesh.receiveShadow=true;group.add(mesh);
 }
 });group.position.set(x,.015,z);group.scale.setScalar(s);scene.add(group);placements.push({name,original:b,position:[x,z],scale:s,meshes:group.children.length});return group;
}
arch.root.position.set(-30,0,-10);for(const o of [...scene.children])if(o!==arch.root&&o!==museu.root&&o.isMesh)o.position.add(new T.Vector3(-30,0,-10));
function box(w:number,h:number,d:number,x:number,y:number,z:number,c:string){const m=new T.Mesh(new T.BoxGeometry(w,h,d),new T.MeshStandardMaterial({color:c,roughness:1}));m.position.set(x,y,z);m.receiveShadow=true;scene.add(m);return m}
box(482,8,466,0,-4.3,10,'#645a42');box(482,.5,466,0,-.32,10,'#758653');
// A finite floating base, a short road loop and pedestrian paths are presentation only.
function road(x:number,z:number,w:number,d:number){box(w+4,.09,d+4,x,-.015,z,'#d8d3c2');box(w,.06,d,x,.04,z,'#60645b');if(w>d){for(let i=x-w/2+4;i<x+w/2-3;i+=9)box(3,.025,.22,i,.085,z,'#e4d8a3')}else{for(let i=z-d/2+4;i<z+d/2-3;i+=9)box(.22,.025,3,x,.085,i,'#e4d8a3')}}
for(const r of ROADS){const horizontal=r.a[1]===r.b[1];road((r.a[0]+r.b[0])/2,(r.a[1]+r.b[1])/2,horizontal?Math.abs(r.b[0]-r.a[0])+r.width:r.width,horizontal?r.width:Math.abs(r.b[1]-r.a[1])+r.width)}
box(236,.08,40,-30,.015,106,'#b8b5a0');box(236,.08,15,-30,.015,-98,'#b8b5a0');box(20,.08,180,-141,.015,-4,'#b8b5a0');box(20,.08,180,81,.015,-4,'#b8b5a0'); // generous stadium esplanade
// Ensure plaza stays beneath the existing structure, not over the playing surface.
lot('Hotel',[-197,-123,-12,65],-192,-32,.88);
lot('Loja da torcida',[43,77,118,153],18,110,.9);
lot('Choperia',[86,133,129,165],74,111,.85);
lot('Alimentação',[39,129,171,200],26,170,.8);
lot('Estação',[-105,105,-174,-137],-26,-108,.9);
lot('Estacionamento · 4 setores',[154,286,0,191],174,-27,.74);
lot('Shopping e Vadico',[53,264,-278,-195],107,-180,.84);
lot('Agência',[-43,-8,-276,-233],-105,-178,.95);
lot('Tidex',[-196,-154,-288,-220],-169,-179,.83);
lot('dSouza',[253,318,212,312],185,186,.7);
lot('OittoLabs',[130,170,220,313],132,186,.67);
lot('GECG',[-110,-28,226,315],65,206,.64);
lot('Arena Legends',[220,320,-121,1],174,97,.68);
lot('Casa do presidente',[412,452,437,473],-15,210,1);
lot('Balada',[-358,-339,-309,-291],-208,177,1.3);
lot('Boteco',[-259,-245,125,147],-174,176,1.15);
lot('Feira',[-278,-269,89,121],-128,213,1.1,trad.root);
lot('Campo de terra',[-303,-271,150,178],-74,210,1.05,trad.root);
lot('Padaria',[-259,-245,95,117],-181,213,1.1);
lot('Praça do bairro',[-329,-302,122,149],-205,211,.88);
lot('Banca',[-272,-262,139,151],-151,211,1.1,trad.root);
for(let i=0;i<8;i++){const h=entorno.bairro.casas[i];lot('Casa '+i,[h.x-h.w/2-.5,h.x+h.w/2+.5,h.z-h.d/2-.5,h.z+h.d/2+.5],-207+(i%2)*24,-99+Math.floor(i/2)*27,1.1)}
const lucaParent=new T.Group();scene.add(lucaParent);const casa=criarCasaLuca(lucaParent,{leve:false,areas:true,onReady:()=>{}});lucaParent.position.set(-71.25,0,-58.1);lucaParent.scale.setScalar(.95);lucaParent.updateMatrixWorld(true);casa.update(12,camera,innerHeight,'day');
museu.root.position.set(-111,0,111);
const clubParent=new T.Group();scene.add(clubParent);const club=criarClubeLazer(clubParent,{quadras:{x:-14.5,z:0},lazer:{x:14.5,z:0}});club.periodo('day',12);clubParent.position.set(-189,0,57);clubParent.scale.setScalar(1.3);
// Main sight line: trees around edges only, using the actual game's park geometry.
lot('Árvore',[-331,-310,350,371],-221,-121,.8);
W.entorno=entorno;W.placements=placements;W.clubParent=clubParent;W.club=club;W.arch=arch;W.complete=complete;
function frame(target:T.Vector3,pos:T.Vector3,half:number){camera.left=-half*aspect;camera.right=half*aspect;camera.top=half;camera.bottom=-half;camera.updateProjectionMatrix();camera.position.copy(pos);controls.target.copy(target);controls.update();W.render()}
const labels:[string,number,number,number][]=[['ESTÁDIO COMPLETO',-30,38,-10],['SHOPPING + VADICO',107,25,-180],['HOTEL',-192,28,-32],['4 SETORES DE ESTACIONAMENTO',174,3,-27],['CLUBE RECREIO · 2 QUADRAS + PISCINA',-184,12,57],['CASA LUCA',-190,12,117],['ARENA LEGENDS',174,22,97],['MUSEU',-111,9,111],['LOJA',18,7,110],['CHOPERIA',74,7,111],['ALIMENTAÇÃO',26,11,170],['FEIRA + CAMPO DE TERRA',-105,8,211],['BALADA + BOTECO',-194,9,177],['AGÊNCIA',-105,17,-178],['ESTAÇÃO',-26,9,-108]];
function tags(){const el=document.getElementById('tags')!;el.innerHTML='';for(const [text,x,y,z] of labels){const p=new T.Vector3(x,y,z).project(camera);const d=document.createElement('div');d.className='tag';d.style.left=(p.x+1)*innerWidth/2+'px';d.style.top=(-p.y+1)*innerHeight/2+'px';d.textContent=text;el.appendChild(d)}}
W.overview=()=>{document.querySelector('h1')!.textContent='Seu clube. O bairro inteiro mais perto.';frame(new T.Vector3(0,0,17),new T.Vector3(480,720,850),285);tags()};
W.detail=()=>{document.getElementById('tags')!.innerHTML='';document.querySelector('h1')!.textContent='Clube Recreio · o modelo que já existe no jogo';document.querySelector('#label p')!.textContent='Duas quadras de futevôlei, piscina e quiosque com churrasqueira · terreno único';frame(new T.Vector3(-184,0,57),new T.Vector3(-125,110,160),62)};
W.lucaParent=lucaParent;W.sun=sun;W.controls=controls;W.T=T;W.baseReady=true;

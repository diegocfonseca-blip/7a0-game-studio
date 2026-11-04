import * as T from 'three'
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js'
import {TERRENO_USUARIO as P} from './residencia-planta'
import {ARTES_VEICULOS} from './presidencia-veiculos-artes'
import type {SolidoEntorno} from './presidencia-complexo-entorno'
/** Starter home, batched once; never creates another renderer. */
export function criarResidenciaUsuario(parent:T.Object3D,onLoad?:()=>void){
 const root=new T.Group();root.name='residencia-usuario';parent.add(root)
 const materials=new Set<T.Material>(),geometries=new Set<T.BufferGeometry>(),batches=new Map<T.Material,T.BufferGeometry[]>()
 const mat=(color:string)=>{const m=new T.MeshStandardMaterial({color,roughness:.9});materials.add(m);return m}
 const wood=mat('#856044'),oldWood=mat('#a2825c'),roof=mat('#807c70'),trim=mat('#4e493e'),glass=mat('#758d91'),base=mat('#b8ac8e'),earth=mat('#a38a59')
 const box=(m:T.Material,w:number,h:number,d:number,x:number,y:number,z:number,angle=0)=>{
  const g=new T.BoxGeometry(w,h,d);g.rotateX(angle);g.translate(x,y,z);const batch=batches.get(m)??[];batch.push(g);batches.set(m,batch)
 }
 box(earth,P.width,.02,P.depth,P.x,-.13,P.z)
 const h=P.house
 box(base,h.width+.5,.16,h.depth+.5,h.x,.08,h.z)
 for(let i=0;i<16;i++)for(const s of[-1,1])box(i%3?wood:oldWood,.48,h.height,.12,h.x-3.75+i*.5,.16+h.height/2,h.z+s*h.depth/2)
 for(const s of[-1,1])box(wood,.14,h.height,h.depth,h.x+s*h.width/2,.16+h.height/2,h.z)
 box(trim,1.4,2.45,.16,h.x-.9,1.385,h.z+h.depth/2+.1)
 box(glass,1.7,1.25,.18,h.x+1.65,1.9,h.z+h.depth/2+.11)
 for(const s of[-1,1])box(oldWood,.14,1.48,.2,h.x+1.65+s*.92,1.9,h.z+h.depth/2+.13)
 box(oldWood,2,.14,.2,h.x+1.65,1.24,h.z+h.depth/2+.13)
 for(let i=0;i<18;i++)box(roof,.49,.075,8.1,h.x-4.165+i*.49,3.62,h.z,-.1)
 const g=P.garage
 box(base,g.width,.12,g.depth,g.x,.06,g.z)
 // 🚗 03/11 (Diego: "não quero garagem fechada, quero aberta, aparecendo o carro"): sem telhado nem pilares — vaga aberta pintada
 for(const sx of[-1,0,1])box(trim,.12,.02,g.depth-.6,g.x+sx*g.width/2*(sx?0.94:1),.13,g.z)
 // cerca em volta do terreno, com o portão na frente da garagem (sai do centro + tamanho: o terreno pode mudar de endereço)
 const x0=P.x-P.width/2,x1=P.x+P.width/2,z0=P.z-P.depth/2,z1=P.z+P.depth/2,gate0=P.garage.x-P.garage.width/2-.5,gate1=P.garage.x+P.garage.width/2+.5
 for(let x=x0;x<=x1+.01;x+=2){box(oldWood,.14,1.1,.14,x,.55,z0);if(x<gate0||x>gate1)box(oldWood,.14,1.1,.14,x,.55,z1)}
 box(wood,P.width,.1,.1,P.x,.8,z0)
 box(wood,gate0-x0,.1,.1,(x0+gate0)/2,.8,z1);box(wood,x1-gate1,.1,.1,(gate1+x1)/2,.8,z1)
 for(const x of[x0,x1]){box(wood,.1,.1,P.depth,x,.8,P.z);for(let z=z0;z<=z1+.01;z+=2)box(oldWood,.14,1.1,.14,x,.55,z)}
 // entrada de carro: da garagem até o portão
 box(base,P.garage.width-1,.03,z1-(P.garage.z+P.garage.depth/2),P.garage.x,.02,(z1+P.garage.z+P.garage.depth/2)/2)
 for(const[m,parts]of batches){const g=mergeGeometries(parts)!;parts.forEach(p=>p.dispose());geometries.add(g);const o=new T.Mesh(g,m);o.castShadow=true;o.receiveShadow=true;root.add(o)}
 const solids:SolidoEntorno[]=[{id:P.id,minX:h.x-4,maxX:h.x+4,minZ:h.z-3.5,maxZ:h.z+3.5,base:.16,top:3.5,
  footprint:[{x:h.x-4,z:h.z-3.5},{x:h.x+4,z:h.z-3.5},{x:h.x+4,z:h.z+3.5},{x:h.x-4,z:h.z+3.5}]}]
 root.userData.residence={stage:'barraquinho',paidUpgrade:false,garageSpaces:2,cars:[] as string[]}
 // 🚗 03/11 (Diego: "comprei um Fusca e ele não aparece na garagem"): os veículos da garagem (a MESMA dupla da tela "Sua garagem",
 // posição esquerda e direita) aparecem dentro da garagem da casa. Desenho simples em blocos, cor de cada modelo; 0 KB de arte.
 const cars=new T.Group();cars.name='garagem-veiculos';root.add(cars)
 const carMats=new Map<string,T.Material>()
 const carMat=(color:string)=>{let m=carMats.get(color);if(!m){m=new T.MeshStandardMaterial({color,roughness:.45,metalness:.15});carMats.set(color,m)}return m}
 const tyre=mat('#1d1f20'),carGlass=mat('#3d5560'),lamp=mat('#f2edcf')
 const piece=(g:T.BufferGeometry,m:T.Material,x:number,y:number,z:number,parent:T.Object3D)=>{const o=new T.Mesh(g,m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o}
 const CORES:Record<string,string>={fusca:'#4f7fa3',chevette:'#b8422f',brasilia:'#d9b54a',kombi:'#e8e2d0',celta:'#c4c7c9',civic:'#20262b',challenger:'#7a1c1c'}
 // a MESMA arte da compra na Vadico (o recorte `scene`), em pé na vaga e sempre virada pra câmera — o carro fica igual ao da loja
 const urlBase=((import.meta as unknown as {env?:{BASE_URL?:string}}).env?.BASE_URL)??'/'
 const texturas=new Set<T.Texture>(),spriteMats=new Set<T.SpriteMaterial>()
 function arteNaVaga(id:string,x:number,z:number){
  const arte=ARTES_VEICULOS[id as keyof typeof ARTES_VEICULOS]
  if(!arte?.scene||typeof document==='undefined')return false
  const [rw,rh]=(arte.ground?.ratio??'440/235').split('/').map(Number),moto=rw/rh<1.5
  const largura=moto?2.7:4.3,altura=largura*rh/rw
  const tex=new T.TextureLoader().load(urlBase+arte.scene,()=>onLoad?.());tex.colorSpace=T.SRGBColorSpace;texturas.add(tex)
  const m=new T.SpriteMaterial({map:tex,transparent:true,alphaTest:.25});spriteMats.add(m)
  const sp=new T.Sprite(m);sp.center.set(.5,0);sp.scale.set(largura,altura,1);sp.position.set(x,.14,z);sp.userData.vehicle=id;cars.add(sp)
  return true
 }
 function veiculo(id:string,x:number,z:number){
  if(arteNaVaga(id,x,z))return
  const g=new T.Group();g.position.set(x,0,z);g.userData.vehicle=id;cars.add(g)
  const paint=carMat(CORES[id]??'#8d9aa3'),moto=/moto|bike|biz|cg|hornet|xj6|hayabusa|scooter|lambreta/.test(id)
  if(moto){piece(new T.BoxGeometry(.35,.55,1.8),paint,0,.7,0,g);for(const s of[-1,1])piece(new T.CylinderGeometry(.33,.33,.14,14).rotateZ(Math.PI/2),tyre,0,.33,s*.7,g);return}
  const fusca=id==='fusca'
  piece(new T.BoxGeometry(1.8,.62,4.0),paint,0,.62,0,g)
  if(fusca){const dome=piece(new T.SphereGeometry(1,16,10,0,Math.PI*2,0,Math.PI/2),paint,0,.92,-.15,g);dome.scale.set(.86,.7,1.55)}
  else piece(new T.BoxGeometry(1.55,.55,2.1),paint,0,1.2,-.2,g)
  piece(new T.BoxGeometry(fusca?1.3:1.5,.32,.06),carGlass,0,fusca?1.25:1.2,fusca?.95:.88,g)
  for(const s of[-1,1]){piece(new T.BoxGeometry(.3,.16,.05),lamp,s*.6,.7,2.01,g);for(const e of[-1,1])piece(new T.CylinderGeometry(.34,.34,.24,14).rotateZ(Math.PI/2),tyre,s*.85,.34,e*1.3,g)}
 }
 function garagem(ids:readonly(string|null)[]){
  const key=ids.map(i=>i??'-').join('|');if(cars.userData.key===key)return false
  cars.userData.key=key
  for(const c of[...cars.children]){c.traverse(o=>{if(o instanceof T.Mesh)o.geometry.dispose()});cars.remove(c)}
  texturas.forEach(t=>t.dispose());texturas.clear();spriteMats.forEach(m=>m.dispose());spriteMats.clear()
  const g=P.garage;ids.slice(0,2).forEach((id,i)=>{if(id)veiculo(id,g.x+(i===0?-2.1:2.1),g.z)})
  root.userData.residence.cars=ids.filter(Boolean)
  return true
 }
 return{root,solids,garagem,dispose(){root.removeFromParent();cars.traverse(o=>{if(o instanceof T.Mesh)o.geometry.dispose()});carMats.forEach(m=>m.dispose());texturas.forEach(t=>t.dispose());spriteMats.forEach(m=>m.dispose());geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());root.clear()}}
}

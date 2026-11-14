import {useEffect,useRef,useState} from 'react'
import * as T from 'three'
import {OrbitControls} from 'three/addons/controls/OrbitControls.js'
import {criarMobiliaComplexo} from './presidencia-complexo-mobilia'
import {complexoDoEstadio} from './presidencia-complexo-model'
import {criarBibliotecaVeiculos} from './veiculos-modelos-3d'
import {duplaDaGaragem,type DuplaGaragem} from './presidencia-garagem'
import type {PresidenciaCarteira} from './presidencia-economia'
import {useT} from './lang'
/** Cena sob demanda. Só mostra posse conferida; nenhuma compra ou escrita no save. */
export default function ResidenciaInterior({wallet,garage=false,display}:{wallet:PresidenciaCarteira;garage?:boolean;display?:DuplaGaragem}){
 const t=useT(),node=useRef<HTMLDivElement>(null),[failed,setFailed]=useState(false)
 const signature=JSON.stringify([wallet.owned,wallet.homeFurniture,display,garage])
 useEffect(()=>{const el=node.current;if(!el)return;let renderer:T.WebGLRenderer;try{renderer=new T.WebGLRenderer({antialias:true})}catch{setFailed(true);return}setFailed(false)
 const scene=new T.Scene();scene.background=new T.Color('#d8deca');const camera=new T.PerspectiveCamera(40,1,.1,70);camera.position.set(10,9,11);const controls=new OrbitControls(camera,renderer.domElement);controls.target.set(0,1,0);controls.minDistance=8;controls.maxDistance=22;controls.maxPolarAngle=Math.PI*.48;controls.enablePan=false;controls.enableDamping=false;controls.update();renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.outputColorSpace=T.SRGBColorSpace;el.append(renderer.domElement)
 const geometries:T.BufferGeometry[]=[],materials:T.Material[]=[],light=new T.HemisphereLight('#fff9e6','#8c9975',2.1);scene.add(light);const sun=new T.DirectionalLight('#fff1ce',2.6);sun.position.set(8,12,8);scene.add(sun)
 const box=(color:string,w:number,h:number,d:number,x:number,y:number,z:number)=>{const g=new T.BoxGeometry(w,h,d),m=new T.MeshStandardMaterial({color,roughness:.82});geometries.push(g);materials.push(m);const v=new T.Mesh(g,m);v.position.set(x,y,z);scene.add(v)}
 box('#998067',8.7,.28,7.7,0,-.16,0);box(garage?'#b2b5aa':'#e9ddc1',8,.08,7,0,.01,0);box('#efebd9',8.3,3.3,.24,0,1.6,-3.6);box('#ded8c6',.24,3.3,7.2,-4.1,1.6,0);box('#758d8c',2.2,1.45,.05,-.8,2,-3.45)
 let furniture:ReturnType<typeof criarMobiliaComplexo>|undefined,library:ReturnType<typeof criarBibliotecaVeiculos>|undefined
 if(garage){library=criarBibliotecaVeiculos();duplaDaGaragem(wallet.owned,display).forEach((id,i)=>{if(!id)return;const car=library!.create(id);if(car){car.root.position.set(i===0?-1.7:1.7,.12,0);scene.add(car.root)}});for(const x of [-1.7,1.7])for(const side of[-1,1])box('#f4ecd6',.08,.02,5.1,x+side*1.35,.07,.15)}
 else{const owned=wallet.owned.filter(o=>wallet.homeFurniture?.includes(o.id));furniture=criarMobiliaComplexo(scene,complexoDoEstadio({inv:{},ext:[]}),{...wallet,owned,homeFurniture:[]},{interior:true});const spots:Record<string,number[]>={'mesa-simples':[0,.07,-.8],'mesa-madeira':[0,.07,-.8],'cadeira-simples':[0,.07,.7],'cadeira-couro':[0,.07,.7],'tapete':[0,.08,.5],'quadro':[2.1,1.4,-3.35],'lustre':[.6,2.6,0],'sofa':[2.6,.07,1.4],'aquario':[-2.7,.07,1.4],'planta':[3,.07,-2.4],'estante-simples':[-2.8,.07,-2.4],'estante-madeira':[-2.8,.07,-2.4],'luminaria':[3,.07,2.7]};for(const group of furniture.root.children){const b=new T.Box3().setFromObject(group),center=b.getCenter(new T.Vector3()),p=spots[group.name]??[2,.07,1];group.position.set(p[0]-center.x,p[1]-b.min.y,p[2]-center.z)}}
 const draw=()=>{if(!el.clientWidth||!el.clientHeight)return;renderer.setSize(el.clientWidth,el.clientHeight,false);camera.aspect=el.clientWidth/el.clientHeight;camera.updateProjectionMatrix();renderer.render(scene,camera);el.dataset.ready='true'};const resize=new ResizeObserver(draw);resize.observe(el);controls.addEventListener('change',draw);draw()
 const lost=(e:Event)=>{e.preventDefault();setFailed(true)};renderer.domElement.addEventListener('webglcontextlost',lost)
 return()=>{resize.disconnect();controls.removeEventListener('change',draw);controls.dispose();renderer.domElement.removeEventListener('webglcontextlost',lost);furniture?.dispose();library?.dispose();geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());renderer.dispose();renderer.forceContextLoss();renderer.domElement.remove()}
 },[signature])
 return <div><div ref={node} className="cr3-interior" aria-label={garage?t('Sua garagem com veículos possuídos','Your garage with owned vehicles'):t('Interior da casa com teto cortado','Cutaway house interior')}/>{failed&&<p role="status">{t('A cena não carregou. Seus bens continuam disponíveis na lista abaixo.','The scene could not load. Your possessions remain available in the list below.')}</p>}<p>{t('Arraste para girar. Aproxime com os dedos ou com a roda do mouse.','Drag to rotate. Pinch or use the mouse wheel to zoom.')}</p></div>
}

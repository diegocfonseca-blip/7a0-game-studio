import {useEffect,useRef,useState} from 'react'
import * as T from 'three'
import {OrbitControls} from 'three/addons/controls/OrbitControls.js'
import {criarBibliotecaVeiculos} from './veiculos-modelos-3d'
/** One renderer only while the preview is open; no purchases or animation loop. */
export default function VeiculoModeloPreview({id}:{id:string}){
 const host=useRef<HTMLDivElement>(null),[error,E]=useState(false)
 useEffect(()=>{const el=host.current;if(!el)return;let renderer:T.WebGLRenderer;try{renderer=new T.WebGLRenderer({antialias:true,alpha:false})}catch{E(true);return}
  const scene=new T.Scene();scene.background=new T.Color('#f4ecd6');const library=criarBibliotecaVeiculos(),model=library.create(id);if(!model){renderer.dispose();library.dispose();E(true);return}
  scene.add(model.root);renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;el.append(renderer.domElement);renderer.domElement.style.cssText='width:100%;height:100%;display:block;touch-action:none';
  scene.add(new T.HemisphereLight('#ecf4ff','#9a8764',2.1));const sun=new T.DirectionalLight('#fff4da',3);sun.position.set(8,15,12);scene.add(sun)
  const floor=new T.Mesh(new T.PlaneGeometry(40,40),new T.MeshStandardMaterial({color:'#d9d2bb',roughness:1}));floor.rotation.x=-Math.PI/2;floor.position.y=-.015;scene.add(floor)
  const camera=new T.PerspectiveCamera(36,1,.05,100),d=model.profile.length*1.7;camera.position.set(d*.7,d*.4,d*.85);const controls=new OrbitControls(camera,renderer.domElement);controls.target.set(0,model.profile.height*.45,0);controls.enablePan=false;controls.minDistance=model.profile.length;controls.maxDistance=model.profile.length*3;controls.maxPolarAngle=Math.PI*.48;controls.update();
  const draw=()=>renderer.render(scene,camera),resize=()=>{if(!el.clientWidth||!el.clientHeight)return;renderer.setSize(el.clientWidth,el.clientHeight,false);camera.aspect=el.clientWidth/el.clientHeight;camera.updateProjectionMatrix();draw()};controls.addEventListener('change',draw);const observer=new ResizeObserver(resize);observer.observe(el);resize()
  return()=>{observer.disconnect();controls.dispose();model.dispose();library.dispose();floor.geometry.dispose();(floor.material as T.Material).dispose();renderer.dispose();renderer.forceContextLoss();renderer.domElement.remove()}
 },[id])
 return error?<p role="status">Não foi possível abrir o 3D neste dispositivo.</p>:<div ref={host} style={{height:300,border:'2px solid #0c0c0c',borderRadius:12,overflow:'hidden'}} aria-label="Prévia 3D do veículo; arraste para girar"/>
}

import {useEffect,useRef,useState} from 'react'
import {renderToStaticMarkup} from 'react-dom/server'
import * as T from 'three'
import {TrofeuPerfil} from './trofeus-perfil'
import {competenciaMuseu} from './museu-clube-trofeus'
import type {TrofeuPresidencia} from './presidencia-trofeus'
import type {ArtesIdentidadeSala} from './presidencia-sala-identidade-assets'
import {useT,getLang} from './lang'
/** Small lazy cutaway, not a second running city. Render only on entry,
 * resize and user controls. Closing/unmounting releases the WebGL context. */
export default function MuseuSala({trophies,identity,club}:{trophies:readonly TrofeuPresidencia[];identity?:ArtesIdentidadeSala;club:string}){
 const t=useT(),language=getLang(),el=useRef<HTMLDivElement>(null),turn=useRef<(n:number)=>void>(()=>{}),[failed,F]=useState(false)
 useEffect(()=>{
  const host=el.current;if(!host)return
  let renderer:T.WebGLRenderer
  try{renderer=new T.WebGLRenderer({antialias:true,alpha:false});renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5))}catch{F(true);return}
  let disposed=false;const scene=new T.Scene();scene.background=new T.Color('#d5ddcf');const camera=new T.PerspectiveCamera(38,1,.1,100)
  host.append(renderer.domElement);renderer.domElement.setAttribute('role','img');renderer.domElement.setAttribute('aria-label',`${club} · ${t('Sala de taças','Trophy hall')}`)
  scene.add(new T.HemisphereLight('#fff8dc','#67765d',2.5));const light=new T.DirectionalLight('#fff1cd',2.8);light.position.set(7,16,9);scene.add(light)
  const geos:T.BufferGeometry[]=[],mats:T.Material[]=[],textures:T.Texture[]=[],pending:HTMLImageElement[]=[];let angle=.55
  const render=()=>{if(disposed)return;const width=host.clientWidth,height=host.clientHeight;renderer.setSize(width,height,false);camera.aspect=width/height;camera.position.set(Math.sin(angle)*27,20,Math.cos(angle)*27);camera.lookAt(0,1,0);camera.updateProjectionMatrix();renderer.render(scene,camera);host.dataset.ready='true'}
  const box=(color:string,w:number,h:number,d:number,x:number,y:number,z:number)=>{const g=new T.BoxGeometry(w,h,d),m=new T.MeshStandardMaterial({color});geos.push(g);mats.push(m);const o=new T.Mesh(g,m);o.position.set(x,y,z);scene.add(o);return o}
  const image=(src:string,w:number,h:number,x:number,y:number,z:number,crop?:ArtesIdentidadeSala['shirtCrop'])=>{
   const im=new Image();pending.push(im);im.onload=()=>{if(disposed)return;const tex=new T.Texture(im);tex.colorSpace=T.SRGBColorSpace;tex.needsUpdate=true;if(crop){tex.repeat.y=crop.front/crop.height;tex.offset.y=1-tex.repeat.y}textures.push(tex);const g=new T.PlaneGeometry(w,h),m=new T.MeshBasicMaterial({map:tex,transparent:true,side:T.DoubleSide,depthWrite:false});geos.push(g);mats.push(m);const p=new T.Mesh(g,m);p.position.set(x,y,z);scene.add(p);render()};im.src=src
  }
  const label=(text:string,w:number,h:number,x:number,y:number,z:number)=>{const c=document.createElement('canvas');c.width=1024;c.height=128;const ctx=c.getContext('2d')!;ctx.fillStyle='#14271b';ctx.fillRect(0,0,1024,128);ctx.fillStyle='#f4ecd6';ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='700 76px Oswald,Arial';ctx.fillText(text,512,64,980);image(c.toDataURL(),w,h,x,y,z)}
  box('#b7a185',15,.4,16,0,0,0);box('#f4ecd6',14.6,.1,15.6,0,.25,0);box('#e4dbc6',15,5,.3,0,2.5,-7.85);box('#ddd3bd',.3,5,16,-7.35,2.5,0);box('#163323',15,.25,.4,0,5.1,-7.85)
  label(club.toUpperCase(),11,1.05,0,4.2,-7.6)
  const rows=Math.max(1,Math.ceil(trophies.length/4))
  trophies.forEach((r,i)=>{const count=Math.min(4,trophies.length-Math.floor(i/4)*4),x=(i%4-(count-1)/2)*3.2,z=(Math.floor(i/4)-(rows-1)/2)*3.8-1;box('#183421',2.3,.85,1.8,x,.75,z);box('#d1b064',2.4,.12,1.9,x,1.24,z)
   const markup=renderToStaticMarkup(<TrofeuPerfil comp={competenciaMuseu(r.id)} nome={r.label}/>).replace('width="40" height="48"','width="400" height="480"').replace('<svg ','<svg xmlns="http://www.w3.org/2000/svg" ')
   image('data:image/svg+xml;charset=utf-8,'+encodeURIComponent(markup),1.85,2.2,x,2.45,z)
   label(`${r.label} ×${r.count}`,2.6,.38,x,.8,z+.96)
  })
  if(!trophies.length)label(t('ESPAÇO PARA SUA PRIMEIRA TAÇA','ROOM FOR YOUR FIRST TROPHY'),11,1.1,0,2.1,-4)
  box('#886344',5,.2,.8,0,.65,5.8);for(const x of[-1.8,1.8])box('#183421',.15,.55,.7,x,.3,5.8)
  const z=5.5
  if(identity?.crest)image(identity.crest,2,2,4.8,2.5,-7.55)
  if(identity?.shirt){box('#18271c',2.8,3.5,.15,-4.6,2,-7.6);image(identity.shirt,2.4,3,-4.6,2,-7.49,identity.shirtCrop)}
  if(identity?.mascot){box('#183421',1.8,.8,1.5,4.7,.7,z);image(identity.mascot,1.8,2.4,4.7,2.3,z)}
  turn.current=n=>{angle=Math.max(-.12,Math.min(1.03,angle+n));render()}
  const observer=new ResizeObserver(render);observer.observe(host);render();const lost=(e:Event)=>{e.preventDefault();if(!disposed)F(true)};renderer.domElement.addEventListener('webglcontextlost',lost)
  return()=>{disposed=true;observer.disconnect();turn.current=()=>{};pending.forEach(im=>{im.onload=null});geos.forEach(g=>g.dispose());mats.forEach(m=>m.dispose());textures.forEach(tex=>tex.dispose());renderer.domElement.removeEventListener('webglcontextlost',lost);renderer.dispose();renderer.forceContextLoss();renderer.domElement.remove()}
 },[trophies.map(r=>`${r.id}:${r.count}`).join('|'),JSON.stringify(identity),club,language])
 return <>{failed?<p role="status">{t('A sala 3D não abriu neste aparelho. Todas as taças continuam disponíveis no acervo abaixo.','The 3D room could not open on this device. All trophies remain available in the collection below.')}</p>:<><div className="mc-room" ref={el}/><div className="mc-tabs"><button onClick={()=>turn.current(-.18)}>{t('← Olhar à esquerda','← Look left')}</button><button onClick={()=>turn.current(.18)}>{t('Olhar à direita →','Look right →')}</button></div><p className="mc-room-help">{t('Vista aberta para enxergar o acervo. Use as setas para mudar o ângulo.','Open view of the collection. Use the arrows to change the angle.')}</p></>}</>
}

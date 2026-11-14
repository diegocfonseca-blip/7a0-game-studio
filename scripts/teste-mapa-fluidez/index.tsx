import React,{useState} from 'react'
import {createRoot} from 'react-dom/client'
import * as T from 'three'
import Complexo from '../../src/escalacao/presidencia-complexo-3d'
import {STADIUM_SECTORS,STADIUM_EXTRAS} from '../../src/escalacao/estadiodata'
import '../../src/index.css'
const W=window as any,full={inv:Object.fromEntries(STADIUM_SECTORS.map(s=>[s.k,s.cost])),ext:[...STADIUM_EXTRAS.map(e=>e.k),'asfalto']}
W.qaProfile={started:performance.now(),probes:[],ready:[],longTasks:[],loading:[],api:null}
new PerformanceObserver(list=>{for(const e of list.getEntries())W.qaProfile.longTasks.push({start:e.startTime,duration:e.duration})}).observe({type:'longtask',buffered:true})
const original=W.qaOriginalProbe??=T.PMREMGenerator.prototype.fromScene
T.PMREMGenerator.prototype.fromScene=function(scene,...args){
 const begin=performance.now(),renderer=(this as any)._renderer,render=renderer.render;W.qaRenderer=renderer;let worldPasses=0,meshes=0;scene.traverse(o=>{if(o instanceof T.Mesh)meshes++})
 renderer.render=function(s:any,...rest:any[]){if(s===scene&&meshes>0)worldPasses++;return render.call(this,s,...rest)}
 try{return original.call(this,scene,...args)}finally{renderer.render=function(s:any,...a:any[]){const result=render.call(this,s,...a);if(s.children.some((n:any)=>n.name==='complexo-entorno'))W.qaScene=s;return result};W.qaProfile.probes.push({ms:performance.now()-begin,worldPasses,meshes});if(new URL(location.href).searchParams.has('hold')){
   W.qaHeldRenderers??=new WeakSet()
   if(!W.qaHeldRenderers.has(renderer)){
    W.qaHeldRenderers.add(renderer)
    // Bancada: permite aguardar a conclusão mesmo se o driver só compila de forma síncrona.
    const gl=renderer.getContext(),get=gl.getExtension.bind(gl)
    gl.getExtension=(name:string)=>{if(name==='KHR_parallel_shader_compile'){gl.getExtension=get;return get(name)??{}}return get(name)}
    const compile=renderer.compileAsync
    renderer.compileAsync=async function(...args:any[]){await compile.apply(this,args);if(W.qaReleased)return;W.qaHoldId=(W.qaHoldId??0)+1;await new Promise<void>(resolve=>{W.qaRelease=resolve})}
   }
  }
}
}
new MutationObserver(()=>{const el=document.querySelector('.pc3-stage');if(el&&el.querySelector('[data-complexo-3d]')?.getAttribute('aria-busy')==='true')W.qaProfile.loading.push({at:performance.now(),text:el.textContent,buttons:[...el.querySelectorAll('button')].filter(b=>b.getClientRects().length&&getComputedStyle(b).display!=='none'&&getComputedStyle(b).visibility!=='hidden').map(b=>b.textContent)})}).observe(document.getElementById('root')!,{childList:true,subtree:true,attributes:true,attributeFilter:['data-map-ready','aria-busy']})
function App(){const[show,S]=useState(true),[save,Save]=useState(full);W.qaRoof=()=>Save(s=>({...s,roofClosed:!(s as any).roofClosed}));W.qaToggle=S;return <><button data-qa-toggle onClick={()=>S(!show)}>Alternar bancada</button>{show&&<Complexo stadium={save} clubName="Bancada local" museumStage={0} onOpenClub={x=>{W.qaDestination=x}} qaPopulation circulation cidadeViva={{canteiros:[],humor:'normal',carreata:false,dia:Date.UTC(2027,1,7),hora:14}} journey={{ordinal:2,key:'fluidez',phase:'idle',hosting:false,period:'day'} as any} onReady={api=>{W.qaProfile.api=api;W.qaProfile.ready.push({at:performance.now(),active:!!api,info:api?((s:any)=>({startup:s.startup,quality:s.quality,drawCalls:s.drawCalls,triangles:s.triangles,frameStats:s.frameStats,softwareGPU:s.softwareGPU}))(api.inspect()):null})}}/>}</>}
createRoot(document.getElementById('root')!).render(<App/>);

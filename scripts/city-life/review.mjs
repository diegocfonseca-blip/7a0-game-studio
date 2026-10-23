import * as T from 'three';
import {createCivilian,CIVILIAN_VARIANTS} from '../../src/escalacao/cidade3d/civilians.mjs';
const scene=new T.Scene();scene.background=new T.Color('#d4d9d0');
scene.add(new T.HemisphereLight('#fff9ef','#6c7763',2));
const sun=new T.DirectionalLight('#fff4de',2.7);sun.position.set(-5,10,6);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-9,right:9,top:5,bottom:-5});sun.shadow.normalBias=.01;scene.add(sun);
const floor=new T.Mesh(new T.PlaneGeometry(100,100),new T.MeshStandardMaterial({color:'#9eaa8f',roughness:1}));floor.rotation.x=-Math.PI/2;floor.receiveShadow=true;scene.add(floor);
const renderer=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;document.querySelector('#scene').append(renderer.domElement);
const camera=new T.PerspectiveCamera(36,1,.1,200),actors=CIVILIAN_VARIANTS.map((variant,i)=>{const actor=createCivilian(scene,{id:'gallery-'+i,variant:variant.id});actor.root.position.x=(i-3.5)*1.35;return actor});
let moving=false,seconds=0,raf=0,start=0,view='front';
function draw(){renderer.render(scene,camera);document.querySelector('#status').textContent=actors.map(a=>{const d=a.inspect();return d.variant+' · '+d.height+' m'+(d.provisional?' · provisório':'')}).join(' | ')}
function pose(time){seconds=time;actors.forEach(a=>a.update({seconds:time,distance:time*1.05,speed:moving?1.05:0},true));draw()}
function setView(mode,index){view=mode;const x=index===undefined?0:actors[index].root.position.x,target=new T.Vector3(x,.9,0);camera.position.set(x+(mode==='side'?5:0),index===undefined?2.8:1.7,mode==='back'?-7:mode==='side'?0:index===undefined?15:4);camera.lookAt(target);draw()}
function resize(){const w=innerWidth,h=Math.max(320,innerHeight*.72);renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();setView(view)}window.addEventListener('resize',resize);resize();
function tick(now){if(!moving)return;pose((now-start)/1000);raf=requestAnimationFrame(tick)}
await Promise.all(actors.map(a=>a.ready));
window.civilQA={actors:()=>actors.map(a=>a.inspect()),pose,view:setView,walk(){cancelAnimationFrame(raf);moving=true;start=performance.now()-seconds*1000;raf=requestAnimationFrame(tick)},idle(){moving=false;cancelAnimationFrame(raf);pose(seconds)},setWalking(value){moving=value;pose(seconds)},inspect:()=>({actors:actors.map(a=>a.inspect()),calls:renderer.info.render.calls,triangles:renderer.info.render.triangles,memory:renderer.info.memory})};pose(0);

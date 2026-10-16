const assert=require('node:assert/strict');
const {chromium}=require('./presidencia-runtime.cjs').loadDependency('playwright');
(async()=>{const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader']});try{
 const page=await browser.newPage({viewport:{width:800,height:700}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',r=>r.request().url().startsWith('http://127.0.0.1:4196/')?r.continue():r.abort());
 await page.goto('http://127.0.0.1:4196/7a0-game-studio/qa-presidencia-mapa.html');
 const result=await page.evaluate(async()=>{
  const T=window.qaThree,{person,pose}=await import('/7a0-game-studio/src/escalacao/presidencia-atleta-3d.ts'),{instanciarPersonagens}=await import('/7a0-game-studio/src/escalacao/presidencia-personagens-instancias.ts');
  const renderer=new T.WebGLRenderer({antialias:false});renderer.setSize(512,512);renderer.shadowMap.enabled=true;
  const scene=new T.Scene();scene.background=new T.Color('#243e29');scene.add(new T.HemisphereLight(0xffffff,0x38533a,2));
  const sun=new T.DirectionalLight(0xffffff,3);sun.position.set(5,12,8);sun.castShadow=true;scene.add(sun);
  const plane=new T.Mesh(new T.PlaneGeometry(22,22),new T.MeshStandardMaterial({color:'#327c35',roughness:1}));plane.rotation.x=-Math.PI/2;plane.receiveShadow=true;scene.add(plane);
  const camera=new T.PerspectiveCamera(45,1,.1,80);camera.position.set(10,14,18);camera.lookAt(0,.5,0);
  const bodies=Array.from({length:22},(_,i)=>{const b=person(i<11?'#1b7a3d':'#c2452f',['#b9815b','#805439','#d5aa80'][i%3],i%11===0);scene.add(b.group);pose(b,{mx:(i%6-2.5)*2,mz:(Math.floor(i/6)-1.5)*2,heading:i/3,distance:i/4,speed:3,kick:i%4===0?.15:0,throwing:0,control:i%5===0?.16:0,dive:i===0?.8:0,save:i===0?1:0});return b});
  const target=new T.WebGLRenderTarget(512,512),pixels=()=>{const p=new Uint8Array(512*512*4);renderer.setRenderTarget(target);renderer.render(scene,camera);renderer.readRenderTargetPixels(target,0,0,512,512,p);return p};
  const before=pixels(),oldCalls=renderer.info.render.calls,batch=instanciarPersonagens(scene,bodies.map(b=>b.group));batch.update();
  const after=pixels(),newCalls=renderer.info.render.calls;let changed=0,max=0;
  for(let i=0;i<before.length;i+=4){const delta=Math.max(...[0,1,2].map(k=>Math.abs(before[i+k]-after[i+k])));if(delta>3)changed++;max=Math.max(max,delta)}
  // Color changes and arbitrary movement must still use the original rig.
  bodies[3].kit.color.set('#1838aa');pose(bodies[3],{mx:7,mz:2,heading:2,distance:0,speed:0,kick:0,throwing:0});batch.update();const moved=pixels();
  batch.dispose();const unbatched=pixels();let movedMismatch=0;for(let i=0;i<moved.length;i++)if(Math.abs(moved[i]-unbatched[i])>3)movedMismatch++;
  // Additional custom shapes catch BufferGeometry.type collisions even if a
  // future player rig stops using one of the shapes. Distinct cloth maps must
  // also retain their weave after becoming instance batches.
  bodies.forEach(body=>scene.remove(body.group));const customRoot=new T.Group();scene.add(customRoot);
  const makeTexture=(id,reverse=false)=>{
   const data=new Uint8Array(8*8*4);
   for(let y=0;y<8;y++)for(let x=0;x<8;x++){const n=(y*8+x)*4,v=((x+y)%2===0)!==reverse?255:15;data.set([v,v,v,255],n)}
   const map=new T.DataTexture(data,8,8);map.userData.humanoTexture=id;map.needsUpdate=true;return map;
  };
  const customGeometry=(shape)=>{
   const source=shape==='head'?new T.SphereGeometry(.62,20,14):new T.BoxGeometry(.9,1.4,.5);
   const geometry=new T.BufferGeometry().copy(source);geometry.userData.humanoShape=shape;source.dispose();return geometry;
  };
  for(let i=0;i<6;i++){
   const shape=i%2?'torso':'head',material=new T.MeshStandardMaterial({color:i<3?'#db9c69':'#2e5d9a',roughness:.75,map:makeTexture(i<3?'cloth-a':'cloth-b',i>=3)});
   const mesh=new T.Mesh(customGeometry(shape),material);mesh.position.set((i%3-1)*2.5,1,Math.floor(i/3)*3-1.5);mesh.castShadow=true;customRoot.add(mesh);
  }
  camera.position.set(5,6,9);camera.lookAt(0,1,0);
  const customBefore=pixels(),customBatch=instanciarPersonagens(scene,[customRoot]),customAfter=pixels();let customMismatch=0;
  for(let i=0;i<customBefore.length;i++)if(Math.abs(customBefore[i]-customAfter[i])>3)customMismatch++;
  const customBatches=customBatch.batchCount;customBatch.dispose();
  renderer.dispose();target.dispose();return {oldCalls,newCalls,changedFraction:changed/(512*512),max,movedMismatch,parts:batch.sourceCount,batches:batch.batchCount,customMismatch,customBatches};
 });
 assert.ok(result.newCalls<result.oldCalls*.2,JSON.stringify(result));assert.ok(result.changedFraction<.005,JSON.stringify(result));assert.ok(result.movedMismatch<512*512*.005,JSON.stringify(result));assert.ok(result.customMismatch<512*512*.005,JSON.stringify(result));assert.equal(result.customBatches,4);assert.deepEqual(errors,[]);
 console.log('PASS: instanced bodies preserve rendered pixels, movement and changing kit colors; draw calls',result.oldCalls,'→',result.newCalls,JSON.stringify(result));
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});

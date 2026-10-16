const assert=require('node:assert/strict'),fs=require('node:fs');
const {loadDependency,browserOptions}=require('./presidencia-runtime.cjs'),{chromium}=loadDependency('playwright');
(async()=>{
 const browser=await chromium.launch(browserOptions());
 try{
  const page=await browser.newPage({viewport:{width:900,height:700}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>{if(/Shader Error|VALIDATE_STATUS/.test(m.text()))errors.push(m.text())});
  await page.route('**/*',r=>r.request().url().startsWith('http://127.0.0.1:4196/')?r.continue():r.abort());
  await page.route('**/__athlete_review',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><html><head><style>body{margin:0;background:#f4ecd6;font:16px system-ui}h1{position:absolute;top:0;left:20px;font-size:20px;background:#f4ecd6;padding:8px}canvas{display:block}</style></head><body><h1 id="caption"></h1></body></html>'}));
  await page.goto('http://127.0.0.1:4196/7a0-game-studio/__athlete_review');
  const ready=await page.evaluate(async()=>{
   const base='/7a0-game-studio/',rigUrl=base+'src/escalacao/presidencia-atleta-3d.ts';
   const source=await (await fetch(rigUrl)).text(),threeUrl=source.match(/import \* as THREE from ["']([^"']+)/)[1];
   const THREE=await import(threeUrl),{person,pose,contatoPe3D,contatoLuvas3D}=await import(rigUrl);
   const {materialGramado3D}=await import(base+'src/escalacao/presidencia-gramado-material-3d.ts');
   const {criarBolaFutebol3D}=await import(base+'src/escalacao/presidencia-bola-3d.ts');
   const scene=new THREE.Scene();scene.background=new THREE.Color('#94a89a');
   const renderer=new THREE.WebGLRenderer({antialias:true});renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(1);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.toneMapping=THREE.ACESFilmicToneMapping;document.body.append(renderer.domElement);
   const camera=new THREE.PerspectiveCamera(38,innerWidth/innerHeight,.05,100);
   scene.add(new THREE.HemisphereLight('#e8f2ff','#4f5835',2));
   const sun=new THREE.DirectionalLight('#fff3d9',3);sun.position.set(-3,6,4);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-4;sun.shadow.camera.right=4;sun.shadow.camera.top=4;sun.shadow.camera.bottom=-4;sun.shadow.normalBias=.02;scene.add(sun);
   const grass=await new THREE.TextureLoader().loadAsync(base+'estadio-partida/grass-base.webp');grass.colorSpace=THREE.SRGBColorSpace;grass.wrapS=grass.wrapT=THREE.RepeatWrapping;grass.repeat.set(26,17);grass.anisotropy=8;
   const geometry=new THREE.PlaneGeometry(8,8),uv=geometry.getAttribute('uv');
   for(let i=0;i<uv.count;i++){uv.setX(i,(uv.getX(i)*8+48.5)/105);uv.setY(i,(uv.getY(i)*8+30)/68)}
   const field=new THREE.Mesh(geometry,materialGramado3D('#c1d89c',grass));field.rotation.x=-Math.PI/2;field.position.y=.002;field.receiveShadow=true;scene.add(field);
   const athlete=person('#1b7a3d','#b9815b'),keeper=person('#d8b32c','#b9815b',true);scene.add(athlete.group,keeper.group);
   const ball=criarBolaFutebol3D();scene.add(ball);
   const idle={mx:0,mz:0,heading:0,distance:0,speed:0,kick:0,throwing:0};
   window.reviewPose=(kind,close=false)=>{
    const p={...idle,...(kind==='andar'?{distance:.3,speed:1.4}:kind==='correr'?{distance:.3,speed:5.8}:kind==='chutar'?{kick:.3}:kind==='carregar'?{distance:.3,speed:3.2,save:1}:{})};
    const body=kind==='carregar'?keeper:athlete;athlete.group.visible=body===athlete;keeper.group.visible=body===keeper;pose(body,p);
    ball.visible=kind==='chutar'||kind==='carregar';const contact=kind==='carregar'?contatoLuvas3D(p):contatoPe3D(p);ball.position.set(contact.x,contact.y,contact.z);
    camera.position.set(...(close?[.9,.38,.85]:[2.4,1.9,3.6]));camera.lookAt(...(close?[0,.15,.3]:[0,.85,0]));
    document.querySelector('#caption').textContent='Inspeção local: '+kind+' — meshes e gramado do jogo';
    renderer.render(scene,camera);return{ball:ball.position.toArray(),height:new THREE.Box3().setFromObject(body.group).getSize(new THREE.Vector3()).y};
   };
   return window.reviewPose('parado');
  });
  assert.ok(ready.height>1.75&&ready.height<1.9);
  fs.mkdirSync('test-results/futebol-3d',{recursive:true});
  for(const kind of ['parado','andar','correr','chutar','carregar']){
   const result=await page.evaluate(kind=>window.reviewPose(kind),kind);
   if(kind==='chutar')assert.ok(Math.abs(result.ball[1]-.11)<1e-8);
   await page.screenshot({path:`test-results/futebol-3d/atleta-20261016-${kind}.png`});
  }
  await page.evaluate(()=>window.reviewPose('chutar',true));
  await page.screenshot({path:'test-results/futebol-3d/atleta-20261016-contato.png'});
  assert.deepEqual(errors,[]);
  console.log('PASS: six local close-up captures of actual athlete meshes, shared grass material, foot strike and carried ball, without WebGL/runtime errors. This isolated rig review does not replace full-match/browser verification.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});

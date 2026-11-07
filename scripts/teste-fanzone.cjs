const {chromium}=require('playwright');(async()=>{
const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await b.newPage({viewport:{width:390,height:844},deviceScaleFactor:1,locale:'pt-BR'});await p.addInitScript(()=>localStorage.setItem('pc3-qualidade-v1','leve'));
p.on('pageerror',e=>console.log('pageerror',e.message));
await p.goto('http://127.0.0.1:4199/7a0-game-studio/qa-presidencia-complexo-3d.html',{waitUntil:'load'});
await p.waitForFunction(()=>!!window.complexo3D,null,{timeout:240000});
await p.evaluate(async()=>{const m=await import('/7a0-game-studio/src/escalacao/sport.ts');m.applyFanZoneBancada()});
await p.evaluate(()=>{document.querySelector('[data-complexo-3d]').scrollIntoView({block:'start'})});
await p.waitForTimeout(2500);
const shot=async n=>{const el=await p.$('.pc3-stage');await el.screenshot({path:process.argv[2]+'/fz-'+n+'.png'});console.log('shot',n,JSON.stringify(await p.evaluate(()=>{const i=window.complexo3D.inspect();return {cam:i.camera,fz:i.fanZone,view:i.view}})))}
await p.click('text=🚶 Passear');await p.waitForTimeout(3000);await shot('1-inicio');
await p.keyboard.down('Shift');await p.keyboard.down('w');await p.waitForTimeout(2500);await shot('2-andando');
for(let i=0;i<40;i++){await p.waitForTimeout(1000);const f=await p.evaluate(()=>window.complexo3D.inspect().fanZone.fase);if(f==='portao')break}await p.keyboard.up('w');await p.keyboard.up('Shift');await p.waitForTimeout(800);await shot('3-portao');
const ent=await p.$('text=Entrar no estádio');console.log('portao?',!!ent);
if(ent){await ent.click();await p.waitForTimeout(2500);await shot('4-cadeira');await p.click('text=Sentar e assistir');await p.waitForTimeout(3000);await shot('5-sentado')}
await b.close()})()

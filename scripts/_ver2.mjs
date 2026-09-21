import { chromium } from 'playwright-core'
import { spawn } from 'node:child_process'
import { mkdirSync } from 'node:fs'
const PORTA='5267'
const vite=spawn('npx',['vite','--port',PORTA],{env:{...process.env,DEPLOY_BASE:'/'},stdio:'ignore',detached:true})
for(let i=0;i<40;i++){try{const r=await fetch(`http://localhost:${PORTA}/`);if(r.ok)break}catch{}await new Promise(r=>setTimeout(r,500))}
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'})
const p=await b.newPage({viewport:{width:420,height:940},deviceScaleFactor:2})
await p.goto(`http://localhost:${PORTA}/`,{waitUntil:'domcontentloaded'});await p.waitForTimeout(1500)
const clica=async(t,ms=250)=>{const e=p.locator('button',{hasText:t}).first();if(!(await e.count()))return false;await e.click({force:true}).catch(()=>{});await p.waitForTimeout(ms);return true}
await clica('LEILÃO LEGENDS 38',1400);await clica('✕',400);await clica('BR',700);await clica('PARTIDA RÁPIDA',1400);await clica('Tocaia',600)
await p.locator('input').first().fill('Pantera Negra FC').catch(()=>{});await p.waitForTimeout(300)
for(let i=0;i<6;i++){if(await p.locator('text=Preço agora').count())break;if(!(await clica('AVANÇAR',1500))&&!(await clica('COMEÇAR',1500))&&!(await clica('Entendi',700))&&!(await clica('PULAR',700)))break}
await p.evaluate(async()=>{(await import('/src/escalacao/manto.ts')).bancadaSocio('pantera_negra')})
console.log('pregão · botão (tem que ser 0):', await p.locator('button',{hasText:'SOLTA A SUA MASCOTE'}).count())
const fim = Date.now() + 20*60*1000
let chegou=false
while(Date.now() < fim){
  if(await p.locator('text=As sobras do pregão').count()){chegou=true;break}
  await clica('Entendi',80)
  await p.waitForTimeout(700)
}
console.log('chegou no Monte:', chegou)
if(chegou){
  await p.evaluate(async()=>{(await import('/src/escalacao/manto.ts')).bancadaSocio('pantera_negra')})
  await p.waitForTimeout(1000)
  console.log('Monte · botão (tem que ser 1):', await p.locator('button',{hasText:'SOLTA A SUA MASCOTE'}).count())
  mkdirSync('mockups',{recursive:true})
  await p.screenshot({path:'mockups/mascote-monte.png',fullPage:true})
  console.log('FOTO OK')
}
await b.close();try{process.kill(-vite.pid)}catch{}

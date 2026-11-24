import {chromium} from 'playwright-core'
import {writeFileSync,mkdirSync,unlinkSync} from 'node:fs'
import {spawn} from 'node:child_process'
import assert from 'node:assert/strict'
const root='/workspace/shared/carreira-historica-mantida-20261124/telas';mkdirSync(root,{recursive:true})
const entry='scripts/.hierarquia-preview-entry.tsx',html='scripts/.hierarquia-preview.html'
writeFileSync(entry,`import React from 'react';import{createRoot}from'react-dom/client';import{EscolhaClubeOficial}from'../src/escalacao/brasil-oficial-tela';import'../src/index.css';import'../src/App.css';createRoot(document.getElementById('root')!).render(<EscolhaClubeOficial onVoltar={()=>{}} onEscolher={n=>{document.documentElement.dataset.escolhido=n}}/>);`)
writeFileSync(html,`<!doctype html><html lang="pt-BR"><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>@font-face{font-family:Oswald;src:url('/src/escalacao/fonts/oswald-latin-700-normal.woff2')}body{margin:0}</style></head><body><div id="root"></div><script type="module" src="./.hierarquia-preview-entry.tsx"></script></body></html>`)
const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','5201','--strictPort'],{env:{...process.env,DEPLOY_BASE:'/'},stdio:['ignore','pipe','pipe']})
let browser
try{
 await new Promise((resolve,reject)=>{const t=setTimeout(()=>reject(Error('servidor não iniciou')),30000);server.stdout.on('data',d=>{if(String(d).includes('Local:')){clearTimeout(t);resolve()}});server.on('exit',c=>{clearTimeout(t);reject(Error('servidor saiu '+c))})})
 browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']})
 for(const width of [390,1440]){
  const ctx=await browser.newContext({viewport:{width,height:1000},locale:'pt-BR'})
  await ctx.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.abort())
  const p=await ctx.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message))
  await p.goto('http://127.0.0.1:5201/scripts/.hierarquia-preview.html',{waitUntil:'domcontentloaded'})
  await p.getByRole('button',{name:'SÉRIE D',exact:true}).click({timeout:60000})
  await p.getByRole('button',{name:'A13',exact:true}).click();await p.getByRole('button',{name:'Portuguesa',exact:false}).filter({hasText:'Portuguesa'}).last().click()
  await p.getByText(/Cartas disponíveis do clube: força de/).waitFor({timeout:60000})
  const texto=await p.locator('aside').innerText();assert.match(texto,/salário de referência/);assert.doesNotMatch(texto,/hierarquia dos clubes|desempenho do elenco de largada/)
  await p.screenshot({path:`${root}/inicio-portuguesa-${width}.png`,fullPage:true})
  assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2),false,'sem rolagem horizontal')
  assert.equal(errors.length,0,errors.join('\n'));await ctx.close()
 }
 console.log('PASS seleção real: faixas originais e salários de referência, sem ajuste inicial, 390/1440, sem exceções ou overflow')
}finally{if(browser)await browser.close();server.kill('SIGTERM');for(const f of [entry,html])try{unlinkSync(f)}catch{}}

const {chromium}=require('playwright-core');
const assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});try{
 const p=await browser.newPage();await p.route('**/qa-camisa-vazia',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><body>'}));await p.goto((process.env.CHEGADA_ORIGIN||'http://127.0.0.1:5388')+'/qa-camisa-vazia');
 const results=await p.evaluate(async()=>{
  const {camisaApresentada,corpoApresentacao}=await import('/src/escalacao/cena-contratacao-camisa.ts');
  const load=url=>new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=reject;i.src=url});
  const body=await load('/src/escalacao/img/central-apresentacao-corpo.webp'),results=[];
  for(const name of ['romario-vasco-2000','zico-flamengo-1981','pele-santos-1962']){
   const portrait=await load('/avatars/lendas-v1/'+name+'.webp'),result=corpoApresentacao(body,camisaApresentada('Flamengo'),undefined,undefined,portrait);
   const c=document.createElement('canvas');c.width=c.height=8;const x=c.getContext('2d');x.drawImage(portrait,portrait.width*.48,portrait.height*.25,portrait.width*.04,portrait.height*.04,0,0,8,8);
   results.push({name,face:[...x.getImageData(4,4,1,1).data],hand:[...result.body.getContext('2d').getImageData(264,234,1,1).data]});
  }return results;
 });
 for(const r of results)for(let c=0;c<3;c++)assert(Math.abs(r.face[c]-r.hand[c])<4,JSON.stringify(r));
 if(process.env.CHEGADA_OUTPUT)fs.writeFileSync(process.env.CHEGADA_OUTPUT+'/pele-resultado.json',JSON.stringify(results,null,2));console.log('PASS mãos acompanham o próprio avatar: Romário, Zico e Pelé');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exit(1)});

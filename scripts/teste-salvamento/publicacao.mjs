import {chromium} from 'playwright-core'

(async()=>{
 const base=process.env.LL_SAVE_BASE||'http://127.0.0.1:5198',label=process.env.LL_SAVE_LABEL||'preview';
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 const result={base,devices:[]};
 try {for(const [name,width,height]of[['celular',390,844],['desktop',1440,1000]]){
  const c=await browser.newContext({viewport:{width,height},locale:'pt-BR'});
  await c.route('**/*',r=>r.request().url().startsWith(base+'/')&&r.request().method()==='GET'?r.continue():r.abort());
  await c.routeWebSocket('**/*',w=>w.close());
  const p=await c.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
  const response=await p.goto(base+'/',{waitUntil:'domcontentloaded',timeout:60000});
  await p.waitForFunction(()=>document.body.innerText.length>100,null,{timeout:60000});
  await p.waitForTimeout(1600);
  const text=await p.locator('body').innerText();
  await p.screenshot({path:`/workspace/shared/salvamento-seguro-20261124/publicacao-${label}-${name}.png`});
  result.devices.push({name,status:response.status(),errors,body:text.slice(0,500)});
  if(errors.length)throw Error(JSON.stringify(result));
  if(/Ops, algo deu errado/.test(text))throw Error('Error boundary visível');
  await c.close();
 }
 console.log(JSON.stringify(result,null,2));
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});

import assert from 'node:assert/strict'
import {createServer} from 'vite'
import {chromium} from 'playwright-core'
import {mkdirSync} from 'node:fs'
import {bancoCo2} from '../carreira-online/banco-isolado.mjs'
const db=await bancoCo2(),room='00000000-0000-4000-8000-000000000001',owner='00000000-0000-4000-8000-000000000002',guest='00000000-0000-4000-8000-000000000003',out='/tmp/co2-partida-20261127'
mkdirSync(out,{recursive:true})
await db.exec(`alter table esc_carr_clube add column nome text,add column assento integer,add column pronto_rodada integer;
create function esc_carr_gaveta(p_sala uuid,p_publico jsonb) returns text language plpgsql security definer as $$ begin update esc_carr_clube set publico=p_publico where sala=p_sala and user_id=auth.uid();return 'ok';end $$;
create or replace function esc_carr_comecar(p_sala uuid) returns text language plpgsql security definer as $$ begin if not esc_carr_sou_comandante(p_sala) then return 'sem_permissao';end if;update esc_carr_sala set fase='jogando',inicio_rodada=now() where id=p_sala and fase='preparo';return 'ok';end $$;`)
const rpc={esc_carr_aparelho:['p_sala','p_token','p_entrar','p_sair'],esc_carr_comando:['p_sala','p_token','p_funcao','p_args'],esc_carr_sinais_le:['p_sala','p_depois'],esc_carr_sinal_envia:['p_sala','p_token','p_pedido','p_tipo','p_dados'],esc_carr_jogo_lesao:['p_sala','p_temporada','p_rodada'],esc_carr_jogo_protocolo:[],esc_carr_jogo_foto:['p_sala','p_temporada','p_rodada','p_z','p_meta'],esc_carr_jogos_le:['p_sala','p_temporada','p_rodada','p_conhecidas'],esc_carr_jogo_troca:['p_sala','p_temporada','p_rodada','p_pedido','p_base','p_novas'],esc_carr_jogo_ritmo:['p_sala','p_auto','p_velocidade','p_pausado'],esc_carr_jogo_apito:['p_sala','p_temporada','p_rodada','p_prazo_s'],esc_carr_jogo_comecar:['p_sala','p_temporada','p_rodada'],esc_carr_gaveta:['p_sala','p_publico'],esc_carr_comecar:['p_sala']}
const errors=[];let dropReply=false,commonSeed=null
const server=await createServer({base:'/',cacheDir:'/tmp/co2-partida-vite',plugins:[{name:'qa-co2-db',configureServer(s){s.middlewares.use('/__co2_db',async(req,res)=>{try{let raw='';for await(const c of req)raw+=c;const body=JSON.parse(raw);if(body.kind==='seed'){if(body.seed&&body.uid===owner)commonSeed=body.seed;res.setHeader('Content-Type','application/json');res.end(JSON.stringify({data:commonSeed}));return}const result=await db.transaction(async tx=>{await tx.query("select set_config('request.jwt.claim.sub',$1,true)",[body.uid]);if(body.kind==='read'){if(body.table==='esc_carr_sala'){const row=(await tx.query('select * from esc_carr_sala where id=$1',[room])).rows[0];return{data:body.cols==='mundo'?{mundo:row.mundo}:{...row,codigo:'QA1234',nome:'Carreira de teste',vice:null,versao:''}}}if(body.table==='esc_carr_clube')return{data:(await tx.query('select * from esc_carr_clube where sala=$1 order by assento',[room])).rows};return{data:null}}const keys=rpc[body.name];if(!keys)return{data:body.name.includes('presenca')?null:[]};const args=keys.map(k=>k==='p_conhecidas'?body.args[k]:typeof body.args[k]==='object'&&body.args[k]!==null?JSON.stringify(body.args[k]):body.args[k]??null);const rows=await tx.query(`select ${body.name}(${args.map((_,i)=>'$'+(i+1)).join(',')}) as r`,args);if(body.name==='esc_carr_jogo_troca')console.log('TROCA',body.uid,body.args.p_base,rows.rows[0].r);return{data:rows.rows[0].r}});if(dropReply&&(body.name==='esc_carr_jogo_troca'||body.name==='esc_carr_comando'&&body.args.p_funcao==='esc_carr_jogo_troca')){dropReply=false;res.statusCode=503;res.end(JSON.stringify({data:null,error:{message:'resposta perdida'}}));return}res.setHeader('Content-Type','application/json');res.end(JSON.stringify(result))}catch(e){errors.push(e.message);res.statusCode=500;res.end(JSON.stringify({error:{message:e.message}}))}})},enforce:'pre',transform(code,id){if(!id.endsWith('/src/escalacao/pyramidseason.tsx'))return;return code.replace('const calBarra = (() => {',`Object.assign(window,{qaAba:escolheAba,qaLive:{tab,round,minute:minutoJogo,sub:subPossivel,data:dadosSub,active:onlinePartida.active,game:onlinePartida.game,commands:aoVivoMeu,notice:onlinePartida.notice,slot:onlinePartida.slot,matches:live.matches},qaSend:onlinePartida.send});const calBarra = (() => {`)}}],server:{host:'127.0.0.1',port:5497,strictPort:true,hmr:false,watch:null}})
await server.listen()
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--mute-audio']})
try{
 for(const modo of ['livre','dinamica']){
  commonSeed=null
  await db.exec('delete from esc_carr_aparelho;delete from esc_carr_sinal')
  await db.query("insert into esc_carr_sala(id,dono,comandante,temporada,rodada,fase,mundo,auto) values($1,$2,$2,1,0,'preparo',$3,false) on conflict(id) do update set fase='preparo',rodada=0,mundo=excluded.mundo,pausado=false,velocidade=1",[room,owner,JSON.stringify({ordem:[owner,guest],modo,m2:1,aoVivoDesde:1})])
  await db.query('delete from esc_carr_clube where sala=$1',[room]);await db.query('delete from esc_carr_jogo where sala=$1',[room])
  await db.query("insert into esc_carr_clube(sala,user_id,assento,nome) values($1,$2,0,'Dono FC'),($1,$3,1,'Amigo FC')",[room,owner,guest])
  const ctx=await browser.newContext({viewport:{width:390,height:950}})
  await ctx.addInitScript(()=>{localStorage.setItem('bl_lang','pt');const get=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(t,...a){return String(t).includes('webgl')?null:get.call(this,t,...a)}})
  await ctx.route('**/*',r=>r.request().url().startsWith('http://127.0.0.1:5497/')?r.continue():r.abort());await ctx.routeWebSocket('**/*',w=>w.close())
  const pages=[]
  for(const actor of [0,1]){const p=await ctx.newPage();p.setDefaultTimeout(60000);p.on('pageerror',e=>{errors.push(e.message);console.log('PAGEERROR',e.stack)});await p.goto(`http://127.0.0.1:5497/scripts/teste-co2-partida/?actor=${actor}`,{waitUntil:'domcontentloaded'});await p.waitForFunction(()=>!!window.qaLive);await p.evaluate(()=>qaAba('jogos'));pages.push(p)}
  const[h,g]=pages;await g.setViewportSize({width:1440,height:950})
  await h.getByRole('button',{name:'▶️ Começar agora',exact:true}).click()
  await h.waitForFunction(()=>qaLive.game&&qaLive.sub);await g.waitForFunction(()=>qaLive.game&&qaLive.sub)
  await h.evaluate(()=>qaRpc('esc_carr_jogo_ritmo',{p_sala:qaState.co2.sala,p_auto:false,p_velocidade:1,p_pausado:true}))
  await db.query('update esc_carr_jogo set elapsed_ms=10000 where sala=$1',[room]);await h.evaluate(()=>qaSync())
  await g.waitForFunction(()=>qaLive.minute>=10&&qaLive.game.pausado)
  await h.getByRole('button',{name:/⚙️ Tempos/}).click();await h.locator('[data-co2-speed="2"]').click();await g.waitForFunction(()=>qaLive.game.velocidade===2);await h.locator('[data-co2-speed="1"]').click();await g.waitForFunction(()=>qaLive.game.velocidade===1);assert.equal(await g.locator('[data-co2-speed]').count(),0,'só o dono muda velocidade')
  const fixed=await Promise.all(pages.map(p=>p.evaluate(()=>JSON.stringify({lineup:qaState.careerLineup,tactics:qaState.careerTactics}))))
  for(const p of pages){await p.getByRole('button',{name:/Substituir.*0\/3/}).first().click();await p.getByRole('region',{name:'Em campo agora'}).waitFor();for(let k=0;k<3;k++){const pair=await p.evaluate(()=>{const d=qaLive.data;for(const sa of d.emCampo){const en=d.reservas.find(c=>c.pos===sa.pos);if(en)return{sai:sa.name,entra:en.name}}});await p.getByRole('region',{name:'Em campo agora'}).getByRole('button').filter({hasText:pair.sai}).first().click();if(k===0)dropReply=true;await p.getByRole('region',{name:'Reservas',exact:true}).getByRole('button').filter({hasText:pair.entra}).first().click();try{await p.waitForFunction(k=>qaLive.commands.filter(c=>c.sai).length===k+1,k)}catch(e){console.log('DEBUG',await p.evaluate(()=>({notice:qaLive.notice,commands:qaLive.commands,slot:qaLive.slot,data:qaLive.data})));throw e};await p.getByText(`TROCAS ${k+1}/3`,{exact:true}).waitFor()}await p.getByRole('button',{name:'🔥 Ataque',exact:true}).click();await p.waitForFunction(()=>qaLive.commands.some(c=>c.tactic==='ataque'));await p.screenshot({path:`${out}/${modo}-${p===h?'host-390':'guest-1440'}-trocas.png`,fullPage:true})}
  const originals=await Promise.all(pages.map(p=>p.evaluate(()=>JSON.stringify({lineup:qaState.careerLineup,tactics:qaState.careerTactics}))))
  assert.deepEqual(originals,fixed,'troca não muda XI/tática permanentes')
  const stateRows=(await db.query('select comandos from esc_carr_jogo')).rows[0].comandos;assert.equal(stateRows['0'].filter(c=>c.sai).length,3);assert.equal(stateRows['1'].filter(c=>c.sai).length,3)
  await g.reload({waitUntil:'domcontentloaded'});await g.waitForFunction(()=>window.qaLive&&qaLive.game&&qaLive.commands.filter(c=>c.sai).length===3);await g.evaluate(()=>qaAba('jogos'))
  const signatures=await Promise.all(pages.map(p=>p.evaluate(()=>Object.values(qaLive.matches).flat().map(m=>[m.h,m.a,m.hg,m.ag,m.goals]).sort((a,b)=>a[0].localeCompare(b[0])))))
  assert.deepEqual(signatures[0],signatures[1],'quem voltou recebe mesmos jogos e autores')
  await db.query('update esc_carr_jogo set elapsed_ms=90000 where sala=$1',[room]);await h.evaluate(()=>qaSync());await h.waitForFunction(()=>qaLive.game?.encerrado);await g.waitForFunction(()=>qaLive.game?.encerrado)
  assert.equal((await db.query('select rodada from esc_carr_sala where id=$1',[room])).rows[0].rodada,1,'apito avança uma vez')
  console.log(`✅ ${modo}: dono 390/convidado 1440, três trocas cada, tática, resposta perdida idempotente, pausa e retorno com mesmos resultados; XI fixo preservado`)
  await ctx.close()
 }
 assert.deepEqual(errors,[])
}finally{await browser.close();await server.close();await db.close()}

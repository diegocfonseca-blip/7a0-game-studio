import assert from 'node:assert/strict'
import {bancoCo2} from './banco-isolado.mjs'
const db=await bancoCo2(),room='00000000-0000-4000-8000-000000000001',owner='00000000-0000-4000-8000-000000000002',guest='00000000-0000-4000-8000-000000000003',t1='10000000-0000-4000-8000-000000000001',t2='10000000-0000-4000-8000-000000000002'
const uid=id=>db.query("select set_config('request.jwt.claim.sub',$1,false)",[id])
const rpc=async(n,...a)=>(await db.query(`select ${n}(${a.map((_,i)=>'$'+(i+1)).join(',')}) r`,a)).rows[0].r
try{
 await db.query("insert into esc_carr_sala(id,dono,comandante,temporada,rodada,fase,mundo) values($1,$2,$2,1,0,'preparo',$3)",[room,owner,JSON.stringify({ordem:[owner,guest]})]);await db.query('insert into esc_carr_clube values($1,$2,null),($1,$3,null)',[room,owner,guest])
 await uid(owner)
 assert.equal(await rpc('esc_carr_aparelho',room,t1,true,false),'ok')
 assert.equal(await rpc('esc_carr_aparelho',room,t2,true,false),'ocupado','outro aparelho não obtém escrita simultânea')
 assert.equal(await rpc('esc_carr_privado_guarda',room,t2,'{"z":"velho"}'),'outro_aparelho')
 assert.equal(await rpc('esc_carr_privado_guarda',room,t1,'{"z":"novo"}'),'ok')
 await assert.rejects(db.query("insert into esc_carr_privado values($1,$2,'{}',now()) on conflict(sala,user_id) do update set dados='{}'",[room,owner]),/carreira_aberta_em_outro_aparelho/)
 assert.equal(await rpc('esc_carr_comando',room,t2,'esc_carr_comecar',JSON.stringify({p_sala:room})),'outro_aparelho')
 assert.equal(await rpc('esc_carr_comando',room,t1,'esc_carr_comecar',JSON.stringify({p_sala:room})),'ok')
 assert.equal(await rpc('esc_carr_comando',room,t1,'pg_sleep',JSON.stringify({p_sala:room})),'sem_permissao')
 const event=async(token,id,type,data)=>rpc('esc_carr_sinal_envia',room,token,`20000000-0000-4000-8000-${String(id).padStart(12,'0')}`,type,JSON.stringify(data))
 await uid(guest);assert.equal(await rpc('esc_carr_aparelho',room,t2,true,false),'ok')
 assert.equal(await event(t2,1,'estado',{z:'fake'}),'sem_permissao')
 assert.equal(await event(t2,2,'acao',{type:'MONTE_PICK',mgrId:0,cardId:'x'}),'sem_permissao')
 assert.equal(await event(t2,3,'acao',{type:'MONTE_PICK',mgrId:1,cardId:'x'}),'ok')
 assert.equal(await event(t2,3,'acao',{type:'MONTE_PICK',mgrId:1,cardId:'x'}),'ok')
 assert.deepEqual((await rpc('esc_carr_sinais_le',room,0)).acoes,[],'convidado não recebe envelope de outro')
 await uid(owner);let signals=await rpc('esc_carr_sinais_le',room,0);assert.equal(signals.acoes.length,1);assert.equal(signals.acoes[0].autor,guest)
 assert.equal(await event(t1,4,'estado',{z:'foto1'}),'ok');assert.equal(await event(t1,5,'estado',{z:'foto2',secreto:{pendingEnvelopes:{0:[{cardId:'x',amount:7}]}}}),'ok')
 assert.equal((await rpc('esc_carr_sinais_le',room,0)).estado.dados.z,'foto2');
 await uid(guest);assert.equal((await rpc('esc_carr_sinais_le',room,0)).estado.dados.secreto,undefined,'envelopes secretos não são expostos ao convidado');await uid(owner);assert.equal((await rpc('esc_carr_sinais_le',room,0)).estado.dados.secreto.pendingEnvelopes['0'][0].amount,7,'dono recupera envelope após fechar navegador');assert.equal((await db.query("select count(*) n from esc_carr_sinal where tipo='estado'")).rows[0].n,1)
 await rpc('esc_carr_aparelho',room,t1,false,true);assert.equal(await rpc('esc_carr_aparelho',room,t2,true,false),'ok')
 assert.equal(await rpc('esc_carr_privado_guarda',room,t1,'{"z":"envio atrasado"}'),'outro_aparelho')
 await db.exec("update esc_carr_aparelho set ate=clock_timestamp()-interval '1 second'")
 assert.equal(await rpc('esc_carr_aparelho',room,t2,false,false),'reabrir','depois de expirar, não retoma estado local velho automaticamente')
 await db.exec('set role anon');await assert.rejects(rpc('esc_carr_sinais_le',room,0),/permission denied/)
 console.log('✅ Aparelhos e leilão: escritor único, expiração, envio atrasado recusado, funções limitadas, origem autenticada, identidade própria, estado só do dono, recibo sem duplicação e envelopes privados.')
}finally{await db.close()}

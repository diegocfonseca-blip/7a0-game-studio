import assert from 'node:assert/strict'
import {bancoCo2} from './banco-isolado.mjs'
const db=await bancoCo2(),room='00000000-0000-4000-8000-000000000001',owner='00000000-0000-4000-8000-000000000002',guest='00000000-0000-4000-8000-000000000003'
const uid=id=>db.query("select set_config('request.jwt.claim.sub',$1,false)",[id])
const rpc=async(n,...a)=>(await db.query(`select ${n}(${a.map((_,i)=>'$'+(i+1)).join(',')}) r`,a)).rows[0].r
let req=0
const change=(r,base,x)=>rpc('esc_carr_jogo_troca',room,1,r,`20000000-0000-4000-8000-${String(++req).padStart(12,'0')}`,base,JSON.stringify(x))
const xi=['g','l0','l1','z0','z1','m0','m1','m2','a0','a1','a2'],pos={g:'GOL',g2:'GOL',l0:'LAT',l1:'LAT',l2:'LAT',z0:'ZAG',z1:'ZAG',z2:'ZAG',m0:'MEI',m1:'MEI',m2:'MEI',m3:'MEI',a0:'ATA',a1:'ATA',a2:'ATA',a3:'ATA'},slot={partida:'jogo',xi,pos,formation:'4-3-3',allowed:{'4-3-3':{GOL:1,LAT:2,ZAG:2,MEI:3,ATA:3}},blocked:[]}
const foto=(r,meta)=>rpc('esc_carr_jogo_foto',room,1,r,'foto',JSON.stringify(meta))
try{
 await db.query("insert into esc_carr_sala(id,dono,comandante,temporada,rodada,fase,mundo) values($1,$2,$2,1,0,'virada',$3)",[room,owner,JSON.stringify({ordem:[owner,guest]})]);await db.query('insert into esc_carr_clube values($1,$2,null),($1,$3,null)',[room,owner,guest]);await uid(owner)
 assert.equal(await foto(100,{0:slot,1:slot,_chave:'copa:quartas:ida'}),'ok')
 assert.equal(await foto(100,{0:slot,1:slot,_chave:'copa:quartas:ida'}),'ok')
 assert.equal((await db.query('select count(*) n from esc_carr_jogo')).rows[0].n,1,'retentativa não cria outra perna')
 assert.equal(await foto(100,{0:slot,1:slot,_chave:'copa:quartas:volta'}),'ok')
 await uid(guest);assert.equal(await change(100,0,[{sai:'m0',entra:'m3'}]),'ok')
 await uid(owner);assert.equal(await change(100,0,[{sai:'a0',entra:'a3'}]),'ok')
 assert.equal((await rpc('esc_carr_jogos_le',room,1,0)).jogos.length,2,'quem retorna descobre também as fichas das copas')
 assert.equal((await db.query('select comandos from esc_carr_jogo where rodada=101')).rows[0].comandos['0'],undefined,'ida e volta independentes')
 await db.exec("update esc_carr_sala set fase='jogando',rodada=0")
 const lesao={season:1,round:0,mgrId:1,cardId:'m0',minute:60,rodadas:2,status:'programada'}
 assert.equal(await foto(0,{0:slot,1:{...slot,lesao}}),'ok')
 assert.equal(await rpc('esc_carr_jogo_lesao',room,1,0),'ok');assert.deepEqual((await db.query('select clinica from esc_carr_jogo where rodada=0')).rows[0].clinica,{})
 await db.exec('update esc_carr_jogo set elapsed_ms=60000 where rodada=0')
 assert.equal(await rpc('esc_carr_jogo_lesao',room,1,0),'ok')
 let game=(await db.query('select * from esc_carr_jogo where rodada=0')).rows[0];assert(game.pausado);assert.equal(game.clinica['1'].cardId,'m0')
 assert.equal(await rpc('esc_carr_jogo_ritmo',room,true,2,false),'clinica','dono não contorna a decisão clínica')
 await uid(guest)
 assert.equal(await change(0,0,[{sai:'a0',entra:'a3',injury:true}]),'invalido','não inventa outro lesionado')
 assert.equal(await change(0,0,[{sai:'m0',entra:'m3',injury:true}]),'ok')
 game=(await db.query('select * from esc_carr_jogo where rodada=0')).rows[0];assert.deepEqual(game.clinica,{});assert.equal(game.pausado,false);assert.equal(game.comandos['1'][0].injury,true)
 // Com as três trocas usadas, sai sem inventar reserva; a regra de posições aceita dez em campo.
 await uid(owner);await db.exec('update esc_carr_sala set rodada=1')
 assert.equal(await foto(1,{0:{...slot,lesao:{...lesao,round:1,mgrId:0,cardId:'g'}},1:slot}),'ok')
 assert.equal(await change(1,0,[{sai:'a0',entra:'a3'},{sai:'m0',entra:'m3'},{sai:'l0',entra:'l2'}]),'ok')
 await db.exec('update esc_carr_jogo set elapsed_ms=60000 where rodada=1')
 await rpc('esc_carr_jogo_lesao',room,1,1)
 assert.equal(await change(1,3,[{sai:'g',injury:true,emergencyKeeper:'z0'}]),'ok')
 assert.equal(await change(1,4,[{tactic:'ataque'}]),'ok','pode ajustar tática com dez')
 // Dono encerra a espera clínica de quem saiu usando apenas um reserva real da ficha.
 await db.exec('update esc_carr_sala set rodada=2')
 assert.equal(await foto(2,{0:slot,1:{...slot,lesao:{...lesao,round:2}}}),'ok')
 await db.exec('update esc_carr_jogo set elapsed_ms=60000 where rodada=2');await rpc('esc_carr_jogo_lesao',room,1,2)
 await db.exec("update esc_carr_jogo set clinica=jsonb_set(clinica,'{1,abriu}',to_jsonb((clock_timestamp()-interval '65 seconds')::text)) where rodada=2")
 assert.equal(await rpc('esc_carr_jogo_lesao',room,1,2),'ok')
 game=(await db.query('select * from esc_carr_jogo where rodada=2')).rows[0];assert.deepEqual(game.clinica,{});assert.equal(game.comandos['1'][0].entra,'m3');assert.equal(game.pausado,false)
 // Navegador suspenso não pula a lesão nem encerra o jogo antes da decisão.
 await db.exec('update esc_carr_sala set rodada=3');assert.equal(await foto(3,{0:slot,1:{...slot,lesao:{...lesao,round:3}}}),'ok');await db.exec('update esc_carr_jogo set elapsed_ms=duration_ms*2 where rodada=3');assert.equal(await rpc('esc_carr_jogo_apito',room,1,4,60),'aguarde');assert.equal((await db.query('select pausado from esc_carr_jogo where rodada=3')).rows[0].pausado,true);
 console.log('✅ Copas e clínica: ida/volta isoladas, dois clubes trocam, retorno, lesão marcada só no minuto, pausa compartilhada, decisão autenticada, dez em campo e goleiro de emergência, ausência com reposição real e retomada.')
}finally{await db.close()}

import assert from 'node:assert/strict'
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs'
import ts from 'typescript'
import {CriacaoSala,ErroPrazoCriacao,leCriacaoPendente,gravaCriacaoPendente,limpaCriacaoPendente,novoIdCriacao} from '../../src/escalacao/criacao-sala.ts'
const src=readFileSync('src/escalacao/lobby.tsx','utf8'),a=src.indexOf('  async function createRoom() {'),b=src.indexOf('\n  // lista pública de salas',a),body=ts.transpileModule(src.slice(a,b),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.None}}).outputText.replace(/^"use strict";\s*/,'').trim()
const checks=[],ok=(c,label)=>{assert.ok(c,label);checks.push(label)},PENDING=new Promise(()=>{}),tick=ms=>new Promise(r=>setTimeout(r,ms)),uid='11111111-1111-4111-8111-111111111111'
const memory=()=>{const data=new Map;return{getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k),clear:()=>data.clear()}}
globalThis.localStorage=memory();globalThis.sessionStorage=memory()
const reset=()=>{localStorage.clear();sessionStorage.clear()}
class Curta extends CriacaoSala{constructor(){super(25)}}
let code=10000
function scenario(fault='none',server={rooms:[],seats:[]},extra={}){
 const local={loading:false,error:'',phase:'menu',calls:[],settled:false,modals:[],criacaoRef:{current:null}}
 const builder=(table,rpc,args)=>{
  const q={table,rpc,args,filters:[],single:false};let signal
  const proxy=new Proxy({}, {get(_,key){if(key==='then')return(resolve,reject)=>Promise.resolve().then(async()=>{
   local.calls.push({table,rpc})
   if(fault==='throw-read'&&!rpc)throw Error('rede interrompida')
   if(fault==='hang-read'&&!rpc)return PENDING
   if(rpc){
    if(fault==='quota')return{data:null,error:{message:'LIMITE_SALA_DIA',code:'P0001'}}
    if(fault==='permission')return{data:null,error:{message:'negado',code:'42501'}}
    let room=server.rooms.find(r=>r.id===args.p_id)
    if(!room){room={id:args.p_id,code:args.p_code,host_id:uid,status:'waiting',max_players:args.p_max_players,game_state:args.p_game_state};server.rooms.push(room);server.seats.push({room_id:room.id,user_id:uid,player_index:0})}
    if(fault==='lost-response')return PENDING
    return{data:room,error:null}
   }
   if(q.filters.some(([k])=>k==='id'))return{data:server.rooms.find(r=>q.filters.every(([k,v])=>r[k]===v))??null,error:null}
   if(q.filters.some(([k])=>k==='code'))return{data:server.rooms.find(r=>q.filters.every(([k,v])=>r[k]===v))??null,error:null}
   return{data:server.rooms.map(r=>({code:r.code,mode:r.game_state?.mode,screen:r.game_state?.screen})),count:0,error:null}
  }).then(resolve,reject);return(...params)=>{if(key==='eq')q.filters.push(params);if(key==='abortSignal')signal=params[0];if(key==='single'||key==='maybeSingle')q.single=true;return proxy}}})
  return proxy
 }
 const values={user:{id:uid,user_metadata:{display_name:'Conta de teste'}},criacaoRef:local.criacaoRef,CriacaoSala:Curta,ErroPrazoCriacao,leCriacaoPendente,gravaCriacaoPendente,limpaCriacaoPendente,novoIdCriacao,
 setLoading:v=>local.loading=v,setRoomError:v=>local.error=v,setRoom:r=>local.room=r,setIsHost:v=>local.isHost=v,setPhase:v=>local.phase=v,setResumeRoom:r=>local.resume=r,
 roomMode:'rapido',supabase:{from:t=>builder(t),rpc:(fn,args)=>builder(undefined,fn,args)},randCode:()=>`T${code++}`,roomName:'',cutName:s=>s,nameOf:()=> 'Teste',getLang:()=> 'pt',getSport:()=> 'futebol',tr:pt=>pt,formation:'4-3-3',rapidoDeck:'br',rapidoCopaMode:'liga',tagAtual:()=> 'leilao',regionalId:()=>null,MAX_PLAYERS:20,MAX_PLAYERS_CHAMPIONS:36,meusTemas:[],nomeOfensivo:()=>false,registraAparelho:async()=>{if(fault==='hang-device')await PENDING},saveRoom:()=>{},setSalasPresas:()=>{},setLimiteDia:v=>local.modals.push(['limite',v]),logApoio:()=>{},console:{error:()=>{}},...extra}
 const scope=new Proxy(values,{has:()=>true,get(t,k){if(k===Symbol.unscopables)return undefined;if(k in t)return t[k];if(k in globalThis)return globalThis[k];return false}})
 const create=new Function('scope',`with(scope){return (${body})}`)(scope)
 return{local,server,create,values}
}
try{
for(const fault of ['none','hang-read','throw-read','hang-device','lost-response','quota','permission']){
 reset();const s=scenario(fault);await s.create();ok(!s.local.loading,`${fault}: botão destrava`)
 if(fault==='none'){ok(s.local.phase==='waiting'&&s.server.rooms.length===1&&s.server.seats.length===1,'Sala confirmada com o dono');ok(leCriacaoPendente(uid,'leilao')===null,'Confirmação limpa só a tentativa concluída')}
 else if(fault==='quota'){ok(s.local.modals.some(x=>x[0]==='limite'&&x[1]),'Preserva aviso da cota grátis')}
 else ok(s.local.error.length>0,`${fault}: erro explicado`)
 if(['hang-read','throw-read','hang-device','quota','permission'].includes(fault))ok(s.server.rooms.length===0,`${fault}: nenhuma sala fantasma`)
 if(fault==='lost-response'){
  ok(s.server.rooms.length===1&&s.server.seats.length===1,'Resposta perdida não deixa sala sem dono')
  const id=leCriacaoPendente(uid,'leilao').id,reload=scenario('none',s.server);await reload.create()
  ok(reload.local.phase==='waiting'&&reload.local.room.id===id,'Após atualizar recupera a mesma tentativa')
  ok(s.server.rooms.length===1&&s.server.seats.length===1,'Repetir não duplica sala nem dono')
 }
}
reset();const double=scenario();await Promise.all([double.create(),double.create()]);ok(double.server.rooms.length===1,'Clique duplo executa uma só criação')
reset();const pending={v:1,id:novoIdCriacao(),code:'ABC234',at:Date.now()};gravaCriacaoPendente(uid,'leilao',pending)
const started=scenario('none',{rooms:[{id:pending.id,code:pending.code,host_id:uid,status:'started',game_state:{__game:'leilao',round:18}}],seats:[]});await started.create();ok(started.local.resume?.game_state.round===18,'Retoma sem recomeçar partida iniciada');ok(!started.local.calls.some(x=>x.rpc),'Partida iniciada não recebe gravação de criação')
reset();const localOriginal=globalThis.localStorage,sessionOriginal=globalThis.sessionStorage;globalThis.localStorage={getItem(){throw Error('cheio')},setItem(){throw Error('cheio')},removeItem(){}}
ok(gravaCriacaoPendente(uid,'leilao',pending)&&leCriacaoPendente(uid,'leilao').id===pending.id,'Fallback em sessionStorage quando cache local enche')
globalThis.sessionStorage={getItem(){throw Error('bloqueado')},setItem(){throw Error('bloqueado')},removeItem(){}};const full=scenario();await full.create();ok(full.server.rooms.length===0&&!full.local.loading&&full.local.error.includes('armazenamento'),'Armazenamento indisponível é explicado antes do POST');globalThis.localStorage=localOriginal;globalThis.sessionStorage=sessionOriginal
reset();gravaCriacaoPendente(uid,'leilao',pending);ok(leCriacaoPendente('outra-conta','leilao')===null&&leCriacaoPendente(uid,'basquete')===null,'Tentativa isolada por conta e jogo')
for(const [label,extra,expected] of [['Carreira',{roomMode:'carreira',canCareer:true,careerDeck:'br',careerRivals:3,careerRivalPicks:[]},{mode:'carreira'}],['Bafo',{roomMode:'elenco',salaElenco:true},{mode:'elenco',bafoSemCarta:true}],['Copa do Mundo',{roomMode:'mundo',mundoOn:true},{mode:'mundo'}],['Liga da Turma',{roomMode:'liga',ligaOn:true,canLiga:true,ligaPw:'teste',ligaData:'2026-12-01',ligaHora:'20:00',hashPw:()=> 'hash',limiteCriarLigas:()=>4,meuTierLegado:()=> 'ouro',direitosLiga:{}},{mode:'liga',ligaFechada:true}],['Liga Draft',{roomMode:'liga',ligaOn:true,canLiga:true,ehDraft:true,ligaPw:'teste',ligaData:'2026-12-01',ligaHora:'20:00',hashPw:()=> 'hash',limiteCriarLigas:()=>4,meuTierLegado:()=> 'ouro',direitosLiga:{}},{mode:'liga',ligaDraft:true}],['Regional',{rapidoCopaMode:'liga_nordeste',regionalId:()=> 'nordeste'},{regionalNaLiga:'nordeste'}],['Basquete',{getSport:()=> 'basquete',rapidoCopaMode:'liga_euro'},{sport:'basquete'}],['Brasil',{},{}],['Clubes',{clubesOn:true,rapidoClubes:true},{clubes:true}],['Pregão',{pregaoAbertoOk:true,rapidoPregao:true},{pregaoAberto:true}],['Único',{envUnicoOk:true,rapidoEnvUnico:true},{envUnico:true}],['Tocaia',{rapidoHolandes:true},{holandes:true}],['Duplas',{roomDuplas:true},{duplasMode:true}],['Libertadores',{rapidoCopaMode:'liberta'},{copaMode:'liberta'}],['Mundial',{rapidoCopaMode:'liga_mundo'},{mundoNaLiga:true}],['Euro',{rapidoCopaMode:'liga_euro'},{euroNaLiga:24}],['10 times',{tam10Vale:true},{tamanhoLiga:10}],['19 rodadas',{turnoVale:true},{turnoUnico:true}],['Relâmpago',{rapidoCopaMode:'relampago',relampagoChave:16},{copaMode:'relampago',relampagoChave:16}],['Só Champions',{rapidoCopaMode:'champions'},{copaMode:'champions'}]]){
 reset();const s=scenario('none',undefined,extra);await s.create();ok(s.local.phase==='waiting',`${label}: fluxo confirma`);for(const[k,v]of Object.entries(expected))assert.deepEqual(s.local.room.game_state[k],v);checks.push(`${label}: regras conservadas`)
}
console.log('PASS criação real do lobby:',checks.length,'verificações')
}finally{mkdirSync('/workspace/shared/custos-salas-20261110',{recursive:true});writeFileSync('/workspace/shared/custos-salas-20261110/testes-criacao.json',JSON.stringify({checks,realAccounts:false},null,2))}

import fs from 'node:fs'
import vm from 'node:vm'
import assert from 'node:assert/strict'
import ts from 'typescript'
const module={}
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/escalacao/football-round-status.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{exports:module})
const status=module.footballRoundStatus
const league=Array.from({length:5},(_,id)=>({id,name:`Time ${id}`}))
const fixtures=[[[0,1],[2,3]],[[1,2],[3,4]],[[4,0],[1,3]]]
const result=(h,a)=>({homeId:h,awayId:a,hg:0,ag:0,highlights:[]})
const s={league,fixtures,round:2,lastResults:[result(1,2),result(3,4)]},before=JSON.stringify(s)
const bye=status(s,0)
assert.equal(bye.kind,'bye','folga vem da rodada corrente (round-1)')
assert.equal(bye.next.round,3);assert.equal(bye.next.opponent,'Time 4');assert.equal(bye.next.home,false)
assert.equal(bye.others.length,2)
assert.equal(status({...s,round:1,lastResults:[result(0,1),result(2,3)]},0).kind,'playing','folga futura não esconde partida atual')
assert.equal(status({...s,round:1,lastResults:[result(2,3)]},0).kind,'unavailable','resultado ausente em jogo previsto não é folga')
assert.equal(status({...s,round:0,lastResults:[]},0).kind,'waiting','antes da rodada não inventa folga')
assert.equal(status({...s,league:league.concat({id:5,name:'Time 5'})},0).kind,'unavailable','liga par com calendário incompleto não recebe aviso falso de folga')
assert.equal(status({...s,fixtures:[[],[],[]]},0).kind,'unavailable','calendário vazio não prova folga')
assert.equal(status({...s,round:4},0).next,undefined,'não inventa adversário depois do fim')
assert.equal(JSON.stringify(s),before,'leitura não altera calendário, resultados, IDs ou estado')
console.log('PASS: rodada atual x próxima, folga ímpar, espera, resultado ausente, calendário incompleto e leitura sem mutação.')

import assert from 'node:assert/strict'
import {readFileSync,writeFileSync} from 'node:fs'
const base='/tmp/auditoria-br-oficial-20261127/',antes=JSON.parse(readFileSync(base+'referencia/resultados.json')),depois=JSON.parse(readFileSync(base+'conservacao/resultados.json')),relatorio=[]
assert.equal(antes.length,7);assert.equal(depois.length,7)
for(const a of antes){
 const d=depois.find(x=>x.test.name===a.test.name)
 assert(d);assert.deepEqual(a.fail,[]);assert.deepEqual(d.fail,[])
 assert.deepEqual(d.resultado,a.resultado,`${a.test.name}: mesmos placares, autores, tabelas e agenda`)
 relatorio.push({caso:a.test.name,placaresTabelasAgendaIguais:true,erros:[]})
}
writeFileSync(base+'conservacao-resultados.json',JSON.stringify(relatorio,null,2))
console.log('✅ Sete carreiras: todos os resultados, gols, tabelas e agenda iguais à referência publicada.')

// Usa o bundler já instalado no projeto; não baixa ferramentas para rodar o teste.
import {build} from 'rolldown'
import {mkdtempSync,rmSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {spawnSync} from 'node:child_process'
const dir=mkdtempSync(join(tmpdir(),'leilao-penaltis-'))
try{
 const file=join(dir,'verifica.cjs')
 await build({input:'scripts/teste-penaltis-campo/verifica.ts',platform:'node',output:{file,format:'cjs'}})
 const result=spawnSync(process.execPath,[file],{stdio:'inherit'})
 process.exitCode=result.status??1
}finally{rmSync(dir,{recursive:true,force:true})}

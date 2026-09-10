import fs from 'node:fs'
import vm from 'node:vm'
import assert from 'node:assert/strict'
import ts from 'typescript'
const catalog=JSON.parse(fs.readFileSync('src/escalacao/legend-avatars.json','utf8'))
const exports={}
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/escalacao/legend-avatars.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText,{exports,require:()=>catalog})
assert.equal(catalog.length,156)
const paths=new Set()
for(const p of catalog){
 assert.equal(exports.legendAvatar(p.name,p.club,p.year)?.src,p.src)
 assert.equal(exports.legendAvatar(p.name,p.club,p.year+100),undefined)
 assert.equal(exports.legendAvatar(p.name,'Outro Clube',p.year),undefined)
 assert.ok(fs.existsSync('public'+p.src),p.src)
 assert.ok(fs.statSync('public'+p.src).size<=60000,p.src)
 paths.add(p.src)
}
assert.equal(paths.size,156)
for(const [name,club,year] of [
 ['Gérson Canhotinha de Ouro','Botafogo',1968],['Cerezo','Atlético-MG',1980],["Samuel Eto'o",'Barcelona',2006],
 ['Rio Ferdinand','Man United',2008],['Petr Čech','Chelsea',2005],['Patrick Vieira','Arsenal',2001],
 ['Edwin van der Sar','Man United',2009],['Eden Hazard','Chelsea',2015],['Ademir da Guia','Palmeiras',1972],
])assert.ok(exports.legendAvatar(name,club,year),name)
assert.equal(exports.legendAvatar('Pessoa sem arte','Palmeiras',1972),undefined)
assert.equal(exports.legendAvatar('David Beckham'),undefined)
console.log('PASS 156 identities, exact seasons, aliases, real assets, <=60KB and legacy fallback')

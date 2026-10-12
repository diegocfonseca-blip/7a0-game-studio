import assert from 'node:assert/strict'
await import('./testa-presidencia-evolucao.mjs')
const {estadioCompletoNaJanela,estadioCompletoNaAerea}=await import('../src/escalacao/presidencia-estadio-completo.ts')
const {camadasEstadio}=await import('../src/escalacao/presidencia-estadio-camadas.ts')
const full={inv:{grama:30,geral:40,cadeiras:90,visitante:120,camarote:150},ext:['refl','telao','cober','retratil']}
assert.equal(estadioCompletoNaJanela(full),true)
assert.equal(estadioCompletoNaAerea(full),false,'The aerial raster still cannot grant unowned businesses')
assert.deepEqual(camadasEstadio(full,'window'),[],'Full window raster is not covered by duplicate partial roof pieces')
for(const key of Object.keys(full.inv))assert.equal(estadioCompletoNaJanela({...full,inv:{...full.inv,[key]:full.inv[key]-.001}}),false)
for(const key of full.ext)assert.equal(estadioCompletoNaJanela({...full,ext:full.ext.filter(x=>x!==key)}),false,'Every visible full-raster fixture must be owned')
for(const key of ['loja','hotel','praca','chopp','estac','estacao','asfalto'])assert.equal(estadioCompletoNaJanela({...full,ext:[...full.ext,key]}),true)
assert.equal(estadioCompletoNaJanela({...full,ext:[...full.ext,'unknown']}),false)
console.log('PASS: complete office window depends on structure and visible fixtures, independently of surrounding businesses, without granting aerial purchases.')

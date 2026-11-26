import assert from 'node:assert/strict'
import {CLUBES_BR_TODOS} from '../src/escalacao/brasil-oficial'
import {CORES_CAMISAS_BR} from '../src/escalacao/cena-contratacao-cores-br'
import {UNIFORMES_APRESENTACAO,uniformeApresentacao} from '../src/escalacao/cena-contratacao-uniformes'

const nomes=new Set(CLUBES_BR_TODOS.map(c=>c.nome))
for(const nome of Object.keys(CORES_CAMISAS_BR))assert(nomes.has(nome),`Paleta sem clube do jogo: ${nome}`)
for(const clube of CLUBES_BR_TODOS){
 assert(UNIFORMES_APRESENTACAO[clube.nome]||CORES_CAMISAS_BR[clube.nome],`Falta identidade: ${clube.nome} (${clube.uf})`)
 const a=uniformeApresentacao(clube.nome,['#ff00ff','#00ffff']),b=uniformeApresentacao(clube.nome,['#00ff00','#ffff00'])
 assert.deepEqual(a,b,`As cores de ${clube.nome} dependem da cor aleatória/tier recebida`)
 for(const cor of [a.corpo,a.detalhe,a.gola,a.mangas,a.terceira].filter(Boolean))assert(/^#[0-9a-f]{6}$/i.test(cor!),`${clube.nome}: cor inválida ${cor}`)
 assert.notEqual(a.corpo,a.detalhe,`${clube.nome}: precisa de acabamento contrastante`)
}
assert.notEqual(uniformeApresentacao('Confiança',[]).corpo,uniformeApresentacao('Confiança-PB',[]).corpo)
assert.notEqual(uniformeApresentacao('Operário-PR',[]).corpo,uniformeApresentacao('Operário VG',[]).corpo)
assert.notEqual(uniformeApresentacao('Primavera-MT',[]).corpo,uniformeApresentacao('Primavera-SP',[]).corpo)
assert.notEqual(uniformeApresentacao('Capital',[]).corpo,uniformeApresentacao('Capital-TO',[]).corpo)
assert.equal(uniformeApresentacao('Maringá',[]).corpo,'#087642','o escudo monocromático não apaga o verde do clube')
assert.equal(uniformeApresentacao('Manauara',[]).corpo,'#e97824','laranja, não vermelho aproximado do arquivo de escudo')
assert.equal(uniformeApresentacao('Meu clube criado', ['#123456','#fedcba']).corpo,'#123456','preserva as cores de clube criado')
for(const div of ['A','B','C','D','E'])console.log(`PASS ${div}: ${CLUBES_BR_TODOS.filter(c=>c.div===div).length} clubes com identidade independente do fallback`)

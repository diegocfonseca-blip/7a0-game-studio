import assert from 'node:assert/strict'
import {postMatchTable} from '../src/escalacao/career-post-match-table'
const first=[{name:'Clube',pts:29,you:true},{name:'Rival',pts:26,you:false}],second=[{name:'Rival',pts:3,you:false},{name:'Clube',pts:0,you:true}],other=[{name:'Outro',pts:10,you:false}]
const official={C:{fases:[{nome:'1ª fase',tabela:first},{nome:'2ª fase · Grupo 1',tabela:second},{nome:'2ª fase · Grupo 2',tabela:other}]},D:{grupos:[{nome:'A',tabela:other},{nome:'B',tabela:second}]}}
assert.equal(postMatchTable('C',first,'2ª fase · Grupo 1',official).table,second,'segunda fase usa pontos zerados do grupo atual')
assert.equal(postMatchTable('C',first,'1ª fase',official).table,first,'fim da primeira fase não mostra grupo futuro já calculado')
assert.equal(postMatchTable('C',first,'2ª fase · Grupo 2',official).table,first,'não mostra grupo de outro clube')
assert.equal(postMatchTable('D',first,'Grupo B',official).table,second,'Série D usa grupo do próprio clube')
assert.equal(postMatchTable('B',first,'playoff',official).table,first)
assert.equal(postMatchTable('A',first,undefined,null).table,first)
assert.equal(postMatchTable('C',first,undefined).table,first,'tradicional mantém sua tabela')
assert.deepEqual(second.map(t=>t.pts),[3,0],'não altera pontos nem ordenação')
console.log('PASS fases/grupos, pontos zerados, sem antecipar fase, tradicional e ausência de mutação')

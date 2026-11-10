// 💤 trava da sala que dorme na tela de fim (sala-dorme.ts): só dorme na tela de FIM, só depois de 20 min parada, e acorda no 1º movimento
import assert from 'node:assert/strict'
import { salaDormindo, marcaMovimento, marcaTela, aoAcordar, DORME_MS } from '../src/escalacao/sala-dorme'
let agora = 1_000_000
Date.now = () => agora
assert.equal(DORME_MS, 20 * 60_000, 'o Diego pediu 20 min')
marcaTela('auction'); marcaMovimento()
agora += DORME_MS * 3
assert.equal(salaDormindo(), false, 'fora da tela de fim NUNCA dorme (leilão parado não pode parar de conversar)')
marcaTela('season'); agora += DORME_MS * 3
assert.equal(salaDormindo(), false, 'jogo nunca dorme')
marcaTela('end')
assert.equal(salaDormindo(), false, 'chegou agora na tela de fim: acordada')
agora += DORME_MS - 1000
assert.equal(salaDormindo(), false, '19 min e pouco: ainda acordada')
agora += 2000
assert.equal(salaDormindo(), true, 'passou de 20 min parada na tela de fim: dorme')
let acordou = 0
const sai = aoAcordar(() => { acordou++ })
marcaMovimento()
assert.equal(salaDormindo(), false, 'um toque acorda na hora')
assert.equal(acordou, 1, 'quem acorda avisa (pra pedir/mandar o estado)')
marcaMovimento()
assert.equal(acordou, 1, 'movimento com a sala acordada não dispara o aviso de novo')
agora += DORME_MS + 1
marcaTela('auction')
assert.equal(salaDormindo(), false, 'saiu da tela de fim (novo leilão): acorda')
sai()
console.log('✅ sala dorme só na tela de fim, depois de 20 min parada, e acorda no 1º movimento')

// 🏛️🃏 trava da CARTINHA DOS DOIS CLUBES (11/10, Diego: "tudo ganha cartinha, seja primeiro clube ou
// segundo clube"). Confere no código que: cada clube tem o PRÓPRIO bilhete por temporada (o principal
// segue com o de sempre; o 2º com `:mc{id}`); a chave segue o CLUBE e não quem está no comando; o clube
// que dorme ganha a carta na hora em divisão, Copa e Supercopa; e o pacote guardado não é criado de novo
// (senão a mesma carta sairia duas vezes).   npm run cartinha
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
const ps = readFileSync('src/escalacao/pyramidseason.tsx', 'utf8')
const st = readFileSync('src/escalacao/store.tsx', 'utf8')
assert.ok(ps.includes('const mcPrincipalId = state.multiClubeAtivo && state.multiClube ? state.multiClube.id : youId'), 'o principal é achado pelo clube, não pelo comando')
assert.ok(/id !== mcPrincipalId \? `:mc\$\{id\}` : ''/.test(ps), '2º clube ganha o sufixo :mc{id}; principal fica com o bilhete de sempre')
const semBilhete = ps.match(/seasonKey=\{`co:\$\{state\.roomCode \|\| `solo\$\{state\.seed\}`\}:\$\{state\.seasonNo\}(:copa|:supercopa)?`\}/g)
assert.equal(semBilhete, null, 'nenhum pacote de título do clube no comando usa mais o bilhete único da temporada')
assert.ok(ps.includes('seasonKey={meuBilhete}') && ps.includes('seasonKey={`${meuBilhete}:copa`}') && ps.includes('seasonKey={`${meuBilhete}:supercopa`}'), 'divisão, Copa e Supercopa usam o bilhete do clube')
assert.ok(ps.includes('const base = meuBilhete'), 'Libertadores/Champions/Mundial também usam o bilhete do clube')
for (const suf of ["suf: ''", "suf: ':copa'", "suf: ':supercopa'"]) assert.ok(ps.includes(suf), `clube que dorme ganha a carta: ${suf}`)
assert.ok(ps.includes('dormeTitulos.map('), 'o pacote do clube que dorme aparece na tela do fim de temporada')
assert.ok(/const CARTA_DORMINDO_NA_HORA = true/.test(st) && st.includes('if (CARTA_DORMINDO_NA_HORA) return'), 'não guarda mais pacote (evita carta dobrada)')
assert.ok(ps.includes("(state.multiClubePendingCards?.[youId] ?? []).length > 0"), 'pacote guardado de save antigo continua abrindo')
console.log('✅ cartinha dos dois clubes: bilhete por clube · dormindo ganha na hora (divisão, Copa, Supercopa) · sem carta dobrada')

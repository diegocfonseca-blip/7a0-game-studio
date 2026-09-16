#!/usr/bin/env node
// ─── 🏛️ GUARDA DO SALÃO — camisa cadastrada é camisa PUBLICADA ──────────────
//
// O buraco que este guarda fecha (Diego, 16/09): *"o manto na sala de batismo não
// atualizou ainda do Neymarzetti pro branco"*.
//
// Existem DOIS lugares com a mesma camisa, e é fácil trocar só um:
//   · `scripts/kits/` é o ACERVO (a arte original, e o que o post usa);
//   · `public/mantos-salao/` é o que o SITE serve de verdade pro Salão.
// Eu tinha trocado só o acervo. No jogo, o Salão continuou mostrando a arte velha.
// E pior: as três camisas novas do dia (Rei da Bola, Raiva Cajuri, Tôka10) estavam
// cadastradas em CAMISAS_SALAO apontando pra arquivo que NUNCA foi publicado — quem
// abrisse o clube via "a arte da camisa deste clube ainda não está disponível".
//
// ⚠️ Tamanho diferente entre os dois NÃO é defeito: a cópia do site é recomprimida
// de propósito, pra pesar menos. O defeito é o arquivo NÃO EXISTIR no site.
//
// Roda com `npm run salao`.
import { existsSync, readFileSync } from 'node:fs'

const src = readFileSync('src/escalacao/salao-camisas.ts', 'utf8')
const bloco = src.slice(src.indexOf('CAMISAS_SALAO'), src.indexOf('RECORTE_CAMISA'))
const pares = [...bloco.matchAll(/"([^"]+)":\s*"([^"]+\.webp)"/g)].map(m => [m[1], m[2]])

const faltando = pares.filter(([, arq]) => !existsSync('public/mantos-salao/' + arq))
// o contrário também conta: arquivo publicado que ninguém cadastrou é peso morto
const cadastrados = new Set(pares.map(([, a]) => a))
const { readdirSync } = await import('node:fs')
const orfaos = readdirSync('public/mantos-salao').filter(f => f.endsWith('.webp') && !cadastrados.has(f))

console.log(`\n🏛️  Salão: ${pares.length} camisas cadastradas\n`)
if (faltando.length) {
  console.log('❌ CADASTRADA MAS NÃO PUBLICADA (o clube mostra "arte não disponível"):')
  for (const [clube, arq] of faltando) console.log(`   · ${clube.padEnd(26)} public/mantos-salao/${arq}`)
  console.log('\n   Conserto: publicar o arquivo (recomprimido) de scripts/kits/ pra public/mantos-salao/.\n')
}
if (orfaos.length) console.log(`⚠️  publicadas sem cadastro (peso morto): ${orfaos.join(', ')}\n`)
if (!faltando.length && !orfaos.length) console.log('✅ toda camisa cadastrada está publicada, e nenhuma sobrando.\n')
process.exit(faltando.length ? 1 : 0)

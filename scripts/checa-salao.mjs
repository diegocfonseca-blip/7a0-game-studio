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

// 🕰️ CACHE: arquivo em public/ tem endereço FIXO (sem hash). Arte trocada sem
// trocar o nome = navegador servindo a VELHA. Por isso toda camisa deve levar -vN.
const semVersao = pares.filter(([, a]) => !/-v\d+\.webp$/.test(a))

// ── 🧺 O TERCEIRO BURACO (18/09) ───────────────────────────────────────────
// Os dois testes acima olham só as camisas CADASTRADAS — então o dia em que o
// clube não está na lista, o guarda dá verde e o dono vê o molde genérico.
// Foi assim que o Diego pegou o La Bestia Negra: *"a camisa do La Bestia Negra
// não atualizou"*. A arte dele estava em `scripts/kits/` desde o batismo (o post
// saiu com ela), mas ninguém publicou. Na varredura, mais quatro clubes estavam
// no mesmo estado. Agora o guarda cobra clube por clube.
// A lista de quem tem direito é a MESMA do `checa-batismos.mjs` — lida de lá pra
// não existirem duas listas de batismo que possam discordar.
const cb = readFileSync('scripts/checa-batismos.mjs', 'utf8')
const listaDe = nome => {
  const m = new RegExp(`const ${nome} = \\[([\\s\\S]*?)^\\]`, 'm').exec(cb)
  return m ? [...m[1].matchAll(/\['([^']+)',\s*'([^']+)'\]/g)].map(x => x[2]) : []
}
const clubes = [...listaDe('BATISMOS'), ...listaDe('SOCIOS')]
const temCamisa = new Set(pares.map(([c]) => c))
// achado no acervo: mesmo nome sem acento/espaço/FC, com ou sem "-camisa"
const semAcento = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '')
const acervo = readdirSync('scripts/kits').filter(f => /\.(webp|png)$/i.test(f))
const noAcervo = clube => {
  const k = semAcento(clube)
  return acervo.find(f => {
    const n = semAcento(f.replace(/\.(webp|png)$/i, '').replace(/camisa/gi, ''))
    return n.length > 3 && (k.includes(n) || n.includes(k))
  })
}
const semCadastro = clubes.filter(c => !temCamisa.has(c)).map(c => [c, noAcervo(c)])
const esquecidos = semCadastro.filter(([, a]) => a)   // ❌ arte existe: é erro nosso
const semArte = semCadastro.filter(([, a]) => !a)     // ⏳ o dono ainda não mandou

console.log(`\n🏛️  Salão: ${pares.length} camisas cadastradas\n`)
if (esquecidos.length) {
  console.log('❌ ARTE NO ACERVO E NUNCA PUBLICADA (o clube mostra o molde genérico):')
  for (const [clube, arq] of esquecidos) console.log(`   · ${clube.padEnd(26)} scripts/kits/${arq}`)
  console.log('\n   Conserto: recomprimir pra public/mantos-salao/<nome>-camisa-v1.webp e cadastrar em CAMISAS_SALAO.\n')
}
if (semArte.length) {
  console.log(`⏳ ${semArte.length} clube(s) SEM camisa no salão porque o dono nunca mandou arte`)
  console.log('   (mostram o molde genérico, e isso é o certo até a arte chegar):')
  console.log('   ' + semArte.map(([c]) => c).join(' · ') + '\n')
}
if (faltando.length) {
  console.log('❌ CADASTRADA MAS NÃO PUBLICADA (o clube mostra "arte não disponível"):')
  for (const [clube, arq] of faltando) console.log(`   · ${clube.padEnd(26)} public/mantos-salao/${arq}`)
  console.log('\n   Conserto: publicar o arquivo (recomprimido) de scripts/kits/ pra public/mantos-salao/.\n')
}
if (orfaos.length) console.log(`⚠️  publicadas sem cadastro (peso morto): ${orfaos.join(', ')}\n`)
if (semVersao.length) {
  console.log(`⏳ ${semVersao.length} camisa(s) SEM -vN no nome. Não quebra nada hoje, mas no dia`)
  console.log('   em que a arte trocar, quem já abriu o clube vai continuar vendo a VELHA')
  console.log('   (endereço fixo = cache do navegador). Ao trocar a arte, troque o nome:')
  console.log('   ' + semVersao.slice(0, 6).map(([, a]) => a).join(', ') + (semVersao.length > 6 ? ', …' : '') + '\n')
}
if (!faltando.length && !orfaos.length && !esquecidos.length) console.log('✅ toda arte que existe está publicada, cadastrada e servida.\n')
process.exit(faltando.length || esquecidos.length ? 1 : 0)

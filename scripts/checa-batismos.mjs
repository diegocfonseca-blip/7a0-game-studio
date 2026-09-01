#!/usr/bin/env node
// ─── 🖋️ GUARDA DOS BATISMOS — o que está faltando em cada clube ─────────────
//
// Pedido do Diego (30/08): *"preciso saber todos batismos q tão faltando
// informações tb"*.
//
// Um batismo não é uma coisa só: ele nasce espalhado por SEIS lugares, e é
// fácil um deles ficar pra trás — foi assim que em 20/08 achamos 8 batismos
// sem reserva de nome nenhuma, e o dono do Coringas não conseguia usar o
// próprio nome. Este guarda olha os seis de uma vez:
//
//   1. `LOGOS_PRONTAS`  (escudos.tsx)   — o escudo próprio
//   2. `CARIMBO_GOL`    (mascotes.tsx)  — a mascote que carimba o gol
//   3. `MANTO_CONTAS`   (manto.ts)      — as 2 cores medidas na camisa do dono
//   4. `FOUNDERS`       (apoio.tsx)     — o tier ouro (batismo NASCE ouro)
//   5. `FUNDADOR_N`     (apoio.tsx)     — o número de fundador
//   6. `DIVISION_TEAMS` (data.ts)       — a vaga na pirâmide
//
// ⚠️ SÓCIO NÃO É BATISMO. Sócio tem clube próprio mas NÃO toma a vaga de
// ninguém e NÃO ganha número de fundador (ordem do Diego no caso do Futpoint,
// 19/08: *"eu N pedi p ele entrar no lugar de ng"*). Por isso os sócios estão
// numa lista à parte aqui — pra não aparecerem como "faltando" o que não
// deviam ter.
//
// 🗄️ A parte de BANCO (nome reservado em `esc_nomes_batismo`) não dá pra
// checar daqui, porque este script roda sem chave de servidor. O que ele checa
// é o CÓDIGO, que é a parte que enferruja — o banco tem gatilho próprio.
//
// Roda com `npm run batismos`.

import fs from 'node:fs'

const ler = f => fs.readFileSync(f, 'utf8')
const chave = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/\s+(FC|EC|SC|AS)$/i, '').toLowerCase().replace(/[^a-z0-9]/g, '')

const bloco = (txt, marca) => {
  const i = txt.indexOf(marca); if (i < 0) return ''
  const j = txt.indexOf('\n}', i); return txt.slice(i, j < 0 ? txt.length : j)
}
const chavesDe = b => new Set([...b.matchAll(/^ {2}'([^']+)':/gm)].map(m => chave(m[1])))
const emailsDe = (b, rx) => new Set([...b.matchAll(rx)].map(m => m[1]))

const esc = ler('src/escalacao/escudos.tsx')
const mas = ler('src/escalacao/mascotes.tsx')
const manto = ler('src/escalacao/manto.ts')
const apoio = ler('src/escalacao/apoio.tsx')
const data = ler('src/escalacao/data.ts')

const LOGOS = chavesDe(bloco(esc, 'export const LOGOS_PRONTAS'))
const CARIMBO = chavesDe(bloco(mas, 'export const CARIMBO_GOL'))
const MANTO = emailsDe(bloco(manto, 'export const MANTO_CONTAS'), /'([^']+@[^']+)':/g)
const OURO = emailsDe(apoio, /'([^']+@[^']+)': 'ouro'/g)
const FUND = new Map([...bloco(apoio, 'const FUNDADOR_N').matchAll(/'([^']+@[^']+)':\s*(\d+)/g)]
  .map(m => [m[1], Number(m[2])]))

const DIV = new Map()
const bd = bloco(data, 'export const DIVISION_TEAMS')
for (const d of ['A', 'B', 'C', 'D']) {
  const m = new RegExp(`^ {2}${d}: \\[([\\s\\S]*?)^ {2}\\]`, 'm').exec(bd)
  if (m) for (const t of m[1].matchAll(/team: '([^']+)'/g)) DIV.set(chave(t[1]), d)
}

// ── quem é quem. Fonte: o que o Diego já decidiu, clube por clube. ──────────
// (só o e-mail identifica; o nome do clube é o ATUAL)
const BATISMOS = [
  ['fontourajoao04@gmail.com', 'Al Takhadao FC'],
  ['denilson.stifler10@gmail.com', 'Xurupitas FC'], ['matheus223lms@icloud.com', 'Alfacehh'],
  ['jorgericardo777@gmail.com', 'Leão da Estradinha'], ['nevesgabriel95@gmail.com', 'Deportivo Montreal'],
  ['eltonfrossard45@gmail.com', 'La Bestia Negra'], ['ofc.toka10@gmail.com', 'Tôka10'],
  ['glaucomiranda@outlook.com', 'Seven City'], ['danielmanfre5@gmail.com', 'Manfré FC'],
  ['lucassrribeiroo2023@gmail.com', 'Scorporila FC'], ['paisagensetrilha@gmail.com', 'Marolados FC'],
  ['diego.c.fonseca@gmail.com', 'Neymarzetti'], ['souzact12@gmail.com', 'Tricolor do Arruda FC'],
  ['adriano.ferrari@quepazseguros.com.br', 'SC Ferrari'], ['matheusfilipealves@hotmail.com', 'Theuzudo FC'],
  ['lucas_calefi@outlook.com', 'Coringas do Diniz'], ['luiz.maia.luiz@gmail.com', 'Remoçada'],
  ['davisantana1312@gmail.com', 'Bicho da Seda'], ['msb102010@hotmail.com', 'Murriz FC'],
  ['guilhermevictor539@gmail.com', 'Nightfull FC'], ['ricardopessoafreire@gmail.com', 'Barcenite FC'],
  ['matheusncruz1@gmail.com', 'Skyy FC'], ['giovannecastro784@hotmail.com', 'Crias do Bigão'],
  ['gabrielnegreirosamaral99@hotmail.com', 'São Luiz FC'], ['pedrinhocamisa8@gmail.com', 'Nata de SP'],
  ['agrostinho88@gmail.com', 'Papão United Madrid'], ['igormarquesn99@gmail.com', 'Milhaça FC'],
  ['lluchmarcel81@gmail.com', 'Esqueceram do Lluch'], ['tiosapeka@gmail.com', 'Sapekeiros FC'],
  ['lucasigorbortoliniii@hotmail.com', 'Marreco FC'],
]
// 🎫 SÓCIOS: clube próprio, SEM vaga na pirâmide e SEM número de fundador.
const SOCIOS = [
  ['gfpicolo13@gmail.com', 'Futpoint FC'], ['erosreis@outlook.com.br', 'Eros FC'],
  ['feehcamp11@gmail.com', 'Marinheiros AS'],
]

const olha = ([email, clube], ehSocio) => {
  const k = chave(clube); const falta = []
  if (!LOGOS.has(k)) falta.push('escudo próprio')
  if (!CARIMBO.has(k)) falta.push('mascote que carimba o gol')
  if (!MANTO.has(email)) falta.push('manto medido na camisa')
  if (!OURO.has(email)) falta.push('tier OURO (batismo nasce ouro)')
  if (!ehSocio && !FUND.has(email)) falta.push('número de fundador')
  if (!ehSocio && !DIV.has(k)) falta.push('vaga na pirâmide')
  return { clube, falta }
}

const res = [...BATISMOS.map(b => olha(b, false)), ...SOCIOS.map(s => olha(s, true))]
const furados = res.filter(r => r.falta.length)

// 🔢 número de fundador repetido = dois donos com o mesmo nº. Isso já
// aconteceu (30/08): o 36 era do Elton no banco e do Lucas no código.
const porNum = new Map()
for (const [em, n] of FUND) { porNum.set(n, [...(porNum.get(n) ?? []), em]) }
const repetidos = [...porNum].filter(([, e]) => e.length > 1)

console.log(`\n🖋️  ${BATISMOS.length} batismos + ${SOCIOS.length} sócios · ${res.length - furados.length} completos\n`)
if (repetidos.length) {
  console.log('🔴 NÚMERO DE FUNDADOR REPETIDO — dois donos com o mesmo selo:')
  for (const [n, es] of repetidos) console.log(`   nº${n}: ${es.join(' e ')}`)
  console.log()
}
const porFalta = new Map()
for (const r of furados) for (const f of r.falta) porFalta.set(f, [...(porFalta.get(f) ?? []), r.clube])
for (const [f, clubes] of [...porFalta].sort((a, b) => b[1].length - a[1].length)) {
  console.log(`• ${f} — ${clubes.length}`)
  console.log(`  ${clubes.join(' · ')}\n`)
}
// 💛 "manto medido" é OPCIONAL: só existe quando o dono manda a camisa. Fica
// no relatório porque é bom saber de quem falta pedir, mas não é defeito.
console.log('💡 "manto medido" só existe quando o dono manda a camisa — é lista de')
console.log('   a-quem-pedir, não defeito. O resto é buraco de verdade.\n')
process.exit(repetidos.length ? 1 : 0)

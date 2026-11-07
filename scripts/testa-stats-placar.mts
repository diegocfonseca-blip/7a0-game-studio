// 📊 trava das ESTATÍSTICAS NO PLACAR CINEMA (07/11). Confere que:
//   1. ⚽ os números BATEM COM O PLACAR — o motor chega no mesmo placar do jogo (v1 das salas e v2 da carreira), gol é chute no
//      gol, chute no gol é finalização, posse soma 100, e jogador de mentira nunca é o ⭐;
//   2. 📱📱 DOIS APARELHOS veem os MESMOS números — um 2º processo (outro "aparelho", sem nada em memória) conta de novo e tem que
//      dar igual; e a conta não usa sorteio local nem relógio (Math.random/Date/performance armados pra estourar);
//   3. 🙈 NADA ANTES DO APITO — a régua `statsPlacarVisivel` só abre com FIM (e pênaltis encerrados), e a tela só monta o cartão
//      (que é quem começa a conta) atrás dessa régua;
//   4. 🧊 não mexe no jogo — o resultado da carreira (`resultadoM2`) e os gols que entram são os mesmos antes e depois.
//   npx tsx scripts/testa-stats-placar.mts
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { resumoDoPlacar, contaComPlacar, contaResumoDoPlacar, statsPlacarVisivel, type EntradaStats } from '../src/escalacao/stats-placar'
import { entradaM2, resultadoM2 } from '../src/escalacao/motor2/carreira'
import { DUR_2D_MS } from '../src/escalacao/campo2d-motor'

const c = (name: string, pos: string, fame: number, lo: number, hi: number, extra: Record<string, unknown> = {}) => ({ name, pos, fame, lo, hi, club: 'Teste', year: 2000, ...extra })
const casa = [
  c('Taffarel', 'GOL', 5, 88, 94), c('Cafu', 'LAT', 5, 90, 95), c('Lúcio', 'ZAG', 5, 88, 93), c('Aldair', 'ZAG', 4, 82, 88), c('Roberto Carlos', 'LAT', 5, 91, 96),
  c('Dunga', 'MEI', 5, 88, 92), c('Zico', 'MEI', 5, 93, 97), c('Kaká', 'MEI', 5, 92, 97), c('Neymar', 'ATA', 5, 92, 97), c('Romário', 'ATA', 5, 92, 97), c('Bebeto', 'ATA', 5, 89, 94),
]
const fora = [
  c('Alex Muralha', 'GOL', 1, 58, 65), c('Cicinho', 'LAT', 2, 72, 78), c('Índio', 'ZAG', 2, 70, 77), c('Thiago Silva', 'ZAG', 4, 82, 88), c('Athirson', 'LAT', 2, 70, 76),
  c('Léo Lima', 'MEI', 1, 58, 64), c('Mineiro', 'MEI', 3, 78, 84), c('Zé Ninguém', 'MEI', 1, 50, 55, { club: 'Várzea', fake: true }), c('Luciano', 'ATA', 3, 76, 82), c('Dentinho', 'ATA', 2, 70, 78), c('Fred', 'ATA', 3, 78, 84),
]
const VELOCIDADES = [DUR_2D_MS, 36_000, 12_000, 4_000]

/** as entradas da trava (as MESMAS nos dois "aparelhos") */
function entradas(): EntradaStats[] {
  const out: EntradaStats[] = []
  for (let s = 1; s <= 24; s++) {
    // v1 (teatro): o placar vem pronto, o motor tem que chegar nele
    const gols = Array.from({ length: s % 6 }, (_, i) => {
      const home = (s + i) % 3 !== 0
      return { min: 3 + ((s * 17 + i * 23) % 92), home, name: home ? ['Romário', 'Neymar', 'Zico'][i % 3] : ['Luciano', 'Fred'][i % 2], assist: i % 2 ? undefined : home ? 'Kaká' : 'Mineiro' }
    })
    out.push({ roundKey: s, casa: { nome: 'Fabulous EC', cartas: casa }, fora: { nome: 'Chelsão', cartas: fora }, gols, roundMs: VELOCIDADES[s % 4], tatica: [((s % 3) - 1), 0] as [number, number] })
  }
  // v1 sem elenco (bot sem cartas na tela) e com troca no intervalo
  out.push({ roundKey: 99, casa: { nome: 'A' }, fora: { nome: 'B' }, gols: [{ min: 40, home: true, name: 'Fulano' }], roundMs: 36_000 })
  out.push({ roundKey: 98, casa: { nome: 'Fabulous EC', cartas: casa, cartas2: [...casa.slice(0, 10), c('Ronaldo', 'ATA', 5, 93, 98)], formacao: '4-3-3', formacao2: '4-4-2' }, fora: { nome: 'Chelsão', cartas: fora }, gols: [{ min: 70, home: true, name: 'Ronaldo' }], roundMs: DUR_2D_MS })
  // v2 (carreira): os gols SAEM do motor, igual no jogo
  for (let s = 1; s <= 8; s++) {
    const m2 = entradaM2({ seed: 1000 + s * 7919, casa, fora, fCasa: '4-3-3', fFora: '4-4-2', tatica: [0, s % 2 ? 1 : -1], bots: [false, true] })
    const gols = resultadoM2(m2).gols.map(g => ({ name: g.nome, min: g.min, home: g.home, assist: g.assist }))
    out.push({ roundKey: s, casa: { nome: 'Fabulous EC', cartas: casa }, fora: { nome: 'Chelsão', cartas: fora }, gols, roundMs: DUR_2D_MS, m2 })
  }
  return out
}

// 📱 o 2º aparelho: só conta e devolve (nada em memória do 1º)
if (process.argv.includes('--aparelho')) {
  process.stdout.write(JSON.stringify(entradas().map(e => resumoDoPlacar(e))))
  process.exit(0)
}

// ── 1. bate com o placar ──
const lista = entradas()
const t0 = performance.now()
const meus = lista.map(e => {
  const golsAntes = JSON.stringify(e.gols)
  const { resumo: r, placarMotor } = contaComPlacar(e)
  const placar = [e.gols.filter(g => g.home).length, e.gols.filter(g => !g.home).length]
  const nome = `${e.m2 ? 'v2' : 'v1'} rodada ${e.roundKey}`
  assert.deepEqual(placarMotor, placar, `${nome}: o motor chegou em ${placarMotor.join('x')}, o placar é ${placar.join('x')}`)
  assert.equal(JSON.stringify(e.gols), golsAntes, `${nome}: a conta mexeu nos gols do jogo`)
  assert.equal(r.posse[0] + r.posse[1], 100, `${nome}: posse não soma 100`)
  for (const l of [0, 1] as const) {
    assert.ok(r.noAlvo[l] >= placar[l], `${nome}: ${placar[l]} gols e só ${r.noAlvo[l]} chutes no gol`)
    assert.ok(r.chutes[l] >= r.noAlvo[l], `${nome}: mais chute no gol que finalização`)
  }
  if (r.craque) assert.notEqual(r.craque.nome, 'Zé Ninguém', `${nome}: jogador de mentira virou melhor em campo`)
  return r
})
const ms = (performance.now() - t0) / lista.length
console.log(`⚽ ${lista.length} jogos (${lista.filter(e => !e.m2).length} teatro v1 · ${lista.filter(e => e.m2).length} motor novo v2): placar, chute no gol e posse batem · ~${ms.toFixed(0)} ms por jogo (uma vez, no apito, em fatias)`)
console.log('📊 exemplo:', JSON.stringify(meus[2]), '·', JSON.stringify(meus[meus.length - 1]))

// ── 2. dois aparelhos ──
const outro = JSON.parse(execFileSync(process.execPath, [...process.execArgv, fileURLToPath(import.meta.url), '--aparelho'], { encoding: 'utf8', maxBuffer: 1 << 24 }))
assert.deepEqual(outro, meus, 'o 2º aparelho viu números diferentes')
// sem sorteio local nem relógio: arma as três e conta tudo de novo (cache limpo: entradas novas = objetos novos, chave igual → cache;
// por isso a conta é refeita pelo `contaComPlacar`, que nunca usa o cache)
const [rnd, now, perf] = [Math.random, Date.now, performance.now]
Math.random = () => { throw new Error('Math.random na conta das estatísticas') }
Date.now = () => { throw new Error('Date.now na conta das estatísticas') }
performance.now = () => { throw new Error('performance.now na conta das estatísticas') }
try { lista.forEach((e, i) => assert.deepEqual(contaComPlacar(e).resumo, meus[i], 'a conta deu diferente na 2ª vez')) }
finally { Math.random = rnd; Date.now = now; performance.now = perf }
// a conta em fatias (a da tela) dá o MESMO que a de uma vez
const fatiado = await new Promise<unknown>(res => contaResumoDoPlacar({ ...lista[5], gols: [...lista[5].gols] }, res))
assert.deepEqual(fatiado, meus[5], 'a conta em fatias deu diferente')
console.log('📱📱 dois aparelhos: os mesmos números (outro processo, sem sorteio local, sem relógio, em fatias ou de uma vez)')

// ── 3. nada antes do apito ──
const base = { liberado: true, fechado: true }
assert.equal(statsPlacarVisivel(base), true)
assert.equal(statsPlacarVisivel({ ...base, fechado: false }), false, 'apareceu antes do apito')
assert.equal(statsPlacarVisivel({ ...base, liberado: false }), false, 'apareceu pra conta sem liberação')
assert.equal(statsPlacarVisivel({ ...base, penaltis: { encerrado: false } }), false, 'apareceu no meio dos pênaltis')
assert.equal(statsPlacarVisivel({ ...base, penaltis: { encerrado: true } }), true)
assert.equal(statsPlacarVisivel({ ...base, basket: true }), false, 'apareceu no basquete')
assert.equal(statsPlacarVisivel({ ...base, kings: true }), false, 'apareceu na Kings (relógio próprio)')
const raiz = fileURLToPath(new URL('..', import.meta.url))
const ler = (f: string) => readFileSync(raiz + f, 'utf8')
const placar = ler('src/escalacao/pyramidseason.tsx')
const usos = placar.match(/<StatsDoPlacar\b/g) ?? []
assert.equal(usos.length, 1, 'o cartão tem que existir num lugar só do placar')
const i = placar.indexOf('<StatsDoPlacar'), antes = placar.slice(Math.max(0, i - 600), i)
assert.ok(/statsPlacarVisivel\(\{ liberado: statsPlacar, fechado, basket, kings: !!relogioKings, penaltis: estadoPenaltis \?\? disputaPenaltis\?\.estado \?\? null \}\) && \(/.test(antes), 'o cartão do placar tem que estar atrás de statsPlacarVisivel (FIM + pênaltis)')
assert.ok(placar.lastIndexOf('if (cinematic) return', i) > placar.lastIndexOf('if (campo2dComTelao) return', i), 'o cartão tem que estar no placar CINEMA (com o 2D, o resumo é o do campinho)')
// a conta só começa quando o cartão é montado (ninguém mais chama a conta)
for (const f of ['src/escalacao/pyramidseason.tsx', 'src/escalacao/screens.tsx', 'src/escalacao/store.tsx', 'src/escalacao/online-match-visual.tsx']) {
  assert.ok(!/contaResumoDoPlacar|resumoDoPlacar\(/.test(ler(f)), `${f} conta as estatísticas fora do cartão`)
}
assert.ok(/contaResumoDoPlacar\(/.test(ler('src/escalacao/stats-placar-ui.tsx')))
console.log('🙈 nada antes do apito: só com FIM e pênaltis encerrados, só no placar cinema, e a conta só começa com o cartão na tela')

// ── 4. não mexe no jogo ──
for (const e of lista.filter(x => x.m2)) {
  const a = JSON.stringify(resultadoM2(e.m2!)), g = JSON.stringify(e.gols.map(x => ({ name: x.name, min: x.min, home: x.home, assist: x.assist })))
  assert.equal(g, JSON.stringify(resultadoM2(e.m2!).gols.map(x => ({ name: x.nome, min: x.min, home: x.home, assist: x.assist }))), 'o resultado da carreira mudou depois da conta')
  assert.ok(a.length > 0)
}
const ui = ler('src/escalacao/stats-placar.ts') + ler('src/escalacao/stats-placar-ui.tsx')
assert.ok(!/dispatch|supabase|channel|localStorage|Math\.random/.test(ui.replace(/\/\/.*$/gm, '')), 'a conta das estatísticas não pode mexer em estado, canal, banco, aparelho ou sorteio')
console.log('🧊 não mexe no jogo: resultado da carreira igual, nada de estado/canal/banco/sorteio')
console.log('✅ estatísticas no placar cinema: batem com o placar, iguais em todo aparelho, nada antes do apito')

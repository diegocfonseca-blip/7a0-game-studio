// 🏀🎙️ trava da rádio do basquete (narracao-basquete.ts, 18/11): banco grande, PT e EN no mesmo par com os MESMOS
// placeholders, nenhuma frase sai com "{x}" sobrando, e a mesma entrada dá a mesma fala (todo aparelho da sala igual).
// Rodar: npm run narracao-bb
const { falaBasquete, BANCO_NARRACAO_BB } = await import('../src/escalacao/narracao-basquete.ts')
let falhas = 0
const ok = (c: boolean, msg: string) => { if (!c) { falhas++; console.log('FALHOU:', msg) } else console.log('ok -', msg) }

let total = 0
for (const [nome, banco] of Object.entries(BANCO_NARRACAO_BB)) {
  total += banco.length
  for (const [pt, en] of banco as unknown as [string, string][]) {
    const ph = (s: string) => [...s.matchAll(/\{(\w)\}/g)].map(m => m[1]).sort().join(',')
    if (!pt.trim() || !en.trim()) ok(false, `${nome}: frase vazia`)
    if (ph(pt) !== ph(en)) ok(false, `${nome}: placeholders diferentes entre PT e EN → "${pt}" / "${en}"`)
    if (/gol\b|goleir|⚽|pênalti|penalty|escanteio|gramado/i.test(pt + en)) ok(false, `${nome}: palavra de futebol → "${pt}"`)
  }
}
ok(total >= 180, `banco grande: ${total} frases (cada uma em PT e EN)`)
const min = { DOIS: 25, TRES: 20, ENTERRADA: 15, TOCO: 12, ROUBO: 12, REBOTE: 10 } as Record<string, number>
for (const [k, n] of Object.entries(min)) ok((BANCO_NARRACAO_BB as any)[k].length >= n, `${k}: ${((BANCO_NARRACAO_BB as any)[k]).length} variações (mínimo ${n})`)

const base = { seed: 12345, casa: 'Garrafão do Zé', fora: 'Lakers', cestas: [{ name: 'John Stockton', min: 30, home: true }, { name: 'Magic Johnson', min: 55, home: false }],
  elencoCasa: [{ name: 'John Stockton', pos: 'GOL' }, { name: 'Shaquille O\'Neal', pos: 'ATA' }], elencoFora: [{ name: 'Magic Johnson', pos: 'GOL' }, { name: 'Kareem Abdul-Jabbar', pos: 'ATA' }] }
let sobra = 0, vistas = new Set<string>()
for (const en of [false, true]) for (let m = 0; m <= 93; m++) {
  const f = falaBasquete({ ...base, min: m, fechado: false, pc: Math.round(m * 1.1), pf: Math.round(m * 1.05), en })
  if (/\{\w\}/.test(f.txt) || !f.txt.trim()) sobra++
  vistas.add(f.txt)
}
ok(sobra === 0, 'nenhuma fala sai com {placeholder} sobrando ou vazia')
ok(vistas.size >= 40, `um jogo inteiro tem fala variada (${vistas.size} diferentes em PT+EN)`)
const a = falaBasquete({ ...base, min: 40, fechado: false, pc: 44, pf: 40, en: false })
const b = falaBasquete({ ...base, min: 40, fechado: false, pc: 44, pf: 40, en: false })
ok(a.txt === b.txt, 'mesma entrada = mesma fala (sala inteira ouve igual)')
const cesta = falaBasquete({ ...base, min: 30, fechado: false, pc: 33, pf: 30, en: false })
ok(cesta.tipo === 'gol' && cesta.txt.includes('John Stockton'), `cesta mostrada vira fala com o nome: "${cesta.txt}"`)
const antes = falaBasquete({ ...base, min: 54, fechado: false, pc: 60, pf: 58, en: false })
ok(!antes.txt.includes('Magic Johnson') || antes.tipo !== 'gol', 'sem spoiler: a cesta do minuto 55 não aparece no 54')
const fim = falaBasquete({ ...base, min: 93, fechado: true, pc: 101, pf: 97, en: false })
ok(fim.txt.includes('Garrafão do Zé') && fim.txt.includes('101'), `apito final com vencedor e placar: "${fim.txt}"`)
const intervalo = falaBasquete({ ...base, min: 46, fechado: false, pc: 50, pf: 48, en: false })
ok(/INTERVALO|Metade|intervalo|primeiro tempo/i.test(intervalo.txt), `intervalo narrado: "${intervalo.txt}"`)
if (falhas) { console.log(`\n${falhas} FALHA(S)`); process.exit(1) }
console.log('\nTUDO OK'); process.exit(0)

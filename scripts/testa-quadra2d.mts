// 🏀📺 trava da QUADRA 2D (18/11): o roteiro fecha SEMPRE no placar do jogo, nunca anda pra trás, cesta de 3 sai de
// FORA da linha de 3 (regra do Diego), cesta de 2 de DENTRO, lance livre da linha, e a mesma entrada dá o mesmo roteiro.
// Rodar: npm run quadra2d
const { planoQuadra, placarEm, foraDaLinha3, QUADRA } = await import('../src/escalacao/quadra2d-plano.ts')
let falhas = 0
const ok = (c: boolean, msg: string) => { if (!c) { falhas++; console.log('FALHOU:', msg) } else console.log('ok -', msg) }
let fecha = 0, anda = 0, tres = 0, dois = 0, ll = 0, total = 0, foraQuadra = 0, tempo = 0, nTres = 0, nCesta = 0, ptsTres = 0, ptsTot = 0
for (let s = 1; s <= 3000; s++) {
  const h = 72 + (s * 37) % 70, a = 72 + (s * 53) % 70
  const p = planoQuadra(s * 7919, h, a)
  total++
  if (p.casaFim !== h || p.foraFim !== a || placarEm(p, 93).casa !== h || placarEm(p, 93).fora !== a) fecha++
  let c = 0, f = 0, t = 0
  for (const l of p.lances) {
    if (l.casa < c || l.fora < f || l.t1 < l.t0 || l.t0 < t - 1e-9) anda++
    c = l.casa; f = l.fora; t = l.t1
    if (l.t0 < 0 || l.t1 > 93) tempo++
    if (l.x < 47 || l.x > 94 || l.y < 0 || l.y > 50) foraQuadra++
    if (l.pts === 3 && !foraDaLinha3(l.x, l.y)) tres++
    if (l.pts === 2 && foraDaLinha3(l.x, l.y)) dois++
    if (l.tipo === 'lance' && (Math.abs(l.x - QUADRA.linhaLL) > 0.01)) ll++
    if (l.pts === 3) { nTres++; ptsTres += 3 }
    if (l.pts > 0) nCesta++
    ptsTot += l.pts
  }
}
ok(fecha === 0, `o roteiro fecha no placar do jogo (${total} jogos, ${fecha} errados)`)
ok(anda === 0, 'o placar nunca anda pra trás e o tempo só vai pra frente')
ok(tempo === 0 && foraQuadra === 0, 'tudo dentro do relógio (0–93) e da meia-quadra do ataque')
ok(tres === 0, `cesta de 3 SEMPRE de fora da linha de 3 (${tres} fora da regra)`)
ok(dois === 0, `cesta de 2 SEMPRE de dentro da linha (${dois} fora da regra)`)
ok(ll === 0, 'lance livre sai da linha do lance livre')
const pct3 = ptsTres / ptsTot
ok(pct3 > 0.25 && pct3 < 0.42, `bola de 3 = ${(pct3 * 100).toFixed(0)}% dos pontos (NBA ~35%)`)
const a = JSON.stringify(planoQuadra(42, 101, 97)), b = JSON.stringify(planoQuadra(42, 101, 97))
ok(a === b, 'mesma entrada = mesmo roteiro (a sala inteira vê igual)')
ok(placarEm(planoQuadra(42, 101, 97), 0).casa === 0, 'no apito inicial o placar é 0 × 0 (sem spoiler)')
// canto: a linha reta fica a 3 pés da lateral — dentro dela é 2
ok(!foraDaLinha3(89, 5) && foraDaLinha3(89, 1.5) && foraDaLinha3(60, 25) && !foraDaLinha3(75, 25), 'linha de 3 medida como na NBA (canto e arco)')
if (falhas) { console.log(`\n${falhas} FALHA(S)`); process.exit(1) }
console.log('\nTUDO OK'); process.exit(0)

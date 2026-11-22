// 🔬 22/11: lê o `dados.json` gravado por `NUMEROS=1 node scripts/mapa3d/filma-bancada.mjs` e procura o que fica FEIO no campo 3D:
//   · bola desenhada longe da bola do jogo (em jogo corrido) · entrega pelo chão descartada · bola pulando de lugar fora de bola parada
//   · bola desenhada PARADA com o jogo rolando · boneco pulando de lugar · boneco girando o corpo de uma vez correndo
// uso: node scripts/mapa3d/analisa-numeros.mjs <pasta> [<pasta>…]
import fs from 'node:fs'
const VIVO = new Set(['passe', 'dominio', 'lancamento', 'cruzamento', 'finalizacao'])
for (const pasta of process.argv.slice(2)) {
  const d = JSON.parse(fs.readFileSync(`${pasta}/dados.json`)).filter(x => x && x.b)
  const f = d.filter((x, i) => i === 0 || x.t !== d[i - 1].t) // só quadros em que o tempo do jogo andou
  const des = x => [x.b[3] ?? x.b[0], x.b[4] ?? x.b[1], x.b[5] ?? x.b[2]]
  const linhas = [`\n=== ${pasta} · ${f[0].t.toFixed(1)} → ${f[f.length - 1].t.toFixed(1)} s · ${f.length} quadros`]
  // 1. bola desenhada × oficial, por fase
  const off = {}
  for (const x of f) { const p = des(x), o = Math.hypot(p[0] - x.b[0], p[2] - x.b[2]); (off[x.fase] ??= []).push([o, x.t]) }
  for (const k of Object.keys(off)) { const m = off[k].reduce((a, c) => c[0] > a[0] ? c : a); if (VIVO.has(k) && m[0] > 2) linhas.push(`⚠️ bola desenhada a ${m[0].toFixed(1)} m da oficial em "${k}" (t=${m[1].toFixed(2)})`) }
  linhas.push('desvio máx em jogo: ' + [...VIVO].map(k => `${k} ${off[k] ? Math.max(...off[k].map(c => c[0])).toFixed(2) : '-'}`).join(' · '))
  // 2. entregas descartadas
  const g = d[d.length - 1].gdd ?? []
  linhas.push(`entregas pelo chão: ${g.length} · descartadas (reta mentia): ${g.filter(x => x[3]).map(x => `${x[0]}–${x[1]} s (${x[2]} m)`).join(', ') || 'nenhuma'}`)
  // 3. bola pulando fora de bola parada · bola parada em jogo
  const saltos = []; let parada = null; const paradas = []
  for (let i = 1; i < f.length; i++) {
    const a = f[i - 1], b = f[i], dt = b.t - a.t; if (dt <= 0 || dt > .2) { parada = null; continue }
    const pa = des(a), pb = des(b), dist = Math.hypot(pb[0] - pa[0], pb[1] - pa[1], pb[2] - pa[2]), v = dist / dt
    if (v > 60 && dist > 3 && VIVO.has(a.fase) && VIVO.has(b.fase) && !b.rep && !a.rep) saltos.push(`${b.t.toFixed(2)} (${dist.toFixed(0)} m, ${a.fase}>${b.fase})`)
    if (VIVO.has(b.fase) && !b.rep && v < .25 && pb[1] < .3) { parada ??= b.t } else { if (parada !== null && a.t - parada > 1.2) paradas.push(`${parada.toFixed(1)}–${a.t.toFixed(1)} s`); parada = null }
  }
  linhas.push(`bola pulando de lugar em jogo corrido: ${saltos.join(', ') || 'nenhuma'}`)
  linhas.push(`bola desenhada parada > 1,2 s com o jogo rolando: ${paradas.join(', ') || 'nenhuma'}`)
  // 4. bonecos
  let pulos = 0; const giros = [], prev = {}
  for (const x of f) for (const q of x.mq ?? []) {
    if (q[3] && x.t > 3.5) pulos++
    const p = prev[q[0]]
    if (p && x.t - p.t < .12 && q[1] > 5 && p.s > 5 && VIVO.has(x.fase)) { let da = Math.abs(q[2] - p.a); if (da > 180) da = 360 - da; if (da > 75) giros.push(`${x.t.toFixed(2)} ${q[0].slice(9, 26)} ${da.toFixed(0)}°`) }
    prev[q[0]] = { t: x.t, a: q[2], s: q[1] }
  }
  linhas.push(`boneco pulando de lugar em jogo: ${pulos}`)
  linhas.push(`boneco virando > 75° de uma vez correndo (> 5 m/s): ${giros.length}${giros.length ? ' → ' + giros.slice(0, 8).join(' | ') : ''}`)
  const fases = {}; for (const x of f) fases[x.fase] = (fases[x.fase] || 0) + 1
  linhas.push('fases: ' + Object.entries(fases).map(([k, v]) => `${k} ${v}`).join(' · '))
  console.log(linhas.join('\n'))
}

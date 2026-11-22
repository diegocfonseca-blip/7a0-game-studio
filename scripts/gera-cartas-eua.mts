// 🏀🇺🇸 Gera as cartas NOVAS da carreira EUA Oficial (só carreira — nunca salas online nem Partida Rápida).
// Entrada: docs/eua-oficial/elencos-2026-27.json (elencos reais 2026-27, conferidos no Basketball-Reference em 19/11/2026).
// Saída:   src/escalacao/data-basquete-eua.ts (GERADO — não editar na mão; mexer aqui e rodar de novo).
// Regras (Diego, 19/11): a franquia joga com as cartas que JÁ existiam (o auge). Jogador de HOJE só entra quando FALTA carta:
// *"só atual quando faltam cartas pro time"*. Régua: toda franquia chega a 15 cartas (elenco da NBA) e a pelo menos 1 por
// posição (fecha o quinteto). Pra completar, entra primeiro a posição vazia e depois os MELHORES do elenco de hoje.
// · Quem já tem carta no baralho NBA não ganha outra (mesma pessoa só em baralho diferente — regra de 26/09 / 16/11).
// · Jogador marcado `conferir` (saiu/entrou nos últimos dias, a pesquisa e o Basketball-Reference discordam) fica de fora.
// · Nível pela régua de 02/11 (Craque 80–89 · Promessa 70–85 · Bom 68–79 · Profissional 55–66), medido pelo que ele faz
//   NESTA temporada (minutos/pontos do Basketball-Reference) + prêmio recente (All-Star 2026 / All-NBA 2025-26).
// · Bio só com FATO (posição, franquia, números da temporada, escolha de draft, prêmio). Nada inventado.
// Uso: npx tsx scripts/gera-cartas-eua.mts
import fs from 'node:fs'
import { CATALOG_NBA } from '../src/escalacao/data-basquete.ts'

const MINIMO = 15 // cartas por franquia (o elenco da NBA)
// nomes antigos contam pra franquia de hoje (a linhagem oficial da NBA)
const LINHAGEM: Record<string, string> = { Sonics: 'Thunder', SuperSonics: 'Thunder', Bullets: 'Wizards', Royals: 'Kings', Bobcats: 'Hornets', Braves: 'Clippers', Nationals: 'Sixers', Blazers: 'Trail Blazers' }

const ANO = 2026 // a temporada 2026-27 (começou em 20/10/2026)
const CLUBE: Record<string, string> = { 'Trail Blazers': 'Blazers' } // mesma chave das cartas antigas
const POS = ['PG', 'SG', 'SF', 'PF', 'C'] as const
type P = typeof POS[number]
const POS_PT: Record<P, string> = { PG: 'Armador', SG: 'Ala-armador', SF: 'Ala', PF: 'Ala-pivô', C: 'Pivô' }
const POS_EN: Record<P, string> = { PG: 'Point guard', SG: 'Shooting guard', SF: 'Small forward', PF: 'Power forward', C: 'Center' }
const NOME: Record<string, string> = Object.fromEntries((await import('../src/escalacao/eua-oficial.ts')).FRANQUIAS_NBA.map(f => [f.chave, f.nome]))

const semAcento = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\./g, '').trim()
const noBaralho = new Set(Object.values(CATALOG_NBA).flat().map(c => semAcento(c.name)))

const fx = (n: number) => n.toFixed(1).replace('.', ',')
const r = JSON.parse(fs.readFileSync('docs/eua-oficial/elencos-2026-27.json', 'utf8'))
const out: Record<P, string[]> = { PG: [], SG: [], SF: [], PF: [], C: [] }
const relatorio: string[] = []
const antigas: Record<string, Record<string, number>> = {}
for (const [pp, l] of Object.entries(CATALOG_NBA)) for (const c of l) { const tt = LINHAGEM[c.club] ?? c.club; (antigas[tt] ??= { PG: 0, SG: 0, SF: 0, PF: 0, C: 0 })[pp]++ }
let n = 0, pulados = 0, conferir = 0
for (const t of r.teams) {
  const cand: { pos: P; q: number; linha: string; nome: string }[] = []
  for (const p of t.players) {
    if (p.conferir) { conferir++; continue }
    if (noBaralho.has(semAcento(p.name))) { pulados++; continue }
    const pos = (POS as readonly string[]).includes(p.pos) ? p.pos as P : (POS as readonly string[]).includes(p.bref?.pos) ? p.bref.pos as P : null
    if (!pos) { relatorio.push(`SEM POSIÇÃO: ${t.team} ${p.name} (${p.pos})`); continue }
    const note: string = p.note ?? ''
    const g = Number(p.bref?.g ?? 0), exp = Number(p.bref?.exp === 'R' ? 0 : p.bref?.exp ?? 9)
    // jogou pouco agora (lesão, chegou agora)? mede pela temporada passada (2025-26), se ele jogou nela
    const ant = p.bref2526 && Number(p.bref2526.g) >= 20 ? p.bref2526 : null
    const usaAnt = g < 5 && !!ant
    const mp = Number((usaAnt ? ant.mp : p.bref?.mp) ?? 0), pts = Number((usaAnt ? ant.pts : p.bref?.pts) ?? 0)
    const allStar26 = /All-Star[^;,]*2026|2026 All-Star/i.test(note)
    const allNba = /All-NBA[^;]*2025-26/i.test(note)
    const pick = note.match(/#(\d+) pick[^;,]*(2025|2026)|pick (\d+)[^;,]*(2025|2026)|(\d+)ª escolha[^;,]*(2025|2026)/i)
    const pick2 = pick ? null : note.match(/(2025|2026) #(\d+) pick/i) // "2025 #5 pick"
    const pickN = pick ? Number(pick[1] ?? pick[3] ?? pick[5]) : pick2 ? Number(pick2[2]) : 0
    const pickAno = pick ? Number(pick[2] ?? pick[4] ?? pick[6]) : pick2 ? Number(pick2[1]) : 0
    let fame: 1 | 2 | 3 | 4, lo: number, hi: number, promessa = false
    const s = Math.min(1, Math.max(0, (pts - 8) / 14)) // 0..1 pelo que ele pontua agora
    // craque: prêmio recente OU ser cestinha de time de verdade (21+ pontos com 28+ minutos)
    if (allStar26 || allNba) { fame = 4; lo = Math.round(78 + 3 * s); hi = Math.round(86 + 3 * s) }
    else if (exp <= 1 && pickN >= 1 && pickN <= 10) { fame = 3; promessa = true; lo = 70 + Math.round(3 * s); hi = 82 + Math.round(3 * s) } // calouro/2º ano de topo = promessa, mesmo pontuando muito
    else if (pts >= 21 && mp >= 28) { fame = 4; lo = Math.round(78 + 3 * s); hi = Math.round(86 + 3 * s) }
    else if (mp >= 26 || pts >= 14) { fame = 3; lo = 70 + Math.round(3 * s); hi = 77 + Math.round(2 * s) }
    else if (mp >= 14) { fame = 2; lo = 66 + Math.round(2 * Math.min(1, (mp - 14) / 12)); hi = 74 + Math.round(2 * Math.min(1, (mp - 14) / 12)) }
    else { fame = 1; lo = 54 + Math.min(3, Math.round(mp / 5)); hi = 63 + Math.min(3, Math.round(mp / 5)) }
    const fr = NOME[t.team] ?? t.team
    const fatosPt: string[] = [], fatosEn: string[] = []
    if (allNba) { const m = note.match(/All-NBA (1st|2nd|3rd)/i); const o = m?.[1]; fatosPt.push(`${o === '1st' ? '1º' : o === '2nd' ? '2º' : '3º'} time All-NBA em 2025-26.`); fatosEn.push(`All-NBA ${o} Team in 2025-26.`) }
    if (allStar26) { fatosPt.push('All-Star em 2026.'); fatosEn.push('2026 All-Star.') }
    if (pickN && pickAno) { fatosPt.push(`Escolha nº ${pickN} do Draft de ${pickAno}.`); fatosEn.push(`No. ${pickN} pick in the ${pickAno} Draft.`) }
    if (usaAnt) {
      fatosPt.push(`Na temporada passada (2025-26): ${fx(pts)} pontos em ${fx(mp)} minutos por jogo.`); fatosEn.push(`Last season (2025-26): ${pts.toFixed(1)} points in ${mp.toFixed(1)} minutes per game.`)
      if (g < 3) { fatosPt.push('Quase não jogou no começo desta temporada.'); fatosEn.push('Has barely played so far this season.') }
    } else if (g >= 3) { fatosPt.push(`Começou a temporada com ${fx(pts)} pontos em ${fx(mp)} minutos por jogo.`); fatosEn.push(`Opened the season with ${pts.toFixed(1)} points in ${mp.toFixed(1)} minutes per game.`) }
    else { fatosPt.push('Quase não entrou em quadra no começo da temporada.'); fatosEn.push('Barely played early in the season.') }
    if (p.contract === 'two-way') { fatosPt.push('Contrato two-way (divide o ano com a G League).'); fatosEn.push('Two-way contract (splits the year with the G League).') }
    const bioPt = `${POS_PT[pos]} do ${fr} em 2026-27. ${fatosPt.join(' ')}`
    const bioEn = `${POS_EN[pos]} for the ${fr} in 2026-27. ${fatosEn.join(' ')}`
    cand.push({ pos, nome: p.name, q: fame * 100 + lo + hi, linha: `  { name: ${JSON.stringify(p.name)}, club: ${JSON.stringify(CLUBE[t.team] ?? t.team)}, year: ${ANO}, fame: ${fame}, lo: ${lo}, hi: ${hi}${promessa ? ', promessa: true' : ''}, bioPt: ${JSON.stringify(bioPt)}, bioEn: ${JSON.stringify(bioEn)} },` })
  }
  // completa até o mínimo: primeiro a posição que não tem ninguém, depois os melhores de hoje
  const tem = { ...(antigas[t.team] ?? { PG: 0, SG: 0, SF: 0, PF: 0, C: 0 }) } as Record<P, number>
  let total = Object.values(tem).reduce((a, b) => a + b, 0)
  cand.sort((a, b) => b.q - a.q)
  const escolhidos: typeof cand = []
  for (const ps of POS) if (tem[ps] === 0) { const c = cand.find(x => x.pos === ps && !escolhidos.includes(x)); if (c) { escolhidos.push(c); tem[ps]++; total++ } else relatorio.push(`SEM ${ps} no elenco de hoje: ${t.team}`) }
  for (const c of cand) { if (total >= MINIMO) break; if (!escolhidos.includes(c)) { escolhidos.push(c); tem[c.pos]++; total++ } }
  for (const c of escolhidos) { out[c.pos].push(c.linha); n++ }
  if (escolhidos.length) relatorio.push(`${t.team}: +${escolhidos.length} (${escolhidos.map(c => c.nome).join(', ')})`)
}
const src = `// ⚠️ ARQUIVO GERADO por \`npx tsx scripts/gera-cartas-eua.mts\` — não editar na mão.
// 🏀🇺🇸 Cartas NOVAS da carreira EUA Oficial (elencos reais 2026-27). SÓ CARREIRA: nunca salas online nem Partida Rápida
// (decisão do Diego, 19/11). Só entra jogador de hoje onde a franquia tinha MENOS de ${MINIMO} cartas (ou posição vazia).
// ${n} cartas novas.
import type { BC, BPos } from './data-basquete'

export const CATALOG_NBA_EUA: Record<BPos, BC[]> = {
${POS.map(p => `  ${p}: [\n${out[p].join('\n')}\n  ],`).join('\n')}
}
`
fs.writeFileSync('src/escalacao/data-basquete-eua.ts', src)
console.log(`${n} cartas novas`)
for (const l of relatorio) console.log(l)

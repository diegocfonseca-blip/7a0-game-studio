// ─── 🏆 TRAVA DA ARTILHARIA DE TODOS OS TEMPOS (por CARTA, 19/09) ───────────
//
// Ordem do Diego: *"primeira que N pode ser por nome.. E sim por carta"* e, sobre
// o passado que já estava embolado, *"pros 62 divida entre eles"*.
//
// O que esta trava protege:
//  1. 🃏 A CHAVE É A CARTA (nome|clube|ano) — nunca o nome, nunca o `cardId`
//     (que o leilão troca todo ano).
//  2. ➗ A DIVISÃO DOS XARÁS PRESERVA O TOTAL e é SEMPRE IGUAL. Se a sobra caísse
//     em carta diferente a cada leitura, o mesmo save migraria diferente em dois
//     aparelhos — e no online isso viraria briga de números.
//  3. 🔁 RODA UMA VEZ SÓ: migrar de novo não pode mexer em nada (o save abre
//     muitas vezes; dividir duas vezes picaria o histórico em migalhas).
//  4. 🧒 CRIA DA BASE E FOLCLÓRICO não existem no baralho — continuam pelo nome,
//     com os gols inteiros.
//
// Roda o CÓDIGO DE VERDADE no navegador (não uma cópia da regra aqui).
// Antes: DEPLOY_BASE=/ npx vite --port 5231
// uso: node scripts/testa-artilharia.mjs [--porta 5231]
import { chromium } from 'playwright-core'
import { spawn } from 'node:child_process'
import { readFileSync } from 'node:fs'

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : d }
const PORTA = arg('porta', '5231')

const vite = spawn('npx', ['vite', '--port', PORTA], { env: { ...process.env, DEPLOY_BASE: '/' }, stdio: 'ignore', detached: true })
const espera = async () => { for (let i = 0; i < 40; i++) { try { const r = await fetch(`http://localhost:${PORTA}/`); if (r.ok) return true } catch { /* subindo */ } await new Promise(r => setTimeout(r, 500)) } return false }
if (!await espera()) { console.error('❌ o servidor não subiu'); try { process.kill(-vite.pid) } catch { /* já foi */ } process.exit(1) }

const b = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const p = await b.newPage()
await p.goto(`http://localhost:${PORTA}/`, { waitUntil: 'domcontentloaded' })

const r = await p.evaluate(async () => {
  const st = await import('/src/escalacao/store.tsx')
  const d = await import('/src/escalacao/data.ts')
  // índice real do baralho, pra o teste saber quem é xará de quem
  const porNome = new Map()
  for (const cat of [d.CATALOG, d.CATALOG_EU, d.CATALOG_WORLD])
    for (const arr of Object.values(cat))
      for (const c of arr) {
        const l = porNome.get(c.name) ?? []
        if (!l.some(x => x.club === c.club && x.year === c.year)) l.push({ club: c.club, year: c.year })
        porNome.set(c.name, l)
      }
  const xaras = [...porNome.entries()].filter(([, v]) => v.length > 1)
  const unicos = [...porNome.entries()].filter(([, v]) => v.length === 1)
  const linha = (name, goals) => ({ name, teamName: 'Neymarzetti', teamId: 3, div: 'A', goals, you: false, human: false })

  // 🧪 save VELHO: tudo por nome, sem clube
  const velho = {}
  const casos = []
  for (const [nome, cartas] of xaras.slice(0, 12)) { velho[nome] = linha(nome, 105); casos.push({ nome, cartas: cartas.length, gols: 105 }) }
  for (const [nome] of unicos.slice(0, 5)) velho[nome] = linha(nome, 37)
  velho['Fubá Raio'] = linha('Fubá Raio', 9)   // cria da base: não existe no baralho

  const novo = st.migraArtilhariaPorCarta(velho)
  const denovo = st.migraArtilhariaPorCarta(novo)   // 🔁 idempotência
  const outraVez = st.migraArtilhariaPorCarta({ ...velho }) // ➗ determinismo

  const soma = o => Object.values(o).reduce((a, x) => a + x.goals, 0)
  const porCaso = casos.map(c => {
    const meus = Object.entries(novo).filter(([, v]) => v.name === c.nome)
    return {
      nome: c.nome, cartas: c.cartas, linhas: meus.length,
      soma: meus.reduce((a, [, v]) => a + v.goals, 0),
      gols: meus.map(([, v]) => v.goals).sort((a, b) => b - a),
      temClube: meus.every(([, v]) => !!v.club && !!v.year),
      chavesOk: meus.every(([k, v]) => k === `${v.name}|${v.club}|${v.year}` || k.startsWith(`${v.name}|`)),
    }
  })
  return {
    somaVelho: soma(velho), somaNovo: soma(novo),
    idempotente: JSON.stringify(denovo) === JSON.stringify(novo),
    deterministico: JSON.stringify(outraVez) === JSON.stringify(novo),
    porCaso,
    criaPeloNome: !!novo['Fubá Raio'] && novo['Fubá Raio'].goals === 9 && !novo['Fubá Raio'].club,
    unicoVirouCarta: unicos.slice(0, 5).every(([nome]) => Object.entries(novo).some(([k, v]) => v.name === nome && !!v.club && v.goals === 37 && k.includes('|'))),
    chaveHelper: st.chaveArtilheiro({ name: 'Cafu', club: 'Milan', year: 2004 }),
    chaveSemClube: st.chaveArtilheiro({ name: 'Fubá Raio' }),
  }
})
await b.close()
try { process.kill(-vite.pid) } catch { /* já foi */ }

let falhas = 0
const ok = (cond, msg) => { console.log(`  ${cond ? '✅' : '❌'} ${msg}`); if (!cond) falhas++ }

console.log('\n1) 🃏 a chave é a CARTA, não o nome')
ok(r.chaveHelper === 'Cafu|Milan|2004', `Cafu do Milan vira "${r.chaveHelper}"`)
ok(r.chaveSemClube === 'Fubá Raio', 'quem não tem carta no baralho fica pelo nome')
ok(r.porCaso.every(c => c.temClube), 'toda linha migrada saiu com clube e ano')
ok(r.porCaso.every(c => c.chavesOk), 'e a chave de cada linha bate com a carta dela')

console.log('\n2) ➗ a divisão entre os xarás preserva o total (ordem do Diego)')
ok(r.somaVelho === r.somaNovo, `nenhum gol se perdeu nem apareceu: ${r.somaVelho} antes · ${r.somaNovo} depois`)
for (const c of r.porCaso.slice(0, 6)) {
  ok(c.linhas === c.cartas, `${c.nome}: ${c.cartas} cartas viraram ${c.linhas} linhas`)
  ok(c.soma === 105, `${c.nome}: os 105 gols continuam 105 (${c.gols.join(' + ')})`)
  ok(Math.max(...c.gols) - Math.min(...c.gols) <= 1, `${c.nome}: partes iguais (a sobra é de no máximo 1 gol)`)
}

console.log('\n3) 🔁 roda uma vez só, e sempre igual')
ok(r.idempotente, 'migrar de novo não mexe em nada (senão o histórico ia se picando a cada abertura)')
ok(r.deterministico, 'dois aparelhos lendo o MESMO save migram IGUAL (a sobra cai sempre na mesma carta)')

console.log('\n4) 🧒 quem não é do baralho não se perde')
ok(r.criaPeloNome, 'cria da base fica pelo nome, com os gols inteiros')
ok(r.unicoVirouCarta, 'nome único leva o histórico inteiro pra carta dele')

console.log('\n5) 🏆 LIGA + TODAS AS COPAS entram na conta')
{
  // Diego (19/09): *"deve contar gols na liga Tb e gols na copa alais toda sligas
  // é todas copas"*. Até então só a LIGA entrava no histórico de todos os tempos.
  const py = readFileSync('src/escalacao/pyramidseason.tsx', 'utf8')
  const cb = readFileSync('src/escalacao/copa-brasil.ts', 'utf8')
  ok(/RECORD_SEASON_STATS', scorers: \[\.\.\.scorersAll, \.\.\.\(copa\?\.scorersAll \?\? \[\]\)\]/.test(py),
    'a virada manda LIGA + COPA pro histórico')
  ok(/scorersAll: list,/.test(py), 'a Copa Legends devolve a artilharia COMPLETA (não o top 20 da tela)')
  ok(/scorersAll: list,/.test(cb), 'a Copa do Brasil devolve a artilharia COMPLETA')
  ok(/scorersAll: \[\.\.\.\(r\.scorersAll \?\? \[\]\), \.\.\.\(supercopa\?\.scorers \?\? \[\]\)\]/.test(cb),
    'e a SUPERCOPA entra junto (ela é calculada fora da Copa do Brasil)')
  // ⚠️ a lista da TELA continua cortada de propósito — quem soma é a completa
  ok(/scorers: list\.slice\(0, 20\)/.test(cb) && /scorers: list\.slice\(0, 20\)/.test(py),
    'e o top 20 da tela ficou como estava (só a conta do histórico mudou)')
  ok(/slice\(0, 2500\)/.test(readFileSync('src/escalacao/store.tsx', 'utf8')),
    'o teto subiu de 1000 pra 2500 — o baralho tem 1466 cartas, ninguém mais é descartado')
}

console.log('\n6) 🅰️ A ASSISTÊNCIA ANDA JUNTO COM O GOL')
{
  // Regra permanente dele (19/09): *"todos dados q tá fazendo de gols sempre serve
  // p assistência tb hein"*. Esta seção existe pra a assistência nunca mais ficar
  // pra trás — ela NÃO tinha histórico nenhum até hoje.
  const py = readFileSync('src/escalacao/pyramidseason.tsx', 'utf8')
  const cb = readFileSync('src/escalacao/copa-brasil.ts', 'utf8')
  const stx = readFileSync('src/escalacao/store.tsx', 'utf8')
  const ty = readFileSync('src/escalacao/types.ts', 'utf8')
  ok(/careerAssistsAll\?: Record</.test(ty), 'o save tem o acumulado de garçons (não existia)')
  ok(/assists: \[\.\.\.assistsAll, \.\.\.\(copa\?\.assistsAll \?\? \[\]\)\]/.test(py), 'a virada manda LIGA + COPA de assistências também')
  ok(/assistsAll: listA,/.test(py) && /assistsAll: listA,/.test(cb), 'as duas copas devolvem a lista COMPLETA de garçons')
  ok(/assistsAll: \[\.\.\.\(r\.assistsAll \?\? \[\]\), \.\.\.\(supercopa\?\.assists \?\? \[\]\)\]/.test(cb), 'e a Supercopa entra junto nas assistências')
  ok(/s\.careerAssistsAll = Object\.fromEntries/.test(stx), 'o reducer grava o acumulado de garçons')
  ok(/careerScorersAll = \{\}; s\.careerAssistsAll = \{\}/.test(stx), 'e carreira nova zera os DOIS juntos')
  ok((stx.match(/careerAssistsAll = \{\}/g) ?? []).length === (stx.match(/careerScorersAll = \{\}/g) ?? []).length,
    'os dois são zerados nos MESMOS lugares (nenhum reinício esquece um deles)')
  ok(/interface SeasonAssist \{[^}]*club\?: string; year\?: number/.test(py), 'o garçom carrega a identidade da carta, igual ao artilheiro')
  ok(/GarconsBox/.test(py), 'e o Rank mostra a caixa de garçons de todos os tempos')
}

console.log('\n7) 🕳️ a ficha não mostra total que ela ainda não sabe')
{
  // Dúvida dele (19/09): *"minha dúvida ainda é pra quem chega hoje e vê gols
  // iguais em gols da temporada e gols que já fez pelo clube total… porém jogos
  // ele vê poucos da temporada e 300 total. Tá estranho"*.
  // A causa: JOGOS é gravado desde 13/09 e GOL/ASSISTÊNCIA só desde 19/09.
  const py = readFileSync('src/escalacao/pyramidseason.tsx', 'utf8')
  ok(/const semPassado = Object\.keys\(carry\)\.length > 0 && !Object\.values\(carry\)\.some\(v => v\.gl != null\)/.test(py),
    'a marca é: TEM carry mas NENHUMA carta com gol gravado (= carreira anterior a hoje)')
  ok(/semPassado: !!a\?\.semPassado/.test(py), 'e ela chega na ficha')
  ok(/totais\.semPassado[\s\S]{0,400}?'—'[\s\S]{0,200}?'—'/.test(py), 'com a marca ligada, GOLS e ASS do clube mostram "—" em vez de número')
  ok(/COMEÇAM A CONTAR NA PRÓXIMA TEMPORADA/.test(py) && /START COUNTING NEXT SEASON/.test(py), 'e o aviso está em PT e EN')
  ok(/totais\.semPassado\s*\n\s*\? colunaSel/.test(py) || /semPassado[\s\S]{0,120}colunaSel/.test(py), 'só a coluna DOURADA muda — a da temporada fica como estava')
  ok(/jTot/.test(py), 'e os JOGOS continuam à mostra (esses estão certos)')
}

console.log(falhas === 0 ? '\n✅ tudo certo\n' : `\n❌ ${falhas} falha(s)\n`)
process.exit(falhas === 0 ? 0 : 1)

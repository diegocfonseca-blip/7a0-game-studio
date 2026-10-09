// 🧪 TRAVA DO MERCADO DE TÉCNICOS (09/10, save do Elton — Série A, temporada 387)
// Relato: *"todos os times, quando ele vai sondar, estão sem técnico… e não aparece
// ninguém sem clube"*. O pool da Série A tem 22 nomes e técnico de clube que CAÍA
// nunca voltava pro mercado: em 387 temporadas os 22 estavam presos em clubes da C,
// da D e da Várzea, e todo clube da A ganhava `null`.
// O que esta trava garante:
//  1. técnico de clube que saiu da minha divisão volta pro mercado;
//  2. clube da minha divisão que estava `null` pega um técnico livre;
//  3. o meu técnico e os dos rivais/convidados do meu leilão NÃO são mexidos;
//  4. rodar de novo não muda nada (idempotente).
// Rodar:  npm run tecnicos
process.on('uncaughtException', e => { if (!String(e?.message).includes('DEV')) throw e })
const S: any = await import('../src/escalacao/store.tsx')
const T: any = await import('../src/escalacao/tecnicos.ts')

let erros = 0
const ok = (c: boolean, m: string) => { console.log(`  ${c ? '✅' : '❌'} ${m}`); if (!c) erros++ }
const poolA: string[] = T.poolDaDiv('A').map((t: any) => t.nome)
const bot = (id: number, nome: string): any => ({ id, name: nome, teamName: nome, isHuman: false, formation: '4-3-3', money: 0, squad: [] })

// 19 bots na A comigo, 3 rivais (um deles na C), 10 clubes de fundo da A, e 20 clubes
// espalhados por C/D/V segurando TODOS os técnicos da A — a foto do save do Elton.
const managers: any[] = [{ id: 1, name: 'Eu', teamName: 'Meu Clube', isHuman: true, formation: '4-3-3', money: 0, squad: [] }]
const placements: Record<string, string> = { m1: 'A' }
for (let i = 2; i <= 10; i++) { managers.push(bot(i, `Bot A ${i}`)); placements[`m${i}`] = 'A' }
for (let i = 11; i <= 30; i++) { managers.push(bot(i, `Bot Baixo ${i}`)); placements[`m${i}`] = i % 3 === 0 ? 'C' : i % 3 === 1 ? 'D' : 'V' }
for (let i = 1; i <= 10; i++) placements[`Fundo A ${i}`] = 'A'
const rivals = [{ team: 'Bot A 2' }, { team: 'Bot Baixo 12' }]
const tecnicos: Record<string, string | null> = { 'Meu Clube': poolA[0] }
let k = 1
for (let i = 11; i <= 30; i++) tecnicos[`Bot Baixo ${i}`] = poolA[k++] // 20 presos lá embaixo
tecnicos['Clube Que Sumiu'] = poolA[k++] // 22º: clube que nem existe mais
for (let i = 2; i <= 10; i++) tecnicos[`Bot A ${i}`] = null // os da A: todos `null`
for (let i = 1; i <= 10; i++) tecnicos[`Fundo A ${i}`] = null
ok(k === 22 && poolA.length === 22, `foto montada: os ${poolA.length} técnicos da A estão fora da A (${k} presos)`)

const st0: any = { careerOnline: true, managers, youIdx: 0, seed: 777, seasonNo: 387, round: 1, careerPlacements: placements, careerRivals: rivals, careerTecnicos: tecnicos, careerTecnicosDesde: {}, careerTecnicoContrato: {} }
const st1 = S.reducer(st0, { type: 'ALICIAR_SEED' })
const map1: Record<string, string | null> = st1.careerTecnicos
const naA = [...Array(9).keys()].map(i => `Bot A ${i + 2}`).concat([...Array(10).keys()].map(i => `Fundo A ${i + 1}`))

console.log('1) técnico de clube que saiu da minha divisão volta pro mercado')
const presosDepois = Object.keys(map1).filter(c => /^Bot Baixo/.test(c) && c !== 'Bot Baixo 12' && map1[c])
ok(presosDepois.length === 0, `clubes da C/D/V soltaram o técnico (${presosDepois.length} ainda segurando)`)
ok(!('Clube Que Sumiu' in map1), 'clube que não existe mais saiu do mapa')

console.log('2) clube da minha divisão que estava null pega um técnico livre')
const comTec = naA.filter(c => map1[c])
ok(comTec.length === naA.length, `${comTec.length} de ${naA.length} clubes da A com técnico`)
ok(new Set(Object.values(map1).filter(Boolean)).size === Object.values(map1).filter(Boolean).length, 'nenhum técnico em dois clubes')
ok(Object.values(map1).filter(Boolean).every(n => T.tecnicoPorNome(n).div === 'A'), 'todos da categoria A')

console.log('3) o meu e os dos rivais/convidados do meu leilão não são mexidos')
ok(map1['Meu Clube'] === poolA[0], 'meu técnico continua o mesmo')
ok(map1['Bot Baixo 12'] === tecnicos['Bot Baixo 12'], 'rival que está na C continua com o técnico dele (ele disputa o meu leilão)')

console.log('4) rodar de novo não muda nada')
const st2 = S.reducer(st1, { type: 'ALICIAR_SEED' })
ok(st2 === st1 || JSON.stringify(st2.careerTecnicos) === JSON.stringify(st1.careerTecnicos), 'idempotente')

console.log('5) mercado vazio de verdade continua null (sem inventar técnico)')
{
  const tudoUsado: Record<string, string | null> = {}
  for (let i = 2; i <= 10; i++) tudoUsado[`Bot A ${i}`] = poolA[i - 1] // 1..9
  for (let i = 1; i <= 11; i++) tudoUsado[`Fundo A ${i}`] = poolA[9 + i] // 10..20
  tudoUsado['Meu Clube'] = poolA[0]; tudoUsado['Bot Baixo 12'] = poolA[21] // = 22 usados
  placements['Fundo A 11'] = 'A'; placements['Fundo A 12'] = 'A' // chegou mais um e não sobrou ninguém
  const st = S.reducer({ ...st0, careerTecnicos: tudoUsado }, { type: 'ALICIAR_SEED' })
  ok(st.careerTecnicos['Fundo A 12'] === null, 'clube novo fica null quando não há ninguém livre')
  ok(st.careerTecnicos['Fundo A 11'] === poolA[20], 'e quem já tinha técnico continua com ele')
}

console.log(erros ? `\n❌ ${erros} falha(s)` : '\n✅ tudo certo — técnico que sai da divisão volta pro mercado')
process.exit(erros ? 1 : 0)

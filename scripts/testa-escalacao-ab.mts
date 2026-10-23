// 💾 TRAVA DA ESCALAÇÃO A/B DA CARREIRA (23/10) — `npm run escalacao-ab`. As regras são as do Diego (ver escalacao-salva.ts).
const E: any = await import('../src/escalacao/escalacao-salva.ts')
let erros = 0
const ok = (c: boolean, m: string) => { console.log(`  ${c ? '✅' : '❌'} ${m}`); if (!c) erros++ }
let n = 0
const c = (name: string, pos: string, lv = 80, extra: object = {}) => ({ id: `id${n++}`, name, club: 'Vasco', year: 1997, pos, lo: lv - 3, hi: lv + 3, ...extra })
const base = [c('Taffarel', 'GOL'), c('Cafu', 'LAT'), c('R. Carlos', 'LAT'), c('Aldair', 'ZAG'), c('Lúcio', 'ZAG'), c('Dunga', 'MEI'), c('Kaká', 'MEI'), c('Rivaldo', 'MEI'),
  c('Bebeto', 'ATA'), c('Romário', 'ATA'), c('Edmundo', 'ATA'),
  c('Dida', 'GOL', 70), c('Zé Maria', 'LAT', 70), c('Mauro Galvão', 'ZAG', 70), c('Mauro Silva', 'MEI', 72), c('Zinho', 'MEI', 75), c('Müller', 'ATA', 74), c('Viola', 'ATA', 70)]
const xi = base.slice(0, 11).map(x => x.id)
const tudoLiberado = () => true
const esc = E.salvaEscalacao(base, xi, '4-3-3', undefined, 2, 5)
ok(!!esc && esc.keys.length === 11, 'salva os 11 em campo')
ok(E.salvaEscalacao(base, xi.slice(0, 10), '4-3-3', undefined, 2, 5) === null, 'não salva com 10')
ok(E.salvaEscalacao([...base, c('Ninguém', 'ATA', 40, { fake: true })], [...xi.slice(0, 10), `id${n - 1}`], '4-3-3', undefined, 2, 5) === null, 'não salva perna-de-pau (fake)')

// 1. tudo igual: volta o mesmo time, mesma ordem
let r = E.aplicaEscalacao({ esc, squad: base, fora: new Set(), formacaoAtual: '4-4-2', formacaoLiberada: tudoLiberado })
ok(r.ok && JSON.stringify(r.ids) === JSON.stringify(xi) && r.f === '4-3-3', 'sem mudança: volta o mesmo time na formação salva')

// 2. Romário vendido + Kaká machucado + Cafu cansado + Pelé comprado
const sq2 = base.filter(x => x.name !== 'Romário').concat([c('Pelé', 'ATA', 99)])
const kaka = sq2.find(x => x.name === 'Kaká')!.id
const gas: Record<string, number> = { [sq2.find(x => x.name === 'Cafu')!.id]: 15, [sq2.find(x => x.name === 'Müller')!.id]: 40, [sq2.find(x => x.name === 'Viola')!.id]: 95 }
r = E.aplicaEscalacao({ esc, squad: sq2, fora: new Set([kaka]), formacaoAtual: '4-3-3', formacaoLiberada: tudoLiberado, gas })
const nomes = (ids: string[]) => ids.map(id => sq2.find(x => x.id === id)!.name)
ok(r.ok, 'monta mesmo com vendido e machucado')
ok(r.ok && !nomes(r.ids).includes('Romário') && !nomes(r.ids).includes('Kaká'), 'vendido e machucado não entram')
ok(r.ok && nomes(r.ids).includes('Cafu'), 'cansado entra (escolha do técnico)')
ok(r.ok && !nomes(r.ids).includes('Pelé') && r.novos.includes('Pelé'), 'quem chegou depois de salvar não entra — e é avisado')
ok(r.ok && nomes(r.ids).includes('Viola') && !nomes(r.ids).includes('Müller'), 'na vaga do vendido entra o reserva mais INTEIRO (Viola 95% > Müller 40%)')
ok(r.ok && nomes(r.ids)[9] === 'Viola', 'o reserva entra na MESMA vaga do campinho (o atacante do meio)')
ok(r.ok && r.naoEntrou.some((x: any) => x.nome === 'Romário' && x.motivo === 'saiu' && x.noLugar === 'Viola') && r.naoEntrou.some((x: any) => x.nome === 'Kaká' && x.motivo === 'fora'), 'o aviso diz quem não entrou, por quê e no lugar de quem')
ok(r.ok && r.ids.length === 11 && new Set(r.ids).size === 11, 'sempre 11 distintos')

// 3. o técnico de agora não usa o 4-3-3: entra na formação atual (4-4-2) com quem couber
r = E.aplicaEscalacao({ esc, squad: base, fora: new Set(), formacaoAtual: '4-4-2', formacaoLiberada: (f: string) => f === '4-4-2' })
ok(r.ok && r.f === '4-4-2' && !!r.formacaoTrocada, 'formação fora do cardápio do técnico → entra na atual, com aviso')
ok(r.ok && r.ids.map((id: string) => base.find(x => x.id === id)!.name).filter((x: string) => ['Dunga', 'Kaká', 'Rivaldo'].includes(x)).length === 3 && r.ids.length === 11, '…e os salvos que cabem continuam')

// 4. não fecha 11: NADA muda
const semGoleiro = base.filter(x => x.pos !== 'GOL')
r = E.aplicaEscalacao({ esc, squad: semGoleiro, fora: new Set(), formacaoAtual: '4-3-3', formacaoLiberada: tudoLiberado })
ok(!r.ok && r.falta.some((f: any) => f.pos === 'GOL' && f.n === 1), 'sem goleiro: não aplica e diz o que falta (nunca joga com 10)')

// 5. Cria da Base só se não houver reserva de verdade
const comCria = base.filter(x => x.name !== 'Dida' && x.name !== 'Taffarel').concat([c('Guri', 'GOL', 50, { cria: true }), c('Rogério', 'GOL', 60)])
r = E.aplicaEscalacao({ esc, squad: comCria, fora: new Set(), formacaoAtual: '4-3-3', formacaoLiberada: tudoLiberado, gas: { [comCria.find(x => x.name === 'Guri')!.id]: 100, [comCria.find(x => x.name === 'Rogério')!.id]: 30 } })
ok(r.ok && comCria.find(x => x.id === r.ids[0])!.name === 'Rogério', 'reserva de verdade (mesmo cansado) entra antes da Cria da Base')

if (erros) { console.log(`\n❌ ${erros} falha(s)`); process.exit(1) }
console.log('\n✅ escalação A/B segura')

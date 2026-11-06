// 🧪 👕 CAMISAS DO CAMPO 2D (06/11, aprovado pelo Diego). uso: npm run camisas-2d
// Confere as regras 1–5 + "mesma cor em todos os aparelhos" + o rosto das lendas intacto com a camisa nova.
import { readFileSync } from 'node:fs'
import { camisasDoJogo, deltaE, parecido, PARECIDO_DE, RESERVA_BRANCA, RESERVA_PRETA } from '../src/escalacao/camisas-2d'
import { kitDoTime } from '../src/escalacao/camisas-2d-dados'
import { BATISMOS } from '../src/escalacao/batismos'
import { registraMimosDaSala, limpaMimosDaSala, marcaSalaDosMimos, registraMeusNomes } from '../src/escalacao/mimos'
import { desenharMarcadorCampo2D } from '../src/escalacao/campo2d-marcador'
import { APOIO_PERKS, CORES_EXTRA } from '../src/escalacao/apoio'

let falhas = 0
const ok = (c: boolean, m: string) => { console.log(c ? '✅' : '❌', m); if (!c) falhas++ }
const BEGE = APOIO_PERKS.bege.solid, PRATA = APOIO_PERKS.prata.solid, OURO = APOIO_PERKS.ouro.solid
const BOT = '#3A7CA5'
const ler = (f: string) => readFileSync(new URL(`../src/escalacao/${f}`, import.meta.url), 'utf8')

// ── 1. 🖋️ BATISMO veste o MANTO, por NOME (com selo, sem FC, em qualquer caixa) ──
const comManto = BATISMOS.filter(b => b.manto)
let todos = true
for (const b of comManto) {
  const k = kitDoTime(`${b.clube} 👑🖋️`, OURO)
  if (k[0] !== b.manto![0] || k[1] !== b.manto![1]) { todos = false; console.log('   ↳', b.clube, k) }
}
ok(todos && comManto.length > 50, `1. os ${comManto.length} batismos com manto vestem as 2 cores dele (nome com selo) — não a cor do plano`)
ok(kitDoTime('crias do bigao', OURO)[0] === '#0E62AA', '1. sem acento/caixa diferente acha o mesmo batismo')
const rei = kitDoTime('Rei da Bola FC', OURO, n => n === 'Rei da Bola FC' ? 'reidabola_leao' : undefined)
ok(rei.length === 3 && rei[2] === '#ECE1D9', '1. manto de 3 cores: a 3ª (MANTO_TRI) entra no kit')
const [rc] = camisasDoJogo(rei, [BOT])
ok(rc.cor === '#D4121F' && rc.listras[0] === '#121010' && rc.listras[1] === '#ECE1D9', '1. Rei da Bola em casa: vermelho com listras pretas e filete creme')
ok(kitDoTime('Fridão FC 🎭FAKE', BEGE)[0] === BEGE, '1. 🎭 FAKE com nome de batismo NÃO veste o manto (fica bege)')

// ── 2/3. gente: bege · prata · dourado · cor adicional (a cor que chega já é a do plano) ──
for (const [nome, cor] of [['Joaquim FC', BEGE], ['Prata da Casa', PRATA], ['Leões Dourados', OURO], ['Rosa Choque', CORES_EXTRA.rosa.solid]] as const)
  ok(kitDoTime(nome, cor).join() === cor && camisasDoJogo(kitDoTime(nome, cor), [BOT])[0].cor === cor, `2/3. ${nome}: camisa ${cor} (a do plano/cor escolhida, sem troca)`)
const [c1, f1] = camisasDoJogo(kitDoTime('Crias do Bigão', OURO), kitDoTime('Joaquim FC', BEGE))
ok(c1.cor === '#0E62AA' && f1.cor === BEGE, '1×2. batismo (azul) × sem plano (bege): cada um com a sua')
const [c2, f2] = camisasDoJogo([OURO], [PRATA])
ok(c2.cor === OURO && f2.cor === PRATA, '3. Lenda dourado × Craque prata: não troca ninguém')

// ── 4. ⚔️ CHOQUE ──
const [c3, f3] = camisasDoJogo(kitDoTime('Murriz FC', OURO), kitDoTime('Wen Milan B', OURO))
ok(c3.cor === '#C81D1C' && f3.cor === '#180F0E' && f3.listras[1] === '#DF1224', '4. dois mantos vermelho/preto: casa vermelha; fora PRETO (2ª cor) com filete vermelho')
const fb = ['#CD0C12', '#070505', '#FFFFFF']
const [, f4] = camisasDoJogo(['#C81D1C', '#150A0A'], fb)
const melhor = deltaE('#C81D1C', '#070505') > deltaE('#C81D1C', '#FFFFFF') ? '#070505' : '#FFFFFF'
ok(f4.cor === melhor && !parecido('#C81D1C', f4.cor), '4. manto de 3 cores parecido: vai a 2ª/3ª que MENOS choca')
const [c5, f5] = camisasDoJogo([OURO], [OURO])
ok(c5.cor === OURO && f5.cor === RESERVA_PRETA && f5.reserva === true, '4. 👑×👑 dourado contra dourado: casa dourada, fora reserva PRETA')
const [c6, f6] = camisasDoJogo([PRATA], [PRATA])
ok(c6.cor === PRATA && f6.cor === RESERVA_PRETA, '4. ⭐×⭐ prata contra prata: casa prata, fora reserva PRETA')
ok(camisasDoJogo([BEGE], [BEGE])[1].cor === RESERVA_PRETA, '4. bege × bege: fora de PRETO (bege é clara)')
ok(camisasDoJogo(['#0E62AA'], ['#0E62AA'])[1].cor === RESERVA_BRANCA, '4. azul escuro × azul escuro sem 2ª cor: fora reserva BRANCA')
ok(camisasDoJogo(['#C81D1C'], ['#CD0C12'])[1].cor === RESERVA_BRANCA, '4. vermelho × vermelho sem 2ª cor: fora BRANCA')
const [, f7] = camisasDoJogo(['#161616', '#D5D5D5'], ['#0F0E0E', '#EAE5E1'])
ok(f7.cor === '#EAE5E1', '4. alvinegro × alvinegro: o visitante vira a camisa (branca)')
// ninguém sai do jogo parecido com a casa
let nunca = true
const paleta = [BEGE, PRATA, OURO, BOT, '#C2452F', '#2B6CFF', ...Object.values(CORES_EXTRA).map(c => c.solid), ...comManto.flatMap(b => b.manto!)]
for (const a of paleta) for (const b of paleta) { const [x, y] = camisasDoJogo([a], [b]); if (deltaE(x.cor, y.cor) < PARECIDO_DE) { nunca = false; console.log('   ↳', a, b) } }
ok(nunca, `4. ${paleta.length}² combinações: as duas camisas SEMPRE ficam diferentes (ΔE ≥ ${PARECIDO_DE})`)

// ── 5. 🤖 bots: a cor de hoje, e o choque vale pra eles ──
ok(camisasDoJogo([BOT], ['#C2452F'])[0].cor === BOT && camisasDoJogo([BOT], ['#C2452F'])[1].cor === '#C2452F', '5. bot × bot diferentes: cada um com a cor de hoje')
ok(camisasDoJogo([BOT], [BOT])[1].cor === RESERVA_BRANCA, '5. bot × bot da mesma cor: o visitante troca')

// ── 🌐 mesma cor em todos os aparelhos ──
const foto = (nome: string) => kitDoTime(nome, OURO).join()
marcaSalaDosMimos(true)
registraMeusNomes(['Clube Renomeado'])
registraMimosDaSala([{ clube: 'Clube Renomeado 👑', manto: ['#123456', '#ABCDEF'] }])
const naSalaA = foto('Clube Renomeado')
limpaMimosDaSala(); registraMeusNomes([]) // outro aparelho: não é o clube dele
registraMimosDaSala([{ clube: 'Clube Renomeado 👑', manto: ['#123456', '#ABCDEF'] }])
const naSalaB = foto('Clube Renomeado')
ok(naSalaA === naSalaB && naSalaA === '#123456,#ABCDEF', '🌐 sala: o manto do assento (servidor) sai igual pro dono e pra quem só olha')
limpaMimosDaSala()
ok(foto('Clube Renomeado') === OURO, '🌐 sala sem o dado do servidor: ninguém usa o e-mail do aparelho (fica a cor do plano pra todos)')
marcaSalaDosMimos(false)
let igual = true
for (let i = 0; i < 50; i++) if (JSON.stringify(camisasDoJogo(kitDoTime('Final Boss FC', OURO), kitDoTime('Murriz FC', OURO))) !== JSON.stringify(camisasDoJogo(kitDoTime('Final Boss FC', OURO), kitDoTime('Murriz FC', OURO)))) igual = false
ok(igual, '🌐 mesma entrada → mesma camisa, sempre')
const regras = ler('camisas-2d.ts'), dados = ler('camisas-2d-dados.ts')
ok(!/Math\.random|Date\.now|localStorage|window\.|^import/m.test(regras), '🌐 camisas-2d.ts é puro (sem sorteio, relógio, aparelho nem import)')
ok(/!sala && ehMeuClube\(n\) \? meuManto\(\)/.test(dados) && !/loggedEmail|myApoioPerk/.test(dados), '🌐 o manto do e-mail (meuManto) só vale FORA de sala')
const store = ler('store.tsx')
ok(/marcaSalaDosMimos\(!!salaDosMimos\)/.test(store) && /esc_mantos_sala/.test(store), '🌐 a sala registra o manto de cada assento (esc_mantos_sala)')
const tela = ler('campo2d.tsx')
ok(/kitDoTime\(casa\.nome/.test(tela) && /camisasDoJogo\(/.test(tela) && /stripes:\(p\.lado===0\?camCasa:camFora\)\.listras/.test(tela), '👕 o Campo 2D (e o mapa, mesmo marcador) usa as camisas novas')
ok(!/perto\(corCasa/.test(tela), '👕 a regra velha de troca (rgb < 110) saiu — uma régua só')

// ── 👑 o ROSTO da lenda continua igual, só a camisa muda de cor ──
type Chamada = [string, unknown[], Record<string, unknown>]
function tela2d() {
  const log: Chamada[] = [], estado: Record<string, unknown> = {}
  const cx = new Proxy({}, {
    get: (_t, k: string) => k in estado ? estado[k] : (...a: unknown[]) => { log.push([k, a, { ...estado }]); return { width: 10 } },
    set: (_t, k: string, v) => { estado[k] = v; return true },
  }) as unknown as CanvasRenderingContext2D
  return { cx, log }
}
const rostoImg = { complete: true, naturalWidth: 200, naturalHeight: 240, src: 'zico.webp' } as unknown as HTMLImageElement
const desenha = (color: string, stripes: string[], portrait: HTMLImageElement | null) => { const t = tela2d(); desenharMarcadorCampo2D(t.cx, 50, 50, 10, { name: '', color, stripes, number: '10', portrait, owned: false }); return t.log }
const velho = desenha('#2B6CFF', [], rostoImg), novo = desenha('#D4121F', ['#121010', '#ECE1D9'], rostoImg)
const img = (l: Chamada[]) => JSON.stringify(l.filter(c => c[0] === 'drawImage').map(c => c[1].slice(1)))
ok(img(novo).length > 2 && img(novo) === img(velho) && novo.find(c => c[0] === 'drawImage')![1][0] === rostoImg, '👑 lenda: o rosto é desenhado IGUAL (mesmo recorte, mesmo lugar) com a camisa nova')
const anel = novo.filter(c => c[0] === 'stroke').map(c => c[2].strokeStyle)
ok(anel.includes('#D4121F'), '👑 lenda: o anel em volta do rosto vem na cor da camisa NOVA')
const depoisDoRosto = novo.slice(novo.findIndex(c => c[0] === 'drawImage') + 1)
ok(!depoisDoRosto.some(c => c[0] === 'fillRect') && !novo.some(c => c[0] === 'fillText'), '👑 lenda: nenhuma listra nem número por cima do rosto')
const sem = desenha('#D4121F', ['#121010', '#ECE1D9'], null)
ok(sem.some(c => c[0] === 'fillText' && c[1][0] === '10') && sem.some(c => c[0] === 'fillRect' && c[2].fillStyle === '#121010'), '🔢 sem rosto: o número continua e as listras do manto aparecem')

console.log(falhas ? `\n❌ ${falhas} falha(s)` : '\n✅ camisas do 2D: tudo certo')
process.exit(falhas ? 1 : 0)

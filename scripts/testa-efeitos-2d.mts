// ✨ Trava dos efeitos de lance do Campo 2D (07/11): chute forte, gol de longe, trave tremendo, chapéu e onde a bola cai.
// Só desenho — então o que se cobra aqui é que cada efeito acende NO lance certo e fica apagado no resto.
import { pousoDaBola, velocidadeBola, ehBomba, golDeLonge, balancoRede, tremorTrave, vitimaDoChapeu, alturaQuique, esticaGoleiro, riscoCarrinho, casaAtacando } from '../src/escalacao/campo2d-efeitos.ts'
let falhas = 0
const ok = (c: boolean, m: string) => { if (c) console.log('✅', m); else { falhas++; console.log('❌', m) } }
// 🎯 onde a bola cai
ok(pousoDaBola({ x: 30, y: 50, h: 2, voo: { x0: 30, y0: 80, x1: 34, y1: 30, t: 0.4, dur: 1.6, alt: 6 } })?.y === 30, 'lançamento alto (motor de sempre): marca o fim do voo')
ok(pousoDaBola({ x: 30, y: 50, h: 0, voo: { x0: 30, y0: 60, x1: 34, y1: 40, t: 0.2, dur: 1, alt: 0 } }) === null, 'passe rasteiro: sem marca')
ok(pousoDaBola({ x: 30, y: 50, h: 2, dono: { lado: 0, x: 30, y: 50 }, voo: null }) === null, 'bola no pé: sem marca')
const p2 = pousoDaBola({ x: 30, y: 50, h: 1, vx: 0, vy: -15, vh: 8 })
ok(!!p2 && p2.y < 30 && p2.y > 20, `motor novo: conta do arremesso (cai em y≈${p2?.y.toFixed(1)})`)
ok(pousoDaBola({ x: 30, y: 50, h: 0.1, vx: 0, vy: -15, vh: 0 }) === null, 'motor novo, bola rasteira: sem marca')
// 💥 chute forte
const v = velocidadeBola({ x: 34, y: 30 }, { x: 34, y: 27 }, 0.1)
ok(v === 30 && ehBomba({ x: 34, y: 30 }, { x: 34, y: 27 }, v), 'bola a 30 m/s indo pro gol de cima = bomba')
ok(!ehBomba({ x: 34, y: 60 }, { x: 34, y: 57 }, 30), 'rápida mas indo pro PRÓPRIO campo (recuo/chutão do meio): não é bomba')
ok(!ehBomba({ x: 34, y: 30 }, { x: 34, y: 28 }, 12), 'chute fraco: não é bomba')
ok(!ehBomba({ x: 34, y: 30 }, { x: 34, y: 27 }, 30, false), 'lançamento rápido (não é chute): não é bomba')
ok(golDeLonge({ x: 34, y: 25 }, 0) && !golDeLonge({ x: 34, y: 10 }, 0), 'gol de 25 m é de longe; de 10 m não')
ok(Math.abs(balancoRede(0.05, true)) > Math.abs(balancoRede(0.05, false)) && balancoRede(1.3, false) === 0 && balancoRede(1.3, true) !== 0, 'rede do gol de longe balança mais e por mais tempo')
// 🔔 trave
ok(tremorTrave(0.02) !== 0 && tremorTrave(0.8) === 0, 'trave treme só logo depois da batida')
// 🎩 chapéu
const zag = { lado: 1 as const, x: 34, y: 41, grupo: 'ZAG' }, longe = { lado: 1 as const, x: 34, y: 20, grupo: 'ZAG' }, gk = { lado: 1 as const, x: 34, y: 3, grupo: 'GOL' }
ok(vitimaDoChapeu({ x: 34, y: 41.5, h: 2 }, { x: 34, y: 44, lado: 0 }, [zag, longe]) === zag, 'bola por cima do marcador colado = chapéu nele')
ok(vitimaDoChapeu({ x: 34, y: 20.5, h: 2 }, { x: 34, y: 44, lado: 0 }, [zag, longe]) === null, 'lançamento passando por cima de alguém LONGE do toque: não é chapéu')
ok(vitimaDoChapeu({ x: 34, y: 41.5, h: 0.3 }, { x: 34, y: 44, lado: 0 }, [zag]) === null, 'bola rasteira: não é chapéu')
ok(vitimaDoChapeu({ x: 34, y: 3.5, h: 2.2 }, { x: 34, y: 14, lado: 0 }, [gk]) === gk, 'cavadinha por cima do goleiro = chapéu no goleiro')
ok(vitimaDoChapeu({ x: 34, y: 41.5, h: 2 }, { x: 34, y: 44, lado: 1 }, [zag]) === null, 'companheiro não leva chapéu')
// ⚽ quique
ok(alturaQuique(0.18) > 0.6 && alturaQuique(0.36 + 0.11) > 0.2 && alturaQuique(0.36 + 0.11) < 0.3 && alturaQuique(0.7) === 0, 'dois quiques: um maior, um menor, depois chão')
// 🧤 goleiro
ok(esticaGoleiro(0.3) === 1 && esticaGoleiro(0.05) < 1 && esticaGoleiro(0.8) === 0, 'goleiro estica rápido, segura e volta')
// 🟫 carrinho
const r = riscoCarrinho({ x: 10, y: 10 }, { x: 20, y: 10 })
ok(Math.abs(r.x1 - 13) < 1e-9 && r.y1 === 10, 'risco do carrinho: no máximo 3 m, na direção da bola')
// 📣 torcida
ok(casaAtacando({ lado: 0, y: 20 }) && !casaAtacando({ lado: 0, y: 60 }) && !casaAtacando({ lado: 1, y: 20 }) && !casaAtacando(null), 'torcida pula só com a casa atacando no terço final')
if (falhas) { console.log(`\n${falhas} falha(s)`); process.exit(1) }
console.log('\nEfeitos do 2D: ok')

// 🚶 Trava da Fan Zone (07/11): o boneco não atravessa casa nem estádio e desliza pela parede; toldo lá no alto não barra.
import { criarColisaoFanZone, passoFanZone, dentroDoEstadio } from '../src/escalacao/presidencia-fanzone-3d.ts'
let falhas = 0
const ok = (c: boolean, m: string) => { if (!c) { falhas++; console.log('❌', m) } else console.log('✅', m) }
const casa = { minX: 10, maxX: 20, minZ: 110, maxZ: 120, base: 0, top: 6, footprint: [{ x: 10, z: 110 }, { x: 20, z: 110 }, { x: 20, z: 120 }, { x: 10, z: 120 }] }
const toldo = { minX: 30, maxX: 40, minZ: 110, maxZ: 120, base: 2.5, top: 3, footprint: [{ x: 30, z: 110 }, { x: 40, z: 110 }, { x: 40, z: 120 }, { x: 30, z: 120 }] }
const bate = criarColisaoFanZone([casa, toldo])
ok(bate(15, 115), 'dentro da casa barra')
ok(bate(9.8, 115), 'encostado na parede (raio do corpo) barra')
ok(!bate(9, 115), 'a 1 m da parede passa')
ok(!bate(35, 115), 'embaixo do toldo passa')
// andando de frente pra casa: para na parede
let p = { x: 0, z: 115 }
for (let i = 0; i < 200; i++) p = passoFanZone(p.x, p.z, 0.1, 0, bate)
ok(p.x < 10 && p.x > 9, `para na parede (x=${p.x.toFixed(2)})`)
// na diagonal: desliza pela parede em vez de travar
let q = { x: 9.5, z: 112 }
for (let i = 0; i < 50; i++) q = passoFanZone(q.x, q.z, 0.1, 0.1, bate)
ok(q.z > 116 && q.x < 10, `desliza pela parede (z=${q.z.toFixed(2)})`)
ok(dentroDoEstadio(0, 0) && !dentroDoEstadio(0, 120), 'estádio continua barrado')
if (falhas) { console.log(`\n${falhas} falha(s)`); process.exit(1) }
console.log('\nFan Zone: colisão ok')

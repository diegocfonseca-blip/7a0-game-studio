// 📱 19/11 (Diego: *"não tá dando pra ver o jogo de tão lento e travando… também quero no celular"*): gera o BONECO LEVE do 3D do mapa.
// Mesmo jogador-estilizado-v1.glb (mesmos ossos, movimentos, UV do uniforme), só com menos triângulos (meshoptimizer). O celular carrega este.
//   node scripts/futebol3d/gera-jogador-leve.mjs [fração=0.3]   (entrada: o boneco ESTILIZADO, que é o que o mapa usa)
import fs from 'node:fs'
import { MeshoptSimplifier } from 'meshoptimizer'
const frac = +(process.argv[2] ?? 0.3)
const ent = 'src/escalacao/futebol3d/assets/jogador-estilizado-v1.glb', sai = 'src/escalacao/futebol3d/assets/jogador-estilizado-leve.glb'
const b = fs.readFileSync(ent)
const jl = b.readUInt32LE(12), j = JSON.parse(b.subarray(20, 20 + jl).toString())
const binIni = 20 + jl + 8, binLen = b.readUInt32LE(20 + jl), bin = b.subarray(binIni, binIni + binLen)
await MeshoptSimplifier.ready
const ler = (acc) => { const a = j.accessors[acc], bv = j.bufferViews[a.bufferView], off = (bv.byteOffset ?? 0) + (a.byteOffset ?? 0); return { a, bv, off } }
const extra = []; let novoTam = bin.length
for (const m of j.meshes) for (const p of m.primitives) {
  const I = ler(p.indices), P = ler(p.attributes.POSITION)
  const idx = I.a.componentType === 5125 ? new Uint32Array(bin.buffer.slice(bin.byteOffset + I.off, bin.byteOffset + I.off + I.a.count * 4)) : Uint32Array.from(new Uint16Array(bin.buffer.slice(bin.byteOffset + I.off, bin.byteOffset + I.off + I.a.count * 2)))
  const stride = P.bv.byteStride ?? 12
  const pos = new Float32Array(P.a.count * 3)
  const dv = new DataView(bin.buffer, bin.byteOffset)
  for (let i = 0; i < P.a.count; i++) for (let k = 0; k < 3; k++) pos[i * 3 + k] = dv.getFloat32(P.off + i * stride + k * 4, true)
  const alvo = Math.floor(idx.length * frac / 3) * 3
  const [res, erro] = MeshoptSimplifier.simplify(idx, pos, 3, alvo, 0.05, ['LockBorder'])
  const out = I.a.componentType === 5125 ? new Uint32Array(res) : new Uint16Array(res)
  const bytes = Buffer.from(out.buffer, out.byteOffset, out.byteLength)
  const pad = (4 - (novoTam % 4)) % 4; if (pad) { extra.push(Buffer.alloc(pad)); novoTam += pad }
  j.bufferViews.push({ buffer: 0, byteOffset: novoTam, byteLength: bytes.length, target: 34963 })
  j.accessors.push({ bufferView: j.bufferViews.length - 1, componentType: I.a.componentType, count: out.length, type: 'SCALAR' })
  p.indices = j.accessors.length - 1
  extra.push(bytes); novoTam += bytes.length
  console.log(`triângulos ${idx.length / 3} → ${out.length / 3} (erro ${erro.toFixed(4)})`)
}
const novoBin = Buffer.concat([bin, ...extra]); const padB = (4 - (novoBin.length % 4)) % 4
const binF = Buffer.concat([novoBin, Buffer.alloc(padB)])
j.buffers[0].byteLength = binF.length
let js = Buffer.from(JSON.stringify(j)); const padJ = (4 - (js.length % 4)) % 4; js = Buffer.concat([js, Buffer.alloc(padJ, 0x20)])
const h = Buffer.alloc(12); h.writeUInt32LE(0x46546C67, 0); h.writeUInt32LE(2, 4); h.writeUInt32LE(12 + 8 + js.length + 8 + binF.length, 8)
const cj = Buffer.alloc(8); cj.writeUInt32LE(js.length, 0); cj.writeUInt32LE(0x4E4F534A, 4)
const cb = Buffer.alloc(8); cb.writeUInt32LE(binF.length, 0); cb.writeUInt32LE(0x004E4942, 4)
fs.writeFileSync(sai, Buffer.concat([h, cj, js, cb, binF]))
console.log(sai, (fs.statSync(sai).size / 1024).toFixed(0) + ' KB')

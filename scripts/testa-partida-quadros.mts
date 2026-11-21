// trava do ritmo do jogo 3D: tenta 60; aparelho que não segura trava em 30 e não volta no meio da partida; jogo novo recomeça em 60.
import assert from 'node:assert/strict'
import { criaRitmoPartida } from '../src/escalacao/presidencia-partida-quadros'
const roda = (r: ReturnType<typeof criaRitmoPartida>, id: string, gapMs: number, quadros: number, t0 = 1000) => { let t = t0; for (let i = 0; i < quadros; i++) { r.observa(t, id); t += gapMs } return t }
{ const r = criaRitmoPartida(); assert.equal(r.alvo(), 60, 'começa tentando 60'); roda(r, 'a', 16.7, 600); assert.equal(r.alvo(), 60, 'aparelho que segura 60 fica em 60') }
{ const r = criaRitmoPartida(); roda(r, 'a', 33, 60); assert.equal(r.alvo(), 60, 'não decide antes de 2 s de amostra'); const t = roda(r, 'a', 33, 200, 5000); assert.equal(r.alvo(), 30, 'não segura 60 → trava em 30')
  roda(r, 'a', 16.7, 600, t); assert.equal(r.alvo(), 30, 'não volta pra 60 no meio da partida'); r.observa(t + 99999, 'b'); assert.equal(r.alvo(), 60, 'partida nova recomeça em 60') }
{ const r = criaRitmoPartida(); const t = roda(r, 'a', 16.7, 300); r.observa(t + 5000, 'a'); roda(r, 'a', 16.7, 300, t + 5016); assert.equal(r.alvo(), 60, 'pausa longa (aba escondida) não conta como engasgo') }
{ const r = criaRitmoPartida(); assert.equal(r.alvo(30), 30, 'aparelho de pouca memória respeita o teto dele') }
console.log('✅ ritmo do jogo 3D: 60 quando segura, 30 firme quando não')

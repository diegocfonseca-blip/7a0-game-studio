// ⏱️ 07/11 — trava do relógio da sala online (Campo 2D/placar): quem chega atrasado entra no minuto do dono; quem acompanha
// a sala segue o próprio relógio (celular com hora errada não faz ninguém pular minuto). Uso: npm run relogio-sala
import assert from 'node:assert/strict'
import { minutoAtrasado, _zeraRelogioSala } from '../src/escalacao/relogio-sala'
const dur = 60_000, T = 1_000_000
_zeraRelogioSala()
// abriu a tela com a rodada 5 rolando há 30 s → metade do jogo
assert.ok(Math.abs(minutoAtrasado(5, T - 30_000, dur, T) - 46.5) < 0.01, 'entra no minuto do dono')
// a rodada 6 chega com a tela aberta → acompanhando: começa do 0' mesmo com o relógio do dono 20 s "adiantado"
assert.equal(minutoAtrasado(6, T + 50_000, dur, T + 70_000), 0, 'quem acompanha não pula')
// voltou do menu no meio da mesma rodada 6 → sincroniza
assert.ok(minutoAtrasado(6, T + 70_000, dur, T + 100_000) > 40, 'voltou do menu: minuto certo')
_zeraRelogioSala()
assert.equal(minutoAtrasado(9, undefined, dur, T), 0, 'sem hora do dono: 0′ como sempre')
_zeraRelogioSala(); assert.equal(minutoAtrasado(9, T - 1_000, dur, T), 0, 'menos de 3 s: 0′')
_zeraRelogioSala(); assert.equal(minutoAtrasado(9, T + 20_000, dur, T), 0, 'hora do futuro (relógio torto): 0′')
_zeraRelogioSala(); assert.equal(minutoAtrasado(9, T - 90_000, dur, T), 0, 'jogo já acabou: 0′ (a tela mostra o fim pelo `finished`)')
_zeraRelogioSala(); assert.ok(minutoAtrasado(9, T - 59_999, dur, T) <= 92, 'nunca passa de 92′')
console.log('✅ relógio da sala: atrasado entra no minuto certo · quem acompanha não pula · relógio torto não estraga')

// 🏆 trava da ESTANTE DE TROFÉUS das Minhas Ligas (04/10, liga KD1TUL do Loopesmiranda: 11 troféus
// viraram 7). Toda largada da sala de espera nascia com a MESMA semente (código da sala) e a
// estante guardava a linha por semente — a 1ª temporada de cada largada apagava a da largada
// anterior (1 → 4 → 10 → 11 viraram uma linha só). E, de quebra, o pregão repetia a mesma ordem de
// cartas/clubes toda temporada (por isso "nunca aparecia ataque bom no leilão de clubes").
// Regras que esta trava segura:
//   1. em Minhas Ligas a linha da estante é da TEMPORADA (sem `matchSeed`); sala rápida segue por semente;
//   2. a semente da largada de uma liga leva o número da temporada.
//   npm run estante
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
const screens = readFileSync(new URL('../src/escalacao/screens.tsx', import.meta.url), 'utf8')
const store = readFileSync(new URL('../src/escalacao/store.tsx', import.meta.url), 'utf8')
assert.match(screens, /gravar=\{\{[\s\S]{0,900}?matchSeed: state\.ligaMode \? undefined : state\.seed/, 'a estante da liga voltou a ser gravada por semente')
assert.match(store, /s\.seed = hashCode\(action\.roomCode \+ \(action\.liga \? '#t' \+ \(action\.seasonNo \?\? 1\) : ''\)/, 'a semente da largada da liga perdeu o número da temporada')
// o caminho por temporada continua existindo no LigaHub (é ele que a liga usa agora)
const hub = readFileSync(new URL('../src/escalacao/ligahub.tsx', import.meta.url), 'utf8')
assert.match(hub, /gravar\.matchSeed != null[\s\S]{0,600}?\.eq\('season_no', gravar\.seasonNo\)/, 'sumiu o caminho por temporada no LigaHub')
console.log('✅ estante: liga grava por temporada, semente da largada muda a cada temporada')

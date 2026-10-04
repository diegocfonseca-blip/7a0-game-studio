// ☁️💸 trava do SAVE NA NUVEM (04/10). A conta do Supabase do Diego estourou o tráfego (~590 GB no
// mês) porque o jogo baixava o save inteiro da carreira (~1 MB) a cada minuto de jogo e toda vez que a
// home voltava pro foco. Regra dele: *"o save do usuário na carreira só deve salvar após ele apertar em
// salvar"*. Esta trava reprova se alguém religar o envio automático ou o download sem conferir o carimbo.
//   npm run nuvem
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
const src = readFileSync(new URL('../src/escalacao/store.tsx', import.meta.url), 'utf8')
const corpo = nome => { const i = src.indexOf(`export async function ${nome}(`); assert.ok(i >= 0, `sumiu ${nome}`); return src.slice(i, src.indexOf('\n}\n', i)) }
const save = corpo('savePyramidCloud')
assert.match(save, /if \(!force\) return/, 'a nuvem só recebe em ação explícita (force)')
assert.ok(save.indexOf('carimboDaNuvem(') >= 0 && save.indexOf('carimboDaNuvem(') < save.indexOf("select('save"), 'antes de baixar o save inteiro, pergunta só o carimbo')
const sync = corpo('syncCareersWithCloud')
assert.ok(sync.indexOf('carimboDaNuvem(') >= 0 && sync.indexOf('carimboDaNuvem(') < sync.indexOf('loadPyramidCloud('), 'a home pergunta o carimbo antes de baixar')
assert.ok(!/savePyramidCloud\(/.test(sync), 'a home NÃO sobe save pra nuvem sozinha')
// o autosave do jogo (efeito que grava esc-solo-career com lacre) não chama a nuvem
const auto = src.slice(src.indexOf('AUTOSAVE da carreira OFFLINE'), src.indexOf('autosave da CARREIRA do basquete'))
assert.ok(auto.length > 100 && !/savePyramidCloud\(/.test(auto), 'o autosave grava só no aparelho')
// todo chamado que sobrou é com force=true (botão Salvar, trocar carreira, Bafo)
const chamadas = [...readFileSync(new URL('../src/escalacao/pyramidseason.tsx', import.meta.url), 'utf8').matchAll(/savePyramidCloud\(([^)]*)\)/g), ...src.matchAll(/(?<!function )savePyramidCloud\(([^)]*)\)/g)].map(m => m[1])
for (const a of chamadas) assert.match(a, /, true$/, `chamada sem force: savePyramidCloud(${a})`)
console.log(`✅ nuvem: só sobe no Salvar (${chamadas.length} chamadas com force), e só baixa quando o carimbo mudou`)

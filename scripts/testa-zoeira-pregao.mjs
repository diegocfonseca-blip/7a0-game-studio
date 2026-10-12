// 🔥 trava da ZOEIRA DO PREGÃO (12/10): uma faixa só, na ordem caro › quase › pechincha,
// e nada quando a revelação foi normal. Frase em PT e EN, a mesma pra sala toda.
//   npm run zoeira
import assert from 'node:assert/strict'
import { createServer } from 'vite'
const vite = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom', logLevel: 'silent' })
try {
  const { zoeiraDoPregao: Z } = await vite.ssrLoadModule('/src/escalacao/zoeira-pregao.ts')
  const base = { vencedor: 'Power Guido', carta: 'Goleiros do Bayern', forte: false, semente: 7 }
  // o print do Diego: 55 contra 14
  const bay = Z({ ...base, pago: 55, outros: [{ nome: 'Real Pirituba', valor: 14 }, { nome: 'Cativeiro', valor: 9 }] })
  assert.equal(bay?.tipo, 'caro'); assert.ok(bay.titulo.length > 10 && bay.sub.length > 5)
  assert.equal(Z({ ...base, pago: 30, outros: [] })?.tipo, 'caro', 'ninguém mais quis e deu 30')
  assert.equal(Z({ ...base, pago: 20, outros: [] }), null, 'sozinho por 20 é normal')
  assert.equal(Z({ ...base, pago: 25, outros: [{ nome: 'X', valor: 15 }] }), null, 'não chega no dobro')
  assert.equal(Z({ ...base, pago: 21, outros: [{ nome: 'Pepe', valor: 20 }] })?.tipo, 'quase')
  assert.equal(Z({ ...base, pago: 22, outros: [{ nome: 'Pepe', valor: 20 }] })?.tipo, 'quase')
  assert.equal(Z({ ...base, pago: 23, outros: [{ nome: 'Pepe', valor: 20 }] }), null)
  assert.equal(Z({ ...base, pago: 6, forte: true, outros: [{ nome: 'X', valor: 2 }] })?.tipo, 'pechincha')
  assert.equal(Z({ ...base, pago: 6, forte: false, outros: [{ nome: 'X', valor: 2 }] }), null, 'barato e fraco é só barato')
  assert.equal(Z({ ...base, pago: 0, outros: [] }), null)
  // mesma entrada = mesma frase (a sala toda vê igual) · EN existe
  assert.deepEqual(bay, Z({ ...base, pago: 55, outros: [{ nome: 'Real Pirituba', valor: 14 }, { nome: 'Cativeiro', valor: 9 }] }))
  const en = Z({ ...base, pago: 55, outros: [{ nome: 'Real Pirituba', valor: 14 }], en: true })
  assert.notEqual(en.titulo, Z({ ...base, pago: 55, outros: [{ nome: 'Real Pirituba', valor: 14 }] }).titulo)
  // nunca sai frase com "undefined"/"NaN" em nenhuma semente
  for (let s = 0; s < 200; s++) for (const en of [false, true]) for (const caso of [
    { pago: 55, outros: [{ nome: 'A', valor: 10 }] }, { pago: 40, outros: [] }, { pago: 11, outros: [{ nome: 'A', valor: 10 }, { nome: 'B', valor: 10 }] }, { pago: 3, forte: true, outros: [] },
  ]) { const z = Z({ ...base, ...caso, semente: s, en }); assert.ok(z && !/undefined|NaN/.test(z.titulo + z.sub), JSON.stringify(z)) }
  console.log('✅ zoeira do pregão: caro › quase › pechincha, uma faixa só, PT e EN')
} finally { await vite.close() }

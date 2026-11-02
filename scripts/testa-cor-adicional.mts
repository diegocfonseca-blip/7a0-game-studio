// 🎨 TRAVA da COR ADICIONAL (02/11, Diego). Uso: npm run cor-adicional
// Reprova se: a cor comprada mudar o PLANO (tier/selo); a marca valer sem ⭐/👑 (sem plano = sem cor); o stripEmoji deixar
// alguém forjar a cor digitando; dourado/prata/bege/preto aparecerem à venda; ou o preço sair da régua (acima de 9,90).
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { APOIO_PERKS, CORES_EXTRA, COR_EXTRA_PRECO, corExtraDoNome, vesteCor, comCorDoNome, stripEmoji } from '../src/escalacao/apoio'
// o mesmo leitor do jogo (perkFromSelo/perkDoNome/perkFromName/perkColor): selo do plano + a cor do mesmo nome
const perkFromSelo = (n: string) => comCorDoNome(n.includes('👑') ? APOIO_PERKS.ouro : n.includes('⭐') ? APOIO_PERKS.prata : n.includes('💎') ? APOIO_PERKS.roxo : n.includes('\u2063') ? APOIO_PERKS.verde : null, n)
for (const [f, re] of [['src/escalacao/pyramidseason.tsx', /export function perkFromSelo[\s\S]{0,400}comCorDoNome/], ['src/escalacao/chat-sala.tsx', /export function perkDoNome[\s\S]{0,200}comCorDoNome/],
  ['src/escalacao/lobby.tsx', /const perkFromName[\s\S]{0,120}comCorDoNome/], ['src/escalacao/screens.tsx', /const perkColor = \(name: string\) => comCorDoNome/]] as const)
  assert.ok(re.test(readFileSync(f, 'utf8')), `${f}: o leitor de cor do nome tem que passar pelo comCorDoNome`)

const ok = (m: string) => console.log('  ✅', m)
const cores = Object.keys(CORES_EXTRA)
assert.deepEqual(cores.sort(), ['azul', 'laranja', 'rosa', 'roxo', 'turquesa', 'verde', 'vermelho'])
assert.ok(!cores.some(c => ['dourado', 'ouro', 'prata', 'bege', 'preto'].includes(c)))
ok('à venda só as 7 brilhantes — dourado, prata, bege e preto fora')
assert.ok(COR_EXTRA_PRECO > 9.9); ok(`preço ${COR_EXTRA_PRECO} (acima de 9,90)`)
const marcas = Object.values(CORES_EXTRA).map(c => c.marca)
assert.equal(new Set(marcas).size, 7); assert.ok(!marcas.includes('⁣')); ok('uma marca invisível diferente por cor (e nenhuma é a do verde antigo)')

for (const c of cores as (keyof typeof CORES_EXTRA)[]) {
  const nome = `Pirlo FC 👑${CORES_EXTRA[c].marca}`
  assert.equal(corExtraDoNome(nome), c)
  const p = perkFromSelo(nome)!
  assert.equal(p.tier, 'ouro'); assert.equal(p.selo, '👑'); assert.equal(p.grad, CORES_EXTRA[c].grad)
  const sp = perkFromSelo(`Zé FC ⭐${CORES_EXTRA[c].marca}`)!
  assert.equal(sp.tier, 'prata'); assert.equal(sp.grad, CORES_EXTRA[c].grad)
}
ok('com 👑/⭐ a cor comprada pinta o nome e o PLANO continua o mesmo (tier e selo)')
assert.equal(perkFromSelo(`Grátis FC${CORES_EXTRA.rosa.marca}`), null)
assert.equal(vesteCor(APOIO_PERKS.bege, 'rosa'), APOIO_PERKS.bege)
assert.equal(comCorDoNome(APOIO_PERKS.roxo, `X 💎${CORES_EXTRA.azul.marca}`)!.grad, APOIO_PERKS.roxo.grad)
ok('sem plano (bege/roxo antigo) a marca é ignorada — fica a cor de sempre')
for (const m of marcas) assert.equal(stripEmoji(`Esperto FC${m}`), 'Esperto FC')
ok('nome digitado perde as marcas (ninguém se pinta sozinho)')
assert.equal(perkFromSelo('Pirlo FC 👑'), APOIO_PERKS.ouro); ok('quem não comprou nada continua igualzinho')
const mig = readFileSync('supabase/migrations/20261102200000_cor_adicional.sql', 'utf8')
assert.ok(/esc_plano_rank\(lower\(p_email\)\), 0\) < 1 then return null/.test(mig), 'o banco tem que barrar quem não tem plano')
assert.ok(/return 14\.90/.test(mig) && COR_EXTRA_PRECO === 14.9, 'preço do banco = preço da tela')
ok('o banco barra quem não tem plano e cobra o mesmo preço da tela')
console.log('✅ cor adicional: tudo certo')

// 💙 TRAVA da CASA LUCA (05/11). Uso: npm run casa-luca
// Reprova se: o Plano Coração não der EXATAMENTE 50% nos mensais (na tela e no servidor); o servidor aceitar desconto vindo do
// cliente; a doação sair da faixa (mín. R$ 2) ou der alguma coisa no jogo; o mural mostrar valor/total/contagem ou aparecer vazio;
// a foto não for apagada na decisão; ou a migration usar drop policy / revoke / delete.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { MENSAIS } from '../src/escalacao/planos-regras'
import { precoCoracaoCentavos, precoMensal, CORACAO_DESCONTO, DOACAO_VALORES, DOACAO_MIN, DOACAO_MAX, valorDoacao, refDoacao, reaisDaRef, muralParaTela, muralAparece, nomeMural } from '../src/escalacao/casa-luca-regras'

const ok = (m: string) => console.log('  ✅', m)
const ler = (f: string) => readFileSync(f, 'utf8')

// ─── A) 50% nos mensais ───
assert.equal(CORACAO_DESCONTO, 0.5)
assert.equal(precoCoracaoCentavos(990), 495)
assert.equal(precoCoracaoCentavos(1490), 745)
for (const pl of Object.keys(MENSAIS) as (keyof typeof MENSAIS)[]) {
  const cheio = precoMensal(pl, false), meio = precoMensal(pl, true)
  assert.equal(cheio, MENSAIS[pl].preco)
  assert.ok(Math.abs(meio - cheio / 2) <= 0.005, `${pl}: ${meio} não é metade de ${cheio}`)
}
ok('Plano Coração = metade de TODOS os mensais (9,90 → 4,95 · 14,90 → 7,45)')

const chk = ler('supabase/functions/vendria-checkout/index.ts')
const precosServidor = [...chk.matchAll(/(craque_\w+): \{ centavos: (\d+)/g)].map(m => [m[1], Number(m[2])] as const)
assert.equal(precosServidor.length, Object.keys(MENSAIS).length, 'todo mensal da tela tem que estar no servidor')
for (const [pl, c] of precosServidor) assert.equal(c, Math.round(MENSAIS[pl as keyof typeof MENSAIS].preco * 100), `${pl}: preço do servidor ≠ tela`)
assert.ok(/const precoCoracaoCentavos = \(c: number\) => Math\.round\(c \/ 2\)/.test(chk), 'o servidor tem que cortar pela metade')
assert.ok(/rpc\('esc_coracao_tem_desconto', \{ p_email: email \}\)/.test(chk), 'o desconto sai do BANCO, pelo e-mail do LOGIN')
assert.ok(/const coracao = temDesc === true/.test(chk), 'resposta estranha do banco = preço cheio')
assert.ok(/totalInCents: centavos/.test(chk), 'a assinatura nasce com o preço calculado no servidor')
const corpoLido = chk.match(/await req\.json\(\)\)\?\.(\w+)/g) ?? []
assert.ok(corpoLido.every(l => /plano/.test(l)), 'do corpo do pedido o servidor só lê o PLANO (nunca preço nem desconto)')
ok('o servidor (vendria-checkout) cobra a metade só quando o banco diz que a conta foi aprovada — o cliente não manda preço')

// ─── B) doação ───
assert.deepEqual([...DOACAO_VALORES], [5, 10, 20]); assert.equal(DOACAO_MIN, 2)
assert.equal(valorDoacao('2'), 2); assert.equal(valorDoacao('1,99'), null); assert.equal(valorDoacao('7,50'), 7.5)
assert.equal(valorDoacao('R$ 12.5'), 12.5); assert.equal(valorDoacao('1.000'), 1000); assert.equal(valorDoacao('1001'), null)
assert.equal(valorDoacao('abc'), null); assert.equal(valorDoacao('0'), null)
assert.equal(refDoacao(5), 'v500'); assert.equal(refDoacao(7.5), 'v750'); assert.equal(reaisDaRef('v500'), 5)
assert.equal(reaisDaRef('v199'), null); assert.equal(reaisDaRef('v100001'), null); assert.equal(reaisDaRef('500'), null)
for (const v of [...DOACAO_VALORES, DOACAO_MIN, DOACAO_MAX, 7.5]) assert.equal(reaisDaRef(refDoacao(v)), v)
ok('doação: 5 · 10 · 20 · outro valor (mínimo R$ 2, teto R$ 1.000), ref = centavos')

const mig = ler('supabase/migrations/20261105120000_casa_luca.sql')
assert.ok(/substring\(p_ref from 2\)::int < 200 or substring\(p_ref from 2\)::int > 100000 then return null/.test(mig), 'o banco tem que ter a MESMA faixa')
assert.ok(/'\^v\[0-9\]\{3,6\}\$'/.test(mig), 'o banco tem que ler a mesma ref')
assert.equal(mig.split("'cor_extra','doacao_luca'])) not valid").length - 1, 2, 'doacao_luca nos DOIS filtros (pedido e pagamento) — senão o webhook falha')
assert.ok(!/esc_mp_entregar/.test(mig.replace(/--.*$/gm, '')), 'a doação NÃO tem entrega: não pode mexer no esc_mp_entregar')
const pix = ler('supabase/functions/mp-criar-pix/index.ts')
assert.ok(/doacao_luca:/.test(pix), 'mp-criar-pix tem que conhecer o produto')
ok('doação: o banco cobra a mesma faixa e não entrega NADA no jogo')

// ─── mural ───
const vindo = [
  { nome: 'Leões da Vila EC', criado_em: '2026-11-04T10:00:00Z', valor: 50, total: 999, n: 3, email: 'x@y.z' },
  { nome: 'Real Quintal FC', criado_em: '2026-11-05T09:00:00Z' },
  { nome: ' ', criado_em: '2026-11-05T09:00:00Z' },
]
const tela = muralParaTela(vindo)
assert.deepEqual(tela.map(l => l.nome), ['Real Quintal FC', 'Leões da Vila EC'], 'mais novo primeiro, sem nome vazio')
for (const l of tela) assert.deepEqual(Object.keys(l).sort(), ['criado_em', 'nome'], 'mural só leva nome + data')
assert.equal(muralAparece(muralParaTela([])), false); assert.equal(muralAparece(muralParaTela(null)), false); assert.equal(muralAparece(tela), true)
assert.ok(/returns table \(nome text, criado_em timestamptz\)/.test(mig), 'a função pública do mural só devolve nome + data')
const fnMural = mig.slice(mig.indexOf('create or replace function public.esc_luca_mural()'), mig.indexOf('grant execute on function public.esc_luca_mural()'))
assert.ok(!/valor|count\(|sum\(|esc_mp_pedidos/.test(fnMural), 'o mural público não pode ler valor, contar nem somar')
const ui = ler('src/escalacao/casa-luca.tsx')
const muralUi = ui.slice(ui.indexOf('export function MuralLuca'), ui.indexOf('// ─── A) PLANO CORAÇÃO'))
assert.ok(!/lista\.length\}|\.length\} |\.valor|\btotal\b|precoTxt|reais\(/.test(muralUi), 'a tela do mural não mostra contagem nem valor')
assert.equal(nomeMural('  Pé de   Pano FC 💙 '), 'Pé de Pano FC'); assert.equal(nomeMural('www.golpe.com'), null); assert.equal(nomeMural('a'), null)
ok('mural: só nome + data, mais novo primeiro, some vazio, nunca valor/total/contagem')

// ─── privacidade / foto ───
const fn = ler('supabase/functions/coracao-decidir/index.ts')
assert.ok(/!== ADMIN\) return resp\(403/.test(fn), 'só a conta do Diego decide (pelo login)')
assert.ok(/storage\.from\(BUCKET\)\.remove\(\[path\]\)/.test(fn), 'a decisão APAGA a foto do storage')
assert.ok(/esc_coracao_foto_apagada/.test(fn), 'o registro perde o caminho da foto')
assert.ok(/'coracao-provas', 'coracao-provas', false/.test(mig), 'o bucket tem que ser PRIVADO')
assert.ok(/coracao_provas_admin_le[\s\S]{0,260}'diego\.c\.fonseca@gmail\.com'/.test(mig), 'só o Diego lê as fotos')
assert.ok(/'SO_SERVIDOR'[\s\S]{0,200}esc_coracao_pedidos where email/.test(mig), 'quem tem desconto só o servidor pergunta')
assert.ok(/Sua foto só é vista pelo Diego/.test(ui) && /APAGADA/.test(ui), 'o aviso de privacidade está no formulário')
ok('foto: bucket privado, só o Diego vê, apagada na decisão; aviso de privacidade no formulário')

// ─── selo e trava ───
const apoio = ler('src/escalacao/apoio.tsx')
assert.ok(/let seloCoracao = false/.test(apoio), 'o selo começa DESLIGADO')
assert.ok(/esc_coracao_prefs[\s\S]{0,120}selo boolean not null default false/.test(mig), 'no banco o selo também começa desligado')
assert.ok(!/Plano Coração|Heart Plan/.test(apoio.slice(apoio.indexOf('export const SELO_CORACAO'), apoio.indexOf('export const SELO_CORACAO') + 60)), 'o selo não diz "Plano Coração"')
const sport = ler('src/escalacao/sport.ts')
assert.ok(/const CASA_LUCA_GERAL = false/.test(sport) && /CASA_LUCA_TESTERS = new Set\(\['diego\.c\.fonseca@gmail\.com'\]\)/.test(sport), 'trava só na conta do Diego')
assert.ok(/aberto boolean not null default false/.test(mig), 'no banco também começa fechado')
ok('selo 💙 desligado por padrão e sem dizer o plano; tudo travado só pro Diego (tela e banco)')

// ─── regra do repo ───
for (const proibido of [/drop\s+policy/i, /\brevoke\b/i, /\bdelete\b/i]) assert.ok(!proibido.test(mig) /* nem em comentário: a ferramenta cancela */, `migration com ${proibido}`)
ok('migration sem drop policy / revoke / delete')
console.log('✅ casa luca: tudo certo')

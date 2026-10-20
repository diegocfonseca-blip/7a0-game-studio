// 📧 E-MAIL DA CAMPANHA "VOLTA PRO JOGO" (19/10, Diego: "atualizamos MT coisas já… muda o visual do e-mail").
// UMA lista de blocos vira as DUAS coisas, pra nunca divergirem:
//   1. a prévia (PNG) pro Diego aprovar   → node scripts/email/campanha-volta.mjs --foto <pasta>
//   2. o SQL que troca `esc_email_html` e `esc_email_assunto` no banco → sai em scripts/email/campanha-volta.sql
// Só os blocos e o assunto mudam; o disparo (`esc_email_lote`), a fila, o medidor e o "sair da lista" ficam iguais.
// Regra: só entra no e-mail o que está LIBERADO PRA TODOS (nada que esteja em teste só na conta do Diego).
import { writeFileSync } from 'node:fs'

export const ASSUNTO = 'O Leilão Legends virou outro jogo. Vem ver 🔨⚽'
export const BLOCOS = [
  ['🔨', 'PREGÃO ABERTO: lance na cara de todo mundo', 'Um jeito novo de leiloar: a carta vem coberta, todo mundo vê o lance do outro e o martelo bate em 5 segundos. Só descobre quem comprou quando a carta vira.'],
  ['🌎', 'Libertadores, Champions e MUNDIAL na carreira', 'Faz bonito no Brasil e um clube grande te chama pra ser técnico convidado. Ganhou a Libertadores? A Champions abre. E no fim, Mundial em jogo único.'],
  ['📺', 'CENTRAL LEGENDS: a casa da sua carreira', 'A carreira agora abre numa central com o giro da rodada, o jornal O MARTELO, as transferências e a tabela, tudo numa tela só.'],
  ['🏢', 'Compre uma SAF e tenha DOIS clubes', 'Investe numa SAF, ela cresce por 10 temporadas e depois você assume o comando. E os rivais agora têm elenco de 22, se cansam, se machucam e vendem jogador.'],
  ['⭐', 'No online: CHAMPIONS de 36 e LEILÃO DE CLUBES', 'A Champions no formato de hoje, com 36 numa tabela só e repescagem. E dá pra leiloar o clube inteiro em vez de jogador por jogador.'],
  ['👥', 'AMIGOS, ranking e medalha da semana', 'Adicione a galera, veja quem está online e entre na sala dela. Quem fecha a semana no top 3 do ranking fica 30 dias com a medalha 🥇🥈🥉 no nome.'],
]
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/** o HTML do e-mail (mesmo desenho de sempre: creme, borda preta, sombra dura, botão dourado) */
export function html(nome = 'Técnico', sair = 'https://leilaolegends.com/?sair=voce%40email.com') {
  const blocos = BLOCOS.map(([e, t, x]) =>
    `<div style="border:3px solid #0C0C0C;border-radius:12px;background:#fff;padding:12px 14px;margin-bottom:10px">`
    + `<p style="margin:0 0 3px;font-size:15px;font-weight:900;color:#0C0C0C;line-height:1.3">${e} ${esc(t)}</p>`
    + `<p style="margin:0;font-size:13.5px;font-weight:500;color:#444;line-height:1.5">${esc(x)}</p></div>`).join('')
  return `<div style="background:#F4ECD6;padding:24px 14px;font-family:system-ui,-apple-system,Segoe UI,Arial,sans-serif">`
    + `<div style="max-width:540px;margin:0 auto">`
    + `<div style="background:#0C0C0C;border:4px solid #0C0C0C;border-radius:18px 18px 0 0;padding:20px 22px">`
    + `<p style="margin:0;color:#FFC400;font-size:24px;font-weight:900;letter-spacing:.5px">🔨 LEILÃO LEGENDS</p>`
    + `<p style="margin:5px 0 0;color:rgba(255,255,255,.65);font-size:13px;font-weight:700">o leilão às cegas de lendas do futebol</p></div>`
    + `<div style="background:#fff;border:4px solid #0C0C0C;border-top:none;border-radius:0 0 18px 18px;padding:22px;box-shadow:6px 6px 0 #0C0C0C">`
    + `<p style="margin:0 0 8px;font-size:21px;font-weight:900;color:#0C0C0C;line-height:1.25">E aí, ${esc(nome)}! 👋</p>`
    + `<p style="margin:0 0 18px;font-size:15px;font-weight:600;color:#333;line-height:1.6">`
    + `Faz um tempo que você não aparece, e <b>o jogo não parou nem um dia</b>. Saiu tanta coisa que dá pra dizer que é outro jogo. Olha só o que tem agora:</p>`
    + blocos
    + `<div style="text-align:center;margin:22px 0 6px">`
    + `<a href="https://leilaolegends.com" style="display:inline-block;background:#FFC400;color:#0C0C0C;text-decoration:none;border:4px solid #0C0C0C;border-radius:14px;padding:15px 30px;font-size:18px;font-weight:900;box-shadow:5px 5px 0 #0C0C0C">🔨 VOLTAR PRO MEU TIME</a></div>`
    + `<p style="margin:14px 0 0;font-size:13px;font-weight:600;color:#666;line-height:1.55;text-align:center">Sua conta continua lá, com o seu time e as suas cartas. É só entrar e chamar a galera pra uma sala.</p>`
    + `</div>`
    + `<p style="margin:16px 8px 0;font-size:11.5px;font-weight:600;color:rgba(12,12,12,.5);line-height:1.6;text-align:center">`
    + `Você recebe este e-mail porque tem conta no Leilão Legends.<br>`
    + `<a href="${sair}" style="color:rgba(12,12,12,.6)">Não quero mais receber e-mails</a> · `
    + `<a href="mailto:contato@leilaolegends.com" style="color:rgba(12,12,12,.6)">falar com a gente</a></p>`
    + `</div></div>`
}

// o SQL: o mesmo HTML com o nome e o link de sair trocados por pedaços do banco
const NOME = '@@NOME@@', SAIR = '@@SAIR@@'
const q = s => `'${s.replace(/'/g, "''")}'`
const partes = html(NOME, SAIR).split(new RegExp(`(${NOME}|${SAIR})`))
const corpo = partes.map(p => p === NOME ? '(select nome from v)' : p === SAIR ? '(select sair from v)' : q(p)).join('\n  || ')
writeFileSync(new URL('./campanha-volta.sql', import.meta.url), `-- 📧 GERADO por scripts/email/campanha-volta.mjs (não editar à mão). Troca só o TEXTO do e-mail da campanha.
-- Voltar ao texto anterior: o corpo antigo está no histórico do git (scripts/email/campanha-volta-antes.sql).
create or replace function public.esc_email_assunto() returns text language sql immutable set search_path to 'public'
as $f$ select ${q(ASSUNTO)} $f$;

create or replace function public.esc_email_html(p_nome text, p_email text) returns text language sql stable set search_path to 'public'
as $f$
with v as (
  select replace(replace(replace(coalesce(nullif(trim(p_nome), ''), 'Técnico'), '&', '&amp;'), '<', '&lt;'), '>', '&gt;') as nome,
         'https://leilaolegends.com/?sair=' || replace(replace(p_email, '@', '%40'), '+', '%2B') as sair
)
select
  ${corpo}
$f$;
`)

const i = process.argv.indexOf('--foto')
if (i > 0) {
  const { chromium } = await import('playwright-core')
  const out = process.argv[i + 1] || '.'
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
  const p = await b.newPage({ viewport: { width: 430, height: 900 }, deviceScaleFactor: 2 })
  await p.setContent(`<!doctype html><meta charset="utf-8"><body style="margin:0">`
    + `<div style="background:#fff;font:600 13px system-ui;padding:10px 14px;border-bottom:1px solid #ddd"><b>Leilão Legends</b><br>${esc(ASSUNTO)}</div>${html('Diego')}</body>`)
  await p.screenshot({ path: `${out}/email-campanha-novo.png`, fullPage: true })
  await b.close(); console.log('📸', `${out}/email-campanha-novo.png`)
}

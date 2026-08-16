// ─── 📡 RADAR DO REDDIT (Diego 16/08) ──────────────────────────────────────
//
// O Diego: *"eu preciso entrar no Reddit… procurar bastante comunidade, não tem
// como fazer isso de forma automática?"*. Tem — a parte que DEMORA dá pra
// automatizar inteira: **achar onde falar e achar quem já está perguntando.**
//
// O que este radar faz (só LEITURA, não posta nada em lugar nenhum):
//   1. Procura COMUNIDADES que combinam com o jogo (futebol, manager, jogos de
//      navegador, jogar com amigos), em português e inglês.
//   2. De cada uma, pega tamanho, movimento e **as REGRAS** — e marca quais
//      proíbem divulgação. Isso é o ouro: posta no lugar errado e você é
//      removido e ainda queima o domínio.
//   3. Procura CONVERSAS abertas onde alguém está pedindo justamente um jogo
//      assim ("alguém conhece um jogo de futebol pra jogar com amigos?").
//      Responder quem PERGUNTOU é o que converte e o que nunca é banido.
//   4. Escreve um relatório em HTML pra você abrir e sair respondendo.
//
// ⚠️ POR QUE ELE NÃO POSTA: mandar o mesmo texto pra vários subs é o padrão que
// faz o Reddit banir o DOMÍNIO `leilaolegends.com` — e aí seu link some de todo
// lugar de uma vez, sem volta fácil. O robô acha o lugar; quem fala é você.
//
// COMO RODAR (no SEU computador — a máquina do Claude não alcança o Reddit):
//   node scripts/reddit-radar.mjs
//   → gera `reddit-radar.html`, é só abrir no navegador.
//
// Precisa de Node 18+. Não instala nada.

const UA = 'leilaolegends-radar/1.0 (por Diego, dono do leilaolegends.com)'
const ESPERA = 1200 // ms entre chamadas — educado com o Reddit, não toma bloqueio

// o que o jogo É, em palavras que as pessoas usam pra procurar
const COMUNIDADES = [
  'futebol', 'brasil futebol', 'cartola fc', 'fantasy football brasil',
  'jogos brasil', 'jogos online', 'jogos de navegador',
  'football manager', 'soccer games', 'browser games', 'webgames',
  'incremental games', 'football cards', 'card collecting',
  'indie games', 'gamedev brasil', 'jogos para jogar com amigos',
]

// gente PEDINDO um jogo assim — é aqui que você entra na conversa
const CONVERSAS = [
  'jogo de futebol pra jogar com amigos',
  'algum jogo tipo cartola',
  'jogo de futebol no navegador',
  'jogo pra jogar com os amigos no zap',
  'recomendem jogo de futebol',
  'football game to play with friends',
  'browser football manager game',
  'game like fantasy football with friends',
  'multiplayer football game browser',
]

// palavras que denunciam sub que PROÍBE divulgação (não poste nesses)
const PROIBE = /no self[- ]?promo|self[- ]?promotion|no advertis|no promo|sem divulga|proibid[oa] divulga|no spam|banned.*link/i
// e as que indicam sub que ACEITA (dia de divulgação, thread própria)
const ACEITA = /self[- ]?promo.*(saturday|sunday|friday|thread|megathread|allowed)|divulga.*(permitid|quinta|sexta|thread)/i

const dorme = ms => new Promise(r => setTimeout(r, ms))
async function pega(url) {
  try {
    const r = await fetch(url, { headers: { 'User-Agent': UA } })
    if (!r.ok) return null
    return await r.json()
  } catch { return null }
}

async function acharComunidades() {
  const achadas = new Map()
  for (const termo of COMUNIDADES) {
    const j = await pega(`https://www.reddit.com/subreddits/search.json?q=${encodeURIComponent(termo)}&limit=15`)
    await dorme(ESPERA)
    for (const c of j?.data?.children ?? []) {
      const d = c.data
      if (!d?.display_name || d.over18) continue
      if ((d.subscribers ?? 0) < 800) continue // muito pequeno, não vale o tempo
      if (!achadas.has(d.display_name)) {
        achadas.set(d.display_name, {
          nome: d.display_name, inscritos: d.subscribers ?? 0,
          online: d.accounts_active ?? 0, sobre: (d.public_description || '').slice(0, 180),
          achadoPor: termo, regras: null, veredito: '⏳',
        })
      }
    }
    console.error(`  buscando "${termo}"… ${achadas.size} comunidades até agora`)
  }
  return [...achadas.values()].sort((a, b) => b.inscritos - a.inscritos)
}

async function lerRegras(sub) {
  const j = await pega(`https://www.reddit.com/r/${sub.nome}/about/rules.json`)
  await dorme(ESPERA)
  const txt = (j?.rules ?? []).map(r => `${r.short_name}. ${r.description ?? ''}`).join(' \n')
  sub.regras = (j?.rules ?? []).map(r => r.short_name).slice(0, 6)
  if (ACEITA.test(txt)) sub.veredito = '🟢 aceita divulgação (tem dia/thread própria)'
  else if (PROIBE.test(txt)) sub.veredito = '🔴 PROÍBE divulgação — só participe, não poste link'
  else sub.veredito = '🟡 não achei regra clara — leia antes de postar'
  sub.regrasTexto = txt.slice(0, 400)
}

async function acharConversas() {
  const posts = []
  for (const q of CONVERSAS) {
    const j = await pega(`https://www.reddit.com/search.json?q=${encodeURIComponent(q)}&sort=new&t=month&limit=25`)
    await dorme(ESPERA)
    for (const c of j?.data?.children ?? []) {
      const d = c.data
      if (!d?.permalink || d.over_18) continue
      posts.push({
        titulo: d.title, sub: d.subreddit, comentarios: d.num_comments ?? 0,
        quando: new Date((d.created_utc ?? 0) * 1000).toISOString().slice(0, 10),
        link: 'https://www.reddit.com' + d.permalink, achadoPor: q,
      })
    }
    console.error(`  conversas "${q}"… ${posts.length} achadas`)
  }
  // mais recentes primeiro, sem repetir
  const vistos = new Set()
  return posts.filter(p => (vistos.has(p.link) ? false : (vistos.add(p.link), true)))
    .sort((a, b) => b.quando.localeCompare(a.quando)).slice(0, 60)
}

const esc = s => String(s ?? '').replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]))

console.error('📡 Radar do Reddit — isto leva uns 2 a 4 minutos (vai devagar de propósito)\n')
console.error('1/3 procurando comunidades…')
const subs = await acharComunidades()
console.error(`\n2/3 lendo as regras de ${Math.min(subs.length, 40)} comunidades…`)
for (const s of subs.slice(0, 40)) { await lerRegras(s); console.error(`  r/${s.nome} → ${s.veredito}`) }
console.error('\n3/3 procurando conversas abertas…')
const conversas = await acharConversas()

const html = `<!doctype html><meta charset="utf-8"><title>Radar do Reddit · Leilão Legends</title>
<style>
body{font-family:system-ui,sans-serif;background:#F4ECD6;color:#0C0C0C;max-width:900px;margin:0 auto;padding:22px}
h1{font-size:24px} h2{font-size:17px;margin:26px 0 8px;border-bottom:3px solid #0C0C0C;padding-bottom:4px}
table{width:100%;border-collapse:collapse;background:#fff;border:3px solid #0C0C0C;border-radius:10px;overflow:hidden}
th{background:#0C0C0C;color:#fff;text-align:left;font-size:12px;padding:7px 9px}
td{padding:7px 9px;border-top:1px solid #ddd;font-size:13px;vertical-align:top}
tr:hover td{background:#FFF7DE} a{color:#1B7A3D;font-weight:700}
.v{white-space:nowrap;font-weight:700;font-size:12px}
.p{font-size:11px;color:#666} .n{font-weight:700}
.aviso{background:#FFF1E8;border:3px solid #C2452F;border-radius:12px;padding:12px 14px;margin:14px 0;font-size:13.5px;line-height:1.5}
</style>
<h1>📡 Radar do Reddit — Leilão Legends</h1>
<p class=p>Gerado em ${new Date().toISOString().slice(0, 16).replace('T', ' ')} · só leitura, nada foi publicado.</p>

<div class=aviso><b>Como usar isto sem tomar ban:</b> comece pelas <b>conversas abertas</b> lá embaixo — responder quem PERGUNTOU nunca é considerado spam e é o que traz gente de verdade. Nas comunidades, só poste link nas <b>🟢 verdes</b>. Nas 🔴 vermelhas, participe sem link (comentando de futebol) — conta com karma é o que destrava tudo depois.</div>

<h2>💬 Conversas abertas — responda estas (${conversas.length})</h2>
<table><tr><th>Quando</th><th>Comunidade</th><th>O que a pessoa perguntou</th><th>💬</th></tr>
${conversas.map(c => `<tr><td class=p>${esc(c.quando)}</td><td>r/${esc(c.sub)}</td><td><a href="${esc(c.link)}" target=_blank>${esc(c.titulo)}</a></td><td>${c.comentarios}</td></tr>`).join('')}
</table>

<h2>🏟️ Comunidades encontradas (${subs.length})</h2>
<table><tr><th>Comunidade</th><th>Gente</th><th>Pode postar link?</th><th>Sobre</th></tr>
${subs.slice(0, 60).map(s => `<tr>
<td class=n><a href="https://www.reddit.com/r/${esc(s.nome)}" target=_blank>r/${esc(s.nome)}</a></td>
<td>${(s.inscritos ?? 0).toLocaleString('pt-BR')}</td>
<td class=v>${esc(s.veredito)}</td>
<td class=p>${esc(s.sobre)}</td></tr>`).join('')}
</table>
`
const fs = await import('node:fs')
fs.writeFileSync('reddit-radar.html', html)
console.error(`\n✅ Pronto: ${subs.length} comunidades e ${conversas.length} conversas.`)
console.error('   Abra o arquivo reddit-radar.html no navegador.')

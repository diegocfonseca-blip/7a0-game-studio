// 👑 MOCKUP (31/10): só INFORMAR melhor — sala aberta × com senha e a responsabilidade do dono.
// Diego: *"quero um mockup de apenas informar melhor… quando diz que tem senha… ou algo na qual o host tem que ser
// responsável e não sair da sala"*. Nada muda na regra: é texto e selo.
//   node scripts/mockup-dono-responsavel.mjs <saida.png>
import { readFileSync } from 'node:fs'
import { chromium } from 'playwright-core'

const OUT = process.argv[2] ?? 'mockup-dono-responsavel.png'
const INK = '#0C0C0C', GOLD = '#FFC400', CREME = '#F4ECD6', GREEN = '#1B7A3D', RED = '#C2452F'
const b64 = w => readFileSync(`scripts/fonts/oswald-latin-${w}-normal.woff2`).toString('base64')
const FONTES = [400, 600, 700].map(w => `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(w)}) format('woff2');font-weight:${w}}`).join('')

const btn = (txt, on) => `<div style="flex:1;padding:12px 4px;text-align:center;font:700 16px Oswald;text-transform:uppercase;background:${on ? GOLD : CREME};border:3px solid ${INK};border-radius:12px;${on ? `box-shadow:3px 3px 0 ${INK}` : ''}">${txt}</div>`
const novo = `<span style="font:700 9px Oswald;background:${GREEN};color:#fff;border-radius:5px;padding:1px 5px;margin-right:5px;vertical-align:2px">NOVO</span>`

// 1 — criar sala: a explicação embaixo da ENTRADA
const entrada = (senha) => `
  <div style="font:600 13px Oswald;letter-spacing:.08em;color:#6b6250;margin:4px 0 6px">ENTRADA</div>
  <div style="display:flex;gap:8px">${btn('🔓 Aberta', !senha)}${btn('🔒 Com senha', senha)}</div>
  <div style="margin-top:8px;background:${senha ? '#EAF5EE' : '#FFF4D6'};border:2.5px solid ${INK};border-radius:12px;padding:9px 11px;font:400 13.5px/1.35 system-ui">
    ${novo}${senha
      ? '<b>🔒 Só amigos.</b> Só entra quem tem a senha — passe ela no grupo de vocês.'
      : '<b>🔓 Sala aberta é feita pra qualquer um entrar.</b> Quer exclusividade? Escolha <b>🔒 Com senha</b>.'}
  </div>`

// 2 — o resumo "Sua sala" com o compromisso do dono
const resumo = (senha) => `
  <div style="background:#141210;border-radius:18px;padding:14px;margin-top:14px">
    <div style="font:700 16px Oswald;color:${GOLD};letter-spacing:.04em">📋 SUA SALA</div>
    <div style="display:flex;flex-wrap:wrap;gap:6px;margin:10px 0">${['Rápido', '✉️ Envelope cego', '🇧🇷 Brasil', '4-3-3', 'Liga + Copa', senha ? '🔒 Com senha' : '🔓 Aberta'].map(c => `<span style="font:500 13px Oswald;color:#F4ECD6;background:#2a2622;border-radius:8px;padding:4px 9px;text-transform:uppercase">${c}</span>`).join('')}</div>
    <div style="background:${CREME};border:2.5px solid ${INK};border-radius:12px;padding:10px 12px;margin-bottom:10px">
      <div style="font:700 15px Oswald;text-transform:uppercase">${novo}👑 Você é o dono da sala</div>
      <div style="font:400 13px/1.45 system-ui;margin-top:5px">
        Quem cria a sala fica <b>responsável pela partida</b>.<br>
        🏁 <b>Vá até o final</b> — largar no meio estraga a chance de todo mundo.<br>
        ❌ <b>Remover quem está jogando</b> estraga a partida dos outros.${senha ? '' : `<br>
        🔓 <b>Sala aberta é feita pra qualquer um entrar.</b> Quer exclusividade? Crie a sala <b>com senha</b>.`}
      </div>
    </div>
    <div style="background:${GREEN};border:3px solid ${INK};border-radius:12px;padding:12px;text-align:center;font:700 18px Oswald;color:#fff;text-transform:uppercase">🔨 Criar e chamar a galera</div>
  </div>`

// 3 — a lista de salas: o selo diz quem pode entrar
const salaCard = (nome, dono, senha, gente) => `
  <div style="background:#fff;border:3px solid ${INK};border-radius:14px;box-shadow:3px 3px 0 #000;padding:10px 12px;margin-bottom:10px">
    <div style="display:flex;justify-content:space-between;align-items:center">
      <div style="font:700 17px Oswald;text-transform:uppercase">${nome}</div>
      <div style="font:600 13px Oswald">👥 ${gente}</div>
    </div>
    <div style="font:400 12.5px system-ui;color:#555;margin:2px 0 7px">👑 ${dono} · ✉️ Envelope · 🇧🇷 Brasil</div>
    ${senha
      ? `<div style="display:inline-block;font:700 12.5px Oswald;background:#1a1a1a;color:${GOLD};border-radius:8px;padding:4px 9px;text-transform:uppercase">🔒 Só amigos · precisa da senha</div>`
      : `<div style="display:inline-block;font:700 12.5px Oswald;background:${GREEN};color:#fff;border-radius:8px;padding:4px 9px;text-transform:uppercase">🔓 Aberta · qualquer um entra</div>`}
  </div>`

// 4 — sala de espera: a faixa só pro DONO
const espera = `
  <div style="background:${GOLD};border:3px solid ${INK};border-radius:12px;padding:9px 11px;font:400 13px/1.35 system-ui;box-shadow:3px 3px 0 ${INK}">
    <b style="font:700 14px Oswald;text-transform:uppercase">👑 A sala é sua até o fim</b><br>
    Você é responsável pela partida: vá até o final e não remova quem está jogando.
  </div>
  <div style="margin-top:10px;font:600 13px Oswald;color:#6b6250">TÉCNICOS NA SALA (4)</div>
  ${['👑 Oooo FC (você)', 'Futpoint FC', 'Januzaj FC', 'Leão da Estradinha'].map(n => `<div style="background:#fff;border:2.5px solid ${INK};border-radius:10px;padding:8px 10px;margin-top:6px;font:500 14px Oswald">${n}</div>`).join('')}`

const cel = (titulo, html) => `<div><div style="font:700 18px Oswald;text-transform:uppercase;margin-bottom:8px">${titulo}</div>
  <div style="background:#fff;border:3px solid ${INK};border-radius:20px;box-shadow:4px 4px 0 #000;padding:14px;width:360px;box-sizing:border-box">${html}</div></div>`

const html = `<html><head><style>${FONTES}body{margin:0;background:${CREME};color:${INK};padding:26px;width:1560px;font-family:Oswald}</style></head><body>
<div style="font:700 34px Oswald;text-transform:uppercase">👑 Sala aberta × com senha · o dono responsável</div>
<div style="font:400 16px Oswald;color:#444;margin:4px 0 18px">Só informação: nenhuma regra muda. Em verde/amarelo o que é novo.</div>
<div style="display:flex;gap:18px;align-items:flex-start">
  ${cel('1 · Criar sala (aberta)', entrada(false) + resumo(false))}
  ${cel('1b · Criar sala (com senha)', entrada(true))}
  ${cel('2 · Lista de salas', salaCard('Sala do Oooo', 'Oooo FC', false, '4/12') + salaCard('Resenha dos crias', 'Futpoint FC', true, '6/8') + salaCard('Liga da firma', 'Januzaj FC', true, '3/10'))}
  ${cel('3 · Sala de espera (só o dono vê)', espera)}
</div></body></html>`
const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const pg = await br.newPage({ viewport: { width: 1612, height: 900 } })
await pg.setContent(html); await pg.evaluate(() => document.fonts.ready)
await pg.screenshot({ path: OUT, fullPage: true }); await br.close()
console.log('✅', OUT)

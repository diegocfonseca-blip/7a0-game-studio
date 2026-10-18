#!/usr/bin/env node
// 🔠 MOCKUP — MESA DUPLA DO PREGÃO ABERTO COM LETRA MAIOR (17/10). Diego: "qd divide em duas telas parece q diminui as
// escritas… organizar melhor". Proposta: lado a lado continua (empilhar obriga a rolar com martelo de 5s), mas sai o que
// repete (lista de lances — quem lidera já está na faixa —, a trava longa e a frase de baixo) e o espaço vira letra maior.
// uso: node scripts/mockup-pregao-duplo-letras.mjs → scripts/mockups/pregao-duplo-letras.png
import { readFileSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { chromium } from 'playwright-core'
const b64 = f => readFileSync(f).toString('base64')
const FONTES = [500, 700].map(w => `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(`scripts/fonts/oswald-latin-${w}-normal.woff2`)}) format('woff2');font-weight:${w}}`).join('')
const esc = n => `data:image/webp;base64,${b64(`public/escudos-clubes/${n}.webp`)}`
const INK = '#0C0C0C', GOLD = '#FFC400'

// v = tamanhos de cada versão
const HOJE = { crest: 58, nome: 15, pill: 12, preco: 22, time: 11.5, rel: 15, trava: 10.5, bt: 17, lista: true, travaLonga: true, dica: true }
const NOVA = { crest: 52, nome: 19, pill: 14, preco: 30, time: 14, rel: 18, trava: 15, bt: 21, lista: false, travaLonga: false, dica: false }

const mesa = (v, m) => `<div class="mesa">
  <div class="pac"><span class="pos" style="font-size:${v === NOVA ? 13 : 11}px">${m.pos}</span>
    <img src="${esc(m.esc)}" style="height:${v.crest}px">
    <b style="font-size:${v.nome}px">${m.nome}</b>
    <span class="pill" style="font-size:${v.pill}px">👥 ${m.n} jogadores</span></div>
  ${v === NOVA
    ? `<div class="lance dois ${m.quente ? 'quente' : ''}"><div class="l1"><strong style="font-size:${v.preco}px">${m.preco} 🪙</strong><div class="rel"><b style="font-size:${v.rel}px">⏱ ${m.seg}s</b><em>${m.quente ? 'DUAS…' : '&nbsp;'}</em></div></div><span class="nome" style="font-size:${v.time}px">${m.lider}</span></div>`
    : `<div class="lance ${m.quente ? 'quente' : ''}"><strong style="font-size:${v.preco}px">${m.preco}</strong><div class="q"><small>LANCE ATUAL</small><span style="font-size:${v.time}px">${m.lider}</span></div>
    <div class="rel"><b style="font-size:${v.rel}px">⏱ ${m.seg}s</b><em>${m.quente ? 'DUAS…' : '&nbsp;'}</em></div></div>`}
  ${v.lista ? `<div class="lista"><div class="ln a"><i>${m.lider}</i><b>${m.preco}</b></div><div class="ln"><i>${m.seg2}</i><b>${m.preco - 1}</b></div></div>` : ''}
  ${m.trava
    ? `<div class="trava" style="font-size:${v.trava}px">🔒 ${v.travaLonga ? `Você já tem o seu pacote de ${m.posNome} — neste só assiste.` : `Já tem ${m.pos}`}</div>`
    : `<div class="bts">${['+1', '+5', '+10'].map(b => `<button style="font-size:${v.bt}px">${b}</button>`).join('')}<div class="outro"><span>outro</span><i>OK</i></div></div>`}
</div>`

const M1 = { pos: 'GOL', posNome: 'goleiro', esc: 'everton', nome: 'Goleiros do Everton', n: 2, preco: 23, lider: 'MPZUDO FC', seg2: 'ANTI PORTUGUESA', seg: 5, trava: true }
const M2 = { pos: 'MEI', posNome: 'meia', esc: 'newcastle', nome: 'Meio do Newcastle', n: 4, preco: 13, lider: 'GUIMARÃES SCI', seg2: 'LA7 DIEGOSLSZ', seg: 2, quente: true }

const fone = (v, titulo, cor) => `<div class="col"><div class="tag" style="background:${cor}">${titulo}</div><div class="fone">
  <div class="topo"><span>🔨</span><div><b>PREGÃO ABERTO</b><small>pacote 45 de 105 · DOIS na mesa</small></div><div class="caixa"><b>14 🪙</b><small>SEU CAIXA</small></div></div>
  <div class="duas">${mesa(v, M1)}${mesa(v, M2)}</div>
  ${v.dica ? '<p class="dica">Cada pacote tem o próprio relógio de 5s. Dá pra brigar pelos dois — ou só pelo que você precisa.</p>' : ''}
  <div class="vend">💸 Guimarães SCI levou Arsenal por 63 🪙</div>
</div></div>`

const html = `<!doctype html><html><head><meta charset="utf-8"><style>${FONTES}
*{box-sizing:border-box}body{margin:0;background:#F4ECD6;font-family:Arial,sans-serif;color:${INK};padding:22px;width:860px}
h1{font:700 28px Oswald;text-transform:uppercase;margin:0 0 4px}.sub{margin:0 0 16px;font-weight:700;color:#3a3a32;font-size:14px}
.wrap{display:flex;gap:26px;align-items:flex-start}.col{width:392px}
.tag{display:inline-block;color:#fff;font:700 15px Oswald;border:3px solid ${INK};border-radius:10px;padding:3px 12px;margin-bottom:8px;box-shadow:3px 3px 0 ${INK}}
.fone{width:392px;background:#F4ECD6;border:4px solid ${INK};border-radius:26px;padding:12px;box-shadow:6px 6px 0 ${INK}}.fone>*{margin-bottom:10px}
.topo{display:flex;align-items:center;gap:9px;background:${INK};color:#fff;border-radius:13px;padding:8px 10px}.topo>span{font-size:22px}.topo b{font:700 16px Oswald;display:block}.topo small{font-size:10px;font-weight:700;opacity:.75}
.caixa{margin-left:auto;background:${GOLD};color:${INK};border:2px solid #fff;border-radius:10px;padding:3px 8px;text-align:center}.caixa b{font:700 16px Oswald}.caixa small{display:block;font-size:7px;letter-spacing:1px}
.duas{display:grid;grid-template-columns:1fr 1fr;gap:8px;align-items:start}
.mesa{display:flex;flex-direction:column;gap:7px;min-width:0}
.pac{border:4px solid ${INK};border-radius:16px;box-shadow:4px 4px 0 ${INK};background:#fff;padding:9px 6px;text-align:center}
.pac .pos{display:inline-block;background:${INK};color:#fff;border-radius:7px;padding:1px 8px;font:700 11px Oswald}
.pac img{display:block;margin:6px auto}.pac b{font-family:Oswald;font-weight:700;text-transform:uppercase;line-height:1.05;min-height:2.1em;display:flex;align-items:center;justify-content:center}
.pill{display:inline-block;margin-top:5px;background:#F4ECD6;border:2px solid ${INK};border-radius:9px;padding:2px 9px;font-family:Oswald;font-weight:700}
.lance{display:flex;align-items:center;gap:5px;border:3px solid ${INK};border-radius:13px;padding:6px 7px;box-shadow:3px 3px 0 ${INK};background:linear-gradient(150deg,#FFE79A,${GOLD} 55%,#E8A200)}.lance.quente{background:#E8503A;color:#fff}
.lance.dois{display:block}.l1{display:flex;align-items:center;justify-content:space-between;gap:5px}.lance .nome{display:block;margin-top:4px;font-family:Oswald;font-weight:700;text-transform:uppercase;line-height:1.1;text-align:center;border-top:2px solid rgba(0,0,0,.2);padding-top:3px}.lance.quente .nome{border-color:rgba(255,255,255,.4)}
.lance strong{font-family:Oswald;font-weight:700;line-height:1}.q{flex:1;min-width:0}.q small{display:block;font-size:8px;font-weight:900;letter-spacing:1px;opacity:.8}.q span{display:block;font-family:Oswald;font-weight:700;text-transform:uppercase;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.rel{background:#fff;color:${INK};border:2px solid ${INK};border-radius:9px;padding:2px 5px;text-align:center}.rel b{font-family:Oswald;font-weight:700;display:block;line-height:1}.rel em{display:block;font-style:normal;font-size:8px;font-weight:900}
.lista{background:#fff;border:3px solid ${INK};border-radius:12px;overflow:hidden}.lista .ln{display:flex;align-items:center;padding:5px 7px;font-size:11px}.lista .ln.a{background:#E9F5EC}.lista i{font-style:normal;font:700 10px Oswald;border:2px solid ${INK};border-radius:7px;padding:1px 5px;background:#F4ECD6;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:120px}.lista b{margin-left:auto;font:700 14px Oswald}
.trava{background:#CBBF9E;border:3px solid ${INK};border-radius:11px;padding:8px 5px;text-align:center;font-family:Oswald;font-weight:700;text-transform:uppercase;color:rgba(0,0,0,.65);line-height:1.15}
.bts{display:grid;grid-template-columns:1fr 1fr 1fr;gap:5px}.bts button{font-family:Oswald;font-weight:700;border:3px solid ${INK};border-radius:11px;padding:8px 2px;background:${GOLD};box-shadow:3px 3px 0 ${INK}}
.outro{grid-column:1/-1;display:flex;border:3px solid ${INK};border-radius:11px;background:#fff;overflow:hidden;min-height:34px}.outro span{flex:1;display:grid;place-items:center;font:700 14px Oswald;color:#999}.outro i{font-style:normal;background:#CBBF9E;color:#fff;font-weight:900;padding:0 10px;display:grid;place-items:center;border-left:3px solid ${INK}}
.dica{margin:0;text-align:center;font-size:11px;font-weight:700;color:rgba(0,0,0,.6)}
.vend{background:#7C3AED;color:#fff;border:3px solid ${INK};border-radius:12px;padding:8px 10px;font-size:13px;font-weight:700}
.notas{margin-top:18px;display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px}.notas div{background:#fff;border:3px solid ${INK};border-radius:12px;box-shadow:3px 3px 0 ${INK};padding:9px 11px;font-size:13px;font-weight:600;line-height:1.35}
</style></head><body><h1>🔠 Mesa dupla com letra maior</h1><p class="sub">Continua lado a lado (sem rolar a tela com o martelo de 5s). Sai o que repete — o espaço vira letra maior.</p>
<div class="wrap">${fone(HOJE, 'HOJE', '#8a8172')}${fone(NOVA, 'PROPOSTA', '#1B7A3D')}</div>
<div class="notas"><div><b>Sai a lista de lances.</b> Quem está ganhando fica na faixa amarela, com o nome inteiro embaixo do valor.</div><div><b>Trava curta:</b> “🔒 Já tem GOL” no lugar da frase de duas linhas.</div><div><b>Sai a frase de baixo.</b> O topo já diz “DOIS na mesa”.</div></div>
</body></html>`
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 860, height: 900 }, deviceScaleFactor: 2 })
const tmp = resolve(tmpdir(), `pdl-${process.pid}.html`); writeFileSync(tmp, html)
await p.goto('file://' + tmp); await p.waitForTimeout(400); rmSync(tmp)
await p.screenshot({ path: 'scripts/mockups/pregao-duplo-letras.png', fullPage: true }); await b.close()
console.log('📸 scripts/mockups/pregao-duplo-letras.png')

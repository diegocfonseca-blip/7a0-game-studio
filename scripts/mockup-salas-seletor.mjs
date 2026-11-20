import pkg from '/opt/node22/lib/node_modules/playwright/index.js'; const { chromium } = pkg
const css = `body{margin:0;background:#3a3a3a;font-family:Inter,Arial,sans-serif;display:flex;gap:28px;padding:24px;align-items:flex-start}
.tel{width:400px;background:#0E0F0C;color:#F4ECD6;border-radius:26px;overflow:hidden;border:3px solid #000}
.o{font-family:Oswald,sans-serif;text-transform:uppercase}
.hd{display:flex;align-items:center;gap:10px;padding:14px;border-bottom:1px solid #2a2a2a}
.lg{width:34px;height:34px;border:2px solid #FFC400;border-radius:8px;display:flex;align-items:center;justify-content:center;color:#FFC400;font:900 15px Oswald}
.hd b{font:800 19px Oswald;display:block}.hd small{font-size:8px;letter-spacing:.2em;color:#aaa}
.conta{margin-left:auto;background:linear-gradient(135deg,#FFE27A,#FFC400);color:#000;border:2px solid #000;border-radius:10px;padding:8px 10px;font:800 12px Oswald}
.ini{margin:12px;border:1px solid #444;border-radius:12px;padding:8px;display:flex;gap:10px;align-items:center;font-size:11px;color:#ccc}
.ini span{background:#F4ECD6;color:#000;border:2px solid #000;border-radius:9px;padding:8px 12px;font:800 13px Oswald;box-shadow:3px 3px 0 #000;white-space:nowrap}
.hero{padding:16px 14px;background:linear-gradient(90deg,#14140f,#25211a)}.hero small{color:#C9A95A;font:800 10px Oswald;letter-spacing:.15em}
.hero h1{margin:4px 0;font:900 30px Oswald}.hero h1 em{color:#FFC400;font-style:normal}.hero p{margin:0;font-size:12px;color:#ccc}
.sel{margin:14px 12px 4px;display:flex;border:3px solid #000;border-radius:999px;overflow:hidden;box-shadow:3px 3px 0 #000;background:#F4ECD6}
.sel div{flex:1;text-align:center;padding:10px 4px;font:900 15px Oswald;color:#555}.sel .on{background:#1B7A3D;color:#fff}.sel .onb{background:#E8743B;color:#fff}
.sel i{font-style:normal;display:inline-block;background:#0003;border-radius:999px;padding:0 7px;margin-left:6px;font-size:12px}
.sel div:not(.on):not(.onb) i{background:#0C0C0C;color:#FFC400}
.nota{font-size:10.5px;color:#9a9a8a;text-align:center;margin:6px 12px 0}
.tabs{display:flex;margin:12px;border:2px solid #000;border-radius:10px;overflow:hidden}.tabs div{flex:1;text-align:center;background:#F4ECD6;color:#000;padding:10px 2px;font:800 11px Oswald;border-right:1px solid #0002}.tabs .on{background:#7C3AED;color:#fff}
.tit{padding:4px 14px}.tit h2{margin:0;font:900 28px Oswald}.tit h2 em{color:#FFC400;font-style:normal}
.sala{margin:10px 12px;background:#F4ECD6;color:#000;border:3px solid #000;border-radius:14px;box-shadow:4px 4px 0 #000;padding:12px}
.sala .t{display:flex;justify-content:space-between}.sala .t span{background:#1B4D2A;color:#fff;font:800 11px Oswald;border-radius:6px;padding:3px 8px}.sala .t small{font:800 11px Oswald;color:#0007}
.sala b{display:block;font:900 20px Oswald;margin:6px 0}.chip{display:inline-block;border:2px solid #000;border-radius:6px;font:800 10px Oswald;padding:1px 6px;margin-right:4px;background:#FFC400}
.sala .ft{display:flex;align-items:center;margin-top:8px;border-top:1px solid #0002;padding-top:8px}.sala .ft strong{font:900 24px Oswald}.sala .ft button{margin-left:auto;background:#7C3AED;color:#fff;border:3px solid #000;border-radius:10px;font:800 13px Oswald;padding:8px 14px;box-shadow:3px 3px 0 #000}`
const tel = (bb) => `<div class="tel">
<div class="hd"><div class="lg">${bb ? 'BL' : 'LL'}</div><div><b>${bb ? 'BIDLEGENDS' : 'LEILÃO LEGENDS'}</b><small>${bb ? 'O SEU QUINTETO COMEÇA NO LANCE.' : 'O SEU TIME COMEÇA NO LANCE.'}</small></div><div class="conta">Neymarzetti 👑</div></div>
<div class="ini"><span>← INÍCIO</span>Carreira, Partida Rápida e outros modos ficam no Início.</div>
<div class="hero"><small>LEILÃO AO VIVO COM A GALERA</small><h1>ONLINE. <em>O LANCE É SEU.</em></h1><p>${bb ? 'Entre numa sala, monte seu quinteto e brigue pelo anel.' : 'Entre numa sala, monte seu time e dispute a taça.'}</p></div>
<div class="sel"><div class="${bb ? '' : 'on'}">⚽ FUTEBOL<i>7</i></div><div class="${bb ? 'onb' : ''}">🏀 BASQUETE<i>3</i></div></div>
<p class="nota">O número é quantas salas estão abertas agora em cada jogo. Tocou, troca na hora.</p>
<div class="tabs"><div class="on">SALAS ABERTAS<br>${bb ? 3 : 7}</div><div>CRIAR SALA</div><div>ENTRAR POR CÓDIGO</div><div>SUAS LIGAS</div></div>
<div class="tit"><h2>SALAS ABERTAS <em>/ ${bb ? 3 : 7}</em></h2></div>
${(bb ? [['Sala do Kobe Lover','RS12AB','NBA 30 · Play-In + Playoffs','2/30'],['Garrafão do Zé','9KX2LM','NBA 20 · só a liga','4/20']] : [['Sala do Cascudão','K25M8H','liga+liberta','3/20'],['Sala do Fialho FC','YBDWJ2','liga+copa','2/20']]).map(([n,c,f,q]) => `<div class="sala"><div class="t"><span>● EM JOGO</span><small>${c}</small></div><b>${n}</b><span class="chip">${bb ? 'NBA' : 'BR'}</span><span class="chip" style="background:#fff">✉️ ÀS CEGAS</span><div style="font-size:12px;margin-top:6px">⚡ auto · ${bb ? '🏀' : '🏆'} ${f}</div><div class="ft"><strong>${q}</strong>&nbsp;<small>técnicos</small><button>👁 ASSISTIR</button></div></div>`).join('')}
</div>`
const html = `<!doctype html><html><head><meta charset="utf-8"><link href="https://fonts.googleapis.com/css2?family=Oswald:wght@500;700&family=Inter:wght@500;700;800&display=swap" rel="stylesheet"><style>${css}</style></head><body>${tel(false)}${tel(true)}</body></html>`
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 900, height: 1200 }, deviceScaleFactor: 2 })
await p.setContent(html); await p.waitForTimeout(2500)
await p.screenshot({ path: '/home/user/7a0-game-studio/scripts/mockups/salas-abertas-seletor.png', fullPage: true }); await b.close()

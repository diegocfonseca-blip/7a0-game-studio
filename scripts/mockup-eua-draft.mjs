import pkg from '/opt/node22/lib/node_modules/playwright/index.js'; const { chromium } = pkg
const fora = [['Pelicans','1-81',14],['Wizards','19-63',14],['Heat','25-57',14],['Cavaliers','28-54',12.5],['Sixers','29-53',10.5],['Nets','31-51',9],['Grizzlies','32-50',7.5],['Timberwolves','36-46',6],['Magic','36-46',4.5],['Celtics','37-45',3],['Clippers','38-44',2],['Warriors','43-39',1.5],['Kings','45-37',1],['Mavericks','46-36',0.5]]
const sorteio = ['Heat','Pelicans','Nets','Wizards']
const logo = t => `<img src="http://localhost:4180/7a0-game-studio/escudos-nba/${{Celtics:'bos',Nets:'bkn',Knicks:'nyk',Sixers:'phi',Raptors:'tor',Bulls:'chi',Cavaliers:'cle',Pistons:'det',Pacers:'ind',Bucks:'mil',Hawks:'atl',Hornets:'cha',Heat:'mia',Magic:'orl',Wizards:'was',Nuggets:'den',Timberwolves:'min',Thunder:'okc','Trail Blazers':'por',Jazz:'uta',Warriors:'gsw',Clippers:'lac',Lakers:'lal',Suns:'phx',Kings:'sac',Mavericks:'dal',Rockets:'hou',Grizzlies:'mem',Pelicans:'nop',Spurs:'sas'}[t]}.webp" style="height:22px;width:26px;object-fit:contain">`
const cartas = [['PG','Mikel Brown Jr.','Nets · 2026','💎 Promessa'],['SG','VJ Edgecombe','Sixers · 2026','💎 Promessa'],['PG','Cade Cunningham','Pistons · 2024','🎯 Bom'],['SG','Anthony Edwards','Timberwolves · 2024','🎯 Bom'],['SF','Scottie Barnes','Raptors · 2024','🎯 Bom'],['PG','Ja Morant','Grizzlies · 2022','🎯 Bom'],['SF','Franz Wagner','Magic · 2024','🎯 Bom'],['SG','Brayden Burries','Bucks · 2026','💎 Promessa']]
const css = `body{margin:0;background:#0C0C0C;font-family:Inter,Arial,sans-serif;display:flex;gap:28px;padding:24px;align-items:flex-start}
.tel{width:390px;background:#F4ECD6;border-radius:26px;padding:14px;box-sizing:border-box;border:3px solid #000}
.o{font-family:Oswald,Arial Narrow,sans-serif;text-transform:uppercase}
.topo{background:#0C0C0C;color:#fff;border-radius:16px;padding:12px 14px;border:3px solid #000;box-shadow:4px 4px 0 #000;margin-bottom:12px}
.topo b{font:800 19px Oswald,sans-serif;display:block}.topo small{color:#bbb;font-size:12px}
.box{background:#fff;border:3px solid #000;border-radius:16px;box-shadow:4px 4px 0 #000;margin-bottom:12px;overflow:hidden}
.cab{background:#0C0C0C;color:#FFC400;font:800 12px Oswald,sans-serif;letter-spacing:.06em;padding:7px 12px}
.lin{display:flex;align-items:center;gap:8px;padding:6px 12px;border-top:1px solid #0001;font-size:13px;font-weight:700}
.lin .n{width:26px;font:800 15px Oswald}.lin .p{margin-left:auto;font:800 13px Oswald}
.eu{background:#FFF0B8}.passos{display:flex;gap:6px;margin-bottom:10px}.passos span{flex:1;text-align:center;font:800 10px Oswald;padding:6px 2px;border:2px solid #000;border-radius:9px;background:#fff}.passos .on{background:#FFC400}.passos .ok{background:#1B7A3D;color:#fff}
.bola{display:flex;gap:8px;padding:10px 12px}.bola div{flex:1;text-align:center;border:3px solid #000;border-radius:14px;padding:8px 2px;background:#FFC400;box-shadow:3px 3px 0 #000;font:800 11px Oswald}
.bola div b{display:block;font-size:22px}.vez{background:#7C3AED;color:#fff;border:3px solid #000;border-radius:16px;box-shadow:4px 4px 0 #000;text-align:center;padding:10px;margin-bottom:12px}
.vez small{font:700 12px Oswald;letter-spacing:.06em;opacity:.85}.vez b{display:block;font:900 26px Oswald}
.c{display:flex;align-items:center;gap:8px;padding:8px 12px;border-top:1px solid #0001}.c .pos{background:#0C0C0C;color:#fff;font:800 11px Oswald;border-radius:6px;padding:2px 6px}
.c .nm{font:800 15px Oswald;text-transform:none}.c small{display:block;color:#6a6250;font-size:11px;font-weight:700}
.c button{margin-left:auto;background:#1B7A3D;color:#fff;border:2px solid #000;border-radius:9px;font:800 12px Oswald;padding:6px 10px;box-shadow:2px 2px 0 #000}
.nota{font-size:11px;color:#0008;font-weight:700;text-align:center;margin:6px 6px 0}`
const passos = n => `<div class="passos">${['📰 Jornal','💰 Caixa','🎓 Draft','🔨 Decisão'].map((t,i)=>`<span class="${i<n?'ok':i===n?'on':''}">${t}</span>`).join('')}</div>`
const tel1 = `<div class="tel">${passos(2)}<div class="topo"><b>🎱 LOTERIA DO DRAFT · 2026</b><small>Os 14 que ficaram fora dos playoffs. Quanto pior a campanha, mais chance da 1ª escolha.</small></div>
<div class="box"><div class="cab">🎱 SORTEIO DAS 4 PRIMEIRAS ESCOLHAS</div><div class="bola">${sorteio.map((t,i)=>`<div>${i+1}ª<b>${logo(t)}</b>${t}</div>`).join('')}</div></div>
<div class="box"><div class="cab">CHANCE DA 1ª ESCOLHA · CAMPANHA</div>${fora.map(([t,r,p],i)=>`<div class="lin ${t==='Pelicans'?'eu':''}"><span class="n">${i+1}</span>${logo(t)}<span>${t}${t==='Pelicans'?' (você)':''}</span><small style="color:#0007">${r}</small><span class="p">${String(p).replace('.',',')}%</span></div>`).join('')}</div>
<p class="nota">Regra da NBA: só as 4 primeiras saem no sorteio. Da 5ª em diante é do pior pro melhor.</p></div>`
const ordem = [...sorteio, 'Cavaliers','Sixers','Grizzlies','Timberwolves']
const tel2 = `<div class="tel">${passos(2)}<div class="topo"><b>🎓 NOITE DO DRAFT · 2026</b><small>Cada franquia escolhe 1 jogador sem time. 60 s por escolha.</small></div>
<div class="box"><div class="cab">ORDEM DO DRAFT · A LOTERIA MANDA</div>${ordem.slice(0,5).map((t,i)=>`<div class="lin ${t==='Pelicans'?'eu':''}"><span class="n">${i+1}º</span>${logo(t)}<span>${t}${t==='Pelicans'?' (você)':''}</span><span class="p" style="color:${i===0?'#1B7A3D':t==='Pelicans'?'#C2452F':'#0006'}">${i===0?'✓ Mikel Brown Jr.':t==='Pelicans'?'✋ NA VEZ':'…'}</span></div>`).join('')}</div>
<div class="vez"><small>2ª ESCOLHA DO DRAFT · ⏱ 52 s</small><b>É A SUA VEZ!</b></div>
<div class="box"><div class="cab">JOGADORES SEM TIME · SÓ PROMESSA E BOM</div>${cartas.slice(1).map(([p,n,c,k])=>`<div class="c"><span class="pos">${p}</span><div><span class="nm">${n}</span><small>${c} · ${k}</small></div><button>ESCOLHER</button></div>`).join('')}</div>
<p class="nota">Lenda e craque não entram no Draft: na NBA o Draft é de jovem e aposta. Os bots escolhem sozinhos.</p></div>`
const html = `<!doctype html><html><head><meta charset="utf-8"><link href="https://fonts.googleapis.com/css2?family=Oswald:wght@500;700&family=Inter:wght@500;700;800&display=swap" rel="stylesheet"><style>${css}</style></head><body>${tel1}${tel2}</body></html>`
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 880, height: 1200 }, deviceScaleFactor: 2 })
await p.setContent(html); await p.waitForTimeout(2500)
await p.screenshot({ path: '/home/user/7a0-game-studio/scripts/mockups/basquete-eua-draft.png', fullPage: true }); await b.close()

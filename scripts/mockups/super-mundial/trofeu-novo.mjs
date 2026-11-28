// Mockup do troféu do Super Mundial no formato REAL (28/11, foto que o Diego mandou): aro grande + 2 anéis cruzados + esfera no meio + pé preto com faixa dourada.
import {createRequire} from 'node:module'; import {writeFileSync} from 'node:fs'
const {chromium}=createRequire(import.meta.url)('/opt/node22/lib/node_modules/playwright')
const INK='#0C0C0C'
const grads=id=>`<defs><linearGradient id="${id}o" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFF3B0"/><stop offset=".35" stop-color="#FFC400"/><stop offset=".7" stop-color="#C98A00"/><stop offset="1" stop-color="#FFE08A"/></linearGradient><radialGradient id="${id}s" cx=".38" cy=".34" r=".75"><stop offset="0" stop-color="#FFF6C8"/><stop offset=".45" stop-color="#FFC400"/><stop offset="1" stop-color="#9a6a00"/></radialGradient></defs>`
const anel=(id,attrs,w)=>`<ellipse ${attrs} fill="none" stroke="${INK}" stroke-width="${w+5}"/><ellipse ${attrs} fill="none" stroke="url(#${id}o)" stroke-width="${w}"/>`
export const novo=id=>`${grads(id)}
<path d="M24 142 C24 122,38 112,60 112 C82 112,96 122,96 142 Z" fill="#141414" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
<path d="M40 122 C46 118,52 117,58 117" stroke="#4a4a4a" stroke-width="3" stroke-linecap="round" fill="none"/>
<rect x="22" y="140" width="76" height="13" rx="5" fill="url(#${id}o)" stroke="${INK}" stroke-width="3"/>
<path d="M28 146.5 H92" stroke="#9a6a00" stroke-width="1.5"/>
<ellipse cx="60" cy="64" rx="34" ry="25" transform="rotate(-24 60 64)" fill="none" stroke="${INK}" stroke-width="11"/>
<ellipse cx="60" cy="64" rx="34" ry="25" transform="rotate(-24 60 64)" fill="none" stroke="url(#${id}o)" stroke-width="6"/>
<circle cx="60" cy="64" r="27" fill="url(#${id}s)" stroke="${INK}" stroke-width="3"/>
<g fill="none" stroke="#8a5d00" stroke-width="1.3">${Array.from({length:8},(_,i)=>{const a=i*Math.PI/4;return `<circle cx="${(60+Math.cos(a)*9).toFixed(1)}" cy="${(64+Math.sin(a)*9).toFixed(1)}" r="9"/>`}).join('')}<path d="M60 52 L70 64 L60 76 L50 64 Z"/><circle cx="60" cy="64" r="22"/></g>
<circle cx="60" cy="64" r="2.6" fill="#8a5d00"/>
<path d="M24 74 A38 29 -24 0 0 96 54" transform="rotate(-24 60 64)" fill="none"/>
<path d="M60 64 m-34 0 a34 25 0 0 0 68 0" transform="rotate(-24 60 64)" fill="none" stroke="${INK}" stroke-width="11"/>
<path d="M60 64 m-34 0 a34 25 0 0 0 68 0" transform="rotate(-24 60 64)" fill="none" stroke="url(#${id}o)" stroke-width="6"/>
<circle cx="60" cy="64" r="48" fill="none" stroke="${INK}" stroke-width="16"/>
<circle cx="60" cy="64" r="48" fill="none" stroke="url(#${id}o)" stroke-width="11"/>
<g stroke="#8a5d00" stroke-width="1.5" stroke-linecap="round">${Array.from({length:26},(_,i)=>{const a=(-205+i*9.6)*Math.PI/180;return `<path d="M${(60+Math.cos(a)*46).toFixed(1)} ${(64+Math.sin(a)*46).toFixed(1)} L${(60+Math.cos(a)*50).toFixed(1)} ${(64+Math.sin(a)*50).toFixed(1)}"/>`}).join('')}</g>
<path d="M28 36 C34 26,44 19,56 16" fill="none" stroke="#FFF6C8" stroke-width="2.2" stroke-linecap="round" opacity=".85"/>`
const svg=(inner,w)=>`<svg viewBox="0 0 120 170" width="${w}" height="${Math.round(w*170/120)}" style="filter:drop-shadow(4px 4px 0 #000)">${inner}</svg>`
if (process.argv[1].endsWith('trofeu-novo.mjs')) {
const html=`<!doctype html><meta charset="utf-8"><style>body{margin:0;font-family:Oswald,system-ui;background:#F4ECD6}.row{display:flex;gap:40px;align-items:flex-end;justify-content:center;padding:30px}.dark{background:radial-gradient(ellipse at 50% 38%,#6b5010,#0d0a03 72%)}h2{margin:0;padding:22px 30px 0;font-size:30px;text-transform:uppercase}.dark h2{color:#FFE08A}img{height:300px;border:4px solid #000;border-radius:16px}</style>
<h2>Foto de referência → nosso padrão</h2><div class="row"><img src="file:///root/.claude/uploads/eff68882-b963-5eee-b2bb-3ea2ad04e5b9/7db5bc4b-image.jpg">${svg(novo('a'),212)}${svg(novo('b'),110)}${svg(novo('c'),56)}</div>
<div class="dark"><h2>No fundo do Super Mundial</h2><div class="row">${svg(novo('d'),212)}${svg(novo('e'),110)}${svg(novo('f'),56)}</div></div>`
writeFileSync('/tmp/claude-0/trofeu-novo.html',html)
const b=await chromium.launch();const p=await b.newPage({viewport:{width:900,height:900},deviceScaleFactor:2});await p.goto('file:///tmp/claude-0/trofeu-novo.html');await p.screenshot({path:'scripts/mockups/super-mundial/trofeu-novo-mockup.png',fullPage:true});await b.close();console.log('ok')}

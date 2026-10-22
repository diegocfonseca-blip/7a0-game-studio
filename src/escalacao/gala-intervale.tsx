// ─── 🥊⚫⚪ ENTRADA ÚNICA DO INTER VALE FC: "NOITE DE LUTA" ──────────────────────────────────────────────────────
//
// Pedido do Diego (21/10, o dono virou 🖋 Fundador): *"veja o mascote dele pra você fazer a entrada de gala
// personalizada"*. A mascote é O Lutador — muay thai, bandagem nas mãos, calção preto "INTER VALE 08", em cima de uma
// pedra escrita "DISCIPLINA · FORÇA · VALE". O clube é preto e branco. Então:
// 1) o RINGUE acende: holofote de cima, cordas brancas entrando dos lados, fumaça no chão
// 2) o GONGO bate duas vezes ("DING! DING!") e a tela treme
// 3) O LUTADOR sobe pro centro do holofote e SOCA A TELA: vem pra cima, "POW!", flash e o vidro TRINCA
// 4) o ESCUDO desce como cinturão de campeão (brilho passando) e o lutador volta pra guarda do lado
// 5) as três palavras da pedra batem uma a uma — DISCIPLINA · FORÇA · VALE — e a faixa "CHEGOU NA SALA"
// Mesmo esquema das outras galas únicas: palco 420×760 escalado, camada fixa sem clique, fora do reducer, sem localStorage.
// Som: o MESMO canto do Wen Milan B (ordem do Diego, 21/10) — "Vai lá de coração", torcida do São Paulo, 11 s.
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Escudo } from './escudos'
import { tr } from './lang'
import { playMp3Gala } from './sound'
import mascoteImg from './img/intervale-mascote.webp'

export const INTERVALE_MS = 8600
const T = INTERVALE_MS
const pct = (ms: number) => (ms / T * 100).toFixed(1) + '%'
const BRANCO = '#E4E3E1', PRETO = '#0E0E0E', GOLD = '#FFC400'
const sorte = (i: number) => ((i * 7919) % 997) / 997

const CSS = `
.giv{position:fixed;inset:0;z-index:99990;pointer-events:none;overflow:hidden;animation:givVis ${T}ms ease forwards}
@keyframes givVis{0%{opacity:0}3%{opacity:1}95%{opacity:1}100%{opacity:0}}
.giv-fundo{position:absolute;inset:0;background:#050505}
.giv-palco{position:absolute;left:50%;top:50%;width:420px;height:760px;overflow:hidden}
.giv-treme{position:absolute;inset:0;animation:givTreme ${T}ms linear forwards}
@keyframes givTreme{0%,${pct(900)}{transform:none}${pct(940)}{transform:translate(-5px,3px)}${pct(990)}{transform:translate(5px,-2px)}${pct(1040)}{transform:none}
  ${pct(1500)}{transform:none}${pct(1540)}{transform:translate(-5px,3px)}${pct(1590)}{transform:translate(5px,-2px)}${pct(1640)}{transform:none}
  ${pct(3350)}{transform:none}${pct(3390)}{transform:translate(-11px,7px)}${pct(3440)}{transform:translate(10px,-6px)}${pct(3500)}{transform:translate(-6px,4px)}${pct(3580)}{transform:none}100%{transform:none}}
/* 🔦 holofote de cima */
.giv-luz{position:absolute;left:50%;top:-40px;width:520px;height:820px;margin-left:-260px;opacity:0;
  background:radial-gradient(ellipse 45% 70% at 50% 0%,rgba(255,255,255,.34),rgba(255,255,255,.08) 55%,transparent 75%);
  clip-path:polygon(40% 0,60% 0,100% 100%,0 100%);animation:givLuz ${T}ms ease forwards}
@keyframes givLuz{0%,${pct(200)}{opacity:0}${pct(700)}{opacity:1}100%{opacity:1}}
.giv-chao{position:absolute;left:-40px;right:-40px;bottom:-40px;height:260px;border-radius:50% 50% 0 0;background:radial-gradient(ellipse at 50% 20%,#2a2a2a,#0a0a0a 70%);opacity:.9}
/* 🥊 cordas do ringue entrando pelos lados */
.giv-corda{position:absolute;height:7px;border-radius:4px;background:linear-gradient(${BRANCO},#9a9a9a);box-shadow:0 3px 0 rgba(0,0,0,.6);opacity:0}
.giv-corda.e{left:-20px;width:240px;animation:givCordaE ${T}ms cubic-bezier(.2,1.2,.4,1) forwards}
.giv-corda.d{right:-20px;width:240px;animation:givCordaD ${T}ms cubic-bezier(.2,1.2,.4,1) forwards}
@keyframes givCordaE{0%,${pct(300)}{opacity:0;transform:translateX(-260px)}${pct(800)}{opacity:1;transform:translateX(0)}100%{opacity:1;transform:translateX(0)}}
@keyframes givCordaD{0%,${pct(300)}{opacity:0;transform:translateX(260px)}${pct(800)}{opacity:1;transform:translateX(0)}100%{opacity:1;transform:translateX(0)}}
.giv-poste{position:absolute;top:440px;width:16px;height:220px;border-radius:6px;background:linear-gradient(90deg,#555,${BRANCO},#555);opacity:0;animation:givCordaE ${T}ms ease forwards}
.giv-poste.d{animation-name:givCordaD}
/* 🌫️ fumaça no chão */
.giv-fumo{position:absolute;bottom:40px;width:220px;height:90px;border-radius:50%;background:radial-gradient(ellipse,rgba(230,230,230,.22),transparent 70%);filter:blur(6px);opacity:0;animation:givFumo 5200ms ease-in-out infinite alternate}
@keyframes givFumo{0%{opacity:.15;transform:translateX(-30px) scale(1)}100%{opacity:.5;transform:translateX(30px) scale(1.25)}}
/* 🔔 o gongo */
.giv-gongo{position:absolute;left:50%;top:40px;width:120px;height:120px;margin-left:-60px;border-radius:50%;z-index:6;opacity:0;
  background:radial-gradient(circle at 38% 35%,#fff7cc,${GOLD} 35%,#a07800 75%);box-shadow:0 0 0 6px ${PRETO},0 0 0 9px ${BRANCO},0 0 40px rgba(255,196,0,.5);
  animation:givGongo ${T}ms ease forwards}
.giv-gongo::after{content:'';position:absolute;inset:26px;border-radius:50%;border:3px solid rgba(0,0,0,.35)}
@keyframes givGongo{0%,${pct(500)}{opacity:0;transform:translateY(-160px)}${pct(850)}{opacity:1;transform:translateY(0)}
  ${pct(900)}{transform:rotate(-9deg) scale(1.06)}${pct(1050)}{transform:rotate(7deg)}${pct(1200)}{transform:rotate(-4deg)}
  ${pct(1500)}{transform:rotate(-9deg) scale(1.06)}${pct(1650)}{transform:rotate(7deg)}${pct(1800)}{transform:rotate(0)}
  ${pct(2300)}{opacity:1;transform:translateY(0)}${pct(2600)}{opacity:0;transform:translateY(-160px)}100%{opacity:0}}
.giv-onda{position:absolute;left:50%;top:100px;width:120px;height:120px;margin:-60px 0 0 -60px;border-radius:50%;border:4px solid ${GOLD};z-index:5;opacity:0;animation:givOnda 900ms ease-out both}
@keyframes givOnda{0%{opacity:.9;transform:scale(1)}100%{opacity:0;transform:scale(3.2)}}
.giv-ding{position:absolute;z-index:7;font:700 48px/1 Oswald,sans-serif;color:#fff;-webkit-text-stroke:3px #0C0C0C;text-shadow:4px 4px 0 #0C0C0C;opacity:0;animation:givDing 900ms cubic-bezier(.2,1.4,.4,1) both}
@keyframes givDing{0%{opacity:0;transform:scale(.3) rotate(-12deg)}25%{opacity:1;transform:scale(1.1) rotate(-6deg)}70%{opacity:1}100%{opacity:0;transform:scale(1) rotate(-6deg) translateY(-20px)}}
/* 🥊 o lutador sobe e soca a tela */
.giv-luta{position:absolute;left:50%;top:150px;margin-left:-161px;z-index:12;opacity:0;transform-origin:42% 22%;animation:givLuta ${T}ms cubic-bezier(.3,0,.3,1) forwards}
.giv-luta img{display:block;width:322px;height:440px;filter:drop-shadow(0 0 30px rgba(0,0,0,.7)) drop-shadow(5px 6px 0 rgba(0,0,0,.55))}
@keyframes givLuta{0%,${pct(1900)}{opacity:0;transform:translateY(520px)}${pct(2500)}{opacity:1;transform:translateY(0)}
  ${pct(2900)}{transform:translateY(-8px) scale(1)}${pct(3150)}{transform:translateY(10px) scale(.94) rotate(3deg)}
  ${pct(3360)}{transform:translateY(-40px) scale(2.5) rotate(-4deg)}${pct(3700)}{transform:translateY(-30px) scale(2.35) rotate(-4deg)}
  ${pct(4300)}{opacity:1;transform:translate(105px,150px) scale(.66)}100%{opacity:1;transform:translate(105px,150px) scale(.66)}}
.giv-bob{animation:givBob 700ms ease-in-out infinite alternate}
@keyframes givBob{from{transform:translateY(0)}to{transform:translateY(-6px)}}
.giv-flash{position:absolute;inset:0;z-index:20;background:#fff;opacity:0;animation:givFlash ${T}ms linear forwards}
@keyframes givFlash{0%,${pct(3350)}{opacity:0}${pct(3390)}{opacity:.85}${pct(3650)}{opacity:0}${pct(5050)}{opacity:0}${pct(5100)}{opacity:.4}${pct(5350)}{opacity:0}100%{opacity:0}}
.giv-pow{position:absolute;left:70px;top:150px;z-index:19;font:700 92px/1 Oswald,sans-serif;color:${GOLD};-webkit-text-stroke:4px #0C0C0C;text-shadow:7px 7px 0 #0C0C0C;opacity:0;animation:givPow ${T}ms cubic-bezier(.2,1.5,.4,1) forwards}
@keyframes givPow{0%,${pct(3360)}{opacity:0;transform:scale(.2) rotate(-16deg)}${pct(3560)}{opacity:1;transform:scale(1.15) rotate(-9deg)}${pct(3760)}{transform:scale(1) rotate(-9deg)}${pct(4300)}{opacity:1}${pct(4600)}{opacity:0}100%{opacity:0}}
/* 💥 o vidro trinca (fica por cima de tudo, como se fosse na tela do celular) */
.giv-trinca{position:absolute;inset:0;z-index:18;opacity:0;animation:givTrinca ${T}ms linear forwards}
@keyframes givTrinca{0%,${pct(3370)}{opacity:0}${pct(3400)}{opacity:1}${pct(6200)}{opacity:.85}${pct(6800)}{opacity:0}100%{opacity:0}}
/* 🏆 o escudo desce como cinturão de campeão */
.giv-esc{position:absolute;left:50%;top:120px;width:230px;height:230px;margin-left:-115px;z-index:10;display:flex;align-items:center;justify-content:center;opacity:0;
  filter:drop-shadow(0 0 22px rgba(255,255,255,.45)) drop-shadow(5px 6px 0 rgba(0,0,0,.6));animation:givEsc ${T}ms cubic-bezier(.2,1.25,.4,1) forwards}
@keyframes givEsc{0%,${pct(4300)}{opacity:0;transform:translateY(-420px) rotate(-20deg)}${pct(4500)}{opacity:1}${pct(5050)}{transform:translateY(8px) rotate(0)}${pct(5250)}{transform:translateY(0)}100%{opacity:1;transform:translateY(0)}}
.giv-brilho{position:absolute;left:50%;top:120px;width:230px;height:230px;margin-left:-115px;z-index:11;overflow:hidden;border-radius:50%;opacity:0;animation:givBrOn ${T}ms linear forwards}
.giv-brilho::after{content:'';position:absolute;top:-20%;bottom:-20%;width:60px;left:-80px;background:linear-gradient(90deg,transparent,rgba(255,255,255,.8),transparent);transform:skewX(-18deg);animation:givBr ${T}ms linear forwards}
@keyframes givBrOn{0%,${pct(5300)}{opacity:0}${pct(5350)}{opacity:1}${pct(6100)}{opacity:1}${pct(6200)}{opacity:0}100%{opacity:0}}
@keyframes givBr{0%,${pct(5350)}{left:-80px}${pct(6100)}{left:300px}100%{left:300px}}
/* 🪨 as três palavras da pedra */
.giv-palavra{position:absolute;left:22px;z-index:13;text-align:left;transform-origin:0 50%;font:700 30px/1 Oswald,sans-serif;letter-spacing:.14em;color:${BRANCO};-webkit-text-stroke:1.5px #0C0C0C;text-shadow:3px 3px 0 #0C0C0C;opacity:0;animation:givPalaIn 900ms cubic-bezier(.2,1.4,.4,1) both}
@keyframes givPalaIn{0%{opacity:0;transform:scale(2.2)}60%{opacity:1;transform:scale(.96)}100%{opacity:1;transform:scale(1)}}
.giv-faixa{position:absolute;left:20px;right:20px;top:670px;z-index:17;background:#0C0C0C;border:3px solid ${BRANCO};border-radius:16px;padding:7px;text-align:center;opacity:0;animation:givFaixa ${T}ms cubic-bezier(.2,1.3,.4,1) forwards}
@keyframes givFaixa{0%,${pct(6300)}{opacity:0;transform:scale(.4)}${pct(6600)}{opacity:1;transform:scale(1.06)}${pct(6800)}{transform:scale(1)}${pct(8100)}{opacity:1}100%{opacity:0}}
.giv-faixa small{display:block;font:700 13px Oswald,sans-serif;letter-spacing:.22em;color:${GOLD}}
.giv-faixa b{display:block;font:700 26px/1.05 Oswald,sans-serif;color:#fff;text-transform:uppercase;margin-top:2px}
.giv-faixa em{display:block;font-style:normal;font:700 14px Oswald,sans-serif;color:${BRANCO};margin-top:3px;letter-spacing:.12em}
.giv-poeira{position:absolute;bottom:0;width:5px;height:5px;border-radius:50%;z-index:9;opacity:0;background:#cfcfcf;animation:givPoeira 2600ms linear infinite}
@keyframes givPoeira{0%{opacity:0;transform:translate(0,0)}20%{opacity:.8}100%{opacity:0;transform:translate(var(--dx),-560px)}}
@media (prefers-reduced-motion:reduce){.giv-treme,.giv-gongo,.giv-onda,.giv-ding,.giv-flash,.giv-pow,.giv-trinca,.giv-brilho,.giv-poeira,.giv-fumo,.giv-palavra{display:none}.giv-luz,.giv-corda,.giv-poste,.giv-esc,.giv-luta,.giv-faixa{animation:none;opacity:1}}
`

function useEscala() {
  const calc = () => Math.min(window.innerWidth / 420, window.innerHeight / 760)
  const [s, setS] = useState(calc)
  useEffect(() => { const f = () => setS(calc()); window.addEventListener('resize', f); return () => window.removeEventListener('resize', f) }, [])
  return s
}

// posições fixas (a gala é igual pra todos)
const CORDAS = [470, 530, 590]
const POEIRA = Array.from({ length: 16 }, (_, i) => ({ x: 10 + sorte(i + 7) * 400, d: 600 + Math.round(sorte(i + 11) * 2400), dx: Math.round((sorte(i + 5) - 0.5) * 120) }))
const DINGS = [{ t: 900, x: 40, y: 60, txt: 'DING!' }, { t: 1500, x: 270, y: 90, txt: 'DING!' }]
// as trincas saem do ponto do soco (≈ 150, 250)
const TRINCAS = Array.from({ length: 11 }, (_, i) => {
  const a = (i / 11) * Math.PI * 2 + sorte(i) * 0.4
  const r1 = 60 + sorte(i + 3) * 40, r2 = 220 + sorte(i + 9) * 260
  const cx = 150, cy = 250
  const mx = cx + Math.cos(a + 0.12) * r1 * 1.8, my = cy + Math.sin(a + 0.12) * r1 * 1.8
  return `M${cx},${cy} L${(cx + Math.cos(a) * r1).toFixed(0)},${(cy + Math.sin(a) * r1).toFixed(0)} L${mx.toFixed(0)},${my.toFixed(0)} L${(cx + Math.cos(a - 0.05) * r2).toFixed(0)},${(cy + Math.sin(a - 0.05) * r2).toFixed(0)}`
})
const ANEIS = [40, 85]
const PALAVRAS = [{ txt: 'DISCIPLINA', t: 5400, y: 410 }, { txt: 'FORÇA', t: 5750, y: 455 }, { txt: 'VALE', t: 6100, y: 500 }]

export function GalaInterVale({ clube, chave, mostra, grito }: { clube: string; chave: string; mostra: string; grito: string }) {
  const s = useEscala()
  // 🔊 o canto da torcida toca junto com a gala (o mesmo do Wen Milan B — ordem do Diego)
  useEffect(() => playMp3Gala(`${import.meta.env.BASE_URL}sfx/torcida-spfc-wen-v1.mp3`, T), [chave])
  void grito
  return createPortal(
    <div key={chave} className="giv" aria-hidden>
      <style>{CSS}</style>
      <div className="giv-fundo" />
      <div className="giv-palco" style={{ transform: `translate(-50%,-50%) scale(${s})` }}>
        <div className="giv-treme">
          <div className="giv-luz" />
          <div className="giv-chao" />
          <span className="giv-fumo" style={{ left: 10 }} /><span className="giv-fumo" style={{ left: 200, animationDelay: '1.4s' }} />
          {POEIRA.map((b, i) => <span key={`p${i}`} className="giv-poeira" style={{ left: b.x, animationDelay: `${b.d}ms`, ['--dx' as string]: `${b.dx}px` }} />)}
          <span className="giv-poste" style={{ left: 18 }} /><span className="giv-poste d" style={{ right: 18 }} />
          {CORDAS.map(y => <span key={`ce${y}`} className="giv-corda e" style={{ top: y }} />)}
          {CORDAS.map(y => <span key={`cd${y}`} className="giv-corda d" style={{ top: y }} />)}
          <div className="giv-gongo" />
          {DINGS.map((d, i) => <span key={`o${i}`} className="giv-onda" style={{ animationDelay: `${d.t}ms` }} />)}
          {DINGS.map((d, i) => <span key={`d${i}`} className="giv-ding" style={{ left: d.x, top: d.y, animationDelay: `${d.t}ms` }}>{d.txt}</span>)}
          <div className="giv-esc"><Escudo nome={clube} size={220} /></div>
          <div className="giv-brilho" />
          {PALAVRAS.map(p => <span key={p.txt} className="giv-palavra" style={{ top: p.y, animationDelay: `${p.t}ms` }}>{p.txt}</span>)}
          <div className="giv-luta"><div className="giv-bob"><img src={mascoteImg} alt="" /></div></div>
          <svg className="giv-trinca" viewBox="0 0 420 760" width="420" height="760">
            {TRINCAS.map((d, i) => <path key={i} d={d} fill="none" stroke="rgba(255,255,255,.85)" strokeWidth={i % 3 ? 1.6 : 2.6} strokeLinejoin="round" />)}
            {ANEIS.map(r => <circle key={r} cx={150} cy={250} r={r} fill="none" stroke="rgba(255,255,255,.55)" strokeWidth="1.4" strokeDasharray="14 9" />)}
            <circle cx={150} cy={250} r={16} fill="rgba(255,255,255,.35)" />
          </svg>
          <div className="giv-pow">POW!</div>
          <div className="giv-faixa">
            <small>{tr('🥊 CHEGOU NA SALA', '🥊 JUST ARRIVED')}</small>
            <b>{mostra}</b>
            <em>⚫ {tr('DISCIPLINA · FORÇA · VALE', 'DISCIPLINE · STRENGTH · VALE')} ⚪</em>
          </div>
        </div>
        <div className="giv-flash" />
      </div>
    </div>,
    document.body,
  )
}

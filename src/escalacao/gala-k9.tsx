// ─── 🧊👑 ENTRADA ÚNICA DO K9 FC: "O REI GELADO" ─────────────────────────────────
//
// Pedido do Diego (09/10): *"ele é lenda, gosta de coroa de Rei e tem apelido de gelado porque não
// tem medo de nada"*. Mockup aprovado no mesmo dia (`scripts/mockup-entrada-k9.mjs`), com o pedido
// dele de as mãos do abraço *"deslizarem pra cima e pra baixo, se alisando de frio, sem perder o
// abraço"*. A sala congela (-40°, neve) → um bloco de gelo despenca e crava no chão → racha e estoura
// → o Rei K9 sai (arte DO DONO) esfregando os braços → a coroa desce girando sobre o escudo → grito.
//
// Mesmo esquema da gala do Neymarzetti (`gala-helicoptero.tsx`): palco de celular 420×760 escalado pra
// tela; camada fixa, `pointer-events:none`, fora do reducer, sem localStorage; "reduzir movimento" =
// só o telão e o K9 parado. Arte nova: nenhuma (coroa e gelo em CSS/SVG; escudo e mascote do batismo).
import { useEffect, useState } from 'react'
import type React from 'react'
import { createPortal } from 'react-dom'
import { Escudo } from './escudos'
import { tr } from './lang'
import k9MascoteImg from './img/k9-mascote.webp'

export const K9_MS = 8400
const T = K9_MS
const pct = (ms: number) => (ms / T * 100).toFixed(1) + '%'
const GOLD = '#FFC400'
// a arte do mascote é 328×440; no palco ela aparece com 250 de altura
const MW = 186, MH = 250

const COROA = <svg viewBox="0 0 120 80" width="120" height="80" xmlns="http://www.w3.org/2000/svg">
  <path d="M8 70 L14 22 L38 46 L60 8 L82 46 L106 22 L112 70 Z" fill={GOLD} stroke="#0C0C0C" strokeWidth="4" strokeLinejoin="round" />
  <rect x="8" y="64" width="104" height="12" rx="3" fill="#E8A200" stroke="#0C0C0C" strokeWidth="4" />
  <circle cx="60" cy="8" r="6" fill="#8fd3ff" stroke="#0C0C0C" strokeWidth="3" /><circle cx="14" cy="22" r="5" fill="#8fd3ff" stroke="#0C0C0C" strokeWidth="3" /><circle cx="106" cy="22" r="5" fill="#8fd3ff" stroke="#0C0C0C" strokeWidth="3" />
  <circle cx="38" cy="58" r="4" fill="#E8503A" /><circle cx="60" cy="58" r="4" fill="#8fd3ff" /><circle cx="82" cy="58" r="4" fill="#E8503A" />
  <path d="M20 30 L24 52" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity=".7" />
</svg>
const CACOS = Array.from({ length: 14 }, (_, i) => {
  const ang = (i / 14) * Math.PI * 2, d = 150 + (i % 4) * 40
  return { dx: Math.round(Math.cos(ang) * d), dy: Math.round(Math.sin(ang) * d * 0.8) - 40, r: (i * 47) % 360, w: 14 + (i % 3) * 8 }
})
const NEVE = Array.from({ length: 34 }, (_, i) => ({ x: (i * 37) % 420, d: (i * 0.23) % 3, s: 3 + (i % 3) * 2, dur: 4 + (i % 5) * 0.7 }))

const CSS = `
.gk9{position:fixed;inset:0;z-index:99990;pointer-events:none;overflow:hidden;animation:gk9Vis ${T}ms ease forwards}
@keyframes gk9Vis{0%{opacity:0}4%{opacity:1}94%{opacity:1}100%{opacity:0}}
.gk9-treme-tela{position:absolute;inset:0;animation:gk9TremeTela ${T}ms linear forwards}
@keyframes gk9TremeTela{0%,${pct(2550)}{transform:none}${pct(2600)}{transform:translate(-9px,5px)}${pct(2680)}{transform:translate(8px,-6px)}${pct(2760)}{transform:translate(-6px,3px)}${pct(2840)}{transform:translate(4px,-2px)}${pct(2950)}{transform:none}100%{transform:none}}
.gk9-escuro{position:absolute;inset:0;background:radial-gradient(ellipse 70% 55% at 50% 55%,rgba(28,62,98,.9),rgba(2,8,18,.985) 75%)}
.gk9-geada{position:absolute;inset:0;opacity:0;background:radial-gradient(ellipse 60% 18% at 50% 100%,rgba(210,240,255,.55),transparent 70%),radial-gradient(ellipse 18% 60% at 0% 50%,rgba(210,240,255,.45),transparent 70%),radial-gradient(ellipse 18% 60% at 100% 50%,rgba(210,240,255,.45),transparent 70%),radial-gradient(ellipse 60% 14% at 50% 0%,rgba(210,240,255,.4),transparent 70%);animation:gk9Geada ${T}ms ease forwards}
@keyframes gk9Geada{0%,4%{opacity:0}${pct(1400)}{opacity:1}90%{opacity:1}100%{opacity:0}}
.gk9-neve{position:absolute;top:-10px;border-radius:50%;background:#fff;opacity:.85;animation-name:gk9Cai;animation-timing-function:linear;animation-iteration-count:infinite}
@keyframes gk9Cai{0%{transform:translate(0,-20px)}100%{transform:translate(-30px,110vh)}}
.gk9-palco{position:absolute;left:50%;top:50%;width:420px;height:760px}
.gk9-temp{position:absolute;left:0;right:0;top:120px;text-align:center;font:700 52px Oswald,sans-serif;color:#cfeeff;text-shadow:0 0 18px rgba(140,210,255,.9),3px 3px 0 #000;opacity:0;margin:0;animation:gk9Temp ${T}ms ease forwards}
@keyframes gk9Temp{0%,${pct(500)}{opacity:0;transform:scale(.6)}${pct(900)}{opacity:1;transform:scale(1.1)}${pct(1100)}{transform:scale(1)}${pct(1700)}{opacity:1}${pct(2000)}{opacity:0}100%{opacity:0}}
.gk9-bloco{position:absolute;left:105px;top:-320px;width:210px;height:280px;border-radius:18px;background:linear-gradient(150deg,rgba(220,245,255,.92),rgba(140,205,240,.75) 55%,rgba(90,170,220,.8));border:4px solid #0C0C0C;box-shadow:inset 10px 10px 0 rgba(255,255,255,.5),inset -8px -10px 0 rgba(60,140,200,.5),6px 6px 0 #000;overflow:hidden;animation:gk9Bloco ${T}ms cubic-bezier(.55,0,.9,.6) forwards}
.gk9-bloco img{position:absolute;left:50%;bottom:6px;height:240px;transform:translateX(-50%);opacity:.35;filter:blur(1.5px) saturate(.4)}
@keyframes gk9Bloco{0%,${pct(1900)}{top:-320px;transform:rotate(-6deg);opacity:1}${pct(2600)}{top:420px;transform:rotate(0)}${pct(2700)}{top:430px;transform:scale(1.04,.96)}${pct(2850)}{top:426px;transform:scale(1)}${pct(3550)}{top:426px;opacity:1;transform:scale(1)}${pct(3700)}{top:426px;opacity:0;transform:scale(1.15)}100%{top:426px;opacity:0}}
.gk9-racha{position:absolute;inset:0;opacity:0;animation:gk9Racha ${T}ms linear forwards}
@keyframes gk9Racha{0%,${pct(2800)}{opacity:0}${pct(2950)}{opacity:.6}${pct(3300)}{opacity:1}100%{opacity:1}}
.gk9-impacto{position:absolute;left:0;right:0;top:690px;height:60px;opacity:0;background:radial-gradient(ellipse 50% 50% at 50% 50%,rgba(220,245,255,.8),transparent 70%);animation:gk9Impacto ${T}ms ease forwards}
@keyframes gk9Impacto{0%,${pct(2580)}{opacity:0;transform:scaleX(.4)}${pct(2700)}{opacity:1;transform:scaleX(1.3)}${pct(3300)}{opacity:0;transform:scaleX(1.6)}100%{opacity:0}}
.gk9-caco{position:absolute;left:200px;top:560px;opacity:0;background:linear-gradient(150deg,#e6f7ff,#8fd0f2);border:2px solid #0C0C0C;clip-path:polygon(50% 0,100% 60%,40% 100%,0 40%);animation:gk9Caco ${T}ms cubic-bezier(.2,.7,.4,1) forwards}
@keyframes gk9Caco{0%,${pct(3550)}{opacity:0;transform:translate(0,0) rotate(0)}${pct(3620)}{opacity:1}${pct(4500)}{opacity:0;transform:translate(var(--dx),var(--dy)) rotate(var(--r))}100%{opacity:0;transform:translate(var(--dx),var(--dy)) rotate(var(--r))}}
.gk9-clarao{position:absolute;inset:0;background:#dff4ff;opacity:0;animation:gk9Clarao ${T}ms ease forwards}
@keyframes gk9Clarao{0%,${pct(3550)}{opacity:0}${pct(3620)}{opacity:.85}${pct(4000)}{opacity:0}100%{opacity:0}}
.gk9-masc{position:absolute;left:50%;top:446px;width:${MW}px;height:${MH}px;opacity:0;transform:translateX(-50%);filter:drop-shadow(0 0 16px rgba(140,210,255,.8)) drop-shadow(4px 6px 0 rgba(0,0,0,.5));animation:gk9Masc ${T}ms ease forwards}
@keyframes gk9Masc{0%,${pct(3560)}{opacity:0;transform:translateX(-50%) scale(.85)}${pct(3700)}{opacity:1;transform:translateX(-50%) scale(1.08)}${pct(3900)}{transform:translateX(-50%) scale(1)}${pct(8100)}{opacity:1;transform:translateX(-50%) scale(1)}100%{opacity:0;transform:translateX(-50%) scale(1)}}
.gk9-masc img{display:block;width:${MW}px;height:${MH}px}
.gk9-tremido{position:relative;animation:gk9Tremido .09s linear infinite}
@keyframes gk9Tremido{0%{transform:translateX(0)}25%{transform:translateX(.8px)}75%{transform:translateX(-.8px)}100%{transform:translateX(0)}}
/* 🥶 as MÃOS do abraço: dois pedacinhos da arte (cada mão) deslizam pra cima e pra baixo, cada um num
   sentido, com a borda esfumada pra não aparecer o recorte */
.gk9-mao{position:absolute;background-image:url(${k9MascoteImg});background-size:${MW}px ${MH}px;-webkit-mask-image:radial-gradient(ellipse 50% 50% at 50% 50%,#000 55%,transparent 100%);mask-image:radial-gradient(ellipse 50% 50% at 50% 50%,#000 55%,transparent 100%)}
.gk9-mao.e{left:63px;top:66px;width:21px;height:23px;background-position:-63px -66px;animation:gk9Esfrega .34s ease-in-out infinite alternate}
.gk9-mao.d{left:105px;top:66px;width:21px;height:21px;background-position:-105px -66px;animation:gk9Esfrega .34s ease-in-out infinite alternate-reverse}
@keyframes gk9Esfrega{from{transform:translateY(-4px)}to{transform:translateY(4px)}}
.gk9-telao{position:absolute;left:50%;top:118px;width:380px;text-align:center;opacity:0;transform:translateX(-50%) scale(.3);animation:gk9Telao ${T}ms cubic-bezier(.2,1.3,.4,1) forwards}
@keyframes gk9Telao{0%,${pct(4300)}{opacity:0;transform:translateX(-50%) scale(.3)}${pct(4900)}{opacity:1;transform:translateX(-50%) scale(1.08)}${pct(5200)}{transform:translateX(-50%) scale(1)}${pct(7900)}{opacity:1;transform:translateX(-50%) scale(1)}100%{opacity:0;transform:translateX(-50%) scale(1)}}
.gk9-telao .esc{display:inline-flex;filter:drop-shadow(0 0 22px rgba(140,210,255,.9)) drop-shadow(4px 5px 0 #000)}
.gk9-chega{font:700 15px Oswald,sans-serif;letter-spacing:3px;color:#9fe0ff;margin:4px 0 0;text-shadow:2px 2px 0 #000}
.gk9-nome{font:700 40px/1 Oswald,sans-serif;color:#fff;text-transform:uppercase;margin:6px 0 0;text-shadow:3px 3px 0 #000}
.gk9-coroa{position:absolute;left:150px;top:-120px;opacity:0;filter:drop-shadow(0 0 14px rgba(255,196,0,.9)) drop-shadow(3px 4px 0 #000);animation:gk9Coroa ${T}ms cubic-bezier(.3,.8,.4,1) forwards}
@keyframes gk9Coroa{0%,${pct(4900)}{opacity:0;top:-120px;transform:rotateY(0) rotate(-20deg)}${pct(5000)}{opacity:1}${pct(5800)}{top:30px;transform:rotateY(720deg) rotate(0)}${pct(5950)}{top:38px;transform:rotateY(720deg) scale(1.1,.9)}${pct(6100)}{top:34px;transform:rotateY(720deg) scale(1)}${pct(7900)}{opacity:1;top:34px;transform:rotateY(720deg)}100%{opacity:0;top:34px;transform:rotateY(720deg)}}
.gk9-brilho{position:absolute;left:210px;top:72px;width:6px;height:6px;border-radius:50%;background:#fff;box-shadow:0 0 18px 9px ${GOLD};opacity:0;animation:gk9Brilho ${T}ms ease forwards}
@keyframes gk9Brilho{0%,${pct(5900)}{opacity:0;transform:scale(.4)}${pct(6000)}{opacity:1;transform:scale(2.4)}${pct(6400)}{opacity:0;transform:scale(3)}100%{opacity:0}}
.gk9-grito{position:absolute;left:0;right:0;top:392px;text-align:center;font:700 26px Oswald,sans-serif;color:${GOLD};text-shadow:2px 2px 0 #000;opacity:0;margin:0;animation:gk9Grito ${T}ms ease forwards}
@keyframes gk9Grito{0%,${pct(6000)}{opacity:0;transform:scale(.6)}${pct(6300)}{opacity:1;transform:scale(1.15)}${pct(6500)}{transform:scale(1)}${pct(7800)}{opacity:1}${pct(8100)}{opacity:0}}
@media (prefers-reduced-motion:reduce){.gk9-neve,.gk9-bloco,.gk9-caco,.gk9-clarao,.gk9-impacto,.gk9-temp,.gk9-coroa,.gk9-brilho{display:none}.gk9-treme-tela,.gk9-tremido,.gk9-mao{animation:none}}
`

function useEscala() {
  const calc = () => Math.min(window.innerWidth / 420, window.innerHeight / 760)
  const [s, setS] = useState(calc)
  useEffect(() => { const f = () => setS(calc()); window.addEventListener('resize', f); return () => window.removeEventListener('resize', f) }, [])
  return s
}

export function GalaK9({ clube, chave, mostra, grito }: { clube: string; chave: string; mostra: string; grito: string }) {
  const s = useEscala()
  return createPortal(
    <div key={chave} className="gk9" aria-hidden>
      <style>{CSS}</style>
      <div className="gk9-treme-tela">
        <div className="gk9-escuro" /><div className="gk9-geada" />
        {NEVE.map((n, i) => <span key={i} className="gk9-neve" style={{ left: `${(n.x / 420) * 100}%`, width: n.s, height: n.s, animationDuration: `${n.dur}s`, animationDelay: `-${n.d}s` }} />)}
        <div className="gk9-palco" style={{ transform: `translate(-50%,-50%) scale(${s})` }}>
          <p className="gk9-temp">❄️ -40°</p>
          <div className="gk9-telao">
            <span className="esc"><Escudo nome={clube} size={170} /></span>
            <p className="gk9-chega">{tr('👑 O REI GELADO CHEGOU', '👑 THE ICE KING HAS ARRIVED')}</p>
            <p className="gk9-nome">{mostra}</p>
          </div>
          <div className="gk9-coroa">{COROA}</div><span className="gk9-brilho" />
          <p className="gk9-grito">🔊 {tr('Ô Ô Ô', 'OH OH OH')}, {grito}! 🔊</p>
          <div className="gk9-impacto" />
          <div className="gk9-masc"><div className="gk9-tremido"><img src={k9MascoteImg} alt="" /><span className="gk9-mao e" /><span className="gk9-mao d" /></div></div>
          <div className="gk9-bloco">
            <img src={k9MascoteImg} alt="" />
            <svg className="gk9-racha" viewBox="0 0 210 280" width="210" height="280"><path d="M105 0 L95 60 L120 100 L88 150 L112 200 L96 280 M95 60 L40 90 M120 100 L180 120 M88 150 L30 190 M112 200 L170 240" stroke="#fff" strokeWidth="4" fill="none" strokeLinejoin="round" /><path d="M105 0 L95 60 L120 100 L88 150 L112 200 L96 280" stroke="#0C0C0C" strokeWidth="1.5" fill="none" /></svg>
          </div>
          {CACOS.map((c, i) => <span key={i} className="gk9-caco" style={{ width: c.w, height: c.w + 6, ['--dx' as string]: `${c.dx}px`, ['--dy' as string]: `${c.dy}px`, ['--r' as string]: `${c.r}deg` } as React.CSSProperties} />)}
        </div>
        <div className="gk9-clarao" />
      </div>
    </div>,
    document.body,
  )
}

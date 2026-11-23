// ─── 🚁🦇 ENTRADA ÚNICA DO NEYMARZETTI — VERSÃO 2 (23/11, mockup em vídeo) ──────────────────────────
//
// Pedido do Diego: *"melhore a entrada de gala do neymarzetti… mesmo estilo helicóptero e descendo na corda"*.
// A ideia da 1ª (gala-helicoptero.tsx) continua: o helicóptero chega, a corda desce e o 10 desce nela. O que mudou:
// 1) cidade à noite (prédios com janela acesa, lua, estrelas) e o farol do helicóptero varrendo a tela antes de ele parar
// 2) helicóptero preto e branco (as 2 cores do manto) com o morcego-N cromado na lateral, luz vermelha piscando e sombra
// 3) vento do rotor: poeira no heliponto e papel picado voando
// 4) o 10 desce GIRANDO na corda e pousa DE JOELHOS (a pose da arte dele): o chão racha e sobe a onda de poeira
// 5) o escudo cromado acende com um brilho passando e um bando de morcegos sai voando dele
// 6) o helicóptero volta cruzando a tela puxando a faixa com o grito
// Mesmas regras das outras galas únicas: palco 420×760 escalado, camada fixa sem clique, fora do reducer, sem localStorage.
// Tudo é desenho em CSS/SVG (0 KB de arte nova); escudo e mascote são os do batismo.
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { tr } from './lang'
import { playHelicoptero } from './sound'
import escudoImg from './img/neymarzetti-escudo.webp' // 345×360
import mascoteImg from './img/neymarzetti-mascote.webp' // 346×440, o 10 de joelhos comemorando

export const NEYMARZETTI_MS = 8800
const T = NEYMARZETTI_MS
const pct = (ms: number) => (ms / T * 100).toFixed(2) + '%'
const BRANCO = '#F0EFEF', PRETO = '#080908', GOLD = '#FFC400', PRATA = '#BFC3C7'
const sorte = (i: number) => ((i * 7919) % 997) / 997 // espalhado e sempre igual (a gala é igual pra todos)

// medidas do palco
const CHAO = 652 // onde os joelhos tocam o heliponto
const MH = 230, MW = Math.round(MH * 346 / 440)
const MX = 210 // centro da descida
const HX = MX - 115, HY = 110 // helicóptero parado (a barriga fica no x=115 do desenho)
const CORDA_Y = HY + 112
const POUSA = 4000 // ms do pouso

// prédios ao fundo: [x, largura, altura]
const PREDIOS: [number, number, number][] = [[-10, 60, 300], [46, 44, 380], [86, 70, 250], [150, 40, 430], [186, 64, 320], [246, 50, 400], [292, 72, 280], [360, 40, 360], [396, 50, 300]]
const MORCEGOS = Array.from({ length: 11 }, (_, i) => {
  const ang = -Math.PI * (0.08 + 0.84 * (i / 10)) + (sorte(i + 3) - 0.5) * 0.3
  const dist = 230 + sorte(i + 11) * 170
  return { dx: Math.round(Math.cos(ang) * dist), dy: Math.round(Math.sin(ang) * dist * 0.9), atraso: Math.round(sorte(i + 5) * 500), tam: 40 + Math.round(sorte(i + 7) * 26) }
})
const PAPEIS = Array.from({ length: 16 }, (_, i) => ({ lado: i % 2 ? 1 : -1, y: 560 + Math.round(sorte(i + 2) * 90), atraso: Math.round(sorte(i + 9) * 1200), cor: [BRANCO, PRETO, GOLD, PRATA][i % 4] }))

const MORCEGO = <svg viewBox="0 0 64 32" width="100%" height="100%"><path d="M32 10c2-4 4-6 4-6l1 5c3-1 5-1 7 0 4-6 12-8 20-6-5 2-8 6-8 12-3-2-7-2-9 1-2-3-6-4-9-2-2 3-4 6-6 10-2-4-4-7-6-10-3-2-7-1-9 2-2-3-6-3-9-1 0-6-3-10-8-12 8-2 16 0 20 6 2-1 4-1 7 0l1-5s2 2 4 6z" fill={PRETO} stroke={BRANCO} strokeWidth="2.2" /></svg>

const HELI = <svg viewBox="0 0 300 140" width="300" height="140" xmlns="http://www.w3.org/2000/svg">
  <g className="gnz-rotor"><rect x="6" y="5" width="228" height="8" rx="4" fill="#222" /></g>
  <rect x="113" y="11" width="14" height="19" rx="3" fill={PRETO} stroke={PRATA} strokeWidth="2" />
  <path d="M170 58 L285 50 L288 62 L175 80 Z" fill={PRETO} stroke={BRANCO} strokeWidth="3" strokeLinejoin="round" />
  <path d="M270 50 L292 22 L298 26 L286 58 Z" fill={PRETO} stroke={BRANCO} strokeWidth="3" strokeLinejoin="round" />
  <g className="gnz-rotor-cauda"><rect x="289" y="10" width="7" height="44" rx="3" fill="#222" /></g>
  <circle className="gnz-pisca" cx="294" cy="26" r="4.5" fill="#ff2a2a" />
  <path d="M40 72 C40 44 70 28 110 28 L150 28 C178 28 190 46 190 66 L190 82 C190 98 176 108 158 108 L78 108 C54 108 40 94 40 72 Z" fill={PRETO} stroke={BRANCO} strokeWidth="4" />
  <path d="M104 92 L188 92" stroke={BRANCO} strokeWidth="5" />
  <path d="M44 74 C44 50 62 36 90 34 L100 34 L100 84 L48 84 C45 81 44 78 44 74 Z" fill="#2b3a4d" stroke={BRANCO} strokeWidth="3" />
  <path d="M56 50 C62 43 72 40 82 39" stroke="#cfe6ff" strokeWidth="4" strokeLinecap="round" fill="none" opacity=".7" />
  <circle className="gnz-pisca" cx="118" cy="110" r="4" fill="#ff2a2a" />
  <rect x="70" y="106" width="8" height="16" fill={PRETO} /><rect x="150" y="106" width="8" height="16" fill={PRETO} />
  <path d="M46 124 L176 124 C182 124 184 118 184 116" stroke={BRANCO} strokeWidth="6" strokeLinecap="round" fill="none" />
</svg>

const CSS = `
.gnz{position:fixed;inset:0;z-index:99990;pointer-events:none;overflow:hidden;animation:gnzVis ${T}ms ease forwards}
@keyframes gnzVis{0%{opacity:0}4%{opacity:1}95%{opacity:1}100%{opacity:0}}
.gnz-fundo{position:absolute;inset:0;background:radial-gradient(ellipse 80% 60% at 50% 35%,#16223a,#070b14 60%,#020306)}
.gnz-palco{position:absolute;left:50%;top:50%;width:420px;height:760px}
.gnz-treme{position:absolute;inset:0;animation:gnzTreme ${T}ms linear forwards}
@keyframes gnzTreme{0%,${pct(POUSA)}{transform:none}${pct(POUSA + 50)}{transform:translate(-7px,8px)}${pct(POUSA + 120)}{transform:translate(6px,-5px)}${pct(POUSA + 200)}{transform:translate(-3px,3px)}${pct(POUSA + 280)}{transform:none}100%{transform:none}}
/* céu */
.gnz-estrela{position:absolute;width:2px;height:2px;border-radius:50%;background:#fff;animation:gnzBrilha 2.4s ease-in-out infinite}
@keyframes gnzBrilha{0%,100%{opacity:.25}50%{opacity:1}}
.gnz-lua{position:absolute;left:300px;top:70px;width:62px;height:62px;border-radius:50%;background:radial-gradient(circle at 38% 38%,#fffbe8,#e6dfc0 60%,#b9b291);box-shadow:0 0 40px 10px rgba(255,248,220,.25)}
/* cidade */
.gnz-predio{position:absolute;bottom:${760 - 620}px;background:#0d1320;border:2px solid #1b2436;border-bottom:none}
.gnz-predio i{position:absolute;inset:10px 7px 0;background-image:repeating-linear-gradient(0deg,transparent 0 9px,#0d1320 9px 18px),repeating-linear-gradient(90deg,#f5d37a 0 6px,transparent 6px 13px);opacity:.55}
.gnz-predio i.pisca{animation:gnzJanela 3.1s steps(2) infinite}
@keyframes gnzJanela{0%{opacity:.55}50%{opacity:.25}}
/* telhado com heliponto */
.gnz-telhado{position:absolute;left:-20px;right:-20px;top:620px;bottom:-300px;background:linear-gradient(#3a3f48,#23272e);border-top:4px solid #5a616c}
.gnz-heliponto{position:absolute;left:${MX - 110}px;top:${CHAO - 26}px;width:220px;height:56px;border-radius:50%;border:4px solid ${GOLD};background:radial-gradient(ellipse,#2b3038,#1c2026)}
.gnz-heliponto b{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%) scaleY(.45);font:700 64px/1 Oswald,sans-serif;color:${BRANCO};opacity:.85}
.gnz-sombra{position:absolute;left:${MX - 120}px;top:${CHAO - 8}px;width:240px;height:30px;border-radius:50%;background:radial-gradient(ellipse,rgba(0,0,0,.65),transparent 70%);opacity:0;animation:gnzSombra ${T}ms ease forwards}
@keyframes gnzSombra{0%,${pct(1600)}{opacity:0;transform:scale(.4)}${pct(2300)}{opacity:1;transform:scale(1)}${pct(4400)}{opacity:1}${pct(5000)}{opacity:0}100%{opacity:0}}
/* helicóptero */
.gnz-heli{position:absolute;width:300px;height:140px;left:470px;top:60px;animation:gnzHeli ${T}ms cubic-bezier(.4,0,.3,1) forwards}
@keyframes gnzHeli{0%{left:470px;top:50px;transform:rotate(-8deg)}
 ${pct(2000)}{left:${HX}px;top:${HY}px;transform:rotate(4deg)}
 ${pct(2400)}{left:${HX}px;top:${HY}px;transform:rotate(0)}
 ${pct(3000)}{top:${HY - 5}px}${pct(3600)}{top:${HY + 4}px}${pct(4200)}{top:${HY - 3}px}
 ${pct(4500)}{left:${HX}px;top:${HY}px;transform:rotate(0)}
 ${pct(5300)}{left:-380px;top:-90px;transform:rotate(-14deg)}
 ${pct(5320)}{left:440px;top:262px;transform:rotate(-4deg) scale(.82)}
 ${pct(5500)}{left:440px;top:262px;transform:rotate(-4deg) scale(.82)}
 ${pct(8600)}{left:-640px;top:250px;transform:rotate(-5deg) scale(.82)}
 100%{left:-640px;top:250px;transform:rotate(-5deg) scale(.82)}}
.gnz-heli-logo{position:absolute;left:118px;top:36px;width:46px;filter:drop-shadow(0 0 4px rgba(255,255,255,.35))}
.gnz-rotor{transform-origin:120px 9px;animation:gnzGira .11s linear infinite}
@keyframes gnzGira{0%{transform:scaleX(1)}50%{transform:scaleX(.12)}100%{transform:scaleX(1)}}
.gnz-rotor-cauda{transform-origin:292px 32px;animation:gnzGira2 .09s linear infinite}
@keyframes gnzGira2{0%{transform:scaleY(1)}50%{transform:scaleY(.2)}100%{transform:scaleY(1)}}
.gnz-pisca{animation:gnzPisca .9s steps(1) infinite}
@keyframes gnzPisca{0%{opacity:1}50%{opacity:.1}}
/* farol: nasce na barriga do helicóptero e varre a cidade antes de parar no heliponto */
.gnz-farol{position:absolute;left:115px;top:112px;width:150px;height:620px;margin-left:-75px;transform-origin:50% 0;background:linear-gradient(180deg,rgba(255,244,200,.45),rgba(255,244,200,.06) 85%,transparent);clip-path:polygon(44% 0,56% 0,100% 100%,0 100%);filter:blur(2px);opacity:0;animation:gnzFarol ${T}ms ease-in-out forwards}
@keyframes gnzFarol{0%{opacity:0;transform:rotate(45deg)}${pct(300)}{opacity:1}${pct(900)}{transform:rotate(-30deg)}${pct(1500)}{transform:rotate(22deg)}${pct(2200)}{transform:rotate(0)}${pct(4300)}{opacity:1;transform:rotate(0)}${pct(4600)}{opacity:0}100%{opacity:0}}
/* faixa puxada na volta */
.gnz-faixa-corda{position:absolute;left:240px;top:96px;width:110px;height:3px;background:${BRANCO};transform-origin:0 50%;transform:rotate(16deg);opacity:0;animation:gnzFaixa ${T}ms linear forwards}
.gnz-faixa{position:absolute;left:345px;top:112px;width:440px;padding:14px 16px;background:${PRETO};border:4px solid ${BRANCO};border-radius:6px;box-shadow:5px 5px 0 rgba(0,0,0,.6);font:700 34px/1 Oswald,sans-serif;color:${BRANCO};white-space:nowrap;text-align:center;opacity:0;animation:gnzFaixa ${T}ms linear forwards}
.gnz-faixa em{font-style:normal;color:${GOLD}}
@keyframes gnzFaixa{0%,${pct(5320)}{opacity:0}${pct(5340)}{opacity:1}100%{opacity:1}}
/* vento: poeira e papel picado */
.gnz-vento{position:absolute;inset:0;opacity:0;animation:gnzVento ${T}ms ease forwards}
@keyframes gnzVento{0%,${pct(2200)}{opacity:0}${pct(2600)}{opacity:1}${pct(4500)}{opacity:1}${pct(5100)}{opacity:0}100%{opacity:0}}
.gnz-poeira{position:absolute;top:${CHAO - 30}px;width:90px;height:40px;border-radius:50%;background:radial-gradient(ellipse,rgba(210,200,180,.55),transparent 70%);animation:gnzPoeira 1s ease-out infinite}
@keyframes gnzPoeira{0%{transform:translateX(0) scale(.5);opacity:.9}100%{transform:translateX(var(--dx)) scale(1.6);opacity:0}}
.gnz-papel{position:absolute;width:9px;height:6px;animation:gnzPapel 1.3s linear infinite}
@keyframes gnzPapel{0%{transform:translate(0,0) rotate(0);opacity:1}100%{transform:translate(var(--dx),-160px) rotate(720deg);opacity:0}}
/* corda */
.gnz-corda{position:absolute;left:${MX - 2}px;top:${CORDA_Y}px;width:4px;height:0;background:${BRANCO};box-shadow:1px 0 0 ${PRETO};animation:gnzCorda ${T}ms ease forwards}
@keyframes gnzCorda{0%,${pct(2400)}{height:0}${pct(2800)}{height:${CHAO - CORDA_Y - 20}px}${pct(4250)}{height:${CHAO - CORDA_Y - 20}px}${pct(4550)}{height:0}100%{height:0}}
/* o 10: desce girando e pousa de joelhos */
.gnz-masc{position:absolute;left:${MX - MW / 2}px;top:170px;width:${MW}px;height:${MH}px;opacity:0;transform-origin:50% 100%;filter:drop-shadow(5px 7px 0 rgba(0,0,0,.55));animation:gnzMasc ${T}ms forwards}
@keyframes gnzMasc{0%,${pct(2800)}{opacity:0;top:170px;transform:perspective(700px) rotateY(0)}
 ${pct(2850)}{opacity:1;top:175px;transform:perspective(700px) rotateY(0);animation-timing-function:cubic-bezier(.5,0,.9,.6)}
 ${pct(POUSA)}{top:${CHAO - MH}px;transform:perspective(700px) rotateY(720deg) scale(1)}
 ${pct(POUSA + 90)}{top:${CHAO - MH}px;transform:perspective(700px) rotateY(720deg) scale(1.1,.86)}
 ${pct(POUSA + 260)}{transform:perspective(700px) rotateY(720deg) scale(.97,1.04)}
 ${pct(POUSA + 420)}{transform:perspective(700px) rotateY(720deg) scale(1)}
 ${pct(5600)}{transform:perspective(700px) rotateY(720deg) rotate(-4deg)}${pct(6000)}{transform:perspective(700px) rotateY(720deg) rotate(4deg)}${pct(6400)}{transform:perspective(700px) rotateY(720deg) rotate(0)}
 ${pct(8500)}{opacity:1;top:${CHAO - MH}px}100%{opacity:0;top:${CHAO - MH}px;transform:perspective(700px) rotateY(720deg)}}
/* pouso: racha, onda e poeira */
.gnz-racha{position:absolute;left:${MX - 120}px;top:${CHAO - 14}px;width:240px;height:40px;opacity:0;transform:scaleX(.1);animation:gnzRacha ${T}ms ease-out forwards}
@keyframes gnzRacha{0%,${pct(POUSA)}{opacity:0;transform:scaleX(.1)}${pct(POUSA + 60)}{opacity:1}${pct(POUSA + 220)}{transform:scaleX(1)}${pct(8000)}{opacity:1;transform:scaleX(1)}100%{opacity:0;transform:scaleX(1)}}
.gnz-onda{position:absolute;left:${MX - 40}px;top:${CHAO - 12}px;width:80px;height:24px;border-radius:50%;border:4px solid rgba(255,255,255,.85);opacity:0;animation:gnzOnda ${T}ms ease-out forwards}
@keyframes gnzOnda{0%,${pct(POUSA)}{opacity:0;transform:scale(.3)}${pct(POUSA + 40)}{opacity:1}${pct(POUSA + 700)}{opacity:0;transform:scale(5.5,3.2)}100%{opacity:0}}
.gnz-nuvem{position:absolute;top:${CHAO - 50}px;width:120px;height:70px;border-radius:50%;background:radial-gradient(ellipse,rgba(220,212,195,.8),transparent 68%);opacity:0;animation:gnzNuvem ${T}ms ease-out forwards}
@keyframes gnzNuvem{0%,${pct(POUSA)}{opacity:0;transform:translateX(0) scale(.4)}${pct(POUSA + 80)}{opacity:1}${pct(POUSA + 900)}{opacity:0;transform:translateX(var(--dx)) translateY(-30px) scale(1.8)}100%{opacity:0}}
.gnz-flash{position:absolute;inset:0;background:#fff;opacity:0;animation:gnzFlash ${T}ms linear forwards}
@keyframes gnzFlash{0%,${pct(POUSA)}{opacity:0}${pct(POUSA + 40)}{opacity:.75}${pct(POUSA + 220)}{opacity:0}100%{opacity:0}}
/* telão: escudo cromado com brilho e os morcegos */
.gnz-telao{position:absolute;left:50%;top:34px;width:390px;text-align:center;opacity:0;transform:translateX(-50%) scale(.3);animation:gnzTelao ${T}ms cubic-bezier(.2,1.3,.4,1) forwards}
@keyframes gnzTelao{0%,${pct(4600)}{opacity:0;transform:translateX(-50%) scale(.3)}${pct(5000)}{opacity:1;transform:translateX(-50%) scale(1.08)}${pct(5250)}{transform:translateX(-50%) scale(1)}${pct(8300)}{opacity:1;transform:translateX(-50%) scale(1)}100%{opacity:0;transform:translateX(-50%) scale(1)}}
.gnz-esc{position:relative;display:inline-block;width:${Math.round(160 * 345 / 360)}px;height:160px;filter:drop-shadow(0 0 22px rgba(255,255,255,.55)) drop-shadow(4px 5px 0 #000)}
.gnz-esc img{width:100%;height:100%;display:block}
.gnz-brilho{position:absolute;inset:0;-webkit-mask:url(${escudoImg}) center/contain no-repeat;mask:url(${escudoImg}) center/contain no-repeat;background:linear-gradient(110deg,transparent 35%,rgba(255,255,255,.95) 50%,transparent 65%) no-repeat;background-size:250% 100%;background-position:150% 0;animation:gnzBrilho ${T}ms linear forwards}
@keyframes gnzBrilho{0%,${pct(5100)}{background-position:150% 0}${pct(5800)}{background-position:-60% 0}${pct(6900)}{background-position:150% 0}${pct(7600)}{background-position:-60% 0}100%{background-position:-60% 0}}
.gnz-chega{font:700 15px Oswald,sans-serif;letter-spacing:3px;color:${GOLD};margin:6px 0 0}
.gnz-nome{font:700 40px/1 Oswald,sans-serif;color:#fff;text-transform:uppercase;margin:6px 0 0;text-shadow:3px 3px 0 #000}
.gnz-morcego{position:absolute;left:${MX}px;top:120px;opacity:0;animation:gnzMorcego 1700ms ease-out forwards}
.gnz-morcego svg{animation:gnzAsa .16s linear infinite}
@keyframes gnzAsa{0%,100%{transform:scaleY(1)}50%{transform:scaleY(.35)}}
@keyframes gnzMorcego{0%{opacity:0;transform:translate(-50%,-50%) scale(.2)}12%{opacity:1}80%{opacity:1}100%{opacity:0;transform:translate(calc(-50% + var(--dx)),calc(-50% + var(--dy))) scale(1)}}
@media (prefers-reduced-motion:reduce){.gnz-heli,.gnz-corda,.gnz-masc,.gnz-vento,.gnz-racha,.gnz-onda,.gnz-nuvem,.gnz-flash,.gnz-morcego,.gnz-sombra{display:none}}
`

/** o palco cabe inteiro na tela (celular: a largura manda; computador: a altura). */
function useEscala() {
  const calc = () => Math.min(window.innerWidth / 420, window.innerHeight / 760)
  const [s, setS] = useState(calc)
  useEffect(() => { const f = () => setS(calc()); window.addEventListener('resize', f); return () => window.removeEventListener('resize', f) }, [])
  return s
}

// 🚁 o volume da hélice acompanha o helicóptero: chega (0–2 s), fica em cima, vai embora (4,5–5,3 s) e passa de novo puxando a faixa
const SOM_HELICE: [number, number][] = [[300, 0.12], [2000, 1], [4500, 1], [5300, 0.15], [5600, 0.2], [6900, 0.6], [8400, 0.1]]

export function GalaNeymarzetti({ chave, mostra, grito }: { clube: string; chave: string; mostra: string; grito: string }) {
  const s = useEscala()
  useEffect(() => playHelicoptero(T, SOM_HELICE), [chave])
  return createPortal(
    <div key={chave} className="gnz" aria-hidden>
      <style>{CSS}</style>
      <div className="gnz-fundo" />
      <div className="gnz-palco" style={{ transform: `translate(-50%,-50%) scale(${s})` }}>
        <div className="gnz-treme">
          {Array.from({ length: 26 }, (_, i) => <span key={i} className="gnz-estrela" style={{ left: Math.round(sorte(i + 1) * 410), top: Math.round(sorte(i + 40) * 300), animationDelay: `${Math.round(sorte(i + 20) * 2400)}ms` }} />)}
          <div className="gnz-lua" />
          {PREDIOS.map(([x, w, h], i) => <div key={i} className="gnz-predio" style={{ left: x, width: w, height: h }}><i className={i % 3 === 1 ? 'pisca' : undefined} /></div>)}
          <div className="gnz-telhado" />
          <div className="gnz-heliponto"><b>H</b></div>
          <div className="gnz-sombra" />
          <div className="gnz-vento">
            {[-1, 1].map(l => [0, 1, 2].map(k => <span key={`${l}${k}`} className="gnz-poeira" style={{ left: MX - 45 + l * 40, ['--dx' as string]: `${l * 160}px`, animationDelay: `${k * 330}ms` }} />))}
            {PAPEIS.map((p, i) => <span key={i} className="gnz-papel" style={{ left: MX + p.lado * 20, top: p.y, background: p.cor, border: `1px solid ${PRETO}`, ['--dx' as string]: `${p.lado * (170 + sorte(i) * 90)}px`, animationDelay: `${p.atraso}ms` }} />)}
          </div>
          <div className="gnz-telao">
            <span className="gnz-esc"><img src={escudoImg} alt="" /><span className="gnz-brilho" /></span>
            <p className="gnz-chega">{tr('🚁 CHEGOU NA SALA', '🚁 JUST ARRIVED')}</p>
            <p className="gnz-nome">{mostra}</p>
          </div>
          {MORCEGOS.map((m, i) => <span key={i} className="gnz-morcego" style={{ width: m.tam, height: m.tam / 2, ['--dx' as string]: `${m.dx}px`, ['--dy' as string]: `${m.dy}px`, animationDelay: `${5000 + m.atraso}ms` }}>{MORCEGO}</span>)}
          <div className="gnz-corda" />
          <svg className="gnz-racha" viewBox="0 0 240 40"><path d="M120 6 L96 18 L70 14 L44 26 L14 22 M120 6 L142 20 L170 15 L198 28 L228 24 M96 18 L90 34 M170 15 L178 33 M120 6 L118 36" stroke="#0a0a0a" strokeWidth="3.5" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
          <span className="gnz-onda" />
          {[-1, 1].map(l => <span key={l} className="gnz-nuvem" style={{ left: MX - 60 + l * 30, ['--dx' as string]: `${l * 150}px` }} />)}
          <div className="gnz-masc"><img src={mascoteImg} alt="" width={MW} height={MH} style={{ display: 'block' }} /></div>
          <div className="gnz-heli">
            <div className="gnz-farol" />
            {HELI}
            <img className="gnz-heli-logo" src={escudoImg} alt="" />
            <span className="gnz-faixa-corda" />
            <div className="gnz-faixa">🔊 <em>{tr('Ô Ô Ô', 'OH OH OH')}</em>, {grito}! 🦇</div>
          </div>
        </div>
        <div className="gnz-flash" />
      </div>
    </div>,
    document.body,
  )
}

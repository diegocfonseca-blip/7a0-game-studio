// ─── 🦅⚫⚪ ENTRADA ÚNICA DO GAVIÕES SCCP: "O ATAQUE DO GAVIÃO" ─────────────────────────────────────────────────
//
// Pedido do Diego (16/10, o kauealves584 virou 🖋 Fundador): *"pense em algo voando o gavião e algo do Corinthians"*. A 1ª
// versão (bando no céu + mergulho) ele achou fraca: *"quero outra ideia melhor, mais impactante"*. Esta:
// 1) tela PRETA, o canto começa e um OLHO de gavião gigante abre na tela inteira e pisca
// 2) o Gavião (mascote do batismo) VOA NA CÂMERA — as asas crescem até tampar tudo
// 3) a TELA ESTILHAÇA (cacos de vidro caindo) e por trás aparece o estádio preto e branco
// 4) o BANDEIRÃO listrado gigante sobe da arquibancada
// 5) o BANDO gira em volta do ESCUDO, que acende no meio → letreiro de LED "TODO PODEROSO" + faixa "CHEGOU NA SALA"
// ⚠️ Nada de escudo, nome ou desenho oficial do Corinthians nem da torcida organizada: só as cores, o gavião do PRÓPRIO
// clube e frases de arquibancada. Mesmo esquema das outras galas únicas: palco 420×760 escalado, camada fixa sem clique,
// fora do reducer, sem localStorage; "reduzir movimento" = só o fim, parado.
// Som: o canto dele (`sfx/torcida-gavioes-v1.mp3`, 12 s do áudio que o Diego mandou — o mesmo da carreira).
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Escudo } from './escudos'
import { tr } from './lang'
import { playMp3Gala } from './sound'
import gavioesMascoteImg from './img/gavioes-mascote.webp'

export const GAVIOES_MS = 8600
const T = GAVIOES_MS
const pct = (ms: number) => (ms / T * 100).toFixed(1) + '%'
const GOLD = '#FFC400'
// a arte do Gavião é 224×440
const MH = 300, MW = Math.round(MH * 224 / 440)

/** 👁️ o olho do gavião em close: íris amarela, pupila, pena preta em volta e a pálpebra que pisca */
function Olho() {
  return (
    <svg viewBox="0 0 420 300" width="100%" height="100%">
      <defs>
        <radialGradient id="ggvIris" cx="50%" cy="45%" r="55%"><stop offset="0" stopColor="#fff7c2" /><stop offset=".45" stopColor="#ffc400" /><stop offset="1" stopColor="#8a5a00" /></radialGradient>
      </defs>
      {/* penas escuras em volta */}
      <path d="M0 150 Q60 40 210 30 Q360 40 420 150 Q360 270 210 280 Q60 270 0 150 Z" fill="#111" />
      <path d="M20 150 Q80 60 210 52 Q340 60 400 150 Q340 245 210 252 Q80 245 20 150 Z" fill="#1c1c1c" />
      {/* o olho */}
      <ellipse cx="210" cy="150" rx="150" ry="92" fill="#f4f4f4" stroke="#000" strokeWidth="6" />
      <circle cx="210" cy="150" r="84" fill="url(#ggvIris)" stroke="#000" strokeWidth="5" />
      <circle className="ggv-pupila" cx="210" cy="150" r="40" fill="#050505" />
      <circle cx="186" cy="124" r="14" fill="#fff" opacity=".9" />
      {/* sobrancelha brava */}
      <path d="M40 92 Q200 20 400 70 L400 40 Q200 -10 30 70 Z" fill="#0a0a0a" />
      {/* pálpebra (pisca) */}
      <rect className="ggv-palpebra" x="0" y="0" width="420" height="300" fill="#0a0a0a" />
    </svg>
  )
}

/** 🦅 silhueta de gavião em voo */
function Silhueta() {
  return (
    <svg viewBox="0 0 100 40" width="100%" height="100%">
      <path d="M50 22 C44 14 34 8 20 6 C12 5 5 8 0 12 C10 11 18 13 26 18 C34 22 42 24 46 26 L50 34 L54 26 C58 24 66 22 74 18 C82 13 90 11 100 12 C95 8 88 5 80 6 C66 8 56 14 50 22 Z" fill="#f4f4f4" stroke="#000" strokeWidth="1.5" />
    </svg>
  )
}

// 🪟 os cacos da tela: polígono (em % do palco) + pra onde cai (dx px, rotação)
const CACOS: [string, number, number][] = [
  ['0 0,38% 0,22% 30%,0 24%', -60, -40], ['38% 0,70% 0,52% 34%,22% 30%', -10, 25], ['70% 0,100% 0,100% 28%,52% 34%', 70, 50],
  ['0 24%,22% 30%,30% 58%,0 52%', -80, -30], ['22% 30%,52% 34%,48% 52%,30% 58%', 20, 60], ['52% 34%,100% 28%,100% 56%,48% 52%', 90, -35],
  ['0 52%,30% 58%,26% 82%,0 78%', -70, 45], ['30% 58%,48% 52%,62% 80%,26% 82%', -15, -55], ['48% 52%,100% 56%,100% 84%,62% 80%', 60, 30],
  ['0 78%,26% 82%,40% 100%,0 100%', -50, -20], ['26% 82%,62% 80%,70% 100%,40% 100%', 10, 40], ['62% 80%,100% 84%,100% 100%,70% 100%', 55, -45],
]
// o bando girando em volta do escudo: ângulo inicial, raio, tamanho
const BANDO: [number, number, number][] = [[0, 165, 104], [51, 180, 86], [103, 165, 98], [154, 185, 80], [206, 170, 94], [257, 182, 84], [309, 165, 100]]

const CSS = `
.ggv{position:fixed;inset:0;z-index:99990;pointer-events:none;overflow:hidden;animation:ggvVis ${T}ms ease forwards}
@keyframes ggvVis{0%{opacity:0}3%{opacity:1}95%{opacity:1}100%{opacity:0}}
.ggv-preto{position:absolute;inset:0;background:#000}
.ggv-palco{position:absolute;left:50%;top:50%;width:420px;height:760px;overflow:hidden}
/* 🏟️ o estádio que aparece por trás do vidro */
.ggv-est{position:absolute;inset:0;z-index:1;opacity:0;animation:ggvEst ${T}ms ease forwards;
  background:radial-gradient(ellipse at 50% 20%,rgba(255,255,255,.35),transparent 45%),linear-gradient(#2b2b2b,#0b0b0b 55%)}
@keyframes ggvEst{0%,${pct(2500)}{opacity:0}${pct(2600)}{opacity:1}100%{opacity:1}}
.ggv-arq{position:absolute;left:-20px;right:-20px;top:470px;height:300px;z-index:2;opacity:0;animation:ggvEst ${T}ms ease forwards;
  background:repeating-radial-gradient(circle at 8px 8px,#e9e9e9 0 3px,transparent 3.5px 16px),repeating-linear-gradient(0deg,#1d1d1d 0 22px,#111 22px 30px);background-size:16px 16px,100% 30px;filter:brightness(.7)}
/* 🏳️ o bandeirão listrado subindo da arquibancada */
.ggv-bandeirao{position:absolute;left:-30px;right:-30px;top:760px;height:330px;z-index:3;border-top:5px solid #000;
  background:repeating-linear-gradient(90deg,#0b0b0b 0 42px,#f4f4f4 42px 84px);animation:ggvBand ${T}ms cubic-bezier(.25,.9,.35,1) forwards}
@keyframes ggvBand{0%,${pct(2900)}{top:760px}${pct(3700)}{top:430px}${pct(3900)}{top:440px}100%{top:440px}}
.ggv-bandeirao::after{content:'';position:absolute;inset:0;background:linear-gradient(90deg,rgba(0,0,0,.25),transparent 30%,transparent 70%,rgba(0,0,0,.25));animation:ggvOnda 900ms ease-in-out infinite alternate}
@keyframes ggvOnda{from{transform:skewY(-1.2deg)}to{transform:skewY(1.2deg)}}
/* 👁️ o olho em close */
.ggv-olho{position:absolute;left:0;right:0;top:230px;height:300px;z-index:6;animation:ggvOlho ${T}ms ease forwards}
@keyframes ggvOlho{0%{opacity:1;transform:scale(1.15)}${pct(1300)}{opacity:1;transform:scale(1.25)}${pct(1550)}{opacity:0;transform:scale(2.4)}100%{opacity:0}}
.ggv-palpebra{animation:ggvPisca ${T}ms ease forwards;transform-origin:50% 0}
@keyframes ggvPisca{0%,${pct(150)}{transform:scaleY(1)}${pct(500)}{transform:scaleY(0)}${pct(850)}{transform:scaleY(0)}${pct(950)}{transform:scaleY(1)}${pct(1050)}{transform:scaleY(0)}100%{transform:scaleY(0)}}
.ggv-pupila{animation:ggvPup ${T}ms ease forwards;transform-origin:210px 150px}
@keyframes ggvPup{0%,${pct(1050)}{transform:scale(1)}${pct(1250)}{transform:scale(.45)}100%{transform:scale(.45)}}
/* 🦅 o Gavião vem na câmera */
.ggv-ataque{position:absolute;left:50%;top:50%;z-index:7;width:${MW}px;height:${MH}px;margin:-${MH / 2}px 0 0 -${MW / 2}px;opacity:0;animation:ggvAtaque ${T}ms cubic-bezier(.6,.05,.9,.5) forwards}
@keyframes ggvAtaque{0%,${pct(1400)}{opacity:0;transform:scale(.15) rotate(-8deg);filter:blur(0)}${pct(1550)}{opacity:1}${pct(2450)}{opacity:1;transform:scale(5.5) rotate(4deg);filter:blur(3px)}${pct(2550)}{opacity:0;transform:scale(6)}100%{opacity:0}}
.ggv-ataque img{width:100%;height:100%;display:block;filter:drop-shadow(0 0 20px rgba(255,255,255,.6))}
/* 💥 o impacto + a tela estilhaçando */
.ggv-flash{position:absolute;inset:0;z-index:9;background:#fff;opacity:0;animation:ggvFlash ${T}ms linear forwards}
@keyframes ggvFlash{0%,${pct(2450)}{opacity:0}${pct(2500)}{opacity:1}${pct(2750)}{opacity:0}${pct(5200)}{opacity:0}${pct(5250)}{opacity:.7}${pct(5450)}{opacity:0}100%{opacity:0}}
.ggv-caco{position:absolute;inset:0;z-index:8;opacity:0;background:linear-gradient(135deg,rgba(255,255,255,.85),rgba(160,160,160,.55) 40%,rgba(40,40,40,.85));border:2px solid #fff}
@keyframes ggvCaco{0%{opacity:1;transform:translate(0,0) rotate(0)}100%{opacity:0;transform:translate(var(--dx),620px) rotate(var(--r))}}
.ggv-trinca{position:absolute;inset:0;z-index:8;opacity:0;animation:ggvTrinca ${T}ms linear forwards}
@keyframes ggvTrinca{0%,${pct(2480)}{opacity:0}${pct(2520)}{opacity:1}${pct(2700)}{opacity:0}100%{opacity:0}}
/* 🛡️ o escudo acende no meio, o bando gira em volta */
.ggv-aura{position:absolute;left:50%;top:150px;width:380px;height:380px;margin-left:-190px;z-index:4;border-radius:50%;opacity:0;
  background:radial-gradient(circle,rgba(255,255,255,.55),rgba(255,196,0,.22) 45%,transparent 70%);animation:ggvAura ${T}ms ease forwards}
@keyframes ggvAura{0%,${pct(4300)}{opacity:0;transform:scale(.3)}${pct(5000)}{opacity:1;transform:scale(1.08)}${pct(5300)}{transform:scale(1)}100%{opacity:1}}
.ggv-esc{position:absolute;left:50%;top:230px;z-index:6;opacity:0;transform:translateX(-50%);animation:ggvEsc ${T}ms cubic-bezier(.2,1.4,.4,1) forwards}
@keyframes ggvEsc{0%,${pct(4600)}{opacity:0;transform:translateX(-50%) scale(.2)}${pct(5200)}{opacity:1;transform:translateX(-50%) scale(1.15)}${pct(5500)}{transform:translateX(-50%) scale(1)}100%{opacity:1;transform:translateX(-50%) scale(1)}}
.ggv-esc>span{display:inline-flex;filter:drop-shadow(5px 6px 0 rgba(0,0,0,.6)) drop-shadow(0 0 22px rgba(255,255,255,.6))}
.ggv-roda{position:absolute;left:210px;top:330px;width:0;height:0;z-index:5;opacity:0;animation:ggvRodaVis ${T}ms ease forwards}
@keyframes ggvRodaVis{0%,${pct(3800)}{opacity:0}${pct(4400)}{opacity:1}100%{opacity:1}}
.ggv-roda>div{position:absolute;left:0;top:0;width:0;height:0;animation:ggvGira 3200ms linear infinite}
@keyframes ggvGira{to{transform:rotate(360deg)}}
.ggv-ave{position:absolute;filter:drop-shadow(2px 3px 0 rgba(0,0,0,.6))}
.ggv-ave>span{display:block;width:100%;height:100%;animation:ggvBate 240ms ease-in-out infinite alternate}
@keyframes ggvBate{from{transform:scaleY(1)}to{transform:scaleY(.45)}}
/* 📟 letreiro de LED "TODO PODEROSO" */
.ggv-led{position:absolute;left:18px;right:18px;top:112px;z-index:7;background:#050505;border:3px solid #333;border-radius:10px;padding:6px 0;text-align:center;opacity:0;
  font:700 30px/1 Oswald,sans-serif;letter-spacing:.18em;color:#f4f4f4;text-shadow:0 0 8px #fff,0 0 18px rgba(255,255,255,.6);
  background-image:radial-gradient(rgba(255,255,255,.08) 1px,transparent 1.5px);background-size:5px 5px;animation:ggvLed ${T}ms steps(1) forwards}
@keyframes ggvLed{0%,${pct(5300)}{opacity:0}${pct(5400)}{opacity:1}${pct(5500)}{opacity:.2}${pct(5600)}{opacity:1}${pct(5700)}{opacity:.3}${pct(5800)}{opacity:1}100%{opacity:1}}
.ggv-faixa{position:absolute;left:24px;right:24px;top:612px;z-index:10;background:#0C0C0C;border:3px solid #f4f4f4;border-radius:16px;padding:8px;text-align:center;opacity:0;animation:ggvFaixa ${T}ms cubic-bezier(.2,1.3,.4,1) forwards}
@keyframes ggvFaixa{0%,${pct(5700)}{opacity:0;transform:scale(.4)}${pct(6100)}{opacity:1;transform:scale(1.06)}${pct(6300)}{transform:scale(1)}${pct(8100)}{opacity:1}100%{opacity:0}}
.ggv-faixa small{display:block;font:700 13px Oswald,sans-serif;letter-spacing:.22em;color:${GOLD}}
.ggv-faixa b{display:block;font:700 26px/1.05 Oswald,sans-serif;color:#fff;text-transform:uppercase;margin-top:2px}
.ggv-faixa em{display:block;font-style:normal;font:700 15px Oswald,sans-serif;color:#d9d9d9;margin-top:3px;letter-spacing:.06em}
@media (prefers-reduced-motion:reduce){.ggv-olho,.ggv-ataque,.ggv-flash,.ggv-caco,.ggv-trinca,.ggv-roda{display:none}.ggv-est,.ggv-aura,.ggv-esc,.ggv-faixa,.ggv-led{animation:none;opacity:1}.ggv-bandeirao{animation:none;top:440px}}
`

function useEscala() {
  const calc = () => Math.min(window.innerWidth / 420, window.innerHeight / 760)
  const [s, setS] = useState(calc)
  useEffect(() => { const f = () => setS(calc()); window.addEventListener('resize', f); return () => window.removeEventListener('resize', f) }, [])
  return s
}

export function GalaGavioes({ clube, chave, mostra, grito }: { clube: string; chave: string; mostra: string; grito: string }) {
  const s = useEscala()
  // 🔊 o CANTO dele (o mesmo da carreira) toca junto com a gala
  useEffect(() => playMp3Gala(`${import.meta.env.BASE_URL}sfx/torcida-gavioes-v1.mp3`, T), [chave])
  void grito
  return createPortal(
    <div key={chave} className="ggv" aria-hidden>
      <style>{CSS}</style>
      <div className="ggv-preto" />
      <div className="ggv-palco" style={{ transform: `translate(-50%,-50%) scale(${s})` }}>
        <div className="ggv-est" />
        <div className="ggv-arq" />
        <div className="ggv-bandeirao" />
        <div className="ggv-aura" />
        <div className="ggv-roda"><div>
          {BANDO.map(([a, r, w], i) => (
            <div key={i} className="ggv-ave" style={{ width: w, height: w * .4, left: Math.cos(a * Math.PI / 180) * r - w / 2, top: Math.sin(a * Math.PI / 180) * r * .62 - w * .2, transform: `rotate(${a + 90}deg)` }}><span><Silhueta /></span></div>
          ))}
        </div></div>
        <div className="ggv-esc"><span><Escudo nome={clube} size={160} /></span></div>
        <div className="ggv-led">{tr('TODO PODEROSO', 'ALL MIGHTY')}</div>
        <div className="ggv-olho"><Olho /></div>
        <div className="ggv-ataque"><img src={gavioesMascoteImg} alt="" /></div>
        {CACOS.map(([poly, dx, r], i) => (
          <span key={i} className="ggv-caco" style={{ clipPath: `polygon(${poly})`, ['--dx' as string]: `${dx}px`, ['--r' as string]: `${r}deg`, animation: `ggvCaco 1300ms cubic-bezier(.5,0,.9,.6) ${2500 + (i % 4) * 60}ms forwards` }} />
        ))}
        <svg className="ggv-trinca" viewBox="0 0 420 760" width="420" height="760">
          <path d="M210 380 L60 0 M210 380 L300 0 M210 380 L420 210 M210 380 L420 640 M210 380 L250 760 M210 380 L0 590 M210 380 L0 180" stroke="#fff" strokeWidth="4" fill="none" />
        </svg>
        <div className="ggv-faixa">
          <small>{tr('🦅 CHEGOU NA SALA', '🦅 JUST ARRIVED')}</small>
          <b>{mostra}</b>
          <em>⚫⚪ O BANDO DE LOUCOS CHEGOU ⚫⚪</em>
        </div>
        <div className="ggv-flash" />
      </div>
    </div>,
    document.body,
  )
}

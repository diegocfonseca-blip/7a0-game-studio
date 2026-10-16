// ─── 🦅⚫⚪ ENTRADA ÚNICA DO GAVIÕES SCCP: "O BANDO CHEGA VOANDO" ──────────────────────────────────────────────
//
// Pedido do Diego (16/10, o kauealves584 virou 🖋 Fundador): *"pense em algo voando o gavião e algo do Corinthians… porque
// é Gaviões da Fiel do Timão"*. Então, num estádio preto e branco de noite:
// 1) a arquibancada acende e as bandeiras LISTRADAS (preto e branco) tremulam
// 2) um BANDO de gaviões cruza o céu em silhueta
// 3) a fumaça preta e branca sobe dos dois lados (sinalizador de arquibancada)
// 4) o GAVIÃO do clube (mascote do batismo) MERGULHA lá de cima, abre as asas e solta penas
// 5) o ESCUDO do clube acende → "CHEGOU NA SALA · O BANDO DE LOUCOS CHEGOU"
// ⚠️ Nada de escudo, nome ou desenho oficial do Corinthians nem da torcida organizada: só as cores, o gavião do PRÓPRIO
// clube e frases de arquibancada. Mesmo esquema das outras galas únicas: palco 420×760 escalado, camada fixa sem clique,
// fora do reducer, sem localStorage; "reduzir movimento" = tudo parado no lugar.
// Som: o canto dele (`sfx/torcida-gavioes-v1.mp3`, 12 s do áudio que o Diego mandou — o mesmo da carreira).
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Escudo } from './escudos'
import { tr } from './lang'
import { playMp3Gala } from './sound'
import gavioesMascoteImg from './img/gavioes-mascote.webp'

export const GAVIOES_MS = 8000
const T = GAVIOES_MS
const pct = (ms: number) => (ms / T * 100).toFixed(1) + '%'
const GOLD = '#FFC400'
// a arte do Gavião é 224×440; no palco ele fica com 320 de altura
const MH = 320, MW = Math.round(MH * 224 / 440)

/** 🦅 silhueta de gavião em voo (asas abertas) */
function Silhueta() {
  return (
    <svg viewBox="0 0 100 40" width="100%" height="100%">
      <path d="M50 22 C44 14 34 8 20 6 C12 5 5 8 0 12 C10 11 18 13 26 18 C34 22 42 24 46 26 L50 34 L54 26 C58 24 66 22 74 18 C82 13 90 11 100 12 C95 8 88 5 80 6 C66 8 56 14 50 22 Z" fill="#0b0b0b" />
    </svg>
  )
}

// o bando: [topo, tamanho, atraso ms, duração ms]
const BANDO: [number, number, number, number][] = [[90, 120, 700, 2100], [160, 88, 850, 2300], [50, 76, 1000, 2000], [215, 100, 1150, 2200], [125, 64, 1300, 2400], [185, 72, 1450, 2100], [30, 94, 1600, 2300]]
// as penas que caem quando o Gavião abre as asas: [x, atraso, rotação]
const PENAS: [number, number, number][] = [[120, 4300, -30], [190, 4400, 20], [260, 4350, -10], [150, 4550, 40], [230, 4600, -45], [300, 4500, 15], [100, 4650, 30]]

const CSS = `
.ggv{position:fixed;inset:0;z-index:99990;pointer-events:none;overflow:hidden;animation:ggvVis ${T}ms ease forwards}
@keyframes ggvVis{0%{opacity:0}4%{opacity:1}94%{opacity:1}100%{opacity:0}}
.ggv-ceu{position:absolute;inset:0;background:radial-gradient(ellipse at 50% 18%,#3a3a3a,#141414 45%,#030303)}
.ggv-palco{position:absolute;left:50%;top:50%;width:420px;height:760px;overflow:hidden}
/* 💡 refletores */
.ggv-luz{position:absolute;top:-40px;width:170px;height:560px;z-index:1;opacity:0;background:linear-gradient(rgba(255,255,255,.5),rgba(255,255,255,0));clip-path:polygon(40% 0,60% 0,100% 100%,0 100%);animation:ggvLuz ${T}ms ease forwards}
@keyframes ggvLuz{0%,${pct(200)}{opacity:0}${pct(700)}{opacity:.8}${pct(3600)}{opacity:.55}100%{opacity:.4}}
/* 🏟️ a arquibancada (fileiras de torcida em preto e branco) */
.ggv-arq{position:absolute;left:-20px;right:-20px;top:430px;height:340px;z-index:2;
  background:repeating-radial-gradient(circle at 8px 8px,#e9e9e9 0 3px,transparent 3.5px 16px),repeating-linear-gradient(0deg,#1d1d1d 0 22px,#111 22px 30px);
  background-size:16px 16px,100% 30px;filter:brightness(.7);animation:ggvArq ${T}ms ease forwards}
@keyframes ggvArq{0%,${pct(200)}{filter:brightness(.25)}${pct(800)}{filter:brightness(.75)}100%{filter:brightness(.75)}}
/* 🏳️ as bandeiras listradas tremulando em cima da arquibancada */
.ggv-band{position:absolute;top:360px;width:62px;height:84px;z-index:3;transform-origin:left bottom;border:2px solid #000;
  background:repeating-linear-gradient(90deg,#0b0b0b 0 10px,#f4f4f4 10px 20px);animation:ggvBand 900ms ease-in-out infinite alternate}
.ggv-band::before{content:'';position:absolute;left:-6px;top:-6px;bottom:-60px;width:4px;background:#888}
@keyframes ggvBand{from{transform:skewY(-6deg) scaleX(.94)}to{transform:skewY(5deg) scaleX(1.04)}}
/* 🦅 o bando cruzando o céu */
.ggv-bando{position:absolute;left:-120px;z-index:4;opacity:.9;filter:drop-shadow(0 0 6px rgba(255,255,255,.25))}
@keyframes ggvVoa{0%{transform:translateX(0) translateY(0) rotate(-4deg)}50%{transform:translateX(330px) translateY(-24px) rotate(3deg)}100%{transform:translateX(680px) translateY(10px) rotate(-2deg)}}
@keyframes ggvBate{from{transform:scaleY(1)}to{transform:scaleY(.45)}}
.ggv-bando>span{display:block;width:100%;height:100%;animation:ggvBate 260ms ease-in-out infinite alternate}
/* 💨 fumaça preta e branca subindo dos dois lados */
.ggv-fum{position:absolute;bottom:250px;width:150px;height:280px;z-index:5;opacity:0;filter:blur(10px);border-radius:50%;animation:ggvFum ${T}ms ease forwards}
@keyframes ggvFum{0%,${pct(2300)}{opacity:0;transform:translateY(80px) scale(.5)}${pct(3200)}{opacity:.85;transform:translateY(0) scale(1)}${pct(6500)}{opacity:.7;transform:translateY(-60px) scale(1.25)}100%{opacity:.5;transform:translateY(-80px) scale(1.3)}}
/* 🦅 o Gavião mergulha lá de cima, abre as asas */
.ggv-gaviao{position:absolute;left:50%;top:-360px;z-index:7;margin-left:-${MW / 2}px;animation:ggvGaviao ${T}ms cubic-bezier(.3,.9,.3,1) forwards}
@keyframes ggvGaviao{0%,${pct(3500)}{top:-360px;transform:rotate(25deg) scale(.6)}${pct(4200)}{top:250px;transform:rotate(-6deg) scale(1.12)}${pct(4500)}{top:236px;transform:rotate(0) scale(1)}100%{top:240px;transform:scale(1)}}
.ggv-gaviao img{display:block;width:${MW}px;height:${MH}px;filter:drop-shadow(5px 7px 0 rgba(0,0,0,.6)) drop-shadow(0 0 16px rgba(255,255,255,.35))}
/* 💨 o vento do mergulho */
.ggv-vento{position:absolute;left:50%;top:0;width:6px;height:240px;z-index:6;opacity:0;background:linear-gradient(transparent,rgba(255,255,255,.8),transparent);animation:ggvVento ${T}ms linear forwards}
@keyframes ggvVento{0%,${pct(3500)}{opacity:0;transform:translateY(-200px)}${pct(3800)}{opacity:.9}${pct(4200)}{opacity:0;transform:translateY(300px)}100%{opacity:0}}
/* 🪶 penas */
.ggv-pena{position:absolute;top:300px;width:16px;height:34px;z-index:8;opacity:0;border-radius:50% 50% 50% 50%/80% 80% 20% 20%;background:linear-gradient(90deg,#f4f4f4 48%,#222 50%,#f4f4f4 52%);border:1px solid #000}
@keyframes ggvPena{0%{opacity:0;transform:translateY(0) rotate(0)}10%{opacity:1}100%{opacity:0;transform:translateY(300px) translateX(30px) rotate(220deg)}}
/* 🛡️ o escudo acende atrás do Gavião */
.ggv-aura{position:absolute;left:50%;top:110px;width:340px;height:340px;margin-left:-170px;z-index:5;border-radius:50%;opacity:0;
  background:radial-gradient(circle,rgba(255,255,255,.5),rgba(255,196,0,.25) 45%,transparent 70%);animation:ggvAura ${T}ms ease forwards}
@keyframes ggvAura{0%,${pct(4300)}{opacity:0;transform:scale(.3)}${pct(4900)}{opacity:1;transform:scale(1.1)}${pct(5200)}{transform:scale(1)}100%{opacity:1}}
.ggv-esc{position:absolute;left:50%;top:96px;z-index:6;opacity:0;transform:translateX(-50%);animation:ggvEsc ${T}ms cubic-bezier(.2,1.4,.4,1) forwards}
@keyframes ggvEsc{0%,${pct(4400)}{opacity:0;transform:translateX(-50%) scale(.2)}${pct(4900)}{opacity:1;transform:translateX(-50%) scale(1.12)}${pct(5200)}{transform:translateX(-50%) scale(1)}100%{opacity:1;transform:translateX(-50%) scale(1)}}
.ggv-esc>span{display:inline-flex;filter:drop-shadow(4px 5px 0 rgba(0,0,0,.6)) drop-shadow(0 0 18px rgba(255,255,255,.5))}
.ggv-flash{position:absolute;inset:0;z-index:9;background:#fff;opacity:0;animation:ggvFlash ${T}ms linear forwards}
@keyframes ggvFlash{0%,${pct(4150)}{opacity:0}${pct(4250)}{opacity:.85}${pct(4550)}{opacity:0}100%{opacity:0}}
.ggv-faixa{position:absolute;left:24px;right:24px;top:612px;z-index:10;background:#0C0C0C;border:3px solid #f4f4f4;border-radius:16px;padding:8px;text-align:center;opacity:0;animation:ggvFaixa ${T}ms cubic-bezier(.2,1.3,.4,1) forwards}
@keyframes ggvFaixa{0%,${pct(5400)}{opacity:0;transform:scale(.4)}${pct(5800)}{opacity:1;transform:scale(1.06)}${pct(6000)}{transform:scale(1)}${pct(7600)}{opacity:1}100%{opacity:0}}
.ggv-faixa small{display:block;font:700 13px Oswald,sans-serif;letter-spacing:.22em;color:${GOLD}}
.ggv-faixa b{display:block;font:700 26px/1.05 Oswald,sans-serif;color:#fff;text-transform:uppercase;margin-top:2px}
.ggv-faixa em{display:block;font-style:normal;font:700 15px Oswald,sans-serif;color:#d9d9d9;margin-top:3px;letter-spacing:.06em}
@media (prefers-reduced-motion:reduce){.ggv-bando,.ggv-vento,.ggv-pena,.ggv-flash,.ggv-fum,.ggv-band{display:none}.ggv-aura,.ggv-esc,.ggv-faixa,.ggv-luz{animation:none;opacity:1}.ggv-gaviao{animation:none;top:240px}}
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
      <div className="ggv-ceu" />
      <div className="ggv-palco" style={{ transform: `translate(-50%,-50%) scale(${s})` }}>
        <span className="ggv-luz" style={{ left: -30, transform: 'rotate(-12deg)' }} />
        <span className="ggv-luz" style={{ right: -30, transform: 'rotate(12deg)' }} />
        {BANDO.map(([top, w, d, dur], i) => (
          <div key={i} className="ggv-bando" style={{ top, width: w, height: w * .4, animation: `ggvVoa ${dur}ms ease-in-out ${d}ms forwards` }}><span><Silhueta /></span></div>
        ))}
        <div className="ggv-arq" />
        {[14, 96, 178, 260, 342].map((x, i) => <span key={x} className="ggv-band" style={{ left: x, animationDelay: `${i * 140}ms` }} />)}
        <span className="ggv-fum" style={{ left: -30, background: 'radial-gradient(circle,#2a2a2a,#0d0d0d 60%,transparent 72%)' }} />
        <span className="ggv-fum" style={{ right: -30, background: 'radial-gradient(circle,#ffffff,#cfcfcf 60%,transparent 72%)' }} />
        <div className="ggv-aura" />
        <div className="ggv-esc"><span><Escudo nome={clube} size={140} /></span></div>
        <span className="ggv-vento" style={{ marginLeft: -40 }} />
        <span className="ggv-vento" style={{ marginLeft: 36, animationDelay: '80ms' }} />
        <div className="ggv-gaviao"><img src={gavioesMascoteImg} alt="" /></div>
        {PENAS.map(([x, d, r], i) => (
          <span key={i} className="ggv-pena" style={{ left: x, transform: `rotate(${r}deg)`, animation: `ggvPena 2200ms ease-in ${d}ms forwards` }} />
        ))}
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

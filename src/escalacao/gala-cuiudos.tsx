// ─── 🤠🔵 ENTRADA ÚNICA DO CUIUDOS FC: "RODEIO DOS CUIUDOS" ───────────────────────────────────────────────────────
//
// Pedido do Diego (17/10, o matheussoaresg2018 é 🖋 Fundador): *"entrada de gala personalizada sem cartaz de política, mas
// algo que combine com a arte e faça sentido"* + *"som de torcida do Corinthians igual o do Gaviões SCCP"*.
// A arte do clube é o boiadeiro de chapéu e óculos, com caminhonetes, casa de fazenda e as bandeiras do Brasil. Então:
// 1) pôr do sol na fazenda, cerca de madeira, poeira
// 2) a PORTEIRA de madeira fecha a tela e abre
// 3) a CAMINHONETE entra levantando poeira e freia no meio
// 4) o CHAPÉU de vaqueiro sobe girando, o LAÇO gira e laça o escudo do clube, que acende
// 5) placa de madeira balançando "SÓ OS CUIUDOS" + fogos verde e amarelo + faixa "CHEGOU NA SALA"
// 🚫 A mascote NÃO entra (o cartaz dela tem um político; o Diego pediu a gala sem isso) — só o ESCUDO, que não tem.
// Mesmo esquema das outras galas únicas: palco 420×760 escalado, camada fixa sem clique, fora do reducer, sem localStorage.
// Som: o canto do Corinthians (`sfx/torcida-gavioes-v1.mp3`, o mesmo do Gaviões SCCP, também na carreira dele).
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Escudo } from './escudos'
import { tr } from './lang'
import { playMp3Gala } from './sound'

export const CUIUDOS_MS = 8600
const T = CUIUDOS_MS
const pct = (ms: number) => (ms / T * 100).toFixed(1) + '%'
const GOLD = '#FFC400', MADEIRA = '#7A4A22', MADEIRA2 = '#5B3416'
const fogo = (i: number) => ((i * 7919) % 997) / 997

const CSS = `
.gcu{position:fixed;inset:0;z-index:99990;pointer-events:none;overflow:hidden;animation:gcuVis ${T}ms ease forwards}
@keyframes gcuVis{0%{opacity:0}3%{opacity:1}95%{opacity:1}100%{opacity:0}}
.gcu-ceu{position:absolute;inset:0;background:linear-gradient(180deg,#0b2a6b 0%,#3a3f8f 30%,#e0702c 62%,#ffc04a 74%,#6b3b17 75%,#4a2a10 100%)}
.gcu-palco{position:absolute;left:50%;top:50%;width:420px;height:760px;overflow:hidden}
.gcu-sol{position:absolute;left:50%;top:420px;width:190px;height:190px;margin-left:-95px;border-radius:50%;background:radial-gradient(#fff3b0,#ffc400 55%,rgba(255,150,0,0) 72%);z-index:1}
.gcu-morro{position:absolute;left:-40px;right:-40px;top:500px;height:120px;z-index:2;background:#2b1a0c;clip-path:polygon(0 70%,12% 40%,26% 62%,40% 30%,56% 58%,70% 34%,86% 60%,100% 42%,100% 100%,0 100%)}
.gcu-chao{position:absolute;left:0;right:0;top:570px;bottom:0;z-index:3;background:linear-gradient(#8a5a2b,#5a3614)}
.gcu-cerca{position:absolute;left:0;right:0;top:536px;height:44px;z-index:4;background:
  repeating-linear-gradient(90deg,${MADEIRA2} 0 10px,transparent 10px 60px),
  linear-gradient(transparent 8px,${MADEIRA} 8px 16px,transparent 16px 26px,${MADEIRA} 26px 34px,transparent 34px)}
/* 🚪 a porteira fecha a tela e abre */
.gcu-port{position:absolute;top:0;bottom:0;width:50%;z-index:20;background:
  repeating-linear-gradient(0deg,${MADEIRA} 0 54px,${MADEIRA2} 54px 62px);border:6px solid ${MADEIRA2};box-sizing:border-box}
.gcu-port::after{content:'';position:absolute;inset:0;background:linear-gradient(35deg,transparent 47%,${MADEIRA2} 47% 53%,transparent 53%)}
.gcu-port.e{left:0;transform-origin:0 50%;animation:gcuPortE ${T}ms cubic-bezier(.5,0,.3,1) forwards}
.gcu-port.d{right:0;transform-origin:100% 50%;animation:gcuPortD ${T}ms cubic-bezier(.5,0,.3,1) forwards}
@keyframes gcuPortE{0%{transform:perspective(900px) rotateY(-88deg)}${pct(700)}{transform:perspective(900px) rotateY(0)}${pct(1400)}{transform:perspective(900px) rotateY(0)}${pct(2200)}{transform:perspective(900px) rotateY(-95deg)}100%{transform:perspective(900px) rotateY(-95deg)}}
@keyframes gcuPortD{0%{transform:perspective(900px) rotateY(88deg)}${pct(700)}{transform:perspective(900px) rotateY(0)}${pct(1400)}{transform:perspective(900px) rotateY(0)}${pct(2200)}{transform:perspective(900px) rotateY(95deg)}100%{transform:perspective(900px) rotateY(95deg)}}
.gcu-placa0{position:absolute;left:50%;top:300px;z-index:21;transform:translateX(-50%) rotate(-3deg);background:${MADEIRA};border:5px solid ${MADEIRA2};border-radius:10px;padding:8px 18px;
  font:700 30px/1 Oswald,sans-serif;color:${GOLD};letter-spacing:.06em;white-space:nowrap;text-shadow:3px 3px 0 #000;animation:gcuP0 ${T}ms ease forwards}
@keyframes gcuP0{0%,${pct(500)}{opacity:0}${pct(800)}{opacity:1}${pct(1400)}{opacity:1}${pct(1700)}{opacity:0}100%{opacity:0}}
/* 🛻 a caminhonete entra levantando poeira e freia */
.gcu-cam{position:absolute;top:440px;left:-220px;z-index:8;font-size:165px;line-height:1;animation:gcuCam ${T}ms cubic-bezier(.2,.8,.3,1) forwards}
.gcu-cam span{display:inline-block;transform:scaleX(-1);animation:gcuTreme 120ms linear infinite alternate}
@keyframes gcuCam{0%,${pct(2000)}{left:-220px}${pct(3200)}{left:130px}${pct(3400)}{left:112px}${pct(3600)}{left:120px}100%{left:120px}}
@keyframes gcuTreme{from{margin-top:0}to{margin-top:3px}}
.gcu-poe{position:absolute;top:560px;width:120px;height:70px;z-index:7;border-radius:50%;background:radial-gradient(#d9b98a,rgba(217,185,138,0) 70%);opacity:0;animation:gcuPoe ${T}ms ease-out forwards}
@keyframes gcuPoe{0%,${pct(2300)}{opacity:0;transform:scale(.4)}${pct(3300)}{opacity:.9}${pct(4600)}{opacity:0;transform:scale(2.2) translateY(-40px)}100%{opacity:0}}
/* 🤠 o chapéu sobe girando */
.gcu-chap{position:absolute;left:50%;top:430px;z-index:9;width:120px;height:70px;margin-left:-60px;opacity:0;animation:gcuChap ${T}ms cubic-bezier(.3,.9,.4,1) forwards}
/* chapéu de vaqueiro desenhado (o emoji 🤠 é uma CARA, não um chapéu): aba + copa + fita */
.gcu-chap i{position:absolute;left:0;right:0;bottom:6px;height:26px;border-radius:50%;background:radial-gradient(ellipse at 50% 30%,#f1dcae,#c9a46a 70%);border:3px solid #3b2410}
.gcu-chap b{position:absolute;left:30px;right:30px;bottom:22px;height:50px;border-radius:26px 26px 6px 6px;background:linear-gradient(90deg,#c9a46a,#f1dcae 45%,#c9a46a);border:3px solid #3b2410}
.gcu-chap b::after{content:'';position:absolute;left:-3px;right:-3px;bottom:6px;height:9px;background:#3b2410}
@keyframes gcuChap{0%,${pct(3600)}{opacity:0;transform:translateY(0) rotate(0)}${pct(3800)}{opacity:1}${pct(4600)}{transform:translateY(-330px) rotate(720deg)}${pct(5200)}{opacity:1;transform:translateY(-300px) rotate(720deg) scale(.9)}${pct(5500)}{opacity:0;transform:translateY(-300px) scale(.4)}100%{opacity:0}}
/* 🪢 o laço gira e laça o escudo */
.gcu-laco{position:absolute;left:50%;top:150px;width:250px;height:250px;margin-left:-125px;z-index:10;border-radius:50%;border:7px dashed #e7c98d;box-shadow:0 0 0 3px #6b4a24 inset;opacity:0;animation:gcuLaco ${T}ms ease forwards}
@keyframes gcuLaco{0%,${pct(4300)}{opacity:0;transform:scale(1.8) rotate(0)}${pct(4500)}{opacity:1}${pct(5300)}{transform:scale(1) rotate(540deg)}${pct(5600)}{transform:scale(.92) rotate(600deg);opacity:1}${pct(6000)}{opacity:0;transform:scale(.9) rotate(640deg)}100%{opacity:0}}
.gcu-esc{position:absolute;left:50%;top:160px;width:230px;height:230px;margin-left:-115px;z-index:11;display:flex;align-items:center;justify-content:center;opacity:0;
  filter:drop-shadow(0 0 24px rgba(255,196,0,.7)) drop-shadow(5px 6px 0 rgba(0,0,0,.55));animation:gcuEsc ${T}ms cubic-bezier(.2,1.3,.4,1) forwards}
@keyframes gcuEsc{0%,${pct(5200)}{opacity:0;transform:scale(.3)}${pct(5600)}{opacity:1;transform:scale(1.12)}${pct(5900)}{transform:scale(1)}100%{opacity:1;transform:scale(1)}}
.gcu-flash{position:absolute;inset:0;z-index:12;background:#fff3b0;opacity:0;animation:gcuFlash ${T}ms linear forwards}
@keyframes gcuFlash{0%,${pct(5250)}{opacity:0}${pct(5330)}{opacity:.7}${pct(5700)}{opacity:0}100%{opacity:0}}
/* 🪧 placa de madeira balançando */
.gcu-placa{position:absolute;left:50%;top:405px;z-index:13;transform-origin:50% -40px;opacity:0;animation:gcuPlaca ${T}ms ease forwards}
.gcu-placa::before,.gcu-placa::after{content:'';position:absolute;top:-40px;width:3px;height:42px;background:#3b2410}
.gcu-placa::before{left:22%}.gcu-placa::after{right:22%}
.gcu-placa b{display:block;transform:translateX(-50%);background:${MADEIRA};border:5px solid ${MADEIRA2};border-radius:10px;padding:6px 16px;
  font:700 27px/1 Oswald,sans-serif;color:${GOLD};letter-spacing:.05em;white-space:nowrap;text-shadow:3px 3px 0 #000;animation:gcuBalanca 900ms ease-in-out infinite alternate}
@keyframes gcuPlaca{0%,${pct(5700)}{opacity:0;transform:translateY(-60px)}${pct(6000)}{opacity:1;transform:translateY(0)}100%{opacity:1}}
@keyframes gcuBalanca{from{transform:translateX(-50%) rotate(-4deg)}to{transform:translateX(-50%) rotate(4deg)}}
/* 🎆 fogos verde e amarelo */
.gcu-fogo{position:absolute;width:11px;height:11px;box-shadow:0 0 8px currentColor;border-radius:50%;z-index:6;opacity:0;animation:gcuFogo 1100ms ease-out both}
@keyframes gcuFogo{0%{opacity:1;transform:translate(0,0) scale(.4)}100%{opacity:0;transform:translate(var(--dx),var(--dy)) scale(1)}}
.gcu-faixa{position:absolute;left:24px;right:24px;top:620px;z-index:14;background:#0C0C0C;border:3px solid ${GOLD};border-radius:16px;padding:8px;text-align:center;opacity:0;animation:gcuFaixa ${T}ms cubic-bezier(.2,1.3,.4,1) forwards}
@keyframes gcuFaixa{0%,${pct(6100)}{opacity:0;transform:scale(.4)}${pct(6450)}{opacity:1;transform:scale(1.06)}${pct(6650)}{transform:scale(1)}${pct(8100)}{opacity:1}100%{opacity:0}}
.gcu-faixa small{display:block;font:700 13px Oswald,sans-serif;letter-spacing:.22em;color:${GOLD}}
.gcu-faixa b{display:block;font:700 26px/1.05 Oswald,sans-serif;color:#fff;text-transform:uppercase;margin-top:2px}
.gcu-faixa em{display:block;font-style:normal;font:700 15px Oswald,sans-serif;color:#7CD992;margin-top:3px;letter-spacing:.12em}
@media (prefers-reduced-motion:reduce){.gcu-port,.gcu-placa0,.gcu-cam,.gcu-poe,.gcu-chap,.gcu-laco,.gcu-flash,.gcu-fogo{display:none}.gcu-esc,.gcu-placa,.gcu-faixa{animation:none;opacity:1}}
`

function useEscala() {
  const calc = () => Math.min(window.innerWidth / 420, window.innerHeight / 760)
  const [s, setS] = useState(calc)
  useEffect(() => { const f = () => setS(calc()); window.addEventListener('resize', f); return () => window.removeEventListener('resize', f) }, [])
  return s
}

// 3 rojões, 14 faíscas cada (posição e cor fixas: a gala é igual pra todos)
const FOGOS = [{ x: 90, y: 120, t: 6200 }, { x: 330, y: 90, t: 6600 }, { x: 210, y: 60, t: 7100 }]

export function GalaCuiudos({ clube, chave, mostra, grito }: { clube: string; chave: string; mostra: string; grito: string }) {
  const s = useEscala()
  // 🔊 o canto da torcida (o mesmo da carreira dele) toca junto com a gala
  useEffect(() => playMp3Gala(`${import.meta.env.BASE_URL}sfx/torcida-gavioes-v1.mp3`, T), [chave])
  void grito
  return createPortal(
    <div key={chave} className="gcu" aria-hidden>
      <style>{CSS}</style>
      <div className="gcu-ceu" />
      <div className="gcu-palco" style={{ transform: `translate(-50%,-50%) scale(${s})` }}>
        <div className="gcu-sol" />
        <div className="gcu-morro" />
        <div className="gcu-chao" />
        <div className="gcu-cerca" />
        {FOGOS.flatMap((f, k) => Array.from({ length: 14 }, (_, i) => {
          const a = (i / 14) * Math.PI * 2, r = 80 + fogo(i + k * 14) * 50
          return <span key={`${k}-${i}`} className="gcu-fogo" style={{ left: f.x, top: f.y, background: i % 2 ? GOLD : '#2ecc71', animationDelay: `${f.t}ms`, ['--dx' as string]: `${Math.cos(a) * r}px`, ['--dy' as string]: `${Math.sin(a) * r}px` }} />
        }))}
        <div className="gcu-poe" style={{ left: 40 }} />
        <div className="gcu-poe" style={{ left: 120 }} />
        <div className="gcu-cam"><span>🛻</span></div>
        <div className="gcu-chap"><b /><i /></div>
        <div className="gcu-laco" />
        <div className="gcu-esc"><Escudo nome={clube} size={220} /></div>
        <div className="gcu-placa"><b>⭐ SÓ OS CUIUDOS ⭐</b></div>
        <div className="gcu-faixa">
          <small>{tr('🤠 CHEGOU NA SALA', '🤠 JUST ARRIVED')}</small>
          <b>{mostra}</b>
          <em>💚💛 {tr('ABRE A PORTEIRA', 'OPEN THE GATE')} 💛💚</em>
        </div>
        <div className="gcu-flash" />
        <div className="gcu-port e" /><div className="gcu-port d" />
        <div className="gcu-placa0">🤠 CUIUDOS FC</div>
      </div>
    </div>,
    document.body,
  )
}

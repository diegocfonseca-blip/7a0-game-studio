// ─── 🍀7️⃣ ENTRADA ÚNICA DO SEVEN CITY: "JACKPOT DA SORTE" ─────────────────────────────────────────────────────────
//
// Pedido do Diego (17/10): *"vídeo de gala personalizado do Seven City… ele é supersticioso, 7 é o número da sorte, tem que ter
// trevos também, e canto da torcida, o mesmo do SCCP Gaviões"*. A arte do clube é o trevo de chapéu jogando moeda, em cima de
// uma pilha de moedas, e o lema do escudo é "SORTE TAMBÉM JOGA". Então, uma máquina de sorte:
// 1) fundo verde com luz dourada; uma MÁQUINA CAÇA-NÍQUEL dourada com letreiro de lâmpadas "SEVEN CITY"
// 2) as 3 roletas giram (trevo, moeda, bola, estrela, ferradura…) e param uma por uma: 7 · 7 · 7
// 3) JACKPOT! — clarão, chuva de MOEDAS e de TREVOS
// 4) o escudo sobe e SETE trevos acendem um a um em volta dele; o Trevo do clube pula jogando a moeda
// 5) faixa "CHEGOU NA SALA · SORTE TAMBÉM JOGA"
// Mesmo esquema das outras galas únicas: palco 420×760 escalado, camada fixa sem clique, fora do reducer, sem localStorage.
// Som: o canto da torcida (`sfx/torcida-gavioes-v1.mp3`, o mesmo do Gaviões SCCP).
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Escudo } from './escudos'
import { tr } from './lang'
import { playMp3Gala } from './sound'
import trevoImg from './img/sevencity-mascote.webp'

export const SEVEN_MS = 8600
const T = SEVEN_MS
const pct = (ms: number) => (ms / T * 100).toFixed(1) + '%'
const GOLD = '#FFC400', VERDE = '#0E5A2A'
const sorte = (i: number) => ((i * 7919) % 997) / 997 // espalhado e sempre igual (a gala é igual pra todos)

// as roletas: 16 símbolos, o último é o 7 (é onde cada uma para)
const SIMB = ['🍀', '🪙', '⚽', '⭐', '🍀', '🎩', '🪙', '⚽', '🍀', '⭐', '🪙', '🍀', '⚽', '🎩', '🍀', '7']
const CEL = 96 // altura de um símbolo na janela
const PARA = [2300, 2900, 3500] // quando cada roleta para (ms)
// a arte do Trevo é 303×440
const TH = 230, TW = Math.round(TH * 303 / 440)

const CSS = `
.gsv{position:fixed;inset:0;z-index:99990;pointer-events:none;overflow:hidden;animation:gsvVis ${T}ms ease forwards}
@keyframes gsvVis{0%{opacity:0}3%{opacity:1}95%{opacity:1}100%{opacity:0}}
.gsv-ceu{position:absolute;inset:0;background:radial-gradient(ellipse at 50% 30%,#1f8a45,#0b4a22 45%,#03200e)}
.gsv-palco{position:absolute;left:50%;top:50%;width:420px;height:760px;overflow:hidden}
.gsv-raios{position:absolute;left:50%;top:300px;width:1000px;height:1000px;margin:-500px 0 0 -500px;z-index:1;background:repeating-conic-gradient(from 0deg,rgba(255,196,0,.10) 0 10deg,transparent 10deg 24deg);animation:gsvGira 14s linear infinite}
@keyframes gsvGira{to{transform:rotate(360deg)}}
/* 🎰 a máquina */
.gsv-maq{position:absolute;left:40px;right:40px;top:150px;height:380px;z-index:5;border-radius:34px 34px 18px 18px;
  background:linear-gradient(180deg,#ffe27a,#d99a12 55%,#a8700a);border:5px solid #3b2a05;box-shadow:0 10px 0 #3b2a05,0 0 50px rgba(255,196,0,.45);animation:gsvMaq ${T}ms cubic-bezier(.4,0,.3,1) forwards}
@keyframes gsvMaq{0%{transform:translateY(520px)}${pct(700)}{transform:translateY(0)}${pct(4400)}{transform:translateY(0) scale(1);opacity:1}${pct(5000)}{transform:translateY(760px) scale(.9);opacity:0}100%{transform:translateY(760px);opacity:0}}
.gsv-letreiro{position:absolute;left:22px;right:22px;top:18px;height:62px;border-radius:14px;background:${VERDE};border:4px solid #3b2a05;display:flex;align-items:center;justify-content:center;
  font:700 28px/1 Oswald,sans-serif;color:${GOLD};letter-spacing:.06em;white-space:nowrap;text-shadow:0 0 10px rgba(255,196,0,.8),3px 3px 0 #000}
.gsv-letreiro::before{content:'';position:absolute;inset:4px;border-radius:9px;background-image:radial-gradient(#fff6c4 2px,transparent 2.6px);background-size:14px 14px;
  -webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;padding:4px;animation:gsvPisca 260ms steps(2) infinite}
@keyframes gsvPisca{50%{opacity:.35}}
.gsv-janela{position:absolute;left:22px;right:22px;top:104px;height:${CEL + 24}px;border-radius:14px;background:#2a1d03;border:4px solid #3b2a05;display:flex;gap:8px;padding:12px;box-sizing:border-box}
.gsv-rolo{flex:1;height:${CEL}px;overflow:hidden;border-radius:8px;background:linear-gradient(180deg,#d9d3c0,#fffaf0 30%,#fffaf0 70%,#d9d3c0);position:relative}
.gsv-fita{position:absolute;left:0;right:0;top:0}
.gsv-fita span{display:flex;align-items:center;justify-content:center;height:${CEL}px;font-size:54px;line-height:1}
.gsv-fita span.s7{font:700 78px/1 Oswald,sans-serif;color:#c0161b;text-shadow:3px 3px 0 #5a0608}
.gsv-alav{position:absolute;right:-30px;top:120px;width:16px;height:120px;border-radius:8px;background:#7a7a7a;border:3px solid #333;transform-origin:50% 100%;animation:gsvAlav ${T}ms ease forwards}
.gsv-alav::before{content:'';position:absolute;left:50%;top:-28px;width:34px;height:34px;margin-left:-17px;border-radius:50%;background:radial-gradient(circle at 35% 35%,#ff7a6a,#c0161b);border:3px solid #5a0608}
@keyframes gsvAlav{0%,${pct(900)}{transform:rotate(0)}${pct(1150)}{transform:rotate(55deg) scaleY(.75)}${pct(1450)}{transform:rotate(0)}100%{transform:rotate(0)}}
.gsv-base{position:absolute;left:22px;right:22px;top:250px;height:96px;border-radius:12px;background:${VERDE};border:4px solid #3b2a05;display:flex;align-items:center;justify-content:center;
  font:700 22px/1.1 Oswald,sans-serif;color:#fff6c4;letter-spacing:.14em;text-align:center}
/* 💥 JACKPOT */
.gsv-jack{position:absolute;left:0;right:0;top:28px;z-index:9;text-align:center;font:700 58px/1 Oswald,sans-serif;color:${GOLD};letter-spacing:.04em;
  text-shadow:0 0 18px rgba(255,196,0,.9),4px 4px 0 #3b2a05;opacity:0;animation:gsvJack ${T}ms cubic-bezier(.2,1.4,.4,1) forwards}
@keyframes gsvJack{0%,${pct(3650)}{opacity:0;transform:scale(.3) rotate(-8deg)}${pct(3900)}{opacity:1;transform:scale(1.15) rotate(-4deg)}${pct(4100)}{transform:scale(1) rotate(-4deg)}${pct(4700)}{opacity:1}${pct(5000)}{opacity:0;transform:scale(1.4) rotate(-4deg)}100%{opacity:0}}
.gsv-flash{position:absolute;inset:0;z-index:12;background:#fff6c4;opacity:0;animation:gsvFlash ${T}ms linear forwards}
@keyframes gsvFlash{0%,${pct(3600)}{opacity:0}${pct(3680)}{opacity:.75}${pct(4000)}{opacity:0}100%{opacity:0}}
/* 🪙🍀 a chuva */
.gsv-chuva{position:absolute;top:-60px;z-index:8;font-size:34px;line-height:1;opacity:0;animation:gsvCai 2600ms linear both}
@keyframes gsvCai{0%{opacity:1;transform:translateY(0) rotate(0)}100%{opacity:1;transform:translateY(880px) rotate(540deg)}}
/* 🛡️ o escudo e os SETE trevos */
.gsv-esc{position:absolute;left:50%;top:150px;width:240px;height:240px;margin-left:-120px;z-index:7;display:flex;align-items:center;justify-content:center;opacity:0;
  filter:drop-shadow(0 0 26px rgba(255,196,0,.7)) drop-shadow(5px 6px 0 rgba(0,0,0,.55));animation:gsvEsc ${T}ms cubic-bezier(.2,1.3,.4,1) forwards}
@keyframes gsvEsc{0%,${pct(4700)}{opacity:0;transform:scale(.2)}${pct(5150)}{opacity:1;transform:scale(1.12)}${pct(5400)}{transform:scale(1)}100%{opacity:1;transform:scale(1)}}
.gsv-trevo7{position:absolute;left:50%;top:270px;z-index:6;font-size:40px;line-height:1;margin:-20px 0 0 -20px;opacity:0;animation:gsvT7 600ms cubic-bezier(.2,1.5,.4,1) both}
@keyframes gsvT7{0%{opacity:0;transform:translate(0,0) scale(.2)}100%{opacity:1;transform:translate(var(--x),var(--y)) scale(1)}}
.gsv-trevo{position:absolute;left:-10px;top:420px;z-index:10;width:${TW}px;height:${TH}px;opacity:0;animation:gsvTrevo ${T}ms cubic-bezier(.3,1.4,.4,1) forwards}
@keyframes gsvTrevo{0%,${pct(5400)}{opacity:0;transform:translateY(160px)}${pct(5800)}{opacity:1;transform:translateY(-20px)}${pct(6000)}{transform:translateY(0)}100%{opacity:1;transform:translateY(0)}}
.gsv-trevo img{width:100%;height:100%;display:block;filter:drop-shadow(5px 7px 0 rgba(0,0,0,.5))}
.gsv-moeda{position:absolute;left:${TW - 40}px;top:430px;z-index:11;font-size:30px;opacity:0;animation:gsvMoeda ${T}ms ease-out forwards}
@keyframes gsvMoeda{0%,${pct(6000)}{opacity:0;transform:translateY(0) rotateY(0)}${pct(6100)}{opacity:1}${pct(6600)}{transform:translateY(-120px) rotateY(900deg)}${pct(7100)}{transform:translateY(0) rotateY(1800deg)}100%{opacity:1;transform:translateY(0) rotateY(1800deg)}}
.gsv-faixa{position:absolute;left:24px;right:24px;top:620px;z-index:14;background:#0C0C0C;border:3px solid ${GOLD};border-radius:16px;padding:8px;text-align:center;opacity:0;animation:gsvFaixa ${T}ms cubic-bezier(.2,1.3,.4,1) forwards}
@keyframes gsvFaixa{0%,${pct(6100)}{opacity:0;transform:scale(.4)}${pct(6450)}{opacity:1;transform:scale(1.06)}${pct(6650)}{transform:scale(1)}${pct(8100)}{opacity:1}100%{opacity:0}}
.gsv-faixa small{display:block;font:700 13px Oswald,sans-serif;letter-spacing:.22em;color:${GOLD}}
.gsv-faixa b{display:block;font:700 26px/1.05 Oswald,sans-serif;color:#fff;text-transform:uppercase;margin-top:2px}
.gsv-faixa em{display:block;font-style:normal;font:700 15px Oswald,sans-serif;color:#7CD992;margin-top:3px;letter-spacing:.12em}
@media (prefers-reduced-motion:reduce){.gsv-maq,.gsv-jack,.gsv-flash,.gsv-chuva,.gsv-raios,.gsv-moeda{display:none}.gsv-esc,.gsv-trevo,.gsv-faixa{animation:none;opacity:1}.gsv-trevo7{animation:none;opacity:1;transform:translate(var(--x),var(--y))}}
`

function useEscala() {
  const calc = () => Math.min(window.innerWidth / 420, window.innerHeight / 760)
  const [s, setS] = useState(calc)
  useEffect(() => { const f = () => setS(calc()); window.addEventListener('resize', f); return () => window.removeEventListener('resize', f) }, [])
  return s
}

// cada roleta: gira de 1000 ms até o seu PARA, e termina no 7 (o último da fita)
const keyRolo = (i: number) => `@keyframes gsvRolo${i}{0%,${pct(1000)}{transform:translateY(0)}${pct(PARA[i] - 120)}{transform:translateY(${-(SIMB.length - 1) * CEL - 14}px)}${pct(PARA[i])}{transform:translateY(${-(SIMB.length - 1) * CEL}px)}100%{transform:translateY(${-(SIMB.length - 1) * CEL}px)}}`

export function GalaSeven({ clube, chave, mostra, grito }: { clube: string; chave: string; mostra: string; grito: string }) {
  const s = useEscala()
  // 🔊 o canto da torcida (o mesmo do Gaviões SCCP) toca junto com a gala
  useEffect(() => playMp3Gala(`${import.meta.env.BASE_URL}sfx/torcida-gavioes-v1.mp3`, T), [chave])
  void grito
  return createPortal(
    <div key={chave} className="gsv" aria-hidden>
      <style>{CSS + [0, 1, 2].map(keyRolo).join('\n')}</style>
      <div className="gsv-ceu" />
      <div className="gsv-palco" style={{ transform: `translate(-50%,-50%) scale(${s})` }}>
        <div className="gsv-raios" />
        {/* 🎰 a máquina da sorte */}
        <div className="gsv-maq">
          <div className="gsv-letreiro">🍀 SEVEN CITY 🍀</div>
          <div className="gsv-janela">
            {[0, 1, 2].map(i => (
              <div key={i} className="gsv-rolo">
                <div className="gsv-fita" style={{ animation: `gsvRolo${i} ${T}ms cubic-bezier(.25,.1,.25,1) forwards` }}>
                  {SIMB.map((x, k) => <span key={k} className={x === '7' ? 's7' : undefined}>{x}</span>)}
                </div>
              </div>
            ))}
          </div>
          <div className="gsv-base">{tr('SORTE TAMBÉM JOGA', 'LUCK PLAYS TOO')}</div>
          <div className="gsv-alav" />
        </div>
        <div className="gsv-jack">7 7 7<br />JACKPOT!</div>
        {/* 🪙🍀 a chuva de moedas e trevos depois do jackpot */}
        {Array.from({ length: 28 }, (_, i) => (
          <span key={i} className="gsv-chuva" style={{ left: Math.round(sorte(i + 3) * 390), animationDelay: `${3700 + Math.round(sorte(i * 5 + 1) * 1600)}ms`, fontSize: 26 + Math.round(sorte(i + 11) * 18) }}>{i % 2 ? '🍀' : '🪙'}</span>
        ))}
        {/* 🛡️ o escudo e os SETE trevos acendendo um a um */}
        <div className="gsv-esc"><Escudo nome={clube} size={230} /></div>
        {Array.from({ length: 7 }, (_, i) => {
          const a = -Math.PI / 2 + (i / 7) * Math.PI * 2
          return <span key={i} className="gsv-trevo7" style={{ ['--x' as string]: `${Math.round(Math.cos(a) * 150)}px`, ['--y' as string]: `${Math.round(Math.sin(a) * 150)}px`, animationDelay: `${5200 + i * 130}ms` }}>🍀</span>
        })}
        <div className="gsv-trevo"><img src={trevoImg} alt="" /></div>
        <div className="gsv-moeda">🪙</div>
        <div className="gsv-faixa">
          <small>{tr('🍀 CHEGOU NA SALA', '🍀 JUST ARRIVED')}</small>
          <b>{mostra}</b>
          <em>7️⃣ {tr('SORTE TAMBÉM JOGA', 'LUCK PLAYS TOO')} 7️⃣</em>
        </div>
        <div className="gsv-flash" />
      </div>
    </div>,
    document.body,
  )
}

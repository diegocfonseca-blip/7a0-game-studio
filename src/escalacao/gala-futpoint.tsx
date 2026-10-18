// ─── 📍🔴 ENTRADA ÚNICA DO FUTPOINT FC: "O PONTINHO ENTRA AO VIVO" ─────────────────────────────────────────────────
//
// Pedido do Diego (18/10): *"coloque Futpoint agora como fundador… vídeo de entrada de gala… coloque coisas assim de lives,
// pois ele faz TikTok, YouTube e etc, ele é streamer do Leilão Legends"*. O mascote dele já segura o botão dourado de play.
// 1) a tela vira uma TRANSMISSÃO: moldura de live, 🔴 AO VIVO piscando e o contador de quem assiste subindo
// 2) entram YouTube e TikTok (18/10: sem Twitch nem Kick) e o Pontinho CHEGA GIGANTE e bate na tela: clarão, onda dourada e tremida
// 3) chat da live subindo pela lateral e corações flutuando; o escudo do Futpoint acende em dourado
// 4) faixa "CHEGOU NA SALA · Futpoint FC · LIVES TODO DIA 18H E 21H" e o sininho de notificação balançando
// Mesmo esquema das outras galas únicas: palco 420×760 escalado, camada fixa sem clique, fora do reducer, sem localStorage.
// Som (18/10, Diego: "tem que ser algo relacionado a som de lives"): trilha PRÓPRIA, sintetizada (sem música de ninguém) —
// riser de "a live vai começar", BOOM no impacto do Pontinho, batida de live, plim de cada mensagem do chat e o ding do sininho.
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Escudo } from './escudos'
import { tr } from './lang'
import { playMp3Gala } from './sound'
import pontinhoImg from './img/futpoint-mascote.webp' // 285×440, o Pontinho de boné com o play dourado

export const FUTPOINT_MS = 8200
const T = FUTPOINT_MS
const pct = (ms: number) => (ms / T * 100).toFixed(1) + '%'
const GOLD = '#D9A93F', RED = '#E5262B'
const sorte = (i: number) => ((i * 7919) % 997) / 997 // espalhado e sempre igual (a gala é igual pra todos)
const MH = 300, MW = Math.round(MH * 285 / 440)
const PLATAFORMAS: [string, string, string][] = [['▶', 'YouTube', '#FF0000'], ['♪', 'TikTok', '#111']] // 18/10 (Diego): só YouTube e TikTok
const CHAT: [string, string][] = [['joao_bola', '🔥🔥🔥'], ['mari.fut', 'CHEGOU O FUTPOINT!'], ['zé_lances', 'LENDA 👑'], ['kaka10', 'bora leilão!!'], ['tiaguin', 'dá lance nele 😂'], ['pedrão', '❤️❤️❤️'], ['lu_leilao', 'SALVE FUTPOINT']]

const CSS = `
.gfp{position:fixed;inset:0;z-index:99990;pointer-events:none;overflow:hidden;animation:gfpVis ${T}ms ease forwards}
@keyframes gfpVis{0%{opacity:0}3%{opacity:1}95%{opacity:1}100%{opacity:0}}
.gfp-ceu{position:absolute;inset:0;background:radial-gradient(ellipse at 50% 32%,#3b2c10,#15110a 48%,#050403)}
.gfp-palco{position:absolute;left:50%;top:50%;width:420px;height:760px;overflow:hidden}
.gfp-moldura{position:absolute;inset:14px;border:4px solid ${GOLD};border-radius:22px;z-index:2;box-shadow:inset 0 0 40px rgba(217,169,63,.25);opacity:0;animation:gfpMold ${T}ms ease forwards}
@keyframes gfpMold{0%{opacity:0;transform:scale(1.08)}${pct(500)}{opacity:1;transform:scale(1)}100%{opacity:1}}
.gfp-vivo{position:absolute;left:30px;top:30px;z-index:9;display:flex;align-items:center;gap:7px;background:${RED};color:#fff;font:700 18px Oswald,sans-serif;letter-spacing:.08em;padding:5px 12px;border-radius:9px;border:3px solid #000;box-shadow:3px 3px 0 #000;opacity:0;animation:gfpPop ${T}ms cubic-bezier(.2,1.5,.4,1) forwards}
.gfp-vivo i{width:11px;height:11px;border-radius:50%;background:#fff;animation:gfpPisca .8s steps(2) infinite}
@keyframes gfpPisca{50%{opacity:.2}}
@keyframes gfpPop{0%,${pct(350)}{opacity:0;transform:scale(.3)}${pct(650)}{opacity:1;transform:scale(1.1)}${pct(800)}{transform:scale(1)}100%{opacity:1;transform:scale(1)}}
.gfp-olho{position:absolute;right:30px;top:30px;z-index:9;background:rgba(0,0,0,.75);color:#fff;font:700 18px Oswald,sans-serif;padding:5px 12px;border-radius:9px;border:2px solid ${GOLD};opacity:0;animation:gfpPop ${T}ms cubic-bezier(.2,1.5,.4,1) forwards;font-variant-numeric:tabular-nums}
/* as plataformas */
.gfp-plat{position:absolute;top:90px;z-index:8;display:flex;align-items:center;gap:6px;font:700 15px Oswald,sans-serif;color:#fff;padding:6px 10px;border-radius:10px;border:3px solid #000;box-shadow:3px 3px 0 #000;opacity:0;animation:gfpPlat ${T}ms cubic-bezier(.2,1.4,.4,1) forwards}
.gfp-plat b{display:inline-flex;width:20px;height:20px;align-items:center;justify-content:center;border-radius:5px;background:#fff;color:#000;font-size:12px}
@keyframes gfpPlat{0%{opacity:0;transform:translateY(-40px) scale(.6)}8%{opacity:0}100%{opacity:1}}
/* o Pontinho */
.gfp-mascote{position:absolute;left:18px;top:300px;z-index:10;width:${MW}px;height:${MH}px;opacity:0;animation:gfpMasc ${T}ms cubic-bezier(.3,1.4,.4,1) forwards}
@keyframes gfpMasc{0%,${pct(950)}{opacity:0;transform:translate(110px,-130px) scale(4.6) rotate(-14deg);filter:blur(8px) brightness(2.2)}${pct(1100)}{opacity:.9;transform:translate(100px,-110px) scale(4.2) rotate(-12deg);filter:blur(3px) brightness(1.5)}${pct(1300)}{opacity:1;transform:translate(60px,-60px) scale(2.8) rotate(-8deg);filter:none}${pct(1600)}{opacity:1;transform:translate(0,12px) scale(.92) rotate(3deg);filter:none}${pct(1720)}{transform:translate(0,-10px) scale(1.06) rotate(-2deg)}${pct(1860)}{transform:translate(0,0) scale(1) rotate(0)}${pct(5000)}{opacity:1;transform:translate(0,0) scale(1)}${pct(5400)}{opacity:1;transform:translate(-30px,40px) scale(.8)}100%{opacity:1;transform:translate(-30px,40px) scale(.8)}}
/* 💥 o impacto do Pontinho: clarão, onda dourada e a tela tremendo */
.gfp-flash{position:absolute;inset:0;z-index:12;background:#fff4d6;opacity:0;animation:gfpFlash ${T}ms linear forwards}
@keyframes gfpFlash{0%,${pct(1560)}{opacity:0}${pct(1620)}{opacity:.85}${pct(1900)}{opacity:0}100%{opacity:0}}
.gfp-onda{position:absolute;left:${18 + MW / 2}px;top:${300 + MH - 30}px;width:40px;height:40px;margin:-20px 0 0 -20px;z-index:9;border-radius:50%;border:6px solid ${GOLD};opacity:0;animation:gfpOnda ${T}ms ease-out forwards}
@keyframes gfpOnda{0%,${pct(1580)}{opacity:0;transform:scale(.2)}${pct(1640)}{opacity:1;transform:scale(1)}${pct(2300)}{opacity:0;transform:scale(9)}100%{opacity:0;transform:scale(9)}}
.gfp-treme{position:absolute;inset:0;animation:gfpTreme ${T}ms linear forwards}
@keyframes gfpTreme{0%,${pct(1590)}{transform:none}${pct(1640)}{transform:translate(-9px,6px)}${pct(1690)}{transform:translate(8px,-7px)}${pct(1740)}{transform:translate(-6px,-4px)}${pct(1790)}{transform:translate(5px,5px)}${pct(1850)}{transform:translate(-2px,1px)}${pct(1900)}{transform:none}100%{transform:none}}
.gfp-mascote img{width:100%;height:100%;display:block;filter:drop-shadow(5px 7px 0 rgba(0,0,0,.55))}
/* o chat subindo */
.gfp-chat{position:absolute;right:26px;width:200px;top:560px;z-index:9;background:rgba(0,0,0,.72);border:2px solid rgba(217,169,63,.7);border-radius:10px;padding:5px 9px;font:13px/1.25 Arial,sans-serif;color:#fff;opacity:0;animation:gfpChat 2600ms ease-out both}
.gfp-chat b{color:${GOLD};font-weight:700;margin-right:5px}
@keyframes gfpChat{0%{opacity:0;transform:translateY(40px)}12%{opacity:1;transform:translateY(0)}80%{opacity:1}100%{opacity:0;transform:translateY(-380px)}}
/* corações */
.gfp-cor{position:absolute;bottom:-40px;z-index:8;font-size:28px;opacity:0;animation:gfpCor 2400ms ease-out both}
@keyframes gfpCor{0%{opacity:0;transform:translateY(0) scale(.6)}15%{opacity:1}100%{opacity:0;transform:translate(var(--dx),-560px) scale(1.2)}}
/* o escudo */
.gfp-esc{position:absolute;left:50%;top:150px;width:240px;height:240px;margin-left:-120px;z-index:6;display:flex;align-items:center;justify-content:center;opacity:0;
  filter:drop-shadow(0 0 28px rgba(217,169,63,.8)) drop-shadow(5px 6px 0 rgba(0,0,0,.55));animation:gfpEsc ${T}ms cubic-bezier(.2,1.3,.4,1) forwards}
@keyframes gfpEsc{0%,${pct(4600)}{opacity:0;transform:scale(.2)}${pct(5050)}{opacity:1;transform:scale(1.12)}${pct(5300)}{transform:scale(1)}100%{opacity:1;transform:scale(1)}}
.gfp-raios{position:absolute;left:50%;top:270px;width:900px;height:900px;margin:-450px 0 0 -450px;z-index:1;background:repeating-conic-gradient(from 0deg,rgba(217,169,63,.12) 0 10deg,transparent 10deg 24deg);opacity:0;animation:gfpRaios ${T}ms linear forwards}
@keyframes gfpRaios{0%,${pct(4600)}{opacity:0;transform:rotate(0)}${pct(5000)}{opacity:1}100%{opacity:1;transform:rotate(60deg)}}
/* a faixa e o sininho */
.gfp-faixa{position:absolute;left:24px;right:24px;top:610px;z-index:14;background:#0C0C0C;border:3px solid ${GOLD};border-radius:16px;padding:8px 8px 9px;text-align:center;opacity:0;animation:gfpFaixa ${T}ms cubic-bezier(.2,1.3,.4,1) forwards}
@keyframes gfpFaixa{0%,${pct(5600)}{opacity:0;transform:scale(.4)}${pct(5950)}{opacity:1;transform:scale(1.06)}${pct(6150)}{transform:scale(1)}${pct(7800)}{opacity:1}100%{opacity:0}}
.gfp-faixa small{display:block;font:700 13px Oswald,sans-serif;letter-spacing:.22em;color:${GOLD}}
.gfp-faixa b{display:block;font:700 26px/1.05 Oswald,sans-serif;color:#fff;text-transform:uppercase;margin-top:2px}
.gfp-faixa em{display:inline-flex;align-items:center;gap:6px;font-style:normal;font:700 15px Oswald,sans-serif;color:#fff;background:${RED};border-radius:7px;padding:2px 9px;margin-top:5px;letter-spacing:.08em}
.gfp-sino{position:absolute;right:30px;top:548px;z-index:15;font-size:44px;opacity:0;transform-origin:50% 10%;animation:gfpSino ${T}ms ease forwards}
@keyframes gfpSino{0%,${pct(6000)}{opacity:0;transform:scale(.3)}${pct(6250)}{opacity:1;transform:scale(1.1) rotate(0)}${pct(6450)}{transform:rotate(22deg)}${pct(6650)}{transform:rotate(-20deg)}${pct(6850)}{transform:rotate(14deg)}${pct(7050)}{transform:rotate(-8deg)}${pct(7250)}{transform:rotate(0)}100%{opacity:1;transform:rotate(0)}}
@media (prefers-reduced-motion:reduce){.gfp-chat,.gfp-cor,.gfp-raios,.gfp-sino,.gfp-flash,.gfp-onda{display:none}.gfp-treme{animation:none}.gfp-esc,.gfp-mascote,.gfp-faixa,.gfp-vivo,.gfp-olho,.gfp-plat,.gfp-moldura{animation:none;opacity:1}}
`

function useEscala() {
  const calc = () => Math.min(window.innerWidth / 420, window.innerHeight / 760)
  const [s, setS] = useState(calc)
  useEffect(() => { const f = () => setS(calc()); window.addEventListener('resize', f); return () => window.removeEventListener('resize', f) }, [])
  return s
}

// 👁 o contador de quem assiste: sobe rápido de 1,2 mil até ~15 mil enquanto a live "enche"
function useAssistindo() {
  const [n, setN] = useState(1200)
  useEffect(() => {
    const ini = Date.now()
    const iv = setInterval(() => {
      const t = Math.min(1, (Date.now() - ini) / 5200)
      setN(Math.round(1200 + (15400 - 1200) * (1 - Math.pow(1 - t, 2))))
    }, 70)
    return () => clearInterval(iv)
  }, [])
  return n
}

export function GalaFutpoint({ clube, chave, mostra, grito }: { clube: string; chave: string; mostra: string; grito: string }) {
  const s = useEscala()
  const n = useAssistindo()
  // 🔊 a trilha de live dele (sincronizada com a gala: boom em 1,6 s, plim do chat, ding do sininho)
  useEffect(() => playMp3Gala(`${import.meta.env.BASE_URL}sfx/gala-futpoint-live-v1.mp3`, T), [chave])
  void grito
  const mil = (v: number) => v >= 1000 ? `${(v / 1000).toFixed(1).replace('.', ',')} mil` : String(v)
  return createPortal(
    <div key={chave} className="gfp" aria-hidden>
      <style>{CSS}</style>
      <div className="gfp-ceu" />
      <div className="gfp-palco" style={{ transform: `translate(-50%,-50%) scale(${s})` }}>
       <div className="gfp-treme">
        <div className="gfp-raios" />
        <div className="gfp-moldura" />
        <div className="gfp-vivo"><i />{tr('AO VIVO', 'LIVE')}</div>
        <div className="gfp-olho">👁 {mil(n)}</div>
        {PLATAFORMAS.map(([ic, nome, cor], i) => (
          <div key={nome} className="gfp-plat" style={{ left: 30 + i * 118, background: cor, color: '#fff', fontSize: 18, animationDelay: `${700 + i * 160}ms`, animationDuration: '700ms' }}><b>{ic}</b>{nome}</div>
        ))}
        <div className="gfp-esc"><Escudo nome={clube} size={230} /></div>
        <div className="gfp-onda" />
        <div className="gfp-mascote"><img src={pontinhoImg} alt="" /></div>
        {CHAT.map(([quem, msg], i) => (
          <div key={i} className="gfp-chat" style={{ animationDelay: `${2100 + i * 420}ms` }}><b>{quem}</b>{msg}</div>
        ))}
        {Array.from({ length: 16 }, (_, i) => (
          <span key={i} className="gfp-cor" style={{ left: 250 + Math.round(sorte(i + 2) * 140), ['--dx' as string]: `${Math.round((sorte(i * 3 + 1) - .5) * 120)}px`, animationDelay: `${2300 + Math.round(sorte(i * 7 + 2) * 3200)}ms` }}>{i % 3 === 0 ? '🔥' : i % 3 === 1 ? '❤️' : '💛'}</span>
        ))}
        <div className="gfp-sino">🔔</div>
        <div className="gfp-faixa">
          <small>{tr('📍 CHEGOU NA SALA', '📍 JUST ARRIVED')}</small>
          <b>{mostra}</b>
          <em>● {tr('LIVES TODO DIA · 18H E 21H', 'LIVE EVERY DAY · 6PM & 9PM')}</em>
        </div>
        <div className="gfp-flash" />
       </div>
      </div>
    </div>,
    document.body,
  )
}

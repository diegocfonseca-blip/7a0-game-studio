// ─── 😈🔴⚫ ENTRADA ÚNICA DO WEN MILAN B: "INFERNO RUBRO-NEGRO" ───────────────────────────────────────────────────
//
// Pedido do Diego (17/10, o dono é 🖋 Fundador): *"vídeo de entrada de gala personalizada algo q tenha língua também,
// lambendo e etc"*. A arte do clube é a diabinha de chifres e rabo de coração, de língua de fora, com listras vermelho e
// preto e o tridente dourado. Então:
// 1) listras rubro-negras entram e o FOGO sobe do chão
// 2) o TRIDENTE dourado cai e crava no chão (tremida + faísca)
// 3) ELA LAMBE A TELA: o rosto da Diabinha cola no vidro e lambe de baixo pra cima duas vezes ("SLURP!"), deixando o
//    rastro molhado brilhando e escorrendo (o Diego reprovou a língua solta: *"quero ela lambendo a tela"*)
// 4) o ESCUDO sobe das chamas (brilho passando) e a DIABINHA entra rebolando
// 5) faixa "CHEGOU NA SALA" + brasas vermelhas e douradas subindo
// Mesmo esquema das outras galas únicas: palco 420×760 escalado, camada fixa sem clique, fora do reducer, sem localStorage.
// Som: "Vai lá de coração", da torcida do São Paulo (o time de coração do dono), 11 s (`sfx/torcida-spfc-wen-v1.mp3`).
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Escudo } from './escudos'
import { tr } from './lang'
import { playMp3Gala } from './sound'
import mascoteImg from './img/wenmilan-mascote.webp'
import rostoImg from './img/wenmilan-rosto.webp' // só o rosto da Diabinha (recorte da arte do dono), pra lamber a tela

export const WENMILAN_MS = 8600
const T = WENMILAN_MS
const pct = (ms: number) => (ms / T * 100).toFixed(1) + '%'
const GOLD = '#FFC400', RED = '#DF1224', PRETO = '#180F0E'
const sorte = (i: number) => ((i * 7919) % 997) / 997

const CSS = `
.gwm{position:fixed;inset:0;z-index:99990;pointer-events:none;overflow:hidden;animation:gwmVis ${T}ms ease forwards}
@keyframes gwmVis{0%{opacity:0}3%{opacity:1}95%{opacity:1}100%{opacity:0}}
.gwm-fundo{position:absolute;inset:0;background:#070303}
.gwm-palco{position:absolute;left:50%;top:50%;width:420px;height:760px;overflow:hidden}
/* 🔴⚫ listras rubro-negras entrando */
.gwm-listras{position:absolute;inset:0;background:repeating-linear-gradient(90deg,${RED} 0 42px,${PRETO} 42px 84px);opacity:0;animation:gwmListras ${T}ms ease forwards}
@keyframes gwmListras{0%{opacity:0;transform:translateY(-100%)}${pct(700)}{opacity:.9;transform:translateY(0)}100%{opacity:.9}}
.gwm-escuro{position:absolute;inset:0;background:radial-gradient(ellipse at 50% 40%,rgba(0,0,0,.05),rgba(0,0,0,.75) 75%)}
/* 🔥 fogo subindo do chão */
.gwm-fogo{position:absolute;bottom:-30px;width:70px;height:150px;border-radius:50% 50% 45% 45% / 70% 70% 30% 30%;
  background:radial-gradient(ellipse at 50% 85%,#fff3b0 0%,${GOLD} 25%,#ff6a00 50%,${RED} 72%,rgba(223,18,36,0) 78%);
  transform-origin:50% 100%;opacity:0;animation:gwmFogoSobe ${T}ms ease forwards,gwmChama 380ms ease-in-out infinite alternate}
@keyframes gwmFogoSobe{0%,${pct(300)}{opacity:0}${pct(1100)}{opacity:.95}100%{opacity:.95}}
@keyframes gwmChama{from{transform:scaleY(.82) scaleX(1.05) skewX(-4deg)}to{transform:scaleY(1.12) scaleX(.94) skewX(4deg)}}
/* 🔱 o tridente cai e crava */
.gwm-tri{position:absolute;left:50%;top:0;width:90px;margin-left:-45px;z-index:6;font:900 0/0 a;opacity:0;animation:gwmTri ${T}ms cubic-bezier(.6,0,.9,.4) forwards}
.gwm-tri i{position:absolute;left:41px;top:60px;width:8px;height:300px;background:linear-gradient(90deg,#b8860b,${GOLD},#b8860b);border-radius:4px}
.gwm-tri b{position:absolute;left:5px;top:0;width:80px;height:80px;border:8px solid ${GOLD};border-top:none;border-radius:0 0 40px 40px;box-sizing:border-box}
.gwm-tri b::before{content:'';position:absolute;left:28px;top:-14px;width:8px;height:84px;background:${GOLD}}
.gwm-tri b::after{content:'';position:absolute;left:-12px;top:-16px;width:88px;height:18px;
  background:linear-gradient(135deg,transparent 45%,${GOLD} 45% 55%,transparent 55%) left/16px 18px no-repeat,
             linear-gradient(225deg,transparent 45%,${GOLD} 45% 55%,transparent 55%) right/16px 18px no-repeat}
@keyframes gwmTri{0%,${pct(1100)}{opacity:0;transform:translateY(-420px)}${pct(1150)}{opacity:1}${pct(1700)}{transform:translateY(300px)}${pct(1780)}{transform:translateY(292px)}${pct(1860)}{transform:translateY(300px)}${pct(3000)}{opacity:1;transform:translateY(300px)}${pct(3300)}{opacity:0;transform:translateY(300px)}100%{opacity:0}}
.gwm-treme{position:absolute;inset:0;animation:gwmTreme ${T}ms linear forwards}
@keyframes gwmTreme{0%,${pct(1690)}{transform:none}${pct(1730)}{transform:translate(-6px,4px)}${pct(1770)}{transform:translate(6px,-3px)}${pct(1810)}{transform:translate(-4px,2px)}${pct(1860)}{transform:none}100%{transform:none}}
.gwm-flash{position:absolute;inset:0;z-index:20;background:#fff3b0;opacity:0;animation:gwmFlash ${T}ms linear forwards}
@keyframes gwmFlash{0%,${pct(1690)}{opacity:0}${pct(1740)}{opacity:.75}${pct(2000)}{opacity:0}${pct(5150)}{opacity:0}${pct(5200)}{opacity:.55}${pct(5500)}{opacity:0}100%{opacity:0}}
/* 👅 ELA LAMBE A TELA: o rosto da Diabinha (recorte da arte do dono) cola no vidro e lambe de baixo pra cima, duas vezes,
   deixando o rastro molhado brilhando por cima de tudo (o rastro fica NO VIDRO, por isso tem z acima do rosto) */
.gwm-rosto{position:absolute;left:-6px;top:0;width:380px;z-index:15;opacity:0;transform-origin:50% 80%;
  -webkit-mask-image:linear-gradient(#000 78%,transparent 98%);mask-image:linear-gradient(#000 78%,transparent 98%);animation:gwmRosto ${T}ms cubic-bezier(.45,0,.35,1) forwards}
.gwm-rosto img{display:block;width:380px;height:auto;filter:drop-shadow(0 0 30px rgba(0,0,0,.6))}
@keyframes gwmRosto{0%,${pct(2200)}{opacity:0;transform:translate(0,760px)}${pct(2400)}{opacity:1;transform:translate(0,430px) scale(1.04,.97)}
  ${pct(3300)}{transform:translate(0,60px) rotate(-5deg) scale(1.04,.97)}${pct(3500)}{transform:translate(-80px,430px) rotate(3deg) scale(1.04,.97)}
  ${pct(4300)}{transform:translate(-80px,60px) rotate(-4deg) scale(1.04,.97)}${pct(4500)}{opacity:1;transform:translate(-80px,70px) scale(.97)}${pct(4750)}{opacity:0;transform:translate(-80px,-30px) scale(.8)}100%{opacity:0}}
.gwm-trilha{position:absolute;top:412px;width:64px;height:360px;z-index:16;transform-origin:50% 100%;transform:scaleY(0);border-radius:32px;
  background:linear-gradient(90deg,transparent,rgba(255,235,242,.45) 22%,rgba(255,255,255,.9) 48%,rgba(255,235,242,.5) 74%,transparent);
  box-shadow:0 0 14px rgba(255,255,255,.25);filter:blur(1.4px);-webkit-mask-image:linear-gradient(#000 0%,rgba(0,0,0,.7) 45%,transparent 100%);mask-image:linear-gradient(#000 0%,rgba(0,0,0,.7) 45%,transparent 100%)}
.gwm-trilha.um{left:218px;animation:gwmTrilha1 ${T}ms cubic-bezier(.45,0,.35,1) forwards}
.gwm-trilha.dois{left:138px;animation:gwmTrilha2 ${T}ms cubic-bezier(.45,0,.35,1) forwards}
@keyframes gwmTrilha1{0%,${pct(2400)}{transform:scaleY(0);opacity:.9}${pct(3300)}{transform:scaleY(1);opacity:.75}${pct(4500)}{opacity:.6}${pct(5100)}{transform:scaleY(1);opacity:0}100%{opacity:0}}
@keyframes gwmTrilha2{0%,${pct(3500)}{transform:scaleY(0);opacity:.9}${pct(4300)}{transform:scaleY(1);opacity:.75}${pct(4700)}{opacity:.6}${pct(5300)}{transform:scaleY(1);opacity:0}100%{opacity:0}}
.gwm-gota{position:absolute;width:14px;height:20px;z-index:16;border-radius:50% 50% 50% 50% / 60% 60% 40% 40%;background:radial-gradient(circle at 35% 35%,#fff,rgba(255,235,242,.6) 60%,rgba(255,235,242,.2));opacity:0;animation:gwmGota 1800ms ease-in both}
@keyframes gwmGota{0%{opacity:0;transform:translateY(0) scale(.6)}15%{opacity:.95;transform:translateY(0) scale(1)}100%{opacity:0;transform:translateY(150px) scaleY(1.3)}}
.gwm-slurp{position:absolute;left:150px;top:70px;z-index:17;font:700 64px/1 Oswald,sans-serif;color:#ff7096;-webkit-text-stroke:3px #0C0C0C;text-shadow:5px 5px 0 #0C0C0C;letter-spacing:.04em;opacity:0;animation:gwmSlurp ${T}ms cubic-bezier(.2,1.4,.4,1) forwards}
@keyframes gwmSlurp{0%,${pct(2900)}{opacity:0;transform:scale(.3) rotate(-14deg)}${pct(3150)}{opacity:1;transform:scale(1.1) rotate(-8deg)}${pct(3350)}{transform:scale(1) rotate(-8deg)}${pct(4100)}{opacity:1}${pct(4400)}{opacity:0}100%{opacity:0}}
/* 🛡️ o escudo sobe das chamas */
.gwm-esc{position:absolute;left:50%;top:110px;width:240px;height:240px;margin-left:-120px;z-index:10;display:flex;align-items:center;justify-content:center;opacity:0;
  filter:drop-shadow(0 0 26px rgba(255,90,40,.85)) drop-shadow(5px 6px 0 rgba(0,0,0,.6));animation:gwmEsc ${T}ms cubic-bezier(.2,1.25,.4,1) forwards}
@keyframes gwmEsc{0%,${pct(4300)}{opacity:0;transform:translateY(360px) scale(.6)}${pct(4500)}{opacity:1}${pct(5200)}{transform:translateY(-10px) scale(1.06)}${pct(5450)}{transform:translateY(0) scale(1)}100%{opacity:1;transform:translateY(0) scale(1)}}
.gwm-brilho{position:absolute;left:50%;top:110px;width:240px;height:240px;margin-left:-120px;z-index:11;overflow:hidden;opacity:0;animation:gwmBrOn ${T}ms linear forwards}
.gwm-brilho::after{content:'';position:absolute;top:-20%;bottom:-20%;width:60px;left:-80px;background:linear-gradient(90deg,transparent,rgba(255,255,255,.75),transparent);transform:skewX(-18deg);animation:gwmBr ${T}ms linear forwards}
@keyframes gwmBrOn{0%,${pct(6150)}{opacity:0}${pct(6200)}{opacity:1}${pct(6900)}{opacity:1}${pct(7000)}{opacity:0}100%{opacity:0}}
@keyframes gwmBr{0%,${pct(6200)}{left:-80px}${pct(6900)}{left:300px}100%{left:300px}}
/* 😈 a diabinha entra rebolando */
.gwm-masc{position:absolute;left:236px;top:368px;z-index:12;opacity:0;animation:gwmMasc ${T}ms cubic-bezier(.2,1.2,.4,1) forwards}
.gwm-masc img{display:block;height:290px;width:auto;filter:drop-shadow(4px 5px 0 rgba(0,0,0,.6));transform-origin:50% 100%;animation:gwmRebola 520ms ease-in-out infinite alternate}
@keyframes gwmMasc{0%,${pct(4700)}{opacity:0;transform:translateX(220px)}${pct(5200)}{opacity:1;transform:translateX(-10px)}${pct(5400)}{transform:translateX(0)}100%{opacity:1;transform:translateX(0)}}
@keyframes gwmRebola{from{transform:rotate(-3deg)}to{transform:rotate(3deg)}}
.gwm-cora{position:absolute;z-index:13;font-size:22px;opacity:0;animation:gwmCora 1600ms ease-out both}
@keyframes gwmCora{0%{opacity:0;transform:translateY(0) scale(.5)}20%{opacity:1}100%{opacity:0;transform:translateY(-140px) scale(1.1)}}
/* ✨ brasas subindo */
.gwm-brasa{position:absolute;bottom:0;width:7px;height:7px;border-radius:50%;z-index:9;opacity:0;box-shadow:0 0 8px currentColor;animation:gwmBrasa 2400ms linear infinite}
@keyframes gwmBrasa{0%{opacity:0;transform:translate(0,0)}15%{opacity:1}100%{opacity:0;transform:translate(var(--dx),-620px)}}
.gwm-faixa{position:absolute;left:20px;right:20px;top:670px;z-index:17;background:#0C0C0C;border:3px solid ${GOLD};border-radius:16px;padding:7px;text-align:center;opacity:0;animation:gwmFaixa ${T}ms cubic-bezier(.2,1.3,.4,1) forwards}
@keyframes gwmFaixa{0%,${pct(5900)}{opacity:0;transform:scale(.4)}${pct(6250)}{opacity:1;transform:scale(1.06)}${pct(6450)}{transform:scale(1)}${pct(8100)}{opacity:1}100%{opacity:0}}
.gwm-faixa small{display:block;font:700 13px Oswald,sans-serif;letter-spacing:.22em;color:${GOLD}}
.gwm-faixa b{display:block;font:700 26px/1.05 Oswald,sans-serif;color:#fff;text-transform:uppercase;margin-top:2px}
.gwm-faixa em{display:block;font-style:normal;font:700 14px Oswald,sans-serif;color:#ff6b6b;margin-top:3px;letter-spacing:.12em}
@media (prefers-reduced-motion:reduce){.gwm-fogo,.gwm-tri,.gwm-treme,.gwm-flash,.gwm-rosto,.gwm-trilha,.gwm-gota,.gwm-slurp,.gwm-brilho,.gwm-cora,.gwm-brasa{display:none}.gwm-listras,.gwm-esc,.gwm-masc,.gwm-faixa{animation:none;opacity:1}.gwm-masc img{animation:none}}
`

function useEscala() {
  const calc = () => Math.min(window.innerWidth / 420, window.innerHeight / 760)
  const [s, setS] = useState(calc)
  useEffect(() => { const f = () => setS(calc()); window.addEventListener('resize', f); return () => window.removeEventListener('resize', f) }, [])
  return s
}

// posições fixas (a gala é igual pra todos)
const CHAMAS = Array.from({ length: 9 }, (_, i) => ({ x: -20 + i * 52, h: 120 + sorte(i + 3) * 90, d: Math.round(sorte(i) * 300) }))
const BRASAS = Array.from({ length: 18 }, (_, i) => ({ x: 10 + sorte(i + 7) * 400, d: 600 + Math.round(sorte(i + 11) * 2400), dx: Math.round((sorte(i + 5) - 0.5) * 120) }))
// gotas escorrendo do rastro molhado
const GOTAS = [{ x: 243, y: 600, t: 3400 }, { x: 230, y: 470, t: 3900 }, { x: 163, y: 650, t: 4400 }, { x: 150, y: 480, t: 4500 }, { x: 240, y: 560, t: 4100 }]
const CORAS = [{ x: 260, y: 470, t: 5500 }, { x: 330, y: 430, t: 5900 }, { x: 290, y: 520, t: 6400 }, { x: 350, y: 500, t: 7000 }]

export function GalaWenMilan({ clube, chave, mostra, grito }: { clube: string; chave: string; mostra: string; grito: string }) {
  const s = useEscala()
  // 🔊 o canto da torcida toca junto com a gala
  useEffect(() => playMp3Gala(`${import.meta.env.BASE_URL}sfx/torcida-spfc-wen-v1.mp3`, T), [chave])
  void grito
  return createPortal(
    <div key={chave} className="gwm" aria-hidden>
      <style>{CSS}</style>
      <div className="gwm-fundo" />
      <div className="gwm-palco" style={{ transform: `translate(-50%,-50%) scale(${s})` }}>
        <div className="gwm-treme">
          <div className="gwm-listras" />
          <div className="gwm-escuro" />
          {BRASAS.map((b, i) => <span key={`b${i}`} className="gwm-brasa" style={{ left: b.x, color: i % 3 ? '#ff5a28' : GOLD, background: 'currentColor', animationDelay: `${b.d}ms`, ['--dx' as string]: `${b.dx}px` }} />)}
          <div className="gwm-esc"><Escudo nome={clube} size={230} /></div>
          <div className="gwm-brilho" />
          <div className="gwm-masc"><img src={mascoteImg} alt="" /></div>
          {CORAS.map((c, i) => <span key={`c${i}`} className="gwm-cora" style={{ left: c.x, top: c.y, animationDelay: `${c.t}ms` }}>{i % 2 ? '❤️' : '🔥'}</span>)}
          {CHAMAS.map((c, i) => <span key={`f${i}`} className="gwm-fogo" style={{ left: c.x, height: c.h, zIndex: i % 2 ? 8 : 5, animationDelay: `0ms,${c.d}ms` }} />)}
          <div className="gwm-tri"><b /><i /></div>
          <div className="gwm-rosto"><img src={rostoImg} alt="" /></div>
          <div className="gwm-trilha um" /><div className="gwm-trilha dois" />
          {GOTAS.map((g, i) => <span key={`g${i}`} className="gwm-gota" style={{ left: g.x, top: g.y, animationDelay: `${g.t}ms` }} />)}
          <div className="gwm-slurp">SLURP!</div>
          <div className="gwm-faixa">
            <small>{tr('😈 CHEGOU NA SALA', '😈 JUST ARRIVED')}</small>
            <b>{mostra}</b>
            <em>🔥 {tr('O INFERNO É RUBRO-NEGRO', 'HELL IS RED AND BLACK')} 🔥</em>
          </div>
        </div>
        <div className="gwm-flash" />
      </div>
    </div>,
    document.body,
  )
}

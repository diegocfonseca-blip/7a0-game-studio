// ─── 🦅⚡ ENTRADA ÚNICA DO FABULOUS EC: "OS GUERREIROS SE TRANSFORMAM E A TROVOADA TRAZ A ÁGUIA" ─────────────
//
// Pedido do dono (Fabão, koeppfabio, virou 🖋 Fundador em 15/10), nas palavras dele: *"entram dois Power Rangers, 1 de
// cada lado, 1 preto e 1 vermelho. Aí eles morfam… cai uns raios e escurece tipo trovoada. E aí aparece o meu mascote,
// meu time, a logo ali"*. Então:
// 1) entra um guerreiro PRETO pela esquerda e um VERMELHO pela direita (as cores do Fabulous) → pose
// 2) "morfam": giram, viram luz e somem num clarão
// 3) o céu fecha, cai raio e a tela pisca (trovoada)
// 4) o ESCUDO acende no meio e a ÁGUIA (mascote do batismo) sobe na frente dele → "CHEGOU NA SALA"
// ⚠️ Os guerreiros são NOSSOS (capacete com viseira + raio no peito, nas cores do clube): nada do uniforme, logo ou
// nome da marca "Power Rangers" — é marca registrada. Eles são desenhados em SVG pequeno (fica no pedaço da gala).
//
// Mesmo esquema das outras galas únicas (`gala-arruda.tsx`, `gala-k9.tsx`): palco 420×760 escalado pra tela,
// camada fixa `pointer-events:none`, fora do reducer, sem localStorage; "reduzir movimento" = tudo parado no lugar.
// Sem som próprio (ele não tem canto da torcida).
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Escudo } from './escudos'
import { tr } from './lang'
import fabulousMascoteImg from './img/fabulous-mascote.webp'

export const FABULOUS_MS = 7400
const T = FABULOUS_MS
const pct = (ms: number) => (ms / T * 100).toFixed(1) + '%'
const GOLD = '#FFC400', VERM = '#CE0E17', PRETO = '#161011'
// a arte da águia é 311×440; no palco ela fica com 290 de altura
const MH = 290, MW = Math.round(MH * 311 / 440)

/** 🥷 o guerreiro: capacete com viseira, raio no peito, cinto dourado — cor do traje por parâmetro */
function Guerreiro({ cor, claro }: { cor: string; claro: string }) {
  return (
    <svg viewBox="0 0 120 230" width="100%" height="100%">
      {/* pernas */}
      <path d="M44 132 L36 216 L54 216 L60 150 L66 216 L84 216 L76 132 Z" fill={cor} stroke="#000" strokeWidth="3" strokeLinejoin="round" />
      <rect x="32" y="210" width="24" height="12" rx="3" fill="#F4F4F4" stroke="#000" strokeWidth="3" />
      <rect x="64" y="210" width="24" height="12" rx="3" fill="#F4F4F4" stroke="#000" strokeWidth="3" />
      {/* braços em pose (punho fechado) */}
      <path d="M36 66 L14 104 L22 110 L44 80" fill={cor} stroke="#000" strokeWidth="3" strokeLinejoin="round" />
      <path d="M84 66 L106 104 L98 110 L76 80" fill={cor} stroke="#000" strokeWidth="3" strokeLinejoin="round" />
      <circle cx="17" cy="108" r="8" fill="#F4F4F4" stroke="#000" strokeWidth="3" />
      <circle cx="103" cy="108" r="8" fill="#F4F4F4" stroke="#000" strokeWidth="3" />
      {/* tronco */}
      <path d="M36 62 Q60 54 84 62 L80 134 L40 134 Z" fill={cor} stroke="#000" strokeWidth="3" strokeLinejoin="round" />
      <path d="M40 70 L80 70 L76 82 L44 82 Z" fill={claro} opacity=".55" />
      {/* ⚡ o raio no peito (marca deles na gala) */}
      <path d="M64 76 L50 102 L60 102 L54 122 L72 94 L62 94 L68 76 Z" fill={GOLD} stroke="#000" strokeWidth="2.5" strokeLinejoin="round" />
      {/* cinto */}
      <rect x="39" y="124" width="42" height="9" rx="2" fill={GOLD} stroke="#000" strokeWidth="2.5" />
      <circle cx="60" cy="128.5" r="5" fill="#F4F4F4" stroke="#000" strokeWidth="2" />
      {/* capacete + viseira */}
      <path d="M38 34 Q38 8 60 8 Q82 8 82 34 L82 50 Q60 62 38 50 Z" fill={cor} stroke="#000" strokeWidth="3" />
      <path d="M44 28 L76 28 L76 38 L64 50 L56 50 L44 38 Z" fill="#0b0b0b" stroke="#000" strokeWidth="2" />
      <path d="M48 31 L60 31 L56 36 L48 36 Z" fill="#fff" opacity=".35" />
      <path d="M50 12 Q60 9 70 12" fill="none" stroke={claro} strokeWidth="3" opacity=".7" />
    </svg>
  )
}

// ⚡ os raios: [x, rotação, atraso em ms, escala]
const RAIOS: [number, number, number, number][] = [[70, -8, 3050, 1], [300, 10, 3350, .9], [190, -3, 3700, 1.2], [360, -12, 4050, .8], [40, 6, 4250, .85]]

const CSS = `
.gfa{position:fixed;inset:0;z-index:99990;pointer-events:none;overflow:hidden;animation:gfaVis ${T}ms ease forwards}
@keyframes gfaVis{0%{opacity:0}4%{opacity:1}94%{opacity:1}100%{opacity:0}}
.gfa-ceu{position:absolute;inset:0;background:radial-gradient(ellipse at 30% 55%,rgba(255,255,255,.12),transparent 30%),radial-gradient(ellipse at 70% 55%,rgba(206,14,23,.28),transparent 30%),radial-gradient(ellipse at 50% 30%,#4a1418,#1a0709 55%,#050203);animation:gfaCeu ${T}ms ease forwards}
@keyframes gfaCeu{0%,${pct(2700)}{filter:brightness(1)}${pct(3000)}{filter:brightness(.35)}100%{filter:brightness(.55)}}
.gfa-palco{position:absolute;left:50%;top:50%;width:420px;height:760px;overflow:hidden}
/* ☁️ nuvens pesadas que descem quando vem a trovoada */
.gfa-nuvem{position:absolute;left:-60px;right:-60px;top:-40px;height:260px;z-index:2;opacity:0;
  background:radial-gradient(ellipse 120px 60px at 15% 60%,#16161c 60%,transparent 62%),radial-gradient(ellipse 150px 70px at 45% 45%,#121217 60%,transparent 62%),radial-gradient(ellipse 130px 64px at 78% 62%,#16161c 60%,transparent 62%),radial-gradient(ellipse 160px 60px at 60% 85%,#0f0f13 60%,transparent 62%),linear-gradient(#0c0c10,transparent);
  animation:gfaNuvem ${T}ms ease forwards}
@keyframes gfaNuvem{0%,${pct(2700)}{opacity:0;transform:translateY(-120px)}${pct(3200)}{opacity:1;transform:translateY(0)}100%{opacity:1;transform:translateY(0)}}
/* 🏟️ o chão da arena (piso com linhas) */
.gfa-chao{position:absolute;left:-40px;right:-40px;top:560px;height:240px;z-index:1;transform:perspective(500px) rotateX(55deg);transform-origin:top;
  background:repeating-linear-gradient(90deg,transparent 0 46px,rgba(255,196,0,.18) 46px 48px),repeating-linear-gradient(0deg,transparent 0 30px,rgba(255,196,0,.14) 30px 32px),linear-gradient(#2a0c0e,#0a0405)}
/* 🥷 os dois guerreiros entram, fazem pose e "morfam" (giram, viram luz, somem) */
.gfa-g{position:absolute;top:300px;width:160px;height:306px;z-index:4}
.gfa-g::after{content:'';position:absolute;left:10px;right:10px;bottom:-14px;height:26px;border-radius:50%;background:radial-gradient(rgba(255,220,120,.55),transparent 70%);z-index:-1}
.gfa-g svg{filter:drop-shadow(0 0 7px rgba(255,255,255,.55)) drop-shadow(4px 5px 0 rgba(0,0,0,.6))}
.gfa-g.e{left:22px;animation:gfaEsq ${T}ms cubic-bezier(.25,.9,.35,1) forwards}
.gfa-g.d{right:22px;animation:gfaDir ${T}ms cubic-bezier(.25,.9,.35,1) forwards}
@keyframes gfaEsq{0%,${pct(150)}{transform:translateX(-260px)}${pct(800)}{transform:translateX(0)}${pct(1600)}{transform:translateX(0) scale(1);filter:drop-shadow(4px 5px 0 rgba(0,0,0,.55)) brightness(1)}${pct(2200)}{transform:translateX(70px) rotateY(540deg) scale(.9);filter:brightness(4) drop-shadow(0 0 24px #fff)}${pct(2500)}{transform:translateX(90px) rotateY(720deg) scale(.2);opacity:0;filter:brightness(6)}100%{opacity:0}}
@keyframes gfaDir{0%,${pct(350)}{transform:translateX(260px)}${pct(1000)}{transform:translateX(0)}${pct(1600)}{transform:translateX(0) scale(1);filter:drop-shadow(4px 5px 0 rgba(0,0,0,.55)) brightness(1)}${pct(2200)}{transform:translateX(-70px) rotateY(-540deg) scale(.9);filter:brightness(4) drop-shadow(0 0 24px #fff)}${pct(2500)}{transform:translateX(-90px) rotateY(-720deg) scale(.2);opacity:0;filter:brightness(6)}100%{opacity:0}}
/* 🌀 a coluna de luz de cada um na hora do "morfar" */
.gfa-coluna{position:absolute;top:0;width:90px;height:760px;z-index:3;opacity:0;filter:blur(2px);animation:gfaColuna ${T}ms ease forwards}
@keyframes gfaColuna{0%,${pct(1700)}{opacity:0;transform:scaleX(.2)}${pct(2100)}{opacity:.95;transform:scaleX(1)}${pct(2600)}{opacity:0;transform:scaleX(.1)}100%{opacity:0}}
/* 💥 o clarão do "morfar" e o da trovoada */
.gfa-flash{position:absolute;inset:0;z-index:8;background:#fff;opacity:0;animation:gfaFlash ${T}ms linear forwards}
@keyframes gfaFlash{0%,${pct(2350)}{opacity:0}${pct(2450)}{opacity:.95}${pct(2700)}{opacity:0}${pct(3050)}{opacity:0}${pct(3100)}{opacity:.85}${pct(3200)}{opacity:0}${pct(3350)}{opacity:0}${pct(3400)}{opacity:.6}${pct(3480)}{opacity:0}${pct(3700)}{opacity:0}${pct(3760)}{opacity:.9}${pct(3900)}{opacity:0}${pct(4050)}{opacity:.5}${pct(4120)}{opacity:0}100%{opacity:0}}
/* ⚡ os raios */
.gfa-raio{position:absolute;top:60px;width:70px;height:470px;z-index:6;opacity:0;transform-origin:top;
  background:linear-gradient(#fff,#ffe98a 60%,rgba(255,233,138,0));
  clip-path:polygon(48% 0,62% 0,50% 30%,66% 30%,40% 62%,54% 62%,22% 100%,34% 60%,20% 60%,36% 28%,22% 28%);
  filter:drop-shadow(0 0 10px #fff) drop-shadow(0 0 22px #ffd84a)}
@keyframes gfaRaio{0%{opacity:0}2%{opacity:1}6%{opacity:.2}8%{opacity:1}14%{opacity:0}100%{opacity:0}}
/* 🛡️ o escudo acende no meio, a 🦅 águia sobe na frente */
.gfa-aura{position:absolute;left:50%;top:180px;width:360px;height:360px;margin-left:-180px;z-index:4;border-radius:50%;opacity:0;
  background:radial-gradient(circle,rgba(255,196,0,.55),rgba(206,14,23,.35) 45%,transparent 70%);animation:gfaAura ${T}ms ease forwards}
@keyframes gfaAura{0%,${pct(3800)}{opacity:0;transform:scale(.3)}${pct(4400)}{opacity:1;transform:scale(1.1)}${pct(4700)}{transform:scale(1)}100%{opacity:1;transform:scale(1)}}
.gfa-esc{position:absolute;left:50%;top:150px;z-index:5;opacity:0;transform:translateX(-50%);animation:gfaEsc ${T}ms cubic-bezier(.2,1.4,.4,1) forwards}
@keyframes gfaEsc{0%,${pct(3900)}{opacity:0;transform:translateX(-50%) scale(.2) rotate(-20deg)}${pct(4400)}{opacity:1;transform:translateX(-50%) scale(1.12) rotate(3deg)}${pct(4700)}{transform:translateX(-50%) scale(1) rotate(0)}100%{opacity:1;transform:translateX(-50%) scale(1)}}
.gfa-esc>span{display:inline-flex;filter:drop-shadow(4px 5px 0 rgba(0,0,0,.55)) drop-shadow(0 0 18px rgba(255,196,0,.6))}
.gfa-aguia{position:absolute;left:50%;top:640px;z-index:7;margin-left:-${MW / 2}px;animation:gfaAguia ${T}ms cubic-bezier(.3,.9,.35,1) forwards}
@keyframes gfaAguia{0%,${pct(4300)}{top:760px;transform:scale(.6)}${pct(5000)}{top:300px;transform:scale(1.08)}${pct(5250)}{top:316px;transform:scale(1)}100%{top:312px;transform:scale(1)}}
.gfa-aguia img{display:block;width:${MW}px;height:${MH}px;filter:drop-shadow(4px 6px 0 rgba(0,0,0,.5))}
.gfa-faixa{position:absolute;left:24px;right:24px;top:620px;z-index:9;background:#0C0C0C;border:3px solid ${GOLD};border-radius:16px;padding:8px;text-align:center;opacity:0;animation:gfaFaixa ${T}ms cubic-bezier(.2,1.3,.4,1) forwards}
@keyframes gfaFaixa{0%,${pct(5100)}{opacity:0;transform:scale(.4)}${pct(5500)}{opacity:1;transform:scale(1.06)}${pct(5700)}{transform:scale(1)}${pct(7000)}{opacity:1}100%{opacity:0}}
.gfa-faixa small{display:block;font:700 13px Oswald,sans-serif;letter-spacing:.22em;color:${GOLD}}
.gfa-faixa b{display:block;font:700 26px/1.05 Oswald,sans-serif;color:#fff;text-transform:uppercase;margin-top:2px}
.gfa-faixa em{display:block;font-style:normal;font:700 15px Oswald,sans-serif;color:#ff5a5a;margin-top:3px;letter-spacing:.06em}
@media (prefers-reduced-motion:reduce){.gfa-g,.gfa-coluna,.gfa-flash,.gfa-raio,.gfa-nuvem{display:none}.gfa-aura,.gfa-esc,.gfa-faixa{animation:none;opacity:1}.gfa-aguia{animation:none;top:312px}}
`

function useEscala() {
  const calc = () => Math.min(window.innerWidth / 420, window.innerHeight / 760)
  const [s, setS] = useState(calc)
  useEffect(() => { const f = () => setS(calc()); window.addEventListener('resize', f); return () => window.removeEventListener('resize', f) }, [])
  return s
}

export function GalaFabulous({ clube, chave, mostra, grito }: { clube: string; chave: string; mostra: string; grito: string }) {
  const s = useEscala()
  void grito
  return createPortal(
    <div key={chave} className="gfa" aria-hidden>
      <style>{CSS}</style>
      <div className="gfa-ceu" />
      <div className="gfa-palco" style={{ transform: `translate(-50%,-50%) scale(${s})` }}>
        <div className="gfa-chao" />
        <div className="gfa-nuvem" />
        <span className="gfa-coluna" style={{ left: 55, background: 'linear-gradient(90deg,transparent,#9a9a9a,#fff,#9a9a9a,transparent)' }} />
        <span className="gfa-coluna" style={{ right: 55, background: `linear-gradient(90deg,transparent,${VERM},#fff,${VERM},transparent)` }} />
        <div className="gfa-g e"><Guerreiro cor={PRETO} claro="#8a8a8a" /></div>
        <div className="gfa-g d"><Guerreiro cor={VERM} claro="#ff8a8a" /></div>
        {RAIOS.map(([x, r, d, k], i) => (
          <span key={i} className="gfa-raio" style={{ left: x, transform: `rotate(${r}deg) scale(${k})`, animation: `gfaRaio 2600ms linear ${d}ms forwards` }} />
        ))}
        <div className="gfa-aura" />
        <div className="gfa-esc"><span><Escudo nome={clube} size={150} /></span></div>
        <div className="gfa-aguia"><img src={fabulousMascoteImg} alt="" /></div>
        <div className="gfa-faixa">
          <small>{tr('⚡ CHEGOU NA SALA', '⚡ JUST ARRIVED')}</small>
          <b>{mostra}</b>
          <em>🦅 A FABULOSA BAIXOU NA TROVOADA 🦅</em>
        </div>
        <div className="gfa-flash" />
      </div>
    </div>,
    document.body,
  )
}

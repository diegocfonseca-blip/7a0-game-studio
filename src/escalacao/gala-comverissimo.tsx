// ─── 🎬 ENTRADA ÚNICA DO COMVERISSIMO FC: "O VÍDEO DO COMVERISSIMO" ───────────────────────────────────────────
//
// O dono (cesar.verissimo27, 🖋 Fundador desde 15/10) faz vídeo de conteúdo de futebol no Instagram. A 1ª ideia
// (celular gravando com REC e curtidas) o Diego recusou mostrando o perfil dele: *"olha aí como ele fica nos vídeos
// dele"*. Então a gala copia o FORMATO dos vídeos dele:
// 1) a parede de CAMISAS penduradas no varal de madeira (o cenário fixo dele)
// 2) ele (o Verissimo, caricatura do batismo) de boné virado, do peito pra cima, falando pra câmera
// 3) a "notícia" num quadro em cima, com a tarja azul do @comverissimo embaixo
// 4) a legenda grandona embaixo, branca com contorno preto e a palavra-chave em AMARELO (2 falas: o Diego
//    mandou tirar o "NA SEMANA PASSADA" do meio)
// 5) clarão → o quadro de cima vira o ESCUDO e entra a faixa "CHEGOU NA SALA"
// ⚠️ As camisas da parede são NOSSAS (só cor e listra, sem marca nem escudo de clube real).
//
// Mesmo esquema das outras galas únicas (`gala-fabulous.tsx`): palco 420×760 escalado pra tela, camada fixa
// `pointer-events:none`, fora do reducer, sem localStorage; "reduzir movimento" = tudo parado no lugar.
// Som: ainda sem canto (o Diego vai mandar) — quando chegar, entra `playMp3Gala` igual ao Fabulous.
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Escudo } from './escudos'
import { tr } from './lang'
import comverissimoMascoteImg from './img/comverissimo-mascote.webp'

export const COMVERISSIMO_MS = 7400
const T = COMVERISSIMO_MS
const pct = (ms: number) => (ms / T * 100).toFixed(1) + '%'
const GOLD = '#FFC400', VERDE = '#034727', AZUL_TAG = '#2D5BFF'
// a arte do Verissimo é 241×440; aqui ela fica GRANDE (busto): 700 de altura, cortada na cintura
const MH = 700, MW = Math.round(MH * 241 / 440)

/** 👕 uma camisa pendurada no cabide: cor, cor da gola/manga e listra opcional */
function Camisa({ cor, det, listra }: { cor: string; det: string; listra?: 'v' | 'h' }) {
  const id = `${cor}${det}${listra ?? ''}`.replace(/#/g, '')
  return (
    <svg viewBox="0 0 120 150" width="100%" height="100%">
      <defs>
        {listra === 'v' && <pattern id={`p${id}`} width="20" height="10" patternUnits="userSpaceOnUse"><rect width="10" height="10" fill={det} /></pattern>}
        {listra === 'h' && <pattern id={`p${id}`} width="10" height="22" patternUnits="userSpaceOnUse"><rect width="10" height="11" fill={det} /></pattern>}
      </defs>
      {/* cabide */}
      <path d="M60 2 Q66 2 66 8 Q66 12 60 14 L22 30 M60 14 L98 30" fill="none" stroke="#3a2a1a" strokeWidth="3" strokeLinecap="round" />
      <path d="M38 24 L22 30 L4 52 L18 64 L30 54 L30 148 L90 148 L90 54 L102 64 L116 52 L98 30 L82 24 Q60 40 38 24 Z" fill={cor} stroke="#000" strokeWidth="2.5" strokeLinejoin="round" />
      {listra && <path d="M38 24 L22 30 L4 52 L18 64 L30 54 L30 148 L90 148 L90 54 L102 64 L116 52 L98 30 L82 24 Q60 40 38 24 Z" fill={`url(#p${id})`} opacity=".9" />}
      <path d="M38 24 Q60 40 82 24" fill="none" stroke={det} strokeWidth="5" />
      <path d="M4 52 L18 64" stroke={det} strokeWidth="5" /><path d="M116 52 L102 64" stroke={det} strokeWidth="5" />
      <path d="M30 70 L90 70" stroke="rgba(0,0,0,.12)" strokeWidth="18" />
    </svg>
  )
}

// a parede: [x, y, largura, cor, detalhe, listra] — duas fileiras, a de trás meio escondida
const PAREDE: [number, number, number, string, string, ('v' | 'h' | undefined)][] = [
  [-40, 30, 170, '#1f3c88', '#f2f2f2', undefined], [110, 20, 170, '#c8102e', '#111', 'v'], [260, 30, 180, '#f5d300', '#0b5a2a', undefined],
  [-60, 300, 190, '#0e0e0e', '#f2f2f2', 'v'], [110, 290, 200, VERDE, '#f2f2f2', undefined], [290, 300, 190, '#7ec8f5', '#fff', 'v'],
]

// 📝 as legendas, uma de cada vez: [linha 1, palavra amarela, linha 2 (PT)] + [EN] + de / até
const LEGENDAS: { pt: [string, string, string]; en: [string, string, string]; de: number; ate: number }[] = [
  { pt: ['FALA,', 'GALERA!', ''], en: ['WHAT’S UP,', 'GUYS!', ''], de: 900, ate: 2700 },
  { pt: ['O', 'COMVERISSIMO', 'CHEGOU NA SALA'], en: ['', 'COMVERISSIMO', 'JUST ARRIVED'], de: 2700, ate: 4600 },
]

const CSS = `
.gcv{position:fixed;inset:0;z-index:99990;pointer-events:none;overflow:hidden;background:#3b2414;animation:gcvVis ${T}ms ease forwards}
@keyframes gcvVis{0%{opacity:0}4%{opacity:1}94%{opacity:1}100%{opacity:0}}
.gcv-palco{position:absolute;left:50%;top:50%;width:420px;height:760px;overflow:hidden}
/* 🪵 o fundo de madeira + a parede de camisas */
.gcv-fundo{position:absolute;inset:0;background:repeating-linear-gradient(90deg,#6b4226 0 38px,#5d381f 38px 40px),#6b4226}
.gcv-varal{position:absolute;left:-10px;right:-10px;height:12px;border-radius:6px;background:linear-gradient(#a8743f,#6e4523);border:2px solid #2a1a0d;z-index:1}
.gcv-cam{position:absolute;z-index:2;filter:drop-shadow(3px 4px 0 rgba(0,0,0,.35))}
.gcv-luzq{position:absolute;inset:0;z-index:3;background:radial-gradient(ellipse at 50% 70%,rgba(255,220,170,.25),transparent 55%),linear-gradient(rgba(0,0,0,.25),transparent 30%,transparent 70%,rgba(0,0,0,.45))}
/* 🧢 ele: do peito pra cima, falando (balança de leve) */
.gcv-mas{position:absolute;left:50%;top:300px;width:${MW}px;height:470px;margin-left:-${MW / 2}px;overflow:hidden;z-index:4;animation:gcvMas ${T}ms cubic-bezier(.3,1.2,.4,1) forwards}
@keyframes gcvMas{0%,${pct(200)}{transform:translateY(480px)}${pct(800)}{transform:translateY(-8px)}${pct(950)}{transform:translateY(0)}100%{transform:translateY(0)}}
.gcv-mas img{display:block;width:${MW}px;height:${MH}px;transform-origin:50% 30%;animation:gcvFala 520ms ease-in-out infinite alternate;filter:drop-shadow(0 6px 10px rgba(0,0,0,.45))}
@keyframes gcvFala{0%{transform:rotate(-1.4deg) translateY(0)}100%{transform:rotate(1.4deg) translateY(4px)}}
/* 📰 o quadro de cima (a "notícia") + a tarja azul */
.gcv-quadro{position:absolute;left:46px;right:46px;top:34px;height:250px;z-index:5;border:4px solid #0C0C0C;border-radius:14px;overflow:hidden;box-shadow:4px 4px 0 #000;opacity:0;
  animation:gcvQuadro ${T}ms cubic-bezier(.2,1.3,.4,1) forwards}
@keyframes gcvQuadro{0%,${pct(1500)}{opacity:0;transform:translateY(-40px) scale(.7)}${pct(1900)}{opacity:1;transform:translateY(0) scale(1.04)}${pct(2050)}{transform:scale(1)}100%{opacity:1;transform:scale(1)}}
.gcv-campo{position:absolute;inset:0;background:
  linear-gradient(rgba(0,0,0,0) 58%,rgba(0,0,0,.25)),
  repeating-linear-gradient(90deg,#2f8f3c 0 26px,#2a8236 26px 52px);}
.gcv-campo::before{content:'';position:absolute;left:0;right:0;top:0;height:46%;background:linear-gradient(#0b2f5c,#1d4f8a 60%,#c9ccd2 61%,#9aa2ad);opacity:.95}
.gcv-campo::after{content:'';position:absolute;left:50%;top:58%;width:110px;height:40px;margin-left:-55px;border:3px solid rgba(255,255,255,.75);border-radius:50%}
.gcv-noticia{position:absolute;left:0;right:0;top:12px;text-align:center;z-index:2;font:900 24px/1 Oswald,sans-serif;color:#fff;text-transform:uppercase;letter-spacing:.02em;
  text-shadow:2px 2px 0 #000,-1px -1px 0 #000,1px -1px 0 #000,-1px 1px 0 #000;animation:gcvSome ${T}ms ease forwards}
.gcv-escq{position:absolute;left:50%;top:44px;z-index:2;transform:translateX(-50%);filter:drop-shadow(3px 4px 0 rgba(0,0,0,.5));animation:gcvEscQ ${T}ms cubic-bezier(.2,1.4,.4,1) forwards}
@keyframes gcvEscQ{0%,${pct(1900)}{transform:translateX(-50%) scale(.3);opacity:0}${pct(2300)}{transform:translateX(-50%) scale(1.1);opacity:1}${pct(2450)}{transform:translateX(-50%) scale(1)}${pct(4600)}{transform:translateX(-50%) scale(1)}${pct(5000)}{transform:translateX(-50%) translateY(-28px) scale(1.25)}100%{transform:translateX(-50%) translateY(-28px) scale(1.25)}}
@keyframes gcvSome{0%,${pct(4600)}{opacity:1}${pct(4700)}{opacity:0}100%{opacity:0}}
.gcv-tag{position:absolute;left:50%;top:272px;z-index:6;transform:translateX(-50%);background:${AZUL_TAG};color:#fff;border-radius:999px;padding:3px 16px;font:700 16px system-ui,sans-serif;white-space:nowrap;opacity:0;
  box-shadow:0 0 0 3px #0C0C0C;animation:gcvTag ${T}ms ease forwards}
@keyframes gcvTag{0%,${pct(1900)}{opacity:0;transform:translateX(-50%) scaleX(.2)}${pct(2150)}{opacity:1;transform:translateX(-50%) scaleX(1)}100%{opacity:1;transform:translateX(-50%) scaleX(1)}}
/* 📝 a legenda dele: Oswald pesada, branca com contorno, palavra-chave amarela */
.gcv-leg{position:absolute;left:10px;right:10px;top:610px;z-index:7;text-align:center;opacity:0;font:900 38px/1 Oswald,sans-serif;color:#fff;text-transform:uppercase;letter-spacing:-.01em;
  -webkit-text-stroke:2px #000;paint-order:stroke fill;text-shadow:3px 3px 0 #000}
.gcv-leg em{font-style:normal;color:${GOLD}}
.gcv-leg small{display:block;font-size:30px;margin-top:2px}
@keyframes gcvLeg{0%{opacity:0;transform:scale(.6)}10%{opacity:1;transform:scale(1.08)}18%{transform:scale(1)}90%{opacity:1}100%{opacity:0}}
/* 📸 clarão do corte */
.gcv-flash{position:absolute;inset:0;z-index:10;background:#fff;opacity:0;animation:gcvFlash ${T}ms linear forwards}
@keyframes gcvFlash{0%,${pct(4600)}{opacity:0}${pct(4680)}{opacity:1}${pct(5000)}{opacity:0}100%{opacity:0}}
.gcv-faixa{position:absolute;left:24px;right:24px;top:612px;z-index:9;background:#0C0C0C;border:3px solid ${GOLD};border-radius:16px;padding:8px;text-align:center;opacity:0;box-shadow:4px 4px 0 #000;animation:gcvFaixa ${T}ms cubic-bezier(.2,1.3,.4,1) forwards}
@keyframes gcvFaixa{0%,${pct(4900)}{opacity:0;transform:scale(.4)}${pct(5300)}{opacity:1;transform:scale(1.06)}${pct(5500)}{transform:scale(1)}${pct(7000)}{opacity:1}100%{opacity:0}}
.gcv-faixa small{display:block;font:700 13px Oswald,sans-serif;letter-spacing:.22em;color:${GOLD}}
.gcv-faixa b{display:block;font:700 26px/1.05 Oswald,sans-serif;color:#fff;text-transform:uppercase;margin-top:2px}
.gcv-faixa em{display:block;font-style:normal;font:700 15px Oswald,sans-serif;color:#7fe3a4;margin-top:3px;letter-spacing:.06em}
@media (prefers-reduced-motion:reduce){.gcv-leg,.gcv-flash,.gcv-noticia{display:none}
  .gcv-mas,.gcv-mas img,.gcv-quadro,.gcv-escq,.gcv-tag,.gcv-faixa{animation:none;opacity:1}}
`

function useEscala() {
  const calc = () => Math.min(window.innerWidth / 420, window.innerHeight / 760)
  const [s, setS] = useState(calc)
  useEffect(() => { const f = () => setS(calc()); window.addEventListener('resize', f); return () => window.removeEventListener('resize', f) }, [])
  return s
}

export function GalaComverissimo({ clube, chave, mostra, grito }: { clube: string; chave: string; mostra: string; grito: string }) {
  const s = useEscala()
  void grito
  return createPortal(
    <div key={chave} className="gcv" aria-hidden>
      <style>{CSS}</style>
      <div className="gcv-palco" style={{ transform: `translate(-50%,-50%) scale(${s})` }}>
        <div className="gcv-fundo" />
        <div className="gcv-varal" style={{ top: 26 }} />
        <div className="gcv-varal" style={{ top: 296 }} />
        {PAREDE.map(([x, y, w, cor, det, l], i) => (
          <div key={i} className="gcv-cam" style={{ left: x, top: y, width: w, height: w * 1.25 }}><Camisa cor={cor} det={det} listra={l} /></div>
        ))}
        <div className="gcv-luzq" />
        <div className="gcv-mas"><img src={comverissimoMascoteImg} alt="" /></div>
        <div className="gcv-quadro">
          <div className="gcv-campo" />
          <div className="gcv-noticia">{tr('🚨 REFORÇO NA SALA', '🚨 NEW SIGNING')}</div>
          <div className="gcv-escq"><Escudo nome={clube} size={170} /></div>
        </div>
        <div className="gcv-tag">@comverissimo</div>
        {LEGENDAS.map(({ pt, en, de, ate }, i) => {
          const [a, b, c] = tr(pt.join('|'), en.join('|')).split('|')
          return (
            <div key={i} className="gcv-leg" style={{ animation: `gcvLeg ${ate - de}ms ease ${de}ms forwards` }}>
              {a && <>{a} </>}<em>{b}</em>{c && <small>{c}</small>}
            </div>
          )
        })}
        <div className="gcv-faixa">
          <small>{tr('🎬 CHEGOU NA SALA', '🎬 JUST ARRIVED')}</small>
          <b>{mostra}</b>
          <em>🧢 FUTEBOL E RESENHA 🧢</em>
        </div>
        <div className="gcv-flash" />
      </div>
    </div>,
    document.body,
  )
}

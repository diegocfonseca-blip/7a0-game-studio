// ─── 🚁 ENTRADA PERSONALIZADA DO NEYMARZETTI: desce de helicóptero pela corda ──
//
// Mockup aprovado em 28/09 (`scripts/mockup-entrada-helicoptero.mjs`) e publicado em 09/10 a pedido
// do Diego (*"publique do Neymarzetti de helicóptero também descendo ele"*). É a 1ª gala ÚNICA de um
// clube — o modelo do que o 🖋✨ Batismo Plus vende.
//
// O desenho foi feito num palco de celular (420×880). Aqui o palco inteiro é escalado pra caber na
// tela de quem vê (celular ou computador), então a cena é a MESMA do mockup em qualquer aparelho.
// Mesmas regras da gala padrão: camada fixa, `pointer-events:none`, fora do reducer, nada de
// localStorage; "reduzir movimento" = só o telão.
// O helicóptero é SVG desenhado (0 KB de arte nova); escudo e mascote são os do batismo.
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Escudo } from './escudos'
import { mascoteInteiraDoTime } from './mascotes'
import { MascoteMini } from './mascote-atravessa'
import { tr } from './lang'

export const HELI_MS = 8200
const T = HELI_MS
const pct = (ms: number) => (ms / T * 100).toFixed(1) + '%'
const GOLD = '#FFC400'

const HELI = <svg viewBox="0 0 300 140" width="300" height="140" xmlns="http://www.w3.org/2000/svg">
  <g className="ghl-rotor"><rect x="10" y="6" width="220" height="8" rx="4" fill="#1d1d1d" /></g>
  <rect x="114" y="12" width="12" height="18" rx="3" fill="#0C0C0C" />
  <path d="M170 58 L285 50 L288 62 L175 80 Z" fill="#0C0C0C" stroke={GOLD} strokeWidth="3" strokeLinejoin="round" />
  <path d="M270 50 L292 22 L298 26 L286 58 Z" fill="#0C0C0C" stroke={GOLD} strokeWidth="3" strokeLinejoin="round" />
  <g className="ghl-rotor-cauda"><rect x="289" y="10" width="7" height="44" rx="3" fill="#1d1d1d" /></g>
  <path d="M40 72 C40 44 70 28 110 28 L150 28 C178 28 190 46 190 66 L190 82 C190 98 176 108 158 108 L78 108 C54 108 40 94 40 72 Z" fill="#0C0C0C" stroke={GOLD} strokeWidth="4" />
  <path d="M44 74 C44 50 62 36 90 34 L100 34 L100 84 L48 84 C45 81 44 78 44 74 Z" fill="#8fd3ff" stroke="#0C0C0C" strokeWidth="3" />
  <path d="M58 48 C64 42 72 39 82 38" stroke="#fff" strokeWidth="4" strokeLinecap="round" fill="none" opacity=".8" />
  <text x="112" y="80" fontFamily="Oswald, sans-serif" fontWeight="700" fontSize="26" fill={GOLD}>NZ</text>
  <rect x="70" y="106" width="8" height="16" fill="#0C0C0C" /><rect x="150" y="106" width="8" height="16" fill="#0C0C0C" />
  <path d="M46 124 L176 124 C182 124 184 118 184 116" stroke="#0C0C0C" strokeWidth="7" strokeLinecap="round" fill="none" />
</svg>

const CSS = `
.ghl{position:fixed;inset:0;z-index:99990;pointer-events:none;overflow:hidden;animation:ghlVis ${T}ms ease forwards}
@keyframes ghlVis{0%{opacity:0}4%{opacity:1}93%{opacity:1}100%{opacity:0}}
.ghl-escuro{position:absolute;inset:0;background:radial-gradient(ellipse 70% 50% at 50% 55%,rgba(30,40,70,.55),rgba(0,0,0,.95) 75%)}
.ghl-palco{position:absolute;left:50%;top:50%;width:420px;height:760px}
.ghl-busca{position:absolute;left:50%;bottom:0;width:120px;height:900px;transform-origin:50% 100%;background:linear-gradient(0deg,rgba(255,240,190,0),rgba(255,240,190,.28));clip-path:polygon(40% 100%,60% 100%,100% 0,0 0);opacity:0;animation:ghlBusca ${T}ms ease-in-out forwards}
@keyframes ghlBusca{0%{opacity:0;transform:translateX(-50%) rotate(-35deg)}8%{opacity:1}22%{transform:translateX(-50%) rotate(25deg)}34%{transform:translateX(-50%) rotate(0deg)}80%{opacity:1;transform:translateX(-50%) rotate(0)}90%{opacity:0}}
.ghl-heli{position:absolute;top:60px;left:460px;animation:ghlHeli ${T}ms cubic-bezier(.4,0,.3,1) forwards}
@keyframes ghlHeli{0%{left:460px;top:40px;transform:rotate(-8deg)}
 ${pct(1800)}{left:80px;top:90px;transform:rotate(4deg)}
 ${pct(2300)}{left:80px;top:100px;transform:rotate(0)}
 ${pct(3000)}{top:94px}${pct(3700)}{top:102px}${pct(4400)}{top:96px}
 ${pct(5200)}{left:80px;top:98px;transform:rotate(0)}
 ${pct(6600)}{left:-320px;top:-40px;transform:rotate(-12deg)}100%{left:-320px;top:-40px}}
.ghl-rotor{transform-origin:120px 10px;animation:ghlGira .12s linear infinite}
@keyframes ghlGira{0%{transform:scaleX(1)}50%{transform:scaleX(.15)}100%{transform:scaleX(1)}}
.ghl-rotor-cauda{transform-origin:292px 32px;animation:ghlGira2 .1s linear infinite}
@keyframes ghlGira2{0%{transform:scaleY(1)}50%{transform:scaleY(.2)}100%{transform:scaleY(1)}}
.ghl-vento{position:absolute;left:0;right:0;bottom:24px;height:40px;opacity:0;background:radial-gradient(ellipse 45% 50% at 50% 50%,rgba(255,255,255,.35),transparent 70%);animation:ghlVento ${T}ms ease forwards}
@keyframes ghlVento{0%,${pct(2200)}{opacity:0}${pct(2600)}{opacity:1}${pct(5200)}{opacity:1}${pct(5800)}{opacity:0}}
.ghl-corda{position:absolute;left:192px;top:210px;width:4px;height:0;background:#0C0C0C;border-left:1px solid ${GOLD};animation:ghlCorda ${T}ms ease forwards}
@keyframes ghlCorda{0%,${pct(2400)}{height:0}${pct(2900)}{height:300px}${pct(4300)}{height:300px}${pct(5000)}{height:0}100%{height:0}}
.ghl-masc{position:absolute;left:118px;top:120px;opacity:0;filter:drop-shadow(4px 6px 0 rgba(0,0,0,.5));animation:ghlMasc ${T}ms ease-in-out forwards}
@keyframes ghlMasc{0%,${pct(2800)}{opacity:0;top:140px}
 ${pct(2900)}{opacity:1;top:150px;transform:rotate(-4deg)}
 ${pct(4100)}{top:470px;transform:rotate(3deg)}
 ${pct(4300)}{top:490px;transform:scale(1.06,.94)}
 ${pct(4500)}{top:486px;transform:scale(1)}
 ${pct(5300)}{transform:rotate(-5deg)}${pct(5700)}{transform:rotate(5deg)}${pct(6100)}{transform:rotate(0)}
 ${pct(8000)}{opacity:1;top:486px}100%{opacity:0;top:486px}}
.ghl-telao{position:absolute;left:50%;top:40px;width:380px;text-align:center;opacity:0;transform:translateX(-50%) scale(.3);animation:ghlTelao ${T}ms cubic-bezier(.2,1.3,.4,1) forwards}
@keyframes ghlTelao{0%,${pct(4400)}{opacity:0;transform:translateX(-50%) scale(.3)}${pct(5000)}{opacity:1;transform:translateX(-50%) scale(1.08)}${pct(5300)}{transform:translateX(-50%) scale(1)}${pct(7700)}{opacity:1;transform:translateX(-50%) scale(1)}100%{opacity:0;transform:translateX(-50%) scale(1)}}
.ghl-telao .esc{display:inline-flex;filter:drop-shadow(0 0 22px rgba(255,196,0,.8)) drop-shadow(4px 5px 0 #000)}
.ghl-chega{font:700 15px Oswald,sans-serif;letter-spacing:3px;color:${GOLD};margin:4px 0 0}
.ghl-nome{font:700 40px/1 Oswald,sans-serif;color:#fff;text-transform:uppercase;margin:6px 0 0;text-shadow:3px 3px 0 #000}
.ghl-grito{position:absolute;left:0;right:0;top:405px;text-align:center;font:700 26px Oswald,sans-serif;color:${GOLD};text-shadow:2px 2px 0 #000;opacity:0;animation:ghlGrito ${T}ms ease forwards}
@keyframes ghlGrito{0%,${pct(4600)}{opacity:0;transform:scale(.6)}${pct(5000)}{opacity:1;transform:scale(1.15)}${pct(5300)}{transform:scale(1)}${pct(7500)}{opacity:1}${pct(7900)}{opacity:0}}
.ghl-flash{position:absolute;width:6px;height:6px;border-radius:50%;background:#fff;box-shadow:0 0 14px 7px #fff;opacity:0;animation:ghlFlash ${T}ms linear forwards}
@keyframes ghlFlash{0%,${pct(4400)}{opacity:0}${pct(4450)}{opacity:1}${pct(4550)}{opacity:0}${pct(5500)}{opacity:0}${pct(5550)}{opacity:1}${pct(5650)}{opacity:0}${pct(6400)}{opacity:0}${pct(6450)}{opacity:1}${pct(6550)}{opacity:0}}
@media (prefers-reduced-motion:reduce){.ghl-heli,.ghl-corda,.ghl-masc,.ghl-busca,.ghl-vento,.ghl-flash{display:none}}
`

/** o palco cabe inteiro na tela. A cena usa do y=40 ao ~720 do palco (o resto é margem), então a
 *  conta é por 760 de altura: no computador ela fica grande (≈1,4× num monitor 1080p), no celular é a
 *  largura que manda e fica igual ao mockup. */
function useEscala() {
  const calc = () => Math.min(window.innerWidth / 420, window.innerHeight / 760)
  const [s, setS] = useState(calc)
  useEffect(() => { const f = () => setS(calc()); window.addEventListener('resize', f); return () => window.removeEventListener('resize', f) }, [])
  return s
}

export function GalaHelicoptero({ clube, chave, mostra, grito }: { clube: string; chave: string; mostra: string; grito: string }) {
  const s = useEscala()
  const art = mascoteInteiraDoTime(clube)
  return createPortal(
    <div key={chave} className="ghl" aria-hidden>
      <style>{CSS}</style>
      <div className="ghl-escuro" />
      <div className="ghl-palco" style={{ transform: `translate(-50%,-50%) scale(${s})` }}>
        <div className="ghl-busca" />
        <span className="ghl-flash" style={{ left: 50, top: 300 }} /><span className="ghl-flash" style={{ left: 360, top: 260 }} /><span className="ghl-flash" style={{ left: 320, top: 640 }} />
        <div className="ghl-telao">
          <span className="esc"><Escudo nome={clube} size={170} /></span>
          <p className="ghl-chega">{tr('🚁 CHEGOU NA SALA', '🚁 JUST ARRIVED')}</p>
          <p className="ghl-nome">{mostra}</p>
        </div>
        <p className="ghl-grito">🔊 {tr('Ô Ô Ô', 'OH OH OH')}, {grito}! 🔊</p>
        <div className="ghl-vento" />
        <div className="ghl-corda" />
        {art && <div className="ghl-masc"><MascoteMini art={art} alt={230} /></div>}
        <div className="ghl-heli">{HELI}</div>
      </div>
    </div>,
    document.body,
  )
}

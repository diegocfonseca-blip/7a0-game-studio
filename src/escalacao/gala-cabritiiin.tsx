// ─── 🐐☀️ ENTRADA ÚNICA DO CABRITIIIN F.C: "DIRETO DA TERRA DO SOL" ────────────────────────────────────────────────
//
// Pedido do Diego (13/11, batismo FUNDADOR do lucassaboia14): *"esse usuário aqui terá também entrada de gala personalizada…
// time de coração Ceará"*. A mascote (arte do dono) é O Cabritiiin: o bode de coroa e ÓCULOS ESCUROS, braços cruzados, pé na
// bola, camisa 10 listrada azul e branca. O Ceará é a Terra do Sol — e quem anda de óculos escuros é quem aguenta o sol. Então:
// 1) amanhecer no mar: o sol GIGANTE nasce no horizonte, as ondas brilham e uma jangada cruza; legenda "DIRETO DA TERRA DO SOL"
// 2) as listras AZUL e BRANCA do manto descem como cortina e varrem a tela
// 3) O Cabritiiin entra deslizando de lado (marrento, braços cruzados) e para no meio; o SOL bate nos óculos: brilho ✨ e flash
// 4) ele bate o casco: o chão racha, a bola quica e a coroa dá um pulinho
// 5) o Cabritiiin vai pro canto e o escudo acende com os RAIOS DE SOL girando atrás
// 6) a frase bate — NA TERRA DO SOL, QUEM BRILHA É O CABRITIIIN — e a faixa "CHEGOU NA SALA · O REI DA VÁRZEA"
// Mesmo esquema das outras galas únicas: palco 420×760 escalado, camada fixa sem clique, fora do reducer, sem localStorage.
// Sem som próprio por enquanto (o dono ainda não mandou o canto).
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Escudo } from './escudos'
import { tr } from './lang'
import bodeImg from './img/cabritiiin-mascote.webp' // 300×440, O Cabritiiin de óculos e coroa

export const CABRITIIIN_MS = 8400
const T = CABRITIIIN_MS
const pct = (ms: number) => (ms / T * 100).toFixed(1) + '%'
const AZUL = '#0159C7', BRANCO = '#F6F6F6', SOL = '#FFC93C', SOL_CLARO = '#FFF1B8'
const sorte = (i: number) => ((i * 7919) % 997) / 997 // espalhado e sempre igual (a gala é igual pra todos)
const MH = 330, MW = Math.round(MH * 300 / 440)
const BATE = 4300 // a batida do casco

const CSS = `
.gcb{position:fixed;inset:0;z-index:99990;pointer-events:none;overflow:hidden;animation:gcbVis ${T}ms ease forwards}
@keyframes gcbVis{0%{opacity:0}3%{opacity:1}95%{opacity:1}100%{opacity:0}}
.gcb-ceu{position:absolute;inset:0;background:linear-gradient(180deg,#1b2a5c 0%,#e0662e 46%,#ffb347 62%,#0a3f7a 63%,#062a52 100%);animation:gcbCeu ${T}ms ease forwards}
@keyframes gcbCeu{0%{filter:brightness(.55)}${pct(1500)}{filter:brightness(1)}100%{filter:brightness(.8)}}
.gcb-palco{position:absolute;left:50%;top:50%;width:420px;height:760px;overflow:hidden}
.gcb-treme{position:absolute;inset:0;animation:gcbTreme ${T}ms linear forwards}
@keyframes gcbTreme{0%,${pct(BATE)}{transform:none}${pct(BATE + 40)}{transform:translateY(9px)}${pct(BATE + 110)}{transform:translate(-6px,-4px)}${pct(BATE + 190)}{transform:translate(4px,3px)}${pct(BATE + 280)}{transform:none}100%{transform:none}}
/* o sol nascendo no mar */
.gcb-sol{position:absolute;left:50%;top:470px;width:300px;height:300px;margin-left:-150px;border-radius:50%;z-index:1;
  background:radial-gradient(circle at 50% 50%,${SOL_CLARO},${SOL} 45%,#ff8a1f 72%,rgba(255,138,31,0) 74%);box-shadow:0 0 80px 30px rgba(255,201,60,.45);animation:gcbSol ${T}ms cubic-bezier(.25,.8,.3,1) forwards}
@keyframes gcbSol{0%{transform:translateY(140px)}${pct(1600)}{transform:translateY(-70px)}${pct(5000)}{transform:translateY(-90px)}${pct(5400)}{opacity:1}${pct(5800)}{opacity:.25}100%{opacity:.25;transform:translateY(-90px)}}
.gcb-mar{position:absolute;left:0;right:0;top:479px;bottom:0;z-index:2;background:linear-gradient(180deg,#0b4f93,#062a52)}
.gcb-onda{position:absolute;left:-20px;right:-20px;height:4px;border-radius:4px;background:rgba(255,241,184,.55);z-index:3;animation:gcbOnda 2600ms ease-in-out infinite alternate}
@keyframes gcbOnda{0%{transform:translateX(-14px) scaleX(.9);opacity:.35}100%{transform:translateX(14px) scaleX(1.05);opacity:.8}}
/* a jangada */
.gcb-jang{position:absolute;left:0;top:428px;z-index:4;font-size:0;width:70px;height:62px;opacity:0;animation:gcbJang ${T}ms linear forwards}
.gcb-jang i{position:absolute;display:block}
@keyframes gcbJang{0%{opacity:0;transform:translateX(-90px)}${pct(400)}{opacity:1}${pct(3600)}{opacity:1;transform:translateX(330px)}${pct(3900)}{opacity:0;transform:translateX(360px)}100%{opacity:0}}
.gcb-legenda{position:absolute;left:0;right:0;top:120px;z-index:8;text-align:center;font:700 17px Oswald,sans-serif;letter-spacing:.3em;color:${SOL_CLARO};text-shadow:2px 2px 0 rgba(0,0,0,.6);opacity:0;animation:gcbLeg ${T}ms ease forwards}
@keyframes gcbLeg{0%,${pct(700)}{opacity:0;transform:translateY(10px)}${pct(1200)}{opacity:1;transform:none}${pct(2200)}{opacity:1}${pct(2500)}{opacity:0}100%{opacity:0}}
.gcb-legenda b{display:block;font:700 46px/1 Oswald,sans-serif;letter-spacing:.04em;color:#fff;margin-top:6px}
/* a cortina de listras azul e branca */
.gcb-cort{position:absolute;inset:0;z-index:6;display:flex;pointer-events:none}
.gcb-cort i{flex:1;height:100%;transform:translateY(-102%);animation:gcbFaixa ${T}ms cubic-bezier(.6,0,.3,1) forwards}
@keyframes gcbFaixa{0%,${pct(2300)}{transform:translateY(-102%)}${pct(2850)}{transform:translateY(0)}${pct(3150)}{transform:translateY(0)}${pct(3650)}{transform:translateY(102%)}100%{transform:translateY(102%)}}
/* O CABRITIIIN */
.gcb-bode{position:absolute;left:${210 - MW / 2}px;top:${640 - MH}px;width:${MW}px;height:${MH}px;z-index:10;opacity:0;transform-origin:50% 100%;animation:gcbBode ${T}ms cubic-bezier(.25,1.1,.45,1) forwards}
@keyframes gcbBode{0%,${pct(3250)}{opacity:0;transform:translateX(320px) skewX(-12deg)}${pct(3700)}{opacity:1;transform:translateX(-14px) skewX(6deg)}${pct(3850)}{transform:none}${pct(BATE - 120)}{transform:translateY(-14px)}${pct(BATE)}{transform:translateY(4px) scale(1.03,.97)}${pct(BATE + 160)}{transform:none}${pct(5000)}{opacity:1;transform:none}${pct(5600)}{opacity:1;transform:translate(-120px,40px) scale(.52)}100%{opacity:1;transform:translate(-120px,40px) scale(.52)}}
.gcb-bode img{width:100%;height:100%;display:block;filter:drop-shadow(5px 7px 0 rgba(0,0,0,.6)) drop-shadow(0 0 20px rgba(255,201,60,.4))}
/* o brilho do sol nos óculos */
.gcb-brilho{position:absolute;left:${210 + 14}px;top:${640 - MH + 38}px;z-index:12;font-size:44px;line-height:1;opacity:0;animation:gcbBrilho ${T}ms ease forwards}
@keyframes gcbBrilho{0%,${pct(3800)}{opacity:0;transform:scale(.2) rotate(0)}${pct(3950)}{opacity:1;transform:scale(1.3) rotate(45deg)}${pct(4150)}{opacity:0;transform:scale(.6) rotate(90deg)}100%{opacity:0}}
.gcb-flash{position:absolute;inset:0;z-index:20;background:#fffbe6;opacity:0;animation:gcbFlash ${T}ms linear forwards}
@keyframes gcbFlash{0%,${pct(3900)}{opacity:0}${pct(3950)}{opacity:.55}${pct(4150)}{opacity:0}100%{opacity:0}}
/* o chão rachando e a bola quicando */
.gcb-racha{position:absolute;left:50%;top:636px;width:260px;height:30px;margin-left:-130px;z-index:9;opacity:0;animation:gcbRacha ${T}ms ease forwards}
@keyframes gcbRacha{0%,${pct(BATE)}{opacity:0;transform:scaleX(.2)}${pct(BATE + 80)}{opacity:1;transform:scaleX(1)}${pct(5000)}{opacity:1}${pct(5500)}{opacity:0}100%{opacity:0}}
.gcb-bola{position:absolute;left:300px;top:600px;z-index:11;font-size:34px;line-height:1;opacity:0;animation:gcbBola ${T}ms ease-out forwards}
@keyframes gcbBola{0%,${pct(BATE)}{opacity:0;transform:none}${pct(BATE + 30)}{opacity:1}${pct(BATE + 330)}{transform:translate(18px,-120px) rotate(200deg)}${pct(BATE + 650)}{transform:translate(36px,0) rotate(400deg)}${pct(BATE + 850)}{transform:translate(44px,-36px) rotate(520deg)}${pct(BATE + 1050)}{transform:translate(52px,0) rotate(640deg)}${pct(5300)}{opacity:1}${pct(5600)}{opacity:0}100%{opacity:0}}
/* o escudo com os raios de sol */
.gcb-esc{position:absolute;left:50%;top:150px;width:230px;height:240px;margin-left:-115px;z-index:7;display:flex;align-items:center;justify-content:center;opacity:0;
  filter:drop-shadow(0 0 24px rgba(255,201,60,.7)) drop-shadow(5px 6px 0 rgba(0,0,0,.55));animation:gcbEsc ${T}ms cubic-bezier(.2,1.3,.4,1) forwards}
@keyframes gcbEsc{0%,${pct(5000)}{opacity:0;transform:scale(.2) translateY(-60px)}${pct(5450)}{opacity:1;transform:scale(1.12)}${pct(5700)}{transform:scale(1)}100%{opacity:1;transform:scale(1)}}
.gcb-raios{position:absolute;left:50%;top:270px;width:460px;height:460px;margin:-230px 0 0 -230px;z-index:5;border-radius:50%;
  background:repeating-conic-gradient(rgba(255,201,60,.55) 0 8deg,rgba(62,139,240,.25) 8deg 22deg);-webkit-mask:radial-gradient(circle,#000 28%,transparent 68%);mask:radial-gradient(circle,#000 28%,transparent 68%);opacity:0;animation:gcbRaios ${T}ms linear forwards}
@keyframes gcbRaios{0%,${pct(5000)}{opacity:0;transform:rotate(0) scale(.5)}${pct(5400)}{opacity:1;transform:rotate(30deg) scale(1)}100%{opacity:1;transform:rotate(150deg) scale(1)}}
/* a frase e a faixa */
.gcb-frase{position:absolute;left:0;right:0;top:44px;z-index:13;text-align:center;font:700 25px/1.12 Oswald,sans-serif;color:#fff;text-shadow:3px 3px 0 #000;letter-spacing:.02em}
.gcb-frase span{display:inline-block;opacity:0;animation:gcbPalavra ${T}ms cubic-bezier(.2,1.5,.4,1) forwards}
@keyframes gcbPalavra{0%{opacity:0;transform:translateY(-40px)}6%{opacity:1;transform:translateY(4px)}9%{transform:none}96%{opacity:1}100%{opacity:1}}
.gcb-frase em{font-style:normal;color:${SOL}}
.gcb-faixa{position:absolute;left:24px;right:24px;top:620px;z-index:14;background:${AZUL};border:4px solid #0C0C0C;border-radius:16px;box-shadow:4px 4px 0 #000;padding:8px 8px 9px;text-align:center;opacity:0;animation:gcbFaixaS ${T}ms cubic-bezier(.2,1.3,.4,1) forwards}
@keyframes gcbFaixaS{0%,${pct(6100)}{opacity:0;transform:scale(.4)}${pct(6450)}{opacity:1;transform:scale(1.06)}${pct(6650)}{transform:scale(1)}${pct(8000)}{opacity:1}100%{opacity:0}}
.gcb-faixa small{display:block;font:700 13px Oswald,sans-serif;letter-spacing:.22em;color:${SOL_CLARO}}
.gcb-faixa b{display:block;font:700 27px/1.05 Oswald,sans-serif;color:#fff;margin-top:2px}
.gcb-faixa em{display:inline-block;font-style:normal;font:700 13px Oswald,sans-serif;color:#0C0C0C;background:linear-gradient(90deg,${SOL},${SOL_CLARO},${SOL});border-radius:7px;padding:2px 9px;margin-top:5px;letter-spacing:.14em}
@media (prefers-reduced-motion:reduce){.gcb-onda,.gcb-jang,.gcb-legenda,.gcb-cort,.gcb-brilho,.gcb-flash,.gcb-racha,.gcb-bola,.gcb-raios{display:none}.gcb-treme,.gcb-sol{animation:none}.gcb-esc,.gcb-bode,.gcb-faixa,.gcb-frase span{animation:none;opacity:1}}
`

function useEscala() {
  const calc = () => Math.min(window.innerWidth / 420, window.innerHeight / 760)
  const [s, setS] = useState(calc)
  useEffect(() => { const f = () => setS(calc()); window.addEventListener('resize', f); return () => window.removeEventListener('resize', f) }, [])
  return s
}

export function GalaCabritiiin({ clube, chave, mostra, grito }: { clube: string; chave: string; mostra: string; grito: string }) {
  const s = useEscala()
  void grito
  const frase = [tr('NA TERRA DO SOL,', 'IN THE LAND OF THE SUN,'), tr('QUEM BRILHA É O', 'THE ONE WHO SHINES IS'), 'CABRITIIIN']
  return createPortal(
    <div key={chave} className="gcb" aria-hidden>
      <style>{CSS}</style>
      <div className="gcb-ceu" />
      <div className="gcb-palco" style={{ transform: `translate(-50%,-50%) scale(${s})` }}>
       <div className="gcb-treme">
        <div className="gcb-sol" />
        <div className="gcb-mar" />
        {Array.from({ length: 9 }, (_, i) => (
          <i key={i} className="gcb-onda" style={{ top: 492 + i * 28, left: -20 + Math.round(sorte(i + 2) * 60), right: -20 + Math.round(sorte(i * 5 + 1) * 60), animationDelay: `${Math.round(sorte(i * 11 + 3) * 2000)}ms` }} />
        ))}
        <div className="gcb-jang">
          <i style={{ left: 30, top: 0, width: 0, height: 0, borderLeft: '26px solid transparent', borderBottom: '46px solid #F6F6F6', filter: 'drop-shadow(2px 2px 0 rgba(0,0,0,.5))' }} />
          <i style={{ left: 29, top: 0, width: 3, height: 50, background: '#3a2410' }} />
          <i style={{ left: 4, top: 48, width: 62, height: 10, borderRadius: '0 0 18px 18px', background: '#5a3a1a', border: '2px solid #1a0f05' }} />
        </div>
        <div className="gcb-legenda">{tr('DIRETO DA', 'STRAIGHT FROM THE')}<b>{tr('TERRA DO SOL ☀️', 'LAND OF THE SUN ☀️')}</b></div>
        <div className="gcb-cort">
          {Array.from({ length: 8 }, (_, i) => <i key={i} style={{ background: i % 2 ? BRANCO : AZUL, animationDelay: `${i * 35}ms` }} />)}
        </div>
        <div className="gcb-raios" />
        <div className="gcb-esc"><Escudo nome={clube} size={220} /></div>
        <svg className="gcb-racha" viewBox="0 0 260 30" aria-hidden>
          <path d="M130 2 L112 12 L120 18 L96 26 M130 2 L146 14 L138 20 L166 28 M130 2 L128 14 L134 28 M112 12 L84 10 M146 14 L180 12" stroke="#0C0C0C" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <div className="gcb-bode"><img src={bodeImg} alt="" /></div>
        <div className="gcb-brilho">✨</div>
        <div className="gcb-bola">⚽</div>
        <div className="gcb-frase">
          {frase.map((p, i) => <span key={i} style={{ display: 'block', animationDelay: `${5500 + i * 300}ms` }}>{i === 2 ? <em style={{ fontSize: 36 }}>{p}</em> : p}</span>)}
        </div>
        <div className="gcb-faixa">
          <small>{tr('☀️ CHEGOU NA SALA', '☀️ JUST ARRIVED')}</small>
          <b>{mostra}</b>
          <em>{tr('O REI DA VÁRZEA', 'THE KING OF THE VÁRZEA')}</em>
        </div>
        <div className="gcb-flash" />
       </div>
      </div>
    </div>,
    document.body,
  )
}

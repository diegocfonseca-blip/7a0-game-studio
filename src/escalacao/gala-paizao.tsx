// ─── 👑🎩 ENTRADA ÚNICA DO PAIZÃO FC: "O PRÊMIO" ─────────────────────────────────────────────────────────────────
//
// Pedido do Diego (30/10, batismo 🖋 Fundador): *"faz a entrada de gala personalizada… ele é influenciador. Ganhou prêmio de
// melhor cartoleiro 23 e influenciador da seleção na copa 2022"*. Então a entrada é uma NOITE DE PREMIAÇÃO transmitida ao vivo:
// 1) escuro, dois holofotes cruzando, o selo 🔴 AO VIVO com a contagem subindo e corações subindo pela direita (é influenciador)
// 2) a placa dourada: "E O PRÊMIO DE MELHOR CARTOLEIRO 2023 VAI PARA…"
// 3) a CARTOLA gigante cai no palco e quica — e O PAIZÃO (a mascote, arte do dono) sai de dentro dela: "tirou da cartola"
// 4) a 2ª placa, verde e amarela: "INFLUENCIADOR DA SELEÇÃO · COPA 2022", com confete verde-amarelo
// 5) o Paizão vai pro canto, o escudo acende com os raios dourados girando atrás
// 6) a frase bate — O PAI TÁ ON — e a faixa "CHEGOU NA SALA · Paizão FC"
// Mesmo esquema das outras galas únicas: palco 420×760 escalado, camada fixa sem clique, fora do reducer, sem localStorage.
// Sem rosto inventado: o único rosto é o da arte do dono (a mascote). Sem som próprio (ele não tem canto).
import { useEffect, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { Escudo } from './escudos'
import { tr } from './lang'
import paiImg from './img/paizao-mascote.webp' // 258×440, O Paizão com a taça do Cartola e o pé na bola

export const PAIZAO_MS = 8800
const T = PAIZAO_MS
const pct = (ms: number) => (ms / T * 100).toFixed(1) + '%'
const OURO = '#D99C32', OURO_CLARO = '#FFE08A', PRETO = '#100F0F', VERDE = '#1B9A4B', AMARELO = '#FFD43B'
const sorte = (i: number) => ((i * 7919) % 997) / 997 // espalhado e sempre igual (a gala é igual pra todos)
const MH = 330, MW = Math.round(MH * 258 / 440)
const CARTOLA = 2700 // quando a cartola bate no palco
const SAI = 3350 // quando o Paizão sai da cartola

const CSS = `
.gpz{position:fixed;inset:0;z-index:99990;pointer-events:none;overflow:hidden;animation:gpzVis ${T}ms ease forwards}
@keyframes gpzVis{0%{opacity:0}3%{opacity:1}95%{opacity:1}100%{opacity:0}}
.gpz-ceu{position:absolute;inset:0;background:radial-gradient(ellipse at 50% 42%,#2e2310,#120d05 55%,#040302)}
.gpz-palco{position:absolute;left:50%;top:50%;width:420px;height:760px;overflow:hidden}
.gpz-treme{position:absolute;inset:0;animation:gpzTreme ${T}ms linear forwards}
@keyframes gpzTreme{0%,${pct(CARTOLA)}{transform:none}${pct(CARTOLA + 40)}{transform:translate(-6px,7px)}${pct(CARTOLA + 110)}{transform:translate(5px,-4px)}${pct(CARTOLA + 190)}{transform:none}100%{transform:none}}
/* holofotes cruzando */
.gpz-holo{position:absolute;top:-40px;width:200px;height:860px;background:linear-gradient(180deg,rgba(255,224,138,.34),rgba(255,224,138,.04) 80%,transparent);clip-path:polygon(44% 0,56% 0,100% 100%,0 100%);filter:blur(5px);transform-origin:50% 0;opacity:0}
.gpz-holo.e{left:-10px;animation:gpzHoloE ${T}ms ease-in-out forwards}
.gpz-holo.d{right:-10px;animation:gpzHoloD ${T}ms ease-in-out forwards}
@keyframes gpzHoloE{0%{opacity:0;transform:rotate(-28deg)}6%{opacity:1}30%{transform:rotate(18deg)}45%{transform:rotate(-6deg)}100%{opacity:.85;transform:rotate(-14deg)}}
@keyframes gpzHoloD{0%{opacity:0;transform:rotate(28deg)}6%{opacity:1}30%{transform:rotate(-18deg)}45%{transform:rotate(6deg)}100%{opacity:.85;transform:rotate(14deg)}}
/* 🔴 AO VIVO + contagem + corações */
.gpz-live{position:absolute;left:16px;top:16px;z-index:15;display:flex;gap:6px;align-items:center;opacity:0;animation:gpzLive ${T}ms ease forwards}
@keyframes gpzLive{0%,${pct(250)}{opacity:0;transform:translateY(-20px)}${pct(550)}{opacity:1;transform:none}${pct(8300)}{opacity:1}100%{opacity:0}}
.gpz-live b{font:700 12px/1 Oswald,sans-serif;letter-spacing:.1em;color:#fff;background:#E2231A;border:2px solid #000;border-radius:6px;padding:4px 7px;box-shadow:2px 2px 0 #000;animation:gpzPisca 1s steps(2) infinite}
@keyframes gpzPisca{50%{background:#a8160f}}
.gpz-live span{font:700 12px/1 Oswald,sans-serif;color:#fff;background:rgba(0,0,0,.6);border:2px solid #000;border-radius:6px;padding:4px 7px}
.gpz-cor{position:absolute;right:22px;bottom:110px;z-index:15;font-size:22px;opacity:0;animation:gpzCor 2600ms ease-out infinite}
@keyframes gpzCor{0%{opacity:0;transform:translate(0,0) scale(.6)}12%{opacity:1}100%{opacity:0;transform:translate(var(--dx),-430px) scale(1.15)}}
/* placa 1: melhor cartoleiro 2023 */
.gpz-placa{position:absolute;left:30px;right:30px;top:96px;z-index:9;text-align:center;border-radius:16px;padding:10px 10px 12px;opacity:0}
.gpz-placa.um{background:linear-gradient(180deg,#1d160a,${PRETO});border:3px solid ${OURO};box-shadow:4px 4px 0 #000,0 0 26px rgba(217,156,50,.45);animation:gpzPlaca1 ${T}ms cubic-bezier(.2,1.3,.4,1) forwards}
@keyframes gpzPlaca1{0%,${pct(650)}{opacity:0;transform:scale(.5)}${pct(1000)}{opacity:1;transform:scale(1.05)}${pct(1200)}{transform:none}${pct(SAI - 150)}{opacity:1;transform:none}${pct(SAI + 150)}{opacity:0;transform:translateY(-40px)}100%{opacity:0}}
.gpz-placa small{display:block;font:700 13px Oswald,sans-serif;letter-spacing:.24em;color:#e9dcc0}
.gpz-placa b{display:block;font:700 30px/1.02 Oswald,sans-serif;color:${OURO_CLARO};margin:3px 0 2px;text-shadow:2px 2px 0 #000}
.gpz-placa i{display:block;font-style:normal;font:700 15px Oswald,sans-serif;letter-spacing:.2em;color:#fff;opacity:0;animation:gpzVai ${T}ms ease forwards}
@keyframes gpzVai{0%,${pct(1700)}{opacity:0}${pct(1950)}{opacity:1}100%{opacity:1}}
/* placa 2: influenciador da seleção */
.gpz-placa.dois{background:linear-gradient(90deg,${VERDE},#147a3a);border:3px solid ${AMARELO};box-shadow:4px 4px 0 #000,0 0 22px rgba(255,212,59,.45);animation:gpzPlaca2 ${T}ms cubic-bezier(.2,1.3,.4,1) forwards}
@keyframes gpzPlaca2{0%,${pct(4300)}{opacity:0;transform:translateX(-460px) rotate(-6deg)}${pct(4650)}{opacity:1;transform:translateX(10px) rotate(-2deg)}${pct(4800)}{transform:rotate(-2deg)}${pct(5500)}{opacity:1;transform:rotate(-2deg)}${pct(5800)}{opacity:0;transform:translateY(-40px) rotate(-2deg)}100%{opacity:0}}
.gpz-placa.dois small{color:${AMARELO}}
.gpz-placa.dois b{color:#fff;font-size:27px}
/* a cartola gigante */
.gpz-cart{position:absolute;left:50%;top:430px;width:200px;margin-left:-100px;z-index:7;text-align:center;font-size:170px;line-height:1;filter:drop-shadow(0 0 22px rgba(255,224,138,.5)) drop-shadow(5px 7px 0 rgba(0,0,0,.6));opacity:0;transform-origin:50% 100%;animation:gpzCart ${T}ms cubic-bezier(.3,1.1,.4,1) forwards}
@keyframes gpzCart{0%,${pct(CARTOLA - 450)}{opacity:0;transform:translateY(-520px) rotate(-30deg)}${pct(CARTOLA - 400)}{opacity:1}${pct(CARTOLA)}{opacity:1;transform:translateY(0) rotate(0) scale(1.1,.86)}${pct(CARTOLA + 150)}{transform:translateY(-26px) scale(.96,1.06)}${pct(CARTOLA + 300)}{transform:none}${pct(SAI - 60)}{transform:none}${pct(SAI + 40)}{transform:scale(1.08,.9) rotate(-4deg)}${pct(SAI + 160)}{transform:rotate(3deg)}${pct(SAI + 280)}{transform:none}${pct(5000)}{opacity:1;transform:none}${pct(5400)}{opacity:0;transform:translateY(60px) scale(.6)}100%{opacity:0}}
.gpz-brilho{position:absolute;left:50%;top:470px;width:300px;height:300px;margin-left:-150px;z-index:6;border-radius:50%;background:radial-gradient(circle,rgba(255,236,170,.9),rgba(255,224,138,.25) 40%,transparent 68%);opacity:0;animation:gpzBrilho ${T}ms ease forwards}
@keyframes gpzBrilho{0%,${pct(SAI - 80)}{opacity:0;transform:scale(.3)}${pct(SAI + 80)}{opacity:1;transform:scale(1.2)}${pct(SAI + 600)}{opacity:0;transform:scale(1.5)}100%{opacity:0}}
/* O PAIZÃO sai da cartola */
.gpz-pai{position:absolute;left:${210 - MW / 2}px;top:${560 - MH}px;width:${MW}px;height:${MH}px;z-index:8;opacity:0;transform-origin:50% 100%;animation:gpzPai ${T}ms cubic-bezier(.25,1.3,.45,1) forwards}
@keyframes gpzPai{0%,${pct(SAI)}{opacity:0;transform:translateY(170px) scale(.25)}${pct(SAI + 120)}{opacity:1}${pct(SAI + 520)}{opacity:1;transform:translateY(-40px) scale(1.06)}${pct(SAI + 760)}{transform:none}${pct(5200)}{opacity:1;transform:none}${pct(5800)}{opacity:1;transform:translate(-120px,120px) scale(.55)}100%{opacity:1;transform:translate(-120px,120px) scale(.55)}}
.gpz-pai img{width:100%;height:100%;display:block;filter:drop-shadow(5px 7px 0 rgba(0,0,0,.6)) drop-shadow(0 0 20px rgba(217,156,50,.5))}
.gpz-balao{position:absolute;right:26px;top:262px;z-index:12;background:#fff;color:#0C0C0C;border:4px solid #0C0C0C;border-radius:18px;padding:6px 12px 8px;font:700 21px/1 Oswald,sans-serif;box-shadow:4px 4px 0 #000;opacity:0;animation:gpzBalao ${T}ms cubic-bezier(.2,1.6,.4,1) forwards}
.gpz-balao::after{content:"";position:absolute;left:22px;bottom:-16px;border:9px solid transparent;border-top:12px solid #0C0C0C}
@keyframes gpzBalao{0%,${pct(SAI + 500)}{opacity:0;transform:scale(.3) rotate(10deg)}${pct(SAI + 700)}{opacity:1;transform:scale(1.1) rotate(5deg)}${pct(SAI + 850)}{transform:scale(1) rotate(5deg)}${pct(4250)}{opacity:1}${pct(4400)}{opacity:0}100%{opacity:0}}
/* confete verde-amarelo */
.gpz-conf{position:absolute;top:-24px;width:9px;height:15px;margin-left:-4px;border-radius:2px;z-index:12;opacity:0;animation:gpzConf 2000ms cubic-bezier(.4,.1,.7,1) both}
@keyframes gpzConf{0%{opacity:0;transform:translateY(0) rotate(0)}8%{opacity:1}100%{opacity:1;transform:translateY(820px) rotate(720deg)}}
.gpz-branco{position:absolute;inset:0;z-index:20;background:#fff8e0;opacity:0;animation:gpzBranco ${T}ms linear forwards}
@keyframes gpzBranco{0%,${pct(SAI - 40)}{opacity:0}${pct(SAI)}{opacity:.65}${pct(SAI + 260)}{opacity:0}100%{opacity:0}}
/* o escudo com os raios dourados */
.gpz-esc{position:absolute;left:50%;top:170px;width:230px;height:230px;margin-left:-115px;z-index:6;display:flex;align-items:center;justify-content:center;opacity:0;
  filter:drop-shadow(0 0 26px rgba(217,156,50,.75)) drop-shadow(5px 6px 0 rgba(0,0,0,.55));animation:gpzEsc ${T}ms cubic-bezier(.2,1.3,.4,1) forwards}
@keyframes gpzEsc{0%,${pct(5300)}{opacity:0;transform:scale(.2) translateY(-60px)}${pct(5750)}{opacity:1;transform:scale(1.12)}${pct(6000)}{transform:scale(1)}100%{opacity:1;transform:scale(1)}}
.gpz-raios{position:absolute;left:50%;top:285px;width:440px;height:440px;margin:-220px 0 0 -220px;z-index:5;border-radius:50%;
  background:repeating-conic-gradient(rgba(255,224,138,.5) 0 7deg,transparent 7deg 20deg);-webkit-mask:radial-gradient(circle,#000 30%,transparent 68%);mask:radial-gradient(circle,#000 30%,transparent 68%);opacity:0;animation:gpzRaios ${T}ms linear forwards}
@keyframes gpzRaios{0%,${pct(5300)}{opacity:0;transform:rotate(0) scale(.5)}${pct(5700)}{opacity:1;transform:rotate(30deg) scale(1)}100%{opacity:1;transform:rotate(150deg) scale(1)}}
/* a frase e a faixa */
.gpz-frase{position:absolute;left:0;right:0;top:62px;z-index:13;text-align:center;white-space:nowrap;font:700 34px/1.05 Oswald,sans-serif;color:#fff;text-shadow:3px 3px 0 #000;letter-spacing:.03em}
.gpz-frase span{display:inline-block;opacity:0;animation:gpzPalavra ${T}ms cubic-bezier(.2,1.5,.4,1) forwards}
@keyframes gpzPalavra{0%{opacity:0;transform:translateY(-40px)}6%{opacity:1;transform:translateY(4px)}9%{transform:none}96%{opacity:1}100%{opacity:1}}
.gpz-frase em{font-style:normal;color:${OURO_CLARO}}
.gpz-faixa{position:absolute;left:24px;right:24px;top:612px;z-index:14;background:#0C0C0C;border:3px solid ${OURO};border-radius:16px;padding:8px 8px 9px;text-align:center;opacity:0;animation:gpzFaixa ${T}ms cubic-bezier(.2,1.3,.4,1) forwards}
@keyframes gpzFaixa{0%,${pct(6350)}{opacity:0;transform:scale(.4)}${pct(6700)}{opacity:1;transform:scale(1.06)}${pct(6900)}{transform:scale(1)}${pct(8400)}{opacity:1}100%{opacity:0}}
.gpz-faixa small{display:block;font:700 13px Oswald,sans-serif;letter-spacing:.22em;color:${OURO_CLARO}}
.gpz-faixa b{display:block;font:700 27px/1.05 Oswald,sans-serif;color:#fff;margin-top:2px}
.gpz-faixa em{display:inline-block;font-style:normal;font:700 12px Oswald,sans-serif;color:#1a1102;background:linear-gradient(90deg,${OURO},${OURO_CLARO},${OURO});border-radius:7px;padding:2px 9px;margin-top:5px;letter-spacing:.12em}
@media (prefers-reduced-motion:reduce){.gpz-holo,.gpz-cor,.gpz-placa,.gpz-cart,.gpz-brilho,.gpz-balao,.gpz-conf,.gpz-branco,.gpz-raios{display:none}.gpz-treme{animation:none}.gpz-esc,.gpz-pai,.gpz-faixa,.gpz-live,.gpz-frase span{animation:none;opacity:1}}
`

function useEscala() {
  const calc = () => Math.min(window.innerWidth / 420, window.innerHeight / 760)
  const [s, setS] = useState(calc)
  useEffect(() => { const f = () => setS(calc()); window.addEventListener('resize', f); return () => window.removeEventListener('resize', f) }, [])
  return s
}

export function GalaPaizao({ clube, chave, mostra, grito }: { clube: string; chave: string; mostra: string; grito: string }) {
  const s = useEscala()
  void grito
  // a contagem da live sobe sozinha (só enfeite: igual pra todos, presa no tempo da gala)
  const [vendo, setVendo] = useState(1200)
  useEffect(() => {
    const t0 = Date.now()
    const iv = setInterval(() => setVendo(1200 + Math.round(Math.min(1, (Date.now() - t0) / 6000) * 48800)), 120)
    return () => clearInterval(iv)
  }, [chave])
  const frase = [tr('O PAI', 'DADDY'), tr('TÁ', 'IS'), tr('ON', 'ON')]
  const cores = ['💛', '💚', '❤️', '🔥', '💛', '👑']
  return createPortal(
    <div key={chave} className="gpz" aria-hidden>
      <style>{CSS}</style>
      <div className="gpz-ceu" />
      <div className="gpz-palco" style={{ transform: `translate(-50%,-50%) scale(${s})` }}>
       <div className="gpz-treme">
        <div className="gpz-holo e" />
        <div className="gpz-holo d" />
        <div className="gpz-live"><b>● {tr('AO VIVO', 'LIVE')}</b><span>👁 {(vendo / 1000).toFixed(1).replace('.', getDecimal())}k</span></div>
        {Array.from({ length: 12 }, (_, i) => (
          <i key={i} className="gpz-cor" style={{ ['--dx' as string]: `${-40 - Math.round(sorte(i * 5 + 2) * 70)}px`, animationDelay: `${300 + Math.round(sorte(i * 11 + 7) * 2600)}ms` } as CSSProperties}>{cores[i % cores.length]}</i>
        ))}
        <div className="gpz-placa um">
          <small>{tr('E O PRÊMIO DE', 'AND THE AWARD FOR')}</small>
          <b>{tr('🎩 MELHOR CARTOLEIRO 2023', '🎩 BEST CARTOLA PLAYER 2023')}</b>
          <i>{tr('VAI PARA…', 'GOES TO…')}</i>
        </div>
        <div className="gpz-placa dois">
          <small>{tr('🇧🇷 E TEM MAIS', '🇧🇷 AND THERE IS MORE')}</small>
          <b>{tr('INFLUENCIADOR DA SELEÇÃO', 'BRAZIL TEAM INFLUENCER')}</b>
          <small>{tr('COPA DO MUNDO 2022', 'WORLD CUP 2022')}</small>
        </div>
        <div className="gpz-raios" />
        <div className="gpz-esc"><Escudo nome={clube} size={220} /></div>
        <div className="gpz-brilho" />
        <div className="gpz-pai"><img src={paiImg} alt="" /></div>
        <div className="gpz-cart">🎩</div>
        <div className="gpz-balao">{tr('TIROU DA CARTOLA! 🎩', 'OUT OF THE HAT! 🎩')}</div>
        {Array.from({ length: 26 }, (_, i) => (
          <i key={i} className="gpz-conf" style={{ left: 12 + Math.round(sorte(i * 9 + 4) * 396), background: i % 2 ? VERDE : AMARELO, animationDelay: `${4400 + Math.round(sorte(i * 3 + 1) * 900)}ms` }} />
        ))}
        <div className="gpz-frase">
          {frase.map((p, i) => <span key={i} style={{ animationDelay: `${5800 + i * 260}ms`, marginRight: 10 }}>{i === 2 ? <em>{p}</em> : p}</span>)}
        </div>
        <div className="gpz-faixa">
          <small>{tr('👑 CHEGOU NA SALA', '👑 JUST ARRIVED')}</small>
          <b>{mostra}</b>
          <em>{tr('🎩 MELHOR CARTOLEIRO 2023', '🎩 BEST CARTOLA PLAYER 2023')}</em>
        </div>
        <div className="gpz-branco" />
       </div>
      </div>
    </div>,
    document.body,
  )
}
const getDecimal = () => (tr(',', '.'))

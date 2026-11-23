// ─── 🎸👑 ENTRADA ÚNICA DO SPORT CLUBE BETASSO: "O SHOW DO BETO" ────────────────────────────────────────────────────
//
// Pedido do Diego (23/11, batismo FUNDADOR do caiomooca2013): *"faça gala personalizada"*. A mascote (arte do dono) é o próprio
// Beto: boné preto, tomando a lata, violão nas costas, pé na bola, uniforme grená camisa 10 — e a camisa diz "APENAS UM BETO".
// 1) palco de luau à noite: holofote abre um cone de luz no tablado; legenda "AO VIVO · DIRETO DA RESENHA"
// 2) o Beto entra de lado e fica balançando no ritmo; chuva de música 🎵🎶🎼🎤🎸 subindo do violão e da boca dele (o "GLUP!" saiu, 23/11: *"queria emoji de cantos e coisas de violão"*)
// 3) o acorde final — carimbo "TÁÁÁN! 🎸", flash, a tela treme
// 4) as listras GRENÁ e BRANCAS do manto varrem a tela
// 5) o escudo acende com os raios grená girando atrás; o Beto vai pro canto, ainda no balanço
// 6) a frase da camisa dele — APENAS UM / BETO 🎸 — e a faixa "CHEGOU NA SALA · APENAS UM BETO"
// Mesmo esquema das outras galas únicas: palco 420×760 escalado, camada fixa sem clique, fora do reducer, sem localStorage.
// Som: o canto do Corinthians (`sfx/torcida-gavioes-v1.mp3`, o mesmo dos outros Fundadores corintianos), abaixando no fim.
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Escudo } from './escudos'
import { tr } from './lang'
import { playMp3Gala } from './sound'
import betoImg from './img/betasso-mascote.webp' // 220×440, o Beto com a lata, o violão e o pé na bola

export const BETASSO_MS = 8800
const T = BETASSO_MS
const pct = (ms: number) => (ms / T * 100).toFixed(1) + '%'
const GRENA = '#890329', BRANCO = '#F7F4F4', OURO = '#FFC400'
const BW = 190, BH = Math.round(BW * 440 / 220), BX = 115, BY = 640 - BH // o Beto no palco (pé no tablado)
const ACORDE = 3900

const CSS = `
.gbe{position:fixed;inset:0;z-index:99990;pointer-events:none;overflow:hidden;animation:gbeVis ${T}ms ease forwards}
@keyframes gbeVis{0%{opacity:0}3%{opacity:1}95%{opacity:1}100%{opacity:0}}
.gbe-ceu{position:absolute;inset:0;background:radial-gradient(ellipse at 50% 30%,#3a0e1c 0%,#160509 60%,#070203 100%)}
.gbe-palco{position:absolute;left:50%;top:50%;width:420px;height:760px;overflow:hidden}
.gbe-treme{position:absolute;inset:0;animation:gbeTreme ${T}ms linear forwards}
@keyframes gbeTreme{0%,${pct(ACORDE)}{transform:none}${pct(ACORDE + 40)}{transform:translate(8px,6px)}${pct(ACORDE + 110)}{transform:translate(-7px,-4px)}${pct(ACORDE + 190)}{transform:translate(4px,3px)}${pct(ACORDE + 280)}{transform:none}100%{transform:none}}
/* varal de lâmpadas do luau */
.gbe-varal{position:absolute;left:-10px;right:-10px;top:60px;height:60px;z-index:1;border-bottom:2px solid #2a1a10;border-radius:0 0 50% 50%}
.gbe-lamp{position:absolute;width:12px;height:16px;border-radius:50% 50% 45% 45%;background:#ffd76a;box-shadow:0 0 14px 4px rgba(255,200,90,.65);animation:gbeLamp 1400ms ease-in-out infinite alternate}
@keyframes gbeLamp{0%{opacity:.55}100%{opacity:1}}
.gbe-tablado{position:absolute;left:0;right:0;top:640px;bottom:0;z-index:2;background:repeating-linear-gradient(90deg,#5b3519 0 52px,#4a2a13 52px 56px);border-top:5px solid #2a1608}
.gbe-holo{position:absolute;left:50%;top:-40px;width:420px;height:720px;margin-left:-210px;z-index:3;clip-path:polygon(43% 0,57% 0,100% 100%,0 100%);
  background:linear-gradient(180deg,rgba(255,244,214,.05),rgba(255,244,214,.32));opacity:0;animation:gbeHolo ${T}ms ease forwards}
@keyframes gbeHolo{0%,${pct(400)}{opacity:0}${pct(900)}{opacity:1}${pct(4300)}{opacity:1}${pct(4700)}{opacity:.4}100%{opacity:.4}}
.gbe-legenda{position:absolute;left:0;right:0;top:150px;z-index:8;text-align:center;font:700 16px Oswald,sans-serif;letter-spacing:.3em;color:${OURO};text-shadow:2px 2px 0 #000;opacity:0;animation:gbeLeg ${T}ms ease forwards}
@keyframes gbeLeg{0%,${pct(500)}{opacity:0;transform:translateY(10px)}${pct(1000)}{opacity:1;transform:none}${pct(2000)}{opacity:1}${pct(2300)}{opacity:0}100%{opacity:0}}
.gbe-legenda b{display:block;font:700 44px/1 Oswald,sans-serif;letter-spacing:.04em;color:#fff;margin-top:6px}
.gbe-legenda i{display:inline-block;font-style:normal;background:#E8503A;color:#fff;border-radius:6px;padding:1px 8px;margin-right:6px;letter-spacing:.12em;animation:gbePisca 900ms steps(2) infinite}
@keyframes gbePisca{0%{opacity:1}100%{opacity:.35}}
/* o BETO */
.gbe-beto{position:absolute;left:${BX}px;top:${BY}px;width:${BW}px;height:${BH}px;z-index:10;opacity:0;transform-origin:50% 100%;
  filter:drop-shadow(5px 7px 0 rgba(0,0,0,.55)) drop-shadow(0 0 16px rgba(255,196,0,.3));animation:gbeBeto ${T}ms cubic-bezier(.25,1.05,.45,1) forwards}
@keyframes gbeBeto{0%,${pct(900)}{opacity:0;transform:translateX(-360px)}${pct(1500)}{opacity:1;transform:none}${pct(4800)}{opacity:1;transform:none}${pct(5300)}{opacity:1;transform:translate(150px,90px) scale(.5)}100%{opacity:1;transform:translate(150px,90px) scale(.5)}}
.gbe-beto img{width:100%;height:100%;display:block;transform-origin:50% 100%;animation:gbeBalanco 620ms ease-in-out infinite alternate}
@keyframes gbeBalanco{0%{transform:rotate(-2.5deg)}100%{transform:rotate(2.5deg)}}
/* as notas que sobem do violão */
.gbe-nota{position:absolute;z-index:11;line-height:1;opacity:0;display:flex;align-items:center;justify-content:center;border-radius:50%;background:#fff;border:3px solid #0C0C0C;box-shadow:3px 3px 0 #000,0 0 14px rgba(255,196,0,.6);animation:gbeNota 1700ms ease-out infinite}
@keyframes gbeNota{0%{opacity:0;transform:translate(0,0) rotate(0) scale(.5)}12%{opacity:1}70%{opacity:1}100%{opacity:0;transform:translate(var(--dx),-230px) rotate(var(--rot)) scale(1.2)}}
.gbe-notas{position:absolute;inset:0;z-index:11;opacity:0;animation:gbeNotas ${T}ms linear forwards}
@keyframes gbeNotas{0%,${pct(2050)}{opacity:0}${pct(2250)}{opacity:1}${pct(4700)}{opacity:1}${pct(5000)}{opacity:0}100%{opacity:0}}
.gbe-flash{position:absolute;inset:0;z-index:20;background:#fff4e0;opacity:0;animation:gbeFlash ${T}ms linear forwards}
@keyframes gbeFlash{0%,${pct(ACORDE)}{opacity:0}${pct(ACORDE + 40)}{opacity:.6}${pct(ACORDE + 260)}{opacity:0}100%{opacity:0}}
.gbe-carimbo{position:absolute;left:50%;top:160px;z-index:15;font:700 62px/1 Oswald,sans-serif;color:#fff;background:${GRENA};border:5px solid #0C0C0C;border-radius:16px;padding:6px 18px;
  box-shadow:5px 5px 0 #000;white-space:nowrap;opacity:0;animation:gbeCar ${T}ms cubic-bezier(.2,1.5,.4,1) forwards}
@keyframes gbeCar{0%,${pct(ACORDE + 60)}{opacity:0;transform:translateX(-50%) scale(2.4) rotate(-8deg)}${pct(ACORDE + 260)}{opacity:1;transform:translateX(-50%) scale(1) rotate(-6deg)}${pct(4700)}{opacity:1;transform:translateX(-50%) scale(1) rotate(-6deg)}${pct(4900)}{opacity:0}100%{opacity:0}}
/* a cortina de listras grená e branca */
.gbe-cort{position:absolute;inset:0;z-index:13;display:flex;pointer-events:none}
.gbe-cort i{flex:1;height:100%;transform:translateY(-102%);animation:gbeFaixa ${T}ms cubic-bezier(.6,0,.3,1) forwards}
@keyframes gbeFaixa{0%,${pct(4700)}{transform:translateY(-102%)}${pct(5200)}{transform:translateY(0)}${pct(5400)}{transform:translateY(0)}${pct(5900)}{transform:translateY(102%)}100%{transform:translateY(102%)}}
/* o escudo */
.gbe-esc{position:absolute;left:50%;top:150px;width:240px;height:300px;margin-left:-120px;z-index:9;display:flex;align-items:center;justify-content:center;opacity:0;
  filter:drop-shadow(0 0 24px rgba(255,196,0,.55)) drop-shadow(5px 6px 0 rgba(0,0,0,.55));animation:gbeEsc ${T}ms cubic-bezier(.2,1.3,.4,1) forwards}
@keyframes gbeEsc{0%,${pct(5450)}{opacity:0;transform:scale(.2) translateY(-60px)}${pct(5850)}{opacity:1;transform:scale(1.12)}${pct(6100)}{transform:scale(1)}100%{opacity:1;transform:scale(1)}}
.gbe-raios{position:absolute;left:50%;top:300px;width:480px;height:480px;margin:-240px 0 0 -240px;z-index:8;border-radius:50%;
  background:repeating-conic-gradient(rgba(137,3,41,.75) 0 8deg,rgba(255,255,255,.14) 8deg 22deg);-webkit-mask:radial-gradient(circle,#000 28%,transparent 68%);mask:radial-gradient(circle,#000 28%,transparent 68%);opacity:0;animation:gbeRaios ${T}ms linear forwards}
@keyframes gbeRaios{0%,${pct(5450)}{opacity:0;transform:rotate(0) scale(.5)}${pct(5850)}{opacity:1;transform:rotate(30deg) scale(1)}100%{opacity:1;transform:rotate(150deg) scale(1)}}
/* a frase e a faixa */
.gbe-frase{position:absolute;left:0;right:0;top:30px;z-index:14;text-align:center;font:700 26px/1.05 Oswald,sans-serif;color:#fff;text-shadow:3px 3px 0 #000;letter-spacing:.02em}
.gbe-frase span{display:block;opacity:0;animation:gbePalavra ${T}ms cubic-bezier(.2,1.5,.4,1) forwards}
@keyframes gbePalavra{0%{opacity:0;transform:translateY(-40px)}6%{opacity:1;transform:translateY(4px)}9%{transform:none}96%{opacity:1}100%{opacity:1}}
.gbe-faixa{position:absolute;left:24px;right:24px;top:640px;z-index:14;background:${GRENA};border:4px solid #0C0C0C;border-radius:16px;box-shadow:4px 4px 0 #000;padding:8px 8px 9px;text-align:center;opacity:0;animation:gbeFaixaS ${T}ms cubic-bezier(.2,1.3,.4,1) forwards}
@keyframes gbeFaixaS{0%,${pct(6600)}{opacity:0;transform:scale(.4)}${pct(6950)}{opacity:1;transform:scale(1.06)}${pct(7150)}{transform:scale(1)}${pct(8400)}{opacity:1}100%{opacity:0}}
.gbe-faixa small{display:block;font:700 13px Oswald,sans-serif;letter-spacing:.22em;color:${BRANCO}}
.gbe-faixa b{display:block;font:700 27px/1.05 Oswald,sans-serif;color:#fff;text-shadow:2px 2px 0 #000;margin-top:2px}
.gbe-faixa em{display:inline-block;font-style:normal;font:700 13px Oswald,sans-serif;color:${GRENA};background:${BRANCO};border:2px solid #0C0C0C;border-radius:7px;padding:2px 9px;margin-top:5px;letter-spacing:.14em}
@media (prefers-reduced-motion:reduce){.gbe-lamp,.gbe-legenda,.gbe-notas,.gbe-flash,.gbe-carimbo,.gbe-cort,.gbe-raios{display:none}.gbe-treme,.gbe-beto img{animation:none}.gbe-esc,.gbe-beto,.gbe-holo,.gbe-faixa,.gbe-frase span{animation:none;opacity:1}}
`

function useEscala() {
  const calc = () => Math.min(window.innerWidth / 420, window.innerHeight / 760)
  const [s, setS] = useState(calc)
  useEffect(() => { const f = () => setS(calc()); window.addEventListener('resize', f); return () => window.removeEventListener('resize', f) }, [])
  return s
}

// [emoji, atraso ms, de onde sai (v = violão · b = boca), dx inicial, deriva, tamanho, giro]
const NOTAS: [string, number, 'v' | 'b', number, number, number, number][] = [
  ['🎵', 0, 'v', 0, 50, 40, 25], ['🎶', 280, 'v', -20, -20, 44, -20], ['🎸', 560, 'v', 10, 80, 46, 35], ['🎼', 840, 'v', -10, 30, 38, -15],
  ['🎵', 1120, 'v', 14, 70, 34, 30], ['🎶', 1400, 'v', -6, -40, 40, -25],
  ['🎤', 150, 'b', 0, -70, 42, -20], ['🎶', 600, 'b', -10, -110, 36, -30], ['🎵', 1050, 'b', 6, -60, 40, 20], ['🎼', 1500, 'b', -4, -95, 34, -10],
]

export function GalaBetasso({ clube, chave, mostra, grito }: { clube: string; chave: string; mostra: string; grito: string }) {
  const s = useEscala()
  void grito
  useEffect(() => playMp3Gala(`${import.meta.env.BASE_URL}sfx/torcida-gavioes-v1.mp3`, T), [chave]) // 📣 o canto do Corinthians (a sala inteira ouve; respeita o mudo)
  const frase = [tr('APENAS UM', 'JUST A'), 'BETO 🎸']
  const de = { v: [BX + BW * 0.84, BY + BH * 0.16], b: [BX + BW * 0.28, BY + BH * 0.1] } as const // a cabeça do violão e a boca (onde ele canta)
  return createPortal(
    <div key={chave} className="gbe" aria-hidden>
      <style>{CSS}</style>
      <div className="gbe-ceu" />
      <div className="gbe-palco" style={{ transform: `translate(-50%,-50%) scale(${s})` }}>
       <div className="gbe-treme">
        <div className="gbe-varal">{Array.from({ length: 9 }, (_, i) => <i key={i} className="gbe-lamp" style={{ left: 18 + i * 48, top: 18 + Math.round(Math.sin((i / 8) * Math.PI) * 34), animationDelay: `${i * -170}ms` }} />)}</div>
        <div className="gbe-tablado" />
        <div className="gbe-holo" />
        <div className="gbe-legenda"><i>● {tr('AO VIVO', 'LIVE')}</i>{tr('DIRETO DA', 'STRAIGHT FROM THE')}<b>{tr('RESENHA 🎤', 'JAM SESSION 🎤')}</b></div>
        <div className="gbe-beto"><img src={betoImg} alt="" /></div>
        <div className="gbe-notas">
          {NOTAS.map(([n, d, o, dx, drift, tam, rot], i) => <span key={i} className="gbe-nota" style={{ left: de[o][0] + dx - (tam + 16) / 2, top: de[o][1] - (tam + 16) / 2, width: tam + 16, height: tam + 16, fontSize: tam * .78, animationDelay: `${d}ms`, ['--dx' as string]: `${drift}px`, ['--rot' as string]: `${rot}deg` }}>{n}</span>)}
        </div>
        <div className="gbe-carimbo">{tr('TÁÁÁN!', 'TADAAA!')} 🎸</div>
        <div className="gbe-raios" />
        <div className="gbe-esc"><Escudo nome={clube} size={280} /></div>
        <div className="gbe-cort">
          {Array.from({ length: 8 }, (_, i) => <i key={i} style={{ background: i % 2 ? BRANCO : GRENA, animationDelay: `${i * 35}ms` }} />)}
        </div>
        <div className="gbe-frase">
          {frase.map((p, i) => <span key={i} style={{ animationDelay: `${6200 + i * 320}ms` }}>{i === 1 ? <em style={{ fontStyle: 'normal', color: OURO, fontSize: 44 }}>{p}</em> : p}</span>)}
        </div>
        <div className="gbe-faixa">
          <small>{tr('🎸 CHEGOU NA SALA', '🎸 JUST ARRIVED')}</small>
          <b>{mostra}</b>
          <em>{tr('APENAS UM BETO', 'JUST A BETO')}</em>
        </div>
        <div className="gbe-flash" />
       </div>
      </div>
    </div>,
    document.body,
  )
}

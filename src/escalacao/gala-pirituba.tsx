// ─── 🐸👑 ENTRADA ÚNICA DO PIRITUBA SF: "O PULO DO PERERECÃO" ──────────────────────────────────────────────────────
//
// Pedido do Diego (23/11, batismo FUNDADOR do pedrosilveira0810): *"faça entrada de gala… e me mande vídeo também do sapo
// pulando"*. A mascote (arte do dono) é o Pererecão: sapo azul de boné rosa virado, agachado na pose de sapo (troca de 23/11).
// 1) noite de Pirituba em neon azul e rosa; legenda "DIRETO DE PIRITUBA"
// 2) o Pererecão (agachado na pose de sapo) atravessa a tela em 3 PULOS de vitória-régia em vitória-régia (estica no ar, amassa no pouso, 💦 "PLOFT!")
// 3) o 4º pulo é o grandão: ele cai de quatro no meio da tela — estalo 💥, flash, a tela treme
// 4) as faixas DIAGONAIS azul e rosa da camisa varrem a tela (a camisa do dono é pincelada na diagonal)
// 5) o escudo (que já tem a coroa) acende com os raios azul e rosa girando atrás; o Pererecão vai pro canto, ainda quicando
// 6) o grito que está na própria arte do dono — PERERECÃO CHEGOU / PRA GANHAR NA RAÇA — e a faixa "CHEGOU NA SALA · PERERECÃO"
// Mesmo esquema das outras galas únicas: palco 420×760 escalado, camada fixa sem clique, fora do reducer, sem localStorage.
// Som: o canto do Corinthians (`sfx/torcida-gavioes-v1.mp3`, o mesmo dos outros Fundadores corintianos), abaixando no fim.
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Escudo } from './escudos'
import { tr } from './lang'
import { playMp3Gala } from './sound'
import sapoImg from './img/pirituba-mascote.webp' // 424×440, o Pererecão agachado na pose de sapo

export const PIRITUBA_MS = 8800
const T = PIRITUBA_MS
const pct = (ms: number) => (ms / T * 100).toFixed(1) + '%'
const AZUL = '#0199F6', ROSA = '#FC22BC'
const SW = 200, SH = Math.round(SW * 440 / 424) // o sapo no palco, agachado (≈208 de altura)
const CHAO = 600 // linha do pouso (pé do sapo)
// os 3 pulos: [x de saída, x de chegada, início ms] — cada pulo leva PULO ms
const PULO = 520
const PULOS: [number, number, number][] = [[-220, -10, 1100], [-10, 105, 1700], [105, 220, 2300]]
const GRANDE = 2950, POUSO = GRANDE + 650 // o 4º pulo, alto, caindo de quatro no meio da tela
const XF = 110 // x final do sapo (centro do palco: 210 - SW/2)

function keyframesSapo(): string {
  const fr: string[] = [`0%{opacity:0;transform:translate(${PULOS[0][0]}px,0) scale(1,1)}`, `${pct(PULOS[0][2] - 1)}{opacity:0;transform:translate(${PULOS[0][0]}px,0)}`]
  for (const [a, b, t] of PULOS) {
    fr.push(`${pct(t)}{opacity:1;transform:translate(${a}px,0) scale(1.08,.9)}`) // agacha
    fr.push(`${pct(t + 90)}{transform:translate(${a + (b - a) * .15}px,-40px) scale(.9,1.12)}`) // estica subindo
    fr.push(`${pct(t + PULO / 2)}{transform:translate(${(a + b) / 2}px,-150px) scale(.95,1.06) rotate(${b > a ? 8 : -8}deg)}`)
    fr.push(`${pct(t + PULO - 60)}{transform:translate(${b}px,-10px) scale(.95,1.05)}`)
    fr.push(`${pct(t + PULO)}{transform:translate(${b}px,0) scale(1.14,.84)}`) // amassa no pouso
    fr.push(`${pct(t + PULO + 70)}{transform:translate(${b}px,0) scale(1,1)}`)
  }
  const s = PULOS[2][1]
  fr.push(`${pct(GRANDE)}{transform:translate(${s}px,0) scale(1.12,.86)}`)
  fr.push(`${pct(GRANDE + 120)}{transform:translate(${s - 20}px,-90px) scale(.88,1.15)}`)
  fr.push(`${pct(GRANDE + 330)}{transform:translate(${(s + XF) / 2}px,-270px) scale(.95,1.08) rotate(-14deg)}`)
  fr.push(`${pct(POUSO - 40)}{transform:translate(${XF}px,-14px) scale(.95,1.06)}`)
  fr.push(`${pct(POUSO)}{transform:translate(${XF}px,0) scale(1.2,.8)}`)
  fr.push(`${pct(POUSO + 120)}{transform:translate(${XF}px,0) scale(1,1)}`)
  fr.push(`${pct(4500)}{opacity:1;transform:translate(${XF}px,0)}`)
  fr.push(`${pct(5100)}{opacity:1;transform:translate(258px,40px) scale(.55)}`) // vai pro canto
  fr.push(`${pct(5600)}{transform:translate(258px,10px) scale(.55)}`, `${pct(6000)}{transform:translate(258px,40px) scale(.55,.5)}`, `${pct(6400)}{transform:translate(258px,10px) scale(.55)}`,
    `${pct(6800)}{transform:translate(258px,40px) scale(.55,.5)}`, `${pct(7200)}{transform:translate(258px,10px) scale(.55)}`, `100%{opacity:1;transform:translate(258px,40px) scale(.55)}`)
  return `@keyframes gpiSapo{${fr.join('')}}`
}

// onde cai cada respingo (o pouso de cada pulo)
const SPLASH = PULOS.map(([, b, t]) => [b + SW / 2, t + PULO] as const)

const CSS = `
.gpi{position:fixed;inset:0;z-index:99990;pointer-events:none;overflow:hidden;animation:gpiVis ${T}ms ease forwards}
@keyframes gpiVis{0%{opacity:0}3%{opacity:1}95%{opacity:1}100%{opacity:0}}
.gpi-ceu{position:absolute;inset:0;background:radial-gradient(ellipse at 50% 25%,#2a1650 0%,#120a2a 55%,#06040f 100%)}
.gpi-palco{position:absolute;left:50%;top:50%;width:420px;height:760px;overflow:hidden}
.gpi-treme{position:absolute;inset:0;animation:gpiTreme ${T}ms linear forwards}
@keyframes gpiTreme{0%,${pct(POUSO)}{transform:none}${pct(POUSO + 40)}{transform:translate(8px,7px)}${pct(POUSO + 110)}{transform:translate(-7px,-5px)}${pct(POUSO + 190)}{transform:translate(4px,3px)}${pct(POUSO + 280)}{transform:none}100%{transform:none}}
/* a cidade em neon: prédios recortados e janelas azul/rosa */
.gpi-cidade{position:absolute;left:0;right:0;top:250px;height:240px;z-index:1;display:flex;align-items:flex-end;gap:6px;padding:0 6px}
.gpi-cidade i{flex:1;background:#0d0a1e;border-top:3px solid var(--c);box-shadow:0 -6px 18px -6px var(--c);
  background-image:radial-gradient(var(--c) 1.4px,transparent 1.8px);background-size:14px 18px;background-position:4px 8px}
.gpi-lua{position:absolute;left:300px;top:70px;width:70px;height:70px;border-radius:50%;background:#fff3c4;box-shadow:0 0 40px #fff3c4;z-index:1}
.gpi-lago{position:absolute;left:0;right:0;top:${CHAO - 120}px;bottom:0;z-index:2;background:linear-gradient(180deg,#0f3a5c,#081d30 70%);border-top:3px solid rgba(1,153,246,.6)}
.gpi-lago::after{content:'';position:absolute;inset:0;background:repeating-linear-gradient(180deg,rgba(255,255,255,.07) 0 2px,transparent 2px 22px)}
.gpi-folha{position:absolute;top:${CHAO - 26}px;width:120px;height:40px;margin-left:-60px;border-radius:50%;z-index:3;background:radial-gradient(ellipse at 40% 40%,#3cc46b,#1b7a3d);border:3px solid #0c3d1d;
  clip-path:polygon(0 0,46% 0,50% 50%,54% 0,100% 0,100% 100%,0 100%)}
.gpi-legenda{position:absolute;left:0;right:0;top:120px;z-index:8;text-align:center;font:700 16px Oswald,sans-serif;letter-spacing:.3em;color:${ROSA};text-shadow:0 0 10px ${ROSA},2px 2px 0 #000;opacity:0;animation:gpiLeg ${T}ms ease forwards}
@keyframes gpiLeg{0%,${pct(300)}{opacity:0;transform:translateY(10px)}${pct(800)}{opacity:1;transform:none}${pct(2700)}{opacity:1}${pct(3000)}{opacity:0}100%{opacity:0}}
.gpi-legenda b{display:block;font:700 48px/1 Oswald,sans-serif;letter-spacing:.04em;color:#fff;text-shadow:0 0 14px ${AZUL},3px 3px 0 #000;margin-top:6px}
/* o PERERECÃO */
.gpi-sapo{position:absolute;left:0;top:${CHAO - SH}px;width:${SW}px;height:${SH}px;z-index:10;opacity:0;transform-origin:50% 100%;
  filter:drop-shadow(5px 7px 0 rgba(0,0,0,.55)) drop-shadow(0 0 16px rgba(252,34,188,.45));animation:gpiSapo ${T}ms linear forwards}
.gpi-sapo img{width:100%;height:100%;display:block}
${keyframesSapo()}
.gpi-esp{position:absolute;top:${CHAO - 40}px;width:120px;margin-left:-60px;z-index:11;text-align:center;opacity:0;animation:gpiEsp ${T}ms ease forwards}
.gpi-esp span{display:block;font-size:34px;line-height:1}
.gpi-esp b{display:block;font:700 22px Oswald,sans-serif;color:#9fe2ff;text-shadow:2px 2px 0 #000;transform:rotate(-8deg)}
@keyframes gpiEsp{0%{opacity:0;transform:scale(.3) translateY(10px)}6%{opacity:1;transform:scale(1.15) translateY(-14px)}14%{opacity:1;transform:scale(1) translateY(-22px)}22%{opacity:0;transform:translateY(-30px)}100%{opacity:0}}
.gpi-estalo{position:absolute;left:170px;top:${CHAO - 60}px;width:80px;height:80px;z-index:12;font-size:64px;line-height:80px;text-align:center;opacity:0;animation:gpiEst ${T}ms ease forwards}
@keyframes gpiEst{0%,${pct(POUSO)}{opacity:0;transform:scale(.2)}${pct(POUSO + 60)}{opacity:1;transform:scale(1.5)}${pct(POUSO + 420)}{opacity:0;transform:scale(1)}100%{opacity:0}}
.gpi-flash{position:absolute;inset:0;z-index:20;background:#ffe6f7;opacity:0;animation:gpiFlash ${T}ms linear forwards}
@keyframes gpiFlash{0%,${pct(POUSO)}{opacity:0}${pct(POUSO + 40)}{opacity:.6}${pct(POUSO + 260)}{opacity:0}100%{opacity:0}}
.gpi-carimbo{position:absolute;left:50%;top:150px;z-index:15;font:700 58px/1 Oswald,sans-serif;color:#fff;background:${ROSA};border:5px solid #0C0C0C;border-radius:16px;padding:6px 18px;
  box-shadow:5px 5px 0 #000;white-space:nowrap;opacity:0;animation:gpiCar ${T}ms cubic-bezier(.2,1.5,.4,1) forwards}
@keyframes gpiCar{0%,${pct(POUSO + 100)}{opacity:0;transform:translateX(-50%) scale(2.4) rotate(-8deg)}${pct(POUSO + 300)}{opacity:1;transform:translateX(-50%) scale(1) rotate(-6deg)}${pct(4200)}{opacity:1;transform:translateX(-50%) scale(1) rotate(-6deg)}${pct(4400)}{opacity:0}100%{opacity:0}}
/* a cortina DIAGONAL azul e rosa (as pinceladas da camisa) */
.gpi-cort{position:absolute;left:-200px;right:-200px;top:-200px;bottom:-200px;z-index:13;display:flex;transform:rotate(-28deg);pointer-events:none}
.gpi-cort i{flex:1;height:100%;transform:translateY(-110%);animation:gpiFaixa ${T}ms cubic-bezier(.6,0,.3,1) forwards}
@keyframes gpiFaixa{0%,${pct(4200)}{transform:translateY(-110%)}${pct(4700)}{transform:translateY(0)}${pct(4950)}{transform:translateY(0)}${pct(5450)}{transform:translateY(110%)}100%{transform:translateY(110%)}}
/* o escudo com a coroa */
.gpi-esc{position:absolute;left:50%;top:180px;width:240px;height:260px;margin-left:-120px;z-index:9;display:flex;align-items:center;justify-content:center;opacity:0;
  filter:drop-shadow(0 0 24px rgba(252,34,188,.7)) drop-shadow(5px 6px 0 rgba(0,0,0,.55));animation:gpiEsc ${T}ms cubic-bezier(.2,1.3,.4,1) forwards}
@keyframes gpiEsc{0%,${pct(5000)}{opacity:0;transform:scale(.2) translateY(-60px)}${pct(5450)}{opacity:1;transform:scale(1.12)}${pct(5700)}{transform:scale(1)}100%{opacity:1;transform:scale(1)}}
.gpi-raios{position:absolute;left:50%;top:310px;width:480px;height:480px;margin:-240px 0 0 -240px;z-index:8;border-radius:50%;
  background:repeating-conic-gradient(rgba(1,153,246,.55) 0 8deg,rgba(252,34,188,.4) 8deg 16deg,rgba(255,255,255,.08) 16deg 24deg);-webkit-mask:radial-gradient(circle,#000 28%,transparent 68%);mask:radial-gradient(circle,#000 28%,transparent 68%);opacity:0;animation:gpiRaios ${T}ms linear forwards}
@keyframes gpiRaios{0%,${pct(5000)}{opacity:0;transform:rotate(0) scale(.5)}${pct(5400)}{opacity:1;transform:rotate(30deg) scale(1)}100%{opacity:1;transform:rotate(150deg) scale(1)}}
/* a frase e a faixa */
.gpi-frase{position:absolute;left:0;right:0;top:34px;z-index:14;text-align:center;font:700 26px/1.1 Oswald,sans-serif;color:#fff;text-shadow:3px 3px 0 #000;letter-spacing:.02em}
.gpi-frase span{display:block;opacity:0;animation:gpiPalavra ${T}ms cubic-bezier(.2,1.5,.4,1) forwards}
@keyframes gpiPalavra{0%{opacity:0;transform:translateY(-40px)}6%{opacity:1;transform:translateY(4px)}9%{transform:none}96%{opacity:1}100%{opacity:1}}
.gpi-faixa{position:absolute;left:24px;right:24px;top:630px;z-index:14;background:${AZUL};border:4px solid #0C0C0C;border-radius:16px;box-shadow:4px 4px 0 #000;padding:8px 8px 9px;text-align:center;opacity:0;animation:gpiFaixaS ${T}ms cubic-bezier(.2,1.3,.4,1) forwards}
@keyframes gpiFaixaS{0%,${pct(6400)}{opacity:0;transform:scale(.4)}${pct(6750)}{opacity:1;transform:scale(1.06)}${pct(6950)}{transform:scale(1)}${pct(8400)}{opacity:1}100%{opacity:0}}
.gpi-faixa small{display:block;font:700 13px Oswald,sans-serif;letter-spacing:.22em;color:#fff}
.gpi-faixa b{display:block;font:700 27px/1.05 Oswald,sans-serif;color:#fff;text-shadow:2px 2px 0 #000;margin-top:2px}
.gpi-faixa em{display:inline-block;font-style:normal;font:700 13px Oswald,sans-serif;color:#fff;background:${ROSA};border:2px solid #0C0C0C;border-radius:7px;padding:2px 9px;margin-top:5px;letter-spacing:.14em}
@media (prefers-reduced-motion:reduce){.gpi-legenda,.gpi-esp,.gpi-estalo,.gpi-flash,.gpi-carimbo,.gpi-cort,.gpi-raios{display:none}.gpi-treme{animation:none}.gpi-esc,.gpi-sapo,.gpi-faixa,.gpi-frase span{animation:none;opacity:1}}
`

function useEscala() {
  const calc = () => Math.min(window.innerWidth / 420, window.innerHeight / 760)
  const [s, setS] = useState(calc)
  useEffect(() => { const f = () => setS(calc()); window.addEventListener('resize', f); return () => window.removeEventListener('resize', f) }, [])
  return s
}

const PREDIOS: [number, string][] = [[120, AZUL], [180, ROSA], [90, AZUL], [210, ROSA], [140, AZUL], [100, ROSA], [170, AZUL]]

export function GalaPirituba({ clube, chave, mostra, grito }: { clube: string; chave: string; mostra: string; grito: string }) {
  const s = useEscala()
  void grito
  useEffect(() => playMp3Gala(`${import.meta.env.BASE_URL}sfx/torcida-gavioes-v1.mp3`, T), [chave]) // 📣 o canto do Corinthians (a sala inteira ouve; respeita o mudo)
  // a frase é a que está na arte do próprio dono
  const frase = [tr('PERERECÃO CHEGOU', 'PERERECÃO IS HERE'), tr('PRA GANHAR NA RAÇA!', 'TO WIN WITH GRIT!')]
  return createPortal(
    <div key={chave} className="gpi" aria-hidden>
      <style>{CSS}</style>
      <div className="gpi-ceu" />
      <div className="gpi-palco" style={{ transform: `translate(-50%,-50%) scale(${s})` }}>
       <div className="gpi-treme">
        <div className="gpi-lua" />
        <div className="gpi-cidade">{PREDIOS.map(([h, c], i) => <i key={i} style={{ height: h, ['--c' as string]: c }} />)}</div>
        <div className="gpi-lago" />
        {[...PULOS.map(([, b]) => b), XF].map((x, i) => <div key={i} className="gpi-folha" style={{ left: x + SW / 2 }} />)}
        <div className="gpi-legenda">{tr('DIRETO DE', 'STRAIGHT FROM')}<b>PIRITUBA 🐸</b></div>
        <div className="gpi-sapo"><img src={sapoImg} alt="" /></div>
        {SPLASH.map(([x, t], i) => <div key={i} className="gpi-esp" style={{ left: x, animationDelay: `${t}ms`, animationDuration: `${T}ms` }}><span>💦</span><b>PLOFT!</b></div>)}
        <div className="gpi-estalo">💥</div>
        <div className="gpi-carimbo">{tr('PULOU!', 'JUMPED!')} 🐸</div>
        <div className="gpi-raios" />
        <div className="gpi-esc"><Escudo nome={clube} size={230} /></div>
        <div className="gpi-cort">
          {Array.from({ length: 10 }, (_, i) => <i key={i} style={{ background: i % 2 ? ROSA : AZUL, animationDelay: `${i * 30}ms` }} />)}
        </div>
        <div className="gpi-frase">
          {frase.map((p, i) => <span key={i} style={{ animationDelay: `${5800 + i * 320}ms` }}>{i === 1 ? <em style={{ fontStyle: 'normal', color: ROSA, fontSize: 32 }}>{p}</em> : p}</span>)}
        </div>
        <div className="gpi-faixa">
          <small>{tr('🐸 CHEGOU NA SALA', '🐸 JUST ARRIVED')}</small>
          <b>{mostra}</b>
          <em>PERERECÃO</em>
        </div>
        <div className="gpi-flash" />
       </div>
      </div>
    </div>,
    document.body,
  )
}

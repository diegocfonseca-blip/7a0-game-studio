// ─── 🌪️🔴 ENTRADA ÚNICA DO GUIMARÃES SCI: "O SACI CHEGA NO REDEMOINHO" ───────────────────────────────────────────
//
// Pedido do Diego (23/10, o dono virou 🖋 Fundador): *"entrada de gala personalizada… o saci chegando num furacão. Ele é
// mascote do Internacional"*. A mascote do clube (arte do dono) é o Saci de gorro vermelho, cachimbo e uniforme do Inter,
// numa perna só. E no folclore o Saci viaja DENTRO do redemoinho — então:
// 1) o tempo fecha em vermelho: vento riscando a tela, folhas e poeira voando de lado
// 2) o REDEMOINHO nasce no chão e cresce até o céu, girando, com folhas presas nele; um trovão clareia tudo
// 3) o SACI sai de dentro do funil girando, pousa NUMA PERNA SÓ: poeira de terra, a tela treme
// 4) o redemoinho se desfaz, sobe a fumacinha do cachimbo e o escudo acende com um anel de vento em volta
// 5) a frase bate — ONDE TEM REDEMOINHO, TEM SACI — e a faixa "CHEGOU NA SALA"
// Mesmo esquema das outras galas únicas: palco 420×760 escalado, camada fixa sem clique, fora do reducer, sem localStorage.
// Som: o CANTO que o Diego mandou (23/10, vídeo de 10 s → `sfx/torcida-guimaraes-v1.mp3`, mono 56 kbps) — o mesmo da carreira dele.
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Escudo } from './escudos'
import { tr } from './lang'
import { playMp3Gala } from './sound'
import saciImg from './img/guimaraes-mascote.webp' // 320×440, o Saci de gorro vermelho com o uniforme do Inter

export const GUIMARAES_MS = 8600
const T = GUIMARAES_MS
const pct = (ms: number) => (ms / T * 100).toFixed(1) + '%'
const RED = '#C50208', BRANCO = '#FEFBFC', GOLD = '#FFC400'
const sorte = (i: number) => ((i * 7919) % 997) / 997 // espalhado e sempre igual (a gala é igual pra todos)
const MH = 330, MW = Math.round(MH * 320 / 440)
const ANEIS = 11 // as "fatias" do funil, de baixo (fina) pra cima (larga)

const CSS = `
.ggu{position:fixed;inset:0;z-index:99990;pointer-events:none;overflow:hidden;animation:gguVis ${T}ms ease forwards}
@keyframes gguVis{0%{opacity:0}3%{opacity:1}95%{opacity:1}100%{opacity:0}}
.ggu-ceu{position:absolute;inset:0;background:radial-gradient(ellipse at 50% 30%,#5a0a0c,#250406 50%,#0a0102)}
.ggu-palco{position:absolute;left:50%;top:50%;width:420px;height:760px;overflow:hidden}
.ggu-treme{position:absolute;inset:0;animation:gguTreme ${T}ms linear forwards}
@keyframes gguTreme{0%,${pct(3950)}{transform:none}${pct(4000)}{transform:translate(-10px,7px)}${pct(4060)}{transform:translate(9px,-8px)}${pct(4120)}{transform:translate(-7px,-4px)}${pct(4180)}{transform:translate(5px,5px)}${pct(4250)}{transform:translate(-2px,1px)}${pct(4320)}{transform:none}100%{transform:none}}
/* o chão */
.ggu-chao{position:absolute;left:-20px;right:-20px;bottom:0;height:150px;background:linear-gradient(180deg,#3a1508,#1a0903);border-top:3px solid rgba(0,0,0,.6)}
/* o vento: riscos passando de lado */
.ggu-risco{position:absolute;height:3px;border-radius:3px;background:linear-gradient(90deg,transparent,rgba(255,255,255,.75),transparent);opacity:0;animation:gguRisco 900ms linear infinite}
@keyframes gguRisco{0%{opacity:0;transform:translateX(-260px)}15%{opacity:1}100%{opacity:0;transform:translateX(560px)}}
.ggu-vento{position:absolute;inset:0;animation:gguVento ${T}ms ease forwards}
@keyframes gguVento{0%{opacity:0}${pct(300)}{opacity:1}${pct(4400)}{opacity:1}${pct(5200)}{opacity:.15}100%{opacity:.15}}
/* folhas e poeira voando de lado */
.ggu-folha{position:absolute;font-size:22px;opacity:0;animation:gguFolha 1700ms linear infinite}
@keyframes gguFolha{0%{opacity:0;transform:translate(-80px,0) rotate(0)}10%{opacity:1}100%{opacity:0;transform:translate(520px,-90px) rotate(720deg)}}
/* o REDEMOINHO: anéis empilhados girando, nasce fino no chão e cresce até o céu */
.ggu-funil{position:absolute;left:50%;bottom:118px;width:0;height:0;animation:gguFunil ${T}ms ease forwards}
@keyframes gguFunil{0%,${pct(600)}{opacity:0;transform:scaleY(.05)}${pct(900)}{opacity:1;transform:scaleY(.25)}${pct(2600)}{opacity:1;transform:scaleY(1)}${pct(4100)}{opacity:1;transform:scaleY(1) scaleX(1)}${pct(5000)}{opacity:0;transform:scaleY(1.15) scaleX(1.8)}100%{opacity:0}}
.ggu-funil{transform-origin:50% 100%}
.ggu-anel{position:absolute;left:0;border-radius:50%;border:3px solid rgba(240,225,220,.28);border-bottom-color:rgba(255,255,255,.7);border-top-color:rgba(120,40,30,.2);box-shadow:0 0 14px rgba(255,255,255,.15);filter:blur(.6px);animation:gguGira 520ms ease-in-out infinite alternate}
@keyframes gguGira{0%{transform:translateX(calc(-50% - var(--w)))}100%{transform:translateX(calc(-50% + var(--w)))}}
/* o corpo do funil: um cone com listras correndo de lado (é o que dá a cara de girando) */
.ggu-cone{position:absolute;left:0;bottom:0;width:340px;height:430px;margin-left:-170px;clip-path:polygon(47% 100%,53% 100%,100% 0,0 0);
  background:repeating-linear-gradient(118deg,rgba(225,205,200,.42) 0 9px,rgba(90,35,30,.22) 9px 22px,rgba(255,255,255,.3) 22px 25px,rgba(120,60,50,.18) 25px 38px);background-size:180px 100%;animation:gguCone 340ms linear infinite;filter:blur(1.4px);-webkit-mask:linear-gradient(0deg,rgba(0,0,0,.7),#000 30%,#000 80%,rgba(0,0,0,.4));mask:linear-gradient(0deg,rgba(0,0,0,.7),#000 30%,#000 80%,rgba(0,0,0,.4))}
@keyframes gguCone{0%{background-position:0 0}100%{background-position:180px 0}}
.ggu-nuvem{position:absolute;left:50%;top:40px;width:560px;height:150px;margin-left:-280px;border-radius:50%;background:radial-gradient(ellipse at 50% 60%,rgba(70,20,20,.95),rgba(30,6,8,.85) 60%,transparent 72%);opacity:0;animation:gguNuvem ${T}ms ease forwards}
@keyframes gguNuvem{0%,${pct(700)}{opacity:0;transform:scale(.7)}${pct(2000)}{opacity:1;transform:scale(1)}${pct(4600)}{opacity:1}${pct(5600)}{opacity:.25}100%{opacity:.25}}
/* a poeira levantada no pé do redemoinho */
.ggu-base{position:absolute;left:0;bottom:-26px;width:220px;height:70px;margin-left:-110px;border-radius:50%;background:radial-gradient(ellipse,rgba(140,80,50,.85),rgba(90,45,25,.5) 45%,transparent 70%);filter:blur(4px);animation:gguBase 600ms ease-in-out infinite alternate}
@keyframes gguBase{0%{transform:scaleX(.9)}100%{transform:scaleX(1.15)}}
/* folhas presas no redemoinho, orbitando */
.ggu-orbita{position:absolute;left:50%;font-size:20px;opacity:0;animation:gguOrbita 900ms linear infinite}
@keyframes gguOrbita{0%{transform:translateX(calc(var(--r) * -1)) scale(.7);z-index:1}25%{transform:translateX(0) scale(.55)}50%{transform:translateX(var(--r)) scale(.7)}75%{transform:translateX(0) scale(1.1)}100%{transform:translateX(calc(var(--r) * -1)) scale(.7)}}
.ggu-orbitas{position:absolute;inset:0;opacity:0;animation:gguOrbitas ${T}ms ease forwards}
@keyframes gguOrbitas{0%,${pct(1300)}{opacity:0}${pct(1900)}{opacity:1}${pct(4100)}{opacity:1}${pct(4600)}{opacity:0}100%{opacity:0}}
/* o trovão */
.ggu-flash{position:absolute;inset:0;z-index:20;background:#fff3f0;opacity:0;animation:gguFlash ${T}ms linear forwards}
@keyframes gguFlash{0%,${pct(2550)}{opacity:0}${pct(2600)}{opacity:.9}${pct(2700)}{opacity:.1}${pct(2760)}{opacity:.7}${pct(3000)}{opacity:0}${pct(3950)}{opacity:0}${pct(4000)}{opacity:.55}${pct(4250)}{opacity:0}100%{opacity:0}}
.ggu-raio{position:absolute;left:250px;top:60px;width:70px;height:260px;z-index:4;opacity:0;animation:gguRaio ${T}ms linear forwards}
@keyframes gguRaio{0%,${pct(2560)}{opacity:0}${pct(2600)}{opacity:1}${pct(2760)}{opacity:1}${pct(2900)}{opacity:0}100%{opacity:0}}
/* o SACI: sai de dentro do funil girando e pousa numa perna só */
.ggu-saci{position:absolute;left:${210 - MW / 2}px;top:${760 - 118 - MH + 12}px;width:${MW}px;height:${MH}px;z-index:10;opacity:0;animation:gguSaci ${T}ms cubic-bezier(.3,1.25,.5,1) forwards}
@keyframes gguSaci{0%,${pct(2900)}{opacity:0;transform:translateY(-120px) scale(.12) rotate(0)}${pct(3050)}{opacity:1;transform:translateY(-150px) scale(.3) rotate(240deg)}${pct(3350)}{opacity:1;transform:translateY(-200px) scale(.65) rotate(560deg)}${pct(3700)}{opacity:1;transform:translateY(-110px) scale(.95) rotate(900deg)}${pct(3980)}{opacity:1;transform:translateY(10px) scale(1.04) rotate(1080deg)}${pct(4120)}{transform:translateY(-14px) scale(1) rotate(1080deg)}${pct(4280)}{transform:translateY(0) scale(1) rotate(1080deg)}${pct(5100)}{opacity:1;transform:translateY(0) scale(1) rotate(1080deg)}${pct(5600)}{opacity:1;transform:translate(-125px,16px) scale(.55) rotate(1080deg)}100%{opacity:1;transform:translate(-125px,16px) scale(.55) rotate(1080deg)}}
.ggu-saci img{width:100%;height:100%;display:block;filter:drop-shadow(5px 7px 0 rgba(0,0,0,.55))}
/* a poeira da pisada */
.ggu-poeira{position:absolute;bottom:112px;z-index:11;width:16px;height:16px;border-radius:50%;background:#7a4a26;opacity:0;animation:gguPoeira 1100ms ease-out both}
@keyframes gguPoeira{0%{opacity:0;transform:translate(0,0) scale(.4)}12%{opacity:.95}100%{opacity:0;transform:translate(var(--dx),var(--dy)) scale(2.2)}}
.ggu-onda{position:absolute;left:210px;bottom:118px;width:60px;height:18px;margin-left:-30px;z-index:9;border-radius:50%;border:5px solid rgba(255,230,210,.9);opacity:0;animation:gguOnda ${T}ms ease-out forwards}
@keyframes gguOnda{0%,${pct(3960)}{opacity:0;transform:scale(.3)}${pct(4020)}{opacity:1;transform:scale(1)}${pct(4700)}{opacity:0;transform:scale(7)}100%{opacity:0}}
/* a fumacinha do cachimbo */
.ggu-fuma{position:absolute;z-index:12;width:26px;height:26px;border-radius:50%;border:4px solid rgba(255,255,255,.8);opacity:0;animation:gguFuma 1600ms ease-out both}
@keyframes gguFuma{0%{opacity:0;transform:translate(0,0) scale(.3)}15%{opacity:.95}100%{opacity:0;transform:translate(28px,-120px) scale(2.4)}}
/* o escudo com o anel de vento */
.ggu-esc{position:absolute;left:50%;top:160px;width:230px;height:230px;margin-left:-115px;z-index:6;display:flex;align-items:center;justify-content:center;opacity:0;
  filter:drop-shadow(0 0 26px rgba(255,90,90,.75)) drop-shadow(5px 6px 0 rgba(0,0,0,.55));animation:gguEsc ${T}ms cubic-bezier(.2,1.3,.4,1) forwards}
@keyframes gguEsc{0%,${pct(5000)}{opacity:0;transform:scale(.2) rotate(-200deg)}${pct(5450)}{opacity:1;transform:scale(1.12) rotate(10deg)}${pct(5700)}{transform:scale(1) rotate(0)}100%{opacity:1;transform:scale(1)}}
.ggu-vortice{position:absolute;left:50%;top:275px;width:330px;height:330px;margin:-165px 0 0 -165px;z-index:5;border-radius:50%;
  background:conic-gradient(from 0deg,transparent 0 12%,rgba(255,255,255,.55) 18%,transparent 26% 46%,rgba(255,120,120,.5) 52%,transparent 60% 80%,rgba(255,255,255,.5) 86%,transparent 94%);
  -webkit-mask:radial-gradient(circle,transparent 52%,#000 54%,#000 66%,transparent 68%);mask:radial-gradient(circle,transparent 52%,#000 54%,#000 66%,transparent 68%);opacity:0;animation:gguVort ${T}ms linear forwards}
@keyframes gguVort{0%,${pct(5000)}{opacity:0;transform:rotate(0) scale(.6)}${pct(5400)}{opacity:1;transform:rotate(200deg) scale(1)}100%{opacity:1;transform:rotate(1100deg) scale(1)}}
/* a frase e a faixa */
.ggu-frase{position:absolute;left:0;right:0;top:62px;z-index:13;text-align:center;font:700 31px/1.05 Oswald,sans-serif;color:${BRANCO};text-shadow:3px 3px 0 #000;letter-spacing:.02em}
.ggu-frase span{display:inline-block;opacity:0;animation:gguPalavra ${T}ms cubic-bezier(.2,1.5,.4,1) forwards}
@keyframes gguPalavra{0%{opacity:0;transform:translateX(-60px) skewX(-18deg)}6%{opacity:1;transform:translateX(6px) skewX(4deg)}9%{transform:none}96%{opacity:1}100%{opacity:1}}
.ggu-frase em{font-style:normal;color:${GOLD}}
.ggu-faixa{position:absolute;left:24px;right:24px;top:612px;z-index:14;background:#0C0C0C;border:3px solid ${RED};border-radius:16px;padding:8px 8px 9px;text-align:center;opacity:0;animation:gguFaixa ${T}ms cubic-bezier(.2,1.3,.4,1) forwards}
@keyframes gguFaixa{0%,${pct(6100)}{opacity:0;transform:scale(.4)}${pct(6450)}{opacity:1;transform:scale(1.06)}${pct(6650)}{transform:scale(1)}${pct(8200)}{opacity:1}100%{opacity:0}}
.ggu-faixa small{display:block;font:700 13px Oswald,sans-serif;letter-spacing:.22em;color:${GOLD}}
.ggu-faixa b{display:block;font:700 27px/1.05 Oswald,sans-serif;color:#fff;text-transform:uppercase;margin-top:2px}
.ggu-faixa em{display:inline-block;font-style:normal;font:700 13px Oswald,sans-serif;color:#fff;background:${RED};border-radius:7px;padding:2px 9px;margin-top:5px;letter-spacing:.1em}
@media (prefers-reduced-motion:reduce){.ggu-vento,.ggu-orbitas,.ggu-flash,.ggu-raio,.ggu-poeira,.ggu-onda,.ggu-fuma,.ggu-vortice,.ggu-funil,.ggu-nuvem{display:none}.ggu-treme{animation:none}.ggu-esc,.ggu-saci,.ggu-faixa,.ggu-frase span{animation:none;opacity:1}}
`

function useEscala() {
  const calc = () => Math.min(window.innerWidth / 420, window.innerHeight / 760)
  const [s, setS] = useState(calc)
  useEffect(() => { const f = () => setS(calc()); window.addEventListener('resize', f); return () => window.removeEventListener('resize', f) }, [])
  return s
}

export function GalaGuimaraes({ clube, chave, mostra, grito }: { clube: string; chave: string; mostra: string; grito: string }) {
  const s = useEscala()
  void grito
  useEffect(() => playMp3Gala(`${import.meta.env.BASE_URL}sfx/torcida-guimaraes-v1.mp3`, T), [chave])
  // o funil: anel de baixo fino, o de cima largo (a forma de um redemoinho de verdade)
  const aneis = Array.from({ length: ANEIS }, (_, i) => {
    const t = i / (ANEIS - 1)
    const w = 40 + Math.pow(t, 1.6) * 300
    return { w, h: 18 + t * 26, bottom: i * 38, delay: -Math.round(sorte(i + 3) * 500), dur: 380 + i * 30 }
  })
  const frase = [tr('ONDE TEM', 'WHERE THERE’S A'), tr('REDEMOINHO,', 'WHIRLWIND,'), tr('TEM', 'THERE’S'), tr('SACI', 'SACI')]
  return createPortal(
    <div key={chave} className="ggu" aria-hidden>
      <style>{CSS}</style>
      <div className="ggu-ceu" />
      <div className="ggu-palco" style={{ transform: `translate(-50%,-50%) scale(${s})` }}>
       <div className="ggu-treme">
        <div className="ggu-nuvem" />
        <div className="ggu-chao" />
        <div className="ggu-vento">
          {Array.from({ length: 16 }, (_, i) => (
            <i key={i} className="ggu-risco" style={{ top: 40 + Math.round(sorte(i + 1) * 560), width: 90 + Math.round(sorte(i * 5 + 2) * 160), animationDelay: `${Math.round(sorte(i * 3 + 7) * 900)}ms`, animationDuration: `${650 + Math.round(sorte(i * 11) * 500)}ms` }} />
          ))}
          {Array.from({ length: 12 }, (_, i) => (
            <span key={i} className="ggu-folha" style={{ top: 120 + Math.round(sorte(i * 7 + 1) * 480), animationDelay: `${Math.round(sorte(i * 13 + 4) * 1700)}ms` }}>{i % 3 === 2 ? '🍂' : '🍃'}</span>
          ))}
        </div>
        <svg className="ggu-raio" viewBox="0 0 70 260"><path d="M40 0 L14 120 L36 120 L8 260 L62 96 L38 96 L58 0Z" fill="#fff6c8" stroke="#ffd34d" strokeWidth="3" /></svg>
        <div className="ggu-funil">
          <div className="ggu-cone" />
          <div className="ggu-base" />
          {aneis.map((a, i) => (
            <div key={i} className="ggu-anel" style={{ width: a.w, height: a.h, bottom: a.bottom, ['--w' as string]: `${6 + i * 1.6}px`, animationDelay: `${a.delay}ms`, animationDuration: `${a.dur}ms` }} />
          ))}
        </div>
        <div className="ggu-orbitas">
          {Array.from({ length: 9 }, (_, i) => (
            <span key={i} className="ggu-orbita" style={{ bottom: 150 + i * 42, ['--r' as string]: `${30 + i * 16}px`, animationDelay: `-${Math.round(sorte(i * 9 + 1) * 900)}ms`, animationDuration: `${520 + i * 40}ms` }}>{i % 2 ? '🍃' : '🍂'}</span>
          ))}
        </div>
        <div className="ggu-vortice" />
        <div className="ggu-esc"><Escudo nome={clube} size={220} /></div>
        <div className="ggu-onda" />
        {Array.from({ length: 14 }, (_, i) => {
          const lado = i % 2 ? 1 : -1
          return <i key={i} className="ggu-poeira" style={{ left: 200 + Math.round((sorte(i + 2) - .5) * 30), ['--dx' as string]: `${lado * (40 + Math.round(sorte(i * 3) * 120))}px`, ['--dy' as string]: `-${10 + Math.round(sorte(i * 7) * 70)}px`, animationDelay: `${3990 + Math.round(sorte(i * 5) * 120)}ms` }} />
        })}
        <div className="ggu-saci"><img src={saciImg} alt="" /></div>
        {[0, 1, 2].map(i => (
          <i key={i} className="ggu-fuma" style={{ left: Math.round(85 + (0.74 - 0.5) * MW * 0.55) - 13, top: Math.round(505 + (0.2 - 0.5) * MH * 0.55) - 13, animationDelay: `${5700 + i * 520}ms` }} />
        ))}
        <div className="ggu-frase">
          {frase.map((p, i) => <span key={i} style={{ animationDelay: `${5500 + i * 230}ms`, marginRight: 8 }}>{i === 3 ? <em>{p}</em> : p}</span>)}
        </div>
        <div className="ggu-faixa">
          <small>{tr('🌪️ CHEGOU NA SALA', '🌪️ JUST ARRIVED')}</small>
          <b>{mostra}</b>
          <em>{tr('VEIO NO REDEMOINHO', 'CAME IN THE WHIRLWIND')}</em>
        </div>
        <div className="ggu-flash" />
       </div>
      </div>
    </div>,
    document.body,
  )
}

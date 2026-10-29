// ─── 🧤🖤 ENTRADA ÚNICA DO LULUBABA FC: "O PAREDÃO ALVINEGRO" ──────────────────────────────────────────────────────
//
// Pedido do Diego (29/10, o dono subiu de Batismo pra 🖋 Fundador): *"entrada personalizada lembrando que ele é goleiro do
// Botafogo"*. A mascote do clube (arte do dono) é O Goleiro: cabelo platinado, uniforme preto do Botafogo, luvas com coroa,
// voando na bola. Então a entrada é um goleiro fechando o gol, no estádio alvinegro:
// 1) a noite cai em preto e branco: bandeirão listrado na arquibancada, a ESTRELA SOLITÁRIA acende no céu
// 2) a trave se desenha e vêm os chutes: o 1º no canto de cima, o 2º rasteiro — 🧤 DEFENDEU, a bola espirra pra fora
// 3) o 3º no ângulo: O GOLEIRO entra voando e pega a bola no ar (a bola da arte é a mesma do chute), tela treme, flash
// 4) o goleiro vai pro canto, o escudo acende com a estrela girando atrás; o placar "3 CHUTES · 3 DEFESAS"
// 5) a frase bate — AQUI NÃO PASSA NADA — e a faixa "CHEGOU NA SALA"
// Mesmo esquema das outras galas únicas: palco 420×760 escalado, camada fixa sem clique, fora do reducer, sem localStorage.
// Som: o CANTO que o Diego mandou (29/10, vídeo de 9 s da torcida do Botafogo → `sfx/torcida-lulubaba-v1.mp3`) — o mesmo da carreira dele.
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Escudo } from './escudos'
import { tr } from './lang'
import { playMp3Gala } from './sound'
import goleiroImg from './img/lulubaba-mascote.webp' // 440×342, O Goleiro voando na bola

export const LULUBABA_MS = 8600
const T = LULUBABA_MS
const pct = (ms: number) => (ms / T * 100).toFixed(1) + '%'
const PRETO = '#111', BRANCO = '#F4F4F2', GOLD = '#FFC400'
const sorte = (i: number) => ((i * 7919) % 997) / 997 // espalhado e sempre igual (a gala é igual pra todos)
// o goleiro no palco: a bola da arte fica em (88%, 12%) da imagem → é ali que o 3º chute termina
const MH = 262, MW = Math.round(MH * 440 / 342)
const BOLA3 = { x: 334, y: 262 }
const GL = { x: BOLA3.x - Math.round(MW * 0.88), y: BOLA3.y - Math.round(MH * 0.12) }
// a trave: de 44 a 376, travessão em 214, chão em 520
const TV = { x0: 44, x1: 376, y0: 214, y1: 520 }
// os três chutes: [começa, chega, alvo x, alvo y, pra onde espirra x, y]
const CHUTES: [number, number, number, number, number, number][] = [
  [1500, 1950, 96, 268, -60, 150],
  [2600, 3020, 318, 486, 470, 640],
  [3650, 4100, BOLA3.x, BOLA3.y, 0, 0],
]

const kfChute = (i: number) => {
  const [a, b, x, y, ex, ey] = CHUTES[i]
  const fim = i === 2
    ? `${pct(b)}{opacity:1;transform:translate(${x}px,${y}px) scale(.5)}${pct(b + 40)}{opacity:0;transform:translate(${x}px,${y}px) scale(.5)}`
    : `${pct(b)}{opacity:1;transform:translate(${x}px,${y}px) scale(.5)}${pct(b + 500)}{opacity:1;transform:translate(${ex}px,${ey}px) scale(.42) rotate(540deg)}${pct(b + 560)}{opacity:0;transform:translate(${ex}px,${ey}px) scale(.42)}`
  return `@keyframes glbChute${i}{0%,${pct(a - 10)}{opacity:0;transform:translate(210px,730px) scale(1.7)}${pct(a)}{opacity:1;transform:translate(210px,730px) scale(1.7)}${fim}100%{opacity:0}}`
}
const kfLuva = (i: number) => {
  const b = CHUTES[i][1]
  return `@keyframes glbLuva${i}{0%,${pct(b - 60)}{opacity:0;transform:scale(.3) rotate(-30deg)}${pct(b)}{opacity:1;transform:scale(1.25) rotate(8deg)}${pct(b + 160)}{transform:scale(1) rotate(0)}${pct(b + 520)}{opacity:1}${pct(b + 700)}{opacity:0;transform:scale(1.1)}100%{opacity:0}}`
}
const kfDefendeu = (i: number) => {
  const b = CHUTES[i][1]
  return `@keyframes glbDef${i}{0%,${pct(b)}{opacity:0;transform:scale(.4) rotate(-8deg)}${pct(b + 120)}{opacity:1;transform:scale(1.15) rotate(-4deg)}${pct(b + 260)}{transform:scale(1) rotate(-4deg)}${pct(b + 650)}{opacity:1}${pct(b + 820)}{opacity:0}100%{opacity:0}}`
}
const kfConta = (i: number) => {
  const b = CHUTES[i][1]
  return `@keyframes glbConta${i}{0%,${pct(b)}{opacity:.25;filter:grayscale(1);transform:scale(1)}${pct(b + 90)}{opacity:1;filter:none;transform:scale(1.5)}${pct(b + 260)}{transform:scale(1)}100%{opacity:1;filter:none;transform:scale(1)}}`
}

const CSS = `
.glb{position:fixed;inset:0;z-index:99990;pointer-events:none;overflow:hidden;animation:glbVis ${T}ms ease forwards}
@keyframes glbVis{0%{opacity:0}3%{opacity:1}95%{opacity:1}100%{opacity:0}}
.glb-ceu{position:absolute;inset:0;background:radial-gradient(ellipse at 50% 22%,#2c2c2c,#0d0d0d 55%,#000)}
.glb-palco{position:absolute;left:50%;top:50%;width:420px;height:760px;overflow:hidden}
.glb-treme{position:absolute;inset:0;animation:glbTreme ${T}ms linear forwards}
@keyframes glbTreme{0%,${pct(4090)}{transform:none}${pct(4130)}{transform:translate(-11px,6px)}${pct(4190)}{transform:translate(9px,-8px)}${pct(4250)}{transform:translate(-6px,-3px)}${pct(4320)}{transform:translate(4px,4px)}${pct(4400)}{transform:none}100%{transform:none}}
/* o bandeirão alvinegro na arquibancada, com o brilho passando */
.glb-band{position:absolute;left:-30px;right:-30px;top:0;height:250px;background:repeating-linear-gradient(90deg,#0b0b0b 0 34px,#e9e9e6 34px 68px);opacity:0;
  -webkit-mask:linear-gradient(180deg,#000 55%,transparent);mask:linear-gradient(180deg,#000 55%,transparent);animation:glbBand ${T}ms ease forwards}
@keyframes glbBand{0%,${pct(200)}{opacity:0;transform:translateY(-30px)}${pct(1000)}{opacity:.32;transform:none}${pct(4800)}{opacity:.32}${pct(5600)}{opacity:.16}100%{opacity:.16}}
.glb-band::after{content:"";position:absolute;inset:0;background:linear-gradient(100deg,transparent 30%,rgba(255,255,255,.55) 45%,transparent 60%);background-size:260% 100%;animation:glbBrilho 1800ms linear infinite}
@keyframes glbBrilho{0%{background-position:130% 0}100%{background-position:-130% 0}}
/* a torcida piscando (flashes de celular) */
.glb-flash-t{position:absolute;width:4px;height:4px;border-radius:50%;background:#fff;opacity:0;animation:glbPisca 1300ms ease-in-out infinite}
@keyframes glbPisca{0%,100%{opacity:0}50%{opacity:.9}}
/* a ESTRELA SOLITÁRIA */
.glb-estrela{position:absolute;left:50%;top:38px;width:74px;height:74px;margin-left:-37px;opacity:0;filter:drop-shadow(0 0 16px rgba(255,255,255,.9));animation:glbEstrela ${T}ms ease forwards}
@keyframes glbEstrela{0%,${pct(400)}{opacity:0;transform:scale(.2) rotate(-90deg)}${pct(1000)}{opacity:1;transform:scale(1.15) rotate(8deg)}${pct(1200)}{transform:scale(1) rotate(0)}${pct(4900)}{opacity:1;transform:scale(1)}${pct(5200)}{opacity:0;transform:scale(.4)}100%{opacity:0}}
/* refletores */
.glb-luz{position:absolute;top:-40px;width:150px;height:620px;background:linear-gradient(180deg,rgba(255,255,255,.34),transparent 80%);filter:blur(6px);opacity:0;animation:glbLuz ${T}ms ease forwards}
@keyframes glbLuz{0%,${pct(150)}{opacity:0}${pct(700)}{opacity:1}100%{opacity:.7}}
/* o gramado */
.glb-grama{position:absolute;left:-20px;right:-20px;top:${TV.y1}px;bottom:0;background:repeating-linear-gradient(180deg,#1f6b34 0 30px,#1a5c2c 30px 60px);border-top:3px solid rgba(255,255,255,.85)}
.glb-area{position:absolute;left:96px;right:96px;top:${TV.y1}px;height:74px;border:3px solid rgba(255,255,255,.75);border-top:none}
/* a trave: se desenha */
.glb-trave{position:absolute;left:${TV.x0}px;top:${TV.y0}px;width:${TV.x1 - TV.x0}px;height:${TV.y1 - TV.y0}px;border:9px solid ${BRANCO};border-bottom:none;border-radius:4px 4px 0 0;box-shadow:4px 4px 0 rgba(0,0,0,.6);opacity:0;animation:glbTrave ${T}ms cubic-bezier(.2,1.3,.4,1) forwards;transform-origin:50% 100%}
@keyframes glbTrave{0%,${pct(700)}{opacity:0;transform:scaleY(.1)}${pct(1150)}{opacity:1;transform:scaleY(1.04)}${pct(1300)}{transform:scaleY(1)}${pct(5000)}{opacity:1}${pct(5500)}{opacity:.35}100%{opacity:.35}}
.glb-rede{position:absolute;inset:0;background:repeating-linear-gradient(45deg,rgba(255,255,255,.18) 0 2px,transparent 2px 16px),repeating-linear-gradient(-45deg,rgba(255,255,255,.18) 0 2px,transparent 2px 16px);animation:glbRede ${T}ms ease forwards}
@keyframes glbRede{0%,${pct(4090)}{transform:none}${pct(4160)}{transform:scale(1.03,1.05)}${pct(4300)}{transform:scale(.99)}${pct(4420)}{transform:none}100%{transform:none}}
/* a bola */
.glb-bola{position:absolute;left:-26px;top:-26px;width:52px;height:52px;font-size:50px;line-height:52px;text-align:center;z-index:9;opacity:0;filter:drop-shadow(3px 4px 0 rgba(0,0,0,.5))}
${[0, 1, 2].map(i => kfChute(i)).join('\n')}
${[0, 1].map(i => kfLuva(i)).join('\n')}
${[0, 1, 2].map(i => kfDefendeu(i)).join('\n')}
${[0, 1, 2].map(i => kfConta(i)).join('\n')}
/* a luva que aparece no canto e espalma */
.glb-luva{position:absolute;width:96px;height:96px;margin:-48px 0 0 -48px;font-size:78px;line-height:96px;text-align:center;z-index:10;opacity:0;filter:drop-shadow(0 0 14px rgba(255,255,255,.8)) drop-shadow(3px 4px 0 rgba(0,0,0,.55))}
.glb-luva::after{content:"👑";position:absolute;left:30px;top:-6px;font-size:28px;line-height:1}
.glb-def{position:absolute;z-index:12;font:700 34px/1 Oswald,sans-serif;color:${PRETO};background:${BRANCO};border:4px solid ${PRETO};border-radius:12px;padding:5px 12px 7px;box-shadow:4px 4px 0 #000;opacity:0;white-space:nowrap}
.glb-def.ouro{background:${GOLD};font-size:28px}
/* O GOLEIRO voando no ângulo */
.glb-gol{position:absolute;left:${GL.x}px;top:${GL.y}px;width:${MW}px;height:${MH}px;z-index:11;opacity:0;transform-origin:88% 12%;animation:glbGoleiro ${T}ms cubic-bezier(.25,1.1,.45,1) forwards}
@keyframes glbGoleiro{0%,${pct(3880)}{opacity:0;transform:translate(-420px,190px) rotate(-14deg) scale(.8)}${pct(3920)}{opacity:1;transform:translate(-400px,180px) rotate(-14deg) scale(.82)}${pct(4110)}{opacity:1;transform:translate(0,0) rotate(0) scale(1)}${pct(4250)}{transform:translate(8px,-4px) rotate(2deg) scale(1.03)}${pct(4400)}{transform:translate(0,0) rotate(0) scale(1)}${pct(5000)}{opacity:1;transform:translate(0,0) scale(1)}${pct(5600)}{opacity:1;transform:translate(-161px,225px) scale(.55)}100%{opacity:1;transform:translate(-161px,225px) scale(.55)}}
.glb-gol img{width:100%;height:100%;display:block;filter:drop-shadow(5px 7px 0 rgba(0,0,0,.6))}
/* o rastro do voo */
.glb-rastro{position:absolute;left:${GL.x - 260}px;top:${GL.y + 120}px;width:330px;height:16px;border-radius:16px;z-index:8;background:linear-gradient(90deg,transparent,rgba(255,255,255,.8));transform:rotate(-24deg);transform-origin:100% 50%;opacity:0;animation:glbRastro ${T}ms ease-out forwards}
@keyframes glbRastro{0%,${pct(3800)}{opacity:0;transform:rotate(-24deg) scaleX(.2)}${pct(4050)}{opacity:.9;transform:rotate(-24deg) scaleX(1)}${pct(4450)}{opacity:0;transform:rotate(-24deg) scaleX(1.1)}100%{opacity:0}}
/* o impacto da pegada */
.glb-onda{position:absolute;left:${BOLA3.x}px;top:${BOLA3.y}px;width:60px;height:60px;margin:-30px 0 0 -30px;border-radius:50%;border:6px solid #fff;z-index:12;opacity:0;animation:glbOnda ${T}ms ease-out forwards}
@keyframes glbOnda{0%,${pct(4090)}{opacity:0;transform:scale(.3)}${pct(4140)}{opacity:1;transform:scale(1)}${pct(4700)}{opacity:0;transform:scale(5)}100%{opacity:0}}
.glb-fagulha{position:absolute;left:${BOLA3.x}px;top:${BOLA3.y}px;width:10px;height:10px;margin:-5px 0 0 -5px;border-radius:50%;background:${GOLD};z-index:12;opacity:0;animation:glbFagulha 800ms ease-out both}
@keyframes glbFagulha{0%{opacity:0;transform:translate(0,0) scale(.5)}10%{opacity:1}100%{opacity:0;transform:translate(var(--dx),var(--dy)) scale(1.4)}}
.glb-branco{position:absolute;inset:0;z-index:20;background:#fff;opacity:0;animation:glbBranco ${T}ms linear forwards}
@keyframes glbBranco{0%,${pct(4100)}{opacity:0}${pct(4140)}{opacity:.75}${pct(4400)}{opacity:0}100%{opacity:0}}
/* o placar de defesas */
.glb-placar{position:absolute;right:14px;top:128px;z-index:13;background:${PRETO};border:3px solid ${BRANCO};border-radius:12px;padding:4px 8px 5px;text-align:center;opacity:0;animation:glbPlacar ${T}ms ease forwards}
@keyframes glbPlacar{0%,${pct(1300)}{opacity:0;transform:translateX(40px)}${pct(1500)}{opacity:1;transform:none}${pct(5000)}{opacity:1}${pct(5300)}{opacity:0}100%{opacity:0}}
.glb-placar small{display:block;font:700 10px Oswald,sans-serif;letter-spacing:.18em;color:${GOLD}}
.glb-placar span{display:inline-block;font-size:22px;margin:0 1px}
/* o escudo com a estrela girando atrás */
.glb-esc{position:absolute;left:50%;top:150px;width:230px;height:230px;margin-left:-115px;z-index:6;display:flex;align-items:center;justify-content:center;opacity:0;
  filter:drop-shadow(0 0 26px rgba(255,255,255,.7)) drop-shadow(5px 6px 0 rgba(0,0,0,.55));animation:glbEsc ${T}ms cubic-bezier(.2,1.3,.4,1) forwards}
@keyframes glbEsc{0%,${pct(5000)}{opacity:0;transform:scale(.2) translateY(-60px)}${pct(5450)}{opacity:1;transform:scale(1.12)}${pct(5700)}{transform:scale(1)}100%{opacity:1;transform:scale(1)}}
.glb-estrelao{position:absolute;left:50%;top:265px;width:380px;height:380px;margin:-190px 0 0 -190px;z-index:5;opacity:0;animation:glbEstrelao ${T}ms linear forwards}
@keyframes glbEstrelao{0%,${pct(5000)}{opacity:0;transform:rotate(0) scale(.5)}${pct(5400)}{opacity:.55;transform:rotate(40deg) scale(1)}100%{opacity:.55;transform:rotate(200deg) scale(1)}}
/* a frase e a faixa */
.glb-frase{position:absolute;left:0;right:0;top:58px;z-index:13;text-align:center;font:700 33px/1.05 Oswald,sans-serif;color:${BRANCO};text-shadow:3px 3px 0 #000;letter-spacing:.02em}
.glb-frase span{display:inline-block;opacity:0;animation:glbPalavra ${T}ms cubic-bezier(.2,1.5,.4,1) forwards}
@keyframes glbPalavra{0%{opacity:0;transform:scale(2.2)}6%{opacity:1;transform:scale(.94)}9%{transform:none}96%{opacity:1}100%{opacity:1}}
.glb-frase em{font-style:normal;color:${GOLD}}
.glb-faixa{position:absolute;left:24px;right:24px;top:612px;z-index:14;background:${PRETO};border:3px solid ${BRANCO};border-radius:16px;padding:8px 8px 9px;text-align:center;opacity:0;animation:glbFaixa ${T}ms cubic-bezier(.2,1.3,.4,1) forwards}
@keyframes glbFaixa{0%,${pct(6100)}{opacity:0;transform:scale(.4)}${pct(6450)}{opacity:1;transform:scale(1.06)}${pct(6650)}{transform:scale(1)}${pct(8200)}{opacity:1}100%{opacity:0}}
.glb-faixa small{display:block;font:700 13px Oswald,sans-serif;letter-spacing:.22em;color:${GOLD}}
.glb-faixa b{display:block;font:700 27px/1.05 Oswald,sans-serif;color:#fff;text-transform:uppercase;margin-top:2px}
.glb-faixa em{display:inline-block;font-style:normal;font:700 13px Oswald,sans-serif;color:${PRETO};background:${BRANCO};border-radius:7px;padding:2px 9px;margin-top:5px;letter-spacing:.1em}
@media (prefers-reduced-motion:reduce){.glb-band,.glb-luz,.glb-flash-t,.glb-bola,.glb-luva,.glb-def,.glb-rastro,.glb-onda,.glb-fagulha,.glb-branco,.glb-placar,.glb-estrelao,.glb-estrela{display:none}.glb-treme,.glb-rede{animation:none}.glb-esc,.glb-gol,.glb-trave,.glb-faixa,.glb-frase span{animation:none;opacity:1}}
`

function useEscala() {
  const calc = () => Math.min(window.innerWidth / 420, window.innerHeight / 760)
  const [s, setS] = useState(calc)
  useEffect(() => { const f = () => setS(calc()); window.addEventListener('resize', f); return () => window.removeEventListener('resize', f) }, [])
  return s
}

const Estrela = ({ cor = BRANCO }: { cor?: string }) => (
  <svg viewBox="-50 -50 100 100" width="100%" height="100%"><path d="M0-48 L11.3-15.5 L45.6-14.8 L18.3 5.9 L28.2 38.8 L0 19.2 L-28.2 38.8 L-18.3 5.9 L-45.6-14.8 L-11.3-15.5Z" fill={cor} stroke="#000" strokeWidth="3" strokeLinejoin="round" /></svg>
)

export function GalaLulubaba({ clube, chave, mostra, grito }: { clube: string; chave: string; mostra: string; grito: string }) {
  const s = useEscala()
  void grito
  useEffect(() => playMp3Gala(`${import.meta.env.BASE_URL}sfx/torcida-lulubaba-v1.mp3`, T), [chave])
  const frase = [tr('AQUI', 'NOTHING'), tr('NÃO PASSA', 'GETS'), tr('NADA', 'PAST HIM')]
  const falas = [tr('DEFENDEU!', 'SAVED!'), tr('ESPALMOU!', 'PARRIED!'), tr('PEGOU NO ÂNGULO!', 'TOP CORNER, CAUGHT!')]
  // onde cada fala aparece (perto do canto, sem sair da tela)
  const posFala = [{ left: 40, top: 330 }, { left: 150, top: 410 }, { left: 18, top: 156 }]
  return createPortal(
    <div key={chave} className="glb" aria-hidden>
      <style>{CSS}</style>
      <div className="glb-ceu" />
      <div className="glb-palco" style={{ transform: `translate(-50%,-50%) scale(${s})` }}>
       <div className="glb-treme">
        <div className="glb-band" />
        {Array.from({ length: 22 }, (_, i) => (
          <i key={i} className="glb-flash-t" style={{ left: 8 + Math.round(sorte(i + 1) * 404), top: 14 + Math.round(sorte(i * 7 + 3) * 170), animationDelay: `${Math.round(sorte(i * 13 + 5) * 1300)}ms` }} />
        ))}
        <div className="glb-luz" style={{ left: -30, transform: 'rotate(14deg)' }} />
        <div className="glb-luz" style={{ right: -30, transform: 'rotate(-14deg)' }} />
        <div className="glb-estrela"><Estrela /></div>
        <div className="glb-grama" />
        <div className="glb-area" />
        <div className="glb-trave"><div className="glb-rede" /></div>
        <div className="glb-estrelao"><Estrela cor="rgba(255,255,255,.9)" /></div>
        <div className="glb-esc"><Escudo nome={clube} size={220} /></div>
        <div className="glb-placar">
          <small>{tr('DEFESAS', 'SAVES')}</small>
          {[0, 1, 2].map(i => <span key={i} style={{ animation: `glbConta${i} ${T}ms ease forwards` }}>🧤</span>)}
        </div>
        <div className="glb-rastro" />
        {[0, 1, 2].map(i => <div key={i} className="glb-bola" style={{ animation: `glbChute${i} ${T}ms cubic-bezier(.35,.1,.6,1) forwards` }}>⚽</div>)}
        {[0, 1].map(i => <div key={i} className="glb-luva" style={{ left: CHUTES[i][2], top: CHUTES[i][3], animation: `glbLuva${i} ${T}ms cubic-bezier(.2,1.4,.4,1) forwards` }}>🧤</div>)}
        <div className="glb-gol"><img src={goleiroImg} alt="" /></div>
        <div className="glb-onda" />
        {Array.from({ length: 12 }, (_, i) => {
          const ang = (i / 12) * Math.PI * 2
          return <i key={i} className="glb-fagulha" style={{ ['--dx' as string]: `${Math.round(Math.cos(ang) * (50 + sorte(i + 4) * 50))}px`, ['--dy' as string]: `${Math.round(Math.sin(ang) * (50 + sorte(i * 3) * 50))}px`, animationDelay: `${4100 + Math.round(sorte(i * 5) * 80)}ms` }} />
        })}
        {[0, 1, 2].map(i => <div key={i} className={`glb-def${i === 2 ? ' ouro' : ''}`} style={{ ...posFala[i], animation: `glbDef${i} ${T}ms cubic-bezier(.2,1.5,.4,1) forwards` }}>{falas[i]}</div>)}
        <div className="glb-frase">
          {frase.map((p, i) => <span key={i} style={{ animationDelay: `${5500 + i * 260}ms`, marginRight: 8 }}>{i === 2 ? <em>{p}</em> : p}</span>)}
        </div>
        <div className="glb-faixa">
          <small>{tr('🧤 CHEGOU NA SALA', '🧤 JUST ARRIVED')}</small>
          <b>{mostra}</b>
          <em>{tr('FECHOU O GOL', 'SHUT THE GOAL')}</em>
        </div>
        <div className="glb-branco" />
       </div>
      </div>
    </div>,
    document.body,
  )
}

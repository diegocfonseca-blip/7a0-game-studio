// ─── 🦊👑 ENTRADA ÚNICA DO CABULOSO JP: "A RAPOSA COROADA" ──────────────────────────────────────────────────────────
//
// Pedido do Diego (21/11, batismo FUNDADOR do rafaelazevedo455): *"tb precisaremos fazer a entrada de gala personalizada dele"*.
// Roteiro em 6 quadros (`scripts/mockups/gala-cabuloso.png`) feito a partir da arte do dono: a raposa de braços cruzados com o
// pé na bola, a coroa dourada e as 5 estrelas do Cruzeiro do Sul no escudo e na camisa. Nada inventado sobre a pessoa nem lugar.
// 1) noite azul: as 5 estrelas do Cruzeiro do Sul acendem uma por uma ("plim" em cada)
// 2) riscos de luz ligam as estrelas e a cruz pisca; a tela dá uma tremida curta
// 3) a lua sobe atrás do morro e a SILHUETA da raposa aparece em cima, contra a lua — "AUUUU!"
// 4) a coroa cai do céu girando e encaixa na cabeça; a raposa ganha cor, de braços cruzados
// 5) pé na bola: ela cresce pra câmera, faíscas azuis saem da bola — "É CABULOSO!"
// 6) o escudo gira e para no centro com o brilho das estrelas atrás, e a faixa azul e branca "CHEGOU NA SALA"
// Som: o canto do clube (`sfx/torcida-cabuloso-v1.mp3`, os 14 primeiros segundos do vídeo que o Diego mandou em 22/11 — o mesmo da
// carreira) toca a gala inteira e abaixa no fim, por cima dos "plim" das estrelas.
// Mesmo esquema das outras galas únicas: palco 420×760 escalado, camada fixa sem clique, fora do reducer, sem localStorage.
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Escudo } from './escudos'
import { tr } from './lang'
import { playEstrela, playMp3Gala } from './sound'
import raposaImg from './img/cabuloso-mascote.webp' // 172×440, a raposa de braços cruzados com o pé na bola

export const CABULOSO_MS = 9000
const T = CABULOSO_MS
const pct = (ms: number) => (ms / T * 100).toFixed(1) + '%'
const AZUL = '#00208C', BRANCO = '#EFEEF0', OURO = '#FFC400', LUZ = '#9CC4FF'
const RH = 380, RW = Math.round(RH * 172 / 440), RX = 210 - RW / 2, RY = 610 - RH // a raposa em pé no morro
const ESTRELAS: { x: number; y: number; s: number }[] = [
  { x: 210, y: 130, s: 46 }, // cabeça da cruz
  { x: 292, y: 262, s: 42 }, // braço direito
  { x: 128, y: 262, s: 40 }, // braço esquerdo
  { x: 210, y: 392, s: 44 }, // pé da cruz
  { x: 240, y: 296, s: 22 }, // a pequenininha (Intrometida)
]
const ACENDE = (i: number) => 300 + i * 330
const CRUZ = 1950, LUA = 2700, SOMBRA = 3200, COROA = 4300, COR = 4950, BOLA = 5600, ESCUDO = 6900, FAIXA = 7400

const CSS = `
.gcb{position:fixed;inset:0;z-index:99990;pointer-events:none;overflow:hidden;animation:gcbVis ${T}ms ease forwards}
@keyframes gcbVis{0%{opacity:0}3%{opacity:1}95%{opacity:1}100%{opacity:0}}
.gcb-ceu{position:absolute;inset:0;background:radial-gradient(ellipse at 50% 30%,#0d2a7a 0%,#06123f 55%,#020617 100%)}
.gcb-palco{position:absolute;left:50%;top:50%;width:420px;height:760px;overflow:hidden}
.gcb-treme{position:absolute;inset:0;animation:gcbTreme ${T}ms linear forwards}
@keyframes gcbTreme{0%,${pct(CRUZ + 300)}{transform:none}${pct(CRUZ + 340)}{transform:translate(6px,4px)}${pct(CRUZ + 420)}{transform:translate(-5px,-3px)}${pct(CRUZ + 500)}{transform:translate(3px,2px)}${pct(CRUZ + 580)}{transform:none}
  ${pct(COROA + 640)}{transform:none}${pct(COROA + 680)}{transform:translate(0,6px)}${pct(COROA + 760)}{transform:translate(0,-3px)}${pct(COROA + 840)}{transform:none}100%{transform:none}}
.gcb-pontos{position:absolute;inset:0;z-index:0;opacity:.7;background-image:radial-gradient(1.5px 1.5px at 20px 30px,#fff,transparent),radial-gradient(1px 1px at 120px 80px,#fff,transparent),radial-gradient(1.5px 1.5px at 180px 20px,#fff,transparent),radial-gradient(1px 1px at 60px 140px,#fff,transparent),radial-gradient(1px 1px at 200px 160px,#fff,transparent);background-size:220px 200px;animation:gcbPisca 1800ms ease-in-out infinite alternate}
@keyframes gcbPisca{0%{opacity:.45}100%{opacity:.85}}
.gcb-legenda{position:absolute;left:0;right:0;z-index:8;text-align:center;font:700 15px Oswald,sans-serif;letter-spacing:.3em;color:#cfe0ff;text-shadow:2px 2px 0 #000;opacity:0}
.gcb-legenda b{display:block;font:700 48px/1 Oswald,sans-serif;letter-spacing:.03em;color:#fff;margin-top:6px}
.gcb-leg1{top:520px;animation:gcbLeg1 ${T}ms ease forwards}
@keyframes gcbLeg1{0%,${pct(400)}{opacity:0;transform:translateY(10px)}${pct(800)}{opacity:1;transform:none}${pct(CRUZ + 700)}{opacity:1}${pct(LUA)}{opacity:0}100%{opacity:0}}
/* as 5 estrelas do Cruzeiro do Sul */
.gcb-cruzeiro{position:absolute;inset:0;z-index:3;animation:gcbCruz ${T}ms ease forwards}
@keyframes gcbCruz{0%,${pct(LUA)}{opacity:1;transform:none}${pct(LUA + 600)}{opacity:.28;transform:translateY(-70px) scale(.8)}${pct(ESCUDO)}{opacity:.28;transform:translateY(-70px) scale(.8)}${pct(ESCUDO + 300)}{opacity:0}100%{opacity:0}}
.gcb-est{position:absolute;line-height:1;color:#fff;text-shadow:0 0 12px ${LUZ},0 0 26px #4f86ff;opacity:0;animation:gcbEst ${T}ms ease forwards}
@keyframes gcbEst{0%{opacity:0;transform:scale(.2)}2%{opacity:0}5%{opacity:1;transform:scale(1.5)}8%{transform:scale(1)}100%{opacity:1;transform:scale(1)}}
.gcb-linhas{position:absolute;inset:0;z-index:2;opacity:0;animation:gcbLinhas ${T}ms ease forwards}
@keyframes gcbLinhas{0%,${pct(CRUZ)}{opacity:0}${pct(CRUZ + 250)}{opacity:1}${pct(CRUZ + 330)}{opacity:.35}${pct(CRUZ + 410)}{opacity:1}100%{opacity:1}}
.gcb-linhas line{stroke:${LUZ};stroke-width:3;stroke-linecap:round;stroke-dasharray:300;stroke-dashoffset:300;filter:drop-shadow(0 0 6px #4f86ff);animation:gcbRisco ${T}ms ease forwards}
@keyframes gcbRisco{0%,${pct(CRUZ)}{stroke-dashoffset:300}${pct(CRUZ + 300)}{stroke-dashoffset:0}100%{stroke-dashoffset:0}}
/* lua, morro e a sombra */
.gcb-lua{position:absolute;left:50%;top:330px;width:250px;height:250px;margin-left:-125px;border-radius:50%;z-index:1;opacity:0;
  background:radial-gradient(circle at 42% 40%,#fff,#e3eaff 55%,#a7b9ec);box-shadow:0 0 80px rgba(167,185,236,.9);animation:gcbLua ${T}ms cubic-bezier(.3,1,.4,1) forwards}
@keyframes gcbLua{0%,${pct(LUA)}{opacity:0;transform:translateY(160px)}${pct(LUA + 700)}{opacity:1;transform:none}${pct(COR)}{opacity:1}${pct(COR + 500)}{opacity:.25}${pct(ESCUDO)}{opacity:0}100%{opacity:0}}
.gcb-morro{position:absolute;left:-60px;right:-60px;top:600px;bottom:-40px;z-index:4;border-radius:50% 50% 0 0;background:linear-gradient(180deg,#0a1a4a,#020617)}
.gcb-raposa{position:absolute;left:${RX}px;top:${RY}px;width:${RW}px;height:${RH}px;z-index:6;transform-origin:50% 100%;opacity:0;animation:gcbRaposa ${T}ms cubic-bezier(.25,1,.45,1) forwards}
@keyframes gcbRaposa{0%,${pct(SOMBRA)}{opacity:0;transform:translateY(40px)}${pct(SOMBRA + 450)}{opacity:1;transform:none}
  ${pct(BOLA)}{opacity:1;transform:none}${pct(BOLA + 400)}{opacity:1;transform:translateY(40px) scale(1.28)}${pct(ESCUDO - 200)}{opacity:1;transform:translateY(40px) scale(1.28)}
  ${pct(ESCUDO + 300)}{opacity:1;transform:translate(-138px,60px) scale(.62)}100%{opacity:1;transform:translate(-138px,60px) scale(.62)}}
.gcb-raposa img{width:100%;height:100%;display:block;animation:gcbCor ${T}ms ease forwards}
@keyframes gcbCor{0%,${pct(COR)}{filter:brightness(0) drop-shadow(0 0 0 transparent)}${pct(COR + 120)}{filter:brightness(2.4) drop-shadow(0 0 30px ${LUZ})}${pct(COR + 500)}{filter:brightness(1) drop-shadow(0 0 22px rgba(79,134,255,.75))}100%{filter:brightness(1) drop-shadow(0 0 18px rgba(79,134,255,.6)) drop-shadow(4px 6px 0 rgba(0,0,0,.5))}}
.gcb-uivo{position:absolute;left:0;right:0;top:120px;z-index:8;text-align:center;font:700 54px/1 Oswald,sans-serif;color:#fff;letter-spacing:.06em;text-shadow:3px 3px 0 #000,0 0 18px ${LUZ};opacity:0;animation:gcbUivo ${T}ms ease forwards}
@keyframes gcbUivo{0%,${pct(SOMBRA + 500)}{opacity:0;transform:scale(.6)}${pct(SOMBRA + 750)}{opacity:1;transform:scale(1.08)}${pct(COROA - 100)}{opacity:1;transform:scale(1)}${pct(COROA + 100)}{opacity:0}100%{opacity:0}}
/* a coroa */
.gcb-coroa{position:absolute;left:${Math.round(RW * 0.61) - 32}px;top:-46px;width:64px;height:64px;z-index:7;font-size:58px;line-height:64px;text-align:center;
  filter:drop-shadow(0 0 14px ${OURO}) drop-shadow(2px 3px 0 #000);opacity:0;animation:gcbCoroa ${T}ms cubic-bezier(.3,1.25,.5,1) forwards}
@keyframes gcbCoroa{0%,${pct(COROA)}{opacity:0;transform:translateY(-420px) rotate(-540deg) scale(.6)}${pct(COROA + 600)}{opacity:1;transform:translateY(0) rotate(0) scale(1.1)}${pct(COROA + 760)}{opacity:1;transform:scale(1)}100%{opacity:1;transform:scale(1)}}
.gcb-flash{position:absolute;inset:0;z-index:20;background:#e8f0ff;opacity:0;animation:gcbFlash ${T}ms linear forwards}
@keyframes gcbFlash{0%,${pct(COR)}{opacity:0}${pct(COR + 60)}{opacity:.7}${pct(COR + 300)}{opacity:0}${pct(ESCUDO)}{opacity:0}${pct(ESCUDO + 60)}{opacity:.45}${pct(ESCUDO + 260)}{opacity:0}100%{opacity:0}}
/* pé na bola: faíscas azuis + o grito */
.gcb-faisca{position:absolute;left:${Math.round(RX + RW * 0.22)}px;top:${RY + RH - 40}px;width:12px;height:12px;margin:-6px 0 0 -6px;border-radius:50%;z-index:9;background:#fff;box-shadow:0 0 12px ${LUZ},0 0 24px #4f86ff;opacity:0}
.gcb-grito{position:absolute;left:0;right:0;top:40px;z-index:10;text-align:center;opacity:0;animation:gcbGrito ${T}ms cubic-bezier(.2,1.3,.4,1) forwards}
@keyframes gcbGrito{0%,${pct(BOLA + 200)}{opacity:0;transform:scale(.4) rotate(-6deg)}${pct(BOLA + 500)}{opacity:1;transform:scale(1.1) rotate(-3deg)}${pct(BOLA + 700)}{transform:scale(1) rotate(-3deg)}${pct(ESCUDO - 150)}{opacity:1}${pct(ESCUDO + 50)}{opacity:0}100%{opacity:0}}
.gcb-grito small{display:block;font:700 15px Oswald,sans-serif;letter-spacing:.3em;color:${OURO};text-shadow:2px 2px 0 #000}
.gcb-grito b{display:block;font:700 58px/1 Oswald,sans-serif;color:#fff;letter-spacing:.02em;text-shadow:4px 4px 0 ${AZUL},6px 6px 0 #000}
/* o escudo */
.gcb-brilho{position:absolute;left:50%;top:300px;width:500px;height:500px;margin:-250px 0 0 -250px;z-index:9;border-radius:50%;
  background:repeating-conic-gradient(rgba(156,196,255,.5) 0 8deg,rgba(0,32,140,.25) 8deg 24deg);-webkit-mask:radial-gradient(circle,#000 26%,transparent 68%);mask:radial-gradient(circle,#000 26%,transparent 68%);opacity:0;animation:gcbBrilho ${T}ms linear forwards}
@keyframes gcbBrilho{0%,${pct(ESCUDO)}{opacity:0;transform:rotate(0) scale(.5)}${pct(ESCUDO + 400)}{opacity:1;transform:rotate(30deg) scale(1)}100%{opacity:1;transform:rotate(140deg) scale(1)}}
.gcb-esc{position:absolute;left:50%;top:160px;width:260px;height:290px;margin-left:-130px;z-index:10;display:flex;align-items:center;justify-content:center;opacity:0;
  filter:drop-shadow(0 0 26px rgba(156,196,255,.8)) drop-shadow(5px 6px 0 rgba(0,0,0,.55));animation:gcbEsc ${T}ms cubic-bezier(.2,1.3,.4,1) forwards}
@keyframes gcbEsc{0%,${pct(ESCUDO)}{opacity:0;transform:scale(.2) rotateY(540deg)}${pct(ESCUDO + 500)}{opacity:1;transform:scale(1.12) rotateY(0)}${pct(ESCUDO + 750)}{transform:scale(1)}100%{opacity:1;transform:scale(1)}}
.gcb-faixa{position:absolute;left:20px;right:20px;top:630px;z-index:15;background:${AZUL};border:4px solid ${BRANCO};border-radius:16px;box-shadow:4px 4px 0 #000;padding:8px 8px 9px;text-align:center;opacity:0;animation:gcbFaixa ${T}ms cubic-bezier(.2,1.3,.4,1) forwards}
@keyframes gcbFaixa{0%,${pct(FAIXA)}{opacity:0;transform:scale(.4)}${pct(FAIXA + 350)}{opacity:1;transform:scale(1.06)}${pct(FAIXA + 550)}{transform:scale(1)}${pct(8700)}{opacity:1}100%{opacity:0}}
.gcb-faixa small{display:block;font:700 13px Oswald,sans-serif;letter-spacing:.22em;color:${LUZ}}
.gcb-faixa b{display:block;font:700 27px/1.05 Oswald,sans-serif;color:#fff;margin-top:2px}
.gcb-faixa em{display:inline-block;font-style:normal;font:700 13px Oswald,sans-serif;color:#0C0C0C;background:linear-gradient(90deg,${OURO},#fff1b8,${OURO});border-radius:7px;padding:2px 9px;margin-top:5px;letter-spacing:.14em}
@media (prefers-reduced-motion:reduce){.gcb-legenda,.gcb-cruzeiro,.gcb-linhas,.gcb-lua,.gcb-uivo,.gcb-coroa,.gcb-flash,.gcb-faisca,.gcb-grito,.gcb-brilho{display:none}.gcb-treme{animation:none}.gcb-esc,.gcb-faixa{animation:none;opacity:1}.gcb-raposa{animation:none;opacity:1;transform:translate(-138px,60px) scale(.62)}.gcb-raposa img{animation:none}}
`

function useEscala() {
  const calc = () => Math.min(window.innerWidth / 420, window.innerHeight / 760)
  const [s, setS] = useState(calc)
  useEffect(() => { const f = () => setS(calc()); window.addEventListener('resize', f); return () => window.removeEventListener('resize', f) }, [])
  return s
}

// as faíscas que saem da bola: direção e atraso fixos (sem sorteio, toda tela vê igual)
const FAISCAS = Array.from({ length: 10 }, (_, i) => {
  const a = (-160 + i * 16) * Math.PI / 180, d = 90 + (i % 3) * 40
  return { dx: Math.round(Math.cos(a) * d), dy: Math.round(Math.sin(a) * d), atraso: BOLA + 350 + (i % 4) * 60 }
})

export function GalaCabuloso({ clube, chave, mostra, grito }: { clube: string; chave: string; mostra: string; grito: string }) {
  const s = useEscala()
  void grito
  useEffect(() => playMp3Gala(`${import.meta.env.BASE_URL}sfx/torcida-cabuloso-v1.mp3`, T), [chave]) // 📣 o canto do clube (a sala inteira ouve; respeita o mudo)
  // um "plim" em cada estrela que acende (som sintetizado, respeita o mudo)
  useEffect(() => {
    const ids = ESTRELAS.map((_, i) => window.setTimeout(() => playEstrela(), ACENDE(i)))
    return () => ids.forEach(id => window.clearTimeout(id))
  }, [chave])
  return createPortal(
    <div key={chave} className="gcb" aria-hidden>
      <style>{CSS}</style>
      <style>{FAISCAS.map((f, i) => `@keyframes gcbF${i}{0%,${pct(f.atraso)}{opacity:0;transform:none}${pct(f.atraso + 80)}{opacity:1}${pct(f.atraso + 700)}{opacity:0;transform:translate(${f.dx}px,${f.dy}px) scale(.3)}100%{opacity:0}}`).join('')}</style>
      <div className="gcb-ceu" />
      <div className="gcb-palco" style={{ transform: `translate(-50%,-50%) scale(${s})` }}>
       <div className="gcb-treme">
        <div className="gcb-pontos" />
        <div className="gcb-lua" />
        <div className="gcb-cruzeiro">
          <svg className="gcb-linhas" viewBox="0 0 420 760" width="420" height="760" aria-hidden>
            <line x1={ESTRELAS[0].x} y1={ESTRELAS[0].y} x2={ESTRELAS[3].x} y2={ESTRELAS[3].y} />
            <line x1={ESTRELAS[2].x} y1={ESTRELAS[2].y} x2={ESTRELAS[1].x} y2={ESTRELAS[1].y} />
          </svg>
          {ESTRELAS.map((e, i) => (
            <span key={i} className="gcb-est" style={{ left: e.x - e.s / 2, top: e.y - e.s / 2, fontSize: e.s, width: e.s, height: e.s, animationDelay: `${ACENDE(i) - 0.02 * T}ms` }}>★</span>
          ))}
        </div>
        <div className="gcb-legenda gcb-leg1">{tr('O CÉU ACENDE', 'THE SKY LIGHTS UP')}<b>{tr('MEIA-NOITE', 'MIDNIGHT')}</b></div>
        <div className="gcb-morro" />
        <div className="gcb-raposa"><img src={raposaImg} alt="" /><div className="gcb-coroa">👑</div></div>
        <div className="gcb-uivo">AUUUU!</div>
        {FAISCAS.map((_, i) => <i key={i} className="gcb-faisca" style={{ animation: `gcbF${i} ${T}ms ease-out forwards` }} />)}
        <div className="gcb-grito"><small>{tr('PÉ NA BOLA', 'FOOT ON THE BALL')}</small><b>{tr('É CABULOSO!', 'CABULOSO!')}</b></div>
        <div className="gcb-brilho" />
        <div className="gcb-esc"><Escudo nome={clube} size={250} /></div>
        <div className="gcb-faixa">
          <small>{tr('🦊 CHEGOU NA SALA', '🦊 JUST ARRIVED')}</small>
          <b>{mostra}</b>
          <em>{tr('A RAPOSA COROADA', 'THE CROWNED FOX')}</em>
        </div>
        <div className="gcb-flash" />
       </div>
      </div>
    </div>,
    document.body,
  )
}

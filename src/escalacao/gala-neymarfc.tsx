// ─── 🐐👑 ENTRADA ÚNICA DO NEYMAR_FC: "O G.O.A.T. CHEGOU" ────────────────────────────────────────────────────────
//
// Pedido do Diego (29/10, o dono subiu de Batismo pra 🖋 Fundador): *"faça gala personalizada pra ele"*. A mascote do clube (arte
// do dono) é O Bode Rei: o bode de chifre dourado com a manta NJ e o camisa 10 de creme sentado nele. Bode em inglês é GOAT — e
// G.O.A.T. é "o maior de todos os tempos". Então a entrada é a coroação do bode:
// 1) escuro, holofote dourado, poeira de ouro no ar
// 2) as letras G · O · A · T caem uma por uma e CARIMBAM a tela (cada uma treme o chão), com a legenda "o maior de todos"
// 3) o 10 gigante dourado acende atrás, o pedestal sobe e O BODE REI chega nele; o balão "BÉÉÉ!" (zoeira)
// 4) a COROA desce girando do céu e pousa na cabeça do bode, chuva de moedas de ouro, flash
// 5) o Bode vai pro canto, o escudo acende com os raios dourados girando atrás
// 6) a frase bate — SAI DA FRENTE QUE O BODE CHEGOU — e a faixa "CHEGOU NA SALA · O G.O.A.T."
// Mesmo esquema das outras galas únicas: palco 420×760 escalado, camada fixa sem clique, fora do reducer, sem localStorage.
// Som: o canto do São Paulo, o MESMO do Wen Milan B (`sfx/torcida-spfc-wen-v1.mp3`), pedido do Diego — o mesmo da carreira dele.
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Escudo } from './escudos'
import { tr } from './lang'
import { playMp3Gala } from './sound'
import bodeImg from './img/neymarfc-mascote.webp' // 440×415, O Bode Rei com o camisa 10

export const NEYMARFC_MS = 8600
const T = NEYMARFC_MS
const pct = (ms: number) => (ms / T * 100).toFixed(1) + '%'
const OURO = '#E7B53C', OURO_CLARO = '#FFE08A', CREME = '#F2D8B8'
const sorte = (i: number) => ((i * 7919) % 997) / 997 // espalhado e sempre igual (a gala é igual pra todos)
const MH = 290, MW = Math.round(MH * 440 / 415)
const LETRAS = ['G', 'O', 'A', 'T']
const CAI = (i: number) => 700 + i * 380 // quando cada letra carimba

const CSS = `
.gnf{position:fixed;inset:0;z-index:99990;pointer-events:none;overflow:hidden;animation:gnfVis ${T}ms ease forwards}
@keyframes gnfVis{0%{opacity:0}3%{opacity:1}95%{opacity:1}100%{opacity:0}}
.gnf-ceu{position:absolute;inset:0;background:radial-gradient(ellipse at 50% 38%,#3a2a0e,#140d03 55%,#050301)}
.gnf-palco{position:absolute;left:50%;top:50%;width:420px;height:760px;overflow:hidden}
.gnf-treme{position:absolute;inset:0;animation:gnfTreme ${T}ms linear forwards}
@keyframes gnfTreme{0%{transform:none}${LETRAS.map((_, i) => `${pct(CAI(i))}{transform:none}${pct(CAI(i) + 40)}{transform:translateY(7px)}${pct(CAI(i) + 110)}{transform:none}`).join('')}${pct(4280)}{transform:none}${pct(4320)}{transform:translate(-8px,6px)}${pct(4390)}{transform:translate(7px,-6px)}${pct(4470)}{transform:none}100%{transform:none}}
/* holofote e poeira de ouro */
.gnf-luz{position:absolute;left:50%;top:-60px;width:380px;height:820px;margin-left:-190px;background:linear-gradient(180deg,rgba(255,224,138,.32),rgba(255,224,138,.05) 75%,transparent);clip-path:polygon(42% 0,58% 0,100% 100%,0 100%);filter:blur(4px);opacity:0;animation:gnfLuz ${T}ms ease forwards}
@keyframes gnfLuz{0%,${pct(150)}{opacity:0}${pct(700)}{opacity:1}100%{opacity:.8}}
.gnf-po{position:absolute;width:3px;height:3px;border-radius:50%;background:${OURO_CLARO};box-shadow:0 0 6px ${OURO};opacity:0;animation:gnfPo 3200ms linear infinite}
@keyframes gnfPo{0%{opacity:0;transform:translateY(30px)}20%{opacity:.9}100%{opacity:0;transform:translateY(-140px)}}
/* G · O · A · T carimbando */
.gnf-letras{position:absolute;left:0;right:0;top:92px;z-index:8;display:flex;justify-content:center;gap:4px;animation:gnfLetrasVai ${T}ms ease forwards}
@keyframes gnfLetrasVai{0%,${pct(4900)}{opacity:1;transform:none}${pct(5300)}{opacity:0;transform:translateY(-40px) scale(.8)}100%{opacity:0}}
.gnf-l{display:inline-flex;align-items:center;justify-content:center;width:62px;height:78px;border-radius:12px;background:linear-gradient(180deg,${OURO_CLARO},${OURO} 55%,#9a6a14);border:4px solid #1a1102;box-shadow:5px 5px 0 #000,0 0 22px rgba(231,181,60,.6);font:900 56px/1 Oswald,sans-serif;color:#1a1102;opacity:0}
.gnf-ponto{font:900 40px/1 Oswald,sans-serif;color:${OURO_CLARO};align-self:flex-end;opacity:0}
.gnf-legenda{position:absolute;left:0;right:0;top:184px;z-index:8;text-align:center;font:700 15px Oswald,sans-serif;letter-spacing:.32em;color:${CREME};opacity:0;animation:gnfLegenda ${T}ms ease forwards}
@keyframes gnfLegenda{0%,${pct(CAI(3) + 250)}{opacity:0;transform:translateY(8px)}${pct(CAI(3) + 550)}{opacity:1;transform:none}${pct(4900)}{opacity:1}${pct(5200)}{opacity:0}100%{opacity:0}}
/* o 10 gigante atrás */
.gnf-dez{position:absolute;left:0;right:0;top:250px;z-index:2;text-align:center;font:900 330px/1 Oswald,sans-serif;color:transparent;-webkit-text-stroke:5px ${OURO};text-shadow:0 0 40px rgba(231,181,60,.35);opacity:0;animation:gnfDez ${T}ms ease forwards}
@keyframes gnfDez{0%,${pct(2300)}{opacity:0;transform:scale(1.4)}${pct(2800)}{opacity:.55;transform:scale(1)}${pct(4900)}{opacity:.55}${pct(5300)}{opacity:0}100%{opacity:0}}
/* o pedestal */
.gnf-ped{position:absolute;left:50%;top:600px;width:300px;height:60px;margin-left:-150px;z-index:4;border-radius:50%/40%;background:radial-gradient(ellipse at 50% 30%,${OURO_CLARO},${OURO} 45%,#6e4a0c);border:4px solid #1a1102;box-shadow:0 10px 0 #000;opacity:0;animation:gnfPed ${T}ms cubic-bezier(.2,1.2,.4,1) forwards}
@keyframes gnfPed{0%,${pct(2500)}{opacity:0;transform:translateY(120px)}${pct(2900)}{opacity:1;transform:none}${pct(5000)}{opacity:1}${pct(5500)}{opacity:0}100%{opacity:0}}
/* O BODE REI */
.gnf-bode{position:absolute;left:${210 - MW / 2}px;top:${618 - MH}px;width:${MW}px;height:${MH}px;z-index:10;opacity:0;transform-origin:50% 100%;animation:gnfBode ${T}ms cubic-bezier(.25,1.25,.45,1) forwards}
@keyframes gnfBode{0%,${pct(2850)}{opacity:0;transform:translateY(60px) scale(.4)}${pct(3300)}{opacity:1;transform:translateY(-24px) scale(1.06)}${pct(3500)}{transform:none}${pct(5000)}{opacity:1;transform:none}${pct(5600)}{opacity:1;transform:translate(-128px,48px) scale(.5)}100%{opacity:1;transform:translate(-128px,48px) scale(.5)}}
.gnf-bode img{width:100%;height:100%;display:block;filter:drop-shadow(5px 7px 0 rgba(0,0,0,.6)) drop-shadow(0 0 22px rgba(231,181,60,.45))}
/* o balão BÉÉÉ */
.gnf-bee{position:absolute;left:44px;top:300px;z-index:12;background:#fff;color:#0C0C0C;border:4px solid #0C0C0C;border-radius:18px;padding:6px 14px 8px;font:900 28px/1 Oswald,sans-serif;box-shadow:4px 4px 0 #000;opacity:0;animation:gnfBee ${T}ms cubic-bezier(.2,1.6,.4,1) forwards}
.gnf-bee::after{content:"";position:absolute;right:18px;bottom:-16px;border:9px solid transparent;border-top:12px solid #0C0C0C}
@keyframes gnfBee{0%,${pct(3450)}{opacity:0;transform:scale(.3) rotate(-12deg)}${pct(3650)}{opacity:1;transform:scale(1.1) rotate(-6deg)}${pct(3800)}{transform:scale(1) rotate(-6deg)}${pct(4250)}{opacity:1}${pct(4400)}{opacity:0}100%{opacity:0}}
/* a COROA desce girando */
.gnf-coroa{position:absolute;left:110px;top:0;width:90px;z-index:11;font-size:66px;line-height:1;text-align:center;filter:drop-shadow(0 0 14px rgba(255,224,138,.9)) drop-shadow(4px 5px 0 rgba(0,0,0,.5));opacity:0;animation:gnfCoroa ${T}ms cubic-bezier(.3,1.1,.4,1) forwards}
@keyframes gnfCoroa{0%,${pct(3800)}{opacity:0;transform:translateY(-140px) rotate(-200deg) scale(.6)}${pct(3900)}{opacity:1}${pct(4280)}{opacity:1;transform:translateY(344px) rotate(-14deg) scale(1)}${pct(4420)}{transform:translateY(334px) rotate(-14deg) scale(1.08)}${pct(4550)}{transform:translateY(344px) rotate(-14deg) scale(1)}${pct(5000)}{opacity:1;transform:translateY(344px) rotate(-14deg)}${pct(5400)}{opacity:0;transform:translateY(344px) scale(.4)}100%{opacity:0}}
/* chuva de moedas */
.gnf-moeda{position:absolute;top:-30px;width:18px;height:18px;margin-left:-9px;border-radius:50%;z-index:12;background:radial-gradient(circle at 35% 35%,#fff6c8,${OURO} 50%,#8a5c10);border:2px solid #5a3a06;opacity:0;animation:gnfMoeda 1800ms cubic-bezier(.4,.1,.7,1) both}
@keyframes gnfMoeda{0%{opacity:0;transform:translateY(0) rotateY(0)}8%{opacity:1}100%{opacity:1;transform:translateY(820px) rotateY(900deg)}}
.gnf-branco{position:absolute;inset:0;z-index:20;background:#fff8e0;opacity:0;animation:gnfBranco ${T}ms linear forwards}
@keyframes gnfBranco{0%,${pct(4270)}{opacity:0}${pct(4310)}{opacity:.7}${pct(4560)}{opacity:0}100%{opacity:0}}
/* o escudo com os raios dourados */
.gnf-esc{position:absolute;left:50%;top:150px;width:230px;height:230px;margin-left:-115px;z-index:6;display:flex;align-items:center;justify-content:center;opacity:0;
  filter:drop-shadow(0 0 26px rgba(231,181,60,.75)) drop-shadow(5px 6px 0 rgba(0,0,0,.55));animation:gnfEsc ${T}ms cubic-bezier(.2,1.3,.4,1) forwards}
@keyframes gnfEsc{0%,${pct(5000)}{opacity:0;transform:scale(.2) translateY(-60px)}${pct(5450)}{opacity:1;transform:scale(1.12)}${pct(5700)}{transform:scale(1)}100%{opacity:1;transform:scale(1)}}
.gnf-raios{position:absolute;left:50%;top:265px;width:440px;height:440px;margin:-220px 0 0 -220px;z-index:5;border-radius:50%;
  background:repeating-conic-gradient(rgba(255,224,138,.5) 0 7deg,transparent 7deg 20deg);-webkit-mask:radial-gradient(circle,#000 30%,transparent 68%);mask:radial-gradient(circle,#000 30%,transparent 68%);opacity:0;animation:gnfRaios ${T}ms linear forwards}
@keyframes gnfRaios{0%,${pct(5000)}{opacity:0;transform:rotate(0) scale(.5)}${pct(5400)}{opacity:1;transform:rotate(30deg) scale(1)}100%{opacity:1;transform:rotate(160deg) scale(1)}}
/* a frase e a faixa */
.gnf-frase{position:absolute;left:0;right:0;top:56px;z-index:13;text-align:center;white-space:nowrap;font:700 25px/1.08 Oswald,sans-serif;color:${CREME};text-shadow:3px 3px 0 #000;letter-spacing:.02em}
.gnf-frase span{display:inline-block;opacity:0;animation:gnfPalavra ${T}ms cubic-bezier(.2,1.5,.4,1) forwards}
@keyframes gnfPalavra{0%{opacity:0;transform:translateY(-40px)}6%{opacity:1;transform:translateY(4px)}9%{transform:none}96%{opacity:1}100%{opacity:1}}
.gnf-frase em{font-style:normal;color:${OURO_CLARO}}
.gnf-faixa{position:absolute;left:24px;right:24px;top:612px;z-index:14;background:#0C0C0C;border:3px solid ${OURO};border-radius:16px;padding:8px 8px 9px;text-align:center;opacity:0;animation:gnfFaixa ${T}ms cubic-bezier(.2,1.3,.4,1) forwards}
@keyframes gnfFaixa{0%,${pct(6100)}{opacity:0;transform:scale(.4)}${pct(6450)}{opacity:1;transform:scale(1.06)}${pct(6650)}{transform:scale(1)}${pct(8200)}{opacity:1}100%{opacity:0}}
.gnf-faixa small{display:block;font:700 13px Oswald,sans-serif;letter-spacing:.22em;color:${OURO_CLARO}}
.gnf-faixa b{display:block;font:700 27px/1.05 Oswald,sans-serif;color:#fff;margin-top:2px}
.gnf-faixa em{display:inline-block;font-style:normal;font:700 13px Oswald,sans-serif;color:#1a1102;background:linear-gradient(90deg,${OURO},${OURO_CLARO},${OURO});border-radius:7px;padding:2px 9px;margin-top:5px;letter-spacing:.14em}
@media (prefers-reduced-motion:reduce){.gnf-po,.gnf-letras,.gnf-legenda,.gnf-dez,.gnf-bee,.gnf-coroa,.gnf-moeda,.gnf-branco,.gnf-raios{display:none}.gnf-treme{animation:none}.gnf-esc,.gnf-bode,.gnf-ped,.gnf-faixa,.gnf-frase span{animation:none;opacity:1}}
`

function useEscala() {
  const calc = () => Math.min(window.innerWidth / 420, window.innerHeight / 760)
  const [s, setS] = useState(calc)
  useEffect(() => { const f = () => setS(calc()); window.addEventListener('resize', f); return () => window.removeEventListener('resize', f) }, [])
  return s
}

// cada letra cai do alto e carimba (keyframes por letra, no tempo dela)
const kfLetra = (i: number) => `@keyframes gnfL${i}{0%,${pct(CAI(i) - 220)}{opacity:0;transform:translateY(-260px) scale(1.6) rotate(${i % 2 ? 14 : -14}deg)}${pct(CAI(i))}{opacity:1;transform:translateY(0) scale(1) rotate(0)}${pct(CAI(i) + 70)}{transform:scale(1.12,.9)}${pct(CAI(i) + 160)}{transform:none}100%{opacity:1;transform:none}}`
const kfPonto = (i: number) => `@keyframes gnfP${i}{0%,${pct(CAI(i) + 120)}{opacity:0}${pct(CAI(i) + 220)}{opacity:1}100%{opacity:1}}`

export function GalaNeymarFC({ clube, chave, mostra, grito }: { clube: string; chave: string; mostra: string; grito: string }) {
  const s = useEscala()
  void grito
  useEffect(() => playMp3Gala(`${import.meta.env.BASE_URL}sfx/torcida-spfc-wen-v1.mp3`, T), [chave])
  const frase = [tr('SAI DA FRENTE', 'MAKE WAY,'), tr('QUE O BODE', 'THE GOAT'), tr('CHEGOU', 'IS HERE')]
  return createPortal(
    <div key={chave} className="gnf" aria-hidden>
      <style>{CSS + LETRAS.map((_, i) => kfLetra(i) + kfPonto(i)).join('\n')}</style>
      <div className="gnf-ceu" />
      <div className="gnf-palco" style={{ transform: `translate(-50%,-50%) scale(${s})` }}>
       <div className="gnf-treme">
        <div className="gnf-luz" />
        {Array.from({ length: 28 }, (_, i) => (
          <i key={i} className="gnf-po" style={{ left: 10 + Math.round(sorte(i + 1) * 400), top: 120 + Math.round(sorte(i * 7 + 3) * 560), animationDelay: `${Math.round(sorte(i * 13 + 5) * 3200)}ms` }} />
        ))}
        <div className="gnf-dez">10</div>
        <div className="gnf-letras">
          {LETRAS.map((l, i) => (
            <span key={l} style={{ display: 'inline-flex', alignItems: 'flex-end', gap: 4 }}>
              <span className="gnf-l" style={{ animation: `gnfL${i} ${T}ms cubic-bezier(.3,1.3,.5,1) forwards` }}>{l}</span>
              {i < LETRAS.length - 1 && <span className="gnf-ponto" style={{ animation: `gnfP${i} ${T}ms ease forwards` }}>·</span>}
            </span>
          ))}
        </div>
        <div className="gnf-legenda">{tr('O MAIOR DE TODOS OS TEMPOS', 'GREATEST OF ALL TIME')}</div>
        <div className="gnf-raios" />
        <div className="gnf-esc"><Escudo nome={clube} size={220} /></div>
        <div className="gnf-ped" />
        <div className="gnf-bode"><img src={bodeImg} alt="" /></div>
        <div className="gnf-bee">BÉÉÉ! 🐐</div>
        <div className="gnf-coroa">👑</div>
        {Array.from({ length: 22 }, (_, i) => (
          <i key={i} className="gnf-moeda" style={{ left: 14 + Math.round(sorte(i * 9 + 4) * 392), animationDelay: `${4300 + Math.round(sorte(i * 3 + 1) * 900)}ms` }} />
        ))}
        <div className="gnf-frase">
          {frase.map((p, i) => <span key={i} style={{ animationDelay: `${5500 + i * 280}ms`, marginRight: 8 }}>{i === 2 ? <em>{p}</em> : p}</span>)}
        </div>
        <div className="gnf-faixa">
          <small>{tr('🐐 CHEGOU NA SALA', '🐐 JUST ARRIVED')}</small>
          <b>{mostra}</b>
          <em>O G.O.A.T.</em>
        </div>
        <div className="gnf-branco" />
       </div>
      </div>
    </div>,
    document.body,
  )
}

// ─── 🐶💚 ENTRADA ÚNICA DO dSOUZA FC: "A GALERIA" ───────────────────────────────────────────────────────────────
//
// Pedido do Diego (28/10, batismo FUNDADOR do alexandre12cdm): *"faça entrada de gala personalizada"*. O dono vende
// QUADROS de futebol (dSouza Empreendimentos — "quadros do seu time pra decorar a parede · frete grátis"), e a mascote é
// O Pitbull de boné e moletom dSouza FC carregando os quadros das lendas. Preto e verde-neon. Então:
// 1) a parede da GALERIA acende: friso neon e seis quadros de lenda que pipocam um a um, cada um com flash de foto
// 2) cai uma CAIXA de entrega com a fita dSouza, quica no chão e leva o carimbo FRETE GRÁTIS
// 3) a caixa ABRE num estouro verde e O PITBULL sobe de dentro dela, de olho aceso
// 4) o ESCUDO desce no meio da galeria com anel neon (brilho passando) e o pitbull vai pro canto
// 5) três frases batem uma a uma — QUADRO NA PAREDE · LENDA NO ELENCO · TAÇA NA ESTANTE — e a faixa "CHEGOU NA SALA"
// Mesmo esquema das outras galas únicas: palco 420×760 escalado, camada fixa sem clique, fora do reducer, sem localStorage.
// Som: o canto da torcida dele chega depois (o Diego manda) — por enquanto a gala entra sem áudio próprio.
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Escudo } from './escudos'
import { tr } from './lang'
import mascoteImg from './img/dsouza-mascote.webp'

export const DSOUZA_MS = 8600
const T = DSOUZA_MS
const pct = (ms: number) => (ms / T * 100).toFixed(1) + '%'
const NEON = '#73E541', PRETO = '#0A0A09', GOLD = '#FFC400', MADEIRA = '#5b3a1e'
const sorte = (i: number) => ((i * 7919) % 997) / 997

const CSS = `
.gds{position:fixed;inset:0;z-index:99990;pointer-events:none;overflow:hidden;animation:gdsVis ${T}ms ease forwards}
@keyframes gdsVis{0%{opacity:0}3%{opacity:1}95%{opacity:1}100%{opacity:0}}
.gds-fundo{position:absolute;inset:0;background:#050605}
.gds-palco{position:absolute;left:50%;top:50%;width:420px;height:760px;overflow:hidden}
.gds-treme{position:absolute;inset:0;animation:gdsTreme ${T}ms linear forwards}
@keyframes gdsTreme{0%,${pct(2350)}{transform:none}${pct(2390)}{transform:translate(-6px,4px)}${pct(2440)}{transform:translate(5px,-3px)}${pct(2500)}{transform:none}
  ${pct(3050)}{transform:none}${pct(3090)}{transform:translate(-8px,5px)}${pct(3140)}{transform:translate(7px,-4px)}${pct(3200)}{transform:none}100%{transform:none}}
/* 🧱 a parede da galeria */
.gds-parede{position:absolute;inset:0;opacity:0;background:repeating-linear-gradient(90deg,rgba(115,229,65,.05) 0 1px,transparent 1px 70px),radial-gradient(ellipse at 50% 18%,#1d2a19 0%,#0b0f0a 60%,#050605 100%);animation:gdsParede ${T}ms ease forwards}
@keyframes gdsParede{0%,${pct(100)}{opacity:0}${pct(600)}{opacity:1}100%{opacity:1}}
.gds-friso{position:absolute;left:0;right:0;height:4px;background:${NEON};box-shadow:0 0 18px ${NEON},0 0 40px rgba(115,229,65,.6);transform-origin:0 50%;transform:scaleX(0);animation:gdsFriso ${T}ms ease forwards}
@keyframes gdsFriso{0%,${pct(200)}{transform:scaleX(0)}${pct(800)}{transform:scaleX(1)}100%{transform:scaleX(1)}}
.gds-chao{position:absolute;left:-40px;right:-40px;bottom:-40px;height:250px;border-radius:50% 50% 0 0;background:radial-gradient(ellipse at 50% 15%,#1f2a1b,#070907 70%)}
/* 🖼️ os seis quadros de lenda */
.gds-quadro{position:absolute;width:108px;height:132px;border:8px solid ${MADEIRA};border-radius:3px;background:linear-gradient(160deg,#e9e9e9,#9c9c9c);
  box-shadow:inset 0 0 0 4px #f4f4f4,4px 5px 0 rgba(0,0,0,.6);opacity:0;animation:gdsQuadro 700ms cubic-bezier(.2,1.4,.4,1) both,gdsApaga ${T}ms linear forwards}
.gds-quadro svg{position:absolute;left:50%;bottom:6px;width:62px;height:96px;margin-left:-31px}
@keyframes gdsQuadro{0%{opacity:0;transform:scale(.4) rotate(-8deg)}60%{opacity:1;transform:scale(1.08) rotate(2deg)}100%{opacity:1;transform:scale(1) rotate(var(--r))}}
@keyframes gdsApaga{0%,${pct(4300)}{filter:none}${pct(4700)}{filter:brightness(.38) saturate(.6)}100%{filter:brightness(.38) saturate(.6)}}
.gds-flash{position:absolute;width:150px;height:150px;border-radius:50%;background:radial-gradient(circle,rgba(255,255,255,.95),rgba(115,229,65,.25) 45%,transparent 70%);opacity:0;animation:gdsFlash 520ms ease-out both}
@keyframes gdsFlash{0%{opacity:0;transform:scale(.3)}25%{opacity:1;transform:scale(1)}100%{opacity:0;transform:scale(1.5)}}
/* 📦 a caixa de entrega */
.gds-caixa{position:absolute;left:50%;top:470px;width:190px;height:150px;margin-left:-95px;z-index:10;opacity:0;animation:gdsCaixa ${T}ms cubic-bezier(.3,0,.3,1) forwards}
@keyframes gdsCaixa{0%,${pct(1900)}{opacity:0;transform:translateY(-640px) rotate(-14deg)}${pct(2000)}{opacity:1}${pct(2360)}{transform:translateY(0) rotate(0)}
  ${pct(2480)}{transform:translateY(-34px) rotate(3deg)}${pct(2620)}{transform:translateY(0) rotate(0)}${pct(4300)}{opacity:1;transform:none}${pct(4700)}{opacity:0;transform:translateY(40px) scale(.9)}100%{opacity:0}}
.gds-caixa .corpo{position:absolute;inset:26px 0 0 0;background:linear-gradient(180deg,#c99a5b,#a77a40);border:3px solid ${PRETO};border-radius:6px;box-shadow:5px 6px 0 rgba(0,0,0,.6)}
.gds-caixa .fita{position:absolute;left:0;right:0;top:36px;height:22px;background:${PRETO};border-top:2px solid ${NEON};border-bottom:2px solid ${NEON};display:flex;align-items:center;justify-content:center;font:700 13px/1 Oswald,sans-serif;letter-spacing:.12em;white-space:nowrap;overflow:hidden;color:${NEON}}
.gds-tampa{position:absolute;top:0;height:30px;width:96px;background:linear-gradient(180deg,#d8ac6c,#b8884a);border:3px solid ${PRETO};border-radius:5px;z-index:2}
.gds-tampa.e{left:-2px;transform-origin:4px 100%;animation:gdsTampaE ${T}ms cubic-bezier(.2,1.3,.4,1) forwards}
.gds-tampa.d{right:-2px;transform-origin:calc(100% - 4px) 100%;animation:gdsTampaD ${T}ms cubic-bezier(.2,1.3,.4,1) forwards}
@keyframes gdsTampaE{0%,${pct(3050)}{transform:none}${pct(3300)}{transform:rotate(-128deg)}100%{transform:rotate(-128deg)}}
@keyframes gdsTampaD{0%,${pct(3050)}{transform:none}${pct(3300)}{transform:rotate(128deg)}100%{transform:rotate(128deg)}}
.gds-carimbo{position:absolute;left:50%;top:104px;margin-left:-74px;width:148px;z-index:3;text-align:center;border:3px solid ${NEON};border-radius:8px;padding:3px 0;
  font:700 17px/1 Oswald,sans-serif;letter-spacing:.08em;color:${NEON};background:rgba(10,10,9,.82);opacity:0;animation:gdsCarimbo ${T}ms cubic-bezier(.2,1.6,.4,1) forwards}
@keyframes gdsCarimbo{0%,${pct(2620)}{opacity:0;transform:scale(2.4) rotate(-14deg)}${pct(2800)}{opacity:1;transform:scale(1) rotate(-7deg)}100%{opacity:1;transform:scale(1) rotate(-7deg)}}
.gds-estouro{position:absolute;left:50%;top:470px;width:320px;height:320px;margin:-160px 0 0 -160px;border-radius:50%;z-index:7;
  background:radial-gradient(circle,rgba(115,229,65,.85),rgba(115,229,65,.25) 40%,transparent 68%);opacity:0;animation:gdsEstouro ${T}ms ease-out forwards}
@keyframes gdsEstouro{0%,${pct(3050)}{opacity:0;transform:scale(.3)}${pct(3200)}{opacity:1;transform:scale(1)}${pct(3900)}{opacity:0;transform:scale(1.6)}100%{opacity:0}}
/* 🐶 o pitbull sobe de dentro da caixa */
.gds-pit{position:absolute;left:50%;top:170px;margin-left:-150px;z-index:9;opacity:0;animation:gdsPit ${T}ms cubic-bezier(.3,0,.3,1) forwards}
.gds-pit img{display:block;width:300px;height:332px;filter:drop-shadow(0 0 26px rgba(115,229,65,.45)) drop-shadow(5px 6px 0 rgba(0,0,0,.6))}
@keyframes gdsPit{0%,${pct(3100)}{opacity:0;transform:translateY(300px) scale(.35)}${pct(3250)}{opacity:1}${pct(3800)}{transform:translateY(-14px) scale(1.04)}${pct(4000)}{transform:translateY(0) scale(1)}
  ${pct(4400)}{transform:translateY(0) scale(1)}${pct(4900)}{opacity:1;transform:translate(122px,214px) scale(.56)}100%{opacity:1;transform:translate(122px,214px) scale(.56)}}
.gds-bob{animation:gdsBob 760ms ease-in-out infinite alternate}
@keyframes gdsBob{from{transform:translateY(0)}to{transform:translateY(-6px)}}
.gds-olho{position:absolute;left:50%;top:268px;width:180px;height:36px;margin-left:-90px;z-index:11;border-radius:50%;
  background:radial-gradient(ellipse,rgba(160,255,110,.9),rgba(115,229,65,.0) 70%);opacity:0;animation:gdsOlho ${T}ms ease forwards}
@keyframes gdsOlho{0%,${pct(3800)}{opacity:0}${pct(3900)}{opacity:1}${pct(4150)}{opacity:0}${pct(4250)}{opacity:.9}${pct(4400)}{opacity:0}100%{opacity:0}}
/* 🛡️ o escudo desce no meio da galeria */
.gds-anel{position:absolute;left:50%;top:205px;width:250px;height:250px;margin:-125px 0 0 -125px;border-radius:50%;z-index:10;border:5px solid ${NEON};
  box-shadow:0 0 22px ${NEON},inset 0 0 22px rgba(115,229,65,.5);opacity:0;animation:gdsAnel ${T}ms ease forwards}
@keyframes gdsAnel{0%,${pct(4600)}{opacity:0;transform:scale(.3)}${pct(5000)}{opacity:1;transform:scale(1.08)}${pct(5200)}{transform:scale(1)}100%{opacity:1;transform:scale(1)}}
.gds-esc{position:absolute;left:50%;top:205px;width:230px;height:230px;margin:-115px 0 0 -115px;z-index:11;display:flex;align-items:center;justify-content:center;opacity:0;
  filter:drop-shadow(0 0 20px rgba(115,229,65,.55)) drop-shadow(5px 6px 0 rgba(0,0,0,.6));animation:gdsEsc ${T}ms cubic-bezier(.2,1.25,.4,1) forwards}
@keyframes gdsEsc{0%,${pct(4500)}{opacity:0;transform:translateY(-420px) rotate(-18deg)}${pct(4700)}{opacity:1}${pct(5150)}{transform:translateY(8px) rotate(0)}${pct(5300)}{transform:translateY(0)}100%{opacity:1;transform:translateY(0)}}
.gds-brilho{position:absolute;left:50%;top:205px;width:230px;height:230px;margin:-115px 0 0 -115px;z-index:12;overflow:hidden;border-radius:50%;opacity:0;animation:gdsBrOn ${T}ms linear forwards}
.gds-brilho::after{content:'';position:absolute;top:-20%;bottom:-20%;width:60px;left:-80px;background:linear-gradient(90deg,transparent,rgba(255,255,255,.8),transparent);transform:skewX(-18deg);animation:gdsBr ${T}ms linear forwards}
@keyframes gdsBrOn{0%,${pct(5350)}{opacity:0}${pct(5400)}{opacity:1}${pct(6150)}{opacity:1}${pct(6250)}{opacity:0}100%{opacity:0}}
@keyframes gdsBr{0%,${pct(5400)}{left:-80px}${pct(6150)}{left:300px}100%{left:300px}}
/* 🗣️ as três frases */
.gds-frase{position:absolute;left:18px;z-index:13;transform-origin:0 50%;font:700 22px/1 Oswald,sans-serif;letter-spacing:.06em;color:#fff;-webkit-text-stroke:1.5px ${PRETO};text-shadow:3px 3px 0 ${PRETO};opacity:0;animation:gdsFraseIn 900ms cubic-bezier(.2,1.4,.4,1) both}
.gds-frase i{font-style:normal;color:${NEON}}
@keyframes gdsFraseIn{0%{opacity:0;transform:scale(2.2)}60%{opacity:1;transform:scale(.96)}100%{opacity:1;transform:scale(1)}}
.gds-faixa{position:absolute;left:20px;right:20px;top:668px;z-index:17;background:${PRETO};border:3px solid ${NEON};border-radius:16px;padding:7px;text-align:center;box-shadow:0 0 18px rgba(115,229,65,.35);opacity:0;animation:gdsFaixa ${T}ms cubic-bezier(.2,1.3,.4,1) forwards}
@keyframes gdsFaixa{0%,${pct(6300)}{opacity:0;transform:scale(.4)}${pct(6600)}{opacity:1;transform:scale(1.06)}${pct(6800)}{transform:scale(1)}${pct(8100)}{opacity:1}100%{opacity:0}}
.gds-faixa small{display:block;font:700 13px Oswald,sans-serif;letter-spacing:.22em;color:${GOLD}}
.gds-faixa b{display:block;font:700 26px/1.05 Oswald,sans-serif;color:#fff;margin-top:2px} /* sem uppercase: o nome é dSouza, com d minúsculo */
.gds-faixa em{display:block;font-style:normal;font:700 14px Oswald,sans-serif;color:${NEON};margin-top:3px;letter-spacing:.12em}
.gds-faisca{position:absolute;bottom:0;width:5px;height:5px;border-radius:50%;z-index:6;opacity:0;background:${NEON};box-shadow:0 0 6px ${NEON};animation:gdsFaisca 2600ms linear infinite}
@keyframes gdsFaisca{0%{opacity:0;transform:translate(0,0)}20%{opacity:.85}100%{opacity:0;transform:translate(var(--dx),-560px)}}
@media (prefers-reduced-motion:reduce){.gds-treme,.gds-flash,.gds-estouro,.gds-olho,.gds-brilho,.gds-faisca,.gds-frase,.gds-caixa,.gds-carimbo{display:none}.gds-parede,.gds-friso,.gds-quadro,.gds-anel,.gds-esc,.gds-pit,.gds-faixa{animation:none;opacity:1}}
`

function useEscala() {
  const calc = () => Math.min(window.innerWidth / 420, window.innerHeight / 760)
  const [s, setS] = useState(calc)
  useEffect(() => { const f = () => setS(calc()); window.addEventListener('resize', f); return () => window.removeEventListener('resize', f) }, [])
  return s
}

// posições fixas (a gala é igual pra todos): dois andares de três quadros, levemente tortos como numa parede de verdade
const QUADROS = [
  { x: 18, y: 64, r: -3, t: 500 }, { x: 156, y: 50, r: 2, t: 760 }, { x: 294, y: 66, r: -2, t: 1020 },
  { x: 18, y: 236, r: 2, t: 1280 }, { x: 156, y: 224, r: -2, t: 1540 }, { x: 294, y: 238, r: 3, t: 1800 },
]
const FAISCAS = Array.from({ length: 16 }, (_, i) => ({ x: 10 + sorte(i + 7) * 400, d: 3200 + Math.round(sorte(i + 11) * 2400), dx: Math.round((sorte(i + 5) - 0.5) * 120) }))
const FRASES: { pt: [string, string]; en: [string, string]; t: number; y: number }[] = [
  { pt: ['QUADRO ', 'NA PAREDE'], en: ['FRAME ', 'ON THE WALL'], t: 5450, y: 410 },
  { pt: ['LENDA ', 'NO ELENCO'], en: ['LEGEND ', 'IN THE SQUAD'], t: 5800, y: 446 },
  { pt: ['TAÇA ', 'NA ESTANTE'], en: ['TROPHY ', 'ON THE SHELF'], t: 6150, y: 482 },
]

// silhueta de jogador (o quadro de lenda — como os da arte do dono, em preto e branco)
function Silhueta({ i }: { i: number }) {
  const chute = i % 2 === 0
  return (
    <svg viewBox="0 0 62 96" aria-hidden>
      <circle cx="31" cy="12" r="8" fill="#151515" />
      <path d="M22 22h18l4 30h-8l-1 40h-6l-2-26-2 26h-6l-1-40h-8z" fill="#151515" transform={chute ? 'rotate(-6 31 50)' : undefined} />
      {chute ? <circle cx="50" cy="88" r="6" fill="#fff" stroke="#151515" strokeWidth="2" /> : <path d="M40 24l12 16-4 3-10-12z" fill="#151515" />}
    </svg>
  )
}

export function GalaDsouza({ clube, chave, mostra, grito }: { clube: string; chave: string; mostra: string; grito: string }) {
  const s = useEscala()
  void grito
  return createPortal(
    <div key={chave} className="gds" aria-hidden>
      <style>{CSS}</style>
      <div className="gds-fundo" />
      <div className="gds-palco" style={{ transform: `translate(-50%,-50%) scale(${s})` }}>
        <div className="gds-treme">
          <div className="gds-parede" />
          <div className="gds-friso" style={{ top: 30 }} /><div className="gds-friso" style={{ top: 392, animationDelay: '120ms' }} />
          <div className="gds-chao" />
          {QUADROS.map((q, i) => (
            <div key={`q${i}`} className="gds-quadro" style={{ left: q.x, top: q.y, ['--r' as string]: `${q.r}deg`, animationDelay: `${q.t}ms, 0ms` }}><Silhueta i={i} /></div>
          ))}
          {QUADROS.map((q, i) => <span key={`f${i}`} className="gds-flash" style={{ left: q.x - 21, top: q.y - 9, animationDelay: `${q.t}ms` }} />)}
          {FAISCAS.map((b, i) => <span key={`p${i}`} className="gds-faisca" style={{ left: b.x, animationDelay: `${b.d}ms`, ['--dx' as string]: `${b.dx}px` }} />)}
          <div className="gds-estouro" />
          <div className="gds-pit"><div className="gds-bob"><img src={mascoteImg} alt="" /></div></div>
          <div className="gds-olho" />
          <div className="gds-caixa">
            <div className="corpo"><div className="fita">dSouza · dSouza</div></div>
            <div className="gds-tampa e" /><div className="gds-tampa d" />
            <div className="gds-carimbo">{tr('✔ FRETE GRÁTIS', '✔ FREE SHIPPING')}</div>
          </div>
          <div className="gds-anel" />
          <div className="gds-esc"><Escudo nome={clube} size={220} /></div>
          <div className="gds-brilho" />
          {FRASES.map(f => {
            const [a, b] = tr(f.pt.join('|'), f.en.join('|')).split('|')
            return <span key={f.pt[0]} className="gds-frase" style={{ top: f.y, animationDelay: `${f.t}ms` }}>{a}<i>{b}</i></span>
          })}
          <div className="gds-faixa">
            <small>{tr('🖼️ CHEGOU NA SALA', '🖼️ JUST ARRIVED')}</small>
            <b>{mostra}</b>
            <em>🐶 {tr('O DONO DA GALERIA', 'THE GALLERY OWNER')} 💚</em>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}

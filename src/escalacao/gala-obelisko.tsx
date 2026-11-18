// ─── 👁️⚡ ENTRADA ÚNICA DO OBELISKO FC: "A INVOCAÇÃO" ──────────────────────────────────────────────────────────────
//
// Pedido do Diego (18/11, batismo FUNDADOR do felipefazzio): *"tem q fazer entrada de gala personalizada… baseado nesse personagem
// Obelisko do Yu-Gi-Oh. Pesquise."* O clube é inspirado no Obelisco, o Atormentador — um dos três Deuses Egípcios do Yu-Gi-Oh.
// Só usei o que é FATO da carta (yugioh-card.com / Yugipedia): precisa de 3 TRIBUTOS pra ser invocado · ATK 4000 / DEF 4000 ·
// atributo DIVINO · nível 10 · tributando 2 monstros, destrói os monstros do adversário. Nome de golpe que não confirmei, não entrou.
// 1) campo de duelo no escuro, céu roxo do deserto; três cartas viradas descem no campo — "3 TRIBUTOS"
// 2) as cartas queimam em luz roxa e sobem em raios; do chão nasce o OBELISCO de pedra com hieróglifos e o Olho de Hórus
// 3) o obelisco racha com raio, a tela treme e O Atormentador se ergue gigante, olhos vermelhos acendendo
// 4) o painel da carta: ★ nível 10 · DIVINO · ATK e DEF contando até 4000
// 5) o SOCO: ele avança pra câmera, onda de choque, flash e a tela trinca
// 6) o escudo com o Olho de Hórus e os raios dourados; faixa "CHEGOU NA SALA · O ATORMENTADOR"
// Som: o canto do clube (`sfx/torcida-obelisko-v1.mp3`, 14 s da abertura instrumental que o Diego mandou — o mesmo da carreira).
// Mesmo esquema das outras galas únicas: palco 420×760 escalado, camada fixa sem clique, fora do reducer, sem localStorage.
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Escudo } from './escudos'
import { tr } from './lang'
import { playMp3Gala } from './sound'
import atormentadorImg from './img/obelisko-mascote.webp' // 374×440, O Atormentador de garra estendida

export const OBELISKO_MS = 9200
const T = OBELISKO_MS
const pct = (ms: number) => (ms / T * 100).toFixed(1) + '%'
const ROXO = '#862EE0', ROXO_CLARO = '#C9A2FF', OURO = '#E7B94A', PRETO = '#0F0E18'
const MH = 440, MW = Math.round(MH * 374 / 440)
const SOBE = 3000 // o Atormentador se ergue
const SOCO = 5600 // o soco na câmera

const CSS = `
.gob{position:fixed;inset:0;z-index:99990;pointer-events:none;overflow:hidden;animation:gobVis ${T}ms ease forwards}
@keyframes gobVis{0%{opacity:0}3%{opacity:1}95%{opacity:1}100%{opacity:0}}
.gob-ceu{position:absolute;inset:0;background:radial-gradient(ellipse at 50% 35%,#3a1868 0%,#170a2e 55%,#07040f 100%)}
.gob-palco{position:absolute;left:50%;top:50%;width:420px;height:760px;overflow:hidden}
.gob-treme{position:absolute;inset:0;animation:gobTreme ${T}ms linear forwards}
@keyframes gobTreme{0%,${pct(SOBE)}{transform:none}${pct(SOBE + 60)}{transform:translate(7px,5px)}${pct(SOBE + 140)}{transform:translate(-6px,-4px)}${pct(SOBE + 230)}{transform:translate(4px,3px)}${pct(SOBE + 320)}{transform:none}
  ${pct(SOCO)}{transform:none}${pct(SOCO + 50)}{transform:translate(-10px,8px) scale(1.03)}${pct(SOCO + 140)}{transform:translate(9px,-6px)}${pct(SOCO + 240)}{transform:translate(-5px,4px)}${pct(SOCO + 360)}{transform:none}100%{transform:none}}
/* o campo de duelo */
.gob-chao{position:absolute;left:-40px;right:-40px;top:520px;bottom:0;z-index:1;background:linear-gradient(180deg,#2a1450,#0b0618);
  transform:perspective(500px) rotateX(55deg);transform-origin:50% 0;border-top:2px solid ${ROXO}}
.gob-chao::after{content:'';position:absolute;inset:0;background:repeating-linear-gradient(90deg,rgba(201,162,255,.18) 0 2px,transparent 2px 60px),repeating-linear-gradient(0deg,rgba(201,162,255,.18) 0 2px,transparent 2px 60px)}
.gob-areia{position:absolute;left:0;right:0;top:470px;height:60px;z-index:1;background:linear-gradient(180deg,rgba(231,185,74,0),rgba(231,185,74,.18));filter:blur(4px)}
.gob-legenda{position:absolute;left:0;right:0;top:110px;z-index:8;text-align:center;font:700 16px Oswald,sans-serif;letter-spacing:.32em;color:${ROXO_CLARO};text-shadow:2px 2px 0 #000;opacity:0;animation:gobLeg ${T}ms ease forwards}
@keyframes gobLeg{0%,${pct(400)}{opacity:0;transform:translateY(10px)}${pct(800)}{opacity:1;transform:none}${pct(2000)}{opacity:1}${pct(2300)}{opacity:0}100%{opacity:0}}
.gob-legenda b{display:block;font:700 50px/1 Oswald,sans-serif;letter-spacing:.04em;color:#fff;margin-top:6px}
/* as 3 cartas viradas (os tributos) */
.gob-carta{position:absolute;top:560px;width:64px;height:92px;margin-left:-32px;z-index:4;border-radius:6px;border:3px solid #2b1a10;
  background:radial-gradient(circle at 50% 50%,#d39a3a 0 9px,#7a4a1c 10px 14px,transparent 15px),linear-gradient(135deg,#6b3b16,#3a1d08);box-shadow:0 0 0 2px ${OURO},3px 4px 0 #000;
  opacity:0;animation:gobCarta ${T}ms cubic-bezier(.3,1.2,.4,1) forwards}
@keyframes gobCarta{0%{opacity:0;transform:translateY(-260px) rotate(-20deg)}${pct(700)}{opacity:1;transform:none}${pct(1700)}{opacity:1;transform:none;filter:none}
  ${pct(2000)}{opacity:1;transform:translateY(-10px);filter:brightness(2.5) drop-shadow(0 0 16px ${ROXO})}${pct(2300)}{opacity:0;transform:translateY(-120px) scale(.4);filter:brightness(3)}100%{opacity:0}}
.gob-raio-t{position:absolute;top:0;width:6px;height:600px;margin-left:-3px;z-index:3;background:linear-gradient(180deg,rgba(201,162,255,0),${ROXO_CLARO},#fff);filter:drop-shadow(0 0 10px ${ROXO});opacity:0;animation:gobRaioT ${T}ms linear forwards}
@keyframes gobRaioT{0%,${pct(1900)}{opacity:0}${pct(2000)}{opacity:1}${pct(2400)}{opacity:0}100%{opacity:0}}
/* o obelisco de pedra */
.gob-obel{position:absolute;left:50%;top:150px;width:90px;height:400px;margin-left:-45px;z-index:5;transform-origin:50% 100%;
  background:linear-gradient(90deg,#3a3550,#6b6585 45%,#4a4562);clip-path:polygon(50% 0,100% 12%,88% 100%,12% 100%,0 12%);opacity:0;animation:gobObel ${T}ms cubic-bezier(.3,1,.4,1) forwards}
@keyframes gobObel{0%,${pct(2100)}{opacity:0;transform:scaleY(0)}${pct(2700)}{opacity:1;transform:scaleY(1)}${pct(SOBE)}{opacity:1;filter:none}${pct(SOBE + 80)}{filter:brightness(2.4)}${pct(SOBE + 400)}{opacity:0;transform:scale(1.25,1.05);filter:brightness(3)}100%{opacity:0}}
.gob-obel i{position:absolute;left:50%;width:30px;margin-left:-15px;font-style:normal;font-size:20px;line-height:28px;text-align:center;color:${OURO};opacity:.75}
.gob-racha{position:absolute;left:50%;top:180px;width:90px;height:360px;margin-left:-45px;z-index:6;opacity:0;animation:gobRacha ${T}ms linear forwards}
@keyframes gobRacha{0%,${pct(SOBE - 250)}{opacity:0}${pct(SOBE - 150)}{opacity:1}${pct(SOBE + 300)}{opacity:1}${pct(SOBE + 420)}{opacity:0}100%{opacity:0}}
.gob-relampago{position:absolute;inset:0;z-index:20;background:#efe3ff;opacity:0;animation:gobRel ${T}ms linear forwards}
@keyframes gobRel{0%,${pct(SOBE)}{opacity:0}${pct(SOBE + 40)}{opacity:.75}${pct(SOBE + 120)}{opacity:.1}${pct(SOBE + 170)}{opacity:.55}${pct(SOBE + 330)}{opacity:0}
  ${pct(SOCO)}{opacity:0}${pct(SOCO + 40)}{opacity:.6}${pct(SOCO + 220)}{opacity:0}100%{opacity:0}}
/* O ATORMENTADOR */
.gob-deus{position:absolute;left:${210 - MW / 2}px;top:${560 - MH}px;width:${MW}px;height:${MH}px;z-index:7;opacity:0;transform-origin:50% 100%;animation:gobDeus ${T}ms cubic-bezier(.25,1,.45,1) forwards}
@keyframes gobDeus{0%,${pct(SOBE)}{opacity:0;transform:translateY(120px) scale(.55);filter:brightness(4)}${pct(SOBE + 500)}{opacity:1;transform:translateY(0) scale(1.05);filter:brightness(1.4)}${pct(SOBE + 800)}{transform:scale(1);filter:none}
  ${pct(SOCO - 300)}{opacity:1;transform:translateY(-10px) scale(.97)}${pct(SOCO)}{opacity:1;transform:translateY(60px) scale(1.9)}${pct(SOCO + 250)}{opacity:1;transform:translateY(40px) scale(1.75)}${pct(6600)}{opacity:1;transform:translate(-125px,45px) scale(.46)}100%{opacity:1;transform:translate(-125px,45px) scale(.46)}}
.gob-deus img{width:100%;height:100%;display:block;filter:drop-shadow(0 0 26px rgba(134,46,224,.75)) drop-shadow(5px 7px 0 rgba(0,0,0,.6))}
.gob-olhos{position:absolute;left:${210 - 30}px;top:${560 - MH + 70}px;width:60px;height:20px;z-index:8;opacity:0;
  background:radial-gradient(circle at 30% 50%,#ff2a2a 0 4px,rgba(255,42,42,0) 12px),radial-gradient(circle at 70% 50%,#ff2a2a 0 4px,rgba(255,42,42,0) 12px);animation:gobOlhos ${T}ms ease forwards}
@keyframes gobOlhos{0%,${pct(SOBE + 600)}{opacity:0}${pct(SOBE + 800)}{opacity:1}${pct(SOBE + 1300)}{opacity:.7}${pct(SOCO - 300)}{opacity:0}100%{opacity:0}}
/* o painel da carta */
.gob-ficha{position:absolute;left:24px;right:24px;top:590px;z-index:12;background:linear-gradient(180deg,#1d1236,${PRETO});border:3px solid ${OURO};border-radius:12px;box-shadow:4px 4px 0 #000;
  padding:8px 12px;display:grid;grid-template-columns:1fr auto;gap:2px 10px;align-items:center;opacity:0;animation:gobFicha ${T}ms cubic-bezier(.2,1.3,.4,1) forwards}
@keyframes gobFicha{0%,${pct(SOBE + 900)}{opacity:0;transform:translateY(30px)}${pct(SOBE + 1200)}{opacity:1;transform:none}${pct(SOCO - 200)}{opacity:1}${pct(SOCO)}{opacity:0}100%{opacity:0}}
.gob-ficha .estr{font-size:12px;letter-spacing:1px;color:${OURO}}
.gob-ficha .attr{font:700 13px Oswald,sans-serif;letter-spacing:.18em;color:#fff;background:${ROXO};border:2px solid ${OURO};border-radius:50%;width:54px;height:54px;display:flex;align-items:center;justify-content:center;grid-row:span 2}
.gob-ficha .num{font:700 30px/1 Oswald,sans-serif;color:#fff;letter-spacing:.04em}
.gob-ficha .num small{font-size:15px;color:${ROXO_CLARO};margin-right:4px}
/* o soco: onda de choque e a tela trincada */
.gob-onda{position:absolute;left:50%;top:420px;width:60px;height:60px;margin:-30px 0 0 -30px;border-radius:50%;z-index:13;border:6px solid ${ROXO_CLARO};opacity:0;animation:gobOnda ${T}ms ease-out forwards}
@keyframes gobOnda{0%,${pct(SOCO)}{opacity:0;transform:scale(1)}${pct(SOCO + 30)}{opacity:.55}${pct(SOCO + 600)}{opacity:0;transform:scale(14)}100%{opacity:0}}
.gob-trinca{position:absolute;inset:0;z-index:14;opacity:0;animation:gobTrinca ${T}ms linear forwards}
@keyframes gobTrinca{0%,${pct(SOCO)}{opacity:0}${pct(SOCO + 40)}{opacity:1}${pct(SOCO + 700)}{opacity:.7}${pct(6500)}{opacity:0}100%{opacity:0}}
/* o escudo */
.gob-raios{position:absolute;left:50%;top:270px;width:480px;height:480px;margin:-240px 0 0 -240px;z-index:9;border-radius:50%;
  background:repeating-conic-gradient(rgba(231,185,74,.55) 0 8deg,rgba(134,46,224,.3) 8deg 22deg);-webkit-mask:radial-gradient(circle,#000 28%,transparent 68%);mask:radial-gradient(circle,#000 28%,transparent 68%);opacity:0;animation:gobRaios ${T}ms linear forwards}
@keyframes gobRaios{0%,${pct(6300)}{opacity:0;transform:rotate(0) scale(.5)}${pct(6700)}{opacity:1;transform:rotate(30deg) scale(1)}100%{opacity:1;transform:rotate(150deg) scale(1)}}
.gob-esc{position:absolute;left:50%;top:140px;width:250px;height:270px;margin-left:-125px;z-index:10;display:flex;align-items:center;justify-content:center;opacity:0;
  filter:drop-shadow(0 0 24px rgba(231,185,74,.7)) drop-shadow(5px 6px 0 rgba(0,0,0,.55));animation:gobEsc ${T}ms cubic-bezier(.2,1.3,.4,1) forwards}
@keyframes gobEsc{0%,${pct(6300)}{opacity:0;transform:scale(.2) translateY(-60px)}${pct(6750)}{opacity:1;transform:scale(1.12)}${pct(7000)}{transform:scale(1)}100%{opacity:1;transform:scale(1)}}
.gob-faixa{position:absolute;left:24px;right:24px;top:620px;z-index:15;background:${PRETO};border:4px solid ${OURO};border-radius:16px;box-shadow:4px 4px 0 #000;padding:8px 8px 9px;text-align:center;opacity:0;animation:gobFaixaS ${T}ms cubic-bezier(.2,1.3,.4,1) forwards}
@keyframes gobFaixaS{0%,${pct(7100)}{opacity:0;transform:scale(.4)}${pct(7450)}{opacity:1;transform:scale(1.06)}${pct(7650)}{transform:scale(1)}${pct(8800)}{opacity:1}100%{opacity:0}}
.gob-faixa small{display:block;font:700 13px Oswald,sans-serif;letter-spacing:.22em;color:${ROXO_CLARO}}
.gob-faixa b{display:block;font:700 27px/1.05 Oswald,sans-serif;color:#fff;margin-top:2px}
.gob-faixa em{display:inline-block;font-style:normal;font:700 13px Oswald,sans-serif;color:#0C0C0C;background:linear-gradient(90deg,${OURO},#fff1b8,${OURO});border-radius:7px;padding:2px 9px;margin-top:5px;letter-spacing:.14em}
@media (prefers-reduced-motion:reduce){.gob-legenda,.gob-carta,.gob-raio-t,.gob-obel,.gob-racha,.gob-relampago,.gob-olhos,.gob-ficha,.gob-onda,.gob-trinca,.gob-raios{display:none}.gob-treme{animation:none}.gob-esc,.gob-deus,.gob-faixa{animation:none;opacity:1}}
`

function useEscala() {
  const calc = () => Math.min(window.innerWidth / 420, window.innerHeight / 760)
  const [s, setS] = useState(calc)
  useEffect(() => { const f = () => setS(calc()); window.addEventListener('resize', f); return () => window.removeEventListener('resize', f) }, [])
  return s
}

// ATK/DEF contando até 4000 (só número na tela, nada de estado do jogo)
function Conta({ desde }: { desde: number }) {
  const [n, setN] = useState(0)
  useEffect(() => {
    const t0 = performance.now() + desde
    let id = 0
    const passo = () => {
      const k = Math.min(1, Math.max(0, (performance.now() - t0) / 900))
      setN(Math.round(4000 * k))
      if (k < 1) id = requestAnimationFrame(passo)
    }
    id = requestAnimationFrame(passo)
    return () => cancelAnimationFrame(id)
  }, [desde])
  return <>{n}</>
}

export function GalaObelisko({ clube, chave, mostra, grito }: { clube: string; chave: string; mostra: string; grito: string }) {
  const s = useEscala()
  void grito
  useEffect(() => playMp3Gala(`${import.meta.env.BASE_URL}sfx/torcida-obelisko-v1.mp3`, T), [chave])
  return createPortal(
    <div key={chave} className="gob" aria-hidden>
      <style>{CSS}</style>
      <div className="gob-ceu" />
      <div className="gob-palco" style={{ transform: `translate(-50%,-50%) scale(${s})` }}>
       <div className="gob-treme">
        <div className="gob-areia" />
        <div className="gob-chao" />
        <div className="gob-legenda">{tr('INVOCAÇÃO DIVINA', 'DIVINE SUMMON')}<b>{tr('3 TRIBUTOS', '3 TRIBUTES')}</b></div>
        {[120, 210, 300].map((x, i) => (
          <div key={i}>
            <i className="gob-raio-t" style={{ left: x, animationDelay: `${i * 70}ms` }} />
            <div className="gob-carta" style={{ left: x, animationDelay: `${i * 160}ms` }} />
          </div>
        ))}
        <div className="gob-obel">
          {['☥', '◉', '☥', '◉', '☥'].map((h, i) => <i key={i} style={{ top: 80 + i * 56 }}>{h}</i>)}
        </div>
        <svg className="gob-racha" viewBox="0 0 90 360" aria-hidden>
          <path d="M45 0 L38 60 L52 110 L34 170 L50 230 L40 300 L48 360 M38 60 L20 90 M52 110 L72 140 M34 170 L14 200 M50 230 L70 260" stroke="#efe3ff" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ filter: `drop-shadow(0 0 6px ${ROXO})` }} />
        </svg>
        <div className="gob-raios" />
        <div className="gob-esc"><Escudo nome={clube} size={240} /></div>
        <div className="gob-deus"><img src={atormentadorImg} alt="" /></div>
        <div className="gob-olhos" />
        <div className="gob-ficha">
          <span className="estr">★★★★★★★★★★</span>
          <span className="attr">{tr('DIVINO', 'DIVINE')}</span>
          <span className="num"><small>ATK</small><Conta desde={SOBE + 1300} /> <small>DEF</small><Conta desde={SOBE + 1500} /></span>
        </div>
        <div className="gob-onda" />
        <svg className="gob-trinca" viewBox="0 0 420 760" aria-hidden>
          <path d="M210 420 L150 300 L120 160 M210 420 L300 330 L380 250 M210 420 L330 470 L420 520 M210 420 L230 560 L200 760 M210 420 L90 470 L0 440 M150 300 L80 290 M300 330 L320 230 M230 560 L300 620" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" opacity=".85" />
        </svg>
        <div className="gob-faixa">
          <small>{tr('👁️ CHEGOU NA SALA', '👁️ JUST ARRIVED')}</small>
          <b>{mostra}</b>
          <em>{tr('O ATORMENTADOR', 'THE TORMENTOR')}</em>
        </div>
        <div className="gob-relampago" />
       </div>
      </div>
    </div>,
    document.body,
  )
}

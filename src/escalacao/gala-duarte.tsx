// ─── 🧤🐓 ENTRADA ÚNICA DO DUARTE FC: "SÃO VICTOR" ─────────────────────────────────────────────────────────────────
//
// Pedido do Diego (18/11, batismo FUNDADOR do luizfelipeduarte212): *"faça entrada de gala personalizada principalmente pelo
// goleiro Victor defendendo pênalti igual ele tá nessa pose"*. A mascote (arte do dono) é O Paredão: o goleiro camisa 1 caído
// de lado, defendendo com o PÉ esticado pro alto — a defesa do Victor (Atlético Mineiro, Libertadores 2013), a que deu o
// apelido de "São Victor". ⚠️ Fato conferido: aquela defesa foi nas QUARTAS, contra o Tijuana — não na final. Por isso a
// gala não fala em "final" nem em minuto: só o lance (pênalti contra no último lance) e o apelido, que é público.
// 1) noite de estádio: os refletores varrem o céu; legenda "ÚLTIMO LANCE · PÊNALTI CONTRA"
// 2) a bola na marca, pulinho, e o chute vem na direção do gol
// 3) O Paredão entra deslizando de lado e ESPALMA COM O PÉ: estalo 💥, flash, a tela treme, a bola sobe pra fora
// 4) carimbo "DEFENDEU!" e as listras PRETA e BRANCA do manto varrem a tela
// 5) o escudo acende com a estrela dourada girando atrás; O Paredão vai pro canto
// 6) a frase bate — PÊNALTI CONTRA? AQUI TEM SÃO VICTOR — e a faixa "CHEGOU NA SALA · O PAREDÃO"
// Mesmo esquema das outras galas únicas: palco 420×760 escalado, camada fixa sem clique, fora do reducer, sem localStorage.
// Sem som próprio por enquanto: não existe canto do Atlético no jogo ainda (o Diego vai mandar).
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Escudo } from './escudos'
import { tr } from './lang'
import paredaoImg from './img/duarte-mascote.webp' // 440×335, O Paredão defendendo com o pé (a bola fica no canto de cima)

export const DUARTE_MS = 8600
const T = DUARTE_MS
const pct = (ms: number) => (ms / T * 100).toFixed(1) + '%'
const PRETO = '#101010', BRANCO = '#F1F1F0', OURO = '#F7D50A'
const KW = 400, KH = Math.round(KW * 335 / 440), KX = 10, KY = 360 // O Paredão no palco
const BX = Math.round(KX + KW * 0.905), BY = Math.round(KY + KH * 0.09) // onde o pé encontra a bola
const CHUTE = 2500, DEFESA = 2850

const CSS = `
.gdu{position:fixed;inset:0;z-index:99990;pointer-events:none;overflow:hidden;animation:gduVis ${T}ms ease forwards}
@keyframes gduVis{0%{opacity:0}3%{opacity:1}95%{opacity:1}100%{opacity:0}}
.gdu-ceu{position:absolute;inset:0;background:radial-gradient(ellipse at 50% 30%,#22324a 0%,#0b1220 60%,#05080e 100%)}
.gdu-palco{position:absolute;left:50%;top:50%;width:420px;height:760px;overflow:hidden}
.gdu-treme{position:absolute;inset:0;animation:gduTreme ${T}ms linear forwards}
@keyframes gduTreme{0%,${pct(DEFESA)}{transform:none}${pct(DEFESA + 40)}{transform:translate(8px,6px)}${pct(DEFESA + 110)}{transform:translate(-7px,-4px)}${pct(DEFESA + 190)}{transform:translate(4px,3px)}${pct(DEFESA + 280)}{transform:none}100%{transform:none}}
/* refletores */
.gdu-luz{position:absolute;top:-40px;width:120px;height:560px;margin-left:-60px;transform-origin:50% 0;z-index:1;
  background:linear-gradient(180deg,rgba(255,250,220,.55),rgba(255,250,220,0));clip-path:polygon(40% 0,60% 0,100% 100%,0 100%);animation:gduLuz 3400ms ease-in-out infinite alternate}
@keyframes gduLuz{0%{transform:rotate(-24deg)}100%{transform:rotate(24deg)}}
.gdu-gram{position:absolute;left:0;right:0;top:470px;bottom:0;z-index:2;background:repeating-linear-gradient(180deg,#1f7a3a 0 34px,#1a6b33 34px 68px)}
.gdu-gol{position:absolute;left:50%;top:300px;width:330px;height:172px;margin-left:-165px;z-index:3;border:7px solid #fff;border-bottom:none;border-radius:4px 4px 0 0;
  background:repeating-linear-gradient(90deg,rgba(255,255,255,.28) 0 2px,transparent 2px 13px),repeating-linear-gradient(0deg,rgba(255,255,255,.28) 0 2px,transparent 2px 13px);animation:gduRede ${T}ms linear forwards}
@keyframes gduRede{0%,${pct(DEFESA)}{transform:none}${pct(DEFESA + 90)}{transform:scaleY(.97)}${pct(DEFESA + 200)}{transform:none}100%{transform:none}}
.gdu-marca{position:absolute;left:206px;top:690px;width:9px;height:9px;border-radius:50%;background:#fff;z-index:3}
.gdu-legenda{position:absolute;left:0;right:0;top:110px;z-index:8;text-align:center;font:700 17px Oswald,sans-serif;letter-spacing:.3em;color:${OURO};text-shadow:2px 2px 0 rgba(0,0,0,.7);opacity:0;animation:gduLeg ${T}ms ease forwards}
@keyframes gduLeg{0%,${pct(500)}{opacity:0;transform:translateY(10px)}${pct(1000)}{opacity:1;transform:none}${pct(2300)}{opacity:1}${pct(2600)}{opacity:0}100%{opacity:0}}
.gdu-legenda b{display:block;font:700 46px/1 Oswald,sans-serif;letter-spacing:.04em;color:#fff;margin-top:6px}
/* a bola: pulinho na marca, chute, some no pé */
.gdu-bola{position:absolute;left:0;top:0;z-index:11;font-size:30px;line-height:1;opacity:0;animation:gduBola ${T}ms linear forwards}
@keyframes gduBola{0%,${pct(1500)}{opacity:0;transform:translate(194px,660px) scale(1.2)}${pct(1700)}{opacity:1;transform:translate(194px,660px) scale(1.2)}${pct(1950)}{transform:translate(194px,630px) scale(1.2)}${pct(2200)}{transform:translate(194px,660px) scale(1.2)}${pct(CHUTE)}{transform:translate(194px,660px) scale(1.2) rotate(0)}${pct(DEFESA - 10)}{opacity:1;transform:translate(${BX - 18}px,${BY - 18}px) scale(.95) rotate(540deg)}${pct(DEFESA)}{opacity:0}100%{opacity:0}}
/* a bola rebatida subindo pra fora */
.gdu-rebote{position:absolute;left:0;top:0;z-index:11;font-size:28px;line-height:1;opacity:0;animation:gduReb ${T}ms cubic-bezier(.2,.7,.4,1) forwards}
@keyframes gduReb{0%,${pct(DEFESA)}{opacity:0;transform:translate(${BX - 16}px,${BY - 16}px)}${pct(DEFESA + 20)}{opacity:1}${pct(DEFESA + 500)}{opacity:1;transform:translate(470px,40px) rotate(-720deg)}${pct(DEFESA + 520)}{opacity:0}100%{opacity:0}}
/* O PAREDÃO */
.gdu-gk{position:absolute;left:${KX}px;top:${KY}px;width:${KW}px;height:${KH}px;z-index:10;opacity:0;transform-origin:30% 100%;animation:gduGk ${T}ms cubic-bezier(.25,1.1,.45,1) forwards}
@keyframes gduGk{0%,${pct(CHUTE)}{opacity:0;transform:translateX(-380px) rotate(8deg)}${pct(DEFESA)}{opacity:1;transform:none}${pct(DEFESA + 120)}{transform:translateY(-6px) rotate(-2deg)}${pct(DEFESA + 260)}{transform:none}${pct(4600)}{opacity:1;transform:none}${pct(5200)}{opacity:1;transform:translate(0px,-60px) scale(.5)}100%{opacity:1;transform:translate(0px,-60px) scale(.5)}}
.gdu-gk img{width:100%;height:100%;display:block;clip-path:polygon(0 0,83.6% 0,83.6% 19.1%,100% 19.1%,100% 100%,0 100%);filter:drop-shadow(5px 7px 0 rgba(0,0,0,.55)) drop-shadow(0 0 18px rgba(247,213,10,.35))}
.gdu-estalo{position:absolute;left:${BX - 40}px;top:${BY - 40}px;width:80px;height:80px;z-index:12;font-size:58px;line-height:80px;text-align:center;opacity:0;animation:gduEst ${T}ms ease forwards}
@keyframes gduEst{0%,${pct(DEFESA)}{opacity:0;transform:scale(.2)}${pct(DEFESA + 60)}{opacity:1;transform:scale(1.4)}${pct(DEFESA + 380)}{opacity:0;transform:scale(1)}100%{opacity:0}}
.gdu-flash{position:absolute;inset:0;z-index:20;background:#fffbe6;opacity:0;animation:gduFlash ${T}ms linear forwards}
@keyframes gduFlash{0%,${pct(DEFESA)}{opacity:0}${pct(DEFESA + 40)}{opacity:.6}${pct(DEFESA + 260)}{opacity:0}100%{opacity:0}}
.gdu-carimbo{position:absolute;left:50%;top:150px;z-index:15;font:700 64px/1 Oswald,sans-serif;color:${OURO};background:${PRETO};border:5px solid ${OURO};border-radius:16px;padding:6px 18px;
  box-shadow:5px 5px 0 #000;white-space:nowrap;opacity:0;animation:gduCar ${T}ms cubic-bezier(.2,1.5,.4,1) forwards}
@keyframes gduCar{0%,${pct(DEFESA + 100)}{opacity:0;transform:translateX(-50%) scale(2.4) rotate(-8deg)}${pct(DEFESA + 300)}{opacity:1;transform:translateX(-50%) scale(1) rotate(-6deg)}${pct(3900)}{opacity:1;transform:translateX(-50%) scale(1) rotate(-6deg)}${pct(4100)}{opacity:0}100%{opacity:0}}
/* a cortina de listras preta e branca */
.gdu-cort{position:absolute;inset:0;z-index:13;display:flex;pointer-events:none}
.gdu-cort i{flex:1;height:100%;transform:translateY(-102%);animation:gduFaixa ${T}ms cubic-bezier(.6,0,.3,1) forwards}
@keyframes gduFaixa{0%,${pct(3900)}{transform:translateY(-102%)}${pct(4400)}{transform:translateY(0)}${pct(4650)}{transform:translateY(0)}${pct(5150)}{transform:translateY(102%)}100%{transform:translateY(102%)}}
/* o escudo com a estrela dourada */
.gdu-esc{position:absolute;left:50%;top:170px;width:230px;height:250px;margin-left:-115px;z-index:9;display:flex;align-items:center;justify-content:center;opacity:0;
  filter:drop-shadow(0 0 24px rgba(247,213,10,.7)) drop-shadow(5px 6px 0 rgba(0,0,0,.55));animation:gduEsc ${T}ms cubic-bezier(.2,1.3,.4,1) forwards}
@keyframes gduEsc{0%,${pct(4700)}{opacity:0;transform:scale(.2) translateY(-60px)}${pct(5150)}{opacity:1;transform:scale(1.12)}${pct(5400)}{transform:scale(1)}100%{opacity:1;transform:scale(1)}}
.gdu-raios{position:absolute;left:50%;top:295px;width:470px;height:470px;margin:-235px 0 0 -235px;z-index:8;border-radius:50%;
  background:repeating-conic-gradient(rgba(247,213,10,.55) 0 8deg,rgba(255,255,255,.12) 8deg 22deg);-webkit-mask:radial-gradient(circle,#000 28%,transparent 68%);mask:radial-gradient(circle,#000 28%,transparent 68%);opacity:0;animation:gduRaios ${T}ms linear forwards}
@keyframes gduRaios{0%,${pct(4700)}{opacity:0;transform:rotate(0) scale(.5)}${pct(5100)}{opacity:1;transform:rotate(30deg) scale(1)}100%{opacity:1;transform:rotate(150deg) scale(1)}}
/* a frase e a faixa */
.gdu-frase{position:absolute;left:0;right:0;top:40px;z-index:14;text-align:center;font:700 25px/1.12 Oswald,sans-serif;color:#fff;text-shadow:3px 3px 0 #000;letter-spacing:.02em}
.gdu-frase span{display:inline-block;opacity:0;animation:gduPalavra ${T}ms cubic-bezier(.2,1.5,.4,1) forwards}
@keyframes gduPalavra{0%{opacity:0;transform:translateY(-40px)}6%{opacity:1;transform:translateY(4px)}9%{transform:none}96%{opacity:1}100%{opacity:1}}
.gdu-frase em{font-style:normal;color:${OURO}}
.gdu-faixa{position:absolute;left:24px;right:24px;top:620px;z-index:14;background:${PRETO};border:4px solid ${OURO};border-radius:16px;box-shadow:4px 4px 0 #000;padding:8px 8px 9px;text-align:center;opacity:0;animation:gduFaixaS ${T}ms cubic-bezier(.2,1.3,.4,1) forwards}
@keyframes gduFaixaS{0%,${pct(6200)}{opacity:0;transform:scale(.4)}${pct(6550)}{opacity:1;transform:scale(1.06)}${pct(6750)}{transform:scale(1)}${pct(8200)}{opacity:1}100%{opacity:0}}
.gdu-faixa small{display:block;font:700 13px Oswald,sans-serif;letter-spacing:.22em;color:${OURO}}
.gdu-faixa b{display:block;font:700 27px/1.05 Oswald,sans-serif;color:#fff;margin-top:2px}
.gdu-faixa em{display:inline-block;font-style:normal;font:700 13px Oswald,sans-serif;color:#0C0C0C;background:linear-gradient(90deg,${OURO},#fff6b0,${OURO});border-radius:7px;padding:2px 9px;margin-top:5px;letter-spacing:.14em}
@media (prefers-reduced-motion:reduce){.gdu-luz,.gdu-legenda,.gdu-bola,.gdu-rebote,.gdu-estalo,.gdu-flash,.gdu-carimbo,.gdu-cort,.gdu-raios{display:none}.gdu-treme,.gdu-gol{animation:none}.gdu-esc,.gdu-gk,.gdu-faixa,.gdu-frase span{animation:none;opacity:1}}
`

function useEscala() {
  const calc = () => Math.min(window.innerWidth / 420, window.innerHeight / 760)
  const [s, setS] = useState(calc)
  useEffect(() => { const f = () => setS(calc()); window.addEventListener('resize', f); return () => window.removeEventListener('resize', f) }, [])
  return s
}

export function GalaDuarte({ clube, chave, mostra, grito }: { clube: string; chave: string; mostra: string; grito: string }) {
  const s = useEscala()
  void grito
  const frase = [tr('PÊNALTI CONTRA?', 'PENALTY AGAINST?'), tr('AQUI TEM', 'HERE WE HAVE'), 'SÃO VICTOR 🙏']
  return createPortal(
    <div key={chave} className="gdu" aria-hidden>
      <style>{CSS}</style>
      <div className="gdu-ceu" />
      <div className="gdu-palco" style={{ transform: `translate(-50%,-50%) scale(${s})` }}>
       <div className="gdu-treme">
        {[60, 360].map((x, i) => <i key={i} className="gdu-luz" style={{ left: x, animationDelay: `${i * -1700}ms` }} />)}
        <div className="gdu-gram" />
        <div className="gdu-gol" />
        <div className="gdu-marca" />
        <div className="gdu-legenda">{tr('ÚLTIMO LANCE', 'LAST KICK')}<b>{tr('PÊNALTI CONTRA 😱', 'PENALTY AGAINST 😱')}</b></div>
        <div className="gdu-bola">⚽</div>
        <div className="gdu-gk"><img src={paredaoImg} alt="" /></div>
        <div className="gdu-estalo">💥</div>
        <div className="gdu-rebote">⚽</div>
        <div className="gdu-carimbo">{tr('DEFENDEU!', 'SAVED!')}</div>
        <div className="gdu-raios" />
        <div className="gdu-esc"><Escudo nome={clube} size={220} /></div>
        <div className="gdu-cort">
          {Array.from({ length: 8 }, (_, i) => <i key={i} style={{ background: i % 2 ? BRANCO : PRETO, animationDelay: `${i * 35}ms` }} />)}
        </div>
        <div className="gdu-frase">
          {frase.map((p, i) => <span key={i} style={{ display: 'block', animationDelay: `${5300 + i * 300}ms` }}>{i === 2 ? <em style={{ fontSize: 38 }}>{p}</em> : p}</span>)}
        </div>
        <div className="gdu-faixa">
          <small>{tr('🧤 CHEGOU NA SALA', '🧤 JUST ARRIVED')}</small>
          <b>{mostra}</b>
          <em>{tr('O PAREDÃO', 'THE WALL')}</em>
        </div>
        <div className="gdu-flash" />
       </div>
      </div>
    </div>,
    document.body,
  )
}

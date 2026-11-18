// ─── 🧤🐓 ENTRADA ÚNICA DO DUARTE FC: "O REPLAY" ───────────────────────────────────────────────────────────────────
//
// Pedido do Diego (18/11, batismo FUNDADOR do luizfelipeduarte212): *"faça entrada de gala personalizada principalmente pelo
// goleiro Victor defendendo pênalti igual ele tá nessa pose"*. A mascote (arte do dono) é O Paredão: o goleiro camisa 1 caído
// de lado, defendendo com o PÉ esticado pro alto (a pose da defesa do Victor, Libertadores 2013 — foi nas QUARTAS, contra o
// Tijuana; nada aqui diz "final").
// 2ª versão (mesmo dia): ele gostou da defesa, mas não das frases (*"N sei se gostei das frases"*). Então a gala agora é quase
// sem texto — conta a história com imagem, como uma transmissão de TV:
// 1) escuro, só um refletor em cima da bola na marca do pênalti
// 2) o lance ao vivo: bola na marca, chute, O Paredão desliza e espalma com o PÉ — a tela treme
// 3) 🔁 REPLAY de TV: a câmera dá zoom no pé e repete o lance em câmera lenta, com a tarja vermelha de replay
// 4) as listras PRETA e BRANCA do manto varrem a tela
// 5) o escudo cai com a estrela dourada girando atrás; O Paredão vai pro canto
// 6) só o nome do clube, grande, e "CHEGOU NA SALA"
// Mesmo esquema das outras galas únicas: palco 420×760 escalado, camada fixa sem clique, fora do reducer, sem localStorage.
// Sem som próprio por enquanto: não existe canto do Atlético no jogo ainda (o Diego vai mandar).
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Escudo } from './escudos'
import { tr } from './lang'
import paredaoImg from './img/duarte-mascote.webp' // 440×335, O Paredão defendendo com o pé (a bola fica no canto de cima)

export const DUARTE_MS = 9000
const T = DUARTE_MS
const pct = (ms: number) => (ms / T * 100).toFixed(1) + '%'
const PRETO = '#101010', BRANCO = '#F1F1F0', OURO = '#F7D50A'
const KW = 400, KH = Math.round(KW * 335 / 440), KX = 10, KY = 360 // O Paredão no palco
const BX = Math.round(KX + KW * 0.905), BY = Math.round(KY + KH * 0.09) // onde o pé encontra a bola
const CHUTE = 1700, DEFESA = 2050 // ao vivo
const R0 = 2600, RCHUTE = 3000, RDEFESA = 3900, R1 = 4500 // o replay (mais lento)

// a mesma cena (gol, bola, goleiro) serve pro ao vivo e pro replay: só mudam os tempos
function lance(p: string, chute: number, defesa: number, entra: number) {
  return `
.${p}-bola{position:absolute;left:0;top:0;z-index:11;font-size:30px;line-height:1;opacity:0;animation:${p}Bola ${T}ms linear forwards}
@keyframes ${p}Bola{0%,${pct(entra)}{opacity:0;transform:translate(194px,660px) scale(1.2)}${pct(entra + 100)}{opacity:1;transform:translate(194px,660px) scale(1.2)}${pct(chute)}{opacity:1;transform:translate(194px,660px) scale(1.2) rotate(0)}${pct(defesa - 10)}{opacity:1;transform:translate(${BX - 18}px,${BY - 18}px) scale(.95) rotate(540deg)}${pct(defesa)}{opacity:0}100%{opacity:0}}
.${p}-reb{position:absolute;left:0;top:0;z-index:11;font-size:28px;line-height:1;opacity:0;animation:${p}Reb ${T}ms cubic-bezier(.2,.7,.4,1) forwards}
@keyframes ${p}Reb{0%,${pct(defesa)}{opacity:0;transform:translate(${BX - 16}px,${BY - 16}px)}${pct(defesa + 20)}{opacity:1}${pct(defesa + 480)}{opacity:1;transform:translate(470px,40px) rotate(-720deg)}${pct(defesa + 500)}{opacity:0}100%{opacity:0}}
.${p}-gk{position:absolute;left:${KX}px;top:${KY}px;width:${KW}px;height:${KH}px;z-index:10;opacity:0;animation:${p}Gk ${T}ms cubic-bezier(.25,1.1,.45,1) forwards}
@keyframes ${p}Gk{0%,${pct(chute)}{opacity:0;transform:translateX(-380px) rotate(8deg)}${pct(defesa)}{opacity:1;transform:none}${pct(defesa + 140)}{transform:translateY(-6px) rotate(-2deg)}${pct(defesa + 280)}{transform:none}100%{opacity:1;transform:none}}
.${p}-gk img{width:100%;height:100%;display:block;clip-path:polygon(0 0,83.6% 0,83.6% 19.1%,100% 19.1%,100% 100%,0 100%);filter:drop-shadow(5px 7px 0 rgba(0,0,0,.55))}
.${p}-est{position:absolute;left:${BX - 40}px;top:${BY - 40}px;width:80px;height:80px;z-index:12;font-size:58px;line-height:80px;text-align:center;opacity:0;animation:${p}Est ${T}ms ease forwards}
@keyframes ${p}Est{0%,${pct(defesa)}{opacity:0;transform:scale(.2)}${pct(defesa + 60)}{opacity:1;transform:scale(1.4)}${pct(defesa + 380)}{opacity:0;transform:scale(1)}100%{opacity:0}}
`
}

const CSS = `
.gdu{position:fixed;inset:0;z-index:99990;pointer-events:none;overflow:hidden;animation:gduVis ${T}ms ease forwards}
@keyframes gduVis{0%{opacity:0}3%{opacity:1}95%{opacity:1}100%{opacity:0}}
.gdu-ceu{position:absolute;inset:0;background:radial-gradient(ellipse at 50% 30%,#22324a 0%,#0b1220 60%,#05080e 100%)}
.gdu-palco{position:absolute;left:50%;top:50%;width:420px;height:760px;overflow:hidden}
.gdu-treme{position:absolute;inset:0;animation:gduTreme ${T}ms linear forwards}
@keyframes gduTreme{0%,${pct(DEFESA)}{transform:none}${pct(DEFESA + 40)}{transform:translate(8px,6px)}${pct(DEFESA + 110)}{transform:translate(-7px,-4px)}${pct(DEFESA + 190)}{transform:translate(4px,3px)}${pct(DEFESA + 280)}{transform:none}100%{transform:none}}
/* o campo */
.gdu-luz{position:absolute;top:-40px;width:120px;height:560px;margin-left:-60px;transform-origin:50% 0;z-index:1;
  background:linear-gradient(180deg,rgba(255,250,220,.5),rgba(255,250,220,0));clip-path:polygon(40% 0,60% 0,100% 100%,0 100%);animation:gduLuz 3400ms ease-in-out infinite alternate}
@keyframes gduLuz{0%{transform:rotate(-24deg)}100%{transform:rotate(24deg)}}
.gdu-campo{position:absolute;inset:0}
.gdu-gram{position:absolute;left:0;right:0;top:470px;bottom:0;z-index:2;background:repeating-linear-gradient(180deg,#1f7a3a 0 34px,#1a6b33 34px 68px)}
.gdu-gol{position:absolute;left:50%;top:300px;width:330px;height:172px;margin-left:-165px;z-index:3;border:7px solid #fff;border-bottom:none;border-radius:4px 4px 0 0;
  background:repeating-linear-gradient(90deg,rgba(255,255,255,.28) 0 2px,transparent 2px 13px),repeating-linear-gradient(0deg,rgba(255,255,255,.28) 0 2px,transparent 2px 13px)}
.gdu-marca{position:absolute;left:206px;top:690px;width:9px;height:9px;border-radius:50%;background:#fff;z-index:3}
/* o refletor só na bola, na marca do pênalti */
.gdu-escuro{position:absolute;inset:0;z-index:14;background:radial-gradient(circle at 210px 675px,rgba(5,8,14,0) 55px,rgba(5,8,14,.93) 115px);animation:gduEscuro ${T}ms linear forwards}
@keyframes gduEscuro{0%,${pct(1350)}{opacity:.92}${pct(1650)}{opacity:0}100%{opacity:0}}
${lance('gdv', CHUTE, DEFESA, 200)}
.gdu-flash{position:absolute;inset:0;z-index:20;background:#fffbe6;opacity:0;animation:gduFlash ${T}ms linear forwards}
@keyframes gduFlash{0%,${pct(DEFESA)}{opacity:0}${pct(DEFESA + 40)}{opacity:.6}${pct(DEFESA + 260)}{opacity:0}${pct(RDEFESA)}{opacity:0}${pct(RDEFESA + 40)}{opacity:.35}${pct(RDEFESA + 260)}{opacity:0}100%{opacity:0}}
/* 🔁 O REPLAY: um campo inteiro por cima, com zoom no pé, câmera lenta e cara de TV */
.gdu-rep{position:absolute;inset:0;z-index:13;overflow:hidden;opacity:0;animation:gduRep ${T}ms linear forwards}
@keyframes gduRep{0%,${pct(R0)}{opacity:0}${pct(R0 + 150)}{opacity:1}${pct(R1 - 150)}{opacity:1}${pct(R1)}{opacity:0}100%{opacity:0}}
.gdu-rep-cam{position:absolute;inset:0;transform-origin:${BX}px ${BY}px;animation:gduCam ${T}ms ease-in-out forwards;filter:saturate(.75) contrast(1.1)}
@keyframes gduCam{0%,${pct(R0)}{transform:scale(1)}${pct(RCHUTE)}{transform:scale(1.25)}${pct(RDEFESA)}{transform:scale(2)}${pct(R1)}{transform:scale(2.1)}100%{transform:scale(2.1)}}
.gdu-rep-tv{position:absolute;inset:0;z-index:30;background:repeating-linear-gradient(0deg,rgba(0,0,0,.18) 0 2px,transparent 2px 4px);box-shadow:inset 0 0 90px rgba(0,0,0,.7)}
.gdu-rep-tag{position:absolute;left:16px;top:18px;z-index:31;display:flex;align-items:center;gap:8px;background:#C2452F;color:#fff;border:3px solid #0C0C0C;border-radius:10px;padding:4px 10px;font:700 20px Oswald,sans-serif;letter-spacing:.12em;box-shadow:3px 3px 0 #000}
.gdu-rep-tag i{width:10px;height:10px;border-radius:50%;background:#fff;animation:gduPisca 600ms steps(2) infinite}
@keyframes gduPisca{50%{opacity:0}}
${lance('gdr', RCHUTE, RDEFESA, R0)}
/* a cortina de listras preta e branca */
.gdu-cort{position:absolute;inset:0;z-index:17;display:flex;pointer-events:none}
.gdu-cort i{flex:1;height:100%;transform:translateY(-102%);animation:gduFaixa ${T}ms cubic-bezier(.6,0,.3,1) forwards}
@keyframes gduFaixa{0%,${pct(R1 - 300)}{transform:translateY(-102%)}${pct(R1 + 200)}{transform:translateY(0)}${pct(R1 + 450)}{transform:translateY(0)}${pct(R1 + 950)}{transform:translateY(102%)}100%{transform:translateY(102%)}}
/* depois da cortina: o goleiro no canto e o escudo */
.gdu-canto{position:absolute;left:${KX}px;top:${KY}px;width:${KW}px;height:${KH}px;z-index:10;opacity:0;transform-origin:30% 100%;animation:gduCanto ${T}ms ease forwards}
@keyframes gduCanto{0%,${pct(R1 + 300)}{opacity:0;transform:translate(0px,-40px) scale(.5)}${pct(R1 + 400)}{opacity:1}100%{opacity:1;transform:translate(0px,-40px) scale(.5)}}
.gdu-canto img{width:100%;height:100%;display:block;filter:drop-shadow(4px 5px 0 rgba(0,0,0,.55))}
.gdu-sumir{position:absolute;inset:0;z-index:10;animation:gduSome ${T}ms linear forwards}
@keyframes gduSome{0%,${pct(R1 + 300)}{opacity:1}${pct(R1 + 320)}{opacity:0}100%{opacity:0}}
.gdu-esc{position:absolute;left:50%;top:150px;width:240px;height:260px;margin-left:-120px;z-index:9;display:flex;align-items:center;justify-content:center;opacity:0;
  filter:drop-shadow(0 0 24px rgba(247,213,10,.7)) drop-shadow(5px 6px 0 rgba(0,0,0,.55));animation:gduEsc ${T}ms cubic-bezier(.2,1.3,.4,1) forwards}
@keyframes gduEsc{0%,${pct(R1 + 600)}{opacity:0;transform:scale(2.6) translateY(-40px)}${pct(R1 + 900)}{opacity:1;transform:scale(.94)}${pct(R1 + 1100)}{transform:scale(1)}100%{opacity:1;transform:scale(1)}}
.gdu-raios{position:absolute;left:50%;top:280px;width:480px;height:480px;margin:-240px 0 0 -240px;z-index:8;border-radius:50%;
  background:repeating-conic-gradient(rgba(247,213,10,.55) 0 8deg,rgba(255,255,255,.12) 8deg 22deg);-webkit-mask:radial-gradient(circle,#000 28%,transparent 68%);mask:radial-gradient(circle,#000 28%,transparent 68%);opacity:0;animation:gduRaios ${T}ms linear forwards}
@keyframes gduRaios{0%,${pct(R1 + 800)}{opacity:0;transform:rotate(0) scale(.5)}${pct(R1 + 1100)}{opacity:1;transform:rotate(30deg) scale(1)}100%{opacity:1;transform:rotate(150deg) scale(1)}}
/* só o nome */
.gdu-nome{position:absolute;left:16px;right:16px;top:560px;z-index:14;text-align:center;opacity:0;animation:gduNome ${T}ms cubic-bezier(.2,1.3,.4,1) forwards}
@keyframes gduNome{0%,${pct(R1 + 1300)}{opacity:0;transform:scale(.4)}${pct(R1 + 1650)}{opacity:1;transform:scale(1.06)}${pct(R1 + 1850)}{transform:scale(1)}${pct(8600)}{opacity:1}100%{opacity:0}}
.gdu-nome small{display:inline-block;font:700 14px Oswald,sans-serif;letter-spacing:.24em;color:#0C0C0C;background:${OURO};border:3px solid #0C0C0C;border-radius:9px;padding:3px 12px;box-shadow:3px 3px 0 #000}
.gdu-nome b{display:block;margin-top:8px;font:700 54px/1 Oswald,sans-serif;color:#fff;text-transform:uppercase;text-shadow:4px 4px 0 #000;-webkit-text-stroke:2px #000}
@media (prefers-reduced-motion:reduce){.gdu-luz,.gdu-escuro,.gdu-flash,.gdu-rep,.gdu-cort,.gdu-raios,.gdv-bola,.gdv-reb,.gdv-est{display:none}.gdu-treme{animation:none}.gdu-esc,.gdu-canto,.gdu-nome{animation:none;opacity:1}}
`

function useEscala() {
  const calc = () => Math.min(window.innerWidth / 420, window.innerHeight / 760)
  const [s, setS] = useState(calc)
  useEffect(() => { const f = () => setS(calc()); window.addEventListener('resize', f); return () => window.removeEventListener('resize', f) }, [])
  return s
}

const Campo = () => (
  <>
    {[60, 360].map((x, i) => <i key={i} className="gdu-luz" style={{ left: x, animationDelay: `${i * -1700}ms` }} />)}
    <div className="gdu-gram" />
    <div className="gdu-gol" />
    <div className="gdu-marca" />
  </>
)
const Lance = ({ p }: { p: string }) => (
  <>
    <div className={`${p}-bola`}>⚽</div>
    <div className={`${p}-gk`}><img src={paredaoImg} alt="" /></div>
    <div className={`${p}-est`}>💥</div>
    <div className={`${p}-reb`}>⚽</div>
  </>
)

export function GalaDuarte({ clube, chave, mostra, grito }: { clube: string; chave: string; mostra: string; grito: string }) {
  const s = useEscala()
  void grito
  return createPortal(
    <div key={chave} className="gdu" aria-hidden>
      <style>{CSS}</style>
      <div className="gdu-ceu" />
      <div className="gdu-palco" style={{ transform: `translate(-50%,-50%) scale(${s})` }}>
       <div className="gdu-treme">
        <Campo />
        <div className="gdu-sumir"><Lance p="gdv" /></div>
        <div className="gdu-escuro" />
        <div className="gdu-rep">
          <div className="gdu-rep-cam"><div className="gdu-ceu" /><Campo /><Lance p="gdr" /></div>
          <div className="gdu-rep-tv" />
          <div className="gdu-rep-tag"><i />{tr('REPLAY', 'REPLAY')}</div>
        </div>
        <div className="gdu-raios" />
        <div className="gdu-esc"><Escudo nome={clube} size={230} /></div>
        <div className="gdu-canto"><img src={paredaoImg} alt="" /></div>
        <div className="gdu-nome">
          <small>{tr('🧤 CHEGOU NA SALA', '🧤 JUST ARRIVED')}</small>
          <b>{mostra}</b>
        </div>
        <div className="gdu-cort">
          {Array.from({ length: 8 }, (_, i) => <i key={i} style={{ background: i % 2 ? BRANCO : PRETO, animationDelay: `${i * 35}ms` }} />)}
        </div>
        <div className="gdu-flash" />
       </div>
      </div>
    </div>,
    document.body,
  )
}

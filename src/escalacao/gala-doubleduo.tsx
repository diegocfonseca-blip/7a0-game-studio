// ─── 👑💜 ENTRADA ÚNICA DO DOUBLE DUO FC: "O SAVE" ───────────────────────────────────────────────────────────────
//
// Pedido do Diego (09/11, batismo FUNDADOR do doublecontatocomercial): *"faça também gala personalizada… é um streamer que
// costuma fazer jogos de simulação manager de futebol"*. A arte dele: o monograma DD azul com a coroa dourada, o controle, a
// prancheta e as redes; a mascote é ele mesmo de braços cruzados na frente do setup. Preto, roxo e azul. Então (diferente da
// gala do Futpoint, que é uma LIVE com chat): a entrada é um JOGO DE MANAGER abrindo.
// 1) a tela liga com scanline e a barra "CARREGANDO SAVE… DOUBLE DUO FC" enche
// 2) a PRANCHETA aparece e a escalação 4-3-3 se desenha, peça por peça, em roxo, com as setas da tática
// 3) os DOIS "D" entram cada um de um lado, batem no meio (tremida) e viram o escudo coroado, com brilho passando
// 4) O STREAMER sobe de braços cruzados e vai pro canto
// 5) três frases — TÁTICA NA PRANCHETA · CRAQUE NO ELENCO · SAVE NA HISTÓRIA — e a faixa "CHEGOU NA SALA"
// Mesmo esquema das outras galas únicas: palco 420×760 escalado, camada fixa sem clique, fora do reducer, sem localStorage.
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Escudo } from './escudos'
import { tr } from './lang'
import mascoteImg from './img/doubleduo-mascote.webp'

export const DOUBLEDUO_MS = 8800
const T = DOUBLEDUO_MS
const pct = (ms: number) => (ms / T * 100).toFixed(1) + '%'
const ROXO = '#A131BF', AZUL = '#1E88FF', PRETO = '#0B080D', GOLD = '#FFC400'

const CSS = `
.gdd{position:fixed;inset:0;z-index:99990;pointer-events:none;overflow:hidden;animation:gddVis ${T}ms ease forwards}
@keyframes gddVis{0%{opacity:0}3%{opacity:1}95%{opacity:1}100%{opacity:0}}
.gdd-fundo{position:absolute;inset:0;background:#07050a}
.gdd-palco{position:absolute;left:50%;top:50%;width:420px;height:760px;overflow:hidden}
.gdd-treme{position:absolute;inset:0;animation:gddTreme ${T}ms linear forwards}
@keyframes gddTreme{0%,${pct(4050)}{transform:none}${pct(4090)}{transform:translate(-8px,5px)}${pct(4140)}{transform:translate(7px,-4px)}${pct(4200)}{transform:translate(-3px,2px)}${pct(4260)}{transform:none}100%{transform:none}}
/* 📺 a tela do jogo */
.gdd-tela{position:absolute;inset:0;background:radial-gradient(ellipse at 50% 30%,#2a1238 0%,#120a18 55%,#07050a 100%);opacity:0;animation:gddTela ${T}ms ease forwards}
@keyframes gddTela{0%{opacity:0}${pct(250)}{opacity:1}100%{opacity:1}}
.gdd-scan{position:absolute;inset:0;background:repeating-linear-gradient(0deg,rgba(255,255,255,.035) 0 2px,transparent 2px 5px);opacity:.9}
.gdd-linha{position:absolute;left:0;right:0;height:3px;background:linear-gradient(90deg,transparent,${AZUL},transparent);box-shadow:0 0 14px ${AZUL};opacity:0;animation:gddLinha 900ms ease-out both}
@keyframes gddLinha{0%{opacity:0;transform:scaleX(.1)}30%{opacity:1}100%{opacity:0;transform:scaleX(1.4)}}
.gdd-load{position:absolute;left:40px;right:40px;top:300px;text-align:center;opacity:0;animation:gddLoad ${T}ms ease forwards}
@keyframes gddLoad{0%,${pct(200)}{opacity:0}${pct(450)}{opacity:1}${pct(1700)}{opacity:1}${pct(1950)}{opacity:0}100%{opacity:0}}
.gdd-load small{display:block;font:700 13px/1 Oswald,sans-serif;letter-spacing:.24em;color:#b9a6c9}
.gdd-load b{display:block;font:700 26px/1.1 Oswald,sans-serif;color:#fff;margin:6px 0 12px;letter-spacing:.04em}
.gdd-barra{height:14px;border:2px solid ${ROXO};border-radius:8px;overflow:hidden;background:#1a0f22}
.gdd-barra i{display:block;height:100%;width:100%;background:linear-gradient(90deg,${ROXO},${AZUL});transform-origin:0 50%;transform:scaleX(0);animation:gddBarra ${T}ms cubic-bezier(.5,0,.4,1) forwards}
@keyframes gddBarra{0%,${pct(450)}{transform:scaleX(0)}${pct(1600)}{transform:scaleX(1)}100%{transform:scaleX(1)}}
/* 📋 a prancheta com a escalação */
.gdd-pran{position:absolute;left:50%;top:95px;width:300px;height:420px;margin-left:-150px;border-radius:14px;background:linear-gradient(180deg,#1d5b2f,#14462a);
  border:4px solid ${ROXO};box-shadow:0 0 24px rgba(161,49,191,.5),5px 6px 0 rgba(0,0,0,.6);opacity:0;animation:gddPran ${T}ms cubic-bezier(.2,1.3,.4,1) forwards}
@keyframes gddPran{0%,${pct(1800)}{opacity:0;transform:scale(.6) rotate(-4deg)}${pct(2150)}{opacity:1;transform:scale(1) rotate(0)}${pct(3500)}{opacity:1;filter:none}${pct(3900)}{opacity:1;filter:brightness(.35)}100%{opacity:1;filter:brightness(.35)}}
.gdd-pran svg{position:absolute;inset:0;width:100%;height:100%}
.gdd-peca{opacity:0;animation:gddPeca 360ms cubic-bezier(.2,1.6,.4,1) both}
@keyframes gddPeca{0%{opacity:0;transform:scale(.2)}100%{opacity:1;transform:scale(1)}}
.gdd-seta{stroke-dasharray:90;stroke-dashoffset:90;animation:gddSeta 600ms ease-out both}
@keyframes gddSeta{to{stroke-dashoffset:0}}
/* 🅳🅳 os dois D se juntam */
.gdd-d{position:absolute;top:150px;font:900 170px/1 Oswald,sans-serif;color:${AZUL};-webkit-text-stroke:5px #fff;text-shadow:0 0 22px ${AZUL},6px 7px 0 #000;z-index:9;opacity:0}
.gdd-d.e{left:60px;animation:gddDe ${T}ms cubic-bezier(.5,0,.3,1) forwards}
.gdd-d.d{left:235px;animation:gddDd ${T}ms cubic-bezier(.5,0,.3,1) forwards}
@keyframes gddDe{0%,${pct(3500)}{opacity:0;transform:translateX(-360px)}${pct(3700)}{opacity:1}${pct(4050)}{transform:translateX(40px)}${pct(4400)}{opacity:1;transform:translateX(40px) scale(1)}${pct(4650)}{opacity:0;transform:translateX(40px) scale(.6)}100%{opacity:0}}
@keyframes gddDd{0%,${pct(3500)}{opacity:0;transform:translateX(360px)}${pct(3700)}{opacity:1}${pct(4050)}{transform:translateX(-40px)}${pct(4400)}{opacity:1;transform:translateX(-40px) scale(1)}${pct(4650)}{opacity:0;transform:translateX(-40px) scale(.6)}100%{opacity:0}}
.gdd-choque{position:absolute;left:50%;top:240px;width:340px;height:340px;margin:-170px 0 0 -170px;border-radius:50%;z-index:8;
  background:radial-gradient(circle,rgba(255,255,255,.9),rgba(30,136,255,.5) 30%,rgba(161,49,191,.25) 50%,transparent 70%);opacity:0;animation:gddChoque ${T}ms ease-out forwards}
@keyframes gddChoque{0%,${pct(4030)}{opacity:0;transform:scale(.2)}${pct(4150)}{opacity:1;transform:scale(1)}${pct(4900)}{opacity:0;transform:scale(1.6)}100%{opacity:0}}
/* 🛡️ o escudo e a coroa */
.gdd-anel{position:absolute;left:50%;top:240px;width:260px;height:260px;margin:-130px 0 0 -130px;border-radius:50%;z-index:10;border:5px solid ${ROXO};
  box-shadow:0 0 22px ${ROXO},inset 0 0 22px rgba(30,136,255,.45);opacity:0;animation:gddAnel ${T}ms ease forwards}
@keyframes gddAnel{0%,${pct(4400)}{opacity:0;transform:scale(.3)}${pct(4750)}{opacity:1;transform:scale(1.08)}${pct(4950)}{transform:scale(1)}100%{opacity:1;transform:scale(1)}}
.gdd-esc{position:absolute;left:50%;top:240px;width:240px;height:240px;margin:-120px 0 0 -120px;z-index:11;display:flex;align-items:center;justify-content:center;opacity:0;
  filter:drop-shadow(0 0 20px rgba(161,49,191,.6)) drop-shadow(5px 6px 0 rgba(0,0,0,.6));animation:gddEsc ${T}ms cubic-bezier(.2,1.25,.4,1) forwards}
@keyframes gddEsc{0%,${pct(4400)}{opacity:0;transform:scale(.3)}${pct(4750)}{opacity:1;transform:scale(1.1)}${pct(4950)}{transform:scale(1)}100%{opacity:1;transform:scale(1)}}
.gdd-coroa{position:absolute;left:50%;top:84px;margin-left:-46px;z-index:12;font-size:78px;line-height:1;opacity:0;filter:drop-shadow(0 0 14px rgba(255,196,0,.7));animation:gddCoroa ${T}ms cubic-bezier(.3,0,.3,1) forwards}
@keyframes gddCoroa{0%,${pct(4800)}{opacity:0;transform:translateY(-380px) rotate(-20deg)}${pct(4900)}{opacity:1}${pct(5200)}{transform:translateY(0) rotate(0)}${pct(5300)}{transform:translateY(-12px)}${pct(5400)}{transform:translateY(0)}100%{opacity:1;transform:translateY(0)}}
.gdd-brilho{position:absolute;left:50%;top:240px;width:240px;height:240px;margin:-120px 0 0 -120px;z-index:13;overflow:hidden;border-radius:50%;opacity:0;animation:gddBrOn ${T}ms linear forwards}
.gdd-brilho::after{content:'';position:absolute;top:-20%;bottom:-20%;width:60px;left:-80px;background:linear-gradient(90deg,transparent,rgba(255,255,255,.8),transparent);transform:skewX(-18deg);animation:gddBr ${T}ms linear forwards}
@keyframes gddBrOn{0%,${pct(5450)}{opacity:0}${pct(5500)}{opacity:1}${pct(6250)}{opacity:1}${pct(6350)}{opacity:0}100%{opacity:0}}
@keyframes gddBr{0%,${pct(5500)}{left:-80px}${pct(6250)}{left:300px}100%{left:300px}}
/* 🎮 o streamer sobe */
.gdd-mas{position:absolute;left:50%;top:380px;margin-left:-125px;z-index:14;opacity:0;animation:gddMas ${T}ms cubic-bezier(.3,0,.3,1) forwards}
.gdd-mas img{display:block;width:250px;height:324px;filter:drop-shadow(0 0 22px rgba(161,49,191,.5)) drop-shadow(5px 6px 0 rgba(0,0,0,.6))}
@keyframes gddMas{0%,${pct(5400)}{opacity:0;transform:translateY(260px)}${pct(5550)}{opacity:1}${pct(5900)}{transform:translateY(-10px)}${pct(6050)}{transform:translateY(0)}
  ${pct(6300)}{transform:translateY(0) scale(1)}${pct(6700)}{opacity:1;transform:translate(118px,40px) scale(.62)}100%{opacity:1;transform:translate(118px,40px) scale(.62)}}
/* 🗣️ as frases */
.gdd-frase{position:absolute;left:18px;z-index:15;transform-origin:0 50%;font:700 22px/1 Oswald,sans-serif;letter-spacing:.06em;color:#fff;-webkit-text-stroke:1.5px ${PRETO};text-shadow:3px 3px 0 ${PRETO};opacity:0;animation:gddFraseIn 900ms cubic-bezier(.2,1.4,.4,1) both}
.gdd-frase i{font-style:normal;color:${ROXO};-webkit-text-stroke:1px #fff}
@keyframes gddFraseIn{0%{opacity:0;transform:scale(2.2)}60%{opacity:1;transform:scale(.96)}100%{opacity:1;transform:scale(1)}}
.gdd-faixa{position:absolute;left:20px;right:20px;top:668px;z-index:17;background:${PRETO};border:3px solid ${ROXO};border-radius:16px;padding:7px;text-align:center;box-shadow:0 0 18px rgba(161,49,191,.45);opacity:0;animation:gddFaixa ${T}ms cubic-bezier(.2,1.3,.4,1) forwards}
@keyframes gddFaixa{0%,${pct(7000)}{opacity:0;transform:scale(.4)}${pct(7300)}{opacity:1;transform:scale(1.06)}${pct(7500)}{transform:scale(1)}${pct(8350)}{opacity:1}100%{opacity:0}}
.gdd-faixa small{display:block;font:700 13px Oswald,sans-serif;letter-spacing:.22em;color:${GOLD}}
.gdd-faixa b{display:block;font:700 26px/1.05 Oswald,sans-serif;color:#fff;margin-top:2px;text-transform:uppercase}
.gdd-faixa em{display:block;font-style:normal;font:700 14px Oswald,sans-serif;color:${AZUL};margin-top:3px;letter-spacing:.12em}
@media (prefers-reduced-motion:reduce){.gdd-treme,.gdd-linha,.gdd-choque,.gdd-brilho,.gdd-frase,.gdd-d,.gdd-load{display:none}.gdd-tela,.gdd-pran,.gdd-anel,.gdd-esc,.gdd-coroa,.gdd-mas,.gdd-faixa{animation:none;opacity:1}}
`

function useEscala() {
  const calc = () => Math.min(window.innerWidth / 420, window.innerHeight / 760)
  const [s, setS] = useState(calc)
  useEffect(() => { const f = () => setS(calc()); window.addEventListener('resize', f); return () => window.removeEventListener('resize', f) }, [])
  return s
}

// 4-3-3 na prancheta (300×420), do goleiro pro ataque — cada peça entra 140 ms depois da outra
const PECAS: [number, number][] = [[150, 382], [52, 300], [115, 312], [185, 312], [248, 300], [80, 215], [150, 228], [220, 215], [65, 110], [150, 88], [235, 110]]
const SETAS: [number, number, number, number][] = [[52, 290, 52, 170], [248, 290, 248, 170], [150, 215, 150, 130]]
const FRASES: { pt: [string, string]; en: [string, string]; t: number; y: number }[] = [
  { pt: ['TÁTICA ', 'NA PRANCHETA'], en: ['TACTICS ', 'ON THE BOARD'], t: 6400, y: 420 },
  { pt: ['CRAQUE ', 'NO ELENCO'], en: ['STARS ', 'IN THE SQUAD'], t: 6700, y: 456 },
  { pt: ['SAVE ', 'NA HISTÓRIA'], en: ['A SAVE ', 'FOR HISTORY'], t: 7000, y: 492 },
]

export function GalaDoubleDuo({ clube, chave, mostra, grito }: { clube: string; chave: string; mostra: string; grito: string }) {
  const s = useEscala()
  void grito
  return createPortal(
    <div key={chave} className="gdd" aria-hidden>
      <style>{CSS}</style>
      <div className="gdd-fundo" />
      <div className="gdd-palco" style={{ transform: `translate(-50%,-50%) scale(${s})` }}>
        <div className="gdd-treme">
          <div className="gdd-tela"><div className="gdd-scan" /></div>
          {[120, 330, 560].map((y, i) => <span key={y} className="gdd-linha" style={{ top: y, animationDelay: `${150 + i * 180}ms` }} />)}
          <div className="gdd-load">
            <small>{tr('CARREGANDO SAVE…', 'LOADING SAVE…')}</small>
            <b>{mostra || clube}</b>
            <div className="gdd-barra"><i /></div>
          </div>
          <div className="gdd-pran">
            <svg viewBox="0 0 300 420" aria-hidden>
              <rect x="14" y="14" width="272" height="392" rx="6" fill="none" stroke="rgba(255,255,255,.55)" strokeWidth="2" />
              <path d="M14 210h272" stroke="rgba(255,255,255,.55)" strokeWidth="2" />
              <circle cx="150" cy="210" r="36" fill="none" stroke="rgba(255,255,255,.55)" strokeWidth="2" />
              <rect x="90" y="14" width="120" height="50" fill="none" stroke="rgba(255,255,255,.55)" strokeWidth="2" />
              <rect x="90" y="356" width="120" height="50" fill="none" stroke="rgba(255,255,255,.55)" strokeWidth="2" />
              {PECAS.map(([x, y], i) => (
                <g key={i} className="gdd-peca" style={{ animationDelay: `${2250 + i * 100}ms`, transformOrigin: `${x}px ${y}px` }}>
                  <circle cx={x} cy={y} r="13" fill={i === 0 ? GOLD : ROXO} stroke="#fff" strokeWidth="3" />
                  <text x={x} y={y + 5} textAnchor="middle" fontFamily="Oswald" fontWeight="700" fontSize="13" fill={i === 0 ? PRETO : '#fff'}>{i === 0 ? 1 : i === 9 ? 10 : i + 1}</text>
                </g>
              ))}
              {SETAS.map(([x1, y1, x2, y2], i) => <path key={i} className="gdd-seta" d={`M${x1} ${y1}L${x2} ${y2}`} stroke={AZUL} strokeWidth="4" strokeLinecap="round" fill="none" style={{ animationDelay: `${3400 + i * 120}ms` }} />)}
            </svg>
          </div>
          <div className="gdd-d e">D</div><div className="gdd-d d">D</div>
          <div className="gdd-choque" />
          <div className="gdd-anel" />
          <div className="gdd-esc"><Escudo nome={clube} size={210} /></div>
          <div className="gdd-brilho" />
          <div className="gdd-mas"><img src={mascoteImg} alt="" /></div>
          {FRASES.map(f => { const [a, b] = tr('pt', 'en') === 'en' ? f.en : f.pt; return <div key={f.t} className="gdd-frase" style={{ top: f.y, animationDelay: `${f.t}ms` }}>{a}<i>{b}</i></div> })}
          <div className="gdd-faixa">
            <small>{tr('👑 FUNDADOR Nº 100', '👑 FOUNDER Nº 100')}</small>
            <b>{mostra || clube}</b>
            <em>{tr('CHEGOU NA SALA', 'JUST JOINED THE ROOM')}</em>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}

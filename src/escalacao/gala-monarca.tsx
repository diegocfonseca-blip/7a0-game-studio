// ─── 👑⚪🔴⚫ ENTRADA ÚNICA DO MONARCA TRICOLOR: "A COROAÇÃO" ───────────────────────────────────────────────────────────
//
// Pedido do Diego (05/11, batismo 🖋 Fundador do danieltorresreus): *"faça entrada de gala personalizada com base no SP e no
// goleiro Rogério Ceni e sendo monarca, rei"*. A mascote do clube (arte do dono) é O Monarca: goleiro de preto, vermelho e branco,
// camisa 01, braçadeira de capitão e capa de rei. O FATO que a gente usa é o mais conhecido do goleiro do São Paulo: GOLEIRO QUE
// FAZ GOL DE FALTA. Nenhum nome de pessoa real aparece na tela — só o "01", a coroa e o tricolor.
// 1) as três faixas do tricolor (vermelho · branco · preto) cruzam a noite e o tapete vermelho desce até a área
// 2) o gol se desenha lá no alto, a barreira forma; O MONARCA entra de capa, bate a falta
// 3) a bola faz a curva por cima da barreira e entra no ângulo — tela treme, flash, "GOL DO GOLEIRO!"
// 4) a COROA desce do céu e pousa no escudo, chuva de papel tricolor, o "01" dourado atrás
// 5) a frase bate — SALVE O MONARCA — e a faixa "CHEGOU NA SALA"
// Mesmo esquema das outras galas únicas: palco 420×760 escalado, camada fixa sem clique, fora do reducer, sem localStorage.
// Som: o MESMO canto do São Paulo do Wen Milan B (`sfx/torcida-spfc-wen-v1.mp3`), que é o canto da carreira dele (sound.ts).
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Escudo } from './escudos'
import { tr } from './lang'
import { playMp3Gala } from './sound'
import monarcaImg from './img/monarca-tricolor-mascote.webp' // 391×440, O Monarca de capa com a bola

export const MONARCA_MS = 8800
const T = MONARCA_MS
const pct = (ms: number) => (ms / T * 100).toFixed(1) + '%'
const VERM = '#D40101', BRANCO = '#F2F1F3', PRETO = '#0A0A0A', GOLD = '#FFC400'
const sorte = (i: number) => ((i * 7919) % 997) / 997 // espalhado e sempre igual (a gala é igual pra todos)
// o gol lá no alto: de 70 a 350, travessão em 150, linha em 300
const GOL = { x0: 70, x1: 350, y0: 150, y1: 300 }
const MH = 300, MW = Math.round(MH * 391 / 440)
// a falta: sai do pé do Monarca (210, 600), sobe por cima da barreira (curva pra esquerda) e morre no ângulo (100, 176)
const CHUTE = { a: 3300, b: 4150 }

const CSS = `
.gmn{position:fixed;inset:0;z-index:99990;pointer-events:none;overflow:hidden;animation:gmnVis ${T}ms ease forwards}
@keyframes gmnVis{0%{opacity:0}3%{opacity:1}95%{opacity:1}100%{opacity:0}}
.gmn-ceu{position:absolute;inset:0;background:radial-gradient(ellipse at 50% 20%,#2a1010,#0c0606 55%,#000)}
.gmn-palco{position:absolute;left:50%;top:50%;width:420px;height:760px;overflow:hidden}
.gmn-treme{position:absolute;inset:0;animation:gmnTreme ${T}ms linear forwards}
@keyframes gmnTreme{0%,${pct(CHUTE.b - 10)}{transform:none}${pct(CHUTE.b + 40)}{transform:translate(-11px,6px)}${pct(CHUTE.b + 100)}{transform:translate(9px,-8px)}${pct(CHUTE.b + 170)}{transform:translate(-6px,-3px)}${pct(CHUTE.b + 240)}{transform:translate(4px,4px)}${pct(CHUTE.b + 320)}{transform:none}100%{transform:none}}
/* as três faixas do tricolor cruzando o céu */
.gmn-faixa3{position:absolute;left:-80px;width:620px;height:46px;border:3px solid #000;opacity:0;transform:rotate(-16deg) translateX(-700px)}
@keyframes gmnFaixa3{0%{opacity:0;transform:rotate(-16deg) translateX(-700px)}9%{opacity:1;transform:rotate(-16deg) translateX(0)}52%{opacity:1}62%{opacity:.18}100%{opacity:.18;transform:rotate(-16deg) translateX(0)}}
/* torcida piscando */
.gmn-flash{position:absolute;width:4px;height:4px;border-radius:50%;background:#fff;opacity:0;animation:gmnPisca 1300ms ease-in-out infinite}
@keyframes gmnPisca{0%,100%{opacity:0}50%{opacity:.9}}
/* o gramado e o tapete vermelho */
.gmn-grama{position:absolute;left:-20px;right:-20px;top:${GOL.y1}px;bottom:0;background:repeating-linear-gradient(180deg,#1f6b34 0 30px,#1a5c2c 30px 60px);border-top:3px solid rgba(255,255,255,.85)}
.gmn-tapete{position:absolute;left:150px;width:120px;top:${GOL.y1}px;bottom:0;background:linear-gradient(90deg,#8d0000,${VERM} 20%,#ff3b3b 50%,${VERM} 80%,#8d0000);border-left:4px solid ${GOLD};border-right:4px solid ${GOLD};transform-origin:50% 0;opacity:0;animation:gmnTapete ${T}ms cubic-bezier(.2,1,.4,1) forwards}
@keyframes gmnTapete{0%,${pct(500)}{opacity:0;transform:scaleY(0)}${pct(1300)}{opacity:1;transform:scaleY(1)}${pct(5600)}{opacity:1}${pct(6200)}{opacity:.4}100%{opacity:.4}}
/* o gol se desenha */
.gmn-gol{position:absolute;left:${GOL.x0}px;top:${GOL.y0}px;width:${GOL.x1 - GOL.x0}px;height:${GOL.y1 - GOL.y0}px;border:8px solid ${BRANCO};border-bottom:none;border-radius:4px 4px 0 0;box-shadow:4px 4px 0 rgba(0,0,0,.6);opacity:0;transform-origin:50% 100%;animation:gmnGol ${T}ms cubic-bezier(.2,1.3,.4,1) forwards}
@keyframes gmnGol{0%,${pct(1000)}{opacity:0;transform:scaleY(.1)}${pct(1450)}{opacity:1;transform:scaleY(1.04)}${pct(1600)}{transform:scaleY(1)}${pct(5200)}{opacity:1}${pct(5700)}{opacity:.3}100%{opacity:.3}}
.gmn-rede{position:absolute;inset:0;background:repeating-linear-gradient(45deg,rgba(255,255,255,.18) 0 2px,transparent 2px 14px),repeating-linear-gradient(-45deg,rgba(255,255,255,.18) 0 2px,transparent 2px 14px);animation:gmnRede ${T}ms ease forwards}
@keyframes gmnRede{0%,${pct(CHUTE.b)}{transform:none}${pct(CHUTE.b + 70)}{transform:scale(1.04,1.06)}${pct(CHUTE.b + 220)}{transform:scale(.99)}${pct(CHUTE.b + 340)}{transform:none}100%{transform:none}}
/* a barreira: 4 bonecos que pulam na hora da batida */
.gmn-barr{position:absolute;top:380px;width:34px;height:70px;border-radius:16px 16px 6px 6px;background:#222;border:3px solid #000;opacity:0;animation:gmnBarr ${T}ms ease forwards}
.gmn-barr::before{content:"";position:absolute;left:5px;top:-24px;width:24px;height:24px;border-radius:50%;background:#2b2b2b;border:3px solid #000}
@keyframes gmnBarr{0%,${pct(1500)}{opacity:0;transform:translateY(30px)}${pct(1800)}{opacity:1;transform:none}${pct(CHUTE.a + 80)}{transform:none}${pct(CHUTE.a + 300)}{transform:translateY(-34px)}${pct(CHUTE.a + 560)}{transform:none}${pct(5000)}{opacity:1}${pct(5400)}{opacity:0}100%{opacity:0}}
/* O MONARCA entra de capa pela direita e bate */
.gmn-rei{position:absolute;left:150px;top:440px;width:${MW}px;height:${MH}px;z-index:9;opacity:0;transform-origin:30% 100%;animation:gmnRei ${T}ms cubic-bezier(.25,1.1,.45,1) forwards}
@keyframes gmnRei{0%,${pct(1900)}{opacity:0;transform:translateX(260px) scale(.9)}${pct(2500)}{opacity:1;transform:none}${pct(CHUTE.a - 120)}{transform:rotate(4deg)}${pct(CHUTE.a)}{transform:rotate(-7deg) translateX(-14px)}${pct(CHUTE.a + 260)}{transform:none}${pct(5000)}{opacity:1;transform:none}${pct(5600)}{opacity:1;transform:translate(-150px,30px) scale(.55)}100%{opacity:1;transform:translate(-150px,30px) scale(.55)}}
.gmn-rei img{width:100%;height:100%;display:block;filter:drop-shadow(5px 7px 0 rgba(0,0,0,.6))}
/* a bola da falta: curva por cima da barreira até o ângulo */
.gmn-bola{position:absolute;left:-22px;top:-22px;width:44px;height:44px;font-size:42px;line-height:44px;text-align:center;z-index:10;opacity:0;filter:drop-shadow(3px 4px 0 rgba(0,0,0,.5));
  animation:gmnBola ${T}ms linear forwards}
@keyframes gmnBola{0%,${pct(CHUTE.a - 10)}{opacity:0;transform:translate(215px,660px) scale(1.2)}${pct(CHUTE.a)}{opacity:1;transform:translate(215px,660px) scale(1.2) rotate(0)}${pct(CHUTE.a + 300)}{transform:translate(250px,420px) scale(.95) rotate(260deg)}${pct(CHUTE.a + 560)}{transform:translate(190px,270px) scale(.72) rotate(520deg)}${pct(CHUTE.b)}{opacity:1;transform:translate(102px,178px) scale(.55) rotate(800deg)}${pct(CHUTE.b + 60)}{opacity:0;transform:translate(98px,172px) scale(.5)}100%{opacity:0}}
.gmn-rastro{position:absolute;left:96px;top:176px;width:220px;height:12px;border-radius:12px;z-index:8;background:linear-gradient(90deg,rgba(255,255,255,.85),transparent);transform:rotate(55deg);transform-origin:0 50%;opacity:0;animation:gmnRastro ${T}ms ease-out forwards}
@keyframes gmnRastro{0%,${pct(CHUTE.b - 260)}{opacity:0}${pct(CHUTE.b)}{opacity:.9}${pct(CHUTE.b + 420)}{opacity:0}100%{opacity:0}}
.gmn-onda{position:absolute;left:102px;top:178px;width:60px;height:60px;margin:-30px 0 0 -30px;border-radius:50%;border:6px solid #fff;z-index:12;opacity:0;animation:gmnOnda ${T}ms ease-out forwards}
@keyframes gmnOnda{0%,${pct(CHUTE.b)}{opacity:0;transform:scale(.3)}${pct(CHUTE.b + 50)}{opacity:1;transform:scale(1)}${pct(CHUTE.b + 600)}{opacity:0;transform:scale(5)}100%{opacity:0}}
.gmn-branco{position:absolute;inset:0;z-index:20;background:#fff;opacity:0;animation:gmnBranco ${T}ms linear forwards}
@keyframes gmnBranco{0%,${pct(CHUTE.b)}{opacity:0}${pct(CHUTE.b + 40)}{opacity:.75}${pct(CHUTE.b + 300)}{opacity:0}100%{opacity:0}}
/* "GOL DO GOLEIRO!" */
.gmn-gritogol{position:absolute;left:0;right:0;top:312px;z-index:13;text-align:center;opacity:0;animation:gmnGrito ${T}ms cubic-bezier(.2,1.5,.4,1) forwards}
@keyframes gmnGrito{0%,${pct(CHUTE.b + 60)}{opacity:0;transform:scale(.3) rotate(-8deg)}${pct(CHUTE.b + 200)}{opacity:1;transform:scale(1.12) rotate(-4deg)}${pct(CHUTE.b + 360)}{transform:scale(1) rotate(-4deg)}${pct(5200)}{opacity:1}${pct(5450)}{opacity:0}100%{opacity:0}}
.gmn-gritogol b{display:inline-block;font:700 40px/1 Oswald,sans-serif;color:${PRETO};background:${GOLD};border:4px solid #000;border-radius:14px;padding:6px 16px 8px;box-shadow:5px 5px 0 #000}
/* o 01 dourado atrás do escudo */
.gmn-01{position:absolute;left:0;right:0;top:150px;z-index:5;text-align:center;font:700 240px/1 Oswald,sans-serif;color:transparent;-webkit-text-stroke:4px ${GOLD};opacity:0;animation:gmn01 ${T}ms ease forwards}
@keyframes gmn01{0%,${pct(5200)}{opacity:0;transform:scale(1.6)}${pct(5600)}{opacity:.45;transform:scale(1)}100%{opacity:.45;transform:scale(1)}}
/* o escudo */
.gmn-esc{position:absolute;left:50%;top:160px;width:230px;height:250px;margin-left:-115px;z-index:6;display:flex;align-items:center;justify-content:center;opacity:0;
  filter:drop-shadow(0 0 26px rgba(255,196,0,.6)) drop-shadow(5px 6px 0 rgba(0,0,0,.55));animation:gmnEsc ${T}ms cubic-bezier(.2,1.3,.4,1) forwards}
@keyframes gmnEsc{0%,${pct(5200)}{opacity:0;transform:scale(.2) translateY(-60px)}${pct(5600)}{opacity:1;transform:scale(1.1)}${pct(5800)}{transform:scale(1)}100%{opacity:1;transform:scale(1)}}
/* a coroa desce e pousa */
.gmn-coroa{position:absolute;left:50%;top:66px;width:120px;margin-left:-60px;z-index:7;font-size:96px;line-height:1;text-align:center;opacity:0;filter:drop-shadow(0 0 18px rgba(255,196,0,.9)) drop-shadow(3px 4px 0 #000);animation:gmnCoroa ${T}ms cubic-bezier(.3,1.4,.5,1) forwards}
@keyframes gmnCoroa{0%,${pct(5700)}{opacity:0;transform:translateY(-260px) rotate(-20deg) scale(1.4)}${pct(6250)}{opacity:1;transform:translateY(6px) rotate(4deg) scale(1)}${pct(6400)}{transform:translateY(0) rotate(0)}100%{opacity:1;transform:none}}
/* chuva de papel tricolor */
.gmn-papel{position:absolute;top:-20px;width:10px;height:16px;border:1.5px solid #000;opacity:0;z-index:11;animation:gmnPapel 2600ms linear both}
@keyframes gmnPapel{0%{opacity:0;transform:translateY(0) rotate(0)}8%{opacity:1}100%{opacity:1;transform:translateY(800px) rotate(720deg)}}
/* a frase e a faixa */
.gmn-frase{position:absolute;left:0;right:0;top:438px;z-index:13;text-align:center;font:700 34px/1.05 Oswald,sans-serif;color:${BRANCO};text-shadow:3px 3px 0 #000;letter-spacing:.02em}
.gmn-frase span{display:inline-block;opacity:0;animation:gmnPalavra ${T}ms cubic-bezier(.2,1.5,.4,1) forwards}
@keyframes gmnPalavra{0%{opacity:0;transform:scale(2.2)}6%{opacity:1;transform:scale(.94)}9%{transform:none}96%{opacity:1}100%{opacity:1}}
.gmn-frase em{font-style:normal;color:${GOLD}}
.gmn-faixa{position:absolute;left:24px;right:24px;top:620px;z-index:14;background:${PRETO};border:3px solid ${BRANCO};border-radius:16px;padding:8px 8px 9px;text-align:center;opacity:0;overflow:hidden;animation:gmnFaixa ${T}ms cubic-bezier(.2,1.3,.4,1) forwards}
.gmn-faixa::before{content:"";position:absolute;left:0;right:0;top:0;height:6px;background:linear-gradient(90deg,${VERM} 0 33%,${BRANCO} 33% 66%,${PRETO} 66%)}
@keyframes gmnFaixa{0%,${pct(6400)}{opacity:0;transform:scale(.4)}${pct(6750)}{opacity:1;transform:scale(1.06)}${pct(6950)}{transform:scale(1)}${pct(8400)}{opacity:1}100%{opacity:0}}
.gmn-faixa small{display:block;font:700 13px Oswald,sans-serif;letter-spacing:.22em;color:${GOLD};margin-top:4px}
.gmn-faixa b{display:block;font:700 27px/1.05 Oswald,sans-serif;color:#fff;text-transform:uppercase;margin-top:2px}
.gmn-faixa em{display:inline-block;font-style:normal;font:700 13px Oswald,sans-serif;color:${PRETO};background:${GOLD};border-radius:7px;padding:2px 9px;margin-top:5px;letter-spacing:.1em}
@media (prefers-reduced-motion:reduce){.gmn-faixa3,.gmn-flash,.gmn-bola,.gmn-rastro,.gmn-onda,.gmn-branco,.gmn-gritogol,.gmn-papel,.gmn-barr,.gmn-01{display:none}.gmn-treme,.gmn-rede{animation:none}.gmn-esc,.gmn-rei,.gmn-gol,.gmn-tapete,.gmn-coroa,.gmn-faixa,.gmn-frase span{animation:none;opacity:1}}
`

function useEscala() {
  const calc = () => Math.min(window.innerWidth / 420, window.innerHeight / 760)
  const [s, setS] = useState(calc)
  useEffect(() => { const f = () => setS(calc()); window.addEventListener('resize', f); return () => window.removeEventListener('resize', f) }, [])
  return s
}

export function GalaMonarca({ clube, chave, mostra, grito }: { clube: string; chave: string; mostra: string; grito: string }) {
  const s = useEscala()
  void grito
  useEffect(() => playMp3Gala(`${import.meta.env.BASE_URL}sfx/torcida-spfc-wen-v1.mp3`, T), [chave])
  const frase = [tr('SALVE', 'HAIL'), tr('O', 'THE'), tr('MONARCA', 'MONARCH')]
  const cores = [VERM, BRANCO, PRETO]
  return createPortal(
    <div key={chave} className="gmn" aria-hidden>
      <style>{CSS}</style>
      <div className="gmn-ceu" />
      <div className="gmn-palco" style={{ transform: `translate(-50%,-50%) scale(${s})` }}>
       <div className="gmn-treme">
        {cores.map((c, i) => <div key={i} className="gmn-faixa3" style={{ top: 30 + i * 50, background: c, animation: `gmnFaixa3 ${T}ms cubic-bezier(.2,1,.4,1) ${i * 140}ms forwards` }} />)}
        {Array.from({ length: 22 }, (_, i) => (
          <i key={i} className="gmn-flash" style={{ left: 8 + Math.round(sorte(i + 1) * 404), top: 14 + Math.round(sorte(i * 7 + 3) * 130), animationDelay: `${Math.round(sorte(i * 13 + 5) * 1300)}ms` }} />
        ))}
        <div className="gmn-grama" />
        <div className="gmn-tapete" />
        <div className="gmn-gol"><div className="gmn-rede" /></div>
        {[0, 1, 2, 3].map(i => <div key={i} className="gmn-barr" style={{ left: 128 + i * 40 }} />)}
        <div className="gmn-01">01</div>
        <div className="gmn-esc"><Escudo nome={clube} size={250} /></div>
        <div className="gmn-coroa">👑</div>
        <div className="gmn-rastro" />
        <div className="gmn-rei"><img src={monarcaImg} alt="" /></div>
        <div className="gmn-bola">⚽</div>
        <div className="gmn-onda" />
        <div className="gmn-gritogol"><b>{tr('GOL DO GOLEIRO!', 'THE KEEPER SCORES!')}</b></div>
        {Array.from({ length: 30 }, (_, i) => (
          <i key={i} className="gmn-papel" style={{ left: Math.round(sorte(i + 9) * 410), background: cores[i % 3], animationDelay: `${6200 + Math.round(sorte(i * 11) * 1400)}ms` }} />
        ))}
        <div className="gmn-frase">
          {frase.map((p, i) => <span key={i} style={{ animationDelay: `${5800 + i * 260}ms`, marginRight: 8 }}>{i === 2 ? <em>{p}</em> : p}</span>)}
        </div>
        <div className="gmn-faixa">
          <small>{tr('👑 CHEGOU NA SALA', '👑 JUST ARRIVED')}</small>
          <b>{mostra}</b>
          <em>{tr('GOLEIRO, CAPITÃO E REI', 'KEEPER, CAPTAIN AND KING')}</em>
        </div>
        <div className="gmn-branco" />
       </div>
      </div>
    </div>,
    document.body,
  )
}

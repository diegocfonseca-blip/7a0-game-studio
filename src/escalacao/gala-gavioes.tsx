// ─── 🦅⚫⚪ ENTRADA ÚNICA DO GAVIÕES SCCP: "AQUI É FIEL" ─────────────────────────────────────────────────────────
//
// Pedido do Diego (16/10, o kauealves584 virou 🖋 Fundador): *"pense em algo voando o gavião e algo do Corinthians"*.
// Duas versões antes desta (bando no céu; olho + tela estilhaçando) ele não curtiu: *"não entendi o porquê do olho… e não tem
// nada de Corinthians"*. Esta, aprovada em texto (*"ok faz"*):
// 1) estádio lotado de noite, a torcida em PRETO E BRANCO pulando, sinalizadores
// 2) sobe um BANDEIRÃO gigante escrito "TIMÃO"
// 3) a arquibancada faz um MOSAICO que vira o escudo do Gaviões SCCP
// 4) o GAVIÃO do clube sai voando de dentro do mosaico por cima da torcida
// 5) faixa "CHEGOU NA SALA · AQUI É FIEL"
// ⚠️ Nada de escudo, nome ou desenho oficial do Corinthians nem da torcida organizada: só as cores, apelidos de arquibancada
// ("TIMÃO", "FIEL", "BANDO DE LOUCOS") e o gavião/escudo do PRÓPRIO clube. Mesmo esquema das outras galas únicas: palco 420×760
// escalado, camada fixa sem clique, fora do reducer, sem localStorage; "reduzir movimento" = só o fim, parado.
// Som: o canto dele (`sfx/torcida-gavioes-v1.mp3`, 12 s do áudio que o Diego mandou — o mesmo da carreira).
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Escudo } from './escudos'
import { tr } from './lang'
import { playMp3Gala } from './sound'
import gavioesMascoteImg from './img/gavioes-mascote.webp'

export const GAVIOES_MS = 8600
const T = GAVIOES_MS
const pct = (ms: number) => (ms / T * 100).toFixed(1) + '%'
const GOLD = '#FFC400'
// a arte do Gavião é 224×440
const MH = 270, MW = Math.round(MH * 224 / 440)

// 👥 a torcida: 9 fileiras × 21 torcedores, camisa preta ou branca (fixo, sem sorteio: a gala é igual pra todos)
const FILEIRAS = 9, POR_FILA = 21
// 🧩 o mosaico: 12 × 13 cartões de 20 px cobrindo o escudo; cada cartão vira com um atraso fixo
const MC = 12, ML = 13, CEL = 20
const atraso = (i: number) => ((i * 7919) % 997) / 997 // 0..1, espalhado e sempre igual

const CSS = `
.ggv{position:fixed;inset:0;z-index:99990;pointer-events:none;overflow:hidden;animation:ggvVis ${T}ms ease forwards}
@keyframes ggvVis{0%{opacity:0}3%{opacity:1}95%{opacity:1}100%{opacity:0}}
.ggv-ceu{position:absolute;inset:0;background:radial-gradient(ellipse at 50% 8%,#3d3d3d,#151515 45%,#040404)}
.ggv-palco{position:absolute;left:50%;top:50%;width:420px;height:760px;overflow:hidden}
.ggv-luz{position:absolute;top:-40px;width:180px;height:520px;z-index:1;opacity:.55;background:linear-gradient(rgba(255,255,255,.5),rgba(255,255,255,0));clip-path:polygon(40% 0,60% 0,100% 100%,0 100%)}
/* 👥 a torcida pulando (onda da esquerda pra direita) */
.ggv-torc{position:absolute;left:-6px;top:470px;width:432px;z-index:3}
.ggv-fila{display:flex;justify-content:space-between;height:32px}
.ggv-t{position:relative;width:18px;height:30px;animation:ggvPula 520ms ease-in-out infinite alternate}
.ggv-t::before{content:'';position:absolute;left:5px;top:0;width:8px;height:8px;border-radius:50%;background:#c9a27e;border:1px solid #000}
.ggv-t::after{content:'';position:absolute;left:2px;top:8px;width:14px;height:14px;border-radius:4px 4px 2px 2px;background:var(--c);border:1px solid #000}
.ggv-t.br{--c:#f4f4f4}.ggv-t.pr{--c:#0d0d0d}
.ggv-t i{position:absolute;top:2px;width:3px;height:10px;background:#c9a27e;border:1px solid #000;border-radius:2px}
.ggv-t i:first-child{left:-1px;transform:rotate(-25deg)}.ggv-t i:last-child{right:-1px;transform:rotate(25deg)}
@keyframes ggvPula{from{transform:translateY(0)}to{transform:translateY(-7px)}}
/* 🔥 sinalizadores + fumaça */
.ggv-sin{position:absolute;top:500px;width:26px;height:26px;z-index:4;border-radius:50%;background:radial-gradient(#fff,#ffd6a0 40%,rgba(255,120,40,0) 70%);filter:blur(1px);animation:ggvSin 180ms ease-in-out infinite alternate}
@keyframes ggvSin{from{transform:scale(.9);opacity:.85}to{transform:scale(1.25);opacity:1}}
.ggv-fum{position:absolute;bottom:230px;width:170px;height:300px;z-index:2;opacity:0;filter:blur(12px);border-radius:50%;animation:ggvFum ${T}ms ease forwards}
@keyframes ggvFum{0%{opacity:0;transform:translateY(60px) scale(.6)}${pct(1500)}{opacity:.7;transform:translateY(0) scale(1)}100%{opacity:.6;transform:translateY(-90px) scale(1.3)}}
/* 🏳️ o bandeirão "TIMÃO" sobe, segura e cai */
.ggv-band{position:absolute;left:-30px;right:-30px;top:760px;height:430px;z-index:6;border-top:5px solid #000;border-bottom:5px solid #000;
  background:repeating-linear-gradient(90deg,#0b0b0b 0 46px,#f4f4f4 46px 92px);animation:ggvBand ${T}ms cubic-bezier(.25,.9,.35,1) forwards}
@keyframes ggvBand{0%,${pct(500)}{top:760px}${pct(1500)}{top:170px}${pct(1650)}{top:180px}${pct(2700)}{top:180px}${pct(3300)}{top:820px}100%{top:820px}}
.ggv-band::after{content:'';position:absolute;inset:0;background:linear-gradient(90deg,rgba(0,0,0,.3),transparent 30%,transparent 70%,rgba(0,0,0,.3));animation:ggvOnda 800ms ease-in-out infinite alternate}
@keyframes ggvOnda{from{transform:skewY(-1.5deg)}to{transform:skewY(1.5deg)}}
.ggv-band b{position:absolute;left:30px;right:30px;top:120px;z-index:1;text-align:center;background:#f4f4f4;border-top:6px solid #0b0b0b;border-bottom:6px solid #0b0b0b;
  font:700 112px/1.25 Oswald,sans-serif;letter-spacing:.06em;color:#0b0b0b;text-transform:uppercase;text-shadow:5px 5px 0 rgba(0,0,0,.15)}
/* 🧩 o mosaico que vira o escudo */
.ggv-mos{position:absolute;left:${210 - MC * CEL / 2}px;top:118px;width:${MC * CEL}px;height:${ML * CEL}px;z-index:5;opacity:0;animation:ggvMos ${T}ms ease forwards}
@keyframes ggvMos{0%,${pct(2600)}{opacity:0;transform:none}${pct(2700)}{opacity:1}${pct(4400)}{transform:none}${pct(5000)}{transform:translateY(-100px) scale(.58)}100%{opacity:1;transform:translateY(-100px) scale(.58)}}
.ggv-mos-esc{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;filter:drop-shadow(0 0 22px rgba(255,255,255,.55)) drop-shadow(5px 6px 0 rgba(0,0,0,.6))}
.ggv-cel{position:absolute;width:${CEL}px;height:${CEL}px;border:1px solid rgba(0,0,0,.6);box-sizing:border-box}
@keyframes ggvCel{0%{opacity:1;transform:rotateY(0)}100%{opacity:0;transform:rotateY(90deg)}}
.ggv-grade{position:absolute;inset:0;background-image:linear-gradient(rgba(0,0,0,.25) 1px,transparent 1px),linear-gradient(90deg,rgba(0,0,0,.25) 1px,transparent 1px);background-size:${CEL}px ${CEL}px;opacity:0;animation:ggvGrade ${T}ms ease forwards}
@keyframes ggvGrade{0%,${pct(3500)}{opacity:0}${pct(4300)}{opacity:.9}${pct(5000)}{opacity:0}100%{opacity:0}}
/* 🦅 o Gavião sai voando de dentro do mosaico, por cima da torcida */
.ggv-gav{position:absolute;left:50%;top:250px;z-index:8;width:${MW}px;height:${MH}px;margin-left:-${MW / 2}px;opacity:0;animation:ggvGav ${T}ms cubic-bezier(.3,.9,.35,1) forwards}
@keyframes ggvGav{0%,${pct(4400)}{opacity:0;transform:translateY(-40px) scale(.2)}${pct(4600)}{opacity:1}${pct(5200)}{transform:translateY(0) scale(1.15)}${pct(5500)}{transform:translateY(-10px) scale(1)}100%{opacity:1;transform:translateY(-10px) scale(1)}}
.ggv-gav>div{width:100%;height:100%;animation:ggvPaira 700ms ease-in-out infinite alternate}
@keyframes ggvPaira{from{transform:translateY(0) rotate(-2deg)}to{transform:translateY(-10px) rotate(2deg)}}
.ggv-gav img{display:block;width:100%;height:100%;filter:drop-shadow(5px 7px 0 rgba(0,0,0,.6)) drop-shadow(0 0 16px rgba(255,255,255,.4))}
.ggv-vento{position:absolute;left:50%;top:180px;width:300px;height:300px;margin-left:-150px;z-index:7;border-radius:50%;opacity:0;border:6px solid rgba(255,255,255,.7);animation:ggvVento ${T}ms ease-out forwards}
@keyframes ggvVento{0%,${pct(4500)}{opacity:0;transform:scale(.2)}${pct(4700)}{opacity:.9}${pct(5300)}{opacity:0;transform:scale(1.6)}100%{opacity:0}}
.ggv-flash{position:absolute;inset:0;z-index:9;background:#fff;opacity:0;animation:ggvFlash ${T}ms linear forwards}
@keyframes ggvFlash{0%,${pct(4450)}{opacity:0}${pct(4520)}{opacity:.75}${pct(4800)}{opacity:0}100%{opacity:0}}
.ggv-faixa{position:absolute;left:24px;right:24px;top:620px;z-index:10;background:#0C0C0C;border:3px solid #f4f4f4;border-radius:16px;padding:8px;text-align:center;opacity:0;animation:ggvFaixa ${T}ms cubic-bezier(.2,1.3,.4,1) forwards}
@keyframes ggvFaixa{0%,${pct(5600)}{opacity:0;transform:scale(.4)}${pct(6000)}{opacity:1;transform:scale(1.06)}${pct(6200)}{transform:scale(1)}${pct(8100)}{opacity:1}100%{opacity:0}}
.ggv-faixa small{display:block;font:700 13px Oswald,sans-serif;letter-spacing:.22em;color:${GOLD}}
.ggv-faixa b{display:block;font:700 26px/1.05 Oswald,sans-serif;color:#fff;text-transform:uppercase;margin-top:2px}
.ggv-faixa em{display:block;font-style:normal;font:700 16px Oswald,sans-serif;color:#f4f4f4;margin-top:3px;letter-spacing:.12em}
@media (prefers-reduced-motion:reduce){.ggv-band,.ggv-cel,.ggv-flash,.ggv-vento,.ggv-grade{display:none}.ggv-t,.ggv-sin{animation:none}.ggv-mos,.ggv-faixa{animation:none;opacity:1}.ggv-gav{animation:none;opacity:1;transform:translateY(50px)}}
`

function useEscala() {
  const calc = () => Math.min(window.innerWidth / 420, window.innerHeight / 760)
  const [s, setS] = useState(calc)
  useEffect(() => { const f = () => setS(calc()); window.addEventListener('resize', f); return () => window.removeEventListener('resize', f) }, [])
  return s
}

export function GalaGavioes({ clube, chave, mostra, grito }: { clube: string; chave: string; mostra: string; grito: string }) {
  const s = useEscala()
  // 🔊 o CANTO dele (o mesmo da carreira) toca junto com a gala
  useEffect(() => playMp3Gala(`${import.meta.env.BASE_URL}sfx/torcida-gavioes-v1.mp3`, T), [chave])
  void grito
  return createPortal(
    <div key={chave} className="ggv" aria-hidden>
      <style>{CSS}</style>
      <div className="ggv-ceu" />
      <div className="ggv-palco" style={{ transform: `translate(-50%,-50%) scale(${s})` }}>
        <span className="ggv-luz" style={{ left: -40, transform: 'rotate(-14deg)' }} />
        <span className="ggv-luz" style={{ right: -40, transform: 'rotate(14deg)' }} />
        <span className="ggv-fum" style={{ left: -40, background: 'radial-gradient(circle,#f4f4f4,#bdbdbd 55%,transparent 72%)' }} />
        <span className="ggv-fum" style={{ right: -40, background: 'radial-gradient(circle,#2c2c2c,#0d0d0d 55%,transparent 72%)' }} />
        {/* 🧩 o mosaico: o escudo do clube por baixo, os cartões preto e branco viram e mostram ele */}
        <div className="ggv-mos">
          <div className="ggv-mos-esc"><Escudo nome={clube} size={220} /></div>
          {Array.from({ length: MC * ML }, (_, i) => {
            const c = i % MC, l = Math.floor(i / MC)
            return <span key={i} className="ggv-cel" style={{ left: c * CEL, top: l * CEL, background: (c + l + (atraso(i) > .5 ? 1 : 0)) % 2 ? '#f4f4f4' : '#0b0b0b', animation: `ggvCel 380ms ease-in ${3200 + Math.round(atraso(i * 3 + 1) * 1000)}ms forwards` }} />
          })}
          <div className="ggv-grade" />
        </div>
        {/* 👥 a torcida */}
        <div className="ggv-torc">
          {Array.from({ length: FILEIRAS }, (_, f) => (
            <div key={f} className="ggv-fila" style={{ paddingLeft: f % 2 ? 9 : 0 }}>
              {Array.from({ length: POR_FILA }, (_, k) => (
                <span key={k} className={`ggv-t ${(k + f) % 2 ? 'br' : 'pr'}`} style={{ animationDelay: `${(k * 45 + f * 30) % 520}ms` }}><i /><i /></span>
              ))}
            </div>
          ))}
        </div>
        <span className="ggv-sin" style={{ left: 40 }} />
        <span className="ggv-sin" style={{ left: 200, top: 540 }} />
        <span className="ggv-sin" style={{ right: 40 }} />
        <div className="ggv-band"><b>{tr('TIMÃO', 'TIMÃO')}</b></div>
        <div className="ggv-vento" />
        <div className="ggv-gav"><div><img src={gavioesMascoteImg} alt="" /></div></div>
        <div className="ggv-faixa">
          <small>{tr('🦅 CHEGOU NA SALA', '🦅 JUST ARRIVED')}</small>
          <b>{mostra}</b>
          <em>⚫⚪ AQUI É FIEL ⚫⚪</em>
        </div>
        <div className="ggv-flash" />
      </div>
    </div>,
    document.body,
  )
}

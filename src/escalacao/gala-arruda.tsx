// ─── 🐍 ENTRADA ÚNICA DO TRICOLOR DO ARRUDA FC: "A COBRA SOBE DE DENTRO DA ARQUIBANCADA" ───────────────
//
// Pedido do dono (Geovany, souzact12, virou 🖋 Fundador em 14/10) com o vídeo de exemplo dele: estádio cheio e o
// mascote subindo NO MEIO da torcida. 2ª versão (Diego 14/10): *"não tá parecendo arquibancada… e nem que o mascote
// saiu de dentro dela tipo bandeira… com nego subindo a bandeira"*. Então agora:
// teto com refletores → arquibancada de verdade (degraus, gente pulando, setores retos vermelho/branco/preto,
// sinalizador) → o bandeirão com o ESCUDO desce do teto → a BANDEIRA GIGANTE da cobra sobe de DENTRO da torcida,
// segura em dois mastros, com a fila da frente de braço pra cima tapando o pé dela → "CHEGOU NA SALA" + o grito.
//
// Mesmo esquema das outras galas únicas (`gala-helicoptero.tsx`, `gala-k9.tsx`): palco 420×760 escalado pra tela,
// camada fixa `pointer-events:none`, fora do reducer, sem localStorage; "reduzir movimento" = tudo parado no lugar.
// Arte nova: nenhuma (estádio em CSS = 0 KB; escudo e cobra do batismo). Nada do escudo oficial do Santa Cruz.
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Escudo } from './escudos'
import { tr } from './lang'
import arrudaMascoteImg from './img/arruda-mascote.webp'

export const ARRUDA_MS = 6800
const T = ARRUDA_MS
const pct = (ms: number) => (ms / T * 100).toFixed(1) + '%'
const GOLD = '#FFC400', VERM = '#C8102E', BRANCO = '#F4F4F4', PRETO = '#111'
// a arte da cobra é 304×440; na bandeira ela fica com 250 de altura
const MH = 250, MW = Math.round(MH * 304 / 440)

// 🧑‍🤝‍🧑 a torcida: cabeças (2 fileiras desencontradas) + braço/ombro + a sombra do degrau, por cima da cor do setor
const cabecas = (px: number, w: number, h: number) =>
  `radial-gradient(circle at 50% 35%,#e0a97f 0 ${px}px,transparent ${px + .6}px) 0 0/${w}px ${h}px,` +
  `radial-gradient(circle at 50% 35%,#8a5a3c 0 ${px}px,transparent ${px + .6}px) ${w / 2}px ${h / 2}px/${w}px ${h}px`
const SETORES = `repeating-linear-gradient(90deg,${VERM} 0 64px,${BRANCO} 64px 128px,${PRETO} 128px 192px)`

// braços da fila da frente: [x, altura, atraso] — espaçamento torto de propósito
const BRACOS: [number, number, number][] = Array.from({ length: 30 }, (_, i) => [i * 14 + ((i * 7) % 5) * 2, 20 + ((i * 11) % 4) * 5, ((i * 3) % 5) / 10])

const CSS = `
.gar{position:fixed;inset:0;z-index:99990;pointer-events:none;overflow:hidden;animation:garVis ${T}ms ease forwards}
@keyframes garVis{0%{opacity:0}4%{opacity:1}94%{opacity:1}100%{opacity:0}}
.gar-escuro{position:absolute;inset:0;background:linear-gradient(#05070b,#0d1219 45%,#05070b)}
.gar-palco{position:absolute;left:50%;top:50%;width:420px;height:760px;overflow:hidden}
/* 💡 teto com treliça e refletores */
.gar-teto{position:absolute;left:-20px;right:-20px;top:0;height:74px;z-index:3;
  background:repeating-linear-gradient(60deg,transparent 0 16px,rgba(255,255,255,.07) 16px 18px),repeating-linear-gradient(-60deg,transparent 0 16px,rgba(255,255,255,.07) 16px 18px),linear-gradient(#1b222c,#0e1218);
  border-bottom:5px solid #2c3540;box-shadow:0 6px 12px rgba(0,0,0,.6)}
.gar-luz{position:absolute;top:52px;width:26px;height:14px;border-radius:4px;background:#fffbe6;box-shadow:0 0 18px 8px rgba(255,248,210,.55),0 30px 60px 20px rgba(255,248,210,.12);animation:garLuz ${T}ms steps(1) forwards}
@keyframes garLuz{0%,${pct(150)}{opacity:.15}${pct(250)}{opacity:1}${pct(330)}{opacity:.3}${pct(420)}{opacity:1}100%{opacity:1}}
/* 🏟️ a arquibancada: setores RETOS, degraus e gente — em perspectiva, crescendo de baixo */
.gar-arq{position:absolute;left:-70px;right:-70px;top:60px;height:500px;z-index:1;transform-origin:bottom;animation:garArq ${T}ms cubic-bezier(.2,.8,.3,1) forwards}
@keyframes garArq{0%,${pct(150)}{transform:scaleY(0);filter:brightness(.25)}${pct(1000)}{transform:scaleY(1);filter:brightness(.55)}${pct(1400)}{filter:brightness(1)}100%{transform:scaleY(1);filter:brightness(1)}}
.gar-arq-in{position:absolute;inset:0;transform:perspective(620px) rotateX(20deg);transform-origin:bottom;overflow:hidden;
  background:repeating-linear-gradient(90deg,transparent 0 186px,#5b6068 186px 192px),repeating-linear-gradient(180deg,transparent 0 10px,rgba(0,0,0,.45) 10px 13px),${SETORES}}
.gar-gente{position:absolute;inset:-4px 0 0;background:${cabecas(2.6, 9, 13)};animation:garPula .42s steps(2) infinite}
.gar-anel{position:absolute;left:0;right:0;top:44%;height:14px;background:linear-gradient(#3a414b,#1c2128);border-top:2px solid #6b7480;box-shadow:0 4px 0 rgba(0,0,0,.5)}
@keyframes garPula{0%{transform:translateY(0)}100%{transform:translateY(-2px)}}
.gar-fogo{position:absolute;width:16px;height:16px;border-radius:50%;background:#ff3b1f;box-shadow:0 0 16px 9px rgba(255,70,30,.75),0 -26px 30px 12px rgba(160,160,170,.18);animation:garFogo .5s ease-in-out infinite alternate}
@keyframes garFogo{to{transform:scale(1.25);box-shadow:0 0 22px 12px rgba(255,90,30,.85),0 -30px 34px 14px rgba(160,160,170,.22)}}
/* 🏳️ o bandeirão do ESCUDO desce do teto */
.gar-band{position:absolute;left:-12px;right:-12px;top:84px;height:98px;z-index:4;background:${BRANCO};border-top:6px solid ${VERM};border-bottom:6px solid ${PRETO};box-shadow:0 7px 0 rgba(0,0,0,.45);display:flex;align-items:center;gap:10px;padding:0 22px 0 30px;animation:garBand ${T}ms cubic-bezier(.3,1.4,.5,1) forwards}
@keyframes garBand{0%,${pct(500)}{transform:translateY(-230px) rotate(-2deg)}${pct(1200)}{transform:translateY(0) rotate(-2deg)}100%{transform:translateY(0) rotate(-2deg)}}
.gar-band .tx{flex:1;min-width:0}
.gar-band b{display:block;font:700 28px/1 Oswald,sans-serif;color:${VERM};text-shadow:2px 2px 0 ${PRETO};white-space:nowrap}
.gar-band small{display:block;font:700 12px Oswald,sans-serif;letter-spacing:.14em;color:${PRETO};margin-top:5px;white-space:nowrap}
.gar-band .esc{flex:none;display:inline-flex;filter:drop-shadow(2px 3px 0 rgba(0,0,0,.45))}
/* 🐍 a BANDEIRA da cobra sobe de DENTRO da torcida, em dois mastros (o pé dela fica atrás da fila da frente) */
.gar-bandeira{position:absolute;left:50%;top:600px;width:300px;height:330px;margin-left:-150px;z-index:2;animation:garSobe ${T}ms cubic-bezier(.3,.85,.35,1) forwards}
@keyframes garSobe{0%,${pct(1500)}{top:600px}${pct(3100)}{top:220px}${pct(3350)}{top:236px}${pct(3550)}{top:228px}100%{top:228px}}
.gar-mastro{position:absolute;top:-14px;bottom:-200px;width:7px;background:linear-gradient(90deg,#555,#bbb 40%,#444);border-radius:3px}
.gar-mastro::before{content:'';position:absolute;left:-4px;top:-8px;width:15px;height:15px;border-radius:50%;background:${GOLD};border:2px solid #000}
.gar-pano{position:absolute;left:10px;right:10px;top:0;bottom:0;transform-origin:top;animation:garOnda 1.5s ease-in-out infinite,garDobra 1.8s linear infinite;
  background:repeating-linear-gradient(100deg,rgba(0,0,0,.24) 0,transparent 34px,rgba(255,255,255,.2) 62px,transparent 92px,rgba(0,0,0,.24) 140px) 0 0/140px 100%,
  linear-gradient(180deg,${VERM} 0 12%,${BRANCO} 12% 88%,${PRETO} 88%);
  border:3px solid #000;border-radius:4px 4px 10px 10px;box-shadow:0 8px 24px rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center}
@keyframes garDobra{to{background-position:140px 0,0 0}}
@keyframes garOnda{0%,100%{transform:perspective(500px) rotateY(-7deg) skewY(1.4deg)}50%{transform:perspective(500px) rotateY(7deg) skewY(-1.4deg)}}
.gar-pano img{display:block;width:${MW}px;height:${MH}px;filter:drop-shadow(3px 4px 0 rgba(0,0,0,.35));margin-top:-10px}
/* 🙌 a fila da frente: perto (cabeça maior) e de braço pra cima quando a bandeira sobe */
.gar-frente{position:absolute;left:0;right:0;top:536px;height:66px;z-index:3;background:linear-gradient(#1a1d22,#0b0d10)}
.gar-corpos{position:absolute;left:0;right:0;bottom:0;height:52px;background:${SETORES};
  -webkit-mask:radial-gradient(ellipse 9px 15px at 50% 100%,#000 96%,transparent) 0 6px/18px 26px,radial-gradient(ellipse 9px 15px at 50% 100%,#000 96%,transparent) 9px 18px/18px 26px;
  mask:radial-gradient(ellipse 9px 15px at 50% 100%,#000 96%,transparent) 0 6px/18px 26px,radial-gradient(ellipse 9px 15px at 50% 100%,#000 96%,transparent) 9px 18px/18px 26px;animation:garPula .36s steps(2) infinite}
.gar-frente .gar-gente{inset:0;background:radial-gradient(circle at 50% 50%,#d9a27a 0 5.5px,transparent 6px) 0 -2px/18px 26px,radial-gradient(circle at 50% 50%,#7a4d31 0 5.5px,transparent 6px) 9px 10px/18px 26px;animation-duration:.36s}
/* 🙌 braços pra cima (mão no topo), em espaçamento torto pra não virar grade */
.gar-bracos{position:absolute;left:0;right:0;top:-30px;height:38px;transform-origin:bottom;animation:garBracos ${T}ms ease forwards}
.gar-bracos i{position:absolute;bottom:0;width:5px;border-radius:3px 3px 0 0;background:#d39a70;animation:garAceno .5s ease-in-out infinite alternate}
.gar-bracos i::before{content:'';position:absolute;left:-2px;top:-5px;width:9px;height:9px;border-radius:50%;background:inherit}
@keyframes garAceno{from{transform:rotate(-8deg)}to{transform:rotate(8deg)}}
@keyframes garBracos{0%,${pct(1300)}{transform:scaleY(0)}${pct(1700)}{transform:scaleY(1)}100%{transform:scaleY(1)}}
.gar-muro{position:absolute;left:0;right:0;top:600px;height:26px;z-index:3;background:#151a20;border-top:3px solid #000;border-bottom:3px solid #F4ECD6;overflow:hidden;white-space:nowrap;
  font:700 14px/20px Oswald,sans-serif;letter-spacing:.2em;color:${VERM}}
.gar-gram{position:absolute;left:0;right:0;top:626px;height:134px;z-index:3;background:repeating-linear-gradient(90deg,#1B7A3D 0 34px,#219048 34px 68px)}
.gar-faixa{position:absolute;left:24px;right:24px;top:640px;z-index:5;background:#0C0C0C;border:3px solid ${GOLD};border-radius:16px;padding:8px 8px;text-align:center;opacity:0;animation:garFaixa ${T}ms cubic-bezier(.2,1.3,.4,1) forwards}
@keyframes garFaixa{0%,${pct(3200)}{opacity:0;transform:scale(.4)}${pct(3700)}{opacity:1;transform:scale(1.06)}${pct(3900)}{transform:scale(1)}${pct(6400)}{opacity:1}100%{opacity:0}}
.gar-faixa small{display:block;font:700 13px Oswald,sans-serif;letter-spacing:.22em;color:${GOLD}}
.gar-faixa b{display:block;font:700 26px/1.05 Oswald,sans-serif;color:#fff;text-transform:uppercase;margin-top:2px}
.gar-faixa em{display:block;font-style:normal;font:700 16px Oswald,sans-serif;color:#ff6b6b;margin-top:3px}
@media (prefers-reduced-motion:reduce){.gar-arq,.gar-band,.gar-pano,.gar-gente,.gar-bracos,.gar-luz,.gar-fogo{animation:none}.gar-bandeira{animation:none;top:228px}.gar-faixa{animation:none;opacity:1}}
`

function useEscala() {
  const calc = () => Math.min(window.innerWidth / 420, window.innerHeight / 760)
  const [s, setS] = useState(calc)
  useEffect(() => { const f = () => setS(calc()); window.addEventListener('resize', f); return () => window.removeEventListener('resize', f) }, [])
  return s
}

export function GalaArruda({ clube, chave, mostra, grito }: { clube: string; chave: string; mostra: string; grito: string }) {
  const s = useEscala()
  void grito // o grito dele é o do próprio clube (o Arruda), não o nome curto
  return createPortal(
    <div key={chave} className="gar" aria-hidden>
      <style>{CSS}</style>
      <div className="gar-escuro" />
      <div className="gar-palco" style={{ transform: `translate(-50%,-50%) scale(${s})` }}>
        <div className="gar-arq">
          <div className="gar-arq-in">
            <div className="gar-gente" />
            <div className="gar-anel" />
            <span className="gar-fogo" style={{ left: 120, top: 330 }} />
            <span className="gar-fogo" style={{ left: 430, top: 300 }} />
            <span className="gar-fogo" style={{ left: 300, top: 120, animationDelay: '.2s' }} />
          </div>
        </div>
        <div className="gar-teto">
          {[30, 120, 210, 300, 390].map(x => <span key={x} className="gar-luz" style={{ left: x }} />)}
        </div>
        <div className="gar-band">
          <div className="tx"><b>TRICOLOR DO ARRUDA</b><small>{tr('A TORCIDA MAIS APAIXONADA', 'THE MOST PASSIONATE CROWD')}</small></div>
          <span className="esc"><Escudo nome={clube} size={74} /></span>
        </div>
        <div className="gar-bandeira">
          <span className="gar-mastro" style={{ left: 0 }} />
          <span className="gar-mastro" style={{ right: 0 }} />
          <div className="gar-pano"><img src={arrudaMascoteImg} alt="" /></div>
        </div>
        <div className="gar-frente">
          <div className="gar-bracos">{BRACOS.map(([x, h, d], i) => <i key={i} style={{ left: x, height: h, animationDelay: d + 's', background: i % 3 ? '#d39a70' : '#7a4d31' }} />)}</div>
          <div className="gar-corpos" /><div className="gar-gente" />
        </div>
        <div className="gar-muro">{' Ô ARRUDA · Ô ARRUDA · Ô ARRUDA · Ô ARRUDA · Ô ARRUDA ·'}</div>
        <div className="gar-gram" />
        <div className="gar-faixa">
          <small>{tr('🐍 CHEGOU NA SALA', '🐍 JUST ARRIVED')}</small>
          <b>{mostra}</b>
          <em>🔊 Ô ARRUDA! Ô ARRUDA! 🔊</em>
        </div>
      </div>
    </div>,
    document.body,
  )
}

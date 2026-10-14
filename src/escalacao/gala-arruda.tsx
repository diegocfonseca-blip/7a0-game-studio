// ─── 🐍 ENTRADA ÚNICA DO TRICOLOR DO ARRUDA FC: "A COBRA SOBE DA ARQUIBANCADA" ─────────────────────
//
// Pedido do dono (Geovany, souzact12, virou 🖋 Fundador em 14/10) com o vídeo de exemplo dele: a arquibancada do
// Arruda e algo SUBINDO na tela. Mockup aprovado pelo Diego (`scripts/mockup-gala-arruda.mjs`) com duas correções
// dele: as faixas da arquibancada em LINHA RETA, e *"o mascote é que chega subindo; o escudo fica no bandeirão"*.
// A sala escurece → a arquibancada acende em faixas vermelho/branco/preto → desce o bandeirão "TRICOLOR DO ARRUDA"
// com o escudo do batismo → a cobra (mascote do batismo) sobe do pé da tela → "CHEGOU NA SALA" + o grito.
//
// Mesmo esquema das outras galas únicas (`gala-helicoptero.tsx`, `gala-k9.tsx`): palco 420×760 escalado pra tela,
// camada fixa `pointer-events:none`, fora do reducer, sem localStorage; "reduzir movimento" = tudo parado no lugar.
// Arte nova: nenhuma (arquibancada em CSS = 0 KB; escudo e cobra do batismo). Nada do escudo oficial do Santa Cruz.
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Escudo } from './escudos'
import { tr } from './lang'
import arrudaMascoteImg from './img/arruda-mascote.webp'

export const ARRUDA_MS = 6400
const T = ARRUDA_MS
const pct = (ms: number) => (ms / T * 100).toFixed(1) + '%'
const GOLD = '#FFC400', VERM = '#C8102E', BRANCO = '#F4F4F4', PRETO = '#111'
// a arte da cobra é 304×440; no palco ela sobe com 300 de altura
const MH = 300, MW = Math.round(MH * 304 / 440)

const CSS = `
.gar{position:fixed;inset:0;z-index:99990;pointer-events:none;overflow:hidden;animation:garVis ${T}ms ease forwards}
@keyframes garVis{0%{opacity:0}4%{opacity:1}94%{opacity:1}100%{opacity:0}}
.gar-escuro{position:absolute;inset:0;background:linear-gradient(#06080c,#10141b 40%,#06080c)}
.gar-palco{position:absolute;left:50%;top:50%;width:420px;height:760px}
.gar-teto{position:absolute;left:0;right:0;top:0;height:86px;background:repeating-linear-gradient(90deg,#2a3340 0 10px,#1a2028 10px 42px);border-bottom:3px solid #333;opacity:.85}
/* 🏟️ a arquibancada: faixas RETAS (Diego 14/10) + a gradinha dos torcedores por cima */
.gar-arq{position:absolute;left:0;right:0;top:268px;height:390px;transform-origin:bottom;
  background:repeating-linear-gradient(0deg,rgba(0,0,0,.45) 0 2px,transparent 2px 22px),repeating-linear-gradient(90deg,rgba(0,0,0,.45) 0 2px,transparent 2px 11px),
  repeating-linear-gradient(90deg,${VERM} 0 70px,${BRANCO} 70px 140px,${PRETO} 140px 210px);
  border-top:3px solid #000;animation:garArq ${T}ms cubic-bezier(.2,.8,.3,1) forwards}
@keyframes garArq{0%,${pct(200)}{transform:scaleY(0);filter:brightness(.3)}${pct(1100)}{transform:scaleY(1);filter:brightness(.6)}${pct(1500)}{filter:brightness(1)}100%{transform:scaleY(1);filter:brightness(1)}}
.gar-gram{position:absolute;left:0;right:0;top:658px;height:102px;background:repeating-linear-gradient(90deg,#1B7A3D 0 34px,#219048 34px 68px);border-top:5px solid #F4ECD6}
.gar-band{position:absolute;left:-12px;right:-12px;top:130px;height:120px;background:${BRANCO};border-top:6px solid ${VERM};border-bottom:6px solid ${PRETO};box-shadow:0 7px 0 rgba(0,0,0,.45);display:flex;align-items:center;gap:10px;padding:0 22px 0 30px;animation:garBand ${T}ms cubic-bezier(.3,1.4,.5,1) forwards}
@keyframes garBand{0%,${pct(600)}{transform:translateY(-260px) rotate(-2deg)}${pct(1300)}{transform:translateY(0) rotate(-2deg)}100%{transform:translateY(0) rotate(-2deg)}}
.gar-band .tx{flex:1;min-width:0}
.gar-band b{display:block;font:700 30px/1 Oswald,sans-serif;color:${VERM};text-shadow:2px 2px 0 ${PRETO};white-space:nowrap}
.gar-band small{display:block;font:700 13px Oswald,sans-serif;letter-spacing:.14em;color:${PRETO};margin-top:5px;white-space:nowrap}
.gar-band .esc{flex:none;display:inline-flex;filter:drop-shadow(2px 3px 0 rgba(0,0,0,.45))}
/* 🐍 a cobra SOBE do pé da tela (com um balanço de bote no fim) */
.gar-masc{position:absolute;left:50%;top:790px;width:${MW}px;height:${MH}px;transform:translateX(-50%);filter:drop-shadow(0 0 24px rgba(255,255,255,.45)) drop-shadow(5px 6px 0 rgba(0,0,0,.55));animation:garMasc ${T}ms cubic-bezier(.25,.9,.35,1) forwards}
@keyframes garMasc{0%,${pct(1500)}{top:790px}${pct(2900)}{top:262px}${pct(3150)}{top:280px}${pct(3350)}{top:268px}${pct(6000)}{top:268px}100%{top:268px}}
.gar-masc img{display:block;width:${MW}px;height:${MH}px}
.gar-balanca{animation:garBalanca 1.6s ease-in-out infinite}
@keyframes garBalanca{0%,100%{transform:rotate(-3deg)}50%{transform:rotate(3deg)}}
.gar-faixa{position:absolute;left:24px;right:24px;top:572px;background:#0C0C0C;border:3px solid ${GOLD};border-radius:16px;padding:9px 8px;text-align:center;opacity:0;animation:garFaixa ${T}ms cubic-bezier(.2,1.3,.4,1) forwards}
@keyframes garFaixa{0%,${pct(3000)}{opacity:0;transform:scale(.4)}${pct(3500)}{opacity:1;transform:scale(1.06)}${pct(3700)}{transform:scale(1)}${pct(6000)}{opacity:1}100%{opacity:0}}
.gar-faixa small{display:block;font:700 13px Oswald,sans-serif;letter-spacing:.22em;color:${GOLD}}
.gar-faixa b{display:block;font:700 28px/1.05 Oswald,sans-serif;color:#fff;text-transform:uppercase;margin-top:2px}
.gar-faixa em{display:block;font-style:normal;font:700 17px Oswald,sans-serif;color:#ff6b6b;margin-top:3px}
@media (prefers-reduced-motion:reduce){.gar-arq,.gar-band,.gar-balanca{animation:none}.gar-masc{animation:none;top:268px}.gar-faixa{animation:none;opacity:1}}
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
        <div className="gar-teto" />
        <div className="gar-arq" />
        <div className="gar-gram" />
        <div className="gar-band">
          <div className="tx"><b>TRICOLOR DO ARRUDA</b><small>{tr('A TORCIDA MAIS APAIXONADA', 'THE MOST PASSIONATE CROWD')}</small></div>
          <span className="esc"><Escudo nome={clube} size={84} /></span>
        </div>
        <div className="gar-masc"><div className="gar-balanca"><img src={arrudaMascoteImg} alt="" /></div></div>
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

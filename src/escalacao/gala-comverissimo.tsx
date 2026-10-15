// ─── 🎬 ENTRADA ÚNICA DO COMVERISSIMO FC: "GRAVANDO…" ─────────────────────────────────────────────────────────
//
// O dono (cesar.verissimo27, 🖋 Fundador desde 15/10) faz vídeo de conteúdo de futebol no Instagram, sempre de boné
// virado pra trás. Ideia aprovada pelo Diego pra virar mockup: a tela vira um celular GRAVANDO.
// 1) ● REC + o contador rodando, grade da câmera e os cantinhos de foco
// 2) o Verissimo (mascote = caricatura do dono) sobe no quadro apontando pra câmera
// 3) legenda: "FALA, GALERA!" → "HOJE O ASSUNTO É…" → "O COMVERISSIMO CHEGOU NA SALA!"
// 4) sobem curtidas e comentários, o contador de ❤️ dispara
// 5) clique de foto (clarão) → escudo no meio com o @comverissimo e a faixa "CHEGOU NA SALA"
// ⚠️ Nada de logo/nome/tela do Instagram (marca registrada): é um celular gravando genérico.
//
// Mesmo esquema das outras galas únicas (`gala-fabulous.tsx`): palco 420×760 escalado pra tela, camada fixa
// `pointer-events:none`, fora do reducer, sem localStorage; "reduzir movimento" = tudo parado no lugar.
// Som: ainda sem canto (o Diego vai mandar) — quando chegar, entra `playMp3Gala` igual ao Fabulous.
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Escudo } from './escudos'
import { tr } from './lang'
import comverissimoMascoteImg from './img/comverissimo-mascote.webp'

export const COMVERISSIMO_MS = 7400
const T = COMVERISSIMO_MS
const pct = (ms: number) => (ms / T * 100).toFixed(1) + '%'
const GOLD = '#FFC400', VERDE = '#034727', BRANCO = '#F0F0EC'
// a arte do Verissimo é 241×440; no palco ele fica com 330 de altura
const MH = 330, MW = Math.round(MH * 241 / 440)

// 💬 os comentários que pipocam: [texto, atraso em ms]
const COMENTARIOS: [string, number][] = [
  ['🔥🔥🔥', 2300], ['VERDÃO! 💚', 2750], ['conteúdo bom demais', 3200], ['boné pra trás é lei 🧢', 3650],
]
// ❤️ corações subindo: [x, atraso em ms, tamanho]
const CORACOES: [number, number, number][] = [
  [330, 2100, 30], [360, 2350, 24], [345, 2600, 34], [372, 2850, 26], [338, 3100, 30], [362, 3350, 22], [350, 3600, 32], [368, 3850, 26], [334, 4100, 28],
]
// 📝 as legendas, uma de cada vez: [texto PT, texto EN, de, até]
const LEGENDAS: [string, string, number, number][] = [
  ['FALA, GALERA! 👋', 'WHAT’S UP, GUYS! 👋', 1250, 2350],
  ['HOJE O ASSUNTO É…', 'TODAY’S TOPIC IS…', 2350, 3400],
  ['O COMVERISSIMO CHEGOU NA SALA! ⚽', 'COMVERISSIMO JUST ARRIVED! ⚽', 3400, 4600],
]

const CSS = `
.gcv{position:fixed;inset:0;z-index:99990;pointer-events:none;overflow:hidden;background:rgba(0,0,0,.82);animation:gcvVis ${T}ms ease forwards}
@keyframes gcvVis{0%{opacity:0}4%{opacity:1}94%{opacity:1}100%{opacity:0}}
.gcv-palco{position:absolute;left:50%;top:50%;width:420px;height:760px}
/* 📱 o celular: borda preta grossa, cantos grandes, a tela com o fundo verde do estúdio */
.gcv-cel{position:absolute;inset:8px;border-radius:46px;border:10px solid #0C0C0C;overflow:hidden;box-shadow:6px 6px 0 #000;
  background:radial-gradient(ellipse at 50% 35%,#1d7a4a,${VERDE} 55%,#01200f);animation:gcvCel ${T}ms cubic-bezier(.3,.9,.35,1) forwards}
@keyframes gcvCel{0%{transform:scale(.7);opacity:0}${pct(450)}{transform:scale(1);opacity:1}${pct(4650)}{transform:scale(1)}${pct(5000)}{transform:scale(.94)}100%{transform:scale(.94)}}
.gcv-cel::before{content:'';position:absolute;left:50%;top:10px;width:96px;height:24px;margin-left:-48px;border-radius:14px;background:#0C0C0C;z-index:9}
/* bokeh de luz no fundo (estúdio caseiro) */
.gcv-luz{position:absolute;border-radius:50%;filter:blur(6px);opacity:.35}
/* 🎯 grade e cantinhos de foco da câmera */
.gcv-grade{position:absolute;inset:0;z-index:2;background:
  linear-gradient(90deg,transparent calc(33.3% - 1px),rgba(255,255,255,.18) 33.3%,transparent calc(33.3% + 1px),transparent calc(66.6% - 1px),rgba(255,255,255,.18) 66.6%,transparent calc(66.6% + 1px)),
  linear-gradient(0deg,transparent calc(33.3% - 1px),rgba(255,255,255,.18) 33.3%,transparent calc(33.3% + 1px),transparent calc(66.6% - 1px),rgba(255,255,255,.18) 66.6%,transparent calc(66.6% + 1px));
  animation:gcvSome ${T}ms ease forwards}
.gcv-foco{position:absolute;left:96px;top:150px;width:210px;height:250px;z-index:3;animation:gcvFoco ${T}ms ease forwards}
.gcv-foco i{position:absolute;width:26px;height:26px;border:3px solid ${GOLD}}
@keyframes gcvFoco{0%,${pct(500)}{opacity:0;transform:scale(1.4)}${pct(900)}{opacity:1;transform:scale(1)}${pct(1100)}{opacity:.4}${pct(1300)}{opacity:1}${pct(4600)}{opacity:1}${pct(4700)}{opacity:0}100%{opacity:0}}
@keyframes gcvSome{0%,${pct(4600)}{opacity:1}${pct(4700)}{opacity:0}100%{opacity:0}}
/* ● REC + contador */
.gcv-rec{position:absolute;left:24px;top:44px;z-index:6;display:flex;align-items:center;gap:7px;background:rgba(0,0,0,.55);border-radius:10px;padding:5px 10px;
  font:700 16px Oswald,sans-serif;color:#fff;letter-spacing:.08em;animation:gcvSome ${T}ms ease forwards}
.gcv-rec b{width:12px;height:12px;border-radius:50%;background:#E8503A;animation:gcvPisca .9s steps(1) infinite}
@keyframes gcvPisca{50%{opacity:0}}
.gcv-arroba{position:absolute;right:22px;top:44px;z-index:6;background:rgba(0,0,0,.55);border-radius:10px;padding:5px 10px;font:700 15px Oswald,sans-serif;color:#fff;animation:gcvSome ${T}ms ease forwards}
/* 🧢 o Verissimo sobe no quadro apontando pra câmera */
.gcv-mas{position:absolute;left:50%;z-index:4;margin-left:-${MW / 2}px;animation:gcvMas ${T}ms cubic-bezier(.3,1.25,.4,1) forwards}
@keyframes gcvMas{0%,${pct(500)}{top:760px}${pct(1200)}{top:150px}${pct(1400)}{top:164px}${pct(4600)}{top:164px;transform:scale(1);opacity:1}${pct(5000)}{top:300px;transform:scale(.62) translateX(-210px);opacity:1}100%{top:300px;transform:scale(.62) translateX(-210px)}}
.gcv-mas img{display:block;width:${MW}px;height:${MH}px;filter:drop-shadow(4px 6px 0 rgba(0,0,0,.45))}
/* 📝 legenda estilo vídeo (caixa branca, texto preto, Oswald) */
.gcv-leg{position:absolute;left:28px;right:28px;top:500px;z-index:6;text-align:center;opacity:0}
.gcv-leg span{display:inline-block;background:#fff;color:#0C0C0C;border:3px solid #0C0C0C;border-radius:12px;box-shadow:3px 3px 0 #000;padding:6px 12px;font:800 22px/1.15 Oswald,sans-serif;text-transform:uppercase}
@keyframes gcvLeg{0%{opacity:0;transform:translateY(14px) scale(.85)}12%{opacity:1;transform:translateY(0) scale(1.05)}20%{transform:scale(1)}88%{opacity:1}100%{opacity:0}}
/* 💬 comentários pipocando no canto de baixo */
.gcv-com{position:absolute;left:22px;z-index:6;opacity:0;display:flex;align-items:center;gap:7px;max-width:260px}
.gcv-com i{flex:none;width:26px;height:26px;border-radius:50%;border:2px solid #fff;background:linear-gradient(135deg,${GOLD},#E8503A)}
.gcv-com span{background:rgba(0,0,0,.6);color:#fff;border-radius:12px;padding:5px 10px;font:600 14px system-ui,sans-serif}
@keyframes gcvCom{0%{opacity:0;transform:translateX(-30px)}10%{opacity:1;transform:translateX(0)}85%{opacity:1}100%{opacity:0}}
/* ❤️ corações subindo pela direita */
.gcv-cor{position:absolute;top:640px;z-index:6;opacity:0;filter:drop-shadow(2px 2px 0 rgba(0,0,0,.4))}
@keyframes gcvCor{0%{opacity:0;transform:translateY(0) scale(.4)}12%{opacity:1;transform:translateY(-30px) scale(1.1)}100%{opacity:0;transform:translateY(-330px) translateX(-26px) scale(.9)}}
.gcv-likes{position:absolute;right:20px;top:690px;z-index:7;display:flex;align-items:center;gap:6px;background:#0C0C0C;border:3px solid #fff;border-radius:14px;padding:4px 10px;
  font:800 18px Oswald,sans-serif;color:#fff;opacity:0;animation:gcvLikes ${T}ms ease forwards}
@keyframes gcvLikes{0%,${pct(2000)}{opacity:0;transform:scale(.5)}${pct(2250)}{opacity:1;transform:scale(1.1)}${pct(2400)}{transform:scale(1)}${pct(4600)}{opacity:1}${pct(4700)}{opacity:0}100%{opacity:0}}
/* 📸 o clique: clarão branco */
.gcv-flash{position:absolute;inset:0;z-index:10;background:#fff;opacity:0;animation:gcvFlash ${T}ms linear forwards}
@keyframes gcvFlash{0%,${pct(4600)}{opacity:0}${pct(4680)}{opacity:1}${pct(5000)}{opacity:0}100%{opacity:0}}
/* 🛡️ o escudo no meio + @ + faixa */
.gcv-aura{position:absolute;left:50%;top:110px;width:380px;height:380px;margin-left:-190px;z-index:4;border-radius:50%;opacity:0;
  background:radial-gradient(circle,rgba(255,196,0,.5),rgba(240,240,236,.18) 45%,transparent 70%);animation:gcvAura ${T}ms ease forwards}
@keyframes gcvAura{0%,${pct(4650)}{opacity:0;transform:scale(.3)}${pct(5150)}{opacity:1;transform:scale(1.1)}${pct(5400)}{transform:scale(1)}100%{opacity:1;transform:scale(1)}}
.gcv-esc{position:absolute;left:50%;top:120px;z-index:5;opacity:0;transform:translateX(-50%);animation:gcvEsc ${T}ms cubic-bezier(.2,1.4,.4,1) forwards}
@keyframes gcvEsc{0%,${pct(4700)}{opacity:0;transform:translateX(-50%) scale(.2) rotate(-14deg)}${pct(5200)}{opacity:1;transform:translateX(-50%) scale(1.12) rotate(3deg)}${pct(5450)}{transform:translateX(-50%) scale(1) rotate(0)}100%{opacity:1;transform:translateX(-50%) scale(1)}}
.gcv-esc>span{display:inline-flex;filter:drop-shadow(4px 5px 0 rgba(0,0,0,.55)) drop-shadow(0 0 18px rgba(255,196,0,.55))}
.gcv-tag{position:absolute;left:0;right:0;top:400px;z-index:6;text-align:center;opacity:0;animation:gcvTag ${T}ms ease forwards}
.gcv-tag span{display:inline-block;background:${BRANCO};color:${VERDE};border:3px solid #0C0C0C;border-radius:999px;box-shadow:3px 3px 0 #000;padding:3px 14px;font:800 20px Oswald,sans-serif}
@keyframes gcvTag{0%,${pct(5200)}{opacity:0;transform:translateY(10px)}${pct(5500)}{opacity:1;transform:translateY(0)}100%{opacity:1}}
.gcv-faixa{position:absolute;left:24px;right:24px;top:590px;z-index:9;background:#0C0C0C;border:3px solid ${GOLD};border-radius:16px;padding:8px;text-align:center;opacity:0;animation:gcvFaixa ${T}ms cubic-bezier(.2,1.3,.4,1) forwards}
@keyframes gcvFaixa{0%,${pct(5350)}{opacity:0;transform:scale(.4)}${pct(5750)}{opacity:1;transform:scale(1.06)}${pct(5950)}{transform:scale(1)}${pct(7000)}{opacity:1}100%{opacity:0}}
.gcv-faixa small{display:block;font:700 13px Oswald,sans-serif;letter-spacing:.22em;color:${GOLD}}
.gcv-faixa b{display:block;font:700 26px/1.05 Oswald,sans-serif;color:#fff;text-transform:uppercase;margin-top:2px}
.gcv-faixa em{display:block;font-style:normal;font:700 15px Oswald,sans-serif;color:#7fe3a4;margin-top:3px;letter-spacing:.06em}
@media (prefers-reduced-motion:reduce){.gcv-grade,.gcv-foco,.gcv-rec,.gcv-arroba,.gcv-leg,.gcv-com,.gcv-cor,.gcv-likes,.gcv-flash{display:none}
  .gcv-cel,.gcv-aura,.gcv-esc,.gcv-tag,.gcv-faixa{animation:none;opacity:1}.gcv-mas{animation:none;top:300px;transform:scale(.62) translateX(-210px)}}
`

function useEscala() {
  const calc = () => Math.min(window.innerWidth / 420, window.innerHeight / 760)
  const [s, setS] = useState(calc)
  useEffect(() => { const f = () => setS(calc()); window.addEventListener('resize', f); return () => window.removeEventListener('resize', f) }, [])
  return s
}

/** ⏱️ o tempo desde que a gala começou (pro contador do REC e o de curtidas) */
function useDecorrido(chave: string) {
  const [ms, setMs] = useState(0)
  useEffect(() => {
    const t0 = performance.now()
    const id = window.setInterval(() => setMs(performance.now() - t0), 100)
    return () => window.clearInterval(id)
  }, [chave])
  return ms
}

const fmtLikes = (n: number) => n >= 1000 ? (n / 1000).toFixed(1).replace('.', ',') + ' mil' : String(n)

export function GalaComverissimo({ clube, chave, mostra, grito }: { clube: string; chave: string; mostra: string; grito: string }) {
  const s = useEscala()
  const ms = useDecorrido(chave)
  void grito
  const seg = Math.min(Math.floor(ms / 1000), 59)
  // ❤️ as curtidas disparam entre 2,0s e 4,6s: de 1,2 mil até 98,7 mil
  const f = Math.max(0, Math.min(1, (ms - 2000) / 2600))
  const likes = Math.round(1200 + (98700 - 1200) * f * f)
  return createPortal(
    <div key={chave} className="gcv" aria-hidden>
      <style>{CSS}</style>
      <div className="gcv-palco" style={{ transform: `translate(-50%,-50%) scale(${s})` }}>
        <div className="gcv-cel">
          <span className="gcv-luz" style={{ left: 30, top: 90, width: 90, height: 90, background: GOLD }} />
          <span className="gcv-luz" style={{ right: 20, top: 220, width: 70, height: 70, background: '#fff' }} />
          <span className="gcv-luz" style={{ left: 60, top: 420, width: 60, height: 60, background: '#7fe3a4' }} />
          <div className="gcv-grade" />
          <div className="gcv-foco">
            <i style={{ left: 0, top: 0, borderRight: 0, borderBottom: 0 }} />
            <i style={{ right: 0, top: 0, borderLeft: 0, borderBottom: 0 }} />
            <i style={{ left: 0, bottom: 0, borderRight: 0, borderTop: 0 }} />
            <i style={{ right: 0, bottom: 0, borderLeft: 0, borderTop: 0 }} />
          </div>
          <div className="gcv-rec"><b />REC 00:{String(seg).padStart(2, '0')}</div>
          <div className="gcv-arroba">@comverissimo</div>
          <div className="gcv-aura" />
          <div className="gcv-esc"><span><Escudo nome={clube} size={250} /></span></div>
          <div className="gcv-tag"><span>@comverissimo</span></div>
          <div className="gcv-mas"><img src={comverissimoMascoteImg} alt="" /></div>
          {LEGENDAS.map(([pt, en, de, ate], i) => (
            <div key={i} className="gcv-leg" style={{ animation: `gcvLeg ${ate - de}ms ease ${de}ms forwards` }}><span>{tr(pt, en)}</span></div>
          ))}
          {COMENTARIOS.map(([txt, d], i) => (
            <div key={i} className="gcv-com" style={{ top: 680 - i * 40, animation: `gcvCom 1700ms ease ${d}ms forwards` }}><i /><span>{txt}</span></div>
          ))}
          {CORACOES.map(([x, d, t], i) => (
            <span key={i} className="gcv-cor" style={{ left: x, fontSize: t, animation: `gcvCor 1500ms ease-out ${d}ms forwards` }}>❤️</span>
          ))}
          <div className="gcv-likes">❤️ {fmtLikes(likes)}</div>
          <div className="gcv-faixa">
            <small>{tr('🎬 CHEGOU NA SALA', '🎬 JUST ARRIVED')}</small>
            <b>{mostra}</b>
            <em>🧢 FUTEBOL E RESENHA 🧢</em>
          </div>
          <div className="gcv-flash" />
        </div>
      </div>
    </div>,
    document.body,
  )
}

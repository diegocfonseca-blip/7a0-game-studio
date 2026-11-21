// ─── 🌴 VICE CITY — a tela das cartas de golpe (19/11, mockup aprovado `scripts/mockups/vice-city-pregao.png`) ──────────
// Mora DENTRO do pregão aberto (`pregao-aberto.tsx`): a faixa do último golpe em cima da mesa e, embaixo, a sua mão. O motor é o
// `viceUsa` do store (o dono da sala decide); aqui só se desenha e se manda `VICE_USAR`. As regras usam as MESMAS funções do
// motor (`viceAlvoServe`, `viceTravaLance`) — nada de regra própria na tela (regra de ouro contra botão mudo).
import { useEffect, useRef, useState } from 'react'
import { playSireneCurta, playEstrela, playGolpe } from './sound'
import { useEsc, viceAlvoServe, viceTravaLance, vicePodeUsar } from './store'
import { useT } from './lang'
import { agoraSala } from './relogio'
import { playSirene } from './sound'
import { GOLPES, VICE_BUSTED_EM, type GolpeId } from './vice-city'

const INK = '#0C0C0C', NEON = '#ff4fd8', CIANO = '#4ff3ff', OURO = '#ffd24d'
const OSW = { fontFamily: 'Oswald, sans-serif', fontWeight: 900, textTransform: 'uppercase' as const }
const fundo = 'linear-gradient(160deg,#1b0b3a 0%,#5b1a6e 55%,#2a0e3e 100%)'

/** 📣 a faixa do último golpe (pra sala inteira) — fica em cima da mesa */
export function ViceCityFaixa() {
  const { state } = useEsc()
  const t = useT()
  const v = state.pa?.vice
  if (!v) return null
  const ult = v.feed[0]
  const ant = v.feed.slice(1, 3)
  return (
    <div style={{ background: fundo, border: `3px solid ${INK}`, borderRadius: 14, boxShadow: `4px 4px 0 ${INK}`, padding: '8px 10px', color: '#fff' }}>
      <p style={{ ...OSW, margin: 0, fontSize: 13, letterSpacing: '.22em', color: CIANO, textShadow: `0 0 8px ${CIANO}` }}>🌴 Vice City</p>
      {ult && (
        <div key={ult.id} className="vice-pop" style={{ marginTop: 5, background: ult.busted ? '#C2452F' : 'rgba(0,0,0,.55)', border: `2px solid ${ult.busted ? '#fff' : NEON}`, borderRadius: 10, padding: '7px 9px', boxShadow: `0 0 12px ${ult.busted ? '#E8503A' : NEON}` }}>
          <p style={{ margin: 0, fontSize: ult.busted ? 14 : 12.5, fontWeight: 900, lineHeight: 1.3 }}>{t(ult.pt, ult.en)}</p>
        </div>
      )}
      {ant.map(f => <p key={f.id} style={{ margin: '4px 2px 0', fontSize: 10.5, fontWeight: 700, opacity: .7, lineHeight: 1.3 }}>{t(f.pt, f.en)}</p>)}
      <style>{`@keyframes vicePop{0%{transform:scale(.85);opacity:0}60%{transform:scale(1.03);opacity:1}100%{transform:none}}.vice-pop{animation:vicePop .45s ease-out}`}</style>
    </div>
  )
}

/** 🃏 a sua mão de cartas de golpe + o que está valendo contra você + o segredo do X9/Sniper (só seu) */
export function ViceCityMao() {
  const { state, dispatch } = useEsc()
  const t = useT()
  const [agora, setAgora] = useState(agoraSala())
  const [escolhendo, setEscolhendo] = useState<GolpeId | null>(null)
  useEffect(() => { const iv = setInterval(() => setAgora(agoraSala()), 500); return () => clearInterval(iv) }, [])
  const v = state.pa?.vice
  const you = state.managers[state.youIdx]
  if (!v || !you) return null
  const mao = (v.mao[you.id] ?? []) as GolpeId[]
  const trava = viceTravaLance(state, you.id)
  const rivais = state.managers.filter(m => m.id !== you.id)
  const usar = (g: GolpeId, alvo?: number) => {
    dispatch({ type: 'VICE_USAR', mgrId: you.id, golpe: g, ...(alvo !== undefined ? { alvo } : {}), by: state.youUid })
    setEscolhendo(null)
  }
  const segredo = v.segredo[you.id]
  const segredoVale = segredo && segredo.ate > agora
  const efeitos: string[] = []
  if ((v.blitzAte[you.id] ?? 0) > agora) efeitos.push(t(`🚔 Blitz: ${Math.ceil((v.blitzAte[you.id] - agora) / 1000)} s`, `🚔 Roadblock: ${Math.ceil((v.blitzAte[you.id] - agora) / 1000)} s`))
  if ((v.tiroteioAte[you.id] ?? 0) > agora) efeitos.push(t(`🔫 Caixa congelado: ${Math.ceil((v.tiroteioAte[you.id] - agora) / 1000)} s`, `🔫 Cash frozen: ${Math.ceil((v.tiroteioAte[you.id] - agora) / 1000)} s`))
  if ((v.tanqueAte[you.id] ?? 0) > agora) efeitos.push(t(`⛽ Tanque vazio: ${Math.ceil((v.tanqueAte[you.id] - agora) / 1000)} s`, `⛽ Empty tank: ${Math.ceil((v.tanqueAte[you.id] - agora) / 1000)} s`))
  if (state.pa && v.barreiraIdx[you.id] === state.pa.idx) efeitos.push(t('🚧 Barreira nesta carta', '🚧 Barrier on this card'))
  if (v.cadeia[you.id]) efeitos.push(t('🔒 Cadeia: a próxima carta que você levar volta pra mesa', '🔒 Jail: the next card you win goes back'))
  if (v.multa[you.id]) efeitos.push(t('🧾 Multa: próxima carta +30%', '🧾 Fine: next card +30%'))
  if ((v.pneuAte?.[you.id] ?? 0) > agora) efeitos.push(t(`🛞 Pneu furado: só +1 por ${Math.ceil((v.pneuAte![you.id] - agora) / 1000)} s`, `🛞 Flat tire: +1 only for ${Math.ceil((v.pneuAte![you.id] - agora) / 1000)} s`))
  if (v.jacare?.[you.id] !== undefined) efeitos.push(t('🐊 Tem um jacaré de tocaia em você: a próxima lenda que cair no seu time vai embora', '🐊 A gator is lying in wait: the next legend that lands on your team gets taken'))
  if (v.lavagem[you.id] !== undefined) efeitos.push(t('💸 Lavagem: metade da próxima compra vai pra outro', '💸 Laundering: half of your next buy goes to someone else'))
  const meus: string[] = []
  if (v.colete[you.id]) meus.push(t('🛡️ Colete', '🛡️ Vest'))
  if (v.fuga[you.id]) meus.push(t('🚁 Fuga pronta', '🚁 Escape ready'))
  if (v.propina[you.id]) meus.push(t('💵 Propina: próxima carta pela metade', '💵 Bribe: next card half price'))
  if (state.pa && v.missao?.[you.id] === state.pa.idx) meus.push(t(`💼 Missão: leve esta carta e ganhe +10`, `💼 Mission: win this card for +10`))
  const meusJacares = Object.entries(v.jacare ?? {}).filter(([, dono]) => dono === you.id).map(([vit]) => state.managers.find(m => m.id === +vit)?.teamName).filter(Boolean)
  if (meusJacares.length) meus.push(t(`🐊 Jacaré de tocaia no ${meusJacares.join(', ')}`, `🐊 Gator waiting on ${meusJacares.join(', ')}`))
  return (
    <div style={{ background: fundo, border: `3px solid ${INK}`, borderRadius: 14, boxShadow: `4px 4px 0 ${INK}`, padding: 10, color: '#fff', display: 'flex', flexDirection: 'column', gap: 8 }}>
      {(trava || efeitos.length > 0) && (
        <div style={{ background: '#C2452F', border: '2px solid #fff', borderRadius: 10, padding: '6px 8px' }}>
          <p style={{ margin: 0, fontSize: 12, fontWeight: 900 }}>{trava ? t(trava[0], trava[1]) : t('⚠️ Contra você agora', '⚠️ Against you right now')}</p>
          {efeitos.map(e => <p key={e} style={{ margin: '2px 0 0', fontSize: 11, fontWeight: 700 }}>{e}</p>)}
        </div>
      )}
      {meus.length > 0 && <p style={{ margin: 0, fontSize: 11.5, fontWeight: 800, color: '#8dffb0' }}>✅ {meus.join(' · ')}</p>}
      {segredoVale && (
        <div style={{ background: 'rgba(0,0,0,.6)', border: `2px solid ${CIANO}`, borderRadius: 10, padding: '6px 8px' }}>
          <p style={{ ...OSW, margin: 0, fontSize: 12, color: CIANO, letterSpacing: '.1em' }}>{segredo.tipo === 'x9' ? t('📡 X9 · só você vê', '📡 Informant · only you see') : t('🎯 Sniper · só você vê', '🎯 Sniper · only you see')}</p>
          {segredo.linhas.length ? segredo.linhas.map((l, i) => <p key={i} style={{ margin: '3px 0 0', fontSize: 12, fontWeight: 800, color: segredo.tipo === 'sniper' ? OURO : '#fff' }}>{l}</p>)
            : <p style={{ margin: '3px 0 0', fontSize: 12, fontWeight: 700 }}>{t('Nada por aqui.', 'Nothing here.')}</p>}
        </div>
      )}
      <p style={{ ...OSW, margin: 0, fontSize: 13, letterSpacing: '.14em', color: NEON, textShadow: `0 0 6px ${NEON}` }}>{t('🃏 Suas cartas de golpe', '🃏 Your heist cards')}</p>
      {mao.length === 0 ? (
        <p style={{ margin: 0, fontSize: 11.5, fontWeight: 700, opacity: .8 }}>{t('Você já usou suas cartas.', 'You have used your cards.')}</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: 8 }}>
          {mao.map((g, i) => {
            const G = GOLPES[g]
            if (!G) return null
            const podeSo = G.alvo || vicePodeUsar(state, g, you.id) // 🆕 21/11: Loja sem 10 moedas, Missão sem carta, Paraquedas sem lenda livre
            return (
              <button key={`${g}-${i}`} disabled={!podeSo} onClick={() => G.alvo ? setEscolhendo(escolhendo === g ? null : g) : usar(g)}
                style={{ opacity: podeSo ? 1 : .55, background: '#fff', color: INK, border: `3px solid ${G.alvo ? '#C2452F' : '#1B7A3D'}`, borderRadius: 12, boxShadow: `3px 3px 0 ${G.alvo ? '#C2452F' : '#1B7A3D'}`, padding: '8px 6px', textAlign: 'center', cursor: 'pointer', outline: escolhendo === g ? `3px solid ${NEON}` : 'none' }}>
                <span style={{ fontSize: 26, display: 'block', lineHeight: 1 }}>{G.emoji}</span>
                <b style={{ ...OSW, display: 'block', fontSize: 13, marginTop: 3 }}>{t(G.nome[0], G.nome[1])}</b>
                <span style={{ display: 'block', fontSize: 10, fontWeight: 700, color: '#444', marginTop: 2, lineHeight: 1.25 }}>{t(G.faz[0], G.faz[1])}</span>
                <span style={{ ...OSW, display: 'inline-block', marginTop: 5, fontSize: 11, background: G.alvo ? '#C2452F' : '#1B7A3D', color: '#fff', borderRadius: 7, padding: '2px 8px' }}>{G.alvo ? t('Escolher rival', 'Pick a rival') : podeSo ? t('Usar', 'Use') : g === 'loja' ? t('Faltam moedas', 'Not enough coins') : t('Não dá agora', 'Not now')}</span>
              </button>
            )
          })}
        </div>
      )}
      {escolhendo && (
        <div style={{ background: 'rgba(0,0,0,.55)', border: `2px solid ${NEON}`, borderRadius: 10, padding: 8 }}>
          <p style={{ margin: '0 0 6px', fontSize: 12, fontWeight: 900 }}>{GOLPES[escolhendo].emoji} {t(`${GOLPES[escolhendo].nome[0]} · em quem?`, `${GOLPES[escolhendo].nome[1]} · on whom?`)}</p>
          <div style={{ display: 'grid', gap: 5 }}>
            {rivais.map(r => {
              const ok = viceAlvoServe(state, escolhendo, you.id, r.id)
              const ultimo = escolhendo === 'roubo' ? r.squad.find(c => c.id === v.ultimo[r.id])?.name : undefined
              return (
                <button key={r.id} disabled={!ok} onClick={() => usar(escolhendo, r.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, background: ok ? '#fff' : 'rgba(255,255,255,.35)', color: INK, border: `2px solid ${INK}`, borderRadius: 9, padding: '6px 8px', cursor: ok ? 'pointer' : 'not-allowed', textAlign: 'left' }}>
                  <b style={{ ...OSW, fontSize: 13, flex: 1 }}>{r.teamName}</b>
                  <span style={{ fontSize: 10.5, fontWeight: 700 }}>{escolhendo === 'roubo' ? (ultimo ? t(`último: ${ultimo}`, `last: ${ultimo}`) : t('ainda não levou ninguém', 'no player yet')) : !ok ? t('não dá agora', 'not now') : ''}</span>
                </button>
              )
            })}
          </div>
          {escolhendo === 'roubo' && <p style={{ margin: '6px 0 0', fontSize: 10.5, fontWeight: 700, opacity: .8 }}>{t('Só dá se você ainda tiver vaga na posição do jogador.', 'Only works if you still have a slot in that player’s position.')}</p>}
        </div>
      )}
      <p style={{ margin: 0, fontSize: 10.5, fontWeight: 700, opacity: .75, lineHeight: 1.35 }}>{t(`Todo golpe aparece pra sala. Quem leva golpe ganha ⭐ (só ele vê as dele); o 1º a chegar em ${VICE_BUSTED_EM} leva BUSTED e perde os 3 melhores.`, `Every hit is shown to the room. Whoever is hit gets a ⭐ (only they see their own); the first to reach ${VICE_BUSTED_EM} is BUSTED and loses their 3 best.`)}</p>
    </div>
  )
}

// 🌆 O TEMA DA TELA (19/11, Diego no 1º print: *"muito pouca cor rosa néon e poucos detalhes de Vice City… jacaré num canto, carro…
// mais cores igual você tinha feito no mockup"*). A tela inteira do pregão vira o pôr do sol neon do mockup: céu roxo→rosa→laranja,
// sol listrado, coqueiros, chão de grade rosa, um 🐊 no canto, carro e helicóptero cruzando. Tudo CSS/emoji (0 KB de arte).
export const VICE_TEMA_CSS = `
.vice-tema{position:relative;overflow:hidden;border:3px solid #0C0C0C;border-radius:18px;padding:12px 10px 120px;box-shadow:0 0 0 3px #ff4fd8,0 0 26px rgba(255,79,216,.55),5px 5px 0 #0C0C0C;
  background:linear-gradient(180deg,#14072e 0%,#3b1265 22%,#7a1d7e 42%,#ff4f8b 63%,#ffb26b 74%,#3a1250 75%,#160828 100%)}
.vice-tema>*:not(.vice-decor){position:relative;z-index:2}
.vice-tema .ov3-page-muted{color:#ffe1f6!important;text-shadow:0 1px 3px #000}
.vice-decor{position:absolute;inset:0;pointer-events:none;z-index:1;overflow:hidden}
.vice-sol{position:absolute;left:50%;top:58%;width:280px;height:280px;margin:-140px 0 0 -140px;border-radius:50%;opacity:.85;
  background:repeating-linear-gradient(180deg,#ffd36b 0 16px,rgba(255,211,107,0) 16px 24px),radial-gradient(circle,#ffe08a,#ff6a8b);-webkit-mask:linear-gradient(#000 0 55%,transparent 55%);mask:linear-gradient(#000 0 55%,transparent 55%)}
.vice-grade{position:absolute;left:-60px;right:-60px;bottom:0;height:24%;transform:perspective(320px) rotateX(52deg);transform-origin:50% 100%;
  background:repeating-linear-gradient(90deg,rgba(79,243,255,.75) 0 2px,transparent 2px 52px),repeating-linear-gradient(0deg,rgba(255,79,216,.75) 0 2px,transparent 2px 34px);animation:viceGrade 1.6s linear infinite}
@keyframes viceGrade{to{background-position:0 0,0 34px}}
.vice-palma{position:absolute;bottom:22%;font-size:110px;line-height:1;filter:brightness(0) drop-shadow(0 0 10px rgba(255,79,216,.6));opacity:.9}
.vice-estrela{position:absolute;color:#fff;font-size:10px;opacity:.7;animation:vicePisca 2.4s ease-in-out infinite}
@keyframes vicePisca{50%{opacity:.15}}
.vice-jacare{position:absolute;right:8px;bottom:8px;font-size:34px;filter:drop-shadow(0 0 8px #4ff3ff);animation:viceJacare 3s ease-in-out infinite}
@keyframes viceJacare{50%{transform:translateY(-4px) rotate(-6deg)}}
.vice-carro{position:absolute;bottom:13%;left:-60px;font-size:38px;filter:drop-shadow(0 0 10px #ff4fd8);animation:viceCarro 7s linear infinite}
@keyframes viceCarro{0%{transform:translateX(0) scaleX(-1)}100%{transform:translateX(calc(100vw + 120px)) scaleX(-1)}}
.vice-heli{position:absolute;top:28%;right:-60px;font-size:28px;animation:viceHeli 11s linear infinite}
@keyframes viceHeli{0%{transform:translateX(0)}100%{transform:translateX(calc(-100vw - 140px))}}
.vice-letreiro{position:absolute;left:10px;bottom:9px;font:900 15px Oswald,sans-serif;letter-spacing:.2em;color:#fff;text-shadow:0 0 6px #ff4fd8,0 0 14px #ff4fd8,2px 2px 0 #000}
@media (prefers-reduced-motion:reduce){.vice-grade,.vice-carro,.vice-heli,.vice-jacare,.vice-estrela{animation:none}}
`
export function ViceDecor() {
  const estrelas = [[8, 6], [22, 14], [40, 4], [63, 10], [80, 5], [92, 16], [55, 20], [15, 26]]
  return (
    <div className="vice-decor" aria-hidden>
      {estrelas.map(([x, y], i) => <i key={i} className="vice-estrela" style={{ left: `${x}%`, top: `${y}%`, animationDelay: `${i * 0.3}s` }}>✦</i>)}
      <div className="vice-sol" />
      <span className="vice-palma" style={{ left: -26 }}>🌴</span>
      <span className="vice-palma" style={{ right: -30, transform: 'scaleX(-1)', fontSize: 130 }}>🌴</span>
      <span className="vice-heli">🚁</span>
      <div className="vice-grade" />
      <span className="vice-carro">🏎️</span>
      <span className="vice-jacare">🐊</span>
      <span className="vice-letreiro">VICE CITY</span>
    </div>
  )
}

// 🌴 19/11 (Diego, prints da cerimônia e da temporada: *"precisamos deixar também temático do GTA igual você fez no pregão aberto,
// porém nessas telas também"*). A sala inteira do Vice City (revelação, monte, temporada, copas, fim) ganha o MESMO pôr do sol neon
// do pregão, como FUNDO da página: as caixas do jogo continuam as de sempre por cima (só muda o cenário). Tudo CSS/emoji (0 KB).
export const VICE_TELAS = ['cerimonia', 'monte', 'season', 'liberta', 'champions', 'convocacao', 'end'] as const
export const VICE_SALA_CSS = `
.vice-sala.vice-sala{background-color:#14072e!important;background-image:linear-gradient(180deg,#14072e 0%,#3b1265 24%,#7a1d7e 46%,#c43a8e 64%,#ff6a7a 76%,#ffb26b 84%,#2a0c45 85%,#160828 100%)!important;
  background-size:cover!important;background-attachment:fixed!important;isolation:isolate}
/* ⚠️ nada de position nos filhos: a tabela do computador é presa no canto (absolute/fixed) e se perdia (19/11, "tá torto no desktop") */
.vice-sala>div.sticky{background:linear-gradient(90deg,#2a0b4d,#5b1a6e,#2a0b4d)!important;color:#fff!important;border-bottom:3px solid #ff4fd8!important;box-shadow:0 0 18px rgba(255,79,216,.6)!important}
.vice-sala>div.sticky *{color:inherit}
.vice-sala-decor{position:fixed;inset:0;pointer-events:none;z-index:-1;overflow:hidden}
.vice-sala-decor .vice-sol{top:62%;width:340px;height:340px;margin:-170px 0 0 -170px;opacity:.75}
.vice-sala-decor .vice-grade{height:16%}
.vice-sala-decor .vice-palma{bottom:15%;font-size:150px;opacity:.75}
.vice-sala-decor .vice-carro{bottom:6%}
.vice-sala-decor .vice-jacare{right:14px;bottom:70px;font-size:40px}
.vice-sala-decor .vice-letreiro{left:14px;bottom:76px;font-size:17px}
.vice-sala .ov3-page-muted,.vice-sala h1,.vice-sala h2{text-shadow:0 1px 4px rgba(0,0,0,.6)}
`
export function ViceSalaDecor() {
  const estrelas = [[6, 5], [18, 12], [34, 3], [52, 9], [71, 4], [88, 11], [94, 22], [12, 24], [61, 18], [43, 27]]
  return (
    <div className="vice-sala-decor" aria-hidden>
      {estrelas.map(([x, y], i) => <i key={i} className="vice-estrela" style={{ left: `${x}%`, top: `${y}%`, animationDelay: `${i * 0.27}s` }}>✦</i>)}
      <div className="vice-sol" />
      <span className="vice-palma" style={{ left: -34 }}>🌴</span>
      <span className="vice-palma" style={{ right: -40, transform: 'scaleX(-1)', fontSize: 170 }}>🌴</span>
      <span className="vice-heli">🚁</span>
      <div className="vice-grade" />
      <span className="vice-carro">🏎️</span>
      <span className="vice-jacare">🐊</span>
      <span className="vice-letreiro">VICE CITY</span>
    </div>
  )
}

// ─── 🌴 VICE CITY v2 (19/11, mockup `scripts/mockups/vice-city-v2.png`, Diego: *"Perfeito"*) ──────────────────────────────
// ① o SORTEIO das 3 cartas antes do pregão (só o dono das cartas vê as dele) · ② todo golpe vira FAIXA GRANDE no meio da tela
// de todo mundo por 3 s, com quem usou e em quem (o relógio NÃO para) · ③ ESTRELAS DE PROCURADO: quem leva golpe vê as dele no
// canto, e a tela pisca a sirene na hora. As estrelas dos outros continuam segredo (só o 🎯 Sniper mostra).
const VICE_V2_CSS = `
@keyframes viceVira{0%{transform:rotateY(180deg) scale(.7);opacity:0}60%{transform:rotateY(0) scale(1.06);opacity:1}100%{transform:none;opacity:1}}
.vice-sorteio-c{animation:viceVira .7s cubic-bezier(.2,1.3,.4,1) both}
@keyframes viceFaixa{0%{transform:translateX(-110%)}12%{transform:translateX(0)}88%{transform:translateX(0);opacity:1}100%{transform:translateX(110%);opacity:0}}
.vice-faixa-golpe{animation:viceFaixa 3.2s ease-in-out both}
@keyframes viceSirene{0%,100%{border-color:#ff2b2b}50%{border-color:#2b6bff}}
.vice-sirene{animation:viceSirene .35s linear 8}
@keyframes viceEstrela{0%{transform:scale(2.2);opacity:0}100%{transform:none;opacity:1}}
.vice-estrela-nova{display:inline-block;animation:viceEstrela .6s cubic-bezier(.2,1.4,.4,1)}
@keyframes viceGiroflex{0%,49%{background:rgba(220,20,20,.88)}50%,100%{background:rgba(25,70,230,.88)}}
.vice-busted-tela{animation:viceGiroflex .45s steps(1) infinite}
@keyframes vicePisca{0%,100%{transform:scale(1)}50%{transform:scale(1.08)}}
.vice-busted-pisca{animation:vicePisca .45s ease-in-out infinite}
/* 🆕 21/11: as cenas das cartas novas — CSS e emoji, 0 KB de arte */
.vice-cena-aviao{position:absolute;top:16%;left:0;display:flex;align-items:center;white-space:nowrap;animation:viceAviao 4.2s linear forwards}
@keyframes viceAviao{0%{transform:translateX(-110%)}100%{transform:translateX(110vw)}}
.vice-cena-caixote{position:absolute;left:50%;top:22%;font-size:48px;margin-left:-24px;opacity:0;animation:viceCaixote 4.2s ease-in forwards}
@keyframes viceCaixote{0%,40%{opacity:0;transform:translateY(0)}45%{opacity:1}85%{transform:translateY(32vh)}100%{opacity:1;transform:translateY(32vh) scale(1.1)}}
.vice-cena-para{position:absolute;left:50%;top:-30%;margin-left:-60px;width:120px;text-align:center;animation:vicePara 4s cubic-bezier(.3,.6,.4,1) forwards}
@keyframes vicePara{0%{transform:translateY(0) rotate(-8deg)}50%{transform:translateY(48vh) rotate(6deg)}100%{transform:translateY(52vh) rotate(0)}}
.vice-cena-jacare{position:absolute;left:50%;top:28%;margin-left:-70px;font-size:140px;line-height:1;animation:viceJacareBote 1.1s ease-in-out 3}
@keyframes viceJacareBote{0%,100%{transform:scale(1) rotate(0)}40%{transform:scale(1.25) rotate(-12deg)}60%{transform:scale(.95) rotate(8deg)}}
@media (prefers-reduced-motion:reduce){.vice-cena-aviao,.vice-cena-caixote,.vice-cena-para,.vice-cena-jacare{animation:none}}
`
export function ViceOverlays() {
  const { state } = useEsc()
  const t = useT()
  const v = state.pa?.vice
  const you = state.managers[state.youIdx]
  const [agora, setAgora] = useState(agoraSala())
  useEffect(() => { const iv = setInterval(() => setAgora(agoraSala()), 250); return () => clearInterval(iv) }, [])
  // ① sorteio: aparece enquanto a janela corre (todo mundo entra junto) e dá pra fechar no toque
  const [fechouSorteio, setFechouSorteio] = useState(false)
  const mao = (v && you ? (v.mao[you.id] ?? []) : []) as GolpeId[]
  const sorteio = !!v && !!you && !fechouSorteio && (v.sorteioAte ?? 0) > agora && mao.length > 0
  // ② a faixa do golpe: só o que acontece DEPOIS que a tela abriu (quem entra no meio não recebe a reprise)
  const visto = useRef<number | null>(null)
  const [faixa, setFaixa] = useState<{ id: number; pt: string; en: string; busted?: boolean; cena?: 'aviao' | 'paraquedas' | 'jacare' } | null>(null)
  const ult = v?.feed[0]
  useEffect(() => {
    if (!ult) return
    if (visto.current === null) { visto.current = ult.id; return }
    if (ult.id <= visto.current) return
    visto.current = ult.id
    if (ult.pt.startsWith('🌴')) return
    setFaixa(ult)
    if (ult.busted) { try { playSirene() } catch { /* som nunca quebra o jogo */ } }
    const tm = setTimeout(() => setFaixa(f => (f && f.id === ult.id ? null : f)), ult.busted ? 6500 : ult.cena ? 4400 : 3200)
    return () => clearTimeout(tm)
  }, [ult?.id]) // eslint-disable-line react-hooks/exhaustive-deps
  // ③ estrelas: as minhas, e a sirene quando sobe
  const minhas = v && you ? (v.estrelas[you.id] ?? 0) : 0
  const antes = useRef(minhas)
  const [sirene, setSirene] = useState(0)
  useEffect(() => {
    if (minhas > antes.current) { playSireneCurta(); playEstrela(); setSirene(Date.now()); const tm = setTimeout(() => setSirene(0), 3000); antes.current = minhas; return () => clearTimeout(tm) }
    antes.current = minhas
  }, [minhas])
  // 💥 19/11: a carta saiu da SUA mão = você usou um golpe → som de ataque (só pra você)
  const nMao = mao.length
  const maoAntes = useRef(nMao)
  useEffect(() => { if (nMao < maoAntes.current) playGolpe(); maoAntes.current = nMao }, [nMao])
  if (!v || !you) return null
  return (
    <>
      <style>{VICE_V2_CSS}</style>
      {v.busted !== undefined && (() => { const pego = state.managers.find(m => m.id === v.busted); return pego ? (
        <div style={{ position: 'fixed', left: 12, top: 74, zIndex: 60, maxWidth: 230, background: 'rgba(0,0,0,.78)', border: '3px solid #ff3b3b', borderRadius: 12, padding: '4px 9px', fontSize: 11.5, fontWeight: 800, color: '#fff', pointerEvents: 'none', lineHeight: 1.25 }}>
          {t(`🚔 Polícia pegou ${pego.teamName}. Ninguém mais leva estrela.`, `🚔 Police caught ${pego.teamName}. No more stars for anyone.`)}
        </div>) : null })()}
      {minhas > 0 && v.busted === undefined && (
        <div aria-label={t('suas estrelas de procurado', 'your wanted stars')} style={{ position: 'fixed', right: 12, top: 74, zIndex: 60, background: 'rgba(0,0,0,.72)', border: `3px solid ${OURO}`, borderRadius: 12, padding: '4px 10px', fontSize: 22, letterSpacing: 2, pointerEvents: 'none', boxShadow: `0 0 14px ${OURO}66` }}>
          {Array.from({ length: VICE_BUSTED_EM }, (_, i) => i < minhas
            ? <b key={i} className={i === minhas - 1 && sirene ? 'vice-estrela-nova' : undefined} style={{ color: OURO, textShadow: `0 0 10px ${OURO}` }}>★</b>
            : <span key={i} style={{ color: 'rgba(255,255,255,.25)' }}>★</span>)}
        </div>
      )}
      {sirene > 0 && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 59, pointerEvents: 'none' }}>
          <div className="vice-sirene" style={{ position: 'absolute', inset: 0, border: '10px solid #ff2b2b' }} />
          <div style={{ position: 'absolute', left: 12, right: 12, top: 118, maxWidth: 460, margin: '0 auto', background: INK, border: `4px solid ${OURO}`, borderRadius: 16, padding: '10px 12px', textAlign: 'center' }}>
            <p style={{ ...OSW, margin: 0, fontSize: 22, color: OURO }}>{t('🚨 Você está sendo procurado', '🚨 You are wanted')}</p>
            <p style={{ margin: '3px 0 0', fontSize: 13, fontWeight: 700, color: '#fff' }}>{minhas >= VICE_BUSTED_EM ? t('5 estrelas: a polícia te pegou! No fim do pregão seus 5 melhores viram Profissionais.', '5 stars: the police got you! When the auction ends your 5 best become Pros.') : t(`Levou o ${minhas}º golpe. Com ${VICE_BUSTED_EM} ⭐ vem o BUSTED.`, `Hit #${minhas}. At ${VICE_BUSTED_EM} ⭐ you get BUSTED.`)}</p>
          </div>
        </div>
      )}
      {/* 🚨 19/11 (Diego: "banner piscando com sirene da polícia… dizendo quem foi o primeiro que recebeu 5 estrelas"): a tela toda vira giroflex */}
      {faixa?.busted && (
        <div key={`b${faixa.id}`} className="vice-busted-tela" style={{ position: 'fixed', inset: 0, zIndex: 63, pointerEvents: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 14 }}>
          <div style={{ width: '100%', maxWidth: 520, background: INK, border: `5px solid ${OURO}`, borderRadius: 20, boxShadow: `6px 6px 0 #000`, padding: '16px 14px', textAlign: 'center' }}>
            <p className="vice-busted-pisca" style={{ ...OSW, margin: 0, fontSize: 46, lineHeight: 1, color: '#ff3b3b', textShadow: '0 0 14px #ff3b3b' }}>🚨 BUSTED! 🚔</p>
            <p style={{ ...OSW, margin: '10px 0 0', fontSize: 19, lineHeight: 1.25, color: '#fff' }}>{t(faixa.pt, faixa.en).replace(/^🚨 BUSTED! /, '')}</p>
          </div>
        </div>
      )}
      {/* 🆕 21/11: as cenas das cartas novas, na tela de TODO mundo (o anúncio é o mesmo feed de sempre) */}
      {faixa?.cena && (
        <div key={`c${faixa.id}`} style={{ position: 'fixed', inset: 0, zIndex: 60, pointerEvents: 'none', overflow: 'hidden' }}>
          {faixa.cena === 'aviao' && <>
            <div className="vice-cena-aviao"><span style={{ fontSize: 64, display: 'inline-block', transform: 'scaleX(-1)' }}>✈️</span><span style={{ width: 30, height: 2, background: INK, display: 'inline-block' }} /><span style={{ ...OSW, background: '#FFC400', color: INK, border: `3px solid ${INK}`, borderRadius: 6, boxShadow: `3px 3px 0 ${INK}`, padding: '5px 12px', fontSize: 18 }}>{t('📦 CONTRABANDO!', '📦 SMUGGLING!')}</span></div>
            <div className="vice-cena-caixote">📦</div>
          </>}
          {faixa.cena === 'paraquedas' && <div className="vice-cena-para"><div style={{ fontSize: 56, lineHeight: 1 }}>🪂</div><div style={{ ...OSW, marginTop: 4, height: 120, border: `4px solid ${INK}`, borderRadius: 12, background: 'linear-gradient(160deg,#FFE07a,#FFC400 50%,#d99a00)', boxShadow: '0 0 30px #FFC400', color: INK, fontSize: 18, paddingTop: 34 }}>{t('👑 LENDA', '👑 LEGEND')}</div></div>}
          {faixa.cena === 'jacare' && <div className="vice-cena-jacare">🐊</div>}
        </div>
      )}
      {faixa && !faixa.busted && (
        <div key={faixa.id} className="vice-faixa-golpe" style={{ position: 'fixed', left: 0, right: 0, top: '38%', zIndex: 61, pointerEvents: 'none', background: faixa.busted ? 'linear-gradient(90deg,#7a0d0d,#C2452F)' : `linear-gradient(90deg,#C2452F,${NEON})`, borderTop: `4px solid ${INK}`, borderBottom: `4px solid ${INK}`, padding: '14px 16px', textAlign: 'center', boxShadow: `0 0 30px ${NEON}` }}>
          <p style={{ ...OSW, margin: '0 auto', maxWidth: 640, fontSize: 21, lineHeight: 1.25, color: '#fff', textShadow: `2px 2px 0 ${INK}` }}>{t(faixa.pt, faixa.en)}</p>
        </div>
      )}
      {sorteio && (
        <div onClick={() => setFechouSorteio(true)} style={{ position: 'fixed', inset: 0, zIndex: 62, background: 'rgba(10,3,24,.72)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 14 }}>
          <div style={{ width: '100%', maxWidth: 440, background: 'rgba(20,6,40,.97)', border: `4px solid ${NEON}`, borderRadius: 22, boxShadow: `0 0 30px ${NEON}`, padding: '18px 14px', textAlign: 'center', color: '#fff' }}>
            <p style={{ ...OSW, margin: 0, fontSize: 25, color: OURO, textShadow: `0 0 10px ${NEON}` }}>{t('🎰 Suas cartas de golpe', '🎰 Your heist cards')}</p>
            <p style={{ margin: '4px 0 0', fontSize: 13, fontWeight: 700, color: '#ffe1f6' }}>{t('sorteadas agora · só você vê', 'drawn now · only you see them')}</p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 14, perspective: 600 }}>
              {mao.map((g, i) => { const G = GOLPES[g]; if (!G) return null; return (
                <div key={i} className="vice-sorteio-c" style={{ animationDelay: `${0.4 + i * 1.1}s`, width: 108, minHeight: 150, background: '#fff', color: INK, border: `4px solid ${INK}`, borderRadius: 14, boxShadow: `4px 4px 0 ${INK}`, padding: '8px 6px' }}>
                  <div style={{ fontSize: 34, lineHeight: 1 }}>{G.emoji}</div>
                  <b style={{ ...OSW, display: 'block', fontSize: 14, marginTop: 4 }}>{t(G.nome[0], G.nome[1])}</b>
                  <span style={{ display: 'block', fontSize: 10.5, fontWeight: 700, color: '#444', marginTop: 3, lineHeight: 1.2 }}>{t(G.faz[0], G.faz[1])}</span>
                </div>) })}
            </div>
            <p style={{ margin: '12px 0 0', fontSize: 12.5, fontWeight: 800, color: '#fff' }}>{t(`🔨 o pregão começa em ${Math.max(0, Math.ceil(((v.sorteioAte ?? 0) - agora) / 1000))}s · toque pra fechar`, `🔨 the auction starts in ${Math.max(0, Math.ceil(((v.sorteioAte ?? 0) - agora) / 1000))}s · tap to close`)}</p>
          </div>
        </div>
      )}
    </>
  )
}

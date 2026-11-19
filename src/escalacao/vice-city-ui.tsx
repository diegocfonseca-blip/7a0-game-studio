// ─── 🌴 VICE CITY — a tela das cartas de golpe (19/11, mockup aprovado `scripts/mockups/vice-city-pregao.png`) ──────────
// Mora DENTRO do pregão aberto (`pregao-aberto.tsx`): a faixa do último golpe em cima da mesa e, embaixo, a sua mão. O motor é o
// `viceUsa` do store (o dono da sala decide); aqui só se desenha e se manda `VICE_USAR`. As regras usam as MESMAS funções do
// motor (`viceAlvoServe`, `viceTravaLance`) — nada de regra própria na tela (regra de ouro contra botão mudo).
import { useEffect, useState } from 'react'
import { useEsc, viceAlvoServe, viceTravaLance } from './store'
import { useT } from './lang'
import { agoraSala } from './relogio'
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
  if (v.lavagem[you.id] !== undefined) efeitos.push(t('💸 Lavagem: metade da próxima compra vai pra outro', '💸 Laundering: half of your next buy goes to someone else'))
  const meus: string[] = []
  if (v.colete[you.id]) meus.push(t('🛡️ Colete', '🛡️ Vest'))
  if (v.fuga[you.id]) meus.push(t('🚁 Fuga pronta', '🚁 Escape ready'))
  if (v.propina[you.id]) meus.push(t('💵 Propina: próxima carta pela metade', '💵 Bribe: next card half price'))
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
        <p style={{ margin: 0, fontSize: 11.5, fontWeight: 700, opacity: .8 }}>{(v.recebidas[you.id] ?? 0) < 2 ? t('Sem carta agora. A próxima chega no meio do pregão.', 'No card right now. The next one arrives halfway through.') : t('Você já usou suas cartas.', 'You have used your cards.')}</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: 8 }}>
          {mao.map((g, i) => {
            const G = GOLPES[g]
            if (!G) return null
            return (
              <button key={`${g}-${i}`} onClick={() => G.alvo ? setEscolhendo(escolhendo === g ? null : g) : usar(g)}
                style={{ background: '#fff', color: INK, border: `3px solid ${G.alvo ? '#C2452F' : '#1B7A3D'}`, borderRadius: 12, boxShadow: `3px 3px 0 ${G.alvo ? '#C2452F' : '#1B7A3D'}`, padding: '8px 6px', textAlign: 'center', cursor: 'pointer', outline: escolhendo === g ? `3px solid ${NEON}` : 'none' }}>
                <span style={{ fontSize: 26, display: 'block', lineHeight: 1 }}>{G.emoji}</span>
                <b style={{ ...OSW, display: 'block', fontSize: 13, marginTop: 3 }}>{t(G.nome[0], G.nome[1])}</b>
                <span style={{ display: 'block', fontSize: 10, fontWeight: 700, color: '#444', marginTop: 2, lineHeight: 1.25 }}>{t(G.faz[0], G.faz[1])}</span>
                <span style={{ ...OSW, display: 'inline-block', marginTop: 5, fontSize: 11, background: G.alvo ? '#C2452F' : '#1B7A3D', color: '#fff', borderRadius: 7, padding: '2px 8px' }}>{G.alvo ? t('Escolher rival', 'Pick a rival') : t('Usar', 'Use')}</span>
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
      <p style={{ margin: 0, fontSize: 10.5, fontWeight: 700, opacity: .75, lineHeight: 1.35 }}>{t(`Todo golpe aparece pra sala. Quem leva golpe ganha ⭐ escondida; o 1º a chegar em ${VICE_BUSTED_EM} leva BUSTED e perde os 3 melhores.`, `Every hit is shown to the room. Whoever is hit gets a hidden ⭐; the first to reach ${VICE_BUSTED_EM} is BUSTED and loses their 3 best.`)}</p>
    </div>
  )
}

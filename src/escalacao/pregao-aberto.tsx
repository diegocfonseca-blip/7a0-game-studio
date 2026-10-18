// 🔨 PREGÃO ABERTO — a tela (16/10, mockup aprovado: `scripts/mockups/pregao-aberto.png`).
// Uma carta por vez, lance à vista, ordem embaralhada, martelo em 6s. O motor mora em store.tsx (paTick/paMartelo);
// aqui só se desenha e se roteia o lance. No solo o relógio é deste aparelho; no online (quando for ligado) só o dono tica.
import { useEffect, useRef, useState } from 'react'
import { useEsc, paPodeLancar, paMinimo, PA_TICK_MS, PA_MARTELO_MS } from './store'
import { Shell, AuctionBar, CollectibleCard } from './screens'
import { useT } from './lang'
import { playTick, playHammer } from './sound'
import { FORMATIONS, type Sector } from './types'
import { openSlots } from './store'

const GOLD = '#FFC400', INK = '#0C0C0C', GREEN = '#1B7A3D'
const OSW = { fontFamily: 'Oswald, sans-serif' } as const
const POS_PT: Record<Sector, [string, string]> = { GOL: ['goleiro', 'goalkeeper'], LAT: ['lateral', 'full-back'], ZAG: ['zagueiro', 'centre-back'], MEI: ['meia', 'midfielder'], ATA: ['atacante', 'forward'] }

export function PregaoAberto() {
  const { state, dispatch } = useEsc()
  const t = useT()
  const you = state.managers[state.youIdx]
  const pa = state.pa
  const card = state.currentCards[0]
  const online = state.onlineMode === 'online'
  const euTico = !online || state.isHost
  const [agora, setAgora] = useState(Date.now())
  const [outro, setOutro] = useState('')

  // ⏱️ o relógio: 1 tick por segundo (martelo + lance dos robôs) — só quem manda no relógio
  useEffect(() => {
    if (!pa || !euTico) return
    const iv = setInterval(() => dispatch({ type: 'PREGAO_ABERTO_TICK' }), PA_TICK_MS)
    return () => clearInterval(iv)
  }, [!!pa, euTico]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { const iv = setInterval(() => setAgora(Date.now()), 250); return () => clearInterval(iv) }, [])

  // 🔊 tique a cada lance novo, martelo a cada venda
  const nLances = pa?.lances.length ?? 0
  const lastRef = useRef(0)
  useEffect(() => { if (nLances > 0 && nLances !== lastRef.current) playTick(); lastRef.current = nLances }, [nLances])
  const nVend = pa?.vendidos.length ?? 0
  const vendRef = useRef(nVend)
  useEffect(() => { if (nVend > vendRef.current) playHammer(); vendRef.current = nVend }, [nVend])

  if (!pa || !you) return <Shell bar={<AuctionBar />}><div className="pt-10 text-center text-5xl">🔨</div></Shell>
  const lider = pa.lider !== null ? state.managers.find(m => m.id === pa.lider) : null
  const seg = pa.deadline ? Math.min(PA_MARTELO_MS / 1000, Math.max(0, Math.ceil((pa.deadline - agora) / 1000))) : 0 // nunca mostra 7s por um tique atrasado
  const minimo = paMinimo(state)
  const posVagas = card ? openSlots(you, card.pos) : 0
  const pode = (v: number) => !!card && paPodeLancar(state, you.id, v, state.youUid)
  const lance = (v: number) => { if (pode(v)) dispatch({ type: 'PREGAO_ABERTO_LANCE', mgrId: you.id, valor: v, by: state.youUid }) }
  const ultimo = pa.vendidos[0]
  const form = FORMATIONS[you.formation ?? '4-3-3']
  const total = pa.fila.length
  const n = Math.min(total, pa.idx + 1)
  const posNome = card ? t(POS_PT[card.pos][0], POS_PT[card.pos][1]) : ''
  const contagem = seg <= 1 ? t('TRÊS… VENDIDO!', 'THREE… SOLD!') : seg <= 2 ? t('DUAS…', 'TWICE…') : seg <= 3 ? t('UMA…', 'ONCE…') : ''

  return (
    <Shell bar={<AuctionBar vagas={posVagas > 0 ? posVagas : undefined} />}>
      <div className="space-y-3">
        {/* 🏷️ o nome do modo em cima: quem entrou na sala descobre AQUI em que pregão está */}
        <div style={{ background: INK, color: '#fff', border: `3px solid ${INK}`, borderRadius: 13, padding: '8px 11px', display: 'flex', alignItems: 'center', gap: 9, boxShadow: `4px 4px 0 0 ${INK}` }}>
          <span style={{ fontSize: 24 }}>🔨</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ ...OSW, fontWeight: 900, fontSize: 15, margin: 0, textTransform: 'uppercase' }}>{t('Pregão aberto', 'Open outcry')}</p>
            <p style={{ fontSize: 10, fontWeight: 700, opacity: .75, margin: '2px 0 0' }}>{t(`carta ${n} de ${total} · ordem embaralhada: ninguém sabe a próxima`, `card ${n} of ${total} · shuffled order: nobody knows the next one`)}</p>
          </div>
          <div style={{ background: GOLD, color: INK, border: '2px solid #fff', borderRadius: 10, padding: '4px 9px', textAlign: 'center' }}>
            <b style={{ ...OSW, display: 'block', fontSize: 15, lineHeight: 1 }}>{Math.floor(you.money)} 🪙</b>
            <span style={{ fontSize: 7, fontWeight: 900, letterSpacing: 1 }}>{t('SEU CAIXA', 'YOUR CASH')}</span>
          </div>
        </div>

        {card ? (
          <>
            {/* 🃏 a carta da mesa — a MESMA carta do jogo */}
            {/* tamanho de VITRINE (não `big`): no celular a carta grande empurrava o preço e os botões pra fora da tela,
                e com martelo de 6s o lance tem que estar à mão sem rolar */}
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div style={{ width: 210 }}>
                <CollectibleCard name={card.name} club={card.club} year={card.year} pos={card.pos} fame={card.fame} folk={!!card.folk} promessa={card.promessa} />
              </div>
            </div>
            <p style={{ margin: 0, textAlign: 'center', fontSize: 11, fontWeight: 700, color: 'rgba(0,0,0,.55)' }}>
              {t('próxima carta', 'next card')}: <b style={{ display: 'inline-block', width: 20, border: `2px solid ${INK}`, borderRadius: 6, background: '#F4ECD6', textAlign: 'center' }}>?</b> · {t('posição', 'position')}: <b style={{ display: 'inline-block', width: 20, border: `2px solid ${INK}`, borderRadius: 6, background: '#F4ECD6', textAlign: 'center' }}>?</b>
            </p>

            {/* 💰 o lance atual + o relógio do martelo (GRUDADO: a lista cresce e o preço não pode sumir) */}
            <div style={{ position: 'sticky', top: 6, zIndex: 5, display: 'flex', alignItems: 'center', gap: 12, border: `3px solid ${INK}`, borderRadius: 14, padding: '8px 12px', boxShadow: `4px 4px 0 0 ${INK}`, background: seg <= 2 && pa.lider !== null ? '#E8503A' : `linear-gradient(150deg,#FFE79A,${GOLD} 55%,#E8A200)`, color: seg <= 2 && pa.lider !== null ? '#fff' : INK }}>
              <b style={{ ...OSW, fontWeight: 900, fontSize: 34, lineHeight: 1 }}>{pa.lider !== null ? `${pa.preco} 🪙` : '—'}</b>
              <div style={{ flex: 1, minWidth: 0 }}>
                <small style={{ display: 'block', fontSize: 9, fontWeight: 900, letterSpacing: 1, opacity: .75 }}>{pa.lider !== null ? t('LANCE ATUAL', 'CURRENT BID') : t('NINGUÉM DEU LANCE', 'NO BIDS YET')}</small>
                <span style={{ ...OSW, fontWeight: 900, fontSize: 16, textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>{lider ? `${lider.teamName}${lider.id === you.id ? ` · ${t('VOCÊ', 'YOU')}` : ''}` : t(`abre com ${minimo} 🪙`, `opens at ${minimo} 🪙`)}</span>
              </div>
              <div style={{ textAlign: 'center', background: '#fff', color: INK, border: `2px solid ${INK}`, borderRadius: 10, padding: '4px 10px', minWidth: 62 }}>
                <b style={{ ...OSW, fontWeight: 900, fontSize: 22, lineHeight: 1 }}>⏱ {seg}s</b>
                {contagem && <span style={{ display: 'block', fontSize: 8, fontWeight: 900, letterSpacing: .5 }}>{contagem}</span>}
              </div>
            </div>

            {/* 📜 os últimos lances */}
            {pa.lances.length > 0 && (
              <div style={{ background: '#fff', border: `3px solid ${INK}`, borderRadius: 13, overflow: 'hidden' }}>
                {[...pa.lances].reverse().slice(0, 4).map((l, i) => {
                  const m = state.managers.find(x => x.id === l.mgr)
                  return (
                    <div key={`${l.mgr}-${l.valor}-${i}`} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderTop: i ? '1.5px solid rgba(0,0,0,.08)' : 'none', background: i === 0 ? '#E9F5EC' : '#fff', fontWeight: 700, fontSize: 12 }}>
                      <span style={{ ...OSW, fontWeight: 700, textTransform: 'uppercase', border: `2px solid ${INK}`, borderRadius: 8, padding: '2px 8px', background: m?.id === you.id ? GOLD : '#F4ECD6' }}>{m?.teamName ?? '?'}</span>
                      <b style={{ ...OSW, marginLeft: 'auto', fontSize: 16 }}>{l.valor} 🪙</b>
                    </div>
                  )
                })}
              </div>
            )}

            {/* 🫵 seus botões — ou a trava explicada */}
            {posVagas <= 0 ? (
              <div style={{ background: '#CBBF9E', border: `3px solid ${INK}`, borderRadius: 11, padding: 10, textAlign: 'center', ...OSW, fontWeight: 900, fontSize: 13, textTransform: 'uppercase', color: 'rgba(0,0,0,.6)' }}>
                🔒 {t(`Você já tem ${posNome} — nesta carta só assiste.`, `You already have a ${posNome} — just watching this one.`)}
              </div>
            ) : pa.lider === you.id ? (
              <div style={{ background: '#E9F5EC', border: `3px solid ${INK}`, borderRadius: 11, padding: 10, textAlign: 'center', ...OSW, fontWeight: 900, fontSize: 13, textTransform: 'uppercase' }}>
                ✋ {t('Você está na frente. Se ninguém cobrir em 6s, é seu.', 'You lead. Nobody tops it in 6s and it’s yours.')}
              </div>
            ) : Math.floor(you.money) < minimo ? (
              <div style={{ background: '#CBBF9E', border: `3px solid ${INK}`, borderRadius: 11, padding: 10, textAlign: 'center', ...OSW, fontWeight: 900, fontSize: 13, textTransform: 'uppercase', color: 'rgba(0,0,0,.6)' }}>
                🔒 {t(`Seu caixa não cobre ${minimo} 🪙.`, `Your cash doesn’t cover ${minimo} 🪙.`)}
              </div>
            ) : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1.35fr', gap: 6 }}>
                  {[0, 1, 4].map(extra => {
                    const v = minimo + extra
                    const ok = pode(v)
                    return <button key={extra} disabled={!ok} onClick={() => lance(v)} style={{ ...OSW, fontWeight: 900, fontSize: 14, border: `3px solid ${INK}`, borderRadius: 11, padding: '10px 4px', background: ok ? GOLD : '#CBBF9E', boxShadow: ok ? `3px 3px 0 0 ${INK}` : 'none', cursor: ok ? 'pointer' : 'default', color: ok ? INK : 'rgba(0,0,0,.45)' }}>{pa.lider === null ? '' : `+${extra + 1} → `}{v}</button>
                  })}
                  <div style={{ display: 'flex', border: `3px solid ${INK}`, borderRadius: 11, background: '#fff', overflow: 'hidden' }}>
                    <input inputMode="numeric" value={outro} onChange={e => setOutro(e.target.value.replace(/\D/g, ''))} placeholder={t('outro', 'other')} style={{ width: '100%', minWidth: 0, border: 'none', padding: '0 6px', ...OSW, fontWeight: 900, fontSize: 14, textAlign: 'center' }} />
                    <button disabled={!pode(Number(outro))} onClick={() => { lance(Number(outro)); setOutro('') }} style={{ border: 'none', borderLeft: `3px solid ${INK}`, background: pode(Number(outro)) ? GREEN : '#CBBF9E', color: '#fff', fontWeight: 900, padding: '0 8px', cursor: 'pointer' }}>OK</button>
                  </div>
                </div>
                <p style={{ margin: 0, textAlign: 'center', fontSize: 10.5, fontWeight: 700, color: 'rgba(0,0,0,.6)' }}>{t('Cada lance novo zera o relógio. 6s sem lance = uma, duas, três… vendido!', 'Every new bid resets the clock. 6s without a bid = going once, twice… sold!')}</p>
              </>
            )}
          </>
        ) : (
          <div className="pt-6 text-center text-4xl">🔨</div>
        )}

        {/* 📣 o último martelo (zoeira curta — nada de teatro duplicado) */}
        {ultimo && (
          <div style={{ background: ultimo.mgr === you.id ? GREEN : '#7C3AED', color: '#fff', border: `3px solid ${INK}`, borderRadius: 12, padding: '8px 10px', fontSize: 12, fontWeight: 700 }}>
            {ultimo.mgr === null
              ? t(`🙈 Ninguém quis ${ultimo.nome}. Foi pro Monte.`, `🙈 Nobody wanted ${ultimo.nome}. Off to the pile.`)
              : ultimo.mgr === you.id
                ? t(`🔨 VENDIDO! ${ultimo.nome} é seu por ${ultimo.preco} 🪙.`, `🔨 SOLD! ${ultimo.nome} is yours for ${ultimo.preco} 🪙.`)
                : ultimo.segundo > 0 && ultimo.preco - ultimo.segundo <= 2 && pa.vendidos[0] && state.managers.find(m => m.id === you.id)
                  ? t(`💸 ${ultimo.time} levou ${ultimo.nome} por ${ultimo.preco}. Faltou ${ultimo.preco - ultimo.segundo} — QUASE!`, `💸 ${ultimo.time} took ${ultimo.nome} for ${ultimo.preco}. Short by ${ultimo.preco - ultimo.segundo} — SO CLOSE!`)
                  : t(`💸 ${ultimo.time} levou ${ultimo.nome} por ${ultimo.preco} 🪙.`, `💸 ${ultimo.time} took ${ultimo.nome} for ${ultimo.preco} 🪙.`)}
          </div>
        )}

        {/* 🟩 o campinho: o que já fechou e o que falta — a tela toda cabe num celular */}
        <div style={{ border: `3px solid ${INK}`, borderRadius: 13, overflow: 'hidden', boxShadow: `4px 4px 0 0 ${INK}` }}>
          <div style={{ background: INK, color: '#fff', height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ ...OSW, fontWeight: 900, fontSize: 11, textTransform: 'uppercase' }}>{you.teamName} · {you.formation}</span>
          </div>
          <div style={{ background: `repeating-linear-gradient(180deg, ${GREEN} 0 26px, #166332 26px 52px)`, padding: '8px 8px', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {(['ATA', 'MEI', 'DEF', 'GOL'] as const).map(row => {
              const secs: Sector[] = row === 'DEF' ? ['LAT', 'ZAG'] : [row]
              let slots: { s: Sector; ok: boolean }[] = []
              for (const s of secs) { const tem = you.squad.filter(c => c.pos === s).length; for (let i = 0; i < form[s]; i++) slots.push({ s, ok: i < tem }) }
              if (row === 'DEF' && form.LAT === 2) { const lat = slots.filter(x => x.s === 'LAT'), zag = slots.filter(x => x.s === 'ZAG'); slots = [lat[0], ...zag, lat[1]] }
              return (
                <div key={row} style={{ display: 'flex', justifyContent: 'center', gap: 6 }}>
                  {slots.map((sl, i) => <div key={i} style={{ width: 40, height: 26, borderRadius: 8, display: 'grid', placeItems: 'center', ...OSW, fontWeight: 900, fontSize: sl.ok ? 14 : 10, ...(sl.ok ? { background: GOLD, color: INK, border: `2px solid ${INK}` } : { border: '2px dashed rgba(255,255,255,.7)', color: '#fff' }) }}>{sl.ok ? '✓' : sl.s}</div>)}
                </div>
              )
            })}
          </div>
        </div>
        <p style={{ margin: 0, textAlign: 'center', fontSize: 10.5, fontWeight: 700, color: 'rgba(0,0,0,.55)' }}>{t('Quem já fechou a posição não dá lance. Quem ficar sem peça pega no 🃏 Monte, como sempre.', 'Position full? No more bids there. Whoever is left short picks from the 🃏 pile, as always.')}</p>
      </div>
    </Shell>
  )
}

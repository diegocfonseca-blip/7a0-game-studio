// 🔨 PREGÃO ABERTO — a tela (16/10, mockup aprovado: `scripts/mockups/pregao-aberto.png`).
// Uma carta por vez, lance à vista, ordem embaralhada, martelo em `PA_MARTELO_MS`. O motor mora em store.tsx (paTick/paMartelo);
// aqui só se desenha e se roteia o lance. No solo o relógio é deste aparelho; no online (quando for ligado) só o dono tica.
import { useEffect, useRef, useState } from 'react'
import { useEsc, paPodeLancar, paMinimo, paMesa, paMesasAtivas, PA_TICK_MS, PA_MARTELO_MS } from './store'
import { Shell, AuctionBar, CollectibleCard, YourPitch, nomePacote } from './screens'
import { SeloClube } from './selo-clube'
import { useT } from './lang'
import { playTick, playHammer } from './sound'
import type { Sector, Card } from './types'
import { openSlots } from './store'
import { agoraSala } from './relogio'

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
  // ⏱️ o relógio da SALA (o do dono): no online o prazo do martelo nasce no aparelho dele, e celular adiantado/atrasado
  // mostraria a contagem errada. No solo `agoraSala()` é o próprio Date.now().
  const [agora, setAgora] = useState(agoraSala())

  // ⏱️ o relógio: 1 tick por segundo (martelo + lance dos robôs) — só quem manda no relógio
  useEffect(() => {
    if (!pa || !euTico) return
    const iv = setInterval(() => dispatch({ type: 'PREGAO_ABERTO_TICK' }), PA_TICK_MS)
    return () => clearInterval(iv)
  }, [!!pa, euTico]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { const iv = setInterval(() => setAgora(agoraSala()), 250); return () => clearInterval(iv) }, [])

  // 🔊 tique a cada lance novo, martelo a cada venda
  const nLances = (pa?.lances.length ?? 0) + (pa?.m2?.lances.length ?? 0) // 🔨🔨 as duas mesas fazem barulho
  const lastRef = useRef(0)
  useEffect(() => { if (nLances > 0 && nLances !== lastRef.current) playTick(); lastRef.current = nLances }, [nLances])
  const nVend = pa?.vendidos.length ?? 0
  const vendRef = useRef(nVend)
  useEffect(() => { if (nVend > vendRef.current) playHammer(); vendRef.current = nVend }, [nVend])

  if (!pa || !you) return <Shell bar={<AuctionBar />}><div className="pt-10 text-center text-5xl">🔨</div></Shell>
  const posVagas = card ? openSlots(you, card.pos) : 0
  const ultimo = pa.vendidos[0]
  const total = pa.fila.length
  const n = Math.min(total, pa.idx + 1)
  const mesas = paMesasAtivas(state)

  return (
    <Shell bar={<AuctionBar vagas={posVagas > 0 ? posVagas : undefined} />}>
      <style>{CSS_VIRA}</style>
      <div className="space-y-3">
        {/* 🏷️ o nome do modo em cima: quem entrou na sala descobre AQUI em que pregão está */}
        <div style={{ background: INK, color: '#fff', border: `3px solid ${INK}`, borderRadius: 13, padding: '8px 11px', display: 'flex', alignItems: 'center', gap: 9, boxShadow: `4px 4px 0 0 ${INK}` }}>
          <span style={{ fontSize: 24 }}>🔨</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ ...OSW, fontWeight: 900, fontSize: 15, margin: 0, textTransform: 'uppercase' }}>{t('Pregão aberto', 'Open outcry')}</p>
            <p style={{ fontSize: 10, fontWeight: 700, opacity: .75, margin: '2px 0 0' }}>{state.leilaoClubes
              ? (pa.duplo ? t(`pacote ${n} de ${total} · DOIS na mesa, setores diferentes`, `pack ${n} of ${total} · TWO on the table, different sectors`) : t(`pacote ${n} de ${total} · ordem embaralhada: ninguém sabe o próximo`, `pack ${n} of ${total} · shuffled order: nobody knows the next one`))
              : pa.duplo ? t(`carta ${n} de ${total} · DUAS na mesa, posições diferentes`, `card ${n} of ${total} · TWO on the table, different positions`) : t(`carta ${n} de ${total} · ordem embaralhada: ninguém sabe a próxima`, `card ${n} of ${total} · shuffled order: nobody knows the next one`)}</p>
            {/* 🎁 sem Monte (16/10): quem entra já sabe que não fica com time furado — e que o presente nunca é craque nem lenda */}
            <p style={{ display: 'inline-block', margin: '5px 0 0', background: GREEN, border: '2px solid #fff', borderRadius: 7, padding: '2px 7px', fontSize: 10, fontWeight: 800 }}>{state.leilaoClubes
              ? t('🎁 Sem Monte: setor sem pacote no fim ganha um pacote que sobrou, de graça', '🎁 No pile: a sector without a pack at the end gets a leftover pack for free')
              : t('🎁 Sem Monte: vaga vazia no fim ganha jogador de graça (nunca craque nem lenda)', '🎁 No pile: empty slots at the end get a free player (never a star or a legend)')}</p>
          </div>
          <div style={{ background: GOLD, color: INK, border: '2px solid #fff', borderRadius: 10, padding: '4px 9px', textAlign: 'center' }}>
            <b style={{ ...OSW, display: 'block', fontSize: 15, lineHeight: 1 }}>{Math.floor(you.money)} 🪙</b>
            <span style={{ fontSize: 7, fontWeight: 900, letterSpacing: 1 }}>{t('SEU CAIXA', 'YOUR CASH')}</span>
          </div>
        </div>

        {/* 🔨🔨 uma mesa (até 10 clubes) ou duas lado a lado (11+, Diego 17/10) — a MESMA mesa desenhada 1 ou 2 vezes */}
        {mesas.length === 1
          ? <MesaPregao k={0} agora={agora} />
          : <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, alignItems: 'start' }}>
                {mesas.map(k => <MesaPregao key={k} k={k} agora={agora} compacto />)}
              </div>
              <p style={{ margin: 0, textAlign: 'center', fontSize: 10.5, fontWeight: 700, color: 'rgba(0,0,0,.6)' }}>{state.leilaoClubes
                ? t(`Cada pacote tem o próprio relógio de ${PA_MARTELO_MS / 1000}s. Dá pra brigar pelos dois — ou só pelo que você precisa.`, `Each pack has its own ${PA_MARTELO_MS / 1000}s clock. Fight for both — or just the one you need.`)
                : t(`Cada carta tem o próprio relógio de ${PA_MARTELO_MS / 1000}s. Dá pra brigar pelas duas — ou só pela que você precisa.`, `Each card has its own ${PA_MARTELO_MS / 1000}s clock. Fight for both — or just the one you need.`)}</p>
            </>}

        {/* 📣 o último martelo (zoeira curta — nada de teatro duplicado) */}
        {ultimo && (
          <div style={{ background: ultimo.mgr === you.id ? GREEN : '#7C3AED', color: '#fff', border: `3px solid ${INK}`, borderRadius: 12, padding: '8px 10px', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ flex: 1 }}>
            {ultimo.mgr === null
              ? t(`🙈 Ninguém quis ${ultimo.nome}. Fica na sobra e pode cair de graça em quem terminar com vaga vazia.`, `🙈 Nobody wanted ${ultimo.nome}. It stays in the leftovers and may go free to whoever ends with an empty slot.`)
              : ultimo.mgr === you.id
                ? t(`🔨 VENDIDO! ${ultimo.nome} é seu por ${ultimo.preco} 🪙.`, `🔨 SOLD! ${ultimo.nome} is yours for ${ultimo.preco} 🪙.`)
                : ultimo.segundo > 0 && ultimo.preco - ultimo.segundo <= 2 && pa.vendidos[0] && state.managers.find(m => m.id === you.id)
                  ? t(`💸 ${ultimo.time} levou ${ultimo.nome} por ${ultimo.preco}. Faltou ${ultimo.preco - ultimo.segundo} — QUASE!`, `💸 ${ultimo.time} took ${ultimo.nome} for ${ultimo.preco}. Short by ${ultimo.preco - ultimo.segundo} — SO CLOSE!`)
                  : t(`💸 ${ultimo.time} levou ${ultimo.nome} por ${ultimo.preco} 🪙.`, `💸 ${ultimo.time} took ${ultimo.nome} for ${ultimo.preco} 🪙.`)}
            </span>
          </div>
        )}

        {/* 🟩 o campinho PADRÃO do leilão (17/10, Diego: "deve ser os campinhos padrões igual os outros modos… quando
            aparece uma lenda aparece o avatar da lenda") — o MESMO `YourPitch` do envelope e da Tocaia, com rosto e manto */}
        <p style={{ margin: '4px 0 0', textAlign: 'center', ...OSW, fontWeight: 900, fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase', color: 'rgba(0,0,0,.45)' }}>{t('Sua escalação', 'Your lineup')}</p>
        <YourPitch small />
        <p style={{ margin: 0, textAlign: 'center', fontSize: 10.5, fontWeight: 700, color: 'rgba(0,0,0,.55)' }}>{state.leilaoClubes
          ? t('Um pacote por setor: quem já tem o do setor não dá lance. Depois do pregão vem a convocação.', 'One pack per sector: if you have that sector’s pack, no more bids there. The call-up comes after the auction.')
          : t('Quem já fechou a posição não dá lance. Vaga vazia no fim ganha jogador de graça.', 'Position full? No more bids there. Empty spots at the end get a free player.')}</p>
      </div>
    </Shell>
  )
}


// 🔨🔨 UMA MESA do pregão aberto (17/10): a carta, o lance atual com o relógio, os últimos lances e os seus botões. Com uma
// mesa só ela é a tela de sempre; com duas (`compacto`) cada uma ocupa meia largura e mostra só o essencial.
function MesaPregao({ k, agora, compacto = false }: { k: number; agora: number; compacto?: boolean }) {
  const { state, dispatch } = useEsc()
  const t = useT()
  const [outro, setOutro] = useState('')
  const you = state.managers[state.youIdx]
  const online = state.onlineMode === 'online'
  // 🌐 LANCE QUE NÃO VALEU NUNCA SOME CALADO (17/10): no online o lance viaja até o dono. Se outro cobriu antes de ele
  // chegar (ou a carta já trocou), a pessoa vê o porquê — foi a lição da Tocaia (sala do Fridão, 23/09).
  const [meuLance, setMeuLance] = useState<{ cardId: string; valor: number; em: number } | null>(null)
  const [aviso, setAviso] = useState('')
  const mvEu = paMesa(state, k)
  useEffect(() => {
    if (!meuLance || !you || !mvEu) return
    const c = mvEu.card, M0 = mvEu.M
    if (c?.id === meuLance.cardId && M0.lider === you.id) { setMeuLance(null); return }
    const coberto = c?.id !== meuLance.cardId || (M0.lider !== null && M0.lider !== you.id && M0.preco >= meuLance.valor)
    if (coberto) {
      setMeuLance(null)
      setAviso(c?.id !== meuLance.cardId
        ? t('⚠️ O martelo bateu antes do seu lance chegar.', '⚠️ The hammer fell before your bid arrived.')
        : t(`⚠️ Alguém cobriu antes do seu lance chegar — o mínimo agora é ${paMinimo(state, k)}.`, `⚠️ Someone topped it before your bid arrived — the minimum is now ${paMinimo(state, k)}.`))
    }
  }, [mvEu?.card?.id, mvEu?.M.lider, mvEu?.M.preco, meuLance]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!meuLance) return
    const tm = setTimeout(() => { setMeuLance(null); setAviso(t('⚠️ Seu lance não chegou no dono da sala (internet). Tenta de novo.', '⚠️ Your bid didn’t reach the room owner (connection). Try again.')) }, 5000)
    return () => clearTimeout(tm)
  }, [meuLance]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (!aviso) return; const tm = setTimeout(() => setAviso(''), 3500); return () => clearTimeout(tm) }, [aviso])
  const mv = paMesa(state, k)
  const pa = state.pa
  if (!mv || !pa || !you) return null
  const M = mv.M, card = mv.card
  const lider = M.lider !== null ? state.managers.find(m => m.id === M.lider) : null
  const seg = M.deadline ? Math.min(PA_MARTELO_MS / 1000, Math.max(0, Math.ceil((M.deadline - agora) / 1000))) : 0 // nunca mostra 7s por um tique atrasado
  const minimo = paMinimo(state, k)
  const posVagas = card ? openSlots(you, card.pos) : 0
  const pode = (v: number) => !!card && paPodeLancar(state, you.id, v, state.youUid, k)
  const lance = (v: number) => {
    if (!card || !pode(v)) return
    dispatch({ type: 'PREGAO_ABERTO_LANCE', mgrId: you.id, valor: v, by: state.youUid, mesa: k, cardId: card.id })
    if (online) setMeuLance({ cardId: card.id, valor: v, em: Date.now() })
  }
  // 🃏 a carta que acabou de sair DESTA mesa vira no mesmo lugar (rosto, cor, estrelas, selo) por `PA_VIRA_MS`
  const virada = M.viraAte && agora < M.viraAte && M.viraId ? pa.fila.find(x => x.id === M.viraId) ?? null : null
  const posNome = card ? t(POS_PT[card.pos][0], POS_PT[card.pos][1]) : ''
  const contagem = seg <= 1 ? t('TRÊS… VENDIDO!', 'THREE… SOLD!') : seg <= 2 ? t('DUAS…', 'TWICE…') : seg <= 3 ? t('UMA…', 'ONCE…') : ''
  return <div style={{ display: 'flex', flexDirection: 'column', gap: compacto ? 7 : 12, minWidth: 0 }}>{card ? (
          <>
            {/* 🃏 a carta da mesa — a MESMA carta do jogo */}
            {/* tamanho de VITRINE (não `big`): no celular a carta grande empurrava o preço e os botões pra fora da tela,
                e com martelo de poucos segundos o lance tem que estar à mão sem rolar */}
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div style={{ width: compacto ? '100%' : 210 }}>
                {card.pacote
                  ? <PacoteMesa c={virada?.pacote ? virada : card} compacto={compacto} />
                  : virada
                  ? <div key={virada.id} className="pa-vira"><CollectibleCard name={virada.name} club={virada.club} year={virada.year} pos={virada.pos} fame={virada.fame} folk={!!virada.folk} promessa={virada.promessa} /></div>
                  : <CartaCoberta name={card.name} club={card.club} year={card.year} pos={card.pos} />}
              </div>
            </div>
            {!compacto && <p style={{ margin: 0, textAlign: 'center', fontSize: 11, fontWeight: 700, color: 'rgba(0,0,0,.55)' }}>
              {card.pacote ? t('próximo clube', 'next club') : t('próxima carta', 'next card')}: <b style={{ display: 'inline-block', width: 20, border: `2px solid ${INK}`, borderRadius: 6, background: '#F4ECD6', textAlign: 'center' }}>?</b> · {t('posição', 'position')}: <b style={{ display: 'inline-block', width: 20, border: `2px solid ${INK}`, borderRadius: 6, background: '#F4ECD6', textAlign: 'center' }}>?</b>
            </p>}

            {/* 💰 o lance atual + o relógio do martelo (GRUDADO: a lista cresce e o preço não pode sumir) */}
            <div style={{ position: 'sticky', top: 6, zIndex: 5, display: 'flex', alignItems: 'center', gap: compacto ? 6 : 12, flexWrap: compacto ? 'wrap' : undefined, border: `3px solid ${INK}`, borderRadius: 14, padding: compacto ? '6px 8px' : '8px 12px', boxShadow: `4px 4px 0 0 ${INK}`, background: seg <= 2 && M.lider !== null ? '#E8503A' : `linear-gradient(150deg,#FFE79A,${GOLD} 55%,#E8A200)`, color: seg <= 2 && M.lider !== null ? '#fff' : INK }}>
              <b style={{ ...OSW, fontWeight: 900, fontSize: compacto ? 22 : 34, lineHeight: 1 }}>{M.lider !== null ? `${M.preco} 🪙` : '—'}</b>
              <div style={{ flex: 1, minWidth: 0 }}>
                <small style={{ display: 'block', fontSize: 9, fontWeight: 900, letterSpacing: 1, opacity: .75 }}>{M.lider !== null ? t('LANCE ATUAL', 'CURRENT BID') : t('NINGUÉM DEU LANCE', 'NO BIDS YET')}</small>
                <span style={{ ...OSW, fontWeight: 900, fontSize: compacto ? 11.5 : 16, textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>{lider ? `${lider.teamName}${lider.id === you.id ? ` · ${t('VOCÊ', 'YOU')}` : ''}` : t('lance livre: dá quanto quiser', 'open bid: offer what you want')}</span>
              </div>
              <div style={{ textAlign: 'center', background: '#fff', color: INK, border: `2px solid ${INK}`, borderRadius: 10, padding: compacto ? '3px 6px' : '4px 10px', minWidth: compacto ? 44 : 62 }}>
                <b style={{ ...OSW, fontWeight: 900, fontSize: compacto ? 15 : 22, lineHeight: 1 }}>⏱ {seg}s</b>
                {contagem && <span style={{ display: 'block', fontSize: 8, fontWeight: 900, letterSpacing: .5 }}>{contagem}</span>}
              </div>
            </div>

            {/* 📜 os últimos lances */}
            {M.lances.length > 0 && (
              <div style={{ background: '#fff', border: `3px solid ${INK}`, borderRadius: 13, overflow: 'hidden' }}>
                {[...M.lances].reverse().slice(0, compacto ? 2 : 4).map((l, i) => {
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

            {aviso && <div role="alert" style={{ background: '#FFE3DD', border: `3px solid ${INK}`, borderRadius: 11, padding: compacto ? '5px 7px' : '7px 10px', fontSize: compacto ? 10.5 : 12, fontWeight: 800, textAlign: 'center' }}>{aviso}</div>}
            {/* 🫵 seus botões — ou a trava explicada */}
            {posVagas <= 0 ? (
              <div style={{ background: '#CBBF9E', border: `3px solid ${INK}`, borderRadius: 11, padding: compacto ? 7 : 10, textAlign: 'center', ...OSW, fontWeight: 900, fontSize: compacto ? 10.5 : 13, textTransform: 'uppercase', color: 'rgba(0,0,0,.6)' }}>
                🔒 {card.pacote
                  ? t(`Você já tem o seu pacote de ${posNome} — neste só assiste.`, `You already have your ${posNome} pack — just watching this one.`)
                  : t(`Você já tem ${posNome} — nesta carta só assiste.`, `You already have a ${posNome} — just watching this one.`)}
              </div>
            ) : M.lider === you.id ? (
              <div style={{ background: '#E9F5EC', border: `3px solid ${INK}`, borderRadius: 11, padding: compacto ? 7 : 10, textAlign: 'center', ...OSW, fontWeight: 900, fontSize: compacto ? 10.5 : 13, textTransform: 'uppercase' }}>
                ✋ {t(`Você está na frente. Se ninguém cobrir em ${PA_MARTELO_MS / 1000}s, é seu.`, `You lead. Nobody tops it in ${PA_MARTELO_MS / 1000}s and it’s yours.`)}
              </div>
            ) : Math.floor(you.money) < minimo ? (
              <div style={{ background: '#CBBF9E', border: `3px solid ${INK}`, borderRadius: 11, padding: compacto ? 7 : 10, textAlign: 'center', ...OSW, fontWeight: 900, fontSize: compacto ? 10.5 : 13, textTransform: 'uppercase', color: 'rgba(0,0,0,.6)' }}>
                🔒 {t(`Seu caixa não cobre ${minimo} 🪙.`, `Your cash doesn’t cover ${minimo} 🪙.`)}
              </div>
            ) : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: compacto ? '1fr 1fr' : '1fr 1fr 1fr 1.35fr', gap: compacto ? 5 : 6 }}>
                  {(compacto ? [0, 4] : [0, 1, 4]).map(extra => { // 🔨🔨 17/10 (Diego): na carta dupla os atalhos são +1 e +5, pra andar mais rápido
                    const v = minimo + extra
                    const ok = pode(v)
                    return <button key={extra} disabled={!ok} onClick={() => lance(v)} style={{ ...OSW, fontWeight: 900, fontSize: 14, border: `3px solid ${INK}`, borderRadius: 11, padding: '10px 4px', background: ok ? GOLD : '#CBBF9E', boxShadow: ok ? `3px 3px 0 0 ${INK}` : 'none', cursor: ok ? 'pointer' : 'default', color: ok ? INK : 'rgba(0,0,0,.45)' }}>{M.lider === null ? '' : `+${extra + 1} → `}{v}</button>
                  })}
                  <div style={{ display: 'flex', border: `3px solid ${INK}`, borderRadius: 11, background: '#fff', overflow: 'hidden', gridColumn: compacto ? '1 / -1' : undefined, minHeight: compacto ? 36 : undefined }}>
                    <input inputMode="numeric" value={outro} onChange={e => setOutro(e.target.value.replace(/\D/g, ''))} placeholder={t('outro', 'other')} style={{ width: '100%', minWidth: 0, border: 'none', padding: '0 6px', ...OSW, fontWeight: 900, fontSize: 14, textAlign: 'center' }} />
                    <button disabled={!pode(Number(outro))} onClick={() => { lance(Number(outro)); setOutro('') }} style={{ border: 'none', borderLeft: `3px solid ${INK}`, background: pode(Number(outro)) ? GREEN : '#CBBF9E', color: '#fff', fontWeight: 900, padding: '0 8px', cursor: 'pointer' }}>OK</button>
                  </div>
                </div>
                {!compacto && <p style={{ margin: 0, textAlign: 'center', fontSize: 10.5, fontWeight: 700, color: 'rgba(0,0,0,.6)' }}>{t(`Cada lance novo zera o relógio. ${PA_MARTELO_MS / 1000}s sem lance = uma, duas, três… vendido!`, `Every new bid resets the clock. ${PA_MARTELO_MS / 1000}s without a bid = going once, twice… sold!`)}</p>}
              </>
            )}
          </>
        ) : (
          <div className="pt-6 text-center text-4xl">🔨</div>
        )}</div>
}

// 🧱 PACOTE DE CLUBE NA MESA (17/10, Diego: "teria que aparecer o escudo dos times, quantos jogadores por posição e sem
// precisar se transformar em carta dourada… já que clubes não têm Lenda, Craque etc."). Nada fica coberto e nada vira: o
// lote já é o que é — escudo, "Goleiros do Palmeiras" e QUANTOS jogadores vêm. Os NOMES continuam escondidos até a
// convocação (regra dele de 27/09: "apenas quantidade que o time tem").
export function PacoteMesa({ c, compacto = false }: { c: Card; compacto?: boolean }) {
  const t = useT()
  const n = c.pacote?.cartas.length ?? 0
  return (
    <div style={{ border: `4px solid ${INK}`, borderRadius: 16, boxShadow: `5px 5px 0 0 ${INK}`, background: '#fff', padding: compacto ? '10px 8px' : '16px 14px', textAlign: 'center' }}>
      <span style={{ display: 'inline-block', background: INK, color: '#fff', borderRadius: 7, padding: '1px 8px', ...OSW, fontWeight: 900, fontSize: compacto ? 11 : 13 }}>{c.pos}</span>
      <div style={{ display: 'flex', justifyContent: 'center', margin: compacto ? '6px 0' : '10px 0' }}><SeloClube clube={c.pacote?.clube ?? c.club} size={compacto ? 58 : 96} /></div>
      <b style={{ ...OSW, fontWeight: 900, fontSize: compacto ? 15 : 22, display: 'block', lineHeight: 1.05, textTransform: 'uppercase' }}>{nomePacote(c)}</b>
      <span style={{ display: 'inline-block', marginTop: 6, background: '#F4ECD6', border: `2px solid ${INK}`, borderRadius: 9, padding: '2px 10px', ...OSW, fontWeight: 900, fontSize: compacto ? 12 : 15 }}>👥 {n} {n === 1 ? t('jogador', 'player') : t('jogadores', 'players')}</span>
      {!compacto && <p style={{ margin: '7px 0 0', fontSize: 10.5, fontWeight: 700, color: 'rgba(0,0,0,.55)' }}>{t('Quem são, você vê na convocação.', 'You see who they are at the call-up.')}</p>}
    </div>
  )
}

// 🃏 CARTA COBERTA (16/10, mockup aprovado `scripts/mockups/carta-coberta.png`): durante o lance a carta não mostra
// categoria, cor, estrela nem ROSTO — só nome, clube, ano e posição. Quem conhece futebol sabe; o jogo não entrega.
export function CartaCoberta({ name, club, year, pos }: { name: string; club: string; year: number; pos: string }) {
  const t = useT()
  return (
    <div style={{ position: 'relative', aspectRatio: '5 / 7', border: `4px solid ${INK}`, borderRadius: 16, boxShadow: `5px 5px 0 0 ${INK}`, overflow: 'hidden', background: 'repeating-linear-gradient(135deg,#E7DEC6 0 14px,#DED3B6 14px 28px)' }}>
      <span style={{ position: 'absolute', top: 10, left: 10, background: INK, color: '#fff', borderRadius: 7, padding: '1px 7px', ...OSW, fontWeight: 900, fontSize: 13 }}>{pos}</span>
      <span style={{ position: 'absolute', top: 10, right: 10, background: '#fff', border: `2px solid ${INK}`, borderRadius: 7, padding: '0 6px', ...OSW, fontWeight: 900, fontSize: 11 }}>{t('❓ categoria', '❓ tier')}</span>
      <div style={{ position: 'absolute', top: '22%', left: '50%', transform: 'translateX(-50%)', width: '46%', aspectRatio: '1', borderRadius: '50%', background: '#C9BD9C', border: '3px dashed #8a7d59', display: 'grid', placeItems: 'center', ...OSW, fontWeight: 900, fontSize: 44, color: '#8a7d59' }}>?</div>
      <div style={{ position: 'absolute', left: 12, right: 10, bottom: 12 }}>
        <b style={{ ...OSW, fontWeight: 900, fontSize: 20, display: 'block', lineHeight: 1.05 }}>{name}</b>
        <span style={{ fontSize: 11.5, fontWeight: 700, color: 'rgba(0,0,0,.65)' }}>{club} · {year}</span>
      </div>
    </div>
  )
}

const CSS_VIRA = `@keyframes paVira{0%{transform:perspective(500px) rotateY(90deg)}100%{transform:perspective(500px) rotateY(0)}}
.pa-vira{animation:paVira .6s ease-out both}
@keyframes paPres{from{transform:translateY(20px);opacity:0}to{transform:none;opacity:1}}
@keyframes paBarra{from{width:100%}to{width:0}}`

// 🎁 SEU TIME FECHOU DE GRAÇA (16/10): sem Monte no pregão aberto, a vaga vazia ganha jogador. Diego: *"no fim o cara precisa
// apertar botão?? quando tiver na sala online isso não pode atrapalhar"* → SEM BOTÃO: aparece por cima, some sozinho em 6s,
// toque fecha antes. Só pra quem ganhou carta, uma vez por partida.
export function PresentesPregao() {
  const { state } = useEsc()
  const t = useT()
  const you = state.managers[state.youIdx]
  const ids = you ? state.paPresentes?.[you.id] ?? [] : []
  const chave = ids.join('|')
  const [fechado, setFechado] = useState<string | null>(null)
  useEffect(() => {
    if (!chave) return
    const tm = setTimeout(() => setFechado(chave), 6000)
    return () => clearTimeout(tm)
  }, [chave])
  if (!chave || fechado === chave || !you) return null
  const cartas = you.squad.filter(c => ids.includes(c.id))
  if (!cartas.length) return null
  return (
    <div onClick={() => setFechado(chave)} style={{ position: 'fixed', inset: 0, zIndex: 9990, display: 'grid', placeItems: 'center', padding: 16, background: 'rgba(12,12,12,.35)' }}>
      <style>{CSS_VIRA}</style>
      <div style={{ width: '100%', maxWidth: 380, background: '#F4ECD6', border: `4px solid ${INK}`, borderRadius: 20, boxShadow: `5px 5px 0 0 ${INK}`, padding: 14, textAlign: 'center', animation: 'paPres .35s ease-out both' }}>
        <div style={{ height: 6, background: GREEN, borderRadius: 4, animation: 'paBarra 6s linear both', marginBottom: 8 }} />
        <div style={{ fontSize: 32 }}>🎁</div>
        <p style={{ ...OSW, fontWeight: 900, fontSize: 22, textTransform: 'uppercase', margin: 0, lineHeight: 1.05 }}>{t('Seu time fechou de graça!', 'Your squad got filled for free!')}</p>
        <p style={{ fontSize: 12.5, fontWeight: 600, margin: '5px 0 12px' }}>{cartas.some(c => c.pacote)
          ? t(`Você terminou com ${cartas.length} setor${cartas.length > 1 ? 'es' : ''} sem pacote. ${cartas.length > 1 ? 'Eles ganharam' : 'Ele ganhou'} um pacote que sobrou, de graça.`, `You ended with ${cartas.length} sector${cartas.length > 1 ? 's' : ''} without a pack. ${cartas.length > 1 ? 'They got' : 'It got'} a leftover pack for free.`)
          : t(`Você terminou com ${cartas.length} vaga${cartas.length > 1 ? 's' : ''} vazia${cartas.length > 1 ? 's' : ''}. ${cartas.length > 1 ? 'Elas ganharam' : 'Ela ganhou'} jogador de graça.`, `You ended with ${cartas.length} empty slot${cartas.length > 1 ? 's' : ''}. ${cartas.length > 1 ? 'They got' : 'It got'} a free player.`)}</p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
          {cartas.map(c => c.pacote ? (
            <div key={c.id} className="pa-vira" style={{ width: 150 }}><PacoteMesa c={c} compacto /></div>
          ) : (
            <div key={c.id} className="pa-vira" style={{ width: 92 }}>
              <CollectibleCard name={c.name} club={c.club} year={c.year} pos={c.pos} fame={c.fame} folk={!!c.folk} promessa={c.promessa} />
            </div>
          ))}
        </div>
        <p style={{ fontSize: 10.5, fontWeight: 600, opacity: .6, margin: '12px 0 0' }}>{t('some sozinho em 6s · toque pra fechar antes', 'closes by itself in 6s · tap to close now')}</p>
      </div>
    </div>
  )
}

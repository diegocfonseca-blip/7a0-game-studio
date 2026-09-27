// 🧱 CONVOCAÇÃO DO LEILÃO DE CLUBES (27/09, Etapa 1 — só a conta de teste vê).
// Acabou o pregão: você tem UM pacote por setor ("Goleiros do Palmeiras" etc.).
// Aqui escolhe, na formação que travou antes do leilão, quem joga — no molde da
// convocação da Copa do Mundo. Regras do Diego pra esta tela:
//  · nada de nível: sem dourado, sem coroa, lista em ORDEM ALFABÉTICA;
//  · quem não for convocado vai pros bots (o motor faz isso no CONVOCAR_CLUBES).
// Setor sem pacote (ninguém ganhou nem no monte) o motor completa com sobra DE
// VERDADE — nunca jogador de mentira.
import { useMemo, useState } from 'react'
import { useEsc } from './store'
import { Shell, Box, nomePacote } from './screens'
import { Escudo } from './escudos'
import { useT, getLang } from './lang'
import { FORMATIONS, SECTORS, type Card, type Sector, type WonCard } from './types'

const GOLD = '#FFC400', INK = '#0C0C0C', GREEN = '#1B7A3D', RED = '#C2452F'
const OSWALD = { fontFamily: 'Oswald, sans-serif' } as const
const SEC_PT: Record<Sector, [string, string]> = { GOL: ['goleiro', 'goleiros'], LAT: ['lateral', 'laterais'], ZAG: ['zagueiro', 'zagueiros'], MEI: ['meia', 'meias'], ATA: ['atacante', 'atacantes'] }
const SEC_EN: Record<Sector, [string, string]> = { GOL: ['goalkeeper', 'goalkeepers'], LAT: ['full-back', 'full-backs'], ZAG: ['centre-back', 'centre-backs'], MEI: ['midfielder', 'midfielders'], ATA: ['forward', 'forwards'] }
const secNome = (s: Sector, n: number) => (getLang() === 'en' ? SEC_EN : SEC_PT)[s][n === 1 ? 0 : 1]

export function EscConvocacaoClubes() {
  const { state, dispatch } = useEsc()
  const t = useT()
  const me = state.managers[state.youIdx]
  const form = FORMATIONS[me?.formation ?? '4-3-3']
  // o pacote de cada setor (a carta-pacote que você arrematou)
  const lotes = useMemo(() => {
    const r: Partial<Record<Sector, WonCard>> = {}
    for (const c of (me?.squad ?? []) as WonCard[]) if (c.pacote) r[c.pos] = c
    return r
  }, [me])
  const poolDe = (s: Sector): Card[] => [...(lotes[s]?.pacote?.cartas ?? [])].sort((a, b) => a.name.localeCompare(b.name))
  // quantos DÁ pra convocar no setor (pacote menor que as vagas? o motor completa o resto)
  const precisa = (s: Sector) => Math.min(form[s], poolDe(s).length)
  const [tab, setTab] = useState<Sector>(() => SECTORS.find(s => lotes[s]) ?? 'GOL')
  const [sel, setSel] = useState<Record<string, Sector>>({}) // id da carta → setor
  const [aviso, setAviso] = useState<string | null>(null)
  const doSetor = (s: Sector) => poolDe(s).filter(c => sel[c.id])
  const total = Object.keys(sel).length
  const alvo = SECTORS.reduce((n, s) => n + precisa(s), 0)
  const faltando = SECTORS.filter(s => doSetor(s).length < precisa(s)).map(s => `${precisa(s) - doSetor(s).length} ${secNome(s, precisa(s) - doSetor(s).length)}`)
  const pronto = faltando.length === 0

  if (!me) return null
  const toggle = (c: Card, s: Sector) => {
    setSel(prev => {
      const nx = { ...prev }
      if (nx[c.id]) { delete nx[c.id]; setAviso(null); return nx }
      const naPos = poolDe(s).filter(x => prev[x.id])
      if (naPos.length >= form[s]) {
        setAviso(getLang() === 'en'
          ? `Your ${me.formation} has room for ${form[s]} ${secNome(s, form[s])}. To call up ${c.name}, first tap ${naPos.map(x => x.name).join(' or ')} to remove.`
          : `Seu ${me.formation} tem vaga pra ${form[s]} ${secNome(s, form[s])}. Pra convocar ${c.name}, toque primeiro em ${naPos.map(x => x.name).join(' ou ')} pra tirar.`)
        return prev
      }
      nx[c.id] = s; setAviso(null); return nx
    })
  }
  const lista = poolDe(tab)
  const lote = lotes[tab]

  return (
    <Shell>
      <div className="space-y-3">
        <div style={{ background: INK, border: `3px solid ${INK}`, borderRadius: 13, padding: '9px 11px', display: 'flex', alignItems: 'center', gap: 9, boxShadow: `4px 4px 0 0 ${INK}` }}>
          <span style={{ fontSize: 26 }}>🧱</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ ...OSWALD, fontWeight: 900, fontSize: 16, margin: 0, color: '#fff', textTransform: 'uppercase' }}>{t('Convocação', 'Call-up')} · {me.teamName}</p>
            <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,.7)', margin: '2px 0 0' }}>{t(`Escolha quem joga dentro dos pacotes que você levou. Formação travada: ${me.formation}. Quem ficar de fora vai pros outros times.`, `Pick who plays from the packs you won. Formation locked: ${me.formation}. Whoever is left out goes to the other teams.`)}</p>
          </div>
          <div style={{ background: GOLD, border: `2px solid ${INK}`, borderRadius: 10, padding: '4px 9px', textAlign: 'center', color: INK }}>
            <b style={{ display: 'block', fontSize: 15, lineHeight: 1, ...OSWALD }}>{total}/{alvo}</b>
            <span style={{ fontSize: 7, fontWeight: 900, letterSpacing: 1 }}>{t('CONVOCADOS', 'CALLED UP')}</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 4 }}>
          {SECTORS.map(s => {
            const ok = doSetor(s).length >= precisa(s)
            return (
              <button key={s} onClick={() => { setTab(s); setAviso(null) }} style={{ flex: 1, border: `2.5px solid ${INK}`, borderRadius: 10, padding: '4px 2px', fontWeight: 900, fontSize: 11, ...OSWALD, cursor: 'pointer', background: ok ? GREEN : tab === s ? GOLD : '#fff', color: ok ? '#fff' : INK, boxShadow: tab === s ? `2px 2px 0 0 ${INK}` : 'none' }}>
                {s}<span style={{ display: 'block', fontSize: 8, fontWeight: 800, opacity: 0.85 }}>{doSetor(s).length}/{form[s]}{ok ? ' ✓' : ''}</span>
              </button>
            )
          })}
        </div>

        <Box className="p-0 overflow-hidden" shadow={3}>
          {lote ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderBottom: `3px solid ${INK}`, background: '#FFF4CF' }}>
              <Escudo nome={lote.pacote?.clube ?? lote.club} size={34} />
              <div style={{ minWidth: 0, flex: 1 }}>
                <p style={{ ...OSWALD, fontWeight: 900, fontSize: 14, margin: 0, textTransform: 'uppercase', lineHeight: 1.1 }}>{nomePacote(lote)}</p>
                <p style={{ fontSize: 10, fontWeight: 800, color: 'rgba(0,0,0,.55)', margin: '2px 0 0' }}>{t(`Convoque ${precisa(tab)} de ${lista.length}`, `Call up ${precisa(tab)} of ${lista.length}`)}</p>
              </div>
            </div>
          ) : (
            <p style={{ fontSize: 11.5, fontWeight: 800, padding: 12, margin: 0, lineHeight: 1.4 }}>
              {t(`Você não levou pacote de ${secNome(tab, 2)} (nem no leilão, nem no monte). O jogo completa essas ${form[tab]} vagas com jogadores de verdade que sobraram — nada de perna-de-pau.`, `You didn't win a ${secNome(tab, 1)} pack (neither in the auction nor in the pile). The game fills these ${form[tab]} spots with real leftover players — no fillers.`)}
            </p>
          )}
          {aviso && (
            <div style={{ borderBottom: `2px solid ${INK}`, padding: '7px 10px', background: '#FDE9C8', fontWeight: 800, fontSize: 10.5, lineHeight: 1.4 }}>✋ {aviso}</div>
          )}
          {lista.map(c => {
            const on = !!sel[c.id]
            const cheio = !on && doSetor(tab).length >= form[tab]
            return (
              <button key={c.id} onClick={() => toggle(c, tab)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', border: 'none', borderBottom: '2px solid rgba(0,0,0,.07)', background: on ? '#E9F5EC' : cheio ? '#EFE7D2' : '#fff', cursor: 'pointer', opacity: cheio ? 0.62 : 1, textAlign: 'left' }}>
                <span style={{ width: 22, height: 22, border: `2.5px solid ${INK}`, borderRadius: 7, background: on ? GREEN : '#fff', color: on ? '#fff' : 'rgba(0,0,0,.45)', display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 900, flexShrink: 0 }}>{on ? '✓' : cheio ? '🔒' : ''}</span>
                <span style={{ ...OSWALD, fontWeight: 900, fontSize: 13.5, textTransform: 'uppercase', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: INK }}>{c.name}</span>
                <span style={{ fontSize: 9.5, fontWeight: 700, color: 'rgba(0,0,0,.5)', whiteSpace: 'nowrap', flexShrink: 0 }}>{c.year}</span>
              </button>
            )
          })}
        </Box>

        {/* campinho: convocados por linha (ATA/MEI/DEF/GOL, padrão do pregão) */}
        <div style={{ border: `3px solid ${INK}`, borderRadius: 14, overflow: 'hidden', boxShadow: `4px 4px 0 0 ${INK}` }}>
          <div style={{ background: INK, color: '#fff', height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ ...OSWALD, fontWeight: 900, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }}>{me.teamName} · {me.formation}</span>
          </div>
          <div style={{ background: `repeating-linear-gradient(180deg, ${GREEN} 0 34px, #166332 34px 68px)`, padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 7 }}>
            {(['ATA', 'MEI', 'DEF', 'GOL'] as const).map(row => {
              const secs: Sector[] = row === 'DEF' ? ['LAT', 'ZAG'] : [row]
              let slots: { s: Sector; c: Card | null }[] = []
              for (const s of secs) { const p = doSetor(s); for (let i = 0; i < form[s]; i++) slots.push({ s, c: p[i] ?? null }) }
              if (row === 'DEF' && form.LAT === 2) { const lat = slots.filter(x => x.s === 'LAT'), zag = slots.filter(x => x.s === 'ZAG'); slots = [lat[0], ...zag, lat[1]] }
              return (
                <div key={row} style={{ display: 'flex', justifyContent: 'center', gap: 6, flexWrap: 'wrap' }}>
                  {slots.map((sl, i) => (
                    <div key={i} style={{ border: `2px solid ${INK}`, borderRadius: 8, textAlign: 'center', padding: '3px 6px', minWidth: 58, background: sl.c ? '#fff' : 'rgba(255,255,255,0.25)' }}>
                      <p style={{ fontSize: 8.5, fontWeight: 900, color: sl.c ? RED : '#fff', margin: 0 }}>{sl.s}</p>
                      <p style={{ fontSize: 10, fontWeight: 700, margin: 0, color: sl.c ? INK : 'rgba(255,255,255,0.95)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 70 }}>{sl.c ? sl.c.name : t('Vazio', 'Empty')}</p>
                    </div>
                  ))}
                </div>
              )
            })}
          </div>
        </div>

        {pronto ? (
          <button onClick={() => dispatch({ type: 'CONVOCAR_CLUBES', mgrId: me.id, cartas: Object.keys(sel) })}
            style={{ width: '100%', border: `3px solid ${INK}`, borderRadius: 14, padding: 12, fontWeight: 900, fontSize: 15, ...OSWALD, background: `linear-gradient(150deg,#FFE79A,${GOLD} 55%,#E8A200)`, boxShadow: `4px 4px 0 0 ${INK}`, cursor: 'pointer', textTransform: 'uppercase', color: INK }}>
            {t('✅ Fechar convocação', '✅ Close call-up')}
          </button>
        ) : (
          <div style={{ width: '100%', border: `3px solid ${INK}`, borderRadius: 14, padding: 11, fontWeight: 900, fontSize: 13, ...OSWALD, background: '#CBBF9E', color: 'rgba(0,0,0,.55)', textAlign: 'center', textTransform: 'uppercase' }}>
            {t('🔒 Fechar convocação', '🔒 Close call-up')}
            <span style={{ display: 'block', fontSize: 9.5, fontWeight: 800, fontFamily: 'system-ui', textTransform: 'none', marginTop: 2 }}>{t('faltam', 'missing')} {faltando.join(' · ')} — {t('escolha nas abas ⬆️', 'pick in the tabs ⬆️')}</span>
          </div>
        )}
      </div>
    </Shell>
  )
}

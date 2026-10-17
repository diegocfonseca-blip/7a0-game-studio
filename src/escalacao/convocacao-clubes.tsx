// 🧱 CONVOCAÇÃO DO LEILÃO DE CLUBES (27/09, Etapa 1 — só a conta de teste vê).
// Acabou o pregão: você tem UM pacote por setor ("Goleiros do Palmeiras" etc.).
// Aqui escolhe, na formação que travou antes do leilão, quem joga — no molde da
// convocação da Copa do Mundo. Regras do Diego pra esta tela:
//  · nada de nível: sem dourado, sem coroa, lista em ORDEM ALFABÉTICA;
//  · quem não for convocado vai pros bots (o motor faz isso no CONVOCAR_CLUBES).
// Setor sem pacote (ninguém ganhou nem no monte) o motor completa com sobra DE
// VERDADE — nunca jogador de mentira.
import { SeloClube } from './selo-clube' // 🧱 selo estilo B dos clubes reais (28/09)
import { useEffect, useMemo, useRef, useState } from 'react'
import { useEsc } from './store'
import { Shell, Box, nomePacote, CaixaDuplaTrava } from './screens'
import { useT, getLang } from './lang'
import { JogadorNoCampo, VagaNoCampo } from './jogadorcampo' // 🧍 a MESMA peça do campinho da carreira (boneco solto na grama)
import { useLegendPresentation } from './presentation-release'
import { agoraSala } from './relogio' // ⏱️ no online o relógio é o do DONO da sala
import { logTravaSalva } from './analytics'
import { FORMATIONS, SECTORS, duplaPodeAgir, type Card, type Sector, type WonCard } from './types'
import { PlacaGol } from './patrocinio-visual' // 🏟️ placas atrás dos gols (17/10)

const GOLD = '#FFC400', INK = '#0C0C0C', GREEN = '#1B7A3D'
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
  // 🤝 DUPLA (12/10): cada um convoca as posições DELE — a mesma divisão 3 e 3 do pregão.
  // As do parceiro aparecem com 🔒 e o nome dele (ver tudo, mexer só no seu).
  const dupla = me ? state.duplas?.[me.id] : undefined
  const emDupla = !!dupla?.partnerUid
  const meuSetor = (s: Sector) => !me || duplaPodeAgir(state.duplas, me.id, s, state.youUid)
  const quemNoSetor = (s: Sector) => {
    if (!dupla) return ''
    const u = dupla.soloUid ?? dupla.cats?.[s]
    return ((u === dupla.ownerUid ? dupla.ownerName : dupla.partnerName) ?? '').replace(/\p{Extended_Pictographic}/gu, '').trim()
  }
  const meusSetores = SECTORS.filter(meuSetor)
  const parceiroUid = dupla ? (dupla.ownerUid === state.youUid ? dupla.partnerUid : dupla.ownerUid) : undefined
  const parceiroSumiu = emDupla && !dupla?.soloUid && !!parceiroUid && Array.isArray(state.presenceUids) && state.presenceUids.length > 0 && !state.presenceUids.includes(parceiroUid)
  const poolDe = (s: Sector): Card[] => [...(lotes[s]?.pacote?.cartas ?? [])].sort((a, b) => a.name.localeCompare(b.name))
  // quantos DÁ pra convocar no setor (pacote menor que as vagas? o motor completa o resto)
  const precisa = (s: Sector) => (meuSetor(s) ? Math.min(form[s], poolDe(s).length) : 0)
  const [tab, setTab] = useState<Sector>(() => SECTORS.find(s => lotes[s] && meuSetor(s)) ?? SECTORS.find(s => lotes[s]) ?? 'GOL')
  const [sel, setSel] = useState<Record<string, Sector>>({}) // id da carta → setor
  const [aviso, setAviso] = useState<string | null>(null)
  const doSetor = (s: Sector) => poolDe(s).filter(c => sel[c.id])
  const total = Object.keys(sel).length
  const alvo = SECTORS.reduce((n, s) => n + precisa(s), 0)
  const faltando = SECTORS.filter(s => doSetor(s).length < precisa(s)).map(s => `${precisa(s) - doSetor(s).length} ${secNome(s, precisa(s) - doSetor(s).length)}`)
  const pronto = faltando.length === 0

  // ⏱️ 90s (pedido do Diego 27/09). Acabou o tempo: manda o que já estiver marcado — a vaga
  // vazia a máquina completa com o PIOR do pacote (castigo que o Diego escolheu).
  const rostosOn = useLegendPresentation()
  const [agora, setAgora] = useState(agoraSala())
  useEffect(() => { const iv = setInterval(() => setAgora(agoraSala()), 250); return () => clearInterval(iv) }, [])
  const prazo = state.convocacaoDeadline ?? null
  const seg = prazo ? Math.max(0, Math.ceil((prazo - agora) / 1000)) : null
  const fechei = !!me && ((state.convocacaoFeitos ?? []).includes(me.id) || (emDupla && (state.convocacaoDuplaFeitos ?? []).includes(`${me.id}:${state.youUid}`)))
  const selRef = useRef(sel); selRef.current = sel
  const mandou = useRef(false)
  // 📮 16/10 (Diego, caso do Arroganthi: "apertei fechar, não fechou e o time mudou"): o pedido de fechar ia
  // pro dono UMA vez, sem reenvio e sem resposta na tela. Se o recado se perdia, o relógio estourava e o jogo
  // dava o PIOR de cada pacote pra ele. Ordem dele: *"ele tem que apertar o botão e tem que funcionar fechar"*.
  // Agora: apertou → "Enviando…" e a lista ATUAL é reenviada a cada 3s até o dono confirmar (igual ao envelope);
  // o dono aceita a lista mais nova enquanto a convocação está aberta (reducer, CONVOCAR_CLUBES).
  const [enviando, setEnviando] = useState(false)
  const enviar = () => {
    if (!me) return
    mandou.current = true; setEnviando(true)
    dispatch({ type: 'CONVOCAR_CLUBES', mgrId: me.id, cartas: Object.keys(selRef.current), by: state.youUid })
  }
  useEffect(() => {
    if (!me || seg === null || seg > 0 || fechei || mandou.current) return
    enviar()
  }, [seg, fechei]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!enviando || fechei || !me) return
    let n = 0
    const iv = setInterval(() => {
      n++
      if (n === 1 && state.onlineMode === 'online') logTravaSalva('convocacao', 2, state.roomId, state.isHost) // 🧊 1º reenvio = notícia: o 1º tiro se perdeu
      dispatch({ type: 'CONVOCAR_CLUBES', mgrId: me.id, cartas: Object.keys(selRef.current), by: state.youUid })
    }, 3_000)
    return () => clearInterval(iv)
  }, [enviando, fechei]) // eslint-disable-line react-hooks/exhaustive-deps
  const humanos = state.managers.filter(m => m.isHuman && m.modoClubes)
  const faltamFechar = humanos.filter(m => !(state.convocacaoFeitos ?? []).includes(m.id))

  if (!me) return null
  if (fechei || !me.modoClubes) {
    return (
      <Shell>
        <Box className="p-5 text-center space-y-2">
          <p style={{ ...OSWALD, fontWeight: 900, fontSize: 20, textTransform: 'uppercase', margin: 0 }}>{t('✅ Convocação fechada', '✅ Call-up closed')}</p>
          <p style={{ fontSize: 12, fontWeight: 800, color: 'rgba(0,0,0,.6)', margin: 0 }}>
            {faltamFechar.length
              ? t(`Esperando ${faltamFechar.length === 1 ? 'mais 1 técnico' : `mais ${faltamFechar.length} técnicos`}: ${faltamFechar.map(m => m.teamName).join(', ')}`, `Waiting for ${faltamFechar.length} more: ${faltamFechar.map(m => m.teamName).join(', ')}`)
              : t('Todo mundo fechou — já vai começar.', 'Everyone is done — starting now.')}
          </p>
          {emDupla && !(state.convocacaoFeitos ?? []).includes(me.id) && (
            <p style={{ fontSize: 12, fontWeight: 800, color: '#5B3DB8', margin: 0 }}>{t(`🤝 A sua parte está feita. Falta ${quemNoSetor(SECTORS.find(s => !meuSetor(s)) ?? 'GOL') || 'seu parceiro'} fechar as posições dele.`, `🤝 Your part is done. Waiting for ${quemNoSetor(SECTORS.find(s => !meuSetor(s)) ?? 'GOL') || 'your partner'} to finish theirs.`)}</p>
          )}
          {seg !== null && faltamFechar.length > 0 && <p style={{ ...OSWALD, fontWeight: 900, fontSize: 26, margin: 0 }}>⏱️ {seg}s</p>}
        </Box>
      </Shell>
    )
  }
  const toggle = (c: Card, s: Sector) => {
    if (!meuSetor(s)) return // 🤝 setor do parceiro: só ele marca (o host também recusa)
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

        {/* ⏱️ O RELÓGIO NO TOPO, GRUDADO (Diego 27/09: "de forma mais clara e prática"):
            fica à vista enquanto a pessoa rola a lista, e diz o castigo numa frase só. */}
        {seg !== null && (
          <div style={{ position: 'sticky', top: 6, zIndex: 5, border: `3px solid ${INK}`, borderRadius: 12, background: seg <= 15 ? '#E8503A' : GOLD, color: seg <= 15 ? '#fff' : INK, boxShadow: `3px 3px 0 0 ${INK}`, padding: '7px 10px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <b style={{ ...OSWALD, fontWeight: 900, fontSize: 28, lineHeight: 1, minWidth: 58, textAlign: 'center' }}>{seg}s</b>
            <p style={{ fontSize: 11.5, fontWeight: 800, margin: 0, lineHeight: 1.3 }}>
              {t('Não escolheu a tempo? O sistema escolhe o PIOR do pacote pra você.', "Didn't pick in time? The system picks the WORST of the pack for you.")}
            </p>
          </div>
        )}

        <div style={{ display: 'flex', gap: 4 }}>
          {SECTORS.map(s => {
            const ok = meuSetor(s) && doSetor(s).length >= precisa(s)
            return (
              <button key={s} onClick={() => { setTab(s); setAviso(null) }} style={{ flex: 1, border: `2.5px solid ${INK}`, borderRadius: 10, padding: '4px 2px', fontWeight: 900, fontSize: 11, ...OSWALD, cursor: 'pointer', background: ok ? GREEN : tab === s ? GOLD : '#fff', color: ok ? '#fff' : INK, boxShadow: tab === s ? `2px 2px 0 0 ${INK}` : 'none' }}>
                {s}<span style={{ display: 'block', fontSize: 8, fontWeight: 800, opacity: 0.85 }}>{meuSetor(s) ? `${doSetor(s).length}/${form[s]}${ok ? ' ✓' : ''}` : `🔒 ${quemNoSetor(s).split(' ')[0] || '—'}`}</span>
              </button>
            )
          })}
        </div>

        {emDupla && !meuSetor(tab) && (
          <CaixaDuplaTrava quem={quemNoSetor(tab)} parceiroSumiu={parceiroSumiu}
            assumir={() => dispatch({ type: 'DUPLA_SOLO', mgrId: me.id, ficouUid: state.youUid ?? '' })}
            titulo={t(`🔒 Quem convoca os ${secNome(tab, 2)} é ${quemNoSetor(tab) || 'seu parceiro'}`, `🔒 ${quemNoSetor(tab) || 'Your partner'} calls up the ${secNome(tab, 2)}`)}
            texto={t('Você vê o pacote, mas quem marca aqui é ele. As abas sem 🔒 são as suas.', 'You can see the pack, but your partner picks here. The tabs without 🔒 are yours.')} />
        )}
        {emDupla && meuSetor(tab) && meusSetores.length < SECTORS.length && (
          <p style={{ fontSize: 10.5, fontWeight: 800, color: '#5B3DB8', margin: 0 }}>{t(`🤝 Você convoca: ${meusSetores.join(' · ')}. O resto é com ${quemNoSetor(SECTORS.find(s => !meuSetor(s)) ?? 'GOL') || 'seu parceiro'}.`, `🤝 You call up: ${meusSetores.join(' · ')}. The rest is up to ${quemNoSetor(SECTORS.find(s => !meuSetor(s)) ?? 'GOL') || 'your partner'}.`)}</p>
        )}
        <Box className="p-0 overflow-hidden" shadow={3}>
          {lote ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderBottom: `3px solid ${INK}`, background: '#FFF4CF' }}>
              <SeloClube clube={lote.pacote?.clube ?? lote.club} size={44} />
              <div style={{ minWidth: 0, flex: 1 }}>
                <p style={{ ...OSWALD, fontWeight: 900, fontSize: 14, margin: 0, textTransform: 'uppercase', lineHeight: 1.1 }}>{nomePacote(lote)}</p>
                <p style={{ fontSize: 10, fontWeight: 800, color: 'rgba(0,0,0,.55)', margin: '2px 0 0' }}>{meuSetor(tab) ? t(`Convoque ${precisa(tab)} de ${lista.length}`, `Call up ${precisa(tab)} of ${lista.length}`) : t(`${lista.length} no pacote · 🔒 ${quemNoSetor(tab)} escolhe`, `${lista.length} in the pack · 🔒 ${quemNoSetor(tab)} picks`)}</p>
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
            const travado = !meuSetor(tab)
            return (
              <button key={c.id} onClick={() => toggle(c, tab)} disabled={travado}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', border: 'none', borderBottom: '2px solid rgba(0,0,0,.07)', background: on ? '#E9F5EC' : cheio ? '#EFE7D2' : '#fff', cursor: travado ? 'default' : 'pointer', opacity: cheio || travado ? 0.62 : 1, textAlign: 'left' }}>
                <span style={{ width: 22, height: 22, border: `2.5px solid ${INK}`, borderRadius: 7, background: on ? GREEN : '#fff', color: on ? '#fff' : 'rgba(0,0,0,.45)', display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 900, flexShrink: 0 }}>{on ? '✓' : cheio || travado ? '🔒' : ''}</span>
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
          <PlacaGol lado="cima" alt={24} />
          <div style={{ background: `repeating-linear-gradient(180deg, ${GREEN} 0 34px, #166332 34px 68px)`, padding: '10px 8px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {(['ATA', 'MEI', 'DEF', 'GOL'] as const).map(row => {
              const secs: Sector[] = row === 'DEF' ? ['LAT', 'ZAG'] : [row]
              let slots: { s: Sector; c: Card | null }[] = []
              for (const s of secs) { const p = doSetor(s); for (let i = 0; i < form[s]; i++) slots.push({ s, c: p[i] ?? null }) }
              if (row === 'DEF' && form.LAT === 2) { const lat = slots.filter(x => x.s === 'LAT'), zag = slots.filter(x => x.s === 'ZAG'); slots = [lat[0], ...zag, lat[1]] }
              return (
                <div key={row} style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: 4 }}>
                  {/* 🧍 igual ao campinho da carreira (Diego 27/09: "da mesma forma que do carreira, sem
                      fundo"): boneco solto na grama; a lenda que tem rosto no jogo aparece com o rosto */}
                  {slots.map((sl, i) => sl.c
                    ? <JogadorNoCampo key={i} nome={sl.c.name} clube={sl.c.club} ano={sl.c.year} tag={sl.s} alt={52} fonteNome={10} rosto={rostosOn} />
                    : <VagaNoCampo key={i} tag={sl.s} alt={52} />)}
                </div>
              )
            })}
          </div>
          <PlacaGol lado="baixo" alt={24} />
        </div>

        {pronto ? (
          <button onClick={enviar} disabled={enviando}
            style={{ width: '100%', border: `3px solid ${INK}`, borderRadius: 14, padding: 12, fontWeight: 900, fontSize: 15, ...OSWALD, background: enviando ? '#E9F5EC' : `linear-gradient(150deg,#FFE79A,${GOLD} 55%,#E8A200)`, boxShadow: `4px 4px 0 0 ${INK}`, cursor: enviando ? 'default' : 'pointer', textTransform: 'uppercase', color: INK }}>
            {enviando ? t('⏳ Enviando pro dono da sala…', '⏳ Sending to the room owner…') : t('✅ Fechar convocação', '✅ Close call-up')}
            {enviando && <span style={{ display: 'block', fontSize: 9.5, fontWeight: 800, fontFamily: 'system-ui', textTransform: 'none', marginTop: 2 }}>{t('Sua lista está guardada e vai de novo a cada 3s até ele confirmar. Pode ajustar: vale a última.', 'Your list is kept and re-sent every 3s until they confirm. You can still adjust: the latest one counts.')}</span>}
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

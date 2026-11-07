// 👑 PAINEL DO DONO DENTRO DA LIGA (07/11, Diego: *"pode fazer o painel do dono adorei"* — mockup
// `scripts/mockups/painel-dono-liga.png`). Tudo que o dono fazia FORA da sala (aceitar pedido, formato da próxima temporada,
// convidar) agora também mora no rodapé do jogo, sem sair da partida. Só o DONO da liga vê.
// Regras que não mudam (são as mesmas do lobby — mesmas funções do banco, nada de regra própria aqui):
// · quem é aceito entra na VIRADA da temporada, nunca no meio (`LIGA_ENTRADAS` no store);
// · formato vale da PRÓXIMA temporada; de 20 nunca volta pra 10 (`esc_liga_formato` responde 'encolhe');
// · convidar = só mandar o código (a sala nunca reabre).
// Aviso de pedido novo: lido a cada 60 s (nada de canal — regra das mensagens do Supabase) e aparece no topo por 6 s, sem parar o jogo.
import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import { supabase } from '../lib/supabase'
import { useT } from './lang'
import type { Manager } from './types'

const INK = '#0C0C0C', GOLD = '#FFC400', GREEN = '#1B7A3D', RED = '#E8503A', PURPLE = '#7C3AED', CREAM = '#F4ECD6'
const OURO = 'linear-gradient(160deg,#FFE79A,#FFC400 40%,#E8A200 70%,#FFDD70)'
const OSW: CSSProperties = { fontFamily: 'Oswald, sans-serif', fontWeight: 800 }
const LEITURA_MS = 60_000

type Ped = { id: string; user_id: string; nome: string | null; status: string; alvo_bot: number | null; alvo_uid: string | null; pago: boolean }
type TimeLiga = { id: number; nome: string; humano: boolean; uid: string | null; pts: number }
type Alvo = { bot?: number; uid?: string }

// o que já apareceu no aviso do topo (só nesta aba): recarregar mostra de novo UMA vez o que ainda está pendente — é lembrete, não aviso fechável
const avisados = new Set<string>()

export function PainelDonoLiga({ roomId, roomCode, roomName, managers, presence, youIdx, donoUid, tamanho, turnoUnico }: {
  roomId: string; roomCode: string; roomName?: string; managers: Manager[]; presence: number[]; youIdx: number; donoUid?: string
  tamanho: 10 | 20; turnoUnico: boolean
}) {
  const t = useT()
  const [aberto, setAberto] = useState(false)
  const [peds, setPeds] = useState<Ped[]>([])
  const [toast, setToast] = useState<string | null>(null)
  const [aceitando, setAceitando] = useState<{ ped: Ped; times: TimeLiga[] | null; alvo: Alvo | null } | null>(null)
  const [msg, setMsg] = useState('')
  const [prox, setProx] = useState<{ tam: 10 | 20; turno: boolean } | null>(null)
  const [copiado, setCopiado] = useState(false)
  const vivo = useRef(true)
  useEffect(() => () => { vivo.current = false }, [])

  const lePedidos = useCallback(async () => {
    try {
      const { data } = await supabase.rpc('esc_liga_pedidos_dono', { p_room: roomId })
      if (!vivo.current) return
      const lista = (data ?? []) as Ped[]
      setPeds(lista)
      const novo = lista.find(p => p.status === 'pendente' && !avisados.has(p.id))
      lista.filter(p => p.status === 'pendente').forEach(p => avisados.add(p.id))
      if (novo) { setToast(novo.nome || t('Alguém', 'Someone')); setTimeout(() => vivo.current && setToast(null), 6000) }
    } catch { /* sem rede: tenta na próxima leitura */ }
  }, [roomId, t])
  useEffect(() => {
    void lePedidos()
    const iv = setInterval(() => { if (document.visibilityState === 'visible') void lePedidos() }, LEITURA_MS)
    return () => clearInterval(iv)
  }, [lePedidos])

  const lerProx = useCallback(async () => {
    try {
      const { data } = await supabase.rpc('esc_liga_formato_prox_ler', { p_room: roomId })
      const f = data as { tamanho?: number; turno_unico?: boolean } | null
      if (!vivo.current) return
      if (f && (f.tamanho === 10 || f.tamanho === 20)) setProx({ tam: f.tamanho, turno: !!f.turno_unico && f.tamanho === 20 })
      else setProx({ tam: tamanho, turno: turnoUnico && tamanho === 20 })
    } catch { setProx({ tam: tamanho, turno: turnoUnico && tamanho === 20 }) }
  }, [roomId, tamanho, turnoUnico])
  const abre = () => { setAberto(a => !a); setMsg(''); if (!aberto) { void lePedidos(); void lerProx() } }

  async function salvaFormato(tam: 10 | 20, turno: boolean) {
    if (tamanho === 20 && tam === 10) { setMsg(t('De 20 times não dá pra voltar pra 10 (teria que tirar times da liga).', 'A 20-team league cannot go back to 10 (teams would have to be removed).')); return }
    const antes = prox
    setProx({ tam, turno: turno && tam === 20 })
    const { data, error } = await supabase.rpc('esc_liga_formato', { p_room: roomId, p_tamanho: tam, p_turno_unico: turno && tam === 20 })
    const res = error ? 'erro' : String(data ?? 'erro')
    if (res === 'ok') { setMsg(t(`✅ Salvo! Vale a partir da PRÓXIMA temporada: ${tam} times · ${turno && tam === 20 ? '19 rodadas (só ida)' : `${(tam - 1) * 2} rodadas`}.`, `✅ Saved! Applies from NEXT season: ${tam} teams · ${turno && tam === 20 ? '19 rounds (single)' : `${(tam - 1) * 2} rounds`}.`)); return }
    setProx(antes)
    setMsg(res === 'rolando' ? t('⏳ Times e rodadas só mudam entre uma temporada e outra — tenta de novo daqui a pouco.', '⏳ Teams and rounds only change between seasons — try again in a bit.') : res === 'encolhe' ? t('De 20 times não dá pra voltar pra 10 (teria que tirar times da liga).', 'A 20-team league cannot go back to 10 (teams would have to be removed).')
      : t('Não consegui salvar agora. Tenta de novo.', 'Couldn\'t save right now. Try again.'))
  }
  async function abreAceite(ped: Ped) {
    setAceitando({ ped, times: null, alvo: null })
    try {
      const { data } = await supabase.rpc('esc_liga_times', { p_room: roomId })
      setAceitando(a => (a && a.ped.id === ped.id ? { ...a, times: (data ?? []) as TimeLiga[] } : a))
    } catch { setAceitando(a => (a ? { ...a, times: [] } : a)) }
  }
  async function responde(ped: Ped, aceitar: boolean, alvo?: Alvo) {
    const { data, error } = await supabase.rpc('esc_liga_responder', { p_id: ped.id, p_aceitar: aceitar, p_bot: alvo?.bot ?? null, p_uid: alvo?.uid ?? null })
    const res = error ? 'erro' : String(data ?? 'erro')
    if (res === 'plano') { setMsg(t('Essa pessoa não tem plano: ela não pode entrar numa liga que já começou.', 'This person has no plan: they cannot join a league that already started.')); return }
    if (res !== 'ok') { setMsg(t('Não consegui salvar agora. Tenta de novo.', 'Couldn\'t save right now. Try again.')); return }
    setAceitando(null)
    setMsg(aceitar ? t(`✅ ${ped.nome || 'Ele'} entra na virada da temporada, com o nome e a cor dele.`, `✅ ${ped.nome || 'They'} join at the turn of the season, with their own name and color.`) : '')
    void lePedidos()
  }
  async function copia() {
    try { await navigator.clipboard.writeText(roomCode); setCopiado(true); setTimeout(() => vivo.current && setCopiado(false), 2000) } catch { /* sem área de transferência */ }
  }

  const pendentes = peds.filter(p => p.status === 'pendente').length
  const gente = managers.filter(m => m.isHuman)
  const caixa: CSSProperties = { background: '#fff', border: `4px solid ${INK}`, borderRadius: 18, boxShadow: `4px 4px 0 ${INK}`, overflow: 'hidden', textAlign: 'left', color: INK }
  const sec: CSSProperties = { padding: '10px 12px', borderBottom: '2px solid rgba(0,0,0,.08)' }
  const h3: CSSProperties = { ...OSW, fontSize: 13, letterSpacing: 0.4, margin: '0 0 7px', textTransform: 'uppercase' }
  const dica: CSSProperties = { fontSize: 11, color: 'rgba(0,0,0,.6)', fontWeight: 600, marginTop: 6 }
  const seg = (on: boolean, travado = false): CSSProperties => ({ flex: 1, textAlign: 'center', padding: '7px 4px', fontSize: 12, ...OSW, fontWeight: on ? 800 : 600, background: on ? INK : '#fff', color: on ? GOLD : travado ? 'rgba(0,0,0,.3)' : INK, border: 'none', cursor: travado ? 'not-allowed' : 'pointer' })
  const prx = prox ?? { tam: tamanho, turno: turnoUnico && tamanho === 20 }

  return (
    <>
      {toast && (
        <button onClick={() => { setToast(null); if (!aberto) abre() }} className="fixed left-1/2 -translate-x-1/2 z-50" style={{ top: 12, width: 'min(92vw, 420px)', display: 'flex', alignItems: 'center', gap: 6, background: '#fff', border: `3px solid ${INK}`, borderLeft: `10px solid ${PURPLE}`, borderRadius: 12, padding: '8px 10px', boxShadow: `3px 3px 0 ${INK}`, fontSize: 13, color: INK, textAlign: 'left' }}>
          📨 <span className="flex-1 min-w-0 truncate"><b>{toast}</b> {t('pediu pra entrar na liga', 'asked to join the league')}</span>
          <span style={{ ...OSW, color: PURPLE }}>{t('ver ›', 'see ›')}</span>
        </button>
      )}
      <div className="pt-1">
        <button onClick={abre} className="relative active:translate-y-0.5" style={{ ...OSW, fontSize: 15, background: OURO, color: INK, border: `3px solid ${INK}`, borderRadius: 14, padding: '9px 18px', boxShadow: aberto ? 'none' : `3px 3px 0 ${INK}`, transform: aberto ? 'translate(3px,3px)' : undefined }}>
          {aberto ? t('✕ Fechar o painel', '✕ Close panel') : t('👑 PAINEL DO DONO', '👑 OWNER PANEL')}
          {pendentes > 0 && <span style={{ position: 'absolute', top: -10, right: -10, background: RED, color: '#fff', border: `2px solid ${INK}`, borderRadius: 999, minWidth: 24, height: 24, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px' }}>{pendentes}</span>}
        </button>
        <p className="text-[11px] text-black/45 font-semibold mt-1">{t('só você (dono da liga) vê este botão', 'only you (league owner) see this button')}</p>
      </div>
      {aberto && (
        <div className="max-w-sm mx-auto mt-2" style={caixa}>
          <div style={{ background: OURO, borderBottom: `3px solid ${INK}`, padding: '9px 12px', ...OSW, fontSize: 16 }}>👑 {t('PAINEL DO DONO', 'OWNER PANEL')}</div>
          {msg && <p style={{ ...sec, fontSize: 12, fontWeight: 700, background: '#FFF4CF' }}>{msg}</p>}

          {/* 📨 PEDIDOS */}
          <div style={sec}>
            <p style={h3}>📨 {t('Pedidos pra entrar', 'Join requests')} {pendentes > 0 && <span style={{ background: RED, color: '#fff', borderRadius: 8, padding: '0 6px', marginLeft: 4 }}>{pendentes}</span>}</p>
            {peds.length === 0 && <p style={{ fontSize: 12, fontWeight: 600, color: 'rgba(0,0,0,.55)' }}>{t('Nenhum pedido agora. Quem quiser entrar usa o código da liga.', 'No requests right now. Anyone who wants in uses the league code.')}</p>}
            {peds.map(p => (
              <div key={p.id} style={{ background: CREAM, border: `2px solid ${INK}`, borderRadius: 12, padding: 7, marginBottom: 6 }}>
                <div className="flex items-center gap-2">
                  <span className="flex-1 min-w-0 truncate" style={{ fontWeight: 800, fontSize: 14, color: p.pago ? INK : 'rgba(0,0,0,.4)' }}>{p.nome || t('Técnico', 'Manager')}</span>
                  {!p.pago ? <span style={{ fontSize: 10.5, fontWeight: 700, color: 'rgba(0,0,0,.5)' }}>{t('🔒 precisa de plano', '🔒 needs a plan')}</span>
                    : p.status === 'aceito' ? <span style={{ fontSize: 10.5, fontWeight: 800, color: GREEN }}>{t('✅ entra na virada', '✅ joins next season')}</span>
                    : <button onClick={() => void abreAceite(p)} style={{ ...OSW, background: GREEN, color: '#fff', border: `2px solid ${INK}`, borderRadius: 10, padding: '5px 10px', boxShadow: `2px 2px 0 ${INK}`, fontSize: 12 }}>{t('ACEITAR', 'ACCEPT')}</button>}
                  <button onClick={() => void responde(p, false)} aria-label={t('Recusar', 'Decline')} style={{ ...OSW, background: '#fff', border: `2px solid ${INK}`, borderRadius: 10, padding: '5px 9px', boxShadow: `2px 2px 0 ${INK}`, fontSize: 12 }}>✕</button>
                </div>
                {aceitando?.ped.id === p.id && (() => {
                  const ts = aceitando.times
                  if (ts === null) return <p style={{ fontSize: 12, fontWeight: 700, marginTop: 6 }}>⏳</p>
                  const bots = ts.filter(x => !x.humano).sort((a, b) => b.pts - a.pts)
                  const outros = ts.filter(x => x.humano && x.uid && x.uid !== donoUid)
                  const op = (k: string, sel: boolean, lb: string, sub: string, f: () => void) => (
                    <button key={k} onClick={f} className="w-full flex justify-between items-center" style={{ marginTop: 5, border: `${sel ? 3 : 2}px solid ${sel ? INK : 'rgba(0,0,0,.2)'}`, borderRadius: 10, padding: '6px 8px', background: sel ? '#E7F5EC' : '#fff', boxShadow: sel ? `2px 2px 0 ${INK}` : 'none', fontSize: 13, fontWeight: 800, textAlign: 'left' }}>
                      <span className="truncate">{lb}</span><span style={{ fontSize: 10.5, color: 'rgba(0,0,0,.55)', marginLeft: 8, flexShrink: 0 }}>{sub}{sel ? ' ✔' : ''}</span></button>)
                  return (
                    <div style={{ marginTop: 8, borderTop: '2px dashed rgba(0,0,0,.15)', paddingTop: 6 }}>
                      <p style={{ ...OSW, fontSize: 13 }}>{t(`${p.nome || 'Ele'} entra no lugar de quem?`, `${p.nome || 'They'} take whose place?`)}</p>
                      <p style={{ fontSize: 10.5, fontWeight: 700, color: 'rgba(0,0,0,.6)' }}>{t('Ele entra com o nome e a cor dele e fica com os jogadores do time.', 'They join with their own name and color and keep the team\'s players.')}</p>
                      {bots.length > 0 && <p style={{ ...OSW, fontSize: 10.5, color: 'rgba(0,0,0,.5)', marginTop: 6 }}>🤖 {t('BOTS', 'BOTS')}</p>}
                      {bots.map(x => op(`b${x.id}`, aceitando.alvo?.bot === x.id, `🤖 ${x.nome}`, `${x.pts} pts`, () => setAceitando(a => (a ? { ...a, alvo: { bot: x.id } } : a))))}
                      {outros.length > 0 && <p style={{ ...OSW, fontSize: 10.5, color: 'rgba(0,0,0,.5)', marginTop: 6 }}>👤 {t('TÉCNICOS', 'MANAGERS')}</p>}
                      {outros.map(x => op(`h${x.id}`, aceitando.alvo?.uid === x.uid, x.nome, t('sai da liga', 'leaves the league'), () => setAceitando(a => (a ? { ...a, alvo: { uid: x.uid! } } : a))))}
                      {aceitando.alvo?.uid && <p style={{ fontSize: 11.5, fontWeight: 700, background: '#FDECE8', border: `2px solid #C2452F`, borderRadius: 10, padding: '5px 7px', marginTop: 6 }}>⚠️ {t('Trocar um técnico tira ele da liga de vez. Quando ele tentar voltar, vê "você foi removido pelo dono".', 'Replacing a manager removes them from the league for good. When they try to come back they see "you were removed by the owner".')}</p>}
                      {ts.length > 0 && bots.length === 0 && <>
                        <p style={{ fontSize: 11, fontWeight: 700, background: '#FFE3DC', border: `2px solid ${INK}`, borderRadius: 10, padding: '5px 7px', marginTop: 6 }}>{t('🏟️ Sua liga está cheia de gente (nenhum bot). Pra pôr mais alguém sem tirar ninguém, marque 20 times aqui embaixo: na próxima temporada entram 10 bots e ele fica com um deles.', '🏟️ Your league is full of people (no bots). To add someone without removing anyone, pick 20 teams below: next season 10 bots join and they take one of them.')}</p>
                        {op('bnovo', aceitando.alvo?.bot === -1, t('🤖 Um dos bots novos (liga de 20)', '🤖 One of the new bots (20-team league)'), t('próx. temporada', 'next season'), () => setAceitando(a => (a ? { ...a, alvo: { bot: -1 } } : a)))}
                      </>}
                      <div className="flex gap-1.5" style={{ marginTop: 8 }}>
                        <button disabled={!!ts.length && !aceitando.alvo} onClick={() => void responde(p, true, aceitando.alvo ?? { bot: -1 })} className="flex-1 disabled:opacity-40" style={{ ...OSW, background: GREEN, color: '#fff', border: `3px solid ${INK}`, borderRadius: 12, padding: '8px 6px', boxShadow: `3px 3px 0 ${INK}`, fontSize: 13 }}>{t('ACEITAR · ENTRA NA PRÓXIMA TEMPORADA', 'ACCEPT · JOINS NEXT SEASON')}</button>
                        <button onClick={() => setAceitando(null)} style={{ ...OSW, background: '#fff', border: `3px solid ${INK}`, borderRadius: 12, padding: '8px 10px', fontSize: 13 }}>{t('Cancelar', 'Cancel')}</button>
                      </div>
                    </div>
                  )
                })()}
              </div>
            ))}
            <p style={dica}>{t('Quem você aceita entra na virada da temporada, nunca no meio.', 'Whoever you accept joins at the turn of the season, never mid-season.')}</p>
          </div>

          {/* ⚙️ PRÓXIMA TEMPORADA */}
          <div style={sec}>
            <p style={h3}>⚙️ {t('Próxima temporada', 'Next season')}</p>
            <div className="flex" style={{ border: `2px solid ${INK}`, borderRadius: 10, overflow: 'hidden', marginBottom: 6 }}>
              <button style={seg(prx.tam === 10, tamanho === 20)} onClick={() => void salvaFormato(10, false)}>{t('10 times', '10 teams')}{tamanho === 20 ? ' 🔒' : ''}</button>
              <button style={seg(prx.tam === 20)} onClick={() => void salvaFormato(20, prx.turno)}>{t('20 times', '20 teams')}</button>
            </div>
            {prx.tam === 20 && (
              <div className="flex" style={{ border: `2px solid ${INK}`, borderRadius: 10, overflow: 'hidden' }}>
                <button style={seg(!prx.turno)} onClick={() => void salvaFormato(20, false)}>{t('38 rodadas · ida e volta', '38 rounds · home & away')}</button>
                <button style={seg(prx.turno)} onClick={() => void salvaFormato(20, true)}>{t('19 · só ida', '19 · single')}</button>
              </div>
            )}
            <p style={dica}>{t('Vale a partir da próxima temporada. De 20 times nunca volta pra 10.', 'Applies from next season. A 20-team league never goes back to 10.')}{prx.tam === 20 && tamanho === 10 ? t(' Entram 10 bots novos, já com elenco.', ' 10 new bots join, with squads.') : ''}</p>
          </div>

          {/* 🔗 CONVIDAR */}
          <div style={sec}>
            <p style={h3}>🔗 {t('Convidar', 'Invite')}</p>
            <div className="flex items-center gap-2">
              <b style={{ ...OSW, fontSize: 24, letterSpacing: 3 }}>{roomCode}</b>
              <button onClick={() => void copia()} className="ml-auto" style={{ ...OSW, background: copiado ? GREEN : PURPLE, color: '#fff', border: `2px solid ${INK}`, borderRadius: 10, padding: '7px 10px', boxShadow: `2px 2px 0 ${INK}`, fontSize: 12 }}>{copiado ? t('✅ COPIADO', '✅ COPIED') : t('📋 COPIAR CÓDIGO', '📋 COPY CODE')}</button>
            </div>
            <p style={dica}>{t(`Manda o código${roomName ? ` da "${roomName}"` : ''} pro amigo: ele pede pra entrar e o pedido aparece aqui.`, `Send the code${roomName ? ` of "${roomName}"` : ''} to your friend: they ask to join and the request shows up here.`)}</p>
          </div>

          {/* 👥 TÉCNICOS AGORA */}
          <div style={{ ...sec, borderBottom: 'none' }}>
            <p style={h3}>👥 {t('Técnicos agora', 'Managers now')}</p>
            {gente.map(m => {
              const on = m.id === youIdx || presence.includes(m.id)
              return (
                <div key={m.id} className="flex items-center gap-2" style={{ fontSize: 13, padding: '3px 0' }}>
                  <i style={{ width: 10, height: 10, borderRadius: 99, border: `1.5px solid ${INK}`, background: on ? GREEN : '#ccc', flexShrink: 0 }} />
                  <span className="truncate" style={{ fontWeight: 700 }}>{m.teamName || m.name}</span>
                  <small style={{ fontSize: 11, color: 'rgba(0,0,0,.5)', flexShrink: 0 }}>{m.id === youIdx ? t('você', 'you') : on ? '' : t('fora · o time espera ele', 'away · the team waits')}</small>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </>
  )
}

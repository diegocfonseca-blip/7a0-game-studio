// 👁️ ESPECTADOR "FANTASMA" — a espera (28/10, mockup aprovado: scripts/mockups/espectador.png).
// Mostra a sala que ele escolheu assistir enquanto ela ainda não começou (ou entre um leilão e outro) e, quando a partida
// está rolando, entra nela SÓ ASSISTINDO (`ASSISTIR_ONLINE`). Nunca escreve nada: só lê `game_rooms`/`room_players`.
// 💸 Leve: confere só `status`/`host_id` a cada 4s; o estado inteiro (pesado) só é baixado quando a sala diz que começou.
import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useEsc } from './store'
import type { EscState } from './types'
import { tr } from './lang'

const INK = '#0C0C0C'
const ROXO = '#3b2a6b'
const OSWALD = { fontFamily: 'Oswald, sans-serif' } as const

export type SalaAssistida = { id: string; code: string; nome?: string }

// a partida já está de pé? (o mesmo teste da volta de quem cai da sala)
export function partidaRolando(gs: unknown): gs is EscState {
  const g = gs as Partial<EscState> | null
  return !!g && Array.isArray(g.managers) && g.managers.length > 0 && !!g.screen && g.screen !== 'intro' && g.screen !== 'lobby'
}

export function EspectadorEspera({ sala, onSair }: { sala: SalaAssistida; onSair: () => void }) {
  const { state, dispatch } = useEsc()
  const [nomes, setNomes] = useState<string[]>([])
  const [aviso, setAviso] = useState<string | null>(null)
  const ultimoPesado = useRef(0)
  const entrou = useRef(false)
  useEffect(() => {
    let vivo = true
    entrou.current = false
    const confere = async () => {
      if (!vivo || entrou.current) return
      try {
        const { data: u } = await supabase.auth.getUser()
        const eu = u?.user?.id
        if (!eu) { setAviso(tr('Entre na sua conta pra assistir.', 'Log in to watch.')); return }
        const { data: r } = await supabase.from('game_rooms').select('status, host_id').eq('id', sala.id).maybeSingle()
        if (!vivo) return
        if (!r) { setAviso(tr('Essa sala acabou.', 'This room is over.')); return }
        const row = r as { status?: string; host_id?: string }
        const { data: ps } = await supabase.from('room_players').select('manager_name, player_index, user_id').eq('room_id', sala.id).order('player_index')
        if (vivo) setNomes((ps ?? []).map((p: { manager_name?: string | null; user_id?: string }) => `${p.user_id === row.host_id ? '👑' : '⚽'} ${p.manager_name ?? '—'}`))
        if (row.status !== 'started' || !row.host_id) { setAviso(null); return }
        // começou: baixa o estado inteiro (no máximo a cada 6s, enquanto o dono ainda não gravou a partida)
        if (Date.now() - ultimoPesado.current < 6000) return
        ultimoPesado.current = Date.now()
        const { data: g } = await supabase.from('game_rooms').select('game_state, host_id').eq('id', sala.id).maybeSingle()
        const gs = (g as { game_state?: unknown } | null)?.game_state
        const dono = (g as { host_id?: string } | null)?.host_id
        if (!vivo || !dono || !partidaRolando(gs)) return
        entrou.current = true
        dispatch({ type: 'ASSISTIR_ONLINE', state: gs, roomId: sala.id, roomCode: sala.code, youUid: eu, hostUid: dono })
      } catch { /* sem rede: tenta no próximo tique */ }
    }
    void confere()
    const iv = setInterval(() => { void confere() }, 4000)
    return () => { vivo = false; clearInterval(iv) }
  }, [sala.id, sala.code, dispatch])
  void state
  return (
    <div className="min-h-screen px-4 py-8" style={{ background: '#F4ECD6', color: INK }}>
      <div className="max-w-md mx-auto">
        <div style={{ background: ROXO, color: '#fff', border: `3px solid ${INK}`, borderRadius: 16, boxShadow: `4px 4px 0 ${INK}`, padding: '14px 16px' }}>
          <p style={{ ...OSWALD, fontWeight: 900, fontSize: 20, margin: 0, textTransform: 'uppercase' }}>👁️ <span style={{ color: '#FFE14D' }}>{tr('Você está assistindo', 'You are watching')}</span></p>
          <p style={{ fontWeight: 600, fontSize: 13, margin: '4px 0 0', opacity: .9 }}>{tr('Ninguém vê você na lista. Você não dá lance nem escala — só olha e fala no chat.', 'Nobody sees you in the list. You don’t bid or pick a lineup — you just watch and chat.')}</p>
        </div>
        <div style={{ background: '#fff', border: `3px solid ${INK}`, borderRadius: 16, boxShadow: `3px 3px 0 ${INK}`, padding: '12px 14px', marginTop: 14 }}>
          <p style={{ ...OSWALD, fontWeight: 900, fontSize: 17, margin: 0 }}>{sala.nome || sala.code}</p>
          <p style={{ fontWeight: 700, fontSize: 13, margin: '4px 0 10px', color: '#5a5647' }}>
            {aviso ?? tr('⏳ Esperando o dono começar a partida… assim que começar, a tela abre sozinha.', '⏳ Waiting for the host to start… the screen opens by itself when it does.')}
          </p>
          <p style={{ ...OSWALD, fontWeight: 900, fontSize: 13, margin: '0 0 4px' }}>👥 {tr('NA SALA', 'IN THE ROOM')} ({nomes.length})</p>
          {nomes.map((n, i) => <p key={i} style={{ fontWeight: 700, fontSize: 14, margin: 0, padding: '4px 0', borderBottom: '1px dashed rgba(0,0,0,.18)' }}>{n}</p>)}
        </div>
        <button onClick={onSair} style={{ ...OSWALD, marginTop: 14, width: '100%', background: '#fff', color: INK, border: `3px solid ${INK}`, borderRadius: 12, boxShadow: `3px 3px 0 ${INK}`, padding: '10px 0', fontWeight: 900, fontSize: 15, cursor: 'pointer' }}>
          {tr('SAIR ✕', 'LEAVE ✕')}
        </button>
      </div>
    </div>
  )
}

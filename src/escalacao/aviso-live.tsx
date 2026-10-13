// 🚫🔴 AVISO "O DESTAQUE DA SUA SALA SAIU" (Diego 13/10). Quando o Diego tira o destaque de AO VIVO de
// uma sala cujo link não era live de verdade (botão na lista de salas, só ele vê — `esc_live_tirada`),
// o DONO da sala recebe UMA faixa explicando. Fechou, não volta; se o Diego tirar de novo (outra sala,
// outro dia), aparece de novo. Não mexe no jogo: só lê uma tabelinha, e só o dono de sala de stream lê.
// 📡 custo: 1 leitura minúscula a cada 2 min, só pra quem é dono de sala com o Modo Stream ligado.
// 🧹 o "já fechei" mora numa chave SÓ (lista curta), nunca uma chave por sala (regra do storage-guard).
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useEsc } from './store'
import { tr } from './lang'

const CHAVE = 'esc-live-avisos'
const lidos = (): string[] => { try { const v = JSON.parse(localStorage.getItem(CHAVE) ?? '[]'); return Array.isArray(v) ? v : [] } catch { return [] } }
const marcaLido = (k: string) => { try { localStorage.setItem(CHAVE, JSON.stringify([...lidos().filter(x => x !== k), k].slice(-20))) } catch { /* ignora */ } }

export function AvisoDestaqueTirado() {
  const { state } = useEsc()
  const [aviso, setAviso] = useState<string | null>(null)
  const ativo = state.onlineMode === 'online' && !!state.roomId && !!state.isHost && !!state.streamMode
  const sala = state.roomId
  useEffect(() => {
    if (!ativo || !sala) { setAviso(null); return }
    let vivo = true
    const olha = async () => {
      try {
        const { data } = await supabase.from('esc_live_tirada').select('tirada_em').eq('room_id', sala).maybeSingle()
        const t = (data as { tirada_em?: string } | null)?.tirada_em
        if (!vivo || !t) return
        const k = `${sala}|${t}`
        if (!lidos().includes(k)) setAviso(k)
      } catch { /* sem rede: tenta na próxima */ }
    }
    void olha()
    const iv = setInterval(() => { void olha() }, 120_000)
    return () => { vivo = false; clearInterval(iv) }
  }, [ativo, sala])
  if (!aviso) return null
  return (
    <div style={{ position: 'fixed', left: 12, right: 12, top: 12, zIndex: 99996, maxWidth: 460, margin: '0 auto', background: '#fff', color: '#0C0C0C', border: '3px solid #0C0C0C', borderRadius: 14, boxShadow: '4px 4px 0 #0C0C0C', padding: '10px 12px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
      <span style={{ fontSize: 22, lineHeight: 1 }}>📺</span>
      <p style={{ flex: 1, margin: 0, fontSize: 13, fontWeight: 700, lineHeight: 1.35 }}>
        {tr('O destaque de AO VIVO da sua sala saiu: ele só vale com link de transmissão ao vivo. A sala segue normal, nada muda no jogo.',
          'Your room’s LIVE highlight was removed: it only works with a live stream link. The room carries on as normal, nothing changes in the game.')}
      </p>
      <button onClick={() => { marcaLido(aviso); setAviso(null) }} aria-label={tr('Fechar', 'Close')}
        style={{ width: 26, height: 26, borderRadius: 999, border: '2px solid #0C0C0C', background: '#FFC400', fontWeight: 900, cursor: 'pointer', flexShrink: 0 }}>✕</button>
    </div>
  )
}

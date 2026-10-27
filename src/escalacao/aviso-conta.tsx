// ─── 📣 AVISO PRA UMA CONTA (21/10, moderação) ────────────────────────────────────────────────────────────────────
// Diego, sobre a "Sala do Nazistaisaque卍": *"preciso que envie um banner pra essa pessoa que não é permitido criar sala com
// cunho de preconceito… quando ele ver e apertar X não aparece mais pra ele"*. O Diego (ou a sessão, a pedido dele) grava a
// linha em `esc_avisos_conta`; a conta lê os SEUS avisos ainda não vistos UMA vez por login, e o X marca como visto no banco
// (`esc_aviso_visto`) — então não volta nem em outro aparelho. Leitura pequena, nada de canal.
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { supabase } from '../lib/supabase'
import { tr } from './lang'

type Aviso = { id: number; titulo: string; texto: string }

export function AvisoConta() {
  const [avisos, setAvisos] = useState<Aviso[]>([])
  useEffect(() => {
    let vivo = true
    const le = async () => {
      try {
        const { data: u } = await supabase.auth.getUser()
        if (!u.user) { if (vivo) setAvisos([]); return }
        const { data } = await supabase.from('esc_avisos_conta').select('id, titulo, texto').is('visto_em', null).order('id').limit(5)
        if (vivo) setAvisos(Array.isArray(data) ? data as Aviso[] : [])
      } catch { /* sem rede: tenta no próximo login */ }
    }
    void le()
    const { data: sub } = supabase.auth.onAuthStateChange(ev => { if (ev === 'SIGNED_IN' || ev === 'SIGNED_OUT') void le() })
    return () => { vivo = false; sub.subscription.unsubscribe() }
  }, [])
  const a = avisos[0]
  if (!a) return null
  const fecha = () => {
    setAvisos(l => l.slice(1))
    void supabase.rpc('esc_aviso_visto', { p_id: a.id }).then(() => {}, () => {})
  }
  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 99990, background: 'rgba(0,0,0,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div role="alertdialog" style={{ width: '100%', maxWidth: 420, background: '#F4ECD6', color: '#0C0C0C', border: '4px solid #0C0C0C', borderRadius: 16, boxShadow: '4px 4px 0 #000', overflow: 'hidden' }}>
        <div style={{ background: '#C2452F', color: '#fff', display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderBottom: '3px solid #0C0C0C' }}>
          <b style={{ flex: 1, fontFamily: 'Oswald, sans-serif', fontWeight: 800, fontSize: 18, textTransform: 'uppercase', lineHeight: 1.1 }}>{a.titulo}</b>
          <button onClick={fecha} aria-label={tr('fechar', 'close')} style={{ background: '#fff', color: '#0C0C0C', border: '2px solid #0C0C0C', borderRadius: 10, width: 34, height: 34, fontWeight: 900, fontSize: 16, cursor: 'pointer', flex: 'none' }}>✕</button>
        </div>
        <p style={{ margin: 0, padding: '14px 14px 16px', fontSize: 14.5, fontWeight: 600, lineHeight: 1.45 }}>{a.texto}</p>
      </div>
    </div>,
    document.body,
  )
}

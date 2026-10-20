// ─── 🧑‍💼 MEU PRESIDENTE, na 🛒 Loja do Clube (15/10, Diego: "code isso… pro meu usuário apenas") ───────────
//
// Onde o personagem MORA: é da CONTA (e-mail), um só pra tudo. A porta de entrada é a Loja do Clube, porque é
// coisa paga (*"nada é de graça… começa a ganhar boneco apenas no modo craque pra cima"*) — a pessoa vê o boneco,
// o que o plano dela libera e, se quiser mais, os degraus estão logo abaixo na mesma tela. A Presidência da
// carreira abre o MESMO editor e grava no MESMO lugar (`presidente-conta.ts`).
// 🔒 Em teste: só aparece pra quem `presidenteContaLiberado()` deixa.
import { useState } from 'react'
import { createPortal } from 'react-dom'
import { tr, useT } from './lang'
import { PresidenteFormulario } from './presidente-formulario'
import { PresidenteCamadas } from './presidente-camadas'
import { camadasDoPresidente } from './presidente-aparencia'
import { sugestaoPresidente, presidenteCadastrado } from './presidencia-entrada-model'
import { aguardarGravacao } from './presidente-gravacao'
import { getPosseConta, presidenteContaLiberado, salvarPresidenteConta, usePosseConta, usePresidenteConta } from './presidente-conta'
import { podeVestirComPosse, temBoneco } from './presidente-avulsas'
import { aparenciaInicial, aparenciaModular } from './presidente-aparencia'
import type { PresidenteBaseSave } from './presidencia-carreira'

const INK = '#0C0C0C', GOLD = '#FFC400', GREEN = '#1B7A3D', CREAM = '#F4ECD6'
const OSW = { fontFamily: 'Oswald, sans-serif', fontWeight: 700 } as const

/** o cartão "Meu presidente" da Loja (só pra conta liberada) */
export function MeuPresidenteLoja() {
  const t = useT()
  const conta = usePresidenteConta(), posse = usePosseConta(), boneco = temBoneco(posse)
  const [editando, setEditando] = useState(false)
  if (!presidenteContaLiberado()) return null
  const v = conta.value
  const card: React.CSSProperties = { background: '#fff', border: `3px solid ${INK}`, borderRadius: 14, boxShadow: `3px 3px 0 ${INK}`, padding: 10, display: 'flex', gap: 12, alignItems: 'center' }
  return <>
    <h2 id="loja-presidente" style={{ ...OSW, fontSize: 19, textTransform: 'uppercase', margin: '18px 0 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
      {t('🧑‍💼 Meu presidente', '🧑‍💼 My president')} <span style={{ fontFamily: 'Arial, sans-serif', fontSize: 11, fontWeight: 700, textTransform: 'none', color: 'rgba(12,12,12,.55)' }}>{t('você, no jogo', 'you, in the game')}</span>
    </h2>
    <div style={card}>
      <div style={{ width: 96, flex: '0 0 96px', background: CREAM, border: `2px solid ${INK}`, borderRadius: 10, overflow: 'hidden' }}>
        {v ? <PresidenteCamadas ids={camadasDoPresidente(v)} /> : <div style={{ aspectRatio: '2/3', display: 'grid', placeItems: 'center', fontSize: 40 }}>🧑‍💼</div>}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <b style={{ ...OSW, fontSize: 17, display: 'block', textTransform: 'uppercase' }}>{v ? v.name : t('Crie o seu presidente', 'Create your president')}</b>
        <small style={{ fontSize: 11.5, fontWeight: 700, lineHeight: 1.35, display: 'block', color: 'rgba(12,12,12,.7)' }}>
          {conta.status === 'carregando' ? t('Carregando…', 'Loading…')
            : v ? t('É você em todo canto do jogo: sala, chat, pódio e jornal. Troque roupa, cabelo e barba quando quiser.', 'It’s you everywhere in the game: room, chat, podium and newspaper. Change outfit, hair and beard whenever you like.')
            : !boneco ? t('🛍️ Compre sua primeira roupa e ganhe seu presidente: careca, do seu tom de pele. Depois é só ir montando.', '🛍️ Buy your first outfit and get your president: bald, in your skin tone. Then keep building it up.')
            : t('Pele, cabelo, barba e roupas do seu plano. Fica salvo na sua conta e vale pra carreira e pro online.', 'Skin, hair, beard and your plan’s outfits. Saved on your account, for career and online.')}
        </small>
      </div>
      <button onClick={() => setEditando(true)} style={{ ...OSW, fontSize: 14, background: v ? '#fff' : boneco ? GREEN : GOLD, color: v ? INK : boneco ? '#fff' : INK, border: `2px solid ${INK}`, borderRadius: 9, padding: '6px 10px', boxShadow: `2px 2px 0 ${INK}`, whiteSpace: 'nowrap', cursor: 'pointer' }}>
        {v ? t('EDITAR', 'EDIT') : boneco ? t('CRIAR', 'CREATE') : t('MONTAR', 'BUILD')}
      </button>
    </div>
    {editando && <PresidenteContaEditor saved={v} onClose={() => setEditando(false)} />}
  </>
}

/** o editor em tela cheia, gravando na CONTA */
function PresidenteContaEditor({ saved, onClose }: { saved: PresidenteBaseSave | null; onClose: () => void }) {
  const t = useT()
  // 🆓 sem plano: o boneco que vem com a 1ª roupa é CARECA e sem barba (19/10) — o rascunho já nasce assim
  const [draft, setDraft] = useState<PresidenteBaseSave>(() => {
    const d = sugestaoPresidente(saved ?? undefined)
    const posse = getPosseConta()
    if (saved || posse.plano) return d
    const minha = posse.compradas.find(r => r.startsWith('r-'))?.slice(2) // já comprou roupa: começa vestido com ela
    return { ...d, ...(minha && podeVestirComPosse(minha, posse) ? { outfit: minha } : {}), appearance: { ...aparenciaModular(d.appearance ?? aparenciaInicial()), hair: 'none', beard: 'none', accessories: [] } }
  })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const confirmar = async () => {
    if (busy || !presidenteCadastrado(draft)) return
    setBusy(true); setError('')
    const r = await aguardarGravacao(() => salvarPresidenteConta({ ...draft, name: draft.name.trim() }))
    setBusy(false)
    if (r === 'accepted') { onClose(); return }
    setError(r === 'timeout'
      ? t('A gravação está demorando. Suas escolhas continuam aqui; tente de novo.', 'Saving is taking longer than expected. Your choices are still here; try again.')
      : t('Não foi possível salvar na sua conta. Confira se todas as peças já são suas e tente de novo.', 'Could not save to your account. Check that every item is yours and try again.'))
  }
  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 99998, background: CREAM, color: INK, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
      <div style={{ position: 'sticky', top: 0, zIndex: 3, background: INK, padding: '11px 15px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ ...OSW, fontSize: 17, textTransform: 'uppercase', color: GOLD }}>{tr('🧑‍💼 Meu presidente', '🧑‍💼 My president')}</span>
        <button onClick={onClose} aria-label={tr('fechar', 'close')} style={{ marginLeft: 'auto', background: 'transparent', color: '#fff', border: '2px solid rgba(255,255,255,.35)', borderRadius: 10, padding: '4px 10px', fontWeight: 900, cursor: 'pointer' }}>✕</button>
      </div>
      <div style={{ maxWidth: 980, margin: '0 auto', padding: '14px 15px 40px' }}>
        <PresidenteFormulario value={draft} onChange={v => { setDraft(v); setError('') }} onConfirm={() => void confirmar()} onBack={onClose} busy={busy} error={error} editing={!!saved} existing={false} intro={t('Ele é você no jogo. Fica salvo na sua conta e vale pra carreira e pro online.','This is you in the game. Saved on your account, for career and online.')} />
      </div>
    </div>,
    document.body,
  )
}

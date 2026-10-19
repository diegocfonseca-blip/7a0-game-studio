// ☁️ SALVAR NA NUVEM É DOS PLANOS (19/10, mockup `scripts/mockups/salvar-gratis.png`, Diego: "aprova").
// Um amigo dele achou que o salvar da carreira estava com bug: era conta grátis (desde 07/10 carreira nova de quem não paga
// fica só no aparelho) e o aviso era uma faixinha que sumia em 2 s. Agora, ao apertar 💾 Salvar (ou 🚪 Sair e salvar) SEM
// plano, abre esta janela. Ordem dele: *"não precisa falar que tá salvo no celular… bota só os planos, Craque, Lenda, e embaixo
// 'conheça todos os planos'"* — que abre a vitrine com TODOS.
import { useState } from 'react'
import { createPortal } from 'react-dom'
import { tr } from './lang'
import { PixMP } from './pix-mp'
import { PRECOS_UNICO } from './planos-regras'
import { usePixMp } from './sport'
import { logApoio } from './apoio'

const INK = '#0C0C0C', GOLD = '#FFC400', GREEN = '#1B7A3D', ROXO = '#7C3AED'
const OSW = { fontFamily: 'Oswald, sans-serif', fontWeight: 700 } as const
const abre = (alvo: string) => { window.location.href = `${window.location.origin}${window.location.pathname}?apoie=${alvo}` }

export function JanelaNuvemPlanos({ onClose }: { onClose: () => void }) {
  const pixMp = usePixMp()
  const [pagando, setPagando] = useState<'craque' | 'lenda' | null>(null)
  const escolhe = (p: 'craque' | 'lenda') => {
    logApoio(`☁️ salvar sem plano → ${p}`)
    if (pixMp) setPagando(v => v === p ? null : p)
    else abre(p === 'lenda' ? 'lenda' : 'craque')
  }
  const Plano = ({ p, nome, sub, grad }: { p: 'craque' | 'lenda'; nome: string; sub: string; grad: string }) => (
    <div style={{ marginBottom: 9 }}>
      <button onClick={() => escolhe(p)} style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, textAlign: 'left', border: `3px solid ${INK}`, borderRadius: 14, padding: '10px 12px', background: grad, boxShadow: `3px 3px 0 ${INK}`, cursor: 'pointer', color: INK }}>
        <span><b style={{ ...OSW, fontSize: 17, display: 'block', textTransform: 'uppercase' }}>{nome}</b><small style={{ fontSize: 11.5, fontWeight: 700, opacity: .8 }}>{sub}</small></span>
        <span style={{ ...OSW, fontSize: 16, background: GREEN, color: '#fff', border: `2px solid ${INK}`, borderRadius: 10, padding: '6px 10px', boxShadow: `2px 2px 0 ${INK}`, whiteSpace: 'nowrap' }}>R$ {PRECOS_UNICO[p].toFixed(2).replace('.', ',')}</span>
      </button>
      {pagando === p && <div style={{ marginTop: 8 }}><PixMP produto={p} valor={PRECOS_UNICO[p]} /></div>}
    </div>
  )
  return createPortal(
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 99985, background: 'rgba(0,0,0,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 14 }}>
      <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 420, maxHeight: '92vh', overflowY: 'auto', color: INK, background: '#F4ECD6', border: `3px solid ${INK}`, borderRadius: 20, boxShadow: `5px 5px 0 ${INK}`, padding: 14 }}>
        <div style={{ ...OSW, background: INK, color: GOLD, borderRadius: 12, padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 16 }}>
          <span>☁️ {tr('SALVAR NA NUVEM', 'SAVE TO THE CLOUD')}</span>
          <button onClick={onClose} aria-label={tr('Fechar', 'Close')} style={{ all: 'unset', cursor: 'pointer', color: GOLD, fontSize: 18 }}>✕</button>
        </div>
        <p style={{ fontSize: 14, fontWeight: 700, margin: '12px 2px 10px' }}>{tr('Pra salvar a sua carreira na nuvem, escolha um plano:', 'To save your career to the cloud, pick a plan:')}</p>
        <Plano p="craque" nome={tr('⭐ Craque', '⭐ Star')} sub={tr('nuvem · Modo Manual · cor prata', 'cloud · Manual Mode · silver colour')} grad="linear-gradient(160deg,#F4F7FB,#CBD4DE 52%,#9BA7B5)" />
        <Plano p="lenda" nome={tr('👑 Lenda', '👑 Legend')} sub={tr('tudo do Craque + salas à vontade · cor ouro', 'everything in Star + unlimited rooms · gold colour')} grad="linear-gradient(160deg,#FFE79A,#FFC400 40%,#E8A200 70%,#FFDD70)" />
        <button onClick={() => { logApoio('☁️ salvar sem plano → todos os planos'); abre('nuvem') }} style={{ all: 'unset', display: 'block', width: '100%', textAlign: 'center', cursor: 'pointer', ...OSW, fontSize: 15, color: ROXO, textDecoration: 'underline', marginTop: 4 }}>
          {tr('Conheça todos os planos →', 'See all the plans →')}
        </button>
      </div>
    </div>,
    document.body,
  )
}

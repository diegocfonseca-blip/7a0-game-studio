// ☁️ SALVAR NA NUVEM É DOS PLANOS (19/10, mockup `scripts/mockups/salvar-gratis.png`, Diego: "aprova").
// Um amigo dele achou que o salvar da carreira estava com bug: era conta grátis (desde 07/10 carreira nova de quem não paga
// fica só no aparelho) e o aviso era uma faixinha que sumia em 2 s. Agora, ao apertar 💾 Salvar (ou 🚪 Sair e salvar) SEM
// plano, abre esta janela. Ordem dele: *"não precisa falar que tá salvo no celular… bota só os planos, Craque, Lenda, e embaixo
// 'conheça todos os planos'"* — que abre a vitrine com TODOS.
import { createPortal } from 'react-dom'
import { tr } from './lang'
import { MENSAIS } from './planos-regras'
import { logApoio } from './apoio'
import { assinarMensal } from './vendria-checkout'

const INK = '#0C0C0C', GOLD = '#FFC400', GREEN = '#1B7A3D', ROXO = '#7C3AED'
const OSW = { fontFamily: 'Oswald, sans-serif', fontWeight: 700 } as const
const abre = (alvo: string) => { window.location.href = `${window.location.origin}${window.location.pathname}?apoie=${alvo}` }

/** Oferta da nuvem; conta grátis continua podendo salvar no aparelho, nos dois modos. */
export function JanelaNuvemPlanos({ onClose, travado }: { onClose: () => void; travado?: boolean }) {
  return createPortal(
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 99985, background: 'rgba(0,0,0,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 14 }}>
      <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 420, maxHeight: '92vh', overflowY: 'auto', color: INK, background: '#F4ECD6', border: `3px solid ${INK}`, borderRadius: 20, boxShadow: `5px 5px 0 ${INK}`, padding: 14 }}>
        <div style={{ ...OSW, background: INK, color: GOLD, borderRadius: 12, padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 16 }}>
          <span>{travado ? <>🔒 {tr('SALVAR CARREIRA', 'SAVE CAREER')}</> : <>☁️ {tr('SALVAR NA NUVEM', 'SAVE TO THE CLOUD')}</>}</span>
          <button onClick={onClose} aria-label={tr('Fechar', 'Close')} style={{ all: 'unset', cursor: 'pointer', color: GOLD, fontSize: 18 }}>✕</button>
        </div>
        {travado ? <>
            <p style={{ fontSize: 14, fontWeight: 700, margin: '12px 2px 10px', lineHeight: 1.35 }}>{tr('Sua conta grátis salva a carreira neste aparelho. Para salvar também na nuvem e continuar em outro aparelho, escolha um plano:', 'Your free account saves your career on this device. To also save to the cloud and continue on another device, choose a plan:')}</p>
            <div style={{ marginBottom: 9 }}>
              <button onClick={() => { logApoio('🔒 salvar carreira → Craque Salas (Vendria)'); void assinarMensal('craque_salas', tr) }} style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, textAlign: 'left', border: `3px solid ${INK}`, borderRadius: 14, padding: '10px 12px', background: 'linear-gradient(160deg,#E9E2FF,#C9B8FF 52%,#A48BF0)', color: INK, boxShadow: `3px 3px 0 ${INK}`, cursor: 'pointer' }}>
                <span><b style={{ ...OSW, fontSize: 17, display: 'block', textTransform: 'uppercase' }}>{tr('🎟️ Craque Salas', '🎟️ Craque Salas')}</b><small style={{ fontSize: 11.5, fontWeight: 700, opacity: .8 }}>{tr('nuvem da carreira · salas à vontade · por mês', 'career cloud saves · unlimited rooms · monthly')}</small></span>
                <span style={{ ...OSW, fontSize: 16, background: GREEN, color: '#fff', border: `2px solid ${INK}`, borderRadius: 10, padding: '6px 10px', boxShadow: `2px 2px 0 ${INK}`, whiteSpace: 'nowrap' }}>R$ {MENSAIS.craque_salas.preco.toFixed(2).replace('.', ',')}{tr('/mês', '/mo')}</span>
              </button>
            </div>
          </>
          : <p style={{ fontSize: 14, fontWeight: 700, margin: '12px 2px 10px' }}>{tr('Pra salvar a sua carreira na nuvem, escolha um plano:', 'To save your career to the cloud, pick a plan:')}</p>}
        {/* 08/11 (Diego: "tá errado os planos"): no cadeado do Salvar, os planos de HOJE que salvam a carreira — os mensais */}
        {<div style={{ marginBottom: 9 }}>
          <button onClick={() => { logApoio('🔒 salvar carreira → Craque Completo (Vendria)'); void assinarMensal('craque_completo', tr) }} style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, textAlign: 'left', border: `3px solid ${INK}`, borderRadius: 14, padding: '10px 12px', background: 'linear-gradient(160deg,#F4F7FB,#CBD4DE 52%,#9BA7B5)', boxShadow: `3px 3px 0 ${INK}`, cursor: 'pointer', color: INK }}>
            <span><b style={{ ...OSW, fontSize: 17, display: 'block', textTransform: 'uppercase' }}>{tr('⭐ Craque Completo', '⭐ Craque Completo')}</b><small style={{ fontSize: 11.5, fontWeight: 700, opacity: .8 }}>{tr('nuvem da carreira · Modo Manual · velocidade', 'career cloud saves · Manual Mode · speed')}</small></span>
            <span style={{ ...OSW, fontSize: 16, background: GREEN, color: '#fff', border: `2px solid ${INK}`, borderRadius: 10, padding: '6px 10px', boxShadow: `2px 2px 0 ${INK}`, whiteSpace: 'nowrap' }}>R$ {MENSAIS.craque_completo.preco.toFixed(2).replace('.', ',')}{tr('/mês', '/mo')}</span>
          </button>
        </div>}
        {<button onClick={() => { logApoio('☁️ salvar sem plano → todos os planos'); abre('nuvem') }} style={{ all: 'unset', display: 'block', width: '100%', textAlign: 'center', cursor: 'pointer', ...OSW, fontSize: 15, color: ROXO, textDecoration: 'underline', marginTop: 4 }}>
          {tr('Conheça todos os planos →', 'See all the plans →')}
        </button>}
      </div>
    </div>,
    document.body,
  )
}

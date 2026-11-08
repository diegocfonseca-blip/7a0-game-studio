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

/** `aviso7` (26/10): a conta sem plano acabou de salvar na nuvem pela 1ª vez — a janela avisa do prazo de 7 dias */
/** `travado` (04/11): sem plano a carreira não salva mais (nem no aparelho) — a janela abre no 🔒 Salvar com o Craque Salas no topo */
export function JanelaNuvemPlanos({ onClose, aviso7, travado }: { onClose: () => void; aviso7?: boolean; travado?: boolean }) {
  return createPortal(
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 99985, background: 'rgba(0,0,0,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 14 }}>
      <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 420, maxHeight: '92vh', overflowY: 'auto', color: INK, background: '#F4ECD6', border: `3px solid ${INK}`, borderRadius: 20, boxShadow: `5px 5px 0 ${INK}`, padding: 14 }}>
        <div style={{ ...OSW, background: INK, color: GOLD, borderRadius: 12, padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 16 }}>
          <span>{travado ? <>🔒 {tr('SALVAR CARREIRA', 'SAVE CAREER')}</> : aviso7 ? <>✅ {tr('CARREIRA SALVA', 'CAREER SAVED')}</> : <>☁️ {tr('SALVAR NA NUVEM', 'SAVE TO THE CLOUD')}</>}</span>
          <button onClick={onClose} aria-label={tr('Fechar', 'Close')} style={{ all: 'unset', cursor: 'pointer', color: GOLD, fontSize: 18 }}>✕</button>
        </div>
        {aviso7 ? <div style={{ fontSize: 13.5, fontWeight: 700, margin: '12px 2px 10px', lineHeight: 1.4 }}>{/* 🎁 08/11: teste de 5 dias (texto do Diego) */}
          <p style={{ ...OSW, fontSize: 19, lineHeight: 1.15, margin: '0 0 8px', textTransform: 'uppercase' }}>{tr('🎁 Seus primeiros 5 dias salvando a carreira são grátis!', '🎁 Your first 5 days of saving your career are free!')}</p>
          <p style={{ margin: '0 0 8px' }}>{tr('Salve seu progresso e continue de onde parou.', 'Save your progress and pick up where you left off.')}</p>
          <p style={{ margin: 0, fontWeight: 600, background: '#fff', border: `2.5px solid ${INK}`, borderRadius: 12, padding: '8px 10px' }}>{tr('Depois do teste, você pode continuar jogando gratuitamente. Para salvar novos avanços, é necessário um plano.', 'After the trial you can keep playing for free. To save new progress, you need a plan.')}</p>
        </div>
          : travado ? <>
            <p style={{ fontSize: 14, fontWeight: 700, margin: '12px 2px 10px', lineHeight: 1.35 }}>{tr('🎁 Seu teste de 5 dias salvando a carreira acabou. Você pode continuar jogando de graça — o que já foi salvo continua lá. Para salvar novos avanços, escolha um plano:', '🎁 Your 5-day saving trial is over. You can keep playing for free — what was saved stays there. To save new progress, pick a plan:')}</p>
            <div style={{ marginBottom: 9 }}>
              <button onClick={() => { logApoio('🔒 salvar carreira → Craque Salas (Vendria)'); void assinarMensal('craque_salas', tr) }} style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, textAlign: 'left', border: `3px solid ${INK}`, borderRadius: 14, padding: '10px 12px', background: 'linear-gradient(160deg,#E9E2FF,#C9B8FF 52%,#A48BF0)', color: INK, boxShadow: `3px 3px 0 ${INK}`, cursor: 'pointer' }}>
                <span><b style={{ ...OSW, fontSize: 17, display: 'block', textTransform: 'uppercase' }}>{tr('🎟️ Craque Salas', '🎟️ Craque Salas')}</b><small style={{ fontSize: 11.5, fontWeight: 700, opacity: .8 }}>{tr('salva a carreira · salas à vontade · por mês', 'saves your career · unlimited rooms · monthly')}</small></span>
                <span style={{ ...OSW, fontSize: 16, background: GREEN, color: '#fff', border: `2px solid ${INK}`, borderRadius: 10, padding: '6px 10px', boxShadow: `2px 2px 0 ${INK}`, whiteSpace: 'nowrap' }}>R$ {MENSAIS.craque_salas.preco.toFixed(2).replace('.', ',')}{tr('/mês', '/mo')}</span>
              </button>
            </div>
          </>
          : <p style={{ fontSize: 14, fontWeight: 700, margin: '12px 2px 10px' }}>{tr('Pra salvar a sua carreira na nuvem, escolha um plano:', 'To save your career to the cloud, pick a plan:')}</p>}
        {/* 08/11 (Diego: "tá errado os planos"): no cadeado do Salvar, os planos de HOJE que salvam a carreira — os mensais */}
        {!aviso7 && <div style={{ marginBottom: 9 }}>
          <button onClick={() => { logApoio('🔒 salvar carreira → Craque Completo (Vendria)'); void assinarMensal('craque_completo', tr) }} style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, textAlign: 'left', border: `3px solid ${INK}`, borderRadius: 14, padding: '10px 12px', background: 'linear-gradient(160deg,#F4F7FB,#CBD4DE 52%,#9BA7B5)', boxShadow: `3px 3px 0 ${INK}`, cursor: 'pointer', color: INK }}>
            <span><b style={{ ...OSW, fontSize: 17, display: 'block', textTransform: 'uppercase' }}>{tr('⭐ Craque Completo', '⭐ Craque Completo')}</b><small style={{ fontSize: 11.5, fontWeight: 700, opacity: .8 }}>{tr('salva a carreira · Modo Manual · velocidade', 'saves your career · Manual Mode · speed')}</small></span>
            <span style={{ ...OSW, fontSize: 16, background: GREEN, color: '#fff', border: `2px solid ${INK}`, borderRadius: 10, padding: '6px 10px', boxShadow: `2px 2px 0 ${INK}`, whiteSpace: 'nowrap' }}>R$ {MENSAIS.craque_completo.preco.toFixed(2).replace('.', ',')}{tr('/mês', '/mo')}</span>
          </button>
        </div>}
        {aviso7 && <button onClick={() => { logApoio('🎁 teste 5 dias → conhecer os planos'); abre('nuvem') }} style={{ width: '100%', border: `3px solid ${INK}`, borderRadius: 14, padding: '11px 12px', background: GOLD, color: INK, boxShadow: `3px 3px 0 ${INK}`, cursor: 'pointer', ...OSW, fontSize: 17, textTransform: 'uppercase', marginBottom: 8 }}>{tr('Conhecer os planos', 'See the plans')}</button>}
        {!aviso7 && <button onClick={() => { logApoio('☁️ salvar sem plano → todos os planos'); abre('nuvem') }} style={{ all: 'unset', display: 'block', width: '100%', textAlign: 'center', cursor: 'pointer', ...OSW, fontSize: 15, color: ROXO, textDecoration: 'underline', marginTop: 4 }}>
          {tr('Conheça todos os planos →', 'See all the plans →')}
        </button>}
      </div>
    </div>,
    document.body,
  )
}

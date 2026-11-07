// ☁️ SALVAR NA NUVEM É DOS PLANOS (19/10, mockup `scripts/mockups/salvar-gratis.png`, Diego: "aprova").
// Um amigo dele achou que o salvar da carreira estava com bug: era conta grátis (desde 07/10 carreira nova de quem não paga
// fica só no aparelho) e o aviso era uma faixinha que sumia em 2 s. Agora, ao apertar 💾 Salvar (ou 🚪 Sair e salvar) SEM
// plano, abre esta janela. Ordem dele: *"não precisa falar que tá salvo no celular… bota só os planos, Craque, Lenda, e embaixo
// 'conheça todos os planos'"* — que abre a vitrine com TODOS.
import { useState } from 'react'
import { createPortal } from 'react-dom'
import { tr } from './lang'
import { PixMP } from './pix-mp'
import { MENSAIS, PRECOS_UNICO } from './planos-regras'
import { usePixMp } from './sport'
import { logApoio } from './apoio'
import { assinarMensal } from './vendria-checkout'

const INK = '#0C0C0C', GOLD = '#FFC400', GREEN = '#1B7A3D', ROXO = '#7C3AED'
const OSW = { fontFamily: 'Oswald, sans-serif', fontWeight: 700 } as const
const abre = (alvo: string) => { window.location.href = `${window.location.origin}${window.location.pathname}?apoie=${alvo}` }

/** `aviso7` (26/10): a conta sem plano acabou de salvar na nuvem pela 1ª vez — a janela avisa do prazo de 7 dias */
/** `travado` (04/11): sem plano a carreira não salva mais (nem no aparelho) — a janela abre no 🔒 Salvar com o Craque Salas no topo */
export function JanelaNuvemPlanos({ onClose, aviso7, travado }: { onClose: () => void; aviso7?: boolean; travado?: boolean }) {
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
          <span>{travado ? <>🔒 {tr('SALVAR CARREIRA', 'SAVE CAREER')}</> : aviso7 ? <>✅ {tr('SALVO NA NUVEM', 'SAVED TO THE CLOUD')}</> : <>☁️ {tr('SALVAR NA NUVEM', 'SAVE TO THE CLOUD')}</>}</span>
          <button onClick={onClose} aria-label={tr('Fechar', 'Close')} style={{ all: 'unset', cursor: 'pointer', color: GOLD, fontSize: 18 }}>✕</button>
        </div>
        {aviso7 ? <div style={{ fontSize: 13.5, fontWeight: 700, margin: '12px 2px 10px', lineHeight: 1.4 }}>{/* 💛 07/11: a história do jogo, curta (Diego) */}
          <p style={{ margin: '0 0 8px' }}>{tr('✅ Sua carreira está salva!', '✅ Your career is saved!')}</p>
          <p style={{ margin: '0 0 8px', fontWeight: 600 }}>{tr('Criei o Leilão Legends pro meu filho. Quanto mais gente chega, mais caro fica manter o jogo no ar.', 'I made Leilão Legends for my son. The more people arrive, the more it costs to keep the game online.')}</p>
          <p style={{ margin: '0 0 8px', background: '#fff', border: `2.5px solid ${INK}`, borderRadius: 12, padding: '8px 10px' }}><b>{tr('Sem plano', 'Without a plan')}</b>{tr(': 1 carreira só, e ', ': only 1 career, and ')}<b>{tr('1 dia sem você salvar', '1 day without you saving')}</b>{tr(' ela é apagada da nuvem.', ' it is deleted from the cloud.')}</p>
          <p style={{ margin: 0, fontWeight: 600 }}>{tr('Com plano ela fica guardada ', 'With a plan it stays saved ')}<b>{tr('pra sempre', 'forever')}</b>{tr('. 💛 Diego', '. 💛 Diego')}</p>
        </div>
          : travado ? <>
            <p style={{ fontSize: 14, fontWeight: 700, margin: '12px 2px 10px', lineHeight: 1.35 }}>{tr('Sem plano, a carreira não fica salva. Escolha um plano e não perca nada do que você jogou:', 'Without a plan your career is not saved. Pick a plan and lose nothing you played:')}</p>
            <div style={{ marginBottom: 9 }}>
              <button onClick={() => { logApoio('🔒 salvar carreira → Craque Salas (Vendria)'); void assinarMensal('craque_salas', tr) }} style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, textAlign: 'left', border: `3px solid ${INK}`, borderRadius: 14, padding: '10px 12px', background: 'linear-gradient(160deg,#E9E2FF,#C9B8FF 52%,#A48BF0)', color: INK, boxShadow: `3px 3px 0 ${INK}`, cursor: 'pointer' }}>
                <span><b style={{ ...OSW, fontSize: 17, display: 'block', textTransform: 'uppercase' }}>{tr('🎟️ Craque Salas', '🎟️ Craque Salas')}</b><small style={{ fontSize: 11.5, fontWeight: 700, opacity: .8 }}>{tr('salva a carreira · salas à vontade · por mês', 'saves your career · unlimited rooms · monthly')}</small></span>
                <span style={{ ...OSW, fontSize: 16, background: GREEN, color: '#fff', border: `2px solid ${INK}`, borderRadius: 10, padding: '6px 10px', boxShadow: `2px 2px 0 ${INK}`, whiteSpace: 'nowrap' }}>R$ 9,90{tr('/mês', '/mo')}</span>
              </button>
            </div>
          </>
          : <p style={{ fontSize: 14, fontWeight: 700, margin: '12px 2px 10px' }}>{tr('Pra salvar a sua carreira na nuvem, escolha um plano:', 'To save your career to the cloud, pick a plan:')}</p>}
        {aviso7 ? <div style={{ marginBottom: 9 }}>{/* 07/11 (Diego): só o Craque Completo (é o que traz o Manual) e embaixo todos os planos */}
          <button onClick={() => { logApoio('☁️ 1º salvar grátis → Craque Completo (Vendria)'); void assinarMensal('craque_completo', tr) }} style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, textAlign: 'left', border: `3px solid ${INK}`, borderRadius: 14, padding: '10px 12px', background: 'linear-gradient(160deg,#F4F7FB,#CBD4DE 52%,#9BA7B5)', boxShadow: `3px 3px 0 ${INK}`, cursor: 'pointer', color: INK }}>
            <span><b style={{ ...OSW, fontSize: 17, display: 'block', textTransform: 'uppercase' }}>{tr('⭐ Craque Completo', '⭐ Craque Completo')}</b><small style={{ fontSize: 11.5, fontWeight: 700, opacity: .8 }}>{tr('carreira guardada · Modo Manual · velocidade', 'career kept · Manual Mode · speed')}</small></span>
            <span style={{ ...OSW, fontSize: 16, background: GREEN, color: '#fff', border: `2px solid ${INK}`, borderRadius: 10, padding: '6px 10px', boxShadow: `2px 2px 0 ${INK}`, whiteSpace: 'nowrap' }}>R$ {MENSAIS.craque_completo.preco.toFixed(2).replace('.', ',')}{tr('/mês', '/mo')}</span>
          </button>
        </div> : <>
        <Plano p="craque" nome={tr('⭐ Craque', '⭐ Star')} sub={tr('nuvem · Modo Manual · cor prata', 'cloud · Manual Mode · silver colour')} grad="linear-gradient(160deg,#F4F7FB,#CBD4DE 52%,#9BA7B5)" />
        <Plano p="lenda" nome={tr('👑 Lenda', '👑 Legend')} sub={tr('tudo do Craque + salas à vontade · cor ouro', 'everything in Star + unlimited rooms · gold colour')} grad="linear-gradient(160deg,#FFE79A,#FFC400 40%,#E8A200 70%,#FFDD70)" /></>}
        <button onClick={() => { logApoio('☁️ salvar sem plano → todos os planos'); abre('nuvem') }} style={{ all: 'unset', display: 'block', width: '100%', textAlign: 'center', cursor: 'pointer', ...OSW, fontSize: 15, color: ROXO, textDecoration: 'underline', marginTop: 4 }}>
          {aviso7 ? tr('Ver todos os planos →', 'See all the plans →') : tr('Conheça todos os planos →', 'See all the plans →')}
        </button>
      </div>
    </div>,
    document.body,
  )
}

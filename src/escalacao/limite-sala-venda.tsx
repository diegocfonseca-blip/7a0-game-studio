// 🏟️💳 LIMITE DA SALA = TELA DE VENDA (03/11, mockup scripts/mockups/limite-sala-venda.png, Diego: "Sim pode fazer e publicar").
// Números de 7 dias antes da mudança: 1.182 pessoas bateram no limite (7.184 vezes) e só ~2% foram pros planos.
// Regras dele no caminho: o ⭐ Craque Salas CONTINUA no Vendria (Pix automático recorrente — "isso ajuda a não ser só 30 dias");
// o 🎟️ fica DO LADO pra pessoa comparar sozinha, chamado "3 SALAS EXTRAS"; NADA de frase de comparação ("+R$ 5", "mês inteiro"),
// nem "acabou, acabou", nem "cancela quando quiser"/Pix automático repetido embaixo; o topo é o MESMO texto de antes.
import { useState } from 'react'
import { tr } from './lang'
import { logApoio } from './apoio'
import { assinarMensal } from './vendria-checkout'
import { PixMP } from './pix-mp'
import { ApoieButton } from './screens'

const INK = '#0C0C0C'
const OSW = { fontFamily: 'Oswald, sans-serif', fontWeight: 900 } as const
const GOLD = 'linear-gradient(160deg,#FFE79A,#FFC400 40%,#E8A200 70%,#FFDD70)'
const PRATA = 'linear-gradient(160deg,#F4F7FB,#CBD4DE 52%,#9BA7B5)'

export function LimiteSalaVenda({ onPagou }: { onPagou: () => void }) {
  const [pix, setPix] = useState(false)
  const cartao = { position: 'relative', textAlign: 'center', border: `3px solid ${INK}`, borderRadius: 16, boxShadow: `3px 3px 0 ${INK}`, padding: '12px 8px 10px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 } as const
  return (
    <div style={{ background: '#F4ECD6', color: INK, border: `4px solid ${INK}`, borderRadius: 18, boxShadow: `4px 4px 0 ${INK}`, padding: 12, margin: '8px 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: INK, color: '#fff', borderRadius: 14, padding: '10px 12px' }}>
        <span style={{ fontSize: 28 }}>🏟️</span>
        <div>
          <b style={{ ...OSW, fontSize: 16, display: 'block' }}>{tr('HOJE VOCÊ JÁ CRIOU A SUA SALA', 'YOU ALREADY CREATED YOUR ROOM TODAY')}</b>
          <span style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#ddd', lineHeight: 1.4, marginTop: 3 }}>
            {tr('Dá pra criar 1 sala por dia — amanhã libera outra. Mas ', 'You can create 1 room per day — another one unlocks tomorrow. But ')}
            <b style={{ color: '#FFC400' }}>{tr('entrar em qualquer sala aberta é sempre de graça', 'joining any open room is always free')}</b>
            {tr(': é só escolher uma em "Salas abertas".', ': just pick one in "Open rooms".')}
          </span>
        </div>
      </div>

      <p style={{ ...OSW, textAlign: 'center', fontSize: 15, letterSpacing: 1, margin: '14px 0 8px' }}>{tr('QUAL É A SUA?', 'WHICH ONE IS YOURS?')}</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.25fr', gap: 10, alignItems: 'end' }}>
        <div style={{ ...cartao, background: '#fff' }}>
          <span style={{ fontSize: 26 }}>🎟️</span>
          <b style={{ ...OSW, fontSize: 15 }}>{tr('3 SALAS EXTRAS', '3 EXTRA ROOMS')}</b>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 2, marginBottom: 8 }}><span style={{ ...OSW, fontSize: 13 }}>R$</span><b style={{ ...OSW, fontSize: 32, lineHeight: 1 }}>4,90</b></div>
          <button onClick={() => { logApoio('🏟️ limite de sala → 3 salas (Pix)'); setPix(v => !v) }}
            style={{ ...OSW, width: '100%', background: '#1B7A3D', color: '#fff', fontSize: 14, border: `3px solid ${INK}`, borderRadius: 10, padding: '7px 6px', cursor: 'pointer' }}>{tr('PIX AQUI', 'PIX HERE')}</button>
        </div>
        <div style={{ ...cartao, background: PRATA, borderWidth: 4, boxShadow: `5px 5px 0 ${INK}` }}>
          <span style={{ fontSize: 26 }}>⭐</span>
          <b style={{ ...OSW, fontSize: 16 }}>{tr('CRAQUE SALAS', 'STAR ROOMS')}</b>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 2 }}><span style={{ ...OSW, fontSize: 13 }}>R$</span><b style={{ ...OSW, fontSize: 42, lineHeight: 1 }}>9,90</b><span style={{ ...OSW, fontSize: 13 }}>{tr('/mês', '/mo')}</span></div>
          <span style={{ fontSize: 11.5, fontWeight: 800, marginBottom: 6 }}>{tr('salas À VONTADE, todo dia', 'UNLIMITED rooms, every day')}</span>
          <button onClick={() => { logApoio('🏟️ limite de sala → Craque Salas (Vendria)'); void assinarMensal('craque_salas', tr) }}
            style={{ ...OSW, width: '100%', background: GOLD, color: INK, fontSize: 17, border: `3px solid ${INK}`, borderRadius: 12, boxShadow: `3px 3px 0 ${INK}`, padding: '8px 6px', cursor: 'pointer' }}>{tr('QUERO ESSE', 'I WANT THIS')}</button>
        </div>
      </div>
      {pix && <div style={{ marginTop: 10, background: '#fff', border: `3px solid ${INK}`, borderRadius: 12, padding: 8 }}>
        <PixMP produto="salas_extras" valor={4.9} aoPagar={onPagou} />
      </div>}

      <ul style={{ listStyle: 'none', margin: '12px 0 0', padding: '8px 10px', background: '#fff', border: `3px solid ${INK}`, borderRadius: 12, fontSize: 13, fontWeight: 600, lineHeight: 1.7 }}>
        <li>✅ <b>{tr('Salas à vontade', 'Unlimited rooms')}</b> {tr('todo dia', 'every day')}</li>
        <li>✅ <b>{tr('Liga da Turma e Liga Draft', 'Crew League and Draft League')}</b> {tr('com os amigos', 'with your friends')}</li>
        <li>✅ <b>{tr('Nome único', 'Unique name')}</b> + {tr('nome', 'name in')} <b>{tr('prata', 'silver')}</b> ⭐ · {tr('presidente e clã', 'president and clan')}</li>
      </ul>
      <ApoieButton startScreen="choice" trigger={open => <button onClick={() => { logApoio('🏟️ limite de sala → ver os planos'); open() }}
        style={{ display: 'block', margin: '10px auto 0', background: 'none', border: 'none', color: '#555', fontSize: 12.5, fontWeight: 800, cursor: 'pointer' }}>{tr('ver todos os planos ›', 'see all plans ›')}</button>} />
    </div>
  )
}

// 📱 AVISO DE APARELHO CHEIO (13/10, caso do Pé de Breque: "passo da 189, salvo, saio e volto na 189").
// O salvamento automático da carreira no aparelho falhou (o navegador não deixa passar de ~5 MB por site).
// A carreira dele continua segura na nuvem até o último "Sair e salvar", e o jogo abre sempre a mais
// adiantada — então o aviso só pede UMA coisa: salvar antes de fechar. Sem botão de limpar (a limpeza do
// lixo já roda sozinha toda vez que o jogo abre, `storage-guard.ts`).
import { useState } from 'react'
import { useSemEspaco, useEsc } from './store'
import { tr } from './lang'

export function AvisoSemEspaco() {
  const cheio = useSemEspaco()
  const { state } = useEsc()
  const [fechado, setFechado] = useState(false)
  // 🎯 só DENTRO da carreira solo (13/10, print do Diego: o aviso aparecia na lista de salas online — nada a ver)
  const naCarreira = !!state.careerOnline && state.onlineMode !== 'online' && !['intro', 'lobby', 'setup', 'album', 'ranking'].includes(state.screen)
  if (!cheio || fechado || !naCarreira) return null
  return (
    <div style={{ position: 'fixed', left: 12, right: 12, bottom: 12, zIndex: 99995, maxWidth: 480, margin: '0 auto', background: '#fff', color: '#0C0C0C', border: '3px solid #0C0C0C', borderRadius: 14, boxShadow: '4px 4px 0 #0C0C0C', padding: '10px 12px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
      <span style={{ fontSize: 22, lineHeight: 1 }}>📱</span>
      <p style={{ flex: 1, margin: 0, fontSize: 13, fontWeight: 700, lineHeight: 1.35 }}>
        {tr('Seu celular está sem espaço pra guardar a carreira sozinho. Ela continua segura na nuvem. ', 'Your phone has no room to save the career on its own. It stays safe in the cloud. ')}
        <b>{tr('Antes de fechar o jogo, aperte "Sair e salvar carreira".', 'Before closing the game, tap "Exit and save career".')}</b>
      </p>
      <button onClick={() => setFechado(true)} aria-label={tr('Fechar', 'Close')}
        style={{ width: 26, height: 26, borderRadius: 999, border: '2px solid #0C0C0C', background: '#FFC400', fontWeight: 900, cursor: 'pointer', flexShrink: 0 }}>✕</button>
    </div>
  )
}

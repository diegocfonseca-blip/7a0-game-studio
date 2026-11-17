// 🚌🎉 CHEGADA EM JOGO GRANDE (17/11, mockup `scripts/mockups/onibus-jogo-grande-*.png`, Diego: "ok pode seguir").
// No dia de um jogo GRANDE em casa (clássico, reta final brigando no topo), a aba Jogos mostra o MAPA de verdade com o ônibus do
// clube chegando no estádio (a chegada que o dia de jogo já tem — `journeyPhase: 'arrival'` — e a câmera que segue o ônibus).
// Regra de ouro do ritmo: não segura NADA. Some sozinha quando a chegada acaba, quando você aperta "Começar o jogo" ou "Pular".
import type { ReactNode } from 'react'
import { useT } from './lang'

const INK = '#0C0C0C', GOLD = '#FFC400'
const OSW = { fontFamily: 'Oswald, sans-serif', fontWeight: 700 as const, textTransform: 'uppercase' as const }

export function ChegadaGrande({ titulo, confronto, clube, onPular, children }: { titulo: string; confronto: string; clube: string; onPular: () => void; children: ReactNode }) {
  const t = useT()
  return (
    <div style={{ position: 'relative', border: `3px solid ${INK}`, borderRadius: 16, overflow: 'hidden', boxShadow: `4px 4px 0 ${INK}`, margin: '0 0 10px', background: '#000' }}>
      {/* o mapa encaixa aqui (VagaDoMapa); a altura é fixa pra a página não pular */}
      <div style={{ height: 340, overflow: 'hidden', pointerEvents: 'none' }}>{children}</div>
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'linear-gradient(180deg,#0008 0%,transparent 28%,transparent 58%,#000d 100%)' }} />
      <div style={{ position: 'absolute', left: 0, right: 0, top: 10, textAlign: 'center', pointerEvents: 'none' }}>
        <b style={{ ...OSW, display: 'block', fontSize: 26, color: GOLD, textShadow: `0 3px 0 ${INK}` }}>{titulo}</b>
        <small style={{ ...OSW, fontSize: 11, letterSpacing: '.2em', color: '#fff' }}>{confronto} · {t('na porta do estádio', 'at the stadium gates')}</small>
      </div>
      <div style={{ position: 'absolute', left: 12, right: 12, bottom: 12, display: 'flex', gap: 10, alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div style={{ background: '#0C0C0Ccc', borderRadius: 10, padding: '8px 11px', color: '#fff', minWidth: 0 }}>
          <b style={{ ...OSW, display: 'block', fontSize: 19 }}>🚌 {t(`${clube} chegou`, `${clube} has arrived`)}</b>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#e6dcc0' }}>{t('A torcida recebe o ônibus na porta do estádio', 'The fans greet the bus at the stadium gates')}</span>
        </div>
        <button type="button" onClick={onPular} style={{ ...OSW, flex: 'none', border: `3px solid ${INK}`, borderRadius: 12, background: GOLD, color: INK, fontSize: 15, padding: '9px 12px', boxShadow: `3px 3px 0 ${INK}`, cursor: 'pointer' }}>⏩ {t('Pular chegada', 'Skip arrival')}</button>
      </div>
    </div>
  )
}

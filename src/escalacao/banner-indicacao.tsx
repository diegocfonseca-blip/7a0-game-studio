// 🎥 08/11 (Diego: *"no lugar do banner de 3k do mapa… um visual diferente mas tamanho parecido… indicou um streamer pra fazer
// live jogando Leilão Legends você ganha um plano e ele também. Converse comigo no direct do Instagram"*).
// Mesmo lugar e mesma altura da faixa do Instagram (uma faixa só, pra não empurrar a lista de modos no celular). A faixa inteira é
// o link pro direct do @leilaolegendscom. Tirar de todo mundo: `BANNER_INDICACAO_LIGADO = false`.
import { type CSSProperties } from 'react'
import { useT } from './lang'

export const BANNER_INDICACAO_LIGADO = true
const LINK = 'https://ig.me/m/leilaolegendscom' // abre o direct do Instagram do jogo
const INK = '#0C0C0C', GOLD = '#FFC400', ROXO = '#7C3AED', VERDE = '#1B7A3D'
const OSW: CSSProperties = { fontFamily: 'Oswald, sans-serif', textTransform: 'uppercase' }

export function BannerIndicacao() {
  const t = useT()
  if (!BANNER_INDICACAO_LIGADO) return null
  return (
    <a href={LINK} target="_blank" rel="noopener noreferrer" aria-label={t('Indique um streamer e ganhe um plano', 'Refer a streamer and get a plan')}
      style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 10, margin: '8px auto 10px', maxWidth: 560, width: '100%', boxSizing: 'border-box', border: `3px solid ${INK}`, borderRadius: 14, background: `linear-gradient(100deg, ${ROXO} 0%, #5B21B6 100%)`, boxShadow: `3px 3px 0 ${INK}`, padding: '8px 10px 8px 8px', color: '#fff', textDecoration: 'none', overflow: 'hidden' }}>
      <span aria-hidden="true" style={{ flex: 'none', width: 40, height: 40, borderRadius: 11, border: `2.5px solid ${INK}`, background: GOLD, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, boxShadow: `2px 2px 0 ${INK}` }}>🎥</span>
      <span style={{ flex: 1, minWidth: 0, ...OSW, fontWeight: 900, fontSize: 14.5, lineHeight: 1.1 }}>
        {t('Indicou um streamer? ', 'Know a streamer? ')}<b style={{ color: GOLD }}>{t('🎁 Você e ele ganham um plano', '🎁 You both get a plan')}</b>
        <span style={{ display: 'block', fontFamily: 'Inter, system-ui, sans-serif', textTransform: 'none', fontWeight: 700, fontSize: 11.5, color: '#E9DDFF', marginTop: 2 }}>
          {t('Ele faz live jogando Leilão Legends · fale comigo no direct', 'They go live playing Leilão Legends · DM me on Instagram')}
        </span>
      </span>
      <span style={{ flex: 'none', background: VERDE, color: '#fff', border: `2px solid ${INK}`, borderRadius: 10, padding: '7px 10px', ...OSW, fontWeight: 800, fontSize: 13, boxShadow: `2px 2px 0 ${INK}`, whiteSpace: 'nowrap' }}>{t('💬 Direct', '💬 DM')}</span>
    </a>
  )
}

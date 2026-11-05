// 📸 04/11 (Diego: *"banner pra todos que entrarem no jogo pra seguir a página do Instagram, que faltam 200 seguidores pra
// lançarmos o campinho 2D… quando a pessoa fechar não mostra mais pra ela… apertar no link direciona pro Instagram do leilão"*).
// Mockup aprovado: `scripts/mockups/banner-instagram-campo2d.png`. (05/11: sem ✕, aparece sempre.)
// Pra tirar de todo mundo: `BANNER_INSTAGRAM_LIGADO = false`. Pra mudar a meta: troque `FALTAM` (e a chave, se quiser que
// quem fechou veja de novo).
import { type CSSProperties } from 'react'
import { useT } from './lang'

export const BANNER_INSTAGRAM_LIGADO = true
const FALTAM = 95 // 05/11: Diego atualizou a meta (era 200)
// 🔁 05/11: SEM ✕ — o Diego mandou: *"tem que aparecer pra todo mundo que entrar na home do site sempre"*. Ele mesmo abriu a
// exceção à regra do aviso fechado (29/10) pra este banner. Quem tinha fechado volta a ver.
const LINK = 'https://instagram.com/leilaolegendscom'
const INK = '#0C0C0C', ROSA = '#D62976', ROXO = '#962FBF'
const GRAD = 'linear-gradient(45deg,#FEDA75,#FA7E1E,#D62976,#962FBF,#4F5BD5)'
const OSW: CSSProperties = { fontFamily: 'Oswald, sans-serif', textTransform: 'uppercase' }

export function BannerInstagram() {
  const t = useT()
  if (!BANNER_INSTAGRAM_LIGADO) return null
  return (
    <section aria-label={t('Siga o Leilão Legends no Instagram', 'Follow Leilão Legends on Instagram')}
      style={{ position: 'relative', margin: '12px auto', maxWidth: 560, width: 'calc(100% - 32px)', boxSizing: 'border-box', border: `4px solid ${INK}`, borderRadius: 18, background: '#fff', boxShadow: `4px 4px 0 ${INK}`, overflow: 'hidden', color: INK, textAlign: 'left' }}>
      <div style={{ height: 10, background: 'linear-gradient(90deg,#FEDA75,#FA7E1E 30%,#D62976 60%,#962FBF 85%,#4F5BD5)' }} />
      <div style={{ padding: '14px 16px 16px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <span aria-hidden="true" style={{ flex: 'none', width: 54, height: 54, borderRadius: 15, border: `3px solid ${INK}`, background: GRAD, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `2px 2px 0 ${INK}` }}>
          <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="#fff" strokeWidth="2.4"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1.2" fill="#fff" stroke="none" /></svg>
        </span>
        <div style={{ minWidth: 0 }}>
          <h2 style={{ margin: '0 0 4px 0', ...OSW, fontWeight: 900, fontSize: 21, lineHeight: 1.05 }}>
            {t('Faltam ', 'Only ')}<b style={{ color: ROSA }}>{FALTAM} {t('seguidores', 'followers')}</b>{t(' pro Campo 2D e a Liga Draft!', ' to go for the 2D Pitch and Draft League!')}
          </h2>
          <p style={{ margin: '0 0 10px', fontSize: 13.5, lineHeight: 1.35, fontWeight: 600 }}>
            {t('Siga o ', 'Follow ')}<b style={{ color: ROXO }}>@leilaolegendscom</b>{t(' no Instagram. Bateu a meta, a gente libera o ', ' on Instagram. Once we hit the goal, we release the ')}<b>{t('campinho 2D', '2D pitch')}</b>{t(' e a ', ' and the ')}<b>{t('Liga Draft', 'Draft League')}</b>{t(' pra todo mundo. ⚽', ' for everyone. ⚽')}
          </p>
          <a href={LINK} target="_blank" rel="noopener noreferrer"
            style={{ display: 'inline-block', background: INK, color: '#fff', border: `3px solid ${INK}`, borderRadius: 12, padding: '10px 14px', ...OSW, fontWeight: 800, fontSize: 15, boxShadow: `3px 3px 0 ${ROSA}`, textDecoration: 'none' }}>
            {t('📸 Seguir no Instagram', '📸 Follow on Instagram')}
          </a>
        </div>
      </div>
    </section>
  )
}

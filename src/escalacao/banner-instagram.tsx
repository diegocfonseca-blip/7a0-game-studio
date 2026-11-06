// 📸 04/11 (Diego: *"banner pra todos que entrarem no jogo pra seguir a página do Instagram, que faltam 200 seguidores pra
// lançarmos o campinho 2D… quando a pessoa fechar não mostra mais pra ela… apertar no link direciona pro Instagram do leilão"*).
// Mockup aprovado: `scripts/mockups/banner-instagram-campo2d.png`. (05/11: sem ✕, aparece sempre.)
// Pra tirar de todo mundo: `BANNER_INSTAGRAM_LIGADO = false`. Pra mudar a meta: troque `FALTAM` (e a chave, se quiser que
// quem fechou veja de novo).
import { type CSSProperties } from 'react'
import { useT } from './lang'

export const BANNER_INSTAGRAM_LIGADO = false // 🎯 06/11: meta batida (Diego: "remova esse banner… já batemos a meta")
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
  // 📏 06/11: versão COMPACTA (uma faixa só). A grande, com o texto todo, empurrava a lista de modos pra cima e tampava o
  // "CONTINUAR SALA" e o sino no celular (print do Diego, 06/11). A faixa inteira é o link pro Instagram.
  return (
    <a href={LINK} target="_blank" rel="noopener noreferrer" aria-label={t('Siga o Leilão Legends no Instagram', 'Follow Leilão Legends on Instagram')}
      style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 10, margin: '8px auto 10px', maxWidth: 560, width: '100%', boxSizing: 'border-box', border: `3px solid ${INK}`, borderRadius: 14, background: '#fff', boxShadow: `3px 3px 0 ${INK}`, overflow: 'hidden', color: INK, textAlign: 'left', textDecoration: 'none', padding: '8px 10px 8px 8px' }}>
      <span aria-hidden="true" style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 5, background: 'linear-gradient(180deg,#FEDA75,#FA7E1E 30%,#D62976 60%,#962FBF 85%,#4F5BD5)' }} />
      <span aria-hidden="true" style={{ flex: 'none', width: 38, height: 38, marginLeft: 4, borderRadius: 11, border: `2.5px solid ${INK}`, background: GRAD, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#fff" strokeWidth="2.4"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1.2" fill="#fff" stroke="none" /></svg>
      </span>
      <span style={{ flex: 1, minWidth: 0, ...OSW, fontWeight: 900, fontSize: 14.5, lineHeight: 1.1 }}>
        {t('Faltam ', 'Only ')}<b style={{ color: ROSA }}>{FALTAM} {t('seguidores', 'followers')}</b>{t(' pro Campo 2D e a Liga Draft!', ' to go for the 2D Pitch and Draft League!')}
        <span style={{ display: 'block', fontFamily: 'inherit', textTransform: 'none', fontWeight: 700, fontSize: 11.5, color: ROXO, marginTop: 2 }}>@leilaolegendscom</span>
      </span>
      <span style={{ flex: 'none', background: INK, color: '#fff', borderRadius: 10, padding: '7px 10px', ...OSW, fontWeight: 800, fontSize: 13, boxShadow: `2px 2px 0 ${ROSA}` }}>{t('📸 Seguir', '📸 Follow')}</span>
    </a>
  )
}

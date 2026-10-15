// ─── 🏆 MOLDURA DO PÓDIO DA SEMANA (15/10) ────────────────────────────────────────────────────────────────────
//
// Pedido do Diego: *"quero que o primeiro, segundo e terceiro ganhe algo mais forte no nome a mais que as medalhas…
// problema de pôr fundo é que quem já tem dourado não mudaria nada"*. Mockup aprovado (`scripts/mockup-podio-semana.mjs`,
// *"gostei da moldura, perfeito"*), com a fita escrita "1º RANKING SEMANAL" (pedido dele).
// O FUNDO continua sendo o do PLANO (regra sagrada do tier); o pódio vem POR FORA: moldura de metal girando
// (ouro · prata · bronze), coroinha no 1º e a fita pendurada.
// Quem diz a posição é a MEDALHA que já vai no nome (🥇🥈🥉, `apoioSelo`): ela vem do banco e o `stripEmoji` tira
// medalha de nome digitado — ninguém se dá moldura escrevendo emoji.
import type { ReactNode } from 'react'
import { tr } from './lang'

/** 1 · 2 · 3 pela medalha no nome; 0 = fora do pódio */
export function posPodio(nome: string | null | undefined): 0 | 1 | 2 | 3 {
  if (!nome) return 0
  return nome.includes('🥇') ? 1 : nome.includes('🥈') ? 2 : nome.includes('🥉') ? 3 : 0
}

const ANEL: Record<1 | 2 | 3, string> = {
  1: 'conic-gradient(#fff6c4,#FFC400,#b37a00,#FFE066,#fff6c4,#FFC400,#b37a00,#fff6c4)',
  2: 'conic-gradient(#ffffff,#C9D2DC,#7d8896,#eef2f6,#ffffff,#C9D2DC,#7d8896,#ffffff)',
  3: 'conic-gradient(#ffe0c2,#D9822B,#7a3e0e,#F0A35E,#ffe0c2,#D9822B,#7a3e0e,#ffe0c2)',
}
const FITA: Record<1 | 2 | 3, [string, string]> = { 1: ['#FFC400', '#0C0C0C'], 2: ['#D6DDE5', '#0C0C0C'], 3: ['#D9822B', '#fff'] }
const BRILHO: Record<1 | 2 | 3, string> = { 1: 'rgba(255,196,0,.5)', 2: 'rgba(200,210,220,.5)', 3: 'rgba(217,130,43,.45)' }

const CSS = `
.podio-m{position:relative;margin:16px 0 6px;padding:5px;border-radius:15px}
.podio-m>.podio-anel{position:absolute;inset:0;border-radius:15px;overflow:hidden;border:2px solid #0C0C0C;box-shadow:3px 3px 0 #0C0C0C}
.podio-m>.podio-anel::before{content:'';position:absolute;left:50%;top:50%;width:150%;aspect-ratio:1;background:var(--anel);transform:translate(-50%,-50%);animation:podioGira 3s linear infinite}
.podio-m>.podio-anel::after{content:'';position:absolute;inset:5px;border-radius:10px;background:#F4ECD6;border:2px solid #0C0C0C}
.podio-m>.podio-dentro{position:relative;z-index:1;padding:2px 4px}
.podio-fita{position:absolute;z-index:3;right:10px;top:-13px;font:700 11px Oswald,sans-serif;letter-spacing:.06em;text-transform:uppercase;border:2px solid #0C0C0C;border-radius:8px;padding:1px 8px;box-shadow:2px 2px 0 #0C0C0C;white-space:nowrap}
.podio-coroa{position:absolute;z-index:3;left:6px;top:-20px;font-size:20px;transform:rotate(-18deg);filter:drop-shadow(2px 2px 0 #0C0C0C)}
@keyframes podioGira{to{transform:translate(-50%,-50%) rotate(360deg)}}
@media (prefers-reduced-motion:reduce){.podio-m>.podio-anel::before{animation:none}}
`

/** envolve a linha de quem está no TOP 3 da semana; fora do pódio devolve a linha como está */
export function PodioMoldura({ pos, children }: { pos: 0 | 1 | 2 | 3; children: ReactNode }) {
  if (!pos) return <>{children}</>
  const [fundo, cor] = FITA[pos]
  return (
    <div className="podio-m" style={{ ['--anel' as string]: ANEL[pos], filter: `drop-shadow(0 0 6px ${BRILHO[pos]})` }}>
      <style>{CSS}</style>
      <span className="podio-anel" aria-hidden />
      {pos === 1 && <span className="podio-coroa" aria-hidden>👑</span>}
      <span className="podio-fita" style={{ background: fundo, color: cor }}>
        {['', '🥇', '🥈', '🥉'][pos]} {tr(`${pos}º RANKING SEMANAL`, `#${pos} WEEKLY RANKING`)}
      </span>
      <div className="podio-dentro">{children}</div>
    </div>
  )
}

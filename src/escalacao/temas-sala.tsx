// ─── 🎨 TEMA DO CLUBE NA SALA DE ESPERA (18/10) ─────────────────────────────────────────────────────────────────────
// Ideia do Diego: tema de sala pra vender. Ele recusou o tema genérico pro clube dele (*"algo personalizado pra ele"*)
// e aprovou o TEMA DO CLUBE (mockups `scripts/mockups/tema-neymarzetti.png` e `tema-k9.png`): escudo gigante de fundo, a
// mascote na tela, as 2 cores do manto e um enfeite que é a cara do clube. *"Pode fazer pro Neymarzetti já com dois temas"*.
//
// · Muda SÓ o visual da sala de espera (fundo, caixas, botão, selo embaixo). Regras e jogo, nada.
// · Quem escolhe é o DONO da sala, e só entre os temas da CONTA dele (`TEMAS_DA_CONTA`, pelo e-mail do batismo — regra
//   28/09). Fica gravado em `game_state.tema`; os convidados recebem por um aviso único no canal (nada periódico).
// · Arte = os .webp do batismo que já existem (0 KB novo); morcego/lua/neve são CSS.
import type { CSSProperties } from 'react'
import neymarzettiEscudo from './img/neymarzetti-escudo.webp'
import neymarzettiMascote from './img/neymarzetti-mascote.webp'
import { tr } from './lang'
import './temas-sala.css'

export type TemaSalaId = 'neymarzetti_noite' | 'neymarzetti_branco'
type Tema = {
  id: TemaSalaId; nome: string; nomeEn: string; selo: string
  escudo: string; mascote: string; claro: boolean
  botao: string; botaoTxt: string // o "Abrir o pregão"
  enfeite: 'morcegos' | 'nenhum'
}
const CROMO = 'linear-gradient(135deg,#f5f5f5 0%,#9a9a9a 22%,#ffffff 45%,#6e6e6e 70%,#e6e6e6 100%)'
export const TEMAS_SALA: Record<TemaSalaId, Tema> = {
  neymarzetti_noite: { id: 'neymarzetti_noite', nome: '🦇 Noite do Morcego', nomeEn: '🦇 Bat Night', selo: '🦇 TEMA DO CLUBE · NEYMARZETTI', escudo: neymarzettiEscudo, mascote: neymarzettiMascote, claro: false, botao: CROMO, botaoTxt: '#0c0c0c', enfeite: 'morcegos' },
  neymarzetti_branco: { id: 'neymarzetti_branco', nome: '⚪ Manto Branco', nomeEn: '⚪ White Kit', selo: '🦇 TEMA DO CLUBE · NEYMARZETTI', escudo: neymarzettiEscudo, mascote: neymarzettiMascote, claro: true, botao: CROMO, botaoTxt: '#0c0c0c', enfeite: 'nenhum' },
}
// 📧 de quem é cada tema (o e-mail do batismo manda — regra 28/09)
const TEMAS_DA_CONTA: Record<string, TemaSalaId[]> = {
  'diego.c.fonseca@gmail.com': ['neymarzetti_noite', 'neymarzetti_branco'],
}
export function temasDaConta(email: string | null | undefined): TemaSalaId[] {
  return email ? TEMAS_DA_CONTA[email.toLowerCase()] ?? [] : []
}
export function temaValido(id: unknown): Tema | null {
  return typeof id === 'string' && id in TEMAS_SALA ? TEMAS_SALA[id as TemaSalaId] : null
}
export const nomeTema = (t: Tema) => tr(t.nome, t.nomeEn)

/** a camada de fundo do tema: escudo gigante, enfeites, mascote e o selo — atrás do conteúdo, sem pegar clique */
export function TemaFundo({ tema }: { tema: Tema }) {
  return (
    <div className={`tema-fundo ${tema.claro ? 'tema-claro' : 'tema-escuro'}`} aria-hidden>
      <img src={tema.escudo} className="tema-marca" alt="" />
      {tema.enfeite === 'morcegos' && <>
        <span className="tema-lua" />
        {[[6, 14, 26, 0], [78, 9, 18, 1.6], [86, 34, 22, 3.1], [4, 46, 16, 2.2], [52, 5, 14, .8], [70, 58, 17, 4]].map(([x, y, s, d], i) =>
          <span key={i} className="tema-morcego" style={{ left: `${x}%`, top: `${y}%`, fontSize: s, animationDelay: `${d}s` } as CSSProperties}>🦇</span>)}
      </>}
      <img src={tema.mascote} className="tema-mascote" alt="" />
      <span className="tema-selo">{tema.selo}</span>
    </div>
  )
}

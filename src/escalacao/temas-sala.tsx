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
import k9Escudo from './img/k9-escudo.webp'
import k9Mascote from './img/k9-mascote.webp'
import { tr } from './lang'
import './temas-sala.css'

export type TemaSalaId = 'neymarzetti_noite' | 'neymarzetti_branco' | 'k9_gelo' | 'k9_branco'
type Tema = {
  id: TemaSalaId; nome: string; nomeEn: string; selo: string
  escudo: string; mascote: string; claro: boolean
  botao: string; botaoTxt: string // o "Abrir o pregão"
  enfeite: 'morcegos' | 'neve' | 'nenhum'
  seloBg?: string; seloBorda?: string
}
const GELO = 'linear-gradient(135deg,#ffffff 0%,#bfe6ff 35%,#ffffff 55%,#8fd0ff 80%,#e8f6ff 100%)'
const CROMO = 'linear-gradient(135deg,#f5f5f5 0%,#9a9a9a 22%,#ffffff 45%,#6e6e6e 70%,#e6e6e6 100%)'
export const TEMAS_SALA: Record<TemaSalaId, Tema> = {
  neymarzetti_noite: { id: 'neymarzetti_noite', nome: '🦇 Noite do Morcego', nomeEn: '🦇 Bat Night', selo: '🦇 TEMA DO CLUBE · NEYMARZETTI', escudo: neymarzettiEscudo, mascote: neymarzettiMascote, claro: false, botao: CROMO, botaoTxt: '#0c0c0c', enfeite: 'morcegos' },
  neymarzetti_branco: { id: 'neymarzetti_branco', nome: '⚪ Manto Branco', nomeEn: '⚪ White Kit', selo: '🦇 TEMA DO CLUBE · NEYMARZETTI', escudo: neymarzettiEscudo, mascote: neymarzettiMascote, claro: true, botao: CROMO, botaoTxt: '#0c0c0c', enfeite: 'nenhum' },
  // 👑🧊 K9 FC (18/10, mockup `tema-k9.png`): a coroa com gelo do escudo, o Rei K9 com as taças, branco e azul royal
  k9_gelo: { id: 'k9_gelo', nome: '🧊 Reino de Gelo', nomeEn: '🧊 Ice Kingdom', selo: '👑🧊 TEMA DO CLUBE · K9 FC', escudo: k9Escudo, mascote: k9Mascote, claro: false, botao: GELO, botaoTxt: '#0723B4', enfeite: 'neve', seloBg: '#0723B4', seloBorda: '#FFC400' },
  k9_branco: { id: 'k9_branco', nome: '👑 Rei de Branco', nomeEn: '👑 King in White', selo: '👑🧊 TEMA DO CLUBE · K9 FC', escudo: k9Escudo, mascote: k9Mascote, claro: true, botao: GELO, botaoTxt: '#0723B4', enfeite: 'neve', seloBg: '#0723B4', seloBorda: '#FFC400' },
}
// 📧 de quem é cada tema (o e-mail do batismo manda — regra 28/09)
const TEMAS_DA_CONTA: Record<string, TemaSalaId[]> = {
  'diego.c.fonseca@gmail.com': ['neymarzetti_noite', 'neymarzetti_branco'],
  'kelvinoliveiraandradeenunes@gmail.com': ['k9_gelo', 'k9_branco'], // 👑 K9 FC (pedido do Diego 18/10)
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
      {tema.enfeite === 'neve' && <>
        {Array.from({ length: 22 }, (_, i) => <span key={i} className="tema-floco" style={{ left: `${(i * 37) % 100}%`, fontSize: 9 + (i * 7) % 9, animationDuration: `${7 + (i * 3) % 6}s`, animationDelay: `${-((i * 5) % 9)}s` } as CSSProperties}>❄</span>)}
        <span className="tema-cristais" />
      </>}
      <img src={tema.mascote} className="tema-mascote" alt="" />
      <span className="tema-selo" style={tema.seloBg ? { background: tema.seloBg, borderColor: tema.seloBorda } : undefined}>{tema.selo}</span>
    </div>
  )
}

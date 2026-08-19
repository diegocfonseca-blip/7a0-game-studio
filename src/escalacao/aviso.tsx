// ─── 📣 AVISO DA VEZ — o recado direto do Diego pra quem joga ───────────────
//
// Isto NÃO é "novidade" (aquela lista mora em `novidades.ts` e tem a regra do
// Diego: *"bug nunca vira novidade"*). Isto aqui é o oposto: um recado curto e
// TEMPORÁRIO, pra quando alguma coisa aconteceu e ele quer falar com todo mundo
// na cara — instabilidade, aviso de manutenção, pedido pra recarregar o app.
//
// Nasceu em 19/08, quando as salas online bagunçaram (dois donos na mesma sala,
// gente tendo que repetir o lance). O Diego pediu: *"mande um banner dps p todos
// q tivemos instabilidades pq estamos lançando mais novidades. Atualize. E peça
// pra atualizarem o navegador pra ver os novos campinhos já. Caso tenha algum
// bug mande no Instagram msg @leilaolegends"*.
//
// ── DUAS TRAVAS PRA ISTO NUNCA VIRAR PARADÃO ───────────────────────────────
// 1. **Some sozinho** na data de `ATE`. Aviso sem prazo apodrece na tela — foi
//    o que aconteceu com as 17 novidades antigas.
// 2. **Quem fechou, não vê mais** (fica marcado no aparelho). O aviso é pra
//    informar uma vez, não pra perseguir a pessoa.
// Fora do prazo ou já fechado, este arquivo não desenha NADA.
//
// Pra trocar o recado: mexe no bloco `AVISO` abaixo e muda a `chave` — chave
// nova faz o aviso reaparecer pra quem já tinha fechado o anterior.
import { useState } from 'react'

const INK = '#0C0C0C'
const OSWALD = { fontFamily: 'Oswald, sans-serif' } as const

const AVISO = {
  chave: 'inst-19-08',      // muda junto com o texto (reabre pra quem fechou o anterior)
  ate: '2026-08-26',        // some sozinho depois desta data
  titulo: 'Tivemos instabilidade nas salas online',
  corpo: 'Foi enquanto a gente subia um monte de novidade — já está consertado. '
    + 'Se você jogou e viu algo estranho, foi isso.',
  acao: 'Feche e abra o jogo pra pegar a versão nova — já vem com o campinho novo. 🆕',
  insta: '@leilaolegends',
}

const K = `esc-aviso-${AVISO.chave}`

export function AvisoDaVez() {
  const [fechado, setFechado] = useState(() => {
    try { return localStorage.getItem(K) === '1' } catch { return false }
  })
  if (fechado) return null
  if (new Date().toISOString().slice(0, 10) > AVISO.ate) return null // venceu: some sozinho
  const fechar = () => {
    try { localStorage.setItem(K, '1') } catch { /* aparelho sem storage: só some agora */ }
    setFechado(true)
  }
  return (
    <div className="rounded-2xl border-4 border-black mb-1 overflow-hidden"
      style={{ background: '#fff', boxShadow: `4px 4px 0 0 ${INK}` }}>
      <div style={{ background: '#C2452F', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 15 }}>📣</span>
        <span className="font-black uppercase text-white"
          style={{ ...OSWALD, fontSize: 12.5, letterSpacing: '.08em' }}>Recado do Leilão Legends</span>
      </div>
      <div style={{ padding: '11px 13px 13px' }}>
        <p className="font-black" style={{ ...OSWALD, fontSize: 17, lineHeight: 1.15, color: INK }}>
          ⚠️ {AVISO.titulo}
        </p>
        <p className="font-bold" style={{ fontSize: 12.5, lineHeight: 1.42, color: 'rgba(12,12,12,.68)', marginTop: 5 }}>
          {AVISO.corpo}
        </p>
        <p className="font-black" style={{
          fontSize: 12.5, lineHeight: 1.4, color: '#14683A', background: '#EFF9F2',
          border: '2.5px solid #1B7A3D', borderRadius: 11, padding: '8px 10px', marginTop: 9,
        }}>
          🔄 {AVISO.acao}
        </p>
        <p className="font-bold" style={{ fontSize: 12, lineHeight: 1.4, color: 'rgba(12,12,12,.62)', marginTop: 9 }}>
          Achou algum bug? Manda mensagem no Instagram{' '}
          <a href="https://instagram.com/leilaolegends" target="_blank" rel="noreferrer"
            className="font-black" style={{ color: '#7C3AED', textDecoration: 'underline' }}>{AVISO.insta}</a>
          {' '}— a gente conserta rápido.
        </p>
        <button onClick={fechar}
          className="w-full rounded-xl border-2 border-black font-black py-2.5 mt-3 active:translate-y-0.5"
          style={{ ...OSWALD, background: INK, color: '#fff', fontSize: 13.5 }}>
          ENTENDI, PODE FECHAR
        </button>
      </div>
    </div>
  )
}

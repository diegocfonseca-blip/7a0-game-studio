// 💬 PEÇAS DO CHAT DA SALA (Diego 13/10, mockup `scripts/mockups/chat-sala.png`: "faz 1, 3 e 4").
// Usadas pelos DOIS chats — o do jogo (`ChatWidget`, screens.tsx) e o da sala de espera
// (`LobbyChatDock`, lobby.tsx) — pra eles não terem regra própria cada um.
//   1) o NOME de quem fala vem na cor do PRÓPRIO plano (grátis = bege). SEM escudo: o Diego tirou
//      no mesmo dia ("deixa apenas o nome dourado… pra não ficar muita informação"). O plano
//      é lido pelo selo que já viaja no nome (👑 ⭐ 💎 e o invisível do verde) — o mesmo jeito que
//      a lista de jogadores da sala usa; nada é consultado no banco.
//   3) RESPONDER: a mensagem leva `re` (nome + começo da frase de quem foi respondido).
//      Aparelho com versão velha ignora o campo e mostra só o texto — não quebra nada.
//   4) a gaveta não escurece nem bloqueia o jogo: dá pra continuar vendo e tocando no pregão.
// ⚠️ Nada aqui manda mensagem a mais pelo canal (sem "digitando") — ver a conta do realtime.
import { APOIO_PERKS, type ApoioPerk, stripEmoji } from './apoio'
import { tr } from './lang'
import { podioDeUid } from './vitrine-dados'
import { PodioChatSelo, PODIO_BORDA } from './podio-semana'

export type ChatRe = { name: string; text: string }
const INK = '#0C0C0C'
const GOLD = '#FFC400'
const OSWALD = { fontFamily: 'Oswald, sans-serif' }

export function perkDoNome(n: string): ApoioPerk {
  return n.includes('👑') ? APOIO_PERKS.ouro : n.includes('⭐') ? APOIO_PERKS.prata : n.includes('💎') ? APOIO_PERKS.roxo
    : n.includes('⁣') ? APOIO_PERKS.verde : APOIO_PERKS.bege
}
const nomeSemSelo = (n: string) => stripEmoji(n).replace(/⁣/g, '').trim() || n

/** a citação que vai junto da resposta (curta: é só pra lembrar do que se trata). */
export function citacao(name: string, text: string): ChatRe {
  return { name: nomeSemSelo(name).slice(0, 40), text: [...text].slice(0, 70).join('') }
}
/** só aceita `re` bem formado vindo do canal. */
export function reValido(re: unknown): ChatRe | undefined {
  const r = re as ChatRe | undefined
  return r && typeof r.name === 'string' && typeof r.text === 'string' ? { name: r.name.slice(0, 40), text: r.text.slice(0, 80) } : undefined
}

// 🏅 19/10 (Diego: "no chat quem tiver atual da semana ganha medalha e moldura e escrito sutilmente em cima"): as medalhas
// (🥇🥈🥉, de agora e as ganhas de 30 dias) voltam pro crachá, e quem está no pódio AGORA (pela conta) leva a borda de metal
// + a linha miúda "1º DA SEMANA" em cima.
const medalhasDoNome = (n: string) => (n.match(/[🥇🥈🥉]/gu) ?? []).join('')
export function ChatCracha({ name, uid }: { name: string; uid?: string | null }) {
  const p = perkDoNome(name)
  const escuro = p.tier === 'roxo' || p.tier === 'verde'
  const pos = podioDeUid(uid)
  const med = medalhasDoNome(name)
  return (
    <>
      <PodioChatSelo pos={pos} />
      <span style={{ ...OSWALD, display: 'inline-block', fontWeight: 900, fontSize: 10, lineHeight: 1.2, textTransform: 'uppercase', background: p.grad, color: escuro ? '#fff' : INK, border: pos ? `2px solid ${PODIO_BORDA[pos]}` : '1.5px solid #000', boxShadow: pos ? `0 0 0 1px #000, 0 0 6px ${PODIO_BORDA[pos]}99` : undefined, borderRadius: 6, padding: '1px 6px', marginBottom: 3, maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {p.selo && p.tier !== 'verde' ? `${p.selo} ` : ''}{nomeSemSelo(name)}{med ? ` ${med}` : ''}
      </span>
    </>
  )
}

export function ChatCita({ re }: { re: ChatRe }) {
  return (
    <span style={{ display: 'block', borderLeft: `4px solid ${GOLD}`, background: '#F4ECD6', borderRadius: 6, padding: '3px 7px', marginBottom: 4, fontSize: 11.5, color: '#555', wordBreak: 'break-word' }}>
      <b style={{ ...OSWALD, display: 'block', fontWeight: 900, fontSize: 10, color: INK }}>↩ {re.name}</b>{re.text}
    </span>
  )
}

/** faixa "Respondendo fulano ✕" em cima da caixa de digitar. */
export function ChatRespondendo({ re, onCancel }: { re: ChatRe; onCancel: () => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#FFF3D6', borderTop: '2px solid #000', padding: '5px 10px', fontSize: 12, color: INK }}>
      <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        ↩ {tr('Respondendo', 'Replying to')} <b style={{ ...OSWALD, fontWeight: 900 }}>{re.name}</b>: {re.text}
      </span>
      <button onClick={onCancel} aria-label={tr('Cancelar resposta', 'Cancel reply')} style={{ ...OSWALD, fontWeight: 900, background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: INK }}>✕</button>
    </div>
  )
}

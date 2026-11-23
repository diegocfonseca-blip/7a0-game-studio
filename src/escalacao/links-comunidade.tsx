// 📲🎮 LINHA FININHA DO CHAT (23/11, mockup `scripts/mockups/chat-whatsapp.png`, Diego mandou o link do Discord): logo abaixo do
// título "💬 Zoeira da sala", WhatsApp (verde) na esquerda e Discord (azul) na direita — sutil, letra pequena, sem caixa, pra não
// atrapalhar a conversa. Mesmo link do botão da home (`comunidade.ts`). Sem link nenhum, não aparece nada.
import { tr } from './lang'
import { COMUNIDADE_LINK, DISCORD_LINK } from './comunidade'

export function LinhaComunidadeChat() {
  const links = [
    COMUNIDADE_LINK ? { href: COMUNIDADE_LINK, cor: '#1B7A3D', bola: '#25D366', icone: '✆', nome: 'WhatsApp' } : null,
    DISCORD_LINK ? { href: DISCORD_LINK, cor: '#5865F2', bola: '#5865F2', icone: '◉', nome: 'Discord' } : null,
  ].filter((x): x is NonNullable<typeof x> => !!x)
  if (!links.length) return null
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${links.length}, 1fr)`, borderBottom: '1px solid #e4dcc4', background: '#FBF6E7', flex: '0 0 auto' }}>
      {links.map((l, i) => (
        <a key={l.nome} href={l.href} target="_blank" rel="noopener noreferrer"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '5px 6px', fontSize: 11, fontWeight: 700, color: l.cor, textDecoration: 'none', borderLeft: i ? '1px solid #e4dcc4' : 'none', whiteSpace: 'nowrap', overflow: 'hidden' }}>
          <span style={{ width: 14, height: 14, borderRadius: 99, background: l.bola, color: '#fff', fontSize: 9, display: 'grid', placeItems: 'center', flex: '0 0 auto' }}>{l.icone}</span>
          <span>{tr('Galera no ', 'Crew on ')}<b style={{ fontWeight: 800 }}>{l.nome}</b> ›</span>
        </a>
      ))}
    </div>
  )
}

// 🃏 "QUEM É ESSE JOGADOR?" — joguinho da tela de espera (23/11, ideia aprovada pelo Diego, mockup
// `scripts/mockups/espera-quem-e-a-lenda-*.png`: *"aprovo"*). Enquanto a convocação dos outros não fecha, a pessoa
// adivinha a carta pelas pistas (posição · clube e ano · país) entre 3 nomes. Regras dele:
//  · sempre carta de 👑 Lenda, ⭐ Craque ou 🌱 Promessa (*"pode ser sempre carta de lenda, craque e promessa"*);
//  · faixa curta em cima: "Enquanto o tempo corre, joga essa!";
//  · não vale moeda, não grava nada e não fala com a internet — é só pra passar o tempo;
//  · quando a espera acaba, a tela de quem chama some e o joguinho vai junto: nunca segura nem interrompe a sala.
import { useMemo, useState } from 'react'
import { BARALHO_TODO, categoriaDe, type CartaBaralho } from './colecoes'
import { paisDe } from './paises'
import { flagOf } from './copa-mundo'
import { fotoDoJogador } from './rostos'
import { tr } from './lang'

const INK = '#0C0C0C', GOLD = '#FFC400', GREEN = '#1B7A3D', RED = '#C2452F'
const OSW = { fontFamily: 'Oswald, sans-serif', textTransform: 'uppercase' } as const
const POS_PT: Record<string, [string, string]> = { GOL: ['Goleiro', 'Goalkeeper'], LAT: ['Lateral', 'Full-back'], ZAG: ['Zagueiro', 'Centre-back'], MEI: ['Meia', 'Midfielder'], ATA: ['Atacante', 'Forward'] }
const CAT: Record<'lenda' | 'craque' | 'promessa', { emoji: string; pt: string; en: string; fundo: string }> = {
  lenda: { emoji: '👑', pt: 'Lenda', en: 'Legend', fundo: 'linear-gradient(160deg,#ffe27a,#c9a227)' },
  craque: { emoji: '⭐', pt: 'Craque', en: 'Star', fundo: 'linear-gradient(160deg,#e9e3ff,#8b6fe0)' },
  promessa: { emoji: '🌱', pt: 'Promessa', en: 'Prospect', fundo: 'linear-gradient(160deg,#d7f5df,#3fae63)' },
}
const POOL: CartaBaralho[] = BARALHO_TODO.filter(c => { const k = categoriaDe(c); return k === 'lenda' || k === 'craque' || k === 'promessa' })

type Pergunta = { carta: CartaBaralho; opcoes: string[] }
function sorteia(antes?: CartaBaralho): Pergunta | null {
  if (POOL.length < 3) return null
  let carta = POOL[Math.floor(Math.random() * POOL.length)]
  if (antes && carta.name === antes.name) carta = POOL[(POOL.indexOf(carta) + 1) % POOL.length]
  // as outras 2 opções: mesma posição e mesma categoria quando dá (fica difícil de chutar), sempre nomes diferentes
  const mesmos = POOL.filter(c => c.pos === carta.pos && c.name !== carta.name && categoriaDe(c) === categoriaDe(carta))
  const base = mesmos.length >= 2 ? mesmos : POOL.filter(c => c.pos === carta.pos && c.name !== carta.name)
  const nomes = new Set<string>([carta.name])
  for (let i = 0; i < 40 && nomes.size < 3 && base.length; i++) nomes.add(base[Math.floor(Math.random() * base.length)].name)
  if (nomes.size < 3) return null
  return { carta, opcoes: [...nomes].sort(() => Math.random() - 0.5) }
}

export function QuemEJogador() {
  const [p, setP] = useState<Pergunta | null>(() => sorteia())
  const [escolha, setEscolha] = useState<string | null>(null)
  const [seguidos, setSeguidos] = useState(0)
  const pais = useMemo(() => {
    if (!p) return ''
    const b = p.carta.baralho === 'MUNDO' ? 'WORLD' : (p.carta.baralho ?? 'BR')
    try { return paisDe(p.carta.name, b, p.carta.club, p.carta.year) } catch { return '' }
  }, [p])
  if (!p) return null
  const c = p.carta, cat = CAT[categoriaDe(c) as keyof typeof CAT] ?? CAT.craque
  const foto = categoriaDe(c) === 'lenda' ? fotoDoJogador(c.name) : null
  const respondeu = escolha !== null, acertou = escolha === c.name
  const escolhe = (n: string) => {
    if (respondeu) return
    setEscolha(n); setSeguidos(s => (n === c.name ? s + 1 : 0))
  }
  const proxima = () => { setP(sorteia(c)); setEscolha(null) }
  const pista = (rot: string, val: string) => (
    <div style={{ background: '#fff', border: `2.5px solid ${INK}`, borderRadius: 10, padding: '6px 10px', textAlign: 'left' }}>
      <small style={{ display: 'block', ...OSW, fontWeight: 800, fontSize: 9, color: '#777', letterSpacing: '.05em' }}>{rot}</small>
      <span style={{ fontWeight: 700, fontSize: 13 }}>{val}</span>
    </div>
  )
  return (
    <div style={{ marginTop: 14, background: '#F4ECD6', color: INK, border: `3px solid ${INK}`, borderRadius: 16, boxShadow: `4px 4px 0 ${INK}`, padding: 12, textAlign: 'left' }}>
      <span style={{ display: 'inline-block', ...OSW, fontWeight: 900, fontSize: 11.5, letterSpacing: '.04em', background: INK, color: GOLD, padding: '3px 10px', borderRadius: 7, marginBottom: 7 }}>
        {tr('⏳ Enquanto o tempo corre, joga essa!', '⏳ While the clock runs, play this!')}
      </span>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
        <b style={{ ...OSW, fontWeight: 900, fontSize: 17 }}>{tr('🃏 Quem é esse jogador?', '🃏 Who is this player?')}</b>
        {seguidos > 0 && <span style={{ background: GOLD, border: `2.5px solid ${INK}`, borderRadius: 999, padding: '2px 10px', ...OSW, fontWeight: 900, fontSize: 12, boxShadow: `2px 2px 0 ${INK}`, whiteSpace: 'nowrap' }}>🔥 {seguidos} {tr(seguidos === 1 ? 'seguido' : 'seguidos', 'in a row')}</span>}
      </div>
      <div style={{ display: 'flex', gap: 12, marginTop: 10, alignItems: 'stretch' }}>
        <div style={{ width: 112, flexShrink: 0, border: `3px solid ${INK}`, borderRadius: 13, background: cat.fundo, boxShadow: `3px 3px 0 ${INK}`, padding: 7, textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
          <div style={{ height: 92, borderRadius: 9, background: '#3a2a10', overflow: 'hidden', display: 'grid', placeItems: 'center' }}>
            {foto
              ? <img src={foto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', filter: respondeu ? 'none' : 'blur(7px)', transition: 'filter .4s' }} />
              : <span style={{ fontSize: 54, filter: respondeu ? 'none' : 'blur(4px)' }}>🧑</span>}
          </div>
          {!respondeu && <span style={{ position: 'absolute', top: 30, left: 0, right: 0, ...OSW, fontWeight: 900, fontSize: 40, color: '#fff', textShadow: `3px 3px 0 ${INK}` }}>?</span>}
          <div style={{ ...OSW, fontWeight: 900, fontSize: 10.5, marginTop: 5 }}>{cat.emoji} {tr(cat.pt, cat.en)}</div>
        </div>
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {pista(tr('Posição', 'Position'), tr(...(POS_PT[c.pos] ?? [c.pos, c.pos])))}
          {pista(tr('Clube · ano', 'Club · year'), `${c.club} · ${c.year}`)}
          {pais && pista(tr('País', 'Country'), `${flagOf(pais)} ${pais}`)}
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 7, marginTop: 10 }}>
        {p.opcoes.map(n => {
          const certo = respondeu && n === c.name, errado = respondeu && n === escolha && !acertou
          return (
            <button key={n} type="button" onClick={() => escolhe(n)} disabled={respondeu}
              style={{ border: `3px solid ${INK}`, borderRadius: 11, padding: '9px 4px', ...OSW, fontWeight: 900, fontSize: 13, lineHeight: 1.15, cursor: respondeu ? 'default' : 'pointer', boxShadow: `3px 3px 0 ${INK}`, overflowWrap: 'anywhere',
                background: certo ? GREEN : errado ? RED : '#fff', color: certo || errado ? '#fff' : INK, opacity: respondeu && !certo && !errado ? 0.55 : 1 }}>
              {n}{certo ? ' ✅' : errado ? ' ❌' : ''}
            </button>
          )
        })}
      </div>
      {respondeu
        ? <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 9 }}>
            <span style={{ fontSize: 12, fontWeight: 800 }}>{acertou ? tr('Na mosca! 🎯', 'Spot on! 🎯') : tr(`Era o ${c.name}!`, `It was ${c.name}!`)}</span>
            <button type="button" onClick={proxima} style={{ border: `2.5px solid ${INK}`, borderRadius: 10, background: GOLD, padding: '6px 12px', ...OSW, fontWeight: 900, fontSize: 12.5, boxShadow: `2px 2px 0 ${INK}`, cursor: 'pointer' }}>{tr('Próxima ▶', 'Next ▶')}</button>
          </div>
        : <p style={{ fontSize: 10.5, fontWeight: 700, color: 'rgba(0,0,0,.55)', margin: '8px 0 0', textAlign: 'center' }}>{tr('Só pra passar o tempo — não vale moeda. Acabou o tempo, some sozinho.', 'Just for fun — no coins. When time is up, it goes away by itself.')}</p>}
    </div>
  )
}

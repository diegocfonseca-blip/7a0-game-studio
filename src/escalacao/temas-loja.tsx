// ─── 🎨 TEMA DA SALA NA LOJA (18/10) ────────────────────────────────────────────────────────────────────────────────
// Regras do Diego (18/10): *"grátis, craque e lenda podem pegar avulso só de times"* · Batismo compra o tema do CLUBE (as 2
// versões dele) · *"o fundador eu pergunto qual ele quer, do time ou mascote"* (1 incluso, dado pelo #admin) · extras avulsos
// de qualquer tipo pra Batismo pra cima. R$ 9,90 cada. O preço e quem pode comprar moram no BANCO (`esc_mp_preco_ref`) — a
// tela só mostra; o tema entra na conta quando o Pix cai (`esc_mp_entregar` → `esc_temas_conta`).
import { useState, type CSSProperties } from 'react'
import { tr } from './lang'
import { loggedEmail } from './apoio'
import { PixMP } from './pix-mp'
import { CLUBES_TEMA_CORACAO, releMeusTemas, useTemasDaConta, temaValido, type ClubeCoracaoTema } from './temas-sala'

const INK = '#0C0C0C'
const OSW = { fontFamily: 'Oswald, sans-serif', fontWeight: 700 } as const
const PRECO = 9.9

function MiniTema({ c, size = 64 }: { c: ClubeCoracaoTema; size?: number }) {
  return (
    <span style={{ width: size, height: size * 1.25, flex: 'none', borderRadius: 10, border: `2px solid ${INK}`, overflow: 'hidden', position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      background: `repeating-linear-gradient(160deg,${c.c1} 0 10px,${c.c2} 10px 20px)` }}>
      <span style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 30%,rgba(0,0,0,.05),rgba(0,0,0,.55))' }} />
      <img src={import.meta.env.BASE_URL + c.src} alt="" style={{ position: 'relative', width: size * .62, height: size * .62, objectFit: 'contain', filter: 'drop-shadow(1px 2px 0 rgba(0,0,0,.6))' }} />
    </span>
  )
}

export function TemasNaLoja({ temBatismo, fundador, h2, sub, card, preco, reais }: {
  temBatismo: boolean; fundador: boolean; h2: CSSProperties; sub: CSSProperties; card: CSSProperties; preco: CSSProperties; reais: (v: number) => string
}) {
  const email = loggedEmail()
  const meus = useTemasDaConta(email)
  const [busca, setBusca] = useState('')
  const [escolhido, setEscolhido] = useState<ClubeCoracaoTema | null>(null)
  const [pagando, setPagando] = useState<'coracao' | 'clube' | null>(null)
  const q = busca.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  const lista = CLUBES_TEMA_CORACAO.filter(c => !q || c.nome.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').includes(q)).slice(0, q ? 24 : 12)
  const jaTemCor = (slug: string) => meus.includes(`c:${slug}`)
  const meusNomes = meus.map(id => temaValido(id)?.nome).filter(Boolean) as string[]
  return <div style={{ color: INK }}>
    <h2 id="loja-temas" style={{ ...h2, color: INK }}>{tr('🎨 Tema da sala', '🎨 Room theme')} <span style={sub}>{tr('todo mundo que entra vê', 'everyone who joins sees it')}</span></h2>
    <p style={{ fontSize: 11.5, fontWeight: 700, margin: '0 2px 8px', color: 'rgba(12,12,12,.65)', lineHeight: 1.4 }}>
      {tr('Muda o visual da sua sala de espera, a tela onde a galera entra. O jogo e as regras não mudam. Você escolhe o tema na sala, na hora de esperar a turma.', 'Changes the look of your waiting room, where everyone joins. The game and rules stay the same. You pick the theme in the room while waiting for the crew.')}
    </p>
    {meusNomes.length > 0 && <p style={{ fontSize: 12, fontWeight: 800, margin: '0 2px 8px' }}>✅ {tr('Seus temas:', 'Your themes:')} {meusNomes.join(' · ')}</p>}

    {/* ❤️ TIME DE CORAÇÃO — qualquer um */}
    <div style={card}>
      <b style={{ ...OSW, fontSize: 17, textTransform: 'uppercase', display: 'block' }}>❤️ {tr('Tema do time de coração', 'Your team theme')} · {reais(PRECO)}</b>
      <small style={{ fontSize: 11, fontWeight: 700, lineHeight: 1.3, display: 'block', marginTop: 2 }}>{tr('Listras da camisa, o escudo do time, torcida e bandeiras. É seu pra sempre, em quantas salas quiser.', 'The shirt stripes, the team crest, fans and flags. Yours forever, in as many rooms as you like.')}</small>
      <input value={busca} onChange={e => { setBusca(e.target.value); setEscolhido(null); setPagando(null) }} placeholder={tr('procure o seu time…', 'find your team…')} maxLength={30}
        style={{ width: '100%', boxSizing: 'border-box', marginTop: 8, border: `2px solid ${INK}`, borderRadius: 9, padding: '8px 10px', fontSize: 13.5, fontWeight: 700, color: INK, background: '#fff' }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(74px,1fr))', gap: 8, marginTop: 8 }}>
        {lista.map(c => (
          <button key={c.slug} onClick={() => { setEscolhido(c); setPagando(null) }}
            style={{ background: escolhido?.slug === c.slug ? '#FFF3C4' : '#fff', border: `2px solid ${escolhido?.slug === c.slug ? INK : 'rgba(12,12,12,.15)'}`, borderRadius: 10, padding: 5, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
            <MiniTema c={c} size={52} />
            <span style={{ fontSize: 10, fontWeight: 800, color: INK, lineHeight: 1.1, textAlign: 'center' }}>{c.nome}{jaTemCor(c.slug) ? ' ✅' : ''}</span>
          </button>
        ))}
      </div>
      {!q && <p style={{ fontSize: 10.5, fontWeight: 700, color: 'rgba(12,12,12,.5)', margin: '6px 0 0' }}>{tr(`Mais de ${CLUBES_TEMA_CORACAO.length - 12} times: procure pelo nome.`, `${CLUBES_TEMA_CORACAO.length - 12}+ more teams: search by name.`)}</p>}
      {escolhido && (
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 10, borderTop: '1px dashed #d8ccaa', paddingTop: 10 }}>
          <MiniTema c={escolhido} size={70} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <b style={{ ...OSW, fontSize: 16, textTransform: 'uppercase', display: 'block' }}>{escolhido.nome}</b>
            {jaTemCor(escolhido.slug)
              ? <span style={{ fontSize: 12, fontWeight: 800, color: '#1B7A3D' }}>✅ {tr('Você já tem esse tema.', 'You already have this theme.')}</span>
              : <button onClick={() => setPagando('coracao')} style={{ ...preco, marginTop: 4 }}>{tr('Comprar', 'Buy')} · {reais(PRECO)}</button>}
          </div>
        </div>
      )}
      {pagando === 'coracao' && escolhido && !jaTemCor(escolhido.slug) && (
        <div style={{ marginTop: 10 }}>
          <PixMP key={`tc-${escolhido.slug}`} produto="tema_coracao" valor={PRECO} refId={escolhido.slug} />
          <p style={{ fontSize: 11, fontWeight: 700, margin: '6px 2px 0', color: 'rgba(12,12,12,.6)' }}>{tr('Pagou, o tema aparece na sua sala de espera. Se não aparecer na hora, feche e abra a Loja.', 'Once paid, the theme shows up in your waiting room. If it doesn’t right away, close and reopen the Shop.')}</p>
          <button onClick={() => releMeusTemas(email)} style={{ background: 'none', border: 'none', textDecoration: 'underline', fontWeight: 900, fontSize: 11, color: 'rgba(12,12,12,.55)', cursor: 'pointer', marginTop: 4 }}>{tr('já paguei, atualizar', 'I paid, refresh')}</button>
        </div>
      )}
    </div>

    {/* 🛡️ DO SEU CLUBE — só quem tem clube batizado */}
    <div style={{ ...card, marginTop: 8, opacity: temBatismo ? 1 : .75 }}>
      <b style={{ ...OSW, fontSize: 17, textTransform: 'uppercase', display: 'block' }}>🛡️ {tr('Tema do seu clube', 'Your club theme')} · {reais(PRECO)}</b>
      <small style={{ fontSize: 11, fontWeight: 700, lineHeight: 1.3, display: 'block', marginTop: 2 }}>{tr('Feito com a arte do SEU clube batizado: escudo gigante no fundo, a mascote na tela e as cores do manto, em 2 versões (escura e clara). A gente monta depois do Pix, em até 2 dias.', 'Made with YOUR named club’s art: giant crest in the background, the mascot on screen and your kit colours, in 2 versions (dark and light). We build it after the Pix, within 2 days.')}</small>
      {fundador && <p style={{ fontSize: 11.5, fontWeight: 800, margin: '6px 0 0', color: '#7a4d00' }}>🖋 {tr('Fundador: você tem 1 tema de graça (do clube ou do time de coração). Fala com o Diego qual você quer.', 'Founder: you get 1 theme free (club or your team). Tell Diego which one you want.')}</p>}
      {temBatismo
        ? (pagando === 'clube'
          ? <div style={{ marginTop: 10 }}><PixMP key="tema-clube" produto="tema_clube" valor={PRECO} /></div>
          : <button onClick={() => setPagando('clube')} style={{ ...preco, marginTop: 8 }}>{tr('Comprar', 'Buy')} · {reais(PRECO)}</button>)
        : <p style={{ fontSize: 11.5, fontWeight: 800, margin: '6px 0 0' }}>🔒 {tr('Só pra quem tem clube batizado (é a arte do seu clube). O tema do time de coração aí em cima é pra todo mundo.', 'Only for named-club owners (it uses your club’s art). The team theme above is for everyone.')}</p>}
    </div>
  </div>
}

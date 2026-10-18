// ─── 📅 PATROCÍNIO MENSAL NA LOJA (18/10) ─────────────────────────────────────────────────────────────────────────
// Pedido do Diego, olhando a página de patrocínio do Brasileirinho FC: *"falar mais sobre números e imagens… só falar o que é
// válido pra gente… tudo que levantar a bola… o que for fraco não botar"*. Aprovado no mockup `scripts/mockups/
// marca-patrocinio-mensal.png` ("pode fazer pra todos já"). Regras que ele deu no caminho:
// · SÓ OS NÚMEROS GRANDES (15 mil contas > 8 mil carreiras). Nada de "jogando agora", ativos 24 h, visitas ou semana — perdem.
// · O patrocínio na carreira é contado por TEMPORADA (toda temporada o técnico escolhe o patrocinador): ~100 mil.
// · Fotos de onde a marca aparece: nome da competição, telão do Anúncio do dia, LED, Patrocinador Master, camisa, placas
//   atrás dos gols (só 2: uma em cima, uma embaixo) e vitrine.
// Os números foram medidos no banco em 18/10/2026 e estão escritos aqui; quando crescerem, atualiza `NUMEROS` e a data.
// As fotos moram em `public/patrocinio-mensal/` (fora do bundle: só desce pra quem abre a seção).
import type { CSSProperties } from 'react'
import { tr } from './lang'

const INK = '#0C0C0C'
const OSW = { fontFamily: 'Oswald, sans-serif', fontWeight: 700 } as const
const NUMEROS: { n: string; pt: string; en: string; verde?: boolean; largo?: boolean }[] = [
  { n: '+500 mil', pt: 'partidas jogadas', en: 'matches played' }, // 18/10 (Diego): sem o "desde julho"; eram 497,6 mil com ~2,7 mil por dia
  { n: '28 mil', pt: 'salas online criadas pela galera', en: 'online rooms created by players' },
  { n: '15 mil', pt: 'técnicos com conta no jogo', en: 'managers with an account' },
  { n: '6 mil', pt: 'técnicos diferentes jogaram no último mês', en: 'different managers played last month' },
  { n: '15 mil', pt: 'partidas num dia só (nosso recorde)', en: 'matches in a single day (our record)', verde: true },
  { n: '57%', pt: 'das partidas jogadas ao vivo com amigos', en: 'of matches played live with friends', verde: true },
  { n: '~100 mil', pt: 'vezes que um técnico escolheu o patrocinador do clube na carreira (uma escolha a cada temporada) — é ali que a sua marca entra', en: 'times a manager picked the club sponsor in career mode (one pick every season) — that’s where your brand comes in', verde: true, largo: true },
]
const FOTOS: { src: string; pt: string; en: string; subPt: string; subEn: string }[] = [
  { src: 'naming', pt: '🏆 Nome da competição', en: '🏆 Competition name', subPt: '"Champions Legends apresentada por…" na abertura e no título da competição.', subEn: '"Champions Legends presented by…" on the intro and the competition title.' },
  { src: 'telao', pt: '📢 Telão do Anúncio do dia', en: '📢 Ad of the day board', subPt: 'Passa em todas as salas e na carreira. Tem link: quem toca já abre o site ou o WhatsApp da marca (ex.: "Max Joias · compramos ouro, clique aqui").', subEn: 'Runs in every room and in career mode. It has a link: a tap opens the brand’s site or WhatsApp (e.g. "Max Joias · we buy gold, tap here").' },
  { src: 'led', pt: '🏟️ LED do estádio', en: '🏟️ Stadium LED', subPt: 'O nome da marca passando no letreiro do estádio durante as partidas online, que ficam vários minutos na tela.', subEn: 'The brand name running on the stadium board during online matches, which stay on screen for minutes.' },
  { src: 'master', pt: '🏢 Patrocinador Master da carreira', en: '🏢 Career Master sponsor', subPt: 'Toda temporada nova o técnico escolhe o patrocinador do clube e assina o contrato. Sua marca entra entre as propostas, com logo, valor e meta.', subEn: 'Every new season the manager picks the club sponsor and signs the deal. Your brand is among the offers, with logo, value and target.' },
  { src: 'camisa', pt: '👕 Logo na camisa do clube', en: '👕 Logo on the club shirt', subPt: 'Quem assina com a sua marca leva o logo pra camisa do clube, na loja oficial dentro do jogo (ex.: Final Boss FC com o Rei das Tintas).', subEn: 'Whoever signs with your brand puts the logo on the club shirt, in the official in-game store (e.g. Final Boss FC with Rei das Tintas).' },
  { src: 'campo', pt: '⚽ Placas atrás dos gols', en: '⚽ Boards behind the goals', subPt: 'Uma em cima e uma embaixo de cada campinho do leilão, enquanto a galera monta o time. Trocam a cada 7 segundos.', subEn: 'One at the top and one at the bottom of every auction pitch, while players build their teams. They switch every 7 seconds.' },
  { src: 'vitrine', pt: '🏪 Vitrine dos patrocinadores', en: '🏪 Sponsors showcase', subPt: 'Cartão com logo, texto, Instagram e site da marca.', subEn: 'Card with the brand’s logo, text, Instagram and website.' },
]

export function MarcaMensal({ card, emailContato }: { card: CSSProperties; emailContato: string }) {
  const caixa: CSSProperties = { background: INK, color: '#fff', borderRadius: 12, padding: '10px 10px 9px', border: `2px solid ${INK}` }
  const img: CSSProperties = { border: `3px solid ${INK}`, borderRadius: 12, overflow: 'hidden', marginTop: 10, boxShadow: `3px 3px 0 ${INK}` }
  // a Loja herda letra clara da tela de fundo: a cor vai explícita aqui (mesmo cuidado da seção de temas)
  return <div style={{ color: INK }}>
    <div style={{ ...card, marginTop: 8 }}>
      <span style={{ ...OSW, display: 'inline-block', fontSize: 11, letterSpacing: '.06em', background: '#FFC400', border: `2px solid ${INK}`, borderRadius: 8, padding: '2px 8px', boxShadow: `2px 2px 0 ${INK}` }}>{tr('📅 PATROCÍNIO MENSAL', '📅 MONTHLY SPONSORSHIP')}</span>
      <b style={{ ...OSW, fontSize: 22, lineHeight: 1.05, textTransform: 'uppercase', display: 'block', marginTop: 8 }}>{tr('Sua marca no meio da torcida', 'Your brand in the middle of the crowd')}</b>
      <p style={{ fontSize: 11.5, fontWeight: 700, color: 'rgba(12,12,12,.65)', lineHeight: 1.35, margin: '4px 0 0' }}>{tr('O Leilão Legends é um jogo de leilão de lendas do futebol. A galera monta o time dando lance, joga a temporada e zoa os amigos ao vivo. Sua marca entra no jogo, não num banner.', 'Leilão Legends is an auction game of football legends. Players build their team by bidding, play the season and banter with friends live. Your brand goes inside the game, not on a banner.')}</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 10 }}>
        {NUMEROS.map((x, i) => (
          <div key={i} style={{ ...caixa, ...(x.largo ? { gridColumn: '1 / -1' } : {}) }}>
            <b style={{ ...OSW, display: 'block', fontSize: 28, lineHeight: 1, color: x.verde ? '#5fe08f' : '#FFC400' }}>{x.n}</b>
            <span style={{ display: 'block', fontSize: 11, fontWeight: 700, marginTop: 4, lineHeight: 1.25, color: 'rgba(255,255,255,.85)' }}>{tr(x.pt, x.en)}</span>
          </div>
        ))}
      </div>
    </div>
    <div style={{ ...card, marginTop: 8 }}>
      <b style={{ ...OSW, fontSize: 18, textTransform: 'uppercase', display: 'block' }}>{tr('Onde a sua marca aparece', 'Where your brand shows up')}</b>
      {FOTOS.map(f => <div key={f.src}>
        <div style={img}><img src={`${import.meta.env.BASE_URL}patrocinio-mensal/${f.src}.webp`} alt="" loading="lazy" style={{ display: 'block', width: '100%', height: 'auto' }} /></div>
        <p style={{ ...OSW, fontSize: 14, textTransform: 'uppercase', margin: '8px 0 0' }}>{tr(f.pt, f.en)}
          <small style={{ display: 'block', fontFamily: 'Arial, sans-serif', fontSize: 11, textTransform: 'none', color: 'rgba(12,12,12,.6)', marginTop: 2, lineHeight: 1.3 }}>{tr(f.subPt, f.subEn)}</small></p>
      </div>)}
    </div>
    <div style={{ ...card, marginTop: 8 }}>
      <b style={{ ...OSW, fontSize: 18, textTransform: 'uppercase', display: 'block' }}>{tr('E ainda vem junto', 'Also included')}</b>
      <ul style={{ margin: '6px 0 0', paddingLeft: 18, fontSize: 12, fontWeight: 700, lineHeight: 1.55 }}>
        <li>{tr('📲 Post no Instagram @leilaolegendscom', '📲 A post on Instagram @leilaolegendscom')}</li>
        <li>{tr('💬 Aviso na comunidade dos fãs no WhatsApp', '💬 An announcement in the fans’ WhatsApp community')}</li>
      </ul>
      <p style={{ fontSize: 11.5, fontWeight: 800, margin: '8px 0 0' }}>{tr('Quer saber mais? Fala com a gente:', 'Want to know more? Talk to us:')}</p>
      <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
        <a href="https://ig.me/m/leilaolegendscom" target="_blank" rel="noreferrer" style={{ flex: 1, textAlign: 'center', ...OSW, fontSize: 13, textTransform: 'uppercase', background: '#E1306C', color: '#fff', border: `2px solid ${INK}`, borderRadius: 10, padding: '7px 6px', textDecoration: 'none' }}>📷 Direct @leilaolegendscom</a>
        <a href={`mailto:${emailContato}?subject=${encodeURIComponent('Patrocínio mensal · Leilão Legends')}`} style={{ flex: 1, textAlign: 'center', ...OSW, fontSize: 13, textTransform: 'uppercase', background: '#fff', color: INK, border: `2px solid ${INK}`, borderRadius: 10, padding: '7px 6px', textDecoration: 'none' }}>✉️ E-mail</a>
      </div>
      <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(12,12,12,.5)', margin: '8px 0 0', lineHeight: 1.35 }}>{tr('Números contados pelo próprio jogo em 18/10/2026.', 'Numbers counted by the game itself on 18/10/2026.')}</p>
    </div>
  </div>
}

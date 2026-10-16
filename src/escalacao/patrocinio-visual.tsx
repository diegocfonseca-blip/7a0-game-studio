// ─── 💼 OS ESPAÇOS DO PATROCINADOR MENSAL NA TELA (16/10) ──────────────────────────────────────────────────────────
//
// Diego: *"anúncio no Martelo coloque só no final do jornal… LED no estádio faça também"*.
// · 🏟️ LED do estádio: faixa preta de letreiro passando no topo do palco das partidas online (`CompetitionStage`). Não mexe
//   no placar (ele achou que "placar oferecido por" cansava). Mais de um mensal → as marcas passam uma atrás da outra.
// · 📰 Anúncio no O MARTELO: um quadro de anúncio no FIM do jornal (sala e carreira), logo antes do rodapé.
// Tudo puro CSS + a logo que já existe (0 KB a mais pra quem não vê).
import { ledDoEstadio, anuncioDoMartelo } from './patrocinio'
import { tr } from './lang'

const CSS = `
.pled{position:relative;overflow:hidden;background:#0C0C0C;border:3px solid #0C0C0C;border-radius:10px;height:26px;margin:0 0 10px;box-shadow:inset 0 0 0 1px #2a2a2a}
.pled::after{content:'';position:absolute;inset:0;pointer-events:none;background-image:radial-gradient(rgba(0,0,0,.55) 1px,transparent 1.3px);background-size:3px 3px}
.pled-trilho{position:absolute;top:0;left:0;height:100%;display:flex;align-items:center;white-space:nowrap;animation:pledAnda 22s linear infinite}
.pled-trilho span{font:700 13px/1 Oswald,sans-serif;letter-spacing:.14em;color:#7CFF9B;text-shadow:0 0 6px #33ff66;padding:0 22px;text-transform:uppercase}
.pled-trilho span.pled-casa{color:#FFC400;text-shadow:0 0 6px #ffb300}
@keyframes pledAnda{from{transform:translateX(0)}to{transform:translateX(-50%)}}
@media (prefers-reduced-motion:reduce){.pled-trilho{animation:none}}
`

/** 🏟️ o letreiro LED do estádio (null se não houver mensal com LED) */
export function LedEstadio() {
  const marcas = ledDoEstadio()
  if (!marcas.length) return null
  const volta = marcas.flatMap(m => [
    <span key={m.nome + 'a'}>{m.emoji} {m.nome}</span>,
    ...(m.chamada ? [<span key={m.nome + 'b'}>{m.chamada}</span>] : []),
    <span key={m.nome + 'c'} className="pled-casa">🔨 Leilão Legends</span>,
  ])
  // a volta vai duas vezes no trilho: andando −50% ela emenda sem pulo
  return <div className="pled" aria-label={tr('Patrocinador do estádio', 'Stadium sponsor')}>
    <style>{CSS}</style>
    <div className="pled-trilho">{volta}{volta.map((el, i) => <span key={'r' + i} className={el.props.className}>{el.props.children}</span>)}{volta}{volta.map((el, i) => <span key={'s' + i} className={el.props.className}>{el.props.children}</span>)}</div>
  </div>
}

/** 📰 o quadro de anúncio do fim do O MARTELO (null se não houver anunciante) */
export function AnuncioMartelo() {
  const a = anuncioDoMartelo()
  if (!a) return null
  return <div style={{ marginTop: 12, border: '3px solid #0C0C0C', borderRadius: 10, background: '#fff', color: '#0C0C0C', padding: '8px 12px 10px', textAlign: 'center', position: 'relative' }}>
    <span style={{ position: 'absolute', top: -9, left: 12, background: '#0C0C0C', color: '#FFC400', font: '700 10px Oswald,sans-serif', letterSpacing: '.18em', padding: '2px 8px', borderRadius: 5 }}>{tr('ANÚNCIO', 'ADVERTISEMENT')}</span>
    {a.logo
      ? <img src={a.logo} alt={a.nome} draggable={false} style={{ display: 'block', height: 44, width: Math.round(44 * a.logoProp!), maxWidth: '100%', objectFit: 'contain', margin: '6px auto 2px' }} />
      : <b style={{ display: 'block', font: '900 24px Oswald,sans-serif', textTransform: 'uppercase', marginTop: 6 }}>{a.emoji} {a.nome}</b>}
    <p style={{ margin: '4px 0 0', font: '13px/1.35 Georgia,serif', color: 'rgba(0,0,0,.8)' }}>{a.texto}</p>
    {a.contato && <p style={{ margin: '5px 0 0', font: '700 12px Oswald,sans-serif', letterSpacing: '.06em' }}>{a.contato}</p>}
  </div>
}

// ─── 💼 OS ESPAÇOS DO PATROCINADOR MENSAL NA TELA (16/10) ──────────────────────────────────────────────────────────
//
// Diego: *"anúncio no Martelo coloque só no final do jornal… LED no estádio faça também"*.
// · 🏟️ LED do estádio: faixa preta de letreiro passando no topo do palco das partidas online (`CompetitionStage`). Não mexe
//   no placar (ele achou que "placar oferecido por" cansava). Mais de um mensal → as marcas passam uma atrás da outra.
// · 📰 Anúncio no O MARTELO: um quadro de anúncio no FIM do jornal (sala e carreira), logo antes do rodapé.
// Tudo puro CSS + a logo que já existe (0 KB a mais pra quem não vê).
import { useEffect, useState, type ReactNode } from 'react'
import { ledDoEstadio, anuncioDoMartelo, placasDoCampo, tamanhoMarcaNaPlaca, aviaoDaHome } from './patrocinio'
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
  // Diego (16/10): *"no LED tem que vir escrito só Vadico Veículos"* — só o nome da marca, sem emoji, chamada nem Leilão Legends
  const volta = marcas.flatMap(m => [0, 1, 2].map(k => <span key={m.nome + k}>{m.nome}</span>))
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

// 🏟️ PLACA ATRÁS DO GOL (17/10): `lado` cima/baixo mostra marcas diferentes; as duas trocam juntas a cada 7 s pelo relógio
// (Date.now), então todo campinho da tela e todo mundo da sala vê a mesma marca na mesma hora. 0 KB: logos que já existiam.
const PLACA_GOL_MS = 7000
const CSS_PLACA = `.pgol{position:relative;display:flex;align-items:center;justify-content:center;overflow:hidden}
.pgol:before{content:'';position:absolute;inset:0;background-image:radial-gradient(rgba(0,0,0,.3) .6px,transparent 1px);background-size:2.5px 2.5px;pointer-events:none;z-index:2}
.pgol:after{content:'';position:absolute;inset:0;background:linear-gradient(180deg,rgba(255,255,255,.32),transparent 50%);pointer-events:none;z-index:2}
.pgol-in{display:flex;align-items:center;justify-content:center;width:100%;height:100%;animation:pgolGira .5s cubic-bezier(.2,.9,.3,1.15) both;transform-origin:50% 50%}
@keyframes pgolGira{0%{transform:rotateX(90deg);filter:brightness(2.4)}100%{transform:rotateX(0);filter:none}}
@media (prefers-reduced-motion:reduce){.pgol-in{animation:none}}`
export function PlacaGol({ lado, alt = 30 }: { lado: 'cima' | 'baixo'; alt?: number }) {
  const placas = placasDoCampo()
  const vez = () => Math.floor(Date.now() / PLACA_GOL_MS)
  const [slot, setSlot] = useState(vez)
  useEffect(() => {
    if (placasDoCampo().length < 2) return
    const iv = setInterval(() => setSlot(s => { const v = vez(); return v === s ? s : v }), 500)
    return () => clearInterval(iv)
  }, [])
  if (!placas.length) return null
  const p = placas[(slot + (lado === 'baixo' ? 1 : 0)) % placas.length]
  const borda = lado === 'cima' ? { borderBottom: '3px solid #0C0C0C' } : { borderTop: '3px solid #0C0C0C' }
  return (
    <div className="pgol" style={{ height: alt, background: p.fundo, perspective: 300, ...borda }} aria-label={p.nome}>
      <style>{CSS_PLACA}</style>
      <div className="pgol-in" key={slot}>
        {p.logo
          ? (() => { const m = tamanhoMarcaNaPlaca(alt, p.prop ?? 3, alt * 12); return <img src={p.logo} alt={p.nome} draggable={false} style={{ height: Math.round(m.h), width: Math.round(m.w), objectFit: 'contain', display: 'block' }} /> })()
          : <b style={{ font: `700 ${Math.round(alt * 0.5)}px Oswald, sans-serif`, letterSpacing: '.08em', textTransform: 'uppercase', color: '#0C0C0C' }}>{p.nome}</b>}
      </div>
    </div>
  )
}

/** ✈️ AVIÃOZINHO DA HOME (23/10, ideia do Diego): 10s depois de a home abrir passa UMA vez, da direita pra esquerda, puxando a
 *  faixa do parceiro no espaço onde ficava o "O PREGÃO ESTÁ ABERTO". Tocar na faixa abre o link dele. Some sozinho. */
const AVIAO_CSS = `
.ll-aviao{position:absolute;left:0;right:0;top:50%;height:0;pointer-events:none;overflow:visible;z-index:3}
.ll-aviao-voo{position:absolute;left:0;top:0;display:flex;align-items:center;transform:translate(110vw,-50%);animation:llAviaoVoa 10s linear 10s forwards;will-change:transform}
@keyframes llAviaoVoa{from{transform:translate(110vw,-50%)}to{transform:translate(calc(-100% - 20px),-50%)}}
.ll-aviao-sobe{display:flex;align-items:center;animation:llAviaoBalanca 1.6s ease-in-out infinite}
@keyframes llAviaoBalanca{0%,100%{transform:translateY(0) rotate(-1deg)}50%{transform:translateY(-7px) rotate(1.5deg)}}
.ll-aviao-svg{width:95px;height:55px;flex:none;filter:drop-shadow(3px 3px 0 rgba(0,0,0,.55))}
.ll-aviao-helice{transform-origin:10px 26px;animation:llAviaoGira .12s linear infinite}
@keyframes llAviaoGira{50%{transform:scaleY(.15)}}
.ll-aviao-corda{width:34px;height:2px;background:#2b2b2b;margin-left:-6px;flex:none}
.ll-aviao-faixa{pointer-events:auto;display:flex;align-items:center;gap:9px;height:54px;padding:0 16px 0 9px;border:3px solid #0C0C0C;border-radius:4px 10px 10px 4px;
  box-shadow:3px 3px 0 rgba(0,0,0,.6);transform-origin:left center;animation:llAviaoOndula 1.1s ease-in-out infinite;text-decoration:none;flex:none;position:relative;overflow:hidden}
.ll-aviao-faixa:after{content:'';position:absolute;inset:0;pointer-events:none;background:linear-gradient(90deg,transparent 0 20%,rgba(255,255,255,.14) 30%,transparent 40% 60%,rgba(0,0,0,.18) 72%,transparent 85%);background-size:150px 100%;animation:llAviaoDobra 1.1s linear infinite}
@keyframes llAviaoOndula{0%,100%{transform:skewY(-2deg)}50%{transform:skewY(2deg) scaleY(.94)}}
@keyframes llAviaoDobra{to{background-position:150px 0}}
.ll-aviao-faixa img{height:44px;display:block}
.ll-aviao-t1{font:600 12px/1 Oswald,sans-serif;color:#fff;letter-spacing:.08em}
.ll-aviao-t2{font:700 27px/1 Oswald,sans-serif;color:#E3B53D;white-space:nowrap}
.ll-aviao-rabo{width:13px;height:54px;flex:none;background:linear-gradient(90deg,#E3B53D,#c8992a);clip-path:polygon(0 0,100% 0,60% 50%,100% 100%,0 100%);margin-left:-2px;animation:llAviaoOndula 1.1s ease-in-out infinite}
.ll-aviao-titulo{animation:llAviaoTitulo 21s linear forwards}
@keyframes llAviaoTitulo{0%,46%{opacity:1}50%,94%{opacity:0}100%{opacity:1}}
@media (prefers-reduced-motion:reduce){.ll-aviao{display:none}.ll-aviao-titulo{animation:none}}`
export function AviaoDaHome({ children }: { children?: ReactNode }) {
  const a = aviaoDaHome()
  const [no, setNo] = useState(true)
  useEffect(() => { const t = setTimeout(() => setNo(false), 21500); return () => clearTimeout(t) }, [])
  if (!a || !no) return <>{children}</>
  // o título (O PREGÃO ESTÁ ABERTO) some enquanto o avião cruza (~10s → ~20s) e volta depois
  return (<>
    <div className="ll-aviao-titulo">{children}</div>
    <div className="ll-aviao" aria-hidden="false">
      <style>{AVIAO_CSS}</style>
      <div className="ll-aviao-voo"><div className="ll-aviao-sobe">
        <svg className="ll-aviao-svg" viewBox="0 0 190 110" aria-hidden="true">
          <path d="M30 52 Q40 34 80 34 L150 38 Q172 40 178 30 L184 30 Q186 52 176 62 L80 70 Q40 70 30 52Z" fill="#E8503A" stroke="#0C0C0C" strokeWidth="4" />
          <path d="M58 40 Q66 30 84 32 L84 46 L58 46Z" fill="#9fd6ff" stroke="#0C0C0C" strokeWidth="3" />
          <path d="M86 52 L130 52 L112 86 L96 86Z" fill="#FFC400" stroke="#0C0C0C" strokeWidth="4" />
          <path d="M150 40 L176 14 L186 14 L180 44Z" fill="#FFC400" stroke="#0C0C0C" strokeWidth="4" />
          <rect x="24" y="44" width="10" height="16" rx="3" fill="#333" stroke="#0C0C0C" strokeWidth="3" />
          <g className="ll-aviao-helice"><rect x="16" y="22" width="8" height="60" rx="4" fill="#555" stroke="#0C0C0C" strokeWidth="2" /></g>
          <circle cx="64" cy="90" r="9" fill="#333" stroke="#0C0C0C" strokeWidth="3" /><path d="M64 70 L64 82" stroke="#0C0C0C" strokeWidth="4" />
        </svg>
        <div className="ll-aviao-corda" />
        <a className="ll-aviao-faixa" href={a.link} target="_blank" rel="noopener noreferrer" style={{ background: a.fundo }} aria-label={a.nome}>
          <img src={a.logo} alt="" draggable={false} />
          <span><span className="ll-aviao-t1" style={{ display: 'block' }}>{a.linha1}</span><span className="ll-aviao-t2" style={{ display: 'block' }}>{a.linha2}</span></span>
        </a>
        <div className="ll-aviao-rabo" />
      </div></div>
    </div>
  </>)
}

// 🎽🐾🛡️🎬 LOJA DO CLUBE · "SEU CLUBE" (09/11, Diego aprovou o mockup scripts/mockups/loja-mantos-mascote-gala.png:
// *"pode aprovar tudo já"*).
//  · MANTOS: 1ª e 2ª camisa, 2 ou 3 cores cada. A camisa veste a bolinha do Campo 2D (e o jogo do mapa) e a faixinha das
//    fichas do seu campinho. A 2ª entra sozinha quando a 1ª bate com a cor do rival. Batismo/Fundador já têm a 1ª (o manto
//    medido na arte deles, que não se edita); quem tem as duas escolhe a ORDEM. R$ 9,90 cada · as duas R$ 14,90.
//  · MASCOTE R$ 29,90 · ESCUDO R$ 19,90 · ENTRADA DE GALA R$ 49,90 — a arte é feita pelo Diego (igual ao Fundador: paga,
//    escreve a ideia, ele faz). 🔒 GALA SÓ COM MASCOTE (*"não dá nem pra pagar quem não tem mascote ainda"*).
// 🔒 Quem decide preço e dono é o banco (`esc_mp_preco_ref`, `esc_kit_salvar`, `esc_kit_trocar`); aqui só se mostra.
import { useState } from 'react'
import { tr } from './lang'
import { PixMP, type ProdutoMp } from './pix-mp'
import { meusKits, recarregaKits, salvaKit, trocaKits, useMeuSocio, meuMantoC3 } from './manto'
import { logApoio } from './apoio'

const INK = '#0C0C0C', GREEN = '#1B7A3D', GOLD = '#FFC400', CREAM = '#F4ECD6'
const OSW = { fontFamily: 'Oswald, sans-serif', fontWeight: 900 } as const
export const PRECO_CAMISA = 9.9, PRECO_DUAS = 14.9, PRECO_MASCOTE = 29.9, PRECO_ESCUDO = 19.9, PRECO_GALA = 49.9
const PALETA = ['#0C0C0C', '#FFFFFF', '#C2452F', '#8E1B1B', '#E8503A', '#F28C28', '#FFC400', '#F2E14C', '#1B7A3D', '#0E5A32', '#7BC043',
  '#2B6CFF', '#0E3E86', '#5BC0EB', '#7C3AED', '#E84C9A', '#8B5A2B', '#9AA0A6']

/** ⚽ a bolinha do Campo 2D (estilo jogo de botão) */
export function BotaoCamisa({ cores, n = 10, size = 46 }: { cores: string[]; n?: number; size?: number }) {
  const [c1, c2, c3] = cores
  const id = `bc${cores.join('').replace(/#/g, '')}${n}`
  return <svg width={size} height={size} viewBox="0 0 46 46" aria-hidden="true">
    <defs><clipPath id={id}><circle cx="23" cy="23" r="19" /></clipPath></defs>
    <ellipse cx="25" cy="27" rx="19" ry="17" fill="rgba(0,0,0,.35)" />
    <g clipPath={`url(#${id})`}><rect width="46" height="46" fill={c1} />
      {c2 && <><rect x="12" width="6" height="46" fill={c2} /><rect x="28" width="6" height="46" fill={c2} /></>}
      {c3 && <rect x="22" width="2.4" height="46" fill={c3} />}</g>
    <circle cx="23" cy="23" r="19" fill="none" stroke="#000" strokeWidth="2.5" />
    <text x="23" y="28.5" textAnchor="middle" fontFamily="Oswald" fontWeight="700" fontSize="15" fill="#fff" stroke="#000" strokeWidth="3" paintOrder="stroke">{n}</text>
  </svg>
}
/** 🃏 o boneco sem rosto, de camisa */
function Silhueta({ cores }: { cores: string[] }) {
  const [c1, c2, c3] = cores
  const corpo = 'M4 54 Q4 30 20 28 Q36 30 36 54Z'
  return <svg width="40" height="54" viewBox="0 0 40 54" aria-hidden="true">
    <circle cx="20" cy="15" r="9" fill="#9c9278" stroke="#000" strokeWidth="2" />
    <path d={corpo} fill={c1} stroke="#000" strokeWidth="2" />
    {c2 && <path d="M14 29.5 L14 54 M26 29.5 L26 54" stroke={c2} strokeWidth="4" />}
    {c3 && <path d="M20 28 L20 54" stroke={c3} strokeWidth="1.6" />}
    <path d={corpo} fill="none" stroke="#000" strokeWidth="2" />
  </svg>
}
function Previa({ cores, n }: { cores: string[]; n: number }) {
  return <div style={{ display: 'flex', gap: 6, alignItems: 'center', flex: 'none' }}>
    <div style={{ width: 60, height: 60, borderRadius: 8, border: `2px solid ${INK}`, display: 'grid', placeItems: 'center', background: 'repeating-linear-gradient(0deg,#2f8a3e 0 10px,#38974a 10px 20px)' }}><BotaoCamisa cores={cores} n={n} /></div>
    <div style={{ width: 42, height: 60, border: `2px solid ${INK}`, borderRadius: 6, background: '#efe6cc', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', overflow: 'hidden' }}><Silhueta cores={cores} /></div>
  </div>
}
const bola = (c: string, extra: React.CSSProperties = {}) => ({ width: 24, height: 24, borderRadius: '50%', border: `2px solid ${INK}`, background: c, flex: 'none', ...extra }) as React.CSSProperties

/** ✏️ escolher 2 ou 3 cores */
function Editor({ inicial, slot, aoFechar }: { inicial: string[]; slot: 1 | 2; aoFechar: () => void }) {
  const [cores, setCores] = useState<string[]>(inicial.slice(0, 3))
  const [vaga, setVaga] = useState(0)
  const [busy, setBusy] = useState(false)
  const [erro, setErro] = useState('')
  const poe = (c: string) => setCores(cs => { const n = [...cs]; n[vaga] = c; return n.filter(Boolean) })
  const salvar = async () => {
    setBusy(true); setErro('')
    const ok = await salvaKit(slot, cores)
    setBusy(false)
    if (ok) { logApoio(`🎽 salvou a ${slot}ª camisa ${cores.join(' ')}`); aoFechar() } else setErro(tr('⚠️ Não deu pra salvar agora. Tenta de novo.', '⚠️ Couldn’t save now. Try again.'))
  }
  return <div style={{ marginTop: 8, background: CREAM, border: `2px solid ${INK}`, borderRadius: 10, padding: 10 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <Previa cores={cores} n={slot === 1 ? 10 : 9} />
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {[0, 1, 2].map(i => i < cores.length || i === cores.length
            ? <button key={i} onClick={() => setVaga(i)} aria-label={tr(`Cor ${i + 1}`, `Colour ${i + 1}`)} style={bola(cores[i] ?? '#fff', { width: 30, height: 30, outline: vaga === i ? `3px solid ${GOLD}` : 'none', outlineOffset: 2, borderStyle: cores[i] ? 'solid' : 'dashed', color: '#888', fontWeight: 900 })}>{cores[i] ? '' : '+'}</button>
            : null)}
          {cores.length === 3 && <button onClick={() => { setCores(cs => cs.slice(0, 2)); setVaga(0) }} style={{ fontSize: 11, fontWeight: 800, textDecoration: 'underline', background: 'none', border: 0 }}>{tr('tirar a 3ª', 'remove 3rd')}</button>}
        </div>
        <p style={{ fontSize: 10.5, fontWeight: 700, margin: '4px 0 0', color: 'rgba(12,12,12,.6)' }}>{tr('1ª = a cor da camisa · 2ª = as listras · 3ª (opcional) = o filete', '1st = shirt colour · 2nd = stripes · 3rd (optional) = pinstripe')}</p>
      </div>
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(9, 1fr)', gap: 5, marginTop: 8 }}>
      {PALETA.map(c => <button key={c} onClick={() => poe(c)} aria-label={c} style={bola(c, { width: '100%', height: 26, borderRadius: 7 })} />)}
    </div>
    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 800, marginTop: 6 }}>
      🎨 {tr('Outra cor:', 'Other colour:')}<input type="color" value={cores[vaga] ?? '#ffffff'} onChange={e => poe(e.target.value.toUpperCase())} style={{ width: 40, height: 26, border: `2px solid ${INK}`, borderRadius: 6, padding: 0 }} />
    </label>
    {erro && <p style={{ fontSize: 12, fontWeight: 800, color: '#C2452F', margin: '6px 0 0' }}>{erro}</p>}
    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
      <button onClick={aoFechar} style={{ flex: 1, ...OSW, fontSize: 14, background: '#e6dfc8', border: `3px solid ${INK}`, borderRadius: 10, padding: '7px 0' }}>{tr('CANCELAR', 'CANCEL')}</button>
      <button onClick={salvar} disabled={busy || cores.length < 2} style={{ flex: 2, ...OSW, fontSize: 14, background: GREEN, color: '#fff', border: `3px solid ${INK}`, borderRadius: 10, boxShadow: `2px 2px 0 ${INK}`, padding: '7px 0', opacity: cores.length < 2 ? .5 : 1 }}>{busy ? '…' : tr('✅ SALVAR CAMISA', '✅ SAVE KIT')}</button>
    </div>
  </div>
}

type Compra = { produto: ProdutoMp; valor: number; ref?: string; rotulo: string }

export function MantosNaLoja({ h2, sub, card, preco, reais }: { h2: React.CSSProperties; sub: React.CSSProperties; card: React.CSSProperties; preco: React.CSSProperties; reais: (v: number) => string }) {
  useMeuSocio() // re-renderiza quando as camisas chegam/mudam
  const k = meusKits()
  const [editando, setEditando] = useState<1 | 2 | null>(null)
  const [comprando, setComprando] = useState<Compra | null>(null)
  const [msg, setMsg] = useState('')
  const pago = () => { void recarregaKits() }
  const compra = (c: Compra) => { logApoio(`🛒 loja → ${c.produto}${c.ref ? ` ${c.ref}` : ''}`); setComprando(c); setTimeout(() => document.getElementById('loja-mantos-pix')?.scrollIntoView({ block: 'center', behavior: 'smooth' }), 0) }

  // a 1ª "de verdade": a montada na Loja ou, sem ela, o manto do batismo (com a 3ª cor que só o código sabe)
  const doBatismo = !!k && !k.k1 && !!k.mantoBatismo
  const k1: string[] | null = k?.k1 ?? (k?.mantoBatismo ? [...k.mantoBatismo, meuMantoC3()].filter((c): c is string => !!c) : null)
  const k2 = k?.k2 ?? null
  const tem1 = !!k?.tem1, tem2 = !!k?.tem2
  const trocar = async () => {
    if (!k1 || !k2) return
    setMsg('')
    setMsg(await trocaKits(k1, k2) ? tr('✅ Trocado! Vale no próximo jogo.', '✅ Swapped! Applies from the next match.') : tr('⚠️ Não deu agora. Tenta de novo.', '⚠️ Couldn’t do it now. Try again.'))
  }
  const botaoPreco = (c: Compra, cinza = false) => <button onClick={() => compra(c)} style={{ ...preco, ...(cinza ? { background: '#e6dfc8', color: INK } : {}) }}>{reais(c.valor)}</button>
  const ok = (t: string) => <span style={{ ...OSW, fontSize: 12, background: GREEN, color: '#fff', borderRadius: 6, padding: '3px 7px', border: `2px solid ${INK}`, whiteSpace: 'nowrap' }}>{t}</span>
  const slot = (n: 1 | 2, cores: string[] | null, titulo: string, linha: string, dir: React.ReactNode) => {
    const mostra = cores ?? (n === 1 ? ['#C2452F', '#FFFFFF'] : ['#FFFFFF', '#C2452F'])
    return <div style={{ background: '#fff', border: `3px solid ${INK}`, borderRadius: 12, padding: 10, marginTop: 14, position: 'relative' }}>
      <span style={{ position: 'absolute', top: -11, left: 10, ...OSW, fontSize: 11, background: INK, color: GOLD, padding: '2px 8px', borderRadius: 6, letterSpacing: .5 }}>{n === 1 ? tr('1ª CAMISA', '1st KIT') : tr('2ª CAMISA', '2nd KIT')}</span>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <div style={{ opacity: cores ? 1 : .55 }}><Previa cores={mostra} n={n === 1 ? 10 : 9} /></div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <b style={{ ...OSW, fontSize: 15, textTransform: 'uppercase', display: 'block' }}>{titulo}</b>
          {cores && <div style={{ display: 'flex', gap: 5, margin: '4px 0' }}>{cores.map((c, i) => <span key={i} style={bola(c, { width: 20, height: 20 })} />)}</div>}
          <div style={{ fontSize: 11, fontWeight: 700, color: '#6b6656', lineHeight: 1.3 }}>{linha}</div>
        </div>
        {dir}
      </div>
      {editando === n && <Editor key={n} slot={n} inicial={cores ?? (n === 2 && k1 ? ['#FFFFFF', k1[0]] : ['#C2452F', '#FFFFFF'])} aoFechar={() => setEditando(null)} />}
    </div>
  }

  if (!k) return <>
    <h2 style={h2}>{tr('🎽 Seus mantos', '🎽 Your kits')} <span style={sub}>{tr('2 ou 3 cores', '2 or 3 colours')}</span></h2>
    <div style={card}><p style={{ fontSize: 12.5, fontWeight: 800, margin: 0 }}>{tr('⏳ Carregando as suas camisas… (se não aparecer, entre na sua conta)', '⏳ Loading your kits… (if nothing shows, log into your account)')}</p></div>
  </>

  const editar = (n: 1 | 2) => <button onClick={() => setEditando(editando === n ? null : n)} style={{ ...preco, background: '#e6dfc8', color: INK }}>{tr('✏️ CORES', '✏️ COLOURS')}</button>
  return <>
    <h2 id="loja-mantos" style={h2}>{tr('🎽 Seus mantos', '🎽 Your kits')} <span style={sub}>{tr('2 ou 3 cores', '2 or 3 colours')}</span></h2>
    <div style={card}>
      <p style={{ fontSize: 12, fontWeight: 700, margin: '0 0 6px', lineHeight: 1.4 }}>{tr('Você escolhe as cores da camisa do seu time. Ela veste seus jogadores:', 'You pick your team’s kit colours. Your players wear it:')}</p>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {[tr('⚽ bolinha no Campo 2D', '⚽ token on the 2D Pitch'), tr('🃏 fichas do seu campinho', '🃏 your line-up cards'), tr('🗺️ jogo no mapa', '🗺️ match on the map')].map(t =>
          <span key={t} style={{ fontSize: 10.5, fontWeight: 700, background: '#efe6cc', border: `1.5px solid ${INK}`, borderRadius: 6, padding: '2px 6px' }}>{t}</span>)}
      </div>

      {slot(1, tem1 ? k1 : null,
        tem1 ? (doBatismo ? tr('Do seu batismo', 'From your naming') : k1 ? tr('Sua 1ª camisa', 'Your 1st kit') : tr('Monte a sua', 'Build yours')) : tr('Ainda não tem', 'Not yours yet'),
        tem1 ? (doBatismo ? tr('incluída no plano', 'included in your plan') : tr('a que joga sempre', 'the one you always wear')) : tr('escolhe 2 ou 3 cores', 'pick 2 or 3 colours'),
        tem1 ? (doBatismo ? ok(tr('✓ ATIVA', '✓ ACTIVE')) : editar(1)) : botaoPreco({ produto: 'manto_camisa', ref: '1', valor: PRECO_CAMISA, rotulo: tr('1ª camisa', '1st kit') }))}

      {tem1 && tem2 && k1 && k2 && <div style={{ textAlign: 'center', marginTop: 10 }}>
        <button onClick={() => void trocar()} style={{ ...OSW, fontSize: 13, background: GOLD, border: `3px solid ${INK}`, borderRadius: 10, boxShadow: `3px 3px 0 ${INK}`, padding: '6px 12px' }}>{tr('⇅ TROCAR A ORDEM', '⇅ SWAP THE ORDER')}</button>
      </div>}

      {slot(2, tem2 ? k2 : null,
        tem2 ? (k2 ? tr('Sua 2ª camisa', 'Your 2nd kit') : tr('Nova! Monte a sua', 'New! Build yours')) : tr('Ainda não tem', 'Not yours yet'),
        tr('entra quando bater cor com o rival', 'used when it clashes with the rival'),
        tem2 ? editar(2) : botaoPreco({ produto: 'manto_camisa', ref: '2', valor: PRECO_CAMISA, rotulo: tr('2ª camisa', '2nd kit') }, !tem1))}

      {!tem1 && !tem2 && <div style={{ background: GOLD, border: `3px solid ${INK}`, borderRadius: 12, padding: '9px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: `3px 3px 0 ${INK}`, marginTop: 12 }}>
        <div><b style={{ ...OSW, fontSize: 15 }}>{tr('🎽🎽 AS DUAS JUNTAS', '🎽🎽 BOTH TOGETHER')}</b><br /><s style={{ fontSize: 12, color: '#6b5a10' }}>{reais(PRECO_CAMISA * 2)}</s></div>
        {botaoPreco({ produto: 'manto_duas', valor: PRECO_DUAS, rotulo: tr('as duas camisas', 'both kits') })}
      </div>}
      {tem1 && !tem2 && <p style={{ fontSize: 11.5, fontWeight: 800, color: GREEN, margin: '10px 0 0', lineHeight: 1.35 }}>{tr('💡 Hoje, quando a cor bate com a do rival, seu time joga de branco. Com a 2ª camisa, joga com a SUA.', '💡 Today, when your colour clashes with the rival’s, your team wears white. With a 2nd kit, it wears YOURS.')}</p>}
      {tem1 && tem2 && <p style={{ fontSize: 11.5, fontWeight: 800, color: GREEN, margin: '10px 0 0', lineHeight: 1.35 }}>{tr('✓ Você tem as duas. Toque em TROCAR pra decidir qual é a 1ª.', '✓ You have both. Tap SWAP to choose which one is 1st.')}</p>}
      {msg && <p style={{ fontSize: 12, fontWeight: 800, margin: '8px 0 0', color: msg.startsWith('⚠️') ? '#C2452F' : GREEN }}>{msg}</p>}
      {comprando && (comprando.produto === 'manto_camisa' || comprando.produto === 'manto_duas') && <div id="loja-mantos-pix" style={{ marginTop: 12 }}>
        <p style={{ fontSize: 12.5, fontWeight: 800, margin: '0 0 6px' }}>{tr(`Comprando: ${comprando.rotulo} · ${reais(comprando.valor)}. Pagou, já escolhe as cores aqui.`, `Buying: ${comprando.rotulo} · ${reais(comprando.valor)}. Once paid, pick the colours right here.`)}</p>
        <PixMP key={`${comprando.produto}-${comprando.ref ?? ''}`} produto={comprando.produto} valor={comprando.valor} refId={comprando.ref ?? ''} aoPagar={pago} />
      </div>}
    </div>

    <ArteBox titulo={tr('🐾 Mascote do clube', '🐾 Club mascot')} subt={tr('feito só pro seu time', 'made just for your team')} icone="🐊"
      nome={tr('Seu bicho, sua arte', 'Your creature, your art')} texto={tr('Aparece no seu gol, na festa de campeão e no pulo do pênalti.', 'Shows up on your goals, the title party and the penalty jump.')}
      tem={k.mascote} producao={k.producao.includes('mascote')} item={{ produto: 'mascote_clube' as ProdutoMp, valor: PRECO_MASCOTE, rotulo: tr('mascote do clube', 'club mascot') }}
      {...{ card, h2, sub, preco, reais, comprando, pago }} aoComprar={compra} />
    <ArteBox titulo={tr('🛡️ Escudo do clube', '🛡️ Club crest')} subt={tr('feito só pro seu time', 'made just for your team')} icone="🛡️"
      nome={tr('Seu escudo, sua arte', 'Your crest, your art')} texto={tr('Na tabela, no placar, nos gols e nas copas.', 'On the table, the scoreboard, goals and cups.')}
      tem={k.escudo} producao={k.producao.includes('escudo')} item={{ produto: 'escudo_clube' as ProdutoMp, valor: PRECO_ESCUDO, rotulo: tr('escudo do clube', 'club crest') }}
      {...{ card, h2, sub, preco, reais, comprando, pago }} aoComprar={compra} />
    <ArteBox titulo={tr('🎬 Entrada de gala', '🎬 Grand entrance')} subt={tr('personalizada', 'custom')} icone="🎆"
      nome={tr('Sua entrada, só sua', 'Your entrance, only yours')} texto={tr('Quando você entra na sala online, todo mundo vê a sua cena: mascote, escudo e as cores do clube.', 'When you join an online room, everyone sees your scene: mascot, crest and club colours.')}
      tem={k.gala} producao={k.producao.includes('gala')} trava={!k.mascote ? tr('🔒 Precisa do mascote primeiro: é ele que entra em cena. Compre o 🐾 mascote aqui em cima e a gala abre.', '🔒 Needs the mascot first: it’s the star of the scene. Buy the 🐾 mascot above and the entrance unlocks.') : null}
      item={{ produto: 'gala_clube' as ProdutoMp, valor: PRECO_GALA, rotulo: tr('entrada de gala', 'grand entrance') }}
      {...{ card, h2, sub, preco, reais, comprando, pago }} aoComprar={compra} />
  </>
}

function ArteBox({ titulo, subt, icone, nome, texto, tem, producao, trava = null, item, card, h2, sub, preco, reais, comprando, aoComprar, pago }: {
  titulo: string; subt: string; icone: string; nome: string; texto: string; tem: boolean; producao: boolean; trava?: string | null; item: Compra
  card: React.CSSProperties; h2: React.CSSProperties; sub: React.CSSProperties; preco: React.CSSProperties; reais: (v: number) => string
  comprando: Compra | null; aoComprar: (c: Compra) => void; pago: () => void
}) {
  const aqui = comprando?.produto === item.produto
  return <>
    <h2 style={{ ...h2, marginTop: 18 }}>{titulo} <span style={sub}>{subt}</span></h2>
    <div style={{ ...card }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', background: '#fff', border: `3px solid ${INK}`, borderRadius: 12, padding: 10, opacity: trava && !tem ? .6 : 1 }}>
        <span style={{ width: 54, height: 54, border: `2px solid ${INK}`, borderRadius: 10, display: 'grid', placeItems: 'center', fontSize: 30, background: '#efe6cc', flex: 'none' }}>{icone}</span>
        <div style={{ flex: 1 }}><b style={{ ...OSW, fontSize: 16, textTransform: 'uppercase' }}>{nome}</b><p style={{ margin: '2px 0 0', fontSize: 11.5, fontWeight: 700, color: '#3a372e', lineHeight: 1.35 }}>{texto}</p></div>
        {producao ? <span style={{ ...OSW, fontSize: 12, color: '#7C3AED', textAlign: 'center' }}>{tr('🎨 EM PRODUÇÃO', '🎨 IN PROGRESS')}</span>
          : tem ? <span style={{ ...OSW, fontSize: 12, color: GREEN, whiteSpace: 'nowrap' }}>{tr('✓ JÁ É SEU', '✓ YOURS')}</span>
          : <button disabled={!!trava} onClick={() => aoComprar(item)} style={{ ...preco, opacity: trava ? .5 : 1, cursor: trava ? 'not-allowed' : 'pointer' }}>{reais(item.valor)}</button>}
      </div>
      {trava && !tem && <p style={{ fontSize: 11.5, fontWeight: 800, margin: '8px 2px 0', color: '#C2452F', lineHeight: 1.35 }}>{trava}</p>}
      {producao && <p style={{ fontSize: 11.5, fontWeight: 700, margin: '8px 2px 0', color: '#55594c', lineHeight: 1.35 }}>{tr('O Diego está fazendo a sua arte. Quando ficar pronta, ela aparece no jogo sozinha.', 'Diego is making your art. When it’s ready, it shows up in the game by itself.')}</p>}
      {!tem && !producao && !trava && <p style={{ fontSize: 11, fontWeight: 700, margin: '8px 2px 0', color: '#55594c', lineHeight: 1.35 }}>{tr('🎨 Você paga, conta a sua ideia por escrito e o Diego faz a arte, exclusiva pro seu clube.', '🎨 You pay, describe your idea in writing and Diego makes the art, exclusive to your club.')}</p>}
      {aqui && <div style={{ marginTop: 12 }}><PixMP key={item.produto} produto={item.produto} valor={item.valor} aoPagar={pago} /></div>}
    </div>
  </>
}

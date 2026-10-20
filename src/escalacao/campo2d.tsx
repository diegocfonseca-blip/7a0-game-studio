// 📺 CAMPO 2D — a tela (20/10). O protótipo que o Diego aprovou (`scripts/prototipo-jogo-ao-vivo/`) virou componente do jogo.
// Quem decide o jogo continua sendo o motor de sempre: aqui entram os gols e as chances já calculados e o MINUTO do placar; o
// `Jogo2D` (campo2d-motor.ts) monta as jogadas em volta e este componente só desenha.
// Regras dele que moram aqui:
//   · 👕 a bolinha tem a COR DA CAMISA do time (nunca da categoria); camisa parecida → o visitante entra com a 2ª cor;
//   · 👑 só lenda tem rostinho (anel grosso na cor do time); o resto, a inicial;
//   · ⚽ no gol entra o MASCOTE do time (quem tem) ou "GOOOL" + escudo (quem não tem), com a faixinha do autor — sem rosto.
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Jogo2D, eventosDoJogo, W, L, type CartaCampo } from './campo2d-motor'
import { chancesDoJogo, sementeDasChances, quemFinalizou } from './chances'
import { avatarLote1 } from './avatar-lote1'
import { useT } from './lang'

const INK = '#0C0C0C', GOLD = '#FFC400'
const OSW = { fontFamily: 'Oswald, sans-serif', fontWeight: 700 } as const
const PAD = 4

type Gol = { name: string; min: number; home: boolean; assist?: string }
export interface Campo2DProps {
  roundKey: number
  casa: { nome: string; cor: string; cartas?: CartaCampo[]; mascote?: ReactNode | null; escudo?: ReactNode }
  fora: { nome: string; cor: string; cartas?: CartaCampo[]; mascote?: ReactNode | null; escudo?: ReactNode }
  gols: Gol[]
  roundMs: number
  minuto: number // o minuto que o placar mostra (o relógio manda)
  fechado?: boolean
  tatica?: [number, number]
}

// 🎨 cor e tinta: luminância pra escolher letra clara/escura, e distância pra trocar a camisa do visitante
const rgb = (hex: string) => { const n = parseInt((hex || '#888888').replace('#', '').slice(0, 6).padEnd(6, '8'), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255] }
const claro = (hex: string) => { const [r, g, b] = rgb(hex); return 0.299 * r + 0.587 * g + 0.114 * b > 160 }
const perto = (a: string, b: string) => { const [r1, g1, b1] = rgb(a), [r2, g2, b2] = rgb(b); return Math.hypot(r1 - r2, g1 - g2, b1 - b2) < 110 }
const IMGS = new Map<string, HTMLImageElement>()
function rosto(c?: CartaCampo): HTMLImageElement | null {
  if (!c || (c.fame ?? 0) < 5) return null
  const art = avatarLote1(c.name, c.club, c.year)
  if (!art) return null
  const src = `${import.meta.env.BASE_URL}${art.src.slice(1)}`
  let im = IMGS.get(src)
  if (!im) { im = new Image(); im.src = src; IMGS.set(src, im) }
  return im
}

export function Campo2D({ roundKey, casa, fora, gols, roundMs, minuto, fechado, tatica }: Campo2DProps) {
  const t = useT()
  const cv = useRef<HTMLCanvasElement | null>(null)
  const caixa = useRef<HTMLDivElement | null>(null)
  const [larg, setLarg] = useState(360)
  const [narra, setNarra] = useState('')
  const [festa, setFesta] = useState<{ lado: 0 | 1; autor: string; assist?: string; min: number } | null>(null)
  // 👕 camisas: o visitante troca pra 2ª cor quando bate com a do mandante
  const corCasa = casa.cor || '#C2452F'
  const corFora = perto(corCasa, fora.cor || '#2B6CFF') ? (claro(corCasa) ? '#1B1B1B' : '#F4F4F4') : (fora.cor || '#2B6CFF')
  // o jogo do campinho: um por rodada (mesma semente das chances → o que a rádio narra é o que o campinho mostra)
  const jogo = useMemo(() => {
    const seed = sementeDasChances(roundKey, casa.nome, fora.nome)
    const chances = chancesDoJogo(seed, gols, roundMs)
    const evs = eventosDoJogo(gols, chances, c => quemFinalizou(c.home ? casa.cartas : fora.cartas, { ...c, fim: 'fora' }, c.home ? casa.nome : fora.nome))
    return new Jogo2D(seed, casa.cartas ?? [], fora.cartas ?? [], evs, t('pt', 'en') === 'en')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roundKey, casa.nome, fora.nome, roundMs])
  if (tatica) jogo.tatica = tatica
  // ⏱️ o minuto do placar chega inteiro; aqui ele vira contínuo (até o próximo inteiro) pro campinho andar liso
  const relogio = useRef({ min: 0, em: performance.now() })
  useEffect(() => { relogio.current = { min: minuto, em: performance.now() } }, [minuto])
  const msPorMin = Math.max(400, roundMs * 0.82) / 93

  useEffect(() => {
    const el = caixa.current
    if (!el) return
    const ro = new ResizeObserver(() => setLarg(Math.min(460, el.clientWidth)))
    ro.observe(el); setLarg(Math.min(460, el.clientWidth))
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    let raf = 0
    const S = larg / (W + PAD * 2), CW = larg, CH = Math.round((L + PAD * 2) * S)
    const c = cv.current; if (!c) return
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    c.width = CW * dpr; c.height = CH * dpr; c.style.width = CW + 'px'; c.style.height = CH + 'px'
    const cx = c.getContext('2d')!; cx.setTransform(dpr, 0, 0, dpr, 0, 0)
    const px = (x: number) => (x + PAD) * S, py = (y: number) => (y + PAD) * S
    const R = Math.max(8, S * 1.95)
    const cartaDe = new Map<string, CartaCampo>()
    for (const k of [...(casa.cartas ?? []), ...(fora.cartas ?? [])]) cartaDe.set(k.name, k)
    let ultNarra = '', ultFesta = ''
    const quadro = () => {
      const r = relogio.current
      const m = fechado ? 93.5 : Math.min(r.min + 0.999, r.min + (performance.now() - r.em) / msPorMin)
      jogo.avancaAte(m)
      if (jogo.narra !== ultNarra) { ultNarra = jogo.narra; setNarra(jogo.narra) }
      const fk = jogo.festa ? `${jogo.festa.lado}|${jogo.festa.autor}|${jogo.festa.min}` : ''
      if (fk !== ultFesta) { ultFesta = fk; setFesta(jogo.festa ? { lado: jogo.festa.lado, autor: jogo.festa.autor, assist: jogo.festa.assist, min: jogo.festa.min } : null) }
      // 🟩 gramado + linhas
      for (let i = 0; i < 12; i++) { cx.fillStyle = i % 2 ? '#2B8443' : '#2F8F49'; cx.fillRect(0, (i * CH) / 12, CW, CH / 12 + 1) }
      cx.strokeStyle = 'rgba(255,255,255,.85)'; cx.lineWidth = 2
      cx.strokeRect(px(0), py(0), W * S, L * S)
      cx.beginPath(); cx.moveTo(px(0), py(L / 2)); cx.lineTo(px(W), py(L / 2)); cx.stroke()
      cx.beginPath(); cx.arc(px(34), py(L / 2), 9.15 * S, 0, 7); cx.stroke()
      for (const [y0, s] of [[0, 1], [L, -1]] as const) {
        cx.strokeRect(px(13.85), s > 0 ? py(0) : py(L - 16.5), 40.3 * S, 16.5 * S)
        cx.strokeRect(px(24.85), s > 0 ? py(0) : py(L - 5.5), 18.3 * S, 5.5 * S)
        const g = jogo.rede && jogo.rede.y0 === y0 ? Math.sin((jogo.t - jogo.rede.t0) * 30) * 3 * Math.max(0, 1 - (jogo.t - jogo.rede.t0)) : 0
        cx.fillStyle = 'rgba(255,255,255,.35)'; cx.fillRect(px(30.34), s > 0 ? py(-2.2) - g : py(L), 7.32 * S, 2.2 * S + g)
        cx.lineWidth = 3; cx.strokeStyle = '#fff'; cx.strokeRect(px(30.34), s > 0 ? py(-2.2) - g : py(L), 7.32 * S, 2.2 * S + g)
        cx.lineWidth = 2; cx.strokeStyle = 'rgba(255,255,255,.85)'
      }
      // 🧍 os 22 (de trás pra frente)
      for (const p of [...jogo.atl].sort((a, b) => a.y - b.y)) {
        const X = px(p.x), Y = py(p.y)
        const camisa = p.lado === 0 ? corCasa : corFora
        cx.beginPath(); cx.ellipse(X, Y + R - 2, R * 0.9, 3.5, 0, 0, 7); cx.fillStyle = 'rgba(0,0,0,.25)'; cx.fill()
        const im = rosto(cartaDe.get(p.nome) ?? p.carta)
        cx.save(); cx.beginPath(); cx.arc(X, Y, R, 0, 7); cx.closePath(); cx.fillStyle = im ? '#fff' : camisa; cx.fill(); cx.clip()
        if (im) { if (im.complete && im.naturalWidth) cx.drawImage(im, im.naturalWidth * 0.29, im.naturalHeight * 0.02, im.naturalWidth * 0.42, im.naturalWidth * 0.42, X - R, Y - R, R * 2, R * 2) }
        else if (p.nome) { cx.fillStyle = claro(camisa) ? INK : '#fff'; cx.font = `700 ${Math.round(R * 1.05)}px Oswald`; cx.textAlign = 'center'; cx.fillText(p.nome.trim()[0].toUpperCase(), X, Y + R * 0.38) }
        cx.restore()
        cx.beginPath(); cx.arc(X, Y, R, 0, 7); cx.lineWidth = im ? 3.5 : 2; cx.strokeStyle = im ? camisa : INK; cx.stroke()
        if (p === jogo.bola.dono) { cx.beginPath(); cx.arc(X, Y, R + 3.5, 0, 7); cx.lineWidth = 2; cx.strokeStyle = 'rgba(255,255,255,.9)'; cx.stroke() }
        if (p.nome) {
          const nm = p.nome.length > 13 ? p.nome.split(' ').slice(-1)[0] : p.nome
          cx.font = `700 ${Math.max(8, Math.round(R * 0.72))}px Oswald`; const w = cx.measureText(nm).width + 6
          cx.fillStyle = 'rgba(0,0,0,.6)'; cx.fillRect(X - w / 2, Y + R + 1, w, R * 0.95); cx.fillStyle = '#fff'; cx.textAlign = 'center'; cx.fillText(nm, X, Y + R + R * 0.78)
        }
      }
      // ⚽ a bola (com sombra; sobe quando é cruzamento/chute alto)
      const bx = px(jogo.bola.x), by = py(jogo.bola.y), bh = jogo.bola.h * S
      cx.beginPath(); cx.ellipse(bx, by + 2, 4, 2, 0, 0, 7); cx.fillStyle = 'rgba(0,0,0,.35)'; cx.fill()
      cx.beginPath(); cx.arc(bx, by - bh, 4.2 + jogo.bola.h * 0.25, 0, 7); cx.fillStyle = '#fff'; cx.fill(); cx.lineWidth = 1.5; cx.strokeStyle = '#111'; cx.stroke()
      raf = requestAnimationFrame(quadro)
    }
    raf = requestAnimationFrame(quadro)
    return () => cancelAnimationFrame(raf)
  }, [jogo, larg, corCasa, corFora, fechado, msPorMin, casa.cartas, fora.cartas])

  const time = festa ? (festa.lado === 0 ? casa : fora) : null
  return (
    <div ref={caixa} style={{ marginBottom: 10 }}>
      <div style={{ position: 'relative', width: larg, margin: '0 auto', border: `3px solid ${INK}`, borderRadius: 14, overflow: 'hidden', boxShadow: `3px 3px 0 ${INK}` }}>
        <canvas ref={cv} style={{ display: 'block' }} />
        {festa && time && (
          // ⚽ o GOL: mascote grande (quem tem) ou GOOOL + escudo; embaixo a faixinha do autor — o mesmo teatro uma vez só
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.5)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, animation: 'c2dEntra .3s ease' }}>
            <style>{'@keyframes c2dEntra{from{opacity:0}to{opacity:1}}@keyframes c2dQuica{0%{transform:translateX(220px) rotate(10deg)}55%{transform:translateX(0) rotate(0)}70%{transform:translateY(-14px)}85%{transform:translateY(0)}100%{transform:translateY(-6px)}}'}</style>
            <div style={{ ...OSW, fontSize: Math.round(larg / 6.5), color: GOLD, textShadow: `4px 4px 0 ${INK}`, lineHeight: 1 }}>{t('GOOOOL!', 'GOOOAL!')}</div>
            <div style={{ animation: 'c2dQuica .9s cubic-bezier(.3,1.4,.5,1)', transform: 'scale(1.15)' }}>{time.mascote ?? time.escudo ?? null}</div>
            <div style={{ ...OSW, fontSize: 18, background: '#fff', color: INK, border: `3px solid ${INK}`, borderRadius: 12, padding: '2px 12px', boxShadow: `3px 3px 0 ${INK}`, whiteSpace: 'nowrap', maxWidth: '92%', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              ⚽ {festa.autor.toUpperCase()} {festa.min > 90 ? `90+${festa.min - 90}` : festa.min}'{festa.assist ? `  ·  🅰️ ${festa.assist}` : ''}
            </div>
          </div>
        )}
      </div>
      {narra && (
        <div style={{ maxWidth: larg, margin: '8px auto 0', background: '#fff', color: INK, border: `3px solid ${INK}`, borderRadius: 12, padding: '7px 10px', fontSize: 13, fontWeight: 700, lineHeight: 1.3 }}
          dangerouslySetInnerHTML={{ __html: '🎙️ ' + narra }} />
      )}
    </div>
  )
}

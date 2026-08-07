import { useState } from 'react'
// ─── 🏟️ ESTÁDIO — aba da carreira (o estádio que CRESCE na tela) ─────────
// Cada compra APARECE no desenho: torcida enchendo os setores, refletores
// acendendo (anoitece!), telão ligando, loja, estacionamento, cobertura.
// Melhorias destravam em árvore. Renda cai sozinha no fim de cada temporada.
import { STADIUM_SECTORS, STADIUM_EXTRAS, STADIUM_STEP, STADIUM_BASE, sectorPct, hasExtra, extraUnlocked, stadiumIncome, stadiumBuiltIncome, stadiumSeats, stadiumLevel, SPONSOR_BET_META, SPONSOR_BET_PAY, sponsorBrandsOfTier, sponsorBrandOf } from './estadiodata'
import type { StadiumSave, SponsorBetTier, SponsorBrand } from './estadiodata'
import { VADICO_LOGO } from './vadico'
import { ERO_LOGO } from './ero'
import { MAXJOIAS_LOGO } from './maxjoias'
import { myApoioPerk, loggedEmail, APOIO_PERKS } from './apoio'
import type { ApoioPerk } from './apoio'

const INK = '#0C0C0C'
const GOLD = '#F5B301'
const GREEN = '#1B7A3D'
const EMPTY = '#EBE2CA'
const OSW = { fontFamily: 'Oswald, sans-serif' } as const
const box = (bg = '#fff'): React.CSSProperties => ({ background: bg, border: `3px solid ${INK}`, borderRadius: 16, boxShadow: `4px 4px 0 0 ${INK}` })

// geometria das arquibancadas em perspectiva (viewBox 360×312)
const STANDS: Record<string, { pts: number[][]; axis: 'x' | 'y'; from: number; to: number; lx: number; ly: number; rot: number }> = {
  geral:     { pts: [[128, 16], [212, 16], [246, 68], [94, 68]],    axis: 'y', from: 68,  to: 16,  lx: 170, ly: 47,  rot: 0 },
  cadeiras:  { pts: [[94, 244], [246, 244], [212, 296], [128, 296]], axis: 'y', from: 244, to: 296, lx: 170, ly: 275, rot: 0 },
  camarote:  { pts: [[243, 74], [296, 104], [296, 206], [243, 238]], axis: 'x', from: 243, to: 296, lx: 269, ly: 158, rot: 90 },
  visitante: { pts: [[97, 74], [97, 238], [64, 206], [64, 104]],     axis: 'x', from: 97,  to: 64,  lx: 80,  ly: 158, rot: -90 },
}
const P = (a: number[][]) => a.map(p => p.join(',')).join(' ')

// ─── 🤝 PATROCÍNIO POR APOSTA (05/08) ──────────────────────────────────────
// Toda temporada o técnico aposta num nível de meta ANTES de jogar. Bateu a
// meta escolhida → ganha o valor dela. Ficou aquém → NADA. Superou (mirou
// baixo) → só o valor apostado mesmo assim. 3 marcas por nível (identidade).
const TIER_BG: Record<SponsorBetTier, string> = { 1: '#EAF3FF', 2: '#FFF3CF', 3: 'linear-gradient(90deg,#FFE79A,#FFC400)' }
const sponsorLogoSrc = (s: SponsorBrand) => s.logo === 'ero' ? ERO_LOGO : s.logo === 'vadico' ? VADICO_LOGO : s.logo === 'maxjoias' ? MAXJOIAS_LOGO : undefined

// cartão de UM nível (usado dentro do banner de escolha)
function SponsorTierCard({ tier, div, chosen, onPick }: { tier: SponsorBetTier; div: string; chosen?: { tier: SponsorBetTier; brandId: string }; onPick: (brandId: string) => void }) {
  const meta = SPONSOR_BET_META[tier]
  const value = (SPONSOR_BET_PAY[div] ?? [0, 0, 0])[tier - 1]
  const brands = sponsorBrandsOfTier(tier)
  return (
    <div style={{ ...box('#fff'), overflow: 'hidden', marginBottom: 10 }}>
      <div style={{ background: TIER_BG[tier], padding: '9px 11px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ ...OSW, fontWeight: 900, fontSize: 13 }}>{meta.emoji} {meta.label}</span>
        <span style={{ ...OSW, fontWeight: 900, fontSize: 15, background: INK, color: GOLD, borderRadius: 8, padding: '2px 9px' }}>+{value}</span>
      </div>
      <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(0,0,0,.55)', margin: '8px 11px' }}>{meta.desc}</p>
      <div style={{ display: 'flex', gap: 6, padding: '0 9px 10px' }}>
        {brands.map(b => {
          const on = chosen?.tier === tier && chosen?.brandId === b.id
          const logo = sponsorLogoSrc(b)
          return (
            <button key={b.id} onClick={() => onPick(b.id)}
              style={{ flex: 1, minWidth: 0, background: on ? INK : '#FBF6E9', border: `2.5px solid ${INK}`, borderRadius: 10, padding: '8px 5px', textAlign: 'center', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, boxShadow: on ? `0 0 0 3px ${GOLD} inset` : 'none' }}>
              <div style={{ height: 46, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {logo ? <img alt={b.name} src={logo} style={{ maxHeight: 44, maxWidth: '100%', objectFit: 'contain', filter: on ? 'brightness(0) invert(1)' : undefined }} /> : <span style={{ fontSize: 30 }}>{b.emoji}</span>}
              </div>
              <span style={{ ...OSW, fontWeight: 900, fontSize: 10, lineHeight: 1.1, color: on ? '#fff' : INK }}>{b.name}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
// tabela de valores por divisão (pra explicar a régua discretamente)
export function SponsorPayTable() {
  const rows: [string, string][] = [['V', '🌱 Várzea'], ['D', 'Série D'], ['C', 'Série C'], ['B', 'Série B'], ['A', 'Série A']]
  return (
    <div style={{ ...box('#fff'), padding: '9px 11px', fontSize: 10.5 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 4, fontWeight: 900, ...OSW, color: 'rgba(0,0,0,.45)', fontSize: 8.5, textTransform: 'uppercase', marginBottom: 4 }}>
        <span>Divisão</span><span style={{ textAlign: 'center' }}>🛡️ Não cair</span><span style={{ textAlign: 'center' }}>📈 Top 4</span><span style={{ textAlign: 'center' }}>👑 Campeão</span>
      </div>
      {rows.map(([d, label]) => {
        const [t1, t2, t3] = SPONSOR_BET_PAY[d] ?? [0, 0, 0]
        return <div key={d} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 4, fontWeight: 800, padding: '3px 0', borderTop: '1px solid rgba(0,0,0,.08)' }}><span>{label}</span><span style={{ textAlign: 'center' }}>{t1}</span><span style={{ textAlign: 'center' }}>{t2}</span><span style={{ textAlign: 'center' }}>{t3}</span></div>
      })}
      <p style={{ fontSize: 9, fontWeight: 700, color: 'rgba(0,0,0,.4)', margin: '7px 0 0', lineHeight: 1.35 }}>Dobra a cada divisão. Ficou aquém da meta escolhida? Não paga nada. Superou (mirou baixo)? Paga só o que você apostou.</p>
    </div>
  )
}
// 🎯 BANNER de início de temporada — trava o "Começar a temporada" até escolher.
export function SponsorBetBanner({ div, chosen, onPick }: { div: string; chosen?: { tier: SponsorBetTier; brandId: string }; onPick: (tier: SponsorBetTier, brandId: string) => void }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ ...box(INK), padding: '10px 13px', marginBottom: 10, color: '#fff', textAlign: 'center' }}>
        <p style={{ ...OSW, fontWeight: 900, fontSize: 15, color: GOLD, margin: 0 }}>🤝 PATROCÍNIO DA TEMPORADA</p>
        <p style={{ fontSize: 10.5, fontWeight: 700, color: 'rgba(255,255,255,.8)', margin: '2px 0 0' }}>Escolha a APOSTA — quanto mais ambiciosa, mais paga (só se der certo)</p>
      </div>
      {([1, 2, 3] as SponsorBetTier[]).map(t => <SponsorTierCard key={t} tier={t} div={div} chosen={chosen} onPick={brandId => onPick(t, brandId)} />)}
      {chosen ? (
        <div style={{ ...box(GREEN), padding: 11, color: '#fff', textAlign: 'center', fontWeight: 900, ...OSW, fontSize: 13 }}>
          ✅ Escolhido: {SPONSOR_BET_META[chosen.tier].emoji} {SPONSOR_BET_META[chosen.tier].label} · {sponsorBrandOf(chosen.brandId)?.name}
        </div>
      ) : (
        <p style={{ fontSize: 10.5, fontWeight: 800, color: '#B23A2A', textAlign: 'center', margin: 0 }}>👆 Escolha uma marca aí em cima pra liberar o início da temporada</p>
      )}
      <p style={{ fontSize: 9.5, fontWeight: 700, color: 'rgba(0,0,0,.45)', textAlign: 'center', margin: '7px 2px 0 2px', lineHeight: 1.4 }}>Vale a temporada inteira. Ficou aquém do escolhido (ex.: apostou "não cair" e caiu)? Não paga nada. Bateu mas podia ter mirado mais alto? Recebe só o que apostou.</p>
      <div style={{ marginTop: 9 }}><SponsorPayTable /></div>
    </div>
  )
}
// 🧾 status compacto pra aba Clube (só leitura — a escolha é no banner de início)
export function SponsorBetStatus({ bet }: { bet?: { tier: SponsorBetTier; brandId: string } }) {
  if (!bet) return null
  const meta = SPONSOR_BET_META[bet.tier]
  const brand = sponsorBrandOf(bet.brandId)
  return (
    <div style={{ ...box('#fff'), padding: 12, marginTop: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{ fontSize: 22 }}>{meta.emoji}</span>
      <div style={{ minWidth: 0 }}>
        <p style={{ ...OSW, fontWeight: 900, fontSize: 12, margin: 0 }}>🤝 Patrocínio: {meta.label}</p>
        <p style={{ fontSize: 10.5, fontWeight: 700, color: 'rgba(0,0,0,.55)', margin: '2px 0 0' }}>{brand?.name} · aposta da temporada</p>
      </div>
    </div>
  )
}
// 🏁 resultado da aposta da temporada PASSADA (bateu/não bateu) — banner no fim.
export function SponsorBetResultCard({ result, div }: { result: { tier: SponsorBetTier; brandId: string; hit: boolean; amount: number }; div: string }) {
  const meta = SPONSOR_BET_META[result.tier]
  const brand = sponsorBrandOf(result.brandId)
  const cap = SPONSOR_BET_PAY[div]?.[2] ?? 0
  const superou = result.hit && result.tier < 3 && result.amount < cap
  return (
    <div style={{ ...box('#fff'), padding: 14, marginBottom: 10, textAlign: 'center' }}>
      <span style={{ fontSize: 32 }}>{result.hit ? meta.emoji : '🚫'}</span>
      <p style={{ ...OSW, fontWeight: 900, fontSize: 15, margin: '4px 0 2px' }}>{result.hit ? 'Aposta certeira!' : 'Meta não batida'}</p>
      <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(0,0,0,.6)', lineHeight: 1.4, margin: 0 }}>
        Você apostou em <b>{meta.emoji} {meta.label}</b> com a <b>{brand?.name}</b> — {result.hit ? 'e bateu a meta! O patrocínio pagou.' : 'mas não bateu a meta. A aposta não vingou.'}
      </p>
      <span style={{ display: 'inline-block', marginTop: 8, ...OSW, fontWeight: 900, fontSize: 15, background: result.hit ? GREEN : '#B23A2A', color: '#fff', border: `2.5px solid ${INK}`, borderRadius: 10, padding: '6px 16px' }}>{result.hit ? '+' : ''}{result.amount} 🪙 no caixa</span>
      {superou && <p style={{ fontSize: 9.5, fontWeight: 700, color: '#8a6d00', margin: '7px 0 0' }}>Você foi além da meta — mas o prêmio é só o do nível apostado. 😉</p>}
    </div>
  )
}

// 🌱 barro (0%) → grama de elite (100%, um triz mais viva que o verde de sempre —
// pedido do Diego: "igual quase", só um pouco mais bonita quando completa).
const DIRT: [RGB, RGB] = [[138, 106, 69], [122, 78, 46]]
const GRASS: [RGB, RGB] = [[59, 191, 110], [23, 122, 62]]
type RGB = [number, number, number]
const lerpHex = (a: [RGB, RGB], b: [RGB, RGB], t: number, i: 0 | 1) => {
  const c = (x: number, y: number) => Math.round(x + (y - x) * t)
  return '#' + [c(a[i][0], b[i][0]), c(a[i][1], b[i][1]), c(a[i][2], b[i][2])].map(v => v.toString(16).padStart(2, '0')).join('')
}
// buracos de terra que vão fechando conforme o % do gramado sobe (cada um
// "cicatriza" na sua faixa de progresso — dá a sensação de obra acontecendo)
const GRASS_HOLES: { x: number; y: number; rx: number; ry: number; at: number }[] = [
  { x: .18, y: .18, rx: 13, ry: 8, at: 20 }, { x: .68, y: .30, rx: 16, ry: 10, at: 40 },
  { x: .30, y: .62, rx: 14, ry: 9, at: 60 }, { x: .74, y: .80, rx: 11, ry: 7, at: 80 },
  { x: .12, y: .50, rx: 9, ry: 6, at: 100 },
]
export function StadiumSvg({ st, perkOverride }: { st: StadiumSave | undefined; perkOverride?: ApoioPerk }) {
  const night = hasExtra(st, 'refl')
  const gramaPct = sectorPct(st, 'grama')
  const gt = gramaPct / 100
  // tier de apoio: as arquibancadas vestem a COR do time (setor pronto E em
  // construção), com varredura de brilho quando a categoria tem holo.
  // perkOverride força um tier (usado na PRÉVIA "veja o seu dourado").
  const perk = perkOverride ?? myApoioPerk()
  // sem tier: arquibancadas na cor BEGE de todo mundo (o ouro virou artigo do APOIE)
  const [f0, f1] = perk ? perk.svgFull : APOIO_PERKS.bege.svgFull
  const [v0, v1] = perk ? perk.svgPart : APOIO_PERKS.bege.svgPart
  const parts: string[] = []
  parts.push('<defs>')
  for (const k in STANDS) parts.push(`<clipPath id="stc${k}"><polygon points="${P(STANDS[k].pts)}"/></clipPath>`)
  parts.push(`<linearGradient id="stgr" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${lerpHex(DIRT, GRASS, gt, 0)}"/><stop offset="1" stop-color="${lerpHex(DIRT, GRASS, gt, 1)}"/></linearGradient>`)
  parts.push(`<linearGradient id="stau" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${f0}"/><stop offset="1" stop-color="${f1}"/></linearGradient>`)
  parts.push(`<linearGradient id="stvd" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${v0}"/><stop offset="1" stop-color="${v1}"/></linearGradient>`)
  parts.push('<pattern id="stcrowd" width="8" height="8" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.4" fill="#0C0C0C" opacity=".25"/><circle cx="6" cy="6" r="1.4" fill="#fff" opacity=".55"/></pattern>')
  parts.push('<radialGradient id="stbeam" cx="50%" cy="0%" r="100%"><stop offset="0" stop-color="#FFE9A3" stop-opacity=".5"/><stop offset="1" stop-color="#FFE9A3" stop-opacity="0"/></radialGradient>')
  if (perk && perk.holo > 0) {
    // faixa de luz que atravessa o estádio de leve, em loop (SMIL — sem CSS)
    parts.push(`<linearGradient id="stsh" gradientUnits="userSpaceOnUse" x1="-140" y1="0" x2="-40" y2="60">
      <stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity="${(perk.holo * 0.55).toFixed(2)}"/><stop offset="1" stop-color="#fff" stop-opacity="0"/>
      <animate attributeName="x1" values="-140;400" dur="3.6s" repeatCount="indefinite"/>
      <animate attributeName="x2" values="-40;500" dur="3.6s" repeatCount="indefinite"/>
    </linearGradient>`)
  }
  parts.push('</defs>')
  parts.push(`<rect width="360" height="312" rx="10" fill="${night ? '#2b3a4e' : '#dfeee3'}"/>`)
  parts.push('<ellipse cx="180" cy="298" rx="160" ry="10" fill="#000" opacity=".16"/>')
  // gramado
  const px = 105, py = 75, pw = 130, ph = 160, cx = px + pw / 2, cy = py + ph / 2
  parts.push(`<rect x="${px}" y="${py}" width="${pw}" height="${ph}" rx="5" fill="url(#stgr)" stroke="#123f22" stroke-width="2.5"/>`)
  for (let i = 0; i < pw; i += 13) if ((i / 13) % 2 === 0) parts.push(`<rect x="${px + i}" y="${py}" width="13" height="${ph}" fill="#fff" opacity="${(0.02 + 0.07 * gt).toFixed(2)}"/>`)
  // 🕳️ buracos de terra que vão fechando conforme o gramado melhora (0% = todos
  // abertos, terra pura; 100% = nenhum, igual o campo bonito de sempre)
  for (const h of GRASS_HOLES) {
    const windowStart = h.at - 20
    const scale = Math.max(0, Math.min(1, (h.at - gramaPct) / (h.at - windowStart)))
    if (scale <= 0) continue
    parts.push(`<ellipse cx="${(px + h.x * pw).toFixed(1)}" cy="${(py + h.y * ph).toFixed(1)}" rx="${(h.rx * scale).toFixed(1)}" ry="${(h.ry * scale).toFixed(1)}" fill="#5c4530" opacity="${(0.55 + 0.25 * scale).toFixed(2)}"/>`)
  }
  const W = 'rgba(255,255,255,.85)'
  parts.push(`<rect x="${px + 6}" y="${py + 6}" width="${pw - 12}" height="${ph - 12}" fill="none" stroke="${W}" stroke-width="1.6"/>`)
  parts.push(`<line x1="${px}" y1="${cy}" x2="${px + pw}" y2="${cy}" stroke="${W}" stroke-width="1.6"/>`)
  parts.push(`<circle cx="${cx}" cy="${cy}" r="19" fill="none" stroke="${W}" stroke-width="1.6"/><circle cx="${cx}" cy="${cy}" r="2.2" fill="${W}"/>`)
  parts.push(`<rect x="${px + 34}" y="${py + 6}" width="62" height="17" fill="none" stroke="${W}" stroke-width="1.6"/>`)
  parts.push(`<rect x="${px + 34}" y="${py + ph - 23}" width="62" height="17" fill="none" stroke="${W}" stroke-width="1.6"/>`)
  // arquibancadas (enchem de torcida conforme o investimento)
  for (const k in STANDS) {
    const s2 = STANDS[k], p = sectorPct(st, k), full = p >= 100
    parts.push(`<polygon points="${P(s2.pts)}" fill="${EMPTY}" opacity="${p > 0 ? 1 : .55}"/>`)
    if (p > 0) {
      const f = p / 100
      let r: string
      if (s2.axis === 'y') { const y0 = s2.from + (s2.to - s2.from) * f; r = `x="0" y="${Math.min(s2.from, y0)}" width="360" height="${Math.abs(s2.from - y0)}"` }
      else { const x0 = s2.from + (s2.to - s2.from) * f; r = `x="${Math.min(s2.from, x0)}" y="0" width="${Math.abs(s2.from - x0)}" height="312"` }
      parts.push(`<rect ${r} fill="${full ? 'url(#stau)' : 'url(#stvd)'}" clip-path="url(#stc${k})"/>`)
      parts.push(`<rect ${r} fill="url(#stcrowd)" clip-path="url(#stc${k})"/>`)
      if (perk && perk.holo > 0) parts.push(`<rect ${r} fill="url(#stsh)" clip-path="url(#stc${k})"/>`)
    }
    parts.push(`<polygon points="${P(s2.pts)}" fill="none" stroke="${INK}" stroke-width="2.6" stroke-linejoin="round"${p === 0 ? ' stroke-dasharray="5 4"' : ''}/>`)
    if (hasExtra(st, 'cober') && full) {
      const e = s2.pts
      parts.push(`<line x1="${e[0][0]}" y1="${e[0][1]}" x2="${e[1][0]}" y2="${e[1][1]}" stroke="#20242c" stroke-width="7" stroke-linecap="round"/>`)
    }
    const tc = full ? INK : (p > 0 ? '#fff' : '#8a8266')
    const tr = s2.rot ? ` transform="rotate(${s2.rot} ${s2.lx} ${s2.ly})"` : ''
    parts.push(`<text x="${s2.lx}" y="${s2.ly}"${tr} text-anchor="middle" font-family="Oswald,sans-serif" font-weight="900" fill="${tc}"><tspan x="${s2.lx}" font-size="12">${k.toUpperCase()}</tspan><tspan x="${s2.lx}" dy="13" font-size="11">${p}%</tspan></text>`)
  }
  // refletores (torres + fachos, céu anoitece)
  const TW: [number, number][] = [[70, 38], [290, 38], [70, 272], [290, 272]]
  for (const t of TW) {
    if (night) parts.push(`<polygon points="${t[0]},${t[1]} ${t[0] - 34},${t[1] < 150 ? t[1] + 90 : t[1] - 90} ${t[0] + 34},${t[1] < 150 ? t[1] + 80 : t[1] - 80}" fill="url(#stbeam)"/>`)
    parts.push(`<line x1="${t[0]}" y1="${t[1]}" x2="${t[0]}" y2="${t[1] + (t[1] < 150 ? -16 : 16)}" stroke="${INK}" stroke-width="3"/>`)
    parts.push(`<rect x="${t[0] - 9}" y="${t[1] + (t[1] < 150 ? -26 : 8)}" width="18" height="10" rx="3" fill="${night ? GOLD : '#9a9483'}" stroke="${INK}" stroke-width="2.5"/>`)
  }
  if (hasExtra(st, 'telao')) {
    parts.push(`<rect x="306" y="14" width="44" height="30" rx="4" fill="#0C0C0C" stroke="${INK}" stroke-width="3"/>`)
    parts.push('<text x="328" y="30" text-anchor="middle" font-family="Oswald,sans-serif" font-weight="900" font-size="11" fill="#37D067">1×0</text>')
    parts.push(`<text x="328" y="41" text-anchor="middle" font-family="Oswald,sans-serif" font-weight="900" font-size="7" fill="${GOLD}">GOL!</text>`)
    parts.push(`<line x1="328" y1="44" x2="328" y2="54" stroke="${INK}" stroke-width="3"/>`)
  }
  if (hasExtra(st, 'loja')) {
    parts.push(`<rect x="12" y="262" width="46" height="32" rx="4" fill="#fff" stroke="${INK}" stroke-width="3"/>`)
    for (let a = 0; a < 4; a++) parts.push(`<rect x="${12 + a * 11.5}" y="258" width="11.5" height="9" fill="${a % 2 ? GOLD : GREEN}" stroke="${INK}" stroke-width="2"/>`)
    parts.push(`<text x="35" y="283" text-anchor="middle" font-family="Oswald,sans-serif" font-weight="900" font-size="9" fill="${INK}">LOJA</text>`)
  }
  if (hasExtra(st, 'estac')) {
    parts.push(`<rect x="304" y="258" width="48" height="38" rx="4" fill="#8f8b7d" stroke="${INK}" stroke-width="3"/>`)
    for (const c of [[310, 264, '#E8503A'], [328, 264, '#2563EB'], [310, 280, '#F4ECD6']] as [number, number, string][]) {
      parts.push(`<rect x="${c[0]}" y="${c[1]}" width="14" height="9" rx="2.5" fill="${c[2]}" stroke="${INK}" stroke-width="1.8"/>`)
    }
  }
  return <svg viewBox="0 0 360 312" style={{ width: '100%', height: 'auto', display: 'block' }} dangerouslySetInnerHTML={{ __html: parts.join('') }} />
}

// 🏢 SAF: lançada pra TODOS (era gate de teste fechado — validado com os
// primeiros donos). loggedEmail() segue sendo checado só pra exigir login.
const LOAN_POS: Record<string, string> = { GOL: 'GOL', LAT: 'LAT', ZAG: 'ZAG', MEI: 'MEI', ATA: 'ATA' }
export function StadiumTab({ st, coins, onInvest, onBuild, medicoOn, filial, filialOptions, filialInfo, onBuyFilial, onSellFilial, filialSale, mySquad, filialSquad, loanableOutIds, loanableInIds, onLoanTo, onLoanFrom, onReturnLoan, loanSlots = 1, trimNotice, onDismissTrimNotice }: {
  st: StadiumSave | undefined
  coins: number
  onInvest: (sector: string) => void
  onBuild: (ext: string) => void
  // 🏥 Departamento Médico SÓ nas carreiras com eventos de jogador (agenciaOn).
  // Carreira antiga nem VÊ a obra — e a SAF dela segue custando o de sempre
  // (regra nova nunca muda o meio da carreira de ninguém).
  medicoOn?: boolean
  filial?: { team: string; since: number; earned?: number; loanOut?: { id: string; name: string; pos: string }[]; loanIn?: { id: string; name: string; pos: string }[] } | null
  filialOptions?: string[]
  filialInfo?: { div: string; pos: number } | null
  onBuyFilial?: (team: string) => void
  onSellFilial?: () => void
  filialSale?: { value: number; div: string; titles: number; divBonus: number; titleBonus: number; paid: number }
  mySquad?: { id: string; name: string; pos: string; emprestado?: string }[]
  filialSquad?: { id: string; name: string; pos: string; emprestado?: string }[]
  loanableOutIds?: Set<string>
  loanableInIds?: Set<string>
  onLoanTo?: (cardId: string) => void
  onLoanFrom?: (cardId: string) => void
  onReturnLoan?: (cardId: string) => void // 🏢 traz UM empréstimo de volta na hora
  loanSlots?: number // 🏢 vagas de empréstimo por lado (cresce com a divisão)
  trimNotice?: number | null // 🏢 quantos voltaram sozinhos na última virada por rebaixamento
  onDismissTrimNotice?: () => void
}) {
  const [buying, setBuying] = useState(false)
  const [pickOut, setPickOut] = useState(false)
  const [pickIn, setPickIn] = useState(false)
  const [sellingSaf, setSellingSaf] = useState(false)
  const lvl = stadiumLevel(st)
  const seats = stadiumSeats(st)
  const income = stadiumIncome(st)
  // acentos da aba (badge de nível, bilheteria, barras) na cor do tier de apoio
  const perk = myApoioPerk()
  const ACC = perk?.solid ?? GREEN
  const ACCB = perk ? INK : '#14351f'
  // 🏥 lista de melhorias da CARREIRA: sem agenciaOn o médico não existe (nem no
  // % pronto, nem na exigência da SAF — senão save antigo travava em 91%).
  const extras = medicoOn ? STADIUM_EXTRAS : STADIUM_EXTRAS.filter(e => e.k !== 'medico')
  const totalPieces = STADIUM_SECTORS.length + extras.length
  const prontoPct = Math.round((STADIUM_SECTORS.reduce((a, s) => a + sectorPct(st, s.k) / 100, 0) + extras.filter(e => hasExtra(st, e.k)).length) / totalPieces * 100)
  return (
    <>
      <div style={{ ...box('#FBF6E9'), padding: 12, marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontWeight: 900, fontSize: 15, textTransform: 'uppercase', ...OSW }}>{lvl.name}</span>
          <span style={{ background: ACC, color: '#fff', border: `2px solid ${ACCB}`, borderRadius: 999, padding: '2px 10px', fontSize: 10.5, fontWeight: 900, textTransform: 'uppercase', ...OSW }}>nível {lvl.n}</span>
        </div>
        <StadiumSvg st={st} />
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 8 }}>
          <div><b style={{ fontSize: 23, fontWeight: 900 }}>{seats.now.toLocaleString('pt-BR')}</b> <span style={{ fontSize: 11.5, color: 'rgba(0,0,0,.55)', fontWeight: 800 }}>/ {seats.max.toLocaleString('pt-BR')} lugares</span></div>
          <span style={{ background: GOLD, border: `2.5px solid ${INK}`, borderRadius: 999, padding: '4px 11px', fontSize: 12, fontWeight: 900, ...OSW }}>{prontoPct}% pronto</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, background: ACC, color: '#fff', border: `2px solid ${ACCB}`, borderRadius: 10, padding: '7px 11px' }}>
          <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: .8, textTransform: 'uppercase', opacity: .92, ...OSW }}>🎟️ Bilheteria por temporada</span>
          <b style={{ fontSize: 17 }}>+{income}</b>
        </div>
        <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(0,0,0,.5)', margin: '7px 2px 0', lineHeight: 1.35 }}>
          <b>Base do estádio +{STADIUM_BASE}</b>{stadiumBuiltIncome(st) > 0 ? <> · construído +{stadiumBuiltIncome(st)}</> : ''} = <b>+{income}/temporada</b>. Todo clube já vende ingresso — construir <b>soma em cima da base</b>. Cai sozinha no caixa ao fim de cada temporada; melhoria pronta rende pra sempre.</p>
      </div>

      <p style={{ fontWeight: 900, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, color: 'rgba(0,0,0,.5)', margin: '0 2px 8px', ...OSW }}>🧱 Arquibancadas — investe aos poucos</p>
      {STADIUM_SECTORS.map(s => {
        const p = sectorPct(st, s.k), full = p >= 100, poor = coins < STADIUM_STEP
        return (
          <div key={s.k} style={{ ...box('#FBF6E9'), borderRadius: 14, padding: '10px 11px', marginBottom: 9, display: 'flex', alignItems: 'center', gap: 11 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 7 }}>
                <span style={{ fontWeight: 900, fontSize: 14.5, ...OSW }}>{s.n}</span>
                <span style={{ fontSize: 11.5, fontWeight: 900, color: '#14512b' }}>{p}%</span>
              </div>
              <div style={{ height: 9, background: '#e6dcc2', border: `1.5px solid ${INK}`, borderRadius: 6, overflow: 'hidden', margin: '5px 0 4px' }}>
                <div style={{ height: '100%', width: `${p}%`, background: full ? GOLD : ACC, transition: 'width .35s ease' }} />
              </div>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: 'rgba(0,0,0,.5)' }}>custo total {s.cost} 💰 · rende <b style={{ color: ACC }}>+{s.inc}/temp</b>{s.seats > 0 ? <> · {s.seats.toLocaleString('pt-BR')} lugares</> : null}</div>
            </div>
            <button onClick={() => !full && !poor && onInvest(s.k)} disabled={full || poor}
              style={{ flex: 'none', minWidth: 88, border: 'none', borderRadius: 10, padding: '9px 11px', fontWeight: 900, fontSize: 12.5, cursor: full || poor ? 'default' : 'pointer', lineHeight: 1.15, ...OSW, background: full ? GOLD : poor ? '#d9cfb4' : INK, color: full ? INK : poor ? '#7d7358' : '#fff' }}>
              {full ? '✅ pronto' : <>Investir<span style={{ display: 'block', fontSize: 9, opacity: .85 }}>+{STADIUM_STEP} 💰</span></>}
            </button>
          </div>
        )
      })}

      <p style={{ fontWeight: 900, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, color: 'rgba(0,0,0,.5)', margin: '14px 2px 8px', ...OSW }}>✨ Melhorias — pagam e destravam 🔓</p>
      {extras.map(e => {
        const done = hasExtra(st, e.k), unlocked = extraUnlocked(st, e.k), poor = coins < e.cost
        return (
          <div key={e.k} style={{ ...box('#FBF6E9'), borderRadius: 14, padding: '10px 11px', marginBottom: 9, display: 'flex', alignItems: 'center', gap: 11, opacity: done || unlocked ? 1 : .55, borderStyle: done || unlocked ? 'solid' : 'dashed', boxShadow: done || unlocked ? `4px 4px 0 0 ${INK}` : 'none' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 900, fontSize: 14.5, ...OSW }}>{e.n}</div>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: 'rgba(0,0,0,.5)', marginTop: 2 }}>
                {/* 🏥 melhoria SEM renda (perk): mostra o benefício, nunca "+0/temp" */}
                {done ? <b style={{ color: ACC }}>{e.perk ?? `rendendo +${e.inc}/temp`}</b>
                  : unlocked ? <>custa {e.cost} 💰 · <b style={{ color: ACC }}>{e.perk ?? `rende +${e.inc}/temp`}</b></>
                  : <>🔒 destrava com: <b style={{ color: '#9a4b00' }}>{e.reqTxt}</b>{e.perk ? <> · {e.perk}</> : null}</>}
              </div>
            </div>
            <button onClick={() => !done && unlocked && !poor && onBuild(e.k)} disabled={done || !unlocked || poor}
              style={{ flex: 'none', minWidth: 88, border: 'none', borderRadius: 10, padding: '9px 11px', fontWeight: 900, fontSize: 12.5, cursor: !done && unlocked && !poor ? 'pointer' : 'default', lineHeight: 1.15, ...OSW, background: done ? GOLD : (!unlocked || poor) ? '#d9cfb4' : INK, color: done ? INK : (!unlocked || poor) ? '#7d7358' : '#fff' }}>
              {done ? '✅ feito' : !unlocked ? '🔒' : <>Construir<span style={{ display: 'block', fontSize: 9, opacity: .85 }}>−{e.cost} 💰</span></>}
            </button>
          </div>
        )
      })}
      {onBuyFilial && (() => {
        // 🔐 a SAF EXIGE login (direitos ligados à conta). Antes, sem login a seção
        // SUMIA — e o jogador não entendia (ele só via a SAF "desaparecer"). Agora
        // ela SEMPRE aparece: sem login, fica apagada com "faça login" (a sessão
        // pode ter expirado mesmo pra quem já jogou online). Só some se não for solo.
        const logged = !!loggedEmail()
        const allDone = STADIUM_SECTORS.every(x => sectorPct(st, x.k) >= 100) && extras.every(e => hasExtra(st, e.k))
        const canBuy = logged && allDone && coins >= 2000
        const regras = (
          <ul style={{ margin: '7px 0 0', paddingLeft: 16, fontSize: 10.5, fontWeight: 700, color: 'rgba(0,0,0,.7)', lineHeight: 1.55 }}>
            <li>💰 A SAF custa <b>2.000</b> · compra única · os direitos são seus <b>pra sempre nesta carreira</b> (não vende, não troca)</li>
            <li>🏆 Direito a <b>50% dos lucros de campanha</b> (título e acesso) — caem no seu caixa na virada da temporada</li>
            <li>📉 <b>Queda dói</b>: 50% da multa de rebaixamento sai do SEU caixa</li>
            <li>🙅 <b>Nada</b> dos lucros de compra/venda do clube no mercado — só campanha</li>
            <li>⚖️ O clube da SAF <b>nunca disputa seu leilão</b>: vida própria, sobe e desce por mérito</li>
            <li>📈 Ela sobe de série? Sua comissão cresce junto (prêmio de série alta paga mais)</li>
            <li>🔄 <b>Empréstimos crescem com a divisão</b> (emprestar E pegar): Série D <b>1</b> · C <b>2</b> · B <b>3</b> · A <b>4</b> por lado. <b>Ficam valendo</b> de uma temporada pra outra — traga de volta quando quiser. Só volta sozinho o <b>excedente</b> se você cair de divisão</li>
            <li>👥 Pegando emprestado, seu elenco passa de 22 — <b>até 26 na Série A</b></li>
          </ul>
        )
        if (filial) {
          return (
          <div style={{ ...box('#FFF6DE'), borderRadius: 14, padding: '11px 12px', marginTop: 14 }}>
            <p style={{ fontWeight: 900, fontSize: 14.5, margin: 0, ...OSW }}>💼 SUA SAF</p>
            <p style={{ fontWeight: 900, fontSize: 13, margin: '5px 0 2px', ...OSW }}>⚽ {filial.team}{filialInfo ? <span style={{ fontWeight: 700, fontSize: 10.5, color: 'rgba(0,0,0,.55)' }}> · Série {filialInfo.div} · {filialInfo.pos}º</span> : null}</p>
            <p style={{ fontSize: 10.5, fontWeight: 700, color: 'rgba(0,0,0,.55)', margin: 0 }}>Dono da SAF desde a T{filial.since} · direito a 50% dos lucros de campanha (título/acesso rende; queda desconta)</p>
            <p style={{ fontSize: 11.5, fontWeight: 900, color: (filial.earned ?? 0) >= 0 ? GREEN : '#B23B2E', margin: '4px 0 0', ...OSW }}>💼 Comissões acumuladas: {(filial.earned ?? 0) >= 0 ? '+' : ''}{filial.earned ?? 0} 🪙</p>

            {/* 🔄 JANELA DE EMPRÉSTIMO — propriedade nunca muda; agora o empréstimo PERSISTE */}
            <div style={{ marginTop: 10, borderTop: '2px dashed rgba(0,0,0,.15)', paddingTop: 9 }}>
              <p style={{ fontWeight: 900, fontSize: 12, margin: '0 0 2px', ...OSW }}>🔄 Janela de empréstimo</p>
              <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(0,0,0,.5)', margin: '0 0 7px' }}>Até <b>{loanSlots}</b> {loanSlots === 1 ? 'jogador' : 'jogadores'} por lado nesta divisão · cresce ao acessar (D 1 · C 2 · B 3 · A 4) · <b>fica valendo até você trazer de volta</b> (não some sozinho na virada)</p>

              {/* 🏢 aviso: rebaixou e perdeu vaga → alguns voltaram sozinhos */}
              {(trimNotice ?? 0) > 0 && (
                <div style={{ background: '#FDE9C8', border: `2px solid ${INK}`, borderRadius: 9, padding: '7px 9px', marginBottom: 7, fontSize: 10.5, fontWeight: 800, lineHeight: 1.4, position: 'relative' }}>
                  ⚠️ Você caiu de divisão e a SAF perdeu vaga: <b>{trimNotice}</b> {trimNotice === 1 ? 'empréstimo voltou' : 'empréstimos voltaram'} sozinho pro lugar. O resto continua valendo.
                  {onDismissTrimNotice && (
                    <button onClick={onDismissTrimNotice} aria-label="Ok" style={{ position: 'absolute', top: 2, right: 5, background: 'transparent', border: 'none', fontSize: 15, fontWeight: 900, lineHeight: 1, cursor: 'pointer', padding: '2px 4px' }}>×</button>
                  )}
                </div>
              )}

              {/* empresta PRA SAF (várias vagas conforme a divisão) */}
              {(filial.loanOut ?? []).map(lo => (
                <div key={lo.id} style={{ background: '#fff', border: `2px solid ${INK}`, borderRadius: 9, padding: '6px 9px', marginBottom: 6, fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 7 }}>
                  <span style={{ flex: 1, minWidth: 0 }}>📤 <b>{lo.name}</b> ({lo.pos}) jogando na SAF</span>
                  {onReturnLoan && (
                    <button onClick={() => onReturnLoan(lo.id)} style={{ flex: 'none', border: `1.5px solid ${INK}`, borderRadius: 7, padding: '4px 8px', fontWeight: 900, fontSize: 10, ...OSW, background: GOLD, color: INK, cursor: 'pointer' }}>↩️ trazer de volta</button>
                  )}
                </div>
              ))}
              {(filial.loanOut ?? []).length < loanSlots && onLoanTo && (mySquad?.length ?? 0) > 0 ? (
                <div style={{ marginBottom: 6 }}>
                  <button onClick={() => setPickOut(o => !o)} style={{ border: `2px solid ${INK}`, borderRadius: 9, padding: '7px 10px', fontWeight: 900, fontSize: 11, ...OSW, background: '#fff', width: '100%', textAlign: 'left', cursor: 'pointer' }}>
                    📤 {pickOut ? '▾' : '▸'} Emprestar um jogador pra SAF <span style={{ opacity: .55 }}>({(filial.loanOut ?? []).length}/{loanSlots})</span>
                  </button>
                  {pickOut && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 5, maxHeight: 160, overflowY: 'auto' }}>
                      {/* ninguém elegível: explica o PORQUÊ (antes abria vazio e parecia bug) */}
                      {(mySquad ?? []).filter(c => loanableOutIds?.has(c.id)).length === 0 && (
                        <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(0,0,0,.5)', margin: 0, padding: '4px 2px', lineHeight: 1.35 }}>🔒 Ninguém disponível agora: emprestar não pode deixar seu <b>time titular incompleto</b> em nenhuma posição. Contrate reservas (ou traga alguém de volta) e tente de novo.</p>
                      )}
                      {(mySquad ?? []).filter(c => loanableOutIds?.has(c.id)).map(c => (
                        <button key={c.id} onClick={() => { onLoanTo(c.id); setPickOut(false) }}
                          style={{ display: 'flex', justifyContent: 'space-between', border: '1.5px solid rgba(0,0,0,.25)', borderRadius: 7, padding: '5px 8px', fontSize: 10.5, fontWeight: 700, background: '#fff', cursor: 'pointer' }}>
                          <span>{c.name}</span><span style={{ opacity: .5 }}>{LOAN_POS[c.pos] ?? c.pos}</span>
                        </button>
                      ))}
                      {(mySquad ?? []).filter(c => loanableOutIds?.has(c.id)).length === 0 && (
                        <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(0,0,0,.45)', margin: '2px 0' }}>Nenhum jogador sobra sem abrir buraco no seu titular agora.</p>
                      )}
                    </div>
                  )}
                </div>
              ) : null}

              {/* pega emprestado DA SAF (várias vagas conforme a divisão) */}
              {(filial.loanIn ?? []).map(li => (
                <div key={li.id} style={{ background: '#fff', border: `2px solid ${INK}`, borderRadius: 9, padding: '6px 9px', marginBottom: 6, fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 7 }}>
                  <span style={{ flex: 1, minWidth: 0 }}>📥 <b>{li.name}</b> ({li.pos}) jogando com você</span>
                  {onReturnLoan && (
                    <button onClick={() => onReturnLoan(li.id)} style={{ flex: 'none', border: `1.5px solid ${INK}`, borderRadius: 7, padding: '4px 8px', fontWeight: 900, fontSize: 10, ...OSW, background: GOLD, color: INK, cursor: 'pointer' }}>↩️ devolver pra SAF</button>
                  )}
                </div>
              ))}
              {(filial.loanIn ?? []).length < loanSlots && onLoanFrom && (filialSquad?.length ?? 0) > 0 ? (
                <div>
                  <button onClick={() => setPickIn(o => !o)} style={{ border: `2px solid ${INK}`, borderRadius: 9, padding: '7px 10px', fontWeight: 900, fontSize: 11, ...OSW, background: '#fff', width: '100%', textAlign: 'left', cursor: 'pointer' }}>
                    📥 {pickIn ? '▾' : '▸'} Pegar um jogador da SAF <span style={{ opacity: .55 }}>({(filial.loanIn ?? []).length}/{loanSlots})</span>
                  </button>
                  {pickIn && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 5, maxHeight: 160, overflowY: 'auto' }}>
                      {/* ninguém elegível: a SAF também não pode ficar com o XI dela furado */}
                      {(filialSquad ?? []).filter(c => loanableInIds?.has(c.id)).length === 0 && (
                        <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(0,0,0,.5)', margin: 0, padding: '4px 2px', lineHeight: 1.35 }}>🔒 Ninguém disponível agora: a SAF precisa manter o <b>time titular dela completo</b>. Dica: empreste um jogador SEU pra ela primeiro — aí abre folga na posição pra puxar alguém de lá.</p>
                      )}
                      {(filialSquad ?? []).filter(c => loanableInIds?.has(c.id)).map(c => (
                        <button key={c.id} onClick={() => { onLoanFrom(c.id); setPickIn(false) }}
                          style={{ display: 'flex', justifyContent: 'space-between', border: '1.5px solid rgba(0,0,0,.25)', borderRadius: 7, padding: '5px 8px', fontSize: 10.5, fontWeight: 700, background: '#fff', cursor: 'pointer' }}>
                          <span>{c.name}</span><span style={{ opacity: .5 }}>{LOAN_POS[c.pos] ?? c.pos}</span>
                        </button>
                      ))}
                      {(filialSquad ?? []).filter(c => loanableInIds?.has(c.id)).length === 0 && (
                        <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(0,0,0,.45)', margin: '2px 0' }}>A SAF não tem ninguém sobrando pra emprestar agora.</p>
                      )}
                    </div>
                  )}
                </div>
              ) : null}
            </div>
            {regras}

            {/* 💸 VENDER A SAF — valor progressivo (divisão + títulos), com o porquê */}
            {onSellFilial && filialSale && (
              <div style={{ marginTop: 11, borderTop: '2px dashed rgba(0,0,0,.15)', paddingTop: 10 }}>
                {!sellingSaf ? (
                  <button onClick={() => setSellingSaf(true)}
                    style={{ width: '100%', border: `2px solid ${INK}`, borderRadius: 10, padding: '9px 0', fontWeight: 900, fontSize: 12.5, ...OSW, background: '#fff', color: INK, cursor: 'pointer' }}>
                    💸 Vender a SAF · vale <b style={{ color: GREEN }}>{filialSale.value}</b> 🪙 agora
                  </button>
                ) : (
                  <div style={{ background: '#fff', border: `2.5px solid ${INK}`, borderRadius: 12, boxShadow: `2px 2px 0 0 ${INK}`, padding: '11px 12px' }}>
                    <p style={{ ...OSW, fontWeight: 900, fontSize: 14, margin: '0 0 2px' }}>💼 Vender a SAF · {filial.team}</p>
                    <p style={{ ...OSW, fontWeight: 900, fontSize: 20, color: GREEN, margin: '2px 0 8px' }}>💰 Você recebe agora: {filialSale.value} 🪙</p>
                    <p style={{ fontSize: 9.5, fontWeight: 900, letterSpacing: .6, textTransform: 'uppercase', color: 'rgba(0,0,0,.45)', margin: '0 0 4px' }}>Como calculamos</p>
                    <div style={{ fontSize: 11.5, fontWeight: 700, color: '#5a5647', lineHeight: 1.7 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>• Base</span><span>+1.000</span></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>• Série {filialSale.div} (divisão atual)</span><span>+{filialSale.divBonus}</span></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>• {filialSale.titles} {filialSale.titles === 1 ? 'título' : 'títulos'} da SAF (+250 cada)</span><span>+{filialSale.titleBonus}</span></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(0,0,0,.15)', marginTop: 3, paddingTop: 3, fontWeight: 900, color: INK }}><span>Total</span><span>{filialSale.value} 🪙{filialSale.value >= 2500 ? ' (teto)' : ''}</span></div>
                    </div>
                    <p style={{ fontSize: 11, fontWeight: 800, margin: '7px 0 0', color: filialSale.value - filialSale.paid >= 0 ? GREEN : '#B23B2E' }}>
                      Você pagou {filialSale.paid} → {filialSale.value - filialSale.paid >= 0 ? `lucro de +${filialSale.value - filialSale.paid} 📈` : `prejuízo de −${filialSale.paid - filialSale.value} 📉`}
                    </p>
                    <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(0,0,0,.5)', margin: '6px 0 9px' }}>⚠️ Empréstimos ativos voltam na hora. Depois de vender, dá pra comprar outra SAF.</p>
                    <div style={{ display: 'flex', gap: 7 }}>
                      <button onClick={() => setSellingSaf(false)} style={{ flex: 1, border: `2px solid ${INK}`, borderRadius: 10, padding: '9px 0', fontWeight: 900, fontSize: 12, ...OSW, background: '#fff', color: INK, cursor: 'pointer' }}>Cancelar</button>
                      <button onClick={() => { if (window.confirm(`Vender a SAF do ${filial.team} por ${filialSale.value} 🪙?`)) { onSellFilial(); setSellingSaf(false) } }} style={{ flex: 1.4, border: `2px solid ${INK}`, borderRadius: 10, padding: '9px 0', fontWeight: 900, fontSize: 12.5, ...OSW, background: GREEN, color: '#fff', boxShadow: `2px 2px 0 0 ${INK}`, cursor: 'pointer' }}>Vender · +{filialSale.value} 🪙</button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          )
        }
        return (
          <div style={{ ...box('#FBF6E9'), borderRadius: 14, padding: '11px 12px', marginTop: 14, opacity: (allDone && logged) ? 1 : .6, borderStyle: (allDone && logged) ? 'solid' : 'dashed', boxShadow: (allDone && logged) ? `4px 4px 0 0 ${INK}` : 'none' }}>
            <p style={{ fontWeight: 900, fontSize: 14.5, margin: 0, ...OSW }}>💼 COMPRAR UMA SAF</p>
            <p style={{ fontSize: 10.5, fontWeight: 700, color: 'rgba(0,0,0,.55)', margin: '3px 0 6px' }}>
              {!logged
                ? <>🔒 <b style={{ color: '#9a4b00' }}>Faça login</b> (ou entre de novo — sua sessão pode ter caído) pra comprar a SAF. Seu progresso da carreira fica salvo na conta.</>
                : allDone
                ? <>Compre a <b>SAF de um clube da Série D</b> e vire dono: você adquire o direito a <b>50% dos lucros de campanha</b> dele (e assume metade do prejuízo na queda). O clube segue jogando por conta própria — sem leilão contra você. E você <b>empresta e pega jogadores</b> dele: <b>+vagas conforme você sobe de série</b> (D 1 · C 2 · B 3 · A 4).</>
                : <>🔒 destrava com: <b style={{ color: '#9a4b00' }}>Estádio 100% completo</b> (setores + melhorias) · a SAF custa 2.000 💰</>}
            </p>
            {logged && allDone && regras}
            {logged && allDone && <div style={{ height: 7 }} />}
            {logged && allDone && !buying && (
              <button onClick={() => canBuy && setBuying(true)} disabled={!canBuy}
                style={{ width: '100%', border: 'none', borderRadius: 10, padding: '10px 0', fontWeight: 900, fontSize: 13.5, ...OSW, background: canBuy ? INK : '#d9cfb4', color: canBuy ? '#fff' : '#7d7358', cursor: canBuy ? 'pointer' : 'default' }}>
                {canBuy ? '💼 Comprar a SAF de um clube · −2.000 💰' : `Junte 2.000 💰 (tem ${coins})`}
              </button>
            )}
            {logged && allDone && buying && (
              <div>
                <p style={{ fontSize: 11, fontWeight: 900, margin: '2px 0 6px', ...OSW }}>Escolha o clube (Série D atual):</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                  {(filialOptions ?? []).map(t => (
                    <button key={t} onClick={() => { if (window.confirm(`Comprar a SAF do ${t} por 2.000 💰? Você vira dono dos direitos dele pra sempre nesta carreira.`)) { onBuyFilial(t); setBuying(false) } }}
                      style={{ border: `2px solid ${INK}`, borderRadius: 9, padding: '8px 4px', fontWeight: 900, fontSize: 11, ...OSW, background: '#fff', cursor: 'pointer', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t}</button>
                  ))}
                </div>
                <button onClick={() => setBuying(false)} style={{ width: '100%', marginTop: 7, background: 'transparent', border: 'none', fontWeight: 800, fontSize: 11, color: 'rgba(0,0,0,.5)', textDecoration: 'underline', cursor: 'pointer' }}>cancelar</button>
              </div>
            )}
          </div>
        )
      })()}
      <p style={{ textAlign: 'center', fontSize: 10.5, fontWeight: 700, color: 'rgba(0,0,0,.45)', margin: '10px 2px 4px' }}>🏟️ O desenho lá em cima é o teu progresso — cada compra aparece nele.</p>
    </>
  )
}

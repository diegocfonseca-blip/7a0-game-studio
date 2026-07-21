import { useState } from 'react'
// ─── 🏟️ ESTÁDIO — aba da carreira (o estádio que CRESCE na tela) ─────────
// Cada compra APARECE no desenho: torcida enchendo os setores, refletores
// acendendo (anoitece!), telão ligando, loja, estacionamento, cobertura.
// Melhorias destravam em árvore. Renda cai sozinha no fim de cada temporada.
import { STADIUM_SECTORS, STADIUM_EXTRAS, STADIUM_STEP, sectorPct, hasExtra, extraUnlocked, stadiumIncome, stadiumSeats, stadiumLevel } from './estadiodata'
import type { StadiumSave } from './estadiodata'
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

export function StadiumSvg({ st, perkOverride }: { st: StadiumSave | undefined; perkOverride?: ApoioPerk }) {
  const night = hasExtra(st, 'refl')
  const grama = hasExtra(st, 'grama')
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
  parts.push(`<linearGradient id="stgr" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${grama ? '#3bbf6e' : '#37a862'}"/><stop offset="1" stop-color="${grama ? '#177a3e' : '#1e7a44'}"/></linearGradient>`)
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
  for (let i = 0; i < pw; i += 13) if ((i / 13) % 2 === 0) parts.push(`<rect x="${px + i}" y="${py}" width="13" height="${ph}" fill="#fff" opacity="${grama ? '.09' : '.05'}"/>`)
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

// 🏢 GRUPO EMPRESARIAL — EM TESTE: só estas contas veem (depois abre pra todos)
const FILIAL_TESTERS = ['diego.c.fonseca@gmail.com', 'lnantes49@gmail.com', 'ln6739633@gmail.com']
const LOAN_POS: Record<string, string> = { GOL: 'GOL', LAT: 'LAT', ZAG: 'ZAG', MEI: 'MEI', ATA: 'ATA' }
export function StadiumTab({ st, coins, onInvest, onBuild, filial, filialOptions, filialInfo, onBuyFilial, mySquad, filialSquad, loanableOutIds, loanableInIds, onLoanTo, onLoanFrom }: {
  st: StadiumSave | undefined
  coins: number
  onInvest: (sector: string) => void
  onBuild: (ext: string) => void
  filial?: { team: string; since: number; earned?: number; loanOut?: { id: string; name: string; pos: string }; loanIn?: { id: string; name: string; pos: string } } | null
  filialOptions?: string[]
  filialInfo?: { div: string; pos: number } | null
  onBuyFilial?: (team: string) => void
  mySquad?: { id: string; name: string; pos: string; emprestado?: string }[]
  filialSquad?: { id: string; name: string; pos: string; emprestado?: string }[]
  loanableOutIds?: Set<string>
  loanableInIds?: Set<string>
  onLoanTo?: (cardId: string) => void
  onLoanFrom?: (cardId: string) => void
}) {
  const [buying, setBuying] = useState(false)
  const [pickOut, setPickOut] = useState(false)
  const [pickIn, setPickIn] = useState(false)
  const lvl = stadiumLevel(st)
  const seats = stadiumSeats(st)
  const income = stadiumIncome(st)
  // acentos da aba (badge de nível, bilheteria, barras) na cor do tier de apoio
  const perk = myApoioPerk()
  const ACC = perk?.solid ?? GREEN
  const ACCB = perk ? INK : '#14351f'
  const totalPieces = STADIUM_SECTORS.length + STADIUM_EXTRAS.length
  const prontoPct = Math.round((STADIUM_SECTORS.reduce((a, s) => a + sectorPct(st, s.k) / 100, 0) + STADIUM_EXTRAS.filter(e => hasExtra(st, e.k)).length) / totalPieces * 100)
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
          <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: .8, textTransform: 'uppercase', opacity: .92, ...OSW }}>💰 Bilheteria por temporada</span>
          <b style={{ fontSize: 17 }}>+{income}</b>
        </div>
        <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(0,0,0,.5)', margin: '7px 2px 0', lineHeight: 1.35 }}>A renda cai sozinha no seu caixa ao fim de cada temporada. Setor rende proporcional ao construído; melhoria pronta rende pra sempre.</p>
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
              <div style={{ fontSize: 10.5, fontWeight: 700, color: 'rgba(0,0,0,.5)' }}>custo total {s.cost} 💰 · rende <b style={{ color: ACC }}>+{s.inc}/temp</b> · {s.seats.toLocaleString('pt-BR')} lugares</div>
            </div>
            <button onClick={() => !full && !poor && onInvest(s.k)} disabled={full || poor}
              style={{ flex: 'none', minWidth: 88, border: 'none', borderRadius: 10, padding: '9px 11px', fontWeight: 900, fontSize: 12.5, cursor: full || poor ? 'default' : 'pointer', lineHeight: 1.15, ...OSW, background: full ? GOLD : poor ? '#d9cfb4' : INK, color: full ? INK : poor ? '#7d7358' : '#fff' }}>
              {full ? '✅ pronto' : <>Investir<span style={{ display: 'block', fontSize: 9, opacity: .85 }}>+{STADIUM_STEP} 💰</span></>}
            </button>
          </div>
        )
      })}

      <p style={{ fontWeight: 900, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, color: 'rgba(0,0,0,.5)', margin: '14px 2px 8px', ...OSW }}>✨ Melhorias — pagam e destravam 🔓</p>
      {STADIUM_EXTRAS.map(e => {
        const done = hasExtra(st, e.k), unlocked = extraUnlocked(st, e.k), poor = coins < e.cost
        return (
          <div key={e.k} style={{ ...box('#FBF6E9'), borderRadius: 14, padding: '10px 11px', marginBottom: 9, display: 'flex', alignItems: 'center', gap: 11, opacity: done || unlocked ? 1 : .55, borderStyle: done || unlocked ? 'solid' : 'dashed', boxShadow: done || unlocked ? `4px 4px 0 0 ${INK}` : 'none' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 900, fontSize: 14.5, ...OSW }}>{e.n}</div>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: 'rgba(0,0,0,.5)', marginTop: 2 }}>
                {done ? <b style={{ color: ACC }}>rendendo +{e.inc}/temp</b>
                  : unlocked ? <>custa {e.cost} 💰 · rende <b style={{ color: ACC }}>+{e.inc}/temp</b></>
                  : <>🔒 destrava com: <b style={{ color: '#9a4b00' }}>{e.reqTxt}</b></>}
              </div>
            </div>
            <button onClick={() => !done && unlocked && !poor && onBuild(e.k)} disabled={done || !unlocked || poor}
              style={{ flex: 'none', minWidth: 88, border: 'none', borderRadius: 10, padding: '9px 11px', fontWeight: 900, fontSize: 12.5, cursor: !done && unlocked && !poor ? 'pointer' : 'default', lineHeight: 1.15, ...OSW, background: done ? GOLD : (!unlocked || poor) ? '#d9cfb4' : INK, color: done ? INK : (!unlocked || poor) ? '#7d7358' : '#fff' }}>
              {done ? '✅ feito' : !unlocked ? '🔒' : <>Construir<span style={{ display: 'block', fontSize: 9, opacity: .85 }}>−{e.cost} 💰</span></>}
            </button>
          </div>
        )
      })}
      {onBuyFilial && FILIAL_TESTERS.includes(loggedEmail() ?? '') && (() => {
        const allDone = STADIUM_SECTORS.every(x => sectorPct(st, x.k) >= 100) && STADIUM_EXTRAS.every(e => hasExtra(st, e.k))
        const canBuy = allDone && coins >= 2000
        const regras = (
          <ul style={{ margin: '7px 0 0', paddingLeft: 16, fontSize: 10.5, fontWeight: 700, color: 'rgba(0,0,0,.7)', lineHeight: 1.55 }}>
            <li>💰 A SAF custa <b>2.000</b> · compra única · os direitos são seus <b>pra sempre nesta carreira</b> (não vende, não troca)</li>
            <li>🏆 Direito a <b>50% dos lucros de campanha</b> (título e acesso) — caem no seu caixa na virada da temporada</li>
            <li>📉 <b>Queda dói</b>: 50% da multa de rebaixamento sai do SEU caixa</li>
            <li>🙅 <b>Nada</b> dos lucros de compra/venda do clube no mercado — só campanha</li>
            <li>⚖️ O clube da SAF <b>nunca disputa seu leilão</b>: vida própria, sobe e desce por mérito</li>
            <li>📈 Ela sobe de série? Sua comissão cresce junto (prêmio de série alta paga mais)</li>
            <li>📋 Empréstimo de jogador entre os clubes: escolha na hora, <b>sempre volta</b> na virada de temporada</li>
          </ul>
        )
        if (filial) {
          return (
          <div style={{ ...box('#FFF6DE'), borderRadius: 14, padding: '11px 12px', marginTop: 14 }}>
            <p style={{ fontWeight: 900, fontSize: 14.5, margin: 0, ...OSW }}>💼 SUA SAF</p>
            <p style={{ fontWeight: 900, fontSize: 13, margin: '5px 0 2px', ...OSW }}>⚽ {filial.team}{filialInfo ? <span style={{ fontWeight: 700, fontSize: 10.5, color: 'rgba(0,0,0,.55)' }}> · Série {filialInfo.div} · {filialInfo.pos}º</span> : null}</p>
            <p style={{ fontSize: 10.5, fontWeight: 700, color: 'rgba(0,0,0,.55)', margin: 0 }}>Dono da SAF desde a T{filial.since} · direito a 50% dos lucros de campanha (título/acesso rende; queda desconta)</p>
            <p style={{ fontSize: 11.5, fontWeight: 900, color: (filial.earned ?? 0) >= 0 ? GREEN : '#B23B2E', margin: '4px 0 0', ...OSW }}>💼 Comissões acumuladas: {(filial.earned ?? 0) >= 0 ? '+' : ''}{filial.earned ?? 0} 🪙</p>

            {/* 🔄 JANELA DE EMPRÉSTIMO — propriedade nunca muda, sempre volta na virada */}
            <div style={{ marginTop: 10, borderTop: '2px dashed rgba(0,0,0,.15)', paddingTop: 9 }}>
              <p style={{ fontWeight: 900, fontSize: 12, margin: '0 0 6px', ...OSW }}>🔄 Janela de empréstimo</p>

              {/* empresta PRA SAF */}
              {filial.loanOut ? (
                <div style={{ background: '#fff', border: `2px solid ${INK}`, borderRadius: 9, padding: '6px 9px', marginBottom: 6, fontSize: 11, fontWeight: 800 }}>
                  📤 <b>{filial.loanOut.name}</b> ({filial.loanOut.pos}) jogando na SAF · volta pra você na próxima temporada
                </div>
              ) : onLoanTo && (mySquad?.length ?? 0) > 0 ? (
                <div style={{ marginBottom: 6 }}>
                  <button onClick={() => setPickOut(o => !o)} style={{ border: `2px solid ${INK}`, borderRadius: 9, padding: '7px 10px', fontWeight: 900, fontSize: 11, ...OSW, background: '#fff', width: '100%', textAlign: 'left', cursor: 'pointer' }}>
                    📤 {pickOut ? '▾' : '▸'} Emprestar um jogador seu pra SAF
                  </button>
                  {pickOut && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 5, maxHeight: 160, overflowY: 'auto' }}>
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

              {/* pega emprestado DA SAF */}
              {filial.loanIn ? (
                <div style={{ background: '#fff', border: `2px solid ${INK}`, borderRadius: 9, padding: '6px 9px', fontSize: 11, fontWeight: 800 }}>
                  📥 <b>{filial.loanIn.name}</b> ({filial.loanIn.pos}) jogando com você · volta pra SAF na próxima temporada
                </div>
              ) : onLoanFrom && (filialSquad?.length ?? 0) > 0 ? (
                <div>
                  <button onClick={() => setPickIn(o => !o)} style={{ border: `2px solid ${INK}`, borderRadius: 9, padding: '7px 10px', fontWeight: 900, fontSize: 11, ...OSW, background: '#fff', width: '100%', textAlign: 'left', cursor: 'pointer' }}>
                    📥 {pickIn ? '▾' : '▸'} Pegar um jogador emprestado da SAF
                  </button>
                  {pickIn && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 5, maxHeight: 160, overflowY: 'auto' }}>
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
          </div>
          )
        }
        return (
          <div style={{ ...box('#FBF6E9'), borderRadius: 14, padding: '11px 12px', marginTop: 14, opacity: allDone ? 1 : .6, borderStyle: allDone ? 'solid' : 'dashed', boxShadow: allDone ? `4px 4px 0 0 ${INK}` : 'none' }}>
            <p style={{ fontWeight: 900, fontSize: 14.5, margin: 0, ...OSW }}>💼 COMPRAR UMA SAF <span style={{ fontSize: 9, background: INK, color: GOLD, borderRadius: 5, padding: '1px 6px', verticalAlign: 'middle' }}>TESTE</span></p>
            <p style={{ fontSize: 10.5, fontWeight: 700, color: 'rgba(0,0,0,.55)', margin: '3px 0 6px' }}>
              {allDone
                ? <>Compre a <b>SAF de um clube da Série D</b> e vire dono: você adquire o direito a <b>50% dos lucros de campanha</b> dele (e assume metade do prejuízo na queda). O clube segue jogando por conta própria — sem leilão contra você. Empréstimos de jogadores entre os clubes: em breve.</>
                : <>🔒 destrava com: <b style={{ color: '#9a4b00' }}>Estádio 100% completo</b> (setores + melhorias) · a SAF custa 2.000 💰</>}
            </p>
            {allDone && regras}
            {allDone && <div style={{ height: 7 }} />}
            {allDone && !buying && (
              <button onClick={() => canBuy && setBuying(true)} disabled={!canBuy}
                style={{ width: '100%', border: 'none', borderRadius: 10, padding: '10px 0', fontWeight: 900, fontSize: 13.5, ...OSW, background: canBuy ? INK : '#d9cfb4', color: canBuy ? '#fff' : '#7d7358', cursor: canBuy ? 'pointer' : 'default' }}>
                {canBuy ? '💼 Comprar a SAF de um clube · −2.000 💰' : `Junte 2.000 💰 (tem ${coins})`}
              </button>
            )}
            {allDone && buying && (
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

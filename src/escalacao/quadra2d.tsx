// 🏀📺 QUADRA 2D DO BASQUETE (18/11, mockup aprovado pelo Diego: *"Pode sim"* — `scripts/mockups/basquete-quadra2d*.png`).
//
// É o Campo 2D do futebol, em quadra: 5 contra 5, ao vivo, no relógio do placar. A quadra NÃO decide nada — ela encena o
// ROTEIRO (`quadra2d-plano.ts`), que fecha sempre no placar do jogo. Computador = quadra inteira deitada; celular = a câmera
// segue a bola e mostra a meia-quadra do ataque (com a quadra inteira os 10 ficavam espremidos).
// 🎯 cesta de 3 sai de FORA da linha, 2 de dentro, lance livre da linha (regra do Diego, a trava é `npm run quadra2d`).
import { useEffect, useMemo, useRef, useState } from 'react'
import { QUADRA, posseEm, placarEm, type Lance, type PlanoQuadra } from './quadra2d-plano'
import { cenaEm, atacaDireita } from './quadra2d-cena'
import { falaDoLance } from './narracao-basquete'
import { legendAvatar } from './legend-avatars'
import { PlacaGol } from './patrocinio-visual'
import { basketClockLabel } from './sportcfg'
import { getLang } from './lang'
import { campoNaTela } from './campo2d-modo'

export type JogadorQuadra = { name: string; club?: string; year?: number; num: number }
export type LadoQuadra = { nome: string; sigla: string; cor: string; jogadores: JogadorQuadra[] }

const S = 10 // px por pé
const W = QUADRA.comp * S, H = QUADRA.larg * S
const AROX = QUADRA.aroX * S, AROY = QUADRA.aroY * S
const INK = '#0C0C0C'

const corTexto = (hex: string) => { const n = parseInt(hex.replace('#', '').slice(0, 6), 16); const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255; return r * 0.299 + g * 0.587 + b * 0.114 > 150 ? INK : '#fff' }
function Quadra({ id }: { id: string }) {
  const L = { stroke: '#fff', strokeWidth: 3, fill: 'none' } as const
  const lado = (dir: boolean, cor: string) => {
    const bx = dir ? AROX : W - AROX, base = dir ? W : 0, d = dir ? -1 : 1
    const r = QUADRA.raio3 * S, y1 = QUADRA.canto3Y * S, y2 = H - y1
    const dx = Math.sqrt(r * r - (AROY - y1) ** 2), xt = bx + d * dx
    const sw = dir ? 0 : 1
    return <g>
      <rect x={dir ? W - 19 * S : 0} y={17 * S} width={19 * S} height={16 * S} {...L} fill={cor} fillOpacity={0.82} />
      <circle cx={dir ? W - 19 * S : 19 * S} cy={AROY} r={6 * S} {...L} />
      <path d={`M${base},${y1} L${xt},${y1} A${r},${r} 0 0 ${sw} ${xt},${y2} L${base},${y2}`} {...L} />
      <path d={`M${bx},${21 * S} A${4 * S},${4 * S} 0 0 ${sw} ${bx},${29 * S}`} {...L} />
      <line x1={dir ? W - 4 * S : 4 * S} y1={22 * S} x2={dir ? W - 4 * S : 4 * S} y2={28 * S} stroke={INK} strokeWidth={6} />
      <circle cx={bx} cy={AROY} r={9} fill="none" stroke="#E8503A" strokeWidth={4} />
    </g>
  }
  return <g>
    <defs><pattern id={`mad${id}`} width="60" height="12" patternUnits="userSpaceOnUse"><rect width="60" height="12" fill="#D9A15F" /><rect width="60" height="6" fill="#D29655" /><line x1="0" y1="12" x2="60" y2="12" stroke="#B87C3E" /><line x1="22" y1="0" x2="22" y2="6" stroke="#B87C3E" /><line x1="48" y1="6" x2="48" y2="12" stroke="#B87C3E" /></pattern></defs>
    <rect x={0} y={0} width={W} height={H} fill={`url(#mad${id})`} />
    {lado(false, 'var(--q2d-esq)')}{lado(true, 'var(--q2d-dir)')}
    <line x1={W / 2} y1={0} x2={W / 2} y2={H} {...L} />
    <circle cx={W / 2} cy={H / 2} r={6 * S} {...L} fill="#FFC400" fillOpacity={0.9} />
    <text x={W / 2} y={H / 2 + 12} textAnchor="middle" fontFamily="Oswald" fontWeight={900} fontSize={34} fill={INK}>BL</text>
    <rect x={1.5} y={1.5} width={W - 3} height={H - 3} {...L} />
  </g>
}

function Ficha({ x, y, r, j, cor, comBola, celular, id, semNome }: { x: number; y: number; r: number; j: JogadorQuadra; cor: string; comBola: boolean; celular: boolean; id: string; semNome?: boolean }) {
  const art = legendAvatar(j.name, j.club, j.year)
  const src = art ? (art.src.startsWith('/') ? import.meta.env.BASE_URL + art.src.slice(1) : art.src) : null
  const semApelido = j.name.replace(/\s*\([^)]*\)\s*/g, ' ').trim() // "Pete Maravich (Pistol Pete)" → "Pete Maravich"
  const nome = semApelido.length > 13 ? semApelido.split(' ').slice(-1)[0] : semApelido
  const fs = celular ? 19 : 15, lw = Math.max(60, nome.length * fs * 0.52 + 14)
  return <g>
    {src ? <>
      <clipPath id={`q2c${id}`}><circle cx={x} cy={y} r={r - 4} /></clipPath>
      <circle cx={x} cy={y} r={r} fill={cor} stroke={INK} strokeWidth={3} />
      <image href={src} x={x - r} y={y - r + 2} width={2 * r} height={2 * r} clipPath={`url(#q2c${id})`} />
    </> : <>
      <circle cx={x} cy={y} r={r - 4} fill={cor} stroke={INK} strokeWidth={3} />
      <text x={x} y={y + (celular ? 11 : 8)} textAnchor="middle" fontFamily="Oswald" fontWeight={900} fontSize={celular ? 30 : 22} fill={corTexto(cor)}>{j.num}</text>
    </>}
    {!semNome && <>
      <rect x={x - lw / 2} y={y + r + 2} width={lw} height={celular ? 26 : 20} rx={5} fill={INK} fillOpacity={0.82} />
      <text x={x} y={y + r + (celular ? 22 : 17)} textAnchor="middle" fontFamily="Oswald" fontWeight={700} fontSize={fs} fill="#fff">{nome}</text>
    </>}
    {comBola && <path d={`M${x - 9},${y - r - 20} h18 l-9,12 z`} fill="#fff" stroke={INK} strokeWidth={2} />}
  </g>
}

/** relógio contínuo entre os "tiques" de minuto do placar (o card anda de minuto em minuto; a quadra precisa de movimento liso) */
function useTempoLiso(minuto: number, minutoMs: number, fechado: boolean): number {
  const [agora, setAgora] = useState(() => performance.now())
  const marca = useRef({ min: minuto, em: performance.now() })
  if (marca.current.min !== minuto) marca.current = { min: minuto, em: performance.now() }
  useEffect(() => {
    if (fechado) return
    let raf = 0, ult = 0
    const roda = (ts: number) => { if (ts - ult > 33) { ult = ts; setAgora(ts) } raf = requestAnimationFrame(roda) }
    raf = requestAnimationFrame(roda)
    return () => cancelAnimationFrame(raf)
  }, [fechado])
  if (fechado) return 93
  return Math.min(93, minuto + Math.min(0.999, Math.max(0, (agora - marca.current.em) / Math.max(1, minutoMs))))
}

function useCelular(): boolean {
  const q = '(max-width: 720px)'
  const [m, setM] = useState(() => typeof window !== 'undefined' && window.matchMedia?.(q).matches)
  useEffect(() => { const mq = window.matchMedia(q); const f = () => setM(mq.matches); mq.addEventListener?.('change', f); return () => mq.removeEventListener?.('change', f) }, [])
  return !!m
}

export function Quadra2D({ plano, minuto, minutoMs, fechado, casa, fora, pausado, seed, falaAbertura, falaFinal }: {
  plano: PlanoQuadra; minuto: number; minutoMs: number; fechado: boolean; casa: LadoQuadra; fora: LadoQuadra; pausado?: boolean
  /** a semente do jogo (a mesma do roteiro): a fala sai igual em todo aparelho */ seed: number
  /** 🎙️ a fala do começo e do apito final (a rádio do basquete de sempre) */ falaAbertura: string; falaFinal: string
}) {
  const celular = useCelular()
  // 📢 com a quadra na tela, o telão solto da página se esconde (o da quadra fica logo abaixo dela) — nunca dois telões
  useEffect(() => { campoNaTela(1); return () => campoNaTela(-1) }, [])
  const t = useTempoLiso(minuto, minutoMs, fechado || !!pausado)
  const cena = useMemo(() => cenaEm(plano, t), [plano, t])
  const dir = atacaDireita(cena.of, t)
  const ofLado = cena.of === 'casa' ? casa : fora, dfLado = cena.of === 'casa' ? fora : casa
  // pés (atacando pra direita) → px na tela. Computador: a quadra inteira, espelhando quando o ataque é pra esquerda.
  // Celular: meia-quadra em pé, o aro do ataque SEMPRE embaixo (a câmera segue a bola).
  const tela = (p: [number, number]): [number, number] => {
    if (celular) return [H - p[1] * S, p[0] * S]
    return dir ? [p[0] * S, p[1] * S] : [W - p[0] * S, H - p[1] * S]
  }
  // cor do garrafão de cada lado: quem defende aquela cesta (casa defende a esquerda no 1º tempo)
  const corEsq = t < 46.5 ? casa.cor : fora.cor, corDir = celular ? dfLado.cor /* no celular o aro de baixo é sempre o do ataque da vez */ : t < 46.5 ? fora.cor : casa.cor
  const r = celular ? 31 : 26
  const fichas: { k: string; p: [number, number]; j: JogadorQuadra; cor: string; bola: boolean; semNome?: boolean }[] = []
  cena.defesa.forEach((p, i) => { const j = dfLado.jogadores[i]; if (j) fichas.push({ k: `d${i}`, p: tela(p), j, cor: dfLado.cor, bola: false, semNome: celular /* no celular só o ataque leva nome (senão os nomes se atropelam) */ }) })
  cena.ataque.forEach((p, i) => { const j = ofLado.jogadores[i]; if (j) fichas.push({ k: `a${i}`, p: tela(p), j, cor: ofLado.cor, bola: cena.comBola === i }) })
  const [bx, by] = tela(cena.bola)
  // o placar sai do MESMO roteiro, no mesmo instante da quadra (a cesta entra no placar quando a bola cai, nunca antes)
  const pl = fechado ? { casa: plano.casaFim, fora: plano.foraFim } : placarEm(plano, t)
  const placarCasa = pl.casa, placarFora = pl.fora
  // 🎙️ a fala: a jogada que acabou de acontecer (ou a que está terminando)
  const en = getLang() === 'en'
  const fala = (() => {
    if (fechado) return falaFinal
    const { atual, i } = posseEm(plano, t)
    const ref = atual && t >= atual.t0 + (atual.t1 - atual.t0) * 0.8 ? atual : plano.lances[i - 1]
    if (!ref || t < 1.2) return falaAbertura
    const el = ref.lado === 'casa' ? casa : fora, ou = ref.lado === 'casa' ? fora : casa
    return falaDoLance(ref, el.jogadores[ref.quem]?.name ?? el.nome, ref.defensor != null ? ou.jogadores[ref.defensor]?.name ?? '' : ou.jogadores[4]?.name ?? '', el.nome, ou.nome, seed, en).txt
  })()
  const relogio = basketClockLabel(Math.floor(t), getLang() === 'en' ? 'FINAL' : 'FIM')
  const viewBox = celular ? `-20 ${47 * S - 30} ${H + 40} ${47 * S + 60}` : `-30 -30 ${W + 60} ${H + 60}`
  const placar = <div className="q2d-placar">
    <span className="q2d-dot" style={{ background: casa.cor }} />{casa.sigla} <b>{placarCasa}</b><em>×</em><b>{placarFora}</b> {fora.sigla}<span className="q2d-dot" style={{ background: fora.cor }} />
    <span className="q2d-rel">{relogio}</span>{!fechado && <span className="q2d-24">⏱ {cena.relogio24}</span>}
  </div>
  const svg = <svg viewBox={viewBox} className="q2d-svg" style={{ ['--q2d-esq' as never]: corEsq, ['--q2d-dir' as never]: corDir }} role="img" aria-label={`${casa.nome} ${placarCasa} × ${placarFora} ${fora.nome}`}>
    <rect x={-40} y={-40} width={W + 80} height={W + 80} fill="#1a1410" />
    {celular ? <g transform={`translate(${H},0) rotate(90)`}><Quadra id="m" /></g> : <Quadra id="d" />}
    {fichas.map(f => <Ficha key={f.k} id={f.k} x={f.p[0]} y={f.p[1]} r={r} j={f.j} cor={f.cor} comBola={f.bola} celular={celular} semNome={f.semNome} />)}
    <circle cx={bx + (cena.comBola != null ? 14 : 0)} cy={by - (cena.comBola != null ? 12 : cena.bolaNoAr ? 10 : 0)} r={celular ? 13 : 10} fill="#E8701A" stroke={INK} strokeWidth={2.5} />
    {cena.selo && cena.seloEm && (() => { const [ax, ay] = tela(cena.seloEm); const sx = celular ? ax : ax + (dir ? -60 : 60), sy = celular ? ay - 95 : ay - 70; /* em cima do aro, longe das fichas */ const w = cena.selo.length * (celular ? 17 : 13) + 26; return <g><rect x={sx - w / 2} y={sy - 22} width={w} height={celular ? 46 : 38} rx={10} fill="#FFC400" stroke={INK} strokeWidth={3} /><text x={sx} y={sy + (celular ? 10 : 5)} textAnchor="middle" fontFamily="Oswald" fontWeight={900} fontSize={celular ? 30 : 24} fill={INK}>{cena.selo}</text></g> })()}
  </svg>
  return <div className={`q2d ${celular ? 'q2d-cel' : 'q2d-pc'}`}>
    <style>{CSS}</style>
    {placar}
    {!celular && <div className="q2d-arq" aria-hidden="true">{torcida(casa.cor, fora.cor, 1)}</div>}
    {!celular && <PlacaGol lado="cima" alt={22} />}
    {svg}
    {!celular && <PlacaGol lado="baixo" alt={22} />}
    {!celular && <div className="q2d-arq" aria-hidden="true">{torcida(casa.cor, fora.cor, 2)}</div>}
    <p className="q2d-narr" aria-live="polite">🎙️ {fala}</p>
    {fechado && <ResumoQuadra plano={plano} casa={casa} fora={fora} />}
  </div>
}

/** 📊 FIM DE JOGO · O RESUMO — o mesmo cartão do Campo 2D do futebol, com os números do basquete. Tudo sai do MESMO roteiro
 *  que a quadra mostrou (e o roteiro usa os pontos de cada jogador da estatística), então nada aqui contradiz a tela. */
function ResumoQuadra({ plano, casa, fora }: { plano: PlanoQuadra; casa: LadoQuadra; fora: LadoQuadra }) {
  const en = getLang() === 'en'
  const conta = (lado: 'casa' | 'fora', f: (l: Lance) => boolean) => plano.lances.filter(l => l.lado === lado && f(l)).length
  const defesa = (lado: 'casa' | 'fora', tipo: 'toco' | 'roubo') => plano.lances.filter(l => l.lado !== lado && l.tipo === tipo).length
  const linhas: [string, number, number][] = [
    [en ? 'THREES' : 'BOLAS DE 3', conta('casa', l => l.pts === 3), conta('fora', l => l.pts === 3)],
    [en ? 'FREE THROWS' : 'LANCES LIVRES', conta('casa', l => l.tipo === 'lance'), conta('fora', l => l.tipo === 'lance')],
    [en ? 'BLOCKS' : 'TOCOS', defesa('casa', 'toco'), defesa('fora', 'toco')],
    [en ? 'STEALS' : 'ROUBOS', defesa('casa', 'roubo'), defesa('fora', 'roubo')],
  ]
  const pts = new Map<string, { nome: string; p: number; cor: string }>()
  for (const l of plano.lances) {
    const lado = l.lado === 'casa' ? casa : fora, j = lado.jogadores[l.quem]
    if (!j || l.pts === 0) continue
    const k = `${l.lado}|${l.quem}`, at = pts.get(k)
    pts.set(k, { nome: j.name.replace(/\s*\([^)]*\)\s*/g, ' ').trim(), p: (at?.p ?? 0) + l.pts, cor: lado.cor })
  }
  const cestinha = [...pts.values()].sort((a, b) => b.p - a.p)[0]
  const tot = plano.casaFim + plano.foraFim || 1
  return <div className="q2d-res">
    <p className="q2d-res-tit">📊 {en ? 'FINAL · THE SUMMARY' : 'FIM DE JOGO · O RESUMO'}</p>
    <div className="q2d-res-times"><span><i style={{ background: casa.cor }} />{casa.sigla}</span><span>{fora.sigla}<i style={{ background: fora.cor }} /></span></div>
    <div className="q2d-res-barra"><b style={{ width: `${(plano.casaFim / tot) * 100}%`, background: casa.cor }} /><b style={{ flex: 1, background: fora.cor }} /></div>
    <div className="q2d-res-linha"><strong>{plano.casaFim}</strong><span>{en ? 'POINTS' : 'PONTOS'}</span><strong>{plano.foraFim}</strong></div>
    {linhas.map(([rot, a, b]) => <div key={rot} className="q2d-res-linha"><strong>{a}</strong><span>{rot}</span><strong>{b}</strong></div>)}
    {cestinha && <div className="q2d-res-mvp"><span>⭐ {en ? 'TOP SCORER' : 'CESTINHA DO JOGO'}</span><b>{cestinha.nome} · {cestinha.p} {en ? 'PTS' : 'PTS'} <i style={{ background: cestinha.cor }} /></b></div>}
  </div>
}

function torcida(a: string, b: string, semente: number) {
  let x = semente * 9973
  const r = () => { x = (x * 16807) % 2147483647; return x / 2147483647 }
  return Array.from({ length: 180 }, (_, i) => <i key={i} style={{ background: r() < 0.7 ? a : b }} />)
}

const CSS = `
.q2d{position:relative;background:#12100e;border:3px solid #000;border-radius:18px;padding:10px;box-shadow:4px 4px 0 #000;margin-bottom:10px}
.q2d-svg{display:block;width:100%;height:auto}
.q2d-placar{display:flex;align-items:center;justify-content:center;gap:6px;background:#fff;border:3px solid #000;border-radius:12px;padding:5px 10px;font:900 18px Oswald,sans-serif;color:#0C0C0C;box-shadow:3px 3px 0 #000;margin:0 auto 8px;width:max-content;max-width:100%}
.q2d-placar b{color:#c48a00}.q2d-placar em{font-style:normal;font-size:13px;color:#0007}
.q2d-dot{width:12px;height:12px;border:2px solid #000;border-radius:3px;display:inline-block}
.q2d-rel{margin-left:6px;font-size:15px}.q2d-24{margin-left:4px;background:#C2452F;color:#fff;border-radius:6px;padding:0 6px;font-size:14px}
.q2d-narr{margin:10px 0 0;background:#fff;border:3px solid #000;border-radius:12px;padding:10px 14px;font:700 15px Inter,system-ui,sans-serif;color:#0C0C0C;line-height:1.35}
.q2d-res{margin-top:10px;background:#F4ECD6;border:3px solid #000;border-radius:14px;padding:12px 14px;color:#0C0C0C;font-family:Oswald,sans-serif}
.q2d-res-tit{margin:0 0 8px;text-align:center;font-weight:900;font-size:19px}
.q2d-res-times{display:flex;justify-content:space-between;font-weight:900;font-size:17px}.q2d-res-times span{display:flex;align-items:center;gap:6px}
.q2d-res-times i,.q2d-res-mvp i{width:13px;height:13px;border:2px solid #000;border-radius:3px;display:inline-block}
.q2d-res-barra{display:flex;height:9px;border:2px solid #000;border-radius:6px;overflow:hidden;margin:6px 0 8px}.q2d-res-barra b{display:block;height:100%}
.q2d-res-linha{display:flex;justify-content:space-between;align-items:center;padding:3px 0}.q2d-res-linha strong{font-size:21px;min-width:36px}.q2d-res-linha strong:last-child{text-align:right}
.q2d-res-linha span{font-weight:700;font-size:13px;letter-spacing:.06em;color:#0009}
.q2d-res-mvp{margin-top:8px;background:#0C0C0C;color:#fff;border-radius:10px;padding:8px 12px;display:flex;justify-content:space-between;align-items:center;gap:8px}
.q2d-res-mvp span{color:#FFC400;font-weight:900;font-size:13px;white-space:nowrap}.q2d-res-mvp b{font-size:16px;display:flex;align-items:center;gap:6px;text-align:right;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0}
.q2d-arq{display:flex;flex-wrap:wrap;gap:3px;padding:4px 10px;max-height:26px;overflow:hidden}.q2d-arq i{width:8px;height:8px;border-radius:50%;display:block;opacity:.9}
`

export type { Lance }

/** 🏀 o QUINTETO que entra na quadra: o melhor de cada posição (PG..C = GOL..ATA no motor), na ordem das vagas */
export function quintetoDe(squad?: { name: string; pos?: string; club?: string; year?: number; lo?: number; hi?: number }[]): (JogadorQuadra & { nivel: number })[] {
  const ordem = ['GOL', 'LAT', 'ZAG', 'MEI', 'ATA']
  const usados = new Set<string>()
  const lista = squad ?? []
  const forca = (c: { lo?: number; hi?: number }) => ((c.lo ?? 60) + (c.hi ?? 70)) / 2
  const num = (n: string) => { let h = 7; for (const ch of n) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return 1 + (h % 54) }
  const out: (JogadorQuadra & { nivel: number })[] = []
  for (const pos of ordem) {
    const c = [...lista].filter(x => x.pos === pos && !usados.has(x.name)).sort((a, b) => forca(b) - forca(a))[0]
      ?? [...lista].filter(x => !usados.has(x.name)).sort((a, b) => forca(b) - forca(a))[0]
    if (!c) continue
    usados.add(c.name)
    out.push({ name: c.name, club: c.club, year: c.year, num: num(c.name), nivel: Math.max(0, Math.min(1, (forca(c) - 55) / 40)) })
  }
  return out
}
/** a sigla do placar: 3 letras do clube */
export function siglaDe(nome: string): string {
  const limpo = nome.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z ]/g, '').trim()
  const pal = limpo.split(/\s+/).filter(p => p.length > 2)
  return (pal.length >= 3 ? pal.slice(0, 3).map(p => p[0]).join('') : (pal[0] ?? limpo).slice(0, 3)).toUpperCase() || 'BL'
}

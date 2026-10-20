// 📺 CAMPO 2D — a tela (20/10). O protótipo que o Diego aprovou (`scripts/prototipo-jogo-ao-vivo/`) virou componente do jogo.
// Quem decide o jogo continua sendo o motor de sempre: aqui entram os gols e as chances já calculados e o MINUTO do placar; o
// `Jogo2D` (campo2d-motor.ts) monta as jogadas em volta e este componente só desenha.
// Regras dele que moram aqui:
//   · 👕 a bolinha é a CAMISA do time (cor + número; nunca a cor da categoria); camisa parecida → o visitante entra com a 2ª cor;
//   · 👑 só lenda tem rostinho (anel grosso na cor do time); o resto, o número;
//   · ⚽ no gol entra o MASCOTE do time (quem tem) ou "GOOOL" + escudo (quem não tem), com a faixinha do autor — sem rosto;
//   · 🖥️ no DESKTOP o campo é DEITADO (mockup aprovado 20/10: *"desktop talvez seja melhor horizontal"*) com o estádio completo
//     (3 fileiras de torcida, placas nas laterais, bandeirão atrás do gol); no CELULAR fica em pé e o campo NÃO encolhe: a faixa
//     da torcida tem a largura de sempre e as placas ficam só atrás dos gols (*"no móvel não vai diminuir o espaço do campo?"*).
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Jogo2D, eventosDoJogo, W, L, SEG_POR_MIN, type Atleta, type CartaCampo } from './campo2d-motor'
import { chancesDoJogo, sementeDasChances, quemFinalizou } from './chances'
import { avatarLote1 } from './avatar-lote1'
import { useT } from './lang'
import { PlacaGol } from './patrocinio-visual' // 🏟️ as MESMAS placas atrás dos gols do campinho do jogo (Vadico · Tidex, trocando)
import { placasDoCampo, type PlacaCampo } from './patrocinio'
import { nomeLimpo } from './escudos'

const INK = '#0C0C0C', GOLD = '#FFC400'
const OSW = { fontFamily: 'Oswald, sans-serif', fontWeight: 700 } as const
// 📱 EM PÉ (celular): margens de sempre — 8 m de cada lado pra torcida/técnico, 4 m atrás dos gols
const PAD = 4, PADX = 8
// 🖥️ DEITADO (desktop): 9 m nas pontas (gol + bandeirão) e 12 m em cima/embaixo (3 fileiras de torcida + placa)
const PADL = 9, PADT = 12
const DEITADO_A_PARTIR = 700 // px de largura da caixa; abaixo disso é celular/coluna estreita → em pé
const PLACA_MS = 7000 // as placas laterais trocam no mesmo ritmo das placas atrás do gol

type Gol = { name: string; min: number; home: boolean; assist?: string }
export interface Campo2DProps {
  roundKey: number
  casa: { nome: string; cor: string; cartas?: CartaCampo[]; mascote?: ReactNode | null; escudo?: ReactNode; tecnico?: string | null }
  fora: { nome: string; cor: string; cartas?: CartaCampo[]; mascote?: ReactNode | null; escudo?: ReactNode; tecnico?: string | null }
  gols: Gol[]
  roundMs: number
  minuto: number // o minuto que o placar mostra (o relógio manda)
  fechado?: boolean
  tatica?: [number, number]
  /** o placar de baixo já tem a 📻 Rádio Legends narrando: aqui a faixa some (o mesmo texto não aparece duas vezes) */
  semNarra?: boolean
}

// 🎨 cor e tinta: luminância pra escolher letra clara/escura, e distância pra trocar a camisa do visitante
const rgb = (hex: string) => { const n = parseInt((hex || '#888888').replace('#', '').slice(0, 6).padEnd(6, '8'), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255] }
const claro = (hex: string) => { const [r, g, b] = rgb(hex); return 0.299 * r + 0.587 * g + 0.114 * b > 160 }
const perto = (a: string, b: string) => { const [r1, g1, b1] = rgb(a), [r2, g2, b2] = rgb(b); return Math.hypot(r1 - r2, g1 - g2, b1 - b2) < 110 }
const sigla = (nome: string) => nomeLimpo(nome).replace(/[^A-Za-zÀ-ú ]/g, '').trim().slice(0, 3).toUpperCase()
const IMGS = new Map<string, HTMLImageElement>()
function img(src: string): HTMLImageElement {
  let im = IMGS.get(src)
  if (!im) { im = new Image(); im.src = src; IMGS.set(src, im) }
  return im
}
function rosto(c?: CartaCampo): HTMLImageElement | null {
  if (!c || (c.fame ?? 0) < 5) return null
  const art = avatarLote1(c.name, c.club, c.year)
  if (!art) return null
  return img(`${import.meta.env.BASE_URL}${art.src.slice(1)}`)
}
// 🔢 o número da camisa sai da posição (a carta não tem número): 1 · laterais 2/6 · zagueiros 3/4/5 · meias 8/10/5/7 · atacantes 9/11/7/10
const NUMEROS: Record<Atleta['grupo'], number[]> = { GOL: [1, 12], LAT: [2, 6, 13, 16], DEF: [3, 4, 5, 15], MEI: [8, 10, 5, 7, 20], ATA: [9, 11, 7, 10, 19] }
function numerosDe(atl: Atleta[]): Map<Atleta, number> {
  const out = new Map<Atleta, number>()
  for (const lado of [0, 1]) {
    const usados = new Set<number>()
    for (const g of ['GOL', 'LAT', 'DEF', 'MEI', 'ATA'] as const) {
      let i = 0
      for (const p of atl) if (p.lado === lado && p.grupo === g) {
        let n = NUMEROS[g][i++] ?? 14 + i
        while (usados.has(n)) n++
        usados.add(n); out.set(p, n)
      }
    }
  }
  return out
}

export function Campo2D({ roundKey, casa, fora, gols, roundMs, minuto, fechado, tatica, semNarra }: Campo2DProps) {
  const t = useT()
  const cv = useRef<HTMLCanvasElement | null>(null)
  const caixa = useRef<HTMLDivElement | null>(null)
  const [larg, setLarg] = useState(360)
  const [narra, setNarra] = useState('')
  const [festa, setFesta] = useState<{ lado: 0 | 1; autor: string; assist?: string; min: number } | null>(null)
  const [placarV, setPlacarV] = useState<[number, number]>([0, 0])
  const ultimos = useRef({ narra: '', festa: '', placar: [-1, -1] as [number, number] })
  const deitado = larg >= DEITADO_A_PARTIR
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
  // 🐢 ANTI-TRAVADA (20/10, Diego: *"o jogo dando umas travadas com a bola rolando"*): o placar re-renderiza a cada minuto e
  // mandava arrays/objetos novos — o desenho REINICIAVA (canvas zerado, tudo recalculado). Agora o que muda sem mudar o jogo
  // (elenco, técnico, apito, idioma) é lido daqui, e o desenho só reinicia quando muda o JOGO, o tamanho ou as cores.
  const vivo = useRef({ casa, fora, fechado, t })
  vivo.current = { casa, fora, fechado, t }

  useEffect(() => {
    const el = caixa.current
    if (!el) return
    const mede = () => { const w = el.clientWidth; setLarg(w >= DEITADO_A_PARTIR ? Math.min(1100, w) : Math.min(460, w)) }
    const ro = new ResizeObserver(mede)
    ro.observe(el); mede()
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    let raf = 0
    const c = cv.current; if (!c) return
    // 📐 a GEOMETRIA: o motor pensa em pé (x 0–68 de largura, y 0–105 de comprimento, mandante ataca y→0). Em pé, a tela é o
    // motor; deitado, troca os eixos (o mandante ataca pra ESQUERDA). Todo desenho passa por `tr`/`rect`, nunca por conta solta.
    const S = deitado ? larg / (L + PADL * 2) : larg / (W + PADX * 2)
    const CW = larg, CH = Math.round(deitado ? (W + PADT * 2) * S : (L + PAD * 2) * S)
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    c.width = CW * dpr; c.height = CH * dpr; c.style.width = CW + 'px'; c.style.height = CH + 'px'
    const cx = c.getContext('2d')!; cx.setTransform(dpr, 0, 0, dpr, 0, 0)
    const tr = deitado
      ? (x: number, y: number): [number, number] => [(y + PADL) * S, (x + PADT) * S]
      : (x: number, y: number): [number, number] => [(x + PADX) * S, (y + PAD) * S]
    const rect = (x: number, y: number, w: number, h: number): [number, number, number, number] => {
      const [x0, y0] = tr(x, y), [x1, y1] = tr(x + w, y + h)
      return [Math.min(x0, x1), Math.min(y0, y1), Math.abs(x1 - x0), Math.abs(y1 - y0)]
    }
    const R = Math.max(8, S * 1.95)
    const fonte = (px: number, peso = 700) => `${peso} ${Math.round(px)}px Oswald, "Arial Narrow", Arial, sans-serif`
    let cartaDe = new Map<string, CartaCampo>(), cartasDe: unknown[] = []
    const rostoDe = new Map<string, HTMLImageElement | null>()
    const numero = numerosDe(jogo.atl)
    // o que já foi pra tela mora FORA do efeito: ele roda de novo a cada render e não pode esquecer que o GOL já está aberto
    const ult = ultimos.current
    const placas = placasDoCampo()

    // 🏟️ A TORCIDA: em pé, nas faixas dos lados (3 colunas, a largura de sempre); deitado, em cima e embaixo (3 fileiras)
    const faixaTorcida = (() => {
      if (deitado) {
        const alt = (PADT - 3.2) * S // fileiras; o resto é a placa + respiro
        return [{ x: 0, y: 0, w: CW, h: alt }, { x: 0, y: CH - alt, w: CW, h: alt }]
      }
      const w = (PADX - 3.5) * S
      return [{ x: 0, y: 0, w, h: CH }, { x: CW - w, y: 0, w, h: CH }]
    })()
    const torcida = (g: CanvasRenderingContext2D, festa: 0 | 1 | null, tt: number) => {
      faixaTorcida.forEach(f => {
        g.fillStyle = '#1b232c'; g.fillRect(f.x, f.y, f.w, f.h)
        const fileiras = 3, ao = deitado ? f.h : f.w, al = deitado ? f.w : f.h
        const n = Math.max(12, Math.round(al / (S * 1.35)))
        for (let r = 0; r < fileiras; r++) {
          const base = (r + 0.5) / fileiras * ao
          g.fillStyle = r % 2 ? '#232c36' : '#1f2831'
          if (deitado) g.fillRect(f.x, f.y + base - ao / fileiras / 2, f.w, ao / fileiras); else g.fillRect(f.x + base - ao / fileiras / 2, f.y, ao / fileiras, f.h)
          for (let i = 0; i < n; i++) {
            const ao2 = (i + 0.5) / n * al + ((i * 7 + r * 3) % 5 - 2) * 0.6
            const pula = festa != null && ((i + r) % 3 === 0) === (festa === 0) ? Math.abs(Math.sin(tt * 9 + i + r)) * 2.5 : 0
            const px0 = deitado ? f.x + ao2 : f.x + base, py0 = deitado ? f.y + base - pula : f.y + ao2 - pula
            // a torcida da casa é maioria; a visitante fica num cantinho (lado/ponta oposta)
            // 🏟️ a torcida da CASA é maioria nas duas faixas; a VISITANTE fica num cantinho só, atrás do gol que o visitante
            // defende (deitado: a ponta esquerda; em pé: a ponta de cima) — Diego 20/10: *"a torcida com um cantinho só de um lado?"*
            const visitante = i / n < 0.18
            g.beginPath(); g.arc(px0, py0, Math.max(1.6, S * 0.42), 0, 7); g.fillStyle = visitante ? corFora : corCasa; g.globalAlpha = 0.9; g.fill(); g.globalAlpha = 1
          }
        }
      })
    }
    // 🪧 placas de propaganda NAS LATERAIS (só deitado — em pé elas ficam atrás dos gols, em HTML, como sempre)
    const placasLaterais = (g: CanvasRenderingContext2D, slot: number) => {
      if (!deitado || !placas.length) return
      const [, yTop] = tr(0, 0), [, yBot] = tr(W, 0), alt = 2.4 * S, [x0] = tr(0, 0), [x1] = tr(0, L), n = 5, w = (x1 - x0) / n
      for (const yy of [yTop - alt - 0.8 * S, yBot + 0.8 * S]) {
        for (let i = 0; i < n; i++) {
          const p: PlacaCampo = placas[(slot + i + (yy > yTop ? 1 : 0)) % placas.length]
          const fundo = p.fundo.startsWith('linear') ? GOLD : p.fundo
          g.fillStyle = fundo; g.fillRect(x0 + i * w + 1, yy, w - 2, alt)
          const logo = p.logo ? img(p.logo) : null
          if (logo && logo.complete && logo.naturalWidth) {
            const h = alt * 0.7, lw = Math.min(w - 10, h * (p.prop ?? 3))
            g.drawImage(logo, x0 + i * w + w / 2 - lw / 2, yy + alt / 2 - h / 2, lw, h)
          } else {
            g.fillStyle = claro(fundo) ? INK : '#fff'; g.font = fonte(alt * 0.55); g.textAlign = 'center'; g.fillText(p.nome.toUpperCase(), x0 + i * w + w / 2, yy + alt * 0.7)
          }
        }
      }
    }
    // 🚩 bandeirão da torcida atrás de cada gol (só deitado: na ponta sobra espaço)
    const bandeirao = (g: CanvasRenderingContext2D) => {
      if (!deitado) return
      for (const [lado, nome, cor] of [[0, casa.nome, corCasa], [1, fora.nome, corFora]] as const) {
        // o mandante ataca pra esquerda → a torcida dele fica atrás do gol da DIREITA (o gol que ele defende)
        const [gx] = tr(34, lado === 0 ? L : 0), [, gy] = tr(34, 0)
        const X = lado === 0 ? gx + 4.4 * S : gx - 4.4 * S, alt = 36 * S, w = 3.2 * S
        g.save(); g.translate(X, gy); g.rotate(-Math.PI / 2)
        g.fillStyle = cor; g.globalAlpha = 0.92; g.beginPath(); g.moveTo(-alt / 2, -w / 2); g.lineTo(alt / 2, -w / 2 + 1); g.lineTo(alt / 2 - 2, w / 2); g.lineTo(-alt / 2 - 2, w / 2 - 1); g.closePath(); g.fill(); g.globalAlpha = 1
        g.fillStyle = claro(cor) ? INK : '#fff'; g.font = fonte(w * 0.62, 900); g.textAlign = 'center'; g.fillText(nomeLimpo(nome).toUpperCase().slice(0, 14), 0, w * 0.22)
        g.restore()
      }
    }
    // 🟩 o fundo parado (gramado, linhas, arquibancada, bandeirão) desenhado UMA vez — o celular agradece
    const fundo = document.createElement('canvas'); fundo.width = CW * dpr; fundo.height = CH * dpr
    {
      const g = fundo.getContext('2d')!; g.setTransform(dpr, 0, 0, dpr, 0, 0)
      g.fillStyle = '#1b232c'; g.fillRect(0, 0, CW, CH)
      // grama fora das linhas + listras cortadas (bandas ao longo do comprimento, 14 faixas)
      const [fx, fy, fw, fh] = rect(-PADX, -PAD, W + PADX * 2, L + PAD * 2)
      g.fillStyle = '#2a8542'; g.fillRect(fx, fy, fw, fh)
      for (let i = 0; i < 14; i++) { const [x, y, w, h] = rect(-PADX, -PAD + (i * (L + PAD * 2)) / 14, W + PADX * 2, (L + PAD * 2) / 14 + 0.3); g.fillStyle = i % 2 ? '#2a8542' : '#32984e'; g.fillRect(x, y, w, h) }
      // sombra da arquibancada caindo num canto (dá volume)
      const [sx0, sy0] = tr(0, 0), [sx1] = tr(W, 0), [, sy1] = tr(0, L)
      const som = g.createLinearGradient(sx0, sy0, sx0 + (sx1 - sx0) * 0.5, sy0 + (sy1 - sy0) * 0.5)
      som.addColorStop(0, 'rgba(0,0,0,.26)'); som.addColorStop(1, 'rgba(0,0,0,0)')
      g.fillStyle = som; g.beginPath(); g.moveTo(sx0, sy0); g.lineTo(sx0 + (sx1 - sx0) * (deitado ? 0.5 : 0.95), sy0); g.lineTo(sx0, sy0 + (sy1 - sy0) * (deitado ? 0.9 : 0.55)); g.closePath(); g.fill()
      // linhas
      g.strokeStyle = 'rgba(255,255,255,.9)'; g.lineWidth = Math.max(1.5, S * 0.35)
      g.strokeRect(...rect(0, 0, W, L))
      { const [ax, ay] = tr(0, L / 2), [bx, by] = tr(W, L / 2); g.beginPath(); g.moveTo(ax, ay); g.lineTo(bx, by); g.stroke() }
      { const [mx, my] = tr(34, L / 2); g.beginPath(); g.arc(mx, my, 9.15 * S, 0, 7); g.stroke(); g.beginPath(); g.arc(mx, my, Math.max(1.5, S * 0.3), 0, 7); g.fillStyle = '#fff'; g.fill() }
      for (const s of [1, -1]) {
        const y0 = s > 0 ? 0 : L
        g.strokeRect(...rect(13.85, s > 0 ? 0 : L - 16.5, 40.3, 16.5))
        g.strokeRect(...rect(24.85, s > 0 ? 0 : L - 5.5, 18.3, 5.5))
        const [mx, my] = tr(34, s > 0 ? 11 : L - 11)
        g.beginPath(); g.arc(mx, my, Math.max(1.5, S * 0.3), 0, 7); g.fill() // marca do pênalti
        // meia-lua: a parte do círculo de 9,15 m em volta da marca que fica FORA da grande área
        const a = Math.asin(5.5 / 9.15)
        const ang: [number, number] = deitado
          ? (s > 0 ? [-Math.PI / 2 + a, Math.PI / 2 - a] : [Math.PI / 2 + a, Math.PI * 1.5 - a])
          : (s > 0 ? [a, Math.PI - a] : [Math.PI + a, Math.PI * 2 - a])
        g.beginPath(); g.arc(mx, my, 9.15 * S, ang[0], ang[1]); g.stroke()
        for (const cxm of [0, W]) { const [ex, ey] = tr(cxm, y0); g.beginPath(); g.arc(ex, ey, 1 * S, 0, 7); g.stroke() } // escanteios
      }
      torcida(g, null, 0)
      bandeirao(g)
    }
    // ⏱️ relógio LISO: o campinho anda no tempo de verdade e só vai corrigindo, aos pouquinhos, pro minuto do placar
    let simMin = Math.max(0, jogo.t / SEG_POR_MIN), antes = performance.now()
    // 🟨 o juiz (só desenho): corre atrás do lance, uns metros atrás da bola, nunca em cima dela
    const juiz = { x: 34, y: L / 2 }
    // 🌠 rastro da bola nos passes longos e chutes
    const rastro: [number, number][] = []
    const quadro = () => {
      const { casa, fora, fechado, t } = vivo.current
      if (cartasDe[0] !== casa.cartas || cartasDe[1] !== fora.cartas) {
        cartasDe = [casa.cartas, fora.cartas]; cartaDe = new Map(); rostoDe.clear()
        for (const k of [...(casa.cartas ?? []), ...(fora.cartas ?? [])]) cartaDe.set(k.name, k)
      }
      const agora = performance.now(), dt = Math.min(250, agora - antes); antes = agora
      const r = relogio.current
      const alvo = Math.min(r.min + 1.25, r.min + (agora - r.em) / msPorMin)
      let m = simMin + dt / msPorMin
      // 🏁 no apito final o relógio para, mas a simulação ainda anda uns segundos: é o que fecha a festa de um gol nos
      // acréscimos (Diego 20/10: *"mascote travado"* — o GOL do 90+2' ficava aberto pra sempre com o jogo congelado em 93')
      if (fechado) m = Math.max(93.5, simMin + dt / msPorMin) // (o motor congela sozinho quando não sobra nada pendente)
      else if (Math.abs(alvo - m) > 2.5) m = alvo // pulou de verdade (voltou pra tela, trocou a velocidade): vai direto
      else m += (alvo - m) * Math.min(1, dt / 500)
      simMin = Math.max(simMin, m)
      jogo.avancaAte(simMin)
      if (jogo.narra !== ult.narra) { ult.narra = jogo.narra; setNarra(jogo.narra) }
      if (jogo.placar[0] !== ult.placar[0] || jogo.placar[1] !== ult.placar[1]) { ult.placar = [jogo.placar[0], jogo.placar[1]]; setPlacarV(ult.placar) }
      const fk = jogo.festa ? `${jogo.festa.lado}|${jogo.festa.autor}|${jogo.festa.min}` : ''
      if (fk !== ult.festa) { ult.festa = fk; setFesta(jogo.festa ? { lado: jogo.festa.lado, autor: jogo.festa.autor, assist: jogo.festa.assist, min: jogo.festa.min } : null) }
      const e = jogo.entre, mis = (a: number | undefined, b: number) => a == null ? b : a + (b - a) * e
      // 🟩 o fundo parado vem pronto do cache; por cima, só o que mexe
      cx.drawImage(fundo, 0, 0, CW, CH)
      if (jogo.festa) torcida(cx, jogo.festa.lado, jogo.t) // 🎉 no gol a torcida de quem fez pula
      placasLaterais(cx, Math.floor(Date.now() / PLACA_MS))
      // 🥅 os gols, com a rede que balança quando a bola entra
      for (const [y0, s] of [[0, 1], [L, -1]] as const) {
        const g = jogo.rede && jogo.rede.y0 === y0 ? Math.sin((jogo.t - jogo.rede.t0) * 30) * 0.9 * Math.max(0, 1 - (jogo.t - jogo.rede.t0)) : 0
        const [x, y, w, h] = rect(30.34, s > 0 ? -2.2 - g : L, 7.32, 2.2 + g)
        cx.fillStyle = 'rgba(255,255,255,.35)'; cx.fillRect(x, y, w, h)
        cx.lineWidth = Math.max(2, S * 0.5); cx.strokeStyle = '#fff'; cx.strokeRect(x, y, w, h)
        cx.strokeStyle = 'rgba(255,255,255,.4)'; cx.lineWidth = 1
        for (let i = 1; i < 4; i++) { cx.beginPath(); if (deitado) { cx.moveTo(x + (w * i) / 4, y); cx.lineTo(x + (w * i) / 4, y + h) } else { cx.moveTo(x, y + (h * i) / 4); cx.lineTo(x + w, y + (h * i) / 4) } cx.stroke() }
      }
      // 🧢 os técnicos na beira do campo, com o balão
      const fala = (lado: 0 | 1): string => {
        if (jogo.festa) return jogo.festa.lado === lado ? t('🙌 É GOL!', '🙌 GOAL!') : t('🤦 Não acredito…', '🤦 Unbelievable…')
        if (jogo.t < 4.5) { const tac = jogo.tatica[lado]; return tac > 0 ? t('🔥 Pra cima!', '🔥 Attack!') : tac < 0 ? t('🧱 Fecha a casinha!', '🧱 Shut up shop!') : t('⚖️ Toca a bola!', '⚖️ Keep the ball!') }
        return ''
      }
      for (const [lado, tec, yy] of [[0, casa.tecnico, L * 0.72], [1, fora.tecnico, L * 0.28]] as const) {
        if (!tec) continue
        const RR = Math.max(7, S * 1.5), camisa = lado === 0 ? corCasa : corFora
        const [X, Y] = deitado ? tr(W + PADT * 0.55, yy) : tr(-PADX * 0.42, yy)
        cx.fillStyle = 'rgba(0,0,0,.55)'; cx.fillRect(X - RR - 3, Y - RR - 3, (RR + 3) * 2, (RR + 3) * 2) // a área técnica
        cx.beginPath(); cx.arc(X, Y, RR, 0, 7); cx.fillStyle = '#1b1b1b'; cx.fill(); cx.lineWidth = 2.5; cx.strokeStyle = camisa; cx.stroke()
        cx.font = `${Math.round(RR * 1.1)}px sans-serif`; cx.textAlign = 'center'; cx.fillText('🧢', X, Y + RR * 0.4)
        const nm = nomeLimpo(tec).split(' ').slice(-1)[0].toUpperCase()
        if (deitado) { cx.font = fonte(Math.max(8, S * 0.95)); cx.fillStyle = '#fff'; cx.textAlign = 'center'; cx.fillText(nm, X, Y + RR + S * 1.1) }
        else { cx.save(); cx.translate(X, Y + RR + 4); cx.rotate(-Math.PI / 2); cx.font = fonte(Math.max(8, S * 1.25)); cx.textAlign = 'right'; cx.fillStyle = '#fff'; cx.fillText(nm, 0, 4); cx.restore() }
        const f = fala(lado)
        if (f) {
          cx.font = fonte(Math.max(9, S * 1.4)); const w = cx.measureText(f).width + 10, bx0 = deitado ? X + RR + 4 : X - RR, by0 = deitado ? Y - 9 : Y - RR - 22
          cx.fillStyle = '#fff'; cx.strokeStyle = INK; cx.lineWidth = 2; cx.beginPath(); cx.roundRect?.(bx0, by0, w, 17, 6); cx.fill(); cx.stroke()
          cx.fillStyle = INK; cx.textAlign = 'left'; cx.fillText(f, bx0 + 5, by0 + 12.5)
        }
      }
      // 🟨 o juiz segue o lance (uns 9 m atrás da bola, pro lado do meio), com inércia
      {
        const bx0 = mis(jogo.bolaAnt.x, jogo.bola.x), by0 = mis(jogo.bolaAnt.y, jogo.bola.y)
        const ax = bx0 + (34 - bx0) * 0.45, ay = by0 + (L / 2 - by0) * 0.22
        const k = Math.min(1, dt / 900); juiz.x += (ax - juiz.x) * k; juiz.y += (ay - juiz.y) * k
        const [X, Y] = tr(juiz.x, juiz.y), RJ = R * 0.8
        cx.beginPath(); cx.ellipse(X, Y + RJ - 1, RJ * 0.8, 3, 0, 0, 7); cx.fillStyle = 'rgba(0,0,0,.25)'; cx.fill()
        cx.beginPath(); cx.arc(X, Y, RJ, 0, 7); cx.fillStyle = '#111'; cx.fill(); cx.lineWidth = 2; cx.strokeStyle = '#FFE600'; cx.stroke()
        cx.fillStyle = '#FFE600'; cx.font = fonte(RJ * 0.9, 800); cx.textAlign = 'center'; cx.fillText('J', X, Y + RJ * 0.35)
      }
      // 🌠 rastro: só quando a bola está viajando (passe/chute); some sozinho
      if (jogo.bola.voo) { rastro.push([jogo.bola.x, jogo.bola.y]); if (rastro.length > 9) rastro.shift() } else if (rastro.length) rastro.shift()
      if (rastro.length > 1) {
        cx.lineCap = 'round'
        for (let i = 1; i < rastro.length; i++) { const [ax, ay] = tr(...rastro[i - 1]), [bx1, by1] = tr(...rastro[i]); cx.strokeStyle = `rgba(255,255,255,${(0.08 + (0.5 * i) / rastro.length).toFixed(2)})`; cx.lineWidth = 1 + (3.5 * i) / rastro.length; cx.beginPath(); cx.moveTo(ax, ay); cx.lineTo(bx1, by1); cx.stroke() }
      }
      // 🧍 os 22 (de trás pra frente na tela)
      const ordem = [...jogo.atl].sort((a, b) => tr(a.x, a.y)[1] - tr(b.x, b.y)[1])
      for (const p of ordem) {
        const [X, Y] = tr(mis(p.ax, p.x), mis(p.ay, p.y))
        const camisa = p.lado === 0 ? corCasa : corFora, tinta = claro(camisa) ? INK : '#fff'
        const correndo = p.ax != null && Math.hypot(p.x - p.ax, p.y - p.ay!) > 0.02
        const passo = correndo ? Math.sin(jogo.t * 14 + p.bx) : 0
        cx.beginPath(); cx.ellipse(X, Y + R - 2, R * 0.9, 3.5, 0, 0, 7); cx.fillStyle = 'rgba(0,0,0,.25)'; cx.fill()
        // 👟 pezinhos (alternam quando corre)
        cx.fillStyle = INK
        cx.beginPath(); cx.ellipse(X - R * 0.4, Y + R - 1 + passo * 1.5, R * 0.3, R * 0.18, 0, 0, 7); cx.fill()
        cx.beginPath(); cx.ellipse(X + R * 0.4, Y + R - 1 - passo * 1.5, R * 0.3, R * 0.18, 0, 0, 7); cx.fill()
        let im = rostoDe.get(p.nome)
        if (im === undefined) { im = rosto(cartaDe.get(p.nome) ?? p.carta); rostoDe.set(p.nome, im) } // procura o rosto 1 vez por jogador, não a cada quadro
        const temRosto = !!(im && im.complete && im.naturalWidth)
        cx.save(); cx.beginPath(); cx.arc(X, Y, R, 0, 7); cx.closePath(); cx.fillStyle = camisa; cx.fill(); cx.clip()
        if (temRosto) { cx.fillStyle = '#fff'; cx.fillRect(X - R, Y - R, R * 2, R * 2); cx.drawImage(im!, im!.naturalWidth * 0.29, im!.naturalHeight * 0.02, im!.naturalWidth * 0.42, im!.naturalWidth * 0.42, X - R, Y - R, R * 2, R * 2) }
        else {
          // 👕 a camisa: ombros/gola mais escuros e o número
          cx.fillStyle = 'rgba(0,0,0,.22)'; cx.fillRect(X - R, Y - R, R * 2, R * 0.48)
          cx.fillStyle = tinta; cx.font = fonte(R * 1.05, 800); cx.textAlign = 'center'; cx.fillText(String(numero.get(p) ?? ''), X, Y + R * 0.42)
        }
        cx.restore()
        cx.beginPath(); cx.arc(X, Y, R, 0, 7); cx.lineWidth = temRosto ? 3.5 : 2; cx.strokeStyle = temRosto ? camisa : INK; cx.stroke()
        if (temRosto) { cx.beginPath(); cx.arc(X, Y, R + 2.2, 0, 7); cx.lineWidth = 1.5; cx.strokeStyle = '#fff'; cx.stroke() }
        if (p === jogo.bola.dono) {
          cx.beginPath(); cx.arc(X, Y, R + 3.5, 0, 7); cx.lineWidth = 2; cx.strokeStyle = 'rgba(255,255,255,.95)'; cx.setLineDash([4, 3]); cx.stroke(); cx.setLineDash([])
          cx.fillStyle = '#fff'; cx.beginPath(); cx.moveTo(X, Y - R - 7); cx.lineTo(X - 5, Y - R - 14); cx.lineTo(X + 5, Y - R - 14); cx.closePath(); cx.fill()
        }
        if (p.nome) {
          const nm = p.nome.length > 13 ? p.nome.split(' ').slice(-1)[0] : p.nome
          cx.font = fonte(Math.max(8, R * 0.72)); const w = cx.measureText(nm).width + 6
          cx.fillStyle = 'rgba(0,0,0,.6)'; cx.fillRect(X - w / 2, Y + R + 1, w, R * 0.95); cx.fillStyle = '#fff'; cx.textAlign = 'center'; cx.fillText(nm, X, Y + R + R * 0.78)
        }
      }
      // ⚽ a bola (com sombra; sobe quando é cruzamento/chute alto)
      const bA = jogo.bolaAnt, [bx, by] = tr(mis(bA.x, jogo.bola.x), mis(bA.y, jogo.bola.y)), bh = mis(bA.h, jogo.bola.h) * S
      cx.beginPath(); cx.ellipse(bx, by + 2, 4, 2, 0, 0, 7); cx.fillStyle = 'rgba(0,0,0,.35)'; cx.fill()
      cx.beginPath(); cx.arc(bx, by - bh, 4.2 + jogo.bola.h * 0.25, 0, 7); cx.fillStyle = '#fff'; cx.fill(); cx.lineWidth = 1.5; cx.strokeStyle = '#111'; cx.stroke()
      raf = requestAnimationFrame(quadro)
    }
    raf = requestAnimationFrame(quadro)
    return () => cancelAnimationFrame(raf)
  }, [jogo, larg, deitado, corCasa, corFora, msPorMin])

  const time = festa ? (festa.lado === 0 ? casa : fora) : null
  const altPlaca = Math.max(22, Math.round(larg / 16))
  return (
    <div ref={caixa} style={{ marginBottom: 10 }}>
      <div style={{ position: 'relative', width: larg, margin: '0 auto', border: `3px solid ${INK}`, borderRadius: 14, overflow: 'hidden', boxShadow: `3px 3px 0 ${INK}`, background: '#1b232c' }}>
        {!deitado && <PlacaGol lado="cima" alt={altPlaca} />}
        <div style={{ position: 'relative' }}>
          <canvas ref={cv} style={{ display: 'block' }} />
          {/* 📺 o "selo da TV": placar e minuto do que o campinho JÁ mostrou (o placar só muda quando a bola entra) */}
          <div style={{ position: 'absolute', left: 8, top: 8, ...OSW, fontSize: deitado ? 15 : 12, background: INK, color: '#fff', border: '2px solid #fff', borderRadius: 8, padding: deitado ? '3px 10px' : '2px 8px', display: 'flex', gap: 6, alignItems: 'center', pointerEvents: 'none' }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: corCasa, border: '1px solid #fff' }} />{sigla(casa.nome)} <b style={{ color: GOLD }}>{placarV[0]} × {placarV[1]}</b> {sigla(fora.nome)}<span style={{ width: 8, height: 8, borderRadius: 2, background: corFora, border: '1px solid #fff' }} /><span style={{ opacity: .8 }}>{fechado ? t('FIM', 'FT') : `${Math.min(90, minuto)}'`}</span>
          </div>
        </div>
        {!deitado && <PlacaGol lado="baixo" alt={altPlaca} />}
        {festa && time && (
          // ⚽ o GOL: mascote grande (quem tem) ou GOOOL + escudo; embaixo a faixinha do autor — o mesmo teatro uma vez só
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.5)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, animation: 'c2dEntra .3s ease' }}>
            <style>{'@keyframes c2dEntra{from{opacity:0}to{opacity:1}}@keyframes c2dQuica{0%{transform:translateX(220px) rotate(10deg)}55%{transform:translateX(0) rotate(0)}70%{transform:translateY(-14px)}85%{transform:translateY(0)}100%{transform:translateY(-6px)}}'}</style>
            <div style={{ ...OSW, fontSize: Math.round(Math.min(larg, 520) / 6.5), color: GOLD, textShadow: `4px 4px 0 ${INK}`, lineHeight: 1 }}>{t('GOOOOL!', 'GOOOAL!')}</div>
            <div style={{ animation: 'c2dQuica .9s cubic-bezier(.3,1.4,.5,1)', transform: 'scale(1.15)' }}>{time.mascote ?? time.escudo ?? null}</div>
            <div style={{ ...OSW, fontSize: 18, background: '#fff', color: INK, border: `3px solid ${INK}`, borderRadius: 12, padding: '2px 12px', boxShadow: `3px 3px 0 ${INK}`, whiteSpace: 'nowrap', maxWidth: '92%', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              ⚽ {festa.autor.toUpperCase()} {festa.min > 90 ? `90+${festa.min - 90}` : festa.min}'{festa.assist ? `  ·  🅰️ ${festa.assist}` : ''}
            </div>
          </div>
        )}
      </div>
      {narra && !semNarra && (
        <div style={{ maxWidth: larg, margin: '8px auto 0', background: '#fff', color: INK, border: `3px solid ${INK}`, borderRadius: 12, padding: '7px 10px', fontSize: 13, fontWeight: 700, lineHeight: 1.3 }}
          dangerouslySetInnerHTML={{ __html: '🎙️ ' + narra }} />
      )}
    </div>
  )
}

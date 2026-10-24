import {ancorarMinutoCampo,passoRelogioCampo,suspenderRelogioCampo} from './campo2d-relogio'
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
import { campoNaTela } from './campo2d-modo'
import { climaDoJogo, noiteDoJogo, type Clima } from './campo2d-clima'
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Jogo2D, eventosDoJogo, W, L, SEG_POR_MIN, type Atleta, type CartaCampo } from './campo2d-motor'
import { chancesDoJogo, sementeDasChances, quemFinalizou } from './chances'
import { avatarLote1 } from './avatar-lote1'
import { useT } from './lang'
import { PlacaGol } from './patrocinio-visual' // 🏟️ as MESMAS placas atrás dos gols do campinho do jogo (Vadico · Tidex, trocando)
import { placasDoCampo, tamanhoMarcaNaPlaca, type PlacaCampo } from './patrocinio'
import { nomeLimpo } from './escudos'

const clamp=(value:number,min:number,max:number)=>Math.min(max,Math.max(min,value))
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
  casa: { nome: string; cor: string; cartas?: CartaCampo[]; mascote?: ReactNode | null; escudo?: ReactNode; tecnico?: string | null; /** 🧑‍💼 o busto do presidente (imagem) — na beira do campo, ao lado do técnico */ presidente?: string | null; /** 📐 a formação que o técnico escolheu (escala os 11 quando o elenco tem mais) */ formacao?: string; /** 🔁 o time do 2º TEMPO (carreira: troca no intervalo) */ cartas2?: CartaCampo[] }
  fora: { nome: string; cor: string; cartas?: CartaCampo[]; mascote?: ReactNode | null; escudo?: ReactNode; tecnico?: string | null; /** 🧑‍💼 o busto do presidente (imagem) — na beira do campo, ao lado do técnico */ presidente?: string | null; /** 📐 a formação que o técnico escolheu (escala os 11 quando o elenco tem mais) */ formacao?: string; /** 🔁 o time do 2º TEMPO (carreira: troca no intervalo) */ cartas2?: CartaCampo[] }
  gols: Gol[]
  roundMs: number
  minuto: number // o minuto que o placar mostra (o relógio manda)
  pausado?: boolean
  fechado?: boolean
  tatica?: [number, number]
  /** o placar de baixo já tem a 📻 Rádio Legends narrando: aqui a faixa some (o mesmo texto não aparece duas vezes) */
  semNarra?: boolean
  /** 🧪 MOTOR EXPERIMENTAL (v2, `motor2/`): só a bancada passa isto. Sem ele (todo o jogo), é o motor de sempre. */
  motorExperimental?: (seed: number, casa: CartaCampo[], fora: CartaCampo[], en: boolean, formacoes: [string?, string?], clima: Clima) => unknown
  /** Publish the sampled time to the map without changing the 2D playback. */
  onSimulationMinute?: (minute:number|null)=>void
  /** 🧪 só a bancada: força o clima (pras fotos) */
  climaForcado?: Clima
  /** 🧪 só a bancada: força o jogo de noite (pras fotos) */
  noiteForcada?: boolean
  /** 🏟️ o ESTÁDIO do mandante (carreira): gramado 0–100 (0 = terra da várzea, 100 = perfeito) e quanto da arquibancada tem gente
   *  (0–1). Sem isto (rápido, salas): o gramado perfeito e a casa cheia de sempre. */
  estadio?: { grama: number; lotacao: number }
  /** 🎬 replay dos gols depois do apito (só fora do online — Diego 21/10) */
  replay?: boolean
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

export function Campo2D({ roundKey, casa, fora, gols, roundMs, minuto, fechado, pausado, tatica, semNarra, motorExperimental, climaForcado, noiteForcada, estadio, replay, onSimulationMinute }: Campo2DProps) {
  const t = useT()
  useEffect(() => { campoNaTela(1); return () => campoNaTela(-1) }, []) // 📢 o telão da página se esconde: o deste campinho fica embaixo dele
  const cv = useRef<HTMLCanvasElement | null>(null)
  const caixa = useRef<HTMLDivElement | null>(null)
  const [larg, setLarg] = useState(360)
  const [narra, setNarra] = useState('')
  const [festa, setFesta] = useState<{ lado: 0 | 1; autor: string; assist?: string; min: number } | null>(null)
  const [placarV, setPlacarV] = useState<[number, number]>([0, 0])
  const ultimos = useRef({ narra: '', festa: '', placar: [-1, -1] as [number, number] })
  const deitado = larg >= DEITADO_A_PARTIR
  // 🌤️ o céu deste jogo (preso na semente: a sala inteira vê o mesmo) — ☀️ sombra atravessando · ☁️ luz chapada · 🌧️ chuva (rara)
  const clima = climaForcado ?? climaDoJogo(sementeDasChances(roundKey, casa.nome, fora.nome))
  // 🌙 de vez em quando o jogo é de noite, com os refletores acesos (preso na semente, como o clima)
  const noite = noiteForcada ?? noiteDoJogo(sementeDasChances(roundKey, casa.nome, fora.nome)) // ✅ aprovado pelo Diego (21/10)
  // 🌱🏟️ o estádio de quem joga em casa: o gramado melhora com as obras (terra → perfeito) e a torcida enche com as ampliações
  const gramaPct = clamp(estadio?.grama ?? 100, 0, 100) / 100
  const lotacao = clamp(estadio?.lotacao ?? 1, 0.04, 1)
  // 👕 camisas: o visitante troca pra 2ª cor quando bate com a do mandante
  const corCasa = casa.cor || '#C2452F'
  const corFora = perto(corCasa, fora.cor || '#2B6CFF') ? (claro(corCasa) ? '#1B1B1B' : '#F4F4F4') : (fora.cor || '#2B6CFF')
  // o jogo do campinho: um por rodada (mesma semente das chances → o que a rádio narra é o que o campinho mostra)
  const jogo = useMemo(() => {
    const seed = sementeDasChances(roundKey, casa.nome, fora.nome)
    if (motorExperimental) return motorExperimental(seed, casa.cartas ?? [], fora.cartas ?? [], t('pt', 'en') === 'en', [casa.formacao, fora.formacao], climaForcado ?? climaDoJogo(seed)) as Jogo2D
    const chances = chancesDoJogo(seed, gols, roundMs)
    const evs = eventosDoJogo(gols, chances, c => quemFinalizou(c.home ? casa.cartas : fora.cartas, { ...c, fim: 'fora' }, c.home ? casa.nome : fora.nome))
    return new Jogo2D(seed, casa.cartas ?? [], fora.cartas ?? [], evs, t('pt', 'en') === 'en', [casa.formacao, fora.formacao])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roundKey, casa.nome, fora.nome, roundMs])
  // 🔁 INTERVALO (carreira): o técnico mexeu no time → o 2º tempo re-simula. O campinho troca o futuro (gols novos) e, do 45'
  // em diante, joga com os 11 novos na formação nova. Sem mudança, nada acontece (assinatura igual).
  const golsSig = gols.map(g => `${g.min}${g.home ? 'h' : 'a'}${g.name}`).join('|')
  const golsSigAnt = useRef(golsSig)
  useEffect(() => {
    if (golsSigAnt.current === golsSig) return
    golsSigAnt.current = golsSig
    const seed = sementeDasChances(roundKey, casa.nome, fora.nome)
    const chances = chancesDoJogo(seed, gols, roundMs)
    jogo.trocaEventos?.(eventosDoJogo(gols, chances, c => quemFinalizou(c.home ? (casa.cartas2 ?? casa.cartas) : (fora.cartas2 ?? fora.cartas), { ...c, fim: 'fora' }, c.home ? casa.nome : fora.nome)))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [golsSig, jogo])
  useEffect(() => { golsSigAnt.current = golsSig }, [jogo]) // eslint-disable-line react-hooks/exhaustive-deps
  const segundoTempo = useRef<{ jogo: Jogo2D | null; casa: string; fora: string }>({ jogo: null, casa: '', fora: '' })
  if (minuto >= 45) {
    const st = segundoTempo.current
    if (st.jogo !== jogo) { st.jogo = jogo; st.casa = ''; st.fora = '' }
    const sig = (cs?: CartaCampo[]) => (cs ?? []).map(c => c.name).join('|')
    if (casa.cartas2 && sig(casa.cartas2) !== st.casa) { st.casa = sig(casa.cartas2); if (st.casa !== sig(casa.cartas)) jogo.trocaTime?.(0, casa.cartas2, casa.formacao) }
    if (fora.cartas2 && sig(fora.cartas2) !== st.fora) { st.fora = sig(fora.cartas2); if (st.fora !== sig(fora.cartas)) jogo.trocaTime?.(1, fora.cartas2, fora.formacao) }
  }
  if (tatica) jogo.tatica = tatica
  // ⏱️ o minuto do placar chega inteiro; aqui ele vira contínuo (até o próximo inteiro) pro campinho andar liso
  const msPorMin = Math.max(400, roundMs * 0.82) / 93
  // 🐌 FIM DA CÂMERA LENTA (Diego 20/10: *"do nada a bola fica em câmera lenta"*): o campinho calculava o ritmo pela duração
  // do jogo, mas o relógio de cima nem sempre anda nesse ritmo (a Copa da carreira conta 90' no tempo de 93', o online chega
  // pela rede aos trancos). Com o relógio um pouco mais lento, o campinho encostava no limite e ia FREANDO até o minuto
  // seguinte — câmera lenta. Agora ele MEDE o ritmo de verdade nos próprios tiques do relógio e anda nele.
  const relogio = useRef({ min: 0, em: performance.now(), ms: msPorMin })
  useEffect(() => { relogio.current.ms = msPorMin }, [msPorMin, roundKey])
  useEffect(() => {
    relogio.current = ancorarMinutoCampo(relogio.current,minuto,performance.now())
  }, [minuto])
  // 🐢 ANTI-TRAVADA (20/10, Diego: *"o jogo dando umas travadas com a bola rolando"*): o placar re-renderiza a cada minuto e
  // mandava arrays/objetos novos — o desenho REINICIAVA (canvas zerado, tudo recalculado). Agora o que muda sem mudar o jogo
  // (elenco, técnico, apito, idioma) é lido daqui, e o desenho só reinicia quando muda o JOGO, o tamanho ou as cores.
  // 🎬 REPLAY DOS GOLS (21/10, Diego: *"só se tocar um botão verde… não funciona nos modos online"*): o campinho guarda os
  // últimos ~8 s de lance; quando sai gol, a fita daquele gol fica salva. Depois do apito aparece o botão — e só toca se apertar.
  type Quadro = { t: number; b: [number, number, number]; a: number[] }
  const fita = useRef<{ de: unknown; atual: Quadro[]; gols: { autor: string; min: number; quadros: Quadro[] }[] }>({ de: null, atual: [], gols: [] })
  const vendo = useRef<{ i: number; ini: number } | null>(null)
  const [temReplay, setTemReplay] = useState(false)
  const [replayNa, setReplayNa] = useState<{ autor: string; min: number } | null>(null)
  useEffect(()=>()=>onSimulationMinute?.(null),[onSimulationMinute])
  const vivo = useRef({ casa, fora, fechado, pausado, t, onSimulationMinute })
  vivo.current = { casa, fora, fechado, pausado, t, onSimulationMinute }

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
    // 🛟 24/10: campinho ESCONDIDO (aba Clube/Central com o jogo rolando por trás) mede 0 de largura — desenhar ali quebrava o
    // site inteiro ("drawImage… canvas com largura 0" na capa da noite). Escondido, não desenha; volta a desenhar ao aparecer.
    if (!(larg >= 20)) return
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
    // 🏟️ DIVISÃO DA TORCIDA (Diego 20/10: *"70% do time da casa… o lado esquerdo é completo da casa… separa com algo preto
    // como se fossem grades de separação… e aí vem a torcida do rival no canto superior direito"*): uma arquibancada é toda da
    // casa; na outra a rival fica na ponta de CIMA/DIREITA, atrás de uma grade preta. 60% de uma faixa = 30% do estádio.
    const FRACAO_RIVAL = 0.6
    // (em pé: a faixa da DIREITA, a rival em cima · deitado: a faixa de CIMA, a rival na direita)
    const faixaRival = deitado ? 0 : 1
    const ehRival = (fi: number, p: number) => fi === faixaRival && (deitado ? p > 1 - FRACAO_RIVAL : p < FRACAO_RIVAL)
    const torcida = (g: CanvasRenderingContext2D, festa: 0 | 1 | null, tt: number) => {
      faixaTorcida.forEach((f, fi) => {
        g.fillStyle = '#1b232c'; g.fillRect(f.x, f.y, f.w, f.h)
        const fileiras = 3, ao = deitado ? f.h : f.w, al = deitado ? f.w : f.h
        const n = Math.max(12, Math.round(al / (S * 1.35)))
        // a grade: um vão de ~1,6 m sem ninguém, com as barras pretas
        const corte = fi === faixaRival ? (deitado ? 1 - FRACAO_RIVAL : FRACAO_RIVAL) : -1, vao = (S * 1.6) / al
        for (let r = 0; r < fileiras; r++) {
          const base = (r + 0.5) / fileiras * ao
          g.fillStyle = r % 2 ? '#232c36' : '#1f2831'
          if (deitado) g.fillRect(f.x, f.y + base - ao / fileiras / 2, f.w, ao / fileiras); else g.fillRect(f.x + base - ao / fileiras / 2, f.y, ao / fileiras, f.h)
          for (let i = 0; i < n; i++) {
            const p = (i + 0.5) / n
            if (corte >= 0 && Math.abs(p - corte) < vao) continue // (ninguém em cima da grade)
            const ao2 = p * al + ((i * 7 + r * 3) % 5 - 2) * 0.6
            // 🏟️ casa vazia onde o estádio ainda não enche: o lugar sem ninguém vira cadeira (um quadradinho apagado)
            if (lotacao < 1 && ((Math.imul(i + 1, 0x9E3779B1) ^ Math.imul(r + 7, 0x85EBCA6B) ^ Math.imul(fi + 3, 0xC2B2AE35)) >>> 0) / 4294967296 >= lotacao) {
              const qx = deitado ? f.x + ao2 : f.x + base, qy = deitado ? f.y + base : f.y + ao2, q = Math.max(1.4, S * 0.34)
              g.fillStyle = 'rgba(120,135,150,.28)'; g.fillRect(qx - q, qy - q, q * 2, q * 2); continue
            }
            const rival = ehRival(fi, p)
            // 🎉 no gol pula a torcida DE QUEM FEZ (antes era um sorteio que misturava as duas)
            const pula = festa != null && (rival ? festa === 1 : festa === 0) && (i + r) % 2 === 0 ? Math.abs(Math.sin(tt * 9 + i + r)) * 2.5 : 0
            const px0 = deitado ? f.x + ao2 : f.x + base, py0 = deitado ? f.y + base - pula : f.y + ao2 - pula
            g.beginPath(); g.arc(px0, py0, Math.max(1.6, S * 0.42), 0, 7); g.fillStyle = rival ? corFora : corCasa; g.globalAlpha = 0.9; g.fill(); g.globalAlpha = 1
          }
        }
        if (corte >= 0) {
          // 🚧 a grade de separação: poste grosso nas pontas + barras finas, tudo preto
          const c = corte * al, w0 = vao * al * 1.6
          g.save(); g.fillStyle = '#05070a'
          if (deitado) {
            g.fillRect(f.x + c - w0 / 2, f.y, w0, f.h); g.fillStyle = '#3a434d'
            for (let k = 0; k <= 4; k++) g.fillRect(f.x + c - w0 / 2 + (k / 4) * (w0 - 1.5), f.y, k % 4 === 0 ? 2.5 : 1.2, f.h)
          } else {
            g.fillRect(f.x, f.y + c - w0 / 2, f.w, w0); g.fillStyle = '#3a434d'
            for (let k = 0; k <= 4; k++) g.fillRect(f.x, f.y + c - w0 / 2 + (k / 4) * (w0 - 1.5), f.w, k % 4 === 0 ? 2.5 : 1.2)
          }
          g.restore()
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
            const { w: lw, h } = tamanhoMarcaNaPlaca(alt, p.prop ?? 3, w - 10) // 📐 o padrão da Tidex (21/10)
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
      // 🌤️ a grama pelo clima: sol = verde vivo · nublado = um tom mais frio e chapado · chuva = escura e molhada
      const verde: [string, string] = clima === 'chuva' ? ['#22693a', '#277543'] : clima === 'nublado' ? ['#2b7f45', '#318c4e'] : ['#2a8542', '#32984e']
      // 🌱 O GRAMADO DAS OBRAS (21/10, Diego: *"se ele está na várzea começa um gramado marronzinho… cada vez que ele dá uma
      // melhorada no gramado, melhora mais, até ficar o gramado perfeito"*): a cor vai da terra batida (0%) pro verde (100%) e as
      // listras de corte só aparecem no gramado bem cuidado
      const terra: [string, string] = clima === 'chuva' ? ['#6b5131', '#735736'] : ['#8a6a3e', '#927244']
      const mistura = (a: string, b: string, k: number) => { const [r1, g1, b1] = rgb(a), [r2, g2, b2] = rgb(b); return '#' + [r1 + (r2 - r1) * k, g1 + (g2 - g1) * k, b1 + (b2 - b1) * k].map(v => Math.round(v).toString(16).padStart(2, '0')).join('') }
      const kv = Math.min(1, gramaPct * 1.15), listra = Math.max(0, (gramaPct - 0.45) / 0.55)
      const grama: [string, string] = [mistura(terra[0], verde[0], kv), mistura(terra[0], mistura(verde[0], verde[1], listra), kv)]
      g.fillStyle = grama[0]; g.fillRect(fx, fy, fw, fh)
      for (let i = 0; i < 14; i++) { const [x, y, w, h] = rect(-PADX, -PAD + (i * (L + PAD * 2)) / 14, W + PADX * 2, (L + PAD * 2) / 14 + 0.3); g.fillStyle = i % 2 ? grama[0] : grama[1]; g.fillRect(x, y, w, h) }
      if (gramaPct < 1) {
        // 🕳️ falhas de terra: muitas na várzea (mais no meio e nas áreas, onde se pisa mais), somem conforme o gramado melhora
        const falhas = Math.round((1 - gramaPct) * 34)
        for (let i = 0; i < falhas; i++) {
          const zona = i % 3, px = zona === 0 ? 34 + ((i * 29) % 30) - 15 : 12 + ((i * 37) % 44), py = zona === 0 ? L / 2 + ((i * 41) % 40) - 20 : zona === 1 ? 4 + ((i * 13) % 18) : L - 4 - ((i * 17) % 18)
          const [qx, qy] = tr(px, py)
          g.fillStyle = i % 2 ? terra[0] : terra[1]; g.globalAlpha = 0.55 + (1 - gramaPct) * 0.4
          g.beginPath(); g.ellipse(qx, qy, S * (1.4 + (i % 4) * 0.7), S * (0.8 + (i % 3) * 0.5), (i % 5) * 0.6, 0, 7); g.fill(); g.globalAlpha = 1
        }
      }
      const [sx0, sy0] = tr(0, 0), [sx1] = tr(W, 0), [, sy1] = tr(0, L)
      if (clima === 'sol' && !noite) {
        // ☀️ SOL: a sombra da arquibancada atravessa o gramado em diagonal (a borda dela é reta, como sombra de prédio)
        const kx = deitado ? 0.5 : 0.95, ky = deitado ? 0.9 : 0.55
        g.fillStyle = 'rgba(0,0,0,.22)'; g.beginPath(); g.moveTo(sx0, sy0); g.lineTo(sx0 + (sx1 - sx0) * kx, sy0); g.lineTo(sx0, sy0 + (sy1 - sy0) * ky); g.closePath(); g.fill()
        // e a parte iluminada ganha um brilho leve de sol
        const luz = g.createLinearGradient(sx1, sy1, sx0, sy0); luz.addColorStop(0, 'rgba(255,245,180,.10)'); luz.addColorStop(0.6, 'rgba(255,245,180,0)')
        g.fillStyle = luz; g.fillRect(fx, fy, fw, fh)
      } else if (clima === 'chuva') {
        // 🌧️ CHUVA: o campo todo um pouco mais escuro e uns reflexos d'água espalhados (poças)
        g.fillStyle = 'rgba(10,20,40,.18)'; g.fillRect(fx, fy, fw, fh)
        for (let i = 0; i < 9; i++) { const px = 6 + ((i * 37) % 56), py = 8 + ((i * 53) % 89); const [qx, qy] = tr(px, py); g.fillStyle = 'rgba(200,220,255,.08)'; g.beginPath(); g.ellipse(qx, qy, S * (2.2 + (i % 3)), S * 1.1, 0, 0, 7); g.fill() }
      } else {
        // ☁️ NUBLADO: luz chapada, sem sombra — só um cinza leve por cima
        g.fillStyle = 'rgba(120,130,150,.08)'; g.fillRect(fx, fy, fw, fh)
      }
      // linhas (na várzea a cal é mais fraquinha)
      g.strokeStyle = `rgba(255,255,255,${(0.62 + gramaPct * 0.28).toFixed(2)})`; g.lineWidth = Math.max(1.5, S * 0.35)
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
      if (noite) {
        // 🌙 NOITE: uma capa de escuro por cima de tudo, com a luz dos 4 refletores "furando" a capa — onde a luz bate, o gramado
        // aparece com a cor de verdade; a arquibancada e o meio do céu ficam no escuro
        const cantos: [number, number][] = [tr(-3, -3), tr(W + 3, -3), tr(-3, L + 3), tr(W + 3, L + 3)]
        const capa = document.createElement('canvas'); capa.width = CW * dpr; capa.height = CH * dpr
        const k2 = capa.getContext('2d')!; k2.setTransform(dpr, 0, 0, dpr, 0, 0)
        k2.fillStyle = 'rgba(3,7,22,.80)'; k2.fillRect(0, 0, CW, CH)
        k2.globalCompositeOperation = 'destination-out'
        // o campo inteiro pega um pouco de luz (fica na penumbra, nunca na escuridão da arquibancada)…
        { const [gx, gy, gw, gh] = rect(-1, -1, W + 2, L + 2); k2.fillStyle = 'rgba(0,0,0,.42)'; k2.fillRect(gx, gy, gw, gh) }
        // …e perto de cada torre a luz é forte
        for (const [qx, qy] of cantos) {
          const luz = k2.createRadialGradient(qx, qy, 0, qx, qy, Math.max(CW, CH) * 0.5)
          luz.addColorStop(0, 'rgba(0,0,0,.85)'); luz.addColorStop(0.45, 'rgba(0,0,0,.35)'); luz.addColorStop(1, 'rgba(0,0,0,0)')
          k2.fillStyle = luz; k2.fillRect(0, 0, CW, CH)
        }
        g.drawImage(capa, 0, 0, CW, CH)
        // um calorzinho amarelado da lâmpada perto de cada torre
        for (const [qx, qy] of cantos) {
          const quente = g.createRadialGradient(qx, qy, 0, qx, qy, Math.max(CW, CH) * 0.28)
          quente.addColorStop(0, 'rgba(255,236,170,.22)'); quente.addColorStop(1, 'rgba(255,236,170,0)')
          g.fillStyle = quente; g.fillRect(0, 0, CW, CH)
        }
        for (const [qx, qy] of cantos) {
          // a torre: um poste com a placa de lâmpadas acesa
          g.fillStyle = '#0d1117'; g.fillRect(qx - S * 1.6, qy - S * 1.6, S * 3.2, S * 3.2)
          g.fillStyle = '#FFF6D0'; for (let k = 0; k < 4; k++) g.fillRect(qx - S * 1.05 + (k % 2) * S * 1.2, qy - S * 1.05 + Math.floor(k / 2) * S * 1.2, S * 0.9, S * 0.9)
        }
      }
    }
    // ⏱️ relógio LISO: o campinho anda no tempo de verdade e só vai corrigindo, aos pouquinhos, pro minuto do placar
    let simMin = Math.max(0, jogo.t / SEG_POR_MIN), antes = performance.now()
    // 🟨 o juiz (só desenho): corre atrás do lance, uns metros atrás da bola, nunca em cima dela
    const juiz = { x: 34, y: L / 2 }
    // 🌠 rastro da bola nos passes longos e chutes
    const rastro: [number, number][] = []
    const quadro = () => {
      const { casa, fora, fechado, pausado, t } = vivo.current
      if (cartasDe[0] !== casa.cartas || cartasDe[1] !== fora.cartas) {
        cartasDe = [casa.cartas, fora.cartas]; cartaDe = new Map(); rostoDe.clear()
        for (const k of [...(casa.cartas ?? []), ...(fora.cartas ?? [])]) cartaDe.set(k.name, k)
      }
      const agora = performance.now(), dt = Math.min(250, agora - antes); antes = agora
      if(pausado&&!fechado)relogio.current=suspenderRelogioCampo(relogio.current,simMin,agora)
      else simMin = passoRelogioCampo(simMin,dt,agora,relogio.current,!!fechado,msPorMin)
      const fi = fita.current
      if (fi.de !== jogo) { fi.de = jogo; fi.atual = []; fi.gols = []; vendo.current = null }
      const rv = vendo.current
      if (rv) {
        // 🎬 tocando a fita: os jogadores e a bola vão pra onde estavam (o jogo já acabou — o placar não muda)
        const g = fi.gols[rv.i], q0 = g?.quadros[0]
        const el = (agora - rv.ini) / 1000, qd = g && q0 ? g.quadros.find(q => q.t - q0.t >= el) : undefined
        if (!g || (!qd && el > (g.quadros[g.quadros.length - 1].t - q0!.t) + 1.4)) {
          const prox = rv.i + 1
          if (prox < fi.gols.length) { vendo.current = { i: prox, ini: agora }; setReplayNa({ autor: fi.gols[prox].autor, min: fi.gols[prox].min }) }
          else { vendo.current = null; setReplayNa(null) }
        } else if (qd) {
          jogo.atl.forEach((p, k) => { p.x = p.ax = qd.a[k * 2]; p.y = p.ay = qd.a[k * 2 + 1] })
          jogo.bola.x = jogo.bolaAnt.x = qd.b[0]; jogo.bola.y = jogo.bolaAnt.y = qd.b[1]; jogo.bola.h = jogo.bolaAnt.h = qd.b[2]
        }
      } else {
        jogo.avancaAte(simMin)
        vivo.current.onSimulationMinute?.(simMin)
        if (replay) {
          const ult2 = fi.atual[fi.atual.length - 1]
          if (!ult2 || jogo.t - ult2.t >= 0.08) {
            fi.atual.push({ t: jogo.t, b: [jogo.bola.x, jogo.bola.y, jogo.bola.h], a: jogo.atl.flatMap(p => [p.x, p.y]) })
            while (fi.atual.length && fi.atual[0].t < jogo.t - 8) fi.atual.shift()
          }
        }
      }
      if (jogo.narra !== ult.narra) { ult.narra = jogo.narra; setNarra(jogo.narra) }
      if (jogo.placar[0] !== ult.placar[0] || jogo.placar[1] !== ult.placar[1]) { ult.placar = [jogo.placar[0], jogo.placar[1]]; setPlacarV(ult.placar) }
      const fk = jogo.festa ? `${jogo.festa.lado}|${jogo.festa.autor}|${jogo.festa.min}` : ''
      if (fk !== ult.festa) {
        ult.festa = fk; setFesta(jogo.festa ? { lado: jogo.festa.lado, autor: jogo.festa.autor, assist: jogo.festa.assist, min: jogo.festa.min } : null)
        if (replay && jogo.festa && !vendo.current && fi.atual.length > 5) { fi.gols.push({ autor: jogo.festa.autor, min: jogo.festa.min, quadros: fi.atual.slice() }); setTemReplay(true) }
      }
      const e = jogo.entre, mis = (a: number | undefined, b: number) => a == null ? b : a + (b - a) * e
      // 🟩 o fundo parado vem pronto do cache; por cima, só o que mexe
      cx.drawImage(fundo, 0, 0, CW, CH)
      if (jogo.festa) torcida(cx, jogo.festa.lado, jogo.t) // 🎉 no gol a torcida de quem fez pula
      placasLaterais(cx, Math.floor(Date.now() / PLACA_MS))
      // 🌧️ a chuva caindo (riscos finos descendo, baratos: ~70 linhas por quadro)
      if (clima === 'chuva') {
        cx.strokeStyle = 'rgba(210,225,255,.35)'; cx.lineWidth = 1
        const tt = jogo.t * 1000, nR = 70
        cx.beginPath()
        for (let i = 0; i < nR; i++) { const px = ((i * 97 + tt * 0.03) % CW), py = ((i * 61 + tt * 0.55 + i * i) % (CH + 20)) - 10; cx.moveTo(px, py); cx.lineTo(px - 2, py + 9) }
        cx.stroke()
      }
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
      // 🧑‍💼 O PRESIDENTE NA BEIRA DO CAMPO (21/10, Diego: *"para quem tem um personagem"*): o boneco da conta, um pouco mais
      // pra frente na lateral que o técnico; no gol do time dele, pula de alegria
      for (const [lado, pres, yy] of [[0, vivo.current.casa.presidente, L * 0.6], [1, vivo.current.fora.presidente, L * 0.4]] as const) {
        const foto = pres ? img(pres) : null
        if (!foto || !foto.complete || !foto.naturalWidth) continue
        const RP = Math.max(9, S * 1.9), pula = jogo.festa && jogo.festa.lado === lado ? Math.abs(Math.sin(jogo.t * 9)) * RP * 0.6 : 0
        const [X, Y0] = deitado ? tr(W + PADT * 0.55, yy) : tr(-PADX * 0.42, yy), Y = Y0 - pula
        cx.save(); cx.beginPath(); cx.arc(X, Y, RP, 0, 7); cx.fillStyle = GOLD; cx.fill(); cx.clip(); cx.drawImage(foto, X - RP, Y - RP, RP * 2, RP * 2); cx.restore()
        cx.beginPath(); cx.arc(X, Y, RP, 0, 7); cx.lineWidth = 2.5; cx.strokeStyle = INK; cx.stroke()
        const rot = t('PRESIDENTE', 'PRESIDENT')
        if (deitado) { cx.font = fonte(Math.max(7, S * 0.8)); cx.fillStyle = GOLD; cx.textAlign = 'center'; cx.fillText(rot, X, Y + RP + S * 1.0) }
        else { cx.save(); cx.translate(X, Y + RP + 4); cx.rotate(-Math.PI / 2); cx.font = fonte(Math.max(7, S * 1.0)); cx.textAlign = 'right'; cx.fillStyle = GOLD; cx.fillText(rot, 0, 4); cx.restore() }
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
  }, [jogo, larg, deitado, corCasa, corFora, msPorMin, noite, gramaPct, lotacao])

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
      {replay && temReplay && fechado && !festa && (
        <div style={{ maxWidth: larg, margin: '8px auto 0', display: 'flex', justifyContent: 'center' }}>
          {replayNa
            ? <div style={{ ...OSW, background: INK, color: GOLD, border: `3px solid ${INK}`, borderRadius: 12, padding: '6px 14px' }}>🎬 {t('REPLAY', 'REPLAY')} · ⚽ {replayNa.autor} {replayNa.min > 90 ? `90+${replayNa.min - 90}` : replayNa.min}'</div>
            : <button onClick={() => { const g = fita.current.gols[0]; if (!g) return; vendo.current = { i: 0, ini: performance.now() }; setReplayNa({ autor: g.autor, min: g.min }) }}
                style={{ ...OSW, background: '#1B7A3D', color: '#fff', border: `3px solid ${INK}`, borderRadius: 12, padding: '7px 16px', boxShadow: `3px 3px 0 ${INK}`, cursor: 'pointer', fontSize: 15 }}>
                🎬 {t('VER OS GOLS DE NOVO', 'WATCH THE GOALS AGAIN')}
              </button>}
        </div>
      )}
      {narra && !semNarra && (
        <div style={{ maxWidth: larg, margin: '8px auto 0', background: '#fff', color: INK, border: `3px solid ${INK}`, borderRadius: 12, padding: '7px 10px', fontSize: 13, fontWeight: 700, lineHeight: 1.3 }}
          dangerouslySetInnerHTML={{ __html: '🎙️ ' + narra }} />
      )}
    </div>
  )
}

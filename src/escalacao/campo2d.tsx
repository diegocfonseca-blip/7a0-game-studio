import type { DisputaPenaltisCampo } from './campo2d-penaltis'
import {desenharMarcadorCampo2D,desenharNomeCampo2D} from './campo2d-marcador'
import {demandaSuperficieCampo2D,publicarSuperficieCampo2D,soltarSuperficieCampo2D,motorCompartilhadoCampo2D} from './campo2d-superficie'
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
import { camisasDoJogo } from './camisas-2d'
import { kitDoTime } from './camisas-2d-dados'
import { CARIMBO_GOL } from './mascotes'
import { climaDoJogo, noiteDoJogo, type Clima } from './campo2d-clima'
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Jogo2D, eventosDoJogo, W, L, SEG_POR_MIN, type Atleta, type CartaCampo } from './campo2d-motor'
import { chancesDoJogo, sementeDasChances, quemFinalizou } from './chances'
import { avatarLote1 } from './avatar-lote1'
import { useT } from './lang'
import { PlacaGol } from './patrocinio-visual' // 🏟️ as MESMAS placas atrás dos gols do campinho do jogo (Vadico · Tidex, trocando)
import { placasDoCampo, tamanhoMarcaNaPlaca, type PlacaCampo } from './patrocinio'
import { estiloPisca, gritoGol } from './radio-pisca' // 📻 a faixa pisca no gol (26/10)
import { nomeLimpo } from './escudos'
import { useCampo2DLiberado, useCampo2DTester } from './sport'
import { pousoDaBola, velocidadeBola, ehBomba, golDeLonge, balancoRede, tremorTrave, vitimaDoChapeu, alturaQuique, QUIQUE_DUR, esticaGoleiro, riscoCarrinho, casaAtacando, type BolaVista } from './campo2d-efeitos'
import { playTrave } from './sound'
import { criaRastro, pontoRastro, rastroVisivel, arteBolinhaRastro, criaNomeNaBola } from './campo2d-apresentacao'
import { FestaGolCampo2D, publicarFestaCampo2D, publicarTelaoCampo2D } from './campo2d-festa'
import { alvoBandeirinhas, sinalDaBandeira, desenhaFotografos, desenhaBandeira, arredoresParaMapa, type CenaArredores } from './campo2d-arredores'
import { criaColetorCampo2D, fraseQuase, QUASE_FAIXA_MS, QUASE_ANEL_MS, type QuaseCampo2D, type ResumoCampo2D } from './campo2d-resumo'
import { ResumoApitoCampo2D, BotaoReplayCampo2D, publicarApitoCampo2D, publicarQuaseCampo2D, QUASE_CSS, estiloQuase, type ReplayCampo2D } from './campo2d-resumo-ui'

const clamp=(value:number,min:number,max:number)=>Math.min(max,Math.max(min,value))
const INK = '#0C0C0C', GOLD = '#FFC400'
const EFEITOS_LANCE_GERAL = true
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
  disputaPenaltis?: DisputaPenaltisCampo
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
  /** Same canvas on the private map; never starts another simulation. */
  mapMatchId?:string
  mapOnly?:boolean
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
const chaveMascoteFixa = (n: string): string | undefined => CARIMBO_GOL[n]
const sigla = (nome: string) => nomeLimpo(nome).replace(/[^A-Za-zÀ-ú ]/g, '').trim().slice(0, 3).toUpperCase()
const IMGS = new Map<string, HTMLImageElement>()
function img(src: string): HTMLImageElement {
  let im = IMGS.get(src)
  if (!im) { im = new Image(); im.crossOrigin = 'anonymous'; im.src = src; IMGS.set(src, im) }
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

export function Campo2D({ roundKey, casa, fora, gols, roundMs, minuto, fechado, pausado, tatica, semNarra, motorExperimental, climaForcado, noiteForcada, estadio, replay, onSimulationMinute, mapMatchId, mapOnly, disputaPenaltis }: Campo2DProps) {
  const t = useT()
  useEffect(() => { if(mapOnly)return;campoNaTela(1); return () => campoNaTela(-1) }, [mapOnly]) // 📢 o telão da página se esconde: o deste campinho fica embaixo dele
  const cv = useRef<HTMLCanvasElement | null>(null)
  const caixa = useRef<HTMLDivElement | null>(null)
  const [larg, setLarg] = useState(360)
  const [narra, setNarra] = useState('')
  const [placarPenV, setPlacarPenV] = useState<[number,number]|null>(null)
  const [festa, setFesta] = useState<{ lado: 0 | 1; autor: string; assist?: string; min: number } | null>(null)
  const [placarV, setPlacarV] = useState<[number, number]>([0, 0])
  // 📻 26/10: no gol a faixa do locutor pisca (igual à rádio do placar cinema), na cor de quem marcou ⇄ creme —
  // e para JUNTO com a festa do gol (Diego: *"quando a mascote sai… o pisca para ao mesmo tempo"*)
  const piscaGol = festa ? { k: `${festa.lado}|${festa.autor}|${festa.min}`, lado: festa.lado } : null
  const ultimos = useRef({ narra: '', festa: '', placar: [-1, -1] as [number, number] })
  const deitado = larg >= DEITADO_A_PARTIR
  // 🌤️ o céu deste jogo (preso na semente: a sala inteira vê o mesmo) — ☀️ sombra atravessando · ☁️ luz chapada · 🌧️ chuva (rara)
  const clima = climaForcado ?? climaDoJogo(sementeDasChances(roundKey, casa.nome, fora.nome))
  // 🌙 de vez em quando o jogo é de noite, com os refletores acesos (preso na semente, como o clima)
  const noite = noiteForcada ?? noiteDoJogo(sementeDasChances(roundKey, casa.nome, fora.nome)) // ✅ aprovado pelo Diego (21/10)
  // 🌱🏟️ o estádio de quem joga em casa: o gramado melhora com as obras (terra → perfeito) e a torcida enche com as ampliações
  const gramaPct = clamp(estadio?.grama ?? 100, 0, 100) / 100
  const lotacao = clamp(estadio?.lotacao ?? 1, 0.04, 1)
  // 👕 camisas (06/11, Diego): batismo veste o MANTO · gente sem plano bege · Craque prata · Lenda dourado (a cor que já chega)
  // · bot a de hoje — e no choque o visitante troca pra 2ª cor do manto ou pra reserva branca/preta (regras em camisas-2d.ts)
  const kitCasaK = kitDoTime(casa.nome, casa.cor || '#C2452F', chaveMascoteFixa).join(','), kitForaK = kitDoTime(fora.nome, fora.cor || '#2B6CFF', chaveMascoteFixa).join(',')
  const [camCasa, camFora] = useMemo(() => camisasDoJogo(kitCasaK.split(','), kitForaK.split(',')), [kitCasaK, kitForaK])
  const corCasa = camCasa.cor, corFora = camFora.cor
  const listrasK = `${camCasa.listras.join(',')}|${camFora.listras.join(',')}`
  // o jogo do campinho: um por rodada (mesma semente das chances → o que a rádio narra é o que o campinho mostra)
  const jogo = useMemo(() => {
    const create=()=>{
    const seed = sementeDasChances(roundKey, casa.nome, fora.nome)
    if (motorExperimental) return motorExperimental(seed, casa.cartas ?? [], fora.cartas ?? [], t('pt', 'en') === 'en', [casa.formacao, fora.formacao], climaForcado ?? climaDoJogo(seed)) as Jogo2D
    const chances = chancesDoJogo(seed, gols, roundMs)
    const evs = eventosDoJogo(gols, chances, c => quemFinalizou(c.home ? casa.cartas : fora.cartas, { ...c, fim: 'fora' }, c.home ? casa.nome : fora.nome))
    return new Jogo2D(seed, casa.cartas ?? [], fora.cartas ?? [], evs, t('pt', 'en') === 'en', [casa.formacao, fora.formacao])
    }
    return mapMatchId?motorCompartilhadoCampo2D(mapMatchId,create):create()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roundKey, casa.nome, fora.nome, mapMatchId]) // ⏩ 07/11: SEM o roundMs — trocar a velocidade no meio não recria o jogo (antes voltava do 0')
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
  // 📊😱 04/11: o resumo do apito e o QUASE (regra em campo2d-resumo.ts; desenho em campo2d-resumo-ui.tsx — o MESMO no mapa)
  const coletor = useRef<{ de: unknown; c: ReturnType<typeof criaColetorCampo2D> }>({ de: null, c: criaColetorCampo2D() })
  const quaseVivo = useRef<{ q: QuaseCampo2D; desde: number } | null>(null)
  const [quase, setQuase] = useState<QuaseCampo2D | null>(null)
  const [resumo, setResumo] = useState<ResumoCampo2D | null>(null)
  useEffect(()=>()=>onSimulationMinute?.(null),[onSimulationMinute])
  // 🔒 04/11: o que foi IGUALADO com o campo do mapa (rastro do mapa, nome que segura) só aparece na conta liberada do 2D —
  // em sala 2D de outra pessoa o campinho segue exatamente como era (Diego: *"ninguém pode ver ainda"*).
  const igualMapa = useCampo2DLiberado()
  const tester2d = useCampo2DTester()
  // ✨ 07/11: efeitos de lance (trave · chapéu · onde a bola cai · goleiro voando · quique · risco do carrinho · torcida) — LIBERADOS PRA
  // TODOS no mesmo dia (*"publique tudo que falamos sobre o campo 2D"*). Voltar a ser só da conta do Diego: `useCampo2DTester()`.
  const efeitosLance = EFEITOS_LANCE_GERAL || tester2d
  const vivo = useRef({ casa, fora, fechado, pausado, t, onSimulationMinute, igualMapa, disputaPenaltis, nGols: gols.length, efeitosLance })
  vivo.current = { casa, fora, fechado, pausado, t, onSimulationMinute, igualMapa, disputaPenaltis, nGols: gols.length, efeitosLance }

  useEffect(() => {
    const el = caixa.current
    if (!el) return
    const mede = () => { const w = el.clientWidth; setLarg(w >= DEITADO_A_PARTIR ? Math.min(1100, w) : Math.min(460, w)) }
    const ro = new ResizeObserver(mede)
    ro.observe(el); mede()
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    let raf = 0,lastMapPaint=-Infinity
    const surfaceOwner={}
    const c = cv.current; if (!c) return
    // 🛟 24/10: campinho ESCONDIDO (aba Clube/Central com o jogo rolando por trás) mede 0 de largura — desenhar ali quebrava o
    // site inteiro ("drawImage… canvas com largura 0" na capa da noite). E NÃO pode parar: é este laço que anda o relógio do
    // jogo (parar aqui congelava a partida na aba Clube). Escondido, desenha num tamanho de reserva; ao aparecer, volta ao real.
    const largEf = larg >= 20 ? larg : 320
    const escondido = larg < 20
    // 📐 a GEOMETRIA: o motor pensa em pé (x 0–68 de largura, y 0–105 de comprimento, mandante ataca y→0). Em pé, a tela é o
    // motor; deitado, troca os eixos (o mandante ataca pra ESQUERDA). Todo desenho passa por `tr`/`rect`, nunca por conta solta.
    const S = deitado ? largEf / (L + PADL * 2) : largEf / (W + PADX * 2)
    const CW = largEf, CH = Math.round(deitado ? (W + PADT * 2) * S : (L + PAD * 2) * S)
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
    const torcida = (g: CanvasRenderingContext2D, festa: 0 | 1 | null, tt: number, leve = false) => {
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
            // (📣 07/11: `leve` = a casa atacando — pula 1 em cada 3, mais baixinho)
            const pula = festa != null && (rival ? festa === 1 : festa === 0) && (i + r) % (leve ? 3 : 2) === 0 ? Math.abs(Math.sin(tt * (leve ? 7 : 9) + i + r)) * (leve ? 1.6 : 2.5) : 0
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
        g.fillStyle = 'rgba(0,0,0,.09)'; g.beginPath(); g.moveTo(sx0, sy0); g.lineTo(sx0 + (sx1 - sx0) * kx, sy0); g.lineTo(sx0, sy0 + (sy1 - sy0) * ky); g.closePath(); g.fill()
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
    let simMin = Math.max(0, jogo.t / SEG_POR_MIN, mapMatchId?Math.min(93.5,minuto):0), antes = performance.now()
    // 🟨 o juiz (só desenho): corre atrás do lance, uns metros atrás da bola, nunca em cima dela
    const juiz = { x: 34, y: L / 2 }
    // 🚩 os dois bandeirinhas (só desenho): cada um numa lateral, na linha do penúltimo defensor da metade dele
    const auxs: [number, number][] = [[W + 0.6, L * 0.75], [-0.6, L * 0.25]]
    // 🌠 rastro da bola nos passes longos e chutes
    const rastro: [number, number][] = []
    // 🔁 04/11: o rastro do MAPA (o que o Diego gostou) — mesma regra e mesma bolinha de luz (campo2d-apresentacao.ts)
    const rastroMapa = criaRastro(), bolinha = arteBolinhaRastro(), nomeNaBola = criaNomeNaBola()
    // ✨ 07/11: memória dos efeitos de lance (só desenho; tempos em segundos DE JOGO, então pausar/acelerar acompanha)
    const fx = { ant: null as { x: number; y: number; t: number } | null, bomba: [] as [number, number][], saiu: null as { x: number; y: number; golY: number; t: number } | null,
      redeLonge: false, redeK: '', trave: null as { y0: number; t0: number; x: number } | null, chapeu: null as { a: Atleta; ate: number } | null,
      saida: null as { x: number; y: number; lado: 0 | 1 } | null, donoAnt: null as Atleta | null,
      hAnt: 0, quique: -1, voo: null as { lado: 0 | 1; x: number; t0: number } | null, riscos: [] as { x0: number; y0: number; x1: number; y1: number }[],
      narraAnt: '', iEv: 0, tempo: 0 as 0 | 1, nVoo: 0 }
    // 👁️ CAMADA SÓ DE DESENHO (04/11, Diego: *"os jogadores… a bola… o gramado"*). Nada aqui muda placar, motor ou o que o
    // mapa conta como resultado: é só ONDE o boneco e a bola aparecem na tela. (1) dois jogadores nunca ficam um em cima do
    // outro — quem encosta é afastado devagar; (2) quem conduz leva a bola À FRENTE, com toquinhos (antes ela ficava colada
    // no mesmo ponto do corpo, cara de robô); (3) a bola anda lisa entre o pé e o passe.
    const afasta = new Map<Atleta, { x: number; y: number; px: number; py: number; v: number }>()
    const bolaVis = { x: NaN, y: NaN }
    let tAnt = jogo.t
    const quadro = () => {
      const { casa, fora, fechado, pausado, t, igualMapa, disputaPenaltis } = vivo.current
      if (cartasDe[0] !== casa.cartas || cartasDe[1] !== fora.cartas) {
        cartasDe = [casa.cartas, fora.cartas]; cartaDe = new Map(); rostoDe.clear()
        for (const k of [...(casa.cartas ?? []), ...(fora.cartas ?? [])]) cartaDe.set(k.name, k)
      }
      const agora = performance.now(), dt = Math.min(250, agora - antes); antes = agora
      if(pausado&&!fechado)relogio.current=suspenderRelogioCampo(relogio.current,simMin,agora)
      else simMin = passoRelogioCampo(simMin,dt,agora,relogio.current,!!fechado,msPorMin)
      const fi = fita.current
      if (fi.de !== jogo) { fi.de = jogo; fi.atual = []; fi.gols = []; vendo.current = null }
      const col = coletor.current
      if (col.de !== jogo) { col.de = jogo; col.c = criaColetorCampo2D(); quaseVivo.current = null; setQuase(null); setResumo(null) }
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
        // 📊😱 só CONTA o que a tela mostrou (não sorteia nada, não mexe no jogo)
        col.c.passo(jogo as never)
        const nq = col.c.novoQuase()
        if (nq && igualMapa && !jogo.festa) { quaseVivo.current = { q: nq, desde: jogo.t }; setQuase(nq) }
        // 🔔 bola na TRAVE: o gol treme e toca o "TÓIN" + "uhhh" (só se o campinho está à vista)
        if (nq?.tipo === 'defesa' && vivo.current.efeitosLance && !jogo.festa) { fx.voo = { lado: (1 - nq.lado) as 0 | 1, x: nq.x, t0: jogo.t }; fx.nVoo++ } // 🧤 o goleiro VOA
        if (nq?.tipo === 'trave' && vivo.current.efeitosLance && !jogo.festa) { fx.trave = { y0: nq.y < L / 2 ? 0 : L, t0: jogo.t, x: nq.x }; if (!escondido) playTrave() }
        // 🏁 o resumo só depois do apito E de tudo que estava pendente (o gol dos acréscimos já entrou): nada de spoiler
        const m2 = (jogo as unknown as { fim?: boolean; stats?: unknown })
        if (igualMapa && fechado && !jogo.festa && simMin >= 93 && (m2.stats ? !!m2.fim : jogo.placar[0] + jogo.placar[1] >= vivo.current.nGols) && !col.c.feito) {
          col.c.feito = true; setResumo(col.c.resumo(jogo as never, [casa.cartas2 ?? casa.cartas, fora.cartas2 ?? fora.cartas]))
        }
        if (replay) {
          const ult2 = fi.atual[fi.atual.length - 1]
          if (!ult2 || jogo.t - ult2.t >= 0.08) {
            fi.atual.push({ t: jogo.t, b: [jogo.bola.x, jogo.bola.y, jogo.bola.h], a: jogo.atl.flatMap(p => [p.x, p.y]) })
            while (fi.atual.length && fi.atual[0].t < jogo.t - 8) fi.atual.shift()
          }
        }
      }
      // A disputa é só uma camada de apresentação após o apito. O motor e seu placar ficam intactos.
      disputaPenaltis?.preparar(jogo.atl, jogo.bola)
      const penalti = !rv ? disputaPenaltis?.quadro() : undefined
      const estadoPenalti = penalti ? disputaPenaltis!.estado : undefined
      const cena = penalti ? { ...jogo, t: disputaPenaltis!.elapsed, entre: 1,
        bola: { ...penalti.bola, dono: null, voo: null }, bolaAnt: penalti.bola, festa: null,
        rede: penalti.rede, narra: t(estadoPenalti!.mensagem, estadoPenalti!.mensagemEn) } : jogo
      if (cena.narra !== ult.narra) {
        ult.narra = cena.narra; setNarra(cena.narra)
        setPlacarPenV(estadoPenalti ? (disputaPenaltis!.config.invertido ? [estadoPenalti.placar[1], estadoPenalti.placar[0]] : estadoPenalti.placar) : null)
      }
      // 😱 o QUASE fica ~2,6 s DE JOGO na faixa (ou até sair um gol: a festa manda) — no tempo do jogo: pausou, ele espera; no 4×, passa rápido
      if (quaseVivo.current && ((jogo.t - quaseVivo.current.desde) * 1000 > QUASE_FAIXA_MS || jogo.festa || penalti)) { quaseVivo.current = null; setQuase(null) }
      if (cena.placar[0] !== ult.placar[0] || cena.placar[1] !== ult.placar[1]) { ult.placar = [cena.placar[0], cena.placar[1]]; setPlacarV(ult.placar) }
      const fk = cena.festa ? `${cena.festa.lado}|${cena.festa.autor}|${cena.festa.min}` : ''
      if (fk !== ult.festa) {
        ult.festa = fk; setFesta(cena.festa ? { lado: cena.festa.lado, autor: cena.festa.autor, assist: cena.festa.assist, min: cena.festa.min } : null)
        if (replay && cena.festa && !vendo.current && fi.atual.length > 5) { fi.gols.push({ autor: cena.festa.autor, min: cena.festa.min, quadros: fi.atual.slice() }); setTemReplay(true) }
      }
      // 🙈 25/10 (Diego: *"gostei da ideia, 2D escondido tá errado"*): campinho ESCONDIDO (aba Clube/Central com o jogo por trás)
      // continua andando o relógio e o motor (acima) — mas não DESENHA nada: ninguém está vendo, e o desenho disputava o celular
      // com o mapa 3D. Ao aparecer, o próximo quadro já desenha no tamanho real (o efeito reinicia quando a largura muda).
      const mapFPS=mapMatchId?demandaSuperficieCampo2D(mapMatchId):0
      if (escondido&&(!mapFPS||agora-lastMapPaint<1000/mapFPS-.5)) { raf = requestAnimationFrame(quadro); return }
      lastMapPaint=agora
      const R = penalti ? Math.max(6, S * 1.25) : Math.max(8, S * 1.95)
      const e = cena.entre, mis = (a: number | undefined, b: number) => a == null ? b : a + (b - a) * e
      // 🟩 o fundo parado vem pronto do cache; por cima, só o que mexe
      cx.drawImage(fundo, 0, 0, CW, CH)
      if (cena.festa) torcida(cx, cena.festa.lado, cena.t) // 🎉 no gol a torcida de quem fez pula
      else if (vivo.current.efeitosLance && !penalti && !rv && casaAtacando(cena.bola.dono)) torcida(cx, 0, cena.t, true) // 📣 a casa atacando: a arquibancada dela se agita
      placasLaterais(cx, Math.floor(Date.now() / PLACA_MS))
      // 🌧️ a chuva caindo (riscos finos descendo, baratos: ~70 linhas por quadro)
      if (clima === 'chuva') {
        cx.strokeStyle = 'rgba(210,225,255,.35)'; cx.lineWidth = 1
        const tt = cena.t * 1000, nR = 70
        cx.beginPath()
        for (let i = 0; i < nR; i++) { const px = ((i * 97 + tt * 0.03) % CW), py = ((i * 61 + tt * 0.55 + i * i) % (CH + 20)) - 10; cx.moveTo(px, py); cx.lineTo(px - 2, py + 9) }
        cx.stroke()
      }
      // ✨ 07/11: o que os efeitos de lance precisam saber deste quadro (só lê a cena; nada volta pro jogo)
      const fxOn = vivo.current.efeitosLance && !penalti && !rv
      if (fxOn) {
        const b = cena.bola as unknown as BolaVista, ant = fx.ant
        if (ant && cena.t > ant.t) {
          const vel = velocidadeBola(ant, b, cena.t - ant.t)
          const chutando = (cena as { chutando?: boolean }).chutando ?? ['chute', 'cabeceio_gol'].includes((cena.bola as { lance?: { tipo?: string } | null }).lance?.tipo ?? '')
          if (!b.dono && ehBomba(ant, b, vel, chutando)) { if (!fx.bomba.length) fx.saiu = { x: ant.x, y: ant.y, golY: b.y < ant.y ? 0 : L, t: cena.t }; fx.bomba.push([b.x, b.y]); if (fx.bomba.length > 14) fx.bomba.shift() }
          else if (fx.bomba.length) fx.bomba.shift()
        }
        if (!ant || cena.t !== ant.t) fx.ant = { x: b.x, y: b.y, t: cena.t }
        // de onde saiu o último toque (pro chapéu): a bola acabou de deixar o pé de alguém
        if (cena.bola.dono) { fx.saida = null; fx.donoAnt = cena.bola.dono } else if (fx.donoAnt) { fx.saida = { x: b.x, y: b.y, lado: fx.donoAnt.lado }; fx.donoAnt = null }
        // 🥅 gol novo: foi bomba de longe? (o chute forte que saiu há menos de 3 s, em direção a este gol)
        const rk = cena.rede ? `${cena.rede.y0}|${cena.rede.t0}` : ''
        if (rk !== fx.redeK) { fx.redeK = rk; const sa = fx.saiu; fx.redeLonge = !!cena.rede && !!sa && sa.golY === cena.rede.y0 && cena.rede.t0 - sa.t < 3 && golDeLonge(sa, cena.rede.y0) }
        // ⚽ bola quicando: a bola alta acabou de cair (sem ninguém dominar) → 2 quiquinhos no desenho
        if (cena.bola.dono) fx.quique = -1
        else if (fx.hAnt > 0.8 && cena.bola.h < 0.05) fx.quique = cena.t
        fx.hAnt = cena.bola.h
        // 🟫 gramado marcado: risco onde teve carrinho (motor novo: evento 'carrinho' · o de sempre: a narração do carrinho)
        const tempoAgora = cena.t >= 45 * SEG_POR_MIN ? 1 : 0
        if (tempoAgora !== fx.tempo) { fx.tempo = tempoAgora; fx.riscos.length = 0 } // (o risco fica até o fim do TEMPO)
        const marca = (quem: Atleta | undefined) => { if (quem && fx.riscos.length < 40) fx.riscos.push(riscoCarrinho(quem, cena.bola)) }
        // (só o motor NOVO tem evento de carrinho — o de sempre também tem `eventos`, mas são os gols do jogo)
        const evs = 'vx' in cena.bola ? (cena as { eventos?: { tipo: string; a?: string; lado: number }[] }).eventos : undefined
        if (evs) { if (fx.iEv > evs.length) fx.iEv = 0; for (; fx.iEv < evs.length; fx.iEv++) { const e = evs[fx.iEv]; if (e.tipo === 'carrinho' || e.tipo === 'desarme') marca(cena.atl.find(p => p.nome === e.a && p.lado === e.lado)) } }
        if (!evs && cena.narra !== fx.narraAnt) {
          if (/carrinho|sliding|slides in|goes to ground|se joga no ch|rouba a bola|d. o bote|no bote|Desarme de|goes in hard|Tackle by|crunching/i.test(cena.narra ?? '')) { // (carrinho e o desarme na dividida)
            let perto: Atleta | undefined, md = 9
            for (const p of cena.atl) { if (p === cena.bola.dono || p.grupo === 'GOL') continue; const d = Math.hypot(p.x - cena.bola.x, p.y - cena.bola.y); if (d < md) { md = d; perto = p } }
            marca(perto)
          }
        }
        fx.narraAnt = cena.narra ?? ''
        // 🎩 chapéu: a bola passou por cima de quem estava colado em quem tocou (ou do goleiro, na cavadinha)
        if (fx.chapeu && cena.t > fx.chapeu.ate) fx.chapeu = null
        if (cena.festa) fx.chapeu = null // (no gol a festa manda: nada de legenda por cima — régua do teatro)
        else if (!fx.chapeu) { const v = vitimaDoChapeu(b, fx.saida, cena.atl as never); if (v) { fx.chapeu = { a: v as unknown as Atleta, ate: cena.t + 1.4 }; fx.saida = null } }
      } else { fx.bomba.length = 0; fx.ant = null; fx.chapeu = null; fx.quique = -1; fx.voo = null }
      { const qa = (window as unknown as { __qaEfeitos2D?: Record<string, unknown> }).__qaEfeitos2D; if (qa) { qa.bomba = fx.bomba.length; qa.chapeu = !!fx.chapeu; qa.trave = !!fx.trave && cena.t - fx.trave.t0 < 0.5; qa.longe = fx.redeLonge && !!cena.rede && cena.t - cena.rede.t0 < 0.6; qa.pouso = fxOn && !!pousoDaBola(cena.bola as unknown as BolaVista); qa.goleiro = !!fx.voo && cena.t - fx.voo.t0 > 0.15 && cena.t - fx.voo.t0 < 0.4; qa.quique = fx.quique >= 0 && cena.t - fx.quique > 0.1 && cena.t - fx.quique < 0.3; qa.riscos = fx.riscos.length; qa.nVoo = fx.nVoo; qa.fxOn = fxOn; qa.t = cena.t; qa.riscosArr = fx.riscos.slice(0, 3); if (qa.forcaRisco) { fx.riscos.push(qa.forcaRisco as never); qa.forcaRisco = null } qa.torcida = fxOn && casaAtacando(cena.bola.dono) } } // 🔎 só a bancada liga isto
      // 🥅 os gols, com a rede que balança quando a bola entra
      for (const [y0, s] of [[0, 1], [L, -1]] as const) {
        const g = cena.rede && cena.rede.y0 === y0 ? (fxOn ? balancoRede(cena.t - cena.rede.t0, fx.redeLonge) : Math.sin((cena.t - cena.rede.t0) * 30) * 0.9 * Math.max(0, 1 - (cena.t - cena.rede.t0))) : 0
        const tr0 = fxOn && fx.trave && fx.trave.y0 === y0 ? tremorTrave(cena.t - fx.trave.t0) : 0 // 🔔 a trave tremendo
        const [x, y, w, h] = rect(30.34 + tr0, s > 0 ? -2.2 - g : L, 7.32, 2.2 + g)
        cx.fillStyle = 'rgba(255,255,255,.35)'; cx.fillRect(x, y, w, h)
        cx.lineWidth = Math.max(2, S * 0.5); cx.strokeStyle = '#fff'; cx.strokeRect(x, y, w, h)
        cx.strokeStyle = 'rgba(255,255,255,.4)'; cx.lineWidth = 1
        for (let i = 1; i < 4; i++) { cx.beginPath(); if (deitado) { cx.moveTo(x + (w * i) / 4, y); cx.lineTo(x + (w * i) / 4, y + h) } else { cx.moveTo(x, y + (h * i) / 4); cx.lineTo(x + w, y + (h * i) / 4) } cx.stroke() }
      }
      // 📸 os fotógrafos atrás dos gols (flash no gol)
      if (!penalti) desenhaFotografos(cx, tr, R, cena as unknown as CenaArredores)
      // 🧢 os técnicos na beira do campo, com o balão
      const fala = (lado: 0 | 1): string => {
        if (cena.festa) return cena.festa.lado === lado ? t('🙌 É GOL!', '🙌 GOAL!') : t('🤦 Não acredito…', '🤦 Unbelievable…')
        if (cena.t < 4.5) { const tac = cena.tatica[lado]; return tac > 0 ? t('🔥 Pra cima!', '🔥 Attack!') : tac < 0 ? t('🧱 Fecha a casinha!', '🧱 Shut up shop!') : t('⚖️ Toca a bola!', '⚖️ Keep the ball!') }
        return ''
      }
      // 🧑‍💼 O PRESIDENTE NA BEIRA DO CAMPO (21/10, Diego: *"para quem tem um personagem"*): o boneco da conta, um pouco mais
      // pra frente na lateral que o técnico; no gol do time dele, pula de alegria
      for (const [lado, pres, yy] of [[0, vivo.current.casa.presidente, L * 0.6], [1, vivo.current.fora.presidente, L * 0.4]] as const) {
        const foto = pres ? img(pres) : null
        if (!foto || !foto.complete || !foto.naturalWidth) continue
        const RP = Math.max(9, S * 1.9), pula = cena.festa && cena.festa.lado === lado ? Math.abs(Math.sin(cena.t * 9)) * RP * 0.6 : 0
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
        const bx0 = mis(cena.bolaAnt.x, cena.bola.x), by0 = mis(cena.bolaAnt.y, cena.bola.y)
        const ax = penalti?.juiz.x ?? bx0 + (34 - bx0) * 0.45, ay = penalti?.juiz.y ?? by0 + (L / 2 - by0) * 0.22
        // 🥅 na disputa de pênaltis o árbitro fica EXATAMENTE onde a cena manda (perto da marca): com inércia ele cortava caminho
        const k = penalti ? 1 : Math.min(1, dt / 900); juiz.x += (ax - juiz.x) * k; juiz.y += (ay - juiz.y) * k
        const arbitro = (px: number, py: number, letra: string, escala: number) => {
          const [X, Y] = tr(px, py), RJ = R * escala
          cx.beginPath(); cx.ellipse(X, Y + RJ - 1, RJ * 0.8, 3, 0, 0, 7); cx.fillStyle = 'rgba(0,0,0,.25)'; cx.fill()
          cx.beginPath(); cx.arc(X, Y, RJ, 0, 7); cx.fillStyle = '#111'; cx.fill(); cx.lineWidth = 2; cx.strokeStyle = '#FFE600'; cx.stroke()
          cx.fillStyle = '#FFE600'; cx.font = fonte(RJ * 0.9, 800); cx.textAlign = 'center'; cx.fillText(letra, X, Y + RJ * 0.35)
          return [X, Y, RJ] as const
        }
        // 🚩 os auxiliares na linha do gol (só na disputa)
        if (penalti) for (const a of penalti.auxiliares) {
          const [X, Y, RJ] = arbitro(a.x, a.y, 'A', 0.62)
          cx.fillStyle = '#FFE600'; cx.fillRect(X + RJ * 0.7, Y - RJ * 1.7, RJ * 0.9, RJ * 0.6); cx.fillStyle = '#C2452F'; cx.fillRect(X + RJ * 0.7, Y - RJ * 1.4, RJ * 0.9, RJ * 0.3)
          cx.strokeStyle = '#111'; cx.lineWidth = 1.5; cx.beginPath(); cx.moveTo(X + RJ * 0.7, Y - RJ * 1.75); cx.lineTo(X + RJ * 0.7, Y - RJ * 0.2); cx.stroke()
        }
        // 🚩 07/11: no jogo corrido os bandeirinhas correm na lateral e levantam a bandeira (lateral · escanteio · tiro de meta)
        if (!penalti) {
          const alvos = alvoBandeirinhas(cena as unknown as CenaArredores), sinal = sinalDaBandeira(cena as unknown as CenaArredores)
          const kA = Math.min(1, dt / 700)
          auxs.forEach((ax, i) => {
            ax[1] += (alvos[i][1] - ax[1]) * kA
            const [AX, AY, RA] = arbitro(ax[0], ax[1], 'A', 0.62)
            const meu = sinal != null && (cena.bola.y >= L / 2 ? i === 0 : i === 1)
            desenhaBandeira(cx, tr, AX, AY, RA, [i === 0 ? W + 6 : -6, ax[1]], meu ? sinal!.alvo : null, meu)
          })
        }
        const [X, Y, RJ] = arbitro(juiz.x, juiz.y, 'J', 0.8)
        // 📣 o árbitro AUTORIZA a cobrança: braço apontando pra marca + o apito
        if (penalti?.apito) {
          const [mx, my] = tr(34, 11), ang = Math.atan2(my - Y, mx - X)
          cx.strokeStyle = '#FFE600'; cx.lineWidth = Math.max(2.5, RJ * 0.35); cx.lineCap = 'round'
          cx.beginPath(); cx.moveTo(X + Math.cos(ang) * RJ, Y + Math.sin(ang) * RJ); cx.lineTo(X + Math.cos(ang) * RJ * 2.1, Y + Math.sin(ang) * RJ * 2.1); cx.stroke()
          const txt = t('PRIII! 📣', 'PHWEET! 📣')
          cx.font = fonte(Math.max(9, S * 1.25)); const w = cx.measureText(txt).width + 10, bx = X - w / 2, by = Y - RJ - 22
          cx.fillStyle = '#FFE600'; cx.strokeStyle = INK; cx.lineWidth = 2; cx.beginPath(); cx.roundRect?.(bx, by, w, 17, 6); cx.fill(); cx.stroke()
          cx.fillStyle = INK; cx.textAlign = 'left'; cx.fillText(txt, bx + 5, by + 12.5)
        }
      }
      // 🌠 rastro: só quando a bola está viajando (passe/chute); some sozinho
      if (igualMapa) rastro.length = 0
      else if (cena.bola.voo) { rastro.push([cena.bola.x, cena.bola.y]); if (rastro.length > 9) rastro.shift() } else if (rastro.length) rastro.shift()
      if (rastro.length > 1) {
        cx.lineCap = 'round'
        for (let i = 1; i < rastro.length; i++) { const [ax, ay] = tr(...rastro[i - 1]), [bx1, by1] = tr(...rastro[i]); cx.strokeStyle = `rgba(255,255,255,${(0.08 + (0.5 * i) / rastro.length).toFixed(2)})`; cx.lineWidth = 1 + (3.5 * i) / rastro.length; cx.beginPath(); cx.moveTo(ax, ay); cx.lineTo(bx1, by1); cx.stroke() }
      }
      // 🟫 07/11: os riscos dos carrinhos no gramado (ficam até o fim do tempo)
      if (fxOn && fx.riscos.length) {
        cx.lineCap = 'round'
        for (const k of fx.riscos) {
          const [ax, ay] = tr(k.x0, k.y0), [b0x, b0y] = tr(k.x1, k.y1), cl = Math.hypot(b0x - ax, b0y - ay) || 1, cm = Math.max(cl, R * 2.6) // (no mínimo do tamanho de 2 bonecos, senão some embaixo deles)
          const bx2 = ax + (b0x - ax) / cl * cm, by2 = ay + (b0y - ay) / cl * cm
          cx.beginPath(); cx.moveTo(ax, ay); cx.lineTo(bx2, by2)
          cx.strokeStyle = 'rgba(78,52,26,.62)'; cx.lineWidth = Math.max(4, S * 1.05); cx.stroke() // a terra que levantou
          cx.strokeStyle = 'rgba(120,88,52,.55)'; cx.lineWidth = Math.max(2, S * 0.5); cx.stroke() // o meio do risco, mais claro
        }
      }
      // 🎯 07/11: onde a bola ALTA vai cair — uma sombra no gramado que aperta conforme ela desce
      if (fxOn) {
        const pz = pousoDaBola(cena.bola as unknown as BolaVista)
        if (pz) {
          const [px, py] = tr(pz.x, pz.y), k = Math.min(1, pz.falta / 1.4), r = R * (0.6 + 1.1 * k), a0 = cx.globalAlpha
          cx.globalAlpha = 0.55 - 0.2 * k; cx.fillStyle = '#000'; cx.beginPath(); cx.ellipse(px, py, r * 0.75, r * 0.5, 0, 0, 7); cx.fill()
          cx.globalAlpha = 0.95 - 0.3 * k; cx.setLineDash([5, 4]); cx.strokeStyle = '#fff'; cx.lineWidth = 2.2
          cx.beginPath(); cx.ellipse(px, py, r * 1.3, r * 0.85, 0, 0, 7); cx.stroke(); cx.setLineDash([])
          const xr = Math.max(3, R * 0.32); cx.lineWidth = 2.4; cx.beginPath(); cx.moveTo(px - xr, py - xr); cx.lineTo(px + xr, py + xr); cx.moveTo(px + xr, py - xr); cx.lineTo(px - xr, py + xr); cx.stroke()
          cx.globalAlpha = a0
        }
      }
      // 👁️ onde cada um APARECE (afastados uns dos outros) e com que velocidade está correndo
      const dtJ = Math.max(0, cena.t - tAnt); tAnt = cena.t
      const vis = cena.atl.map((p, i) => ({ p, x: penalti?.jogadores[i]?.x ?? mis(p.ax, p.x), y: penalti?.jogadores[i]?.y ?? mis(p.ay, p.y), ox: 0, oy: 0 }))
      const minD = (R / S) * 2.0
      for (let it = 0; it < (penalti ? 0 : 4); it++) for (let i = 0; i < vis.length; i++) for (let j = i + 1; j < vis.length; j++) {
        const A = vis[i], B = vis[j], dx = B.x + B.ox - A.x - A.ox, dy = B.y + B.oy - A.y - A.oy, d = Math.hypot(dx, dy)
        if (d >= minD) continue
        const ux = d > 1e-3 ? dx / d : (i % 2 ? 1 : -1), uy = d > 1e-3 ? dy / d : 0, k = (minD - d) / 2
        A.ox -= ux * k; A.oy -= uy * k; B.ox += ux * k; B.oy += uy * k
      }
      const suave = penalti ? 1 : Math.min(1, dt / 140)
      const pos = new Map<Atleta, { x: number; y: number; v: number; dx: number; dy: number }>()
      for (const q of vis) {
        let o = afasta.get(q.p); if (!o) { o = { x: q.ox, y: q.oy, px: q.x, py: q.y, v: 0 }; afasta.set(q.p, o) }
        o.x += (q.ox - o.x) * suave; o.y += (q.oy - o.y) * suave
        const mx = q.x - o.px, my = q.y - o.py, m = Math.hypot(mx, my)
        if (dtJ > 0) { o.v += (Math.min(12, m / dtJ) - o.v) * Math.min(1, dtJ * 6) }
        pos.set(q.p, { x: q.x + o.x, y: q.y + o.y, v: o.v, dx: m > 1e-4 ? mx / m : 0, dy: m > 1e-4 ? my / m : 0 })
        o.px = q.x; o.py = q.y
      }
      // ⚽ a bola que APARECE: no pé de quem conduz, um passo à frente, com toquinhos; no passe, a bola de verdade
      const bA = cena.bolaAnt, dono = cena.bola.dono
      let alvoX = mis(bA.x, cena.bola.x), alvoY = mis(bA.y, cena.bola.y)
      const dp = dono && !cena.bola.voo && !rv ? pos.get(dono) : undefined
      if (dono && dp) {
        const corre = Math.min(1, dp.v / 3.2), dx = corre > 0.15 && (dp.dx || dp.dy) ? dp.dx : 0, dy = corre > 0.15 && (dp.dx || dp.dy) ? dp.dy : (dono.lado === 0 ? -1 : 1)
        const fase = (cena.t * 1.7 + (numero.get(dono) ?? 0) * 0.37) % 1, perto = R / S * 0.75
        const dist = perto + corre * (0.35 + 1.1 * fase * fase)
        alvoX = dp.x + dx * dist; alvoY = dp.y + dy * dist
      }
      if (penalti || !Number.isFinite(bolaVis.x) || Math.hypot(alvoX - bolaVis.x, alvoY - bolaVis.y) > 9 || rv) { bolaVis.x = alvoX; bolaVis.y = alvoY }
      else { const kb = Math.min(1, dt / (cena.bola.voo ? 35 : 75)); bolaVis.x += (alvoX - bolaVis.x) * kb; bolaVis.y += (alvoY - bolaVis.y) * kb }
      // 🏷️ no celular (campo em pé) só aparece o NOME de quem está no lance: quem tem a bola, quem chega pra tomar e quem fez o gol
      // (antes eram 22 etiquetas e, num bolo de 3, ninguém lia nada). No PC, deitado, cabe todo mundo como sempre.
      // 🏷️ NOME SÓ DE QUEM ENCOSTA NA BOLA (04/11, Diego: *"deixar o nome do jogador aparecer apenas quando encosta na bola"*), no
      // celular e no PC, igual ao campo do mapa — mais quem fez o gol, durante a festa. O resto fica só com o número/rosto.
      const comNome = new Set<Atleta>()
      if (penalti && penalti.batedor >= 0) comNome.add(cena.atl[penalti.batedor])
      if (igualMapa) { const quem = nomeNaBola(cena.bola.dono?.nome, agora); if (quem) for (const p of cena.atl) if (p.nome === quem) comNome.add(p) }
      else if (cena.bola.dono) comNome.add(cena.bola.dono)
      if (cena.festa) for (const p of cena.atl) if (p.nome === cena.festa.autor) comNome.add(p)
      // 🧤 07/11: goleiro VOANDO na defesa difícil — o corpo se estica pro lado do chute (o boneco vai junto, até 1,8 m)
      if (fxOn && fx.voo) {
        const idade = cena.t - fx.voo.t0, k = esticaGoleiro(idade), gk = cena.atl.find(p => p.lado === fx.voo!.lado && p.grupo === 'GOL'), q = gk && pos.get(gk)
        if (idade > 0.7) fx.voo = null
        else if (gk && q && k > 0) {
          // (o pulo é sempre pro lado do chute — se a bola veio no meio, pro lado do canto mais perto — e longo o bastante pra se ver fora do boneco)
          const lado = Math.abs(fx.voo.x - q.x) > 0.4 ? Math.sign(fx.voo.x - q.x) : fx.voo.x >= W / 2 ? 1 : -1, alc = (R / S) * 3.2 * k // (medido no tamanho do BONECO: em metros ficava escondido embaixo dele)
          const [ax, ay] = tr(q.x, q.y), [bx2, by2] = tr(q.x + lado * alc, q.y)
          cx.lineCap = 'round'; cx.beginPath(); cx.moveTo(ax, ay); cx.lineTo(bx2, by2)
          cx.strokeStyle = INK; cx.lineWidth = R * 1.15; cx.stroke(); cx.strokeStyle = gk.lado === 0 ? corCasa : corFora; cx.lineWidth = R * 0.85; cx.stroke() // o corpo esticado
          cx.beginPath(); cx.arc(bx2, by2, R * 0.55, 0, 7); cx.fillStyle = '#FFE600'; cx.fill(); cx.lineWidth = 2; cx.strokeStyle = INK; cx.stroke() // a luva
          pos.set(gk, { ...q, x: q.x + lado * alc * 0.45 })
        }
      }
      // 🧍 os 22 (de trás pra frente na tela)
      const ordem = [...cena.atl].sort((a, b) => tr(pos.get(a)!.x, pos.get(a)!.y)[1] - tr(pos.get(b)!.x, pos.get(b)!.y)[1])
      const nomesPorCima: [number, number, string][] = []
      for (const p of ordem) {
        const q = pos.get(p)!, [X, Y] = tr(q.x, q.y)
        const camisa=p.lado===0?corCasa:corFora,correndo=penalti?q.v>.6:p.ax!=null&&Math.hypot(p.x-p.ax,p.y-p.ay!)>.02
        let im=rostoDe.get(p.nome);if(im===undefined){im=rosto(cartaDe.get(p.nome)??p.carta);rostoDe.set(p.nome,im)}
        if (igualMapa && comNome.has(p)) nomesPorCima.push([X, Y, p.nome]) // 🏷️ 04/11: o nome vai por cima de todo mundo (no mapa ninguém tampa o nome)
        // 🙌 a festa curta da disputa: o batedor no gol, o goleiro na defesa — pula no lugar, com o emoji em cima
        const festaPen = penalti?.comemora && cena.atl.indexOf(p) === penalti.comemora.indice ? penalti.comemora : null
        if (festaPen) { const pulo = Math.abs(Math.sin(cena.t * 11)) * R * 0.7; cx.font = `${Math.round(R * 1.5)}px sans-serif`; cx.textAlign = 'center'; cx.fillText(festaPen.tipo === 'gol' ? '🙌' : '🧤', X, Y - R - pulo - 3) }
        desenharMarcadorCampo2D(cx,X,festaPen?Y-Math.abs(Math.sin(cena.t*11))*R*0.5:Y,R,{name:comNome.has(p)&&!igualMapa?p.nome:'',color:camisa,stripes:(p.lado===0?camCasa:camFora).listras,number:String(numero.get(p)??''),portrait:im,owned:penalti ? cena.atl.indexOf(p)===penalti.batedor : p===cena.bola.dono,step:correndo?Math.sin(cena.t*14+p.bx):0})
      }
      for (const [X, Y, nome] of nomesPorCima) desenharNomeCampo2D(cx, X, Y, R, nome)
      // 🎩 quem levou o chapéu fica olhando a bola passar por cima
      if (fxOn && fx.chapeu) {
        const q = pos.get(fx.chapeu.a)
        if (q) {
          const [X, Y] = tr(q.x, q.y), k = Math.max(0, (fx.chapeu.ate - cena.t) / 1.4), a0 = cx.globalAlpha
          cx.globalAlpha = Math.min(1, k * 2.5); cx.font = `${Math.round(R * 1.35)}px sans-serif`; cx.textAlign = 'center'
          cx.fillText('😳', X, Y - R - 4 - (1 - k) * R * 0.5)
          cx.font = fonte(Math.max(9, S * 1.15), 800); cx.lineWidth = 3; cx.strokeStyle = INK; cx.fillStyle = '#FFE600'
          cx.strokeText(t('CHAPÉU!', 'LOBBED!'), X, Y - R * 2.6 - (1 - k) * R * 0.8); cx.fillText(t('CHAPÉU!', 'LOBBED!'), X, Y - R * 2.6 - (1 - k) * R * 0.8)
          cx.globalAlpha = a0
        }
      }
      // 🔔 "TÓIN!" subindo do poste
      if (fxOn && fx.trave && cena.t - fx.trave.t0 < 1.1) {
        const idade = cena.t - fx.trave.t0, [X, Y] = tr(fx.trave.x, fx.trave.y0), a0 = cx.globalAlpha
        cx.globalAlpha = Math.min(1, (1.1 - idade) * 2.5); cx.font = fonte(Math.max(11, S * 1.6), 800); cx.textAlign = 'center'
        cx.lineWidth = 3.5; cx.strokeStyle = INK; cx.fillStyle = '#fff'
        const yy = Y + (fx.trave.y0 === 0 ? 1 : -1) * (R * 2.6) * (deitado ? 0 : 1) - idade * R * 1.4
        cx.strokeText(t('TÓIN!', 'CLANG!'), X, yy); cx.fillText(t('TÓIN!', 'CLANG!'), X, yy); cx.globalAlpha = a0
      }
      // ⚽ a bola: maior que antes (era um grão), gomos pretos, sombra que se afasta quando ela sobe
      {
        const qq = fxOn && fx.quique >= 0 && cena.t - fx.quique < QUIQUE_DUR ? alturaQuique(cena.t - fx.quique) : 0 // ⚽ os quiquinhos (só desenho)
        const [bx, by] = tr(bolaVis.x, bolaVis.y), bh = (mis(bA.h, cena.bola.h) + qq) * S, rb = Math.max(4.6, R * 0.36) + (cena.bola.h + qq) * 0.25
        // 🌠 o rastro do mapa, por baixo da bola e por cima dos bonecos (no mapa é igual)
        if (igualMapa) {
          const rp = rastroMapa.passo(bolaVis.x, bh, bolaVis.y, dt / 1000)
          if (rastroVisivel(rp.length)) {
            const a0 = cx.globalAlpha
            rp.forEach((q, i) => { const [qx, qy] = tr(q.x, q.z), { tamanho, alfa } = pontoRastro(i, rp.length), d = tamanho * rb * 2; cx.globalAlpha = alfa; cx.drawImage(bolinha, qx - d / 2, qy - q.y - d / 2, d, d) })
            cx.globalAlpha = a0
          }
        } else rastroMapa.limpa()
        // (💥 o rastro de fogo do chute forte saiu em 07/11: *"não quero fogo no chute"* — fica só a rede balançando mais no gol de longe)
        cx.beginPath(); cx.ellipse(bx + bh * 0.25, by + rb * 0.55, rb * (1 - Math.min(0.4, bh / 120)), rb * 0.45, 0, 0, 7); cx.fillStyle = 'rgba(0,0,0,.38)'; cx.fill()
        const cy = by - bh
        cx.beginPath(); cx.arc(bx, cy, rb, 0, 7); cx.fillStyle = '#fff'; cx.fill()
        const giro = (bolaVis.x + bolaVis.y) * 0.9
        cx.save(); cx.beginPath(); cx.arc(bx, cy, rb, 0, 7); cx.clip(); cx.fillStyle = '#151515'
        for (let k = 0; k < 4; k++) { const a = giro + k * 1.75, rr = k ? rb * 0.95 : 0, gx = bx + Math.cos(a) * rr, gy = cy + Math.sin(a) * rr, g5 = rb * (k ? 0.36 : 0.42)
          cx.beginPath(); for (let v = 0; v < 5; v++) { const aa = a + v * 1.2566; v ? cx.lineTo(gx + Math.cos(aa) * g5, gy + Math.sin(aa) * g5) : cx.moveTo(gx + Math.cos(aa) * g5, gy + Math.sin(aa) * g5) } cx.closePath(); cx.fill() }
        cx.restore(); cx.beginPath(); cx.arc(bx, cy, rb, 0, 7); cx.lineWidth = 1.6; cx.strokeStyle = '#111'; cx.stroke()
      }
      // 🎬 pênaltis: o corte de câmera do começo (a tela clareia e todo mundo já está perto do seu lugar — ninguém cruza ninguém)
      if (penalti && penalti.corte > 0) { const a0 = cx.globalAlpha; cx.globalAlpha = penalti.corte; cx.fillStyle = '#0C0C0C'; cx.fillRect(0, 0, CW, CH); cx.globalAlpha = a0 }
      // 😱 QUASE: um anel dourado curto onde a bola beijou a trave / o goleiro voou (o mesmo anel aparece no gramado do mapa)
      const qv = quaseVivo.current, qIdade = qv ? (jogo.t - qv.desde) * 1000 / QUASE_ANEL_MS : 2
      if (qv && qIdade < 1) {
        const [qx, qy] = tr(qv.q.x, qv.q.y), a0 = cx.globalAlpha
        cx.globalAlpha = 1 - qIdade
        cx.beginPath(); cx.arc(qx, qy, R * (0.8 + qIdade * 2.4), 0, 7); cx.lineWidth = Math.max(3, R * 0.42); cx.strokeStyle = GOLD; cx.stroke()
        cx.beginPath(); cx.arc(qx, qy, R * (0.5 + qIdade * 1.5), 0, 7); cx.lineWidth = Math.max(1.5, R * 0.18); cx.strokeStyle = '#fff'; cx.stroke()
        if (qv.q.tipo === 'trave') { cx.beginPath(); cx.arc(qx, qy, Math.max(3, R * 0.45), 0, 7); cx.fillStyle = '#fff'; cx.fill() } // (o poste "acende")
        cx.globalAlpha = a0
      }
      if(mapMatchId&&mapFPS){
        const [sx,sy,sw,sh]=rect(-1.5,-2,W+3,L+4)
        publicarSuperficieCampo2D({id:mapMatchId,owner:surfaceOwner,canvas:c,rect:{x:sx*dpr,y:sy*dpr,width:sw*dpr,height:sh*dpr},landscape:deitado,minute:simMin,
          players:cena.atl.map((p,i)=>({key:String(i),name:p.nome,side:p.lado===0?'home':'away',keeper:p.grupo==='GOL',x:L/2-pos.get(p)!.y,z:pos.get(p)!.x-W/2,radius:R/S,marker:{name:p.nome,color:p.lado===0?corCasa:corFora,stripes:(p.lado===0?camCasa:camFora).listras,number:String(numero.get(p)??''),portrait:rostoDe.get(p.nome)??null,owned:penalti ? cena.atl.indexOf(p)===penalti.batedor : p===cena.bola.dono}})),
          net:cena.rede?{sign:cena.rede.y0===0?1:-1,time:cena.rede.t0,age:cena.t-cena.rede.t0}:undefined,score:[cena.placar[0],cena.placar[1]],narration:cena.narra,arredores:penalti?undefined:arredoresParaMapa(cena as unknown as CenaArredores,auxs),penalties:estadoPenalti?{score:disputaPenaltis!.config.invertido?[estadoPenalti.placar[1],estadoPenalti.placar[0]]:estadoPenalti.placar,finished:estadoPenalti.encerrado}:undefined,clima,falas:[fala(0),fala(1)],autorGol:cena.festa?.autor??'',tecnicos:[casa.tecnico?nomeLimpo(casa.tecnico).split(' ').slice(-1)[0].toUpperCase():'',fora.tecnico?nomeLimpo(fora.tecnico).split(' ').slice(-1)[0].toUpperCase():''],referee:{x:L/2-juiz.y,z:juiz.x-W/2},
          ball:{x:L/2-bolaVis.y,y:.11+mis(bA.h,cena.bola.h),z:bolaVis.x-W/2},
          quase:qv&&!penalti?{side:qv.q.lado===0?'home':'away',x:L/2-qv.q.y,z:qv.q.x-W/2,age:qIdade,trave:qv.q.tipo==='trave'}:undefined,
          // ✨ 07/11: os efeitos de lance também no estádio do mapa (o mapa só desenha; quem decide é este mesmo quadro)
          efeitos:fxOn?(()=>{const pz=pousoDaBola(cena.bola as unknown as BolaVista),ch=fx.chapeu,tv=fx.trave
            return{pouso:pz?{x:L/2-pz.y,z:pz.x-W/2,falta:pz.falta}:undefined,chapeu:ch?{x:L/2-ch.a.y,z:ch.a.x-W/2,age:1-Math.max(0,(ch.ate-cena.t)/1.4)}:undefined,
              trave:tv&&cena.t-tv.t0<1.1?{sign:tv.y0===0?1:-1,age:(cena.t-tv.t0)/1.1}:undefined,gol:cena.festa?{side:cena.festa.lado===0?'home' as const:'away' as const,key:fk}:undefined}})():undefined})
      }
      raf = requestAnimationFrame(quadro)
    }
    raf = requestAnimationFrame(quadro)
    return () => {cancelAnimationFrame(raf);if(mapMatchId)soltarSuperficieCampo2D(mapMatchId,surfaceOwner)}
  }, [jogo, larg, deitado, corCasa, corFora, listrasK, msPorMin, noite, gramaPct, lotacao, mapMatchId])

  const time = festa ? (festa.lado === 0 ? casa : fora) : null
  // 📺 07/11: o TELÃO do estádio — quando a festa do gol termina, ele fica ~10 s com o escudo e o nome de quem fez
  // (durante a festa ele fica por baixo dela: o mesmo teatro não aparece duas vezes ao mesmo tempo)
  const [telao, setTelao] = useState<{ lado: 0 | 1; autor: string; min: number } | null>(null)
  const ultFesta = useRef<typeof festa>(null)
  useEffect(() => {
    if (festa) { ultFesta.current = festa; setTelao(null); return }
    const f = ultFesta.current; if (!f) return
    ultFesta.current = null; setTelao({ lado: f.lado, autor: f.autor, min: f.min })
    const id = setTimeout(() => setTelao(null), 10000); return () => clearTimeout(id)
  }, [festa])
  // 🗺️ o mesmo telão no campo do MAPA (o HUD do mapa lê)
  useEffect(() => {
    if (!mapMatchId) return
    const dono = telao ? (telao.lado === 0 ? vivo.current.casa : vivo.current.fora) : null
    publicarTelaoCampo2D(mapMatchId, telao && dono ? { ...telao, escudo: dono.escudo } : null)
  }, [mapMatchId, telao])
  useEffect(() => () => { if (mapMatchId) publicarTelaoCampo2D(mapMatchId, null) }, [mapMatchId])
  // 🗺️ 04/11: a mesma festa do gol vai pro HUD do mapa (quando este campinho é a fonte do campo do estádio)
  useEffect(() => {
    if (!mapMatchId) return
    const dono = festa ? (festa.lado === 0 ? vivo.current.casa : vivo.current.fora) : null
    publicarFestaCampo2D(mapMatchId, festa && dono ? { ...festa, mascote: dono.mascote, escudo: dono.escudo } : null)
  }, [mapMatchId, festa])
  useEffect(() => () => { if (mapMatchId) publicarFestaCampo2D(mapMatchId, null) }, [mapMatchId])
  // 📊🎬😱 04/11: o resumo do apito, os melhores momentos e o QUASE — o MESMO desenho aqui e no HUD do mapa
  const en = t('pt', 'en') === 'en'
  const quaseTxt = quase ? fraseQuase(quase, en) : ''
  const ladoResumo = (l: typeof casa, cor: string) => ({ nome: l.nome, sigla: sigla(l.nome), cor })
  const replayCtl: ReplayCampo2D | null = replay && temReplay && fechado && !festa && (!disputaPenaltis || disputaPenaltis.estado.encerrado) ? {
    na: replayNa,
    play: () => { const g = fita.current.gols[0]; if (!g || vendo.current) return; vendo.current = { i: 0, ini: performance.now() }; setReplayNa({ autor: g.autor, min: g.min }) },
  } : null
  const replaySig = replayCtl ? `${replayNa?.autor ?? ''}|${replayNa?.min ?? ''}` : ''
  useEffect(() => {
    if (!mapMatchId) return
    publicarApitoCampo2D(mapMatchId, (resumo && (!disputaPenaltis || disputaPenaltis.estado.encerrado)) || replayCtl ? { resumo, casa: ladoResumo(vivo.current.casa, corCasa), fora: ladoResumo(vivo.current.fora, corFora), replay: replayCtl } : null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapMatchId, resumo, replaySig, corCasa, corFora])
  useEffect(() => { if (mapMatchId) publicarQuaseCampo2D(mapMatchId, quase ? { ...quase, txt: quaseTxt } : null) }, [mapMatchId, quase, quaseTxt])
  useEffect(() => () => { if (mapMatchId) { publicarApitoCampo2D(mapMatchId, null); publicarQuaseCampo2D(mapMatchId, null) } }, [mapMatchId])
  const altPlaca = Math.max(22, Math.round(larg / 16))
  return (
    <div ref={caixa} style={{ marginBottom: 10 }}>
      <div style={{ position: 'relative', width: larg, margin: '0 auto', border: `3px solid ${INK}`, borderRadius: 14, overflow: 'hidden', boxShadow: `3px 3px 0 ${INK}`, background: '#1b232c' }}>
        {!deitado && <PlacaGol lado="cima" alt={altPlaca} />}
        <div style={{ position: 'relative' }}>
          <canvas ref={cv} style={{ display: 'block' }} />
          {/* 📺 o "selo da TV": placar e minuto do que o campinho JÁ mostrou (o placar só muda quando a bola entra).
              🥅 07/11: na disputa de pênaltis, com o campinho em pé (celular), o selo desce pro canto de BAIXO — em cima ele
              cobria o auxiliar da esquerda, e lá embaixo (o outro gol) não acontece nada durante a disputa */}
          <div style={{ position: 'absolute', left: 8, ...(placarPenV && !deitado ? { bottom: 8 } : { top: 8 }), ...OSW, fontSize: deitado ? 15 : 12, background: INK, color: '#fff', border: '2px solid #fff', borderRadius: 8, padding: deitado ? '3px 10px' : '2px 8px', display: 'flex', gap: 6, alignItems: 'center', pointerEvents: 'none' }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: corCasa, border: '1px solid #fff' }} />{sigla(casa.nome)} <b style={{ color: GOLD }}>{placarV[0]} × {placarV[1]}</b> {sigla(fora.nome)}<span style={{ width: 8, height: 8, borderRadius: 2, background: corFora, border: '1px solid #fff' }} /><span style={{ opacity: .8 }}>{placarPenV ? `${t('PÊN', 'PENS')} ${placarPenV[0]}–${placarPenV[1]}` : fechado ? t('FIM', 'FT') : `${Math.min(90, minuto)}'`}</span>
          </div>
          <Telao2D deitado={deitado} larg={larg} gol={telao} casa={casa} fora={fora} />
        </div>
        {!deitado && <PlacaGol lado="baixo" alt={altPlaca} />}
        {festa && time && (
          // ⚽ o GOL: mascote grande (quem tem) ou GOOOL + escudo; embaixo a faixinha do autor — o mesmo teatro uma vez só
          // (o MESMO componente aparece por cima do campo do mapa — campo2d-festa.tsx)
          <FestaGolCampo2D festa={{ ...festa, mascote: time.mascote, escudo: time.escudo }} larg={larg} />
        )}
      </div>
      {replayCtl && (
        <div style={{ maxWidth: larg, margin: '8px auto 0', display: 'flex', justifyContent: 'center' }}>
          <BotaoReplayCampo2D replay={replayCtl} />
        </div>
      )}
      {narra && !semNarra && (
        <div key={piscaGol ? `g${piscaGol.k}` : quase ? `q${quase.k}` : 'n'} className={piscaGol ? 'll44-gol-pisca' : undefined} data-quase-campo2d={quase && !piscaGol ? quase.tipo : undefined}
          style={{ maxWidth: larg, margin: '8px auto 0', background: '#F4ECD6', color: INK, border: `3px solid ${INK}`, borderRadius: 12, padding: '7px 10px', fontSize: 13, fontWeight: 700, lineHeight: 1.3, ...(piscaGol ? estiloPisca() : quase ? estiloQuase() : {}) }}
          dangerouslySetInnerHTML={{ __html: piscaGol ? `<span class="ll44-grito">${gritoGol(piscaGol.lado === 0 ? casa.nome : fora.nome, t('pt', 'en') === 'en', festa?.autor, festa?.min).replace(/[<>&"]/g, '')}</span>` : quase ? '😱 ' + quaseTxt.replace(/[<>&"]/g, '') : '🎙️ ' + narra }} />
      )}
      {quase && <style>{QUASE_CSS}</style>}
      {resumo && !festa && (!disputaPenaltis || disputaPenaltis.estado.encerrado) && <ResumoApitoCampo2D resumo={resumo} casa={ladoResumo(casa, corCasa)} fora={ladoResumo(fora, corFora)} larg={larg} />}
    </div>
  )
}

// 📺 o TELÃO do estádio (07/11, mockup pro Diego): na arquibancada de cima (deitado) ou no canto atrás do gol de cima (em pé).
// Parado = os dois escudos e "AO VIVO" (o placar já está no selo da TV); depois de um gol = escudo + GOL + nome + minuto.
function Telao2D({ deitado, larg, gol, casa, fora }: { deitado: boolean; larg: number; gol: { lado: 0 | 1; autor: string; min: number } | null; casa: Campo2DProps['casa']; fora: Campo2DProps['fora'] }) {
  const t = useT()
  const S0 = deitado ? larg / (L + PADL * 2) : larg / (W + PADX * 2)
  const box = deitado
    ? { left: larg * 0.15, top: S0 * 0.7, width: larg * 0.22, height: (PADT - 3.2) * S0 - S0 * 1.4 }
    : { left: (50 + PADX) * S0, top: 2, width: larg - (50 + PADX) * S0 - 3, height: PAD * S0 - 3 }
  const h = box.height - 6
  const esc = (n: ReactNode, k: number) => n ? (
    <div style={{ width: k, height: k, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <div style={{ transform: `scale(${k / 110})` }}>{n}</div>
    </div>
  ) : null
  const dono = gol ? (gol.lado === 0 ? casa : fora) : null
  const fs = Math.max(9, Math.round(h * (deitado ? 0.34 : 0.62)))
  return (
    <div data-telao-campo2d style={{ position: 'absolute', ...box, background: '#05070a', border: `2px solid ${INK}`, outline: '1px solid #3a434d', borderRadius: 4, boxShadow: '0 0 10px rgba(80,170,255,.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, overflow: 'hidden', pointerEvents: 'none',
      backgroundImage: 'radial-gradient(rgba(255,255,255,.07) 1px, transparent 1px)', backgroundSize: '3px 3px' }}>
      {gol && dono ? (
        <>
          {esc(dono.escudo, h)}
          <div style={{ ...OSW, lineHeight: 1.02, display: 'flex', flexDirection: deitado ? 'column' : 'row', gap: deitado ? 0 : 5, alignItems: deitado ? 'flex-start' : 'center', minWidth: 0 }}>
            <span style={{ color: GOLD, fontSize: fs, fontWeight: 900, textShadow: '0 0 6px rgba(255,196,0,.6)' }}>{t('GOL!', 'GOAL!')}</span>
            <span style={{ color: '#fff', fontSize: fs, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{nomeLimpo(gol.autor).toUpperCase()} {gol.min > 90 ? `90+${gol.min - 90}` : gol.min}'</span>
          </div>
        </>
      ) : (
        <>
          {esc(casa.escudo, h * 0.8)}
          <span style={{ ...OSW, color: '#E8503A', fontSize: Math.max(8, Math.round(fs * 0.8)), textShadow: '0 0 6px rgba(232,80,58,.7)' }}>● {t('AO VIVO', 'LIVE')}</span>
          {esc(fora.escudo, h * 0.8)}
        </>
      )}
    </div>
  )
}

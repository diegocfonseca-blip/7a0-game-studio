// ─── 🛍️ LOJA DO CLUBE — a tela (sub-aba 🏟️ Clube › 🛍️ Loja) ──────────────
// Aprovada pelo Diego em 15/09 e LIBERADA GERAL no mesmo dia (`LOJA_GERAL` em
// `sport.ts`). A porta de verdade continua sendo a OBRA 🛍️ Loja do Clube no estádio:
// quem não construiu não vê nem a sub-aba nem os passos da virada.
//
// A regra da camisa, palavras dele: *"todo clube sem batismo só terá no peito
// esquerdo, enquadrado corretamente, o escudo dele. O patrocínio irá alterar com
// base no fechamento do patrocínio Master e também do fornecedor de material
// esportivo. Isso vale também pros times de batismo."*
//   · peito ESQUERDO (direito de quem olha) → o escudo. Sem batismo é o escudo
//     base; com batismo já vem desenhado na arte do dono e o jogo NÃO carimba
//     outro por cima.
//   · peito DIREITO → o fornecedor, se tiver contrato.
//   · BARRIGA → o Master, se tiver contrato.
// Fechou, aparece. Acabou, some.
//
// 📐 As medidas saem de CADA arte, nunca da altura da imagem (erro que ele pegou:
// *"totalmente desproporcional"* — a imagem inclui as duas mangas, então o peito
// é bem mais estreito do que parece).

import { useEffect, useRef, useState } from 'react'
import { tr } from './lang'
import { CAMISAS_SALAO } from './salao-camisas'
import {
  PRECOS, PRECO_EN, PRECO_PADRAO, CORES_PADRAO,
  fornecedorDe, fornAtivo, fornAnoAtual, fornValor, fornBonusLoja,
  torcidaDoEstadio, bonusObras, lojaConstruida, calculaVendas,
  type LojaSave, type PrecoLoja,
} from './loja'
import type { StadiumSave } from './estadiodata'
import { BICO_MARCAS, bicoValor, type BicoMarca, type BicoDiv } from './bico' // 🕴️ Bico de Folga
import MOLDE_CAMISA from './img/camisa-molde-v1.webp'
// 🎬 as duas telas da virada usam o MOLDE do Patrocinador Master (ll29/ll36) + as cenas
// novas (vitrine e carteira de trabalho), que moram em career-loja-cenas.css
import './career-sponsor-visual.css'
import './career-sponsor-office.css'
import './career-loja-cenas.css'
import { PassoPill, type PassoVirada } from './passo-virada'

const INK = '#0C0C0C', CREME = '#F4ECD6', GOLD = '#FFC400'
const OSW = { fontFamily: 'Oswald, sans-serif' } as const
const nomeDiv = (d: string) => (d === 'V' ? tr('Várzea', 'Sunday League') : `${tr('Série', 'Tier')} ${d}`)
const fmt = (n: number) => n.toLocaleString(tr('pt-BR', 'en-US'))
const nomePreco = (k: PrecoLoja) => tr(PRECOS[k].nome, PRECO_EN[k])

// ── 🛡️ ESCUDO BASE ────────────────────────────────────────────────────────
// Pedido dele: *"o escudo base que sempre vem com a primeira letra ou algo do tipo
// pra pôr no peito, com alguma cor também o escudo"*.
// Nasce da LETRA do clube + as 2 cores do dono, e é DESENHO EM CÓDIGO, não arquivo:
// seria um arquivo por clube e a regra de peso morria na hora (dezenas de milhares
// de carreiras). Assim custa 0 KB e serve pra qualquer nome que a pessoa inventar.
export function EscudoBase({ nome, cores, size = 44 }: { nome: string; cores?: [string, string]; size?: number }) {
  const L = (nome || '?').trim().charAt(0).toUpperCase()
  const [c1, c2] = cores ?? CORES_PADRAO
  const gid = `esc-${L}-${c1.slice(1)}-${c2.slice(1)}`
  return (
    <svg viewBox="0 0 100 114" width={Math.round(size * 100 / 114)} height={size}
      role="img" aria-label={tr(`Escudo do ${nome}`, `${nome} crest`)} style={{ display: 'block', overflow: 'visible', flex: 'none' }}>
      <defs><linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={c1} /><stop offset="1" stopColor={c2} />
      </linearGradient></defs>
      <path d="M50 3 L95 17 V60 C95 86 74 102 50 111 C26 102 5 86 5 60 V17 Z"
        fill={`url(#${gid})`} stroke={INK} strokeWidth={7} strokeLinejoin="round" />
      <path d="M9 34 H91" stroke={INK} strokeWidth={5} opacity={.85} />
      <text x="50" y="82" textAnchor="middle" style={{ ...OSW, fontWeight: 700, fontSize: 56, letterSpacing: -1 }}
        fill={CREME} stroke={INK} strokeWidth={5} paintOrder="stroke">{L}</text>
    </svg>
  )
}

// ── 👕 A CAMISA, montada ──────────────────────────────────────────────────
// `pos` em % de CADA arte. O molde do jogo (542×620) tem gola escura até 12%,
// faixa de cima 32→38%, faixa de baixo 42→48% e o corpo entre 21% e 79% da largura.
const POS_MOLDE = { escudoX: 64, escudoY: 27, fornX: 36, fornY: 27, masterX: 50, masterY: 61 }
// 👕 ARTE DE BATISMO: o enquadramento muda de clube pra clube — e MUITO. Tem arte
// só de camisa (Leite de Verdade, 588×760 → proporção 0,77) e tem arte de UNIFORME
// INTEIRO, com calção junto (Neymarzetti, 343×620 → 0,55). Com posição fixa em %,
// o patrocínio da barriga caía no CALÇÃO nas artes de uniforme inteiro — foi o que
// o Diego viu na tela dele em 15/09.
// O conserto sem tabela por clube: medir a proporção REAL do arquivo quando ele
// carrega e encolher as alturas na mesma medida. Arte só de camisa ≈ 0,80; abaixo
// disso, a camisa ocupa só a parte de cima da imagem.
const POS_BATISMO = { fornX: 33, fornY: 34, masterX: 50, masterY: 62 }
const PROP_SO_CAMISA = 0.80
// 🎨 A ESTAMPA TEM QUE LER EM QUALQUER TECIDO. As artes de batismo vão de branco
// (Final Boss) a preto (Neymarzetti) — com cor fixa, o nome do fornecedor sumia no
// manto escuro. Em vez de chutar, o jogo MEDE o brilho do pano no lugar exato onde a
// estampa vai cair, e escolhe tinta escura ou clara. Vale pra sempre, pra qualquer
// arte nova que chegar, sem tabela por clube.
// 🧵 devolve o brilho MÉDIO e o quanto ele VARIA no pedaço de pano medido.
// A variação é a parte nova (Diego 15/09, zoom da camisa do Futpoint: *"a logo N tá
// ficando MT legal.. acho q falta algum fundo pra dar um contraste"*): numa camisa LISA
// a média basta, mas numa LISTRADA ela dá "meio-termo" — e o logo acaba metade no preto
// e metade no branco, sumindo dos dois lados. Um halo único nunca resolve isso, porque
// o problema não é o brilho médio, é o contraste DENTRO da área da estampa.
function brilhoNoPonto(img: HTMLImageElement, xPct: number, yPct: number): { med: number; dp: number } | undefined {
  try {
    const c = document.createElement('canvas')
    c.width = 40; c.height = 40
    const ctx = c.getContext('2d', { willReadFrequently: true }); if (!ctx) return undefined
    const w = img.naturalWidth, h = img.naturalHeight
    const lado = Math.max(8, Math.round(Math.min(w, h) * 0.16))
    const sx = Math.max(0, Math.min(w - lado, Math.round(w * xPct / 100 - lado / 2)))
    const sy = Math.max(0, Math.min(h - lado, Math.round(h * yPct / 100 - lado / 2)))
    ctx.drawImage(img, sx, sy, lado, lado, 0, 0, 40, 40)
    const d = ctx.getImageData(0, 0, 40, 40).data
    const lums: number[] = []
    for (let i = 0; i < d.length; i += 4) {
      if (d[i + 3] < 120) continue // fora do desenho
      lums.push(0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2])
    }
    if (lums.length <= 20) return undefined
    const med = lums.reduce((a, b) => a + b, 0) / lums.length
    const dp = Math.sqrt(lums.reduce((a, b) => a + (b - med) ** 2, 0) / lums.length)
    return { med, dp }
  } catch { return undefined } // canvas bloqueado: segue no padrão
}
// acima disto o pano é LISTRADO (medido na camisa do Futpoint: variação 103 contra
// brilho médio 120 — o médio parecia cinza, mas o pano é preto-e-branco puro).
const LISTRADO_DP = 45
const ehListrado = (b?: { dp: number }): boolean => !!b && b.dp > LISTRADO_DP
/** tinta + jeito de misturar, pro pano medido */
function tintaDaEstampa(b?: { med: number; dp: number }): { cor: string; blend: 'multiply' | 'screen'; op: number } {
  if (b != null && b.med < 110) return { cor: '#F2F0EA', blend: 'screen', op: .92 } // pano ESCURO → tinta clara
  return { cor: '#20201C', blend: 'multiply', op: .95 }                              // pano CLARO → tinta escura
}
// 🖨️ SUB-BASE BRANCA (escolha do Diego, 15/09: *"B base branca ficou melhor"*).
// É o que a serigrafia de verdade faz: antes da cor, imprime uma base branca no
// FORMATO do desenho, pra tinta não ser comida pelo tecido. Aqui são quatro sombras
// coladas de 1px que, somadas, viram um contorno fino acompanhando o alfa do logo.
// 🚫 Ele descartou a TARJA RETANGULAR que eu tinha sugerido — nada de retângulo atrás
// da estampa sem ele pedir: *"teria q ser algo bem natural como se fosse silk na
// camisa msm. E N PowerPoint"*.
function subBaseBranca(alt: number): string {
  const u = Math.max(0.8, alt * 0.003).toFixed(2) // acompanha o tamanho da camisa na tela
  return `drop-shadow(0 0 ${u}px #fff) drop-shadow(0 0 ${u}px #fff) drop-shadow(0 0 ${u}px #fff) drop-shadow(0 0 ${u}px #fff) drop-shadow(0 1px ${(alt * 0.007).toFixed(2)}px rgba(0,0,0,.38))`
}
/** o quanto da ALTURA da imagem é a camisa (1 = a imagem é só a camisa) */
function fatorCamisa(ratio?: number): number {
  if (!ratio || !Number.isFinite(ratio)) return 1
  return Math.min(1, ratio / PROP_SO_CAMISA)
}

export function CamisaLoja({
  time, arteBatismo, cores, alt = 290, fornId, masterNome, masterLogo,
}: {
  time: string
  /** arquivo do manto do batismo (undefined = usa o molde do jogo) */
  arteBatismo?: string
  cores?: [string, string]
  alt?: number
  fornId?: string
  masterNome?: string
  masterLogo?: string
}) {
  const f = fornecedorDe(fornId)
  // 📏 proporção real do arquivo, lida quando a imagem carrega (ver POS_BATISMO)
  const [ratio, setRatio] = useState<number | undefined>(undefined)
  const [brilho, setBrilho] = useState<{ forn?: { med: number; dp: number }; master?: { med: number; dp: number } }>({})
  const fc = arteBatismo ? fatorCamisa(ratio) : 1
  const base = arteBatismo ? POS_BATISMO : POS_MOLDE
  const p = { ...base, fornY: base.fornY * fc, masterY: base.masterY * fc }
  const tintaForn = tintaDaEstampa(brilho.forn)
  const tintaMaster = tintaDaEstampa(brilho.master)
  const marca = (x: number, y: number, filho: React.ReactNode, extra?: React.CSSProperties) => (
    <div style={{ position: 'absolute', left: `${x}%`, top: `${y}%`, transform: 'translate(-50%,-50%)', ...extra }}>{filho}</div>
  )
  return (
    <div style={{ position: 'relative', height: alt, flex: 'none', isolation: 'isolate' }}>
      <img src={arteBatismo ?? MOLDE_CAMISA} alt={tr(`Camisa do ${time}`, `${time} shirt`)}
        onLoad={e => {
          const i = e.currentTarget
          if (!i.naturalHeight) return
          const r = i.naturalWidth / i.naturalHeight
          setRatio(r)
          const k = arteBatismo ? fatorCamisa(r) : 1
          setBrilho({ forn: brilhoNoPonto(i, base.fornX, base.fornY * k), master: brilhoNoPonto(i, base.masterX, base.masterY * k) })
        }}
        style={{ height: alt, display: 'block' }} />
      {/* 🛡️ escudo — só carimbado em quem NÃO tem batismo (no batismo já está na arte) */}
      {!arteBatismo && marca(POS_MOLDE.escudoX, POS_MOLDE.escudoY,
        <EscudoBase nome={time} cores={cores} size={Math.round(alt * 0.085)} />,
        { filter: 'drop-shadow(0 1px 2px rgba(0,0,0,.42))' })}
      {/* 👟 fornecedor no peito direito — marquinha de etiqueta, símbolo neutro */}
      {f && marca(p.fornX, p.fornY, <>
        <span style={{ fontSize: alt * 0.034, lineHeight: 1 }}>{f.simb}</span>
        <span style={{ ...OSW, fontWeight: 700, fontSize: alt * 0.022, lineHeight: 1, letterSpacing: .6, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{f.nome.split(' ')[0]}</span>
      </>, {
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: alt * 0.006,
        // a estampa tem que ENTRAR no tecido — texto colado por cima "parece PowerPoint"
        // 🧵 mesma regra do Master: no pano LISTRADO o blend COME a tinta em metade das
        // listras, então lá entra a sub-base branca em vez do blend.
        ...(ehListrado(brilho.forn)
          ? { color: '#141412', opacity: .97, filter: 'blur(.1px)', textShadow: '0 0 1px #fff, 0 0 1px #fff, 0 0 2px #fff, 0 0 3px rgba(255,255,255,.8)' }
          : { mixBlendMode: tintaForn.blend, opacity: tintaForn.op, filter: 'blur(.15px)', color: tintaForn.cor }),
      })}
      {/* 🤝 Master na barriga */}
      {(masterLogo || masterNome) && marca(p.masterX, p.masterY,
        masterLogo
          // 🔴 marca REAL entra em CORES de verdade. O `multiply` casa a estampa com o
          // tecido mas COME a cor do logo — o Diego pegou o vermelho da Vadico sumindo.
          ? <img src={masterLogo} alt={masterNome ?? ''} style={{
            maxWidth: alt * 0.20, maxHeight: alt * 0.155, width: 'auto', height: 'auto',
            display: 'block',
            // 🧵 pano LISTRADO → sub-base branca no formato do logo (escolha do Diego).
            // Pano liso ESCURO → o halo claro de sempre. Pano liso CLARO → sombra preta.
            filter: ehListrado(brilho.master)
              ? subBaseBranca(alt)
              : (brilho.master != null && brilho.master.med < 110)
                ? 'drop-shadow(0 0 2px rgba(255,255,255,.75)) drop-shadow(0 0 5px rgba(255,255,255,.35))'
                : 'drop-shadow(0 1px 1px rgba(0,0,0,.28))',
          }} />
          // 🖨️ marca genérica: o nome impresso, que tem que CABER no corpo da camisa
          : (() => {
            // 🖨️ marca SEM logo: o nome impresso. Tem que caber no CORPO da camisa —
            // e não pode quebrar sozinho de novo (virava 3 linhas e dominava a camisa).
            const palavras = (masterNome ?? '').split(' ')
            const linhas = (masterNome ?? '').length > 14
              ? (() => { const m = Math.ceil(palavras.length / 2); return [palavras.slice(0, m).join(' '), palavras.slice(m).join(' ')] })()
              : [masterNome ?? '']
            const maior = Math.max(...linhas.map(l => l.length))
            const fs = Math.max(alt * 0.026, Math.min(alt * 0.045, (alt * 0.26) / (maior * 0.55)))
            // 🧵 no pano LISTRADO a marca SEM logo tem o mesmo problema do logo: a
            // tinta some em metade das listras. Aqui a sub-base branca é feita com
            // text-shadow (o equivalente pra texto) e a tinta vira escura fixa.
            const listr = ehListrado(brilho.master)
            return <div style={{
              ...OSW, fontWeight: 700, lineHeight: 1.1, letterSpacing: .4, textAlign: 'center',
              textTransform: 'uppercase', color: listr ? '#141412' : tintaMaster.cor, fontSize: fs,
              ...(listr ? { textShadow: '0 0 1px #fff, 0 0 1px #fff, 0 0 2px #fff, 0 0 3px rgba(255,255,255,.8)' } : {}),
            }}>{linhas.map((l, i) => <div key={i} style={{ whiteSpace: 'nowrap' }}>{l}</div>)}</div>
          })(),
        masterLogo
          ? { opacity: .97, filter: 'blur(.15px)' }
          // no listrado o texto NÃO pode entrar em blend (é o blend que come a tinta)
          : ehListrado(brilho.master)
            ? { opacity: .97, filter: 'blur(.1px)' }
            : { mixBlendMode: tintaMaster.blend, opacity: tintaMaster.op, filter: 'blur(.15px)' })}
    </div>
  )
}

// ── 🏬 A VITRINE ──────────────────────────────────────────────────────────
// A camisa numa caixa branca é catálogo; loja é vitrine. Madeira escura, foco de
// luz quente e a placa em cima — tudo em degradê CSS, **0 KB**, então funciona com
// qualquer camisa sem arquivo novo.
function Vitrine({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      position: 'relative', overflow: 'hidden', border: `3px solid ${INK}`, borderRadius: 14,
      boxShadow: `3px 3px 0 ${INK}`, marginBottom: 9,
      background: `radial-gradient(120% 70% at 50% 4%, rgba(255,213,120,.42) 0%, rgba(255,196,0,.10) 38%, transparent 66%),
        linear-gradient(#2A1B10 0%, #40281680 34%, #1A0F08 100%),
        repeating-linear-gradient(90deg,#3A2414 0 26px,#331F11 26px 52px)`,
    }}>
      <div style={{ position: 'absolute', inset: '0 0 auto', height: 30, background: 'linear-gradient(#0B0704,#0B070400)', opacity: .85 }} />
      <div style={{ position: 'relative', textAlign: 'center', padding: '7px 0 2px' }}>
        <span style={{ ...OSW, fontWeight: 700, fontSize: 10, letterSpacing: '.22em', color: '#F0DFAE', textTransform: 'uppercase', textShadow: '0 1px 0 #000' }}>
          · {tr('Loja do Clube', 'Club Store')} ·
        </span>
      </div>
      <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', padding: '2px 10px 0', filter: 'drop-shadow(0 14px 16px rgba(0,0,0,.55))' }}>{children}</div>
      <div style={{ position: 'relative', height: 34, marginTop: -6, background: 'linear-gradient(#150C06,#0A0603)', borderTop: '2px solid #54351C' }} />
    </div>
  )
}

const Cartao = ({ titulo, children, pe, bg = '#fff' }: { titulo: string; children: React.ReactNode; pe?: React.ReactNode; bg?: string }) => (
  <div style={{ border: `3px solid ${INK}`, borderRadius: 13, background: bg, boxShadow: `3px 3px 0 ${INK}`, padding: '9px 10px', marginBottom: 9 }}>
    <div style={{ ...OSW, fontWeight: 700, fontSize: 11.5, textTransform: 'uppercase', marginBottom: 5 }}>{titulo}</div>
    {children}
    {pe && <div style={{ ...OSW, fontWeight: 400, fontSize: 10, opacity: .65, marginTop: 6, lineHeight: 1.4 }}>{pe}</div>}
  </div>
)

// ══════════════════════════════════════════════════════════════════════════
// 🛍️ A SUB-ABA
// ══════════════════════════════════════════════════════════════════════════
export function LojaTab({
  time, st, div, seasonNo, loja, masterNome, masterLogo, minhaCor,
  onIrEstrutura,
}: {
  time: string
  st: StadiumSave | undefined
  div: string
  seasonNo: number
  loja: LojaSave | undefined
  masterNome?: string
  masterLogo?: string
  minhaCor: string
  onIrEstrutura: () => void
}) {
  const arteFile = CAMISAS_SALAO[time]
  const arteBatismo = arteFile ? import.meta.env.BASE_URL + 'mantos-salao/' + arteFile : undefined
  const aberta = lojaConstruida(st)
  const forn = loja?.forn
  const ativo = fornAtivo(forn, seasonNo)
  const fornMeta = ativo ? fornecedorDe(forn.fornId) : undefined
  const preco: PrecoLoja = loja?.preco ?? 'normal'

  const camisa = (
    <CamisaLoja time={time} arteBatismo={arteBatismo}
      cores={loja?.cores} fornId={ativo ? forn.fornId : undefined}
      masterNome={masterNome} masterLogo={masterLogo} />
  )

  // ── 🔒 porta fechada: a loja é a obra do estádio que já existe ───────────
  if (!aberta) return (
    <section aria-label={tr('Loja do Clube', 'Club Store')}>
      <div style={{ position: 'relative', border: `3px solid ${INK}`, borderRadius: 14, boxShadow: `3px 3px 0 ${INK}`, marginBottom: 9, overflow: 'hidden', background: 'linear-gradient(#2A1B10,#140C06)' }}>
        <div style={{ padding: '26px 18px', textAlign: 'center' }}>
          <div style={{ fontSize: 40, lineHeight: 1, opacity: .55 }}>🔒</div>
          <div style={{ ...OSW, fontWeight: 700, fontSize: 15, color: '#F0DFAE', textTransform: 'uppercase', marginTop: 8 }}>
            {tr('A loja ainda não abriu', 'The store is not open yet')}</div>
          <div style={{ ...OSW, fontWeight: 400, fontSize: 11, color: '#D8CEB4', opacity: .85, marginTop: 5, lineHeight: 1.45 }}>
            {tr('Sua camisa existe, mas não tem onde vender.', 'Your shirt exists, but there is nowhere to sell it.')}<br />
            {/* 🔒 a trava explica O QUE falta — os DOIS degraus, não só o último */}
            {tr('Sem a loja não há venda de camisa nem fornecedor de material: marca de material patrocina quem vende.',
              'With no store there are no shirt sales and no kit supplier: a kit brand sponsors clubs that sell.')}</div>
        </div>
      </div>
      <Cartao titulo={tr('🔨 Como abrir', '🔨 How to open it')}
        pe={tr('Primeiro 2 setores do estádio prontos, depois a obra da loja. Com ela de pé, a partir da próxima temporada entram as vendas e o fornecedor.',
          'First 2 finished stands, then the store itself. With it up, from next season on the sales and the supplier kick in.')}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 34, height: 34, flex: 'none', border: `2.5px solid ${INK}`, borderRadius: 9, background: GOLD, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🛍️</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ ...OSW, fontWeight: 700, fontSize: 12.5 }}>🛍️ {tr('Loja do Clube', 'Club Store')} · 80 🪙</div>
            <div style={{ ...OSW, fontWeight: 400, fontSize: 10, opacity: .72 }}>{tr('precisa de 2 setores do estádio prontos', 'needs 2 finished stands')}</div>
          </div>
        </div>
        <button onClick={onIrEstrutura} style={{ width: '100%', border: `2.5px solid ${INK}`, borderRadius: 11, background: minhaCor, color: '#fff', ...OSW, fontWeight: 700, fontSize: 12, textTransform: 'uppercase', padding: 8, marginTop: 8, boxShadow: `2px 2px 0 ${INK}`, cursor: 'pointer' }}>
          {tr('Ir pra 🏗️ Estrutura', 'Go to 🏗️ Facilities')}</button>
      </Cartao>
      <Cartao titulo={tr('👕 E a camisa?', '👕 What about the shirt?')}
        pe={tr('A camisa continua sendo a sua, com escudo e patrocínios. A loja é só o lugar onde ela vira dinheiro.',
          'The shirt is still yours, with crest and sponsors. The store is just where it turns into money.')}>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4px 0' }}>
          <CamisaLoja time={time} arteBatismo={arteBatismo}
            cores={loja?.cores} alt={180} fornId={ativo ? forn.fornId : undefined}
            masterNome={masterNome} masterLogo={masterLogo} />
        </div>
      </Cartao>
    </section>
  )

  // ── 🛍️ LOJA ABERTA — SÓ LEITURA, e arrumada ────────────────────────────
  // Ordem do Diego (15/09): *"deixou visual mais organizado nas duas abas, de loja e
  // patrocínio, porque tava muito confuso"* e *"lá já é pra mostrar tudo que foi
  // escolhido e tudo que ele ganha"*. Então aqui NÃO tem botão de escolher nada:
  // é a vitrine + um resumo curto. Escolher preço e fornecedor é na virada.
  const b = loja?.balanco
  const p = PRECOS[preco]
  const linha = (rot: React.ReactNode, val: React.ReactNode) => (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, padding: '5px 0', borderTop: '1.5px solid rgba(0,0,0,.10)' }}>
      <span style={{ ...OSW, fontWeight: 400, fontSize: 11, opacity: .7, flex: 1, minWidth: 0 }}>{rot}</span>
      <span style={{ ...OSW, fontWeight: 700, fontSize: 12, textAlign: 'right' }}>{val}</span>
    </div>
  )
  return (
    <section aria-label={tr('Loja do Clube', 'Club Store')}>
      <Vitrine>{camisa}</Vitrine>

      {/* 📦 quanto rendeu no ano que fechou */}
      {b && (
        <Cartao bg={GOLD} titulo={tr(`📦 Última temporada (${b.season})`, `📦 Last season (${b.season})`)}
          pe={tr('O balanço fecha na virada e cai direto no caixa. Durante a temporada a loja trabalha calada.',
            'The balance closes at the season turn and goes straight into the bank. During the season the store works quietly.')}>
          <div style={{ ...OSW, fontWeight: 700, fontSize: 19, lineHeight: 1.15 }}>
            {fmt(b.camisas)} {tr('camisas', 'shirts')} · <span style={{ color: '#1B5E2A' }}>+{b.moedas} 🪙</span>
          </div>
          <div style={{ ...OSW, fontWeight: 400, fontSize: 10, opacity: .78, marginTop: 2 }}>
            {b.pos}º {tr('lugar', 'place')} · {tr('preço', 'price')} {nomePreco(b.preco)} · {fmt(b.torcida)} {tr('torcedores', 'fans')}
          </div>
        </Cartao>
      )}

      {/* 👕 a ficha do clube: tudo que está valendo, em linhas curtas */}
      <Cartao titulo={tr('👕 A sua camisa', '👕 Your shirt')}
        pe={arteBatismo
          ? tr('Clube batizado usa a arte que o dono mandou — o escudo já vem nela.', 'A named club uses the art its owner sent — the crest is already on it.')
          : tr('No peito esquerdo vai só o escudo do seu clube, sempre enquadrado igual.', 'The left chest carries only your club crest, always framed the same.')}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 2 }}>
          {!arteBatismo && <EscudoBase nome={time} cores={loja?.cores} size={34} />}
          <div style={{ ...OSW, fontWeight: 700, fontSize: 13, flex: 1, minWidth: 0 }}>{time}</div>
          <div style={{ ...OSW, fontWeight: 400, fontSize: 10.5, opacity: .7 }}>{nomeDiv(div)}</div>
        </div>
        {linha(<>👥 {tr('Torcida', 'Fan base')}</>, <>{fmt(torcidaDoEstadio(st))}{bonusObras(st) > 0 && <span style={{ fontWeight: 400, fontSize: 10, opacity: .7 }}> · {tr('obras', 'works')} +{Math.round(bonusObras(st) * 100)}%</span>}</>)}
        {linha(<>👟 {tr('Fornecedor', 'Kit supplier')}</>, ativo && fornMeta
          ? <>{fornMeta.simb} {fornMeta.nome} <span style={{ fontWeight: 400, fontSize: 10, opacity: .7 }}>· {tr('ano', 'yr')} {fornAnoAtual(forn, seasonNo)}/{forn.anos} · +{fornValor(forn)} 🪙 · +{Math.round(fornBonusLoja(forn) * 100)}%</span></>
          : <span style={{ fontWeight: 400, opacity: .6 }}>{tr('nenhum', 'none')}</span>)}
        {linha(<>🤝 {tr('Master', 'Master')}</>, masterNome
          ? <>{masterNome}</>
          : <span style={{ fontWeight: 400, opacity: .6 }}>{tr('nenhum', 'none')}</span>)}
        {/* ⚠️ "Preço do ano" NÃO: corte do Diego (15/09) — *"ninguém entende o que quis
            dizer com isso"*. Lido solto, parece o quanto o clube ganhou no ano. É o
            PREÇO QUE A TORCIDA PAGA na camisa, então o rótulo diz isso, com o "cada"
            colado no valor pra não sobrar dúvida. */}
        {linha(<>👕 {tr('A torcida paga', 'Fans pay')}</>,
          <>{p.moeda} 🪙 <span style={{ fontWeight: 400, fontSize: 10, opacity: .7 }}>{tr('por camisa', 'per shirt')} · {nomePreco(preco)}</span></>)}
      </Cartao>

      {/* 🧭 onde se decide — uma linha, sem botão de escolher aqui */}
      <div style={{ ...OSW, fontWeight: 400, fontSize: 10.5, lineHeight: 1.5, opacity: .72, padding: '0 3px 4px' }}>
        {tr('Preço da camisa e contrato de material você escolhe na virada da temporada, junto com o Master e o Pontual. Esta aba é só pra ver como o seu clube está.',
          'You pick the shirt price and the kit deal at the season turn, along with the Master and the one-season sponsor. This tab is just to see how your club looks.')}
      </div>
    </section>
  )
}


// ══════════════════════════════════════════════════════════════════════════
// 🪜 O MOLDE DOS PASSOS DA VIRADA (Diego, 15/09)
// ══════════════════════════════════════════════════════════════════════════
// Palavras dele: *"quero padronizado passo a passo igual já ocorre hoje quando abre
// patrocinador Master, depois patrocinador pontual, depois material esportivo, depois
// venda de camisas e depois o bico"*, com *"visuais parecidos com o que já existe"*.
//
// Então a 🛍️ camisa e o 🕴️ bico deixaram de ser duas caixinhas brancas fora do padrão
// e passaram a usar a MESMA casca do Patrocinador Master: `ll29-sponsor ll36-sponsor`
// (cabeçalho escuro → os papéis → a CENA quadrada → a barra com o botão de assinar).
// O que muda é só a cena, desenhada em `career-loja-cenas.css`.

/** 📏 mede a cena pra camisa nascer grande em qualquer tela sem estourar.
 *  A cena é quadrada (aspect-ratio 1), então 66% da largura sobra espaço certo pra
 *  placa em cima e o chão embaixo. Sem isso teria que chutar um número em px — e no
 *  celular estreito a camisa vazaria. */
function useLarguraDaCena() {
  const ref = useRef<HTMLDivElement>(null)
  const [larg, setLarg] = useState(0)
  useEffect(() => {
    const el = ref.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(() => setLarg(el.clientWidth))
    ro.observe(el)
    setLarg(el.clientWidth)
    return () => ro.disconnect()
  }, [])
  return { ref, larg }
}

// ══════════════════════════════════════════════════════════════════════════
// 🛍️ PASSO — VENDA DE CAMISAS (o preço desta temporada)
// ══════════════════════════════════════════════════════════════════════════
// Aparece TODA temporada, porque é aposta (o Master e o fornecedor só voltam quando o
// contrato acaba). Escolheu, some — *"depois não fica info na home mais, ali é só pra
// tomar as decisões"*. E não trava o "Começar a temporada".
export function PrecoVirada({
  time, div, st, seasonNo, loja, masterNome, masterLogo, onPreco, passo,
}: {
  time: string; div: string; st: StadiumSave | undefined; seasonNo: number
  loja: LojaSave | undefined; masterNome?: string; masterLogo?: string
  onPreco: (p: PrecoLoja) => void
  passo?: PassoVirada
}) {
  const forn = loja?.forn
  const ativo = fornAtivo(forn, seasonNo)
  const arteFile = CAMISAS_SALAO[time]
  const arteBatismo = arteFile ? import.meta.env.BASE_URL + 'mantos-salao/' + arteFile : undefined
  const [sel, setSel] = useState<PrecoLoja>(loja?.preco ?? PRECO_PADRAO)
  const { ref, larg } = useLarguraDaCena()
  const altCamisa = Math.max(140, Math.round((larg || 420) * 0.66))
  const p = PRECOS[sel]
  // as duas pontas da aposta, com a conta REAL: se só se manteve × se for campeão
  const rManteve = calculaVendas({ st, pos: 10, preco: sel, fornLoja: fornBonusLoja(forn) })
  const rCampeao = calculaVendas({ st, pos: 1, preco: sel, fornLoja: fornBonusLoja(forn) })
  const QUANDO: Record<PrecoLoja, { pt: string; en: string }> = {
    popular: { pt: 'se só se manter', en: 'if you just stay up' },
    normal: { pt: 'se pegar o acesso', en: 'if you go up' },
    cara: { pt: 'se for campeão', en: 'if you win it' },
  }
  const EXPLICA: Record<PrecoLoja, { pt: string; en: string }> = {
    popular: {
      pt: 'Camisa barata: a torcida toda leva, sobra pouco por peça — é a que menos sente um ano morno.',
      en: 'Cheap shirt: everyone buys one, little left per piece — the one that least minds a quiet year.',
    },
    normal: { pt: 'O meio-termo: vende bem e rende bem, sem depender de um ano perfeito.', en: 'The middle ground: sells well and pays well, without needing a perfect year.' },
    cara: { pt: 'Pouca gente leva, mas cada uma vale ouro — num ano de campeão ela rende o dobro.', en: 'Few people buy it, but each one is gold — in a title year it pays double.' },
  }
  return (
    <section className="ll29-sponsor ll36-sponsor" aria-label={tr('Preço da camisa', 'Shirt price')}>
      <header>
        <PassoPill passo={passo} />
        <small>{nomeDiv(div).toUpperCase()} · {tr('TEMPORADA', 'SEASON')} {seasonNo}</small>
        <h2>{tr('VENDA DE CAMISAS', 'SHIRT SALES')}</h2>
        <p>{tr('A sua camisa na vitrine. Escolha o preço desta temporada.', 'Your shirt in the window. Pick this season\'s price.')}</p>
      </header>
      <div className="ll37-papeis">
        {(['popular', 'normal', 'cara'] as PrecoLoja[]).map(k => (
          <button key={k} onClick={() => setSel(k)} aria-pressed={sel === k}>
            <span className="chapeu">{tr('PREÇO DA CAMISA', 'SHIRT PRICE')}</span>
            <span className="nome">{nomePreco(k)}</span>
            <span className="moeda">{PRECOS[k].moeda} 🪙</span>
            <span className="quando">{tr(QUANDO[k].pt, QUANDO[k].en)}</span>
          </button>
        ))}
      </div>
      <div className="ll37-vitrine" ref={ref}>
        <span className="ll37-placa">· {tr('Loja do Clube', 'Club Shop')} ·</span>
        <div className="ll37-arara">
          <CamisaLoja time={time} arteBatismo={arteBatismo} cores={loja?.cores} alt={altCamisa}
            fornId={ativo ? forn.fornId : undefined} masterNome={masterNome} masterLogo={masterLogo} />
          <div className="ll37-etiqueta">
            <span>{tr('preço', 'price')}</span>
            <b>{p.moeda} 🪙</b>
            <span>{nomePreco(sel)}</span>
          </div>
        </div>
        <div className="ll37-chao" />
        {/* 💰 OS DOIS FINAIS, LADO A LADO — e escrito que é UM OU OUTRO.
            ⚠️ POR QUE ASSIM: antes a cena mostrava só o número de campeão e a barra de
            baixo soltava o de meio de tabela numa frase. Dois números na mesma tela, sem
            dizer a relação, e o pessoal leu como SOMA — um jogador perguntou ao Diego na
            live: *"se eu for campeão é 79+103?"*. Ele trouxe: *"não consegui entender
            esses valores, e quem tá lendo não tá claro também, porque tem dois valores na
            tela e a info não tá clara"*. Agora os dois moram juntos, com o rótulo
            explicando que dependem de como a temporada terminar. */}
        <div className="ll37-finais">
          <div className="tit">{tr('O QUE ENTRA NO FIM DA TEMPORADA', 'WHAT YOU GET AT THE END OF THE SEASON')}</div>
          <div className="ln">
            <span className="q">🏆 {tr('se for campeão', 'if you win it')}</span>
            <span className="v">+{rCampeao.moedas} 🪙</span>
          </div>
          <div className="ln">
            <span className="q">🛡️ {tr('se ficar no meio da tabela', 'if you finish mid-table')}</span>
            <span className="v">+{rManteve.moedas} 🪙</span>
          </div>
          <div className="pe">{tr('um OU outro — não soma. Depende de como a sua temporada terminar.',
            'one OR the other — they do not add up. It depends on how your season ends.')}</div>
        </div>
      </div>
      <div className="ll29-sponsor-bottom">
        <p>{tr(EXPLICA[sel].pt, EXPLICA[sel].en)}{' '}
          {tr(`Campeão, a torcida leva ~${fmt(rCampeao.camisas)} camisas.`, `As champion, the fans buy ~${fmt(rCampeao.camisas)} shirts.`)}</p>
        <button onClick={() => onPreco(sel)}>
          ✍️ {tr('CONFIRMAR O PREÇO', 'CONFIRM THE PRICE')} · {nomePreco(sel).toUpperCase()}
        </button>
        <small>{tr('O balanço chega na abertura da temporada seguinte. Dá pra começar a temporada sem mexer aqui.',
          'The balance arrives when the next season opens. You can start the season without touching this.')}</small>
      </div>
    </section>
  )
}

// ══════════════════════════════════════════════════════════════════════════
// 🕴️ PASSO — BICO DE FOLGA (a carteira de trabalho)
// ══════════════════════════════════════════════════════════════════════════
// Quando aparece (regra fechada pelo Diego em 15/09): *"o bico, depois de escolhido, só
// troca se subir de divisão ou cair"*. Quem decide isso é a virada (`pyramidseason`);
// aqui a tela só desenha. Se ele JÁ tem bico e a divisão mudou, a empresa atual vem
// pré-escolhida — continuar onde está é um clique só.
//
// 👷 A CENA é a carteira de trabalho, e o selo da capa é emoji de TRABALHADOR: *"não
// coloque a logo de uma bola na carteira, coloque um emoji de trabalhador ou obras"*.
export function BicoVirada({
  div, atual, esnobou, seasonNo, onPick, passo,
}: {
  div: string; atual?: BicoMarca; esnobou?: boolean; seasonNo?: number
  onPick: (b: BicoMarca) => void
  passo?: PassoVirada
}) {
  const [sel, setSel] = useState<BicoMarca | undefined>(atual)
  const esc = BICO_MARCAS.find(b => b.k === sel)
  const valor = bicoValor(div, esnobou)
  const dv = (['V', 'D', 'C'].includes(div) ? div : 'V') as BicoDiv
  const cargo = esc ? tr(esc.cargos[dv].pt, esc.cargos[dv].en) : undefined
  // 📖 a história muda com o momento: quem volta depois de ter esnobado lê a volta
  // humilde; quem está começando lê por que ele faz isso da vida.
  const historia = esc ? (esnobou ? tr(esc.volta.pt, esc.volta.en) : tr(esc.historia.pt, esc.historia.en)) : undefined
  return (
    <section className="ll29-sponsor ll36-sponsor" aria-label={tr('Bico de folga', 'Side job')}>
      <header>
        <PassoPill passo={passo} />
        <small>{nomeDiv(div).toUpperCase()}{seasonNo ? ` · ${tr('TEMPORADA', 'SEASON')} ${seasonNo}` : ''}</small>
        <h2>{tr('BICO DE FOLGA', 'SIDE JOB')}</h2>
        <p>{atual
          ? tr('A divisão mudou e o cargo muda junto. Continue onde está ou assine em outra.',
            'Your division changed and so does the job title. Stay where you are or sign elsewhere.')
          : tr('Nas folgas você trabalha pra ajudar o caixa do clube. Escolha onde.',
            'On your days off you work to help the club\'s till. Pick where.')}</p>
      </header>
      <div className="ll37-papeis">
        {BICO_MARCAS.map(b => (
          <button key={b.k} onClick={() => setSel(b.k)} aria-pressed={sel === b.k}>
            <span className="emo">{b.ic}</span>
            <span className="nome">{b.nome}</span>
            <span className="cargo">{tr(b.cargos[dv].pt, b.cargos[dv].en)}</span>
          </button>
        ))}
      </div>
      <div className="ll37-cena-bico">
        <div className="ll37-carteira">
          <div className="capa">
            <div className="selo">👷</div>
            <b>{tr('CARTEIRA', 'WORK')}<br />{tr('DE TRABALHO', 'RECORD BOOK')}</b>
            {/* ⚠️ NADA de "previdência do técnico" aqui. Corte do Diego (15/09): *"não
                quero na carteira de trabalho escrito previdência de técnico, porque dá
                a entender que é carteira de trabalho do futebol, e estamos falando de
                bico apenas aqui"*. A carteira é do EMPREGO DE FORA — o clube não tem
                nada a ver com ela. */}
            <i>{tr('REGISTRO DO', 'RECORD OF THE')}<br />{tr('BICO DE FOLGA', 'SIDE JOB')}</i>
            <div className="num">{tr('Nº', 'No.')} {String(1000 + (seasonNo ?? 1)).slice(1)}-{2020 + (seasonNo ?? 1)}</div>
          </div>
          <div className="pagina">
            <div className="tit">{tr('CONTRATO DE TRABALHO', 'EMPLOYMENT CONTRACT')}</div>
            <div className="campo"><span>{tr('EMPREGADOR', 'EMPLOYER')}</span><b>{esc?.nome ?? '—'}</b></div>
            <div className="campo"><span>{tr('CARGO', 'ROLE')}</span><b>{cargo ?? tr('a escolher', 'to be picked')}</b></div>
            <div className="campo"><span>{tr('ADMISSÃO', 'START')}</span><b>T{seasonNo ?? 1} · {nomeDiv(div)}</b></div>
            <div className="salario">
              <span>{tr('REMUNERAÇÃO', 'PAY')}</span>
              <b>+{valor} 🪙</b>
              <i>{tr('por temporada', 'per season')}</i>
            </div>
            <div className="assina">
              {tr('assinatura do empregador', 'employer signature')}
              {esc && <span className="carimbo">{tr('ANOTADO', 'FILED')}</span>}
            </div>
          </div>
        </div>
      </div>
      <div className="ll29-sponsor-bottom">
        <p>{historia ? `“${historia}”` : tr('Toque numa empresa acima pra ler a história e ver o cargo.', 'Tap a company above to read the story and see the role.')}</p>
        <button disabled={!esc} onClick={() => esc && onPick(esc.k)}>
          {esc ? `✍️ ${tr('ASSINAR A CARTEIRA', 'SIGN THE BOOK')} · ${esc.nome.toUpperCase()}` : tr('ESCOLHA UMA EMPRESA ACIMA', 'PICK A COMPANY ABOVE')}
        </button>
        <small>{tr('Na Série B pra cima ele larga o bico. Dá pra começar a temporada sem mexer aqui.',
          'From Série B up he quits the side job. You can start the season without touching this.')}</small>
      </div>
    </section>
  )
}

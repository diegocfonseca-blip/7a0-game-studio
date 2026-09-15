// ─── 🛍️ LOJA DO CLUBE — a tela (sub-aba 🏟️ Clube › 🛍️ Loja) ──────────────
// Aprovada pelo Diego em 15/09, em TESTE FECHADO na conta dele (`LOJA_TESTERS`
// em `sport.ts`). Nenhum outro jogador vê a pílula nem sente diferença.
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

import { useState } from 'react'
import { tr } from './lang'
import { CAMISAS_SALAO } from './salao-camisas'
import {
  FORNECEDORES, PRECOS, PRECO_EN, CORES_PADRAO,
  fornPorTemporada, fornLiberado, fornecedorDe, fornAtivo, fornAnoAtual, fornValor,
  torcidaDoEstadio, bonusObras, lojaConstruida, calculaVendas,
  type LojaSave, type PrecoLoja,
} from './loja'
import type { StadiumSave } from './estadiodata'
import { BICO_MARCAS, BICO_VALOR, type BicoMarca } from './bico' // 🕴️ Bico de Folga
import MOLDE_CAMISA from './img/camisa-molde-v1.webp'

const INK = '#0C0C0C', CREME = '#F4ECD6', GOLD = '#FFC400', GREEN = '#1B7A3D'
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
function brilhoNoPonto(img: HTMLImageElement, xPct: number, yPct: number): number | undefined {
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
    let soma = 0, n = 0
    for (let i = 0; i < d.length; i += 4) {
      if (d[i + 3] < 120) continue // fora do desenho
      soma += 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]; n++
    }
    return n > 20 ? soma / n : undefined
  } catch { return undefined } // canvas bloqueado: segue no padrão
}
/** tinta + jeito de misturar, pro pano medido */
function tintaDaEstampa(brilho?: number): { cor: string; blend: 'multiply' | 'screen'; op: number } {
  if (brilho != null && brilho < 110) return { cor: '#F2F0EA', blend: 'screen', op: .92 } // pano ESCURO → tinta clara
  return { cor: '#20201C', blend: 'multiply', op: .95 }                                    // pano CLARO → tinta escura
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
  const [brilho, setBrilho] = useState<{ forn?: number; master?: number }>({})
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
        mixBlendMode: tintaForn.blend, opacity: tintaForn.op, filter: 'blur(.15px)', color: tintaForn.cor,
      })}
      {/* 🤝 Master na barriga */}
      {(masterLogo || masterNome) && marca(p.masterX, p.masterY,
        masterLogo
          // 🔴 marca REAL entra em CORES de verdade. O `multiply` casa a estampa com o
          // tecido mas COME a cor do logo — o Diego pegou o vermelho da Vadico sumindo.
          ? <img src={masterLogo} alt={masterNome ?? ''} style={{
            maxWidth: alt * 0.20, maxHeight: alt * 0.155, width: 'auto', height: 'auto',
            display: 'block',
            // em pano escuro a sombra preta some; um halo claro devolve o contorno
            filter: (brilho.master != null && brilho.master < 110)
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
            return <div style={{
              ...OSW, fontWeight: 700, lineHeight: 1.1, letterSpacing: .4, textAlign: 'center',
              textTransform: 'uppercase', color: tintaMaster.cor, fontSize: fs,
            }}>{linhas.map((l, i) => <div key={i} style={{ whiteSpace: 'nowrap' }}>{l}</div>)}</div>
          })(),
        masterLogo ? { opacity: .97, filter: 'blur(.15px)' } : { mixBlendMode: tintaMaster.blend, opacity: tintaMaster.op, filter: 'blur(.15px)' })}
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
          ? <>{fornMeta.simb} {fornMeta.nome} <span style={{ fontWeight: 400, fontSize: 10, opacity: .7 }}>· {tr('ano', 'yr')} {fornAnoAtual(forn, seasonNo)}/{forn.anos} · +{fornValor(forn)} 🪙 · +{Math.round(fornMeta.loja * 100)}%</span></>
          : <span style={{ fontWeight: 400, opacity: .6 }}>{tr('nenhum', 'none')}</span>)}
        {linha(<>🤝 {tr('Master', 'Master')}</>, masterNome
          ? <>{masterNome}</>
          : <span style={{ fontWeight: 400, opacity: .6 }}>{tr('nenhum', 'none')}</span>)}
        {linha(<>💰 {tr('Preço do ano', 'Price this season')}</>, <>{nomePreco(preco)} · {p.moeda} 🪙</>)}
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
// 🛍️ A LOJA NA VIRADA DA TEMPORADA
// ══════════════════════════════════════════════════════════════════════════
// Cobrança do Diego (15/09): *"ainda não apareceu nada pro meu usuário sobre a
// loja, camisas e etc, após o Master, pontual e etc"*. Ele tem razão — eu tinha
// posto tudo só na ABA, e a DECISÃO da temporada acontece na fila de início,
// junto do Master e do Pontual.
//
// A ordem é a que ele mesmo desenhou lá atrás:
//   1) 📦 o BALANÇO da temporada que acabou (aparece uma vez só, aqui);
//   2) 👟 o FORNECEDOR — aviso de uma linha se o contrato corre; os 4 papéis se acabou;
//   3) 💰 o PREÇO da camisa do ano novo, que é a aposta.
// ⏱️ Nada disso ATRASA a virada: o preço já vem escolhido (Normal) e o fornecedor
// só pede decisão quando o contrato termina. Quem não quiser mexer, só desce e
// aperta "Começar a temporada" — regra de ouro dele.
export function LojaVirada({
  time, st, div, seasonNo, loja, masterNome, masterLogo,
  onPreco, onFornecedor, onIrEstrutura,
}: {
  time: string; st: StadiumSave | undefined; div: string; seasonNo: number
  loja: LojaSave | undefined; masterNome?: string; masterLogo?: string
  onPreco: (p: PrecoLoja) => void
  onFornecedor: (fornId: string) => void
  onIrEstrutura: () => void
}) {
  const aberta = lojaConstruida(st)
  const b = loja?.balanco
  const forn = loja?.forn
  const ativo = fornAtivo(forn, seasonNo)
  const fornMeta = ativo ? fornecedorDe(forn.fornId) : undefined
  const preco: PrecoLoja = loja?.preco ?? 'normal'
  const arteFile = CAMISAS_SALAO[time]
  const arteBatismo = arteFile ? import.meta.env.BASE_URL + 'mantos-salao/' + arteFile : undefined

  // 🔒 loja não construída: UMA linha discreta, com o caminho. Nada de bloquear a
  // virada por uma coisa que ele ainda nem comprou.
  if (!aberta) return (
    <div style={{ ...OSW, border: `3px solid ${INK}`, borderRadius: 13, background: '#fff', boxShadow: `3px 3px 0 ${INK}`, padding: '9px 11px', marginBottom: 12 }}>
      <div style={{ fontWeight: 700, fontSize: 12 }}>🛍️ {tr('Loja do Clube', 'Club Store')}</div>
      <div style={{ fontWeight: 400, fontSize: 10.5, opacity: .7, marginTop: 2, lineHeight: 1.45 }}>
        {tr('Ainda não existe. Construa a obra no estádio (2 setores prontos + 80 🪙) e você passa a vender camisa e a receber fornecedor de material.',
          'Not built yet. Put up the stand at the stadium (2 finished stands + 80 🪙) and you start selling shirts and getting a kit supplier.')}
      </div>
      <button onClick={onIrEstrutura} style={{ width: '100%', marginTop: 8, border: `2.5px solid ${INK}`, borderRadius: 11, padding: 8, ...OSW, fontWeight: 700, fontSize: 11.5, textTransform: 'uppercase', background: GOLD, color: INK, boxShadow: `2px 2px 0 ${INK}`, cursor: 'pointer' }}>
        {tr('Ir pra 🏗️ Estrutura', 'Go to 🏗️ Facilities')}
      </button>
    </div>
  )

  return (
    <div style={{ marginBottom: 12 }}>
      {/* 1) 📦 o balanço do ano que acabou */}
      {b && b.season < seasonNo && (
        <div style={{ ...OSW, border: `3px solid ${INK}`, borderRadius: 13, background: GOLD, boxShadow: `3px 3px 0 ${INK}`, padding: '10px 12px', marginBottom: 10 }}>
          <div style={{ fontWeight: 700, fontSize: 11.5, textTransform: 'uppercase' }}>
            📦 {tr(`Balanço da loja · temporada ${b.season}`, `Store balance · season ${b.season}`)}
          </div>
          <div style={{ fontWeight: 700, fontSize: 21, lineHeight: 1.15, marginTop: 3 }}>
            {fmt(b.camisas)} {tr('camisas', 'shirts')} · <span style={{ color: '#1B5E2A' }}>+{b.moedas} 🪙</span>
          </div>
          <div style={{ fontWeight: 400, fontSize: 10, opacity: .78, marginTop: 2 }}>
            {fmt(b.torcida)} {tr('torcedores', 'fans')} · {b.pos}º {tr('lugar', 'place')} · {tr('preço', 'price')} {nomePreco(b.preco)} · {tr('já caiu no caixa', 'already in the bank')}
          </div>
        </div>
      )}

      {/* 2) 👟 o fornecedor: aviso se corre, decisão se acabou */}
      {ativo && fornMeta ? (
        <div style={{ ...OSW, border: `3px solid ${INK}`, borderRadius: 13, background: '#fff', boxShadow: `3px 3px 0 ${INK}`, padding: '9px 11px', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 9 }}>
          <div style={{ width: 32, height: 32, flex: 'none', border: `2.5px solid ${INK}`, borderRadius: 9, background: fornMeta.cor, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>{fornMeta.simb}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 12.5 }}>👟 {fornMeta.nome}</div>
            <div style={{ fontWeight: 400, fontSize: 10, opacity: .72 }}>
              {tr('ano', 'year')} {fornAnoAtual(forn, seasonNo)} {tr('de', 'of')} {forn.anos} · +{fornValor(forn)} 🪙/{tr('temp', 'seas')} · {tr('nada pra decidir', 'nothing to decide')}
            </div>
          </div>
        </div>
      ) : (
        <FornecedorPapeis div={div} onPick={onFornecedor} />
      )}

      {/* 3) 💰 o preço da camisa, com a camisa do lado pra ele ver o que vai vender */}
      <div style={{ ...OSW, border: `3px solid ${INK}`, borderRadius: 13, background: '#fff', boxShadow: `3px 3px 0 ${INK}`, padding: '10px 11px' }}>
        <div style={{ fontWeight: 700, fontSize: 11.5, textTransform: 'uppercase', marginBottom: 6 }}>
          💰 {tr('Preço da camisa · temporada', 'Shirt price · season')} {seasonNo}
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <div style={{ flex: 'none' }}>
            <CamisaLoja time={time} arteBatismo={arteBatismo} cores={loja?.cores} alt={118}
              fornId={ativo ? forn.fornId : undefined} masterNome={masterNome} masterLogo={masterLogo} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {(['popular', 'normal', 'cara'] as PrecoLoja[]).map(k => {
                const r = calculaVendas({ st, pos: 10, preco: k, fornLoja: fornMeta?.loja ?? 0 })
                const rc = calculaVendas({ st, pos: 1, preco: k, fornLoja: fornMeta?.loja ?? 0 })
                return (
                  <button key={k} onClick={() => onPreco(k)} aria-pressed={preco === k}
                    style={{ width: '100%', textAlign: 'left', border: `2.5px solid ${INK}`, borderRadius: 10, padding: '5px 8px', cursor: 'pointer', background: preco === k ? GOLD : CREME, boxShadow: preco === k ? `2px 2px 0 ${INK}` : 'none' }}>
                    <div style={{ ...OSW, fontWeight: 700, fontSize: 11.5, textTransform: 'uppercase' }}>{nomePreco(k)} · {PRECOS[k].moeda} 🪙</div>
                    <div style={{ ...OSW, fontWeight: 400, fontSize: 9.5, opacity: .75, lineHeight: 1.25 }}>
                      🛡️ {r.moedas} · 👑 {rc.moedas} {tr('moedas', 'coins')}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
        <div style={{ ...OSW, fontWeight: 400, fontSize: 9.5, opacity: .7, marginTop: 7, lineHeight: 1.4 }}>
          {tr('🛡️ se você só se manter · 👑 se for campeão. Se cair, não vende nada. Dá pra deixar como está e começar a temporada.',
            '🛡️ if you just stay up · 👑 if you win it. Relegated means nothing sells. You can leave it as is and start the season.')}
        </div>
      </div>
    </div>
  )
}

/** os 4 contratos de material, versão compacta pra fila de início de temporada */
function FornecedorPapeis({ div, onPick }: { div: string; onPick: (id: string) => void }) {
  const [sel, setSel] = useState<string | undefined>(undefined)
  const esc = FORNECEDORES.find(f => f.id === sel)
  return (
    <div style={{ ...OSW, border: `3px solid ${INK}`, borderRadius: 13, background: '#fff', boxShadow: `3px 3px 0 ${INK}`, padding: '10px 11px', marginBottom: 10 }}>
      <div style={{ fontWeight: 700, fontSize: 11.5, textTransform: 'uppercase' }}>👟 {tr('Fornecedor de material', 'Kit supplier')}</div>
      <div style={{ fontWeight: 400, fontSize: 10, opacity: .7, margin: '2px 0 7px', lineHeight: 1.4 }}>
        {tr('Quem veste o seu time. O valor trava na sua divisão de hoje e não muda se você subir ou cair.',
          'Who kits out your team. The amount locks in at your current division and does not change if you go up or down.')}
      </div>
      {FORNECEDORES.map(f => {
        const ok = fornLiberado(f, div)
        const v = fornPorTemporada(div, f.anos)
        return (
          <button key={f.id} disabled={!ok} onClick={() => ok && setSel(f.id)} aria-pressed={sel === f.id}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, border: `2.5px solid ${sel === f.id ? '#7C3AED' : INK}`, borderRadius: 11, padding: '6px 8px', marginBottom: 5, textAlign: 'left', cursor: ok ? 'pointer' : 'not-allowed', background: !ok ? '#CBBF9E' : sel === f.id ? GOLD : CREME, opacity: ok ? 1 : .8, boxShadow: ok ? `2px 2px 0 ${INK}` : 'none' }}>
            <div style={{ width: 28, height: 28, flex: 'none', border: `2.5px solid ${INK}`, borderRadius: 8, background: ok ? f.cor : '#8A836E', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>{f.simb}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ ...OSW, fontWeight: 700, fontSize: 12.5, lineHeight: 1.1 }}>{f.nome}</div>
              <div style={{ ...OSW, fontWeight: 400, fontSize: 9.5, opacity: .75, lineHeight: 1.25 }}>
                {ok ? `${f.anos} ${f.anos > 1 ? tr('temporadas', 'seasons') : tr('temporada', 'season')} · +${Math.round(f.loja * 100)}% ${tr('na loja', 'on store')}`
                  : tr(`só fecha da ${nomeDiv(f.desde)} pra cima — suba de divisão`, `only signs from ${nomeDiv(f.desde)} up — go up a division`)}
              </div>
            </div>
            <div style={{ textAlign: 'right', flex: 'none' }}>
              <div style={{ ...OSW, fontWeight: 700, fontSize: 14, lineHeight: 1 }}>{ok ? `${v} 🪙` : '🔒'}</div>
              {ok && <div style={{ ...OSW, fontWeight: 400, fontSize: 8.5, opacity: .7 }}>{v * f.anos} {tr('no total', 'total')}</div>}
            </div>
          </button>
        )
      })}
      <button disabled={!esc} onClick={() => esc && onPick(esc.id)}
        style={{ width: '100%', marginTop: 4, border: `3px solid ${INK}`, borderRadius: 12, padding: '9px 10px', ...OSW, fontWeight: 700, fontSize: 12.5, textTransform: 'uppercase', background: esc ? GOLD : '#cfc6ae', color: esc ? INK : 'rgba(0,0,0,.45)', boxShadow: `3px 3px 0 ${INK}`, cursor: esc ? 'pointer' : 'default' }}>
        {esc ? `✍️ ${tr('Assinar', 'Sign')} · ${esc.nome}` : tr('Escolha uma marca acima', 'Pick a brand above')}
      </button>
      <div style={{ ...OSW, fontWeight: 400, fontSize: 9.5, opacity: .7, marginTop: 6, lineHeight: 1.4 }}>
        {tr('Pode deixar pra depois: dá pra assinar em 🤝 Patrocínio a qualquer hora. Sem marca, o peito direito fica vazio e a loja vende sem bônus.',
          'You can leave it for later: you can sign in 🤝 Sponsors any time. With no brand the right chest stays empty and the store sells with no bonus.')}
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════
// 🕴️ BICO DE FOLGA na virada da temporada
// ══════════════════════════════════════════════════════════════════════════
// Pedido do Diego (15/09): *"o bico também deveria aparecer uma vez nesse início
// também… mas só quando precisar"* e *"quero a historinha dizendo o porquê e o que
// ele escolhe fazer da vida"*.
//
// "SÓ QUANDO PRECISAR" é a parte importante: este bloco só é montado quando o
// técnico está na janela do bico (T3+, Várzea ou Série D) e **ainda não escolheu
// nenhum**. Quem já tem bico não vê nada aqui — senão viraria um passo a mais em
// toda virada, e a regra de ouro dele é que nada pode atrasar o ritmo do jogo.
// E dá pra ignorar: o botão "Começar a temporada" não depende disto.
export function BicoVirada({ div, atual, onPick }: { div: string; atual?: BicoMarca; onPick: (b: BicoMarca) => void }) {
  const [sel, setSel] = useState<BicoMarca | undefined>(undefined)
  const [trocando, setTrocando] = useState(false)
  const esc = BICO_MARCAS.find(b => b.k === sel)
  const valor = BICO_VALOR[div === 'V' ? 'V' : 'D']
  const jaTem = atual ? BICO_MARCAS.find(b => b.k === atual) : undefined
  // ✅ JÁ TEM BICO: uma linha só, com o trocar fechado. "Só quando precisar" é isso —
  // nada de repetir a lista inteira em toda virada (o Diego odeia passo a mais).
  if (jaTem && !trocando) return (
    <div style={{ ...OSW, border: `3px solid ${INK}`, borderRadius: 13, background: '#fff', boxShadow: `3px 3px 0 ${INK}`, padding: '9px 11px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 9 }}>
      <div style={{ width: 30, height: 30, flex: 'none', border: `2.5px solid ${INK}`, borderRadius: 8, background: jaTem.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>{jaTem.ic}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 12.5 }}>🕴️ {jaTem.nome}</div>
        <div style={{ fontWeight: 400, fontSize: 10, opacity: .72 }}>{tr(jaTem.cargo.pt, jaTem.cargo.en)} · +{valor} 🪙/{tr('temp', 'seas')}</div>
      </div>
      <button onClick={() => setTrocando(true)} style={{ flex: 'none', border: `2.5px solid ${INK}`, borderRadius: 10, padding: '6px 9px', ...OSW, fontWeight: 700, fontSize: 10.5, textTransform: 'uppercase', background: CREME, color: INK, cursor: 'pointer' }}>🔁 {tr('trocar', 'change')}</button>
    </div>
  )
  return (
    <div style={{ ...OSW, border: `3px solid ${INK}`, borderRadius: 13, background: '#fff', boxShadow: `3px 3px 0 ${INK}`, padding: '10px 11px', marginBottom: 12 }}>
      <div style={{ fontWeight: 700, fontSize: 11.5, textTransform: 'uppercase' }}>🕴️ {tr('Bico de folga', 'Side job')}</div>
      <div style={{ fontWeight: 400, fontSize: 10.5, opacity: .75, margin: '3px 0 8px', lineHeight: 1.45 }}>
        {tr(`O clube ainda não paga bem. Nas folgas dá pra trabalhar num dos patrocinadores e ajudar o caixa em +${valor} 🪙 por temporada. É de graça, troca quando quiser — e acaba sozinho quando você chegar na Série C.`,
          `The club doesn't pay well yet. On your days off you can work for one of the sponsors and help the till by +${valor} 🪙 a season. It's free, switch whenever — and it ends by itself once you reach Série C.`)}
      </div>
      {BICO_MARCAS.map(b => (
        <button key={b.k} onClick={() => setSel(b.k)} aria-pressed={sel === b.k}
          style={{ width: '100%', textAlign: 'left', border: `2.5px solid ${sel === b.k ? '#7C3AED' : INK}`, borderRadius: 11, padding: '7px 9px', marginBottom: 5, cursor: 'pointer', background: sel === b.k ? b.bg : CREME, boxShadow: sel === b.k ? `2px 2px 0 ${INK}` : 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 28, height: 28, flex: 'none', border: `2.5px solid ${INK}`, borderRadius: 8, background: b.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>{b.ic}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ ...OSW, fontWeight: 700, fontSize: 12.5, lineHeight: 1.1 }}>{b.nome}</div>
              <div style={{ ...OSW, fontWeight: 400, fontSize: 9.5, opacity: .75 }}>{tr(b.cargo.pt, b.cargo.en)}</div>
            </div>
            <div style={{ ...OSW, fontWeight: 700, fontSize: 13, flex: 'none' }}>+{valor} 🪙</div>
          </div>
          {/* 📖 a historinha só abre no escolhido — a lista fica limpa e quem quer ler, lê */}
          {sel === b.k && (
            <div style={{ ...OSW, fontWeight: 400, fontSize: 10.5, lineHeight: 1.5, marginTop: 7, paddingTop: 7, borderTop: `2px solid rgba(0,0,0,.18)`, fontStyle: 'italic' }}>
              “{tr(b.historia.pt, b.historia.en)}”
            </div>
          )}
        </button>
      ))}
      <button disabled={!esc} onClick={() => esc && onPick(esc.k)}
        style={{ width: '100%', marginTop: 4, border: `3px solid ${INK}`, borderRadius: 12, padding: '9px 10px', ...OSW, fontWeight: 700, fontSize: 12.5, textTransform: 'uppercase', background: esc ? GREEN : '#cfc6ae', color: esc ? '#fff' : 'rgba(0,0,0,.45)', boxShadow: `3px 3px 0 ${INK}`, cursor: esc ? 'pointer' : 'default' }}>
        {esc ? `🕴️ ${tr('Pegar o bico na', 'Take the job at')} ${esc.nome}` : tr('Toque num bico pra ler a história', 'Tap a job to read the story')}
      </button>
      {jaTem && <button onClick={() => { setTrocando(false); setSel(undefined) }} style={{ width: '100%', marginTop: 6, border: `2.5px solid ${INK}`, borderRadius: 11, padding: 7, ...OSW, fontWeight: 700, fontSize: 11, textTransform: 'uppercase', background: CREME, color: INK, cursor: 'pointer' }}>{tr('cancelar — fico na', 'cancel — stay at')} {jaTem.nome}</button>}
      <div style={{ ...OSW, fontWeight: 400, fontSize: 9.5, opacity: .7, marginTop: 6, lineHeight: 1.4 }}>
        {tr('Pode ignorar e começar a temporada: o bico não trava nada, e fica esperando em 🤝 Patrocínio.',
          'You can ignore this and start the season: the side job blocks nothing, and it waits for you in 🤝 Sponsors.')}
      </div>
    </div>
  )
}

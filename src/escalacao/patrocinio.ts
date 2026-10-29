// ─── 💼 PATROCINADOR DE VERDADE NO JOGO (16/10) ────────────────────────────────────────────────────────────────────
//
// Diego: *"publique agora da Vadico Veículos pra eu ver como fica… deixe a Champions Legends apresentada por Vadico
// Veículos"*. Primeiro espaço ligado: o NOME DA COMPETIÇÃO ("apresentada por"), no palco da competição (`CompetitionStage`).
// Regra combinada: uma marca por competição; cada competição pode ter a sua. Sem logo oficial ainda → marca escrita.
//
// 🔒 A seção da Loja ("Sua marca no jogo") segue só nas contas do Diego (`PATROCINIO_GERAL`). Os espaços na TELA (nome da
// competição, LED do estádio, anúncio no O MARTELO) foram pro ar pra todos em 16/10 (`ESPACOS_GERAL`, Diego: "pode publicar").
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { loggedEmail, stripEmoji } from './apoio'
import { buscaVitrine, podioPassada } from './vitrine-dados' // 🏆 pódio da semana passada no letreiro (19/10)
import { clasLiberado } from './cla-gate' // ⚔️ pódio dos clãs no letreiro (21/10)
import VADICO_LOGO_ALFA from './img/patro-vadico-alfa.webp'
import TIDEX_LOGO from './img/patro-tidex.webp' // 🤖 Tidex (19/10): Copa dos 8, placa do campinho e telão no lugar da Max Joias
import VADICO_PLACA from './img/placa-vadico.webp' // 🏟️ 23/10: placas no padrão da Tidex (faixa deitada que enche a placa)
import OITTO_PLACA from './img/placa-oittolabs.webp'
import DSOUZA_LOGO from './img/patro-dsouza.webp' // 🐶 dSouza Empreendimentos (28/10): patrocínio Master
import DSOUZA_PLACA from './img/patro-dsouza-placa.webp'
import FOTO_HAVAL from './img/anuncio-vadico-haval.webp' // 🚗 29/10: a foto do Haval H6 que o Diego mandou, pro telão (240×168, 9 KB)
import GECG_PLACA from './img/patro-gecg-placa.webp' // ⚽ Grêmio Campo Grande (23/10): placa deitada (escudo + nome) revezando com a Tidex

export type Patrocinio = { nome: string; emoji: string }
export type Competicao = 'copa8' | 'liberta' | 'world' | 'club-world' | 'league' | 'champions' | 'career-league' | 'career-copa' | 'regional' | 'career-varzea' // career-varzea = a liga da carreira na VÁRZEA (23/10) · regional = Copas Regionais (Rio × SP, Sul-Minas, Nordeste) — 23/10 · career-league = a Liga Legends da CARREIRA (19/10) · career-copa = a Copa do Brasil da carreira (21/10)

const PATROCINIO_GERAL = true // 16/10: Diego "pode liberar tudo já pro geral, mostrar pra todos, e Pix também"
const ESPACOS_GERAL = true
const PATROCINIO_TESTERS = new Set(['diego.c.fonseca@gmail.com', 'diego.c.fonseca2@gmail.com'])
const POR_COMPETICAO: Partial<Record<Competicao, Patrocinio>> = {
  champions: { nome: 'Vadico Veículos', emoji: '🚗' }, // 🚗 Vadico Veículos (Itaguaí e Barra da Tijuca) — 16/10
  copa8: { nome: 'OittoLabs', emoji: '🧪' }, // 🧪 21/10 (Diego: "copa dos 08 online apresentado por" OittoLabs) — era da Tidex, que segue na Liga Legends
  'career-copa': { nome: 'OittoLabs', emoji: '🧪' }, // 🧪 21/10: Copa do Brasil da carreira
  liberta: { nome: 'dSouza Empreendimentos', emoji: '🐶' }, // 🐶 28/10: Libertadores (online e carreira) — patrocínio Master
  regional: { nome: 'Grêmio Esportivo Campo Grande', emoji: '⚽' },
  'career-varzea': { nome: 'Grêmio Esportivo Campo Grande', emoji: '⚽' }, // ⚽ 23/10: a liga da carreira na Várzea (as outras divisões seguem Tidex) // ⚽ 23/10 (Diego: "nas copas regionais coloque apresentado por grêmio esportivo campo grande")
  'career-league': { nome: 'Tidex', emoji: '🤖' }, // 🤖 19/10 (Diego: "no modo carreira também na Liga Legends apresentado por Tidex") // 🤖 Tidex — sua marca dentro das IAs (19/10, Diego: "add a Tidex na copa dos 8 apresentado por")
}

/** a marca que apresenta esta competição (null = sem patrocinador, ou ainda escondido pra esta conta) */
export function patrocinioDe(kind: Competicao): Patrocinio | null {
  const email = (loggedEmail() ?? '').toLowerCase()
  if (!ESPACOS_GERAL && !PATROCINIO_TESTERS.has(email)) return null
  return POR_COMPETICAO[kind] ?? null
}
const espacosOk = () => ESPACOS_GERAL || PATROCINIO_TESTERS.has((loggedEmail() ?? '').toLowerCase())

// 🏟️ LED do estádio (R$ 200/mês): quem está aqui passa no letreiro do palco das partidas online, uma marca atrás da outra.
export type MarcaLed = Patrocinio & { chamada?: string }
const LED_ESTADIO: MarcaLed[] = [
  { nome: 'Vadico Veículos', emoji: '🚗', chamada: 'Itaguaí · Barra da Tijuca · 45 anos' },
]
// 🚫 19/10 (Diego: "esse lugar de verde da Vadico Veículos pode tirar que não tô gostando"): a faixa de LED verde SAIU de todas as
// competições. Pra voltar, `LED_LIGADO = true` (a lista de marcas acima continua guardada).
const LED_LIGADO = false
export function ledDoEstadio(): MarcaLed[] { return espacosOk() && LED_LIGADO ? LED_ESTADIO : [] }

// 📰 Anúncio no O MARTELO (R$ 100/mês): um quadro no fim do jornal. Um anunciante por vez.
export type AnuncioJornal = Patrocinio & { texto: string; contato?: string; logo?: string; logoProp?: number }
// 16/10: desligado/religado no mesmo dia; 17/10 DESLIGADO de vez (*"remova propaganda do martelo"*) — na Loja o item virou as placas atrás dos gols
const ANUNCIO_MARTELO_LIGADO = false
const ANUNCIO_MARTELO: AnuncioJornal | null = {
  nome: 'Vadico Veículos', emoji: '🚗', logo: VADICO_LOGO_ALFA, logoProp: 496 / 140,
  texto: '45 anos de empresa familiar. Garantia e documento no nome da loja, sem carro de leilão. Itaguaí e Barra da Tijuca.',
  contato: 'vadicoveiculos.com.br · @vadicoveiculos',
}
export function anuncioDoMartelo(): AnuncioJornal | null { return espacosOk() && ANUNCIO_MARTELO_LIGADO ? ANUNCIO_MARTELO : null }

/** 💼 a seção "Sua marca no jogo" da Loja (Dia da marca + mensal) — mesma trava: começa só nas contas do Diego */
export function patrocinioLojaOk(): boolean {
  return PATROCINIO_GERAL || PATROCINIO_TESTERS.has((loggedEmail() ?? '').toLowerCase())
}

// ⏱️ ANÚNCIOS AVULSOS PAGOS (16/10, regra do Diego: *"todo anúncio dura 24h desde que colocado no ar… somente anúncios manuais
// como da Vadico ficam direto até eu alterar"*). O Diego põe no ar pelo #admin (`esc_anuncios`: tipo 'marca' = Dia da marca na
// Copa dos 8 · tipo 'giro' = Anúncio do dia no letreiro) e cada um vale 24 h a partir do `inicio`. Os MANUAIS (mensal, como a
// Vadico) moram no código e ficam até ele trocar. Leitura pequena: uma por sessão, refeita no máximo a cada 30 min (tráfego).
type Avulso = { tipo: 'giro' | 'marca' | 'recado'; texto: string; emoji: string; inicio: number; fim: number; autor?: string } // 💬 recado (18/10): o jogador escreve, com o nome do time
let avulsos: Avulso[] = []
let fixos: { texto: string; cor: string; link?: string }[] | null | undefined = undefined // 📌 undefined = lendo (nada) · null = a leitura falhou (reserva do código)
let lidoEm = 0
let pedindo: Promise<void> | null = null
const ouvintes = new Set<() => void>()
function carregaAvulsos(): Promise<void> {
  if (Date.now() - lidoEm < 30 * 60_000) return Promise.resolve()
  if (pedindo) return pedindo
  pedindo = (async () => {
    try {
      const [{ data }, fx] = await Promise.all([
        supabase.from('esc_anuncios').select('tipo, texto, emoji, inicio, fim, autor').gt('fim', new Date().toISOString()).order('inicio').limit(20),
        supabase.from('esc_anuncios_fixos').select('texto, link').eq('ativo', true).order('ordem').order('id').limit(12),
      ])
      // 📌 fixos do banco: lista vazia = o Diego tirou todos (vale vazio); erro de leitura = fica a reserva do código
      if (!fx.error && Array.isArray(fx.data)) fixos = (fx.data as { texto: string; link: string | null }[])
        .map(r => ({ texto: String(r.texto), cor: '#FFC400', ...(r.link && /^https:\/\//.test(r.link) ? { link: String(r.link) } : {}) }))
      else if (fixos === undefined) fixos = null
      avulsos = ((data ?? []) as { tipo: string; texto: string; emoji: string; inicio: string; fim: string; autor?: string | null }[])
        .map(r => ({ tipo: r.tipo === 'marca' ? 'marca' : r.tipo === 'recado' ? 'recado' : 'giro', texto: String(r.texto), emoji: String(r.emoji ?? '⭐'), inicio: Date.parse(r.inicio), fim: Date.parse(r.fim), autor: r.autor ? String(r.autor) : undefined }) as Avulso)
    } catch { avulsos = []; if (fixos === undefined) fixos = null }
    lidoEm = Date.now(); pedindo = null
    ouvintes.forEach(f => { try { f() } catch { /* ignora */ } })
  })()
  return pedindo
}
const noAr = (tipo: Avulso['tipo']) => { const t = Date.now(); return avulsos.filter(a => a.tipo === tipo && a.inicio <= t && t < a.fim) }
function useAvulsos(ligado = true) {
  const [, re] = useState(0)
  useEffect(() => {
    if (!ligado) return
    const f = () => re(n => n + 1)
    ouvintes.add(f); carregaAvulsos()
    return () => { ouvintes.delete(f) }
  }, [ligado])
}

/** hook do palco: a marca do mês (código) ou, na Copa dos 8, o ⚡ Dia da marca que está no ar (banco, 24 h) */
export function usePatrocinio(kind: Competicao | null): Patrocinio | null {
  useAvulsos(kind === 'copa8')
  if (!kind) return null
  const m = kind === 'copa8' ? noAr('marca')[0] : undefined
  if (m) return { nome: m.texto, emoji: m.emoji }
  return patrocinioDe(kind)
}

// 📢 ANÚNCIO DO DIA (o letreiro que era o giro da rodada): o avulso pago (24 h) passa antes do manual.
// 📌 19/10 (Diego: "deveria aparecer no painel as três p eu remover editar ou add nova"): os MANUAIS agora moram no banco
// (`esc_anuncios_fixos`, editados no #admin → "📌 Anúncios fixos"). A lista abaixo virou só RESERVA, usada quando a leitura falha.
const GIRO_ANUNCIO: string | null = '🚗 Vadico Veículos · Haval H6 0 km blindado · Toque e fale com a loja' // reserva (29/10: o mesmo texto da linha do banco)
// 🔗 17/10 (Diego): tocar na Vadico abre a oferta do carro do anúncio no site dela. Só anúncio MANUAL leva link (o pago de 24 h é
// texto escrito pelo comprador e vai pro ar sem ninguém olhar — link ali seria porta pra golpe).
// 📢 MAIS ANÚNCIOS MANUAIS (17/10, Diego), passando depois da Vadico, cada um com o próprio link:
// · canal do K9 no YouTube (link limpo, sem o rastreio do Facebook que veio colado)
// · Tidex (19/10, no lugar da Max Joias) → WhatsApp deles, com a mensagem já escrita
// 🤖 Tidex (19/10): o mesmo texto/link está na linha do banco (`esc_anuncios_fixos`), que é quem manda; isto é a reserva
const TIDEX_GIRO = '🤖 Tidex · Sua empresa aparece no ChatGPT? Clique aqui'
const TIDEX_ZAP = 'https://wa.me/5511981181888?text=' + encodeURIComponent('Olá! Vim pelo Leilão Legends e queria saber como ter minha empresa no ChatGPT.')
// 🧪 OittoLabs (21/10): contabilidade e BPO pra PJ e PF — a linha de verdade mora em `esc_anuncios_fixos`; isto é a reserva
const OITTO_GIRO = '🧪 OittoLabs · Contabilidade e BPO financeiro pra sua empresa ou PF · Clique aqui'
// ⚽ Grêmio Esportivo Campo Grande (23/10): clube de várzea com estádio próprio (~10 mil lugares) em Jurubatuba, Zona Sul de SP;
// objetivo deles = gente no estádio nos fins de semana e aluguel do campo pra torneios. A linha de verdade mora em
// `esc_anuncios_fixos`; isto é a reserva.
const GECG_GIRO = '⚽ Grêmio Esportivo Campo Grande · Estádio próprio na Zona Sul SP · Clique aqui'
const GECG_LINK = 'https://www.instagram.com/gremiocampo' // 23/10: o Diego mandou o Instagram do clube pro telão (antes era o WhatsApp)
// 🐶 dSouza Empreendimentos (28/10): quadros decorativos de futebol no Mercado Livre — a linha de verdade mora em `esc_anuncios_fixos`
const DSOUZA_GIRO = '🐶 dSouza · Quadros do seu time pra decorar a parede · Frete grátis · Clique aqui'
const DSOUZA_LINK = 'https://www.mercadolivre.com.br/pagina/dsouzaempreendimentos/futebol'
const GIRO_MANUAIS: { texto: string; cor: string; link?: string }[] = [
  { texto: '▶️ Kelvin Oliveira · Siga o novo canal do K9 no YouTube', cor: '#FFC400', link: 'https://www.youtube.com/@kelvink9oliveira' },
  { texto: TIDEX_GIRO, cor: '#FFC400', link: TIDEX_ZAP }, // 🤖 19/10: no lugar da Max Joias
  { texto: OITTO_GIRO, cor: '#FFC400', link: 'https://oittolabs.com.br' }, // 🧪 21/10
  { texto: GECG_GIRO, cor: '#FFC400', link: GECG_LINK }, // ⚽ 23/10
  { texto: DSOUZA_GIRO, cor: '#FFC400', link: DSOUZA_LINK }, // 🐶 28/10
]
const GIRO_ANUNCIO_LINK = 'https://vadicoveiculos.com.br/Veiculo/haval-h6-1.5-flex-phev19-e-traction-gasolina-e-eletrico-2027/5425264/detalhes'
// 🎨 cor no letreiro: o manual (Vadico) em dourado; o pago de 24 h em VERDE, pra diferenciar (Diego: "talvez dê outra cor")
export type AnuncioGiro = { texto: string; cor: string; link?: string; foto?: string; recado?: { autor: string }; podio?: true; podioCla?: true; cla?: string } // 💬 recado de jogador: rosa + nome do time · 🏆 pódio da semana: roxo (19/10)
export const ANUNCIO_MAX = 82 // = tamanho do texto da Vadico (Diego: "número máximo de caracteres… tipo o da Vadico")
function usePodioPassado() {
  const [v, setV] = useState(podioPassada())
  useEffect(() => { let vivo = true; void buscaVitrine().then(() => { if (vivo) setV(podioPassada()) }); return () => { vivo = false } }, [])
  return v
}
// ⚔️ PÓDIO DOS CLÃS DA SEMANA PASSADA (21/10, Diego: "aparece no telão de propagandas pra todos igual no do usuário… mas ele
// não entra no lugar do usuário solo. Só entra abaixo"). Uma leitura a cada 10 min por aparelho — nada pelo canal.
let podioClaCache: { pos: number; nome: string }[] = [], podioClaEm = 0, podioClaLendo: Promise<void> | null = null
function lePodioCla(): Promise<void> {
  if (Date.now() - podioClaEm < 600_000) return Promise.resolve()
  if (!podioClaLendo) podioClaLendo = (async () => {
    try {
      const { data } = await supabase.rpc('esc_cla_podio_passado')
      podioClaCache = Array.isArray(data) ? (data as { pos: number; nome: string }[]) : []
    } catch { /* sem leitura = sem linha, o resto do letreiro segue */ }
    podioClaEm = Date.now(); podioClaLendo = null
  })()
  return podioClaLendo
}
function usePodioClaPassado() {
  const liga = clasLiberado()
  const [v, setV] = useState(liga ? podioClaCache : [])
  useEffect(() => { if (!liga) return; let vivo = true; void lePodioCla().then(() => { if (vivo) setV(podioClaCache) }); return () => { vivo = false } }, [liga])
  return liga ? v : []
}
const PODIO_NO_TELAO = false
// 📷 FOTO DO PRODUTO NO TELÃO (29/10, mockup `scripts/mockups/telao-foto-haval.png`, *"ok publique esse do haval"*): pequena, no canto
// direito da MESMA placa (o telão não muda de tamanho), só no anúncio que tem foto. A foto casa pelo TEXTO do anúncio (não pela
// marca): se o Diego trocar o carro no #admin, a foto do Haval some sozinha em vez de mostrar o carro errado.
const FOTOS_ANUNCIO: { quando: RegExp; foto: string }[] = [
  { quando: /haval/i, foto: FOTO_HAVAL },
]
const comFoto = (a: AnuncioGiro): AnuncioGiro => { const f = FOTOS_ANUNCIO.find(x => x.quando.test(a.texto)); return f ? { ...a, foto: f.foto } : a }
export function useAnunciosGiro(): AnuncioGiro[] {
  useAvulsos()
  const out: AnuncioGiro[] = noAr('giro').map(a => ({ texto: '📣 ' + a.texto, cor: '#5CFF8A' }))
  // 💬 RECADO EM DESTAQUE (18/10): gira no mesmo letreiro, em rosa, com o nome do time de quem mandou (mockup `recado-destaque.png`)
  out.push(...noAr('recado').map(a => ({ texto: a.texto, cor: '#FF5FA2', recado: { autor: a.autor ?? '' } })))
  // 🏆 PÓDIO DA SEMANA PASSADA (19/10, Diego: "no telão aparece os 3 primeiros da semana… com emoji de medalha"): roda a semana
  // inteira, em roxo. Vem da vitrine (mesma leitura do ranking, cache de 60 s) — zero mensagem nova no canal.
  const podio = usePodioPassado()
  const podioCla = usePodioClaPassado() // ⚔️ sempre DEPOIS do pódio dos usuários, nunca no lugar dele
  // ⚔️ 26/10 (Diego: "no telão, no mesmo momento que aparece os vitoriosos, coloque após eles clã da semana e o nome do clã
  // vitorioso"): o campeão dos clãs vai numa linha embaixo dos 3 técnicos, no MESMO anúncio
  const claCampeao = podioCla.filter(p => p.pos === 1).map(p => stripEmoji(p.nome).trim()).join(' · ')
  // 🚫 29/10 (Diego: "tire o rank da semana e clã da semana do telão das salas… não prometam mais isso"): o telão não passa mais
  // o pódio. As leituras ficam (são baratas e cacheadas), só não vão pro letreiro. Pra voltar: `PODIO_NO_TELAO = true`.
  if (PODIO_NO_TELAO && podio.length) out.push({ texto: podio.map(p => `${['', '🥇', '🥈', '🥉'][p.pos] ?? '🏅'} ${stripEmoji(p.nome).trim()}`).join(' · '), cor: '#C9A9FF', podio: true, ...(claCampeao ? { cla: claCampeao } : {}) })
  if (PODIO_NO_TELAO && podioCla.length) out.push({ texto: podioCla.map(p => `${['', '🥇', '🥈', '🥉'][p.pos] ?? '🏅'} ${stripEmoji(p.nome).trim()}`).join(' · '), cor: '#C9A9FF', podio: true, podioCla: true })
  if (espacosOk()) {
    if (fixos) out.push(...fixos.map(comFoto))
    else if (fixos === null) {
      if (GIRO_ANUNCIO) out.push(comFoto({ texto: GIRO_ANUNCIO, cor: '#FFC400', link: GIRO_ANUNCIO_LINK }))
      out.push(...GIRO_MANUAIS)
    }
  }
  return out
}
/** depois que alguém põe o anúncio no ar, relê na hora (pra pessoa já se ver no letreiro) */
export function releAnuncios() { lidoEm = 0; carregaAvulsos() }

// 🏟️ PLACAS ATRÁS DOS GOLS (17/10, Diego escolheu a ideia 1 do mockup `scripts/mockups/campinho-outras-ideias.png`: *"perfeito
// pode fazer mas no momento coloque Vadico Veículos e Max Joias"*). Uma placa em cima e outra embaixo de todo campinho, cada uma
// numa marca, trocando juntas a cada 7 s no MESMO relógio do Anúncio do dia. Com 1 marca só, a outra placa mostra Leilão Legends.
export type PlacaCampo = { nome: string; logo?: string; prop?: number; fundo: string }
const PLACAS_CAMPO: PlacaCampo[] = [
  // 🏟️ 23/10 (Diego: "ajustar os patrocínios existentes p se enquadrar e ficar parecido com o da Tidex"): a 1ª tentativa (faixa
  //    com caixa branca + frase) não ficou boa (*"só a da Tidex ainda"*). Agora é igual à Tidex: só o LOGO, claro e grande, sem
  //    caixa, sobre a placa escura da cor da marca — e o tamanho sai da mesma régua (`tamanhoMarcaNaPlaca`).
  { nome: 'Vadico Veículos', logo: VADICO_PLACA, prop: 532 / 120, fundo: '#141414' },
  { nome: 'OittoLabs', logo: OITTO_PLACA, prop: 522 / 120, fundo: '#0F2340' }, // 🧪 21/10: revezando com a Vadico (cima ↔ baixo), igual placa de estádio
  { nome: 'Tidex', logo: TIDEX_LOGO, prop: 837 / 120, fundo: '#0B1220' },
  // ⚽ 23/10: o escudo é vertical, então a placa leva escudo + "GRÊMIO ESPORTIVO / CAMPO GRANDE" em duas linhas, no azul do clube.
  { nome: 'Grêmio Esportivo Campo Grande', logo: GECG_PLACA, prop: 586 / 120, fundo: '#11225A' },
  { nome: 'dSouza Empreendimentos', logo: DSOUZA_PLACA, prop: 1003 / 240, fundo: '#000000' }, // 🐶 28/10: pitbull + nome, no preto da arte deles
]
/** 📐 TAMANHO DA MARCA NA PLACA (21/10, Diego: *"a Tidex está perfeita… a Vadico e a OittoLabs estão desproporcionais e pequenas…
 *  tem que seguir o padrão da Tidex"*). Antes toda marca tinha a MESMA altura (72% da placa), então a marca comprida (Tidex, 7:1)
 *  enchia a placa e a mais quadrada (Vadico 3,5:1 · OittoLabs 2,8:1) ficava miúda. Agora todas miram a LARGURA da Tidex, e a
 *  mais quadrada cresce até 92% da altura da placa pra chegar o mais perto possível. A Tidex continua exatamente igual. */
export function tamanhoMarcaNaPlaca(alt: number, prop: number, larguraMax: number): { w: number; h: number } {
  const alvo = Math.min(larguraMax, alt * 0.72 * (837 / 120))
  const h = Math.min(alt * 0.92, alvo / prop, alt * 0.72 * Math.max(1, (837 / 120) / prop))
  return { w: h * prop, h }
}
export const PLACA_CASA: PlacaCampo = { nome: 'Leilão Legends', fundo: 'linear-gradient(180deg,#FFD84A,#E8A900)' }
export function placasDoCampo(): PlacaCampo[] {
  if (!espacosOk()) return []
  return PLACAS_CAMPO.length === 1 ? [PLACAS_CAMPO[0], PLACA_CASA] : PLACAS_CAMPO
}

/** ✈️ AVIÃOZINHO DA HOME (23/10, ideia do Diego): cruza a home UMA vez cada vez que ela abre, puxando a faixa do parceiro.
 *  Tocar na faixa abre o link dele. Tirar: AVIAO_HOME = null. */
export type AviaoHome = { nome: string; linha1: string; linha2: string; logo: string; fundo: string; link: string }
// 🐶 28/10: patrocinador novo = aviãozinho (regra do Diego) — saiu o Grêmio Campo Grande, entrou a dSouza
const AVIAO_HOME: AviaoHome | null = { nome: 'dSouza Empreendimentos', linha1: 'dSOUZA', linha2: 'EMPREENDIMENTOS', logo: DSOUZA_LOGO, fundo: '#000000', link: DSOUZA_LINK }
export function aviaoDaHome(): AviaoHome | null { return espacosOk() ? AVIAO_HOME : null }

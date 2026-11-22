import {useCareerVisualV2} from './career-visual-v2'
import {CareerCentralGuide} from './career-start-guide'
// ─── 📺 CENTRAL LEGENDS — a home do modo carreira (03/10) ────────────────────
//
// Pedido do Diego: *"queria alguma central no modo carreira… falta uma área na
// home central, com giro da rodada, notícias, transferências… precisa ter alguma
// central"*. Mockup v4 aprovado (celular e desktop), depois de três rodadas: a 1ª
// ele achou feia (*"quero algo top com as artes cinematográficas de fundo"*), a 3ª
// tinha notícia demais e giro de menos.
//
// O QUE ELA É: uma tela só, com cara de transmissão, que junta o que já existe:
//   🏟️ o PRÓXIMO JOGO visto do camarote (arte `online-estadio-v25`), com o MESMO
//      botão de jogar a rodada — não cria passo, não cria espera (regra de ouro);
//   📣 o GIRO da rodada que passou (só rodada REVELADA — nunca spoiler);
//   📰 O MARTELO do meio da temporada (redação em `central-noticias.ts`);
//   💸 o MERCADO (suas compras do extrato + a carta mais cara da divisão);
//   📊 a TABELA resumida e a 🗓️ AGENDA das copas. Tocar leva pra aba certa.
// Tudo que aparece aqui JÁ apareceu em outra aba — a Central não sabe de nada
// que a tela não saiba. 🔒 Só a conta do Diego vê (`useCentralCarreira`).
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { JanelaNuvemPlanos } from './nuvem-planos' // ☁️ 19/10: salvar sem plano → os planos
import { CardColetiva, FotoLendas, type CardColetivaProps } from './coletiva-ui' // 🎙️ coletiva de imprensa (19/10)
import { Escudo } from './escudos'
import { getLang, useT } from './lang'
import { avisoFechado, fechaAviso } from './avisos-fechados' // ✕ fechou = não volta (29/10)
import type { Jornal, Contratacao } from './central-noticias'
import estadioArt from './img/online-estadio-v25.webp'
import leilaoArt from './img/career-auction-room-private.webp'
import copaBrArt from './img/carreira-copa-brasil-v25.webp'
import copaLegArt from './img/online-copa8-v25.webp'
import libertaArt from './img/online-liberta-v25.webp'
import mundoArt from './img/online-mundial-v25.webp'
import championsArt from './img/online-champions-v25.webp'
import mundialArt from './img/carreira-mundial-clubes-v1.webp'
import superArt from './img/carreira-supercopa-v25.webp'
import quadraArt from './img/home-bidlegends-v01.webp' // 🏀 15/11: a Central da carreira do basquete
import './central.css'

const INK = '#0C0C0C', GOLD = '#FFC400', CREME = '#F4ECD6', RED = '#E8503A'
const OSW = { fontFamily: 'Oswald, sans-serif', fontWeight: 700 as const, textTransform: 'uppercase' as const }
const G_OURO = 'linear-gradient(160deg,#FFE79A,#FFC400 40%,#E8A200 70%,#FFDD70)'

export type CentralJogo = { h: string; a: string; hg: number; ag: number; hId: number; aId: number }
export type CentralArte = 'estadio' | 'copaBr' | 'copaLeg' | 'super' | 'liberta' | 'champions' | 'mundial' | 'mundo'
/** 🗓️ 18/11: a agenda é a lista dos PRÓXIMOS JOGOS do seu clube — data, competição, fase e adversário (`casa` null = mata-mata, ida e volta) */
/** a agenda de antes de 18/11 (copas e Copa do Mundo) — quem ainda não tem a Central nova */
export type CentralAgendaVelha = { arte: 'copaBr' | 'copaLeg' | 'liberta' | 'mundo'; titulo: [string, string]; sub: [string, string] }
export type CentralAgenda = { dia: number; comp: [string, string]; fase?: string; /** 📍 onde é o jogo: o estádio do mandante (em casa: "no seu estádio · <nome>") — Diego 18/11 quer o nome nos dois casos */ onde?: string; adv: string; casa: boolean | null; arte?: 'copaBr' | 'liberta' }
export type RaioX = {
  nome: string
  formacao: string
  estilo: string
  top: { nome: string; club: string; year: number; fame: number }[]
  forma?: string
  cansaco?: { cansados: number; lesionados: number; poupados: number } | null
}
const CATEG = (f: number, en: boolean) => f >= 5 ? (en ? '👑 Legend' : '👑 Lenda') : f === 4 ? (en ? '⭐ Star' : '⭐ Craque') : f >= 2 ? (en ? '🎯 Good' : '🎯 Bom') : (en ? '🪵 Pro' : '🪵 Profissional')
function CartaoRaioX({ r }: { r: RaioX }) {
  const t = useT()
  const en = getLang() === 'en'
  const lin = (rot: string, v: React.ReactNode) => (
    <div className="ll-central-row" style={{ padding: '6px 11px', gap: 8, fontSize: 11.5, alignItems: 'center' }}>
      <span style={{ width: 92, flex: 'none', color: '#6a6250', fontWeight: 800 }}>{rot}</span>
      <span style={{ flex: 1, minWidth: 0, fontWeight: 800 }}>{v}</span>
    </div>
  )
  const c = r.cansaco
  return (
    <div className="ll-central-card ll-c-raiox" style={{ background: CREME, color: INK }}>
      <Cabecalho titulo={t('🔎 Raio-X do adversário', '🔎 Opponent scouting')} sub={r.nome} />
      {lin(t('Formação', 'Formation'), <>{r.formacao} <span style={{ color: '#6a6250', fontWeight: 700 }}>· {r.estilo}</span></>)}
      {lin(t('Últimos 5', 'Last 5'), r.forma ? <Forma f={r.forma} /> : <span style={{ color: '#888' }}>{t('ainda não jogou', 'no games yet')}</span>)}
      {c && lin(t('Cansaço', 'Fitness'), c.cansados + c.lesionados + c.poupados === 0
        ? <span style={{ color: '#1B7A3D' }}>{t('💪 time inteiro', '💪 fully fit')}</span>
        : <>{[c.cansados ? t(`😓 ${c.cansados} titular${c.cansados > 1 ? 'es' : ''} cansado${c.cansados > 1 ? 's' : ''}`, `😓 ${c.cansados} tired starter${c.cansados > 1 ? 's' : ''}`) : '', c.lesionados ? t(`🚑 ${c.lesionados} lesionado${c.lesionados > 1 ? 's' : ''}`, `🚑 ${c.lesionados} injured`) : '', c.poupados ? t(`🔁 vai poupar ${c.poupados}`, `🔁 resting ${c.poupados}`) : ''].filter(Boolean).join(' · ')}</>)}
      <div style={{ padding: '7px 11px 9px' }}>
        <small style={{ ...OSW, fontSize: 10, letterSpacing: '.08em', color: '#7a7462' }}>{t('Os 3 melhores', 'Top 3')}</small>
        {r.top.map((x, i) => (
          <div key={x.nome + x.club + x.year} style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 4, fontSize: 11.5 }}>
            <span style={{ width: 16 }}>{['🥇', '🥈', '🥉'][i]}</span>
            <b style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{x.nome} <span style={{ fontWeight: 700, color: '#6a6250' }}>· {x.club} {x.year}</span></b>
            <span style={{ fontSize: 10, fontWeight: 900, whiteSpace: 'nowrap' }}>{CATEG(x.fame, en)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
/** 🎥 ENQUANTO ISSO NO BAIRRO (17/11, mockup aprovado pelo Diego): UMA cena do mapa do clube por vez, só do que já está
 *  acontecendo de verdade (noitada do baladeiro, obra comprada, boteco depois do jogo, carreata, feira). `chave` = o
 *  acontecimento; fechou, não volta (guarda só a ÚLTIMA chave fechada — uma entrada só no aparelho, nunca cresce). */
export type CentralSede = { /** 📍 o lugar do mapa onde a cena acontece (o "Ver no mapa" voa pra lá) */ vista?: string; chave: string; img: string; rotulo: string; hora?: string; chapeu: string; titulo: string; texto: string; tom?: 'bom' | 'ruim' }
const SEDE_FECHADA = 'esc-sede-fechada'
function CartaoSede({ s, onMapa, cls, janela, seguir }: { s: CentralSede; onMapa: () => void; cls: string; /** 🎥 22/11: o MAPA ao vivo no lugar da foto parada */ janela?: ReactNode; /** 🧭 22/11 (Central direta): o banner da semana vem ANTES do jogo; "Seguir" fecha e mostra o jogo */ seguir?: () => void }) {
  const t = useT()
  // 🎥 22/11 (Diego: *"só deve aparecer com videozinhos… igual a chegada do ônibus"*): a cena passa AO VIVO no quadro (o mapa de
  // verdade, já apontado pro lugar). O cartão existe duas vezes (celular e computador, o CSS esconde um): o mapa é UM só, então
  // só o cartão que está na tela encaixa ele.
  const raiz = useRef<HTMLDivElement>(null)
  const [naTela, setNaTela] = useState(false)
  useLayoutEffect(() => {
    const mede = () => setNaTela(!!raiz.current && getComputedStyle(raiz.current).display !== 'none')
    mede(); window.addEventListener('resize', mede)
    return () => window.removeEventListener('resize', mede)
  })
  const [fechada, setFechada] = useState(() => { try { return localStorage.getItem(SEDE_FECHADA) === s.chave } catch { return false } })
  useEffect(() => { try { setFechada(localStorage.getItem(SEDE_FECHADA) === s.chave) } catch { setFechada(false) } }, [s.chave])
  if (fechada) return null
  const fecha = () => { try { localStorage.setItem(SEDE_FECHADA, s.chave) } catch { /* segue só nesta tela */ } setFechada(true); seguir?.() }
  return (
    <div ref={raiz} className={`ll-central-card ll-c-sede ${cls}`} style={{ background: CREME, color: INK, overflow: 'hidden', padding: 0 }}>
      <div style={{ position: 'relative', height: janela ? 260 : 190, background: `#1f1a13 url(${s.img}) center / cover`, overflow: 'hidden' }}>
        {janela && naTela && <>
          {/* só a IMAGEM do mapa entra no quadro (botões e avisos dele somem), na altura do quadro — o mesmo jeito da chegada do ônibus */}
          <style>{'.ll-sede-mapa *{visibility:hidden!important}.ll-sede-mapa canvas{visibility:visible!important}.ll-sede-mapa .pc3-stage{height:260px!important;min-height:0!important;max-height:260px!important}'}</style>
          <div className="ll-sede-mapa" data-sede-ao-vivo style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>{janela}</div>
        </>}
        <span style={{ ...OSW, position: 'absolute', left: 10, top: 10, background: INK, color: GOLD, fontSize: 11, letterSpacing: '.12em', padding: '4px 8px', borderRadius: 8 }}>🎥 {s.rotulo}</span>
        {s.hora && <span style={{ ...OSW, position: 'absolute', right: 10, top: 10, background: RED, color: '#fff', fontSize: 11, letterSpacing: '.1em', padding: '4px 8px', borderRadius: 8, border: `2px solid ${INK}` }}>● {s.hora}</span>}
      </div>
      <div style={{ padding: '12px 14px 14px' }}>
        <small style={{ ...OSW, fontSize: 10, letterSpacing: '.12em', color: s.tom === 'bom' ? '#1B7A3D' : '#C2452F' }}>{s.chapeu}</small>
        <h3 style={{ ...OSW, fontSize: 22, lineHeight: 1.05, margin: '2px 0 4px' }}>{s.titulo}</h3>
        <p style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 600, color: '#3a3527' }}>{s.texto}</p>
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" onClick={onMapa} style={{ ...OSW, flex: 1, border: `3px solid ${INK}`, borderRadius: 12, boxShadow: `3px 3px 0 ${INK}`, fontSize: 15, padding: 8, background: GOLD, color: INK, cursor: 'pointer' }}>📍 {t('Ver no mapa', 'See on the map')}</button>
          <button type="button" onClick={fecha} style={{ ...OSW, flex: 1, border: `3px solid ${INK}`, borderRadius: 12, boxShadow: `3px 3px 0 ${INK}`, fontSize: 15, padding: 8, background: '#fff', color: INK, cursor: 'pointer' }}>{seguir ? t('Seguir ›', 'Next ›') : janela ? t('⏩ Pular', '⏩ Skip') : t('Fechar', 'Close')}</button>
        </div>
      </div>
    </div>
  )
}
export type CentralProps = {
  /** 🎥 22/11: o mapa ao vivo pra pôr dentro do quadro da cena do bairro (sem ele, fica a foto de sempre) */
  sedeJanela?: ReactNode
  /** 🧭 22/11 (Central direta): a cena da semana vem antes do jogo, num banner com "Seguir" */
  direta?: boolean
  /** 🧭 22/11: avisos de uma vez só (contrato de TV, recibos) — aparecem no topo da Central, um de cada vez */
  avisos?: ReactNode
  /** 🎥 a cena do bairro (só quando o mapa do clube existe nesta carreira e algo está acontecendo nele) */
  sede?: CentralSede | null
  /** 📍 abre o mapa já no lugar da cena */
  onSedeMapa?: (vista?: string) => void
  seasonNo: number
  round: number
  divName: string
  youId: number
  euNome: string
  /** 🏟️ o próximo jogo (ou o que está rolando agora, com `rolando`) */
  /** 🏆 depois da liga, o camarote segue a COMPETIÇÃO que está no ar (04/10, Diego: *"todas as copas
   *  após a liga devem ir mexendo também na central"*): `rotulo` troca o selo, `frase` troca a linha de
   *  baixo e `arte` troca o fundo pela arte da copa. Sem eles, é a liga de sempre. */
  proximo: { rodada: number; casa: string; fora: string; rolando: boolean; rotulo?: string; frase?: string; arte?: CentralArte } | null
  /** 🏁 ANTES DA ESTREIA (18/11, Diego: *"começa o modo carreira e já aparece meio confuso… esse negócio de TV no início tá
   *  confuso"*): na rodada 0 o camarote vira uma lista curta — 📺 TV (já no caixa) · 🏆 Master · ⚽ estreia — e o botão é o passo da vez */
  preTemporada?: { master: string | null; travado: boolean } | null
  /** 🔎 RAIO-X DO ADVERSÁRIO (31/10, só na conta do Diego por enquanto): o que o jogo JÁ sabe do rival da próxima
   *  rodada da liga — formação, estilo, os 3 melhores do XI, cansaço (só com o gás ligado) e últimos 5. Nada inventado. */
  raioX?: RaioX | null
  /** camarote sem jogo (convites, fim de temporada…): selo e frase próprios */
  palco?: { rotulo: string; frase?: string; arte?: CentralArte } | null
  /** forma recente por clube ('VVEVD', a mais recente por último) — só rodadas reveladas */
  formas: Record<string, string>
  giro: { rodada: number; jogos: CentralJogo[]; total: number; titulo?: string } | null
  /** a tabela da sua divisão (nome · pontos · você), já ordenada */
  tabela: { name: string; pts: number; you: boolean }[]
  jornal: Jornal
  /** 💸 todos os negócios do pregão desta temporada (de todo clube), do maior pro menor */
  mercado: { negocios: { name: string; pos: string; paid: number; team: string; you: boolean }[]; maisCaro: Contratacao | null }
  agenda: CentralAgenda[]
  /** 📺 sem a Central nova (18/11, só na conta do Diego): a agenda velha das copas */
  agendaVelha?: CentralAgendaVelha[] | null
  /** 🌍 22/10: o ranking global de usuários (top 5 + a sua carreira) no lugar da antiga "Caixa dos rivais" */
  rankGlobal?: { linhas: { pos: number; nome: string; pts: number; you: boolean }[]; abrir: () => void } | null
  /** 🏆 CENTRAL NA COPA (22/10, ideia C aprovada): a chave das fases finais e os artilheiros da Copa.
   *  Anti-spoiler: só placar de fase JÁ apitada; fase que não chegou mostra "?" (quem passa ainda não se sabe). */
  copaChave?: { titulo: string; colunas: { nome: string; jogos: ({ a: string; b: string; ga?: number; gb?: number; venceA?: boolean; youA: boolean; youB: boolean } | null)[] }[] } | null
  copaArtilheiros?: { nome: string; time: string; gols: number; you: boolean }[] | null
  /** ⭐ 22/10: as lendas apresentadas nesta temporada — a foto delas vira a capa do Martelo (pré-temporada e 1ª rodada) */
  fotoLendas?: { nome: string; club: string; year: number }[] | null
  /** 📅 25/10 (Diego: *"a Central é a casa"*): com o calendário, nos dias vazios a semana + o próximo jogo ficam NO LUGAR do camarote */
  semana?: React.ReactNode
  /** o botão grande do camarote: rótulo, o que faz, e se está travado (e por quê) */
  botao: { label: string; sub?: string; disabled?: boolean; onClick: () => void; alt?: { label: string; onClick: () => void }; alt2?: { label: string; onClick: () => void } }
  onTab: (t: 'jogos' | 'tabelas' | 'ranking' | 'elenco' | 'estadio') => void
  /** 🛒 18/11: com a aba Mercado (Brasil Oficial) o cartão 💸 leva pra ela em vez do extrato */
  onMercado?: () => void
  onClubDestination?: (target: 'financas' | 'agencia') => void
  /** 💾 SALVAR À VISTA (04/10): desde que a nuvem só recebe no botão, ele mora no topo da Central.
   *  `estado`: 'em_dia' (nuvem igual ao jogo) · 'atrasado' (jogou desde a última subida) · 'nunca' ·
   *  'deslogado' (só o aparelho) · 'salvando' · 'salvo' (acabou de subir, 2s). `ha` = minutos desde a
   *  última subida; `rodadas` = quantas rodadas jogou desde então. */
  salvar?: FaixaSalvarProps
  /** 🎙️ COLETIVA (19/10): fama do presidente, última manchete e o arquirrival; abre a Sala de imprensa */
  coletiva?: CardColetivaProps
  /** 🕵️ JANELA CHEGANDO (22/10, mockup do Sondar aprovado): nas últimas rodadas avisa que a janela vai abrir no Sondar */
  janela?: boolean
  /** 🏀 15/11: Central da carreira do BASQUETE — mesma tela, troca o que é de futebol: quantos jogos tem a temporada,
   *  a campanha em vitórias-derrotas (sem empate) no lugar dos pontos, e a arte da quadra. Sem `bb`, é o futebol de sempre. */
  bb?: { total: number; vd: Record<string, { w: number; l: number }> }
  /** 🔨 21/11 (janela nova): sondar e vender moram no Mercado e os contratos têm tela própria — o aviso diz isso */
  janelaNova?: boolean
}
export type FaixaSalvarProps = { /** 🎁 08/11: dias que faltam no teste grátis de salvar */ diasTeste?: number | null; estado: 'bloqueado' | 'em_dia' | 'atrasado' | 'nunca' | 'deslogado' | 'salvando' | 'salvo' | 'salvo_local' | 'so_aparelho' | 'salvo_aparelho' | 'salvo_7d'; ha?: number; rodadas?: number; onClick: () => void
  /** ☁️⭐ 07/10: conta grátis com carreira nova salva só no aparelho — o botão roxo abre os planos */
  onCraque?: () => void }

const ARTES = { copaBr: copaBrArt, copaLeg: copaLegArt, liberta: libertaArt, mundo: mundoArt }
const FUNDOS: Record<CentralArte, string> = { estadio: estadioArt, copaBr: copaBrArt, copaLeg: copaLegArt, super: superArt, liberta: libertaArt, champions: championsArt, mundial: mundialArt, mundo: mundoArt }
// 💾 a faixa do SALVAR, logo abaixo do título da Central (04/10). Palavras do Diego ao aprovar a
// ideia: *"sim, faz"*. Motivo: desde 04/10 a nuvem só recebe a carreira quando a pessoa aperta
// salvar — então o botão não pode morar só no pé da página. A faixa diz em que pé está a nuvem
// (em dia · atrasada · nunca · só no aparelho) e o botão sobe na hora.
function FaixaSalvar({ s }: { s: FaixaSalvarProps }) {
  const t = useT()
  const ha = (m?: number) => m == null ? '' : m < 1 ? t('agora há pouco', 'just now') : m < 60 ? t(`há ${m} min`, `${m} min ago`) : t(`há ${Math.round(m / 60)} h`, `${Math.round(m / 60)} h ago`)
  const AMBAR = '#FFB020', VERDE = '#4ADE80', CINZA = '#9A9A9A'
  const [texto, cor] = ((): [string, string] => {
    switch (s.estado) {
      case 'bloqueado': return [t('🔒 Seu teste de 5 dias acabou · pra salvar novos avanços, escolha um plano', '🔒 Your 5-day trial is over · to save new progress, pick a plan'), '#FFB020']
      case 'salvando': return [t('⏳ Salvando na nuvem…', '⏳ Saving to the cloud…'), '#fff']
      case 'salvo': return [t('✅ Salvo na nuvem agora', '✅ Saved to the cloud just now'), VERDE]
      case 'salvo_7d': { const d = s.diasTeste ?? null; return [d != null ? t(`✅ Salvo · 🎁 teste grátis: falta${d === 1 ? '' : 'm'} ${d} dia${d === 1 ? '' : 's'}`, `✅ Saved · 🎁 free trial: ${d} day${d === 1 ? '' : 's'} left`) : t('✅ Salvo', '✅ Saved'), VERDE] }
      case 'salvo_local': return [t('✅ Salvo no aparelho', '✅ Saved on this device'), VERDE]
      case 'so_aparelho': return [t('📱 Esta carreira salva só neste aparelho · ☁️ a nuvem é do ⭐ Craque', '📱 This career saves only on this device · ☁️ the cloud is for ⭐ Star'), AMBAR]
      case 'salvo_aparelho': return [t('✅ Salvo no aparelho · pra guardar na nuvem e jogar em outro celular: ⭐ Craque', '✅ Saved on this device · to keep it in the cloud and play on another phone: ⭐ Star'), VERDE]
      case 'deslogado': return [t('📱 Só no aparelho · entre na conta pra guardar na nuvem', '📱 Device only · sign in to keep it in the cloud'), CINZA]
      case 'nunca': return [t('☁️ Esta carreira ainda não foi salva na nuvem', '☁️ This career was never saved to the cloud'), AMBAR]
      case 'atrasado': return [s.rodadas ? t(`☁️ Salvo ${ha(s.ha)} · ${s.rodadas} rodada${s.rodadas === 1 ? '' : 's'} desde então`, `☁️ Saved ${ha(s.ha)} · ${s.rodadas} round${s.rodadas === 1 ? '' : 's'} since`) : t(`☁️ Salvo ${ha(s.ha)} · temporada nova desde então`, `☁️ Saved ${ha(s.ha)} · new season since`), AMBAR]
      default: return [t(`☁️ Salvo na nuvem ${ha(s.ha)} · tudo em dia`, `☁️ Saved to the cloud ${ha(s.ha)} · up to date`), VERDE]
    }
  })()
  const ocupado = s.estado === 'salvando'
  // ☁️ 19/10 (Diego): conta sem plano apertou Salvar → abre os planos (a faixinha que sumia em 2 s parecia bug)
  const [planos, setPlanos] = useState(false)
  const [aviso7, setAviso7] = useState(false)
  // ✕ 29/10 (Diego: "fechou, não volta"): a janela que abre SOZINHA depois do salvamento aparece uma vez por aviso; o botão Salvar
  // de quem não tem plano continua abrindo (aí foi a pessoa que pediu)
  useEffect(() => {
    if (s.estado === 'salvo_aparelho' && !avisoFechado('nuvem-aparelho')) { fechaAviso('nuvem-aparelho'); setPlanos(true) }
    if (s.estado === 'salvo_7d' && !avisoFechado('teste-5d')) { fechaAviso('teste-5d'); setAviso7(true); setPlanos(true) }
  }, [s.estado])
  const salvar = () => { if (s.estado === 'bloqueado') { setPlanos(true); return } const semPlano = s.estado === 'so_aparelho'; s.onClick(); if (semPlano) setPlanos(true) }
  return (<>
    <div className="ll-central-salvar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, margin: '0 2px 12px', padding: '7px 8px 7px 12px', border: '2px solid rgba(255,196,0,.35)', borderRadius: 12, background: 'rgba(255,255,255,.05)' }}>
      <span style={{ ...OSW, fontSize: 11, letterSpacing: '.05em', color: cor, lineHeight: 1.25, minWidth: 0 }}>{texto}</span>
      <span style={{ display: 'flex', gap: 6, flex: '0 0 auto' }}>
      {s.onCraque && <button onClick={s.onCraque} style={{ ...OSW, fontSize: 11, letterSpacing: '.04em', color: '#fff', background: '#7C3AED', border: '2px solid #0C0C0C', borderRadius: 10, padding: '7px 9px', boxShadow: '2px 2px 0 #000', cursor: 'pointer' }}>{t('⭐ Craque', '⭐ Star')}</button>}
      <button onClick={salvar} disabled={ocupado} style={{ ...OSW, flex: '0 0 auto', fontSize: 12, letterSpacing: '.04em', color: '#0C0C0C', background: ocupado ? '#9A9A9A' : G_OURO, border: '2px solid #0C0C0C', borderRadius: 10, padding: '7px 12px', boxShadow: '2px 2px 0 #000', cursor: ocupado ? 'default' : 'pointer' }}>
        {s.estado === 'bloqueado' ? t('🔒 Salvar', '🔒 Save') : t('💾 Salvar', '💾 Save')}
      </button>
      </span>
    </div>
    {planos && <JanelaNuvemPlanos travado={s.estado === 'bloqueado'} aviso7={aviso7} onClose={() => { setPlanos(false); setAviso7(false) }} />}
  </>)
}

const ordinal = (n: number) => getLang() === 'en' ? `${n}${n === 1 ? 'st' : n === 2 ? 'nd' : n === 3 ? 'rd' : 'th'}` : `${n}º`

function Chip({ children, bg = GOLD, cor = INK }: { children: React.ReactNode; bg?: string; cor?: string }) {
  return <span style={{ ...OSW, fontSize: 9, letterSpacing: '.08em', background: bg, color: cor, border: `2px solid ${INK}`, borderRadius: 999, padding: '2px 8px', whiteSpace: 'nowrap' }}>{children}</span>
}
function Disco({ nome, size }: { nome: string; size: number }) {
  return <span style={{ width: size, height: size, borderRadius: '50%', background: '#fff', border: `3px solid ${INK}`, boxShadow: `3px 3px 0 ${INK}`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}><Escudo nome={nome} size={Math.round(size * .72)} /></span>
}
/** 🟢🟡🔴 os últimos 5 resultados em bolinhas (sem letra — a cor conta) */
function Forma({ f }: { f?: string }) {
  const s = (f ?? '').slice(-5)
  if (!s) return <span style={{ fontSize: 9, fontWeight: 800, opacity: .55 }}>—</span>
  return <span>{s.split('').map((c, i) => <i key={i} style={{ display: 'inline-block', width: 9, height: 9, borderRadius: '50%', margin: '0 1.5px', border: `1.5px solid ${INK}`, background: c === 'V' ? '#2FBF5A' : c === 'E' ? GOLD : RED }} />)}</span>
}
function Cabecalho({ titulo, sub, link, onClick }: { titulo: string; sub?: string; link?: string; onClick?: () => void }) {
  return <button type="button" className="ll-central-link" onClick={onClick} style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 13px', background: INK, color: '#fff', borderBottom: `3px solid ${INK}`, cursor: onClick ? 'pointer' : 'default' }}>
    <b style={{ ...OSW, fontSize: 15, letterSpacing: '.08em' }}>{titulo}</b>
    <small style={{ fontSize: 9.5, fontWeight: 800, opacity: .75 }}>{sub}{link && <span style={{ color: GOLD }}> {link} ›</span>}</small>
  </button>
}

export function CentralCarreira(p: CentralProps) {
  const visualV2=useCareerVisualV2()
  // 🧭 22/11 (Central direta): a cena da semana ainda não vista toma o lugar do cartão do jogo até a pessoa tocar em "Seguir"
  const [sedeVista, setSedeVista] = useState(() => { try { return localStorage.getItem(SEDE_FECHADA) ?? '' } catch { return '' } })
  const sedeAntes = !!(p.direta && p.sede && p.semana && sedeVista !== p.sede.chave)
  const t = useT()
  const [mercadoTodo, setMercadoTodo] = useState(false) // 💸 mostra os 5 maiores; o resto abre no toque
  const posDe = (nome: string) => { const i = p.tabela.findIndex(x => x.name === nome); return i >= 0 ? i + 1 : null }
  const ptsDe = (nome: string) => p.tabela.find(x => x.name === nome)?.pts ?? 0
  const lider = p.tabela[0]?.name
  const souCasa = p.proximo?.casa === p.euNome
  const adv = p.proximo ? (souCasa ? p.proximo.fora : p.proximo.casa) : null
  const advPos = adv ? posDe(adv) : null
  const minhaPos = posDe(p.euNome)
  // 🔥 a frase do confronto sai só de posição e pontos — nada inventado
  const frase = (() => {
    if (p.bb) return p.proximo?.frase ?? p.palco?.frase ?? null // 🏀 a frase do basquete vem pronta (vitórias, não pontos)
    if (p.proximo?.frase) return p.proximo.frase
    if (!p.proximo && p.palco?.frase) return p.palco.frase
    if (p.preTemporada) return null // 🏁 antes do 1º jogo ninguém é líder com 0 ponto — a lista "Antes da estreia" fala no lugar
    if (!p.proximo || !adv || minhaPos == null || advPos == null) return null
    const d = ptsDe(adv) - ptsDe(p.euNome)
    if (advPos === 1 && minhaPos !== 1) return t(`🔥 Você pega o líder · ${d > 0 ? `vencer te deixa a ${Math.max(0, d - 3)} ponto${d - 3 === 1 ? '' : 's'}` : 'e pode assumir a ponta'}`, `🔥 You face the leader · ${d > 0 ? `a win leaves you ${Math.max(0, d - 3)} point${d - 3 === 1 ? '' : 's'} behind` : 'and could take the top spot'}`)
    if (minhaPos === 1) return t(`👑 Você é o líder · ${adv} vem em ${ordinal(advPos)}`, `👑 You lead · ${adv} are ${ordinal(advPos)}`)
    if (Math.abs(advPos - minhaPos) <= 1) return t(`⚔️ Confronto direto: ${ordinal(minhaPos)} × ${ordinal(advPos)}`, `⚔️ Six-pointer: ${ordinal(minhaPos)} v ${ordinal(advPos)}`)
    if (advPos >= p.tabela.length - 3) return t(`🎯 ${adv} luta contra a queda — jogo pra não dar mole`, `🎯 ${adv} are fighting the drop — no slip-ups`)
    return t(`${ordinal(minhaPos)} × ${ordinal(advPos)} · ${d > 0 ? `${d} pontos separam vocês` : d < 0 ? `você tem ${-d} a mais` : 'mesmos pontos'}`, `${ordinal(minhaPos)} v ${ordinal(advPos)} · ${d > 0 ? `${d} points between you` : d < 0 ? `you are ${-d} ahead` : 'level on points'}`)
  })()
  const giroTag = (j: CentralJogo) => {
    const meu = j.hId === p.youId || j.aId === p.youId
    if (meu) {
      const meusG = j.hId === p.youId ? j.hg : j.ag, delesG = j.hId === p.youId ? j.ag : j.hg
      if (p.bb) return meusG > delesG ? <Chip bg="#2FBF5A">{t('você venceu', 'you won')}</Chip> : <Chip bg={RED} cor="#fff">{t('você perdeu', 'you lost')}</Chip>
      return meusG > delesG ? <Chip bg="#2FBF5A">{t('você venceu', 'you won')}</Chip> : meusG === delesG ? <Chip bg="#fff">{t('você empatou', 'you drew')}</Chip> : <Chip bg={RED} cor="#fff">{t('você perdeu', 'you lost')}</Chip>
    }
    if (j.h === lider || j.a === lider) return <Chip>{t('líder', 'leader')}</Chip>
    if (p.bb) return Math.abs(j.hg - j.ag) <= 3 ? <Chip bg="#fff">{t('no estouro', 'buzzer')}</Chip> : Math.abs(j.hg - j.ag) >= 20 ? <Chip bg="#fff">{t('atropelo', 'blowout')}</Chip> : <span />
    if (j.hg + j.ag >= 5) return <Chip bg="#fff">{t('jogaço', 'thriller')}</Chip>
    return <span />
  }
  const campanha = (nome: string) => { const r = p.bb?.vd[nome]; return r ? `${r.w}-${r.l}` : `${ptsDe(nome)} pts` } // 🏀 vitórias-derrotas
  const lado = (nome: string) => (
    <div style={{ textAlign: 'center', minWidth: 0 }}>
      <Disco nome={nome} size={78} />
      <b style={{ ...OSW, display: 'block', fontSize: 17, marginTop: 8, textShadow: '0 2px 4px #000', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{nome}</b>
      <small style={{ display: 'block', fontSize: 10, fontWeight: 800, opacity: .85, margin: '2px 0 4px' }}>{p.preTemporada || (!p.bb && !p.agendaVelha && p.proximo?.arte) ? '\u00a0' : posDe(nome) != null ? `${ordinal(posDe(nome)!)} · ${p.bb ? campanha(nome) : `${ptsDe(nome)} pts`}` : '—'}</small>
      {!p.bb && <Forma f={p.formas[nome]} />}
    </div>
  )
  const en = getLang() === 'en'
  // 📊 celular: 5 linhas (4 de cima + você). 🖥️ desktop: a tabela INTEIRA — as linhas extras só existem no monitor.
  const corta = (n: number) => (minhaPos != null && minhaPos > n) ? [...p.tabela.slice(0, n - 1), p.tabela[minhaPos - 1]] : p.tabela.slice(0, n)
  const tabelaCurta = p.tabela // 🖥️ desktop: inteira (Diego 03/10: *"ficaria melhor a tabela completa"*)
  const noCelular = new Set(corta(5).map(x => x.name))

  return (
    <div className={`ll-central${p.bb ? ' ll-central-bb' : ''}`}>
      <div className="ll-central-topo">
        <div style={{ minWidth: 0 }}>
          <p style={{ ...OSW, fontSize: 10, letterSpacing: '.16em', color: GOLD, margin: 0 }}>{t('Temporada', 'Season')} {p.seasonNo} · {p.divName}</p>
          <h2 style={{ ...OSW, fontSize: 29, lineHeight: .95, margin: 0, whiteSpace: 'nowrap', color: '#fff' }}>📺 Central <span style={{ background: G_OURO, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Legends</span></h2>
        </div>
        <b style={{ ...OSW, fontSize: 20, lineHeight: 1, whiteSpace: 'nowrap', color: '#fff' }}>{p.bb ? t('Jogo', 'Game') : t('Rod.', 'Rd.')} {p.round}<span style={{ color: '#888', fontSize: 13 }}> / {p.bb?.total ?? 38}</span></b>
      </div>
      {!visualV2 && p.salvar && <FaixaSalvar s={p.salvar} />}

      {/* 📱 celular: camarote → giro → Martelo → mercado → tabela+agenda (ordem por CSS `order`).
          🖥️ desktop (03/10, 4º ajuste dele): esquerda camarote → [tabela inteira | giro inteiro + agenda];
          direita Martelo → mercado, esticado pra fechar na MESMA linha do fim da tabela. */}
      <div className="ll-central-grid">
        <div className="ll-central-esq">
          {/* 🏟️ O CAMAROTE: próximo jogo + o botão de sempre */}
          {p.avisos && <div style={{ flex: '0 0 100%', minWidth: 0 }}>{p.avisos}</div>}
          {sedeAntes && p.sede ? <div className="ll-c-hero" style={{ flex: '0 0 100%', minWidth: 0 }}>
            <CartaoSede s={p.sede} janela={p.sedeJanela} cls="" seguir={() => setSedeVista(p.sede!.chave)} onMapa={() => p.onSedeMapa ? p.onSedeMapa(p.sede?.vista) : p.onTab('estadio')} />
            {p.proximo && <button type="button" onClick={() => setSedeVista(p.sede!.chave)} style={{ ...OSW, display: 'flex', alignItems: 'center', gap: 8, width: '100%', marginTop: 10, background: '#1d1812', color: '#fff', border: `2px solid ${INK}`, borderRadius: 14, padding: '8px 12px', fontSize: 14, cursor: 'pointer' }}>
              <Escudo nome={p.proximo.casa} size={26} /><span style={{ opacity: .7 }}>×</span><Escudo nome={p.proximo.fora} size={26} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.proximo.casa === p.euNome ? p.proximo.fora : p.proximo.casa}</span>
              <span style={{ marginLeft: 'auto', color: GOLD, whiteSpace: 'nowrap' }}>{t('a seguir ›', 'up next ›')}</span>
            </button>}
          </div> : p.semana ? <div className="ll-c-hero" style={{ flex: '0 0 100%', minWidth: 0 }}>{p.semana}</div> : <div className="ll-central-card ll-c-hero" style={{ background: `#0a1a12 url(${p.bb ? quadraArt : FUNDOS[p.proximo?.arte ?? p.palco?.arte ?? 'estadio']}) center 40% / cover`, position: 'relative', color: '#fff', borderColor: '#847657', minHeight: 372 }}>
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,#0002 0%,#0001 30%,#0C0C0Cc9 66%,#0C0C0Cf5 100%)' }} />
            <div style={{ position: 'relative', padding: '12px 13px 13px', display: 'flex', flexDirection: 'column', minHeight: 372 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                <Chip>{p.proximo ? (p.proximo.rotulo ?? (p.bb ? t(`🏀 Próximo jogo · ${p.proximo.rodada} de ${p.bb.total}`, `🏀 Next game · ${p.proximo.rodada} of ${p.bb.total}`) : p.proximo.rolando ? t(`⚽ Rodada ${p.proximo.rodada} rolando`, `⚽ Round ${p.proximo.rodada} live`) : t(`⚽ Próximo jogo · rodada ${p.proximo.rodada}`, `⚽ Next match · round ${p.proximo.rodada}`))) : (p.palco?.rotulo ?? t('🏁 Liga encerrada', '🏁 League over'))}</Chip>
                {p.proximo && !p.proximo.rotulo && <Chip bg="#fff">{souCasa ? t('🏟️ em casa', '🏟️ home') : t('🚌 fora', '🚌 away')}</Chip>}
              </div>
              {p.proximo ? (
                <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', marginTop: 14 }}>
                  {lado(p.proximo.casa)}
                  <b style={{ ...OSW, fontSize: 30, color: GOLD, textShadow: '0 2px 4px #000', padding: '0 6px' }}>×</b>
                  {lado(p.proximo.fora)}
                </div>
              ) : (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', marginTop: 14 }}>
                  <div><Disco nome={p.euNome} size={78} /><b style={{ ...OSW, display: 'block', fontSize: 17, marginTop: 8, textShadow: '0 2px 4px #000' }}>{p.euNome}</b><small style={{ fontSize: 10, fontWeight: 800, opacity: .85 }}>{minhaPos != null ? `${ordinal(minhaPos)} · ${campanha(p.euNome)}` : ''}</small></div>
                </div>
              )}
              {frase && <p style={{ textAlign: 'center', fontSize: 11, fontWeight: 800, color: '#FFE79A', margin: '10px 0' }}>{frase}</p>}
              {p.preTemporada && (() => {
                const pt = p.preTemporada
                const linha = (k: string, est: 'ok' | 'vez' | 'trava', titulo: string, txt: string) => (
                  <div key={k} style={{ display: 'flex', gap: 9, alignItems: 'center', background: est === 'vez' ? 'rgba(255,196,0,.16)' : 'rgba(0,0,0,.45)', border: `2px solid ${est === 'vez' ? GOLD : 'rgba(255,255,255,.2)'}`, borderRadius: 11, padding: '7px 9px', opacity: est === 'trava' ? .7 : 1 }}>
                    <span style={{ flex: 'none', width: 26, height: 26, borderRadius: '50%', background: est === 'ok' ? '#1B7A3D' : est === 'vez' ? GOLD : '#444', color: est === 'vez' ? INK : '#fff', border: `2px solid ${INK}`, display: 'flex', alignItems: 'center', justifyContent: 'center', ...OSW, fontSize: 13 }}>{est === 'ok' ? '✓' : est === 'vez' ? '!' : '🔒'}</span>
                    <span style={{ minWidth: 0, textAlign: 'left' }}><b style={{ ...OSW, display: 'block', fontSize: 13 }}>{titulo}</b><small style={{ display: 'block', fontSize: 10.5, fontWeight: 700, opacity: .85, lineHeight: 1.3 }}>{txt}</small></span>
                  </div>
                )
                return (
                  <div style={{ display: 'grid', gap: 6, margin: '12px 0' }}>
                    <b style={{ ...OSW, fontSize: 12, letterSpacing: '.1em', color: GOLD, textAlign: 'left' }}>{t('🏁 Antes da estreia', '🏁 Before kick-off')}</b>
                    {pt.master ? linha('m', 'ok', t('🏆 Patrocinador Master', '🏆 Master sponsor'), t(`Assinado: ${pt.master}.`, `Signed: ${pt.master}.`))
                      : linha('m', 'vez', t('🏆 Patrocinador Master', '🏆 Master sponsor'), t('Marcas na mesa, cada uma com prazo e meta. Escolha uma.', 'Brands on the table, each with a length and a goal. Pick one.'))}
                    {linha('j', pt.travado ? 'trava' : 'vez', t('⚽ Estreia', '⚽ First match'), pt.travado ? t('Abre depois do Master.', 'Opens after the Master.') : t('Tudo pronto. É só começar.', 'All set. Just kick off.'))}
                  </div>
                )
              })()}
              <button type="button" onClick={p.botao.onClick} disabled={p.botao.disabled}
                style={{ ...OSW, width: '100%', background: p.botao.disabled ? '#5a5a5a' : G_OURO, color: p.botao.disabled ? '#ddd' : INK, border: `3px solid ${INK}`, borderRadius: 14, padding: 12, textAlign: 'center', boxShadow: '4px 4px 0 #000', fontSize: 19, letterSpacing: '.04em', cursor: p.botao.disabled ? 'default' : 'pointer', marginTop: frase ? 0 : 10 }}>{p.botao.label}</button>
              {p.botao.alt && <button type="button" onClick={p.botao.alt.onClick}
                style={{ ...OSW, width: '100%', marginTop: 8, background: '#7C3AED', color: '#fff', border: `3px solid ${INK}`, borderRadius: 14, padding: 12, textAlign: 'center', boxShadow: '4px 4px 0 #000', fontSize: 16, fontWeight: 900, cursor: 'pointer' }}>{p.botao.alt.label}</button>}
              {p.botao.alt2 && <button type="button" onClick={p.botao.alt2.onClick}
                style={{ ...OSW, width: '100%', marginTop: 8, background: '#FFC400', color: INK, border: `3px solid ${INK}`, borderRadius: 14, padding: 12, textAlign: 'center', boxShadow: '4px 4px 0 #000', fontSize: 16, fontWeight: 900, cursor: 'pointer' }}>{p.botao.alt2.label}</button>}
              {p.botao.sub && <small style={{ textAlign: 'center', fontSize: 9.5, fontWeight: 800, opacity: .6, marginTop: 6 }}>{p.botao.sub}</small>}
            </div>
          </div>}

          {p.sede && !p.direta && <CartaoSede s={p.sede} janela={p.sedeJanela} cls="ll-c-sede-cel" onMapa={() => p.onSedeMapa ? p.onSedeMapa(p.sede?.vista) : p.onTab('estadio')} />}
          {visualV2 && <div className="cv2-career-start-tools"><CareerCentralGuide onSquad={()=>p.onTab('elenco')} onMatches={()=>p.onTab('jogos')}/>
          {/* 🧭 21/11 (Diego: *"aparece uma aba de finanças e agência estranhamente na central"*): os atalhos saíram — Finanças e Agência moram na aba Clube */}
          <>{p.salvar && <FaixaSalvar s={p.salvar} />}</></div>}
          {p.raioX && <CartaoRaioX r={p.raioX} />}
          {/* 📊 TABELA → abre Tabelas. Celular: 5 linhas; desktop: a tabela inteira */}
          <div className="ll-central-card ll-c-tabela" style={{ background: CREME }}>
            <Cabecalho titulo={t('📊 Tabela', '📊 Table')} sub={p.divName.toLowerCase()} link={t('abrir', 'open')} onClick={() => p.onTab('tabelas')} />
            {p.preTemporada ? <p style={{ margin: 0, padding: '10px 13px', fontSize: 12, fontWeight: 700, color: '#5a5647' }}>{t('Ninguém jogou ainda. A tabela começa a contar no 1º jogo.', 'Nobody has played yet. The table starts counting from the first match.')}</p> :
            <button type="button" className="ll-central-link" onClick={() => p.onTab('tabelas')} style={{ width: '100%' }}>
              {tabelaCurta.map(x => { const pos = posDe(x.name) ?? 0; return (
                <div key={x.name} className={`ll-central-row${noCelular.has(x.name) ? '' : ' ll-central-not-desk'}`} style={{ padding: '6px 9px', gap: 6, fontSize: 11.5, background: x.you ? '#FFF3C4' : undefined, outline: x.you ? `2px solid ${GOLD}` : undefined, outlineOffset: -2 }}>
                  <span style={{ width: 17, color: '#777' }}>{pos}º</span><Escudo nome={x.name} size={18} /><span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{x.name}</span><b>{p.bb ? campanha(x.name) : x.pts}</b>
                </div>
              ) })}
            </button>}
          </div>
          <div className="ll-central-lado">
          {/* 📣 O GIRO: só a rodada já revelada. Celular: 3 jogos (o seu, o do líder, o jogaço);
              desktop: a rodada inteira, ao lado da tabela, no padrão das caixas creme (Diego 03/10). */}
          {p.janela && (
            <div className="ll-central-card" style={{ background: '#fff', color: INK, padding: '11px 13px' }}>
              <p style={{ ...OSW, fontSize: 16, margin: 0 }}>{t('🕵️ A janela vai abrir', '🕵️ The window is coming')}</p>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#5a5647', margin: '3px 0 0', lineHeight: 1.45 }}>{p.janelaNova ? t('Sondar (1 técnico + 1 jogador 🆓 sem contrato) e pôr jogador à venda é no 🛒 Mercado, até a última rodada. No fim da temporada, quem tem contrato vencendo ganha a tela de 📝 Contratos — e o leilão vem direto.', 'Scouting (1 coach + 1 player 🆓 out of contract) and putting players up for sale happen in the 🛒 Market, until the last round. At the end of the season, expiring contracts get their own 📝 Contracts screen — then straight to the auction.') : t('No fim da temporada a janela abre direto no 🕵️ Sondar: dá pra trazer 1 técnico e 1 jogador 🆓 sem contrato de outro clube pro leilão.', 'At the end of the season the window opens straight on 🕵️ Scout: you can bring 1 coach and 1 player 🆓 out of contract from another club to the auction.')}</p>
            </div>
          )}
          {p.giro && p.giro.jogos.length > 0 && (
            <div className="ll-central-card ll-c-giro" style={{ background: CREME }}>
              <Cabecalho titulo={p.giro.titulo ?? `📣 ${t('Giro da rodada', 'Around the round')} ${p.giro.rodada}`} link={t('ver jogos', 'see matches')} onClick={() => p.onTab('jogos')} />
              {p.giro.jogos.map((j, i) => (
                <div key={i} className={`ll-central-row ll-central-giro-row${i >= 3 ? ' ll-central-not-desk' : ''}`} style={{ gridTemplateColumns: '1fr auto 1fr auto', gap: 6, padding: '6px 10px', fontSize: 11.5, fontWeight: 800 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5, minWidth: 0 }}><Escudo nome={j.h} size={18} /><span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{j.h}</span></span>
                  <b style={{ ...OSW, fontSize: 15, background: INK, color: CREME, borderRadius: 7, padding: '0 8px', letterSpacing: '.06em' }}>{j.hg}<span style={{ color: '#999', fontSize: 11 }}> × </span>{j.ag}</b>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5, minWidth: 0 }}><span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{j.a}</span><Escudo nome={j.a} size={18} /></span>
                  {giroTag(j)}
                </div>
              ))}
              {p.giro.jogos.length > 3 && <button type="button" className="ll-central-link ll-central-so-cel" onClick={() => p.onTab('jogos')} style={{ width: '100%', padding: '6px 12px', fontSize: 9.5, fontWeight: 800, color: '#666', textAlign: 'center' }}>+ {p.giro.jogos.length - 3} {t('jogos da rodada', 'more matches')} ›</button>}
            </div>
          )}
          {p.copaChave && p.copaChave.colunas.length > 0 && (
            <div className="ll-central-card ll-c-giro" style={{ background: '#fff' }}>
              <Cabecalho titulo={p.copaChave.titulo} link={t('ver tudo', 'see all')} onClick={() => p.onTab('tabelas')} />
              <div style={{ display: 'flex', gap: 6, padding: '10px 10px 12px', alignItems: 'center' }}>
                {p.copaChave.colunas.map((col, ci) => (
                  <div key={ci} style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 5, justifyContent: 'center' }}>
                    <small style={{ ...OSW, fontSize: 9.5, letterSpacing: '.08em', color: '#7a7462', textAlign: 'center' }}>{col.nome}</small>
                    {col.jogos.map((j, ji) => j ? (
                      <div key={ji} style={{ border: `2px solid ${INK}`, borderRadius: 8, overflow: 'hidden', background: j.youA || j.youB ? '#FFF3C4' : '#fff' }}>
                        {([[j.a, j.ga, j.venceA === true, j.youA], [j.b, j.gb, j.venceA === false, j.youB]] as const).map(([nome, g, venceu, eu], k) => (
                          <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '2px 6px', fontSize: 10.5, fontWeight: eu ? 900 : 800, borderTop: k ? '1px solid rgba(0,0,0,.12)' : 0, opacity: j.venceA != null && !venceu ? .55 : 1 }}>
                            <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{nome}</span>
                            <b style={{ ...OSW, fontSize: 11 }}>{g ?? '–'}</b>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div key={ji} style={{ border: '2px dashed rgba(0,0,0,.3)', borderRadius: 8, padding: '7px 6px', textAlign: 'center', fontSize: 10.5, fontWeight: 800, color: '#9a927a' }}>{ci === p.copaChave!.colunas.length - 1 ? '🏆' : '?'}</div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}
          {p.copaArtilheiros && p.copaArtilheiros.length > 0 && (
            <div className="ll-central-card ll-c-giro" style={{ background: CREME }}>
              <Cabecalho titulo={t('⚽ Artilheiros da Copa', '⚽ Cup top scorers')} sub={t('até agora', 'so far')} />
              {p.copaArtilheiros.map((x, i) => (
                <div key={x.nome + x.time} className="ll-central-row" style={{ padding: '6px 11px', gap: 8, fontSize: 11.5, background: x.you ? '#FFF3C4' : undefined }}>
                  <span style={{ width: 18 }}>{['🥇', '🥈', '🥉'][i] ?? `${i + 1}º`}</span>
                  <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: x.you ? 900 : 800 }}>{x.nome} <span style={{ fontWeight: 700, color: '#6a6250' }}>· {x.time}</span></span>
                  <b style={{ ...OSW, fontSize: 15 }}>{x.gols}</b>
                </div>
              ))}
            </div>
          )}
          {/* 🗓️ AGENDA das copas → abre Jogos. No desktop sobe pra baixo do camarote, em linha */}
          {p.agendaVelha && <div className="ll-central-card ll-c-agenda" style={{ background: CREME }}>
            <Cabecalho titulo={t('🗓️ Agenda', '🗓️ Calendar')} link={t('jogos', 'matches')} onClick={() => p.onTab('jogos')} />
            <div className="ll-central-agenda-lista">
            {p.agendaVelha.map((a, i) => (
              <div key={i} className="ll-central-row" style={{ padding: '7px 9px', gap: 8 }}>
                <span style={{ width: 44, height: 34, flex: 'none', border: `2px solid ${INK}`, borderRadius: 7, background: `url(${ARTES[a.arte]}) center / cover` }} />
                <span style={{ fontSize: 11, lineHeight: 1.2, minWidth: 0 }}><b style={{ ...OSW, fontSize: 12, display: 'block' }}>{en ? a.titulo[1] : a.titulo[0]}</b><small style={{ color: '#555', fontWeight: 700 }}>{en ? a.sub[1] : a.sub[0]}</small></span>
              </div>
            ))}
            </div>
          </div>}
          {/* 🗓️ AGENDA = os próximos jogos do seu clube (18/11) → abre Jogos */}
          {!p.agendaVelha && p.agenda.length > 0 && <div className="ll-central-card ll-c-agenda" style={{ background: CREME }}>
            <Cabecalho titulo={t('🗓️ Próximos jogos', '🗓️ Upcoming matches')} link={t('jogos', 'matches')} onClick={() => p.onTab('jogos')} />
            <div className="ll-central-agenda-lista">
            {p.agenda.map((a, i) => { const d = new Date(a.dia); const dow = d.toLocaleDateString(en ? 'en-GB' : 'pt-BR', { weekday: 'short', timeZone: 'UTC' }).replace('.', ''); const mes = d.toLocaleDateString(en ? 'en-GB' : 'pt-BR', { month: 'short', timeZone: 'UTC' }).replace('.', ''); return (
              <div key={i} className="ll-central-row" style={{ padding: '7px 9px', gap: 9, alignItems: 'center' }}>
                <span style={{ width: 44, flex: 'none', textAlign: 'center', border: `2px solid ${INK}`, borderRadius: 8, background: i === 0 ? GOLD : '#fff', lineHeight: 1.05, padding: '3px 0' }}>
                  <small style={{ ...OSW, display: 'block', fontSize: 9, letterSpacing: '.06em' }}>{dow}</small>
                  <b style={{ ...OSW, display: 'block', fontSize: 16 }}>{d.getUTCDate()}</b>
                  <small style={{ ...OSW, display: 'block', fontSize: 9 }}>{mes}</small>
                </span>
                <Escudo nome={a.adv} size={26} />
                <span style={{ fontSize: 11, lineHeight: 1.2, minWidth: 0, flex: 1 }}>
                  <b style={{ ...OSW, fontSize: 13.5, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.adv}</b>
                  <small style={{ color: '#555', fontWeight: 700, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{en ? a.comp[1] : a.comp[0]}{a.fase ? ` · ${a.fase}` : ''}</small>
                  {a.onde && <small style={{ color: '#7a5a1e', fontWeight: 800, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>📍 {a.casa ? t('no seu estádio', 'at your ground') + ' · ' : ''}{a.onde}</small>}
                </span>
                {a.casa != null && <Chip bg="#fff">{a.casa ? t('🏟️ casa', '🏟️ home') : t('🚌 fora', '🚌 away')}</Chip>}
              </div>
            ) })}
            </div>
          </div>}
          </div>
        </div>

        <div className="ll-central-dir">
          {p.sede && !p.direta && <CartaoSede s={p.sede} janela={p.sedeJanela} cls="ll-c-sede-pc" onMapa={() => p.onSedeMapa ? p.onSedeMapa(p.sede?.vista) : p.onTab('estadio')} />}
          {/* 📰 O MARTELO do meio da temporada */}
          <div className="ll-central-card ll-central-martelo ll-c-martelo" style={{ background: '#FBF5E4', borderRadius: 8 }}>
            <div style={{ padding: '10px 13px 6px', textAlign: 'center', borderBottom: `3px double ${INK}` }}>
              <b style={{ ...OSW, fontSize: 26, letterSpacing: 2 }}>O Martelo</b>
              <small style={{ display: 'block', fontSize: 8.5, fontWeight: 800, letterSpacing: 1.4, color: '#6c604a', textTransform: 'uppercase' }}>{p.round > 0 ? (p.bb ? t(`Edição do jogo ${p.round}`, `Game ${p.round} edition`) : t(`Edição da rodada ${p.round}`, `Round ${p.round} edition`)) : t('Edição de pré-temporada', 'Pre-season edition')} · {t('Temporada', 'Season')} {p.seasonNo} · {p.divName}</small>
            </div>
            <div style={{ height: p.fotoLendas?.length ? 190 : 150, background: `url(${p.bb ? quadraArt : estadioArt}) center 40% / cover`/* 📰 21/11 (Diego: "sempre aparece a foto do cara levantando troféu… não tem sentido"): no meio da temporada a capa é o estádio; a taça fica pro jornal do campeão */, position: 'relative', borderBottom: `3px solid ${INK}` }}>
              {p.fotoLendas?.length ? <div style={{ position: 'absolute', inset: 0 }}><FotoLendas lendas={p.fotoLendas} altura={190} /></div> : null}
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,#0000 40%,#000c)' }} />
              <div style={{ position: 'absolute', left: 12, right: 12, bottom: 10, color: '#fff' }}>
                <b style={{ ...OSW, fontSize: 22, lineHeight: 1, display: 'block', textShadow: '0 2px 4px #000' }}>{p.jornal.manchete ? (en ? p.jornal.manchete.en : p.jornal.manchete.pt) : (p.bb ? t(`A temporada ${p.seasonNo} começa: a bola vai subir na ${p.divName}`, `Season ${p.seasonNo} tips off in the ${p.divName}`) : t(`A temporada ${p.seasonNo} começa: a bola vai rolar na ${p.divName}`, `Season ${p.seasonNo} kicks off in ${p.divName}`))}</b>
              </div>
            </div>
            {p.jornal.manchete && (p.jornal.manchete.sub[0] || p.jornal.manchete.sub[1]) && <p style={{ padding: '8px 13px 6px', font: 'italic 12px Georgia, serif', color: '#444', borderBottom: '2px solid rgba(0,0,0,.1)', margin: 0 }}>{en ? p.jornal.manchete.sub[1] : p.jornal.manchete.sub[0]} — <i>{t('Redação', 'Newsroom')}</i></p>}
            {p.jornal.noticias.map((n, i) => (
              <div key={i} className={`ll-central-row${i >= 5 ? ' ll-central-not-desk' : ''}`}>
                <span style={{ fontSize: 16 }}>{n.emoji}</span>
                <span style={{ flex: 1, lineHeight: 1.3 }}>{en ? n.en : n.pt}</span>
                <Chip bg="#fff">{en ? n.tag[1] : n.tag[0]}</Chip>
              </div>
            ))}
            {!p.jornal.noticias.length && <p style={{ padding: '10px 13px', font: 'italic 12px Georgia, serif', color: '#555', margin: 0 }}>{p.bb ? t('As notícias começam a sair depois do 1º jogo.', 'The news starts after game 1.') : t('As notícias começam a sair depois da 1ª rodada.', 'The news starts after round 1.')}</p>}
            <button type="button" className="ll-central-link" onClick={() => p.onTab('ranking')} style={{ width: '100%', textAlign: 'center', fontSize: 10, fontWeight: 800, color: '#666', background: '#fff', padding: 7 }}>{p.bb ? t('ver cestinhas e tabela', 'see top scorers and table') : t('ver artilharia e rank', 'see top scorers and rank')} ›</button>
          </div>
          {p.coletiva && <CardColetiva {...p.coletiva} />}
          {/* 💸 MERCADO: a sala de leilão */}
          <div className="ll-central-card ll-c-mercado" style={{ background: `#1a120a url(${leilaoArt}) 85% center / cover`, color: CREME, borderColor: '#847657' }}>
            <div style={{ background: 'linear-gradient(90deg,#0C0C0Cf2 45%,#0C0C0C8c)' }}>
              <Cabecalho titulo={t('💸 Mercado', '💸 Market')} sub={t('o que rolou nos leilões', 'auction business')} link={p.onMercado ? t('mercado', 'market') : t('extrato', 'ledger')} onClick={() => p.onMercado ? p.onMercado() : p.onTab('estadio')} />
              {(mercadoTodo ? p.mercado.negocios : p.mercado.negocios.slice(0, 8)).map((c, i) => (
              <div key={i} className={`ll-central-row ll-central-deal${!mercadoTodo && i >= 5 ? ' ll-central-not-desk' : ''}`} style={{ gap: 10, padding: '8px 13px', borderBottom: '2px solid #ffffff14' }}>
                <Escudo nome={c.team} size={26} />
                <span style={{ flex: 1, minWidth: 0, fontSize: 12, fontWeight: 800 }}><b style={{ ...OSW, fontSize: 15 }}>{c.name}</b> <small style={{ opacity: .6, fontSize: 10 }}>{c.pos}</small><br /><span style={{ fontSize: 11, opacity: .85 }}>→ {c.team}</span> {c.you ? <Chip>{t('você', 'you')}</Chip> : i === 0 && !mercadoTodo ? <Chip bg={RED} cor="#fff">{t('maior lance', 'biggest bid')}</Chip> : null}</span>
                <b style={{ ...OSW, fontSize: 18, color: GOLD }}>🪙 {c.paid}</b>
              </div>
            ))}
            {p.mercado.negocios.length > 5 && <button type="button" className="ll-central-link ll-central-deal-mais" onClick={() => setMercadoTodo(v => !v)} style={{ width: '100%', padding: '7px 13px', fontSize: 10, fontWeight: 900, color: GOLD, textAlign: 'center' }}>{mercadoTodo ? t('mostrar só os maiores', 'show only the top deals') : t(`ver os ${p.mercado.negocios.length} negócios do pregão`, `see all ${p.mercado.negocios.length} deals`)} ›</button>}
            {!p.mercado.negocios.length && p.mercado.maisCaro && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 13px', borderBottom: '2px solid #ffffff14' }}>
                <Escudo nome={p.mercado.maisCaro.teamName} size={26} />
                <span style={{ flex: 1, minWidth: 0, fontSize: 12, fontWeight: 800 }}><b style={{ ...OSW, fontSize: 15 }}>{p.mercado.maisCaro.name}</b><br /><span style={{ fontSize: 11, opacity: .85 }}>{p.mercado.maisCaro.teamName}</span> <Chip bg={RED} cor="#fff">{t('mais caro da divisão', 'priciest in the division')}</Chip></span>
                <b style={{ ...OSW, fontSize: 18, color: GOLD }}>🪙 {p.mercado.maisCaro.paid}</b>
              </div>
            )}
            {!p.mercado.negocios.length && !p.mercado.maisCaro && <p style={{ padding: '10px 13px', fontSize: 11, fontWeight: 700, opacity: .75, margin: 0 }}>{t('Sem negócios registrados nesta temporada.', 'No deals on record this season.')}</p>}
            </div>
          </div>
          {/* 🌍 RANKING GLOBAL DE USUÁRIOS (22/10, Diego: "esse caixa dos rivais troque pelo rank global de usuários"): o top 5
              do ranking global (a MESMA busca e a MESMA conta da aba Rank → Global) + a SUA carreira de agora. Toque abre a aba. */}
          {p.rankGlobal && p.rankGlobal.linhas.length > 0 && (
            <div className="ll-central-card ll-c-caixas" style={{ background: CREME }}>
              <Cabecalho titulo={t('🌍 Ranking global', '🌍 Global ranking')} sub={t(`até a T${p.seasonNo}`, `up to S${p.seasonNo}`)} link={t('ver tudo', 'see all')} onClick={p.rankGlobal.abrir} />
              {p.rankGlobal.linhas.map((x, i) => (
                <div key={x.pos + x.nome} className="ll-central-row" style={{ padding: '6px 9px', gap: 6, fontSize: 11.5, background: x.you ? '#FFF3C4' : undefined, borderTop: i > 0 && p.rankGlobal!.linhas[i - 1].pos !== x.pos - 1 ? '2px dashed rgba(0,0,0,.18)' : undefined }}>
                  <span style={{ width: 26, color: '#777' }}>{x.pos <= 3 ? ['🥇', '🥈', '🥉'][x.pos - 1] : `${x.pos}º`}</span>
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{x.you ? `🫵 ${x.nome}` : x.nome}</span>
                  <b style={{ ...OSW, fontSize: 14 }}>{x.pts} <span style={{ fontSize: 9.5, fontWeight: 600 }}>pts</span></b>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

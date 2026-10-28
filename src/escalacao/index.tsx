import { useEffect, useRef, useState, Component, lazy, Suspense, type ReactNode } from 'react'
import { AvisoDestaqueTirado } from './aviso-live'
import { AvisoSemEspaco } from './aviso-espaco' // 📱 aparelho cheio: pede pra salvar antes de fechar (13/10)
import { PresenteRecebido } from './presente'
import { AvisoSemana } from './aviso-semana'
import { PresentesPregao } from './pregao-aberto' // 🎁 'Fulano te deu um presente!' — só depois que o Diego entregou (14/10)
import { createPortal } from 'react-dom'
import { supabase } from '../lib/supabase'
import { flushPendingWrites } from './pending'
import { EscProvider, useEsc, ehPokemon } from './store'
import { COMUNIDADE_LINK } from './comunidade'
import { setSoundAllowed, isMuted, toggleMuted, onSoundChange, playCoin } from './sound'
import { EscIntro, EscSetup, EscStreamIntro, EscAuction, EscMonte, EscCerimonia, EscSeason, EscLiberta, EscChampions, EscEnd, EscAlbum, EscRanking, GameFooter, ChatWidget } from './screens'
import { EscLobby } from './lobby'
import { EspectadorEspera } from './espectador-ui'
import { EscConvocacaoClubes } from './convocacao-clubes' // 🧱 leilão de clubes (em teste)
import { useSport, useSportUnlocked, SPORT_BRAND } from './sport'
import { hadLogin } from './apoio'
import { testaEscrita, medeStorage, guardaStorage, type ProbeStorage } from '../storage-guard' // 🧹 sessão que cai por armazenamento cheio (21/09)
import { AdminPanel } from './admin'
import { DinastiaGame } from './dinastia'
import { CareerOnlineGame } from './careeronline'
import { tr, getLang } from './lang' // 🌐 BR/EN (12/09): avisos de app/sessão, tela de erro e página de e-mail
import { PyramidSeasonScreen, ReserveListScreen } from './pyramidseason'
import { TelaSenhaNova } from './senha-nova'
import { anotaTrava } from './caixa-preta'
import { registraQueda } from './quedas' // 🚑 registro das quedas de tela (13/09)
import { pedaco } from './recarga'
// 📋 Liga Draft (19/10): a noite do draft só carrega pra quem chega nela (só a conta do Diego cria a liga por enquanto)
const PokemonLigaLazy = lazy(pedaco(() => import('./pokemon-liga'))) // ⚡ modo Pokémon (25/10, só a conta do Diego)
const LigaDraftLazy = lazy(pedaco(() => import('./liga-draft-tela').then(m => ({ default: m.EscLigaDraft }))))
import { AvisosAmigos, EVENTO_ENTRAR_SALA } from './amigos'

// 👥 19/10: avisos dos amigos (convite pra sala, quem entrou online) em qualquer tela — menos no meio de partida/leilão —
// e a ponte do "Entrar na sala": se o online não está aberto, abre; o lobby lê o código guardado e entra sozinho.
const TELAS_LIVRES = new Set(['intro', 'lobby', 'setup', 'end', 'album', 'ranking'])
function AmigosGlobal() {
  const { state, dispatch } = useEsc()
  const telaRef = useRef(state.screen)
  telaRef.current = state.screen
  useEffect(() => {
    const h = () => { if (telaRef.current !== 'lobby') dispatch({ type: 'GO_LOBBY_ONLINE' }) }
    window.addEventListener(EVENTO_ENTRAR_SALA, h)
    return () => window.removeEventListener(EVENTO_ENTRAR_SALA, h)
  }, [dispatch])
  return <AvisosAmigos ocupado={!TELAS_LIVRES.has(state.screen)} />
}

/** 🏆⚔️ o aviso de fim de semana (técnico no pódio / clã no pódio) — em qualquer tela, menos no meio do pregão */
function AvisoSemanaGlobal() {
  const { state } = useEsc()
  return <AvisoSemana tela={state.screen} />
}

function Router() {
  const { state, leaveRoom } = useEsc()
  useEffect(() => { window.scrollTo(0, 0) }, [state.screen, state.sectorIdx, state.phase])
  // 👁️ FANTASMA entre um leilão e outro (o dono voltou pra sala de espera): fica na espera dele, nunca na home nem na lista
  if (state.espectador && state.onlineMode === 'online' && state.roomId && (state.screen === 'lobby' || state.screen === 'intro'))
    return <EspectadorEspera sala={{ id: state.roomId, code: state.roomCode ?? '' }} onSair={() => { void leaveRoom() }} />
  switch (state.screen) {
    case 'intro':     return <EscIntro />
    case 'lobby':     return <EscLobby />
    case 'setup':     return <EscSetup />
    case 'streamIntro': return <EscStreamIntro />
    case 'auction':   return <EscAuction />
    case 'monte':     return <EscMonte />
    case 'cerimonia': return <EscCerimonia />
    case 'convocacao': return <EscConvocacaoClubes />
    case 'reserveList': return <ReserveListScreen />
    // 🏀 BIFURCAÇÃO POR ESPORTE (carreira): o futebol continua na tela de PIRÂMIDE
    // (4 divisões) EXATAMENTE como hoje. A carreira do BASQUETE roda a economia da
    // mesma máquina (careerOnline) mas com a SUA simulação (liga única + andares +
    // playoffs por conferência) via EscSeason — não passa pela pirâmide de 4 séries.
    case 'season':    if (ehPokemon(state)) return <Suspense fallback={<div className="pt-16 text-center text-5xl">⚡</div>}><PokemonLigaLazy /></Suspense>
                      return state.careerOnline ? (state.sport === 'basquete' ? <EscSeason /> : <PyramidSeasonScreen />) : <EscSeason />
    case 'liberta':   return <EscLiberta />
    case 'champions': return <EscChampions />
    case 'draft':     return <Suspense fallback={<div className="pt-16 text-center text-5xl">📋</div>}><LigaDraftLazy /></Suspense>
    case 'end':       return <EscEnd />
    case 'album':     return <EscAlbum />
    case 'ranking':   return <EscRanking />
    default:          return <EscIntro />
  }
}

// Banner GLOBAL de manutenção: faz um ping leve no backend e, se ele estiver
// fora do ar (instabilidade Supabase / manutenção), mostra um aviso pra TODOS
// os jogadores — em vez de cada um achar que o jogo quebrou. Some sozinho
// assim que o servidor volta (re-checa a cada 30s).
// 📣 AVISO FIXO NO TOPO (08/10, pedido do Diego: *"faixinha amarela no header em cima p todos q em breve o
// sistema passará por uma manutenção"*). Mesma cara da faixa de manutenção logo abaixo. Liga/desliga aqui:
// `AVISO_TOPO = null` tira a faixa (publicar de novo). Some sozinha se a faixa de servidor-fora estiver na tela.
const AVISO_TOPO: { pt: string; en: string } | null = null // 08/10: tirada a pedido do Diego
function AvisoTopo({ escondido }: { escondido: boolean }) {
  if (!AVISO_TOPO || escondido) return null
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 99998, background: '#F5B301', color: '#1a1a1a', borderBottom: '3px solid #1a1a1a', padding: '7px 12px', textAlign: 'center', fontWeight: 800, fontSize: 12.5, lineHeight: 1.3, boxShadow: '0 2px 8px rgba(0,0,0,.25)' }}>
      {getLang() === 'en' ? AVISO_TOPO.en : AVISO_TOPO.pt}
    </div>
  )
}

// 📲 COMUNIDADE DO WHATSAPP (Diego 11/10): *"chegou o grupo… quando o cara clicar vai direto no link da
// comunidade"*. Diferente da faixa de manutenção (que era FIXA e tampava as moedas de quem joga online), esta
// entra no FLUXO da página: empurra o conteúdo pra baixo em vez de cobrir. E só aparece na HOME (ordem dele),
// nunca nas salas, no leilão ou na temporada. O ✕ esconde neste aparelho.
// Tirar pra todos: COMUNIDADE_LINK = null (comunidade.ts).
const COMUNIDADE_FECHADA = 'esc-comunidade-zap-fechada'
// 📣 12/10: a MESMA faixa, agora também FORA da home — em toda tela de jogo (carreira, sala online, leilão…).
// Pedido do Diego: *"coloque p todos agora tb q estão jogando… se fecharem essa aba ou entrarem no link N precisa
// mais aparecer… só desse novo. Já o aviso na home e nas salas mantenha sempre"*. Por isso a chave é OUTRA: fechar
// (✕) ou tocar em Entrar aqui some com ESTA faixa pra sempre neste aparelho, e não mexe na da home nem no quadro
// das salas. Na home ela não aparece (lá já tem a de sempre).
const COMUNIDADE_JOGO_VISTA = 'esc-comunidade-zap-jogo-vista'
const INSTAGRAM_LINK = 'https://instagram.com/leilaolegendscom'
const zapLink: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 7, minWidth: 0, color: 'rgba(255,255,255,.88)', textDecoration: 'none', fontWeight: 700, fontSize: 12 }
const zapBotao: React.CSSProperties = { flex: 'none', border: '2px solid #0C0C0C', borderRadius: 999, padding: '1px 9px', boxShadow: '2px 2px 0 #000', fontFamily: 'Oswald, sans-serif', fontWeight: 800, fontSize: 11, lineHeight: '17px', textTransform: 'uppercase', letterSpacing: '.04em' }
function ComunidadeBanner() {
  const { state } = useEsc()
  const naHome = state.screen === 'intro'
  const chave = naHome ? COMUNIDADE_FECHADA : COMUNIDADE_JOGO_VISTA
  const [fechadas, setFechadas] = useState<Record<string, boolean>>(() => {
    const le = (k: string) => { try { return localStorage.getItem(k) === '1' } catch { return false } }
    return { [COMUNIDADE_FECHADA]: le(COMUNIDADE_FECHADA), [COMUNIDADE_JOGO_VISTA]: le(COMUNIDADE_JOGO_VISTA) }
  })
  const fecha = () => { try { localStorage.setItem(chave, '1') } catch { /* ignora */ } setFechadas(f => ({ ...f, [chave]: true })) }
  if (!COMUNIDADE_LINK || fechadas[chave]) return null
  // 🔨 12/10: nada de faixa NO LEILÃO (pregão, Monte, convocação) — o relógio está correndo e ela comia
  // 2 dedos da tela bem ali (Diego: "sim pode fazer"). Na tabela, nos jogos, na carreira e nas salas ela segue.
  if (['auction', 'monte', 'convocacao', 'streamIntro'].includes(state.screen)) return null
  const en = getLang() === 'en'
  return (
    // 🧼 23/10 (Diego: *"mais clean sem esse exagero todo do whatsapp lá no header"*): faixa FINA de uma linha, escura, sem o
    //    verdão, o 📲 e o botão amarelo — só o recado e um "Entrar ›" discreto.
    <div className={naHome ? 'll-comunidade' : 'll-comunidade-jogo'} style={{ display: 'flex', alignItems: 'stretch', background: '#14110C', borderBottom: '1px solid rgba(255,255,255,.12)', height: 'var(--ll-zap-h)', boxSizing: 'border-box', overflow: 'hidden' }}>
      {/* a home gruda o botão de som no topo: com a faixa na tela ele desce a ALTURA FIXA dela (senão ficava em cima do texto). */}
      <style>{':root{--ll-zap-h:32px}'
        + '#root:has(.ll-comunidade) button[aria-label="Desligar som"],#root:has(.ll-comunidade) button[aria-label="Ligar som"]{top:calc(26px + var(--ll-zap-h))!important}'
        + '@media(max-width:650px){#root:has(.ll-comunidade) button[aria-label="Desligar som"],#root:has(.ll-comunidade) button[aria-label="Ligar som"]{top:calc(16px + var(--ll-zap-h))!important}}'}</style>
      {/* 💬📸 27/10 (Diego, mockup `scripts/mockups/faixa-zap-insta.png`, opção B: *"bote os dois"*): a faixa leva pra
          comunidade do Zap E pro Instagram. Sem número de técnicos (*"não precisa botar que já somos tantos"*). No celular
          o texto encurta (`ll-zap-longo`/`ll-zap-curto`) pra caber os dois botões e o ✕. */}
      <style>{'.ll-zap-curto{display:none}@media(max-width:560px){.ll-zap-longo{display:none}.ll-zap-curto{display:inline}}'}</style>
      <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '0 6px 0 10px', whiteSpace: 'nowrap', overflow: 'hidden' }}>
        <a href={COMUNIDADE_LINK} target="_blank" rel="noopener noreferrer" onClick={() => { if (!naHome) fecha() }} style={zapLink}>
          <span className="ll-zap-longo" style={{ width: 7, height: 7, borderRadius: 99, background: '#25D366', flex: 'none' }} />
          <span className="ll-zap-longo">{en ? 'Join our WhatsApp community' : 'Entre na comunidade do Zap'}</span>
          <span className="ll-zap-curto">{en ? 'Community' : 'Comunidade'}</span>
          <b style={{ ...zapBotao, background: '#25D366', color: '#0C0C0C' }}>{en ? '💬 Join' : '💬 Entrar'}</b>
        </a>
        <span style={{ color: 'rgba(255,255,255,.3)', flex: 'none' }}>|</span>
        <a href={INSTAGRAM_LINK} target="_blank" rel="noopener noreferrer" onClick={() => { if (!naHome) fecha() }} style={zapLink}>
          <span className="ll-zap-longo" style={{ width: 7, height: 7, borderRadius: 99, background: '#DD2A7B', flex: 'none' }} />
          <span className="ll-zap-longo">{en ? 'Follow us on Instagram' : 'Siga no Instagram'}</span>
          <span className="ll-zap-curto">Instagram</span>
          <b style={{ ...zapBotao, background: 'linear-gradient(90deg,#F58529,#DD2A7B,#8134AF)', color: '#fff' }}>{en ? '📸 Follow' : '📸 Seguir'}</b>
        </a>
      </div>
      <button aria-label={en ? 'close' : 'fechar'} onClick={fecha}
        style={{ flex: 'none', background: 'transparent', border: 'none', color: 'rgba(255,255,255,.55)', fontWeight: 700, fontSize: 13, padding: '0 12px', cursor: 'pointer' }}>✕</button>
    </div>
  )
}

// 🔧 26/10 (Diego: *"esse botão amarelo de manutenção tire também… toda hora aparece"*): a faixa amarela SAIU. O teste do servidor
// continua (é ele que re-tenta o que ficou pendente quando a rede volta), só não mostra mais nada.
function MaintenanceBanner() {
  useEffect(() => {
    let alive = true
    const netErr = (m: string) => /failed to fetch|networkerror|network request failed|load failed|502|503|504|timeout|service unavailable/i.test(m)
    const check = async () => {
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return // aba escondida não testa (conta do Supabase, 06/10)
      let ok = false
      try {
        const { error } = await supabase.from('user_cards').select('user_id').limit(1) // leitura pública, bem leve
        ok = !error || !netErr(error.message) // sucesso, OU erro que NÃO é de rede → servidor no ar
      } catch (e) {
        ok = !netErr(e instanceof Error ? e.message : String(e))
      }
      if (!alive) return
      if (ok) flushPendingWrites() // no ar: re-tenta pendências
    }
    check()
    const iv = setInterval(check, 60_000)
    return () => { alive = false; clearInterval(iv) }
  }, [])
  return <AvisoTopo escondido={false} />
}

// Aviso RÁPIDO (toast): aparece uns segundos quando o jogador abre o jogo e
// some sozinho. Mostra UMA vez por aparelho (flag) pra não incomodar ninguém.
// Pra soltar um aviso novo no futuro, é só trocar o ID.
function AnnouncementToast() {
  const ID = 'obra-2026-07-22'
  // só HOJE (22/07): depois da validade, ninguém mais vê
  const EXPIRA = Date.parse('2026-07-23T03:00:00-03:00')
  const [show, setShow] = useState(false)
  useEffect(() => {
    if (Date.now() > EXPIRA) return
    try { if (localStorage.getItem('esc-annc-' + ID)) return } catch { /* ignora */ }
    setShow(true)
    try { localStorage.setItem('esc-annc-' + ID, '1') } catch { /* ignora */ }
    const t = setTimeout(() => setShow(false), 9000)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  if (!show) return null
  return (
    <div style={{ position: 'fixed', top: 8, left: 8, right: 8, zIndex: 99998, margin: '0 auto', maxWidth: 440, background: '#16a34a', color: '#fff', border: '2px solid #14361f', borderRadius: 12, padding: '7px 28px 7px 11px', textAlign: 'center', fontWeight: 700, fontSize: 11, lineHeight: 1.3, boxShadow: '0 4px 12px rgba(0,0,0,.28)', animation: 'esc-annc-in .3s ease-out' }}>
      <style>{'@keyframes esc-annc-in{from{transform:translateY(-16px);opacity:0}to{transform:translateY(0);opacity:1}}'}</style>
      🚧 Novidade entrando <b>toda hora</b> e muita gente chegando! Viu um erro? Chama no <b>@leilaolegendscom</b> 📲 Ideias novas são sempre bem-vindas! 💛
      <button onClick={() => setShow(false)} aria-label="Fechar"
        style={{ position: 'absolute', top: 3, right: 5, background: 'transparent', border: 'none', color: '#fff', fontSize: 17, fontWeight: 900, lineHeight: 1, cursor: 'pointer', padding: '2px 5px' }}>×</button>
    </div>
  )
}

// ── SAIR DO NAVEGADOR EMBUTIDO (Instagram/TikTok/Facebook) ────────────────
// O link da bio abre no "mini-navegador" do app, que tem armazenamento
// separado: login não cola, save fica preso lá. Detecta pelo user-agent e
// mostra um aviso: Android tenta abrir o Chrome direto (intent://); iPhone
// ganha o passo a passo (lá não dá pra forçar). Dispensável no ✕ (por sessão).
function OpenInBrowserBanner() {
  const [dismissed, setDismissed] = useState(() => { try { return sessionStorage.getItem('esc-inapp-dismiss') === '1' } catch { return false } })
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : ''
  const inApp = /Instagram|FBAN|FBAV|FB_IAB|TikTok|musical_ly|Snapchat|Line\//i.test(ua)
  const android = /Android/i.test(ua)
  if (!inApp || dismissed) return null
  const escape = () => {
    if (android) {
      // abre o site no navegador padrão; se falhar, o fallback recarrega aqui mesmo
      window.location.href = 'intent://leilaolegends.com/#Intent;scheme=https;S.browser_fallback_url=https%3A%2F%2Fleilaolegends.com;end'
    }
  }
  return (
    <div style={{ position: 'fixed', bottom: 10, left: 8, right: 8, zIndex: 99998, margin: '0 auto', maxWidth: 440, background: '#0C0C0C', color: '#fff', border: '2px solid #F5B301', borderRadius: 14, padding: '10px 30px 10px 12px', fontWeight: 700, fontSize: 11.5, lineHeight: 1.4, boxShadow: '0 6px 16px rgba(0,0,0,.4)' }}>
      {android ? (
        <>
          {getLang() === 'en' ? <>🚀 <b>Playing inside Instagram?</b> Open it in a real browser — your login and your save are safe there.</> : <>🚀 <b>Jogando dentro do Instagram?</b> Abre no navegador de verdade — teu login e teu save ficam seguros lá.</>}
          <button onClick={escape} style={{ display: 'block', width: '100%', marginTop: 7, background: '#F5B301', color: '#0C0C0C', border: 'none', borderRadius: 9, padding: '9px 0', fontWeight: 900, fontSize: 13, fontFamily: 'Oswald, sans-serif', cursor: 'pointer' }}>
            {tr('ABRIR NO NAVEGADOR 🌐', 'OPEN IN BROWSER 🌐')}
          </button>
        </>
      ) : (
        <>
          {getLang() === 'en' ? <>🚀 <b>Playing inside an app?</b> Tap the <b>three dots (⋯)</b> in the corner and choose <b>“Open in external browser”</b> — your login and your save are safe there.</> : <>🚀 <b>Jogando dentro do app?</b> Toca nos <b>três pontinhos (⋯)</b> aí no canto e escolhe <b>“Abrir no navegador externo”</b> — teu login e teu save ficam seguros lá.</>}
        </>
      )}
      <button onClick={() => { setDismissed(true); try { sessionStorage.setItem('esc-inapp-dismiss', '1') } catch { /* ignora */ } }} aria-label="Fechar"
        style={{ position: 'absolute', top: 4, right: 6, background: 'transparent', border: 'none', color: '#fff', fontSize: 17, fontWeight: 900, lineHeight: 1, cursor: 'pointer', padding: '2px 5px' }}>×</button>
    </div>
  )
}

// Rede de segurança: se qualquer tela crashar (ex.: um save antigo com formato
// incompatível ao continuar a carreira), em vez de tela branca sem saída mostra
// um aviso com botão de voltar ao início (NÃO apaga o save) e a mensagem do erro
// na tela — assim dá pra tirar print e a gente corrige a causa exata.
class ErrorBoundary extends Component<{ children: ReactNode }, { err: Error | null; componentes: string | null }> {
  state: { err: Error | null; componentes: string | null } = { err: null, componentes: null }
  static getDerivedStateFromError(err: Error) { return { err } }
  componentDidCatch(err: Error, info: { componentStack?: string | null }) {
    try { console.error('Leilão Legends crash:', err) } catch { /* ignora */ }
    // 🚑 (13/09) guarda a pilha de COMPONENTES (tem nome de verdade, ao contrário da
    // pilha do React minificado) e registra a queda em `esc_quedas` — ver quedas.ts.
    const componentes = info?.componentStack ?? null
    this.setState({ componentes })
    registraQueda('tela', err, componentes)
  }
  render() {
    if (this.state.err) {
      return (
        <div className="tela-cheia" style={{ background: '#F4ECD6', color: '#0C0C0C', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center', fontFamily: 'Oswald, sans-serif' }}>
          <div style={{ fontSize: 52 }}>😵</div>
          <p style={{ fontWeight: 900, fontSize: 22, margin: '8px 0 4px' }}>{tr('Ops, algo deu errado', 'Oops, something went wrong')}</p>
          <p style={{ fontWeight: 700, fontSize: 14, color: 'rgba(0,0,0,.6)', maxWidth: 340 }}>{getLang() === 'en' ? <>Go back to the start and try again. Your saved progress <b>was not erased</b>.</> : <>Volta ao início e tenta de novo. Seu progresso salvo <b>não foi apagado</b>.</>}</p>
          <button onClick={() => { try { window.location.hash = '' } catch { /* ignora */ } window.location.reload() }}
            style={{ marginTop: 16, background: '#1B7A3D', color: '#fff', border: '3px solid #0C0C0C', borderRadius: 12, padding: '12px 22px', fontWeight: 900, fontSize: 16, fontFamily: 'Oswald, sans-serif', boxShadow: '4px 4px 0 #0C0C0C', cursor: 'pointer' }}>{tr('🏠 Voltar ao início', '🏠 Back to start')}</button>
          <p style={{ fontSize: 10.5, color: 'rgba(0,0,0,.45)', marginTop: 18, maxWidth: 340, wordBreak: 'break-word' }}>{tr('Erro', 'Error')}: {String(this.state.err?.message || this.state.err)}</p>
          {/* 🔎 detalhe técnico (stack) — pequeno; ajuda a achar EXATAMENTE onde quebrou
             quando o print chega. Mostra só as primeiras linhas pra não assustar. */}
          {this.state.err?.stack && (
            <pre style={{ fontSize: 8, color: 'rgba(0,0,0,.4)', marginTop: 6, maxWidth: 340, maxHeight: 96, overflow: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-word', textAlign: 'left', fontFamily: 'monospace' }}>{this.state.err.stack.split('\n').slice(0, 14).join('\n')}</pre>
          )}
          {/* 🧭 onde na TELA quebrou (nomes dos componentes, de baixo pra cima) — é isto que
              diz o lugar exato; a pilha de cima é só o miolo do React. */}
          {this.state.componentes && (
            <pre style={{ fontSize: 8, color: 'rgba(0,0,0,.5)', marginTop: 4, maxWidth: 340, maxHeight: 80, overflow: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-word', textAlign: 'left', fontFamily: 'monospace' }}>{'tela: ' + this.state.componentes.trim().split('\n').map(l => l.trim().replace(/^at /, '').replace(/\s*\(.*$/, '')).filter(Boolean).slice(0, 10).join(' < ')}</pre>
          )}
          <p style={{ fontSize: 10.5, color: 'rgba(0,0,0,.45)', marginTop: 6 }}>Manda um print disso <b>inteiro</b> pro <b>@leilaolegendscom</b> 🙏</p>
        </div>
      )
    }
    return this.props.children
  }
}

// 🔄 VIGIA DE VERSÃO: SAIU (21/10, Diego: *"não quero mais que publicando coisa nova faça atualizar a página sozinho… só atualiza se
// ele atualizar mesmo manualmente"*). Quem está com o jogo aberto segue na versão que abriu até atualizar por conta própria — e não
// quebra, porque a publicação mantém no ar os arquivos das versões anteriores (`scripts/guarda-versao-anterior.mjs`).

// 🔊 SOM: liberado pra TODO MUNDO. Começa MUDO (opt-in) — ninguém leva susto de
// áudio; a pessoa liga no botão 🔊/🔇 fixo no canto, que também "acorda" o
// áudio no 1º toque (gesto exigido pelo navegador).
function SoundGate() {
  const [, force] = useState(0)
  useEffect(() => onSoundChange(() => force(n => n + 1)), [])
  useEffect(() => { setSoundAllowed(true) }, [])
  const on = !isMuted()
  return (
    <button onClick={() => { toggleMuted(); if (!isMuted()) playCoin() }} aria-label={on ? 'Desligar som' : 'Ligar som'}
      style={{ position: 'fixed', bottom: 10, right: 10, zIndex: 99998, width: 44, height: 44, borderRadius: 999, border: '3px solid #0C0C0C', background: on ? '#F5B301' : '#fff', boxShadow: '0 3px 10px rgba(0,0,0,.3)', fontSize: 19, cursor: 'pointer', lineHeight: 1 }}>
      {on ? '🔊' : '🔇'}
    </button>
  )
}

// 🔑 SESSÃO CAÍDA: aparece SÓ pra quem já logou antes (hadLogin) e agora está sem
// sessão (token expirou). Quem NUNCA logou não tem o marcador → nunca vê nada.
// Dispensável (X) por sessão de navegação. "Entrar" leva pra tela de login.
// 🧹 E DIZ O PORQUÊ QUANDO É FALTA DE ESPAÇO (21/09, sala do Neymarzetti): se o
// armazenamento do navegador está CHEIO, a biblioteca de login guarda a sessão
// só na memória e ela morre a cada reload. Mandar a pessoa "entrar de novo" não
// resolve nada — ela já entrou 8 vezes. Aqui a faixa faz o mesmo teste de escrita
// que a biblioteca faz e, se der cheio, explica e dá o botão de liberar espaço.
// Os números miúdos ("detalhes") existem pra quem for investigar pelo print.
function SessionExpiredBanner() {
  const { dispatch } = useEsc()
  const [show, setShow] = useState(false)
  const [probe, setProbe] = useState<ProbeStorage | null>(null)
  const [detalhes, setDetalhes] = useState(false)
  useEffect(() => {
    let alive = true
    let dismissed = false
    try { dismissed = sessionStorage.getItem('esc-sess-x') === '1' } catch { /* ignora */ }
    const check = async () => {
      if (!alive) return
      if (dismissed || !hadLogin()) { setShow(false); return }
      const { data } = await supabase.auth.getSession()
      if (!alive) return
      const caiu = !data.session // já logou antes, mas sem sessão agora = caiu
      setShow(caiu)
      if (caiu) { try { setProbe({ escrita: testaEscrita(), ...medeStorage() }) } catch { /* sem diagnóstico, faixa normal */ } }
    }
    check()
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => check())
    return () => { alive = false; subscription.unsubscribe() }
  }, [])
  if (!show) return null
  const close = () => { try { sessionStorage.setItem('esc-sess-x', '1') } catch { /* ignora */ } setShow(false) }
  const cheio = probe?.escrita === 'cheio'
  const liberar = () => {
    const r = guardaStorage()
    setProbe(r)
    // liberou de verdade → recarrega pra biblioteca refazer o teste e voltar a gravar o login
    if (r.escrita === 'ok') { try { window.location.reload() } catch { /* ignora */ } }
  }
  return (
    <div style={{ position: 'fixed', top: 8, left: 8, right: 8, zIndex: 99997, margin: '0 auto', maxWidth: 460, background: '#F5B301', color: '#0C0C0C', border: '2px solid #0C0C0C', borderRadius: 12, padding: '9px 10px', boxShadow: '0 4px 14px rgba(0,0,0,.3)', fontFamily: 'Oswald, sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 18, lineHeight: 1 }}>{cheio ? '🧹' : '🔑'}</span>
        <span style={{ flex: 1, fontWeight: 800, fontSize: 11.5, lineHeight: 1.25 }}>
          {cheio
            ? tr('Seu navegador está SEM ESPAÇO pra guardar o login — por isso ele cai toda vez que a página recarrega. Toque em liberar espaço.', 'Your browser is OUT OF SPACE to store the login — that is why it drops every time the page reloads. Tap free up space.')
            : tr('Sua sessão caiu — entre de novo pra ganhar cartas, aparecer no ranking e usar a SAF.', 'Your session expired — log in again to earn cards, show up in the ranking and use the SAF.')}
        </span>
        {cheio
          ? <button onClick={liberar} style={{ flexShrink: 0, background: '#0C0C0C', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 10px', fontWeight: 900, fontSize: 11.5, cursor: 'pointer', fontFamily: 'Oswald, sans-serif' }}>{tr('🧹 Liberar espaço', '🧹 Free up space')}</button>
          : <button onClick={() => { dispatch({ type: 'GO_LOBBY_ONLINE' }); setShow(false) }} style={{ flexShrink: 0, background: '#0C0C0C', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 10px', fontWeight: 900, fontSize: 11.5, cursor: 'pointer', fontFamily: 'Oswald, sans-serif' }}>{tr('Entrar', 'Log in')}</button>}
        <button onClick={close} aria-label={tr('Dispensar', 'Dismiss')} style={{ flexShrink: 0, width: 22, height: 22, borderRadius: 999, background: '#fff', border: '2px solid #000', fontWeight: 900, fontSize: 11, cursor: 'pointer', lineHeight: 1 }}>✕</button>
      </div>
      {probe && (
        <p onClick={() => setDetalhes(d => !d)} style={{ margin: '5px 0 0', fontSize: 9.5, fontWeight: 700, color: 'rgba(0,0,0,.55)', lineHeight: 1.3, cursor: 'pointer' }}>
          {detalhes
            ? `${tr('armazenamento', 'storage')}: ${probe.escrita} · ${probe.usadoKB} KB · ${probe.chaves} ${tr('chaves', 'keys')} · ${probe.maiores.map(m => `${m.chave.slice(0, 22)} ${m.kb}KB`).join(' · ')}`
            : tr('detalhes ▸', 'details ▸')}
        </p>
      )}
    </div>
  )
}

// 🏷️ TÍTULO DA ABA conforme o esporte: bidlegendsarena.com (ou aba 🏀) mostra
// "BidLegends"; futebol mantém "Leilão Legends". Só o texto da aba muda.
function SportTitle() {
  const [sport] = useSport()
  const unlocked = useSportUnlocked() // 🔒 só o Diego troca o título pra BidLegends
  useEffect(() => {
    try { document.title = (unlocked && sport === 'basquete') ? SPORT_BRAND.basquete.name : 'Leilão Legends' } catch { /* ignora */ }
  }, [sport, unlocked])
  return null
}


// ─── ✉️🚪 SAIR DA LISTA DE E-MAILS (01/09) ──────────────────────────────────
// O rodapé de todo e-mail leva pra cá com `?sair=<e-mail>`.
//
// ⚠️ POR QUE TEM UM BOTÃO DE CONFIRMAR e não sai só de abrir o link: Gmail e
// Outlook ABREM os links do e-mail sozinhos, por segurança, antes da pessoa
// clicar em nada. Se a saída fosse no próprio link, eles descadastrariam gente
// que nunca pediu — e a lista iria derretendo sozinha sem ninguém entender.
// Um toque a mais resolve isso.
//
// A porta não pede login de propósito: quem quer sair de uma lista não pode ser
// obrigado a lembrar a senha do jogo.
function SairDaLista() {
  const [email, setEmail] = useState<string | null>(null)
  const [fase, setFase] = useState<'pergunta' | 'indo' | 'pronto'>('pergunta')
  useEffect(() => {
    try {
      const e = new URLSearchParams(window.location.search).get('sair')
      if (e && e.includes('@')) setEmail(e.trim().toLowerCase())
    } catch { /* sem window */ }
  }, [])
  if (!email) return null
  const sair = async () => {
    setFase('indo')
    try { await supabase.rpc('esc_email_sair', { p_email: email }) } catch { /* a tela não trava */ }
    setFase('pronto')
  }
  const OSW = { fontFamily: "'Oswald','Arial Narrow',system-ui,sans-serif" } as const
  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 99999, background: '#F4ECD6', display: 'grid', placeItems: 'center', padding: 18, overflowY: 'auto' }}>
      <div style={{ width: '100%', maxWidth: 380, border: '4px solid #0C0C0C', borderRadius: 18, background: '#fff', boxShadow: '6px 6px 0 #0C0C0C', padding: 20, textAlign: 'center' }}>
        {fase !== 'pronto' ? (
          <>
            <p style={{ fontSize: 42, margin: 0 }}>✉️</p>
            <p style={{ ...OSW, fontWeight: 900, fontSize: 20, margin: '6px 0 0', textTransform: 'uppercase' }}>{tr('Parar de receber e-mails?', 'Stop receiving e-mails?')}</p>
            <p style={{ fontSize: 13.5, fontWeight: 700, color: 'rgba(0,0,0,.6)', margin: '8px 0 0', lineHeight: 1.5 }}>
              {tr('A gente para de mandar novidades pra', 'We stop sending news to')} <b style={{ wordBreak: 'break-all' }}>{email}</b>.
            </p>
            <p style={{ fontSize: 12, fontWeight: 700, color: 'rgba(0,0,0,.5)', margin: '10px 0 0', lineHeight: 1.5 }}>
              {getLang() === 'en' ? <>🎮 <b>Your account and your team are not deleted</b> — you keep playing as usual, you just stop getting our e-mails.</> : <>🎮 <b>Sua conta e seu time não são apagados</b> — você continua jogando normal, só não recebe mais e-mail nosso.</>}
            </p>
            <button onClick={() => { void sair() }} disabled={fase === 'indo'}
              style={{ width: '100%', marginTop: 16, border: '3px solid #0C0C0C', borderRadius: 13, padding: '13px 0', ...OSW, fontWeight: 900, fontSize: 15,
                background: '#C2452F', color: '#fff', boxShadow: '4px 4px 0 #0C0C0C', cursor: 'pointer' }}>
              {fase === 'indo' ? tr('⏳ Saindo…', '⏳ Leaving…') : tr('✅ Sim, pode parar', '✅ Yes, stop them')}
            </button>
            <button onClick={() => { window.location.href = window.location.origin + window.location.pathname }}
              style={{ width: '100%', marginTop: 9, border: 'none', background: 'transparent', ...OSW, fontWeight: 900, fontSize: 13, color: 'rgba(0,0,0,.55)', textDecoration: 'underline', cursor: 'pointer' }}>
              {tr('não, quero continuar recebendo', 'no, I want to keep receiving them')}
            </button>
          </>
        ) : (
          <>
            <p style={{ fontSize: 42, margin: 0 }}>👍</p>
            <p style={{ ...OSW, fontWeight: 900, fontSize: 20, margin: '6px 0 0', textTransform: 'uppercase' }}>{tr('Pronto', 'Done')}</p>
            <p style={{ fontSize: 13.5, fontWeight: 700, color: 'rgba(0,0,0,.6)', margin: '8px 0 0', lineHeight: 1.5 }}>
              {tr('Não mandamos mais e-mail de novidade pra', 'No more news e-mails to')} <b style={{ wordBreak: 'break-all' }}>{email}</b>. {tr('Valeu por ter jogado! 🔨', 'Thanks for playing! 🔨')}
            </p>
            <button onClick={() => { window.location.href = window.location.origin + window.location.pathname }}
              style={{ width: '100%', marginTop: 16, border: '3px solid #0C0C0C', borderRadius: 13, padding: '13px 0', ...OSW, fontWeight: 900, fontSize: 15,
                background: '#1B7A3D', color: '#fff', boxShadow: '4px 4px 0 #0C0C0C', cursor: 'pointer' }}>
              {tr('🔨 Ir pro jogo', '🔨 Go to the game')}
            </button>
          </>
        )}
      </div>
    </div>, document.body)
}

// 🕵️ NOTA DE RECARGA (12/09, sala TS7ZVD): o Diego, dono, foi "tirado da sala"
// duas vezes no meio da Libertadores e voltou do mesmo ponto. Nenhum caminho do
// código manda o dono pro menu sozinho mantendo a faixa de "voltar pra partida"
// — o que faz isso é a PÁGINA RECARREGAR (o Android descarta a aba pra liberar
// memória, sobretudo gravando tela com muitas abas). Como o dono salva a cada
// poucos segundos, nada se perde; só assusta. Esta nota grava UMA linha na
// caixa-preta quando o jogo abre depois de uma recarga que não foi gesto da
// pessoa: `document.wasDiscarded` é o próprio Chrome dizendo "eu descartei a
// aba", e o tipo de navegação diz se foi F5 ou abertura nova. Nada na tela.
function NotaDeRecarga() {
  useEffect(() => {
    try {
      const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined
      const descartada = (document as Document & { wasDiscarded?: boolean }).wasDiscarded === true
      const tipo = nav?.type ?? 'desconhecido'
      const salaSalva = localStorage.getItem('escalacao-room') // mesma chave do `LS_KEY` do lobby
      if (!salaSalva) return // sem partida em andamento não tem o que explicar
      if (!descartada && tipo !== 'reload') return // abriu de propósito: normal
      anotaTrava({ room_id: salaSalva, sala: null, papel: 'convidado', momento: 'envelope', setor: null, segundos: 0, reenvios: 0,
        canal: null, host_calado_ms: null, extra: { quando: 'recarregou', descartada, tipo, memoria: (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? null } }, true)
    } catch { /* nunca atrapalha */ }
  }, [])
  return null
}

export default function EscalacaoGame() {
  return (
    <ErrorBoundary>
      <SairDaLista />{/* ✉️ a porta de saída do e-mail — fora do jogo, por cima de tudo */}
      {/* 🔑 quem chega pelo link de "esqueci a senha" cai na HOME; a tela de senha
          nova mora aqui fora pra aparecer onde quer que a pessoa caia. */}
      <TelaSenhaNova />
      <NotaDeRecarga />
      <EscProvider>
        <SportTitle />
        <MaintenanceBanner />
        <SessionExpiredBanner />
        <AnnouncementToast />
        <OpenInBrowserBanner />
        <SoundGate />
        <ChatWidget />{/* 💬 chat/zoeira da sala — só aparece em partida online */}
        <AvisoDestaqueTirado />{/* 🚫🔴 o dono da sala fica sabendo que o destaque de live saiu (13/10) */}
        <AvisoSemEspaco />
        <PresenteRecebido />
        <AmigosGlobal />
        <AvisoSemanaGlobal />
        <PresentesPregao />{/* 🎁 pregão aberto sem Monte: o que o time ganhou de graça no fim (some sozinho, 16/10) */}
        {/* FUNDO CREME DO JOGO: o site-estúdio tem fundo quase-preto (#06060f). O
            Leilão Legends é todo em telas cremes. Se alguma tela renderizar vazia
            por um instante (troca de fase, estado incompleto sincronizado, save
            interrompido), o que aparecia era o PRETO do estúdio — e virava um
            "tela preta travada" no print de quem jogava. Com este creme atrás de
            TUDO, o pior caso é uma tela creme com o rodapé (dá pra sair por ali),
            nunca mais um preto assustador. */}
        <div className="tela-cheia" style={{ background: '#F4ECD6' }}>
          <ComunidadeBanner />
          <Router />
          <GameFooter />{/* rodapé de contato, sutil, no final de todas as telas */}
          <AdminPanel />
          <DinastiaGame />
          <CareerOnlineGame />
        </div>
      </EscProvider>
    </ErrorBoundary>
  )
}

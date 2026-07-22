import { useEffect, useRef, useState, Component, type ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import { flushPendingWrites } from './pending'
import { EscProvider, useEsc } from './store'
import { EscIntro, EscSetup, EscStreamIntro, EscAuction, EscMonte, EscCerimonia, EscSeason, EscEnd, EscAlbum, EscRanking, GameFooter } from './screens'
import { EscLobby } from './lobby'
import { AdminPanel } from './admin'
import { DinastiaGame } from './dinastia'
import { CareerOnlineGame } from './careeronline'
import { PyramidSeasonScreen, ReserveListScreen } from './pyramidseason'

function Router() {
  const { state } = useEsc()
  useEffect(() => { window.scrollTo(0, 0) }, [state.screen, state.sectorIdx, state.phase])
  switch (state.screen) {
    case 'intro':     return <EscIntro />
    case 'lobby':     return <EscLobby />
    case 'setup':     return <EscSetup />
    case 'streamIntro': return <EscStreamIntro />
    case 'auction':   return <EscAuction />
    case 'monte':     return <EscMonte />
    case 'cerimonia': return <EscCerimonia />
    case 'reserveList': return <ReserveListScreen />
    case 'season':    return state.careerOnline ? <PyramidSeasonScreen /> : <EscSeason />
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
function MaintenanceBanner() {
  const [down, setDown] = useState(false)
  const failsRef = useRef(0) // só mostra após FALHAS SEGUIDAS — evita alarme falso por blip de rede no celular
  useEffect(() => {
    let alive = true
    const netErr = (m: string) => /failed to fetch|networkerror|network request failed|load failed|502|503|504|timeout|service unavailable/i.test(m)
    const check = async () => {
      let ok = false
      try {
        const { error } = await supabase.from('user_cards').select('user_id').limit(1) // leitura pública, bem leve
        ok = !error || !netErr(error.message) // sucesso, OU erro que NÃO é de rede → servidor no ar
      } catch (e) {
        ok = !netErr(e instanceof Error ? e.message : String(e))
      }
      if (!alive) return
      if (ok) { failsRef.current = 0; setDown(false); flushPendingWrites() } // no ar: some na hora + re-tenta pendências
      else { failsRef.current += 1; if (failsRef.current >= 2) setDown(true) } // 2 falhas seguidas = fora de verdade
    }
    check()
    const iv = setInterval(check, 20_000)
    return () => { alive = false; clearInterval(iv) }
  }, [])
  if (!down) return null
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 99999, background: '#F5B301', color: '#1a1a1a', borderBottom: '3px solid #1a1a1a', padding: '7px 12px', textAlign: 'center', fontWeight: 800, fontSize: 12.5, lineHeight: 1.3, boxShadow: '0 2px 8px rgba(0,0,0,.25)' }}>
      🔧 Manutenção rápida no servidor — seu progresso está salvo. Já já voltamos! 💛
    </div>
  )
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
          🚀 <b>Jogando dentro do Instagram?</b> Abre no navegador de verdade — teu login e teu save ficam seguros lá.
          <button onClick={escape} style={{ display: 'block', width: '100%', marginTop: 7, background: '#F5B301', color: '#0C0C0C', border: 'none', borderRadius: 9, padding: '9px 0', fontWeight: 900, fontSize: 13, fontFamily: 'Oswald, sans-serif', cursor: 'pointer' }}>
            ABRIR NO NAVEGADOR 🌐
          </button>
        </>
      ) : (
        <>
          🚀 <b>Jogando dentro do app?</b> Toca nos <b>três pontinhos (⋯)</b> aí no canto e escolhe <b>“Abrir no navegador externo”</b> — teu login e teu save ficam seguros lá.
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
class ErrorBoundary extends Component<{ children: ReactNode }, { err: Error | null }> {
  state: { err: Error | null } = { err: null }
  static getDerivedStateFromError(err: Error) { return { err } }
  componentDidCatch(err: Error) { try { console.error('Leilão Legends crash:', err) } catch { /* ignora */ } }
  render() {
    if (this.state.err) {
      return (
        <div style={{ minHeight: '100vh', background: '#F4ECD6', color: '#0C0C0C', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center', fontFamily: 'Oswald, sans-serif' }}>
          <div style={{ fontSize: 52 }}>😵</div>
          <p style={{ fontWeight: 900, fontSize: 22, margin: '8px 0 4px' }}>Ops, algo deu errado</p>
          <p style={{ fontWeight: 700, fontSize: 14, color: 'rgba(0,0,0,.6)', maxWidth: 340 }}>Volta ao início e tenta de novo. Seu progresso salvo <b>não foi apagado</b>.</p>
          <button onClick={() => { try { window.location.hash = '' } catch { /* ignora */ } window.location.reload() }}
            style={{ marginTop: 16, background: '#1B7A3D', color: '#fff', border: '3px solid #0C0C0C', borderRadius: 12, padding: '12px 22px', fontWeight: 900, fontSize: 16, fontFamily: 'Oswald, sans-serif', boxShadow: '4px 4px 0 #0C0C0C', cursor: 'pointer' }}>🏠 Voltar ao início</button>
          <p style={{ fontSize: 10.5, color: 'rgba(0,0,0,.45)', marginTop: 18, maxWidth: 340, wordBreak: 'break-word' }}>Erro: {String(this.state.err?.message || this.state.err)}</p>
          <p style={{ fontSize: 10.5, color: 'rgba(0,0,0,.45)', marginTop: 2 }}>Manda um print disso pro <b>@leilaolegendscom</b> 🙏</p>
        </div>
      )
    }
    return this.props.children
  }
}

// 🔄 VIGIA DE VERSÃO (atualização automática): o jogo é um site que fica aberto/
// cacheado no navegador — quem já está com a página aberta continua na versão
// ANTIGA até recarregar, e a galera não entende de "versão" nem recarrega. Este
// vigia compara o arquivo JS que ESالتA página carregou (o hash no nome muda a cada
// deploy) com o do index.html no servidor. Se mudou: mostra um banner (toque =
// atualiza) e, se a pessoa estiver na TELA INICIAL (segura), atualiza sozinho —
// sem interromper jogo em andamento. Guarda a hora do último auto-reload pra
// nunca entrar em loop (no máx. 1 auto-reload a cada 5 min).
function VersionWatcher() {
  const { state } = useEsc()
  const [stale, setStale] = useState(false)
  useEffect(() => {
    const cur = Array.from(document.scripts).map(s => s.getAttribute('src') || '').find(s => /assets\/index-[\w-]+\.js/.test(s)) || ''
    if (!cur) return
    let alive = true
    const check = async () => {
      try {
        const base = import.meta.env.BASE_URL || '/'
        const html = await fetch(`${base}index.html?v=${Date.now()}`, { cache: 'no-store' }).then(r => r.ok ? r.text() : '')
        const m = html.match(/assets\/index-[\w-]+\.js/)
        if (alive && m && !cur.includes(m[0])) setStale(true)
      } catch { /* offline/erro de rede — ignora, tenta de novo depois */ }
    }
    const t0 = setTimeout(check, 8000) // 1ª checagem uns segundos após abrir
    const iv = setInterval(check, 90_000) // e a cada 90s
    const onVis = () => { if (document.visibilityState === 'visible') check() } // e quando volta pro app
    document.addEventListener('visibilitychange', onVis)
    window.addEventListener('focus', onVis)
    return () => { alive = false; clearTimeout(t0); clearInterval(iv); document.removeEventListener('visibilitychange', onVis); window.removeEventListener('focus', onVis) }
  }, [])
  // auto-atualiza SÓ na tela inicial (não interrompe jogo) e no máx. 1x/5min (anti-loop)
  useEffect(() => {
    if (!stale || state.screen !== 'intro') return
    let last = 0
    try { last = +(sessionStorage.getItem('esc-auto-upd-at') || 0) } catch { /* ignora */ }
    if (Date.now() - last < 300_000) return // já atualizou há pouco — mostra só o banner
    const t = setTimeout(() => {
      try { sessionStorage.setItem('esc-auto-upd-at', String(Date.now())) } catch { /* ignora */ }
      window.location.reload()
    }, 2000)
    return () => clearTimeout(t)
  }, [stale, state.screen])
  if (!stale) return null
  return (
    <button onClick={() => window.location.reload()}
      style={{ position: 'fixed', top: 8, left: 8, right: 8, zIndex: 99999, margin: '0 auto', maxWidth: 440, background: '#1B7A3D', color: '#fff', border: '2px solid #0C0C0C', borderRadius: 12, padding: '10px 12px', textAlign: 'center', fontWeight: 800, fontSize: 12.5, lineHeight: 1.3, boxShadow: '0 4px 14px rgba(0,0,0,.35)', cursor: 'pointer', fontFamily: 'Oswald, sans-serif' }}>
      ✨ Saiu novidade nova no jogo! Toque aqui pra atualizar 🔄
    </button>
  )
}

export default function EscalacaoGame() {
  return (
    <ErrorBoundary>
      <EscProvider>
        <MaintenanceBanner />
        <AnnouncementToast />
        <OpenInBrowserBanner />
        <VersionWatcher />
        {/* FUNDO CREME DO JOGO: o site-estúdio tem fundo quase-preto (#06060f). O
            Leilão Legends é todo em telas cremes. Se alguma tela renderizar vazia
            por um instante (troca de fase, estado incompleto sincronizado, save
            interrompido), o que aparecia era o PRETO do estúdio — e virava um
            "tela preta travada" no print de quem jogava. Com este creme atrás de
            TUDO, o pior caso é uma tela creme com o rodapé (dá pra sair por ali),
            nunca mais um preto assustador. */}
        <div style={{ minHeight: '100vh', background: '#F4ECD6' }}>
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

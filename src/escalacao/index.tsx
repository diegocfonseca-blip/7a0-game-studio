import { useEffect, useRef, useState, Component, type ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import { flushPendingWrites } from './pending'
import { EscProvider, useEsc } from './store'
import { EscIntro, EscSetup, EscAuction, EscMonte, EscCerimonia, EscSeason, EscEnd, EscAlbum, EscRanking, GameFooter } from './screens'
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
  const ID = 'estadio-2026-07-v1'
  const [show, setShow] = useState(false)
  useEffect(() => {
    try { if (localStorage.getItem('esc-annc-' + ID)) return } catch { /* ignora */ }
    setShow(true)
    try { localStorage.setItem('esc-annc-' + ID, '1') } catch { /* ignora */ }
    const t = setTimeout(() => setShow(false), 8000) // aviso de feature: um pouco mais de tempo
    return () => clearTimeout(t)
  }, [])
  if (!show) return null
  return (
    <div style={{ position: 'fixed', top: 8, left: 8, right: 8, zIndex: 99998, margin: '0 auto', maxWidth: 440, background: '#16a34a', color: '#fff', border: '2px solid #14361f', borderRadius: 12, padding: '7px 28px 7px 11px', textAlign: 'center', fontWeight: 700, fontSize: 11, lineHeight: 1.3, boxShadow: '0 4px 12px rgba(0,0,0,.28)', animation: 'esc-annc-in .3s ease-out' }}>
      <style>{'@keyframes esc-annc-in{from{transform:translateY(-16px);opacity:0}to{transform:translateY(0);opacity:1}}'}</style>
      🏟️ NOVIDADE no <b>Modo Carreira</b>: chegou o <b>ESTÁDIO</b>! Construa arquibancada por arquibancada, acenda os refletores e veja a bilheteria render toda temporada 💰 Procura a aba 🏟️ na tua carreira!
      <button onClick={() => setShow(false)} aria-label="Fechar"
        style={{ position: 'absolute', top: 3, right: 5, background: 'transparent', border: 'none', color: '#fff', fontSize: 17, fontWeight: 900, lineHeight: 1, cursor: 'pointer', padding: '2px 5px' }}>×</button>
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

export default function EscalacaoGame() {
  return (
    <ErrorBoundary>
      <EscProvider>
        <MaintenanceBanner />
        <AnnouncementToast />
        <Router />
        <GameFooter />{/* rodapé de contato, sutil, no final de todas as telas */}
        <AdminPanel />
        <DinastiaGame />
        <CareerOnlineGame />
      </EscProvider>
    </ErrorBoundary>
  )
}

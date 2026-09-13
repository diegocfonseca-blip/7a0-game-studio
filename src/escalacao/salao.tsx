// Salão público: sem divisões, números de fundador ou identificação de torcedores.
// Identidades pertencem aos donos; esta tela somente exibe as artes existentes.
import { useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { ApoieButton } from './screens'
import { Escudo } from './escudos'
import { BATISMOS, type Batismo } from './batismos'
import { MASCOTES, CARIMBO_GOL } from './mascotes'
import { tr, getLang } from './lang'
import { CAMISAS_SALAO, RECORTE_CAMISA } from './salao-camisas'
import './salao.css'

interface Torcida { time_nome: string; gente: number }
const porChegada = (a: Batismo, b: Batismo) => (a.fundador ?? 999) - (b.fundador ?? 999) || a.clube.localeCompare(b.clube)
const pecas = () => [tr('Escudo', 'Crest'), tr('Mascote', 'Mascot'), tr('Manto', 'Shirt')]
function Arte({ clube, peca }: { clube: string; peca: number }) {
  const [erro, setErro] = useState(false)
  useEffect(() => setErro(false), [clube, peca])
  const mascote = MASCOTES[CARIMBO_GOL[clube]]
  const camisa = CAMISAS_SALAO[clube]
  if (peca === 0) return <Escudo nome={clube} size={280} />
  if (peca === 1 && mascote) return <>{mascote}</>
  const recorte = RECORTE_CAMISA[clube]
  if (peca === 2 && camisa && recorte && !erro) return <svg role="img" aria-label={tr('Camisa de ', 'Shirt of ') + clube} viewBox={`0 0 ${recorte[0]} ${recorte[2]}`} overflow="hidden"><image href={import.meta.env.BASE_URL + 'mantos-salao/' + camisa} width={recorte[0]} height={recorte[1]} onError={() => setErro(true)} /></svg>
  if (peca === 2 && camisa && !erro) return <img loading="lazy" decoding="async" src={import.meta.env.BASE_URL + 'mantos-salao/' + camisa} alt={tr('Camisa de ', 'Shirt of ') + clube} onError={() => setErro(true)} />
  return <p className="sb-empty">{peca === 1 ? tr('Este clube ainda não tem arte de mascote disponível no salão.', 'This club does not yet have mascot artwork available in the hall.') : tr('A arte da camisa deste clube ainda não está disponível no salão.', 'This club’s shirt artwork is not yet available in the hall.')}</p>
}
export default function Salao({ voltar }: { voltar?: () => void }) {
  const [aba, setAba] = useState<'clubes' | 'torcida'>('clubes')
  const [torcidas, setTorcidas] = useState<Torcida[] | null>(null)
  const [falha, setFalha] = useState(false)
  const [tentativa, setTentativa] = useState(0)
  const [ordem, setOrdem] = useState('chegada')
  const [detalhe, setDetalhe] = useState<Batismo | null>(null)
  const [destaque, setDestaque] = useState(0)
  const [peca, setPeca] = useState(0)
  const [ampliada, setAmpliada] = useState(false)
  const folhas = useRef<HTMLDivElement>(null)
  const closeZoom = useRef<HTMLButtonElement>(null)
  const ultimoFoco = useRef<HTMLElement | null>(null)
  const clubes = useMemo(() => [...BATISMOS].sort(ordem === 'nome' ? (a,b) => a.clube.localeCompare(b.clube, 'pt-BR') : porChegada), [ordem])
  const clube = clubes[destaque % clubes.length]
  useEffect(() => {
    let vivo = true
    setFalha(false); setTorcidas(null)
    void (async () => {
      try {
        const { data, error } = await supabase.rpc('esc_salao_torcidas')
        if (error) throw error
        if (vivo) setTorcidas((Array.isArray(data) ? data : []).filter((r: Torcida) => typeof r.time_nome === 'string' && r.time_nome.trim() && Number.isFinite(Number(r.gente)) && Number(r.gente) > 0).map((r: Torcida) => ({ time_nome: r.time_nome, gente: Number(r.gente) })).sort((a,b) => b.gente - a.gente || a.time_nome.localeCompare(b.time_nome, 'pt-BR')))
      } catch { if (vivo) { setFalha(true); setTorcidas([]) } }
    })()
    return () => { vivo = false }
  }, [tentativa])
  useEffect(() => {
    if (!ampliada) return
    ultimoFoco.current = document.activeElement as HTMLElement
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeZoom.current?.focus()
    const tecla = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setAmpliada(false)
      if (e.key === 'Tab') { e.preventDefault(); closeZoom.current?.focus() }
    }
    window.addEventListener('keydown', tecla)
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', tecla); ultimoFoco.current?.focus() }
  }, [ampliada])
  const total = (torcidas ?? []).reduce((s, r) => s + r.gente, 0)
  const pct = (n: number) => new Intl.NumberFormat(getLang() === 'en' ? 'en' : 'pt-BR', { style:'percent', maximumFractionDigits:1 }).format(total ? n / total : 0)
  const abrir = (c: Batismo) => { setDetalhe(c); setPeca(0); window.scrollTo({ top:0, behavior:'instant' }) }
  const moverPeca = (n: number) => {
    setPeca(n)
    const el = folhas.current
    const folha = el?.children[n] as HTMLElement | undefined
    if (el && folha) el.scrollTo({ left: folha.offsetLeft - (el.children[0] as HTMLElement).offsetLeft, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })
  }
  const apoio = <section className="sb-apoio"><small>{tr('O PRÓXIMO PODE SER O SEU', 'YOURS COULD BE NEXT')}</small><h2>{tr('Seu nome. Seu escudo. Sua história no jogo.', 'Your name. Your crest. Your story in the game.')}</h2><p>{tr('Uma identidade criada para o seu clube e vista por quem joga.', 'An identity created for your club and seen by fellow players.')}</p><ApoieButton startScreen="batismo" trigger={open => <button className="sb-primary" onClick={open}>{tr('QUERO CRIAR MEU CLUBE', 'I WANT TO CREATE MY CLUB')}</button>} /><p className="sb-note">{tr('Conheça o Batismo · sem vantagem em campo.', 'Explore club naming · no on-pitch advantage.')}</p></section>
  return <div className="sb-root">
    <header className="sb-header">
      <button className="sb-back" onClick={() => detalhe ? setDetalhe(null) : voltar?.()}>{detalhe ? tr('← Voltar ao salão', '← Back to the hall') : tr('← Voltar', '← Back')}</button>
      <small>{detalhe ? tr('IDENTIDADE DO CLUBE', 'CLUB IDENTITY') : tr('A COMUNIDADE TEM ESCUDO', 'A COMMUNITY WITH ITS OWN CRESTS')}</small>
      <h1>{detalhe ? detalhe.clube : tr('SALÃO DOS BATISMOS', 'HALL OF NAMED CLUBS')}</h1>
      <p>{detalhe ? tr('Escudo, mascote e camisa. Uma história com a sua marca.', 'Crest, mascot and shirt. A story with your own mark.') : tr('Conheça os clubes de quem faz parte dessa história. Toque num escudo e entre.', 'Meet the clubs that are part of this story. Tap a crest to step inside.')}</p>
    </header>
    {detalhe ? <>
      <div className="sb-tabs" aria-label={tr('Peças da identidade', 'Identity pieces')}>{pecas().map((p,i) => <button key={i} aria-pressed={i===peca} onClick={() => moverPeca(i)}>{p}</button>)}</div>
      <section className="sb-desk">
        <div className="sb-sheets" ref={folhas} onScroll={() => { const el=folhas.current; if(el && el.scrollWidth>el.clientWidth+5) { const step=(el.children[1] as HTMLElement).offsetLeft-(el.children[0] as HTMLElement).offsetLeft; setPeca(Math.min(2,Math.max(0,Math.round(el.scrollLeft/step)))) } }}>
          {pecas().map((p,i) => <button className="sb-paper" key={i} onClick={() => { setPeca(i); setAmpliada(true) }} aria-label={tr('Ampliar ', 'Enlarge ') + p}>
            <h2>{p}</h2><div className="sb-art"><Arte clube={detalhe.clube} peca={i} /></div><p>{[tr('A MARCA DO SEU CLUBE.', 'YOUR CLUB’S MARK.'),tr('PERSONALIDADE PARA COMEMORAR.', 'PERSONALITY TO CELEBRATE.'),tr('A CAMISA QUE CONTA SUA HISTÓRIA.', 'THE SHIRT THAT TELLS YOUR STORY.')][i]}</p>
          </button>)}
        </div>
        <div className="sb-paper-nav"><button onClick={() => moverPeca((peca+2)%3)} aria-label={tr('Folha anterior', 'Previous sheet')}>‹</button><span>{pecas()[peca]} · {peca+1}/3<small>{tr('Deslize · toque na folha para ampliar', 'Swipe · tap a sheet to enlarge')}</small></span><button onClick={() => moverPeca((peca+1)%3)} aria-label={tr('Próxima folha', 'Next sheet')}>›</button></div>
      </section>
      <p className="sb-note sb-owner">{tr('Identidade exclusiva deste clube. Visitar não libera o uso das artes de outro dono. Mostramos somente as artes disponíveis, sem inventar o verso da camisa.', 'This club’s exclusive identity. Visiting does not unlock another owner’s artwork. Only available artwork is shown; shirt backs are not invented.')}</p>
    </> : <>
      <div className="sb-tabs">{(['clubes','torcida'] as const).map(a => <button key={a} aria-pressed={aba===a} onClick={() => setAba(a)}>{a==='clubes' ? tr('CLUBES','CLUBS') : tr('TORCIDAS','FANBASES')}</button>)}</div>
      {aba==='clubes' ? <section className="sb-gallery">
        <article className="sb-feature"><button className="sb-stage" onClick={() => abrir(clube)} aria-label={tr('Conhecer ', 'Explore ') + clube.clube}><span>{clube.tipo==='socio' ? tr('CLUBE DE SÓCIO','MEMBER CLUB') : tr('CLUBE BATIZADO','NAMED CLUB')}</span><div className="sb-feature-crest"><Escudo nome={clube.clube} size={200} /></div><div className="sb-feature-mascot">{MASCOTES[CARIMBO_GOL[clube.clube]] ?? null}</div></button><div className="sb-feature-info"><h2>{clube.clube}</h2><button className="sb-primary" onClick={() => abrir(clube)}>{tr('CONHECER A IDENTIDADE →', 'EXPLORE THE IDENTITY →')}</button></div></article>
        <div className="sb-browse"><button onClick={() => setDestaque((destaque+clubes.length-1)%clubes.length)} aria-label={tr('Clube anterior','Previous club')}>‹</button><span>{destaque%clubes.length+1} / {clubes.length}</span><button onClick={() => setDestaque((destaque+1)%clubes.length)} aria-label={tr('Próximo clube','Next club')}>›</button></div>
        <div className="sb-list-heading"><h2>{tr('EXPLORE OS CLUBES','EXPLORE THE CLUBS')}</h2><select aria-label={tr('Ordem dos clubes','Club order')} value={ordem} onChange={e => {setOrdem(e.target.value);setDestaque(0)}}><option value="chegada">{tr('Ordem de chegada','Arrival order')}</option><option value="nome">{tr('Nome · A–Z','Name · A–Z')}</option></select></div>
        <div className="sb-grid">{clubes.map(c => <button key={c.clube} onClick={() => abrir(c)}><Escudo nome={c.clube} size={80} /><strong>{c.clube}</strong>{c.tipo==='socio' && <small>{tr('Sócio','Member')}</small>}</button>)}</div>
      </section> : <section className="sb-fans"><h2>{tr('Todas as torcidas. Cada uma com sua presença.', 'Every fanbase. Each with its own presence.')}</h2><p className="sb-note">{tr('Somente donos de Batismo que informaram o time de coração.', 'Only named-club owners who provided their favorite team.')}</p>
        {torcidas===null && <p role="status">{tr('Carregando torcidas…','Loading fanbases…')}</p>}
        {falha && <div role="alert"><p>{tr('Não foi possível carregar as torcidas agora.','Fanbases could not be loaded right now.')}</p><button onClick={() => setTentativa(tentativa+1)}>{tr('Tentar novamente','Try again')}</button></div>}
        {!falha && torcidas?.length===0 && <p>{tr('Ainda não há torcidas informadas.','No fanbases have been provided yet.')}</p>}
        {!falha && !!torcidas?.length && <div className="sb-fan-list"><div className="sb-list-title"><span>{tr('TIME DO CORAÇÃO','FAVORITE TEAM')}</span><span>%</span></div><ul>{torcidas.map(r => <li key={r.time_nome}><span>{r.time_nome}</span><strong>{pct(r.gente)}</strong></li>)}</ul></div>}
      </section>}
    </>}
    {apoio}
    {ampliada && detalhe && <div className="sb-zoom" role="dialog" aria-modal="true" aria-label={pecas()[peca]} onClick={e => {if(e.target===e.currentTarget)setAmpliada(false)}}><div className="sb-zoom-sheet"><button ref={closeZoom} className="sb-primary" onClick={() => setAmpliada(false)}>{tr('FECHAR','CLOSE')} ×</button><h2>{pecas()[peca]}</h2><div className="sb-art"><Arte clube={detalhe.clube} peca={peca} /></div></div></div>}
  </div>
}

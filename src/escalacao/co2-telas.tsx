// 🌐 CARREIRA ONLINE v2 (19/10) — as TELAS: entrada (criar/entrar/minhas), sala de espera e a barra do PRONTO.
// Mockups aprovados pelo Diego: `scripts/mockups/carreira-online-espera.png` e `carreira-online-pronto.png`.
// Só nas contas dele por enquanto (`useCarreiraOnline2`). Nada aqui encosta nas salas rápidas/Minhas Ligas.
import { useEffect, useMemo, useRef, useState } from 'react'
import { tr } from './lang'
import { useEsc, co2LeLocal } from './store'
import { pack, unpack } from './netpack'
import type { EscState } from './types'
import {
  useCo2, co2Abrir, co2Fechar, co2Criar, co2Entrar, co2MinhasSalas, co2Continuar, co2Mundo, co2Envia, co2PodeCriar,
  co2LeGavetas, co2Gaveta, co2Pronto, co2Comecar, co2Apito, co2Ritmo, co2EncerrarDia, co2SalvaPrivado, co2LePrivado, co2Agora,
  type Co2Sala,
} from './co2'
import { minhaGaveta, type EntradasMundo, type GavetaPublica } from './carreira-online-v2'
import { useCampo2DLiberado } from './sport'

const INK = '#0C0C0C', GOLD = '#FFC400', GREEN = '#1B7A3D', CREAM = '#F4ECD6'
const OSWALD = { fontFamily: 'Oswald, sans-serif' } as const
const caixa = (bg = '#fff'): React.CSSProperties => ({ background: bg, color: INK, border: `3px solid ${INK}`, borderRadius: 18, boxShadow: `4px 4px 0 ${INK}` }) // cor explícita: o tema da página é creme
const botao = (bg: string, cor = INK): React.CSSProperties => ({ width: '100%', background: bg, color: cor, border: `3px solid ${INK}`, borderRadius: 14, boxShadow: `4px 4px 0 ${INK}`, padding: '13px 10px', fontWeight: 900, fontSize: 17, textTransform: 'uppercase', cursor: 'pointer', ...OSWALD })

// ═══ ENTRADA (no menu online) ═══════════════════════════════════════════════════════════════════════════════════════
export function Co2Painel({ nomeClube }: { nomeClube: string }) {
  const [salas, setSalas] = useState<(Co2Sala & { assento: number; meuClube: string })[] | null>(null)
  const [podeCriar, setPodeCriar] = useState(false)
  const [nome, setNome] = useState('')
  const [clube, setClube] = useState(nomeClube)
  const [codigo, setCodigo] = useState('')
  const [erro, setErro] = useState('')
  const [aberta, setAberta] = useState<string | null>(null)
  const recarrega = () => { void co2MinhasSalas().then(setSalas) }
  useEffect(() => { recarrega(); void co2PodeCriar().then(setPodeCriar) }, [])
  const criar = async () => {
    setErro('')
    const r = await co2Criar(nome.trim() || tr('Carreira dos amigos', 'Friends career'), clube.trim())
    if (r.erro || !r.id) { setErro(r.erro === 'nome' ? tr('Nome do clube com pelo menos 2 letras.', 'Club name needs at least 2 letters.') : tr('Não deu pra criar agora.', 'Could not create right now.')); return }
    setAberta(r.id); recarrega()
  }
  const entrar = async () => {
    setErro('')
    const r = await co2Entrar(codigo.trim(), clube.trim())
    if (r.erro || !r.id) {
      setErro(r.erro === 'nao_achou' ? tr('Código não encontrado.', 'Code not found.') : r.erro === 'comecou' ? tr('Essa carreira já começou — só entra quem já é dela.', 'This career already started — only its members can enter.') : r.erro === 'cheia' ? tr('Sala cheia (20 clubes).', 'Room full (20 clubs).') : r.erro === 'nome' ? tr('Nome do clube com pelo menos 2 letras.', 'Club name needs at least 2 letters.') : tr('Não deu pra entrar agora.', 'Could not join right now.'))
      return
    }
    setAberta(r.id); recarrega()
  }
  if (aberta) return <Co2Espera salaId={aberta} onSair={() => { co2Fechar(); setAberta(null); recarrega() }} />
  const campo: React.CSSProperties = { width: '100%', border: `2.5px solid ${INK}`, borderRadius: 10, padding: '9px 10px', fontWeight: 800, fontSize: 14, background: '#fff', color: INK }
  return (
    <div style={{ ...caixa('#E7F0FF'), padding: 12 }}>
      <p style={{ ...OSWALD, fontWeight: 900, fontSize: 15, margin: '0 0 2px', color: '#1E3A8A' }}>🌐 {tr('CARREIRA ONLINE (nova) · em teste', 'ONLINE CAREER (new) · testing')}</p>
      <p style={{ fontWeight: 700, fontSize: 11, margin: '0 0 8px', color: 'rgba(0,0,0,.6)' }}>{tr('A carreira de sempre, com os amigos. Tudo salvo sozinho na nuvem do jogo.', 'The usual career, with friends. Everything saves by itself in the game cloud.')}</p>
      {salas && salas.length > 0 && (
        <div style={{ display: 'grid', gap: 6, marginBottom: 10 }}>
          {salas.map(s => (
            <button key={s.id} onClick={() => setAberta(s.id)} style={{ ...caixa(), padding: '8px 10px', textAlign: 'left', cursor: 'pointer', boxShadow: `2px 2px 0 ${INK}` }}>
              <span style={{ ...OSWALD, fontWeight: 900, fontSize: 14 }}>{s.nome}</span>
              <span style={{ display: 'block', fontWeight: 700, fontSize: 11, color: 'rgba(0,0,0,.6)' }}>{s.meuClube} · {s.codigo} · {s.temporada > 0 ? tr(`temporada ${s.temporada}`, `season ${s.temporada}`) : tr('ainda não começou', 'not started yet')}</span>
            </button>
          ))}
        </div>
      )}
      <input style={{ ...campo, marginBottom: 6 }} value={clube} onChange={e => setClube(e.target.value.slice(0, 24))} placeholder={tr('Nome do seu clube', 'Your club name')} />
      {podeCriar && (
        <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
          <input style={campo} value={nome} onChange={e => setNome(e.target.value.slice(0, 40))} placeholder={tr('Nome da carreira', 'Career name')} />
          <button onClick={() => void criar()} style={{ ...botao(GOLD), width: 'auto', fontSize: 13, padding: '8px 12px', boxShadow: `2px 2px 0 ${INK}` }}>{tr('Criar', 'Create')}</button>
        </div>
      )}
      <div style={{ display: 'flex', gap: 6 }}>
        <input style={campo} value={codigo} onChange={e => setCodigo(e.target.value.toUpperCase().slice(0, 6))} placeholder={tr('Código da carreira', 'Career code')} />
        <button onClick={() => void entrar()} style={{ ...botao('#fff'), width: 'auto', fontSize: 13, padding: '8px 12px', boxShadow: `2px 2px 0 ${INK}` }}>{tr('Entrar', 'Join')}</button>
      </div>
      {erro && <p style={{ fontWeight: 800, fontSize: 11.5, color: '#B23B2E', margin: '6px 0 0' }}>{erro}</p>}
    </div>
  )
}

// ═══ SALA DE ESPERA ═════════════════════════════════════════════════════════════════════════════════════════════════
const DIV_COR: Record<string, string> = { A: '#B8892B', B: '#3E8E4E', C: '#9A7B33', D: '#7A7460', V: '#6B5B3E' }

export function Co2Espera({ salaId, onSair }: { salaId: string; onSair: () => void }) {
  const { dispatch } = useEsc()
  const sn = useCo2()
  const [erro, setErro] = useState('')
  const [indo, setIndo] = useState(false)
  useEffect(() => { void co2Abrir(salaId) }, [salaId])
  const sala = sn.sala
  const souDono = !!sala && sala.dono === sn.uid
  const souVice = !!sala && sala.vice === sn.uid
  const donoAqui = !!sala && sn.aqui.includes(sala.dono)
  const possoComandar = souDono || (souVice && !donoAqui)
  const local = useMemo(() => co2LeLocal(salaId), [salaId, sala?.fase, sala?.temporada]) // eslint-disable-line react-hooks/exhaustive-deps
  const divDe = (assento: number): string | undefined => {
    const ord = sn.mundo?.ordem
    const uid = sn.clubes.find(c => c.assento === assento)?.user_id
    const id = ord && uid ? ord.indexOf(uid) : -1
    return id >= 0 ? local?.careerPlacements?.[`m${id}`] : undefined
  }
  // 🔁 a carreira já está rolando (o dono continuou): entra no MEU clube (ou no leilão de todos)
  const entrouRef = useRef(false)
  useEffect(() => {
    if (!sala || entrouRef.current || sala.fase === 'espera' || possoComandar) return
    void (async () => {
      if (sala.fase === 'virada' && sala.temporada <= 1 && !local) { entrouRef.current = true; co2Envia('pedir_estado'); return }
      const sv = local ?? await lePrivado()
      if (sv) { entrouRef.current = true; dispatch({ type: 'CO2_ABRE', save: sv }); if (sala.fase === 'virada') co2Envia('pedir_estado') }
    })()
  }, [sala, possoComandar, local, dispatch])
  const comecar = async () => {
    if (!sala || indo) return
    setIndo(true); setErro('')
    try {
      const r = sala.fase === 'espera' ? await co2Continuar(90) : 'ok'
      if (r !== 'ok') { setErro(r === 'sem_permissao' ? tr('Só o dono (ou o vice, quando o dono não está) continua.', 'Only the owner (or the vice, when the owner is away) continues.') : tr('Não deu agora. Tenta de novo.', 'Didn\'t work. Try again.')); return }
      if (sala.temporada === 0) {
        // 🏁 1ª vez: monta a carreira com os clubes de gente na ordem dos assentos e abre o leilão de estreia
        const clubes = [...sn.clubes].sort((a, b) => a.assento - b.assento)
        const ordem = clubes.map(c => c.user_id)
        const eu = ordem.indexOf(sn.uid ?? '')
        dispatch({ type: 'START_CAREER_SOLO', teamName: clubes[eu]?.nome ?? 'Meu Time', formation: '4-3-3', rivals: 5, co2: { sala: sala.id, nomes: clubes.map(c => c.nome), assento: eu } })
        await co2Mundo('virada', 1, 0, { ordem, v: 1 })
        return
      }
      const sv = local ?? await lePrivado()
      if (sala.fase === 'virada' && !sv) { co2Envia('pedir_estado'); return }
      if (!sv) { setErro(tr('Não achei o seu clube neste aparelho nem na nuvem do jogo.', 'Could not find your club on this device or in the game cloud.')); return }
      dispatch({ type: 'CO2_ABRE', save: { ...sv, co2: { ...sv.co2!, comanda: true } } })
    } finally { setIndo(false) }
  }
  if (!sala) return <div style={{ ...caixa(CREAM), padding: 16, textAlign: 'center', fontWeight: 800 }}>{tr('Abrindo a carreira…', 'Opening the career…')}</div>
  const clubes = [...sn.clubes].sort((a, b) => a.assento - b.assento)
  const nomeDono = clubes.find(c => c.user_id === sala.dono)?.nome ?? '—'
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div style={{ background: INK, borderRadius: 18, padding: '14px 16px' }}>
        <p style={{ ...OSWALD, fontWeight: 900, fontSize: 18, margin: 0, color: '#fff', lineHeight: 1.15 }}>
          <span style={{ color: GOLD }}>🌐 {tr('CARREIRA ONLINE', 'ONLINE CAREER')}</span>{sala.temporada > 0 ? ` · ${tr('TEMPORADA', 'SEASON')} ${sala.temporada} · ${tr('RODADA', 'ROUND')} ${sala.rodada}` : ''}
        </p>
      </div>
      <div style={{ ...caixa(), padding: 16 }}>
        <p style={{ ...OSWALD, fontWeight: 900, fontSize: 22, margin: 0, textTransform: 'uppercase', color: INK }}>{sala.nome}</p>
        <p style={{ fontWeight: 800, fontSize: 12.5, margin: '2px 0 10px', color: 'rgba(0,0,0,.6)' }}>
          {tr('Dono', 'Owner')}: {nomeDono} · {clubes.length} {tr('técnicos', 'managers')} · {tr('código', 'code')} <b style={{ color: INK }}>{sala.codigo}</b> · {tr('tudo salvo na nuvem do jogo', 'all saved in the game cloud')}
        </p>
        <div style={{ display: 'grid', gap: 7 }}>
          {clubes.map(c => {
            const chegou = sn.aqui.includes(c.user_id)
            const dv = divDe(c.assento)
            return (
              <div key={c.assento} style={{ display: 'flex', alignItems: 'center', gap: 8, border: `3px solid ${INK}`, borderRadius: 14, padding: '8px 10px', background: chegou ? '#fff' : '#EDE4D0', opacity: chegou ? 1 : 0.75 }}>
                {dv && <span style={{ ...OSWALD, fontWeight: 900, fontSize: 12, color: '#fff', background: DIV_COR[dv] ?? '#777', border: `2px solid ${INK}`, borderRadius: 8, padding: '0 7px' }}>{dv}</span>}
                <span style={{ fontWeight: 900, fontSize: 14.5, flex: 1, color: INK }}>{c.nome}{c.user_id === sala.dono ? ' 👑' : c.user_id === sala.vice ? ' ⭐' : ''}</span>
                <span style={{ fontWeight: 900, fontSize: 12, color: chegou ? GREEN : 'rgba(0,0,0,.45)' }}>{chegou ? `● ${tr('chegou', 'here')}` : `○ ${tr('ainda não', 'not yet')}`}</span>
              </div>
            )
          })}
        </div>
        <p style={{ fontWeight: 800, fontSize: 12, margin: '10px 0', color: 'rgba(0,0,0,.6)' }}>{tr('Quem não vier hoje joga com a última escalação. O clube continua guardado.', 'Whoever doesn\'t come today plays with their last lineup. The club stays saved.')}</p>
        {sala.fase === 'espera' && possoComandar && (
          <button disabled={indo || (sala.temporada === 0 && clubes.length < 2)} onClick={() => void comecar()} style={botao(sala.temporada === 0 && clubes.length < 2 ? '#ddd' : GOLD)}>
            {sala.temporada === 0 ? (clubes.length < 2 ? tr('⏳ Chame pelo menos 1 amigo', '⏳ Invite at least 1 friend') : tr('▶️ Começar carreira', '▶️ Start career')) : tr('▶️ Continuar carreira', '▶️ Continue career')}
          </button>
        )}
        {sala.fase !== 'espera' && possoComandar && (
          <button disabled={indo} onClick={() => void comecar()} style={botao(GOLD)}>{tr('▶️ Voltar pra carreira', '▶️ Back to the career')}</button>
        )}
        <p style={{ fontWeight: 800, fontSize: 11.5, margin: '6px 0 0', textAlign: 'center', color: 'rgba(0,0,0,.55)' }}>
          {possoComandar ? (souVice && !souDono ? tr('⭐ Você é o vice: o dono não está, então você continua hoje.', '⭐ You\'re the vice: the owner is away, so you continue today.') : tr('Só o dono da sala continua. Os outros esperam aqui.', 'Only the room owner continues. The others wait here.'))
            : sala.fase === 'espera' ? tr('Só o dono da sala continua. Você espera aqui.', 'Only the room owner continues. You wait here.') : tr('A carreira está rolando — entrando…', 'The career is on — joining…')}
        </p>
        {erro && <p style={{ fontWeight: 800, fontSize: 11.5, color: '#B23B2E', margin: '6px 0 0', textAlign: 'center' }}>{erro}</p>}
        <button onClick={onSair} style={{ marginTop: 10, width: '100%', background: 'none', border: 'none', textDecoration: 'underline', fontWeight: 800, fontSize: 12.5, color: 'rgba(0,0,0,.6)', cursor: 'pointer' }}>{tr('🚪 Sair (a carreira fica guardada)', '🚪 Leave (the career stays saved)')}</button>
      </div>
    </div>
  )
}

async function lePrivado(): Promise<EscState | null> {
  const d = await co2LePrivado()
  const z = d?.z
  if (typeof z !== 'string') return null
  try { return unpack<EscState>(z) } catch { return null }
}

// ═══ DENTRO DA TEMPORADA: a barra do PRONTO + o motor que segue o relógio do dono ═══════════════════════════════════
const PRAZO_S = 60

export function Co2Temporada({ entradasLocais, round, roundReady, seasonOver, onEscalacao, onTatica }: {
  entradasLocais: EntradasMundo; round: number; roundReady: boolean; seasonOver: boolean; onEscalacao: () => void; onTatica: () => void
}) {
  const { state, dispatch } = useEsc()
  const sn = useCo2()
  const sala = sn.sala
  const me = state.managers[state.youIdx]
  const comanda = !!state.co2?.comanda
  const [agora, setAgora] = useState(() => Date.now())
  useEffect(() => { const t = setInterval(() => setAgora(Date.now()), 1000); return () => clearInterval(t) }, [])

  // 📦 a minha gaveta pública (sobe quando muda, com folga) — é ela que os outros usam pra simular o meu clube
  const gaveta = useMemo<GavetaPublica | null>(() => (me ? minhaGaveta(me, entradasLocais) : null), [me, entradasLocais])
  const gavetaJson = useMemo(() => (gaveta ? JSON.stringify(gaveta) : ''), [gaveta])
  const enviadaRef = useRef('')
  const sobeGaveta = async (): Promise<boolean> => {
    if (!gaveta || gavetaJson === enviadaRef.current) return true
    const r = await co2Gaveta(gaveta as unknown as Record<string, unknown>)
    if (r === 'ok') enviadaRef.current = gavetaJson
    return r === 'ok'
  }
  useEffect(() => { const t = setTimeout(() => { void sobeGaveta() }, 800); return () => clearTimeout(t) }, [gavetaJson]) // eslint-disable-line react-hooks/exhaustive-deps

  // 🔄 as gavetas dos outros: ao entrar, quando alguém avisa que mexeu, e congeladas no começo de cada rodada
  const puxaGavetas = async (ate?: number) => {
    const rows = await co2LeGavetas()
    const ordem = co2Agora().mundo?.ordem ?? []
    const gav = rows.map(r => r.publico as unknown as GavetaPublica).filter(g => g && typeof g.mgrId === 'number' && ordem[g.mgrId] != null)
    dispatch({ type: 'CO2_GAVETAS', gavetas: gav, ate })
  }
  useEffect(() => { void puxaGavetas() }, [sn.clubes]) // eslint-disable-line react-hooks/exhaustive-deps

  // ▶️ a rodada começou no dono → congela as gavetas e joga a rodada aqui também (o motor é o mesmo em todo aparelho)
  const jogandoRef = useRef(-1)
  useEffect(() => {
    if (!sala || sala.fase !== 'jogando' || round !== sala.rodada || jogandoRef.current === sala.rodada) return
    jogandoRef.current = sala.rodada
    void (async () => {
      await sobeGaveta()
      await puxaGavetas(sala.rodada)
      dispatch({ type: 'PLAY_ROUND' })
    })()
  }, [sala, round]) // eslint-disable-line react-hooks/exhaustive-deps

  // 🏁 quem comanda: rodada terminou de animar → apito (próxima rodada entra no PREPARO)
  useEffect(() => {
    if (!comanda || !sala || sala.fase !== 'jogando' || !roundReady || round !== sala.rodada + 1) return
    void co2Apito(sala.rodada + 1, PRAZO_S)
  }, [comanda, sala, roundReady, round])

  // ⏱️ quem comanda: todo mundo PRONTO (ou acabou o tempo, no automático) → começa
  const humanos = sn.clubes.length
  const prontos = sala ? sn.clubes.filter(c => c.pronto_rodada === sala.rodada + 1).length : 0
  const restante = sala?.prazo ? Math.max(0, Math.round((new Date(sala.prazo).getTime() - agora) / 1000)) : null
  const comecouRef = useRef(-1)
  useEffect(() => {
    if (!comanda || !sala || sala.fase !== 'preparo' || sala.pausado || seasonOver || comecouRef.current === sala.rodada) return
    if (round !== sala.rodada) return
    const todos = humanos > 0 && prontos >= humanos
    const acabou = sala.auto && restante === 0
    if (!todos && !acabou) return
    comecouRef.current = sala.rodada
    void co2Comecar()
  }, [comanda, sala, prontos, humanos, restante, round, seasonOver])

  // 💾 salva o meu clube na nuvem do jogo depois de cada rodada (sem botão de salvar)
  const salvoRef = useRef(-1)
  useEffect(() => {
    if (!sala || sala.fase === 'jogando' || salvoRef.current === round) return
    salvoRef.current = round
    const st = state
    const t = setTimeout(() => { void co2SalvaPrivado({ z: pack(st), at: Date.now(), t: st.seasonNo, r: st.round }) }, 1500)
    return () => clearTimeout(t)
  }, [round, sala?.fase]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!sala) return null
  if (seasonOver) return (
    <div style={{ ...caixa('#FFF3C4'), padding: 12, marginBottom: 10 }}>
      <p style={{ ...OSWALD, fontWeight: 900, fontSize: 15, margin: '0 0 4px', textTransform: 'uppercase' }}>🔧 {tr('Fim de temporada', 'End of season')}</p>
      <p style={{ fontWeight: 800, fontSize: 12, margin: 0 }}>{tr('A virada da carreira online (leilão de todos, mesmo time, quem sobe e quem cai) é a próxima parte que está sendo construída. O seu clube está salvo — os botões de decidir a próxima temporada ainda não andam aqui.', 'The online career season turn (everyone\'s auction, same team, promotion and relegation) is the next part being built. Your club is saved — the next-season buttons don\'t work here yet.')}</p>
    </div>
  )
  const euPronto = !!sn.clubes.find(c => c.user_id === sn.uid && c.pronto_rodada === sala.rodada + 1)
  const faltam = sn.clubes.filter(c => c.pronto_rodada !== sala.rodada + 1).map(c => c.nome)
  const pct = humanos ? Math.round((prontos / humanos) * 100) : 0
  const mm = restante != null ? `${Math.floor(restante / 60)}:${String(restante % 60).padStart(2, '0')}` : '–'
  return (
    <div style={{ display: 'grid', gap: 10, marginBottom: 10 }}>
      {sala.fase === 'preparo' && (
        <div style={{ ...caixa('#FFF8DC'), padding: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 70, height: 70, borderRadius: 999, border: `4px solid ${INK}`, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', ...OSWALD, fontWeight: 900, fontSize: 22, flexShrink: 0 }}>{sala.pausado ? '⏸' : mm}</div>
            <div>
              <p style={{ ...OSWALD, fontWeight: 900, fontSize: 18, margin: 0, textTransform: 'uppercase' }}>{tr('Arrume seu time', 'Set up your team')}</p>
              <p style={{ fontWeight: 800, fontSize: 12, margin: 0, color: 'rgba(0,0,0,.6)' }}>{tr('A rodada começa quando todo mundo apertar PRONTO ou o tempo acabar.', 'The round starts when everyone hits READY or time runs out.')}</p>
            </div>
          </div>
          <div style={{ height: 12, border: `2.5px solid ${INK}`, borderRadius: 99, background: '#fff', margin: '10px 0 4px', overflow: 'hidden' }}><div style={{ width: `${pct}%`, height: '100%', background: GREEN }} /></div>
          <p style={{ fontWeight: 900, fontSize: 12, margin: '0 0 8px' }}>✅ {prontos} {tr('de', 'of')} {humanos} {tr('prontos', 'ready')}{faltam.length ? ` · ${tr('faltam', 'missing')}: ${faltam.join(', ')}` : ''}</p>
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <button onClick={onEscalacao} style={{ ...botao('#fff'), fontSize: 14 }}>🧩 {tr('Escalação', 'Lineup')}</button>
            <button onClick={onTatica} style={{ ...botao('#fff'), fontSize: 14 }}>🎯 {tr('Tática', 'Tactic')}</button>
          </div>
          <button disabled={euPronto} onClick={() => void (async () => { await sobeGaveta(); await co2Pronto(sala.rodada + 1, { r: sala.rodada + 1 }) })()} style={botao(euPronto ? '#CFE8D6' : GREEN, euPronto ? INK : '#fff')}>
            {euPronto ? tr('✅ Pronto! Esperando os outros…', '✅ Ready! Waiting for the others…') : tr('✅ Estou pronto', '✅ I\'m ready')}
          </button>
        </div>
      )}
      {sala.fase === 'jogando' && (
        <div style={{ ...caixa('#fff'), padding: '9px 12px', textAlign: 'center' }}>
          <p style={{ ...OSWALD, fontWeight: 900, fontSize: 14, margin: 0 }}>⚽ {tr(`Rodada ${sala.rodada + 1} rolando pra todo mundo`, `Round ${sala.rodada + 1} on for everyone`)}</p>
        </div>
      )}
      {comanda && (
        <div style={{ ...caixa('#fff'), padding: 12 }}>
          <p style={{ ...OSWALD, fontWeight: 900, fontSize: 14, margin: '0 0 8px', textTransform: 'uppercase' }}>{tr('Só o dono vê', 'Only the owner sees')}</p>
          <div style={{ display: 'flex', gap: 8 }}>
            <button disabled={sala.fase !== 'preparo'} onClick={() => { comecouRef.current = sala.rodada; void co2Comecar() }} style={{ ...botao(sala.fase === 'preparo' ? GOLD : '#eee'), fontSize: 14, flex: 2 }}>▶️ {tr('Começar agora', 'Start now')}</button>
            <button onClick={() => void co2Ritmo(sala.auto, sala.velocidade, !sala.pausado)} style={{ ...botao('#fff'), fontSize: 14, flex: 1 }}>{sala.pausado ? `▶️ ${tr('Seguir', 'Resume')}` : `⏸️ ${tr('Pausar', 'Pause')}`}</button>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button onClick={() => void co2Ritmo(!sala.auto, sala.velocidade, sala.pausado)} style={{ ...botao('#fff'), fontSize: 12, padding: '8px' }}>{sala.auto ? tr('Automático ligado', 'Auto on') : tr('Automático desligado', 'Auto off')}</button>
            <button onClick={() => void co2EncerrarDia()} disabled={sala.fase !== 'preparo'} style={{ ...botao('#fff'), fontSize: 12, padding: '8px' }}>🌙 {tr('Encerrar o dia', 'End the day')}</button>
          </div>
          <p style={{ fontWeight: 800, fontSize: 11, margin: '6px 0 0', color: 'rgba(0,0,0,.55)' }}>{sala.auto ? tr('Automático ligado · quem não apertar joga com a escalação que já está.', 'Auto on · whoever doesn\'t press plays with the current lineup.') : tr('Automático desligado · a rodada só começa quando você apertar.', 'Auto off · the round only starts when you press.')}</p>
        </div>
      )}
    </div>
  )
}

/** Quem comanda: o leilão acabou e a temporada abriu → a sala entra no PREPARO da rodada 1. */
export function useCo2FimDaVirada() {
  const { state } = useEsc()
  const sn = useCo2()
  // ⚽🧠 motor novo (21/10, Diego: *"carreira offline e carreira online"*): quem comanda — e só se a conta dele já tem o motor novo —
  // carimba no mundo a temporada a partir da qual ele vale. Todo aparelho lê o MESMO carimbo, então todo mundo liga junto, na
  // rodada 1 (antes de qualquer jogo da temporada). Carimbado uma vez, não muda mais.
  const m2Liberado = useCampo2DLiberado()
  useEffect(() => {
    if (!state.co2?.comanda || state.screen !== 'season' || sn.sala?.fase !== 'virada') return
    const mm = co2Agora().mundo
    const carimbo = m2Liberado && mm && mm.m2 == null ? { ...mm, m2: state.seasonNo ?? 1 } : null
    void co2Mundo('preparo', state.seasonNo ?? 1, 0, carimbo, 90)
  }, [state.co2?.comanda, state.screen, sn.sala?.fase, state.seasonNo, m2Liberado])
}

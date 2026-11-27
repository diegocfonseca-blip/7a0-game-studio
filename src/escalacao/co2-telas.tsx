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
  type Co2Sala, type Co2Mundo, TEMPOS_OPCOES, tempoPausa, tempoRodada,
} from './co2'
import { minhaGaveta, co2Fechamento, type EntradasMundo, type GavetaPublica, type Fechamento } from './carreira-online-v2'
import { useMotor2Carreira, copaBrasilLiberada } from './sport'
import { avisoFechado, fechaAviso } from './avisos-fechados'
import { CMModal, ConvocacaoScreen, CupScreen, simulaCopaMundo, loadCopaSave, type CopaSave, type Formation, type CMStatCarta } from './copa-mundo'
import { rankingSelecoes } from './paises'
import { vezDaCopa, convitesDaCopa, entrantsDaCopa, ordemDeEscolha, type Co2CopaVaga, type Co2CopaEscolha } from './co2-copa-mundo'

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
  // 🤖 26/11 (Diego: *"opção nas config do host p ele decidir se deixa nenhum bot ou deixa até 5 bots"*): quantos bots disputam o leilão
  const [bots, setBots] = useState(3)
  const [tempos, setTempos] = useState<{ pausa: number; rodada: number }>({ pausa: 60, rodada: 60 })
  useEffect(() => { void co2Abrir(salaId) }, [salaId])
  const sala = sn.sala
  const souDono = !!sala && sala.dono === sn.uid
  const donoAqui = !!sala && sn.aqui.includes(sala.dono)
  // 👑 26/11 (Diego: "pode tirar o vice"): só o DONO comanda — sem o dono, a carreira espera (regra da coroa)
  const possoComandar = souDono
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
  const comecar = async (modo: 'dinamica' | 'livre' = 'livre') => {
    if (!sala || indo) return
    setIndo(true); setErro('')
    try {
      const r = sala.fase === 'espera' ? await co2Continuar(90) : 'ok'
      if (r !== 'ok') { setErro(r === 'sem_permissao' ? tr('Só o dono continua a carreira.', 'Only the owner continues the career.') : tr('Não deu agora. Tenta de novo.', 'Didn\'t work. Try again.')); return }
      if (sala.temporada === 0) {
        // 🏁 1ª vez: monta a carreira com os clubes de gente na ordem dos assentos e abre o leilão de estreia
        const clubes = [...sn.clubes].sort((a, b) => a.assento - b.assento)
        const ordem = clubes.map(c => c.user_id)
        const eu = ordem.indexOf(sn.uid ?? '')
        dispatch({ type: 'START_CAREER_SOLO', teamName: clubes[eu]?.nome ?? 'Meu Time', formation: '4-3-3', rivals: bots, co2: { sala: sala.id, nomes: clubes.map(c => c.nome), assento: eu } })
        await co2Mundo('virada', 1, 0, { ordem, v: 1, modo, bots, tempos })
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
                <span style={{ fontWeight: 900, fontSize: 14.5, flex: 1, color: INK }}>{c.nome}{c.user_id === sala.dono ? ' 👑' : ''}</span>
                <span style={{ fontWeight: 900, fontSize: 12, color: chegou ? GREEN : 'rgba(0,0,0,.45)' }}>{chegou ? `● ${tr('chegou', 'here')}` : `○ ${tr('ainda não', 'not yet')}`}</span>
              </div>
            )
          })}
        </div>
        <p style={{ fontWeight: 800, fontSize: 12, margin: '10px 0', color: 'rgba(0,0,0,.6)' }}>{tr('Quem não vier hoje joga com a última escalação. O clube continua guardado.', 'Whoever doesn\'t come today plays with their last lineup. The club stays saved.')}</p>
        {sala.fase === 'espera' && possoComandar && (
          sala.temporada === 0 && clubes.length >= 2 ? (
            // 🔀 26/11 (Diego: "queria testar os dois"): o dono escolhe o jeito na largada; fica gravado no mundo da carreira
            <div style={{ display: 'grid', gap: 8 }}>
              <div style={{ border: `3px solid ${INK}`, borderRadius: 14, padding: '8px 10px', background: '#fff' }}>
                <p style={{ ...OSWALD, fontWeight: 900, fontSize: 13, margin: '0 0 6px', textTransform: 'uppercase' }}>🤖 {tr('Bots no leilão', 'Bots in the auction')}</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 5 }}>
                  {[0, 1, 2, 3, 4, 5].map(n => (
                    <button key={n} onClick={() => setBots(n)} style={{ border: `2.5px solid ${INK}`, borderRadius: 10, padding: '6px 0', fontWeight: 900, fontSize: 15, background: bots === n ? GOLD : '#fff', color: INK, cursor: 'pointer', boxShadow: bots === n ? `2px 2px 0 ${INK}` : 'none', ...OSWALD }}>{n}</button>
                  ))}
                </div>
                <p style={{ fontWeight: 700, fontSize: 11, margin: '6px 0 0', color: 'rgba(0,0,0,.6)' }}>{bots === 0 ? tr('Sem bots: o leilão é só entre vocês.', 'No bots: the auction is just between you.') : tr(`${bots} bot${bots > 1 ? 's' : ''} disputando as cartas com vocês. A liga tem os outros clubes de sempre.`, `${bots} bot${bots > 1 ? 's' : ''} bidding against you. The league has the usual other clubs.`)}{bots === 0 && clubes.length === 2 ? tr(' Com 2 técnicos, sobra muita carta pro Monte.', ' With 2 managers, lots of cards go to the pile.') : ''}</p>
              </div>
              <Co2Tempos valor={tempos} onMuda={setTempos} />
              <button disabled={indo} onClick={() => void comecar('dinamica')} style={botao(GOLD)}>⚡ {tr('Começar · Dinâmica', 'Start · Dynamic')}</button>
              <p style={{ fontWeight: 800, fontSize: 11.5, margin: '-2px 0 2px', color: 'rgba(0,0,0,.6)' }}>{tr(`As rodadas seguem direto. Só para quando começa uma competição nova (${tempos.pausa} s pra mexer no time).`, `Rounds run back to back. Only pauses when a new competition starts (${tempos.pausa} s to tweak the team).`)}</p>
              <button disabled={indo} onClick={() => void comecar('livre')} style={botao('#fff')}>🧭 {tr('Começar · Livre', 'Start · Free')}</button>
              <p style={{ fontWeight: 800, fontSize: 11.5, margin: '-2px 0 0', color: 'rgba(0,0,0,.6)' }}>{tr('Cada rodada espera todo mundo apertar PRONTO (ou o tempo acabar).', 'Each round waits for everyone to hit READY (or the time to run out).')}</p>
            </div>
          ) : (
          <button disabled={indo || (sala.temporada === 0 && clubes.length < 2)} onClick={() => void comecar()} style={botao(sala.temporada === 0 && clubes.length < 2 ? '#ddd' : GOLD)}>
            {sala.temporada === 0 ? tr('⏳ Chame pelo menos 1 amigo', '⏳ Invite at least 1 friend') : tr('▶️ Continuar carreira', '▶️ Continue career')}
          </button>
          )
        )}
        {sala.fase !== 'espera' && possoComandar && (
          <button disabled={indo} onClick={() => void comecar()} style={botao(GOLD)}>{tr('▶️ Voltar pra carreira', '▶️ Back to the career')}</button>
        )}
        <p style={{ fontWeight: 800, fontSize: 11.5, margin: '6px 0 0', textAlign: 'center', color: 'rgba(0,0,0,.55)' }}>
          {possoComandar ? tr('Só o dono continua a carreira. Os outros esperam aqui.', 'Only the owner continues the career. The others wait here.')
            : sala.fase === 'espera' ? (donoAqui ? tr('Só o dono continua a carreira. Você espera aqui.', 'Only the owner continues the career. You wait here.') : tr('⏸ Esperando o dono da carreira chegar.', '⏸ Waiting for the career owner to arrive.')) : tr('A carreira está rolando — entrando…', 'The career is on — joining…')}
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
const PRAZO_DINAMICA_S = 15 // o banco aceita no mínimo 15 s; na Dinâmica o dono começa logo que a rodada anterior terminou de animar

export function Co2Temporada({ entradasLocais, round, roundReady, seasonOver, onEscalacao }: {
  entradasLocais: EntradasMundo; round: number; roundReady: boolean; seasonOver: boolean; onEscalacao: () => void; onTatica?: () => void
}) {
  const { state, dispatch } = useEsc()
  const sn = useCo2()
  const sala = sn.sala
  const me = state.managers[state.youIdx]
  const comanda = !!state.co2?.comanda
  // ⚡ 26/11 (Diego): na Dinâmica as rodadas seguem DIRETO — o preparo dura só o respiro de 3 s (dá pra trocar no meio do jogo
  // pelo botão de substituir). A pausa grande (60 s + anúncio) é só quando começa competição nova / dia dos contratos.
  const dinamica = sn.mundo?.modo === 'dinamica'
  const [agora, setAgora] = useState(() => Date.now())
  useEffect(() => { const t = setInterval(() => setAgora(Date.now()), 1000); return () => clearInterval(t) }, [])

  // 📦 a minha gaveta pública (sobe quando muda, com folga) — é ela que os outros usam pra simular o meu clube
  // 🌍 27/11: a gaveta leva também a decisão da Copa do Mundo e o caixa (desempate do ranking igual em todo aparelho)
  const minhaCopa = state.co2?.minhaCopa
  const meuCaixa = me ? Math.round(state.careerCoins?.[me.id] ?? 0) : 0
  const gaveta = useMemo<GavetaPublica | null>(() => (me ? { ...minhaGaveta(me, entradasLocais), ...(minhaCopa ? { copaMundo: minhaCopa } : {}), caixa: meuCaixa } : null), [me, entradasLocais, minhaCopa, meuCaixa])
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

  // 📴 26/11 (Diego: *"quem não jogou não perde o clube… o time joga sozinho e ele alcança ao voltar"*): voltei e a turma já
  // jogou rodadas que eu não joguei → jogo todas aqui de uma vez, com as gavetas do banco (o mesmo que os outros usaram)
  const alcancaRef = useRef('')
  useEffect(() => {
    if (!sala || comanda || state.screen !== 'season') return
    const alvo = sala.temporada > (state.seasonNo ?? 1) ? 38 : sala.temporada === (state.seasonNo ?? 1) ? sala.rodada : -1
    if (alvo <= round) return
    const chave = `${sala.temporada}:${alvo}:${round}`
    if (alcancaRef.current === chave) return
    alcancaRef.current = chave
    void (async () => {
      const rows = await co2LeGavetas()
      const ordem = co2Agora().mundo?.ordem ?? []
      const gav = rows.map(r => r.publico as unknown as GavetaPublica).filter(g => g && typeof g.mgrId === 'number' && ordem[g.mgrId] != null)
      dispatch({ type: 'CO2_ALCANCA_RODADAS', gavetas: gav, ate: alvo })
    })()
  }, [sala, round, comanda, state.screen, state.seasonNo]) // eslint-disable-line react-hooks/exhaustive-deps

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
    void co2Apito(sala.rodada + 1, dinamica ? PRAZO_DINAMICA_S : tempoRodada(co2Agora().mundo))
  }, [comanda, sala, roundReady, round, dinamica])

  // ⏱️ quem comanda: todo mundo PRONTO (ou acabou o tempo, no automático) → começa
  const humanos = sn.clubes.length
  const prontos = sala ? sn.clubes.filter(c => c.pronto_rodada === sala.rodada + 1).length : 0
  const restante = sala?.prazo ? Math.max(0, Math.round((new Date(sala.prazo).getTime() - agora) / 1000)) : null
  const comecouRef = useRef(-1)
  useEffect(() => {
    if (!comanda || !sala || sala.fase !== 'preparo' || sala.pausado || seasonOver || comecouRef.current === sala.rodada) return
    if (round !== sala.rodada) return
    const todos = humanos > 0 && prontos >= humanos
    // ⚡ Dinâmica: o banco guarda prazo mínimo de 15 s, mas o dono segue 3 s depois do apito (o respiro pra ver o placar)
    const respiroDin = dinamica && !!sala.prazo && agora >= new Date(sala.prazo).getTime() - (PRAZO_DINAMICA_S - 3) * 1000
    // 🎬 26/11: na estreia da temporada (Dinâmica) o relógio é só AVISO — quem começa é o dono, pelo anúncio
    if (dinamica && sala.rodada === 0) return
    const acabou = (sala.auto && restante === 0) || respiroDin
    if (!todos && !acabou) return
    comecouRef.current = sala.rodada
    void co2Comecar()
  }, [comanda, sala, prontos, humanos, restante, round, seasonOver, dinamica, agora])

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
  const copaChegou = !!sn.mundo?.fim && state.copaXiSeason === state.seasonNo
  if (seasonOver && !copaChegou) return (
    <div style={{ ...caixa('#FFF3C4'), padding: 12, marginBottom: 10 }}>
      <p style={{ ...OSWALD, fontWeight: 900, fontSize: 15, margin: '0 0 4px', textTransform: 'uppercase' }}>⏳ {tr('Preparando a copa', 'Getting the cup ready')}</p>
      <p style={{ fontWeight: 800, fontSize: 12, margin: 0 }}>{comanda ? tr('Fechando a escalação de todo mundo pra copa…', 'Locking everyone\'s lineup for the cup…') : tr('Esperando o dono fechar a escalação da copa. Ela é igual pra todo mundo e aparece aqui sozinha.', 'Waiting for the owner to lock the cup lineups. It\'s the same for everyone and shows up here by itself.')}</p>
    </div>
  )
  if (seasonOver) return (
    <div style={{ ...caixa('#FFF3C4'), padding: 12, marginBottom: 10 }}>
      <p style={{ ...OSWALD, fontWeight: 900, fontSize: 15, margin: '0 0 4px', textTransform: 'uppercase' }}>🏁 {tr('Fim de temporada', 'End of season')}</p>
      <p style={{ fontWeight: 800, fontSize: 12, margin: 0 }}>{tr('Siga o fim de temporada aqui embaixo e aperte Leilão: você decide os contratos e fecha o seu clube. Quando todo mundo fechar, o dono abre o leilão de todos.', 'Follow the end of season below and press Auction: you sort your contracts and close your club. When everyone has closed, the owner opens everyone\'s auction.')}</p>
    </div>
  )
  const euPronto = !!sn.clubes.find(c => c.user_id === sn.uid && c.pronto_rodada === sala.rodada + 1)
  const faltam = sn.clubes.filter(c => c.pronto_rodada !== sala.rodada + 1).map(c => c.nome)
  const pct = humanos ? Math.round((prontos / humanos) * 100) : 0
  const mm = restante != null ? `${Math.floor(restante / 60)}:${String(restante % 60).padStart(2, '0')}` : '–'
  return (
    <div style={{ display: 'grid', gap: 10, marginBottom: 10 }}>
      {sala.fase === 'preparo' && dinamica && sala.rodada === 0 && (
        <Co2Anuncio restante={restante} comanda={comanda} onSeguir={() => { comecouRef.current = sala.rodada; void co2Comecar() }} />
      )}
      {sala.fase === 'preparo' && dinamica && sala.rodada > 0 && (
        <div style={{ ...caixa('#FFF8DC'), padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ ...OSWALD, fontWeight: 900, fontSize: 14, flex: 1, textTransform: 'uppercase' }}>{sala.pausado ? `⏸ ${tr('Pausado pelo dono', 'Paused by the owner')}` : `⚡ ${tr(`Rodada ${sala.rodada + 1} já já`, `Round ${sala.rodada + 1} coming up`)}`}</span>
          <button onClick={onEscalacao} style={{ ...botao('#fff'), width: 'auto', fontSize: 12, padding: '6px 10px' }}>🧩 {tr('Escalação', 'Lineup')}</button>
        </div>
      )}
      {sala.fase === 'preparo' && !dinamica && (
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
          <button onClick={onEscalacao} style={{ ...botao('#fff'), fontSize: 14, marginBottom: 8 }}>🧩 {tr('Escalação', 'Lineup')}</button>
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
            {!dinamica && <button onClick={() => void co2Ritmo(!sala.auto, sala.velocidade, sala.pausado)} style={{ ...botao('#fff'), fontSize: 12, padding: '8px' }}>{sala.auto ? tr('Automático ligado', 'Auto on') : tr('Automático desligado', 'Auto off')}</button>}
            <button onClick={() => void co2EncerrarDia()} disabled={sala.fase !== 'preparo'} style={{ ...botao('#fff'), fontSize: 12, padding: '8px' }}>🌙 {tr('Encerrar o dia', 'End the day')}</button>
          </div>
          <Co2TemposDono />
          <p style={{ fontWeight: 800, fontSize: 11, margin: '6px 0 0', color: 'rgba(0,0,0,.55)' }}>{dinamica ? tr('⚡ Dinâmica · as rodadas seguem direto. Pausar segura a carreira pra todo mundo.', '⚡ Dynamic · rounds run back to back. Pause holds the career for everyone.') : sala.auto ? tr('Automático ligado · quem não apertar joga com a escalação que já está.', 'Auto on · whoever doesn\'t press plays with the current lineup.') : tr('Automático desligado · a rodada só começa quando você apertar.', 'Auto off · the round only starts when you press.')}</p>
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
  const m2Liberado = useMotor2Carreira() // ⚽🧠 motor novo em toda carreira (05/11)
  useEffect(() => {
    // 🛡️ 26/11: só depois do leilão (temporada NOVA na rodada 0) — o apito da 38ª também põe a sala em 'virada', e sem esta trava
    // o fim da temporada voltava pro preparo da rodada 0 da MESMA temporada
    if (!state.co2?.comanda || state.screen !== 'season' || sn.sala?.fase !== 'virada' || (state.round ?? 0) !== 0) return
    const mm = co2Agora().mundo
    const poeM2 = m2Liberado && !!mm && mm.m2 == null
    const poeFim = !!mm && !mm.fim // 🏆 26/11: a regra da copa do fim de temporada sai do DONO, igual pra todo aparelho
    const carimbo = mm && (poeM2 || poeFim) ? { ...mm, ...(poeM2 ? { m2: state.seasonNo ?? 1 } : {}), ...(poeFim ? { fim: { copaBR: copaBrasilLiberada() } } : {}) } : null
    void co2Mundo('preparo', state.seasonNo ?? 1, 0, carimbo, mm?.modo === 'dinamica' ? tempoPausa(mm) : Math.max(90, tempoRodada(mm))) // ⚡ Dinâmica: o tempo de pausa que o dono escolheu (aviso; o dono segue)
  }, [state.co2?.comanda, state.screen, sn.sala?.fase, state.seasonNo, m2Liberado, state.round])
}

// ═══ VIRADA (26/11): cada um fecha o próprio clube; o dono abre o leilão de todos ═══════════════════════════════════
/** O botão no fim da janela de contratos (no lugar do "Começar o leilão" da carreira solo). */
export function Co2FecharTemporada() {
  const { dispatch } = useEsc()
  return (
    <div>
      <button onClick={() => dispatch({ type: 'CO2_FECHA' })} style={botao(GREEN, '#fff')}>✅ {tr('Fechar minha temporada', 'Close my season')}</button>
      <p style={{ fontWeight: 700, fontSize: 11, margin: '6px 2px 0', color: 'rgba(0,0,0,.55)', textAlign: 'center', lineHeight: 1.4 }}>
        {tr('Contrato vencido sem decisão renova sozinho por 5 anos. Depois de fechar, você espera o dono abrir o leilão de todos.', 'An expired contract with no decision renews by itself for 5 years. After closing, you wait for the owner to open everyone\'s auction.')}
      </p>
    </div>
  )
}

const vazio: EntradasMundo = { tactics: {}, lineups: {}, halftime: {}, penalty: {}, mods: {}, cardMods: {} }

/** Depois de fechar: sobe o fechamento na gaveta, mostra quem já fechou e (só pro dono) o botão de abrir o leilão de todos. */
export function Co2ViradaEspera() {
  const { state, dispatch } = useEsc()
  const sn = useCo2()
  const me = state.managers[state.youIdx]
  const comanda = !!state.co2?.comanda
  const temporada = state.seasonNo ?? 1
  const [subiu, setSubiu] = useState<'indo' | 'ok' | 'erro'>('indo')
  const [fechados, setFechados] = useState<Record<number, Fechamento | undefined>>({})
  const sobe = async () => {
    const f = co2Fechamento(state)
    if (!me || !f) { setSubiu('erro'); return }
    setSubiu('indo')
    const r = await co2Gaveta({ ...minhaGaveta(me, vazio), fechamento: f } as unknown as Record<string, unknown>)
    setSubiu(r === 'ok' ? 'ok' : 'erro')
  }
  useEffect(() => { void sobe() }, []) // eslint-disable-line react-hooks/exhaustive-deps
  const le = async (): Promise<Record<number, Fechamento | undefined>> => {
    const rows = await co2LeGavetas()
    const out: Record<number, Fechamento | undefined> = {}
    for (const r of rows) { const g = r.publico as unknown as GavetaPublica | undefined; if (g && typeof g.mgrId === 'number' && g.fechamento?.temporada === temporada) out[g.mgrId] = g.fechamento }
    setFechados(out)
    return out
  }
  useEffect(() => { void le() }, [sn.clubes, subiu]) // eslint-disable-line react-hooks/exhaustive-deps
  // ⏱️ ⚡ Dinâmica (26/11, Diego: *"60 s… o relógio é aviso e o DONO avança, com confirmação antes do tempo — igual o draft"*):
  // o dono liga um relógio de 60 s na sala quando fecha o clube dele; todo mundo vê. Na 🧭 Livre não tem relógio.
  const sala = sn.sala
  const dinamica = sn.mundo?.modo === 'dinamica'
  const [agora, setAgora] = useState(() => Date.now())
  useEffect(() => { const t = setInterval(() => setAgora(Date.now()), 1000); return () => clearInterval(t) }, [])
  const relogioRef = useRef(false)
  useEffect(() => {
    if (!comanda || !dinamica || !sala || sala.fase !== 'virada' || sala.prazo || relogioRef.current) return
    relogioRef.current = true
    void co2Mundo('virada', null, null, null, tempoPausa(sn.mundo))
  }, [comanda, dinamica, sala])
  const restante = dinamica && sala?.prazo ? Math.max(0, Math.round((new Date(sala.prazo).getTime() - agora) / 1000)) : null
  const ordem = sn.mundo?.ordem ?? []
  const clubes = sn.clubes.map(c => ({ nome: c.nome, id: ordem.indexOf(c.user_id) })).filter(c => c.id >= 0)
  const faltam = clubes.filter(c => !fechados[c.id])
  const abrir = async () => {
    const f = await le()
    const fora = clubes.filter(c => !f[c.id]).map(c => c.nome)
    if (restante != null && restante > 0 && fora.length && !window.confirm(tr(`Ainda faltam ${restante} s no relógio. Abrir o leilão agora?`, `There are still ${restante} s on the clock. Open the auction now?`))) return
    if (fora.length && !window.confirm(tr(`${fora.join(', ')} ainda não fechou. Vai ficar fora do leilão e os contratos vencidos renovam sozinhos. Abrir mesmo assim?`, `${fora.join(', ')} hasn't closed yet. They'll sit out the auction and expired contracts renew by themselves. Open anyway?`))) return
    dispatch({ type: 'CO2_ABRE_VIRADA', fechamentos: f })
  }
  return (
    <div className="palco tela-cheia" style={{ background: CREAM, color: INK, padding: '20px 14px 48px' }}>
      <div style={{ maxWidth: 520, margin: '0 auto', display: 'grid', gap: 12 }}>
        <div style={{ ...caixa(INK), color: '#fff', padding: '12px 14px' }}>
          <p style={{ ...OSWALD, fontWeight: 900, fontSize: 20, margin: 0, textTransform: 'uppercase' }}>🔨 {tr(`Leilão da temporada ${temporada}`, `Season ${temporada} auction`)}</p>
          <p style={{ fontWeight: 700, fontSize: 12, margin: '4px 0 0', color: 'rgba(255,255,255,.8)' }}>{tr('Seu clube está fechado. O leilão é de todos e quem abre é o dono.', 'Your club is closed. The auction is for everyone and the owner opens it.')}</p>
        </div>
        <div style={{ ...caixa(), padding: 12 }}>
          {restante != null && <p style={{ ...OSWALD, fontWeight: 900, fontSize: 22, margin: '0 0 6px', textAlign: 'center', color: restante > 0 ? INK : '#B23B2E' }}>⏱️ {restante > 0 ? `0:${String(restante).padStart(2, '0')}` : tr('tempo esgotado', 'time is up')}</p>}
          <p style={{ ...OSWALD, fontWeight: 900, fontSize: 14, margin: '0 0 6px', textTransform: 'uppercase' }}>{tr('Quem já fechou', 'Who has closed')} · {clubes.length - faltam.length}/{clubes.length}</p>
          {clubes.map(c => (
            <p key={c.id} style={{ fontWeight: 800, fontSize: 13, margin: '3px 0' }}>{fechados[c.id] ? '✅' : '⏳'} {c.nome}</p>
          ))}
          {subiu === 'erro' && <button onClick={() => void sobe()} style={{ ...botao('#FFE1DB'), fontSize: 13, marginTop: 8 }}>⚠️ {tr('Não subiu o seu fechamento — tentar de novo', 'Your closing didn\'t upload — try again')}</button>}
        </div>
        {comanda ? (
          <div>
            <button disabled={subiu !== 'ok'} onClick={() => void abrir()} style={botao(subiu === 'ok' ? GOLD : '#eee')}>🔨 {tr('Abrir o leilão de todos', 'Open everyone\'s auction')}</button>
            <p style={{ fontWeight: 700, fontSize: 11, margin: '6px 2px 0', color: 'rgba(0,0,0,.55)', textAlign: 'center', lineHeight: 1.4 }}>
              {restante === 0 && faltam.length ? tr('O tempo acabou: o relógio só avisa, quem abre é você. ', 'Time is up: the clock only warns, you open it. ') : ''}{faltam.length ? tr('Quem não fechou fica fora do leilão: não perde o clube, e contrato vencido renova sozinho.', 'Whoever hasn\'t closed sits out the auction: they keep the club, and expired contracts renew by themselves.') : tr('Todo mundo fechou.', 'Everyone has closed.')}
            </p>
          </div>
        ) : (
          <div style={{ ...caixa('#EAF3FF'), padding: 12, textAlign: 'center' }}>
            <p style={{ fontWeight: 800, fontSize: 12.5, margin: 0, color: '#3a5a8a' }}>⏳ {tr('Esperando o dono abrir o leilão de todos. O leilão aparece aqui sozinho.', 'Waiting for the owner to open everyone\'s auction. It shows up here by itself.')}</p>
          </div>
        )}
      </div>
    </div>
  )
}

// 🎬 ANÚNCIO DE CINEMA (26/11, Diego escolheu a opção C): na ⚡ Dinâmica, quando começa competição nova a carreira para pra todo
// mundo mexer no time. Troféu + nome, os clubes da turma (o seu em dourado), relógio grande, Escalação/Tática. O relógio é AVISO:
// quem segue é o dono (pergunta se for antes do tempo). Hoje: a estreia de cada temporada (a liga).
const NOME_DIV: Record<string, [string, string]> = { A: ['SÉRIE A', 'SERIE A'], B: ['SÉRIE B', 'SERIE B'], C: ['SÉRIE C', 'SERIE C'], D: ['SÉRIE D', 'SERIE D'], V: ['VÁRZEA', 'AMATEUR LEAGUE'] }
export function Co2Anuncio({ restante, comanda, onSeguir }: { restante: number | null; comanda: boolean; onSeguir: () => void }) {
  const { state } = useEsc()
  // 27/11 (Diego: *"algo simples… pro cara ficar livre p usar as abas dele"*): o anúncio aparece UMA vez e fecha no ✕ (não volta —
  // regra dos avisos); depois fica só a faixa fininha com o relógio. Mexer no time é pelas abas de sempre.
  const chave = `co2-anuncio:${state.co2?.sala ?? ''}:${state.seasonNo ?? 1}`
  const [fechado, setFechado] = useState(() => avisoFechado(chave))
  const meuId = state.managers[state.youIdx]?.id
  const divDe = (id: number) => state.careerPlacements?.[`m${id}`] ?? 'V'
  const minhaDiv = meuId != null ? divDe(meuId) : 'V'
  const gente = state.managers.filter(m => m.isHuman).sort((a, b) => (a.id === meuId ? -1 : b.id === meuId ? 1 : 'ABCDV'.indexOf(divDe(a.id)) - 'ABCDV'.indexOf(divDe(b.id))))
  const [pt, en] = NOME_DIV[minhaDiv] ?? NOME_DIV.V
  const mm = restante != null ? `${Math.floor(restante / 60)}:${String(restante % 60).padStart(2, '0')}` : '–'
  const seguir = () => {
    if (restante != null && restante > 0 && !window.confirm(tr(`Ainda faltam ${restante} s pra turma mexer no time. Começar agora?`, `There are still ${restante} s for everyone to tweak their team. Start now?`))) return
    onSeguir()
  }
  const botaoDono = comanda && <button onClick={seguir} style={{ ...botao(GOLD), fontSize: 14, padding: '9px 10px' }}>▶️ {tr('Começar a temporada pra todos', 'Start the season for everyone')}</button>
  if (fechado) return (
    <div style={{ ...caixa(INK), color: '#fff', padding: '9px 12px', display: 'grid', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ ...OSWALD, fontWeight: 900, fontSize: 20, color: GOLD, minWidth: 52 }}>{mm}</span>
        <span style={{ ...OSWALD, fontWeight: 900, fontSize: 13.5, flex: 1, textTransform: 'uppercase' }}>🏆 {tr(`Começa a ${pt}`, `${en} kicks off`)} <span style={{ fontWeight: 700, color: 'rgba(255,255,255,.65)', textTransform: 'none', fontSize: 11.5 }}>· {comanda ? tr('você começa quando quiser', 'you start whenever you want') : tr('o dono começa', 'the owner starts it')}</span></span>
      </div>
      {botaoDono}
    </div>
  )
  return (
    <div style={{ position: 'relative', background: 'radial-gradient(ellipse at top, #2C7A45 0%, #14482A 55%, #0C2A18 100%)', border: `4px solid ${INK}`, borderRadius: 22, boxShadow: `5px 5px 0 ${INK}`, padding: '18px 14px 16px', color: '#fff', textAlign: 'center' }}>
      <button aria-label={tr('Fechar', 'Close')} onClick={() => { fechaAviso(chave); setFechado(true) }} style={{ position: 'absolute', top: 8, right: 10, width: 34, height: 34, borderRadius: 999, border: `2.5px solid ${INK}`, background: '#fff', color: INK, fontWeight: 900, fontSize: 16, cursor: 'pointer' }}>✕</button>
      <div style={{ fontSize: 46, lineHeight: 1 }}>🏆</div>
      <p style={{ ...OSWALD, fontWeight: 900, fontSize: 13, letterSpacing: 2, margin: '8px 0 0', color: 'rgba(255,255,255,.75)' }}>{tr(`COMEÇA A TEMPORADA ${state.seasonNo ?? 1}`, `SEASON ${state.seasonNo ?? 1} KICKS OFF`)}</p>
      <p style={{ ...OSWALD, fontWeight: 900, fontSize: 38, margin: '0 0 2px', color: GOLD, lineHeight: 1.05, textTransform: 'uppercase' }}>{tr(pt, en)}</p>
      <p style={{ fontWeight: 800, fontSize: 12.5, margin: '0 0 12px', color: 'rgba(255,255,255,.8)' }}>{tr('os clubes da turma', 'the crew\'s clubs')}</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(96px, 1fr))', gap: 8, marginBottom: 14 }}>
        {gente.map(m => {
          const eu = m.id === meuId
          return (
            <div key={m.id} style={{ border: `2.5px solid ${eu ? GOLD : 'rgba(255,255,255,.35)'}`, background: eu ? 'rgba(255,196,0,.22)' : 'rgba(255,255,255,.08)', borderRadius: 12, padding: '8px 4px' }}>
              <div style={{ fontSize: 22 }}>🛡️</div>
              <div style={{ fontWeight: 900, fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.teamName}</div>
              <div style={{ ...OSWALD, fontWeight: 800, fontSize: 10.5, color: 'rgba(255,255,255,.7)' }}>{tr(...(NOME_DIV[divDe(m.id)] ?? NOME_DIV.V))}</div>
            </div>
          )
        })}
      </div>
      <div style={{ display: 'inline-block', background: '#fff', color: INK, border: `3px solid ${INK}`, borderRadius: 14, boxShadow: `3px 3px 0 ${GOLD}`, padding: '4px 18px', ...OSWALD, fontWeight: 900, fontSize: 34 }}>{mm}</div>
      <p style={{ fontWeight: 800, fontSize: 12.5, margin: '10px 0 12px', color: 'rgba(255,255,255,.85)' }}>{tr('Dá tempo de arrumar o time nas abas. ', 'There\'s time to sort your team in the tabs. ')}{comanda ? tr('Você começa a temporada quando quiser.', 'You start the season whenever you want.') : tr('Quem começa é o dono.', 'The owner starts it.')}</p>
      {botaoDono}
    </div>
  )
}

// ⏱️ 27/11 (Diego: *"coloque também nas configurações do host p ele escolher os tempos"*)
export function Co2Tempos({ valor, onMuda }: { valor: { pausa: number; rodada: number }; onMuda: (v: { pausa: number; rodada: number }) => void }) {
  const linha = (titulo: string, sub: string, k: 'pausa' | 'rodada') => (
    <div style={{ marginBottom: 8 }}>
      <p style={{ ...OSWALD, fontWeight: 900, fontSize: 12.5, margin: '0 0 4px', textTransform: 'uppercase' }}>{titulo}</p>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${TEMPOS_OPCOES.length}, 1fr)`, gap: 5 }}>
        {TEMPOS_OPCOES.map(n => (
          <button key={n} onClick={() => onMuda({ ...valor, [k]: n })} style={{ border: `2.5px solid ${INK}`, borderRadius: 10, padding: '5px 0', fontWeight: 900, fontSize: 13, background: valor[k] === n ? GOLD : '#fff', color: INK, cursor: 'pointer', boxShadow: valor[k] === n ? `2px 2px 0 ${INK}` : 'none', ...OSWALD }}>{n < 60 ? `${n}s` : n % 60 ? `${Math.floor(n / 60)}:${n % 60}` : `${n / 60} min`}</button>
        ))}
      </div>
      <p style={{ fontWeight: 700, fontSize: 10.5, margin: '3px 0 0', color: 'rgba(0,0,0,.55)' }}>{sub}</p>
    </div>
  )
  return (
    <div style={{ border: `3px solid ${INK}`, borderRadius: 14, padding: '8px 10px 2px', background: '#fff' }}>
      <p style={{ ...OSWALD, fontWeight: 900, fontSize: 13, margin: '0 0 6px', textTransform: 'uppercase' }}>⏱️ {tr('Tempos', 'Timers')}</p>
      {linha(tr('Pausas', 'Breaks'), tr('Anúncio de competição nova e espera do leilão. É aviso: quem segue é o dono.', 'New competition and auction wait. Just a warning: the owner moves on.'), 'pausa')}
      {linha(tr('Rodada (modo Livre)', 'Round (Free mode)'), tr('Quanto cada rodada espera todo mundo apertar PRONTO.', 'How long each round waits for everyone to hit READY.'), 'rodada')}
    </div>
  )
}

/** O mesmo controle, dentro da carreira, pro dono mudar depois (vale da próxima pausa/rodada em diante). */
function Co2TemposDono() {
  const sn = useCo2()
  const [aberto, setAberto] = useState(false)
  const [msg, setMsg] = useState('')
  const sala = sn.sala, mundo = sn.mundo
  if (!sala || !mundo) return null
  const atual = { pausa: tempoPausa(mundo), rodada: tempoRodada(mundo) }
  // só grava fora do jogo rolando (gravar o mundo reinicia o relógio da fase); o relógio que está correndo continua igual
  const podeMudar = sala.fase === 'preparo' || sala.fase === 'virada'
  const muda = async (v: { pausa: number; rodada: number }) => {
    if (!podeMudar) { setMsg(tr('Espere a rodada acabar pra mudar.', 'Wait for the round to end to change it.')); return }
    const restante = sala.prazo ? Math.max(15, Math.round((new Date(sala.prazo).getTime() - Date.now()) / 1000)) : null
    const r = await co2Mundo(sala.fase as 'preparo' | 'virada', null, null, { ...(mundo as Co2Mundo), tempos: v }, restante)
    setMsg(r === 'ok' ? tr('✅ Salvo. Vale da próxima vez.', '✅ Saved. Applies next time.') : tr('Não deu agora. Tenta de novo.', 'Didn\'t work. Try again.'))
  }
  return (
    <div style={{ marginTop: 8 }}>
      <button onClick={() => setAberto(a => !a)} style={{ ...botao('#fff'), fontSize: 12, padding: '8px' }}>⚙️ {tr('Tempos', 'Timers')} · {atual.pausa}s / {atual.rodada}s</button>
      {aberto && <div style={{ marginTop: 8 }}><Co2Tempos valor={atual} onMuda={v => void muda(v)} />{msg && <p style={{ fontWeight: 800, fontSize: 11, margin: '4px 0 0' }}>{msg}</p>}</div>}
    </div>
  )
}

// ═══ 🌍 COPA DO MUNDO ÚNICA (27/11, regra principal do Diego: *"tudo é único… não existe dois campeões"*) ════════════════
// Convite pela regra: o ranking de clubes dá a ordem; quem está mais alto escolhe primeiro (da posição dele pra baixo) e a
// seleção escolhida sai da lista dos de baixo. Quando todos os convidados decidiram, a MESMA Copa roda em todo aparelho.
export function Co2CopaMundo({ top, seasonNo, seed, motor2, onPrize, onCard, onArtilheiro, onStats, onMural, agenciaOn }: {
  top: Co2CopaVaga[]; seasonNo: number; seed: number; motor2: boolean
  onPrize?: (coins: number) => void
  onCard?: (card: { name: string; club: string; year: number; pos: string; fame: number; folk?: boolean; promessa?: boolean }, key: string) => void
  onArtilheiro?: (nome: string, gols: number, meu?: boolean) => void
  onStats?: (linhas: CMStatCarta[]) => void
  onMural?: (entries: { season: number; selecao: string; campeao: string; voce: boolean }[]) => void
  agenciaOn?: boolean
}) {
  const { state, dispatch } = useEsc()
  const sn = useCo2()
  const meuId = state.managers[state.youIdx]?.id ?? null
  const comanda = !!state.co2?.comanda
  const [aberto, setAberto] = useState<null | 'convite' | 'convoca' | 'copa'>(null)
  const [paisEscolhido, setPaisEscolhido] = useState<string | null>(null)
  const ehAnoDeCopa = (seasonNo - 1) % 4 === 0
  const paises = useMemo(() => rankingSelecoes().slice(0, 32).map(p => p.pais), [])
  const escolhas = useMemo(() => {
    const out: Record<number, Co2CopaEscolha | undefined> = {}
    for (const g of state.co2?.gavetas ?? []) if (g.copaMundo) out[g.mgrId] = g.copaMundo
    if (meuId != null && state.co2?.minhaCopa) out[meuId] = state.co2.minhaCopa
    return out
  }, [state.co2?.gavetas, state.co2?.minhaCopa, meuId])
  const pula = sn.mundo?.copaPula?.season === seasonNo ? sn.mundo.copaPula.ids : []
  const vez = vezDaCopa(top, escolhas, pula, seasonNo)
  const nomeDe = (id: number) => top.find(v => v.mgrId === id)?.name ?? '?'
  const convidado = meuId != null && top.some(v => v.mgrId === meuId)
  const entrants = useMemo(() => (vez === null ? entrantsDaCopa(top, paises, escolhas, seasonNo, meuId) : null), [vez, top, paises, escolhas, seasonNo, meuId])
  // 🏆 o dono carimba o campeão no mundo (é o que entra no ranking de clubes, igual em todo aparelho)
  useEffect(() => {
    if (!comanda || !entrants || !sn.mundo || (sn.mundo.copaHist ?? []).some(h => h.season === seasonNo)) return
    const w = simulaCopaMundo(entrants, seed, seasonNo, true, true, motor2)
    const c = entrants[w.final.champion]
    if (c) void co2Mundo('virada', null, null, { ...sn.mundo, copaHist: [...(sn.mundo.copaHist ?? []), { season: seasonNo, campeao: c.club, pais: c.pais }] })
  }, [comanda, entrants, sn.mundo, seasonNo, seed, motor2])
  if (!ehAnoDeCopa) return null
  const pular = (id: number) => {
    if (!sn.mundo || !window.confirm(tr(`Pular ${nomeDe(id)}? Ele fica fora desta Copa do Mundo e o próximo escolhe.`, `Skip ${nomeDe(id)}? They sit out this World Cup and the next one picks.`))) return
    void co2Mundo('virada', null, null, { ...sn.mundo, copaPula: { season: seasonNo, ids: [...new Set([...pula, id])] } })
  }
  const minha = meuId != null ? escolhas[meuId] : undefined
  const ordem = ordemDeEscolha(top)
  const save: CopaSave = loadCopaSave(seed) ?? { anchor: 1, ciclo: 4, calendario: 2, mural: [], played: [] }
  return (
    <div style={{ ...caixa('#FFF8DC'), padding: 12, marginBottom: 10 }}>
      <p style={{ ...OSWALD, fontWeight: 900, fontSize: 15, margin: '0 0 6px', textTransform: 'uppercase' }}>🌍 {tr(`Copa do Mundo · temporada ${seasonNo}`, `World Cup · season ${seasonNo}`)}</p>
      {ordem.length > 0 && (
        <div style={{ display: 'grid', gap: 3, marginBottom: 8 }}>
          {ordem.map(id => {
            const e = escolhas[id]
            const st = pula.includes(id) ? tr('pulado', 'skipped') : e?.season === seasonNo ? (e.pais ? `${e.pais}` : tr('recusou', 'declined')) : id === vez ? tr('escolhendo…', 'picking…') : tr('espera a vez', 'waits')
            return (
              <div key={id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800, fontSize: 12.5 }}>
                <span style={{ ...OSWALD, fontWeight: 900, minWidth: 30 }}>{top.findIndex(v => v.mgrId === id) + 1}º</span>
                <span style={{ flex: 1, fontWeight: id === meuId ? 900 : 800 }}>{nomeDe(id)}</span>
                <span style={{ color: id === vez ? '#B8892B' : 'rgba(0,0,0,.6)' }}>{st}</span>
                {comanda && id === vez && id !== meuId && <button onClick={() => pular(id)} style={{ ...botao('#fff'), width: 'auto', fontSize: 11, padding: '3px 8px', boxShadow: 'none' }}>{tr('Pular', 'Skip')}</button>}
              </div>
            )
          })}
        </div>
      )}
      {vez === null ? (
        <button onClick={() => setAberto('copa')} style={botao(GOLD)}>🌍 {tr('Ver a Copa do Mundo', 'Watch the World Cup')}</button>
      ) : vez === meuId ? (
        <button onClick={() => setAberto('convite')} style={botao(GOLD)}>✉️ {tr('Sua vez: ver os convites', 'Your turn: see the invitations')}</button>
      ) : (
        <p style={{ fontWeight: 800, fontSize: 12, margin: 0, color: 'rgba(0,0,0,.65)' }}>{!convidado ? tr('Seu clube não está entre os 32 do ranking desta vez. A Copa começa quando os convidados decidirem.', 'Your club is not in the ranking top 32 this time. The Cup starts once the invited decide.') : minha?.season === seasonNo ? tr('Você já decidiu. A Copa começa quando todos os convidados decidirem.', 'You have decided. The Cup starts once everyone invited decides.') : tr(`Vez de ${nomeDe(vez)} escolher. A seleção que ele levar sai da sua lista.`, `${nomeDe(vez)} is picking. The team they take leaves your list.`)}</p>
      )}
      {aberto === 'convite' && meuId != null && (
        <CMModal>
          <p style={{ ...OSWALD, fontWeight: 900, fontSize: 19, margin: 0, textAlign: 'center', textTransform: 'uppercase' }}>✉️ {tr('Convites de seleções', 'National team invitations')}</p>
          <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(0,0,0,.6)', textAlign: 'center', margin: '4px 0 10px' }}>{tr('Pela posição do seu clube no ranking. Seleção que um amigo já levou não aparece.', 'By your club\'s ranking position. Teams a friend already took don\'t show up.')}</p>
          {convitesDaCopa(top, paises, meuId, escolhas, seasonNo).map(p => (
            <button key={p} onClick={() => { setPaisEscolhido(p); setAberto('convoca') }} style={{ ...botao('#fff'), textAlign: 'left', fontSize: 14, marginBottom: 6, boxShadow: `2px 2px 0 ${INK}` }}>{p} 👉</button>
          ))}
          <button onClick={() => { dispatch({ type: 'CO2_COPA_ESCOLHA', escolha: { season: seasonNo, pais: null } }); onStats?.([]); setAberto(null) }} style={{ ...botao('#fff'), fontSize: 13, marginTop: 4 }}>{tr('Recusar os convites', 'Decline the invitations')}</button>
          <p style={{ textAlign: 'center', marginTop: 8 }}><button onClick={() => setAberto(null)} style={{ background: 'none', border: 'none', fontSize: 11, fontWeight: 900, textDecoration: 'underline', cursor: 'pointer' }}>{tr('Fechar', 'Close')}</button></p>
        </CMModal>
      )}
      {aberto === 'convoca' && paisEscolhido && (
        <CMModal>
          <ConvocacaoScreen pais={paisEscolhido} onBack={() => setAberto('convite')} onDone={(xi, f) => {
            dispatch({ type: 'CO2_COPA_ESCOLHA', escolha: { season: seasonNo, pais: paisEscolhido, xiKeys: xi.map(c => `${c.name}|${c.club}|${c.year}`), form: f } })
            setAberto(null)
          }} />
        </CMModal>
      )}
      {aberto === 'copa' && entrants && (
        <CMModal wide cinematic>
          <CupScreen entrants={entrants} seasonNo={seasonNo} seed={seed} save={save} potes forte m2={motor2} myForm={(minha?.form ?? '4-3-3') as Formation}
            onPrize={onPrize} onCard={onCard} onArtilheiro={onArtilheiro} onStats={onStats} onMural={onMural} agenciaOn={agenciaOn} onClose={() => setAberto(null)} />
        </CMModal>
      )}
    </div>
  )
}

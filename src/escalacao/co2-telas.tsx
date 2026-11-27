// 🌐 CARREIRA ONLINE v2 (19/10) — as TELAS: entrada (criar/entrar/minhas), sala de espera e a barra do PRONTO.
// Mockups aprovados pelo Diego: `scripts/mockups/carreira-online-espera.png` e `carreira-online-pronto.png`.
// Só nas contas dele por enquanto (`useCarreiraOnline2`). Nada aqui encosta nas salas rápidas/Minhas Ligas.
import { useEffect, useMemo, useRef, useState } from 'react'
import { tr } from './lang'
import { useEsc, co2LeLocal, co2LeLocalInfo } from './store'
import { unpack } from './netpack'
import type { EscState } from './types'
import {
  useCo2, co2Abrir, co2Fechar, co2Criar, co2Entrar, co2MinhasSalas, co2Continuar, co2Mundo, co2Envia, co2PodeCriar,
  co2PuxaSinais,co2PodeEscrever,co2VerificaAparelho,co2LeGavetasConferidas, co2Contexto, co2ProtocoloJogo, co2JogoAtivo, co2Gaveta, co2Pronto, co2Comecar, co2Apito, co2Ritmo, co2EncerrarDia, co2LePrivado, co2Agora,
  type Co2Sala, type Co2Mundo, TEMPOS_OPCOES, tempoPausa, tempoRodada,
  co2Pedidos, co2PedidoDecide, co2PedidoEntra, co2MeusPedidos, co2LeVirada, type Co2Pedido,
  co2Sair, co2Saidas, co2SaidaAplicada, type Co2Saida,
} from './co2'
import { liveFormations } from './career-live-plan'
import { useCo2Envio } from './co2-envio'
import { Co2Tentativas, co2CopiaRecente } from './co2-sincronia'
import { co2RetornoAtrasado,minhaGaveta, co2Fechamento, vagasDeNovos, type EntradasMundo, type GavetaPublica, type Fechamento } from './carreira-online-v2'
import { useMotor2Carreira, copaBrasilLiberada, internacionalCarreiraLiberada } from './sport'
import { avisoFechado, fechaAviso } from './avisos-fechados'
import { CMModal, ConvocacaoScreen, CupScreen, simulaCopaMundo, loadCopaSave, bandeiraDe, countryPool, bestXI, formationFits, xiStrength, type CopaSave, type Formation, type CMStatCarta } from './copa-mundo'
/** força da seleção = média do melhor XI dela no baralho (só ORDENA os convites; o número não aparece, Diego 27/11) */
const forcaSelecao = (pais: string) => { const pool = countryPool(pais); return Math.round(xiStrength(bestXI(pool, formationFits(pool, '4-3-3') ? '4-3-3' : '4-4-2'))) }
import { rankingSelecoes } from './paises'
import { vezDaCopa, convitesDaCopa, entrantsDaCopa, ordemDeEscolha, selecoesTomadas, decidiuCopa, escolhaCopaAuto, COPA_PRAZO_ESCOLHA_S, COPA_PRAZO_CONVOCA_S, type Co2CopaVaga, type Co2CopaEscolha } from './co2-copa-mundo'

const INK = '#0C0C0C', GOLD = '#FFC400', GREEN = '#1B7A3D', CREAM = '#F4ECD6'
const OSWALD = { fontFamily: 'Oswald, sans-serif' } as const
const caixa = (bg = '#fff'): React.CSSProperties => ({ background: bg, color: INK, border: `3px solid ${INK}`, borderRadius: 18, boxShadow: `4px 4px 0 ${INK}` }) // cor explícita: o tema da página é creme
const botao = (bg: string, cor = INK): React.CSSProperties => ({ width: '100%', background: bg, color: cor, border: `3px solid ${INK}`, borderRadius: 14, boxShadow: `4px 4px 0 ${INK}`, padding: '13px 10px', fontWeight: 900, fontSize: 17, textTransform: 'uppercase', cursor: 'pointer', ...OSWALD })

// ═══ ENTRADA (no menu online) ═══════════════════════════════════════════════════════════════════════════════════════
export function Co2Painel({ nomeClube, onAbre, semCriar }: { nomeClube: string; /** 27/11: abre a sala de espera como PÁGINA (lobby), em vez de dentro do painel */ onAbre?: (id: string) => void; /** 27/11: criar mora nos blocos de "Criar sala" */ semCriar?: boolean }) {
  const [salas, setSalas] = useState<(Co2Sala & { assento: number; meuClube: string })[] | null>(null)
  const [podeCriar, setPodeCriar] = useState(false)
  const [nome, setNome] = useState('')
  const [clube, setClube] = useState(nomeClube)
  const [codigo, setCodigo] = useState('')
  const [erro, setErro] = useState('')
  const [aberta, setAberta] = useState<string | null>(null)
  const [pedidos, setPedidos] = useState<{ sala: string; nome: string; status: string; carreira: string }[]>([])
  const [aviso, setAviso] = useState('')
  const [uma, setUma] = useState<{ sala: string; nome: string } | null>(null) // 🚪 sem plano, já está noutra carreira
  const [saindo, setSaindo] = useState(false)
  const recarrega = () => { void co2MinhasSalas().then(setSalas); void co2MeusPedidos().then(setPedidos) }
  useEffect(() => { recarrega(); void co2PodeCriar().then(setPodeCriar) }, [])
  // 🚪 27/11 (Diego): sem plano só dá pra estar em UMA carreira — sai da outra (o clube fica pra máquina) e já entra nesta
  const saiDaOutraEEntra = async () => {
    if (!uma || saindo) return
    if (!window.confirm(tr(`Sair da carreira "${uma.nome}"? O seu clube de lá vira da máquina, com todos os jogadores, e você não volta mais pra ela.`, `Leave the career "${uma.nome}"? Your club there becomes a computer club, with all its players, and you won't go back to it.`))) return
    setSaindo(true)
    const r = await co2Sair(uma.sala)
    setSaindo(false)
    if (r === 'dono') { setErro(tr('Você é o dono daquela carreira: o dono não sai dela.', 'You own that career: the owner can\'t leave it.')); setUma(null); return }
    if (r !== 'ok' && r !== 'nao_membro') { setErro(tr('Não deu pra sair agora. Tenta de novo.', 'Could not leave right now. Try again.')); return }
    setUma(null); recarrega(); void entrar()
  }
  const criar = async () => {
    setErro('')
    const r = await co2Criar(nome.trim() || tr('Carreira dos amigos', 'Friends career'), clube.trim())
    if (r.erro || !r.id) { setErro(r.erro === 'nome' ? tr('Nome do clube com pelo menos 2 letras.', 'Club name needs at least 2 letters.') : tr('Não deu pra criar agora.', 'Could not create right now.')); return }
    setAberta(r.id); recarrega()
  }
  const entrar = async () => {
    setErro('')
    setAviso('')
    setUma(null)
    const r = await co2Entrar(codigo.trim(), clube.trim())
    if (r.erro === 'uma' && r.outra_sala) { setUma({ sala: r.outra_sala, nome: r.outra_nome ?? '—' }); return }
    // 🙋 27/11: carreira já começada = pedido pro dono (só com plano); entra na virada da temporada
    if (r.pedido) { setAviso(tr('✉️ Pedido enviado! A carreira já começou: quando o dono aceitar, você entra na virada da temporada, com o nome e o escudo do seu clube, no lugar de um clube da máquina da Série D (fica com os jogadores, o valor e o caixa dele).', '✉️ Request sent! The career has already started: once the owner accepts, you join at the season turnover, with your club\'s name and crest, taking a computer club\'s place in Série D (keeping its players, value and cash).')); recarrega(); return }
    if (r.erro === 'plano') { setErro(tr('Essa carreira já começou: entrar agora é só pra quem tem plano (qualquer plano). Antes de começar, entra todo mundo de graça.', 'This career has already started: joining now is only for players with a plan (any plan). Before it starts, everyone joins for free.')); return }
    if (r.erro || !r.id) {
      setErro(r.erro === 'nao_achou' ? tr('Código não encontrado.', 'Code not found.') : r.erro === 'comecou' ? tr('Essa carreira já começou — só entra quem já é dela.', 'This career already started — only its members can enter.') : r.erro === 'cheia' ? tr('Sala cheia (20 clubes).', 'Room full (20 clubs).') : r.erro === 'nome' ? tr('Nome do clube com pelo menos 2 letras.', 'Club name needs at least 2 letters.') : tr('Não deu pra entrar agora.', 'Could not join right now.'))
      return
    }
    setAberta(r.id); recarrega()
  }
  useEffect(() => { if (aberta && onAbre) { onAbre(aberta); setAberta(null) } }, [aberta, onAbre])
  if (aberta && !onAbre) return <Co2Espera salaId={aberta} onSair={() => { co2Fechar(); setAberta(null); recarrega() }} />
  const campo: React.CSSProperties = { width: '100%', border: `2.5px solid ${INK}`, borderRadius: 10, padding: '9px 10px', fontWeight: 800, fontSize: 14, background: '#fff', color: INK }
  return (
    <div style={{ ...caixa('#E7F0FF'), padding: 12 }}>
      {!semCriar && <><p style={{ ...OSWALD, fontWeight: 900, fontSize: 15, margin: '0 0 2px', color: '#1E3A8A' }}>🌐 {tr('CARREIRA ONLINE (nova) · em teste', 'ONLINE CAREER (new) · testing')}</p>
      <p style={{ fontWeight: 700, fontSize: 11, margin: '0 0 8px', color: 'rgba(0,0,0,.6)' }}>{tr('A carreira de sempre, com os amigos. Tudo salvo sozinho na nuvem do jogo.', 'The usual career, with friends. Everything saves by itself in the game cloud.')}</p></>}
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
      {podeCriar && !semCriar && (
        <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
          <input style={campo} value={nome} onChange={e => setNome(e.target.value.slice(0, 40))} placeholder={tr('Nome da carreira', 'Career name')} />
          <button onClick={() => void criar()} style={{ ...botao(GOLD), width: 'auto', fontSize: 13, padding: '8px 12px', boxShadow: `2px 2px 0 ${INK}` }}>{tr('Criar', 'Create')}</button>
        </div>
      )}
      <div style={{ display: 'flex', gap: 6 }}>
        <input style={campo} value={codigo} onChange={e => setCodigo(e.target.value.toUpperCase().slice(0, 6))} placeholder={tr('Código da carreira', 'Career code')} />
        <button onClick={() => void entrar()} style={{ ...botao('#fff'), width: 'auto', fontSize: 13, padding: '8px 12px', boxShadow: `2px 2px 0 ${INK}` }}>{tr('Entrar', 'Join')}</button>
      </div>
      <details style={{ marginTop: 6 }}>
        <summary style={{ fontWeight: 800, fontSize: 11.5, cursor: 'pointer', color: '#1E3A8A' }}>{tr('ℹ️ Como funciona entrar', 'ℹ️ How joining works')}</summary>
        <ul style={{ fontWeight: 700, fontSize: 11, margin: '4px 0 0', paddingLeft: 18, color: 'rgba(0,0,0,.7)', lineHeight: 1.45 }}>
          <li>{tr('Criar uma carreira online é só pra quem tem plano.', 'Creating an online career is only for players with a plan.')}</li>
          <li>{tr('Antes de começar, entra todo mundo de graça. Sem plano você participa de UMA carreira por vez.', 'Before it starts, everyone joins for free. Without a plan you take part in ONE career at a time.')}</li>
          <li>{tr('Carreira já começada: só com plano. O dono aceita o pedido e você entra na virada da temporada, com o nome e o escudo do seu clube, no lugar de um clube da máquina da Série D — fica com os jogadores, o valor e o caixa dele.', 'Career already started: plan only. The owner accepts your request and you join at the season turnover, with your club\'s name and crest, taking a computer club\'s place in Série D — keeping its players, value and cash.')}</li>
          <li>{tr('Quem sai de uma carreira não volta pra ela: o clube vira da máquina, com todos os jogadores.', 'Whoever leaves a career can\'t go back: the club becomes a computer club, with all its players.')}</li>
        </ul>
      </details>
      {uma && (
        <div style={{ ...caixa('#FFF4D6'), padding: 10, marginTop: 8 }}>
          <p style={{ ...OSWALD, fontWeight: 900, fontSize: 14, margin: '0 0 4px', textTransform: 'uppercase' }}>🚪 {tr('Uma carreira por vez', 'One career at a time')}</p>
          <p style={{ fontWeight: 700, fontSize: 11.5, margin: '0 0 8px', color: 'rgba(0,0,0,.7)' }}>{tr(`Sem plano você só participa de uma carreira online. Você já está na "${uma.nome}". Pra entrar nesta, saia daquela: o seu clube de lá vira da máquina, com todos os jogadores.`, `Without a plan you can only be in one online career. You're already in "${uma.nome}". To join this one, leave that one: your club there becomes a computer club, with all its players.`)}</p>
          <button disabled={saindo} onClick={() => void saiDaOutraEEntra()} style={{ ...botao('#FFE1DB'), fontSize: 13, padding: '9px 10px' }}>🚪 {tr(`Sair da "${uma.nome}" e entrar`, `Leave "${uma.nome}" and join`)}</button>
          <p style={{ fontWeight: 700, fontSize: 11, margin: '6px 0 0', color: 'rgba(0,0,0,.6)' }}>{tr('Com qualquer plano você participa de quantas quiser.', 'With any plan you can join as many as you like.')}</p>
        </div>
      )}
      {erro && <p style={{ fontWeight: 800, fontSize: 11.5, color: '#B23B2E', margin: '6px 0 0' }}>{erro}</p>}
      {aviso && <p style={{ fontWeight: 800, fontSize: 11.5, color: GREEN, margin: '6px 0 0' }}>{aviso}</p>}
      {pedidos.map(p => (
        <p key={p.sala} style={{ fontWeight: 700, fontSize: 11.5, margin: '6px 0 0', color: 'rgba(0,0,0,.65)' }}>
          ✉️ {p.carreira} · {p.nome}: {p.status === 'aceito' ? tr('aceito! Você entra na virada da temporada.', 'accepted! You join at the season turnover.') : p.status === 'recusado' ? tr('o dono recusou.', 'the owner declined.') : tr('esperando o dono.', 'waiting for the owner.')}
        </p>
      ))}
    </div>
  )
}

// 🙋 27/11 (Diego 26/11: *"depois, só com plano + convite aceito… igual Liga Draft"*): o dono vê quem pediu pra entrar e escolhe o
// clube da máquina que a pessoa assume. Ela entra na VIRADA da temporada (nunca no meio), com o elenco que o clube tinha.
export function Co2PedidosDono() {
  const { state } = useEsc()
  const sn = useCo2()
  const [lista, setLista] = useState<Co2Pedido[]>([])
  const [msg, setMsg] = useState('')
  const recarrega = () => { void co2Pedidos().then(setLista) }
  useEffect(() => { recarrega(); const t = setInterval(recarrega, 60000); return () => clearInterval(t) }, [sn.sala?.id])
  if (!state.co2?.comanda || !lista.length) return null
  const decide = async (p: Co2Pedido, aceita: boolean) => {
    setMsg('')
    const r = await co2PedidoDecide(p.user_id, aceita ? -1 : null)
    if (r !== 'ok') setMsg(tr('Não deu agora. Tenta de novo.', 'Didn\'t work. Try again.'))
    recarrega()
  }
  return (
    <div style={{ ...caixa('#EAF3FF'), padding: 12 }}>
      <p style={{ ...OSWALD, fontWeight: 900, fontSize: 14, margin: '0 0 4px', textTransform: 'uppercase' }}>🙋 {tr('Pedidos pra entrar', 'Requests to join')}</p>
      <p style={{ fontWeight: 700, fontSize: 11, margin: '0 0 8px', color: 'rgba(0,0,0,.6)' }}>{tr('Aceitou, ele entra na virada da temporada com o nome e o escudo dele, no lugar de um clube da máquina da Série D (fica com os jogadores, o valor e o caixa desse clube).', 'Once accepted, they join at the season turnover with their own name and crest, taking a computer club\'s place in Série D (keeping that club\'s players, value and cash).')}</p>
      {lista.map(p => (
        <div key={p.user_id} style={{ display: 'flex', alignItems: 'center', gap: 8, borderTop: '1px solid rgba(0,0,0,.12)', padding: '8px 0' }}>
          <span style={{ fontWeight: 900, fontSize: 13.5, flex: 1 }}>{p.nome}{p.status === 'aceito' ? ` · ✅ ${tr('entra na virada', 'joins at the turnover')}` : ''}</span>
          {p.status === 'pedido' && <>
            <button onClick={() => void decide(p, true)} style={{ ...botao(GREEN, '#fff'), width: 'auto', fontSize: 12.5, padding: '6px 10px' }}>✅ {tr('Aceitar', 'Accept')}</button>
            <button onClick={() => { if (window.confirm(tr(`Recusar o pedido de ${p.nome}?`, `Decline ${p.nome}'s request?`))) void decide(p, false) }} style={{ ...botao('#fff'), width: 'auto', fontSize: 12.5, padding: '6px 10px' }}>{tr('Recusar', 'Decline')}</button>
          </>}
        </div>
      ))}
      {msg && <p style={{ fontWeight: 800, fontSize: 11.5, color: '#B23B2E', margin: '4px 0 0' }}>{msg}</p>}
    </div>
  )
}

// ═══ 🌐 CRIAR CARREIRA no padrão de "Criar sala" (27/11, Diego: *"padrão de criação de sala igual as outras… igual liga draft… e com
// regras da carreira lá na sala"*). Os blocos numerados vêm do lobby (`Secao` = o mesmo `Section` das salas); a configuração do dono
// (bots, jeito, tempos) fica guardada no aparelho dele até ele começar a carreira (uma chave só, sem acumular).
export type Co2Cfg = { bots: number; modo: 'dinamica' | 'livre'; tempos: { pausa: number; rodada: number }; /** 🃏 27/11: só Brasil ou Brasil + Europa + Mundo */ baralho?: 'br' | 'todos' }
const CO2_CFG_KEY = 'esc-co2-cfg'
const CFG_PADRAO: Co2Cfg = { bots: 3, modo: 'dinamica', tempos: { pausa: 60, rodada: 60 }, baralho: 'todos' }
function guardaCfg(sala: string, c: Co2Cfg) { try { localStorage.setItem(CO2_CFG_KEY, JSON.stringify({ sala, ...c })) } catch { /* ignora */ } }
function leCfg(sala: string): Co2Cfg | null {
  try { const o = JSON.parse(localStorage.getItem(CO2_CFG_KEY) ?? 'null') as (Co2Cfg & { sala?: string }) | null; return o && o.sala === sala ? { bots: o.bots, modo: o.modo, tempos: o.tempos, baralho: o.baralho ?? 'todos' } : null } catch { return null }
}

/** 📜 as regras da carreira online — as mesmas na criação e em cima da sala de espera (pra todo mundo) */
export function Co2Regras({ cfg }: { cfg?: Co2Cfg | null }) {
  const linhas: [string, string][] = [
    ['🏟️', tr('Cada um com o seu clube, temporada após temporada: sobe e cai na pirâmide (Várzea → Série A).', 'Everyone runs their own club, season after season: up and down the pyramid (Várzea → Série A).')],
    ['🌍', tr('Tudo é um mundo só: Copa do Brasil, Libertadores, Champions, Mundial e Copa do Mundo são as mesmas pra turma toda.', 'One shared world: the Copa do Brasil, Libertadores, Champions, Club World Cup and World Cup are the same for the whole crew.')],
    ['🃏', cfg ? (cfg.baralho === 'br' ? tr('Baralho: só Brasil.', 'Deck: Brazil only.') : tr('Baralho: Brasil + Europa + Mundo.', 'Deck: Brazil + Europe + World.')) : tr('O dono escolhe o baralho: só Brasil ou Brasil + Europa + Mundo.', 'The owner picks the deck: Brazil only or Brazil + Europe + World.')],
    ['🔨', cfg ? (cfg.bots ? tr(`O leilão de sempre abre cada temporada, com ${cfg.bots} bot${cfg.bots > 1 ? 's' : ''} disputando as cartas com vocês.`, `The usual auction opens each season, with ${cfg.bots} bot${cfg.bots > 1 ? 's' : ''} bidding against you.`) : tr('O leilão de sempre abre cada temporada, só entre vocês (sem bots).', 'The usual auction opens each season, just between you (no bots).')) : tr('O leilão de sempre abre cada temporada; o dono escolhe quantos bots disputam com vocês.', 'The usual auction opens each season; the owner picks how many bots bid against you.')],
    ['⚡', cfg ? (cfg.modo === 'dinamica' ? tr(`Dinâmica: as rodadas seguem direto; para ${cfg.tempos.pausa} s quando começa competição nova.`, `Dynamic: rounds run straight on; ${cfg.tempos.pausa} s pause when a new competition starts.`) : tr(`Livre: cada rodada espera todo mundo apertar PRONTO (ou ${cfg.tempos.rodada} s).`, `Free: each round waits for everyone to hit READY (or ${cfg.tempos.rodada} s).`)) : tr('O dono escolhe o ritmo: Dinâmica (rodadas direto) ou Livre (cada rodada espera o PRONTO).', 'The owner picks the pace: Dynamic (rounds straight on) or Free (each round waits for READY).')],
    ['👑', tr('Quem criou manda do começo ao fim. Sem o dono, a carreira espera.', 'The creator runs it start to finish. Without the owner, the career waits.')],
    ['😴', tr('Quem faltar não perde o clube: o time joga com a última escalação e a pessoa alcança ao voltar.', 'Missing a day never costs your club: it plays with your last lineup and you catch up when you return.')],
    ['🙋', tr('Antes de começar, entra todo mundo de graça (sem plano, uma carreira por vez). Depois, só com plano e OK do dono, na virada da temporada.', 'Before it starts, everyone joins for free (no plan = one career at a time). After that, plan + owner OK only, at the season turnover.')],
    ['🚪', tr('Quem sai não volta: o clube vira da máquina, com todos os jogadores.', 'Whoever leaves can\'t return: the club becomes a computer club, with all its players.')],
  ]
  return (
    <div style={{ display: 'grid', gap: 5 }}>
      {linhas.map(([ic, t]) => (
        <p key={ic} style={{ display: 'flex', gap: 8, margin: 0, fontWeight: 700, fontSize: 12.5, lineHeight: 1.35, color: INK }}><span style={{ flex: 'none' }}>{ic}</span><span>{t}</span></p>
      ))}
    </div>
  )
}

type SecaoProps = { num: number; title: string; icon: string; sub?: string; children: React.ReactNode }
// as mesmas opções de "Criar sala" (o `Seg` do lobby), passadas de lá pra não duplicar o visual
/** 27/11: o "esqueleto" de Criar sala do lobby (blocos que abrem/fecham + faixa presa embaixo). Sem ele, o resumo vai no fim da página. */
export type Co2LayoutProps = { name: string; rows: [string, string][]; summaries: Record<string, string>; button: React.ReactNode; notice: string; erro: string; children: React.ReactNode }
type SegProps = { options: [string, string][]; value: string; onSet: (v: string) => void; selos?: Partial<Record<string, string>>; travados?: string[] }
export function Co2Criar({ nomeClube, Secao, Opcoes, Layout, primeiro, onAbre }: { nomeClube: string; Secao: (p: SecaoProps) => React.ReactElement | null; Opcoes: (p: SegProps) => React.ReactElement | null; Layout?: (p: Co2LayoutProps) => React.ReactElement | null; primeiro: number; onAbre: (id: string) => void }) {
  const [nome, setNome] = useState('')
  const [clube, setClube] = useState(nomeClube)
  const [cfg, setCfg] = useState<Co2Cfg>(CFG_PADRAO)
  const [podeCriar, setPodeCriar] = useState<boolean | null>(null)
  const [erro, setErro] = useState('')
  const [indo, setIndo] = useState(false)
  useEffect(() => { void co2PodeCriar().then(setPodeCriar) }, [])
  const campo: React.CSSProperties = { width: '100%', border: `2.5px solid ${INK}`, borderRadius: 10, padding: '9px 10px', fontWeight: 800, fontSize: 14, background: '#fff', color: INK }
  const rot: React.CSSProperties = { ...OSWALD, fontWeight: 900, fontSize: 12.5, margin: '0 0 4px', textTransform: 'uppercase', color: INK }
  const nomeFinal = nome.trim() || tr(`Carreira do ${clube.trim() || nomeClube}`, `${clube.trim() || nomeClube}'s career`)
  const criar = async () => {
    if (indo) return
    setErro('')
    if (clube.trim().length < 2) { setErro(tr('Nome do clube com pelo menos 2 letras.', 'Club name needs at least 2 letters.')); return }
    setIndo(true)
    const r = await co2Criar(nomeFinal, clube.trim(), cfg.baralho ?? 'todos')
    setIndo(false)
    if (r.erro || !r.id) { setErro(r.erro === 'nome' ? tr('Nome do clube com pelo menos 2 letras.', 'Club name needs at least 2 letters.') : tr('Não deu pra criar agora. Tenta de novo.', 'Could not create right now. Try again.')); return }
    guardaCfg(r.id, cfg)
    onAbre(r.id)
  }
  let n = primeiro
  const chips = [tr('🪜 Tradicional', '🪜 Classic'), `🌐 ${nomeFinal}`, cfg.baralho === 'br' ? tr('🇧🇷 Só Brasil', '🇧🇷 Brazil only') : tr('🌎 BR + Europa + Mundo', '🌎 BR + Europe + World'), `🛡️ ${clube.trim() || nomeClube}`, cfg.bots ? `🤖 ${cfg.bots} bots` : tr('🤖 sem bots', '🤖 no bots'), cfg.modo === 'dinamica' ? tr('⚡ Dinâmica', '⚡ Dynamic') : tr('🧭 Livre', '🧭 Free'), tr('até 20 clubes', 'up to 20 clubs')]
  const botaoCriar = podeCriar === false ? null : <button type="button" disabled={indo || podeCriar === null} onClick={() => void criar()} style={{ ...botao(GOLD), opacity: indo ? .7 : 1 }}><span>{indo ? tr('Criando…', 'Creating…') : tr('Criar carreira →', 'Create career →')}</span></button>
  const travaTxt = tr('🔒 Criar carreira online é só pra quem tem plano. Você pode entrar na de um amigo pelo código, no último bloco.', '🔒 Creating an online career needs a plan. You can join a friend\'s with the code, in the last block.')
  const secoes = <>
      {/* 🪜 27/11 (Diego: *"por enquanto somente carreira tradicional c clubes feitos pela galera… oficial Brasil e global somente futuramente"*) */}
      <Secao num={n++} title={tr('O modo', 'The mode')} icon="🪜" sub={tr('Que carreira vocês vão jogar', 'Which career you are playing')}>
        <Opcoes options={[['tradicional', tr('🪜 Tradicional', '🪜 Classic')], ['oficial', tr('🇧🇷 Brasil Oficial', '🇧🇷 Official Brazil')], ['global', tr('🌍 Global', '🌍 Global')]]} value="tradicional" onSet={() => {}}
          selos={{ oficial: tr('EM BREVE', 'SOON'), global: tr('EM BREVE', 'SOON') }} travados={['oficial', 'global']} />
        <p style={{ fontWeight: 700, fontSize: 11.5, margin: 0, color: '#6b6250' }}>{tr('A pirâmide de sempre (Várzea → Série A) com os clubes da galera: o de cada um de vocês e os clubes batizados. Brasil Oficial e Global chegam depois.', 'The usual pyramid (Várzea → Série A) with the crew\'s clubs: each of yours plus the christened clubs. Official Brazil and Global come later.')}</p>
      </Secao>
      <Secao num={n++} title={tr('A carreira', 'The career')} icon="🌐" sub={tr('O nome da carreira e o do seu clube', 'The career name and your club name')}>
        <div><p style={rot}>{tr('Nome da carreira', 'Career name')}</p><input style={campo} value={nome} onChange={e => setNome(e.target.value.slice(0, 40))} placeholder={nomeFinal} /></div>
        <div><p style={rot}>{tr('Seu clube', 'Your club')}</p><input style={campo} value={clube} onChange={e => setClube(e.target.value.slice(0, 24))} placeholder={tr('Nome do seu clube', 'Your club name')} /></div>
      </Secao>
      <Secao num={n++} title={tr('O baralho', 'The deck')} icon="🃏" sub={tr('De onde vêm as cartas do leilão', 'Where the auction cards come from')}>
        <Opcoes options={[['todos', tr('🌎 Brasil + Europa + Mundo', '🌎 Brazil + Europe + World')], ['br', tr('🇧🇷 Só Brasil', '🇧🇷 Brazil only')]]} value={cfg.baralho ?? 'todos'} onSet={v => setCfg(c => ({ ...c, baralho: v as 'br' | 'todos' }))} />
        <p style={{ fontWeight: 700, fontSize: 11.5, margin: 0, color: '#6b6250' }}>{cfg.baralho === 'br' ? tr('Só as cartas do baralho Brasil, na carreira inteira.', 'Only Brazil deck cards, for the whole career.') : tr('Todas as cartas do jogo: Brasil, Europa e Mundo.', 'Every card in the game: Brazil, Europe and World.')}</p>
      </Secao>
      <Secao num={n++} title={tr('O leilão', 'The auction')} icon="🤖" sub={tr('Quantos bots disputam as cartas com vocês', 'How many bots bid against you')}>
        <Opcoes options={[0, 1, 2, 3, 4, 5].map(b => [String(b), b === 0 ? tr('Sem bots', 'No bots') : `${b} bot${b > 1 ? 's' : ''}`] as [string, string])} value={String(cfg.bots)} onSet={v => setCfg(c => ({ ...c, bots: Number(v) }))} />
        <p style={{ fontWeight: 700, fontSize: 11.5, margin: 0, color: '#6b6250' }}>{cfg.bots === 0 ? tr('Sem bots: o leilão é só entre vocês. Com poucos técnicos, sobra muita carta pro Monte.', 'No bots: the auction is just between you. With few managers, lots of cards go to the pile.') : tr(`${cfg.bots} bot${cfg.bots > 1 ? 's' : ''} disputando as cartas. A liga tem os outros clubes de sempre.`, `${cfg.bots} bot${cfg.bots > 1 ? 's' : ''} bidding. The league has the usual other clubs.`)}</p>
      </Secao>
      <Secao num={n++} title={tr('O ritmo', 'The pace')} icon="⚡" sub={tr('Como as rodadas andam', 'How the rounds move')}>
        <Opcoes options={[['dinamica', tr('⚡ Dinâmica', '⚡ Dynamic')], ['livre', tr('🧭 Livre', '🧭 Free')]]} value={cfg.modo} onSet={v => setCfg(c => ({ ...c, modo: v as Co2Cfg['modo'] }))} />
        <p style={{ fontWeight: 700, fontSize: 11.5, margin: 0, color: '#6b6250' }}>{cfg.modo === 'dinamica' ? tr('As rodadas seguem direto. Só para quando começa uma competição nova.', 'Rounds run straight on. Only pauses when a new competition starts.') : tr('Cada rodada espera todo mundo apertar PRONTO (ou o tempo acabar).', 'Each round waits for everyone to hit READY (or the time to run out).')}</p>
        <Co2Tempos valor={cfg.tempos} onMuda={t => setCfg(c => ({ ...c, tempos: t }))} />
      </Secao>
      <Secao num={n++} title={tr('As regras', 'The rules')} icon="📜" sub={tr('Elas aparecem também em cima da sala de espera', 'They also show at the top of the waiting room')}>
        <Co2Regras cfg={cfg} />
      </Secao>
</>
  const suas = <>      <Secao num={n++} title={tr('Suas carreiras e convites', 'Your careers and invites')} icon="🔑" sub={tr('Voltar pra uma carreira ou entrar com o código de um amigo', 'Go back to a career or join with a friend\'s code')}>
        <Co2Painel nomeClube={clube.trim() || nomeClube} onAbre={onAbre} semCriar />
      </Secao>
</>
  // chamado como FUNÇÃO (não como <Layout>): o lobby recria a função a cada render e o campo de texto perderia o foco
  if (Layout) return Layout({
    name: nomeFinal, erro, button: botaoCriar, notice: travaTxt,
    rows: [[tr('Modo', 'Mode'), tr('🪜 Tradicional', '🪜 Classic')], [tr('Carreira', 'Career'), nomeFinal], [tr('Seu clube', 'Your club'), clube.trim() || nomeClube], [tr('Baralho', 'Deck'), chips[2]], [tr('Leilão', 'Auction'), chips[4]], [tr('Ritmo', 'Pace'), chips[5]], [tr('Clubes de gente', 'Human clubs'), tr('até 20', 'up to 20')]],
    summaries: { [tr('O modo', 'The mode')]: tr('Tradicional', 'Classic'), [tr('A carreira', 'The career')]: `${nomeFinal} · ${clube.trim() || nomeClube}`, [tr('O baralho', 'The deck')]: chips[2], [tr('O leilão', 'The auction')]: chips[4], [tr('O ritmo', 'The pace')]: chips[5] },
    children: <>{secoes}{suas}</>,
  })
  return (
    <>
      {secoes}
      <div style={{ background: INK, borderRadius: 18, padding: 12 }}>
        <p style={{ ...OSWALD, fontSize: 12, letterSpacing: '.08em', color: GOLD, margin: '0 0 8px', textTransform: 'uppercase' }}>📋 {tr('Sua carreira', 'Your career')}</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
          {chips.map(t => (
            <span key={t} style={{ ...OSWALD, fontSize: 11, background: '#2b241a', color: CREAM, borderRadius: 7, padding: '3px 7px', textTransform: 'uppercase' }}>{t}</span>
          ))}
        </div>
        {podeCriar === false ? (
          <p style={{ fontWeight: 800, fontSize: 12.5, color: '#FFD9D2', margin: 0 }}>🔒 {tr('Criar carreira online é só pra quem tem plano. Você pode entrar na de um amigo pelo código, aqui embaixo.', 'Creating an online career needs a plan. You can join a friend\'s with the code, below.')}</p>
        ) : (
          <button type="button" disabled={indo || podeCriar === null} onClick={() => void criar()} style={{ ...botao(GOLD), opacity: indo ? .7 : 1 }}>{indo ? tr('Criando…', 'Creating…') : tr('🌐 Criar carreira →', '🌐 Create career →')}</button>
        )}
        {erro && <p style={{ fontWeight: 800, fontSize: 12, color: '#FFB4A6', margin: '8px 0 0' }}>{erro}</p>}
      </div>
      <Secao num={n++} title={tr('Suas carreiras e convites', 'Your careers and invites')} icon="🔑" sub={tr('Voltar pra uma carreira ou entrar com o código de um amigo', 'Go back to a career or join with a friend\'s code')}>
        <Co2Painel nomeClube={clube.trim() || nomeClube} onAbre={onAbre} semCriar />
      </Secao>
    </>
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
  const cfg0 = useMemo(() => leCfg(salaId), [salaId]) // 🌐 27/11: o que o dono escolheu ao criar
  const [bots, setBots] = useState(cfg0?.bots ?? 3)
  const [tempos, setTempos] = useState<{ pausa: number; rodada: number }>(cfg0?.tempos ?? { pausa: 60, rodada: 60 })
  const [modoSel, setModoSel] = useState<'dinamica' | 'livre'>(cfg0?.modo ?? 'dinamica')
  useEffect(() => { void co2Abrir(salaId) }, [salaId])
  const sala = sn.sala
  const souDono = !!sala && sala.dono === sn.uid
  const donoAqui = !!sala && sn.aqui.includes(sala.dono)
  // 👑 26/11 (Diego: "pode tirar o vice"): só o DONO comanda — sem o dono, a carreira espera (regra da coroa)
  const possoComandar = souDono
  const local = useMemo(() => co2LeLocal(salaId), [salaId, sala?.fase, sala?.temporada, sn.uid, sn.mundo]) // eslint-disable-line react-hooks/exhaustive-deps
  const divDe = (assento: number): string | undefined => {
    const ord = sn.mundo?.ordem
    const uid = sn.clubes.find(c => c.assento === assento)?.user_id
    const id = ord && uid ? ord.indexOf(uid) : -1
    return id >= 0 ? local?.careerPlacements?.[`m${id}`] : undefined
  }
  // 🔁 a carreira já está rolando (o dono continuou): entra no MEU clube (ou no leilão de todos)
  const entrouRef = useRef(false)
  useEffect(() => { entrouRef.current = false }, [salaId])
  useEffect(() => {
    if (!co2PodeEscrever() || !sala || entrouRef.current || sala.fase === 'espera' || possoComandar) return
    const contexto = co2Contexto()
    let cancelado = false
    void (async () => {
      if (sala.fase === 'virada' && sala.temporada <= 1 && !local) { entrouRef.current = true; co2Envia('pedir_estado'); return }
      const sv = await lePrivado(sala.id)
      if (cancelado || contexto !== co2Contexto()) return
      if (sv) { entrouRef.current = true; dispatch({ type: 'CO2_ABRE', save: sv }); if (sala.fase === 'virada') co2Envia('pedir_estado'); return }
      // 🙋 27/11: acabei de entrar (pedido aceito na virada) — ainda não tenho carreira: parto da foto do fim do leilão de todos
      const meuId = sn.uid && sn.mundo ? sn.mundo.ordem.indexOf(sn.uid) : -1
      if (meuId >= 0 && sala.temporada >= 1 && sala.fase !== 'virada') {
        const z = await co2LeVirada(sala.temporada)
        if (!z || cancelado || contexto !== co2Contexto()) return
        try { entrouRef.current = true; dispatch({ type: 'CO2_NOVO', newState: unpack<EscState>(z), meuId }) } catch { entrouRef.current = false }
      }
    })().catch(() => { if (!cancelado) entrouRef.current = false })
    return () => { cancelado = true }
  }, [sala, possoComandar, local, dispatch, sn.mundo, sn.uid])
  const comecar = async (modo: 'dinamica' | 'livre' = 'livre') => {
    if (!co2PodeEscrever() || !sala || indo) return
    const contexto = co2Contexto()
    setIndo(true); setErro('')
    try {
      const r = sala.fase === 'espera' ? await co2Continuar(90) : 'ok'
      if (contexto !== co2Contexto()) return
      if (r !== 'ok') { setErro(r === 'sem_permissao' ? tr('Só o dono continua a carreira.', 'Only the owner continues the career.') : tr('Não deu agora. Tenta de novo.', 'Didn\'t work. Try again.')); return }
      if (sala.temporada === 0) {
        // 🏁 1ª vez: monta a carreira com os clubes de gente na ordem dos assentos e abre o leilão de estreia
        const clubes = [...sn.clubes].sort((a, b) => a.assento - b.assento)
        const ordem = clubes.map(c => c.user_id)
        const eu = ordem.indexOf(sn.uid ?? '')
        dispatch({ type: 'START_CAREER_SOLO', teamName: clubes[eu]?.nome ?? 'Meu Time', formation: '4-3-3', rivals: bots, league: cfg0?.baralho ?? 'todos', co2: { sala: sala.id, nomes: clubes.map(c => c.nome), assento: eu } })
        await co2Mundo('virada', 1, 0, { ordem, v: 1, modo, bots, tempos })
        return
      }
      const sv = await lePrivado(sala.id)
      if (contexto !== co2Contexto()) return
      if (sala.fase === 'virada' && !sv) { co2Envia('pedir_estado'); return }
      if (!sv) { setErro(tr('Não achei o seu clube neste aparelho nem na nuvem do jogo.', 'Could not find your club on this device or in the game cloud.')); return }
      dispatch({ type: 'CO2_ABRE', save: { ...sv, co2: { ...sv.co2!, comanda: true } } })
    } finally { setIndo(false) }
  }
  // 🚪 27/11 (Diego): sair de vez — o clube vira da máquina (com os jogadores e tudo) e a pessoa não volta mais pra esta carreira
  const sairDeVez = async () => {
    if (!sala || souDono) return
    if (!window.confirm(tr(`Deixar a carreira "${sala.nome}" de vez? O seu clube vira da máquina, com todos os jogadores, e você não volta mais pra ela.`, `Quit the career "${sala.nome}" for good? Your club becomes a computer club, with all its players, and you won't come back.`))) return
    const r = await co2Sair(sala.id)
    if (r !== 'ok') { setErro(tr('Não deu pra sair agora. Tenta de novo.', 'Could not leave right now. Try again.')); return }
    onSair()
  }
  if(!co2PodeEscrever())return <div style={caixa('#F4ECD6')} role="status"><p>{sn.aparelho==='ocupado'?tr('Esta carreira está aberta em outro aparelho. Feche lá para continuar aqui.','This career is open on another device. Close it there to continue here.'):tr('Conferindo conexão e acesso deste aparelho…','Checking connection and device access…')}</p><button style={botao('#fff')} onClick={()=>void co2VerificaAparelho(true)}>{tr('Tentar novamente','Retry')}</button><button style={botao('#fff')} onClick={onSair}>{tr('Voltar','Back')}</button></div>
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
      {/* 📜 27/11 (Diego: *"com regras da carreira lá na sala igual fizemos tb c o draft liga"*) */}
      <div style={{ ...caixa('#FFF7DB'), padding: 12 }}>
        <p style={{ ...OSWALD, fontWeight: 900, fontSize: 15, margin: '0 0 8px', textTransform: 'uppercase', color: INK }}>📜 {tr('Regras da carreira', 'Career rules')}</p>
        <Co2Regras cfg={souDono ? { bots, modo: sala.temporada > 0 ? (sn.mundo?.modo ?? modoSel) : modoSel, tempos, baralho: cfg0?.baralho ?? 'todos' } : null} />
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
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                {(['dinamica', 'livre'] as const).map(m => <button key={m} type="button" onClick={() => setModoSel(m)} style={{ border: `2.5px solid ${INK}`, borderRadius: 10, padding: '8px 6px', fontWeight: 900, fontSize: 14, textTransform: 'uppercase', background: modoSel === m ? GOLD : '#fff', color: INK, cursor: 'pointer', boxShadow: modoSel === m ? `2px 2px 0 ${INK}` : 'none', ...OSWALD }}>{m === 'dinamica' ? `⚡ ${tr('Dinâmica', 'Dynamic')}` : `🧭 ${tr('Livre', 'Free')}`}</button>)}
              </div>
              <p style={{ fontWeight: 800, fontSize: 11.5, margin: '-2px 0 2px', color: 'rgba(0,0,0,.6)' }}>{modoSel === 'dinamica' ? tr(`As rodadas seguem direto. Só para quando começa uma competição nova (${tempos.pausa} s pra mexer no time).`, `Rounds run back to back. Only pauses when a new competition starts (${tempos.pausa} s to tweak the team).`) : tr('Cada rodada espera todo mundo apertar PRONTO (ou o tempo acabar).', 'Each round waits for everyone to hit READY (or the time to run out).')}</p>
              <button disabled={indo} onClick={() => { guardaCfg(sala.id, { bots, modo: modoSel, tempos, baralho: cfg0?.baralho ?? 'todos' }); void comecar(modoSel) }} style={botao(GOLD)}>▶️ {tr('Começar a carreira', 'Start the career')}</button>
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
        {!souDono && (
          <button onClick={() => void sairDeVez()} style={{ marginTop: 2, width: '100%', background: 'none', border: 'none', textDecoration: 'underline', fontWeight: 800, fontSize: 11.5, color: '#B23B2E', cursor: 'pointer' }}>{tr('❌ Deixar esta carreira de vez', '❌ Quit this career for good')}</button>
        )}
      </div>
      <Co2AvisoSaidas />
    </div>
  )
}

async function lePrivado(salaId: string): Promise<EscState | null> {
  const contexto = co2Contexto(), local = co2LeLocalInfo(salaId)
  const d = await co2LePrivado()
  if (contexto !== co2Contexto()) return null
  let nuvem: { state: EscState; at: number } | null = null
  if (typeof d?.z === 'string') {
    try {
      const st = unpack<EscState>(d.z), sn = co2Agora(), id = st.managers?.[st.youIdx]?.id
      if (st.co2?.sala === salaId && id != null && sn.uid && sn.mundo?.ordem[id] === sn.uid)
        nuvem = { state: st, at: typeof d.at === 'number' && Number.isFinite(d.at) ? d.at : 0 }
    } catch { /* cópia local válida ainda pode recuperar o clube */ }
  }
  await co2PuxaSinais()
  if(contexto!==co2Contexto())return null
  const sn=co2Agora(),foto=sn.leilao
  if(foto&&sn.sala?.fase==='virada')try{
    const st=unpack<EscState>(foto.z),id=sn.uid&&sn.mundo?sn.mundo.ordem.indexOf(sn.uid):-1
    if(st.co2?.sala===salaId&&id>=0&&st.seasonNo===sn.sala.temporada&&!['season','reserveList','intro','lobby'].includes(st.screen)){
      if(sn.sala.comandante===sn.uid&&Date.parse(foto.em??'')>=(nuvem?.at??0))return {...st,...(foto.secreto??{}),youIdx:id,co2:{...st.co2,comanda:true,espelho:false}} as EscState
    }
  }catch{/* a fotografia privada/local continua disponível */}
  const salvo=co2CopiaRecente(local,nuvem)
  if(salvo&&sn.sala&&(salvo.seasonNo??1)<sn.sala.temporada){
    const z=await co2LeVirada(sn.sala.temporada)
    if(!z||contexto!==co2Contexto())return null
    try{return co2RetornoAtrasado(salvo,unpack<EscState>(z),salvo.managers[salvo.youIdx].id)}catch{return null}
  }
  return salvo
}

// ═══ DENTRO DA TEMPORADA: a barra do PRONTO + o motor que segue o relógio do dono ═══════════════════════════════════
const PRAZO_DINAMICA_S = 15 // o banco aceita no mínimo 15 s; na Dinâmica o dono começa logo que a rodada anterior terminou de animar

// 🚪 27/11 (Diego: *"vai ter que aparecer alguma coisa… que o usuário saiu dessa carreira… volta um bot no lugar"*): linha pra todo
// mundo da carreira, com ✕ que não volta (regra do aviso fechado). O clube vira da máquina na virada, com o elenco inteiro.
export function Co2AvisoSaidas() {
  const sn = useCo2()
  const [lista, setLista] = useState<Co2Saida[]>([])
  const [, setTick] = useState(0)
  useEffect(() => {
    if (!sn.sala?.id) return
    const le = () => { void co2Saidas().then(setLista) }
    le(); const t = setInterval(le, 60000); return () => clearInterval(t)
  }, [sn.sala?.id])
  const chave = (x: Co2Saida) => `co2-saida:${sn.sala?.id ?? ''}:${x.user_id}:${x.em}`
  const vis = lista.filter(x => x.user_id !== sn.uid && !avisoFechado(chave(x)))
  if (!vis.length) return null
  return (
    <div style={{ display: 'grid', gap: 4 }}>
      {vis.map(x => (
        <p key={chave(x)} style={{ display: 'flex', alignItems: 'center', gap: 8, margin: 0, fontSize: 11.5, fontWeight: 800, color: 'rgba(0,0,0,.7)', background: '#FFF4D6', border: `2px solid ${INK}`, borderRadius: 10, padding: '6px 8px' }}>
          <span style={{ flex: 1 }}>🚪 {x.aplicada
            ? tr(`${x.nome} saiu da carreira. O clube agora é da máquina, com os mesmos jogadores.`, `${x.nome} left the career. The club is now a computer club, with the same players.`)
            : tr(`${x.nome} saiu da carreira. Na virada da temporada o clube vira da máquina, com os mesmos jogadores; até lá ele joga sozinho.`, `${x.nome} left the career. At the season turnover the club becomes a computer club, with the same players; until then it plays by itself.`)}</span>
          <button aria-label={tr('Fechar', 'Close')} onClick={() => { fechaAviso(chave(x)); setTick(n => n + 1) }} style={{ background: 'none', border: 'none', fontWeight: 900, fontSize: 13, cursor: 'pointer', color: 'rgba(0,0,0,.5)' }}>✕</button>
        </p>
      ))}
    </div>
  )
}

// ✍️ 27/11 (Diego, 26/11: *"pra quem não estava, um recado discreto ao voltar… nada de banner grande"*): linha miúda com quem renovou
// sozinho enquanto a pessoa estava fora da virada; fecha no ✕ e não volta (regra do aviso fechado).
function RecadoRenovados() {
  const { state } = useEsc()
  const r = state.co2?.renovadosFora
  const chave = `co2-renov:${state.co2?.sala ?? ''}:${r?.season ?? 0}`
  const [fechado, setFechado] = useState(() => avisoFechado(chave))
  if (!r?.nomes.length || fechado) return null
  const lista = r.nomes.length > 4 ? `${r.nomes.slice(0, 4).join(', ')} ${tr(`e mais ${r.nomes.length - 4}`, `and ${r.nomes.length - 4} more`)}` : r.nomes.join(', ')
  return (
    <p style={{ display: 'flex', alignItems: 'center', gap: 8, margin: 0, fontSize: 11, fontWeight: 700, color: 'rgba(0,0,0,.6)' }}>
      <span style={{ flex: 1 }}>✍️ {tr(`Enquanto você estava fora, renovamos ${lista}.`, `While you were away, we renewed ${lista}.`)}</span>
      <button aria-label={tr('Fechar', 'Close')} onClick={() => { fechaAviso(chave); setFechado(true) }} style={{ background: 'none', border: 'none', fontWeight: 900, fontSize: 13, cursor: 'pointer', color: 'rgba(0,0,0,.5)' }}>✕</button>
    </p>
  )
}

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
  const minhaIntl = state.co2?.minhaIntl
  const meuCaixa = me ? Math.round(state.careerCoins?.[me.id] ?? 0) : 0
  const gaveta = useMemo<GavetaPublica | null>(() => (me ? { ...minhaGaveta(me, entradasLocais),pendente:state.eventoTemporada?.season===state.seasonNo&&state.eventoTemporada.status==='pendente',lesao:state.careerMatchInjury, repertorio: liveFormations(state,me,me.formation,true).filter(f=>f.available).map(f=>f.motor), ...(minhaCopa ? { copaMundo: minhaCopa } : {}), ...(minhaIntl ? { intl: minhaIntl } : {}), caixa: meuCaixa } : null), [me, entradasLocais, minhaCopa, minhaIntl, meuCaixa, state.careerTecnicos, state.careerFormacaoExtra,state.eventoTemporada,state.careerMatchInjury,state.seasonNo])
  const gavetaJson = useMemo(() => (gaveta ? JSON.stringify(gaveta) : ''), [gaveta])
  const contexto = co2Contexto()
  const [erroSync, setErroSync] = useState(false)
  const [aguardaPreparo,setAguardaPreparo]=useState(false)
  const [prontoIndo, setProntoIndo] = useState(false)
  const { confirma: sobeGaveta, falhou: falhaGaveta } = useCo2Envio(contexto, gavetaJson, gaveta,
    async g => await co2Gaveta(g as unknown as Record<string, unknown>) === 'ok')
  const tentativas = useMemo(() => new Co2Tentativas(), [contexto])
  const etapa = sala ? `${contexto}:${sala.temporada}:${sala.rodada}:${sala.fase}` : ''
  const etapaRef = useRef(etapa)
  etapaRef.current = etapa
  const etapaAtual = (e: string) => e === etapaRef.current && contexto === co2Contexto()
  // O banco identifica o dono da gaveta; não confiar só no mgrId que veio dentro do JSON.
  const leGavetas = async () => {
    const rows = await co2LeGavetasConferidas()
    if (!rows || contexto !== co2Contexto()) return null
    const ordem = co2Agora().mundo?.ordem ?? []
    const gavetas = rows.flatMap(r => {
      const g = r.publico as unknown as GavetaPublica | undefined
      return g && Number.isInteger(g.mgrId) && ordem[g.mgrId] === r.user_id && Array.isArray(g.squad) && g.entradas ? [g] : []
    })
    return rows.filter(r => ordem.includes(r.user_id)).every(r => gavetas.some(g => ordem[g.mgrId] === r.user_id)) ? gavetas : null
  }
  const puxaGavetas = async (ate?: number) => {
    const e = etapa
    const gav = await leGavetas()
    if (!gav || !etapaAtual(e) || !gav.some(g => g.mgrId === me?.id)) return false
    const pendente=gav.some(g=>g.pendente);setAguardaPreparo(pendente)
    if(ate!=null&&pendente)return false
    dispatch({ type: 'CO2_GAVETAS', gavetas: gav, ate })
    return true
  }
  useEffect(() => { void puxaGavetas().then(ok => { if (etapaAtual(etapa)) setErroSync(!ok) }) }, [sn.clubes, contexto]) // eslint-disable-line react-hooks/exhaustive-deps

  // Quem voltou só alcança depois de uma leitura válida. Falha não consome a tentativa.
  useEffect(() => {
    if (!sala || comanda || state.screen !== 'season') return
    const alvo = sala.temporada > (state.seasonNo ?? 1) ? 38 : sala.temporada === (state.seasonNo ?? 1) ? sala.rodada : -1
    if (alvo <= round) return
    const e = etapa
    void tentativas.faz(`alcanca:${e}:${round}`, async () => {
      const gav = await leGavetas()
      if (!gav || !etapaAtual(e) || !gav.some(g => g.mgrId === me?.id)) return false
      dispatch({ type: 'CO2_ALCANCA_RODADAS', gavetas: gav, ate: alvo })
      return true
    }).then(ok => { if (etapaAtual(e)) setErroSync(!ok) })
  }, [etapa, round, comanda, state.screen, state.seasonNo, agora]) // eslint-disable-line react-hooks/exhaustive-deps

  // Rodada local só começa com o envio E a leitura confirmados. Erro libera nova tentativa.
  useEffect(() => {
    if (!co2PodeEscrever() || !sala || sn.conexaoPendente || sala.fase !== 'jogando' || round !== sala.rodada) return
    const e = etapa
    void tentativas.faz(`joga:${e}`, async () => {
      if (!await sobeGaveta() || !etapaAtual(e) || !await puxaGavetas(sala.rodada) || !etapaAtual(e)) return false
      dispatch({ type: 'PLAY_ROUND' })
      return true
    }).then(ok => { if (etapaAtual(e)) setErroSync(!ok) })
  }, [etapa, round, agora]) // eslint-disable-line react-hooks/exhaustive-deps

  // Apito e começo: uma chamada por vez, repetir só se falhou, sem travar a semana.
  useEffect(() => {
    if (!comanda || !sala || sala.fase !== 'jogando' || !roundReady || round !== sala.rodada + 1) return
    const e = etapa
    void tentativas.faz(`apito:${e}`, async () => await co2Apito(sala.rodada + 1, dinamica ? PRAZO_DINAMICA_S : tempoRodada(co2Agora().mundo)) === 'ok')
      .then(ok => { if (etapaAtual(e)) setErroSync(!ok) })
  }, [etapa, comanda, roundReady, round, dinamica, agora]) // eslint-disable-line react-hooks/exhaustive-deps

  const humanos = sn.clubes.length
  const prontos = sala ? sn.clubes.filter(c => c.pronto_rodada === sala.rodada + 1).length : 0
  const restante = sala?.prazo ? Math.max(0, Math.round((new Date(sala.prazo).getTime() - agora) / 1000)) : null
  const comeca = async () => {
    if (!co2PodeEscrever() || !sala || sn.conexaoPendente || !comanda || sala.fase !== 'preparo') return false
    const e = etapa
    const ok = await tentativas.faz(`comeca:${e}`, async () => {
      if (!await sobeGaveta() || !etapaAtual(e)||!await puxaGavetas(sala.rodada)||!etapaAtual(e)) return false
      return await co2Comecar() === 'ok'
    })
    if (etapaAtual(e)) setErroSync(!ok)
    return ok
  }
  useEffect(() => {
    if (!comanda || !sala || sala.fase !== 'preparo' || sala.pausado || seasonOver || round !== sala.rodada) return
    if (dinamica && sala.rodada === 0) return
    const todos = humanos > 0 && prontos >= humanos
    const respiroDin = dinamica && !!sala.prazo && agora >= new Date(sala.prazo).getTime() - (PRAZO_DINAMICA_S - 3) * 1000
    // Livre com automático desligado: só o botão do dono começa (como o aviso já promete).
    if ((!dinamica && !sala.auto) || (!todos && !((sala.auto && restante === 0) || respiroDin))) return
    void comeca()
  }, [etapa, comanda, prontos, humanos, restante, round, seasonOver, dinamica, agora]) // eslint-disable-line react-hooks/exhaustive-deps

  const ficaPronto = async () => {
    if (!sala || prontoIndo) return
    const e = etapa
    setProntoIndo(true)
    try {
      const ok = await sobeGaveta() && etapaAtual(e) && await co2Pronto(sala.rodada + 1, { r: sala.rodada + 1 }) === 'ok'
      if (etapaAtual(e)) setErroSync(!ok)
    } catch { if (etapaAtual(e)) setErroSync(true) }
    finally { setProntoIndo(false) }
  }

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
      {aguardaPreparo&&<p role="status">{tr('Aguardando resolver o aviso do elenco antes da partida.','Waiting for the squad notice to be resolved before the match.')}</p>}
      {(!aguardaPreparo&&erroSync || falhaGaveta || sn.savePendente || sn.conexaoPendente) && <p role="status" style={{ margin: 0, fontWeight: 800, fontSize: 12 }}>{tr('⚠️ A conexão falhou. Suas alterações continuam pendentes; aguarde a conexão ou tente novamente.', '⚠️ Connection failed. Your changes are still pending; wait for the connection or try again.')}</p>}
      <RecadoRenovados />
      <Co2PedidosDono />
      {sala.fase === 'preparo' && dinamica && sala.rodada === 0 && (
        <Co2Anuncio restante={restante} comanda={comanda} onSeguir={() => { void comeca() }} />
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
              <p style={{ fontWeight: 800, fontSize: 12, margin: 0, color: 'rgba(0,0,0,.6)' }}>{sala.auto ? tr('A rodada começa quando todo mundo apertar PRONTO ou o tempo acabar.', 'The round starts when everyone hits READY or time runs out.') : tr('Prepare seu time e confirme. O dono inicia a rodada.', 'Set up your team and confirm. The owner starts the round.')}</p>
            </div>
          </div>
          <div style={{ height: 12, border: `2.5px solid ${INK}`, borderRadius: 99, background: '#fff', margin: '10px 0 4px', overflow: 'hidden' }}><div style={{ width: `${pct}%`, height: '100%', background: GREEN }} /></div>
          <p style={{ fontWeight: 900, fontSize: 12, margin: '0 0 8px' }}>✅ {prontos} {tr('de', 'of')} {humanos} {tr('prontos', 'ready')}{faltam.length ? ` · ${tr('faltam', 'missing')}: ${faltam.join(', ')}` : ''}</p>
          <button onClick={onEscalacao} style={{ ...botao('#fff'), fontSize: 14, marginBottom: 8 }}>🧩 {tr('Escalação', 'Lineup')}</button>
          <button disabled={euPronto || prontoIndo} onClick={() => { void ficaPronto() }} style={botao(euPronto ? '#CFE8D6' : GREEN, euPronto ? INK : '#fff')}>
            {prontoIndo ? tr('Confirmando escalação…', 'Confirming lineup…') : euPronto ? tr('✅ Pronto! Esperando os outros…', '✅ Ready! Waiting for the others…') : tr('✅ Estou pronto', '✅ I\'m ready')}
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
            <button disabled={sala.fase !== 'preparo'} onClick={() => { void comeca() }} style={{ ...botao(sala.fase === 'preparo' ? GOLD : '#eee'), fontSize: 14, flex: 2 }}>▶️ {tr('Começar agora', 'Start now')}</button>
            <button onClick={() => void co2Ritmo(sala.auto, sala.velocidade, !sala.pausado)} style={{ ...botao('#fff'), fontSize: 14, flex: 1 }}>{sala.pausado ? `▶️ ${tr('Seguir', 'Resume')}` : `⏸️ ${tr('Pausar', 'Pause')}`}</button>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            {!dinamica && <button onClick={() => void co2Ritmo(!sala.auto, sala.velocidade, sala.pausado)} style={{ ...botao('#fff'), fontSize: 12, padding: '8px' }}>{sala.auto ? tr('Início automático: ligado', 'Automatic start: on') : tr('Início automático: desligado', 'Automatic start: off')}</button>}
            <button onClick={() => void co2EncerrarDia()} disabled={sala.fase !== 'preparo'} style={{ ...botao('#fff'), fontSize: 12, padding: '8px' }}>🌙 {tr('Encerrar o dia', 'End the day')}</button>
          </div>
          <Co2TemposDono />
          <p style={{ fontWeight: 800, fontSize: 11, margin: '6px 0 0', color: 'rgba(0,0,0,.55)' }}>{dinamica ? tr('⚡ Dinâmica · as rodadas seguem direto. Pausar segura a carreira pra todo mundo.', '⚡ Dynamic · rounds run back to back. Pause holds the career for everyone.') : sala.auto ? tr('Início automático das rodadas ligado · quem não apertar PRONTO joga com a escalação que já está.', 'Automatic round start on · whoever does not press READY plays with the current lineup.') : tr('Início automático das rodadas desligado · use Começar agora para iniciar. O salvamento continua automático.', 'Automatic round start off · use Start now to begin. Saving remains automatic.')}</p>
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
    const contexto = co2Contexto()
    void co2ProtocoloJogo().then(proto => {
      if (contexto !== co2Contexto()) return
      const mundo = carimbo ?? mm
      const novo = proto && mundo && (mundo.m2 != null || poeM2) && mundo.aoVivoDesde == null ? { ...mundo, aoVivoDesde: state.seasonNo ?? 1 } : carimbo
      if(sn.sala?.fase==='preparo'&&!novo)return
      return co2Mundo('preparo', state.seasonNo ?? 1, 0, novo, mm?.modo === 'dinamica' ? tempoPausa(mm) : Math.max(90, tempoRodada(mm)))
    }) // ⚡ Dinâmica: o tempo de pausa que o dono escolheu (aviso; o dono segue)
  }, [state.co2?.comanda, state.screen, sn.sala?.fase, state.seasonNo, m2Liberado, state.round])
}

// ═══ VIRADA (26/11): cada um fecha o próprio clube; o dono abre o leilão de todos ═══════════════════════════════════
/** O botão no fim da janela de contratos (no lugar do "Começar o leilão" da carreira solo). */
export function Co2FecharTemporada() {
  const { state, dispatch } = useEsc()
  // 🌎 27/11: a MESMA régua do CO2_FECHA — sem a temporada internacional encerrada aqui, o botão diz por quê (nunca botão mudo)
  const intlFalta = internacionalCarreiraLiberada() && !(state.careerInternationalHistory ?? []).some(e => e.season === state.seasonNo)
  if (intlFalta) return <p style={{ fontWeight: 800, fontSize: 12, margin: 0, textAlign: 'center' }}>🌎 {tr('Falta a temporada internacional (Libertadores/Champions). Volte ao fim da temporada e conclua ela pra fechar.', 'The international season (Libertadores/Champions) is still open. Go back to the season wrap-up and finish it to close.')}</p>
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
  const [leituraErro, setLeituraErro] = useState(false)
  const sobe = async () => {
    const f = co2Fechamento(state)
    if (!me || !f) { setSubiu('erro'); return }
    setSubiu('indo')
    // 🌍🌎 a gaveta leva junto as decisões da Copa do Mundo e da Libertadores/Champions (amigo mais lento ainda monta a campanha com elas)
    const extra = { ...(state.co2?.minhaCopa ? { copaMundo: state.co2.minhaCopa } : {}), ...(state.co2?.minhaIntl ? { intl: state.co2.minhaIntl } : {}), caixa: Math.round(state.careerCoins?.[me.id] ?? 0) }
    const r = await co2Gaveta({ ...minhaGaveta(me, vazio), ...extra, fechamento: f } as unknown as Record<string, unknown>)
    setSubiu(r === 'ok' ? 'ok' : 'erro')
  }
  useEffect(() => { void sobe() }, []) // eslint-disable-line react-hooks/exhaustive-deps
  const le = async (): Promise<Record<number, Fechamento | undefined> | null> => {
    const ctx = co2Contexto()
    const rows = await co2LeGavetasConferidas()
    if (ctx !== co2Contexto()) return null
    if (!rows) { setLeituraErro(true); return null }
    setLeituraErro(false)
    const out: Record<number, Fechamento | undefined> = {}
    for (const r of rows) { const g = r.publico as unknown as GavetaPublica | undefined; if (g && Number.isInteger(g.mgrId) && sn.mundo?.ordem[g.mgrId] === r.user_id && g.fechamento?.temporada === temporada) out[g.mgrId] = g.fechamento }
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
    const ctx = co2Contexto()
    const f = await le()
    if (!f || ctx !== co2Contexto()) return
    const fora = clubes.filter(c => !f[c.id]).map(c => c.nome)
    if (restante != null && restante > 0 && fora.length && !window.confirm(tr(`Ainda faltam ${restante} s no relógio. Abrir o leilão agora?`, `There are still ${restante} s on the clock. Open the auction now?`))) return
    if (fora.length && !window.confirm(tr(`${fora.join(', ')} ainda não fechou. Vai ficar fora do leilão e os contratos vencidos renovam sozinhos. Abrir mesmo assim?`, `${fora.join(', ')} hasn't closed yet. They'll sit out the auction and expired contracts renew by themselves. Open anyway?`))) return
    // 🙋 os pedidos aceitos entram AGORA: o clube da máquina vira deles, o lugar no mundo é anotado e o banco ganha o clube
    const aceitos = (await co2Pedidos()).filter(p => p.status === 'aceito')
    const vagas = vagasDeNovos(state.managers, state.careerPlacements as Record<string, string> | undefined, aceitos.length)
    const novos = aceitos.slice(0, vagas.length).map((p, i) => ({ ...p, mgr: vagas[i] }))
    // 🚪 quem saiu da carreira: o clube dele (achado pelo lugar no mundo) vira da máquina, com o elenco inteiro
    const ordemAntes = (co2Agora().mundo ?? sn.mundo)?.ordem ?? []
    const saidas = (await co2Saidas()).filter(x => !x.aplicada).map(x => ({ ...x, id: ordemAntes.indexOf(x.user_id) }))
    const saiIds = saidas.map(x => x.id).filter(id => id >= 0)
    if (ctx !== co2Contexto()) return
    dispatch({ type: 'CO2_ABRE_VIRADA', fechamentos: f, novos: novos.map(p => ({ mgr: p.mgr, nome: p.nome })), saidas: saiIds })
    if (novos.length || saiIds.length) {
      const mm = co2Agora().mundo ?? sn.mundo
      if (mm) {
        const ordem = [...mm.ordem]
        for (const id of saiIds) ordem[id] = null as unknown as string
        for (const p of novos) ordem[p.mgr] = p.user_id
        await co2Mundo('virada', null, null, { ...mm, ordem })
      }
      for (const p of novos) await co2PedidoEntra(p.user_id, p.mgr)
    }
    for (const x of saidas) if (x.mgr != null) await co2SaidaAplicada(x.mgr)
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
          {leituraErro && <p role="status">{tr('⚠️ Não foi possível conferir os clubes. Tente abrir novamente quando a conexão voltar.', '⚠️ Could not check the clubs. Try opening again when the connection returns.')}</p>}
          {subiu === 'erro' && <button onClick={() => void sobe()} style={{ ...botao('#FFE1DB'), fontSize: 13, marginTop: 8 }}>⚠️ {tr('Não subiu o seu fechamento — tentar de novo', 'Your closing didn\'t upload — try again')}</button>}
        </div>
        <Co2PedidosDono />
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
      {aberto && <div style={{ marginTop: 8 }}><Co2Tempos valor={atual} onMuda={v => void muda(v)} />
        {co2JogoAtivo()&&<div><p style={{...OSWALD,fontWeight:900,fontSize:12,margin:'8px 0 5px'}}>{tr('Velocidade da partida','Match speed')}</p><div style={{display:'flex',gap:6}}>{[1,2,3,4].map(v=><button key={v} data-co2-speed={v} onClick={()=>void co2Ritmo(sala.auto,v,sala.pausado).then(r=>setMsg(r==='ok'?tr('✅ Velocidade alterada para todos.','✅ Speed changed for everyone.'):tr('Não deu agora. Tenta de novo.','Could not change it. Try again.')))} style={{...botao(sala.velocidade===v?GOLD:'#fff'),fontSize:12,padding:'8px 2px'}}>{v}×</button>)}</div></div>}
        {msg && <p style={{ fontWeight: 800, fontSize: 11, margin: '4px 0 0' }}>{msg}</p>}</div>}
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
  // ⏱️ escolha AUTOMÁTICA (relógio da Dinâmica ou o dono pulou): a seleção carimbada pelo dono + os piores 11 — vale por cima
  const auto = useMemo(() => (sn.mundo?.copaAuto?.season === seasonNo ? sn.mundo.copaAuto.por : {}), [sn.mundo?.copaAuto, seasonNo])
  const escolhas = useMemo(() => {
    const out: Record<number, Co2CopaEscolha | undefined> = {}
    for (const g of state.co2?.gavetas ?? []) if (g.copaMundo) out[g.mgrId] = g.copaMundo
    if (meuId != null && state.co2?.minhaCopa) out[meuId] = state.co2.minhaCopa
    for (const [id, pais] of Object.entries(auto)) out[Number(id)] = pais ? escolhaCopaAuto(seasonNo, pais, paises, new Set()) : { season: seasonNo, pais: null }
    return out
  }, [state.co2?.gavetas, state.co2?.minhaCopa, meuId, auto, paises, seasonNo])
  const pula: number[] = []
  const vez = vezDaCopa(top, escolhas, pula, seasonNo)
  const vezE = vez != null ? escolhas[vez] : undefined
  const fase: 'escolha' | 'convoca' = vezE?.season === seasonNo && vezE.reserva ? 'convoca' : 'escolha'
  const dinamica = sn.mundo?.modo === 'dinamica'
  const cv = sn.mundo?.copaVez
  const prazo = dinamica && ehAnoDeCopa && vez != null && cv?.season === seasonNo && cv.mgrId === vez && cv.fase === fase ? new Date(cv.desde).getTime() + (fase === 'escolha' ? COPA_PRAZO_ESCOLHA_S : COPA_PRAZO_CONVOCA_S) * 1000 : null
  const daAuto = (id: number) => {
    const mm = co2Agora().mundo ?? sn.mundo
    if (!mm) return
    const e = escolhas[id]
    const esc = escolhaCopaAuto(seasonNo, e?.season === seasonNo && e.reserva ? e.pais : null, paises, selecoesTomadas(escolhas, seasonNo, id))
    void co2Mundo('virada', null, null, { ...mm, copaAuto: { season: seasonNo, por: { ...(mm.copaAuto?.season === seasonNo ? mm.copaAuto.por : {}), [id]: esc.pais } } })
  }
  // ⏱️ o DONO carimba o relógio quando a vez/fase muda e dá o automático quando ele esgota (só na ⚡ Dinâmica)
  useEffect(() => {
    if (!comanda || !dinamica || !ehAnoDeCopa || vez == null) return
    const mm = co2Agora().mundo ?? sn.mundo
    if (!mm || (mm.copaVez?.season === seasonNo && mm.copaVez.mgrId === vez && mm.copaVez.fase === fase)) return
    void co2Mundo('virada', null, null, { ...mm, copaVez: { season: seasonNo, mgrId: vez, fase, desde: new Date().toISOString() } })
  }, [comanda, dinamica, ehAnoDeCopa, vez, fase, seasonNo]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!comanda || prazo == null || vez == null) return
    const id = vez
    const t = setTimeout(() => daAuto(id), Math.max(0, prazo - Date.now()) + 500)
    return () => clearTimeout(t)
  }, [comanda, prazo, vez]) // eslint-disable-line react-hooks/exhaustive-deps
  const [agora, setAgora] = useState(() => Date.now())
  useEffect(() => { if (prazo == null) return; const t = setInterval(() => setAgora(Date.now()), 500); return () => clearInterval(t) }, [prazo])
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
    if (!window.confirm(fase === 'escolha' ? tr(`Pular ${nomeDe(id)}? Ele fica com a PIOR seleção da lista, com os piores jogadores, e o próximo escolhe.`, `Skip ${nomeDe(id)}? They get the WORST team on the list, with its worst players, and the next one picks.`) : tr(`Pular ${nomeDe(id)}? O jogo escala os PIORES jogadores da seleção dele e o próximo escolhe.`, `Skip ${nomeDe(id)}? The game picks their team's WORST players and the next one picks.`))) return
    daAuto(id)
  }
  const restante = prazo != null ? Math.max(0, Math.ceil((prazo - agora) / 1000)) : null
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
            const st = decidiuCopa(e, seasonNo) ? (e!.pais ? `${e!.pais}` : tr('recusou', 'declined')) + (id in auto ? ' 🤖' : '') : id === vez ? (fase === 'convoca' ? tr('convocando…', 'calling up…') : tr('escolhendo…', 'picking…')) : tr('espera a vez', 'waits')
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
      {restante != null && <p style={{ ...OSWALD, fontWeight: 900, fontSize: 15, margin: '0 0 6px', textAlign: 'center', color: restante <= 15 ? '#C2452F' : INK }}>⏱️ {Math.floor(restante / 60)}:{String(restante % 60).padStart(2, '0')} · <span style={{ fontFamily: 'inherit', fontSize: 11 }}>{fase === 'escolha' ? tr('acabou o tempo = a PIOR seleção da lista', 'time up = the WORST team on the list') : tr('acabou o tempo = os PIORES jogadores', 'time up = the WORST players')}</span></p>}
      {meuId != null && meuId in auto && <p style={{ fontWeight: 800, fontSize: 12, margin: '0 0 6px', color: '#C2452F' }}>🤖 {minha?.pais ? tr(`O tempo acabou: você ficou com ${minha.pais}, com os piores jogadores.`, `Time ran out: you got ${minha.pais}, with the worst players.`) : tr('O tempo acabou e nenhuma seleção sobrou pra você.', 'Time ran out and no team was left for you.')}</p>}
      {vez === null ? (
        <button onClick={() => setAberto('copa')} style={botao(GOLD)}>🌍 {tr('Ver a Copa do Mundo', 'Watch the World Cup')}</button>
      ) : vez === meuId ? (
        fase === 'convoca' && minha?.pais
          ? <button onClick={() => { setPaisEscolhido(minha.pais); setAberto('convoca') }} style={botao(GOLD)}>📋 {tr(`Convocar ${minha.pais}`, `Call up ${minha.pais}`)}</button>
          : <button onClick={() => setAberto('convite')} style={botao(GOLD)}>✉️ {tr('Sua vez: ver os convites', 'Your turn: see the invitations')}</button>
      ) : (
        <p style={{ fontWeight: 800, fontSize: 12, margin: 0, color: 'rgba(0,0,0,.65)' }}>{!convidado ? tr('Seu clube não está entre os 32 do ranking desta vez. A Copa começa quando os convidados decidirem.', 'Your club is not in the ranking top 32 this time. The Cup starts once the invited decide.') : decidiuCopa(minha, seasonNo) ? tr('Você já decidiu. A Copa começa quando todos os convidados decidirem.', 'You have decided. The Cup starts once everyone invited decides.') : tr(`Vez de ${nomeDe(vez)} escolher. A seleção que ele levar sai da sua lista.`, `${nomeDe(vez)} is picking. The team they take leaves your list.`)}</p>
      )}
      {aberto === 'convite' && meuId != null && (
        <CMModal>
          {/* ✉️ 27/11 (Diego): *"todos esses times te querem… por qual você vai brigar pelo título?"* — TODAS as seleções livres, a mais forte primeiro */}
          <p style={{ ...OSWALD, fontWeight: 900, fontSize: 19, margin: 0, textAlign: 'center', textTransform: 'uppercase' }}>✉️ {tr('Todas essas seleções querem você', 'All these national teams want you')}</p>
          <p style={{ fontFamily: 'Georgia, serif', fontSize: 13.5, textAlign: 'center', margin: '4px 0 2px' }}>{tr('Por qual você vai brigar pelo título?', 'Which one will you fight for the title with?')}</p>
          <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(0,0,0,.6)', textAlign: 'center', margin: '0 0 10px' }}>{tr('Você escolhe antes de quem ficou abaixo no ranking — e a seleção que você levar sai da lista deles.', 'You pick before those below you in the ranking — and the team you take leaves their list.')}</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(132px, 1fr))', gap: 8, marginBottom: 8 }}>
            {convitesDaCopa(top, paises, meuId, escolhas, seasonNo).map(p => ({ p, f: forcaSelecao(p) })).sort((a, b) => b.f - a.f || a.p.localeCompare(b.p)).map(({ p }) => (
              <button key={p} onClick={() => { dispatch({ type: 'CO2_COPA_ESCOLHA', escolha: { season: seasonNo, pais: p, reserva: true } }); setPaisEscolhido(p); setAberto('convoca') }} style={{ display: 'flex', alignItems: 'center', gap: 7, background: '#FBF5E4', border: `2.5px solid ${INK}`, borderRadius: 10, boxShadow: `2px 2px 0 ${INK}`, padding: '6px 7px', cursor: 'pointer', textAlign: 'left', color: INK }}>
                <span style={{ fontSize: 24, lineHeight: 1 }}>{bandeiraDe(p)}</span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: 'block', fontWeight: 900, fontSize: 12, lineHeight: 1.1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p}</span>
                  <span style={{ display: 'block', fontSize: 10, fontWeight: 800, color: '#6c604a' }}>{tr('✉️ te convidou', '✉️ invited you')}</span>
                </span>
              </button>
            ))}
          </div>
          <button onClick={() => { dispatch({ type: 'CO2_COPA_ESCOLHA', escolha: { season: seasonNo, pais: null } }); onStats?.([]); setAberto(null) }} style={{ ...botao('#fff'), fontSize: 13, marginTop: 4 }}>{tr('Recusar os convites', 'Decline the invitations')}</button>
          <p style={{ textAlign: 'center', marginTop: 8 }}><button onClick={() => setAberto(null)} style={{ background: 'none', border: 'none', fontSize: 11, fontWeight: 900, textDecoration: 'underline', cursor: 'pointer' }}>{tr('Fechar', 'Close')}</button></p>
        </CMModal>
      )}
      {aberto === 'convoca' && paisEscolhido && (
        <CMModal>
          <ConvocacaoScreen pais={paisEscolhido} onBack={() => setAberto(null)} onDone={(xi, f) => {
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

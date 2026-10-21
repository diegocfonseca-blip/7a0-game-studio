// ─── ⚔️ CLÃS (21/10) ──────────────────────────────────────────────────────────────────────────────────────────────
// Aprovado pelo Diego em 19/10 ("pode fazer os clãs assim") e o ONDE APARECE em 21/10 ("ok pode fazer"). Mockups:
// `scripts/mockups/clas.png` (as telas) e `scripts/mockups/clas-onde-aparece.png` (o selo em cada lugar).
//
// · Regras (o BANCO decide tudo — `supabase/migrations/20261021040000_clas.sql`): criar = qualquer plano PAGO; entrar = todo
//   mundo; até 22 (21/10, era 20); 1 clã por vez; quem sai espera 7 dias; títulos ONLINE da semana somam pro clã; ranking zera segunda; o clã
//   campeão da semana passada leva 🏆 no selo; aberto (entra direto) ou fechado (pede, o líder aceita). Sem rivalidade.
// · O SELO é da PESSOA: sala de espera, chat, perfil e amigos — SEMPRE na linha de baixo do nome, pequeno, sem tirar nada do
//   lugar (escudo, presidente, cor do plano, medalha). Tabela/placar/jogo/leilão NUNCA mostram clã (lá é o clube).
// · Os selos vêm em LOTE (uma ida ao banco pra sala inteira) e ficam guardados na memória — nada de canal (regra do tráfego).
import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import { tr } from './lang'
import { Escudo } from './escudos'
import { clasLiberado } from './cla-gate' // a trava (CLAS_GERAL) mora lá
export { clasLiberado }
export const CLA_MAX = 22 // 👥 máximo de membros (21/10: "coloque 22"); o banco tem o MESMO número em esc_cla_cabe

const INK = '#0C0C0C', GOLD = '#FFC400', GREEN = '#1B7A3D', RED = '#E8503A', ROXO = '#7C3AED', CLA_OURO = '#E9C46A'
const OSW: CSSProperties = { fontFamily: 'Oswald, sans-serif', fontWeight: 800, textTransform: 'uppercase' }
const caixa: CSSProperties = { background: '#fff', border: `3px solid ${INK}`, borderRadius: 14, boxShadow: `3px 3px 0 ${INK}`, padding: 10, marginTop: 10, color: INK }
const h3: CSSProperties = { ...OSW, fontSize: 13, margin: '0 0 6px' }
const bt = (bg: string, cor: string): CSSProperties => ({ ...OSW, fontSize: 12, background: bg, color: cor, border: `2px solid ${INK}`, borderRadius: 9, padding: '6px 10px', boxShadow: `2px 2px 0 ${INK}`, cursor: 'pointer', whiteSpace: 'nowrap' })

// 🛡️ os emblemas prontos (o índice é o que o banco guarda: 'e:<n>')
export const EMBLEMAS: { ic: string; cor: string }[] = [
  { ic: '🔨', cor: ROXO }, { ic: '🦅', cor: '#C2452F' }, { ic: '🌳', cor: GREEN }, { ic: '🌙', cor: '#1C1C1C' },
  { ic: '⭐', cor: '#E8A900' }, { ic: '⚡', cor: '#2563EB' }, { ic: '🔥', cor: '#EA580C' }, { ic: '🛡️', cor: '#94A3B8' },
]
export function EmblemaCla({ emblema, size = 24 }: { emblema: string; size?: number }) {
  if (emblema.startsWith('escudo:')) return <span style={{ display: 'inline-flex', height: size, flex: 'none' }}><Escudo nome={emblema.slice(7)} size={size} /></span>
  const e = EMBLEMAS[Number(emblema.slice(2))] ?? EMBLEMAS[0]
  return <span style={{ width: size * 0.86, height: size, flex: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: e.cor, border: `${size > 30 ? 3 : 1.5}px solid ${INK}`, borderRadius: `${size * 0.2}px ${size * 0.2}px ${size * 0.45}px ${size * 0.45}px`, fontSize: size * 0.5, lineHeight: 1 }}>{e.ic}</span>
}

// ── selos por conta (lote) ──────────────────────────────────────────────────────────────────────────────────────
type SeloInfo = { id: number; nome: string; emblema: string; campeao: boolean }
const selos = new Map<string, SeloInfo | null>()
const fila = new Set<string>()
const ouvintes = new Set<() => void>()
let agendado: ReturnType<typeof setTimeout> | null = null
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
async function buscaLote() {
  agendado = null
  const uids = [...fila].slice(0, 60)
  if (!uids.length) return
  try {
    const { data, error } = await supabase.rpc('esc_clas_de', { p_uids: uids })
    if (error) throw error
    const achou = new Map(((data ?? []) as (SeloInfo & { uid: string })[]).map(r => [r.uid, { id: r.id, nome: r.nome, emblema: r.emblema, campeao: !!r.campeao }]))
    for (const u of uids) selos.set(u, achou.get(u) ?? null)
  } catch { for (const u of uids) selos.set(u, null) }
  uids.forEach(u => fila.delete(u))
  ouvintes.forEach(f => { try { f() } catch { /* ignora */ } })
  if (fila.size) agendado = setTimeout(buscaLote, 50)
}
/** depois de entrar/sair/criar, o MEU selo (e o dos outros) tem que mudar na hora */
export function esqueceClas() { selos.clear(); ouvintes.forEach(f => { try { f() } catch { /* ignora */ } }) }
export function useClaDe(uid: string | null | undefined): SeloInfo | null {
  const [, re] = useState(0)
  const ligado = !!uid && UUID.test(uid) && clasLiberado()
  useEffect(() => {
    if (!ligado || !uid) return
    const f = () => re(n => n + 1)
    ouvintes.add(f)
    if (!selos.has(uid) && !fila.has(uid)) { fila.add(uid); if (!agendado) agendado = setTimeout(buscaLote, 150) }
    return () => { ouvintes.delete(f) }
  }, [uid, ligado])
  return ligado && uid ? selos.get(uid) ?? null : null
}
/** 🏷️ a pílula do clã (linha de baixo do nome). Sem clã = nada — a linha fica igual a hoje. */
export function SeloCla({ uid, grande = false, mini = false }: { uid: string | null | undefined; grande?: boolean; mini?: boolean }) {
  const s = useClaDe(uid)
  if (!s) return null
  const h = grande ? 22 : mini ? 12 : 16 // mini = o do chat (21/10: "selo no chat pode ter mas ainda menor")
  return (
    <span title={tr(`Clã ${s.nome}`, `Clan ${s.nome}`)} style={{ display: 'inline-flex', alignItems: 'center', gap: mini ? 2 : 4, background: '#181818', color: CLA_OURO, border: `${mini ? 1 : 1.5}px solid ${INK}`, borderRadius: 999, padding: mini ? '0 5px 0 2px' : '0 7px 0 3px', height: h, ...OSW, fontWeight: 900, fontSize: grande ? 11 : mini ? 7.5 : 9, marginBottom: mini ? 3 : undefined, letterSpacing: '.04em', whiteSpace: 'nowrap', verticalAlign: 'middle', maxWidth: '100%', overflow: 'hidden', flex: 'none', alignSelf: 'flex-start', justifySelf: 'start', width: 'fit-content' }}>
      <EmblemaCla emblema={s.emblema} size={h - (mini ? 2 : 3)} />
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>⚔️ {s.nome}</span>{s.campeao && <span>🏆</span>}
    </span>
  )
}

// ── 👤 a caixinha do clã no PERFIL ───────────────────────────────────────────────────────────────────────────────
export function CaixaClaPerfil({ uid }: { uid: string }) {
  const s = useClaDe(uid)
  if (!s) return null
  return (
    <div style={{ marginTop: 10, background: 'linear-gradient(150deg,#262626,#0c0c0c)', color: '#fff', border: `3px solid ${INK}`, borderRadius: 14, boxShadow: `3px 3px 0 ${INK}`, padding: 10, display: 'flex', gap: 10, alignItems: 'center' }}>
      <EmblemaCla emblema={s.emblema} size={44} />
      <div style={{ minWidth: 0 }}>
        <p style={{ ...OSW, margin: 0, fontSize: 11, color: CLA_OURO }}>⚔️ {tr('Clã', 'Clan')}{s.campeao ? ` · 🏆 ${tr('campeão da semana', 'champion of the week')}` : ''}</p>
        <b style={{ ...OSW, fontSize: 17, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.nome}</b>
      </div>
    </div>
  )
}

// ── a aba ⚔️ Clã dos Amigos ─────────────────────────────────────────────────────────────────────────────────────
type ClaJson = { id: number; nome: string; emblema: string; aberto: boolean; lider: string; lider_nome: string; membros: number; titulos: number; campeao: boolean; pos?: number }
type Painel = {
  pode_criar: boolean; escudo: string | null; espera_ate: string | null
  cla: (ClaJson & { pos: number | null; lista: { uid: string; nome: string; titulos: number }[]; pedidos: { id: number; uid: string; nome: string }[] }) | null
  convites: (ClaJson & { pedido_id: number; de_nome: string })[]; pedi: number[]
}
const ERRO: Record<string, [string, string]> = {
  plano: ['Criar clã é de quem tem plano (⭐ Craque pra cima). Entrar num clã é de graça.', 'Creating a clan needs a plan (⭐ Star and up). Joining is free.'],
  tamanho: ['O nome do clã precisa ter de 3 a 20 letras.', 'The clan name needs 3 to 20 letters.'],
  ofensivo: ['Esse nome não é permitido: nada de preconceito no Leilão Legends.', 'That name is not allowed: no prejudice in Leilão Legends.'],
  nome_em_uso: ['Já existe um clã com esse nome. Tenta outro.', 'There is already a clan with that name. Try another.'],
  ja_tem: ['Você já está num clã. Saia dele antes.', 'You are already in a clan. Leave it first.'],
  espera: ['Quem sai de um clã só entra em outro depois de 7 dias.', 'After leaving a clan you can join another only after 7 days.'],
  lotado: [`Esse clã já tem ${CLA_MAX} membros.`, `That clan already has ${CLA_MAX} members.`],
  sem_escudo: ['Sua conta não tem escudo de clube (batismo).', 'Your account has no club crest (named club).'],
  sem_cla: ['Esse clã não existe mais.', 'That clan no longer exists.'],
}
const msgErro = (e: unknown) => { const k = String(e ?? ''); const m = ERRO[k]; return m ? tr(m[0], m[1]) : tr('Não deu agora. Tenta de novo.', 'Couldn’t do it now. Try again.') }
const dataCurta = (iso: string) => { const d = new Date(iso); return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}` }

export function AbaCla({ amigos, onPerfil }: { amigos: { uid: string; nome: string }[]; onPerfil: (uid: string) => void }) {
  const [p, setP] = useState<Painel | null | 'erro'>(null)
  const [msg, setMsg] = useState('')
  const [ocupado, setOcupado] = useState(false)
  const [tela, setTela] = useState<'inicio' | 'criar' | 'procurar' | 'ranking' | 'chamar'>('inicio')
  const carrega = () => { supabase.rpc('esc_cla_painel').then(({ data, error }) => setP(error || !data ? 'erro' : data as Painel), () => setP('erro')) }
  useEffect(carrega, [])
  const faz = async (rpc: string, args: Record<string, unknown>, ok?: string) => {
    setOcupado(true); setMsg('')
    try {
      const { data, error } = await supabase.rpc(rpc, args)
      const r = (data ?? {}) as { ok?: boolean; erro?: string; pedido?: boolean }
      if (error || !r.ok) setMsg(`⚠️ ${msgErro(r.erro)}`)
      else { setMsg(r.pedido ? tr('📨 Pedido enviado — o líder do clã decide.', '📨 Request sent — the clan leader decides.') : ok ?? ''); esqueceClas(); setTela('inicio') }
    } catch { setMsg(`⚠️ ${msgErro(null)}`) } finally { setOcupado(false); carrega() }
  }
  if (p === null) return <p style={{ textAlign: 'center', fontWeight: 800, margin: '20px 0' }}>{tr('carregando…', 'loading…')}</p>
  if (p === 'erro') return <p style={{ textAlign: 'center', fontWeight: 800, margin: '20px 0' }}>{tr('Não consegui abrir os clãs agora. Tenta de novo.', 'Couldn’t open clans right now. Try again.')}</p>
  const aviso = msg && <p style={{ ...caixa, background: msg.startsWith('⚠️') ? '#FFE3D6' : '#E9F7EE', fontSize: 12.5, fontWeight: 800 }}>{msg}</p>
  const voltar = <button style={{ ...bt('#fff', INK), marginTop: 10 }} onClick={() => setTela('inicio')}>‹ {tr('voltar', 'back')}</button>

  if (tela === 'criar') return <>{voltar}<CriarCla painel={p} ocupado={ocupado} onCriar={(nome, emblema, aberto) => void faz('esc_cla_criar', { p_nome: nome, p_emblema: emblema, p_aberto: aberto }, tr('⚔️ Clã criado! Chame seus amigos.', '⚔️ Clan created! Invite your friends.'))} />{aviso}</>
  if (tela === 'procurar') return <>{voltar}<ProcurarCla pedi={p.pedi} ocupado={ocupado || !!p.cla} onEntrar={id => void faz('esc_cla_entrar', { p_cla: id }, tr('✅ Você entrou no clã!', '✅ You joined the clan!'))} />{aviso}</>
  if (tela === 'ranking') return <>{voltar}<RankingClas meu={p.cla?.id ?? null} /></>
  if (tela === 'chamar' && p.cla) return <>{voltar}<ChamarAmigos amigos={amigos} meus={new Set(p.cla.lista.map(m => m.uid))} /></>

  const c = p.cla
  return <>
    {aviso}
    {p.convites.map(v => (
      <div key={v.pedido_id} style={{ ...caixa, background: '#EFE6FF', display: 'flex', gap: 10, alignItems: 'center' }}>
        <EmblemaCla emblema={v.emblema} size={34} />
        <div style={{ flex: 1, minWidth: 0, fontSize: 12.5, fontWeight: 700 }}><b>{v.de_nome}</b> {tr('te chamou pro clã', 'invited you to the clan')} <b>{v.nome}</b> ({v.membros}/{CLA_MAX})</div>
        <span style={{ display: 'flex', gap: 5 }}>
          <button disabled={ocupado || !!c} style={bt(GREEN, '#fff')} onClick={() => void faz('esc_cla_responder', { p_id: v.pedido_id, p_aceita: true }, tr('✅ Você entrou no clã!', '✅ You joined the clan!'))}>{tr('entrar', 'join')}</button>
          <button disabled={ocupado} style={bt('#fff', INK)} onClick={() => void faz('esc_cla_responder', { p_id: v.pedido_id, p_aceita: false })}>{tr('agora não', 'not now')}</button>
        </span>
      </div>
    ))}
    {c ? <>
      <div style={{ ...caixa, background: 'linear-gradient(150deg,#262626,#0c0c0c)', color: '#fff', display: 'flex', gap: 12, alignItems: 'center' }}>
        <EmblemaCla emblema={c.emblema} size={58} />
        <div style={{ minWidth: 0 }}>
          <b style={{ ...OSW, fontSize: 20, color: CLA_OURO, display: 'block', lineHeight: 1.05 }}>{c.nome}{c.campeao ? ' 🏆' : ''}</b>
          <span style={{ fontSize: 11.5, fontWeight: 700 }}>👑 {tr('líder', 'leader')}: {c.lider_nome} · {c.membros}/{CLA_MAX} · {c.aberto ? tr('🔓 aberto', '🔓 open') : tr('🔒 fechado', '🔒 closed')}</span>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6, marginTop: 8 }}>
        {[[c.pos ? `${c.pos}º` : '—', tr('na semana', 'this week')], [`${c.titulos} 🏆`, tr('do clã', 'clan')], [`${c.lista.find(m => m.uid === meuUid(c))?.titulos ?? 0} 🏆`, tr('seus', 'yours')]].map(([a, b]) => (
          <div key={b} style={{ background: '#fff', border: `2px solid ${INK}`, borderRadius: 10, textAlign: 'center', padding: 5 }}><b style={{ ...OSW, fontSize: 17 }}>{a}</b><br /><span style={{ fontSize: 10.5, fontWeight: 700 }}>{b}</span></div>
        ))}
      </div>
      {c.pedidos.length > 0 && <div style={{ ...caixa, background: '#FFF3C4' }}>
        <p style={h3}>📩 {tr('Pedidos pra entrar', 'Join requests')} ({c.pedidos.length})</p>
        {c.pedidos.map(x => <div key={x.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 0', borderTop: '1px dashed #d8ccaa' }}>
          <button onClick={() => onPerfil(x.uid)} style={{ flex: 1, textAlign: 'left', background: 'none', border: 'none', fontWeight: 800, fontSize: 13, color: INK, cursor: 'pointer' }}>{x.nome}</button>
          <button disabled={ocupado} style={bt(GREEN, '#fff')} onClick={() => void faz('esc_cla_responder', { p_id: x.id, p_aceita: true }, tr('✅ Aceito!', '✅ Accepted!'))}>{tr('aceitar', 'accept')}</button>
          <button disabled={ocupado} style={bt('#fff', INK)} onClick={() => void faz('esc_cla_responder', { p_id: x.id, p_aceita: false })}>{tr('recusar', 'decline')}</button>
        </div>)}
      </div>}
      <div style={caixa}>
        <p style={h3}>👥 {tr('Membros · quem mais somou na semana', 'Members · top this week')}</p>
        {c.lista.map((m, i) => <div key={m.uid} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', borderTop: i ? '1px dashed #d8ccaa' : 'none' }}>
          <span style={{ ...OSW, width: 26, textAlign: 'center' }}>{i < 3 && m.titulos > 0 ? ['🥇', '🥈', '🥉'][i] : `${i + 1}º`}</span>
          <button onClick={() => onPerfil(m.uid)} style={{ flex: 1, minWidth: 0, textAlign: 'left', background: 'none', border: 'none', fontWeight: 800, fontSize: 13, color: INK, cursor: 'pointer', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.nome}{m.uid === c.lider ? ' 👑' : ''}</button>
          <span style={{ ...OSW, fontSize: 14 }}>{m.titulos} 🏆</span>
          {souLider(c) && m.uid !== c.lider && <button disabled={ocupado} style={{ ...bt('#fff', RED), padding: '3px 7px', fontSize: 10 }} onClick={() => { if (window.confirm(tr(`Tirar ${m.nome} do clã?`, `Remove ${m.nome} from the clan?`))) void faz('esc_cla_tirar', { p_uid: m.uid }) }}>{tr('tirar', 'remove')}</button>}
        </div>)}
      </div>
      <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
        <button style={{ ...bt(ROXO, '#fff'), flex: 1 }} onClick={() => setTela('chamar')}>📣 {tr('Chamar amigo pro clã', 'Invite a friend')}</button>
        <button style={bt('#fff', INK)} onClick={() => setTela('ranking')}>🏆 {tr('Ranking', 'Ranking')}</button>
        {souLider(c) && <button disabled={ocupado} style={bt('#fff', INK)} onClick={() => void faz('esc_cla_aberto', { p_aberto: !c.aberto })}>{c.aberto ? tr('🔒 fechar', '🔒 close') : tr('🔓 abrir', '🔓 open')}</button>}
        <button disabled={ocupado} style={bt('#fff', RED)} onClick={() => { if (window.confirm(souLider(c) ? tr('Sair do clã? A liderança passa pro membro mais antigo (se você for o único, o clã fecha). Você só entra em outro clã daqui a 7 dias.', 'Leave the clan? Leadership goes to the oldest member (if you are alone, the clan closes). You can join another only in 7 days.') : tr('Sair do clã? Você só entra em outro clã daqui a 7 dias.', 'Leave the clan? You can join another only in 7 days.'))) void faz('esc_cla_sair', {}, tr('Você saiu do clã.', 'You left the clan.')) }}>{tr('sair', 'leave')}</button>
      </div>
      <p style={{ fontSize: 11, color: '#666', fontWeight: 700, margin: '8px 2px 0', lineHeight: 1.4 }}>{tr('Todo título que você ganha nas salas online soma pro clã. O clã campeão da semana leva 🏆 no selo de cada membro na semana seguinte. Conversa continua no zap.', 'Every title you win in online rooms adds to the clan. The champion clan of the week gets 🏆 on every member’s badge the following week. Chat stays on WhatsApp.')}</p>
    </> : <>
      <div style={{ ...caixa, textAlign: 'center' }}>
        <p style={{ fontSize: 34, margin: 0 }}>⚔️</p>
        <p style={{ ...OSW, fontSize: 16, margin: '2px 0 4px' }}>{tr('Você ainda não tem clã', 'You have no clan yet')}</p>
        <p style={{ fontSize: 12, fontWeight: 700, margin: 0, color: '#555' }}>{tr(`Até ${CLA_MAX} técnicos juntos: todo título online de cada um soma pro clã, e tem ranking da semana.`, `Up to ${CLA_MAX} managers together: every online title adds to the clan, with a weekly ranking.`)}</p>
        {p.espera_ate && <p style={{ fontSize: 12, fontWeight: 800, color: '#7a4d00', margin: '6px 0 0' }}>⏳ {tr(`Você saiu de um clã: pode entrar em outro a partir de ${dataCurta(p.espera_ate)}.`, `You left a clan: you can join another from ${dataCurta(p.espera_ate)}.`)}</p>}
      </div>
      <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
        <button style={{ ...bt(GREEN, '#fff'), flex: 1, padding: 10 }} onClick={() => setTela('procurar')}>🔎 {tr('Procurar clã', 'Find a clan')}</button>
        <button style={{ ...bt(p.pode_criar ? INK : '#ddd', p.pode_criar ? GOLD : '#777'), flex: 1, padding: 10 }} onClick={() => p.pode_criar ? setTela('criar') : setMsg(`⚠️ ${msgErro('plano')}`)}>⚔️ {tr('Criar clã', 'Create clan')}{p.pode_criar ? '' : ' 🔒'}</button>
      </div>
      <button style={{ ...bt('#fff', INK), width: '100%', marginTop: 8 }} onClick={() => setTela('ranking')}>🏆 {tr('Ranking dos clãs da semana', 'Clans of the week')}</button>
      <p style={{ fontSize: 11, color: '#666', fontWeight: 700, margin: '8px 2px 0', lineHeight: 1.4 }}>{tr('Criar clã: quem tem qualquer plano (⭐ Craque pra cima). Entrar num clã é de graça pra todo mundo.', 'Creating a clan: any plan (⭐ Star and up). Joining a clan is free for everyone.')}</p>
    </>}
  </>
}
// quem sou eu dentro do clã (o painel não manda o uid: acha pela sessão, guardada na 1ª leitura)
let meuUidAtual: string | null = null
supabase.auth.getUser().then(({ data }) => { meuUidAtual = data?.user?.id ?? null }, () => {})
supabase.auth.onAuthStateChange((_e, s) => { meuUidAtual = s?.user?.id ?? null; esqueceClas() })
const meuUid = (_c: unknown) => meuUidAtual
const souLider = (c: ClaJson) => !!meuUidAtual && c.lider === meuUidAtual

function CriarCla({ painel, ocupado, onCriar }: { painel: Painel; ocupado: boolean; onCriar: (nome: string, emblema: string, aberto: boolean) => void }) {
  const [nome, setNome] = useState('')
  const [emb, setEmb] = useState(painel.escudo ? 'escudo' : 'e:0')
  const [aberto, setAberto] = useState(true)
  const opcoes: [string, ReactNode][] = [
    ...EMBLEMAS.map((_, i): [string, ReactNode] => [`e:${i}`, <EmblemaCla emblema={`e:${i}`} size={34} />]),
  ]
  return <div style={caixa}>
    <p style={h3}>⚔️ {tr('Criar clã', 'Create clan')}</p>
    <p style={{ ...OSW, fontSize: 11, margin: '0 0 4px' }}>{tr('Nome do clã', 'Clan name')}</p>
    <input value={nome} onChange={e => setNome(e.target.value)} maxLength={20} placeholder={tr('ex.: Martelo de Ouro', 'e.g. Golden Hammer')}
      style={{ width: '100%', boxSizing: 'border-box', border: `2px solid ${INK}`, borderRadius: 9, padding: '8px 10px', fontSize: 14, fontWeight: 700, color: INK, background: '#fff' }} />
    <p style={{ fontSize: 10.5, fontWeight: 700, color: '#666', margin: '3px 0 8px' }}>{tr('até 20 letras · nome feio é barrado', 'up to 20 letters · offensive names are blocked')}</p>
    <p style={{ ...OSW, fontSize: 11, margin: '0 0 4px' }}>{tr('Emblema', 'Emblem')}</p>
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {painel.escudo && <button onClick={() => setEmb('escudo')} style={{ border: `3px solid ${emb === 'escudo' ? GOLD : 'transparent'}`, borderRadius: 10, background: emb === 'escudo' ? '#FFF3C4' : 'transparent', padding: 2, cursor: 'pointer' }}><EmblemaCla emblema={`escudo:${painel.escudo}`} size={34} /></button>}
      {opcoes.map(([k, el]) => <button key={k} onClick={() => setEmb(k)} style={{ border: `3px solid ${emb === k ? GOLD : 'transparent'}`, borderRadius: 10, background: emb === k ? '#FFF3C4' : 'transparent', padding: 2, cursor: 'pointer' }}>{el}</button>)}
    </div>
    {painel.escudo && <p style={{ fontSize: 11, fontWeight: 700, margin: '6px 0 0', background: '#FFF3C4', border: `2px solid ${INK}`, borderRadius: 8, padding: '5px 8px' }}>🖋 {tr(`Você pode usar o escudo do ${painel.escudo} como emblema do clã.`, `You can use the ${painel.escudo} crest as the clan emblem.`)}</p>}
    <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
      {[[true, tr('🔓 Aberto · entra direto', '🔓 Open · join directly')], [false, tr('🔒 Fechado · pede e você aceita', '🔒 Closed · they ask, you accept')]].map(([v, rot]) => (
        <button key={String(v)} onClick={() => setAberto(v as boolean)} style={{ ...bt(aberto === v ? INK : '#fff', aberto === v ? GOLD : INK), flex: 1, whiteSpace: 'normal', fontSize: 11 }}>{rot as string}</button>
      ))}
    </div>
    <button disabled={ocupado || nome.trim().length < 3} style={{ ...bt(GREEN, '#fff'), width: '100%', marginTop: 10, padding: 11, fontSize: 15, opacity: nome.trim().length < 3 ? .5 : 1 }} onClick={() => onCriar(nome, emb, aberto)}>⚔️ {tr('Criar clã', 'Create clan')}</button>
  </div>
}

function ProcurarCla({ pedi, ocupado, onEntrar }: { pedi: number[]; ocupado: boolean; onEntrar: (id: number) => void }) {
  const [q, setQ] = useState('')
  const [filtro, setFiltro] = useState<'vaga' | 'titulos' | 'batismo'>('vaga')
  const [lista, setLista] = useState<ClaJson[] | null>(null)
  useEffect(() => {
    const t = setTimeout(() => { supabase.rpc('esc_cla_lista', { p_q: q.trim(), p_filtro: filtro }).then(({ data }) => setLista((data ?? []) as ClaJson[]), () => setLista([])) }, 300)
    return () => clearTimeout(t)
  }, [q, filtro])
  return <div style={caixa}>
    <p style={h3}>🔎 {tr('Clãs disponíveis', 'Available clans')}</p>
    <input value={q} onChange={e => setQ(e.target.value)} maxLength={20} placeholder={tr('buscar pelo nome do clã…', 'search by clan name…')}
      style={{ width: '100%', boxSizing: 'border-box', border: `2px solid ${INK}`, borderRadius: 9, padding: '8px 10px', fontSize: 13.5, fontWeight: 700, color: INK, background: '#fff' }} />
    <div style={{ display: 'flex', gap: 5, margin: '8px 0' }}>
      {([['vaga', tr('com vaga', 'with room')], ['titulos', tr('mais títulos', 'most titles')], ['batismo', tr('🖋 batismo', '🖋 named club')]] as const).map(([k, rot]) => (
        <button key={k} onClick={() => setFiltro(k)} style={{ ...bt(filtro === k ? INK : '#fff', filtro === k ? GOLD : INK), padding: '4px 8px', fontSize: 11 }}>{rot}</button>
      ))}
    </div>
    {lista === null ? <p style={{ fontSize: 12, fontWeight: 700 }}>{tr('carregando…', 'loading…')}</p>
      : lista.length === 0 ? <p style={{ fontSize: 12, fontWeight: 700, color: '#666' }}>{tr('Nenhum clã por aqui ainda.', 'No clans here yet.')}</p>
      : lista.map(c => {
        const lotado = c.membros >= CLA_MAX, jaPedi = pedi.includes(c.id)
        return <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderTop: '1px dashed #d8ccaa' }}>
          <EmblemaCla emblema={c.emblema} size={30} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <b style={{ display: 'block', fontSize: 13.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.nome}{c.campeao ? ' 🏆' : ''}</b>
            <span style={{ fontSize: 10.5, fontWeight: 700, color: '#555' }}>{c.membros}/{CLA_MAX} · {c.titulos} 🏆 {tr('na semana', 'this week')} · {c.aberto ? tr('🔓 aberto', '🔓 open') : tr('🔒 pede pra entrar', '🔒 request to join')}</span>
          </div>
          {lotado ? <span style={{ ...bt('#eee', '#888'), cursor: 'default' }}>{tr('lotado', 'full')}</span>
            : jaPedi ? <span style={{ fontSize: 11, fontWeight: 800, color: '#888' }}>⏳ {tr('pedido', 'requested')}</span>
            : <button disabled={ocupado} style={bt(c.aberto ? GREEN : GOLD, c.aberto ? '#fff' : INK)} onClick={() => onEntrar(c.id)}>{c.aberto ? tr('entrar', 'join') : tr('pedir', 'ask')}</button>}
        </div>
      })}
  </div>
}

function RankingClas({ meu }: { meu: number | null }) {
  const [lista, setLista] = useState<ClaJson[] | null>(null)
  useEffect(() => { supabase.rpc('esc_cla_ranking').then(({ data }) => setLista((data ?? []) as ClaJson[]), () => setLista([])) }, [])
  return <div style={caixa}>
    <p style={h3}>🏆 {tr('Títulos no online · semana (zera segunda)', 'Online titles · this week (resets Monday)')}</p>
    {lista === null ? <p style={{ fontSize: 12, fontWeight: 700 }}>{tr('carregando…', 'loading…')}</p>
      : lista.length === 0 ? <p style={{ fontSize: 12, fontWeight: 700, color: '#666' }}>{tr('Nenhum clã ainda.', 'No clans yet.')}</p>
      : lista.map(c => <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 4px', borderTop: '1px dashed #d8ccaa', background: c.id === meu ? '#FFF3C4' : 'transparent', borderRadius: 6 }}>
        <span style={{ ...OSW, width: 26, textAlign: 'center' }}>{(c.pos ?? 99) <= 3 && c.titulos > 0 ? ['🥇', '🥈', '🥉'][(c.pos ?? 1) - 1] : `${c.pos}º`}</span>
        <EmblemaCla emblema={c.emblema} size={26} />
        <div style={{ flex: 1, minWidth: 0 }}><b style={{ display: 'block', fontSize: 13.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.nome}</b><span style={{ fontSize: 10.5, fontWeight: 700, color: '#555' }}>{c.membros}/{CLA_MAX} {tr('membros', 'members')}</span></div>
        <span style={{ ...OSW, fontSize: 15 }}>{c.titulos} 🏆</span>
      </div>)}
    <p style={{ fontSize: 10.5, color: '#777', fontWeight: 700, margin: '6px 0 0' }}>{tr('O clã campeão da semana joga a semana seguinte com 🏆 no selo de cada membro.', 'The champion clan plays the following week with 🏆 on every member’s badge.')}</p>
  </div>
}

function ChamarAmigos({ amigos, meus }: { amigos: { uid: string; nome: string }[]; meus: Set<string> }) {
  const [feito, setFeito] = useState<Record<string, string>>({})
  const chama = async (uid: string) => {
    setFeito(f => ({ ...f, [uid]: '…' }))
    const { data } = await supabase.rpc('esc_cla_convidar', { p_para: uid })
    const r = (data ?? {}) as { ok?: boolean; erro?: string }
    setFeito(f => ({ ...f, [uid]: r.ok ? tr('✅ chamado', '✅ invited') : r.erro === 'ja_tem' ? tr('já tem clã', 'has a clan') : tr('não deu', 'failed') }))
  }
  const lista = amigos.filter(a => !meus.has(a.uid))
  return <div style={caixa}>
    <p style={h3}>📣 {tr('Chamar amigo pro clã', 'Invite a friend')}</p>
    {lista.length === 0 ? <p style={{ fontSize: 12, fontWeight: 700, color: '#666' }}>{tr('Nenhum amigo fora do clã. Adicione amigos na aba 👥 Amigos.', 'No friends outside the clan. Add friends in the 👥 Friends tab.')}</p>
      : lista.map(a => <div key={a.uid} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderTop: '1px dashed #d8ccaa' }}>
        <b style={{ flex: 1, fontSize: 13.5 }}>{a.nome}</b>
        {feito[a.uid] ? <span style={{ fontSize: 11, fontWeight: 800 }}>{feito[a.uid]}</span> : <button style={bt(ROXO, '#fff')} onClick={() => void chama(a.uid)}>📣 {tr('chamar', 'invite')}</button>}
      </div>)}
    <p style={{ fontSize: 10.5, color: '#777', fontWeight: 700, margin: '6px 0 0' }}>{tr('O convite aparece na aba ⚔️ Clã dele. Quem é chamado entra direto, mesmo em clã fechado.', 'The invite shows in their ⚔️ Clan tab. Invited friends join directly, even in a closed clan.')}</p>
  </div>
}

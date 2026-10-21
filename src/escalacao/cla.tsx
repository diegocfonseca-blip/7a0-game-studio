// ─── ⚔️ CLÃS (21/10) ──────────────────────────────────────────────────────────────────────────────────────────────
// Aprovado pelo Diego em 19/10 ("pode fazer os clãs assim") e o ONDE APARECE em 21/10 ("ok pode fazer"). Mockups:
// `scripts/mockups/clas.png` (as telas) e `scripts/mockups/clas-onde-aparece.png` (o selo em cada lugar).
//
// · Regras (o BANCO decide tudo — `supabase/migrations/20261021040000_clas.sql`): criar = qualquer plano PAGO; entrar = todo
//   mundo; até 22 (21/10, era 20); 1 clã por vez; quem sai espera 3 dias (era 7 até 21/10); títulos ONLINE da semana somam pro clã; ranking zera segunda; o clã
//   campeão da semana passada leva 🏆 no selo; aberto (entra direto) ou fechado (pede, o líder aceita). Sem rivalidade.
// · O SELO é da PESSOA: sala de espera, chat, perfil e amigos — SEMPRE na linha de baixo do nome, pequeno, sem tirar nada do
//   lugar (escudo, presidente, cor do plano, medalha). Tabela/placar/jogo/leilão NUNCA mostram clã (lá é o clube).
// · Os selos vêm em LOTE (uma ida ao banco pra sala inteira) e ficam guardados na memória — nada de canal (regra do tráfego).
import { useCallback, useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import { tr } from './lang'
import { Escudo } from './escudos'
import { clasLiberado } from './cla-gate' // a trava (CLAS_GERAL) mora lá
import { ApoieButton } from './screens' // ⭐ quem não tem plano vai direto pros planos
import { PixMP, WHATSAPP_CONTATO, WHATSAPP_TXT } from './pix-mp' // 🛡️ escudo de clã personalizado (21/10)
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
type Bloco = ClaJson & { pos: number | null; lista: { uid: string; nome: string; titulos: number }[]; pedidos: { id: number; uid: string; nome: string }[] }
type Painel = {
  pode_criar: boolean; escudo: string | null; espera_ate: string | null
  cla: Bloco | null
  extra?: Bloco | null // ⚔️⚔️ 21/10: o 2º clã (comprado na Loja), do qual eu sou o presidente
  convites: (ClaJson & { pedido_id: number; de_nome: string })[]; pedi: number[]
}
const ERRO: Record<string, [string, string]> = {
  plano: ['Criar clã é de quem tem plano (⭐ Craque pra cima). Entrar num clã é de graça.', 'Creating a clan needs a plan (⭐ Star and up). Joining is free.'],
  tamanho: ['O nome do clã precisa ter de 3 a 20 letras.', 'The clan name needs 3 to 20 letters.'],
  ofensivo: ['Esse nome não é permitido: nada que ofenda alguém no Leilão Legends.', 'That name is not allowed: nothing offensive in Leilão Legends.'],
  nome_em_uso: ['Já existe um clã com esse nome. Tenta outro.', 'There is already a clan with that name. Try another.'],
  ja_tem: ['Você já está num clã. Saia dele antes.', 'You are already in a clan. Leave it first.'],
  espera: ['Quem sai ou troca de clã só entra em outro depois de 3 dias.', 'After leaving or switching clans you can join another only after 3 days.'],
  mesmo: ['Você já está nesse clã.', 'You are already in this clan.'],
  presidente: ['Você é o presidente do clã: passe a presidência ou feche o clã antes.', 'You are the clan president: hand over the presidency or close the clan first.'],
  sem_plano: ['Só dá pra passar a presidência pra quem tem plano.', 'You can only hand over the presidency to someone with a plan.'],
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
  // 👑 21/10 (Diego): presidente não vai pra outro clã nem sai sem antes passar a presidência (só pra quem tem plano) ou fechar o clã
  const [pres, setPres] = useState<{ destino?: string; seguir?: () => void } | null>(null)
  const [ver2, setVer2] = useState(false) // ⚔️⚔️ olhando o 2º clã (só aparece pra quem comprou)
  const [semPlano, setSemPlano] = useState(false) // 🔒 tocou em "Criar clã" sem plano → caixa explicando + botão dos planos
  // 🔁 21/10 (Diego): já tem clã e vai pra outro (convite ou pedido) → aviso lembrando do clã atual, pra seguir ou não
  const [troca, setTroca] = useState<{ info: TrocaInfo; destino: string; destinoEmblema: string; aberto: boolean; criar?: boolean; seguir: () => void } | null>(null)
  const carrega = () => { supabase.rpc('esc_cla_painel').then(({ data, error }) => setP(error || !data ? 'erro' : data as Painel), () => setP('erro')) }
  useEffect(carrega, [])
  const faz = async (rpc: string, args: Record<string, unknown>, ok?: string, destino?: { nome: string; emblema: string; aberto: boolean }) => {
    setOcupado(true); setMsg('')
    try {
      const { data, error } = await supabase.rpc(rpc, args)
      const r = (data ?? {}) as { ok?: boolean; erro?: string; pedido?: boolean } & Partial<TrocaInfo>
      if (!error && r.erro === 'confirmar' && destino && r.preso) setPres({ destino: destino.nome, seguir: () => { setPres(null); void faz(rpc, { ...args, p_trocar: true }, ok) } })
      else if (!error && r.erro === 'confirmar' && destino) setTroca({ info: r as TrocaInfo, destino: destino.nome, destinoEmblema: destino.emblema, aberto: destino.aberto, seguir: () => { setTroca(null); void faz(rpc, { ...args, p_trocar: true }, ok) } })
      else if (error || !r.ok) setMsg(`⚠️ ${msgErro(r.erro)}`)
      else { setMsg(r.pedido ? tr('📨 Pedido enviado — o presidente do clã decide.', '📨 Request sent — the clan president decides.') : ok ?? ''); esqueceClas(); setTela('inicio') }
    } catch { setMsg(`⚠️ ${msgErro(null)}`) } finally { setOcupado(false); carrega() }
  }
  if (p === null) return <p style={{ textAlign: 'center', fontWeight: 800, margin: '20px 0' }}>{tr('carregando…', 'loading…')}</p>
  if (p === 'erro') return <p style={{ textAlign: 'center', fontWeight: 800, margin: '20px 0' }}>{tr('Não consegui abrir os clãs agora. Tenta de novo.', 'Couldn’t open clans right now. Try again.')}</p>
  const aviso = msg && <p style={{ ...caixa, background: msg.startsWith('⚠️') ? '#FFE3D6' : '#E9F7EE', fontSize: 12.5, fontWeight: 800 }}>{msg}</p>
  const voltar = <button style={{ ...bt('#fff', INK), marginTop: 10 }} onClick={() => setTela('inicio')}>‹ {tr('voltar', 'back')}</button>

  if (tela === 'criar') return <>{voltar}<CriarCla painel={p} saindoDe={p.cla?.nome} ocupado={ocupado} onCriar={(nome, emblema, aberto) => void faz('esc_cla_criar', { p_nome: nome, p_emblema: emblema, p_aberto: aberto, p_trocar: !!p.cla }, tr('⚔️ Clã criado! Chame seus amigos.', '⚔️ Clan created! Invite your friends.'))} />{aviso}</>
  const modalTroca = <>{troca && <ConfirmaTroca {...troca} onFicar={() => setTroca(null)} />}
    {pres && p.cla && <ResolvePresidencia cla={p.cla.nome} destino={pres.destino} onFicar={() => setPres(null)}
      onPassou={() => { if (pres.seguir) pres.seguir(); else { setPres(null); void faz('esc_cla_sair', {}, tr('Presidência passada. Você saiu do clã.', 'Presidency handed over. You left the clan.')) } }}
      onFechou={() => { if (pres.seguir) pres.seguir(); else { setPres(null); esqueceClas(); setMsg(tr('🗑️ Clã fechado.', '🗑️ Clan closed.')); carrega() } }} />}</>
  if (tela === 'procurar') return <>{voltar}<ProcurarCla pedi={p.pedi} meu={p.cla?.id ?? null} ocupado={ocupado} onEntrar={k => void faz('esc_cla_entrar', { p_cla: k.id, p_trocar: false }, tr('✅ Você entrou no clã!', '✅ You joined the clan!'), k)} />{aviso}{modalTroca}</>
  if (tela === 'ranking') return <>{voltar}<RankingClas meu={p.cla?.id ?? null} /></>
  const ehExtra = ver2 && !!p.extra
  const c = ehExtra ? p.extra! : p.cla
  const alvo = ehExtra && c ? { p_cla: c.id } : {} // as ações do presidente valem pro clã que está na tela
  if (tela === 'chamar' && c) return <>{voltar}<ChamarAmigos amigos={amigos} meus={new Set(c.lista.map(m => m.uid))} cla={ehExtra ? c.id : undefined} /></>

  return <>
    {aviso}{modalTroca}
    {p.extra && <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
      {([[false, p.cla?.nome ?? tr('Sem clã de membro', 'No member clan')], [true, `${p.extra.nome} · 2º`]] as const).map(([v, rot]) => (
        <button key={String(v)} onClick={() => setVer2(v)} style={{ ...bt(ver2 === v ? INK : '#fff', ver2 === v ? GOLD : INK), flex: 1, padding: 8, fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis' }}>⚔️ {rot}</button>
      ))}
    </div>}
    {p.convites.map(v => (
      <div key={v.pedido_id} style={{ ...caixa, background: '#EFE6FF', display: 'flex', gap: 10, alignItems: 'center' }}>
        <EmblemaCla emblema={v.emblema} size={34} />
        <div style={{ flex: 1, minWidth: 0, fontSize: 12.5, fontWeight: 700 }}><b>{v.de_nome}</b> {tr('te chamou pro clã', 'invited you to the clan')} <b>{v.nome}</b> ({v.membros}/{CLA_MAX})</div>
        <span style={{ display: 'flex', gap: 5 }}>
          <button disabled={ocupado} style={bt(GREEN, '#fff')} onClick={() => void faz('esc_cla_responder', { p_id: v.pedido_id, p_aceita: true, p_trocar: false }, tr('✅ Você entrou no clã!', '✅ You joined the clan!'), { nome: v.nome, emblema: v.emblema, aberto: true })}>{tr('entrar', 'join')}</button>
          <button disabled={ocupado} style={bt('#fff', INK)} onClick={() => void faz('esc_cla_responder', { p_id: v.pedido_id, p_aceita: false })}>{tr('agora não', 'not now')}</button>
        </span>
      </div>
    ))}
    {c ? <>
      <div style={{ ...caixa, background: 'linear-gradient(150deg,#262626,#0c0c0c)', color: '#fff', display: 'flex', gap: 12, alignItems: 'center' }}>
        <EmblemaCla emblema={c.emblema} size={58} />
        <div style={{ minWidth: 0 }}>
          <b style={{ ...OSW, fontSize: 20, color: CLA_OURO, display: 'block', lineHeight: 1.05 }}>{c.nome}{c.campeao ? ' 🏆' : ''}</b>
          <span style={{ fontSize: 11.5, fontWeight: 700 }}>👑 {tr('presidente', 'president')}: {c.lider_nome} · {c.membros}/{CLA_MAX} · {c.aberto ? tr('🔓 aberto', '🔓 open') : tr('🔒 fechado', '🔒 closed')}</span>
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
          {souLider(c) && m.uid !== c.lider && <button disabled={ocupado} style={{ ...bt('#fff', RED), padding: '3px 7px', fontSize: 10 }} onClick={() => { if (window.confirm(tr(`Tirar ${m.nome} do clã?`, `Remove ${m.nome} from the clan?`))) void faz('esc_cla_tirar', { p_uid: m.uid, ...alvo }) }}>{tr('tirar', 'remove')}</button>}
        </div>)}
      </div>
      <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
        <button style={{ ...bt(ROXO, '#fff'), flex: 1 }} onClick={() => setTela('chamar')}>📣 {tr('Chamar amigo pro clã', 'Invite a friend')}</button>
        <button style={bt('#fff', INK)} onClick={() => setTela('ranking')}>🏆 {tr('Ranking', 'Ranking')}</button>
        {!ehExtra && <button style={bt('#fff', INK)} onClick={() => setTela('procurar')}>🔎 {tr('Outros clãs', 'Other clans')}</button>}
        {/* ⚔️ 21/10 (Diego): criar o seu estando em outro = sair do atual, com o mesmo aviso (presidente: passar ou fechar antes) */}
        {!ehExtra && <button style={bt('#fff', INK)} onClick={() => {
          if (!p.pode_criar) { setSemPlano(v => !v); return }
          if (souLider(c) && c.membros > 1) { setPres({ destino: tr('seu clã novo', 'your new clan'), seguir: () => { setPres(null); setTela('criar') } }); return }
          setTroca({ info: { erro: 'confirmar', atual: c.nome, atual_emblema: c.emblema, lider: souLider(c), sozinho: c.membros <= 1 }, destino: tr('seu clã novo', 'your new clan'), destinoEmblema: 'e:0', aberto: true, criar: true, seguir: () => { setTroca(null); setTela('criar') } })
        }}>⚔️ {tr('Criar meu clã', 'Create my clan')}</button>}
        {souLider(c) && <button disabled={ocupado} style={bt('#fff', INK)} onClick={() => void faz('esc_cla_aberto', { p_aberto: !c.aberto, ...alvo })}>{c.aberto ? tr('🔒 fechar', '🔒 close') : tr('🔓 abrir', '🔓 open')}</button>}
        {ehExtra && <button disabled={ocupado} style={bt('#fff', RED)} onClick={() => { if (window.confirm(tr(`Fechar o ${c.nome}? Todos os membros ficam sem clã (e podem entrar em outro na hora). O seu outro clã continua.`, `Close ${c.nome}? Every member is left without a clan (and can join another right away). Your other clan stays.`))) { setVer2(false); void faz('esc_cla_fechar', { p_cla: c.id }, tr('🗑️ Clã fechado.', '🗑️ Clan closed.')) } }}>🗑️ {tr('fechar este clã', 'close this clan')}</button>}
        {!ehExtra && <button disabled={ocupado} style={bt('#fff', RED)} onClick={() => {
          if (souLider(c) && c.membros > 1) { setPres({}); return }
          if (window.confirm(souLider(c) ? tr('Sair do clã? Você é o único: o clã fecha. Você só entra em outro clã daqui a 3 dias.', 'Leave the clan? You are the only one: the clan closes. You can join another only in 3 days.') : tr('Sair do clã? Você só entra em outro clã daqui a 3 dias.', 'Leave the clan? You can join another only in 3 days.'))) void faz('esc_cla_sair', {}, tr('Você saiu do clã.', 'You left the clan.'))
        }}>{tr('sair', 'leave')}</button>}
      </div>
      {semPlano && !p.pode_criar && <CriarSemPlano onProcurar={() => { setSemPlano(false); setTela('procurar') }} />}
      {souLider(c) && !ehExtra && <EscudoClaLoja />}
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
        <button style={{ ...bt(p.pode_criar ? INK : '#ddd', p.pode_criar ? GOLD : '#777'), flex: 1, padding: 10 }} onClick={() => p.pode_criar ? setTela('criar') : setSemPlano(v => !v)}>⚔️ {tr('Criar clã', 'Create clan')}{p.pode_criar ? '' : ' 🔒'}</button>
      </div>
      {semPlano && !p.pode_criar && <CriarSemPlano onProcurar={() => { setSemPlano(false); setTela('procurar') }} />}
      <button style={{ ...bt('#fff', INK), width: '100%', marginTop: 8 }} onClick={() => setTela('ranking')}>🏆 {tr('Ranking dos clãs da semana', 'Clans of the week')}</button>
      <p style={{ fontSize: 11, color: '#666', fontWeight: 700, margin: '8px 2px 0', lineHeight: 1.4 }}>{tr('Criar clã: quem tem qualquer plano (⭐ Craque pra cima). Entrar num clã é de graça pra todo mundo.', 'Creating a clan: any plan (⭐ Star and up). Joining a clan is free for everyone.')}</p>
    </>}
  </>
}
// 🔒⭐ quem NÃO tem plano tocou em "Criar clã" (21/10, Diego: "o que aparece pra ele pra criar clã e botão pra direcionar")
function CriarSemPlano({ onProcurar }: { onProcurar: () => void }) {
  return (
    <div style={{ ...caixa, background: 'linear-gradient(150deg,#262626,#0c0c0c)', color: '#fff', borderColor: INK, textAlign: 'center' }}>
      <p style={{ fontSize: 30, margin: 0 }}>⚔️🔒</p>
      <p style={{ ...OSW, fontSize: 17, margin: '2px 0 6px', color: CLA_OURO }}>{tr('Criar clã é de quem tem plano', 'Creating a clan needs a plan')}</p>
      <p style={{ fontSize: 12.5, fontWeight: 700, margin: '0 0 8px', lineHeight: 1.4, color: '#eee' }}>{tr(
        `Com qualquer plano (⭐ Craque, 👑 Lenda, 🖋 Batismo ou Fundador) você cria o seu clã, vira o presidente 👑 e chama até ${CLA_MAX - 1} amigos. Tem batismo? O clã pode nascer com o nome e o escudo do seu time.`,
        `With any plan (⭐ Star, 👑 Legend, 🖋 Named club or Founder) you create your clan, become the president 👑 and invite up to ${CLA_MAX - 1} friends. Got a named club? The clan can be born with your club's name and crest.`)}</p>
      <ApoieButton startScreen="choice" trigger={open => (
        <button onClick={open} style={{ ...bt(GOLD, INK), width: '100%', padding: 11, fontSize: 15 }}>⭐ {tr('Ver os planos', 'See the plans')}</button>
      )} />
      <button onClick={onProcurar} style={{ ...bt('#fff', INK), width: '100%', padding: 9, fontSize: 13, marginTop: 8 }}>🔎 {tr('Ou entre num clã — é de graça', 'Or join a clan — it’s free')}</button>
    </div>
  )
}
type TrocaInfo = { erro: 'confirmar'; atual: string; atual_emblema: string; lider: boolean; sozinho: boolean; preso?: boolean }
// 👑 o presidente quer sair/ir pra outro clã: antes, PASSAR a presidência (lista do clã; só quem tem plano pode receber) ou FECHAR o clã
function ResolvePresidencia({ cla, destino, onFicar, onPassou, onFechou }: { cla: string; destino?: string; onFicar: () => void; onPassou: () => void; onFechou: () => void }) {
  const [lista, setLista] = useState<{ uid: string; nome: string; plano: boolean }[] | null>(null)
  const [escolha, setEscolha] = useState<string | null>(null)
  const [erro, setErro] = useState('')
  const [ocupado, setOcupado] = useState(false)
  const abreLista = () => { setLista([]); supabase.rpc('esc_cla_membros_plano').then(({ data }) => setLista((data ?? []) as { uid: string; nome: string; plano: boolean }[]), () => setErro(msgErro(null))) }
  const chama = async (rpc: string, args: Record<string, unknown>, depois: () => void) => {
    setOcupado(true); setErro('')
    try { const { data, error } = await supabase.rpc(rpc, args); const r = (data ?? {}) as { ok?: boolean; erro?: string }; if (error || !r.ok) setErro(msgErro(r.erro)); else { esqueceClas(); depois() } }
    catch { setErro(msgErro(null)) } finally { setOcupado(false) }
  }
  const algumComPlano = !!lista?.some(m => m.plano)
  return (
    <div role="dialog" aria-modal="true" onClick={onFicar} style={{ position: 'fixed', inset: 0, zIndex: 9000, background: 'rgba(12,12,12,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 380, maxHeight: '90vh', overflowY: 'auto', background: '#F4ECD6', color: INK, border: `4px solid ${INK}`, borderRadius: 18, boxShadow: `5px 5px 0 ${INK}`, padding: 16 }}>
        <p style={{ fontSize: 40, margin: 0, textAlign: 'center' }}>👑</p>
        <p style={{ ...OSW, fontSize: 19, margin: '0 0 8px', textAlign: 'center' }}>{tr(`Você é o presidente do ${cla}`, `You are the president of ${cla}`)}</p>
        <p style={{ fontSize: 13, fontWeight: 800, margin: '0 0 12px', lineHeight: 1.35, textAlign: 'center' }}>{destino
          ? tr(`Presidente não participa de outro clã. Pra ir pro ${destino}, escolha antes:`, `A president can’t be in another clan. To go to ${destino}, first choose:`)
          : tr('Pra sair do clã, escolha antes:', 'To leave the clan, first choose:')}</p>
        {lista === null ? <>
          <button onClick={abreLista} style={{ ...bt(GOLD, INK), width: '100%', padding: 11, fontSize: 14, whiteSpace: 'normal' }}>👑 {tr('Passar a presidência', 'Hand over the presidency')}</button>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#666', margin: '4px 2px 10px' }}>{tr('Só pra quem do clã tem plano (⭐ Craque pra cima). O clã continua, com tudo dele.', 'Only to a clan member with a plan (⭐ Star and up). The clan stays, with everything.')}</p>
          <button disabled={ocupado} onClick={() => { if (window.confirm(tr(`Fechar o ${cla}? Todos os membros ficam sem clã (e podem entrar em outro na hora).`, `Close ${cla}? Every member is left without a clan (and can join another right away).`))) void chama('esc_cla_fechar', {}, onFechou) }} style={{ ...bt('#fff', RED), width: '100%', padding: 10, fontSize: 13, whiteSpace: 'normal' }}>🗑️ {tr(`Fechar o ${cla}`, `Close ${cla}`)}</button>
        </> : <div style={{ background: '#fff', border: `3px solid ${INK}`, borderRadius: 12, padding: '6px 10px' }}>
          <p style={{ ...OSW, fontSize: 12, margin: '2px 0 4px' }}>{tr('Quem vai ser o novo presidente?', 'Who will be the new president?')}</p>
          {lista.map((m, i) => <button key={m.uid} disabled={!m.plano} onClick={() => setEscolha(m.uid)} style={{ display: 'flex', width: '100%', alignItems: 'center', gap: 8, padding: '8px 4px', border: 'none', borderTop: i ? '1px dashed #d8ccaa' : 'none', background: escolha === m.uid ? '#FFF3C4' : 'transparent', cursor: m.plano ? 'pointer' : 'default', opacity: m.plano ? 1 : .45, textAlign: 'left', color: INK }}>
            <span style={{ fontSize: 16 }}>{escolha === m.uid ? '👑' : m.plano ? '⚪' : '🔒'}</span>
            <b style={{ flex: 1, fontSize: 13.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.nome}</b>
            <span style={{ fontSize: 10.5, fontWeight: 800, color: m.plano ? GREEN : '#888' }}>{m.plano ? tr('tem plano', 'has a plan') : tr('sem plano', 'no plan')}</span>
          </button>)}
          {lista.length > 0 && !algumComPlano && <p style={{ fontSize: 11.5, fontWeight: 800, color: '#7a4d00', margin: '6px 0' }}>{tr('Ninguém do clã tem plano ainda. Pra sair agora, só fechando o clã.', 'Nobody in the clan has a plan yet. To leave now, you have to close the clan.')}</p>}
          <button disabled={!escolha || ocupado} onClick={() => escolha && void chama('esc_cla_passar', { p_para: escolha }, onPassou)} style={{ ...bt(GREEN, '#fff'), width: '100%', padding: 10, fontSize: 13, margin: '8px 0 4px', opacity: escolha ? 1 : .5, whiteSpace: 'normal' }}>{destino ? tr(`✅ Passar e ir pro ${destino}`, `✅ Hand over and go to ${destino}`) : tr('✅ Passar e sair', '✅ Hand over and leave')}</button>
        </div>}
        {erro && <p style={{ fontSize: 12, fontWeight: 800, color: RED, margin: '8px 0 0' }}>⚠️ {erro}</p>}
        <button onClick={onFicar} style={{ ...bt('#fff', INK), width: '100%', padding: 10, fontSize: 13, marginTop: 10, whiteSpace: 'normal' }}>{tr(`Não, continuar presidente do ${cla}`, `No, stay president of ${cla}`)}</button>
      </div>
    </div>
  )
}
// 🔁 o aviso de troca (21/10): o clã de agora × o novo, o que acontece com a liderança, a espera de 3 dias e os dois botões
function ConfirmaTroca({ info, destino, destinoEmblema, aberto, criar, seguir, onFicar }: { info: TrocaInfo; destino: string; destinoEmblema: string; aberto: boolean; criar?: boolean; seguir: () => void; onFicar: () => void }) {
  return (
    <div role="dialog" aria-modal="true" onClick={onFicar} style={{ position: 'fixed', inset: 0, zIndex: 9000, background: 'rgba(12,12,12,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 380, background: '#F4ECD6', color: INK, border: `4px solid ${INK}`, borderRadius: 18, boxShadow: `5px 5px 0 ${INK}`, padding: 16 }}>
        <p style={{ ...OSW, fontSize: 19, margin: '0 0 10px', textAlign: 'center' }}>⚔️ {tr('Trocar de clã?', 'Switch clans?')}</p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
          <div style={{ textAlign: 'center', width: 120 }}><EmblemaCla emblema={info.atual_emblema} size={48} /><b style={{ ...OSW, display: 'block', fontSize: 13, marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{info.atual}</b><span style={{ fontSize: 10.5, fontWeight: 800, color: '#7a6b4a' }}>{tr('seu clã agora', 'your clan now')}</span></div>
          <span style={{ ...OSW, fontSize: 24 }}>➜</span>
          <div style={{ textAlign: 'center', width: 120 }}><EmblemaCla emblema={destinoEmblema} size={48} /><b style={{ ...OSW, display: 'block', fontSize: 13, marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{destino}</b><span style={{ fontSize: 10.5, fontWeight: 800, color: '#7a6b4a' }}>{tr('novo clã', 'new clan')}</span></div>
        </div>
        <p style={{ fontSize: 13, fontWeight: 800, margin: '12px 0 6px', lineHeight: 1.35 }}>{tr(`Você já participa do clã ${info.atual}.`, `You are already in the ${info.atual} clan.`)} {criar
          ? tr(`Pra criar o seu clã, você sai do ${info.atual}.`, `To create your own clan, you leave ${info.atual}.`)
          : aberto
          ? tr(`Se seguir, você sai do ${info.atual} e entra no ${destino}.`, `If you go on, you leave ${info.atual} and join ${destino}.`)
          : tr(`Se seguir, o pedido vai pro presidente do ${destino}. Quando ele aceitar, você sai do ${info.atual} na hora.`, `If you go on, the request goes to the ${destino} president. When they accept, you leave ${info.atual} right away.`)}</p>
        {info.lider && <p style={{ fontSize: 12, fontWeight: 700, margin: '0 0 6px', background: '#FFF3C4', border: `2px solid ${INK}`, borderRadius: 9, padding: '6px 8px' }}>👑 {info.sozinho
          ? tr(`Você é o único do ${info.atual}: ele fecha.`, `You are the only one in ${info.atual}: it closes.`)
          : tr(`Você é o presidente: antes, passe a presidência ou feche o clã.`, `You are the president: first hand over the presidency or close the clan.`)}</p>}
        <p style={{ fontSize: 11.5, fontWeight: 700, color: '#7a4d00', margin: '0 0 12px' }}>⏳ {tr('Depois de trocar, você só troca de novo daqui a 3 dias.', 'After switching, you can switch again only in 3 days.')}</p>
        <button onClick={seguir} style={{ ...bt(GREEN, '#fff'), width: '100%', padding: 11, fontSize: 14, whiteSpace: 'normal' }}>{criar ? tr(`✅ Sim, sair e criar o meu`, `✅ Yes, leave and create mine`) : aberto ? tr(`✅ Sim, ir pro ${destino}`, `✅ Yes, go to ${destino}`) : tr(`📨 Sim, pedir pra entrar no ${destino}`, `📨 Yes, ask to join ${destino}`)}</button>
        <button onClick={onFicar} style={{ ...bt('#fff', INK), width: '100%', padding: 10, fontSize: 13, marginTop: 8, whiteSpace: 'normal' }}>{tr(`Não, ficar no ${info.atual}`, `No, stay in ${info.atual}`)}</button>
      </div>
    </div>
  )
}
// quem sou eu dentro do clã (o painel não manda o uid: acha pela sessão, guardada na 1ª leitura)
let meuUidAtual: string | null = null
supabase.auth.getUser().then(({ data }) => { meuUidAtual = data?.user?.id ?? null }, () => {})
supabase.auth.onAuthStateChange((_e, s) => { meuUidAtual = s?.user?.id ?? null; esqueceClas() })
const meuUid = (_c: unknown) => meuUidAtual
const souLider = (c: ClaJson) => !!meuUidAtual && c.lider === meuUidAtual

function CriarCla({ painel, saindoDe, ocupado, onCriar }: { painel: Painel; saindoDe?: string; ocupado: boolean; onCriar: (nome: string, emblema: string, aberto: boolean) => void }) {
  const [nome, setNome] = useState('')
  // 🖋 21/10 (Diego): quem tem batismo pode criar o clã DO TIME — nome E escudo do batismo, juntos (nunca o escudo com outro nome)
  const [batismo, setBatismo] = useState(!!painel.escudo && !saindoDe)
  const [emb, setEmb] = useState('e:0')
  const [aberto, setAberto] = useState(true)
  const opcoes: [string, ReactNode][] = [
    ...EMBLEMAS.map((_, i): [string, ReactNode] => [`e:${i}`, <EmblemaCla emblema={`e:${i}`} size={34} />]),
  ]
  return <div style={caixa}>
    <p style={h3}>⚔️ {tr('Criar clã', 'Create clan')}</p>
    {saindoDe && <p style={{ fontSize: 12, fontWeight: 800, margin: '0 0 8px', background: '#FFE3D6', border: `2px solid ${INK}`, borderRadius: 9, padding: '6px 8px' }}>🚪 {tr(`Ao criar, você sai do ${saindoDe}.`, `When you create it, you leave ${saindoDe}.`)}</p>}
    {painel.escudo && <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
      {([[true, <><EmblemaCla emblema={`escudo:${painel.escudo}`} size={30} /><span>🖋 {tr(`Clã do ${painel.escudo}`, `${painel.escudo} clan`)}</span></>], [false, <span>⚔️ {tr('Clã com outro nome', 'Clan with another name')}</span>]] as const).map(([v, rot]) => (
        <button key={String(v)} onClick={() => setBatismo(v)} style={{ ...bt(batismo === v ? INK : '#fff', batismo === v ? GOLD : INK), flex: 1, whiteSpace: 'normal', fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>{rot}</button>
      ))}
    </div>}
    {batismo && painel.escudo ? <p style={{ fontSize: 12, fontWeight: 800, margin: '0 0 8px', background: '#FFF3C4', border: `2px solid ${INK}`, borderRadius: 9, padding: '6px 8px' }}>🖋 {tr(`O clã nasce com o NOME e o ESCUDO do seu batismo: ${painel.escudo}.`, `The clan is born with your named club's NAME and CREST: ${painel.escudo}.`)}{saindoDe ? tr(` Quer ele como 2º clã (sem sair do ${saindoDe})? É na 🛒 Loja.`, ` Want it as a 2nd clan (without leaving ${saindoDe})? It's in the 🛒 Shop.`) : ''}</p> : <>
    <p style={{ ...OSW, fontSize: 11, margin: '0 0 4px' }}>{tr('Nome do clã', 'Clan name')}</p>
    <input value={nome} onChange={e => setNome(e.target.value)} maxLength={20} placeholder={tr('ex.: Martelo de Ouro', 'e.g. Golden Hammer')}
      style={{ width: '100%', boxSizing: 'border-box', border: `2px solid ${INK}`, borderRadius: 9, padding: '8px 10px', fontSize: 14, fontWeight: 700, color: INK, background: '#fff' }} />
    <p style={{ fontSize: 10.5, fontWeight: 700, color: '#666', margin: '3px 0 8px' }}>{tr('até 20 letras · nome feio é barrado', 'up to 20 letters · offensive names are blocked')}</p>
    <p style={{ ...OSW, fontSize: 11, margin: '0 0 4px' }}>{tr('Emblema', 'Emblem')}</p>
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {opcoes.map(([k, el]) => <button key={k} onClick={() => setEmb(k)} style={{ border: `3px solid ${emb === k ? GOLD : 'transparent'}`, borderRadius: 10, background: emb === k ? '#FFF3C4' : 'transparent', padding: 2, cursor: 'pointer' }}>{el}</button>)}
    </div>
    </>}
    <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
      {[[true, tr('🔓 Aberto · entra direto', '🔓 Open · join directly')], [false, tr('🔒 Fechado · pede e você aceita', '🔒 Closed · they ask, you accept')]].map(([v, rot]) => (
        <button key={String(v)} onClick={() => setAberto(v as boolean)} style={{ ...bt(aberto === v ? INK : '#fff', aberto === v ? GOLD : INK), flex: 1, whiteSpace: 'normal', fontSize: 11 }}>{rot as string}</button>
      ))}
    </div>
    <button disabled={ocupado || (!batismo && nome.trim().length < 3)} style={{ ...bt(GREEN, '#fff'), width: '100%', marginTop: 10, padding: 11, fontSize: 15, opacity: !batismo && nome.trim().length < 3 ? .5 : 1 }} onClick={() => onCriar(batismo && painel.escudo ? painel.escudo : nome, batismo && painel.escudo ? 'escudo' : emb, aberto)}>⚔️ {tr('Criar clã', 'Create clan')}</button>
  </div>
}

function ProcurarCla({ pedi, meu, ocupado, onEntrar }: { pedi: number[]; meu: number | null; ocupado: boolean; onEntrar: (c: ClaJson) => void }) {
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
          {c.id === meu ? <span style={{ fontSize: 11, fontWeight: 800, color: GREEN }}>✅ {tr('seu clã', 'your clan')}</span>
            : lotado ? <span style={{ ...bt('#eee', '#888'), cursor: 'default' }}>{tr('lotado', 'full')}</span>
            : jaPedi ? <span style={{ fontSize: 11, fontWeight: 800, color: '#888' }}>⏳ {tr('pedido', 'requested')}</span>
            : <button disabled={ocupado} style={bt(c.aberto ? GREEN : GOLD, c.aberto ? '#fff' : INK)} onClick={() => onEntrar(c)}>{c.aberto ? tr('entrar', 'join') : tr('pedir', 'ask')}</button>}
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

function ChamarAmigos({ amigos, meus, cla }: { amigos: { uid: string; nome: string }[]; meus: Set<string>; cla?: number }) {
  const [feito, setFeito] = useState<Record<string, string>>({})
  const chama = async (uid: string) => {
    setFeito(f => ({ ...f, [uid]: '…' }))
    const { data } = await supabase.rpc('esc_cla_convidar', cla ? { p_para: uid, p_cla: cla } : { p_para: uid })
    const r = (data ?? {}) as { ok?: boolean; erro?: string }
    setFeito(f => ({ ...f, [uid]: r.ok ? tr('✅ chamado', '✅ invited') : r.erro === 'mesmo' ? tr('já está no clã', 'already in') : tr('não deu', 'failed') }))
  }
  const lista = amigos.filter(a => !meus.has(a.uid))
  return <div style={caixa}>
    <p style={h3}>📣 {tr('Chamar amigo pro clã', 'Invite a friend')}</p>
    {lista.length === 0 ? <p style={{ fontSize: 12, fontWeight: 700, color: '#666' }}>{tr('Nenhum amigo fora do clã. Adicione amigos na aba 👥 Amigos.', 'No friends outside the clan. Add friends in the 👥 Friends tab.')}</p>
      : lista.map(a => <div key={a.uid} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderTop: '1px dashed #d8ccaa' }}>
        <b style={{ flex: 1, fontSize: 13.5 }}>{a.nome}</b>
        {feito[a.uid] ? <span style={{ fontSize: 11, fontWeight: 800 }}>{feito[a.uid]}</span> : <button style={bt(ROXO, '#fff')} onClick={() => void chama(a.uid)}>📣 {tr('chamar', 'invite')}</button>}
      </div>)}
    <p style={{ fontSize: 10.5, color: '#777', fontWeight: 700, margin: '6px 0 0' }}>{tr('O convite aparece na aba ⚔️ Clã dele. Quem é chamado entra direto, mesmo em clã fechado. Se ele já tiver clã, o jogo pergunta se quer trocar.', 'The invite shows in their ⚔️ Clan tab. Invited friends join directly, even in a closed clan. If they already have a clan, the game asks if they want to switch.')}</p>
  </div>
}

// ── 🛡️ ESCUDO DE CLÃ PERSONALIZADO (21/10, Diego: "valor 19,99… depois que a pessoa pagar ela manda WhatsApp pra mim pra eu
// fazer… e ela bota nome do clã e ideia"; pronto em até 24 h). Mora na 🛒 Loja (e no clã do presidente). Só o PRESIDENTE compra
// (o banco devolve preço nulo pra quem não é). O nome, a ideia e o botão do zap só aparecem DEPOIS do Pix confirmado.
type EscudoPedido = { id: string; produto: 'escudo_cla' | 'cla_extra'; nome: string | null; ideia: string | null; pronto: boolean }
type ProdutoCla = 'escudo_cla' | 'cla_extra'
export function EscudoClaLoja() {
  const [cla, setCla] = useState<{ nome: string; presidente: boolean; temExtra: boolean; batismo: string | null } | null | 'carregando'>('carregando')
  const [meus, setMeus] = useState<EscudoPedido[]>([])
  const [comprando, setComprando] = useState<ProdutoCla | null>(null)
  const carrega = useCallback(() => {
    supabase.rpc('esc_cla_painel').then(({ data }) => {
      const pn = data as Painel | null, c = pn?.cla
      setCla(c ? { nome: c.nome, presidente: souLider(c), temExtra: !!pn?.extra, batismo: pn?.escudo ?? null } : null)
    }, () => setCla(null))
    supabase.rpc('esc_cla_escudo_meus2').then(({ data }) => setMeus((data ?? []) as EscudoPedido[]), () => {})
  }, [])
  useEffect(carrega, [carrega])
  if (!clasLiberado()) return null
  const info = cla === 'carregando' ? null : cla
  const presidente = !!info?.presidente
  const aberto = (prod: ProdutoCla) => meus.some(m => m.produto === prod && !m.pronto)
  // ⚔️⚔️ o 2º clã só pra quem é presidente e ainda não tem o 2º (o banco confere de novo: preço nulo pra quem não pode)
  const ofertas: { prod: ProdutoCla; titulo: [string, string]; texto: [string, string]; pode: boolean; porque: [string, string] }[] = [
    { prod: 'escudo_cla', titulo: ['🛡️ Escudo de clã personalizado', '🛡️ Custom clan crest'],
      texto: ['Desenho exclusivo, feito à mão pro SEU clã. Aparece no selo de todos os membros, no ranking e no telão. Fica pronto em até 24 h.', 'An exclusive crest, hand-made for YOUR clan. Shows on every member’s badge, in the ranking and on the big screen. Ready within 24 h.'],
      pode: presidente, porque: info ? [`Só o presidente do ${info.nome} pode encomendar o escudo.`, `Only the ${info.nome} president can order the crest.`] : ['Pra encomendar, você precisa ser presidente de um clã (👥 Amigos → ⚔️ Clã).', 'To order, you need to be a clan president (👥 Friends → ⚔️ Clan).'] },
    // 🖋 21/10 (Diego, caso do Tricolor do Arruda): quem tem BATISMO ganha como 2º clã o próprio time do batismo, e o escudo
    // personalizado vai pro clã que ele já tem
    info?.batismo ? { prod: 'cla_extra' as ProdutoCla, titulo: ['⚔️⚔️ Seu batismo como 2º clã + escudo personalizado', '⚔️⚔️ Your named club as 2nd clan + custom crest'] as [string, string],
      texto: [`Cada conta cria 1 clã. Com este, o ${info.batismo} vira o seu 2º clã (com o escudo do batismo) e o ${info.nome} ganha escudo feito à mão (pronto em até 24 h). Você vira presidente dos dois e seus títulos somam nos dois.`,
        `Each account creates 1 clan. With this, ${info.batismo} becomes your 2nd clan (with the named-club crest) and ${info.nome} gets a hand-made crest (ready within 24 h). You preside over both and your titles count for both.`] as [string, string],
      pode: presidente && !info.temExtra,
      porque: (info.temExtra ? ['Você já é presidente de 2 clãs (o máximo).', 'You are already president of 2 clans (the max).'] : ['Pra comprar o 2º clã, você precisa ser presidente do seu clã.', 'To buy a 2nd clan, you need to be president of your clan.']) as [string, string] } :
    { prod: 'cla_extra', titulo: ['⚔️⚔️ 2º clã + escudo personalizado', '⚔️⚔️ 2nd clan + custom crest'],
      texto: ['Cada conta cria 1 clã. Com este, você vira presidente de DOIS — o novo já nasce com escudo feito à mão (pronto em até 24 h). Seus títulos somam nos dois.', 'Each account creates 1 clan. With this you become president of TWO — the new one comes with a hand-made crest (ready within 24 h). Your titles count for both.'],
      pode: presidente && !!info && !info.temExtra,
      porque: info?.temExtra ? ['Você já é presidente de 2 clãs (o máximo).', 'You are already president of 2 clans (the max).'] : ['Pra comprar o 2º clã, você precisa ser presidente do seu clã.', 'To buy a 2nd clan, you need to be president of your clan.'] },
  ]
  return <>
    {ofertas.map(o => (
      <div key={o.prod} id={o.prod === 'escudo_cla' ? 'loja-escudo-cla' : 'loja-cla-extra'} style={{ ...caixa, background: 'linear-gradient(150deg,#262626,#0c0c0c)', color: '#fff' }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {o.prod === 'escudo_cla' ? <><EmblemaCla emblema="e:0" size={46} /><span style={{ fontSize: 20 }}>➜</span><span style={{ fontSize: 40, lineHeight: 1 }}>🛡️</span></>
            : <><EmblemaCla emblema={info?.batismo ? `escudo:${info.batismo}` : 'e:5'} size={46} /><span style={{ fontSize: 22 }}>＋</span><EmblemaCla emblema="e:0" size={46} /></>}
          <div style={{ flex: 1, minWidth: 0 }}>
            <b style={{ ...OSW, fontSize: 17, color: CLA_OURO, display: 'block', lineHeight: 1.05 }}>{tr(o.titulo[0], o.titulo[1])}</b>
            <small style={{ fontSize: 11.5, fontWeight: 700, color: '#ddd', display: 'block', lineHeight: 1.3, marginTop: 3 }}>{tr(o.texto[0], o.texto[1])}</small>
          </div>
        </div>
        {meus.filter(m => m.produto === o.prod && !m.pronto).map(m => <EscudoDepoisDoPix key={m.id} pedido={m} aoSalvar={carrega} batismo={info?.batismo ?? null} principal={info?.nome ?? null} />)}
        {meus.filter(m => m.produto === o.prod && m.pronto).map(m => <p key={m.id} style={{ fontSize: 12.5, fontWeight: 800, color: '#9be3b1', margin: '10px 0 0' }}>✅ {tr(`Escudo do ${m.nome} pronto! Já está no clã.`, `${m.nome} crest is ready! It is already on the clan.`)}</p>)}
        {aberto(o.prod) ? null : comprando !== o.prod ? <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
            <span style={{ ...OSW, fontSize: 26, color: GOLD }}>R$ 19,99</span>
            <span style={{ fontSize: 11, fontWeight: 800, color: '#bbb' }}>{tr('Pix · pagamento único', 'Pix · one-time payment')}</span>
          </div>
          <button disabled={!o.pode} onClick={() => setComprando(o.prod)} style={{ ...bt(o.pode ? GOLD : '#555', o.pode ? INK : '#aaa'), width: '100%', padding: 11, fontSize: 15, marginTop: 8 }}>💳 {tr('Pagar no Pix', 'Pay with Pix')}</button>
          {cla !== 'carregando' && !o.pode && <p style={{ fontSize: 11, fontWeight: 700, color: '#bbb', margin: '6px 0 0' }}>🔒 {tr(o.porque[0], o.porque[1])}</p>}
        </> : <div style={{ marginTop: 10, background: '#fff', color: INK, borderRadius: 12, padding: 8 }}><PixMP produto={o.prod} valor={19.99} aoPagar={() => { setComprando(null); carrega() }} /></div>}
      </div>
    ))}
  </>
}
// depois do Pix: nome (do clã que já existe, ou do 2º clã que vai nascer) + ideia → botão do zap do Diego com tudo escrito
function EscudoDepoisDoPix({ pedido, aoSalvar, batismo, principal }: { pedido: EscudoPedido; aoSalvar: () => void; batismo: string | null; principal: string | null }) {
  const extra = pedido.produto === 'cla_extra'
  const doBatismo = extra && !!batismo // 🖋 o 2º clã é o time do batismo; o escudo feito à mão vai pro clã que ele já tem
  const [nome, setNome] = useState(pedido.nome ?? '')
  const [ideia, setIdeia] = useState(pedido.ideia ?? '')
  const [erro, setErro] = useState('')
  const [ocupado, setOcupado] = useState(false)
  const salvo = !!pedido.nome && !!pedido.ideia && (doBatismo || pedido.nome === nome.trim()) && pedido.ideia === ideia.trim()
  const cod = pedido.id.slice(0, 8).toUpperCase()
  const oQue = doBatismo ? `⚔️⚔️ 2º CLÃ (meu batismo ${batismo}) + ESCUDO PERSONALIZADO pro clã que eu já tenho` : extra ? '⚔️⚔️ 2º CLÃ + ESCUDO PERSONALIZADO' : '🛡️ ESCUDO DE CLÃ PERSONALIZADO'
  const zap = `https://wa.me/${WHATSAPP_CONTATO}?text=${encodeURIComponent(`Olá Diego! Paguei o ${oQue} (pedido ${cod}).\nClã: ${doBatismo ? (pedido.nome ?? principal ?? '') : nome.trim()}\nIdeia: ${ideia.trim()}`)}`
  const salvar = async () => {
    setOcupado(true); setErro('')
    try {
      const { data } = await supabase.rpc(extra ? 'esc_cla_extra_criar' : 'esc_cla_escudo_escrever', { p_id: pedido.id, p_nome: nome, p_ideia: ideia })
      if (data === 'ok') { esqueceClas(); aoSalvar() }
      else setErro(data === 'nome' ? tr('O nome do clã precisa ter de 2 a 30 letras.', 'The clan name needs 2 to 30 letters.') : data === 'ideia' ? tr('Conta a ideia em pelo menos 5 letras (até 300).', 'Describe the idea in at least 5 letters (up to 300).') : msgErro(data))
    } catch { setErro(msgErro(null)) } finally { setOcupado(false) }
  }
  const campo: CSSProperties = { width: '100%', boxSizing: 'border-box', border: `2px solid ${INK}`, borderRadius: 9, padding: '8px 10px', fontSize: 14, fontWeight: 700, color: INK, background: '#fff' }
  return (
    <div style={{ marginTop: 10, background: '#fff', color: INK, border: `3px solid ${INK}`, borderRadius: 12, padding: 10 }}>
      <b style={{ ...OSW, fontSize: 15, display: 'block' }}>✅ {tr('Pagamento confirmado!', 'Payment confirmed!')}</b>
      {doBatismo && <p style={{ fontSize: 12.5, fontWeight: 800, margin: '4px 0 0', background: '#FFF3C4', border: `2px solid ${INK}`, borderRadius: 9, padding: '6px 8px' }}>🖋 {tr(`Seu 2º clã: ${batismo}, com o escudo do batismo. O escudo feito à mão vai pro ${principal ?? 'seu clã'}.`, `Your 2nd clan: ${batismo}, with the named-club crest. The hand-made crest goes to ${principal ?? 'your clan'}.`)}</p>}
      <p style={{ fontSize: 12.5, fontWeight: 700, margin: '2px 0 0' }}>{doBatismo ? tr(`Conta como você quer o escudo do ${principal ?? 'seu clã'}:`, `Tell us how you want the ${principal ?? 'clan'} crest:`) : extra ? tr('Dê o nome do seu 2º clã e conte como quer o escudo:', 'Name your 2nd clan and tell us how you want the crest:') : tr('Conta pra gente como você quer o escudo:', 'Tell us how you want the crest:')}</p>
      {!doBatismo && <p style={{ ...OSW, fontSize: 11, margin: '8px 0 3px' }}>{extra ? tr('Nome do 2º clã', '2nd clan name') : tr('Nome do clã', 'Clan name')}</p>}
      {!doBatismo && <input value={nome} maxLength={extra ? 20 : 30} disabled={extra && !!pedido.nome} onChange={e => setNome(e.target.value)} style={campo} />}
      {extra && !doBatismo && !pedido.nome && <p style={{ fontSize: 10.5, fontWeight: 700, color: '#666', margin: '3px 0 0' }}>{tr('3 a 20 letras · o clã nasce assim que você salvar (aberto; dá pra fechar depois)', '3 to 20 letters · the clan is born as soon as you save (open; you can close it later)')}</p>}
      <p style={{ ...OSW, fontSize: 11, margin: '8px 0 3px' }}>{tr('Sua ideia pro escudo', 'Your crest idea')}</p>
      <textarea value={ideia} maxLength={300} rows={3} onChange={e => setIdeia(e.target.value)} placeholder={tr('ex.: um lobo dourado com um martelo, fundo roxo e a coroa em cima', 'e.g. a golden wolf with a hammer, purple background and a crown on top')} style={{ ...campo, resize: 'vertical', fontFamily: 'inherit' }} />
      {erro && <p style={{ fontSize: 12, fontWeight: 800, color: RED, margin: '6px 0 0' }}>⚠️ {erro}</p>}
      {!salvo
        ? <button disabled={ocupado} onClick={() => void salvar()} style={{ ...bt(INK, GOLD), width: '100%', padding: 10, fontSize: 14, marginTop: 8 }}>{extra && !pedido.nome ? (doBatismo ? tr(`⚔️ Liberar o ${batismo} como clã`, `⚔️ Unlock ${batismo} as a clan`) : tr('⚔️ Criar o 2º clã', '⚔️ Create the 2nd clan')) : tr('Salvar nome e ideia', 'Save name and idea')}</button>
        : <a href={zap} target="_blank" rel="noopener noreferrer" style={{ ...bt('#25D366', '#fff'), display: 'block', textAlign: 'center', textDecoration: 'none', width: '100%', boxSizing: 'border-box', padding: 11, fontSize: 14, marginTop: 8 }}>💬 {tr('Mandar no WhatsApp do Diego', 'Send to Diego on WhatsApp')}</a>}
      <p style={{ fontSize: 11, fontWeight: 700, color: '#666', margin: '6px 0 0' }}>{tr(`Abre o WhatsApp (${WHATSAPP_TXT}) com tudo escrito: nome do clã, ideia e o código do pedido ${cod}. O escudo fica pronto em até 24 h e aparece no clã sozinho.`, `Opens WhatsApp (${WHATSAPP_TXT}) with everything written: clan name, idea and order code ${cod}. The crest is ready within 24 h and shows on the clan by itself.`)}</p>
    </div>
  )
}

// ─── ⚔️ CLÃS (21/10) ──────────────────────────────────────────────────────────────────────────────────────────────
// Aprovado pelo Diego em 19/10 ("pode fazer os clãs assim") e o ONDE APARECE em 21/10 ("ok pode fazer"). Mockups:
// `scripts/mockups/clas.png` (as telas) e `scripts/mockups/clas-onde-aparece.png` (o selo em cada lugar).
//
// · Regras (o BANCO decide tudo — `supabase/migrations/20261021040000_clas.sql`): criar = qualquer plano PAGO; entrar = todo
//   mundo; até 22 (21/10, era 20); 1 clã por vez; sem espera pra trocar (21/10: era 7, depois 3, e saiu); títulos ONLINE da semana somam pro clã; ranking zera segunda; o clã
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

// 📣 no PERFIL de alguém (21/10, Diego: "clicar neles pra chamar como amigo, convidar pro clã"): um botão por clã MEU.
// Quem é do clã (membro ou presidente) chama; o banco responde se ele já está lá.
export function ChamarProMeuCla({ uid }: { uid: string }) {
  const [meus, setMeus] = useState<{ id: number; nome: string; emblema: string }[]>([])
  const [feito, setFeito] = useState<Record<number, string>>({})
  useEffect(() => {
    if (!clasLiberado()) return
    supabase.rpc('esc_cla_painel').then(({ data }) => {
      const pn = data as Painel | null
      const l = [pn?.cla, pn?.extra].filter((k): k is Bloco => !!k && !k.lista.some(m => m.uid === uid))
      setMeus(l.map(k => ({ id: k.id, nome: k.nome, emblema: k.emblema })))
    }, () => {})
  }, [uid])
  if (meus.length === 0) return null
  const chama = async (id: number) => {
    setFeito(f => ({ ...f, [id]: '…' }))
    try {
      const { data } = await supabase.rpc('esc_cla_convidar', { p_para: uid, p_cla: id })
      const r = (data ?? {}) as { ok?: boolean; erro?: string }
      setFeito(f => ({ ...f, [id]: r.ok ? tr('✅ Convite enviado', '✅ Invite sent') : r.erro === 'mesmo' ? tr('já está no clã', 'already in') : tr('não deu', 'failed') }))
    } catch { setFeito(f => ({ ...f, [id]: tr('não deu', 'failed') })) }
  }
  return <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
    {meus.map(k => feito[k.id]
      ? <span key={k.id} style={{ ...bt('#E9F7EE', INK), textAlign: 'center', padding: 9, boxShadow: 'none' }}>{feito[k.id]} · {k.nome}</span>
      : <button key={k.id} onClick={() => void chama(k.id)} style={{ ...bt(ROXO, '#fff'), display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 8, fontSize: 13 }}><EmblemaCla emblema={k.emblema} size={22} />📣 {tr(`Chamar pro ${k.nome}`, `Invite to ${k.nome}`)}</button>)}
  </div>
}

// ── a aba ⚔️ Clã dos Amigos ─────────────────────────────────────────────────────────────────────────────────────
type ClaJson = { id: number; nome: string; emblema: string; aberto: boolean; lider: string; lider_nome: string; membros: number; titulos: number; campeao: boolean; pos?: number; descricao?: string | null }
type Bloco = ClaJson & { pos: number | null; lista: { uid: string; nome: string; titulos: number }[]; pedidos: { id: number; uid: string; nome: string }[] }
type Painel = {
  pode_criar: boolean; escudo: string | null; espera_ate: string | null
  cla: Bloco | null
  extra?: Bloco | null // ⚔️⚔️ 21/10: o clã da 2ª vaga (membro ou presidente)
  vagas?: number // 1, ou 2 pra quem pagou a 2ª vaga (R$ 9,90)
  trava_cla?: string | null; trava_extra?: string | null // 🔒 22/10: até quando não dá pra sair de cada clã (7 dias depois de entrar)
  guardados?: { id: number; nome: string; emblema: string }[] // 📦 clãs que o presidente guardou ("engavetou")
  convites: (ClaJson & { pedido_id: number; de_nome: string })[]; pedi: number[]
}
const ERRO: Record<string, [string, string]> = {
  plano: ['Criar clã: grátis com plano (⭐ Craque pra cima) ou R$ 4,90 sem plano. Entrar num clã é de graça.', 'Creating a clan needs a plan (⭐ Star and up). Joining is free.'],
  tamanho: ['O nome do clã precisa ter de 3 a 20 letras.', 'The clan name needs 3 to 20 letters.'],
  ofensivo: ['Esse nome não é permitido: nada que ofenda alguém no Leilão Legends.', 'That name is not allowed: nothing offensive in Leilão Legends.'],
  nome_em_uso: ['Já existe um clã com esse nome. Tenta outro.', 'There is already a clan with that name. Try another.'],
  ja_tem: ['Você já está num clã. Saia dele antes.', 'You are already in a clan. Leave it first.'],
  espera: ['Não deu pra entrar agora. Tenta de novo.', 'Could not join right now. Try again.'],
  mesmo: ['Você já está nesse clã.', 'You are already in this clan.'],
  presidente: ['Você é o presidente do clã: passe a presidência ou feche o clã antes.', 'You are the clan president: hand over the presidency or close the clan first.'],
  sem_plano: ['Só dá pra passar a presidência pra quem tem plano.', 'You can only hand over the presidency to someone with a plan.'],
  lotado: [`Esse clã já tem ${CLA_MAX} membros.`, `That clan already has ${CLA_MAX} members.`],
  sem_escudo: ['Sua conta não tem escudo de clube (batismo).', 'Your account has no club crest (named club).'],
  sem_cla: ['Esse clã não existe mais.', 'That clan no longer exists.'],
  desc_tamanho: ['A descrição pode ter até 200 letras.', 'The description can have up to 200 letters.'],
  desc_link: ['A descrição não pode ter link.', 'The description cannot have links.'],
  desc_feia: ['Essa descrição não é permitida: sem palavrão e nada que ofenda alguém.', 'That description is not allowed: no swearing and nothing offensive.'],
  cheio: ['Você já está em 2 clãs, que é o máximo. Saia de um antes.', 'You are already in 2 clans, the max. Leave one first.'],
  guardar_gente: ['Só dá pra guardar o clã quando você é o único dele. Com gente, passe a presidência ou feche.', 'You can only store the clan when you are its only member. With people, hand over the presidency or close it.'],
  emblema_fixo: ['Esse clã tem escudo próprio (batismo ou personalizado): o emblema não se troca.', 'This clan has its own crest (named club or custom): the emblem can’t be changed.'],
}
// 🪙 22/10 (Diego: "quem entrar no dia que o clã tá em primeiro só pra ganhar as moedas?" → prêmio só pra quem está desde
// segunda; "quando o cara entrar recebe o aviso só do motivo"): a mensagem de quem acabou de entrar já explica a regra
export const ENTROU_CLA: [string, string] = ['✅ Você entrou no clã! Seus títulos já somam pro clã. O prêmio da semana 🪙 é de quem está no clã desde segunda — você recebe a partir da próxima semana. E fica pelo menos 7 dias antes de poder sair.', '✅ You joined the clan! Your titles already count for the clan. The weekly 🪙 prize goes to members since Monday — you get it from next week. And you stay at least 7 days before you can leave.']
// 🔒 22/10 (Diego): "pra sair do clã e entrar em outro, pelo menos 7 dias a partir do momento que entra"
export const msgTrava = (ate?: string | null, cla?: string | null) => tr(`🔒 Você entrou ${cla ? `no ${cla}` : 'nesse clã'} há menos de 7 dias. Só dá pra sair ou trocar a partir de ${ate ? dataCurta(ate) : 'daqui a 7 dias'}.`, `🔒 You joined ${cla ?? 'this clan'} less than 7 days ago. You can leave or switch from ${ate ? dataCurta(ate) : 'in 7 days'}.`)
export const msgErro = (e: unknown) => { const k = String(e ?? ''); const m = ERRO[k]; return m ? tr(m[0], m[1]) : tr('Não deu agora. Tenta de novo.', 'Couldn’t do it now. Try again.') }
// ⚔️⚔️ 21/10 (Diego): "resumindo, sempre são dois… isso aí também tem que estar escrito em algum lugar"
const REGRA_DOIS: [string, string] = ['⚔️⚔️ Sempre são dois: com a 2ª vaga (R$ 9,90 na 🛒 Loja, uma vez só) você fica em até 2 clãs — membro dos 2, presidente dos 2 ou um de cada. Pra entrar num 3º, saia de um; sendo presidente, passe a presidência, 📦 guarde ou feche o clã. Quem entra fica pelo menos 7 dias antes de sair ou trocar.', '⚔️⚔️ Always two: with the 2nd slot (R$ 9.90 in the 🛒 Shop, once) you can be in up to 2 clans — member of both, president of both or one of each. To join a 3rd, leave one; as president, hand over, 📦 store or close the clan. Once you join, you stay at least 7 days before leaving or switching.']
// 📝 21/10 (Diego): "cada clã tem que ter a sua descrição" — aparece no convite, na lista e na página do clã
const Descricao = ({ t, escuro }: { t?: string | null; escuro?: boolean }) => t ? <p style={{ fontSize: 11.5, fontWeight: 700, fontStyle: 'italic', margin: '4px 0 0', lineHeight: 1.35, color: escuro ? '#e8e2d0' : '#4a4030', overflowWrap: 'anywhere' }}>“{t}”</p> : null
const dataCurta = (iso: string) => { const d = new Date(iso); return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}` }

export function AbaCla({ amigos, onPerfil }: { amigos: { uid: string; nome: string }[]; onPerfil: (uid: string) => void }) {
  const [p, setP] = useState<Painel | null | 'erro'>(null)
  const [msg, setMsg] = useState('')
  const [ocupado, setOcupado] = useState(false)
  const [tela, setTela] = useState<'inicio' | 'criar' | 'procurar' | 'ranking' | 'chamar'>('inicio')
  // 👑 21/10 (Diego): presidente não vai pra outro clã nem sai sem antes passar a presidência (só pra quem tem plano) ou fechar o clã
  const [pres, setPres] = useState<{ cla: { id: number; nome: string }; destino?: string; seguir?: () => void } | null>(null)
  const [cheio, setCheio] = useState<{ destino: string; meus: ClaJson[] } | null>(null) // ⚔️⚔️ já está em 2 → "sempre são dois"
  const [sozinho, setSozinho] = useState<ClaJson | null>(null) // 📦 presidente sozinho saindo: guardar ou fechar
  const [editaDesc, setEditaDesc] = useState<string | null>(null) // 📝 o presidente escrevendo a descrição
  const [trocaEmb, setTrocaEmb] = useState(false) // 🎨 21/10: o presidente troca o emblema pronto (quem não pagou o personalizado)
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
      const r = (data ?? {}) as { ok?: boolean; erro?: string; pedido?: boolean; meus?: ClaJson[]; ate?: string; cla?: string } & Omit<Partial<TrocaInfo>, 'erro'>
      if (!error && r.erro === 'trava') setMsg(`⚠️ ${msgTrava(r.ate, r.cla)}`)
      else if (!error && r.erro === 'cheio') setCheio({ destino: destino?.nome ?? tr('o clã novo', 'the new clan'), meus: r.meus ?? [] })
      else if (!error && r.erro === 'confirmar' && destino && r.preso && typeof p === 'object' && p?.cla) setPres({ cla: p.cla, destino: destino.nome, seguir: () => { setPres(null); void faz(rpc, { ...args, p_trocar: true }, ok) } })
      else if (!error && r.erro === 'confirmar' && destino) setTroca({ info: r as TrocaInfo, destino: destino.nome, destinoEmblema: destino.emblema, aberto: destino.aberto, seguir: () => { setTroca(null); void faz(rpc, { ...args, p_trocar: true }, ok) } })
      else if (error || !r.ok) setMsg(`⚠️ ${msgErro(r.erro)}`)
      else { setMsg(r.pedido ? tr('📨 Pedido enviado — o presidente do clã decide.', '📨 Request sent — the clan president decides.') : ok ?? ''); esqueceClas(); setTela('inicio') }
    } catch { setMsg(`⚠️ ${msgErro(null)}`) } finally { setOcupado(false); carrega() }
  }
  if (p === null) return <p style={{ textAlign: 'center', fontWeight: 800, margin: '20px 0' }}>{tr('carregando…', 'loading…')}</p>
  if (p === 'erro') return <p style={{ textAlign: 'center', fontWeight: 800, margin: '20px 0' }}>{tr('Não consegui abrir os clãs agora. Tenta de novo.', 'Couldn’t open clans right now. Try again.')}</p>
  const aviso = msg && <p style={{ ...caixa, background: msg.startsWith('⚠️') ? '#FFE3D6' : '#E9F7EE', fontSize: 12.5, fontWeight: 800 }}>{msg}</p>
  const ocupadas = (p.cla ? 1 : 0) + (p.extra ? 1 : 0)
  const livre = ocupadas < (p.vagas ?? 1) // tem lugar sobrando: entra/cria sem sair de nenhum
  const voltar = <button style={{ ...bt('#fff', INK), marginTop: 10 }} onClick={() => setTela('inicio')}>‹ {tr('voltar', 'back')}</button>

  if (tela === 'criar') return <>{voltar}<CriarCla painel={p} saindoDe={livre ? undefined : p.cla?.nome} segundo={livre && ocupadas === 1} ocupado={ocupado} onCriar={(nome, emblema, aberto, descricao) => void faz('esc_cla_criar', { p_nome: nome, p_emblema: emblema, p_aberto: aberto, p_trocar: !livre && !!p.cla, p_descricao: descricao }, tr('⚔️ Clã criado! Chame seus amigos.', '⚔️ Clan created! Invite your friends.'))} />{aviso}</>
  const modalTroca = <>{troca && <ConfirmaTroca {...troca} onFicar={() => setTroca(null)} />}
    {pres && <ResolvePresidencia cla={pres.cla.nome} claId={pres.cla.id} destino={pres.destino} onFicar={() => setPres(null)}
      onPassou={() => { if (pres.seguir) pres.seguir(); else { setPres(null); void faz('esc_cla_sair', { p_cla: pres.cla.id }, tr('Presidência passada. Você saiu do clã.', 'Presidency handed over. You left the clan.')) } }}
      onFechou={() => { if (pres.seguir) pres.seguir(); else { setPres(null); esqueceClas(); setMsg(tr('🗑️ Clã fechado.', '🗑️ Clan closed.')); carrega() } }} />}
    {cheio && <SempreDois {...cheio} onFicar={() => setCheio(null)} onAbrir={k => { setCheio(null); setTela('inicio'); setVer2(!!p.extra && k.id === p.extra.id) }} />}
    {sozinho && <SairSozinho cla={sozinho} ocupado={ocupado} onFicar={() => setSozinho(null)}
      onGuardar={() => { const k = sozinho; setSozinho(null); setVer2(false); void faz('esc_cla_guardar', { p_cla: k.id }, tr(`📦 ${k.nome} guardado. Reabra quando quiser.`, `📦 ${k.nome} stored. Reopen it any time.`)) }}
      onFechar={() => { const k = sozinho; setSozinho(null); setVer2(false); void faz('esc_cla_fechar', { p_cla: k.id }, tr('🗑️ Clã fechado.', '🗑️ Clan closed.')) }} />}</>
  const guardados = (p.guardados ?? []).length > 0 && <div style={{ ...caixa, background: '#F1ECFF' }}>
    <p style={h3}>📦 {tr('Seus clãs guardados', 'Your stored clans')}</p>
    {(p.guardados ?? []).map(g => <div key={g.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', borderTop: '1px dashed #d8ccaa' }}>
      <EmblemaCla emblema={g.emblema} size={28} />
      <b style={{ flex: 1, minWidth: 0, fontSize: 13.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.nome}</b>
      {/* 21/10 (Diego): "só dá o reabrir se ele sair de um depois" — sem lugar livre, o botão fica trancado (o banco também barra) */}
      {livre ? <button disabled={ocupado} style={bt(GREEN, '#fff')} onClick={() => void faz('esc_cla_reabrir', { p_cla: g.id }, tr(`✅ ${g.nome} reaberto!`, `✅ ${g.nome} reopened!`), { nome: g.nome, emblema: g.emblema, aberto: true })}>{tr('reabrir', 'reopen')}</button>
        : <span style={{ ...bt('#eee', '#888'), cursor: 'default' }}>🔒 {tr('reabrir', 'reopen')}</span>}
    </div>)}
    <p style={{ fontSize: 10.5, fontWeight: 700, color: '#666', margin: '4px 0 0' }}>{livre ? tr('Fora do ar, com o nome guardado só pra você. Reabrir ocupa uma das suas vagas.', 'Off the air, with the name kept just for you. Reopening takes one of your slots.') : tr('Fora do ar, com o nome guardado só pra você. Pra reabrir, saia antes de um dos seus clãs.', 'Off the air, with the name kept just for you. To reopen it, first leave one of your clans.')}</p>
  </div>
  if (tela === 'procurar') return <>{voltar}<ProcurarCla pedi={p.pedi} meu={p.cla?.id ?? null} ocupado={ocupado} onEntrar={k => void faz('esc_cla_entrar', { p_cla: k.id, p_trocar: false }, tr(ENTROU_CLA[0], ENTROU_CLA[1]), k)} />{aviso}{modalTroca}</>
  if (tela === 'ranking') return <>{voltar}<RankingClas meu={p.cla?.id ?? null} /></>
  const ehExtra = ver2 && !!p.extra
  const c = ehExtra ? p.extra! : p.cla
  const alvo = ehExtra && c ? { p_cla: c.id } : {} // as ações do presidente valem pro clã que está na tela
  if (tela === 'chamar' && c) return <>{voltar}<ChamarAmigos amigos={amigos} meus={new Set(c.lista.map(m => m.uid))} cla={ehExtra ? c.id : undefined} /></>

  return <>
    {aviso}{modalTroca}{guardados}
    {p.extra && <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
      {([[false, p.cla?.nome ?? tr('Sem clã de membro', 'No member clan')], [true, `${p.extra.nome} · 2º`]] as const).map(([v, rot]) => (
        <button key={String(v)} onClick={() => setVer2(v)} style={{ ...bt(ver2 === v ? INK : '#fff', ver2 === v ? GOLD : INK), flex: 1, padding: 8, fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis' }}>⚔️ {rot}</button>
      ))}
    </div>}
    {p.convites.map(v => (
      <div key={v.pedido_id} style={{ ...caixa, background: '#EFE6FF' }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <EmblemaCla emblema={v.emblema} size={40} />
          <div style={{ flex: 1, minWidth: 0, fontSize: 12.5, fontWeight: 700 }}><b>{v.de_nome}</b> {tr('te chamou pro clã', 'invited you to the clan')} <b>{v.nome}</b> ({v.membros}/{CLA_MAX})<Descricao t={v.descricao} /></div>
        </div>
        <span style={{ display: 'flex', gap: 6, marginTop: 8 }}>
          <button disabled={ocupado} style={{ ...bt(GREEN, '#fff'), flex: 1 }} onClick={() => void faz('esc_cla_responder', { p_id: v.pedido_id, p_aceita: true, p_trocar: false }, tr(ENTROU_CLA[0], ENTROU_CLA[1]), { nome: v.nome, emblema: v.emblema, aberto: true })}>{tr('entrar', 'join')}</button>
          <button disabled={ocupado} style={{ ...bt('#fff', INK), flex: 1 }} onClick={() => void faz('esc_cla_responder', { p_id: v.pedido_id, p_aceita: false })}>{tr('agora não', 'not now')}</button>
        </span>
      </div>
    ))}
    {c ? <>
      <div style={{ ...caixa, background: 'linear-gradient(150deg,#262626,#0c0c0c)', color: '#fff', display: 'flex', gap: 12, alignItems: 'center' }}>
        <EmblemaCla emblema={c.emblema} size={58} />
        <div style={{ minWidth: 0 }}>
          <b style={{ ...OSW, fontSize: 20, color: CLA_OURO, display: 'block', lineHeight: 1.05 }}>{c.nome}{c.campeao ? ' 🏆' : ''}</b>
          <span style={{ fontSize: 11.5, fontWeight: 700 }}>👑 {tr('presidente', 'president')}: {c.lider_nome} · {c.membros}/{CLA_MAX} · {c.aberto ? tr('🔓 aberto', '🔓 open') : tr('🔒 fechado', '🔒 closed')}</span>
          <Descricao t={c.descricao} escuro />
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
        <button style={bt('#fff', INK)} onClick={() => setTela('procurar')}>🔎 {tr('Outros clãs', 'Other clans')}</button>
        {/* ⚔️ 21/10 (Diego): criar o seu estando em outro = sair do atual, com o mesmo aviso (presidente: passar ou fechar antes) */}
        <button style={bt('#fff', INK)} onClick={() => {
          if (!p.pode_criar) { setSemPlano(v => !v); return }
          if (livre) { setTela('criar'); return }
          if ((p.vagas ?? 1) >= 2) { setCheio({ destino: tr('seu clã novo', 'your new clan'), meus: [p.cla, p.extra].filter((k): k is Bloco => !!k) }); return }
          if (souLider(c) && c.membros > 1) { setPres({ cla: c, destino: tr('seu clã novo', 'your new clan'), seguir: () => { setPres(null); setTela('criar') } }); return }
          setTroca({ info: { erro: 'confirmar', atual: c.nome, atual_emblema: c.emblema, lider: souLider(c), sozinho: c.membros <= 1 }, destino: tr('seu clã novo', 'your new clan'), destinoEmblema: 'e:0', aberto: true, criar: true, seguir: () => { setTroca(null); setTela('criar') } })
        }}>⚔️ {tr('Criar meu clã', 'Create my clan')}</button>
        {souLider(c) && <button style={bt(editaDesc !== null ? INK : '#fff', editaDesc !== null ? GOLD : INK)} onClick={() => setEditaDesc(v => v === null ? (c.descricao ?? '') : null)}>📝 {tr('descrição', 'description')}</button>}
        {souLider(c) && /^e:\d{1,2}$/.test(c.emblema) && <button style={bt(trocaEmb ? INK : '#fff', trocaEmb ? GOLD : INK)} onClick={() => setTrocaEmb(v => !v)}>🎨 {tr('emblema', 'emblem')}</button>}
        {souLider(c) && <button disabled={ocupado} style={bt('#fff', INK)} onClick={() => void faz('esc_cla_aberto', { p_aberto: !c.aberto, ...alvo })}>{c.aberto ? tr('🔒 fechar', '🔒 close') : tr('🔓 abrir', '🔓 open')}</button>}
        <button disabled={ocupado} style={bt('#fff', RED)} onClick={() => {
          if (souLider(c) && c.membros > 1) { setPres({ cla: c }); return }
          if (souLider(c)) { setSozinho(c); return }
          if (window.confirm(tr(`Sair do ${c.nome}?`, `Leave ${c.nome}?`))) { setVer2(false); void faz('esc_cla_sair', { p_cla: c.id }, tr('Você saiu do clã.', 'You left the clan.')) }
        }}>{tr('sair', 'leave')}</button>
        {(ehExtra ? p.trava_extra : p.trava_cla) && <p style={{ flexBasis: '100%', fontSize: 11, fontWeight: 800, color: '#7a4d00', margin: '2px 2px 0' }}>🔒 {tr(`Você entrou há menos de 7 dias: pode sair ou trocar a partir de ${dataCurta((ehExtra ? p.trava_extra : p.trava_cla)!)}.`, `You joined less than 7 days ago: you can leave or switch from ${dataCurta((ehExtra ? p.trava_extra : p.trava_cla)!)}.`)}</p>}
      </div>
      {editaDesc !== null && souLider(c) && <div style={caixa}>
        <p style={h3}>📝 {tr('Descrição do clã', 'Clan description')}</p>
        <textarea value={editaDesc} maxLength={200} rows={3} onChange={e => setEditaDesc(e.target.value)} placeholder={tr('ex.: Clã da galera do zap · jogamos toda noite às 21h', 'e.g. The WhatsApp crew · we play every night at 9pm')} style={{ width: '100%', boxSizing: 'border-box', border: `2px solid ${INK}`, borderRadius: 9, padding: '8px 10px', fontSize: 13.5, fontWeight: 700, color: INK, background: '#fff', resize: 'vertical', fontFamily: 'inherit' }} />
        <p style={{ fontSize: 10.5, fontWeight: 700, color: '#666', margin: '3px 0 6px' }}>{editaDesc.length}/200 · {tr('sem link e sem palavrão · em branco = sem descrição', 'no links, no swearing · blank = no description')}</p>
        <button disabled={ocupado} style={{ ...bt(GREEN, '#fff'), width: '100%', padding: 9 }} onClick={() => { const t = editaDesc; setEditaDesc(null); void faz('esc_cla_descricao', { p_cla: c.id, p_texto: t }, tr('📝 Descrição salva!', '📝 Description saved!')) }}>{tr('Salvar descrição', 'Save description')}</button>
      </div>}
      {trocaEmb && souLider(c) && <div style={caixa}>
        <p style={h3}>🎨 {tr('Trocar o emblema do clã', 'Change the clan emblem')}</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {EMBLEMAS.map((_, i) => { const k = `e:${i}`; return <button key={k} disabled={ocupado} onClick={() => { setTrocaEmb(false); void faz('esc_cla_emblema', { p_emblema: k, p_cla: c.id }, tr('🎨 Emblema trocado!', '🎨 Emblem changed!')) }} style={{ border: `3px solid ${c.emblema === k ? GOLD : 'transparent'}`, borderRadius: 10, background: c.emblema === k ? '#FFF3C4' : 'transparent', padding: 2, cursor: 'pointer' }}><EmblemaCla emblema={k} size={34} /></button> })}
        </div>
        <p style={{ fontSize: 10.5, fontWeight: 700, color: '#666', margin: '6px 0 0' }}>{tr('Quer um escudo desenhado à mão, só do seu clã? É na 🛒 Loja (R$ 14,90).', 'Want a hand-drawn crest just for your clan? It is in the 🛒 Shop (R$ 14.90).')}</p>
      </div>}
      {semPlano && !p.pode_criar && <CriarSemPlano onProcurar={() => { setSemPlano(false); setTela('procurar') }} onLiberou={() => { setSemPlano(false); setTela('criar'); carrega() }} />}
      {!ehExtra && <EscudoClaLoja />}
      <p style={{ fontSize: 11, color: INK, fontWeight: 800, margin: '10px 2px 0', lineHeight: 1.4, background: '#FFF3C4', border: `2px solid ${INK}`, borderRadius: 9, padding: '6px 8px' }}>{tr(REGRA_DOIS[0], REGRA_DOIS[1])}</p>
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
      {semPlano && !p.pode_criar && <CriarSemPlano onProcurar={() => { setSemPlano(false); setTela('procurar') }} onLiberou={() => { setSemPlano(false); setTela('criar'); carrega() }} />}
      <button style={{ ...bt('#fff', INK), width: '100%', marginTop: 8 }} onClick={() => setTela('ranking')}>🏆 {tr('Ranking dos clãs da semana', 'Clans of the week')}</button>
      <p style={{ fontSize: 11, color: INK, fontWeight: 800, margin: '10px 2px 0', lineHeight: 1.4, background: '#FFF3C4', border: `2px solid ${INK}`, borderRadius: 9, padding: '6px 8px' }}>{tr(REGRA_DOIS[0], REGRA_DOIS[1])}</p>
      <p style={{ fontSize: 11, color: '#666', fontWeight: 700, margin: '8px 2px 0', lineHeight: 1.4 }}>{tr('Criar clã: grátis com qualquer plano (⭐ Craque pra cima) ou R$ 4,90 sem plano. Entrar num clã é de graça pra todo mundo.', 'Creating a clan: free with any plan (⭐ Star and up) or R$ 4.90 without one. Joining a clan is free for everyone.')}</p>
    </>}
  </>
}
// 🔒⭐ quem NÃO tem plano tocou em "Criar clã" (21/10, Diego: "o que aparece pra ele pra criar clã e botão pra direcionar")
// 🔓 21/10 (Diego): "quem tem plano não paga nada; quem não tem plano paga… fica com um cadeadozinho pra pagar e liberar" — 🔁 22/10: R$ 4,90 (era 9,90)
function CriarSemPlano({ onProcurar, onLiberou }: { onProcurar: () => void; onLiberou: () => void }) {
  const [pagando, setPagando] = useState(false)
  return (
    <div style={{ ...caixa, background: 'linear-gradient(150deg,#262626,#0c0c0c)', color: '#fff', borderColor: INK, textAlign: 'center' }}>
      <p style={{ fontSize: 30, margin: 0 }}>⚔️🔒</p>
      <p style={{ ...OSW, fontSize: 17, margin: '2px 0 6px', color: CLA_OURO }}>{tr('Libere o seu clã', 'Unlock your clan')}</p>
      <p style={{ fontSize: 12.5, fontWeight: 700, margin: '0 0 8px', lineHeight: 1.4, color: '#eee' }}>{tr(
        `Crie o seu clã, vire o presidente 👑 e chame até ${CLA_MAX - 1} amigos. Com plano (⭐ Craque pra cima) é de graça; sem plano, libera por R$ 4,90, uma vez só. Escudo desenhado à mão é à parte (R$ 14,90).`,
        `Create your clan, become the president 👑 and invite up to ${CLA_MAX - 1} friends. With a plan (⭐ Star and up) it's free; without one, unlock it for R$ 4.90, once. A hand-drawn crest is extra (R$ 14.90).`)}</p>
      {!pagando
        ? <button onClick={() => setPagando(true)} style={{ ...bt(GOLD, INK), width: '100%', padding: 11, fontSize: 15 }}>🔓 {tr('Liberar por R$ 4,90', 'Unlock for R$ 4.90')}</button>
        : <div style={{ background: '#fff', color: INK, borderRadius: 12, padding: 8, textAlign: 'left' }}><PixMP produto="cla_criar" valor={4.9} aoPagar={() => { setPagando(false); onLiberou() }} /></div>}
      <ApoieButton startScreen="choice" trigger={open => (
        <button onClick={open} style={{ ...bt('#fff', INK), width: '100%', padding: 9, fontSize: 13, marginTop: 8 }}>⭐ {tr('Ou veja os planos (clã de graça)', 'Or see the plans (free clan)')}</button>
      )} />
      <button onClick={onProcurar} style={{ ...bt('#fff', INK), width: '100%', padding: 9, fontSize: 13, marginTop: 8 }}>🔎 {tr('Ou entre num clã — é de graça', 'Or join a clan — it’s free')}</button>
    </div>
  )
}
type TrocaInfo = { erro: 'confirmar'; atual: string; atual_emblema: string; lider: boolean; sozinho: boolean; preso?: boolean }
// 👑 o presidente quer sair/ir pra outro clã: antes, PASSAR a presidência (lista do clã; só quem tem plano pode receber) ou FECHAR o clã
function ResolvePresidencia({ cla, claId, destino, onFicar, onPassou, onFechou }: { cla: string; claId: number; destino?: string; onFicar: () => void; onPassou: () => void; onFechou: () => void }) {
  const [lista, setLista] = useState<{ uid: string; nome: string; plano: boolean }[] | null>(null)
  const [escolha, setEscolha] = useState<string | null>(null)
  const [erro, setErro] = useState('')
  const [ocupado, setOcupado] = useState(false)
  // 👑 21/10 (Diego: "passar automaticamente a presidência pra alguém"): já vem marcado o membro MAIS ANTIGO que tem plano
  const abreLista = () => { setLista([]); supabase.rpc('esc_cla_membros_plano', { p_cla: claId }).then(({ data }) => { const l = (data ?? []) as { uid: string; nome: string; plano: boolean }[]; setLista(l); setEscolha(l.find(m => m.plano)?.uid ?? null) }, () => setErro(msgErro(null))) }
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
          ? tr(`Pra ir pro ${destino}, você sai do ${cla}. Como presidente, escolha antes:`, `To go to ${destino}, you leave ${cla}. As president, first choose:`)
          : tr('Pra sair do clã, escolha antes:', 'To leave the clan, first choose:')}</p>
        {lista === null ? <>
          <button onClick={abreLista} style={{ ...bt(GOLD, INK), width: '100%', padding: 11, fontSize: 14, whiteSpace: 'normal' }}>👑 {tr('Passar a presidência', 'Hand over the presidency')}</button>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#666', margin: '4px 2px 10px' }}>{tr('Só pra quem do clã tem plano (⭐ Craque pra cima). O clã continua, com tudo dele.', 'Only to a clan member with a plan (⭐ Star and up). The clan stays, with everything.')}</p>
          <button disabled={ocupado} onClick={() => { if (window.confirm(tr(`Fechar o ${cla}? Todos os membros ficam sem clã (e podem entrar em outro na hora).`, `Close ${cla}? Every member is left without a clan (and can join another right away).`))) void chama('esc_cla_fechar', { p_cla: claId }, onFechou) }} style={{ ...bt('#fff', RED), width: '100%', padding: 10, fontSize: 13, whiteSpace: 'normal' }}>🗑️ {tr(`Fechar o ${cla}`, `Close ${cla}`)}</button>
        </> : <div style={{ background: '#fff', border: `3px solid ${INK}`, borderRadius: 12, padding: '6px 10px' }}>
          <p style={{ ...OSW, fontSize: 12, margin: '2px 0 4px' }}>{tr('Quem vai ser o novo presidente?', 'Who will be the new president?')}</p>
          {lista.some(m => m.plano) && <p style={{ fontSize: 10.5, fontWeight: 700, color: '#666', margin: '0 0 4px' }}>{tr('Já marcamos o mais antigo do clã que tem plano. Pode trocar.', 'We already picked the longest-standing member with a plan. You can change it.')}</p>}
          {lista.map((m, i) => <button key={m.uid} disabled={!m.plano} onClick={() => setEscolha(m.uid)} style={{ display: 'flex', width: '100%', alignItems: 'center', gap: 8, padding: '8px 4px', border: 'none', borderTop: i ? '1px dashed #d8ccaa' : 'none', background: escolha === m.uid ? '#FFF3C4' : 'transparent', cursor: m.plano ? 'pointer' : 'default', opacity: m.plano ? 1 : .45, textAlign: 'left', color: INK }}>
            <span style={{ fontSize: 16 }}>{escolha === m.uid ? '👑' : m.plano ? '⚪' : '🔒'}</span>
            <b style={{ flex: 1, fontSize: 13.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.nome}</b>
            <span style={{ fontSize: 10.5, fontWeight: 800, color: m.plano ? GREEN : '#888' }}>{m.plano ? tr('tem plano', 'has a plan') : tr('sem plano', 'no plan')}</span>
          </button>)}
          {lista.length > 0 && !algumComPlano && <p style={{ fontSize: 11.5, fontWeight: 800, color: '#7a4d00', margin: '6px 0' }}>{tr('Ninguém do clã tem plano ainda. Pra sair agora, só fechando o clã.', 'Nobody in the clan has a plan yet. To leave now, you have to close the clan.')}</p>}
          <button disabled={!escolha || ocupado} onClick={() => escolha && void chama('esc_cla_passar', { p_para: escolha, p_cla: claId }, onPassou)} style={{ ...bt(GREEN, '#fff'), width: '100%', padding: 10, fontSize: 13, margin: '8px 0 4px', opacity: escolha ? 1 : .5, whiteSpace: 'normal' }}>{destino ? tr(`✅ Passar e ir pro ${destino}`, `✅ Hand over and go to ${destino}`) : tr('✅ Passar e sair', '✅ Hand over and leave')}</button>
        </div>}
        {erro && <p style={{ fontSize: 12, fontWeight: 800, color: RED, margin: '8px 0 0' }}>⚠️ {erro}</p>}
        <button onClick={onFicar} style={{ ...bt('#fff', INK), width: '100%', padding: 10, fontSize: 13, marginTop: 10, whiteSpace: 'normal' }}>{tr(`Não, continuar presidente do ${cla}`, `No, stay president of ${cla}`)}</button>
      </div>
    </div>
  )
}
// 🔁 o aviso de troca (21/10): o clã de agora × o novo, o que acontece com a liderança, e os dois botões
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
        <p style={{ fontSize: 11.5, fontWeight: 700, margin: '0 0 10px', color: '#5a4a2a' }}>⚔️⚔️ {tr('Quer ficar nos dois? Libere a 2ª vaga por R$ 9,90 na 🛒 Loja do Clube.', 'Want to stay in both? Unlock the 2nd slot for R$ 9.90 in the 🛒 Club Shop.')}</p>
        <button onClick={seguir} style={{ ...bt(GREEN, '#fff'), width: '100%', padding: 11, fontSize: 14, whiteSpace: 'normal' }}>{criar ? tr(`✅ Sim, sair e criar o meu`, `✅ Yes, leave and create mine`) : aberto ? tr(`✅ Sim, ir pro ${destino}`, `✅ Yes, go to ${destino}`) : tr(`📨 Sim, pedir pra entrar no ${destino}`, `📨 Yes, ask to join ${destino}`)}</button>
        <button onClick={onFicar} style={{ ...bt('#fff', INK), width: '100%', padding: 10, fontSize: 13, marginTop: 8, whiteSpace: 'normal' }}>{tr(`Não, ficar no ${info.atual}`, `No, stay in ${info.atual}`)}</button>
      </div>
    </div>
  )
}
// ⚔️⚔️ já está em 2 clãs e tentou um 3º (21/10, Diego: "sempre são dois"): mostra os dois e leva pro que ele quer largar
function SempreDois({ destino, meus, onFicar, onAbrir }: { destino: string; meus: ClaJson[]; onFicar: () => void; onAbrir: (c: ClaJson) => void }) {
  return (
    <div role="dialog" aria-modal="true" onClick={onFicar} style={{ position: 'fixed', inset: 0, zIndex: 9000, background: 'rgba(12,12,12,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 380, background: '#F4ECD6', color: INK, border: `4px solid ${INK}`, borderRadius: 18, boxShadow: `5px 5px 0 ${INK}`, padding: 16 }}>
        <p style={{ ...OSW, fontSize: 20, margin: '0 0 6px', textAlign: 'center' }}>⚔️⚔️ {tr('Sempre são dois', 'Always two')}</p>
        <p style={{ fontSize: 13, fontWeight: 800, margin: '0 0 10px', lineHeight: 1.35, textAlign: 'center' }}>{tr(`Você já está em 2 clãs, que é o máximo. Pra ir pro ${destino}, libere um lugar:`, `You are already in 2 clans, the max. To go to ${destino}, free up a slot:`)}</p>
        {meus.map(k => <div key={k.id} style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#fff', border: `3px solid ${INK}`, borderRadius: 12, padding: '8px 10px', marginBottom: 8 }}>
          <EmblemaCla emblema={k.emblema} size={38} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <b style={{ ...OSW, display: 'block', fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{k.nome}</b>
            <span style={{ fontSize: 10.5, fontWeight: 800, color: '#7a6b4a' }}>{souLider(k) ? (k.membros > 1 ? tr('👑 presidente · passe a presidência ou feche', '👑 president · hand over or close') : tr('👑 presidente · só você: 📦 guarde ou feche', '👑 president · only you: 📦 store or close')) : tr('membro · é só sair', 'member · just leave')}</span>
          </div>
          <button onClick={() => onAbrir(k)} style={bt(INK, GOLD)}>{tr('abrir', 'open')}</button>
        </div>)}
        <button onClick={onFicar} style={{ ...bt('#fff', INK), width: '100%', padding: 10, fontSize: 13, marginTop: 4, whiteSpace: 'normal' }}>{tr('Não, ficar nos dois', 'No, stay in both')}</button>
      </div>
    </div>
  )
}
// 📦 presidente SOZINHO saindo (21/10, Diego: "engaveta o dele, deixa guardado… não é excluir"): guardar ou fechar de vez
function SairSozinho({ cla, ocupado, onFicar, onGuardar, onFechar }: { cla: ClaJson; ocupado: boolean; onFicar: () => void; onGuardar: () => void; onFechar: () => void }) {
  return (
    <div role="dialog" aria-modal="true" onClick={onFicar} style={{ position: 'fixed', inset: 0, zIndex: 9000, background: 'rgba(12,12,12,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 380, background: '#F4ECD6', color: INK, border: `4px solid ${INK}`, borderRadius: 18, boxShadow: `5px 5px 0 ${INK}`, padding: 16, textAlign: 'center' }}>
        <EmblemaCla emblema={cla.emblema} size={52} />
        <p style={{ ...OSW, fontSize: 19, margin: '6px 0 4px' }}>{tr(`Sair do ${cla.nome}?`, `Leave ${cla.nome}?`)}</p>
        <p style={{ fontSize: 12.5, fontWeight: 800, margin: '0 0 12px' }}>{tr('Você é o único do clã. O que faz com ele?', 'You are the only member. What do you do with it?')}</p>
        <button disabled={ocupado} onClick={onGuardar} style={{ ...bt(ROXO, '#fff'), width: '100%', padding: 11, fontSize: 14, whiteSpace: 'normal' }}>📦 {tr('Guardar o clã', 'Store the clan')}</button>
        <p style={{ fontSize: 10.5, fontWeight: 700, color: '#666', margin: '3px 2px 10px' }}>{tr('Sai do ar, o nome fica guardado só pra você e você reabre quando quiser.', 'It goes off the air, the name stays reserved for you and you can reopen it any time.')}</p>
        <button disabled={ocupado} onClick={onFechar} style={{ ...bt('#fff', RED), width: '100%', padding: 10, fontSize: 13, whiteSpace: 'normal' }}>🗑️ {tr('Fechar de vez', 'Close for good')}</button>
        <button onClick={onFicar} style={{ ...bt('#fff', INK), width: '100%', padding: 10, fontSize: 13, marginTop: 8, whiteSpace: 'normal' }}>{tr('Não, ficar', 'No, stay')}</button>
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
// ✂️ 21/10 (Diego: "não precisa ter FC nos clãs"): o clã do batismo leva o nome do time sem FC/EC/SC/AC/SAF — a MESMA régua do banco (esc_cla_sem_fc)
const semFc = (t: string) => t.trim().replace(/[\s_.-]+(f\.?\s?c\.?|e\.?\s?c\.?|s\.?\s?c\.?|a\.?\s?c\.?|saf)$/i, '').trim()

function CriarCla({ painel, saindoDe, segundo, ocupado, onCriar }: { painel: Painel; saindoDe?: string; segundo?: boolean; ocupado: boolean; onCriar: (nome: string, emblema: string, aberto: boolean, descricao: string) => void }) {
  const [nome, setNome] = useState('')
  const [desc, setDesc] = useState('')
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
    {/* 🖋 21/10 (Diego): "deixar claro… se ele escolher um, o outro passa a ser pago" */}
    {segundo && <p style={{ fontSize: 12, fontWeight: 800, margin: '0 0 8px', background: '#E9F7EE', border: `2px solid ${INK}`, borderRadius: 9, padding: '7px 9px' }}>⚔️⚔️ {tr('Este vai pra sua 2ª vaga (já paga): você continua no outro clã.', 'This one goes to your 2nd slot (already paid): you stay in your other clan.')}</p>}
    {painel.escudo && !segundo && <p style={{ fontSize: 12, fontWeight: 800, margin: '0 0 8px', background: '#E9F7EE', border: `2px solid ${INK}`, borderRadius: 9, padding: '7px 9px', lineHeight: 1.35 }}>🎁 {tr(
      `Seu 1º clã é DE GRAÇA — escolha UM: o clã do ${semFc(painel.escudo)} (nome e escudo do seu batismo) OU um clã com outro nome. O que você não escolher agora, se quiser depois, vira o 2º clã: R$ 9,90 na 🛒 Loja.`,
      `Your 1st clan is FREE — pick ONE: the ${semFc(painel.escudo)} clan (your named club's name and crest) OR a clan with another name. Whichever you don't pick now can be your 2nd clan later: R$ 9.90 in the 🛒 Shop.`)}</p>}
    {painel.escudo && <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
      {([[true, <><EmblemaCla emblema={`escudo:${painel.escudo}`} size={30} /><span>🖋 {tr(`Clã do ${semFc(painel.escudo)}`, `${semFc(painel.escudo)} clan`)}</span></>], [false, <span>⚔️ {tr('Clã com outro nome', 'Clan with another name')}</span>]] as const).map(([v, rot]) => (
        <button key={String(v)} onClick={() => setBatismo(v)} style={{ ...bt(batismo === v ? INK : '#fff', batismo === v ? GOLD : INK), flex: 1, whiteSpace: 'normal', fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>{rot}</button>
      ))}
    </div>}
    {batismo && painel.escudo ? <p style={{ fontSize: 12, fontWeight: 800, margin: '0 0 8px', background: '#FFF3C4', border: `2px solid ${INK}`, borderRadius: 9, padding: '6px 8px' }}>🖋 {tr(`O clã nasce com o NOME e o ESCUDO do seu batismo: ${semFc(painel.escudo)}.`, `The clan is born with your named club's NAME and CREST: ${semFc(painel.escudo)}.`)}{saindoDe ? tr(` Quer ele como 2º clã (sem sair do ${saindoDe})? É na 🛒 Loja.`, ` Want it as a 2nd clan (without leaving ${saindoDe})? It's in the 🛒 Shop.`) : ''}</p> : <>
    <p style={{ ...OSW, fontSize: 11, margin: '0 0 4px' }}>{tr('Nome do clã', 'Clan name')}</p>
    <input value={nome} onChange={e => setNome(e.target.value)} maxLength={20} placeholder={tr('ex.: Martelo de Ouro', 'e.g. Golden Hammer')}
      style={{ width: '100%', boxSizing: 'border-box', border: `2px solid ${INK}`, borderRadius: 9, padding: '8px 10px', fontSize: 14, fontWeight: 700, color: INK, background: '#fff' }} />
    <p style={{ fontSize: 10.5, fontWeight: 700, color: '#666', margin: '3px 0 8px' }}>{tr('até 20 letras · nome feio é barrado', 'up to 20 letters · offensive names are blocked')}</p>
    <p style={{ ...OSW, fontSize: 11, margin: '0 0 4px' }}>{tr('Emblema', 'Emblem')}</p>
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {opcoes.map(([k, el]) => <button key={k} onClick={() => setEmb(k)} style={{ border: `3px solid ${emb === k ? GOLD : 'transparent'}`, borderRadius: 10, background: emb === k ? '#FFF3C4' : 'transparent', padding: 2, cursor: 'pointer' }}>{el}</button>)}
    </div>
    </>}
    <p style={{ ...OSW, fontSize: 11, margin: '10px 0 4px' }}>📝 {tr('Descrição (opcional)', 'Description (optional)')}</p>
    <textarea value={desc} maxLength={200} rows={2} onChange={e => setDesc(e.target.value)} placeholder={tr('ex.: Clã da galera do zap · jogamos toda noite às 21h', 'e.g. The WhatsApp crew · we play every night at 9pm')}
      style={{ width: '100%', boxSizing: 'border-box', border: `2px solid ${INK}`, borderRadius: 9, padding: '8px 10px', fontSize: 13.5, fontWeight: 700, color: INK, background: '#fff', resize: 'vertical', fontFamily: 'inherit' }} />
    <p style={{ fontSize: 10.5, fontWeight: 700, color: '#666', margin: '3px 0 0' }}>{tr('Aparece no convite e na lista de clãs, pra quem for chamado saber como é o clã. Até 200 letras, sem link. Dá pra mudar depois.', 'Shows on invites and in the clan list, so people know what the clan is about. Up to 200 letters, no links. You can change it later.')}</p>
    <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
      {[[true, tr('🔓 Aberto · entra direto', '🔓 Open · join directly')], [false, tr('🔒 Fechado · pede e você aceita', '🔒 Closed · they ask, you accept')]].map(([v, rot]) => (
        <button key={String(v)} onClick={() => setAberto(v as boolean)} style={{ ...bt(aberto === v ? INK : '#fff', aberto === v ? GOLD : INK), flex: 1, whiteSpace: 'normal', fontSize: 11 }}>{rot as string}</button>
      ))}
    </div>
    <button disabled={ocupado || (!batismo && nome.trim().length < 3)} style={{ ...bt(GREEN, '#fff'), width: '100%', marginTop: 10, padding: 11, fontSize: 15, opacity: !batismo && nome.trim().length < 3 ? .5 : 1 }} onClick={() => onCriar(batismo && painel.escudo ? painel.escudo : nome, batismo && painel.escudo ? 'escudo' : emb, aberto, desc)}>⚔️ {tr('Criar clã', 'Create clan')}</button>
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
            <Descricao t={c.descricao} />
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
  const [cla, setCla] = useState<{ nome: string; presidente: boolean; temExtra: boolean; vagas: number; batismo: string | null } | null | 'carregando'>('carregando')
  const [meus, setMeus] = useState<EscudoPedido[]>([])
  const [comprando, setComprando] = useState<ProdutoCla | null>(null)
  const [pend2, setPend2] = useState<string[]>([]) // ⚔️⚔️ Pix do 2º clã pago que ainda não virou clã
  const carrega = useCallback(() => {
    supabase.rpc('esc_cla_painel').then(({ data }) => {
      const pn = data as Painel | null, c = pn?.cla
      setCla(c ? { nome: c.nome, presidente: souLider(c) || (!!pn?.extra && souLider(pn.extra)), temExtra: !!pn?.extra, vagas: pn?.vagas ?? 1, batismo: pn?.escudo ?? null } : null)
    }, () => setCla(null))
    supabase.rpc('esc_cla_escudo_meus2').then(({ data }) => setMeus((data ?? []) as EscudoPedido[]), () => {})
    supabase.rpc('esc_cla_extra_pendentes').then(({ data }) => setPend2(((data ?? []) as { id: string }[]).map(r => r.id)), () => {})
  }, [])
  useEffect(carrega, [carrega])
  if (!clasLiberado()) return null
  const info = cla === 'carregando' ? null : cla
  const presidente = !!info?.presidente
  const aberto = (prod: ProdutoCla) => meus.some(m => m.produto === prod && !m.pronto)
  // 💸 21/10 (Diego): 2º clã = R$ 9,90 SÓ pra criar (emblema pronto; quem tem batismo ativa o time) · escudo personalizado = R$ 14,90 (22/10; era 19,90) à parte
  const PRECO: Record<ProdutoCla, number> = { escudo_cla: 14.9, cla_extra: 9.9 }
  const ofertas: { prod: ProdutoCla; titulo: [string, string]; texto: [string, string]; pode: boolean; porque: [string, string] }[] = [
    // ⚔️⚔️ 21/10 (Diego): a compra é a 2ª VAGA — "só se ele já pagou… aí ele pode estar em dois lugares": criar o 2º OU entrar em outro
    { prod: 'cla_extra', titulo: ['⚔️⚔️ 2º clã', '⚔️⚔️ 2nd clan'],
      texto: info?.batismo
        ? [`Fique em 2 clãs ao mesmo tempo: ative o ${semFc(info.batismo)} (nome e escudo do seu batismo), crie outro ou entre no clã de um amigo. Membro dos 2, presidente dos 2 ou um de cada — seus títulos somam nos dois.`, `Be in 2 clans at once: activate ${semFc(info.batismo)} (your named club's name and crest), create another or join a friend's clan. Member of both, president of both or one of each — your titles count for both.`]
        : ['Fique em 2 clãs ao mesmo tempo: crie o seu 2º clã ou entre no clã de um amigo. Membro dos 2, presidente dos 2 ou um de cada — seus títulos somam nos dois.', 'Be in 2 clans at once: create your 2nd clan or join a friend’s clan. Member of both, president of both or one of each — your titles count for both.'],
      pode: !!info && info.vagas < 2,
      porque: info && info.vagas >= 2 ? ['✅ Você já tem a 2ª vaga (pra sempre).', '✅ You already have the 2nd slot (forever).'] : ['Primeiro entre ou crie um clã (👥 Amigos → ⚔️ Clã).', 'First join or create a clan (👥 Friends → ⚔️ Clan).'] },
    { prod: 'escudo_cla', titulo: ['🛡️ Escudo de clã personalizado', '🛡️ Custom clan crest'],
      texto: ['Desenho exclusivo, feito à mão pro SEU clã. Aparece no selo de todos os membros, no ranking e no telão. Fica pronto em até 24 h.', 'An exclusive crest, hand-made for YOUR clan. Shows on every member’s badge, in the ranking and on the big screen. Ready within 24 h.'],
      pode: presidente, porque: info ? [`Só o presidente do ${info.nome} pode encomendar o escudo.`, `Only the ${info.nome} president can order the crest.`] : ['Pra encomendar, você precisa ser presidente de um clã (👥 Amigos → ⚔️ Clã).', 'To order, you need to be a clan president (👥 Friends → ⚔️ Clan).'] },
  ]
  return <>
    {ofertas.map(o => (
      <div key={o.prod} id={o.prod === 'escudo_cla' ? 'loja-escudo-cla' : 'loja-cla-extra'} style={{ ...caixa, background: 'linear-gradient(150deg,#262626,#0c0c0c)', color: '#fff' }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {o.prod === 'escudo_cla' ? <><EmblemaCla emblema="e:0" size={46} /><span style={{ fontSize: 20 }}>➜</span><span style={{ fontSize: 40, lineHeight: 1 }}>🛡️</span></>
            : <><EmblemaCla emblema="e:5" size={46} /><span style={{ fontSize: 22 }}>＋</span><EmblemaCla emblema={info?.batismo ? `escudo:${info.batismo}` : 'e:0'} size={46} /></>}
          <div style={{ flex: 1, minWidth: 0 }}>
            <b style={{ ...OSW, fontSize: 17, color: CLA_OURO, display: 'block', lineHeight: 1.05 }}>{tr(o.titulo[0], o.titulo[1])}</b>
            <small style={{ fontSize: 11.5, fontWeight: 700, color: '#ddd', display: 'block', lineHeight: 1.3, marginTop: 3 }}>{tr(o.texto[0], o.texto[1])}</small>
          </div>
        </div>
        {o.prod === 'cla_extra' && pend2.map(id => <Extra2Form key={id} pedido={id} batismo={info?.batismo ?? null} aoCriar={() => { esqueceClas(); carrega() }} />)}
        {o.prod === 'escudo_cla' && meus.filter(m => m.produto === 'escudo_cla' && !m.pronto).map(m => <EscudoDepoisDoPix key={m.id} pedido={m} aoSalvar={carrega} batismo={null} principal={info?.nome ?? null} />)}
        {o.prod === 'escudo_cla' && meus.filter(m => m.produto === 'escudo_cla' && m.pronto).map(m => <p key={m.id} style={{ fontSize: 12.5, fontWeight: 800, color: '#9be3b1', margin: '10px 0 0' }}>✅ {tr(`Escudo do ${m.nome} pronto! Já está no clã.`, `${m.nome} crest is ready! It is already on the clan.`)}</p>)}
        {(o.prod === 'cla_extra' ? pend2.length > 0 : aberto(o.prod)) ? null : o.prod === 'cla_extra' && !!info && info.vagas >= 2 ? <p style={{ fontSize: 12.5, fontWeight: 800, color: '#9be3b1', margin: '10px 0 0' }}>{tr(o.porque[0], o.porque[1])}</p> : comprando !== o.prod ? <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
            <span style={{ ...OSW, fontSize: 26, color: GOLD }}>R$ {PRECO[o.prod].toFixed(2).replace('.', ',')}</span>
            <span style={{ fontSize: 11, fontWeight: 800, color: '#bbb' }}>{tr('Pix · pagamento único', 'Pix · one-time payment')}</span>
          </div>
          <button disabled={!o.pode} onClick={() => setComprando(o.prod)} style={{ ...bt(o.pode ? GOLD : '#555', o.pode ? INK : '#aaa'), width: '100%', padding: 11, fontSize: 15, marginTop: 8 }}>💳 {tr('Pagar no Pix', 'Pay with Pix')}</button>
          {cla !== 'carregando' && !o.pode && <p style={{ fontSize: 11, fontWeight: 700, color: '#bbb', margin: '6px 0 0' }}>🔒 {tr(o.porque[0], o.porque[1])}</p>}
        </> : <div style={{ marginTop: 10, background: '#fff', color: INK, borderRadius: 12, padding: 8 }}><PixMP produto={o.prod} valor={PRECO[o.prod]} aoPagar={() => { setComprando(null); carrega() }} /></div>}
      </div>
    ))}
  </>
}
// ⚔️⚔️ depois do Pix do 2º clã (R$ 9,90): quem tem batismo ativa o time (nome sem FC + escudo) OU cria outro; sem batismo, nome + emblema
function Extra2Form({ pedido, batismo, aoCriar }: { pedido: string; batismo: string | null; aoCriar: () => void }) {
  const [doBat, setDoBat] = useState(!!batismo)
  const [nome, setNome] = useState('')
  const [emb, setEmb] = useState('e:0')
  const [erro, setErro] = useState('')
  const [ocupado, setOcupado] = useState(false)
  const criar = async () => {
    setOcupado(true); setErro('')
    try {
      const { data } = await supabase.rpc('esc_cla_extra_criar2', { p_id: pedido, p_nome: nome, p_emblema: emb, p_batismo: doBat })
      if (data === 'ok') aoCriar(); else setErro(msgErro(data))
    } catch { setErro(msgErro(null)) } finally { setOcupado(false) }
  }
  return (
    <div style={{ marginTop: 10, background: '#fff', color: INK, border: `3px solid ${INK}`, borderRadius: 12, padding: 10 }}>
      <b style={{ ...OSW, fontSize: 15, display: 'block' }}>✅ {tr('2ª vaga liberada! Crie o seu 2º clã aqui — ou entre no clã de um amigo em 👥 Amigos → ⚔️ Clã:', '2nd slot unlocked! Create your 2nd clan here — or join a friend’s clan in 👥 Friends → ⚔️ Clan:')}</b>
      {batismo && <div style={{ display: 'flex', gap: 6, margin: '8px 0' }}>
        {([[true, `🖋 ${tr('Clã do', '')} ${semFc(batismo)}`], [false, tr('⚔️ Outro nome', '⚔️ Another name')]] as const).map(([v, rot]) => (
          <button key={String(v)} onClick={() => setDoBat(v)} style={{ ...bt(doBat === v ? INK : '#fff', doBat === v ? GOLD : INK), flex: 1, fontSize: 11, whiteSpace: 'normal' }}>{rot}</button>))}
      </div>}
      {doBat && batismo ? <p style={{ fontSize: 12, fontWeight: 800, margin: '6px 0 0' }}>🖋 {tr(`Nasce com o nome e o escudo do seu batismo: ${semFc(batismo)}.`, `Born with your named club's name and crest: ${semFc(batismo)}.`)}</p> : <>
        <input value={nome} maxLength={20} onChange={e => setNome(e.target.value)} placeholder={tr('nome do 2º clã', '2nd clan name')} style={{ width: '100%', boxSizing: 'border-box', border: `2px solid ${INK}`, borderRadius: 9, padding: '8px 10px', fontSize: 14, fontWeight: 700, color: INK, background: '#fff', marginTop: 6 }} />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
          {EMBLEMAS.map((_, i) => { const k = `e:${i}`; return <button key={k} onClick={() => setEmb(k)} style={{ border: `3px solid ${emb === k ? GOLD : 'transparent'}`, borderRadius: 10, background: emb === k ? '#FFF3C4' : 'transparent', padding: 2, cursor: 'pointer' }}><EmblemaCla emblema={k} size={30} /></button> })}
        </div>
      </>}
      {erro && <p style={{ fontSize: 12, fontWeight: 800, color: RED, margin: '6px 0 0' }}>⚠️ {erro}</p>}
      <button disabled={ocupado || (!doBat && nome.trim().length < 3)} onClick={() => void criar()} style={{ ...bt(GREEN, '#fff'), width: '100%', padding: 10, fontSize: 14, marginTop: 8, opacity: !doBat && nome.trim().length < 3 ? .5 : 1 }}>⚔️ {tr('Criar o 2º clã', 'Create the 2nd clan')}</button>
      <p style={{ fontSize: 10.5, fontWeight: 700, color: '#666', margin: '6px 0 0' }}>{tr('Quer um escudo desenhado à mão? É o 🛡️ Escudo personalizado (R$ 14,90), aqui embaixo.', 'Want a hand-drawn crest? It is the 🛡️ Custom crest (R$ 14.90), below.')}</p>
    </div>
  )
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
      {doBatismo && <p style={{ fontSize: 12.5, fontWeight: 800, margin: '4px 0 0', background: '#FFF3C4', border: `2px solid ${INK}`, borderRadius: 9, padding: '6px 8px' }}>🖋 {tr(`Seu 2º clã: ${semFc(batismo ?? '')}, com o escudo do batismo. O escudo feito à mão vai pro ${principal ?? 'seu clã'}.`, `Your 2nd clan: ${semFc(batismo ?? '')}, with the named-club crest. The hand-made crest goes to ${principal ?? 'your clan'}.`)}</p>}
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

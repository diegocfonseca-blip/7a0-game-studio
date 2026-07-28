// ─── Painel do Criador — analytics do Leilão Legends 38 ───
// Aberto em qualquer hora via  leilaolegends.com/#admin
// Só libera pra conta admin (diego.c.fonseca@gmail.com). Qualquer outro login
// vê "acesso restrito". Os dados são lidos por uma função protegida no banco.

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { logout } from './apoio'

const ADMIN_EMAIL = 'diego.c.fonseca@gmail.com'
// contas liberadas pra testar o MODO MANAGER (além do criador) — não dá acesso
// ao painel do criador (#admin), só ao modo em teste.
const MANAGER_TESTERS = [ADMIN_EMAIL, 'leafarcruz06@gmail.com', 'diego.c.fonsec@gmail.com'].map(e => e.toLowerCase())
// contas liberadas pra testar a CARREIRA ONLINE (4 divisões) — em construção,
// travada pro público. Inclui as duas variações do e-mail do amigo por garantia.
const CAREER_ONLINE_TESTERS = [ADMIN_EMAIL, 'leafarcruz06@gmail.com', 'leafar06@gmail.com', 'diego.c.fonsec@gmail.com', 'brunnodeluca90@gmail.com'].map(e => e.toLowerCase())
const INK = '#0C0C0C'
const GOLD = '#F5B301'
const OSWALD = { fontFamily: 'Oswald, sans-serif' } as const
// ⚠️ ALERTA DE CAIXA SUSPEITA: careerCoins é AUTO-REPORTADO pelo navegador do
// jogador (heartbeat) — o servidor não valida. A partir deste teto, o painel
// marca em vermelho com ⚠️ só pra o admin OBSERVAR. É sinalização visual pura:
// nada é feito com a conta do jogador.
const COINS_ALERT = 20000

// 🚩 DETECTOR DE SAVE SUSPEITO — a carreira roda NO NAVEGADOR do jogador
// (client-side): dá pra editar no DevTools. Em vez de olhar só o número final, a
// gente CRUZA os campos: caixa e títulos têm um MÁXIMO plausível pro tanto de
// temporada jogada. Quem passa disso deu um "pulo" que não vem de jogar (ex.: 500
// → 99 mil moedas, ou mais títulos do que temporadas). É SÓ alerta visual pro
// admin — nada é feito com a conta do jogador.
const DIV_COIN_CAP: Record<string, number> = { D: 600, C: 1000, B: 2000 } // teto de caixa plausível nas séries de baixo (rendem pouco)
// A caixa REAL fica baixa (gasta-se no leilão a cada temporada). Estes tetos são
// bem FOLGADOS de propósito: melhor deixar passar um trapaceiro na dúvida do que
// acusar quem jogou muito e juntou de verdade.
const COIN_BASE = 2000        // colchão inicial
const COIN_PER_SEASON = 500   // folga por temporada jogada (o ganho real fica ~150/temporada)
const nf = (n: number) => n.toLocaleString('pt-BR')
// devolve a LISTA do que está brusco (moeda / título), com o número — pra mostrar
// exatamente o que destoa. Vazio = nada suspeito.
function suspectReasons(p: LiveRow): string[] {
  if (p.mode !== 'career') return []
  const season = p.careerSeason ?? 1
  const coins = p.careerCoins ?? 0
  const titles = p.careerTitles ?? 0
  const div = p.careerDivision
  const out: string[] = []
  // 💰 caixa impossível pro tanto de temporada jogada (pega o pulo brusco de moeda)
  const capSeason = COIN_BASE + Math.max(1, season) * COIN_PER_SEASON
  if (coins > capSeason) out.push(`💰 ${nf(coins)} moedas com só ${season} temporada(s) — jogando dá no máx. ~${nf(capSeason)}`)
  else if (div && DIV_COIN_CAP[div] != null && coins > DIV_COIN_CAP[div]) out.push(`💰 ${nf(coins)} moedas alto demais pra Série ${div} (plausível ~${nf(DIV_COIN_CAP[div])})`)
  // 🏆 mais títulos do que temporadas jogadas é impossível (1 liga por temporada)
  if (titles > season) out.push(`🏆 ${titles} títulos em só ${season} temporada(s) — no máx. 1 por temporada`)
  else if (div === 'D' && titles >= 4) out.push(`🏆 ${titles} títulos ainda na Série D — o campeão da D sobe de série`)
  else if (div === 'C' && titles >= 8) out.push(`🏆 ${titles} títulos ainda na Série C`)
  return out
}

// 🚩 DETECTOR DE PULO (salto no tempo) — guarda NO APARELHO do admin quanto cada
// jogador tinha da última vez que o painel viu e compara. Se a caixa ou os títulos
// deram um salto que NÃO cabe nas temporadas que passaram (ex.: 200 → 10.000 sem
// jogar), marca o pulo e o mantém visível até você limpar. Fica só no localStorage
// do admin — não toca em NADA do jogo nem da conta do jogador.
type SeenSnap = { coins: number; titles: number; season: number; at: number }
export type JumpInfo = { coinsFrom?: number; coinsTo?: number; titlesFrom?: number; titlesTo?: number; at: number }
const SEEN_KEY = 'esc-admin-seen-v1'
const JUMPS_KEY = 'esc-admin-jumps-v1'
// folga de caixa entre duas leituras sem virar "pulo": um fixo (venda de reserva no
// meio da temporada) + a folga por temporada que passou entre uma leitura e outra.
const JUMP_CUSHION = 1500
function readMap<T>(key: string): Record<string, T> {
  try { const r = localStorage.getItem(key); if (r) return JSON.parse(r) as Record<string, T> } catch { /* ignora */ }
  return {}
}
function writeMap(key: string, m: unknown) { try { localStorage.setItem(key, JSON.stringify(m)) } catch { /* ignora */ } }
function detectJumps(list: LiveRow[]): Record<string, JumpInfo> {
  const seen = readMap<SeenSnap>(SEEN_KEY)
  const jumps = readMap<JumpInfo>(JUMPS_KEY)
  for (const p of list) {
    if (p.mode !== 'career' || !p.uid || typeof p.careerCoins !== 'number') continue
    const cur: SeenSnap = { coins: p.careerCoins, titles: p.careerTitles ?? 0, season: p.careerSeason ?? 1, at: Date.now() }
    const prev = seen[p.uid]
    if (prev) {
      const seasonsPassed = Math.max(0, cur.season - prev.season)
      const allowedGain = JUMP_CUSHION + seasonsPassed * COIN_PER_SEASON
      const j: JumpInfo = { ...(jumps[p.uid] ?? { at: 0 }) }
      let hit = false
      if (cur.coins - prev.coins > allowedGain) { j.coinsFrom = prev.coins; j.coinsTo = cur.coins; hit = true }
      if (cur.titles - prev.titles > seasonsPassed + 1) { j.titlesFrom = prev.titles; j.titlesTo = cur.titles; hit = true }
      if (hit) { j.at = Date.now(); jumps[p.uid] = j }
    }
    seen[p.uid] = cur
  }
  writeMap(SEEN_KEY, seen)
  writeMap(JUMPS_KEY, jumps)
  return jumps
}
// texto do pulo pra mostrar na linha do jogador
function jumpReasons(j: JumpInfo | undefined): string[] {
  if (!j) return []
  const out: string[] = []
  if (j.coinsTo != null) out.push(`💰 PULO: ${nf(j.coinsFrom ?? 0)} → ${nf(j.coinsTo)} moedas`)
  if (j.titlesTo != null) out.push(`🏆 PULO: ${j.titlesFrom ?? 0} → ${j.titlesTo} títulos`)
  return out
}

type DailyRow = { day: string; plays: number; cpu: number; online: number; visits: number }
type UserRow = { name: string; sid: string; total: number; today: number; last_play: string; registered: boolean }
type LiveRow = { name: string; mode: string; screen: string; playing: boolean; ago: number; careerSeason?: number | null; careerDivision?: string | null; deckLeague?: string | null; registered?: boolean; careerCoins?: number | null; careerTitles?: number | null; uid?: string | null }
// elenco da carreira de um usuário CADASTRADO (lido do save na nuvem, só admin)
type SquadCard = { name: string; pos: string; lo?: number; hi?: number; paid?: number; fame?: number; fake?: boolean; reforco?: boolean }
type SquadView = { team: string; season?: number; division?: string | null; coins?: string | null; formation?: string; updated?: string; squad: SquadCard[] }
type CareerRow = { name: string; division: string; season: number; titles: number; updated: string }
type Dash = {
  online_now: number; playing_now: number; live_list: LiveRow[]
  peak: number; peak_at: string
  today: number; week: number; month: number; total: number
  today_cpu: number; today_online: number
  week_cpu: number; week_online: number
  month_cpu: number; month_online: number
  total_cpu: number; total_online: number
  players_total: number; players_today: number
  returning_players: number; returning_7d: number
  visits_today: number; visits_week: number; visits_month: number; visits_total: number
  visitors_today: number; visitors_total: number
  daily: DailyRow[]; users: UserRow[]; careers: CareerRow[]
}
const DIV_LABEL: Record<string, string> = { A: 'Série A', B: 'Série B', C: 'Série C', D: 'Série D' }

const SCREEN_LABEL: Record<string, string> = {
  intro: 'Na home', lobby: 'Na sala (esperando)',
  setup: 'Montando', auction: 'No leilão', monte: 'No monte',
  cerimonia: 'Cerimônia', season: 'Temporada', end: 'Fim', album: 'Álbum', ranking: 'Ranking',
}
// modo do jogador ao vivo: carreira x partida rápida x online
const MODE_LABEL: Record<string, string> = { career: 'modo carreira', online: 'partida online', cpu: 'partida rápida' }
const MODE_ICON: Record<string, string> = { career: '🪜', online: '👥', cpu: '🤖' }

function useHashAdmin() {
  const [on, setOn] = useState(() => typeof window !== 'undefined' && window.location.hash === '#admin')
  useEffect(() => {
    const f = () => setOn(window.location.hash === '#admin')
    window.addEventListener('hashchange', f)
    return () => window.removeEventListener('hashchange', f)
  }, [])
  return on
}

export function AdminPanel() {
  const open = useHashAdmin()
  if (!open) return null
  return <AdminOverlay />
}

// hook: true só quando o usuário logado é o admin
export function useIsAdmin() {
  const [isAdmin, setIsAdmin] = useState(false)
  useEffect(() => {
    let alive = true
    supabase.auth.getUser().then(({ data }) => { if (alive) setIsAdmin(data?.user?.email === ADMIN_EMAIL) })
    const { data: sub } = supabase.auth.onAuthStateChange((_, s) => setIsAdmin(s?.user?.email === ADMIN_EMAIL))
    return () => { alive = false; sub.subscription.unsubscribe() }
  }, [])
  return isAdmin
}

// hook: true quando o usuário logado pode acessar o MODO MANAGER (criador + testers)
export function useCanManager() {
  const [ok, setOk] = useState(false)
  useEffect(() => {
    let alive = true
    const check = (email?: string | null) => MANAGER_TESTERS.includes((email ?? '').toLowerCase())
    supabase.auth.getUser().then(({ data }) => { if (alive) setOk(check(data?.user?.email)) })
    const { data: sub } = supabase.auth.onAuthStateChange((_, s) => setOk(check(s?.user?.email)))
    return () => { alive = false; sub.subscription.unsubscribe() }
  }, [])
  return ok
}

// mesma ideia do useCanManager, mas pra CARREIRA ONLINE (4 divisões) em teste.
export function useCanCareerOnline() {
  const [ok, setOk] = useState(false)
  useEffect(() => {
    let alive = true
    const check = (email?: string | null) => CAREER_ONLINE_TESTERS.includes((email ?? '').toLowerCase())
    supabase.auth.getUser().then(({ data }) => { if (alive) setOk(check(data?.user?.email)) })
    const { data: sub } = supabase.auth.onAuthStateChange((_, s) => setOk(check(s?.user?.email)))
    return () => { alive = false; sub.subscription.unsubscribe() }
  }, [])
  return ok
}

// botão que SÓ aparece pro criador (quando logado com o e-mail admin).
export function AdminButton() {
  const isAdmin = useIsAdmin()
  if (!isAdmin) return null
  return (
    <button onClick={() => { window.location.hash = 'admin' }} style={{
      width: '100%', boxSizing: 'border-box', background: 'transparent', color: GOLD,
      border: `2px solid ${GOLD}`, borderRadius: 99, padding: '9px 16px',
      fontWeight: 800, fontSize: 14, cursor: 'pointer', marginTop: 2, ...OSWALD,
    }}>
      📊 Painel do Criador
    </button>
  )
}

function AdminOverlay() {
  const [email, setEmail] = useState<string | null | undefined>(undefined) // undefined = carregando
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [form, setForm] = useState({ email: '', pass: '' })

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data?.user?.email ?? null))
    const { data: sub } = supabase.auth.onAuthStateChange((_, s) => setEmail(s?.user?.email ?? null))
    return () => sub.subscription.unsubscribe()
  }, [])

  const close = () => { window.location.hash = '' }

  const login = async () => {
    setErr(''); setBusy(true)
    const { error } = await supabase.auth.signInWithPassword({ email: form.email.trim(), password: form.pass })
    setBusy(false)
    if (error) setErr('E-mail ou senha incorretos.')
  }

  const isAdmin = email === ADMIN_EMAIL

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200, background: '#111', color: '#fff',
      overflowY: 'auto', ...OSWALD,
    }}>
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '18px 16px 60px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0, letterSpacing: 0.5 }}>
            📊 Painel do Criador
          </h1>
          <button onClick={close} style={btn('#333', '#fff')}>Voltar ao jogo ✕</button>
        </div>

        {email === undefined && <p style={{ opacity: 0.6 }}>Carregando…</p>}

        {email === null && (
          <div style={card()}>
            <p style={{ fontWeight: 700, marginBottom: 12 }}>Entre com a conta do criador</p>
            <input placeholder="E-mail" value={form.email} autoCapitalize="none"
              onChange={e => setForm({ ...form, email: e.target.value })} style={input()} />
            <input placeholder="Senha" type="password" value={form.pass}
              onChange={e => setForm({ ...form, pass: e.target.value })}
              onKeyDown={e => e.key === 'Enter' && login()} style={input()} />
            {err && <p style={{ color: '#FF6B5A', fontSize: 13, margin: '4px 0 10px' }}>{err}</p>}
            <button onClick={login} disabled={busy} style={btn(GOLD, INK)}>
              {busy ? 'Entrando…' : 'Entrar'}
            </button>
          </div>
        )}

        {email && !isAdmin && (
          <div style={card()}>
            <p style={{ fontWeight: 700, fontSize: 18, marginBottom: 6 }}>🔒 Acesso restrito</p>
            <p style={{ opacity: 0.7, marginBottom: 14 }}>
              A conta <b>{email}</b> não é a do criador. Este painel é privado.
            </p>
            <button onClick={() => logout()} style={btn('#333', '#fff')}>Trocar de conta</button>
          </div>
        )}

        {isAdmin && <Dashboard email={email!} />}
      </div>
    </div>
  )
}

function Dashboard({ email }: { email: string }) {
  const [d, setD] = useState<Dash | null>(null)
  const [err, setErr] = useState('')
  const [updatedAt, setUpdatedAt] = useState<number>(0)
  // 🔽 ordenar a lista ao vivo por métrica da carreira (offline). 'default' = ordem
  // do "no site agora". Clicar de novo na mesma métrica inverte (mais → menos).
  const [sortKey, setSortKey] = useState<'default' | 'coins' | 'titles' | 'seasons' | 'suspect'>('default')
  const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc')
  // 🚩 pulos detectados (uid → salto), guardados no aparelho do admin
  const [jumps, setJumps] = useState<Record<string, JumpInfo>>(() => readMap<JumpInfo>(JUMPS_KEY))
  const clearJumps = () => { writeMap(JUMPS_KEY, {}); setJumps({}) }
  const pickSort = (k: 'coins' | 'titles' | 'seasons' | 'suspect') => {
    if (sortKey === k) setSortDir(d => d === 'desc' ? 'asc' : 'desc')
    else { setSortKey(k); setSortDir('desc') }
  }
  // 👀 espiar o ELENCO da carreira de quem tem conta (save na nuvem, só admin)
  const [squad, setSquad] = useState<{ name: string; loading: boolean; data?: SquadView | null } | null>(null)
  const openSquad = async (p: LiveRow) => {
    if (!p.uid) return
    setSquad({ name: p.name, loading: true })
    try {
      const { data, error } = await supabase.rpc('esc_admin_career_squad', { p_user: p.uid })
      setSquad({ name: p.name, loading: false, data: error ? null : (data as SquadView | null) })
    } catch { setSquad({ name: p.name, loading: false, data: null }) }
  }

  // 🎨 intenções de apoio (modal APOIE): quem tocou em quê — pra cruzar com o Pix
  const [intents, setIntents] = useState<{ id: number; created_at: string; email: string | null; nick: string | null; choice: string }[]>([])
  // 🔒 saves que o LACRE pegou editados na mão (esc_cheat_flags) — só marca, nada é feito
  const [cheats, setCheats] = useState<Record<string, { name: string; detail: string; at: string }>>({})
  const load = useCallback(async () => {
    try {
      supabase.from('apoio_intents').select('*').order('id', { ascending: false }).limit(40)
        .then(({ data: it }) => { if (it) setIntents(it as typeof intents) }, () => {})
      // 🔒 lista dos saves marcados pelo lacre (se a tabela ainda não existe, ignora)
      supabase.from('esc_cheat_flags').select('user_id, display_name, detail, last_at').order('last_at', { ascending: false }).limit(200)
        .then(({ data: cf }) => {
          if (!cf) return
          const m: Record<string, { name: string; detail: string; at: string }> = {}
          for (const r of cf as { user_id: string; display_name: string | null; detail: string | null; last_at: string }[]) m[r.user_id] = { name: r.display_name || 'Técnico', detail: r.detail || '', at: r.last_at }
          setCheats(m)
        }, () => {})
      // 🛟 se a janela cheia (30d/200) estourar o tempo do banco ("statement
      // timeout"), tenta de novo com janelas menores em vez de mostrar erro —
      // o painel carrega com o que der. (Correção definitiva é um índice no banco.)
      const scopes = [{ d: 30, u: 200 }, { d: 14, u: 120 }, { d: 7, u: 80 }]
      let lastErr = ''
      for (const s of scopes) {
        const { data, error } = await supabase.rpc('esc_admin_dashboard', { p_days: s.d, p_users: s.u })
        if (!error) { setErr(''); setD(data as Dash); setUpdatedAt(Date.now()); setJumps(detectJumps((data as Dash).live_list ?? [])); return }
        lastErr = error.message
        if (!/timeout|canceling statement/i.test(error.message)) break // erro que não é lentidão: reduzir não adianta
      }
      setErr(lastErr || 'erro ao carregar')
    } catch {
      // backend fora (instabilidade Supabase): mostra aviso em vez de travar em "Carregando…"
      setErr('Servidor fora do ar (instabilidade). Re-tentando sozinho a cada 12s…')
    }
  }, [])

  useEffect(() => {
    load()
    const iv = setInterval(load, 12_000)
    return () => clearInterval(iv)
  }, [load])

  if (err) return <div style={card()}><p style={{ color: '#FF6B5A' }}>Erro ao carregar: {err}</p></div>
  if (!d) return <p style={{ opacity: 0.6 }}>Carregando dados…</p>

  const maxDay = Math.max(1, ...d.daily.map(x => Math.max(x.plays, x.visits)))

  // títulos por técnico (só quem tem CONTA aparece em d.careers — carreira anônima
  // não grava). Cruzamos com a lista "ao vivo" pelo nome pra mostrar o 🏆 na linha
  // de quem está jogando carreira agora. Se o nome do time diferir do nome da conta,
  // o troféu pode não casar — é o melhor cruzamento possível sem tocar no banco.
  const titlesByName = new Map<string, number>()
  for (const c of d.careers) if (c.titles > 0) titlesByName.set(c.name.trim().toLowerCase(), c.titles)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* 👀 modal do ELENCO (carreira de usuário cadastrado, lido da nuvem) */}
      {squad && (
        <div onClick={() => setSquad(null)} style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 14 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#161616', border: `2px solid ${GOLD}`, borderRadius: 14, padding: 16, width: '100%', maxWidth: 440, maxHeight: '82vh', overflowY: 'auto', color: '#eee' }}>
            {squad.loading ? <p style={{ opacity: .7 }}>Buscando o elenco de <b>{squad.name}</b>…</p>
            : !squad.data ? <p style={{ opacity: .7 }}>Sem save na nuvem pra <b>{squad.name}</b> (a carreira pode ser de antes do login, ou o SQL ainda não foi rodado).</p>
            : (() => {
              const v = squad.data
              const ORD = ['GOL', 'LAT', 'ZAG', 'MEI', 'ATA']
              const list = [...(v.squad ?? [])].sort((a, b) => (ORD.indexOf(a.pos) - ORD.indexOf(b.pos)) || (((b.lo ?? 0) + (b.hi ?? 0)) - ((a.lo ?? 0) + (a.hi ?? 0))))
              // 🚩 elenco forte demais pra divisão: craques (mid ≥ 85) num time de série baixa
              const craques = list.filter(c => !c.fake && ((c.lo ?? 0) + (c.hi ?? 0)) / 2 >= 85).length
              const tooStrong = (v.division === 'D' || v.division === 'C') && craques >= 4
              return (
                <>
                  <p style={{ fontWeight: 800, fontSize: 17, margin: '0 0 2px', ...OSWALD }}>🪜 {v.team || squad.name}</p>
                  <p style={{ fontSize: 12, opacity: .7, margin: '0 0 10px' }}>
                    {v.division ? `${DIV_LABEL[v.division] ?? v.division} · ` : ''}T{v.season ?? '?'}{v.coins != null ? ` · 💰 ${v.coins}` : ''}{v.formation ? ` · ${v.formation}` : ''} · {list.length} jogadores
                  </p>
                  {tooStrong && (
                    <p style={{ background: 'rgba(255,77,77,.15)', border: '1px solid rgba(255,77,77,.5)', borderRadius: 8, padding: '7px 9px', margin: '0 0 10px', fontSize: 12, fontWeight: 700, color: '#FF6B6B' }}>
                      🚩 Elenco muito acima da Série {v.division}: {craques} craques (nível ≥ 85). Provável save editado no DevTools — a carreira é client-side. Só um alerta.
                    </p>
                  )}
                  {list.map((c, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'baseline', gap: 8, fontSize: 13, padding: '4px 0', borderTop: '1px solid rgba(255,255,255,.08)', opacity: c.fake ? .45 : 1 }}>
                      <span style={{ flex: 'none', width: 34, fontWeight: 800, fontSize: 10.5, color: GOLD }}>{c.pos}</span>
                      <span style={{ fontWeight: 700, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}{c.reforco ? ' 🆕' : ''}{c.fake ? ' (zé)' : ''}</span>
                      <span style={{ marginLeft: 'auto', flex: 'none', fontSize: 11.5, opacity: .75 }}>nv {c.lo ?? '?'}–{c.hi ?? '?'}</span>
                      {(c.paid ?? 0) > 0 && <span style={{ flex: 'none', fontSize: 11.5, color: '#7FE3A0', fontWeight: 700 }}>💰{c.paid}</span>}
                    </div>
                  ))}
                  <button onClick={() => setSquad(null)} style={{ marginTop: 12, width: '100%', background: GOLD, color: INK, border: 'none', borderRadius: 9, padding: 10, fontWeight: 800, fontSize: 13, cursor: 'pointer', ...OSWALD }}>Fechar</button>
                </>
              )
            })()}
          </div>
        </div>
      )}
      {/* AO VIVO NO SITE */}
      <div style={{ ...card(), borderColor: d.online_now > 0 ? '#2E9E5B' : '#333' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            width: 12, height: 12, borderRadius: 99,
            background: d.online_now > 0 ? '#37D067' : '#555',
            boxShadow: d.online_now > 0 ? '0 0 10px #37D067' : 'none', display: 'inline-block',
          }} />
          <span style={{ fontSize: 20, fontWeight: 800 }}>
            {d.online_now > 0 ? `${d.online_now} no site agora` : 'Ninguém no site agora'}
          </span>
          {d.online_now > 0 && (
            <span style={{ marginLeft: 'auto', fontSize: 13, opacity: 0.7 }}>
              🎮 {d.playing_now} jogando · 👀 {d.online_now - d.playing_now} só olhando
            </span>
          )}
        </div>
        <div style={{ marginTop: 8, fontSize: 13, fontWeight: 700, color: d.online_now >= d.peak && d.online_now > 0 ? '#37D067' : '#F5B301' }}>
          {d.online_now >= d.peak && d.online_now > 0 ? '🔥 NOVO RECORDE ao vivo!' : `🏆 Recorde ao vivo: ${d.peak}`}
        </div>
        {d.live_list.length > 0 && (() => {
          // ordena por métrica de carreira; não-carreira (e sem o dado) sempre embaixo.
          const metric = (p: LiveRow): number | null => {
            if (p.mode !== 'career') return null
            if (sortKey === 'coins') return p.careerCoins ?? null
            if (sortKey === 'titles') return p.careerTitles ?? null
            if (sortKey === 'seasons') return p.careerSeason ?? null
            if (sortKey === 'suspect') return (suspectReasons(p).length > 0 || (p.uid ? (jumpReasons(jumps[p.uid]).length > 0 || !!cheats[p.uid]) : false)) ? 1 : 0
            return null
          }
          const rows = sortKey === 'default' ? d.live_list : [...d.live_list].sort((a, b) => {
            const ma = metric(a), mb = metric(b)
            if (ma == null && mb == null) return 0
            if (ma == null) return 1   // quem não é carreira/sem dado fica abaixo
            if (mb == null) return -1
            return sortDir === 'desc' ? (mb - ma) : (ma - mb)
          })
          const arrow = sortDir === 'desc' ? ' ↓' : ' ↑'
          const SORTS: ['coins' | 'titles' | 'seasons' | 'suspect', string][] = [['coins', '💰 Caixa'], ['titles', '🏆 Títulos'], ['seasons', '📅 Temporadas'], ['suspect', '🚩 Suspeitos']]
          return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 12 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 4 }}>
              <span style={{ fontSize: 11, opacity: .55, alignSelf: 'center', fontWeight: 700 }}>Ordenar (carreira):</span>
              {SORTS.map(([k, label]) => (
                <button key={k} onClick={() => pickSort(k)} style={{ fontSize: 11.5, fontWeight: 800, padding: '4px 9px', borderRadius: 8, cursor: 'pointer', border: `1px solid ${sortKey === k ? GOLD : 'rgba(255,255,255,.2)'}`, background: sortKey === k ? 'rgba(245,179,1,.18)' : 'transparent', color: sortKey === k ? GOLD : '#ccc' }}>
                  {label}{sortKey === k ? arrow : ''}
                </button>
              ))}
              {sortKey !== 'default' && (
                <button onClick={() => setSortKey('default')} style={{ fontSize: 11.5, fontWeight: 700, padding: '4px 9px', borderRadius: 8, cursor: 'pointer', border: '1px solid rgba(255,255,255,.2)', background: 'transparent', color: '#999' }}>✕ limpar</button>
              )}
              {Object.keys(jumps).length > 0 && (
                <button onClick={clearJumps} title="Esquece os pulos já marcados (recomeça a observar do valor atual). Não mexe em nada da conta do jogador." style={{ fontSize: 11.5, fontWeight: 800, padding: '4px 9px', borderRadius: 8, cursor: 'pointer', border: '1px solid rgba(255,77,77,.5)', background: 'rgba(255,77,77,.12)', color: '#FF7A7A' }}>🧹 limpar pulos ({Object.keys(jumps).length})</button>
              )}
            </div>
            {rows.map((p, i) => {
              // 🚩 junta o PULO (salto no tempo) + a plausibilidade (impossível pro
              // tanto de temporada) numa lista só — mostrada em vermelho na linha.
              const reasons = [...(p.uid ? jumpReasons(jumps[p.uid]) : []), ...suspectReasons(p)]
              return (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, opacity: 0.92 }}>
                <span>
                  {p.playing ? (MODE_ICON[p.mode] || '🤖') : '👀'}{' '}
                  {p.mode === 'career' && p.registered && p.uid
                    ? <b onClick={() => openSquad(p)} title="ver elenco (só admin)" style={{ cursor: 'pointer', textDecoration: 'underline', textDecorationColor: 'rgba(245,179,1,.6)' }}>{p.name}</b>
                    : <b>{p.name}</b>}
                  {p.registered === true ? <span title="tem conta"> 🔑</span> : p.registered === false ? <span title="anônimo (sem conta)" style={{ opacity: 0.7 }}> 👤</span> : null}
                  <span style={{ opacity: 0.6 }}> · {SCREEN_LABEL[p.screen] || p.screen}</span>
                  {p.playing && <span style={{ opacity: 0.6 }}> · {MODE_LABEL[p.mode] || p.mode}</span>}
                  {p.mode === 'career' && p.careerDivision && (
                    <span style={{ opacity: 0.85, color: '#C9A9FF', fontWeight: 700 }}> · {DIV_LABEL[p.careerDivision] || p.careerDivision} · T{p.careerSeason ?? 1}</span>
                  )}
                  {p.uid && cheats[p.uid] && (
                    <span title={`🔒 LACRE não bateu: esse save foi EDITADO NA MÃO (${cheats[p.uid].detail}). Convicção alta — o carimbo secreto não fecha com os números. Nada é feito com a conta; você decide.`} style={{ color: '#FF2D2D', fontWeight: 900 }}> · 🔒 mexeu na mão</span>
                  )}
                  {reasons.length > 0 && (
                    <span title="🚩 Alerta pra você OBSERVAR — a carreira roda no navegador do jogador (dá pra editar no DevTools). Nada é feito com a conta." style={{ color: '#FF4D4D', fontWeight: 900 }}> · 🚩 {reasons.join(' · ')}</span>
                  )}
                  {/* 💰 caixa atual + 🏆 títulos (qualquer série) — vêm do próprio
                      batimento, então funciona pra anônimo e pra pirâmide também.
                      Sem o dado novo (app antigo), cai no fallback por nome. */}
                  {p.mode === 'career' && typeof p.careerCoins === 'number' && (
                    p.careerCoins < 0
                      ? <span title="Caixa no vermelho — a folha ficou maior que o caixa (dívida)." style={{ color: '#FF6B57', fontWeight: 900 }}> · 💰 −{Math.abs(p.careerCoins)}</span>
                      : p.careerCoins >= COINS_ALERT
                        ? <span title={`⚠️ Caixa suspeita: ${p.careerCoins} moedas (limite ${COINS_ALERT}). O valor é auto-reportado pelo navegador do jogador e o servidor não valida — pode ter sido adulterado. Só um alerta pra você observar; nada é feito com a conta.`} style={{ color: '#FF6B57', fontWeight: 900 }}> · ⚠️ 💰 {p.careerCoins}</span>
                        : <span style={{ color: '#7FE3A0', fontWeight: 800 }}> · 💰 {p.careerCoins}</span>
                  )}
                  {p.mode === 'career' && ((p.careerTitles ?? -1) > 0
                    ? <span style={{ color: GOLD, fontWeight: 800 }}> · 🏆 {p.careerTitles}</span>
                    : p.careerTitles == null && (titlesByName.get(p.name.trim().toLowerCase()) ?? 0) > 0
                      ? <span style={{ color: GOLD, fontWeight: 800 }}> · 🏆 {titlesByName.get(p.name.trim().toLowerCase())}</span>
                      : null)}
                  {p.playing && p.mode !== 'online' && p.deckLeague && (
                    <span style={{ opacity: 0.9, color: p.deckLeague === 'eu' ? '#7FD1FF' : p.deckLeague === 'both' ? '#C9A9FF' : '#FFD24D', fontWeight: 800 }}> · {p.deckLeague === 'eu' ? 'EU' : p.deckLeague === 'both' ? 'B/E' : 'BR'}</span>
                  )}
                </span>
                <span style={{ opacity: 0.5 }}>{p.ago < 60 ? 'agora' : `${Math.floor(p.ago / 60)}min`}</span>
              </div>
              )
            })}
          </div>
          )
        })()}
      </div>

      {/* 🔒 SAVES EDITADOS NA MÃO (lacre): lista completa, mesmo de quem não está online.
          Nada é feito com a conta — é só pra você olhar e decidir na mão. */}
      {Object.keys(cheats).length > 0 && (
        <div style={{ ...card(), borderColor: '#FF2D2D' }}>
          <p style={{ fontWeight: 700, marginBottom: 4 }}>🔒 Saves editados na mão <span style={{ opacity: .5, fontWeight: 400, fontSize: 12 }}>(o lacre não bateu · convicção alta · só você vê · nada é feito com a conta)</span></p>
          <div style={{ maxHeight: 260, overflowY: 'auto' }}>
            {Object.entries(cheats).sort((a, b) => (a[1].at < b[1].at ? 1 : -1)).map(([uid, c]) => {
              const dt = new Date(c.at)
              const when = `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')} ${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`
              return (
                <div key={uid} style={{ display: 'flex', gap: 8, alignItems: 'baseline', padding: '3px 0', borderBottom: '1px solid rgba(255,255,255,.06)', fontSize: 12.5 }}>
                  <span style={{ opacity: .45, flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>{when}</span>
                  <span style={{ fontWeight: 800, color: '#FF6B57', flexShrink: 0, maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</span>
                  <span style={{ opacity: .85 }}>{c.detail}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* 🎨 INTENÇÕES DE APOIO: toques no modal APOIE — cruza com o Pix que chegou */}
      {intents.length > 0 && (
        <div style={{ ...card(), borderColor: '#8B5CF6' }}>
          <p style={{ fontWeight: 700, marginBottom: 4 }}>🎨 Intenções de apoio <span style={{ opacity: .5, fontWeight: 400, fontSize: 12 }}>(toques no APOIE · só você vê)</span></p>
          <div style={{ maxHeight: 260, overflowY: 'auto' }}>
            {intents.map(it => {
              const dt = new Date(it.created_at)
              const when = `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')} ${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`
              const who = it.nick || it.email || 'anônimo'
              return (
                <div key={it.id} style={{ display: 'flex', gap: 8, alignItems: 'baseline', padding: '3px 0', borderBottom: '1px solid rgba(255,255,255,.06)', fontSize: 12.5 }}>
                  <span style={{ opacity: .45, flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>{when}</span>
                  <span style={{ fontWeight: 700, flexShrink: 0, maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{who}</span>
                  <span style={{ opacity: .85 }}>{it.choice}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* PARTIDAS por período (com corte CPU × online) */}
      <div style={card()}>
        <p style={{ fontWeight: 700, marginBottom: 10 }}>🔨 Partidas jogadas</p>
        <Matrix rows={[
          { k: 'Hoje',    total: d.today, cpu: d.today_cpu,  online: d.today_online,  hot: true },
          { k: '7 dias',  total: d.week,  cpu: d.week_cpu,   online: d.week_online },
          { k: '30 dias', total: d.month, cpu: d.month_cpu,  online: d.month_online },
          { k: 'Total',   total: d.total, cpu: d.total_cpu,  online: d.total_online },
        ]} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10, marginTop: 12 }}>
          <Stat label="Jogadores hoje" value={d.players_today} sub="aparelhos distintos" />
          <Stat label="Jogadores no total" value={d.players_total} sub="aparelhos distintos" />
        </div>
      </div>

      {/* RETORNO — quem volta = tá gostando */}
      <div style={card()}>
        <p style={{ fontWeight: 700, marginBottom: 4 }}>🔁 Retorno</p>
        <p style={{ fontSize: 12, opacity: 0.5, marginBottom: 12 }}>Quem volta a jogar em outro dia = tá gostando. É o melhor termômetro.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10 }}>
          <Stat label="Voltaram (2+ dias)" value={d.returning_players} sub={`${d.players_total ? Math.round(d.returning_players / d.players_total * 100) : 0}% dos jogadores`} accent={GOLD} />
          <Stat label="Ativos que voltam (7d)" value={d.returning_7d} sub="jogaram de novo essa semana" />
        </div>
      </div>

      {/* VISITAS ao site */}
      <div style={card()}>
        <p style={{ fontWeight: 700, marginBottom: 10 }}>👁️ Visitas ao site (abriram o link)</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
          <Stat label="Hoje" value={d.visits_today} accent={GOLD} />
          <Stat label="7 dias" value={d.visits_week} />
          <Stat label="30 dias" value={d.visits_month} />
          <Stat label="Total" value={d.visits_total} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10, marginTop: 10 }}>
          <Stat label="Visitantes hoje" value={d.visitors_today} sub="aparelhos distintos" />
          <Stat label="Visitantes no total" value={d.visitors_total} sub="aparelhos distintos" />
        </div>
      </div>

      {/* GRÁFICO 30 DIAS — visitas (fundo) + partidas (frente) */}
      <div style={card()}>
        <p style={{ fontWeight: 700, marginBottom: 4 }}>📈 Últimos 30 dias</p>
        <p style={{ fontSize: 12, opacity: 0.5, marginBottom: 12 }}>
          <span style={{ color: '#4A4A4A' }}>▮</span> visitas &nbsp;·&nbsp; <span style={{ color: GOLD }}>▮</span> partidas
        </p>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 90 }}>
          {d.daily.map((x, i) => (
            <div key={i} title={`${fmtDay(x.day)} — ${x.visits} visita(s), ${x.plays} partida(s) (🤖 ${x.cpu} · 👥 ${x.online})`}
              style={{ flex: 1, height: '100%', display: 'flex', alignItems: 'flex-end', position: 'relative' }}>
              <div style={{
                position: 'absolute', left: 0, right: 0, bottom: 0,
                height: `${(x.visits / maxDay) * 100}%`, minHeight: x.visits ? 3 : 1,
                background: '#3a3a3a', borderRadius: '3px 3px 0 0',
              }} />
              <div style={{
                position: 'absolute', left: 0, right: 0, bottom: 0,
                height: `${(x.plays / maxDay) * 100}%`, minHeight: x.plays ? 3 : 0,
                background: GOLD, borderRadius: '3px 3px 0 0',
              }} />
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, opacity: 0.4, marginTop: 6 }}>
          <span>{fmtDay(d.daily[0]?.day)}</span>
          <span>hoje</span>
        </div>
      </div>

      {/* POR JOGADOR */}
      <div style={card()}>
        <p style={{ fontWeight: 700, marginBottom: 12 }}>👥 Por jogador ({d.users.length})</p>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={rowHead()}>
            <span style={{ flex: 1 }}>Jogador</span>
            <span style={{ width: 54, textAlign: 'right' }}>Hoje</span>
            <span style={{ width: 54, textAlign: 'right' }}>Total</span>
            <span style={{ width: 78, textAlign: 'right' }}>Último</span>
          </div>
          {d.users.length === 0 && <p style={{ opacity: 0.5, fontSize: 14, padding: '8px 0' }}>Ninguém jogou ainda.</p>}
          {d.users.map((u, i) => (
            <div key={u.sid} style={row(i)}>
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {u.registered ? '🔑' : '👤'} {u.name}
              </span>
              <span style={{ width: 54, textAlign: 'right', color: u.today ? GOLD : '#fff' }}>{u.today}</span>
              <span style={{ width: 54, textAlign: 'right', fontWeight: 700 }}>{u.total}</span>
              <span style={{ width: 78, textAlign: 'right', opacity: 0.5, fontSize: 12 }}>{ago(u.last_play)}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', opacity: 0.5, fontSize: 12 }}>
        <span>Logado: {email}</span>
        <span>Atualiza sozinho · {updatedAt ? new Date(updatedAt).toLocaleTimeString('pt-BR') : ''}</span>
      </div>
      <button onClick={() => logout()} style={{ ...btn('#2a2a2a', '#fff'), opacity: 0.7 }}>Sair da conta</button>
    </div>
  )
}

function Matrix({ rows }: { rows: { k: string; total: number; cpu: number; online: number; hot?: boolean }[] }) {
  return (
    <div>
      <div style={{ display: 'flex', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, opacity: 0.4, padding: '0 0 6px', borderBottom: '1px solid #333' }}>
        <span style={{ flex: 1 }}>Período</span>
        <span style={{ width: 70, textAlign: 'right' }}>Total</span>
        <span style={{ width: 70, textAlign: 'right' }}>🤖 CPU</span>
        <span style={{ width: 74, textAlign: 'right' }}>👥 Online</span>
      </div>
      {rows.map(r => (
        <div key={r.k} style={{ display: 'flex', alignItems: 'center', fontSize: 15, padding: '9px 0', borderBottom: '1px solid #262626' }}>
          <span style={{ flex: 1, opacity: 0.8 }}>{r.k}</span>
          <span style={{ width: 70, textAlign: 'right', fontWeight: 800, color: r.hot ? GOLD : '#fff' }}>{r.total}</span>
          <span style={{ width: 70, textAlign: 'right', opacity: 0.75 }}>{r.cpu}</span>
          <span style={{ width: 74, textAlign: 'right', opacity: 0.75 }}>{r.online}</span>
        </div>
      ))}
    </div>
  )
}

function Stat({ label, value, sub, accent }: { label: string; value: number; sub?: string; accent?: string }) {
  return (
    <div style={card(10)}>
      <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, opacity: 0.55, margin: 0 }}>{label}</p>
      <p style={{ fontSize: 30, fontWeight: 800, margin: '2px 0 0', color: accent || '#fff' }}>{value}</p>
      {sub && <p style={{ fontSize: 11, opacity: 0.45, margin: 0 }}>{sub}</p>}
    </div>
  )
}

// ── helpers de estilo ──
function card(pad = 16): React.CSSProperties {
  return { background: '#1b1b1b', border: '1px solid #333', borderRadius: 14, padding: pad }
}
function btn(bg: string, ink: string): React.CSSProperties {
  return { background: bg, color: ink, border: 'none', borderRadius: 10, padding: '10px 16px', fontWeight: 800, fontSize: 14, cursor: 'pointer', ...OSWALD }
}
function input(): React.CSSProperties {
  return { width: '100%', boxSizing: 'border-box', background: '#111', border: '1px solid #444', borderRadius: 10, padding: '11px 13px', color: '#fff', fontSize: 15, marginBottom: 10, ...OSWALD }
}
function rowHead(): React.CSSProperties {
  return { display: 'flex', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, opacity: 0.4, padding: '0 0 6px', borderBottom: '1px solid #333' }
}
function row(i: number): React.CSSProperties {
  return { display: 'flex', alignItems: 'center', fontSize: 14, padding: '8px 0', borderBottom: '1px solid #262626', background: i % 2 ? 'transparent' : 'transparent' }
}

function fmtDay(iso?: string) {
  if (!iso) return ''
  const [, m, d] = iso.split('-')
  return `${d}/${m}`
}
function ago(iso?: string) {
  if (!iso) return '—'
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 60) return 'agora'
  if (s < 3600) return `${Math.floor(s / 60)}min`
  if (s < 86400) return `${Math.floor(s / 3600)}h`
  return `${Math.floor(s / 86400)}d`
}

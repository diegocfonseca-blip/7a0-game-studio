// ─── Painel do Criador — analytics do Leilão Legends 38 ───
// Aberto em qualquer hora via  leilaolegends.com/#admin
// Só libera pra conta admin (diego.c.fonseca@gmail.com). Qualquer outro login
// vê "acesso restrito". Os dados são lidos por uma função protegida no banco.

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

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
            <button onClick={() => supabase.auth.signOut()} style={btn('#333', '#fff')}>Trocar de conta</button>
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
  const load = useCallback(async () => {
    try {
      supabase.from('apoio_intents').select('*').order('id', { ascending: false }).limit(40)
        .then(({ data: it }) => { if (it) setIntents(it as typeof intents) }, () => {})
      // 🛟 se a janela cheia (30d/200) estourar o tempo do banco ("statement
      // timeout"), tenta de novo com janelas menores em vez de mostrar erro —
      // o painel carrega com o que der. (Correção definitiva é um índice no banco.)
      const scopes = [{ d: 30, u: 200 }, { d: 14, u: 120 }, { d: 7, u: 80 }]
      let lastErr = ''
      for (const s of scopes) {
        const { data, error } = await supabase.rpc('esc_admin_dashboard', { p_days: s.d, p_users: s.u })
        if (!error) { setErr(''); setD(data as Dash); setUpdatedAt(Date.now()); return }
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
              return (
                <>
                  <p style={{ fontWeight: 800, fontSize: 17, margin: '0 0 2px', ...OSWALD }}>🪜 {v.team || squad.name}</p>
                  <p style={{ fontSize: 12, opacity: .7, margin: '0 0 10px' }}>
                    {v.division ? `${DIV_LABEL[v.division] ?? v.division} · ` : ''}T{v.season ?? '?'}{v.coins != null ? ` · 💰 ${v.coins}` : ''}{v.formation ? ` · ${v.formation}` : ''} · {list.length} jogadores
                  </p>
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
        {d.live_list.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 12 }}>
            {d.live_list.map((p, i) => (
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
                  {/* 💰 caixa atual + 🏆 títulos (qualquer série) — vêm do próprio
                      batimento, então funciona pra anônimo e pra pirâmide também.
                      Sem o dado novo (app antigo), cai no fallback por nome. */}
                  {p.mode === 'career' && typeof p.careerCoins === 'number' && (
                    <span style={{ color: '#7FE3A0', fontWeight: 800 }}> · 💰 {p.careerCoins}</span>
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
            ))}
          </div>
        )}
      </div>

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
      <button onClick={() => supabase.auth.signOut()} style={{ ...btn('#2a2a2a', '#fff'), opacity: 0.7 }}>Sair da conta</button>
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

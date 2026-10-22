// 📝 MESA DE RENOVAÇÃO (22/10, mockup scripts/mockups/carreira-renovacao-nova.png — Diego: *"perfeito pode
// fazer"*). A janela de contratos encerrados virou uma mesa de CARTAS: cada pessoa (técnico, preparador,
// jogador) é uma carta com quem é, o que fez NO SEU CLUBE, os prazos com preço e dois botões grandes —
// ✍️ RENOVAR e 👋 DEIXAR IR. Decidiu? A carta encolhe numa faixa (verde ficou · vermelha vai embora).
// ⚠️ REGRAS NÃO MUDARAM: são as MESMAS ações do reducer de antes (RENEW_CONTRACT · RELEASE_CONTRACT ·
// RENOVAR_TECNICO · DISPENSAR_TECNICO · RENOVAR_PREPARADOR · DISPENSAR_PREPARADOR) e os mesmos preços
// (renewOptions/renewCost). Só a tela mudou — a regra de ouro contra botão mudo: a tela lê as mesmas
// funções do motor e só mostra botão que o reducer aceita.
import { useState } from 'react'
import type { Manager, WonCard } from './types'
import { useEsc, valorOficial, renewOptions, renewCost, type RenewAnos } from './store'
import { preparadorDe, precoRenovacaoPreparador } from './preparadores'
import { chaveCarry, condicaoAtiva } from './condicao'
import { FAME_TIER, PROMESSA_TIER } from './screens'
import { tr, getLang } from './lang'

const INK = '#0C0C0C'
const GOLD = '#FFC400'
const GREEN = '#1B7A3D'
const RED = '#C2452F'
const OSWALD = { fontFamily: 'Oswald, sans-serif' } as const

const TIER_EN: Record<string, string> = { '👑 LENDA': '👑 LEGEND', '⭐ CRAQUE': '⭐ STAR', '🎯 BOM JOGADOR': '🎯 GOOD PLAYER', '🪵 FOI PROFISSIONAL': '🪵 WAS A PRO', '💎 PROMESSA': '💎 PROSPECT' }
const tierDe = (c: WonCard) => (c.promessa ? PROMESSA_TIER : (FAME_TIER[c.fame] ?? FAME_TIER[1]))
// prazo padrão de cada carta: 5 anos se existir, senão o mais perto de 5 (mesma régua do "renovar todos")
const prazoPerto = (ops: RenewAnos[], alvo: number): RenewAnos => ops.find(a => a === alvo) ?? [...ops].sort((x, y) => Math.abs(x - alvo) - Math.abs(y - alvo) || y - x)[0]

type Feito = { id: string; nome: string; txt: string; sai: boolean }

const btnGrande = (bg: string, fg: string, dis = false): React.CSSProperties => ({
  flex: 1, border: `3px solid ${INK}`, borderRadius: 12, padding: '9px 4px', fontWeight: 900, fontSize: 14, ...OSWALD,
  textTransform: 'uppercase', background: dis ? '#d8cfb5' : bg, color: dis ? 'rgba(0,0,0,.4)' : fg,
  boxShadow: dis ? 'none' : `3px 3px 0 0 ${INK}`, cursor: dis ? 'not-allowed' : 'pointer', lineHeight: 1.1,
})
const tag = (txt: string) => (
  <span style={{ display: 'inline-block', background: INK, color: GOLD, ...OSWALD, fontWeight: 900, fontSize: 10, letterSpacing: '.1em', borderRadius: 6, padding: '2px 8px', margin: '2px 0 7px' }}>{txt}</span>
)

export function MesaRenovacao({ tecnicoOn }: { tecnicoOn: boolean }) {
  const { state, dispatch } = useEsc()
  const [feitos, setFeitos] = useState<Feito[]>([])
  const [prazo, setPrazo] = useState<Record<string, RenewAnos>>({})
  const mgr = state.managers[state.youIdx] as Manager | undefined
  if (!mgr) return null
  const youId = mgr.id
  const en = getLang() === 'en'
  const coins = state.careerCoins?.[youId] ?? 0

  // 🏛️ multiclube: o clube DORMINDO decide junto, na caixa DELE (regra de 04/08, igual antes)
  const dormM = state.multiClube ? state.managers.find(mm => mm.id === state.multiClube!.id) : undefined
  const expOf = (mm?: Manager) => mm ? (mm.squad as WonCard[]).filter(c => !c.fake && !c.emprestado && c.contratoAte != null && c.contratoAte < state.seasonNo) : []
  const expirados = expOf(mgr)
  const expDorm = expOf(dormM)
  const soltos = new Set(state.contratoRelease ?? [])
  const divDe = (mm: Manager) => (state.careerPlacements?.[`m${mm.id}`] ?? state.careerDivision ?? 'V') as string

  // 🧢 técnico vencido (só onde a carreira tem técnico — mesmo portão de antes)
  const nomeTec = tecnicoOn ? state.careerTecnicos?.[mgr.teamName] : undefined
  const fimTec = state.careerTecnicoContrato?.[mgr.teamName]
  const tecVencido = !!nomeTec && fimTec != null && fimTec < state.seasonNo
  const custoTec = nomeTec ? (state.careerTecnicoPago?.[nomeTec] ?? 0) : 0
  // 🏋️ preparador vencido (a mesma decisão que mora no Departamento Técnico do Elenco)
  const prep = state.careerOnline && state.onlineMode !== 'online' ? preparadorDe(state.careerPreparador?.[mgr.teamName]) : undefined
  const fimPrep = state.careerPreparadorContrato?.[mgr.teamName]
  const prepVencido = !!prep && fimPrep != null && fimPrep < state.seasonNo
  const custoPrep = prep ? precoRenovacaoPreparador(prep) : 0

  const pendentes = [...expirados, ...expDorm].filter(c => !soltos.has(c.id))
  const nDecidir = pendentes.length + (tecVencido ? 1 : 0) + (prepVencido ? 1 : 0)
  const nSoltos = [...expirados, ...expDorm].filter(c => soltos.has(c.id)).length
  if (nDecidir === 0 && nSoltos === 0 && feitos.length === 0) return null

  const anota = (f: Feito) => setFeitos(l => [...l.filter(x => x.id !== f.id), f])
  const renovar = (c: WonCard, dono: Manager, anos: RenewAnos) => {
    const custo = renewCost(valorOficial(state, c), anos)
    dispatch({ type: 'RENEW_CONTRACT', mgrId: dono.id, cardId: c.id, anos })
    anota({ id: c.id, nome: c.name, txt: en ? `renewed · ${anos} year${anos > 1 ? 's' : ''} · ${custo} 🪙` : `renovou · ${anos} ano${anos > 1 ? 's' : ''} · ${custo} 🪙`, sai: false })
  }
  // custo de renovar TODOS os pendentes do clube ativo por 5 anos (o número do placar de cima)
  const custoTodos5 = divDe(mgr) === 'V' ? 0 : expirados.filter(c => !soltos.has(c.id)).reduce((s, c) => {
    const ops = renewOptions(valorOficial(state, c)); return ops.length ? s + renewCost(valorOficial(state, c), prazoPerto(ops, 5) as RenewAnos) : s
  }, 0)

  // ── carta de UM jogador ─────────────────────────────────────────────────
  const cartaJogador = (c: WonCard, dono: Manager, saldo: number) => {
    const oficial = valorOficial(state, c)
    const ops = divDe(dono) === 'V' ? [] : renewOptions(oficial)
    const t = tierDe(c)
    if (soltos.has(c.id)) return (
      <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#FFE3D6', border: `3px solid ${RED}`, borderRadius: 14, padding: '8px 10px', marginBottom: 8 }}>
        <span style={{ fontSize: 16 }}>👋</span>
        <span style={{ flex: 1, minWidth: 0, fontSize: 11.5, fontWeight: 800, lineHeight: 1.3 }}><b style={{ ...OSWALD, fontSize: 14, textTransform: 'uppercase' }}>{c.name}</b> {state.reserveListMesmo ? tr('vai embora · sem venda', 'is leaving · no sale') : tr('vai embora · vai pro leilão', 'is leaving · off to the auction')}</span>
        <button onClick={() => dispatch({ type: 'RELEASE_CONTRACT', mgrId: dono.id, cardId: c.id })} style={{ background: 'none', border: 'none', ...OSWALD, fontWeight: 900, fontSize: 11.5, textDecoration: 'underline', cursor: 'pointer', color: INK, padding: 0 }}>{tr('desfazer', 'undo')}</button>
      </div>
    )
    const k = state.condicaoCarry?.[chaveCarry(c)]
    const gasOn = condicaoAtiva(state)
    const anos: RenewAnos | 0 = prazo[c.id] ?? (ops.length ? prazoPerto(ops, 5) : 0)
    const custo = anos ? renewCost(oficial, anos as RenewAnos) : 0
    const stat = (v: string | number, rot: string) => (
      <div style={{ flex: 1, background: '#fff', border: `2px solid ${INK}`, borderRadius: 8, textAlign: 'center', padding: '3px 2px' }}>
        <b style={{ ...OSWALD, fontWeight: 900, fontSize: 14, display: 'block', lineHeight: 1.1 }}>{v}</b>
        <small style={{ fontSize: 8, fontWeight: 800, color: '#5a5240', textTransform: 'uppercase' }}>{rot}</small>
      </div>
    )
    return (
      <div key={c.id} style={{ background: '#FCFBF4', border: `3px solid ${INK}`, borderRadius: 16, boxShadow: `3px 3px 0 0 ${INK}`, marginBottom: 10, overflow: 'hidden' }}>
        <div style={{ display: 'flex', gap: 10, padding: '10px 10px 8px', alignItems: 'center' }}>
          <div style={{ width: 52, height: 64, border: `3px solid ${INK}`, borderRadius: 10, background: t.grad, color: t.ink, display: 'flex', alignItems: 'center', justifyContent: 'center', ...OSWALD, fontWeight: 900, fontSize: 24, flex: 'none', position: 'relative' }}>
            {c.name.trim().charAt(0).toUpperCase()}
            <span style={{ position: 'absolute', bottom: -8, left: '50%', transform: 'translateX(-50%)', background: INK, color: '#fff', ...OSWALD, fontWeight: 900, fontSize: 9.5, borderRadius: 6, padding: '1px 6px' }}>{c.pos}</span>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <b style={{ ...OSWALD, fontWeight: 900, fontSize: 17, textTransform: 'uppercase', display: 'block', lineHeight: 1.05, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</b>
            <span style={{ fontSize: 10.5, fontWeight: 700, color: '#5a5240' }}>{c.club} · {c.year} · {tr('valor', 'value')} {oficial} 🪙</span><br />
            <span style={{ display: 'inline-block', ...OSWALD, fontWeight: 900, fontSize: 9.5, letterSpacing: '.04em', border: `2px solid ${INK}`, borderRadius: 6, padding: '0 6px', marginTop: 4, background: '#fff' }}>{en ? (TIER_EN[t.label] ?? t.label) : t.label}</span>
          </div>
        </div>
        {k && (
          <div style={{ display: 'flex', gap: 4, padding: '0 10px 8px' }}>
            {stat(k.j, tr('jogos no clube', 'games at club'))}
            {stat(k.gl ?? 0, tr('gols', 'goals'))}
            {stat(k.as ?? 0, tr('assist.', 'assists'))}
            {gasOn && stat(`${Math.round(k.g)}%`, tr('gás', 'energy'))}
          </div>
        )}
        {ops.length > 0 ? (
          <>
            <div style={{ display: 'flex', gap: 5, padding: '0 10px 8px' }}>
              {ops.map(a => {
                const on = a === anos
                const cst = renewCost(oficial, a as RenewAnos)
                return (
                  <button key={a} onClick={() => setPrazo(p => ({ ...p, [c.id]: a }))} style={{ flex: 1, border: `2.5px solid ${INK}`, borderRadius: 10, background: on ? GOLD : '#fff', boxShadow: on ? `2px 2px 0 0 ${INK}` : 'none', textAlign: 'center', padding: '4px 2px', ...OSWALD, fontWeight: 900, fontSize: 12, cursor: 'pointer', color: INK }}>
                    {a} {en ? (a > 1 ? 'years' : 'year') : `ano${a > 1 ? 's' : ''}`}
                    <small style={{ display: 'block', fontFamily: 'system-ui', fontWeight: 700, fontSize: 9.5, color: '#5a5240' }}>{cst} 🪙{a === 10 ? ' −10%' : ''}{saldo < cst ? ' 💳' : ''}</small>
                  </button>
                )
              })}
            </div>
            <div style={{ display: 'flex', gap: 6, padding: '0 10px 10px' }}>
              <button onClick={() => { if (anos) renovar(c, dono, anos) }} style={btnGrande(GREEN, '#fff')}>✍️ {tr('Renovar', 'Renew')} {anos} {en ? (anos > 1 ? 'yrs' : 'yr') : `ano${anos > 1 ? 's' : ''}`}<small style={{ display: 'block', fontFamily: 'system-ui', fontSize: 9.5, fontWeight: 700, textTransform: 'none', opacity: .9 }}>{custo} 🪙{saldo < custo ? tr(' · cheque especial', ' · overdraft') : ''}</small></button>
              <button onClick={() => dispatch({ type: 'RELEASE_CONTRACT', mgrId: dono.id, cardId: c.id })} style={{ ...btnGrande('#fff', RED), flex: .75 }}>👋 {tr('Deixar ir', 'Let go')}</button>
            </div>
          </>
        ) : (
          <p style={{ fontSize: 10.5, fontWeight: 700, color: '#1B5E32', margin: 0, padding: '0 10px 10px', lineHeight: 1.4 }}>{tr('🌱 Na Várzea não tem renovação — ele vai pro leilão e o clube embolsa a venda.', '🌱 No renewals in Várzea — he goes to the auction and the club pockets the sale.')}</p>
        )}
      </div>
    )
  }

  // ── carta da comissão (técnico / preparador): prazo é sorteado, preço fixo ─────────────
  const cartaComissao = (id: string, ic: string, nome: string, linha: string, custo: number, onRenovar: () => void, onSair: () => void) => (
    <div style={{ background: '#FCFBF4', border: `3px solid ${INK}`, borderRadius: 16, boxShadow: `3px 3px 0 0 ${INK}`, marginBottom: 10 }}>
      <div style={{ display: 'flex', gap: 10, padding: '10px 10px 8px', alignItems: 'center' }}>
        <div style={{ width: 52, height: 64, border: `3px solid ${INK}`, borderRadius: 10, background: 'linear-gradient(160deg,#e9e3d0,#bdb39a)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flex: 'none' }}>{ic}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <b style={{ ...OSWALD, fontWeight: 900, fontSize: 17, textTransform: 'uppercase', display: 'block', lineHeight: 1.05 }}>{nome}</b>
          <span style={{ fontSize: 10.5, fontWeight: 700, color: '#5a5240', lineHeight: 1.35, display: 'block' }}>{linha}</span>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 6, padding: '0 10px 10px' }}>
        <button disabled={coins < custo} onClick={() => { onRenovar(); anota({ id, nome, txt: tr(`renovou · ${custo} 🪙 · prazo sorteado`, `renewed · ${custo} 🪙 · length drawn`), sai: false }) }} style={btnGrande(GREEN, '#fff', coins < custo)}>✍️ {tr('Renovar', 'Renew')} · {custo} 🪙</button>
        <button onClick={() => { onSair(); anota({ id, nome, txt: tr('foi embora · sem multa', 'left · no fee'), sai: true }) }} style={{ ...btnGrande('#fff', RED), flex: .75 }}>👋 {tr('Deixar ir', 'Let go')}</button>
      </div>
      {coins < custo && <p style={{ fontSize: 10, fontWeight: 800, color: RED, margin: 0, padding: '0 10px 9px' }}>{tr('Caixa não cobre a renovação — venda alguém ou deixe ir.', 'The till doesn\'t cover the renewal — sell someone or let go.')}</p>}
    </div>
  )

  // ⚡ todos de uma vez (mesma lógica de antes: cada um pelo prazo que existe mais perto)
  const alvos: { c: WonCard; dono: Manager }[] = [...expirados.map(c => ({ c, dono: mgr })), ...(dormM ? expDorm.map(c => ({ c, dono: dormM })) : [])]
  const renovaveis = alvos.filter(({ c, dono }) => divDe(dono) !== 'V' && !soltos.has(c.id))
  const bulkRenovar = (alvo: 10 | 5) => {
    for (const { c, dono } of renovaveis) {
      const ops = renewOptions(valorOficial(state, c))
      if (ops.length) renovar(c, dono, prazoPerto(ops, alvo))
    }
  }
  const bulkDeixarIr = () => { for (const { c, dono } of alvos) if (!soltos.has(c.id)) dispatch({ type: 'RELEASE_CONTRACT', mgrId: dono.id, cardId: c.id }) }
  const saldoDorm = dormM ? (state.careerCoins?.[dormM.id] ?? 0) : 0
  const num = (v: string | number, rot: string) => (
    <div style={{ flex: 1, background: '#fff', color: INK, border: `2px solid ${INK}`, borderRadius: 10, textAlign: 'center', padding: '4px 2px' }}>
      <b style={{ display: 'block', ...OSWALD, fontWeight: 900, fontSize: 17, lineHeight: 1.1 }}>{v}</b>
      <small style={{ fontSize: 9, fontWeight: 800, color: '#5a5240' }}>{rot}</small>
    </div>
  )
  const primeira = state.seasonNo <= 6

  return (
    <div style={{ marginBottom: 12, color: INK }}>
      {/* placar de cima */}
      <div style={{ background: 'linear-gradient(150deg,#262626,#0c0c0c)', border: `3px solid ${GOLD}`, borderRadius: 16, boxShadow: `4px 4px 0 0 ${INK}`, padding: '10px 12px', color: '#fff', marginBottom: 10 }}>
        <p style={{ ...OSWALD, fontWeight: 900, fontSize: 19, textTransform: 'uppercase', margin: 0, color: GOLD }}>{nDecidir > 0 ? tr('📝 Contratos encerrados', '📝 Contracts ended') : tr('📝 Contratos decididos ✓', '📝 Contracts decided ✓')}</p>
        <p style={{ margin: '3px 0 0', fontSize: 11, fontWeight: 700, color: '#ddd', lineHeight: 1.4 }}>
          {primeira && <>{tr('Todo jogador tem contrato. Quando acaba, você decide: renovar ou deixar ir. ', 'Every player has a contract. When it ends, you decide: renew or let go. ')}</>}
          {tr('Avançou sem escolher? Renova sozinho por 5 anos.', 'Moved on without choosing? Renews by itself for 5 years.')}
        </p>
        <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
          {num(nDecidir, tr('pra decidir', 'to decide'))}
          {num(`${coins} 🪙`, tr('no caixa', 'in the till'))}
          {custoTodos5 > 0 && num(`${custoTodos5} 🪙`, tr('renovar todos (5a)', 'renew all (5y)'))}
        </div>
      </div>

      {/* decididos viram faixa */}
      {feitos.map(f => (
        <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 8, background: f.sai ? '#FFE3D6' : '#E9F7EE', border: `3px solid ${f.sai ? RED : GREEN}`, borderRadius: 14, padding: '8px 10px', marginBottom: 8 }}>
          <span style={{ fontSize: 16 }}>{f.sai ? '👋' : '✅'}</span>
          <span style={{ flex: 1, minWidth: 0, fontSize: 11.5, fontWeight: 800, lineHeight: 1.3 }}><b style={{ ...OSWALD, fontSize: 14, textTransform: 'uppercase' }}>{f.nome}</b> {f.txt}</span>
        </div>
      ))}

      {tecVencido && nomeTec && <>{tag(tr('🧢 TÉCNICO', '🧢 HEAD COACH'))}{cartaComissao('tec', '🧢', nomeTec,
        en ? `Served out his contract (expired in S${fimTec}). Renew = new length drawn · let go = no fee.` : `Cumpriu o contrato (venceu na T${fimTec}). Renovar = tempo novo sorteado · deixar ir = sem multa.`,
        custoTec, () => dispatch({ type: 'RENOVAR_TECNICO' }), () => dispatch({ type: 'DISPENSAR_TECNICO' }))}</>}
      {prepVencido && prep && <>{tag(tr('🏋️ PREPARADOR', '🏋️ FITNESS COACH'))}{cartaComissao('prep', '🏋️', prep.nome,
        en ? `Contract expired (S${fimPrep}). Renewing costs half the hiring price.` : `Contrato venceu (T${fimPrep}). Renovar custa metade do preço de contratar.`,
        custoPrep, () => dispatch({ type: 'RENOVAR_PREPARADOR' }), () => dispatch({ type: 'DISPENSAR_PREPARADOR' }))}</>}

      {expirados.length > 0 && <>
        {tag(dormM && expDorm.length ? `🟡 ${mgr.teamName.toUpperCase()}` : tr('⚽ JOGADORES', '⚽ PLAYERS'))}
        {expirados.map(c => cartaJogador(c, mgr, coins))}
      </>}
      {dormM && expDorm.length > 0 && <>
        {tag(`💤 ${dormM.teamName.toUpperCase()}`)}
        <p style={{ fontSize: 10.5, fontWeight: 700, color: '#5a5647', margin: '0 0 7px', lineHeight: 1.4 }}>{en ? <>💰 Renewals come out of <b>{dormM.teamName}'s</b> till ({saldoDorm} 🪙) — not yours.</> : <>💰 Renovação sai da caixa <b>do {dormM.teamName}</b> ({saldoDorm} 🪙) — não da sua.</>}</p>
        {expDorm.map(c => cartaJogador(c, dormM, saldoDorm))}
      </>}

      {renovaveis.length > 1 && <>
        {tag(tr('⚡ TODOS DE UMA VEZ', '⚡ ALL AT ONCE'))}
        <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
          <button onClick={() => bulkRenovar(5)} style={{ ...btnGrande('#EAF6EE', INK), fontSize: 12 }}>5️⃣ {tr(`Renovar os ${renovaveis.length} · 5 anos`, `Renew all ${renovaveis.length} · 5 years`)}</button>
          <button onClick={() => bulkRenovar(10)} style={{ ...btnGrande(GOLD, INK), fontSize: 12 }}>🔟 {tr(`Renovar os ${renovaveis.length} · 10 anos`, `Renew all ${renovaveis.length} · 10 years`)}</button>
        </div>
        <button onClick={bulkDeixarIr} style={{ ...btnGrande(RED, '#fff'), width: '100%', fontSize: 12, marginBottom: 8 }}>😢 {tr('Deixar TODOS ir · vão pro leilão', 'Let EVERYONE go · off to the auction')}</button>
      </>}

      {(expirados.length + expDorm.length) > 0 && (
        <div style={{ background: '#fff', border: `2px solid ${INK}`, borderRadius: 10, padding: '7px 9px', fontSize: 10.5, fontWeight: 700, color: '#3a3a3a', lineHeight: 1.45 }}>
          {en ? <>
            👋 <b>Let go</b>: {state.reserveListMesmo ? <>since you kept the <b>same team</b>, he leaves <b>with no sale</b></> : <>he goes to the auction and you receive the sale <b>up to his value</b> (anything above goes to the <b>greedy family</b> 😏)</>}. If the XI is short, a free <b>🌱 Academy Kid</b> fills in. 💳 No cash? You can still renew — it goes on <b>overdraft</b> (transfer ban until you're out of the red).{dormM ? <> 😤 A player you release gets <b>hurt</b> — won't play for ANY of your clubs until another club signs him.</> : null}
          </> : <>
            👋 <b>Deixar ir</b>: {state.reserveListMesmo ? <>como você ficou no <b>mesmo time</b>, ele sai <b>sem venda</b></> : <>ele vai pro leilão e você recebe a venda <b>até o valor dele</b> (o que passar fica com a <b>família gananciosa</b> 😏)</>}. Se faltar gente pro XI, um <b>🌱 Cria da Base</b> assume de graça. 💳 Sem caixa dá pra renovar mesmo assim — entra no <b>cheque especial</b> (transfer ban até sair do vermelho).{dormM ? <> 😤 Jogador que você soltar fica <b>magoado</b> — não joga por NENHUM clube seu até outro clube contratá-lo.</> : null}
          </>}
        </div>
      )}
    </div>
  )
}

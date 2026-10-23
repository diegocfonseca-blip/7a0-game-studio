// ─── 💾 O CARTÃO "ESCALAÇÕES SALVAS" DO ELENCO (23/10, mockup `scripts/mockups/carreira-escalacao-ab.png`) ─────────
// Time A e Time B: "Salvar aqui" guarda o time em campo; "Usar" monta o salvo com as regras do Diego (`escalacao-salva.ts`)
// e manda tudo de uma vez pro reducer (`APLICA_ESCALACAO`, tudo ou nada). Depois de usar, o aviso diz quem não entrou,
// por quê e quem entrou no lugar. Se não dá pra fechar os 11, nada muda e o cartão diz o que falta.
import { useState } from 'react'
import { tr } from './lang'
import { formacaoAtual } from './formacoes'
import { aplicaEscalacao, chaveCarta, type EscalacaoSalva, type ResultadoEscalacao, type SlotEscalacao } from './escalacao-salva'
import { formacaoLiberadaNoEstado, useEsc } from './store'
import type { FormationKey, Manager, Sector } from './types'

const INK = '#0C0C0C', GOLD = '#FFC400', GREEN = '#1B7A3D', RED = '#B23B2E'
const OSW = { fontFamily: 'Oswald, sans-serif', fontWeight: 900, textTransform: 'uppercase' as const }
const POS_PT: Record<Sector, [string, string, string, string]> = { GOL: ['goleiro', 'goleiros', 'goalkeeper', 'goalkeepers'], LAT: ['lateral', 'laterais', 'full-back', 'full-backs'], ZAG: ['zagueiro', 'zagueiros', 'centre-back', 'centre-backs'], MEI: ['meia', 'meias', 'midfielder', 'midfielders'], ATA: ['atacante', 'atacantes', 'forward', 'forwards'] }
const rotulo = (f: FormationKey, v?: string) => formacaoAtual({ formation: f, formationView: v }).rotulo

export function EscalacaoAB({ mgr, xiIds, slot, fora, gas }: {
  mgr: Manager
  /** os 11 em campo agora, na ordem do campinho */
  xiIds: string[]
  /** a rodada-fantasma da Copa, quando a troca vale da próxima fase (o mesmo `slotEscala` da troca por toque) */
  slot?: number
  /** quem NÃO pode jogar agora (o suspenso/machucado — a mesma régua da troca por toque) */
  fora: Set<string>
  gas?: Record<string, number>
}) {
  const { state, dispatch } = useEsc()
  const salvos = state.careerEscalacoes?.[mgr.id] ?? {}
  const [aviso, setAviso] = useState<{ qual: SlotEscalacao; r: ResultadoEscalacao } | null>(null)
  const igualAoCampo = (e?: EscalacaoSalva) => !!e && e.f === mgr.formation && (e.v ?? '') === (mgr.formationView ?? '') &&
    e.keys.length === xiIds.length && xiIds.every((id, i) => { const c = mgr.squad.find(x => x.id === id); return !!c && chaveCarta(c) === e.keys[i] })
  const monta = (e: EscalacaoSalva) => aplicaEscalacao({
    esc: e, squad: mgr.squad, fora, gas, formacaoAtual: mgr.formation, viewAtual: mgr.formationView,
    formacaoLiberada: (f, v) => formacaoLiberadaNoEstado(state, mgr, f, v), rotulo,
  })
  const salvar = (qual: SlotEscalacao) => {
    dispatch({ type: 'SALVA_ESCALACAO', mgrId: mgr.id, qual, ids: xiIds, formation: mgr.formation, view: mgr.formationView })
    setAviso(null)
  }
  const usar = (qual: SlotEscalacao) => {
    const e = salvos[qual]
    if (!e) return
    const r = monta(e)
    if (r.ok) dispatch({ type: 'APLICA_ESCALACAO', mgrId: mgr.id, formation: r.f, view: r.v, ids: r.ids, slot })
    setAviso({ qual, r })
  }
  const Caixa = ({ qual }: { qual: SlotEscalacao }) => {
    const e = salvos[qual]
    // em campo = igual ao salvo, OU acabou de ser usado e ninguém mexeu no time depois (com substituto no lugar de quem saiu)
    const ativo = igualAoCampo(e) || (!!aviso && aviso.qual === qual && aviso.r.ok && aviso.r.ids.join() === xiIds.join())
    const previa = e && !ativo ? monta(e) : null
    return <div style={{ border: `3px solid ${INK}`, borderRadius: 12, padding: 8, background: ativo ? `linear-gradient(150deg,#FFE79A,${GOLD})` : '#F4ECD6', display: 'flex', flexDirection: 'column', gap: 5 }}>
      <b style={{ ...OSW, fontSize: 20, lineHeight: 1 }}>{tr('Time', 'Team')} {qual}</b>
      {e ? <>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#444' }}>{rotulo(e.f, e.v)} · {tr('salvo na temporada', 'saved in season')} {e.t}, {tr('rodada', 'round')} {e.r}</span>
        {ativo ? <span style={{ fontSize: 11, fontWeight: 800, color: GREEN }}>{tr('✔ é o que está em campo', '✔ it\'s the one on the pitch')}</span>
          : previa && !previa.ok ? <span style={{ fontSize: 10.5, fontWeight: 800, color: RED }}>{tr('⚠️ não fecha 11 hoje', '⚠️ can\'t field 11 today')}</span>
          : previa?.ok && previa.formacaoTrocada ? <span style={{ fontSize: 10.5, fontWeight: 800, color: '#8a5a00' }}>⚠️ {tr(`o ${previa.formacaoTrocada.de} não é do técnico atual — vai entrar no ${previa.formacaoTrocada.para}`, `${previa.formacaoTrocada.de} isn't the current coach's — it will use ${previa.formacaoTrocada.para}`)}</span>
          : null}
        {!ativo && <button onClick={() => usar(qual)} style={{ border: `3px solid ${INK}`, borderRadius: 10, ...OSW, fontSize: 12, padding: '6px 4px', background: GREEN, color: '#fff', cursor: 'pointer' }}>▶ {tr(`Usar o ${qual}`, `Use ${qual}`)}</button>}
      </> : <span style={{ fontSize: 11, fontWeight: 700, color: '#666' }}>{tr('vazio — salve o time em campo', 'empty — save the team on the pitch')}</span>}
      <button onClick={() => salvar(qual)} style={{ border: `3px solid ${INK}`, borderRadius: 10, ...OSW, fontSize: 12, padding: '6px 4px', background: '#fff', color: INK, cursor: 'pointer' }}>💾 {tr('Salvar aqui', 'Save here')}</button>
    </div>
  }
  const posTxt = (p: Sector, n: number) => { const [s1, sN, e1, eN] = POS_PT[p]; return tr(`${n} ${n > 1 ? sN : s1}`, `${n} ${n > 1 ? eN : e1}`) }
  return <div style={{ background: '#fff', color: INK, border: `3px solid ${INK}`, borderRadius: 14, boxShadow: `4px 4px 0 ${INK}`, padding: 10, marginBottom: 10 }}>
    <p style={{ ...OSW, fontSize: 11, letterSpacing: '.12em', color: 'rgba(0,0,0,.55)', margin: '0 0 8px' }}>💾 {tr('Escalações salvas', 'Saved line-ups')}</p>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}><Caixa qual="A" /><Caixa qual="B" /></div>
    <p style={{ fontSize: 10.5, fontWeight: 700, color: '#555', margin: '8px 0 0', textAlign: 'center' }}>
      {tr('"Salvar aqui" guarda o time em campo agora (formação + os 11). Usar vale do próximo jogo.', '"Save here" stores the team on the pitch now (formation + the 11). Using one counts from the next match.')}
    </p>
    {aviso && (aviso.r.ok ? (
      <div style={{ background: '#FFF6D6', border: `3px solid ${INK}`, borderRadius: 12, padding: '8px 10px', marginTop: 10, fontSize: 12, fontWeight: 700, lineHeight: 1.45 }}>
        <p style={{ margin: 0 }}>▶ <b>{tr(`Time ${aviso.qual} em campo`, `Team ${aviso.qual} on the pitch`)}</b> · {rotulo(aviso.r.f, aviso.r.v)} · {tr('vale do próximo jogo', 'counts from the next match')}</p>
        {aviso.r.formacaoTrocada && <p style={{ margin: '3px 0 0', color: '#8a5a00' }}>🎽 {tr(`O ${aviso.r.formacaoTrocada.de} não é do técnico atual — entrou no ${aviso.r.formacaoTrocada.para}.`, `${aviso.r.formacaoTrocada.de} isn't the current coach's — it went with ${aviso.r.formacaoTrocada.para}.`)}</p>}
        {aviso.r.naoEntrou.map(x => <p key={x.nome} style={{ margin: '3px 0 0', color: RED }}>
          {x.motivo === 'saiu' ? '❌' : '🚑'} {x.nome} — {x.motivo === 'saiu' ? tr('não está mais no elenco', 'no longer in the squad') : tr('machucado/suspenso', 'injured/suspended')}{x.noLugar ? <> · {tr('entrou', 'in came')} <b>{x.noLugar}</b></> : null}
        </p>)}
        {aviso.r.ids.filter(id => (gas?.[id] ?? 100) < 55).map(id => mgr.squad.find(c => c.id === id)?.name).filter(Boolean).slice(0, 3).map(n => <p key={n} style={{ margin: '3px 0 0' }}>😓 {n} — {tr('cansado, mas entrou (escolha sua)', 'tired, but in (your call)')}</p>)}
        {aviso.r.novos.filter(n => aviso.r.ok && !aviso.r.ids.some(id => mgr.squad.find(c => c.id === id)?.name === n)).slice(0, 4).map(n => <p key={n} style={{ margin: '3px 0 0', color: GREEN }}>
          🆕 {tr(`${n} chegou depois que você salvou o ${aviso.qual}: ficou no banco. Quer ele no ${aviso.qual}? Põe em campo e aperte 💾.`, `${n} arrived after you saved ${aviso.qual}: on the bench. Want him in ${aviso.qual}? Put him on and press 💾.`)}
        </p>)}
      </div>
    ) : (
      <div style={{ background: '#FDE8E4', border: `3px solid ${INK}`, borderRadius: 12, padding: '8px 10px', marginTop: 10, fontSize: 12, fontWeight: 800, color: RED, lineHeight: 1.45 }}>
        🛑 {tr(`O Time ${aviso.qual} não entrou: faltam`, `Team ${aviso.qual} wasn't used: missing`)} {aviso.r.falta.map(f => posTxt(f.pos, f.n)).join(' · ')}. {tr('O time em campo continua o mesmo. Contrate no leilão ou escale no campinho e salve de novo.', 'The team on the pitch stays the same. Sign one at the auction or pick on the pitch and save again.')}
      </div>
    ))}
  </div>
}

// ─── 💾 TIME A / TIME B NO ELENCO — versão FECHADA (23/10, mockup `scripts/mockups/carreira-escalacao-ab-fechado.png`) ─────
// Diego viu o cartão aberto empurrando o campinho e escolheu o "enxuto fechado": vira a 3ª PÍLULA ao lado de Formação e
// Trocas ("💾 Time A ▾"). Tocou, abre o painel (Time A / Time B pra trocar · Salvar como A / Salvar como B). Trocou, o
// painel FECHA SOZINHO e uma faixa avisa: verde e some em 5 s quando entrou todo mundo; amarela (toque pra fechar) quando
// alguém não pôde ir e entrou outro no lugar; vermelha quando não fecha 11 (aí nada muda).
// Quem escolhe QUEM entra é `aplicaEscalacao` (`escalacao-salva.ts`); o reducer (`APLICA_ESCALACAO`) é tudo ou nada.
import { useEffect, useState } from 'react'
import { tr } from './lang'
import { formacaoAtual } from './formacoes'
import { aplicaEscalacao, chaveCarta, type EscalacaoSalva, type ResultadoEscalacao, type SlotEscalacao } from './escalacao-salva'
import { formacaoLiberadaNoEstado, useEsc } from './store'
import type { EscState, FormationKey, Manager, Sector } from './types'

const INK = '#0C0C0C', GOLD = '#FFC400', GREEN = '#1B7A3D', RED = '#B23B2E'
const OSW = { fontFamily: 'Oswald, sans-serif', fontWeight: 900, textTransform: 'uppercase' as const }
const POS: Record<Sector, [string, string, string, string]> = { GOL: ['goleiro', 'goleiros', 'goalkeeper', 'goalkeepers'], LAT: ['lateral', 'laterais', 'full-back', 'full-backs'], ZAG: ['zagueiro', 'zagueiros', 'centre-back', 'centre-backs'], MEI: ['meia', 'meias', 'midfielder', 'midfielders'], ATA: ['atacante', 'atacantes', 'forward', 'forwards'] }
const rotulo = (f: FormationKey, v?: string) => formacaoAtual({ formation: f, formationView: v }).rotulo
const AVISO_MS = 5000

/** qual time salvo está em campo agora (o que a pílula mostra): o último usado se ninguém mexeu depois, ou o salvo idêntico */
export function timeEmCampo(st: Pick<EscState, 'careerEscalacoes'>, mgr: Manager, xiIds: string[]): SlotEscalacao | null {
  const e = st.careerEscalacoes?.[mgr.id]
  if (!e) return null
  if (e.ativo && e.ativo.ids.join() === xiIds.join()) return e.ativo.qual
  const igual = (x?: EscalacaoSalva) => !!x && x.f === mgr.formation && (x.v ?? '') === (mgr.formationView ?? '') && x.keys.length === xiIds.length &&
    xiIds.every((id, i) => { const c = mgr.squad.find(k => k.id === id); return !!c && chaveCarta(c) === x.keys[i] })
  return igual(e.A) ? 'A' : igual(e.B) ? 'B' : null
}

export function EscalacaoAB({ mgr, xiIds, slot, fora, gas, aberto, fechar }: {
  mgr: Manager
  /** os 11 em campo agora, na ordem do campinho */
  xiIds: string[]
  /** a rodada-fantasma da Copa, quando a troca vale da próxima fase (o mesmo `slotEscala` da troca por toque) */
  slot?: number
  /** quem NÃO pode jogar agora (o suspenso/machucado — a mesma régua da troca por toque) */
  fora: Set<string>
  gas?: Record<string, number>
  /** o painel está aberto (a pílula manda) */
  aberto: boolean
  fechar: () => void
}) {
  const { state, dispatch } = useEsc()
  const salvos = state.careerEscalacoes?.[mgr.id] ?? {}
  const [aviso, setAviso] = useState<{ qual: SlotEscalacao; r: ResultadoEscalacao; salvou?: boolean } | null>(null)
  const emCampo = timeEmCampo(state, mgr, xiIds)
  const monta = (e: EscalacaoSalva) => aplicaEscalacao({
    esc: e, squad: mgr.squad, fora, gas, formacaoAtual: mgr.formation, viewAtual: mgr.formationView,
    formacaoLiberada: (f, v) => formacaoLiberadaNoEstado(state, mgr, f, v), rotulo,
  })
  // faixa verde (tudo certo) some sozinha; a que tem recado fica até tocar
  const limpo = !!aviso && aviso.r.ok && !aviso.r.naoEntrou.length && !aviso.r.formacaoTrocada && !aviso.r.novos.some(n => !idsTem(aviso.r, n))
  useEffect(() => {
    if (!aviso || !limpo) return
    const t = setTimeout(() => setAviso(null), AVISO_MS)
    return () => clearTimeout(t)
  }, [aviso, limpo])
  function idsTem(r: ResultadoEscalacao, nome: string) { return r.ok && r.ids.some(id => mgr.squad.find(c => c.id === id)?.name === nome) }
  const salvar = (qual: SlotEscalacao) => {
    dispatch({ type: 'SALVA_ESCALACAO', mgrId: mgr.id, qual, ids: xiIds, formation: mgr.formation, view: mgr.formationView })
    setAviso({ qual, r: { ok: true, f: mgr.formation, v: mgr.formationView, ids: xiIds, naoEntrou: [], novos: [] }, salvou: true })
    fechar()
  }
  const usar = (qual: SlotEscalacao) => {
    const e = salvos[qual]
    if (!e) return
    const r = monta(e)
    if (r.ok) dispatch({ type: 'APLICA_ESCALACAO', mgrId: mgr.id, qual, formation: r.f, view: r.v, ids: r.ids, slot })
    setAviso({ qual, r })
    fechar()
  }
  const posTxt = (p: Sector, n: number) => { const [s1, sN, e1, eN] = POS[p]; return tr(`${n} ${n > 1 ? sN : s1}`, `${n} ${n > 1 ? eN : e1}`) }
  const botao = (on: boolean, cor: string): React.CSSProperties => ({ flex: 1, minWidth: 0, ...OSW, fontSize: 12, padding: '7px 4px', border: `2.5px solid ${INK}`, borderRadius: 10, background: on ? GOLD : cor, color: INK, cursor: 'pointer' })
  return <>
    {aberto && <div style={{ background: '#fff', color: INK, border: `2.5px solid ${INK}`, borderRadius: 10, padding: '8px 9px', marginBottom: 10 }}>
      <p style={{ ...OSW, fontSize: 10.5, letterSpacing: '.1em', color: 'rgba(0,0,0,.55)', margin: '0 0 7px' }}>💾 {tr('Trocar de time · vale do próximo jogo', 'Switch team · counts from the next match')}</p>
      <div style={{ display: 'flex', gap: 6 }}>
        {(['A', 'B'] as SlotEscalacao[]).map(q => {
          const e = salvos[q]
          const on = emCampo === q
          return <button key={q} disabled={!e || on} onClick={() => usar(q)} style={{ ...botao(on, '#F4ECD6'), opacity: e || on ? 1 : 0.45, cursor: e && !on ? 'pointer' : 'default' }}>
            {on ? '✔' : '▶'} {tr('Time', 'Team')} {q}
          </button>
        })}
      </div>
      <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
        {(['A', 'B'] as SlotEscalacao[]).map(q => <button key={q} onClick={() => salvar(q)} style={botao(false, '#fff')}>💾 {tr(`Salvar como ${q}`, `Save as ${q}`)}</button>)}
      </div>
      <p style={{ fontSize: 10, fontWeight: 700, color: '#555', margin: '6px 0 0', lineHeight: 1.4 }}>
        {(['A', 'B'] as SlotEscalacao[]).map(q => { const e = salvos[q]; return e ? `${tr('Time', 'Team')} ${q}: ${rotulo(e.f, e.v)} · ${tr('salvo na temp.', 'saved in season')} ${e.t}, ${tr('rod.', 'rd')} ${e.r}` : `${tr('Time', 'Team')} ${q}: ${tr('vazio', 'empty')}` }).join(' · ')}
      </p>
    </div>}
    {aviso && (aviso.salvou ? (
      <div style={{ background: GREEN, color: '#fff', border: `2.5px solid ${INK}`, borderRadius: 10, padding: '7px 9px', marginBottom: 10, fontSize: 11.5, fontWeight: 800 }}>
        💾 {tr(`Time em campo salvo como ${aviso.qual}`, `Team on the pitch saved as ${aviso.qual}`)}
      </div>
    ) : aviso.r.ok ? (limpo ? (
      <div style={{ background: GREEN, color: '#fff', border: `2.5px solid ${INK}`, borderRadius: 10, padding: '7px 9px', marginBottom: 10, fontSize: 11.5, fontWeight: 800 }}>
        ✔ {tr(`Time ${aviso.qual} em campo · vale do próximo jogo`, `Team ${aviso.qual} on the pitch · counts from the next match`)}
      </div>
    ) : (
      <button onClick={() => setAviso(null)} style={{ display: 'block', width: '100%', textAlign: 'left', background: '#FFF6D6', color: INK, border: `2.5px solid ${INK}`, borderRadius: 10, padding: '7px 9px', marginBottom: 10, fontSize: 11.5, fontWeight: 700, lineHeight: 1.45, cursor: 'pointer' }}>
        <b>✔ {tr(`Time ${aviso.qual} em campo`, `Team ${aviso.qual} on the pitch`)}</b> · {rotulo(aviso.r.f, aviso.r.v)}
        {aviso.r.formacaoTrocada && <span style={{ display: 'block', color: '#8a5a00' }}>🎽 {tr(`O ${aviso.r.formacaoTrocada.de} não é do técnico atual — entrou no ${aviso.r.formacaoTrocada.para}`, `${aviso.r.formacaoTrocada.de} isn't the current coach's — went with ${aviso.r.formacaoTrocada.para}`)}</span>}
        {aviso.r.naoEntrou.map(x => <span key={x.nome} style={{ display: 'block', color: RED }}>
          {x.motivo === 'saiu' ? '❌' : '🚑'} {x.nome} {x.motivo === 'saiu' ? tr('saiu do elenco', 'left the squad') : tr('fora (machucado/suspenso)', 'out (injured/suspended)')}{x.noLugar ? ` · ${tr('entrou', 'in')} ${x.noLugar}` : ''}
        </span>)}
        {aviso.r.novos.filter(n => !idsTem(aviso.r, n)).slice(0, 3).map(n => <span key={n} style={{ display: 'block', color: GREEN }}>🆕 {tr(`${n} chegou depois: está no banco`, `${n} arrived later: on the bench`)}</span>)}
        <span style={{ display: 'block', fontSize: 9.5, color: 'rgba(0,0,0,.45)', marginTop: 2 }}>{tr('toque pra fechar', 'tap to close')}</span>
      </button>
    )) : (
      <button onClick={() => setAviso(null)} style={{ display: 'block', width: '100%', textAlign: 'left', background: '#FDE8E4', color: RED, border: `2.5px solid ${INK}`, borderRadius: 10, padding: '7px 9px', marginBottom: 10, fontSize: 11.5, fontWeight: 800, lineHeight: 1.45, cursor: 'pointer' }}>
        🛑 {tr(`Time ${aviso.qual} não entrou: falta`, `Team ${aviso.qual} wasn't used: missing`)} {aviso.r.falta.map(f => posTxt(f.pos, f.n)).join(' · ')}. {tr('O time de antes continua. Contrate no leilão ou escale no campinho e salve de novo.', 'The previous team stays. Sign one at the auction or pick on the pitch and save again.')}
      </button>
    ))}
  </>
}

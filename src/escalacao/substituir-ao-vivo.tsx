// 🔁 SUBSTITUIR COM O JOGO ROLANDO (23/11, mockup `scripts/mockups/substituir-ao-vivo.png`, Diego: *"pode ser"*).
// O jogo PAUSA e abre um elenco LIMPO: só quem está em campo agora e os reservas (nada de comissão/base). Toca em quem sai,
// depois em quem entra (mesma posição — a vaga do campinho é lei). No máximo 3 trocas por jogo; a tática também muda aqui.
// Vale SÓ neste jogo: depois do apito o time volta como estava (o fixo continua na aba Elenco).
// No 3D é uma janela por baixo, em cima do mapa pausado; no 2D fica embaixo do campinho.
import { useState } from 'react'
import { tr } from './lang'
import { MAX_TROCAS_AO_VIVO } from './ao-vivo'
import {usePartidaNoMapa} from './presidencia-partida-sincronia'

type Tac = 'retranca' | 'equilibrio' | 'ataque'
export type CartaSub = { id: string; name: string; pos: string; club?: string; year?: number }
const INK = '#0C0C0C'
const OSW = { fontFamily: 'Oswald, sans-serif' } as const
const COR_POS: Record<string, string> = { GOL: '#E8A400', LAT: '#2563EB', ZAG: '#1B7A3D', MEI: '#7C3AED', ATA: '#C2452F' }

export function PainelSubstituir({ modo, minuto, emCampo, reservas, feitas, tatica, gas, onTroca, onTatica, onVoltar, compact=false }: {
  compact?: boolean
  modo: 'janela' | 'embaixo'
  minuto: number
  emCampo: CartaSub[]
  reservas: CartaSub[]
  /** trocas já feitas neste jogo (pra mostrar "sai → entra") */
  feitas: { sai: CartaSub; entra: CartaSub }[]
  tatica: Tac
  /** gás 0–100 de cada carta (sem a régua do gás ligada: nada) */
  gas?: (id: string) => number | undefined
  onTroca: (saiId: string, entraId: string) => void
  onTatica: (t: Tac) => void
  onVoltar: () => void
}) {
  const [sel, setSel] = useState<string | null>(null)
  const usadas = feitas.length
  const acabou = usadas >= MAX_TROCAS_AO_VIVO
  const saiu = emCampo.find(c => c.id === sel)
  const entrouIds = new Set(feitas.map(f => f.entra.id))
  const linha = (c: CartaSub, extra: { on?: boolean; apagado?: boolean; onClick?: () => void; antes?: string }) => {
    const g = gas?.(c.id)
    return (
      <button key={c.id} type="button" disabled={!extra.onClick} aria-pressed={!!extra.on} onClick={extra.onClick}
        style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', textAlign: 'left', background: extra.on ? '#FFE58A' : '#fff', border: `2px solid ${INK}`, outline: extra.on ? '3px solid #E8503A' : 'none', borderRadius: 10, padding: '6px 9px', marginBottom: 5, opacity: extra.apagado ? 0.4 : 1, cursor: extra.onClick ? 'pointer' : 'default' }}>
        <span style={{ ...OSW, fontWeight: 900, fontSize: 10.5, color: '#fff', background: COR_POS[c.pos] ?? '#555', borderRadius: 5, padding: '2px 6px', flex: '0 0 auto' }}>{c.pos}</span>
        <span style={{ minWidth: 0, flex: 1 }}>
          {extra.antes && <span style={{ fontSize: 12, fontWeight: 800, color: '#777', textDecoration: 'line-through', marginRight: 6 }}>{extra.antes}</span>}
          <span style={{ fontSize: 13.5, fontWeight: 800, color: INK }}>{c.name}</span>
          {c.club && <span style={{ display: 'block', fontSize: 10.5, fontWeight: 700, color: '#666' }}>{c.club}{c.year ? ` · ${c.year}` : ''}</span>}
        </span>
        {g != null && <span title={`${Math.round(g)}%`} style={{ flex: '0 0 48px', height: 7, border: `1.5px solid ${INK}`, borderRadius: 4, background: `linear-gradient(90deg, ${g >= 60 ? '#1B7A3D' : g >= 35 ? '#E8A400' : '#C2452F'} ${Math.max(0, Math.min(100, g))}%, #ddd ${Math.max(0, Math.min(100, g))}%)` }} />}
      </button>
    )
  }
  const corpo = (
    <div className={compact ? 'cv2-sub-panel' : undefined} style={{ background: '#F4ECD6', color: INK }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
        <span style={{ ...OSW, fontWeight: 900, fontSize: 18, textTransform: 'uppercase' }}>🔁 {tr('Substituir', 'Substitutions')} <span style={{ fontSize: 12, color: '#666' }}>· {Math.max(1, Math.floor(minuto))}'</span></span>
        <span style={{ ...OSW, fontWeight: 900, fontSize: 12, background: acabou ? '#C2452F' : '#FFC400', color: acabou ? '#fff' : INK, border: `2px solid ${INK}`, borderRadius: 9, padding: '3px 8px', boxShadow: '2px 2px 0 #000' }}>{tr('TROCAS', 'SUBS')} {usadas}/{MAX_TROCAS_AO_VIVO}</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, margin: '9px 0' }}>
        {([['retranca', tr('🧱 Retranca', '🧱 Park the bus')], ['equilibrio', tr('⚖️ Equilíbrio', '⚖️ Balanced')], ['ataque', tr('🔥 Ataque', '🔥 Attack')]] as [Tac, string][]).map(([t, label]) => (
          <button key={t} type="button" onClick={() => onTatica(t)}
            style={{ ...OSW, border: `2.5px solid ${INK}`, borderRadius: 11, padding: '7px 0', fontWeight: 900, fontSize: 12, background: tatica === t ? '#2F6BAE' : '#fff', color: tatica === t ? '#fff' : INK, boxShadow: '2px 2px 0 #000', cursor: 'pointer' }}>{label}</button>
        ))}
      </div>
      <div className={compact ? 'cv2-sub-columns' : undefined}>
      <section className={compact ? 'cv2-sub-column' : undefined} aria-label={tr('Em campo agora','On the pitch now')}>
      <p style={{ ...OSW, fontWeight: 900, fontSize: 11, letterSpacing: '.08em', color: '#555', margin: '6px 2px 4px', textTransform: 'uppercase' }}>
        {tr('Em campo agora', 'On the pitch now')}{!acabou && !sel ? tr(' · toque em quem sai', ' · tap who comes off') : ''}
      </p>
      {emCampo.map(c => {
        const f = feitas.find(x => x.entra.id === c.id)
        return linha(c, { on: sel === c.id, antes: f?.sai.name, onClick: acabou ? undefined : () => setSel(sel === c.id ? null : c.id) })
      })}
      </section>
      <section className={compact ? 'cv2-sub-column cv2-sub-bench' : undefined} aria-label={tr('Reservas','Bench')}>
      <p style={{ ...OSW, fontWeight: 900, fontSize: 11, letterSpacing: '.08em', color: '#555', margin: '8px 2px 4px', textTransform: 'uppercase' }}>
        {tr('Reservas', 'Bench')}{saiu ? tr(` · quem entra no lugar de ${saiu.name} (${saiu.pos})`, ` · who replaces ${saiu.name} (${saiu.pos})`) : ''}
      </p>
      {reservas.length === 0 && <p style={{ fontSize: 12, fontWeight: 700, color: '#666', margin: '0 2px 6px' }}>{tr('Sem reserva disponível — contrate no leilão pra ter banco.', 'No one on the bench — sign players at the auction to have subs.')}</p>}
      {reservas.map(c => {
        const pode = !!saiu && c.pos === saiu.pos && !acabou && !entrouIds.has(c.id)
        return linha(c, { apagado: !!saiu && !pode, onClick: pode ? () => { onTroca(saiu!.id, c.id); setSel(null) } : undefined })
      })}
      </section>
      </div>
      {saiu && !reservas.some(c => c.pos === saiu.pos) && <p style={{ fontSize: 12, fontWeight: 700, color: '#C2452F', margin: '0 2px 6px' }}>{tr(`Sem reserva de ${saiu.pos} no banco — a troca é sempre na mesma posição.`, `No ${saiu.pos} on the bench — subs are always like for like.`)}</p>}
      <button type="button" className={compact ? 'cv2-sub-return' : undefined} onClick={onVoltar}
        style={{ ...OSW, width: '100%', marginTop: 6, background: '#FFC400', color: INK, border: `3px solid ${INK}`, borderRadius: 12, padding: 10, fontWeight: 900, fontSize: 16, boxShadow: '3px 3px 0 #000', cursor: 'pointer', textTransform: 'uppercase' }}>▶ {tr('Voltar ao jogo', 'Back to the match')}</button>
      <p style={{ fontSize: 10.5, fontWeight: 700, color: '#555', textAlign: 'center', margin: '7px 0 0' }}>
        {tr(`Vale só neste jogo · no máximo ${MAX_TROCAS_AO_VIVO} trocas. Depois do apito o time volta como estava — pra mudar de vez, aba Elenco.`, `This match only · up to ${MAX_TROCAS_AO_VIVO} subs. After the whistle the team goes back to normal — to change it for good, use the Squad tab.`)}
      </p>
    </div>
  )
  if (modo === 'embaixo') return (
    <div style={{ background: '#F4ECD6', border: `3px solid ${INK}`, borderRadius: 16, padding: 12, margin: '8px 0', boxShadow: '4px 4px 0 #000' }}>{corpo}</div>
  )
  return (
    <div role="dialog" aria-label={tr('Substituir', 'Substitutions')} style={{ position: 'fixed', inset: 0, zIndex: 80, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', background: 'rgba(0,0,0,.35)' }}>
      <div style={{ textAlign: 'center', color: '#fff', ...OSW, fontWeight: 900, fontSize: 24, textShadow: '2px 2px 0 #000', margin: 'auto 0 12px' }}>⏸ {tr('JOGO PAUSADO', 'MATCH PAUSED')}</div>
      <div style={{ background: '#F4ECD6', borderTop: `4px solid ${INK}`, borderRadius: '22px 22px 0 0', padding: '12px 12px 16px', maxHeight: '72vh', overflowY: 'auto', boxShadow: '0 -6px 0 #000', width: '100%', maxWidth: 560, margin: '0 auto', boxSizing: 'border-box' }}>{corpo}</div>
    </div>
  )
}

/** Lê somente o placar já apresentado: abrir as trocas não revela o resultado final. */
export function PlacarSubstituicoes({matchId,home,away,minute}:{matchId:string;home:string;away:string;minute:number}){
  const match=usePartidaNoMapa(matchId)
  return <div className="cv2-sub-score" aria-label={tr('Partida pausada para ajustes','Match paused for adjustments')}><span>{home}</span><b>{match?.homeScore??'—'} × {match?.awayScore??'—'} · {minute}′</b><span>{away}</span></div>
}

/** o botão que pausa e abre o painel (embaixo do campinho 2D) */
export function BotaoSubstituir({ onClick, usadas }: { onClick: () => void; usadas: number }) {
  return (
    <button type="button" onClick={onClick}
      style={{ ...OSW, width: '100%', marginTop: 8, background: '#fff', color: INK, border: `2.5px solid ${INK}`, borderRadius: 11, padding: '8px 0', fontWeight: 900, fontSize: 13, boxShadow: '2px 2px 0 #000', cursor: 'pointer', textTransform: 'uppercase' }}>
      ⏸ 🔁 {tr('Substituir', 'Substitutions')} <span style={{ color: '#666' }}>· {usadas}/{MAX_TROCAS_AO_VIVO}</span>
    </button>
  )
}

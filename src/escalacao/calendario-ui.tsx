// 📅 A BARRA DO CALENDÁRIO DA CARREIRA (24/10, mockup `carreira-calendario-um-relogio.png`). UM relógio só: a mesma barra no
// topo de TODA aba — data de hoje, o próximo jogo e o botão. Na Central e no Jogos ela abre o DIA (data grande, recado do dia,
// a semana e a barrinha do tempo); no Jogos ainda mostra a lista dos seus jogos. Nas abas de escritório (Elenco, Tabelas, Rank,
// Clube) fica fina e avisa que o tempo está PARADO. Quem decide o tempo é a carreira (`pyramidseason.tsx`); aqui é só desenho.
import type { ReactNode } from 'react'
import { tr } from './lang'
import { fmtDia, semanaDe, type Recado } from './calendario'

export type FaseCal = 'pre' | 'jogo' | 'dias' | 'copa' | 'fim'
export interface JogoCal { dia: number; comp: string; adv: string; casa: boolean; res?: string; cls?: 'v' | 'e' | 'd'; prox?: boolean }
export interface ProxCal { dia: number; hora: number; comp: string; adv: string; casa: boolean }
interface Props {
  fase: FaseCal
  hoje: number
  prox?: ProxCal | null
  passo: number
  total: number
  auto: boolean
  pausado: boolean
  grande: boolean
  naCentral: boolean
  recado?: Recado | null
  jogos?: JogoCal[] | null
  copaNome?: string
  diasDeJogo?: Record<number, 'liga' | 'copa'>
  onPular?: () => void
  onProximo?: () => void
  onIrJogo?: () => void
  onVoltar?: () => void
  assistir?: { on: boolean; troca: () => void } | null // 🏟️ aba Clube: ver o jogo ali mesmo (placar/2D/3D)
  rodada?: number
}

const CSS = `
.ll-cal{margin:0 0 10px;border-radius:14px;overflow:hidden;border:3px solid #0C0C0C;box-shadow:3px 3px 0 #000;background:#14110C;color:#fff;font-family:Inter,Arial,sans-serif}
.ll-cal-bar{display:flex;align-items:center;gap:10px;padding:9px 12px;border-bottom:3px solid #FFC400}
.ll-cal-bar .d{flex:1;min-width:0;font:800 15px/1.1 Oswald,sans-serif;text-transform:uppercase;letter-spacing:.02em}
.ll-cal-bar .d small{display:block;font:700 11.5px/1.3 Inter,Arial,sans-serif;text-transform:none;letter-spacing:0;color:#d8cfb4;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ll-cal-bar .tm{height:4px;background:#3a3122;margin-top:6px;border-radius:4px;overflow:hidden}
.ll-cal-bar .tm i{display:block;height:100%;background:#FFC400;transition:width .9s linear}
.ll-cal-go{flex:none;background:#FFC400;color:#0C0C0C;border:2px solid #0C0C0C;border-radius:10px;box-shadow:0 3px 0 #000;font:800 14px Oswald,sans-serif;text-transform:uppercase;padding:7px 11px;cursor:pointer;white-space:nowrap}
.ll-cal-go.p{background:#3a3122;color:#e9e0c6;border-color:#5a4d33;box-shadow:none}
.ll-cal-go:active{transform:translateY(2px);box-shadow:0 1px 0 #000}
.ll-cal-noite .ll-cal-bar{border-bottom-color:#8aa0ff;background:linear-gradient(90deg,#0b1336,#14110C)}
.ll-cal-dia{display:flex;gap:12px;align-items:stretch;padding:12px}
.ll-cal-num{flex:none;width:86px;border-radius:12px;background:#F4ECD6;color:#0C0C0C;border:3px solid #0C0C0C;text-align:center;padding:6px 0}
.ll-cal-num b{display:block;font:800 40px/1 Oswald,sans-serif}
.ll-cal-num span{display:block;font:800 11px Oswald,sans-serif;text-transform:uppercase;letter-spacing:.1em;color:#6b6250}
.ll-cal-rec{flex:1;min-width:0;border-radius:12px;background:#fff;color:#0C0C0C;border:3px solid #0C0C0C;padding:8px 10px}
.ll-cal-rec .k{font:800 11px Oswald,sans-serif;letter-spacing:.12em;text-transform:uppercase;color:#C2452F}
.ll-cal-rec h4{font:800 19px/1.08 Oswald,sans-serif;text-transform:uppercase;margin:3px 0}
.ll-cal-rec p{font-weight:600;font-size:12.5px;color:#4a4536;margin:0}
.ll-cal-sem{display:grid;grid-template-columns:repeat(7,1fr);gap:4px;padding:0 12px 12px}
.ll-cal-sem div{background:#2b241a;border-radius:8px;text-align:center;padding:4px 0;font:800 10.5px Oswald,sans-serif;text-transform:uppercase;color:#9d927a}
.ll-cal-sem div b{display:block;font-size:15px;color:#f4ecd6}
.ll-cal-sem div i{display:block;font-style:normal;font-size:8.5px;margin-top:1px}
.ll-cal-sem .liga{background:#1B7A3D;color:#d6ffe2}.ll-cal-sem .copa{background:#1d2b6b;color:#cfd8ff}
.ll-cal-sem .hoje{outline:3px solid #FFC400;outline-offset:-1px}
.ll-cal-sem .foi{opacity:.55}
.ll-cal-jogos{padding:0 12px 12px}
.ll-cal-jogos h5{font:800 12px Oswald,sans-serif;letter-spacing:.12em;text-transform:uppercase;color:#FFC400;margin:0 0 4px}
.ll-cal-jogos li{display:flex;align-items:center;gap:8px;padding:6px 4px;border-top:1px dashed #4a3f2c;font-weight:700;font-size:12.5px;list-style:none}
.ll-cal-jogos li:first-of-type{border-top:0}
.ll-cal-jogos .dd{flex:none;width:44px;text-align:center;border-radius:7px;font:800 10px/1.05 Oswald,sans-serif;text-transform:uppercase;padding:3px 0;background:#1B7A3D}
.ll-cal-jogos .dd b{display:block;font-size:15px}
.ll-cal-jogos .dd.copa{background:#1d2b6b}
.ll-cal-jogos .q{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ll-cal-jogos .r{flex:none;font:800 14px Oswald,sans-serif;border-radius:6px;padding:1px 7px;background:#2b241a}
.ll-cal-jogos .r.v{background:#1B7A3D}.ll-cal-jogos .r.d{background:#7a2a1d}.ll-cal-jogos .r.e{background:#5a5032}
.ll-cal-jogos .nx{outline:2px solid #FFC400;border-radius:8px;background:#2b2412}
.ll-cal-jogos .nx .r{background:#FFC400;color:#0C0C0C}
`

const horaTxt = (h: number) => tr(`${h}h`, `${h > 12 ? h - 12 : h}${h >= 12 ? 'pm' : 'am'}`)

export function CalendarioBarra(p: Props) {
  const hoje = fmtDia(p.hoje)
  const noite = p.fase === 'copa' || (p.fase === 'jogo' && hoje.dow === 3)
  const proxTxt = p.prox ? (() => { const f = fmtDia(p.prox.dia); return tr(`próximo: ${f.curto} ${f.dia} · ${horaTxt(p.prox.hora)} × ${p.prox.adv} · ${p.prox.comp}`, `next: ${f.curto} ${f.dia} · ${horaTxt(p.prox.hora)} vs ${p.prox.adv} · ${p.prox.comp}`) })() : ''
  const chegou = p.fase === 'dias' && p.passo >= p.total // o dia do jogo chegou (no automático, esperando sair da Central)
  let titulo: string, sub: string, botao: { txt: string; on?: () => void; cls?: string } | null = null
  if (p.fase === 'pre') { titulo = `📅 ${hoje.longo}`; sub = proxTxt || tr('pré-temporada', 'pre-season') }
  else if (p.fase === 'jogo') { titulo = `${noite ? '🌙' : '☀️'} ${hoje.longo} · ${horaTxt(noite ? 21 : 16)}`; sub = `🔴 ${tr('AO VIVO', 'LIVE')}${p.rodada ? ` · ${tr('rodada', 'round')} ${p.rodada}` : ''}`; botao = p.assistir ? { txt: p.assistir.on ? tr('✕ Fechar jogo', '✕ Close match') : tr('📺 Assistir', '📺 Watch'), on: p.assistir.troca, cls: p.assistir.on ? 'p' : undefined } : p.grande ? null : { txt: tr('📺 Ver jogo', '📺 See match'), on: p.onIrJogo } }
  else if (p.fase === 'copa') { titulo = `🌙 ${hoje.longo} · ${horaTxt(21)}`; sub = `🏆 ${p.copaNome ?? tr('Copa', 'Cup')}`; botao = p.naCentral ? { txt: tr('▶ Ir pro jogo', '▶ Go to match'), on: p.onIrJogo } : null }
  else if (p.fase === 'fim') { titulo = `📅 ${hoje.longo}`; sub = tr('fim da temporada', 'end of the season') }
  else if (p.pausado) { titulo = `📅 ${hoje.longo}`; sub = tr('⏸️ tempo parado enquanto você mexe no clube', '⏸️ time stands still while you manage the club'); botao = { txt: tr('▶ Voltar', '▶ Back'), on: p.onVoltar, cls: 'p' } }
  else if (chegou) { titulo = `⚽ ${tr('Hoje', 'Today')} · ${horaTxt(p.prox?.hora ?? 16)}`; sub = proxTxt; botao = p.naCentral ? { txt: tr('▶ Ir pro jogo', '▶ Go to match'), on: p.onIrJogo } : null }
  else if (p.auto) { titulo = `📅 ${hoje.longo}`; sub = proxTxt; botao = { txt: tr('⏩ Pular', '⏩ Skip'), on: p.onPular } }
  else { titulo = `📅 ${hoje.longo}`; sub = proxTxt; botao = { txt: tr('▶ Próximo adversário', '▶ Next opponent'), on: p.onProximo } }
  const tempo = p.fase === 'dias' && p.auto && p.total > 0 ? Math.min(100, Math.round((p.passo / p.total) * 100)) : null
  const mostraDia = p.grande && p.fase === 'dias' && !p.pausado && !!p.recado
  const semana = mostraDia ? semanaDe(p.prox ? p.prox.dia : p.hoje) : []
  return (
    <div className={`ll-cal${noite ? ' ll-cal-noite' : ''}`} aria-label={tr('Calendário', 'Calendar')}>
      <style>{CSS}</style>
      <div className="ll-cal-bar">
        <div className="d">{titulo}<small>{sub}</small>{tempo != null && <div className="tm"><i style={{ width: `${tempo}%` }} /></div>}</div>
        {botao && <button className={`ll-cal-go${botao.cls ? ' ' + botao.cls : ''}`} onClick={botao.on}>{botao.txt}</button>}
      </div>
      {mostraDia && p.recado && <div className="ll-cal-dia">
        <div className="ll-cal-num"><span>{hoje.curto}</span><b>{hoje.dia}</b><span>{hoje.mes}</span></div>
        <div className="ll-cal-rec"><div className="k">{p.recado.k}</div><h4>{p.recado.titulo}</h4>{p.recado.texto && <p>{p.recado.texto}</p>}</div>
      </div>}
      {mostraDia && <div className="ll-cal-sem">{semana.map(d => {
        const f = fmtDia(d), tipo = p.diasDeJogo?.[d]
        return <div key={d} className={`${tipo ?? ''}${d === p.hoje ? ' hoje' : ''}${d < p.hoje ? ' foi' : ''}`}>{f.curto}<b>{f.dia}</b>{tipo && <i>{tipo === 'liga' ? tr('LIGA', 'LEAGUE') : tr('COPA', 'CUP')}</i>}</div>
      })}</div>}
      {p.grande && p.jogos && p.jogos.length > 0 && <div className="ll-cal-jogos"><h5>⚽ {tr('Seus jogos', 'Your matches')}</h5><ul style={{ margin: 0, padding: 0 }}>{p.jogos.map((j, i) => {
        const f = fmtDia(j.dia)
        return <li key={i} className={j.prox ? 'nx' : undefined}><span className={`dd${j.comp === 'copa' ? ' copa' : ''}`}>{f.curto}<b>{f.dia}</b>{f.mesIdx !== hoje.mesIdx && <small style={{ display: 'block', fontSize: 8.5 }}>{f.mes.slice(0, 3)}</small>}</span><span className="q">{j.comp === 'copa' ? tr('Copa', 'Cup') : tr('Liga', 'League')} · {j.casa ? '' : '@ '}{j.adv}</span><span className={`r${j.cls ? ' ' + j.cls : ''}`}>{j.res ?? horaTxt(j.comp === 'copa' ? 21 : 16)}</span></li>
      })}</ul></div>}
    </div>
  )
}

// ⚽ PRÓXIMO JOGO NO LUGAR DO PLACAR (24/10, mockup `carreira-calendario-abas-antes-depois.png`, *"aprovado só p minha conta"*).
// Na aba Jogos, quando não tem jogo rolando, o espaço do placar vira este cartão: escudos + dia/hora, a semana com a barrinha
// do tempo, o recado do dia e o ⏩ Pular (ou ▶ Próximo adversário no manual). Embaixo, "Seus jogos". Some a barra separada.
interface PropsProx {
  hoje: number
  meu: string
  prox: ProxCal | null
  escudo: (nome: string) => ReactNode
  passo: number
  total: number
  auto: boolean
  recado?: Recado | null
  jogos?: JogoCal[] | null
  diasDeJogo?: Record<number, 'liga' | 'copa'>
  rotulo?: string
  onPular?: () => void
  /** 26/10: na Central o ⏩ some — o jogo só começa pelo aviso "Dia de jogo!" (no manual o "Próximo adversário" fica) */
  semPular?: boolean
  /** 26/10: chegou o dia do jogo — o cartão mostra "⚽ Ir pro jogo" (o jogo só começa no toque) */
  irJogo?: () => void
  onProximo?: () => void
}
const CSS_PROX = `
.ll-calp{border-radius:16px;border:3px solid #0C0C0C;box-shadow:3px 3px 0 #000;background:linear-gradient(180deg,#1f1a13,#0f0c08);color:#fff;padding:12px;margin:0 0 10px;font-family:Inter,Arial,sans-serif}
.ll-calp .k{display:flex;justify-content:space-between;gap:8px;font:800 11px Oswald,sans-serif;letter-spacing:.12em;text-transform:uppercase;color:#FFC400}
.ll-calp .vs{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:6px;margin:10px 0 4px;text-align:center}
.ll-calp .vs b{font:800 17px/1.05 Oswald,sans-serif;color:#FFC400;text-transform:uppercase}
.ll-calp .nm{font:800 14px/1.1 Oswald,sans-serif;text-transform:uppercase;margin-top:6px}
.ll-calp .nm small{display:block;font:700 10px Inter,Arial,sans-serif;text-transform:none;color:#b9ad8e;margin-top:2px}
.ll-calp .tm{height:5px;background:#3a3122;border-radius:5px;margin-top:8px;overflow:hidden}.ll-calp .tm i{display:block;height:100%;background:#FFC400;transition:width 2.8s linear}
.ll-calp .rec{display:flex;gap:9px;align-items:flex-start;margin-top:10px;background:#fff;color:#0C0C0C;border:2px solid #0C0C0C;border-radius:11px;padding:7px 10px}
.ll-calp .rec .q{flex:1;min-width:0}.ll-calp .rec small{display:block;font:800 10px Oswald,sans-serif;letter-spacing:.1em;text-transform:uppercase;color:#C2452F}
.ll-calp .rec b{display:block;font:800 15px/1.1 Oswald,sans-serif;text-transform:uppercase}.ll-calp .rec p{margin:2px 0 0;font-weight:600;font-size:12px;color:#4a4536}
.ll-calp .go{display:block;width:100%;margin-top:10px;background:#FFC400;color:#0C0C0C;border:3px solid #0C0C0C;border-radius:12px;box-shadow:0 4px 0 #000;font:800 17px Oswald,sans-serif;text-transform:uppercase;padding:9px;cursor:pointer}
.ll-calp .go:active{transform:translateY(2px);box-shadow:0 2px 0 #000}
`
export function CalendarioProximo(p: PropsProx) {
  const hoje = fmtDia(p.hoje)
  const semana = semanaDe(p.prox ? p.prox.dia : p.hoje) // a semana do PRÓXIMO jogo (no domingo do apito, a de trás já acabou)
  const f = p.prox ? fmtDia(p.prox.dia) : null
  const tempo = p.total > 0 ? Math.min(100, Math.round((p.passo / p.total) * 100)) : 0
  const copa = !!p.prox && p.prox.hora === 21
  return (
    <div className="ll-calp" aria-label={tr('Próximo jogo', 'Next match')}>
      <style>{CSS + CSS_PROX}</style>
      <div className="k"><span>📅 {hoje.longo}</span><span>{p.rotulo ?? ''}</span></div>
      {p.prox && f && <>
        <div className="vs">
          <div>{p.escudo(p.prox.casa ? p.meu : p.prox.adv)}<div className="nm">{p.prox.casa ? p.meu : p.prox.adv}</div></div>
          <b>{f.curto} {f.dia}<br />{horaTxt(p.prox.hora)}<br /><span style={{ fontSize: 11, color: '#d8cfb4' }}>{copa ? '🌙' : '☀️'} {p.prox.comp}</span></b>
          <div>{p.escudo(p.prox.casa ? p.prox.adv : p.meu)}<div className="nm">{p.prox.casa ? p.prox.adv : p.meu}</div></div>
        </div>
      </>}
      <div className="ll-cal-sem" style={{ padding: 0, marginTop: 10 }}>{semana.map(d => {
        const x = fmtDia(d), tipo = p.diasDeJogo?.[d]
        return <div key={d} className={`${tipo ?? ''}${d === p.hoje ? ' hoje' : ''}${d < p.hoje ? ' foi' : ''}`}>{x.curto}<b>{x.dia}</b>{tipo && <i>{tipo === 'liga' ? tr('LIGA', 'LEAGUE') : tr('COPA', 'CUP')}</i>}</div>
      })}</div>
      {p.auto && <div className="tm"><i style={{ width: `${tempo}%` }} /></div>}
      {p.recado && <div className="rec"><div className="q"><small>{p.recado.k}</small><b>{p.recado.titulo}</b>{p.recado.texto && <p>{p.recado.texto}</p>}</div></div>}
      {p.irJogo ? <button className="go" onClick={p.irJogo} style={{ background: '#1B7A3D', color: '#fff' }}>{tr('⚽ Ir pro jogo', '⚽ Go to the match')}</button>
        : p.auto ? (!p.semPular && <button className="go" onClick={p.onPular}>{tr('⏩ Pular pro jogo', '⏩ Skip to the match')}</button>)
        : <button className="go" onClick={p.onProximo}>{tr('▶ Próximo adversário', '▶ Next opponent')}</button>}
      {p.jogos && p.jogos.length > 0 && <div className="ll-cal-jogos" style={{ padding: '12px 0 0' }}><h5>⚽ {tr('Seus jogos', 'Your matches')}</h5><ul style={{ margin: 0, padding: 0 }}>{p.jogos.map((j, i) => {
        const x = fmtDia(j.dia)
        return <li key={i} className={j.prox ? 'nx' : undefined}><span className={`dd${j.comp === 'copa' ? ' copa' : ''}`}>{x.curto}<b>{x.dia}</b>{x.mesIdx !== hoje.mesIdx && <small style={{ display: 'block', fontSize: 8.5 }}>{x.mes.slice(0, 3)}</small>}</span><span className="q">{j.comp === 'copa' ? tr('Copa', 'Cup') : tr('Liga', 'League')} · {j.casa ? '' : '@ '}{j.adv}</span><span className={`r${j.cls ? ' ' + j.cls : ''}`}>{j.res ?? horaTxt(j.comp === 'copa' ? 21 : 16)}</span></li>
      })}</ul></div>}
    </div>
  )
}

// 📊🎬😱 O RESUMO DO APITO, o botão dos MELHORES MOMENTOS e o grito do QUASE — UM componente de cada, usado no campinho da aba
// Jogos e por cima do campo do MAPA (04/11, Diego: *"a aba Jogos e o mapa têm que ficar praticamente iguais"*). A regra (o que
// conta, quando aparece) mora em campo2d-resumo.ts; aqui só o desenho e a ponte pro mapa (memória da aba — nada vai pro save).
import { useSyncExternalStore, type CSSProperties } from 'react'
import { useT } from './lang'
import type { QuaseCampo2D, ResumoCampo2D } from './campo2d-resumo'

const INK = '#0C0C0C', GOLD = '#FFC400', CREME = '#F4ECD6'
const OSW: CSSProperties = { fontFamily: 'Oswald, sans-serif', fontWeight: 800, textTransform: 'uppercase' }

export type LadoResumo = { nome: string; sigla: string; cor: string }

/** 📊 o cartão do apito final: posse · finalizações · no gol · ⭐ melhor em campo. Só existe DEPOIS do apito (quem chama garante). */
export function ResumoApitoCampo2D({ resumo, casa, fora, larg, compacto }: { resumo: ResumoCampo2D; casa: LadoResumo; fora: LadoResumo; larg?: number; compacto?: boolean }) {
  const t = useT()
  const fs = compacto ? 12 : 14
  const linha = (rot: string, a: string | number, b: string | number, ka: number, kb: number) => (
    <div style={{ display: 'grid', gridTemplateColumns: '44px 1fr 44px', alignItems: 'center', gap: 6, margin: '3px 0' }}>
      <b style={{ ...OSW, fontSize: fs + 3, textAlign: 'left', color: ka > kb ? INK : '#6b6455' }}>{a}</b>
      <span style={{ ...OSW, fontWeight: 700, fontSize: fs - 2, textAlign: 'center', letterSpacing: .5, color: '#3a352b' }}>{rot}</span>
      <b style={{ ...OSW, fontSize: fs + 3, textAlign: 'right', color: kb > ka ? INK : '#6b6455' }}>{b}</b>
    </div>
  )
  const chip = (l: LadoResumo) => <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, ...OSW, fontSize: fs }}><i style={{ width: 11, height: 11, borderRadius: 3, background: l.cor, border: `2px solid ${INK}` }} />{l.sigla}</span>
  const craqueTime = resumo.craque ? (resumo.craque.lado === 0 ? casa : fora) : null
  return (
    <div data-resumo-apito-campo2d style={{ maxWidth: larg ?? 360, width: '100%', boxSizing: 'border-box', margin: compacto ? 0 : '8px auto 0', background: CREME, color: INK, border: `3px solid ${INK}`, borderRadius: 14, boxShadow: `3px 3px 0 ${INK}`, padding: compacto ? '7px 10px 8px' : '9px 12px 10px', pointerEvents: 'auto' }}>
      <div style={{ ...OSW, fontSize: fs + 1, textAlign: 'center', marginBottom: 4 }}>📊 {t('Fim de jogo · o resumo', 'Full time · the summary')}</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>{chip(casa)}{chip(fora)}</div>
      {/* a barra da posse, nas cores dos dois times */}
      <div style={{ display: 'flex', height: 9, border: `2px solid ${INK}`, borderRadius: 6, overflow: 'hidden', margin: '2px 0 2px' }}>
        <i style={{ width: `${resumo.posse[0]}%`, background: casa.cor }} /><i style={{ flex: 1, background: fora.cor }} />
      </div>
      {linha(t('Posse de bola', 'Possession'), `${resumo.posse[0]}%`, `${resumo.posse[1]}%`, resumo.posse[0], resumo.posse[1])}
      {linha(t('Finalizações', 'Shots'), resumo.chutes[0], resumo.chutes[1], resumo.chutes[0], resumo.chutes[1])}
      {linha(t('Chutes no gol', 'On target'), resumo.noAlvo[0], resumo.noAlvo[1], resumo.noAlvo[0], resumo.noAlvo[1])}
      {resumo.craque && craqueTime && (
        <div style={{ marginTop: 6, background: INK, color: '#fff', borderRadius: 10, padding: compacto ? '4px 8px' : '5px 10px', display: 'flex', alignItems: 'center', gap: 7 }}>
          <span style={{ ...OSW, fontSize: fs - 2, color: GOLD, flex: 'none' }}>⭐ {t('Melhor em campo', 'Player of the match')}</span>
          <span style={{ ...OSW, fontSize: fs + 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, textAlign: 'right' }}>{resumo.craque.nome}</span>
          <i style={{ width: 10, height: 10, borderRadius: 3, background: craqueTime.cor, border: '1.5px solid #fff', flex: 'none' }} />
        </div>
      )}
    </div>
  )
}

export type ReplayCampo2D = { na: { autor: string; min: number } | null; play: () => void }
/** 🎬 MELHORES MOMENTOS: o mesmo botão verde (ver os gols de novo) e a etiqueta de quando está passando */
export function BotaoReplayCampo2D({ replay }: { replay: ReplayCampo2D }) {
  const t = useT()
  const minTxt = (m: number) => m > 90 ? `90+${m - 90}` : String(m)
  return replay.na
    ? <div data-replay-campo2d style={{ ...OSW, fontWeight: 700, background: INK, color: GOLD, border: `3px solid ${INK}`, borderRadius: 12, padding: '6px 14px', pointerEvents: 'auto' }}>🎬 {t('REPLAY', 'REPLAY')} · ⚽ {replay.na.autor} {minTxt(replay.na.min)}'</div>
    : <button type="button" data-replay-campo2d onClick={replay.play}
        style={{ ...OSW, fontWeight: 700, background: '#1B7A3D', color: '#fff', border: `3px solid ${INK}`, borderRadius: 12, padding: '7px 16px', boxShadow: `3px 3px 0 ${INK}`, cursor: 'pointer', fontSize: 15, pointerEvents: 'auto', minHeight: 0, margin: 0, lineHeight: 1.2 }}>
        🎬 {t('VER OS GOLS DE NOVO', 'WATCH THE GOALS AGAIN')}
      </button>
}

/** 😱 o estilo da faixa do locutor no QUASE (a MESMA nos dois lugares): dourada, com um tremidinho curto */
export const QUASE_CSS = '@keyframes c2dQuase{0%{transform:scale(.96)}30%{transform:scale(1.03) rotate(-.6deg)}60%{transform:scale(1) rotate(.5deg)}100%{transform:none}}'
export const estiloQuase = (): CSSProperties => ({ background: GOLD, color: INK, animation: 'c2dQuase .45s ease-out', fontWeight: 800 })

// 🗺️ a ponte pro mapa: o campinho (que roda escondido enquanto o mapa mostra o jogo) avisa o apito e o QUASE; o HUD do mapa lê.
export type ApitoMapa = { resumo: ResumoCampo2D | null; casa: LadoResumo; fora: LadoResumo; replay: ReplayCampo2D | null }
export type QuaseMapa = QuaseCampo2D & { txt: string }
const apitos = new Map<string, ApitoMapa>(), quases = new Map<string, QuaseMapa>(), ouvintes = new Set<() => void>()
const avisa = () => ouvintes.forEach(fn => fn())
export function publicarApitoCampo2D(id: string, a: ApitoMapa | null) {
  if (a) apitos.set(id, a); else if (apitos.has(id)) apitos.delete(id); else return
  avisa()
}
export function publicarQuaseCampo2D(id: string, q: QuaseMapa | null) {
  if (q) quases.set(id, q); else if (quases.has(id)) quases.delete(id); else return
  avisa()
}
const assina = (fn: () => void) => { ouvintes.add(fn); return () => { ouvintes.delete(fn) } }
export function useApitoCampo2D(id: string | undefined): ApitoMapa | null {
  return useSyncExternalStore(assina, () => (id ? apitos.get(id) ?? null : null), () => null)
}
export function useQuaseCampo2D(id: string | undefined): QuaseMapa | null {
  return useSyncExternalStore(assina, () => (id ? quases.get(id) ?? null : null), () => null)
}

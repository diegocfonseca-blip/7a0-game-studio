// ─── 🎙️ COLETIVA DE IMPRENSA — as telas (19/10) ───────────────────────────────────────────────────────────────
// O motor (situações, textos, efeito, fama, arquirrival) mora em `coletiva.ts`. Aqui só o desenho:
//  · `ColetivaBanner`: o cartão do pós-jogo (na fila de avisos da carreira): repórter → pergunta → 3 respostas → pular.
//  · `SalaImprensa`: a janela com a fama do presidente, o arquirrival, as frases que marcaram e as promessas.
//  · `CardColetiva`: o quadro da Central Legends que abre a Sala.
// Mockup aprovado pelo Diego (*"adorei"*): `scripts/mockups/coletiva.png`. Mesma cara dos outros avisos da carreira
// (borda preta, sombra dura, Oswald) — nada de layout novo.
import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { tr, getLang } from './lang'
import { REPORTERES, FAMAS, famaDoPresidente, melhoresFrases, preenche, retrospectoTexto, type ColetivaPronta, type ColetivaSave, type Estilo, type Par, type FamaId } from './coletiva'
import estadioArt from './img/online-estadio-v25.webp'

const INK = '#0C0C0C', GOLD = '#FFC400', CREME = '#F4ECD6', GREEN = '#1B7A3D', RED = '#E8503A', ROXO = '#7C3AED'
const OSW: CSSProperties = { fontFamily: 'Oswald, sans-serif', fontWeight: 900, textTransform: 'uppercase' }
const ESTILO_TAG: Record<Estilo, { txt: Par; bg: string }> = {
  provoca: { txt: ['😈 provoca', '😈 taunt'], bg: '#FFE3D6' },
  diplomata: { txt: ['🧊 diplomata', '🧊 diplomat'], bg: '#fff' },
  desconversa: { txt: ['🚪 desconversa', '🚪 dodge'], bg: '#fff' },
}
const par = (p: Par) => (getLang() === 'en' ? p[1] : p[0])

function Reporter({ id, size = 44 }: { id: keyof typeof REPORTERES; size?: number }) {
  const r = REPORTERES[id]
  return <span style={{ flex: 'none', width: size, height: size, borderRadius: '50%', background: r.cor, border: `3px solid ${INK}`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', ...OSW, fontSize: size * .42, color: r.cor === GOLD ? INK : '#fff' }}>{r.inicial}</span>
}

// ── o cartão do pós-jogo ───────────────────────────────────────────────────────────────────────────────────────
export function ColetivaBanner({ pronta, clube, placar, rodadaTxt, onEscolhe, autoSeg }: {
  pronta: ColetivaPronta; clube: string; placar: string | null; rodadaTxt: string
  onEscolhe: (estilo: Estilo | null) => void
  /** no automático a coletiva fecha sozinha depois de N segundos (sem contar como pulada) */
  autoSeg: number | null
}) {
  const [resta, setResta] = useState(autoSeg)
  useEffect(() => { setResta(autoSeg) }, [autoSeg, pronta])
  useEffect(() => {
    if (resta == null) return
    if (resta <= 0) { onEscolhe(null); return }
    const t = setTimeout(() => setResta(r => (r == null ? r : r - 1)), 1000)
    return () => clearTimeout(t)
  }, [resta]) // eslint-disable-line react-hooks/exhaustive-deps
  const rep = pronta.rep
  return (
    <div style={{ position: 'relative', overflow: 'hidden', background: CREME, border: `4px solid ${INK}`, borderRadius: 16, boxShadow: `4px 4px 0 ${INK}`, marginBottom: 12, color: INK }}>
      <div style={{ position: 'relative', height: 118, background: `#111 url(${estadioArt}) center / cover` }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,#0003,#000c)' }} />
        <div style={{ position: 'absolute', left: 12, right: 12, bottom: 9, color: '#fff' }}>
          <div style={{ ...OSW, fontSize: 10.5, color: GOLD, letterSpacing: 1 }}>🎙️ {tr('Coletiva', 'Press conference')} · {rodadaTxt}{placar ? ` · ${placar}` : ''}</div>
          <div style={{ ...OSW, fontSize: 21, lineHeight: 1 }}>{clube} 🎙️</div>
        </div>
        {resta != null && <span style={{ position: 'absolute', top: 8, right: 10, background: '#0009', color: '#fff', borderRadius: 999, padding: '2px 8px', fontSize: 10.5, fontWeight: 800 }}>{tr(`fecha sozinha em ${resta}s`, `closes on its own in ${resta}s`)}</span>}
      </div>
      <div style={{ padding: 10 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
          <Reporter id={rep.id} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: 'inline-block', ...OSW, fontSize: 9.5, background: rep.cor, color: rep.cor === GOLD ? INK : '#fff', borderRadius: 6, padding: '2px 7px', marginBottom: 4 }}>🎤 {rep.nome} · {par(rep.veiculo)}</span>
            <div style={{ background: '#fff', border: `3px solid ${INK}`, borderRadius: 14, borderTopLeftRadius: 4, boxShadow: `3px 3px 0 ${INK}`, padding: '9px 11px', fontSize: 13.5, fontWeight: 700, lineHeight: 1.35 }}>“{preenche(pronta.pergunta, pronta.vars)}”</div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginTop: 10 }}>
          {pronta.opcoes.map(o => (
            <button key={o.estilo} onClick={() => onEscolhe(o.estilo)} style={{ textAlign: 'left', background: ESTILO_TAG[o.estilo].bg, border: `3px solid ${INK}`, borderRadius: 12, boxShadow: `3px 3px 0 ${INK}`, padding: '8px 10px', cursor: 'pointer', color: INK }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ flex: 1, fontSize: 13, fontWeight: 800, lineHeight: 1.3 }}>“{preenche(o.frase, pronta.vars)}”</span>
                <span style={{ ...OSW, fontSize: 9.5, background: INK, color: GOLD, borderRadius: 6, padding: '2px 6px', whiteSpace: 'nowrap' }}>{par(ESTILO_TAG[o.estilo].txt)}</span>
              </div>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: '#555', marginTop: 3 }}>{par(o.efeito.txt)}{o.promessa ? ` · ${tr('⚠️ isso é uma PROMESSA: o jornal cobra no fim', '⚠️ this is a PROMISE: the paper will hold you to it')}` : ''}</div>
            </button>
          ))}
        </div>
        <button onClick={() => onEscolhe(null)} style={{ width: '100%', marginTop: 9, background: 'transparent', border: `2px dashed ${INK}`, borderRadius: 10, padding: 8, ...OSW, fontSize: 11.5, cursor: 'pointer', color: INK }}>{tr('pular coletiva', 'skip the presser')}</button>
      </div>
    </div>
  )
}

// ── a Sala de imprensa ─────────────────────────────────────────────────────────────────────────────────────────
const caixa: CSSProperties = { background: '#fff', border: `3px solid ${INK}`, borderRadius: 14, boxShadow: `3px 3px 0 ${INK}`, padding: 10, marginTop: 10, color: INK }
const h3: CSSProperties = { ...OSW, fontSize: 13.5, margin: '0 0 6px' }
export function SalaImprensa({ save, clube, onClose, rivais, podeTrocar, onTrocar }: {
  save: ColetivaSave; clube: string; onClose: () => void
  /** os rivais da carreira (pra escolher o arquirrival) · `podeTrocar` só na virada da temporada */
  rivais: string[]; podeTrocar: boolean; onTrocar: (team: string) => void
}) {
  useEffect(() => { const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }; window.addEventListener('keydown', esc); return () => window.removeEventListener('keydown', esc) }, [onClose])
  const fama = FAMAS[famaDoPresidente(save)]
  const c = save.contagem
  const frases = melhoresFrases(save, null, 8)
  const h2h = save.arquirrival ? save.h2hPor[save.arquirrival] ?? [0, 0, 0] : null
  const promessas = [...save.promessas].reverse().slice(0, 6)
  const cx = (emoji: string, n: number, rot: string, bg = '#fff'): ReactNode => (
    <div style={{ flex: 1, border: `2px solid ${INK}`, borderRadius: 10, textAlign: 'center', padding: '6px 2px', background: bg }}>
      <div style={{ ...OSW, fontSize: 20, lineHeight: 1 }}>{emoji} {n}</div><div style={{ fontSize: 10, fontWeight: 800, color: '#555' }}>{rot}</div>
    </div>
  )
  return createPortal(
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 99960, background: 'rgba(0,0,0,.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 14 }}>
      <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 440, maxHeight: '92vh', overflowY: 'auto', color: INK, background: CREME, border: `3px solid ${INK}`, borderRadius: 20, boxShadow: `5px 5px 0 ${INK}`, padding: 12 }}>
        <div style={{ background: INK, color: GOLD, borderRadius: 12, padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', ...OSW, fontSize: 15 }}>
          <span>🎙️ {tr('Sala de imprensa', 'Press room')} · {clube}</span>
          <button onClick={onClose} aria-label={tr('Fechar', 'Close')} style={{ background: 'none', border: 'none', color: GOLD, fontSize: 18, fontWeight: 900, cursor: 'pointer' }}>✕</button>
        </div>
        <div style={{ ...caixa, display: 'flex', gap: 6 }}>
          {cx('😈', c.provoca, tr('provocou', 'taunted'), '#FFE3D6')}{cx('🧊', c.diplomata, tr('diplomata', 'diplomat'))}{cx('🚪', c.desconversa, tr('desconversou', 'dodged'))}{cx('🤐', c.pulou, tr('pulou', 'skipped'), '#f3eee0')}
        </div>
        <div style={caixa}>
          <p style={h3}>🏷️ {tr('Fama do presidente', 'The president’s reputation')}</p>
          <div style={{ ...OSW, fontSize: 22, color: '#C2452F', lineHeight: 1 }}>{fama.emoji} “{par(fama.nome)}”</div>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#555', margin: '4px 0 0' }}>{par(fama.desc)}. {tr('Muda conforme você responde: Polemista · Diplomata · Escorregadio · Mudo · Sonhador · Pão-duro.', 'Changes with your answers: Firebrand · Diplomat · Slippery · Silent · Dreamer · Tightwad.')}</p>
        </div>
        <div style={{ ...caixa, background: '#FFE3D6' }}>
          <p style={h3}>🔥 {tr('Arquirrival', 'Arch-rival')}</p>
          {save.arquirrival
            ? <><div style={{ ...OSW, fontSize: 18 }}>{save.arquirrival}</div><p style={{ fontSize: 11.5, fontWeight: 800, margin: '2px 0 0', color: '#7a2a12' }}>{h2h ? retrospectoTexto(h2h, save.arquirrival) : ''}</p></>
            : <p style={{ fontSize: 12, fontWeight: 700, margin: 0 }}>{tr('Ainda sem arquirrival — ele aparece quando a temporada começa.', 'No arch-rival yet — he shows up when the season starts.')}</p>}
          {rivais.length > 1 && (
            <div style={{ marginTop: 8 }}>
              <label style={{ fontSize: 10.5, fontWeight: 800, color: '#555' }}>{podeTrocar ? tr('Trocar de arquirrival (só agora, na virada da temporada):', 'Change arch-rival (only now, between seasons):') : tr('Trocar só dá na virada da temporada.', 'You can only change between seasons.')}</label>
              <select disabled={!podeTrocar} value={save.arquirrival ?? ''} onChange={e => onTrocar(e.target.value)} style={{ width: '100%', marginTop: 4, border: `2px solid ${INK}`, borderRadius: 9, padding: '7px 9px', fontWeight: 800, fontSize: 13, background: '#fff', color: INK }}>
                {rivais.map(r => <option key={r} value={r}>{r}{save.h2hPor[r] ? ` · ${save.h2hPor[r][0]}V ${save.h2hPor[r][1]}E ${save.h2hPor[r][2]}D` : ''}</option>)}
              </select>
            </div>
          )}
          <p style={{ fontSize: 10, fontWeight: 700, color: '#7a2a12', margin: '6px 0 0' }}>{tr('É contra ele que a coletiva fala em clássico. O retrospecto conta cada jogo entre vocês nesta carreira.', 'He is the one the pressers call a derby. The record counts every game between you in this career.')}</p>
        </div>
        <div style={caixa}>
          <p style={h3}>🗞️ {tr('Frases que marcaram', 'Lines that made the news')}</p>
          {frases.length === 0 ? <p style={{ fontSize: 12, fontWeight: 700, color: '#666', margin: 0 }}>{tr('Você ainda não respondeu nenhuma coletiva. Elas aparecem depois de jogos com assunto.', 'You haven’t answered a presser yet. They show up after games worth talking about.')}</p>
            : frases.map((f, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', padding: '6px 0', borderTop: i ? '1px dashed #d8ccaa' : 'none' }}>
                <Reporter id={f.rep} size={30} />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 800, lineHeight: 1.3 }}>“{par(f.frase!)}”</div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#666' }}>T{f.t} · {f.r > 38 ? tr('Copa', 'Cup') : `R${f.r}`} · {par(ESTILO_TAG[f.estilo as Estilo]?.txt ?? ['', ''])}{f.promessa ? ' · 📝 ' + tr('promessa', 'promise') : ''}</div>
                </div>
              </div>
            ))}
        </div>
        {promessas.length > 0 && <div style={caixa}>
          <p style={h3}>📝 {tr('Promessas', 'Promises')}</p>
          {promessas.map((p, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '5px 0', borderTop: i ? '1px dashed #d8ccaa' : 'none', fontSize: 12, fontWeight: 700 }}>
              <span style={{ fontSize: 16 }}>{p.cumprida === undefined ? '⏳' : p.cumprida ? '✅' : '❌'}</span>
              <span style={{ flex: 1, lineHeight: 1.3 }}>“{par(p.frase)}” <small style={{ color: '#666' }}>· T{p.t}</small></span>
            </div>
          ))}
          <p style={{ fontSize: 10, fontWeight: 700, color: '#666', margin: '6px 0 0' }}>{tr('⏳ ainda nesta temporada · ✅ cumpriu · ❌ o jornal cobrou', '⏳ still this season · ✅ delivered · ❌ the paper called it out')}</p>
        </div>}
      </div>
    </div>,
    document.body,
  )
}

// ── o quadro da Central ────────────────────────────────────────────────────────────────────────────────────────
export type CardColetivaProps = { fama: FamaId; ultima: string | null; arquirrival: string | null; retro: string | null; onAbrir: () => void }
export function CardColetiva(p: CardColetivaProps) {
  const f = FAMAS[p.fama]
  return (
    <div className="ll-central-card ll-c-coletiva" style={{ background: '#fff' }}>
      <button type="button" className="ll-central-link" onClick={p.onAbrir} style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 13px', background: INK, color: '#fff', borderBottom: `3px solid ${INK}`, cursor: 'pointer' }}>
        <b style={{ ...OSW, fontSize: 15, letterSpacing: '.08em' }}>🎙️ {tr('Imprensa', 'Press')}</b>
        <small style={{ fontSize: 9.5, fontWeight: 800, opacity: .75 }}>{tr('sala de imprensa', 'press room')}<span style={{ color: GOLD }}> › </span></small>
      </button>
      <div style={{ padding: '10px 13px', color: INK }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 26 }}>{f.emoji}</span>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 9.5, fontWeight: 800, color: '#666', textTransform: 'uppercase' }}>{tr('fama do presidente', 'president’s reputation')}</div>
            <div style={{ ...OSW, fontSize: 18, color: '#C2452F', lineHeight: 1 }}>“{par(f.nome)}”</div>
          </div>
        </div>
        {p.ultima && <p style={{ margin: '8px 0 0', fontSize: 12, fontWeight: 700, lineHeight: 1.35, borderLeft: `3px solid ${ROXO}`, paddingLeft: 8 }}>{p.ultima}</p>}
        {p.arquirrival && <p style={{ margin: '8px 0 0', fontSize: 11.5, fontWeight: 800 }}>🔥 {tr('Arquirrival', 'Arch-rival')}: {p.arquirrival}{p.retro ? <span style={{ color: '#666', fontWeight: 700 }}> · {p.retro}</span> : null}</p>}
      </div>
    </div>
  )
}
export const COR_ESTILO = { GREEN, RED }

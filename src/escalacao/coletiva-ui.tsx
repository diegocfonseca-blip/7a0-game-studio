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
import { REPORTERES, FAMAS, type Efeito, famaDoPresidente, melhoresFrases, preenche, retrospectoTexto, type ColetivaPronta, type ColetivaSave, type Estilo, type Par, type FamaId } from './coletiva'
import estadioArt from './img/online-estadio-v25.webp'
import salaArt from './img/online-sala-v20.webp'
import vadicoArt from './img/patro-vadico-alfa.webp'
import tidexArt from './img/patro-tidex.webp'
import { PresidenteNaMesa } from './presidente-avatar'
import { presidenteContaLiberado, usePosseConta, usePresidenteConta } from './presidente-conta'
import { temBoneco } from './presidente-avulsas'
import { LojaButton } from './loja-clube'

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

// ── 🎙️ A COLETIVA COMO PASSO (20/10) ─────────────────────────────────────────────────────────────────────────────
// Diego: *"não tá tendo sentido entrevista embaixo do jogo… tem que ser passo a passo: após o jogo, quando ele avançar ou pular,
// aparecer, mas sem mostrar o próximo jogo… melhorar muito visualmente"*. Mockup aprovado: `scripts/mockups/coletiva-passo.png`.
// (1) `ColetivaAviso`: o aviso pequeno do pós-jogo ("a imprensa está te esperando") — sem botão, o botão é o de sempre.
// (2) `ColetivaPasso`: TELA CHEIA por cima de tudo (o próximo jogo não aparece): a sala de imprensa (backdrop dos
//     patrocinadores, mesa com os microfones, repórter, pergunta, 3 respostas, pular) → a manchete do O MARTELO → seguir.
export function ColetivaAviso({ placar }: { placar: string | null }) {
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'center', background: '#FFF6DE', border: `3px solid ${INK}`, borderRadius: 14, boxShadow: `3px 3px 0 ${INK}`, padding: '10px 12px', marginBottom: 12, color: INK }}>
      <span style={{ fontSize: 26 }}>🎙️</span>
      <span style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.35 }}>{placar ? `${placar}: ` : ''}{tr('a imprensa está te esperando na sala de entrevistas. Ela abre quando você seguir pra próxima rodada.', 'the press is waiting for you in the interview room. It opens when you move on to the next round.')}</span>
    </div>
  )
}

const ESTILO_IC: Record<Estilo, { ic: string; bg: string; card: string }> = {
  provoca: { ic: '😈', bg: RED, card: '#FFE3D6' },
  diplomata: { ic: '🧊', bg: '#BFE3FF', card: '#fff' },
  desconversa: { ic: '🚪', bg: '#EDE7D6', card: '#fff' },
}
const efeitoBom = (e: Efeito | null) => !!e && (e.tipo === 'renda' || e.tipo === 'moral_alta')
const efeitoRuim = (e: Efeito | null) => !!e && (e.tipo === 'rival_motivado' || e.tipo === 'moral_baixa')

export function ColetivaPasso({ pronta, clube, placar, rodadaTxt, autoSeg, seguirTxt, resolve, onFim }: {
  pronta: ColetivaPronta; clube: string; placar: string | null; rodadaTxt: string
  /** no automático ela fecha sozinha (N s na sala, sem contar como pulada; 6 s na manchete) — o jogo nunca trava */
  autoSeg: number | null
  /** o texto do botão de seguir ("Ir pra rodada 12", "Próxima fase") */
  seguirTxt: string
  /** a manchete e o efeito da resposta (a MESMA conta que o jogo faz ao guardar) */
  resolve: (estilo: Estilo) => { manchete: Par | null; efeito: Efeito | null }
  /** fecha: estilo escolhido (null = pulou) e se conta (pular no botão conta; fechar sozinho no automático, não) */
  onFim: (estilo: Estilo | null, registra: boolean) => void
}) {
  const [escolha, setEscolha] = useState<{ estilo: Estilo; manchete: Par | null; efeito: Efeito | null; frase: Par } | null>(null)
  const [resta, setResta] = useState(autoSeg)
  useEffect(() => { setResta(escolha ? (autoSeg != null ? 6 : null) : autoSeg) }, [autoSeg, escolha])
  useEffect(() => {
    if (resta == null) return
    if (resta <= 0) { if (escolha) onFim(escolha.estilo, true); else onFim(null, false); return }
    const t = setTimeout(() => setResta(r => (r == null ? r : r - 1)), 1000)
    return () => clearTimeout(t)
  }, [resta]) // eslint-disable-line react-hooks/exhaustive-deps
  const rep = pronta.rep
  // 🧑‍💼 o boneco da conta sentado na mesa (grátis não tem boneco: a mesa fica como era)
  const contaPres = usePresidenteConta()
  const boneco = presidenteContaLiberado() ? contaPres.value : null
  // sem boneco: um convite DISCRETO na cadeira vazia, que abre a Loja na seção do presidente (Diego 20/10)
  const posse = usePosseConta()
  const convite = !boneco && presidenteContaLiberado() && contaPres.status === 'pronto'
  const topo = (
    <div style={{ flex: 'none', height: 44, background: INK, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 14px', ...OSW, fontSize: 13 }}>
      <span>🎙️ {tr('Coletiva', 'Press conference')} · {rodadaTxt}</span>
      {resta != null && <span style={{ background: '#ffffff22', borderRadius: 999, padding: '2px 9px', fontSize: 11, fontFamily: 'Inter, sans-serif', textTransform: 'none' }}>{tr(`segue sozinho em ${resta}s`, `moves on in ${resta}s`)}</span>}
    </div>
  )
  const marcas = [vadicoArt, tidexArt, null, tidexArt, null, vadicoArt, null, vadicoArt, tidexArt]
  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 99955, background: '#0b0f14', display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: 480, height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', borderLeft: `3px solid ${INK}`, borderRight: `3px solid ${INK}` }}>
        {topo}
        {!escolha ? (
          <div style={{ flex: 1, overflowY: 'auto', position: 'relative', background: `#0e1319 url(${salaArt}) center / cover` }}>
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,rgba(8,10,14,.55),rgba(8,10,14,.85) 60%,#0b0f14)' }} />
            <div style={{ position: 'relative', paddingBottom: 14 }}>
              {/* o backdrop dos patrocinadores, atrás da mesa */}
              <div style={{ position: 'relative' }}>
              <div style={{ margin: '12px 12px 0', height: boneco ? 210 : 132, border: `3px solid ${INK}`, borderRadius: 12, background: '#f7f2e4', overflow: 'hidden', boxShadow: '3px 3px 0 #000', display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gridTemplateRows: 'repeat(3,1fr)' }}>
                {marcas.map((m, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: m === tidexArt ? '#0B1220' : 'transparent', borderRight: '1px dashed rgba(0,0,0,.08)', borderBottom: '1px dashed rgba(0,0,0,.08)' }}>
                    {m ? <img src={m} alt="" style={{ height: 22, maxWidth: '86%', objectFit: 'contain' }} /> : <span style={{ ...OSW, fontSize: 11, letterSpacing: .5, color: INK }}>Leilão Legends</span>}
                  </div>
                ))}
              </div>
              {convite && <div style={{ position: 'absolute', left: 0, right: 0, bottom: 74, display: 'flex', justifyContent: 'center', zIndex: 1 }}>
                <LojaButton naCarreira ancora="loja-presidente" style={{ background: 'rgba(12,12,12,.78)', color: '#fff', border: '1.5px solid rgba(255,255,255,.45)', borderRadius: 999, padding: '5px 12px', fontSize: 11.5, fontWeight: 700, fontFamily: 'Inter, sans-serif', cursor: 'pointer', maxWidth: '86%' }}>
                  {temBoneco(posse) ? tr('🧑‍💼 Seu plano já tem presidente · monte o seu ›', '🧑‍💼 Your plan includes a president · make yours ›') : tr('🧑‍💼 Crie seu presidente e apareça aqui ›', '🧑‍💼 Create your president and show up here ›')}
                </LojaButton>
              </div>}
              {boneco && <div style={{ position: 'absolute', left: 0, right: 0, bottom: -26, display: 'flex', justifyContent: 'center', pointerEvents: 'none', zIndex: 1 }}><PresidenteNaMesa visual={boneco} altura={196} /></div>}
              </div>
              {/* a mesa com os microfones e a plaquinha do presidente */}
              <div style={{ margin: '-30px 22px 0', zIndex: 2, height: 54, background: `linear-gradient(180deg,#1b232c,${INK})`, border: `3px solid ${INK}`, borderRadius: '10px 10px 4px 4px', position: 'relative', display: 'flex', justifyContent: 'center', gap: 28 }}>
                {[GOLD, RED, GREEN].map(c => (
                  <span key={c} style={{ position: 'relative', width: 8, height: 30, background: '#333', borderRadius: 4, marginTop: -22 }}>
                    <span style={{ position: 'absolute', top: -12, left: -6, width: 20, height: 16, borderRadius: 8, background: c, border: `2px solid ${INK}` }} />
                  </span>
                ))}
                <span style={{ position: 'absolute', bottom: 4, left: '50%', transform: 'translateX(-50%)', ...OSW, fontSize: 12, color: GOLD, letterSpacing: 1, whiteSpace: 'nowrap' }}>{tr('Presidente', 'President')} · {clube}</span>
              </div>
              <div style={{ padding: '10px 14px 0', display: 'flex', justifyContent: 'space-between', gap: 8, ...OSW, fontSize: 11, letterSpacing: 1, color: GOLD }}>
                <span>🎙️ {rodadaTxt}</span>{placar && <span style={{ color: '#fff', opacity: .85, textAlign: 'right' }}>{placar}</span>}
              </div>
              <div style={{ margin: '8px 12px 0', display: 'flex', gap: 9, alignItems: 'flex-start' }}>
                <Reporter id={rep.id} />
                <div style={{ background: '#fff', border: `3px solid ${INK}`, borderRadius: '4px 16px 16px 16px', padding: '8px 11px', boxShadow: '3px 3px 0 #000', fontSize: 14, fontWeight: 700, lineHeight: 1.3, color: INK }}>
                  <span style={{ display: 'inline-block', ...OSW, fontSize: 10, background: rep.cor, color: rep.cor === GOLD ? INK : '#fff', borderRadius: 5, padding: '1px 6px', marginBottom: 4, letterSpacing: .5 }}>🎤 {rep.nome} · {par(rep.veiculo)}</span><br />
                  “{preenche(pronta.pergunta, pronta.vars)}”
                </div>
              </div>
              <div style={{ margin: '10px 12px 0', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {pronta.opcoes.map(o => (
                  <button key={o.estilo} onClick={() => { const r = resolve(o.estilo); setEscolha({ estilo: o.estilo, manchete: r.manchete, efeito: r.efeito ?? o.efeito, frase: o.frase }) }}
                    style={{ textAlign: 'left', background: ESTILO_IC[o.estilo].card, border: `3px solid ${INK}`, borderRadius: 14, padding: '8px 10px', boxShadow: '3px 3px 0 #000', display: 'grid', gridTemplateColumns: '34px 1fr', gap: 8, alignItems: 'center', cursor: 'pointer', color: INK }}>
                    <span style={{ width: 34, height: 34, borderRadius: 10, border: `2.5px solid ${INK}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, background: ESTILO_IC[o.estilo].bg }}>{ESTILO_IC[o.estilo].ic}</span>
                    <span>
                      <span style={{ display: 'block', fontFamily: 'Oswald, sans-serif', fontWeight: 700, fontSize: 13.5, lineHeight: 1.2 }}>“{preenche(o.frase, pronta.vars)}”</span>
                      <span style={{ display: 'block', fontSize: 11, fontWeight: 600, opacity: .75, marginTop: 2 }}>{par(o.efeito.txt)}{o.promessa ? ` · ${tr('⚠️ é uma PROMESSA: o jornal cobra no fim', '⚠️ it is a PROMISE: the paper will hold you to it')}` : ''}</span>
                    </span>
                  </button>
                ))}
              </div>
              <button onClick={() => onFim(null, true)} style={{ display: 'block', margin: '12px auto 0', background: 'none', border: 'none', color: '#fff', ...OSW, fontSize: 12, letterSpacing: 1, opacity: .8, textDecoration: 'underline', cursor: 'pointer' }}>{tr('pular a coletiva ›', 'skip the presser ›')}</button>
            </div>
          </div>
        ) : (
          <div style={{ flex: 1, overflowY: 'auto', background: CREME, padding: 14, color: INK }}>
            <div style={{ background: '#FFFDF4', border: `3px solid ${INK}`, borderRadius: 14, boxShadow: `4px 4px 0 ${INK}`, overflow: 'hidden' }}>
              <div style={{ background: INK, color: GOLD, ...OSW, fontSize: 22, textAlign: 'center', padding: 8, letterSpacing: 2 }}>O MARTELO</div>
              <div style={{ padding: '12px 14px 4px', ...OSW, fontSize: 24, lineHeight: 1.08 }}>{escolha.manchete ? par(escolha.manchete) : `“${preenche(escolha.frase, pronta.vars)}”`}</div>
              <div style={{ padding: '4px 14px 12px', fontSize: 13, fontStyle: 'italic', opacity: .8 }}>“{preenche(escolha.frase, pronta.vars)}” — {tr('presidente do', 'president of')} {clube}{placar ? ` · ${placar}` : ''}</div>
            </div>
            {escolha.efeito && <div style={{ marginTop: 12, background: efeitoBom(escolha.efeito) ? '#E9F7EE' : efeitoRuim(escolha.efeito) ? '#FFE3D6' : '#fff', border: `3px solid ${INK}`, borderRadius: 14, boxShadow: `3px 3px 0 ${INK}`, padding: '10px 12px', fontSize: 13, fontWeight: 700 }}>{par(escolha.efeito.txt)}</div>}
            <button onClick={() => onFim(escolha.estilo, true)} style={{ width: '100%', marginTop: 14, background: GOLD, border: `3px solid ${INK}`, borderRadius: 14, boxShadow: `3px 3px 0 ${INK}`, padding: 14, ...OSW, fontSize: 20, cursor: 'pointer', color: INK }}>▶ {seguirTxt}</button>
          </div>
        )}
      </div>
    </div>,
    document.body,
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

// 🚶 FAN ZONE — o que aparece POR CIMA do mapa 3D (07/11, mockup `scripts/mockups/fanzone.png`). O 3D mora em
// `presidencia-fanzone-3d.ts`; aqui só o controle (joystick), arrastar pra girar a câmera e os cartões de cada passo.
// 🔁 07/11 (1º teste do Diego): o botão de entrar/sair mora na BARRA DE CIMA do mapa (junto de Mapa/Locais — antes ficava em
// cima de outro botão e o "sair" não pegava); durante o passeio os botões do mapa (+ − Ver tudo Girar, Controles) somem.
import { useEffect, useRef, useState, type CSSProperties, type PointerEvent, type ReactNode } from 'react'
import { useT } from './lang'
import type { CadeiraFanZone, FaseFanZone } from './presidencia-fanzone-3d'

const INK = '#0C0C0C', GOLD = '#FFC400', GREEN = '#1B7A3D'
const OSW: CSSProperties = { fontFamily: 'Oswald, sans-serif', fontWeight: 800, textTransform: 'uppercase' }
const btn: CSSProperties = { ...OSW, background: '#fff', color: INK, border: `3px solid ${INK}`, borderRadius: 12, padding: '8px 12px', boxShadow: `3px 3px 0 ${INK}`, fontSize: 13, cursor: 'pointer', pointerEvents: 'auto' }
const verde: CSSProperties = { ...btn, background: GREEN, color: '#fff', width: '100%', fontSize: 15, padding: '10px 12px' }

type Controle = { input: { x: number; y: number; correr: boolean }; ligar(): void; desligar(): void; entrar(): boolean; escolher(id: string): void; sentar(): void; levantar(): void; girar(dx: number, dy: number): void; irProPortao(): void; rumo(): { metros: number; angulo: number } }

export function FanZoneHud({ fase, cadeiras, escolhida, fan }: { fase: FaseFanZone; cadeiras: CadeiraFanZone[]; escolhida: string; fan: Controle | null }) {
  const t = useT()
  const [correr, setCorrer] = useState(false)
  const [semCadeira, setSemCadeira] = useState(false)
  if (!fan || fase === 'fora') return null
  const camada: CSSProperties = { position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 30 }
  const chip = (txt: string) => <p style={{ position: 'absolute', left: 10, top: 60, margin: 0, background: '#fff', border: `2.5px solid ${INK}`, borderRadius: 10, padding: '4px 9px', ...OSW, fontSize: 12, boxShadow: `2px 2px 0 ${INK}`, zIndex: 2 }}>{txt}</p>
  const arrasta = (filhos: ReactNode) => <Arrasto fan={fan}>{filhos}</Arrasto>
  if (fase === 'andando' || fase === 'portao') return (
    <div style={camada}>
      {arrasta(null)}
      {chip(fase === 'portao' ? t('🎟️ Portão da torcida', '🎟️ Supporters gate') : t('🚶 Siga até o portão da torcida', '🚶 Head to the supporters gate'))}
      {fase === 'andando' && <Bussola fan={fan} />}
      {fase === 'portao' && (
        <div style={{ position: 'absolute', left: 12, right: 12, top: 96, background: '#fff', border: `4px solid ${INK}`, borderRadius: 16, boxShadow: `4px 4px 0 ${INK}`, padding: '10px 12px', pointerEvents: 'auto', zIndex: 2 }}>
          <small style={{ display: 'block', fontSize: 12, color: 'rgba(0,0,0,.65)', margin: '0 0 8px', fontWeight: 600 }}>{semCadeira ? t('A arquibancada da casa está lotada agora. Tenta de novo daqui a pouco.', 'The home stand is full right now. Try again in a bit.') : t('Entra e escolhe a sua cadeira no setor da casa.', 'Go in and pick your seat in the home stand.')}</small>
          <button type="button" style={verde} onClick={() => setSemCadeira(!fan.entrar())}>{t('Entrar no estádio', 'Enter the stadium')}</button>
        </div>
      )}
      <Joystick fan={fan} />
      <button type="button" aria-pressed={correr} onClick={() => { const v = !correr; setCorrer(v); fan.input.correr = v }} style={{ ...btn, position: 'absolute', right: 14, bottom: 30, background: correr ? GOLD : '#fff', zIndex: 2 }}>{correr ? t('🏃 Correndo', '🏃 Running') : t('🚶 Andando', '🚶 Walking')}</button>
      <p style={{ position: 'absolute', right: 14, bottom: 8, margin: 0, fontSize: 10.5, fontWeight: 700, color: '#fff', textShadow: '0 1px 2px #000' }}>{t('arraste a tela pra girar', 'drag the screen to turn')}</p>
    </div>
  )
  if (fase === 'escolhendo') return (
    <div style={camada}>
      {chip(t('🏟️ Escolha sua cadeira', '🏟️ Pick your seat'))}
      <div style={{ position: 'absolute', left: 12, right: 12, bottom: 12, background: '#fff', border: `4px solid ${INK}`, borderRadius: 16, boxShadow: `4px 4px 0 ${INK}`, padding: '10px 12px', pointerEvents: 'auto' }}>
        <p style={{ margin: '0 0 6px', fontSize: 12, fontWeight: 700 }}>{t('🟢 Setor da casa · lá em cima, no meio-campo', '🟢 Home stand · up top, at midfield')}</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 8 }}>
          {cadeiras.map(c => <button key={c.id} type="button" onClick={() => fan.escolher(c.id)} style={{ ...btn, fontSize: 11.5, padding: '6px 6px', background: c.id === escolhida ? GOLD : '#fff', boxShadow: c.id === escolhida ? `2px 2px 0 ${INK}` : 'none' }}>{c.id === escolhida ? '✔ ' : ''}{c.rotulo}</button>)}
        </div>
        <button type="button" style={verde} onClick={() => fan.sentar()}>{t('Sentar e assistir', 'Sit and watch')}</button>
        <button type="button" onClick={() => fan.levantar()} style={{ ...btn, width: '100%', marginTop: 6, boxShadow: 'none' }}>{t('↩ Voltar pra rua', '↩ Back to the street')}</button>
      </div>
    </div>
  )
  return (
    <div style={camada}>
      {arrasta(null)}
      {chip(t('📺 Na arquibancada', '📺 In the stands'))}
      <div style={{ position: 'absolute', left: 10, right: 10, bottom: 14, display: 'flex', gap: 6, justifyContent: 'center', zIndex: 2 }}>
        <button type="button" style={btn} onClick={() => fan.levantar()}>{t('🚶 Levantar', '🚶 Stand up')}</button>
      </div>
      <p style={{ position: 'absolute', left: 0, right: 0, bottom: 62, margin: 0, textAlign: 'center', fontSize: 10.5, fontWeight: 700, color: '#fff', textShadow: '0 1px 2px #000' }}>{t('arraste a tela pra olhar em volta', 'drag the screen to look around')}</p>
    </div>
  )
}

/** a tela inteira (fora dos botões) gira a câmera ao arrastar — o mapa não se mexe mais por baixo durante o passeio */
function Arrasto({ fan, children }: { fan: Controle; children: ReactNode }) {
  const ult = useRef<{ x: number; y: number } | null>(null)
  const move = (e: PointerEvent<HTMLDivElement>) => { const u = ult.current; if (!u) return; fan.girar(e.clientX - u.x, e.clientY - u.y); ult.current = { x: e.clientX, y: e.clientY } }
  return (
    <div onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); ult.current = { x: e.clientX, y: e.clientY } }} onPointerMove={move} onPointerUp={() => { ult.current = null }} onPointerCancel={() => { ult.current = null }}
      style={{ position: 'absolute', left: 0, right: 0, bottom: 0, top: 58, pointerEvents: 'auto', touchAction: 'none', zIndex: 1 }}>{children}</div> // (a faixa de cima fica livre: é onde mora o ✕ Sair do passeio)
  )
}

function Joystick({ fan }: { fan: Controle }) {
  const caixa = useRef<HTMLDivElement | null>(null)
  const [p, setP] = useState({ x: 0, y: 0 })
  const R = 40
  const move = (e: PointerEvent<HTMLDivElement>) => {
    const r = caixa.current?.getBoundingClientRect(); if (!r) return
    let dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2)
    const l = Math.hypot(dx, dy); if (l > R) { dx = dx / l * R; dy = dy / l * R }
    setP({ x: dx, y: dy }); fan.input.x = dx / R; fan.input.y = -dy / R
  }
  const solta = () => { setP({ x: 0, y: 0 }); fan.input.x = 0; fan.input.y = 0 }
  return (
    <div ref={caixa} role="slider" aria-label="Controle de andar" aria-valuenow={0}
      onPointerDown={e => { e.stopPropagation(); e.currentTarget.setPointerCapture(e.pointerId); move(e) }} onPointerMove={e => { if (e.buttons || e.pointerType === 'touch') move(e) }} onPointerUp={solta} onPointerCancel={solta}
      style={{ position: 'absolute', left: 16, bottom: 18, width: 112, height: 112, borderRadius: '50%', background: 'rgba(255,255,255,.4)', border: `3px solid rgba(0,0,0,.65)`, touchAction: 'none', pointerEvents: 'auto', zIndex: 2 }}>
      <i style={{ position: 'absolute', left: 56 - 22 + p.x, top: 56 - 22 + p.y, width: 44, height: 44, borderRadius: '50%', background: GOLD, border: `3px solid ${INK}`, boxShadow: `2px 2px 0 ${INK}`, boxSizing: 'border-box' }} />
    </div>
  )
}

/** 🧭 07/11: a seta aponta pro portão da torcida (em relação à TELA, gira junto com a câmera) + os metros + o atalho */
function Bussola({ fan }: { fan: Controle }) {
  const t = useT()
  const [r, setR] = useState(() => fan.rumo())
  useEffect(() => { const id = window.setInterval(() => setR(fan.rumo()), 120); return () => window.clearInterval(id) }, [fan])
  return (
    <div style={{ position: 'absolute', right: 10, top: 60, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, zIndex: 2 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#fff', border: `2.5px solid ${INK}`, borderRadius: 10, padding: '3px 8px 3px 4px', boxShadow: `2px 2px 0 ${INK}` }}>
        <span aria-hidden style={{ display: 'grid', placeItems: 'center', width: 26, height: 26, borderRadius: '50%', background: GREEN, color: '#fff', fontSize: 16, fontWeight: 900, transform: `rotate(${r.angulo}rad)` }}>↑</span>
        <b style={{ ...OSW, fontSize: 12 }}>{t('Portão', 'Gate')} · {r.metros} m</b>
      </div>
      <button type="button" onClick={() => fan.irProPortao()} style={{ ...btn, fontSize: 11.5, padding: '5px 9px', boxShadow: `2px 2px 0 ${INK}` }}>{t('🎟️ Ir pro portão', '🎟️ Go to the gate')}</button>
    </div>
  )
}

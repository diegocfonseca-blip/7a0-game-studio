// 🚶 FAN ZONE — o que aparece POR CIMA do mapa 3D (07/11, mockup `scripts/mockups/fanzone.png`). O 3D mora em
// `presidencia-fanzone-3d.ts`; aqui só botão, controle (joystick) e os cartões de cada passo.
import { useRef, useState, type CSSProperties, type PointerEvent } from 'react'
import { useT } from './lang'
import type { CadeiraFanZone, FaseFanZone } from './presidencia-fanzone-3d'

const INK = '#0C0C0C', GOLD = '#FFC400', GREEN = '#1B7A3D'
const OSW: CSSProperties = { fontFamily: 'Oswald, sans-serif', fontWeight: 800, textTransform: 'uppercase' }
const btn: CSSProperties = { ...OSW, background: '#fff', color: INK, border: `3px solid ${INK}`, borderRadius: 12, padding: '8px 12px', boxShadow: `3px 3px 0 ${INK}`, fontSize: 13, cursor: 'pointer', pointerEvents: 'auto' }
const verde: CSSProperties = { ...btn, background: GREEN, color: '#fff', width: '100%', fontSize: 15, padding: '10px 12px' }

type Controle = { input: { x: number; y: number; correr: boolean }; ligar(): void; desligar(): void; entrar(): boolean; escolher(id: string): void; sentar(): void; levantar(): void }

export function FanZoneHud({ fase, cadeiras, escolhida, fan, pronto }: { fase: FaseFanZone; cadeiras: CadeiraFanZone[]; escolhida: string; fan: Controle | null; pronto: boolean }) {
  const t = useT()
  const [correr, setCorrer] = useState(false)
  const [semCadeira, setSemCadeira] = useState(false)
  const camada: CSSProperties = { position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 6 }
  if (!fan) return null
  if (fase === 'fora') return (
    <div style={camada}>
      <button type="button" disabled={!pronto} onClick={() => fan.ligar()} style={{ ...btn, position: 'absolute', left: 10, bottom: 72, background: GOLD }}>{t('🚶 Passear', '🚶 Walk around')}</button>
    </div>
  )
  const topo = (titulo: string) => (
    <div style={{ position: 'absolute', left: 8, right: 8, top: 8, display: 'flex', alignItems: 'center', background: '#fff', border: `3px solid ${INK}`, borderRadius: 12, padding: '6px 10px', boxShadow: `3px 3px 0 ${INK}`, pointerEvents: 'auto' }}>
      <b style={{ ...OSW, fontSize: 14 }}>{titulo}</b>
      <button type="button" onClick={() => { setCorrer(false); fan.desligar() }} style={{ marginLeft: 'auto', background: 'none', border: 'none', fontWeight: 800, fontSize: 13, cursor: 'pointer', color: INK }}>{t('✕ sair', '✕ exit')}</button>
    </div>
  )
  if (fase === 'andando' || fase === 'portao') return (
    <div style={camada}>
      {topo(t('🚶 Passeio pelo bairro', '🚶 Neighbourhood walk'))}
      {fase === 'portao' && (
        <div style={{ position: 'absolute', left: 12, right: 12, top: 62, background: '#fff', border: `4px solid ${INK}`, borderRadius: 16, boxShadow: `4px 4px 0 ${INK}`, padding: '10px 12px', pointerEvents: 'auto' }}>
          <b style={{ ...OSW, fontSize: 16, display: 'block' }}>{t('🎟️ Portão da torcida', '🎟️ Supporters gate')}</b>
          <small style={{ display: 'block', fontSize: 12, color: 'rgba(0,0,0,.65)', margin: '2px 0 8px', fontWeight: 600 }}>{semCadeira ? t('A arquibancada da casa está lotada agora. Tenta de novo daqui a pouco.', 'The home stand is full right now. Try again in a bit.') : t('Entra e escolhe a sua cadeira no setor da casa.', 'Go in and pick your seat in the home stand.')}</small>
          <button type="button" style={verde} onClick={() => setSemCadeira(!fan.entrar())}>{t('Entrar no estádio', 'Enter the stadium')}</button>
        </div>
      )}
      {fase === 'andando' && <p style={{ position: 'absolute', left: 12, top: 60, margin: 0, background: GREEN, color: '#fff', border: `2.5px solid ${INK}`, borderRadius: 10, padding: '4px 8px', ...OSW, fontSize: 12, boxShadow: `2px 2px 0 ${INK}` }}>{t('🏟️ Siga até o portão da torcida', '🏟️ Head to the supporters gate')}</p>}
      <Joystick fan={fan} />
      <button type="button" aria-pressed={correr} onClick={() => { const v = !correr; setCorrer(v); fan.input.correr = v }} style={{ ...btn, position: 'absolute', left: 140, bottom: 26, background: correr ? GOLD : '#fff' }}>{t('🏃 Correr', '🏃 Run')}</button>
    </div>
  )
  if (fase === 'escolhendo') return (
    <div style={camada}>
      {topo(t('🏟️ Escolha sua cadeira', '🏟️ Pick your seat'))}
      <div style={{ position: 'absolute', left: 12, right: 12, bottom: 12, background: '#fff', border: `4px solid ${INK}`, borderRadius: 16, boxShadow: `4px 4px 0 ${INK}`, padding: '10px 12px', pointerEvents: 'auto' }}>
        <p style={{ margin: '0 0 6px', fontSize: 12, fontWeight: 700 }}>{t('🟢 Setor da casa · cadeiras livres', '🟢 Home stand · free seats')}</p>
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
      {topo(t('📺 Assistindo da arquibancada', '📺 Watching from the stands'))}
      <div style={{ position: 'absolute', left: 10, right: 10, bottom: 14, display: 'flex', gap: 6, justifyContent: 'center' }}>
        <button type="button" style={btn} onClick={() => fan.levantar()}>{t('🚶 Levantar', '🚶 Stand up')}</button>
      </div>
    </div>
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
      onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); move(e) }} onPointerMove={e => { if (e.buttons || e.pointerType === 'touch') move(e) }} onPointerUp={solta} onPointerCancel={solta}
      style={{ position: 'absolute', left: 16, bottom: 18, width: 112, height: 112, borderRadius: '50%', background: 'rgba(255,255,255,.4)', border: `3px solid rgba(0,0,0,.65)`, touchAction: 'none', pointerEvents: 'auto' }}>
      <i style={{ position: 'absolute', left: 56 - 22 + p.x, top: 56 - 22 + p.y, width: 44, height: 44, borderRadius: '50%', background: GOLD, border: `3px solid ${INK}`, boxShadow: `2px 2px 0 ${INK}`, boxSizing: 'border-box' }} />
    </div>
  )
}

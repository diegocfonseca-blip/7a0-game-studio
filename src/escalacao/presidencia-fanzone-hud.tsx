// 🚶 FAN ZONE — o que aparece POR CIMA do mapa 3D (07/11, mockup `scripts/mockups/fanzone.png`). O 3D mora em
// `presidencia-fanzone-3d.ts`; aqui só o controle (joystick), arrastar pra girar a câmera e os cartões de cada passo.
// 🔁 07/11 (1º teste do Diego): o botão de entrar/sair mora na BARRA DE CIMA do mapa (junto de Mapa/Locais — antes ficava em
// cima de outro botão e o "sair" não pegava); durante o passeio os botões do mapa (+ − Ver tudo Girar, Controles) somem.
import { useEffect, useRef, useState, type CSSProperties, type PointerEvent, type ReactNode } from 'react'
import { useT } from './lang'
import type { CadeiraFanZone, FaseFanZone,criarFanZone } from './presidencia-fanzone-3d'
import './presidencia-passeio-hud.css'

const INK = '#0C0C0C', GOLD = '#FFC400', GREEN = '#1B7A3D'
const OSW: CSSProperties = { fontFamily: 'Oswald, sans-serif', fontWeight: 800, textTransform: 'uppercase' }
const btn: CSSProperties = { ...OSW, background: '#fff', color: INK, border: `3px solid ${INK}`, borderRadius: 12, padding: '8px 12px', boxShadow: `3px 3px 0 ${INK}`, fontSize: 13, cursor: 'pointer', pointerEvents: 'auto' }
const verde: CSSProperties = { ...btn, background: GREEN, color: '#fff', width: '100%', fontSize: 15, padding: '10px 12px' }

type Controle = ReturnType<typeof criarFanZone>

export function FanZoneHud({ fase, cadeiras, escolhida, fan,somenteEstadio=false }: { fase: FaseFanZone; cadeiras: CadeiraFanZone[]; escolhida: string; fan: Controle | null;somenteEstadio?:boolean }) {
  const t = useT()
  const [correr, setCorrer] = useState(false)
  const [semCadeira, setSemCadeira] = useState(false)
  useEffect(() => {
    setCorrer(fan?.input.correr ?? false)
    if (fase !== 'portao') setSemCadeira(false)
  }, [fan, fase])
  if (!fan || fase === 'fora') return null
  const camada: CSSProperties = { position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 30 }
  const chip = (txt: string) => <p style={{ position: 'absolute', left: 10, top: fase==='sentado'?undefined:60, bottom: fase==='sentado'?104:undefined, margin: 0, background: '#fff', border: `2.5px solid ${INK}`, borderRadius: 10, padding: '4px 9px', ...OSW, fontSize: 12, boxShadow: `2px 2px 0 ${INK}`, zIndex: 2 }}>{txt}</p>
  const arrasta = (filhos: ReactNode) => <Arrasto fan={fan}>{filhos}</Arrasto>
  if (fase === 'andando' || fase === 'portao') return (
    <div style={camada}>
      {arrasta(null)}
      <p className="fz-free-chip">{t('🚶 Passeio livre','🚶 Free walk')}</p>
      <Bussola fan={fan} fase={fase}/>
      {fase === 'portao' && (
        <div className="fz-gate-card" style={{ position: 'absolute', left: 12, right: 12, top: 176, background: '#fff', border: `4px solid ${INK}`, borderRadius: 16, boxShadow: `4px 4px 0 ${INK}`, padding: '10px 12px', pointerEvents: 'auto', zIndex: 2 }}>
          <small style={{ display: 'block', fontSize: 12, color: 'rgba(0,0,0,.65)', margin: '0 0 8px', fontWeight: 600 }}>{semCadeira ? t('A arquibancada da casa está lotada agora. Tenta de novo daqui a pouco.', 'The home stand is full right now. Try again in a bit.') : t('Entra e escolhe a sua cadeira no setor da casa.', 'Go in and pick your seat in the home stand.')}</small>
          <button type="button" style={verde} onClick={() => setSemCadeira(!fan.entrar())}>{t('Entrar no estádio', 'Enter the stadium')}</button>
        </div>
      )}
      <Joystick fan={fan} />
      <div className="fz-walk-actions"><button type="button" style={btn} onClick={()=>fan.centralizar()}>{t('Centralizar','Recenter')}</button><button type="button" aria-pressed={correr} onClick={() => { const v = !correr; setCorrer(v); fan.input.correr = v }} style={{ ...btn,background: correr ? GOLD : '#fff' }}>{correr ? t('🏃 Correndo', '🏃 Running') : t('🚶 Andando', '🚶 Walking')}</button></div>
      <p className="fz-walk-help"><span className="fz-touch-help">{t('Um dedo anda · outro olha','One finger walks · the other looks')}</span><span className="fz-keyboard-help">{t('WASD / setas · Shift corre · arraste para olhar','WASD / arrows · Shift runs · drag to look')}</span></p>
      <AcaoProxima fan={fan}/>
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
        {semCadeira && <p role="status" style={{ fontSize: 12, color: INK }}>{t('Essa cadeira deixou de estar disponível. Escolha outra.', 'That seat is no longer available. Pick another.')}</p>}
        <button type="button" style={verde} disabled={!escolhida} onClick={() => setSemCadeira(!fan.sentar())}>{t('Sentar e assistir', 'Sit and watch')}</button>
        <button type="button" onClick={() => somenteEstadio?fan.desligar():fan.levantar()} style={{ ...btn, width: '100%', marginTop: 6, boxShadow: 'none' }}>{somenteEstadio?t('Voltar à transmissão','Back to broadcast'):t('↩ Voltar pra rua', '↩ Back to the street')}</button>
      </div>
    </div>
  )
  return (
    <div style={camada}>
      {arrasta(null)}
      {chip(t('📺 Na arquibancada', '📺 In the stands'))}
      <div style={{ position: 'absolute', left: 10, right: 10, bottom: 14, display: 'flex', gap: 6, justifyContent: 'center', zIndex: 2 }}>
        <button type="button" style={btn} onClick={() => fan.levantar()}>{somenteEstadio?t('Trocar de assento','Change seat'):t('🚶 Levantar', '🚶 Stand up')}</button>
      </div>
      <p style={{ position: 'absolute', left: 0, right: 0, bottom: 62, margin: 0, textAlign: 'center', fontSize: 10.5, fontWeight: 700, color: '#fff', textShadow: '0 1px 2px #000' }}>{t('arraste a tela pra olhar em volta', 'drag the screen to look around')}</p>
    </div>
  )
}

/** a tela inteira (fora dos botões) gira a câmera ao arrastar — o mapa não se mexe mais por baixo durante o passeio */
function Arrasto({ fan, children }: { fan: Controle; children: ReactNode }) {
  const ult = useRef<{ id: number; x: number; y: number } | null>(null)
  const solta = (e: PointerEvent<HTMLDivElement>) => { if (ult.current?.id === e.pointerId) ult.current = null }
  const move = (e: PointerEvent<HTMLDivElement>) => { const u = ult.current; if (!u || u.id !== e.pointerId) return; fan.girar(e.clientX - u.x, e.clientY - u.y); ult.current = { id: e.pointerId, x: e.clientX, y: e.clientY } }
  useEffect(() => { const limpar = () => { ult.current = null };window.addEventListener('blur', limpar);return () => window.removeEventListener('blur', limpar) }, [])
  return (
    <div onPointerDown={e => { if (ult.current || e.button !== 0) return;e.currentTarget.setPointerCapture(e.pointerId); ult.current = { id: e.pointerId, x: e.clientX, y: e.clientY } }} onPointerMove={move} onPointerUp={solta} onPointerCancel={solta} onLostPointerCapture={solta}
      style={{ position: 'absolute', left: 0, right: 0, bottom: 0, top: 58, pointerEvents: 'auto', touchAction: 'none', zIndex: 1 }}>{children}</div> // (a faixa de cima fica livre: é onde mora o ✕ Sair do passeio)
  )
}

function Joystick({ fan }: { fan: Controle }) {
  const t = useT()
  const caixa = useRef<HTMLDivElement | null>(null)
  const pointer = useRef<number | null>(null)
  const [p, setP] = useState({ x: 0, y: 0 })
  const R = 40
  const move = (e: PointerEvent<HTMLDivElement>) => {
    if (pointer.current !== e.pointerId) return
    const r = caixa.current?.getBoundingClientRect(); if (!r) return
    let dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2)
    const l = Math.hypot(dx, dy); if (l > R) { dx = dx / l * R; dy = dy / l * R }
    setP({ x: dx, y: dy }); fan.input.x = dx / R; fan.input.y = -dy / R
  }
  const solta = () => { pointer.current = null; setP({ x: 0, y: 0 }); fan.input.x = 0; fan.input.y = 0 }
  const soltaPonteiro = (e: PointerEvent<HTMLDivElement>) => { if (pointer.current === e.pointerId) solta() }
  useEffect(() => {
    const parar = () => { pointer.current = null; setP({ x: 0, y: 0 }); fan.input.x = fan.input.y = 0 }
    const visibilidade = () => { if (document.hidden) parar() }
    window.addEventListener('blur', parar); document.addEventListener('visibilitychange', visibilidade)
    return () => { window.removeEventListener('blur', parar); document.removeEventListener('visibilitychange', visibilidade); fan.input.x = fan.input.y = 0 }
  }, [fan])
  return (
    <div ref={caixa} role="slider" aria-label={t('Controle de andar', 'Walk control')} aria-valuenow={0}
      onPointerDown={e => { e.stopPropagation(); if (pointer.current !== null || e.button !== 0) return;pointer.current = e.pointerId; e.currentTarget.setPointerCapture(e.pointerId); move(e) }} onPointerMove={move} onPointerUp={soltaPonteiro} onPointerCancel={soltaPonteiro} onLostPointerCapture={soltaPonteiro}
      style={{ position: 'absolute', left: 16, bottom: 18, width: 112, height: 112, borderRadius: '50%', background: 'rgba(255,255,255,.4)', border: `3px solid rgba(0,0,0,.65)`, touchAction: 'none', pointerEvents: 'auto', zIndex: 2 }}>
      <i style={{ position: 'absolute', left: 56 - 22 + p.x, top: 56 - 22 + p.y, width: 44, height: 44, borderRadius: '50%', background: GOLD, border: `3px solid ${INK}`, boxShadow: `2px 2px 0 ${INK}`, boxSizing: 'border-box' }} />
    </div>
  )
}

/** 🧭 07/11: a seta aponta pro portão da torcida (em relação à TELA, gira junto com a câmera) + os metros + o atalho */
function Bussola({ fan,fase }: { fan: Controle;fase:FaseFanZone }) {
  const t = useT()
  const [r, setR] = useState(() => fan.rumo())
  const [destino,D]=useState(()=>fan.snapshot().destino)
  useEffect(() => {D(fan.snapshot().destino);const id = window.setInterval(() => setR(fan.rumo()), 160); return () => window.clearInterval(id) }, [fan])
  return (
    <div className="fz-destination">
      <label><span>{t('Destino','Destination')}</span><select aria-label={t('Destino do passeio','Walk destination')} value={destino} onChange={e=>{fan.escolherDestino(e.target.value);D(e.target.value);setR(fan.rumo())}}><option value="">{t('Sem destino','No destination')}</option>{fan.destinos().map(d=><option key={d.id} value={d.id}>{t(...d.nome)}</option>)}</select></label>
      {destino&&<div className="fz-compass-value">
        <span aria-hidden style={{ display: 'grid', placeItems: 'center', width: 26, height: 26, borderRadius: '50%', background: GREEN, color: '#fff', fontSize: 16, fontWeight: 900, transform: `rotate(${r.angulo}rad)` }}>↑</span>
        <b style={{ ...OSW, fontSize: 12 }}>{r.metros} m</b>
      </div>}
      {destino==='portao'&&fase==='andando'&&<button type="button" onClick={() => fan.irProPortao()} style={{ ...btn, fontSize: 11.5, padding: '5px 9px', boxShadow: `2px 2px 0 ${INK}` }}>{t('🎟️ Ir pro portão', '🎟️ Go to the gate')}</button>}
    </div>
  )
}
function AcaoProxima({fan}:{fan:Controle}){
 const t=useT(),[local,L]=useState(()=>fan.proximo())
 useEffect(()=>{L(fan.proximo());const id=window.setInterval(()=>L(fan.proximo()),200);return()=>window.clearInterval(id)},[fan])
 if(!local?.acao)return null
 return <button type="button" className="fz-nearby-action" onClick={()=>fan.interagir()}><small>{t(...local.nome)}</small>{t(...local.acao)} →</button>
}

import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import './penalty-art.css'

export type PenaltyArtHandle = { moveKeeper: (zone: number) => void; flyBall: (zone: number, outside: boolean) => void }
const TARGETS = [[33, 30], [50, 29], [67, 30], [34, 42], [50, 42], [66, 42]]
const LABELS = ['↖ Alto esquerdo', '↑ Alto central', 'Alto direito ↗', '↙ Baixo esquerdo', '↓ Baixo central', 'Baixo direito ↘']
const ASSETS = `${import.meta.env.BASE_URL}penalty-private-v1/`
// Presentation only: the existing PenaltyBanner still decides and saves every result.
export const PenaltyArt = forwardRef<PenaltyArtHandle, { aim: number | null; choosing: boolean; onAim: (zone: number) => void }>(function PenaltyArt({ aim, choosing, onAim }, ref) {
  const ball = useRef<HTMLImageElement>(null), keeper = useRef<HTMLImageElement>(null), dive = useRef<HTMLImageElement>(null)
  const animations = useRef<Animation[]>([])
  const keeperZone = useRef(4)
  useEffect(() => () => animations.current.forEach(a => a.cancel()), [])
  useImperativeHandle(ref, () => ({
    moveKeeper(zone) { keeperZone.current = zone },
    flyBall(zone, outside) {
      const b = ball.current, k = keeper.current, d = dive.current
      if (!b || !k || !d) return
      animations.current.forEach(a => a.cancel()); animations.current = []
      const duration = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 1 : 450
      const [x, y] = TARGETS[zone] ?? TARGETS[4]
      const [kx, ky] = TARGETS[keeperZone.current] ?? TARGETS[4]
      const right = kx >= 50, sign = right ? 1 : -1
      const targetX = outside ? (zone % 3 === 0 ? 22 : zone % 3 === 2 ? 78 : 50) : x
      const targetY = outside ? (zone % 3 === 1 ? 12 : y - 8) : y
      k.style.opacity = '0'; d.style.opacity = '1'
      // The glove at 96% (mirrored at 4%) meets the selected target on saves.
      const endLeft = kx - (right ? 21.1 : .9)
      const endTop = ky - 7.3
      animations.current.push(d.animate([
        {left:'39%',top:'31%',transform:`scaleX(${sign})`},
        {left:`${endLeft}%`,top:`${endTop}%`,transform:`scaleX(${sign})`}
      ], {duration, fill:'forwards', easing:'cubic-bezier(.2,.65,.3,1)'}))
      animations.current.push(b.animate([
        {left:'50%',top:'75%',width:'4.5%',transform:'translate(-50%,-50%) rotate(0deg)'},
        {left:`${50 + (targetX - 50) * .6}%`,top:`${48 + (targetY - 32) * .5}%`,width:'2.4%',offset:.55,transform:'translate(-50%,-50%) rotate(200deg)'},
        {left:`${targetX}%`,top:`${targetY}%`,width:'1.4%',transform:'translate(-50%,-50%) rotate(400deg)'}
      ], {duration, fill:'forwards', easing:'cubic-bezier(.15,.5,.45,1)'}))
    }
  }), [])
  return <div className="ll-penalty-art">
    <div className="scene" role="img" aria-label="Cobrança vista atrás da marca do pênalti, com goleiro ilustrado e gol ao fundo">
      <img className="bg" src={`${ASSETS}scene.webp`} alt="" />
      <img ref={keeper} className="keeper" src={`${ASSETS}keeper.webp`} alt="" />
      <img ref={dive} className="dive" src={`${ASSETS}dive.webp`} alt="" />
      {choosing && aim !== null && <span className="aim" style={{left:`${TARGETS[aim][0]}%`,top:`${TARGETS[aim][1]}%`}} />}
      <img ref={ball} className="ball" src={`${ASSETS}ball.webp`} alt="" />
    </div>
    {choosing && <div className="targets" aria-label="Escolha onde cobrar">{LABELS.map((label, z) => <button type="button" key={z} aria-pressed={aim === z} onClick={() => onAim(z)}>{label}</button>)}</div>}
  </div>
})

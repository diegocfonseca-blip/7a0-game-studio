import { useMemo, useRef, Suspense } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { AnimatePresence, motion } from 'framer-motion'
import type { Color, PieceSymbol, Square } from 'chess.js'
import type { BoardTheme } from './themes'
import type { PieceInst } from './engine'
import { PieceGlyph } from './Board'

// ── Real 3D board: WebGL via three.js ────────────────────────────────────
// Staunton-inspired lathe-turned pieces with collar rings, glossy clearcoat
// finish, soft shadows, framed board with coordinates and a table camera.

const FILES = 'abcdefgh'

function squareToWorld(square: string): [number, number] {
  const f = FILES.indexOf(square[0])
  const r = Number(square[1]) - 1
  return [f - 3.5, 3.5 - r]   // x, z (white at +z, near the camera)
}

// ── Piece geometries (lathe profiles, unit = square size 1) ──────────────
function lathe(points: Array<[number, number]>, segments = 40): THREE.LatheGeometry {
  const g = new THREE.LatheGeometry(points.map(([x, y]) => new THREE.Vector2(x, y)), segments)
  g.computeVertexNormals()
  return g
}

// classic turned base shared by all pieces: plinth + fillet + cove
const BASE: Array<[number, number]> = [
  [0.000, 0.000], [0.320, 0.000], [0.320, 0.055], [0.290, 0.085],
  [0.300, 0.110], [0.250, 0.150], [0.215, 0.175],
]

function usePieceGeometries() {
  return useMemo(() => {
    const pawn = lathe([
      ...BASE,
      [0.160, 0.220], [0.120, 0.320], [0.105, 0.420],
      [0.170, 0.460], [0.170, 0.490], [0.095, 0.520],   // collar ring
      [0.135, 0.600], [0.130, 0.660], [0.075, 0.720], [0.0, 0.760],
    ])
    const rook = lathe([
      ...BASE,
      [0.185, 0.220], [0.150, 0.330], [0.140, 0.560],
      [0.155, 0.600], [0.240, 0.630], [0.240, 0.660],   // parapet flare
      [0.245, 0.820], [0.190, 0.820], [0.185, 0.740], [0.0, 0.740],
    ])
    const bishop = lathe([
      ...BASE,
      [0.170, 0.220], [0.115, 0.340], [0.095, 0.500],
      [0.160, 0.540], [0.160, 0.570], [0.090, 0.600],   // collar
      [0.150, 0.700], [0.155, 0.780], [0.100, 0.880], [0.045, 0.950], [0.0, 0.970],
    ])
    const queen = lathe([
      ...BASE,
      [0.180, 0.220], [0.120, 0.360], [0.095, 0.560],
      [0.165, 0.600], [0.165, 0.630], [0.090, 0.660],   // collar
      [0.130, 0.780], [0.210, 0.920], [0.150, 0.960],   // crown flare
      [0.080, 0.980], [0.0, 1.000],
    ])
    const king = lathe([
      ...BASE,
      [0.190, 0.220], [0.130, 0.380], [0.100, 0.600],
      [0.175, 0.640], [0.175, 0.670], [0.095, 0.700],   // collar
      [0.140, 0.820], [0.220, 0.960], [0.130, 1.000],   // crown flare
      [0.060, 1.020], [0.0, 1.030],
    ])
    const knightBase = lathe([
      ...BASE,
      [0.190, 0.220], [0.170, 0.260], [0.0, 0.260],
    ])

    // stylized Staunton horse: arched neck, ears, muzzle, jaw, chest
    const shape = new THREE.Shape()
    const pts: Array<[number, number]> = [
      [-0.155, 0.000], [-0.230, 0.240], [-0.200, 0.420], [-0.255, 0.540],
      [-0.200, 0.600], [-0.220, 0.700], [-0.150, 0.760],   // back of head / mane
      [-0.085, 0.900], [-0.035, 0.980],                    // ear 1
      [0.005, 0.900], [0.045, 0.965],                      // notch + ear 2
      [0.090, 0.870], [0.150, 0.780],                      // forehead
      [0.300, 0.660], [0.345, 0.590], [0.330, 0.540],      // muzzle
      [0.260, 0.510], [0.180, 0.505],                      // mouth/jaw
      [0.120, 0.420], [0.100, 0.320],                      // throat
      [0.150, 0.180], [0.140, 0.000],                      // chest
    ]
    shape.moveTo(pts[0][0], pts[0][1])
    for (let i = 1; i < pts.length; i++) shape.lineTo(pts[i][0], pts[i][1])
    shape.closePath()
    const knightHead = new THREE.ExtrudeGeometry(shape, {
      depth: 0.15, bevelEnabled: true, bevelThickness: 0.055, bevelSize: 0.045, bevelSegments: 3, steps: 1,
    })
    knightHead.translate(0, 0.24, -0.075)
    knightHead.computeVertexNormals()

    const merlon = new THREE.BoxGeometry(0.085, 0.095, 0.085)
    const crossV = new THREE.BoxGeometry(0.055, 0.200, 0.055)
    const crossH = new THREE.BoxGeometry(0.150, 0.055, 0.055)
    const orb = new THREE.SphereGeometry(0.055, 20, 14)
    const pearl = new THREE.SphereGeometry(0.032, 12, 10)
    const bishopBall = new THREE.SphereGeometry(0.048, 20, 14)

    return { pawn, rook, bishop, queen, king, knightBase, knightHead, merlon, crossV, crossH, orb, pearl, bishopBall }
  }, [])
}

type Geos = ReturnType<typeof usePieceGeometries>

// glossy lacquered finish — the "premium" look
function usePieceMaterials(theme: BoardTheme) {
  return useMemo(() => {
    const mk = (color: string) => new THREE.MeshPhysicalMaterial({
      color, roughness: 0.32, metalness: 0.05,
      clearcoat: 0.65, clearcoatRoughness: 0.22,
      sheen: 0.3, sheenColor: new THREE.Color('#ffffff'),
    })
    const w = mk(theme.whitePiece)
    const b = mk(theme.blackPiece)
    const wSel = mk(theme.whitePiece); wSel.emissive = new THREE.Color(theme.gold); wSel.emissiveIntensity = 0.32
    const bSel = mk(theme.blackPiece); bSel.emissive = new THREE.Color(theme.gold); bSel.emissiveIntensity = 0.32
    return { w, b, wSel, bSel }
  }, [theme])
}

// procedural wood-grain grayscale texture (used as roughnessMap for a subtle grain)
function useGrainTexture() {
  return useMemo(() => {
    const c = document.createElement('canvas')
    c.width = 128; c.height = 128
    const ctx = c.getContext('2d')!
    ctx.fillStyle = '#808080'
    ctx.fillRect(0, 0, 128, 128)
    // horizontal grain streaks
    for (let i = 0; i < 90; i++) {
      const y = Math.random() * 128
      const g = 96 + Math.random() * 90
      ctx.strokeStyle = `rgba(${g},${g},${g},${0.12 + Math.random() * 0.25})`
      ctx.lineWidth = 0.5 + Math.random() * 1.6
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.bezierCurveTo(42, y + (Math.random() * 6 - 3), 86, y + (Math.random() * 6 - 3), 128, y + (Math.random() * 4 - 2))
      ctx.stroke()
    }
    const tex = new THREE.CanvasTexture(c)
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping
    return tex
  }, [])
}

function PieceMesh({ piece, geos, mats, selected, onClick }: {
  piece: PieceInst
  geos: Geos
  mats: ReturnType<typeof usePieceMaterials>
  selected: boolean
  onClick: (sq: Square) => void
}) {
  const group = useRef<THREE.Group>(null)
  const [tx, tz] = squareToWorld(piece.square!)

  useFrame(() => {
    const g = group.current
    if (!g) return
    g.position.x += (tx - g.position.x) * 0.16
    g.position.z += (tz - g.position.z) * 0.16
  })

  const mat = piece.color === 'w' ? (selected ? mats.wSel : mats.w) : (selected ? mats.bSel : mats.b)
  const t = piece.type
  const s = t === 'p' ? 0.88 : t === 'k' ? 1.02 : 0.96

  return (
    <group
      ref={group}
      position={[tx, 0.13, tz]}
      scale={[s, s, s]}
      onPointerDown={e => { e.stopPropagation(); onClick(piece.square as Square) }}
    >
      {t === 'p' && <mesh geometry={geos.pawn} material={mat} castShadow />}
      {t === 'r' && (
        <>
          <mesh geometry={geos.rook} material={mat} castShadow />
          {[0, 1, 2, 3, 4].map(i => {
            const a = (i / 5) * Math.PI * 2
            return <mesh key={i} geometry={geos.merlon} material={mat} castShadow
                         position={[Math.cos(a) * 0.185, 0.86, Math.sin(a) * 0.185]}
                         rotation={[0, -a, 0]} />
          })}
        </>
      )}
      {t === 'b' && (
        <>
          <mesh geometry={geos.bishop} material={mat} castShadow />
          <mesh geometry={geos.bishopBall} material={mat} castShadow position={[0, 1.0, 0]} />
        </>
      )}
      {t === 'q' && (
        <>
          <mesh geometry={geos.queen} material={mat} castShadow />
          {[0, 1, 2, 3, 4, 5, 6, 7].map(i => {
            const a = (i / 8) * Math.PI * 2
            return <mesh key={i} geometry={geos.pearl} material={mat} castShadow
                         position={[Math.cos(a) * 0.165, 0.945, Math.sin(a) * 0.165]} />
          })}
          <mesh geometry={geos.orb} material={mat} castShadow position={[0, 1.04, 0]} />
        </>
      )}
      {t === 'k' && (
        <>
          <mesh geometry={geos.king} material={mat} castShadow />
          <mesh geometry={geos.crossV} material={mat} castShadow position={[0, 1.13, 0]} />
          <mesh geometry={geos.crossH} material={mat} castShadow position={[0, 1.13, 0]} />
        </>
      )}
      {t === 'n' && (
        <group rotation={[0, piece.color === 'w' ? Math.PI : 0, 0]}>
          <mesh geometry={geos.knightBase} material={mat} castShadow />
          <mesh geometry={geos.knightHead} material={mat} castShadow />
        </group>
      )}
    </group>
  )
}

// coordinate labels rendered onto small canvas textures
function useLabelTexture(text: string, color: string) {
  return useMemo(() => {
    const c = document.createElement('canvas')
    c.width = 64; c.height = 64
    const ctx = c.getContext('2d')!
    ctx.fillStyle = color
    ctx.font = 'bold 44px Oswald, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(text, 32, 34)
    const tex = new THREE.CanvasTexture(c)
    tex.anisotropy = 4
    return tex
  }, [text, color])
}

function CoordLabel({ text, position, color, rotationZ = 0 }: {
  text: string; position: [number, number, number]; color: string; rotationZ?: number
}) {
  const tex = useLabelTexture(text, color)
  return (
    <mesh position={position} rotation={[-Math.PI / 2, 0, rotationZ]}>
      <planeGeometry args={[0.34, 0.34]} />
      <meshBasicMaterial map={tex} transparent opacity={0.9} />
    </mesh>
  )
}

// pulsing red glow under the king in check
function CheckPulse({ x, z }: { x: number; z: number }) {
  const ref = useRef<THREE.Mesh>(null)
  useFrame(({ clock }) => {
    const m = ref.current
    if (!m) return
    const t = (Math.sin(clock.elapsedTime * 5) + 1) / 2
    const mat = m.material as THREE.MeshBasicMaterial
    mat.opacity = 0.35 + t * 0.45
    const s = 0.9 + t * 0.12
    m.scale.set(s, s, 1)
  })
  return (
    <mesh ref={ref} position={[x, 0.128, z]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[0.98, 0.98]} />
      <meshBasicMaterial color="#E8402F" transparent opacity={0.55} />
    </mesh>
  )
}

function Scene({ pieces, orientation, theme, selected, legalTargets, lastMove, checkSquare, occupied, onSquareClick, interactive }: {
  pieces: PieceInst[]
  orientation: Color
  theme: BoardTheme
  selected: Square | null
  legalTargets: Set<string>
  lastMove: { from: string; to: string } | null
  checkSquare: string | null
  occupied: Set<string>
  onSquareClick: (sq: Square) => void
  interactive: boolean
}) {
  const geos = usePieceGeometries()
  const mats = usePieceMaterials(theme)
  const grain = useGrainTexture()
  const alive = pieces.filter(p => p.square !== null)

  const squares = useMemo(() => {
    const out: Array<{ sq: string; light: boolean; x: number; z: number }> = []
    for (let r = 0; r < 8; r++) {
      for (let f = 0; f < 8; f++) {
        const sq = FILES[f] + (r + 1)
        const [x, z] = squareToWorld(sq)
        out.push({ sq, light: (f + r) % 2 === 1, x, z })
      }
    }
    return out
  }, [])

  const click = (sq: string) => { if (interactive) onSquareClick(sq as Square) }
  const labelRot = orientation === 'w' ? 0 : Math.PI

  return (
    <group rotation={[0, orientation === 'w' ? 0 : Math.PI, 0]}>
      {/* frame: outer plinth + inner lip */}
      <mesh position={[0, -0.22, 0]} receiveShadow castShadow>
        <boxGeometry args={[9.35, 0.42, 9.35]} />
        <meshPhysicalMaterial color={theme.boardBorder} roughness={0.5} metalness={0.08}
                              clearcoat={0.4} clearcoatRoughness={0.35} roughnessMap={grain} />
      </mesh>
      <mesh position={[0, -0.02, 0]} receiveShadow>
        <boxGeometry args={[8.55, 0.1, 8.55]} />
        <meshStandardMaterial color={theme.gold} roughness={0.35} metalness={0.5} />
      </mesh>

      {/* coordinates on the frame */}
      {FILES.split('').map((f, i) => (
        <CoordLabel key={`f${f}`} text={f.toUpperCase()} color={theme.coord}
                    position={[i - 3.5, 0.005, 4.32]} rotationZ={labelRot} />
      ))}
      {[1, 2, 3, 4, 5, 6, 7, 8].map(r => (
        <CoordLabel key={`r${r}`} text={String(r)} color={theme.coord}
                    position={[-4.32, 0.005, 3.5 - (r - 1)]} rotationZ={labelRot} />
      ))}

      {/* squares */}
      {squares.map(({ sq, light, x, z }) => (
        <mesh key={sq} position={[x, 0.02, z]} receiveShadow
              onPointerDown={e => { e.stopPropagation(); click(sq) }}>
          <boxGeometry args={[1, 0.2, 1]} />
          <meshPhysicalMaterial color={light ? theme.light : theme.dark}
                                roughness={0.42} metalness={0.05}
                                clearcoat={0.35} clearcoatRoughness={0.32} roughnessMap={grain} />
        </mesh>
      ))}

      {/* highlights */}
      {lastMove && [lastMove.from, lastMove.to].map(sq => {
        const [x, z] = squareToWorld(sq)
        return (
          <mesh key={`lm-${sq}`} position={[x, 0.125, z]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.96, 0.96]} />
            <meshBasicMaterial color={theme.gold} transparent opacity={0.35} />
          </mesh>
        )
      })}
      {selected && (() => {
        const [x, z] = squareToWorld(selected)
        return (
          <mesh position={[x, 0.13, z]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.96, 0.96]} />
            <meshBasicMaterial color={theme.gold} transparent opacity={0.5} />
          </mesh>
        )
      })()}
      {checkSquare && (() => {
        const [x, z] = squareToWorld(checkSquare)
        return <CheckPulse x={x} z={z} />
      })()}
      {[...legalTargets].map(sq => {
        const [x, z] = squareToWorld(sq)
        return occupied.has(sq) ? (
          <mesh key={`t-${sq}`} position={[x, 0.13, z]} rotation={[-Math.PI / 2, 0, 0]}
                onPointerDown={e => { e.stopPropagation(); click(sq) }}>
            <ringGeometry args={[0.38, 0.48, 32]} />
            <meshBasicMaterial color={theme.gold} transparent opacity={0.8} />
          </mesh>
        ) : (
          <mesh key={`t-${sq}`} position={[x, 0.14, z]}
                onPointerDown={e => { e.stopPropagation(); click(sq) }}>
            <cylinderGeometry args={[0.13, 0.13, 0.02, 24]} />
            <meshBasicMaterial color={theme.gold} transparent opacity={0.75} />
          </mesh>
        )
      })}

      {/* pieces */}
      {alive.map(p => (
        <PieceMesh key={p.id} piece={p} geos={geos} mats={mats}
                   selected={selected === p.square} onClick={click} />
      ))}
    </group>
  )
}

export interface Board3DProps {
  pieces: PieceInst[]
  orientation: Color
  theme: BoardTheme
  selected: Square | null
  legalTargets: Set<string>
  lastMove: { from: string; to: string } | null
  checkSquare: string | null
  occupied: Set<string>
  onSquareClick: (sq: Square) => void
  interactive: boolean
  promotion: { color: Color; onPick: (p: PieceSymbol) => void; onCancel: () => void } | null
}

export default function Board3D(props: Board3DProps) {
  const { theme, promotion } = props
  return (
    <div className="relative w-full mx-auto rounded-xl overflow-hidden"
         style={{ maxWidth: 'min(94vw, 70vh, 620px)', aspectRatio: '1.06', border: `1px solid ${theme.panelBorder}` }}>
      <Canvas
        shadows={{ type: THREE.PCFSoftShadowMap }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
        camera={{ position: [0, 8.0, 8.8], fov: 38 }}
        onCreated={({ camera }) => camera.lookAt(0, 0, 0.4)}
      >
        <hemisphereLight args={['#fff6e0', '#2a2018', 0.5]} />
        {/* key light — warm, casts the soft shadows */}
        <directionalLight
          position={[5, 12, 6]}
          intensity={1.85}
          color="#fff3d6"
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-radius={7}
          shadow-bias={-0.0002}
          shadow-camera-left={-6.5}
          shadow-camera-right={6.5}
          shadow-camera-top={6.5}
          shadow-camera-bottom={-6.5}
        />
        {/* cool rim light from behind for separation */}
        <directionalLight position={[-7, 6, -6]} intensity={0.45} color="#bcd0ff" />
        {/* gold spotlight glinting off the pieces */}
        <spotLight position={[-3, 9, 4]} angle={0.5} penumbra={0.8} intensity={0.7} color="#E8C766" />
        <Suspense fallback={null}>
          <Scene {...props} />
        </Suspense>
      </Canvas>

      {/* Promotion picker (HTML overlay above the canvas) */}
      <AnimatePresence>
        {promotion && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-20 flex items-center justify-center"
            style={{ backgroundColor: 'rgba(0,0,0,0.65)' }}
            onClick={promotion.onCancel}
          >
            <motion.div
              initial={{ scale: 0.8, y: 10 }} animate={{ scale: 1, y: 0 }}
              className="flex gap-2 p-3 rounded-2xl"
              style={{ backgroundColor: theme.panel, border: `2px solid ${theme.gold}`, backdropFilter: 'blur(8px)' }}
              onClick={e => e.stopPropagation()}
            >
              {(['q', 'r', 'b', 'n'] as PieceSymbol[]).map(t => (
                <button key={t} onClick={() => promotion.onPick(t)}
                        className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl flex items-center justify-center text-4xl sm:text-5xl transition-transform hover:scale-110"
                        style={{ backgroundColor: theme.light }}>
                  <PieceGlyph type={t} color={promotion.color} theme={theme} sizePct={100} />
                </button>
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

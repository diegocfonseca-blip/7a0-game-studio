import { useMemo, useRef, Suspense } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { AnimatePresence, motion } from 'framer-motion'
import type { Color, PieceSymbol, Square } from 'chess.js'
import type { BoardTheme } from './themes'
import type { PieceInst } from './engine'
import { PieceGlyph } from './Board'

// ── Real 3D board: WebGL via three.js ────────────────────────────────────
// Pieces are lathe-turned solids (like physical chess pieces), the board is
// a framed block with soft shadows and a fixed "sitting at the table" camera.

const FILES = 'abcdefgh'

function squareToWorld(square: string): [number, number] {
  const f = FILES.indexOf(square[0])
  const r = Number(square[1]) - 1
  return [f - 3.5, 3.5 - r]   // x, z (white at +z, near the camera)
}

// ── Piece geometries (lathe profiles, unit = square size 1) ──────────────
function lathe(points: Array<[number, number]>, segments = 28): THREE.LatheGeometry {
  const g = new THREE.LatheGeometry(points.map(([x, y]) => new THREE.Vector2(x, y)), segments)
  g.computeVertexNormals()
  return g
}

function usePieceGeometries() {
  return useMemo(() => {
    const pawn = lathe([
      [0, 0], [0.30, 0], [0.30, 0.06], [0.20, 0.14], [0.13, 0.28],
      [0.11, 0.40], [0.17, 0.46], [0.11, 0.52], [0.16, 0.62], [0.09, 0.74], [0, 0.78],
    ])
    const rookBody = lathe([
      [0, 0], [0.32, 0], [0.32, 0.07], [0.22, 0.16], [0.17, 0.42],
      [0.16, 0.62], [0.26, 0.66], [0.26, 0.84], [0.20, 0.84], [0, 0.84],
    ])
    const bishop = lathe([
      [0, 0], [0.31, 0], [0.31, 0.07], [0.20, 0.16], [0.13, 0.34],
      [0.11, 0.52], [0.18, 0.58], [0.12, 0.64], [0.17, 0.78], [0.10, 0.94], [0.04, 1.0], [0, 1.02],
    ])
    const queen = lathe([
      [0, 0], [0.34, 0], [0.34, 0.07], [0.22, 0.17], [0.14, 0.38],
      [0.11, 0.62], [0.19, 0.70], [0.12, 0.76], [0.22, 0.95], [0.13, 1.02], [0.05, 1.08], [0, 1.12],
    ])
    const king = lathe([
      [0, 0], [0.35, 0], [0.35, 0.07], [0.23, 0.17], [0.15, 0.40],
      [0.12, 0.66], [0.20, 0.74], [0.13, 0.80], [0.22, 1.0], [0.10, 1.08], [0, 1.10],
    ])
    const knightBase = lathe([
      [0, 0], [0.31, 0], [0.31, 0.07], [0.22, 0.15], [0.19, 0.24], [0, 0.24],
    ])
    // stylized horse head/neck, extruded
    const shape = new THREE.Shape()
    const pts: Array<[number, number]> = [
      [-0.20, 0.0], [-0.26, 0.28], [-0.18, 0.52], [-0.26, 0.64], [-0.14, 0.72],
      [-0.08, 0.88], [0.02, 0.92], [0.10, 0.82], [0.06, 0.76], [0.30, 0.66],
      [0.34, 0.56], [0.26, 0.50], [0.08, 0.50], [0.20, 0.28], [0.22, 0.0],
    ]
    shape.moveTo(pts[0][0], pts[0][1])
    for (let i = 1; i < pts.length; i++) shape.lineTo(pts[i][0], pts[i][1])
    shape.closePath()
    const knightHead = new THREE.ExtrudeGeometry(shape, {
      depth: 0.18, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.035, bevelSegments: 2, steps: 1,
    })
    knightHead.translate(0, 0.22, -0.09)
    knightHead.computeVertexNormals()

    const merlonG = new THREE.BoxGeometry(0.10, 0.10, 0.10)
    const crossV = new THREE.BoxGeometry(0.06, 0.22, 0.06)
    const crossH = new THREE.BoxGeometry(0.16, 0.06, 0.06)
    const ball = new THREE.SphereGeometry(0.06, 16, 12)

    return { pawn, rookBody, bishop, queen, king, knightBase, knightHead, merlonG, crossV, crossH, ball }
  }, [])
}

type Geos = ReturnType<typeof usePieceGeometries>

function PieceMesh({ piece, geos, theme, selected, onClick }: {
  piece: PieceInst
  geos: Geos
  theme: BoardTheme
  selected: boolean
  onClick: (sq: Square) => void
}) {
  const group = useRef<THREE.Group>(null)
  const [tx, tz] = squareToWorld(piece.square!)

  // smooth glide to target square
  useFrame(() => {
    const g = group.current
    if (!g) return
    g.position.x += (tx - g.position.x) * 0.18
    g.position.z += (tz - g.position.z) * 0.18
  })

  const color = piece.color === 'w' ? theme.whitePiece : theme.blackPiece
  const mat = useMemo(() => new THREE.MeshStandardMaterial({
    color, roughness: 0.35, metalness: 0.18,
    emissive: selected ? new THREE.Color(theme.gold) : new THREE.Color('#000000'),
    emissiveIntensity: selected ? 0.35 : 0,
  }), [color, selected, theme.gold])

  const t = piece.type
  const scale = 0.92
  return (
    <group
      ref={group}
      position={[tx, 0.13, tz]}
      scale={[scale, scale, scale]}
      onPointerDown={e => { e.stopPropagation(); onClick(piece.square as Square) }}
    >
      {t === 'p' && <mesh geometry={geos.pawn} material={mat} castShadow />}
      {t === 'r' && (
        <>
          <mesh geometry={geos.rookBody} material={mat} castShadow />
          {[0, 1, 2, 3].map(i => {
            const a = (i / 4) * Math.PI * 2 + Math.PI / 4
            return <mesh key={i} geometry={geos.merlonG} material={mat} castShadow
                         position={[Math.cos(a) * 0.19, 0.88, Math.sin(a) * 0.19]} />
          })}
        </>
      )}
      {t === 'b' && (
        <>
          <mesh geometry={geos.bishop} material={mat} castShadow />
          <mesh geometry={geos.ball} material={mat} castShadow position={[0, 1.05, 0]} />
        </>
      )}
      {t === 'q' && (
        <>
          <mesh geometry={geos.queen} material={mat} castShadow />
          <mesh geometry={geos.ball} material={mat} castShadow position={[0, 1.16, 0]} />
        </>
      )}
      {t === 'k' && (
        <>
          <mesh geometry={geos.king} material={mat} castShadow />
          <mesh geometry={geos.crossV} material={mat} castShadow position={[0, 1.22, 0]} />
          <mesh geometry={geos.crossH} material={mat} castShadow position={[0, 1.22, 0]} />
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

  return (
    <group rotation={[0, orientation === 'w' ? 0 : Math.PI, 0]}>
      {/* frame */}
      <mesh position={[0, -0.18, 0]} receiveShadow>
        <boxGeometry args={[9.0, 0.36, 9.0]} />
        <meshStandardMaterial color={theme.boardBorder} roughness={0.5} metalness={0.1} />
      </mesh>
      {/* squares */}
      {squares.map(({ sq, light, x, z }) => (
        <mesh key={sq} position={[x, 0.02, z]} receiveShadow
              onPointerDown={e => { e.stopPropagation(); click(sq) }}>
          <boxGeometry args={[1, 0.2, 1]} />
          <meshStandardMaterial color={light ? theme.light : theme.dark} roughness={0.45} metalness={0.08} />
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
        return (
          <mesh position={[x, 0.128, z]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.96, 0.96]} />
            <meshBasicMaterial color="#E8402F" transparent opacity={0.55} />
          </mesh>
        )
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
        <PieceMesh key={p.id} piece={p} geos={geos} theme={theme}
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
        shadows
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
        camera={{ position: [0, 8.2, 8.6], fov: 38 }}
        onCreated={({ camera }) => camera.lookAt(0, 0, 0.4)}
      >
        <ambientLight intensity={0.65} />
        <directionalLight
          position={[6, 12, 5]}
          intensity={1.6}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
          shadow-camera-left={-6}
          shadow-camera-right={6}
          shadow-camera-top={6}
          shadow-camera-bottom={-6}
        />
        <pointLight position={[-6, 6, -6]} intensity={0.4} />
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

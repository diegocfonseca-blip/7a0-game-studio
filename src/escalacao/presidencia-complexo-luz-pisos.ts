import * as THREE from 'three'
import type { AncoraLuzComplexo } from './presidencia-complexo-iluminacao'
import type { SolidoEntorno } from './presidencia-complexo-entorno'

type FonteFixa = Pick<AncoraLuzComplexo, 'id' | 'kind' | 'position' | 'target' | 'intensity' | 'distance' | 'angle' | 'color'>
type Bounds = { minX: number; maxX: number; minZ: number; maxZ: number }
export type AtlasLuzPiso = { floor: number; width: number; height: number; bounds: Bounds; pixels: Uint8Array; sources: number; blocked: number }
const smooth = (value: number) => value * value * (3 - 2 * value)

function blocked(source: FonteFixa, x: number, z: number, floor: number, solids: readonly SolidoEntorno[]) {
  const [sx, sy, sz] = source.position, dx = x - sx, dz = z - sz
  for (const solid of solids) {
    if (solid.base > sy || solid.top < floor + .2) continue
    const polygon = solid.footprint
    for (let i = 0; i < polygon.length; i++) {
      const a = polygon[i], b = polygon[(i + 1) % polygon.length], ex = b.x - a.x, ez = b.z - a.z
      const cross = dx * ez - dz * ex
      if (Math.abs(cross) < 1e-8) continue
      const qx = a.x - sx, qz = a.z - sz, t = (qx * ez - qz * ex) / cross, u = (qx * dz - qz * dx) / cross
      if (t <= .002 || t >= .998 || u < 0 || u > 1) continue
      const y = sy + (floor - sy) * t
      if (y >= solid.base && y <= solid.top) return true
    }
  }
  return false
}

/** Bakes only broad diffuse illumination, never a photograph or a new floor.
 * One metre per texel is enough for a 10–15 m soft footprint; the existing
 * paving maps, normals and geometric edges retain their own close-up detail. */
export function calcularAtlasLuzPisos(fontes: readonly FonteFixa[], solids: readonly SolidoEntorno[] = []): AtlasLuzPiso[] {
  const fixed = fontes.filter(source => ['street', 'station', 'bus-stop', 'entrance'].includes(source.kind)
    && source.position.every(Number.isFinite) && source.target.every(Number.isFinite) && source.position[1] > source.target[1] + .25)
  if (!fixed.length) return []
  const margin = 24, bounds = {
    minX: Math.floor(Math.min(...fixed.map(s => s.target[0])) - margin), maxX: Math.ceil(Math.max(...fixed.map(s => s.target[0])) + margin),
    minZ: Math.floor(Math.min(...fixed.map(s => s.target[2])) - margin), maxZ: Math.ceil(Math.max(...fixed.map(s => s.target[2])) + margin),
  }
  const spanX = bounds.maxX - bounds.minX, spanZ = bounds.maxZ - bounds.minZ
  const width = Math.min(1024, Math.max(64, Math.ceil(spanX))), height = Math.min(2048, Math.max(64, Math.ceil(spanZ)))
  const floors = [...new Set(fixed.map(source => Math.round(source.target[1] * 100) / 100))].sort((a, b) => a - b).slice(0, 2)
  return floors.map(floor => {
    const selected = fixed.filter(source => Math.abs(source.target[1] - floor) < .015)
    const values = new Float32Array(width * height * 3), pixels = new Uint8Array(width * height * 4)
    let shadowed = 0
    for (const source of selected) {
      const rise = source.position[1] - floor, radius = Math.min(rise * Math.tan(source.angle), Math.sqrt(Math.max(0, source.distance ** 2 - rise ** 2)), 22)
      if (!(radius > 0)) continue
      const cx = source.target[0], cz = source.target[2], color = new THREE.Color(source.color)
      const x0 = Math.max(0, Math.floor((cx - radius - bounds.minX) / spanX * width)), x1 = Math.min(width - 1, Math.ceil((cx + radius - bounds.minX) / spanX * width))
      const z0 = Math.max(0, Math.floor((cz - radius - bounds.minZ) / spanZ * height)), z1 = Math.min(height - 1, Math.ceil((cz + radius - bounds.minZ) / spanZ * height))
      const nearby = solids.filter(solid => solid.top > floor + .2 && solid.minX <= cx + radius && solid.maxX >= cx - radius && solid.minZ <= cz + radius && solid.maxZ >= cz - radius)
      for (let row = z0; row <= z1; row++) for (let col = x0; col <= x1; col++) {
        const x = bounds.minX + (col + .5) / width * spanX, z = bounds.minZ + (row + .5) / height * spanZ
        const r = Math.hypot(x - cx, z - cz), normalized = r / radius
        if (normalized >= 1) continue
        if (blocked(source, x, z, floor, nearby)) { shadowed++; continue }
        const edge = 1 - smooth(Math.max(0, Math.min(1, (normalized - .3) / .7)))
        // Irradiance uses distance and incidence; the atlas stores up to 2.0
        // linear radiance, leaving headroom where adjacent beams overlap.
        const energy = Math.min(1.65, source.intensity * .32 / (rise * rise + r * r)) * edge
        const at = (row * width + col) * 3
        values[at] += color.r * energy; values[at + 1] += color.g * energy; values[at + 2] += color.b * energy
      }
    }
    for (let i = 0; i < width * height; i++) {
      for (let c = 0; c < 3; c++) pixels[i * 4 + c] = Math.round(Math.min(1, values[i * 3 + c] / 2) * 255)
      pixels[i * 4 + 3] = 255
    }
    return { floor, width, height, bounds: { ...bounds }, pixels, sources: selected.length, blocked: shadowed }
  })
}

/** Attach to explicitly opted-in paving/asphalt materials only. World height
 * and upward normals prevent a shared paving material from illuminating a
 * wall, kerb face, building roof or another level of the transport platform. */
export function criarLuzPisosComplexo(root: THREE.Object3D, sources: readonly FonteFixa[], solids: readonly SolidoEntorno[] = []) {
  const atlases = calcularAtlasLuzPisos(sources, solids)
  const textures = atlases.map(atlas => {
    const texture = new THREE.DataTexture(atlas.pixels, atlas.width, atlas.height, THREE.RGBAFormat)
    texture.colorSpace = THREE.LinearSRGBColorSpace; texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping
    texture.minFilter = THREE.LinearMipmapLinearFilter; texture.magFilter = THREE.LinearFilter
    texture.generateMipmaps = true; texture.needsUpdate = true
    return texture
  })
  const night = { value: 0 }, originals = new Map<THREE.MeshStandardMaterial, { compile: THREE.MeshStandardMaterial['onBeforeCompile']; key: THREE.MeshStandardMaterial['customProgramCacheKey'] }>()
  const bounds = atlases[0]?.bounds
  if (bounds) root.traverse(object => {
    if (!(object instanceof THREE.Mesh)) return
    for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
      if (!(material instanceof THREE.MeshStandardMaterial) || !material.userData.complexoLightFloor || originals.has(material)) continue
      const compile = material.onBeforeCompile, key = material.customProgramCacheKey
      originals.set(material, { compile, key })
      material.onBeforeCompile = (shader, renderer) => {
        compile.call(material, shader, renderer)
        shader.uniforms.complexoFloorNight = night
        shader.uniforms.complexoFloorBounds = { value: new THREE.Vector4(bounds.minX, bounds.minZ, bounds.maxX - bounds.minX, bounds.maxZ - bounds.minZ) }
        const uniforms = atlases.map((atlas, i) => {
          shader.uniforms[`complexoFloorAtlas${i}`] = { value: textures[i] }
          shader.uniforms[`complexoFloorHeight${i}`] = { value: atlas.floor }
          return `uniform sampler2D complexoFloorAtlas${i}; uniform float complexoFloorHeight${i};`
        }).join('\n')
        shader.vertexShader = shader.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vComplexoFloorWorld; varying float vComplexoFloorUp;')
          .replace('#include <worldpos_vertex>', `#include <worldpos_vertex>
            vComplexoFloorWorld=(modelMatrix*vec4(transformed,1.0)).xyz;
            vComplexoFloorUp=(mat3(modelMatrix)*normal).y;`)
        shader.fragmentShader = shader.fragmentShader.replace('#include <common>', `#include <common>
          varying vec3 vComplexoFloorWorld; varying float vComplexoFloorUp;
          uniform float complexoFloorNight; uniform vec4 complexoFloorBounds; ${uniforms}`)
          .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
            vec2 floorUv=(vComplexoFloorWorld.xz-complexoFloorBounds.xy)/complexoFloorBounds.zw;
            float floorInside=step(0.0,floorUv.x)*step(floorUv.x,1.0)*step(0.0,floorUv.y)*step(floorUv.y,1.0)*step(0.9,vComplexoFloorUp)*complexoFloorNight;
            ${atlases.map((atlas, i) => `totalEmissiveRadiance+=texture2D(complexoFloorAtlas${i},floorUv).rgb*2.0*diffuseColor.rgb*floorInside*(1.0-smoothstep(${atlas.floor<.5?'0.20,0.26':'0.035,0.09'},abs(vComplexoFloorWorld.y-complexoFloorHeight${i})));`).join('\n')}`)
      }
      material.customProgramCacheKey = () => `${key.call(material)}:complexo-floor-light-${atlases.length}`
      material.needsUpdate = true
    }
  })
  let disposed = false
  return {
    setNight(value: boolean) { if (!disposed) night.value = value ? 1 : 0 },
    inspect: () => ({ night: night.value === 1, materials: originals.size, layers: atlases.map(({ floor, width, height, sources, blocked }) => ({ floor, width, height, sources, blocked })), textureBytes: atlases.reduce((sum, atlas) => sum + atlas.pixels.byteLength, 0) }),
    dispose() {
      if (disposed) return; disposed = true
      for (const [material, original] of originals) { material.onBeforeCompile = original.compile; material.customProgramCacheKey = original.key; material.needsUpdate = true }
      textures.forEach(texture => texture.dispose()); originals.clear()
    },
  }
}

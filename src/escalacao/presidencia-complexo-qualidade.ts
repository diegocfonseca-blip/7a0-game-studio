import * as THREE from 'three'

export type CapacidadeVisualComplexo = {
  width: number
  height: number
  devicePixelRatio: number
  coarsePointer: boolean
  /** Optional browser hint. Absence is not evidence of a low-memory device. */
  deviceMemory?: number
  maxTextureSize?: number
  maxAnisotropy?: number
}

const positive = (value: number | undefined, fallback: number) =>
  Number.isFinite(value) && value! > 0 ? value! : fallback

/** A bounded drawing buffer, independent of the camera, match clock and scene.
 * Enlarging the map should spend available pixels on geometry and texturing;
 * it must not allocate a native-DPR 4K buffer on every phone or desktop. */
export function calcularQualidadeComplexo(input: CapacidadeVisualComplexo) {
  const width = Math.max(1, positive(input.width, 1))
  const height = Math.max(1, positive(input.height, 1))
  const constrained = positive(input.deviceMemory, Infinity) <= 2
  const pixelBudget = constrained ? 1_800_000 : input.coarsePointer ? 2_500_000 : 4_000_000
  const maxPixelRatio = constrained ? 1.75 : input.coarsePointer ? 2.5 : 2
  const textureLimit = Math.max(1, Math.floor(positive(input.maxTextureSize, 4096)))
  const pixelRatio = Math.min(
    positive(input.devicePixelRatio, 1), maxPixelRatio,
    Math.sqrt(pixelBudget / (width * height)), textureLimit / width, textureLimit / height,
  )
  const anisotropy = Math.min(constrained ? 2 : 8, Math.max(1, Math.floor(positive(input.maxAnisotropy, 1))))
  return {
    pixelRatio, pixelBudget, maxPixelRatio, anisotropy, constrained,
    drawingWidth: Math.max(1, Math.floor(width * pixelRatio)),
    drawingHeight: Math.max(1, Math.floor(height * pixelRatio)),
  }
}

const surfaceMaps = ['map', 'alphaMap', 'bumpMap', 'normalMap', 'roughnessMap',
  'metalnessMap', 'emissiveMap', 'aoMap', 'lightMap'] as const

/** Preserve metre-based UVs and every texture's colour/filter choices. Oblique
 * roads, grass and concrete benefit from anisotropic sampling; reflection and
 * shadow render targets, nearest-filtered art and video textures do not enter
 * this pass. Call after constructing or replacing scene materials, not per frame. */
export function aplicarQualidadeTexturasComplexo(root: THREE.Object3D, maximum: number) {
  const anisotropy = Math.max(1, Math.min(16, Math.floor(positive(maximum, 1))))
  const materials = new Set<THREE.Material>(), textures = new Set<THREE.Texture>()
  root.traverse(node => {
    const material = (node as THREE.Mesh).material
    if (!material) return
    for (const item of Array.isArray(material) ? material : [material]) materials.add(item)
  })
  for (const material of materials) for (const key of surfaceMaps) {
    const texture = (material as unknown as Record<string, unknown>)[key]
    if (!(texture instanceof THREE.Texture) || texture.mapping !== THREE.UVMapping ||
      texture.isRenderTargetTexture || texture instanceof THREE.VideoTexture ||
      texture.magFilter !== THREE.LinearFilter ||
      (texture.minFilter !== THREE.LinearMipmapLinearFilter && texture.minFilter !== THREE.LinearMipmapNearestFilter)) continue
    textures.add(texture)
  }
  let updated = 0
  for (const texture of textures) if (texture.anisotropy !== anisotropy) {
    texture.anisotropy = anisotropy
    texture.needsUpdate = true
    updated++
  }
  return { anisotropy, textures: textures.size, updated }
}

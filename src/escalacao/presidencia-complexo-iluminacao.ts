import * as THREE from 'three'
import type { EstadoComplexo } from './presidencia-complexo-model'
import type { SolidoEntorno } from './presidencia-complexo-entorno'
import { criarLuzPisosComplexo } from './presidencia-complexo-luz-pisos'

export type PeriodoLuzComplexo = 'day' | 'night'
export type AncoraLuzComplexo = {
  id: string
  kind: 'street' | 'station' | 'bus-stop' | 'entrance' | 'headlight' | 'cabin' | 'roof' | 'tower'
  /** Coordinates are local to the object carrying complexoLights. */
  position: [number, number, number]
  target: [number, number, number]
  color: string
  intensity: number
  distance: number
  angle: number
  /** A moving vehicle may disable its beam without removing its physical lamp. */
  enabled?: boolean
}
export type EmissaoNoturnaComplexo = { color: string; intensity: number; dayIntensity?: number; stadium?:boolean }
type Fonte = { owner: THREE.Object3D; spec: AncoraLuzComplexo; position: THREE.Vector3; target: THREE.Vector3 }

const isVisible = (object: THREE.Object3D) => {
  for (let node: THREE.Object3D | null = object; node; node = node.parent) if (!node.visible) return false
  return true
}

/** Physical sources share a small, fixed budget of real lights. Distant lamps
 * and windows remain emissive; zoom brings local light onto people and paving.
 * This controller never creates a stadium purchase, changes an actor pose or
 * advances a clock. Source geometry belongs to the corresponding building. */
export function criarIluminacaoComplexo({ scene, state, sun, hemisphere, solids = [] }: {
  scene: THREE.Scene; state: EstadoComplexo; sun: THREE.DirectionalLight; hemisphere: THREE.HemisphereLight; solids?: readonly SolidoEntorno[]
}) {
  const root = new THREE.Group(); root.name = 'complexo-iluminacao'; scene.add(root)
  const original = {
    sky: scene.background instanceof THREE.Color ? scene.background.clone() : scene.background,
    fog: scene.fog?.color.clone(), environmentIntensity: scene.environmentIntensity,
    sunColor: sun.color.clone(), sunIntensity: sun.intensity,
    skyColor: hemisphere.color.clone(), groundColor: hemisphere.groundColor.clone(), ambientIntensity: hemisphere.intensity,
  }
  const materials = new Map<THREE.MeshStandardMaterial, { color: THREE.Color; intensity: number; spec: EmissaoNoturnaComplexo }>()
  let period: PeriodoLuzComplexo = 'day', sources: Fonte[] = [], disposed = false
  const makeLamp = (name: string, shadows: boolean) => {
    const light = new THREE.SpotLight('#fff0ce', 0, 30, .75, .65, 2)
    light.name = name; light.castShadow = shadows; light.visible = false
    light.shadow.mapSize.set(shadows ? 1024 : 512, shadows ? 1024 : 512); light.shadow.camera.near = .1
    light.shadow.normalBias = shadows ? .018 : .01; light.shadow.bias = -.000025
    root.add(light, light.target)
    return light
  }
  // Four broad floodlights cover the whole metric pitch, from the actual tower
  // fixtures or (under the retractable roof) its real underside luminaires.
  const stadiumLights = Array.from({ length: 4 }, (_, i) => makeLamp(`refletor-noturno-${i + 1}`, true))
  const localLights = Array.from({ length: 4 }, (_, i) => makeLamp(`luz-local-${i + 1}`, false))
  let activeLocal: string[] = [], activeStadium: string[] = []
  const applyEmission = () => {
    for (const [material, before] of materials) {
      const lit=period==='night'||(before.spec.stadium===true&&state.roofClosed&&state.floodlit)
      if (lit) material.emissive.set(before.spec.color)
      else material.emissive.copy(before.color)
      material.emissiveIntensity = lit ? before.spec.intensity : before.spec.dayIntensity ?? before.intensity
    }
  }
  function refreshSources() {
    if (disposed) return
    sources = []
    const retained = new Set<THREE.MeshStandardMaterial>()
    scene.traverse(object => {
      const anchors = object.userData.complexoLights as AncoraLuzComplexo[] | undefined
      if (Array.isArray(anchors)) for (const spec of anchors) {
        if (![...spec.position, ...spec.target, spec.intensity, spec.distance, spec.angle].every(Number.isFinite)) continue
        sources.push({ owner: object, spec, position: new THREE.Vector3(), target: new THREE.Vector3() })
      }
      if (!(object instanceof THREE.Mesh)) return
      for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
        if (!(material instanceof THREE.MeshStandardMaterial)) continue
        const spec = material.userData.complexoNightEmission as EmissaoNoturnaComplexo | undefined
        if (!spec) continue
        retained.add(material)
        if (!materials.has(material)) materials.set(material, { color: material.emissive.clone(), intensity: material.emissiveIntensity, spec })
      }
    })
    // Populations may be rebuilt independently. Do not retain disposed rigs.
    for (const [material, before] of materials) if (!retained.has(material)) {
      material.emissive.copy(before.color); material.emissiveIntensity = before.intensity; materials.delete(material)
    }
    applyEmission()
  }
  function setPeriod(next: PeriodoLuzComplexo) {
    if (disposed) return
    period = next
    const night = next === 'night'
    if (scene.background instanceof THREE.Color) scene.background.copy(night ? new THREE.Color('#101d32') : original.sky instanceof THREE.Color ? original.sky : new THREE.Color('#cbd2cd'))
    if (scene.fog && original.fog) scene.fog.color.copy(night ? new THREE.Color('#101d32') : original.fog)
    sun.color.copy(night ? new THREE.Color('#b4cafa') : original.sunColor); sun.intensity = night ? .36 : original.sunIntensity
    hemisphere.color.copy(night ? new THREE.Color('#8baddc') : original.skyColor)
    hemisphere.groundColor.copy(night ? new THREE.Color('#4b465d') : original.groundColor)
    hemisphere.intensity = night ? .46 : original.ambientIntensity
    scene.environmentIntensity = night ? .08 : original.environmentIntensity
    floorLighting.setNight(night)
    applyEmission()
    if (!night) {
      for (const light of [...stadiumLights, ...localLights]) { light.intensity = 0; light.visible = false }
      activeLocal = []; activeStadium = []
    }
  }
  const place = (light: THREE.SpotLight, source?: Fonte) => {
    if (!source) { light.intensity = 0; light.visible = false; return }
    light.visible = true
    light.position.copy(source.position); light.target.position.copy(source.target)
    light.color.set(source.spec.color); light.intensity = source.spec.intensity
    light.distance = source.spec.distance; light.angle = source.spec.angle
    light.shadow.camera.far = source.spec.distance
    light.updateMatrixWorld(); light.target.updateMatrixWorld()
  }
  function update(camera: THREE.PerspectiveCamera, target: THREE.Vector3) {
    // Closing an owned roof also removes daylight from the pitch. Only the
    // purchased stadium lamps come on; the city remains in its daytime state.
    if (disposed || (period !== 'night' && !(state.roofClosed&&state.floodlit))) return
    applyEmission()
    scene.updateMatrixWorld(true)
    const visible = sources.filter(source => {
      if (source.spec.enabled === false || !isVisible(source.owner)) return false
      source.position.fromArray(source.spec.position).applyMatrix4(source.owner.matrixWorld)
      source.target.fromArray(source.spec.target).applyMatrix4(source.owner.matrixWorld)
      return true
    })
    const stadium = state.floodlit ? visible.filter(source => source.spec.kind === (state.roofBuilt ? 'roof' : 'tower')).slice(0, 4) : []
    activeStadium = stadium.map(source => source.spec.id)
    stadiumLights.forEach((light, i) => place(light, stadium[i]))
    if(period!=='night'){
      activeLocal=[];localLights.forEach(light=>place(light));return
    }
    const direction = new THREE.Vector3(), focus = new THREE.Vector3()
    const score = (source: Fonte) => {
      const length = focus.copy(target).sub(source.position).length()
      const alignment = direction.copy(source.target).sub(source.position).normalize().dot(focus.normalize())
      const reachesFocus = length <= source.spec.distance && alignment > Math.cos(source.spec.angle)
      // A roof lamp outside the observed doorway must not steal the slot from
      // the real cabin lamp whose cone actually covers the passenger's body.
      return (reachesFocus ? 0 : 1e6) + Math.min(source.position.distanceToSquared(target), source.position.distanceToSquared(camera.position) * 1.6)
    }
    const nearby = visible.filter(source => source.spec.kind !== 'tower' && source.spec.kind !== 'roof')
      .sort((a, b) => score(a) - score(b)).slice(0, localLights.length)
    activeLocal = nearby.map(source => source.spec.id)
    let cabinShadows = 0
    localLights.forEach((light, i) => {
      light.castShadow = nearby[i]?.spec.kind === 'cabin' && cabinShadows++ < 2
      place(light, nearby[i])
    })
  }
  refreshSources()
  scene.updateMatrixWorld(true)
  const fixedSources = sources.filter(source => source.spec.kind !== 'headlight' && source.spec.kind !== 'cabin').map(source => ({
    ...source.spec,
    position: new THREE.Vector3().fromArray(source.spec.position).applyMatrix4(source.owner.matrixWorld).toArray() as [number, number, number],
    target: new THREE.Vector3().fromArray(source.spec.target).applyMatrix4(source.owner.matrixWorld).toArray() as [number, number, number],
  }))
  const floorLighting = criarLuzPisosComplexo(scene, fixedSources, solids)
  return {
    setPeriod, update, refreshSources,
    inspect: () => ({ period, sources: sources.length, emissiveMaterials: materials.size, activeStadium: [...activeStadium], activeLocal: [...activeLocal], localBudget: localLights.length, stadiumBudget: stadiumLights.length, dynamicCabinShadows: localLights.filter(light => light.visible && light.castShadow).length, floorLighting: floorLighting.inspect(), actualFloodlightsPurchased: state.floodlit }),
    dispose() {
      if (disposed) return
      setPeriod('day'); disposed = true
      floorLighting.dispose()
      for (const [material, before] of materials) { material.emissive.copy(before.color); material.emissiveIntensity = before.intensity }
      materials.clear(); sources = []
      for (const light of [...stadiumLights, ...localLights]) { light.shadow.map?.dispose(); light.dispose() }
      root.removeFromParent(); root.clear()
    },
  }
}

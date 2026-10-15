import * as THREE from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'

/** Primeiro trecho de avaliação. Não substitui ainda as etapas do estádio. */
export type SolidoBairro = {
  id: string
  minX: number
  maxX: number
  minZ: number
  maxZ: number
  base: number
  top: number
}

/** Metros, Y para cima. O piso da calçada e do estabelecimento é contínuo. */
export const PISO_BAIRRO_3D = 0.16

export function criarCenarioBairro(scene: THREE.Scene) {
  const root = new THREE.Group()
  root.name = 'bairro-volumetrico'
  scene.add(root)
  const solids: SolidoBairro[] = []
  const textures: THREE.Texture[] = []
  const materials: THREE.MeshStandardMaterial[] = []
  const batches = new Map<THREE.Material, THREE.BufferGeometry[]>()
  let randomSeed = 49271
  const random = () => {
    randomSeed = (Math.imul(randomSeed, 1664525) + 1013904223) >>> 0
    return randomSeed / 4294967296
  }

  // Grão de material, não uma imagem de cenário: luz e sombras continuam 3D.
  function grain(amount: number, frequency: number) {
    const size = 128
    const pixels = new Uint8Array(size * size * 4)
    for (let i = 0; i < pixels.length; i += 4) {
      const value = 255 - Math.round(random() * amount)
      pixels[i] = pixels[i + 1] = pixels[i + 2] = value
      pixels[i + 3] = 255
    }
    const texture = new THREE.DataTexture(pixels, size, size)
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping
    texture.magFilter = THREE.LinearFilter
    texture.minFilter = THREE.LinearMipmapLinearFilter
    texture.generateMipmaps = true
    texture.repeat.set(frequency, frequency)
    texture.colorSpace = THREE.SRGBColorSpace
    texture.needsUpdate = true
    textures.push(texture)
    return texture
  }
  const stoneGrain = grain(36, 1.7)
  const asphaltGrain = grain(80, 3)
  const woodGrain = grain(25, 5)
  function relief(kind: 'stone' | 'asphalt' | 'wood') {
    const size = 128
    const pixels = new Uint8Array(size * size * 4)
    const hash = (x: number, y: number) => {
      let seed = Math.imul(x + 137, 374761393) + Math.imul(y + 719, 668265263)
      seed = Math.imul(seed ^ seed >>> 13, 1274126177)
      return ((seed ^ seed >>> 16) >>> 0) / 4294967296
    }
    const noise = (x: number, y: number) => {
      const ix = Math.floor(x), iy = Math.floor(y)
      let dx = x - ix, dy = y - iy
      dx = dx * dx * (3 - 2 * dx)
      dy = dy * dy * (3 - 2 * dy)
      const a = hash(ix, iy) * (1 - dx) + hash(ix + 1, iy) * dx
      const b = hash(ix, iy + 1) * (1 - dx) + hash(ix + 1, iy + 1) * dx
      return a * (1 - dy) + b * dy
    }
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      const detail = kind === 'wood'
        ? .45 + .17 * Math.sin(x * .43 + noise(x / 36, y / 20) * 8) + .14 * noise(x / 2, y / 26)
        : .25 + noise(x / 3.5, y / 3.5) * .43 + noise(x / 17, y / 17) * .18 + hash(x, y) * .14
      const value = Math.round(detail * 255)
      const index = (y * size + x) * 4
      pixels[index] = pixels[index + 1] = pixels[index + 2] = value
      pixels[index + 3] = 255
    }
    const texture = new THREE.DataTexture(pixels, size, size)
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping
    texture.magFilter = THREE.LinearFilter
    texture.minFilter = THREE.LinearMipmapLinearFilter
    texture.generateMipmaps = true
    texture.repeat.set(kind === 'wood' ? 1.1 : kind === 'asphalt' ? 2.6 : 1.8, kind === 'wood' ? 1.1 : kind === 'asphalt' ? 2.6 : 1.8)
    texture.colorSpace = THREE.NoColorSpace
    texture.anisotropy = 4
    texture.needsUpdate = true
    textures.push(texture)
    return texture
  }
  const stoneRelief = relief('stone')
  const asphaltRelief = relief('asphalt')
  const woodRelief = relief('wood')
  function material(color: THREE.ColorRepresentation, roughness = 0.86, map?: THREE.Texture, metalness = 0) {
    const result = new THREE.MeshStandardMaterial({ color, roughness, metalness, map: map ?? null })
    // Rugosidade física em metros: acompanha a luz ao aproximar a câmera.
    if (map) {
      result.bumpMap = map === asphaltGrain ? asphaltRelief : map === woodGrain ? woodRelief : stoneRelief
      result.bumpScale = map === asphaltGrain ? .008 : map === woodGrain ? .0035 : .005
    }
    materials.push(result)
    return result
  }
  const terrain = material('#8c836d', 1, stoneGrain)
  const asphalt = material('#363c42', 0.9, asphaltGrain)
  const curb = material('#cbc9bf', 0.93, stoneGrain)
  const mortar = material('#aca99f', 1, stoneGrain)
  const pavers = ['#d0c9bd', '#c9c4ba', '#d5cfc3', '#c7c3b9'].map(c => material(c, 0.92, stoneGrain))
  // A referência tem concreto claro; o calor vem da luz, não de tinta dourada.
  const facade = material('#dddcd3', 0.86, stoneGrain)
  const concrete = material('#c8c9c4', 0.93, stoneGrain)
  const trim = material('#d8d9d4', 0.79, stoneGrain)
  const roof = material('#74828e', 0.67, stoneGrain, .06)
  roof.bumpScale = .001
  const paint = material('#e7e4d8', 0.92)
  const yellow = material('#d2ad4b', 0.9)
  const metal = material('#343b3e', 0.48, undefined, 0.5)
  const bronze = material('#686154', 0.43, undefined, 0.6)
  const awning = material('#424c55', 0.64, undefined, 0.18)
  const wood = material('#916b43', 0.85, woodGrain)
  const darkWood = material('#5c4732', 0.94, woodGrain)
  const interior = material('#c5aa79', 0.96, stoneGrain)
  const interiorFloor = material('#c6b89c', 0.95, stoneGrain)
  const soil = material('#61533b', 1, stoneGrain)
  const bark = material('#665740', 1, stoneGrain)
  const foliage = ['#284b26', '#436d2d', '#65833c'].map(c => material(c, 0.94))
  const bottle = material('#374f38', 0.3)
  const paleCeramic = material('#e8dfc4', 0.54)
  const glass = material('#aebfc0', 0.16, undefined, 0.05)
  glass.transparent = true
  glass.opacity = 0.31
  glass.depthWrite = false
  glass.side = THREE.DoubleSide

  // Uma malha por material. Todas as peças continuam com volume real.
  function add(geometry: THREE.BufferGeometry, mat: THREE.Material, x: number, y: number, z: number, rotationY = 0) {
    geometry.rotateY(rotationY)
    geometry.translate(x, y, z)
    const position = geometry.getAttribute('position')
    const normal = geometry.getAttribute('normal')
    const uv = geometry.getAttribute('uv')
    if (uv && normal) {
      for (let i = 0; i < position.count; i++) {
        const nx = Math.abs(normal.getX(i)), ny = Math.abs(normal.getY(i)), nz = Math.abs(normal.getZ(i))
        if (ny >= nx && ny >= nz) uv.setXY(i, position.getX(i), position.getZ(i))
        else if (nx >= nz) uv.setXY(i, position.getZ(i), position.getY(i))
        else uv.setXY(i, position.getX(i), position.getY(i))
      }
    }
    const flattened = geometry.index ? geometry.toNonIndexed() : geometry
    if (flattened !== geometry) geometry.dispose()
    const list = batches.get(mat) ?? []
    list.push(flattened)
    batches.set(mat, list)
  }
  function box(mat: THREE.Material, x: number, y: number, z: number, w: number, h: number, d: number, rotationY = 0) {
    add(new THREE.BoxGeometry(w, h, d), mat, x, y, z, rotationY)
  }
  function bevel(mat: THREE.Material, x: number, y: number, z: number, w: number, h: number, d: number, radius = .015) {
    add(new RoundedBoxGeometry(w, h, d, 1, Math.min(radius, w * .24, h * .24, d * .24)), mat, x, y, z)
  }
  function paver(mat: THREE.Material, x: number, z: number) {
    // Chanfro superior de 3 mm mantém exatamente o contato do pé em Y=.16.
    const w = .59, d = .365, inset = .007
    const geometry = new THREE.BufferGeometry()
    const positions: number[] = []
    for (const [y, cut] of [[-.005, 0], [.002, 0], [.005, inset]]) {
      for (const [dx, dz] of [[-w, -d], [w, -d], [w, d], [-w, d]])
        positions.push(dx - Math.sign(dx) * cut, y, dz - Math.sign(dz) * cut)
    }
    const indices = [0, 1, 2, 0, 2, 3, 8, 10, 9, 8, 11, 10]
    for (let ring = 0; ring < 2; ring++) for (let i = 0; i < 4; i++) {
      const a = ring * 4 + i, b = ring * 4 + (i + 1) % 4
      indices.push(a, b + 4, b, a, a + 4, b + 4)
    }
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(new Array(24).fill(0), 2))
    geometry.setIndex(indices)
    const flat = geometry.toNonIndexed()
    geometry.dispose()
    flat.computeVertexNormals()
    add(flat, mat, x, .155, z)
  }
  function cylinder(mat: THREE.Material, x: number, y: number, z: number, top: number, bottom: number, h: number, segments = 10) {
    add(new THREE.CylinderGeometry(top, bottom, h, segments), mat, x, y, z)
  }
  function solid(id: string, x: number, z: number, w: number, d: number, base: number, top: number) {
    solids.push({ id, minX: x - w / 2, maxX: x + w / 2, minZ: z - d / 2, maxZ: z + d / 2, base, top })
  }
  function wall(id: string, mat: THREE.Material, x: number, y: number, z: number, w: number, h: number, d: number) {
    if (id.startsWith('fachada')) bevel(mat, x, y, z, w, h, d, .018)
    else box(mat, x, y, z, w, h, d)
    solid(id, x, z, w, d, y - h / 2, y + h / 2)
  }

  // Estrada tem 8 m / duas faixas; laterais continuam além do enquadramento.
  box(terrain, 0, -0.16, 0, 600, 0.2, 600)
  box(asphalt, 0, -0.04, 9, 200, 0.08, 8)
  box(mortar, 0, 0.075, 1.5, 200, 0.15, 7)
  box(mortar, 0, 0.075, 16, 200, 0.15, 6)
  box(interiorFloor, 0, 0.08, -7, 16, 0.16, 10)
  box(mortar, 0, 0.075, -7, 42, 0.15, 10)
  // Juntas modeladas somente no trecho próximo; o fundo usa o mesmo material.
  for (let x = -33; x < 33; x += 1.2) {
    for (let row = 0; row < 9; row++) {
      const mat = pavers[(row + Math.round((x + 33) / 1.2)) % pavers.length]
      if (Math.abs(x) < 15) paver(mat, x + (row % 2) * .6, -1.62 + row * .75)
      else box(mat, x + (row % 2) * 0.6, 0.155, -1.62 + row * 0.75, 1.18, 0.01, 0.73)
    }
    for (let row = 0; row < 7; row++) {
      box(pavers[(row + 1) % pavers.length], x + (row % 2) * 0.6,
        0.155, 13.62 + row * 0.75, 1.18, 0.01, 0.73)
    }
  }
  for (const z of [4.9, 13.1]) {
    box(curb, 0, 0.075, z, 200, 0.15, 0.22)
    box(asphalt, 0, 0.003, z + (z < 9 ? 0.22 : -0.22), 200, 0.006, 0.18)
  }
  for (let x = -96; x < 100; x += 7) box(yellow, x, 0.006, 9, 3.4, 0.008, 0.1)
  for (const z of [5.55, 12.45]) box(paint, 0, 0.006, z, 200, 0.008, 0.08)
  for (let z = 5.65; z < 12.7; z += 0.94) box(paint, 31, 0.008, z, 3.8, 0.008, 0.46)
  for (const x of [-22, 18, 46]) {
    box(metal, x, 0.014, 5.31, 0.72, 0.025, 0.36)
    for (let i = 0; i < 7; i++) box(asphalt, x - 0.3 + i * 0.1, 0.03, 5.31, 0.044, 0.016, 0.29)
  }

  // Loja/bar: fachada +Z. O vão x[-1,25;1,25] fica aberto de verdade.
  wall('parede-fundo', interior, 0, 2.5, -11.83, 16, 4.68, 0.34)
  wall('parede-esquerda', facade, -7.83, 2.5, -7, 0.34, 4.68, 10)
  wall('parede-direita', facade, 7.83, 2.5, -7, 0.34, 4.68, 10)
  wall('fachada-acima-porta', roof, 0, 3.83, -2.12, 16, 1.94, 0.38)
  for (const side of [-1, 1]) {
    wall(`fachada-pilar-porta-${side}`, concrete, side * 1.49, 1.51, -2.08, 0.48, 2.7, 0.48)
    wall(`fachada-pilar-canto-${side}`, concrete, side * 7.65, 1.51, -2.08, 0.7, 2.7, 0.48)
    wall(`fachada-base-vitrine-${side}`, concrete, side * 4.59, 0.255, -2.08, 5.69, 0.19, 0.4)
    box(glass, side * 4.59, 1.59, -1.99, 5.69, 2.48, 0.04)
    solid(`vitrine-${side}`, side * 4.59, -1.99, 5.69, 0.08, 0.35, 2.86)
    for (const dx of [-2.83, 0, 2.83]) bevel(metal, side * 4.59 + dx, 1.59, -1.96, 0.045, 2.54, 0.07, .006)
    for (const y of [0.35, 2.84]) bevel(metal, side * 4.59, y, -1.96, 5.72, 0.045, 0.07, .006)
    // Batente estreito e folha recolhida para dentro, fora do corredor central.
    box(bronze, side * 1.245, 1.49, -2.08, 0.045, 2.65, 0.09)
    box(glass, side * 1.38, 1.45, -2.75, 0.04, 2.54, 1.2)
    box(bronze, side * 1.38, 1.45, -3.34, 0.065, 2.54, 0.055)
    for (const y of [0.2, 2.7]) box(bronze, side * 1.38, y, -2.75, 0.065, 0.05, 1.23)
    box(bronze, side * 1.31, 1.3, -3.11, 0.045, 0.38, 0.05)
    solid(`porta-aberta-${side}`, side * 1.38, -2.75, 0.08, 1.23, 0.16, 2.73)
  }
  box(bronze, 0, 2.81, -2.05, 2.5, 0.07, 0.1)
  // Faixa reta grafite e pingadeira fina, como nos estabelecimentos da arte.
  // Sem o toldo verde e os frisos clássicos da primeira prova de volume.
  bevel(awning, 0, 3.14, -1.31, 16.45, 0.19, 2.24)
  bevel(awning, 0, 2.99, -0.2, 16.45, 0.26, 0.1, .012)
  box(metal, 0, 3.255, -0.2, 16.5, 0.035, 0.12)
  for (const x of [-5.3, 5.3]) box(metal, x, 3.83, -1.921, 0.018, 1.88, 0.012)
  wall('laje', roof, 0, 4.84, -7, 16.35, 0.24, 10.35)
  for (const x of [-8, 8]) box(roof, x, 5.16, -7, 0.24, 0.42, 10.35)
  for (const z of [-12.05, -1.95]) box(roof, 0, 5.16, z, 16, 0.42, 0.24)
  for (const x of [-8, 8]) box(trim, x, 5.39, -7, 0.24, 0.04, 10.42)
  for (const z of [-12.05, -1.95]) box(trim, 0, 5.39, z, 16.35, 0.04, 0.24)
  // Elementos de cobertura e área de serviço, sem atravessar o teto.
  box(metal, -4.6, 5.26, -9.3, 1.5, 0.6, 1.1)
  for (let i = 0; i < 7; i++) box(roof, -4.6, 5.0 + i * 0.07, -8.735, 1.34, 0.028, 0.035)
  cylinder(metal, 5.4, 5.44, -9.7, 0.2, 0.2, 0.95)
  cylinder(roof, 5.4, 5.93, -9.7, 0.28, 0.28, 0.1)

  // Interior mobiliado nas laterais; x=0 até z=-6 continua transitável.
  wall('balcao', darkWood, 3.9, 0.73, -7.5, 4.8, 1.14, 1.1)
  box(interiorFloor, 3.9, 1.33, -7.5, 4.95, 0.12, 1.25)
  for (let x = 1.6; x < 6.3; x += 0.25) box(wood, x, 0.75, -6.935, 0.055, 0.86, 0.035)
  for (const y of [1.25, 2.05, 2.85]) {
    box(wood, 3.6, y, -11.43, 5.6, 0.1, 0.43)
    for (let x = 1.2; x < 6.3; x += 0.52) {
      cylinder(bottle, x, y + 0.22, -11.43, 0.066, 0.085, 0.33, 8)
      cylinder(bottle, x, y + 0.43, -11.43, 0.027, 0.035, 0.11, 8)
    }
  }
  for (const x of [2.2, 4, 5.8]) {
    cylinder(metal, x, 0.49, -5.92, 0.045, 0.055, 0.66)
    cylinder(darkWood, x, 0.88, -5.92, 0.25, 0.25, 0.12)
    cylinder(metal, x, 0.22, -5.92, 0.27, 0.29, 0.08)
    solid(`banqueta-${x}`, x, -5.92, 0.58, 0.58, 0.16, 0.94)
  }
  for (const z of [-5.3, -9]) {
    cylinder(metal, -4.55, 0.6, z, 0.07, 0.09, 0.88)
    cylinder(wood, -4.55, 1.08, z, 0.75, 0.75, 0.08, 20)
    solid(`mesa-${z}`, -4.55, z, 1.5, 1.5, 0.16, 1.12)
    for (const x of [-5.8, -3.3]) {
      box(darkWood, x, 0.63, z, 0.52, 0.08, 0.52)
      box(wood, x, 0.99, z - 0.23, 0.52, 0.6, 0.07)
      for (const dx of [-0.21, 0.21]) for (const dz of [-0.21, 0.21])
        box(metal, x + dx, 0.38, z + dz, 0.045, 0.44, 0.045)
      solid(`cadeira-${x}-${z}`, x, z, 0.58, 0.58, 0.16, 1.3)
    }
    cylinder(paleCeramic, -4.55, 1.18, z, 0.095, 0.07, 0.17)
  }
  // Forros luminosos discretos não geram dezenas de luzes em tempo real.
  const lamp = material('#ffdda0', 0.45)
  lamp.emissive.set('#f3c66c')
  lamp.emissiveIntensity = 0.9
  // Iluminação linear embutida, sempre acima do vão livre de 2,8 m.
  box(lamp, 0, 3.037, -0.6, 15.95, 0.015, 0.065)
  for (const x of [-4.4, 4.4]) {
    cylinder(metal, x, 3.93, -5.7, 0.02, 0.02, 1.15)
    cylinder(awning, x, 3.35, -5.7, 0.13, 0.48, 0.28, 16)
    cylinder(lamp, x, 3.205, -5.7, 0.41, 0.41, 0.025, 16)
  }

  function bench(x: number, z: number) {
    for (let i = 0; i < 5; i++) box(wood, x, 0.65, z - 0.25 + i * 0.13, 2.1, 0.07, 0.105)
    for (let i = 0; i < 4; i++) box(wood, x, 0.84 + i * 0.13, z - 0.3, 2.1, 0.1, 0.065)
    for (const dx of [-0.75, 0.75]) {
      box(metal, x + dx, 0.39, z + 0.08, 0.075, 0.45, 0.52)
      box(metal, x + dx, 0.94, z - 0.31, 0.06, 0.8, 0.065)
      box(metal, x + dx, 0.88, z + 0.02, 0.075, 0.07, 0.6)
    }
    solid(`banco-${x}-${z}`, x, z, 2.18, 0.75, 0.16, 1.32)
  }
  bench(-17, -0.57)
  bench(17, -0.57)
  bench(-20, 16.8)
  bench(18, 16.8)

  function tree(x: number, z: number, scale = 1) {
    const base = 0.16
    box(curb, x, 0.32, z, 2.7, 0.32, 2.15)
    box(soil, x, 0.485, z, 2.44, 0.025, 1.89)
    cylinder(bark, x, base + 1.75 * scale, z, 0.13 * scale, 0.22 * scale, 3.5 * scale, 9)

    function branch(start: THREE.Vector3, end: THREE.Vector3, thickness: number) {
      const direction = end.clone().sub(start)
      const geometry = new THREE.CylinderGeometry(thickness * .42, thickness, direction.length(), 7)
      geometry.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize()))
      const center = start.clone().add(end).multiplyScalar(.5)
      add(geometry, bark, center.x, center.y, center.z)
    }
    // Ramos sustentam as copas: todos começam acima da altura do pedestre.
    for (let i = 0; i < 8; i++) {
      const angle = i * 2.399 + .17
      const start = new THREE.Vector3(x, base + (2.75 + i % 3 * .2) * scale, z)
      const end = new THREE.Vector3(x + Math.sin(angle) * 1.35 * scale,
        base + (3.6 + i % 3 * .28) * scale, z + Math.cos(angle) * 1.35 * scale)
      branch(start, end, .065 * scale)
      if (i % 2 === 0) branch(end.clone().lerp(start, .35), end.clone().add(new THREE.Vector3(
        Math.cos(angle) * .4 * scale, .45 * scale, -Math.sin(angle) * .4 * scale)), .026 * scale)
    }

    function core(px: number, py: number, pz: number, radius: number, color: number) {
      const geometry = new THREE.SphereGeometry(radius, 7, 5)
      const vertices = geometry.getAttribute('position')
      // Ondulação contínua evita tanto a bola lisa quanto arestas aleatórias.
      for (let vertex = 0; vertex < vertices.count; vertex++) {
        const vx = vertices.getX(vertex), vy = vertices.getY(vertex), vz = vertices.getZ(vertex)
        const factor = 1 + .2 * Math.sin(vx * 13 + py) * Math.cos(vz * 11 - vy * 7)
        vertices.setXYZ(vertex, vx * factor, vy * factor * 1.12, vz * factor * .86)
      }
      geometry.computeVertexNormals()
      add(geometry, foliage[color % foliage.length], px, py, pz)
    }
    // Miolos pequenos e recuados: a borda da copa é formada pelas folhas.
    // A primeira prova usava bolas expostas grandes e parecia uma maquete.
    for (let i = 0; i < 9; i++) core(x + Math.sin(i * 2.399) * .63 * scale,
      base + (3.46 + i % 4 * .34) * scale, z + Math.cos(i * 2.399) * .63 * scale, .48 * scale, i)
    const groups = 58
    for (let i = 0; i < groups; i++) {
      const vertical = 1 - 2 * (i + .5) / groups
      const radial = Math.sqrt(1 - vertical * vertical)
      const angle = i * 2.399 + random() * .2
      const spread = (1.21 + random() * .35 + .18 * Math.sin(angle * 3)) * scale
      const px = x + Math.sin(angle) * radial * spread
      const py = base + (4 + vertical * 1.35 + (random() - .5) * .22) * scale
      const pz = z + Math.cos(angle) * radial * spread
      const radius = (.27 + random() * .12) * scale
      // Folhas em volume, orientações diferentes e vãos naturais entre os ramos.
      for (let leaf = 0; leaf < 10; leaf++) {
        const leafAngle = leaf * 2.399 + angle + random() * .35
        const geometry = new THREE.OctahedronGeometry(1)
        geometry.scale((.095 + random() * .055) * scale, .018 * scale, (.17 + random() * .08) * scale)
        geometry.rotateX((random() - .5) * 2.6)
        geometry.rotateZ((random() - .5) * 2.2)
        add(geometry, foliage[(i + leaf + 1) % foliage.length], px + Math.sin(leafAngle) * radius,
          py + (random() - .5) * radius * 1.8, pz + Math.cos(leafAngle) * radius, leafAngle)
      }
    }
    solid(`canteiro-${x}-${z}`, x, z, 2.7, 2.15, 0.16, 0.5)
    solid(`tronco-${x}-${z}`, x, z, 0.44 * scale, 0.44 * scale, 0.16, base + 3.5 * scale)
  }
  function palm(x: number, z: number) {
    // Mesmos canteiros e eixos de tronco. Copas ficam acima do pedestre.
    box(curb, x, 0.32, z, 2.7, 0.32, 2.15)
    box(soil, x, 0.485, z, 2.44, 0.025, 1.89)
    const crown = new THREE.Vector3(x, 4.8, z)
    cylinder(bark, x, 2.55, z, 0.13, 0.2, 4.78, 12)
    for (let y = .65; y < 4.55; y += .19)
      cylinder(darkWood, x, y, z, .19 - (y - .65) * .013, .193 - (y - .65) * .013, .032, 12)
    cylinder(foliage[1], x, 4.65, z, .16, .14, .65, 12)

    function rib(start: THREE.Vector3, end: THREE.Vector3, radius: number) {
      const direction = end.clone().sub(start)
      const geometry = new THREE.CylinderGeometry(radius * .7, radius, direction.length(), 6)
      geometry.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize()))
      const center = start.clone().add(end).multiplyScalar(.5)
      add(geometry, foliage[1], center.x, center.y, center.z)
    }
    function leaflet(start: THREE.Vector3, direction: number, length: number, width: number, color: number) {
      // Lâmina afilada com nervura e espessura; não é sprite virado para a câmera.
      const geometry = new THREE.BufferGeometry()
      geometry.setAttribute('position', new THREE.Float32BufferAttribute([
        0, 0, 0, -width, -.035, length * .32, 0, -length * .28, length,
        width, -.035, length * .32, 0, .022, length * .32, 0, -.044, length * .32,
      ], 3))
      geometry.setAttribute('uv', new THREE.Float32BufferAttribute([
        .5, 0, 0, .32, .5, 1, 1, .32, .5, .32, .5, .32,
      ], 2))
      geometry.setIndex([0, 1, 4, 1, 2, 4, 2, 3, 4, 3, 0, 4, 1, 0, 5, 2, 1, 5, 3, 2, 5, 0, 3, 5])
      geometry.computeVertexNormals()
      add(geometry, foliage[color % foliage.length], start.x, start.y, start.z, direction)
    }

    // Frondes em dois planos, com folíolos separados que desenham sombras finas.
    for (let frond = 0; frond < 13; frond++) {
      const angle = frond * 2.399 + (x < 0 ? .4 : -.25)
      const reach = 2.15 + frond % 3 * .19
      const lift = frond < 9 ? .82 : 1.55
      const droop = frond < 9 ? .85 : .22
      const point = (t: number) => crown.clone().add(new THREE.Vector3(
        Math.sin(angle) * reach * t,
        Math.sin(t * Math.PI) * lift - droop * t * t,
        Math.cos(angle) * reach * t,
      ))
      for (let segment = 0; segment < 10; segment++)
        rib(point(segment / 10), point((segment + 1) / 10), .031 - segment * .0021)
      for (let pair = 0; pair < 15; pair++) {
        const t = .13 + pair * .055
        const length = (.17 + Math.sin(t * Math.PI) * .59) * (1 - t * .24)
        for (const side of [-1, 1])
          leaflet(point(t), angle + side * (1.14 - t * .15), length, .045 * (1 - t * .42), pair + frond)
      }
    }

    // Arbustos pequenos somente dentro do canteiro que já existia.
    for (const dx of [-.88, .88]) for (const dz of [-.58, 0, .58]) {
      const shrub = new THREE.SphereGeometry(.32, 9, 6)
      shrub.scale(1, .75, 1)
      add(shrub, foliage[1], x + dx, .65, z + dz)
      for (let leaf = 0; leaf < 12; leaf++) {
        const angle = leaf * 2.399
        const geometry = new THREE.OctahedronGeometry(1)
        geometry.scale(.06, .022, .12)
        geometry.rotateX(.45 + leaf % 3 * .23)
        add(geometry, foliage[leaf % 3], x + dx + Math.sin(angle) * .24,
          .68 + leaf % 4 * .052, z + dz + Math.cos(angle) * .24, angle)
      }
    }
    solid(`canteiro-${x}-${z}`, x, z, 2.7, 2.15, 0.16, .91)
    solid(`tronco-${x}-${z}`, x, z, .44, .44, 0.16, 4.8)
  }
  for (const x of [-44, -30, 29, 44]) tree(x, -0.58, 1.12)
  for (const x of [-11, 11]) palm(x, -0.58)
  for (const x of [-38, -9, 9, 36]) tree(x, 17.15, 1.1)
  for (const x of [-25, 24]) {
    cylinder(metal, x, 0.71, -0.63, 0.31, 0.27, 1.1, 14)
    cylinder(bronze, x, 1.28, -0.63, 0.32, 0.32, 0.05, 14)
    solid(`lixeira-${x}`, x, -0.63, 0.66, 0.66, 0.16, 1.31)
  }
  // Postes atrás da faixa do pedestre, sem colocar obstáculos em z=2.
  for (const x of [-35, 22]) {
    cylinder(metal, x, 3.21, -0.56, 0.065, 0.105, 6.1, 10)
    box(metal, x, 6.19, 0.05, 0.1, 0.12, 1.34)
    box(metal, x, 6.13, 0.72, 0.52, 0.13, 0.89)
    box(lamp, x, 6.05, 0.72, 0.41, 0.015, 0.73)
    solid(`poste-${x}`, x, -0.56, 0.24, 0.24, 0.16, 6.25)
  }

  // Volumes de vizinhança delimitam o trecho; não são fases de estádio prontas.
  function neighbour(x: number, z: number, w: number, d: number, h: number, index: number) {
    const mat = index % 2 ? concrete : facade
    wall(`vizinho-${x}-${z}`, mat, x, h / 2 + 0.16, z, w, h, d)
    box(roof, x, h + 0.22, z, w + 0.12, 0.12, d + 0.12)
    box(trim, x, h - 0.12, z + d / 2 + 0.03, w + 0.1, 0.14, 0.1)
    for (let dx = -w / 2 + 1.6; dx < w / 2 - 0.6; dx += 2.8) {
      for (let y = 1.8; y < h - 1; y += 2.5) {
        box(metal, x + dx, y, z + d / 2 + 0.025, 1.24, 1.47, 0.06)
        box(awning, x + dx, y, z + d / 2 + 0.06, 1.06, 1.28, 0.04)
        box(trim, x + dx, y - 0.77, z + d / 2 + 0.16, 1.42, 0.11, 0.32)
      }
    }
  }
  neighbour(-26, -10, 12, 12, 7.5, 0)
  neighbour(27, -11, 14, 14, 6.4, 1)
  neighbour(-45, -12, 15, 16, 10, 1)
  neighbour(46, -12, 16, 16, 8.5, 0)
  neighbour(-12, -30, 18, 12, 9, 1)
  neighbour(13, -31, 20, 14, 11, 0)
  for (const x of [-72, -60, 62, 77]) neighbour(x, -11, 10, 14, 6 + Math.abs(x % 7), x)

  for (const [mat, pieces] of batches) {
    const geometry = mergeGeometries(pieces, false)
    for (const piece of pieces) piece.dispose()
    if (!geometry) continue
    geometry.computeBoundingSphere()
    const mesh = new THREE.Mesh(geometry, mat)
    mesh.name = mat === glass ? 'vidros-reais' : 'arquitetura-bairro'
    // Millimetric pavement tops must receive people/tree shadows, not cast
    // quantized shadows back onto their own foundation in the distant view.
    // Curbs, planters, walls and every actor retain their physical shadows.
    mesh.castShadow = mat !== glass && mat !== lamp && mat !== terrain && mat !== asphalt && mat !== mortar && !pavers.some(paver => paver === mat)
    mesh.receiveShadow = mat !== glass && mat !== lamp
    root.add(mesh)
  }
  batches.clear()

  return {
    root,
    solids,
    floorY: PISO_BAIRRO_3D,
    dispose() {
      root.removeFromParent()
      root.traverse(object => {
        if (object instanceof THREE.Mesh) object.geometry.dispose()
      })
      for (const mat of materials) mat.dispose()
      for (const texture of textures) texture.dispose()
      root.clear()
    },
  }
}

import * as THREE from 'three'
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js'
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js'
import type {QuadroBairro} from './presidencia-bairro-model'
import {geometriaHumana, materialHumano} from './presidencia-humano-acabamento.ts'

// Same faceless proportions as the football figures, with a separate walking rig.
// Everything is measured in metres, including soles, wheel radii and shadow casters.
const STRIDE = 1.16
const STANCE = .60
const HIP_Y = .875
const THIGH = .44
const SHIN = .43
const ANKLE_Y = .09
const TYRE_RADIUS = .32
const UP = new THREE.Vector3(0, 1, 0)
const clamp = THREE.MathUtils.clamp
const smooth = (x:number) => x * x * x * (x * (x * 6 - 15) + 10)

export function criarAtoresBairro(scene:THREE.Scene) {
  const geometries = new Set<THREE.BufferGeometry>()
  const materials = new Set<THREE.Material>()
  const geometry = <T extends THREE.BufferGeometry>(value:T):T => { geometries.add(value); return value }
  const material = (color:string, roughness = .82, metalness = 0) => {
    const value = new THREE.MeshStandardMaterial({color, roughness, metalness})
    materials.add(value)
    return value
  }
  const humanMaterial = (color:string, kind:Parameters<typeof materialHumano>[1]) => {
    const value = materialHumano(color, kind)
    materials.add(value)
    return value
  }
  const humanShapes = new Map<string, THREE.BufferGeometry>()
  const humanShape = (part:Parameters<typeof geometriaHumana>[0]) => {
    // Leg IK points +Y towards the ankle; the sculpted profile's +Y is proximal.
    const reverse = part === 'thigh' || part === 'shin', key = part + (reverse ? ':flip' : '')
    let value = humanShapes.get(key)
    if (!value) {
      value = geometry(geometriaHumana(part))
      if (reverse) { value.rotateZ(Math.PI); value.userData.humanoShape += ':flip' }
      humanShapes.set(key, value)
    }
    return value
  }
  const sphereGeometry = geometry(new THREE.SphereGeometry(1, 16, 12))
  const mesh = (parent:THREE.Object3D, shape:THREE.BufferGeometry, mat:THREE.Material, name?:string) => {
    // A shared coloured material also dresses neck, hands and joint primitives.
    // Supply white vertex tint explicitly rather than inheriting a GPU attribute.
    if ((mat as THREE.MeshStandardMaterial).vertexColors && !shape.hasAttribute('color')) {
      shape.setAttribute('color', new THREE.BufferAttribute(new Float32Array(shape.getAttribute('position').count * 3).fill(1), 3))
    }
    const value = new THREE.Mesh(shape, mat)
    value.castShadow = true
    value.receiveShadow = true
    if (name) value.name = name
    parent.add(value)
    return value
  }
  const capsule = (parent:THREE.Object3D, mat:THREE.Material, radius:number, length:number, position:number[]) => {
    const value = mesh(parent, geometry(new THREE.CapsuleGeometry(radius, length, 4, 10)), mat)
    value.position.set(position[0], position[1], position[2])
    return value
  }

  const pedestre = new THREE.Group()
  pedestre.name = 'bairro-pedestre'
  scene.add(pedestre)
  const skin = humanMaterial('#98623f', 'skin')
  const shirt = humanMaterial('#1B7A3D', 'fabric')
  const trimShirt = humanMaterial('#193b26', 'fabric')
  const trousers = humanMaterial('#4d514a', 'fabric')
  const shoes = humanMaterial('#242822', 'shoe')
  const soles = humanMaterial('#c8c3ad', 'sole')
  const hair = humanMaterial('#25221e', 'hair')
  const human = (parent:THREE.Object3D, part:Parameters<typeof geometriaHumana>[0], mat:THREE.Material, size:number[], position:number[], name?:string) => {
    const value = mesh(parent, humanShape(part), mat, name)
    value.scale.set(size[0], size[1], size[2]); value.position.set(position[0], position[1], position[2])
    return value
  }
  const upper = new THREE.Group()
  pedestre.add(upper)
  human(upper, 'torso', shirt, [.436, .45, .296], [0, 1.195, 0], 'bairro-camisa-modelada')
  human(pedestre, 'pelvis', trousers, [.38, .29, .238], [0, .897, 0], 'bairro-calca-cintura')
  capsule(upper, skin, .062, .058, [0, 1.46, 0])
  human(upper, 'head', skin, [.29, .332, .288], [0, 1.635, 0], 'bairro-cabeca-sem-rosto')
  human(upper, 'hair', hair, [.29, .332, .288], [0, 1.635, 0], 'bairro-cabelo')
  const collar = mesh(upper, geometry(new THREE.TorusGeometry(.066, .006, 6, 20)), trimShirt, 'bairro-gola')
  collar.rotation.x = Math.PI / 2
  collar.position.y = 1.417
  const arms = [-1, 1].map(side => {
    const shoulder = new THREE.Group()
    shoulder.position.set(side * .247, 1.38, 0)
    upper.add(shoulder)
    human(shoulder, 'upperArm', shirt, [.156, .22, .145], [0, -.065, 0], 'bairro-manga')
    human(shoulder, 'upperArm', skin, [.108, .155, .105], [0, -.185, 0])
    const elbow = new THREE.Group()
    elbow.position.y = -.26
    shoulder.add(elbow)
    human(elbow, 'forearm', skin, [.096, .205, .095], [0, -.1025, 0])
    capsule(elbow, skin, .053, .025, [0, -.204, 0])
    elbow.rotation.x = -.16
    return shoulder
  })
  const legs = [-1, 1].map((side, index) => {
    const thigh = human(pedestre, 'thigh', trousers, [.168, 1, .168], [0, 0, 0])
    const shin = human(pedestre, 'shin', trousers, [.13, 1, .13], [0, 0, 0])
    const knee = mesh(pedestre, sphereGeometry, trousers)
    knee.scale.set(.067, .07, .067)
    const foot = new THREE.Group()
    foot.name = `bairro-pe-${index}`
    pedestre.add(foot)
    const sole = human(foot, 'shoe', soles, [.146, .028, .285], [0, .014, .066], `bairro-sola-${index}`)
    human(foot, 'shoe', shoes, [.139, .064, .258], [0, .057, .058], 'bairro-tenis')
    return {side, thigh, shin, knee, foot, sole}
  })
  const feet = legs.map(leg => leg.sole)

  const carro = new THREE.Group()
  carro.name = 'bairro-carro'
  scene.add(carro)
  const paint = new THREE.MeshPhysicalMaterial({color:'#b9c0b8', roughness:.29, metalness:.24, clearcoat:.88, clearcoatRoughness:.16, envMapIntensity:.85})
  const glass = new THREE.MeshPhysicalMaterial({color:'#344d57', roughness:.13, metalness:.16, clearcoat:1, clearcoatRoughness:.1, envMapIntensity:1.05})
  materials.add(paint)
  materials.add(glass)
  const rubber = material('#242725', .91)
  const alloy = material('#b1b8b6', .25, .83)
  const trim = material('#323b38', .62, .12)
  const headlight = material('#e4e6df', .18, .23)
  const taillight = material('#963b30', .24, .08)
  headlight.userData.complexoNightEmission = {color:'#fff0cf',intensity:2.2}
  taillight.userData.complexoNightEmission = {color:'#ef3325',intensity:1.2}
  carro.userData.complexoLights = [-1,1].map(side=>({id:`farol-${side}`,kind:'headlight',
    position:[side*.551,.685,2.055],target:[side*.8,.02,15],color:'#fff0cf',intensity:55,distance:24,angle:.29}))
  const roundedBox = (mat:THREE.Material, size:number[], position:number[], radius = .025) => {
    const value = mesh(carro, geometry(new RoundedBoxGeometry(size[0], size[1], size[2], 1, radius)), mat)
    value.position.set(position[0], position[1], position[2])
    return value
  }

  // The sill is actually cut around the tyres; there is no painted-on wheel image.
  const bodyProfile = new THREE.Shape()
  bodyProfile.moveTo(-2.02, .39)
  bodyProfile.lineTo(-1.65, .37)
  for (let i = 0; i <= 12; i++) {
    const angle = Math.PI * (1 - i / 12)
    bodyProfile.lineTo(-1.28 + Math.cos(angle) * .37, .34 + Math.sin(angle) * .37)
  }
  bodyProfile.lineTo(.91, .34)
  for (let i = 0; i <= 12; i++) {
    const angle = Math.PI * (1 - i / 12)
    bodyProfile.lineTo(1.28 + Math.cos(angle) * .37, .34 + Math.sin(angle) * .37)
  }
  bodyProfile.lineTo(2.025, .405)
  bodyProfile.quadraticCurveTo(2.06, .52, 2.025, .65)
  bodyProfile.quadraticCurveTo(1.94, .765, 1.78, .798)
  bodyProfile.quadraticCurveTo(1.39, .86, .94, .886)
  bodyProfile.lineTo(-1.02, .897)
  bodyProfile.quadraticCurveTo(-1.57, .856, -1.88, .822)
  bodyProfile.quadraticCurveTo(-2.035, .777, -2.037, .655)
  bodyProfile.closePath()
  const extruded = (shape:THREE.Shape, width:number, mat:THREE.Material, bevel:number, tapered = false) => {
    const shapeGeometry = geometry(new THREE.ExtrudeGeometry(shape, {depth:width, bevelEnabled:true, bevelSize:bevel, bevelThickness:bevel, bevelSegments:3, steps:1, curveSegments:6}))
    shapeGeometry.rotateY(-Math.PI / 2)
    shapeGeometry.translate(width / 2, 0, 0)
    if (tapered) {
      const position = shapeGeometry.getAttribute('position')
      for (let i = 0; i < position.count; i++) {
        const taper = 1 - clamp((position.getY(i) - .88) / .52, 0, 1) * .17
        position.setX(i, position.getX(i) * taper)
      }
      shapeGeometry.computeVertexNormals()
    }
    const value = mesh(carro, shapeGeometry, mat)
    return value
  }
  extruded(bodyProfile, 1.61, paint, .035)
  const cabin = new THREE.Shape()
  cabin.moveTo(-1.08, .87)
  cabin.lineTo(-.62, 1.354)
  cabin.quadraticCurveTo(-.50, 1.374, -.31, 1.374)
  cabin.lineTo(.36, 1.378)
  cabin.quadraticCurveTo(.46, 1.378, .52, 1.354)
  cabin.lineTo(1.04, .9)
  cabin.closePath()
  extruded(cabin, 1.36, paint, .022, true)

  const panel = (points:number[][], mat:THREE.Material, bulge = .009) => {
    const corners = points.map(point => new THREE.Vector3(...point as [number,number,number]))
    const normal = new THREE.Vector3().subVectors(corners[1], corners[0]).cross(new THREE.Vector3().subVectors(corners[3], corners[0])).normalize()
    const vertices:number[] = [], indices:number[] = []
    const columns = 6, rows = 3
    for (let row = 0; row <= rows; row++) for (let column = 0; column <= columns; column++) {
      const u = column / columns, v = row / rows
      const left = corners[0].clone().lerp(corners[1], v)
      const right = corners[3].clone().lerp(corners[2], v)
      const point = left.lerp(right, u).addScaledVector(normal, bulge * Math.sin(u * Math.PI) * Math.sin(v * Math.PI))
      vertices.push(point.x, point.y, point.z)
      if (row < rows && column < columns) {
        const i = row * (columns + 1) + column
        indices.push(i, i + columns + 1, i + 1, i + 1, i + columns + 1, i + columns + 2)
      }
    }
    const value = geometry(new THREE.BufferGeometry())
    value.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
    value.setIndex(indices)
    value.computeVertexNormals()
    return mesh(carro, value, mat)
  }
  const glassBoth = glass.clone()
  glassBoth.side = THREE.DoubleSide
  materials.add(glassBoth)
  for (const side of [-1, 1]) {
    const sidePoint = (y:number, z:number) => [side * .707 * (1 - clamp((y - .88) / .52, 0, 1) * .17), y, z]
    const window = (points:number[][]) => panel(side === 1 ? points : [...points].reverse(), glassBoth)
    window([sidePoint(.953,-.951),sidePoint(1.302,-.571),sidePoint(1.315,-.135),sidePoint(.953,-.135)])
    window([sidePoint(.953,-.062),sidePoint(1.315,-.062),sidePoint(1.305,.489),sidePoint(.953,.91)])
    roundedBox(trim, [.018,.018,1.86], [side*.839,.763,-.055], .008)
    roundedBox(alloy, [.034,.033,.145], [side*.838,.839,.64], .012)
    roundedBox(alloy, [.034,.033,.145], [side*.838,.839,-.45], .012)
    roundedBox(trim, [.094,.035,.042], [side*.744,.958,.77], .012)
    const mirror = roundedBox(paint, [.139,.092,.176], [side*.819,.997,.775], .036)
    mirror.rotation.y = side * -.12
    roundedBox(glass, [.101,.057,.015], [side*.825,.998,.693], .012)
    const lamp = roundedBox(headlight, [.38,.097,.068], [side*.551,.685,2.014], .035)
    lamp.rotation.y = side * -.055
    roundedBox(taillight, [.335,.105,.037], [side*.564,.716,-2.043], .025)
  }
  panel([[-.648,.951,1.004],[.648,.951,1.004],[.552,1.315,.604],[-.552,1.315,.604]], glassBoth, .016)
  panel([[.647,.956,-1.033],[-.647,.956,-1.033],[-.557,1.313,-.683],[.557,1.313,-.683]], glassBoth, .014)
  roundedBox(trim, [1.49,.091,.083], [0,.463,2.035], .028)
  roundedBox(trim, [1.49,.088,.074], [0,.454,-2.049], .026)
  roundedBox(trim, [.69,.095,.032], [0,.678,2.045], .016)
  roundedBox(alloy, [.706,.023,.031], [0,.737,2.043], .01)
  roundedBox(trim, [.36,.117,.022], [0,.651,-2.065], .014)

  // Keep separate moving wheels, but batch static panels by material. There is
  // no per-frame geometry work and the shop scene does not pay a draw per trim.
  const staticParts = carro.children.filter((child):child is THREE.Mesh => child instanceof THREE.Mesh)
  const batches = new Map<THREE.Material, THREE.BufferGeometry[]>()
  for (const part of staticParts) {
    part.updateMatrix()
    const transformed = part.geometry.index ? part.geometry.toNonIndexed() : part.geometry.clone()
    transformed.applyMatrix4(part.matrix)
    const mat = part.material as THREE.Material
    const batch = batches.get(mat) ?? []
    batch.push(transformed)
    batches.set(mat, batch)
  }
  for (const [mat, parts] of batches) {
    const merged = mergeGeometries(parts)
    if (merged) mesh(carro, geometry(merged), mat)
    parts.forEach(part => part.dispose())
  }
  staticParts.forEach(part => carro.remove(part))

  const tyreProfile = [
    [.205,-.083],[.239,-.098],[.289,-.092],[.311,-.072],
    [TYRE_RADIUS,-.04],[TYRE_RADIUS,.04],[.311,.072],[.289,.092],[.239,.098],[.205,.083],
  ].map(([radius, offset]) => new THREE.Vector2(radius, offset))
  const tyreGeometry = geometry(new THREE.LatheGeometry(tyreProfile, 32))
  tyreGeometry.rotateZ(Math.PI / 2)
  const brakeGeometry = geometry(new THREE.CylinderGeometry(.184, .184, .14, 24))
  brakeGeometry.rotateZ(Math.PI / 2)
  // Five open spokes, two rolled rim lips and the hub share one metallic mesh.
  const rimParts:THREE.BufferGeometry[] = []
  for (const side of [-1, 1]) {
    const lip = new THREE.TorusGeometry(.188, .014, 5, 20)
    lip.rotateY(Math.PI / 2)
    lip.translate(side * .083, 0, 0)
    rimParts.push(lip)
  }
  const hubGeometry = new THREE.CylinderGeometry(.058, .058, .191, 16)
  hubGeometry.rotateZ(Math.PI / 2)
  rimParts.push(hubGeometry)
  for (let i = 0; i < 5; i++) {
    const angle = i * Math.PI * 2 / 5
    const spoke = new THREE.BoxGeometry(.18,.032,.132)
    spoke.rotateX(-angle)
    spoke.translate(0, Math.sin(angle) * .111, Math.cos(angle) * .111)
    rimParts.push(spoke)
  }
  const rimGeometry = geometry(mergeGeometries(rimParts)!)
  rimParts.forEach(part => part.dispose())
  const wheelRig = [-1, 1].flatMap(side => [-1, 1].map(end => {
    const steering = new THREE.Group()
    steering.position.set(side * .80, TYRE_RADIUS, end * 1.28)
    carro.add(steering)
    const spin = new THREE.Group()
    steering.add(spin)
    const tyre = mesh(spin, tyreGeometry, rubber, `bairro-pneu-${side}-${end}`)
    mesh(spin, brakeGeometry, trim)
    mesh(spin, rimGeometry, alloy)
    return {steering, spin, tyre, front:end === 1}
  }))
  const wheels = wheelRig.map(wheel => wheel.tyre)

  const start = new THREE.Vector3()
  const joint = new THREE.Vector3()
  const ankle = new THREE.Vector3()
  const direction = new THREE.Vector3()
  const setBone = (bone:THREE.Mesh, a:THREE.Vector3, b:THREE.Vector3) => {
    direction.subVectors(b, a)
    const length = direction.length()
    bone.position.copy(a).add(b).multiplyScalar(.5)
    bone.scale.y = length
    bone.quaternion.setFromUnitVectors(UP, direction.multiplyScalar(1 / length))
  }
  let previousSeconds:number|undefined
  let previousCarHeading:number|undefined
  let walking = 1
  let disposed = false

  const update = (frame:QuadroBairro) => {
    if (disposed) return
    const p = frame.pedestre
    const dt = previousSeconds === undefined ? 1 / 60 : clamp(frame.seconds - previousSeconds, 0, .1)
    // Stop/settle the lifted foot rather than freezing a pedestrian with one foot in the air.
    const moving = clamp(p.speed / .8, 0, 1)
    if (previousSeconds === undefined || frame.seconds < previousSeconds) walking = moving
    else walking += (moving - walking) * (1 - Math.exp(-dt * 17))
    pedestre.position.set(p.x, p.y, p.z)
    pedestre.rotation.y = p.heading
    const cycle = ((p.distance / STRIDE) % 1 + 1) % 1
    const halfTravel = STRIDE * STANCE / 2
    legs.forEach((leg, index) => {
      const phase = (cycle + index * .5) % 1
      const supported = phase < STANCE
      const swing = supported ? 0 : (phase - STANCE) / (1 - STANCE)
      // During stance, dz/ddistance = -1. The planted foot cancels root movement.
      const footZ = supported
        ? halfTravel - phase * STRIDE
        : -halfTravel + 2 * halfTravel * smooth(swing)
      const lift = supported ? 0 : .135 * Math.sin(Math.PI * swing) ** 2
      const z = footZ * walking
      const y = lift * walking
      leg.foot.position.set(leg.side * .119, y, z)
      start.set(leg.side * .119, HIP_Y, 0)
      ankle.set(leg.side * .119, ANKLE_Y + y, z)
      const dy = ankle.y - start.y
      const dz = ankle.z
      const distance = Math.hypot(dy, dz)
      const along = (THIGH * THIGH - SHIN * SHIN + distance * distance) / (2 * distance)
      const bend = Math.sqrt(Math.max(0, THIGH * THIGH - along * along))
      joint.set(start.x, start.y + dy / distance * along + dz / distance * bend, dz / distance * along - dy / distance * bend)
      setBone(leg.thigh, start, joint)
      setBone(leg.shin, joint, ankle)
      leg.knee.position.copy(joint)
      arms[index].rotation.x = Math.sin(cycle * Math.PI * 2 + index * Math.PI) * .235 * walking
      arms[index].rotation.z = -leg.side * .035
    })
    upper.rotation.z = Math.sin(cycle * Math.PI * 2) * .012 * walking
    upper.rotation.x = .015 * walking

    const c = frame.carro
    carro.position.set(c.x, c.y, c.z)
    carro.rotation.y = c.heading
    const turn = previousCarHeading === undefined ? 0 : Math.atan2(Math.sin(c.heading - previousCarHeading), Math.cos(c.heading - previousCarHeading))
    const steer = dt > .0001 && c.speed > .1 ? clamp(Math.atan(turn / dt * 2.56 / c.speed), -.48, .48) : 0
    wheelRig.forEach(wheel => {
      wheel.spin.rotation.x = c.distance / TYRE_RADIUS
      wheel.steering.rotation.y = wheel.front ? steer : 0
    })
    previousSeconds = frame.seconds
    previousCarHeading = c.heading
  }

  return {
    update, pedestre, carro, feet, wheels,
    dispose() {
      if (disposed) return
      disposed = true
      scene.remove(pedestre, carro)
      geometries.forEach(value => value.dispose())
      const textures = new Set<THREE.Texture>()
      materials.forEach(value => Object.values(value).forEach(property => { if (property instanceof THREE.Texture) textures.add(property) }))
      textures.forEach(value => value.dispose())
      materials.forEach(value => value.dispose())
    },
  }
}

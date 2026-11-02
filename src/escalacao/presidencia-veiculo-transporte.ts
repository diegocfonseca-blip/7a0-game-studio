import * as THREE from 'three'
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js'
import type {ServicoTransporteComplexo} from './presidencia-complexo-transporte-model'

/** Shared existing vehicle meshes. Presentation only; does not purchase a vehicle. */
export function criarVeiculoTransporte(root:THREE.Object3D,service:ServicoTransporteComplexo,color?:string){
 const geometries=new Set<THREE.BufferGeometry>(),materials=new Set<THREE.Material>()
 const mat=(color:string,metalness=0,roughness=.8)=>{const m=new THREE.MeshStandardMaterial({color,metalness,roughness});materials.add(m);return m}
 const metal=mat('#5a605e',.55,.45),rubber=mat('#202523'),glass=mat('#728d91',.15,.2),warm=mat('#ede2c8'),dark=mat('#33433e')
 glass.userData.complexoNightEmission={color:'#e0c895',intensity:.14};glass.transparent=true;glass.opacity=.66;glass.depthWrite=false
    const group = new THREE.Group(); group.name = `transporte-${service.id}`; root.add(group)
    const shell = mat(color ?? (service.kind === 'metro' ? '#235b83' : service.kind === 'bus' ? '#d5b24c' : '#d8d6cb'), .25, .52)
    const floor = service.floorHeight, height = service.kind === 'car' ? 1.95 : 2.52, width = service.width, length = service.length
    group.userData.complexoLights = (service.kind==='metro'?[-1,1]:[1]).flatMap(direction=>[-1,1].map(side=>({id:`${service.id}-farol-${direction}-${side}`,kind:'headlight',direction,enabled:direction===1,
      position:[side*(width/2-.3),floor+.38,direction*(length/2+.075)],target:[side*(width/2-.3),.05,direction*(length/2+20)],
      color:'#fff0cf',intensity:service.kind==='metro'?130:85,distance:service.kind==='metro'?40:30,angle:.3})))
    const cabLamps=[mat('#c0382d'),mat('#f8e8b4')]
    cabLamps[0].userData.complexoNightEmission={color:'#ef3325',intensity:1.2}
    cabLamps[1].userData.complexoNightEmission={color:'#fff0cf',intensity:2.2}
    group.userData.complexoCabLamps=cabLamps
    const parts = new Map<THREE.Material, THREE.BufferGeometry[]>(), doors: { mesh: THREE.Mesh; z: number; direction: number }[] = []
    const box = (material: THREE.Material, w: number, h: number, d: number, x: number, y: number, z: number) => {
      if (w <= 0 || h <= 0 || d <= 0) return
      const geometry = new THREE.BoxGeometry(w, h, d); geometry.translate(x, y, z)
      if (!parts.has(material)) parts.set(material, []); parts.get(material)!.push(geometry)
    }
    const metro = service.kind === 'metro', gap = .6, carLength = metro ? (length - 4 * gap) / 5 : length
    const carriageCenters = metro ? Array.from({ length: 5 }, (_, i) => (i - 2) * (carLength + gap)) : [0]
    group.userData.carriages = carriageCenters.length
    const trainRoof = metro ? mat('#2f84b7', .3, .42) : warm
    const trim = metro ? mat('#d7e0df', .2, .58) : shell
    const glazing = metro ? mat('#b6a175', .12, .25) : glass
    if (metro) {
      glazing.transparent = true; glazing.opacity = .66; glazing.depthWrite = false
      glazing.emissive.set('#d89c41'); glazing.emissiveIntensity = .18
      glazing.userData.complexoNightEmission = { color: '#e9bb65', intensity: .14 }
    }
    const cabinLamp = mat('#eee4cf', .1, .35)
    cabinLamp.userData.complexoNightEmission = { color: '#ffe9bc', intensity: 1.8 }
    for (const [carriage, center] of carriageCenters.entries()) {
      box(dark, width - .08, .1, carLength - .08, 0, floor - .05, center)
      // The full-resolution reference has blue roofs, a pale window band and
      // amber interiors. Roof and cabin keep the measured vertical envelope.
      box(trainRoof, width + .04, .13, carLength + .02, 0, floor + height, center)
      const doorCenter = center + service.door.longitudinal
      if (service.kind !== 'car') {
        // Both fixtures attach to the actual underside of this carriage roof.
        // The portal beam is enabled only while the physical door is open.
        const ceiling = floor + height - .12, side = service.door.side
        box(cabinLamp, .45, .035, 1.4, 0, ceiling, center)
        box(cabinLamp, .42, .035, .7, side * (width / 2 - .22), ceiling, doorCenter)
        group.userData.complexoLights.push({
          id: `${service.id}-cabine-${carriage}`, kind: 'cabin', enabled: true,
          position: [0, ceiling - .025, center], target: [0, floor, center],
          color: '#ffe9bc', intensity: 38, distance: 6, angle: .95,
        }, {
          id: `${service.id}-porta-${carriage}`, kind: 'cabin', doorOnly: true, enabled: false,
          position: [side * (width / 2 - .22), ceiling - .025, doorCenter],
          target: [side * (width / 2 + .25), floor, doorCenter],
          color: '#ffe9bc', intensity: 42, distance: 6, angle: 1.02,
        })
      }
      const doorStart = doorCenter - service.door.width / 2, doorEnd = doorCenter + service.door.width / 2
      for (const side of [-1, 1]) {
        const runs = side === service.door.side ? [[center - carLength / 2, doorStart], [doorEnd, center + carLength / 2]] : [[center - carLength / 2, center + carLength / 2]]
        for (const [a, b] of runs) {
          const z = (a + b) / 2, run = b - a
          box(shell, .09, .68, run, side * width / 2, floor + .34, z)
          box(glazing, .07, height - 1.02, run, side * width / 2, floor + (height - 1.02) / 2 + .72, z)
          box(trim, .09, .30, run, side * width / 2, floor + height - .15, z)
          if (metro) box(trim, .105, .075, run, side * width / 2, floor + .70, z)
          for (let p = a + .06; p < b; p += 1.8) box(shell, .10, height - .45, .08, side * width / 2, floor + height / 2, p)
        }
      }
      for (const side of [-1, 1]) {
        const end = center + side * carLength / 2
        const cab = !metro || (carriage === 0 && side < 0) || (carriage === carriageCenters.length - 1 && side > 0)
        if (cab) {
          box(shell, width, .65, .11, 0, floor + .325, end)
          box(glass, width - .16, height - 1, .08, 0, floor + (height - 1) / 2 + .69, end)
          box(shell, width, .27, .11, 0, floor + height - .135, end)
          for (const x of [-1, 1]) box(cabLamps[side<0?0:1], .22, .12, .03, x * (width / 2 - .3), floor + .38, end + side * .065)
        } else {
          // A genuine central gangway joins adjacent cabins; neither a solid
          // end wall nor a full-length floor hides the gap between carriages.
          for (const x of [-1, 1]) box(shell, (width - 1.1) / 2, height, .11, x * (width + 1.1) / 4, floor + height / 2, end)
          box(shell, 1.1, height - 1.95, .11, 0, floor + (height + 1.95) / 2, end)
        }
      }
      box(shell, .10, Math.max(.12, height - 1.9), service.door.width, service.door.side * width / 2, floor + 1.9 + Math.max(.12, height - 1.9) / 2, doorCenter)
      // Each measured portal is a real opening. Only the platform side opens;
      // the central carriage retains the passenger's unchanged local z=0 door.
      for (const direction of [-1, 1]) {
        const geometry = new THREE.BoxGeometry(.075, 1.85, service.door.width / 2); geometries.add(geometry)
        const door = new THREE.Mesh(geometry, glazing), z = doorCenter + direction * service.door.width / 4
        door.position.set(service.door.side * (width / 2 + .075), floor + .925, z)
        door.castShadow = door.receiveShadow = true; door.name = `porta-${service.id}-${direction}${metro && carriage !== 2 ? `-vagao-${carriage}` : ''}`
        group.add(door); doors.push({ mesh: door, z, direction })
        const frameParts = [[.09, 1.85, .045, 0, 0, -service.door.width / 4], [.09, 1.85, .045, 0, 0, service.door.width / 4],
          [.09, .055, service.door.width / 2, 0, -.8975, 0], [.09, .055, service.door.width / 2, 0, .8975, 0]].map(([w, h, d, x, y, p]) => {
          const part = new THREE.BoxGeometry(w, h, d); part.translate(x, y, p); return part
        })
        const frameGeometry = mergeGeometries(frameParts, false); frameParts.forEach(part => part.dispose())
        if (frameGeometry) { geometries.add(frameGeometry); const frame = new THREE.Mesh(frameGeometry, metal); frame.castShadow = true; door.add(frame) }
      }
      if (metro) {
        for (const side of [-1, 1]) {
          const bogie = center + side * carLength * .33
          box(metal, 1.52, .17, 2.15, 0, floor - .205, bogie)
          for (const lateral of [-1, 1]) {
            box(warm, .42, .12, carLength * .35, lateral * (width / 2 - .3), floor + .42, center + side * carLength * .28)
            box(warm, .08, .43, carLength * .35, lateral * (width / 2 - .14), floor + .705, center + side * carLength * .28)
          }
        }
      }
    }
    if (metro) for (let carriage = 1; carriage < carriageCenters.length; carriage++) {
      const joint = (carriageCenters[carriage - 1] + carriageCenters[carriage]) / 2
      box(metal, .24, .18, gap + .4, 0, floor - .23, joint)
      box(dark, 1.3, .1, gap + .16, 0, floor - .05, joint)
      for (const side of [-1, 1]) box(dark, .1, 1.95, gap + .08, side * .6, floor + .975, joint)
      box(dark, 1.3, .08, gap + .08, 0, floor + 1.99, joint)
    }
    for (const [material, pieces] of parts) {
      const merged = mergeGeometries(pieces, false); pieces.forEach(piece => piece.dispose())
      if (!merged) continue
      geometries.add(merged); const mesh = new THREE.Mesh(merged, material); mesh.castShadow = mesh.receiveShadow = true; group.add(mesh)
    }
    const wheels: THREE.Mesh[] = [], radius = service.wheelRadius
    const axles = metro ? carriageCenters.flatMap(center => [-1, 1].flatMap(side => [-.65, .65].map(offset => center + side * carLength * .33 + offset))) : [-length * .32, length * .32]
    const wheelGeometry = new THREE.CylinderGeometry(radius, radius, .17, 16); wheelGeometry.rotateZ(Math.PI / 2)
    const hubGeometry = new THREE.CylinderGeometry(radius * .48, radius * .48, .185, 12); hubGeometry.rotateZ(Math.PI / 2)
    // Steel railway wheels include the raised hub in one mesh/material. The
    // longer consist adds axles without adding a second draw for every wheel.
    const rollingGeometry = metro ? mergeGeometries([wheelGeometry, hubGeometry], false)! : wheelGeometry
    if (metro) { wheelGeometry.dispose(); hubGeometry.dispose(); geometries.add(rollingGeometry) }
    else { geometries.add(wheelGeometry); geometries.add(hubGeometry) }
    for (const x of [-1, 1]) for (const z of axles) {
      const offset = metro ? .7 : width * .46
      const wheel = new THREE.Mesh(rollingGeometry, metro ? metal : rubber); wheel.position.set(x * offset, radius, z); wheel.castShadow = wheel.receiveShadow = true
      wheel.name = `roda-${service.id}`; group.add(wheel); wheels.push(wheel)
      if (!metro) { const hub = new THREE.Mesh(hubGeometry, metal); wheel.add(hub) }
    }

 return {root:group,doors,wheels,setColor(color:string){shell.color.set(color)},
  update(distance:number,opening=0){for(const wheel of wheels)wheel.rotation.x=distance/service.wheelRadius;for(const door of doors)door.mesh.position.z=door.z+door.direction*service.door.width/2*opening},
  dispose(){group.removeFromParent();geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose())}}
}

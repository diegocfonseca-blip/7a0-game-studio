import assert from 'node:assert/strict'
import fs from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { registerHooks } from 'node:module'
import * as THREE from 'three'

registerHooks({
  resolve(specifier, context, next) {
    if (specifier.startsWith('.') && context.parentURL?.startsWith('file:')) {
      const candidate = fileURLToPath(new URL(specifier, context.parentURL))
      if (fs.existsSync(candidate + '.ts')) return { url: pathToFileURL(candidate + '.ts').href, shortCircuit: true }
    }
    return next(specifier, context)
  },
  load(url, context, next) {
    if (url.endsWith('/lang.ts')) return { format: 'module', source: "export const getLang=()=> 'pt'", shortCircuit: true }
    return next(url, context)
  },
})
const { criarArquiteturaComplexo } = await import('../src/escalacao/presidencia-complexo-arquitetura.ts')
const { complexoDoEstadio } = await import('../src/escalacao/presidencia-complexo-model.ts')
const { STADIUM_SECTORS, STADIUM_EXTRAS } = await import('../src/escalacao/estadiodata.ts')
const inv = Object.fromEntries(STADIUM_SECTORS.map(s => [s.k, s.cost]))
const concreteNames = new Set(['estrutura-concreto-claro', 'espelhos-concreto', 'passeios-e-lajes'])
const scenarios = {
  'geral-parcial': { inv: { grama: inv.grama, geral: inv.geral / 2 }, ext: [] },
  'primeiro-anel': { inv: { ...inv, camarote: 0 }, ext: [] },
  'segundo-parcial': { inv: { ...inv, camarote: inv.camarote * .11 }, ext: [] },
  completo: { inv, ext: STADIUM_EXTRAS.map(s => s.k), roofClosed: true },
}

// A centimetre of physical surface must remain a centimetre in UV space.
// This measures rendered triangles, independently of their projection method.
function metricTriangle(points, uv) {
  const ab = points[1].clone().sub(points[0]), ac = points[2].clone().sub(points[0])
  const twiceArea = ab.clone().cross(ac).length()
  if (twiceArea < 1e-10) return false
  for (const [i, j] of [[0, 1], [1, 2], [2, 0]]) {
    const actual = points[i].distanceTo(points[j]), mapped = uv[i].distanceTo(uv[j])
    assert(Math.abs(actual - mapped) <= Math.max(5e-5, actual * 2e-5), `escala métrica: ${actual} m / ${mapped} UV`)
  }
  const uvArea = Math.abs((uv[1].x - uv[0].x) * (uv[2].y - uv[0].y) - (uv[1].y - uv[0].y) * (uv[2].x - uv[0].x))
  if (twiceArea > 1e-5) assert(uvArea > twiceArea * .98, 'face física não pode colapsar na textura')
  return true
}
// The previous x+z mapping collapses this ordinary diagonal wall to a line.
assert.throws(() => metricTriangle(
  [new THREE.Vector3(), new THREE.Vector3(1, 0, -1), new THREE.Vector3(0, 1, 0)],
  [new THREE.Vector2(), new THREE.Vector2(), new THREE.Vector2(0, 1)],
), /escala métrica/)

const report = []
for (const [name, save] of Object.entries(scenarios)) {
  const before = JSON.stringify(save), scene = new THREE.Scene(), architecture = criarArquiteturaComplexo(scene, complexoDoEstadio(save))
  const maps = new Set(), allMaps = new Set(), disposeCounts = new Map()
  let triangles = 0, oblique = 0
  try {
    architecture.root.traverse(mesh => {
      if (!mesh.isMesh) return
      const material = mesh.material
      if (material.map) allMaps.add(material.map)
      if (!concreteNames.has(material.name)) return
      maps.add(material.map)
      assert(!material.displacementMap && !material.bumpMap, 'o acabamento não altera altura, relevo nem normais de apoio')
      const geometry = mesh.geometry, position = geometry.getAttribute('position'), uv = geometry.getAttribute('uv'), index = geometry.index
      for (let i = 0; i < (index?.count ?? position.count); i += 3) {
        const indices = [0, 1, 2].map(j => index ? index.getX(i + j) : i + j)
        const points = indices.map(j => new THREE.Vector3().fromBufferAttribute(position, j))
        const mapped = indices.map(j => new THREE.Vector2().fromBufferAttribute(uv, j))
        if (!metricTriangle(points, mapped)) continue
        triangles++
        const normal = points[1].clone().sub(points[0]).cross(points[2].clone().sub(points[0])).normalize()
        if (Math.max(Math.abs(normal.x), Math.abs(normal.y), Math.abs(normal.z)) < .99) oblique++
      }
    })
    assert(triangles > 100 && oblique > 10, `${name}: exercício precisa incluir pisos, paredes e faces inclinadas`)
    assert.equal(maps.size, 1, 'acabamentos de concreto compartilham uma textura')
    for (const map of maps) {
      assert(map && map.generateMipmaps && map.minFilter === THREE.LinearMipmapLinearFilter && map.magFilter === THREE.LinearFilter, 'filtro de distância evita cintilação do poro fino')
      assert.equal(map.colorSpace, THREE.SRGBColorSpace)
      const { width, height, data } = map.image
      const sampleWidth = 1 / (width * map.repeat.x), sampleHeight = 1 / (height * map.repeat.y)
      assert(sampleWidth >= .0005 && sampleWidth <= .002 && sampleHeight >= .0005 && sampleHeight <= .002, 'grão deve medir entre 0,5 e 2 mm')
      let min = 255, max = 0, sum = 0
      for (let i = 0; i < data.length; i += 4) {
        assert.equal(data[i], data[i + 1]); assert.equal(data[i], data[i + 2]); assert.equal(data[i + 3], 255)
        min = Math.min(min, data[i]); max = Math.max(max, data[i]); sum += data[i]
      }
      assert(max > min && max - min <= 8, 'o concreto deve manter variação discreta, sem manchas contrastantes')
      assert(Math.abs(sum / (width * height) - 239.5) < .75, 'não escurecer nem clarear a média anterior do concreto')
    }
    assert.equal(JSON.stringify(save), before)
    report.push({ name, triangles, oblique })
  } finally {
    for (const map of allMaps) map.addEventListener('dispose', () => disposeCounts.set(map, (disposeCounts.get(map) ?? 0) + 1))
    architecture.dispose()
    for (const map of allMaps) assert.equal(disposeCounts.get(map), 1, 'cada mapa deve ser descartado uma vez')
    assert.equal(scene.children.length, 0)
  }
}
console.log('PASS concreto: escala métrica real em pisos/espelhos/oblíquas, regressão x+z, grão milimétrico suave, albedo médio, filtros e descarte.', report)

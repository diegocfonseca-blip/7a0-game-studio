import * as THREE from 'three'

/** Fine fibres supplement the original grass image only at close range. The
 * UVs already describe the complete 105 × 68 m field (including its apron), so
 * adjacent construction strips sample one continuous surface under the boots.
 * Each frequency fades before its cells become smaller than a screen pixel. */
export function materialGramado3D(color: string, map: THREE.Texture) {
  const material = new THREE.MeshStandardMaterial({ color, map, roughness: 1 })
  material.customProgramCacheKey = () => 'presidencia-grass-fibres-v2'
  material.onBeforeCompile = shader => {
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec2 vComplexoGrassPoint;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvComplexoGrassPoint = uv * vec2(105.0, 68.0);')
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>
varying vec2 vComplexoGrassPoint;
float complexoGrassHash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
float complexoGrassNoise(vec2 p) {
  vec2 cell = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(complexoGrassHash(cell), complexoGrassHash(cell + vec2(1.0, 0.0)), f.x),
    mix(complexoGrassHash(cell + vec2(0.0, 1.0)), complexoGrassHash(cell + vec2(1.0, 1.0)), f.x), f.y) - 0.5;
}
float complexoGrassVisible(vec2 footprint, vec2 frequency) {
  vec2 cellsPerPixel = footprint * frequency;
  return 1.0 - smoothstep(0.22, 1.0, max(cellsPerPixel.x, cellsPerPixel.y));
}`)
      .replace('#include <color_fragment>', `#include <color_fragment>
vec2 grassFootprint = fwidth(vComplexoGrassPoint);
vec2 grassFibreFrequency = vec2(95.0, 35.0);
vec2 grassGrainFrequency = vec2(165.0, 135.0);
float grassFibres = complexoGrassNoise(vComplexoGrassPoint * grassFibreFrequency)
  * complexoGrassVisible(grassFootprint, grassFibreFrequency);
float grassGrain = complexoGrassNoise(vComplexoGrassPoint * grassGrainFrequency + vec2(17.0, 41.0))
  * complexoGrassVisible(grassFootprint, grassGrainFrequency);
// A neutral, bounded modulation: keep the image, mowing stripes and club-stage
// colours. At map scale this is exactly 1, so no distant grain or moiré appears.
diffuseColor.rgb *= 1.0 + grassFibres * 0.12 + grassGrain * 0.045;
`)
      .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
// Millimetre-scale relief responds to the existing scene lights. Derivatives
// reuse the filtered fibre field above, so distant turf remains stable and
// the close view gains depth without extra textures or individual grass draws.
float grassRelief = grassFibres * 0.0015 + grassGrain * 0.00035;
vec3 grassDx = dFdx(-vViewPosition), grassDy = dFdy(-vViewPosition);
vec3 grassR1 = cross(grassDy, normal), grassR2 = cross(normal, grassDx);
float grassDet = dot(grassDx, grassR1);
vec3 grassGradient = sign(grassDet) * (dFdx(grassRelief) * grassR1 + dFdy(grassRelief) * grassR2);
normal = normalize(max(abs(grassDet), 1e-12) * normal - grassGradient);
`)
  }
  return material
}

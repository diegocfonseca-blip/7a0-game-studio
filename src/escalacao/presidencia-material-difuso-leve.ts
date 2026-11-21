import * as T from 'three'

/** Superfícies foscas vistas no campo não precisam da reflexão física do bairro.
 * Mantém mapas, cores, uniforme, emissivos, recortes e testes de profundidade.
 * As referências de cor/uniforme continuam compartilhadas com seus controladores. */
export function materialDifusoLeve(source:T.Material):T.Material{
 if(!(source instanceof T.MeshStandardMaterial)||source instanceof T.MeshPhysicalMaterial||source.metalness>.2||source.roughness<.65)return source
 const result=new T.MeshLambertMaterial()
 const keys=['name','color','map','lightMap','lightMapIntensity','aoMap','aoMapIntensity','emissive','emissiveIntensity','emissiveMap','bumpMap','bumpScale','normalMap','normalMapType','normalScale','displacementMap','displacementScale','displacementBias','alphaMap','opacity','transparent','alphaTest','alphaHash','alphaToCoverage','side','shadowSide','vertexColors','flatShading','depthTest','depthWrite','colorWrite','polygonOffset','polygonOffsetFactor','polygonOffsetUnits','wireframe','fog','toneMapped','visible','blending','blendSrc','blendDst','blendEquation','premultipliedAlpha','dithering','userData'] as const
 const target=result as unknown as Record<string,unknown>,original=source as unknown as Record<string,unknown>
 for(const key of keys)if(key in original)target[key]=original[key]
 result.onBeforeCompile=source.onBeforeCompile
 result.customProgramCacheKey=()=>source.customProgramCacheKey()+':difuso-leve'
 return result
}
export function simplificarMateriaisCampo(root:T.Object3D,preserve?:(material:T.Material)=>boolean){
 const converted=new Map<T.Material,T.Material>()
 root.traverse(node=>{if(!(node instanceof T.Mesh))return
  const convert=(source:T.Material)=>{let next=converted.get(source);if(!next){next=preserve?.(source)?source:materialDifusoLeve(source);converted.set(source,next)}return next}
  node.material=Array.isArray(node.material)?node.material.map(convert):convert(node.material)
 })
 // O proprietário escolhe qual variante liberar; os outros recursos continuam
 // sob seus cuidados. Nenhuma geometria, imagem ou uniforme é descartado aqui.
 return(which:'originais'|'novos'='novos')=>{for(const [source,result]of converted)if(source!==result)(which==='originais'?source:result).dispose();converted.clear()}
}

import * as THREE from 'three'

/** Native image supplies grass detail without a custom normal shader. */
export function materialGramado3D(color:string,map:THREE.Texture){
 const material=new THREE.MeshStandardMaterial({color,map,roughness:1})
 material.name='gramado-textura-padrao'
 return material
}

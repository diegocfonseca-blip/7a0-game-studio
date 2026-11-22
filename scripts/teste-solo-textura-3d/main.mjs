// Banca de pré-cálculo: usa o próprio shader aprovado, sem luz, exposição ou
// mudança de arte. O WebGL só roda na geração offline, nunca para este bake no jogo.
import * as T from 'three'
import {materialSoloOriginal3D} from '../../src/escalacao/presidencia-solo-3d.ts'
const renderer=new T.WebGLRenderer({antialias:false,preserveDrawingBuffer:true});renderer.outputColorSpace=T.SRGBColorSpace
const root=new T.Scene(),camera=new T.OrthographicCamera(-1,1,1,-1,0,1),base=materialSoloOriginal3D(false)
const input={vertexShader:'',fragmentShader:`#include <common>\nvoid main(){vec4 diffuseColor=vec4(${base.color.r},${base.color.g},${base.color.b},1.);\n#include <color_fragment>\ngl_FragColor=vec4(diffuseColor.rgb,1.);\n#include <colorspace_fragment>\n}`}
base.onBeforeCompile(input)
const original=input.fragmentShader
window.qaBakeSoil=(layer,width,height)=>{
 const near=layer==='near'?1:0,mid=layer==='far'?0:1
 const fragmentShader=original.replace(/float px=length\(fwidth\(sp\)\), perto=1\.0-smoothstep\(0\.035,0\.14,px\), medio=1\.0-smoothstep\(0\.12,0\.45,px\);/,`float perto=${near}.0,medio=${mid}.0;`)
 if(fragmentShader===original)throw Error('Não encontrou a linha de distância do shader original')
 const material=new T.ShaderMaterial({toneMapped:false,vertexShader:'varying vec2 vSoilUv;void main(){vSoilUv=uv*vec2(125./105.,88./68.)-vec2(10./105.,10./68.);gl_Position=vec4(position.xy,0.,1.);}',fragmentShader})
 const mesh=new T.Mesh(new T.PlaneGeometry(2,2),material);root.add(mesh);renderer.setSize(width,height,false);renderer.render(root,camera)
 const result=renderer.domElement.toDataURL('image/png');root.remove(mesh);mesh.geometry.dispose();material.dispose();return result
}
window.qaReady=true
window.qaCompareSoil=async(diffuse=false)=>{
 const {materialSolo3D}=await import('../../src/escalacao/presidencia-solo-3d.ts'),bakedSource=materialSolo3D(false),scene=new T.Scene()
 const {materialDifusoLeve}=await import('../../src/escalacao/presidencia-material-difuso-leve.ts'),baked=diffuse?materialDifusoLeve(bakedSource):bakedSource
 // Reproduz também carga fria: primeiro desenha o pixel provisório.
 const coldMesh=new T.Mesh(new T.PlaneGeometry(2,2),baked),coldCamera=new T.OrthographicCamera(-1,1,1,-1,.1,10);coldCamera.position.z=1;scene.add(coldMesh);renderer.setSize(32,32,false);renderer.render(scene,coldCamera);scene.remove(coldMesh);coldMesh.geometry.dispose();
 for(let n=0;n<1000&&[baked.map,...baked.userData.extraTextures].some(t=>t.image?.width<=1);n++)await new Promise(r=>setTimeout(r,10))
 if([baked.map,...baked.userData.extraTextures].some(t=>t.image?.width<=1))throw Error('Textura pré-calculada não carregou')
 const mesh=new T.Mesh(new T.PlaneGeometry(105,68),base),camera=new T.PerspectiveCamera(38,1,.08,500)
 mesh.rotation.x=-Math.PI/2;scene.add(mesh,new T.HemisphereLight('#c9dcf0','#8c7d61',.85))
 const sun=new T.DirectionalLight('#fff0d9',2.8);sun.position.set(-340,450,270);scene.add(sun)
 scene.background=new T.Color('#668247');renderer.setSize(640,640,false)
 const output=[]
 for(const [name,position,target]of [['tv',[0,28,76],[0,0,0]],['perto',[1,1.7,3],[0,0,0]],['gol',[40,2,12],[47,0,0]]]){
  camera.position.set(...position);camera.lookAt(...target);camera.updateMatrixWorld()
  const shots=[];for(const mat of [base,baked]){mesh.material=mat;renderer.render(scene,camera);const rgba=new Uint8Array(640*640*4);renderer.getContext().readPixels(0,0,640,640,renderer.getContext().RGBA,renderer.getContext().UNSIGNED_BYTE,rgba);shots.push({png:renderer.domElement.toDataURL('image/png'),rgba})}
  let sum=0,changed=0;const differences=[]
  for(let i=0;i<shots[0].rgba.length;i++){if(i%4===3)continue;const d=Math.abs(shots[0].rgba[i]-shots[1].rgba[i]);sum+=d;differences.push(d);if(d>20)changed++}
  differences.sort((a,b)=>a-b);output.push({name,glError:renderer.getContext().getError(),meanDelta:sum/differences.length,p99:differences[Math.floor(differences.length*.99)],over20:changed/differences.length,antes:shots[0].png,depois:shots[1].png})
 }
 return output
}

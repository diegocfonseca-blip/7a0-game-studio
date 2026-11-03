/** 🏳️ Dia de jogo em casa: bandeiras nos postes e varais de bandeirolas nas ruas perto do estádio.
 * Planta PURA (sem three.js): recebe os postes de rua que a cidade já desenhou e escolhe onde pendurar.
 * Nunca cria poste novo, nunca encosta no chão (tudo fica acima da altura dos ônibus) e o número de
 * peças é limitado — celular leva menos. */
export const STREET_DRESSING=Object.freeze({
 /** Onde a torcida da casa chega (frente do portão dos mandantes). */
 focus:{x:0,z:110},
 maxDistance:230,
 flags:{desktop:12,mobile:8},
 strings:{desktop:6,mobile:4},
 /** Varal só entre postes vizinhos (mesma rua, ~30 m de espaçamento na cidade). */
 stringMin:12,stringMax:48,
 /** Altura (acima do chão) — ônibus têm ~3,8 m. */
 flagBottom:4.1,flagTop:5.8,flagWidth:.78,
 stringHeight:5.9,stringSag:.75,pennantSpacing:.72,
 pennantColors:3,
})

const finite=p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.z)

/** posts: [{x,z,armX?,armZ?}] (arm = direção do braço do poste, que aponta pra rua). */
export function streetDressingPlan(posts,{mobile=false}={}){
 const S=STREET_DRESSING,focus=S.focus
 const near=(Array.isArray(posts)?posts:[]).filter(finite)
  .map((p,index)=>({...p,index,distance:Math.hypot(p.x-focus.x,p.z-focus.z)}))
  .filter(p=>p.distance<=S.maxDistance)
  .sort((a,b)=>a.distance-b.distance||a.index-b.index)
 const chosen=near.slice(0,mobile?S.flags.mobile:S.flags.desktop)
 const flags=chosen.map(p=>{
  let ax=Number.isFinite(p.armX)?p.armX:0,az=Number.isFinite(p.armZ)?p.armZ:0
  const len=Math.hypot(ax,az)
  if(len<1e-6){ax=focus.x-p.x;az=focus.z-p.z}
  const l=Math.hypot(ax,az)||1
  return{post:p.index,x:p.x,z:p.z,dirX:ax/l,dirZ:az/l,heading:Math.atan2(ax/l,az/l)}
 })
 const strings=[],used=new Set()
 for(let i=0;i<chosen.length&&strings.length<(mobile?S.strings.mobile:S.strings.desktop);i++){
  if(used.has(i))continue
  let best=-1,bestD=Infinity
  for(let j=0;j<chosen.length;j++){
   if(j===i||used.has(j))continue
   const d=Math.hypot(chosen[j].x-chosen[i].x,chosen[j].z-chosen[i].z)
   if(d>=S.stringMin&&d<=S.stringMax&&d<bestD){best=j;bestD=d}
  }
  if(best<0)continue
  used.add(i);used.add(best)
  strings.push({a:{x:chosen[i].x,z:chosen[i].z},b:{x:chosen[best].x,z:chosen[best].z},length:bestD})
 }
 const pennants=[]
 for(const [s,str]of strings.entries()){
  const n=Math.max(2,Math.floor(str.length/S.pennantSpacing))
  for(let k=1;k<n;k++){
   const u=k/n
   pennants.push({string:s,u,x:str.a.x+(str.b.x-str.a.x)*u,z:str.a.z+(str.b.z-str.a.z)*u,
    sag:S.stringSag*4*u*(1-u),heading:Math.atan2(str.b.x-str.a.x,str.b.z-str.a.z),color:k%S.pennantColors})
  }
 }
 return{flags,strings,pennants}
}

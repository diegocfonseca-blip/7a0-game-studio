/** Coordenadas registradas na arte 1536×1024. A bola e os pés usam o mesmo
 * gramado; as faces da rede são primeiro plano transparente. */
export const CAMPO_INTERNO=[[220,400],[1290,400],[108,818],[1415,818]] as const
export const CAMPO_MAPA=[[588,311],[911,312],[575,425],[933,425]] as const
export const FACES_REDE=[[[116,534],[158,534],[157,622],[115,622]],[[158,534],[173,534],[189,589],[157,622]],[[1337,533],[1368,533],[1392,622],[1353,622]]] as const
export function linhasDaRede(){
 const mix=(a:readonly[number,number],b:readonly[number,number],t:number)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t] as const
 return FACES_REDE.flatMap((face,side)=>{const [tl,tr,br,bl]=face;return Array.from({length:17},(_,i)=>{const q=i/16;return [{id:side+':v:'+i,a:mix(tl,tr,q),b:mix(bl,br,q)},{id:side+':h:'+i,a:mix(tl,bl,q),b:mix(tr,br,q)}]}).flat()})
}

/** Fixed-view registration of the 105×68m ground to the approved stadium art.
 * The pitch and bodies remain meshes; the surrounding architecture is illustrated.
 * Free orbit must not be enabled while using this projection. */
export type CantosRegistrados=readonly [readonly [number,number],readonly [number,number],readonly [number,number],readonly [number,number]]
export function matrizCameraRegistrada(corners:CantosRegistrados):number[]{
 const source=[[-52.5,-34],[52.5,-34],[-52.5,34],[52.5,34]]
 const rows:number[][]=[]
 source.forEach(([x,z],i)=>{
  const u=corners[i][0]/768-1,v=1-corners[i][1]/512
  rows.push([x,z,1,0,0,0,-u*x,-u*z,u],[0,0,0,x,z,1,-v*x,-v*z,v])
 })
 for(let col=0;col<8;col++){
  let pivot=col;for(let r=col+1;r<8;r++)if(Math.abs(rows[r][col])>Math.abs(rows[pivot][col]))pivot=r
  if(Math.abs(rows[pivot][col])<1e-12)throw new Error('Degenerate stadium registration')
  ;[rows[col],rows[pivot]]=[rows[pivot],rows[col]]
  const d=rows[col][col];for(let c=col;c<=8;c++)rows[col][c]/=d
  for(let r=0;r<8;r++)if(r!==col){const q=rows[r][col];for(let c=col;c<=8;c++)rows[r][c]-=q*rows[col][c]}
 }
 const h=rows.map(row=>row[8])
 const width=(Math.hypot(corners[1][0]-corners[0][0],corners[1][1]-corners[0][1])+Math.hypot(corners[3][0]-corners[2][0],corners[3][1]-corners[2][1]))/2/105
 const depth=Math.hypot((corners[2][0]+corners[3][0]-corners[0][0]-corners[1][0])/2,(corners[2][1]+corners[3][1]-corners[0][1]-corners[1][1])/2)/68
 const height=width*Math.sqrt(Math.max(.01,1-Math.min(1,depth/width)**2))/512
 // Row-major Matrix4.set input. Ground uses the exact homography; height uses
 // the same inferred elevation as the registered art. Near-side meshes win depth.
 return [h[0],0,h[1],h[2], h[3],height,h[4],h[5], 0,-.008,-.008,0, h[6],0,h[7],1]
}

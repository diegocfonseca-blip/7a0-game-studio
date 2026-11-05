/** Variação estável por endereço. Só cenário: não cria compras, renda ou lotes. */
export function arquiteturaDoEndereco(x:number,z:number,variant:number,distant=false){
 const noise=(salt:number)=>{const n=Math.sin((x+salt)*127.1+z*311.7)*43758.5453;return n-Math.floor(n)}
 const floors=[1,2,4,6][variant]??1
 const comercial=!distant&&variant<3&&noise(31)<.14
 const antigo=variant===2||variant===1&&noise(17)>.68
 const tipo=comercial?'fachada-comercial':variant===0?'casa-pequena':antigo?'predio-antigo':variant===1?'sobrado':'edificio-residencial'
 const cores=['#d3c2a4','#b8c7bd','#c5b4a3','#d5cbb6','#b3c4ca','#c5c9b1','#c7af9f','#bac2b3']
 return {tipo,floors,comercial,antigo,
  w:(variant===3?9:variant===2?10.8:10.4)*(.84+noise(7)*.14),
  d:(variant>1?12.1:10.1)*(.88+noise(11)*.1),h:3*floors+.7,
  color:cores[Math.floor(noise(23)*cores.length)],
  roof:variant>1||noise(13)<.28?'laje':noise(19)<.52?'duas-aguas':'quatro-aguas',
  // O endereço distante também pode ser visitado com zoom. Sua fachada não
  // perde os elementos principais; só os pequenos acabamentos têm orçamento.
  frontWall:variant<2&&!comercial&&noise(29)>.23,
  balcony:variant===1&&!comercial&&noise(37)>.35,
  accent:['#5b726b','#6d6660','#697580','#8d684f'][Math.floor(noise(41)*4)],
 }
}

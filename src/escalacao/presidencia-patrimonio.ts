import {carteiraPresidenciaValida,itemPresidencia,valorRevenda,type PresidenciaBem} from './presidencia-economia'

/** Custo de aquisição: todos os bens possuídos, não apenas os expostos. */
export function patrimonioDosBens(owned:readonly PresidenciaBem[]=[]){
 if(!carteiraPresidenciaValida({cash:0,revision:0,owned}))return null
 let cars=0,twoWheels=0,furniture=0,resale=0
 for(const b of owned){
  const slot=itemPresidencia(b.id)!.slot
  if(slot==='carro')cars+=b.paid
  else if(slot==='duas-rodas')twoWheels+=b.paid
  else furniture+=b.paid
  resale+=valorRevenda(b.paid)
 }
 const total=cars+twoWheels+furniture
 return [cars,twoWheels,furniture,resale,total].every(Number.isSafeInteger)?{cars,twoWheels,furniture,resale,total}:null
}
export function patrimonioTotal(data:{cash?:number;stadiumValue?:number;squadValue?:number;owned?:readonly PresidenciaBem[]}){
 // Ausência de inventário conferido não significa patrimônio vazio.
 if(data.owned===undefined)return undefined
 const bens=patrimonioDosBens(data.owned)
 const parts=[data.cash,data.stadiumValue,data.squadValue,bens?.total]
 if(!parts.every(v=>typeof v==='number'&&Number.isSafeInteger(v)&&v>=0))return undefined
 const total=parts.reduce<number>((sum,v)=>sum+(v??0),0)
 return Number.isSafeInteger(total)?total:undefined
}

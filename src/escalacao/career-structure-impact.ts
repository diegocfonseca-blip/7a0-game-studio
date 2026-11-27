import {STADIUM_SECTORS,STADIUM_EXTRAS,STADIUM_STEP,stadiumSeats,stadiumIncomeAt,sectorPct,type StadiumSave} from './estadiodata'
import {estacionamentoDoSave,investirEstacionamento} from './presidencia-estacionamento'
export type StructureImpact={cost:number;progress:number;nextProgress:number;seats:number;nextSeats:number;income:number;nextIncome:number;parking?:{before:number;after:number};variable:boolean;next:StadiumSave}
/** Read-only projection with the same prices, parking transaction and income helpers as the game. */
export function careerStructureImpact(st:StadiumSave|undefined,id:string,kind:'sector'|'extra',occupancy=100,variableStore=false):StructureImpact|null{
 const base:StadiumSave={...st,inv:{...st?.inv},ext:[...(st?.ext??[])]}
 let next:StadiumSave={...base,inv:{...base.inv},ext:[...base.ext]},cost=0,progress=0,nextProgress=100,parking:StructureImpact['parking']
 if(kind==='sector'){
  const s=STADIUM_SECTORS.find(s=>s.k===id);if(!s)return null
  cost=Math.min(STADIUM_STEP,Math.max(0,s.cost-(base.inv[id]??0)));if(!cost)return null
  progress=sectorPct(base,id);next.inv[id]=(base.inv[id]??0)+cost;nextProgress=sectorPct(next,id)
 }else{
  const e=STADIUM_EXTRAS.find(e=>e.k===id);if(!e||base.ext.includes(id))return null
  cost=e.cost
  if(id==='estac'){
   const old=estacionamentoDoSave(base),projected=investirEstacionamento({stadium:base,cash:Number.MAX_SAFE_INTEGER,expectedStage:old.stage})
   if(!projected.ok)return null
   next=projected.value.stadium;cost=projected.charged;progress=old.progress*100;nextProgress=projected.value.parking.progress*100;parking={before:old.capacity,after:projected.value.parking.capacity}
  }else next.ext.push(id)
 }
 const occ=Math.max(0,Math.min(100,Number.isFinite(occupancy)?occupancy:100))/100
 return{cost,progress,nextProgress,seats:stadiumSeats(base).now,nextSeats:stadiumSeats(next).now,income:stadiumIncomeAt(base,occ,variableStore),nextIncome:stadiumIncomeAt(next,occ,variableStore),parking,variable:id==='loja'&&variableStore,next}
}
export const STRUCTURE_VISUALS:Record<string,[string,string]>={
 grama:['O campo de terra ganha gramado conforme o investimento.','The dirt pitch gains grass as construction progresses.'],geral:['O setor Geral cresce ao redor do campo.','The terraces grow around the pitch.'],cadeiras:['O setor ganha cadeiras e lugares para a torcida.','The stand gains seats for supporters.'],visitante:['A área visitante ganha sua própria arquibancada.','The away section gains its own stand.'],camarote:['Os camarotes e o andar superior evoluem no estádio.','The boxes and upper tier develop in the stadium.'],refl:['Os refletores aparecem no estádio e na iluminação noturna.','Floodlights appear at the stadium and in the night lighting.'],telao:['O telão integra a estrutura do estádio.','The big screen joins the stadium structure.'],loja:['A loja ganha espaço na cidade para a torcida comprar camisas.','The shop gains its place in town for supporters to buy shirts.'],estac:['Cada etapa conclui um lote real de vagas no mapa.','Each stage completes a real parking lot on the map.'],praca:['A praça de alimentação passa a ocupar seu lote no bairro.','The food court takes its place in the neighbourhood.'],chopp:['A choperia ganha seu ponto de encontro no bairro.','The beer hall becomes a neighbourhood meeting point.'],estacao:['A estação melhora os acessos e a chegada da torcida.','The station improves access and supporter arrivals.'],cober:['O estádio recebe a cobertura dos setores.','The stadium gains a roof over the stands.'],retratil:['A cobertura ganha o sistema retrátil.','The roof gains its retractable system.'],hotel:['O hotel passa a receber visitantes no bairro do clube.','The hotel welcomes visitors in the club neighbourhood.'],
}

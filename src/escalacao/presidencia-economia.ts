// Regras locais da futura loja. Não lê nem altera conta/save por conta própria.
export const PRESIDENCIA_CATALOGO = [
  {id:'cadeira-simples',slot:'cadeira',price:5,pt:'Cadeira simples',en:'Basic chair'},
  {id:'mesa-simples',slot:'mesa',price:10,pt:'Mesa simples',en:'Basic desk'},
  {id:'estante-simples',slot:'estante',price:15,pt:'Estante de troféus simples',en:'Basic trophy cabinet'},
  {id:'cadeira-couro',slot:'cadeira',price:90,pt:'Cadeira de couro',en:'Leather chair'},
  {id:'mesa-madeira',slot:'mesa',price:120,pt:'Mesa de madeira',en:'Wooden desk'},
  {id:'estante-madeira',slot:'estante',price:80,pt:'Estante de madeira',en:'Wooden trophy cabinet'},
  {id:'tapete',slot:'tapete',price:25,pt:'Tapete da presidência',en:'Office rug'},
  {id:'sofa',slot:'sofa',price:70,pt:'Sofá de couro',en:'Leather sofa'},
  {id:'luminaria',slot:'luminaria',price:20,pt:'Luminária',en:'Floor lamp'},
  {id:'lustre',slot:'lustre',price:60,pt:'Lustre',en:'Chandelier'},
  {id:'quadro',slot:'quadro',price:15,pt:'Moldura da camisa',en:'Shirt frame'},
  {id:'aquario',slot:'aquario',price:100,pt:'Aquário',en:'Aquarium'},
  {id:'planta',slot:'planta',price:10,pt:'Planta',en:'Plant'},
  {id:'fusca',slot:'carro',price:30,pt:"Fusca surradinho",en:"Weathered Fusca"},
  {id:'chevette',slot:'carro',price:50,pt:"Chevette antigo",en:"Classic Chevette"},
  {id:'brasilia',slot:'carro',price:70,pt:"Volkswagen Brasília",en:"Volkswagen Brasília"},
  {id:'kombi',slot:'carro',price:90,pt:"Volkswagen Kombi",en:"Volkswagen Kombi"},
  {id:'uno-escada',slot:'carro',price:100,pt:"Fiat Uno com escada",en:"Fiat Uno with ladder"},
  {id:'celta',slot:'carro',price:120,pt:"Chevrolet Celta",en:"Chevrolet Celta"},
  {id:'gol-gti',slot:'carro',price:150,pt:"Gol quadrado GTI",en:"Gol GTI"},
  {id:'saveiro',slot:'carro',price:190,pt:"Saveiro quadrada",en:"Classic Saveiro"},
  {id:'opala-ss',slot:'carro',price:250,pt:"Opala SS",en:"Opala SS"},
  {id:'golf-gti',slot:'carro',price:320,pt:"Golf GTI",en:"Golf GTI"},
  {id:'veloster',slot:'carro',price:350,pt:"Hyundai Veloster",en:"Hyundai Veloster"},
  {id:'civic',slot:'carro',price:400,pt:"Honda Civic preparado",en:"Tuned Honda Civic"},
  {id:'lancer-evo',slot:'carro',price:550,pt:"Mitsubishi Lancer Evolution",en:"Mitsubishi Lancer Evolution"},
  {id:'song-plus',slot:'carro',price:600,pt:"BYD Song Plus",en:"BYD Song Plus"},
  {id:'skyline-r34',slot:'carro',price:700,pt:"Nissan Skyline R34",en:"Nissan Skyline R34"},
  {id:'supra-mk4',slot:'carro',price:850,pt:"Toyota Supra MK4",en:"Toyota Supra MK4"},
  {id:'z4',slot:'carro',price:900,pt:"BMW Z4 conversível",en:"BMW Z4 convertible"},
  {id:'m3-gtr',slot:'carro',price:1000,pt:"BMW M3 GTR",en:"BMW M3 GTR"},
  {id:'escalade',slot:'carro',price:1100,pt:"Cadillac Escalade",en:"Cadillac Escalade"},
  {id:'challenger',slot:'carro',price:1200,pt:"Dodge Challenger Hellcat",en:"Dodge Challenger Hellcat"},
  {id:'g63',slot:'carro',price:1400,pt:"Mercedes-AMG G 63",en:"Mercedes-AMG G 63"},
  {id:'f40',slot:'carro',price:1500,pt:"Ferrari F40",en:"Ferrari F40"},
  {id:'911-gt3',slot:'carro',price:1750,pt:"Porsche 911 GT3 RS",en:"Porsche 911 GT3 RS"},
  {id:'720s',slot:'carro',price:1800,pt:"McLaren 720S",en:"McLaren 720S"},
  {id:'aventador',slot:'carro',price:2000,pt:"Lamborghini Aventador",en:"Lamborghini Aventador"},
  {id:'bike-usada',slot:'duas-rodas',price:5,pt:"Bicicleta usada",en:"Used bicycle"},
  {id:'bicicleta',slot:'duas-rodas',price:20,pt:"Bicicleta simples",en:"Basic bicycle"},
  {id:'mobilete',slot:'duas-rodas',price:30,pt:"Mobilete antiga",en:"Classic moped"},
  {id:'bmx',slot:'duas-rodas',price:40,pt:"Caloi Cross / BMX",en:"Caloi Cross / BMX"},
  {id:'pop100',slot:'duas-rodas',price:50,pt:"Honda Pop 100",en:"Honda Pop 100"},
  {id:'biz',slot:'duas-rodas',price:65,pt:"Honda Biz",en:"Honda Biz"},
  {id:'cg-titan',slot:'duas-rodas',price:80,pt:"Honda CG Titan",en:"Honda CG Titan"},
  {id:'rd135',slot:'duas-rodas',price:120,pt:"Yamaha RD 135",en:"Yamaha RD 135"},
  {id:'twister',slot:'duas-rodas',price:160,pt:"Honda CBX 250 Twister",en:"Honda CBX 250 Twister"},
  {id:'xt660',slot:'duas-rodas',price:200,pt:"Yamaha XT660",en:"Yamaha XT660"},
  {id:'hornet',slot:'duas-rodas',price:280,pt:"Honda Hornet",en:"Honda Hornet"},
  {id:'xj6',slot:'duas-rodas',price:300,pt:"Yamaha XJ6",en:"Yamaha XJ6"},
  {id:'fat-boy',slot:'duas-rodas',price:350,pt:"Harley-Davidson Fat Boy",en:"Harley-Davidson Fat Boy"},
  {id:'f800gs',slot:'duas-rodas',price:400,pt:"BMW F 800 GS",en:"BMW F 800 GS"},
  {id:'r1250gs',slot:'duas-rodas',price:550,pt:"BMW R 1250 GS",en:"BMW R 1250 GS"},
  {id:'s1000rr',slot:'duas-rodas',price:800,pt:"BMW S 1000 RR",en:"BMW S 1000 RR"},
  {id:'ninja-h2',slot:'duas-rodas',price:900,pt:"Kawasaki Ninja H2",en:"Kawasaki Ninja H2"},
] as const
// IDs anteriores da bancada: somente leitura/revenda; nunca somem com bens
// existentes nem transformam um esportivo genérico em Ferrari mais cara.
const PRESIDENCIA_LEGADO = [
  {id:'moto-basica',slot:'duas-rodas',price:80,pt:'Moto básica',en:'Basic motorcycle'},
  {id:'carro-popular',slot:'carro',price:150,pt:'Carro popular',en:'Economy car'},
  {id:'moto-custom',slot:'duas-rodas',price:350,pt:'Moto custom · estilo Harley-Davidson',en:'Custom motorcycle · Harley-Davidson style'},
  {id:'carro-executivo',slot:'carro',price:500,pt:'Carro executivo',en:'Executive car'},
  {id:'carro-esportivo',slot:'carro',price:1000,pt:'Esportivo · estilo Ferrari',en:'Sports car · Ferrari style'},
] as const
export type PresidenciaItemId = typeof PRESIDENCIA_CATALOGO[number]['id'] | typeof PRESIDENCIA_LEGADO[number]['id']
export type PresidenciaSlot = typeof PRESIDENCIA_CATALOGO[number]['slot']
export type PresidenciaBem = {id:PresidenciaItemId; paid:number}
export type PresidenciaCarteira = {cash:number; revision:number; owned:PresidenciaBem[]}
export type PresidenciaPedido = {kind:'buy'|'sell'; id:PresidenciaItemId; replaceId?:PresidenciaItemId}
export type PresidenciaOrcamento = {
  snapshot:string; pedido:PresidenciaPedido; sale:PresidenciaBem|null;
  credit:number; price:number; finalCash:number
}
export type PresidenciaErro = 'invalid-state'|'unknown-item'|'already-owned'|'not-owned'|'insufficient-cash'|'stale-quote'|'confirmation-required'|'slot-full'|'invalid-replacement'
type Resultado<T> = {ok:true; value:T}|{ok:false; error:PresidenciaErro}
export const itemPresidencia = (id:string) => PRESIDENCIA_CATALOGO.find(p=>p.id===id) ?? PRESIDENCIA_LEGADO.find(p=>p.id===id)
const item = itemPresidencia
const inteiro = (n:unknown):n is number => Number.isSafeInteger(n) && (n as number)>=0
export const capacidadePresidencia=(slot:PresidenciaSlot)=>slot==='carro'||slot==='duas-rodas'?2:1

// Inteiros: evita 90 * .7 resultar em 62.999... e pagar uma moeda a menos.
export function valorRevenda(paid:number):number {
  if(!inteiro(paid))throw new Error('invalid-paid')
  return Math.floor(paid/10)*7+Math.floor((paid%10)*7/10)
}

// Save antigo sem campo novo começa SEM bens; nunca concede a sala da prévia.
export function carteiraPresidenciaVazia(cash:number):PresidenciaCarteira {
  if(!inteiro(cash))throw new Error('invalid-cash')
  return {cash,revision:0,owned:[]}
}
export function carteiraPresidenciaValida(value:unknown):value is PresidenciaCarteira {
  if(!value || typeof value!=='object')return false
  const v=value as PresidenciaCarteira
  if(!inteiro(v.cash)||!inteiro(v.revision)||!Array.isArray(v.owned))return false
  const slots=new Map<PresidenciaSlot,number>(),ids=new Set<string>()
  for(const b of v.owned){
    if(!b||typeof b.id!=='string'||!inteiro(b.paid))return false
    const p=item(b.id)
    if(!p||ids.has(b.id))return false
    const count=(slots.get(p.slot)??0)+1
    if(count>capacidadePresidencia(p.slot))return false
    slots.set(p.slot,count);ids.add(b.id)
  }
  return true
}
const snapshot = (v:PresidenciaCarteira) => JSON.stringify([v.cash,v.revision,
  v.owned.map(b=>[b.id,b.paid]).sort((a,b)=>String(a[0]).localeCompare(String(b[0])))])

export function orcarPresidencia(state:PresidenciaCarteira,pedido:PresidenciaPedido):Resultado<PresidenciaOrcamento> {
  if(!carteiraPresidenciaValida(state))return {ok:false,error:'invalid-state'}
  if(!pedido||typeof pedido!=='object')return {ok:false,error:'unknown-item'}
  const target=item(pedido.id)
  if(!target || !['buy','sell'].includes(pedido.kind))return {ok:false,error:'unknown-item'}
  if(pedido.kind==='buy'&&!PRESIDENCIA_CATALOGO.some(p=>p.id===pedido.id))return {ok:false,error:'unknown-item'}
  const current=state.owned.find(b=>b.id===target.id)
  if(pedido.kind==='buy'&&current)return {ok:false,error:'already-owned'}
  if(pedido.kind==='sell'&&!current)return {ok:false,error:'not-owned'}
  const replacement=pedido.replaceId?state.owned.find(b=>b.id===pedido.replaceId):undefined
  if(pedido.replaceId&&(pedido.kind!=='buy'||!replacement||item(replacement.id)?.slot!==target.slot))return {ok:false,error:'invalid-replacement'}
  const inSlot=state.owned.filter(b=>item(b.id)?.slot===target.slot)
  // Nunca escolhe um bem do jogador para vender silenciosamente.
  if(pedido.kind==='buy'&&!replacement&&inSlot.length>=capacidadePresidencia(target.slot))return {ok:false,error:'slot-full'}
  const sale=pedido.kind==='sell'?{...current!}:replacement?{...replacement}:null
  const credit=sale?valorRevenda(sale.paid):0
  const price=pedido.kind==='buy'?target.price:0
  // Somar primeiro pode arredondar antes de descontar a compra, mesmo quando
  // o saldo final cabe em Number. Calcula a troca inteira sem perder moedas.
  const exactCash=BigInt(state.cash)+BigInt(credit)-BigInt(price)
  if(exactCash<0n)return {ok:false,error:'insufficient-cash'}
  if(exactCash>BigInt(Number.MAX_SAFE_INTEGER))return {ok:false,error:'invalid-state'}
  const finalCash=Number(exactCash)
  if(!inteiro(finalCash)||state.revision===Number.MAX_SAFE_INTEGER)return {ok:false,error:'invalid-state'}
  return {ok:true,value:{snapshot:snapshot(state),pedido:{...pedido},sale,credit,price,finalCash}}
}

// Chamador deve mostrar o orçamento e pedir confirmação. Confirmação nunca
// confia no crédito/preço enviados pela UI; recalcula sobre o estado atual.
export function confirmarPresidencia(state:PresidenciaCarteira,quote:PresidenciaOrcamento,confirmed:boolean):Resultado<PresidenciaCarteira> {
  if(!confirmed)return {ok:false,error:'confirmation-required'}
  if(!carteiraPresidenciaValida(state))return {ok:false,error:'invalid-state'}
  if(!quote||typeof quote!=='object')return {ok:false,error:'stale-quote'}
  if(snapshot(state)!==quote.snapshot)return {ok:false,error:'stale-quote'}
  const fresh=orcarPresidencia(state,quote.pedido)
  if(!fresh.ok)return fresh
  const q=fresh.value
  if(JSON.stringify(q)!==JSON.stringify(quote))return {ok:false,error:'stale-quote'}
  const owned=state.owned.filter(b=>b.id!==q.sale?.id).map(b=>({...b}))
  if(q.pedido.kind==='buy')owned.push({id:q.pedido.id,paid:q.price})
  return {ok:true,value:{cash:q.finalCash,revision:state.revision+1,owned}}
}

export const PRESIDENCIA_ERROS:Record<PresidenciaErro,readonly [string,string]> = {
 'invalid-state':['Não foi possível conferir seus bens. Reabra a carreira antes de comprar.','Your inventory could not be verified. Reopen your career before buying.'],
 'unknown-item':['Este item não está no catálogo.','This item is not in the catalogue.'],
 'already-owned':['Você já possui este item.','You already own this item.'],
 'not-owned':['Você não possui este item para vender.','You do not own this item.'],
 'insufficient-cash':['Faltam moedas, mesmo com a revenda. Seu item atual será mantido.','Not enough coins, even with the trade-in. Your current item will be kept.'],
 'stale-quote':['Seu saldo ou seus bens mudaram. Confira os valores novamente.','Your balance or inventory changed. Review the amounts again.'],
 'confirmation-required':['Confirme os valores antes de concluir.','Confirm the amounts before completing the transaction.'],
 'slot-full':['Não há vaga livre nessa categoria. Escolha qual item deseja trocar ou venda um dos seus bens.','No free space in this category. Choose an item to trade in or sell one of your items.'],
 'invalid-replacement':['Escolha um bem seu da mesma categoria para a troca.','Choose an item you own from the same category to trade in.'],
}

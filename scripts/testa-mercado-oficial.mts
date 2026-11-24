import assert from 'node:assert/strict'
import {mercadoAnualOficial} from '../src/escalacao/mercado-bots-oficial'
import {reducer,INITIAL,completaBancoDosBots,ident,categoriaOficialOk,cartaDeClubeBrasileiro} from '../src/escalacao/store'
import {carregaBaralhoOficial} from '../src/escalacao/baralho-oficial-carga'
import {_forcaBrasilOficialParaTeste,botBancoParaTeste} from '../src/escalacao/sport'
import {FORMATIONS,SECTORS} from '../src/escalacao/types'
import {mulberry} from '../src/escalacao/pyramidseason'

const need=FORMATIONS['4-3-3']
// Fichas controladas só da bancada: tornam verificável escolher titular versus reserva.
const squad=SECTORS.flatMap(pos=>Array.from({length:need[pos]*2},(_,k)=>({name:`fixture-${pos}-${k}`,club:'Fixture',pos,lo:k<need[pos]?70:40,hi:k<need[pos]?70:40})))
const card=(name:string,pos:any,level:number)=>({name,club:'Fixture',pos,lo:level,hi:level})
const lat=card('reforco-titular','LAT',80),gk=card('apenas-reserva','GOL',65)
const input={clubes:[{chave:'x',nome:'Clube fixture',div:'B',squad,need,caixa:100,compromissos:60,perfil:'equilibrado' as const}],catalogo:[lat,gk],ocupados:new Set(squad.map(ident)),seed:56,season:4,identidade:ident,elegivel:()=>true,preco:()=>10,salario:()=>1,contratar:(c:any)=>({...c})}
const out=mercadoAnualOficial(input)
assert.equal(out.movimentos.find(m=>m.tipo==='titular')?.entra,ident(lat),'prioriza ganho real no XI, mesmo quando outra compra melhora mais o pior reserva')
assert(out.clubes[0].caixa>=60,'não gasta reserva dos compromissos')
assert.equal(squad.length,22,'planejamento não altera entrada')
assert.deepEqual(mercadoAnualOficial(input),out,'decisão determinística')
assert.equal(mercadoAnualOficial({...input,clubes:[{...input.clubes[0],caixa:55}]}).movimentos.length,0,'déficit não cria caixa ou contratação')
assert.equal(mercadoAnualOficial({...input,ocupados:new Set([...input.ocupados,ident(lat),ident(gk)])}).movimentos.length,0,'não rouba jogador de outro dono')
assert.equal(mercadoAnualOficial({...input,elegivel:()=>false}).movimentos.length,0,'respeita limite de categoria')
assert.equal(mercadoAnualOficial({...input,salario:c=>[lat.name,gk.name].includes(c.name)?100:1}).movimentos.length,0,'novo salário também precisa caber')
console.log('PASS seleção por titular, caixa, compromissos, salário futuro, dono, categoria e determinismo')

_forcaBrasilOficialParaTeste(true);botBancoParaTeste(true);await carregaBaralhoOficial()
const randOriginal=Math.random
for(const nome of ['Gama','Portuguesa','ABC','Flamengo']){
 Math.random=mulberry(20261123)
 let s=reducer(INITIAL,{type:'START_CAREER_SOLO',teamName:nome,formation:'4-3-3',rivals:5,oficial:{clube:nome}})
 Math.random=randOriginal
 const humano=JSON.stringify(s.managers[0]),caixaHumano=s.careerCoins?.[0]
 const times=(st:any)=>[...st.managers.map(m=>({nome:m.teamName,key:'m'+m.id,sq:m.squad})),...Object.entries(st.cpuSquads??{}).map(([nome,sq])=>({nome,key:nome,sq}))]
 const before=times(s),counts=(ts:any[])=>{const m=new Map<string,number>();for(const t of ts)for(const c of t.sq)m.set(ident(c),(m.get(ident(c))??0)+1);return m}
 const occupied=counts(before),price={...s.clubCash}
 const inicio=performance.now();const transacoes=completaBancoDosBots(s)?.movimentos??[];const ms=Math.round(performance.now()-inicio)
 assert.equal(JSON.stringify(s.managers[0]),humano,'humano/históricos não são alterados pela gestão dos bots')
 assert.equal(s.careerCoins?.[0],caixaHumano)
 assert.equal(s.oficialMercadoBotsSeason,1)
 const after=times(s),alteradas=new Set<string>()
 for(const t of after){
  const old=before.find(x=>x.key===t.key)!,oldIds=new Set(old.sq.map(ident))
  const novas=t.sq.filter(c=>!oldIds.has(ident(c)))
  if(novas.length)alteradas.add(s.careerPlacements![t.key])
  for(const c of novas){assert(cartaDeClubeBrasileiro(c));assert(categoriaOficialOk(s.careerPlacements![t.key],c));assert(c.valorBaseCarreira!>0);assert(c.contratoAte!>=1)}
  const vendas=transacoes.filter(m=>m.vendedor===t.nome).reduce((n,m)=>n+m.preco,0)
  const compras=transacoes.filter(m=>m.clube===t.nome).reduce((n,m)=>n+m.preco,0)
  if(price[t.key]!=null)assert.equal(price[t.key]- (s.clubCash?.[t.key]??0),compras-vendas,'toda chegada paga, venda recebida do comprador; dispensa não cria receita')
  else assert.equal(novas.length,0,'sem divisão nacional não recebe mercado novo')
  for(const pos of SECTORS)assert(t.sq.filter(c=>c.pos===pos&&!c.fake).length>=need[pos],t.nome+' mantém XI')
 }
 for(const [id,n] of counts(after))assert(n<=Math.max(1,occupied.get(id)??0),'não cria cópia de '+id)
 assert(alteradas.size>=2,'mercado alcança mais de uma divisão, independentemente do usuário')
 const fechado=JSON.stringify(s);completaBancoDosBots(s);assert.equal(JSON.stringify(s),fechado,'retomar não repete gastos')
 const online=structuredClone(s);online.onlineMode='online';online.oficialMercadoBotsSeason=undefined
 const onlineAntes=JSON.stringify(online);completaBancoDosBots(online);assert.equal(JSON.stringify(online),onlineAntes,'salas online fora do ajuste')
 const antigo=structuredClone(s);antigo.seasonNo=3;antigo.oficial!.economiaDesde=4;antigo.oficialMercadoBotsSeason=undefined
 completaBancoDosBots(antigo);assert.equal(antigo.oficialMercadoBotsSeason,undefined,'legado antes da adesão mantém caminho anterior')
 console.log('PASS mundo',nome,'divisões com contratações', [...alteradas].sort().join(','),'janela-ms',ms)
}

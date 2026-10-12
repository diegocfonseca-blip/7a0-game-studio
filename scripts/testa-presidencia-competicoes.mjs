import assert from 'node:assert/strict'
import {contextoPartidaCompeticao} from '../src/escalacao/presidencia-partida-competicao.ts'
const team=(teamId,s)=>({teamId,xi:['GOL','LAT','LAT','ZAG','ZAG','MEI','MEI','MEI','ATA','ATA','ATA'].map((pos,i)=>({id:s+i,name:s+i,pos})),squad:[]})
const home=team(7,'h'),away=team(8,'a'),stadiums={7:{inv:{grama:10},ext:[]},8:{inv:{grama:30},ext:['asfalto']}}
home.squad=[...home.xi,{id:'reserve',name:'Reserva',pos:'ATA'},{id:'placeholder',name:'Fake',pos:'ATA',fake:true}]
const input={enabled:true,id:'season:copa:semi:leg:0',speed:4,home,away,stadiums},original=JSON.stringify(input)
const first=contextoPartidaCompeticao(input),second=contextoPartidaCompeticao({...input,id:'season:copa:semi:leg:1',home:away,away:home})
assert.equal(first.home,home.xi);assert.equal(second.home,away.xi)
assert.equal(first.homeClubId,7);assert.equal(second.homeClubId,8)
assert.equal(first.stadium,stadiums[7]);assert.equal(second.stadium,stadiums[8]);assert.equal(first.speed,4)
assert.ok(first.homeBench.some(p=>p.id==='reserve'));assert.ok(!first.homeBench.some(p=>p.fake))
assert.equal(contextoPartidaCompeticao({...input,enabled:false}),undefined,'Disabled/private gate cannot create a 3D competition')
assert.equal(contextoPartidaCompeticao({...input,home:{...home,xi:home.xi.slice(1)}}),undefined,'Incomplete lineup cannot fabricate a goalkeeper')
assert.equal(contextoPartidaCompeticao({...input,away:{...away,xi:away.xi.map((p,i)=>i===2?{...p,fake:true}:p)}}),undefined)
const intl=contextoPartidaCompeticao({...input,id:'season:intl:champions:final',home:{...away,teamId:-1}})
assert.equal(intl.homeClubId,undefined);assert.equal(intl.stadium,undefined,'An institution without a club venue cannot inherit the user stadium')
assert.equal(intl.home,away.xi);assert.equal(JSON.stringify(input),original,'Adapter cannot mutate squads or construction saves')
console.log('PASS: cup first/second legs, actual XI and reserves, venue ownership, private gate, invalid XI rejection and international institution without invented venue.')

import {reducer} from '../src/escalacao/store'
import {CATALOG} from '../src/escalacao/data'
import {FORMATIONS,SECTORS,type EscState} from '../src/escalacao/types'
import {FOOTBALL_OWNER_UID} from '../src/escalacao/football-live-tactics'
export function footballTestState(competition='league',field=false){
 let s=reducer({} as EscState,{type:'NEW_GAME'})
 s=reducer(s,{type:'START_ONLINE',roomId:'00000000-0000-0000-0000-000000000001',roomCode:'TESTELOCAL',isHost:true,playerIndex:0,playerNames:['Neymarzetti','Futpoint FC','Lavras FC','Amigos FC'],seatUids:[FOOTBALL_OWNER_UID,'eb02f1d6-de80-4304-ab49-512342f3c7b7',FOOTBALL_OWNER_UID,FOOTBALL_OWNER_UID],youUid:FOOTBALL_OWNER_UID,formation:'4-3-3',deck:'br',copaMode:competition==='champions'?'champions':competition==='liberta'?'liga_liberta':'liga_copa',campo2d:field} as never)
 s.seed=20261122
 s=reducer(s,{type:'REPLAY_SEASON'})
 s.managers=s.managers.map((m,i)=>({...m,squad:SECTORS.flatMap(pos=>CATALOG[pos].slice(i*5,i*5+FORMATIONS['4-3-3'][pos]).map((c,j)=>({...c,id:`qa-${i}-${pos}-${j}`,pos,paid:5,via:'leilao' as const})))}))
 s.seed=20261122;s.simSpeed=1;s.manualRoom=true
 if(competition==='bafo-bye'||competition==='bafo-playing'||competition==='bafo-bye-3'){
  s.managers=s.managers.slice(0,competition.endsWith('-3')?3:5).map(m=>({...m,isHuman:true}))
  s.bafo2=true;s.ligaFechada=true;s.copaMode='liga'
  s.seatUids=[FOOTBALL_OWNER_UID,'eb02f1d6-de80-4304-ab49-512342f3c7b7','b068eff2-098f-4370-87de-3f90dd7b12f6','qa-human-3','qa-human-4']
  s=reducer(s,{type:'REPLAY_SEASON'})
  const own=(games:[number,number][])=>games.some(([h,a])=>h===s.managers[s.youIdx].id||a===s.managers[s.youIdx].id)
  const at=s.fixtures.findIndex((games,i)=>competition!=='bafo-playing'?!own(games):own(games)&&!!s.fixtures[i+1]&&!own(s.fixtures[i+1]))
  if(at<0)throw new Error('A bancada precisa de uma rodada de folga válida')
  while(s.round<=at)s=reducer(s,{type:'PLAY_ROUND'})
  return s
 }
 if(competition==='champions')return reducer(s,{type:'PLAY_CHAMPIONS_RODADA'})
 if(competition==='liberta'||competition==='cup'){
  s.league.find(t=>t.id===s.managers[s.youIdx].id)!.pts=1000
  while(s.round<s.fixtures.length)s=reducer(s,{type:'PLAY_ROUND'})
  s=reducer(s,{type:'FINISH_SEASON'})
  if(competition==='liberta'){s=reducer(s,{type:'START_LIBERTA'});return reducer(s,{type:'PLAY_LIBERTA_RODADA'})}
  s=reducer(s,{type:'START_COPA'})
  return reducer(s,{type:'PLAY_COPA_LEG'})
 }
 if(competition==='waiting')return s
 return reducer(s,{type:'PLAY_ROUND'})
}

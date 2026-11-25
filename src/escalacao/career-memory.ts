/** Club-specific, factual history. Does not simulate or affect match results. */
export type MemoryGame={id:string;season:number;competition:string;opponent:string;home:boolean;gf:number;ga:number;players:{id:string;name:string;goals:number;assists:number}[]}
export type ClubMemory={season:number;seen:string[];recent:Omit<MemoryGame,'players'>[];seasons:Record<string,{games:number;wins:number;draws:number;losses:number;gf:number;ga:number}>;players:Record<string,{name:string;games:number;goals:number;assists:number}>;streak:number;bestStreak:number;biggest?:Omit<MemoryGame,'players'>}
export function rememberGame(old:ClubMemory|undefined,game:MemoryGame):ClubMemory|undefined{
 if(!game.id||game.id.length>240||!Number.isInteger(game.season)||game.season<1||!Number.isInteger(game.gf)||!Number.isInteger(game.ga)||game.gf<0||game.ga<0||game.gf>99||game.ga>99||game.players.length>14)return old
 if(old&&(game.season<old.season||game.season===old.season&&old.seen.includes(game.id)))return old
 const s=old?.seasons[String(game.season)]??{games:0,wins:0,draws:0,losses:0,gf:0,ga:0}
 const seasons:ClubMemory['seasons']={...old?.seasons,[game.season]:{games:s.games+1,wins:s.wins+Number(game.gf>game.ga),draws:s.draws+Number(game.gf===game.ga),losses:s.losses+Number(game.gf<game.ga),gf:s.gf+game.gf,ga:s.ga+game.ga}}
 // Current-season IDs prevent repeat credit even after the recent-match list is trimmed.
 const seen=old?.season===game.season?[...old.seen,game.id]:[game.id]
 if(seen.length>300)return old
 const players={...old?.players}
 for(const p of game.players){if(!p.id||!p.name||!Number.isInteger(p.goals)||!Number.isInteger(p.assists)||p.goals<0||p.assists<0)continue;const n=players[p.id]??{name:p.name,games:0,goals:0,assists:0};players[p.id]={name:p.name,games:n.games+1,goals:n.goals+p.goals,assists:n.assists+p.assists}}
 const {players:_,...row}=game,streak=game.gf>=game.ga?(old?.streak??0)+1:0
 return {season:game.season,seen,recent:[...(old?.recent??[]),row].slice(-120),seasons:Object.fromEntries(Object.entries(seasons).slice(-200)),players:Object.fromEntries(Object.entries(players).sort((a,b)=>(b[1].goals+b[1].assists+b[1].games)-(a[1].goals+a[1].assists+a[1].games)).slice(0,300)),streak,bestStreak:Math.max(old?.bestStreak??0,streak),biggest:game.gf>game.ga&&(!old?.biggest||game.gf-game.ga>old.biggest.gf-old.biggest.ga)?row:old?.biggest}
}

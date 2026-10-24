import * as T from 'three';
import {criarPartidaComplexo} from '../../src/escalacao/presidencia-complexo-partida.ts';
try{
 const dataset=new URLSearchParams(location.search).get('dataset')??'neymarzetti-current';if(!/^[a-z0-9-]+$/.test(dataset))throw Error('Fixture inválida');
 const fixture=await fetch('../../test-results/animation-library/'+dataset+'/football-input.json').then(r=>r.json()),{input,sourceMatch,context,president}=fixture;
 const roster=cs=>cs.map((p,i)=>({id:String(i),name:p.name,pos:p.pos,fake:p.fake}));
 const state={viewerClubId:sourceMatch.awayClubId,officialInput:input,officialTeams:[sourceMatch.home,sourceMatch.away],context:{id:'world-review-'+dataset,homeClubId:sourceMatch.homeClubId,awayClubId:sourceMatch.awayClubId,home:roster(input.casa),away:roster(input.fora),...context},minute:0,homeScore:0,awayScore:0,paused:true,finished:false,homeColor:'#c2452f',awayColor:'#f0efef'};
 const scene=new T.Scene(),game=criarPartidaComplexo(scene,undefined,state,undefined,()=>president);
 window.worldReview={ready:()=>{game.update(state,0);return!!game.inspect().detail?.sidelines},seek(minute){game.update({...state,minute},minute*1000);return{...game.inspect(),visibleAvatars:scene.getObjectsByProperty('name','football-civil-style').filter(p=>p.visible).length,avatarPool:scene.getObjectsByProperty('name','football-civil-style').map(p=>p.uuid)}},inspect:()=>game.inspect(),legacyVisible:()=>{const names=['match-referee','home-technical-area','away-technical-area'];return names.map(name=>({name,visible:scene.getObjectByName(name)?.visible}))},dispose:()=>game.dispose()};
}catch(error){window.worldReviewError=error.stack}

const angle=a=>Math.atan2(Math.sin(a),Math.cos(a));
/** A rebound's velocity is not the direction from which the shot arrived.
 * Keep the shot-facing stance while preparing its collection; otherwise a
 * future post bounce turns the keeper's back before the shot even reaches him. */
export function keeperCatchIntent(catchCue,agenda,sideOf){
 const side=sideOf(catchCue.key);
 const shot=agenda.findLast(a=>a.kind==='toque'&&['chute','chutao','cabeceio_gol'].includes(a.tipo)&&a.t<catchCue.t&&catchCue.t-a.t<3&&sideOf(a.key)!==side);
 if(!shot||!Number.isFinite(shot.dir))return{heading:catchCue.dir,shot:null};
 return{heading:angle(shot.dir+Math.PI),shot:shot.id};
}

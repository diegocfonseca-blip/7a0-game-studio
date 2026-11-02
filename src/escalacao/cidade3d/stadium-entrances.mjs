/** Physical entrance identifiers, not club/database IDs. Exactly three gates.
 * The service opening has its own western tunnel, opposite the visiting stand;
 * the two public portals retain their registered positions and purchases. */
export const STADIUM_SERVICE_GATE=Object.freeze({id:'service',role:'service-and-delegations',threshold:{x:-90.4,z:0},inside:{x:-57.5,z:0},approach:{x:-94,z:0},heading:-Math.PI/2,width:1.8,height:2.6,floor:.16});
export const STADIUM_HOME_GATE=Object.freeze({id:'mandantes',approach:{x:0,z:116},threshold:{x:0,z:82},inside:{x:0,z:62},width:10,height:4.2,floor:.16,heading:0});
export const STADIUM_AWAY_GATE=Object.freeze({id:'visitantes',approach:{x:120,z:6},threshold:{x:105,z:6},inside:{x:82.5,z:6},width:8,height:4.2,floor:.16,heading:Math.PI/2});
export const STADIUM_ENTRANCES=Object.freeze([
 {id:'service',role:'service-and-delegations',gate:STADIUM_SERVICE_GATE,label:'SERVIÇO E DELEGAÇÕES',allowed:['home-team','away-team','coaches','staff','medical','ball-attendants']},
 {id:'owner-supporters',role:'save-owner-supporters',gate:STADIUM_HOME_GATE,label:'TORCIDA DO CLUBE',allowed:['owner-supporters']},
 {id:'rival-supporters',role:'rival-supporters',gate:STADIUM_AWAY_GATE,label:'TORCIDA VISITANTE',allowed:['rival-supporters']},
]);
export function entrancesForViewer(side='home'){return side==='away'?STADIUM_ENTRANCES.map(e=>e.id==='service'?e:{...e,gate:e.id==='owner-supporters'?STADIUM_AWAY_GATE:STADIUM_HOME_GATE}):STADIUM_ENTRANCES;}
export function entranceForRole(role,viewerSide='home'){return entrancesForViewer(viewerSide).find(e=>e.allowed.includes(role));}
/** Common internal-to-external service walk for every staff role. */
export function serviceExitPoints(_lane){return[{...STADIUM_SERVICE_GATE.inside,y:.16},{...STADIUM_SERVICE_GATE.threshold,y:.16},{...STADIUM_SERVICE_GATE.approach,y:.16}];}

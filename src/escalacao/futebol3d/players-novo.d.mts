import type {Scene,PerspectiveCamera} from 'three'
import type {EstadoPartidaEstadio} from '../presidencia-partida-model'
import type {QuadroFutebol} from '../presidencia-futebol-motor'
import type {loadPlayers} from './players.mjs'
type Antigo=Awaited<ReturnType<typeof loadPlayers>>
// (a inspeção do boneco novo é menor que a do antigo; os campos que faltam só servem pra bancada de QA)
export function loadPlayersNovo(scene:Scene,state:EstadoPartidaEstadio,frame:QuadroFutebol,options?:{onPrepared?:()=>void}):Promise<{
 update(frame:QuadroFutebol,camera?:PerspectiveCamera,viewportHeight?:number):void;
 presentFrame(frame:QuadroFutebol):QuadroFutebol;
 prepared():Promise<unknown>;
 inspect:Antigo['inspect'];
 inspectActors():{slots:Array<{slot:number;key:string;heading:number|null;visible:boolean;detail:string;tiro:string|null}>};
 dispose():void;
}>

import type {Scene,PerspectiveCamera} from 'three'
import type {EstadoPartidaEstadio} from '../presidencia-partida-model'
import type {QuadroFutebol} from '../presidencia-futebol-motor'
export function loadPlayers(scene:Scene,state:EstadoPartidaEstadio,frame:QuadroFutebol):Promise<{
 update(frame:QuadroFutebol,camera?:PerspectiveCamera,viewportHeight?:number):void;
 inspect():{full:number;intermediate:number;far:number;hidden:number;poseUpdates:number;minFootHeight:number;maxFootHeight:number;physicalPlayerHeight:number;locomotionCalibrated:boolean;captureCoverage?:{matched:boolean;available:number;rejected:number};activeCaptures?:Array<{key:string;type:string;time:number;contactGap:number;minFloor:number}>};
 inspectPose(key:string):{key:string;position:number[];bones:Array<{name:string;position:number[];quaternion:number[]}>}|null;
 inspectActors():{slots:Array<{slot:number;key:string;heading:number|null;mode:string|null;visible:boolean;detail:string}>;farPoints:number};
 audit():unknown;
 dispose():void;
}>

import {Vector3} from 'three';
// Metres throughout. Perspective changes screen size, never player scale.
export const PLAYER_HEIGHT=1.78;
export function playerDetail(camera,position,viewportHeight,previous='full'){
 const centre=new Vector3(position.x,(position.y??0)+PLAYER_HEIGHT/2,position.z),depth=-centre.clone().applyMatrix4(camera.matrixWorldInverse).z;
 const pixels=PLAYER_HEIGHT*viewportHeight/(2*Math.max(.1,depth)*Math.tan(camera.fov*Math.PI/360));
 const projected=centre.project(camera),edgeMargin=Math.min(2,pixels/Math.max(1,viewportHeight));
 if(depth<.1||projected.z>1||Math.abs(projected.x)>1+edgeMargin/Math.max(.35,camera.aspect)||Math.abs(projected.y)>1+edgeMargin)return 'hidden';
 // Hysteresis prevents detail flicker while orbiting near a threshold.
 const bands={hidden:1.2,far:8,intermediate:32};
 const margin=previous==='full'?.85:previous==='far'||previous==='hidden'?1.15:1;
 return pixels<bands.hidden*margin?'hidden':pixels<bands.far*margin?'far':pixels<bands.intermediate*margin?'intermediate':'full';
}

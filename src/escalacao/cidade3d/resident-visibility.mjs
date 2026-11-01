import {Vector3} from 'three';
/** CSS-pixel visibility, without changing a character's physical scale. */
export function residentVisibility(position,height,camera,viewportHeight=720){
 if(!camera)return{visible:true,detail:'full',pixels:null};
 const near=camera.position.distanceTo(position),foot=position.clone().project(camera),head=position.clone().add(new Vector3(0,height,0)).project(camera),pixels=Math.abs(head.y-foot.y)*Math.max(1,viewportHeight)/2;
 const x=(head.x+foot.x)/2,y=(head.y+foot.y)/2,z=(head.z+foot.z)/2;
 return{visible:near<500&&pixels>=1.5&&Math.abs(x)<1.4&&Math.abs(y)<1.5&&z>=-1&&z<=1,detail:near>150||pixels<12?'far':near>60?'intermediate':'full',pixels};
}

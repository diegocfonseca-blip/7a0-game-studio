import * as T from 'three';const point=new T.Vector3();
export function nearest(position, triangles) {
  let distance=Infinity, surface=new T.Vector3();
  for(const triangle of triangles){triangle.closestPointToPoint(position,point);const d=point.distanceToSquared(position);if(d<distance){distance=d;surface.copy(point);}}
  return {distance:Math.sqrt(distance),surface};
}


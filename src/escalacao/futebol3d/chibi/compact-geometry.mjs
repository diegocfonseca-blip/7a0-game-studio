import * as T from 'three';

/** Remove só vértices sem referência. Não simplifica nem desloca um triângulo,
 * UV, normal ou peso de osso. A ordem dos triângulos/desenho fica idêntica. */
export function compactIndexedGeometry(source){
 const index=source.index,position=source.attributes.position;if(!index||!position)return source;
 const remap=new Int32Array(position.count).fill(-1),used=[];
 for(let i=0;i<index.count;i++){const old=index.getX(i);if(remap[old]<0){remap[old]=used.length;used.push(old)}}
 if(used.length===position.count)return source;
 const attribute=source=>{
  const interleaved=source.isInterleavedBufferAttribute,raw=interleaved?source.data.array:source.array,stride=interleaved?source.data.stride:source.itemSize,offset=interleaved?source.offset:0;
  const values=new raw.constructor(used.length*source.itemSize);
  for(let i=0;i<used.length;i++)for(let k=0;k<source.itemSize;k++)values[i*source.itemSize+k]=raw[used[i]*stride+offset+k];
  const result=new T.BufferAttribute(values,source.itemSize,source.normalized);result.name=source.name;result.setUsage(source.usage??T.StaticDrawUsage);if(source.gpuType!==undefined)result.gpuType=source.gpuType;return result;
 };
 const result=new T.BufferGeometry();result.name=source.name;
 for(const [name,a]of Object.entries(source.attributes))result.setAttribute(name,attribute(a));
 for(const [name,list]of Object.entries(source.morphAttributes))result.morphAttributes[name]=list.map(attribute);
 result.morphTargetsRelative=source.morphTargetsRelative;
 result.setIndex(new T.BufferAttribute(new (used.length<65536?Uint16Array:Uint32Array)(Array.from(index.array,i=>remap[i])),1));
 result.groups=source.groups.map(g=>({...g}));result.setDrawRange(source.drawRange.start,source.drawRange.count);
 source.computeBoundingBox();source.computeBoundingSphere();result.boundingBox=source.boundingBox.clone();result.boundingSphere=source.boundingSphere.clone();
 result.userData={...source.userData,sourceVertexCount:position.count,compactedVertexCount:used.length};return result;
}

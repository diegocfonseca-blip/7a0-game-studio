/** GLTFLoader has no EXT_materials_bump implementation. Drop that unsupported
 * export and its otherwise unused noise images, retaining every supported map. */
export function stripUnsupportedBumps(json){
 for(const m of json.materials??[]){if(m.extensions)delete m.extensions.EXT_materials_bump}
 for(const k of ['extensionsUsed','extensionsRequired'])if(json[k])json[k]=json[k].filter(x=>x!=='EXT_materials_bump')
 const used=new Set();function visit(o){if(!o||typeof o!=='object')return;for(const[k,v]of Object.entries(o)){if(k.endsWith('Texture')&&v&&typeof v==='object'&&Number.isInteger(v.index))used.add(v.index);visit(v)}}visit(json.materials)
 const textureMap=new Map(),oldTextures=json.textures??[];json.textures=oldTextures.filter((t,i)=>{if(!used.has(i))return false;textureMap.set(i,textureMap.size);return true})
 function rewrite(o){if(!o||typeof o!=='object')return;for(const[k,v]of Object.entries(o)){if(k.endsWith('Texture')&&v&&typeof v==='object'&&Number.isInteger(v.index))v.index=textureMap.get(v.index);rewrite(v)}}rewrite(json.materials)
 const imageUsed=new Set(json.textures.map(t=>t.source)),imageMap=new Map(),droppedViews=new Set();json.images=(json.images??[]).filter((im,i)=>{if(!imageUsed.has(i)){droppedViews.add(im.bufferView);return false}imageMap.set(i,imageMap.size);return true});for(const t of json.textures)t.source=imageMap.get(t.source)
 const viewMap=new Map();json.bufferViews=json.bufferViews.filter((v,i)=>{if(droppedViews.has(i))return false;viewMap.set(i,viewMap.size);return true});for(const a of json.accessors??[])if(a.bufferView!==undefined)a.bufferView=viewMap.get(a.bufferView);for(const im of json.images)im.bufferView=viewMap.get(im.bufferView)
 return droppedViews.size
}

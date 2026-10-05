import {VESTUARIO_MODULAR,roupaModularValida,type RoupaModular} from './presidente-vestuario-modular'
/** Todas as peças pertencem ao mesmo desenho mestre. Nunca normalizar uma
 * cabeça antiga para esta base nem ajustar cabelo/pescoço por porcentagem livre. */
import {TONS_PELE,tomPeleValido,type TomPele} from './presidente-pele'
export const PRESIDENTE_RIG = {id:'presidente-v16',width:1024,height:1536} as const
export type PresidenteLayerKind='base'|'hair-back'|'hair-front'|'beard'|'accessory'
export type PresidenteLayer={
 id:string;rig:string;kind:PresidenteLayerKind;src:string;ready:boolean;
 skinTone?:TomPele;outfit?:RoupaModular;
 bounds:Readonly<{x:number;y:number;width:number;height:number}>;
 raster:Readonly<{width:number;height:number}>;
}
const ORDER:Record<PresidenteLayerKind,number>={'hair-back':0,base:1,'hair-front':2,beard:3,accessory:4}
// ready é validação de arquivo para bancada local, não aprovação de publicação.
export const PRESIDENTE_LAYERS:readonly PresidenteLayer[]=[{
 id:'puyol-hair-v145',rig:PRESIDENTE_RIG.id,kind:'hair-front',
 src:'presidente-v145/puyol-hair.webp',ready:true,
 bounds:{x:372,y:8,width:280,height:263},raster:{width:280,height:263},
},{
 id:'pirlo-hair-v135',rig:PRESIDENTE_RIG.id,kind:'hair-front',
 src:'presidente-v135/pirlo-hair.webp',ready:true,
 bounds:{x:397,y:12,width:230,height:227},raster:{width:230,height:227},
},{
 id:'ronaldinho-hair-v129',rig:PRESIDENTE_RIG.id,kind:'hair-front',
 src:'presidente-v129/ronaldinho-hair.webp',ready:true,
 bounds:{x:392,y:16,width:240,height:257},raster:{width:240,height:257},
},{
 id:'cabelo-classico',rig:PRESIDENTE_RIG.id,kind:'hair-front',
 src:'presidente-v17/cabelo-classico.webp',ready:true,
 bounds:{x:404,y:29,width:202,height:213},raster:{width:202,height:213},
},{
 id:'barba-classico',rig:PRESIDENTE_RIG.id,kind:'beard',
 src:'presidente-v17/barba-classico.webp',ready:true,
 bounds:{x:451,y:148,width:124,height:93},raster:{width:124,height:93},
},{
 id:'neymar-hair-v23',rig:PRESIDENTE_RIG.id,kind:'hair-front',
 src:'presidente-v23/neymar-hair.webp',ready:true,
 bounds:{x:444,y:9,width:130,height:143},raster:{width:260,height:286},
},{
 id:'cristiano-hair-v23',rig:PRESIDENTE_RIG.id,kind:'hair-front',
 src:'presidente-v23/cristiano-hair.webp',ready:true,
 bounds:{x:444,y:28,width:130,height:113},raster:{width:260,height:226},
},{
 id:'dani-hair-v23',rig:PRESIDENTE_RIG.id,kind:'hair-front',
 src:'presidente-v23/dani-hair.webp',ready:true,
 bounds:{x:444,y:34,width:130,height:110},raster:{width:260,height:220},
},{
 id:'messi-hair-v23',rig:PRESIDENTE_RIG.id,kind:'hair-front',
 src:'presidente-v23/messi-hair.webp',ready:true,
 bounds:{x:444,y:28,width:130,height:118},raster:{width:260,height:236},
},{
 id:'messi-beard-v24',rig:PRESIDENTE_RIG.id,kind:'beard',
 src:'presidente-v24/messi-beard.webp',ready:true,
 bounds:{x:452,y:164,width:116,height:78},raster:{width:116,height:78},
},{
 id:'dani-beard-v25',rig:PRESIDENTE_RIG.id,kind:'beard',
 src:'presidente-v25/dani-beard.webp',ready:true,
 bounds:{x:480,y:177,width:64,height:49},raster:{width:128,height:98},
},{
 id:'silver-stud-left-v25',rig:PRESIDENTE_RIG.id,kind:'accessory',
 src:'presidente-v25/silver-stud.webp',ready:true,
 bounds:{x:445,y:169,width:8,height:8},raster:{width:16,height:16},
},{
 id:'silver-stud-right-v25',rig:PRESIDENTE_RIG.id,kind:'accessory',
 src:'presidente-v25/silver-stud.webp',ready:true,
 bounds:{x:568,y:169,width:8,height:8},raster:{width:16,height:16},
},{
 id:'ronaldo-hair-v26',rig:PRESIDENTE_RIG.id,kind:'hair-front',
 src:'presidente-v26/ronaldo-hair.webp',ready:true,
 bounds:{x:470,y:55,width:84,height:38},raster:{width:168,height:76},
},{
 id:'beckham-hair-v26',rig:PRESIDENTE_RIG.id,kind:'hair-front',
 src:'presidente-v26/beckham-hair.webp',ready:true,
 bounds:{x:420,y:28,width:184,height:125},raster:{width:184,height:125},
},{
 id:'maldini-hair-v28',rig:PRESIDENTE_RIG.id,kind:'hair-front',
 src:'presidente-v28/maldini-hair.webp',ready:true,
 bounds:{x:411,y:25,width:202,height:202},raster:{width:202,height:202},
},{
 id:'kaka-hair-v28',rig:PRESIDENTE_RIG.id,kind:'hair-front',
 src:'presidente-v28/kaka-hair.webp',ready:true,
 bounds:{x:425,y:25,width:174,height:178},raster:{width:174,height:178},
},{
 id:'maradona-hair-v29',rig:PRESIDENTE_RIG.id,kind:'hair-front',
 src:'presidente-v29/maradona-hair.webp',ready:true,
 bounds:{x:425,y:20,width:174,height:170},raster:{width:174,height:170},
},{
 id:'batistuta-hair-v29',rig:PRESIDENTE_RIG.id,kind:'hair-front',
 src:'presidente-v29/batistuta-hair.webp',ready:true,
 bounds:{x:411,y:36,width:202,height:201},raster:{width:202,height:201},
},{
 id:'didi-hair-v31',rig:PRESIDENTE_RIG.id,kind:'hair-front',
 src:'presidente-v31/didi-hair.webp',ready:true,
 bounds:{x:444,y:35,width:136,height:108},raster:{width:136,height:108},
},{
 id:'vini-hair-v31',rig:PRESIDENTE_RIG.id,kind:'hair-front',
 src:'presidente-v31/vini-hair.webp',ready:true,
 bounds:{x:441,y:20,width:142,height:114},raster:{width:142,height:114},
},{
 id:'valderrama-moustache-v32',rig:PRESIDENTE_RIG.id,kind:'beard',
 src:'presidente-v32/valderrama-moustache.webp',ready:true,
 bounds:{x:480,y:177,width:64,height:23},raster:{width:64,height:23},
},{
 id:'marcelo-hair-v220',rig:PRESIDENTE_RIG.id,kind:'hair-front',
 src:'presidente-v220/marcelo-hair.webp',ready:true,
 bounds:{x:382,y:10,width:260,height:231},raster:{width:260,height:231},
},{
 id:'marcelo-beard-v220',rig:PRESIDENTE_RIG.id,kind:'beard',
 src:'presidente-v220/marcelo-beard.webp',ready:true,
 bounds:{x:454,y:141,width:116,height:100},raster:{width:116,height:100},
},{
 id:'valderrama-hair-v33',rig:PRESIDENTE_RIG.id,kind:'hair-front',
 src:'presidente-v33/valderrama-hair.webp',ready:true,
 bounds:{x:382,y:10,width:260,height:231},raster:{width:260,height:231},
},{
 id:'gullit-hair-v34',rig:PRESIDENTE_RIG.id,kind:'hair-front',
 src:'presidente-v34/gullit-hair.webp',ready:true,
 bounds:{x:392,y:18,width:240,height:240},raster:{width:240,height:240},
},{
 id:'gullit-moustache-v34',rig:PRESIDENTE_RIG.id,kind:'beard',
 src:'presidente-v34/gullit-moustache.webp',ready:true,
 bounds:{x:480,y:177,width:64,height:23},raster:{width:64,height:23},
},{
 id:'vozinha-beard-v33',rig:PRESIDENTE_RIG.id,kind:'beard',
 src:'presidente-v33/vozinha-beard.webp',ready:true,
 bounds:{x:454,y:141,width:116,height:100},raster:{width:116,height:100},
},{
 id:'vozinha-hair-v33',rig:PRESIDENTE_RIG.id,kind:'hair-front',
 src:'presidente-v33/vozinha-hair.webp',ready:true,
 bounds:{x:442,y:35,width:140,height:91},raster:{width:140,height:91},
},...VESTUARIO_MODULAR.flatMap(roupa=>TONS_PELE.map(t=>({
 id:'base-neutra-'+roupa.id+(t.id==='medium'?'':'-'+t.id),rig:PRESIDENTE_RIG.id,kind:'base' as const,
 src:roupa.src,ready:true,skinTone:t.id==='medium'?undefined:t.id,outfit:roupa.id,
 bounds:{x:0,y:0,width:1024,height:1536},raster:{width:480,height:720},
})))]
export function camadaCompativel(piece:PresidenteLayer):boolean{
 if(!piece||piece.rig!==PRESIDENTE_RIG.id||piece.ready!==true||!Object.hasOwn(ORDER,piece.kind))return false
 if(piece.skinTone!==undefined&&(!tomPeleValido(piece.skinTone)||piece.kind!=='base'||!roupaModularValida(piece.outfit)))return false
 if(typeof piece.src!=='string'||!/^presidente-v(?:17|23|24|25|26|28|29|31|32|33|34|82|83|92|129|135|145|149|157|160|163|175|178|180|184|186|189|192|195|199|201|203|206|213|214|215|216|217|218|220)\/[a-z0-9-]+\.webp$/.test(piece.src))return false
 const b=piece.bounds,r=piece.raster
 if(!b||!r||![b.x,b.y,b.width,b.height,r.width,r.height].every(Number.isSafeInteger))return false
 if(b.x<0||b.y<0||b.width<=0||b.height<=0||r.width<=0||r.height<=0)return false
 if(r.width>PRESIDENTE_RIG.width||r.height>PRESIDENTE_RIG.height)return false
 if(b.x+b.width>PRESIDENTE_RIG.width||b.y+b.height>PRESIDENTE_RIG.height)return false
 // Apenas redução UNIFORME. Uma arte esticada não pode passar no contrato.
 return b.width*r.height===b.height*r.width
}
export function montarPresidenteLayers(ids:readonly string[],catalog= PRESIDENTE_LAYERS):
 {ok:true;layers:readonly PresidenteLayer[]}|{ok:false;error:'invalid-selection'|'incompatible-layer'}{
 if(!Array.isArray(ids)||ids.length<1||ids.length>10||new Set(ids).size!==ids.length)return {ok:false,error:'invalid-selection'}
 const layers:PresidenteLayer[]=[]
 for(const id of ids){
  const matches=catalog.filter(p=>p.id===id)
  if(matches.length!==1||!camadaCompativel(matches[0]))return {ok:false,error:'incompatible-layer'}
  layers.push(matches[0])
 }
 if(layers.filter(p=>p.kind==='base').length!==1)return {ok:false,error:'invalid-selection'}
 for(const kind of ['hair-back','hair-front','beard'])if(layers.filter(p=>p.kind===kind).length>1)return {ok:false,error:'invalid-selection'}
 return {ok:true,layers:[...layers].sort((a,b)=>ORDER[a.kind]-ORDER[b.kind]).map(p=>({...p,bounds:{...p.bounds},raster:{...p.raster}}))}
}

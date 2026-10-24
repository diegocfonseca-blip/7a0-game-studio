// Match presentation only. Never edits the registered kit or official input.
const rgb=s=>[1,3,5].map(i=>parseInt(s.slice(i,i+2),16)/255);
const hex=c=>'#'+c.map(v=>Math.round(Math.max(0,Math.min(1,v))*255).toString(16).padStart(2,'0')).join('');
export const luminance=s=>rgb(s).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((a,v,i)=>a+v*[.2126,.7152,.0722][i],0);
export const kitContrast=(a,b)=>(Math.max(luminance(a),luminance(b))+.05)/(Math.min(luminance(a),luminance(b))+.05);
const valid=s=>/^#[0-9a-f]{6}$/i.test(s??'');
export function kitsClash(a,b){
 if(kitContrast(a,b)>=3)return false;
 const light=[luminance(a),luminance(b)],distance=Math.hypot(...rgb(a).map((v,i)=>v-rgb(b)[i]));
 return distance<.5||light.every(v=>v>.55)||light.every(v=>v<.08);
}
export function matchKitPlan(state,configs,palettes=[]){
 const sides=['home','away'],ids=[state.context?.homeClubId,state.context?.awayClubId];
 const viewer=Number.isSafeInteger(state.viewerClubId)?ids.indexOf(state.viewerClubId):-1;
 const colors=sides.map((side,i)=>configs[i]?.colors.primary??state[side+'Color']);
 const plan=sides.map((side,i)=>({side,config:configs[i],color:colors[i],generated:false}));
 if(viewer<0||!colors.every(valid)||!kitsClash(...colors))return plan;
 const rival=1-viewer,config=configs[rival],base=colors[rival],original=config?.variants.home;
 const candidates=[...(config?.contrastCandidates??[]),config?.colors.secondary,...(palettes[rival]??[]),
  hex(rgb(base).map(v=>v*.25)),hex(rgb(base).map(v=>v*.2+.8))].filter(valid);
 const color=candidates.find(c=>kitContrast(c,colors[viewer])>=3)??candidates.sort((a,b)=>kitContrast(b,colors[viewer])-kitContrast(a,colors[viewer]))[0];
 plan[rival]={...plan[rival],color,generated:true,protectedSide:plan[viewer].side};
 if(config)plan[rival].config={...config,renderKey:config.clubKey+':match-contrast:'+color,colors:{...config.colors,primary:color},matchContrast:{from:base,to:color,protectedRects:original.shirt.protectedArtwork??[]},variants:{...config.variants,home:{...original,socks:{...original.socks,color},numbering:{...original.numbering,color:luminance(color)<.35?'#f5f3ef':'#101113'}}}};
 return plan;
}
// Recolour fabric only. Named artwork zones and non-fabric accent colours
// retain their original RGBA values, including crests and sponsor marks.
export function recolorFabric(data,width,{from,to,protectedRects=[]}){
 const a=rgb(from),b=rgb(to),norm=a.reduce((s,v)=>s+v*v,0);let changed=0;
 for(let i=0;i<data.length;i+=4){if(data[i+3]===0)continue;const x=i/4%width,y=Math.floor(i/4/width);
  if(protectedRects.some(([rx,ry,w,h])=>x>=rx&&x<rx+w&&y>=ry&&y<ry+h))continue;
  const c=[data[i]/255,data[i+1]/255,data[i+2]/255],shade=c.reduce((s,v,j)=>s+v*a[j],0)/Math.max(.01,norm);
  if(shade<.38||Math.max(...c.map((v,j)=>Math.abs(v-a[j]*shade)))>.075)continue;
  for(let j=0;j<3;j++)data[i+j]=Math.round(Math.min(1,b[j]*shade)*255);changed++;
 }
 return changed;
}

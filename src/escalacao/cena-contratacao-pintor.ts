import type {AtorCena} from './cenas-bairro-model'
import {legendAvatarKey} from './legend-avatars'
/** Illustrated presentation only. No career state, random draws, match clocks or map calls. */
export function pintorChegada(canvas:HTMLCanvasElement,images:{background:HTMLImageElement;atlas:HTMLImageElement;staff:HTMLImageElement;portrait?:HTMLImageElement;presentation:{body:HTMLCanvasElement;garment:HTMLCanvasElement}},ator:AtorCena){
 const context=canvas.getContext('2d');if(!context)throw new Error('Canvas indisponível')
 const ctx:CanvasRenderingContext2D=context
 const {background:bg,atlas,staff:president,portrait}=images
 const romario=!!portrait&&!!ator.club&&!!ator.year&&legendAvatarKey(ator.nome,ator.club,ator.year)==='romario|vasco|2000'
    const clamp=(v:number,a=0,b=1)=>Math.max(a,Math.min(b,v));
    const smooth=(v:number)=>{v=clamp(v);return v*v*(3-2*v)};
    const out=(v:number)=>1-Math.pow(1-clamp(v),3);
    const lerp=(a:number,b:number,t:number)=>a+(b-a)*t;
    const frames:Record<'bus'|'a'|'b'|'wave'|'shirt',[number,number,number,number]>={bus:[19,81,1219,474],a:[25,636,284,587],b:[335,636,282,587],wave:[618,610,288,615],shirt:[949,633,282,592]};
    function asset(name:keyof typeof frames,cx:number,feet:number,height:number,alpha=1,angle=0){
      const r=frames[name],w=height*r[2]/r[3];
      ctx.save();ctx.globalAlpha*=alpha;ctx.translate(cx,feet);ctx.rotate(angle);ctx.drawImage(atlas,...r.map(v=>v*atlas.naturalWidth/1254) as [number,number,number,number],-w/2,-height,w,height);ctx.restore();
    }
    function shadow(x:number,y:number,w:number,alpha=.18){ctx.save();ctx.globalAlpha*=alpha;ctx.fillStyle='#172019';ctx.beginPath();ctx.ellipse(x,y,w,w*.13,0,0,Math.PI*2);ctx.fill();ctx.restore()}
    function flashes(t:number,points:readonly (readonly [number,number])[]){
      const moments=[4650,5850,7450,9200,10600,11500];
      moments.forEach((at,i)=>{const q=1-Math.abs(t-at)/170;if(q<=0)return;const p=points[i%points.length];ctx.save();ctx.globalAlpha*=q*.8;const g=ctx.createRadialGradient(p[0],p[1],0,p[0],p[1],45);g.addColorStop(0,'#fffde9');g.addColorStop(.18,'#fffde9bb');g.addColorStop(1,'#fffde900');ctx.fillStyle=g;ctx.fillRect(p[0]-45,p[1]-45,90,90);ctx.fillStyle='#fffde9';ctx.fillRect(p[0]-17,p[1]-1.5,34,3);ctx.fillRect(p[0]-1.5,p[1]-17,3,34);ctx.restore()});
    }
    function arrival(t:number){
      ctx.save();const z=1+.42*smooth((t-4800)/2900);ctx.translate(-(z-1)*1280,-(z-1)*600);ctx.scale(z,z);
      ctx.drawImage(bg,0,0,1280,720);
      const x=lerp(-940,-30,out((t-250)/2800)),y=350+Math.sin(t*.016)*Math.max(0,1-t/3200)*.8;
      const w=860,h=w*474/1219,s=w/1219;
      shadow(x+w*.51,y+h-4,385,.22);ctx.drawImage(atlas,...frames.bus.map(v=>v*atlas.naturalWidth/1254) as [number,number,number,number],x,y,w,h);
      const rolling=clamp((3050-t)/1000),rot=t*.008;
      [[285,480],[815,480]].forEach(([wx,wy])=>{
        ctx.save();ctx.translate(x+(wx-19)*s,y+(wy-81)*s);ctx.rotate(rot*rolling);ctx.strokeStyle='#d3cec6';ctx.lineWidth=2;ctx.globalAlpha=.33*rolling;
        for(let k=0;k<6;k++){ctx.rotate(Math.PI/3);ctx.beginPath();ctx.moveTo(8,0);ctx.lineTo(23,0);ctx.stroke()}ctx.restore();
      });
      const open=smooth((t-3150)/550),dx=x+(895-19)*s,dy=y+(146-81)*s,dw=133*s,dh=350*s;
      if(open<1){ctx.save();ctx.beginPath();ctx.rect(dx,dy,dw,dh);ctx.clip();ctx.fillStyle='#17352b';ctx.fillRect(dx-dw*open,dy,dw,dh);ctx.fillStyle='#13201e';ctx.fillRect(dx+7-dw*open,dy+8,dw-14,dh*.58);ctx.fillStyle='#d6a738';ctx.fillRect(dx-dw*open,dy+dh*.64,dw,4);ctx.strokeStyle='#f0bd52';ctx.lineWidth=2;ctx.strokeRect(dx-dw*open,dy,dw,dh);ctx.restore()}
      shadow(1100,550,55,.17);
      const nod=t>6500?Math.sin((t-6500)/500)*.006:0;
      ctx.save();ctx.translate(1100,550);ctx.rotate(nod);ctx.drawImage(president,-73,-230,146,230);ctx.restore();
      if(t>=3550){
        let px:number,py:number,ph:number,which:keyof typeof frames='a';
        if(t<4250){const q=smooth((t-3550)/700);px=lerp(638,670,q);py=lerp(632,680,q);ph=lerp(200,218,q);which=Math.floor(t/190)%2?'a':'b'}
        else if(t<5800){const q=clamp((t-4250)/1550);px=lerp(670,900,q);py=680;ph=218;which=Math.floor((t-4250)/180)%2?'a':'b'}
        else if(t<7000){const q=smooth((t-5800)/1200);px=lerp(900,987,q);py=lerp(680,550,q);ph=lerp(218,207,q);which=Math.floor(t/180)%2?'a':'b'}
        else{px=987;py=550;ph=207;which='wave'}
        const walk=t<7000?Math.sin(t/90)*1.3:0;
        if(romario||portrait)shadow(px,py+1,ph*.19,.19);
        const reveal=smooth((t-3550)/230),angle=t>=7000?Math.sin((t-7000)/210)*.012:0;
        if(romario)asset(which,px,py+walk,ph,reveal,angle);else if(portrait)athlete(px,py+walk,ph,t,t<7000,reveal);
      }
      flashes(t,[[1025,332],[890,342],[1130,351]]);
      ctx.restore();
    }
    function presentation(t:number){
      // Neutral press backdrop: a fixed club colour can belong to the buyer's rival.
      ctx.fillStyle='#181818';ctx.fillRect(0,0,1280,720);
      for(let row=0;row<5;row++)for(let col=0;col<10;col++){
        ctx.fillStyle=(col+row)%2?'#282828':'#222222';ctx.beginPath();ctx.roundRect(col*148-96,row*120-24,132,101,7);ctx.fill();
      }
      const light=ctx.createLinearGradient(0,0,0,720);light.addColorStop(0,'#ffffff14');light.addColorStop(.8,'#0c0c0c00');light.addColorStop(1,'#0c0c0c99');ctx.fillStyle=light;ctx.fillRect(0,0,1280,720);
      const breathing=Math.sin(t/560)*1.4;
      ctx.save();ctx.translate(0,breathing)
      if(portrait){
        // Reuse only THIS card's native head and neck. The modular torso holds
        // the BUYING club's shirt; no historic jersey is baked into the prop.
        ctx.save();ctx.translate(400,34);ctx.scale(.8,.8)
        ctx.beginPath();ctx.moveTo(150,0);ctx.lineTo(450,0);ctx.lineTo(450,175);ctx.lineTo(380,198);ctx.lineTo(340,254);ctx.lineTo(260,254);ctx.lineTo(220,198);ctx.lineTo(150,175);ctx.closePath();ctx.clip()
        ctx.drawImage(portrait,0,0,600,400);ctx.restore()
        ctx.drawImage(images.presentation.body,315,80,650,650)
      }else{
        // Missing avatar: show just the correct club garment, never another person.
        ctx.drawImage(images.presentation.garment,315,20,650,650)
      }
      ctx.restore()
      ctx.fillStyle='#181818';ctx.fillRect(0,648,1280,72);ctx.fillStyle='#d6ae46';ctx.fillRect(0,648,1280,4);
      ([[425,'#737373'],[845,'#a3a3a3']] as const).forEach(([x,color])=>{ctx.strokeStyle='#242424';ctx.lineWidth=10;ctx.beginPath();ctx.moveTo(x,667);ctx.lineTo(x+12,591);ctx.stroke();ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(x+13,582,19,13,-.2,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#0c0c0c';ctx.lineWidth=3;ctx.stroke()});
      flashes(t,[[75,510],[1205,480],[190,570]]);
    }

    function athlete(x:number,y:number,h:number,t:number,walking:boolean,alpha:number){
      if(!portrait)return
      ctx.save();ctx.globalAlpha*=alpha;ctx.translate(x,y)
      const stride=walking?Math.sin(t/115)*.065:0
      for(const side of [-1,1]){
        // Reuse illustrated trousers/shoes from the existing staff art. No
        // borrowed player's skin, face or kit, and no block/stick figure legs.
        const iw=president.naturalWidth,ih=president.naturalHeight,sx=side===-1?iw*.19:iw*.52,sw=iw*.34
        ctx.save();ctx.translate(side*h*.11,-h*.46);ctx.rotate(side*stride)
        ctx.drawImage(president,sx,ih*.58,sw,ih*.42,-h*.115,0,h*.23,h*.46);ctx.restore()
      }
      const k=atlas.naturalWidth/1254
      ctx.drawImage(atlas,212*k,939*k,96*k,167*k,h*.23,-h*.33,h*.15,h*.26)
      const ph=h*.55,pw=ph*portrait.naturalWidth/portrait.naturalHeight
      ctx.drawImage(portrait,-pw/2,-h,pw,ph);ctx.restore()
    }
    return (time:number)=>{
      ctx.setTransform(canvas.width/1280,0,0,canvas.height/720,0,0);ctx.clearRect(0,0,1280,720)
      if(time<8700){arrival(time);const q=smooth((time-8250)/450);if(q>0){ctx.save();ctx.globalAlpha=q;presentation(time);ctx.restore()}}
      else presentation(time)
    }
}

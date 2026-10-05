import type {RoupaModular} from './presidente-vestuario-modular'
/** Cinco escolhas apenas. A coloração é aplicada pelo renderer às áreas de pele,
 * nunca como filtro sobre cabelo, roupa ou a imagem inteira. */
export const TONS_PELE=[
 {id:'light',pt:'CLARO',en:'LIGHT',rgb:[225,181,146],color:'#e1b592'},
 {id:'warm',pt:'MÉDIO CLARO',en:'MEDIUM LIGHT',rgb:[200,145,101],color:'#c89165'},
 {id:'medium',pt:'MÉDIO',en:'MEDIUM',rgb:[175,111,65],color:'#af6f41'},
 {id:'brown',pt:'ESCURO',en:'DARK',rgb:[122,75,47],color:'#7a4b2f'},
 {id:'deep',pt:'PROFUNDO',en:'DEEP',rgb:[79,48,33],color:'#4f3021'},
] as const
export type TomPele=typeof TONS_PELE[number]['id']
export function tomPeleValido(v:unknown):v is TomPele{return TONS_PELE.some(t=>t.id===v)}
// A candidate mask does not register the outfit or make it selectable.
type RoupaComMascara=RoupaModular|'magico'|'professor-varzea'|'resenha-domingo'|'presidente-raiz'|'dia-jogo'|'inverno-estadio'|'jaqueta-metalica'|'streetwear'|'presidente-motoqueiro'|'magnata-retro'|'astro-rock'|'executivo-futurista'|'astronauta'|'traje-real'
export function aplicarTomPele(pixels:Uint8ClampedArray,width:number,height:number,tone:TomPele,outfit:RoupaComMascara,seated=false){
 if(!tomPeleValido(tone)||pixels.length!==width*height*4)throw Error('Invalid skin rendering input')
 if(tone==='medium')return
 const target=TONS_PELE.find(t=>t.id===tone)!.rgb,sums=[0,0,0];let count=0
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const mx=x*1024/width,my=y*1536/height,i=(y*width+x)*4
  if(mx>=482&&mx<540&&my>=100&&my<150&&pixels[i+3]>200){for(let c=0;c<3;c++)sums[c]+=pixels[i+c];count++}
 }
 if(!count)throw Error('Skin reference unavailable')
 const gains=target.map((v,c)=>v/(sums[c]/count))
 const shortSleeves=['polo','casual','polo-verde','camiseta-branca'].includes(outfit)
 const tailored=outfit==='mestre-envelopes'||outfit==='dono-lua'||outfit==='lenda-varzea'||outfit==='presidente-cibernetico'||outfit==='cavaleiro-clube'||outfit==='rei-pregao'||outfit==='magico'||outfit==='traje-real'||outfit==='terno'||outfit==='blazer-vinho'||outfit==='blazer-classico'||outfit==='gala-dourada'||outfit==='smoking-branco'||outfit==='magnata-retro'
 const candidate=['professor-varzea','resenha-domingo','presidente-raiz','dia-jogo','inverno-estadio'].includes(outfit)
 const fittedHands=outfit==='astronauta'||outfit==='executivo-futurista'||outfit==='astro-rock'||tailored||outfit==='jaqueta-metalica'||outfit==='presidente-motoqueiro'
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const mx=x*1024/width,my=y*1536/height,i=(y*width+x)*4,r=pixels[i],g=pixels[i+1],b=pixels[i+2]
  const region=seated?((mx>410&&mx<610&&my<(outfit==='jaqueta-couro'?330:outfit==='resenha-domingo'?420:tailored?310:380))||
   (candidate?mx>360&&mx<680&&my>575&&my<760:shortSleeves?mx>235&&mx<790&&my>450&&my<690:mx>395&&mx<635&&my>575&&my<(outfit==='lenda-varzea'?670:690))):
   (mx>410&&mx<610&&my<(outfit==='jaqueta-couro'||outfit==='jaqueta-metalica'?290:outfit==='resenha-domingo'?380:tailored?268:330))||
   (outfit==='lenda-varzea'?mx>320&&mx<390&&my>675&&my<700:mx>245&&mx<390&&my>(outfit==='astronauta'?640:fittedHands?675:438)&&my<720)||
   (mx>(outfit==='lenda-varzea'?670:638)&&mx<749&&my>(fittedHands?735:460)&&my<868)
  // Geometry excludes the gold tie; chroma excludes fabric and black contours.
  const exposedAnkles=outfit==='streetwear'&&my>1100&&mx>250&&mx<800
  const lendaLowerHand=outfit!=='lenda-varzea'||!seated||my<625||(r>130&&g>70&&b<g*.8)
  if((region||exposedAnkles)&&lendaLowerHand&&pixels[i+3]&&r>g*1.22&&g>b*1.25)for(let c=0;c<3;c++)pixels[i+c]=Math.min(255,Math.round(pixels[i+c]*gains[c]))
 }
}

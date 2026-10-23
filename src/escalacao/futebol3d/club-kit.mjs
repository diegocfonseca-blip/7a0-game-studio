// Generated from scripts/animation-lab/universal-kit/club-kit.mjs; edit the source and repackage.
// Public existing club key, not a fabricated database ID. Preview only.
// Sources: salao-camisas.ts, batismos.ts and the current Neymarzetti artwork.
export const neymarzetti=Object.freeze({
 clubId:null,clubKey:'Neymarzetti',source:'src/escalacao/salao-camisas.ts:CAMISAS_SALAO',
 colors:{primary:'#F0EFEF',secondary:'#080908'},
 crest:new URL('../img/neymarzetti-escudo.webp',import.meta.url).href,
 variants:{home:{
  shirt:{art:new URL('./assets/neymarzetti.webp',import.meta.url).href,publicArt:'public/mantos-salao/neymarzetti-camisa-v2.webp',collar:'v-neck',trimColor:'#080908',sponsors:[],back:'inferred',textureRecipe:{sourceSize:[547,700],frontCrop:[84,0,379,700],innerCollarMask:[140,24,234,139],fabricCrop:[140,350,160,210],sleeveCrop:[120,320,120,170]}},
  shorts:{color:'#080908',texture:null,provisional:true},
  socks:{color:'#F0EFEF',texture:null,provisional:true},
  boots:{color:'#080908',provisional:true},
  numbering:{color:'#080908',previewNumber:10,official:false},
 },away:null},
 inferred:['Costas brancas, acabamentos pretos e numeração de demonstração','Continuação dos detalhes nas mangas e laterais'],
 approved:false,
});

const atlasCache=new Map();
const imageFrom=url=>new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>reject(Error('Arte indisponível: '+url));image.src=url;});
export function acquireClubAtlas(config,variant='home',number=10){
 if(!config.variants[variant])throw Error('Variante do clube não disponível');
 if(!Number.isInteger(number)||number<1||number>99)throw Error('Número deve estar entre 1 e 99');
 const key=JSON.stringify([config.clubId??config.clubKey,variant]);
 if(!atlasCache.has(key))atlasCache.set(key,buildAtlas(config,variant));
 return atlasCache.get(key);
}
async function buildAtlas(config,variant){
 const kit=config.variants[variant],recipe=kit.shirt.textureRecipe;
 if(!recipe)throw Error('A arte deste clube precisa de mapeamento de frente e mangas antes de gerar a textura');
 const source=await imageFrom(kit.shirt.art);
 if(source.width!==recipe.sourceSize[0]||source.height!==recipe.sourceSize[1])throw Error('A arte mudou de dimensão; revisar o mapeamento UV do clube');
 const canvas=document.createElement('canvas');canvas.width=canvas.height=1024;
 const c=canvas.getContext('2d');c.fillStyle=config.colors.primary;c.fillRect(0,0,1024,1024);
 // Front has its own island. The original chest crest, fabric graphics and
 // garment details remain sampled from the actual club art, without redrawing.
 c.drawImage(source,...recipe.frontCrop,24,24,464,720);
 // Remove the photograph's inner collar/background. The actual open V collar
 // follows the garment seam in 3D; chest artwork below it remains unchanged.
 c.fillStyle=config.colors.primary;c.fillRect(...recipe.innerCollarMask);
 // Back is explicitly inferred: a clean panel with the same white/black trim.
 c.fillStyle=config.colors.primary;c.fillRect(536,24,464,720);
 c.save();c.beginPath();c.rect(536,24,464,720);c.clip();c.globalAlpha=.20;
 c.drawImage(source,...recipe.fabricCrop,536,100,464,644);c.restore();
 c.strokeStyle=config.colors.secondary;c.lineWidth=5;c.beginPath();c.moveTo(550,105);c.quadraticCurveTo(768,27,986,105);c.stroke();
 c.globalAlpha=.18;c.fillStyle=config.colors.secondary;c.fillRect(538,717,460,2);c.globalAlpha=1;
 // Sleeve island: source white fabric, a separate black cuff, no duplicated crest.
 c.drawImage(source,...recipe.sleeveCrop,24,780,464,200);
 c.fillStyle=config.colors.secondary;c.fillRect(24,938,464,42);
 c.fillStyle=kit.shorts.color;c.fillRect(536,780,212,220);
 c.fillStyle=kit.socks.color;c.fillRect(756,780,128,220);
 c.strokeStyle='#c9c9c7';c.lineWidth=1;
 for(let x=760;x<882;x+=5){c.beginPath();c.moveTo(x,782);c.lineTo(x,998);c.stroke();}
 c.fillStyle=kit.boots.color;c.fillRect(892,780,132,244);
 return {canvas,clubKey:config.clubKey,variant,size:1024,backInferred:true};
}
export function releaseClubAtlas(config,variant='home'){atlasCache.delete(JSON.stringify([config.clubId??config.clubKey,variant]));}

import type {PresidenteLayer} from './presidente-rig'
import type {RoupaModular} from './presidente-vestuario-modular'
export const ROUPAS_SENTADAS:Record<RoupaModular,string>={
 'mestre-envelopes':'mestre-envelopes',
 'dono-lua':'dono-lua',
 'lenda-varzea':'lenda-varzea',
 'presidente-cibernetico':'presidente-cibernetico',
 'cavaleiro-clube':'cavaleiro-clube',
 'rei-pregao':'rei-pregao',
 magico:'magico',
 'traje-real':'traje-real',
 astronauta:'astronauta',
 'astro-rock':'astro-rock',
 'executivo-futurista':'executivo-futurista',
 streetwear:'streetwear',
 'magnata-retro':'magnata-retro',
 'presidente-motoqueiro':'presidente-motoqueiro',
 'jaqueta-metalica':'jaqueta-metalica',
 'smoking-branco':'smoking-branco',
 'jaqueta-couro':'jaqueta-couro',
 'gala-dourada':'gala-dourada',
 'professor-varzea':'professor-varzea','resenha-domingo':'resenha-domingo',
 'presidente-raiz':'presidente-raiz','dia-jogo':'dia-jogo','inverno-estadio':'inverno-estadio',
 'blazer-classico':'blazer-classico',
 terno:'terno',polo:'polo',social:'social',casual:'casual',
 'polo-verde':'polo-verde','camiseta-branca':'camiseta-branca',
 'social-azul':'social-azul',agasalho:'agasalho','blazer-vinho':'blazer-vinho',
}
export type PresidentePose='standing'|'seated'
/** Explicit asset locations: changing a standing sprite cannot select another seated outfit. */
const DIRETORIOS_SENTADOS:Partial<Record<RoupaModular,string>>={
 'mestre-envelopes':'presidente-v218',
 'dono-lua':'presidente-v217',
 'lenda-varzea':'presidente-v216',
 'presidente-cibernetico':'presidente-v215',
 'cavaleiro-clube':'presidente-v214',
 'rei-pregao':'presidente-v213',
 magico:'presidente-v206',
 'traje-real':'presidente-v203',
 astronauta:'presidente-v199',
 'astro-rock':'presidente-v192',
 'executivo-futurista':'presidente-v195',
 streetwear:'presidente-v184',
 'magnata-retro':'presidente-v189',
 'presidente-motoqueiro':'presidente-v186',
 'jaqueta-metalica':'presidente-v181',
 'smoking-branco':'presidente-v178',
 'jaqueta-couro':'presidente-v175',
 'gala-dourada':'presidente-v157',
 'blazer-classico':'presidente-v160',
 'blazer-vinho':'presidente-v149',
 'professor-varzea':'presidente-v163','resenha-domingo':'presidente-v163',
 'presidente-raiz':'presidente-v163','dia-jogo':'presidente-v163','inverno-estadio':'presidente-v163',
}
export function arteSentada(outfit:RoupaModular){
 if(outfit==='magico')return 'presidente-v206/magico-sentado-v2.webp'
 return `${DIRETORIOS_SENTADOS[outfit]??'presidente-v118'}/${ROUPAS_SENTADAS[outfit]}-sentado.webp`
}
/** A seated base never silently changes the user's selected outfit. */
export function podeSentarPresidente(outfit:string,owned:readonly {id:string}[]){
 return Object.hasOwn(ROUPAS_SENTADAS,outfit)&&owned.some(b=>b.id==='mesa-simples'||b.id==='mesa-madeira')&&owned.some(b=>b.id==='cadeira-simples'||b.id==='cadeira-couro')
}
export function camadasNaPose(layers:readonly PresidenteLayer[],pose:PresidentePose):readonly PresidenteLayer[]{
 if(pose!=='seated'||!layers.some(p=>p.kind==='base'&&p.outfit&&Object.hasOwn(ROUPAS_SENTADAS,p.outfit)))return layers
 return layers.map(p=>p.kind==='base'&&p.outfit?{...p,src:arteSentada(p.outfit)}:{
  ...p,bounds:{x:512+(p.bounds.x-512)*1.06,y:p.bounds.y*1.06+27,width:p.bounds.width*1.06,height:p.bounds.height*1.06},
 })
}

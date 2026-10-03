import {PRESIDENTE_ROUPAS,podeVestirRoupa,type PresidenteRoupaId,type PresidenteRoupaTier} from './presidente-roupas'
import {roupaModularValida,type RoupaModular} from './presidente-vestuario-modular'

/** Reuse the agreed access catalog, NOT its rejected legacy artwork.
 * Exhaustive mapping: a new modular outfit must declare its access rule.
 * Tier is supplied by the account caller, never taken from the avatar save. */
export const REGRA_ROUPA_MODULAR:Record<RoupaModular,PresidenteRoupaId>={
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
 polo:'polo-azul',terno:'terno-verde',social:'social-branca',casual:'camiseta-preta',
 'polo-verde':'polo-verde','camiseta-branca':'camiseta-branca',
 'social-azul':'social-azul',agasalho:'jaqueta-esportiva','blazer-vinho':'blazer-vinho',
}
export function podeVestirModular(id:unknown,tier:PresidenteRoupaTier|null=null):id is RoupaModular{
 return roupaModularValida(id)&&podeVestirRoupa(REGRA_ROUPA_MODULAR[id],tier)
}
/** Labels share the access rule; future premium clothes must never say FREE. */
export function seloRoupaModular(id:unknown):readonly [string,string]{
 const rule=roupaModularValida(id)?REGRA_ROUPA_MODULAR[id]:undefined
 const access=PRESIDENTE_ROUPAS.find(r=>r.id===rule)?.access
 if(access==='free')return ['GRÁTIS','FREE']
 if(access==='craque')return ['CRAQUE / LENDA','STAR / LEGEND']
 if(access==='lenda')return ['LENDA','LEGEND']
 return ['INDISPONÍVEL','UNAVAILABLE']
}

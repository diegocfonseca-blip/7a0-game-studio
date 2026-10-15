import {PRESIDENTE_ROUPAS,podeVestirRoupa,seloRoupa,type PresidenteRoupaId} from './presidente-roupas'
import {roupaModularValida,type RoupaModular} from './presidente-vestuario-modular'
import type {PlanoUnico} from './planos-regras'

/** Reuse the agreed access catalog, NOT its rejected legacy artwork.
 * Exhaustive mapping: a new modular outfit must declare its access rule.
 * 🔁 15/10: quem libera é o PLANO da conta (presidente-plano.ts), nunca o tier do rascunho. */
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
export function podeVestirModular(id:unknown,plano:PlanoUnico|null|undefined):id is RoupaModular{
 return roupaModularValida(id)&&podeVestirRoupa(REGRA_ROUPA_MODULAR[id],plano)
}
/** Labels share the access rule; nothing here ever says FREE (Diego, 15/10). */
export function seloRoupaModular(id:unknown):readonly [string,string]{
 if(!roupaModularValida(id))return ['INDISPONÍVEL','UNAVAILABLE']
 const rule=REGRA_ROUPA_MODULAR[id]
 return PRESIDENTE_ROUPAS.some(r=>r.id===rule)?seloRoupa(rule):['INDISPONÍVEL','UNAVAILABLE']
}

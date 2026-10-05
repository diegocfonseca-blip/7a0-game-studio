/** Apenas roupas com arte na base modular. Não reutilizar o catálogo v2 rejeitado.
 * Adicionar aqui não concede tier, moedas ou acesso à presidência privada. */
export const VESTUARIO_MODULAR=[
 {id:'mestre-envelopes',pt:'MESTRE DOS ENVELOPES',en:'MASTER OF ENVELOPES',src:'presidente-v218/mestre-envelopes-em-pe.webp'},
 {id:'dono-lua',pt:'DONO DA LUA',en:'MOON OWNER',src:'presidente-v217/dono-lua-em-pe.webp'},
 {id:'lenda-varzea',pt:'LENDA DA VÁRZEA',en:'GRASSROOTS LEGEND',src:'presidente-v216/lenda-varzea-em-pe.webp'},
 {id:'presidente-cibernetico',pt:'PRESIDENTE CIBERNÉTICO',en:'CYBER PRESIDENT',src:'presidente-v215/presidente-cibernetico-em-pe.webp'},
 {id:'cavaleiro-clube',pt:'CAVALEIRO DO CLUBE',en:'CLUB KNIGHT',src:'presidente-v214/cavaleiro-clube-em-pe.webp'},
 {id:'rei-pregao',pt:'REI DO PREGÃO',en:'AUCTION KING',src:'presidente-v213/rei-pregao-em-pe.webp'},
 {id:'magico',pt:'MÁGICO',en:'MAGICIAN',src:'presidente-v206/magico-em-pe.webp'},
 {id:'traje-real',pt:'TRAJE REAL',en:'ROYAL OUTFIT',src:'presidente-v201/traje-real-em-pe.webp'},
 {id:'astronauta',pt:'ASTRONAUTA',en:'ASTRONAUT',src:'presidente-v199/astronauta-em-pe.webp'},
 {id:'executivo-futurista',pt:'EXECUTIVO FUTURISTA',en:'FUTURISTIC EXECUTIVE',src:'presidente-v195/executivo-futurista-em-pe.webp'},
 {id:'astro-rock',pt:'ASTRO DO ROCK',en:'ROCK STAR',src:'presidente-v192/astro-rock-em-pe.webp'},
 {id:'magnata-retro',pt:'MAGNATA RETRÔ',en:'RETRO MAGNATE',src:'presidente-v189/magnata-retro-em-pe.webp'},
 {id:'presidente-motoqueiro',pt:'PRESIDENTE MOTOQUEIRO',en:'BIKER PRESIDENT',src:'presidente-v186/presidente-motoqueiro-em-pe.webp'},
 {id:'streetwear',pt:'STREETWEAR',en:'STREETWEAR',src:'presidente-v184/streetwear-em-pe.webp'},
 {id:'jaqueta-metalica',pt:'JAQUETA METÁLICA',en:'METALLIC JACKET',src:'presidente-v180/jaqueta-metalica-em-pe.webp'},
 {id:'blazer-classico',pt:'BLAZER CLÁSSICO',en:'CLASSIC BLAZER',src:'presidente-v160/blazer-classico-em-pe.webp'},
 {id:'polo',pt:'POLO AZUL',en:'NAVY POLO',src:'presidente-v17/base-neutra-polo.webp'},
 {id:'terno',pt:'TERNO CLÁSSICO',en:'CLASSIC SUIT',src:'presidente-v17/base-neutra-terno.webp'},
 {id:'social',pt:'SOCIAL BRANCA',en:'WHITE DRESS SHIRT',src:'presidente-v82/base-neutra-social.webp'},
 {id:'casual',pt:'CAMISETA PRETA',en:'BLACK T-SHIRT',src:'presidente-v83/base-neutra-casual.webp'},
 {id:'polo-verde',pt:'POLO VERDE',en:'GREEN POLO',src:'presidente-v92/base-neutra-polo-verde.webp'},
 {id:'camiseta-branca',pt:'CAMISETA BRANCA',en:'WHITE T-SHIRT',src:'presidente-v92/base-neutra-camiseta-branca.webp'},
 {id:'social-azul',pt:'SOCIAL AZUL',en:'BLUE DRESS SHIRT',src:'presidente-v92/base-neutra-social-azul.webp'},
 {id:'agasalho',pt:'AGASALHO ESPORTIVO',en:'TRACKSUIT',src:'presidente-v92/base-neutra-agasalho.webp'},
 {id:'blazer-vinho',pt:'BLAZER VINHO',en:'BURGUNDY BLAZER',src:'presidente-v149/blazer-vinho-em-pe.webp'},
 {id:'professor-varzea',pt:'PROFESSOR DA VÁRZEA',en:'GRASSROOTS COACH',src:'presidente-v163/professor-varzea-em-pe.webp'},
 {id:'resenha-domingo',pt:'RESENHA DE DOMINGO',en:'SUNDAY HANGOUT',src:'presidente-v163/resenha-domingo-em-pe.webp'},
 {id:'presidente-raiz',pt:'PRESIDENTE RAIZ',en:'OLD-SCHOOL PRESIDENT',src:'presidente-v163/presidente-raiz-em-pe.webp'},
 {id:'dia-jogo',pt:'DIA DE JOGO',en:'MATCH DAY',src:'presidente-v163/dia-jogo-em-pe.webp'},
 {id:'inverno-estadio',pt:'INVERNO NO ESTÁDIO',en:'WINTER AT THE STADIUM',src:'presidente-v163/inverno-estadio-em-pe.webp'},
 {id:'gala-dourada',pt:'GALA DOURADA',en:'GOLD GALA',src:'presidente-v157/gala-dourada-em-pe.webp'},
 {id:'jaqueta-couro',pt:'JAQUETA DE COURO',en:'LEATHER JACKET',src:'presidente-v175/jaqueta-couro-em-pe.webp'},
 {id:'smoking-branco',pt:'SMOKING BRANCO',en:'WHITE DINNER JACKET',src:'presidente-v178/smoking-branco-em-pe.webp'},
] as const
export type RoupaModular=typeof VESTUARIO_MODULAR[number]['id']
/** O retrato legado só conhece quatro bases; o visual privado completo fica no save modular. */
export function roupaLegada(value:RoupaModular):'polo'|'terno'|'social'|'casual'{
 if(value==='mestre-envelopes')return 'terno'
 if(value==='dono-lua')return 'terno'
 if(value==='lenda-varzea')return 'casual'
 if(value==='presidente-cibernetico'||value==='cavaleiro-clube'||value==='rei-pregao'||value==='magico'||value==='traje-real')return 'terno'
 if(value==='astronauta')return 'terno'
 if(value==='executivo-futurista')return 'terno'
 if(value==='astro-rock')return 'terno'
 if(value==='streetwear')return 'casual'
 if(value==='magnata-retro')return 'terno'
 if(value==='presidente-motoqueiro')return 'casual'
 if(value==='jaqueta-metalica')return 'casual'
 if(value==='smoking-branco')return 'terno'
 if(value==='jaqueta-couro')return 'casual'
 if(value==='gala-dourada')return 'terno'
 if(value==='professor-varzea'||value==='dia-jogo'||value==='inverno-estadio')return 'casual'
 if(value==='resenha-domingo'||value==='presidente-raiz')return 'social'
 if(value==='blazer-vinho'||value==='blazer-classico')return 'terno'
 if(value==='social-azul')return 'social'
 if(value==='camiseta-branca'||value==='agasalho')return 'casual'
 if(value==='polo-verde')return 'polo'
 return value
}
export function roupaModularValida(value:unknown):value is RoupaModular{
 return VESTUARIO_MODULAR.some(roupa=>roupa.id===value)
}

// Catálogo cosmético. Não compra moedas, não altera tier nem concede atributos.
// As artes precisam de aprovação de encaixe antes de habilitar a seleção.
export const PRESIDENTE_ROUPAS = [
 {id:'polo-azul',pt:'Polo azul-marinho',en:'Navy polo',access:'free'},
 {id:'polo-verde',pt:'Polo verde',en:'Green polo',access:'free'},
 {id:'camiseta-preta',pt:'Camiseta preta',en:'Black T-shirt',access:'free'},
 {id:'camiseta-branca',pt:'Camiseta branca',en:'White T-shirt',access:'free'},
 {id:'social-branca',pt:'Camisa social branca',en:'White dress shirt',access:'free'},
 {id:'social-azul',pt:'Camisa social azul',en:'Blue dress shirt',access:'free'},
 {id:'blazer-classico',pt:'Blazer clássico',en:'Classic blazer',access:'free'},
 {id:'jaqueta-esportiva',pt:'Jaqueta esportiva',en:'Track jacket',access:'free'},
 {id:'terno-verde',pt:'Terno clássico verde',en:'Classic green suit',access:'free'},
 {id:'professor-varzea',pt:'Professor da várzea',en:'Grassroots coach',access:'free'},
 {id:'resenha-domingo',pt:'Resenha de domingo',en:'Sunday hangout',access:'free'},
 {id:'presidente-raiz',pt:'Presidente raiz',en:'Old-school president',access:'free'},
 {id:'dia-jogo',pt:'Dia de jogo',en:'Match day',access:'free'},
 {id:'inverno-estadio',pt:'Inverno no estádio',en:'Winter at the stadium',access:'free'},
 {id:'blazer-vinho',pt:'Blazer de veludo vinho',en:'Burgundy velvet blazer',access:'craque'},
 {id:'jaqueta-metalica',pt:'Jaqueta metálica',en:'Metallic jacket',access:'craque'},
 {id:'jaqueta-couro',pt:'Jaqueta de couro',en:'Leather jacket',access:'craque'},
 {id:'smoking-branco',pt:'Smoking branco',en:'White dinner jacket',access:'craque'},
 {id:'presidente-motoqueiro',pt:'Presidente motoqueiro',en:'Biker president',access:'craque'},
 {id:'magnata-retro',pt:'Magnata retrô',en:'Retro magnate',access:'craque'},
 {id:'streetwear',pt:'Streetwear',en:'Streetwear',access:'craque'},
 {id:'astro-rock',pt:'Astro do rock',en:'Rock star',access:'craque'},
 {id:'executivo-futurista',pt:'Executivo futurista',en:'Futuristic executive',access:'craque'},
 {id:'gala-dourada',pt:'Traje de gala dourado',en:'Gold gala outfit',access:'lenda'},
 {id:'astronauta',pt:'Fantasia de astronauta',en:'Astronaut costume',access:'lenda'},
 {id:'traje-real',pt:'Traje real com capa',en:'Royal cape outfit',access:'lenda'},
 {id:'magico',pt:'Mágico',en:'Magician',access:'lenda'},
 {id:'rei-pregao',pt:'Rei do Pregão',en:'Auction king',access:'lenda'},
 {id:'cavaleiro-clube',pt:'Cavaleiro do Clube',en:'Club knight',access:'lenda'},
 {id:'presidente-cibernetico',pt:'Presidente Cibernético',en:'Cyber president',access:'lenda'},
 {id:'lenda-varzea',pt:'Lenda da Várzea',en:'Grassroots legend',access:'lenda'},
 {id:'dono-lua',pt:'Dono da Lua',en:'Moon owner',access:'lenda'},
 {id:'mestre-envelopes',pt:'Mestre dos Envelopes',en:'Master of envelopes',access:'lenda'},
] as const
export type PresidenteRoupaId=typeof PRESIDENTE_ROUPAS[number]['id']
export type PresidenteRoupaTier='bege'|'verde'|'roxo'|'prata'|'ouro'
export const PRESIDENTE_ROUPAS_ARTES:Partial<Record<PresidenteRoupaId,string>>={'polo-azul':'presidente-v2/polo-azul-v3.webp'}
export function roupaPronta(id:unknown):boolean{return typeof id==='string'&&!!PRESIDENTE_ROUPAS_ARTES[id as PresidenteRoupaId]}
export function normalizarRoupa(id:unknown):PresidenteRoupaId{
 return PRESIDENTE_ROUPAS.find(r=>r.id===id)?.id??'polo-azul'
}
// O tier deve vir da conta, nunca do rascunho ou do nome do clube.
export function podeVestirRoupa(id:unknown,tier:PresidenteRoupaTier|null):boolean{
 const r=PRESIDENTE_ROUPAS.find(r=>r.id===id)
 return !!r&&(r.access==='free'||tier==='ouro'||(r.access==='craque'&&tier==='prata'))
}
export function roupaDisponivel(id:unknown,tier:PresidenteRoupaTier|null):PresidenteRoupaId{
 return podeVestirRoupa(id,tier)?normalizarRoupa(id):'polo-azul'
}

/** Personal property. No paid home is granted without verified account ownership.
 *  🏠 03/11 (Diego: "essa casa tá muito próxima do estádio… a casa tem que ser em outro local"): o terreno saiu do lado do estádio
 *  (era x 180 · z 20, dentro do terreno do complexo) e foi pro BAIRRO, fora do anel viário. As casas da cidade se afastam sozinhas
 *  de terreno reservado (`landscapeReservations`). Tudo abaixo sai do centro + tamanho — mudar o endereço = mudar CASA_X/CASA_Z. */
const CASA_X=200,CASA_Z=232,CASA_W=36,CASA_D=30
export const TERRENO_USUARIO={id:'casa-usuario',x:CASA_X,z:CASA_Z,width:CASA_W,depth:CASA_D,
 footprint:[{x:CASA_X-CASA_W/2,z:CASA_Z-CASA_D/2},{x:CASA_X+CASA_W/2,z:CASA_Z-CASA_D/2},{x:CASA_X+CASA_W/2,z:CASA_Z+CASA_D/2},{x:CASA_X-CASA_W/2,z:CASA_Z+CASA_D/2}],
 house:{x:CASA_X-7,z:CASA_Z-4,width:8,depth:7,height:3.2},garage:{x:CASA_X+6,z:CASA_Z-4,width:9,depth:7}} as const
export const EVOLUCAO_MORADIA=[
 {id:'barraquinho',name:'Barraquinho',description:'Sua primeira casa neste terreno.',initial:true},
 {id:'casa',name:'Casa de alvenaria',description:'Mais espaço e uma garagem coberta.',initial:false},
 {id:'sobrado',name:'Sobrado',description:'Dois andares e espaço para seus bens pessoais.',initial:false},
 {id:'mansao',name:'Mansão',description:'Uma residência maior no mesmo terreno.',initial:false},
] as const

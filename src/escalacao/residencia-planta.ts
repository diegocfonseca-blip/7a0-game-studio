/** Personal property. No paid home is granted without verified account ownership. */
export const TERRENO_USUARIO={id:'casa-usuario',x:180,z:20,width:52,depth:48,
 footprint:[{x:154,z:-4},{x:206,z:-4},{x:206,z:44},{x:154,z:44}],
 house:{x:174,z:18,width:8,depth:7,height:3.2},garage:{x:186,z:18,width:9,depth:7}} as const
export const EVOLUCAO_MORADIA=[
 {id:'barraquinho',name:'Barraquinho',description:'Sua primeira casa neste terreno.',initial:true},
 {id:'casa',name:'Casa de alvenaria',description:'Mais espaço e uma garagem coberta.',initial:false},
 {id:'sobrado',name:'Sobrado',description:'Dois andares e espaço para seus bens pessoais.',initial:false},
 {id:'mansao',name:'Mansão',description:'Uma residência maior no mesmo terreno.',initial:false},
] as const

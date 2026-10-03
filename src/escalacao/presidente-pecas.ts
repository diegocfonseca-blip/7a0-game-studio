/** Uma peça por escolha, nunca um pacote que substitui o jogador inteiro.
 * Arte completa de referência NÃO significa camada pronta para equipar. */
export type CategoriaPeca='hair'|'beard'|'accessory'
export type PecaPresidente={id:string;category:CategoriaPeca;pt:string;en:string;ready:boolean;layers:readonly string[];slot?:'ears'|'face'|'head'}
export const PECAS_PRESIDENTE:readonly PecaPresidente[]=[
 {id:'marcelo-2017-hair',category:'hair',pt:'MARCELO · REAL MADRID 2017',en:'MARCELO · REAL MADRID 2017',ready:true,layers:['marcelo-hair-v220']},
 {id:'marcelo-2017-beard',category:'beard',pt:'BARBA DO MARCELO',en:'MARCELO BEARD',ready:true,layers:['marcelo-beard-v220']},
 {id:'puyol-2010-hair',category:'hair',pt:'PUYOL · BARCELONA 2010',en:'PUYOL · BARCELONA 2010',ready:true,layers:['puyol-hair-v145']},
 {id:'pirlo-2006-hair',category:'hair',pt:'PIRLO · MILAN 2006',en:'PIRLO · MILAN 2006',ready:true,layers:['pirlo-hair-v135']},
 {id:'ronaldinho-2005-hair',category:'hair',pt:'RONALDINHO · BARCELONA',en:'RONALDINHO · BARCELONA',ready:true,layers:['ronaldinho-hair-v129']},
 {id:'classic-hair',category:'hair',pt:'CABELO CLÁSSICO',en:'CLASSIC HAIR',ready:true,layers:['cabelo-classico']},
 {id:'classic-beard',category:'beard',pt:'BARBA CLÁSSICA',en:'CLASSIC BEARD',ready:true,layers:['barba-classico']},
 {id:'neymar-2011-hair',category:'hair',pt:'NEYMAR · SANTOS 2011',en:'NEYMAR · SANTOS 2011',ready:true,layers:['neymar-hair-v23']},
 {id:'messi-2023-hair',category:'hair',pt:'MESSI · INTER MIAMI',en:'MESSI · INTER MIAMI',ready:true,layers:['messi-hair-v23']},
 {id:'cristiano-2014-hair',category:'hair',pt:'CRISTIANO · REAL MADRID',en:'CRISTIANO · REAL MADRID',ready:true,layers:['cristiano-hair-v23']},
 {id:'dani-2011-hair',category:'hair',pt:'DANI ALVES · BARCELONA',en:'DANI ALVES · BARCELONA',ready:true,layers:['dani-hair-v23']},
 {id:'ronaldo-frontal-hair',category:'hair',pt:'RONALDO FENÔMENO',en:'RONALDO FENÔMENO',ready:true,layers:['ronaldo-hair-v26']},
 {id:'beckham-curtains-hair',category:'hair',pt:'DAVID BECKHAM',en:'DAVID BECKHAM',ready:true,layers:['beckham-hair-v26']},
 {id:'messi-2023-beard',category:'beard',pt:'BARBA DO MESSI',en:'MESSI BEARD',ready:true,layers:['messi-beard-v24']},
 {id:'dani-2011-beard',category:'beard',pt:'BIGODE E CAVANHAQUE · DANI',en:'MOUSTACHE AND GOATEE · DANI',ready:true,layers:['dani-beard-v25']},
 {id:'maldini-1994-hair',category:'hair',pt:'MALDINI · MILAN',en:'MALDINI · MILAN',ready:true,layers:['maldini-hair-v28']},
 {id:'kaka-2007-hair',category:'hair',pt:'KAKÁ · MILAN',en:'KAKÁ · MILAN',ready:true,layers:['kaka-hair-v28']},
 {id:'maradona-1987-hair',category:'hair',pt:'MARADONA · NAPOLI',en:'MARADONA · NAPOLI',ready:true,layers:['maradona-hair-v29']},
 {id:'batistuta-1998-hair',category:'hair',pt:'BATISTUTA · FIORENTINA',en:'BATISTUTA · FIORENTINA',ready:true,layers:['batistuta-hair-v29']},
 {id:'didi-1958-hair',category:'hair',pt:'DIDI · BOTAFOGO',en:'DIDI · BOTAFOGO',ready:true,layers:['didi-hair-v31']},
 {id:'vini-2024-hair',category:'hair',pt:'VINI JR · REAL MADRID',en:'VINI JR · REAL MADRID',ready:true,layers:['vini-hair-v31']},
 {id:'valderrama-1988-moustache',category:'beard',pt:'BIGODE · VALDERRAMA',en:'MOUSTACHE · VALDERRAMA',ready:true,layers:['valderrama-moustache-v32']},
 {id:'valderrama-1988-hair',category:'hair',pt:'VALDERRAMA · DEPORTIVO CALI',en:'VALDERRAMA · DEPORTIVO CALI',ready:true,layers:['valderrama-hair-v33']},
 {id:'gullit-1988-hair',category:'hair',pt:'GULLIT · MILAN',en:'GULLIT · MILAN',ready:true,layers:['gullit-hair-v34']},
 {id:'gullit-1988-moustache',category:'beard',pt:'BIGODE DO GULLIT',en:'GULLIT MOUSTACHE',ready:true,layers:['gullit-moustache-v34']},
 {id:'vozinha-2026-hair',category:'hair',pt:'VOZINHA · CABO VERDE',en:'VOZINHA · CABO VERDE',ready:true,layers:['vozinha-hair-v33']},
 {id:'vozinha-2026-beard',category:'beard',pt:'BARBA DO VOZINHA',en:'VOZINHA BEARD',ready:true,layers:['vozinha-beard-v33']},
 // Os três avatares mostram o mesmo tipo de brinco; não duplicar por jogador.
 {id:'silver-studs',category:'accessory',pt:'BRINCOS PRATEADOS',en:'SILVER STUDS',ready:true,layers:['silver-stud-left-v25','silver-stud-right-v25'],slot:'ears'},
]

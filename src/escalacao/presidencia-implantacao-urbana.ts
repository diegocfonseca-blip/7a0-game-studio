import {RUAS_BAIRRO_USUARIO} from './residencia-planta'
/** Implantação aprovada por Diego em 14/11. Endereços em metros, compartilhados
 * por prédios, portas, caminhos e câmeras. Não altera compras nem saves. */
export type PontoUrbano={x:number;z:number}
export const retanguloUrbano=(x0:number,x1:number,z0:number,z1:number)=>[{x:x0,z:z0},{x:x1,z:z0},{x:x1,z:z1},{x:x0,z:z1}]
export const caminhoUrbano=(values:readonly (readonly number[])[])=>values.map(([x,z])=>({x,z}))
export const PRACA_TORCEDOR=retanguloUrbano(-88,136,113,212)
// Reserva contínua: casas genéricas e ruas automáticas ficam fora do campus.
export const RESERVA_CAMPUS=retanguloUrbano(-205,315,-288,325)
export const RUAS_CAMPUS=[
 {id:'via-oeste',points:caminhoUrbano([[-220,350],[-220,-190]]),width:11,walk:3},
 {id:'via-leste',points:caminhoUrbano([[330,-190],[330,350]]),width:11,walk:3},
 {id:'avenida-norte',points:caminhoUrbano([[-650,-190],[650,-190]]),width:18,walk:3.5},
 {id:'avenida-comercial',points:caminhoUrbano([[-220,-215],[330,-215]]),width:8,walk:2.5},
 {id:'acesso-comercial-oeste',points:caminhoUrbano([[-220,-190],[-220,-215]]),width:8,walk:2.5},
 {id:'acesso-comercial-leste',points:caminhoUrbano([[330,-215],[330,-190]]),width:8,walk:2.5},
 {id:'acesso-estacionamento',points:caminhoUrbano([[330,100],[280,100]]),width:8,walk:2},
 {id:'bairro-casa-luca-oeste',points:caminhoUrbano([[-220,145],[-156.5,145],[-156.5,207.5],[-220,207.5]]),width:5.8,walk:1.5},
 {id:'bairro-casa-luca-sul',points:caminhoUrbano([[-156.5,207.5],[-90,207.5]]),width:5.8,walk:1.5},
 {id:'acesso-arena',points:caminhoUrbano([[330,275],[275,275]]),width:6,walk:2},
 ...RUAS_BAIRRO_USUARIO,
] as const
export const RUAS_SERVICO_CAMPUS=[
 {id:'rua-interna-oeste',points:caminhoUrbano([[-220,80],[-121,80],[-121,45]]),width:5.8,walk:1.6},
 {id:'ramal-oeste-servicos',points:caminhoUrbano([[-220,-100],[-330,-100]]),width:5.8,walk:1.6},
] as const
export const PORTA_HOTEL_URBANA={id:'hotel',x:-130,z:35,heading:Math.PI/2,stay:45,approach:{x:-125,z:35},threshold:{x:-130,z:35},inside:{x:-133,z:35}}
export const PORTA_BAR_URBANA={id:'chopp',x:117,z:150,heading:0,stay:30,approach:{x:117,z:165},threshold:{x:117,z:150},inside:{x:117,z:147}}
// Os dois primeiros pontos extras conservam a aresta de referência [5]→[4]
// usada pela torre, piscina e acabamentos do hotel.
export const LOTES_URBANOS={
 estacao:retanguloUrbano(-84,84,-165,-145),
 hotel:[{x:-194,z:-9},{x:-127,z:-9},{x:-127,z:58},{x:-194,z:58},{x:-136,z:26},{x:-194,z:26}],
 chopp:retanguloUrbano(90,127,135,163),
 praca:retanguloUrbano(41,125,174,198),
}
export const ROTAS_URBANAS={
 roadOut:caminhoUrbano([[-650,347.4],[-450,347.4],[-250,347.4],[-100,347.4],[0,347.4],[100,347.4],[250,347.4],[450,347.4],[650,347.4]]),
 roadBack:caminhoUrbano([[650,352.6],[450,352.6],[250,352.6],[100,352.6],[0,352.6],[-100,352.6],[-250,352.6],[-450,352.6],[-650,352.6]]),
 sidewalk:caminhoUrbano([[-205,325],[-90,325],[0,325],[140,325],[315,325]]),
 entrance:caminhoUrbano([[0,325],[0,210],[0,170],[0,115],[-4.55,115]]),
 entranceBare:caminhoUrbano([[0,325],[0,210],[0,170],[0,115],[-4.55,115]]),
 shop:caminhoUrbano([[30,165],[60,157],[60,150]]),
 food:caminhoUrbano([[30,165],[83,165],[83,174]]),
 beer:caminhoUrbano([[30,165],[65,165],[85,165],[100,165],[110,165],[117,165]]),
 hotel:caminhoUrbano([[-205,65],[-120,65],[-120,35],[-125,35]]),
 station:caminhoUrbano([[120,-90],[120,-15],[123.5,-9],[123.5,3.5]]),
 parking:caminhoUrbano([[330,100],[280,100],[258,100],[258,35],[240,35]]),
 construction:caminhoUrbano([[-220,80],[-121,80],[-121,45]]),
}
export const JARDINS_URBANOS={
 fonte:retanguloUrbano(-82,-52,176,191),
 'jardim-acesso-hotel':retanguloUrbano(-201,-196,32,52),
 'canteiro-central':retanguloUrbano(-31,-25,135,166),
 'canteiro-direito':retanguloUrbano(136,144,130,160),
 'canteiro-esquerdo':retanguloUrbano(-88,-80,126,150),
 'canteiro-calcada-leste':retanguloUrbano(146,152,22,62),
}

/** Saída da Vadico que está visível junto ao shopping, não do prédio oculto legado. */
export const ENTREGA_VADICO_URBANA={start:{x:252,z:-232},driveway:[{x:270,z:-215,y:.16},{x:270,z:-232,y:.16},{x:260,z:-232,y:.16}]} as const

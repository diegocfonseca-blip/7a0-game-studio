/** 💙 05/11 — CASA LUCA (o projeto do Luca, filho do Diego) no mapa 3D do clube (só a conta do Diego vê o mapa).
 * Fica FORA do complexo do estádio, num quarteirão do bairro colado na avenida diagonal (a principal do oeste), de frente pra praça verde do hotel. O quarteirão inteiro
 * (23 × 23 m) deixa de ter as duas casas e vira a Casa Luca: prédio de 2 andares + pátio com parquinho inclusivo.
 * As ruas, calçadas e travessias em volta continuam exatamente iguais (o quarteirão segue na grade do bairro).
 * Só endereço visual + cartão: nada de compra, save ou dinheiro. */
export const CASA_LUCA={id:'casa-luca',
 /** centro de um quarteirão da grade do bairro (x = −345 + 29k · z = −300 + 29k) */
 x:-142,z:164,half:11.5,
 /** a fachada (rampa, letreiro, coração) olha pra +z do mundo — a mesma direção das casas do bairro e da câmera "Ver tudo" */
 heading:0,
 height:9.2,
} as const
export const LIMITES_CASA_LUCA={minX:CASA_LUCA.x-CASA_LUCA.half,maxX:CASA_LUCA.x+CASA_LUCA.half,minZ:CASA_LUCA.z-CASA_LUCA.half,maxZ:CASA_LUCA.z+CASA_LUCA.half}
/** 💙 Mural "Obrigado a quem ajudou o Luca": só NOMES (nunca valor, total ou contagem). Vazio = o mural não aparece. */
export const AGRADECIMENTOS_CASA_LUCA:readonly string[]=[]

/** 💙 06/11 (Diego, print circulado: *"tinha que ser um pouco maior… cobrindo mais o jardim"*): a Casa Luca virou um COMPLEXO de
 * 3 áreas ligadas por faixas de pedestre — as ruas entre elas continuam exatamente onde estavam:
 * · o quarteirão de sempre (prédio + parquinho);
 * · o JARDIM SENSORIAL no gramado em diagonal a nordeste (entre o quarteirão e a avenida), com as 3 árvores que já estavam lá;
 * · ao sul, a praça das árvores vira o PIQUENIQUE (as árvores e os caminhos ficam) e o quarteirão das 2 casas vira a QUADRA
 *   adaptada + o estacionamento com vagas de cadeirante e a Kombi azul adaptada (as 2 casas saem). */
export const QUADRA_CASA_LUCA_SUL={x:-113,z:193,half:11.5} as const
export const PRACA_CASA_LUCA={x:-142,z:193,half:11.5} as const
/** gramado entre o quarteirão e a avenida diagonal: a borda de cima fica a 10 m do eixo da avenida (fora da calçada e das
 * árvores da rua). 🔁 07/11: o chão do jardim subiu pro nível do terreno único (y 0,16) — o gramado baixo (−0,24) fica por baixo. */
export const JARDIM_CASA_LUCA={chao:.16,poligono:[{x:-129.5,z:152.2},{x:-125.2,z:157},{x:-106.9,z:174.1},{x:-129.5,z:174.1}],
 /** árvores que já existiam no gramado e ficam (o jardim desvia delas) */
 arvores:[{x:-121.1,z:160.9},{x:-122.4,z:167.6},{x:-112.4,z:169.1}]} as const
/** caixas de toque/câmera do complexo inteiro (o mesmo cartão em qualquer parte) */
export const AREAS_CASA_LUCA:readonly {id:string;minX:number;maxX:number;minZ:number;maxZ:number;top:number}[]=[
 {id:'casa',minX:LIMITES_CASA_LUCA.minX,maxX:LIMITES_CASA_LUCA.maxX,minZ:LIMITES_CASA_LUCA.minZ,maxZ:LIMITES_CASA_LUCA.maxZ,top:CASA_LUCA.height},
 {id:'jardim',minX:-130.5,maxX:-106.9,minZ:152.2,maxZ:174.1,top:3},
 {id:'piquenique',minX:PRACA_CASA_LUCA.x-11.5,maxX:PRACA_CASA_LUCA.x+11.5,minZ:PRACA_CASA_LUCA.z-11.5,maxZ:PRACA_CASA_LUCA.z+11.5,top:3},
 {id:'quadra',minX:QUADRA_CASA_LUCA_SUL.x-11.5,maxX:QUADRA_CASA_LUCA_SUL.x+11.5,minZ:QUADRA_CASA_LUCA_SUL.z-11.5,maxZ:QUADRA_CASA_LUCA_SUL.z+11.5,top:4},
 // 🔁 07/11: onde eram as ruas de dentro (agora gramado e caminhos da Casa Luca)
 {id:'passagem-norte',minX:-153.5,maxX:-101.5,minZ:174.1,maxZ:181.5,top:3},
 {id:'passagem-oeste',minX:-130.5,maxX:-124.5,minZ:181.5,maxZ:204.5,top:3},
 {id:'passagem-leste',minX:-101.5,maxX:-97.2,minZ:181.5,maxZ:203,top:3},
]
/** 🔁 07/11 (Diego: *"não gostei das ruas… quero tudo junto nesse espaço todo deles"*): os 4 trechos de rua do bairro que passavam
 * POR DENTRO do complexo saem (a rua z 178,5 entre x −156,5 e −98,5; a rua x −127,5 e a x −98,5 entre z 178,5 e 207,5). O que
 * sobra termina em esquina de verdade: a z 178,5 no cruzamento com a x −156,5, e as x −127,5/−98,5 no cruzamento com a z 207,5.
 * Chave = a mesma do gerador de ruas do bairro (presidencia-complexo-entorno.ts): "ax:az:bx:bz". */
export const RUAS_CORTADAS_CASA_LUCA:readonly string[]=['-156.5:178.5:-127.5:178.5','-127.5:178.5:-98.5:178.5','-127.5:178.5:-127.5:207.5','-98.5:178.5:-98.5:207.5']
/** o TERRENO ÚNICO da Casa Luca (uma cerca só em volta): oeste e sul encostam na calçada das ruas que continuam; o nordeste
 * segue a 10 m do eixo da avenida diagonal; o leste fica onde era a rua x −98,5 (até a calçada do quarteirão vizinho). */
export const TERRENO_CASA_LUCA:readonly {x:number;z:number}[]=[{x:-152,z:152.6},{x:-129.5,z:152.4},{x:-125.2,z:157},{x:-97.2,z:183.2},{x:-97.2,z:203},{x:-152,z:203}]
export const LIMITES_COMPLEXO_CASA_LUCA={minX:Math.min(...AREAS_CASA_LUCA.map(a=>a.minX)),maxX:Math.max(...AREAS_CASA_LUCA.map(a=>a.maxX)),minZ:Math.min(...AREAS_CASA_LUCA.map(a=>a.minZ)),maxZ:Math.max(...AREAS_CASA_LUCA.map(a=>a.maxZ))}

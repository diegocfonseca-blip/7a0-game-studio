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

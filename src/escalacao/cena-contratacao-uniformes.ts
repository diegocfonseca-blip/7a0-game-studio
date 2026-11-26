import {SELOS} from './selos-clubes'
import {uniformeDoTime} from './futebol3d/uniformes.mjs'
import {CORES_CAMISAS_BR} from './cena-contratacao-cores-br'

export type UniformeApresentacao={tipo:string;corpo:string;detalhe:string;gola:string;mangas:string;n:number;largura:number;terceira?:string}
// Classic club identities, not replicas tied to a sponsor or season. Presentation
// only: these recipes do not change the 2D/3D match kits or any player's card.
const W='#f3f1ed',K='#171719',R='#c8102e',B='#176cac',G='#087642'
const liso=(corpo:string,detalhe=W):UniformeApresentacao=>({tipo:'liso',corpo,detalhe,gola:detalhe,mangas:corpo,n:4,largura:.5})
const listras=(tipo:string,corpo:string,detalhe:string,mangas=corpo,terceira?:string):UniformeApresentacao=>({...liso(corpo,detalhe),tipo,mangas,gola:detalhe,n:4,terceira})
const faixa=(corpo:string,detalhe:string,tipo='faixa'):UniformeApresentacao=>({...liso(corpo,detalhe),tipo,largura:.18})
export const UNIFORMES_APRESENTACAO:Record<string,UniformeApresentacao>={
 Flamengo:{...listras('listras_h',R,K,K),gola:K},
 Palmeiras:liso('#006437'),Corinthians:liso(W,K),Santos:liso(W,K),Vasco:faixa(W,K),
 'São Paulo':{...faixa(W,R,'peito_duplo'),terceira:K,gola:K},
 Fluminense:listras('listras_v','#7a1f3d','#00613c','#7a1f3d',W),
 'Grêmio':listras('listras_v',B,K,B,W),Internacional:liso(R),
 Botafogo:listras('listras_v',W,K,K),'Atlético-MG':listras('listras_v',W,K,K),
 Cruzeiro:liso('#0033a0'),'América-MG':listras('listras_v',G,K,G),Bahia:liso(W,B),
 'Vitória':listras('listras_h',R,K,K),Sport:listras('listras_h',R,K,K),
 'Santa Cruz':listras('listras_h',K,R,K,W),'Náutico':listras('listras_v',R,W,R),
 'Ceará':listras('listras_v',W,K,K),Fortaleza:listras('listras_h',B,R,B,W),
 'Athletico-PR':listras('listras_v',R,K,K),Coritiba:{...faixa(W,G,'peito_duplo'),terceira:G},
 'Goiás':liso(G),Chapecoense:liso(G),Guarani:liso(G),'Ponte Preta':faixa(W,K),
 Bragantino:liso(W,R),Bangu:listras('listras_v',R,W,R),'São Caetano':liso('#0033a0'),
 'Atlético-GO':listras('listras_h',R,K,K),'Cuiabá':liso(G,'#edc832'),
 Juventude:listras('listras_v',G,W,G),Remo:liso('#142d59'),
 Paysandu:listras('listras_v','#78bce4',W,'#78bce4'),ABC:liso(W,K),CRB:liso(R),
 CSA:listras('listras_v',B,W,B),'Criciúma':listras('listras_v','#efcb24',K,K),
 'Avaí':listras('listras_v',B,W,B),Figueirense:listras('listras_v',W,K,K),
 'Vila Nova':liso(R),'Brasiliense':liso('#efcb24',G),'Gama':liso(W,G),
 'Paraná':{...liso(R,B),tipo:'metade'},
 'Real Madrid':liso(W,'#292444'),Barcelona:listras('listras_v','#a50044','#004d98','#004d98'),
 'Atlético de Madrid':listras('listras_v',R,W,R),'Real Betis':listras('listras_v',G,W,G),
 'Real Sociedad':listras('listras_v',B,W,B),Espanyol:listras('listras_v',B,W,B),
 'Man United':liso(R,K),'Man City':liso('#6cabdd',W),Liverpool:liso(R),Chelsea:liso('#034694'),
 Arsenal:{...liso(R,W),mangas:W},Tottenham:liso(W,'#132257'),Newcastle:listras('listras_v',W,K,K),
 'Aston Villa':{...liso('#670e36','#95bfe5'),mangas:'#95bfe5'},
 'West Ham':{...liso('#7a263a','#1bb1e7'),mangas:'#1bb1e7'},
 Milan:listras('listras_v',R,K,K),Inter:listras('listras_v','#005ca9',K,K),
 Juventus:listras('listras_v',W,K,W),Roma:liso('#8e1f2f','#e5b23e'),Napoli:liso('#209bd7'),
 Lazio:liso('#85b8df'),Fiorentina:liso('#592c82'),Parma:listras('listras_h','#f0cc25','#17498e'),
 'Bayern':liso(R),Dortmund:{...liso('#f6d522',K),mangas:K},
 'PSG':{...faixa('#152b50',R,'central'),terceira:W},
 Ajax:{...faixa(W,R,'central'),mangas:W},Porto:listras('listras_v',B,W,B),
 Benfica:liso(R),Sporting:listras('listras_h',G,W,G),Celtic:listras('listras_h',G,W,G),
 'Boca Juniors':faixa('#143b76','#edc832','peito'),
 'River Plate':faixa(W,R),'Racing':listras('listras_v','#78bce4',W,'#78bce4'),
 'Peñarol':listras('listras_v','#efcb24',K,K),'Nacional':liso(W,'#12396b'),
}
export function uniformeApresentacao(nome:string,cores:string[]):UniformeApresentacao{
 const proprio=UNIFORMES_APRESENTACAO[nome];if(proprio)return proprio
 const brasileira=CORES_CAMISAS_BR[nome]
 if(brasileira){
  const tipo=nome==='Portuguesa'?'listras_h':nome==='Sampaio Corrêa'?'listras_v':'liso'
  return {...liso(brasileira[0],brasileira[1]),tipo,terceira:brasileira[2]}
 }
 const selo=SELOS[nome]
 return uniformeDoTime(nome,selo?.c1??cores[0],selo?.c2??cores[1]) as UniformeApresentacao
}

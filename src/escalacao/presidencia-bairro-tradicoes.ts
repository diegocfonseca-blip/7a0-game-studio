// 🇧🇷 TRADIÇÕES DO BAIRRO (04/11, aprovado pelo Diego: "a vida da cidade muda com a hora e o calendário… coisas bem
// tradicionais do Brasil, espalhadas pelo mapa"). Regras PURAS (sem three.js) — o desenho mora em presidencia-bairro-tradicoes-3d.ts:
//  🍅 FEIRA LIVRE   — sábado e domingo de MANHÃ, numa rua do bairro;
//  📰 BANCA DE JORNAL — sempre, com a capa d'O MARTELO (manchete do último jogo JÁ APITADO; nunca spoiler);
//  ⚽ PELADA NO CAMPINHO DE TERRA — de TARDE (de manhã e à noite o campinho fica vazio, só as traves).
// E o dia inteiro do bairro (04/11, segunda leva aprovada pelo Diego — "coisas bem tradicionais do Brasil, com pouca peça"):
//  🌅 MANHÃ  — 🥖 padaria aberta com gente tomando café no balcão · 🚲 bicicleta do pão · 🛻 Kombi do gás rodando devagar;
//  ☀️ TARDE  — 🧺 varal com roupa (uma camisa nas cores do clube) · 🍦 sorvete e 🍿 pipoca na praça · 👴 dominó dos senhores;
//  🌙 NOITE  — 🍢 espetinho na brasa na esquina · 🍔 trailer do podrão · 💡 cadeira de praia na calçada · 📺 TV ligada no Oswaldo;
//  🏟️ DIA DE JOGO EM CASA (qualquer hora) — 👕 camisa pirata na porta do estádio · 🐈 churrasquinho de gato · 🧽 flanelinha.
// Nada aqui lê relógio do aparelho nem sorteia: a hora sai do calendário da carreira (dia + hora do jogo) ou da luz do mapa,
// e sem calendário sai uma regra estável pela rodada — o mesmo save mostra a mesma cidade no celular e no PC.

export type PeriodoBairro='manha'|'tarde'|'noite'
export type ContextoBairro={
 /** dia do calendário da carreira (ms UTC, `diaDaRodada`/`hoje` de calendario.ts) — nunca a data do aparelho */
 dia?:number
 /** hora do compromisso do dia (16 = liga, 21 = Copa), quando a tela sabe */
 hora?:number
 /** a luz que o mapa já está usando (a noite da Copa acende os refletores) */
 luz?:'day'|'night'
 /** sem calendário: a regra estável sai da rodada */
 temporada?:number
 rodada?:number
 /** é dia de jogo NO NOSSO estádio (a jornada do mapa: `hosting` e fase diferente de 'idle') */
 jogoEmCasa?:boolean
}
export type VidaBairro={dow:number;periodo:PeriodoBairro;feira:boolean;pelada:boolean;calendario:boolean
 /** 🥖 padaria com o balcão cheio · 🚲🛻 bicicleta do pão e Kombi do gás (manhã) */
 padaria:boolean;entregas:boolean
 /** 🧺 varal · 🍦🍿👴 carrinhos e dominó na praça (tarde) */
 varal:boolean;praca:boolean
 /** 🍢🍔 espetinho e podrão · 💡 cadeira na calçada · 📺 TV do boteco (noite) */
 espetinho:boolean;cadeiras:boolean;tv:boolean
 /** 👕🐈🧽 camelô de camisa pirata, churrasquinho de gato e flanelinha (dia de jogo em casa) */
 jogoEmCasa:boolean}

const DIA_MS=86400000
const inteiro=(n:unknown):n is number=>typeof n==='number'&&Number.isFinite(n)

/** Dia da semana (0 = domingo … 6 = sábado). Com calendário, o do dia; sem ele, alterna sábado (rodada par) e quinta (ímpar). */
export function diaDaSemanaBairro(c:ContextoBairro={}):number{
 if(inteiro(c.dia))return ((Math.floor(c.dia/DIA_MS)+4)%7+7)%7 // 01/01/1970 foi quinta
 const r=inteiro(c.rodada)?Math.trunc(c.rodada):0,t=inteiro(c.temporada)?Math.trunc(c.temporada):1
 return (r+t)%2===0?6:4
}

/** Manhã, tarde ou noite. Ordem: luz da noite do mapa › hora do compromisso › o jeito do dia da semana. */
export function periodoDoBairro(c:ContextoBairro={}):PeriodoBairro{
 if(c.luz==='night')return 'noite'
 if(inteiro(c.hora))return c.hora<12?'manha':c.hora<18?'tarde':'noite'
 const dow=diaDaSemanaBairro(c)
 // fim de semana sem jogo marcado = manhã (dia de feira); dia de semana = tarde (molecada saindo da escola)
 return dow===0||dow===6?'manha':'tarde'
}

/** 🍅 Feira livre: só sábado e domingo de manhã. */
export const feiraAberta=(dow:number,periodo:PeriodoBairro)=>(dow===0||dow===6)&&periodo==='manha'
/** ⚽ Pelada: só de tarde. */
export const peladaRolando=(periodo:PeriodoBairro)=>periodo==='tarde'

export function vidaDoBairro(c:ContextoBairro={}):VidaBairro{
 const dow=diaDaSemanaBairro(c),periodo=periodoDoBairro(c)
 const manha=periodo==='manha',tarde=periodo==='tarde',noite=periodo==='noite'
 return {dow,periodo,feira:feiraAberta(dow,periodo),pelada:peladaRolando(periodo),calendario:inteiro(c.dia),
  padaria:manha,entregas:manha,varal:tarde,praca:tarde,espetinho:noite,cadeiras:noite,tv:noite,jogoEmCasa:c.jogoEmCasa===true}
}

export type MancheteMartelo={chapeu:string;titulo:string;linha:string}
/** 📰 A capa d'O MARTELO na banca. `ultimo` é o MESMO dado que a cidade viva já recebe (só jogo apitado — quem chama
 *  passa `null` enquanto o placar não apareceu na tela). Sem dado válido, a manchete genérica do pregão. */
export function mancheteDaBanca(ultimo:{gf:number;ga:number}|null|undefined,clube:string|undefined,en:boolean):MancheteMartelo{
 const ok=!!ultimo&&[ultimo.gf,ultimo.ga].every(n=>Number.isSafeInteger(n)&&n>=0&&n<100)
 const nome=(clube??'').trim().slice(0,22).toUpperCase()
 const chapeu=en?'THE SPORTS DAILY':'O DIÁRIO DO LEILÃO'
 if(!ok||!ultimo)return {chapeu,titulo:en?'THE AUCTION IS OPEN':'O PREGÃO ESTÁ ABERTO',linha:en?'Bids, legends and the next round':'Lances, lendas e a próxima rodada'}
 const placar=`${ultimo.gf} × ${ultimo.ga}`
 if(ultimo.gf>ultimo.ga)return {chapeu,titulo:en?`WIN! ${placar}`:`VITÓRIA! ${placar}`,linha:nome?(en?`${nome} celebrates in the neighbourhood`:`${nome} faz a festa no bairro`):(en?'The neighbourhood celebrates':'O bairro faz a festa')}
 if(ultimo.gf<ultimo.ga)return {chapeu,titulo:en?`DEFEAT: ${placar}`:`TROPEÇO: ${placar}`,linha:nome?(en?`${nome} needs to react`:`${nome} precisa reagir`):(en?'Time to react':'Hora de reagir')}
 return {chapeu,titulo:en?`DRAW: ${placar}`:`EMPATE: ${placar}`,linha:nome?(en?`${nome} shares the points`:`${nome} divide os pontos`):(en?'Points shared':'Pontos divididos')}
}

type P={x:number;z:number}
export type CaixaChao={minX:number;maxX:number;minZ:number;maxZ:number;base?:number;footprint?:readonly P[]}
export type LugaresBairro={
 banca?:{x:number;z:number;yaw:number}
 feira?:{a:P;b:P;/** perpendicular da rua apontando pro lado das barracas */lado:P}
 campinho?:P
 /** 🥖 a casa que vira padaria: `x` = porta, `frente` = z da fachada, `w` = largura da casa */
 padaria?:{x:number;frente:number;w:number}
 /** 🧺 varais no quintal da frente (ao longo de x) */
 varais?:{x:number;z:number;len:number}[]
 /** 💡 portas com cadeira de praia na calçada (o ponto é a porta; as cadeiras ficam na frente dela) */
 cadeiras?:{x:number;z:number}[]
 /** 🍦🍿👴 a praça do dominó e dos carrinhos */
 praca?:{centro:P;domino:P;sorvete:P;pipoca:P}
 /** 🍢 espetinho e 🍔 podrão, nas duas esquinas da frente de uma quadra (yaw 0 = virado pra rua de baixo, +z) */
 espetinho?:{x:number;z:number;yaw:number}
 podrao?:{x:number;z:number;yaw:number}
 /** 🛻🚲 voltas no quarteirão (centro da quadra; a faixa anda a `meia` m do centro) */
 kombi?:{centro:P;meia:number;raio:number;sentido:1|-1}
 /** a bicicleta dá a volta no MESMO quarteirão, na outra mão da rua (sentido contrário, curva mais aberta) */
 bicicleta?:{centro:P;meia:number;raio:number;sentido:1|-1}
}
export type CasaBairro={x:number;z:number;w:number;d:number;h?:number;andares?:number}
/** meia largura da faixa de rua em volta da quadra (rua no eixo a 14,5 m do centro): mão de dentro e mão de fora */
export const FAIXA_VOLTA=12.9,FAIXA_VOLTA_FORA=16.1
const naCaixa=(p:P,s:CaixaChao,m:number)=>p.x>s.minX-m&&p.x<s.maxX+m&&p.z>s.minZ-m&&p.z<s.maxZ+m
const dentroPoligono=(p:P,poly:readonly P[])=>{let d=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if((a.z>p.z)!==(b.z>p.z)&&p.x<(b.x-a.x)*(p.z-a.z)/(b.z-a.z)+a.x)d=!d}return d}
const distSeg=(p:P,a:P,b:P)=>{const dx=b.x-a.x,dz=b.z-a.z,l=dx*dx+dz*dz,t=l?Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.z-a.z)*dz)/l)):0;return Math.hypot(p.x-a.x-dx*t,p.z-a.z-dz*t)}
/** O sólido ocupa o ponto (com folga `m`)? Pelo contorno quando ele tem (o bbox de um viaduto torto cobre meio bairro);
 *  sólido alto no ar (viaduto, passarela: base acima de 2,6 m) não atrapalha nada no chão. */
const dentro=(p:P,s:CaixaChao,m:number)=>{
 if((s.base??0)>2.6||!naCaixa(p,s,m))return false
 const f=s.footprint;if(!f||f.length<3)return true
 return dentroPoligono(p,f)||f.some((a,i)=>distSeg(p,a,f[(i+1)%f.length])<m)
}

/** Onde cada coisa fica (pura, para o teste). Tudo nasce do bairro que o entorno já desenhou:
 *  · banca: um canto livre de uma quadra perto do Boteco do Oswaldo (sem encostar em casa, boteco ou prédio);
 *  · feira: um trecho de rua do bairro perto do boteco, mas não o da frente dele (a mesa da festa fica livre);
 *  · campinho: a praça pública que o entorno reservou pra ele (sem árvore e sem banco no meio). */
export function lugaresDoBairro(input:{quadras:readonly P[];ruas:readonly (readonly [P,P])[];campinho?:P;boteco?:P;solidos:readonly CaixaChao[];casas?:readonly CasaBairro[];praca?:P}):LugaresBairro{
 const out:LugaresBairro={}
 const ancora=input.boteco??input.quadras[0]
 if(!ancora)return out
 const livre=(p:P,m:number)=>!input.solidos.some(s=>dentro(p,s,m))
 // 📰 banca: quadras mais perto do boteco primeiro; nos 4 cantos, o primeiro livre (2,2 m de folga de qualquer sólido)
 const quadras=[...input.quadras].sort((a,b)=>Math.hypot(a.x-ancora.x,a.z-ancora.z)-Math.hypot(b.x-ancora.x,b.z-ancora.z))
 achaBanca:for(const q of quadras.slice(0,8))for(const [sx,sz] of [[-1,1],[1,1],[-1,-1],[1,-1]]){
  const p={x:q.x+sx*9.4,z:q.z+sz*9.4}
  if(input.boteco&&Math.hypot(p.x-input.boteco.x,p.z-(input.boteco.z+9))<9)continue // a frente do boteco (mesas) fica livre
  if(!livre(p,2.2))continue
  // a banca vira pra rua do lado de fora da quadra (z), igual banca de esquina
  out.banca={...p,yaw:sz>0?0:Math.PI};break achaBanca
 }
 // 🍅 feira: rua com as duas pontas em cruzamento de quadra, entre 30 e 120 m do boteco, longe da frente dele
 const ruas=input.ruas.map(([a,b])=>({a,b,m:{x:(a.x+b.x)/2,z:(a.z+b.z)/2}}))
  .filter(r=>{const d=Math.hypot(r.m.x-ancora.x,r.m.z-ancora.z);return d>30&&d<120&&Math.abs(Math.hypot(r.b.x-r.a.x,r.b.z-r.a.z)-29)<.5})
  .filter(r=>!input.boteco||Math.hypot(r.m.x-input.boteco.x,r.m.z-(input.boteco.z+16))>20)
  .filter(r=>!out.banca||Math.hypot(r.m.x-out.banca.x,r.m.z-out.banca.z)>16)
  .filter(r=>[.25,.5,.75].every(t=>livre({x:r.a.x+(r.b.x-r.a.x)*t,z:r.a.z+(r.b.z-r.a.z)*t},.4)))
  .sort((r,s)=>Math.hypot(r.m.x-ancora.x,r.m.z-ancora.z)-Math.hypot(s.m.x-ancora.x,s.m.z-ancora.z))
 const rua=ruas[0]
 if(rua){const L=Math.hypot(rua.b.x-rua.a.x,rua.b.z-rua.a.z),ux=(rua.b.x-rua.a.x)/L,uz=(rua.b.z-rua.a.z)/L;out.feira={a:rua.a,b:rua.b,lado:{x:-uz,z:ux}}}
 if(input.campinho)out.campinho={x:input.campinho.x,z:input.campinho.z}
 try{extrasDoBairro(input,out,ancora,livre)}catch{/* o resto do bairro segue sem as tradições novas */}
 return out
}

const perto=(a:P,b:P)=>Math.hypot(a.x-b.x,a.z-b.z)
/** A segunda leva (padaria, varal, cadeiras, praça, espetinho/podrão, voltas da Kombi e da bicicleta). Tudo pelo bairro que já
 *  existe: a quadra é sempre 23 × 23 com duas casas (x ± 5,6) viradas pra +z, a árvore no meio da frente (z + 8,6) e rua no eixo
 *  a 14,5 m do centro. Uma quadra só serve UMA coisa — nada se amontoa e nada encosta em sólido. */
function extrasDoBairro(input:Parameters<typeof lugaresDoBairro>[0],out:LugaresBairro,ancora:P,livre:(p:P,m:number)=>boolean){
 const quadraDe=(p:P)=>input.quadras.reduce<P|undefined>((m,q)=>!m||perto(q,p)<perto(m,p)?q:m,undefined)
 const usadas=new Set<P>()
 const usa=(q:P|undefined)=>{if(q)usadas.add(q)}
 if(out.banca)usa(quadraDe(out.banca))
 if(input.boteco)usa(quadraDe(input.boteco)) // a quadra do boteco é das mesas da festa
 const todosLivres=(ps:readonly P[],m:number)=>ps.every(p=>livre(p,m))
 const casas=[...(input.casas??[])].map(c=>({c,q:quadraDe(c)})).filter((x):x is {c:CasaBairro;q:P}=>!!x.q&&perto(x.q,x.c)<8)
  .sort((a,b)=>perto(a.c,ancora)-perto(b.c,ancora))
 // 🥖 padaria: a casa baixa mais perto do boteco, fora das quadras já usadas, com a calçada da frente livre
 for(const {c,q} of casas){
  if(usadas.has(q)||(c.andares??1)>2)continue
  const frente=c.z+c.d/2
  if(!todosLivres([{x:c.x-2,z:frente+1.5},{x:c.x+2,z:frente+1.5},{x:c.x,z:frente+3}],1))continue
  out.padaria={x:c.x,frente,w:c.w};usa(q);break
 }
 // 🍢🍔 espetinho e podrão: um em cada esquina da MESMA travessa (quadra A, à direita; quadra B, vizinha, à esquerda) —
 // um de frente pro outro, com a rua no meio, como é na vida
 const quadraEm=(x:number,z:number)=>input.quadras.find(q=>Math.abs(q.x-x)<.5&&Math.abs(q.z-z)<.5)
 for(const q of [...input.quadras].sort((a,b)=>perto(a,ancora)-perto(b,ancora))){
  const d=perto(q,ancora),v=quadraEm(q.x+29,q.z);if(!v||usadas.has(q)||usadas.has(v)||d<25||d>140)continue
  const e={x:q.x+10.2,z:q.z+9.7},p={x:v.x-9.9,z:v.z+9.4}
  if(!todosLivres([e,p,{x:e.x,z:e.z+1.5},{x:p.x,z:p.z+1.8}],1.6))continue
  out.espetinho={...e,yaw:0};out.podrao={...p,yaw:0};usa(q);usa(v);break
 }
 // 🧺 varal (4 casas) e 💡 cadeira na calçada (3 casas): casas diferentes, fora das quadras já usadas
 const varais:{x:number;z:number;len:number}[]=[],cadeiras:{x:number;z:number}[]=[],casaUsada=new Set<CasaBairro>()
 for(const {c,q} of casas){
  if(varais.length>=4)break
  if(usadas.has(q))continue
  const lado=Math.sign(c.x-q.x)||1,frente=c.z+c.d/2,z=Math.min(q.z+9.2,frente+(q.z+11.5-frente)*.48),x=c.x+lado*1
  if(z-frente<1.6||!todosLivres([{x:x-1.8,z},{x:x+1.8,z}],.8))continue
  varais.push({x,z,len:3.6});casaUsada.add(c)
 }
 for(const {c,q} of casas){
  if(cadeiras.length>=3)break
  if(usadas.has(q)||casaUsada.has(c))continue
  const frente=c.z+c.d/2,p={x:c.x,z:frente}
  if(!todosLivres([{x:c.x-1.2,z:frente+1.3},{x:c.x+1.2,z:frente+1.3}],.8))continue
  cadeiras.push(p);casaUsada.add(c)
 }
 if(varais.length)out.varais=varais
 if(cadeiras.length)out.cadeiras=cadeiras
 // 🍦🍿👴 praça: a mesa no canto sem árvore (+x, −z) e os carrinhos no passeio de baixo, longe do banco (+4, +2,5)
 if(input.praca){
  const c=input.praca,domino={x:c.x+5.2,z:c.z-5.8},sorvete={x:c.x-2.4,z:c.z-3.6},pipoca={x:c.x+1.9,z:c.z-4.4}
  if(todosLivres([domino,sorvete,pipoca],1.4))out.praca={centro:{x:c.x,z:c.z},domino,sorvete,pipoca}
 }
 // 🛻🚲 voltas: quadra com as 4 ruas em volta (nenhuma é a da feira); a quadra da FRENTE da padaria primeiro (a rua da porta dela
 // é a de cima dessa quadra), depois a própria quadra da padaria, depois as mais perto do boteco. A Kombi vai na mão de dentro e a
 // bicicleta na de fora, em sentido contrário — cruzam na porta da padaria, cada uma na sua mão.
 const temRua=(a:P,b:P)=>input.ruas.some(([r,s])=>perto(r,a)<.6&&perto(s,b)<.6||perto(r,b)<.6&&perto(s,a)<.6)
 const daFeira=(a:P,b:P)=>!!out.feira&&(perto(out.feira.a,a)<.6&&perto(out.feira.b,b)<.6||perto(out.feira.a,b)<.6&&perto(out.feira.b,a)<.6)
 const qPad=out.padaria?quadraDe({x:out.padaria.x,z:out.padaria.frente-3}):undefined,qFrente=qPad?quadraEm(qPad.x,qPad.z+29):undefined
 const rank=(q:P)=>q===qFrente?-2:q===qPad?-1:0
 for(const q of [...input.quadras].sort((a,b)=>rank(a)-rank(b)||perto(a,ancora)-perto(b,ancora))){
  const d=perto(q,ancora);if((d<20||d>170)&&!rank(q))continue
  const k=[{x:q.x-14.5,z:q.z-14.5},{x:q.x+14.5,z:q.z-14.5},{x:q.x+14.5,z:q.z+14.5},{x:q.x-14.5,z:q.z+14.5}]
  const lados=k.map((a,i)=>[a,k[(i+1)%4]] as const)
  if(!lados.every(([a,b])=>temRua(a,b)&&!daFeira(a,b)))continue
  const pontos=(meia:number)=>lados.flatMap(([a,b])=>[.2,.5,.8].map(t=>({x:a.x+(b.x-a.x)*t,z:a.z+(b.z-a.z)*t}))).map(p=>({x:q.x+(p.x-q.x)*meia/14.5,z:q.z+(p.z-q.z)*meia/14.5}))
  if(!todosLivres([...pontos(FAIXA_VOLTA),...pontos(FAIXA_VOLTA_FORA)],.9))continue
  out.kombi={centro:{x:q.x,z:q.z},meia:FAIXA_VOLTA,raio:2.6,sentido:1}
  out.bicicleta={centro:{x:q.x,z:q.z},meia:FAIXA_VOLTA_FORA,raio:2.6+FAIXA_VOLTA_FORA-FAIXA_VOLTA,sentido:-1}
  break
 }
}

/** Uma volta no quarteirão (retângulo de cantos arredondados), anti-horária vista de cima. `s` em metros. */
export function pontoDaVolta(centro:P,meia:number,s:number,raio=2.6):{x:number;z:number;yaw:number;perimetro:number}{
 const reta=2*(meia-raio),arco=Math.PI*raio/2,lado=reta+arco,per=4*lado
 let u=((s%per)+per)%per
 const i=Math.floor(u/lado);u-=i*lado
 // lado 0 anda +x em z = −meia; 1 anda +z em x = +meia; 2 anda −x em z = +meia; 3 anda −z em x = −meia
 const dirs=[[1,0],[0,1],[-1,0],[0,-1]] as const,[dx,dz]=dirs[i],[nx,nz]=dirs[(i+1)%4]
 const inicio={x:centro.x+(i===0?-reta/2:i===1?meia:i===2?reta/2:-meia),z:centro.z+(i===0?-meia:i===1?-reta/2:i===2?meia:reta/2)}
 if(u<=reta){const x=inicio.x+dx*u,z=inicio.z+dz*u;return{x,z,yaw:Math.atan2(dx,dz),perimetro:per}}
 const a=(u-reta)/raio,cx=inicio.x+dx*reta+nx*raio,cz=inicio.z+dz*reta+nz*raio
 const x=cx-nx*raio*Math.cos(a)+dx*raio*Math.sin(a),z=cz-nz*raio*Math.cos(a)+dz*raio*Math.sin(a)
 const tx=dx*Math.cos(a)+nx*Math.sin(a),tz=dz*Math.cos(a)+nz*Math.sin(a)
 return{x,z,yaw:Math.atan2(tx,tz),perimetro:per}
}

/** 🏟️ Dia de jogo em casa: onde ficam os "comércios" da porta do estádio. Coordenadas fixas do complexo (o portão dos
 *  mandantes é o mesmo em todo save): longe da fila da torcida (x = −3,3), das barracas oficiais e das peruas delas
 *  (presas no teste contra `MATCHDAY_STALLS`, `matchdayFanPoints` e `vendorDelivery`). yaw 0 = virado pra +z (pra quem chega). */
export const LUGARES_DIA_DE_JOGO={
 /** 👕 camelô de camisa pirata, do lado direito do portão */
 pirata:{x:7.6,z:97,yaw:-.6},
 /** 🐈 churrasquinho de gato, logo atrás do camelô, virado pra fila da torcida */
 gato:{x:8.8,z:101.4,yaw:-Math.PI/2},
 /** 🧽 flanelinha, na entrada do 1º estacionamento (anda pra lá e pra cá ao longo de `yaw` + 90°) */
 flanelinha:{x:44,z:182,yaw:0},
} as const

/** Onde a Kombi/bicicleta está depois de andar `metros` na volta dela (o sentido contrário anda de ré na conta e vira de frente). */
export function poseNaVolta(v:{centro:P;meia:number;raio:number;sentido:1|-1},metros:number){
 const p=pontoDaVolta(v.centro,v.meia,v.sentido*metros,v.raio)
 return{x:p.x,z:p.z,yaw:v.sentido>0?p.yaw:p.yaw+Math.PI}
}

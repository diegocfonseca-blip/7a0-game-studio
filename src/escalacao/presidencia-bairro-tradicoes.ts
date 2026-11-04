// 🇧🇷 TRADIÇÕES DO BAIRRO (04/11, aprovado pelo Diego: "a vida da cidade muda com a hora e o calendário… coisas bem
// tradicionais do Brasil, espalhadas pelo mapa"). Regras PURAS (sem three.js) — o desenho mora em presidencia-bairro-tradicoes-3d.ts:
//  🍅 FEIRA LIVRE   — sábado e domingo de MANHÃ, numa rua do bairro;
//  📰 BANCA DE JORNAL — sempre, com a capa d'O MARTELO (manchete do último jogo JÁ APITADO; nunca spoiler);
//  ⚽ PELADA NO CAMPINHO DE TERRA — de TARDE (de manhã e à noite o campinho fica vazio, só as traves).
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
}
export type VidaBairro={dow:number;periodo:PeriodoBairro;feira:boolean;pelada:boolean;calendario:boolean}

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
 return {dow,periodo,feira:feiraAberta(dow,periodo),pelada:peladaRolando(periodo),calendario:inteiro(c.dia)}
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
}
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
export function lugaresDoBairro(input:{quadras:readonly P[];ruas:readonly (readonly [P,P])[];campinho?:P;boteco?:P;solidos:readonly CaixaChao[]}):LugaresBairro{
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
 return out
}

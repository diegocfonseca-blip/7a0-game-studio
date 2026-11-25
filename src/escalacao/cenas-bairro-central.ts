import type {FatoBairro} from './cenas-bairro-fatos'
import {cenaPodeAparecer,type AcaoBairro,type DiarioBairro} from './cenas-bairro-model'
import type {CentralSede} from './central'
type Cena=CentralSede&{prioridade:number;grupo:string;acao:AcaoBairro}
export const CENAS_LIDAS='esc-cenas-bairro-lidas-v2'
export function lerCenasLidas():string[]{try{const v=JSON.parse(localStorage.getItem(CENAS_LIDAS)??'[]');return Array.isArray(v)?v.filter(x=>typeof x==='string').slice(-80):[]}catch{return[]}}
export function guardarCenasLidas(chaves:string[]){const v=[...new Set(chaves)].slice(-80);try{localStorage.setItem(CENAS_LIDAS,JSON.stringify(v))}catch{/* navegação funciona sem armazenamento */}return v}
/** Só usa fatos já revelados; não roda partidas nem grava acontecimentos no save. */
export function cenasDoBairro(d:{
 chegadaIlustrada?:boolean;mapaDisponivel?:boolean;viagem?:{id:string;adversario:string;fase:string};fatos?:FatoBairro[];chave:string;carreiraKey?:string;diario?:DiarioBairro;tituloId?:string;temporada:number;rodada:number;clube:string;t:(pt:string,en:string)=>string;
 imagens:Record<'estadio'|'clube'|'noite'|'carreata'|'obra'|'festa'|'triste'|'feira',string>;
 estreia?:{estadio:string;adversario:string};carreata?:boolean;
 evento?:{origemRodada?:number;nome:string;club?:string;year?:number;cardId?:string;variante?:string;status:string;subNome?:string}|null;
 obras?:{obra:string}[];ultimo?:{gf:number;ga:number;rival?:boolean}|null;
 desfecho?:{tipo:string;para:string}|null;feira?:boolean;
 vendas?:{season:number;camisas:number;anterior?:number};
 recorde?:{id?:string;gf:number;ga:number;adversario:string};saida?:{nome:string;destino:string;valor:number};
}):Cena[]{
 const out:Cena[]=[],t=d.t,base={rotulo:t('Enquanto isso no bairro','Meanwhile in the neighbourhood')}
 const prefix=d.carreiraKey??d.chave.split(':').slice(0,-1).join(':'),group=`${prefix}:jogo:${d.temporada}:${d.rodada}`
 const add=(prioridade:number,id:string,scene:Omit<CentralSede,'chave'|'rotulo'>)=>out.push({...base,...scene,...(d.chegadaIlustrada&&scene.acao==='contratacao'?{apresentacaoCentral:true}:{}),chave:`${prefix}:${id}`,prioridade,grupo:scene.grupo??group,acao:scene.acao??'torcida'})
 if(d.carreata&&d.tituloId)add(100,`titulo:${d.tituloId}`,{acao:'titulo',grupo:`${prefix}:titulo:${d.tituloId}`,vista:'city-street',img:d.imagens.carreata,tom:'bom',chapeu:t('🏆 O bairro é campeão','🏆 A winning neighbourhood'),titulo:t('A taça saiu para as ruas','The trophy takes to the streets'),texto:t('O título já está confirmado. Acompanhe a carreata do clube no mapa.','The title is confirmed. Follow the club parade on the map.')})
 if(!d.carreata&&d.desfecho&&['acesso','queda'].includes(d.desfecho.tipo)){
  const sobe=d.desfecho.tipo==='acesso'
  add(95,`desfecho:${d.temporada}`,{acao:sobe?'acesso':'torcida',vista:'entrance',img:d.imagens.estadio,tom:sobe?'bom':'ruim',chapeu:t('🏟️ Fim de temporada','🏟️ Season finale'),titulo:sobe?t(`Acesso confirmado à ${d.desfecho.para}`,`Promotion to ${d.desfecho.para}`):t(`O próximo capítulo é na ${d.desfecho.para}`,`The next chapter is in ${d.desfecho.para}`),texto:t('A campanha terminou. Este é o novo destino do clube para a próxima temporada.','The campaign is over. This is the club’s destination for next season.')})
 }
 if(d.recorde&&d.recorde.gf-d.recorde.ga>=4){const r=d.recorde;add(85,`recorde:${d.temporada}:${r.id??d.rodada}`,{acao:'recorde',vista:'entrance',img:d.imagens.festa,tom:'bom',chapeu:t('📚 Memória do clube','📚 Club memory'),titulo:t('Uma vitória para a história','A win for the history books'),texto:t(`${d.clube} fez ${r.gf} a ${r.ga} contra ${r.adversario}. É a maior vitória desde o início deste registro.`,`${d.clube} beat ${r.adversario} ${r.gf}-${r.ga}. This is the biggest win since this log started.`)})}
 if(d.saida&&d.saida.valor>=25){const s=d.saida;add(75,`saida:${d.temporada}:${d.rodada}:${s.nome}`,{acao:'despedida',vista:'entrance',img:d.imagens.estadio,chapeu:t('🔁 Despedida confirmada','🔁 Confirmed departure'),titulo:t(`${s.nome} deixa o clube`,`${s.nome} leaves the club`),texto:t(`Negociação registrada: ${s.destino} pagou ${s.valor} moedas. A história dele no clube continua no acervo.`,`Recorded transfer: ${s.destino} paid ${s.valor} coins. His club history remains in the collection.`)})}
 if(d.estreia)add(70,`estreia-casa:${d.temporada}`,{acao:'torcida',vista:'matchday',img:d.imagens.estadio,tom:'bom',chapeu:t('🎟️ Estreia em casa','🎟️ First home game'),titulo:t(`A torcida chega ao ${d.estreia.estadio}`,`Fans arrive at ${d.estreia.estadio}`),texto:`${d.clube} × ${d.estreia.adversario}. ${t('Acompanhe a chegada no estádio.','Watch the arrival at the stadium.')}`})
 if(d.evento){const e=d.evento,praia=e.variante==='futevolei';add(80,`evento:${d.temporada}:${e.origemRodada??d.rodada}:${e.nome}`,{ator:{nome:e.nome,club:e.club,year:e.year,id:e.cardId},acao:praia?'lazer':'noitada',vista:praia?'clube-lazer':'balada',img:praia?d.imagens.clube:d.imagens.noite,tom:'ruim',hora:praia?t('10H DA MANHÃ','10 AM'):t('2H DA MANHÃ','2 AM'),chapeu:praia?t('🏐 Fora do treino','🏐 Away from training'):t('🍾 Fora da concentração','🍾 Away from the team hotel'),titulo:praia?t(`${e.nome} foi jogar futevôlei`,`${e.nome} went to play footvolley`):t(`${e.nome} foi para a balada`,`${e.nome} went clubbing`),texto:e.status==='campo'?t('Você decidiu mantê-lo em campo.','You chose to keep him in the team.'):t(`Ele ficou no banco${e.subNome?` — ${e.subNome} entra no lugar`:''}.`,`He was benched${e.subNome?` — ${e.subNome} takes his place`:''}.`)})}
 if(d.viagem){const v=d.viagem;add(83,`viagem:${v.id}`,{acao:'viagem',vista:'hotel',img:d.imagens.estadio,chapeu:t('🚌 Concentração para a decisão','🚌 Preparing for the big match'),titulo:t(`Rumo à ${v.fase}`,`Heading to the ${v.fase}`),texto:t(`${d.clube} enfrenta ${v.adversario}. O confronto já está confirmado na competição.`,`${d.clube} face ${v.adversario}. The fixture is confirmed in the competition.`)})}
 for(const f of d.fatos??[])add(f.prioridade,f.id,{acao:f.acao,vista:f.vista,ator:f.ator,img:f.acao==='recuperacao'||f.acao==='retorno'?d.imagens.clube:d.imagens.estadio,chapeu:t(...f.chapeu),titulo:t(...f.titulo),texto:t(...f.texto)})
 const nomes:Record<string,[string,string,string]>={loja:['A loja oficial','The club shop','loja'],estac:['O estacionamento','The car park','estacionamento'],praca:['A praça','The plaza','praca'],chopp:['A choperia','The beer bar','chopp'],estacao:['A estação','The station','estacao'],hotel:['O hotel','The hotel','hotel']}
 for(const o of d.obras??[]){const n=nomes[o.obra]??['A estrutura','The facility','region'];add(60,`obra:${d.temporada}:${d.rodada}:${o.obra}`,{acao:'obra',vista:n[2],img:d.imagens.obra,chapeu:t('🏗️ Evolução do clube','🏗️ Club development'),titulo:t(`${n[0]} está em obras`,`${n[1]} is under construction`),texto:t('A obra que você comprou já tem canteiro no mapa.','The facility you purchased now has a construction site on the map.')})}
 if(d.vendas){const v=d.vendas,cresceu=v.anterior!=null&&v.camisas>=v.anterior*1.25&&v.camisas-v.anterior>=100;
  if(cresceu||v.anterior==null&&v.camisas>=1000)add(78,`vendas:${v.season}`,{acao:'loja',vista:'loja',img:d.imagens.obra,tom:'bom',chapeu:t('👕 Loja do clube','👕 Club shop'),titulo:cresceu?t('As camisas ganharam as ruas','Club shirts take to the streets'):t('A torcida vestiu o clube','Supporters wear the club colours'),texto:cresceu?t(`A loja vendeu ${v.camisas} camisas na T${v.season}, contra ${v.anterior} no balanço anterior.`,`The shop sold ${v.camisas} shirts in season ${v.season}, compared with ${v.anterior} in the previous statement.`):t(`Balanço confirmado: ${v.camisas} camisas vendidas na temporada ${v.season}.`,`Confirmed statement: ${v.camisas} shirts sold in season ${v.season}.`)})
 }
 if(d.ultimo?.rival&&d.ultimo.gf>d.ultimo.ga&&!d.recorde){const u=d.ultimo;
  add(65,`classico:${d.temporada}:${d.rodada}`,{acao:'classico',vista:'boteco-oswaldo',img:d.imagens.festa,tom:'bom',chapeu:t('⚔️ Depois do clássico','⚔️ After the derby'),titulo:t('O clássico é nosso','The derby is ours'),texto:t(`A vitória por ${u.gf} a ${u.ga} no rival virou comemoração no bairro.`,`The ${u.gf}-${u.ga} win over your rival sparked a neighbourhood celebration.`)})
 }
 const sorted=out.sort((a,b)=>b.prioridade-a.prioridade)
 return sorted.filter(c=>(d.mapaDisponivel!==false||c.apresentacaoCentral)&&cenaPodeAparecer(c,d.diario,d.temporada,d.rodada)).slice(0,1)
}

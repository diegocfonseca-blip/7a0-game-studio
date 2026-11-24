import type {CentralSede} from './central'
type Cena=CentralSede&{prioridade:number}
export const CENAS_LIDAS='esc-cenas-bairro-lidas-v2'
export function lerCenasLidas():string[]{try{const v=JSON.parse(localStorage.getItem(CENAS_LIDAS)??'[]');return Array.isArray(v)?v.filter(x=>typeof x==='string').slice(-80):[]}catch{return[]}}
export function guardarCenasLidas(chaves:string[]){const v=[...new Set(chaves)].slice(-80);try{localStorage.setItem(CENAS_LIDAS,JSON.stringify(v))}catch{/* navegação funciona sem armazenamento */}return v}
/** Só usa fatos já revelados; não roda partidas nem grava acontecimentos no save. */
export function cenasDoBairro(d:{
 chave:string;temporada:number;rodada:number;clube:string;t:(pt:string,en:string)=>string;
 imagens:Record<'estadio'|'clube'|'noite'|'carreata'|'obra'|'festa'|'triste'|'feira',string>;
 estreia?:{estadio:string;adversario:string};carreata?:boolean;
 evento?:{nome:string;variante?:string;status:string;subNome?:string}|null;
 obras?:{obra:string}[];ultimo?:{gf:number;ga:number;rival?:boolean}|null;
 desfecho?:{tipo:string;para:string}|null;feira?:boolean;
}):CentralSede[]{
 const out:Cena[]=[],t=d.t,base={rotulo:t('Enquanto isso no bairro','Meanwhile in the neighbourhood')}
 const add=(prioridade:number,id:string,scene:Omit<CentralSede,'chave'|'rotulo'>)=>out.push({...base,...scene,chave:`${d.chave}:${id}`,prioridade})
 if(d.carreata)add(100,'carreata',{vista:'city-street',img:d.imagens.carreata,tom:'bom',chapeu:t('🏆 O bairro é campeão','🏆 A winning neighbourhood'),titulo:t('A taça saiu para as ruas','The trophy takes to the streets'),texto:t('O título já está confirmado. Acompanhe a carreata do clube no mapa.','The title is confirmed. Follow the club parade on the map.')})
 if(d.desfecho&&['acesso','queda'].includes(d.desfecho.tipo)){
  const sobe=d.desfecho.tipo==='acesso'
  add(95,`desfecho:${d.temporada}`,{vista:'entrance',img:d.imagens.estadio,tom:sobe?'bom':'ruim',chapeu:t('🏟️ Fim de temporada','🏟️ Season finale'),titulo:sobe?t(`Acesso confirmado à ${d.desfecho.para}`,`Promotion to ${d.desfecho.para}`):t(`O próximo capítulo é na ${d.desfecho.para}`,`The next chapter is in ${d.desfecho.para}`),texto:t('A campanha terminou. Este é o novo destino do clube para a próxima temporada.','The campaign is over. This is the club’s destination for next season.')})
 }
 if(d.estreia)add(90,'estreia-casa',{vista:'matchday',img:d.imagens.estadio,tom:'bom',chapeu:t('🎟️ Estreia em casa','🎟️ First home game'),titulo:t(`A torcida chega ao ${d.estreia.estadio}`,`Fans arrive at ${d.estreia.estadio}`),texto:`${d.clube} × ${d.estreia.adversario}. ${t('Acompanhe a chegada no estádio.','Watch the arrival at the stadium.')}`})
 if(d.evento){const e=d.evento,praia=e.variante==='futevolei';add(80,`evento:${e.nome}:${d.rodada}`,{vista:praia?'clube-lazer':'balada',img:praia?d.imagens.clube:d.imagens.noite,tom:'ruim',hora:praia?t('10H DA MANHÃ','10 AM'):t('2H DA MANHÃ','2 AM'),chapeu:praia?t('🏐 Fora do treino','🏐 Away from training'):t('🍾 Fora da concentração','🍾 Away from the team hotel'),titulo:praia?t(`${e.nome} foi jogar futevôlei`,`${e.nome} went to play footvolley`):t(`${e.nome} foi para a balada`,`${e.nome} went clubbing`),texto:e.status==='campo'?t('Você decidiu mantê-lo em campo.','You chose to keep him in the team.'):t(`Ele ficou no banco${e.subNome?` — ${e.subNome} entra no lugar`:''}.`,`He was benched${e.subNome?` — ${e.subNome} takes his place`:''}.`)})}
 const nomes:Record<string,[string,string,string]>={loja:['A loja oficial','The club shop','loja'],estac:['O estacionamento','The car park','estacionamento'],praca:['A praça','The plaza','praca'],chopp:['A choperia','The beer bar','chopp'],estacao:['A estação','The station','estacao'],hotel:['O hotel','The hotel','hotel']}
 for(const o of d.obras??[]){const n=nomes[o.obra]??['A estrutura','The facility','region'];add(60,`obra:${o.obra}`,{vista:n[2],img:d.imagens.obra,chapeu:t('🏗️ Evolução do clube','🏗️ Club development'),titulo:t(`${n[0]} está em obras`,`${n[1]} is under construction`),texto:t('A obra que você comprou já tem canteiro no mapa.','The facility you purchased now has a construction site on the map.')})}
 if(d.ultimo){const u=d.ultimo,venceu=u.gf>u.ga,perdeu=u.gf<u.ga,goleada=u.gf-u.ga>=3;
  const titulos=venceu?[['O boteco virou arquibancada','The pub becomes a stand'],['A vitória ficou na conversa','The win is the talk of the town'],['Hoje a resenha é boa','Good football talk tonight']]:perdeu?[['O boteco ficou na bronca','A tough night at the pub'],['A resenha pede reação','Fans want a response'],['Dia de juntar os cacos','Time to regroup']]:[['Empate na roda de conversa','A draw to talk about']]
  const titulo=t(...titulos[d.rodada%titulos.length] as [string,string])
  add(u.rival?55:goleada?50:10,'pos-jogo',{vista:'boteco-oswaldo',img:venceu?d.imagens.festa:d.imagens.triste,tom:venceu?'bom':perdeu?'ruim':undefined,chapeu:u.rival?t('⚔️ Depois do clássico','⚔️ After the derby'):t('🍻 Resenha da rodada','🍻 After the match'),titulo:u.rival&&venceu?t('O clássico é nosso','The derby is ours'):goleada?t('Goleada para guardar na memória','A big win to remember'):titulo,texto:t(`Depois do ${u.gf} a ${u.ga}, o resultado virou assunto no Boteco do Oswaldo.`,`After the ${u.gf}-${u.ga}, the result is the talk of Oswaldo’s bar.`)})
 }
 if(d.feira)add(1,'feira',{vista:'feira',img:d.imagens.feira,chapeu:t('🧺 Feira do bairro','🧺 Street market'),titulo:t('Sábado no bairro','Saturday in the neighbourhood'),texto:t('A feira já está montada na rua.','The street market is open.')})
 return out.sort((a,b)=>b.prioridade-a.prioridade)
}

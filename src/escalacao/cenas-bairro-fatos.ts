import type {EscState,Manager} from './types'
import type {AtorCena,AcaoBairro} from './cenas-bairro-model'
export type FatoBairro={id:string;acao:AcaoBairro;vista:string;prioridade:number;ator?:AtorCena;chapeu:[string,string];titulo:[string,string];texto:[string,string]}
/** Adapts saved/revealed facts. No simulations, extra draws, reconstructed honours or career writes. */
export function fatosDoBairro(s:EscState,m:Manager,revealedGame=false):FatoBairro[]{
 const season=s.seasonNo??1,round=s.round??0,out:FatoBairro[]=[],actor=(id:string)=>{const c=m.squad.find(c=>c.id===id);return c?{id:c.id,nome:c.name,club:c.club,year:c.year}:undefined}
 const ev=s.eventoTemporada
 if(ev?.season===season&&ev.mgrId===m.id&&ev.tipo==='lesao'&&ev.status==='banco'){
  const retorno=round===(ev.volta??-1),recuperando=round<(ev.volta??-1)
  if(retorno||recuperando)out.push({id:`medico:${season}:${ev.round}:${ev.cardId}:${retorno?'retorno':'recuperacao'}`,acao:retorno?'retorno':'recuperacao',vista:'campinho',prioridade:retorno?81:76,ator:actor(ev.cardId),chapeu:retorno?['⚽ De volta aos treinos','⚽ Back in training']:['🩹 Recuperação','🩹 Recovery'],titulo:retorno?[`${ev.nome} voltou a ficar disponível`,`${ev.nome} is available again`]:[`${ev.nome} cuida da recuperação`,`${ev.nome} works on recovery`],texto:retorno?['O retorno é gradual. Confira a condição antes de escalar.','The return is gradual. Check his condition before picking the lineup.']:['Ele continua fora pelo prazo informado no Elenco. A cena não reduz o tempo de recuperação.','He remains unavailable for the period shown in Squad. This scene does not shorten recovery.']})
 }
 for(const d of [...(s.careerTransferHistory??[])].reverse()){
  if(d.season!==season||d.round!==round||d.team!==m.teamName||d.paid<25)continue
  const c=m.squad.find(c=>c.name===d.name&&c.club===d.club&&c.year===d.year);if(!c)continue
  out.push({id:`chegada:${season}:${round}:${d.name}:${d.club}:${d.year}`,acao:'contratacao',vista:'entrance',prioridade:79,ator:actor(c.id),chapeu:['📸 Reforço apresentado','📸 New signing presented'],titulo:[`${d.name} veste a camisa`,`${d.name} wears the shirt`],texto:[`Contratação registrada: ${d.paid} moedas${d.from?`, vindo de ${d.from}`:''}.`,`Recorded signing: ${d.paid} coins${d.from?`, from ${d.from}`:''}.`]});break
 }
 const coach=s.careerTecnicos?.[m.teamName],since=s.careerTecnicosDesde?.[m.teamName]
 if(coach&&since?.t===season&&since.r===round&&(season>1||round>0))out.push({id:`tecnico:${season}:${round}:${coach}`,acao:'tecnico',vista:'campinho',prioridade:74,ator:{nome:coach},chapeu:['🧢 Nova comissão','🧢 New coaching staff'],titulo:[`${coach} comanda o treino`,`${coach} leads training`],texto:['O técnico contratado começa o trabalho com o elenco. As formações disponíveis continuam as da categoria dele.','Your appointed coach begins work with the squad. Available formations still follow his category.']})
 const press=s.careerColetiva?.[m.id]?.feitas.at(-1)
 if(press?.t===season&&press.r===round&&press.estilo!=='pulou'&&press.frase)out.push({id:`coletiva:${season}:${round}:${press.sit}`,acao:'coletiva',vista:'entrance',prioridade:62,chapeu:['🎙️ Saiu na coletiva','🎙️ From the press conference'],titulo:['A palavra do presidente','The president speaks'],texto:press.frase})
 const master=s.careerMaster?.[m.id]
 if(master?.renovado&&master.desde===season&&round===0)out.push({id:`master:${season}:${master.brandId}`,acao:'patrocinio',vista:'entrance',prioridade:73,chapeu:['🤝 Acordo renovado','🤝 Deal renewed'],titulo:['A parceria continua','The partnership continues'],texto:['A renovação do patrocinador Master está registrada no contrato do clube.','The Master sponsorship renewal is recorded in the club’s contract.']})
 if(revealedGame){
  const memory=s.careerMemory?.[m.id],last=memory?.recent.at(-1)
  if(last?.season===season)for(const [id,p] of Object.entries(memory?.players??{})){
   const c=m.squad.find(c=>c.id===id);if(!c)continue
   // Only games counted since this feature began. Never claims a historic club total.
   if(p.games>0&&[10,25,50,100].includes(p.games)&&last.id===memory?.seen.at(-1))out.push({id:`marca:${id}:jogos:${p.games}`,acao:'marca',vista:'entrance',prioridade:72,ator:actor(id),chapeu:['📚 Memória da carreira','📚 Career memory'],titulo:[`${p.name}: ${p.games} jogos registrados`,`${p.name}: ${p.games} recorded games`],texto:['Marca contada desde o início deste registro no clube.','Milestone counted from the start of this club record.']})
   if([10,25,50,100].includes(p.goals))out.push({id:`marca:${id}:gols:${p.goals}`,acao:'marca',vista:'entrance',prioridade:73,ator:actor(id),chapeu:['⚽ Memória da carreira','⚽ Career memory'],titulo:[`${p.name}: ${p.goals} gols registrados`,`${p.name}: ${p.goals} recorded goals`],texto:['Gols contados desde o início deste registro no clube.','Goals counted from the start of this club record.']})
   if(c.cria&&p.games===1)out.push({id:`base-estreia:${id}`,acao:'base',vista:'campinho',prioridade:77,ator:actor(id),chapeu:['🌱 Base em campo','🌱 Academy player on the pitch'],titulo:[`${p.name} ganha espaço no time`,`${p.name} gets a chance in the team`],texto:['Primeira participação contabilizada neste registro da carreira.','First appearance counted in this career record.']})
  }
 }
 return out
}

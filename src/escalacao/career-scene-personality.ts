/** Presentation variants only. Reuses the event already drawn by the game; never draws another event. */
export function personalitySceneText(event:{nome:string;club?:string;year?:number;variante?:string;status:string;subNome?:string},season:number,round:number):[string,string]{
 const key=`${event.nome}|${event.club??''}|${event.year??''}|${season}|${round}`
 let hash=0;for(const ch of key)hash=(Math.imul(hash,31)+ch.charCodeAt(0))>>>0
 const beach=event.variante==='futevolei'
 const lines:[string,string][]=beach?[
  ['A rede está montada, a areia marcada e a dupla não quer sair da quadra.','The net is up, the sand is marked and the pair do not want to leave the court.'],
  ['A bola trocou o gramado pela areia. O pessoal do clube de lazer ganhou assunto para a manhã.','The ball has traded grass for sand. The leisure club has its morning talking point.'],
  ['A turma se juntou ao redor da quadra para acompanhar a partida de futevôlei.','The crowd gathered around the court to follow the footvolley match.'],
  ['Na quadra do clube, a habilidade com a bola virou atração para quem estava passando.','At the club court, the ball skills caught the attention of passers-by.'],
 ]:[
  ['Na cena da noite, a pista está cheia e o horário da concentração ficou para depois.','In tonight’s scene, the dance floor is full and the team hotel can wait.'],
  ['O encontro na balada virou assunto no vestiário. A decisão sobre a escalação continua sendo sua.','The night out became a dressing-room talking point. The lineup decision is still yours.'],
  ['Luzes acesas, música e a turma reunida: foi assim que o episódio desta rodada apareceu no bairro.','Lights, music and the group together: this is how this round’s episode unfolded in the neighbourhood.'],
  ['A cena mudou do campo para a noite. O episódio já registrado dá mais um capítulo à história do clube.','The scene moved from the pitch to the nightlife. The recorded episode adds another chapter to the club story.'],
 ]
 const [pt,en]=lines[hash%lines.length]
 const decision=event.status==='campo'?['Você decidiu mantê-lo em campo.','You chose to keep him in the team.']:['Ele ficou no banco'+(event.subNome?` — ${event.subNome} entra no lugar`:'' )+'.','He was benched'+(event.subNome?` — ${event.subNome} takes his place`:'' )+'.']
 return [`${pt} ${decision[0]}`,`${en} ${decision[1]}`]
}

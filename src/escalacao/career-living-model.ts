import type {EscState} from './types'
import type {ClubMemory} from './career-memory'
import type {CareerDeal} from './career-transfer-history'
export type LivingText=[string,string]
export type FirstStep={key:string;title:LivingText;text:LivingText;target:'elenco'|'guia'}
/** One contextual tip per early round; dismissing it never changes a match or an unlock. */
export function careerFirstStep(s:EscState):FirstStep|null{
 if(!s.careerOnline||s.onlineMode==='online'||s.co2||s.sport==='basquete'||s.seasonNo!==1||s.round>3||s.careerSeen?.['inicio-dispensado-v1'])return null
 const steps:FirstStep[]=[
  {key:'inicio-elenco-v1',target:'elenco',title:['Antes da estreia, conheça seu elenco','Before kickoff, get to know your squad'],text:s.oficial?['Seu clube já começa com jogadores. Confira os titulares, reservas e a formação antes de escolher como assistir.','Your club starts with players. Check starters, substitutes and formation before choosing how to watch.']:['Seu time veio do leilão. Confira quem entrou, as posições e a formação; uma cartinha de campeão fica na coleção, não no time.','Your team came from the auction. Check signings, positions and formation; a champion reward card joins your collection, not your squad.']},
  {key:'inicio-salvar-v1',target:'guia',title:['Seu progresso também faz parte da carreira','Your progress is part of your career too'],text:['Use Salvar para guardar sem sair. Antes de trocar de aparelho, confira a confirmação da nuvem; a recuperação automática no aparelho não envia sozinha para outro dispositivo.','Use Save to save without leaving. Before switching devices, check the cloud confirmation; automatic device recovery does not upload progress to another device.']},
  {key:'inicio-tatica-v1',target:'elenco',title:['Formação, tática e substituição são decisões diferentes','Formation, tactics and substitutions are different decisions'],text:['Tática muda o plano; velocidade muda só a transmissão. Quando as substituições estiverem liberadas e houver reservas, Substituir abre o elenco e as táticas, com limite de três trocas.','Tactics change your plan; speed only changes playback. When substitutions are unlocked and substitutes are available, Substitute opens the squad and tactics, with up to three changes.']},
  {key:'inicio-mercado-v1',target:'guia',title:['Contratar é uma parte do custo','Signing is only part of the cost'],text:['O lance paga a compra. Confira também contrato, salário e renovação nas fichas e em Finanças. No Mercado você prepara sondagens e vendas para a janela, sem precisar refazer todo o time.','Your bid pays for the signing. Also check contracts, wages and renewals in profiles and Finances. In Market, prepare scouting and sales for the window without rebuilding the whole team.']},
 ]
 const step=steps[Math.max(0,s.round)]
 return s.careerSeen?.[step.key]?null:step
}
export type RivalStory={opponent:string;games:number;wins:number;draws:number;losses:number;last:{season:number;gf:number;ga:number};biggest?:{gf:number;ga:number};former:string[]}
/** Bounded history already revealed. Missing old records never become invented defeats or honours. */
export function careerRivalStory(memory:ClubMemory|undefined,opponent:string,club:string,deals:CareerDeal[]=[]):RivalStory|null{
 const games=(memory?.recent??[]).filter(g=>g.opponent===opponent)
 if(!games.length)return null
 const last=games.at(-1)!,victories=games.filter(g=>g.gf>g.ga).sort((a,b)=>(b.gf-b.ga)-(a.gf-a.ga))
 return{opponent,games:games.length,wins:games.filter(g=>g.gf>g.ga).length,draws:games.filter(g=>g.gf===g.ga).length,losses:games.filter(g=>g.gf<g.ga).length,last:{season:last.season,gf:last.gf,ga:last.ga},biggest:victories[0]&&victories[0].gf-victories[0].ga>=3?{gf:victories[0].gf,ga:victories[0].ga}:undefined,former:[...new Set(deals.filter(d=>d.team===club&&d.from===opponent).map(d=>d.name))].slice(-2)}
}
export type CareerMoment={id:string;title:LivingText;detail:LivingText}
export function careerMoments(s:EscState,mgrId:number,seasonFinished=false):CareerMoment[]{
 if(!s.careerOnline||s.onlineMode==='online'||s.co2||s.sport==='basquete')return[]
 const m=s.managers.find(m=>m.id===mgrId);if(!m)return[]
 const out:CareerMoment[]=[],memory=s.careerMemory?.[mgrId],last=memory?.recent?.at(-1)
 if(last)out.push({id:`jogo:${last.id}`,title:[last.gf>last.ga?'Vitória para guardar':last.gf===last.ga?'Um capítulo da carreira':'A história continua',last.gf>last.ga?'A win to remember':last.gf===last.ga?'A chapter in your career':'The story continues'],detail:[`${m.teamName} ${last.gf} × ${last.ga} ${last.opponent} · T${last.season} · ${last.competition}`,`${m.teamName} ${last.gf} × ${last.ga} ${last.opponent} · S${last.season} · ${last.competition}`]})
 const deal=[...(s.careerTransferHistory??[])].reverse().find(d=>d.team===m.teamName&&d.season===s.seasonNo&&d.paid>0&&m.squad.some(c=>c.name===d.name&&c.club===d.club&&c.year===d.year))
 if(deal)out.push({id:`contratacao:${deal.season}:${deal.name}:${deal.club}:${deal.year}`,title:[`${deal.name} chegou!`,`${deal.name} has arrived!`],detail:[`${deal.club??''} ${deal.year??''} · ${deal.paid} moedas · T${deal.season}`,`${deal.club??''} ${deal.year??''} · ${deal.paid} coins · S${deal.season}`]})
 const chronicle=[...(s.careerCronica?.[`m${mgrId}`]??[])].reverse().find(c=>(c.t<(s.seasonNo??1)||seasonFinished&&c.t===s.seasonNo)&&(c.campeao||c.copa||c.sup))
 if(chronicle)out.push({id:`titulo:${chronicle.t}:${chronicle.div}`,title:[chronicle.campeao?`Campeão · ${chronicle.div==='V'?'Várzea':`Série ${chronicle.div}`}`:chronicle.copa?'Campeão da copa':'Campeão da Supercopa',chronicle.campeao?`Champions · ${chronicle.div==='V'?'Várzea':`Série ${chronicle.div}`}`:chronicle.copa?'Cup champions':'Super Cup champions'],detail:[`${m.teamName} · Temporada ${chronicle.t}`,`${m.teamName} · Season ${chronicle.t}`]})
 if(memory?.biggest&&memory.biggest.gf-memory.biggest.ga>=3){const g=memory.biggest;out.push({id:`goleada:${g.id}`,title:['Uma goleada na memória','A big win to remember'],detail:[`${m.teamName} ${g.gf} × ${g.ga} ${g.opponent} · T${g.season}`,`${m.teamName} ${g.gf} × ${g.ga} ${g.opponent} · S${g.season}`]})}
 return out.slice(0,4)
}

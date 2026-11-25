import {OwnerOnlineHeader} from '../owner-online-visual'
import {useState} from 'react'
import {Btn} from '../screens'
import {QuickMatchLayout} from '../shared-game-ui'
import {OnlineCreateSection} from '../online-create-layout'
import {useT} from '../lang'
import type {AuctionMode} from './auction'
export const AUCTION_MODES:[AuctionMode,string,string,string,string][]=[
 ['sealed','✉️ Envelope cego','✉️ Sealed bid','Lances em segredo por etapa. Empate tem novo lance.','Secret bids per stage. Ties go to a rebid.'],
 ['single','⚡ Envelope único','⚡ Single envelope','Pilotos e carros juntos. Empate vai para sorteio.','Drivers and cars together. Ties go to a draw.'],
 ['open','🔨 Pregão aberto','🔨 Open auction','Uma carta por vez. Cada lance reinicia o martelo de 5 segundos.','One card at a time. Each bid resets the 5-second hammer.'],
 ['dutch','🐊 Tocaia','🐊 Ambush','O preço cai para todos. Quem pegar primeiro leva.','The price drops for everyone. First to take wins.'],
]
export function Formula1Setup({onBack,onStart}:{onBack:()=>void;onStart:(name:string,options:{mode:AuctionMode;rivals:number;seconds:number})=>void}){
 const t=useT(),[name,setName]=useState('Minha escuderia'),[mode,setMode]=useState<AuctionMode>('sealed'),[rivals,setRivals]=useState(3),[seconds,setSeconds]=useState(45)
 const chosen=AUCTION_MODES.find(m=>m[0]===mode)!,label=t(chosen[1],chosen[2]),team=`${name.trim()} · ${rivals} ${t('rivais','rivals')}`,race=t('GP do Brasil · Interlagos · 24 voltas','Brazilian GP · Interlagos · 24 laps')
 return <QuickMatchLayout header={<OwnerOnlineHeader name={name} brand={{name:'PISTA LEGENDS',monogram:'PL',tagline:t('SUA ESCUDERIA COMEÇA NO LANCE.','YOUR TEAM STARTS WITH A BID.')}} online={false} onHome={onBack}/>} onBack={onBack} description={t('Leilão, escuderia e a briga pelo pódio. Sem marcar horário.','Auction, team and the race for the podium. No schedule needed.')} modeDescription={t('Um GP contra a máquina. Começa agora.','One GP against the CPU. Starts now.')} rows={[[t('Modo','Mode'),t('⚡ Partida rápida · Fórmula 1','⚡ Quick match · Formula 1')],[t('Leilão','Auction'),label],[t('Escuderia','Team'),team],[t('Campeonato','Championship'),race]]} summaries={{[t('O leilão','The auction')]:label,[t('A escuderia','The team')]:team,[t('A corrida','The race')]:race}} name={name.trim()||t('Sua escuderia','Your team')} button={<Btn bg="#1B7A3D" className="w-full text-lg" disabled={!name.trim()} onClick={()=>onStart(name,{mode,rivals,seconds})}><span className="text-white">{t('AVANÇAR 🔨','CONTINUE 🔨')}</span></Btn>}>
  <OnlineCreateSection num={1} title={t('O leilão','The auction')} icon="🔨" sub={t('Como pilotos e carros serão comprados','How drivers and cars get bought')}>
   <p className="text-sm font-bold">{t('100 moedas iguais para todas as escuderias. Notas e categorias só aparecem depois da compra.','100 equal coins for every team. Ratings and tiers appear only after purchase.')}</p>
   <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">{AUCTION_MODES.map(([key,pt,en,desc,descEn])=><Btn key={key} bg={mode===key?'#FFC400':'#fff'} className="text-left" onClick={()=>setMode(key)}><span className="block">{t(pt,en)}{mode===key?' ✓':''}</span><small className="block font-normal text-xs mt-1">{t(desc,descEn)}</small></Btn>)}</div>
   {(mode==='sealed'||mode==='single')&&<label className="block text-sm font-bold">{t('Tempo para lacrar o envelope','Time to seal your envelope')}<select className="block mt-1 border-2 border-black rounded-lg bg-white p-2 w-full" value={seconds} onChange={e=>setSeconds(Number(e.target.value))}>{[30,45,60].map(n=><option key={n} value={n}>{n}s</option>)}</select></label>}
  </OnlineCreateSection>
  <OnlineCreateSection num={2} title={t('A escuderia','The team')} icon="🏎️">
   <label className="block text-sm font-bold">{t('Nome da sua escuderia','Your team name')}<input className="block mt-1 border-2 border-black rounded-xl bg-white p-3 w-full" maxLength={24} value={name} onChange={e=>setName(e.target.value)}/></label>
   <p className="text-sm">{t('Dois pilotos e um modelo de carro histórico para a dupla. Baralho com 48 pilotos e 20 carros, identificados pelo modelo e ano.','Two drivers and one historic car model for both. A deck of 48 drivers and 20 cars, identified by model and year.')}</p>
   <label className="block text-sm font-bold">{t('Quantas escuderias rivais?','How many rival teams?')}<select className="block mt-1 border-2 border-black rounded-lg bg-white p-2 w-full" value={rivals} onChange={e=>setRivals(Number(e.target.value))}>{[3,5,7,9].map(n=><option key={n} value={n}>{n} {t('rivais','rivals')} · {(n+1)*2} {t('carros na pista','cars on track')}</option>)}</select></label>
  </OnlineCreateSection>
  <OnlineCreateSection num={3} title={t('A corrida','The race')} icon="🏁"><p className="font-bold">{race}</p><p className="text-sm">{t('Cerca de 4 minutos a 1×. Depois do leilão você escolhe o clima, os pneus e o ritmo de cada piloto. Paradas e estratégia também podem mudar durante a corrida.','About 4 minutes at 1×. After the auction choose weather, tyres and pace for each driver. Pit stops and strategy can also change during the race.')}</p></OnlineCreateSection>
 </QuickMatchLayout>
}

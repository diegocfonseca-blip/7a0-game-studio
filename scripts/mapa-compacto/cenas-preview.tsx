// Local visual review: native card, one guarded map and existing civilian art.
import React,{useEffect,useState} from 'react'
import {createRoot} from 'react-dom/client'
import Complexo from '../../src/escalacao/presidencia-complexo-3d'
import {CartaoSede} from '../../src/escalacao/central'
import {MapaGuardado,VagaDoMapa} from '../../src/escalacao/mapa-guardado'
import {pedidoCena,type AcaoBairro} from '../../src/escalacao/cenas-bairro-model'
import {pedeVistaDoMapa} from '../../src/escalacao/controle-partida-mapa'
import {STADIUM_SECTORS,STADIUM_EXTRAS,type StadiumSave} from '../../src/escalacao/estadiodata'
import '../../src/index.css'
const W=window as any,full:StadiumSave={inv:Object.fromEntries(STADIUM_SECTORS.map(s=>[s.k,s.cost])),ext:[...STADIUM_EXTRAS.map(e=>e.k),'asfalto']}
const options={
 loja:{view:'loja',title:'As camisas ganharam as ruas',text:'A loja vendeu 1.600 camisas na T2, contra 1.100 no balanço anterior.',label:'👕 Loja do clube'},
 classico:{view:'boteco-oswaldo',title:'O clássico é nosso',text:'A vitória por 2 a 1 no rival virou comemoração no bairro.',label:'⚔️ Depois do clássico'},
 torcida:{view:'matchday',title:'A torcida chega ao estádio',text:'Brasiliense × Ferroviário-CE. Acompanhe a chegada no estádio.',label:'🎟️ Estreia em casa'},
 lazer:{view:'clube-lazer',title:'Romário foi jogar futevôlei',text:'Cena de exemplo do acontecimento salvo: o jogador trocou o treino pela quadra do clube.',label:'🏐 Fora do treino'},
 recuperacao:{view:'campinho',title:'Recuperação no clube',text:'A cena acompanha o prazo da lesão. Não antecipa a volta nem dá bônus.',label:'🩹 Recuperação'},
 retorno:{view:'campinho',title:'De volta aos treinos',text:'Retorno gradual, conforme a condição registrada no elenco.',label:'⚽ Retorno'},
 contratacao:{view:'entrance',title:'O reforço veste a camisa',text:'Apresentação de uma contratação já confirmada na carreira.',label:'📸 Reforço apresentado'},
 tecnico:{view:'campinho',title:'O novo técnico comanda o treino',text:'O treinador contratado reúne o elenco no campo de treinamento.',label:'🧢 Nova comissão'},
 coletiva:{view:'entrance',title:'A palavra do presidente',text:'Repercussão da resposta escolhida na coletiva da carreira.',label:'🎙️ Coletiva'},
 noitada:{view:'balada',title:'Fora da concentração',text:'Uma decisão da carreira que já aconteceu aparece também na cidade.',label:'🍾 Fora da concentração'},
} as const
function App(){
 const[kind,K]=useState<keyof typeof options>('loja'),[place,P]=useState<'central'|'mapa'|'skip'>('central'),[epoch,E]=useState(0)
 const o=options[kind],key=`preview:${kind}:${epoch}`;W.previewKey=key
 const go=(k:keyof typeof options)=>{K(k);E(n=>n+1);P('central')};W.previewKind=go
 useEffect(()=>{if(place!=='skip')pedeVistaDoMapa(pedidoCena(o.view,key,kind as AcaoBairro,false,false,['lazer','noitada','retorno','recuperacao','contratacao'].includes(kind)?{nome:'Romário',club:'Vasco',year:2000}:undefined));else pedeVistaDoMapa('original')},[key,place])
 const map=<Complexo stadium={full} cityStadium={full} clubName="Brasiliense" museumStage={4} circulation day={{division:'C',support:80,pos:1}} journey={{key:'preview',variantSeed:42,fixtureId:'preview',ordinal:2,weekday:'domingo',kickoffTime:'16:00',period:'day',calendarKnown:true,hosting:true,phase:'arrival'}} arrivalTeams={{fixtureId:'preview',teams:[{name:'Brasiliense',color:'#e2ba00',players:[]},{name:'Ferroviário-CE',color:'#c2452f',players:[]}]}} onReady={api=>{W.compactApi=api;pedeVistaDoMapa(pedidoCena(o.view,key,kind as AcaoBairro,false,false,['lazer','noitada','retorno','recuperacao','contratacao'].includes(kind)?{nome:'Romário',club:'Vasco',year:2000}:undefined))}}/>
 return <MapaGuardado mapa={map}><main style={{maxWidth:780,margin:'auto',padding:'14px 12px',color:'#f4ecd6'}}>
  <header style={{fontFamily:'Oswald,sans-serif',fontWeight:700,borderBottom:'1px solid #444',paddingBottom:14}}>▣ LEILÃO LEGENDS <small style={{float:'right',color:'#ffc400'}}>PRÉVIA LOCAL</small></header>
  <div style={{fontSize:10,color:'#dfcb8a',marginTop:20}}>BRASILIENSE · TEMPORADA 2 · SÉRIE C</div>
  <h1 style={{fontFamily:'Oswald,sans-serif',fontSize:27,margin:'8px 0 22px'}}>CENTRAL DA CARREIRA</h1>
  {place==='central'?<CartaoSede s={{ator:['lazer','noitada','retorno','recuperacao','contratacao'].includes(kind)?{nome:'Romário',club:'Vasco',year:2000}:undefined,img:'',chave:key,acao:kind,rotulo:'Enquanto isso no bairro',chapeu:o.label,titulo:o.title,texto:o.text,vista:o.view,tom:'bom'}} cls="" janela={<VagaDoMapa/>} onMapa={()=>P('mapa')} aoPular={()=>P('skip')}/>:place==='mapa'?<><button onClick={()=>P('central')}>← Voltar à Central</button><VagaDoMapa/></>:<section style={{background:'#f4ecd6',color:'#0c0c0c',borderRadius:16,padding:24}}>⚽ Próximo jogo · Brasiliense × Ferroviário-CE<br/>Sem vídeo em uma rodada comum.</section>}
  <nav aria-label="Cenas da bancada" style={{display:'flex',gap:8,flexWrap:'wrap',marginTop:26}}>{Object.keys(options).map(k=><button key={k} onClick={()=>go(k as keyof typeof options)}>{k}</button>)}</nav>
  <p style={{fontSize:11,color:'#bbb'}}>Bancada visual com situações de exemplo. Não altera contas, calendário ou dinheiro.</p>
 </main></MapaGuardado>
}
createRoot(document.getElementById('root')!).render(<App/>);

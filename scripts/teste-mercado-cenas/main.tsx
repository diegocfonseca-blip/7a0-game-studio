import '../../src/escalacao/screens'
import React,{useState} from 'react'
import {createRoot} from 'react-dom/client'
import Complexo from '../../src/escalacao/presidencia-complexo-3d'
import {MapaGuardado,VagaDoMapa} from '../../src/escalacao/mapa-guardado'
import {CartaoSede} from '../../src/escalacao/central'
import {cenasDoBairro} from '../../src/escalacao/cenas-bairro-central'
import {pedeVistaDoMapa} from '../../src/escalacao/controle-partida-mapa'
import {STADIUM_SECTORS,STADIUM_EXTRAS} from '../../src/escalacao/estadiodata'
import '../../src/index.css'
const W=window as any
const params=new URLSearchParams(location.search),kind=params.get('scene')??'boteco',festival=kind==='carreata'
const full={inv:Object.fromEntries(STADIUM_SECTORS.map(s=>[s.k,s.cost])),ext:[...STADIUM_EXTRAS.map(e=>e.k),'asfalto']}
const img=new URL('../../src/escalacao/img/online-estadio-v25.webp',import.meta.url).href
const scene=cenasDoBairro({chave:'bancada-local',clube:'Brasiliense',temporada:2,rodada:8,t:p=>p,imagens:{estadio:img,clube:img,noite:img,carreata:img,obra:img,festa:img,triste:img,feira:img},carreata:festival,evento:kind==='balada'?{nome:'Jogador da bancada',status:'banco'}:undefined,ultimo:{gf:1,ga:2}})[0]
function App(){const[mapa,Map]=useState(false);return <main style={{maxWidth:860,margin:'auto',padding:16,fontFamily:'system-ui',color:'#f4ecd6'}}><small style={{fontFamily:'Oswald',letterSpacing:2}}>PRÉVIA LOCAL · ARTE E CENA REAIS DO JOGO</small><h2 style={{fontFamily:'Oswald',margin:'10px 0 16px'}}>CENTRAL DA CARREIRA</h2><MapaGuardado mapa={<Complexo stadium={full} clubName="Brasiliense" qaPopulation circulation cidadeViva={{canteiros:[],humor:'triste',carreata:festival,cor:'#e6b21c',dia:Date.UTC(2027,1,7),hora:14}} journey={{ordinal:2,key:'bancada-cena',phase:'idle',hosting:false,period:'day'} as any} onReady={api=>{W.qaCena=api;if(api)pedeVistaDoMapa(`cena:${scene.vista}`)}}/>}>{mapa?<section><button onClick={()=>Map(false)}>← Voltar à Central</button><VagaDoMapa/></section>:<CartaoSede s={scene} cls="" janela={<VagaDoMapa/>} seguir={()=>{W.qaSeguiu=true}} onMapa={()=>{Map(true);pedeVistaDoMapa(`cena:${scene.vista}`)}}/>}</MapaGuardado></main>}
createRoot(document.getElementById('root')!).render(<App/>);

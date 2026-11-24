import '../../src/escalacao/screens'
import React from 'react'
import {createRoot} from 'react-dom/client'
import {EscProvider,useEsc} from '../../src/escalacao/store'
import {_forcaBrasilOficialParaTeste} from '../../src/escalacao/sport'
import {carregaBaralhoOficial} from '../../src/escalacao/baralho-oficial-carga'
import {ligaEscudosOficiais} from '../../src/escalacao/escudo-oficial-chave'
import {MercadoAba} from '../../src/escalacao/pyramidseason'
import '../../src/index.css'
import '../../src/App.css'
_forcaBrasilOficialParaTeste(true);await carregaBaralhoOficial()
function Tela(){const{state}=useEsc(),m=state.managers[state.youIdx];ligaEscudosOficiais(!!state.oficial);return <main style={{maxWidth:1100,margin:'auto',padding:16}}><small style={{color:'#d3c9ae',fontFamily:'Oswald',letterSpacing:2}}>PRÉVIA LOCAL · {m.teamName} · TEMPORADA {state.seasonNo}</small><h2 style={{fontFamily:'Oswald',fontSize:28,color:'#f4ecd6',margin:'10px 0 18px'}}>MERCADO</h2><MercadoAba mgr={m} ordem={state.managers.map(x=>x.teamName)}/></main>}
createRoot(document.getElementById('root')!).render(<EscProvider><Tela/></EscProvider>);

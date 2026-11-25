import {createRoot} from 'react-dom/client'
import {useState} from 'react'
import {EscCtxBancada,INITIAL} from '../../src/escalacao/store'
import '../../src/escalacao/screens'
import {Formula1Tab,useFormula1Selected} from '../../src/escalacao/formula1-entry'
import {useOwnerPresentation} from '../../src/escalacao/online-preview'
import Formula1Game from '../../src/escalacao/formula1/game'
import '../../src/index.css'
function App(){
 const [state]=useState(()=>structuredClone(INITIAL)),selected=useFormula1Selected(),allowed=useOwnerPresentation()
 const noop=()=>{},ctx:any={state,dispatch:noop,emotes:[],emote:noop,addEmote:noop,chat:[],chatUnread:0,sendChat:noop,chatOpen:false,setChatOpen:noop,hostStale:false,kickPlayer:noop,leaveRoom:noop}
 return <EscCtxBancada.Provider value={ctx}><Formula1Tab/>{allowed&&selected?<Formula1Game/>:<p data-testid="football-fallback">Futebol disponível</p>}</EscCtxBancada.Provider>
}
createRoot(document.getElementById('root')!).render(<App/>);

import {createRoot} from 'react-dom/client'
import {EscCtxBancada,INITIAL} from '../../src/escalacao/store'
import '../../src/escalacao/screens'
import {LojaButton} from '../../src/escalacao/loja-clube'
import '../../src/index.css'
const noop=()=>{},ctx:any={state:structuredClone(INITIAL),dispatch:noop,emotes:[],emote:noop,addEmote:noop,chat:[],chatUnread:0,sendChat:noop,chatOpen:false,setChatOpen:noop,hostStale:false,kickPlayer:noop,leaveRoom:noop}
createRoot(document.getElementById('root')!).render(<EscCtxBancada.Provider value={ctx}><LojaButton>Abrir planos</LojaButton></EscCtxBancada.Provider>)

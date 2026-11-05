// Componentes reais com dados locais de demonstração. Sem abrir ou alterar um save.
import '../../src/index.css'
import '../../src/escalacao/screens'
import {createRoot} from 'react-dom/client'
import {createPortal} from 'react-dom'
import {useState} from 'react'
import {CareerLeagueGames} from '../../src/escalacao/career-match-visual'
import {EventoBanner, EventoSemReservaBanner, type SimMatch} from '../../src/escalacao/pyramidseason'
import type {EventoAtivo, WonCard} from '../../src/escalacao/types'
const query=new URLSearchParams(location.search)
document.documentElement.classList.toggle('noturno',query.has('noite'))
const names=[['Barcenite FC','Murriz FC'],['Várzea Legends','Juventude do Churrasco'],['Papão United Madrid','Ferroviária da Serra'],['Real Domingueira','Unidos da Resenha']]
const matches=names.map(([h,a],i)=>({hId:i*2,aId:i*2+1,h,a,hg:2,ag:0,you:false,hum:false,goals:[{home:true,name:'Ángel Romero',min:5},{home:true,name:'Lucho González',min:10}]})) as SimMatch[]
const tipo=(query.get('tipo')??'lesao') as EventoAtivo['tipo']
const ev={season:1,round:5,mgrId:0,tipo,cardId:'qa-wellington',nome:'Wellington Paulista',pos:'ATA',rodadas:1,status:'pendente',historia:'O Wellington Paulista travou as costas amarrando a chuteira. A idade chega pra todos — até pras lendas. 🩹',criaOptions:['Pezão','Zé Pequeno da Base','Cotoco']} as EventoAtivo
const reservas=[{id:'qa-r1',name:'Romário',pos:'ATA'},{id:'qa-r2',name:'Hernán Barcos',pos:'ATA'}] as WonCard[]
function Bancada(){
 const [modal,setModal]=useState(query.has('modal')),[decisao,setDecisao]=useState('')
 const concluir=(value:string)=>{setDecisao(value);setModal(false)}
 const wide=query.has('largo')
 return <main className="ll29-career ll25-career ll25-tab-jogos" style={{minHeight:'100vh',padding:16}}>
  <p style={{maxWidth:1380,margin:'0 auto 14px',color:'#f4ecd6'}}>Teste local · componentes reais · dados de demonstração</p>
  <div className={wide?'':'ll-cx ll-cx-t-jogos max-w-xl mx-auto'} style={wide?{maxWidth:1040,margin:'auto'}:undefined}>
   {!wide&&<div className="ll-cx-lado" style={{minHeight:180,padding:24,color:'#f4ecd6',background:'#14291c',borderRadius:12}}>
    <p>Espaço da partida preservado</p><button onClick={()=>setModal(true)} style={{marginTop:16,padding:10,color:'#0c0c0c',background:'#ffc400',borderRadius:10}}>Abrir aviso de lesão</button>
    <output data-testid="decisao" style={{display:'block',marginTop:12}}>{decisao}</output>
   </div>}
   <div className={wide?'':'ll-cx-aba'}><section className="ll29-board"><CareerLeagueGames matches={matches} minute={11} title="Várzea · OUTROS JOGOS" limite={3}/></section></div>
  </div>
  {modal&&createPortal(<div data-testid="aviso" style={{position:'fixed',inset:0,zIndex:99990,background:'rgba(12,12,12,.84)',overflowY:'auto',padding:'22px 14px 40px',display:'flex'}}>
   <div style={{maxWidth:460,width:'100%',margin:'auto'}}>
    <span style={{display:'inline-block',marginBottom:9,fontFamily:'Oswald',fontWeight:900,fontSize:11.5,background:'#ffc400',color:'#0c0c0c',border:'2px solid #0c0c0c',borderRadius:999,padding:'3px 11px'}}>📰 NOTÍCIA DO VESTIÁRIO</span>
    <div data-testid="banner">{query.has('reserva')?<EventoBanner ev={ev} reservas={reservas} onDecide={(choice,id)=>concluir(choice+':'+(id??''))}/>:<EventoSemReservaBanner ev={ev} onEscolher={concluir} onCampo={()=>concluir('campo')}/>}</div>
   </div>
  </div>,document.body)}
 </main>
}
const container=document.getElementById('root') as HTMLElement&{__raiz?:ReturnType<typeof createRoot>}
;(container.__raiz??=createRoot(container)).render(<Bancada/>)

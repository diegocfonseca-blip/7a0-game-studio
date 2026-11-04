// Local layout fixture: real standings component, synthetic standings, no match or save writes.
import '../../src/index.css'
import '../../src/escalacao/screens'
import {createRoot} from 'react-dom/client'
import {PyramidTables} from '../../src/escalacao/pyramidseason'
const names=['Papão United Madrid','White Things','SC Ferrari','Seven City','Atlético Pelada','Várzea Legends','Bonança SSFC','Descampado EC','Real Madruga','Chelsão da Massa','Marreco FC','Tókai19','Barcenite FC','Ferroviária da Serra','Juventude do Churrasco','Muriz FC','Nightfull FC','Sapekinhas','Leão da Estradinha','Neymarzetti']
const tables=Object.fromEntries(['D','A','B','C'].map((div,d)=>[div,names.map((name,i)=>({teamId:d*20+i,name:d?`${name} ${div}`:name,you:!d&&i===19,human:!d&&i===19,pts:38-i,w:12-i%12,d:2,l:i,gf:31-i,ga:i+4,squad:[]}))]))
const mode=new URLSearchParams(location.search).get('mode')??'sidebar'
createRoot(document.getElementById('root')!).render(<main className="ll29-career ll25-career ll25-tab-jogos" style={{minHeight:'100vh',padding:16}}>
 <p style={{color:'#f4ecd6',margin:'0 auto 12px',maxWidth:1380}}>Teste local de classificação · componente real · dados de demonstração</p>
 <div className={mode==='sidebar'?'ll-cx ll-cx-t-jogos max-w-xl mx-auto':''} style={mode==='wide'?{maxWidth:1040,margin:'auto'}:undefined}>
  {mode==='sidebar'&&<div className="ll-cx-lado" style={{minHeight:160,background:'#14291c',padding:24,color:'#f4ecd6',borderRadius:12}}>Espaço da partida preservado</div>}
  <div className={mode==='sidebar'?'ll-cx-aba':''}><section className="ll29-board" aria-label="Competições da carreira">
   <PyramidTables tables={tables as any} order={['D','A','B','C']} colors={{19:{solid:'#7c3aed',light:'#eee4fc'}}} myDiv="D"/>
  </section></div>
 </div>
</main>)

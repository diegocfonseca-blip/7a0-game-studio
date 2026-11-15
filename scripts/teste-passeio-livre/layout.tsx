import React,{useState} from 'react'
import {createRoot} from 'react-dom/client'
import {FanZoneHud} from '../../src/escalacao/presidencia-fanzone-hud'
import '../../src/index.css'
function App(){const[fase,F]=useState('andando'),[destino,D]=useState('portao');(window as any).qaFase=F
 const fan:any={input:{x:0,y:0,correr:false},snapshot:()=>({destino}),rumo:()=>({metros:50,angulo:0}),destinos:()=>[{id:'portao',nome:['Portão da torcida','Gate']},{id:'casa',nome:['Minha casa','Home']}],escolherDestino:D,proximo:()=>null,girar:()=>{},centralizar:()=>{},irProPortao:()=>F('portao'),entrar:()=>{F('escolhendo');return true},escolher:()=>{},sentar:()=>{F('sentado');return true},levantar:()=>F('andando')}
 return <div style={{position:'relative',width:'100vw',height:'100svh',background:'#859267'}}><button style={{position:'absolute',zIndex:40,top:10,left:10,height:44,background:'#ffc400',border:'3px solid #000',borderRadius:10}}>✕ Sair do passeio</button><FanZoneHud fase={fase as any} fan={fan} cadeiras={[]} escolhida=""/></div>}
createRoot(document.getElementById('root')!).render(<App/>);

import {useEffect,useRef} from 'react'
import {legendAvatar} from './legend-avatars'
import type {AtorCena} from './cenas-bairro-model'
import {DURACAO_CHEGADA_CENTRAL,publicarCenaCentral,quadroCentral,useCenaCentral} from './cena-central-playback'
import {pintorChegada} from './cena-contratacao-pintor'
import cenario from './img/central-chegada-cenario.webp'
import sprites from './img/central-chegada-sprites.webp'
import diretoria from './img/career-president-terno.webp'

// Images are requested only after this lazy component becomes visible. A retry
// discards a failed promise; a missing portrait keeps a neutral shirt, never another player.
const imagens=new Map<string,Promise<HTMLImageElement>>()
function imagem(url:string){
 const old=imagens.get(url);if(old)return old
 const p=new Promise<HTMLImageElement>((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=()=>{imagens.delete(url);reject(new Error('Arte indisponível'))};i.src=url})
 imagens.set(url,p);while(imagens.size>16)imagens.delete(imagens.keys().next().value!)
 return p
}
export default function CenaContratacaoCentral({chave,ator}:{chave:string;ator:AtorCena}){
 const canvas=useRef<HTMLCanvasElement>(null),frame=useCenaCentral(chave)
 const nome=ator.nome,club=ator.club,year=ator.year
 useEffect(()=>{
  const el=canvas.current;if(!el)return
  let closed=false,failed=false,raf=0,lastPaint=0,elapsed=quadroCentral(chave).seconds*1000,started=0
  let draw:ReturnType<typeof pintorChegada>|undefined,resize:ResizeObserver|undefined
  const revision=frame.revision,reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const src=legendAvatar(nome,club,year)?.src
  const report=(phase:Parameters<typeof publicarCenaCentral>[1])=>publicarCenaCentral(chave,phase,elapsed/1000,revision)
  const render=()=>{if(failed)return false;try{draw?.(elapsed);return true}catch{failed=true;report('unavailable');return false}}
  const tick=(now:number)=>{
   if(closed||document.hidden)return
   elapsed=Math.min(DURACAO_CHEGADA_CENTRAL*1000,now-started)
   if(now-lastPaint>=1000/24){lastPaint=now;if(!render())return;report(elapsed>=DURACAO_CHEGADA_CENTRAL*1000?'ended':'playing')}
   if(elapsed<DURACAO_CHEGADA_CENTRAL*1000)raf=requestAnimationFrame(tick)
   else{render();report('ended')}
  }
  const resume=()=>{
   if(closed||failed||!draw||document.hidden)return
   if(elapsed>=DURACAO_CHEGADA_CENTRAL*1000){render();report('ended');return}
   if(reduced&&revision===0){elapsed=0;render();report('paused');return}
   started=performance.now()-elapsed;raf=requestAnimationFrame(tick)
  }
  const visibility=()=>{cancelAnimationFrame(raf);if(document.hidden){if(draw&&!failed&&elapsed<DURACAO_CHEGADA_CENTRAL*1000)report('paused')}else resume()}
  document.addEventListener('visibilitychange',visibility)
  const timeout=window.setTimeout(()=>{if(!draw&&!closed)report('unavailable')},14000)
  Promise.all([imagem(cenario),imagem(sprites),imagem(diretoria),src?imagem(src).catch(()=>undefined):undefined]).then(([background,atlas,staff,portrait])=>{
   if(closed)return
   clearTimeout(timeout)
   draw=pintorChegada(el,{background,atlas,staff,portrait},{nome,club,year})
   const size=()=>{const w=Math.max(320,Math.min(960,Math.round(el.getBoundingClientRect().width*Math.min(1.5,window.devicePixelRatio||1))))
    el.width=w;el.height=Math.round(w*9/16);render()}
   resize=new ResizeObserver(size);resize.observe(el);size();resume()
  }).catch(()=>{if(!closed){clearTimeout(timeout);report('unavailable')}})
  return()=>{closed=true;cancelAnimationFrame(raf);clearTimeout(timeout);resize?.disconnect();document.removeEventListener('visibilitychange',visibility)
   if(draw&&elapsed<DURACAO_CHEGADA_CENTRAL*1000&&quadroCentral(chave).phase!=='unavailable')report('paused')}
 },[chave,nome,club,year,frame.revision])
 return <canvas ref={canvas} width={960} height={540} data-central-signing-canvas role="img" aria-label={nome} style={{display:'block',width:'100%',height:'100%'}}/>
}

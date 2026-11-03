/** Only the fixed spectator view owns these inputs. OrbitControls remains the
 * map controller; its enabled state is restored on leaving the fixed view. */
export function criarZoomCameraFixa(element:HTMLElement,active:()=>boolean,zoom:(factor:number)=>void){
 const touches=new Map<number,{x:number;y:number}>()
 const span=()=>{const points=[...touches.values()];return points.length===2?Math.hypot(points[0].x-points[1].x,points[0].y-points[1].y):0}
 const wheel=(event:WheelEvent)=>{
  if(!active())return
  event.preventDefault();event.stopImmediatePropagation()
  const unit=event.deltaMode===1?16:event.deltaMode===2?element.clientHeight:1
  zoom(Math.exp(Math.max(-100,Math.min(100,event.deltaY*unit))*.002))
 }
 const down=(event:PointerEvent)=>{
  if(!active())return
  element.focus({preventScroll:true})
  if(event.pointerType!=='touch')return
  event.preventDefault()
  touches.set(event.pointerId,{x:event.clientX,y:event.clientY})
  element.setPointerCapture(event.pointerId)
 }
 const move=(event:PointerEvent)=>{
  if(!active()){touches.clear();return}
  if(!touches.has(event.pointerId))return
  const previous=span();touches.set(event.pointerId,{x:event.clientX,y:event.clientY});const current=span()
  if(previous>5&&current>5)zoom(previous/current)
 }
 const up=(event:PointerEvent)=>{touches.delete(event.pointerId)}
 const key=(event:KeyboardEvent)=>{
  if(!active()||event.target!==element||event.altKey||event.ctrlKey||event.metaKey)return
  if(!['+','=','-','ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key))return
  event.preventDefault();event.stopImmediatePropagation()
  if(event.key==='+'||event.key==='=')zoom(.8)
  else if(event.key==='-')zoom(1.25)
 }
 element.addEventListener('wheel',wheel,{capture:true,passive:false})
 element.addEventListener('pointerdown',down,true);element.addEventListener('pointermove',move,true)
 element.addEventListener('pointerup',up,true);element.addEventListener('pointercancel',up,true);element.addEventListener('lostpointercapture',up,true)
 element.addEventListener('keydown',key,true)
 return{dispose(){
  element.removeEventListener('wheel',wheel,true)
  element.removeEventListener('pointerdown',down,true);element.removeEventListener('pointermove',move,true)
  element.removeEventListener('pointerup',up,true);element.removeEventListener('pointercancel',up,true);element.removeEventListener('lostpointercapture',up,true)
  element.removeEventListener('keydown',key,true);touches.clear()
 }}
}

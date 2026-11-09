import {useCallback,useEffect,useId,useLayoutEffect,useRef,useState,type ReactNode,type CSSProperties} from 'react'
import {createPortal} from 'react-dom'
import {ChatCracha,ChatCita,ChatRespondendo,citacao,reValido,type ChatRe} from './chat-sala'
import {ComPerfil,EVENTO_PERFIL_ABERTO} from './amigos'
import {PresidenteDaConta} from './presidente-avatar'
import {getLang,tr} from './lang'
import {registerPrivateChat,updatePrivateChat} from './private-chat-navigation'
import './private-room-chat.css'

export type PrivateChatMessage={id:string;uid?:string;from?:number;name:string;text:string;ts?:number;re?:ChatRe;fig?:number;esp?:boolean}
type Props={
 roomId:string;roomName:string;people:number;open:boolean;setOpen:(value:boolean)=>void;unread:number
 messages:PrivateChatMessage[];isMine:(message:PrivateChatMessage)=>boolean
 onSend:(text:string,re?:ChatRe)=>void;game?:boolean;readOnly?:boolean;off?:boolean
 onToggleChat?:()=>void;renderAttachment?:(message:PrivateChatMessage)=>ReactNode
 stickers?:{label:string;art:ReactNode;send:()=>void}[]
}
const nearEnd=(el:HTMLElement)=>el.scrollHeight-el.clientHeight-el.scrollTop<36
function senderKey(m:PrivateChatMessage){return`${m.uid??m.from??m.name}|${m.name}|${!!m.esp}`}
function dateOf(m:PrivateChatMessage){if(typeof m.ts!=='number'||!Number.isFinite(m.ts))return null;const date=new Date(m.ts);return Number.isFinite(date.getTime())?date:null}
function dayKey(m:PrivateChatMessage){return dateOf(m)?.toDateString()??''}
function groupsOf(messages:PrivateChatMessage[]){
 const groups:PrivateChatMessage[][]=[]
 for(const message of messages){const group=groups.at(-1),previous=group?.at(-1)
  if(previous&&senderKey(previous)===senderKey(message)&&dayKey(previous)===dayKey(message)&&(!message.ts||!previous.ts||message.ts-previous.ts<300000))group!.push(message)
  else groups.push([message])
 }
 return groups
}

/** Shared private skin. Transport, seat identity, host authority and sticker cooldown stay in callers. */
export function PrivateRoomChat(props:Props){
 const{roomId,roomName,people,open,setOpen,unread,messages,isMine,onSend,game=false,readOnly=false,off=false,onToggleChat,renderAttachment,stickers}=props
 const latest=useRef(props);latest.current=props
 const list=useRef<HTMLDivElement>(null),panel=useRef<HTMLElement>(null),input=useRef<HTMLTextAreaElement>(null),close=useRef<HTMLButtonElement>(null)
 const atEnd=useRef(true),seen=useRef(new Set(messages.map(m=>m.id))),opened=useRef(false)
 const baseline=useRef(0),lastWidth=useRef(0),raf=useRef(0),titleId=useId()
 const[text,setText]=useState(''),[reply,setReply]=useState<ChatRe|null>(null)
 const[pending,setPending]=useState(0),[menu,setMenu]=useState(false),[tray,setTray]=useState(false)
 const[mobile,setMobile]=useState(()=>typeof window!=='undefined'&&window.innerWidth<=760)
 const[navVisible,setNavVisible]=useState(false),[viewport,setViewport]=useState({bottom:0,height:900,keyboard:false})
 const scrollLatest=useCallback(()=>{
  atEnd.current=true;setPending(0)
  cancelAnimationFrame(raf.current)
  raf.current=requestAnimationFrame(()=>{if(list.current)list.current.scrollTop=list.current.scrollHeight})
 },[])
 useEffect(()=>()=>cancelAnimationFrame(raf.current),[])
 useEffect(()=>{if(!game)return;return registerPrivateChat(roomId,()=>latest.current.setOpen(true))},[game,roomId])
 useEffect(()=>{if(game)updatePrivateChat(roomId,open,off?0:Math.min(99,unread+pending))},[game,roomId,open,unread,pending,off])
 useEffect(()=>{
  const update=()=>{
   const compact=window.innerWidth<=760;setMobile(compact)
   const bars=[...document.querySelectorAll<HTMLElement>('[data-private-chat-nav]')]
   setNavVisible(window.innerWidth<1100&&bars.some(el=>{
    if(el.dataset.privateChatNav!==roomId)return false
    const button=el.querySelector<HTMLElement>('.pc-nav-entry'),rect=button?.getBoundingClientRect()
    if(!rect?.width||!rect.height)return false
    const hit=document.elementFromPoint(rect.x+rect.width/2,rect.y+rect.height/2)
    return !!hit&&el.contains(hit)
   }))
  }
  update();const observer=new MutationObserver(update)
  observer.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['data-private-chat-nav','hidden']})
  window.addEventListener('resize',update)
  return()=>{observer.disconnect();window.removeEventListener('resize',update)}
 },[roomId])
 useLayoutEffect(()=>{
  if(open&&!off&&!opened.current){seen.current=new Set(messages.map(m=>m.id));scrollLatest();close.current?.focus({preventScroll:true})}
  if(!open){setMenu(false);setTray(false)}
  opened.current=open&&!off
 },[open,off,scrollLatest,messages])
 useLayoutEffect(()=>{
  const added=messages.filter(m=>!seen.current.has(m.id));seen.current=new Set(messages.map(m=>m.id))
  if(!open||off||!added.length)return
  if(atEnd.current||added.some(isMine))scrollLatest()
  else setPending(n=>Math.min(99,n+added.filter(m=>!isMine(m)).length))
 },[messages,open,off,isMine,scrollLatest])
 useEffect(()=>{
  const vv=window.visualViewport
  const measure=()=>{
   const h=window.innerHeight,w=window.innerWidth,available=vv?.height??h
   if(!baseline.current||Math.abs(w-lastWidth.current)>80){baseline.current=h;lastWidth.current=w}
   const inset=Math.max(0,h-available-(vv?.offsetTop??0))
   const focused=!!panel.current?.contains(document.activeElement)&&document.activeElement instanceof HTMLTextAreaElement
   const keyboard=w<=760&&(inset>120||(focused&&baseline.current-available>120))
   if(!focused&&!keyboard)baseline.current=Math.max(h,available)
   setViewport(old=>old.bottom===inset&&old.height===Math.round(available)&&old.keyboard===keyboard?old:{bottom:inset,height:Math.round(available),keyboard})
  }
  measure();vv?.addEventListener('resize',measure);vv?.addEventListener('scroll',measure)
  window.addEventListener('resize',measure);window.addEventListener('focusin',measure);window.addEventListener('focusout',measure)
  return()=>{vv?.removeEventListener('resize',measure);vv?.removeEventListener('scroll',measure);window.removeEventListener('resize',measure);window.removeEventListener('focusin',measure);window.removeEventListener('focusout',measure)}
 },[open])
 useLayoutEffect(()=>{if(open&&atEnd.current)scrollLatest()},[viewport.height,viewport.keyboard,open,scrollLatest])
 useEffect(()=>{
  if(!open||!list.current||typeof ResizeObserver==='undefined')return
  const observer=new ResizeObserver(()=>{if(atEnd.current)scrollLatest()});observer.observe(list.current)
  return()=>observer.disconnect()
 },[open,off,scrollLatest])
 useEffect(()=>{
  const profile=()=>setOpen(false)
  const escape=(e:KeyboardEvent)=>{if(e.key!=='Escape'||e.defaultPrevented||!open||!panel.current?.contains(document.activeElement))return;e.preventDefault();if(menu)setMenu(false);else setOpen(false)}
  window.addEventListener(EVENTO_PERFIL_ABERTO,profile);window.addEventListener('keydown',escape)
  return()=>{window.removeEventListener(EVENTO_PERFIL_ABERTO,profile);window.removeEventListener('keydown',escape)}
 },[setOpen,open,menu])
 const send=()=>{const value=text.trim().slice(0,160);if(!value||readOnly||off)return;onSend(value,reply??undefined);setText('');setReply(null);scrollLatest()}
 const counts=Math.min(99,unread+pending)
 const grouped=groupsOf(messages)
 return <>
  {!open&&!navVisible&&<button type="button" className="pc-launcher" data-mobile={mobile||undefined} aria-label={tr('Abrir chat da sala','Open room chat')} onClick={()=>setOpen(true)}>{off?'🔕':'💬'}{counts>0&&!off&&<span>{counts}</span>}</button>}
  {open&&createPortal(<div className="pc-layer" style={{'--pc-inset':`${viewport.bottom}px`,'--pc-available':`${viewport.height}px`} as CSSProperties}>
   <section ref={panel} className="pc-chat" role="region" aria-labelledby={titleId} data-mobile={mobile||undefined} data-keyboard={viewport.keyboard||undefined} data-reply={!!reply||undefined} data-tray={tray||undefined}>
    <div className="pc-grip" aria-hidden="true"/>
    <header className="pc-head"><div className="pc-title"><h2 id={titleId}>{tr('CHAT DA SALA','ROOM CHAT')}</h2><p>{roomName}{people>0?` · ${people} ${tr('técnicos','managers')}`:''}</p></div>
     {onToggleChat&&<button type="button" className="pc-head-button" aria-label={tr('Opções do chat','Chat options')} aria-expanded={menu} onClick={()=>setMenu(v=>!v)}>⋯</button>}
     <button ref={close} type="button" className="pc-head-button pc-close" aria-label={tr('Fechar chat','Close chat')} onClick={()=>setOpen(false)}>×</button>
    </header>
    {menu&&onToggleChat&&<div className="pc-menu"><button type="button" onClick={()=>{onToggleChat();setMenu(false)}}>{off?tr('🔔 Ligar chat da sala','🔔 Enable room chat'):tr('🔕 Desligar chat da sala','🔕 Disable room chat')}</button></div>}
    {off?<p className="pc-off">{tr('O chat está desligado para esta sala. Use as opções acima para ligar.','Chat is off for this room. Use the options above to enable it.')}</p>:<>
     <section className="pc-conversation"><div ref={list} className="pc-messages" onScroll={()=>{if(list.current){atEnd.current=nearEnd(list.current);if(atEnd.current)setPending(0)}}}>
      {grouped.length===0&&<p className="pc-empty">{tr('Manda a primeira zoeira 😎','Send the first jab 😎')}</p>}
      {grouped.map((group,index)=>{const first=group[0],last=group.at(-1)!,mine=isMine(first),day=dayKey(first),previousDay=index?dayKey(grouped[index-1][0]):'',stamp=dateOf(last)
       return <div key={first.id} className="pc-message-block">
        {day&&day!==previousDay&&<p className="pc-day">{day===new Date().toDateString()?tr('HOJE','TODAY'):new Date(first.ts!).toLocaleDateString(getLang()==='en'?'en-GB':'pt-BR')}</p>}
        <div className="pc-group" data-mine={mine||undefined}>
         <div className="pc-character"><ComPerfil uid={mine?null:first.uid}><PresidenteDaConta uid={first.uid} size={40} reserva={null}/></ComPerfil></div>
         <div className="pc-group-body"><div className="pc-name"><ComPerfil uid={mine?null:first.uid}><ChatCracha name={first.name} uid={first.uid} esp={first.esp}/></ComPerfil>{mine&&<small>{tr('você','you')}</small>}</div>
          {group.map(message=>{const quote=reValido(message.re),attachment=renderAttachment?.(message)
           return attachment?<div className="pc-attachment" key={message.id}>{attachment}</div>:<div key={message.id} className="pc-bubble" onClick={!mine&&!readOnly?()=>setReply(citacao(message.name,message.text)):undefined}>
            {quote&&<ChatCita re={quote}/>}<span className="pc-text">{message.text}</span>
           </div>
          })}
          {stamp&&<time className="pc-time" dateTime={stamp.toISOString()}>{stamp.toLocaleTimeString(getLang()==='en'?'en-GB':'pt-BR',{hour:'2-digit',minute:'2-digit'})}</time>}
         </div>
        </div>
       </div>
      })}
     </div>{pending>0&&<div className="pc-new"><button type="button" onClick={scrollLatest}><span>{pending} {pending===1?tr('nova mensagem','new message'):tr('novas mensagens','new messages')} ↓</span></button></div>}</section>
     {readOnly?<p className="pc-readonly">{tr('👁️ Você está assistindo: só lê o chat.','👁️ You are watching: read-only chat.')}</p>:<>
      {reply&&<div className="pc-reply"><ChatRespondendo re={reply} onCancel={()=>setReply(null)}/></div>}
      {!!stickers?.length&&tray&&<div className="pc-stickers">{stickers.map((sticker,i)=><button type="button" key={i} aria-label={sticker.label} onClick={()=>{if(!readOnly&&!off){sticker.send();setTray(false)}}}>{sticker.art}</button>)}</div>}
      <form className="pc-compose" onSubmit={e=>{e.preventDefault();send()}}>
       {!!stickers?.length&&<button type="button" className="pc-sticker-button" aria-label={tr('Figurinhas do mascote','Mascot stickers')} aria-expanded={tray} onClick={()=>{input.current?.blur();setTray(v=>!v)}}>🐊</button>}
       <textarea ref={input} aria-label={tr('Mensagem','Message')} placeholder={tr('Mensagem…','Message…')} rows={1} maxLength={160} value={text} onChange={e=>setText(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.nativeEvent.isComposing){e.preventDefault();send()}}}/>
       <button className="pc-send" type="submit" disabled={!text.trim()}>{tr('Enviar','Send')}</button>
      </form>
     </>}
    </>}
   </section>
  </div>,document.body)}
 </>
}

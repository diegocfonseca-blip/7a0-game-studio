// uso: node render2.mjs <pagina.html> <saida.mp4> [t1 t2 … só prints]
import {createRequire} from 'node:module'
import {mkdirSync,writeFileSync,rmSync} from 'node:fs'
import {execSync} from 'node:child_process'
const {chromium}=createRequire('/home/user/7a0-game-studio/package.json')('playwright')
const D=new URL('./', import.meta.url).pathname
const [pag,saida,...rest]=process.argv.slice(2); const only=rest.map(Number)
const b=await chromium.launch()
const p=await b.newPage({viewport:{width:1280,height:800}})
await p.goto('file://'+D+pag);await p.waitForTimeout(2000)
const total=await p.evaluate(()=>window.TOTAL), FPS=30
if(only.length){for(const t of only){await p.evaluate(t=>window.render(t),t);await p.screenshot({path:`${D}t${t}.png`})};await b.close();process.exit(0)}
rmSync(D+'frames',{recursive:true,force:true});mkdirSync(D+'frames',{recursive:true})
for(let i=0;i<Math.round(total*FPS);i++){await p.evaluate(t=>window.render(t),i/FPS);await p.screenshot({path:`${D}frames/f${String(i).padStart(4,'0')}.jpg`,type:'jpeg',quality:92})}
// 🔊 os MESMOS sons do jogo (src/escalacao/sound.ts), tocados numa gravação offline
const wav=await p.evaluate(async(total)=>{
  const SR=44100, c=new OfflineAudioContext(1,Math.ceil(SR*total),SR), m=c.createGain(); m.gain.value=0.32*2.2; m.connect(c.destination)
  const tone=(T,freq,dur,type,gain,delay=0,glide)=>{const t=T+delay,o=c.createOscillator(),g=c.createGain();o.type=type;o.frequency.setValueAtTime(freq,t);if(glide)o.frequency.exponentialRampToValueAtTime(Math.max(1,glide),t+dur);g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(gain,t+0.008);g.gain.exponentialRampToValueAtTime(0.0001,t+dur);o.connect(g);g.connect(m);o.start(t);o.stop(t+dur+0.02)}
  const noise=(T,dur,gain,filter,q=1,delay=0)=>{const t=T+delay,n=Math.floor(SR*dur),buf=c.createBuffer(1,n,SR),d=buf.getChannelData(0);for(let i=0;i<n;i++)d[i]=Math.random()*2-1;const s=c.createBufferSource();s.buffer=buf;const bp=c.createBiquadFilter();bp.type='bandpass';bp.frequency.value=filter;bp.Q.value=q;const g=c.createGain();g.gain.setValueAtTime(gain,t);g.gain.exponentialRampToValueAtTime(0.0001,t+dur);s.connect(bp);bp.connect(g);g.connect(m);s.start(t);s.stop(t+dur+0.02)}
  const SONS={
    tick:T=>tone(T,1000,0.04,'square',0.28),
    hammer:T=>{noise(T,0.09,0.6,320,0.6);tone(T,120,0.18,'sine',0.6,0,60);tone(T,90,0.22,'sine',0.4,0.02,45)},
    chime:T=>{[660,880,1100,1320].forEach((f,i)=>tone(T,f,0.5,'sine',0.32,i*0.08));tone(T,1980,0.6,'sine',0.14,0.28)},
    doulhe:(T,n)=>{const f=n<=1?1320:n===2?1100:920;noise(T,0.05,0.45,1900,4);tone(T,f,0.16,'triangle',0.42);tone(T,f/2,0.12,'sine',0.3,0.01)},
    coberto:T=>{tone(T,620,0.14,'square',0.16);tone(T,440,0.26,'square',0.16,0.13,400)},
    flash:T=>{[0,0.11,0.2].forEach(d=>noise(T,0.03,0.3,6500,2,d))},
  }
  for(const [t,k,a] of window.SONS||[]) SONS[k](t,a)
  const buf=await c.startRendering(), d=buf.getChannelData(0), n=d.length
  const out=new DataView(new ArrayBuffer(44+n*2)); const w=(o,s)=>{for(let i=0;i<s.length;i++)out.setUint8(o+i,s.charCodeAt(i))}
  w(0,'RIFF');out.setUint32(4,36+n*2,true);w(8,'WAVE');w(12,'fmt ');out.setUint32(16,16,true);out.setUint16(20,1,true);out.setUint16(22,1,true);out.setUint32(24,SR,true);out.setUint32(28,SR*2,true);out.setUint16(32,2,true);out.setUint16(34,16,true);w(36,'data');out.setUint32(40,n*2,true)
  for(let i=0;i<n;i++)out.setInt16(44+i*2,Math.max(-1,Math.min(1,d[i]))*32767,true)
  let s='';const u=new Uint8Array(out.buffer);for(let i=0;i<u.length;i+=32768)s+=String.fromCharCode(...u.subarray(i,i+32768));return btoa(s)
},total)
writeFileSync(D+'som.wav',Buffer.from(wav,'base64'))
await b.close()
execSync(`ffmpeg -y -loglevel error -framerate 30 -i ${D}frames/f%04d.jpg -i ${D}som.wav -c:v libx264 -pix_fmt yuv420p -crf 20 -c:a aac -b:a 160k -shortest ${saida}`)
rmSync(D+'frames',{recursive:true,force:true});rmSync(D+'som.wav',{force:true})
console.log('ok',saida)

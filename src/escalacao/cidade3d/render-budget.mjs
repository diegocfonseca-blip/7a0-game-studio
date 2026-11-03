/** Graphics-only feedback: observes presentation timestamps, never advances or
 * throttles a match, city route, input or animation clock. */
export function renderBudget({minPixelRatio=1.25}={}){
 let scale=1,last=null,started=null,elapsed=0,count=0,slow=0,fast=0;
 const clear=()=>{elapsed=count=slow=fast=0};
 function observe(now,baseRatio=1,expectedFPS=60){
  if(!Number.isFinite(now))return null;
  if(last===null||now<=last||now-last>1000){last=now;started=now;clear();return null}
  const dt=now-last;last=now;
  // Loading/compilation and returning from a hidden tab are not steady frames.
  if(now-started<3000)return null;
  const period=1000/Math.max(1,Math.min(120,Number.isFinite(expectedFPS)?expectedFPS:60));
  elapsed+=dt;count++;if(dt>Math.max(40,period*1.35))slow++;if(dt<Math.max(22,period*1.1))fast++;
  const minimum=Math.min(1,Math.max(.5,minPixelRatio)/Math.max(1,baseRatio));
  if(scale<minimum){scale=minimum;clear();return scale}
  // A whole sustained window, not a single hitch. Slow displays running at
  // 30 Hz do not lose resolution just for having a 33.3 ms refresh period.
  if(elapsed>=1800&&count>=12&&slow/count>=.6){const next=Math.max(minimum,Math.round((scale-.15)*100)/100);clear();if(next!==scale){scale=next;return scale}}
  // Recover much more slowly to avoid alternating sharp/soft on every zoom.
  if(elapsed>=10000&&count>=120){const next=fast/count>=.9?Math.min(1,Math.round((scale+.1)*100)/100):scale;clear();if(next!==scale){scale=next;return scale}}
  return null;
 }
 return{observe,scale:()=>scale,reset(now){last=Number.isFinite(now)?now:null;started=last;clear()}};
}

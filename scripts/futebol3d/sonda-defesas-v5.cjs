const fs=require('node:fs'),{loadDependency,browserOptions}=require('../presidencia-runtime.cjs');
const out='test-results/fundamentos-mapa/v5',tag=process.env.PROBE_TAG||'antes';
(async()=>{const b=await loadDependency('playwright').chromium.launch(browserOptions());try{
 for(const [seed,at]of [[2,8.6],[4,29.45],[5,9.45]]){
  const p=await b.newPage();await p.goto('http://127.0.0.1:5301/scripts/futebol3d/audita-mapa.html?seed='+seed);await p.waitForFunction(()=>window.mapAuditError||window.mapAudit?.ready(),{},{timeout:120000});const error=await p.evaluate(()=>window.mapAuditError);if(error)throw Error(error);
  const rows=await p.evaluate(({at})=>{const out=[];for(let i=Math.floor((at-1.5)*60);i<=(at+1)*60;i++){const s=mapAudit.seek(i/60);if(i/60<at-.5)continue;const name=s.official.events.findLast(e=>['encaixa','defesa','rebote','espalma'].includes(e.tipo))?.a??(at<10?'Velloso':'Ever Almeida'),keeper=s.actors.find(a=>a.key.includes(name)),source=s.authority.players.find(a=>a.key===keeper.key);out.push({t:s.time,ball:s.visibleBall,rawBall:s.authority.ball,keeper,source,actions:s.detail.football.actions.filter(a=>a.key===keeper.key),hands:mapAudit.measureHands(keeper.key),holding:s.detail.football.handContact,contacts:s.detail.football.contacts.filter(c=>c.key===keeper.key&&c.nome),events:s.official.events.filter(e=>e.t>at-1.5)});}return out},{at});
  fs.writeFileSync(out+'/defesa-'+seed+'-'+tag+'.json',JSON.stringify(rows));
  for(const t of [at-.3,at,at+.2,at+.6]){const jpg=await p.evaluate(t=>{mapAudit.seek(t-1.6);for(let i=Math.floor((t-1.5)*60);i/60<t;i++)mapAudit.seek(i/60);return mapAudit.capture(t,'analysis')},t);fs.writeFileSync(out+`/defesa-${seed}-${t.toFixed(2)}-${tag}.jpg`,Buffer.from(jpg,'base64'))}
  console.log(seed,rows.filter(r=>Math.abs(r.t-at)<.04).map(r=>({t:r.t,gap:r.hands.gap,ball:r.ball,actions:r.actions.map(a=>a.tiro.nome)})));await p.close();
 }
}finally{await b.close()}})().catch(e=>{console.error(e);process.exitCode=1});

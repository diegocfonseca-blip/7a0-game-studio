const assert=require('node:assert/strict');
const {chromium}=require('./presidencia-runtime.cjs').loadDependency('playwright');
(async()=>{const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader']});try{
 const page=await browser.newPage({viewport:{width:900,height:1500},locale:'pt-BR'}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',r=>r.request().url().startsWith('http://127.0.0.1:4196/')?r.continue():r.abort());
 await page.route('**/src/escalacao/presidente-acesso.ts*',r=>r.fulfill({contentType:'text/javascript',body:'export const usePresidentPreview=()=>window.allowPresident!==false;export const presidentPreviewEnabled=()=>window.allowPresident!==false;export const presidentWritesEnabled=()=>false;export const presidentPreviewEmail=()=>true;export const PRESIDENT_INTEGRATION_RELEASED=true;'}));
 await page.goto('http://127.0.0.1:4196/7a0-game-studio/qa-presidencia-mapa.html');
 await page.waitForFunction(()=>!!window.renderInternationalFixture);
 const cases=await page.evaluate(async()=>{
  await import('/7a0-game-studio/src/escalacao/screens.tsx');
  const {makeInternationalCampaign}=await import('/7a0-game-studio/src/escalacao/career-international-season.ts');
  const base={season:1,seed:42,representedClub:null,userTeam:'Revisão local',userId:7,priority:null,userXI:[]};
  const sample=makeInternationalCampaign(base),cases=[];
  for(const comp of ['libertadores','champions']){
   const team=sample.teams.find(t=>t.competition===comp);
   const campaign=makeInternationalCampaign({...base,representedClub:team.institution,userXI:team.xi,priority:1});
   for(const home of [true,false]){
    const roundKey=campaign.steps.findIndex(s=>s[comp]?.matches.some(m=>(home?m.home:m.away)===team.id&&m.goals.length));
    const match=campaign.steps[roundKey][comp].matches.find(m=>(home?m.home:m.away)===team.id&&m.goals.length);
    cases.push({campaign,match,comp,roundKey:roundKey*10,speed:4,expectedOwner:home?7:undefined});
   }
  }
  const roundKey=sample.steps.findIndex(s=>s.mundial?.matches.some(m=>m.goals.length));
  cases.push({campaign:sample,match:sample.steps[roundKey].mundial.matches.find(m=>m.goals.length),comp:'mundial',roundKey:roundKey*10,speed:4});
  return cases;
 });
 for(let i=0;i<cases.length;i++){
  const c=cases[i];
  await page.evaluate(c=>window.renderInternationalFixture(c),c);
  if(i===0)await page.locator('.pe-live>summary').click();
  await page.waitForFunction(()=>document.querySelector('.pe-live .pe-football-registered')?.dataset.players==='22');
  await page.waitForFunction(()=>window.internationalDone>0,null,{timeout:60000});
  const frames=await page.evaluate(()=>window.internationalFrames);
  assert.ok(frames.length,'The real international score publishes the field');
  const final=frames.find(s=>s.finished);
  assert.ok(final,'Final whistle publishes only after pending goals');
  assert.equal(final.homeScore,c.match.hg);assert.equal(final.awayScore,c.match.ag);
  assert.equal(final.context.homeClubId,c.expectedOwner);
  const home=c.campaign.teams.find(t=>t.id===c.match.home),away=c.campaign.teams.find(t=>t.id===c.match.away);
  assert.deepEqual(final.context.home.map(p=>p.id),home.xi.map(p=>p.id));
  assert.deepEqual(final.context.away.map(p=>p.id),away.xi.map(p=>p.id));
  for(const goal of c.match.goals)assert.ok(frames.some(s=>s.goal?.phase==='shot'&&s.goal.name===goal.name&&s.goal.home===goal.home&&s.goal.speed===4),'Each authoritative goal has a 4x shot: '+goal.name);
  assert.equal(await page.evaluate(()=>window.internationalDone),1,'One final callback per match');
  console.log('PASS international:',c.comp,c.match.home,'x',c.match.away,c.match.hg+':'+c.match.ag);
 }
 await page.evaluate(c=>{window.allowPresident=false;return window.renderInternationalFixture(c)},cases[0]);
 await page.waitForFunction(()=>!document.querySelector('.pe-live'));
 assert.deepEqual(errors,[]);
 console.log('PASS: generated catalog campaigns, real international score/provider, XI, home/away venues, goals, 4x, final whistle, transitions and private gate. No account or remote writes.');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});

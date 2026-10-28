const fs=require('node:fs'),assert=require('node:assert/strict');
const base='test-results/fundamentos-mapa/',out=process.env.REVIEW_OUT||'/workspace/shared/fundamentos-mapa-v6-20261028/entrega';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const before=read(base+'v5-final-60hz/match.json');
const full=[read(base+'v6-final-60hz/match.json'),read(base+'v6-final-30hz/match.json')];
function measure(run){
 const contacts=new Map();for(const row of run.rows)for(const c of row.football.contacts)if(c.nome)contacts.set(c.key+':'+c.t,c);
 const cc=[...contacts.values()];
 return{hz:run.hz,frames:run.rows.length,players:run.rows[0].actors.length,errors:run.errors,score:run.rows.at(-1).official.score,events:run.rows.at(-1).official.events.length,contacts:cc.length,interpolated:cc.filter(c=>c.interpolated).length,minGap:Math.min(...cc.map(c=>c.gap)),maxGap:Math.max(...cc.map(c=>c.gap)),invalid:cc.filter(c=>!c.confirmed)};
}
for(const run of full)assert.deepEqual(run.rows.at(-1).official,before.rows.at(-1).official,'Official result/events changed');
const matches=full.map(measure);
for(const r of matches){assert.equal(r.players,22);assert.equal(r.contacts,64);assert.equal(r.invalid.length,0);assert.equal(r.interpolated,0);assert.deepEqual(r.errors,[])}
const source=read(base+'v6/catalogo-fonte.json'),oldSource=read(base+'v6/catalogo-antes.json');
assert.equal(source.length,16);
for(let i=0;i<source.length;i++){assert.equal(source[i].seed,oldSource[i].seed);assert.deepEqual(source[i].score,oldSource[i].score);assert.deepEqual(source[i].events,oldSource[i].events)}
const actions=source.flatMap(m=>m.actions),counts=fn=>Object.fromEntries([...new Set(actions.map(fn))].map(k=>[k,actions.filter(a=>fn(a)===k).length]));
const variants=[read(base+'v6/variedade-resumo.json'),read(base+'v6-variantes-30hz/variedade-resumo.json')];
for(const cases of variants){assert.equal(cases.length,6);for(const r of cases){assert(r.eventsUnchanged&&r.contact.confirmed);assert(r.contact.bodyAngleDegrees<45);assert.deepEqual(r.errors,[])}assert.equal(cases[0].clip,'passe');assert.equal(cases[1].clip,'passe_chapa');assert(cases[1].maxHeight<.2);assert(cases[4].events.some(e=>e.tipo==='fora'));assert(cases[5].curveSpin>0)}
const city=read(base+'v6-cidade/cidade.json');assert.deepEqual(city.errors,[]);
const report={
 matches,officialEventsUnchanged:true,
 sourceAudit:{matches:source.length,actions:actions.length,types:counts(a=>a.type),heights:counts(a=>a.delivery.heightBand),explicitTechniques:counts(a=>a.delivery.technique),withCurve:actions.filter(a=>a.delivery.curve==='source').length,allScoresAndEventsUnchanged:true},
 variants60:variants[0],variants30:variants[1],
 city:city.reports.map(r=>({viewport:r.viewport,camera:r.mode,players:r.info.match.players,drawCalls:r.info.drawCalls,memory:r.info.memory})),
 addedTypedArrayBytes:28804,newAssets:0,
 limits:[
  'Ensaios locais com entrada salva e sementes adicionais; nenhum jogo foi gravado na conta.',
  'O replay histórico 1–1 continua bloqueado: o motor atual produz 3–0 nessa entrada. Paridade antes/depois não valida o replay antigo.',
  'Colocada e cobertura conectadas à técnica oficial e testadas no seletor; não ocorreram nas 16 partidas e ainda não têm validação visual.',
  'Cruzamento usa uma captura de chute adaptada, não uma captura específica de cruzamento.',
  'Low Kick To Idle Transition, chamado passe_curto no pacote, foi rejeitado na revisão visual; o passe curto usa Soccer Pass From Idle Pose.',
  'Bicicleta, voleio e outras ações especiais não foram acrescentados nem considerados aprovados.',
  'Contatos dentro da tolerância não comprovam naturalidade de todas as transições. Não houve medição de FPS ou RAM em celular físico.'
 ]
};
fs.writeFileSync(out+'/diagnostico.json',JSON.stringify(report,null,2));
const capture=read(out+'/captura.json'),data=(file,type)=>'data:'+type+';base64,'+fs.readFileSync(out+'/'+file).toString('base64');
const buttons=capture.chapter.map(c=>`<button onclick="jump(${c.second})">${c.label}</button>`).join('');
const html=`<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Leilão Legends · passes e finalizações</title>
<style>*{box-sizing:border-box}body{margin:0;background:#F4ECD6;color:#0C0C0C;font:16px Arial,sans-serif}main{max-width:1080px;margin:auto;padding:18px}h1{font:900 clamp(27px,5vw,42px) Impact,'Arial Narrow',sans-serif;text-transform:uppercase;margin:12px 0}p,li{line-height:1.55}.tag{display:inline-block;background:#FFC400;border:2px solid;border-radius:9px;padding:6px 10px;font-weight:bold}.card{background:#fffaf0;border:3px solid;border-radius:17px;box-shadow:5px 5px #0C0C0C;padding:15px;margin:20px 6px 24px 0}video{display:block;width:100%;height:auto;border-radius:10px;background:#0C0C0C}.buttons{display:flex;gap:10px;flex-wrap:wrap;margin:15px 0}button{font:700 14px Arial;cursor:pointer;background:#FFC400;border:2px solid #0C0C0C;border-radius:10px;padding:11px;box-shadow:2px 2px #0C0C0C}button:focus-visible{outline:3px solid #1B7A3D}.small{font-size:14px}summary{cursor:pointer;font-weight:bold}ul{padding-left:23px}@media(max-width:600px){main{padding:12px}.card{padding:10px}}</style>
<main><span class="tag">22 ATLETAS · CAPTURA REAL · TESTE LOCAL</span><h1>Passes e finalizações</h1><p>Variedade no campo 3D do mapa, usando as animações existentes e os lances decididos pelo motor oficial. Ainda não publicado na sua conta.</p>
<section class="card"><video id="game" controls playsinline preload="metadata" poster="${data('quadros/00008.jpg','image/jpeg')}" src="${data('fundamentos-normal.mp4','video/mp4')}"></video><div class="buttons"><button onclick="rate(1)">Normal</button><button onclick="rate(.5)">½ velocidade</button><button onclick="full()">Tela cheia</button></div><p id="speed" class="small" aria-live="polite">Velocidade: 1×</p><div class="buttons">${buttons}</div><p class="small">Seis recortes de ensaios locais com 22 atletas. As sementes 1 e 2 são testes; nenhum resultado foi enviado à carreira. O campo usa o mesmo módulo do mapa, isolado para conferir os movimentos.</p></section>
<section class="card"><h2>O que mudou</h2><ul><li>Passe curto usa uma captura de passe de futebol. Passe longo rasteiro usa batida de chapa, sem gesto de cavadinha.</li><li>Lançamento alto e cruzamento selecionam gestos conforme a trajetória e a força oficiais.</li><li>Chute alto não vira automaticamente cobertura. Chute forte, rasteiro ou em movimento respeita a situação do jogador.</li><li>A rotação da bola agora recebe o efeito real do lance. A trajetória e o resultado continuam vindo do motor.</li></ul></section>
<section class="card"><h2>Conferência</h2><p>Auditoria de 16 partidas, com ${actions.length} ações: mesmos placares e eventos antes/depois. As seis situações do vídeo foram verificadas a 30 e 60 Hz. A partida completa manteve 22 atletas, ${matches[0].events} eventos e 64 contatos programados dentro da tolerância nos dois testes.</p><p>O lançamento medido sobe até ${variants[0][2].maxHeight.toFixed(2).replace('.',',')} m. O chute baixo fica abaixo de 0,50 m; o chute alto testado passa de 3 m e sai para fora, como decidiu o motor.</p><details><summary>O que ainda falta validar</summary><p>Colocada e cobertura estão conectadas aos dados oficiais, mas não ocorreram nessas 16 partidas. Precisam de conferência visual própria. O cruzamento reutiliza uma captura de chute adaptada. Bicicleta, voleio e outras jogadas especiais não foram acrescentados nesta revisão.</p><p>Os testes de contato não garantem naturalidade de todos os lances. A conferência em tela de 390×844 não mede desempenho de um celular físico; 20 FPS é a taxa de exportação do vídeo.</p><p>Existe uma divergência histórica anterior: resultado salvo 1–1 e motor atual 3–0. A trava continua bloqueando aquele replay. Esta revisão não altera o save nem declara essa reprodução válida.</p></details></section></main>
<script>const v=document.getElementById('game');function rate(r){v.playbackRate=r;document.getElementById('speed').textContent='Velocidade: '+r+'×';v.play().catch(()=>{})}function jump(t){v.currentTime=t;v.play().catch(()=>{})}function full(){if(v.requestFullscreen)v.requestFullscreen().catch(()=>{});else if(v.webkitEnterFullscreen)v.webkitEnterFullscreen()}</script></html>`;
fs.writeFileSync(out+'/revisao.html',html);console.log({reviewBytes:Buffer.byteLength(html),contacts:matches.map(r=>r.contacts),cases:variants.map(r=>r.length),source:report.sourceAudit});

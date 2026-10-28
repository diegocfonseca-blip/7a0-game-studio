// Instrumentação exclusiva da bancada. Permite repetir o mesmo estado inicial
// de um lance antes/depois; não escreve no arquivo original ou na conta.
exports.installReceptionCutover=async function(page,start=0){
 if(!Number.isFinite(start)||start<0)throw Error('Invalid cutover');
 if(page.routeWebSocket)await page.routeWebSocket('**/*',s=>s.close());
 // A partir da integração V8, a bancada opta explicitamente pela versão nova.
 await page.route('**/test-results/animation-library/neymarzetti-current/football-input.json',async route=>{
  const response=await route.fetch(),fixture=await response.json();
  fixture.input.versao='recepcao-contextual-1';
  await route.fulfill({response,json:fixture});
 });
 await page.route('**/src/escalacao/motor2/recepcao-aerea.ts*',async route=>{
  const response=await route.fetch(),source=await response.text();
  const pattern=/(function prefereDominarLancamento\(g, p\)\s*\{)/;
  if(!pattern.test(source))throw Error('Reception module signature changed');
  await route.fulfill({response,body:source.replace(pattern,'$1\n if(g.t<'+start+')return false;')});
 });
};

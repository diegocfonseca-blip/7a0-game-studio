import assert from 'node:assert/strict'
import {createRewardedVideo,googleH5Transport,type VideoPlacement,type VideoOffer,type VideoRequest} from '../src/monetizacao/video-recompensado'
let checks=0
const ok=(value:unknown,message:string)=>{assert.ok(value,message);checks++}
function fixture(approved=true,timeout=1000){
 let placement:VideoPlacement|undefined,offer:VideoOffer|undefined,paused=0,resumed=0,closed=0,shown=0,allowed=true
 const engine=createRewardedVideo({approved,offerTimeoutMs:timeout,transport:p=>{placement=p}})
 const request:VideoRequest={name:'post_match_demo',canWatch:()=>allowed,onOffer:o=>{offer=o},pause:()=>{paused++;return()=>{resumed++}},onOfferClosed:()=>{closed++}}
 return{engine,request,get p(){return placement!},get offer(){return offer!},get stats(){return{paused,resumed,closed,shown}},setAllowed:(value:boolean)=>{allowed=value},prepare:()=>placement!.beforeReward(()=>{shown++;placement!.beforeAd()})}
}
{
 const t=fixture(false),job=t.engine.request(t.request)
 assert.equal(await job.result,'blocked');ok(!t.p,'sem aprovação não consulta anúncios')
}
{
 const t=fixture();t.setAllowed(false);assert.equal(await t.engine.request(t.request).result,'blocked');ok(!t.p,'partida ativa ou pausa insegura bloqueia pedido')
}
{
 const t=fixture(),job=t.engine.request(t.request);t.prepare()
 ok(t.stats.shown===0,'oferta não inicia vídeo automaticamente');ok(t.stats.paused===0,'oferta não pausa jogo antes do aceite')
 assert.equal(await t.engine.request(t.request).result,'busy')
 ok(t.offer.accept(),'aceite explícito inicia vídeo');ok(!t.offer.accept(),'duplo clique não inicia duas vezes')
 ok(t.stats.shown===1&&t.stats.paused===1,'pausa apenas ao iniciar anúncio')
 ok(!job.cancel(),'não cancela e retoma jogo por baixo de anúncio em andamento')
 t.p.adViewed();t.p.adViewed();ok(t.stats.resumed===0,'conclusão não retoma enquanto anúncio está aberto')
 t.p.afterAd();t.p.afterAd();t.p.adBreakDone({breakStatus:'viewed'});t.p.adBreakDone({breakStatus:'viewed'})
 assert.equal(await job.result,'viewed');ok(t.stats.resumed===1&&t.stats.closed===1,'conclusão e limpeza únicas')
 const next=t.engine.request(t.request);ok(next.cancel(),'fim libera próximo pedido');await next.result
}
{
 const t=fixture(),job=t.engine.request(t.request);t.prepare();t.offer.accept();t.p.adDismissed();t.p.adViewed();t.p.afterAd();t.p.adBreakDone({breakStatus:'dismissed'})
 assert.equal(await job.result,'dismissed');ok(t.stats.resumed===1,'pular não concede resultado viewed e restaura pausa')
}
{
 const t=fixture(),job=t.engine.request(t.request);t.p.adBreakDone({breakStatus:'viewed'})
 assert.equal(await job.result,'unavailable');ok(t.stats.paused===0,'texto de status sozinho não comprova vídeo assistido')
}
{
 const t=fixture(),job=t.engine.request(t.request);t.p.adViewed();t.p.adBreakDone({})
 assert.equal(await job.result,'unavailable');ok(t.stats.paused===0,'callback prematuro não comprova vídeo sem aceite/início')
}
{
 const t=fixture(),job=t.engine.request(t.request);t.prepare();t.setAllowed(false)
 ok(!t.offer.accept(),'nova partida bloqueia aceite de oferta antiga');assert.equal(await job.result,'blocked')
 ok(t.stats.shown===0,'não exibe vídeo depois de sair da pausa segura')
}
{
 const t=fixture(),job=t.engine.request(t.request);t.prepare();ok(job.cancel(),'usuário pode recusar oferta');ok(!t.offer.accept(),'oferta recusada não pode iniciar depois');assert.equal(await job.result,'cancelled')
}
{
 const t=fixture(true,5),job=t.engine.request(t.request);assert.equal(await job.result,'unavailable');t.prepare();ok(!t.offer,'SDK atrasado não abre oferta depois do tempo limite')
}
{
 const t=fixture(true,5),job=t.engine.request(t.request);t.prepare();assert.equal(await job.result,'cancelled');ok(!t.offer.accept(),'oferta expirada não inicia anúncio')
}
{
 const t=fixture(),engine=createRewardedVideo({approved:true,transport:()=>{throw new Error('SDK failed')}})
 assert.equal(await engine.request(t.request).result,'error');ok(t.stats.closed===1,'erro do SDK libera tela')
}
{
 const t=fixture(),job=t.engine.request({...t.request,pause:()=>()=>{throw new Error('cleanup failed')}});t.prepare();t.offer.accept();t.p.adViewed();t.p.afterAd();t.p.adBreakDone({})
 assert.equal(await job.result,'viewed');ok(t.stats.closed===1,'falha na limpeza não bloqueia término')
}
{
 const t=fixture(),job=t.engine.request({...t.request,onOffer:()=>{throw new Error('UI failed')}});t.prepare();assert.equal(await job.result,'error');ok(t.stats.paused===0,'erro da oferta não pausa partida')
}
{
 const host:{}={};const transport=googleH5Transport(host),t=fixture(),job=t.engine.request(t.request)
 transport(t.p);ok(Array.isArray((host as {adsbygoogle:unknown[]}).adsbygoogle),'adapta fila oficial sem injetar script');job.cancel();await job.result
}
{
 const t=fixture(),job=t.engine.request({...t.request,canWatch:()=>{throw new Error('guard failed')}})
 assert.equal(await job.result,'blocked');ok(!t.p,'falha na verificação não consulta anúncios')
}
{
 const t=fixture(),job=t.engine.request({...t.request,onOfferClosed:()=>{throw new Error('UI cleanup failed')}});job.cancel()
 assert.equal(await job.result,'cancelled');ok(t.stats.paused===0,'erro no fechamento não bloqueia resultado')
}
console.log(`PASS: ${checks} verificações de vídeo opcional; nenhum anúncio pago solicitado e nenhum save alterado.`)

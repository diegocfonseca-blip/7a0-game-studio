// ─── 💗 O RELÓGIO QUE NÃO DORME ────────────────────────────────────────────
//
// PROBLEMA (Diego, 22/08 — e é a raiz da noite inteira): *"eles só saíram da
// sala pq tinha dado erros e ficava aparecendo toda hora banner vermelho em
// cima"*. A sala não morreu porque o dono foi embora; o dono foi embora porque
// a sala vivia acusando que ele tinha caído.
//
// POR QUE ACUSAVA: o dono manda "tô vivo" a cada 4s, salva a partida a cada 3s
// e reemite o estado a cada 6s — os três com `setInterval` normal. Só que o
// navegador FREIA os temporizadores de uma aba que não está na frente: o Chrome
// derruba pra UMA VEZ POR MINUTO. Ou seja, bastava o dono olhar o WhatsApp Web
// numa outra aba por 15 segundos e, pros convidados, ele tinha "sumido" — banner
// vermelho pra todo mundo, de novo e de novo. (Bate com os dois casos reais: o
// Braguinha *"travou no goleiro no PC"* e o Gustavinson agora.)
//
// SOLUÇÃO: os relógios do dono passam a bater DENTRO DE UM WEB WORKER. Worker é
// uma linha de execução separada da tela, e o navegador NÃO a freia junto com a
// aba de fundo. O trabalho continua na página (mandar recado, salvar) — o worker
// só dá o toque na hora certa. Rede (fetch/websocket) nunca foi freada; era só o
// relógio.
//
// LIMITE HONESTO: com o CELULAR BLOQUEADO o navegador congela a página inteira,
// worker incluído — aí não tem jeito, e é por isso que o convidado também ganhou
// a checagem no banco antes de acusar alguém. Isto resolve o caso de longe mais
// comum: quem está com o jogo aberto e trocou de aba/janela.
//
// Se o Worker não puder nascer (navegador antigo, política de segurança do
// site), cai sozinho no `setInterval` de sempre — nunca fica sem relógio.

/** Bate `fn` a cada `ms`, mesmo com a aba no fundo. Devolve a função que para. */
export function tickerVivo(ms: number, fn: () => void): () => void {
  if (typeof Worker !== 'undefined' && typeof Blob !== 'undefined' && typeof URL !== 'undefined') {
    let url = ''
    try {
      // o worker não conhece o jogo: só devolve um toque a cada `ms`.
      const fonte = `let t=null;onmessage=function(e){if(t){clearInterval(t);t=null}if(e.data&&e.data.ms){t=setInterval(function(){postMessage(1)},e.data.ms)}}`
      url = URL.createObjectURL(new Blob([fonte], { type: 'application/javascript' }))
      const w = new Worker(url)
      w.onmessage = () => { try { fn() } catch { /* um toque ruim não pode matar o relógio */ } }
      w.postMessage({ ms })
      return () => {
        try { w.terminate() } catch { /* ignora */ }
        try { if (url) URL.revokeObjectURL(url) } catch { /* ignora */ }
      }
    } catch {
      try { if (url) URL.revokeObjectURL(url) } catch { /* ignora */ }
      // cai no relógio comum logo abaixo
    }
  }
  const iv = setInterval(fn, ms)
  return () => clearInterval(iv)
}

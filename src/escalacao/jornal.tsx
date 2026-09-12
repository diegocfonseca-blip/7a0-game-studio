// ─── 📰 O MARTELO — Jornal da Temporada (carreira pirâmide) ──────────────
// Capa de jornal gerada no FIM de cada temporada: manchete ÚNICA pra cada uma
// das 80 posições da pirâmide (Série A a D × 20 colocações), os números do seu
// time, e "Os Donos da Temporada" (campeão + artilheiro de cada série + Copa).
// `{t}` nas manchetes é trocado pelo nome do time do jogador.
import { useState, useEffect, useRef } from 'react'
import { createRoot } from 'react-dom/client'
import { flushSync } from 'react-dom'
import type { SimTeam, CopaResult, SeasonScorer, Div } from './pyramidseason'
import { Escudo } from './escudos' // 🛡️ brasão do clube (desenhado por código, do NOME)
import { meuEstadioNome } from './manto' // 🏟️ nome batizado pelo sócio
import { CareerNewspaperStories } from './jornal-career-visual'
import { tr, getLang, ordinal } from './lang' // 🌐 BR/EN (12/09): a imagem compartilhada também
// 🖼️ as MESMAS ilustrações da tela (visual V22) — a imagem do compartilhar
// passou a ser cópia do jornal que a pessoa acabou de ler, não um desenho à parte.
import { carimboDoTime } from './mascotes' // 🐮 mascote do clube batizado, pro rodapé do elenco
import { avatarLote1 } from './avatar-lote1' // 🧑 rosto da lenda (mesma peça do campinho)
import { onlinePreviewEnabled } from './online-preview' // 🔒 prévia das duas contas (rede de segurança)
import { LEGEND_AVATARS_RELEASED } from './career-feature-release' // 🧑 rosto das lendas: LIBERADO geral
import { fotoDoJogador } from './rostos'
import { VADICO_LOGO } from './vadico' // 🪧 placa atrás do gol, igual à tela
import ligaArtSrc from './img/jornal-liga-v22.webp'
import copaArtSrc from './img/jornal-copa-v22.webp'
import scorerArtSrc from './img/jornal-artilheiro-v22.webp'

// 🛡️→🖼️ rasteriza o escudo (o MESMO <Escudo> da tela) pra desenhar no canvas do
// compartilhar. Antes a imagem do jornal mostrava só a 1ª LETRA do time — então a
// logo do batismo (Império Samambaia, Tôka10, etc.) não aparecia na figura que vai
// pro grupo. Agora desenha o brasão de verdade. Usa o react-dom já no bundle
// (createRoot + flushSync, síncrono); qualquer falha cai na letra de antes.
function escudoMarkup(nome: string, px: number): { kind: 'svg' | 'img'; data: string } | null {
  const host = document.createElement('div')
  host.style.cssText = 'position:fixed;left:-9999px;top:0'
  document.body.appendChild(host)
  const root = createRoot(host)
  try {
    flushSync(() => root.render(<Escudo nome={nome} size={px} />))
    const el = host.firstElementChild
    if (!el) return null
    if (el.tagName.toLowerCase() === 'img') return { kind: 'img', data: (el as HTMLImageElement).src }
    let s = new XMLSerializer().serializeToString(el)
    if (!s.includes('xmlns')) s = s.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"')
    return { kind: 'svg', data: s }
  } catch { return null }
  finally { root.unmount(); host.remove() }
}
function escudoImg(nome: string, px: number): Promise<HTMLImageElement | null> {
  const m = escudoMarkup(nome, px)
  if (!m) return Promise.resolve(null)
  const src = m.kind === 'img' ? m.data : 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(m.data)
  return new Promise(res => { const img = new Image(); img.onload = () => res(img); img.onerror = () => res(null); img.src = src })
}

// 🖼️ carrega uma imagem do bundle pro canvas. Falhou? devolve null e o desenho
// segue sem ela (nunca quebra a arte inteira por causa de uma figura).
// 🐮 mesma ideia do escudo, pra MASCOTE do clube batizado: rasteriza o desenho
// (o mesmo `carimboDoTime` que carimba a tela no gol) pra poder ir no canvas.
// Clube sem mascote devolve null e o rodapé sai sem ela, como sempre foi.
function mascoteImg(nome: string, px: number): Promise<HTMLImageElement | null> {
  const node = carimboDoTime(nome)
  if (!node) return Promise.resolve(null)
  const host = document.createElement('div')
  host.style.cssText = `position:fixed;left:-9999px;top:0;width:${px}px;height:${px}px`
  document.body.appendChild(host)
  const root = createRoot(host)
  let src: string | null = null
  try {
    flushSync(() => root.render(node as never))
    const el = host.querySelector('img, svg')
    if (el) {
      if (el.tagName.toLowerCase() === 'img') src = (el as HTMLImageElement).src
      else {
        let t = new XMLSerializer().serializeToString(el)
        if (!t.includes('xmlns')) t = t.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"')
        src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(t)
      }
    }
  } catch { src = null }
  finally { root.unmount(); host.remove() }
  return src ? loadImg(src) : Promise.resolve(null)
}
function loadImg(src: string): Promise<HTMLImageElement | null> {
  return new Promise(res => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = src })
}
// 📐 desenha a imagem PREENCHENDO o retângulo (igual object-fit: cover do CSS)
function drawCover(x: CanvasRenderingContext2D, img: HTMLImageElement, px: number, py: number, w: number, h: number) {
  const r = Math.max(w / img.naturalWidth, h / img.naturalHeight)
  const dw = img.naturalWidth * r, dh = img.naturalHeight * r
  x.save(); x.beginPath(); x.rect(px, py, w, h); x.clip()
  x.drawImage(img, px + (w - dw) / 2, py + (h - dh) / 2, dw, dh); x.restore()
}
const INK = '#0C0C0C'
const GOLD = '#FFC400'
const GOLD_HEX = '#F5B301'
// 🌱 Várzea agora entra em "Os Donos da Temporada" — antes só ia até a Série D
// (pedido do Diego 05/08: "hoje tem só da série D C B A").
const J_DIVS: Div[] = ['A', 'B', 'C', 'D', 'V']
const J_DIV_NAME: Record<Div, string> = { A: 'Série A', B: 'Série B', C: 'Série C', D: 'Série D', V: 'Várzea' }
const J_DIV_COLOR: Record<Div, string> = { A: '#B8892B', B: '#3E8E4E', C: '#9A7B33', D: '#7A7460', V: '#8B5E3C' }
const SERIF = { fontFamily: "Georgia, 'Times New Roman', serif" } as const
const COND = { fontFamily: 'Oswald, sans-serif' } as const

// ── 🏆 A SUA CAMPANHA NA COPA (Diego 16/08: "tem que aparecer também como é
// que o cara foi na Copa do Brasil, em que fase que ele caiu, se ganhou, não
// ganhou... criar frases também sobre quedas"). Igual as manchetes da liga:
// humor BR, provocação, uma frase diferente por temporada pra não repetir. ──
export interface CopaRun {
  status: 'campeao' | 'vice' | 'caiu'
  fase?: string // nome da fase em que caiu
  vs?: string // contra quem
  zebra?: boolean // caiu pra time de divisão MAIS BAIXA (vergonha extra)
}
// ⚠️ `placar` e `pens` vêm SEMPRE como **SEU × DELE** (quem monta orienta em
// pyramidseason.tsx). Toda frase daqui tem que escrever com VOCÊ como sujeito —
// se alguma disser "o adversário venceu por {placar}", inverte o sentido e mente.
export interface SuperRun { campeao: boolean; vs: string; placar: string; pens?: [number, number] }
function copaNota(run: CopaRun, nome: string, seasonNo: number, brasil?: boolean): { h: string; s: string } {
  const cup = brasil ? 'Copa do Brasil' : (getLang() === 'en' ? 'Legends Cup' : 'Copa Legends')
  const pick = <T,>(arr: T[]): T => arr[seasonNo % arr.length]
  const fase0 = run.fase ?? (getLang() === 'en' ? 'Cup' : 'Copa')
  // 🌐 mesma zoeira em inglês, pelo sentido (12/09)
  if (getLang() === 'en') {
    if (run.status === 'campeao') return pick([
      { h: `🏆 ${nome} WIN THE ${cup.toUpperCase()}!`, s: 'Went through everyone in the knockouts and lifted the trophy. Write it down: this year is theirs.' },
      { h: `🏆 THE ${cup.toUpperCase()} BELONGS TO ${nome}!`, s: 'Nobody could hold them. From the first match to the final, they steamrolled the whole bracket.' },
      { h: `🏆 ${nome} CHAMPIONS — AND IN CHARGE`, s: 'The cup is over and the winner’s name surprised nobody who was watching.' },
    ])
    if (run.status === 'vice') return pick([
      { h: `🥈 RUNNERS-UP: ${nome} STOP IN THE FINAL`, s: `Made it to the decider and watched ${run.vs} lift the trophy right in front of them. That hurts.` },
      { h: `🥈 SO CLOSE: ${nome} FINISH SECOND IN THE ${cup.toUpperCase()}`, s: `One match away from glory. ${run.vs} did not let it through.` },
      { h: `🥈 THE SILVER GOES TO ${nome}`, s: `Final lost to ${run.vs} — the team cried, and so did the fans.` },
    ])
    if (run.zebra) return pick([
      { h: `🦓 EMBARRASSING: ${nome} UPSET IN THE ${fase0.toUpperCase()}`, s: `Knocked out by ${run.vs}, a club from a lower division. The fans still can’t believe it.` },
      { h: `🦓 ${nome} LOSE TO ${run.vs} — AND CHECK THE DIVISION`, s: `Favourites on paper, out on the pitch. In the ${fase0}, no less.` },
      { h: `🦓 WHAT AN UPSET: ${nome} OUT IN THE ${fase0.toUpperCase()}`, s: `${run.vs} didn’t read the script and sent the favourites home.` },
    ])
    return pick([
      { h: `❌ ${nome} GO OUT IN THE ${fase0.toUpperCase()}`, s: `End of the road in the cup: ${run.vs} went through and the season is down to the league.` },
      { h: `❌ THE CUP IS OVER FOR ${nome}`, s: `Knocked out in the ${fase0} by ${run.vs}. There’s always next year.` },
      { h: `❌ ${nome} SAY GOODBYE TO THE ${cup.toUpperCase()}`, s: `Stopped in the ${fase0}, blocked by ${run.vs}. The trophy will go to somebody else.` },
    ])
  }
  if (run.status === 'campeao') return pick([
    { h: `🏆 ${nome} É CAMPEÃO DA ${cup.toUpperCase()}!`, s: 'Passou por todo mundo no mata-mata e levantou a taça. Escreve aí: esse ano é dele.' },
    { h: `🏆 A TAÇA DA ${cup.toUpperCase()} É DO ${nome}!`, s: 'Ninguém segurou. Do primeiro jogo à final, atropelou o chaveamento inteiro.' },
    { h: `🏆 ${nome} CAMPEÃO — E COM AUTORIDADE`, s: 'A Copa acabou e o nome do campeão não surpreendeu ninguém que acompanhou.' },
  ])
  if (run.status === 'vice') return pick([
    { h: `🥈 VICE: ${nome} PARA NA FINAL`, s: `Chegou até a decisão e viu o ${run.vs} levantar a taça na frente dele. Dói.` },
    { h: `🥈 TÃO PERTO: ${nome} É VICE DA ${cup.toUpperCase()}`, s: `Um jogo separava da glória. O ${run.vs} não deixou passar.` },
    { h: `🥈 A PRATA FICOU COM O ${nome}`, s: `Final perdida pro ${run.vs} — o time chorou, a torcida também.` },
  ])
  // caiu no meio do caminho
  const fase = run.fase ?? 'Copa'
  if (run.zebra) return pick([
    { h: `🦓 VERGONHA: ${nome} LEVA ZEBRA NA ${fase.toUpperCase()}`, s: `Eliminado pelo ${run.vs}, time de divisão mais baixa. A torcida ainda não acredita.` },
    { h: `🦓 ${nome} CAI PRO ${run.vs} — E OLHA A DIVISÃO`, s: `Favorito no papel, eliminado no campo. Na ${fase}, ainda por cima.` },
    { h: `🦓 DEU ZEBRA: ${nome} FORA NA ${fase.toUpperCase()}`, s: `O ${run.vs} não leu o roteiro e mandou o favorito pra casa.` },
  ])
  return pick([
    { h: `❌ ${nome} CAI NA ${fase.toUpperCase()}`, s: `Fim de linha na Copa: o ${run.vs} passou e a temporada ficou só com a liga.` },
    { h: `❌ ACABOU A COPA PRO ${nome}`, s: `Eliminado na ${fase} pelo ${run.vs}. Ano que vem tem mais.` },
    { h: `❌ ${nome} DÁ ADEUS À ${cup.toUpperCase()}`, s: `Parou na ${fase}, barrado pelo ${run.vs}. A taça vai ficar pra outro.` },
  ])
}
function superNota(run: SuperRun, nome: string, seasonNo: number): { h: string; s: string } {
  const pick = <T,>(arr: T[]): T => arr[seasonNo % arr.length]
  const pen = run.pens ? (getLang() === 'en' ? ` (pens ${run.pens[0]}×${run.pens[1]})` : ` (pênaltis ${run.pens[0]}×${run.pens[1]})`) : ''
  if (getLang() === 'en') {
    if (run.campeao) return pick([
      { h: `👑 ${nome} LIFT THE SUPER CUP!`, s: `Beat ${run.vs} ${run.placar}${pen} in the one-off decider and closed the year with one more on the shelf.` },
      { h: `👑 THE SUPER CUP IS ${nome}’S`, s: `One match against ${run.vs}: ${run.placar}${pen}. The season is crowned.` },
    ])
    return pick([
      { h: `😤 ${nome} LOSE THE SUPER CUP`, s: `Lost to ${run.vs} ${run.placar}${pen} in the decider. A perfect year slipped away.` },
      { h: `😤 THE SUPER CUP SLIPS THROUGH ${nome}’S HANDS`, s: `Beaten ${run.placar}${pen} by ${run.vs}, in the match that was worth everything.` },
    ])
  }
  if (run.campeao) return pick([
    { h: `👑 ${nome} LEVANTA A SUPERCOPA!`, s: `Bateu o ${run.vs} por ${run.placar}${pen} no jogo único e fechou o ano com mais uma na estante.` },
    { h: `👑 SUPERCOPA É DO ${nome}`, s: `Decisão em jogo único contra o ${run.vs}: ${run.placar}${pen}. Coroou a temporada.` },
  ])
  // ⚠️ com VOCÊ como sujeito, pra bater com a ordem SEU×DELE do placar
  return pick([
    { h: `😤 ${nome} PERDE A SUPERCOPA`, s: `Perdeu pro ${run.vs} por ${run.placar}${pen} na decisão. Faltou pouco pro ano perfeito.` },
    { h: `😤 SUPERCOPA ESCAPA DAS MÃOS DO ${nome}`, s: `Derrota por ${run.placar}${pen} pro ${run.vs}, no jogo que valia tudo.` },
  ])
}

interface Headline { h: string; s: string }
// 80 manchetes: uma pra CADA posição (índice 0 = campeão ... 19 = lanterna).
// Sobem 4 / caem 4 — o tom acompanha: glória, acesso, meio-tabela, sufoco, queda.
const HEADLINES: Record<Div, Headline[]> = {
  A: [
    { h: '{t} NO TOPO DO MUNDO!', s: 'Campeão da Série A — e o resto do país que se ajoelhe.' },
    { h: 'FICOU NO QUASE: {t} É VICE', s: 'Bateu na trave o ano inteiro e a taça escapou no detalhe.' },
    { h: '{t} NO PÓDIO, MAS SEM FESTA', s: 'Terceiro lugar na elite — bonito no retrato, vazio na sala de troféus.' },
    { h: '{t} FECHA O G4 DA ELITE', s: 'Temporada de gente grande — faltou só transformar respeito em taça.' },
    { h: '{t} FAZ CAMPANHA DE RESPEITO', s: '5º na Série A: incomodou os grandes, assustou ninguém.' },
    { h: '{t} QUASE ENTRE OS GRANDES', s: '6º lugar — o cheiro do G4 passou perto, mas foi só o cheiro.' },
    { h: '{t} TERMINA NO PELOTÃO DA FRENTE', s: '7º na elite. Sólido, honesto e sem manchete melhor que essa.' },
    { h: '{t} FAZ O SUFICIENTE. E SÓ.', s: '8º lugar: ninguém vaia, ninguém aplaude, todo mundo boceja.' },
    { h: '{t} NO MEIO DA TABELA DA ELITE', s: '9º — a diretoria chama de "projeto em construção". Sei.' },
    { h: 'TOP 10 PRA {t}. E DAÍ?', s: 'Décimo lugar na Série A: o troféu de participação está no correio.' },
    { h: '{t} E A ARTE DE NÃO ACONTECER', s: '11º na elite — nem G4, nem Z4, nem assunto no bar.' },
    { h: 'TEMPORADA MORNA DO {t}', s: '12º lugar: nem cheiro de taça, nem susto de queda. Café sem açúcar.' },
    { h: '{t} PASSA O ANO NO PILOTO AUTOMÁTICO', s: '13º na Série A — o time jogou, o torcedor cochilou.' },
    { h: '{t} SOBREVIVE SEM BRILHO', s: '14º lugar: o objetivo era não cair. Missão cumprida. Que emoção.' },
    { h: '{t} OLHOU PRO Z4 DE PERTO DEMAIS', s: '15º — flertou com o abismo e jura que estava tudo sob controle.' },
    { h: '{t} ESCAPA NO SUFOCO', s: '16º na elite: a permanência veio com o coração na boca da torcida.' },
    { h: 'CAIU NO SUFOCO: {t} DESPENCA DA ELITE', s: '17º e rebaixado — segurou até a última rodada, mas a conta chegou.' },
    { h: 'CAIU! {t} DEIXA A ELITE', s: '18º lugar e rebaixado: da champanhe pro suco em pó em 38 rodadas.' },
    { h: 'VEXAME: {t} REBAIXADO SEM REAGIR', s: '19º na Série A — a queda foi anunciada, assistida e consumada.' },
    { h: 'HUMILHAÇÃO HISTÓRICA DO {t}', s: 'Lanterna da elite. Da Série A pro poço, de elevador e sem escala.' },
  ],
  B: [
    { h: '{t} ATROPELA E VOLTA PRA ELITE!', s: 'Campeão da Série B com autoridade — a Série A que se prepare.' },
    { h: '{t} GARANTE O ACESSO COM ESTILO', s: 'Vice da B: subiu sem taça, mas subiu — e é isso que importa.' },
    { h: '{t} SOBE NO GRITO!', s: '3º lugar e acesso garantido — a festa invadiu a madrugada.' },
    { h: 'NO ÚLTIMO VAGÃO: {t} SOBE!', s: '4º da Série B — acesso arrancado com as unhas na rodada final.' },
    { h: 'QUE DOR: {t} FICA A UM PASSO', s: '5º lugar — o acesso escapou por um degrau. Alguém pague a terapia.' },
    { h: '{t} SONHOU ALTO, ACORDOU EM 6º', s: 'Brigou pelo acesso até abril e desidratou na reta final.' },
    { h: '{t} FAZ CAMPANHA HONESTA NA B', s: '7º lugar: promessa de acesso pro ano que vem. De novo.' },
    { h: '{t} TERMINA NO MEIO DO CAMINHO', s: '8º na Série B — nem sobe, nem cai, nem sai da rotina.' },
    { h: '{t} E A ETERNA VIDA DE SÉRIE B', s: '9º lugar: mais um ano na fila do acesso que não anda.' },
    { h: '{t} FECHA O TOP 10 DA B', s: 'Meio de tabela com gosto de "podia ser mais". Sempre podia.' },
    { h: '{t} JOGA O SUFICIENTE PRA NINGUÉM RECLAMAR', s: '11º — a torcida não sofreu, mas também não sorriu.' },
    { h: '{t} PATINA NA TABELA', s: '12º na Série B: começou como azarão e terminou como figurante.' },
    { h: '{t} FAZ TEMPORADA PRA ESQUECER', s: '13º lugar — o álbum da temporada tem mais bocejo que gol.' },
    { h: '{t} FICA DEVENDO', s: '14º na B: a diretoria prometeu acesso e entregou planilha.' },
    { h: '{t} SENTE O BAFO DO Z4', s: '15º — escapou, mas passou a reta final olhando pra trás.' },
    { h: '{t} RESPIRA NA ÚLTIMA RODADA', s: '16º lugar: a permanência veio no detalhe e a torcida envelheceu 10 anos.' },
    { h: 'NÃO SEGUROU: {t} CAI PRA SÉRIE C', s: '17º na Série B — lutou até a última rodada, mas desceu no detalhe.' },
    { h: 'DESABOU: {t} CAI PRA SÉRIE C', s: '18º lugar — o rebaixamento veio em silêncio, a cobrança veio aos berros.' },
    { h: 'CRISE TOTAL: {t} REBAIXADO', s: '19º da B — presidente promete "reformulação profunda". A torcida promete fúria.' },
    { h: '{t} AFUNDA COMO LANTERNA DA B', s: 'Último lugar e queda: temporada digna de CPI.' },
  ],
  C: [
    { h: '{t} É CAMPEÃO E SOBE VOANDO!', s: 'Título da Série C com sobra — a B recebe um time em chamas.' },
    { h: '{t} CARIMBA O ACESSO!', s: 'Vice da C: subiu de novo o degrau da pirâmide. A escalada continua.' },
    { h: '{t} SOBE NA RAÇA!', s: '3º lugar da Série C — acesso suado, comemoração molhada.' },
    { h: 'UFA! {t} AGARRA A ÚLTIMA VAGA', s: '4º da C: o acesso veio no fôlego final. Coração da torcida não agradece.' },
    { h: '{t} TROPEÇA NA PORTA DO ACESSO', s: '5º lugar — fez tudo certo até precisar fazer o principal.' },
    { h: '{t} FICA NO QUASE DA SÉRIE C', s: '6º: flertou com o acesso, casou com o meio de tabela.' },
    { h: '{t} FAZ SEU PAPEL. SÓ ISSO.', s: '7º da Série C — campanha de quem cumpre tabela com dignidade.' },
    { h: '{t} TERMINA NO LIMBO DA C', s: '8º lugar: longe do topo, longe do fundo, longe das manchetes.' },
    { h: '{t} EMPACA NO MEIO DA TABELA', s: '9º — nem a torcida lembra metade dos jogos. E talvez seja melhor assim.' },
    { h: '{t} FECHA ENTRE OS DEZ DA C', s: '10º lugar: a temporada passou e ninguém anotou o telefone.' },
    { h: '{t} VIVE MAIS UM ANO DE SÉRIE C', s: '11º — rotina de interior: joga, empata, volta pra casa.' },
    { h: '{t} NÃO SAI DO LUGAR', s: '12º na C: mesma série, mesma posição, mesma promessa pro ano que vem.' },
    { h: '{t} DECEPCIONA NA SÉRIE C', s: '13º lugar — era pra subir, deu pra sobreviver.' },
    { h: '{t} FAZ ANO BUROCRÁTICO', s: '14º da C: nenhuma glória, nenhuma tragédia, nenhum motivo pra print.' },
    { h: '{t} PISCA PRO Z4 E SE ARREPENDE', s: '15º — brincou com o perigo até a penúltima rodada.' },
    { h: '{t} ESCAPA COM O CORAÇÃO NA MÃO', s: '16º da Série C: permanência garantida no grito e na reza.' },
    { h: 'CAIU POR POUCO: {t} DESCE PRA SÉRIE D', s: '17º da Série C — a queda veio a um passo da salvação. A diretoria já marcou reunião.' },
    { h: 'QUEDA CONFIRMADA: {t} NA SÉRIE D', s: '18º da C — o time desceu e a paciência da torcida foi junto.' },
    { h: '{t} DESPENCA PRA SÉRIE D', s: '19º lugar: campanha que vai virar aula do que não fazer.' },
    { h: 'FUNDO DO POÇO: {t} LANTERNA E REBAIXADO', s: 'Último da C — desceu pra D com a mala e a vergonha.' },
  ],
  D: [
    { h: '{t} SAI DO POÇO COMO CAMPEÃO!', s: 'Título da Série D — o primeiro degrau da glória foi conquistado no grito.' },
    { h: '{t} SOBE! ADEUS, VÁRZEA!', s: 'Vice da D e acesso: a escalada da pirâmide começou oficialmente.' },
    { h: '{t} GARANTE O ACESSO NO PEITO', s: '3º da Série D — subiu com direito a carreata e buzinaço.' },
    { h: 'NO APAGAR DAS LUZES: {t} SOBE!', s: '4º lugar — a última vaga de acesso veio na rodada final. Que roteiro.' },
    { h: '{t} ACORDA TARDE E FICA', s: '5º da D: embalou quando a vaga já tinha ido embora.' },
    { h: '{t} QUASE, QUASE, QUASE...', s: '6º lugar — o acesso passou na porta e não tocou a campainha.' },
    { h: '{t} FAZ CAMPANHA DECENTE NA D', s: '7º: prometeu acesso, entregou esperança. Ano que vem tem mais.' },
    { h: '{t} FICA NO MEIO DO MATO', s: '8º da Série D — nem brilhou, nem passou vergonha. Empate com a vida.' },
    { h: '{t} SEGUE NA LUTA (E NA D)', s: '9º lugar: mais uma temporada de aprendizado, como diz o técnico.' },
    { h: '{t} FECHA O TOP 10 DA VÁRZEA', s: '10º — na D até posição redonda é meio consolo.' },
    { h: '{t} NÃO DECOLA', s: '11º da Série D: o projeto segue "em fase de maturação". Aham.' },
    { h: '{t} PATINA NO BARRO DA D', s: '12º lugar — jogou 38 vezes e ninguém sabe dizer como.' },
    { h: '{t} FAZ TEMPORADA INVISÍVEL', s: '13º: nem o mascote foi aos últimos jogos.' },
    { h: '{t} CONTINUA DEVENDO', s: '14º da D — a torcida pediu futebol, recebeu desculpas.' },
    { h: '{t} AMARGA A PARTE FEIA DA TABELA', s: '15º lugar: na várzea e mal colocado. Combo difícil.' },
    { h: '{t} SE ARRASTA ATÉ O FIM', s: '16º da Série D — terminou o ano no modo sobrevivência.' },
    { h: '{t} FAZ CAMPANHA DE DAR DÓ', s: '17º: até o adversário ficou com pena. Até marcar o quinto.' },
    { h: '{t} QUASE FECHA COMO PIOR DO PAÍS', s: '18º da D — escapou da lanterna, não escapou da zoeira.' },
    { h: '{t} FLERTA COM O FIM DO MUNDO', s: '19º lugar: abaixo disso, só o campeonato de pelada do bairro.' },
    { h: 'O PIOR TIME DO PAÍS. É ISSO.', s: '{t} é o lanterna da Série D. Sem mais, excelência.' },
  ],
  V: [
    { h: '{t} É O REI DO PELADÃO!', s: 'Campeão da Várzea — churrasco, troféu de lata e acesso pra Série D!' },
    { h: '{t} SOBE DO PELADÃO!', s: 'Vice da Várzea: saiu do campo de terra direto pro profissional.' },
    { h: '{t} SOBE COM O PÉ NA PORTA!', s: '3º da Várzea — acesso garantido e caravana pro churrasco.' },
    { h: 'NO APAGAR DAS LUZES: {t} SOBE!', s: '4º da Várzea: pegou a última vaga pro mundo profissional.' },
    { h: '{t} FICA A UM CHURRASCO DO ACESSO', s: '5º na Várzea — faltou um empurrão (e um juiz menos caseiro).' },
    { h: '{t} QUASE SAI DO PELADÃO', s: '6º lugar: prometeu acesso, entregou resenha.' },
    { h: '{t} FAZ BONITO NO BARRO', s: '7º da Várzea — time honesto, chuteira gasta, sonho vivo.' },
    { h: '{t} NO MEIO DO PELADÃO', s: '8º lugar: nem sobe, nem desce — só o churrasco é garantido.' },
    { h: '{t} JOGA PELA CERVEJA GELADA', s: '9º na Várzea: o futebol foi médio, a resenha foi campeã.' },
    { h: '{t} FECHA O TOP 10 DO BARRO', s: '10º — a torcida (12 pessoas e um cachorro) aplaudiu de pé.' },
    { h: '{t} EMPACA NA TERRA BATIDA', s: '11º da Várzea: o campo não tem grama e o time não tem pressa.' },
    { h: '{t} VIVE DE RESENHA', s: '12º lugar — perdeu jogo, ganhou amigo. Balanço positivo?' },
    { h: '{t} DEIXA A DESEJAR NO PELADÃO', s: '13º: até o dono da bola já cobrou reforço.' },
    { h: '{t} FAZ ANO DE PERNA PESADA', s: '14º da Várzea — culpa do gramado, jura o técnico.' },
    { h: '{t} LEVA SUSTO NO FIM DE ANO', s: '15º — escapou da lanterna com gol do goleiro. Clássico.' },
    { h: '{t} RESPIRA NO ÚLTIMO MINUTO', s: '16º da Várzea: se salvou e prometeu "ano que vem a gente sobe".' },
    { h: '{t} FICA PELO CAMINHO', s: '17º no peladão — o acesso virou lenda de bar.' },
    { h: '{t} PATINA NO BARRO', s: '18º da Várzea: nem o churrasco salvou a temporada.' },
    { h: '{t} SÓ NÃO FOI LANTERNA POR EDUCAÇÃO', s: '19º — o time jogou de chinelo. Às vezes literalmente.' },
    { h: '{t} É A LANTERNA DO PELADÃO', s: 'Último da Várzea — mas na resenha, ninguém ganha deles. 🍺' },
  ],
}
// carimbo da "foto" conforme o resultado (sobem 4 / caem 4)
function stampOf(div: Div, pos: number): { txt: string; color: string } | null {
  if (pos === 1) return { txt: 'CAMPEÃO', color: '#B23A2A' }
  if (pos <= 4 && div !== 'A') return { txt: 'ACESSO', color: '#1B7A3D' }
  if (pos >= 17 && div !== 'D') return { txt: 'REBAIXADO', color: '#B23A2A' }
  if (pos === 20 && div === 'D') return { txt: 'LANTERNA', color: '#7A7460' }
  return null
}

// 🌐 AS MESMAS 100 MANCHETES EM INGLÊS (12/09, ordem do Diego: *"sim pode fazer
// tudo isso"*). Traduzidas pelo SENTIDO, não ao pé da letra — a graça é a
// piada, não a palavra. Mesma ordem: índice = colocação − 1, de 1º a 20º.
// ⚠️ Divisão NÃO se traduz (Série A/B/C/D e Várzea são identidade do jogo).
const HEADLINES_EN: Record<Div, Headline[]> = {
  A: [
    { h: '{t} ON TOP OF THE WORLD!', s: 'Série A champions — and the rest of the country may kneel.' },
    { h: 'SO CLOSE: {t} FINISH SECOND', s: 'Hit the woodwork all year and lost the title on a detail.' },
    { h: '{t} ON THE PODIUM, WITHOUT A PARTY', s: 'Third in the top flight — pretty in the photo, empty in the trophy room.' },
    { h: '{t} SNEAK INTO THE TOP FOUR', s: 'A big club’s season — they just forgot to turn respect into silverware.' },
    { h: '{t} EARN SOME RESPECT', s: '5th in Série A: annoyed the big boys, scared nobody.' },
    { h: '{t} ALMOST WITH THE BIG BOYS', s: '6th — they could smell the top four. The smell was all they got.' },
    { h: '{t} FINISH IN THE FRONT PACK', s: '7th in the top flight. Solid, honest, and no better headline than this one.' },
    { h: '{t} DO ENOUGH. AND THAT’S IT.', s: '8th: nobody boos, nobody claps, everybody yawns.' },
    { h: '{t} STUCK IN TOP-FLIGHT MID-TABLE', s: '9th — the board calls it "a project under construction". Sure.' },
    { h: 'TOP 10 FOR {t}. SO WHAT?', s: 'Tenth in Série A: the participation trophy is in the post.' },
    { h: '{t} AND THE ART OF NOT HAPPENING', s: '11th in the top flight — no top four, no drop zone, no bar talk.' },
    { h: 'A LUKEWARM YEAR FOR {t}', s: '12th: no whiff of a title, no fear of the drop. Coffee with no sugar.' },
    { h: '{t} SPEND THE YEAR ON AUTOPILOT', s: '13th in Série A — the team played, the fans dozed off.' },
    { h: '{t} SURVIVE WITHOUT SHINING', s: '14th: the goal was not to go down. Mission accomplished. Thrilling.' },
    { h: '{t} LOOKED AT THE DROP ZONE FAR TOO CLOSELY', s: '15th — flirted with the abyss and swears it was all under control.' },
    { h: '{t} ESCAPE BY A WHISKER', s: '16th in the top flight: safety arrived with the fans’ hearts in their mouths.' },
    { h: 'DOWN FIGHTING: {t} DROP OUT OF THE ELITE', s: '17th and relegated — held on to the last round, but the bill came.' },
    { h: 'DOWN! {t} LEAVE THE TOP FLIGHT', s: '18th and relegated: from champagne to powdered juice in 38 rounds.' },
    { h: 'DISGRACE: {t} RELEGATED WITHOUT A FIGHT', s: '19th in Série A — the fall was announced, watched and completed.' },
    { h: 'HISTORIC HUMILIATION FOR {t}', s: 'Bottom of the top flight. From Série A to the pit, by lift, no stops.' },
  ],
  B: [
    { h: '{t} STEAMROLL THEIR WAY BACK TO THE ELITE!', s: 'Série B champions with authority — the top flight had better get ready.' },
    { h: '{t} SEAL PROMOTION IN STYLE', s: 'Runners-up in B: up without the trophy, but up — and that’s what counts.' },
    { h: '{t} GO UP SCREAMING!', s: '3rd place and promotion secured — the party ran into the small hours.' },
    { h: 'LAST CARRIAGE: {t} GO UP!', s: '4th in Série B — promotion clawed out on the final day.' },
    { h: 'OUCH: {t} FALL ONE STEP SHORT', s: '5th — promotion slipped away by a single rung. Someone pay for the therapy.' },
    { h: '{t} DREAMED BIG, WOKE UP 6TH', s: 'Fought for promotion until April and ran out of legs down the stretch.' },
    { h: '{t} PUT IN AN HONEST SÉRIE B', s: '7th place: promise of promotion next year. Again.' },
    { h: '{t} FINISH HALFWAY', s: '8th in Série B — no going up, no going down, no change of routine.' },
    { h: '{t} AND THE ETERNAL SÉRIE B LIFE', s: '9th: another year in the promotion queue that never moves.' },
    { h: '{t} CLOSE OUT THE SÉRIE B TOP TEN', s: 'Mid-table with a taste of "it could have been more". It always could.' },
    { h: '{t} DO JUST ENOUGH TO AVOID COMPLAINTS', s: '11th — the fans didn’t suffer, but they didn’t smile either.' },
    { h: '{t} SPINNING THEIR WHEELS', s: '12th in Série B: started as a dark horse, finished as an extra.' },
    { h: '{t} HAVE A SEASON TO FORGET', s: '13th — the season’s album has more yawns than goals.' },
    { h: '{t} COME UP SHORT', s: '14th in B: the board promised promotion and delivered a spreadsheet.' },
    { h: '{t} FEEL THE DROP ZONE BREATHING', s: '15th — safe, but spent the run-in looking over their shoulder.' },
    { h: '{t} BREATHE ON THE FINAL DAY', s: '16th: safety came down to the details and the fans aged ten years.' },
    { h: 'COULDN’T HOLD ON: {t} FALL TO SÉRIE C', s: '17th in Série B — fought to the last round, went down on the fine print.' },
    { h: 'COLLAPSE: {t} FALL TO SÉRIE C', s: '18th — the relegation came in silence, the backlash came screaming.' },
    { h: 'FULL-BLOWN CRISIS: {t} RELEGATED', s: '19th in B — the president promises "a deep rebuild". The fans promise fury.' },
    { h: '{t} SINK AS SÉRIE B’S BOTTOM CLUB', s: 'Last place and down: a season worthy of a public inquiry.' },
  ],
  C: [
    { h: '{t} ARE CHAMPIONS AND FLY UP!', s: 'Série C title with room to spare — Série B gets a team on fire.' },
    { h: '{t} STAMP THEIR TICKET UP!', s: 'Runners-up in C: another rung of the pyramid climbed. The ascent goes on.' },
    { h: '{t} GO UP ON GUTS!', s: '3rd in Série C — promotion earned the hard way, celebration soaked through.' },
    { h: 'PHEW! {t} GRAB THE LAST SPOT', s: '4th in C: promotion arrived on fumes. The fans’ hearts are not grateful.' },
    { h: '{t} TRIP ON THE DOORSTEP OF PROMOTION', s: '5th — did everything right until the part that actually mattered.' },
    { h: '{t} LEFT IN SÉRIE C’S ALMOST', s: '6th: flirted with promotion, married mid-table.' },
    { h: '{t} DO THEIR JOB. NOTHING MORE.', s: '7th in Série C — the campaign of a club that fulfils the fixture list with dignity.' },
    { h: '{t} FINISH IN SÉRIE C LIMBO', s: '8th: far from the top, far from the bottom, far from the headlines.' },
    { h: '{t} BOG DOWN IN MID-TABLE', s: '9th — not even the fans remember half the matches. Maybe that’s for the best.' },
    { h: '{t} CLOSE THE SÉRIE C TOP TEN', s: '10th: the season went by and nobody took their number.' },
    { h: '{t} SPEND ANOTHER YEAR IN SÉRIE C', s: '11th — countryside routine: play, draw, go home.' },
    { h: '{t} GO NOWHERE', s: '12th in C: same division, same position, same promise for next year.' },
    { h: '{t} DISAPPOINT IN SÉRIE C', s: '13th — they were meant to go up, they managed to survive.' },
    { h: '{t} HAVE A PAPERWORK SEASON', s: '14th in C: no glory, no tragedy, no reason for a screenshot.' },
    { h: '{t} WINK AT THE DROP ZONE AND REGRET IT', s: '15th — played with fire until the second-to-last round.' },
    { h: '{t} ESCAPE WITH THEIR HEART IN THEIR HANDS', s: '16th in Série C: safety secured by shouting and praying.' },
    { h: 'DOWN BY INCHES: {t} FALL TO SÉRIE D', s: '17th in Série C — relegation came one step from safety. The board has already booked a meeting.' },
    { h: 'RELEGATION CONFIRMED: {t} IN SÉRIE D', s: '18th in C — the team went down and the fans’ patience went with it.' },
    { h: '{t} PLUNGE TO SÉRIE D', s: '19th: a campaign that will become a lesson in what not to do.' },
    { h: 'ROCK BOTTOM: {t} LAST AND RELEGATED', s: 'Bottom of C — down to D with the suitcase and the shame.' },
  ],
  D: [
    { h: '{t} CLIMB OUT OF THE PIT AS CHAMPIONS!', s: 'Série D title — the first step to glory, taken screaming.' },
    { h: '{t} GO UP! GOODBYE, PARK FOOTBALL!', s: 'Runners-up in D and promoted: the climb up the pyramid has officially begun.' },
    { h: '{t} SEAL PROMOTION WITH THEIR CHEST', s: '3rd in Série D — up, with a motorcade and a lot of honking.' },
    { h: 'AT THE DEATH: {t} GO UP!', s: '4th — the last promotion spot arrived on the final day. What a script.' },
    { h: '{t} WAKE UP LATE AND STAY PUT', s: '5th in D: got going once the spot had already gone.' },
    { h: '{t} ALMOST, ALMOST, ALMOST…', s: '6th — promotion walked past the door and didn’t ring the bell.' },
    { h: '{t} PUT IN A DECENT SÉRIE D', s: '7th: promised promotion, delivered hope. There’s always next year.' },
    { h: '{t} END UP IN THE MIDDLE OF NOWHERE', s: '8th in Série D — didn’t shine, didn’t embarrass themselves. A draw with life.' },
    { h: '{t} STILL FIGHTING (AND STILL IN D)', s: '9th: another season of learning, as the manager puts it.' },
    { h: '{t} CLOSE THE FOURTH-TIER TOP TEN', s: '10th — down here even a round number is half a consolation.' },
    { h: '{t} NEVER TAKE OFF', s: '11th in Série D: the project remains "in a maturing phase". Right.' },
    { h: '{t} SLIP AROUND IN THE MUD OF D', s: '12th — played 38 times and nobody can say how.' },
    { h: '{t} HAVE AN INVISIBLE SEASON', s: '13th: not even the mascot turned up to the last matches.' },
    { h: '{t} STILL OWE THE FANS', s: '14th in D — the fans asked for football and got excuses.' },
    { h: '{t} STUCK IN THE UGLY END OF THE TABLE', s: '15th: in the fourth tier and badly placed. Tough combo.' },
    { h: '{t} DRAG THEMSELVES TO THE END', s: '16th in Série D — finished the year in survival mode.' },
    { h: '{t} PUT IN A PITIFUL CAMPAIGN', s: '17th: even the opposition felt sorry for them. Until the fifth goal.' },
    { h: '{t} NEARLY FINISH AS THE COUNTRY’S WORST', s: '18th in D — dodged last place, didn’t dodge the jokes.' },
    { h: '{t} FLIRT WITH THE END OF THE WORLD', s: '19th: below this, only the neighbourhood kickabout.' },
    { h: 'THE WORST TEAM IN THE COUNTRY. THAT’S IT.', s: '{t} finish bottom of Série D. Nothing more, your excellency.' },
  ],
  V: [
    { h: '{t} ARE THE KINGS OF PARK FOOTBALL!', s: 'Várzea champions — barbecue, a tin trophy and promotion to Série D!' },
    { h: '{t} CLIMB OUT OF THE PARK!', s: 'Runners-up in Várzea: straight from the dirt pitch to the professional game.' },
    { h: '{t} GO UP KICKING THE DOOR IN!', s: '3rd in Várzea — promotion secured and a convoy to the barbecue.' },
    { h: 'AT THE DEATH: {t} GO UP!', s: '4th in Várzea: grabbed the last spot into the professional world.' },
    { h: '{t} FINISH ONE BARBECUE SHORT OF PROMOTION', s: '5th in Várzea — they needed one more push (and a less biased referee).' },
    { h: '{t} ALMOST ESCAPE THE PARK', s: '6th: promised promotion, delivered banter.' },
    { h: '{t} LOOK GOOD IN THE MUD', s: '7th in Várzea — honest team, worn-out boots, dream alive.' },
    { h: '{t} IN THE MIDDLE OF THE PARK LEAGUE', s: '8th: no up, no down — only the barbecue is guaranteed.' },
    { h: '{t} PLAY FOR THE COLD BEER', s: '9th in Várzea: the football was average, the banter was champion.' },
    { h: '{t} CLOSE THE TOP TEN OF THE DIRT', s: '10th — the crowd (twelve people and a dog) gave a standing ovation.' },
    { h: '{t} BOG DOWN ON THE BARE PITCH', s: '11th in Várzea: the pitch has no grass and the team is in no hurry.' },
    { h: '{t} LIVE OFF THE BANTER', s: '12th — lost the match, made a friend. Positive balance?' },
    { h: '{t} LEAVE SOMETHING TO BE DESIRED', s: '13th: even the bloke who owns the ball has asked for signings.' },
    { h: '{t} HAVE A HEAVY-LEGGED YEAR', s: '14th in Várzea — the pitch’s fault, swears the manager.' },
    { h: '{t} GET A SCARE AT THE END OF THE YEAR', s: '15th — escaped last place with a goal from the keeper. Classic.' },
    { h: '{t} BREATHE IN THE LAST MINUTE', s: '16th in Várzea: survived and promised "next year we go up".' },
    { h: '{t} FALL BY THE WAYSIDE', s: '17th in the park league — promotion became a bar legend.' },
    { h: '{t} SLIP IN THE MUD', s: '18th in Várzea: not even the barbecue saved the season.' },
    { h: '{t} ONLY AVOIDED LAST PLACE OUT OF POLITENESS', s: '19th — the team played in flip-flops. Sometimes literally.' },
    { h: '{t} ARE THE PARK LEAGUE’S BOTTOM CLUB', s: 'Last in Várzea — but in the banter, nobody beats them. 🍺' },
  ],
}

export function seasonHeadline(div: Div, pos: number, team: string): Headline {
  const tabela = getLang() === 'en' ? HEADLINES_EN : HEADLINES
  const raw = tabela[div][Math.min(19, Math.max(0, pos - 1))]
  return { h: raw.h.replace('{t}', team.toUpperCase()), s: raw.s.replace('{t}', team) }
}

// 🕴️ notícia do CADERNO DO EMPRESÁRIO (página 2 — Agência 2.0, carreira nova):
// só emoção, SEM moeda (decisão do Diego) — a grana aparece na Cerimônia/aba.
export type AgNews = { ic: string; titulo: string; sub: string }

// ─── a capa ──────────────────────────────────────────────────────────────
export function SeasonJornal({ me, tables, copa, divTop, seasonNo, agenciaNews, eventos, memoria, mundial, brasil, copaRun, superRun, superChamp, privateVisual = false }: {
  privateVisual?: boolean
  me: { div: Div; pos: number; team: string }
  tables: Record<Div, SimTeam[]>
  copa: CopaResult | null
  divTop: Record<Div, SeasonScorer | undefined>
  seasonNo: number
  agenciaNews?: AgNews[]
  eventos?: AgNews[] // 🎭 manchetes dos EVENTOS DE JOGADOR — página "Aconteceu na temporada"
  memoria?: AgNews[] // 📼 manchetes de HISTÓRIA (Diego 24/08): "3º título seguido", "acabou o jejum" — vêm da careerCronica, página "O jornal lembra"
  mundial?: { campeao: string; selecao: string; voce: boolean } | null // 🌍 Copa do Mundo Legends — só quando ela ACONTECE (a cada 10 temporadas) e termina nesta
  brasil?: boolean // 🏆🇧🇷 true = a Copa que rolou foi a do Brasil (não a Legends) — só troca o nome exibido, mesmo dado
  copaRun?: CopaRun // 🏆 como VOCÊ foi na Copa (fase que caiu / vice / campeão)
  superRun?: SuperRun // 👑 só existe se VOCÊ jogou a final da Supercopa
  superChamp?: { name: string; you: boolean; vs: string } | null // 👑 quem levou a Supercopa (pra linha dos donos da temporada)
}) {
  // abre EXPANDIDO por padrão (a manchete é a estrela do fim de temporada);
  // o "Fechar" recolhe pro botãozinho se a pessoa quiser limpar a tela.
  const [open, setOpen] = useState(true)
  const [copied, setCopied] = useState(false)
  // 📰➡️🕴️ PÁGINA 2 (Caderno do Empresário): só existe se a temporada teve
  // notícia de agenciado. A capa fica 5s e VIRA sozinha (uma vez); toque no
  // rodapé de páginas vai e volta. Sem notícia/save antigo = só a capa, como hoje.
  const news = (agenciaNews && agenciaNews.length > 0) ? agenciaNews : null
  // 🎭 página "Aconteceu na temporada" (eventos de jogador) — só existe se teve causo.
  // As páginas são dinâmicas: capa → caderno do empresário (se tem) → eventos (se tem).
  const evs = (eventos && eventos.length > 0) ? eventos : null
  // 📼 página "O jornal lembra" — só existe quando a história tem o que contar
  // (streak de títulos, jejum, marco de temporadas na divisão…).
  const mem = (memoria && memoria.length > 0) ? memoria : null
  const pags: ('capa' | 'agencia' | 'eventos' | 'memoria')[] = ['capa', ...(news ? ['agencia' as const] : []), ...(evs ? ['eventos' as const] : []), ...(mem ? ['memoria' as const] : [])]
  const [page, setPage] = useState(0)
  const [barGo, setBarGo] = useState(false)
  const flippedRef = useRef(false)
  useEffect(() => {
    if (!open || page !== 0 || !news || flippedRef.current) return
    const t0 = setTimeout(() => setBarGo(true), 60) // dispara a barrinha (transition 5s)
    const t1 = setTimeout(() => { flippedRef.current = true; setPage(1) }, 5100)
    return () => { clearTimeout(t0); clearTimeout(t1) }
  }, [open, page, news])
  const virar = (p: number) => { flippedRef.current = true; setPage(p) } // toque manual cancela o automático
  const pk = pags[Math.min(page, pags.length - 1)] // página atual (índice sempre válido)
  // manchete do caderno: a MELHOR notícia manda (artilheiro > campeão > mercado)
  const agManchete = (() => {
    if (!news) return null
    const art = news.find(n => n.ic === '🥇'), tit = news.find(n => n.ic === '🏆')
    if (art) { const nome = art.titulo.split(' é o artilheiro')[0].split(' levanta')[0]; return { h: `${nome.toUpperCase()} É ARTILHEIRO — ORGULHO DA SUA AGÊNCIA!`, s: 'Temporada dos sonhos pros seus meninos: o nome da sua agência correu o país.' } }
    if (tit) { const nome = tit.titulo.split(' levanta')[0].split(' campeão')[0]; return { h: `${nome.toUpperCase()} CAMPEÃO — CRIA DA SUA AGÊNCIA!`, s: 'Taça no armário e o seu telefone tocando sem parar.' } }
    return { h: 'MERCADO AGITADO — SUA AGÊNCIA EM ALTA!', s: 'Negociações fechadas e os seus meninos em evidência.' }
  })()
  const agQuote = [
    '"Talento a gente não vende — a gente representa. Hoje o futebol inteiro sabe de quem são esses meninos."',
    '"Eu vi esse menino treinando na chuva. Hoje o país inteiro canta o nome dele."',
    '"Contrato bom é aquele que faz o jogador sorrir. O resto é assinatura."',
    '"Agente de verdade não aparece na foto — aparece na história."',
  ][seasonNo % 4]
  const mine = tables[me.div]?.find(t => t.you)
  const hl = seasonHeadline(me.div, me.pos, me.team)
  const stamp = stampOf(me.div, me.pos)

  // desenha a CAPA do jornal em imagem (canvas) — é ela que vai no compartilhar,
  // não texto. Mesma cara da capa na tela: cabeçalho, manchete, foto carimbada,
  // números e os donos da temporada.
  // 📰 A IMAGEM DO COMPARTILHAR = A CAPA QUE ESTÁ NA TELA (visual V22).
  // Reescrita em 12/09. O Diego pegou o descompasso: *"o jornal atual hj já mudou
  // aparência.. só o compartilhar q ainda não"*. A tela já usava o V22 (masthead
  // centralizado, ilustrações da liga/copa/artilheiro com o escudo por cima,
  // notas em duas colunas) e este canvas ainda desenhava o layout velho — quadro
  // verde chapado, tabela de números e lista corrida. Agora ele copia a tela.
  async function buildJornalBlob(): Promise<Blob | null> {
    const W = 1080, MAXH = 2400
    const cv = document.createElement('canvas'); cv.width = W; cv.height = MAXH
    const x = cv.getContext('2d'); if (!x) return null
    try { await document.fonts.load('900 60px Oswald'); await document.fonts.load('700 60px Oswald') } catch { /* segue */ }
    const SER = "Georgia, 'Times New Roman', serif", OSW = 'Oswald, sans-serif'
    const PAPEL_A = '#fbf3df', PAPEL_B = '#e3d0ad', TINTA2 = '#413825', TINTA3 = '#615039'
    const wrap = (t: string, font: string, maxW: number): string[] => {
      x.font = font
      const out: string[] = []; let line = ''
      for (const w of t.split(' ')) {
        const test = line ? line + ' ' + w : w
        if (x.measureText(test).width > maxW && line) { out.push(line); line = w } else line = test
      }
      if (line) out.push(line)
      return out
    }
    const cortar = (t: string, font: string, maxW: number): string => {
      x.font = font; let r = t
      while (x.measureText(r).width > maxW && r.length > 3) r = r.slice(0, -1)
      return r === t ? t : r + '…'
    }
    // 📄 papel do V22: creme com a luz vindo de cima
    const pg = x.createRadialGradient(W * 0.3, 0, 40, W * 0.3, 0, W * 1.25)
    pg.addColorStop(0, PAPEL_A); pg.addColorStop(1, PAPEL_B)
    x.fillStyle = pg; x.fillRect(0, 0, W, MAXH)
    const L = 46, R = W - 46
    let y = 92

    // ── MASTHEAD centralizado (a marca do V22)
    x.textAlign = 'center'; x.fillStyle = INK; x.font = `900 84px ${SER}`
    x.fillText('O MARTELO', W / 2, y)
    y += 30
    x.font = `700 20px ${SER}`; x.fillStyle = TINTA2
    x.fillText(`${tr('TEMPORADA', 'SEASON')} ${seasonNo} · ${J_DIV_NAME[me.div].toUpperCase()}`, W / 2, y)
    y += 16
    x.strokeStyle = '#6c604a'; x.lineWidth = 1.5
    x.beginPath(); x.moveTo(L, y); x.lineTo(R, y); x.stroke()
    y += 22
    x.font = `700 17px ${OSW}`; x.fillStyle = TINTA2
    x.textAlign = 'left'; x.fillText(tr('O DIÁRIO DO LEILÃO LEGENDS', 'THE LEILÃO LEGENDS DAILY'), L, y)
    x.textAlign = 'right'; x.fillText(tr('FIM DE TEMPORADA', 'END OF SEASON'), R, y)
    y += 12
    x.strokeStyle = TINTA2; x.lineWidth = 2.5
    x.beginPath(); x.moveTo(L, y); x.lineTo(R, y); x.stroke()
    x.beginPath(); x.moveTo(L, y + 6); x.lineTo(R, y + 6); x.stroke()
    y += 58

    // ── MANCHETE (Oswald condensada, caixa alta, igual à tela)
    x.textAlign = 'left'; x.fillStyle = INK
    const hFont = `700 62px ${OSW}`
    for (const ln of wrap(hl.h.toUpperCase(), hFont, R - L)) { x.font = hFont; x.fillText(ln, L, y); y += 66 }
    y += 8

    // ── DECK (a linha de apoio, entre filetes)
    x.strokeStyle = '#665944'; x.lineWidth = 1.5
    x.beginPath(); x.moveTo(L, y); x.lineTo(R, y); x.stroke()
    y += 30
    x.fillStyle = TINTA2
    const sFont = `italic 400 21px ${SER}`
    const subTxt = meuEstadioNome() ? `${hl.s} ${tr('Direto do', 'Live from')} 🏟️ ${meuEstadioNome()}.` : hl.s
    for (const ln of wrap(subTxt, sFont, R - L)) { x.font = sFont; x.fillText(ln, L, y); y += 28 }
    y += 8
    x.strokeStyle = '#665944'; x.lineWidth = 2.5
    x.beginPath(); x.moveTo(L, y); x.lineTo(R, y); x.stroke()
    x.beginPath(); x.moveTo(L, y + 5); x.lineTo(R, y + 5); x.stroke()
    y += 30

    // ── AS MATÉRIAS (a peça nova da tela): foto grande + duas do lado
    const [imgLiga, imgCopa, imgArt] = await Promise.all([loadImg(ligaArtSrc), loadImg(copaArtSrc), loadImg(scorerArtSrc)])
    const campeao = tables[me.div]?.[0]?.name
    const artDiv = divTop[me.div]
    const gapS = 18
    const mainW = Math.round((R - L - gapS) * 0.63), sideW = R - L - gapS - mainW
    const mainH = Math.round(mainW * 2 / 3)
    // 🛡️ escudo numa PRANCHA creme (pedido do Diego 12/09: *"só senti falta do
    // escudo do time campeão da liga"* — sobre a arte escura ele sumia).
    const selo = async (nome: string, px: number, py: number, tam: number) => {
      const pad = Math.round(tam * 0.11), cx0 = px, cy0 = py
      const lado = tam + pad * 2
      x.fillStyle = PAPEL_A; x.fillRect(cx0, cy0 - lado, lado, lado)
      x.strokeStyle = TINTA2; x.lineWidth = 2.5; x.strokeRect(cx0, cy0 - lado, lado, lado)
      const e = await escudoImg(nome, tam * 2)
      if (e && e.naturalWidth) {
        const eh = tam, ew = Math.min(tam, eh * e.naturalWidth / e.naturalHeight)
        x.drawImage(e, cx0 + (lado - ew) / 2, cy0 - lado + (lado - eh) / 2, ew, eh)
      } else {
        x.textAlign = 'center'; x.fillStyle = INK; x.font = `700 ${Math.round(tam * 0.7)}px ${OSW}`
        x.fillText(nome.trim()[0]?.toUpperCase() ?? '?', cx0 + lado / 2, cy0 - lado / 2 + tam * 0.25)
        x.textAlign = 'left'
      }
    }
    const yStories = y
    if (imgLiga) drawCover(x, imgLiga, L, y, mainW, mainH)
    else { x.fillStyle = '#1B7A3D'; x.fillRect(L, y, mainW, mainH) }
    x.strokeStyle = '#74674e'; x.lineWidth = 1.5; x.strokeRect(L, y, mainW, mainH)
    if (campeao) await selo(campeao, L + 12, y + mainH - 12, 66)
    let my = y + mainH + 26
    x.textAlign = 'left'; x.fillStyle = TINTA3; x.font = `700 16px ${OSW}`
    x.fillText(`${tr('CAMPEÃO', 'CHAMPION')} · ${J_DIV_NAME[me.div].toUpperCase()}`, L, my)
    my += 42
    x.fillStyle = INK; x.font = `700 42px ${OSW}`
    x.fillText(cortar((campeao ?? me.team).toUpperCase(), `700 42px ${OSW}`, mainW), L, my)
    // coluna lateral
    const sx = L + mainW + gapS
    let sy = y
    const sideH = Math.round(sideW * 2 / 3)
    const miniMateria = async (titulo: string, img: HTMLImageElement | null, crest: string | null, legenda: string) => {
      x.textAlign = 'left'; x.fillStyle = INK; x.font = `700 24px ${OSW}`
      x.fillText(cortar(titulo.toUpperCase(), `700 24px ${OSW}`, sideW), sx, sy + 20)
      sy += 34
      if (img) drawCover(x, img, sx, sy, sideW, sideH)
      else { x.fillStyle = '#1B7A3D'; x.fillRect(sx, sy, sideW, sideH) }
      x.strokeStyle = '#74674e'; x.lineWidth = 1.5; x.strokeRect(sx, sy, sideW, sideH)
      if (crest) await selo(crest, sx + 8, sy + sideH - 8, 42)
      sy += sideH + 24
      x.fillStyle = INK; x.font = `700 17px ${SER}`
      x.fillText(cortar(legenda, `700 17px ${SER}`, sideW), sx, sy)
      sy += 26
    }
    if (copa?.champion) await miniMateria(brasil ? tr('O dono da Copa do Brasil', 'The Copa do Brasil winner') : tr('O dono da Copa', 'The Cup winner'), imgCopa, copa.champion.name, copa.champion.name)
    if (artDiv) await miniMateria(`${tr('Artilheiro', 'Top scorer')} · ${J_DIV_NAME[me.div]}`, imgArt, null, `${artDiv.name} · ${artDiv.goals} ${tr('gols', 'goals')}`)
    y = Math.max(my + 18, sy + 6)
    x.strokeStyle = '#74674e'; x.lineWidth = 2.5
    x.beginPath(); x.moveTo(L, y); x.lineTo(R, y); x.stroke()
    x.beginPath(); x.moveTo(L, y + 5); x.lineTo(R, y + 5); x.stroke()
    y += 30
    void yStories

    // ── NÚMEROS DO TIME: cinco caixinhas soltas, como na tela
    const nums: [string, string][] = [[tr('Posição', 'Place'), getLang() === 'en' ? ordinal(me.pos) : `${me.pos}º`]]
    if (mine) nums.push([tr('Pontos', 'Points'), String(mine.pts)], [tr('V · E · D', 'W · D · L'), `${mine.w}·${mine.d}·${mine.l}`],
      [tr('Gols (pró/contra)', 'Goals (for/against)'), `${mine.gf}/${mine.ga}`], [tr('Saldo', 'Diff'), `${mine.gf - mine.ga >= 0 ? '+' : ''}${mine.gf - mine.ga}`])
    const nGap = 10, nW = (R - L - nGap * (nums.length - 1)) / nums.length, nH = 76
    nums.forEach(([k, v], i) => {
      const px = L + i * (nW + nGap)
      x.fillStyle = '#fffdf6'; x.fillRect(px, y, nW, nH)
      x.strokeStyle = '#9f8b6b'; x.lineWidth = 1.5; x.strokeRect(px, y, nW, nH)
      x.textAlign = 'center'; x.fillStyle = INK; x.font = `700 30px ${OSW}`
      x.fillText(cortar(v, `700 30px ${OSW}`, nW - 12), px + nW / 2, y + 38)
      x.fillStyle = TINTA3; x.font = `700 14px ${OSW}`
      x.fillText(cortar(k, `700 14px ${OSW}`, nW - 8), px + nW / 2, y + 60)
    })
    y += nH + 34

    // ── OS DONOS DA TEMPORADA, em duas colunas (as "notas" do V22)
    x.textAlign = 'center'; x.fillStyle = INK; x.font = `700 38px ${OSW}`
    x.fillText(tr('Os donos da temporada', 'The season’s winners'), W / 2, y)
    y += 18
    const donos: { col: string; label: string; champ: string; isYou: boolean; art?: string }[] = []
    for (const d of J_DIVS) {
      const c = tables[d]?.[0]; const a = divTop[d]
      if (c) donos.push({ col: J_DIV_COLOR[d], label: J_DIV_NAME[d].toUpperCase(), champ: c.name, isYou: !!c.you, art: a ? `${a.name} (${a.teamName}), ${a.goals} ${tr('gols', 'goals')}` : undefined })
    }
    if (copa?.champion) donos.push({ col: brasil ? '#0EA658' : '#F5B301', label: brasil ? tr('COPA DO BRASIL', 'COPA DO BRASIL') : tr('COPA LEGENDS', 'LEGENDS CUP'), champ: copa.champion.name, isYou: !!copa.champion.you, art: copa.topScorer ? `${copa.topScorer.name} (${copa.topScorer.teamName}), ${copa.topScorer.goals} ${tr('gols', 'goals')}` : undefined })
    if (mundial) donos.push({ col: '#2563EB', label: tr('COPA DO MUNDO LEGENDS', 'LEGENDS WORLD CUP'), champ: mundial.selecao, isYou: !!mundial.voce, art: mundial.campeao })
    const cGap = 26, cW = (R - L - cGap) / 2, noteH = 106
    for (let i = 0; i < donos.length; i++) {
      const dn = donos[i]
      const px = L + (i % 2) * (cW + cGap)
      const py = y + Math.floor(i / 2) * noteH
      x.strokeStyle = '#9f8b6b'; x.lineWidth = 1
      x.beginPath(); x.moveTo(px, py); x.lineTo(px + cW, py); x.stroke()
      const ey = py + 16
      const e = await escudoImg(dn.champ, 88)
      if (e && e.naturalWidth) {
        const eh = 44, ew = Math.min(44, eh * e.naturalWidth / e.naturalHeight)
        x.drawImage(e, px + (44 - ew) / 2, ey, ew, eh)
      } else {
        x.fillStyle = dn.col; x.fillRect(px, ey, 44, 44)
        x.strokeStyle = INK; x.lineWidth = 2; x.strokeRect(px, ey, 44, 44)
        x.textAlign = 'center'; x.fillStyle = '#fff'; x.font = `700 22px ${OSW}`
        x.fillText(dn.champ.trim()[0]?.toUpperCase() ?? '?', px + 22, ey + 31)
      }
      const tx = px + 58, tw = cW - 58
      x.textAlign = 'left'; x.fillStyle = INK; x.font = `700 21px ${OSW}`
      const nome = cortar(dn.champ.toUpperCase(), `700 21px ${OSW}`, tw - (dn.isYou ? 74 : 84))
      x.fillText(nome, tx, ey + 20)
      const nw = x.measureText(nome).width
      if (dn.isYou) {
        x.fillStyle = INK; x.fillRect(tx + nw + 8, ey + 5, 54, 20)
        x.fillStyle = GOLD; x.font = `700 13px ${OSW}`; x.fillText(tr('VOCÊ', 'YOU'), tx + nw + 15, ey + 20)
      }
      x.fillStyle = TINTA3; x.font = `700 13px ${OSW}`
      x.fillText(`· ${dn.label}`, tx + nw + (dn.isYou ? 70 : 10), ey + 20)
      x.fillStyle = TINTA3; x.font = `400 14px ${SER}`
      x.fillText(tr('campeão da temporada', 'season champion'), tx, ey + 42)
      if (dn.art) {
        x.fillStyle = INK; x.font = `400 15px ${SER}`
        x.fillText(cortar(`${tr('Artilheiro', 'Top scorer')}: ${dn.art}`, `400 15px ${SER}`, tw), tx, ey + 66)
      }
    }
    y += Math.ceil(donos.length / 2) * noteH + 18

    // ── RODAPÉ do V22: filete duplo e o endereço, sem tarja
    x.strokeStyle = TINTA3; x.lineWidth = 2.5
    x.beginPath(); x.moveTo(L, y); x.lineTo(R, y); x.stroke()
    x.beginPath(); x.moveTo(L, y + 5); x.lineTo(R, y + 5); x.stroke()
    y += 40
    x.textAlign = 'center'; x.fillStyle = INK; x.font = `700 26px ${OSW}`
    x.fillText('🔨 leilaolegends.com', W / 2, y)
    y += 34

    // moldura do papel + corte na altura real
    const H = Math.min(MAXH, Math.round(y))
    const fin = document.createElement('canvas'); fin.width = W; fin.height = H
    const fx = fin.getContext('2d'); if (!fx) return null
    fx.drawImage(cv, 0, 0, W, H, 0, 0, W, H)
    fx.strokeStyle = '#8b785c'; fx.lineWidth = 2; fx.strokeRect(1, 1, W - 2, H - 2)
    fx.strokeStyle = PAPEL_B; fx.lineWidth = 8; fx.strokeRect(8, 8, W - 16, H - 16)
    return new Promise(res => fin.toBlob(b => res(b), 'image/png'))
  }

  async function share() {
    const txt = getLang() === 'en'
      ? `📰 "${hl.h}" — ${me.team}, ${ordinal(me.pos)} in ${J_DIV_NAME[me.div]} (S${seasonNo}). Come play too: leilaolegends.com`
      : `📰 "${hl.h}" — ${me.team}, ${me.pos}º na ${J_DIV_NAME[me.div]} (T${seasonNo}). Joga você também: leilaolegends.com`
    try {
      const blob = await buildJornalBlob()
      if (blob) {
        const file = new File([blob], 'o-martelo.png', { type: 'image/png' })
        const sd = { files: [file], title: 'O MARTELO', text: txt }
        if (navigator.canShare?.(sd)) { try { await navigator.share(sd) } catch { /* cancelou */ } return }
        // sem share de arquivo (ex.: desktop): baixa a imagem
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a'); a.href = url; a.download = 'o-martelo.png'; a.click()
        URL.revokeObjectURL(url)
        return
      }
      throw new Error('no-canvas')
    } catch {
      // último recurso: texto
      try {
        if (navigator.share) { await navigator.share({ text: txt }); return }
        await navigator.clipboard.writeText(txt); setCopied(true); setTimeout(() => setCopied(false), 2500)
      } catch { /* ignora */ }
    }
  }

  if (!open) return (
    <button onClick={() => setOpen(true)} style={{ width: '100%', border: `3px solid ${INK}`, borderRadius: 16, padding: '13px 12px', marginBottom: 12, background: '#F7F1DD', boxShadow: `4px 4px 0 0 ${INK}`, cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{ fontSize: 26 }}>📰</span>
      <span style={{ minWidth: 0 }}>
        <span style={{ display: 'block', fontWeight: 900, fontSize: 15, ...COND }}>O MARTELO — edição nº {seasonNo}</span>
        <span style={{ display: 'block', fontWeight: 700, fontSize: 11, color: 'rgba(0,0,0,.55)' }}>Saiu o jornal da temporada — leia a manchete 👀</span>
      </span>
      <span style={{ marginLeft: 'auto', fontWeight: 900, fontSize: 18 }}>›</span>
    </button>
  )

  return (
    <div className={privateVisual ? 'jornal-v22 ll34-career-jornal' : undefined} style={privateVisual ? undefined : { background: '#F7F1DD', border: `3px solid ${INK}`, boxShadow: `4px 4px 0 0 ${INK}`, borderRadius: 6, padding: '13px 13px 11px', marginBottom: 12, backgroundImage: 'repeating-linear-gradient(0deg, transparent 0 3px, rgba(0,0,0,.012) 3px 4px)' }}>
      {/* cabeçalho do jornal (a pág. 2 vira "Caderno 2 · Negócios") */}
      {privateVisual ? <header className="jv-masthead"><h1>O MARTELO</h1><p>TEMPORADA {seasonNo} · {J_DIV_NAME[me.div].toUpperCase()}</p><div><span>O DIÁRIO DO LEILÃO LEGENDS</span><span>{pk === 'agencia' ? 'NEGÓCIOS' : pk === 'eventos' ? 'BASTIDORES' : pk === 'memoria' ? 'MEMÓRIA' : 'FIM DE TEMPORADA'}</span></div></header> : <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `4px double ${INK}`, paddingBottom: 6 }}>
        <div style={{ ...SERIF, fontWeight: 900, fontSize: 26, letterSpacing: 1 }}>O <span style={{ color: '#B23A2A' }}>MARTELO</span></div>
        <div style={{ textAlign: 'right', fontSize: 8.5, fontWeight: 800, lineHeight: 1.35, color: '#3a3527' }}>EDIÇÃO Nº {seasonNo}<br />{pk === 'agencia' ? 'CADERNO 2 · NEGÓCIOS' : pk === 'eventos' ? 'CADERNO · BASTIDORES' : pk === 'memoria' ? 'CADERNO · MEMÓRIA' : `TEMPORADA ${seasonNo} · ${J_DIV_NAME[me.div].toUpperCase()}`}<br />PREÇO: 1 MOEDA</div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 8.5, fontWeight: 900, letterSpacing: 1.5, textTransform: 'uppercase', borderBottom: `1.5px solid ${INK}`, padding: '3px 1px', color: '#3a3527' }}>
        {pk === 'agencia' ? <><span>🕴️ CADERNO DO EMPRESÁRIO</span><span>SEUS AGENCIADOS</span></> : pk === 'eventos' ? <><span>📻 ACONTECEU NA TEMPORADA</span><span>OS BASTIDORES</span></> : pk === 'memoria' ? <><span>📼 O JORNAL LEMBRA</span><span>A HISTÓRIA DO CLUBE</span></> : <><span>⚽ O DIÁRIO DO LEILÃO LEGENDS</span><span>FIM DE TEMPORADA</span></>}
      </div>

      </>}
      {pk === 'memoria' && mem ? (
        <>
          {/* ── 📼 "O JORNAL LEMBRA": manchetes de HISTÓRIA, puxadas da crônica
              da carreira (careerCronica) — streaks, jejuns e marcos. A primeira
              manchete é a estrela; as outras entram na listinha. ── */}
          <h2 style={{ ...SERIF, fontWeight: 900, fontSize: 24, lineHeight: 1.05, margin: '9px 0 4px', letterSpacing: -0.5, color: INK }}>{mem[0].titulo.toUpperCase()}</h2>
          <p style={{ fontSize: 11.5, fontWeight: 700, fontStyle: 'italic', color: '#3a3527', margin: '0 0 9px', lineHeight: 1.3 }}>{mem[0].sub}</p>
          <div style={{ border: `2.5px solid ${INK}`, background: '#fff' }}>
            <div style={{ background: INK, color: GOLD, fontSize: 9.5, fontWeight: 900, letterSpacing: 2, padding: '4px 8px', textTransform: 'uppercase' }}>📼 O arquivo do jornal</div>
            {mem.map((n, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '7px 9px', borderTop: i > 0 ? '1.5px solid rgba(0,0,0,.12)' : 'none', background: i === 0 ? '#fdf6dd' : undefined }}>
                <div style={{ flex: 'none', width: 24, height: 24, borderRadius: 7, border: `2.5px solid ${INK}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, background: '#F7F1DD' }}>{n.ic}</div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 900, lineHeight: 1.15 }}>{n.titulo}</div>
                  <div style={{ fontSize: 9.5, fontWeight: 700, color: '#3a3527', marginTop: 1.5, lineHeight: 1.3 }}>{n.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : pk === 'eventos' && evs ? (
        <>
          {/* ── 🎭 "ACONTECEU NA TEMPORADA": os causos dos jogadores (eventos) ── */}
          <h2 style={{ ...SERIF, fontWeight: 900, fontSize: 24, lineHeight: 1.05, margin: '9px 0 4px', letterSpacing: -0.5, color: INK }}>{evs[0].titulo.toUpperCase()}</h2>
          <p style={{ fontSize: 11.5, fontWeight: 700, fontStyle: 'italic', color: '#3a3527', margin: '0 0 9px', lineHeight: 1.3 }}>O que rolou fora das quatro linhas nesta temporada — e como o técnico se virou.</p>
          <div style={{ border: `2.5px solid ${INK}`, background: '#fff' }}>
            <div style={{ background: INK, color: GOLD, fontSize: 9.5, fontWeight: 900, letterSpacing: 2, padding: '4px 8px', textTransform: 'uppercase' }}>📻 Aconteceu na temporada</div>
            {evs.map((n, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '7px 9px', borderTop: i > 0 ? '1.5px solid rgba(0,0,0,.12)' : 'none' }}>
                <div style={{ flex: 'none', width: 24, height: 24, borderRadius: 7, border: `2.5px solid ${INK}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, background: '#F7F1DD' }}>{n.ic}</div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 900, lineHeight: 1.15 }}>{n.titulo}</div>
                  <div style={{ fontSize: 9.5, fontWeight: 700, color: '#3a3527', marginTop: 1.5, lineHeight: 1.3 }}>{n.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : pk === 'agencia' && news && agManchete ? (
        <>
          {/* ── 🕴️ PÁGINA 2: Caderno do Empresário — SÓ emoção, sem moeda ── */}
          <h2 style={{ ...SERIF, fontWeight: 900, fontSize: 24, lineHeight: 1.05, margin: '9px 0 4px', letterSpacing: -0.5, color: INK }}>{agManchete.h}</h2>
          <p style={{ fontSize: 11.5, fontWeight: 700, fontStyle: 'italic', color: '#3a3527', margin: '0 0 9px', lineHeight: 1.3 }}>{agManchete.s}</p>
          <div style={{ border: `2.5px solid ${INK}`, background: '#fff' }}>
            <div style={{ background: INK, color: GOLD, fontSize: 9.5, fontWeight: 900, letterSpacing: 2, padding: '4px 8px', textTransform: 'uppercase' }}>🗞️ As manchetes dos seus agenciados</div>
            {news.map((n, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 9px', borderTop: i > 0 ? '1.5px solid rgba(0,0,0,.12)' : 'none', background: i === 0 ? '#fdf6dd' : undefined }}>
                <div style={{ flex: 'none', width: 24, height: 24, borderRadius: 7, border: `2.5px solid ${INK}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, background: GOLD }}>{n.ic}</div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 900, lineHeight: 1.1 }}>{n.titulo}</div>
                  <div style={{ fontSize: 9.5, fontWeight: 700, color: '#3a3527', marginTop: 1.5, lineHeight: 1.3 }}>{n.sub}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 10, border: `2.5px solid ${INK}`, background: 'linear-gradient(160deg,#1B7A3D,#14401f)', color: '#fff', padding: '9px 11px' }}>
            <div style={{ fontSize: 9.5, fontWeight: 900, letterSpacing: 2, textTransform: 'uppercase', color: 'rgba(255,255,255,.7)' }}>🕴️ Palavra do empresário</div>
            <div style={{ fontSize: 11, fontWeight: 700, fontStyle: 'italic', lineHeight: 1.5, marginTop: 4 }}>{agQuote} <b>— Você, pro Martelo</b></div>
          </div>
        </>
      ) : (
      <>
      {/* manchete (única pra cada uma das 80 posições) */}
      <h2 className={privateVisual ? 'jv-headline' : undefined} style={privateVisual ? undefined : { ...SERIF, fontWeight: 900, fontSize: 25, lineHeight: 1.02, margin: '9px 0 4px', letterSpacing: -0.5, color: INK }}>{hl.h}</h2>
      <p style={{ fontSize: 11.5, fontWeight: 700, fontStyle: 'italic', color: '#3a3527', margin: '0 0 9px', lineHeight: 1.3 }}>{hl.s}{meuEstadioNome() ? <> Direto do <b>🏟️ {meuEstadioNome()}</b>.</> : null}</p>

      {privateVisual && <CareerNewspaperStories champion={tables[me.div]?.[0]?.name} division={J_DIV_NAME[me.div]} cup={copa?.champion?.name} scorer={divTop[me.div]}/>}
      <div className={privateVisual ? 'll34-career-numbers' : undefined} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9 }}>
        {/* "foto" */}
        <div style={{ border: `2.5px solid ${INK}`, background: 'radial-gradient(circle at 50% 35%, #2ea457, #123f22)', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 108, overflow: 'hidden' }}>
          {stamp && <div style={{ position: 'absolute', top: 8, right: -16, transform: 'rotate(18deg)', border: `3px solid ${stamp.color}`, color: stamp.color, fontWeight: 900, fontSize: 11, letterSpacing: 2, padding: '2px 16px', borderRadius: 6, opacity: .9, background: 'rgba(247,241,221,.65)', ...COND }}>{stamp.txt}</div>}
          <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#F7F1DD', border: `3px solid ${INK}`, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}><Escudo nome={me.team} size={44} /></div>
          <div style={{ color: '#fff', fontWeight: 900, fontSize: 11, marginTop: 5, ...COND, textShadow: '1px 1px 0 rgba(0,0,0,.5)', maxWidth: '92%', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{me.team}</div>
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,.68)', color: '#fff', fontSize: 7.5, fontWeight: 700, padding: '2px 6px', fontStyle: 'italic' }}>{me.pos}º colocado da {J_DIV_NAME[me.div]} na temporada {seasonNo}.</div>
        </div>
        {/* números do time */}
        <div style={{ border: `2.5px solid ${INK}`, background: '#fff', alignSelf: 'start' }}>
          <div style={{ background: INK, color: '#fff', fontSize: 8.5, fontWeight: 900, letterSpacing: 1.5, padding: '3px 7px', textTransform: 'uppercase' }}>Os números do time</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10, fontWeight: 700 }}>
            <tbody>
              <tr><td style={{ padding: '3px 7px' }}>Posição</td><td style={{ padding: '3px 7px', textAlign: 'right', fontWeight: 900 }}>{me.pos}º</td></tr>
              {mine && <>
                <tr><td style={{ padding: '3px 7px', borderTop: '1px solid rgba(0,0,0,.12)' }}>Pontos</td><td style={{ padding: '3px 7px', textAlign: 'right', fontWeight: 900, borderTop: '1px solid rgba(0,0,0,.12)' }}>{mine.pts}</td></tr>
                <tr><td style={{ padding: '3px 7px', borderTop: '1px solid rgba(0,0,0,.12)' }}>V · E · D</td><td style={{ padding: '3px 7px', textAlign: 'right', fontWeight: 900, borderTop: '1px solid rgba(0,0,0,.12)' }}>{mine.w}·{mine.d}·{mine.l}</td></tr>
                <tr><td style={{ padding: '3px 7px', borderTop: '1px solid rgba(0,0,0,.12)' }}>Gols (pró/contra)</td><td style={{ padding: '3px 7px', textAlign: 'right', fontWeight: 900, borderTop: '1px solid rgba(0,0,0,.12)' }}>{mine.gf}/{mine.ga}</td></tr>
                <tr><td style={{ padding: '3px 7px', borderTop: '1px solid rgba(0,0,0,.12)' }}>Saldo</td><td style={{ padding: '3px 7px', textAlign: 'right', fontWeight: 900, borderTop: '1px solid rgba(0,0,0,.12)', color: mine.gf - mine.ga >= 0 ? '#1B7A3D' : '#B23A2A' }}>{mine.gf - mine.ga >= 0 ? '+' : ''}{mine.gf - mine.ga}</td></tr>
              </>}
            </tbody>
          </table>
        </div>
      </div>

      {/* 🏆 A SUA CAMPANHA NA COPA (Diego 16/08) — nota curta na capa contando
          até onde você foi. A Supercopa só entra se você jogou a final dela;
          quem não chegou lá não vê nada sobre ela. */}
      {(copaRun || superRun) && (
        <div style={{ border: `2.5px solid ${INK}`, background: '#fff', marginTop: 10 }}>
          <div style={{ background: brasil ? '#0EA658' : GOLD_HEX, color: brasil ? '#fff' : INK, fontSize: 9.5, fontWeight: 900, letterSpacing: 2, padding: '4px 8px', textTransform: 'uppercase' }}>{brasil ? '🏆🇧🇷 Sua campanha na Copa do Brasil' : '🏆 Sua campanha na Copa'}</div>
          {copaRun && (() => {
            const n = copaNota(copaRun, me.team, seasonNo, brasil)
            return (
              <div style={{ padding: '7px 9px' }}>
                <div style={{ ...SERIF, fontWeight: 900, fontSize: 14, lineHeight: 1.15, color: INK }}>{n.h}</div>
                <div style={{ fontSize: 10, fontWeight: 700, fontStyle: 'italic', color: '#3a3527', marginTop: 2, lineHeight: 1.35 }}>{n.s}</div>
              </div>
            )
          })()}
          {superRun && (() => {
            const n = superNota(superRun, me.team, seasonNo)
            return (
              <div style={{ padding: '7px 9px', borderTop: '1.5px solid rgba(0,0,0,.12)', background: '#EFF4FF' }}>
                <div style={{ fontSize: 8, fontWeight: 900, letterSpacing: 1, textTransform: 'uppercase', color: '#0D4FCC' }}>👑 Supercopa Legends</div>
                <div style={{ ...SERIF, fontWeight: 900, fontSize: 14, lineHeight: 1.15, color: INK, marginTop: 1 }}>{n.h}</div>
                <div style={{ fontSize: 10, fontWeight: 700, fontStyle: 'italic', color: '#3a3527', marginTop: 2, lineHeight: 1.35 }}>{n.s}</div>
              </div>
            )
          })()}
        </div>
      )}

      {/* os donos da temporada: campeão + artilheiro de CADA série (+ Copa) */}
      <div style={{ border: `2.5px solid ${INK}`, background: '#fff', marginTop: 10 }}>
        <div style={{ background: INK, color: GOLD, fontSize: 9.5, fontWeight: 900, letterSpacing: 2, padding: '4px 8px', textTransform: 'uppercase' }}>🏆 Os donos da temporada</div>
        {J_DIVS.map(d => {
          const champ = tables[d]?.[0]
          const art = divTop[d]
          const isYou = !!champ?.you
          return (
            <div key={d} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 9px 7px 0', borderTop: '1.5px solid rgba(0,0,0,.12)', background: isYou ? '#fdf6dd' : undefined }}>
              <div style={{ width: 5, alignSelf: 'stretch', flex: 'none', background: J_DIV_COLOR[d] }} />
              {champ
                ? <div style={{ flex: 'none', width: 24, height: 24, borderRadius: 7, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Escudo nome={champ.name} size={22} /></div>
                : <div style={{ flex: 'none', width: 24, height: 24, borderRadius: 7, border: `2.5px solid ${INK}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900, color: '#fff', background: J_DIV_COLOR[d], ...COND }}>{d}</div>}
              <div style={{ minWidth: 0 }}>
                {/* 🏷️ rótulo da série (Diego 05/08: "sem sabermos a série é de qual e qual" —
                    sumiu quando o quadradinho da letra virou escudo). Sempre visível agora. */}
                <div style={{ fontSize: 8, fontWeight: 900, letterSpacing: 1, textTransform: 'uppercase', color: J_DIV_COLOR[d] }}>{J_DIV_NAME[d]}</div>
                <div style={{ fontSize: 12, fontWeight: 900, lineHeight: 1.1 }}>{champ?.name ?? '—'} <span style={{ fontSize: 8, fontWeight: 900, letterSpacing: 1, textTransform: 'uppercase', color: isYou ? '#b98600' : '#8a8266', marginLeft: 3 }}>campeão{isYou ? ' ⭐ você' : ''}</span></div>
                {art && <div style={{ fontSize: 9.5, fontWeight: 700, color: '#3a3527', marginTop: 1.5 }}>⚽ Artilheiro: <b>{art.name}</b> ({art.teamName}) · {art.goals} gols</div>}
              </div>
            </div>
          )
        })}
        {copa?.champion && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 9px 7px 0', borderTop: '1.5px solid rgba(0,0,0,.12)', background: copa.champion.you ? '#fdf6dd' : undefined }}>
            <div style={{ width: 5, alignSelf: 'stretch', flex: 'none', background: brasil ? '#0EA658' : '#F5B301' }} />
            <div style={{ flex: 'none', width: 24, height: 24, borderRadius: 7, border: `2.5px solid ${INK}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, background: brasil ? '#0EA658' : '#F5B301' }}>🏆</div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 8, fontWeight: 900, letterSpacing: 1, textTransform: 'uppercase', color: brasil ? '#0a6b3c' : '#b98600' }}>{brasil ? '🏆🇧🇷 Copa do Brasil Legends' : '🏆 Copa Legends'}</div>
              <div style={{ fontSize: 12, fontWeight: 900, lineHeight: 1.1 }}>{copa.champion.name} <span style={{ fontSize: 8, fontWeight: 900, letterSpacing: 1, textTransform: 'uppercase', color: copa.champion.you ? '#b98600' : '#8a8266', marginLeft: 3 }}>campeão da Copa{copa.champion.you ? ' ⭐ você' : ''}</span></div>
              {copa.topScorer && <div style={{ fontSize: 9.5, fontWeight: 700, color: '#3a3527', marginTop: 1.5 }}>⚽ Artilheiro da Copa: <b>{copa.topScorer.name}</b> ({copa.topScorer.teamName}) · {copa.topScorer.goals} gols</div>}
            </div>
          </div>
        )}
        {/* 👑 SUPERCOPA LEGENDS: campeão da Liga × campeão da Copa do Brasil.
            Só aparece nas temporadas em que ela rolou (Diego 16/08). */}
        {superChamp && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 9px 7px 0', borderTop: '1.5px solid rgba(0,0,0,.12)', background: superChamp.you ? '#fdf6dd' : undefined }}>
            <div style={{ width: 5, alignSelf: 'stretch', flex: 'none', background: '#0D4FCC' }} />
            <div style={{ flex: 'none', width: 24, height: 24, borderRadius: 7, border: `2.5px solid ${INK}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, background: '#0D4FCC' }}>👑</div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 8, fontWeight: 900, letterSpacing: 1, textTransform: 'uppercase', color: '#0D4FCC' }}>👑 Supercopa Legends</div>
              <div style={{ fontSize: 12, fontWeight: 900, lineHeight: 1.1 }}>{superChamp.name} <span style={{ fontSize: 8, fontWeight: 900, letterSpacing: 1, textTransform: 'uppercase', color: superChamp.you ? '#b98600' : '#8a8266', marginLeft: 3 }}>campeão da Supercopa{superChamp.you ? ' ⭐ você' : ''}</span></div>
              <div style={{ fontSize: 9.5, fontWeight: 700, color: '#3a3527', marginTop: 1.5 }}>Jogo único contra o <b>{superChamp.vs}</b>.</div>
            </div>
          </div>
        )}
        {/* 🌍 Copa do Mundo Legends: só aparece na temporada em que ela ACONTECE E termina
            (a cada 10 temporadas) — não é da liga/Copa Legends, é seleção nacional. */}
        {mundial && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 9px 7px 0', borderTop: '1.5px solid rgba(0,0,0,.12)', background: mundial.voce ? '#fdf6dd' : undefined }}>
            <div style={{ width: 5, alignSelf: 'stretch', flex: 'none', background: '#2563EB' }} />
            <div style={{ flex: 'none', width: 24, height: 24, borderRadius: 7, border: `2.5px solid ${INK}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, background: '#2563EB' }}>🌍</div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 8, fontWeight: 900, letterSpacing: 1, textTransform: 'uppercase', color: '#2563EB' }}>🌍 Copa do Mundo Legends</div>
              <div style={{ fontSize: 12, fontWeight: 900, lineHeight: 1.1 }}>{mundial.selecao} <span style={{ fontSize: 8, fontWeight: 900, letterSpacing: 1, textTransform: 'uppercase', color: mundial.voce ? '#b98600' : '#8a8266', marginLeft: 3 }}>campeã do mundo{mundial.voce ? ' ⭐ você' : ''}</span></div>
              <div style={{ fontSize: 9.5, fontWeight: 700, color: '#3a3527', marginTop: 1.5 }}>{mundial.campeao}</div>
            </div>
          </div>
        )}
      </div>

      </>
      )}

      {/* 📄 rodapé de páginas: barrinha dos 5s (na capa) + bolinhas pra ir/voltar.
          Só aparece quando a temporada teve notícia de agenciado. */}
      {pags.length > 1 && (
        <>
          {pk === 'capa' && news && !flippedRef.current && (
            <div style={{ height: 5, border: `1.5px solid ${INK}`, borderRadius: 99, overflow: 'hidden', background: '#fff', marginTop: 9 }}>
              <div style={{ height: '100%', background: GOLD, width: barGo ? '100%' : '0%', transition: 'width 5s linear' }} />
            </div>
          )}
          <button onClick={() => virar((pags.indexOf(pk) + 1) % pags.length)} style={{ width: '100%', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 8, padding: 0 }}>
            {pags.map(p => <span key={p} style={{ width: 8, height: 8, borderRadius: 999, border: `2px solid ${INK}`, background: p === pk ? INK : 'transparent' }} />)}
            <span style={{ fontSize: 9, fontWeight: 800, color: '#3a3527' }}>{(() => {
              const next = pags[(pags.indexOf(pk) + 1) % pags.length]
              if (next === 'capa') return 'toque pra voltar à capa'
              if (next === 'agencia') return pk === 'capa' && news && !flippedRef.current ? 'vira sozinho em 5s · toque pra virar já' : 'toque pra ver o Caderno do Empresário 🕴️'
              if (next === 'memoria') return 'toque pra ver O Jornal Lembra 📼'
              return 'toque pra ver o Aconteceu na temporada 📻'
            })()}</span>
          </button>
        </>
      )}

      {/* rodapé: compartilhar + fechar */}
      <div style={{ display: 'flex', gap: 8, marginTop: 11 }}>
        <button onClick={share} style={{ flex: 1, background: '#1faa54', color: '#fff', border: `3px solid ${INK}`, borderRadius: 11, padding: 9, fontWeight: 900, fontSize: 13, ...COND, cursor: 'pointer', boxShadow: `3px 3px 0 0 ${INK}` }}>{copied ? tr('✅ Copiado!', '✅ Copied!') : tr('📲 Mandar no grupo', '📲 Send to the group')}</button>
        <button onClick={() => setOpen(false)} style={{ flex: 'none', background: '#fff', color: INK, border: `3px solid ${INK}`, borderRadius: 11, padding: '9px 14px', fontWeight: 900, fontSize: 13, ...COND, cursor: 'pointer' }}>{tr('Fechar', 'Close')}</button>
      </div>
    </div>
  )
}

// ─── 📤 COMPARTILHAR ELENCO: a arte 1080px aprovada no mockup ────────────────
// A tela do jogo não muda — isto gera a IMAGEM (header na cor do time + campinho
// padrão + listas com gols/valor + rodapé dourado) e abre o compartilhar nativo.
export type ElencoPlayerRow = { pos: string; name: string; goals: number; paid: number; club?: string; year?: number }
export type ElencoShareOpts = {
  teamName: string; divName: string; tablePos: number; seasonNo: number; formation: string
  titles: number; squadValue: number; coins: number; color: string
  // 🎨 manto do tier de apoio (apoio.tsx): degradê CSS + intensidade do brilho.
  // Presente → topo e listas ganham o MESMO manto da aba Elenco (fidelidade de
  // tier: ouro brilha na arte também). Ausente → cor chapada de sempre.
  tierGrad?: string; tierHolo?: number
  fieldRows: { pos: string; name: string; goals: number; club?: string; year?: number }[][] // ATA/MEI/DEF/GOL
  // 🛡️ nome LIMPO do clube (sem o selo de apoio) — é a chave do escudo e da mascote
  teamRaw?: string
  // 🧑 mostrar o ROSTO das lendas? Quem manda é a TELA: o botão lê a mesma trava
  // do campinho (`useOnlinePreview`) e passa aqui. Antes esta função consultava a
  // trava sozinha, e como ela é preenchida DEPOIS (o aviso do login chega
  // assíncrono), a arte podia sair com bolinha mesmo pra quem vê rosto na tela.
  rostos?: boolean
  // 👕 manto do clube (as 2 cores medidas na arte do dono). Presente → o topo e a
  // faixa de cada campinho saem listrados igual à tela, e a bolinha de quem não
  // tem rosto leva o manto. Ausente → cor chapada do time, como era.
  manto?: [string, string] | null
  titulares: ElencoPlayerRow[]; reservas: ElencoPlayerRow[]
}
// degradê CSS do tier → paradas de gradiente de canvas (só hex + % opcional)
function gradStops(css: string): { p: number; c: string }[] {
  const m = [...css.matchAll(/(#[0-9A-Fa-f]{6})(?:\s+(\d+)%)?/g)].map(x0 => ({ c: x0[1], p: x0[2] ? +x0[2] / 100 : -1 }))
  if (!m.length) return []
  if (m[0].p < 0) m[0].p = 0
  if (m[m.length - 1].p < 0) m[m.length - 1].p = 1
  for (let i = 1; i < m.length - 1; i++) if (m[i].p < 0) m[i].p = (m[i - 1].p + m[i + 1].p) / 2
  return m
}
function fillTier(x: CanvasRenderingContext2D, css: string, px: number, py: number, w: number, h: number) {
  const g = x.createLinearGradient(px, py, px + w * 0.34, py + h)
  for (const s of gradStops(css)) g.addColorStop(s.p, s.c)
  x.fillStyle = g; x.fillRect(px, py, w, h)
}
// manto claro (ouro/prata) pede texto escuro; roxo/verde seguem com texto branco
function tierIsLight(css: string): boolean {
  const s = gradStops(css); if (!s.length) return false
  const c = s[Math.floor(s.length / 2)].c
  const r = parseInt(c.slice(1, 3), 16), g = parseInt(c.slice(3, 5), 16), b = parseInt(c.slice(5, 7), 16)
  return 0.299 * r + 0.587 * g + 0.114 * b > 150
}
// varredura de brilho (a "holo" da carta), congelada na arte: uma faixa clara
// diagonal dentro do retângulo. `at` = onde a faixa cai (0..1 da largura).
function sheenRect(x: CanvasRenderingContext2D, px: number, py: number, w: number, h: number, at: number, holo: number) {
  if (holo <= 0) return
  x.save(); x.beginPath(); x.rect(px, py, w, h); x.clip()
  x.transform(1, 0, -0.28, 1, 0, 0)
  const bx = px + w * at + 0.28 * (py + h / 2)
  const g = x.createLinearGradient(bx, 0, bx + 130, 0)
  g.addColorStop(0, 'rgba(255,255,255,0)')
  g.addColorStop(0.5, `rgba(255,255,255,${0.55 * holo})`)
  g.addColorStop(1, 'rgba(255,255,255,0)')
  x.fillStyle = g; x.fillRect(bx - 20, py - 40, 170, h + 80)
  x.restore()
}
function rr(x: CanvasRenderingContext2D, px: number, py: number, w: number, h: number, r: number) {
  x.beginPath()
  x.moveTo(px + r, py); x.lineTo(px + w - r, py); x.arcTo(px + w, py, px + w, py + r, r)
  x.lineTo(px + w, py + h - r); x.arcTo(px + w, py + h, px + w - r, py + h, r)
  x.lineTo(px + r, py + h); x.arcTo(px, py + h, px, py + h - r, r)
  x.lineTo(px, py + r); x.arcTo(px, py, px + r, py, r); x.closePath()
}
function cut(x: CanvasRenderingContext2D, t: string, maxW: number): string {
  if (x.measureText(t).width <= maxW) return t
  let s = t
  while (s.length > 2 && x.measureText(s + '…').width > maxW) s = s.slice(0, -1)
  return s + '…'
}
// 🖼️ A IMAGEM DO ELENCO = O CAMPINHO QUE ESTÁ NA TELA.
// Reescrita em 12/09, mesmo motivo do jornal: a tela mudou e a imagem ficou pra
// trás. No campinho de hoje o jogador está SOLTO na grama (decisão do Diego em
// 19/08: *"o jogador é ele LIVRE"*), com o rosto quando existe e a bolinha no
// MANTO do clube quando não existe, mais o nome, o clube/ano, o selo de gols, a
// faixa do manto com o título e a placa do patrocinador atrás do gol. A imagem
// desenhava fichinha branca com o nome escrito. Agora ela copia a tela.
export async function buildElencoBlob(o: ElencoShareOpts): Promise<Blob | null> {
  const W = 1080, MAXH = 2600
  const cv = document.createElement('canvas'); cv.width = W; cv.height = MAXH
  const x = cv.getContext('2d'); if (!x) return null
  try { await document.fonts.load('900 60px Oswald') } catch { /* segue */ }
  const OSW = 'Oswald, sans-serif', ARI = 'Arial, sans-serif'
  const manto = o.manto ?? null
  const tier = o.tierGrad
  const claro = tier ? tierIsLight(tier) : false
  // 🎽 listras do manto (as mesmas 2 cores medidas na arte do dono)
  const listras = (px: number, py: number, w: number, h: number, passo: number) => {
    if (!manto) { if (tier) fillTier(x, tier, px, py, w, h); else { x.fillStyle = o.color; x.fillRect(px, py, w, h) } ; return }
    x.save(); x.beginPath(); x.rect(px, py, w, h); x.clip()
    x.fillStyle = manto[1]; x.fillRect(px, py, w, h)
    x.fillStyle = manto[0]
    for (let i = -h; i < w + h; i += passo * 2) { x.beginPath(); x.moveTo(px + i, py + h); x.lineTo(px + i + h * 0.45, py); x.lineTo(px + i + h * 0.45 + passo, py); x.lineTo(px + i + passo, py + h); x.closePath(); x.fill() }
    x.restore()
  }
  const veu = (px: number, py: number, w: number, h: number, a = 0.78) => {
    const g = x.createLinearGradient(px, py, px + w, py)
    g.addColorStop(0, `rgba(0,0,0,${a})`); g.addColorStop(0.58, `rgba(0,0,0,${a})`); g.addColorStop(1, `rgba(0,0,0,${a * 0.4})`)
    x.fillStyle = g; x.fillRect(px, py, w, h)
  }
  const cortar = (t: string, font: string, maxW: number): string => {
    x.font = font; let r = t
    while (x.measureText(r).width > maxW && r.length > 2) r = r.slice(0, -1)
    return r === t ? t : r + '…'
  }
  const rrf = (px: number, py: number, w: number, h: number, r: number) => { rr(x, px, py, w, h, r) }

  // ── CABEÇALHO: manto listrado + véu + escudo + nome + pílulas
  const HEAD = 268
  listras(0, 0, W, HEAD, 26)
  if (manto) veu(0, 0, W, HEAD)
  if (tier && !manto) sheenRect(x, 0, 0, W, HEAD, 0.62, o.tierHolo ?? 0)
  const escCor = manto ? '#fff' : (claro ? INK : '#fff')
  const esc = await escudoImg(o.teamRaw ?? o.teamName, 200)
  let tx0 = 44
  if (esc && esc.naturalWidth) {
    const eh = 118, ew = Math.min(130, eh * esc.naturalWidth / esc.naturalHeight)
    x.save(); x.shadowColor = 'rgba(0,0,0,.55)'; x.shadowOffsetX = 3; x.shadowOffsetY = 3
    x.drawImage(esc, 44, 34, ew, eh); x.restore()
    tx0 = 44 + ew + 22
  }
  x.textAlign = 'left'
  x.fillStyle = manto ? GOLD_HEX : (claro ? 'rgba(0,0,0,0.60)' : GOLD_HEX); x.font = `800 25px ${OSW}`
  x.fillText(tr('🔨 LEILÃO LEGENDS · MEU ELENCO', '🔨 LEILÃO LEGENDS · MY SQUAD'), tx0, 60)
  x.fillStyle = escCor; x.font = `900 60px ${OSW}`
  x.fillText(cortar(o.teamName, `900 60px ${OSW}`, W - tx0 - 44), tx0, 122)
  x.fillStyle = manto ? 'rgba(255,255,255,0.9)' : (claro ? 'rgba(0,0,0,0.65)' : 'rgba(255,255,255,0.85)'); x.font = `800 25px ${ARI}`
  x.fillText(`${o.divName} · ${getLang() === 'en' ? ordinal(o.tablePos) : `${o.tablePos}º lugar`} · ${tr('Temporada', 'Season')} ${o.seasonNo} · ${o.formation}`, tx0, 164)
  const chips = [
    `🏆 ${o.titles} ${o.titles === 1 ? tr('título', 'title') : tr('títulos', 'titles')}`,
    `🏷️ ${tr('Elenco vale', 'Squad worth')} ${o.squadValue} 💵`,
    `🪙 ${tr('Caixa', 'Cash')}: ${o.coins}`,
  ]
  let cx = 44
  x.font = `800 24px ${OSW}`
  for (const c of chips) {
    const w = x.measureText(c).width + 32
    x.fillStyle = 'rgba(0,0,0,0.55)'; rrf(cx, 196, w, 44, 12); x.fill()
    x.strokeStyle = GOLD_HEX; x.lineWidth = 2.5; rrf(cx, 196, w, 44, 12); x.stroke()
    x.fillStyle = GOLD_HEX; x.fillText(c, cx + 16, 226)
    cx += w + 13
  }
  x.fillStyle = INK; x.fillRect(0, HEAD - 6, W, 6)
  let y = HEAD

  // ── um CAMPINHO (faixa do manto + grama + jogadores soltos + placa)
  const rostoOn = o.rostos ?? (LEGEND_AVATARS_RELEASED || onlinePreviewEnabled())
  type Cd = { pos: string; name: string; goals: number; club?: string; year?: number }
  const campinho = async (linhas: Cd[][], titulo: string, alt: number) => {
    const BAR = 50
    listras(0, y, W, BAR, 18)
    if (manto) veu(0, y, W, BAR, 0.62)
    x.textAlign = 'center'; x.fillStyle = '#fff'; x.font = `900 23px ${OSW}`
    x.save(); x.shadowColor = 'rgba(0,0,0,.9)'; x.shadowOffsetX = 1; x.shadowOffsetY = 1
    x.fillText(titulo.toUpperCase(), W / 2, y + 33); x.restore()
    x.fillStyle = INK; x.fillRect(0, y + BAR - 4, W, 4)
    y += BAR
    const linhaH = alt + 92
    const gramaH = linhas.length * linhaH + 20
    for (let i = 0; i * 46 < gramaH; i++) { x.fillStyle = i % 2 ? '#27793F' : '#2E8B4E'; x.fillRect(0, y + i * 46, W, Math.min(46, gramaH - i * 46)) }
    let ly = y + 16
    for (const linha of linhas) {
      const larg = Math.min(190, (W - 40) / Math.max(linha.length, 1))
      const total = linha.length * larg
      let px = (W - total) / 2
      for (const c of linha) {
        const meio = px + larg / 2
        const art = rostoOn ? avatarLote1(c.name, c.club, c.year) : null
        const foto = art ? `${import.meta.env.BASE_URL}${art.src.slice(1)}` : fotoDoJogador(c.name)
        const img = foto ? await loadImg(foto) : null
        if (img && img.naturalWidth) {
          const ih = alt, iw = ih * img.naturalWidth / img.naturalHeight
          x.save(); x.shadowColor = 'rgba(0,0,0,.45)'; x.shadowOffsetX = 2; x.shadowOffsetY = 3
          x.drawImage(img, meio - iw / 2, ly, iw, ih); x.restore()
        } else {
          const d = Math.round(alt * 0.72), cy0 = ly + alt - d
          x.save(); x.beginPath(); x.arc(meio, cy0 + d / 2, d / 2, 0, Math.PI * 2); x.clip()
          listras(meio - d / 2, cy0, d, d, 7)
          // 🔎 véu por dentro da bolinha: sobre listra clara a posição sumia
          x.fillStyle = 'rgba(0,0,0,.42)'; x.fillRect(meio - d / 2, cy0, d, d)
          x.restore()
          x.beginPath(); x.arc(meio, cy0 + d / 2, d / 2, 0, Math.PI * 2)
          x.strokeStyle = INK; x.lineWidth = 4; x.stroke()
          x.textAlign = 'center'; x.fillStyle = '#fff'; x.font = `900 ${Math.round(d * 0.3)}px ${OSW}`
          x.save(); x.shadowColor = 'rgba(0,0,0,.9)'; x.shadowOffsetX = 1; x.shadowOffsetY = 1
          x.fillText(c.pos, meio, cy0 + d / 2 + d * 0.1); x.restore()
        }
        let ty = ly + alt + 26
        x.textAlign = 'center'
        x.save(); x.shadowColor = 'rgba(0,0,0,.75)'; x.shadowOffsetX = 1; x.shadowOffsetY = 1
        x.fillStyle = '#fff'; x.font = `900 24px ${OSW}`
        x.fillText(cortar(c.name, `900 24px ${OSW}`, larg - 8), meio, ty)
        if (c.club) {
          ty += 22
          x.fillStyle = 'rgba(255,255,255,.85)'; x.font = `700 16px ${ARI}`
          x.fillText(cortar(`${c.club}${c.year ? ` · ${c.year}` : ''}`, `700 16px ${ARI}`, larg - 6), meio, ty)
        }
        x.restore()
        if (c.goals > 0) {
          const lbl = `⚽ ${c.goals}`
          x.font = `900 17px ${OSW}`
          const w = x.measureText(lbl).width + 22
          x.fillStyle = GOLD; rrf(meio - w / 2, ty + 9, w, 28, 14); x.fill()
          x.strokeStyle = INK; x.lineWidth = 2.5; rrf(meio - w / 2, ty + 9, w, 28, 14); x.stroke()
          x.fillStyle = INK; x.textAlign = 'center'; x.fillText(lbl, meio, ty + 29)
        }
        px += larg
      }
      ly += linhaH
    }
    y += gramaH
    // 🪧 placa do patrocinador atrás do gol
    x.fillStyle = '#fff'; x.fillRect(0, y, W, 48)
    x.fillStyle = INK; x.fillRect(0, y, W, 4)
    const logo = await loadImg(VADICO_LOGO)
    if (logo && logo.naturalWidth) {
      const lh = 26, lw = lh * logo.naturalWidth / logo.naturalHeight
      x.drawImage(logo, W / 2 - lw / 2, y + 11, lw, lh)
    }
    y += 48
  }

  await campinho(o.fieldRows, tr('⭐ Titulares', '⭐ Starting XI'), 100)
  if (o.reservas.length) {
    const banco: Cd[][] = []
    for (let i = 0; i < o.reservas.length; i += 4) banco.push(o.reservas.slice(i, i + 4).map(r => ({ pos: r.pos, name: r.name, goals: r.goals, club: r.club, year: r.year })))
    await campinho(banco, tr('🔁 Reservas', '🔁 Subs'), 78)
  }

  // ── RODAPÉ dourado com a mascote do clube
  const FOOT = 124
  x.fillStyle = GOLD_HEX; x.fillRect(0, y, W, FOOT)
  x.fillStyle = INK; x.fillRect(0, y, W, 6)
  const masc = await mascoteImg(o.teamRaw ?? o.teamName, 220)
  let fcx = W / 2
  if (masc && masc.naturalWidth) {
    const mh = 104, mw = mh * masc.naturalWidth / masc.naturalHeight
    x.drawImage(masc, 30, y + 12, mw, mh)
    fcx = 30 + mw + (W - 30 - mw) / 2
  }
  x.textAlign = 'center'
  x.fillStyle = INK; x.font = `900 31px ${OSW}`
  x.fillText(tr('mostra teu elenco e marca a gente! 📲 @leilaolegendscom', 'show off your squad and tag us! 📲 @leilaolegendscom'), fcx, y + 58)
  x.fillStyle = 'rgba(0,0,0,0.6)'; x.font = `800 22px ${ARI}`
  x.fillText(tr('monta o teu de graça em leilaolegends.com 🔨', 'build yours for free at leilaolegends.com 🔨'), fcx, y + 94)
  y += FOOT

  const H = Math.min(MAXH, Math.round(y))
  const fin = document.createElement('canvas'); fin.width = W; fin.height = H
  const fx = fin.getContext('2d'); if (!fx) return null
  fx.drawImage(cv, 0, 0, W, H, 0, 0, W, H)
  return new Promise(res => fin.toBlob(b => res(b), 'image/png'))
}
export async function shareElenco(o: ElencoShareOpts) {
  const blob = await buildElencoBlob(o)
  const txt = `Meu elenco no Leilão Legends: ${o.teamName} (${o.divName}) 🔨 Monta o teu: https://leilaolegends.com`
  if (blob) {
    const file = new File([blob], 'meu-elenco.png', { type: 'image/png' })
    const sd = { files: [file], title: 'Meu elenco — Leilão Legends', text: txt }
    if (navigator.canShare?.(sd)) { try { await navigator.share(sd) } catch { /* cancelou */ } return }
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'meu-elenco.png'; a.click()
    setTimeout(() => URL.revokeObjectURL(url), 4000)
    return
  }
  try { if (navigator.share) await navigator.share({ text: txt }) } catch { /* cancelou */ }
}

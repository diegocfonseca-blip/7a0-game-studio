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
export interface SuperRun { campeao: boolean; vs: string; placar: string; pens?: [number, number] }
function copaNota(run: CopaRun, nome: string, seasonNo: number, brasil?: boolean): { h: string; s: string } {
  const cup = brasil ? 'Copa do Brasil' : 'Copa Legends'
  const pick = <T,>(arr: T[]): T => arr[seasonNo % arr.length]
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
  const pen = run.pens ? ` (pênaltis ${run.pens[0]}×${run.pens[1]})` : ''
  if (run.campeao) return pick([
    { h: `👑 ${nome} LEVANTA A SUPERCOPA!`, s: `Bateu o ${run.vs} por ${run.placar}${pen} no jogo único e fechou o ano com mais uma na estante.` },
    { h: `👑 SUPERCOPA É DO ${nome}`, s: `Decisão em jogo único contra o ${run.vs}: ${run.placar}${pen}. Coroou a temporada.` },
  ])
  return pick([
    { h: `😤 ${nome} PERDE A SUPERCOPA`, s: `O ${run.vs} venceu por ${run.placar}${pen} na decisão. Faltou pouco pro ano perfeito.` },
    { h: `😤 SUPERCOPA ESCAPA DAS MÃOS DO ${nome}`, s: `Derrota pro ${run.vs} (${run.placar}${pen}) no jogo que valia tudo.` },
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

export function seasonHeadline(div: Div, pos: number, team: string): Headline {
  const raw = HEADLINES[div][Math.min(19, Math.max(0, pos - 1))]
  return { h: raw.h.replace('{t}', team.toUpperCase()), s: raw.s.replace('{t}', team) }
}

// 🕴️ notícia do CADERNO DO EMPRESÁRIO (página 2 — Agência 2.0, carreira nova):
// só emoção, SEM moeda (decisão do Diego) — a grana aparece na Cerimônia/aba.
export type AgNews = { ic: string; titulo: string; sub: string }

// ─── a capa ──────────────────────────────────────────────────────────────
export function SeasonJornal({ me, tables, copa, divTop, seasonNo, agenciaNews, eventos, mundial, brasil, copaRun, superRun, superChamp }: {
  me: { div: Div; pos: number; team: string }
  tables: Record<Div, SimTeam[]>
  copa: CopaResult | null
  divTop: Record<Div, SeasonScorer | undefined>
  seasonNo: number
  agenciaNews?: AgNews[]
  eventos?: AgNews[] // 🎭 manchetes dos EVENTOS DE JOGADOR — página "Aconteceu na temporada"
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
  const pags: ('capa' | 'agencia' | 'eventos')[] = ['capa', ...(news ? ['agencia' as const] : []), ...(evs ? ['eventos' as const] : [])]
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
  async function buildJornalBlob(): Promise<Blob | null> {
    const W = 1080, H = 1560
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H
    const x = cv.getContext('2d'); if (!x) return null
    try { await document.fonts.load('900 60px Oswald') } catch { /* segue */ }
    const SER = "Georgia, 'Times New Roman', serif", OSW = 'Oswald, sans-serif'
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
    // papel
    x.fillStyle = '#F7F1DD'; x.fillRect(0, 0, W, H)
    x.strokeStyle = INK; x.lineWidth = 6; x.strokeRect(12, 12, W - 24, H - 24)
    const L = 52, R = W - 52
    let y = 108
    // masthead
    x.textAlign = 'left'; x.font = `900 64px ${SER}`
    x.fillStyle = INK; x.fillText('O ', L, y)
    x.fillStyle = '#B23A2A'; x.fillText('MARTELO', L + x.measureText('O ').width, y)
    x.textAlign = 'right'; x.fillStyle = '#3a3527'; x.font = `800 20px ${OSW}`
    x.fillText(`EDIÇÃO Nº ${seasonNo} · TEMPORADA ${seasonNo}`, R, y - 30)
    x.fillText(`${J_DIV_NAME[me.div].toUpperCase()} · PREÇO: 1 MOEDA`, R, y - 4)
    y += 20
    x.lineWidth = 3; x.beginPath(); x.moveTo(L, y); x.lineTo(R, y); x.stroke()
    x.beginPath(); x.moveTo(L, y + 7); x.lineTo(R, y + 7); x.stroke()
    y += 40
    x.textAlign = 'left'; x.font = `900 21px ${OSW}`; x.fillStyle = '#3a3527'
    x.fillText('⚽ O DIÁRIO DO LEILÃO LEGENDS', L, y)
    x.textAlign = 'right'; x.fillText('FIM DE TEMPORADA', R, y)
    y += 14
    x.lineWidth = 1.5; x.beginPath(); x.moveTo(L, y); x.lineTo(R, y); x.stroke()
    // manchete
    y += 62
    x.textAlign = 'left'; x.fillStyle = INK
    const hFont = `900 58px ${SER}`
    for (const ln of wrap(hl.h, hFont, R - L)) { x.font = hFont; x.fillText(ln, L, y); y += 62 }
    y += 4
    x.fillStyle = '#3a3527'
    const sFont = `italic 700 27px ${SER}`
    const subTxt = meuEstadioNome() ? `${hl.s} Direto do 🏟️ ${meuEstadioNome()}.` : hl.s
    for (const ln of wrap(subTxt, sFont, R - L)) { x.font = sFont; x.fillText(ln, L, y); y += 34 }
    y += 18
    // foto (esq) + números (dir)
    const boxH = 330, colW = (R - L - 24) / 2
    const g = x.createLinearGradient(L, y, L, y + boxH)
    g.addColorStop(0, '#2ea457'); g.addColorStop(1, '#123f22')
    x.fillStyle = g; x.fillRect(L, y, colW, boxH)
    x.lineWidth = 4; x.strokeStyle = INK; x.strokeRect(L, y, colW, boxH)
    const cx = L + colW / 2
    x.beginPath(); x.arc(cx, y + 128, 62, 0, Math.PI * 2); x.fillStyle = '#F7F1DD'; x.fill(); x.strokeStyle = INK; x.lineWidth = 5; x.stroke()
    // 🛡️ brasão de verdade (a logo do time). Save antigo sem rede/logo cai na letra.
    const escFoto = await escudoImg(me.team, 120)
    if (escFoto && escFoto.naturalWidth) {
      const eh = 104, ew = eh * escFoto.naturalWidth / escFoto.naturalHeight
      x.save(); x.beginPath(); x.arc(cx, y + 128, 60, 0, Math.PI * 2); x.clip()
      x.drawImage(escFoto, cx - ew / 2, y + 128 - eh / 2, ew, eh); x.restore()
    } else {
      x.textAlign = 'center'; x.fillStyle = INK; x.font = `900 56px ${OSW}`
      x.fillText(me.team.trim()[0]?.toUpperCase() ?? '?', cx, y + 148)
    }
    x.fillStyle = '#fff'; x.font = `900 30px ${OSW}`
    let tn = me.team; while (x.measureText(tn).width > colW - 30 && tn.length > 3) tn = tn.slice(0, -1)
    x.fillText(tn, cx, y + 236)
    x.fillStyle = 'rgba(0,0,0,.68)'; x.fillRect(L, y + boxH - 40, colW, 40)
    x.fillStyle = '#fff'; x.font = `italic 700 19px ${SER}`
    x.fillText(`${me.pos}º da ${J_DIV_NAME[me.div]} na temporada ${seasonNo}.`, cx, y + boxH - 13)
    if (stamp) { // carimbo torto
      x.save(); x.translate(L + colW - 88, y + 56); x.rotate(0.3)
      x.fillStyle = 'rgba(247,241,221,.75)'; x.fillRect(-92, -26, 184, 52)
      x.strokeStyle = stamp.color; x.lineWidth = 5; x.strokeRect(-92, -26, 184, 52)
      x.fillStyle = stamp.color; x.font = `900 27px ${OSW}`; x.fillText(stamp.txt, 0, 9); x.restore()
    }
    // números
    const nx = L + colW + 24
    x.fillStyle = '#fff'; x.fillRect(nx, y, colW, boxH)
    x.lineWidth = 4; x.strokeStyle = INK; x.strokeRect(nx, y, colW, boxH)
    x.fillStyle = INK; x.fillRect(nx, y, colW, 44)
    x.fillStyle = '#fff'; x.font = `900 21px ${OSW}`; x.textAlign = 'left'
    x.fillText('OS NÚMEROS DO TIME', nx + 16, y + 30)
    const rows: [string, string][] = [['Posição', `${me.pos}º`]]
    if (mine) rows.push(['Pontos', String(mine.pts)], ['V · E · D', `${mine.w}·${mine.d}·${mine.l}`], ['Gols (pró/contra)', `${mine.gf}/${mine.ga}`], ['Saldo', `${mine.gf - mine.ga >= 0 ? '+' : ''}${mine.gf - mine.ga}`])
    let ry = y + 84
    for (const [k, v] of rows) {
      x.fillStyle = '#1c1a12'; x.font = `700 24px ${OSW}`; x.textAlign = 'left'; x.fillText(k, nx + 16, ry)
      x.font = `900 24px ${OSW}`; x.textAlign = 'right'; x.fillText(v, nx + colW - 16, ry)
      x.strokeStyle = 'rgba(0,0,0,.12)'; x.lineWidth = 1; x.beginPath(); x.moveTo(nx + 12, ry + 14); x.lineTo(nx + colW - 12, ry + 14); x.stroke()
      ry += 50
    }
    y += boxH + 26
    // os donos da temporada
    const donos: { tag: string; col: string; label: string; champ: string; isYou: boolean; art?: string }[] = []
    for (const d of J_DIVS) {
      const c = tables[d]?.[0]; const a = divTop[d]
      if (c) donos.push({ tag: d, col: J_DIV_COLOR[d], label: J_DIV_NAME[d].toUpperCase(), champ: c.name, isYou: !!c.you, art: a ? `⚽ ${a.name} (${a.teamName}) · ${a.goals} gols` : undefined })
    }
    if (copa?.champion) donos.push({ tag: '🏆', col: brasil ? '#0EA658' : '#F5B301', label: brasil ? 'COPA DO BRASIL' : 'COPA LEGENDS', champ: copa.champion.name, isYou: !!copa.champion.you, art: copa.topScorer ? `⚽ ${copa.topScorer.name} (${copa.topScorer.teamName}) · ${copa.topScorer.goals} gols` : undefined })
    if (mundial) donos.push({ tag: '🌍', col: '#2563EB', label: 'COPA DO MUNDO LEGENDS', champ: mundial.selecao, isYou: !!mundial.voce, art: mundial.campeao })
    const dh = 46 + donos.length * 78
    x.fillStyle = '#fff'; x.fillRect(L, y, R - L, dh)
    x.lineWidth = 4; x.strokeStyle = INK; x.strokeRect(L, y, R - L, dh)
    x.fillStyle = INK; x.fillRect(L, y, R - L, 44)
    x.fillStyle = GOLD_HEX; x.font = `900 22px ${OSW}`; x.textAlign = 'left'
    x.fillText('🏆 OS DONOS DA TEMPORADA', L + 16, y + 30)
    let dy = y + 44
    for (const dn of donos) {
      if (dn.isYou) { x.fillStyle = '#fdf6dd'; x.fillRect(L + 4, dy, R - L - 8, 78) }
      x.fillStyle = dn.col; x.fillRect(L + 4, dy, 8, 78)
      x.fillRect(L + 26, dy + 20, 38, 38)
      x.strokeStyle = INK; x.lineWidth = 3; x.strokeRect(L + 26, dy + 20, 38, 38)
      x.fillStyle = (dn.tag === '🏆' || dn.tag === '🌍') ? INK : '#fff'; x.font = `900 22px ${OSW}`; x.textAlign = 'center'
      x.fillText(dn.tag, L + 45, dy + 47)
      // 🏷️ rótulo da série/competição (Diego 05/08: "não sabemos de qual é qual")
      x.textAlign = 'left'; x.font = `900 13px ${OSW}`; x.fillStyle = dn.col
      x.fillText(dn.label, L + 84, dy + 14)
      x.fillStyle = INK; x.font = `900 26px ${OSW}`
      const champW = x.measureText(dn.champ).width
      x.fillText(dn.champ, L + 84, dy + 40)
      x.font = `800 15px ${OSW}`; x.fillStyle = dn.isYou ? '#b98600' : '#8a8266'
      x.fillText(dn.isYou ? 'CAMPEÃO ⭐ VOCÊ' : (dn.tag === '🏆' ? 'CAMPEÃO DA COPA' : dn.tag === '🌍' ? 'CAMPEÃ DO MUNDO' : 'CAMPEÃO'), L + 84 + champW + 12, dy + 38)
      if (dn.art) { x.font = `700 20px ${OSW}`; x.fillStyle = '#3a3527'; x.fillText(dn.art, L + 84, dy + 66) }
      x.strokeStyle = 'rgba(0,0,0,.12)'; x.lineWidth = 1.5; x.beginPath(); x.moveTo(L + 4, dy + 78); x.lineTo(R - 4, dy + 78); x.stroke()
      dy += 78
    }
    y += dh + 40
    // rodapé
    x.fillStyle = '#1B7A3D'; x.fillRect(W / 2 - 300, y, 600, 76)
    x.strokeStyle = INK; x.lineWidth = 5; x.strokeRect(W / 2 - 300, y, 600, 76)
    x.fillStyle = '#fff'; x.font = `900 34px ${OSW}`; x.textAlign = 'center'
    x.fillText('🔨 leilaolegends.com', W / 2, y + 50)
    return new Promise(res => cv.toBlob(b => res(b), 'image/png'))
  }

  async function share() {
    const txt = `📰 "${hl.h}" — ${me.team}, ${me.pos}º na ${J_DIV_NAME[me.div]} (T${seasonNo}). Joga você também: leilaolegends.com`
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
    <div style={{ background: '#F7F1DD', border: `3px solid ${INK}`, boxShadow: `4px 4px 0 0 ${INK}`, borderRadius: 6, padding: '13px 13px 11px', marginBottom: 12, backgroundImage: 'repeating-linear-gradient(0deg, transparent 0 3px, rgba(0,0,0,.012) 3px 4px)' }}>
      {/* cabeçalho do jornal (a pág. 2 vira "Caderno 2 · Negócios") */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `4px double ${INK}`, paddingBottom: 6 }}>
        <div style={{ ...SERIF, fontWeight: 900, fontSize: 26, letterSpacing: 1 }}>O <span style={{ color: '#B23A2A' }}>MARTELO</span></div>
        <div style={{ textAlign: 'right', fontSize: 8.5, fontWeight: 800, lineHeight: 1.35, color: '#3a3527' }}>EDIÇÃO Nº {seasonNo}<br />{pk === 'agencia' ? 'CADERNO 2 · NEGÓCIOS' : pk === 'eventos' ? 'CADERNO · BASTIDORES' : `TEMPORADA ${seasonNo} · ${J_DIV_NAME[me.div].toUpperCase()}`}<br />PREÇO: 1 MOEDA</div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 8.5, fontWeight: 900, letterSpacing: 1.5, textTransform: 'uppercase', borderBottom: `1.5px solid ${INK}`, padding: '3px 1px', color: '#3a3527' }}>
        {pk === 'agencia' ? <><span>🕴️ CADERNO DO EMPRESÁRIO</span><span>SEUS AGENCIADOS</span></> : pk === 'eventos' ? <><span>📻 ACONTECEU NA TEMPORADA</span><span>OS BASTIDORES</span></> : <><span>⚽ O DIÁRIO DO LEILÃO LEGENDS</span><span>FIM DE TEMPORADA</span></>}
      </div>

      {pk === 'eventos' && evs ? (
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
      <h2 style={{ ...SERIF, fontWeight: 900, fontSize: 25, lineHeight: 1.02, margin: '9px 0 4px', letterSpacing: -0.5, color: INK }}>{hl.h}</h2>
      <p style={{ fontSize: 11.5, fontWeight: 700, fontStyle: 'italic', color: '#3a3527', margin: '0 0 9px', lineHeight: 1.3 }}>{hl.s}{meuEstadioNome() ? <> Direto do <b>🏟️ {meuEstadioNome()}</b>.</> : null}</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9 }}>
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
              return 'toque pra ver o Aconteceu na temporada 📻'
            })()}</span>
          </button>
        </>
      )}

      {/* rodapé: compartilhar + fechar */}
      <div style={{ display: 'flex', gap: 8, marginTop: 11 }}>
        <button onClick={share} style={{ flex: 1, background: '#1faa54', color: '#fff', border: `3px solid ${INK}`, borderRadius: 11, padding: 9, fontWeight: 900, fontSize: 13, ...COND, cursor: 'pointer', boxShadow: `3px 3px 0 0 ${INK}` }}>{copied ? '✅ Copiado!' : '📲 Mandar no grupo'}</button>
        <button onClick={() => setOpen(false)} style={{ flex: 'none', background: '#fff', color: INK, border: `3px solid ${INK}`, borderRadius: 11, padding: '9px 14px', fontWeight: 900, fontSize: 13, ...COND, cursor: 'pointer' }}>Fechar</button>
      </div>
    </div>
  )
}

// ─── 📤 COMPARTILHAR ELENCO: a arte 1080px aprovada no mockup ────────────────
// A tela do jogo não muda — isto gera a IMAGEM (header na cor do time + campinho
// padrão + listas com gols/valor + rodapé dourado) e abre o compartilhar nativo.
export type ElencoPlayerRow = { pos: string; name: string; goals: number; paid: number }
export type ElencoShareOpts = {
  teamName: string; divName: string; tablePos: number; seasonNo: number; formation: string
  titles: number; squadValue: number; coins: number; color: string
  // 🎨 manto do tier de apoio (apoio.tsx): degradê CSS + intensidade do brilho.
  // Presente → topo e listas ganham o MESMO manto da aba Elenco (fidelidade de
  // tier: ouro brilha na arte também). Ausente → cor chapada de sempre.
  tierGrad?: string; tierHolo?: number
  fieldRows: { pos: string; name: string; goals: number }[][] // ATA/MEI/DEF/GOL
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
export async function buildElencoBlob(o: ElencoShareOpts): Promise<Blob | null> {
  const W = 1080
  const HEAD = 252, FPAD = 0, FH = 660, LHEAD = 56, ROWH = 46, ROWG = 8
  const nRows = Math.max(o.titulares.length, o.reservas.length, 1)
  const LISTS = LHEAD + nRows * (ROWH + ROWG) + 18
  const FOOT = 116
  const H = HEAD + FPAD + FH + LISTS + FOOT
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H
  const x = cv.getContext('2d'); if (!x) return null
  try { await document.fonts.load('900 60px Oswald') } catch { /* segue */ }
  const OSW = 'Oswald, sans-serif', ARI = 'Arial, sans-serif'

  // ── HEADER na cor do time (com tier de apoio: no MANTO do tier + brilho)
  const manto = o.tierGrad
  const claro = manto ? tierIsLight(manto) : false // manto claro → texto escuro
  if (manto) fillTier(x, manto, 0, 0, W, HEAD)
  else { x.fillStyle = o.color; x.fillRect(0, 0, W, HEAD) }
  x.textAlign = 'left'
  x.fillStyle = claro ? 'rgba(0,0,0,0.60)' : GOLD_HEX; x.font = `800 26px ${OSW}`
  x.fillText('🔨 LEILÃO LEGENDS · MEU ELENCO', 44, 56)
  x.fillStyle = claro ? INK : '#fff'; x.font = `900 62px ${OSW}`
  x.fillText(cut(x, o.teamName, W - 88), 44, 126)
  x.fillStyle = claro ? 'rgba(0,0,0,0.65)' : 'rgba(255,255,255,0.85)'; x.font = `800 27px ${ARI}`
  x.fillText(`${o.divName} · ${o.tablePos}º lugar · Temporada ${o.seasonNo} · ${o.formation}`, 44, 168)
  // chips
  const chips = [`🏆 ${o.titles} título${o.titles === 1 ? '' : 's'}`, `🏷️ Elenco vale ${o.squadValue} 💵`, `🪙 Caixa: ${o.coins}`]
  let cx = 44
  x.font = `800 25px ${OSW}`
  for (const c of chips) {
    const w = x.measureText(c).width + 34
    x.fillStyle = claro ? 'rgba(0,0,0,0.45)' : 'rgba(0,0,0,0.30)'; rr(x, cx, 190, w, 44, 12); x.fill()
    x.strokeStyle = claro ? 'rgba(0,0,0,0.45)' : 'rgba(245,179,1,0.75)'; x.lineWidth = 2.5; rr(x, cx, 190, w, 44, 12); x.stroke()
    x.fillStyle = claro ? '#FFDD70' : GOLD_HEX; x.fillText(c, cx + 17, 221)
    cx += w + 14
  }
  if (manto) sheenRect(x, 0, 0, W, HEAD, 0.62, o.tierHolo ?? 0)
  x.fillStyle = INK; x.fillRect(0, HEAD - 6, W, 6)

  // ── CAMPO padrão de ponta a ponta (uma cor só: o fundo é a cor do time)
  const fx0 = 0, fy0 = HEAD, fw = W
  for (let i = 0; i < 10; i++) { x.fillStyle = i % 2 ? '#166332' : '#1B7A3D'; x.fillRect(fx0, fy0 + i * (FH / 10), fw, FH / 10) }
  const rowY = [0.14, 0.38, 0.63, 0.87]
  o.fieldRows.forEach((cards, ri) => {
    if (!cards.length) return
    const cw = Math.min(300, (fw - 40) / cards.length - 18), ch = 104
    const total = cards.length * cw + (cards.length - 1) * 18
    let px = fx0 + (fw - total) / 2
    const py = fy0 + FH * rowY[ri] - ch / 2
    for (const c of cards) {
      x.fillStyle = ri === 3 ? '#FFF6D6' : '#fff'; rr(x, px, py, cw, ch, 18); x.fill()
      x.strokeStyle = INK; x.lineWidth = 5; rr(x, px, py, cw, ch, 18); x.stroke()
      x.textAlign = 'center'
      x.fillStyle = o.color; x.font = `800 20px ${OSW}`
      x.fillText(c.pos, px + cw / 2, py + 28)
      x.fillStyle = INK; x.font = `800 28px ${OSW}`
      x.fillText(cut(x, c.name, cw - 22), px + cw / 2, py + 60)
      if (c.goals > 0) { x.fillStyle = '#166332'; x.font = `800 22px ${OSW}`; x.fillText(`⚽ ${c.goals}`, px + cw / 2, py + 90) }
      px += cw + 18
    }
  })

  // ── LISTAS sobre a cor do time (ou o manto do tier)
  const ly0 = HEAD + FPAD + FH
  if (manto) fillTier(x, manto, 0, ly0, W, LISTS)
  else { x.fillStyle = o.color; x.fillRect(0, ly0, W, LISTS) }
  x.fillStyle = INK; x.fillRect(0, ly0, W, 6)
  const colW = (W - 44 * 2 - 26) / 2
  const drawList = (title: string, rows: ElencoPlayerRow[], lx: number) => {
    x.textAlign = 'left'; x.fillStyle = claro ? INK : '#fff'; x.font = `900 30px ${OSW}`
    x.fillText(title, lx, ly0 + 40)
    rows.forEach((r0, i) => {
      const ry = ly0 + LHEAD + i * (ROWH + ROWG)
      x.fillStyle = '#fff'; rr(x, lx, ry, colW, ROWH, 10); x.fill()
      x.fillStyle = o.color; x.font = `800 16px ${OSW}`
      x.fillText(r0.pos, lx + 12, ry + 30)
      x.fillStyle = INK; x.font = `800 24px ${OSW}`
      x.fillText(cut(x, r0.name, colW - 200), lx + 58, ry + 32)
      x.textAlign = 'right'
      if (r0.goals > 0) { x.fillStyle = '#166332'; x.font = `800 20px ${OSW}`; x.fillText(`⚽ ${r0.goals}`, lx + colW - 92, ry + 31) }
      x.fillStyle = 'rgba(0,0,0,0.55)'; x.font = `800 20px ${OSW}`
      x.fillText(`💰 ${r0.paid}`, lx + colW - 12, ry + 31)
      x.textAlign = 'left'
    })
  }
  drawList('⭐ TITULARES', o.titulares, 44)
  drawList('🔁 RESERVAS', o.reservas, 44 + colW + 26)
  if (manto) sheenRect(x, 0, ly0, W, LISTS, 0.30, o.tierHolo ?? 0)

  // ── RODAPÉ dourado
  const fy = H - FOOT
  x.fillStyle = GOLD_HEX; x.fillRect(0, fy, W, FOOT)
  x.fillStyle = INK; x.fillRect(0, fy, W, 6)
  x.textAlign = 'center'
  x.fillStyle = INK; x.font = `900 34px ${OSW}`
  x.fillText('mostra teu elenco e marca a gente! 📲 @leilaolegendscom', W / 2, fy + 56)
  x.fillStyle = 'rgba(0,0,0,0.6)'; x.font = `800 23px ${ARI}`
  x.fillText('monta o teu de graça em leilaolegends.com 🔨', W / 2, fy + 92)

  return new Promise(res => cv.toBlob(b => res(b), 'image/png'))
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

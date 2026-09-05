// ── APOIO: benefícios visuais de quem apoia o projeto (só cosmético, nunca
// vantagem em campo). Cada conta pode ter um "tier" que define a COR do time
// em todo o jogo + o selo (emoji pequeno) ao lado do nome.
// Por enquanto a lista vive aqui no código (contas fundadoras); depois migra
// pra tabela user_colors no Supabase, aí outros jogadores também enxergam.
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export type ApoioTier = 'bege' | 'verde' | 'roxo' | 'prata' | 'ouro'

export interface ApoioPerk {
  tier: ApoioTier
  selo: string        // emoji ao lado do nome ('' = sem selo — bege e verde)
  solid: string       // cor sólida do time (chips, nomes, molduras)
  light: string       // fundo claro da faixa/linha nas tabelas
  holo: number        // intensidade do brilho (0 = sem brilho)
  grad: string        // degradê CSS — o MESMO visual da carta da categoria
  svgFull: [string, string]  // estádio: setor 100% (topo → base)
  svgPart: [string, string]  // estádio: setor em construção
}

export const APOIO_PERKS: Record<ApoioTier, ApoioPerk> = {
  bege:  { tier: 'bege',  selo: '',   solid: '#B2A583', light: '#EFE9D6', holo: 0,
           grad: 'linear-gradient(160deg,#DBD1B5,#CBBF9E 55%,#B2A583)', svgFull: ['#DBD1B5', '#B2A583'], svgPart: ['#cbbf9e', '#948967'] },
  // 🫥 selo INVISÍVEL (pedido do Diego 17/08 — "sem emoji"): sem NENHUM sinal
  // no nome, os outros jogadores não têm como saber a cor de quem não é a
  // própria conta — o jogo não consulta o banco pra isso, lê um sinalzinho
  // junto do nome (mesmo esquema de ⭐💎👑). Verde nasceu sem selo (junto do
  // bege); agora ganha o caractere U+2063 (SEPARADOR INVISÍVEL) — funciona
  // igual aos outros selos pro jogo detectar, mas não aparece NADA na tela.
  // Não muda nada de sócio/plano/preço.
  verde: { tier: 'verde', selo: '⁣', solid: '#2E9E5B', light: '#CBEFD7', holo: 0,
           grad: 'linear-gradient(160deg,#41C07A,#2E9E5B 55%,#1E7A45)', svgFull: ['#41C07A', '#1E7A45'], svgPart: ['#2fa85c', '#15612f'] },
  roxo:  { tier: 'roxo',  selo: '💎', solid: '#8B5CF6', light: '#E4D6FB', holo: 0.3,
           grad: 'linear-gradient(160deg,#C9A9FF,#8B5CF6 52%,#5B2FB0)', svgFull: ['#C9A9FF', '#7C3AED'], svgPart: ['#a98be0', '#5B2FB0'] },
  prata: { tier: 'prata', selo: '⭐', solid: '#8E9BAB', light: '#E9EDF2', holo: 0.5,
           grad: 'linear-gradient(160deg,#F4F7FB,#CBD4DE 52%,#9BA7B5)', svgFull: ['#F4F7FB', '#9BA7B5'], svgPart: ['#cfd6de', '#7d8896'] },
  ouro:  { tier: 'ouro',  selo: '👑', solid: '#C9A227', light: '#F6E9C0', holo: 0.75,
           grad: 'linear-gradient(160deg,#FFE79A,#FFC400 40%,#E8A200 70%,#FFDD70)', svgFull: ['#ffd85a', '#e09e00'], svgPart: ['#e6c766', '#a67c00'] },
}

// 🟢 VERDE BRILHANTE DE LENDA — pele especial (só cosmética): tudo do tier OURO
// (selo 👑, brilho holo 0.75, Modo Manual…), mas com o degradê/cor VERDE no MESMO
// capricho do dourado. Usada SÓ na carreira offline pra contas do CAREER_GREEN
// (pedido do Diego). Em todo o resto (online, rápido…) a conta segue ouro normal.
const VERDE_LENDA: ApoioPerk = {
  tier: 'ouro', selo: '👑', solid: '#1B9E4B', light: '#D6F5DE', holo: 0.75,
  grad: 'linear-gradient(160deg,#8FF0AE,#22C55E 40%,#0E9B45 70%,#6FE39A)', svgFull: ['#5FE08A', '#12833B'], svgPart: ['#4bc873', '#0e6630'],
}
// contas que veem o VERDE DE LENDA só na carreira offline (senão, ouro normal).
const CAREER_GREEN = new Set<string>(['feehcamp11@gmail.com'])
// 🎨 "contexto de cor": a carreira OFFLINE liga isto (setCareerColorCtx) enquanto a
// tela está montada; fora dela fica null. É o que faz o verde valer SÓ lá.
let careerColorCtx: 'offline' | null = null
export function setCareerColorCtx(v: 'offline' | null) { careerColorCtx = v }

// contas fundadoras / apoios aplicados à mão (email → tier). O criador do jogo
// entra com tudo do tier máximo — menos o batismo de clube, que é só dos apoiadores.
const FOUNDERS: Record<string, ApoioTier> = {
  'igormarquesn99@gmail.com': 'ouro', // 👑 Lenda — todo batismo já nasce sócio + fundador (regra 17/08); Milhaça FC (24/08)
  'diego.c.fonseca@gmail.com': 'ouro',
  'willian.chagass@outlook.com': 'ouro',
  'gabrielcunico1909@gmail.com': 'ouro',
  'davidsccp16@gmail.com': 'prata', // ⭐ Craque (pago) — cor/selo prata + Modo Manual
  'daviddmartinsff11m@gmail.com': 'prata', // ⭐ Craque — cor/selo prata + Modo Manual
  'victorcarvalhoalves@hotmail.com': 'prata', // ⭐ Craque — cor/selo prata + Modo Manual
  'victorreservauso@gmail.com': 'prata', // ⭐ Craque — cor/selo prata + Modo Manual
  'venturakaua2@gmail.com': 'prata', // ⭐ Craque — cor/selo prata + Modo Manual
  'luancamposreal@hotmail.com': 'prata', // ⭐ Craque — cor/selo prata + Modo Manual
  'juniormelocdm@hotmail.com': 'prata', // ⭐ Craque — cor/selo prata + Modo Manual
  'lipeh_95@hotmail.com': 'ouro', // 👑 Lenda (pago) — tudo do ouro, SEM fundador (não entra no FUNDADOR_N) (era Craque, subiu pra Lenda) (12/08)
  'pedronovikoff27@gmail.com': 'prata', // ⭐ Craque (pago) — cor/selo prata + Modo Manual (p9koff) (11/08)
  'nevesgabriel95@gmail.com': 'ouro', // 👑 Lenda (pago) — tudo do ouro + FUNDADOR + batismo (Desportivo Montreal, homenagem à filha Maitê) (11/08)
  'valentinnavitoria165@gmail.com': 'prata', // ⭐ Craque (pago) — cor/selo prata + Modo Manual
  'mmmartins246@gmail.com': 'ouro', // 👑 Lenda (pago) — tudo do ouro + FUNDADOR (era Craque, subiu pra Lenda)
  'feeriibeiro25@gmail.com': 'prata', // ⭐ Craque — cor/selo prata + Modo Manual
  'jorgericardo777@gmail.com': 'ouro', // 👑 Lenda (pago) — tudo do ouro + FUNDADOR + batismo (Leão da Estradinha, ex-Império Samambaia, ex-Cuiabagre; rebatismo 23/08, homenagem ao Rio Branco-PR)
  'dasilva1227br@gmail.com': 'ouro', // 👑 Lenda (pago) — tudo do ouro + FUNDADOR
  'davisantana1312@gmail.com': 'ouro', // 👑 Lenda (pago) — tudo do ouro + FUNDADOR + batismo (Bicho da Seda 🦋 — CORREÇÃO FINAL 10/08: a mariposa/Palmeiras são do Davi)
  'ambielvictor@gmail.com': 'ouro', // 👑 Lenda (pago) — tudo do ouro + FUNDADOR
  'cesar.verissimo27@gmail.com': 'ouro', // 👑 Lenda (pago) — tudo do ouro + FUNDADOR
  'denilson.stifler10@gmail.com': 'ouro', // 👑 Lenda (pago) — tudo do ouro + FUNDADOR + batismo Xurupitas FC (o porco 🐷, Palmeiras de coração; nome bate com o "Xurupitas" que ele já usa no ranking)
  'filipeabraaodasilva@gmail.com': 'ouro', // 👑 Lenda (pago) — tudo do ouro, SEM fundador (não entra no FUNDADOR_N)
  'taylorsenachek2@gmail.com': 'ouro', // 👑 Lenda (pago) — tudo do ouro + FUNDADOR
  'pedrohmbispo@gmail.com': 'ouro', // 👑 Lenda (pago) — tudo do ouro + FUNDADOR
  'wandersonosantos@hotmail.com': 'ouro', // 👑 Lenda (pago) — tudo do ouro + FUNDADOR
  'rodriguinhobettiojr@gmail.com': 'ouro', // 👑 Lenda (pago) — tudo do ouro + FUNDADOR
  'guilhermevictor539@gmail.com': 'ouro', // 👑 Lenda (pago) — tudo do ouro + FUNDADOR + batismo (Nightfull FC)
  'lipegmd@icloud.com': 'ouro', // 👑 Lenda (pago) — tudo do ouro + FUNDADOR
  'diogoluz2309@gmail.com': 'ouro', // 👑 Lenda (pago) — tudo do ouro + FUNDADOR
  'msb102010@hotmail.com': 'ouro', // 👑 Lenda (pago) — tudo do ouro + FUNDADOR + batismo (Murriz FC)
  'ofc.toka10@gmail.com': 'ouro', // 👑 Lenda (pago) — tudo do ouro + FUNDADOR + batismo (Tôka10)
  'gabrielnegreirosamaral99@hotmail.com': 'ouro', // 👑 Lenda — batismo São Luiz FC (Série D) + fundador nº48 (21/08)
  'matheusfilipealves@hotmail.com': 'ouro', // 👑 Lenda — batismo Theuzudo FC (Série B) + fundador nº47 (21/08). Regra 17/08: todo batismo já nasce sócio + fundador.
  'gfpicolo13@gmail.com': 'ouro', // 👑 Lenda (pago) + SÓCIO nº27 do Futpoint FC (o Diego deu, 19/08). NÃO é batismo: não entra no FUNDADOR_N e não tira o lugar de nenhum clube.
  'delaofut@gmail.com': 'ouro', // 👑 Lenda + SÓCIO nº28 (Guilherme De La Ó, o Diego deu, 22/08). ⚠️ NÃO É BATISMO, e isso foi ordem dele: *"apenas como sócio e lenda. Sem batismo de trocar time do jogo por ele"* — então NÃO entra no FUNDADOR_N, NÃO tem clube em LOGOS_PRONTAS/MASCOTES, NÃO mexe em data.ts e NENHUM time do jogo sai do lugar. O "De La Ó FUT" existe só como mockup (scripts/mockup-batismo.mjs) enquanto ele não aprova.
  'alvarolino7712@gmail.com': 'prata', // ⭐ Craque — cor/selo prata + Modo Manual
  'matheusncruz1@gmail.com': 'ouro', // 👑 Lenda (pago) — tudo do ouro + FUNDADOR + batismo (Skyy FC)
  'giovannecastro784@hotmail.com': 'ouro', // 👑 Lenda — tudo do ouro + FUNDADOR + batismo (Crias do Bigão)
  'adriano.ferrari@quepazseguros.com.br': 'ouro', // 👑 Lenda (pago) — tudo do ouro + batismo (SC Ferrari)
  'vt6.wallace@gmail.com': 'prata', // ⭐ Craque — cor/selo prata + Modo Manual
  'gabriel.cozendey92@gmail.com': 'prata', // ⭐ Craque (pago) — cor/selo prata + Modo Manual
  'felipe.vrod10@gmail.com': 'prata', // ⭐ Craque (pago) — cor/selo prata + Modo Manual
  'pedrohenriquedasilva315@gmail.com': 'ouro', // 👑 Lenda (pago) — tudo do ouro + FUNDADOR
  'gabriel.arruda.1999@hotmail.com': 'ouro', // 👑 Lenda (pago) — tudo do ouro + FUNDADOR
  'feehcamp11@gmail.com': 'ouro', // 👑 Lenda (pago) + FUNDADOR — ouro normal em tudo, MAS verde brilhante SÓ na carreira offline (CAREER_GREEN)
  'lucasigorbortoliniii@hotmail.com': 'ouro', // 👑 Lenda (pago) — tudo do ouro + FUNDADOR + batismo (Marreco FC, ex-Inter Estadual)
  'fontourajoao04@gmail.com': 'ouro', // 👑 Lenda (pago) — tudo do ouro + FUNDADOR nº53 + batismo (Al Takhadao FC, Série A; coração Internacional, 01/09)
  'luizguilhermeps@hotmail.com': 'ouro', // 👑 Lenda (pago) — tudo do ouro + FUNDADOR nº54 + SÓCIO nº32 + batismo (Jurubeba FC, Série B, ex-Ferroviário do Sul; mascote a meia 🧦, 02/09)
  'gustavo99828@gmail.com': 'ouro', // 👑 Lenda (pago) — tudo do ouro + FUNDADOR nº57 + batismo (Final Boss FC, Série C, ex-Ponte Branca; mascote o touro O Boss 🐂, vermelho + preto sobre branco, 05/09). ⚠️ A fonte OFICIAL do tier é a tabela `user_colors` no banco — esta lista é RESERVA.
  'stoccoassessoria@gmail.com': 'ouro', // 👑 Lenda (pago) — tudo do ouro + FUNDADOR nº56 + batismo (Stocco FC, Série C, ex-Semervilha; mascote o Relâmpago 🐺, roxo + preto, 04/09). ⚠️ A fonte OFICIAL do tier é a tabela `user_colors` no banco — esta lista é RESERVA.
  'contatovegetta14@gmail.com': 'ouro', // 👑 Lenda (pago) — tudo do ouro + FUNDADOR nº55 + batismo (Corporação Capsule FC, Série B, ex-Real Tabuleiro; mascote DragonBola 🐉, preto + azul escuro, 03/09). ⚠️ A fonte OFICIAL do tier é a tabela `user_colors` no banco — esta lista é RESERVA.
  'matheus223lms@icloud.com': 'ouro', // 👑 Lenda (pago) — tudo do ouro + FUNDADOR + batismo (Alfacehh, ex-Santos Dumont)
  'ricardopessoafreire@gmail.com': 'ouro', // 👑 Lenda (pago) — tudo do ouro + FUNDADOR + batismo (Barcenite FC, ex-Milanesa FC)
  'victordudu.monte14@gmail.com': 'prata', // ⭐ Craque (pago) — cor/selo prata + Modo Manual (04/08)
  'allanchris2011@gmail.com': 'ouro', // 👑 Lenda (pago) — tudo do ouro + FUNDADOR (05/08)
  'gabriel.alves.martins.2010@gmail.com': 'prata', // ⭐ Craque (pago) — cor/selo prata + Modo Manual (07/08)
  'mickael.mearepresentacoes@gmail.com': 'ouro', // 👑 Lenda (pago) — tudo do ouro + FUNDADOR (08/08)
  'macson100vitorio@gmail.com': 'prata', // ⭐ Craque — cor/selo prata + Modo Manual (08/08)
  'danielmanfre5@gmail.com': 'ouro', // 👑 Lenda (pago) — tudo do ouro + FUNDADOR + batismo (Manfré FC, ex-Livre-pool) (08/08)
  'marcomak03@gmail.com': 'prata', // ⭐ Craque — cor/selo prata + Modo Manual (08/08)
  'luiz.maia.luiz@gmail.com': 'ouro', // 👑 Lenda (pago) — tudo do ouro + FUNDADOR (08/08)
  'souzact12@gmail.com': 'ouro', // 👑 Lenda (pago) — Geovany Souza: tudo do ouro + FUNDADOR + batismo (Tricolor do Arruda FC, ex-Legado EC; anel do Arruda com o T no escudo, cobra de cachimbo de mascote; coração Santa Cruz) — era Craque prata, subiu no batismo (16/08)
  'lucas_calefi@outlook.com': 'ouro', // 👑 Lenda (pago) — tudo do ouro + FUNDADOR nº44 + sócio nº24; batizou os CORINGAS DO DINIZ (ex-Vanguarda Nacional, Série A); coração Corinthians, manto preto e branco (16/08)
  'lucassrribeiroo2023@gmail.com': 'ouro', // 👑 Lenda (pago) — tudo do ouro + FUNDADOR + batismo (Scorporila FC) (11/08)
  'paisagensetrilha@gmail.com': 'ouro', // 👑 Lenda (pago) — tudo do ouro + FUNDADOR + batismo (Marolados FC — molecada da várzea) (11/08)
  'lluchmarcel81@gmail.com': 'ouro', // 👑 Lenda — batismo (Esqueceram do Lluch FC, ex-Litoral United, Série B) + FUNDADOR nº50 (28/08)
  'agrostinho88@gmail.com': 'ouro', // 👑 Lenda (pago) — tudo do ouro + FUNDADOR nº39 + sócio nº29 + batismo (Papão United Madrid, ex-Santos Dumont, Série D; Leandro/Obina) (nome reservado 11/08, clube entregue 23/08)
  'erosreis@outlook.com.br': 'ouro', // 👑 Lenda (pago) — tudo do ouro + FUNDADOR + batismo (Eros FC — influencer @erosreis; nomes: Eros Reis FC / Eros Reis / Eros; mascote Nina 🐶) (12/08)
  'tiosapeka@gmail.com': 'ouro', // 👑 Lenda (pago) — tudo do ouro + FUNDADOR + batismo (Sapekeiros FC — influencer @tiosapekagg; mascote abelha coroada 🐝; coração Santos) (12/08)
  'chiarentin.dyno127@gmail.com': 'ouro', // 👑 Lenda (pago) — tudo do ouro, SEM fundador (não entra no FUNDADOR_N) (12/08)
  'glaucomiranda@outlook.com': 'ouro', // 👑 Lenda (pago) — tudo do ouro + FUNDADOR + sócio nº22 (Glauco; batismo Série A a definir) (15/08)
  'pedrinhocamisa8@gmail.com': 'ouro', // 👑 Lenda (pago) — tudo do ouro + FUNDADOR nº45; batizou o NATA DE SP (ex-Paris São Geraldo, Série D); coração Corinthians (17/08)

  // 🎨 COR DE RECONHECIMENTO (pedido do Diego 17/08) — NÃO é sócio, NÃO é
  // Craque/Lenda, NÃO tem batismo nem entra no FUNDADOR_N. É só a cor do nome
  // brilhando quando jogam online, de presente por jogarem MUITO o jogo — o
  // tier aqui é usado só pra pintar (nenhum outro benefício vem junto).
  // ⚠️ ROXO é o tier real "💎 Promessa" que sócios pagantes recebem pelo
  // painel de admin (admin.tsx) — NUNCA usar roxo pra essa lista de
  // reconhecimento, senão parece que a pessoa é sócia sem ser.
  'brunomontoya011@gmail.com': 'verde', // Bruno — reconhecimento, joga muito (17/08)
  'beatrizsilvavieira624@gmail.com': 'verde', // Beatriz — reconhecimento, joga muito; mesma cor do Bruno (17/08)
}

// 🖋️ FUNDADORES (os 100 primeiros Lendas): e-mail → número do fundador.
// O selo 🖋️ cola no 👑 no nome ("Fulano 👑🖋️") em todo canto do jogo.
// O número entra no mural "Fundadores do Leilão Legends" (tela futura).
const FUNDADOR_N: Record<string, number> = {
  'diego.c.fonseca@gmail.com': 1, // 🖋️ o criador do jogo — fundador nº 1
  'fontourajoao04@gmail.com': 53, // 🦜 Al Takhadao FC (01/09)
  'luizguilhermeps@hotmail.com': 54, // 🧦 Jurubeba FC (02/09)
  'stoccoassessoria@gmail.com': 56, // ⚡ Stocco FC (04/09)
  'gustavo99828@gmail.com': 57, // 🐂 Final Boss FC (05/09)
  'contatovegetta14@gmail.com': 55, // 🐉 Corporação Capsule FC (03/09)
  'cesar.verissimo27@gmail.com': 3,
  'dasilva1227br@gmail.com': 9,
  'davisantana1312@gmail.com': 11,
  'ambielvictor@gmail.com': 12,
  'denilson.stifler10@gmail.com': 13,
  'taylorsenachek2@gmail.com': 14,
  'pedrohmbispo@gmail.com': 15,
  'wandersonosantos@hotmail.com': 16,
  'rodriguinhobettiojr@gmail.com': 17,
  'guilhermevictor539@gmail.com': 18,
  'lipegmd@icloud.com': 19,
  'diogoluz2309@gmail.com': 20,
  'msb102010@hotmail.com': 21,
  'mmmartins246@gmail.com': 22,
  'ofc.toka10@gmail.com': 23,
  'matheusncruz1@gmail.com': 24,
  'pedrohenriquedasilva315@gmail.com': 25,
  'gabriel.arruda.1999@hotmail.com': 26,
  'feehcamp11@gmail.com': 27,
  'jorgericardo777@gmail.com': 28,
  'lucasigorbortoliniii@hotmail.com': 29,
  'matheus223lms@icloud.com': 30,
  'ricardopessoafreire@gmail.com': 31,
  'allanchris2011@gmail.com': 32,
  'mickael.mearepresentacoes@gmail.com': 33, // 🩹 tava faltando (virou ouro em 08/08 mas ninguém tinha posto o número)
  'danielmanfre5@gmail.com': 34,
  'luiz.maia.luiz@gmail.com': 35,
  'lucassrribeiroo2023@gmail.com': 36,
  'nevesgabriel95@gmail.com': 37, // 🖋️ Gabriel — batismo Desportivo Montreal (11/08)
  'paisagensetrilha@gmail.com': 38, // 🖋️ Marolados FC — molecada da várzea (11/08)
  'agrostinho88@gmail.com': 39, // 🖋️ Leandro/Obina — Lenda (nome "Papão United Madrid") (11/08)
  'erosreis@outlook.com.br': 40, // 🖋️ Eros Reis — batismo Eros FC (influencer @erosreis, mascote Nina 🐶) (12/08)
  'tiosapeka@gmail.com': 41, // 🖋️ Tio Sapeka — batismo Sapekeiros FC (influencer @tiosapekagg, mascote abelha coroada 🐝) (12/08)
  'glaucomiranda@outlook.com': 42, // 🖋️ Glauco — Lenda + sócio nº22; batismo Seven FC (15/08)
  'souzact12@gmail.com': 43, // 🖋️ Geovany Souza — batismo Tricolor do Arruda FC (ex-Legado EC, Série A); anel do Arruda com o T no escudo, cobra de cachimbo de mascote (16/08)
  'lucas_calefi@outlook.com': 44, // 🖋️ Lucas Calefi — Lenda + sócio nº24; batizou os Coringas do Diniz (Série A); coração Corinthians (16/08)
  'pedrinhocamisa8@gmail.com': 45, // 🖋️ batizou o Nata de SP (ex-Paris São Geraldo, Série D); coração Corinthians (17/08)
  'giovannecastro784@hotmail.com': 46, // 🖋️ batizou os Crias do Bigão (ex-Ferroviária do Vale, Série B) — mascote é o próprio dono (17/08)
  'matheusfilipealves@hotmail.com': 47, // 🖋️ batizou o Theuzudo FC (ex-Comercial do Norte, Série B); coração Valência, mascote morcego 🦇 laranja e preto (21/08)
  'gabrielnegreirosamaral99@hotmail.com': 48,
  'igormarquesn99@gmail.com': 49,
  'lluchmarcel81@gmail.com': 50, // 🖋️ batizou o Esqueceram do Lluch FC (ex-Litoral United, Série B); ❤️ São Paulo, mascote o menino de gorro ⚽ tricolor vermelho/preto/branco (28/08) // 🖋️ batizou o Milhaça FC (ex-Real Bets, Série C); jornalista @igumarques, mascote boleiro de boné 🌽 vermelho e amarelo (24/08) // 🖋️ batizou o São Luiz FC (ex-Flamengo do Sertão, Série D); coração Flamengo, mascote pitbull 🐶 (21/08)
  // 🩹 30/08 — CONSERTO DE DOIS BURACOS que a auditoria (`npm run batismos`) achou.
  // O Diego, quando contei: *"o fundador q tiver duplicado troque o número, n tem
  // problema"*.
  //
  // 1) O nº 36 estava DUPLICADO: aqui no código era do Lucas (Scorporila FC) e no
  //    banco (`esc_fundadores`) era do Elton (La Bestia Negra). O jogo lê DAQUI —
  //    então o Lucas já ostentava o 36 e o Elton, que tem batismo desde 09/08 e
  //    pagou, não via selo NENHUM. Quem já mostra o número fica com ele (mexer
  //    nisso bagunçaria post e print de quem já ostenta); o Elton entra no próximo
  //    livre.
  // 2) O Adriano (SC Ferrari) nunca teve número — batismo de 14/08, passou batido.
  'eltonfrossard45@gmail.com': 51, // 🖋️ batizou La Bestia Negra (ex-River Prato, Série D); ❤️ Cruzeiro, mascote raposa 🦊 (09/08 — número só saiu em 30/08)
  'adriano.ferrari@quepazseguros.com.br': 52, // 🖋️ batizou o SC Ferrari (ex-Painitto FC); o piloto na bola 🏎️ serve de escudo e de mascote (14/08 — número só saiu em 30/08)
}
export function myFundadorN(): number | null {
  return myEmail != null ? (FUNDADOR_N[myEmail] ?? null) : null
}

// e-mail da conta logada, cacheado — os pontos que usam (playerColors, nomes)
// são síncronos, então mantemos o valor atualizado via auth listener.
let myEmail: string | null = null
// tier vindo da TABELA user_colors do Supabase (gerida pelo Diego no painel):
// e-mail → tier. É a fonte oficial; a lista FOUNDERS no código vira reserva.
let dbTier: ApoioTier | null = null
async function fetchDbTier(email: string | null) {
  dbTier = null
  if (!email) return
  try {
    const { data } = await supabase.from('user_colors').select('tier').eq('email', email).maybeSingle()
    const t = (data?.tier ?? '') as ApoioTier
    if (t && t in APOIO_PERKS) dbTier = t
  } catch { /* tabela ainda não existe / rede — segue com FOUNDERS */ }
}
supabase.auth.getUser().then(({ data }) => { myEmail = data?.user?.email?.toLowerCase() ?? null; if (myEmail) markHadLogin(); fetchDbTier(myEmail); fixOldEmojiName(data?.user) }, () => {})
supabase.auth.onAuthStateChange((_e, s) => { const em = s?.user?.email?.toLowerCase() ?? null; if (em) markHadLogin(); if (em !== myEmail) { myEmail = em; fetchDbTier(em) } fixOldEmojiName(s?.user) })

// cadastro ANTIGO com emoji no nome: corrige no banco uma vez, no login.
// (nome que era só emoji vira o prefixo do e-mail.)
let fixedName = false
function fixOldEmojiName(u: { email?: string; user_metadata?: Record<string, unknown> } | null | undefined) {
  if (!u || fixedName) return
  const dn = u.user_metadata?.display_name as string | undefined
  if (!dn) return
  const clean = stripEmoji(dn).trim() || u.email?.split('@')[0] || 'Técnico'
  if (clean === dn) return
  fixedName = true
  supabase.auth.updateUser({ data: { display_name: clean } }).then(() => {}, () => {})
}

// 🎨 INTENÇÃO DE APOIO: anota no banco cada passo relevante do modal APOIE
// (abriu opção, copiou Pix, tocou no botão da DM com a escolha). Só pro admin
// cruzar Pix ↔ escolha — nunca aparece pra ninguém, nunca trava o jogo.
export function logApoio(choice: string) {
  ;(async () => {
    try {
      const { data } = await supabase.auth.getUser()
      await supabase.from('apoio_intents').insert({
        email: data?.user?.email?.toLowerCase() ?? null,
        nick: (data?.user?.user_metadata?.display_name as string | undefined) ?? null,
        choice: choice.slice(0, 120),
      })
    } catch { /* silencioso */ }
  })()
}

// e-mail da conta logada (pra gates de teste de features) — null se deslogado
export function loggedEmail(): string | null { return myEmail }

// 🔑 marcador "esta pessoa JÁ logou ao menos uma vez neste aparelho". Serve SÓ
// pra decidir se mostramos o aviso "sua sessão caiu". Quem NUNCA logou não tem
// o marcador — então nunca vê o aviso (não atrapalha jogador sem conta).
function markHadLogin() { try { localStorage.setItem('esc-had-login', '1') } catch { /* ignora */ } }
export function hadLogin(): boolean { try { return localStorage.getItem('esc-had-login') === '1' } catch { return false } }
// logout "limpo": apaga o marcador ANTES de sair (senão o aviso apareceria pra
// quem saiu de propósito) e desloga de fato.
export function logout() { try { localStorage.removeItem('esc-had-login') } catch { /* ignora */ } return supabase.auth.signOut() }

export function myApoioPerk(): ApoioPerk | null {
  if (!myEmail) return null
  const tier = dbTier ?? FOUNDERS[myEmail]
  if (!tier) return null
  // 🟢 pele verde de Lenda SÓ na carreira offline (pra quem está no CAREER_GREEN);
  // em qualquer outro contexto, a cor é a do tier normal (ouro etc.).
  if (careerColorCtx === 'offline' && CAREER_GREEN.has(myEmail)) return VERDE_LENDA
  return APOIO_PERKS[tier]
}

// 🎮 ACESSO AO MODO MANUAL (na carreira): liberado pra quem tem o tier Craque
// (prata, R$ 19,90 — o Modo Manual mora nele) ou Lenda (ouro), OU pra quem tem
// o selo `manual` avulso na tabela user_colors. A coluna `manual` é
// consultada à PARTE (query própria) pra que, se ela ainda não existir no banco,
// a leitura das CORES não quebre. Enquanto o Diego não roda o SQL nem libera
// ninguém, só o Lenda destrava — e nada afeta save antigo (isso é o grandfather,
// tratado na carreira, não aqui).
export function useHasManual(): boolean {
  const [manualCol, setManualCol] = useState(false)
  const [, bump] = useState(0) // re-render em troca de conta pra reler myApoioPerk()
  useEffect(() => {
    let alive = true
    const check = async (email?: string | null) => {
      bump(n => n + 1)
      const em = (email ?? '').toLowerCase()
      if (!em) { if (alive) setManualCol(false); return }
      try {
        const { data } = await supabase.from('user_colors').select('manual').eq('email', em).maybeSingle()
        if (alive) setManualCol((data as { manual?: boolean } | null)?.manual === true)
      } catch { if (alive) setManualCol(false) } // coluna ainda não existe / rede: cai no Lenda
    }
    supabase.auth.getUser().then(({ data }) => check(data?.user?.email), () => {})
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => check(s?.user?.email))
    return () => { alive = false; sub.subscription.unsubscribe() }
  }, [])
  // 🎮 o Modo Manual vem no Craque (prata) e no Lenda (ouro); ou pelo selo `manual`
  // avulso. Promessa (roxo) é só cor.
  const tier = myApoioPerk()?.tier
  return manualCol || tier === 'prata' || tier === 'ouro'
}

// ✉️ TRAVA DE E-MAIL (04/08): o Supabase avisou de bounce alto — e-mail digitado
// errado no cadastro (gmail.con, gmai.com…) faz o "esqueci a senha" voltar e
// arrisca o envio de e-mail do jogo inteiro. Corrige os erros clássicos com
// sugestão e barra domínio temporário ANTES de criar a conta.
// Devolve null = ok, ou a mensagem de erro pra mostrar na tela.
const DOM_CERTO: Record<string, string> = {
  'gmail.con': 'gmail.com', 'gmail.co': 'gmail.com', 'gmail.com.br': 'gmail.com', 'gmail': 'gmail.com',
  'gmai.com': 'gmail.com', 'gmial.com': 'gmail.com', 'gnail.com': 'gmail.com', 'gamil.com': 'gmail.com',
  'gemail.com': 'gmail.com', 'gmaill.com': 'gmail.com', 'gmail.om': 'gmail.com', 'gmail.cm': 'gmail.com', 'gmail.comm': 'gmail.com',
  'hotmail.con': 'hotmail.com', 'hotmal.com': 'hotmail.com', 'hotmial.com': 'hotmail.com', 'hotmail': 'hotmail.com',
  'homail.com': 'hotmail.com', 'hotmails.com': 'hotmail.com', 'hotmail.co': 'hotmail.com',
  'outlook.con': 'outlook.com', 'outlok.com': 'outlook.com', 'outlook': 'outlook.com',
  'iclod.com': 'icloud.com', 'icloud.con': 'icloud.com', 'icloud': 'icloud.com',
  'yahoo.con': 'yahoo.com', 'yaho.com': 'yahoo.com', 'yahoo': 'yahoo.com',
}
const DOM_TEMP = ['temp-mail', 'tempmail', 'mailinator', '10minutemail', 'guerrillamail', 'yopmail', 'trashmail', 'sharklasers', 'getnada', 'dispostable', '.temp']
export function emailProblema(email: string): string | null {
  const em = email.trim().toLowerCase()
  const partes = em.split('@')
  if (partes.length !== 2 || !partes[0]) return 'Esse e-mail não parece completo — confere se tem @ e o final (ex.: nome@gmail.com).'
  const dom = partes[1]
  const certo = DOM_CERTO[dom]
  if (certo) return `Confere o final do e-mail: você escreveu @${dom} — não seria @${certo}? 🧐`
  if (DOM_TEMP.some(t => dom.includes(t))) return 'E-mail temporário não vale: se esquecer a senha, você perde a conta (e as cartas) pra sempre. Usa teu e-mail de verdade.'
  if (!/^[^\s@]+\.[^\s@]{2,}$/.test(dom)) return 'O final do e-mail parece incompleto (ex.: @gmail.com) — dá uma conferida.'
  return null
}
// selo pronto pra colar no fim do nome (' 👑', ' 👑🖋️' pra fundador, ou '').
// O 🖋️ vem GRUDADO no 👑 — quem procura o 👑 no nome (perkFromSelo etc.)
// continua achando, então cor/tier não mudam em nada.
export function apoioSelo(): string {
  const p = myApoioPerk()
  if (!p || !p.selo) return ''
  return ` ${p.selo}${myFundadorN() != null ? '🖋️' : ''}`
}

// nome com o selo garantido (sem duplicar — saves antigos já podem ter o emoji)
export function apoioName(name: string): string {
  const p = myApoioPerk()
  if (!p || !p.selo || name.includes(p.selo)) return name
  return `${name} ${p.selo}${myFundadorN() != null ? '🖋️' : ''}`
}

// tira emoji/pictogramas dos nomes digitados (cadastro, sala, time): os selos
// 💎⭐👑 são EXCLUSIVOS de quem apoia — ninguém "se promove" digitando emoji.
export function stripEmoji(s: string): string {
  // \u2063 = selo INVIS\u00CDVEL do tier verde (ver APOIO_PERKS) \u2014 tem que sair
  // daqui tamb\u00E9m, sen\u00E3o dava pra "forjar" a cor verde digitando esse caractere
  // escondido no pr\u00F3prio nome (mesma trava que j\u00E1 existe pros selos vis\u00EDveis).
  return s.replace(/[\p{Extended_Pictographic}\u{1F1E6}-\u{1F1FF}\u{1F3FB}-\u{1F3FF}\u200D\uFE0F\uFE0E\u20E3\u2063]/gu, '')
}

// ── BRILHO ────────────────────────────────────────────────────────────────
// keyframes globais injetados UMA vez — qualquer tela usa sem <style> local.
const APOIO_CSS = '@keyframes apoioSheen{0%{transform:translateX(-160%) skewX(-18deg)}100%{transform:translateX(560%) skewX(-18deg)}}'
  + '@keyframes apoioTextShine{0%{background-position:0% center}100%{background-position:200% center}}'
if (typeof document !== 'undefined' && !document.getElementById('apoio-css')) {
  const el = document.createElement('style')
  el.id = 'apoio-css'
  el.textContent = APOIO_CSS
  document.head.appendChild(el)
}

// faixa de luz que varre o elemento (o pai precisa de position:relative +
// overflow:hidden — ou use apoioBox() no style do pai).
export function ApoioSheen({ holo, dur = 3.6 }: { holo: number; dur?: number }) {
  if (holo <= 0) return null
  return <div style={{ position: 'absolute', top: '-60%', bottom: '-60%', left: 0, width: '30%',
    background: `linear-gradient(105deg,transparent,rgba(255,255,255,${(holo * 0.55).toFixed(2)}),transparent)`,
    animation: `apoioSheen ${dur}s ease-in-out infinite`, pointerEvents: 'none', zIndex: 1 }} />
}

// style pro PAI que vai receber o degradê + a varredura (junta com o resto)
export function apoioBox(perk: ApoioPerk): React.CSSProperties {
  return { background: perk.grad, position: 'relative', overflow: 'hidden' }
}

// texto com o degradê da categoria passando por dentro das letras (nome
// dourado brilhando nas tabelas, placar, etc). Sem holo, só a cor sólida.
export function apoioText(perk: ApoioPerk): React.CSSProperties {
  if (perk.holo <= 0) return { color: perk.solid }
  return { background: perk.grad, backgroundSize: '200% auto', WebkitBackgroundClip: 'text',
    backgroundClip: 'text', color: 'transparent', animation: 'apoioTextShine 3s linear infinite' }
}

// marca d'água das PRÉVIAS (o gostinho do dourado nas abas): deixa claro que
// é modelo de teste — a cor de verdade vem pelo APOIE.
export function ApoioPreviewMark() {
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 3, pointerEvents: 'none', display: 'flex', flexDirection: 'column', justifyContent: 'space-around', overflow: 'hidden' }}>
      {[0, 1, 2].map(i => (
        <p key={i} style={{ transform: 'rotate(-16deg)', textAlign: 'center', fontWeight: 900, fontSize: 20, color: 'rgba(0,0,0,.22)', letterSpacing: 2, whiteSpace: 'nowrap', margin: 0, fontFamily: 'Oswald, sans-serif', textTransform: 'uppercase' }}>✨ prévia · modelo de teste ✨</p>
      ))}
    </div>
  )
}

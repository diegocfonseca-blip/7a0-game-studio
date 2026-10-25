// 🧠 MOTOR 2D v2 — (C) inteligência COLETIVA. A formação é REFERÊNCIA flexível (um bloco que sobe, desce, estreita e desliza
// com a bola), e cada jogador ganha um PAPEL a cada 0,25 s: com a bola o time dá 2 opções de passe em ângulo, o atacante
// infiltra entre os zagueiros, o lateral que apoia ultrapassa; sem a bola, UM pressiona, UM cobre, os zagueiros marcam e
// seguram a linha, o resto guarda a zona. Ninguém corre todo mundo atrás da bola.
import { deCostas, AREA_LARG, AREA_PROF, L, W, clamp, dist, frente, fundo, len, linhaAtaque, valor, yDe, aoSegmento } from './fisica'
import type { Atleta, Lado } from './tipos'
import type { Motor2 } from './motor'

/** quanto o posicionamento médio do time adianta a leitura do passe rival (menor = pesa mais) */
const LEITURA = 120

export interface Bloco { tras: number; frente: number; largura: number; desliza: number }

/** onde o bloco do time QUER estar (linha de trás e da frente, em metros do PRÓPRIO gol) */
export function blocoDesejado(m: Motor2, lado: Lado): Bloco {
  const b = m.bola, bProf = fundo(lado, b.y), tac = m.tatica[lado], ataca = m.posseLado === lado
  let tras: number, fr: number
  // (jogo corrido em 1:30: o time que ataca sobe mais e mais aberto; o que defende fica mais fundo e mais estreito — tem espaço entre as linhas)
  // (a linha da frente vai mais fundo quando a bola chega no último terço: o centroavante espera na área, não na entrada dela)
  // (no último terço o time inteiro sobe: a zaga fica a ~16 m da bola, no meio-campo — assim 5 ou 6 chegam perto da área, não 2)
  // 📐 25/10 (filmado no 2D: 20 jogadores num quadrado de 40×30 m em volta da bola, o resto do campo vazio): o bloco tem o
  // TAMANHO de um time de verdade. Quem ataca: a zaga fica perto do meio-campo (não dentro do bloco rival), a frente na área.
  if (ataca) { tras = clamp(bProf - (bProf > 60 ? 28 : 26) + 4 * tac, 16, 56); fr = clamp(bProf + (bProf > 60 ? 27 : 20) + 3 * tac, tras + 30, 99) }
  // (defendendo, a linha de trás NÃO entra na pequena área: com a bola a 30 m ela fica na entrada da grande área (~16 m), como
  // uma defesa de verdade — antes ia pra 6 m do gol e os atacantes ficavam encostados no goleiro. Comprimento ~26 m: meio e zaga
  // em duas linhas de verdade, com o espaço "entre linhas" que o meia de verdade procura)
  else { tras = clamp(bProf * 0.5 + 4 * tac, 8, 40); fr = clamp(tras + 23, 28, 64) } // (23 m: zaga e meio a ~12 m, como um time compacto de verdade)
  return { tras, frente: fr, largura: ataca ? 1.0 : 0.82, desliza: (b.x - 34) * (ataca ? 0.18 : 0.36) }
}
/** o bloco anda liso (no máx. ~7 m/s): troca de posse vira transição, não pulo */
export function andaBloco(m: Motor2, dt: number) {
  for (const l of [0, 1] as Lado[]) {
    const d = blocoDesejado(m, l), b = m.bloco[l]
    if (!b) { m.bloco[l] = d; continue }
    const anda = (de: number, para: number, v: number) => de + clamp(para - de, -v * dt, v * dt)
    // (quem perdeu a bola demora pra se recompor: a linha volta a ~5 m/s — é na transição que nasce o ataque)
    const v = m.posseLado === l ? 7.5 : 5
    b.tras = anda(b.tras, d.tras, v); b.frente = anda(b.frente, d.frente, v); b.largura = anda(b.largura, d.largura, 0.6); b.desliza = anda(b.desliza, d.desliza, 9)
  }
}
/** o lugar do jogador na formação AGORA */
export function ancora(m: Motor2, p: Atleta): { x: number; y: number } {
  const b = m.bloco[p.lado] ?? blocoDesejado(m, p.lado), ataca = m.posseLado === p.lado
  let dep = p.dep
  // (25/10, medido: o lateral passava 7% do tempo no campo de ataque e dava 4% dos toques — com a posse ele sobe de verdade, como ala)
  if (p.grupo === 'LAT') dep = ataca ? 0.42 + 0.35 * p.tend.apoia : 0.03
  let prof = b.tras + (b.frente - b.tras) * dep
  // (sem a bola, o ataque NÃO desce pro bloco: fica uns 12 m à frente dele esperando o contra-ataque — o bloco é de 7 + goleiro.
  // Dez atrás da linha da bola num jogo de 1:30 não deixava ninguém chegar na área)
  if (!ataca && p.grupo === 'ATA') prof = Math.min(b.frente + 12, 68)
  // (atacando, o atacante fica no OMBRO do último zagueiro — nunca atrás dele, que é impedimento e bola perdida)
  if (ataca && (p.grupo === 'ATA' || (p.grupo === 'MEI' && dep > 0.6))) prof = Math.min(prof, L - linhaImpedimento(m, p.lado) - 1)
  let x = 34 + (p.bx - 34) * b.largura + b.desliza
  // ponta abre o campo quando o time ataca…
  if (ataca && p.grupo === 'ATA' && (p.bx < 22 || p.bx > 46)) {
    x = p.bx < 34 ? 7 : W - 7
    // …e no último terço o ponta do lado OPOSTO ao da bola fecha pro segundo pau (é ele que aparece na área pra concluir o
    // cruzamento); o do lado da bola segura a largura. Antes os dois pontas ficavam colados na linha e a área ficava vazia
    const bProf = frente(p.lado, m.bola.y)
    if (bProf < 36 && (m.bola.x - 34) * (p.bx - 34) < 0) x = p.bx < 34 ? 26 : W - 26
  }
  // 🎯 25/10 (medido: com a bola a menos de 30 m do gol só 0,27 atacante estava na área — o centroavante ficava a 24 m, trotando atrás
  // da linha): no último terço o CENTROAVANTE mora entre os zagueiros e o meia que chega vai pra marca do pênalti. É aí que o
  // cruzamento, o corte pra trás e a enfiada encontram alguém
  if (ataca && frente(p.lado, m.bola.y) < 38) {
    if (p.grupo === 'ATA' && p.bx >= 22 && p.bx <= 46) x = 34 + (x - 34) * 0.3 + (m.bola.x - 34) * 0.12
    if (p.grupo === 'MEI' && dep > 0.6) { x = 34 + (x - 34) * 0.55; prof = Math.min(prof, L - 12) }
  }
  return { x: clamp(x, 3, W - 3), y: yDe(p.lado, clamp(prof, 2, 101)) }
}
/** onde fica o goleiro: na linha entre a bola e o meio do gol, mais adiantado quanto mais longe a bola */
export function lugarGoleiro(m: Motor2, gk: Atleta): { x: number; y: number } {
  const lin = linhaAtaque((1 - gk.lado) as Lado), b = m.bola
  const dx = b.x - 34, dy = b.y - lin, d = len(dx, dy) || 1
  const dg = d > 50 ? 9 + gk.at.saida * 0.04 : clamp(1.6 + d * 0.07, 1.6, 6)
  return { x: clamp(34 + (dx / d) * dg, 30.8, 37.2), y: lin + (dy / d) * dg }
}
/** a linha de impedimento de quem ATACA `lado`: o penúltimo adversário (em metros da linha de fundo atacada) */
export function linhaImpedimento(m: Motor2, lado: Lado): number {
  const fs = m.atl.filter(a => a.lado !== lado).map(a => frente(lado, a.y)).sort((a, b) => a - b)
  return Math.min(fs[1] ?? 0, frente(lado, m.bola.y), L / 2)
}

// direções do "anel" de opções (no referencial do time: +y = pra frente) — sem trigonometria
const ANEL: [number, number][] = [[0, 1], [0.7, 0.7], [-0.7, 0.7], [1, 0], [-1, 0], [0.7, -0.7], [-0.7, -0.7]]

/** escolhe os papéis dos dois times (roda a cada 0,25 s) */
export function planeja(m: Motor2) {
  for (const l of [0, 1] as Lado[]) {
    const time = m.atl.filter(a => a.lado === l), adv = m.atl.filter(a => a.lado !== l)
    for (const p of time) { p.papel = p.grupo === 'GOL' ? 'goleiro' : 'forma'; p.marca = null }
    if (m.parada) { for (const p of time) if (p.grupo !== 'GOL' || m.parada.cobrador === p) p.papel = 'cobranca'; continue }
    const d = m.bola.dono, lance = m.bola.lance, comBola = m.posseLado === l
    const alvoBola = d ? { x: d.x, y: d.y } : m.pontoBola()
    const tempo = (p: Atleta) => dist(p, alvoBola) / m.vmax(p)
    const campo = time.filter(p => p.grupo !== 'GOL' && p !== d)
    // (passe do rival: o defensor REAGE — leva ~0,35 s pra ler o passe; antes disso ninguém sai atrás da bola. Sem isso o
    // rival corria no instante do passe, com previsão perfeita, e cortava 1 em cada 5 passes)
    // (22/10: o time bom LÊ o passe antes — a defesa de lendas sai na bola em ~0,15 s, a de várzea em ~0,5 s)
    const leitura = clamp(0.35 - (campo.reduce((s2, p) => s2 + p.at.posicionamento, 0) / Math.max(1, campo.length) - 65) / LEITURA, 0.1, 0.55)
    const reage = !lance || lance.tipo === 'chute' || lance.de.lado === l || m.t - lance.t0 > leitura
    if (!d && reage && (!lance || lance.de.lado !== l || lance.tipo === 'chute')) {
      // 🏃 bola solta / passe do RIVAL: o mais rápido até ela vai (1 só — 2 se ela está perto do nosso gol)
      const ord = [...campo].sort((a, b) => tempo(a) - tempo(b))
      const quantos = fundo(l, alvoBola.y) < 30 ? 2 : 1
      ord.slice(0, quantos).forEach(p => (p.papel = 'bola_solta'))
    }
    if (lance && !d && lance.de.lado === l && lance.para && lance.tipo !== 'chute') lance.para.papel = 'recebe'
    if (comBola && d && d.lado === l) {
      // 🤝 2 opções em ângulo perto de quem tem a bola
      // (no último terço o atacante NÃO vem buscar jogo: ele é a profundidade — fica na área/no ombro do zagueiro. Antes o
      // "apoio" pegava os 3 mais perto, quase sempre os atacantes, e os puxava pra perto da bola: ninguém sobrava na área)
      const fundoAtaque = frente(l, d.y) < 45
      const perto = campo.filter(p => p.papel === 'forma' && !(fundoAtaque && (p.grupo === 'ATA' || frente(l, p.y) < frente(l, d.y) - 10))).sort((a, b) => dist(a, d) - dist(b, d)).slice(0, 3)
      const usados: { x: number; y: number }[] = []
      for (const s of perto) { const pt = melhorOpcao(m, d, s, adv, usados); if (pt) { usados.push(pt); s.papel = 'opcao'; m.opcaoDe.set(s, pt) } }
      // 🏃 infiltração entre os zagueiros (quem gosta de atacar o espaço), com o portador de frente pro jogo
      const linha = linhaImpedimento(m, l)
      for (const p of campo) {
        if (p.papel !== 'forma' || (p.grupo !== 'ATA' && p.grupo !== 'MEI')) continue
        const fica = m.corrida.get(p)
        if (fica && fica.ate > m.t) { p.papel = 'infiltra'; continue }
        if (frente(l, d.y) > 60 || frente(l, p.y) < linha - 1.5) continue // (só começa a corrida em posição legal, com a bola já no campo deles)
        // (25/10: a corrida sai quando o passador está DE FRENTE pro jogo e pode lançar — é aí que o atacante ataca o espaço; com ele de
        // costas, quase ninguém sai, porque a bola não vai chegar)
        const deFrente = deCostas(d, 0, l === 0 ? -1 : 1) < 0.25
        if (m.r() < p.tend.infiltra * (deFrente ? 0.45 : 0.06)) {
          const zags = adv.filter(a => a.grupo === 'DEF' || a.grupo === 'LAT').sort((a, b) => Math.abs(a.x - p.x) - Math.abs(b.x - p.x)).slice(0, 2)
          const gx = zags.length === 2 ? (zags[0].x + zags[1].x) / 2 : p.x
          const alvo = { x: clamp(p.x * 0.4 + gx * 0.6, 8, W - 8), y: yDe(((1 - l) as Lado), clamp(linha - 8, 7, 60)) } // (nunca mais fundo que 7 m do gol: dali é bola do goleiro)
          // (yDe do RIVAL = metros a partir do gol que eu ataco)
          m.corrida.set(p, { ate: m.t + 2.6, alvo }); p.papel = 'infiltra'
        }
      }
      // 🎯 ATAQUE À ÁREA NO CRUZAMENTO (25/10, Diego: "os cruzamentos"): bola na ponta, no último terço → os atacantes e o meia que
      // chega atacam os espaços da área: 1º PAU, 2º PAU e a MARCA DO PÊNALTI (pro corte/rebote) — igual ao escanteio ensaiado,
      // mas com a bola rolando. Sem isso o cruzamento caía em quem estivesse parado
      if ((d.x < 20 || d.x > W - 20) && frente(l, d.y) < 34) {
        const sx = d.x < 34 ? -1 : 1, lin = linhaAtaque(l), fyA = l === 0 ? 1 : -1
        const PONTOS: [number, number][] = [[34 + sx * 3, 6], [34 - sx * 4, 7.5], [34, 11.5]]
        const vao = campo.filter(p => (p.grupo === 'ATA' || (p.grupo === 'MEI' && p.dep > 0.6)) && p.papel !== 'opcao').sort((a, b) => frente(l, a.y) - frente(l, b.y)).slice(0, 3)
        vao.forEach((p, i) => { const [x, y] = PONTOS[i]; m.corrida.set(p, { ate: m.t + 0.6, alvo: { x, y: lin + fyA * y } }); p.papel = 'infiltra' })
      }
      // ↗️ lateral que apoia passa por fora quando a bola está do lado dele
      for (const p of campo) {
        if (p.grupo !== 'LAT' || p.papel !== 'forma' || p.tend.apoia < 0.35) continue
        if (Math.abs(d.x - p.bx) < 24 && frente(l, d.y) < 62) {
          p.papel = 'ultrapassa'
          m.opcaoDe.set(p, { x: p.bx < 34 ? 5 : W - 5, y: yDe(((1 - l) as Lado), clamp(frente(l, d.y) - 11, 6, 90)) })
        }
      }
    } else if (!comBola || !d) {
      // 🛡️ sem a bola: 1 pressiona, 1 cobre, zagueiros marcam
      if (d && d.lado !== l && d.grupo !== 'GOL') {
        const livres = campo.filter(p => p.papel === 'forma')
        const ord = [...livres].sort((a, b) => tempo(a) - tempo(b))
        const pres = ord[0]
        if (pres) pres.papel = 'pressiona'
        // pressão alta (tática "pra cima"): um segundo vai junto quando a bola está no campo deles
        if (m.tatica[l] > 0 && fundo(l, d.y) > 60 && ord[1]) ord[1].papel = 'pressiona'
        // 🔥 GATILHO DE PRESSÃO (25/10): o rival DE COSTAS pro jogo, encostado na lateral ou que ACABOU de receber → o segundo aperta junto
        // (é o momento em que ele não consegue sair jogando pra frente)
        const gatilho = deCostas(d, 0, d.lado === 0 ? -1 : 1) > 0.5 || d.x < 8 || d.x > W - 8 || m.t - (m.donoDesde ?? -9) < 0.6
        if (gatilho && ord[1] && ord[1].papel === 'forma' && dist(ord[1], d) < 13) ord[1].papel = 'pressiona'
        const cob = ord.find(p => p.papel === 'forma' && (p.grupo === 'MEI' || p.grupo === 'DEF'))
        if (cob) cob.papel = 'cobre'
      }
      // 🧲 MARCAÇÃO POR ZONA, COLADA SÓ PERTO DA BOLA (25/10): o zagueiro marca o atacante que entrou na zona dele quando a bola
      // pode chegar nele (a até ~28 m da bola, ou dentro da área); o atacante do lado oposto do campo é só vigiado da posição.
      // Antes era homem a homem no campo inteiro e os dois times viravam um bolo em volta da bola
      const pertoDaBola = (a: Atleta) => dist(a, alvoBola) < 28 || (fundo(l, a.y) < AREA_PROF + 3 && Math.abs(a.x - 34) < AREA_LARG + 4)
      const atacantes = adv.filter(a => (a.grupo === 'ATA' || (a.grupo === 'MEI' && fundo(l, a.y) < 35)) && pertoDaBola(a))
      for (const z of campo.filter(p => (p.grupo === 'DEF' || p.grupo === 'LAT') && p.papel === 'forma')) {
        const an = ancora(m, z)
        const alvo = atacantes.filter(a => !time.some(t => t.marca === a)).sort((a, b) => dist(a, an) - dist(b, an))[0]
        if (alvo && dist(alvo, an) < (z.grupo === 'LAT' ? 11 : 14)) { z.papel = 'marca'; z.marca = alvo }
      }
      // 🧲 o meio-campo também marca: cada meia livre pega o meia rival mais perto da zona dele (até 10 m, e só do lado da bola).
      // É daí que nasce o duelo — o marcador já está a 3 m quando a bola chega, não a 8 m correndo atrás
      const meias = adv.filter(a => a.grupo === 'MEI' && fundo(l, a.y) < 60 && dist(a, alvoBola) < 22)
      for (const z of campo.filter(p => p.grupo === 'MEI' && p.papel === 'forma')) {
        const an = ancora(m, z)
        const alvo = meias.filter(a => !time.some(t => t.marca === a)).sort((a, b) => dist(a, an) - dist(b, an))[0]
        if (alvo && dist(alvo, an) < 10) { z.papel = 'marca'; z.marca = alvo }
      }
    }
  }
}

/** um ponto LIVRE pra receber, perto do portador, em ângulo, de preferência pra frente */
function melhorOpcao(m: Motor2, d: Atleta, s: Atleta, adv: Atleta[], usados: { x: number; y: number }[]) {
  const fy = d.lado === 0 ? -1 : 1, an = ancora(m, s)
  // (25/10: com o portador APERTADO, o apoio vem PERTO — 6–10 m, pra tabela; livre, as opções se abrem mais longe)
  let dRival = 9
  for (const a of adv) dRival = Math.min(dRival, dist(a, d))
  const aperto = clamp(1 - (dRival - 1) / 6, 0, 1)
  let melhor: { x: number; y: number } | null = null, nota = -9
  for (const r of [6, 10, 15, 20]) for (const [ux, uy] of ANEL) { // (25/10: um anel perto, de 6 m — a opção de apoio curto)
    const pt = { x: clamp(d.x + ux * r, 3, W - 3), y: clamp(d.y + uy * fy * r, 3, L - 3) }
    if (usados.some(u => dist(u, pt) < 7)) continue
    let livre = 9, linha = 5
    for (const a of adv) { livre = Math.min(livre, dist(a, pt)); linha = Math.min(linha, aoSegmento(a, d, pt).q) }
    const n = (livre / 9) * 0.5 + (linha / 5) * 0.45 + valor(d.lado, pt.x, pt.y) * 1.1 - dist(s, pt) / 45 - dist(pt, an) / 70 - (r > 11 ? aperto * 0.18 : 0)
    if (n > nota) { nota = n; melhor = pt }
  }
  return melhor
}

/** o alvo de movimento de cada jogador conforme o papel (roda todo passo — é barato) */
export function alvoDe(m: Motor2, p: Atleta): { x: number; y: number; v: number } {
  const vmax = m.vmax(p)
  // 🚶 25/10 (Diego: *"jogadores atuando igual profissionais mesmo"*): ritmo de GENTE. Antes todo mundo corria (5,2–7,4 m/s) até pra
  // se ajeitar 3 m na posição — média de 4,8 m/s e quase ninguém andando (o real é ~2 m/s, com muita caminhada e trote). Agora:
  // perto do lugar anda, a alguns metros trota, longe corre; sprint só pra quem pressiona/recebe/infiltra (eles não passam por aqui)
  const ritmo = (d: number) => d < 2.5 ? 1.5 : d < 6 ? 2.7 : d < 12 ? 4.4 : d < 20 ? 6.0 : 7.4
  const vaiPara = (pt: { x: number; y: number }, pressa = 1) => ({ x: pt.x, y: pt.y, v: Math.min(vmax, ritmo(dist(p, pt)) * pressa) })
  switch (p.papel) {
    case 'goleiro': {
      const lance = m.bola.lance
      // 🧤 chute vindo: vai pro ponto onde a bola cruza a linha dele (depois do tempo de reação)
      if (lance && (lance.tipo === 'chute' || lance.tipo === 'cabeceio_gol') && lance.de.lado !== p.lado && !lance.defendido) {
        const reage = 0.11 + (100 - p.at.reflexo) * 0.004
        if (m.t - lance.t0 > reage && Math.abs(m.bola.vy) > 0.5) {
          const tt = (p.y - m.bola.y) / m.bola.vy
          // (ele se desloca de lado como gente — ~4,5 m/s; o alcance do mergulho é o `alc` de `goleiroNoChute`. Antes ele corria a 8,5 m/s
          // pro ponto do cruzamento e chegava em TODO chute, inclusive os de 30 m no cantinho)
          if (tt > 0) return { x: clamp(m.bola.x + m.bola.vx * tt, 29.5, 38.5), y: p.y, v: 3.6 + p.at.reflexo * 0.012 }
        }
        return { x: p.x, y: p.y, v: 0 }
      }
      // bola solta perto dele, na área dele, e ele chega primeiro: sai e pega
      if (!m.bola.dono && m.bola.h < 2.2 && fundo(p.lado, m.bola.y) < AREA_PROF - 1 && Math.abs(m.bola.x - 34) < AREA_LARG - 3 && m.goleiroSai(p)) return { x: m.bola.x, y: m.bola.y, v: vmax }
      // 🧤 CARA A CARA (Diego 20/10): atacante vindo sozinho pro gol → sai pra fechar o ângulo e fica em pé (quem tem `saida`
      // alta sai mais; o `goleiro_linha` adora)
      const cc = m.caraACara(p)
      if (cc) { const lin = linhaAtaque((1 - p.lado) as Lado), dx = cc.x - 34, dy = cc.y - lin, d = len(dx, dy) || 1, sai = clamp(d * (0.3 + p.at.saida * 0.0025), 2.5, 10); return { x: clamp(34 + (dx / d) * sai, 28, 40), y: lin + (dy / d) * sai, v: vmax } }
      return vaiPara(lugarGoleiro(m, p))
    }
    case 'pressiona': {
      const d = m.bola.dono
      if (d) { const fy = p.lado === 0 ? 1 : -1; return { x: d.x, y: d.y + fy * 0.7, v: vmax } } // (fica do lado do gol dele)
      return { ...m.pontoBola(), v: vmax }
    }
    case 'cobre': {
      const b = m.bola.dono ?? m.bola, g = { x: 34, y: linhaAtaque((1 - p.lado) as Lado) }, d = dist(b, g) || 1
      return vaiPara({ x: b.x + ((g.x - b.x) / d) * 8, y: b.y + ((g.y - b.y) / d) * 8 }, 1.15)
    }
    case 'marca': {
      const a = p.marca!, g = { x: 34, y: linhaAtaque((1 - p.lado) as Lado) }, d = dist(a, g) || 1
      // (colado quando a bola está perto: 1,8 m do lado do gol — é a distância em que a bola chegando vira duelo; com a bola longe,
      // dá 3 m de folga e guarda a zona — a marcação de verdade aperta quando o passe pode vir)
      const folga = dist(a, m.bola) < 18 ? 1.8 : 3.0
      const alvo = { x: a.x + ((g.x - a.x) / d) * folga, y: a.y + ((g.y - a.y) / d) * folga }
      // 📏 A LINHA É DO BLOCO (25/10): o zagueiro que marca não SOBE atrás do atacante além da linha de trás do time — ele segura a
      // linha e o atacante é que fica preso nela. Antes o atacante travava na linha de impedimento (= o marcador) e o marcador travava
      // 2 m à frente do atacante: os dois ficavam abraçados a 18 m do gol e a área ficava vazia (medido: 0,3 atacante na área)
      if (p.grupo === 'DEF' || p.grupo === 'LAT') { const lim = (m.bloco[p.lado]?.tras ?? 16) + 1.5; if (fundo(p.lado, alvo.y) > lim) alvo.y = yDe(p.lado, lim) }
      return vaiPara(alvo, 1.15)
    }
    case 'opcao': case 'ultrapassa': return vaiPara(m.opcaoDe.get(p) ?? ancora(m, p), p.papel === 'ultrapassa' ? 1.25 : 1.1)
    case 'infiltra': { const c = m.corrida.get(p); return c ? { ...c.alvo, v: vmax } : vaiPara(ancora(m, p)) }
    case 'recebe': return { ...m.pontoBola(p), v: vmax }
    case 'bola_solta': return { ...m.pontoBola(p), v: vmax }
    case 'cobranca': return m.parada ? m.lugarNaCobranca(p) : vaiPara(ancora(m, p))
    default: {
      // (no último terço, quem ataca vai pro lugar dele com PRESSA — o atacante que troteia pra área chega depois do cruzamento)
      // (e quem defende perto do próprio gol volta pro lugar CORRENDO — a zaga que troteia deixa a linha 4 m mais alta que o bloco)
      const urgente = (m.posseLado === p.lado && frente(p.lado, m.bola.y) < 40 && (p.grupo === 'ATA' || p.grupo === 'MEI')) || (m.posseLado !== p.lado && fundo(p.lado, m.bola.y) < 40)
      return vaiPara(ancora(m, p), urgente ? 1.5 : 1)
    }
  }
}

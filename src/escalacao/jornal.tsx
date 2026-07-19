// ─── 📰 O MARTELO — Jornal da Temporada (carreira pirâmide) ──────────────
// Capa de jornal gerada no FIM de cada temporada: manchete ÚNICA pra cada uma
// das 80 posições da pirâmide (Série A a D × 20 colocações), os números do seu
// time, e "Os Donos da Temporada" (campeão + artilheiro de cada série + Copa).
// `{t}` nas manchetes é trocado pelo nome do time do jogador.
import { useState } from 'react'
import type { SimTeam, CopaResult, SeasonScorer, Div } from './pyramidseason'

const INK = '#0C0C0C'
const GOLD = '#FFC400'
const J_DIVS: Div[] = ['A', 'B', 'C', 'D']
const J_DIV_NAME: Record<Div, string> = { A: 'Série A', B: 'Série B', C: 'Série C', D: 'Série D' }
const J_DIV_COLOR: Record<Div, string> = { A: '#B8892B', B: '#3E8E4E', C: '#9A7B33', D: '#7A7460' }
const SERIF = { fontFamily: "Georgia, 'Times New Roman', serif" } as const
const COND = { fontFamily: 'Oswald, sans-serif' } as const

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
    { h: 'MILAGRE: {t} ESCAPA POR UM FIO', s: '17º — a matemática salvou o que o futebol não conseguiu.' },
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
    { h: 'POR UM TRIZ: {t} NÃO CAI', s: '17º na Série B — sobreviveu no critério, na fé e no desespero.' },
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
    { h: 'SUSTO GIGANTE: {t} QUASE CAI', s: '17º — a um ponto do abismo. A diretoria já marcou reunião.' },
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

// ─── a capa ──────────────────────────────────────────────────────────────
export function SeasonJornal({ me, tables, copa, divTop, seasonNo }: {
  me: { div: Div; pos: number; team: string }
  tables: Record<Div, SimTeam[]>
  copa: CopaResult | null
  divTop: Record<Div, SeasonScorer | undefined>
  seasonNo: number
}) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const mine = tables[me.div]?.find(t => t.you)
  const hl = seasonHeadline(me.div, me.pos, me.team)
  const stamp = stampOf(me.div, me.pos)

  async function share() {
    const txt = `📰 O MARTELO — Temporada ${seasonNo}\n\n"${hl.h}"\n${hl.s}\n\n${me.team}: ${me.pos}º na ${J_DIV_NAME[me.div]}\n\n⚽ Joga você também: leilaolegends.com`
    try {
      if (navigator.share) { await navigator.share({ text: txt }); return }
      throw new Error('no-share')
    } catch {
      try { await navigator.clipboard.writeText(txt); setCopied(true); setTimeout(() => setCopied(false), 2500) } catch { /* ignora */ }
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
      {/* cabeçalho do jornal */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `4px double ${INK}`, paddingBottom: 6 }}>
        <div style={{ ...SERIF, fontWeight: 900, fontSize: 26, letterSpacing: 1 }}>O <span style={{ color: '#B23A2A' }}>MARTELO</span></div>
        <div style={{ textAlign: 'right', fontSize: 8.5, fontWeight: 800, lineHeight: 1.35, color: '#3a3527' }}>EDIÇÃO Nº {seasonNo}<br />TEMPORADA {seasonNo} · {J_DIV_NAME[me.div].toUpperCase()}<br />PREÇO: 1 MOEDA</div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 8.5, fontWeight: 900, letterSpacing: 1.5, textTransform: 'uppercase', borderBottom: `1.5px solid ${INK}`, padding: '3px 1px', color: '#3a3527' }}>
        <span>⚽ O DIÁRIO DO LEILÃO LEGENDS</span><span>FIM DE TEMPORADA</span>
      </div>

      {/* manchete (única pra cada uma das 80 posições) */}
      <h2 style={{ ...SERIF, fontWeight: 900, fontSize: 25, lineHeight: 1.02, margin: '9px 0 4px', letterSpacing: -0.5, color: INK }}>{hl.h}</h2>
      <p style={{ fontSize: 11.5, fontWeight: 700, fontStyle: 'italic', color: '#3a3527', margin: '0 0 9px', lineHeight: 1.3 }}>{hl.s}</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9 }}>
        {/* "foto" */}
        <div style={{ border: `2.5px solid ${INK}`, background: 'radial-gradient(circle at 50% 35%, #2ea457, #123f22)', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 108, overflow: 'hidden' }}>
          {stamp && <div style={{ position: 'absolute', top: 8, right: -16, transform: 'rotate(18deg)', border: `3px solid ${stamp.color}`, color: stamp.color, fontWeight: 900, fontSize: 11, letterSpacing: 2, padding: '2px 16px', borderRadius: 6, opacity: .9, background: 'rgba(247,241,221,.65)', ...COND }}>{stamp.txt}</div>}
          <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#F7F1DD', border: `3px solid ${INK}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 24, ...COND }}>{me.team.trim()[0]?.toUpperCase() ?? '?'}</div>
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
              <div style={{ flex: 'none', width: 24, height: 24, borderRadius: 7, border: `2.5px solid ${INK}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900, color: '#fff', background: J_DIV_COLOR[d], ...COND }}>{d}</div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 900, lineHeight: 1.1 }}>{champ?.name ?? '—'} <span style={{ fontSize: 8, fontWeight: 900, letterSpacing: 1, textTransform: 'uppercase', color: isYou ? '#b98600' : '#8a8266', marginLeft: 3 }}>campeão{isYou ? ' ⭐ você' : ''}</span></div>
                {art && <div style={{ fontSize: 9.5, fontWeight: 700, color: '#3a3527', marginTop: 1.5 }}>⚽ Artilheiro: <b>{art.name}</b> ({art.teamName}) · {art.goals} gols</div>}
              </div>
            </div>
          )
        })}
        {copa?.champion && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 9px 7px 0', borderTop: '1.5px solid rgba(0,0,0,.12)', background: copa.champion.you ? '#fdf6dd' : undefined }}>
            <div style={{ width: 5, alignSelf: 'stretch', flex: 'none', background: '#F5B301' }} />
            <div style={{ flex: 'none', width: 24, height: 24, borderRadius: 7, border: `2.5px solid ${INK}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, background: '#F5B301' }}>🏆</div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 900, lineHeight: 1.1 }}>{copa.champion.name} <span style={{ fontSize: 8, fontWeight: 900, letterSpacing: 1, textTransform: 'uppercase', color: copa.champion.you ? '#b98600' : '#8a8266', marginLeft: 3 }}>campeão da Copa{copa.champion.you ? ' ⭐ você' : ''}</span></div>
              {copa.topScorer && <div style={{ fontSize: 9.5, fontWeight: 700, color: '#3a3527', marginTop: 1.5 }}>⚽ Artilheiro da Copa: <b>{copa.topScorer.name}</b> ({copa.topScorer.teamName}) · {copa.topScorer.goals} gols</div>}
            </div>
          </div>
        )}
      </div>

      {/* rodapé: compartilhar + fechar */}
      <div style={{ display: 'flex', gap: 8, marginTop: 11 }}>
        <button onClick={share} style={{ flex: 1, background: '#1faa54', color: '#fff', border: `3px solid ${INK}`, borderRadius: 11, padding: 9, fontWeight: 900, fontSize: 13, ...COND, cursor: 'pointer', boxShadow: `3px 3px 0 0 ${INK}` }}>{copied ? '✅ Copiado!' : '📲 Mandar no grupo'}</button>
        <button onClick={() => setOpen(false)} style={{ flex: 'none', background: '#fff', color: INK, border: `3px solid ${INK}`, borderRadius: 11, padding: '9px 14px', fontWeight: 900, fontSize: 13, ...COND, cursor: 'pointer' }}>Fechar</button>
      </div>
    </div>
  )
}

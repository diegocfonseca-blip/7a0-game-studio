// Apresentação V22. Os dados e as notas vêm integralmente de montaEdicao.
import type { EdicaoSala } from './jornal-sala'
import { Escudo } from './escudos'
import ligaArt from './img/jornal-liga-v22.webp'
import copaArt from './img/jornal-copa-v22.webp'
import scorerArt from './img/jornal-artilheiro-v22.webp'
import './jornal-online-visual.css'
import { tr, ordinal } from './lang' // 🌐 BR/EN

export function JornalOnlineVisual({ ed, onCompartilhar, compartilhando }: { ed: EdicaoSala; onCompartilhar: () => void; compartilhando: boolean }) {
  return <article className="jornal-v22" aria-label="O Martelo — edição da sala">
    <header className="jv-masthead">
      <h1>O MARTELO</h1>
      <p>{tr('EDIÇÃO DA SALA · LIGA', 'ROOM EDITION · LEAGUE')}{ed.campeaoCopa ? ` + ${ed.copaNome.toUpperCase()}` : ''}</p>
      <div><span>{tr('O DIÁRIO DO LEILÃO LEGENDS', 'THE LEILÃO LEGENDS DAILY')}</span><span>{ed.nTecnicos} {tr('TÉCNICOS · FIM DE JOGO', 'MANAGERS · FULL TIME')}</span></div>
    </header>
    <h2 className="jv-headline">{ed.manchete}</h2>
    <div className={`jv-stories${!ed.campeaoCopa && !ed.artilheiro ? ' jv-single-story' : ''}`}>
      {ed.campeaoLiga && <figure className="jv-main-story">
        <div className="jv-photo"><img src={ligaArt} alt="Ilustração de uma equipe comemorando um título" /><span className="jv-crest"><Escudo nome={ed.campeaoLiga.nome} size={56} /></span></div>
        <figcaption><small>{tr('CAMPEÃO DA LIGA', 'LEAGUE CHAMPION')}</small><h3>{ed.campeaoLiga.nome}</h3><p>{ed.campeaoLiga.quem && tr(`O time do ${ed.campeaoLiga.quem} · `, `${ed.campeaoLiga.quem}'s team · `)}{ed.campeaoLiga.pts} {tr('pontos', 'points')}</p></figcaption>
      </figure>}
      <div className="jv-side-stories">
        {ed.campeaoCopa && <figure>
          <h3>{tr(`${ed.campeaoCopa.nome} conquista a ${ed.copaNome}`, `${ed.campeaoCopa.nome} wins the ${ed.copaNome}`)}</h3>
          <div className="jv-photo"><img src={copaArt} alt="Ilustração de uma equipe levantando uma copa" loading="lazy" /><span className="jv-crest"><Escudo nome={ed.campeaoCopa.nome} size={40} /></span></div>
          {ed.campeaoCopa.quem && <figcaption>{tr(`O time do ${ed.campeaoCopa.quem}`, `${ed.campeaoCopa.quem}'s team`)}</figcaption>}
        </figure>}
        {ed.artilheiro && <figure>
          <h3>{tr('Artilheiro da sala', 'Room top scorer')}</h3><img src={scorerArt} alt="Chuteira de ouro e figura neutra, sem retrato do jogador" loading="lazy" />
          <figcaption><strong>{ed.artilheiro.nome}</strong><br />{ed.artilheiro.time} · {ed.artilheiro.gols} {tr('gols', 'goals')}</figcaption>
        </figure>}
      </div>
    </div>
    <p className="jv-deck">{ed.linhaFina}</p>
    {ed.lanterna && <p className="jv-lanterna"><strong>{tr('LANTERNA', 'BOTTOM')} · {ed.lanterna.nome}</strong> — {ed.lanterna.quem && `${ed.lanterna.quem} · `}{ed.lanterna.pts} {tr('pontos', 'points')}</p>}
    <section className="jv-editorial" aria-label="As notas da redação">
      <h2>{tr('AS NOTAS DA REDAÇÃO', 'NOTES FROM THE NEWSROOM')}</h2>
      <div className="jv-notes">{ed.linhas.map(l => <article className="jv-note" key={l.id} data-highlight={l.destaque || undefined}>
        <div className="jv-note-crest"><Escudo nome={l.time} size={42} /></div>
        <div><h3>{l.time} <span>· {ordinal(l.pos)} {tr('NA LIGA', 'IN THE LEAGUE')}</span>{l.voce && <small className="jv-you">{tr('VOCÊ', 'YOU')}</small>}</h3>
          <p className="jv-byline">{l.quem && `${l.quem} · `}{l.pts} {tr('pontos', 'points')}</p><p>{l.nota}</p></div>
      </article>)}</div>
    </section>
    <footer className="jv-footer">leilaolegends.com</footer>
    <button className="jv-share" onClick={onCompartilhar} disabled={compartilhando}>{compartilhando ? tr('Montando a imagem…', 'Building the image…') : tr('Compartilhar jornal', 'Share newspaper')}</button>
  </article>
}

// Exportação da MESMA edição, com textos reais, todas as notas e arte separada.
// Não toca no estado da sala e falha de imagem nunca impede o compartilhamento.
export async function buildOnlineSalaBlob(ed: EdicaoSala): Promise<Blob | null> {
  const cv = document.createElement('canvas'), x = cv.getContext('2d')
  if (!x) return null
  const load = (src: string) => new Promise<HTMLImageElement | null>(resolve => {
    const img = new Image(), timeout = setTimeout(() => resolve(null), 2500)
    img.onload = () => { clearTimeout(timeout); resolve(img) }; img.onerror = () => { clearTimeout(timeout); resolve(null) }; img.src = src
  })
  const [liga, copa, scorer] = await Promise.all([load(ligaArt), load(copaArt), load(scorerArt)])
  try { await document.fonts.load('700 60px Oswald') } catch { /* fontes de reserva */ }
  const W = 1080, M = 48, CW = W - M * 2, gap = 26, nw = (CW - gap) / 2
  const osw = 'Oswald, sans-serif', ser = 'Georgia, serif'
  const wrap = (t: string, font: string, width: number) => {
    x.font = font; const lines: string[] = []; let line = ''
    for (const word of t.split(/\s+/)) {
      if (line && x.measureText(line + ' ' + word).width > width) { lines.push(line); line = word } else line += (line ? ' ' : '') + word
    }
    if (line) lines.push(line); return lines
  }
  const head = wrap(ed.manchete, `700 62px ${osw}`, CW)
  const caption = wrap(ed.campeaoLiga?.nome || '', `700 48px ${osw}`, 612)
  const deck = wrap(ed.linhaFina, `italic 25px ${ser}`, CW)
  const tituloNota = (l: EdicaoSala['linhas'][number]) => `${l.time} · ${ordinal(l.pos)} ${tr('NA LIGA', 'IN THE LEAGUE')}`
  const noteHeights = ed.linhas.map(l => 76 + wrap(tituloNota(l), `700 25px ${osw}`, nw).length * 30 + wrap(l.nota, `23px ${ser}`, nw).length * 31)
  const storiesH = Math.max(655, 444 + caption.length * 54)
  let notesH = 0
  for (let i = 0; i < noteHeights.length; i += 2) notesH += Math.max(noteHeights[i], noteHeights[i + 1] || 0) + 24
  const H = 244 + head.length * 70 + storiesH + deck.length * 33 + 190 + notesH + 80
  cv.width = W; cv.height = H
  const paper = x.createLinearGradient(0, 0, W, H); paper.addColorStop(0, '#F4ECD6'); paper.addColorStop(1, '#DFCCAB')
  x.fillStyle = paper; x.fillRect(0, 0, W, H); x.strokeStyle = '#72634c'; x.lineWidth = 2; x.strokeRect(16, 16, W - 32, H - 32)
  const line = (y: number, left = M, width = CW) => { x.strokeStyle = '#4c4231'; x.lineWidth = 2; x.beginPath(); x.moveTo(left, y); x.lineTo(left + width, y); x.stroke() }
  const text = (t: string, px: number, py: number, font: string, width?: number) => { x.font = font; x.fillStyle = '#0c0c0c'; x.fillText(t, px, py, width) }
  const photo = (img: HTMLImageElement | null, px: number, py: number, w: number, h: number) => {
    x.fillStyle = '#223426'; x.fillRect(px, py, w, h)
    if (img) { const scale = Math.max(w / img.width, h / img.height), sw = w / scale, sh = h / scale; x.drawImage(img, (img.width-sw)/2, (img.height-sh)/2, sw, sh, px, py, w, h) }
  }
  x.textAlign = 'center'; text('O MARTELO', W/2, 114, `700 94px ${ser}`, CW)
  text(`${tr('EDIÇÃO DA SALA · LIGA', 'ROOM EDITION · LEAGUE')}${ed.campeaoCopa ? ' + '+ed.copaNome.toUpperCase() : ''}`, W/2, 158, `700 24px ${osw}`, CW)
  text(`${ed.nTecnicos} ${tr('TÉCNICOS · FIM DE JOGO', 'MANAGERS · FULL TIME')}`, W/2, 190, `700 18px ${osw}`); line(208); line(214)
  x.textAlign = 'left'; let y = 286
  for (const h of head) { text(h, M, y, `700 62px ${osw}`); y += 70 }
  const top = y - 42, sideX = M + 644, sideW = CW - 644
  photo(liga, M, top, 612, 402)
  let cy = top + 436; text(tr('CAMPEÃO DA LIGA', 'LEAGUE CHAMPION'), M, cy, `700 22px ${osw}`)
  for (const c of caption) { cy += 54; text(c, M, cy, `700 48px ${osw}`) }
  text(`${ed.campeaoLiga?.quem || ''} · ${ed.campeaoLiga?.pts || 0} ${tr('pontos', 'points')}`, M, cy+36, `italic 23px ${ser}`, 612)
  let sy = top
  if (ed.campeaoCopa) {
    for (const h of wrap(`${ed.campeaoCopa.nome} · ${ed.copaNome}`, `700 25px ${osw}`, sideW)) { text(h, sideX, sy+26, `700 25px ${osw}`); sy += 30 }
    photo(copa, sideX, sy+6, sideW, 200); sy += 238
    text(ed.campeaoCopa.quem || tr('Campeão da copa', 'Cup champion'), sideX, sy, `italic 21px ${ser}`, sideW); sy += 30
  }
  if (ed.artilheiro) { text(tr('ARTILHEIRO DA SALA', 'ROOM TOP SCORER'), sideX, sy+24, `700 25px ${osw}`); photo(scorer, sideX, sy+38, sideW, 170); text(ed.artilheiro.nome, sideX, sy+237, `700 24px ${osw}`, sideW); text(`${ed.artilheiro.time} · ${ed.artilheiro.gols} ${tr('gols', 'goals')}`, sideX, sy+268, `21px ${ser}`, sideW) }
  y = top + storiesH; line(y); y += 35
  for (const d of deck) { text(d, M, y, `italic 25px ${ser}`); y += 33 }
  if (ed.lanterna) { text(`${tr('LANTERNA', 'BOTTOM')} · ${ed.lanterna.nome} · ${ed.lanterna.pts} ${tr('pontos', 'points')}`, M, y+23, `700 23px ${osw}`, CW); y += 48 }
  line(y+8); y += 55; text(tr('AS NOTAS DA REDAÇÃO', 'NOTES FROM THE NEWSROOM'), M, y, `700 38px ${osw}`); y += 30
  for (let i = 0; i < ed.linhas.length; i += 2) {
    for (let c = 0; c < 2; c++) {
      const l = ed.linhas[i+c]; if (!l) continue
      const left = M + c*(nw+gap); let ny = y+30
      for (const h of wrap(tituloNota(l), `700 25px ${osw}`, nw)) { text(h,left,ny,`700 25px ${osw}`); ny += 30 }
      text(`${l.quem ? l.quem+' · ' : ''}${l.pts} ${tr('pontos', 'points')}${l.voce ? tr(' · VOCÊ', ' · YOU') : ''}`,left,ny,`italic 19px ${ser}`,nw); ny += 34
      for (const n of wrap(l.nota, `23px ${ser}`, nw)) { text(n,left,ny,`23px ${ser}`); ny += 31 }
    }
    y += Math.max(noteHeights[i], noteHeights[i+1] || 0)+24; line(y)
  }
  x.textAlign='center'; text('leilaolegends.com',W/2,y+44,`700 24px ${osw}`)
  return new Promise(resolve => cv.toBlob(resolve,'image/png'))
}

// ─── 🏀🇺🇸 EUA OFICIAL: tela "Escolha sua franquia" (APROVADA pelo Diego 19/11, ainda não ligada em lugar nenhum) ─────────
// Mesmo quadro do Brasil Oficial (`CareerSetupFrame` + `.cse-*`), marca BidLegends. Leste/Oeste → 3 divisões de 5 franquias,
// escudo oficial (`ESCUDOS_NBA`, fora do bundle). Sem sobe e desce (decisão 19/11). Todo texto PT + EN.
import { useState } from 'react'
import { tr } from './lang'
import { CareerSetupFrame } from './career-setup-guide'
import { ESCUDOS_NBA } from './escudos-nba'
import { FRANQUIAS_NBA, type ConfNBA } from './eua-oficial'

const INK = '#0C0C0C', GOLD = '#FFC400'
const etapas = () => [tr('Carreira', 'Career'), tr('Franquia', 'Franchise'), tr('Presidente', 'President'), tr('Começar', 'Start')]
const MARCA = () => ({ nome: 'BIDLEGENDS', frase: tr('O SEU QUINTETO COMEÇA NO LANCE.', 'YOUR FIVE STARTS WITH A BID.'), sigla: 'BL' })

function Logo({ chave, size }: { chave: string; size: number }) {
  const e = ESCUDOS_NBA[chave]
  return e ? <img src={`${import.meta.env.BASE_URL}${e.src}`} alt="" width={Math.round(size * e.w / e.h)} height={size} style={{ flexShrink: 0, objectFit: 'contain' }} /> : <span aria-hidden="true">🏀</span>
}

export function EscolhaFranquiaEUA({ onEscolher, onVoltar }: { onEscolher: (chave: string) => void; onVoltar: () => void }) {
  const [conf, setConf] = useState<ConfNBA>('Leste')
  const [sel, setSel] = useState('Celtics')
  const f = FRANQUIAS_NBA.find(x => x.chave === sel) ?? null
  const divs = [...new Set(FRANQUIAS_NBA.filter(x => x.conf === conf).map(x => x.div))]
  const chip = (on: boolean) => ({ background: on ? GOLD : '#fff', color: INK, border: `2px solid ${INK}`, borderRadius: 10, boxShadow: on ? `2px 2px 0 ${INK}` : 'none', padding: '10px 4px', font: '700 16px Oswald, sans-serif', textTransform: 'uppercase' as const })
  return (
    <CareerSetupFrame step={2} club={f?.nome ?? ''} onBack={onVoltar} etapas={etapas()} marca={MARCA()} topo={tr('NOVA CARREIRA · EUA OFICIAL', 'NEW CAREER · OFFICIAL USA')}>
      <header className="cse-intro"><small>{tr('AS 30 FRANQUIAS DA NBA · 2026-27', 'THE 30 NBA FRANCHISES · 2026-27')}</small><h1>{tr('Escolha sua franquia.', 'Pick your franchise.')}</h1>
        <p>{tr('Como nos EUA: não tem sobe e desce. Você fica na sua franquia e briga pelo título todo ano.', 'Just like in the USA: no promotion or relegation. You stay with your franchise and fight for the title every year.')}</p></header>
      <div className="cse-rivals-grid">
        <div className="cse-paper">
          <div role="group" aria-label={tr('Conferência', 'Conference')} style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8 }}>
            {(['Leste', 'Oeste'] as const).map(c => <button key={c} type="button" aria-pressed={conf === c} style={chip(conf === c)}
              onClick={() => { setConf(c); setSel(FRANQUIAS_NBA.find(x => x.conf === c)!.chave) }}>{c === 'Leste' ? tr('Conferência Leste', 'Eastern Conference') : tr('Conferência Oeste', 'Western Conference')}</button>)}
          </div>
          {divs.map(d => {
            const lista = FRANQUIAS_NBA.filter(x => x.conf === conf && x.div === d)
            return <section key={d} style={{ marginTop: 16 }}>
              <h2 style={{ font: '800 15px Oswald, sans-serif', textTransform: 'uppercase', margin: '0 0 6px', letterSpacing: '.04em' }}>{tr(`Divisão ${d}`, `${lista[0].divEn} Division`)}</h2>
              <div className="cse-clubs" role="group" aria-label={d} style={{ marginTop: 0 }}>
                {lista.map(x => <button key={x.chave} type="button" aria-pressed={sel === x.chave} onClick={() => setSel(x.chave)}><Logo chave={x.chave} size={30} /><span>{x.nome}</span>{sel === x.chave && <b aria-hidden="true">✓</b>}</button>)}
              </div>
            </section>
          })}
        </div>
        <aside className="cse-explainer" aria-live="polite">
          {f && <>
            <figure style={{ display: 'flex', justifyContent: 'center', margin: '0 0 6px' }}><Logo chave={f.chave} size={104} /></figure>
            <h2 style={{ textAlign: 'center', textTransform: 'uppercase' }}>{f.nome}</h2>
            <p>🏀 {f.conf === 'Leste' ? tr('Conferência Leste', 'Eastern Conference') : tr('Conferência Oeste', 'Western Conference')} · {tr(`Divisão ${f.div}`, `${f.divEn} Division`)}</p>
            <p>📅 {tr('82 jogos na temporada regular, Play-In e Playoffs melhor de 7 até as Finais.', '82 regular-season games, Play-In and best-of-7 Playoffs through the Finals.')}</p>
            <p>🃏 {tr('Elenco: os jogadores reais da franquia nesta temporada (15 no elenco).', "Roster: the franchise's real players this season (15 on the roster).")}</p>
            <p>🔒 {tr('Sem sobe e desce: a franquia é sua pra sempre nesta carreira.', 'No promotion or relegation: the franchise is yours for this whole career.')}</p>
            <button type="button" className="csg-primary" style={{ width: '100%', marginTop: 14 }} onClick={() => onEscolher(f.chave)}>
              🏀 {tr(`Começar com o ${f.nome}`, `Start with the ${f.nome}`)}
            </button>
          </>}
        </aside>
      </div>
    </CareerSetupFrame>
  )
}

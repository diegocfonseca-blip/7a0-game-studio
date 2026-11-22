// ─── 🏀🇺🇸 EUA OFICIAL: "Que carreira você quer?" + "Escolha sua franquia" (APROVADA pelo Diego 19/11) ─────────────────────────
// Ligada em `NbaMinhasCarreiras` (screens.tsx), só pra quem tem `euaOficialLiberado()` (por enquanto a conta do Diego).
// Mesmo quadro do Brasil Oficial (`CareerSetupFrame` + `.cse-*`), marca BidLegends. Leste/Oeste → 3 divisões de 5 franquias,
// escudo oficial (`ESCUDOS_NBA`, fora do bundle). Sem sobe e desce (decisão 19/11). Todo texto PT + EN.
import { useState } from 'react'
import { tr } from './lang'
import { CareerSetupFrame } from './career-setup-guide'
import { ESCUDOS_NBA } from './escudos-nba'
import { FRANQUIAS_NBA, type ConfNBA } from './eua-oficial'

const INK = '#0C0C0C', GOLD = '#FFC400'
// o basquete não tem presidência: a carreira é Carreira → Franquia (o mockup tinha 4 etapas copiadas do Brasil Oficial)
const etapas = () => [tr('Carreira', 'Career'), tr('Franquia', 'Franchise')]
const MARCA = () => ({ nome: 'BIDLEGENDS', frase: tr('O SEU QUINTETO COMEÇA NO LANCE.', 'YOUR FIVE STARTS WITH A BID.'), sigla: 'BL' })

function Logo({ chave, size }: { chave: string; size: number }) {
  const e = ESCUDOS_NBA[chave]
  return e ? <img src={`${import.meta.env.BASE_URL}${e.src}`} alt="" width={Math.round(size * e.w / e.h)} height={size} style={{ flexShrink: 0, objectFit: 'contain' }} /> : <span aria-hidden="true">🏀</span>
}

/** 1º passo: a carreira de sempre (Street League → NBA) ou a EUA Oficial. Mesmo cartão do Brasil Oficial. */
export function EscolhaCarreiraBB({ onMeuTime, onEua, onVoltar }: { onMeuTime: () => void; onEua: () => void; onVoltar: () => void }) {
  const opcao = (on: boolean) => ({ display: 'block', width: '100%', textAlign: 'left' as const, background: on ? '#FFF6D6' : '#fff', color: INK, border: `2px solid ${INK}`, borderRadius: 12, boxShadow: on ? `3px 3px 0 ${INK}` : 'none', padding: '14px 16px', marginBottom: 12, cursor: 'pointer' })
  const sub = { display: 'block', font: '13px/1.55 Arial, sans-serif', color: '#514c3e', marginTop: 6 } as const
  return (
    <CareerSetupFrame step={1} club="" onBack={onVoltar} etapas={etapas()} marca={MARCA()} topo={tr('NOVA CARREIRA', 'NEW CAREER')}>
      <header className="cse-intro"><small>{tr('ESCOLHA O JEITO DE JOGAR', 'CHOOSE HOW TO PLAY')}</small><h1>{tr('Que carreira você quer?', 'Which career do you want?')}</h1></header>
      <div className="cse-rivals-grid">
        <div className="cse-paper">
          <button type="button" onClick={onMeuTime} style={opcao(false)}>
            <b style={{ font: '700 21px Oswald, sans-serif', textTransform: 'uppercase' }}>✏️ {tr('Meu time', 'My team')}</b>
            <span style={sub}>{tr('Crie seu time do zero e suba da Street League até a NBA. Como sempre foi.', 'Create your team from scratch and climb from the Street League to the NBA. As always.')}</span>
          </button>
          <button type="button" onClick={onEua} style={{ ...opcao(true), marginBottom: 0 }}>
            <b style={{ font: '700 21px Oswald, sans-serif', textTransform: 'uppercase' }}>🇺🇸 {tr('EUA Oficial', 'Official USA')}</b>
            <span style={sub}>{tr('Escolha uma das 30 franquias REAIS da NBA. 82 jogos, Play-In e Playoffs melhor de 7. Sem sobe e desce.', 'Pick one of the 30 REAL NBA franchises. 82 games, Play-In and best-of-7 Playoffs. No promotion or relegation.')}</span>
          </button>
        </div>
        <aside className="cse-explainer"><span aria-hidden="true">🇺🇸</span><h2>{tr('Tudo de verdade.', 'All real.')}</h2>
          <p>{tr('No EUA Oficial as franquias, as conferências, as divisões e o formato da temporada seguem a NBA real.', 'In Official USA the franchises, conferences, divisions and season format follow the real NBA.')}</p>
        </aside>
      </div>
    </CareerSetupFrame>
  )
}

export function EscolhaFranquiaEUA({ onEscolher, onVoltar, ocupado, erro }: { onEscolher: (chave: string) => void; onVoltar: () => void; ocupado?: boolean; erro?: string }) {
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
            <p>🎲 {tr('Começa com o quinteto SORTEADO entre todas as cartas da franquia. O resto fica sem time: vai pro leilão e pro Draft.', "Starts with a starting five DRAWN from all the franchise's cards. The rest are free agents: they go to the auction and the Draft.")}</p>
            <p>🔒 {tr('Sem sobe e desce: a franquia é sua pra sempre nesta carreira.', 'No promotion or relegation: the franchise is yours for this whole career.')}</p>
            {erro && <p role="alert" className="cse-error">{erro}</p>}
            <button type="button" className="csg-primary" style={{ width: '100%', marginTop: 14, opacity: ocupado ? 0.6 : 1 }} disabled={ocupado} onClick={() => !ocupado && onEscolher(f.chave)}>
              {ocupado ? tr('Preparando a franquia…', 'Getting the franchise ready…') : <>🏀 {tr(`Começar com o ${f.nome}`, `Start with the ${f.nome}`)}</>}
            </button>
          </>}
        </aside>
      </div>
    </CareerSetupFrame>
  )
}

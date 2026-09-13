// 🔬 BANCADA de conferência (13/09) — monta telas REAIS do jogo, sem mockup.
//   (padrão)   🏛️ Salão dos Batismos — confere a abertura pra geral: nº de fundador
//              escondido, lista de donos escondida na torcida, tela em PT/EN.
//   ?agencia   🕴️ Agência — confere o rosto de lenda no quadradinho e o TIER de
//              cada carta com ela chegando SEM o campo `promessa` (é assim que ela
//              vem do álbum da nuvem, onde esse campo não existe).
//   ?patrocinio 🤝 a tela REAL do patrocínio de hoje (proposta no início da
//              temporada + a faixa da aba Clube), pra desenhar o Master por cima.
//   ?master    🏆 MOCKUP do Patrocinador Master desenhado por cima da cena REAL
//              do escritório (mesmas classes CSS) — 3 colunas: contrato acabou ·
//              dia a dia · aba Clube. Nada disto está no jogo; é pro OK do Diego.
//   ?en        força o inglês.
// ⚠️ ordem dos imports: store → screens → pyramidseason/salao (ciclo do COPA_LEG_MS)
// ⚠️ envolver em <EscProvider>: o UnlockBanner usa useEsc.
import { createRoot } from 'react-dom/client'
import '../../src/index.css'
import { EscProvider } from '../../src/escalacao/store'
import '../../src/escalacao/screens'
import { AgenciadosTab } from '../../src/escalacao/pyramidseason'
import Salao from '../../src/escalacao/salao'
import { CareerSponsorVisual, CareerSponsorOverview } from '../../src/escalacao/career-sponsor-visual'
import { CATALOG, CATALOG_EU, CATALOG_WORLD } from '../../src/escalacao/data'
import type { AgCard } from '../../src/escalacao/types'

const q = new URLSearchParams(location.search)
if (q.has('en')) { try { localStorage.setItem('bl_lang', 'en') } catch { /* ignora */ } }
if (q.has('master')) { try { localStorage.setItem('bl_lang', 'pt') } catch { /* ignora */ } }

type C = { name: string; club: string; year: number; fame: number; promessa?: boolean; folk?: boolean }
const TODAS: (C & { pos: string })[] = [CATALOG, CATALOG_EU, CATALOG_WORLD]
  .flatMap(cat => Object.entries(cat).flatMap(([pos, l]) => (l as C[]).map(c => ({ ...c, pos }))))
// de propósito SEM o campo `promessa`: é assim que a carta chega do álbum da nuvem
const semFlag = (n: string, cl: string, y: number): AgCard => {
  const c = TODAS.find(x => x.name === n && x.club === cl && x.year === y)!
  return { name: c.name, club: c.club, year: c.year, pos: c.pos, fame: c.fame }
}
const CARDS: AgCard[] = [
  semFlag('Dani Alves', 'Barcelona', 2011), semFlag('Dani Alves', 'Bahia', 2002),
  semFlag('Kaká', 'Milan', 2007), semFlag('Kaká', 'São Paulo', 2003),
  semFlag('Rummenigge', 'Bayern', 1981), semFlag('Allan Simonsen', 'Mönchengladbach', 1977),
  semFlag('Lothar Matthäus', 'Inter', 1990), semFlag('Kenny Dalglish', 'Liverpool', 1983),
  // 🗂️ cartas VELHAS (a gente renomeou a carta; o álbum guarda a antiga)
  { name: 'Zinedine Zidane', club: 'Real Madrid', year: 2002, pos: 'MEI', fame: 5 },
  { name: 'Zizinho', club: 'Flamengo', year: 1950, pos: 'ATA', fame: 5 },
  { name: 'Marcos', club: 'Palmeiras', year: 1999, pos: 'GOL', fame: 5 },
  { name: 'Zlatan Ibrahimović', club: 'Milan', year: 2013, pos: 'ATA', fame: 5 },
]
// estádio fake com tudo desbloqueado (StadiumSave = { inv, ext })
const estadio = { inv: { grama: 999, norte: 999, sul: 999, leste: 999, oeste: 999 }, ext: ['saf'] }


// ─── 🏆 MOCKUP DO MASTER (só na bancada) ────────────────────────────────────
// Régua proposta: 1 temp = aposta 🛡️ não cair · +metade por temp a mais · 5 = 👑 campeão.
const MASTER_BASE: Record<string, number> = { V: 2, D: 4, C: 8, B: 16, A: 32 }
const mval = (div: string, anos: number) => MASTER_BASE[div] * (1 + (anos - 1) / 2)
const MASTER_MARCAS = [
  { anos: 1, nome: 'Rádio Grito de Gol', emoji: '📻' },
  { anos: 3, nome: 'Banco Craque', emoji: '🏦' },
  { anos: 5, nome: 'Trovão Energia', emoji: '⚡' },
]
const GOLD = '#FFC400', INK = '#0C0C0C', GREEN = '#1B7A3D'
function MasterFaixa({ div, anos, ano, nome, emoji }: { div: string; anos: number; ano: number; nome: string; emoji: string }) {
  return (
    <div style={{ background: '#160e08', color: '#f4ecd6', border: `3px solid ${INK}`, borderRadius: 16, boxShadow: `4px 4px 0 ${INK}`, padding: '12px 14px', marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
        <div>
          <div style={{ font: '600 10px Oswald,sans-serif', letterSpacing: '.08em', color: GOLD }}>🏆 PATROCINADOR MASTER · {div === 'V' ? 'VÁRZEA' : `SÉRIE ${div}`}</div>
          <div style={{ font: '700 22px/1.1 Oswald,sans-serif', marginTop: 2 }}>{emoji} {nome}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ font: '700 24px/1 Oswald,sans-serif', color: GOLD }}>+{mval(div, anos)} 🪙</div>
          <div style={{ font: '700 10px Arial,sans-serif', opacity: .75 }}>por temporada</div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 4, margin: '10px 0 6px' }}>
        {Array.from({ length: anos }, (_, i) => <div key={i} style={{ flex: 1, height: 9, border: `2px solid ${GOLD}`, borderRadius: 4, background: i < ano ? GOLD : 'transparent' }} />)}
      </div>
      <div style={{ font: '700 12px Arial,sans-serif' }}>Temporada <b>{ano}</b> de <b>{anos}</b> do contrato · faltam <b>{anos - ano}</b></div>
      <div style={{ font: '12px/1.45 Arial,sans-serif', opacity: .8, marginTop: 3 }}>Fechado na Série C. O valor é o da divisão onde você assinou e <b>não muda</b> se subir ou cair. Nova proposta só quando acabar.</div>
    </div>
  )
}
function MasterProposta() {
  const div = 'C'; const esc = MASTER_MARCAS[1]
  return (
    <section className="ll29-sponsor ll36-sponsor" aria-label="Patrocinador Master">
      <header><small>SÉRIE C</small><h2>PATROCINADOR MASTER</h2><p>Seu contrato acabou. Três empresas querem a camisa — escolha o <b>prazo</b>.</p></header>
      <div className="ll29-sponsor-tabs">{MASTER_MARCAS.map(m => <button key={m.anos} aria-pressed={m === esc}>{m.emoji} {m.anos} TEMPORADA{m.anos > 1 ? 'S' : ''}</button>)}</div>
      <div className="ll36-office"><article className="ll36-paper">
        <small className="ll35-contract-heading">CONTRATO MASTER · PAGA POR TEMPORADA</small>
        <h3>{esc.nome}</h3>
        <p>{esc.anos} temporadas · Série C</p>
        <strong>+{mval(div, esc.anos)} MOEDAS</strong>
        <span className="ll35-signature">Assinatura do presidente</span>
      </article></div>
      <div className="ll29-sponsor-bottom">
        <p><b>+{mval(div, esc.anos)} por temporada, {esc.anos} temporadas = {mval(div, esc.anos) * esc.anos} moedas garantidas.</b> Subiu pra B ou A? Continua +{mval(div, esc.anos)} até acabar. Caiu? <b>Também continua</b> — o contrato vira seu colchão. Sem rescisão: nova proposta só quando terminar.</p>
        <p style={{ opacity: .75 }}>📻 1 temp: +{mval(div, 1)} · 🏦 3 temps: +{mval(div, 3)} · ⚡ 5 temps: +{mval(div, 5)} por temporada</p>
        <button>ASSINAR {esc.anos} TEMPORADAS</button>
        <small>Valores por divisão em Clube › Patrocínio.</small>
      </div>
    </section>
  )
}
function PontualHoje({ compacto }: { compacto?: boolean }) {
  return (
    <section className="ll29-sponsor ll36-sponsor" aria-label="Patrocinador Pontual" style={compacto ? { marginTop: 0 } : undefined}>
      <header><small>SÉRIE C · SÓ ESTA TEMPORADA</small><h2>PATROCINADOR PONTUAL</h2><p>A aposta de sempre: onde você quer chegar nesta temporada?</p></header>
      <div className="ll29-sponsor-tabs"><button aria-pressed>Não cair de divisão</button><button>Acesso (top 4)</button><button>Campeão (liga ou copa)</button></div>
      <nav className="ll30-proposals"><button aria-pressed>PROPOSTA 1</button><button>PROPOSTA 2</button><button>PROPOSTA 3</button></nav>
      <div className="ll36-office"><article className="ll36-paper">
        <small className="ll35-contract-heading">CONTRATO PONTUAL</small>
        <h3>Padaria do Zé</h3><p>Não cair de divisão</p><strong>+8 MOEDAS</strong>
        <span className="ll35-signature">Assinatura do presidente</span>
      </article></div>
      <div className="ll29-sponsor-bottom">
        <p>Aposta segura: termine fora da zona de rebaixamento. O prêmio depende da meta.</p>
        <button>ASSINAR CONTRATO</button>
      </div>
    </section>
  )
}
function MasterAbaClube() {
  const linhas: [string, string][] = [['V', '🌱 Várzea'], ['D', 'Série D'], ['C', 'Série C'], ['B', 'Série B'], ['A', 'Série A']]
  return (
    <section className="ll32-sponsor-overview ll36-sponsor">
      <header><small>SÉRIE C</small><h2>PATROCÍNIO DO CLUBE</h2></header>
      <div style={{ padding: '10px 14px 0' }}><MasterFaixa div="C" anos={3} ano={2} nome="Banco Craque" emoji="🏦" /></div>
      <div className="ll32-contract-scene"><article>
        <small>CONTRATO PONTUAL DA TEMPORADA</small>
        <h3>Max Joias</h3><p>Não cair de divisão</p><strong>+8 MOEDAS</strong>
        <span className="ll35-signature">CONTRATO ASSINADO</span>
      </article></div>
      <div style={{ padding: '4px 14px 14px' }}>
        <div style={{ background: '#f4ecd6', color: INK, border: `3px solid ${INK}`, borderRadius: 14, padding: '10px 12px' }}>
          <div style={{ font: '700 13px Oswald,sans-serif', marginBottom: 6 }}>🏆 MASTER · QUANTO PAGA POR TEMPORADA</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', font: '700 12px Arial,sans-serif' }}>
            <thead><tr><td /> {[1, 2, 3, 4, 5].map(a => <td key={a} style={{ textAlign: 'center', font: '600 10px Oswald,sans-serif', opacity: .6 }}>{a} TEMP</td>)}</tr></thead>
            <tbody>{linhas.map(([d, n]) => <tr key={d} style={{ borderTop: '1.5px solid rgba(0,0,0,.12)' }}><td style={{ font: '700 12px Oswald,sans-serif', padding: '4px 4px' }}>{n}</td>{[1, 2, 3, 4, 5].map(a => <td key={a} style={{ textAlign: 'center', padding: 4, color: a === 5 ? '#7C3AED' : INK }}>{mval(d, a)}</td>)}</tr>)}</tbody>
          </table>
          <div style={{ font: '12px/1.45 Arial,sans-serif', marginTop: 8, opacity: .8 }}><b>1 temporada</b> paga o mesmo que a aposta 🛡️ não cair da divisão. Cada temporada a mais soma <b>metade</b> disso. <b>5 temporadas</b> = o que 👑 campeão pagaria — <b>garantido</b>. O valor trava na divisão da assinatura.</div>
        </div>
      </div>
      <p className="ll32-contract-note">O Pontual continua igual: 2/4/6 · 4/8/12 · 8/16/24 · 16/32/48 · 32/64/96, mesma fidelidade, mesmas 9 marcas.</p>
    </section>
  )
}
function MasterMockup() {
  const col = (rot: string, nota: string, children: React.ReactNode) => (
    <div style={{ width: 430 }}>
      <div style={{ font: '700 17px Oswald,sans-serif', textTransform: 'uppercase', letterSpacing: '.05em' }}>{rot}</div>
      <div style={{ font: '600 12px/1.4 system-ui', opacity: .6, minHeight: 52, margin: '4px 0 10px' }}>{nota}</div>
      {children}
    </div>
  )
  return (
    <div style={{ background: '#F4ECD6', minHeight: '100vh', padding: 24, color: INK }}>
      <div style={{ font: '700 30px Oswald,sans-serif', marginBottom: 4 }}>🏆 PATROCINADOR MASTER — na cena real do escritório</div>
      <div style={{ font: '600 13px/1.5 system-ui', opacity: .7, maxWidth: 1000, marginBottom: 22 }}>Mesma mesa, mesmo papel, mesmas classes do jogo de hoje. O Master aparece <b>em cima</b>; o de aposta vira <b>Patrocinador Pontual</b>, embaixo. Valores: 1 temp = aposta "não cair" · +metade por temporada a mais · 5 temps = valor de campeão, garantido.</div>
      <div style={{ display: 'flex', gap: 26, alignItems: 'flex-start' }}>
        {col('① Quando o contrato acaba', 'Só nesta hora o Master aparece pra escolher: as abas viram os PRAZOS (cada marca fecha um prazo). O papel mostra o valor por temporada e o total. Embaixo, o Pontual de sempre.', <><MasterProposta /><PontualHoje /></>)}
        {col('② O dia a dia (contrato correndo)', 'Nas outras temporadas o Master é só uma FAIXA em cima — quanto paga, ano 2 de 3, quanto falta. Nada pra decidir, não atrasa o começo da temporada. Você só assina o Pontual.', <><MasterFaixa div="C" anos={3} ano={2} nome="Banco Craque" emoji="🏦" /><PontualHoje compacto /></>)}
        {col('③ Clube › Patrocínio', 'A faixa do Master, o papel do Pontual assinado e a régua completa de valores — no mesmo quadro que já existe.', <MasterAbaClube />)}
      </div>
      <div style={{ display: 'flex', gap: 26, marginTop: 26, maxWidth: 1340 }}>
        {[['❓ 1 · Série A', 'Lá em cima o prazo longo não tem custo (não há pra onde subir): todo mundo assinaria 5 anos sempre. Sugiro limitar a Série A a 3 temporadas — você decide.'],
          ['❓ 2 · Os dois somam?', 'Desenhei somando: Master garantido + Pontual de aposta. Se achar dinheiro demais, o Master pode SUBSTITUIR o Pontual enquanto durar.'],
          ['❓ 3 · As marcas', '📻 Rádio Grito de Gol (1) · 🚚 Pé-de-Ferro Transportes (2) · 🏦 Banco Craque (3) · ✈️ AeroCraque (4) · ⚡ Trovão Energia (5). Quer botar amigos, como Vadico/ERO/Max Joias/Rei das Tintas? Só falar.']].map(([t, x]) => (
          <div key={t} style={{ flex: 1, background: '#FFE9E4', border: `3px solid ${INK}`, borderRadius: 14, boxShadow: `4px 4px 0 ${INK}`, padding: '12px 14px' }}>
            <div style={{ font: '700 14px Oswald,sans-serif', marginBottom: 4 }}>{t}</div>
            <div style={{ font: '600 12px/1.5 system-ui' }}>{x}</div>
          </div>
        ))}
      </div>
      <div style={{ font: '600 12px system-ui', opacity: .55, marginTop: 18 }}>Nada disto está no jogo — é só o desenho, na bancada, pro seu OK. ⚽ Leilão Legends</div>
    </div>
  )
}

createRoot(document.getElementById('root')!).render(
  <EscProvider>
    {q.has('master')
      ? <MasterMockup />
      : q.has('patrocinio')
      ? <div style={{ background: '#F4ECD6', minHeight: '100vh', padding: 14 }}>
          <div style={{ maxWidth: 430, margin: '0 auto' }}>
            <CareerSponsorVisual div="C" chosen={q.has('assinado') ? { tier: 1, brandId: 'maxjoias' } : undefined} onPick={() => {}} fielBrandId="maxjoias" />
            <div style={{ height: 18 }} />
            <CareerSponsorOverview div="C" chosen={{ tier: 1, brandId: 'maxjoias' }} />
          </div>
        </div>
      : q.has('agencia')
      ? <div style={{ background: '#F4ECD6', minHeight: '100vh', padding: 14 }}>
          <div style={{ maxWidth: 430, margin: '0 auto' }}>
            <AgenciadosTab cards={CARDS} pool={CARDS} hist={{}} fatura={undefined}
              st={estadio} hasFilial={false} primeiroClube="Neymarzetti" onSet={() => {}} />
          </div>
        </div>
      : <Salao />}
  </EscProvider>,
)

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import { tr } from './lang'
import { Escudo } from './escudos'
import { mascoteInteiraDoTime } from './mascotes'
import { MascoteMini } from './mascote-atravessa'
import { APOIO_PERKS, ApoioSheen } from './apoio'
import './support-plans.css'
import { CartoesBatismo } from './support-plans-v2'

// ─── 🍯 "ÁGUA NA BOCA" (Diego 29/09): a tela de planos MOSTRA em vez de listar ──
// Mockup aprovado: `scripts/mockup-planos-agua-na-boca.mjs`. Cada plano ganha uma
// vitrine desenhada com as peças REAIS do jogo (o nome na sala com a cor do tier, os
// controles do Manual, a carta com o NÍVEL, e no Batismo escudo + mascote + manto de um
// clube de verdade). Regras de texto dele: é NÍVEL (nunca "nota"/"overall"); olheiro =
// "acha jogador fora do leilão, de nível até X"; nada de contagem de vagas.
const INK = '#0C0C0C', GOLD = '#FFC400'
const OSW = { fontFamily: 'Oswald, sans-serif', fontWeight: 700 } as const
const EXEMPLO = 'Al Takhadao FC' // 🦜 o batismo de exemplo (escudo/mascote/manto do jogo)

/** uma linha da lista de técnicos da sala, na cor do tier (igual ao lobby) */
function LinhaSala({ tier, nome, clube }: { tier: 'bege' | 'prata' | 'ouro'; nome: string; clube?: string }) {
  const perk = APOIO_PERKS[tier]
  const art = clube ? mascoteInteiraDoTime(clube) : null
  return <div className="ll-vit-linha" style={{ background: perk.grad, padding: clube ? '4px 8px' : '8px 10px' }}>
    <ApoioSheen holo={perk.holo} />
    {clube ? <Escudo nome={clube} size={34} /> : <b className="ll-vit-ini">{nome.trim()[0]?.toUpperCase() ?? '?'}</b>}
    <b className="ll-vit-nome">{nome} {perk.selo}</b>
    {art && <span style={{ margin: '-8px 0 -10px', transform: 'rotate(4deg)', position: 'relative' }}><MascoteMini art={art} alt={44} /></span>}
  </div>
}
/** a carta do jogo com o NÍVEL à mostra (o que o gratuito não vê) */
function CartaNivel({ tier, nome, nivel, pos = 'ATA' }: { tier: 'prata' | 'ouro'; nome: string; nivel: number; pos?: string }) {
  const perk = APOIO_PERKS[tier]
  return <div className="ll-vit-carta" style={{ background: perk.grad }}>
    <ApoioSheen holo={perk.holo} />
    <span className="ll-vit-pos">{pos}</span>
    <div className="ll-vit-bola">{nome[0]}</div>
    <p style={{ margin: 0, ...OSW, fontSize: 9.5, lineHeight: 1.1, position: 'relative' }}>{nome}</p>
    <p style={{ margin: '2px 0 0', position: 'relative', display: 'flex', alignItems: 'center', gap: 3 }}>
      <span style={{ ...OSW, fontSize: 13, background: '#fff', border: `2px solid ${INK}`, borderRadius: 6, padding: '0 4px' }}>{nivel}</span>
      <span style={{ fontSize: 7, fontWeight: 800, opacity: .7 }}>{tr('NÍVEL', 'LEVEL')}</span>
    </p>
  </div>
}
function Vitrine({ titulo, children }: { titulo: string; children: ReactNode }) {
  return <div className="ll-vit"><p className="ll-vit-rot">{titulo}</p>{children}</div>
}
function Mini({ rot, children }: { rot: string; children: ReactNode }) {
  return <div className="ll-vit-mini">{children}<p>{rot}</p></div>
}
const Ok = ({ children }: { children: ReactNode }) => <div className="ll-vit-ok"><span>✓</span><span>{children}</span></div>
const Controles = () => <div style={{ display: 'flex', gap: 3, justifyContent: 'center', flexWrap: 'wrap' }}>
  {['¼×', '½×', '2×', '4×', tr('⏭ PULAR', '⏭ SKIP')].map((v, i) => <span key={v} style={{ ...OSW, fontSize: 9, border: `2px solid ${INK}`, borderRadius: 6, padding: '2px 5px', background: i === 2 ? INK : '#fff', color: i === 2 ? '#fff' : INK }}>{v}</span>)}
</div>


export type SupportPlanKey = 'prata' | 'ouro' | 'batismo' | 'socio'
type Props = {
  focus: SupportPlanKey | null
  tier?: string
  name: string
  memberActive: boolean
  memberNumber?: number | null
  foundersLeft: number
  onPay: (tier: 'prata' | 'ouro') => void
  onNaming: (plano: 'lenda' | 'plus') => void
  onMember: () => void
  onDonate: () => void
  onInstagram: () => void
}

export function SupportStory() {
  return <section className="ll-support-story">
    <h3>{tr('QUEM FAZ ISSO AQUI 🔴⚫', 'WHO MAKES THIS THING 🔴⚫')}</h3>
    <p>{tr('Sou o Diego. De dia vendo carro com meu pai. De madrugada, quando a casa dorme, faço este jogo — sozinho, na unha.', 'I’m Diego. By day I sell cars with my dad. Late at night, when the house is asleep, I build this game — on my own, by hand.')}</p>
    <p>{tr('E faço por um motivo com nome: o Luca, meu filho. Ele tem uma condição rara — são 120 casos no mundo — e ele é o menino mais forte do mundo. Ele é a minha ', 'And I do it for a reason with a name: Luca, my son. He has a rare condition — there are 120 cases worldwide — and he is the strongest boy in the world. He is my ')}<strong className="ll-support-luca-legend">{tr('lenda', 'legend')}</strong>{tr('. Cada apoio vira uma vida melhor pro Luca e este jogo vivo, crescendo toda semana.', '. Every bit of support helps give Luca a better life and keeps this game alive, growing every week.')}</p>
    <p>{tr('E essa história, que é minha e do Luca, passa a ter um pedaço de você dentro dela.', 'And that story, mine and Luca’s, gets to carry a piece of you inside it.')}</p>
    <strong>{tr('✍ Diego · fundador nº 1', '✍ Diego · founder no. 1')}</strong>
    <p>{tr('Pelo Luca: obrigado por estar aqui 💛', 'For Luca: thank you for being here 💛')}</p>
  </section>
}

// ─── 💸 PRA ONDE VAI O DINHEIRO + META DO MÊS (Diego 13–14/10, mockup `scripts/mockups/apoie-dinheiro.png`) ───
// Pedido dele, olhando o Brasileirinho: dizer pra onde vai o dinheiro, do nosso jeito. Formato combinado: só esta seção,
// dentro do modal de apoio (perto dos planos); o texto DELE vai inteiro no quadro do Luca (nunca reescrever); a faixa
// dourada diz que apoio não dá vantagem. A META: o público vê só a %, e quem põe o número é o Diego, na tabela
// `esc_meta_mes` (um por mês; sem linha no mês = a barra some). 100% = o jogo se paga · 150% = sustentável.
const SUSTENTAVEL = 150
const MESES: [string, string][] = [['janeiro', 'January'], ['fevereiro', 'February'], ['março', 'March'], ['abril', 'April'], ['maio', 'May'], ['junho', 'June'], ['julho', 'July'], ['agosto', 'August'], ['setembro', 'September'], ['outubro', 'October'], ['novembro', 'November'], ['dezembro', 'December']]
function useMetaDoMes(): { mes: number; pct: number } | null {
  const [meta, setMeta] = useState<{ mes: number; pct: number } | null>(null)
  useEffect(() => {
    // o mês de Brasília (UTC−3), pra virada não acontecer às 21h do último dia
    const d = new Date(Date.now() - 3 * 3600_000)
    const chave = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
    let vivo = true
    void supabase.from('esc_meta_mes').select('pct').eq('mes', chave).maybeSingle().then(({ data }) => {
      if (vivo && data && typeof (data as { pct?: number }).pct === 'number') setMeta({ mes: d.getUTCMonth(), pct: (data as { pct: number }).pct })
    }, () => { /* sem rede: sem barra */ })
    return () => { vivo = false }
  }, [])
  return meta
}
const DinheiroItem = ({ ic, t, d }: { ic: string; t: string; d: string }) => <div className="ll-money-it"><span>{ic}</span><div><b>{t}</b><p>{d}</p></div></div>
export function SupportMoney() {
  const meta = useMetaDoMes()
  const pct = meta?.pct ?? 0
  const pos = (v: number) => `${Math.min(100, (v / SUSTENTAVEL) * 100)}%`
  return <>
    <section className="ll-money">
      <h3>{tr('💸 PRA ONDE VAI O DINHEIRO', '💸 WHERE THE MONEY GOES')}</h3>
      <p className="ll-money-sub">{tr('Sem mistério: cada real vira jogo.', 'No mystery: every real becomes game.')}</p>
      <div className="ll-money-it ll-money-luca"><span>💛</span><div>
        <b>{tr('UMA VIDA MELHOR PRO LUCA', 'A BETTER LIFE FOR LUCA')}</b>
        <p>{tr('Sou o Diego. De madrugada, faço esse jogo sozinho.', 'I’m Diego. Late at night, I build this game on my own.')}</p>
        <p>{tr('E faço por um motivo com nome: o Luca, meu filho. Ele tem uma condição rara — são 120 casos no mundo — e ele é o menino mais forte do mundo. Ele é a minha ', 'And I do it for a reason with a name: Luca, my son. He has a rare condition — there are 120 cases worldwide — and he is the strongest boy in the world. He is my ')}<strong className="ll-support-luca-legend">{tr('lenda', 'legend')}</strong>{tr('. Cada apoio vira uma vida melhor pro Luca e este jogo vivo, crescendo toda semana.', '. Every bit of support helps give Luca a better life and keeps this game alive, growing every week.')}</p>
        <p>{tr('E essa história, que é minha e do Luca, passa a ter um pedaço de você dentro dela.', 'And that story, mine and Luca’s, gets to carry a piece of you inside it.')}</p>
        <p className="ll-money-ass">{tr('✍ Diego · fundador nº 1', '✍ Diego · founder no. 1')}</p>
        <p>{tr('Pelo Luca: obrigado por estar aqui 💛', 'For Luca: thank you for being here 💛')}</p>
      </div></div>
      <DinheiroItem ic="🗄️" t={tr('O COFRE DA CARREIRA', 'THE CAREER VAULT')} d={tr('Cada carreira é um mundo inteiro guardado no servidor: elencos, contratos, tabelas, 190 temporadas de história. Tem gente com save de quase 1 MB. Alguém paga esse armário.', 'Every career is a whole world stored on the server: squads, contracts, tables, 190 seasons of history. Some saves are almost 1 MB. Someone pays for that cupboard.')} />
      <DinheiroItem ic="📡" t={tr('A SALA AO VIVO', 'THE LIVE ROOM')} d={tr('Cada lance, cada envelope, cada zoeira do chat viaja na hora pra todo mundo da sala. São milhões de mensagens por mês passando pelo servidor.', 'Every bid, every envelope, every bit of chat banter travels instantly to everyone in the room. Millions of messages a month go through the server.')} />
      <DinheiroItem ic="🧠" t={tr('QUEM FAZ O JOGO', 'WHO MAKES THE GAME')} d={tr('Novidade toda semana, conserto no mesmo dia, carta nova, batismo novo. Isso tem ferramenta e tem hora de trabalho.', 'News every week, same-day fixes, new cards, new namings. That takes tools and hours of work.')} />
      <DinheiroItem ic="🌙" t={tr('HORÁRIO DE PICO', 'PEAK HOURS')} d={tr('À noite, com as salas lotadas, o servidor trabalha dobrado. É aí que ele mais custa.', 'At night, with rooms packed, the server works double. That is when it costs the most.')} />
      <p className="ll-money-selo">{tr('Apoiar não deixa seu time mais forte. Não muda placar, leilão, dinheiro do clube nem ranking. Aqui ninguém compra título. 🏆', 'Supporting does not make your team stronger. It does not change scores, auctions, club money or rankings. Nobody buys a title here. 🏆')}</p>
    </section>
    {meta && <section className="ll-money ll-money-meta">
      <h3><span>{tr(`📊 META DE ${MESES[meta.mes][0].toUpperCase()}`, `📊 ${MESES[meta.mes][1].toUpperCase()} GOAL`)}</span><em>{pct}%</em></h3>
      <p className="ll-money-sub">{tr('Quanto do custo deste mês o apoio da galera já pagou.', 'How much of this month’s cost the community has already covered.')}</p>
      <div className="ll-money-bar"><i style={{ width: pos(pct) }} />
        <span className={`ll-money-mk${pct >= 100 ? ' ok' : ''}`} style={{ left: pos(100) }}><b>🧾 100%</b></span>
        <span className={`ll-money-mk fim${pct >= SUSTENTAVEL ? ' ok' : ''}`} style={{ left: '100%' }}><b>🚀 {SUSTENTAVEL}%</b></span>
      </div>
      <p className="ll-money-lin">{pct >= 100 ? '✅' : '⏳'} <b>{tr('O JOGO SE PAGA', 'THE GAME PAYS FOR ITSELF')}</b> {tr('— aos 100%: servidor e ferramentas pagos.', '— at 100%: server and tools paid.')}</p>
      <p className="ll-money-lin">{pct >= SUSTENTAVEL ? '✅' : '⏳'} <b>{tr('SUSTENTÁVEL', 'SUSTAINABLE')}</b> {tr(`— aos ${SUSTENTAVEL}%: sobra pra crescer (mais servidor, mais novidade).`, `— at ${SUSTENTAVEL}%: room to grow (more server, more news).`)}</p>
      <p className="ll-money-pq">{tr('A barra mostra só a porcentagem. O Diego atualiza ao longo do mês.', 'The bar only shows the percentage. Diego updates it during the month.')}</p>
    </section>}
  </>
}

export function SupportFooter({ onOpen }: { onOpen: () => void }) {
  return <section className="ll-support-footer">
    <h3>{tr('💛 APOIE O LEILÃO LEGENDS', '💛 SUPPORT LEILÃO LEGENDS')}</h3>
    <p>{tr('Ajude o jogo a continuar crescendo e conheça os benefícios de cada plano.', 'Help the game keep growing and explore what each plan includes.')}</p>
    <button onClick={onOpen}>{tr('CONHECER OS PLANOS →', 'EXPLORE THE PLANS →')}</button>
  </section>
}

export function SupportManualPreview() {
  return <section className="ll-support-controls" aria-label={tr('Exemplo dos controles liberados; não controla a partida', 'Preview of unlocked controls; does not control the match')}>
    <h3>{tr('PRÉVIA DOS CONTROLES LIBERADOS', 'PREVIEW OF UNLOCKED CONTROLS')}</h3>
    <div><p>{tr('VELOCIDADE DA PARTIDA', 'MATCH SPEED')}</p>
      <div className="ll-support-speeds">{['¼×', '½×', tr('Normal', 'Normal'), '2×', '4×'].map((v, i) => <span key={v} className={i === 2 ? 'selected' : ''}>{v}</span>)}</div>
      <div className="ll-support-actions"><span>{tr('⏭ PULAR', '⏭ SKIP')}</span><span>{tr('MODO AUTO', 'AUTO MODE')}</span><span>{tr('▶ PRÓXIMA RODADA', '▶ NEXT ROUND')}</span></div>
    </div>
  </section>
}

export function SupportCraqueBenefits() {
  return <ul className="ll-support-benefits">
    <li><b>{tr('Modo Manual na carreira', 'Manual Mode in Career')}</b>{tr('Pause a partida, altere a velocidade, pule ou avance a rodada quando quiser.', 'Pause the match, adjust the speed, skip or advance the round whenever you want.')}</li>
    <li><b>{tr('Overall visível depois da contratação', 'Ratings visible after signing')}</b>{tr('Veja a nota dos jogadores e treinadores do seu elenco até a categoria Craque. Lendas continuam ocultas.', 'See the rating of players and coaches in your squad up to Star. Legends remain hidden.')}</li>
    <li><b>{tr('Olheiro até a categoria Craque', 'Scout up to Star')}</b>{tr('Sonde Foi Profissional, Bom Jogador, Promessa e Craque. O jogador vai ao pregão e você ainda disputa o lance.', 'Scout Former Pro, Good Player, Prospect and Star. The player enters the auction and you still compete for the bid.')}</li>
    <li><b>{tr('Visual prata com brilho', 'Shining silver look')}</b>{tr('Seu nome ganha destaque prateado no estádio, elenco e tabelas.', 'Your name gets a silver highlight in the stadium, squad and tables.')}</li>
    <li><b>{tr('Grupo VIP', 'VIP group')}</b>{tr('Bastidores, novidades e contato com o Diego no WhatsApp.', 'Behind the scenes, news and contact with Diego on WhatsApp.')}</li>
    <li><b>{tr('2 carreiras salvas', '2 saved careers')}</b>{tr('Mantenha duas histórias diferentes ao mesmo tempo.', 'Keep two different stories at the same time.')}</li>
  </ul>
}

export function SupportPlanCard({ id, title, price, cadence, tone, children }: { id?: string; title: string; price: string; cadence: string; tone: string; children: ReactNode }) {
  return <article id={id} className={'ll-support-plan ' + tone}><header><h2>{title}</h2><div><strong>{price}</strong><small>{cadence}</small></div></header><div className="ll-support-plan-body">{children}</div></article>
}

export function SupportPlans(p: Props) {
  const root = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!p.focus) return
    const target = p.focus === 'socio' ? (p.tier === 'ouro' ? 'ouro' : 'prata') : p.focus
    const timer = setTimeout(() => root.current?.querySelector('#support-' + target)?.scrollIntoView({ block: 'start' }), 40)
    return () => clearTimeout(timer)
  }, [p.focus, p.tier])
  const memberButton = (tier: 'prata' | 'ouro') => p.tier === tier
    ? <button className={'ll-support-button ' + (tier === 'ouro' ? 'gold' : 'prata')} onClick={p.onMember}>{p.memberActive
      ? tr('ABRIR MINHA ÁREA DE SÓCIO →', 'OPEN MY MEMBER AREA →')
      : tr(tier === 'ouro' ? 'ADICIONAR SÓCIO · R$ 2,90/MÊS' : 'ADICIONAR SÓCIO · R$ 4,90/MÊS', tier === 'ouro' ? 'ADD MEMBERSHIP · R$ 2.90/MONTH' : 'ADD MEMBERSHIP · R$ 4.90/MONTH')}</button>
    : null
  const meu = p.name || tr('Seu Time', 'Your Club')
  const meuTier: 'bege' | 'prata' | 'ouro' = p.tier === 'ouro' ? 'ouro' : p.tier === 'prata' ? 'prata' : 'bege'
  return <div className="ll-support" ref={root}>
    {/* 🌐 a mesma sala, três jeitos de entrar */}
    <div className="ll-vit-hero">
      <h1>{tr('Na mesma sala,', 'In the same room,')}<br /><b>{tr('cada um entra de um jeito.', 'everyone walks in differently.')}</b></h1>
      <p>{tr('O jogo é grátis e ninguém leva vantagem em campo. O que o apoio muda é ', 'The game is free and nobody gets an edge on the pitch. What support changes is ')}<b>{tr('como o seu clube aparece', 'how your club shows up')}</b>{tr(' — pra você e pra todo mundo.', ' — for you and for everyone.')}</p>
      <div className="ll-vit-sala">
        <p className="ll-vit-rot">{tr('🌐 Técnicos na sala', '🌐 Managers in the room')}</p>
        <LinhaSala tier="ouro" nome="Neymarzetti" clube="Neymarzetti" />
        <LinhaSala tier="ouro" nome={EXEMPLO} clube={EXEMPLO} />
        <LinhaSala tier="prata" nome="Bolacha FC" />
        <LinhaSala tier={meuTier} nome={meu} />
      </div>
      {meuTier === 'bege' && <p className="ll-vit-hero-pe">{tr('👆 é assim que os outros te veem hoje. ', '👆 this is how others see you today. ')}<b>{tr('Bora mudar isso?', 'Shall we change that?')}</b></p>}
    </div>

    <h3 className="ll-support-section">{tr('⚡ PAGUE UMA VEZ · É SEU PRA SEMPRE', '⚡ PAY ONCE · YOURS FOREVER')}</h3>
      <SupportPlanCard id="support-prata" title={tr('⭐ Craque', '⭐ Star')} price="R$ 19,90" cadence={tr('uma vez só', 'one-off payment')} tone="prata">
        <h3>{tr('Manda no ritmo do jogo, vê o nível dos jogadores até Craque e brilha em prata na sala.', 'Run the pace of the game, see player levels up to Star and shine in silver in the room.')}</h3>
        <Vitrine titulo={tr('o que muda na sua tela', 'what changes on your screen')}>
          <LinhaSala tier="prata" nome={meu} />
          <div className="ll-vit-grid">
            <Mini rot={tr('🎮 Modo Manual: pausa, acelera 2×/4×, pula rodada', '🎮 Manual Mode: pause, speed up 2×/4×, skip the round')}><Controles /></Mini>
            <Mini rot={tr('🔎 vê o NÍVEL do jogador: até Craque', '🔎 see the player’s LEVEL: up to Star')}><CartaNivel tier="prata" nome="Zé Craque" nivel={82} /></Mini>
          </div>
        </Vitrine>
        <Ok><b>{tr('🕵️ Olheiro:', '🕵️ Scout:')}</b> {tr('chance de achar jogador ', 'a chance to find players ')}<b>{tr('fora do leilão', 'outside the auction')}</b>{tr(', de nível até Craque', ', up to Star level')}</Ok>
        <Ok><b>{tr('2 carreiras', '2 careers')}</b>{tr(' salvas ao mesmo tempo · grupo VIP no WhatsApp com o Diego', ' saved at once · VIP WhatsApp group with Diego')}</Ok>
        <p className="ll-support-note">{tr('O olheiro do Craque não revela nem sonda Lendas. No online normal, o ritmo é o mesmo para todos.', 'The Star scout does not reveal or scout Legends. In regular online play, the pace is the same for everyone.')}</p>
        <button className="ll-support-button prata" onClick={() => p.onPay('prata')}>{tr('ESCOLHER CRAQUE · R$ 19,90', 'CHOOSE STAR · R$ 19.90')}</button>
        <p className="ll-support-addon">{tr('Quer também escudo, mascote, manto e nome do estádio? Sendo Craque, adicione o Sócio por apenas R$ 4,90/mês. Inclui carteirinha e 30 moedas a cada 30 dias. Cancele quando quiser.', 'Want a crest, mascot, kit and stadium name too? As a Star, add Membership for only R$ 4.90/month. Includes a membership card and 30 coins every 30 days. Cancel anytime.')}</p>
        {memberButton('prata')}
      </SupportPlanCard>

      <SupportPlanCard id="support-ouro" title={tr('👑 Lenda', '👑 Legend')} price="R$ 39,90" cadence={tr('uma vez só · ou +R$ 20 se já é Craque', 'one-off · or +R$ 20 if you have Star')} tone="ouro">
        <h3>{tr('Tudo do Craque, sem teto: vê o nível até Lenda, acha jogador fora do leilão até Lenda, brilha em ouro e cria a sua liga.', 'Everything in Star, no ceiling: see levels up to Legend, find players outside the auction up to Legend, shine in gold and create your own league.')}</h3>
        <Vitrine titulo={tr('o que muda na sua tela', 'what changes on your screen')}>
          <LinhaSala tier="ouro" nome={meu} />
          <div className="ll-vit-grid">
            <Mini rot={tr('🔎 vê o NÍVEL do jogador: até 👑 Lenda', '🔎 see the player’s LEVEL: up to 👑 Legend')}><CartaNivel tier="ouro" nome="Pelé" nivel={96} /></Mini>
            <Mini rot={tr('🏆 Minhas Ligas: até 5, com a sua turma', '🏆 My Leagues: up to 5, with your crew')}><div style={{ ...OSW, fontSize: 22, lineHeight: 1 }}>🏆</div><div style={{ ...OSW, fontSize: 9, background: INK, color: GOLD, borderRadius: 6, padding: '2px 6px', display: 'inline-block', marginTop: 3 }}>{tr('LIGA DOS CRIA', 'MY CREW LEAGUE')}</div></Mini>
            <Mini rot={tr('🎨 ouro — ou a cor que você escolher', '🎨 gold — or the colour you choose')}><div style={{ display: 'flex', gap: 3, justifyContent: 'center' }}>{['#FFC400', '#8B5CF6', '#2E9E5B', '#E8503A'].map(c => <span key={c} style={{ width: 16, height: 16, borderRadius: '50%', background: c, border: `2px solid ${INK}` }} />)}</div></Mini>
          </div>
        </Vitrine>
        <Ok><b>{tr('🕵️ Olheiro:', '🕵️ Scout:')}</b> {tr('chance de achar jogador ', 'a chance to find players ')}<b>{tr('fora do leilão', 'outside the auction')}</b>{tr(', de nível até Lenda', ', up to Legend level')}</Ok>
        <Ok><b>{tr('4 carreiras', '4 careers')}</b>{tr(' salvas · 🎮 Modo Manual · grupo VIP no WhatsApp com o Diego', ' saved · 🎮 Manual Mode · VIP WhatsApp group with Diego')}</Ok>
        <p className="ll-support-note">{tr('Já tem Craque? Suba para Lenda pagando a diferença: R$ 20,00.', 'Already have Star? Upgrade to Legend for the difference: R$ 20.00.')}</p>
        <button className="ll-support-button gold" onClick={() => p.onPay('ouro')}>{p.tier === 'prata' ? tr('SUBIR PARA LENDA · R$ 20,00', 'UPGRADE TO LEGEND · R$ 20.00') : tr('ESCOLHER LENDA · R$ 39,90', 'CHOOSE LEGEND · R$ 39.90')}</button>
        <p className="ll-support-addon">{tr('Quer também escudo, mascote, manto e nome do estádio? Sendo Lenda, adicione o Sócio por apenas R$ 2,90/mês. Inclui carteirinha e 30 moedas a cada 30 dias. Cancele quando quiser.', 'Want a crest, mascot, kit and stadium name too? As a Legend, add Membership for only R$ 2.90/month. Includes a membership card and 30 coins every 30 days. Cancel anytime.')}</p>
        {memberButton('ouro')}
      </SupportPlanCard>

      {/* 🖋 os dois batismos (13/10): os MESMOS cartões da vitrine nova, com a regra de série de hoje */}
      <CartoesBatismo onNaming={p.onNaming} />

      {/* ✨ vem por aí (os dois que o Diego deixou) */}
      <div className="ll-vit-breve">
        <h3>{tr('✨ E vem mais por aí — só pra quem apoia', '✨ And more is coming — only for supporters')}</h3>
        <div className="it"><span style={{ fontSize: 22 }}>🚁</span><div><b>{tr('Entrada de gala do SEU jeito', 'A grand entrance YOUR way')}</b><span>{tr('cada clube batizado com a entrada própria: helicóptero, moto, fumaça…', 'every named club with its own entrance: helicopter, bike, smoke…')}</span></div><span className="lock">{tr('batismo', 'naming')}</span></div>
        <div className="it"><span style={{ fontSize: 22 }}>🛡️</span><div><b>{tr('Seu escudo na tela de TODO mundo', 'Your crest on EVERYONE’s screen')}</b><span>{tr('trocou o nome do clube? escudo e mascote seguem você pra qualquer sala', 'renamed your club? crest and mascot follow you into any room')}</span></div><span className="lock">{tr('batismo', 'naming')}</span></div>
        <p>{tr('quem já apoiou recebe tudo isso sem pagar de novo 💛', 'those who already support get all of it without paying again 💛')}</p>
      </div>

      <p className="ll-support-note">{tr('Jogar continua grátis. Os planos mudam visual, ritmo e informação — nunca a força dos jogadores.', 'Playing stays free. Plans change looks, pace and information — never the players’ strength.')}</p>
    <div className="ll-support-bottom"><button className="ll-support-button green" onClick={p.onDonate}>{tr('💛 SÓ APOIAR A RESENHA · QUALQUER VALOR', '💛 JUST CHIP IN · ANY AMOUNT')}</button><button className="ll-support-button" onClick={p.onInstagram}>{tr('SEGUIR NO INSTAGRAM TAMBÉM AJUDA 📲', 'FOLLOWING ON INSTAGRAM HELPS TOO 📲')}</button><SupportMoney /></div>
  </div>
}

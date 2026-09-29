import { useEffect, useRef, type ReactNode } from 'react'
import { tr } from './lang'
import { Escudo } from './escudos'
import { mascoteInteiraDoTime } from './mascotes'
import { MascoteMini } from './mascote-atravessa'
import { APOIO_PERKS, ApoioSheen } from './apoio'
import './support-plans.css'

// ─── 🍯 "ÁGUA NA BOCA" (Diego 29/09): a tela de planos MOSTRA em vez de listar ──
// Mockup aprovado: `scripts/mockup-planos-agua-na-boca.mjs`. Cada plano ganha uma
// vitrine desenhada com as peças REAIS do jogo (o nome na sala com a cor do tier, os
// controles do Manual, a carta com o NÍVEL, e no Batismo escudo + mascote + manto de um
// clube de verdade). Regras de texto dele: é NÍVEL (nunca "nota"/"overall"); olheiro =
// "acha jogador fora do leilão, de nível até X"; nada de contagem de vagas.
const INK = '#0C0C0C', GOLD = '#FFC400', GREEN = '#1B7A3D'
const OSW = { fontFamily: 'Oswald, sans-serif', fontWeight: 700 } as const
const EXEMPLO = 'Al Takhadao FC' // 🦜 o batismo de exemplo (escudo/mascote/manto do jogo)
const CAMISA_EXEMPLO = `${import.meta.env.BASE_URL}mantos-salao/al-takahdao-camisa.webp`

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
  onNaming: () => void
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
    <li><b>{tr('4 carreiras salvas', '4 saved careers')}</b>{tr('Mantenha quatro histórias diferentes ao mesmo tempo.', 'Keep four different stories at the same time.')}</li>
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
        <Ok><b>{tr('4 carreiras', '4 careers')}</b>{tr(' salvas ao mesmo tempo · grupo VIP no WhatsApp com o Diego', ' saved at once · VIP WhatsApp group with Diego')}</Ok>
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
        <Ok><b>{tr('6 carreiras', '6 careers')}</b>{tr(' salvas · 🎮 Modo Manual · grupo VIP no WhatsApp com o Diego', ' saved · 🎮 Manual Mode · VIP WhatsApp group with Diego')}</Ok>
        <p className="ll-support-note">{tr('Já tem Craque? Suba para Lenda pagando a diferença: R$ 20,00.', 'Already have Star? Upgrade to Legend for the difference: R$ 20.00.')}</p>
        <button className="ll-support-button gold" onClick={() => p.onPay('ouro')}>{p.tier === 'prata' ? tr('SUBIR PARA LENDA · R$ 20,00', 'UPGRADE TO LEGEND · R$ 20.00') : tr('ESCOLHER LENDA · R$ 39,90', 'CHOOSE LEGEND · R$ 39.90')}</button>
        <p className="ll-support-addon">{tr('Quer também escudo, mascote, manto e nome do estádio? Sendo Lenda, adicione o Sócio por apenas R$ 2,90/mês. Inclui carteirinha e 30 moedas a cada 30 dias. Cancele quando quiser.', 'Want a crest, mascot, kit and stadium name too? As a Legend, add Membership for only R$ 2.90/month. Includes a membership card and 30 coins every 30 days. Cancel anytime.')}</p>
        {memberButton('ouro')}
      </SupportPlanCard>

      <SupportPlanCard id="support-batismo" title={tr('🖋 Batismo', '🖋 Club naming')} price="R$ 59,90" cadence={tr('a partir de · uma vez · Série A R$ 69,90', 'from · one-off · Division A R$ 69.90')} tone="batismo">
        <h3>{tr('O SEU clube entra no jogo de todo mundo — com escudo, mascote e manto desenhados pra você.', 'YOUR club joins everyone’s game — with a crest, mascot and kit designed for you.')}</h3>
        <Vitrine titulo={tr('as artes são suas (exemplo real: Al Takhadao FC)', 'the artwork is yours (real example: Al Takhadao FC)')}>
          <div className="ll-vit-artes">
            <div><Escudo nome={EXEMPLO} size={72} /><p>{tr('🛡️ escudo', '🛡️ crest')}</p></div>
            <div>{(() => { const a = mascoteInteiraDoTime(EXEMPLO); return a ? <MascoteMini art={a} alt={96} /> : null })()}<p>{tr('🐦 mascote', '🐦 mascot')}</p></div>
            <div><img src={CAMISA_EXEMPLO} alt="" loading="lazy" style={{ height: 84, width: 'auto', display: 'block', margin: '0 auto' }} /><p>{tr('🎽 manto', '🎽 kit')}</p></div>
          </div>
        </Vitrine>
        <Vitrine titulo={tr('e onde tudo isso aparece', 'and where all of it shows up')}>
          <div className="ll-vit-grid">
            <Mini rot={tr('👑 entrada de gala: a sala inteira para pra te ver chegar', '👑 grand entrance: the whole room stops to watch you arrive')}>
              <div style={{ background: 'radial-gradient(ellipse at 50% 30%,#3a2e0a,#000 75%)', borderRadius: 7, padding: '6px 4px 2px' }}>
                <span style={{ display: 'inline-flex', filter: 'drop-shadow(0 0 6px rgba(255,196,0,.9))' }}><Escudo nome={EXEMPLO} size={30} /></span>
                <p style={{ margin: '2px 0 0', ...OSW, fontSize: 7, color: GOLD, letterSpacing: 2 }}>{tr('CHEGOU NA SALA', 'JUST ARRIVED')}</p>
              </div>
            </Mini>
            <Mini rot={tr('⚽ carimbo no gol: a mascote comemora cada bola na rede', '⚽ goal stamp: the mascot celebrates every goal')}>
              <div style={{ position: 'relative', background: GREEN, borderRadius: 7, height: 56, overflow: 'hidden' }}>
                <span style={{ position: 'absolute', left: 4, top: 4, ...OSW, fontSize: 11, color: '#fff' }}>2 × 0</span>
                {(() => { const a = mascoteInteiraDoTime(EXEMPLO); return a ? <span style={{ position: 'absolute', right: 2, bottom: -4, transform: 'rotate(-8deg)' }}><MascoteMini art={a} alt={54} /></span> : null })()}
              </div>
            </Mini>
            <Mini rot={tr('📋 tabela, jornal e ⭐ Champions com o seu escudo', '📋 table, newspaper and ⭐ Champions with your crest')}>
              <div style={{ textAlign: 'left', background: '#fff', border: `2px solid ${INK}`, borderRadius: 7, padding: '3px 4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 3, ...OSW, fontSize: 8, background: APOIO_PERKS.ouro.grad, borderRadius: 4, padding: '2px 3px' }}>1º <Escudo nome={EXEMPLO} size={12} /> Al Takhadao</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 3, ...OSW, fontSize: 8, padding: '2px 3px' }}>2º <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#ddd', display: 'inline-block' }} /> Bolacha FC</div>
              </div>
            </Mini>
          </div>
        </Vitrine>
        <Ok><b>{tr('Tudo do Lenda incluído', 'Everything in Legend included')}</b>{tr(' + ', ' + ')}<b>{tr('sócio pra sempre', 'membership forever')}</b>{tr(' (sem mensalidade): 30 🪙 a cada 30 dias, estádio com o seu nome', ' (no monthly fee): 30 🪙 every 30 days, a stadium with your name')}</Ok>
        <Ok><b>{tr('Selo de Fundador', 'Founder badge')}</b>{tr(' e seu nome no mural do jogo', ' and your name on the game’s wall')}</Ok>
        <Ok><b>{tr('8 carreiras', '8 careers')}</b>{tr(' salvas · seu clube disputa a pirâmide de TODO mundo que joga', ' saved · your club plays in EVERYONE’s pyramid')}</Ok>
        <div className="ll-vit-como">{tr('🖋 Como funciona: você manda o nome e a ideia (ou a arte) · o Diego desenha escudo, mascote e manto · em até 7 dias seu clube está no ar, num post com a sua cara.', '🖋 How it works: you send the name and the idea (or the artwork) · Diego designs the crest, mascot and kit · within 7 days your club is live, in a post made for you.')}</div>
        <div className="ll-support-prices"><div>{tr('SÉRIES B, C, D E VÁRZEA', 'DIVISIONS B, C, D AND VÁRZEA')}<b>R$ 59,90</b></div><div>{tr('SÉRIE A', 'DIVISION A')}<b>R$ 69,90</b></div></div>
        <p className="ll-support-note">{tr('No Batismo de R$ 69,90, seu clube entra na Série A e também aparece no Jogo Rápido e no modo Online. O clube continua seu: nome, escudo, mascote e manto.', 'With the R$ 69.90 Club Naming, your club joins Division A and also appears in Quick Play and Online mode. The club remains yours: name, crest, mascot and kit.')}</p>
        <button className="ll-support-button dark" onClick={p.onNaming}>{tr('QUERO BATIZAR MEU CLUBE →', 'I WANT TO NAME MY CLUB →')}</button>
      </SupportPlanCard>

      {/* ✨ vem por aí (os dois que o Diego deixou) */}
      <div className="ll-vit-breve">
        <h3>{tr('✨ E vem mais por aí — só pra quem apoia', '✨ And more is coming — only for supporters')}</h3>
        <div className="it"><span style={{ fontSize: 22 }}>🚁</span><div><b>{tr('Entrada de gala do SEU jeito', 'A grand entrance YOUR way')}</b><span>{tr('cada clube batizado com a entrada própria: helicóptero, moto, fumaça…', 'every named club with its own entrance: helicopter, bike, smoke…')}</span></div><span className="lock">{tr('batismo', 'naming')}</span></div>
        <div className="it"><span style={{ fontSize: 22 }}>🛡️</span><div><b>{tr('Seu escudo na tela de TODO mundo', 'Your crest on EVERYONE’s screen')}</b><span>{tr('trocou o nome do clube? escudo e mascote seguem você pra qualquer sala', 'renamed your club? crest and mascot follow you into any room')}</span></div><span className="lock">{tr('batismo', 'naming')}</span></div>
        <p>{tr('quem já apoiou recebe tudo isso sem pagar de novo 💛', 'those who already support get all of it without paying again 💛')}</p>
      </div>

      <p className="ll-support-note">{tr('Jogar continua grátis. Os planos mudam visual, ritmo e informação — nunca a força dos jogadores.', 'Playing stays free. Plans change looks, pace and information — never the players’ strength.')}</p>
    <div className="ll-support-bottom"><button className="ll-support-button green" onClick={p.onDonate}>{tr('💛 SÓ APOIAR A RESENHA · QUALQUER VALOR', '💛 JUST CHIP IN · ANY AMOUNT')}</button><button className="ll-support-button" onClick={p.onInstagram}>{tr('SEGUIR NO INSTAGRAM TAMBÉM AJUDA 📲', 'FOLLOWING ON INSTAGRAM HELPS TOO 📲')}</button><SupportStory /></div>
  </div>
}

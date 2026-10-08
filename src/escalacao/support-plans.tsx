import { useEffect, useRef, type ReactNode } from 'react'
import { tr, getLang } from './lang'
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


// 💳 PLANOS V2 (08/10, Diego): 4 planos, nesta ordem — Gratuito · ⭐ Craque completo (R$ 9,90/mês) ·
// 🖋 Batismo Lenda (R$ 69,90) · 🖋✨ Batismo Plus (R$ 79,99). O Craque/Lenda avulso e o sócio pago
// SAÍRAM da vitrine — quem já comprou continua com tudo (o aviso fica no pé da tela).
export type SupportPlanKey = 'gratis' | 'craque' | 'batismo' | 'plus' | 'prata' | 'ouro' | 'socio'
type Props = {
  focus: SupportPlanKey | null
  tier?: string
  name: string
  /** situação do mensal pra mostrar no card (nunca/ativo/cancelado no prazo/vencido) */
  craque: 'nunca' | 'ativo' | 'cancelado_no_prazo' | 'vencido'
  craqueAte?: string | null
  /** pediu o link do mensal e está esperando o Diego */
  pedidoAberto: boolean
  batismoPlano?: 'antigo' | 'lenda' | 'plus' | null
  memberActive: boolean
  onCraque: () => void
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

export function SupportFooter({ onOpen }: { onOpen: () => void }) {
  return <section className="ll-support-footer">
    <h3>{tr('💛 APOIE O LEILÃO LEGENDS', '💛 SUPPORT LEILÃO LEGENDS')}</h3>
    <p>{tr('Ajude o jogo a continuar crescendo e conheça os benefícios de cada plano.', 'Help the game keep growing and explore what each plan includes.')}</p>
    <button onClick={onOpen}>{tr('CONHECER OS PLANOS →', 'EXPLORE THE PLANS →')}</button>
  </section>
}

export function SupportPlanCard({ id, title, price, cadence, tone, children }: { id?: string; title: string; price: string; cadence: string; tone: string; children: ReactNode }) {
  return <article id={id} className={'ll-support-plan ' + tone}><header><h2>{title}</h2><div><strong>{price}</strong><small>{cadence}</small></div></header><div className="ll-support-plan-body">{children}</div></article>
}

export function SupportPlans(p: Props) {
  const root = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!p.focus) return
    // links antigos (?apoie=lenda/craque/nuvem) caem no Craque completo, que é quem tem tudo agora
    const target = p.focus === 'prata' || p.focus === 'ouro' || p.focus === 'socio' ? 'craque' : p.focus
    const timer = setTimeout(() => root.current?.querySelector('#support-' + target)?.scrollIntoView({ block: 'start' }), 40)
    return () => clearTimeout(timer)
  }, [p.focus])
  const en = getLang() === 'en'
  const meu = p.name || tr('Seu Time', 'Your Club')
  const meuTier: 'bege' | 'prata' | 'ouro' = p.tier === 'ouro' ? 'ouro' : p.tier === 'prata' ? 'prata' : 'bege'
  const ate = p.craqueAte ? new Date(p.craqueAte).toLocaleDateString(en ? 'en-GB' : 'pt-BR', { day: '2-digit', month: '2-digit' }) : ''
  const temBatismo = !!p.batismoPlano
  return <div className="ll-support" ref={root}>
    {/* 🌐 a mesma sala, cada um entra de um jeito */}
    <div className="ll-vit-hero">
      <h1>{tr('Na mesma sala,', 'In the same room,')}<br /><b>{tr('cada um entra de um jeito.', 'everyone walks in differently.')}</b></h1>
      <p>{tr('O jogo é grátis e ninguém leva vantagem em campo. O que o apoio muda é ', 'The game is free and nobody gets an edge on the pitch. What support changes is ')}<b>{tr('como o seu clube aparece', 'how your club shows up')}</b>{tr(' — pra você e pra todo mundo.', ' — for you and for everyone.')}</p>
      <div className="ll-vit-sala">
        <p className="ll-vit-rot">{tr('🌐 Técnicos na sala', '🌐 Managers in the room')}</p>
        <LinhaSala tier="ouro" nome="Neymarzetti" clube="Neymarzetti" />
        <LinhaSala tier="ouro" nome={EXEMPLO} clube={EXEMPLO} />
        <LinhaSala tier="ouro" nome="Bolacha FC" />
        <LinhaSala tier={meuTier} nome={meu} />
      </div>
      {meuTier === 'bege' && <p className="ll-vit-hero-pe">{tr('👆 é assim que os outros te veem hoje. ', '👆 this is how others see you today. ')}<b>{tr('Bora mudar isso?', 'Shall we change that?')}</b></p>}
    </div>

    {/* 1️⃣ GRATUITO */}
    <SupportPlanCard id="support-gratis" title={tr('⚽ Gratuito', '⚽ Free')} price="R$ 0" cadence={tr('pra sempre', 'forever')} tone="gratis">
      <h3>{tr('Dá pra jogar muito sem pagar nada.', 'You can play a lot without paying anything.')}</h3>
      <Ok><b>{tr('Carreira', 'Career')}</b>{tr(' (1 carreira salva) e ', ' (1 saved career) and ')}<b>{tr('Jogo Rápido', 'Quick Play')}</b>{tr(' contra a máquina', ' against the computer')}</Ok>
      <Ok>{tr('Entra em ', 'Join ')}<b>{tr('salas públicas', 'public rooms')}</b>{tr(' e aceita ', ' and accept ')}<b>{tr('convites', 'invites')}</b></Ok>
      <Ok>{tr('Joga nas ', 'Play in your friends’ ')}<b>{tr('salas e ligas dos amigos', 'rooms and leagues')}</b>{tr(' — mesmo que o dono seja pagante, você não paga nada pra entrar', ' — even if the owner pays, you pay nothing to join')}</Ok>
      <p className="ll-support-note">{tr('Entrar na sala de um pagante não te dá os benefícios dele: cada um leva os do próprio plano.', 'Joining a paying owner’s room doesn’t give you their perks: everyone keeps their own plan’s perks.')}</p>
      {meuTier === 'bege' && !temBatismo && <p className="ll-vit-seu">{tr('✅ seu plano hoje', '✅ your plan today')}</p>}
    </SupportPlanCard>

    {/* 2️⃣ CRAQUE COMPLETO */}
    <SupportPlanCard id="support-craque" title={tr('⭐ Craque completo', '⭐ Full Star')} price="R$ 9,90" cadence={tr('por mês · cancela quando quiser', 'per month · cancel anytime')} tone="ouro">
      <h3>{tr('Tudo o que era do Craque e do Lenda num plano só: ritmo na sua mão, nível até Lenda, visual premium e a sua turma nas suas salas.', 'Everything from Star and Legend in one plan: the pace in your hands, levels up to Legend, premium look and your crew in your rooms.')}</h3>
      <Vitrine titulo={tr('o que muda na sua tela', 'what changes on your screen')}>
        <LinhaSala tier="ouro" nome={meu} />
        <div className="ll-vit-grid">
          <Mini rot={tr('🎮 Modo Manual: pausa, acelera 2×/4×, pula rodada', '🎮 Manual Mode: pause, speed up 2×/4×, skip the round')}><Controles /></Mini>
          <Mini rot={tr('🔎 vê o NÍVEL do jogador: até 👑 Lenda', '🔎 see the player’s LEVEL: up to 👑 Legend')}><CartaNivel tier="ouro" nome="Pelé" nivel={96} /></Mini>
          <Mini rot={tr('🏆 Minhas Ligas: a liga da sua turma', '🏆 My Leagues: your crew’s league')}><div style={{ ...OSW, fontSize: 22, lineHeight: 1 }}>🏆</div><div style={{ ...OSW, fontSize: 9, background: INK, color: GOLD, borderRadius: 6, padding: '2px 6px', display: 'inline-block', marginTop: 3 }}>{tr('LIGA DOS CRIA', 'MY CREW LEAGUE')}</div></Mini>
        </div>
      </Vitrine>
      <Ok><b>{tr('🕵️ Olheiro:', '🕵️ Scout:')}</b> {tr('acha jogador ', 'finds players ')}<b>{tr('fora do leilão', 'outside the auction')}</b>{tr(', de nível até Lenda', ', up to Legend level')}</Ok>
      <Ok><b>{tr('Visual premium', 'Premium look')}</b>{tr(' com brilho dourado em todo canto · ', ' with gold shine everywhere · ')}<b>{tr('4 carreiras', '4 careers')}</b>{tr(' salvas', ' saved')}</Ok>
      <Ok><b>{tr('Cria salas online', 'Create online rooms')}</b>{tr(' e ', ' and ')}<b>{tr('Minhas Ligas', 'My Leagues')}</b>{tr(' — os amigos entram de graça', ' — friends join for free')}</Ok>
      <Ok><b>{tr('Carreira Online e Bafo', 'Online Career and Bafo')}</b>{tr(' inclusos assim que forem lançados', ' included as soon as they launch')}</Ok>
      <Ok><b>{tr('📲 Grupo VIP', '📲 VIP group')}</b>{tr(' no WhatsApp com o Diego', ' on WhatsApp with Diego')}</Ok>
      {p.craque === 'ativo' && <p className="ll-vit-seu">{en ? `✅ active · renews ${ate}` : `✅ ativo · vale até ${ate}`}</p>}
      {p.craque === 'cancelado_no_prazo' && <p className="ll-vit-seu">{en ? `✅ cancelled — still valid until ${ate}` : `✅ cancelado — continua valendo até ${ate}`}</p>}
      {p.craque !== 'ativo' && p.craque !== 'cancelado_no_prazo' && (temBatismo
        ? <p className="ll-support-note">{tr('Você tem batismo: tudo do Craque já é seu, pra sempre. Não precisa assinar. 💛', 'You own a club naming: everything in Star is already yours, forever. No need to subscribe. 💛')}</p>
        : <button className="ll-support-button gold" onClick={p.onCraque}>{p.pedidoAberto ? tr('📲 PEDIDO ENVIADO · VER COMO ESTÁ', '📲 REQUEST SENT · SEE STATUS') : p.craque === 'vencido' ? tr('VOLTAR PRO CRAQUE · R$ 9,90/MÊS', 'COME BACK TO STAR · R$ 9.90/MONTH') : tr('QUERO O CRAQUE · R$ 9,90/MÊS', 'I WANT STAR · R$ 9.90/MONTH')}</button>)}
      <p className="ll-support-addon">{tr('Cancelou? Continua valendo até o fim do mês pago. Se vencer, voltam as regras do gratuito — seus saves, ligas e histórico continuam guardados.', 'Cancelled? It stays valid until the end of the paid month. If it lapses, the free rules come back — your saves, leagues and history stay stored.')}</p>
    </SupportPlanCard>

    {/* 3️⃣ BATISMO LENDA */}
    <SupportPlanCard id="support-batismo" title={tr('🖋 Batismo Lenda', '🖋 Legend Naming')} price="R$ 69,90" cadence={tr('uma vez só · pra sempre', 'one-off · forever')} tone="batismo">
      <h3>{tr('Tudo do Craque, para sempre, sem mensalidade + seu clube personalizado.', 'Everything in Star, forever, no monthly fee + your own custom club.')}</h3>
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
      <Ok><b>{tr('Tudo do Craque completo, pra sempre', 'Everything in Full Star, forever')}</b>{tr(' — sem mensalidade', ' — no monthly fee')}</Ok>
      <Ok>{tr('Seu clube na ', 'Your club in ')}<b>{tr('Série A', 'Division A')}</b>{tr(', no ', ', in ')}<b>{tr('Jogo Rápido', 'Quick Play')}</b>{tr(' e no ', ' and in ')}<b>Online</b></Ok>
      <Ok><b>{tr('Sócio pra sempre', 'Member forever')}</b>{tr(': estádio com o nome que você escolher, 30 🪙 a cada 30 dias e selo de Fundador', ': a stadium named by you, 30 🪙 every 30 days and the Founder badge')}</Ok>
      <Ok><b>{tr('Entrada de gala', 'Grand entrance')}</b>{tr(' padrão com o seu escudo', ' (standard) with your crest')}</Ok>
      <div className="ll-vit-como">{tr('🖋 Como funciona: você manda o nome e a ideia (ou a arte) · o Diego faz escudo, mascote e manto · em até 7 dias seu clube está no ar, num post com a sua cara.', '🖋 How it works: you send the name and the idea (or the artwork) · Diego makes the crest, mascot and kit · within 7 days your club is live, in a post made for you.')}</div>
      {p.batismoPlano ? <p className="ll-vit-seu">{tr('✅ você já tem batismo', '✅ you already own a club naming')}</p>
        : <button className="ll-support-button dark" onClick={() => p.onNaming('lenda')}>{tr('QUERO O BATISMO LENDA · R$ 69,90', 'I WANT LEGEND NAMING · R$ 69.90')}</button>}
    </SupportPlanCard>

    {/* 4️⃣ BATISMO PLUS */}
    <SupportPlanCard id="support-plus" title={tr('🖋✨ Batismo Plus', '🖋✨ Plus Naming')} price="R$ 79,99" cadence={tr('uma vez só · pra sempre', 'one-off · forever')} tone="plus">
      <h3>{tr('Tudo do Batismo Lenda + entrada de gala única e personalizada + canto de torcida na Carreira.', 'Everything in Legend Naming + a unique custom grand entrance + a crowd chant in Career.')}</h3>
      <Vitrine titulo={tr('o que só o Plus tem', 'what only Plus has')}>
        <div className="ll-vit-grid">
          <Mini rot={tr('🚁 gala ÚNICA: a sua chegada, do seu jeito — só o seu clube tem', '🚁 UNIQUE entrance: your arrival, your way — only your club has it')}>
            <div className="ll-vit-gala">
              <span className="heli">🚁</span>
              <span className="esc"><Escudo nome={EXEMPLO} size={26} /></span>
              <p>{tr('SÓ ESSE CLUBE', 'ONLY THIS CLUB')}</p>
            </div>
          </Mini>
          <Mini rot={tr('🎤 canto da SUA torcida tocando na Carreira', '🎤 YOUR crowd’s chant playing in Career')}>
            <div className="ll-vit-canto"><span>🎤</span>{[6, 12, 18, 10, 16, 8, 14, 20, 9, 13].map((h, i) => <i key={i} style={{ height: h }} />)}</div>
          </Mini>
        </div>
      </Vitrine>
      <Ok><b>{tr('Tudo do Batismo Lenda', 'Everything in Legend Naming')}</b>{tr(' (e tudo do Craque, pra sempre)', ' (and everything in Star, forever)')}</Ok>
      <Ok><b>{tr('Entrada de gala única', 'Unique grand entrance')}</b>{tr(', feita pro seu clube — helicóptero, moto, fumaça… você conta a ideia', ', made for your club — helicopter, bike, smoke… you pitch the idea')}</Ok>
      <Ok><b>{tr('Canto de torcida', 'Crowd chant')}</b>{tr(' do seu clube tocando no estádio da sua Carreira', ' of your club playing at your Career stadium')}</Ok>
      <p className="ll-support-note">{tr('A gala e o canto são feitos sob medida: entram no jogo assim que ficam prontos (o Diego combina com você).', 'The entrance and the chant are made to order: they go into the game as soon as they are ready (Diego sorts it out with you).')}</p>
      {p.batismoPlano === 'plus' ? <p className="ll-vit-seu">{tr('✅ você já tem o Plus', '✅ you already have Plus')}</p>
        : <button className="ll-support-button gold" onClick={() => p.onNaming('plus')}>{p.batismoPlano ? tr('QUERO SUBIR PRO PLUS', 'UPGRADE TO PLUS') : tr('QUERO O BATISMO PLUS · R$ 79,99', 'I WANT PLUS NAMING · R$ 79.99')}</button>}
    </SupportPlanCard>

    {/* 🛟 quem já comprou antes */}
    <div className="ll-vit-antigos">
      <b>{tr('💛 Já apoiou antes?', '💛 Supported before?')}</b>
      <span>{tr('Quem comprou o Craque, o Lenda, o Sócio ou um Batismo continua com TUDO o que tinha, pra sempre. Nada vira mensalidade e nada some.', 'Anyone who bought Star, Legend, Membership or a Club naming keeps EVERYTHING they had, forever. Nothing turns into a subscription and nothing disappears.')}</span>
      {p.memberActive && <button className="ll-support-button purple" onClick={p.onMember}>{tr('ABRIR MINHA ÁREA DE SÓCIO →', 'OPEN MY MEMBER AREA →')}</button>}
    </div>

    <p className="ll-support-note">{tr('Jogar continua grátis. Os planos mudam visual, ritmo e informação — nunca a força dos jogadores.', 'Playing stays free. Plans change looks, pace and information — never the players’ strength.')}</p>
    <div className="ll-support-bottom"><button className="ll-support-button green" onClick={p.onDonate}>{tr('💛 SÓ APOIAR A RESENHA · QUALQUER VALOR', '💛 JUST CHIP IN · ANY AMOUNT')}</button><button className="ll-support-button" onClick={p.onInstagram}>{tr('SEGUIR NO INSTAGRAM TAMBÉM AJUDA 📲', 'FOLLOWING ON INSTAGRAM HELPS TOO 📲')}</button><SupportStory /></div>
  </div>
}

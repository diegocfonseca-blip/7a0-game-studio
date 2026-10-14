import { useEffect, useRef, type ReactNode } from 'react'
import { tr, getLang } from './lang'
import { Escudo } from './escudos'
import { mascoteInteiraDoTime } from './mascotes'
import { MascoteMini } from './mascote-atravessa'
import { APOIO_PERKS, ApoioSheen } from './apoio'
import './support-plans.css'
import { SupportPlanCard, SupportMoney } from './support-plans'
import { PRECOS_UNICO, precoSubida, precoTxt, type PlanoUnico } from './planos-regras'

// 💳 PLANOS V2 (08–09/10) — a vitrine nova, por enquanto SÓ nas contas do Diego (`usePlanos2`, sport.ts).
// Quem não está na lista continua vendo `support-plans.tsx` exatamente como era.
// ─── 🍯 "ÁGUA NA BOCA" (Diego 29/09): a tela de planos MOSTRA em vez de listar ──
// Mockup aprovado: `scripts/mockup-planos-agua-na-boca.mjs`. Cada plano ganha uma
// vitrine desenhada com as peças REAIS do jogo (o nome na sala com a cor do tier, os
// controles do Manual, a carta com o NÍVEL, e no Batismo escudo + mascote + manto de um
// clube de verdade). Regras de texto dele: é NÍVEL (nunca "nota"/"overall"); olheiro =
// "acha jogador fora do leilão, de nível até X"; nada de contagem de vagas.
const INK = '#0C0C0C', GOLD = '#FFC400', GREEN = '#1B7A3D'
const OSW = { fontFamily: 'Oswald, sans-serif', fontWeight: 700 } as const
const EXEMPLO = 'Neymarzetti' // 🦇 o batismo de exemplo (13/10, Diego: "quero que seja o Neymarzetti de exemplo")
const CAMISA_EXEMPLO = `${import.meta.env.BASE_URL}mantos-salao/neymarzetti-camisa-v2.webp`

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
// 🎫 TUDO DO SÓCIO, item por item (13/10, Diego: "quero que liste tudo… serve pros dois planos de batismo também").
// Uma lista só: o cartão do Sócio mostra ela inteira; os dois batismos mostram a MESMA, sem os itens que eles já
// têm do jeito deles (o batismo ganha Fundador nº em vez de número de sócio, e manto/estádio já estão na lista dele).
function ItensSocio({ batismo = false }: { batismo?: boolean }) {
  return <>
    <Ok><b>{tr('🎮 Modo Manual', '🎮 Manual Mode')}</b>{tr(': pausa, acelera 2×/4× e pula rodada', ': pause, speed up 2×/4× and skip the round')}</Ok>
    <Ok><b>{tr('♾️ Cria quantas salas quiser por dia', '♾️ Create as many rooms as you want each day')}</b></Ok>
    {!batismo && <Ok><b>{tr('🎫 Número de sócio', '🎫 Member number')}</b>{tr(' — o seu, com carteirinha', ' — your own, with a member card')}</Ok>}
    <Ok><b>{tr('👑 Nome dourado brilhando', '👑 Shining gold name')}</b>{tr(' nas salas, na tabela, no chat e no jornal', ' in rooms, tables, chat and the newspaper')}</Ok>
    {!batismo && <Ok><b>{tr('🎽 Manto com as cores do seu clube', '🎽 Kit in your club’s colours')}</b>{tr(', pra todo mundo ver', ', for everyone to see')}</Ok>}
    {!batismo && <Ok><b>{tr('🏟️ Estádio com o nome', '🏟️ Stadium named')}</b>{tr(' que você quiser', ' however you like')}</Ok>}
    <Ok><b>{tr('🔎 Vê o nível', '🔎 See the level')}</b>{tr(' de todo jogador, até 👑 Lenda', ' of every player, up to 👑 Legend')}</Ok>
    <Ok><b>{tr('🕵️ Olheiro', '🕵️ Scout')}</b>{tr(': acha jogador ', ': finds players ')}<b>{tr('fora do leilão', 'outside the auction')}</b>{tr(', de nível até Lenda', ', up to Legend level')}</Ok>
    <Ok><b>{tr('🏆 Cria salas online e Minhas Ligas', '🏆 Create online rooms and My Leagues')}</b>{tr(' — os amigos entram de graça', ' — friends join for free')}</Ok>
    <Ok><b>{tr('💾 4 carreiras salvas, guardadas PRA SEMPRE', '💾 4 saved careers, kept FOREVER')}</b>{tr(' na nuvem — todos os seus saves, mesmo parados', ' in the cloud — all your saves, even idle ones')}</Ok>
    <Ok><b>{tr('🌐 Carreira Online e Bafo', '🌐 Online Career and Bafo')}</b>{tr(' inclusos assim que forem lançados', ' included as soon as they launch')}</Ok>
    <Ok><b>{tr('📲 Grupo VIP', '📲 VIP group')}</b>{tr(' no WhatsApp com o Diego', ' on WhatsApp with Diego')}</Ok>
  </>
}
const Controles = () => <div style={{ display: 'flex', gap: 3, justifyContent: 'center', flexWrap: 'wrap' }}>
  {['¼×', '½×', '2×', '4×', tr('⏭ PULAR', '⏭ SKIP')].map((v, i) => <span key={v} style={{ ...OSW, fontSize: 9, border: `2px solid ${INK}`, borderRadius: 6, padding: '2px 5px', background: i === 2 ? INK : '#fff', color: i === 2 ? '#fff' : INK }}>{v}</span>)}
</div>


// 💳 o batismo NÃO é mensal (13/10, Diego: "deixar claro que é uma vez só… pra pessoa não se confundir que tem que pagar
// mensal também igual sócio"). Faixa logo no topo do cartão, antes de qualquer lista.
const UmaVezSo = () => <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '0 0 10px', padding: '8px 10px', background: '#E3F2E7', border: `3px solid ${INK}`, borderRadius: 12, boxShadow: `3px 3px 0 ${INK}` }}>
  <span style={{ fontSize: 22 }}>💳</span>
  <span style={{ fontSize: 13, fontWeight: 800, lineHeight: 1.3 }}><b style={{ ...OSW, fontSize: 15, color: GREEN, textTransform: 'uppercase' }}>{tr('Pagamento único', 'One-off payment')}</b><br />{tr('Paga UMA VEZ e é seu pra sempre. Não é mensal.', 'Pay ONCE and it is yours forever. Not monthly.')}</span>
</div>

// 🖋 OS DOIS BATISMOS (13/10, Diego: "já pode alterar e fazer o que estamos falando aqui pro batismo e batismo lenda").
// Batismo R$ 79,90 · Batismo Lenda R$ 89,90, exemplo Neymarzetti, com a lista inteira do Sócio dentro. Mora aqui e é
// usado nas DUAS vitrines: a pública (support-plans.tsx) e a v2. `serieA`: na v2 os dois batismos vão pra Série A; na
// pública vale a regra de hoje (69,90 = Série B/C/D/Várzea · 89,90 = Série A).
export function CartoesBatismo({ batismoPlano, onNaming, serieA = false, atual = null }: { batismoPlano?: 'antigo' | 'lenda' | 'plus' | null; onNaming: (plano: 'lenda' | 'plus') => void; serieA?: boolean; atual?: PlanoUnico | null }) {
  // 💳 14/10 (Diego): Batismo 79,90 · 🖋️ FUNDADOR 99,90 (era "Batismo Lenda"). Quem já tem plano paga só a diferença.
  const reais = (v: number) => precoTxt(v, getLang() === 'en')
  const subBat = precoSubida('batismo', atual), subFun = precoSubida('fundador', atual)
  return <>
    {/* 3️⃣ BATISMO LENDA */}
    <SupportPlanCard id="support-batismo" title={tr('🖋 Batismo', '🖋 Club Naming')} price={reais(PRECOS_UNICO.batismo)} cadence={tr('PAGA UMA VEZ SÓ · sem mensalidade', 'PAY ONCE · no monthly fee')} tone="batismo">
      <UmaVezSo />
      <h3>{tr('Seu clube no jogo, pra sempre: escudo, mascote e manto desenhados pra você + tudo do Lenda, sem mensalidade.', 'Your club in the game, forever: crest, mascot and kit designed for you + everything in Legend, no monthly fee.')}</h3>
      <Vitrine titulo={tr('as artes são suas (exemplo real: Neymarzetti)', 'the artwork is yours (real example: Neymarzetti)')}>
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
              <div style={{ display: 'flex', alignItems: 'center', gap: 3, ...OSW, fontSize: 8, background: APOIO_PERKS.ouro.grad, borderRadius: 4, padding: '2px 3px' }}>1º <Escudo nome={EXEMPLO} size={12} /> Neymarzetti</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 3, ...OSW, fontSize: 8, padding: '2px 3px' }}>2º <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#ddd', display: 'inline-block' }} /> Bolacha FC</div>
            </div>
          </Mini>
        </div>
      </Vitrine>
      <Ok><b>{tr('🛡️ Escudo próprio', '🛡️ Your own crest')}</b>{tr(' na tabela, no placar, no jornal e na Champions', ' in tables, scoreboards, the newspaper and the Champions')}</Ok>
      <Ok><b>{tr('🐾 Mascote própria', '🐾 Your own mascot')}</b>{tr(' que comemora todo gol, festeja o título e pula no pênalti', ' that celebrates every goal, the title and jumps at penalties')}</Ok>
      <Ok><b>{tr('🎽 Manto do seu clube', '🎽 Your club’s kit')}</b>{tr(', com a camisa na Loja do Clube', ', with the shirt in the Club Shop')}</Ok>
      {serieA
        ? <Ok><b>{tr('⚽ Seu clube aparece pra TODOS os jogadores', '⚽ Your club shows up for EVERY player')}</b>{tr(' — na Série A, no Jogo Rápido, no Online, na tabela e no jornal (em rodízio com os outros clubes batizados)', ' — in Division A, Quick Play, Online, the table and the newspaper (rotating with the other named clubs)')}</Ok>
        : <Ok><b>{tr('⚽ Seu clube aparece pra TODOS os jogadores', '⚽ Your club shows up for EVERY player')}</b>{tr(' — na carreira de todo mundo (Série B, C, D ou Várzea), no Online, na tabela e no jornal (em rodízio com os outros clubes batizados)', ' — in everyone’s career (Série B, C, D or Várzea), Online, the table and the newspaper (rotating with the other named clubs)')}</Ok>}
      <Ok><b>{tr('👑 Entrada de gala', '👑 Grand entrance')}</b>{tr(' com o seu escudo: a sala inteira para pra te ver chegar', ' with your crest: the whole room stops to watch you arrive')}</Ok>
      <Ok><b>{tr('🏟️ Estádio com o nome', '🏟️ Stadium named')}</b>{tr(' que você escolher', ' however you choose')}</Ok>
      <Ok><b>{tr('🪙 30 moedas a cada 30 dias', '🪙 30 coins every 30 days')}</b>{tr(', pra sempre', ', forever')}</Ok>
      <Ok><b>{tr('🔒 Nome reservado', '🔒 Reserved name')}</b>{tr(' — ninguém mais usa o nome do seu clube', ' — nobody else can use your club’s name')}</Ok>
      <p className="ll-vit-rot" style={{ margin: '10px 0 4px' }}>{tr('👑 e tudo do Lenda, pra sempre e sem mensalidade:', '👑 and everything in Legend, forever with no monthly fee:')}</p>
      <ItensSocio batismo />
      <div className="ll-vit-como">{tr('🖋 Como funciona: você manda o nome e a ideia (ou a arte) · o Diego faz escudo, mascote e manto · em até 7 dias seu clube está no ar, num post com a sua cara.', '🖋 How it works: you send the name and the idea (or the artwork) · Diego makes the crest, mascot and kit · within 7 days your club is live, in a post made for you.')}</div>
      {batismoPlano ? <p className="ll-vit-seu">{tr('✅ você já tem batismo', '✅ you already own a club naming')}</p>
        : <button className="ll-support-button dark" onClick={() => onNaming('lenda')}>{atual ? tr(`SUBIR PRO BATISMO · + ${reais(subBat)}`, `UPGRADE TO CLUB NAMING · + ${reais(subBat)}`) : tr(`QUERO O BATISMO · ${reais(PRECOS_UNICO.batismo)} UMA VEZ SÓ`, `I WANT CLUB NAMING · ${reais(PRECOS_UNICO.batismo)} ONCE`)}</button>}
    </SupportPlanCard>

    {/* 4️⃣ FUNDADOR (era Batismo Lenda até 14/10) — o único que ganha número de fundador */}
    <SupportPlanCard id="support-plus" title={tr('🖋 Fundador', '🖋 Founder')} price={reais(PRECOS_UNICO.fundador)} cadence={tr('PAGA UMA VEZ SÓ · sem mensalidade', 'PAY ONCE · no monthly fee')} tone="plus">
      <UmaVezSo />
      <h3>{tr('O topo: tudo do Batismo, com o clube na SÉRIE A + uma entrada de gala SÓ SUA (como o helicóptero do Neymarzetti) + o canto da sua torcida na Carreira + o seu NÚMERO DE FUNDADOR.', 'The top one: everything in Club Naming, with the club in DIVISION A + a grand entrance that is ONLY YOURS (like Neymarzetti’s helicopter) + your crowd’s chant in Career + your FOUNDER NUMBER.')}</h3>
      <Vitrine titulo={tr('o que só o Fundador tem', 'what only Founder has')}>
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
      <Ok><b>{tr('🚁 Entrada de gala ÚNICA', '🚁 UNIQUE grand entrance')}</b>{tr(' — helicóptero, moto, fumaça… você conta a ideia e ela é só do seu clube', ' — helicopter, bike, smoke… you pitch the idea and it is only your club’s')}</Ok>
      <Ok><b>{tr('🎤 Canto da sua torcida', '🎤 Your crowd’s chant')}</b>{tr(' tocando no estádio da sua Carreira', ' playing at your Career stadium')}</Ok>
      <Ok><b>{tr('🛡️🐾🎽 Escudo, mascote e manto', '🛡️🐾🎽 Crest, mascot and kit')}</b>{tr(' desenhados pra você', ' designed for you')}</Ok>
      <Ok><b>{tr('⚽ Série A, Jogo Rápido e Online', '⚽ Division A, Quick Play and Online')}</b>{tr(' com o seu clube, pra todos os jogadores (em rodízio com os outros clubes batizados)', ' with your club, for every player (rotating with the other named clubs)')}</Ok>
      <Ok><b>{tr('🖋️ Fundador nº', '🖋️ Founder no.')}</b>{tr(' — seu número no mural do jogo, pra sempre. Só quem é Fundador tem.', ' — your number on the game’s wall, forever. Only Founders get one.')}</Ok>
      <Ok><b>{tr('🏟️ Estádio com nome', '🏟️ Named stadium')}</b>{tr(' e 30 🪙 a cada 30 dias, pra sempre', ' and 30 🪙 every 30 days, forever')}</Ok>
      <Ok><b>{tr('🔒 Nome reservado', '🔒 Reserved name')}</b>{tr(' — ninguém mais usa o nome do seu clube', ' — nobody else can use your club’s name')}</Ok>
      <p className="ll-vit-rot" style={{ margin: '10px 0 4px' }}>{tr('👑 e tudo do Lenda, pra sempre e sem mensalidade:', '👑 and everything in Legend, forever with no monthly fee:')}</p>
      <ItensSocio batismo />
      <p className="ll-support-note">{tr('A gala e o canto são feitos sob medida: entram no jogo assim que ficam prontos (o Diego combina com você).', 'The entrance and the chant are made to order: they go into the game as soon as they are ready (Diego sorts it out with you).')}</p>
      {batismoPlano === 'plus' ? <p className="ll-vit-seu">{tr('✅ você já é Fundador', '✅ you are already a Founder')}</p>
        : <button className="ll-support-button gold" onClick={() => onNaming('plus')}>{atual ? tr(`SUBIR PRO FUNDADOR · + ${reais(subFun)}`, `UPGRADE TO FOUNDER · + ${reais(subFun)}`) : tr(`QUERO SER FUNDADOR · ${reais(PRECOS_UNICO.fundador)} UMA VEZ SÓ`, `I WANT FOUNDER · ${reais(PRECOS_UNICO.fundador)} ONCE`)}</button>}
    </SupportPlanCard>
  </>
}

// 💳 PLANOS V2 (08/10, Diego): 4 planos, nesta ordem — Gratuito · ⭐ Craque completo (R$ 9,90/mês) ·
// 🖋 Batismo Lenda (R$ 79,90) · 🖋✨ Batismo Plus (R$ 89,90). O Craque/Lenda avulso e o sócio pago
// SAÍRAM da vitrine — quem já comprou continua com tudo (o aviso fica no pé da tela).
export type SupportPlanKeyV2 = 'gratis' | 'craque' | 'batismo' | 'plus' | 'prata' | 'ouro' | 'socio'
type Props = {
  focus: SupportPlanKeyV2 | null
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

export function SupportPlansV2(p: Props) {
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
    {/* 💸 14/10 (Diego): "pra onde vai o dinheiro" mora LÁ EM CIMA de tudo; depois "na mesma sala…" e os planos */}
    <div style={{ marginBottom: 16 }}><SupportMoney /></div>
    {/* 🌐 a mesma sala, cada um entra de um jeito */}
    <div className="ll-vit-hero">
      <h1>{tr('Na mesma sala,', 'In the same room,')}<br /><b>{tr('cada um entra de um jeito.', 'everyone walks in differently.')}</b></h1>
      <p>{tr('O jogo é grátis e ninguém leva vantagem em campo. O que o apoio muda é ', 'The game is free and nobody gets an edge on the pitch. What support changes is ')}<b>{tr('como o seu clube aparece', 'how your club shows up')}</b>{tr(' — pra você e pra todo mundo.', ' — for you and for everyone.')}</p>
      <div className="ll-vit-sala">
        <p className="ll-vit-rot">{tr('🌐 Técnicos na sala', '🌐 Managers in the room')}</p>
        <LinhaSala tier="ouro" nome="Neymarzetti" clube="Neymarzetti" />
        <LinhaSala tier="ouro" nome="Al Takhadao FC" clube="Al Takhadao FC" />
        <LinhaSala tier="ouro" nome="Bolacha FC" />
        <LinhaSala tier={meuTier} nome={meu} />
      </div>
      {meuTier === 'bege' && <p className="ll-vit-hero-pe">{tr('👆 é assim que os outros te veem hoje. ', '👆 this is how others see you today. ')}<b>{tr('Bora mudar isso?', 'Shall we change that?')}</b></p>}
    </div>

    {/* 1️⃣ GRATUITO */}
    <SupportPlanCard id="support-gratis" title={tr('⚽ Gratuito', '⚽ Free')} price="R$ 0" cadence={tr('pra sempre', 'forever')} tone="gratis">
      <h3>{tr('Dá pra jogar muito sem pagar nada.', 'You can play a lot without paying anything.')}</h3>
      <Ok><b>{tr('Carreira', 'Career')}</b>{tr(' (1 carreira salva) e ', ' (1 saved career) and ')}<b>{tr('Jogo Rápido', 'Quick Play')}</b>{tr(' contra a máquina', ' against the computer')}</Ok>
      <Ok>{tr('Entra em ', 'Join ')}<b>{tr('quantas salas quiser', 'as many rooms as you want')}</b>{tr(' — públicas, de convite e dos amigos', ' — public, invite-only and your friends’')}</Ok>
      <Ok><b>{tr('🌐 Cria 1 sala online por dia', '🌐 Create 1 online room a day')}</b></Ok>
      <Ok>{tr('Joga nas ', 'Play in your friends’ ')}<b>{tr('salas e ligas dos amigos', 'rooms and leagues')}</b>{tr(' — mesmo que o dono seja pagante, você não paga nada pra entrar', ' — even if the owner pays, you pay nothing to join')}</Ok>
      <Ok><b>{tr('🃏 Todos os baralhos', '🃏 Every deck')}</b>{tr(': Brasil, Europa e Resto do Mundo', ': Brazil, Europe and Rest of the World')}</Ok>
      <Ok><b>{tr('🐊 Tocaia e 🧱 Leilão de Clubes', '🐊 Tocaia and 🧱 Clubs Auction')}</b>{tr(' nas salas rápidas', ' in quick rooms')}</Ok>
      <Ok><b>{tr('🌍 Copa do Mundo, Liberta, Champions e Copas regionais', '🌍 World Cup, Liberta, Champions and regional Cups')}</b>{tr(' depois da liga', ' after the league')}</Ok>
      <Ok><b>{tr('📊 Ranking da semana', '📊 Weekly ranking')}</b>{tr(' e a medalha 🥇 do top 3', ' and the top 3 🥇 medal')}</Ok>
      <p className="ll-support-note">{tr('💾 No gratuito a carreira fica salva no aparelho, e carreira parada há mais de 30 dias sem jogar é apagada. Entrar na sala de um pagante não te dá os benefícios dele: cada um leva os do próprio plano.', '💾 On the free plan your career is saved on the device, and a career left unplayed for more than 30 days is deleted. Joining a paying owner’s room doesn’t give you their perks: everyone keeps their own plan’s perks.')}</p>
      {meuTier === 'bege' && !temBatismo && <p className="ll-vit-seu">{tr('✅ seu plano hoje', '✅ your plan today')}</p>}
    </SupportPlanCard>

    {/* 2️⃣ CRAQUE COMPLETO */}
    <SupportPlanCard id="support-craque" title={tr('🎫 Sócio', '🎫 Member')} price="R$ 9,90" cadence={tr('por mês · cancela quando quiser', 'per month · cancel anytime')} tone="ouro">
      <h3>{tr('Vira sócio do Leilão Legends: ganha seu número de sócio, o nome dourado brilhando em todo canto e o jogo inteiro na sua mão.', 'Become a Leilão Legends member: get your member number, your name in shining gold everywhere and the whole game in your hands.')}</h3>
      <Vitrine titulo={tr('o que muda na sua tela', 'what changes on your screen')}>
        <div className="ll-vit-grid">
          <Mini rot={tr('🎮 Modo Manual: pausa, acelera 2×/4×, pula rodada', '🎮 Manual Mode: pause, speed up 2×/4×, skip the round')}><Controles /></Mini>
          <Mini rot={tr('🔎 vê o NÍVEL do jogador: até 👑 Lenda', '🔎 see the player’s LEVEL: up to 👑 Legend')}><CartaNivel tier="ouro" nome="Pelé" nivel={96} /></Mini>
          <Mini rot={tr('🏆 Minhas Ligas: a liga da sua turma', '🏆 My Leagues: your crew’s league')}><div style={{ ...OSW, fontSize: 22, lineHeight: 1 }}>🏆</div><div style={{ ...OSW, fontSize: 9, background: INK, color: GOLD, borderRadius: 6, padding: '2px 6px', display: 'inline-block', marginTop: 3 }}>{tr('LIGA DOS CRIA', 'MY CREW LEAGUE')}</div></Mini>
        </div>
        {/* 👑 exemplo do nome dourado (13/10, Diego: "faltou só o exemplo do nome dourado") — antes × depois */}
        <p className="ll-vit-rot" style={{ marginTop: 8 }}>{tr('👑 seu nome nas salas, na tabela e no chat', '👑 your name in rooms, tables and chat')}</p>
        <p style={{ margin: '0 0 3px', fontSize: 11, fontWeight: 700, color: 'rgba(12,12,12,.6)' }}>{tr('grátis', 'free')}</p>
        <LinhaSala tier="bege" nome={meu} />
        <p style={{ margin: '6px 0 3px', fontSize: 11, fontWeight: 800, color: INK }}>{tr('sócio ✨ dourado brilhando', 'member ✨ shining gold')}</p>
        <LinhaSala tier="ouro" nome={meu} />
      </Vitrine>
      <ItensSocio />
      {p.craque === 'ativo' && <p className="ll-vit-seu">{en ? `✅ active · renews ${ate}` : `✅ ativo · vale até ${ate}`}</p>}
      {p.craque === 'cancelado_no_prazo' && <p className="ll-vit-seu">{en ? `✅ cancelled — still valid until ${ate}` : `✅ cancelado — continua valendo até ${ate}`}</p>}
      {p.craque !== 'ativo' && p.craque !== 'cancelado_no_prazo' && (temBatismo
        ? <p className="ll-support-note">{tr('Você tem batismo: tudo do Sócio já é seu, pra sempre. Não precisa assinar. 💛', 'You own a club naming: everything in Member is already yours, forever. No need to subscribe. 💛')}</p>
        : <button className="ll-support-button gold" onClick={p.onCraque}>{p.pedidoAberto ? tr('📲 PEDIDO ENVIADO · VER COMO ESTÁ', '📲 REQUEST SENT · SEE STATUS') : p.craque === 'vencido' ? tr('VOLTAR A SER SÓCIO · R$ 9,90/MÊS', 'BECOME A MEMBER AGAIN · R$ 9.90/MONTH') : tr('QUERO SER SÓCIO · R$ 9,90/MÊS', 'I WANT TO BE A MEMBER · R$ 9.90/MONTH')}</button>)}
      <p className="ll-support-addon">{tr('Cancelou? Continua valendo até o fim do mês pago. Se vencer, voltam as regras do gratuito — seus saves, ligas e histórico continuam guardados.', 'Cancelled? It stays valid until the end of the paid month. If it lapses, the free rules come back — your saves, leagues and history stay stored.')}</p>
    </SupportPlanCard>

    <CartoesBatismo batismoPlano={p.batismoPlano} onNaming={p.onNaming} serieA />

    {/* 🛟 quem já comprou antes */}
    <div className="ll-vit-antigos">
      <b>{tr('💛 Já apoiou antes?', '💛 Supported before?')}</b>
      <span>{tr('Quem comprou o Craque, o Lenda, o Sócio ou um Batismo continua com TUDO o que tinha, pra sempre. Nada vira mensalidade e nada some.', 'Anyone who bought Star, Legend, Membership or a Club naming keeps EVERYTHING they had, forever. Nothing turns into a subscription and nothing disappears.')}</span>
      {p.memberActive && <button className="ll-support-button purple" onClick={p.onMember}>{tr('ABRIR MINHA ÁREA DE SÓCIO →', 'OPEN MY MEMBER AREA →')}</button>}
    </div>

    <p className="ll-support-note">{tr('Jogar continua grátis. Os planos mudam visual, ritmo e informação — nunca a força dos jogadores.', 'Playing stays free. Plans change looks, pace and information — never the players’ strength.')}</p>
    <div className="ll-support-bottom"><button className="ll-support-button green" onClick={p.onDonate}>{tr('💛 SÓ APOIAR A RESENHA · QUALQUER VALOR', '💛 JUST CHIP IN · ANY AMOUNT')}</button><button className="ll-support-button" onClick={p.onInstagram}>{tr('SEGUIR NO INSTAGRAM TAMBÉM AJUDA 📲', 'FOLLOWING ON INSTAGRAM HELPS TOO 📲')}</button></div>
  </div>
}

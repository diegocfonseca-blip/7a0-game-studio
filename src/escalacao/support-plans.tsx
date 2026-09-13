import { useEffect, useRef, useState, type ReactNode } from 'react'
import { tr } from './lang'
import './support-plans.css'

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
    <li><b>{tr('Modo Manual na carreira', 'Manual Mode in Career')}</b>{tr('Pause, altere a velocidade, pule ou avance a rodada.', 'Pause, adjust the speed, skip or advance the round.')}</li>
    <li><b>{tr('Olheiro até a categoria Craque', 'Scout up to Star')}</b>{tr('Veja o nível no elenco após contratar e sonde jogadores até Craque.', 'See ratings in your squad after signing and scout players up to Star.')}</li>
    <li><b>{tr('Visual prata com brilho', 'Shining silver look')}</b>{tr('No nome, estádio, elenco e tabelas.', 'On your name, stadium, squad and tables.')}</li>
    <li><b>{tr('Grupo VIP + 4 carreiras salvas', 'VIP group + 4 saved careers')}</b>{tr('Bastidores, novidades e contato com o Diego no WhatsApp.', 'Behind the scenes, news and contact with Diego on WhatsApp.')}</li>
  </ul>
}

export function SupportPlanCard({ id, title, price, cadence, tone, children }: { id?: string; title: string; price: string; cadence: string; tone: string; children: ReactNode }) {
  return <article id={id} className={'ll-support-plan ' + tone}><header><h2>{title}</h2><div><strong>{price}</strong><small>{cadence}</small></div></header><div className="ll-support-plan-body">{children}</div></article>
}

export function SupportPlans(p: Props) {
  const [view, setView] = useState<'overview' | 'permanent' | 'club' | 'compare'>('overview')
  const [left, setLeft] = useState<SupportPlanKey>('prata')
  const [right, setRight] = useState<SupportPlanKey>('ouro')
  const root = useRef<HTMLDivElement>(null)
  const [target, setTarget] = useState<SupportPlanKey | null>(null)
  const open = (key: SupportPlanKey) => { setView(key === 'prata' || key === 'ouro' ? 'permanent' : 'club'); setTarget(key) }
  useEffect(() => { if (p.focus) { setView(p.focus === 'prata' || p.focus === 'ouro' ? 'permanent' : 'club'); setTarget(p.focus) } }, [p.focus])
  useEffect(() => { const timer = setTimeout(() => { ((target ? root.current?.querySelector('#support-' + target) : null) || root.current)?.scrollIntoView({ block: 'start' }) }, 40); return () => clearTimeout(timer) }, [view, target])
  const monthly = p.tier === 'ouro' ? '2,90' : p.tier === 'prata' ? '4,90' : '9,90'
  const names = { prata: tr('⭐ Craque', '⭐ Star'), ouro: tr('👑 Lenda', '👑 Legend'), batismo: tr('🖋 Batismo', '🖋 Club naming'), socio: tr('🎫 Sócio', '🎫 Membership') }
  const back = <button className="ll-support-button" onClick={() => setView('overview')}>{tr('← TODOS OS PLANOS', '← ALL PLANS')}</button>
  return <div className="ll-support" ref={root}>
    {view !== 'overview' && back}
    {view === 'overview' && <>
      <div className="ll-support-hero"><small>{tr('FAÇA PARTE DESSA HISTÓRIA', 'BE PART OF THIS STORY')}</small><h1>{tr('SEU APOIO FAZ O JOGO CRESCER.', 'YOUR SUPPORT HELPS THE GAME GROW.')}</h1><p>{tr('Escolha os extras que combinam com você e ajude a manter o Leilão Legends vivo.', 'Choose the extras that suit you and help keep Leilão Legends alive.')}</p></div>
      <h3 className="ll-support-section">{tr('PAGUE UMA VEZ · BENEFÍCIOS PERMANENTES', 'PAY ONCE · PERMANENT BENEFITS')}</h3>
      {([
        ['prata', 'R$ 19,90', tr('Modo Manual, olheiro até Craque, visual prata, grupo VIP e 4 saves.', 'Manual Mode, scouting up to Star, silver look, VIP group and 4 saves.')],
        ['ouro', 'R$ 39,90', tr('Tudo do Craque + olheiro até Lenda, visual ouro, criar sua Liga e 6 saves.', 'Everything in Star + scouting up to Legend, gold look, your own League and 6 saves.')],
        ['batismo', 'R$ 59,90', tr('Seu clube no jogo de todo mundo. Lenda + Sócio inclusos.', 'Your club in everyone’s game. Legend + Membership included.')],
      ] as const).map(([key, price, text]) => <button key={key} className={'ll-support-summary ' + key} onClick={() => open(key)}><span className="ll-support-summary-head"><b>{names[key]}</b><span>{price}<small>{key === 'batismo' ? tr('a partir de · uma vez', 'from · one-off') : tr('pagamento único', 'one-off payment')}</small></span></span><span>{text} →</span></button>)}
      <h3 className="ll-support-section">{tr('APOIE TODO MÊS · CANCELE QUANDO QUISER', 'SUPPORT MONTHLY · CANCEL ANYTIME')}</h3>
      <button className="ll-support-summary socio" onClick={() => open('socio')}><span className="ll-support-summary-head"><b>{names.socio}</b><span>{p.memberActive ? tr('ATIVO', 'ACTIVE') : 'R$ ' + monthly}<small>{p.memberActive ? tr('seus benefícios', 'your benefits') : tr('por mês · seu preço', 'per month · your price')}</small></span></span><span>{tr('Escudo, mascote, manto, nome do estádio e 30 moedas/mês. Veja as condições. →', 'Crest, mascot, kit, stadium name and 30 coins/month. View the terms. →')}</span></button>
      <button className="ll-support-button gold" onClick={() => setView('compare')}>{tr('COMPARAR OS BENEFÍCIOS →', 'COMPARE THE BENEFITS →')}</button>
      <p className="ll-support-note">{tr('Jogar continua grátis. O apoio libera personalização e recursos extras. Não aumenta os atributos dos jogadores.', 'Playing stays free. Support unlocks customization and extra features. It does not boost player attributes.')}</p>
    </>}
    {view === 'permanent' && <>
      <SupportPlanCard id="support-prata" title={names.prata} price="R$ 19,90" cadence={tr('uma vez só', 'one-off payment')} tone="prata">
        <h3>{tr('O ritmo da carreira na sua mão.', 'The pace of your career in your hands.')}</h3><div className="ll-support-sample prata">{p.name || tr('Seu clube', 'Your club')} ⭐</div><SupportCraqueBenefits />
        <p className="ll-support-note">{tr('O olheiro do Craque não revela nem sonda Lendas. No online normal, o ritmo é o mesmo para todos.', 'The Star scout does not reveal or scout Legends. In regular online play, the pace is the same for everyone.')}</p>
        <button className="ll-support-button prata" onClick={() => p.onPay('prata')}>{tr('ESCOLHER CRAQUE · R$ 19,90', 'CHOOSE STAR · R$ 19.90')}</button><p className="ll-support-small">{tr('Sócio opcional: + R$ 4,90/mês. É uma assinatura separada.', 'Optional Membership: + R$ 4.90/month. A separate subscription.')}</p>
      </SupportPlanCard>
      <SupportPlanCard id="support-ouro" title={names.ouro} price="R$ 39,90" cadence={tr('uma vez só', 'one-off payment')} tone="ouro">
        <h3>{tr('Tudo do Craque, e mais:', 'Everything from Star, plus:')}</h3><div className="ll-support-sample ouro">{p.name || tr('Seu clube', 'Your club')} 👑</div>
        <ul className="ll-support-benefits"><li><b>{tr('Olheiro de todas as categorias', 'Scout for all categories')}</b>{tr('Veja o nível após contratar e sonde qualquer jogador, inclusive Lendas.', 'See ratings after signing and scout any player, including Legends.')}</li><li><b>{tr('Crie sua Liga', 'Create your League')}</b>{tr('Até 5 ligas da sua turma. Acesso aos novos modos entre amigos quando forem lançados.', 'Up to 5 leagues for your crew. Access to new friends-only modes when released.')}</li><li><b>{tr('6 carreiras salvas ao mesmo tempo', '6 saved careers at the same time')}</b>{tr('Inclui Modo Manual e grupo VIP.', 'Includes Manual Mode and the VIP group.')}</li><li><b>{tr('Visual ouro e selo no nome', 'Gold look and name badge')}</b>{tr('Ou escolha outra cor para seu visual.', 'Or choose another colour for your look.')}</li></ul>
        <p className="ll-support-note">{tr('Já tem Craque? Suba para Lenda pagando a diferença: R$ 20,00.', 'Already have Star? Upgrade to Legend for the difference: R$ 20.00.')}</p>
        <button className="ll-support-button gold" onClick={() => p.onPay('ouro')}>{p.tier === 'prata' ? tr('SUBIR PARA LENDA · R$ 20,00', 'UPGRADE TO LEGEND · R$ 20.00') : tr('ESCOLHER LENDA · R$ 39,90', 'CHOOSE LEGEND · R$ 39.90')}</button><p className="ll-support-small">{tr('Sócio opcional: + R$ 2,90/mês. É uma assinatura separada.', 'Optional Membership: + R$ 2.90/month. A separate subscription.')}</p>
      </SupportPlanCard>
      <p className="ll-support-note">{tr('Como funciona o olheiro: o nível aparece depois da contratação. Sondar leva 1 jogador por leilão ao pregão; você ainda precisa disputar o lance. Profissionais, Bons Jogadores e Promessas já podem ser sondados sem apoio.', 'How scouting works: ratings appear after signing. Scouting brings 1 player per auction into bidding; you still have to bid for them. Professionals, Good Players and Prospects can already be scouted without support.')}</p>
    </>}
    {view === 'club' && <>
      <SupportPlanCard id="support-batismo" title={names.batismo} price="R$ 59,90" cadence={tr('a partir de · uma vez', 'from · one-off')} tone="batismo">
        <h3>{tr('Seu clube entra no jogo de todo mundo.', 'Your club joins everyone’s game.')}</h3>
        <ul className="ll-support-benefits"><li><b>{tr('Seu nome num clube da pirâmide', 'Your name on a club in the pyramid')}</b>{tr('Disputa temporadas e aparece nas tabelas e no jornal dos jogadores.', 'Plays seasons and appears in players’ tables and newspapers.')}</li><li><b>{tr('Escudo e mascote desenhados pelo Diego', 'Crest and mascot drawn by Diego')}</b>{tr('Inclui manto e nome do estádio. A mascote comemora seus gols e títulos.', 'Includes kit and stadium name. Your mascot celebrates goals and titles.')}</li><li><b>{tr('Lenda + Sócio completos, inclusos', 'Full Legend + Membership included')}</b>{tr('Olheiro completo, Manual, VIP, 6 saves, ouro e 30 moedas/mês, sem mensalidade extra.', 'Full scout, Manual Mode, VIP, 6 saves, gold and 30 coins/month, at no extra monthly cost.')}</li><li><b>{tr('Selo de Fundador e nome no mural', 'Founder badge and your name on the wall')}</b>{tr('Vagas de fundador disponíveis:', 'Founder places available:')} {p.foundersLeft}/100.</li></ul>
        <div className="ll-support-prices"><div>{tr('SÉRIES B, C, D E VÁRZEA', 'DIVISIONS B, C, D AND VÁRZEA')}<b>R$ 59,90</b></div><div>{tr('SÉRIE A', 'DIVISION A')}<b>R$ 69,90</b></div></div>
        <p className="ll-support-note">{tr('O clube continua seu: nome, escudo, mascote e manto. Se outro batismo entrar acima, a divisão pode mudar. A Série A também aparece no jogo rápido.', 'The club stays yours: name, crest, mascot and kit. If another naming enters above you, the division may change. Division A also appears in quick play.')}</p>
        <button className="ll-support-button dark" onClick={p.onNaming}>{tr('QUERO BATIZAR MEU CLUBE →', 'I WANT TO NAME MY CLUB →')}</button>
      </SupportPlanCard>
      <h3 className="ll-support-section">{tr('ASSINATURA MENSAL · PODE SER SOMADA A UM PLANO', 'MONTHLY SUBSCRIPTION · CAN BE ADDED TO A PLAN')}</h3>
      <SupportPlanCard id="support-socio" title={names.socio} price={p.memberActive ? tr('ATIVO', 'ACTIVE') : 'R$ ' + monthly} cadence={p.memberActive ? tr('sócio nº ', 'member no. ') + (p.memberNumber ?? '—') : tr('por mês', 'per month')} tone="socio">
        <h3>{tr('Personalização e apoio contínuo.', 'Customization and ongoing support.')}</h3><ul className="ll-support-benefits"><li><b>{tr('Escudo e mascote personalizados', 'Custom crest and mascot')}</b>{tr('O Diego faz as artes do seu jeito.', 'Diego creates the art your way.')}</li><li><b>{tr('Manto do coração e nome do estádio', 'Your club colours and stadium name')}</b>{tr('Vista as cores do seu time e batize seu estádio no clube e no jornal.', 'Wear your club colours and name your stadium in the club and newspaper.')}</li><li><b>{tr('Carteirinha numerada + 30 moedas/mês', 'Numbered membership card + 30 coins/month')}</b>{tr('Visual roxo e acesso à sua área de sócio. Craque e Lenda mantêm a cor do próprio plano.', 'Purple look and access to your member area. Star and Legend keep their plan’s own colour.')}</li></ul>
        <div className="ll-support-monthly"><p>{tr('Sem Craque ou Lenda', 'Without Star or Legend')}<b>R$ 9,90/{tr('mês', 'month')}</b></p><p>{tr('Já é Craque', 'Already Star')}<b>R$ 4,90/{tr('mês', 'month')}</b></p><p>{tr('Já é Lenda', 'Already Legend')}<b>R$ 2,90/{tr('mês', 'month')}</b></p><p>{tr('Tem Batismo', 'Have Club naming')}<b>{tr('Já incluso', 'Included')}</b></p></div>
        <p className="ll-support-note">{tr('Sócio sozinho mantém 2 saves e o olheiro básico. Manual, VIP e seu clube no catálogo vêm nos outros apoios.', 'Membership alone keeps 2 saves and basic scouting. Manual Mode, VIP and a club in the game catalog come with other support plans.')}</p>
        <button className="ll-support-button purple" onClick={p.onMember}>{p.memberActive ? tr('ABRIR MINHA ÁREA DE SÓCIO →', 'OPEN MY MEMBER AREA →') : tr('ASSINAR SÓCIO · R$ ', 'SUBSCRIBE · R$ ') + monthly + '/' + tr('MÊS', 'MONTH')}</button><p className="ll-support-small">{tr('Cobrança mensal por cartão no Mercado Pago. Cancele quando quiser.', 'Monthly card payment through Mercado Pago. Cancel anytime.')}</p>
      </SupportPlanCard>
    </>}
    {view === 'compare' && <>
      <h2>{tr('O QUE MUDA ENTRE ELES?', 'WHAT IS DIFFERENT?')}</h2><div className="ll-support-selectors">{([['left', left, setLeft], ['right', right, setRight]] as const).map(([key, value, set]) => <label key={key}>{key === 'left' ? tr('PRIMEIRO APOIO', 'FIRST PLAN') : tr('SEGUNDO APOIO', 'SECOND PLAN')}<select value={value} onChange={e => set(e.target.value as SupportPlanKey)}>{Object.entries(names).map(([k, n]) => <option key={k} value={k}>{n}</option>)}</select></label>)}</div>
      {[
        [tr('Cobrança', 'Payment'), ['R$ 19,90 · ' + tr('uma vez', 'one-off'), 'R$ 39,90 · ' + tr('uma vez', 'one-off'), 'R$ 59,90–69,90 · ' + tr('uma vez', 'one-off'), 'R$ 9,90/' + tr('mês*', 'month*')]],
        [tr('Cor e brilho', 'Colour and shine'), [tr('Prata', 'Silver'), tr('Ouro ou outra cor', 'Gold or another colour'), tr('Ouro ou outra cor', 'Gold or another colour'), tr('Roxo', 'Purple')]],
        [tr('Modo Manual', 'Manual Mode'), ['✓', '✓', '✓', '—']],
        [tr('Olheiro: nível e sondagem', 'Scout: ratings and scouting'), [tr('Até Craque', 'Up to Star'), tr('Até Lendas', 'Up to Legends'), tr('Até Lendas', 'Up to Legends'), tr('Básico', 'Basic')]],
        [tr('Carreiras salvas', 'Saved careers'), ['4','6','6','2']],
        [tr('Grupo VIP', 'VIP group'), ['✓','✓','✓','—']],
        [tr('Escudo próprio', 'Custom crest'), ['—','—','✓','✓']],
        [tr('Mascote própria', 'Custom mascot'), ['—','—','✓','✓']],
        [tr('Manto do coração', 'Your club colours'), ['—','—','✓','✓']],
        [tr('Estádio batizado', 'Named stadium'), ['—','—','✓','✓']],
        [tr('Moedas mensais', 'Monthly coins'), ['—','—','30','30']],
        [tr('Criar Liga e novos modos entre amigos', 'Create League and new friends-only modes'), ['—',tr('✓ Novos modos quando lançados', '✓ New modes when released'),tr('✓ Novos modos quando lançados', '✓ New modes when released'),'—']],
        [tr('Seu nome no catálogo do jogo', 'Your name in the game catalog'), ['—','—','✓','—']],
        [tr('Fundador e mural', 'Founder and wall'), ['—','—','✓','—']],
      ].map(([label, values]) => <div className="ll-support-compare-row" key={label as string}><b>{label}</b><div>{[left,right].map((k,i)=><span key={i}>{values[(['prata','ouro','batismo','socio'] as string[]).indexOf(k)]}</span>)}</div></div>)}
      <p className="ll-support-note">{tr('* Sócio: R$ 4,90/mês com Craque; R$ 2,90/mês com Lenda; incluso no Batismo. O nível só aparece após contratar. Sondagem básica é gratuita; a oferta pelo jogador continua sendo disputada.', '* Membership: R$ 4.90/month with Star; R$ 2.90/month with Legend; included with Club naming. Ratings only appear after signing. Basic scouting is free; bidding for the player is still competitive.')}</p>
    </>}
    <div className="ll-support-bottom"><button className="ll-support-button green" onClick={p.onDonate}>{tr('💛 SÓ APOIAR A RESENHA · QUALQUER VALOR', '💛 JUST CHIP IN · ANY AMOUNT')}</button><button className="ll-support-button" onClick={p.onInstagram}>{tr('SEGUIR NO INSTAGRAM TAMBÉM AJUDA 📲', 'FOLLOWING ON INSTAGRAM HELPS TOO 📲')}</button><SupportStory /></div>
  </div>
}

import { useEmpresario } from '../store'
import { SCOUT_UPGRADES, SERVICE_UPGRADES, LIFESTYLE_UPGRADES } from '../data/events'
import { BUYABLE_CLUBS } from '../data/clubs'
import { C, money, moneyFull, BrutalCard, BrutalButton, BrutalTag } from '../ui'

type Up = { id: string; name: string; description: string; cost: number; effect: string; flag?: string; repGain?: number }

export default function FinanceScreen() {
  const { state, dispatch } = useEmpresario()

  function purchase(up: Up, finalCost: number) {
    if (state.money < finalCost || state.purchasedUpgrades.includes(up.id)) return
    dispatch({ type: 'PURCHASE_UPGRADE', upgradeId: up.id, cost: finalCost, effect: up.effect, repGain: up.repGain })
  }

  const totalClientValue = state.clients.reduce((s, c) => s + c.currentValue, 0)
  const monthlyExpenses = state.weeklyExpenses * 4

  // 🔥 OFERTA DA SEMANA — um item rotativo com 30% de desconto (muda toda semana)
  const allBuyable = [...SCOUT_UPGRADES, ...SERVICE_UPGRADES, ...LIFESTYLE_UPGRADES].filter(u => !state.purchasedUpgrades.includes(u.id))
  const dealId = allBuyable.length ? allBuyable[(state.year * 52 + state.week) % allBuyable.length].id : null

  function UpgradeRow({ up }: { up: Up }) {
    const bought = state.purchasedUpgrades.includes(up.id)
    const onDeal = up.id === dealId && !bought
    const finalCost = onDeal ? Math.round(up.cost * 0.7) : up.cost
    const canAfford = state.money >= finalCost
    return (
      <BrutalCard color={bought ? C.creamDark : onDeal ? C.yellow : 'white'} className="p-4" shadow={bought ? 2 : 4}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {onDeal && <div className="mb-1"><BrutalTag color={C.orange} textColor="#fff">🔥 OFERTA DA SEMANA −30%</BrutalTag></div>}
            <p className="font-black text-black text-sm" style={{ fontFamily: 'Oswald, sans-serif' }}>
              {bought ? '✅ ' : up.flag ? `${up.flag} ` : ''}{up.name}
            </p>
            <p className="text-black/50 text-xs font-medium mt-0.5 leading-relaxed">{up.description}</p>
            <div className="mt-2"><BrutalTag color={onDeal ? 'white' : C.yellow}>⚡ {up.effect}</BrutalTag></div>
          </div>
          <div className="shrink-0 text-right">
            {onDeal && <p className="text-black/40 text-[10px] font-bold line-through">{money(up.cost)}</p>}
            <p className="font-black text-black text-sm mb-2" style={{ fontFamily: 'Oswald, sans-serif' }}>{money(finalCost)}</p>
            {!bought && (
              <BrutalButton color={canAfford ? C.green : '#C9C2AC'} disabled={!canAfford} full={false}
                onClick={() => purchase(up, finalCost)} className="!px-3 !py-2 !text-xs">
                {canAfford ? 'Comprar' : 'Sem $'}
              </BrutalButton>
            )}
          </div>
        </div>
      </BrutalCard>
    )
  }

  return (
    <div className="min-h-screen pb-10" style={{ backgroundColor: C.cream }}>
      <div className="border-b-[3px] border-black px-4 py-3 sticky top-0 z-20" style={{ backgroundColor: C.black }}>
        <div className="max-w-md mx-auto flex items-center gap-3">
          <button onClick={() => dispatch({ type: 'SET_SCREEN', screen: 'dashboard' })} className="text-white text-2xl font-black">←</button>
          <h1 className="text-white font-black text-lg" style={{ fontFamily: 'Oswald, sans-serif' }}>ESCRITÓRIO</h1>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-4 space-y-4">
        {/* balance */}
        <BrutalCard color={C.blue} className="p-5" shadow={6}>
          <p className="text-white/70 font-mono text-xs uppercase tracking-widest">Caixa disponível</p>
          <p className="text-white font-black text-4xl mt-1" style={{ fontFamily: 'Oswald, sans-serif' }}>{moneyFull(state.money)}</p>
          <div className="grid grid-cols-2 gap-2 mt-4">
            <div className="bg-white/15 border-2 border-black rounded-lg p-2">
              <p className="text-white/60 text-[10px] font-black uppercase">Carteira vale</p>
              <p className="text-white font-black text-lg" style={{ fontFamily: 'Oswald, sans-serif' }}>{money(totalClientValue)}</p>
            </div>
            <div className="bg-white/15 border-2 border-black rounded-lg p-2">
              <p className="text-white/60 text-[10px] font-black uppercase">Ganho em deals</p>
              <p className="text-white font-black text-lg" style={{ fontFamily: 'Oswald, sans-serif' }}>{money(state.totalEarned)}</p>
            </div>
          </div>
          {monthlyExpenses > 0 && (
            <p className="text-white/60 text-xs font-bold mt-3">Custo mensal de clientes: −{moneyFull(monthlyExpenses)}</p>
          )}
        </BrutalCard>

        {/* stats */}
        <div className="grid grid-cols-2 gap-3">
          <BrutalCard color={C.pink} className="p-4 text-center">
            <p className="font-black text-black text-3xl" style={{ fontFamily: 'Oswald, sans-serif' }}>{state.totalDeals}</p>
            <p className="text-black/60 text-xs font-bold">Transferências fechadas</p>
          </BrutalCard>
          <BrutalCard color={C.teal} className="p-4 text-center">
            <p className="font-black text-black text-3xl" style={{ fontFamily: 'Oswald, sans-serif' }}>{state.clients.length}</p>
            <p className="text-black/60 text-xs font-bold">Clientes ativos</p>
          </BrutalCard>
        </div>

        {/* SCOUTS */}
        <div>
          <h2 className="font-black text-black text-lg pt-1" style={{ fontFamily: 'Oswald, sans-serif' }}>🔭 OLHEIROS PELO MUNDO</h2>
          <p className="text-black/50 text-xs font-bold mb-3">Você só conhece o Brasil de cor. Contrate olheiros pra revelar lendas de outros países no Radar.</p>
          <div className="space-y-3">
            {SCOUT_UPGRADES.map(up => <UpgradeRow key={up.id} up={up} />)}
          </div>
        </div>

        {/* SERVICES */}
        <div>
          <h2 className="font-black text-black text-lg pt-1" style={{ fontFamily: 'Oswald, sans-serif' }}>💼 ESTRUTURA</h2>
          <p className="text-black/50 text-xs font-bold mb-3">Serviços fixos que resolvem problemas antes de virarem prejuízo.</p>
          <div className="space-y-3">
            {SERVICE_UPGRADES.map(up => <UpgradeRow key={up.id} up={up} />)}
          </div>
        </div>

        {/* LIFESTYLE & STATUS */}
        <div>
          <h2 className="font-black text-black text-lg pt-1" style={{ fontFamily: 'Oswald, sans-serif' }}>💎 ESTILO DE VIDA & STATUS</h2>
          <p className="text-black/50 text-xs font-bold mb-3">Ostentar dá reputação — e reputação destrava os craques mais cobiçados. Seja rico E poderoso.</p>
          <div className="space-y-3">
            {LIFESTYLE_UPGRADES.map(up => <UpgradeRow key={up.id} up={up} />)}
          </div>
        </div>

        {/* buy a club */}
        {state.ownedClub ? (
          <BrutalCard color={C.purple} className="p-5 text-center" shadow={6} onClick={() => dispatch({ type: 'SET_SCREEN', screen: 'club' })}>
            <p className="text-5xl mb-2">🏟️</p>
            <p className="text-white font-black text-lg" style={{ fontFamily: 'Oswald, sans-serif' }}>{state.ownedClub.name}</p>
            <p className="text-white/70 text-xs font-bold mt-1">Você já é dono de um clube! Toque para gerenciar.</p>
          </BrutalCard>
        ) : (
          <div>
            <h2 className="font-black text-black text-lg pt-1" style={{ fontFamily: 'Oswald, sans-serif' }}>🏟️ COMPRAR UM CLUBE</h2>
            <p className="text-black/50 text-xs font-bold mb-3">Vire DONO de um time. Coloque seus clientes nele, lucre da renda e suba de divisão — o começo do império.</p>
            <div className="space-y-3">
              {BUYABLE_CLUBS.map(bc => {
                const canAfford = state.money >= bc.price
                return (
                  <BrutalCard key={bc.id} color={C.purple} className="p-4" shadow={5}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-black text-base" style={{ fontFamily: 'Oswald, sans-serif' }}>{bc.name}</p>
                        <p className="text-white/60 text-xs font-bold">{bc.city} · {bc.division}ª divisão · {bc.fans.toLocaleString('pt-BR')} torcedores</p>
                        <p className="text-white/80 text-xs font-medium mt-1 leading-snug italic">{bc.flavor}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-white font-black text-lg" style={{ fontFamily: 'Oswald, sans-serif' }}>{money(bc.price)}</span>
                      <BrutalButton
                        color={canAfford ? C.green : '#C9C2AC'} disabled={!canAfford} full={false}
                        className="!px-4 !py-2 !text-xs"
                        onClick={() => dispatch({ type: 'BUY_CLUB', clubId: bc.id, name: bc.name, division: bc.division, price: bc.price, fans: bc.fans })}
                      >
                        {canAfford ? 'COMPRAR' : `Falta ${money(bc.price - state.money)}`}
                      </BrutalButton>
                    </div>
                  </BrutalCard>
                )
              })}
            </div>
          </div>
        )}

        {/* CLUB RELATIONS */}
        {Object.keys(state.clubRelations).length > 0 && (
          <div>
            <h2 className="font-black text-black text-lg pt-1" style={{ fontFamily: 'Oswald, sans-serif' }}>🤝 RELAÇÃO COM CLUBES</h2>
            <p className="text-black/50 text-xs font-bold mb-3">Clubes que te amam pagam luvas maiores. Quem você passou a perna te evita.</p>
            <div className="space-y-2">
              {Object.entries(state.clubRelations).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([name, rel]) => (
                <BrutalCard key={name} color="white" className="p-3" shadow={3}>
                  <div className="flex items-center gap-2">
                    <span className="flex-1 text-sm font-black text-black">{name}</span>
                    <div className="w-24 h-3 bg-black/10 border-2 border-black rounded-full overflow-hidden relative">
                      <div className="absolute top-0 bottom-0 rounded-full" style={{
                        left: rel >= 0 ? '50%' : `${50 + rel / 2}%`,
                        width: `${Math.abs(rel) / 2}%`,
                        backgroundColor: rel >= 0 ? C.green : C.orange,
                      }} />
                      <div className="absolute left-1/2 top-0 bottom-0 w-px bg-black/30" />
                    </div>
                    <span className="text-xs font-black w-8 text-right" style={{ color: rel >= 0 ? C.tealDark : C.orange }}>{rel > 0 ? '+' : ''}{rel}</span>
                  </div>
                </BrutalCard>
              ))}
            </div>
          </div>
        )}

        {/* SUBMUNDO — dirty side */}
        <div>
          <h2 className="font-black text-black text-lg pt-1" style={{ fontFamily: 'Oswald, sans-serif' }}>🕵️ O SUBMUNDO</h2>
          <p className="text-black/50 text-xs font-bold mb-3">Atalhos sujos pra lucrar rápido — mas cada um sobe sua SUSPEITA. Se passar dos limites, a federação investiga.</p>
          <BrutalCard color={state.suspicion > 55 ? C.orange : C.creamDark} className="p-3 mb-3" shadow={3}>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-black ${state.suspicion > 55 ? 'text-white' : 'text-black/60'}`}>SUSPEITA</span>
              <div className="flex-1 h-3 bg-black/15 border-2 border-black rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${state.suspicion}%`, backgroundColor: state.suspicion > 70 ? C.orange : state.suspicion > 40 ? C.yellow : C.green }} />
              </div>
              <span className={`text-xs font-black ${state.suspicion > 55 ? 'text-white' : 'text-black'}`}>{state.suspicion}/100</span>
            </div>
          </BrutalCard>
          <div className="space-y-2">
            {[
              { kind: 'maquiar' as const, icon: '💵', name: 'Maquiar transferência', desc: 'Desvia R$80.000 pro caixa dois.', sus: '+16 suspeita' },
              { kind: 'imprensa' as const, icon: '🤐', name: 'Subornar a imprensa', desc: '+6 de reputação na marra.', sus: '+10 suspeita' },
              { kind: 'arbitro' as const, icon: '⚖️', name: 'Comprar a arbitragem', desc: 'Seu craque mais valioso brilha (+valor +moral).', sus: '+18 suspeita' },
            ].map(d => (
              <BrutalCard key={d.kind} color="white" className="p-3" shadow={3}>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{d.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-black text-sm" style={{ fontFamily: 'Oswald, sans-serif' }}>{d.name}</p>
                    <p className="text-black/50 text-xs font-medium">{d.desc}</p>
                    <p className="text-[10px] font-black mt-0.5" style={{ color: C.orange }}>{d.sus}</p>
                  </div>
                  <BrutalButton color={C.black} textColor="#fff" full={false} className="!px-3 !py-2 !text-xs"
                    onClick={() => dispatch({ type: 'DIRTY_ACTION', kind: d.kind })}>Fazer</BrutalButton>
                </div>
              </BrutalCard>
            ))}
          </div>
        </div>

        {/* save / restart info */}
        <BrutalCard color={C.creamDark} className="p-4" shadow={3}>
          <p className="text-black/70 text-xs font-bold mb-1">💾 Seu progresso é salvo automaticamente neste navegador.</p>
          <p className="text-black/40 text-[11px] font-medium mb-3">Pode fechar e voltar depois — o jogo continua de onde parou. Atualizar a página não apaga mais nada.</p>
          <div className="grid grid-cols-2 gap-3">
            <BrutalButton color={C.orange} textColor="#fff" onClick={() => {
              if (confirm('Começar um jogo NOVO? Isso apaga seu progresso atual.')) dispatch({ type: 'NEW_GAME' })
            }}>🔄 Novo jogo</BrutalButton>
            <BrutalButton color="white" textColor={C.black} onClick={() => {
              localStorage.removeItem('selected-game'); location.reload()
            }}>🎮 Trocar de jogo</BrutalButton>
          </div>
        </BrutalCard>
      </div>
    </div>
  )
}

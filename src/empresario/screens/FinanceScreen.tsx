import { useEmpresario } from '../store'
import { UPGRADE_OPTIONS } from '../data/events'
import { C, money, moneyFull, BrutalCard, BrutalButton, BrutalTag } from '../ui'

export default function FinanceScreen() {
  const { state, dispatch } = useEmpresario()

  function purchase(id: string, cost: number, effect: string) {
    if (state.money < cost || state.purchasedUpgrades.includes(id)) return
    dispatch({ type: 'PURCHASE_UPGRADE', upgradeId: id, cost, effect })
  }

  const totalClientValue = state.clients.reduce((s, c) => s + c.currentValue, 0)
  const monthlyExpenses = state.weeklyExpenses * 4
  const clubProgress = Math.min(100, (state.money / 500000) * 100)

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

        {/* upgrades */}
        <h2 className="font-black text-black text-lg pt-1" style={{ fontFamily: 'Oswald, sans-serif' }}>💼 INVESTIMENTOS</h2>
        <div className="space-y-3">
          {UPGRADE_OPTIONS.map(up => {
            const bought = state.purchasedUpgrades.includes(up.id)
            const canAfford = state.money >= up.cost
            return (
              <BrutalCard key={up.id} color={bought ? C.creamDark : 'white'} className="p-4" shadow={bought ? 2 : 4}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-black text-sm" style={{ fontFamily: 'Oswald, sans-serif' }}>
                      {bought && '✅ '}{up.name}
                    </p>
                    <p className="text-black/50 text-xs font-medium mt-0.5 leading-relaxed">{up.description}</p>
                    <div className="mt-2"><BrutalTag color={C.yellow}>⚡ {up.effect}</BrutalTag></div>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-black text-black text-sm mb-2" style={{ fontFamily: 'Oswald, sans-serif' }}>{money(up.cost)}</p>
                    {!bought && (
                      <BrutalButton color={canAfford ? C.green : '#C9C2AC'} disabled={!canAfford} full={false}
                        onClick={() => purchase(up.id, up.cost, up.effect)} className="!px-3 !py-2 !text-xs">
                        {canAfford ? 'Comprar' : 'Sem $'}
                      </BrutalButton>
                    )}
                  </div>
                </div>
              </BrutalCard>
            )
          })}
        </div>

        {/* buy a club */}
        <BrutalCard color={C.purple} className="p-5 text-center" shadow={6}>
          <p className="text-5xl mb-2">🏟️</p>
          <p className="text-white font-black text-lg" style={{ fontFamily: 'Oswald, sans-serif' }}>COMPRAR UM CLUBE</p>
          <p className="text-white/70 text-xs font-bold mt-1">Vire DONO de um time. Coloque seus clientes nele e lucre dos dois lados.</p>
          <div className="bg-white/20 border-2 border-black rounded-lg p-2 mt-3">
            <div className="h-4 bg-black/20 border-2 border-black rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all" style={{ width: `${clubProgress}%`, backgroundColor: C.yellow }} />
            </div>
            <p className="text-white text-xs font-black mt-1">{money(state.money)} / R$500k</p>
          </div>
          <p className="text-white/50 text-[10px] font-bold mt-2 uppercase tracking-widest">EM BREVE ✦</p>
        </BrutalCard>
      </div>
    </div>
  )
}

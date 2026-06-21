import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGame } from '../store/gameStore'
import { MARKET_ITEMS, CATEGORY_CONFIG, type MarketCategory, type MarketItem } from '../data/market'

const CATEGORIES: MarketCategory[] = ['equipamento', 'veiculo', 'experiencia', 'risco']

interface PurchaseResult {
  item: MarketItem
  won?: boolean
  effect: string
}

export default function MarketScreen() {
  const { state, dispatch } = useGame()
  const { coins, stolenTraits, purchasedItems, nextMatchMult } = state
  const [activeCategory, setActiveCategory] = useState<MarketCategory>('equipamento')
  const [result, setResult] = useState<PurchaseResult | null>(null)
  const [confirmItem, setConfirmItem] = useState<MarketItem | null>(null)

  const visibleItems = MARKET_ITEMS.filter(i => i.category === activeCategory)

  const isOwned = (item: MarketItem) => item.unique && purchasedItems.includes(item.id)
  const canAfford = (item: MarketItem) => coins >= item.price

  const handleBuy = (item: MarketItem) => {
    if (item.effect.gamble || item.effect.traitDrainRandom || item.effect.traitBoostRandom) {
      setConfirmItem(item)
    } else {
      executePurchase(item)
    }
  }

  const executePurchase = (item: MarketItem) => {
    const roll = Math.random()
    dispatch({ type: 'PURCHASE_ITEM', item, gambleRoll: roll })

    let effectText = ''
    if (item.effect.gamble) {
      const won = roll < item.effect.gamble.winChance
      if (won) {
        effectText = `Você ganhou! +C$ ${item.effect.gamble.win.coins}${item.effect.gamble.win.reputation ? ` e +${item.effect.gamble.win.reputation} rep` : ''}`
      } else {
        effectText = `Deu ruim. ${item.effect.gamble.lose.coins ? `−C$ ${Math.abs(item.effect.gamble.lose.coins)}` : ''}${item.effect.gamble.lose.traitDrain ? ` e 1 traço drenado` : ''}`
      }
      setResult({ item, won, effect: effectText })
    } else {
      const parts: string[] = []
      if (item.effect.coins && item.effect.coins > 0) parts.push(`+C$ ${item.effect.coins}`)
      if (item.effect.coins && item.effect.coins < 0) parts.push(`−C$ ${Math.abs(item.effect.coins)}`)
      if (item.effect.reputation && item.effect.reputation > 0) parts.push(`+${item.effect.reputation} rep`)
      if (item.effect.reputation && item.effect.reputation < 0) parts.push(`${item.effect.reputation} rep`)
      if (item.effect.traitBoostAll) parts.push(`+${item.effect.traitBoostAll}% em todos os traços`)
      if (item.effect.traitBoostRandom) parts.push(`+${item.effect.traitBoostRandom}% num traço`)
      if (item.effect.traitDrainRandom) parts.push(`−${item.effect.traitDrainRandom}% num traço`)
      if (item.effect.nextMatchMult) parts.push(`×${item.effect.nextMatchMult.toFixed(1)} na próxima partida`)
      effectText = parts.join(' · ')
      setResult({ item, effect: effectText })
    }

    setConfirmItem(null)
  }

  const bg = 'radial-gradient(ellipse at top, #0d0d1a 0%, #06060f 80%)'

  return (
    <div className="min-h-screen" style={{ background: bg }}>

      {/* Header */}
      <div className="sticky top-0 z-40 border-b" style={{ background: 'rgba(6,6,15,0.95)', borderColor: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(8px)' }}>
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <div className="text-xs tracking-widest opacity-40" style={{ color: '#f0e6c8', fontFamily: 'Oswald' }}>MERCADO NEGRO</div>
            <div className="text-lg font-black" style={{ color: '#D4A840', fontFamily: 'Oswald' }}>COMPRAS & APOSTAS</div>
          </div>
          <div className="flex items-center gap-4">
            {(nextMatchMult ?? 1) > 1 && (
              <motion.div animate={{ opacity: [1, 0.6, 1] }} transition={{ duration: 1.2, repeat: Infinity }}
                className="text-xs font-black px-2 py-1 border rounded-sm"
                style={{ color: '#22c55e', borderColor: 'rgba(34,197,94,0.3)', background: 'rgba(34,197,94,0.06)', fontFamily: 'Oswald' }}>
                ✨ ×{(nextMatchMult ?? 1).toFixed(1)} bônus ativo
              </motion.div>
            )}
            <div className="text-center">
              <div className="text-xs tracking-widest opacity-40" style={{ color: '#D4A840', fontFamily: 'Oswald' }}>C$</div>
              <div className="text-base font-black" style={{ color: '#D4A840', fontFamily: 'Oswald' }}>{coins.toLocaleString()}</div>
            </div>
            <button
              onClick={() => dispatch({ type: 'SET_SCREEN', screen: 'map' })}
              className="px-3 py-1.5 text-xs border transition-all hover:opacity-80"
              style={{ fontFamily: 'Oswald', color: 'rgba(240,230,200,0.5)', borderColor: 'rgba(255,255,255,0.1)' }}
            >
              ← MAPA
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">

        {/* Intro text */}
        <div className="mb-6 p-4 border rounded-sm" style={{ borderColor: 'rgba(212,168,64,0.15)', background: 'rgba(212,168,64,0.03)' }}>
          <p className="text-sm leading-relaxed" style={{ color: 'rgba(240,230,200,0.7)', fontFamily: 'Inter' }}>
            Tudo aqui tem um preço — e não é só o que está escrito. Cada compra te dá algo. Cada compra tira algo. É 1992 e você sabe de coisas que ninguém sabe. Use isso com cuidado.
          </p>
        </div>

        {/* Category tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {CATEGORIES.map(cat => {
            const cfg = CATEGORY_CONFIG[cat]
            const active = activeCategory === cat
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className="px-4 py-2 text-xs font-black tracking-widest border transition-all"
                style={{
                  fontFamily: 'Oswald',
                  color: active ? cfg.color : 'rgba(240,230,200,0.4)',
                  borderColor: active ? cfg.border : 'rgba(255,255,255,0.08)',
                  background: active ? cfg.bg : 'transparent',
                }}
              >
                {cfg.label}
              </button>
            )
          })}
        </div>

        {/* Items grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <AnimatePresence mode="popLayout">
            {visibleItems.map((item, i) => {
              const owned = isOwned(item)
              const affordable = canAfford(item)
              const cfg = CATEGORY_CONFIG[item.category]
              const noTraits = stolenTraits.length === 0 && (item.effect.traitBoostAll || item.effect.traitBoostRandom || item.effect.traitDrainRandom)

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: owned ? 0.5 : 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ delay: i * 0.04 }}
                  className="border rounded-sm overflow-hidden"
                  style={{ borderColor: owned ? 'rgba(255,255,255,0.05)' : cfg.border, background: owned ? 'rgba(255,255,255,0.02)' : cfg.bg }}
                >
                  {/* Top bar */}
                  <div className="h-0.5" style={{ background: owned ? 'transparent' : cfg.color, opacity: 0.5 }} />

                  <div className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{item.icon}</span>
                        <div>
                          <div className="text-sm font-black leading-tight" style={{ color: owned ? '#6b7280' : '#f0e6c8', fontFamily: 'Oswald' }}>
                            {item.name}
                          </div>
                          <div className="text-xs px-1.5 py-0.5 mt-0.5 w-fit"
                            style={{ background: cfg.bg, color: cfg.color, fontFamily: 'Oswald', fontSize: '10px', letterSpacing: '0.08em' }}>
                            {cfg.label}{item.unique ? ' · ÚNICO' : ''}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-black" style={{ color: affordable && !owned ? '#D4A840' : '#6b7280', fontFamily: 'Oswald' }}>
                          C$ {item.price.toLocaleString()}
                        </div>
                      </div>
                    </div>

                    {/* Benefit */}
                    <div className="mb-2 flex gap-2">
                      <span className="text-xs font-black w-6 flex-shrink-0" style={{ color: '#22c55e' }}>+</span>
                      <p className="text-xs leading-relaxed" style={{ color: 'rgba(240,230,200,0.75)', fontFamily: 'Inter' }}>
                        {item.benefit}
                      </p>
                    </div>

                    {/* Drawback */}
                    <div className="mb-4 flex gap-2">
                      <span className="text-xs font-black w-6 flex-shrink-0" style={{ color: '#E03535' }}>−</span>
                      <p className="text-xs leading-relaxed" style={{ color: 'rgba(240,230,200,0.55)', fontFamily: 'Inter' }}>
                        {item.drawback}
                      </p>
                    </div>

                    {/* Warnings */}
                    {!!noTraits && (
                      <div className="mb-3 text-xs" style={{ color: '#6b7280', fontFamily: 'Inter' }}>
                        ⚠️ Você não tem traços roubados ainda — efeito de traço não se aplicará.
                      </div>
                    )}

                    {/* Buy button */}
                    {owned ? (
                      <div className="w-full py-2.5 text-center text-xs font-black tracking-widest"
                        style={{ color: '#6b7280', fontFamily: 'Oswald', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        ✅ JÁ COMPRADO
                      </div>
                    ) : (
                      <motion.button
                        whileHover={affordable ? { scale: 1.02 } : {}}
                        whileTap={affordable ? { scale: 0.97 } : {}}
                        onClick={() => affordable && handleBuy(item)}
                        className="w-full py-2.5 text-xs font-black tracking-widest transition-all"
                        style={{
                          fontFamily: 'Oswald',
                          cursor: affordable ? 'pointer' : 'not-allowed',
                          color: affordable ? '#06060f' : '#4b5563',
                          background: affordable ? cfg.color : 'rgba(255,255,255,0.04)',
                          border: `1px solid ${affordable ? cfg.color : 'rgba(255,255,255,0.06)'}`,
                        }}
                      >
                        {affordable ? (item.effect.gamble ? '🎲 APOSTAR' : 'COMPRAR →') : `FALTAM C$ ${(item.price - coins).toLocaleString()}`}
                      </motion.button>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      </div>

      {/* Confirm modal */}
      <AnimatePresence>
        {confirmItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
            style={{ background: 'rgba(0,0,0,0.8)' }}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-sm border rounded-sm overflow-hidden"
              style={{ background: '#0d0d1a', borderColor: CATEGORY_CONFIG[confirmItem.category].border }}
            >
              <div className="p-5">
                <div className="text-3xl mb-3 text-center">{confirmItem.icon}</div>
                <div className="text-lg font-black text-center mb-1" style={{ color: '#f0e6c8', fontFamily: 'Oswald' }}>
                  {confirmItem.name}
                </div>
                <div className="text-xs text-center mb-4 opacity-50" style={{ color: '#f0e6c8', fontFamily: 'Inter' }}>
                  C$ {confirmItem.price.toLocaleString()} · {confirmItem.effect.gamble ? 'aposta — sem volta' : 'efeito aleatório nos traços'}
                </div>
                <div className="mb-4 p-3 border rounded-sm" style={{ borderColor: 'rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)' }}>
                  <div className="text-xs mb-1.5 flex gap-2">
                    <span style={{ color: '#22c55e' }}>+</span>
                    <span style={{ color: 'rgba(240,230,200,0.7)', fontFamily: 'Inter' }}>{confirmItem.benefit}</span>
                  </div>
                  <div className="text-xs flex gap-2">
                    <span style={{ color: '#E03535' }}>−</span>
                    <span style={{ color: 'rgba(240,230,200,0.5)', fontFamily: 'Inter' }}>{confirmItem.drawback}</span>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setConfirmItem(null)}
                    className="flex-1 py-3 text-xs font-black tracking-widest border transition-all hover:opacity-70"
                    style={{ fontFamily: 'Oswald', color: 'rgba(240,230,200,0.5)', borderColor: 'rgba(255,255,255,0.1)' }}
                  >
                    CANCELAR
                  </button>
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => executePurchase(confirmItem)}
                    className="flex-1 py-3 text-xs font-black tracking-widest"
                    style={{
                      fontFamily: 'Oswald',
                      background: CATEGORY_CONFIG[confirmItem.category].color,
                      color: confirmItem.category === 'risco' ? '#fff' : '#06060f',
                    }}
                  >
                    {confirmItem.effect.gamble ? 'APOSTAR →' : 'CONFIRMAR →'}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Result toast */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 px-6 py-4 border rounded-sm text-center"
            style={{
              background: '#0d0d1a',
              borderColor: result.won === false ? 'rgba(224,53,53,0.4)' : result.won === true ? 'rgba(34,197,94,0.4)' : 'rgba(212,168,64,0.3)',
              minWidth: 280,
              maxWidth: 340,
            }}
          >
            <div className="text-2xl mb-1">
              {result.won === false ? '💀' : result.won === true ? '🎉' : '✅'}
            </div>
            <div className="text-sm font-black mb-1" style={{ color: '#f0e6c8', fontFamily: 'Oswald' }}>
              {result.item.name}
            </div>
            <div className="text-xs" style={{ color: 'rgba(240,230,200,0.65)', fontFamily: 'Inter' }}>
              {result.effect}
            </div>
            <button
              onClick={() => setResult(null)}
              className="mt-3 text-xs opacity-40 hover:opacity-70 transition-opacity"
              style={{ color: '#f0e6c8', fontFamily: 'Inter' }}
            >
              fechar
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

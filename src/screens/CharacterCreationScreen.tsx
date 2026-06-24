import { useState } from 'react'
import { motion } from 'framer-motion'
import { useGame } from '../store/gameStore'
import type { Country, Position } from '../types/game'

const COUNTRIES: { value: Country; flag: string; city: string }[] = [
  { value: 'Brasil',     flag: '🇧🇷', city: 'São Paulo' },
  { value: 'Argentina',  flag: '🇦🇷', city: 'Buenos Aires' },
  { value: 'Portugal',   flag: '🇵🇹', city: 'Lisboa' },
  { value: 'França',     flag: '🇫🇷', city: 'Paris' },
  { value: 'Inglaterra', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', city: 'Londres' },
  { value: 'Itália',     flag: '🇮🇹', city: 'Roma' },
  { value: 'Espanha',    flag: '🇪🇸', city: 'Madrid' },
  { value: 'Alemanha',   flag: '🇩🇪', city: 'Berlim' },
  { value: 'Holanda',    flag: '🇳🇱', city: 'Amsterdam' },
]

const POSITIONS: { value: Position; icon: string; desc: string; color: string }[] = [
  { value: 'Atacante', icon: '⚡', desc: 'Gols e dribles',         color: '#f59e0b' },
  { value: 'Meia',     icon: '🧠', desc: 'Visão e criação',        color: '#60a5fa' },
  { value: 'Lateral',  icon: '🚀', desc: 'Velocidade e cruzamento',color: '#34d399' },
  { value: 'Zagueiro', icon: '🛡️', desc: 'Força e liderança',      color: '#a78bfa' },
  { value: 'Goleiro',  icon: '🧤', desc: 'Reflexo e domínio',      color: '#f87171' },
]

const JERSEYS = ['7', '10', '9', '11', '8', '1']
const SKIN_TONES = [
  'hsl(28, 50%, 30%)',
  'hsl(25, 55%, 38%)',
  'hsl(32, 45%, 48%)',
  'hsl(30, 40%, 55%)',
  'hsl(22, 50%, 25%)',
  'hsl(35, 35%, 60%)',
]

export default function CharacterCreationScreen() {
  const { dispatch } = useGame()
  const [name, setName] = useState('')
  const [country, setCountry] = useState<Country>('Brasil')
  const [city, setCity] = useState('São Paulo')
  const [faceIndex, setFaceIndex] = useState(0)
  const [position, setPosition] = useState<Position>('Atacante')
  const [step, setStep] = useState<'name' | 'identity' | 'position'>('name')

  const selectedCountry = COUNTRIES.find(c => c.value === country)!
  const selectedPosition = POSITIONS.find(p => p.value === position)!

  const handleCountryChange = (c: Country) => {
    setCountry(c)
    const found = COUNTRIES.find(x => x.value === c)
    if (found) setCity(found.city)
  }

  const handleConfirm = () => {
    if (!name.trim()) return
    dispatch({
      type: 'CREATE_PLAYER',
      player: { name: name.trim(), country, city, faceIndex, position }
    })
  }

  const canAdvanceName = name.trim().length > 0
  const bg = 'radial-gradient(ellipse at top, #0d0d1a 0%, #06060f 70%)'

  return (
    <div className="min-h-screen flex flex-col" style={{ background: bg }}>

      {/* Sticky header with live player card */}
      <div className="sticky top-0 z-10 border-b" style={{ background: 'rgba(6,6,15,0.97)', borderColor: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(12px)' }}>
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-4">
          {/* Mini player card */}
          <div className="relative flex-shrink-0 w-12 h-12 rounded-sm border flex items-center justify-center"
            style={{
              background: `linear-gradient(135deg, ${SKIN_TONES[faceIndex]}, hsl(${28 + faceIndex * 5}, 40%, ${25 + faceIndex * 4}%))`,
              borderColor: 'rgba(212,168,64,0.35)',
              boxShadow: '0 0 12px rgba(212,168,64,0.15)',
            }}>
            <span className="text-lg font-black" style={{ color: 'rgba(240,230,200,0.9)', fontFamily: 'Oswald' }}>
              {JERSEYS[faceIndex]}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-base font-black leading-tight" style={{ color: '#f0e6c8', fontFamily: 'Oswald' }}>
              {name.trim() || <span className="opacity-25">NOME DO JOGADOR</span>}
            </div>
            <div className="text-xs opacity-40" style={{ color: '#f0e6c8', fontFamily: 'Inter' }}>
              {selectedPosition.icon} {position} · {selectedCountry.flag} {country} · {city}
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="text-xs tracking-widest opacity-30" style={{ color: '#D4A840', fontFamily: 'Oswald' }}>1992</div>
            <div className="text-xs opacity-20" style={{ color: '#f0e6c8', fontFamily: 'Inter' }}>O Ladrão</div>
          </div>
        </div>

        {/* Step indicator */}
        <div className="max-w-2xl mx-auto px-4 pb-2 flex gap-2">
          {(['name', 'identity', 'position'] as const).map((s, i) => (
            <div key={s} className="flex-1 h-0.5 rounded-full transition-all duration-500"
              style={{
                background: s === step ? '#D4A840' : ['name', 'identity', 'position'].indexOf(step) > i ? 'rgba(212,168,64,0.4)' : 'rgba(255,255,255,0.08)',
              }} />
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-start px-4 py-8 max-w-2xl mx-auto w-full">

        {/* ── STEP 1: NAME ── */}
        {step === 'name' && (
          <motion.div
            key="step-name"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="w-full"
          >
            <div className="text-center mb-10">
              <div className="text-xs tracking-widest opacity-40 mb-2" style={{ color: '#D4A840', fontFamily: 'Oswald' }}>IDENTIDADE</div>
              <h2 className="text-4xl md:text-5xl font-black mb-3" style={{ fontFamily: 'Oswald', color: '#f0e6c8' }}>
                COMO TE CHAMAM?
              </h2>
              <p className="text-sm opacity-45" style={{ color: '#f0e6c8', fontFamily: 'Inter' }}>
                Você começa sem talento. Tudo que vai ser... você vai roubar.
              </p>
            </div>

            {/* Name input — hero */}
            <div className="relative mb-8">
              <div className="absolute inset-0 rounded-sm" style={{
                background: 'linear-gradient(135deg, rgba(212,168,64,0.05), transparent)',
                border: `1px solid ${name ? 'rgba(212,168,64,0.35)' : 'rgba(255,255,255,0.08)'}`,
              }} />
              <div className="relative p-6">
                <label className="block text-xs tracking-widest mb-4 opacity-60" style={{ color: '#D4A840', fontFamily: 'Oswald' }}>
                  NOME DO JOGADOR
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && canAdvanceName && setStep('identity')}
                  placeholder="Digite seu nome..."
                  maxLength={24}
                  autoFocus
                  className="w-full bg-transparent text-3xl md:text-4xl font-black outline-none border-b-2 pb-2 transition-all duration-300"
                  style={{
                    fontFamily: 'Oswald',
                    color: '#f0e6c8',
                    borderColor: name ? '#D4A840' : 'rgba(255,255,255,0.1)',
                    caretColor: '#D4A840',
                  }}
                />
                {name && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-3 text-xs opacity-40"
                    style={{ color: '#D4A840', fontFamily: 'Inter' }}
                  >
                    "{name.trim()}" — o que vai ser esse nome para o futebol?
                  </motion.div>
                )}
              </div>
            </div>

            <motion.button
              whileHover={canAdvanceName ? { scale: 1.02 } : {}}
              whileTap={canAdvanceName ? { scale: 0.97 } : {}}
              onClick={() => canAdvanceName && setStep('identity')}
              disabled={!canAdvanceName}
              className="w-full py-4 text-sm font-black tracking-[0.3em] transition-all duration-300"
              style={{
                fontFamily: 'Oswald',
                background: canAdvanceName ? 'linear-gradient(135deg, #D4A840, #b8902e)' : 'rgba(255,255,255,0.04)',
                color: canAdvanceName ? '#06060f' : 'rgba(255,255,255,0.15)',
                boxShadow: canAdvanceName ? '0 0 30px rgba(212,168,64,0.3)' : 'none',
              }}
            >
              {canAdvanceName ? `CONTINUAR COMO ${name.trim().toUpperCase()} →` : 'DIGITE SEU NOME'}
            </motion.button>
          </motion.div>
        )}

        {/* ── STEP 2: COUNTRY + FACE ── */}
        {step === 'identity' && (
          <motion.div
            key="step-identity"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="w-full"
          >
            <div className="text-center mb-8">
              <div className="text-xs tracking-widest opacity-40 mb-2" style={{ color: '#D4A840', fontFamily: 'Oswald' }}>ORIGEM</div>
              <h2 className="text-3xl md:text-4xl font-black mb-2" style={{ fontFamily: 'Oswald', color: '#f0e6c8' }}>
                DE ONDE VOCÊ VEM?
              </h2>
              <p className="text-xs opacity-40" style={{ color: '#f0e6c8', fontFamily: 'Inter' }}>
                Mesmo roubando o drible do Messi, você joga pelo seu país.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-5 mb-6">
              {/* Country selection */}
              <div>
                <div className="text-xs tracking-widest opacity-50 mb-3" style={{ color: '#D4A840', fontFamily: 'Oswald' }}>PAÍS</div>
                <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin' }}>
                  {COUNTRIES.map(c => (
                    <button
                      key={c.value}
                      onClick={() => handleCountryChange(c.value)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm transition-all"
                      style={{
                        background: country === c.value ? 'rgba(212,168,64,0.12)' : 'rgba(255,255,255,0.025)',
                        border: `1px solid ${country === c.value ? 'rgba(212,168,64,0.35)' : 'rgba(255,255,255,0.05)'}`,
                        color: country === c.value ? '#D4A840' : 'rgba(240,230,200,0.55)',
                        fontFamily: 'Oswald',
                        fontWeight: country === c.value ? 700 : 400,
                      }}
                    >
                      <span className="text-base">{c.flag}</span>
                      <span>{c.value}</span>
                      {country === c.value && <span className="ml-auto opacity-70">✓</span>}
                    </button>
                  ))}
                </div>
              </div>

              {/* Face + City */}
              <div className="space-y-5">
                <div>
                  <div className="text-xs tracking-widest opacity-50 mb-3" style={{ color: '#D4A840', fontFamily: 'Oswald' }}>APARÊNCIA</div>
                  <div className="grid grid-cols-3 gap-2">
                    {JERSEYS.map((num, i) => (
                      <button
                        key={i}
                        onClick={() => setFaceIndex(i)}
                        className="aspect-square flex flex-col items-center justify-center rounded-sm border transition-all"
                        style={{
                          background: faceIndex === i
                            ? `linear-gradient(135deg, ${SKIN_TONES[i]}, hsl(${28 + i * 5}, 40%, ${20 + i * 4}%))`
                            : 'rgba(255,255,255,0.03)',
                          borderColor: faceIndex === i ? '#D4A840' : 'rgba(255,255,255,0.06)',
                          boxShadow: faceIndex === i ? '0 0 16px rgba(212,168,64,0.25)' : 'none',
                        }}
                      >
                        <span
                          className="text-lg font-black"
                          style={{
                            fontFamily: 'Oswald',
                            color: faceIndex === i ? 'rgba(240,230,200,0.95)' : 'rgba(255,255,255,0.2)',
                          }}
                        >
                          {num}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="text-xs tracking-widest opacity-50 mb-2" style={{ color: '#D4A840', fontFamily: 'Oswald' }}>CIDADE</div>
                  <input
                    type="text"
                    value={city}
                    onChange={e => setCity(e.target.value)}
                    className="w-full bg-transparent text-sm font-medium outline-none border-b pb-1.5 transition-colors"
                    style={{
                      fontFamily: 'Inter',
                      color: '#f0e6c8',
                      borderColor: 'rgba(255,255,255,0.12)',
                      caretColor: '#D4A840',
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep('name')}
                className="px-5 py-3.5 text-sm font-bold tracking-wider border transition-all"
                style={{ fontFamily: 'Oswald', color: 'rgba(240,230,200,0.4)', borderColor: 'rgba(255,255,255,0.08)' }}
              >
                ← VOLTAR
              </button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setStep('position')}
                className="flex-1 py-3.5 text-sm font-black tracking-[0.3em] transition-all"
                style={{
                  fontFamily: 'Oswald',
                  background: 'linear-gradient(135deg, #D4A840, #b8902e)',
                  color: '#06060f',
                  boxShadow: '0 0 24px rgba(212,168,64,0.25)',
                }}
              >
                ESCOLHER POSIÇÃO →
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* ── STEP 3: POSITION ── */}
        {step === 'position' && (
          <motion.div
            key="step-position"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="w-full"
          >
            <div className="text-center mb-8">
              <div className="text-xs tracking-widest opacity-40 mb-2" style={{ color: '#D4A840', fontFamily: 'Oswald' }}>POSIÇÃO</div>
              <h2 className="text-3xl md:text-4xl font-black mb-2" style={{ fontFamily: 'Oswald', color: '#f0e6c8' }}>
                ONDE VOCÊ JOGA?
              </h2>
              <p className="text-xs opacity-40" style={{ color: '#f0e6c8', fontFamily: 'Inter' }}>
                Você pode roubar traços de qualquer posição. Mas sua base define o estilo.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 mb-8">
              {POSITIONS.map((p, i) => (
                <motion.button
                  key={p.value}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                  onClick={() => setPosition(p.value)}
                  className="flex items-center gap-4 p-4 border rounded-sm text-left transition-all"
                  style={{
                    background: position === p.value
                      ? `rgba(${hexToRgb(p.color)},0.08)`
                      : 'rgba(255,255,255,0.025)',
                    borderColor: position === p.value ? p.color : 'rgba(255,255,255,0.06)',
                    borderLeft: `3px solid ${position === p.value ? p.color : 'transparent'}`,
                    boxShadow: position === p.value ? `0 0 20px rgba(${hexToRgb(p.color)},0.12)` : 'none',
                  }}
                >
                  <span className="text-3xl flex-shrink-0">{p.icon}</span>
                  <div className="flex-1">
                    <div className="text-base font-black" style={{
                      color: position === p.value ? p.color : '#f0e6c8',
                      fontFamily: 'Oswald',
                    }}>
                      {p.value.toUpperCase()}
                    </div>
                    <div className="text-xs opacity-50" style={{ color: '#f0e6c8', fontFamily: 'Inter' }}>
                      {p.desc}
                    </div>
                  </div>
                  {position === p.value && (
                    <span className="text-sm font-black flex-shrink-0" style={{ color: p.color, fontFamily: 'Oswald' }}>✓</span>
                  )}
                </motion.button>
              ))}
            </div>

            {/* Final confirm */}
            <div className="border rounded-sm p-5 mb-4" style={{ borderColor: 'rgba(212,168,64,0.15)', background: 'rgba(212,168,64,0.03)' }}>
              <div className="text-xs tracking-widest opacity-40 mb-3" style={{ color: '#D4A840', fontFamily: 'Oswald' }}>RESUMO</div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-sm flex items-center justify-center font-black text-lg flex-shrink-0"
                  style={{
                    background: `linear-gradient(135deg, ${SKIN_TONES[faceIndex]}, hsl(${28 + faceIndex * 5}, 40%, ${20 + faceIndex * 4}%))`,
                    border: '1px solid rgba(212,168,64,0.3)',
                    color: 'rgba(240,230,200,0.9)',
                    fontFamily: 'Oswald',
                  }}>
                  {JERSEYS[faceIndex]}
                </div>
                <div>
                  <div className="text-xl font-black" style={{ color: '#f0e6c8', fontFamily: 'Oswald' }}>{name}</div>
                  <div className="text-xs opacity-50" style={{ color: '#f0e6c8', fontFamily: 'Inter' }}>
                    {selectedPosition.icon} {position} · {selectedCountry.flag} {country} · {city}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep('identity')}
                className="px-5 py-3.5 text-sm font-bold tracking-wider border transition-all"
                style={{ fontFamily: 'Oswald', color: 'rgba(240,230,200,0.4)', borderColor: 'rgba(255,255,255,0.08)' }}
              >
                ← VOLTAR
              </button>
              <motion.button
                whileHover={{ scale: 1.02, boxShadow: '0 0 40px rgba(212,168,64,0.4)' }}
                whileTap={{ scale: 0.97 }}
                onClick={handleConfirm}
                className="flex-1 py-3.5 text-sm font-black tracking-[0.2em] transition-all"
                style={{
                  fontFamily: 'Oswald',
                  background: 'linear-gradient(135deg, #D4A840, #b8902e)',
                  color: '#06060f',
                  boxShadow: '0 0 30px rgba(212,168,64,0.35)',
                }}
              >
                {selectedCountry.flag} ENTRAR EM 1992 →
              </motion.button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}

function hexToRgb(hex: string): string {
  if (hex.startsWith('#')) {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return `${r},${g},${b}`
  }
  // named color approximations
  const map: Record<string, string> = {
    '#f59e0b': '245,158,11',
    '#60a5fa': '96,165,250',
    '#34d399': '52,211,153',
    '#a78bfa': '167,139,250',
    '#f87171': '248,113,113',
  }
  return map[hex] ?? '212,168,64'
}

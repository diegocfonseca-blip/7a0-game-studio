import { useState } from 'react'
import { motion } from 'framer-motion'
import { useGame } from '../store/gameStore'
import type { Country, Position } from '../types/game'

const COUNTRIES: { value: Country; flag: string; city: string }[] = [
  { value: 'Brasil', flag: '🇧🇷', city: 'São Paulo' },
  { value: 'Argentina', flag: '🇦🇷', city: 'Buenos Aires' },
  { value: 'Portugal', flag: '🇵🇹', city: 'Lisboa' },
  { value: 'França', flag: '🇫🇷', city: 'Paris' },
  { value: 'Inglaterra', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', city: 'Londres' },
  { value: 'Itália', flag: '🇮🇹', city: 'Roma' },
  { value: 'Espanha', flag: '🇪🇸', city: 'Madrid' },
  { value: 'Alemanha', flag: '🇩🇪', city: 'Berlim' },
  { value: 'Holanda', flag: '🇳🇱', city: 'Amsterdam' },
]

const POSITIONS: { value: Position; icon: string; desc: string }[] = [
  { value: 'Atacante', icon: '⚡', desc: 'Gols e dribles' },
  { value: 'Meia', icon: '🧠', desc: 'Visão e criação' },
  { value: 'Lateral', icon: '🚀', desc: 'Velocidade e cruzamento' },
  { value: 'Zagueiro', icon: '🛡️', desc: 'Força e liderança' },
  { value: 'Goleiro', icon: '🧤', desc: 'Reflexo e domínio' },
]

const FACES = ['⬜', '⬜', '⬜', '⬜', '⬜', '⬜']

const FACE_FEATURES = [
  { brow: 'thick', jaw: 'square' },
  { brow: 'thin', jaw: 'round' },
  { brow: 'medium', jaw: 'sharp' },
  { brow: 'thick', jaw: 'round' },
  { brow: 'thin', jaw: 'square' },
  { brow: 'medium', jaw: 'oval' },
]

export default function CharacterCreationScreen() {
  const { dispatch } = useGame()
  const [name, setName] = useState('')
  const [country, setCountry] = useState<Country>('Brasil')
  const [city, setCity] = useState('São Paulo')
  const [faceIndex, setFaceIndex] = useState(0)
  const [position, setPosition] = useState<Position>('Atacante')

  const selectedCountry = COUNTRIES.find(c => c.value === country)!

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

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-10"
      style={{ background: 'radial-gradient(ellipse at top, #0d0d1a 0%, #06060f 70%)' }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-2xl"
      >
        {/* Header */}
        <div className="text-center mb-10">
          <p className="text-xs tracking-[0.4em] mb-2" style={{ color: '#D4A840', fontFamily: 'Oswald' }}>
            PASSO 1 DE 1
          </p>
          <h2 className="text-4xl md:text-5xl font-black" style={{ fontFamily: 'Oswald', color: '#f0e6c8' }}>
            CRIE SEU JOGADOR
          </h2>
          <p className="mt-2 text-sm opacity-50" style={{ color: '#f0e6c8', fontFamily: 'Inter' }}>
            Você começa sem talento. Tudo que vai ser... você vai roubar.
          </p>
        </div>

        <div className="space-y-6">
          {/* Name */}
          <div className="p-5 border border-white/10 rounded-sm" style={{ background: '#0d0d1a' }}>
            <label className="block text-xs tracking-widest mb-3" style={{ color: '#D4A840', fontFamily: 'Oswald' }}>
              NOME DO JOGADOR
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Digite seu nome..."
              maxLength={24}
              className="w-full bg-transparent text-xl font-bold outline-none border-b pb-2 transition-colors"
              style={{
                fontFamily: 'Oswald',
                color: '#f0e6c8',
                borderColor: name ? '#D4A840' : 'rgba(255,255,255,0.15)',
                caretColor: '#D4A840'
              }}
            />
          </div>

          {/* Country + City */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-5 border border-white/10 rounded-sm" style={{ background: '#0d0d1a' }}>
              <label className="block text-xs tracking-widest mb-3" style={{ color: '#D4A840', fontFamily: 'Oswald' }}>
                PAÍS
              </label>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {COUNTRIES.map(c => (
                  <button
                    key={c.value}
                    onClick={() => handleCountryChange(c.value)}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-sm text-sm transition-all"
                    style={{
                      fontFamily: 'Inter',
                      background: country === c.value ? 'rgba(212,168,64,0.15)' : 'transparent',
                      color: country === c.value ? '#D4A840' : 'rgba(240,230,200,0.6)',
                      border: country === c.value ? '1px solid rgba(212,168,64,0.3)' : '1px solid transparent',
                    }}
                  >
                    <span>{c.flag}</span>
                    <span>{c.value}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="p-5 border border-white/10 rounded-sm" style={{ background: '#0d0d1a' }}>
              <label className="block text-xs tracking-widest mb-3" style={{ color: '#D4A840', fontFamily: 'Oswald' }}>
                CIDADE NATAL
              </label>
              <input
                type="text"
                value={city}
                onChange={e => setCity(e.target.value)}
                className="w-full bg-transparent text-base font-medium outline-none border-b pb-2"
                style={{
                  fontFamily: 'Inter',
                  color: '#f0e6c8',
                  borderColor: 'rgba(255,255,255,0.15)',
                  caretColor: '#D4A840'
                }}
              />
              <p className="mt-4 text-xs opacity-40" style={{ color: '#f0e6c8', fontFamily: 'Inter' }}>
                País define sua seleção nacional.<br />
                Mesmo roubando traço do Messi,<br />
                você joga pela {country}.
              </p>
            </div>
          </div>

          {/* Face selection */}
          <div className="p-5 border border-white/10 rounded-sm" style={{ background: '#0d0d1a' }}>
            <label className="block text-xs tracking-widest mb-3" style={{ color: '#D4A840', fontFamily: 'Oswald' }}>
              ROSTO — TODOS CARECAS (cabelo você rouba depois)
            </label>
            <div className="grid grid-cols-6 gap-3">
              {FACES.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setFaceIndex(i)}
                  className="aspect-square flex flex-col items-center justify-center rounded-sm border transition-all"
                  style={{
                    background: faceIndex === i ? 'rgba(212,168,64,0.15)' : 'rgba(255,255,255,0.04)',
                    borderColor: faceIndex === i ? '#D4A840' : 'rgba(255,255,255,0.08)',
                    boxShadow: faceIndex === i ? '0 0 12px rgba(212,168,64,0.3)' : 'none',
                  }}
                >
                  <div
                    className="w-8 h-8 rounded-full mb-1 flex items-center justify-center text-xs font-bold"
                    style={{
                      background: `hsl(${30 + i * 15}, 40%, ${30 + i * 5}%)`,
                      color: '#f0e6c8',
                      fontFamily: 'Oswald'
                    }}
                  >
                    {i + 1}
                  </div>
                  <span className="text-xs opacity-40" style={{ color: '#f0e6c8', fontFamily: 'Inter' }}>
                    {FACE_FEATURES[i].jaw}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Position */}
          <div className="p-5 border border-white/10 rounded-sm" style={{ background: '#0d0d1a' }}>
            <label className="block text-xs tracking-widest mb-3" style={{ color: '#D4A840', fontFamily: 'Oswald' }}>
              POSIÇÃO NATURAL
            </label>
            <div className="grid grid-cols-5 gap-2">
              {POSITIONS.map(p => (
                <button
                  key={p.value}
                  onClick={() => setPosition(p.value)}
                  className="flex flex-col items-center gap-1 p-3 rounded-sm border transition-all"
                  style={{
                    background: position === p.value ? 'rgba(212,168,64,0.15)' : 'rgba(255,255,255,0.04)',
                    borderColor: position === p.value ? '#D4A840' : 'rgba(255,255,255,0.08)',
                  }}
                >
                  <span className="text-xl">{p.icon}</span>
                  <span className="text-xs font-bold" style={{ color: position === p.value ? '#D4A840' : '#f0e6c8', fontFamily: 'Oswald' }}>
                    {p.value.toUpperCase()}
                  </span>
                  <span className="text-xs opacity-40 text-center leading-tight" style={{ color: '#f0e6c8', fontFamily: 'Inter' }}>
                    {p.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Confirm */}
          <motion.button
            whileHover={name.trim() ? { scale: 1.02 } : {}}
            whileTap={name.trim() ? { scale: 0.98 } : {}}
            onClick={handleConfirm}
            disabled={!name.trim()}
            className="w-full py-4 text-sm font-bold tracking-[0.3em] transition-all duration-300"
            style={{
              fontFamily: 'Oswald',
              background: name.trim() ? '#D4A840' : 'rgba(255,255,255,0.05)',
              color: name.trim() ? '#06060f' : 'rgba(255,255,255,0.2)',
              boxShadow: name.trim() ? '0 0 30px rgba(212,168,64,0.3)' : 'none',
            }}
          >
            {selectedCountry.flag} INICIAR COMO {name.trim().toUpperCase() || '???'} · {country.toUpperCase()} · {position.toUpperCase()}
          </motion.button>
        </div>
      </motion.div>
    </div>
  )
}

import { useState } from 'react'
import { motion } from 'framer-motion'
import { THEMES, themeById } from './themes'
import { TIME_CONTROLS, type GameConfig, type ColorPref } from './types'
import { AVATARS, type UserSettings } from './settings'
import { DIFFICULTY_META, type Difficulty } from './cpu'

// Chess Legends visual identity (home & menus): deep charcoal + gold
const UI = {
  bg: 'linear-gradient(165deg, #14181E 0%, #0B0D11 60%, #101014 100%)',
  gold: '#E8C766',
  goldDim: '#B8963E',
  text: '#F2EEE3',
  subtext: 'rgba(242,238,227,0.55)',
  panel: 'rgba(255,255,255,0.045)',
  border: 'rgba(232,199,102,0.22)',
  borderSoft: 'rgba(255,255,255,0.1)',
}

export function Shell({ children, onBack, title }: { children: React.ReactNode; onBack?: () => void; title?: string }) {
  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-6" style={{ background: UI.bg }}>
      {(onBack || title) && (
        <div className="w-full max-w-md flex items-center gap-3 mb-5">
          {onBack && (
            <button onClick={onBack}
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-lg transition-all hover:brightness-125"
                    style={{ backgroundColor: UI.panel, border: `1px solid ${UI.borderSoft}`, color: UI.text }}>
              ←
            </button>
          )}
          {title && (
            <h2 className="font-black text-xl tracking-wide" style={{ color: UI.gold, fontFamily: 'Oswald, sans-serif' }}>
              {title}
            </h2>
          )}
        </div>
      )}
      {children}
    </div>
  )
}

function BigButton({ onClick, children, primary = false }: { onClick: () => void; children: React.ReactNode; primary?: boolean }) {
  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.97 }}
      whileHover={{ y: -1 }}
      className="w-full py-3.5 rounded-xl font-black text-base tracking-wide transition-all"
      style={primary
        ? { background: `linear-gradient(135deg, ${UI.gold} 0%, ${UI.goldDim} 100%)`, color: '#141210', boxShadow: '0 6px 20px -6px rgba(232,199,102,0.5)' }
        : { backgroundColor: UI.panel, color: UI.text, border: `1px solid ${UI.border}` }}
    >
      {children}
    </motion.button>
  )
}

// ── Decorative mini board for the home hero ──────────────────────────────
function HeroBoard() {
  const cells = Array.from({ length: 64 }, (_, i) => {
    const x = i % 8, y = Math.floor(i / 8)
    return (x + y) % 2 === 0
  })
  const pieces: Record<number, string> = { 3: '♛', 12: '♞', 25: '♝', 38: '♚', 44: '♟', 52: '♜' }
  return (
    <div className="relative mx-auto" style={{ width: 200, height: 200, perspective: 500 }}>
      <div className="grid grid-cols-8 w-full h-full rounded-lg overflow-hidden"
           style={{
             transform: 'rotateX(38deg) rotateZ(-6deg)',
             boxShadow: '0 30px 40px -16px rgba(0,0,0,0.8), 0 0 0 4px rgba(232,199,102,0.25)',
           }}>
        {cells.map((light, i) => (
          <div key={i} className="flex items-center justify-center text-lg"
               style={{
                 backgroundColor: light ? '#E9DCC0' : '#3A3F4A',
                 color: light ? '#22262E' : '#E8C766',
               }}>
            {pieces[i] ?? ''}
          </div>
        ))}
      </div>
      <div className="absolute -inset-4 rounded-full pointer-events-none"
           style={{ background: 'radial-gradient(circle, rgba(232,199,102,0.12) 0%, transparent 70%)' }} />
    </div>
  )
}

// ── HOME ─────────────────────────────────────────────────────────────────
export function HomeScreen({ onNav }: { onNav: (s: 'setup-online' | 'join' | 'setup-local' | 'setup-cpu' | 'historia' | 'exhibition' | 'career' | 'legends' | 'settings' | 'howto') => void }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5 py-10 gap-8" style={{ background: UI.bg }}>
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="text-center">
        <p className="text-[11px] font-black tracking-[0.5em] mb-3" style={{ color: UI.subtext }}>D GAME STUDIO</p>
        <HeroBoard />
        <h1 className="font-black text-5xl mt-7 leading-none tracking-wide"
            style={{
              fontFamily: 'Oswald, sans-serif',
              background: `linear-gradient(135deg, #F5E4A8 0%, ${UI.gold} 45%, ${UI.goldDim} 100%)`,
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
          CHESS LEGENDS
        </h1>
        <p className="text-sm mt-2 font-medium" style={{ color: UI.subtext }}>
          Xadrez de verdade. Contra quem você conhece.
        </p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                  className="w-full max-w-xs space-y-2.5">
        <BigButton primary onClick={() => onNav('setup-online')}>⚔️ Jogar online com amigo</BigButton>
        <div className="flex gap-2.5">
          <div className="flex-1"><BigButton onClick={() => onNav('join')}>🔑 Entrar com código</BigButton></div>
          <div className="flex-1"><BigButton onClick={() => onNav('setup-local')}>🤝 Jogar local</BigButton></div>
        </div>
        <p className="text-[10px] font-black tracking-[0.35em] text-center pt-2" style={{ color: UI.subtext }}>— SOZINHO —</p>
        <BigButton onClick={() => onNav('career')}>🏆 Modo Carreira <span className="text-xs font-bold opacity-70">800 → Grande Mestre</span></BigButton>
        <BigButton onClick={() => onNav('legends')}>♟️ Desafiar uma Lenda <span className="text-xs font-bold opacity-70">Magnus, Fischer, Tal…</span></BigButton>
        <div className="flex gap-2.5">
          <div className="flex-1"><BigButton onClick={() => onNav('setup-cpu')}>🤖 vs Computador</BigButton></div>
          <div className="flex-1"><BigButton onClick={() => onNav('historia')}>👑 Modo História</BigButton></div>
        </div>
        <BigButton onClick={() => onNav('exhibition')}>🎬 Mestres em ação (IA × IA)</BigButton>
        <div className="flex gap-2.5">
          <div className="flex-1"><BigButton onClick={() => onNav('settings')}>⚙️ Configurações</BigButton></div>
          <div className="flex-1"><BigButton onClick={() => onNav('howto')}>📖 Como jogar</BigButton></div>
        </div>
      </motion.div>
    </div>
  )
}

// ── SETUP (shared: local & online) ───────────────────────────────────────
export function SetupScreen({ mode, defaultThemeId, onBack, onConfirm }: {
  mode: 'local' | 'online' | 'cpu'
  defaultThemeId: string
  onBack: () => void
  onConfirm: (config: GameConfig, name: string, difficulty: Difficulty) => void
}) {
  const [timeId, setTimeId] = useState('10+0')
  const [customMin, setCustomMin] = useState(10)
  const [customInc, setCustomInc] = useState(5)
  const [colorPref, setColorPref] = useState<ColorPref>('random')
  const [themeId, setThemeId] = useState(defaultThemeId)
  const [name, setName] = useState('')
  const [difficulty, setDifficulty] = useState<Difficulty>('medio')

  const confirm = () => onConfirm(
    { timeId, customInitialMin: customMin, customIncrementSec: customInc, colorPref, themeId },
    name.trim(),
    difficulty,
  )

  return (
    <Shell onBack={onBack} title={mode === 'online' ? 'CRIAR SALA' : mode === 'cpu' ? 'CONTRA O COMPUTADOR' : 'PARTIDA LOCAL'}>
      <div className="w-full max-w-md space-y-4 pb-6">

        {mode === 'online' && (
          <div className="rounded-xl p-4" style={{ backgroundColor: UI.panel, border: `1px solid ${UI.borderSoft}` }}>
            <p className="text-[10px] font-black tracking-widest mb-2" style={{ color: UI.subtext }}>SEU NOME</p>
            <input value={name} onChange={e => setName(e.target.value)} maxLength={20}
                   placeholder="Como seu amigo te conhece?"
                   className="w-full rounded-lg px-3 py-2.5 text-sm font-bold outline-none"
                   style={{ backgroundColor: 'rgba(0,0,0,0.35)', border: `1px solid ${UI.borderSoft}`, color: UI.text }} />
          </div>
        )}

        {/* Time */}
        <div className="rounded-xl p-4" style={{ backgroundColor: UI.panel, border: `1px solid ${UI.borderSoft}` }}>
          <p className="text-[10px] font-black tracking-widest mb-2.5" style={{ color: UI.subtext }}>⏱ TEMPO DA PARTIDA</p>
          <div className="grid grid-cols-4 gap-1.5">
            {TIME_CONTROLS.map(tc => (
              <button key={tc.id} onClick={() => setTimeId(tc.id)}
                      className="py-2 rounded-lg text-xs font-bold transition-all"
                      style={{
                        backgroundColor: timeId === tc.id ? UI.gold : 'rgba(0,0,0,0.3)',
                        color: timeId === tc.id ? '#141210' : UI.text,
                        border: `1px solid ${timeId === tc.id ? UI.gold : UI.borderSoft}`,
                      }}>
                {tc.label}
              </button>
            ))}
            <button onClick={() => setTimeId('custom')}
                    className="py-2 rounded-lg text-xs font-bold transition-all"
                    style={{
                      backgroundColor: timeId === 'custom' ? UI.gold : 'rgba(0,0,0,0.3)',
                      color: timeId === 'custom' ? '#141210' : UI.text,
                      border: `1px solid ${timeId === 'custom' ? UI.gold : UI.borderSoft}`,
                    }}>
              Perso…
            </button>
          </div>
          {timeId === 'custom' && (
            <div className="flex gap-3 mt-3">
              <label className="flex-1 text-xs font-bold" style={{ color: UI.subtext }}>
                Minutos iniciais
                <input type="number" min={1} max={180} value={customMin}
                       onChange={e => setCustomMin(Number(e.target.value))}
                       className="w-full mt-1 rounded-lg px-2.5 py-2 text-sm font-bold outline-none"
                       style={{ backgroundColor: 'rgba(0,0,0,0.35)', border: `1px solid ${UI.borderSoft}`, color: UI.text }} />
              </label>
              <label className="flex-1 text-xs font-bold" style={{ color: UI.subtext }}>
                Incremento (seg/lance)
                <input type="number" min={0} max={60} value={customInc}
                       onChange={e => setCustomInc(Number(e.target.value))}
                       className="w-full mt-1 rounded-lg px-2.5 py-2 text-sm font-bold outline-none"
                       style={{ backgroundColor: 'rgba(0,0,0,0.35)', border: `1px solid ${UI.borderSoft}`, color: UI.text }} />
              </label>
            </div>
          )}
        </div>

        {/* Difficulty (cpu only) */}
        {mode === 'cpu' && (
          <div className="rounded-xl p-4" style={{ backgroundColor: UI.panel, border: `1px solid ${UI.borderSoft}` }}>
            <p className="text-[10px] font-black tracking-widest mb-2.5" style={{ color: UI.subtext }}>🤖 NÍVEL DO COMPUTADOR</p>
            <div className="grid grid-cols-3 gap-1.5">
              {(Object.keys(DIFFICULTY_META) as Difficulty[]).map(d => (
                <button key={d} onClick={() => setDifficulty(d)}
                        className="py-2.5 rounded-lg text-xs font-bold transition-all"
                        style={{
                          backgroundColor: difficulty === d ? UI.gold : 'rgba(0,0,0,0.3)',
                          color: difficulty === d ? '#141210' : UI.text,
                          border: `1px solid ${difficulty === d ? UI.gold : UI.borderSoft}`,
                        }}>
                  {DIFFICULTY_META[d].emoji} {DIFFICULTY_META[d].label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Color (online & cpu) */}
        {(mode === 'online' || mode === 'cpu') && (
          <div className="rounded-xl p-4" style={{ backgroundColor: UI.panel, border: `1px solid ${UI.borderSoft}` }}>
            <p className="text-[10px] font-black tracking-widest mb-2.5" style={{ color: UI.subtext }}>♟ SUA COR</p>
            <div className="grid grid-cols-3 gap-1.5">
              {([['w', '⚪ Brancas'], ['random', '🎲 Aleatório'], ['b', '⚫ Pretas']] as Array<[ColorPref, string]>).map(([v, label]) => (
                <button key={v} onClick={() => setColorPref(v)}
                        className="py-2.5 rounded-lg text-xs font-bold transition-all"
                        style={{
                          backgroundColor: colorPref === v ? UI.gold : 'rgba(0,0,0,0.3)',
                          color: colorPref === v ? '#141210' : UI.text,
                          border: `1px solid ${colorPref === v ? UI.gold : UI.borderSoft}`,
                        }}>
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Theme */}
        <div className="rounded-xl p-4" style={{ backgroundColor: UI.panel, border: `1px solid ${UI.borderSoft}` }}>
          <p className="text-[10px] font-black tracking-widest mb-1" style={{ color: UI.subtext }}>
            🎨 VISUAL DO TABULEIRO {mode === 'online' ? '(PADRÃO DA SALA)' : ''}
          </p>
          {mode === 'online' && (
            <p className="text-[10px] mb-2.5" style={{ color: UI.subtext }}>
              Seu amigo pode trocar só na tela dele depois.
            </p>
          )}
          <div className="grid grid-cols-2 gap-2 mt-2">
            {THEMES.map(t => (
              <button key={t.id} onClick={() => setThemeId(t.id)}
                      className="rounded-xl p-2 text-left transition-transform hover:scale-[1.02]"
                      style={{
                        backgroundColor: 'rgba(0,0,0,0.25)',
                        border: `2px solid ${themeId === t.id ? UI.gold : UI.borderSoft}`,
                      }}>
                <div className="flex rounded overflow-hidden mb-1.5" style={{ height: 20 }}>
                  {[0, 1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="flex-1" style={{ backgroundColor: i % 2 === 0 ? t.light : t.dark }} />
                  ))}
                </div>
                <p className="text-xs font-bold" style={{ color: UI.text }}>{t.emoji} {t.nome}</p>
              </button>
            ))}
          </div>
        </div>

        <BigButton primary onClick={confirm}>
          {mode === 'online' ? '🏰 CRIAR SALA' : mode === 'cpu' ? '🤖 DESAFIAR O COMPUTADOR' : '▶️ COMEÇAR PARTIDA'}
        </BigButton>
      </div>
    </Shell>
  )
}

// ── JOIN ─────────────────────────────────────────────────────────────────
export function JoinScreen({ initialCode, onBack, onJoin }: {
  initialCode: string
  onBack: () => void
  onJoin: (code: string, name: string) => void
}) {
  const [code, setCode] = useState(initialCode)
  const [name, setName] = useState('')

  return (
    <Shell onBack={onBack} title="ENTRAR NA SALA">
      <div className="w-full max-w-sm space-y-4">
        <div className="rounded-xl p-4" style={{ backgroundColor: UI.panel, border: `1px solid ${UI.borderSoft}` }}>
          <p className="text-[10px] font-black tracking-widest mb-2" style={{ color: UI.subtext }}>CÓDIGO DA SALA</p>
          <input value={code}
                 onChange={e => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4))}
                 placeholder="A7K9"
                 autoFocus={!initialCode}
                 className="w-full rounded-lg px-3 py-3 text-2xl font-black tracking-[0.5em] text-center outline-none uppercase"
                 style={{ backgroundColor: 'rgba(0,0,0,0.35)', border: `1px solid ${UI.border}`, color: UI.gold }} />
        </div>
        <div className="rounded-xl p-4" style={{ backgroundColor: UI.panel, border: `1px solid ${UI.borderSoft}` }}>
          <p className="text-[10px] font-black tracking-widest mb-2" style={{ color: UI.subtext }}>SEU NOME</p>
          <input value={name} onChange={e => setName(e.target.value)} maxLength={20}
                 placeholder="Como seu amigo te conhece?"
                 className="w-full rounded-lg px-3 py-2.5 text-sm font-bold outline-none"
                 style={{ backgroundColor: 'rgba(0,0,0,0.35)', border: `1px solid ${UI.borderSoft}`, color: UI.text }} />
        </div>
        <BigButton primary onClick={() => code.length === 4 && onJoin(code, name.trim())}>
          ⚔️ ENTRAR NA PARTIDA
        </BigButton>
      </div>
    </Shell>
  )
}

// ── LOBBY (host waiting for opponent) ────────────────────────────────────
export function LobbyScreen({ code, hostName, timeText, themeName, onCancel }: {
  code: string
  hostName: string
  timeText: string
  themeName: string
  onCancel: () => void
}) {
  const [copied, setCopied] = useState<'code' | 'link' | null>(null)
  const link = `${window.location.origin}${import.meta.env.BASE_URL}?sala=${code}`
  const copy = (what: 'code' | 'link') => {
    navigator.clipboard.writeText(what === 'code' ? code : link).then(() => {
      setCopied(what)
      setTimeout(() => setCopied(null), 1600)
    })
  }
  const waText = `Te desafio pro xadrez no Chess Legends! ♟️🔥\nCódigo da sala: ${code}\nEntra aqui: ${link}`
  const waUrl = `https://wa.me/?text=${encodeURIComponent(waText)}`

  return (
    <Shell title="SALA CRIADA">
      <div className="w-full max-w-sm space-y-4 text-center">
        <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }}
                    className="rounded-2xl p-6" style={{ backgroundColor: UI.panel, border: `2px solid ${UI.border}` }}>
          <p className="text-[10px] font-black tracking-widest mb-2" style={{ color: UI.subtext }}>CÓDIGO DA SALA</p>
          <p className="font-black text-5xl tracking-[0.35em] pl-3" style={{ color: UI.gold, fontFamily: 'Oswald, sans-serif' }}>
            {code}
          </p>
          <div className="flex items-center justify-center gap-2 mt-4 text-xs font-bold" style={{ color: UI.subtext }}>
            <span>👤 {hostName}</span> · <span>⏱ {timeText}</span> · <span>🎨 {themeName}</span>
          </div>
          <div className="flex items-center justify-center gap-1.5 mt-3">
            <motion.span animate={{ opacity: [1, 0.3, 1] }} transition={{ repeat: Infinity, duration: 1.6 }}
                         className="w-2 h-2 rounded-full" style={{ backgroundColor: UI.gold }} />
            <p className="text-xs font-bold" style={{ color: UI.text }}>Esperando seu amigo entrar…</p>
          </div>
        </motion.div>

        <div className="grid grid-cols-2 gap-2">
          <BigButton onClick={() => copy('code')}>{copied === 'code' ? '✓ Copiado!' : '⧉ Copiar código'}</BigButton>
          <BigButton onClick={() => copy('link')}>{copied === 'link' ? '✓ Copiado!' : '🔗 Copiar link'}</BigButton>
        </div>
        <a href={waUrl} target="_blank" rel="noopener noreferrer" className="block">
          <BigButton primary onClick={() => {}}>💬 Compartilhar no WhatsApp</BigButton>
        </a>
        <button onClick={onCancel} className="text-xs font-bold underline" style={{ color: UI.subtext }}>
          Cancelar e voltar
        </button>
      </div>
    </Shell>
  )
}

// ── SETTINGS ─────────────────────────────────────────────────────────────
export function SettingsScreen({ settings, onUpdate, onBack }: {
  settings: UserSettings
  onUpdate: (p: Partial<UserSettings>) => void
  onBack: () => void
}) {
  const Toggle = ({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) => (
    <button onClick={() => onChange(!value)}
            className="w-full flex items-center justify-between rounded-xl px-4 py-3"
            style={{ backgroundColor: UI.panel, border: `1px solid ${UI.borderSoft}` }}>
      <span className="text-sm font-bold" style={{ color: UI.text }}>{label}</span>
      <span className="w-11 h-6 rounded-full relative transition-colors"
            style={{ backgroundColor: value ? UI.gold : 'rgba(255,255,255,0.15)' }}>
        <span className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all"
              style={{ left: value ? 22 : 2 }} />
      </span>
    </button>
  )

  return (
    <Shell onBack={onBack} title="CONFIGURAÇÕES">
      <div className="w-full max-w-sm space-y-3 pb-6">
        <div className="rounded-xl p-4" style={{ backgroundColor: UI.panel, border: `1px solid ${UI.borderSoft}` }}>
          <p className="text-[10px] font-black tracking-widest mb-2" style={{ color: UI.subtext }}>SEU NOME</p>
          <input value={settings.name} onChange={e => onUpdate({ name: e.target.value.slice(0, 20) })}
                 placeholder="Seu nome nas partidas"
                 className="w-full rounded-lg px-3 py-2.5 text-sm font-bold outline-none"
                 style={{ backgroundColor: 'rgba(0,0,0,0.35)', border: `1px solid ${UI.borderSoft}`, color: UI.text }} />
        </div>

        <div className="rounded-xl p-4" style={{ backgroundColor: UI.panel, border: `1px solid ${UI.borderSoft}` }}>
          <p className="text-[10px] font-black tracking-widest mb-2" style={{ color: UI.subtext }}>AVATAR</p>
          <div className="grid grid-cols-6 gap-1.5">
            {AVATARS.map(a => (
              <button key={a} onClick={() => onUpdate({ avatar: a })}
                      className="aspect-square rounded-lg text-xl flex items-center justify-center transition-all"
                      style={{
                        backgroundColor: settings.avatar === a ? `${UI.gold}33` : 'rgba(0,0,0,0.25)',
                        border: `2px solid ${settings.avatar === a ? UI.gold : 'transparent'}`,
                      }}>
                {a}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-xl p-4" style={{ backgroundColor: UI.panel, border: `1px solid ${UI.borderSoft}` }}>
          <p className="text-[10px] font-black tracking-widest mb-2" style={{ color: UI.subtext }}>TEMA PREFERIDO</p>
          <div className="grid grid-cols-2 gap-2">
            {THEMES.map(t => (
              <button key={t.id} onClick={() => onUpdate({ themeId: t.id })}
                      className="rounded-xl p-2 text-left"
                      style={{
                        backgroundColor: 'rgba(0,0,0,0.25)',
                        border: `2px solid ${settings.themeId === t.id ? UI.gold : UI.borderSoft}`,
                      }}>
                <div className="flex rounded overflow-hidden mb-1" style={{ height: 16 }}>
                  {[0, 1, 2, 3].map(i => (
                    <div key={i} className="flex-1" style={{ backgroundColor: i % 2 === 0 ? t.light : t.dark }} />
                  ))}
                </div>
                <p className="text-[11px] font-bold" style={{ color: UI.text }}>{t.emoji} {t.nome}</p>
              </button>
            ))}
          </div>
        </div>

        <Toggle label={`Visual: ${settings.view === '3d' ? '🎲 3D' : '▦ 2D'}`}
                value={settings.view === '3d'} onChange={v => onUpdate({ view: v ? '3d' : '2d' })} />
        <Toggle label="🔊 Sons" value={settings.sound} onChange={v => onUpdate({ sound: v })} />
        <Toggle label="💡 Mostrar casas possíveis" value={settings.showHints} onChange={v => onUpdate({ showHints: v })} />
        <Toggle label="✨ Animações" value={settings.animations} onChange={v => onUpdate({ animations: v })} />
      </div>
    </Shell>
  )
}

// ── HOW TO PLAY ──────────────────────────────────────────────────────────
export function HowToScreen({ onBack }: { onBack: () => void }) {
  const S = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="rounded-xl p-4" style={{ backgroundColor: UI.panel, border: `1px solid ${UI.borderSoft}` }}>
      <p className="font-black text-sm mb-1.5" style={{ color: UI.gold }}>{title}</p>
      <div className="text-xs leading-relaxed space-y-1" style={{ color: UI.text }}>{children}</div>
    </div>
  )
  return (
    <Shell onBack={onBack} title="COMO JOGAR">
      <div className="w-full max-w-sm space-y-3 pb-6">
        <S title="♟ O básico">
          <p>Xadrez com 100% das regras oficiais: roque, en passant, promoção de peão, xeque, xeque-mate, afogamento e empates por material, repetição e regra dos 50 lances.</p>
          <p>Toque numa peça para ver as casas possíveis. Toque no destino para mover.</p>
        </S>
        <S title="⚔️ Online com amigo">
          <p>1. Toque em <b>Jogar online com amigo</b> e escolha tempo, cor e tema.</p>
          <p>2. Mande o <b>código</b> ou o <b>link</b> pro seu amigo (dá pra enviar direto no WhatsApp).</p>
          <p>3. Quando ele entrar, a partida começa na hora — com relógio, chat e revanche.</p>
        </S>
        <S title="⏱ Relógio">
          <p>Modos de 1 a 30 minutos, com ou sem incremento — ou personalizado. "10+5" = 10 minutos + 5 segundos por lance. O relógio só começa a correr após o primeiro lance.</p>
        </S>
        <S title="🎨 Temas e 3D">
          <p>8 visuais, incluindo <b>Rubro-Negro</b> 🔴 e <b>Almirante</b> ⚓. Cada jogador escolhe o seu — trocar o tema ou o modo 2D/3D só muda a SUA tela.</p>
        </S>
        <S title="🤝 Fim de jogo">
          <p>Dá pra se render, propor empate e pedir revanche (trocando as cores ou não). Depois da partida, a <b>análise inteligente</b> mostra o gráfico de vantagem, os momentos críticos ⚡ e os 3 melhores lances em cada erro — com explicação.</p>
        </S>
        <S title="🏆 Carreira">
          <p>Crie seu jogador com <b>800 de rating</b> e suba no Elo de verdade: cada vitória ranqueada aproxima você dos títulos — até <b>Grande Mestre (2500)</b>. Acima de 2100, prepare-se: os mestres com personalidade entram no seu caminho.</p>
        </S>
        <S title="👑 Modo História & IA com personalidade">
          <p>Reviva 6 partidas lendárias lance a lance — ou assuma o tabuleiro e tente mudar o resultado. E enfrente IAs com estilo real: <b>Tal</b> sacrifica, <b>Capablanca</b> simplifica, <b>Kasparov</b> ataca, <b>Carlsen</b> aperta, <b>Fischer</b> não erra.</p>
        </S>
      </div>
    </Shell>
  )
}

// ── ERROR ────────────────────────────────────────────────────────────────
export function ErrorScreen({ message, onBack }: { message: string; onBack: () => void }) {
  return (
    <Shell title="OPS…">
      <div className="w-full max-w-sm text-center space-y-4">
        <span className="text-5xl">😕</span>
        <p className="text-sm font-bold" style={{ color: UI.text }}>{message}</p>
        <BigButton primary onClick={onBack}>← Voltar</BigButton>
      </div>
    </Shell>
  )
}

// ── CONNECTING ───────────────────────────────────────────────────────────
export function ConnectingScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: UI.bg }}>
      <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.4, ease: 'linear' }}
                   className="text-4xl">♞</motion.span>
      <p className="text-sm font-bold" style={{ color: UI.subtext }}>Conectando à sala…</p>
    </div>
  )
}

export { themeById }

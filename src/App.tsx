import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import EmpresarioGame from './empresario'
import DraftGame from './draft'
import HistoriadorGame from './historiadores'
import SuperTrunfoGame from './supertrunfo'
import ChessLegends from './chess'
import EscalacaoGame from './escalacao'

type GameKey = 'chess' | 'empresario' | 'draft' | 'historiadores' | 'supertrunfo' | 'escalacao'

function GameSelector({ onSelect }: { onSelect: (game: GameKey) => void }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-5 gap-7" style={{ backgroundColor: '#F4ECD6' }}>
      <div className="text-center">
        <span className="inline-block border-2 border-black rounded-full px-3 py-1 text-xs font-black uppercase tracking-wide"
              style={{ backgroundColor: '#FFC400', boxShadow: '3px 3px 0 0 #0C0C0C' }}>
          D GAME STUDIO
        </span>
        <h1 className="font-black text-4xl text-black mt-4" style={{ fontFamily: 'Oswald, sans-serif' }}>ESCOLHA SEU JOGO</h1>
      </div>

      <div className="w-full max-w-sm space-y-4">
        <motion.button
          onClick={() => onSelect('escalacao')}
          whileTap={{ x: 3, y: 3 }}
          className="w-full text-left border-[3px] border-black rounded-2xl p-6 transition-all"
          style={{ backgroundColor: '#1B7A3D', boxShadow: '6px 6px 0 0 #0C0C0C' }}
        >
          <div className="text-4xl mb-3">🔨</div>
          <p className="text-white font-black text-2xl" style={{ fontFamily: 'Oswald, sans-serif' }}>A ESCALAÇÃO</p>
          <p className="text-white/80 text-sm mt-1 font-medium">
            Leilão cego por setor: lance secreto, níveis ocultos até a Cerimônia da Revelação e um campeonato de 38 rodadas pra provar quem entende de bola. Contra CPU ou online com a galera.
          </p>
          <span className="inline-block mt-3 border-2 border-black rounded-full px-2.5 py-0.5 text-xs font-black uppercase"
                style={{ backgroundColor: '#FFC400', color: '#000' }}>NOVO ✦</span>
        </motion.button>

        <motion.button
          onClick={() => onSelect('chess')}
          whileTap={{ x: 3, y: 3 }}
          className="w-full text-left border-[3px] border-black rounded-2xl p-6 transition-all"
          style={{ background: 'linear-gradient(135deg, #101418 0%, #1E2630 100%)', boxShadow: '6px 6px 0 0 #C9A227' }}
        >
          <div className="text-4xl mb-3">♞</div>
          <p className="font-black text-2xl" style={{ fontFamily: 'Oswald, sans-serif', color: '#E8C766' }}>CHESS LEGENDS</p>
          <p className="text-white/70 text-sm mt-1 font-medium">
            Xadrez online premium. Crie uma sala, chame um amigo e dispute com relógio, chat e temas exclusivos.
          </p>
          <span className="inline-block mt-3 border-2 border-black rounded-full px-2.5 py-0.5 text-xs font-black uppercase"
                style={{ backgroundColor: '#E8C766', color: '#000' }}>NOVO ✦</span>
        </motion.button>

        <motion.button
          onClick={() => onSelect('historiadores')}
          whileTap={{ x: 3, y: 3 }}
          className="w-full text-left border-[3px] border-black rounded-2xl p-6 transition-all"
          style={{ backgroundColor: '#FFB800', boxShadow: '6px 6px 0 0 #0C0C0C' }}
        >
          <div className="text-4xl mb-3">🏆</div>
          <p className="text-black font-black text-2xl" style={{ fontFamily: 'Oswald, sans-serif' }}>HISTORIADORES DA BOLA</p>
          <p className="text-black/70 text-sm mt-1 font-medium">
            Você conhece as lendas. Prove com seu palpite e sua grana. Colecione cartas, construa seu museu.
          </p>
        </motion.button>

        <motion.button
          onClick={() => onSelect('draft')}
          whileTap={{ x: 3, y: 3 }}
          className="w-full text-left border-[3px] border-black rounded-2xl p-6 transition-all"
          style={{ backgroundColor: '#7C3AED', boxShadow: '6px 6px 0 0 #0C0C0C' }}
        >
          <div className="text-4xl mb-3">⚡</div>
          <p className="text-white font-black text-2xl" style={{ fontFamily: 'Oswald, sans-serif' }}>OS ELEITOS DE 92</p>
          <p className="text-white/80 text-sm mt-1 font-medium">
            Um raio jogou você e a galera de volta a 1992. Só vocês lembram as lendas. Pegue um time da 4ª divisão e dispute o draft pra fisgar os craques antes dos amigos.
          </p>
        </motion.button>

        <motion.button
          onClick={() => onSelect('empresario')}
          whileTap={{ x: 3, y: 3 }}
          className="w-full text-left border-[3px] border-black rounded-2xl p-6 transition-all"
          style={{ backgroundColor: '#2B43E8', boxShadow: '6px 6px 0 0 #0C0C0C' }}
        >
          <div className="text-4xl mb-3">💼</div>
          <p className="text-white font-black text-2xl" style={{ fontFamily: 'Oswald, sans-serif' }}>O EMPRESÁRIO</p>
          <p className="text-white/80 text-sm mt-1 font-medium">
            Você voltou do futuro. Só você sabe quem são as lendas. Assine-as, negocie no seu favor, fique podre de rico.
          </p>
        </motion.button>

        <motion.button
          onClick={() => onSelect('supertrunfo')}
          whileTap={{ x: 3, y: 3 }}
          className="w-full text-left border-[3px] border-black rounded-2xl p-6 transition-all"
          style={{ backgroundColor: '#16B89A', boxShadow: '6px 6px 0 0 #0C0C0C' }}
        >
          <div className="text-4xl mb-3">🃏</div>
          <p className="text-white font-black text-2xl" style={{ fontFamily: 'Oswald, sans-serif' }}>SUPER TRUNFO DAS LENDAS</p>
          <p className="text-white/80 text-sm mt-1 font-medium">
            40 lendas do futebol em duelo de atributos. Colete todas as cartas e domine o mundo.
          </p>
        </motion.button>
      </div>
    </div>
  )
}

export default function App() {
  const [selectedGame, setSelectedGame] = useState<GameKey | null>(null)

  // Deep link: ?sala=CODE opens Chess Legends directly (invite links)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('sala')) setSelectedGame('chess')
  }, [])

  if (!selectedGame) {
    return <GameSelector onSelect={setSelectedGame} />
  }

  if (selectedGame === 'chess') {
    return <ChessLegends />
  }

  if (selectedGame === 'empresario') {
    return <EmpresarioGame />
  }

  if (selectedGame === 'draft') {
    return <DraftGame />
  }

  if (selectedGame === 'escalacao') {
    return <EscalacaoGame />
  }

  if (selectedGame === 'supertrunfo') {
    return <SuperTrunfoGame />
  }

  return <HistoriadorGame />
}

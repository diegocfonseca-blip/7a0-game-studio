# 7A0 Game Studio

Coleção de jogos web para jogar com amigos. React 19 + TypeScript + Vite + Tailwind CSS v4 + Framer Motion, com multiplayer via Supabase Realtime.

## Jogos

- **♞ Chess Legends** — xadrez online premium (`src/chess/`)
- **🏆 Historiadores da Bola** — palpites e leilão de cartas de lendas (`src/historiadores/`)
- **⚡ Os Eleitos de 92** — draft de lendas nos anos 90 (`src/draft/`)
- **💼 O Empresário** — gestão de carreiras de lendas (`src/empresario/`)
- **🃏 Super Trunfo das Lendas** — duelo de atributos (`src/supertrunfo/`)

## Como rodar

```bash
npm install
npm run dev      # desenvolvimento em http://localhost:5173/7a0-game-studio/
npm run build    # build de produção em dist/
```

Deploy: GitHub Pages (SPA estático). A base path é `/7a0-game-studio/` (configurável via `DEPLOY_BASE`).

---

## ♞ Chess Legends

Xadrez com **100% das regras oficiais** (via [chess.js](https://github.com/jhlywa/chess.js)): roque, en passant, promoção com escolha de peça, xeque, xeque-mate, afogamento, empate por material insuficiente, repetição tripla e regra dos 50 lances. Jogadas ilegais são impedidas e as casas possíveis são destacadas.

### Modos

- **Online com amigo** — crie uma sala, compartilhe o código (ex: `A7K9`), o link (`?sala=A7K9`) ou mande direto no WhatsApp. Quando o amigo entra, a partida começa automaticamente.
- **Contra o computador** — 3 níveis (Fácil/Médio/Difícil), motor próprio negamax + alpha-beta com piece-square tables (`src/chess/cpu.ts`).
- **Modo Carreira** — crie um jogador com 800 de rating, jogue ranqueadas com Elo real e suba até Grande Mestre (2500). Títulos, estatísticas de aberturas e histórico persistidos em localStorage (`src/chess/career.ts`).
- **Modo História** — 6 partidas lendárias (Ópera, Imortal, Sempre-Viva, Partida do Século, Fischer×Spassky G6, Imortal de Kasparov) com replay e "mudar a história": assuma o lado do mestre de qualquer posição (`src/chess/famous.ts`, lances validados via chess.js).
- **IA com personalidade** — Tal 🔥, Capablanca 🎩, Kasparov ⚡, Carlsen 🐍 e Fischer 🎯 jogam com vieses de estilo reais sobre o mesmo motor.
- **Mestres em ação** — modo espectador IA × IA com velocidade ajustável.
- **Local** — dois jogadores no mesmo aparelho.
- **Análise inteligente** — pós-jogo: gráfico de vantagem, momentos críticos clicáveis e top-3 melhores lances com explicação (`src/chess/analysis.tsx`). Modo Imersão esconde tudo menos o tabuleiro durante a partida.

### Recursos

- **Relógio de xadrez**: sem tempo, 1 min, 1+1, 2+1, 3 min, 3+2, 5 min, 5+3, 10 min, 10+5, 15+10, 30 min ou personalizado (minutos + incremento).
- **Escolha de cor**: brancas, pretas ou aleatório.
- **8 temas visuais**: 2D Clássico, Madeira Premium, Mármore, Medieval, Futurista, Neon Escuro, **Rubro-Negro** 🔴 (vermelho/preto/dourado) e **Almirante** ⚓ (preto/branco/dourado náutico). Visuais inspirados, sem marcas registradas. O criador define o tema padrão da sala; cada jogador pode trocar **só na própria tela**.
- **2D / 3D**: alternância individual por jogador. O 3D é WebGL de verdade (three.js + react-three-fiber): peças torneadas com volume, sombras suaves, tabuleiro com moldura e câmera de mesa — carregado sob demanda (code-split).
- **Chat da sala** com nome e horário.
- **Histórico em notação algébrica** + identificação de abertura (Ruy López, Siciliana, Londres…).
- **Análise pós-jogo**: resultado, motivo, nº de lances, tempo restante, revisão lance a lance.
- **Revanche** (trocando cores ou não), **render-se**, **propor empate**, sair da sala.
- **Sons** sintetizados (lance, captura, xeque, fim, tempo baixo) — ligáveis nas configurações.
- **Configurações persistentes** (localStorage): nome, avatar, tema, 2D/3D, sons, dicas de casas, animações.
- **Responsivo**: desktop com 3 colunas (jogadores/chat · tabuleiro · histórico); no celular os painéis viram abas e o tabuleiro fica grande.

### Arquitetura online

Sem servidor próprio: as salas usam **Supabase Realtime** (canais de broadcast + presence).

- Handshake: o convidado envia `hello`; o anfitrião sorteia/atribui cores e responde `start`.
- Jogadas: cada lance é **validado nos dois clientes** com chess.js — lances ilegais, fora de vez ou de outro jogador são rejeitados; um terceiro jogador não consegue sentar na mesa (recebe "sala cheia").
- Relógio: quem move informa seu tempo restante junto do lance; queda de bandeira é adjudicada nos dois lados (rei sozinho do rival = empate).
- Reconexão: id de jogador estável por navegador + evento `sync` reenvia o estado para quem voltou.
- Estrutura preparada para endurecer com backend autoritativo e engine (Stockfish) no futuro — a validação já é isolada em `src/chess/engine.ts`.

### Estrutura de pastas

```
src/chess/
├── index.tsx      # navegação (home, setup, join, lobby, partida)
├── screens.tsx    # home premium, setup, entrar com código, lobby, config, como jogar
├── GameView.tsx   # tela de partida (tabuleiro, relógios, chat, histórico, análise, fim)
├── Board.tsx      # tabuleiro 2D/3D com destaques, coordenadas e promoção
├── engine.ts      # wrapper chess.js: validação, peças com id estável, aberturas, fim
├── online.ts      # sala online via Supabase Realtime (eventos, sync, revanche)
├── localMatch.ts  # partida local no mesmo aparelho
├── clock.ts       # relógio de xadrez com incremento
├── themes.ts      # 8 temas de tabuleiro
├── settings.ts    # preferências do usuário (localStorage)
├── sound.ts       # sons via WebAudio
└── types.ts       # tipos e controles de tempo
```

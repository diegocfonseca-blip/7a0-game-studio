// 📺 MOTOR 2D v2 (EXPERIMENTAL, 20/10) — tipos comuns. Plano e regras em `docs/motor-2d-v2.md`.
// ⚠️ Isolado: nada do jogo usa este motor ainda. Ele só roda na bancada (`scripts/teste-campo2d/v2.html`) e na trava
// `npm run motor2`. O motor de verdade continua sendo o `campo2d-motor.ts` (v1).
import type { Estilo, Golpe, Pe } from '../campo2d-estilos'

export type Lado = 0 | 1
export type Grupo = 'GOL' | 'DEF' | 'LAT' | 'MEI' | 'ATA'

/** o perfil do jogador em campo (0–100), DERIVADO da carta — a carta e o save não mudam (`atributos.ts`) */
export interface Atrib {
  vel: number; acel: number; conducao: number; passe: number; visao: number; finalizacao: number; cabeceio: number
  desarme: number; posicionamento: number; fisico: number; reflexo: number; saida: number; decisao: number
}
/** tendências (0–1): o que ele GOSTA de tentar quando a situação deixa. Não é jogada obrigatória — pesa na escolha. */
export interface Tendencia { drible: number; passeLongo: number; chuteLonge: number; infiltra: number; cruza: number; apoia: number }

export interface CartaCampo { name: string; pos?: string; sec?: string; club?: string; year?: number; fame?: number; lo?: number; hi?: number; fake?: boolean; /** 😓 o desconto da régua de condição da carreira nesta rodada (0 · −1 · −2 · −3): quem entra cansado começa com menos gás */ gasMod?: number }

/** o que o jogador está fazendo SEM a bola (o coletivo escolhe) */
export type Papel = 'forma' | 'pressiona' | 'cobre' | 'marca' | 'opcao' | 'infiltra' | 'ultrapassa' | 'recebe' | 'bola_solta' | 'goleiro' | 'cobranca'

export interface Atleta {
  id: number; lado: Lado; nome: string; carta?: CartaCampo; grupo: Grupo
  estilo: Estilo; golpes: Golpe[]; pe: Pe; /** o que ele rende AGORA (a base × o gás) */ at: Atrib; /** o nível do dia, inteiro (antes do cansaço) */ base: Atrib; /** 🔥 forma do dia: −1 pior dia da faixa · +1 ápice */ forma: number; tend: Tendencia
  /** referência da formação: largura (0–68) e profundidade (0 = linha de trás · 1 = linha da frente) */
  bx: number; dep: number
  x: number; y: number; vx: number; vy: number
  /** 🧍 para onde o CORPO está virado (vetor unitário) — gira com limite; passar/chutar/receber de costas custa (25/10) */
  fx: number; fy: number
  /** onde estava no passo anterior (o desenho interpola) */
  ax?: number; ay?: number
  alvo: { x: number; y: number; v: number }
  papel: Papel; marca: Atleta | null
  proxDecisao: number; atordoado: number
  amarelos: number; expulso: boolean; /** gás AGORA (1 = inteiro; cai ao longo do jogo) */ gas: number; /** quantas faltas já fez (reincidência pesa no cartão) */ faltas: number
}

export interface Bola {
  x: number; y: number; h: number; vx: number; vy: number; vh: number
  /** 🌀 efeito (curva): quanto a direção da bola gira por segundo (rad/s; + = horário visto de cima). Some no quique. */
  giro?: number
  dono: Atleta | null
  /** quem tocou por último (lateral/escanteio/tiro de meta) */
  ultimo: Atleta | null
  /** o passe/chute que está andando agora (pra saber quem era o alvo, se foi impedimento, se é chute) */
  lance: Lance | null
}

export type TipoLance = 'passe' | 'enfiada' | 'lancamento' | 'inversao' | 'cruzamento' | 'chutao' | 'chute' | 'cabeceio_gol' | 'cabeceio' | 'cobranca' | 'desvio'
export interface Lance { tipo: TipoLance; de: Atleta; para: Atleta | null; t0: number; impedido: boolean; xg?: number; golpe?: string; saiuDe?: { x: number; y: number }; defendido?: boolean }

export type TipoEvento =
  | 'saida' | 'passe' | 'enfiada' | 'lancamento' | 'inversao' | 'cruzamento' | 'chutao' | 'drible' | 'arrancada' | 'desarme' | 'intercepta'
  | 'carrinho' | 'falta' | 'amarelo' | 'vermelho' | 'impedimento' | 'chute' | 'defesa' | 'espalma' | 'encaixa' | 'trave' | 'fora' | 'isolou'
  | 'bloqueio' | 'gol' | 'escanteio' | 'lateral' | 'tiro_de_meta' | 'cobranca_falta' | 'penalti' | 'cabeceio' | 'corte' | 'saida_goleiro' | 'intervalo' | 'fim'
  | 'vantagem' | 'acrescimo' | 'rebote' | 'cara_a_cara'
export interface Evento { t: number; tipo: TipoEvento; lado: Lado; a?: string; b?: string; golpe?: string; x?: number; y?: number; extra?: string }

export interface Estatistica {
  posse: [number, number]; passes: [number, number]; passesCertos: [number, number]; chutes: [number, number]; noAlvo: [number, number]
  gols: [number, number]; xg: [number, number]; faltas: [number, number]; amarelos: [number, number]; vermelhos: [number, number]
  escanteios: [number, number]; impedimentos: [number, number]; laterais: [number, number]; desarmes: [number, number]; vantagens: [number, number]
  dribles: [number, number]; interceptacoes: [number, number]; defesas: [number, number]; penaltis: [number, number]
}

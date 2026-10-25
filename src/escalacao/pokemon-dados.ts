// ⚡ MODO POKÉMON (25/10, só a conta do Diego, em teste) — o CATÁLOGO e a TABELA DE TIPOS.
// Conceito fechado com ele: `docs/conceito-pokemon.md`. Regras que valem aqui:
//  · TIPOS OFICIAIS de hoje (os 18) — pedido dele: *"não quero fãs de pokémon me perturbando que tá errado"*.
//  · toda a 1ª geração + os mais famosos das outras; categoria = Lenda · Craque · Bom · Profissional (fame 5 · 4 · 2 · 1);
//    folclórico (⭐) é só selo, igual ao Vozinha.
//  · a tabela de vantagens é a OFICIAL (ataque × defesa, tipo duplo multiplica).
// Arquivo puro (sem tela). Trava: `npx tsx scripts/testa-pokemon.mts`.

export type TipoPoke =
  | 'Normal' | 'Fogo' | 'Água' | 'Planta' | 'Elétrico' | 'Gelo' | 'Lutador' | 'Veneno' | 'Terra'
  | 'Voador' | 'Psíquico' | 'Inseto' | 'Pedra' | 'Fantasma' | 'Dragão' | 'Sombrio' | 'Aço' | 'Fada'

export const TIPOS_POKE: TipoPoke[] = ['Normal', 'Fogo', 'Água', 'Planta', 'Elétrico', 'Gelo', 'Lutador', 'Veneno', 'Terra',
  'Voador', 'Psíquico', 'Inseto', 'Pedra', 'Fantasma', 'Dragão', 'Sombrio', 'Aço', 'Fada']

/** nome do tipo em inglês (a carta mostra o tipo no idioma de quem joga) */
export const TIPO_EN: Record<TipoPoke, string> = {
  Normal: 'Normal', Fogo: 'Fire', Água: 'Water', Planta: 'Grass', Elétrico: 'Electric', Gelo: 'Ice', Lutador: 'Fighting',
  Veneno: 'Poison', Terra: 'Ground', Voador: 'Flying', Psíquico: 'Psychic', Inseto: 'Bug', Pedra: 'Rock', Fantasma: 'Ghost',
  Dragão: 'Dragon', Sombrio: 'Dark', Aço: 'Steel', Fada: 'Fairy',
}

/** cor de cada tipo (selo da carta e fundo do desenho do tipo) */
export const COR_TIPO: Record<TipoPoke, string> = {
  Normal: '#C9BFA6', Fogo: '#E8503A', Água: '#2F6BAE', Planta: '#1B7A3D', Elétrico: '#FFC400', Gelo: '#66C6D9',
  Lutador: '#B5452B', Veneno: '#7C3AED', Terra: '#B07A3C', Voador: '#8FA8E8', Psíquico: '#E85A94', Inseto: '#8DB33A',
  Pedra: '#8B6B4A', Fantasma: '#5B4A9E', Dragão: '#3A4FB0', Sombrio: '#3D3530', Aço: '#8C98A6', Fada: '#F08FC0',
}

// ── TABELA OFICIAL DE VANTAGENS (geração 6 em diante) ─────────────────────────────────────────────────────────
// Só o que NÃO é 1×: [ataque] → { defesa: multiplicador }
const T: Partial<Record<TipoPoke, Partial<Record<TipoPoke, number>>>> = {
  Normal: { Pedra: 0.5, Fantasma: 0, Aço: 0.5 },
  Fogo: { Fogo: 0.5, Água: 0.5, Planta: 2, Gelo: 2, Inseto: 2, Pedra: 0.5, Dragão: 0.5, Aço: 2 },
  Água: { Fogo: 2, Água: 0.5, Planta: 0.5, Terra: 2, Pedra: 2, Dragão: 0.5 },
  Planta: { Fogo: 0.5, Água: 2, Planta: 0.5, Veneno: 0.5, Terra: 2, Voador: 0.5, Inseto: 0.5, Pedra: 2, Dragão: 0.5, Aço: 0.5 },
  Elétrico: { Água: 2, Planta: 0.5, Elétrico: 0.5, Terra: 0, Voador: 2, Dragão: 0.5 },
  Gelo: { Fogo: 0.5, Água: 0.5, Planta: 2, Gelo: 0.5, Terra: 2, Voador: 2, Dragão: 2, Aço: 0.5 },
  Lutador: { Normal: 2, Gelo: 2, Veneno: 0.5, Voador: 0.5, Psíquico: 0.5, Inseto: 0.5, Pedra: 2, Fantasma: 0, Sombrio: 2, Aço: 2, Fada: 0.5 },
  Veneno: { Planta: 2, Veneno: 0.5, Terra: 0.5, Pedra: 0.5, Fantasma: 0.5, Aço: 0, Fada: 2 },
  Terra: { Fogo: 2, Planta: 0.5, Elétrico: 2, Veneno: 2, Voador: 0, Inseto: 0.5, Pedra: 2, Aço: 2 },
  Voador: { Planta: 2, Elétrico: 0.5, Lutador: 2, Inseto: 2, Pedra: 0.5, Aço: 0.5 },
  Psíquico: { Lutador: 2, Veneno: 2, Psíquico: 0.5, Sombrio: 0, Aço: 0.5 },
  Inseto: { Fogo: 0.5, Planta: 2, Lutador: 0.5, Veneno: 0.5, Voador: 0.5, Psíquico: 2, Fantasma: 0.5, Sombrio: 2, Aço: 0.5, Fada: 0.5 },
  Pedra: { Fogo: 2, Gelo: 2, Lutador: 0.5, Terra: 0.5, Voador: 2, Inseto: 2, Aço: 0.5 },
  Fantasma: { Normal: 0, Psíquico: 2, Fantasma: 2, Sombrio: 0.5 },
  Dragão: { Dragão: 2, Aço: 0.5, Fada: 0 },
  Sombrio: { Lutador: 0.5, Psíquico: 2, Fantasma: 2, Sombrio: 0.5, Fada: 0.5 },
  Aço: { Fogo: 0.5, Água: 0.5, Elétrico: 0.5, Gelo: 2, Pedra: 2, Aço: 0.5, Fada: 2 },
  Fada: { Fogo: 0.5, Lutador: 2, Veneno: 0.5, Dragão: 2, Sombrio: 2, Aço: 0.5 },
}
/** quanto um golpe de `ataque` faz em quem tem `defesa` (tipo duplo multiplica: 0 · ¼ · ½ · 1 · 2 · 4) */
export function efetividade(ataque: TipoPoke, defesa: TipoPoke[]): number {
  return defesa.reduce((m, d) => m * (T[ataque]?.[d] ?? 1), 1)
}

// ── O CATÁLOGO ────────────────────────────────────────────────────────────────────────────────────────────────
export type CatPoke = 'lenda' | 'craque' | 'bom' | 'pro'
export interface Pokemon { n: number; nome: string; tipos: TipoPoke[]; cat: CatPoke; folk?: boolean }
/** fame do motor do leilão (5 lenda · 4 craque · 2 bom · 1 profissional) */
export const FAME_POKE: Record<CatPoke, 5 | 4 | 2 | 1> = { lenda: 5, craque: 4, bom: 2, pro: 1 }

const P = (n: number, nome: string, tipos: TipoPoke[], cat: CatPoke, folk?: boolean): Pokemon => ({ n, nome, tipos, cat, ...(folk ? { folk } : {}) })
export const POKEMONS: Pokemon[] = [
  // 👑 LENDAS (26)
  P(6, 'Charizard', ['Fogo', 'Voador'], 'lenda'), P(146, 'Moltres', ['Fogo', 'Voador'], 'lenda'), P(250, 'Ho-Oh', ['Fogo', 'Voador'], 'lenda'),
  P(384, 'Rayquaza', ['Dragão', 'Voador'], 'lenda'), P(149, 'Dragonite', ['Dragão', 'Voador'], 'lenda'),
  P(9, 'Blastoise', ['Água'], 'lenda'), P(130, 'Gyarados', ['Água', 'Voador'], 'lenda'), P(144, 'Articuno', ['Gelo', 'Voador'], 'lenda'),
  P(245, 'Suicune', ['Água'], 'lenda'), P(382, 'Kyogre', ['Água'], 'lenda'), P(658, 'Greninja', ['Água', 'Sombrio'], 'lenda'),
  P(3, 'Venusaur', ['Planta', 'Veneno'], 'lenda'), P(251, 'Celebi', ['Psíquico', 'Planta'], 'lenda'), P(254, 'Sceptile', ['Planta'], 'lenda'),
  P(25, 'Pikachu', ['Elétrico'], 'lenda', true), P(145, 'Zapdos', ['Elétrico', 'Voador'], 'lenda'), P(143, 'Snorlax', ['Normal'], 'lenda', true),
  P(243, 'Raikou', ['Elétrico'], 'lenda'),
  P(448, 'Lucario', ['Lutador', 'Aço'], 'lenda'), P(248, 'Tyranitar', ['Pedra', 'Sombrio'], 'lenda'), P(376, 'Metagross', ['Aço', 'Psíquico'], 'lenda'),
  P(383, 'Groudon', ['Terra'], 'lenda'),
  P(150, 'Mewtwo', ['Psíquico'], 'lenda'), P(151, 'Mew', ['Psíquico'], 'lenda'), P(94, 'Gengar', ['Fantasma', 'Veneno'], 'lenda'),
  P(249, 'Lugia', ['Psíquico', 'Voador'], 'lenda'),
  // 💜 CRAQUES
  P(59, 'Arcanine', ['Fogo'], 'craque'), P(38, 'Ninetales', ['Fogo'], 'craque'), P(157, 'Typhlosion', ['Fogo'], 'craque'),
  P(257, 'Blaziken', ['Fogo', 'Lutador'], 'craque'), P(392, 'Infernape', ['Fogo', 'Lutador'], 'craque'), P(445, 'Garchomp', ['Dragão', 'Terra'], 'craque'),
  P(373, 'Salamence', ['Dragão', 'Voador'], 'craque'), P(244, 'Entei', ['Fogo'], 'craque'),
  P(131, 'Lapras', ['Água', 'Gelo'], 'craque'), P(134, 'Vaporeon', ['Água'], 'craque'), P(121, 'Starmie', ['Água', 'Psíquico'], 'craque'),
  P(91, 'Cloyster', ['Água', 'Gelo'], 'craque'), P(55, 'Golduck', ['Água'], 'craque'), P(80, 'Slowbro', ['Água', 'Psíquico'], 'craque'),
  P(260, 'Swampert', ['Água', 'Terra'], 'craque'), P(160, 'Feraligatr', ['Água'], 'craque'),
  P(212, 'Scizor', ['Inseto', 'Aço'], 'craque'), P(123, 'Scyther', ['Inseto', 'Voador'], 'craque'), P(214, 'Heracross', ['Inseto', 'Lutador'], 'craque'),
  P(724, 'Decidueye', ['Planta', 'Fantasma'], 'craque'), P(103, 'Exeggutor', ['Planta', 'Psíquico'], 'craque'),
  P(12, 'Butterfree', ['Inseto', 'Voador'], 'craque'), P(45, 'Vileplume', ['Planta', 'Veneno'], 'craque'),
  P(26, 'Raichu', ['Elétrico'], 'craque'), P(135, 'Jolteon', ['Elétrico'], 'craque'), P(18, 'Pidgeot', ['Normal', 'Voador'], 'craque'),
  P(125, 'Electabuzz', ['Elétrico'], 'craque'), P(133, 'Eevee', ['Normal'], 'craque'), P(181, 'Ampharos', ['Elétrico'], 'craque'),
  P(405, 'Luxray', ['Elétrico'], 'craque'), P(807, 'Zeraora', ['Elétrico'], 'craque'), P(468, 'Togekiss', ['Fada', 'Voador'], 'craque'),
  P(68, 'Machamp', ['Lutador'], 'craque'), P(76, 'Golem', ['Pedra', 'Terra'], 'craque'), P(95, 'Onix', ['Pedra', 'Terra'], 'craque'),
  P(208, 'Steelix', ['Aço', 'Terra'], 'craque'), P(142, 'Aerodactyl', ['Pedra', 'Voador'], 'craque'), P(106, 'Hitmonlee', ['Lutador'], 'craque'),
  P(107, 'Hitmonchan', ['Lutador'], 'craque'), P(112, 'Rhydon', ['Terra', 'Pedra'], 'craque'), P(141, 'Kabutops', ['Pedra', 'Água'], 'craque'),
  P(65, 'Alakazam', ['Psíquico'], 'craque'), P(282, 'Gardevoir', ['Psíquico', 'Fada'], 'craque'), P(196, 'Espeon', ['Psíquico'], 'craque'),
  P(197, 'Umbreon', ['Sombrio'], 'craque'), P(34, 'Nidoking', ['Veneno', 'Terra'], 'craque'), P(31, 'Nidoqueen', ['Veneno', 'Terra'], 'craque'),
  P(359, 'Absol', ['Sombrio'], 'craque'), P(700, 'Sylveon', ['Fada'], 'craque'), P(778, 'Mimikyu', ['Fantasma', 'Fada'], 'craque'),
  P(39, 'Jigglypuff', ['Normal', 'Fada'], 'craque', true),
  // 🟢 BONS
  P(4, 'Charmander', ['Fogo'], 'bom'), P(5, 'Charmeleon', ['Fogo'], 'bom'), P(78, 'Rapidash', ['Fogo'], 'bom'), P(126, 'Magmar', ['Fogo'], 'bom'),
  P(136, 'Flareon', ['Fogo'], 'bom'), P(148, 'Dragonair', ['Dragão'], 'bom'), P(155, 'Cyndaquil', ['Fogo'], 'bom'), P(255, 'Torchic', ['Fogo'], 'bom'),
  P(727, 'Incineroar', ['Fogo', 'Sombrio'], 'bom'),
  P(7, 'Squirtle', ['Água'], 'bom'), P(8, 'Wartortle', ['Água'], 'bom'), P(62, 'Poliwrath', ['Água', 'Lutador'], 'bom'),
  P(73, 'Tentacruel', ['Água', 'Veneno'], 'bom'), P(87, 'Dewgong', ['Água', 'Gelo'], 'bom'), P(99, 'Kingler', ['Água'], 'bom'),
  P(117, 'Seadra', ['Água'], 'bom'), P(119, 'Seaking', ['Água'], 'bom'), P(124, 'Jynx', ['Gelo', 'Psíquico'], 'bom'),
  P(54, 'Psyduck', ['Água'], 'bom', true), P(158, 'Totodile', ['Água'], 'bom'), P(258, 'Mudkip', ['Água'], 'bom'),
  P(183, 'Marill', ['Água', 'Fada'], 'bom'), P(728, 'Popplio', ['Água'], 'bom'),
  P(1, 'Bulbasaur', ['Planta', 'Veneno'], 'bom'), P(2, 'Ivysaur', ['Planta', 'Veneno'], 'bom'), P(15, 'Beedrill', ['Inseto', 'Veneno'], 'bom'),
  P(71, 'Victreebel', ['Planta', 'Veneno'], 'bom'), P(127, 'Pinsir', ['Inseto'], 'bom'), P(47, 'Parasect', ['Inseto', 'Planta'], 'bom'),
  P(49, 'Venomoth', ['Inseto', 'Veneno'], 'bom'), P(114, 'Tangela', ['Planta'], 'bom'), P(152, 'Chikorita', ['Planta'], 'bom'),
  P(252, 'Treecko', ['Planta'], 'bom'), P(722, 'Rowlet', ['Planta', 'Voador'], 'bom'),
  P(82, 'Magneton', ['Elétrico', 'Aço'], 'bom'), P(101, 'Electrode', ['Elétrico'], 'bom'), P(22, 'Fearow', ['Normal', 'Voador'], 'bom'),
  P(53, 'Persian', ['Normal'], 'bom'), P(85, 'Dodrio', ['Normal', 'Voador'], 'bom'), P(115, 'Kangaskhan', ['Normal'], 'bom'),
  P(128, 'Tauros', ['Normal'], 'bom'), P(113, 'Chansey', ['Normal'], 'bom'), P(137, 'Porygon', ['Normal'], 'bom'),
  P(132, 'Ditto', ['Normal'], 'bom', true), P(52, 'Meowth', ['Normal'], 'bom', true), P(172, 'Pichu', ['Elétrico'], 'bom'),
  P(28, 'Sandslash', ['Terra'], 'bom'), P(51, 'Dugtrio', ['Terra'], 'bom'), P(57, 'Primeape', ['Lutador'], 'bom'),
  P(67, 'Machoke', ['Lutador'], 'bom'), P(75, 'Graveler', ['Pedra', 'Terra'], 'bom'), P(105, 'Marowak', ['Terra'], 'bom'),
  P(139, 'Omastar', ['Pedra', 'Água'], 'bom'), P(104, 'Cubone', ['Terra'], 'bom', true),
  P(64, 'Kadabra', ['Psíquico'], 'bom'), P(93, 'Haunter', ['Fantasma', 'Veneno'], 'bom'), P(24, 'Arbok', ['Veneno'], 'bom'),
  P(36, 'Clefable', ['Fada'], 'bom'), P(40, 'Wigglytuff', ['Normal', 'Fada'], 'bom'), P(42, 'Golbat', ['Veneno', 'Voador'], 'bom'),
  P(89, 'Muk', ['Veneno'], 'bom'), P(110, 'Weezing', ['Veneno'], 'bom'), P(97, 'Hypno', ['Psíquico'], 'bom'),
  P(122, 'Mr. Mime', ['Psíquico', 'Fada'], 'bom'), P(30, 'Nidorina', ['Veneno'], 'bom'), P(33, 'Nidorino', ['Veneno'], 'bom'),
  P(175, 'Togepi', ['Fada'], 'bom'), P(202, 'Wobbuffet', ['Psíquico'], 'bom', true),
  // 🤎 PROFISSIONAIS
  P(37, 'Vulpix', ['Fogo'], 'pro'), P(58, 'Growlithe', ['Fogo'], 'pro'), P(77, 'Ponyta', ['Fogo'], 'pro'), P(147, 'Dratini', ['Dragão'], 'pro'),
  P(725, 'Litten', ['Fogo'], 'pro'),
  P(60, 'Poliwag', ['Água'], 'pro'), P(61, 'Poliwhirl', ['Água'], 'pro'), P(72, 'Tentacool', ['Água', 'Veneno'], 'pro'),
  P(79, 'Slowpoke', ['Água', 'Psíquico'], 'pro', true), P(86, 'Seel', ['Água'], 'pro'), P(90, 'Shellder', ['Água'], 'pro'),
  P(98, 'Krabby', ['Água'], 'pro'), P(116, 'Horsea', ['Água'], 'pro'), P(118, 'Goldeen', ['Água'], 'pro'), P(120, 'Staryu', ['Água'], 'pro'),
  P(129, 'Magikarp', ['Água'], 'pro', true),
  P(10, 'Caterpie', ['Inseto'], 'pro', true), P(11, 'Metapod', ['Inseto'], 'pro', true), P(13, 'Weedle', ['Inseto', 'Veneno'], 'pro'),
  P(14, 'Kakuna', ['Inseto', 'Veneno'], 'pro'), P(43, 'Oddish', ['Planta', 'Veneno'], 'pro'), P(44, 'Gloom', ['Planta', 'Veneno'], 'pro'),
  P(46, 'Paras', ['Inseto', 'Planta'], 'pro'), P(48, 'Venonat', ['Inseto', 'Veneno'], 'pro'), P(69, 'Bellsprout', ['Planta', 'Veneno'], 'pro'),
  P(70, 'Weepinbell', ['Planta', 'Veneno'], 'pro'), P(102, 'Exeggcute', ['Planta', 'Psíquico'], 'pro'),
  P(16, 'Pidgey', ['Normal', 'Voador'], 'pro'), P(17, 'Pidgeotto', ['Normal', 'Voador'], 'pro'), P(19, 'Rattata', ['Normal'], 'pro'),
  P(20, 'Raticate', ['Normal'], 'pro'), P(21, 'Spearow', ['Normal', 'Voador'], 'pro'), P(81, 'Magnemite', ['Elétrico', 'Aço'], 'pro'),
  P(83, "Farfetch'd", ['Normal', 'Voador'], 'pro'), P(84, 'Doduo', ['Normal', 'Voador'], 'pro'), P(100, 'Voltorb', ['Elétrico'], 'pro'),
  P(108, 'Lickitung', ['Normal'], 'pro'),
  P(27, 'Sandshrew', ['Terra'], 'pro'), P(50, 'Diglett', ['Terra'], 'pro', true), P(56, 'Mankey', ['Lutador'], 'pro'),
  P(66, 'Machop', ['Lutador'], 'pro'), P(74, 'Geodude', ['Pedra', 'Terra'], 'pro'), P(111, 'Rhyhorn', ['Terra', 'Pedra'], 'pro'),
  P(138, 'Omanyte', ['Pedra', 'Água'], 'pro'), P(140, 'Kabuto', ['Pedra', 'Água'], 'pro'),
  P(23, 'Ekans', ['Veneno'], 'pro'), P(29, 'Nidoran♀', ['Veneno'], 'pro'), P(32, 'Nidoran♂', ['Veneno'], 'pro'), P(35, 'Clefairy', ['Fada'], 'pro'),
  P(41, 'Zubat', ['Veneno', 'Voador'], 'pro', true), P(63, 'Abra', ['Psíquico'], 'pro'), P(88, 'Grimer', ['Veneno'], 'pro'),
  P(92, 'Gastly', ['Fantasma', 'Veneno'], 'pro'), P(96, 'Drowzee', ['Psíquico'], 'pro'), P(109, 'Koffing', ['Veneno'], 'pro'),
]

/** região e geração pela Pokédex nacional (a carta mostra "Kanto · Geração 1") */
export function regiaoDe(n: number): { regiao: string; geracao: number } {
  if (n <= 151) return { regiao: 'Kanto', geracao: 1 }
  if (n <= 251) return { regiao: 'Johto', geracao: 2 }
  if (n <= 386) return { regiao: 'Hoenn', geracao: 3 }
  if (n <= 493) return { regiao: 'Sinnoh', geracao: 4 }
  if (n <= 649) return { regiao: 'Unova', geracao: 5 }
  if (n <= 721) return { regiao: 'Kalos', geracao: 6 }
  return { regiao: 'Alola', geracao: 7 }
}

/** faixa de nível do dia (lo–hi), igual à dos jogadores: pela categoria + um tempero fixo por pokémon */
export function faixaPoke(p: Pokemon): { lo: number; hi: number } {
  const base = { lenda: [88, 97], craque: [78, 89], bom: [66, 79], pro: [54, 67] }[p.cat]
  const t = ((p.n * 37) % 7) - 3 // −3…+3, fixo por pokémon
  return { lo: base[0] + Math.min(0, t), hi: base[1] + Math.max(0, t) }
}

/** 👑 só as Lendas têm a arte do próprio pokémon (sem rosto). O resto usa o desenho do TIPO (regra do Diego, 25/10). */
export const COM_ARTE = new Set(POKEMONS.filter(p => p.cat === 'lenda').map(p => p.n))

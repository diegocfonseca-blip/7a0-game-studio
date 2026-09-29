// ─── 🧱 SELOS DOS CLUBES DO LEILÃO DE CLUBES (estilo B, 28/09) ───────────────
// Diego escolheu o ESTILO B (selo redondo com o bicho/símbolo da torcida) com o
// NOME VERDADEIRO do clube: *"quero estilo B dos escudos mas nome do time
// verdadeiro.. Flamengo, Real Madrid e etc"*.
//
// A chave é o `clubCanon` do clube (o mesmo que agrupa os pacotes). Cada linha:
//   nome — o nome INTEIRO, sem abreviar (regra dele, 28/09: "Man United" vira
//          "Manchester United"; "América" sozinho parecia o América-RJ);
//   c1/c2 — as cores do clube (anel e faixas);
//   ic    — o bicho/símbolo que a torcida usa. ⚠️ NÃO INVENTAR: onde não existe
//           um símbolo conhecido de todo mundo, fica a ⚽ neutra;
//   ano   — fundação, só quando é dado conhecido (sem ano = sem ano).
// Clube que não está aqui cai no escudo genérico do jogo (`Escudo`).
// Um desenho de verdade do bicho (arquivo leve, igual batismo) é a etapa 2.
export type Selo = { nome: string; c1: string; c2: string; ic: string; ano?: number }

export const SELOS: Record<string, Selo> = {
  // 🇧🇷
  'Flamengo': { nome: 'Flamengo', c1: '#C8102E', c2: '#111111', ic: '🐦‍⬛', ano: 1895 },
  'Palmeiras': { nome: 'Palmeiras', c1: '#006437', c2: '#FFFFFF', ic: '🐷', ano: 1914 },
  'Corinthians': { nome: 'Corinthians', c1: '#111111', c2: '#FFFFFF', ic: '⚔️', ano: 1910 },
  'São Paulo': { nome: 'São Paulo', c1: '#E4002B', c2: '#111111', ic: '😇', ano: 1930 },
  'Santos': { nome: 'Santos', c1: '#111111', c2: '#FFFFFF', ic: '🐟', ano: 1912 },
  'Vasco': { nome: 'Vasco da Gama', c1: '#111111', c2: '#FFFFFF', ic: '⛵', ano: 1898 },
  'Fluminense': { nome: 'Fluminense', c1: '#7A1F3D', c2: '#00613C', ic: '🎩', ano: 1902 },
  'Botafogo': { nome: 'Botafogo', c1: '#111111', c2: '#FFFFFF', ic: '⭐', ano: 1904 },
  'Grêmio': { nome: 'Grêmio', c1: '#0D80BF', c2: '#111111', ic: '⚔️', ano: 1903 },
  'Internacional': { nome: 'Internacional', c1: '#E4002B', c2: '#FFFFFF', ic: '⚽', ano: 1909 },
  'Atlético-MG': { nome: 'Atlético Mineiro', c1: '#111111', c2: '#FFFFFF', ic: '🐓', ano: 1908 },
  'Cruzeiro': { nome: 'Cruzeiro', c1: '#0033A0', c2: '#FFFFFF', ic: '🦊', ano: 1921 },
  'América-MG': { nome: 'América Mineiro', c1: '#00843D', c2: '#111111', ic: '🐰', ano: 1912 },
  'Bahia': { nome: 'Bahia', c1: '#0053A0', c2: '#E4002B', ic: '🦸', ano: 1931 },
  'Vitória': { nome: 'Vitória', c1: '#E4002B', c2: '#111111', ic: '🦁', ano: 1899 },
  'Sport': { nome: 'Sport Recife', c1: '#E4002B', c2: '#111111', ic: '🦁', ano: 1905 },
  'Santa Cruz': { nome: 'Santa Cruz', c1: '#111111', c2: '#E4002B', ic: '🐍', ano: 1914 },
  'Náutico': { nome: 'Náutico', c1: '#E4002B', c2: '#FFFFFF', ic: '⚽', ano: 1901 },
  'Ceará': { nome: 'Ceará', c1: '#111111', c2: '#FFFFFF', ic: '👴', ano: 1914 },
  'Fortaleza': { nome: 'Fortaleza', c1: '#0033A0', c2: '#E4002B', ic: '🦁', ano: 1918 },
  'Athletico-PR': { nome: 'Athletico Paranaense', c1: '#C8102E', c2: '#111111', ic: '🌪️', ano: 1924 },
  'Coritiba': { nome: 'Coritiba', c1: '#00543C', c2: '#FFFFFF', ic: '⚽', ano: 1909 },
  'Goiás': { nome: 'Goiás', c1: '#00843D', c2: '#FFFFFF', ic: '🦜', ano: 1943 },
  'Chapecoense': { nome: 'Chapecoense', c1: '#00843D', c2: '#FFFFFF', ic: '⚽', ano: 1973 },
  'Guarani': { nome: 'Guarani', c1: '#00843D', c2: '#FFFFFF', ic: '⚽', ano: 1911 },
  'Ponte Preta': { nome: 'Ponte Preta', c1: '#111111', c2: '#FFFFFF', ic: '🐒', ano: 1900 },
  'Bragantino': { nome: 'Red Bull Bragantino', c1: '#FFFFFF', c2: '#D6001C', ic: '🐂', ano: 1928 },
  'Bangu': { nome: 'Bangu', c1: '#E4002B', c2: '#FFFFFF', ic: '⚽', ano: 1904 },
  'São Caetano': { nome: 'São Caetano', c1: '#0033A0', c2: '#FFFFFF', ic: '⚽', ano: 1989 },
  // 🇪🇸
  'Real Madrid': { nome: 'Real Madrid', c1: '#FFFFFF', c2: '#5B2C83', ic: '👑', ano: 1902 },
  'Barcelona': { nome: 'Barcelona', c1: '#A50044', c2: '#004D98', ic: '⚽', ano: 1899 },
  'Atlético de Madrid': { nome: 'Atlético de Madrid', c1: '#CB3524', c2: '#FFFFFF', ic: '🐻', ano: 1903 },
  'Sevilla': { nome: 'Sevilla', c1: '#FFFFFF', c2: '#D71920', ic: '⚽', ano: 1890 },
  'Valencia': { nome: 'Valencia', c1: '#FFFFFF', c2: '#111111', ic: '🦇', ano: 1919 },
  'Villarreal': { nome: 'Villarreal', c1: '#FFE667', c2: '#005187', ic: '⚽', ano: 1923 },
  'Real Betis': { nome: 'Real Betis', c1: '#00954C', c2: '#FFFFFF', ic: '⚽', ano: 1907 },
  'Real Sociedad': { nome: 'Real Sociedad', c1: '#0067B1', c2: '#FFFFFF', ic: '⚽', ano: 1909 },
  'Espanyol': { nome: 'Espanyol', c1: '#007FC8', c2: '#FFFFFF', ic: '🦜', ano: 1900 },
  'Granada': { nome: 'Granada', c1: '#C8102E', c2: '#FFFFFF', ic: '⚽', ano: 1931 },
  // 🏴󠁧󠁢󠁥󠁮󠁧󠁿
  'Man United': { nome: 'Manchester United', c1: '#DA291C', c2: '#111111', ic: '😈', ano: 1878 },
  'Man City': { nome: 'Manchester City', c1: '#6CABDD', c2: '#1C2C5B', ic: '⚽', ano: 1880 },
  'Liverpool': { nome: 'Liverpool', c1: '#C8102E', c2: '#F6EB61', ic: '🐦', ano: 1892 },
  'Chelsea': { nome: 'Chelsea', c1: '#034694', c2: '#FFFFFF', ic: '🦁', ano: 1905 },
  'Arsenal': { nome: 'Arsenal', c1: '#EF0107', c2: '#FFFFFF', ic: '⚽', ano: 1886 },
  'Tottenham': { nome: 'Tottenham', c1: '#FFFFFF', c2: '#132257', ic: '🐓', ano: 1882 },
  'Newcastle': { nome: 'Newcastle', c1: '#111111', c2: '#FFFFFF', ic: '🐦‍⬛', ano: 1892 },
  'Aston Villa': { nome: 'Aston Villa', c1: '#670E36', c2: '#95BFE5', ic: '🦁', ano: 1874 },
  'Everton': { nome: 'Everton', c1: '#003399', c2: '#FFFFFF', ic: '⚽', ano: 1878 },
  'West Ham': { nome: 'West Ham', c1: '#7A263A', c2: '#1BB1E7', ic: '⚒️', ano: 1895 },
  'Leicester': { nome: 'Leicester City', c1: '#003090', c2: '#FDBE11', ic: '🦊', ano: 1884 },
  'Nottingham Forest': { nome: 'Nottingham Forest', c1: '#DD0000', c2: '#FFFFFF', ic: '🌳', ano: 1865 },
  'Blackburn': { nome: 'Blackburn Rovers', c1: '#009EE0', c2: '#FFFFFF', ic: '🌹', ano: 1875 },
  'Fulham': { nome: 'Fulham', c1: '#FFFFFF', c2: '#111111', ic: '⚽', ano: 1879 },
  'Wolves': { nome: 'Wolverhampton', c1: '#FDB913', c2: '#231F20', ic: '🐺', ano: 1877 },
  'Stoke City': { nome: 'Stoke City', c1: '#E03A3E', c2: '#FFFFFF', ic: '⚽', ano: 1863 },
  // 🏴󠁧󠁢󠁳󠁣󠁴󠁿
  'Celtic': { nome: 'Celtic', c1: '#018749', c2: '#FFFFFF', ic: '🍀', ano: 1887 },
  'Rangers': { nome: 'Rangers', c1: '#1B458F', c2: '#FFFFFF', ic: '🦁', ano: 1872 },
  // 🇮🇹
  'Milan': { nome: 'Milan', c1: '#FB090B', c2: '#111111', ic: '😈', ano: 1899 },
  'Inter': { nome: 'Inter de Milão', c1: '#0068A8', c2: '#111111', ic: '🐍', ano: 1908 },
  'Juventus': { nome: 'Juventus', c1: '#111111', c2: '#FFFFFF', ic: '🦓', ano: 1897 },
  'Roma': { nome: 'Roma', c1: '#8E1F2F', c2: '#F0BC42', ic: '🐺', ano: 1927 },
  'Lazio': { nome: 'Lazio', c1: '#87D8F7', c2: '#FFFFFF', ic: '🦅', ano: 1900 },
  'Napoli': { nome: 'Napoli', c1: '#12A0D7', c2: '#FFFFFF', ic: '🫏', ano: 1926 },
  'Fiorentina': { nome: 'Fiorentina', c1: '#5B2B82', c2: '#FFFFFF', ic: '⚜️', ano: 1926 },
  'Parma': { nome: 'Parma', c1: '#FFD200', c2: '#1B3A8C', ic: '⚽', ano: 1913 },
  // 🇩🇪
  'Bayern': { nome: 'Bayern de Munique', c1: '#DC052D', c2: '#FFFFFF', ic: '⚽', ano: 1900 },
  'Dortmund': { nome: 'Borussia Dortmund', c1: '#FDE100', c2: '#111111', ic: '🐝', ano: 1909 },
  'Leverkusen': { nome: 'Bayer Leverkusen', c1: '#E32221', c2: '#111111', ic: '⚽', ano: 1904 },
  'Schalke': { nome: 'Schalke 04', c1: '#004D9D', c2: '#FFFFFF', ic: '⛏️', ano: 1904 },
  'Werder Bremen': { nome: 'Werder Bremen', c1: '#1D9053', c2: '#FFFFFF', ic: '⚽', ano: 1899 },
  // 🇫🇷
  'PSG': { nome: 'Paris Saint-Germain', c1: '#004170', c2: '#DA291C', ic: '🗼', ano: 1970 },
  'Marseille': { nome: 'Olympique de Marseille', c1: '#2FAEE0', c2: '#FFFFFF', ic: '⚽', ano: 1899 },
  'Lyon': { nome: 'Olympique Lyonnais', c1: '#FFFFFF', c2: '#1B3C8C', ic: '🦁', ano: 1950 },
  'Monaco': { nome: 'Monaco', c1: '#E7182D', c2: '#FFFFFF', ic: '⚽', ano: 1924 },
  'Lille': { nome: 'Lille', c1: '#E01E13', c2: '#20325F', ic: '🐕', ano: 1944 },
  // 🇵🇹 🇳🇱 🇧🇪 🇬🇷 🇹🇷 🇭🇷 🇷🇺
  'Porto': { nome: 'Porto', c1: '#003893', c2: '#FFFFFF', ic: '🐉', ano: 1893 },
  'Benfica': { nome: 'Benfica', c1: '#E4002B', c2: '#FFFFFF', ic: '🦅', ano: 1904 },
  'Sporting': { nome: 'Sporting', c1: '#008057', c2: '#FFFFFF', ic: '🦁', ano: 1906 },
  'Ajax': { nome: 'Ajax', c1: '#D2122E', c2: '#FFFFFF', ic: '⚽', ano: 1900 },
  'PSV': { nome: 'PSV Eindhoven', c1: '#ED1C24', c2: '#FFFFFF', ic: '⚽', ano: 1913 },
  'Standard Liège': { nome: 'Standard Liège', c1: '#D5001C', c2: '#FFFFFF', ic: '⚽', ano: 1898 },
  'Oostende': { nome: 'Oostende', c1: '#E4002B', c2: '#FFFFFF', ic: '⚽' },
  'Olympiacos': { nome: 'Olympiacos', c1: '#E4002B', c2: '#FFFFFF', ic: '⚽', ano: 1925 },
  'Fenerbahçe': { nome: 'Fenerbahçe', c1: '#FFED00', c2: '#163962', ic: '🐤', ano: 1907 },
  'Dinamo Zagreb': { nome: 'Dinamo Zagreb', c1: '#0033A0', c2: '#FFFFFF', ic: '⚽', ano: 1945 },
  'Spartak Moscou': { nome: 'Spartak Moscou', c1: '#E4002B', c2: '#FFFFFF', ic: '⚽', ano: 1922 },
  'Dínamo de Moscou': { nome: 'Dínamo de Moscou', c1: '#0033A0', c2: '#FFFFFF', ic: '⚽', ano: 1923 },
  // 🌎 América do Sul
  'Boca Juniors': { nome: 'Boca Juniors', c1: '#003F8A', c2: '#FDB913', ic: '⚽', ano: 1905 },
  'River Plate': { nome: 'River Plate', c1: '#FFFFFF', c2: '#E4002B', ic: '⚽', ano: 1901 },
  'Vélez Sarsfield': { nome: 'Vélez Sarsfield', c1: '#FFFFFF', c2: '#0033A0', ic: '⚽', ano: 1910 },
  'Atlético Nacional': { nome: 'Atlético Nacional', c1: '#00843D', c2: '#FFFFFF', ic: '⚽', ano: 1947 },
  'América de Cali': { nome: 'América de Cali', c1: '#E4002B', c2: '#FFFFFF', ic: '😈', ano: 1927 },
  'LDU Quito': { nome: 'LDU Quito', c1: '#FFFFFF', c2: '#1B3A8C', ic: '⚽', ano: 1930 },
  'Barcelona SC': { nome: 'Barcelona de Guayaquil', c1: '#FFD100', c2: '#111111', ic: '⚽', ano: 1925 },
  'Alianza Lima': { nome: 'Alianza Lima', c1: '#002B7F', c2: '#FFFFFF', ic: '⚽', ano: 1901 },
  'Sporting Cristal': { nome: 'Sporting Cristal', c1: '#65B3E4', c2: '#FFFFFF', ic: '⚽', ano: 1955 },
  'U. de Chile': { nome: 'Universidad de Chile', c1: '#0033A0', c2: '#E4002B', ic: '🦉', ano: 1927 },
  // 🌎 México e EUA
  'América do México': { nome: 'América do México', c1: '#FFD200', c2: '#0033A0', ic: '🦅', ano: 1916 },
  'Chivas': { nome: 'Chivas Guadalajara', c1: '#E4002B', c2: '#FFFFFF', ic: '🐐', ano: 1906 },
  'Cruz Azul': { nome: 'Cruz Azul', c1: '#0033A0', c2: '#FFFFFF', ic: '⚽', ano: 1927 },
  'Pumas': { nome: 'Pumas UNAM', c1: '#0B2240', c2: '#C5A45A', ic: '🐆', ano: 1954 },
  'Tigres': { nome: 'Tigres UANL', c1: '#FDB913', c2: '#003087', ic: '🐯', ano: 1960 },
  'Toluca': { nome: 'Toluca', c1: '#E4002B', c2: '#FFFFFF', ic: '😈', ano: 1917 },
  'Necaxa': { nome: 'Necaxa', c1: '#E4002B', c2: '#FFFFFF', ic: '⚡', ano: 1923 },
  'Orlando City': { nome: 'Orlando City', c1: '#633492', c2: '#FFFFFF', ic: '🦁', ano: 2010 },
  'MetroStars': { nome: 'MetroStars', c1: '#E4002B', c2: '#111111', ic: '⚽', ano: 1995 },
  // 🌍 Ásia e África
  'Al-Hilal': { nome: 'Al-Hilal', c1: '#1B5EAB', c2: '#FFFFFF', ic: '🌙', ano: 1957 },
  'Al-Nassr': { nome: 'Al-Nassr', c1: '#FFDD00', c2: '#1B3A8C', ic: '⚽', ano: 1955 },
  // 🌍 Lote 38 (29/09): clubes do Mundo que viraram pacote (o escudo oficial ganha deste selo)
  'Al-Ittihad': { nome: 'Al-Ittihad', c1: '#FFD700', c2: '#0C0C0C', ic: '🐅', ano: 1927 },
  'Al-Ahli': { nome: 'Al-Ahli', c1: '#0B7A3E', c2: '#FFFFFF', ic: '🌴', ano: 1937 },
  'Inter Miami': { nome: 'Inter Miami', c1: '#F7B5CD', c2: '#231F20', ic: '🦩', ano: 2018 },
  'LA Galaxy': { nome: 'LA Galaxy', c1: '#00245D', c2: '#FFD200', ic: '⭐', ano: 1994 },
  'Toronto': { nome: 'Toronto FC', c1: '#B81137', c2: '#FFFFFF', ic: '⚽', ano: 2006 },
  'Vissel Kobe': { nome: 'Vissel Kobe', c1: '#A50034', c2: '#FFFFFF', ic: '⚓', ano: 1966 },
  'Kashima Antlers': { nome: 'Kashima Antlers', c1: '#B71C1C', c2: '#0C0C0C', ic: '🦌', ano: 1947 },
  'Guangzhou': { nome: 'Guangzhou', c1: '#D7141A', c2: '#FFD700', ic: '🐯', ano: 1954 },
  'New York Cosmos': { nome: 'New York Cosmos', c1: '#0B6E4F', c2: '#FFFFFF', ic: '⭐', ano: 1970 }, // 🗽 Lote 39 — escudo oficial só em assets.football-logos.cc (rede bloqueada)
  'Al Ahly': { nome: 'Al Ahly', c1: '#C8102E', c2: '#FFFFFF', ic: '🦅', ano: 1907 },
  'TP Mazembe': { nome: 'TP Mazembe', c1: '#111111', c2: '#FFFFFF', ic: '🐦‍⬛', ano: 1939 },
  'Pohang Steelers': { nome: 'Pohang Steelers', c1: '#E4002B', c2: '#111111', ic: '⚽', ano: 1973 },
  'Suwon': { nome: 'Suwon Bluewings', c1: '#0033A0', c2: '#E4002B', ic: '⚽', ano: 1995 },
  'Yokohama F. Marinos': { nome: 'Yokohama F. Marinos', c1: '#0033A0', c2: '#FFFFFF', ic: '⚓', ano: 1972 },
}

/** seleções não entram no Leilão de Clubes (são país, não clube) */
export const NAO_E_CLUBE = new Set(['Cabo Verde', 'Equador'])

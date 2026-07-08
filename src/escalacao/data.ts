import type { Card, Fame, Sector } from './types'

// ─── O catálogo de cartas ────────────────────────────────────────────
// fama 5 = lenda eterna (faixa estreita e altíssima)
// fama 4 = craque · fama 3 = bom de bola
// fama 2 = quase lenda: faixa LARGA — "o Obina tem dias"
// fama 1 = incógnita (gerada por partida; algumas escondem joias)

type C = { name: string; club: string; year: number; fame: Fame; lo: number; hi: number }

const GOL: C[] = [
  { name: 'Gilmar', club: 'Santos', year: 1962, fame: 5, lo: 93, hi: 97 },
  { name: 'Taffarel', club: 'Seleção', year: 1994, fame: 4, lo: 88, hi: 93 },
  { name: 'Rogério Ceni', club: 'São Paulo', year: 2005, fame: 4, lo: 87, hi: 93 },
  { name: 'Marcos', club: 'Palmeiras', year: 1999, fame: 4, lo: 86, hi: 92 },
  { name: 'Dida', club: 'Corinthians', year: 1998, fame: 3, lo: 80, hi: 88 },
  { name: 'Fábio', club: 'Cruzeiro', year: 2013, fame: 3, lo: 77, hi: 85 },
  { name: 'Jefferson', club: 'Botafogo', year: 2013, fame: 3, lo: 76, hi: 84 },
  { name: 'Zetti', club: 'São Paulo', year: 1993, fame: 3, lo: 77, hi: 85 },
  { name: 'Carlos Germano', club: 'Vasco', year: 1997, fame: 3, lo: 74, hi: 83 },
  { name: 'Ronaldo Giovanelli', club: 'Corinthians', year: 1990, fame: 2, lo: 62, hi: 81 },
  { name: 'Velloso', club: 'Palmeiras', year: 1994, fame: 2, lo: 61, hi: 79 },
  { name: 'Harlei', club: 'Goiás', year: 2005, fame: 2, lo: 59, hi: 78 },
  { name: 'Sérgio', club: 'Palmeiras', year: 1993, fame: 2, lo: 60, hi: 78 },
  { name: 'Wagner Leite', club: 'Atlético-MG', year: 1995, fame: 2, lo: 57, hi: 76 },
  // ── ampliação ──
  { name: 'Emerson Leão', club: 'Palmeiras', year: 1974, fame: 4, lo: 87, hi: 93 },
  { name: 'Félix', club: 'Fluminense', year: 1970, fame: 3, lo: 80, hi: 87 },
  { name: 'Júlio César', club: 'Flamengo', year: 2003, fame: 4, lo: 84, hi: 92 },
  { name: 'Cássio', club: 'Corinthians', year: 2012, fame: 4, lo: 83, hi: 91 },
  { name: 'Weverton', club: 'Palmeiras', year: 2019, fame: 3, lo: 78, hi: 86 },
  { name: 'Victor', club: 'Atlético-MG', year: 2013, fame: 3, lo: 76, hi: 85 },
  { name: 'Danrlei', club: 'Grêmio', year: 1997, fame: 2, lo: 62, hi: 82 },
  { name: 'Aranha', club: 'Santos', year: 2011, fame: 2, lo: 60, hi: 80 },
]

const LAT: C[] = [
  { name: 'Carlos Alberto Torres', club: 'Santos', year: 1970, fame: 5, lo: 95, hi: 99 },
  { name: 'Nílton Santos', club: 'Botafogo', year: 1958, fame: 5, lo: 95, hi: 99 },
  { name: 'Cafu', club: 'São Paulo', year: 1993, fame: 5, lo: 93, hi: 98 },
  { name: 'Roberto Carlos', club: 'Palmeiras', year: 1995, fame: 5, lo: 93, hi: 98 },
  { name: 'Júnior', club: 'Flamengo', year: 1981, fame: 4, lo: 88, hi: 94 },
  { name: 'Leandro', club: 'Flamengo', year: 1983, fame: 4, lo: 88, hi: 94 },
  { name: 'Branco', club: 'Fluminense', year: 1984, fame: 3, lo: 79, hi: 88 },
  { name: 'Jorginho', club: 'Flamengo', year: 1989, fame: 3, lo: 80, hi: 88 },
  { name: 'Leonardo', club: 'São Paulo', year: 1992, fame: 3, lo: 80, hi: 88 },
  { name: 'Maicon', club: 'Cruzeiro', year: 2003, fame: 3, lo: 78, hi: 87 },
  { name: 'Belletti', club: 'São Paulo', year: 1998, fame: 3, lo: 76, hi: 85 },
  { name: 'Zé Maria', club: 'Corinthians', year: 1974, fame: 3, lo: 78, hi: 86 },
  { name: 'Cicinho', club: 'São Paulo', year: 2005, fame: 2, lo: 63, hi: 82 },
  { name: 'Athirson', club: 'Flamengo', year: 1999, fame: 2, lo: 61, hi: 81 },
  { name: 'Léo', club: 'Santos', year: 2002, fame: 2, lo: 62, hi: 80 },
  { name: 'Paulo Roberto', club: 'Grêmio', year: 1981, fame: 2, lo: 60, hi: 78 },
  { name: 'Gilberto', club: 'Flamengo', year: 2001, fame: 2, lo: 59, hi: 78 },
  // ── ampliação ──
  { name: 'Djalma Santos', club: 'Palmeiras', year: 1962, fame: 5, lo: 93, hi: 98 },
  { name: 'Nelinho', club: 'Cruzeiro', year: 1976, fame: 3, lo: 80, hi: 88 },
  { name: 'Josimar', club: 'Botafogo', year: 1986, fame: 3, lo: 78, hi: 86 },
  { name: 'Dani Alves', club: 'São Paulo', year: 2019, fame: 4, lo: 84, hi: 92 },
  { name: 'Marcelo', club: 'Fluminense', year: 2023, fame: 4, lo: 82, hi: 90 },
  { name: 'Marcos Rocha', club: 'Palmeiras', year: 2019, fame: 3, lo: 76, hi: 84 },
  { name: 'Fágner', club: 'Corinthians', year: 2017, fame: 2, lo: 68, hi: 82 },
  { name: 'Egídio', club: 'Cruzeiro', year: 2015, fame: 2, lo: 62, hi: 79 },
]

const ZAG: C[] = [
  { name: 'Domingos da Guia', club: 'Flamengo', year: 1944, fame: 5, lo: 93, hi: 98 },
  { name: 'Aldair', club: 'Flamengo', year: 1987, fame: 4, lo: 87, hi: 93 },
  { name: 'Lúcio', club: 'Internacional', year: 2000, fame: 4, lo: 86, hi: 92 },
  { name: 'Thiago Silva', club: 'Fluminense', year: 2008, fame: 4, lo: 87, hi: 93 },
  { name: 'Luís Pereira', club: 'Palmeiras', year: 1972, fame: 4, lo: 86, hi: 92 },
  { name: 'Mauro Ramos', club: 'Santos', year: 1962, fame: 4, lo: 86, hi: 92 },
  { name: 'Oscar', club: 'São Paulo', year: 1980, fame: 3, lo: 80, hi: 88 },
  { name: 'Ricardo Gomes', club: 'Fluminense', year: 1987, fame: 3, lo: 80, hi: 88 },
  { name: 'Antônio Carlos', club: 'Palmeiras', year: 1993, fame: 3, lo: 78, hi: 86 },
  { name: 'Juan', club: 'Flamengo', year: 2000, fame: 3, lo: 79, hi: 87 },
  { name: 'Edmílson', club: 'São Paulo', year: 2000, fame: 3, lo: 77, hi: 86 },
  { name: 'Mauro Galvão', club: 'Vasco', year: 1997, fame: 3, lo: 76, hi: 85 },
  { name: 'Júnior Baiano', club: 'Palmeiras', year: 1996, fame: 2, lo: 60, hi: 84 },
  { name: 'Chicão', club: 'Corinthians', year: 2009, fame: 2, lo: 61, hi: 82 },
  { name: 'Gamarra', club: 'Corinthians', year: 1998, fame: 3, lo: 79, hi: 87 },
  { name: 'Odvan', club: 'Vasco', year: 1997, fame: 2, lo: 58, hi: 79 },
  { name: 'Beto Bacamarte', club: 'Grêmio', year: 1996, fame: 2, lo: 57, hi: 77 },
  // ── ampliação ──
  { name: 'Hilderaldo Bellini', club: 'Vasco', year: 1958, fame: 4, lo: 85, hi: 91 },
  { name: 'Wilson Piazza', club: 'Cruzeiro', year: 1970, fame: 4, lo: 86, hi: 92 },
  { name: 'Brito', club: 'Vasco', year: 1970, fame: 3, lo: 80, hi: 87 },
  { name: 'Miranda', club: 'São Paulo', year: 2010, fame: 3, lo: 80, hi: 88 },
  { name: 'Dedé', club: 'Cruzeiro', year: 2014, fame: 3, lo: 78, hi: 87 },
  { name: 'David Luiz', club: 'Flamengo', year: 2021, fame: 3, lo: 76, hi: 87 },
  { name: 'Lugano', club: 'São Paulo', year: 2006, fame: 3, lo: 80, hi: 88 },
  { name: 'Gustavo Gómez', club: 'Palmeiras', year: 2021, fame: 3, lo: 78, hi: 86 },
  { name: 'Réver', club: 'Atlético-MG', year: 2013, fame: 2, lo: 70, hi: 82 },
]

const MEI: C[] = [
  { name: 'Zico', club: 'Flamengo', year: 1981, fame: 5, lo: 95, hi: 99 },
  { name: 'Didi', club: 'Botafogo', year: 1958, fame: 5, lo: 94, hi: 98 },
  { name: 'Rivelino', club: 'Corinthians', year: 1972, fame: 5, lo: 93, hi: 97 },
  { name: 'Sócrates', club: 'Corinthians', year: 1983, fame: 5, lo: 93, hi: 97 },
  { name: 'Ronaldinho Gaúcho', club: 'Grêmio', year: 1999, fame: 5, lo: 93, hi: 98 },
  { name: 'Ademir da Guia', club: 'Palmeiras', year: 1972, fame: 4, lo: 87, hi: 93 },
  { name: 'Falcão', club: 'Internacional', year: 1979, fame: 4, lo: 89, hi: 94 },
  { name: 'Gérson', club: 'Botafogo', year: 1970, fame: 4, lo: 89, hi: 95 },
  { name: 'Rivaldo', club: 'Palmeiras', year: 1996, fame: 4, lo: 89, hi: 95 },
  { name: 'Kaká', club: 'São Paulo', year: 2003, fame: 4, lo: 88, hi: 94 },
  { name: 'Raí', club: 'São Paulo', year: 1992, fame: 4, lo: 87, hi: 93 },
  { name: 'Cerezo', club: 'Atlético-MG', year: 1980, fame: 3, lo: 81, hi: 89 },
  { name: 'Dunga', club: 'Seleção', year: 1994, fame: 3, lo: 80, hi: 87 },
  { name: 'Juninho Pernambucano', club: 'Vasco', year: 1997, fame: 3, lo: 80, hi: 89 },
  { name: 'Zinho', club: 'Palmeiras', year: 1994, fame: 3, lo: 78, hi: 86 },
  { name: 'Alex', club: 'Cruzeiro', year: 2003, fame: 3, lo: 79, hi: 88 },
  { name: 'Mauro Silva', club: 'Seleção', year: 1994, fame: 3, lo: 79, hi: 86 },
  { name: 'Djalminha', club: 'Palmeiras', year: 1996, fame: 2, lo: 65, hi: 89 },
  { name: 'Marcelinho Carioca', club: 'Corinthians', year: 1995, fame: 2, lo: 64, hi: 86 },
  { name: 'Edílson', club: 'Corinthians', year: 1998, fame: 2, lo: 62, hi: 85 },
  { name: 'Petkovic', club: 'Fluminense', year: 2002, fame: 2, lo: 62, hi: 84 },
  { name: 'Dario Conca', club: 'Fluminense', year: 2010, fame: 2, lo: 63, hi: 82 },
  { name: 'Paulo Henrique Ganso', club: 'Santos', year: 2010, fame: 2, lo: 60, hi: 82 },
  { name: 'Felipe', club: 'Vasco', year: 2000, fame: 2, lo: 61, hi: 81 },
  { name: 'PC Caju', club: 'Botafogo', year: 1968, fame: 2, lo: 63, hi: 83 },
  { name: 'Ramires', club: 'Cruzeiro', year: 2008, fame: 2, lo: 60, hi: 79 },
  // ── ampliação (inclui estrangeiros que brilharam no Brasil) ──
  { name: 'Clodoaldo', club: 'Santos', year: 1970, fame: 4, lo: 85, hi: 92 },
  { name: 'Juninho Paulista', club: 'São Paulo', year: 2009, fame: 3, lo: 79, hi: 87 },
  { name: 'Zé Roberto', club: 'Palmeiras', year: 2010, fame: 3, lo: 82, hi: 89 },
  { name: 'Rincón', club: 'Corinthians', year: 1998, fame: 3, lo: 80, hi: 88 },
  { name: 'Arrascaeta', club: 'Cruzeiro', year: 2017, fame: 3, lo: 80, hi: 89 },
  { name: "D'Alessandro", club: 'Internacional', year: 2010, fame: 3, lo: 80, hi: 89 },
  { name: 'Mascherano', club: 'Corinthians', year: 2005, fame: 3, lo: 80, hi: 88 },
  { name: 'Renato Augusto', club: 'Corinthians', year: 2018, fame: 3, lo: 78, hi: 87 },
  { name: 'Diego', club: 'Flamengo', year: 2019, fame: 3, lo: 76, hi: 86 },
  { name: 'Everton Ribeiro', club: 'Flamengo', year: 2020, fame: 3, lo: 76, hi: 85 },
  { name: 'Montillo', club: 'Cruzeiro', year: 2012, fame: 2, lo: 70, hi: 86 },
  { name: 'Valdivia', club: 'Palmeiras', year: 2013, fame: 2, lo: 66, hi: 88 },
  { name: 'Marcos Assunção', club: 'Palmeiras', year: 2005, fame: 2, lo: 68, hi: 86 },
  { name: 'Vampeta', club: 'Corinthians', year: 1999, fame: 2, lo: 62, hi: 82 },
  { name: 'Marcelinho Paraíba', club: 'Corinthians', year: 2002, fame: 2, lo: 62, hi: 83 },
]

const ATA: C[] = [
  { name: 'Pelé', club: 'Santos', year: 1962, fame: 5, lo: 97, hi: 99 },
  { name: 'Garrincha', club: 'Botafogo', year: 1958, fame: 5, lo: 95, hi: 99 },
  { name: 'Romário', club: 'Vasco', year: 2000, fame: 5, lo: 94, hi: 98 },
  { name: 'Ronaldo', club: 'Cruzeiro', year: 1993, fame: 5, lo: 94, hi: 99 },
  { name: 'Neymar', club: 'Santos', year: 2011, fame: 5, lo: 93, hi: 98 },
  { name: 'Tostão', club: 'Cruzeiro', year: 1970, fame: 4, lo: 89, hi: 95 },
  { name: 'Jairzinho', club: 'Botafogo', year: 1970, fame: 4, lo: 89, hi: 95 },
  { name: 'Bebeto', club: 'Vasco', year: 1989, fame: 4, lo: 87, hi: 93 },
  { name: 'Careca', club: 'São Paulo', year: 1986, fame: 4, lo: 86, hi: 92 },
  { name: 'Reinaldo', club: 'Atlético-MG', year: 1977, fame: 4, lo: 87, hi: 93 },
  { name: 'Robinho', club: 'Santos', year: 2002, fame: 4, lo: 85, hi: 92 },
  { name: 'Adriano', club: 'Flamengo', year: 2009, fame: 3, lo: 76, hi: 92 },
  { name: 'Edmundo', club: 'Palmeiras', year: 1993, fame: 3, lo: 78, hi: 90 },
  { name: 'Evair', club: 'Palmeiras', year: 1993, fame: 3, lo: 79, hi: 87 },
  { name: 'Amoroso', club: 'Guarani', year: 1994, fame: 3, lo: 78, hi: 88 },
  { name: 'Müller', club: 'São Paulo', year: 1991, fame: 3, lo: 79, hi: 87 },
  { name: 'Serginho Chulapa', club: 'São Paulo', year: 1982, fame: 3, lo: 78, hi: 87 },
  { name: 'Fred', club: 'Fluminense', year: 2012, fame: 3, lo: 79, hi: 88 },
  { name: 'Washington', club: 'Atlético-PR', year: 2004, fame: 3, lo: 76, hi: 86 },
  { name: 'Casagrande', club: 'Corinthians', year: 1982, fame: 3, lo: 77, hi: 86 },
  { name: 'Túlio Maravilha', club: 'Botafogo', year: 1995, fame: 2, lo: 60, hi: 88 },
  { name: 'Viola', club: 'Corinthians', year: 1990, fame: 2, lo: 60, hi: 83 },
  { name: 'Obina', club: 'Flamengo', year: 2005, fame: 2, lo: 55, hi: 82 },
  { name: 'Loco Abreu', club: 'Botafogo', year: 2010, fame: 2, lo: 58, hi: 84 },
  { name: 'Dadá Maravilha', club: 'Atlético-MG', year: 1971, fame: 2, lo: 60, hi: 84 },
  { name: 'Dodô', club: 'São Paulo', year: 1997, fame: 2, lo: 61, hi: 82 },
  { name: 'Baltazar', club: 'Grêmio', year: 1988, fame: 2, lo: 59, hi: 80 },
  { name: 'Kléber Gladiador', club: 'Palmeiras', year: 2010, fame: 2, lo: 57, hi: 79 },
  // ── ampliação: históricos, estrangeiros no Brasil e cults/cômicos ──
  { name: 'Zizinho', club: 'Flamengo', year: 1950, fame: 5, lo: 92, hi: 97 },
  { name: 'Leônidas da Silva', club: 'Flamengo', year: 1938, fame: 5, lo: 92, hi: 97 },
  { name: 'Ademir de Menezes', club: 'Vasco', year: 1950, fame: 4, lo: 88, hi: 94 },
  { name: 'Vavá', club: 'Vasco', year: 1958, fame: 4, lo: 86, hi: 93 },
  { name: 'Roberto Dinamite', club: 'Vasco', year: 1980, fame: 4, lo: 86, hi: 93 },
  { name: 'Nunes', club: 'Flamengo', year: 1981, fame: 3, lo: 76, hi: 85 },
  { name: 'Renato Gaúcho', club: 'Grêmio', year: 1987, fame: 3, lo: 80, hi: 88 },
  { name: 'Hulk', club: 'Atlético-MG', year: 2021, fame: 4, lo: 84, hi: 91 },
  { name: 'Luís Fabiano', club: 'São Paulo', year: 2011, fame: 3, lo: 80, hi: 88 },
  { name: 'Grafite', club: 'São Paulo', year: 2008, fame: 3, lo: 78, hi: 86 },
  { name: 'Gabigol', club: 'Flamengo', year: 2019, fame: 3, lo: 78, hi: 88 },
  { name: 'Pedro', club: 'Flamengo', year: 2022, fame: 3, lo: 78, hi: 87 },
  { name: 'Guerrero', club: 'Corinthians', year: 2013, fame: 3, lo: 80, hi: 88 },
  { name: 'Germán Cano', club: 'Fluminense', year: 2022, fame: 3, lo: 78, hi: 87 },
  { name: 'Asprilla', club: 'Palmeiras', year: 2001, fame: 2, lo: 68, hi: 88 },
  { name: 'Barcos', club: 'Palmeiras', year: 2012, fame: 2, lo: 70, hi: 84 },
  { name: 'Miguel Borja', club: 'Palmeiras', year: 2017, fame: 2, lo: 66, hi: 83 },
  { name: 'Diego Tardelli', club: 'Atlético-MG', year: 2014, fame: 2, lo: 70, hi: 84 },
  { name: 'Emerson Sheik', club: 'Corinthians', year: 2012, fame: 2, lo: 65, hi: 83 },
  { name: 'Deyverson', club: 'Palmeiras', year: 2018, fame: 2, lo: 55, hi: 83 },
  { name: 'Somália', club: 'Botafogo', year: 2016, fame: 2, lo: 55, hi: 78 },
]

export const CATALOG: Record<Sector, C[]> = { GOL, LAT, ZAG, MEI, ATA }

// ─── Vexames folclóricos: jogadores REAIS, famosos por serem ruins ou
// por um vexame específico — não incógnitas inventadas. Mostra clube e
// ano igual às lendas. Alguns clube/ano são aproximados (não tenho 100%
// de certeza de todos); o resto da lista (fama 2, "cult/zoeira") já
// cobre os folclóricos mais conhecidos, então aqui é só o time B.
const FOLKLORE_DUDS: { name: string; club: string; year: number; pos: Sector }[] = [
  { name: 'Deivid', club: 'Flamengo', year: 2012, pos: 'ATA' },
  { name: 'Adriano Gol Contra', club: 'Portuguesa', year: 2010, pos: 'ATA' },
  { name: 'Val Baiano', club: 'Bahia', year: 2008, pos: 'MEI' },
  { name: 'Perdigão', club: 'Goiás', year: 2007, pos: 'MEI' },
  { name: 'Robson Bambu', club: 'Vasco', year: 2015, pos: 'ZAG' },
  { name: 'Judivan', club: 'Flamengo', year: 2011, pos: 'ZAG' },
  { name: 'Elicarlos', club: 'Flamengo', year: 2011, pos: 'ZAG' },
  { name: 'Walter Minhoca', club: 'Bangu', year: 2009, pos: 'LAT' },
  { name: 'Sousa Caveirão', club: 'Olaria', year: 2006, pos: 'GOL' },
]

// ─── Incógnitas: geradas por partida, só como reforço quando o time B
// de cima acaba (salas grandes precisam de muita gente pra preencher).
// Algumas escondem joias.
const INC_FIRST = ['Valdir', 'Josimar', 'Cleiton', 'Ednaldo', 'Wanderson', 'Gonçalves', 'Íris', 'Baltemar', 'Osmarino', 'Delei', 'Nivaldo', 'Juraci', 'Aloísio', 'Ademilson', 'Zé Roberto', 'Toninho', 'Gersinho', 'Maurício', 'Índio', 'Fumagalli']
const INC_NICK = ['da Ilha', 'Perna Torta', 'Bola Sete', 'do Sertão', 'Trovoada', 'Canela Fina', 'Pé de Ferro', 'Maestro', 'Furacão', 'da Baixada', 'Gaúcho', 'Paraíba', 'Matuto', 'Serrano', 'do Brejo', 'Cigano', 'Foguete', 'Peixe Frito', 'da Várzea', 'Bicudo']
const INC_CLUBS = ['Operário', 'Treze', 'Caldense', 'Ypiranga', 'Ferroviário', 'Uberlândia', 'Anapolina', 'Itabaiana', 'River-PI', 'Sergipe', 'Central-PE', 'Mixto', 'Rio Branco', 'Olaria', 'Bangu', 'Portuguesa', 'Inter de Limeira', 'União São João', 'Tuna Luso', 'XV de Piracicaba']

export function makeIncognita(pos: Sector, idx: number, gem: boolean, rng: () => number, dudIdx = idx): Card {
  const dudPool = FOLKLORE_DUDS.filter(d => d.pos === pos)
  const lo = gem ? 72 + Math.floor(rng() * 6) : 46 + Math.floor(rng() * 12)
  const width = 12 + Math.floor(rng() * 7)
  const hi = Math.min(93, lo + width)
  if (dudIdx < dudPool.length) {
    const d = dudPool[dudIdx]
    return { id: `inc-${pos}-${idx}`, name: d.name, club: d.club, year: d.year, pos, fame: 1, lo, hi }
  }
  const name = `${INC_FIRST[Math.floor(rng() * INC_FIRST.length)]} ${INC_NICK[Math.floor(rng() * INC_NICK.length)]}`
  const club = INC_CLUBS[Math.floor(rng() * INC_CLUBS.length)]
  const year = 1968 + Math.floor(rng() * 40)
  return { id: `inc-${pos}-${idx}`, name, club, year, pos, fame: 1, lo, hi }
}

// ─── Nomes de técnicos CPU e times ───────────────────────────────────
export const CPU_MANAGERS = [
  { name: 'Tonhão', team: 'Tonhão FC' },
  { name: 'PC Magrão', team: 'Magrão EC' },
  { name: 'Biriba', team: 'Biriba United' },
  { name: 'Dona Cida', team: 'Cida Futebol' },
  { name: 'Serjão', team: 'Serjão SAF' },
  { name: 'Marcão Pelado', team: 'Pelado FR' },
  { name: 'Régis da Vila', team: 'Vila Régis' },
  { name: 'Neguinho do Apito', team: 'Apito Final' },
  { name: 'Zé do Caixote', team: 'Caixote EC' },
  { name: 'Dedé Bigode', team: 'Bigode FC' },
  { name: 'Adãozinho', team: 'Adão Esporte' },
  { name: 'Cabeção da Vila', team: 'Cabeção FR' },
  { name: 'Duda Fortuna', team: 'Fortuna SAF' },
  { name: 'Miúdo do Gol', team: 'Miúdo EC' },
  { name: 'Painitto', team: 'Painitto FC' },
  { name: 'Robertão', team: 'Robertão United' },
  { name: 'Sinhozinho', team: 'Sinhô Futebol' },
  { name: 'Tico do Bar', team: 'Tico do Bar FR' },
  { name: 'Xandão da Bola', team: 'Xandão EC' },
  { name: 'Zequinha Ferro', team: 'Zequinha SAF' },
  { name: 'Waguinho Pipa', team: 'Pipa FC' },
]

// ─── Clubes clássicos que completam a liga de 20 ─────────────────────
export const CLASSIC_CLUBS: { name: string; atk: number; def: number }[] = [
  { name: 'Ferroviária do Vale', atk: 78, def: 76 },
  { name: 'Athletico do Porto', atk: 76, def: 78 },
  { name: 'Nacional da Serra', atk: 75, def: 73 },
  { name: 'Esporte do Cerrado', atk: 73, def: 75 },
  { name: 'União da Baixada', atk: 72, def: 71 },
  { name: 'Marítimo do Recôncavo', atk: 70, def: 72 },
  { name: 'Guarani do Agreste', atk: 70, def: 68 },
  { name: 'Comercial das Gerais', atk: 68, def: 70 },
  { name: 'Ipiranga da Fronteira', atk: 67, def: 66 },
  { name: 'Estrela do Pantanal', atk: 65, def: 67 },
  { name: 'Operário das Docas', atk: 64, def: 65 },
  { name: 'Botafogo da Colônia', atk: 63, def: 62 },
  { name: 'Fluminense de Caicó', atk: 61, def: 63 },
  { name: 'Atlético Seringueiro', atk: 60, def: 60 },
  { name: 'Real Tabuleiro', atk: 58, def: 59 },
  { name: 'Íbis da Mata', atk: 55, def: 54 },
]

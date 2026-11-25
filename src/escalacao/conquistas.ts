// 🏅 LEILÃO DE CONQUISTAS (25/11, ideia aprovada pelo Diego no mockup `scripts/mockups/leilao-conquistas-v2.png`)
//
// É a 4ª variante do Leilão de Clubes (Clubes · Seleções · Por década · Conquistas): o MESMO motor de pacote, a MESMA
// convocação. Só muda o que vai dentro do pacote — em vez de "o meio do Palmeiras", "os meias que ganharam a Bola de Ouro".
// Regras fechadas com ele:
//  · o pacote mostra só o TEMA e quantos vêm dentro: sem cor e sem categoria (*"é surpresa"*);
//  · os nomes são SORTEADOS a cada leilão dentro da lista do tema (nunca vêm todos, nunca os mesmos);
//  · tamanho = as vagas da posição na formação + 1 (igual ao Clubes);
//  · no martelo as cartas aparecem pra sala toda; depois, a convocação de sempre;
//  · tem tema de lenda, de meio-termo e de resenha, pra ter briga, intermediário e sobra barata;
//  · 👑 as cartas da Kings League podem cair aqui (pedido dele, 25/11) — sorteadas como as outras.
//
// ⚠️ TUDO É FATO (regra do Diego: nada inventado). Cada tema vem de UMA destas fontes:
//  1. lista pública e fechada (Bola de Ouro, elencos campeões da Copa do Mundo, campeões da Libertadores/Champions por ano);
//  2. o que o próprio baralho já diz da carta (clube árabe/americano/asiático, flag `folk`, flag `promessa`, baralho de origem);
//  3. tema subjetivo ("voltou acima do peso") NÃO entra — não tem lista e mexe com gente real.
// Quem mexer: tema novo = fonte nova anotada aqui + `npm run conquistas` verde.
// Módulo PURO (sem React): a trava `scripts/testa-conquistas.mts` carrega direto.
import { CATALOG, CATALOG_EU, CATALOG_WORLD } from './data'
import { BARALHO_KINGS } from './kings-baralho'
import { paisDaCarta } from './liga-draft'
import { MESMO_JOGADOR } from './paises'
import type { Sector } from './types'

export type CartaTema = { name: string; club: string; year: number; fame: number; lo: number; hi: number; folk?: boolean; promessa?: boolean; bio?: string }
export type GrupoTema = 'lenda' | 'mista' | 'meio' | 'comica'
export type TemaConquista = { id: string; emoji: string; pt: string; en: string; grupo: GrupoTema }

const SETORES: Sector[] = ['GOL', 'LAT', 'ZAG', 'MEI', 'ATA']

// ── 1. LISTAS PÚBLICAS (por PESSOA: cada linha é uma pessoa; os nomes são como estão no baralho) ─────────────────────────
// 🥇 Bola de Ouro (France Football, 1956–2025). Fora de propósito: Luis Suárez Miramontes (1960) — o "Luis Suárez" do
// baralho é o uruguaio, outra pessoa. Quem ainda não tem carta no jogo simplesmente não aparece.
const BOLA_DE_OURO: string[][] = [
  ['Alfredo Di Stéfano'], ['Raymond Kopa'], ['Lev Yashin'], ['Denis Law'], ['Eusébio'], ['Bobby Charlton'], ['George Best'],
  ['Gianni Rivera'], ['Gerd Müller'], ['Johan Cruyff'], ['Franz Beckenbauer'], ['Oleg Blokhin'], ['Allan Simonsen'],
  ['Kevin Keegan'], ['Rummenigge'], ['Paolo Rossi'], ['Michel Platini'], ['Ruud Gullit'], ['Marco van Basten'],
  ['Lothar Matthäus'], ['Jean-Pierre Papin'], ['Roberto Baggio'], ['Hristo Stoichkov'], ['George Weah'], ['Matthias Sammer'],
  ['Ronaldo', 'Ronaldo Fenômeno'], ['Zinedine Zidane'], ['Rivaldo'], ['Luís Figo'], ['Michael Owen'], ['Pavel Nedvěd'],
  ['Andriy Shevchenko'], ['Ronaldinho Gaúcho'], ['Fabio Cannavaro'], ['Kaká'], ['Cristiano Ronaldo'], ['Lionel Messi'],
  ['Luka Modrić'], ['Karim Benzema'], ['Rodri'], ['Ousmane Dembélé'],
]
// 🏆 Campeões do Mundo (elencos campeões — pt.wikipedia, página de cada Copa). Por PAÍS, pra nome igual de outra
// nacionalidade nunca entrar (o Jorginho da Itália não é o do tetra; o Pedro do Flamengo não é o da Espanha).
const CAMPEOES_DO_MUNDO: Record<string, string[][]> = {
  Brasil: [
    // 1958 / 1962
    ['Pelé'], ['Garrincha'], ['Didi'], ['Vavá'], ['Zagallo'], ['Nílton Santos'], ['Djalma Santos'], ['Gilmar'], ['Hilderaldo Bellini'],
    ['Zito'], ['Amarildo'], ['Mazzola'], ['Pepe'], ['Coutinho'], ['Castilho'], ['Mauro Ramos'],
    // 1970
    ['Tostão'], ['Jairzinho'], ['Rivelino'], ['Gérson Canhotinha de Ouro'], ['Carlos Alberto Torres'], ['Clodoaldo'], ['Félix'],
    ['Everaldo'], ['Wilson Piazza'], ['Emerson Leão'], ['Dadá Maravilha'], ['Zé Maria'],
    // 1994
    ['Romário'], ['Bebeto'], ['Taffarel', 'Cláudio Taffarel'], ['Dunga'], ['Mauro Silva'], ['Jorginho'], ['Branco'], ['Leonardo'],
    ['Aldair'], ['Márcio Santos'], ['Zinho'], ['Mazinho'], ['Raí'], ['Cafu'], ['Viola'], ['Müller'], ['Ricardo Rocha'],
    ['Ronaldão'], ['Zetti'], ['Gilmar Rinaldi'], ['Ronaldo', 'Ronaldo Fenômeno'],
    // 2002
    ['Marcos'], ['Lúcio'], ['Roque Júnior'], ['Edmílson'], ['Roberto Carlos'], ['Gilberto Silva'], ['Kléberson'], ['Ronaldinho Gaúcho'],
    ['Rivaldo'], ['Denílson'], ['Juninho Paulista'], ['Kaká'], ['Luizão'], ['Edílson'], ['Vampeta'], ['Belletti'], ['Anderson Polga'],
    ['Ricardinho'], ['Júnior'], ['Dida'], ['Rogério Ceni'],
  ],
  Argentina: [
    ['Mario Kempes'], ['Daniel Passarella'], ['Ubaldo Fillol'], // 1978
    ['Diego Maradona'], ['Jorge Valdano'], ['Jorge Burruchaga'], ['Oscar Ruggeri'], ['Nery Pumpido'], // 1986
    ['Lionel Messi'], ['Ángel Di María'], ['Julián Álvarez'], ['Emiliano “Dibu” Martínez'], ['Rodrigo De Paul'], ['Enzo Fernández'], // 2022
    ['Alexis Mac Allister'], ['Nicolás Otamendi'], ['Cristian Romero'], ['Nahuel Molina'], ['Nicolás Tagliafico'], ['Lautaro Martínez'],
    ['Leandro Paredes'], ['Marcos Acuña'], ['Gonzalo Montiel'], ['Paulo Dybala'], ['Lisandro Martínez'], ['Thiago Almada'],
    ['Exequiel Palacios'], ['Franco Armani'],
  ],
  França: [
    ['Zinedine Zidane'], ['Thierry Henry'], ['Lilian Thuram'], ['Deschamps'], ['Fabien Barthez'], ['Marcel Desailly'], ['Laurent Blanc'], // 1998
    ['Bixente Lizarazu'], ['Petit'], ['Youri Djorkaeff'], ['David Trezeguet'], ['Patrick Vieira'],
    ['Kylian Mbappé'], ['Antoine Griezmann'], ['Paul Pogba'], ["N'Golo Kanté"], ['Hugo Lloris'], ['Raphaël Varane'], ['Samuel Umtiti'], // 2018
    ['Benjamin Pavard'], ['Olivier Giroud'], ['Ousmane Dembélé'],
  ],
  Alemanha: [
    ['Franz Beckenbauer'], ['Gerd Müller'], ['Sepp Maier'], ['Paul Breitner'], // 1974
    ['Lothar Matthäus'], ['Jürgen Klinsmann'], ['Rudi Völler'], ['Andreas Brehme'], ['Jürgen Kohler'], ['Pierre Littbarski'], // 1990
    ['Manuel Neuer'], ['Philipp Lahm'], ['Jérôme Boateng'], ['Mats Hummels'], ['Bastian Schweinsteiger'], ['Toni Kroos'], // 2014
    ['Thomas Müller'], ['Mesut Özil'], ['Miroslav Klose'], ['Mario Götze'], ['André Schürrle'], ['Per Mertesacker'], ['Sami Khedira'], ['Lukas Podolski'],
  ],
  Itália: [
    ['Paolo Rossi'], ['Dino Zoff'], ['Claudio Gentile'], ['Gaetano Scirea'], ['Marco Tardelli'], ['Giancarlo Antognoni'], ['Antonio Cabrini'], // 1982
    ['Gianluigi Buffon'], ['Fabio Cannavaro'], ['Andrea Pirlo'], ['Francesco Totti'], ['Alessandro Del Piero'], ['Gennaro Gattuso'], // 2006
    ['Marco Materazzi'], ['Gianluca Zambrotta'], ['Alessandro Nesta'], ['Luca Toni'], ['Filippo Inzaghi'], ['Fábio Grosso'], ['De Rossi'],
    ['Mauro Camoranesi'], ['Alberto Gilardino'],
  ],
  Espanha: [
    ['Iker Casillas'], ['Carles Puyol'], ['Gerard Piqué'], ['Sergio Ramos'], ['Capdevila'], ['Xavi'], ['Andrés Iniesta'], ['Sergio Busquets'], // 2010
    ['Xabi Alonso'], ['David Villa'], ['Fernando Torres'], ['Cesc Fàbregas'], ['David Silva'], ['Jesús Navas'], ['Fernando Llorente'],
    ['Juan Mata'], ['Pepe Reina'], ['Albiol'], ['Arbeloa'],
  ],
  Inglaterra: [['Bobby Charlton'], ['Bobby Moore'], ['Geoff Hurst'], ['Gordon Banks'], ['Jack Charlton']], // 1966
  Uruguai: [['Juan Alberto Schiaffino'], ['Alcides Ghiggia'], ['Obdulio Varela']], // 1950
}
// 🌎 Libertadores e ⭐ Champions: o clube da carta CAMPEÃO NO ANO DA CARTA (a carta é o jogador naquele clube naquele ano).
// Fonte: listas de campeões da CONMEBOL e da UEFA. Ano = ano da final.
const LIBERTADORES: Record<number, string> = {
  1960: 'Peñarol', 1961: 'Peñarol', 1962: 'Santos', 1963: 'Santos', 1964: 'Independiente', 1965: 'Independiente', 1966: 'Peñarol',
  1967: 'Racing', 1968: 'Estudiantes', 1969: 'Estudiantes', 1970: 'Estudiantes', 1971: 'Nacional-URU', 1972: 'Independiente',
  1973: 'Independiente', 1974: 'Independiente', 1975: 'Independiente', 1976: 'Cruzeiro', 1977: 'Boca Juniors', 1978: 'Boca Juniors',
  1979: 'Olimpia', 1980: 'Nacional-URU', 1981: 'Flamengo', 1982: 'Peñarol', 1983: 'Grêmio', 1984: 'Independiente',
  1985: 'Argentinos Juniors', 1986: 'River Plate', 1987: 'Peñarol', 1988: 'Nacional-URU', 1989: 'Atlético Nacional', 1990: 'Olimpia',
  1991: 'Colo-Colo', 1992: 'São Paulo', 1993: 'São Paulo', 1994: 'Vélez Sarsfield', 1995: 'Grêmio', 1996: 'River Plate', 1997: 'Cruzeiro',
  1998: 'Vasco', 1999: 'Palmeiras', 2000: 'Boca Juniors', 2001: 'Boca Juniors', 2002: 'Olimpia', 2003: 'Boca Juniors', 2004: 'Once Caldas',
  2005: 'São Paulo', 2006: 'Internacional', 2007: 'Boca Juniors', 2008: 'LDU Quito', 2009: 'Estudiantes', 2010: 'Internacional',
  2011: 'Santos', 2012: 'Corinthians', 2013: 'Atlético-MG', 2014: 'San Lorenzo', 2015: 'River Plate', 2016: 'Atlético Nacional',
  2017: 'Grêmio', 2018: 'River Plate', 2019: 'Flamengo', 2020: 'Palmeiras', 2021: 'Palmeiras', 2022: 'Flamengo', 2023: 'Fluminense',
  2024: 'Botafogo', 2025: 'Flamengo',
}
const CHAMPIONS: Record<number, string> = {
  1956: 'Real Madrid', 1957: 'Real Madrid', 1958: 'Real Madrid', 1959: 'Real Madrid', 1960: 'Real Madrid', 1961: 'Benfica', 1962: 'Benfica',
  1963: 'Milan', 1964: 'Inter', 1965: 'Inter', 1966: 'Real Madrid', 1967: 'Celtic', 1968: 'Man United', 1969: 'Milan', 1970: 'Feyenoord',
  1971: 'Ajax', 1972: 'Ajax', 1973: 'Ajax', 1974: 'Bayern', 1975: 'Bayern', 1976: 'Bayern', 1977: 'Liverpool', 1978: 'Liverpool',
  1979: 'Nottingham Forest', 1980: 'Nottingham Forest', 1981: 'Liverpool', 1982: 'Aston Villa', 1983: 'Hamburg', 1984: 'Liverpool',
  1985: 'Juventus', 1986: 'Steaua Bucareste', 1987: 'Porto', 1988: 'PSV', 1989: 'Milan', 1990: 'Milan', 1991: 'Estrela Vermelha',
  1992: 'Barcelona', 1993: 'Marseille', 1994: 'Milan', 1995: 'Ajax', 1996: 'Juventus', 1997: 'Dortmund', 1998: 'Real Madrid',
  1999: 'Man United', 2000: 'Real Madrid', 2001: 'Bayern', 2002: 'Real Madrid', 2003: 'Milan', 2004: 'Porto', 2005: 'Liverpool',
  2006: 'Barcelona', 2007: 'Milan', 2008: 'Man United', 2009: 'Barcelona', 2010: 'Inter', 2011: 'Barcelona', 2012: 'Chelsea',
  2013: 'Bayern', 2014: 'Real Madrid', 2015: 'Barcelona', 2016: 'Real Madrid', 2017: 'Real Madrid', 2018: 'Real Madrid',
  2019: 'Liverpool', 2020: 'Bayern', 2021: 'Chelsea', 2022: 'Real Madrid', 2023: 'Man City', 2024: 'Real Madrid', 2025: 'PSG',
}
// 🇧🇷 Campeão Brasileiro (CBF, Série A desde 1971; 1987 = Sport, o reconhecido pela CBF). Clube campeão NO ANO DA CARTA.
const BRASILEIRAO: Record<number, string> = {
  1971: 'Atlético-MG', 1972: 'Palmeiras', 1973: 'Palmeiras', 1974: 'Vasco', 1975: 'Internacional', 1976: 'Internacional', 1977: 'São Paulo',
  1978: 'Guarani', 1979: 'Internacional', 1980: 'Flamengo', 1981: 'Grêmio', 1982: 'Flamengo', 1983: 'Flamengo', 1984: 'Fluminense',
  1985: 'Coritiba', 1986: 'São Paulo', 1987: 'Sport', 1988: 'Bahia', 1989: 'Vasco', 1990: 'Corinthians', 1991: 'São Paulo', 1992: 'Flamengo',
  1993: 'Palmeiras', 1994: 'Palmeiras', 1995: 'Botafogo', 1996: 'Grêmio', 1997: 'Vasco', 1998: 'Corinthians', 1999: 'Corinthians',
  2000: 'Vasco', 2001: 'Athletico-PR', 2002: 'Santos', 2003: 'Cruzeiro', 2004: 'Santos', 2005: 'Corinthians', 2006: 'São Paulo',
  2007: 'São Paulo', 2008: 'São Paulo', 2009: 'Flamengo', 2010: 'Fluminense', 2011: 'Corinthians', 2012: 'Fluminense', 2013: 'Cruzeiro',
  2014: 'Cruzeiro', 2015: 'Corinthians', 2016: 'Palmeiras', 2017: 'Corinthians', 2018: 'Palmeiras', 2019: 'Flamengo', 2020: 'Flamengo',
  2021: 'Atlético-MG', 2022: 'Palmeiras', 2023: 'Palmeiras', 2024: 'Botafogo', 2025: 'Flamengo',
}
/** pessoa de lista por país; `clubes` restringe quando o nome tem xará no mesmo país (o Paulinho do Corinthians não é o da Olimpíada) */
type Pessoa = string | { n: string; clubes: string[] }
// 🏅 Ouro olímpico (elencos campeões, pt.wikipedia): Brasil 2016 e 2020 · Argentina 2004 e 2008 · Nigéria 1996 · Camarões 2000
const OURO_OLIMPICO: Record<string, Pessoa[]> = {
  Brasil: ['Neymar', 'Gabriel Jesus', 'Gabigol', 'Marquinhos', 'Renato Augusto', 'Luan', 'Weverton', 'Rodrigo Caio', 'Douglas Santos', 'Zeca',
    'Thiago Maia', 'Felipe Anderson', 'Rafinha Alcântara', // 2016
    'Dani Alves', 'Richarlison', 'Matheus Cunha', 'Antony', 'Bruno Guimarães', 'Douglas Luiz', 'Claudinho', { n: 'Paulinho', clubes: ['Atlético-MG'] },
    'Malcom', 'Diego Carlos', 'Nino', 'Guilherme Arana', 'Reinier'], // 2020
  Argentina: ['Tevez', 'Mascherano', 'Javier Mascherano', 'Gabriel Heinze', 'Roberto Ayala', "D'Alessandro", 'Kily González', 'Lucho González', 'Fabricio Coloccini', // 2004
    'Lionel Messi', 'Juan Román Riquelme', 'Sergio Agüero', 'Ángel Di María', 'Ezequiel Lavezzi', 'Fernando Gago', 'Pablo Zabaleta', 'Ezequiel Garay',
    'Sergio Romero', 'Ever Banega', 'Éver Banega'], // 2008
  Nigéria: ['Nwankwo Kanu', 'Jay-Jay Okocha', 'Taribo West'],
  Camarões: ["Samuel Eto'o", 'Patrick Mboma', 'Lauren', 'Geremi'],
}
// 👟 Artilheiro de Copa do Mundo (o maior goleador de cada Copa, empates juntos — FIFA)
const ARTILHEIRO_COPA: Record<string, Pessoa[]> = {
  Brasil: ['Leônidas da Silva', 'Ademir de Menezes', 'Garrincha', 'Vavá', 'Ronaldo', 'Ronaldo Fenômeno'],
  Hungria: ['Sándor Kocsis'], França: ['Just Fontaine', 'Kylian Mbappé'], Portugal: ['Eusébio'], Alemanha: ['Gerd Müller', 'Miroslav Klose', 'Thomas Müller'],
  Polônia: ['Grzegorz Lato'], Argentina: ['Mario Kempes'], Itália: ['Paolo Rossi', 'Totò Schillaci'], Inglaterra: ['Gary Lineker', 'Harry Kane'],
  Bulgária: ['Hristo Stoichkov'], Rússia: ['Oleg Salenko'], Croácia: ['Davor Šuker'], Holanda: ['Wesley Sneijder'], Uruguai: ['Diego Forlán'],
  Espanha: ['David Villa'], Colômbia: ['James Rodríguez'],
}
// 👨‍👦 parentes de craque: o próprio nome da carta já diz ("irmão do Kaká", "filho do Bebeto") + filhos famosos de lenda
const PARENTES = new Set(['Enzo Zidane', 'Luca Zidane', 'Jordi Cruyff', 'Khéphren Thuram', 'Marcus Thuram', 'Timothy Weah'])
const PARENTE_NO_NOME = /\((irmão|irmã|filho|filha|primo|prima|pai|tio|sobrinho|neto) d[oa] / // minúsculo de propósito: "Euller (Filho do Vento)" é apelido, não parente
// 📺 Virou comentarista de TV (trabalho público e conhecido: Globo/Band/SporTV no Brasil, BBC/Sky/TNT/CBS/beIN lá fora)
const COMENTARISTA: Record<string, Pessoa[]> = {
  Brasil: ['Casagrande', 'Denílson', 'Denílson Show', 'Júnior Maestro', 'Roger Flores', 'Edmundo', 'Caio Ribeiro', 'Grafite'],
  Sérvia: ['Petkovic'], Inglaterra: ['Gary Lineker', 'Gary Neville', 'Jamie Carragher', 'Rio Ferdinand', 'Alan Shearer', 'Ian Wright', 'Peter Crouch'],
  França: ['Thierry Henry'], Irlanda: ['Roy Keane'], Holanda: ['Seedorf', 'Clarence Seedorf'], Argentina: ['Jorge Valdano'], Escócia: ['Graeme Souness'],
}
// 🥊 Saiu no braço: agressão/briga famosa em campo, registrada na imprensa (Cantona no torcedor em 1995, a cabeçada de 2006,
// Keane × Haaland, Pepe × Casquero, as mordidas do Suárez, Gattuso × Joe Jordan…). Só caso público — nada de "parece briguento".
const BRIGA: Record<string, Pessoa[]> = {
  França: ['Éric Cantona', 'Zinedine Zidane'], Itália: ['Marco Materazzi', 'Gennaro Gattuso'], Brasil: ['Edmundo', 'Felipe Melo'],
  Irlanda: ['Roy Keane'], Uruguai: ['Paolo Montero', 'Luis Suárez'], Portugal: ['Pepe'], Espanha: ['Diego Costa'],
}
// 🗳️ Virou político: presidente, senador, deputado ou ministro (Weah presidente da Libéria, Romário senador, Bebeto e Jardel
// deputados estaduais, Danrlei deputado federal, Pelé ministro do Esporte, Zico secretário nacional de Esportes)
const POLITICO: Record<string, Pessoa[]> = {
  Libéria: ['George Weah'], Brasil: ['Romário', 'Bebeto', 'Danrlei', 'Jardel', 'Mário Jardel', 'Pelé', 'Zico'],
}
// 🥅 Goleiro artilheiro: goleiro que fez gol de verdade (Ceni, Chilavert, Higuita, e o Jorge Campos que jogou até de atacante)
const GOLEIRO_GOL: Record<string, Pessoa[]> = { Brasil: ['Rogério Ceni'], Paraguai: ['José Luis Chilavert'], Colômbia: ['René Higuita'], México: ['Jorge Campos'] }
// 🏴 o país da LIGA do clube da carta (Inglaterra = futebol inglês; o País de Gales do Swansea joga lá)
const LIGA_INGLESA = new Set(['Liverpool', 'Man United', 'Manchester United', 'Arsenal', 'Chelsea', 'Man City', 'Tottenham', 'Newcastle', 'Everton', 'Aston Villa', 'West Ham', 'Leicester', 'Leicester City', 'Wolves', 'Nottingham Forest', 'Fulham', 'Leeds', 'Leeds United', 'Blackburn', 'Southampton', 'Crystal Palace', 'Brighton', 'Sunderland', 'Middlesbrough', 'Brentford', 'Swansea', 'Derby County', 'Bournemouth', 'Birmingham', 'Wigan', 'Watford', 'Sheffield Wednesday', 'Portsmouth', 'Burnley', 'Bolton'])
const LIGA_ESPANHOLA = new Set(['Real Madrid', 'Barcelona', 'Atlético de Madrid', 'Sevilla', 'Valencia', 'Villarreal', 'Real Betis', 'Deportivo La Coruña', 'Real Sociedad', 'Athletic Bilbao', 'Espanyol', 'Celta', 'Celta de Vigo', 'Mallorca', 'Granada', 'Girona', 'Logroñés'])
const LIGA_ITALIANA = new Set(['Milan', 'Inter', 'Juventus', 'Roma', 'Napoli', 'Lazio', 'Fiorentina', 'Parma', 'Atalanta', 'Udinese', 'Torino', 'Sampdoria', 'Verona', 'Palermo', 'Padova', 'Perugia', 'Genoa', 'Como', 'Chievo', 'Cagliari', 'Bologna'])
const LIGA_ALEMA = new Set(['Bayern', 'Dortmund', 'Leverkusen', 'Bayer Leverkusen', 'Schalke', 'RB Leipzig', 'Werder Bremen', 'Wolfsburg', 'Stuttgart', 'Mönchengladbach', 'Borussia Mönchengladbach', 'Köln', 'Colônia', 'Kaiserslautern', 'Hamburg', 'Freiburg', 'Eintracht Frankfurt', 'Hertha Berlin', 'Hannover', 'Augsburg', 'Rot-Weiss Essen'])
const AFRICA = new Set(['Senegal', 'Camarões', 'Costa do Marfim', 'Gana', 'Marrocos', 'Argélia', 'Nigéria', 'Egito', 'Mali', 'África do Sul', 'Congo', 'RD Congo', 'Angola', 'Zimbábue', 'Togo', 'Libéria', 'Guiné', 'Gabão', 'Cabo Verde', 'Tunísia'])

// o mesmo clube com outro nome no baralho
const CLUBE_ALIAS: Record<string, string> = { 'Manchester United': 'Man United', 'Leicester City': 'Leicester', 'Bayer Leverkusen': 'Leverkusen', 'Celta de Vigo': 'Celta', 'Atlético-PR': 'Athletico-PR', 'Colônia': 'Köln', 'Borussia Mönchengladbach': 'Mönchengladbach', 'Dínamo Kyiv': 'Dynamo Kyiv', 'Leeds United': 'Leeds', 'RC Lens': 'Lens' }
const clube = (c: string) => CLUBE_ALIAS[c] ?? c

// ── 2. O QUE O BARALHO JÁ DIZ ───────────────────────────────────────────────────────────────────────────────────────────
const ARABIA = new Set(['Al-Hilal', 'Al-Nassr', 'Al-Ittihad', 'Al-Ahli', 'Al-Shabab']) // Saudi Pro League (o Al Ahly é do Egito: fora)
const EUA = new Set(['New York Cosmos', 'Inter Miami', 'LA Galaxy', 'Orlando City', 'MetroStars', 'DC United', 'New York Red Bulls', 'New York City', 'Real Salt Lake', 'LAFC', 'Columbus Crew', 'Colorado Rapids'])
const ASIA = new Set(['Kashima Antlers', 'Vissel Kobe', 'Guangzhou', 'Pohang Steelers', 'Yokohama F. Marinos', 'Suwon', 'Júbilo Iwata', 'Gamba Osaka', 'Shanghai SIPG', 'Nagoya Grampus', 'Kashiwa Reysol', 'Jeonbuk', 'Chunnam Dragons'])

export const TEMAS_CONQUISTA: TemaConquista[] = [
  { id: 'bola-ouro', emoji: '🥇', pt: 'Bola de Ouro', en: "Ballon d'Or", grupo: 'lenda' },
  { id: 'copa-mundo', emoji: '🏆', pt: 'Campeão do Mundo', en: 'World Cup winner', grupo: 'lenda' },
  { id: 'artilheiro-copa', emoji: '👟', pt: 'Artilheiro de Copa do Mundo', en: 'World Cup top scorer', grupo: 'lenda' },
  { id: 'brasileirao', emoji: '🇧🇷', pt: 'Campeão Brasileiro', en: 'Brazilian champion', grupo: 'mista' },
  { id: 'inglaterra', emoji: '🏴', pt: 'Jogou na Inglaterra', en: 'Played in England', grupo: 'mista' },
  { id: 'espanha', emoji: '🇪🇸', pt: 'Jogou na Espanha', en: 'Played in Spain', grupo: 'mista' },
  { id: 'italia', emoji: '🇮🇹', pt: 'Jogou na Itália', en: 'Played in Italy', grupo: 'mista' },
  { id: 'alemanha', emoji: '🇩🇪', pt: 'Jogou na Alemanha', en: 'Played in Germany', grupo: 'mista' },
  { id: 'hermanos', emoji: '🇦🇷', pt: 'Hermanos', en: 'Argentines', grupo: 'mista' },
  { id: 'garra-uruguaia', emoji: '🇺🇾', pt: 'Garra uruguaia', en: 'Uruguayan grit', grupo: 'mista' },
  { id: 'portugueses', emoji: '🇵🇹', pt: 'Portugueses', en: 'Portuguese', grupo: 'mista' },
  { id: 'africanos', emoji: '🌍', pt: 'Africanos', en: 'Africans', grupo: 'mista' },
  { id: 'anos-70', emoji: '📻', pt: 'Anos 70', en: 'The 70s', grupo: 'mista' },
  { id: 'anos-80', emoji: '📼', pt: 'Anos 80', en: 'The 80s', grupo: 'mista' },
  { id: 'anos-90', emoji: '💿', pt: 'Anos 90', en: 'The 90s', grupo: 'mista' },
  { id: 'anos-2000', emoji: '📱', pt: 'Anos 2000', en: 'The 2000s', grupo: 'mista' },
  { id: 'ouro-olimpico', emoji: '🏅', pt: 'Ouro olímpico', en: 'Olympic gold', grupo: 'meio' },
  { id: 'rodou', emoji: '🧳', pt: 'Rodou o mundo', en: 'Journeyman', grupo: 'meio' },
  { id: 'parentes', emoji: '👨‍👦', pt: 'Parente do craque', en: "Star's relative", grupo: 'comica' },
  { id: 'comentarista', emoji: '📺', pt: 'Virou comentarista', en: 'Became a pundit', grupo: 'meio' },
  { id: 'briga', emoji: '🥊', pt: 'Saiu no braço em campo', en: 'Threw hands on the pitch', grupo: 'comica' },
  { id: 'politico', emoji: '🗳️', pt: 'Virou político', en: 'Became a politician', grupo: 'comica' },
  { id: 'goleiro-artilheiro', emoji: '🥅', pt: 'Goleiro artilheiro', en: 'Goal-scoring keeper', grupo: 'comica' },
  { id: 'champions', emoji: '⭐', pt: 'Campeão da Champions', en: 'Champions League winner', grupo: 'mista' },
  { id: 'libertadores', emoji: '🌎', pt: 'Campeão da Libertadores', en: 'Libertadores winner', grupo: 'mista' },
  { id: 'brasileiro-europa', emoji: '✈️', pt: 'Brasileiro na Europa', en: 'Brazilian in Europe', grupo: 'mista' },
  { id: 'gringo-brasil', emoji: '🧉', pt: 'Gringo no Brasil', en: 'Foreigner in Brazil', grupo: 'mista' },
  { id: 'revelados', emoji: '💎', pt: 'Revelado que estourou', en: 'Breakout talent', grupo: 'meio' },
  { id: 'voltou', emoji: '🔙', pt: 'Voltou da Europa', en: 'Back from Europe', grupo: 'meio' },
  { id: 'asia', emoji: '🌏', pt: 'Foi jogar na Ásia', en: 'Went to Asia', grupo: 'meio' },
  { id: 'kings', emoji: '👑', pt: 'Jogou na Kings League', en: 'Played in the Kings League', grupo: 'meio' },
  { id: 'folcloricos', emoji: '😂', pt: 'Folclóricos', en: 'Cult heroes', grupo: 'comica' },
  { id: 'arabia', emoji: '🐪', pt: 'Foi pra Arábia', en: 'Went to Saudi Arabia', grupo: 'comica' },
  { id: 'eua', emoji: '🇺🇸', pt: 'Foi jogar nos EUA', en: 'Went to the USA', grupo: 'comica' },
]
export const temaConquista = (id: string | undefined) => TEMAS_CONQUISTA.find(t => t.id === id)

type Baralho = 'BR' | 'EU' | 'MU' | 'K'
type Item = { carta: CartaTema; pos: Sector; baralho: Baralho; pais: string }
let TODAS: Item[] | null = null
function todas(): Item[] {
  if (TODAS) return TODAS
  const out: Item[] = []
  const bar: [Baralho, Record<Sector, CartaTema[]>][] = [['BR', CATALOG as never], ['EU', CATALOG_EU as never], ['MU', CATALOG_WORLD as never], ['K', BARALHO_KINGS as never]]
  for (const [b, d] of bar) for (const pos of SETORES) for (const c of d[pos] ?? []) out.push({ carta: c, pos, baralho: b, pais: b === 'K' ? 'Brasil' : paisDaCarta(c) })
  return (TODAS = out)
}
/** pessoa por trás da carta: o mesmo nome só junta cartas quando o jogo JÁ conferiu que é a mesma pessoa (MESMO_JOGADOR) */
const PESSOA_ALIAS = new Map<string, string>()
for (const grupo of [...BOLA_DE_OURO, ...Object.values(CAMPEOES_DO_MUNDO).flat(), ['Mascherano', 'Javier Mascherano'], ['Ever Banega', 'Éver Banega'], ['Denílson', 'Denílson Show'], ['Seedorf', 'Clarence Seedorf'], ['Jardel', 'Mário Jardel']]) for (const n of grupo) PESSOA_ALIAS.set(n, grupo[0])
export const pessoaDe = (it: { carta: CartaTema; pais: string }) => {
  const n = PESSOA_ALIAS.get(it.carta.name) ?? it.carta.name
  return MESMO_JOGADOR.has(n) || PESSOA_ALIAS.has(it.carta.name) ? `${n}|${it.pais}` : `${it.carta.name}|${it.carta.club}|${it.carta.year}`
}

const nomesBola = new Set(BOLA_DE_OURO.flat())
const nomesCopa = new Map<string, Set<string>>(Object.entries(CAMPEOES_DO_MUNDO).map(([p, l]) => [p, new Set(l.flat())]))
/** cartas de um MESMO_JOGADOR que existem no baralho BR e no EU — a carta BR depois da europeia = voltou */
function voltouDaEuropa(it: Item): boolean {
  if (it.baralho !== 'BR' || it.pais !== 'Brasil' || !MESMO_JOGADOR.has(it.carta.name) || PESSOA_DUVIDOSA.has(it.carta.name)) return false
  return todas().some(o => o.baralho === 'EU' && o.carta.name === it.carta.name && o.pais === it.pais && o.carta.year < it.carta.year)
}

const naLista = (l: Record<string, Pessoa[]>, it: Item) => (l[it.pais] ?? []).some(p => typeof p === 'string' ? p === it.carta.name : p.n === it.carta.name && p.clubes.includes(it.carta.club))
/** clubes (de MESMO_JOGADOR) de cada pessoa — pra "rodou" (só junta cartas que o jogo já conferiu serem a mesma pessoa) */
let CLUBES_DA_PESSOA: Map<string, Set<string>> | null = null
function clubesDaPessoa(it: Item): Set<string> {
  if (!CLUBES_DA_PESSOA) {
    CLUBES_DA_PESSOA = new Map()
    for (const o of todas()) if (o.baralho !== 'K' && MESMO_JOGADOR.has(o.carta.name)) {
      const k = `${o.carta.name}|${o.pais}`
      ;(CLUBES_DA_PESSOA.get(k) ?? CLUBES_DA_PESSOA.set(k, new Set()).get(k)!).add(clube(o.carta.club))
    }
  }
  return CLUBES_DA_PESSOA.get(`${it.carta.name}|${it.pais}`) ?? new Set()
}
// ⚠️ nomes que o jogo junta como "mesma pessoa" mas são gente diferente (Danilo do Corinthians ≠ do Botafogo ≠ da Juventus;
// Júlio César do Corinthians ≠ o da Inter): ficam FORA de "rodou" e "voltou", que dependem de juntar as cartas da pessoa
const PESSOA_DUVIDOSA = new Set(['Danilo', 'Júlio César'])
const decada = (y: number, d: number) => y >= d && y < d + 10

function noTema(id: string, it: Item): boolean {
  const c = it.carta
  if (it.baralho === 'K') return id === 'kings'
  switch (id) {
    case 'bola-ouro': return nomesBola.has(c.name) && !(c.name === 'Ronaldo' && it.pais !== 'Brasil')
    case 'copa-mundo': return !!nomesCopa.get(it.pais)?.has(c.name)
    case 'libertadores': return clube(LIBERTADORES[c.year] ?? '') === clube(c.club)
    case 'champions': return clube(CHAMPIONS[c.year] ?? '') === clube(c.club)
    case 'brasileiro-europa': return it.baralho === 'EU' && it.pais === 'Brasil'
    case 'gringo-brasil': return it.baralho === 'BR' && it.pais !== 'Brasil' && it.pais !== '??'
    case 'revelados': return !!c.promessa
    case 'voltou': return voltouDaEuropa(it)
    case 'asia': return ASIA.has(c.club)
    case 'folcloricos': return !!c.folk
    case 'arabia': return ARABIA.has(c.club)
    case 'eua': return EUA.has(c.club)
    case 'artilheiro-copa': return naLista(ARTILHEIRO_COPA, it)
    case 'comentarista': return naLista(COMENTARISTA, it)
    case 'briga': return naLista(BRIGA, it)
    case 'politico': return naLista(POLITICO, it)
    case 'goleiro-artilheiro': return naLista(GOLEIRO_GOL, it)
    case 'ouro-olimpico': return naLista(OURO_OLIMPICO, it)
    case 'brasileirao': return clube(BRASILEIRAO[c.year] ?? '') === clube(c.club)
    case 'rodou': return !PESSOA_DUVIDOSA.has(c.name) && clubesDaPessoa(it).size >= 3
    case 'parentes': return PARENTES.has(c.name) || PARENTE_NO_NOME.test(c.name)
    case 'inglaterra': return LIGA_INGLESA.has(c.club)
    case 'espanha': return LIGA_ESPANHOLA.has(c.club)
    case 'italia': return LIGA_ITALIANA.has(c.club)
    case 'alemanha': return LIGA_ALEMA.has(c.club)
    case 'hermanos': return it.pais === 'Argentina'
    case 'garra-uruguaia': return it.pais === 'Uruguai'
    case 'portugueses': return it.pais === 'Portugal'
    case 'africanos': return AFRICA.has(it.pais)
    case 'anos-70': return decada(c.year, 1970)
    case 'anos-80': return decada(c.year, 1980)
    case 'anos-90': return decada(c.year, 1990)
    case 'anos-2000': return decada(c.year, 2000)
    default: return false
  }
}

const CACHE = new Map<string, Item[]>()
/** as cartas de um tema numa posição (com a pessoa repetida só uma vez é no SORTEIO, não aqui) */
export function cartasDoTema(id: string, pos: Sector): Item[] {
  const k = `${id}|${pos}`
  let l = CACHE.get(k)
  if (!l) { l = todas().filter(it => it.pos === pos && noTema(id, it)); CACHE.set(k, l) }
  return l
}

/** quantas PESSOAS diferentes o tema tem nessa posição (é isso que diz se fecha um pacote) */
export const pessoasNoTema = (id: string, pos: Sector) => new Set(cartasDoTema(id, pos).map(pessoaDe)).size

export type PacoteConquista = { tema: TemaConquista; cartas: CartaTema[] }

function embaralha<T>(a: T[], rng: () => number): T[] {
  const o = [...a]
  for (let i = o.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [o[i], o[j]] = [o[j], o[i]] }
  return o
}
// a vez de cada grupo: briga (lenda), meio-termo e resenha bem misturados — nunca 9 pacotes de lenda numa posição
const CICLO: GrupoTema[] = ['lenda', 'mista', 'comica', 'meio', 'mista', 'comica', 'lenda', 'meio', 'mista', 'comica', 'meio']

/**
 * Os pacotes de UMA posição. `tamanho` = vagas + 1 (o mínimo aceito é `minimo` = as vagas), `alvo` = quantos pacotes.
 * `usada(carta)` diz se a carta já saiu em outro pacote nesta partida. Mesma semente = mesmos pacotes (sala inteira igual).
 */
export function pacotesConquistas(pos: Sector, alvo: number, tamanho: number, minimo: number, rng: () => number, usada: (c: CartaTema) => boolean): PacoteConquista[] {
  // o que ainda está livre de cada tema, já embaralhado
  const livres = new Map<string, Item[]>()
  for (const t of TEMAS_CONQUISTA) livres.set(t.id, embaralha(cartasDoTema(t.id, pos).filter(it => !usada(it.carta)), rng))
  const pessoasUsadas = new Set<string>()
  const tira = (t: TemaConquista, n: number): CartaTema[] | null => {
    const l = livres.get(t.id)!
    const pega: Item[] = [], vistas = new Set<string>()
    for (const it of l) {
      const p = pessoaDe(it)
      if (pessoasUsadas.has(p) || vistas.has(p)) continue
      pega.push(it); vistas.add(p)
      if (pega.length >= n) break
    }
    return pega.length >= n ? pega.map(x => x.carta) : null
  }
  const out: PacoteConquista[] = []
  const usadosTema = new Map<string, number>()
  const guarda = (t: TemaConquista, cartas: CartaTema[]) => {
    out.push({ tema: t, cartas })
    for (const c of cartas) {
      const it = todas().find(x => x.carta === c)!
      pessoasUsadas.add(pessoaDe(it))
    }
    const keys = new Set(cartas)
    for (const [id, l] of livres) livres.set(id, l.filter(it => !keys.has(it.carta)))
    usadosTema.set(t.id, (usadosTema.get(t.id) ?? 0) + 1)
  }
  const porGrupo = (g: GrupoTema) => embaralha(TEMAS_CONQUISTA.filter(t => t.grupo === g), rng)
  // 1ª volta: um tema de cada vez, seguindo o CICLO, sem repetir tema; depois aceita repetir (com cartas diferentes)
  for (const repete of [false, true]) {
    for (let i = 0; out.length < alvo && i < alvo * 4; i++) {
      const g = CICLO[(out.length + i) % CICLO.length]
      const candidatos = [...porGrupo(g), ...embaralha(TEMAS_CONQUISTA.filter(t => t.grupo !== g), rng)]
        .filter(t => repete || !usadosTema.has(t.id))
        .sort((a, b) => (usadosTema.get(a.id) ?? 0) - (usadosTema.get(b.id) ?? 0))
      let feito = false
      for (const t of candidatos) {
        const cartas = tira(t, tamanho) ?? tira(t, minimo)
        if (cartas) { guarda(t, cartas); feito = true; break }
      }
      if (!feito) break
    }
    if (out.length >= alvo) break
  }
  return out
}

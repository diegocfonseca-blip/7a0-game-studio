// 📺 CAMPO 2D — O ESTILO DAS LENDAS (20/10). Diego: *"Ronaldinho, Neymar driblam muito, o Xavi gosta de dar passe, o Gattuso
// rouba bola"* e depois *"não precisa fazer dos 1.500, só das lendas… são menos de 200"*.
// Cada lenda tem UM estilo, o que ela é CONHECIDA por fazer (regra dele: não inventar como uma pessoa real é — na dúvida, fica
// 'normal'). Quem não está aqui (todo mundo que não é lenda) joga no estilo neutro da posição.
// O estilo só muda o TEATRO (quem conduz, quem passa, quem chuta, como o lance acontece) — NUNCA o resultado: os gols continuam
// sendo os do motor do jogo.
export type Estilo =
  | 'driblador' // conduz e passa pelo marcador
  | 'passador' // enfia, inverte, dá a assistência
  | 'finalizador' // aparece na área e finaliza de primeira
  | 'cabeceador' // gol e corte de cabeça
  | 'chutador' // chute de fora e bola parada
  | 'velocista' // arrancada no contra-ataque
  | 'desarmador' // rouba a bola
  | 'apoiador' // lateral que sobe e cruza
  | 'paredao' // goleiro de defesa difícil
  | 'goleiro_linha' // goleiro que sai jogando com os pés
  | 'normal'

const LISTA: [Estilo, string[]][] = [
  ['paredao', ['Gilmar', 'Taffarel', 'Marcos', 'Emerson Leão', 'Félix', 'Manga', 'Castilho', 'Lev Yashin', 'Gianluigi Buffon', 'Iker Casillas', 'Oliver Kahn', 'Dino Zoff', 'Peter Schmeichel', 'Petr Čech', 'Dida', 'Gordon Banks', 'Edwin van der Sar', 'Vozinha']],
  ['goleiro_linha', ['Rogério Ceni', 'Manuel Neuer', 'René Higuita', 'José Luis Chilavert']],
  ['apoiador', ['Carlos Alberto Torres', 'Nílton Santos', 'Júnior Maestro', 'Leandro', 'Arce', 'Cafu', 'Philipp Lahm', 'Dani Alves', 'Javier Zanetti', 'Marcelo', 'Ashley Cole']],
  ['chutador', ['Nelinho', 'Roberto Carlos', 'Ronald Koeman', 'Fernando Hierro', 'Zico', 'Rivelino', 'Marcelinho Carioca', 'Michel Platini', 'Rivaldo', 'Lothar Matthäus', 'Steven Gerrard', 'Frank Lampard', 'Juninho Pernambucano', 'Pavel Nedvěd', 'Bobby Charlton', 'Pepe', 'Ferenc Puskás', 'Eusébio', 'Gabriel Batistuta', 'Adriano Imperador', 'Wayne Rooney', 'Hristo Stoichkov']],
  ['desarmador', ['Paolo Maldini', 'Domingos da Guia', 'Luís Pereira', 'Mauro Galvão', 'Gamarra', 'Hilderaldo Bellini', 'Franco Baresi', 'Fabio Cannavaro', 'Alessandro Nesta', 'Thiago Silva', 'Carles Puyol', 'Rio Ferdinand', 'Lúcio', 'Lilian Thuram', 'Bobby Moore', 'Marquinhos', 'Cerezo', 'Dunga', 'Zito', 'Patrick Vieira', 'Roy Keane', 'Johan Neeskens']],
  ['cabeceador', ['Figueroa', 'Sergio Ramos', 'Nemanja Vidić', 'John Terry', 'Daniel Passarella', 'Michael Ballack', 'Ruud Gullit', 'Didier Drogba', 'Alan Shearer', 'Miroslav Klose', 'Alberto Spencer']],
  ['passador', ['Franz Beckenbauer', 'Didi', 'Sócrates', 'Ademir da Guia', 'Falcão', 'Gérson Canhotinha de Ouro', 'Alex', 'Xavi', 'Andrea Pirlo', 'Luka Modrić', 'Kevin De Bruyne', 'Paul Scholes', 'Toni Kroos', 'Francesco Totti', 'Clarence Seedorf', 'Sergio Busquets', 'Rodri', 'Gianni Rivera', 'Michael Laudrup', 'Fernando Redondo', 'David Beckham', 'Bastian Schweinsteiger', 'Giancarlo Antognoni', 'Juan Román Riquelme', 'Carlos Valderrama', 'Pedro Rocha', 'Zizinho', 'Dennis Bergkamp']],
  ['driblador', ['Zinedine Zidane', 'Ronaldinho Gaúcho', 'Andrés Iniesta', 'Luís Figo', 'Ryan Giggs', 'Diego Maradona', 'Ángel Di María', 'Garrincha', 'Neymar', 'Edmundo', 'Renato Gaúcho', 'Marta', 'Dirceu Lopes', 'Eden Hazard', 'Lionel Messi', 'Ronaldo Fenômeno', 'Johan Cruyff', 'Roberto Baggio', 'Arjen Robben', 'Franck Ribéry', 'Vinícius Júnior', 'Ousmane Dembélé', 'George Best']],
  ['velocista', ['Kaká', 'Jairzinho', 'Thierry Henry', 'George Weah', 'Kylian Mbappé', "Samuel Eto'o", 'Michael Owen']],
  ['finalizador', ['Raí', 'Kenny Dalglish', 'Éric Cantona', 'Evaristo de Macedo', 'Ademir de Menezes', 'Pelé', 'Romário', 'Tostão', 'Bebeto', 'Careca', 'Reinaldo', 'Leônidas da Silva', 'Roberto Dinamite', 'Coutinho', 'Kelvin Oliveira (K9)', 'Thomas Müller', 'Cristiano Ronaldo', 'Alfredo Di Stéfano', 'Marco van Basten', 'Gerd Müller', 'Andriy Shevchenko', 'Zlatan Ibrahimović', 'Robert Lewandowski', 'Erling Haaland', 'Raúl', 'Ruud van Nistelrooy', 'Alessandro Del Piero', 'Karim Benzema', 'Harry Kane', 'Luis Suárez', 'Robin van Persie', 'Paolo Rossi', 'Mario Kempes', 'Hugo Sánchez', 'Denis Law', 'Jean-Pierre Papin']],
]
// 🤷 conhecidos, mas sem UMA marca clara pra eu escolher sem chutar: ficam no neutro da posição
// (Djalma Santos, Zagallo — e quem mais aparecer como lenda nova sem estar nas listas acima)

const MAPA = new Map<string, Estilo>()
for (const [e, nomes] of LISTA) for (const n of nomes) MAPA.set(n, e)

/** estilo da carta: só lenda (fame 5) tem estilo próprio; o resto joga no neutro */
export function estiloDe(nome: string, fame?: number): Estilo {
  if ((fame ?? 0) < 5) return 'normal'
  return MAPA.get(nome) ?? 'normal'
}
export const LENDAS_COM_ESTILO = MAPA.size

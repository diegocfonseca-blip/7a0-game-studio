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

// ── 🎯 GOLPES: a jogada ASSINATURA de cada lenda (20/10). Diego: *"mano individuais únicos com as lendas, com base no que a
// lenda realmente é, sua habilidade e função"*. Só o que é FATO conhecido de cada um (regra dele: não inventar como uma pessoa
// real é) — quem não está aqui joga com os golpes gerais da posição. O motor sorteia entre os golpes da lenda quando ela
// conduz/finaliza; o resultado (gol ou não) continua sendo o do jogo.
export type Golpe =
  // dribles
  | 'elastico' | 'pedalada' | 'chapeu' | 'roleta' | 'cruyff' | 'caneta' | 'meia_lua' | 'slalom' | 'drible_goleiro' | 'arrancada' | 'corta_pra_dentro' | 'croqueta'
  // finalizações
  | 'colocado' | 'trivela' | 'folha_seca' | 'tres_dedos' | 'bomba' | 'cobertura' | 'cavadinha' | 'voleio' | 'bicicleta' | 'calcanhar' | 'cabecada' | 'de_bico' | 'de_primeira' | 'barriga'
  // passes e bola parada
  | 'passe_acucar' | 'lancamento' | 'passe_calcanhar' | 'cruzamento_curva' | 'falta_curva' | 'falta_bomba'
  // defesa e goleiro
  | 'carrinho' | 'bote' | 'corte_cabeca' | 'defesa_milagrosa' | 'saida_pes' | 'escorpiao'

const GOLPES_LISTA: [string, Golpe[]][] = [
  ['Ronaldinho Gaúcho', ['elastico', 'pedalada', 'chapeu', 'folha_seca']], ['Neymar', ['pedalada', 'chapeu', 'caneta']], ['Zinedine Zidane', ['roleta', 'voleio']],
  ['Diego Maradona', ['slalom', 'drible_goleiro', 'falta_curva']], ['Lionel Messi', ['slalom', 'colocado', 'cavadinha']], ['Garrincha', ['corta_pra_dentro', 'elastico']],
  ['Pelé', ['chapeu', 'cabecada', 'drible_goleiro']], ['Romário', ['cobertura', 'de_bico', 'chapeu']], ['Ronaldo Fenômeno', ['drible_goleiro', 'pedalada', 'arrancada']],
  ['Roberto Carlos', ['tres_dedos', 'bomba', 'falta_bomba']], ['Juninho Pernambucano', ['folha_seca', 'falta_curva']], ['Rivelino', ['elastico', 'bomba', 'falta_curva']],
  ['Zico', ['falta_curva', 'voleio', 'colocado']], ['David Beckham', ['cruzamento_curva', 'falta_curva']], ['Andrea Pirlo', ['lancamento', 'folha_seca']],
  ['Cristiano Ronaldo', ['cabecada', 'folha_seca', 'bicicleta']], ['Zlatan Ibrahimović', ['bicicleta', 'voleio', 'calcanhar']], ['Rivaldo', ['bicicleta', 'bomba', 'colocado']],
  ['Marco van Basten', ['voleio', 'de_primeira']], ['Ferenc Puskás', ['bomba', 'de_primeira']], ['Johan Cruyff', ['cruyff', 'passe_acucar']],
  ['Thierry Henry', ['colocado', 'arrancada']], ['Alessandro Del Piero', ['colocado', 'falta_curva']], ['Francesco Totti', ['cavadinha', 'passe_acucar', 'calcanhar']],
  ['Roberto Baggio', ['slalom', 'colocado']], ['Gabriel Batistuta', ['bomba', 'de_primeira']], ['Gerd Müller', ['de_primeira', 'barriga']],
  ['Miroslav Klose', ['cabecada', 'de_primeira']], ['Didier Drogba', ['cabecada', 'bomba']], ['Kaká', ['arrancada', 'colocado']],
  ['Arjen Robben', ['corta_pra_dentro', 'colocado']], ['Luís Figo', ['corta_pra_dentro', 'cruzamento_curva']], ['Ryan Giggs', ['arrancada', 'slalom']],
  ['Luka Modrić', ['trivela', 'passe_acucar']], ['Ángel Di María', ['colocado', 'cruzamento_curva']], ['Eden Hazard', ['slalom', 'croqueta']],
  ['Andrés Iniesta', ['croqueta', 'passe_acucar']], ['Xavi', ['passe_acucar', 'lancamento']], ['Juan Román Riquelme', ['passe_acucar', 'cavadinha']],
  ['Carlos Valderrama', ['passe_acucar']], ['Fernando Redondo', ['passe_calcanhar', 'passe_acucar']], ['Sócrates', ['calcanhar', 'passe_calcanhar']],
  ['Didi', ['folha_seca', 'lancamento']], ['Gérson Canhotinha de Ouro', ['lancamento', 'bomba']], ['Leônidas da Silva', ['bicicleta']],
  ['Renato Gaúcho', ['barriga', 'corta_pra_dentro']], ['Edmundo', ['slalom', 'bomba']], ['Marcelinho Carioca', ['falta_curva', 'colocado']],
  ['Nelinho', ['falta_bomba', 'tres_dedos']], ['Pepe', ['falta_bomba', 'bomba']], ['Alex', ['lancamento', 'colocado']],
  ['Jairzinho', ['arrancada', 'bomba']], ['Eusébio', ['arrancada', 'bomba']], ['George Weah', ['arrancada', 'slalom']],
  ['Kylian Mbappé', ['arrancada', 'colocado']], ['Erling Haaland', ['de_primeira', 'bomba']], ['Harry Kane', ['colocado', 'de_primeira']],
  ['Robert Lewandowski', ['de_primeira', 'cabecada']], ['Luis Suárez', ['de_bico', 'colocado']], ['Wayne Rooney', ['bicicleta', 'voleio', 'bomba']],
  ['Robin van Persie', ['voleio', 'colocado']], ['Hugo Sánchez', ['bicicleta', 'voleio']], ['Jean-Pierre Papin', ['voleio']],
  ['Alan Shearer', ['bomba', 'cabecada']], ['Éric Cantona', ['cobertura', 'chapeu']], ['Hristo Stoichkov', ['bomba', 'falta_bomba']],
  ['Ronald Koeman', ['falta_bomba', 'bomba']], ['Fernando Hierro', ['falta_bomba', 'cabecada']], ['Michel Platini', ['falta_curva', 'colocado']],
  ['Lothar Matthäus', ['bomba', 'arrancada']], ['Steven Gerrard', ['bomba', 'lancamento']], ['Frank Lampard', ['bomba', 'de_primeira']],
  ['Pavel Nedvěd', ['bomba', 'voleio']], ['Bobby Charlton', ['bomba']], ['Clarence Seedorf', ['bomba', 'passe_acucar']], ['Paul Scholes', ['voleio', 'bomba']],
  ['Toni Kroos', ['lancamento', 'bomba']], ['Kevin De Bruyne', ['cruzamento_curva', 'passe_acucar', 'bomba']], ['Franz Beckenbauer', ['lancamento', 'arrancada']],
  ['Mario Kempes', ['arrancada', 'bomba']], ['Alfredo Di Stéfano', ['arrancada', 'de_primeira']], ['Michael Ballack', ['cabecada', 'bomba']],
  ['Ruud Gullit', ['cabecada', 'bomba']], ['Sergio Ramos', ['cabecada']], ['John Terry', ['cabecada', 'corte_cabeca']], ['Nemanja Vidić', ['corte_cabeca', 'cabecada']],
  ['Daniel Passarella', ['cabecada', 'falta_bomba']], ['Figueroa', ['corte_cabeca', 'cabecada']], ['Alberto Spencer', ['cabecada']],
  ['Paolo Maldini', ['bote', 'corte_cabeca']], ['Franco Baresi', ['bote']], ['Fabio Cannavaro', ['bote', 'corte_cabeca']], ['Alessandro Nesta', ['bote']],
  ['Thiago Silva', ['bote', 'corte_cabeca']], ['Carles Puyol', ['carrinho', 'cabecada']], ['Lúcio', ['arrancada', 'cabecada']], ['Lilian Thuram', ['bote']],
  ['Dunga', ['carrinho', 'lancamento']], ['Patrick Vieira', ['carrinho', 'arrancada']], ['Roy Keane', ['carrinho']], ['Cerezo', ['bote', 'passe_acucar']],
  ['Cafu', ['arrancada', 'cruzamento_curva']], ['Dani Alves', ['cruzamento_curva', 'arrancada']], ['Marcelo', ['elastico', 'cruzamento_curva']],
  ['Carlos Alberto Torres', ['arrancada', 'bomba']], ['Philipp Lahm', ['passe_acucar']], ['Javier Zanetti', ['arrancada']],
  ['René Higuita', ['escorpiao', 'saida_pes']], ['Manuel Neuer', ['saida_pes', 'defesa_milagrosa']], ['Rogério Ceni', ['saida_pes', 'defesa_milagrosa']],
  ['José Luis Chilavert', ['defesa_milagrosa', 'saida_pes']], ['Taffarel', ['defesa_milagrosa']], ['Gilmar', ['defesa_milagrosa']], ['Marcos', ['defesa_milagrosa']],
  ['Dida', ['defesa_milagrosa']], ['Lev Yashin', ['defesa_milagrosa']], ['Gianluigi Buffon', ['defesa_milagrosa']], ['Iker Casillas', ['defesa_milagrosa']],
  ['Oliver Kahn', ['defesa_milagrosa']], ['Peter Schmeichel', ['defesa_milagrosa']], ['Gordon Banks', ['defesa_milagrosa']], ['Petr Čech', ['defesa_milagrosa']],
]
const GOLPES = new Map<string, Golpe[]>()
for (const [n, g] of GOLPES_LISTA) GOLPES.set(n, g)
/** os golpes da lenda (vazio pra quem não é lenda ou não está na lista) */
export function golpesDe(nome: string, fame?: number): Golpe[] {
  if ((fame ?? 0) < 5) return []
  return GOLPES.get(nome) ?? []
}

// 🦶 O PÉ: a narração só diz "de canhota"/"de direita" de quem a gente SABE (lenda com pé famoso); do resto, não fala do pé
const CANHOTOS = new Set(['Diego Maradona', 'Lionel Messi', 'Rivaldo', 'Roberto Carlos', 'Arjen Robben', 'Ángel Di María', 'Ryan Giggs', 'Juan Román Riquelme',
  'Ferenc Puskás', 'Hristo Stoichkov', 'Rivelino', 'Gérson Canhotinha de Ouro', 'Adriano Imperador', 'Mario Kempes', 'Robin van Persie', 'Erling Haaland', 'Pepe', 'Marcelo'])
const DESTROS = new Set(['Pelé', 'Zico', 'Romário', 'Ronaldo Fenômeno', 'Cristiano Ronaldo', 'David Beckham', 'Kaká', 'Cafu', 'Thierry Henry', 'Frank Lampard',
  'Steven Gerrard', 'Andriy Shevchenko', 'Gabriel Batistuta', 'Marco van Basten', 'Raúl', 'Didier Drogba', 'Robert Lewandowski', 'Karim Benzema', 'Harry Kane',
  'Luis Suárez', 'Wayne Rooney', 'Zlatan Ibrahimović', 'Neymar', 'Ronaldinho Gaúcho', 'Garrincha', 'Eusébio', 'Johan Cruyff', 'Michel Platini', 'Roberto Baggio',
  'Alessandro Del Piero', 'Francesco Totti', 'Andrea Pirlo', 'Luís Figo', 'Luka Modrić', 'Andrés Iniesta', 'Xavi', 'Toni Kroos', 'Kevin De Bruyne', 'Thomas Müller',
  'Miroslav Klose', 'Tostão', 'Bebeto', 'Careca', 'Jairzinho', 'Sócrates', 'Falcão', 'Juninho Pernambucano', 'Marcelinho Carioca', 'Nelinho', 'George Weah',
  'Kylian Mbappé', 'Michael Owen', 'Alan Shearer', 'Kenny Dalglish', 'Éric Cantona', 'Denis Law', 'Jean-Pierre Papin', 'Hugo Sánchez', 'Alfredo Di Stéfano',
  'Paolo Rossi', 'Ruud van Nistelrooy', 'Vinícius Júnior', 'Lothar Matthäus', 'Pavel Nedvěd', 'Clarence Seedorf', 'Paul Scholes', 'Franz Beckenbauer',
  'Dennis Bergkamp', 'Zinedine Zidane', 'Gerd Müller', 'Eden Hazard', 'Ronald Koeman', 'Fernando Hierro'])
export type Pe = 'canhota' | 'direita' | null
export function peDe(nome: string, fame?: number): Pe {
  if ((fame ?? 0) < 5) return null
  return CANHOTOS.has(nome) ? 'canhota' : DESTROS.has(nome) ? 'direita' : null
}
export const LENDAS_COM_GOLPE = GOLPES.size

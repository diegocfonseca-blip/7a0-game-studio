// ─── 🌍 PAÍS de cada carta (Copa do Mundo Legends — passo 1) ─────────────────
// Regra do Diego: país = a SELEÇÃO que o jogador defendeu (ou defenderia).
// Naturalizado conta pra onde JOGOU: Deco/Liedson → Portugal · Diego Costa e
// Laporte → Espanha · Amauri → Itália · Zague → México · Camoranesi seria Itália.
// Carta do baralho BR SEM etiqueta aqui = brasileiro (o padrão do baralho BR).
// Cartas dos baralhos EU e MUNDO precisam TODAS de etiqueta (verificado por
// scripts/checa-paises antes de commitar carta nova).
// ⚠️ Este arquivo NÃO é importado pelo jogo ainda — zero risco pro que está no ar.

import { CATALOG, CATALOG_EU, CATALOG_WORLD } from './data'

export const PAIS: Record<string, string> = {
  // ── Baralho BR: SÓ os estrangeiros (o resto é Brasil por padrão) ──
  'Gatito Fernández': 'Paraguai', 'Arce': 'Paraguai', 'Junior Alonso': 'Paraguai',
  'Gustavo Gómez': 'Paraguai', 'Gamarra': 'Paraguai', 'Galeano': 'Paraguai',
  'Sérgio Rochet': 'Uruguai', 'Piquerez': 'Uruguai', 'Arrascaeta': 'Uruguai',
  'Lugano': 'Uruguai', 'Loco Abreu': 'Uruguai', 'Suárez': 'Uruguai',
  'Sorín': 'Argentina', 'Bernabei': 'Argentina', 'Kannemann': 'Argentina',
  'Mascherano': 'Argentina', 'Montillo': 'Argentina', "D'Alessandro": 'Argentina',
  'Guiñazú': 'Argentina', 'Dario Conca': 'Argentina', 'Tevez': 'Argentina',
  'Thiago Almada': 'Argentina', 'Germán Cano': 'Argentina', 'Barcos': 'Argentina',
  'Calleri': 'Argentina', 'Flaco López': 'Argentina', 'Vegetti': 'Argentina',
  'M. Biancucchi (primo do Messi)': 'Argentina',
  'Isla': 'Chile', 'Eugenio Mena': 'Chile', 'Figueroa': 'Chile',
  'Aránguiz': 'Chile', 'Valdivia': 'Chile', 'Marcos González': 'Chile',
  'Rincón': 'Colômbia', 'James Rodríguez': 'Colômbia', 'Yerry Mina': 'Colômbia',
  'Jhon Arias': 'Colômbia', 'Richard Ríos': 'Colômbia', 'Asprilla': 'Colômbia',
  'Miguel Borja': 'Colômbia', 'Víctor Aristizábal': 'Colômbia', 'Muñoz': 'Colômbia',
  'Arboleda': 'Equador', 'Enner Valencia': 'Equador',
  'Guerrero': 'Peru', 'Soteldo': 'Venezuela', 'Marcelo Moreno': 'Bolívia',
  'Miguelito': 'Bolívia', 'Petkovic': 'Sérvia', 'Seedorf': 'Holanda',
  'Depay': 'Holanda', 'Anelka': 'França', 'Pablo Marí': 'Espanha',
  'GarrinSha': 'Haiti',
  // ── adicionados 14/08 (Diego: vários estrangeiros do baralho BR caindo em
  // "Brasil" por engano — tinham bio de nacionalidade mas faltava aqui) ──
  'Brítez': 'Argentina', 'Pochettino': 'Argentina', 'Matías Defederico': 'Argentina',
  'Lucas Pratto': 'Argentina', 'Scocco': 'Argentina', 'Machuca': 'Argentina',
  'Gabriel Mercado': 'Argentina', 'Rodrigo Garro': 'Argentina', 'Lucho González': 'Argentina',
  'Alexander Barboza': 'Argentina', 'Marcelino Moreno': 'Argentina',
  'Martín Silva': 'Uruguai', 'Nicolás Lodeiro': 'Uruguai', 'Beto Acosta': 'Uruguai',
  'Yoshimar Yotún': 'Peru',
  'Ángel Romero': 'Paraguai',
  'Félix Torres': 'Equador', 'Juan Cazares': 'Equador',
  'Kevin Viveros': 'Colômbia', 'Rafael Borré': 'Colômbia',

  // ── Baralho EU: goleiros ──
  'Ter Stegen': 'Alemanha', 'Massimo Taibi (o frango do United)': 'Itália',
  'Lev Yashin': 'Rússia', 'Gianluigi Buffon': 'Itália', 'Iker Casillas': 'Espanha',
  'Oliver Kahn': 'Alemanha', 'Manuel Neuer': 'Alemanha', 'Dino Zoff': 'Itália',
  'Peter Schmeichel': 'Dinamarca', 'Petr Čech': 'Rep. Tcheca',
  'Thibaut Courtois': 'Bélgica', 'Jan Oblak': 'Eslovênia',
  'Gianluigi Donnarumma': 'Itália', 'Dida': 'Brasil', 'Fabien Barthez': 'França',
  'Víctor Valdés': 'Espanha', 'Pepe Reina': 'Espanha', 'Júlio César': 'Brasil',
  'Alisson': 'Brasil', 'Ederson': 'Brasil', 'David Seaman': 'Inglaterra',
  'Jens Lehmann': 'Alemanha', 'Gordon Banks': 'Inglaterra', 'André Onana': 'Camarões',
  'Jerzy Dudek': 'Polônia', 'Heurelho Gomes': 'Brasil', 'Loris Karius': 'Alemanha',
  'Keylor Navas': 'Costa Rica', 'Kepa': 'Espanha', 'Edwin van der Sar': 'Holanda',
  'Jordan Pickford': 'Inglaterra', 'Doni': 'Brasil',
  'Emiliano “Dibu” Martínez': 'Argentina', 'Mike Maignan': 'França',
  'Hugo Lloris': 'França', 'Wojciech Szczęsny': 'Polônia', 'Joe Hart': 'Inglaterra',
  // 🇵🇱 naturalizado: fez a carreira na Polônia e JOGOU pela seleção polonesa
  // (Euro 2008) — a regra do arquivo é seguir por onde o cara jogou.
  'Roger Guerreiro': 'Polônia',
  'Villasanti': 'Paraguai',
  // brasileiros do lote 27/08 que nasceram no baralho EUROPEU (é lá que jogaram):
  // sem etiqueta, o baralho EU cai em '??' e eles ficariam de fora de toda Copa.
  'Yan Couto': 'Brasil', 'Cris': 'Brasil', 'Felipe Anderson': 'Brasil',
  'Anderson Talisca': 'Brasil',
  'Vítor Baía': 'Portugal', 'Tim Howard': 'EUA', 'Rui Patrício': 'Portugal',
  'Hans van Breukelen': 'Holanda', 'David Ospina': 'Colômbia',
  'Fernando Muslera': 'Uruguai', 'Claudio Bravo': 'Chile',
  'Jean-Marie Pfaff': 'Bélgica',

  // ── Baralho EU: laterais ──
  'Michel Bastos': 'Brasil', 'Rafael (irmão do Fábio)': 'Brasil',
  'Fábio (irmão do Rafael)': 'Brasil', 'Júnior': 'Brasil', 'Carvajal': 'Espanha',
  'Cucurella': 'Espanha', 'Míchel Salgado': 'Espanha', 'Ivanović': 'Sérvia',
  'Danilo': 'Brasil', 'Abel Ferreira': 'Portugal', 'Paolo Maldini': 'Itália',
  'Roberto Carlos': 'Brasil', 'Cafu': 'Brasil', 'Philipp Lahm': 'Alemanha',
  'Dani Alves': 'Brasil', 'Javier Zanetti': 'Argentina', 'Maicon': 'Brasil',
  'Marcelo Vieira': 'Brasil', 'Ashley Cole': 'Inglaterra', 'Jordi Alba': 'Espanha',
  'Bixente Lizarazu': 'França', 'Patrice Evra': 'França', 'Gary Neville': 'Inglaterra',
  'João Cancelo': 'Portugal', 'Trent Alexander-Arnold': 'Inglaterra',
  'Maxwell': 'Brasil', 'Sylvinho': 'Brasil', 'Alphonso Davies': 'Canadá',
  'Juliano Belletti': 'Brasil', 'Fábio Grosso': 'Itália', 'Éric Abidal': 'França',
  'Gianluca Zambrotta': 'Itália', 'Theo Hernández': 'França',
  'Achraf Hakimi': 'Marrocos', 'Andrew Robertson': 'Escócia',
  'César Azpilicueta': 'Espanha', 'Royston Drenthe': 'Holanda',
  'Pablo Armero': 'Colômbia', 'Benjamin Pavard': 'França',
  'Giovanni van Bronckhorst': 'Holanda', 'Gonzalo Montiel': 'Argentina',
  'Nicolás Tagliafico': 'Argentina', 'Marcos Acuña': 'Argentina',
  'Lionel Scaloni': 'Argentina', 'Joshua Kimmich': 'Alemanha', 'Douglas': 'Brasil',
  'Fábio Coentrão': 'Portugal', 'Arbeloa': 'Espanha', 'Capdevila': 'Espanha',
  'Cuadrado': 'Colômbia', 'Emerson Royal': 'Brasil', 'Kyle Walker': 'Inglaterra',
  'Antonio Cabrini': 'Itália', 'Andreas Brehme': 'Alemanha',
  'Christian Ziege': 'Alemanha', 'Paulo Ferreira': 'Portugal',
  'Raphaël Guerreiro': 'Portugal', 'Ruud Krol': 'Holanda', 'Daley Blind': 'Holanda',
  'Santiago Arias': 'Colômbia', 'Martín Cáceres': 'Uruguai',
  'Maxi Pereira': 'Uruguai', 'Thomas Meunier': 'Bélgica',
  'Timothy Castagne': 'Bélgica', 'DaMarcus Beasley': 'EUA',
  'Lee Young-pyo': 'Coreia do Sul',

  // ── Baralho EU: zagueiros ──
  'Maguire': 'Inglaterra', 'Matip': 'Camarões', 'Gabriel Magalhães': 'Brasil',
  'Bremer': 'Brasil', 'Dante (o do 7 a 1)': 'Brasil',
  'Winston Bogarde (a lenda do banco)': 'Holanda', 'Franz Beckenbauer': 'Alemanha',
  'Franco Baresi': 'Itália', 'Fabio Cannavaro': 'Itália', 'Sergio Ramos': 'Espanha',
  'Alessandro Nesta': 'Itália', 'Thiago Silva': 'Brasil', 'Carles Puyol': 'Espanha',
  'Virgil van Dijk': 'Holanda', 'Nemanja Vidić': 'Sérvia',
  'Rio Ferdinand': 'Inglaterra', 'John Terry': 'Inglaterra',
  'Gerard Piqué': 'Espanha', 'Lúcio': 'Brasil', 'Lilian Thuram': 'França',
  'Jaap Stam': 'Holanda', 'Marcel Desailly': 'França', 'Walter Samuel': 'Argentina',
  'Jamie Carragher': 'Inglaterra', 'Aldair': 'Brasil', 'Giorgio Chiellini': 'Itália',
  'Leonardo Bonucci': 'Itália', 'Vincent Kompany': 'Bélgica',
  'Diego Godín': 'Uruguai', 'Mats Hummels': 'Alemanha', 'David Luiz': 'Brasil',
  'Alessandro Costacurta': 'Itália', 'Sol Campbell': 'Inglaterra',
  'Bobby Moore': 'Inglaterra', 'Daniel Passarella': 'Argentina',
  'Matthijs de Ligt': 'Holanda', 'Marco Materazzi': 'Itália',
  'Fernando Hierro': 'Espanha', 'Phil Jones': 'Inglaterra',
  'Titus Bramble': 'Inglaterra', 'Ricardo Carvalho': 'Portugal',
  'Kalidou Koulibaly': 'Senegal', 'Rúben Dias': 'Portugal',
  'Raphaël Varane': 'França', 'Sébastien Squillaci': 'França',
  'Jan Vertonghen': 'Bélgica', 'Antonio Rüdiger': 'Alemanha',
  'Aymeric Laporte': 'Espanha', 'José María Giménez': 'Uruguai',
  'Lisandro Martínez': 'Argentina', 'Nicolás Otamendi': 'Argentina',
  'Ronald Koeman': 'Holanda', 'David Alaba': 'Áustria', 'William Saliba': 'França',
  'Jérôme Boateng': 'Alemanha', 'Upamecano': 'França', 'Barzagli': 'Itália',
  'Albiol': 'Espanha', 'Rafa Márquez': 'México', 'Fernando Couto': 'Portugal',
  'Mario Yepes': 'Colômbia', 'Cristián Zapata': 'Colômbia',
  'Paolo Montero': 'Uruguai', 'Sebastián Coates': 'Uruguai', 'Gary Medel': 'Chile',
  'Toby Alderweireld': 'Bélgica', 'Kim Min-jae': 'Coreia do Sul',
  'Joseph Minala (Benjamin Button)': 'Camarões',

  // ── Baralho EU: meias ──
  'Payet': 'França', 'Petit': 'França', 'Deschamps': 'França',
  'Xavi Simons': 'Holanda', 'Warren Zaïre-Emery': 'França',
  'Alexis Mac Allister': 'Argentina', 'Arturo Vidal': 'Chile',
  'Bruno Fernandes': 'Portugal', 'Ilkay Gündogan': 'Alemanha',
  'Djemba-Djemba (nome em dobro)': 'Camarões', 'Zinedine Zidane': 'França',
  'Ronaldinho Gaúcho': 'Brasil', 'Michel Platini': 'França', 'Kaká': 'Brasil',
  'Xavi': 'Espanha', 'Andrés Iniesta': 'Espanha', 'Andrea Pirlo': 'Itália',
  'Luka Modrić': 'Croácia', 'Kevin De Bruyne': 'Bélgica', 'Luís Figo': 'Portugal',
  'Rivaldo': 'Brasil', 'Lothar Matthäus': 'Alemanha', 'Steven Gerrard': 'Inglaterra',
  'Frank Lampard': 'Inglaterra', 'Paul Scholes': 'Inglaterra', 'Toni Kroos': 'Alemanha',
  'Francesco Totti': 'Itália', 'Patrick Vieira': 'França', 'Xabi Alonso': 'Espanha',
  "N'Golo Kanté": 'França', 'Juninho Pernambucano': 'Brasil', 'Deco': 'Portugal',
  'Clarence Seedorf': 'Holanda', 'Michael Ballack': 'Alemanha',
  'Wesley Sneijder': 'Holanda', 'Roy Keane': 'Irlanda', 'Ryan Giggs': 'País de Gales',
  'Mesut Özil': 'Alemanha', 'Edgar Davids': 'Holanda', 'Zé Roberto': 'Brasil',
  'Gennaro Gattuso': 'Itália', 'Claude Makélélé': 'França',
  'Park Ji-sung': 'Coreia do Sul', 'Dietmar Hamann': 'Alemanha',
  'Jude Bellingham': 'Inglaterra', 'Pedri': 'Espanha', 'Gavi': 'Espanha',
  'Martin Ødegaard': 'Noruega', 'Renato Sanches': 'Portugal', 'Casemiro': 'Brasil',
  'David Silva': 'Espanha', 'Bernardo Silva': 'Portugal', 'Pavel Nedvěd': 'Rep. Tcheca',
  'Juan Román Riquelme': 'Argentina', 'Cesc Fàbregas': 'Espanha',
  'Thiago Alcântara': 'Espanha', 'Philippe Coutinho': 'Brasil',
  'Esteban Cambiasso': 'Argentina', 'Willian': 'Brasil', 'Oscar': 'Brasil',
  'Ramires': 'Brasil', 'Fernandinho': 'Brasil', 'Fabinho': 'Brasil',
  'Gilberto Silva': 'Brasil', 'Juninho Paulista': 'Brasil', 'Bernard': 'Brasil',
  'Anderson': 'Brasil', "John O'Shea": 'Irlanda', 'Momo Sissoko': 'Mali',
  'Diego Maradona': 'Argentina', 'Bobby Charlton': 'Inglaterra',
  'Frank Rijkaard': 'Holanda', 'Gheorghe Hagi': 'Romênia', 'Rui Costa': 'Portugal',
  'Yaya Touré': 'Costa do Marfim', 'Sergio Busquets': 'Espanha',
  'Ángel Di María': 'Argentina', 'Juan Sebastián Verón': 'Argentina',
  'Paul Pogba': 'França', 'Abedi Pelé': 'Gana', 'Rodri': 'Espanha',
  'Emerson Ferreira': 'Brasil', 'Diego Simeone': 'Argentina',
  'Rafinha Alcântara': 'Brasil', 'Mario Götze': 'Alemanha',
  'Paul Gascoigne': 'Inglaterra', 'Jay-Jay Okocha': 'Nigéria',
  'Gianni Rivera': 'Itália', 'Kenny Dalglish': 'Escócia', 'Éric Cantona': 'França',
  'Gianfranco Zola': 'Itália', 'Robert Pires': 'França',
  'Michael Laudrup': 'Dinamarca', 'Fernando Redondo': 'Argentina',
  'Youri Djorkaeff': 'França', 'Enzo Francescoli': 'Uruguai',
  'Pep Guardiola': 'Espanha', 'Jamal Musiala': 'Alemanha',
  'Florian Wirtz': 'Alemanha', 'Cole Palmer': 'Inglaterra', 'João Félix': 'Portugal',
  'Eduardo Camavinga': 'França', 'Gaizka Mendieta': 'Espanha',
  'David Ginola': 'França', 'Kléberson': 'Brasil', 'Fred (volante)': 'Brasil',
  'Marouane Fellaini': 'Bélgica', 'Vampeta': 'Brasil', 'Ganso': 'Brasil',
  'Lucas Paquetá': 'Brasil', 'Gerson': 'Brasil', 'Lucas Silva': 'Brasil',
  'Mauro Silva': 'Brasil', 'Ljungberg': 'Suécia',
  'Alfie Haaland (pai do Erling)': 'Noruega', 'David Beckham': 'Inglaterra',
  'Declan Rice': 'Inglaterra', 'Youri Tielemans': 'Bélgica',
  'Phil Foden': 'Inglaterra', 'Bastian Schweinsteiger': 'Alemanha',
  'Hidetoshi Nakata': 'Japão', 'Keisuke Honda': 'Japão',
  'Lee Kang-in': 'Coreia do Sul', 'Christian Eriksen': 'Dinamarca',
  'Leandro Paredes': 'Argentina', 'Giovani Lo Celso': 'Argentina',
  'Pablo Aimar': 'Argentina', 'Lucas Leiva': 'Brasil', 'Ever Banega': 'Argentina',
  'De Rossi': 'Itália', 'Andrés Guardado': 'México', 'Frenkie de Jong': 'Holanda',
  'Álvaro Recoba': 'Uruguai', 'Walter Gargano': 'Uruguai',
  'Matías Fernández': 'Chile', 'Jan Ceulemans': 'Bélgica', 'Enzo Scifo': 'Bélgica',
  'Axel Witsel': 'Bélgica', 'Claudio Reyna': 'EUA', 'Ki Sung-yueng': 'Coreia do Sul',

  // ── Baralho EU: atacantes ──
  'Berbatov': 'Bulgária', 'Rafael Leão': 'Portugal', 'Ricardo Quaresma': 'Portugal',
  'Nani': 'Portugal', 'Thomas Müller': 'Alemanha', 'Reus': 'Alemanha',
  'Matheus Cunha': 'Brasil', 'Salomon Kalou': 'Costa do Marfim',
  'Raphinha': 'Brasil', 'Martinelli': 'Brasil', 'Viktor Gyökeres': 'Suécia',
  'Nico Williams': 'Espanha', 'Gareth Bale': 'País de Gales',
  'Eden Hazard': 'Bélgica', 'Son Heung-min': 'Coreia do Sul',
  'Ali Dia (o falso primo do Weah)': 'Senegal', 'Bebê (comprado às cegas)': 'Brasil',
  'Lionel Messi': 'Argentina', 'Cristiano Ronaldo': 'Portugal',
  'Ronaldo Fenômeno': 'Brasil', 'Johan Cruyff': 'Holanda',
  'Alfredo Di Stéfano': 'Argentina', 'Marco van Basten': 'Holanda',
  'Romário': 'Brasil', 'Neymar': 'Brasil', 'Ferenc Puskás': 'Hungria',
  'Eusébio': 'Portugal', 'Gerd Müller': 'Alemanha', 'Thierry Henry': 'França',
  'Roberto Baggio': 'Itália', 'Ruud Gullit': 'Holanda',
  'Andriy Shevchenko': 'Ucrânia', 'George Weah': 'Libéria',
  'Zlatan Ibrahimović': 'Suécia', 'Robert Lewandowski': 'Polônia',
  'Kylian Mbappé': 'França', 'Erling Haaland': 'Noruega',
  'Gabriel Batistuta': 'Argentina', 'Adriano Imperador': 'Brasil',
  'Dennis Bergkamp': 'Holanda', 'Raúl': 'Espanha',
  'Ruud van Nistelrooy': 'Holanda', 'Didier Drogba': 'Costa do Marfim',
  'Wayne Rooney': 'Inglaterra', 'Alessandro Del Piero': 'Itália',
  "Samuel Eto'o": 'Camarões', 'Karim Benzema': 'França', 'Mohamed Salah': 'Egito',
  'Sergio Agüero': 'Argentina', 'Harry Kane': 'Inglaterra', 'Luis Suárez': 'Uruguai',
  'Alan Shearer': 'Inglaterra', 'Arjen Robben': 'Holanda',
  'Franck Ribéry': 'França', 'Fernando Torres': 'Espanha', 'David Villa': 'Espanha',
  'Robinho': 'Brasil', 'Hulk': 'Brasil', 'Filippo Inzaghi': 'Itália',
  'David Trezeguet': 'França', 'Michael Owen': 'Inglaterra',
  'Hernán Crespo': 'Argentina', 'Julio Baptista': 'Brasil',
  'Fernando Morientes': 'Espanha', 'Robbie Fowler': 'Inglaterra',
  'Dwight Yorke': 'Trinidad e Tobago', 'Andy Cole': 'Inglaterra',
  'Hakan Şükür': 'Turquia', 'Dirk Kuyt': 'Holanda', 'Amauri': 'Itália',
  'Peter Crouch': 'Inglaterra', 'Emile Heskey': 'Inglaterra',
  'Alexandre Pato': 'Brasil', 'Lamine Yamal': 'Espanha', 'Endrick': 'Brasil',
  'Marcus Rashford': 'Inglaterra', 'Denílson Show': 'Brasil',
  'Bojan Krkić': 'Espanha', 'Freddy Adu': 'EUA', 'Robin van Persie': 'Holanda',
  'Edinson Cavani': 'Uruguai', 'Gonzalo Higuaín': 'Argentina',
  'Radamel Falcao': 'Colômbia', 'Sadio Mané': 'Senegal',
  'Roberto Firmino': 'Brasil', 'Christian Vieri': 'Itália',
  'Mário Jardel': 'Brasil', 'Miroslav Klose': 'Alemanha',
  'Giovane Élber': 'Brasil', 'Márcio Amoroso': 'Brasil', 'Sonny Anderson': 'Brasil',
  'Grafite': 'Brasil', 'Vágner Love': 'Brasil', 'Aílton': 'Brasil',
  'Mario Balotelli': 'Itália', 'Nicklas Bendtner': 'Dinamarca',
  'Djibril Cissé': 'França', 'Paolo Rossi': 'Itália', 'Mario Kempes': 'Argentina',
  'Hristo Stoichkov': 'Bulgária', 'Vinícius Júnior': 'Brasil',
  'Ousmane Dembélé': 'França', 'Paulo Dybala': 'Argentina',
  'Mauro Icardi': 'Argentina', 'Antoine Griezmann': 'França',
  'Patrick Kluivert': 'Holanda', 'Jürgen Klinsmann': 'Alemanha',
  'Diego Forlán': 'Uruguai', 'Rudi Völler': 'Alemanha', 'Gary Lineker': 'Inglaterra',
  'Emilio Butragueño': 'Espanha', 'Davor Šuker': 'Croácia',
  'Nwankwo Kanu': 'Nigéria', 'Totò Schillaci': 'Itália', 'George Best': 'Irlanda do Norte',
  'Hugo Sánchez': 'México', 'Denis Law': 'Escócia', 'Jean-Pierre Papin': 'França',
  'Careca': 'Brasil', 'Iván Zamorano': 'Chile', 'Gianluca Vialli': 'Itália',
  'Rodrygo': 'Brasil', 'Ansu Fati': 'Espanha', 'Casagrande': 'Brasil',
  'Sávio': 'Brasil', 'Gabigol': 'Brasil', 'Keirrison': 'Brasil',
  'Afonso Alves': 'Brasil', 'El Hadji Diouf': 'Senegal', 'Kerlon': 'Brasil',
  'Michael Olise': 'França', 'Samuel Lino': 'Brasil', 'Antony': 'Brasil',
  'Jô': 'Brasil', 'Malcom': 'Brasil', 'Alexis Sánchez': 'Chile',
  'Andy Carroll': 'Inglaterra', 'Bebeto': 'Brasil', 'Luís Boa Morte': 'Portugal',
  'Andrey Arshavin': 'Rússia', 'Svetoslav Todorov': 'Bulgária',
  'Oliver Bierhoff': 'Alemanha', 'Giovani dos Santos': 'México',
  'Evandro Roncatto': 'Brasil', 'Khvicha Kvaratskhelia': 'Geórgia',
  'Henrik Larsson': 'Suécia', 'Edin Džeko': 'Bósnia', 'Marc Overmars': 'Holanda',
  'Kingsley Coman': 'França', 'Olivier Giroud': 'França',
  'Bradley Barcola': 'França', 'Nacho Prestianni': 'Argentina',
  'Santiago Solari': 'Argentina', 'Giuliano Simeone': 'Argentina',
  'Diego Costa': 'Espanha', 'Julián Álvarez': 'Argentina',
  'Lautaro Martínez': 'Argentina', 'Hakim Ziyech': 'Marrocos',
  'Benni McCarthy': 'África do Sul', 'Liedson': 'Portugal', 'Diogo Jota': 'Portugal',
  'Marcelo Salas': 'Chile', 'Romelu Lukaku': 'Bélgica',
  'Christian Pulisic': 'EUA', 'Clint Dempsey': 'EUA', 'Cha Bum-kun': 'Coreia do Sul',
  'Ahn Jung-hwan': 'Coreia do Sul', 'Hwang Hee-chan': 'Coreia do Sul',

  // ── Lote "22 no mínimo" (27/07, aprovado pelo Diego) — parte EU ──
  'Brad Friedel': 'EUA', 'Steve Cherundolo': 'EUA', 'Alexi Lalas': 'EUA',
  'Oguchi Onyewu': 'EUA', 'Michael Bradley': 'EUA', 'Jermaine Jones': 'EUA',
  'Eric Gerets': 'Bélgica', 'Jordan Lukaku': 'Bélgica',
  'Daniel Van Buyten': 'Bélgica', 'Radja Nainggolan': 'Bélgica',
  'Marc Wilmots': 'Bélgica', 'Michy Batshuayi': 'Bélgica',
  'Christian Benteke': 'Bélgica', 'Jean Beausejour': 'Chile',
  'David Pizarro': 'Chile', 'Marcelo Díaz': 'Chile',
  'Cha Du-ri': 'Coreia do Sul', 'Park Joo-ho': 'Coreia do Sul',
  'Lee Chung-yong': 'Coreia do Sul', 'Koo Ja-cheol': 'Coreia do Sul',
  'Seol Ki-hyeon': 'Coreia do Sul', 'Camilo Zúñiga': 'Colômbia',
  'Álvaro Pereira': 'Uruguai', 'Héctor Moreno': 'México',

  // ── Lote "22 no mínimo" — parte MUNDO ──
  'Lee Woon-jae': 'Coreia do Sul', 'Kim Byung-ji': 'Coreia do Sul',
  'Kim Young-gwon': 'Coreia do Sul', 'Kim Nam-il': 'Coreia do Sul',
  'Hwang Sun-hong': 'Coreia do Sul', 'Kyle Beckerman': 'EUA',
  'Tab Ramos': 'EUA', 'Cobi Jones': 'EUA', 'Gabriel Mendoza': 'Chile',
  'Eduardo Vargas': 'Chile', 'Humberto Suazo': 'Chile',
  'Cebolla Rodríguez': 'Uruguai',

  // ── Baralho MUNDO ──
  'Jorge Campos': 'México', 'René Higuita': 'Colômbia',
  'José Luis Chilavert': 'Paraguai', 'Amadeo Carrizo': 'Argentina',
  'Hugo Gatti': 'Argentina', 'Óscar Pérez': 'México',
  'Mohammed Al-Deayea': 'Arábia Saudita', 'Óscar Córdoba': 'Colômbia',
  'Vozinha': 'Cabo Verde', 'Essam El-Hadary': 'Egito', 'Nery Pumpido': 'Argentina',
  'Tony Meola': 'EUA', 'Memo Ochoa': 'México', 'Johnny Herrera': 'Chile',
  'Silvio Marzolini': 'Argentina', 'Ramón Ramírez': 'México',
  'Salvador Carmona': 'México', 'Frankie Hejduk': 'EUA', 'Jeff Agoos': 'EUA',
  'Mario Méndez': 'México', 'Joel Sánchez': 'México',
  'Song Chong-gug': 'Coreia do Sul', 'Andrés Escobar': 'Colômbia',
  'Hong Myung-bo': 'Coreia do Sul', 'Héctor Chumpitaz': 'Peru',
  'Claudio Suárez': 'México', 'Alberto Quintano': 'Chile',
  'Marcelo Balboa': 'EUA', 'Yuji Nakazawa': 'Japão', 'Eddie Pope': 'EUA',
  'Iván Hurtado': 'Equador', 'Fernando Quirarte': 'México',
  'Rafael Albrecht': 'Argentina', 'Choi Jin-cheul': 'Coreia do Sul',
  'Carlos Valderrama': 'Colômbia', 'Ricardo Bochini': 'Argentina',
  'Teófilo Cubillas': 'Peru', 'Cuauhtémoc Blanco': 'México',
  'Norberto Alonso': 'Argentina', 'Álex Aguinaga': 'Equador',
  'Tomás Boy': 'México', 'Alberto García Aspe': 'México',
  'Leonel Álvarez': 'Colômbia', 'Marco Etcheverry': 'Bolívia',
  'Amado Guevara': 'Honduras', 'Julio César Baldivieso': 'Bolívia',
  'Benjamín Galindo': 'México', 'Luis Flores': 'México', 'Diego Cagna': 'Argentina',
  'Egidio Arévalo Ríos': 'Uruguai', 'Gerardo Torrado': 'México',
  'Majed Abdullah': 'Arábia Saudita', 'Ángel Labruna': 'Argentina',
  'Carlos Hermosillo': 'México', 'Salvador Cabañas': 'Paraguai',
  'Luis Hernández': 'México', 'Saeed Al-Owairan': 'Arábia Saudita',
  'Antony de Ávila': 'Colômbia', 'Carlos Caszely': 'Chile',
  'Enrique Borja': 'México', 'José Sanfilippo': 'Argentina',
  'Sami Al-Jaber': 'Arábia Saudita', 'Mahmoud El-Khatib': 'Egito',
  'Hossam Hassan': 'Egito', 'Landon Donovan': 'EUA',
  'Masashi Nakayama': 'Japão', 'Zague': 'México', 'Bernabé Ferreyra': 'Argentina',
  'Clint Mathis': 'EUA',
  // ── 🌍 Etiquetas que faltavam (cartas EU/MUNDO novas que caíam em '??' e
  // bagunçavam a Copa do Mundo — 02/08). País = a seleção que defendeu/defenderia.
  'Javi Varas': 'Espanha', 'Pau Torres': 'Espanha', 'Koke': 'Espanha',
  'Marcos Senna': 'Espanha', // naturalizado — campeão da Euro 2008 pela Espanha
  'Brahim Díaz': 'Marrocos', // defendeu a Espanha de base, mas se comprometeu com Marrocos (2023)
  'Luca Zidane': 'Argélia', // filho do Zidane, mas estreou pela Argélia em 2024
  'Benjamin Mendy': 'França', 'Hatem Ben Arfa': 'França',
  'Frank de Boer': 'Holanda', 'Armando Obispo': 'Holanda', 'Quincy Promes': 'Holanda',
  'Luisão': 'Brasil',
  'Federico Valverde': 'Uruguai',
  'Hakan Çalhanoğlu': 'Turquia', 'Arda Güler': 'Turquia',
  'Danny Drinkwater': 'Inglaterra',
  'Jérémy Doku': 'Bélgica', 'Ali Maamar': 'Bélgica', // belga de origem argelina (base da Bélgica)
  'Roque Santa Cruz': 'Paraguai',
  'Cacau': 'Alemanha', // naturalizado — jogou pela Alemanha (Copa 2010)
  'Rummenigge': 'Alemanha',
  'Robert Kidiaba': 'Congo', // RD Congo (TP Mazembe)
  'Yukinari Sugawara': 'Japão', 'Shinji Kagawa': 'Japão', 'Takefusa Kubo': 'Japão',
  'Khuliso Mudau': 'África do Sul',
  'Moisés Caicedo': 'Equador',
  'Papa Bouba Diop': 'Senegal',
  'Gilberto Mora': 'México', 'Carlos Vela': 'México', 'Hirving Lozano': 'México',
  'Milton Caraglio': 'Argentina',
  // ── 🌍 LOTE COPA (02/08): 4 seleções novas a 22 cada (baralho WORLD) ──
  // Paraguai
  'Paulo da Silva': 'Paraguai', 'Claudio Morel Rodríguez': 'Paraguai', 'Denis Caniza': 'Paraguai',
  'Iván Piris': 'Paraguai', 'Cristian Riveros': 'Paraguai', 'Miguel Almirón': 'Paraguai',
  'Julio César Romero': 'Paraguai', 'Carlos Paredes': 'Paraguai', 'Nelson Cuevas': 'Paraguai',
  'Derlis González': 'Paraguai', 'Óscar Cardozo': 'Paraguai', 'José Saturnino Cardozo': 'Paraguai',
  'Roberto Cabañas': 'Paraguai',
  // Japão
  'Yoshikatsu Kawaguchi': 'Japão', 'Eiji Kawashima': 'Japão', 'Yuto Nagatomo': 'Japão',
  'Atsuto Uchida': 'Japão', 'Hiroki Sakai': 'Japão', 'Maya Yoshida': 'Japão',
  'Takehiro Tomiyasu': 'Japão', 'Tsuneyasu Miyamoto': 'Japão', 'Shunsuke Nakamura': 'Japão',
  'Yasuhito Endo': 'Japão', 'Shinji Ono': 'Japão', 'Shinji Okazaki': 'Japão',
  'Kazuyoshi Miura': 'Japão', 'Kaoru Mitoma': 'Japão', 'Yuya Osako': 'Japão',
  // Camarões
  'Thomas N’Kono': 'Camarões', 'Rigobert Song': 'Camarões', 'Nicolas N’Koulou': 'Camarões',
  'Sébastien Bassong': 'Camarões', 'Lauren': 'Camarões', 'Benoît Assou-Ekotto': 'Camarões',
  'Pierre Womé': 'Camarões', 'Timothée Atouba': 'Camarões', 'Geremi': 'Camarões',
  'Alex Song': 'Camarões', 'Modeste M’bami': 'Camarões', 'André-Frank Zambo Anguissa': 'Camarões',
  'Roger Milla': 'Camarões', 'Patrick Mboma': 'Camarões', 'Vincent Aboubakar': 'Camarões',
  'Eric Maxim Choupo-Moting': 'Camarões', 'Karl Toko Ekambi': 'Camarões',
  // Senegal
  'Édouard Mendy': 'Senegal', 'Tony Sylva': 'Senegal', 'Lamine Diatta': 'Senegal',
  'Abdou Diallo': 'Senegal', 'Pape Abou Cissé': 'Senegal', 'Ferdinand Coly': 'Senegal',
  'Habib Beye': 'Senegal', 'Youssouf Sabaly': 'Senegal', 'Pape Souaré': 'Senegal',
  'Idrissa Gana Gueye': 'Senegal', 'Khalilou Fadiga': 'Senegal', 'Aliou Cissé': 'Senegal',
  'Salif Diao': 'Senegal', 'Cheikhou Kouyaté': 'Senegal', 'Demba Ba': 'Senegal',
  'Papiss Cissé': 'Senegal', 'Ismaïla Sarr': 'Senegal',

  // ── 🌍 Etiquetas que faltavam (auditoria 17/08, pedido do Diego: 29 cartas
  // do EU/MUNDO caindo em '??' e sumindo da contagem de seleção) ──
  'Danijel Subašić': 'Croácia', 'Kiko Casilla': 'Espanha',
  'Leighton Baines': 'Inglaterra', 'Lucas Digne': 'França',
  'Marcel Schmelzer': 'Alemanha', 'Łukasz Piszczek': 'Polônia',
  'Matthias Ginter': 'Alemanha', 'Presnel Kimpembe': 'França',
  'Taribo West': 'Nigéria', 'Ivan Rakitić': 'Croácia',
  'Aaron Ramsey': 'País de Gales', 'Marcelo Brozović': 'Croácia',
  'Mateo Kovačić': 'Croácia', 'Joe Cole': 'Inglaterra', 'Dele Alli': 'Inglaterra',
  'Kevin-Prince Boateng': 'Gana', // naturalizado — escolheu jogar por Gana (nasceu na Alemanha)
  'Lucas Piazón': 'Brasil', 'Jobe Bellingham': 'Inglaterra', // irmão do Jude, base da Inglaterra
  'Gianluca Prestianni': 'Argentina', 'Theo Walcott': 'Inglaterra',
  'Ivan Perišić': 'Croácia', 'Raheem Sterling': 'Inglaterra',
  'Pierre-Emerick Aubameyang': 'Gabão', 'Mario Mandžukić': 'Croácia',
  'Gervinho': 'Costa do Marfim', 'Thorgan Hazard': 'Bélgica',
  'Willian José': 'Brasil', 'Mancini': 'Brasil', 'Papa Waigo': 'Senegal',

  // ── 🌍 LOTE COPA 24 (17/08): 4 seleções novas a 22 cada, pra Copa do Mundo
  // virar 24 (4 grupos de 6). As cartas estão espalhadas nos TRÊS baralhos
  // (regra do Diego: a carta nasce no baralho de onde o cara jogou), então é
  // esta etiqueta que junta cada uma na seleção certa. Ex.: Trauco é carta do
  // baralho BR (Flamengo) mas joga pelo PERU.
  // Croácia (14 novos — tinha 8: Modrić, Rakitić, Brozović, Kovačić, Perišić,
  // Mandžukić, Šuker, Subašić)
  'Dominik Livaković': 'Croácia', 'Robert Jarni': 'Croácia', 'Vedran Ćorluka': 'Croácia',
  'Šime Vrsaljko': 'Croácia', 'Ivan Strinić': 'Croácia', 'Joško Gvardiol': 'Croácia',
  'Dejan Lovren': 'Croácia', 'Domagoj Vida': 'Croácia', 'Igor Štimac': 'Croácia',
  'Zvonimir Boban': 'Croácia', 'Robert Prosinečki': 'Croácia', 'Alen Bokšić': 'Croácia',
  'Ivica Olić': 'Croácia',
  'Eduardo da Silva': 'Croácia', // nasceu no Brasil, naturalizado — jogou Copa e Euro pela Croácia
  // Dinamarca (18 novos — tinha 4: Peter Schmeichel, Michael Laudrup, Eriksen, Bendtner)
  'Kasper Schmeichel': 'Dinamarca', 'Thomas Helveg': 'Dinamarca', 'Joakim Mæhle': 'Dinamarca',
  'Jan Heintze': 'Dinamarca', 'Daniel Wass': 'Dinamarca', 'Simon Kjær': 'Dinamarca',
  'Daniel Agger': 'Dinamarca', 'Andreas Christensen': 'Dinamarca', 'Morten Olsen': 'Dinamarca',
  'Brian Laudrup': 'Dinamarca', 'Pierre-Emile Højbjerg': 'Dinamarca', 'Thomas Delaney': 'Dinamarca',
  'Christian Poulsen': 'Dinamarca', 'Allan Simonsen': 'Dinamarca', 'Preben Elkjær': 'Dinamarca',
  'Jon Dahl Tomasson': 'Dinamarca', 'Rasmus Højlund': 'Dinamarca', 'Ebbe Sand': 'Dinamarca',
  // Peru (18 novos — tinha 4: Guerrero, Chumpitaz, Cubillas, Yotún)
  'Pedro Gallese': 'Peru',
  'Ramón Quiroga': 'Peru', // argentino naturalizado — defendeu o Peru na Copa de 78
  'Luis Advíncula': 'Peru', 'Miguel Trauco': 'Peru', 'Aldo Corzo': 'Peru',
  'Carlos Zambrano': 'Peru', 'Alberto Rodríguez': 'Peru', 'Luis Abram': 'Peru',
  'Nolberto Solano': 'Peru', 'César Cueto': 'Peru', 'Christian Cueva': 'Peru',
  'Renato Tapia': 'Peru', 'Pedro Aquino': 'Peru', 'Claudio Pizarro': 'Peru',
  'Jefferson Farfán': 'Peru', 'Hugo Sotil': 'Peru', 'André Carrillo': 'Peru',
  'Gianluca Lapadula': 'Peru', // ítalo-peruano — escolheu jogar pelo Peru
  // Equador (15 novos — tinha 7: Arboleda, Félix Torres, Iván Hurtado, Enner
  // Valencia, Moisés Caicedo, Álex Aguinaga, Juan Cazares)
  'Alexander Domínguez': 'Equador', 'Máximo Banguera': 'Equador', 'Ulises de la Cruz': 'Equador',
  'Pervis Estupiñán': 'Equador', 'Neicer Reasco': 'Equador', 'Mario Pineida': 'Equador',
  'Frickson Erazo': 'Equador', 'Edison Méndez': 'Equador', 'Christian Noboa': 'Equador',
  'Renato Ibarra': 'Equador', 'Agustín Delgado': 'Equador', 'Felipe Caicedo': 'Equador',
  'Jefferson Montero': 'Equador', 'Ángel Mena': 'Equador', 'Michael Estrada': 'Equador',
}

export type Baralho = 'BR' | 'EU' | 'WORLD'

// ─── 🚩 NACIONALIDADE POR CARTA (regra do Diego, 21/08) ─────────────────────
// Palavras dele, depois de ver o **Pedro na seleção da ESPANHA**: *"cada carta
// tem que ter sua nacionalidade pra não ter erro depois na Copa"*.
//
// O QUE ESTAVA ERRADO. A nacionalidade era do NOME, com um remendo por baralho
// ("Pedro no baralho EU = Espanha"). Só que o Pedro que existe no baralho
// europeu **não é o espanhol** — é o **Pedro do Flamengo**, na passagem ruim
// pela Fiorentina em 2020 (carta folclórica). O espanhol nem está no jogo. Aí
// ele caía na convocação da Espanha.
//
// COMO É AGORA. Esta tabela manda em TUDO e é por CARTA (`nome|clube|ano`).
// Nome repetido no baralho só é seguro se cada carta estiver aqui.
// ⚠️ Ao adicionar uma carta com nome que JÁ EXISTE no jogo, ponha as duas aqui.
//    O `npm run paises` acusa quem ficar de fora.
export const PAIS_POR_CARTA: Record<string, string> = {
  // ⚠️ 'Alex' são DUAS PESSOAS: o meia do Cruzeiro/Fenerbahçe e o zagueiro do
  // Chelsea (Alex Rodrigo Dias da Costa). Os dois são brasileiros, então o país
  // não muda — mas ficam escritos aqui pra ninguém "consertar" um pelo outro.
  'Alex|Cruzeiro|2003': 'Brasil',
  'Alex|Chelsea|2010': 'Brasil',
  // 🇧🇷 os dois Pedros do jogo são o MESMO cara: o 9 do Flamengo. A passagem
  //     pela Fiorentina foi dele — não confundir com o Pedro Rodríguez espanhol,
  //     que não está no baralho.
  'Pedro|Flamengo|2022': 'Brasil',
  'Pedro|Fiorentina|2020': 'Brasil',
  // 🇧🇷🇵🇹 Pepe: o do Santos é brasileiro; o do Real é o português.
  'Pepe|Santos|1962': 'Brasil',
  'Pepe|Real Madrid|2012': 'Portugal',
  // 🇧🇷🇬🇭 Achado pelo `npm run paises` no mesmo dia do Pedro: o "Abedi Pelé"
  //     do Vasco NÃO é o ganês do Marseille. É o **Abedi do Vasco** (Robson
  //     Vicente Gonçalves), meia CARIOCA, no clube entre 2005 e 2007. O ganês
  //     tinha se aposentado em 1998. Estava sendo convocado pela GANA.
  'Abedi Pelé|Marseille|1993': 'Gana',
  'Abedi Pelé|Vasco|2007': 'Brasil',
}

/**
 * Seleção de uma carta. Passe SEMPRE clube e ano quando tiver — é o que separa
 * dois jogadores de mesmo nome. Sem eles, cai no nome (compatível com o que já
 * existia, e correto pra 99% do baralho, onde o nome é único).
 */
export function paisDe(name: string, baralho: Baralho, club?: string, year?: number): string {
  if (club != null && year != null) {
    const daCarta = PAIS_POR_CARTA[`${name}|${club}|${year}`]
    if (daCarta) return daCarta
  }
  const p = PAIS[name]
  if (p) return p
  // baralho BR sem etiqueta = brasileiro (padrão); EU/MUNDO sem etiqueta = buraco a corrigir
  return baralho === 'BR' ? 'Brasil' : '??'
}


// ─── ✅ MESMO JOGADOR EM DUAS CARTAS (conferido um a um, 21/08) ─────────────
// O jogo tem MUITO nome repetido — e quase sempre é a MESMA pessoa em dois
// momentos: o brasileiro no baralho BR e depois no europeu (Cafu no São Paulo
// e no Milan), ou o mesmo craque em dois clubes (Messi no Barça e no Inter
// Miami). Nesses casos herdar o país pelo nome está CERTO.
//
// Esta lista existe só pra calar o `npm run paises` nesses casos, pra o aviso
// dele continuar valendo alguma coisa: nome repetido que NÃO está aqui é nome
// que ninguém conferiu ainda — pode ser outra pessoa, como foi o Pedro.
// ⚠️ Só entra aqui depois de OLHAR as duas cartas. Na dúvida, deixa de fora.
export const MESMO_JOGADOR = new Set<string>([
  // ⚠️ 'Alex' é a EXCEÇÃO desta lista: são duas PESSOAS diferentes (o meia do
  // Cruzeiro e o zagueiro do Chelsea). Está aqui só pra calar o aviso do
  // `npm run paises`, e os dois estão escritos carta a carta em PAIS_POR_CARTA.
  'Alex',
  'Dida',
  'Júlio César',
  'Alisson',
  'Heurelho Gomes',
  'Doni',
  'Cafu',
  'Roberto Carlos',
  'Maicon',
  'Dani Alves',
  'Aldair',
  'Lúcio',
  'Thiago Silva',
  'Oscar',
  'David Luiz',
  'Danilo',
  'Ronaldinho Gaúcho',
  'Rivaldo',
  'Kaká',
  'Juninho Pernambucano',
  'Ramires',
  'Juninho Paulista',
  'Zé Roberto',
  'Vampeta',
  'Gerson',
  'Fernandinho',
  'Willian',
  'Casemiro',
  'Lucas Paquetá',
  'Deco',
  'Philippe Coutinho',
  'Gilberto Silva',
  'Mauro Silva',
  'Alexandre Pato',
  'Romário',
  'Neymar',
  'Bebeto',
  'Careca',
  'Robinho',
  'Casagrande',
  'Hulk',
  'Grafite',
  'Gabigol',
  'Rodrygo',
  'Endrick',
  'Antony',
  'Jô',
  'Sávio',
  'Vágner Love',
  'Bernard',
  'Lionel Messi',
  'Cristiano Ronaldo',
])

/** Todo nome que aparece em mais de uma carta do jogo, com as cartas. */
export function nomesRepetidos(cats: [Record<string, { name: string; club: string; year: number }[]>, Baralho][]): Map<string, { name: string; club: string; year: number; baralho: Baralho }[]> {
  const porNome = new Map<string, { name: string; club: string; year: number; baralho: Baralho }[]>()
  for (const [cat, b] of cats) for (const sec of Object.keys(cat)) for (const c of cat[sec]) {
    const arr = porNome.get(c.name) ?? []
    arr.push({ name: c.name, club: c.club, year: c.year, baralho: b })
    porNome.set(c.name, arr)
  }
  for (const [n, arr] of porNome) if (arr.length < 2) porNome.delete(n)
  return porNome
}

// Ranking das seleções por número de cartas (a régua do Diego: quem tem mais
// cartas no baralho fica na frente — Brasil 1º disparado, e o ranking se
// atualiza sozinho a cada carta nova).
export function rankingSelecoes(): { pais: string; cartas: number }[] {
  const cnt: Record<string, number> = {}
  const walk = (cat: Record<string, { name: string; club: string; year: number }[]>, b: Baralho) => {
    for (const sec of Object.keys(cat)) for (const c of cat[sec]) {
      const p = paisDe(c.name, b, c.club, c.year)
      cnt[p] = (cnt[p] ?? 0) + 1
    }
  }
  walk(CATALOG as unknown as Record<string, { name: string; club: string; year: number }[]>, 'BR')
  walk(CATALOG_EU as unknown as Record<string, { name: string; club: string; year: number }[]>, 'EU')
  walk(CATALOG_WORLD as unknown as Record<string, { name: string; club: string; year: number }[]>, 'WORLD')
  // 🚫 '??' (carta EU/MUNDO sem etiqueta de país) NUNCA vira seleção — senão vira um
  // "time" de nacionalidades misturadas no top 16 e empurra as seleções reais pra baixo.
  return Object.entries(cnt).filter(([pais]) => pais !== '??').map(([pais, cartas]) => ({ pais, cartas })).sort((a, b) => b.cartas - a.cartas)
}

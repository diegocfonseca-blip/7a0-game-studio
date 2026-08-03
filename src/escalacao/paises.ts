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
}

// Mesmo NOME em baralhos diferentes com país diferente (hoje só estes dois):
// Pepe do Santos (BR) ≠ Pepe do Real (Portugal) · Pedro do Fla (BR) ≠ Pedro do Barça/Chelsea (Espanha)
export type Baralho = 'BR' | 'EU' | 'WORLD'
export const PAIS_POR_BARALHO: Record<Baralho, Record<string, string>> = {
  BR: { 'Pepe': 'Brasil', 'Pedro': 'Brasil' },
  EU: { 'Pepe': 'Portugal', 'Pedro': 'Espanha' },
  WORLD: {},
}

export function paisDe(name: string, baralho: Baralho): string {
  const o = PAIS_POR_BARALHO[baralho][name]
  if (o) return o
  const p = PAIS[name]
  if (p) return p
  // baralho BR sem etiqueta = brasileiro (padrão); EU/MUNDO sem etiqueta = buraco a corrigir
  return baralho === 'BR' ? 'Brasil' : '??'
}

// Ranking das seleções por número de cartas (a régua do Diego: quem tem mais
// cartas no baralho fica na frente — Brasil 1º disparado, e o ranking se
// atualiza sozinho a cada carta nova).
export function rankingSelecoes(): { pais: string; cartas: number }[] {
  const cnt: Record<string, number> = {}
  const walk = (cat: Record<string, { name: string }[]>, b: Baralho) => {
    for (const sec of Object.keys(cat)) for (const c of cat[sec]) {
      const p = paisDe(c.name, b)
      cnt[p] = (cnt[p] ?? 0) + 1
    }
  }
  walk(CATALOG as unknown as Record<string, { name: string }[]>, 'BR')
  walk(CATALOG_EU as unknown as Record<string, { name: string }[]>, 'EU')
  walk(CATALOG_WORLD as unknown as Record<string, { name: string }[]>, 'WORLD')
  // 🚫 '??' (carta EU/MUNDO sem etiqueta de país) NUNCA vira seleção — senão vira um
  // "time" de nacionalidades misturadas no top 16 e empurra as seleções reais pra baixo.
  return Object.entries(cnt).filter(([pais]) => pais !== '??').map(([pais, cartas]) => ({ pais, cartas })).sort((a, b) => b.cartas - a.cartas)
}

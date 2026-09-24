// Artes originais do acervo scripts/kits, publicadas como arquivos separados.
//
// ⚠️ NOME DE ARQUIVO LEVA VERSÃO (-v1, -v2…) — e isto NÃO é frescura. Estes arquivos
// moram em `public/`, então o endereço deles é FIXO: não ganham hash como o resto do
// build. Se a arte muda e o nome não, o navegador continua servindo a VELHA do cache.
// Foi o que aconteceu com o Neymarzetti em 16/09: a camisa branca subiu, o deploy
// fechou verde, e o Diego continuou vendo a preta — *"aquela camisa antiga do
// Neymarzetti porém N quero mais"*. Arte nova = NOME NOVO, sempre.
// Carregadas somente no detalhe do clube; sem manto inventado ou vínculo por e-mail.
export const CAMISAS_SALAO: Record<string, string> = {
  "Al Takhadao FC": "al-takahdao-camisa.webp",
  "Tricolor do Arruda FC": "arruda-camisa.webp",
  "Bagres 1993": "bagres-camisa.webp",
  "Bagres de Wall Street FC": "bagreswallst-camisa.webp",
  "Bicho da Seda": "bichodaseda-camisa.webp",
  "Crias do Bigão": "bigao-camisa.webp",
  "Bonança SSFC": "bonanca-camisa.webp",
  "Briga de Galo FC": "brigadegalo-camisa.webp",
  "Corporação Capsule FC": "capsule-camisa.webp",
  "Fala D10": "falad10-camisa.webp",
  "Final Boss FC": "finalboss-camisa.webp",
  // 🔁 19/09: camisa NOVA (o dono refez a prancha). O nome do arquivo mudou de
  // propósito — endereço fixo é cache de navegador, e quem já tinha aberto a Loja
  // continuaria vendo a camisa velha pra sempre. É o aviso que o `npm run salao` dá.
  "Futpoint FC": "futpoint-camisa-v2.webp",
  "Marreco FC": "marreco-camisa-v1.webp",
  "Pantera Negra FC": "pantera-camisa-v1.webp",
  "Grêmio FBPA": "gremio-camisa-v1.webp", // 🐆👑 com -v1 de propósito: endereço fixo é cache de navegador, e no dia em que a arte trocar quem já abriu a Loja continuaria vendo a velha
  "Rei da Bola FC": "reidabola-camisa-v1.webp",
  "Murriz FC": "murriz-camisa-v1.webp",
  "Nightfull FC": "nightfull-camisa-v1.webp",
  "Barcenite FC": "barcenite-camisa-v1.webp",
  "Scorporila FC": "scorporila-camisa-v1.webp",
  "Marolados FC": "marolados-camisa-v1.webp",
  "Marinheiros AS": "marinheiros-camisa-v1.webp",
  "Raiva Cajuri FC": "raivacajuri-camisa-v1.webp", // 🥊 batismo de 16/09 (feliperamiro0501)
  "Tôka10": "toka10-camisa-v2.webp", // 🧢 arte renovada em 16/09 (ofc.toka10) // 👑🦁 batismo de 16/09 (caiobegnamii)
  "Inter de Bailão": "interbailao-camisa.webp", // 🪩 ex-Alfacehh (renomeado 14/09) — a 1ª camisa de verdade dele no salão
  "Jurubeba FC": "jurubeba-camisa.webp",
  "Leão da Estradinha": "leao-estradinha-camisa.webp",
  "Leite de Verdade FC": "leitedeverdade-camisa.webp",
  "White Thigs do GuGu": "gugu-camisa-v1.webp", // ⚽🥋 o 1º batismo da história — a 1ª camisa de verdade dele na Loja (18/09)
  "Esqueceram do Lluch": "lluch-camisa.webp",
  "Manfré FC": "manfre-camisa.webp",
  "Nova Eclipse FC": "novaeclipse-camisa.webp",
  "Papão United Madrid": "papao-camisa-v2.webp",
  "Seven City": "sevencity-camisa.webp",
  "Sistematizados FC": "sistematizados-camisa.webp",
  "Skyy FC": "skyy-camisa.webp",
  "Só Deus Sabe FC": "sodeussabe-camisa.webp",
  "Stocco FC": "stocco-camisa.webp",
  "Vidraceiro FC": "vidraceiro-camisa.webp",
  "Julia Barranquila": "julia-camisa-v1.webp", // 🦈🔴⚪ com -v1 de propósito: endereço fixo é cache de navegador
  "Fabulous EC": "fabulous-camisa-v1.webp", // 🦅🔴⚫ com -v1 de propósito: endereço fixo é cache de navegador
  "Xurupitas FC": "xurupitas-camisa.webp",
  "Neymarzetti": "neymarzetti-camisa-v2.webp",
  "Milhaça FC": "milhaca.webp",
  "São Luiz FC": "saoluiz-camisa-v2.webp",
  "Theuzudo FC": "theuzudo.webp",
  // ── 🧺 A GAVETA ESQUECIDA (18/09) ─────────────────────────────────────────
  // O Diego pegou: *"a camisa do La Bestia Negra não atualizou"*. Não era cache,
  // nem arte errada: o clube NUNCA esteve nesta lista. A arte que o dono mandou
  // estava parada em `scripts/kits/` desde o dia do batismo — ou seja, o post
  // saiu com a camisa certa e a LOJA DO CLUBE mostrava o molde genérico (camisa
  // creme + escudo de letra). Varrendo os 53 batismos/sócios, o mesmo tinha
  // acontecido com outros quatro. Publicados todos de uma vez aqui.
  "La Bestia Negra": "bestia-camisa-v1.webp",                       // 🦊 eltonfrossard45 (arte do dono desde 09/08; renovada em 18/09)
  "Pesadelo Verde FC": "pesadelo-camisa-v1.webp",                   // 🌑🐺 portaltech.ep (18/09)
  "Fridão FC": "fridao-camisa-v1.webp",                             // 🐴 felipe.ofrida (16/09)
  "São Marcos Antônio FC": "saomarcosantonio-camisa-v1.webp",       // 😇🐷 marcomak03 (13/09)
  "Internacional de Madrid": "internacional-madrid-camisa-v1.webp", // 👑 matheusstefanello372 (14/09)
  "Remoçada": "remocada-camisa-v1.webp",                            // 🦁⚡ luiz.maia.luiz (arte do dono em 18/09)
}

// Janela de exibição das camisas em quatro artes antigas que também têm shorts.
// Mantém o arquivo original e não mostra a parte inferior do conjunto.
export const RECORTE_CAMISA: Record<string, [number, number, number]> = {
  "Leão da Estradinha": [332, 620, 416],
  "Papão United Madrid": [175, 321, 219],
  // 🦇 Neymarzetti saiu daqui em 16/09: a arte NOVA é SÓ A CAMISA (547x700). A velha
  // era o uniforme inteiro (343x620, com calção) e por isso precisava de janela — com
  // a janela ligada, a camisa nova sairia cortada no meio.
  "Milhaça FC": [413, 620, 425],
}

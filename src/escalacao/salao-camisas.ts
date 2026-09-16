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
  "Futpoint FC": "futpoint-camisa.webp",
  "Rei da Bola FC": "reidabola-camisa-v1.webp",
  "Murriz FC": "murriz-camisa-v1.webp",
  "Nightfull FC": "nightfull-camisa-v1.webp",
  "Barcenite FC": "barcenite-camisa-v1.webp",
  "Raiva Cajuri FC": "raivacajuri-camisa-v1.webp", // 🥊 batismo de 16/09 (feliperamiro0501)
  "Tôka10": "toka10-camisa-v2.webp", // 🧢 arte renovada em 16/09 (ofc.toka10) // 👑🦁 batismo de 16/09 (caiobegnamii)
  "Inter de Bailão": "interbailao-camisa.webp", // 🪩 ex-Alfacehh (renomeado 14/09) — a 1ª camisa de verdade dele no salão
  "Jurubeba FC": "jurubeba-camisa.webp",
  "Leão da Estradinha": "leao-estradinha-camisa.webp",
  "Leite de Verdade FC": "leitedeverdade-camisa.webp",
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
  "Xurupitas FC": "xurupitas-camisa.webp",
  "Neymarzetti": "neymarzetti-camisa-v2.webp",
  "Milhaça FC": "milhaca.webp",
  "São Luiz FC": "saoluiz.webp",
  "Theuzudo FC": "theuzudo.webp"
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

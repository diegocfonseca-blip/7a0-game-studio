# Carreira V25 — prévia privada para duas contas

Publicação visual restrita a `diego.c.fonseca@gmail.com` e
`diego.c.fonseca2@gmail.com`, usando a autenticação real do Supabase. O público
continua no fluxo anterior.

## Incluído

- criação de carreira em três passos: clube, presidente e preparação do pregão;
- somente nome e formação 4-3-3/4-4-2 na criação do clube; cor e escudo seguem
  automáticos como na regra atual;
- presidente cosmético opcional no save, compatível com carreiras antigas;
- pregão com ambiente ilustrado, mantendo lista, lotes, lances e revelação reais;
- padrão Oswald, creme, preto, amarelo e roxo nas áreas interativas;
- tratamento responsivo de Jogos, Tabelas, Elenco, Rank, Agência, Patrocínio,
  Estádio e Sala da Presidência;
- Sala da Presidência ligada ao estádio e aos títulos reais do save.

## Preservado

Simulação, contratos, técnicos por divisão, 11 reservas, SAF, patrocínios,
timers, autoridade do host, salvamentos e telas públicas não foram alterados.

## Ainda depende de regra de produto

Editor combinatório de rosto/cabelo/barba, compra de carro/mobília e mapa físico
completo dos troféus. Nenhuma regra, preço ou desbloqueio foi inventado para
essas partes.

## Verificação

`npm run build`, `scripts/check-online-preview.mjs` e
`scripts/checa-vigias-online.mjs` passaram antes do deploy.

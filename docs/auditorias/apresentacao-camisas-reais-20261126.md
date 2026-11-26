# Camisas dos clubes reais na apresentação

Diego aprovou a aparência das camisas de batismo e rejeitou o acabamento dos
clubes reais, usando Flamengo como exemplo. A pintura retangular antiga achatava
o tecido e deixava partes brancas do molde nas mangas e na barra.

## Correção

- O caminho das artes de batismo permanece separado e usa o arquivo aprovado.
- Para camisas geradas, identifica o tecido conectado do molde original, incluindo
  gola, mangas e barra; não depende de um polígono aproximado para pintar as bordas.
- As cores preservam as dobras e sombras da ilustração. Faixas acompanham uma
  deformação suave, com mangas e gola próprias, sem multiplicar tudo até o preto.
- Biblioteca local de identidades clássicas: lisas, listradas, tricolores, faixas
  diagonais, centrais e de peito. As demais receitas aproveitam as cores existentes
  em `SELOS`, com o fallback já usado pelo jogo. Não é um catálogo anual de réplicas.
- Clubes reais com escudo no catálogo público usam essa imagem na camisa. Flamengo
  usa o monograma CRF branco extraído das letras do próprio escudo oficial, sem
  redesenhar as letras e sem modificar o arquivo original.
- Receitas são exclusivas da apresentação: não alteram uniformes das partidas,
  cartas históricas, OVR, economia, saves nem acesso a modos online.
- O tecido é preparado uma vez na montagem da cena; não há processamento de pixels
  no loop da animação, nem nova imagem pesada baixada para cada clube.

## Referências e verificação

Paletas: `selos-clubes.ts`; modelos clássicos estilizados da apresentação em
`cena-contratacao-uniformes.ts`. Escudos: `escudos-oficiais.ts` e os arquivos
existentes em `public/escudos-clubes/`. Referência consultada para Flamengo:
https://ge.globo.com/futebol/times/flamengo/noticia/2025/01/30/flamengo-lanca-uniforme-principal-para-a-temporada-2025-veja-fotos.ghtml
(listras horizontais rubro-negras, mangas escuras e monograma claro).

Evidências: `/workspace/shared/apresentacao-camisas-reais-20261126/`.

- Galeria com o pintor real do jogo: Flamengo, Palmeiras, São Paulo, Fluminense,
  Vasco e Santos. Regressão de pixels detecta restos brancos do molde no Flamengo
  fora do escudo, e verifica a identidade verde do Palmeiras.
- Comparação de pixels das capturas do Futpoint e Neymarzetti com a revisão
  anterior: imagens idênticas nos dois exemplos de batismo aprovados.
- Regressão de tons de pele: Romário, Zico e Pelé.
- Bancada nativa das duas carreiras: móvel 390px, 320px e desktop 1440px;
  reprodução, retorno/retomada, Pular, Rever e Ver elenco.
- Casos de movimento reduzido, falha de imagem/desenho e ausência do avatar.
- Build obrigatório: `npm run build`; trava de recarga: `npm run recarga`.

Reversão pelo commit isolado desta revisão; conservar o fundo grafite já publicado.

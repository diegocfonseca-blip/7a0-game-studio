# 🌎 Quem jogou a Libertadores — lista clube+ano

Regra do Diego (20/08): a carta entra **se o clube dela disputou a Libertadores
naquele ano**. *"Pré N conta se desclassificou"* — quem passou pela pré e chegou
aos grupos conta; quem caiu na pré, não.

## 📋 A FONTE: a lista que o Diego mandou (20/08)

Ele mandou a base histórica **completa, por clube, de TODOS os países, até a
Libertadores de 2026**. Virou a fonte oficial e está guardada crua em
`docs/libertadores-por-clube.txt`. A conta sai de `node scripts/liberta-conta.mjs`.

**Cruzei a parte brasileira dela com a minha pesquisa de 66 anos: 49 anos
bateram exatamente.** Dos 18 que diferiram:
- **A lista dele confirmou 6 correções que eu tinha achado sozinho** — Vasco FORA
  de 1997, Bangu e Coritiba em 1986, e o deslocamento de 2000, 2001 e 2002. Duas
  apurações independentes chegando na mesma correção é o melhor sinal possível.
- **Ela achou um erro meu em 2005**: o certo é Santos, Santo André, Palmeiras,
  São Paulo e Athletico-PR. Corinthians, Goiás e Internacional jogaram foi 2006.
- O resto (1966/67, 1977, 1982, 1984, 1999, 2000, 2023, 2025, 2026) não muda
  carta nenhuma.

## 🔑 O FILTRO OLHA O CLUBE, NÃO O BARALHO

Palavras do Diego: *"N importa a nacionalidade"*. Então a carta entra pelo CLUBE
dela, esteja ela no baralho Brasil, Europa ou Mundo. É isso que traz pro modo
gente como **Higuita (Atlético Nacional 1990)**, **Bochini (Independiente 1984)**,
**Cubillas (Alianza Lima 1978)**, **Marzolini (Boca 1965)**, **Chumpitaz
(Universitario 1975)** e **Caszely (Colo-Colo 1973)** — 30 cartas que já existiam
no jogo e que eu estava deixando de fora à toa.

🏷️ **Cuidado com homônimo**: clube sul-americano com nome igual a europeu leva o
país no nome na lista (`Liverpool (URU)`, `Arsenal de Sarandí`, `Everton (CHI)`,
`Rangers (CHI)`, `Valencia (VEN)`). Sem isso, **o Liverpool da Inglaterra entrava
no baralho da Libertadores** — foram 5 cartas erradas que só apareceram porque eu
fui conferir.

## ✅ O BARALHO FECHA — não precisa inventar jogador

| Posição | Tem | A liga de 20 precisa | |
|---|---|---|---|
| GOL | 35 | 20 | ✅ sobra 15 |
| LAT | 47 | 40 | ✅ sobra 7 |
| ZAG | 44 | 40 | ✅ sobra 4 |
| MEI | 80 | 60 | ✅ sobra 20 |
| ATA | 93 | 60 | ✅ sobra 33 |

**299 cartas · 17 lendas · 68 craques.** Aqueles 7 jogadores que faltavam
(4 laterais e 3 zagueiros) **não precisam mais ser criados**: eles já estavam no
jogo, só não estavam sendo vistos porque o filtro olhava o baralho em vez do
clube.

## Os anos

| Ano | Brasileiros na Libertadores | Estado |
|---|---|---|
| 1938–1959 | ⛔ a Libertadores só começou em 1960 | ✅ |
| 1960 | Bahia | ✅ |
| 1961 | Palmeiras | ✅ |
| 1962 | Santos | ✅ |
| 1963 | Santos, Botafogo | ✅ |
| 1964 | Santos, Bahia | ✅ |
| 1965 | Santos | ✅ |
| 1966 | ⛔ nenhum clube brasileiro | ✅ |
| 1967 | Cruzeiro | ✅ |
| 1968 | Palmeiras, Náutico | ✅ |
| 1969 | ⛔ nenhum clube brasileiro | ✅ |
| 1970 | ⛔ nenhum clube brasileiro | ✅ |
| 1971 | Palmeiras, Fluminense | ✅ |
| 1972 | São Paulo, Atlético-MG | ✅ |
| 1973 | Palmeiras, Botafogo | ✅ |
| 1974 | Palmeiras, São Paulo | ✅ |
| 1975 | Cruzeiro, Vasco | ✅ |
| 1976 | Cruzeiro, Internacional | ✅ |
| 1977 | Corinthians, Cruzeiro, Internacional | ✅ |
| 1978 | São Paulo, Atlético-MG | ✅ |
| 1979 | Palmeiras, Guarani | ✅ |
| 1980 | Internacional, Vasco | ✅ |
| 1981 | Flamengo, Atlético-MG | ✅ |
| 1982 | São Paulo, Flamengo, Grêmio | ✅ |
| 1983 | Flamengo, Grêmio | ✅ |
| 1984 | Flamengo, Grêmio, Santos | ✅ |
| 1985 | Fluminense, Vasco | ✅ |
| 1986 | Coritiba, Bangu | ✅ |
| 1987 | São Paulo, Guarani | ✅ |
| 1988 | Guarani, Sport | ✅ |
| 1989 | Internacional, Bahia | ✅ |
| 1990 | Grêmio, Vasco | ✅ |
| 1991 | Flamengo, Corinthians | ✅ |
| 1992 | São Paulo, Criciúma | ✅ |
| 1993 | São Paulo, Flamengo, Internacional | ✅ |
| 1994 | Palmeiras, São Paulo, Cruzeiro | ✅ |
| 1995 | Palmeiras, Grêmio | ✅ |
| 1996 | Grêmio, Corinthians, Botafogo | ✅ |
| 1997 | Grêmio, Cruzeiro | ✅ |
| 1998 | Grêmio, Cruzeiro, Vasco | ✅ |
| 1999 | Palmeiras, Corinthians, Vasco | ✅ |
| 2000 | Palmeiras, Corinthians, Atlético-MG, Athletico-PR, Juventude | ✅ |
| 2001 | Palmeiras, Cruzeiro, Vasco, São Caetano | ✅ |
| 2002 | Flamengo, Grêmio, Athletico-PR, São Caetano | ✅ |
| 2003 | Grêmio, Corinthians, Santos, Paysandu | ✅ |
| 2004 | São Paulo, Cruzeiro, Santos, São Caetano, Coritiba | ✅ |
| 2005 | Palmeiras, São Paulo, Santos, Athletico-PR, Santo André | ✅ |
| 2006 | Palmeiras, São Paulo, Corinthians, Internacional, Goiás, Paulista | ✅ |
| 2007 | São Paulo, Flamengo, Grêmio, Santos, Internacional, Paraná | ✅ |
| 2008 | São Paulo, Flamengo, Cruzeiro, Santos, Fluminense | ✅ |
| 2009 | Palmeiras, São Paulo, Grêmio, Cruzeiro, Sport | ✅ |
| 2010 | São Paulo, Flamengo, Corinthians, Cruzeiro, Internacional | ✅ |
| 2011 | Grêmio, Cruzeiro, Santos, Internacional, Fluminense — **Corinthians NÃO** (caiu na pré) | ✅ |
| 2012 | Flamengo, Corinthians, Santos, Internacional, Fluminense, Vasco | ✅ |
| 2013 | Palmeiras, São Paulo, Grêmio, Corinthians, Atlético-MG, Fluminense | ✅ |
| 2014 | Flamengo, Grêmio, Cruzeiro, Atlético-MG, Athletico-PR, Botafogo | ✅ |
| 2015 | São Paulo, Corinthians, Cruzeiro, Internacional, Atlético-MG | ✅ |
| 2016 | Palmeiras, São Paulo, Grêmio, Corinthians, Atlético-MG | ✅ |
| 2017 | Palmeiras, Flamengo, Grêmio, Santos, Atlético-MG, Athletico-PR, Botafogo, Chapecoense | ✅ |
| 2018 | Palmeiras, Flamengo, Grêmio, Corinthians, Cruzeiro, Santos, Vasco, Chapecoense | ✅ |
| 2019 | Palmeiras, São Paulo, Flamengo, Grêmio, Cruzeiro, Internacional, Atlético-MG, Athletico-PR | ✅ |
| 2020 | Palmeiras, São Paulo, Flamengo, Grêmio, Santos, Internacional, Athletico-PR — **Corinthians NÃO** (caiu na pré) | ✅ |
| 2021 | Palmeiras, São Paulo, Flamengo, Santos, Internacional, Atlético-MG, Fluminense — **Grêmio NÃO** (caiu na pré) | ✅ |
| 2022 | Palmeiras, Flamengo, Corinthians, Atlético-MG, Athletico-PR, Fortaleza, Red Bull Bragantino, América-MG — **Fluminense NÃO** (caiu na pré) | ✅ |
| 2023 | Palmeiras, Flamengo, Corinthians, Internacional, Atlético-MG, Fluminense, Athletico-PR, Fortaleza | ✅ |
| 2024 | Palmeiras, São Paulo, Flamengo, Grêmio, Atlético-MG, Fluminense, Botafogo — **Red Bull Bragantino NÃO** (caiu na pré) | ✅ |
| 2025 | Palmeiras, São Paulo, Flamengo, Corinthians, Internacional, Botafogo, Bahia, Fortaleza | ✅ |
| 2026 | Palmeiras, Flamengo, Corinthians, Cruzeiro, Fluminense, Botafogo, Bahia, Mirassol | ✅ |

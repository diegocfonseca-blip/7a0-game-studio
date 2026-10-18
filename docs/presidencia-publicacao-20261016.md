# Publicação privada da Presidência — 16/10/2026

## Retomada da publicação — 18/10/2026

Diego pediu para seguir com a publicação. O envio anterior não ocorreu: a
main havia avançado durante os testes e o Git recusou a sobrescrita. O trabalho
salvo foi recuperado e a main atual `6716bb2e` está sendo incorporada, mantendo
Pregão Aberto, patrocínios, compras e demais mudanças já publicadas.

O editor de personagem foi liberado para todos em outra entrega da main;
essa regra é preservada. Ela é independente do acesso às novas telas 3D do
estádio/sala e ao futebol aprimorado, que continuam apenas para a conta
verificada `diego.c.fonseca@gmail.com`. O traje real segue exclusivo de Fundador.

A narração unificada no Rádio Legends também foi preservada. Na prévia privada,
o rádio mostra as fases reais de domínio/passe/condução/chute e só anuncia o
gol no impacto. O minuto vem da fila cronológica dos gols; mudar de conta
limpa a memória da fala anterior. As frases de incidentes ainda não simulados
continuam fora da narração privada. O restante deste documento registra os
testes e o pacote originais; a validação desta integração terá arquivos datados
de 18/10 em `test-results/complexo-3d/`, e a confirmação do deploy será registrada
em `test-results/complexo-3d/publicacao-deploy-20261018.json`.

Validação concluída em 18/10: build de produção PASS (TypeScript + Vite),
gate de conta PASS, catálogo/plano do presidente PASS e 6.144 combinações
de estádio/mapa PASS. Navegador desktop/celular PASS, incluindo logout,
calendário, obras, 22 atletas e ausência de escrita na carreira.

Os testes de fases, eventos e transições de acesso passaram com o rádio novo:
12 fases físicas, seis velocidades, quatro desfechos, gols desordenados na
entrada com minuto correto, nenhum anúncio antes do impacto e imports antigos
cancelados. Detectaram uma chance privada que podia persistir como fala anterior
após sair da conta; a renderização agora ignora seu relógio quando o acesso é
revogado, e a repetição passou. Os relatórios de futebol conservam o nome
`*-browser-20261016.json`, com atualização de 18/10. Build final isolado em
`/tmp/presidencia-publicacao-20261018-final`, sem páginas de QA; log em
`test-results/complexo-3d/publicacao-build-final-20261018.log`.

Durante o envio, a main recebeu também `ed264511` (Amigos e perfil público
em teste). Essa entrega foi preservada integralmente; só houve conflito na
ordenação da documentação. Não alterou os módulos do estádio, sala ou motor.
O build da integração fica em
`test-results/complexo-3d/publicacao-build-amigos-20261018.log`.

## Autorização e escopo originais

Diego autorizou: “Publique tudo q fez ate o momento no meu usuarion”.
O pedido inclui o trabalho acumulado desde a entrega de 15/10 e substitui
os registros históricos que diziam “local, sem commit/deploy”. A publicação
é feita no site compartilhado; as novas telas e o futebol aprimorado continuam
restritos à conta verificada `diego.c.fonseca@gmail.com`.

## Pacote preservado

- Estádio e mapa evolutivos, etapas, estacionamento, transporte e percursos
  existentes; sala 3D e janela com a geometria e iluminação reais do estádio.
- Revisão do motor: relógio compartilhado, continuidade de domínio, passe,
  condução e finalização, reposições e contato físico dos pés com a bola.
- Presidente com as camadas originais do criador, respeitando roupa, pele,
  cabelo, barba, acessórios e pose. A arte frontal tem profundidade na sala;
  ainda não é um personagem volumétrico com vista de 360 graus.
- Jogadores, pedestres, passageiros e torcida com volumes, roupas, cabelo
  e calçados refinados, todos sem olhos, nariz ou boca. Instâncias reduzem
  as chamadas de desenho sem trocar os trajetos e a escala existentes.

O pacote está em `56d8d4c5`; o merge `bf4001ce` preserva a main até
`44c33a64`, incluindo compras, catálogo do presidente e correção do cabelo
Pirlo. O conflito de documentação foi resolvido mantendo ambos os registros.
Não há migração de banco nem alteração de dados da conta nesta publicação.

Antes do envio, a main avançou novamente para `94e4ea04` (Pregão Aberto e
aviso da loja). Essa atualização também foi integrada, sem sobrescrita.
As telas e regras da Presidência não tiveram novos conflitos de código.

## Verificações

- Acesso: email verificado, outra conta recusada, logout e troca de conta,
  respostas atrasadas e falha de autenticação. A segunda conta de Diego
  continua sem acesso às novas telas do estádio; o editor conserva as regras
  que já estavam na main.
- Catálogo: planos e roupas especiais preservados; 330 combinações do
  presidente e 95 fontes originais, incluindo a camada nova do cabelo.
- Arte: 66 combinações de roupa/pose e 16 comparações com o editor original.
- Estádio/mapa: 2.048 combinações de estádio, 4.096 de mapa e pré-requisitos
  de compra pelo reducer real.
- Futebol: troca privado/público durante lance, importação assíncrona,
  impacto sem duplicação e identidade do assistente na simulação real.
- Navegador: PASS em desktop (1.400 px) e celular emulado (390 px, DPR 2),
  com acesso privado, logout, calendário quarta/noite e domingo/dia, câmera
  preservada, estacionamento, várzea com 22 atletas e carreira sem alterações.
- Build de produção: PASS em TypeScript e Vite com `DEPLOY_BASE=/` e
  `VITE_ONLY_GAME=escalacao`; páginas de QA ausentes do resultado.
- Os testes físicos e capturas de acabamento anteriores estão registrados
  nos documentos de cada entrega abaixo. A conferência final de navegador
  está em `test-results/complexo-3d/publicacao-browser-20261016.log`; o build,
  em `test-results/complexo-3d/publicacao-build-20261016.log`.

A verificação de acesso usa o hook real com um cliente de rede simulado em
ambiente local. Não foi feito login na conta real de Diego. As páginas locais
de QA e os relatórios de teste não entram no build publicado.

## Confirmação da publicação e limites

A autorização não significa deploy concluído: conferir a execução do GitHub
Pages correspondente ao commit final. A evidência operacional será guardada
em `test-results/complexo-3d/publicacao-deploy-20261016.json`, com commit,
execução, URL e resultado. Não confundir o deploy anterior de 15/10 com este.

Esta é a publicação do que foi feito até agora, não o encerramento de todo
o projeto. Faltas, impedimentos, disputas aéreas, jogadas ensaiadas e física
livre completa continuam pendentes. Também permanecem limites de acabamento
e de representação da massa da torcida documentados nas entregas.

Referências:

- [Revisão do motor, etapas e janela](presidencia-revisao-motor-etapas-janela-20261015.md)
- [Revisão do futebol](presidencia-futebol-revisao-20261016.md)
- [Jogadas contínuas](presidencia-jogadas-continuas-20261016.md)
- [Sala 3D unificada](presidencia-sala-unificada-20261016.md)
- [Personagem original](presidencia-personagem-original-20261016.md)
- [Acabamento dos jogadores e NPCs](presidencia-humanos-acabamento-20261016.md)

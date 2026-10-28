# Proposta isolada — domínio de lançamento com espaço

Base: `a2fb4f5f`, ramo oficial de trabalho `fix/fundamentos-mapa-20261028`,
sem alterações adicionais. Experimento em `experiment/recepcao-aerea-20261028`,
no checkout `/workspace/leilao-recepcao-contextual`. Não integrar ou publicar
automaticamente: o usuário pediu para preservar o motor oficial de resultados.

## Diagnóstico do vídeo

O lançamento de Oséas para Cuadrado começa aos 83,90 s da semente local 1.
Aos 85,80 s, a bola chega a 2,227 m; o adversário mais próximo está a 8,409 m.
`Motor2.disputas()` chama `cabeceia()` para toda bola acima de 1,50 m. Fora
da área, `cabeceia()` devolve para o companheiro mais próximo. A decisão vem
da fonte, não de uma escolha errada de clipe no 3D.

Trocar apenas a animação por domínio faria os modos mostrarem ações diferentes.
A regra precisa avaliar o contexto antes de decidir o contato.

## Correção proposta

`recepcao-aerea.ts` identifica um passe do companheiro com espaço para receber.
Mantém finalizações na área, disputas iminentes, cortes defensivos e a lógica
dos goleiros. Considera distância, aproximação dos adversários e tempo de queda.
Usa as dimensões e contas determinísticas já existentes, sem novo sorteio.

O receptor antecipa o ponto onde a bola estará na altura de domínio. Enquanto
ela desce, esperar não consome tentativa de contato. A qualidade do domínio,
perda da bola, atributos e próximas decisões continuam nas rotinas existentes.

Esta primeira proposta usa domínio com os pés. Não simula contato de peito:
isso exige uma fase física de amortecimento que ainda não foi implementada.

## Testes

- Casos de decisão: passe livre, adversário próximo, adversário chegando,
  cruzamento na área, corte defensivo, goleiro, finalização e imutabilidade.
- Dezesseis partidas inteiras antes/depois, com 22 atletas iniciais e expulsões
  preservadas: encerramento, valores finitos e diagnósticos do motor conferidos.
- Comparação do mesmo lance: a proposta só entra aos 83 s na instrumentação
  da bancada. O estado e os eventos anteriores são idênticos. Cuadrado domina
  aos 86,05 s, com a bola no chão a 0,123 m do centro do jogador; toca para
  Júnior Baiano aos 86,55 s. Sem cabeceio automático nesse recebimento.
- Captura WebGL real no mesmo módulo do campo do mapa, com 22 personagens:
  o contato do pé na malha é medido e confirmado. Eventos desenhados coincidem
  com o motor usado em cada teste. A proposta não pode ser comparada como se
  preservasse todos os eventos do motor anterior.
- Limpeza matemática posterior verificada contra todos os registros da
  auditoria: mesmos contatos, decisões, placares e estados iniciais.
- Build TypeScript/Vite validado.
- Suíte existente `testa-motor2.mts`: 300 jogos de times parecidos e 100 de
  forte contra fraco, determinismo e regras dentro das faixas da trava. Foram
  registrados 24 reinícios sem a distância exigida nos 300 jogos; a própria
  trava admite esse resíduo. A base registrou 16. Esse aumento precisa ser
  acompanhado antes de integrar; aprovação da trava não significa regressão
  zero. Não se declara futebol sem outros problemas.

Na mesma suíte, gols por jogo passaram de 1,75 para 1,70, passes certos de
83% para 84% e vitórias do time forte de 76% para 81% (100 confrontos). São
observações dessa amostra, não prova de equilíbrio competitivo inalterado.

Artefatos em `/workspace/shared/recepcao-aerea-v7-20261028/entrega`:
vídeo antes/depois, câmera lenta, revisão HTML e diagnóstico.

## Impacto e condição para integração

Oito das 16 partidas mudaram de placar quando a proposta foi aplicada desde
o início. Isso é esperado ao mudar uma decisão que altera posse e sequência
de jogadas, mas impede tratar a mudança como refinamento puramente visual.

Nenhum arquivo do checkout de trabalho anterior foi modificado. Não houve
escrita em save, banco, resultado oficial ou publicação. Não há alteração de
overalls, categorias, descanso ou probabilidades explícitas; o efeito indireto
nas partidas existe e foi medido.

Antes de integrar, obter autorização para mudar a decisão do motor e preparar
versionamento da entrada e do cache compartilhado por 2D, 3D e placar cinema.
Partidas já registradas precisam manter a versão de origem. Esta proposta
não contém essa migração e não deve ser incorporada como atualização global.

## Reprodução

Vite da base na porta 5301; Vite do experimento na porta 5309, ambos com base `/`.

```sh
node scripts/futebol3d/testa-recepcao-aerea.mjs
node scripts/futebol3d/audita-recepcao-v7.cjs
node scripts/futebol3d/grava-recepcao-v7.cjs
node scripts/futebol3d/monta-revisao-recepcao-v7.cjs
npm run build
npm run motor2
```

`recepcao-experimento.cjs` só instrumenta o módulo servido ao navegador de
testes para comparar a mesma jogada a partir dos 83 s; não é importado pelo jogo.

# Critérios da carreira — correções aprovadas em 08/11/2026

Diego aprovou todos os pontos da análise com “Pode fszer tudo”. Implementação em branch isolada, sem publicação e sem nova gravação na conta. O teste integrado usa cópias locais; o avanço de teste T48–T50 não deve ser enviado à nuvem.

## O que foi corrigido

1. **Identidade da carta:** o cache considera nome, clube, ano, posição, categoria, faixa, condição e ordem do XI, além de semente, clima, tática, formação e comissão. Duas cartas homônimas não compartilham resultado por engano. A assinatura antiga continua disponível somente para ler jogos já disputados.
2. **Desgaste antes do desbloqueio:** antes de chegar à Série C, o histórico de jogos/gols/assistências continua, mas o gás não acumula perda escondida. O primeiro desbloqueio começa inteiro. Uma carreira que já desbloqueou mantém a condição após cair de divisão.
3. **Condição aplicada uma vez:** na versão nova, o desconto já incorporado à faixa não gera outra penalidade na entrada do Motor 2. O desgaste durante o jogo permanece. A recuperação do banco usa o preparador contratado, como a própria barra de condição.
4. **Critério dos bots:** partidas da liga sem humano continuam leves. Sua expectativa de gols usa o mesmo perfil e nível do dia derivados da carta, técnico, evento, tática e clima. A projeção foi ajustada ao Motor 2; não adiciona gols ao jogo físico nem escolhe vencedor. A versão nova não usa o antigo reforço oculto da simulação leve.
5. **Continuidade:** temporadas existentes mantêm seu cálculo; a versão nova começa na próxima virada. Nova carreira começa com ela. As entradas efetivas dos jogos oficiais são gravadas compactas, junto dos placares. Prévia futura não vira jogo oficial. O leitor de catálogo não modifica essas fotografias: antes, ele retirava descontos de condição ao reabrir e mudava a reprodução/classificação.
6. **Acesso/queda:** as regras verificadas não mudaram. O desfecho explica posição e divisão de destino; campeão da Série A não recebe mensagem de promoção. Os quatro primeiros sobem e os quatro últimos caem, respeitados os extremos.
7. **Compromissos:** antes do lance e da renovação aparecem desembolso, novo salário quando houver, folha e saldo após reservar a folha. A conta usa a mesma função-base da cobrança. A referência de renovação é explicitamente condicionada ao valor oficial futuro. Não muda preço, salário, cobrança nem consequência de dívida. Receitas futuras e empréstimos compartilhados da SAF são informados como contas separadas.
8. **Leitura do XI:** seção expansível no Elenco mostra quantidade por setor, condição e vagas fracas. Faixas numéricas seguem o direito dos olheiros: Ouro, ou Prata quando o XI não contém lendas. Stream não revela os novos custos.
9. **Sondagem:** rejeita preenchimentos genéricos, crias e emprestados na validação do reducer, sem depender apenas da tela.

**Copa:** calcular o chaveamento apenas consulta o histórico. A fotografia é oficializada ao apresentar a partida ou concluir/pular sua fase; fases futuras continuam aceitando escalação. Restaurar outra cópia do mesmo save limpa fotografias ausentes da memória.

**Intervalo:** a fotografia do jogo não pode bloquear uma decisão legítima do técnico. Só o último confronto ainda aberto aceita revisões numeradas do segundo tempo. Primeiro tempo, cartas iniciais e regras ficam preservados. O carregador seleciona a revisão mais recente independentemente da ordem de chaves do JSON. A tática do intervalo entra no segundo tempo na versão nova; históricos encerrados não mudam.

## Limites do escopo

Somente carreira solo de futebol adere aos critérios novos. Não altera regras das salas online, carreira online v2 ou basquete. Overalls do catálogo, categorias, preços, prêmios e probabilidades não recebem bônus para o usuário. As faixas diárias continuam variáveis. Não altera permissões do mapa, campo 2D/3D ou recepção experimental: a composição de versões mantém a liberação privada existente.

Não há migração de banco, canal realtime, consulta periódica, dependência de execução nem arte nova. A calibração roda offline; o navegador só calcula uma projeção pequena e reutiliza cache limitado. O save guarda as entradas de jogos oficiais da temporada atual e anterior, conforme a retenção já existente; não grava as simulações futuras.

## Evidências e reprodução

- `npm run build`: TypeScript e pacote de produção.
- `npm run criterios-carreira`: identidade de cartas, fixture serializada do código anterior, salvamento/reprodução, intervalo, versão e rollback, simetria/força da projeção e transições reais do reducer com dados sintéticos.
- `scripts/testa-motor2.mts 300`: física, determinismo e progressão de força passaram em execução compilada com o Rolldown já instalado (~59 ms por jogo na máquina). O Jiti acrescentou custo ao executar esse benchmark e ultrapassou a régua de150 ms; a mesma fonte compilada, sem alterar nenhuma asserção, passou.
- `scripts/testa-condicao.mjs`, `scripts/checa-piramide.mjs`, `scripts/testa-escalacao-ab-motor.mjs`, `scripts/testa-storage.mts`: condição, divisões completas, escalação/validação de posição e proteção do armazenamento.
- Nesta máquina, TypeScript direto foi executado com o Jiti já instalado: `node node_modules/jiti/lib/jiti-cli.mjs scripts/testa-criterios-carreira.mts 0` e o equivalente dos demais testes TS; sem instalar dependências.
- Bancada de navegador com componentes/reducer reais, chamadas externas bloqueadas: 320/393/1440 px, custos antes do lance, renovação efetiva, modo stream e reabertura. Arquivos privados de conta e harness locais não entram no commit.

### Calibração

Amostra determinística de 600 jogos físicos, cinco formações, categorias de 1 a 5, táticas e clima; 480 usados no ajuste e 120 separados para validação. Nos 120 separados: 1,375 gol/jogo físico e 1,622 na projeção. É aproximação estatística, não equivalência lance a lance; diferença de cerca de 18% nesta amostra, com variância de contagens baixas.

Controle adicional: dez sementes, duas versões, vinte temporadas completas com cartas reais e elencos equivalentes, incluindo a mesma ordem posicional. Média de gols por temporada: antes usuário 23,4 × bots 47,69; depois usuário 25,8 × bots 24,68. Pontos médios do usuário 53,4 → 53,3; empates 14,4 → 14,6 (bots 9,38 → 14,53). Aproximar critérios não significa facilitar vitória. Tempo médio observado cerca de 1,7 s por temporada completa nas duas versões nessa bancada; não é promessa de desempenho em qualquer celular.

Reprodução da amostra: `npm run criterios-amostra`. Saída em `$CARREIRA_TEST_OUTPUT` ou diretório temporário `leilao-criterios`. Ajuste offline: `python scripts/ajusta-calibracao-carreira.py /caminho/amostra-calibracao.json` (NumPy somente na bancada). O fixture de validação versionado guarda as 120 observações. Coeficientes da versão 1 são imutáveis: recalibrar exige nova versão e nova fronteira de temporada.

### Temporadas e histórico

Cópia do quarto save, originalmente T47/Série A, avançada pelo fluxo real: T48 3º/63 pontos, T49 2º/71, T50 3º/60. T50 fechou com 37 GF, 27 GA e caixa 3502. Ao salvar e reabrir duas vezes, esses valores e todas as tabelas permaneceram iguais. Temporada antiga T47 manteve 5º/58 pontos e caixa 2044. Uma quarta temporada adicional T51 terminou em 9º/51 pontos, 38 GF/33 GA, caixa3747, com duas partidas da Copa registradas após as respectivas fases; reabertura com todas as tabelas idênticas. A conta real continua em T47; não recebeu progresso desta bancada.

O teste de renovação apresentou custo 15 com caixa 5: depois do clique, caixa −10 e folha 86 inalterada, conforme a regra existente de permitir dívida. O exemplo de compra 90, salário 9, caixa 120 mostrou folha total 95 e reserva −65; 320/393/1440 px sem transbordamento. Cópia T50 serializada: cerca de 1,36 MB, incluindo todo o histórico e 86 fotografias de duas temporadas. Não equivale a baixar 1,36 MB por quadro ou requisição de jogo.

Evidências locais em `/workspace/shared/carreira-correcoes-20261108/`: JSON dos controles e da reabertura, capturas desktop/mobile, progresso das temporadas e relatórios de calibração. Cópias integrais do save são privadas, não devem ser anexadas a PR pública.

## Reversão segura

Antes de publicar, reverter o commit descarta a implementação sem tocar a conta. Depois de existirem saves com a versão nova, **não remover seus leitores nem restaurar o motor antigo por cima**. Para parar novas adesões, `CRITERIOS_CARREIRA_LIBERADOS=false`: a próxima virada marca `criteriosCarreiraAte`; temporadas já iniciadas e partidas guardadas seguem sua versão. Os campos são limpos numa carreira nova. Reativação de uma carreira com intervalo encerrado requer uma nova versão/época deliberada, não apagar o marcador de fim.

## Limitações conhecidas

O formato antigo não guardava todos os atributos usados em cada partida. Seus placares serializados continuam valendo, mas uma reprodução exata de entradas antigas ausentes não pode ser reconstruída com certeza. A fotografia nova resolve isso para partidas futuras. A análise de acesso/queda não encontrou troca irregular nas 74 transições verificadas; não foi criada uma regra de proteção contra rebaixamento. A amostra de calibração e três temporadas integradas não provam equilíbrio perfeito para todo elenco; continuar acompanhando sem mudar coeficientes no meio da temporada.

# Carreira Brasil Oficial: travamentos — 28/11/2026

Diego recebeu relatos de várias pessoas, sem conta, dispositivo ou etapa identificados. Pediu análise geral. Não atribuir a uma conta específica nem declarar que toda trava foi resolvida. O trabalho está isolado da prévia Co2 pendente em outro checkout.

## Problemas encontrados e corrigidos localmente

### 1. Atualizações de metadados reconstruíam o mundo

`GUARDA_M2`, `OFICIAL_CALENDARIO_FISICO` e `OFICIAL_COPA_FISICA` passavam pela cópia JSON da carreira inteira. Mesmo sem mudar jogador/tática, substituíam as referências de `cpuSquads`, escalações, técnicos e outros dados. Isso invalidava os cálculos memorizados de ligas/copas. Também se copiava antes de descobrir que um pacote já estava registrado.

Essas três ações agora atualizam apenas seus próprios campos e retornam o mesmo estado quando repetidas. O resultado já confirmado continua prevalecendo; atual/anterior permanecem guardadas, com a mesma retenção. Registro físico não reaplica desgaste de uma partida já registrada. A nova temporada e as guardas de gestão/online continuam valendo. Nenhuma alteração salarial, de OVR, catálogo, sorteio ou economia.

### 2. Mesma rodada calculada repetidamente

Tabela, revisão, agenda e coletiva consultavam alturas iguais da mesma simulação separadamente. A função agora mantém até seis resultados recentes, por conjunto de entradas. Mudança de tática, elenco, decisões, calendário físico ou temporada recria o cache pelas mesmas dependências da função anterior. Não é cache global de contas nem histórico ilimitado. Leitores existentes foram revisados: esses retornos são consultados, não modificados.

### 3. Tática nova confundida com retomada de save

Reprodução no 2D, Flamengo/T6/B/R10: três trocas; reabrir painel aos5′; mudar a tática para Retranca. O limite para recuperar decisões era calculado a partir de TODAS as ordens correntes. O instante preciso do motor pode estar adiante do minuto inteiro mostrado. A ordem recém-dada era interpretada como decisão de save antigo; `subPossivel` caía e o efeito fechava o painel/soltava a pausa. A bancada que esperava “Voltar ao jogo” terminou esperando até90s e encontrou o jogo encerrado e a coletiva aberta. Essa reprodução não é prova de que os relatos sem conta têm exatamente esta causa.

Agora o limite de recuperação é capturado quando se abre um confronto elegível, usando só as decisões que já existiam. Ordens novas não ampliam esse limite nem fecham o painel. Reabrir um save em um novo componente continua recuperando até o último instante salvo antes de permitir novas decisões. A identidade da partida separa liga/copa/fase e temporada; protocolo Co2 continua usando sua própria autoridade.

## Verificação

- `scripts/teste-travas-br-oficial/metadados.mjs`: estado anterior congelado, retenção, primeiro resultado prevalece, cem repetições sem clone, referências de elenco/economia/tática preservadas, calendário e físico de copa idempotentes, guardas de temporada/online e limite/recriação do cache.
- `perfil.mjs`: cliente compilado,390px, CPU limitada4×, sete cenários: Flamengo/T1/A/R1, Flamengo/T6/B/R10, Flamengo/T6/A/R30, Flamengo/T6/B/R38, Santa Cruz/T6/C/R23, Brasiliense/T6/D/R15 e Portuguesa/T6/D/R23. Nenhuma exceção de página; C/D sem partida na data podem estar legitimamente nos dias do calendário; copa antes de escolher/iniciar permanece no0′. Não classificar essas esperas como congelamento.
- Duas compilações da mesma bancada: referência `3f260da5` e correção. `comparar.mjs` conferiu igualdade completa dos placares, autores, tabelas e agenda nos sete casos. Não usar variação de um perfil de CPU isolado como ganho percentual de FPS. O perfil de desenvolvimento original mostrou custo de JSX de desenvolvimento e não representa o produto compilado.
- `scripts/teste-travas-carreira/ciclo-publicacao.mjs`: reducer/tela reais, pausa, seleção/desmarcação, três trocas, quarta recusada, tática, XI fixo e histórico preservados, retomada e apito. O teste foi atualizado para os controles atuais e a revisão pós-jogo, e compara campos de persistência com semântica JSON (opcional ausente/undefined). Inclui a regressão explícita de manter painel e minuto parados após tática nova.
  - Passaram Placar e 2D em390px, última rodada no desktop e 3D no desktop. O 3D iniciou pela escolha da Central, resolveu o desfalque pré-jogo pelo Elenco, terminou a abertura e iniciou o confronto seguinte com22 atores reais da cena. Conferiu nomes dos reservas na cena após as três trocas e chegou ao apito sem exceção. Atualização da bancada: não procurar o Campo3D enquanto está na revisão pós-jogo ou resolvendo a lesão.
- `scripts/teste-lesao-partida/runtime.mjs` com `LESOES_CASE=2d`: reserva real, pausa, retirada, proteção de decisões futuras ao retomar e lesão no elenco seguinte.
- Salvamento:49 verificações do serviço real/Worker/IndexedDB com API fictícia, contas distintas, conflito, retorno e erro de rede. Sem acesso a saves reais ou gravação em produção.
- Motor2:300 partidas de regressão; velocidade absoluta2D; modelo de partidas Co2 preserva três trocas por lado e placares/autores/tabelas. Não foi alterado o núcleo do motor.
- `npm run build` completo e `npm run recarga`; `git diff --check`.

Perfis/capturas são de bancada, não do S25 físico nem de uma conta afetada. O 3D usa WebGL/SwiftShader para conferir execução, sem declarar FPS de telefone. APIs externas ficam bloqueadas no navegador de teste; mensagens de recurso externo bloqueado não são exceções do jogo.

## Estado

Correções locais, sem publicação, migração de banco ou alteração de saves de usuários. Conferir relatório final de execução antes de publicar. A liberação da prévia Co2 do pedido anterior continua pendente e não foi incluída. Reversão por commit isolado, sem descartar progresso ou recarregar clientes automaticamente.

Artefatos: `/workspace/shared/auditoria-br-oficial-20261128/` e `/tmp/auditoria-br-oficial-20261127/`.

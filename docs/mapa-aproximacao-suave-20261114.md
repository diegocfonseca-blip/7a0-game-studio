# Aproximação suave dos estabelecimentos — 14/11/2026

Diego esclareceu que prefere ver o estabelecimento de perto ao tocar, desde que a câmera não mude bruscamente e seja fácil voltar à visão inicial. Substitui a etapa anterior de abrir somente o cartão e depois apertar “Ver de perto”. Mantém etiquetas pequenas e a prévia exclusivamente na conta dele.

- Etiqueta, prédio e menu aproximam automaticamente em cerca de um segundo, com início e fim graduais. A direção de observação é preservada: o mapa não vira para o outro lado ao selecionar o museu.
- O cartão abre junto. O botão extra “Ver de perto” é retirado; o futebol do Grêmio mantém sua ação específica para assistir ao jogo no campo.
- “Visão inicial” continua sempre no topo e volta suavemente ao enquadramento de abertura, restaurando também o modo de arrastar. Home faz o mesmo. Fechar o cartão retorna suavemente à vista anterior.
- Arrastar, dar zoom ou escolher outro destino interrompe/substitui o movimento sem prender o controle. O movimento usa o laço de desenho existente; não cria temporizadores ou atualizações de dados. Respeita a preferência de movimento reduzido do aparelho.
- Não altera relógio, partidas, finanças, saves, autenticação ou banco. Chave pública do mapa continua desligada.

Conferência: teste determinístico com 1.001 quadros, monotonicidade, direção, cancelamento e troca de destino; navegador local de 1440, 390 e 320 px com museu, loja, agência, shopping, Vadico, Grêmio, hotel, feira e boteco; aproximação automática, ausência de salto inicial, fechamento/retorno, interrupção, tecla Home, movimento reduzido e save inalterado. Imagens e relatório em `/workspace/shared/mapa-aproximacao-suave-20261114/`.

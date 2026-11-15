# Passeio livre — melhorias aprovadas em 14/11/2026

Diego aprovou todas as recomendações do passeio. Depois esclareceu: os NPCs continuam; conversa com usuários reais somente se não houver custo adicional. Esta entrega implementa o passeio local. Não adiciona multiplayer ou chat.

## O que mudou

- “Passeio livre” com seletor de destino opcional: portão, casa, loja/terreno, gestão, patrocínios, agência e museu, conforme disponibilidade. A seta e a distância acompanham apenas o destino escolhido. Escolher um local não teleporta nem inicia viagem automática. O atalho antigo do portão continua disponível.
- Centralizar recupera a direção atrás do personagem. A câmera é limitada pelos volumes sólidos registrados, encurtando quando encontra fachadas e voltando gradualmente à distância normal. Ao sair, a câmera retorna à vista anterior usando a transição do mapa e respeitando movimento reduzido; gesto do usuário pode interromper.
- Perto das portas do clube, aparece uma única ação contextual. Ela para o personagem e chama os painéis existentes, com as mesmas compras, desbloqueios e permissões. Loja ainda não construída aponta para as melhorias; não concede a loja. Não há compras automáticas.
- Troca de qualidade conserva posição, direção, corrida, destino e cadeira válida na memória da cena. O enquadramento anterior também é preservado. Posição bloqueada ou cadeira ocupada é recusada na retomada; autenticação e mapa privado continuam nas travas existentes. Não cria campo novo no save.
- O piso passa a ser medido na geometria existente, com limites de subida/queda por passo. Segue calçadas, rampas e degraus em vez de usar altura fixa. Emendas numéricas de degraus têm tolerância de 3 cm; não sobe para telhados nem atravessa ausência de chão. Volumes de piso são registrados para distinguir degraus de paredes e corrimãos.
- Ajuda de teclado no computador e de dois dedos no celular. Controles conferidos em 320/390 px e celular deitado; a entrada do estádio não encobre direção, joystick ou corrida. Atalho de patrocinadores do mapa fica oculto para não encobrir o joystick. Teto continua oculto no passeio; corrida mantém 5,6 m/s.

Os personagens, feira, ambulantes, partidas e rotinas do bairro existentes permanecem. A qualidade pode continuar reduzindo o detalhamento conforme a regra atual, sem converter NPCs em usuários reais ou exigir conexão para passear.

## Chat por proximidade: condicionado a custo zero, não ativado

Hoje cada carreira apresenta a sua cidade local. Um chat por distância entre contas reais exigiria visitas/cidade compartilhada e transmissão da presença e das posições. Nenhum desses canais existe no passeio atual.

A documentação consultada do Supabase distingue Presence (estado que muda devagar) de Broadcast (atualizações rápidas). Presence não deve transmitir cada passo; Broadcast também conta mensagens e distribuição aos participantes. Mesmo reaproveitando o projeto existente, tráfego novo pode aumentar a cobrança e o egress. Proximidade calculada só no navegador não elimina mensagens que o servidor já entregou ao grupo.

Fontes consultadas em 14/11/2026:

- https://supabase.com/docs/guides/realtime/pricing
- https://supabase.com/docs/guides/realtime/presence
- https://supabase.com/docs/guides/platform/manage-your-usage/realtime-messages

Não é possível garantir custo adicional zero nas condições atuais. Conforme a condição explícita de Diego, não foram criados canais, tabelas, políticas, presença compartilhada ou envios de posição/chat. Os canais das salas online e o chat delas não foram alterados. WebRTC/P2P também exigiria descoberta e possível retransmissão, portanto não é promessa de custo zero.

## Validação e limites

- `node scripts/testa-passeio-livre.mjs`: executa as verificações antigas e novas; destino sem teleporte, centralização, ação contextual, retomada, posição bloqueada recusada, câmera com parede/cobertura, piso, ausência de chão, telhado recusado, rampa e subida/descida dos degraus reais do modelo da estação (8,4 m).
- `node scripts/teste-passeio-livre/layout.mjs`: 320×568, 390×844 e 844×390, sem comandos sobrepostos ou rolagem horizontal.
- `node scripts/teste-passeio-livre/verifica.mjs`: navegador com identidade e dados locais simulados, tráfego externo bloqueado, celular/computador, deslocamento real, destinos, ação nas finanças, centralização, troca de qualidade, retorno da câmera, dois dedos, teclado, assento e teto. Moedas continuam as da bancada.
- `node scripts/imersao-mapa/test-map-private-gate.cjs`: liberação permanece exclusiva para a conta confirmada.
- `npm run build` antes de commitar.

Evidências, imagens, verificação e publicação: `/workspace/shared/passeio-livre-20261114/`. A liberação pública do mapa segue desligada; a atualização permanece na prévia exclusiva de Diego. Não houve teste em conta real nem alteração de dados do Supabase. Desempenho em aparelho real depende de GPU, navegador e qualidade escolhida.

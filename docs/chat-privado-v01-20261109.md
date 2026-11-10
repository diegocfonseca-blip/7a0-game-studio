# Chat privado aprovado — 09/11/2026

Diego autorizou aplicar o mockup do chat somente na conta principal e pediu preservar os personagens dos usuários, ausentes na proposta. A ativação reutiliza o e-mail verificado de `useOwnerOnlineVisual` / `useOwnerPresentation`; a segunda conta, público, carreira e basquete conservam a apresentação anterior.

## Apresentação

- Desktop: painel à direita; celular: gaveta inferior, com campo de mensagem acima do teclado. O Chat entra na navegação da partida quando ela está acessível; nas demais telas há atalho flutuante, inclusive sobre os torneios de Mundo/Euro/regionais.
- Personagens nativos de 40 px, perfil, crachá de plano, medalhas, respostas e figurinhas do mascote preservados. Mensagens consecutivas do mesmo remetente são agrupadas; cada grupo mantém o personagem.
- Novas mensagens não puxam o histórico durante a leitura. O aviso fica em linha própria, sem degradê sobre o texto. A contagem considera IDs, inclusive quando a janela continua com 61 mensagens.
- Teclado aberto compacta a gaveta mantendo personagem e envio. Tamanho do placar e campo 2D não muda.
- Transporte original, limite de 160 caracteres, cooldown de figurinhas, espectador somente leitura e opção do dono de desligar o chat permanecem nos chamadores. Nenhuma mudança de banco, canal, simulação, relógio ou autoridade.

## Conferência

Bancada nativa com Supabase substituído apenas no build de teste; nenhum envio a salas reais. Evidências externas em `/workspace/shared/chat-privado-v01-20261109/`.

- Personagens compostos pelas camadas reais, em 40 px, conferidos visualmente no desktop, celular e teclado simulado.
- Envio, resposta/citação, limite, Shift+Enter, histórico parado e novas mensagens, janela de 61 mensagens, figurinhas/cooldown, host liga/desliga, espectador, convidado e fechamento ao abrir perfil.
- Liga, Turma, Draft, Copa dos 8, Libertadores, Champions, relâmpago, Mundo, Euro, três regionais e quatro tipos de leilão com chat acessível.
- Larguras de 320, 393, 760, 1099 e 1440 px; campo 2D mantém as dimensões ao abrir o chat. Teste de teclado usa visualViewport simulado no Chromium, sem substituir validação em aparelho físico.
- Segunda conta e outro usuário mantêm a tela anterior. `node scripts/testa-online-visual-privado.mjs` aprovado.
- Build de produção e publicação registrados na entrega; sem novidade pública, por ser prévia privada.

## Nova publicação solicitada

Duas tentativas ficaram em `syncing_files` até o cancelamento automático do `actions/deploy-pages@v4` aos 10 minutos. O action admite prazo em milissegundos; a publicação passa a aguardar até 30 minutos, com job limitado a 35. A alteração é somente no fluxo de publicação e não modifica acesso à prévia privada, jogos ou retenção das versões anteriores. Confirmar sucesso de Pages antes de anunciar que entrou no ar.

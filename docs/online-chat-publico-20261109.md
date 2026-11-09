# Repaginação online pública — 09/11/2026

Diego autorizou liberar para todos as mudanças visuais antes restritas à conta principal. Inclui o padrão aprovado de salas e espera, cabeçalhos, leilões com jogadores em lista, competições e campeões, controles de tática/velocidade, rodapé de Loja e chat móvel/desktop com personagens, crachás, citações e figurinhas.

A liberação usa `ONLINE_ROOM_VISUAL_RELEASED` e `useOnlineRoomPresentation`, separados das prévias autenticadas de `online-preview`. A segunda conta, usuários comuns e visitantes recebem a apresentação; `useOnlinePreview` e `ownerPresentationEnabled` continuam com a verificação anterior. Não libera mapa, 2D/3D, editor de presidente, sala privada, planos, permissões de host ou dados. Carreira e basquete continuam fora do escopo do layout online. A Partida Rápida usa o mesmo padrão aprovado, com as permissões atuais.

O chat mantém o transporte existente, espectador somente leitura, cooldown, citações e histórico. A publicação conserva o prazo ampliado de Pages e a retenção de versões anteriores.

## Verificação

- Teste de regressão cobre apresentação pública sem prévia de conta, autenticação privada, respostas atrasadas e exclusão de carreira/basquete.
- Bancada nativa isolada em conta principal, secundária e comum, em393 e1440px: cabeçalho, personagens, chat e envio. Nenhuma mensagem real de produção.
- Cobertura anterior de todas as competições e leilões continua válida: a mudança de liberação não modifica componentes ou motor.
- Evidências em `/workspace/shared/chat-online-publico-20261109/`; publicação deve ser confirmada no Actions/Pages antes de anunciar disponível.

## Orientações adicionais na mesma publicação

O mapa fica oculto para todas as contas, inclusive a principal, por `PRESIDENCY_STADIUM_RELEASED = false`. Isso impede montar a cidade e preserva o acesso legado à estrutura do estádio.

Na revisão da recompensa de títulos, encontrado o popup da carta em z-index80, abaixo das telas de torneio (99996). A carta passa para100030, acima da Copa e abaixo da comemoração (100040), seguindo celebração → pacote. A entrega e a chave das recompensas existentes continuam iguais. Nas três copas regionais faltava montar o `CardCollectPrompt`: ele agora usa a mesma entrega resiliente, somente para o vencedor, com chave por sala/semente/edição/regional. Abrir, fechar e reabrir não cria outra recompensa.

Conferência das recompensas: pacote acima da Copa em393/1440px, carta salva antes de abrir, carta revelada igual à gravada, fechar/reabrir com uma única gravação, cadastro acessível sem conta, liga rápida/Turma/Draft e campeões de Mundo/Euro/três regionais. A comemoração legada mantém a mesma prioridade da nova, antes do pacote. Relatórios/capturas em `/workspace/shared/recompensas-titulos-20261109/`.

Também conferido o fluxo de recompensa da Copa dos8, Libertadores, Liga+Champions, Só Champions e Relâmpago com mata-mata encerrado pelo reducer nativo. Os cinco mostraram a carta própria da Copa, acima do torneio. O mapa desligado não exibe nem o estado de espera do carregamento.

Botão de som no celular durante o jogo: canto inferior direito, acima do menu inferior. CSS restrito à presença da navegação online, sem mudar comportamento de áudio ou posição no desktop. Conferido em320/393/1099/1440px; evidência `chat-online-publico-20261109/som-posicao.json` e `som-celular.png`.

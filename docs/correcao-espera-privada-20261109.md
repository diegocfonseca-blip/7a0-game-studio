# Correção da sala de espera privada — 09/11/2026

Diego mostrou a sala de espera como convidado ainda com corpo antigo e rodapé “Apoie”. A confirmação anterior de implementação completa foi ampla demais: a espera tinha recebido principalmente o cabeçalho, e a bancada anterior não montava o GameFooter externo do aplicativo.

## O que foi corrigido

- Organização aprovada aplicada ao corpo da espera: técnicos em destaque; convite e regras na coluna lateral do desktop; início/aviso de espera em posição evidente; provocações e áudios num painel expansível; acesso aos temas disponíveis para o dono.
- Os componentes nativos são deslocados para os espaços da apresentação por contexto e portais. Permanecem as funções de convite, chat, perfil, áudio, mascote, tema, duplas, liga, Copa, saída e início, com suas condições e permissões originais.
- Botão do mascote visível no celular e no desktop, sem duplicação. A regra pública antiga escondia `ll-mascot-start` fora do desktop; a nova composição privada precisa exibi-lo também no celular.
- Estilo privado do fundo tem prioridade sobre a imagem antiga da sala. Os temas selecionados continuam com seus fundos próprios. Nenhum novo asset foi criado; usa a arte já existente.
- GameFooter monta contato e acesso à loja na prévia, sem trazer SupportFooter antigo de volta por baixo de leilões e partidas. A espera tem cartão da Loja do Clube; o menu online conserva o cartão que já possuía. Saída de emergência nas telas de jogo preserva o handler e a confirmação existentes.
- O Menu inicial do cabeçalho da espera chama a ação nativa GO_LOBBY. O nome da conta no modal de Copa também é fornecido quando o estado de jogo ainda não tem managers.

## Isolamento

Somente a conta principal, confirmada pelo cache autenticado já existente. Segunda conta e público conservam o visual anterior. Não muda autenticação, autorização de host, regras, banco, prêmios, timers, preços ou motores. Nenhum RPC novo. A conferência read-only das duas contas confirmou Neymarzetti no e-mail principal e Gol do bh7 no secundário; não houve escrita na produção.

## Conferência

Bancada nova monta o GameFooter fora do contexto da tela, como faz `index.tsx`, e mantém `state.screen='lobby'` durante a espera. O convidado usa host_id diferente do seu UID. Todos os endpoints externos são bloqueados; dados e broadcasts são simulados.

A matriz compilada cobre sala rápida como convidado e dono, Liga da Turma como convidado, Draft como dono, duplas, Copa, conta comum e conta secundária, em 1440 e 393 px: 16 casos. Sem erros de execução ou estouro lateral. No dono aparece Abrir pregão; no convidado só o aviso e as ações que ele já possui. O envio nativo de mascote e a abertura de provocações foram exercitados nos dois tamanhos. Nas outras contas não aparecem os componentes privados.

Evidências: `/workspace/shared/waiting-complete-20261109/`. Há capturas completas da espera e do rodapé; são cenários locais, não capturas de uma sessão real do usuário. Conferência adicional: 320/360 px, tema claro, chat desligado, ação de retorno e rodapé real de liga/leilão/Partida Rápida/fim da temporada. O build obrigatório `npm run build` completo passou antes do commit. Os nove casos adicionais passaram; no tema claro o mascote usa texto rgb(12,12,12), e a saída tem fundo opaco para manter contraste. Cores dos nomes conservam a identidade dos tiers, com tons legíveis na composição privada. Publicar somente após as conferências e confirmar o workflow oficial antes de afirmar que está no ar.

Reversão: reverter somente o commit desta correção visual. Não desligar a apresentação pública anterior nem mudar os gates de mapa/2D/3D.

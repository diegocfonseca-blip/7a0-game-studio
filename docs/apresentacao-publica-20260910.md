# Apresentação pública — 10/09/2026

Diego aprovou a publicação geral do visual da carreira antes restrito às duas contas, e dos avatares existentes em Carreira, Rápido e Minhas Ligas.

- Flags de apresentação independentes da autorização/contas de teste. Basquete não recebe avatares de futebol.
- Avatares existentes: campinho, cartas/colecionáveis e revelação do leilão. Identidade por nome + clube + ano, sem mudar catálogo, atributos ou recompensas.
- Envelope/lista de dar lance continua sem imagem; jogador-surpresa não é revelado antes da hora; vencedor resolvido pelo jogo vem primeiro.
- Carreira: placares, ligas/copas, estádio, patrocínio, jornal, contraste e controles. Jogos e Tabelas continuam separados.
- Patrocínio: cenário aprovado com cadeira, campo e mesa; folha, caneta e espaço para conteúdo dinâmico. Primeiro objetivo, depois propostas, depois assinatura. Logos reais já existentes; marcas sem logo não ganham logo inventada. Valores e regras preservados.
- Aviso de TV passa a participar da assinatura de autosave também nas contas comuns da carreira; sem alterar persistência, autorização ou banco.
- Sala do presidente, editor de presidente e peças do técnico continuam adiados; flags PRESIDENT_* seguem false.

## Arte

Arquivo `src/escalacao/img/career-sponsor-office-v36.webp`, 900×900, 54.512 bytes. Cena gerada a partir da prévia aprovada, sem texto/logo/botões; papel fica entre aproximadamente 45% e 90% da altura e recebe HTML legível. Imagem-fonte local: `exec-32938975-1d54-457c-a1f1-6e2c1e9aa0e1.png` na pasta de imagens geradas da conversa. Referência aprovada: `exec-c321e048-6d08-4962-a40c-fb4dfaf993e6.png`.

Direção da geração: escritório cinematográfico de presidente de clube; cadeira verde central, estádio noturno pela janela, mesa de madeira, papel real vazio em perspectiva suave e caneta ao lado; sem pessoas, letras, marcas ou controles de interface. Conteúdo e logos são renderizados pelo jogo.

## Verificação e reversão

TypeScript + build; testes de apresentação pública em 390 e 1440 px; ligas, Copa Legends, Copa do Brasil e Supercopa; contrato/objetivos/propostas; vencedor primeiro; surpresa; envelope sem avatar; assinatura de autosave. Nenhuma migração, regra de disputa, autoridade do host ou eleição alterada.

Reversão: reverter o commit de liberação restaura as travas anteriores, sem apagar partidas ou saves.

O catálogo local possui duas artes adicionais ainda não publicadas (Rummenigge e Allan Simonsen); esta entrega não altera o registro remoto de avatares. Exportação do jornal mantém seu fluxo anterior. Não considerar esta liberação uma nova auditoria de transparência de cada arte.

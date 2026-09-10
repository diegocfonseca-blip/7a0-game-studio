# Carreira — revisão privada das capturas de 10/09

Status: publicação autorizada explicitamente pelo Diego após revisar a prévia e pedir papéis com logos. Pacote testado localmente; confirmar execução de deploy após commit. Allowlist existente: diego.c.fonseca@gmail.com e diego.c.fonseca2@gmail.com. Demais usuários, basquete, regras e economia não alterados.

## Mudanças

- Patrocínio: mesma arte cinematográfica existente, com cabeçalho ambiental e contratos HTML proporcionais; retirado enquadramento móvel fixo de 460px/800px. Três propostas no desktop, navegação entre propostas no celular, valores/fidelidade/assinatura originais.
- Papéis com bordas finas, folhas sobrepostas, textura e linha de assinatura. Logos originais reutilizadas pelo campo `SponsorBrand.logo`: Vadico, ERO, Max Joias e Rei das Tintas, tanto nas propostas quanto no contrato do clube. Nenhuma logo fictícia criada para marcas sem arte. Não exige desenho manual de assinatura; continua a confirmação existente pelo botão.
- Jornal: masthead, tipografia e ilustrações do online, mantendo manchetes, números, todas as divisões, campanhas de Copa, agência, eventos e memória da carreira. Ilustração de campeão ligada ao vencedor real da divisão, não ao usuário quando ele não ganhou. Compartilhamento em imagem mantém o exportador de carreira existente (não foi remodelado nesta revisão).
- Competição: ajuda organizada em etapas, participantes e formato; removida sombra de texto sobre papel. Status não repete rodada já escrita no título. Banner verde antigo já estava bloqueado na versão privada: não foi reintroduzido.
- Jogos: ticker só depois da rodada zero; não mostra card de rodada zero. Jogo do usuário removido da lista secundária da própria divisão, pois já aparece no placar principal. Jogos e Tabelas continuam separados.
- Contraste: variável `--ink` ausente no palco do leilão definida no escopo privado; textos auxiliares em papel mantêm tinta no noturno; input, nome, +5/+10, elenco, narrador e link para Tabelas legíveis.
- TV: identificada ausência dos flags de dispensa na assinatura do autosave. Nas contas privadas, `tvBannerSeen` e `tvExtraVisto` passam a disparar salvamento no fluxo existente. Não há alteração na cota ou no backend. Não foi simulada uma temporada completa com duas contas reais; teste de assinatura/serialização cobre dispensa e recarga do estado, não disponibilidade da nuvem.

## Conferência

- TypeScript (`tsc -b`) e Vite build passaram. Avisos preexistentes: checkout sem .git para build ID, bundle grande e import dinâmico redundante.
- `scripts/qa-career-v29.cjs`: liga, Legends, Brasil, Supercopa em 390/1440, abas separadas e conta pública negativa.
- `scripts/qa-career-refinements.cjs`: patrocínio compacto, assinatura pelo callback real, jornal/ajuda em 390/1440, sem overflow horizontal.
- `scripts/qa-career-contrast.cjs`: modal de lance e cerimônia reais, modo claro/noturno; estados de QA sem enviar lances.
- `scripts/check-career-tv-save.mjs`: dispensa idempotente, assinatura de autosave privada, serialização e controle negativo público.
- Capturas: `outputs/career-refinements/` no workspace. Fixtures, configurações de QA e imagens de teste NÃO entram no deploy.

## Publicação futura / reversão

Base atualizada para acddc92d, preservando a explicação de Sondar. Publicar apenas fontes desta revisão e documentação, sem misturar os dois avatares locais pendentes. Nenhuma migração. Reverter o commit isolado restaura as telas anteriores; não apaga saves, moedas ou plantéis. Sala/criador de presidente e técnico permanecem suspensos.

# Cabeçalho mobile dos leilões — aprovado em 04/11/2026

Diego aprovou o mockup de alteração pontual com “Ok pode fazer”: somente marca Leilão Legends, faixa de posições e apresentação das moedas. A reorganização completa das telas mobile não faz parte desta entrega.

Aplicação: leilões de futebol em telas abaixo de 1100 px. Lista, cartas, controles de lance, avisos, rodapés e regras permanecem nos lugares anteriores. Desktop e basquete preservam os cabeçalhos existentes. O saldo utiliza `pendingSpend`, sem antecipar compras ainda escondidas na revelação; avisos de reservas e transferências continuam visíveis.

O envelope único mantém seus botões de posição e o cronômetro original. Uma medida local da altura do cabeçalho ajusta apenas a margem de rolagem dos destinos, inclusive quando há avisos adicionais no topo.

Validação local: quatro modalidades em 360, 393 e 430 px; comparação do conteúdo e das dimensões/estados dos controles com o cabeçalho anterior; botões de lance e ajuda; contagem de tempo; atalhos do envelope único; alternância com desktop; aviso de transferência; nome longo e saldo grande; saldo sem spoiler na revelação; exclusão do basquete. Build de produção concluído. Evidências locais em `test-results/mobile-header-implementation`.

Não houve alteração de banco, motor, acesso a campos/mapa ou publicação. Alterações ficam em commit isolado para revisão e futura publicação autorizada.

Ajuste aprovado em seguida: no pregão aberto mobile, o saldo sai do cabeçalho da marca e permanece somente no quadro preto “Seu caixa”. As outras modalidades mantêm o saldo no topo.

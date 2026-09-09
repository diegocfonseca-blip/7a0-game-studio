# Online privado — organização das competições

Liberação de apresentação somente para diego.c.fonseca@gmail.com e diego.c.fonseca2@gmail.com, pelo verificador de usuário existente. Nenhuma alteração de banco, regra, resultado, prêmio ou autoridade do host.

- Jogos e classificação juntos; partidas de todos os técnicos e bots.
- Copa dos 8 e Libertadores: cenário próprio, fase e ida/volta explícitas, placar da perna separado do agregado, vencedor após o suspense dos pênaltis.
- Libertadores: oito grupos com tabela e partidas no mesmo bloco; histórico das fases encerradas.
- Mundial: escudos e responsáveis por seleção, grupos com jogos, fase atual destacada e resultados anteriores recolhíveis; modal online responsivo no desktop.
- Assistências usam os registros da competição, sem revelar antes do apito. O motor do Mundial não registra assistências; não foram inventadas.
- Gol: animação dentro do placar, sem aumentar sua altura; movimento reduzido respeitado.
- Carreira e criação do presidente suspensas. Listagem de leilão e pregão não alterados.

Verificação local: build; teste do filtro das duas contas, logout e corrida de autenticação; vigias do online; cenários isolados de Liga, Copa dos 8, Libertadores (grupos e oitavas), Mundial (grupos e mata-mata), host/convidado e conta comum em 390px e 1440px. Assistências de Liga/Copa/Libertadores verificadas após a animação. Nenhuma sala real foi usada: sincronização entre aparelhos autenticados ainda requer teste dos dois usuários. O verificador legado npm run copa não executou no Windows (spawn npx ENOENT); os testes de interface isolados passaram.

Preservar o commit de otimização do lobby dba2853633b060e837e0186ae943898eff2eb319 ao publicar.

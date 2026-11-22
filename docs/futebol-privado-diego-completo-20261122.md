# Futebol online: revisão privada aprovada em 22/11

Pedido: “faz aí só pra minha conta tudo”. Complemento: no desktop, rivalidades e artilharia também à vista; abas no topo. Esta revisão substitui o piloto anterior que também alcançava Futpoint.

## Acesso e reversão

- Interface exclusivamente na conta principal `diego.c.fonseca@gmail.com`, verificada pelo fluxo Auth existente. Secundária, Futpoint e demais contas não recebem o visual novo.
- Futebol online nas telas da liga, Copa dos 8, Libertadores e Champions. Fora da carreira, basquete e pregão.
- Botão **Voltar ao visual anterior** no topo. Preferência local v2; a reversão conserva o componente da partida. Desligamento global: `FOOTBALL_MATCH_PILOT_ENABLED = false`.
- A reversão é visual: não desfaz uma ordem já aceita nem um lance já ocorrido.
- Sem novidades públicas, migração SQL, preço ou direito de plano novo.

## Organização final

- Abas superiores: Partida / Tabela e jogos / Estatísticas / Elenco / Rivalidades. Ativa roxa com texto claro e traço de destaque, demais verde com contorno visível e texto creme (ajuste posterior do Diego para reservar o amarelo às ações do jogo). Fontes, tamanhos dos botões e modais não mudam neste ajuste. Continuam no topo ao consultar os conteúdos, inclusive antes do pontapé inicial.
- Partida: placar cinema ou Campo2D real, controles e velocidade originais, posição e pontos, amostra de até dois outros jogos, **Todos os jogos**, plano e os onze próprios.
- Tabela e jogos: classificação inteira e rodada completa, com as travas anteriores contra spoiler. Nas copas, jogos da competição e histórico da chave.
- A escalação nas copas também usa a foto anterior dos gols e assistências até o apito, incluindo quem abre a tela com a partida em andamento.
- Elenco: o mesmo time próprio é movido por portal; sem duplicar o editor. Edição continua restrita aos modos que já permitem (Minha Liga Draft e Bafo).
- Rivalidades: próximo encontro e retrospecto real já existente, sequência da conta e últimos placares completos registrados por este aparelho desde o teste; maior vitória entre esses registros. Não inventa placares anteriores. Cache local limitado a 120 duelos, separado por UID.
- Barra inferior: Sala / Troféus / Chat. Ajustes continuam no menu Sala apenas para o dono quando o modo permite; Rank e Temporadas ficam dentro de Troféus nas ligas persistentes.
- Desktop: duas colunas, jogo largo e lateral de 420 px com classificação inteira, resumos compactos de artilharia **e assistências**, rivalidades e chat real. Os resumos levam às abas completas. Estatísticas laterais só incorporam partidas encerradas; numa abertura no meio de jogo, mostram apenas a informação anterior disponível.
- Preservados mascote e celebração reais, rádio, publicidade, mini placar, Auto/Manual, velocidade e a troca de cinema/2D pelo host somente no próximo jogo.

## Ordens com efeito durante a partida

Há implementação real, com escopo de experimento distinto do visual:

- Somente liga, host na conta principal verificada por UID, e sala formada apenas pelas contas de teste já autorizadas (principal, secundária ou Futpoint), além de bots. Sala com qualquer outro usuário conserva o comportamento anterior.
- Copa, Libertadores, Champions, Kings, carreira e convidados não ganham re-simulação ao vivo nesta entrega. A tela explica o limite; a postura original segue valendo para a próxima simulação nessas salas. Nenhum botão promete aplicar as instruções novas onde o reducer as recusa.
- Postura, ataque variado/meio/pontas, pressão normal/alta, ritmo cadenciado/normal/rápido e atenção a um rival do XI. Há compensações na força do ataque e defesa; marcação também reduz o peso do jogador marcado na autoria dos gols.
- O ritmo tático não muda a velocidade da transmissão.
- **Enviar ordens** usa o minuto realmente apresentado pelo componente nativo. Mantém todos os eventos até esse minuto + 3, incluindo a jogada em curso, e substitui somente eventos posteriores; mantém rodada e carimbo de início.
- Atualiza apenas o resultado envolvido, classificação, gols, assistências e rivalidade. Os outros jogos permanecem iguais.
- O host publica o resultado pelo transporte atual. Sem canal, polling ou escrita de banco novos. A ação é local e exige um Symbol que não sobrevive à serialização; mensagens remotas com esse tipo são recusadas.
- Identificador idempotente, mesma rodada, relógio recente, alvo válido no XI e teto de 16 ordens por partida. Plano neutro não consome RNG extra. Resultado antigo incompleto é recusado, sem tentar “reparar” a sala.
- A direção do ataque influencia o cálculo pela qualidade dos setores; não constitui um motor novo de movimentos individuais no Campo2D.

## Validação e limites

- `scripts/testa-football-match-pilot.mjs`: conta principal exata, secundária/Futpoint fora, logout, erro, mudança de conta e resposta Auth atrasada.
- `scripts/testa-football-live-tactics.mts`: reducer real com elencos reais; 40 continuações, 80 simulações pareadas, plano neutro idêntico ao legado, prefixo imutável, tabela, gols + assistências, outros jogos, relógio, duplicação, limite, identidade, payload remoto e minuto vencido.
- `scripts/teste-football-full/verifica.mjs`: EscSeason/EscLiberta/EscChampions/ChatWidget reais num provider isolado; interface em 390 e 1440 px, copas, Campo2D, ordens pelo botão, chat pelo compositor existente, navegação sem remontar o placar, reversão e exclusão de Futpoint.
- A rodada inicial sem resultado também foi testada: abas visíveis e botão original iniciando o jogo. A revisão final passou em 70 verificações de interface, sem erros JavaScript.
- Bancada bloqueia acessos externos; não entra em salas reais nem envia mensagens a pessoas. Evidências locais em `/workspace/shared/diego-futebol-completo-20261122/`.
- Regressões: `npm run sala-troca-2d`, `npm run vel-2d`, `npm run recarga`, `git diff --check`, compilação completa `npm run build`.
- **Não houve teste ao vivo com duas sessões autenticadas nem medição em Samsung S25 físico.** Diego precisa validar o teste privado no jogo real antes de qualquer expansão de público/competições das ordens ao vivo.

Para reproduzir a bancada: iniciar `npm run dev -- --host 127.0.0.1 --port 5178 --base /`; em outro terminal, `node scripts/teste-football-full/verifica.mjs` (Chromium e Playwright instalados). Identidade substituída somente dentro da rota interceptada pelo teste; não há parâmetro de URL de produção para liberar a conta.

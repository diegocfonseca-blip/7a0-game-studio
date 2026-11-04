# Carreira: outros jogos e aviso de lesão

Correção visual pontual, preservando o layout aprovado e as decisões do jogo.

- A grade de jogos usava duas colunas pela largura da janela. Dentro da lateral de 380 px, cada cartão ficava com apenas 163 px. A grade agora considera o espaço do próprio painel: 346 px por cartão na mesma lateral, mantendo duas colunas nos painéis largos.
- Os avisos de lesão, expulsão e noitada eram abertos por portal no `body`, fora do contêiner de texto escuro do jogo. Herdavam a cor clara da página sobre branco/amarelo. Os dois componentes (com reserva e com convocação da base) passam a declarar a tinta preta do jogo; cabeçalhos e selos conservam suas cores.
- Nenhuma mudança em lesões, escalação, geração de jogadores, resultados, salvamento, permissões ou salas online.

Validação local com os componentes reais e dados de demonstração em `scripts/teste-carreira-legibilidade/index.html`:

- Laterais e painéis largos em 320, 393, 768, 1100, 1366 e 1920 px: sem corte ou rolagem horizontal; nomes legíveis; botão de ver todos preservado.
- Avisos com/sem reserva em 393 e 1366 px, tema normal e noturno: contraste dos nomes e botões, cabeçalho branco preservado, seleção e confirmação do substituto/base funcionando.
- 20 combinações verificadas no Chromium, sem erros de JavaScript. Build TypeScript/Vite validado.

As capturas são da bancada local, sem operar um save real. A bancada não faz parte do bundle de produção.

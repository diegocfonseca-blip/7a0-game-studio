# Online ilustrado — V22

Publicação autorizada por Diego: três telas das salas online e encerramento completo, incluindo jornal, pacote e votação. Apenas apresentação; não mudar regras.

## Escopo

- Lobby: criar sala (formulário completo), salas abertas, espera, convite, participantes e resenha.
- Jornal online: composição editorial ilustrada, resultados e escudos reais sobre a arte, todas as notas da redação existentes. Offline preservado.
- Pacote: logo oficial, apresentação e reabertura; sorteio, persistência, critérios por título e suspense existentes preservados.
- Votação: mesmos controles de convidado e host, pendências e saída, sem transferência automática de host.
- Oswald local, creme #F4ECD6, tinta #0C0C0C, amarelo #FFC400, roxo #7C3AED; imagens como ambiente, sem textos de exemplo fixados na arte.

## Assets

Imagens WebP de até 60 KiB: online-sala-v20, online-jornal-v20, online-pacote-v20, jornal-liga-v22, jornal-copa-v22, jornal-artilheiro-v22. As três últimas são ilustrações editoriais neutras, sem nomes ou escudos fixos: equipe verde/creme com troféu dourado; equipe roxa/creme com troféu prateado; silhueta anônima com chuteira de ouro. Arte desenhada, não fotografia. Nomes, estatísticas e clubes são dados do jogo.

## Compatibilidade e reversão

Base integrada sobre main 113c7f3d7e38622d5dfd334b0c6199ec74392769, preservando Olheiro, correções do Monte e sondados. Nenhuma migração, função remota ou mudança no fluxo de hospedagem. Deploy pelo GitHub Pages existente. Reverter apenas o commit visual para voltar ao visual anterior.

Testes locais usam dados fictícios e interceptação de rede; não equivalem a uma partida com vinte pessoas reais. Fixtures não entram na publicação.

## Verificação local

- Build de produção (`tsc -b` e Vite) concluído.
- Comparação AST com main 113c7f3: 183 controles/398 chamadas críticas do lobby e 314 controles/330 chamadas críticas das telas preservados. Geração de notícias e seleção de campeões inalteradas.
- Edge automatizado em 390 e 1440 px: criar/listar/esperar, jornal com 20 notas, voto e pacote sem erros de JavaScript ou transbordamento horizontal.
- Clique no pacote revela a carta; voto dispara `CAST_SEASON_VOTE` com o ID estável do convidado. Tela final real: convidado sem título não recebe pacote; campeão pode fechar e reabrir o seu.
- Todas as seis novas imagens abaixo de 60 KiB. Escudos nativos não são redimensionados pelo CSS das fotografias editoriais.

# Apresentação: camisa do comprador e composição individual

Diego corrigiu a apresentação publicada: o jogador deve **mostrar a camisa do
clube para o qual está indo**, independentemente do clube/ano da carta histórica.
Também rejeitou o enquadramento conjunto com o presidente.

- A cena recebe `clubeDestino` do clube atual da carreira, separado de `ator`.
- A apresentação usa a cabeça do avatar da própria carta e um corpo modular
  neutro segurando a camisa. O presidente sai dessa tomada; o funcionário da
  chegada do ônibus permanece.
- As mãos da pose neutra acompanham o tom do próprio avatar, por ajuste feito
  apenas na montagem da cena. Conferido por pixels com Romário, Zico e Pelé em
  `scripts/teste-cenas-carreira/camisa.cjs`; não processa a imagem a cada quadro.
- Reutiliza a arte da camisa cadastrada na Loja quando disponível. Sem essa
  arte, usa as cores do clube, as receitas existentes de uniforme e o escudo
  que a carreira já exibe. Sem avatar, exibe apenas a camisa correta.
- O botão Rever fica no rodapé. A faixa sobreposta sai da cena ilustrada para
  não cobrir a cabeça; continua nas cenas do mapa.
- Nenhuma alteração de carta, OVR, mercado, dinheiro, save ou resultado de jogo.
  O desenho do tecido é preparado uma vez por montagem, fora do loop da animação.
- Arte modular gerada para o jogo: `central-apresentacao-corpo.webp`, 32.946 bytes,
  640×640 com transparência. Origem local preservada em
  `/workspace/generated_images/exec-95b14a0d-b49d-4b2e-ac55-4674a2a2c439.png`.

## Validação

Capturas e logs: `/workspace/shared/apresentacao-solo-20261126/`.

- Brasil Oficial: Romário/Vasco contratado pelo Flamengo, celular 390px. Além
  do destino, confere pixels rubro-negros do tecido efetivamente desenhado.
- Tradicional: Zico/Flamengo contratado pelo Futpoint (desktop 1440px) e pelo
  Neymarzetti (celular 320px), com as artes reais das respectivas camisas.
- Replay fora da ilustração, sem transbordamento, Pular, Ver elenco, retorno
  sem repetir evento visto e retomada do save; dinheiro/notas/rodada intactos.
- Movimento reduzido, ausência do avatar, falha de imagem com repetição e falha
  efetiva do Canvas com saída segura. Corrigido o lugar da injeção de falha no
  roteiro de testes: agora ela é executada dentro do caso `retry`.
- Teste de fatos/identidades e `npm run recarga` passaram.
- Build exigido: `npm run build` (`tsc -b && vite build`).

Reversão: commit isolado desta correção. Não recarregar clientes automaticamente.

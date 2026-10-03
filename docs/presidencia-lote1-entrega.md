# Presidência — lote 1 integrado à main

Base: `3336f1eae9644b6a3e0622aa9ad5218ce7ef1736`.
Pasta de integração: `work/presidencia-lote1-main-20261003`.
Fonte e acervo completo preservados em `work/presidencia-integracao-20260921`.

## Escopo e autorização

Diego autorizou publicar os lotes aprovados somente para a conta
`diego.c.fonseca@gmail.com`. A ordem substitui a antiga espera por outro
pedido de publicação; não autoriza liberar para todos.

Lote 1: clube e prévia de Batismo na carreira nova, criação modular do
presidente, perfil, edição e montagem da sala com janela. Carreira existente
cria o personagem ao abrir Presidência, sem repetir a criação do clube.
Nenhum móvel, moeda, plano ou veículo é concedido. Sala vazia corresponde à
ausência de móveis comprados; não é a entrega da loja de móveis.

Economia/garagem, teto e substituição da aba de estádio permanecem desligados
em `presidencia-lotes.ts`. O estádio público atual é preservado.
Não incluir artes rejeitadas v254/v255/v256/v259 nem novas coberturas.
As competições continuam a versão da main; a assinatura de autosave
internacional foi preservada e recebeu apenas o sufixo da Presidência.

## Isolamento

`presidente-acesso.ts` verifica a conta com `auth.getUser()`, nunca com nome
digitado, metadados editáveis ou parâmetro de URL. Troca de conta revoga a
chave imediatamente; respostas antigas e falhas não liberam acesso.
O reducer também verifica a chave e o próprio gestor na carreira solo.
Não houve migração, chamada administrativa nem gravação em contas reais.
Este é um gate de funcionalidade do cliente, não substitui RLS. Arquivos
estáticos de arte são públicos por URL, como o restante do site.

## Evidências reproduzíveis

`npm run build`: PASS após ativar o lote privado.
Com servidor Vite em `127.0.0.1:4196`, base `/7a0-game-studio/`:

- `node scripts/testa-presidente-acesso-v68.cjs`: conta exata, conta negativa,
  resposta atrasada, troca de login e falha fechada.
- `node scripts/testa-setup-integrado-v79.cjs`: clube, Batismo, presidente,
  voltar, início e cenário sem autorização.
- `node scripts/testa-presidencia-entrada.cjs`: carreira existente, falha
  preservada, cadastro, reabertura e larguras 320/390/900.
- `node scripts/testa-presidencia-clube-v69.cjs`: reducer real, sala, imagens,
  navegação ao estádio sem mutar save e edição.
- `node scripts/testa-presidencia-lote1.cjs`: perfil permitido, economia/teto
  bloqueados e saldos intactos.
- `node scripts/testa-carreira-premium-v155.cjs --free-outfit=presidente-raiz`:
  Provider real, autosave local, reload e rejeição de tier forjado.

Testes de navegador usam Edge e Playwright instalado; todos bloqueiam rede
externa e usam fixtures/identidades simuladas. Não equivalem à confirmação
de login real nem de persistência em nuvem. Capturas locais em test-results.

## Retomada e reversão

Não copiar arquivos centrais inteiros da pasta antiga sobre a main. O lote
foi aplicado por hunks; conflitos de store/screens foram conciliados.
Antes de publicar, conferir novamente origin/main e registrar commit e
resultado do deploy. Não declarar publicação apenas porque o build passou.
Para recolher a funcionalidade, desligar `PRESIDENT_INTEGRATION_RELEASED`
e publicar o conserto; dados já salvos continuam intactos. Não apagar saves.

Próximos lotes: compra/montagem de móveis, garagem e sequência visual do
estádio/área externa com as rampas aprovadas. Não refazer roupas/poses.

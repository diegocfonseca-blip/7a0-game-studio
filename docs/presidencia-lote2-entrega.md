# Presidência — lote 2 privado

Base publicada: 97faf8bdd2e056653630b21992c078f8cd99b684.
Diego autorizou publicar incrementos aprovados/testados apenas para
diego.c.fonseca@gmail.com, sem reconfirmação. Não liberar globalmente.

## Entrega

- Aba privada do estádio com vista aérea, obras e integração com a janela.
- Sala com compra, revenda e montagem dos 13 móveis com arte disponível.
- Garagem: Fusca, Chevette, M3 GTR e Fat Boy. Novas compras de itens sem
  arte pronta bloqueadas também na transação; propriedade antiga preservada.
- Teto operável somente com estrutura completa e retrátil adquirido.
  Não exige lojas/hotel. Estrutura parcial não permite acionamento.
- Criação/perfil do lote 1 mantidos. Nenhuma moeda, obra, móvel ou plano
  concedido. Outras contas seguem a apresentação anterior.

## Verificação

PASS: npm run build; scripts/testa-presidente-acesso-v68.cjs;
testa-aba-estadio-v94.cjs; testa-presidencia-economia.cjs;
testa-presidencia-lote2.cjs; testa-presidencia-autosave-v80.cjs;
testa-presidencia-lote1.cjs; testa-presidencia-clube-v69.cjs.
Executar com Node e servidor Vite em 127.0.0.1:4196/7a0-game-studio/.
Testes cobrem compra/cancelamento/saldo, repetição e preço forjado,
outro gestor/conta, reload local, arquivo, nova carreira sem herança,
teto com/sem estrutura completa e larguras 320/390/900.
Fixtures offline e autenticação simulada: não comprovam login real nem
save em nuvem. Capturas locais ficam em test-results, fora do commit.

## Limites ainda pendentes

Não é declaração de conclusão de todas as artes do estádio: extras
individuais ainda têm prévia parcial explicitamente indicada na interface.
A foto aérea final inclui comércios: só aparece quando todas as obras
correspondentes existem, para não mostrar bens não adquiridos. Teto de uma
estrutura completa sem esses extras salva seu estado, mas sua representação
nessa arte parcial ainda falta. Não usar artes rejeitadas nem apagar rampas.
Não produzir mais roupas/cabelos/poses agora. Competições pertencem ao Cloud.

## Publicação e retomada

Antes de push conferir origin/main, preservar alterações novas e executar
diff --check. Commit/push não equivalem a deploy: verificar GitHub Pages e
bundle servido. Gate é funcional no cliente; arquivos estáticos têm URL
pública, não são armazenamento privado. Sem migração ou escrita administrativa.
Desligar flags em presidencia-lotes.ts recolhe este lote sem apagar saves.
Acervo original permanece em work/presidencia-integracao-20260921.

# Brasil Oficial e carreira tradicional — paridade de melhorias — 25/11/2026

Pedido: “vc rpecisa ajustar tudo de novo e bomq fizemos pro carreira do rbasil oficial p carreira tardicoional tb”. Revisão adicional sobre `8e26523e`. Após a apresentação das capturas e a pergunta explícita sobre publicar o pacote completo das duas carreiras em produção e encerrar a fase de prévia local, Diego confirmou: **“ok”**. A tentativa anterior havia sido bloqueada pela revisão automática; esta confirmação é posterior ao bloqueio e autoriza a publicação do pacote final integrado.

## Escopo conferido

| Melhoria | Brasil Oficial e tradicional |
|---|---|
| Guia e próximos passos | Mesmos componentes, com explicação do início e das pendências de cada modo |
| Central, escolha de partida e mapa | Fluxo compartilhado; preserva relógio/transmissão e seleção nativa de apresentações |
| Mercado organizado | Sondar, Vender, Contratos e Negócios no mesmo componente, com proteções de venda e regras de elegibilidade próprias |
| Finanças | Mesmo planejador de despesas, usando a folha real de cada modo; simular compra/renovação não gasta nem reserva moedas |
| Técnicos e formações | Mesmo painel de repertório e encaixe; mantém categoria e regra de distribuição/contratação de cada carreira |
| Trocas e plano ao vivo | Mesma validação e motor: três substituições, pausa, sem reentrada, XI permanente preservado |
| Preparação e lesões | Mesma implementação em carreiras compatíveis com Agência/M2: aviso antes da apresentação, escolha explícita e retirada ao vivo, base só depois do jogo |
| Cenas e personagens | Mesma seleção de fatos, cenas e avatares, frequência limitada, identificação, reprodução e ida ao mapa |
| Memória e negócios | Mesmos registros por clube; não duplica partidas nem inventa passado ausente |
| Salvamento | Já unificado anteriormente: conta obrigatória; grátis no aparelho, plano elegível também na nuvem; retomada preserva os novos registros |

O levantamento encontrou que boa parte dos recursos já compartilhava o código e as flags públicas; os testes anteriores estavam concentrados no Brasil Oficial. Não criar implementações paralelas para aparentar uma portabilidade que já existe. Itens 4 e 8 excluídos pelo Diego continuam de fora: recomendações de contratação e resumo automático pós-jogo.

## Ajustes concretos

1. **Clube tradicional recebe o painel organizado do futebol:** mapa amplo, caixa e seis cartões de gestão, com acesso direto ao Museu e à casa/garagem. Oficial conserva sua descrição/trava de SAF; tradicional abre seus negócios e segundo clube. Todos os destinos continuam nos handlers existentes. Basquete mantém seu layout próprio.
2. **Correção real no desktop dos dois modos:** a regra de duas colunas fazia os botões de sair/salvar ocuparem `grid-column:1/-1` na linha 3, sobrepondo a coluna do Mercado e interceptando cliques em Sondar/Vender/Contratos. Os botões diretos de saída nas abas laterais agora ficam na coluna esquerda, em linha automática. Diagnóstico mediu o botão de sair de x=80 a x=1360 na altura dos filtros; após a correção o centro de Sondar/Vender atinge o próprio botão. Não foi necessário alterar a rolagem ao trocar de aba nem reiniciar o mapa/partida.
3. **Cobertura nativa das duas carreiras:** as bancadas passam a aceitar `tradicional=1`. A tradicional é criada por `START_CAREER_SOLO` sem `oficial` e conclui o leilão/Monte/cerimônia com ações nativas. Não é um save Oficial com o campo removido. Para testar trocas, as bancadas de interface acrescentam um banco explícito de cartas reais do catálogo; são dados de teste e não alteração de elenco/economia de produto. A divisão da bancada troca um adversário de volta para conservar o tamanho da liga.

Sem alterar OVR, categorias, probabilidades de lesão, salários, preços, clubes, acesso/queda, calendário esportivo, direitos de planos, schema ou backend. Saves antigos mantêm suas flags de compatibilidade; não transformar o empresário clássico em Agência 2.0 à força.

## Validação

- `scripts/testa-paridade-carreira.mts`: início nativo tradicional (11 jogadores reais) e Oficial (22); cenas e memória idempotentes; recuperação/retorno; opções de formação; save/retomada; caixa e notas preservados; isolamento online.
- `scripts/teste-paridade-carreira/runtime.mjs`: Oficial/tradicional × 390/1440 px. Seis ações de gestão, simulação financeira sem gasto, quatro áreas do Mercado, opções do técnico, troca real, pausa e XI permanente preservado. Quatro casos sem erros de página; navegação por clique real, sem forçar clique sobre a sobreposição.
- `scripts/teste-preparo-lesao/runtime.mjs` com `CAREER_TRADITIONAL=1`: quatro casos de reserva/base × 390/1440, retomada e caminho resolvido; mais um plano de lesão futura sem anúncio na preparação. Cinco casos sem erros.
- `scripts/teste-lesao-partida/runtime.mjs` com `CAREER_TRADITIONAL=1`: quatro casos, incluindo campo 2D com retomada durante o jogo, reserva, seguir com menos e goleiro de emergência no desktop. Retirada real, três trocas, pendência depois do apito e passado preservado; sem erros.
- `scripts/teste-cenas-carreira/runtime.cjs` com a carreira tradicional nativa: WebGL real/SwiftShader; assiste, marca visto, conserva ao terminar, não repete ao retornar, rever, pular, retomar e voltar ao desktop. Caixa inalterado e nenhum erro de página. Não é medição de FPS em celular físico.
- Build exato `npm run build`: passou (TypeScript e Vite; 16,13 s na etapa Vite). `git diff --check`: passou. Relatórios finais sem erros em `validacao.json`.
- As capturas finais do Clube usam uma carreira de teste na pré-temporada para mostrar o mapa/gestão, separadas da transmissão do jogo em andamento. Corrigido também um valor inválido de preço de camisas na bancada antiga (`5`), substituído pelo enum nativo `normal`; nenhuma fórmula de vendas do produto foi alterada.

Capturas e relatórios: `/workspace/shared/paridade-carreiras-20261125/`. As imagens de mapa/3D são do canvas real; não usar os testes com WebGL desligado para afirmar fluidez do mapa. Nenhuma conta real foi usada/alterada. Capturas das duas carreiras apresentadas; publicação conjunta autorizada pela confirmação posterior do Diego.

## Integração com a versão mais recente

Enquanto os testes rodavam, a principal avançou para `24d32d4921371e8d077f9d405a4b6117605baab1`, com alterações independentes do Leilão de Conquistas e peças de divulgação. Preparada cópia isolada em `/workspace/leilao-paridade-integracao-20261125`, aplicando o pacote anterior e esta revisão sem criar commit nem fazer push. Integração automática de `store.tsx`/pendências sem conflito; mudanças de Conquistas e peças preservadas. Nessa cópia, `npm run build` passou (Vite 13,08 s), a prova nativa de paridade passou para os dois modos, a regressão de Conquistas passou e o teste de proteção contra recarga automática passou. Pacote revisável em `pacote-integrado.patch` na pasta de evidências. Diego confirmou posteriormente “ok” à publicação do pacote completo em produção, encerrando a prévia local. Acompanhamento do deploy registrado nas evidências da entrega.

### Atualização posterior da integração

A principal avançou novamente para `1fbf339ae9eecf3ea9c14672cb8b68ac6fec8f2f`, com táticas da Partida Rápida e seu anúncio. Essa versão foi integrada sem conflitos e sem reescrever o commit original de produto `0881b0d2`. Repetidos sobre o resultado: `npm run build` completo (Vite 13,08 s), paridade nativa Brasil Oficial/tradicional, lesão em partida (incluindo 36 quadros 3D), 12 jogos com substituições ao vivo e proteção contra recarga automática; todos passaram. Não houve nova alteração visual própria nesta integração.

Consulta somente de leitura ao GitHub confirmou `main.protected = false` e verificações obrigatórias desativadas. Isso corrige a descrição de “branch protegida” da rejeição anterior, mas não representa liberação da revisão automática do ambiente. Publicação só pode ser declarada após envio permitido e deploy concluído. Não habilitar mesclagem automática nem usar outro meio para contornar uma rejeição.

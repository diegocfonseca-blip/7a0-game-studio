# Pênaltis da carreira no campo existente

Pedido: bolinhas cobram uma por vez, caminham do meio-campo à marca e retornam; os demais atletas ficam separados por equipe.

## Origem do problema

`PensShootout`/`CompactPenalties` tinham um relógio próprio de revelação, enquanto `Campo2D` já estava encerrado. A disputa acontecia no cartão e os atletas ficavam na última posição do tempo normal. O avanço automático esperava um prazo fixo, sem vínculo com as cobranças visíveis.

## Implementação

- `campo2d-penaltis.ts`: apresentação pura, sem alterar o motor ou suas estruturas. Usa os 22 atletas em campo e a ordem de cobradores existente. Não altera atributos, probabilidade, gols, assistências ou vencedor.
- `sequenciaVisualPenaltis` preserva exatamente a reconstrução determinística do cartão antigo; sequência oficial salva tem precedência quando fornecida. Os saves antigos da Copa da carreira guardam apenas o placar de pênaltis: não é uma nova simulação de resultados.
- Dois grupos no círculo central; goleiro defensor na linha e goleiro da equipe cobradora ao lado da área. Caminhada, preparação, corrida curta, contato, voo, resultado e retorno. Os goleiros também podem cobrar na morte súbita longa, sem duplicação.
- O resultado de cada cobrança só é revelado no instante em que a bola alcança o gol/defesa/fora. Placar regulamentar e placar de pênaltis são separados.
- Uma sessão local e limitada a oito partidas mantém o mesmo instante ao alternar telas. Pausa e velocidades existentes valem para a disputa; não há carregamentos novos de modelos ou imagens.
- `Campo2D` publica a mesma cena na superfície já consumida pelo mapa. O HUD do mapa recebe placar e frase de pênaltis, sem criar outra disputa.
- Copa da carreira e confronto internacional com pênaltis seguram a conclusão/avanço até a última cobrança. Online, placar cinema das outras contas e o pênalti manual individual mantêm o fluxo anterior.
- A integração continua atrás de `usePresidentPreview()` e do contexto de estádio já autorizado. Não abre mapa/campo para outras contas. Nenhuma alteração de banco ou save.

## Validação

- `node scripts/teste-penaltis-campo/verifica.mjs` (executa `verifica.ts` com o bundler instalado): 10 disputas completas (4–2, 2–4, 6–5, 5–6 e 15–14, com mando normal e invertido), avaliadas a 60 quadros/s. Confere continuidade, atletas corretos, contato, revelação, pausa, resultados, imutabilidade e 50 sequências salvas.
- `scripts/teste-penaltis-campo/browser.cjs`: componente real `MyCopaMatch`, desktop e celular; cobrança a cobrança, pausa, remount, velocidade 4×, liberação após a última cobrança, placar regulamentar intacto e sincronização da narração.
- Bancada: `scripts/teste-penaltis-campo/index.html?modo=carreira&speed=2`. Elencos e confronto de demonstração, sem operar a conta real. O teste substitui o backend por um stub local e bloqueia conexões externas.
- O mapa continua acompanhando a disputa até a última cobrança, sem antecipar a saída das delegações.
- A bancada usa uma única raiz React; reinicialização do módulo não cria duas telas disputando o mesmo relógio.
- Build TypeScript/Vite e suíte oficial `scripts/checa-penaltis.mjs`.

Não se trata de reprodução gravada do save do Diego. É captura do componente real da carreira com dados locais de teste. A animação dos marcadores é intencionalmente simbólica, seguindo o estilo de bolinhas aprovado.

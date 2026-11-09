# Contraste da prévia privada do Online — 09/11/2026

Diego mostrou o pregão de pacotes, o histórico de lances e as lendas da cerimônia com letras claras sobre branco. Os exemplos eram da apresentação privada, inclusive ao assistir a outras salas. A conta verificada de quem vê a página libera a apresentação; o nome do técnico assistido não libera a prévia para os outros participantes.

## Causa e correção

O novo fundo escuro fornece texto creme por herança. Vários cartões nativos claros não definiam a própria cor de texto. O `Box` já tinha proteção, mas os cartões feitos diretamente com `div`, os botões `Btn` e partes do Draft não tinham.

- Superfícies claras agora declaram uma classe de apresentação com tinta escura. Regras específicas de avisos, posições e cabeçalhos continuam valendo.
- Nomes, preços e quantidades dos pacotes, histórico, lendas e premiação têm tinta própria sobre seus fundos.
- Instruções fora dos cartões, contador do Draft, posições do envelope único e links de navegação usam cores adequadas ao fundo. As caixas claras do desktop e o fundo escuro do celular possuem contextos separados.
- Valores neutros de lance e indicações de fila/livres ficaram mais legíveis. Lances escolhidos ou inválidos mantêm seus estados existentes.
- O saldo do cabeçalho fica legível mesmo após a animação nativa do contador.
- Faixas e números de classificação da Champions usam texto escuro sobre os tons claros, somente na prévia privada.

As novas regras começam por `.ov3`, cuja liberação continua restrita à conta principal verificada. Sem mudanças no estado compartilhado, leilão, relógios, permissões, resultados, backend ou carreira. O rodapé antigo e a espera incompleta foram corrigidos separadamente em `ac4b032c`.

## Conferência

Bancada com componentes e redutor reais, respostas de backend isoladas e rede externa bloqueada. Inclui modo espectador, pregão por jogador/clubes/seleções, cerimônia, navegação entre elencos, Draft e etapas das competições, em 393 e 1440 px. A bancada não entrou no produto.

A leitura automática verifica combinações de cor sólidas e transparências, para localizar falhas graves de contraste; não certifica WCAG nem mede texto sobre toda imagem ou gradiente. Capturas foram inspecionadas, incluindo os exemplos relatados. Dados e evidências ficam em `/workspace/shared/online-contraste-20261109/`.

Teste de isolamento: conta principal, segunda conta, público, saída e resposta de Auth atrasada. Nenhum dado real de sala ou conta foi alterado nos testes.

Validação: `npm run build` e isolamento passaram. A matriz consolidada possui 238 casos, com os casos afetados pelos ajustes finais substituídos por 22 retestes identificados; histórico bruto preservado. Mais 10 conferências de espectador/navegação/contas e nove de espera/rodapé. Sem erros de execução, estouro horizontal ou falhas graves de contraste sólido pendentes nos casos consolidados.

A conclusão verificável da publicação será registrada em `/workspace/shared/online-contraste-20261109/validacao-final.json` após o Pages terminar.

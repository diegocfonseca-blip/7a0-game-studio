# Correção de recepção e condução — v27

Base: publicação `4bc92403`. Escopo: o futebol 3D dentro do mapa, com o mesmo avatar aprovado. Não há alteração do motor2, placares, atributos, contas, banco, geometria do estádio ou cidade.

## Diagnóstico reproduzido

A revisão v26 validava o contato pontual, mas ainda permitia incoerência entre contatos. O corpo herdava a velocidade de aproximação mesmo quando a bola já desacelerava. O perseguidor só corrigia distância maior que 85 cm: podia ultrapassar a bola, deixá-la atrás e depois voltar. Duas curvas independentes, uma do corpo e outra da bola, também podiam se cruzar durante um domínio. Na troca direta para a posse do adversário, a compensação podia desaparecer depressa demais.

A câmera usava os alvos táticos anteriores ao ajuste dos corpos. O enquadramento podia, portanto, considerar um jogador que não estava na posição realmente desenhada.

## Alterações

- Após uma recepção calibrada na malha, manter o corpo do lado de onde recebeu a bola, com correção limitada e sem anexar/atrair a bola ao pé. O impulso e o instante de contato não mudam.
- A tangente do corpo depois do domínio usa o rolamento seguinte da bola; a velocidade de chegada sozinha não representa a continuidade do lance.
- Entre contatos existentes, avaliar uma rota relativa à bola em coordenadas polares. Preservar os pontos exatos e a continuidade de velocidade nas duas pontas e no meio. Recusar candidatos que cruzem a bola, exijam correções excessivas ou atravessem perda de posse, bola aérea ou reposicionamento oficial.
- Retomar a posição tática gradualmente após o adversário controlar a bola.
- Fornecer à câmera as posições e visibilidades reais dos avatares. O renderer anterior continua compatível pelo fallback existente.

O planejamento é calculado antes do replay. A bola é somente leitura nesta revisão. Não foram criados novos toques, gols, decisões ou clipes. O mapa livre e a troca de câmeras continuam na mesma partida.

## Verificações

- Build completo: TypeScript e Vite.
- 26 suites anteriores e uma nova suite com regressões de ultrapassagem após domínio, continuidade de velocidade, perda de posse, bola aérea/reposicionamento e imutabilidade da bola.
- Cinco partidas históricas completas com a entrada de produção: 6.975 estados; placares e relatórios oficiais idênticos; 383 contatos planejados confirmados iguais ao controle v26; nenhum transform inválido ou sobreposição de cápsulas não resolvida nos estados amostrados.
- Comparação visual de 90 quadros dos mesmos três trechos do jogo salvo, antes e depois: mesmos instantes, trajetórias de bola idênticas (diferença máxima 0 m) e mesmos relatórios oficiais.
- Cenas: recepção/condução em 4,65–5,65 s; domínio/passe em 12–13,7 s; continuidade do domínio em 61,4–63,05 s. A gravação usa o campo e o renderer reais do mapa em bancada local, sem login na nuvem, avanço de rodada ou escrita no save.
- `npm run recarga`: nenhuma atualização automática introduzida.

Exemplos na rodada 1, medidos como distância horizontal entre centro do corpo e bola (não confundir com erro da superfície da chuteira): em 13,20 s, 0,84 m → 0,49 m e direção do tronco relativa à bola 118° → 2°; em 21,67 s, 0,90 m → 0,36 m e 105° → 1°. A comparação não deve tratar o tempo anterior à chegada física do passe como se já fosse condução.

## Limites e evidência

Esta é uma correção incremental, não uma aprovação de todos os fundamentos. Ainda existem transições bruscas e trechos de velocidade excessiva nos jogos completos. Algumas propostas de ajuste são recusadas porque não se encaixam nos contatos e tempos oficiais com segurança. Recepção aérea, preparação de primeira e organização coletiva requerem avaliação adicional. Não se afirma desempenho de telefone físico com base em WebGL por software.

Relatórios privados em `test-results/review-v27/`. Vídeos e imagem comparativa em `/workspace/shared/fundamentos-v27/`. O primeiro teste de interface da carreira foi invalidado por atualização do servidor de desenvolvimento durante a execução; ele não conta como aprovado. Os testes finais usam a fonte estável e bloqueiam comunicação externa.

Reversão: reverter somente o commit desta revisão. O ponto anterior é `4bc92403`; nenhum save ou dado do Supabase precisa ser revertido. A restrição existente da conta proprietária permanece inalterada.

Checagens finais: conta proprietária com 2D/3D; segunda conta bloqueada mesmo com preferência 2D forçada; entrada alternativa bloqueada; logout remove o acesso; 22 atletas e um único download do GLB. Desktop e viewport 390×844 sem erros de JavaScript. Trocar mapa livre/transmissão/tática preservou ID, tempo e placar. O teste das posições de câmera mediu erro zero em relação aos 22 corpos renderizados nos três trechos revisados. `test-results/review-v27/camera-subjects.json` e `test-results/release-v26/gates.json`.

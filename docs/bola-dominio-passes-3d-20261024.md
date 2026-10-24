# Bola, domínio e passes no replay 3D — 24/10/2026

Correção do replay isolado Rei da Bola FC × Neymarzetti, com os mesmos 22
Civis NO FACE e a entrada oficial já exportada. Não houve acesso ou escrita
no banco, avanço de carreira, alteração do Motor2, atributos, cidade ou estádio.

## Causas verificadas

- O Motor2 conduz a bola a 75 cm da âncora do atleta. Isso funciona no 2D,
  mas não representa, sozinho, os toques de uma passada com pernas curtas.
- A preparação do próximo passe começava até 650 ms antes do contato. Em
  recepções rápidas, o atleta já estava na pose do próximo chute durante o
  domínio. A correção de raiz também podia avançar depressa demais.
- Os passes de retorno usavam uma captura frontal virada quase inteira contra
  a corrida. Depois do impacto, a captura mantinha essa orientação enquanto
  a movimentação oficial já seguia outra direção.
- A bola tem diâmetro de 22 cm e já possuía giro canônico a 120 Hz. Não estava
  simplesmente sem rotação. Amostragem distante/baixa cadência prejudica a
  leitura dos painéis; as correções visíveis de condução também precisam de
  rolagem correspondente. Aumentar seu tamanho não corrige isso.

## Alterações

1. Quatro passes (Abedi 23,7 s, Weah 26 s, Cuadrado 34,5 s, Souza 53,1 s)
   foram ajustados com as capturas CMU já retargetadas. Nenhuma animação
   principal foi gerada girando ossos. O ajuste considera tronco, trajetória,
   borda da chuteira, direção da mudança de velocidade, outro pé e piso.
2. A preparação da pose nos passes foi reduzida a 320 ms e a recuperação a
   até 380 ms. Nos quatro ajustes, a aproximação da raiz continua distribuída
   em 650 ms; pose e deslocamento não são mais a mesma curva. O instante do
   contato e a bola oficiais permanecem fixos. Chutes conservam sua janela.
3. A orientação de aproximação segue o corpo realmente ajustado, permitindo
   quadril aberto. Após 20 ms do impacto, a continuação se orienta novamente
   para o deslocamento oficial, preservando a captura e o rig.
4. `BallTouchPresentation` adapta provisoriamente a condução ao movimento
   das chuteiras importadas, com correção visual de até 32 cm e aproximação
   limitada a 1,8 m/s. Um toque é reconhecido por proximidade real; não emite
   eventos nem impulsos no motor. A correção desaparece antes do impacto
   oficial. Goleiros, rede e reposicionamentos mantêm suas apresentações.
5. A rotação considera também o deslocamento dessa correção. A bola conserva
   raio de 11 cm. Uma sombra suave de contato, horizontal mesmo com a esfera
   girando, acrescenta um quad e uma textura RGBA de 32 × 32 (4 KB).
6. A avaliação da condução do dono não é descartada só por seu LOD estar
   distante. Não foi alterada a lógica ou o tamanho dos atletas por câmera.

## Validação e evidências

- Paridade independente: 941 quadros, 20.702 posições, erro máximo zero,
  mesmos 1 × 1, 82 eventos, autores e assistentes dos gols.
- 50 contatos revisados, incluindo os dois passes antes rejeitados, mantidos
  dentro de 2 cm e com orientação aceita. Isso não equivale a aprovar todos
  os movimentos de futebol.
- A comparação de quatro sequências a 60 Hz inclui a própria captura, mede
  o tronco real contra o deslocamento e também registra a rotação da raiz.
  Uma medição apenas da raiz pode confundir a rotação interna da captura
  com a direção visível do corpo. Nessas sequências, as amostras com corpo
  mais de 108° contrário à marcha, acima de 2 m/s, caíram de 42 para zero
  (35/2/1/4 para 0/0/0/0). Isso não prova que qualquer outro passe está pronto.
- Teste específico verifica preservação da fonte, retorno ao contato exato,
  velocidade limitada, rolagem da correção, reinício/seek, apresentação do gol
  e sombra horizontal. A recepção de duas mãos do goleiro foi preservada.
- Relatórios e filmagens reais: `test-results/cartoon-football/bola-passe-v2/`.
  `ajuste-final/open-passes.json`, `aceitacao-contatos/audit.json`,
  `aceitacao60/whole-match.json`, `aceitacao-video/` e `parity.log`.
- Vídeos normais são montados com passos de 1/60 s; câmera lenta usa os
  mesmos quadros. A comparação anterior usa o perfil do commit `4dad5d4d`
  sem a nova condução, com a mesma cena, uniformes e fonte oficial.
  Filmagem offline a 60 quadros/s não é uma medição de FPS em celular físico.

## Limites que continuam reais

**Os perfis ajustados continuam específicos desta entrada oficial e versão do
motor. Não foram generalizados para qualquer nova partida do usuário.** Em
entrada diferente, a proteção existente rejeita marcadores incompatíveis e a
nova correção da bola também permanece desligada. O catálogo não é cobertura
universal de futebol.

Domínio/condução ainda são uma adaptação provisória da locomoção adquirida;
não adquirimos uma captura específica de recepção ou drible. Continuam cinco
ações de pé sem ajuste aceito (2,15; 12,35; 32,8; 46,8; 61,6 s), além de
quatro ações de mãos sem captura apropriada. O cruzamento de Loco Abreu não
foi promovido a pronto. Não há cobertura completa de cabeceios, laterais,
disputas e movimentos de goleiro.

A revisão completa também registra colisões conservadoras de cabelo e
correções bruscas em paradas/reinícios. Essas medidas são diagnósticos, não
uma aprovação automática da partida. Animação, recepção e deslizamento ainda
exigem revisão visual; não basta a bola chegar ao destino.

A auditoria a 60 Hz cobriu 5.641 quadros: zero penetrações pé–bola maiores que
3 mm, zero pés abaixo do piso por mais de 3 mm e zero raízes além de 60 cm.
Registrou uma aproximação de 16,6 mm entre esferas conservadoras de cabelo
numa falta (20,633 s) e quatro correções de raiz acima do limiar fora dos
reposicionamentos de saída. Foram mantidas como pendências explícitas. A
verificação posterior de reinícios confirmou ausência de correção de bola
durante a parada; a ocorrência de cabelo permaneceu.

## Reproduzir

Com Vite local na porta 4197 e a fixture exportada disponível:

```sh
node --import ./scripts/cartoon-football/node-ts-resolve.mjs scripts/cartoon-football/test-ball-touch-presentation.mjs
node scripts/cartoon-football/test-open-passes.cjs
MATCH_AUDIT_HZ=60 node scripts/cartoon-football/audit-whole-match.cjs
node scripts/cartoon-football/audit-actions.cjs
node scripts/cartoon-football/record-ball-touches.cjs
```

`fit-side-pass.mjs` procura adaptações das capturas existentes para um
`CONTACT_TIME` oficial e grava uma proposta com métricas. Não altera os
perfis, a carreira ou o banco automaticamente. Só ajustes revisados entram
no pacote. As capturas mantêm as licenças CMU/Quaternius já registradas.

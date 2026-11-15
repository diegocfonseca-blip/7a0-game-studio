# Passeio do personagem — análise e correções, 14/11/2026

Atualização: Diego aprovou as recomendações abaixo. A implementação seguinte e a condição de custo zero para chat estão em `docs/passeio-livre-20261114.md`.

Diego pediu que abrir/fechar o teto não apareça durante o passeio, uma corrida um pouco mais rápida e uma análise mais profunda da experiência.

## Correções implementadas

- O componente 3D comunica se o passeio está ativo. A tela da carreira esconde o teto enquanto o personagem anda, escolhe cadeira ou está sentado; o controle retorna ao sair e continua dependendo da prontidão do mapa e da compra existente. Não opera o teto, não grava compra e não recria a cena ao passear.
- Corrida de 4,8 para 5,6 m/s (+16,7%). Caminhada mantém 2,4 m/s. A animação recebe a distância efetivamente percorrida; ao encostar numa parede e parar, não mantém a velocidade desejada sem deslocamento.
- A borda fixa antiga (-290…290, -230…260) não incluía a agência no setor norte nem a residência em (432,455). No mapa de gestão, os limites passam a usar bairros registrados e reservas atuais do campus, agência e bairro residencial, com margem de 12 m. Outras apresentações conservam os limites anteriores. Isso não cria interiores ou ações comerciais durante a caminhada.
- Movimento dividido em trechos de até 16 cm para não ultrapassar paredes finas em um quadro lento. O deslizamento pelas paredes e a proibição de atravessar o corpo do estádio continuam.
- Perda de foco/aba oculta limpa teclas e movimento. Campos de texto e atalhos do navegador não acionam o personagem. Joystick e arrasto acompanham seu próprio dedo/ponteiro; cancelamento ou perda da captura solta o movimento. A escolha de correr reinicia sincronizada entre o botão e o controlador.
- Ao sentar, a vaga é conferida novamente: se a torcida ocupou a cadeira durante a escolha, a lista é atualizada com aviso e continua possível voltar à rua. Não coloca dois personagens no mesmo assento nem inventa vaga.

## Melhorias recomendadas para a próxima proposta visual

1. **Passeio livre e destino opcional.** O HUD hoje sempre pede ir ao portão, embora o usuário queira explorar a cidade. Trocar a orientação fixa por “Passeio livre”; seletor compacto de destino (portão, casa, agência, loja, museu e patrocinadores), com uma seta e distância apenas para o escolhido. Nenhuma rota automática ou teletransporte novo.
2. **Câmera com recuperação fácil.** A câmera acompanha o personagem a 9 m; ainda não tem teste de obstrução contra prédios. Propor um único “Centralizar” e, depois, testar redução suave da distância ao encontrar uma parede. Ao sair, recuperar o enquadramento anterior com transição e possibilidade de interromper.
3. **Ação perto do estabelecimento.** Quando o personagem chega à porta, mostrar uma ação contextual para abrir o painel já existente, respeitando compras e desbloqueios. Não espalhar cartões ou etiquetas grandes pela tela.
4. **Ajuda certa para cada aparelho.** No desktop, informar WASD/setas, Shift e arrasto; no celular, joystick com um dedo e câmera com o outro. Ajustar instrução e bússola em 320 px para não disputarem a mesma faixa. Não adicionar uma fileira de comandos de gestão ao passeio.
5. **Continuidade e terreno.** Hoje a queda automática de qualidade recria a cena e encerra o passeio. Recomendo preservar posição e direção após validar colisão na nova cena. O piso do personagem ainda é fixo em 0,16 m; caminhar por rampas/escadas exige amostragem de piso e testes específicos, não apenas liberar a área.

Esses itens são recomendações, não estão publicados nem foram incluídos no motor nesta entrega. A imagem de HUD proposta é um mockup separado das capturas reais.

## Conferência

- `node scripts/testa-passeio-personagem.mjs`: distância em 15/30/60 atualizações por segundo, parede fina, deslizamento, limites com casa/agência, blur, aba oculta, texto, saída, lotação durante a escolha; executa também as verificações anteriores de colisão sem instalar dependências.
- `node scripts/teste-mapa-fluidez/passeio.mjs`: integração real da carreira com identidade simulada, no celular e desktop, controle de teto, corrida, perda de captura, blur, dois dedos no celular, entrada/assento/saída e moedas preservadas. `PASSEIO_ANTES=1` registra a versão publicada para comparação.
- `npm run build` antes do commit.
- Evidências em `/workspace/shared/passeio-personagem-20261114/`.

Todos os testes são locais e bloqueiam tráfego externo. Nenhuma sessão real foi acessada. Mapa público segue desligado, prévia somente para Diego; sem migrações, Realtime, gravação de estado de sala ou alteração das partidas.

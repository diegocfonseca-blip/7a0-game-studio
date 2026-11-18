# Técnico e preparador físico — como é hoje (levantamento 18/11, só leitura)

## Técnico
- Não se compra direto: sonda na janela (`ALICIAR_MARCAR`, 1 por temporada, só sem contrato) → vira `tecLote`, 1ª "posição" do leilão de reservas.
- Lance dos bots: 35% de chance cada, dono defende 60%; teto `tetoTecnico` = 4× piso (A 100 · B 72 · C 48 · D 24 · V 8). Empate = humano.
- Trocar de técnico: paga multa = valor pago pelo atual, cobrada ao vencer o pregão (a tela não avisa antes).
- Salário = pago/10, só da T4. Contrato sorteado 3/5/10. Renovar (`RENOVAR_TECNICO`) só depois de vencido, preço cheio.
- Efeito: "12ª carta" (over sorteado pela divisão, peso 1/12) + formações do repertório (A5 · B4 · C3 · D2 · V1).
- Bots: têm técnico (`ALICIAR_SEED`); contratam/renovam DE GRAÇA (60%), prazo fixo +4, sem salário.

## Preparador
- Compra direta (Faria 100 · Pintus 300 · Paixão 500 · Seirulo 800), salário 10%, renovação metade. Contrato 3/5/10.
- Efeito: banco devolve +6/+9/+12/+20 (sem = +4); libera 🔁 Rodiziar; Seirulo tem o automático.
- Bots NÃO têm preparador.

## Pontos fracos achados
1. Contrato vencido de técnico/preparador NÃO tira nada (efeito e salário seguem) — renovar é opcional na prática.
2. Extrato diz "+5 temporadas" na renovação do técnico, mas o prazo é sorteado 3/5/10.
3. Escala desigual: técnico no máximo 100, preparador até 800, nenhum escala com a divisão; preparador compra-se na D/Várzea onde não faz nada.
4. Bot não paga técnico nem preparador (contrata/renova de graça, sem salário).
5. A vida do mercado de técnicos (`ALICIAR_SEED`) só roda com a tela do Sondar/Mercado aberta.
6. Lance humano no técnico sem teto (`tetoTecnico`) — pago pode passar do teto até a cura.
7. Texto do tutorial da Série C diz "os bots não cansam" — hoje o rival com banco cansa.
8. Brasil Oficial: tudo igual à carreira padrão.

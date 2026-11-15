# Implantação urbana do mapa — decisão de 14/11/2026

Diego aprovou o antes/depois e autorizou reorganizar o entorno, retirar casas genéricas e refazer ruas. O estádio atual fica preservado. A Casa Luca permanece unida e com acesso próprio, ao sudoeste do estádio.

A planta em metros está em `src/escalacao/presidencia-implantacao-urbana.ts`. Ela coordena ruas, lotes, jardins e rotas 3D; a ilustração 2D legada não é reinterpretada como se medisse essa nova implantação. Porta, volume, caminho e câmera devem compartilhar o mesmo endereço.

- Frente: praça para pedestres, museu a oeste, loja a leste, bar e alimentação na borda.
- Oeste: hotel e circulação de serviço/delegações.
- Leste: quatro setores do estacionamento, conectados pela mesma entrada externa.
- Norte: avenida comercial, agência, shopping, Vadico e Tidex; metrô com duas chegadas a pé.
- Parceiros distribuídos: dSouza na lateral leste; OittoLabs e Campo Grande ao sul.
- Bairro sudoeste: Casa Luca, jardim, piquenique e quadra. Passagem acessível ligada à praça; ruas não cortam seu terreno.
- Sudeste do campus: Arena Legends, com acesso externo próprio.
- Além da avenida sul, a sudeste: bairro da casa do presidente, com cinco vizinhos, jardins, calçadas, ruas locais e acesso frontal à garagem. A casa foi afastada do estádio após a aprovação seguinte de Diego.

Os valores, os pré-requisitos e o investimento de cada save continuam os mesmos. O estacionamento mantém as quatro parcelas e 79 vagas físicas finais. Mover um estabelecimento não concede sua compra. Museu mantém as quatro etapas. Entrega de veículo é somente apresentação de posse confirmada.

A implantação continua privada/local: `PRESIDENCY_STADIUM_RELEASED=false`. Esta aprovação autorizou executar o projeto, sem publicar ou abrir o mapa para as contas públicas.

Verificação: `node scripts/testa-implantacao-urbana.mjs`; testes existentes de estacionamento, transporte/assento e patrocinadores; `npm run build`. Prévia local em `scripts/teste-implantacao-urbana/index.html`, e conferência do navegador em `scripts/teste-implantacao-urbana/verifica.mjs` (Vite na porta 4197; todas as solicitações externas bloqueadas pelo teste).

## Casa afastada e passeio de carro — aprovado em 14/11/2026

Diego perguntou se a casa deveria ficar mais longe do estádio, inclusive para fazer sentido usar o carro. Após a proposta de bairro além da avenida e trajeto garagem–estádio, autorizou: “Ok pode fazer tudo”. A casa pessoal passou de (200,232) para (432,455), conservando o terreno, a construção inicial e a garagem. A Casa Luca permanece no seu endereço a sudoeste do estádio.

A ação “Ir ao estádio de carro” usa um dos carros já comprados e expostos na garagem. O mesmo modelo sai de ré, percorre as ruas conectadas, estaciona em uma vaga física reservada no primeiro setor e aguarda a ação de voltar. A volta termina na vaga original da garagem. Requer a primeira etapa do estacionamento; sem carro ou estacionamento, a interface explica o requisito. Uma viagem por vez. Pausa e exploração livre do mapa continuam disponíveis. “Ver cidade” usa uma vista mais alta; no celular, somente nessa vista, os controles laterais sobem para não cobrir a casa.

O passeio é apresentação local: não cobra, não compra, não concede veículo, não modifica o save ou o relógio oficial da partida. Não interfere nas salas online. A viagem conserva posição ao recriar a cena por troca de qualidade; recarregar a página inicia os veículos na garagem. O carro cede passagem aos veículos visíveis próximos; a rota é validada contra os sólidos do cenário antes de iniciar. Não representa uma simulação completa de trânsito urbano.

Verificação específica: `node scripts/testa-casa-passeio-carro.mjs` (Fusca, Civic, Escalade e F40; ida, volta, posse, vaga, pausa por tráfego, retomada de cena e requisitos); `node scripts/teste-implantacao-urbana/casa-carro.mjs` (navegador local em 1440, 390 e 320 px); `node scripts/teste-implantacao-urbana/casa-camera.mjs` (projeção da casa e do estádio dentro da visão “Ver cidade” e capturas); teste de privacidade `scripts/imersao-mapa/test-map-private-gate.cjs`; `npm run build`. Evidências em `/workspace/shared/casa-bairro-passeio-20261114/`. Sem publicação; o mapa público segue desligado.

## Publicação privada autorizada em 14/11/2026

Após conferir o resultado, Diego autorizou: “Ok pode publicar Na minha conta”. A integração parte da `main` atual, preservando as alterações recentes. `PRESIDENCY_STADIUM_PREVIEW_RELEASED=true` habilita a prévia somente quando a conta está confirmada por `usePresidentPreview()` e a carreira permite a Presidência. `PRESIDENCY_STADIUM_RELEASED` continua `false`; nenhuma nova conta foi incluída na lista.

Teste de integração real de telas com identidades locais e rede externa bloqueada: a conta de Diego abre o mapa, as obras e o museu; outra conta não recebe o mapa privado. O teste não sobrescreve mais a chave de publicação. Logout e resposta antiga de autenticação continuam testados na trava de privacidade. Compilação na configuração da raiz de produção: `DEPLOY_BASE=/ VITE_ONLY_GAME=escalacao npm run build`. Evidências da publicação em `/workspace/shared/mapa-publicacao-privada-20261114/`.

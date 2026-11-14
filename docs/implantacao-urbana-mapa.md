# Implantação urbana do mapa — decisão de 14/11/2026

Diego aprovou o antes/depois e autorizou reorganizar o entorno, retirar casas genéricas e refazer ruas. O estádio atual fica preservado. A Casa Luca permanece unida e com acesso próprio, ao sudoeste do estádio.

A planta em metros está em `src/escalacao/presidencia-implantacao-urbana.ts`. Ela coordena ruas, lotes, jardins e rotas 3D; a ilustração 2D legada não é reinterpretada como se medisse essa nova implantação. Porta, volume, caminho e câmera devem compartilhar o mesmo endereço.

- Frente: praça para pedestres, museu a oeste, loja a leste, bar e alimentação na borda.
- Oeste: hotel e circulação de serviço/delegações.
- Leste: quatro setores do estacionamento, conectados pela mesma entrada externa.
- Norte: avenida comercial, agência, shopping, Vadico e Tidex; metrô com duas chegadas a pé.
- Parceiros distribuídos: dSouza na lateral leste; OittoLabs e Campo Grande ao sul.
- Bairro sudoeste: Casa Luca, jardim, piquenique e quadra. Passagem acessível ligada à praça; ruas não cortam seu terreno.
- Bairro sudeste: casa do presidente e Arena, com acesso externo pela frente da garagem.

Os valores, os pré-requisitos e o investimento de cada save continuam os mesmos. O estacionamento mantém as quatro parcelas e 79 vagas físicas finais. Mover um estabelecimento não concede sua compra. Museu mantém as quatro etapas. Entrega de veículo é somente apresentação de posse confirmada.

A implantação continua privada/local: `PRESIDENCY_STADIUM_RELEASED=false`. Esta aprovação autorizou executar o projeto, sem publicar ou abrir o mapa para as contas públicas.

Verificação: `node scripts/testa-implantacao-urbana.mjs`; testes existentes de estacionamento, transporte/assento e patrocinadores; `npm run build`. Prévia local em `scripts/teste-implantacao-urbana/index.html`, e conferência do navegador em `scripts/teste-implantacao-urbana/verifica.mjs` (Vite na porta 4197; todas as solicitações externas bloqueadas pelo teste).

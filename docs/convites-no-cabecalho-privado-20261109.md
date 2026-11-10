# Convites junto do código — 09/11/2026

Diego pediu que compartilhar e chamar amigos ficassem pequenos, junto do código, sem uma seção separada.

A prévia da conta principal agora reúne o título, o código e os dois controles no mesmo cabeçalho da sala de espera. O alvo nativo do convite foi movido para esse cabeçalho; a seção lateral/abaixo foi retirada. Rótulos em 12 px, com áreas de toque de pelo menos 44 px e quebra nas telas estreitas. Código continua sendo exibido uma vez e serve para copiar ao tocar.

O campo de senha de ligas do dono fica recolhido em “Incluir senha no convite”. Usa o mesmo estado e a mesma composição de mensagem de antes. Os handlers de compartilhar e abrir amigos foram preservados. Não envia convites automaticamente nem muda permissões ou dados da sala.

Público, segunda conta e basquete mantêm a apresentação anterior. A mudança usa a liberação privada já existente.

Validação: build obrigatório passou, incluindo o CSS compacto final; isolamento passou. Onze casos nativos em 320/393/1440 px cobriram tema padrão/branco, dono/convidado, rápida/Liga da Turma e contas de controle. Todos sem estouro horizontal, código único e ações antes da lista de técnicos na prévia. Duas conferências funcionais (393/1440) copiaram o código, copiaram convite com senha fictícia e abriram a janela real de amigos, em bancada com backend isolado e sem mensagens reais.

Capturas e resultados: `/workspace/shared/convites-no-topo-20261109/`. `validacao-final.json` registra o resultado da publicação quando concluída.

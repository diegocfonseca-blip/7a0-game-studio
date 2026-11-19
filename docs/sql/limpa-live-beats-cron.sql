-- 🧹 19/11 — LIMPEZA AUTOMÁTICA DOS "TÔ AQUI" (live_beats). APLICADO no banco em 19/11 (job 'limpa-live-beats', id 14).
-- Por quê: a tabela só era limpa quando o Diego abria o #admin (`esc_admin_dashboard` apaga o que tem > 10 min). Ele ficou dias
-- sem abrir, ela juntou 1,1 milhão de linhas desde 08/11, e aí a limpeza dentro do painel passava dos 8 s → o servidor cancelava
-- tudo ("canceling statement due to statement timeout") e o painel não abria mais. Quem lê a tabela: só o painel (últimos 90 s)
-- e a lista de Amigos (últimos 3 min) — sala, liga, carreira e conta não moram aqui.
-- Agora: a cada 5 min apaga até 100 mil avisos com mais de 10 min. Desligar: select cron.unschedule('limpa-live-beats');
select cron.schedule('limpa-live-beats', '*/5 * * * *',
  $$delete from live_beats where ctid in (select ctid from live_beats where beat_at < now() - interval '10 minutes' limit 100000)$$);

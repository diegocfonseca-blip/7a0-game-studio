-- ════════════════════════════════════════════════════════════════════════════
-- MEDIDOR DA CAMPANHA DE E-MAIL (01/09) — já APLICADO no banco.
-- Este arquivo é a cópia de referência: as sessões não se veem, e sem isso
-- ninguém descobre que essas funções existem.
--
-- Pergunta do Diego: "consigo ter um controle das pessoas q mandamos email e se
-- surtiu resultado?"
--
-- ⏰ POR QUE TEVE QUE ENTRAR ANTES DO PRIMEIRO DISPARO: pra saber se o e-mail
-- trouxe alguém de volta é preciso a FOTO de quando a pessoa jogou pela última
-- vez ANTES de receber. Depois que o e-mail sai, essa foto já era.
--
-- 🎯 O SINAL DE "VOLTOU" É `game_plays`, NÃO LOGIN. `last_sign_in_at` mente:
-- quem tem sessão salva no aparelho volta a jogar sem logar de novo.
-- `live_beats` também não serve — é presença do momento (~40 min guardados).
-- ════════════════════════════════════════════════════════════════════════════

-- ── 1. colunas do medidor ───────────────────────────────────────────────────
alter table public.esc_email_fila
  add column if not exists uid uuid,           -- casa com game_plays/site_visits
  add column if not exists lote_pos int,       -- posição no lote (1..N)
  add column if not exists resend_id text,     -- id da mensagem no Resend
  add column if not exists jogou_antes timestamptz,  -- A FOTO
  add column if not exists evento text,        -- delivered/opened/clicked/bounced
  add column if not exists evento_em timestamptz,
  add column if not exists evento_pedido bigint;

update public.esc_email_fila f set uid = u.id
  from auth.users u where lower(u.email) = f.email and f.uid is null;

create index if not exists esc_email_fila_uid_idx on public.esc_email_fila(uid);
create index if not exists esc_email_fila_status_idx on public.esc_email_fila(campanha, status);
create index if not exists esc_email_fila_resend_idx on public.esc_email_fila(resend_id) where resend_id is not null;

-- criados com CONCURRENTLY porque o jogo estava no ar (fora de transação):
-- create index concurrently game_plays_user_created_idx on public.game_plays(user_id, created_at);
-- create index concurrently site_visits_user_created_idx on public.site_visits(user_id, created_at);

-- ── 2. o disparo anota a posição e a foto ───────────────────────────────────
-- (só o trecho que mudou dentro de esc_email_lote, depois do net.http_post)
--
--   update public.esc_email_fila f
--      set status = 'enviado', enviado_em = now(), pedido_id = pedido,
--          lote_pos = x.pos,
--          jogou_antes = (select max(gp.created_at) from public.game_plays gp
--                          where gp.user_id = f.uid)
--     from unnest(emails) with ordinality as x(em, pos)
--    where f.campanha = cfg.campanha and f.email = x.em;

-- ── 3. o conferidor guarda o id de cada mensagem ────────────────────────────
-- A resposta do endpoint de LOTE vem com os ids na MESMA ORDEM em que os
-- e-mails foram montados — é por isso que existe o `lote_pos`:
--   resend_id = corpo->'data'->(lote_pos - 1)->>'id'
-- (esc_email_conferir também continua devolvendo pra fila os lotes recusados)

-- ── 4. buscador de eventos (chegou? abriu? clicou?) ─────────────────────────
-- Trabalha em DOIS TEMPOS porque o pedido de internet do banco (pg_net) é
-- assíncrono: a rodada lê as respostas da rodada anterior e SÓ ENTÃO dispara
-- pedidos novos. Roda de hora em hora, então a resposta chega na rodada seguinte.
create or replace function public.esc_email_eventos(p_quantos integer default 20)
 returns jsonb language plpgsql security definer set search_path to 'public'
as $function$
declare r record; chave text; pedido bigint;
        lidos int := 0; disparados int := 0; retry int := 0; corpo jsonb; ev text;
begin
  for r in
    select f.campanha, f.email, x.status_code, x.content
      from public.esc_email_fila f
      join net._http_response x on x.id = f.evento_pedido
     where f.evento_pedido is not null
  loop
    if r.status_code between 200 and 299 then
      begin corpo := r.content::jsonb; exception when others then corpo := null; end;
      ev := coalesce(corpo->>'last_event', 'enviado');
      update public.esc_email_fila
         set evento = ev, evento_em = now(), evento_pedido = null
       where campanha = r.campanha and email = r.email;
      lidos := lidos + 1;
    elsif r.status_code = 404 then
      update public.esc_email_fila set evento = 'sumiu', evento_em = now(), evento_pedido = null
       where campanha = r.campanha and email = r.email;
      lidos := lidos + 1;
    else
      -- 429/500: não conclui nada, só libera pra tentar de novo
      update public.esc_email_fila set evento_pedido = null
       where campanha = r.campanha and email = r.email;
      retry := retry + 1;
    end if;
  end loop;

  select decrypted_secret into chave from vault.decrypted_secrets where name = 'RESEND_API_KEY';
  if chave is null then
    return jsonb_build_object('ok', false, 'motivo', 'sem chave', 'lidos', lidos);
  end if;

  for r in
    select f.campanha, f.email, f.resend_id from public.esc_email_fila f
     where f.status = 'enviado' and f.resend_id is not null and f.evento_pedido is null
       and f.enviado_em > now() - interval '7 days'
       and (f.evento is null or f.evento not in ('clicked', 'bounced', 'complained', 'sumiu'))
       and (f.evento_em is null or f.evento_em < now() - interval '45 minutes')
     order by f.evento_em nulls first, f.ordem
     limit greatest(1, least(p_quantos, 60))
  loop
    select net.http_get(
      url := 'https://api.resend.com/emails/' || r.resend_id,
      headers := jsonb_build_object('Authorization', 'Bearer ' || chave)
    ) into pedido;
    update public.esc_email_fila set evento_pedido = pedido
     where campanha = r.campanha and email = r.email;
    disparados := disparados + 1;
  end loop;

  return jsonb_build_object('ok', true, 'lidos', lidos, 'disparados', disparados, 'pra_tentar_de_novo', retry);
end $function$;

-- ── 5. o placar ─────────────────────────────────────────────────────────────
-- 'voltou'        = jogou uma partida DEPOIS de receber
-- 'voltou_sumido' = idem, mas estava sumido há +14 dias → é o resultado LIMPO
--                   (quem já jogava todo dia voltaria de qualquer jeito)
-- 'so_espiou'     = entrou no site mas não jogou
--
-- Trancado: chamada de dentro (cron/SQL direto) não tem jwt e passa; chamada
-- pelo site TEM jwt e precisa ser o e-mail do dono.
create or replace function public.esc_email_so_o_dono() returns void
 language plpgsql security definer set search_path to 'public' as $$
declare claims text;
begin
  claims := current_setting('request.jwt.claims', true);
  if claims is null or claims = '' then return; end if;
  if coalesce(auth.jwt() ->> 'email', '') <> 'diego.c.fonseca@gmail.com' then
    raise exception 'so o dono ve o placar da campanha';
  end if;
end $$;

-- esc_email_placar()      → jsonb com o resumo geral
-- esc_email_placar_dias() → uma linha por dia (dá pra comparar assuntos)
-- (definições completas no banco; ambas chamam esc_email_so_o_dono() primeiro)

-- ── 6. cron ────────────────────────────────────────────────────────────────
-- email-diario   0 13 * * *  → esc_email_lote()        (10h da manhã no Brasil)
-- email-conferir 30 13 * * * → esc_email_conferir()
-- email-eventos  7 * * * *   → esc_email_conferir() + esc_email_eventos(40)

-- ⚠️ `esc_email_fila` tem RLS LIGADA e ZERO POLÍTICAS de propósito: são 8,5 mil
-- e-mails de gente de verdade e o site não lê essa tabela. NÃO criar política ali.

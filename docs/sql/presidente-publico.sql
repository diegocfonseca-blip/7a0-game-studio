-- 🧑‍💼 O PRESIDENTE DOS OUTROS NA SALA (16/10, aplicado no banco). A tabela `esc_presidente` só deixa cada um ler o
-- PRÓPRIO boneco (RLS). Pra sala desenhar o presidente de todo mundo, esta função devolve só o VISUAL (nunca o e-mail)
-- e só de quem tem plano (⭐ Craque pra cima, mesma régua do `esc_plano_rank`). Grátis não tem presidente.
create or replace function public.esc_presidentes_publicos(p_uids uuid[])
returns table (user_id uuid, visual jsonb) language sql stable security definer set search_path = public as $$
  select p.user_id, p.visual from public.esc_presidente p
  where p.user_id = any (p_uids[1:40]) and p.visual is not null
    and coalesce(public.esc_plano_rank(p.email), 0) >= 1
$$;
revoke all on function public.esc_presidentes_publicos(uuid[]) from public;
grant execute on function public.esc_presidentes_publicos(uuid[]) to anon, authenticated;

-- v2 (16/10, aplicado): devolve também o PLANO (rank), porque o fundo do busto é a cor do tier da pessoa
-- (Diego: "se é batismo e fundador dourado… lenda dourado também, craque prata, grátis aquele badgezinho").
create or replace function public.esc_presidentes_publicos2(p_uids uuid[])
returns table (user_id uuid, visual jsonb, rank int) language sql stable security definer set search_path = public as $$
  select p.user_id, p.visual, r.rank from public.esc_presidente p
  cross join lateral (select coalesce(public.esc_plano_rank(p.email), 0) as rank) r
  where p.user_id = any (p_uids[1:40]) and p.visual is not null and r.rank >= 1
$$;
revoke all on function public.esc_presidentes_publicos2(uuid[]) from public;
grant execute on function public.esc_presidentes_publicos2(uuid[]) to anon, authenticated;

do $check$
begin
  if (select count(*) from public.rank_legacy_fingerprint) <> 3 or exists (
    select 1 from public.rank_legacy_fingerprint f
    join pg_proc p on p.proname = f.proname
    join pg_namespace n on n.oid = p.pronamespace and n.nspname = 'public'
    where md5(pg_get_functiondef(p.oid)) <> f.hash
  ) then
    raise exception 'a proposta alterou uma RPC antiga';
  end if;
end;
$check$;

set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000001', false);

insert into public.esc_pyramid_rank_snap
  (user_id,career_id,season_no,team_name,copa_titles,mundial_titles,libertadores_titles,money)
values
  ('00000000-0000-0000-0000-000000000001',87,88,'Neymarzetty FC',1,1,1,10);
-- Repetir UPDATE sobrescreve os contadores; não soma duas vezes.
update public.esc_pyramid_rank_snap set mundial_titles=1, libertadores_titles=1
where user_id=auth.uid() and career_id=87 and season_no=88;
update public.esc_pyramid_rank_snap set mundial_titles=1, libertadores_titles=1
where user_id=auth.uid() and career_id=87 and season_no=88;

do $check$
declare r record;
begin
  select * into r from public.esc_pyramid_rank_v2(88,50);
  if r.team_name <> 'Neymarzetty FC' or r.mundial_titles <> 1 or r.libertadores_titles <> 1 then
    raise exception 'Diego: identidade, títulos ou duplicação incorretos';
  end if;
  select * into r from public.esc_pyramid_career_rank_v2(88,auth.uid(),87);
  if r.pos <> 1 or r.total <> 1 or r.team_name <> 'Neymarzetty FC' then
    raise exception 'posição da carreira incorreta';
  end if;
end;
$check$;

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000002', false);
insert into public.esc_pyramid_rank_snap
  (user_id,career_id,season_no,team_name,honors_a,money)
values
  ('00000000-0000-0000-0000-000000000002',10,88,'Outro FC',4,2);

do $check$
begin
  begin
    update public.esc_pyramid_rank_snap set champions_titles=1
    where user_id=auth.uid() and career_id=10 and season_no=88;
    raise exception 'outra conta conseguiu gravar Champions';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.esc_pyramid_rank_snap
      (user_id,career_id,season_no,team_name,libertadores_titles)
    values (auth.uid(),11,88,'Outra carreira',1);
    raise exception 'outra conta conseguiu inserir título internacional';
  exception when insufficient_privilege then null;
  end;
  if exists (select 1 from public.esc_pyramid_rank_snap
             where user_id=auth.uid() and champions_titles<>0) then
    raise exception 'contador antigo foi alterado';
  end if;
  if exists (select 1 from public.esc_pyramid_rank_v2(88,50)) then
    raise exception 'outra conta leu a RPC privada';
  end if;
  if exists (select 1 from public.esc_pyramid_rank_rows_v2(88)) then
    raise exception 'outra conta leu a função base privada';
  end if;
end;
$check$;

select set_config('request.jwt.claim.sub', '', false);
do $check$
begin
  if exists (select 1 from public.esc_pyramid_rank_v2(88,50)) then
    raise exception 'anônimo leu a RPC privada';
  end if;
end;
$check$;

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000001', false);
do $check$
declare r record;
begin
  select * into r from public.esc_pyramid_rank_v2(88,50) limit 1;
  if r.team_name <> 'Neymarzetty FC' then raise exception 'ordem de pontos incorreta'; end if;
  select * into r from public.esc_pyramid_my_rank_v2(88,auth.uid());
  if r.pos <> 1 or r.total <> 2 then raise exception 'posição global incorreta'; end if;
end;
$check$;

insert into public.esc_pyramid_rank_snap
  (user_id,career_id,season_no,team_name,world_titles,mundial_titles,
   libertadores_titles,champions_titles,copa_titles)
values
  (auth.uid(),101,101,'Neymarzetty FC',1,1,1,1,1);
do $check$
declare score bigint;
begin
  select points into score from public.esc_pyramid_rank_rows_v2(101)
  where user_id=auth.uid() and career_id=101;
  if score <> 360 then raise exception 'pesos 200/50/40/40/30 incorretos: %', score; end if;
  if exists (select 1 from public.esc_pyramid_rank_rows_v2(88) where career_id=101) then
    raise exception 'snapshot futuro vazou para a T88';
  end if;
end;
$check$;

-- Fora do Top 50: a posição da pessoa deve ser calculada no conjunto todo.
reset role;
insert into public.esc_pyramid_rank_snap
  (user_id,career_id,season_no,team_name,world_titles)
select ('00000000-0000-0000-0000-' || lpad(g::text,12,'0'))::uuid,
  1,101,'Fixture ' || g,3
from generate_series(100,159) g;
set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000001', false);
do $check$
declare r record;
begin
  if (select count(*) from public.esc_pyramid_rank_v2(101,50)) <> 50 then
    raise exception 'Top 50 incorreto';
  end if;
  if exists (select 1 from public.esc_pyramid_rank_v2(101,50)
             where user_id=auth.uid()) then
    raise exception 'usuário fora do Top 50 apareceu no Top 50';
  end if;
  select * into r from public.esc_pyramid_my_rank_v2(101,auth.uid());
  if r.pos <> 61 or r.total <> 62 then
    raise exception 'posição fora do Top 50 incorreta: %, %', r.pos, r.total;
  end if;
end;
$check$;
select 'OK: SQL em PostgreSQL descartável, conta privada, outra conta, anônimo, ranking, idempotência' as resultado;

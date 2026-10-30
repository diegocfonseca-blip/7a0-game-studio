-- 🚑 30/10 (madrugada, ~23h58 de Brasília): o banco travou e parou o online. O campeão de tempo era esc_cla_ranking():
-- 2.498 chamadas com ~3 s cada (a caixa "Clãs da semana" chama ao abrir a lista de salas). Agora a conta roda no máximo
-- 1 vez a cada 2 min e todo mundo lê a mesma resposta (esc_cache_rpc). Quem chega enquanto outro calcula leva a resposta
-- anterior (advisory lock), nunca empilha. APLICADO direto no banco em 30/10 03:06 UTC.
-- Pra voltar ao jeito antigo: a definição anterior era `language sql stable` com o select de baixo, sem cache.
create table if not exists public.esc_cache_rpc (chave text primary key, valor jsonb not null, em timestamptz not null default now());
alter table public.esc_cache_rpc enable row level security;
create or replace function public.esc_cla_ranking()
 returns jsonb language plpgsql volatile security definer set search_path to 'public' as $$
declare c_valor jsonb; c_em timestamptz; v jsonb;
begin
  select valor, em into c_valor, c_em from esc_cache_rpc where chave = 'cla_ranking';
  if c_em is not null and c_em > now() - interval '2 minutes' then return c_valor; end if;
  if not pg_try_advisory_xact_lock(7731001) then return coalesce(c_valor, '[]'::jsonb); end if;
  select coalesce(jsonb_agg(esc_cla_json(s.cla_id) || jsonb_build_object('pos', s.pos) order by s.pos, s.cla_id), '[]'::jsonb) into v
  from (select cla_id, titulos, rank() over (order by titulos desc) as pos from esc_clas_semana(0)) s where s.pos <= 20;
  insert into esc_cache_rpc (chave, valor, em) values ('cla_ranking', v, now())
    on conflict (chave) do update set valor = excluded.valor, em = excluded.em;
  return v;
end $$;

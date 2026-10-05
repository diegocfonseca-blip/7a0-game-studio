-- 🧱 LEILÃO DE CLUBES: memória COMPARTILHADA de quais clubes saíram (Diego 05/10)
-- Antes a memória de "esse clube já saiu" ficava no celular de quem criava a sala:
-- cada dono novo começava do zero e os mesmos clubes (Goleiros do Colo-Colo…) caíam
-- toda hora. Agora toda sala grava o que saiu aqui, e a próxima sala (de qualquer
-- dono) lê as últimas 8 partidas antes de sortear.
-- Não guarda nada de ninguém: só a lista clube → setor de cada partida.
create table if not exists public.esc_clubes_saidos (
  id bigserial primary key,
  criado_em timestamptz not null default now(),
  mem jsonb not null
);
alter table public.esc_clubes_saidos enable row level security;
-- ninguém lê/escreve direto na tabela: só pelas duas funções abaixo

create or replace function public.esc_clubes_recentes()
returns jsonb language sql security definer set search_path = public stable as $$
  select coalesce(jsonb_agg(mem order by id), '[]'::jsonb)
  from (select id, mem from esc_clubes_saidos order by id desc limit 8) t
$$;

create or replace function public.esc_clubes_grava(p_mem jsonb)
returns void language plpgsql security definer set search_path = public as $$
begin
  -- trava de tamanho: uma partida tem no máximo uns 5 setores × 60 clubes
  if jsonb_typeof(p_mem) <> 'array' or jsonb_array_length(p_mem) > 400 or length(p_mem::text) > 20000 then return; end if;
  insert into esc_clubes_saidos(mem) values (p_mem);
  delete from esc_clubes_saidos where id < (select max(id) - 50 from esc_clubes_saidos);
end $$;

revoke all on function public.esc_clubes_grava(jsonb) from public;
grant execute on function public.esc_clubes_recentes() to anon, authenticated;
grant execute on function public.esc_clubes_grava(jsonb) to anon, authenticated;

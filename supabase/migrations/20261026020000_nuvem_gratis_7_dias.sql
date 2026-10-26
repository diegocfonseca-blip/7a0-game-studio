-- ☁️ 26/10 (Diego: "se passar de 7 dias sem uso ela é excluída automaticamente pra quem é grátis… só pra quem não tem plano…
-- só quem não tem usado o save"). Retrato do que ficou valendo no banco (aplicado em 2 partes pela ferramenta).
-- 1) a marca: conta SEM PLANO que sobe a carreira pela 1ª vez a partir de 26/10 (quem já tinha save antes não é marcado)
create table if not exists public.esc_nuvem_gratis (
  user_id uuid primary key,
  desde timestamptz not null default now()
);
alter table public.esc_nuvem_gratis enable row level security;

create or replace function public.esc_nuvem_gratis_marca()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare v_email text;
begin
  select lower(email) into v_email from auth.users where id = new.user_id;
  if not coalesce((public.esc_direitos_de(v_email) ->> 'pago')::boolean, false) then
    insert into public.esc_nuvem_gratis(user_id) values (new.user_id) on conflict (user_id) do nothing;
  end if;
  return new;
exception when others then
  return new; -- a marca nunca pode impedir um save
end;
$$;

create trigger esc_nuvem_gratis_marca after insert on public.esc_pyramid_saves
  for each row execute function public.esc_nuvem_gratis_marca();

-- 2) todo dia 09:17 UTC: marcada + sem plano + 7 dias sem salvar → a carreira da NUVEM fica vazia (a do aparelho não é tocada)
create or replace function public.esc_nuvem_gratis_limpa()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare n integer := 0;
begin
  with alvo as (
    select g.user_id from public.esc_nuvem_gratis g
      join public.esc_pyramid_saves p on p.user_id = g.user_id
      join auth.users u on u.id = g.user_id
     where p.updated_at < now() - interval '7 days'
       and p.save <> '{}'::jsonb
       and not coalesce((public.esc_direitos_de(lower(u.email)) ->> 'pago')::boolean, false)
  ), feito as (
    update public.esc_pyramid_saves p set save = '{}'::jsonb from alvo where p.user_id = alvo.user_id returning p.user_id
  )
  select count(*) into n from feito;
  return n;
end;
$$;

select cron.schedule('esc-nuvem-gratis-7d', '17 9 * * *', 'select public.esc_nuvem_gratis_limpa()');

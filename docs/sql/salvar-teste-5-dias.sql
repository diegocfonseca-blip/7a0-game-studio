-- 🎁 08/11 (Diego): os primeiros 5 dias salvando a carreira são grátis; depois, salvar novos avanços é com plano.
-- Os 5 dias começam no 1º Salvar (ou 1º salvamento automático) de quem não tem plano, contados por CONTA. APLICADO 08/11.
create table if not exists public.esc_salvar_teste (
  uid uuid primary key references auth.users(id) on delete cascade,
  inicio timestamptz not null default now()
);
alter table public.esc_salvar_teste enable row level security;
create policy esc_salvar_teste_le_o_meu on public.esc_salvar_teste for select to authenticated using (uid = auth.uid());
create or replace function public.esc_salvar_teste_inicia()
 returns timestamptz language plpgsql security definer set search_path to ''
as $$
declare i timestamptz;
begin
  if auth.uid() is null then raise exception 'Authentication required' using errcode = '42501'; end if;
  insert into public.esc_salvar_teste(uid) values (auth.uid()) on conflict (uid) do nothing;
  select inicio into i from public.esc_salvar_teste where uid = auth.uid();
  return i + interval '5 days';
end $$;
grant execute on function public.esc_salvar_teste_inicia() to authenticated;
-- ☁️ o "1 dia sem salvar apaga da nuvem" (07/11) SAI: sem poder salvar depois do teste, ele apagaria a carreira da pessoa.
select cron.unschedule('esc-nuvem-gratis-1d');

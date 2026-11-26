-- 🔄 26/11 carreira online (co2): a FOTO da virada. Quem comanda grava o estado do fim do leilão de todos (comprimido) por
-- temporada; quem faltou na virada lê essa foto quando volta e alcança (mesma junção de quem estava: o clube dele fica
-- como estava no aparelho dele, elencos/bots/mercado vêm da foto). Só membros da carreira leem; só quem comanda grava.
-- Acesso só pelas duas funções (a tabela não tem política: ninguém lê nem escreve direto).
create table if not exists public.esc_carr_virada (
  sala uuid not null references public.esc_carr_sala(id) on update cascade,
  temporada int not null,
  z text not null,
  em timestamptz not null default now(),
  primary key (sala, temporada)
);
alter table public.esc_carr_virada enable row level security;

create or replace function public.esc_carr_virada_salva(p_sala uuid, p_temporada int, p_z text)
returns text language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null or not public.esc_carr_sou_comandante(p_sala) then return 'comando'; end if;
  if p_temporada is null or p_temporada < 2 or p_z is null or length(p_z) > 3000000 then return 'erro'; end if;
  insert into public.esc_carr_virada(sala, temporada, z, em) values (p_sala, p_temporada, p_z, now())
  on conflict (sala, temporada) do update set z = excluded.z, em = now();
  return 'ok';
end $$;

create or replace function public.esc_carr_virada_le(p_sala uuid, p_temporada int)
returns text language sql stable security definer set search_path = public as $$
  select v.z from public.esc_carr_virada v
  where v.sala = p_sala and v.temporada = p_temporada and auth.uid() is not null and public.esc_carr_sou_membro(p_sala)
$$;
grant execute on function public.esc_carr_virada_salva(uuid, int, text) to authenticated;
grant execute on function public.esc_carr_virada_le(uuid, int) to authenticated;

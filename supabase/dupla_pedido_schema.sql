-- 🤝 DUPLA — pedido/aceite (09/08, pedido do Diego): trocar o "toca e já vira
-- dupla na hora" por "toca em alguém, ela recebe um pedido e ACEITA ou
-- RECUSA/deixa expirar". O 🔒 (dupla_seek='privada') continua igual (a
-- pessoa mesma marca na própria vaga — bloqueia pedido de qualquer um).
--
-- Como aplicar: cole no SQL Editor do Supabase (projeto do Leilão Legends) e
-- rode. É idempotente: pode rodar quantas vezes quiser.
--
-- Como reverter (some tudo, zero rastro):
--   drop function if exists public.dupla_responder(uuid, uuid, boolean);
--   alter table public.room_players
--     drop column if exists dupla_request_to,
--     drop column if exists dupla_request_at;

-- Quem EU pedi pra jogar junto (fica na MINHA própria linha — cada um só
-- escreve na própria linha por conta da RLS). NULL = sem pedido em aberto.
alter table public.room_players
  add column if not exists dupla_request_to uuid references auth.users(id) on delete set null;

-- Quando mandei o pedido (o app expira sozinho depois de ~30s sem resposta —
-- cancela escrevendo NULL na própria linha, não precisa de função pra isso).
alter table public.room_players
  add column if not exists dupla_request_at timestamptz;

-- 🔐 Responder um pedido (aceitar ou recusar) precisa mexer na linha de QUEM
-- PEDIU (grava dupla_partner_of nela) — e a RLS normal só deixa cada um
-- mexer na própria linha. Por isso é uma function SECURITY DEFINER: ela
-- confere no servidor que o pedido é mesmo PRA MIM (auth.uid()) antes de
-- gravar qualquer coisa — ninguém consegue aceitar pedido alheio.
drop function if exists public.dupla_responder(uuid, uuid, boolean);
create or replace function public.dupla_responder(p_room uuid, p_requester uuid, p_aceitar boolean)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  ok boolean;
begin
  if auth.uid() is null then
    return false;
  end if;
  -- só existe pedido de verdade se a linha de quem pediu APONTA pra mim
  select true into ok
    from public.room_players
   where room_id = p_room and user_id = p_requester and dupla_request_to = auth.uid()
   limit 1;
  if not ok then
    return false; -- pedido não existe mais (expirou, foi cancelado, ou nunca existiu)
  end if;
  if p_aceitar then
    update public.room_players
       set dupla_partner_of = auth.uid(), dupla_request_to = null, dupla_request_at = null, dupla_seek = null
     where room_id = p_room and user_id = p_requester;
  else
    update public.room_players
       set dupla_request_to = null, dupla_request_at = null
     where room_id = p_room and user_id = p_requester;
  end if;
  return true;
end;
$$;

grant execute on function public.dupla_responder(uuid, uuid, boolean) to authenticated;

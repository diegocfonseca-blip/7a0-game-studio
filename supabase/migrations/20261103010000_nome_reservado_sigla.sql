-- 🔒🔤 03/11 (Diego): NOME DE QUEM TEM PLANO É SÓ DELE — e quem já usava perde o nome pras INICIAIS.
-- Palavras dele: *"quem não tem plano pode ter nome repetido… quando alguém fizer um plano com o nome daquela pessoa, aquele cara
-- perdeu o nome… o nome dele fica uma abreviação que ninguém tem ainda, JPF"* e *"quem já tem, continua com a conta fake"*.
--  1. esc_nome_livre: nome de batismo OU de conta com plano fica BLOQUEADO pra todo mundo (antes o grátis passava como 🎭 fake).
--     A comparação agora ignora acento, espaço, "_" e caixa (esc_nome_chave) — "Mengão Malvadao" e "Neymar_FC" não escapam mais.
--  2. esc_nome_reservas: quem já é dono de nome HOJE entra na lista sem mexer em ninguém (os fakes de hoje ficam fakes).
--  3. esc_nomes_reserva_tick (a cada 10 min): conta que virou paga (ou trocou de nome) e ainda não está na lista → reserva o nome e
--     troca o nome das contas GRÁTIS iguais pelas iniciais únicas (JPF, JPF2…), com aviso na próxima entrada (esc_avisos_conta).
--     Tudo que mudou fica em esc_nome_trocas (pra desfazer: devolver `antigo` no display_name).

create or replace function public.esc_nome_livre(p_nome text, p_email text) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  k text := public.esc_nome_chave(p_nome);
  meu text;
  outro_pago boolean := false;
begin
  if k = '' then return jsonb_build_object('livre', true); end if;
  meu := lower(btrim(coalesce(auth.jwt()->>'email', '')));
  if meu = '' and auth.uid() is null then meu := lower(btrim(coalesce(p_email, ''))); end if;
  -- batismo: só o dono do e-mail usa (qualquer forma: com/sem acento, espaço, "_")
  if exists (select 1 from esc_nomes_batismo b where public.esc_nome_chave(b.nome_norm) = k) then
    if meu <> '' and exists (select 1 from esc_nomes_batismo b where public.esc_nome_chave(b.nome_norm) = k and lower(btrim(b.email)) = meu) then
      return jsonb_build_object('livre', true);
    end if;
    return jsonb_build_object('livre', false, 'motivo', 'batismo');
  end if;
  -- conta COM plano usando esse nome: bloqueado pra todos (grátis entre si pode repetir)
  select coalesce(bool_or(coalesce((public.esc_direitos_de(lower(u.email)) ->> 'pago')::boolean, false)), false) into outro_pago
    from auth.users u
   where public.esc_nome_chave(u.raw_user_meta_data->>'display_name') = k
     and u.id is distinct from auth.uid()
     and (meu = '' or lower(coalesce(u.email, '')) <> meu);
  if outro_pago then return jsonb_build_object('livre', false, 'motivo', 'em_uso'); end if;
  return jsonb_build_object('livre', true);
end $$;

create table if not exists public.esc_nome_reservas (
  chave text not null, email text not null, desde timestamptz not null default now(), primary key (chave, email));
alter table public.esc_nome_reservas enable row level security; -- sem política: só as funções

create table if not exists public.esc_nome_trocas (
  id bigserial primary key, user_id uuid not null, antigo text, novo text not null, chave text not null, dono_email text not null,
  em timestamptz not null default now());
alter table public.esc_nome_trocas enable row level security;

-- iniciais únicas: "João Pé de Feijão" → JPDF; palavra única → 3 primeiras letras; já existe → JPDF2, JPDF3…
create or replace function public.esc_nome_sigla(p_nome text) returns text
language plpgsql stable security definer set search_path = public as $$
declare
  limpo text := translate(upper(coalesce(p_nome, '')), 'ÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇÑ', 'AAAAAEEEEIIIIOOOOOUUUUCN');
  w text; base text := ''; cand text; n int := 1;
begin
  foreach w in array regexp_split_to_array(btrim(regexp_replace(limpo, '[^A-Z0-9]+', ' ', 'g')), ' ') loop
    if w <> '' then base := base || left(w, 1); end if;
  end loop;
  if char_length(base) < 2 then base := left(regexp_replace(limpo, '[^A-Z0-9]', '', 'g'), 3); end if;
  if base = '' then base := 'TEC'; end if;
  base := left(base, 12);
  cand := base;
  while exists (select 1 from auth.users u where public.esc_nome_chave(u.raw_user_meta_data->>'display_name') = lower(cand))
     or exists (select 1 from esc_nomes_batismo b where public.esc_nome_chave(b.nome_norm) = lower(cand)) loop
    n := n + 1; cand := base || n;
  end loop;
  return cand;
end $$;

-- quem é dono de nome agora: contas pagas (pelo nome da conta) + batismos
create or replace function public.esc_nome_donos_agora() returns table(chave text, email text)
language sql stable security definer set search_path = public as $$
  with cand as (
    select lower(email) e from user_colors where tier in ('prata','ouro')
    union select lower(email) from esc_fundadores union select lower(email) from esc_socios
    union select lower(email) from esc_compras_batismo union select lower(email) from esc_assinaturas
    union select lower(email) from esc_assinatura_mensal)
  select public.esc_nome_chave(u.raw_user_meta_data->>'display_name'), lower(u.email)
    from cand c join auth.users u on lower(u.email) = c.e
   where public.esc_nome_chave(u.raw_user_meta_data->>'display_name') <> ''
     and coalesce((public.esc_direitos_de(c.e) ->> 'pago')::boolean, false)
  union
  select public.esc_nome_chave(b.nome_norm), lower(btrim(b.email)) from esc_nomes_batismo b where public.esc_nome_chave(b.nome_norm) <> ''
$$;

-- semente: quem já é dono hoje entra SEM trocar o nome de ninguém
insert into public.esc_nome_reservas (chave, email) select chave, email from public.esc_nome_donos_agora() on conflict do nothing;

create or replace function public.esc_nomes_reserva_tick() returns int
language plpgsql security definer set search_path = public as $$
declare r record; v record; novo text; feitos int := 0;
begin
  for r in select d.chave, d.email from esc_nome_donos_agora() d
            where not exists (select 1 from esc_nome_reservas x where x.chave = d.chave and x.email = d.email) loop
    insert into esc_nome_reservas (chave, email) values (r.chave, r.email) on conflict do nothing;
    for v in select u.id, u.email, u.raw_user_meta_data->>'display_name' as nome from auth.users u
              where public.esc_nome_chave(u.raw_user_meta_data->>'display_name') = r.chave
                and lower(coalesce(u.email, '')) <> r.email
                and not coalesce((public.esc_direitos_de(lower(u.email)) ->> 'pago')::boolean, false)
                and not exists (select 1 from esc_nomes_batismo b where lower(btrim(b.email)) = lower(u.email) and public.esc_nome_chave(b.nome_norm) = r.chave) loop
      novo := public.esc_nome_sigla(v.nome);
      update auth.users set raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('display_name', novo) where id = v.id;
      insert into esc_nome_trocas (user_id, antigo, novo, chave, dono_email) values (v.id, v.nome, novo, r.chave, r.email);
      insert into esc_avisos_conta (user_id, titulo, texto) values (v.id, '🔤 Seu nome mudou ||| 🔤 Your name changed',
        'Seu nome agora é ' || novo || ', porque outro jogador reservou "' || v.nome || '" com plano. Sua carreira, seus títulos e seu clã continuam iguais. Quer outro nome? Troque quando quiser na sua Conta. ||| Your name is now ' || novo || ', because another player reserved "' || v.nome || '" with a plan. Your career, titles and clan stay the same. Want another name? Change it anytime in your Account.');
      feitos := feitos + 1;
    end loop;
  end loop;
  return feitos;
end $$;

select cron.schedule('esc-nomes-reserva', '*/10 * * * *', 'select public.esc_nomes_reserva_tick()');

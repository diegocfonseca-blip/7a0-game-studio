-- 📝 21/10 (Diego): "cada clã tem que ter a sua descrição… opcional na hora de criar… e no convite aparece o clã e a descrição,
-- pra pessoa ver se aceita ou não". Até 200 letras, sem link e sem palavrão (a MESMA régua do Super Chat) e nada ofensivo.
alter table public.esc_clas add column if not exists descricao text;
create or replace function public.esc_cla_desc_erro(t text) returns text language sql immutable set search_path = public as $$
  select case when char_length(t) > 200 then 'desc_tamanho'
              when t ~* '(https?://|www\.|\.com|\.br\M|\.net|wa\.me)' then 'desc_link'
              when t ~* '\m(porra|caralh|puta|merda|buceta|viad|fdp|vsf|arromb|cuz[aã]o|desgra[cç]|piroc|xoxot)' or esc_nome_ofensivo(t) then 'desc_feia'
              else null end
$$;
-- o presidente escreve/troca (vazio = tira)
create or replace function public.esc_cla_descricao(p_cla bigint, p_texto text) returns jsonb language plpgsql security definer set search_path = public as $$
declare c bigint := esc_cla_meu_alvo(p_cla); t text := btrim(regexp_replace(coalesce(p_texto, ''), '\s+', ' ', 'g')); e text;
begin
  if c is null or (select lider from esc_clas where id = c) <> auth.uid() then return jsonb_build_object('erro', 'nao_pode'); end if;
  e := esc_cla_desc_erro(t);
  if e is not null then return jsonb_build_object('erro', e); end if;
  update esc_clas set descricao = nullif(t, '') where id = c;
  return jsonb_build_object('ok', true);
end $$;
-- criar com descrição: confere ANTES (pra não nascer o clã e a descrição falhar), cria pela porta de sempre e grava
create or replace function public.esc_cla_criar(p_nome text, p_emblema text, p_aberto boolean, p_trocar boolean, p_descricao text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare t text := btrim(regexp_replace(coalesce(p_descricao, ''), '\s+', ' ', 'g')); e text := esc_cla_desc_erro(t); r jsonb;
begin
  if e is not null then return jsonb_build_object('erro', e); end if;
  r := esc_cla_criar(p_nome, p_emblema, p_aberto, p_trocar);
  if (r ->> 'ok')::boolean and t <> '' then update esc_clas set descricao = t where id = (r ->> 'id')::bigint; end if;
  return r;
end $$;
create or replace function public.esc_cla_json(p_cla bigint) returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object('id', c.id, 'nome', c.nome, 'emblema', c.emblema, 'aberto', c.aberto, 'lider', c.lider, 'lider_nome', esc_nome_conta(c.lider),
    'membros', (select count(*) from esc_cla_gente() g where g.cla_id = c.id),
    'titulos', coalesce((select s.titulos from esc_clas_semana(0) s where s.cla_id = c.id), 0),
    'campeao', c.id = esc_cla_campeao_passado(), 'extra', c.extra, 'descricao', c.descricao)
  from esc_clas c where c.id = p_cla
$$;
grant execute on function public.esc_cla_descricao(bigint, text), public.esc_cla_criar(text, text, boolean, boolean, text) to authenticated;

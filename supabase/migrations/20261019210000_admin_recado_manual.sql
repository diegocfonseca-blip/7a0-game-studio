-- 💬 SUPER CHAT MANUAL (19/10, Diego: "as vezes eu posso dar recado do dia se passando por algum time. Faça ali manual"):
-- o Diego escreve o recado com o nome de um time, 1 h ou o dia todo. Mesmos limites do recado pago (60 letras, time 2-30).
create or replace function public.esc_admin_recado(p_inicio timestamptz, p_horas int, p_autor text, p_texto text) returns text
language plpgsql security definer set search_path to 'public' as $$
declare i timestamptz := coalesce(p_inicio, now()); a text := trim(coalesce(p_autor, '')); t text := trim(coalesce(p_texto, ''));
begin
  if coalesce(auth.jwt() ->> 'email', '') <> 'diego.c.fonseca@gmail.com' then return 'sem_permissao'; end if;
  if char_length(a) < 2 or char_length(a) > 30 then return 'time_tamanho'; end if;
  if char_length(t) < 2 or char_length(t) > 60 then return 'texto_tamanho'; end if;
  if p_horas not in (1, 24) then return 'duracao'; end if;
  insert into public.esc_anuncios (tipo, texto, emoji, inicio, fim, autor)
    values ('recado', t, '💬', i, i + make_interval(hours => p_horas), a);
  return 'ok';
end $$;

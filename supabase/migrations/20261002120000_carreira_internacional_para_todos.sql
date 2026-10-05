-- 🟢 02/10 (Diego: "liberar pra todos"): a carreira internacional sai do teste fechado.
-- Toda conta logada pode gravar os títulos de Mundial/Libertadores/Champions na própria
-- linha do ranking e lê o ranking com eles (as RPCs _v2). O gatilho continua exigindo
-- que a linha seja da própria conta e que nenhum contador seja negativo.
-- Reverter: voltar o corpo abaixo pro teste por e-mail da migração 20261001173507.
create or replace function public.esc_private_international_rank_allowed()
returns boolean language sql stable security definer
set search_path = ''
as $allowed$
  select (select auth.uid()) is not null;
$allowed$;

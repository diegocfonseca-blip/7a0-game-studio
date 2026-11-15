-- Em produção o índice foi criado CONCURRENTLY antes desta migração.
-- O caminho abaixo permite reproduzir a migração em uma instalação nova.
DO $index$
BEGIN
  IF to_regclass('public.live_beats_user_beat_idx') IS NULL THEN
    CREATE INDEX live_beats_user_beat_idx ON public.live_beats(user_id,beat_at DESC);
  ELSIF NOT (SELECT indisvalid FROM pg_index WHERE indexrelid='public.live_beats_user_beat_idx'::regclass) THEN
    RAISE EXCEPTION 'Recrie o índice de presença de forma concorrente antes de continuar';
  END IF;
END
$index$;
-- Mesmas APIs e resultados; só cache privado e cálculo único. Sem mexer nas salas.
-- Aplicar como uma única migração para gerar apenas uma recarga de metadados.
SET LOCAL lock_timeout = '800ms';
SET LOCAL statement_timeout = '8s';

CREATE TABLE IF NOT EXISTS private.esc_nomes_escudos_cache (
  id boolean PRIMARY KEY DEFAULT true CHECK (id),
  valor jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(valor) = 'array'),
  geracao bigint NOT NULL DEFAULT 0,
  valido boolean NOT NULL DEFAULT false,
  atualizado_em timestamptz
);
ALTER TABLE private.esc_nomes_escudos_cache ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON private.esc_nomes_escudos_cache FROM PUBLIC, anon, authenticated, service_role;
INSERT INTO private.esc_nomes_escudos_cache(id) VALUES (true) ON CONFLICT DO NOTHING;

-- Corpo original, sem mudar a proteção, inclusive o caso de nome exatamente
-- igual ao do dono. Somente o dono das funções públicas e o cron chamam isto.
CREATE OR REPLACE FUNCTION private.esc_calcula_nomes_sem_escudo()
RETURNS jsonb LANGUAGE sql STABLE SECURITY INVOKER SET search_path = '' AS $fn$
  WITH bat AS (
    SELECT public.esc_nome_chave(nome_norm) AS k, lower(btrim(email)) AS email
    FROM public.esc_nomes_batismo
  ), contas AS (
    SELECT lower(coalesce(u.email, '')) AS email,
      lower(btrim(u.raw_user_meta_data->>'display_name')) AS nome,
      public.esc_nome_chave(u.raw_user_meta_data->>'display_name') AS k
    FROM auth.users u WHERE coalesce(btrim(u.raw_user_meta_data->>'display_name'), '') <> ''
  ), donos AS (
    SELECT c.nome FROM contas c WHERE EXISTS (SELECT 1 FROM bat b WHERE b.k = c.k AND b.email = c.email)
  )
  SELECT coalesce(jsonb_agg(DISTINCT c.nome), '[]'::jsonb) FROM contas c
  WHERE c.k IN (SELECT k FROM bat)
    AND NOT EXISTS (SELECT 1 FROM bat b WHERE b.k = c.k AND b.email = c.email)
    AND c.nome NOT IN (SELECT nome FROM donos)
$fn$;
REVOKE ALL ON FUNCTION private.esc_calcula_nomes_sem_escudo() FROM PUBLIC, anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION private.esc_atualiza_nomes_sem_escudo()
RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $fn$
DECLARE versao bigint; resultado jsonb;
BEGIN
  SELECT geracao INTO versao FROM private.esc_nomes_escudos_cache WHERE id;
  resultado := private.esc_calcula_nomes_sem_escudo();
  -- Não substitui uma invalidação ocorrida durante a leitura das contas.
  UPDATE private.esc_nomes_escudos_cache SET valor=resultado, valido=true,
    atualizado_em=clock_timestamp() WHERE id AND geracao=versao;
END
$fn$;
REVOKE ALL ON FUNCTION private.esc_atualiza_nomes_sem_escudo() FROM PUBLIC, anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION private.esc_invalida_nomes_sem_escudo()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $fn$
BEGIN
  IF TG_TABLE_SCHEMA='auth' THEN
    IF TG_OP='UPDATE' THEN
      IF OLD.email IS NOT DISTINCT FROM NEW.email
         AND OLD.raw_user_meta_data->>'display_name' IS NOT DISTINCT FROM NEW.raw_user_meta_data->>'display_name'
      THEN RETURN NULL; END IF;
    END IF;
  END IF;
  UPDATE private.esc_nomes_escudos_cache SET valido=false, geracao=geracao+1 WHERE id;
  RETURN NULL;
END
$fn$;
REVOKE ALL ON FUNCTION private.esc_invalida_nomes_sem_escudo() FROM PUBLIC, anon, authenticated, service_role;

CREATE TRIGGER esc_cache_nomes_contas
AFTER INSERT OR DELETE OR UPDATE OF email, raw_user_meta_data ON auth.users
FOR EACH ROW EXECUTE FUNCTION private.esc_invalida_nomes_sem_escudo();
CREATE TRIGGER esc_cache_nomes_batismos
AFTER INSERT OR UPDATE OR DELETE ON public.esc_nomes_batismo
FOR EACH ROW EXECUTE FUNCTION private.esc_invalida_nomes_sem_escudo();

SELECT private.esc_atualiza_nomes_sem_escudo();
CREATE OR REPLACE FUNCTION public.esc_nomes_sem_escudo()
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $fn$
  SELECT coalesce((SELECT valor FROM private.esc_nomes_escudos_cache
    WHERE id AND valido AND atualizado_em > statement_timestamp()-interval '90 seconds'),
    private.esc_calcula_nomes_sem_escudo())
$fn$;
-- CREATE OR REPLACE conserva os grants da API existente. Sem RPC nova exposta.
SELECT cron.schedule('esc-nomes-escudos-cache', '* * * * *',
  $$SET statement_timeout='5s'; SELECT private.esc_atualiza_nomes_sem_escudo();$$);

CREATE OR REPLACE FUNCTION public.esc_cla_limites_atualiza()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $fn$
BEGIN
  WITH calculados AS MATERIALIZED (
    SELECT c.id, public.esc_cla_limite_vivo(c.id) AS limite FROM public.esc_clas c WHERE c.ativo
  )
  INSERT INTO public.esc_cla_limite_cache(cla_id,limite,plano,em)
  SELECT id,limite,limite-22,now() FROM calculados
  ON CONFLICT(cla_id) DO UPDATE SET limite=excluded.limite,plano=excluded.plano,em=now();
END
$fn$;

-- Sala e dono entram na MESMA transação. Repetir o UUID confirma a tentativa,
-- sem criar outra sala ou cobrar a cota novamente. Não muda donos/assentos antigos.
CREATE OR REPLACE FUNCTION public.esc_criar_sala_segura(
  p_id uuid, p_code text, p_max_players integer, p_game_state jsonb, p_nome text
) RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER
SET search_path = '' SET lock_timeout = '3s' AS $fn$
DECLARE eu uuid := auth.uid(); sala public.game_rooms%ROWTYPE;
BEGIN
  IF eu IS NULL THEN RAISE EXCEPTION 'Login necessário' USING ERRCODE='42501'; END IF;
  IF p_id IS NULL OR p_code IS NULL OR p_code !~ '^[A-Z0-9]{6}$'
     OR p_max_players IS NULL OR p_max_players<1
     OR p_game_state IS NULL OR jsonb_typeof(p_game_state)<>'object'
     OR coalesce(btrim(p_nome),'')='' THEN
    RAISE EXCEPTION 'Dados da sala incompletos' USING ERRCODE='22023';
  END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended(p_id::text, 119));
  SELECT * INTO sala FROM public.game_rooms WHERE id=p_id;
  IF FOUND THEN
    IF sala.host_id IS DISTINCT FROM eu THEN
      RAISE EXCEPTION 'Esta tentativa pertence a outra conta' USING ERRCODE='42501';
    END IF;
    -- Nada de reiniciar/reescrever partida que começou em outra aba/aparelho.
    IF sala.status<>'waiting' THEN RETURN to_jsonb(sala); END IF;
  ELSE
    INSERT INTO public.game_rooms(id,code,host_id,mode,status,max_players,game_state)
    VALUES(p_id,p_code,eu,'leilao','waiting',p_max_players,p_game_state) RETURNING * INTO sala;
  END IF;
  IF NOT EXISTS(SELECT 1 FROM public.room_players WHERE room_id=sala.id AND user_id=eu) THEN
    INSERT INTO public.room_players(room_id,user_id,player_index,manager_name,is_ready)
    VALUES(sala.id,eu,0,p_nome,true);
  END IF;
  RETURN to_jsonb(sala);
END
$fn$;
REVOKE ALL ON FUNCTION public.esc_criar_sala_segura(uuid,text,integer,jsonb,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.esc_criar_sala_segura(uuid,text,integer,jsonb,text) TO authenticated;

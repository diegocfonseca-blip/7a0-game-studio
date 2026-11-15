-- Aplicar isoladamente, fora de BEGIN: concorrente para não bloquear o heartbeat.
CREATE INDEX CONCURRENTLY IF NOT EXISTS live_beats_user_beat_idx
  ON public.live_beats (user_id, beat_at DESC);
-- Reversão, também isolada e fora de BEGIN:
-- DROP INDEX CONCURRENTLY IF EXISTS public.live_beats_user_beat_idx;

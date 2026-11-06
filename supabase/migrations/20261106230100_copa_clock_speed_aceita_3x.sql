-- 06/11: a trava antiga não tinha o 3× (desde 05/11 o placar normal oferece 3×) → o update dava erro. Troca pela régua da função.
alter table public.esc_copa_clock_preview drop constraint if exists esc_copa_clock_preview_speed_check;
alter table public.esc_copa_clock_preview add constraint esc_copa_clock_preview_speed_check check (speed in (0.25,0.5,1,2,3,4));

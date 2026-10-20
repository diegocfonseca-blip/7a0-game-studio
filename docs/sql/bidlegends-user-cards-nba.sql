-- 🏀 BidLegends: álbum da NBA em gaveta PRÓPRIA (aplicada em 19/10 no projeto faabglpjutwursgmrpny).
-- O futebol lê `user_cards` em ~23 lugares (álbum, coleções, trocas, ranking); carta da NBA ali dentro
-- apareceria no álbum do futebol. Aqui é a mesma forma, separada. Quem grava: CardCollectPrompt com
-- `nba` (screens.tsx). Quem lê: EscAlbumNba. Reverter = drop table public.user_cards_nba.
create table if not exists public.user_cards_nba (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  season_key text not null,
  card_name text not null,
  card_club text not null,
  card_year integer not null,
  card_pos text not null,
  card_fame integer not null,
  origin text not null default 'online',
  obtained_at timestamptz not null default now(),
  unique (user_id, season_key)
);
alter table public.user_cards_nba enable row level security;
create policy user_cards_nba_select on public.user_cards_nba for select to public using (true);
create policy user_cards_nba_insert on public.user_cards_nba for insert to authenticated with check ((select auth.uid()) = user_id);
create index if not exists user_cards_nba_user_idx on public.user_cards_nba (user_id, obtained_at desc);

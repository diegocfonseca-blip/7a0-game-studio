// 🃏 BAFO NOVO · a saída do dono (arquivo à parte: o `store.tsx` chama isto e não pode puxar tela nem arte junto)
import { supabase } from '../lib/supabase'
import { tr } from './lang'

/** 🚪 o DONO vai sair no meio da liga: confirma (com o preço escrito) e aplica a punição. Devolve false se ele desistiu. */
export async function donoSaiDoBafo(roomId: string, valendo: boolean): Promise<boolean> {
  if (valendo && !window.confirm(tr('🃏 Sair agora ENCERRA o Bafo antes do fim.\n\nVocê perde 2 cartas sorteadas das suas 22: uma pro 1º e outra pro 2º colocado (se nenhum jogo foi jogado, as 2 somem e ninguém ganha).\n\nSair mesmo assim?', '🃏 Leaving now ENDS the Bafo early.\n\nYou lose 2 random cards from your 22: one to 1st place and one to 2nd (if no game was played, both are simply lost).\n\nLeave anyway?'))) return false
  try { await supabase.rpc('bafo2_encerra', { p_room: roomId }) } catch { /* sem rede: o vigia dos outros cobra pelos 10 min */ }
  return true
}

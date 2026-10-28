import { createClient } from '@supabase/supabase-js'
import { instalaTravaEspectador } from '../escalacao/espectador'

export const supabase = createClient(
  'https://faabglpjutwursgmrpny.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZhYWJnbHBqdXR3dXJzZ21ycG55Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODExODk2MDAsImV4cCI6MjA5Njc2NTYwMH0.gBonEOIUJNWrJgruIYl6CA_i6-xsJNBjpYXADRKkoOE'
)

// 👁️ trava do modo espectador: enquanto alguém só ASSISTE uma sala, o aparelho não grava nada (fora disso, não muda nada)
instalaTravaEspectador(supabase as unknown as Parameters<typeof instalaTravaEspectador>[0])

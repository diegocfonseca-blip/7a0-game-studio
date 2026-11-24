import React from 'react'
import { createRoot } from 'react-dom/client'
import '../../src/escalacao/screens'
import { EscCtxBancada, INITIAL, reducer, nuvemAceita } from '../../src/escalacao/store'
import { SaveDialogs, SaveHistory } from '../../src/escalacao/salvamento/dialogs'
import { supabase } from '../../src/lib/supabase'
import * as saves from '../../src/escalacao/salvamento/service'
import * as local from '../../src/escalacao/salvamento/local'
import { encode, decode } from '../../src/escalacao/salvamento/codec'
import '../../src/index.css'
const w = window as any
const root=createRoot(document.getElementById('root')!)
w.saveQA = { INITIAL, reducer, nuvemAceita, saves, local, encode, decode, supabase, photo(kind: string) {
  const el = kind === 'history' ? <SaveHistory seed={91} onClose={() => {}} onRestored={() => {}} /> : <SaveDialogs />
  root.render(<EscCtxBancada.Provider value={{ state: { seed: 91, careerOnline: false }, dispatch: () => {} } as any}>{el}</EscCtxBancada.Provider>)
} }

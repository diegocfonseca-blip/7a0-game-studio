import '../../src/App'
import React from 'react'
import { createRoot } from 'react-dom/client'
import '../../src/escalacao/screens'
import { EscCtxBancada, INITIAL, reducer, nuvemAceita } from '../../src/escalacao/store'
import { SaveDialogs, SaveHistory, SaveCopies } from '../../src/escalacao/salvamento/dialogs'
import { FaixaSalvar } from '../../src/escalacao/central'
import { supabase } from '../../src/lib/supabase'
import * as saves from '../../src/escalacao/salvamento/service'
import * as local from '../../src/escalacao/salvamento/local'
import { encode, decode } from '../../src/escalacao/salvamento/codec'
import '../../src/index.css'
const w = window as any
const root=createRoot(document.getElementById('root')!)
w.saveQA = { INITIAL, reducer, nuvemAceita, saves, local, encode, decode, supabase, photo(kind: string, seed=91) {
  const el = kind === 'copies' ? <div style={{margin:16,padding:16,background:'#F4ECD6',color:'#0C0C0C',borderRadius:14}}><SaveCopies seed={seed}/><FaixaSalvar s={{estado:'atrasado',ha:60,rodadas:14,onClick:()=>{w.saveQA.saveClicks=(w.saveQA.saveClicks??0)+1}}}/></div> : kind === 'history' ? <SaveHistory seed={91} onClose={() => {}} onRestored={() => {}} /> : <SaveDialogs />
  root.render(<EscCtxBancada.Provider value={{ state: { seed: 91, careerOnline: false }, dispatch: () => {} } as any}>{el}</EscCtxBancada.Provider>)
} }

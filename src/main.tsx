// 🧹 PRIMEIRO de tudo: libera espaço no armazenamento ANTES de o cliente do
// Supabase nascer — ele testa a escrita na criação e, se estiver cheio, guarda o
// login só na memória (morre no reload). Ver src/storage-guard.ts.
import './storage-guard'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// 🌙 TEMA NOTURNO: aplica ANTES do React montar (sem "piscada" clara). A escolha
// fica no aparelho (esc-tema); ?tema=noturno/claro na URL também vale (e grava).
try {
  const url = new URLSearchParams(location.search).get('tema')
  if (url === 'noturno' || url === 'claro') localStorage.setItem('esc-tema', url)
  if (localStorage.getItem('esc-tema') === 'noturno') document.documentElement.classList.add('noturno')
} catch { /* segue no claro */ }

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

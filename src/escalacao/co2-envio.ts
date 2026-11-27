import { useEffect, useRef, useState } from 'react'
import { Co2Fila } from './co2-sincronia'
import { co2Contexto } from './co2'

/** A fila nasce no efeito (inclusive em StrictMode), sempre presa à conexão que a criou. */
export function useCo2Envio<T>(contexto: string, chave: string, dados: T | null, envia: (dados: T) => Promise<boolean>, espera = 800) {
  const fila = useRef<Co2Fila<T> | null>(null)
  const escritor = useRef(envia)
  escritor.current = envia
  const [falhou, setFalhou] = useState(false)
  useEffect(() => {
    setFalhou(false)
    const f = new Co2Fila<T>(d => contexto === co2Contexto() ? escritor.current(d) : Promise.resolve(false), setFalhou, espera)
    fila.current = f
    const retorna = () => { void f.confirma() }
    window.addEventListener('online', retorna)
    return () => { f.fecha(); if (fila.current === f) fila.current = null; window.removeEventListener('online', retorna) }
  }, [contexto, espera])
  useEffect(() => { if (dados != null) fila.current?.atualiza(chave, dados); else fila.current?.limpa() }, [contexto, chave, dados])
  return { falhou, confirma: () => fila.current?.confirma() ?? Promise.resolve(false) }
}

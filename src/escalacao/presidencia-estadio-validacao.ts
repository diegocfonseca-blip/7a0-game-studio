import type {StadiumSave} from './estadiodata'
/** Um save ilegível não pode ser interpretado como obra pronta ou campo vazio. */
export function estadioVisualValido(value:unknown):value is StadiumSave{
 if(!value||typeof value!=='object'||Array.isArray(value))return false
 const st=value as Partial<StadiumSave>
 return !!st.inv&&typeof st.inv==='object'&&!Array.isArray(st.inv)&&
  Object.values(st.inv).every(n=>typeof n==='number'&&Number.isFinite(n)&&n>=0)&&
  Array.isArray(st.ext)&&st.ext.every(k=>typeof k==='string')&&
  (st.roofClosed===undefined||typeof st.roofClosed==='boolean')
}

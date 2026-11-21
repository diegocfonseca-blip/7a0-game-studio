// Node 24: executa a fonte TS/TSX real nas verificações de Three sem navegador.
// Só adapta resolução/Vite e imports de imagens; não substitui motor ou geometria.
import {registerHooks} from 'node:module'
import {existsSync,readFileSync} from 'node:fs'
import {fileURLToPath,pathToFileURL} from 'node:url'
import {extname} from 'node:path'
import ts from 'typescript'
const appRoot=new URL('../src/',import.meta.url).href
registerHooks({
 resolve(specifier,context,next){
  if(specifier.startsWith('.')&&context.parentURL?.startsWith(appRoot)&&!extname(specifier)){
   const path=fileURLToPath(new URL(specifier,context.parentURL))
   for(const suffix of ['.ts','.tsx'])if(existsSync(path+suffix))return{url:pathToFileURL(path+suffix).href,shortCircuit:true}
  }
  return next(specifier,context)
 },
 load(url,context,next){
  if(url.startsWith(appRoot)){
   if(/\.(css|webp|png|jpg|svg|woff2)$/.test(url))return{format:'module',source:'export default '+JSON.stringify(url),shortCircuit:true}
   if(/\.(ts|tsx|mjs)$/.test(url)){
    let source=readFileSync(fileURLToPath(url),'utf8').replaceAll('import.meta.env',"({DEV:false,PROD:true,BASE_URL:'/'})")
    if(/\.tsx?$/.test(url))source=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText
    return{format:'module',source,shortCircuit:true}
   }
  }
  return next(url,context)
 }
})

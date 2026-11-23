import {createServer} from 'vite'
const s=await createServer({base:'/',cacheDir:'/tmp/leilao-compacto-runtime-qa',server:{host:'127.0.0.1',port:5184,strictPort:true,hmr:false}});await s.listen();s.printUrls()

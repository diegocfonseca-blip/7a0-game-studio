// Keeps browser evidence stable while other local checks write build artifacts.
import {createServer} from 'vite'
const server=await createServer({cacheDir:'/tmp/leilao-copas-piloto-vite-cache',server:{host:'127.0.0.1',port:5178,strictPort:true,hmr:false},base:'/'})
await server.listen();server.printUrls()
process.on('SIGINT',async()=>{await server.close();process.exit(0)})

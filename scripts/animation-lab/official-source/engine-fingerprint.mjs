import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
export function footballEngineFingerprint(root=process.cwd()){
 const hash=createHash('sha256');
 for(const name of ['atributos','carreira','coletivo','decide','fisica','motor','narra','tipos']){const file='src/escalacao/motor2/'+name+'.ts';hash.update(file+'\0');hash.update(readFileSync(resolve(root,file)))}
 return hash.digest('hex');
}

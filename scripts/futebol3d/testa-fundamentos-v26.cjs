const fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process');
const dir=path.join(__dirname,'tests-v26'),files=fs.readdirSync(dir).filter(f=>f.endsWith('.mjs')).sort();
for(const file of files){const r=spawnSync(process.execPath,[path.join(dir,file)],{encoding:'utf8'});if(r.status!==0){process.stderr.write(r.stdout+r.stderr);process.exit(r.status||1)}}
console.log('PASS '+files.length+' suites sobre os módulos de produção do futebol 3D');

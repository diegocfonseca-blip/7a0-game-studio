const path=require('node:path'),os=require('node:os');
/** Local installed modules first. Never installs, downloads or changes credentials. */
function loadDependency(name,options={}){
 if(!['playwright','sharp'].includes(name))throw Error('Unsupported presidency dependency: '+name);
 const resolve=options.resolve||require.resolve,load=options.load||require;
 const roots=options.roots||[
  process.env.PRESIDENCIA_NODE_MODULES,
  path.join(os.homedir(),'.cache','codex-runtimes','codex-primary-runtime','dependencies','node','node_modules'),
 ].filter(Boolean);
 const candidates=[name,...roots.map(root=>path.join(root,name))];
 for(const candidate of candidates){
  let resolved;
  try{resolved=resolve(candidate)}catch(error){if(error.code==='MODULE_NOT_FOUND')continue;throw error}
  // A broken installed module must surface its real error, not silently fall back.
  return load(resolved);
 }
 throw Error('Missing '+name+'. Install it locally or set PRESIDENCIA_NODE_MODULES to an existing node_modules directory. No automatic download was attempted.');
}
module.exports={loadDependency};

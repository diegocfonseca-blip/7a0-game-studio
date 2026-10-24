// Test-only extension resolution for Node's built-in TypeScript support.
import {registerHooks} from 'node:module';
registerHooks({resolve(specifier,context,next){try{return next(specifier,context)}catch(error){if(error.code!=='ERR_MODULE_NOT_FOUND'||!specifier.startsWith('.'))throw error;for(const suffix of ['.ts','.tsx','/index.ts'])try{return next(specifier+suffix,context)}catch{}throw error}}});

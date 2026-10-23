import{registerHooks}from'node:module';import{existsSync}from'node:fs';
registerHooks({resolve(specifier,context,next){if(specifier.startsWith('.')&&context.parentURL&&!specifier.split('/').at(-1).includes('.')){const url=new URL(specifier+'.ts',context.parentURL);if(existsSync(url))return next(url.href,context)}return next(specifier,context)}});

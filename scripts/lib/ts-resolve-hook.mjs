// Loaded by `npm run test:unit` (`node --import`): lets a module under apps/web import a sibling the way the app does,
// `from './deploy-env'`, when node:test runs it with plain type-stripping. Next resolves the extensionless specifier;
// Node's ESM loader does not, so before this every lib module that imported a sibling needed its test to carry the same
// inline resolve hook (20 copies by off-vercel-hosting S1.1).
//
// Narrow on purpose: only a RELATIVE specifier, only from a parent under apps/web/, and only after the normal
// resolution has already failed. Anything that resolves today resolves exactly as before.
import { registerHooks } from 'node:module';

registerHooks({
  resolve(specifier, context, nextResolve) {
    try {
      return nextResolve(specifier, context);
    } catch (error) {
      const retry =
        error?.code === 'ERR_MODULE_NOT_FOUND' &&
        typeof context.parentURL === 'string' &&
        context.parentURL.includes('/apps/web/') &&
        (specifier.startsWith('./') || specifier.startsWith('../')) &&
        !/\.[cm]?[jt]sx?$/.test(specifier);
      if (!retry) throw error;
      return nextResolve(`${specifier}.ts`, context);
    }
  },
});

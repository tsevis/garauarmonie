import * as esbuild from 'esbuild';

const watch = process.argv.includes('--watch');

/** @type {import('esbuild').BuildOptions} */
const options = {
  entryPoints: ['src/main.ts'],
  bundle: true,
  outfile: 'dist/index.js',
  format: 'iife',
  platform: 'browser',
  target: 'chrome88', // UXP's embedded Chromium baseline
  // Provided by the Photoshop UXP host at runtime — keep as require() calls.
  external: ['photoshop', 'uxp'],
  logLevel: 'info',
};

if (watch) {
  const ctx = await esbuild.context(options);
  await ctx.watch();
  console.log('watching…');
} else {
  await esbuild.build(options);
}

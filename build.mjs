// build.mjs — bundles src/main.tsx into a single-file HTML artifact
import esbuild from 'esbuild';
import fs from 'fs';
import path from 'path';

const result = await esbuild.build({
  entryPoints: ['src/main.tsx'],
  bundle: true,
  minify: true,
  format: 'iife',
  target: ['es2020'],
  jsx: 'automatic',
  jsxImportSource: '@emotion/react',
  loader: { '.ts': 'tsx', '.tsx': 'tsx' },
  write: false,
  logLevel: 'error',
  define: { 'process.env.NODE_ENV': '"production"' },
});

const js = result.outputFiles[0].text;
const nonce = Date.now().toString(36);

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<meta name="build-nonce" content="${nonce}" />
<title>Lucky Idle Slots</title>
<style>
  html,body,#root{margin:0;padding:0;height:100%;width:100%;background:#0a0511;}
  *{box-sizing:border-box;}
</style>
</head>
<body>
<div id="root"></div>
<script>${js}</script>
</body>
</html>`;

fs.mkdirSync('dist', { recursive: true });
fs.writeFileSync(path.join('dist', 'index.html'), html);
console.log(`Bundled: ${(html.length / 1024).toFixed(1)} KB`);

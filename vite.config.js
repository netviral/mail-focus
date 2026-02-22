import { defineConfig } from 'vite';
import { resolve } from 'path';

/**
 * vite.config.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Bundles the content script into a single dist/content.js file.
 *
 * KEY DECISIONS:
 *
 *   No React plugin — the content script is plain JS (no JSX/components).
 *
 *   CSS ?inline query — each content module imports its own CSS as a string
 *   (e.g. `import filterCSS from '../styles/filter.css?inline'`). Vite inlines
 *   the CSS into the JS bundle as a string constant. The module then calls
 *   injectStyle(id, cssText) to write a <style> tag at runtime.
 *   This is necessary because Chrome extensions can't use <link> tags for
 *   content-script styles.
 *
 *   Single entry → single output file (content.js) — keeps manifest.json simple
 *   and avoids Chrome's restrictions around loading multiple content scripts.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export default defineConfig({
    build: {
        rollupOptions: {
            input: {
                content: resolve(__dirname, 'src/content/index.js'),
            },
            output: {
                entryFileNames: '[name].js',    // → dist/content.js
                chunkFileNames: 'assets/[name].js',
                assetFileNames: 'assets/[name].[ext]',
            },
        },
        outDir: 'dist',
        emptyOutDir: true,
    },
});

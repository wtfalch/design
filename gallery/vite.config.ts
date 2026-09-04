import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

/**
 * The gallery is built, not just served.
 *
 * `design.html` in tf was a second Vite entry beside the app. Here it is the
 * only page, so it is `index.html` -- but the built file keeps the name
 * `design.html` as well, because 204 screenshot baselines address it by that
 * path and renaming the page would fail all of them for a reason that has
 * nothing to do with a component.
 */
export default defineConfig({
  plugins: [react()],
  server: { host: '127.0.0.1', port: 5173 },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: { input: { design: 'design.html' } },
  },
})

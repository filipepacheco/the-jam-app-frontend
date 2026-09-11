import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

/** Keep production-only bundle analysis and chunking out of the private workbench. */
export default defineConfig({
  plugins: [tailwindcss()],
})

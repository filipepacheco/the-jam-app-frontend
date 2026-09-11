import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

/** Keep production visualizer and manual chunks out of the throwaway workbench. */
export default defineConfig({
  plugins: [tailwindcss()],
})

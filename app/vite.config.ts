import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vitejs.dev/config/
export default defineConfig({
  base: '/chromaview/',
  plugins: [react()],
  build: {
    outDir: '../docs',
    emptyOutDir: true,
  },
});

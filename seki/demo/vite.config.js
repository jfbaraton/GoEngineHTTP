import {defineConfig} from 'vite'

export default defineConfig({
  publicPath: './src/public',
  root: './src',
  server: {
    host: true,
    port: 4040,
    proxy: {
      '/api': {
        target: 'http://localhost:8090',
        changeOrigin: true,
        secure: false,
        ws: true,
      }
    }
  },
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    assetsInlineLimit: 0,
  },
  esbuild: {
    minifyIdentifiers: false,
    keepNames: true,
  },
})

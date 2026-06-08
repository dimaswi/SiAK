import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from "path"

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, "..", "")
  const target = `http://localhost:${env.APP_PORT || '8080'}`

  return {
    envDir: "..",
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      proxy: {
        '/api': {
          target: target,
          changeOrigin: true,
        }
      }
    }
  }
})

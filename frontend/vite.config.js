import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Vite configuration — uses React plugin for JSX transform
export default defineConfig({
  plugins: [react()],
})

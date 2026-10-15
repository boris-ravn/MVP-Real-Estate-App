/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Rutas relativas para que el build funcione en cualquier host estático
  base: './',
  test: {
    environment: 'node',
  },
})

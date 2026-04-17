import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    environment: 'node',
  },
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, './packages/shared'),
      '@scheduler': path.resolve(__dirname, './packages/scheduler'),
      '@react': path.resolve(__dirname, './packages/react'),
      '@react-dom': path.resolve(__dirname, './packages/react-dom'),
      '@react-reconciler': path.resolve(__dirname, './packages/react-reconciler'),
    },
  },
})

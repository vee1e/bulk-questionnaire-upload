import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const repoRoot = resolve(__dirname, '..')

export default defineConfig({
  resolve: {
    alias: {
      '@angular/core': resolve(__dirname, 'node_modules/@angular/core'),
      '@angular/common': resolve(__dirname, 'node_modules/@angular/common'),
      '@angular/compiler': resolve(__dirname, 'node_modules/@angular/compiler'),
      'rxjs': resolve(__dirname, 'node_modules/rxjs'),
    }
  },
  server: {
    fs: {
      allow: ['..']
    }
  },
  test: {
    environment: 'jsdom',
    include: [resolve(repoRoot, 'tests/frontend/**/*.spec.ts')],
    globals: true
  }
})


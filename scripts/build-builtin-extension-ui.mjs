#!/usr/bin/env node

import path from 'node:path'
import { build, mergeConfig } from 'vite'
import react from '@vitejs/plugin-react'

const root = process.cwd()

const entries = [
  {
    name: 'automation',
    rootDir: path.join(root, 'electron/extensions/builtin/automation'),
    html: 'react-index.html',
    outDir: 'dist',
  },
  {
    name: 'memory',
    rootDir: path.join(root, 'electron/extensions/builtin/memory'),
    html: 'react-index.html',
    outDir: 'dist',
  },
]

for (const entry of entries) {
  await build(
    mergeConfig(
      {
        base: './',
        plugins: [react()],
        resolve: {
          alias: {
            '@': path.join(root, 'src'),
          },
        },
      },
      {
        configFile: false,
        root: entry.rootDir,
        publicDir: false,
        build: {
          outDir: path.join(entry.rootDir, entry.outDir),
          emptyOutDir: true,
          rollupOptions: {
            input: path.join(entry.rootDir, entry.html),
          },
        },
      },
    ),
  )
  console.log(`Built builtin extension UI: ${entry.name}`)
}

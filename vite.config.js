import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// Keep frequently used framework and Firebase code in stable vendor chunks.
// OCR is dynamically imported from the Receipt Scanner page, so it stays out
// of the initial dashboard bundle and loads only when a user scans a receipt.
export default defineConfig({
  plugins: [react()],
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          // Keep Firebase's side-effectful module initialization in source order.
          strictExecutionOrder: true,
          groups: [
            {
              name: 'react-vendor',
              test: /node_modules[\\/](?:react|react-dom|scheduler)(?:[\\/]|$)/,
              priority: 30,
              minSize: 10 * 1024,
            },
            {
              name: 'firebase-firestore',
              test: /node_modules[\\/](?:firebase[\\/]firestore|@firebase[\\/]firestore)(?:[\\/]|$)/,
              priority: 25,
              minSize: 20 * 1024,
            },
            {
              name: 'firebase-auth',
              test: /node_modules[\\/](?:firebase[\\/]auth|@firebase[\\/]auth)(?:[\\/]|$)/,
              priority: 24,
              minSize: 20 * 1024,
            },
            {
              name: 'firebase-core',
              test: /node_modules[\\/](?:firebase|@firebase)(?:[\\/]|$)/,
              priority: 15,
              minSize: 20 * 1024,
            },
            {
              name: 'vendor',
              test: /node_modules[\\/]/,
              priority: 5,
              minSize: 20 * 1024,
            },
          ],
        },
      },
    },
  },
});

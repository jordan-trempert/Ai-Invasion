import { defineConfig } from 'vite';

export default defineConfig({
  root: 'src', // Set the root directory to 'src'
  build: {
    outDir: '../dist', // Output build files to the 'dist' directory outside of 'src'
    target: 'esnext', // Set the build target to ESNext
    rollupOptions: {
      input: {
        main: 'src/index.html',
        game: 'src/game.html',
      },
    },
  },
  server: {
    open: true, // Automatically open the browser when the server starts
  },
});

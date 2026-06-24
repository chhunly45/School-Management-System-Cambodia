import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteObfuscateFile } from 'vite-plugin-obfuscator';

export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production';

  return {
    plugins: [
      react(),
      // Temporarily disabled obfuscation for faster build during testing
      // ...(isProduction
      //   ? [
      //       viteObfuscateFile({
      //         compact: true,
      //         controlFlowFlattening: true,
      //         controlFlowFlatteningThreshold: 0.75,
      //         deadCodeInjection: true,
      //         deadCodeInjectionThreshold: 0.4,
      //         debugProtection: true,
      //         debugProtectionInterval: 0,
      //         disableConsoleOutput: true,
      //         stringArray: true,
      //         stringArrayEncoding: ['rc4'],
      //         stringArrayThreshold: 0.75,
      //         rotateStringArray: true,
      //         transformObjectKeys: true,
      //         unicodeEscapeSequence: false,
      //         numbersToExpressions: true,
      //         simplify: true
      //       })
      //     ]
      //   : [])
    ],
    build: {
      outDir: 'dist',
      sourcemap: true,
      minify: 'terser',
      terserOptions: {
        compress: {
          passes: 3,
          drop_console: true,
          drop_debugger: true
        },
        mangle: true,
        format: {
          comments: false
        }
      },
      chunkSizeWarningLimit: 1000
    },
    server: {
      historyApiFallback: true
    }
  };
});

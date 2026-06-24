module.exports = {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'jsdom',
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', { useESM: true, tsconfig: 'tsconfig.json' }]
  },
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '^lucide-react$': '<rootDir>/src/__mocks__/lucide-react.ts'
  },
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  testMatch: ['**/__tests__/**/*.+(ts|tsx|js)', '**/?(*.)+(spec|test).+(ts|tsx|js)'],
  collectCoverage: true,
  coverageProvider: 'v8',
  collectCoverageFrom: [
    'src/components/**/*.{ts,tsx}',
    'src/services/**/*.{ts,tsx}',
    'src/pages/HomePage.tsx',
    'src/pages/ProductDetailPage.tsx',
    'src/pages/ProductListPage.tsx',
    'src/pages/AdminDashboardPage.tsx',
    'src/components/SEO.tsx'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  moduleDirectories: ['node_modules', 'src']
};


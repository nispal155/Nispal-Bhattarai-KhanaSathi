module.exports = {
  testEnvironment: 'jest-environment-jsdom',
  roots: ['<rootDir>/test'],
  testMatch: ['**/*.test.ts', '**/*.test.tsx'],
  setupFilesAfterEnv: ['<rootDir>/test/setupTests.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '\\.(css|less|sass|scss)$': 'identity-obj-proxy'
  },
  transform: {
    '^.+\\.(ts|tsx|js|jsx)$': [
      'ts-jest',
      {
        tsconfig: {
          jsx: 'react-jsx',
          module: 'commonjs',
          target: 'es2017',
          esModuleInterop: true,
          allowJs: true
        }
      }
    ]
  },
  clearMocks: true,
  restoreMocks: true,
  collectCoverageFrom: [
    'app/**/*.tsx',
    'context/**/*.tsx',
    'lib/**/*.ts',
    '!app/layout.tsx'
  ]
};

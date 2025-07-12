module.exports = {
  preset: 'ts-jest',          // Transpile TypeScript
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'], // Onde estão os testes
  modulePaths: ['<rootDir>/src'],  // Permite imports como '@src/service'
  testMatch: ['**/*.test.ts'], // Padrão de arquivos de teste
  bail: false,
};
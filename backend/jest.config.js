module.exports = {
  preset: 'ts-jest',          // Transpile TypeScript
  testEnvironment: 'node',    // Ambiente Node.js (para backend)
  roots: ['<rootDir>/tests'], // Onde estão os testes
  modulePaths: ['<rootDir>/src'],  // Permite imports como '@src/service'
  testMatch: ['**/*.test.ts'], // Padrão de arquivos de teste
  bail: false,
};
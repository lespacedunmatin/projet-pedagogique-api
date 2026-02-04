module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  moduleFileExtensions: ['ts', 'js'],
  // Exécuter les tests en série pour éviter les problèmes de concurrence
  // avec les opérations de base de données (destroy, create, etc.)
  maxWorkers: 1,
  // Augmenter le timeout pour les opérations de base de données
  testTimeout: 10000,
};

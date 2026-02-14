module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '\\.spec\\.ts$',
  transform: { '^.+\\.(t|j)s$': 'ts-jest' },
  testEnvironment: 'node',
  collectCoverageFrom: ['**/*.ts', '!**/*.spec.ts', '!scripts/**'],
  coverageDirectory: '../coverage',
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/$1' },
};

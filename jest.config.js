import preset from 'jest-preset-angular/presets/index.js';
const { createEsmPreset } = preset;

export default {
  ...createEsmPreset(),
  setupFilesAfterEnv: ['<rootDir>/setup-jest.ts'],
  testEnvironment: 'jsdom',
  transformIgnorePatterns: ['node_modules/(?!.*\\.mjs$|rxjs|@angular)'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1'
  }
};

// Jest setup file for testing

// CSS modules are handled by moduleNameMapper in jest.config.js

// Mock Docusaurus specific modules (only if they exist)
try {
  jest.mock('@docusaurus/useDocusaurusContext', () => ({
    __esModule: true,
    default: () => ({
      siteConfig: {
        title: 'SIWE Docs',
        tagline: 'Sign in with Ethereum Documentation',
      },
    }),
  }), { virtual: true });

  jest.mock('@docusaurus/Link', () => ({
    __esModule: true,
    default: ({ children, ...props }: any) =>
      require('react').createElement('a', props, children),
  }), { virtual: true });
} catch {
  // Ignore if Docusaurus modules are not available
}

// Setup global test environment
global.console = {
  ...console,
  // Suppress console.log during tests
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};
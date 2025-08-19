// Jest setup file for testing

// Mock CSS modules
jest.mock('*.module.css', () => ({}), { virtual: true });

// Mock Docusaurus specific modules
jest.mock('@docusaurus/useDocusaurusContext', () => ({
  __esModule: true,
  default: () => ({
    siteConfig: {
      title: 'SIWE Docs',
      tagline: 'Sign in with Ethereum Documentation',
    },
  }),
}));

// Mock other Docusaurus hooks if needed
jest.mock('@docusaurus/Link', () => ({
  __esModule: true,
  default: ({ children, ...props }: any) =>
    require('react').createElement('a', props, children),
}));

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
import '@testing-library/jest-dom';

// Mock AWS Amplify
vi.mock('aws-amplify', () => ({
  Amplify: {
    configure: vi.fn(),
  },
  generateClient: vi.fn(() => ({
    models: {},
  })),
}));

// Mock Next.js router
vi.mock('next/router', () => ({
  useRouter: () => ({
    push: vi.fn(),
    pathname: '/',
    query: {},
  }),
}));

// Mock environment variables
process.env.NODE_ENV = 'test';
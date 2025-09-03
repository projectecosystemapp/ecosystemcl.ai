import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: vi.fn(),
      replace: vi.fn(),
      prefetch: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn(),
    };
  },
  usePathname() {
    return '';
  },
  useSearchParams() {
    return new URLSearchParams();
  },
}));

// Mock Clerk
vi.mock('@clerk/nextjs', () => ({
  auth: vi.fn(() => ({ userId: 'test-user-id' })),
  currentUser: vi.fn(() => ({ id: 'test-user-id' })),
  SignIn: vi.fn(() => null),
  SignUp: vi.fn(() => null),
  UserButton: vi.fn(() => null),
  SignedIn: vi.fn(({ children }: any) => children),
  SignedOut: vi.fn(({ children }: any) => children),
  ClerkProvider: vi.fn(({ children }: any) => children),
}));

// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
process.env.REDIS_URL = 'redis://localhost:6379';
/**
 * Test setup file
 */

// Extend Jest matchers if needed
import "jest";

// Mock console methods to reduce noise in tests
const originalConsole = { ...console };

beforeEach(() => {
  // Suppress console output during tests unless needed
  jest.spyOn(console, "log").mockImplementation(() => {});
  jest.spyOn(console, "info").mockImplementation(() => {});
  jest.spyOn(console, "warn").mockImplementation(() => {});
  jest.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  // Restore console methods
  console.log = originalConsole.log;
  console.info = originalConsole.info;
  console.warn = originalConsole.warn;
  console.error = originalConsole.error;

  // Clear all mocks
  jest.clearAllMocks();
});

// Set test environment variables
process.env.NODE_ENV = "test";
process.env.OPENAI_API_KEY = "sk-test-key-for-testing-purposes-only-not-real";

// Global test utilities
declare global {
  namespace jest {
    interface Matchers<R> {
      // Add custom matchers here if needed
    }
  }
}

// Export empty object to make this a module
export {};

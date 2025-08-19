// Basic tests for SIWE Validation Engine

import { ValidationEngine } from '../validationEngine';
import { SiweMessageParser } from '../parser';

describe('SIWE Validation Engine', () => {
  const validMessage = `example.com wants you to sign in with your Ethereum account:
0x742d35Cc6C4C1Ca5d428d9eE0e9B1E1234567890

Sign in to our Web3 application.

URI: https://example.com
Version: 1
Chain ID: 1
Nonce: a1B2c3D4e5F6g7H8
Issued At: 2023-10-31T16:25:24Z`;

  const invalidMessage = `example.com wants you to sign in with your Ethereum account:
742d35Cc6C4C1Ca5d428d9eE0e9B1E1234567890

URI: http://example.com
Version: 2
Chain ID: 0
Nonce: test`;

  describe('ValidationEngine.validate', () => {
    test('validates a correct SIWE message', () => {
      const result = ValidationEngine.validate(validMessage);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.originalMessage).toBe(validMessage);
    });

    test('detects errors in invalid message', () => {
      const result = ValidationEngine.validate(invalidMessage);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      
      // Should detect missing 0x prefix
      expect(result.errors.some(e => e.code === 'ADDRESS_INVALID_FORMAT')).toBe(true);
      
      // Should detect invalid version
      expect(result.errors.some(e => e.code === 'VERSION_INVALID')).toBe(true);
      
      // Should detect weak nonce
      expect(result.errors.some(e => e.code.includes('NONCE'))).toBe(true);
    });

    test('handles empty message', () => {
      const result = ValidationEngine.validate('');
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('respects validation profiles', () => {
      const strictResult = ValidationEngine.validate(invalidMessage, {
        profile: ValidationEngine.PROFILES.strict
      });
      
      const basicResult = ValidationEngine.validate(invalidMessage, {
        profile: ValidationEngine.PROFILES.basic
      });
      
      // Strict mode should find more issues
      expect(strictResult.errors.length + strictResult.warnings.length)
        .toBeGreaterThanOrEqual(basicResult.errors.length + basicResult.warnings.length);
    });
  });

  describe('ValidationEngine.quickValidate', () => {
    test('provides quick feedback for valid message', () => {
      const result = ValidationEngine.quickValidate(validMessage);
      
      expect(result.hasErrors).toBe(false);
      expect(result.isComplete).toBe(true);
    });

    test('provides quick feedback for invalid message', () => {
      const result = ValidationEngine.quickValidate(invalidMessage);
      
      expect(result.hasErrors).toBe(true);
      expect(result.errorCount).toBeGreaterThan(0);
    });

    test('handles empty message gracefully', () => {
      const result = ValidationEngine.quickValidate('');
      
      expect(result.hasErrors).toBe(false);
      expect(result.isComplete).toBe(false);
      expect(result.errorCount).toBe(0);
    });
  });

  describe('ValidationEngine.generateSamples', () => {
    test('generates valid sample messages', () => {
      const samples = ValidationEngine.generateSamples();
      
      expect(samples).toHaveProperty('valid');
      expect(samples).toHaveProperty('withErrors');
      expect(samples).toHaveProperty('minimal');
      expect(samples).toHaveProperty('withResources');
      
      // Valid sample should actually be valid
      const validResult = ValidationEngine.validate(samples.valid);
      expect(validResult.isValid).toBe(true);
      
      // Error sample should have errors
      const errorResult = ValidationEngine.validate(samples.withErrors);
      expect(errorResult.isValid).toBe(false);
    });
  });

  describe('ValidationEngine.getValidationStats', () => {
    test('calculates statistics correctly', () => {
      const result = ValidationEngine.validate(invalidMessage);
      const stats = ValidationEngine.getValidationStats(result);
      
      expect(stats.totalIssues).toBe(result.errors.length + result.warnings.length + result.suggestions.length);
      expect(stats.errorCount).toBe(result.errors.length);
      expect(stats.warningCount).toBe(result.warnings.length);
      expect(stats.suggestionCount).toBe(result.suggestions.length);
      expect(typeof stats.fixableCount).toBe('number');
      expect(typeof stats.securityIssues).toBe('number');
      expect(typeof stats.complianceIssues).toBe('number');
      expect(typeof stats.formatIssues).toBe('number');
    });
  });
});

describe('SIWE Message Parser', () => {
  test('parses valid message correctly', () => {
    const validMessage = `example.com wants you to sign in with your Ethereum account:
0x742d35Cc6C4C1Ca5d428d9eE0e9B1E1234567890

Sign in to our Web3 application.

URI: https://example.com
Version: 1
Chain ID: 1
Nonce: a1B2c3D4e5F6g7H8
Issued At: 2023-10-31T16:25:24Z`;

    const parsed = SiweMessageParser.parse(validMessage);
    
    expect(parsed.fields.domain).toBe('example.com');
    expect(parsed.fields.address).toBe('0x742d35Cc6C4C1Ca5d428d9eE0e9B1E1234567890');
    expect(parsed.fields.statement).toBe('Sign in to our Web3 application.');
    expect(parsed.fields.uri).toBe('https://example.com');
    expect(parsed.fields.version).toBe('1');
    expect(parsed.fields.chainId).toBe('1');
    expect(parsed.fields.nonce).toBe('a1B2c3D4e5F6g7H8');
    expect(parsed.fields.issuedAt).toBe('2023-10-31T16:25:24Z');
    expect(parsed.parseErrors).toHaveLength(0);
  });

  test('generates message from fields', () => {
    const fields = {
      domain: 'test.com',
      address: '0x742d35Cc6C4C1Ca5d428d9eE0e9B1E1234567890',
      statement: 'Test statement',
      uri: 'https://test.com',
      version: '1',
      chainId: '1',
      nonce: 'testNonce123',
      issuedAt: '2023-10-31T16:25:24Z'
    };

    const generated = SiweMessageParser.generateMessage(fields);
    expect(generated).toContain('test.com wants you to sign in');
    expect(generated).toContain('0x742d35Cc6C4C1Ca5d428d9eE0e9B1E1234567890');
    expect(generated).toContain('Test statement');
    expect(generated).toContain('URI: https://test.com');
    expect(generated).toContain('Version: 1');
  });

  test('finds field line numbers correctly', () => {
    const message = `example.com wants you to sign in with your Ethereum account:
0x742d35Cc6C4C1Ca5d428d9eE0e9B1E1234567890

Statement here

URI: https://example.com
Version: 1`;

    expect(SiweMessageParser.getFieldLine(message, 'domain')).toBe(1);
    expect(SiweMessageParser.getFieldLine(message, 'address')).toBe(2);
    expect(SiweMessageParser.getFieldLine(message, 'statement')).toBe(4);
    expect(SiweMessageParser.getFieldLine(message, 'uri')).toBe(6);
    expect(SiweMessageParser.getFieldLine(message, 'version')).toBe(7);
  });
});

// Mock console.error to avoid noise in test output
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
});
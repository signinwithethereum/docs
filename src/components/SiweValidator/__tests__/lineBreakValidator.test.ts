// Tests for line break validation functionality

import { LineBreakValidator } from '../lineBreakValidator';
import { ValidationEngine } from '../validationEngine';

describe('LineBreakValidator', () => {
  const validMessage = `example.com wants you to sign in with your Ethereum account:
0x742d35Cc6C4C1Ca5d428d9eE0e9B1E1234567890

Sign in to our Web3 application.

URI: https://example.com
Version: 1
Chain ID: 1
Nonce: abc123defg4567
Issued At: 2025-08-19T05:06:33.555Z
Expiration Time: 2025-08-19T05:16:33.555Z`;

  describe('User Reported Scenario', () => {
    test('detects extra line break between last two lines', () => {
      // Add extra line break between Issued At and Expiration Time
      const messageWithExtraLineBreak = `example.com wants you to sign in with your Ethereum account:
0x742d35Cc6C4C1Ca5d428d9eE0e9B1E1234567890

Sign in to our Web3 application.

URI: https://example.com
Version: 1
Chain ID: 1
Nonce: abc123defg4567
Issued At: 2025-08-19T05:06:33.555Z

Expiration Time: 2025-08-19T05:16:33.555Z`;

      const errors = LineBreakValidator.validateLineBreaks(messageWithExtraLineBreak);
      
      // Should detect extra line break between fields
      const extraLineBreakError = errors.find(e => 
        e.code === 'EXTRA_LINE_BREAKS_BETWEEN_FIELDS'
      );
      
      expect(extraLineBreakError).toBeDefined();
      expect(extraLineBreakError?.fixable).toBe(true);
      expect(extraLineBreakError?.message).toContain('Extra empty lines between required fields');
    });

    test('full validation engine prioritizes line break errors over parsing errors', () => {
      const messageWithExtraLineBreak = `example.com wants you to sign in with your Ethereum account:
0x742d35Cc6C4C1Ca5d428d9eE0e9B1E1234567890

Sign in to our Web3 application.

URI: https://example.com
Version: 1
Chain ID: 1
Nonce: abc123defg4567
Issued At: 2025-08-19T05:06:33.555Z

Expiration Time: 2025-08-19T05:16:33.555Z`;

      const result = ValidationEngine.validate(messageWithExtraLineBreak);
      
      // Should have errors
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      
      // Should prioritize line break errors over generic parsing errors
      const lineBreakErrors = result.errors.filter(e => 
        e.code.includes('LINE_BREAK') || e.code.includes('EXTRA') || e.code.includes('MISSING')
      );
      
      expect(lineBreakErrors.length).toBeGreaterThan(0);
      
      // The error should specifically mention line breaks, not just "missing field"
      const hasSpecificLineBreakError = result.errors.some(e => 
        e.message.toLowerCase().includes('line') && 
        (e.message.toLowerCase().includes('extra') || e.message.toLowerCase().includes('empty'))
      );
      
      expect(hasSpecificLineBreakError).toBe(true);
    });
  });

  describe('Extra Line Break Detection', () => {
    test('detects extra line break between header and address', () => {
      const messageWithExtraLineBreak = `example.com wants you to sign in with your Ethereum account:

0x742d35Cc6C4C1Ca5d428d9eE0e9B1E1234567890

URI: https://example.com
Version: 1
Chain ID: 1
Nonce: abc123defg4567
Issued At: 2025-08-19T05:06:33.555Z`;

      const errors = LineBreakValidator.validateLineBreaks(messageWithExtraLineBreak);
      
      const headerAddressError = errors.find(e => 
        e.code === 'EXTRA_LINE_BREAK_HEADER_ADDRESS'
      );
      
      expect(headerAddressError).toBeDefined();
      expect(headerAddressError?.message).toContain('Extra empty line between header and address');
    });

    test('detects extra line breaks before URI', () => {
      const messageWithExtraLineBreaks = `example.com wants you to sign in with your Ethereum account:
0x742d35Cc6C4C1Ca5d428d9eE0e9B1E1234567890

Sign in to our Web3 application.



URI: https://example.com
Version: 1
Chain ID: 1
Nonce: abc123defg4567
Issued At: 2025-08-19T05:06:33.555Z`;

      const errors = LineBreakValidator.validateLineBreaks(messageWithExtraLineBreaks);
      
      const beforeUriError = errors.find(e => 
        e.code === 'EXTRA_LINE_BREAKS_BEFORE_URI'
      );
      
      expect(beforeUriError).toBeDefined();
      expect(beforeUriError?.message).toContain('Extra empty lines before URI field');
    });

    test('detects multiple consecutive empty lines', () => {
      const messageWithManyEmptyLines = `example.com wants you to sign in with your Ethereum account:
0x742d35Cc6C4C1Ca5d428d9eE0e9B1E1234567890

Sign in to our Web3 application.




URI: https://example.com
Version: 1
Chain ID: 1
Nonce: abc123defg4567
Issued At: 2025-08-19T05:06:33.555Z`;

      const errors = LineBreakValidator.validateLineBreaks(messageWithManyEmptyLines);
      
      const consecutiveEmptyError = errors.find(e => 
        e.code === 'TOO_MANY_CONSECUTIVE_EMPTY_LINES'
      );
      
      expect(consecutiveEmptyError).toBeDefined();
      expect(consecutiveEmptyError?.severity).toBe('warning');
    });
  });

  describe('Missing Line Break Detection', () => {
    test('detects missing line break between address and statement', () => {
      const messageWithMissingLineBreak = `example.com wants you to sign in with your Ethereum account:
0x742d35Cc6C4C1Ca5d428d9eE0e9B1E1234567890
Sign in to our Web3 application.

URI: https://example.com
Version: 1
Chain ID: 1
Nonce: abc123defg4567
Issued At: 2025-08-19T05:06:33.555Z`;

      const errors = LineBreakValidator.validateLineBreaks(messageWithMissingLineBreak);
      
      const missingLineBreakError = errors.find(e => 
        e.code === 'MISSING_LINE_BREAK_ADDRESS_STATEMENT'
      );
      
      expect(missingLineBreakError).toBeDefined();
      expect(missingLineBreakError?.message).toContain('Missing empty line between address and statement');
    });

    test('detects missing line break between statement and URI', () => {
      const messageWithMissingLineBreak = `example.com wants you to sign in with your Ethereum account:
0x742d35Cc6C4C1Ca5d428d9eE0e9B1E1234567890

Sign in to our Web3 application.
URI: https://example.com
Version: 1
Chain ID: 1
Nonce: abc123defg4567
Issued At: 2025-08-19T05:06:33.555Z`;

      const errors = LineBreakValidator.validateLineBreaks(messageWithMissingLineBreak);
      
      const missingLineBreakError = errors.find(e => 
        e.code === 'MISSING_LINE_BREAK_STATEMENT_URI'
      );
      
      expect(missingLineBreakError).toBeDefined();
      expect(missingLineBreakError?.message).toContain('Missing empty line between statement and URI field');
    });
  });

  describe('Trailing Whitespace Detection', () => {
    test('detects trailing whitespace on lines', () => {
      const messageWithTrailingWhitespace = `example.com wants you to sign in with your Ethereum account:   
0x742d35Cc6C4C1Ca5d428d9eE0e9B1E1234567890

Sign in to our Web3 application.\t

URI: https://example.com
Version: 1
Chain ID: 1
Nonce: abc123defg4567
Issued At: 2025-08-19T05:06:33.555Z`;

      const errors = LineBreakValidator.validateLineBreaks(messageWithTrailingWhitespace);
      
      const trailingWhitespaceErrors = errors.filter(e => 
        e.code === 'TRAILING_WHITESPACE'
      );
      
      expect(trailingWhitespaceErrors.length).toBeGreaterThan(0);
      expect(trailingWhitespaceErrors[0].severity).toBe('warning');
    });
  });

  describe('Line Break Fixing', () => {
    test('fixes extra line breaks correctly', () => {
      const messageWithExtraLineBreaks = `example.com wants you to sign in with your Ethereum account:

0x742d35Cc6C4C1Ca5d428d9eE0e9B1E1234567890

Sign in to our Web3 application.



URI: https://example.com

Version: 1

Chain ID: 1

Nonce: abc123defg4567

Issued At: 2025-08-19T05:06:33.555Z

Expiration Time: 2025-08-19T05:16:33.555Z`;

      const fixed = LineBreakValidator.fixLineBreaks(messageWithExtraLineBreaks);
      
      // Should have proper structure
      expect(fixed).toContain('account:\n0x742d35'); // No extra line between header and address
      expect(fixed).toContain('application.\n\nURI:'); // Exactly one empty line before URI
      expect(fixed).toContain('URI: https://example.com\nVersion: 1'); // No empty lines between required fields
      
      // Validate that the fixed message has fewer line break errors
      const fixedErrors = LineBreakValidator.validateLineBreaks(fixed);
      const originalErrors = LineBreakValidator.validateLineBreaks(messageWithExtraLineBreaks);
      
      expect(fixedErrors.length).toBeLessThan(originalErrors.length);
    });

    test('user scenario: fixes extra line break between last two lines', () => {
      const messageWithExtraLineBreak = `example.com wants you to sign in with your Ethereum account:
0x742d35Cc6C4C1Ca5d428d9eE0e9B1E1234567890

Sign in to our Web3 application.

URI: https://example.com
Version: 1
Chain ID: 1
Nonce: abc123defg4567
Issued At: 2025-08-19T05:06:33.555Z

Expiration Time: 2025-08-19T05:16:33.555Z`;

      const fixed = LineBreakValidator.fixLineBreaks(messageWithExtraLineBreak);
      
      // Should have no empty line between Issued At and Expiration Time
      expect(fixed).toContain('Issued At: 2025-08-19T05:06:33.555Z\nExpiration Time: 2025-08-19T05:16:33.555Z');
      
      // Validate that the fix resolves the issue
      const fixedErrors = LineBreakValidator.validateLineBreaks(fixed);
      const extraLineBreakErrors = fixedErrors.filter(e => 
        e.code === 'EXTRA_LINE_BREAKS_BETWEEN_FIELDS'
      );
      
      expect(extraLineBreakErrors.length).toBe(0);
    });
  });

  describe('Message Structure Analysis', () => {
    test('correctly identifies all field positions', () => {
      const structure = (LineBreakValidator as any).analyzeMessageStructure(validMessage.split('\n'));
      
      expect(structure.headerIndex).toBe(0);
      expect(structure.addressIndex).toBe(1);
      expect(structure.statementIndex).toBe(3);
      expect(structure.uriIndex).toBe(5);
      expect(structure.versionIndex).toBe(6);
      expect(structure.chainIdIndex).toBe(7);
      expect(structure.nonceIndex).toBe(8);
      expect(structure.issuedAtIndex).toBe(9);
    });
  });
});
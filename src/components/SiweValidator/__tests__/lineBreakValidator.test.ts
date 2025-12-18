// Tests for line break validation functionality

import { LineBreakValidator } from '../lineBreakValidator';
import { ValidationEngine } from '../validationEngine';
import { SiweMessageParser } from '../parser';
import { FieldReplacer } from '../fieldReplacer';

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
      // Note: Expiration Time is an optional field, so this should use EXTRA_LINE_BREAKS_BEFORE_OPTIONAL_FIELD
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
      
      // Should detect extra line break before optional field (Expiration Time)
      const extraLineBreakError = errors.find(e => 
        e.code === 'EXTRA_LINE_BREAKS_BEFORE_OPTIONAL_FIELD'
      );
      
      expect(extraLineBreakError).toBeDefined();
      expect(extraLineBreakError?.fixable).toBe(true);
      expect(extraLineBreakError?.message).toContain('Extra empty lines before Expiration Time field');
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

  describe('Extra Line Breaks Before Optional Fields', () => {
    test('detects extra line break before Expiration Time', () => {
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
      
      const optionalFieldError = errors.find(e => 
        e.code === 'EXTRA_LINE_BREAKS_BEFORE_OPTIONAL_FIELD'
      );
      
      expect(optionalFieldError).toBeDefined();
      expect(optionalFieldError?.message).toContain('Extra empty lines before Expiration Time field');
    });

    test('detects extra line break before Not Before field', () => {
      const messageWithExtraLineBreak = `example.com wants you to sign in with your Ethereum account:
0x742d35Cc6C4C1Ca5d428d9eE0e9B1E1234567890

Sign in to our Web3 application.

URI: https://example.com
Version: 1
Chain ID: 1
Nonce: abc123defg4567
Issued At: 2025-08-19T05:06:33.555Z

Not Before: 2025-08-19T05:06:33.555Z`;

      const errors = LineBreakValidator.validateLineBreaks(messageWithExtraLineBreak);
      
      const optionalFieldError = errors.find(e => 
        e.code === 'EXTRA_LINE_BREAKS_BEFORE_OPTIONAL_FIELD'
      );
      
      expect(optionalFieldError).toBeDefined();
      expect(optionalFieldError?.message).toContain('Extra empty lines before Not Before field');
    });

    test('detects extra line break between multiple optional fields', () => {
      const messageWithExtraLineBreak = `example.com wants you to sign in with your Ethereum account:
0x742d35Cc6C4C1Ca5d428d9eE0e9B1E1234567890

Sign in to our Web3 application.

URI: https://example.com
Version: 1
Chain ID: 1
Nonce: abc123defg4567
Issued At: 2025-08-19T05:06:33.555Z
Expiration Time: 2025-08-19T05:16:33.555Z

Not Before: 2025-08-19T05:06:33.555Z`;

      const errors = LineBreakValidator.validateLineBreaks(messageWithExtraLineBreak);
      
      const optionalFieldError = errors.find(e => 
        e.code === 'EXTRA_LINE_BREAKS_BEFORE_OPTIONAL_FIELD' && 
        e.message.includes('Not Before')
      );
      
      expect(optionalFieldError).toBeDefined();
      expect(optionalFieldError?.message).toContain('Extra empty lines before Not Before field');
    });
  });

  describe('No Statement Line Break Handling (EIP-4361)', () => {
    test('valid message with no statement and 2 empty lines should pass', () => {
      const validNoStatement = `example.com wants you to sign in with your Ethereum account:
0x742d35Cc6C4C1Ca5d428d9eE0e9B1E1234567890


URI: https://example.com
Version: 1
Chain ID: 1
Nonce: abc123defg4567
Issued At: 2025-08-19T05:06:33.555Z`;

      const errors = LineBreakValidator.validateLineBreaks(validNoStatement);
      const lineBreakErrors = errors.filter(e => 
        e.code.includes('LINE_BREAK') || e.code.includes('EXTRA')
      );
      expect(lineBreakErrors).toHaveLength(0);
    });

    test('invalid message with no statement and only 1 empty line should fail', () => {
      const invalidNoStatement = `example.com wants you to sign in with your Ethereum account:
0x742d35Cc6C4C1Ca5d428d9eE0e9B1E1234567890

URI: https://example.com
Version: 1
Chain ID: 1
Nonce: abc123defg4567
Issued At: 2025-08-19T05:06:33.555Z`;

      const errors = LineBreakValidator.validateLineBreaks(invalidNoStatement);
      const missingLineError = errors.find(e => e.code === 'MISSING_LINE_BREAK_NO_STATEMENT');
      expect(missingLineError).toBeDefined();
      expect(missingLineError?.message).toContain('expected 2');
    });

    test('message with no statement and 3 empty lines should report extra', () => {
      const tooManyLines = `example.com wants you to sign in with your Ethereum account:
0x742d35Cc6C4C1Ca5d428d9eE0e9B1E1234567890



URI: https://example.com
Version: 1
Chain ID: 1
Nonce: abc123defg4567
Issued At: 2025-08-19T05:06:33.555Z`;

      const errors = LineBreakValidator.validateLineBreaks(tooManyLines);
      const extraLinesError = errors.find(e => e.code === 'EXTRA_LINE_BREAKS_BEFORE_URI');
      expect(extraLinesError).toBeDefined();
      expect(extraLinesError?.message).toContain('expected 2');
    });

    test('fixLineBreaks adds 2 empty lines when no statement', () => {
      // Message with only 1 empty line (incorrect)
      const invalidNoStatement = `example.com wants you to sign in with your Ethereum account:
0x742d35Cc6C4C1Ca5d428d9eE0e9B1E1234567890

URI: https://example.com
Version: 1
Chain ID: 1
Nonce: abc123defg4567
Issued At: 2025-08-19T05:06:33.555Z`;

      const fixed = LineBreakValidator.fixLineBreaks(invalidNoStatement);
      
      // Should have 2 empty lines between address and URI
      expect(fixed).toContain('0x742d35Cc6C4C1Ca5d428d9eE0e9B1E1234567890\n\n\nURI:');
      
      // Validate the fixed message has no line break errors
      const errors = LineBreakValidator.validateLineBreaks(fixed);
      const lineBreakErrors = errors.filter(e => 
        e.code.includes('LINE_BREAK') || e.code.includes('EXTRA')
      );
      expect(lineBreakErrors).toHaveLength(0);
    });

    test('SiweMessageParser.generateMessage outputs 2 empty lines when no statement', () => {
      const fields = {
        domain: 'example.com',
        address: '0x742d35Cc6C4C1Ca5d428d9eE0e9B1E1234567890',
        uri: 'https://example.com',
        version: '1',
        chainId: '1',
        nonce: 'abc123defg4567',
        issuedAt: '2025-08-19T05:06:33.555Z'
        // No statement
      };

      const generated = SiweMessageParser.generateMessage(fields);
      
      // Should have 2 empty lines between address and URI
      expect(generated).toContain('0x742d35Cc6C4C1Ca5d428d9eE0e9B1E1234567890\n\n\nURI:');
      
      // Validate the generated message has no line break errors
      const errors = LineBreakValidator.validateLineBreaks(generated);
      const lineBreakErrors = errors.filter(e => 
        e.code.includes('LINE_BREAK') || e.code.includes('EXTRA')
      );
      expect(lineBreakErrors).toHaveLength(0);
    });

    test('SiweMessageParser.generateMessage outputs 1 empty line when statement exists', () => {
      const fields = {
        domain: 'example.com',
        address: '0x742d35Cc6C4C1Ca5d428d9eE0e9B1E1234567890',
        statement: 'Sign in to our Web3 application.',
        uri: 'https://example.com',
        version: '1',
        chainId: '1',
        nonce: 'abc123defg4567',
        issuedAt: '2025-08-19T05:06:33.555Z'
      };

      const generated = SiweMessageParser.generateMessage(fields);
      
      // Should have 1 empty line before statement, then statement, then 1 empty line before URI
      expect(generated).toContain('0x742d35Cc6C4C1Ca5d428d9eE0e9B1E1234567890\n\nSign in');
      expect(generated).toContain('application.\n\nURI:');
      
      // Validate the generated message has no line break errors
      const errors = LineBreakValidator.validateLineBreaks(generated);
      const lineBreakErrors = errors.filter(e => 
        e.code.includes('LINE_BREAK') || e.code.includes('EXTRA')
      );
      expect(lineBreakErrors).toHaveLength(0);
    });

    test('FieldReplacer.applyFieldFix handles MISSING_LINE_BREAK_NO_STATEMENT error', () => {
      // Message with only 1 empty line (incorrect per EIP-4361)
      const invalidNoStatement = `example.com wants you to sign in with your Ethereum account:
0x742d35Cc6C4C1Ca5d428d9eE0e9B1E1234567890

URI: https://example.com
Version: 1
Chain ID: 1
Nonce: abc123defg4567
Issued At: 2025-08-19T05:06:33.555Z`;

      const error = {
        type: 'format' as const,
        field: 'structure',
        line: 3,
        column: 1,
        message: 'Missing empty line between address and URI field',
        severity: 'error' as const,
        fixable: true,
        code: 'MISSING_LINE_BREAK_NO_STATEMENT'
      };

      const fixed = FieldReplacer.applyFieldFix(invalidNoStatement, error);
      
      // Should have 2 empty lines between address and URI
      expect(fixed).toContain('0x742d35Cc6C4C1Ca5d428d9eE0e9B1E1234567890\n\n\nURI:');
      
      // Validate the fixed message has no line break errors
      const errors = LineBreakValidator.validateLineBreaks(fixed);
      const lineBreakErrors = errors.filter(e => 
        e.code.includes('LINE_BREAK') || e.code.includes('EXTRA')
      );
      expect(lineBreakErrors).toHaveLength(0);
    });

    test('SiweMessageParser.parse correctly handles 2 empty lines when no statement', () => {
      const validNoStatement = `example.com wants you to sign in with your Ethereum account:
0x742d35Cc6C4C1Ca5d428d9eE0e9B1E1234567890


URI: https://example.com
Version: 1
Chain ID: 1
Nonce: abc123defg4567
Issued At: 2025-08-19T05:06:33.555Z`;

      const parsed = SiweMessageParser.parse(validNoStatement);
      
      // Should parse all fields correctly
      expect(parsed.fields.domain).toBe('example.com');
      expect(parsed.fields.address).toBe('0x742d35Cc6C4C1Ca5d428d9eE0e9B1E1234567890');
      expect(parsed.fields.statement).toBeUndefined();
      expect(parsed.fields.uri).toBe('https://example.com');
      expect(parsed.fields.version).toBe('1');
      expect(parsed.fields.chainId).toBe('1');
      expect(parsed.fields.nonce).toBe('abc123defg4567');
      expect(parsed.fields.issuedAt).toBe('2025-08-19T05:06:33.555Z');
      
      // Should have no parse errors
      expect(parsed.parseErrors).toHaveLength(0);
      expect(parsed.isValid).toBe(true);
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
      expect(structure.expirationTimeIndex).toBe(10);
    });

    test('correctly identifies optional field positions', () => {
      const messageWithOptionalFields = `example.com wants you to sign in with your Ethereum account:
0x742d35Cc6C4C1Ca5d428d9eE0e9B1E1234567890

Sign in to our Web3 application.

URI: https://example.com
Version: 1
Chain ID: 1
Nonce: abc123defg4567
Issued At: 2025-08-19T05:06:33.555Z
Expiration Time: 2025-08-19T05:16:33.555Z
Not Before: 2025-08-19T05:06:33.555Z
Request ID: abcd1234`;

      const structure = (LineBreakValidator as any).analyzeMessageStructure(messageWithOptionalFields.split('\n'));
      
      expect(structure.expirationTimeIndex).toBe(10);
      expect(structure.notBeforeIndex).toBe(11);
      expect(structure.requestIdIndex).toBe(12);
    });
  });
});
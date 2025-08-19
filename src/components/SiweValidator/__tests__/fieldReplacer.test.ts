// Tests for targeted field replacement functionality

import { FieldReplacer } from '../fieldReplacer';
import { ValidationEngine } from '../validationEngine';

describe('FieldReplacer', () => {
  const sampleMessage = `example.com wants you to sign in with your Ethereum account:
0x742d35Cc6C4C1Ca5d428d9eE0e9B1E1234567890

Sign in to our Web3 application.

URI: https://example.com
Version: 1
Chain ID: 1
Nonce: 1
Issued At: 2025-08-19T05:06:33.555Z
Expiration Time: 2025-08-19T05:16:33.555Z`;

  describe('replaceField', () => {
    test('replaces nonce field only', () => {
      const fixed = FieldReplacer.replaceField(sampleMessage, 'nonce', 'xWxaqVr6LtFXrmgW');
      
      // Should contain the new nonce
      expect(fixed).toContain('Nonce: xWxaqVr6LtFXrmgW');
      
      // Should preserve everything else
      expect(fixed).toContain('example.com wants you to sign in');
      expect(fixed).toContain('0x742d35Cc6C4C1Ca5d428d9eE0e9B1E1234567890');
      expect(fixed).toContain('Sign in to our Web3 application.');
      expect(fixed).toContain('URI: https://example.com');
      expect(fixed).toContain('Version: 1');
      expect(fixed).toContain('Chain ID: 1');
      expect(fixed).toContain('Issued At: 2025-08-19T05:06:33.555Z');
      expect(fixed).toContain('Expiration Time: 2025-08-19T05:16:33.555Z');
      
      // Should NOT contain the old nonce
      expect(fixed).not.toContain('Nonce: 1');
    });

    test('replaces address field only', () => {
      const newAddress = '0x123d35Cc6C4C1Ca5d428d9eE0e9B1E1234567890';
      const fixed = FieldReplacer.replaceField(sampleMessage, 'address', newAddress);
      
      expect(fixed).toContain(newAddress);
      expect(fixed).not.toContain('0x742d35Cc6C4C1Ca5d428d9eE0e9B1E1234567890');
      expect(fixed).toContain('Nonce: 1'); // Original nonce should remain
    });

    test('replaces domain field only', () => {
      const fixed = FieldReplacer.replaceField(sampleMessage, 'domain', 'newdomain.com');
      
      expect(fixed).toContain('newdomain.com wants you to sign in');
      expect(fixed).not.toContain('example.com wants you to sign in');
      expect(fixed).toContain('URI: https://example.com'); // URI should remain unchanged
    });

    test('replaces version field only', () => {
      const fixed = FieldReplacer.replaceField(sampleMessage, 'version', '2');
      
      expect(fixed).toContain('Version: 2');
      expect(fixed).not.toContain('Version: 1');
      expect(fixed).toContain('Chain ID: 1'); // Chain ID should remain unchanged
    });
  });

  describe('applyFieldFix', () => {
    test('fixes weak nonce error correctly', () => {
      // Validate the message to get the actual error
      const result = ValidationEngine.validate(sampleMessage);
      const nonceError = result.errors.find(e => e.field === 'nonce');
      
      expect(nonceError).toBeDefined();
      expect(nonceError?.fixable).toBe(true);
      
      if (nonceError) {
        const fixed = FieldReplacer.applyFieldFix(sampleMessage, nonceError);
        
        // Should have a new, longer nonce
        const nonceMatch = fixed.match(/Nonce: ([^\n]+)/);
        expect(nonceMatch).toBeTruthy();
        const newNonce = nonceMatch![1];
        expect(newNonce).not.toBe('1');
        expect(newNonce.length).toBeGreaterThanOrEqual(8);
        
        // Everything else should be preserved
        expect(fixed).toContain('example.com wants you to sign in');
        expect(fixed).toContain('0x742d35Cc6C4C1Ca5d428d9eE0e9B1E1234567890');
        expect(fixed).toContain('Sign in to our Web3 application.');
        expect(fixed).toContain('URI: https://example.com');
        expect(fixed).toContain('Version: 1');
        expect(fixed).toContain('Chain ID: 1');
        expect(fixed).toContain('Issued At: 2025-08-19T05:06:33.555Z');
        expect(fixed).toContain('Expiration Time: 2025-08-19T05:16:33.555Z');
      }
    });

    test('fixes address format error correctly', () => {
      const messageWithBadAddress = sampleMessage.replace(
        '0x742d35Cc6C4C1Ca5d428d9eE0e9B1E1234567890',
        '742d35Cc6C4C1Ca5d428d9eE0e9B1E1234567890' // Missing 0x
      );
      
      const result = ValidationEngine.validate(messageWithBadAddress);
      const addressError = result.errors.find(e => e.field === 'address');
      
      expect(addressError).toBeDefined();
      
      if (addressError) {
        const fixed = FieldReplacer.applyFieldFix(messageWithBadAddress, addressError);
        
        // Should add 0x prefix
        expect(fixed).toContain('0x742d35Cc6C4C1Ca5d428d9eE0e9B1E1234567890');
        expect(fixed).not.toContain('\n742d35Cc6C4C1Ca5d428d9eE0e9B1E1234567890\n');
        
        // Everything else preserved
        expect(fixed).toContain('Nonce: 1');
        expect(fixed).toContain('example.com wants you to sign in');
      }
    });

    test('fixes version error correctly', () => {
      const messageWithBadVersion = sampleMessage.replace('Version: 1', 'Version: 2');
      
      const result = ValidationEngine.validate(messageWithBadVersion);
      const versionError = result.errors.find(e => e.field === 'version');
      
      expect(versionError).toBeDefined();
      
      if (versionError) {
        const fixed = FieldReplacer.applyFieldFix(messageWithBadVersion, versionError);
        
        expect(fixed).toContain('Version: 1');
        expect(fixed).not.toContain('Version: 2');
        
        // Everything else preserved
        expect(fixed).toContain('Nonce: 1');
        expect(fixed).toContain('Chain ID: 1');
      }
    });
  });

  describe('User reported scenario', () => {
    test('fixes nonce "1" to secure nonce while preserving everything else', () => {
      const testMessage = `example.com wants you to sign in with your Ethereum account:
0x742d35Cc6C4C1Ca5d428d9eE0e9B1E1234567890

Sign in to our Web3 application.

URI: https://example.com
Version: 1
Chain ID: 1
Nonce: 1
Issued At: 2025-08-19T05:06:33.555Z
Expiration Time: 2025-08-19T05:16:33.555Z`;

      // Validate to get the nonce error
      const result = ValidationEngine.validate(testMessage);
      const nonceError = result.errors.find(e => e.field === 'nonce' && e.fixable);
      
      expect(nonceError).toBeDefined();
      
      if (nonceError) {
        const fixed = FieldReplacer.applyFieldFix(testMessage, nonceError);
        
        // Parse both messages line by line to compare
        const originalLines = testMessage.split('\n');
        const fixedLines = fixed.split('\n');
        
        // Should have same number of lines
        expect(fixedLines.length).toBe(originalLines.length);
        
        // Compare each line - only nonce line should be different
        for (let i = 0; i < originalLines.length; i++) {
          if (originalLines[i] === 'Nonce: 1') {
            // This line should be changed
            expect(fixedLines[i]).toMatch(/^Nonce: [a-zA-Z0-9]+$/);
            expect(fixedLines[i]).not.toBe('Nonce: 1');
            
            // Extract and verify the new nonce
            const newNonce = fixedLines[i].replace('Nonce: ', '');
            expect(newNonce.length).toBeGreaterThanOrEqual(8);
            expect(/^[a-zA-Z0-9]+$/.test(newNonce)).toBe(true);
          } else {
            // All other lines should be identical
            expect(fixedLines[i]).toBe(originalLines[i]);
          }
        }
        
        // Verify the exact expected output format
        const expectedLines = [
          'example.com wants you to sign in with your Ethereum account:',
          '0x742d35Cc6C4C1Ca5d428d9eE0e9B1E1234567890',
          '',
          'Sign in to our Web3 application.',
          '',
          'URI: https://example.com',
          'Version: 1',
          'Chain ID: 1',
          '', // This will be the nonce line - we'll check it separately
          'Issued At: 2025-08-19T05:06:33.555Z',
          'Expiration Time: 2025-08-19T05:16:33.555Z'
        ];
        
        // Check all lines except the nonce line
        for (let i = 0; i < expectedLines.length; i++) {
          if (i === 8) { // Skip nonce line
            continue;
          }
          expect(fixedLines[i]).toBe(expectedLines[i]);
        }
        
        // Check nonce line format
        expect(fixedLines[8]).toMatch(/^Nonce: [a-zA-Z0-9]{8,}$/);
      }
    });
  });
});
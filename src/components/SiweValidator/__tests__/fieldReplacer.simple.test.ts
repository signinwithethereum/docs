// Simple test for targeted field replacement functionality

import { FieldReplacer } from '../fieldReplacer';

describe('FieldReplacer - Simple Tests', () => {
  const sampleMessage = `example.com wants you to sign in with your Ethereum account:
0x742d35Cc6C4C1Ca5d428d9eE0e9B1E1234567890

Sign in to our Web3 application.

URI: https://example.com
Version: 1
Chain ID: 1
Nonce: 1
Issued At: 2025-08-19T05:06:33.555Z
Expiration Time: 2025-08-19T05:16:33.555Z`;

  test('replaces nonce field only, preserving everything else', () => {
    const fixed = FieldReplacer.replaceField(sampleMessage, 'nonce', 'xWxaqVr6LtFXrmgW');
    
    // Should contain the new nonce
    expect(fixed).toContain('Nonce: xWxaqVr6LtFXrmgW');
    
    // Should preserve everything else exactly
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
    
    // Verify exact line-by-line replacement
    const originalLines = sampleMessage.split('\n');
    const fixedLines = fixed.split('\n');
    
    expect(fixedLines.length).toBe(originalLines.length);
    
    // Find nonce line and verify only it changed
    let nonceLineChanged = false;
    for (let i = 0; i < originalLines.length; i++) {
      if (originalLines[i] === 'Nonce: 1') {
        expect(fixedLines[i]).toBe('Nonce: xWxaqVr6LtFXrmgW');
        nonceLineChanged = true;
      } else {
        expect(fixedLines[i]).toBe(originalLines[i]);
      }
    }
    
    expect(nonceLineChanged).toBe(true);
  });

  test('user scenario: fixing weak nonce preserves entire message structure', () => {
    // Create a mock error for weak nonce
    const mockNonceError = {
      type: 'security' as const,
      field: 'nonce',
      line: 8,
      column: 1,
      message: 'Nonce is too weak',
      severity: 'error' as const,
      fixable: true,
      code: 'NONCE_WEAK_ENTROPY'
    };
    
    const fixed = FieldReplacer.applyFieldFix(sampleMessage, mockNonceError);
    
    // Parse both messages line by line
    const originalLines = sampleMessage.split('\n');
    const fixedLines = fixed.split('\n');
    
    // Should have same number of lines
    expect(fixedLines.length).toBe(originalLines.length);
    
    // Compare each line - only nonce line should be different
    for (let i = 0; i < originalLines.length; i++) {
      if (originalLines[i] === 'Nonce: 1') {
        // This line should be changed to a secure nonce
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
  });

  test('fixes address format by adding 0x prefix only', () => {
    const messageWithBadAddress = sampleMessage.replace(
      '0x742d35Cc6C4C1Ca5d428d9eE0e9B1E1234567890',
      '742d35Cc6C4C1Ca5d428d9eE0e9B1E1234567890'
    );
    
    const mockAddressError = {
      type: 'format' as const,
      field: 'address',
      line: 2,
      column: 1,
      message: 'Address missing 0x prefix',
      severity: 'error' as const,
      fixable: true,
      code: 'ADDRESS_INVALID_FORMAT'
    };
    
    const fixed = FieldReplacer.applyFieldFix(messageWithBadAddress, mockAddressError);
    
    // Should add 0x prefix
    expect(fixed).toContain('0x742d35Cc6C4C1Ca5d428d9eE0e9B1E1234567890');
    
    // Should not contain the version without 0x on its own line
    const lines = fixed.split('\n');
    expect(lines.some(line => line.trim() === '742d35Cc6C4C1Ca5d428d9eE0e9B1E1234567890')).toBe(false);
    
    // Everything else should be preserved
    expect(fixed).toContain('Nonce: 1');
    expect(fixed).toContain('example.com wants you to sign in');
    expect(fixed).toContain('Version: 1');
  });

  test('replaces version field only', () => {
    const fixed = FieldReplacer.replaceField(sampleMessage, 'version', '2');
    
    expect(fixed).toContain('Version: 2');
    expect(fixed).not.toContain('Version: 1');
    
    // Chain ID should remain unchanged
    expect(fixed).toContain('Chain ID: 1');
    expect(fixed).toContain('Nonce: 1');
  });
});
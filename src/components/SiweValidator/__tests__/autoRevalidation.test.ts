// Test for automatic re-validation after applying fixes

import { ValidationEngine } from '../validationEngine';
import { FieldReplacer } from '../fieldReplacer';

describe('Auto Re-validation Flow', () => {
  const messageWithWeakNonce = `example.com wants you to sign in with your Ethereum account:
0x742d35Cc6C4C1Ca5d428d9eE0e9B1E1234567890

Sign in to our Web3 application.

URI: https://example.com
Version: 1
Chain ID: 1
Nonce: 1
Issued At: 2025-08-19T05:06:33.555Z
Expiration Time: 2025-08-19T05:16:33.555Z`;

  test('fix should improve validation results', () => {
    // Initial validation should show errors
    const initialResult = ValidationEngine.validate(messageWithWeakNonce);
    expect(initialResult.isValid).toBe(false);
    expect(initialResult.errors.length).toBeGreaterThan(0);
    
    // Find the nonce error
    const nonceError = initialResult.errors.find(e => e.field === 'nonce' && e.fixable);
    expect(nonceError).toBeDefined();
    
    if (nonceError) {
      // Apply the fix
      const fixedMessage = FieldReplacer.applyFieldFix(messageWithWeakNonce, nonceError);
      expect(fixedMessage).not.toBe(messageWithWeakNonce);
      
      // Re-validate the fixed message
      const revalidatedResult = ValidationEngine.validate(fixedMessage);
      
      // Should have fewer errors (or be completely valid)
      expect(revalidatedResult.errors.length).toBeLessThan(initialResult.errors.length);
      
      // The specific nonce error should be gone
      const remainingNonceErrors = revalidatedResult.errors.filter(e => e.field === 'nonce');
      expect(remainingNonceErrors.length).toBe(0);
      
      // Message should contain the fixed nonce
      expect(fixedMessage).toMatch(/Nonce: [a-zA-Z0-9]{8,}/);
      expect(fixedMessage).not.toContain('Nonce: 1');
    }
  });

  test('fix all should resolve multiple issues', () => {
    const multiErrorMessage = `example.com wants you to sign in with your Ethereum account:
742d35Cc6C4C1Ca5d428d9eE0e9B1E1234567890

Sign in to our Web3 application.

URI: http://example.com
Version: 2
Chain ID: 1
Nonce: test
Issued At: 2025-08-19T05:06:33.555Z`;

    // Initial validation should show multiple errors
    const initialResult = ValidationEngine.validate(multiErrorMessage);
    expect(initialResult.isValid).toBe(false);
    expect(initialResult.errors.length).toBeGreaterThan(2);
    
    // Find fixable errors
    const fixableErrors = initialResult.errors.filter(e => e.fixable);
    expect(fixableErrors.length).toBeGreaterThan(1);
    
    // Apply all fixes sequentially
    let currentMessage = multiErrorMessage;
    for (const error of fixableErrors) {
      const fixedMessage = FieldReplacer.applyFieldFix(currentMessage, error);
      if (fixedMessage !== currentMessage) {
        currentMessage = fixedMessage;
      }
    }
    
    // Re-validate the fully fixed message
    const finalResult = ValidationEngine.validate(currentMessage);
    
    // Should have significantly fewer errors
    expect(finalResult.errors.length).toBeLessThan(initialResult.errors.length);
    
    // Verify specific fixes were applied
    expect(currentMessage).toContain('0x742d35Cc6C4C1Ca5d428d9eE0e9B1E1234567890'); // Address fixed
    expect(currentMessage).toContain('https://example.com'); // URI scheme fixed
    expect(currentMessage).toContain('Version: 1'); // Version fixed
    expect(currentMessage).toMatch(/Nonce: [a-zA-Z0-9]{8,}/); // Nonce fixed
  });

  test('validation profile change should trigger re-validation', () => {
    const testMessage = messageWithWeakNonce;
    
    // Validate with strict profile
    const strictResult = ValidationEngine.validate(testMessage, {
      profile: ValidationEngine.PROFILES.strict
    });
    
    // Validate with development profile  
    const devResult = ValidationEngine.validate(testMessage, {
      profile: ValidationEngine.PROFILES.development
    });
    
    // Strict mode should typically find more issues than dev mode
    const strictIssueCount = strictResult.errors.length + strictResult.warnings.length;
    const devIssueCount = devResult.errors.length + devResult.warnings.length;
    
    // At minimum, both should find the nonce issue, but strict might find more
    expect(strictIssueCount).toBeGreaterThanOrEqual(devIssueCount);
    expect(devIssueCount).toBeGreaterThan(0); // Should still find the obvious nonce issue
  });

  test('re-validation preserves message structure after fix', () => {
    const originalMessage = messageWithWeakNonce;
    const originalLines = originalMessage.split('\n');
    
    // Get validation result and find fixable error
    const result = ValidationEngine.validate(originalMessage);
    const fixableError = result.errors.find(e => e.fixable);
    
    expect(fixableError).toBeDefined();
    
    if (fixableError) {
      // Apply fix
      const fixedMessage = FieldReplacer.applyFieldFix(originalMessage, fixableError);
      const fixedLines = fixedMessage.split('\n');
      
      // Should have same number of lines
      expect(fixedLines.length).toBe(originalLines.length);
      
      // Re-validate
      const revalidatedResult = ValidationEngine.validate(fixedMessage);
      
      // Structure should be intact and parseable
      expect(revalidatedResult.originalMessage).toBe(fixedMessage);
      
      // Should have fewer issues than original
      const originalIssueCount = result.errors.length + result.warnings.length;
      const newIssueCount = revalidatedResult.errors.length + revalidatedResult.warnings.length;
      expect(newIssueCount).toBeLessThanOrEqual(originalIssueCount);
    }
  });
});
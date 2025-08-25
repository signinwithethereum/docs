// Main SIWE Validator React Component

import React, { useState, useCallback, useRef, useEffect } from 'react';
import type { ValidationResult, ValidationError } from './types';
import { ValidationEngine } from './validationEngine';
import { AutoFixer } from './autoFixer';
import { FieldReplacer } from './fieldReplacer';
import ValidationResults from './ValidationResults';
import styles from './SiweValidator.module.css';

interface SiweValidatorProps {
  initialMessage?: string;
  className?: string;
}

const SiweValidator: React.FC<SiweValidatorProps> = ({
  initialMessage = '',
  className = ''
}) => {
  const [message, setMessage] = useState(initialMessage);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [realTimeValidation, setRealTimeValidation] = useState(false);
  const [shouldRevalidateAfterFix, setShouldRevalidateAfterFix] = useState(false);

  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const validationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Define handleValidate first, before effects that use it
  const handleValidate = useCallback(async () => {
    if (!message.trim()) {
      setValidationResult(null);
      return;
    }

    setIsValidating(true);

    // Simulate async validation for better UX
    await new Promise(resolve => setTimeout(resolve, 100));

    try {
      const result = ValidationEngine.validate(message);
      setValidationResult(result);
    } catch (error) {
      console.error('Validation error:', error);
      setValidationResult({
        isValid: false,
        errors: [{
          type: 'format',
          field: 'message',
          line: 1,
          column: 1,
          message: 'Validation failed due to an internal error',
          severity: 'error',
          fixable: false,
          code: 'VALIDATION_ERROR'
        }],
        warnings: [],
        suggestions: [],
        originalMessage: message
      });
    } finally {
      setIsValidating(false);
    }
  }, [message]);

  // Real-time validation effect (now after handleValidate is defined)
  useEffect(() => {
    if (realTimeValidation) {
      if (message.trim()) {
        if (validationTimeoutRef.current) {
          clearTimeout(validationTimeoutRef.current);
        }
        
        validationTimeoutRef.current = setTimeout(() => {
          handleValidate();
        }, 500); // Debounce validation
      } else {
        // Clear validation result when message is empty
        setValidationResult(null);
      }
    }

    return () => {
      if (validationTimeoutRef.current) {
        clearTimeout(validationTimeoutRef.current);
      }
    };
  }, [message, realTimeValidation, handleValidate]);

  // Re-validation after fix effect (now after handleValidate is defined)
  useEffect(() => {
    if (shouldRevalidateAfterFix && message.trim()) {
      setShouldRevalidateAfterFix(false);
      handleValidate();
    }
  }, [message, shouldRevalidateAfterFix, handleValidate]);

  // Clear validation results when message becomes empty
  useEffect(() => {
    if (!message.trim() && validationResult) {
      setValidationResult(null);
    }
  }, [message, validationResult]);

  const handleClear = useCallback(() => {
    setMessage('');
    setValidationResult(null);
    if (textAreaRef.current) {
      textAreaRef.current.focus();
    }
  }, []);

  const handleLoadSample = useCallback((sampleType: string) => {
    const samples = ValidationEngine.generateSamples();
    const sample = samples[sampleType];
    if (sample) {
      setMessage(sample);
      setValidationResult(null);
    }
  }, []);

  const handleApplyFix = useCallback((error: ValidationError) => {
    if (!validationResult) return;

    // Use targeted field replacement instead of full message replacement
    const fixedMessage = FieldReplacer.applyFieldFix(message, error);

    if (fixedMessage !== message) {
      setMessage(fixedMessage);
      // Show that we're re-validating
      setIsValidating(true);
      // Trigger re-validation after the message state update
      setShouldRevalidateAfterFix(true);
    }
  }, [message, validationResult]);

  const handleApplyAllFixes = useCallback(() => {
    if (!validationResult) return;

    const allErrors = [...validationResult.errors, ...validationResult.warnings, ...validationResult.suggestions];
    const fixableErrors = allErrors.filter(error => error.fixable);

    // Apply fixes one by one using targeted field replacement
    let currentMessage = message;
    let hasChanges = false;

    for (const error of fixableErrors) {
      const fixedMessage = FieldReplacer.applyFieldFix(currentMessage, error);
      if (fixedMessage !== currentMessage) {
        currentMessage = fixedMessage;
        hasChanges = true;
      }
    }

    if (hasChanges) {
      setMessage(currentMessage);
      // Show that we're re-validating
      setIsValidating(true);
      // Trigger re-validation after the message state update
      setShouldRevalidateAfterFix(true);
    }
  }, [message, validationResult]);

  const handleCopyMessage = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(message);
      // Could add a toast notification here
    } catch (error) {
      console.error('Failed to copy message:', error);
    }
  }, [message]);


  return (
    <div className={`${styles.container} ${className}`}>
      {/* Header */}
      {/* <div className={styles.header}>
        <h1 className={styles.title}>SIWE Message Validator</h1>
        <p className={styles.subtitle}>
          Validate and lint your Sign in with Ethereum messages for EIP-4361 compliance, 
          security best practices, and proper formatting.
        </p>
      </div> */}

      {/* Main Validator Interface */}
      <div className={styles.validatorWrapper}>
        {/* Input Panel */}
        <div className={styles.inputPanel}>
          <div className={styles.inputHeader}>
            <h3 className={styles.inputTitle}>SIWE Message Input</h3>
          </div>

          <div className={styles.inputContent}>
            <textarea
              ref={textAreaRef}
              className={styles.textArea}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={`Enter your SIWE message here...

Example:
siwe.xyz wants you to sign in with your Ethereum account:
0x742d35Cc6C4C1Ca5d428d9eE0e9B1E1234567890

Sign in to siwe.xyz application.

URI: https://siwe.xyz
Version: 1
Chain ID: 1
Nonce: 32891756
Issued At: 2023-10-31T16:25:24Z`}
            />

            <div className={styles.inputControls}>
              <button
                className={`${styles.button} ${styles.buttonPrimary}`}
                onClick={handleValidate}
                disabled={!message.trim() || isValidating}
              >
                {isValidating ? '⏳ Validating...' : '🔍 Validate'}
              </button>

              <button
                className={`${styles.button} ${styles.buttonSecondary}`}
                onClick={handleClear}
                disabled={!message.trim()}
              >
                🗑️ Clear
              </button>

              <button
                className={`${styles.button} ${styles.buttonSecondary}`}
                onClick={handleCopyMessage}
                disabled={!message.trim()}
              >
                📋 Copy
              </button>


              {/* Real-time validation toggle */}
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                <input
                  type="checkbox"
                  checked={realTimeValidation}
                  onChange={(e) => setRealTimeValidation(e.target.checked)}
                />
                Real-time validation
              </label>
            </div>

            {/* Quick Action Templates */}
            <div className={styles.quickActions}>
              <div className={styles.quickActionsTitle}>Quick Templates</div>
              <div className={styles.quickActionsGrid}>
                <button
                  className={styles.quickAction}
                  onClick={() => handleLoadSample('minimal')}
                >
                  ⚡ Minimal
                </button>
                <button
                  className={styles.quickAction}
                  onClick={() => handleLoadSample('withResources')}
                >
                  📚 With Optional Fields
                </button>
              </div>
              <div style={{ color: '#aaa', fontStyle: 'italic', fontSize: '0.75rem', marginTop: '0.5rem' }}>
                    * Test message contents should not just be copied verbatim for production use.
              </div>
            </div>
          </div>
        </div>

        {/* Results Panel */}
        <ValidationResults
          result={validationResult}
          isValidating={isValidating}
          onApplyFix={handleApplyFix}
          onApplyAllFixes={handleApplyAllFixes}
        />
      </div>

      {/* Footer Information */}
      <div style={{
        marginTop: '2rem',
        padding: '1rem',
        textAlign: 'center',
        fontSize: '0.875rem',
        color: 'var(--ifm-color-secondary-dark)',
        borderTop: '1px solid var(--ifm-color-emphasis-200)'
      }}>
        <p>
          This validator checks compliance with{' '}
          <a href="https://eips.ethereum.org/EIPS/eip-4361" target="_blank" rel="noopener">
            EIP-4361: Sign in with Ethereum
          </a>{' '}
          and follows security best practices. Always validate messages server-side in production.
        </p>
      </div>
    </div>
  );
};

export default SiweValidator;
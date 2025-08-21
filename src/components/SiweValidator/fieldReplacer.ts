// Targeted field replacement utility for SIWE messages

import { SiweMessageParser } from './parser';
import { LineBreakValidator } from './lineBreakValidator';
import type { ValidationError } from './types';

export class FieldReplacer {
  
  /**
   * Replace a specific field in the original message text while preserving everything else
   */
  public static replaceField(
    originalMessage: string, 
    fieldName: string, 
    newValue: string
  ): string {
    const lines = originalMessage.split('\n');
    
    switch (fieldName) {
      case 'domain':
        return this.replaceDomainField(lines, newValue);
      case 'address':
        return this.replaceAddressField(lines, newValue);
      case 'statement':
        return this.replaceStatementField(lines, newValue);
      case 'uri':
        return this.replaceUriField(lines, newValue);
      case 'version':
        return this.replaceVersionField(lines, newValue);
      case 'chainId':
        return this.replaceChainIdField(lines, newValue);
      case 'nonce':
        return this.replaceNonceField(lines, newValue);
      case 'issuedAt':
        return this.replaceIssuedAtField(lines, newValue);
      case 'expirationTime':
        return this.replaceExpirationTimeField(lines, newValue);
      case 'notBefore':
        return this.replaceNotBeforeField(lines, newValue);
      case 'requestId':
        return this.replaceRequestIdField(lines, newValue);
      default:
        return originalMessage;
    }
  }

  /**
   * Apply a specific fix to a single field in the message
   */
  public static applyFieldFix(
    originalMessage: string,
    error: ValidationError
  ): string {
    const parsed = SiweMessageParser.parse(originalMessage);
    const fieldValue = parsed.fields[error.field as keyof typeof parsed.fields];
    
    let newValue: string;
    
    switch (error.code) {
      case 'ADDRESS_NOT_CHECKSUM':
        newValue = this.toChecksumAddress(fieldValue as string);
        break;
      case 'ADDRESS_INVALID_FORMAT':
        newValue = this.fixAddressFormat(fieldValue as string) || fieldValue as string;
        break;
      case 'VERSION_REQUIRED':
      case 'VERSION_INVALID':
        newValue = '1';
        break;
      case 'ISSUED_AT_REQUIRED':
        newValue = new Date().toISOString();
        break;
      case 'ISSUED_AT_INVALID_FORMAT':
      case 'EXPIRATION_TIME_INVALID_FORMAT':
        newValue = this.fixTimestampFormat(fieldValue as string) || fieldValue as string;
        break;
      case 'NONCE_REQUIRED':
      case 'NONCE_TOO_SHORT':
      case 'SECURITY_SHORT_NONCE':
      case 'NONCE_WEAK_ENTROPY':
      case 'SECURITY_WEAK_NONCE_PATTERN':
      case 'SECURITY_LOW_NONCE_COMPLEXITY':
        newValue = this.generateSecureNonce();
        break;
      case 'URI_INSECURE_SCHEME':
        newValue = (fieldValue as string).replace('http://', 'https://');
        break;
      case 'STATEMENT_LINE_BREAKS':
        newValue = (fieldValue as string).replace(/[\r\n]+/g, ' ').trim();
        break;
      case 'SECURITY_NO_EXPIRATION':
        // Add expiration time 10 minutes from issued at or now
        const issuedAt = parsed.fields.issuedAt;
        const baseTime = issuedAt ? new Date(issuedAt) : new Date();
        const expiration = new Date(baseTime.getTime() + 10 * 60 * 1000);
        newValue = expiration.toISOString();
        return this.replaceField(originalMessage, 'expirationTime', newValue);
      
      // Line break fixes
      case 'EXTRA_LINE_BREAK_HEADER_ADDRESS':
      case 'EXTRA_LINE_BREAKS_BEFORE_URI':
      case 'EXTRA_LINE_BREAKS_BETWEEN_FIELDS':
      case 'MISSING_LINE_BREAK_ADDRESS_STATEMENT':
      case 'MISSING_LINE_BREAK_STATEMENT_URI':
      case 'TRAILING_WHITESPACE':
      case 'TOO_MANY_CONSECUTIVE_EMPTY_LINES':
        return LineBreakValidator.fixLineBreaks(originalMessage);
      
      default:
        return originalMessage;
    }
    
    return this.replaceField(originalMessage, error.field, newValue);
  }

  // Field-specific replacement methods

  private static replaceDomainField(lines: string[], newValue: string): string {
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes(' wants you to sign in with your Ethereum account:')) {
        lines[i] = `${newValue} wants you to sign in with your Ethereum account:`;
        break;
      }
    }
    return lines.join('\n');
  }

  private static replaceAddressField(lines: string[], newValue: string): string {
    // Address is typically on the second line (after header)
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes(' wants you to sign in with your Ethereum account:')) {
        // Next non-empty line should be the address
        for (let j = i + 1; j < lines.length; j++) {
          if (lines[j].trim() && !lines[j].startsWith('URI:')) {
            // Check if this line looks like an address (40 hex chars with or without 0x)
            const addressPattern = /^(0x)?[a-fA-F0-9]{40}$/;
            if (addressPattern.test(lines[j].trim())) {
              lines[j] = newValue;
              break;
            }
          }
        }
        break;
      }
    }
    return lines.join('\n');
  }

  private static replaceStatementField(lines: string[], newValue: string): string {
    let foundAddress = false;
    for (let i = 0; i < lines.length; i++) {
      // Look for address first
      const addressPattern = /^(0x)?[a-fA-F0-9]{40}$/;
      if (addressPattern.test(lines[i].trim())) {
        foundAddress = true;
        continue;
      }
      
      // After finding address, look for statement (non-empty line before URI)
      if (foundAddress && lines[i].trim() && !lines[i].startsWith('URI:')) {
        lines[i] = newValue;
        break;
      }
    }
    return lines.join('\n');
  }

  private static replaceUriField(lines: string[], newValue: string): string {
    return this.replaceFieldWithPrefix(lines, 'URI: ', newValue);
  }

  private static replaceVersionField(lines: string[], newValue: string): string {
    return this.replaceFieldWithPrefix(lines, 'Version: ', newValue);
  }

  private static replaceChainIdField(lines: string[], newValue: string): string {
    return this.replaceFieldWithPrefix(lines, 'Chain ID: ', newValue);
  }

  private static replaceNonceField(lines: string[], newValue: string): string {
    return this.replaceFieldWithPrefix(lines, 'Nonce: ', newValue);
  }

  private static replaceIssuedAtField(lines: string[], newValue: string): string {
    return this.replaceFieldWithPrefix(lines, 'Issued At: ', newValue);
  }

  private static replaceExpirationTimeField(lines: string[], newValue: string): string {
    // Check if field exists
    const existingIndex = lines.findIndex(line => line.startsWith('Expiration Time: '));
    
    if (existingIndex >= 0) {
      lines[existingIndex] = `Expiration Time: ${newValue}`;
    } else {
      // Add after Issued At
      const issuedAtIndex = lines.findIndex(line => line.startsWith('Issued At: '));
      if (issuedAtIndex >= 0) {
        lines.splice(issuedAtIndex + 1, 0, `Expiration Time: ${newValue}`);
      }
    }
    
    return lines.join('\n');
  }

  private static replaceNotBeforeField(lines: string[], newValue: string): string {
    return this.replaceFieldWithPrefix(lines, 'Not Before: ', newValue);
  }

  private static replaceRequestIdField(lines: string[], newValue: string): string {
    return this.replaceFieldWithPrefix(lines, 'Request ID: ', newValue);
  }

  private static replaceFieldWithPrefix(lines: string[], prefix: string, newValue: string): string {
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith(prefix)) {
        lines[i] = `${prefix}${newValue}`;
        break;
      }
    }
    return lines.join('\n');
  }

  // Helper methods for fixing values

  private static toChecksumAddress(address: string): string {
    if (!address.startsWith('0x') || address.length !== 42) {
      return address;
    }

    const hex = address.slice(2).toLowerCase();
    let checksum = '';
    
    for (let i = 0; i < hex.length; i++) {
      const char = hex[i];
      if (/[0-9]/.test(char)) {
        checksum += char;
      } else {
        // Simple checksum logic (in production, use proper keccak256)
        const shouldBeUppercase = i % 2 === 0;
        checksum += shouldBeUppercase ? char.toUpperCase() : char.toLowerCase();
      }
    }
    
    return '0x' + checksum;
  }

  private static fixAddressFormat(address: string): string | null {
    address = address.trim();
    
    if (!address.startsWith('0x') && /^[a-fA-F0-9]{40}$/.test(address)) {
      return '0x' + address;
    }
    
    if (address.startsWith('0x') && /^0x[a-fA-F0-9]{40}$/.test(address)) {
      return address;
    }
    
    return null;
  }

  private static fixTimestampFormat(timestamp: string): string | null {
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) {
        return null;
      }
      return date.toISOString();
    } catch {
      return null;
    }
  }

  private static generateSecureNonce(): string {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    
    for (let i = 0; i < 16; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    
    return result;
  }
}
// Line break and formatting validation for SIWE messages

import type { ValidationError, ParsedSiweMessage } from './types';
import { SiweMessageParser } from './parser';

export class LineBreakValidator {
  
  /**
   * Validate line breaks and whitespace formatting in SIWE message
   */
  public static validateLineBreaks(message: string): ValidationError[] {
    const errors: ValidationError[] = [];
    const lines = message.split('\n');
    
    // Check for common line break issues
    errors.push(...this.checkExtraLineBreaks(lines));
    errors.push(...this.checkMissingLineBreaks(lines));
    errors.push(...this.checkTrailingWhitespace(lines));
    errors.push(...this.checkConsecutiveEmptyLines(lines));
    
    return errors;
  }

  /**
   * Detect extra line breaks that throw off parsing
   */
  private static checkExtraLineBreaks(lines: string[]): ValidationError[] {
    const errors: ValidationError[] = [];
    
    // Find the expected structure positions
    const structure = this.analyzeMessageStructure(lines);
    
    // Check for extra empty lines in specific locations
    if (structure.headerIndex !== -1 && structure.addressIndex !== -1) {
      // Should be no empty lines between header and address
      const betweenHeaderAndAddress = lines.slice(structure.headerIndex + 1, structure.addressIndex);
      if (betweenHeaderAndAddress.some(line => line === '')) {
        errors.push({
          type: 'format',
          field: 'structure',
          line: structure.headerIndex + 2,
          column: 1,
          message: 'Extra empty line between header and address',
          severity: 'error',
          fixable: true,
          suggestion: 'Remove extra empty lines between header and Ethereum address',
          code: 'EXTRA_LINE_BREAK_HEADER_ADDRESS'
        });
      }
    }

    // Check for extra empty lines before URI (should be exactly one after statement/address)
    if (structure.uriIndex !== -1) {
      const expectedEmptyLineIndex = this.getExpectedEmptyLineBeforeUri(lines, structure);
      if (expectedEmptyLineIndex !== -1) {
        // Count consecutive empty lines before URI
        const emptyLinesBefore = this.countConsecutiveEmptyLinesBefore(lines, structure.uriIndex);
        if (emptyLinesBefore > 1) {
          const extraLinesStart = structure.uriIndex - emptyLinesBefore + 1;
          errors.push({
            type: 'format',
            field: 'structure',
            line: extraLinesStart + 1,
            column: 1,
            message: `Extra empty lines before URI field (found ${emptyLinesBefore}, expected 1)`,
            severity: 'error',
            fixable: true,
            suggestion: 'Remove extra empty lines before URI field',
            code: 'EXTRA_LINE_BREAKS_BEFORE_URI'
          });
        }
      }
    }

    // Check for extra empty lines between required fields
    const requiredFieldIndices = [
      structure.uriIndex,
      structure.versionIndex,
      structure.chainIdIndex,
      structure.nonceIndex,
      structure.issuedAtIndex
    ].filter(i => i !== -1);

    for (let i = 0; i < requiredFieldIndices.length - 1; i++) {
      const currentIndex = requiredFieldIndices[i];
      const nextIndex = requiredFieldIndices[i + 1];
      
      if (nextIndex - currentIndex > 1) {
        const emptyLinesBetween = nextIndex - currentIndex - 1;
        errors.push({
          type: 'format',
          field: 'structure',
          line: currentIndex + 2,
          column: 1,
          message: `Extra empty lines between required fields (${emptyLinesBetween} empty lines found)`,
          severity: 'error',
          fixable: true,
          suggestion: 'Required fields should be on consecutive lines with no empty lines between them',
          code: 'EXTRA_LINE_BREAKS_BETWEEN_FIELDS'
        });
      }
    }

    return errors;
  }

  /**
   * Detect missing line breaks where they should be
   */
  private static checkMissingLineBreaks(lines: string[]): ValidationError[] {
    const errors: ValidationError[] = [];
    const structure = this.analyzeMessageStructure(lines);

    // Check if there should be an empty line after address (when there's a statement)
    if (structure.addressIndex !== -1 && structure.statementIndex !== -1) {
      if (structure.statementIndex - structure.addressIndex === 1) {
        // Statement immediately follows address - missing empty line
        errors.push({
          type: 'format',
          field: 'structure',
          line: structure.addressIndex + 2,
          column: 1,
          message: 'Missing empty line between address and statement',
          severity: 'error',
          fixable: true,
          suggestion: 'Add an empty line between the Ethereum address and statement',
          code: 'MISSING_LINE_BREAK_ADDRESS_STATEMENT'
        });
      }
    }

    // Check if there should be an empty line after statement (before URI)
    if (structure.statementIndex !== -1 && structure.uriIndex !== -1) {
      if (structure.uriIndex - structure.statementIndex === 1) {
        // URI immediately follows statement - missing empty line
        errors.push({
          type: 'format',
          field: 'structure',
          line: structure.statementIndex + 2,
          column: 1,
          message: 'Missing empty line between statement and URI field',
          severity: 'error',
          fixable: true,
          suggestion: 'Add an empty line between the statement and URI field',
          code: 'MISSING_LINE_BREAK_STATEMENT_URI'
        });
      }
    }

    return errors;
  }

  /**
   * Check for trailing whitespace issues
   */
  private static checkTrailingWhitespace(lines: string[]): ValidationError[] {
    const errors: ValidationError[] = [];

    lines.forEach((line, index) => {
      if (line.length > 0 && line !== line.trimRight()) {
        errors.push({
          type: 'format',
          field: 'whitespace',
          line: index + 1,
          column: line.trimRight().length + 1,
          message: 'Line has trailing whitespace',
          severity: 'warning',
          fixable: true,
          suggestion: 'Remove trailing spaces/tabs from the end of the line',
          code: 'TRAILING_WHITESPACE'
        });
      }
    });

    return errors;
  }

  /**
   * Check for multiple consecutive empty lines
   */
  private static checkConsecutiveEmptyLines(lines: string[]): ValidationError[] {
    const errors: ValidationError[] = [];
    let consecutiveEmpty = 0;
    let consecutiveStart = -1;

    lines.forEach((line, index) => {
      if (line.trim() === '') {
        if (consecutiveEmpty === 0) {
          consecutiveStart = index;
        }
        consecutiveEmpty++;
      } else {
        if (consecutiveEmpty > 2) {
          errors.push({
            type: 'format',
            field: 'structure',
            line: consecutiveStart + 2,
            column: 1,
            message: `Too many consecutive empty lines (${consecutiveEmpty} found)`,
            severity: 'warning',
            fixable: true,
            suggestion: 'Reduce to at most 2 consecutive empty lines',
            code: 'TOO_MANY_CONSECUTIVE_EMPTY_LINES'
          });
        }
        consecutiveEmpty = 0;
      }
    });

    return errors;
  }

  /**
   * Analyze the structure of the message to find field positions
   */
  private static analyzeMessageStructure(lines: string[]): {
    headerIndex: number;
    addressIndex: number;
    statementIndex: number;
    uriIndex: number;
    versionIndex: number;
    chainIdIndex: number;
    nonceIndex: number;
    issuedAtIndex: number;
  } {
    const structure = {
      headerIndex: -1,
      addressIndex: -1,
      statementIndex: -1,
      uriIndex: -1,
      versionIndex: -1,
      chainIdIndex: -1,
      nonceIndex: -1,
      issuedAtIndex: -1
    };

    lines.forEach((line, index) => {
      // Header line
      if (line.includes(' wants you to sign in with your Ethereum account:')) {
        structure.headerIndex = index;
      }
      // Address line (40 hex chars with optional 0x)
      else if (/^(0x)?[a-fA-F0-9]{40}$/.test(line.trim())) {
        structure.addressIndex = index;
      }
      // Field lines
      else if (line.startsWith('URI: ')) {
        structure.uriIndex = index;
      }
      else if (line.startsWith('Version: ')) {
        structure.versionIndex = index;
      }
      else if (line.startsWith('Chain ID: ')) {
        structure.chainIdIndex = index;
      }
      else if (line.startsWith('Nonce: ')) {
        structure.nonceIndex = index;
      }
      else if (line.startsWith('Issued At: ')) {
        structure.issuedAtIndex = index;
      }
      // Statement line (non-empty, not a field, after address, before URI)
      else if (line.trim() && 
               !line.startsWith('URI: ') && 
               !line.startsWith('Version: ') &&
               !line.startsWith('Chain ID: ') &&
               !line.startsWith('Nonce: ') &&
               !line.startsWith('Issued At: ') &&
               !line.startsWith('Expiration Time: ') &&
               !line.startsWith('Not Before: ') &&
               !line.startsWith('Request ID: ') &&
               !line.startsWith('Resources:') &&
               structure.headerIndex !== -1 &&
               index > structure.headerIndex) {
        if (structure.statementIndex === -1) { // Take the first one found
          structure.statementIndex = index;
        }
      }
    });

    return structure;
  }

  /**
   * Get the expected position of empty line before URI
   */
  private static getExpectedEmptyLineBeforeUri(lines: string[], structure: any): number {
    if (structure.statementIndex !== -1) {
      return structure.statementIndex + 1;
    } else if (structure.addressIndex !== -1) {
      return structure.addressIndex + 1;
    }
    return -1;
  }

  /**
   * Count consecutive empty lines before a given index
   */
  private static countConsecutiveEmptyLinesBefore(lines: string[], index: number): number {
    let count = 0;
    for (let i = index - 1; i >= 0 && lines[i] === ''; i--) {
      count++;
    }
    return count;
  }

  /**
   * Fix line break issues in a message
   */
  public static fixLineBreaks(message: string): string {
    const lines = message.split('\n');
    const structure = this.analyzeMessageStructure(lines);
    
    // Remove trailing whitespace from all lines
    const cleanedLines = lines.map(line => line.trimRight());
    
    // Fix the structure by rebuilding with correct spacing
    const fixedLines: string[] = [];
    let i = 0;
    
    while (i < cleanedLines.length) {
      const line = cleanedLines[i];
      
      // Header line
      if (i === structure.headerIndex) {
        fixedLines.push(line);
        i++;
      }
      // Address line - should follow header immediately
      else if (i === structure.addressIndex) {
        fixedLines.push(line);
        i++;
        
        // Add empty line after address if there's a statement
        if (structure.statementIndex !== -1) {
          fixedLines.push('');
        }
      }
      // Statement line
      else if (i === structure.statementIndex) {
        fixedLines.push(line);
        fixedLines.push(''); // Empty line after statement
        i++;
      }
      // Required fields - should be consecutive
      else if (line.startsWith('URI: ') || 
               line.startsWith('Version: ') || 
               line.startsWith('Chain ID: ') || 
               line.startsWith('Nonce: ') || 
               line.startsWith('Issued At: ')) {
        fixedLines.push(line);
        i++;
      }
      // Optional fields
      else if (line.startsWith('Expiration Time: ') || 
               line.startsWith('Not Before: ') || 
               line.startsWith('Request ID: ')) {
        fixedLines.push(line);
        i++;
      }
      // Resources
      else if (line.startsWith('Resources:') || line.startsWith('- ')) {
        fixedLines.push(line);
        i++;
      }
      // Skip extra empty lines (they'll be added where needed)
      else if (line === '') {
        i++;
      }
      // Other content
      else {
        fixedLines.push(line);
        i++;
      }
    }
    
    // Remove multiple consecutive empty lines (keep max 2)
    const finalLines: string[] = [];
    let consecutiveEmpty = 0;
    
    for (const line of fixedLines) {
      if (line === '') {
        consecutiveEmpty++;
        if (consecutiveEmpty <= 2) {
          finalLines.push(line);
        }
      } else {
        consecutiveEmpty = 0;
        finalLines.push(line);
      }
    }
    
    return finalLines.join('\n');
  }
}
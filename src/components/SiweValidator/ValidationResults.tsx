// Validation Results Display Component with diff-style output

import React from 'react';
import type { ValidationResult, ValidationError } from './types';
import { ValidationEngine } from './validationEngine';
import styles from './SiweValidator.module.css';

interface ValidationResultsProps {
  result: ValidationResult | null;
  isValidating: boolean;
  onApplyFix: (error: ValidationError) => void;
  onApplyAllFixes: () => void;
}

const ValidationResults: React.FC<ValidationResultsProps> = ({
  result,
  isValidating,
  onApplyFix,
  onApplyAllFixes
}) => {
  if (isValidating) {
    return (
      <div className={styles.resultsPanel}>
        <div className={styles.resultsHeader}>
          <h3 className={styles.resultsTitle}>Validation Results</h3>
        </div>
        <div className={styles.resultsContent}>
          <div className={styles.loading}>
            <div style={{ marginRight: '0.5rem' }}>⏳</div>
            Validating message...
          </div>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className={styles.resultsPanel}>
        <div className={styles.resultsHeader}>
          <h3 className={styles.resultsTitle}>Validation Results</h3>
        </div>
        <div className={styles.resultsContent}>
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>📝</div>
            <div className={styles.emptyMessage}>Ready to validate</div>
            <div className={styles.emptyHint}>
              Enter a SIWE message in the input panel and click "Validate" to see results
            </div>
          </div>
        </div>
      </div>
    );
  }

  const stats = ValidationEngine.getValidationStats(result);
  const allIssues = [...result.errors, ...result.warnings, ...result.suggestions];
  const fixableIssues = allIssues.filter(issue => issue.fixable);

  return (
    <div className={styles.resultsPanel}>
      <div className={styles.resultsHeader}>
        <h3 className={styles.resultsTitle}>Validation Results</h3>
      </div>
      <div className={styles.resultsContent}>
        {/* Validation Summary */}
        <div className={`${styles.summary} ${result.isValid ? styles.summaryValid : styles.summaryInvalid}`}>
          <span className={styles.summaryIcon}>
            {result.isValid ? '✅' : '❌'}
          </span>
          <span className={styles.summaryText}>
            {result.isValid
              ? 'Message is valid and compliant with EIP-4361'
              : `Found ${stats.totalIssues} issue${stats.totalIssues !== 1 ? 's' : ''}`
            }
          </span>
        </div>

        {/* Statistics */}
        {stats.totalIssues > 0 && (
          <div className={styles.stats}>
            {stats.errorCount > 0 && (
              <div className={`${styles.stat} ${styles.statError}`}>
                ❌ {stats.errorCount} Error{stats.errorCount !== 1 ? 's' : ''}
              </div>
            )}
            {stats.warningCount > 0 && (
              <div className={`${styles.stat} ${styles.statWarning}`}>
                ⚠️ {stats.warningCount} Warning{stats.warningCount !== 1 ? 's' : ''}
              </div>
            )}
            {stats.suggestionCount > 0 && (
              <div className={`${styles.stat} ${styles.statInfo}`}>
                💡 {stats.suggestionCount} Suggestion{stats.suggestionCount !== 1 ? 's' : ''}
              </div>
            )}
            {stats.fixableCount > 0 && (
              <div className={styles.stat}>
                🔧 {stats.fixableCount} Fixable
              </div>
            )}
          </div>
        )}

        {/* Auto-fix controls */}
        {fixableIssues.length > 0 && (
          <div style={{ marginBottom: '1.5rem' }}>
            <button
              className={`${styles.button} ${styles.buttonSuccess}`}
              onClick={onApplyAllFixes}
            >
              🔧 Fix All Issues ({fixableIssues.length})
            </button>
          </div>
        )}

        {/* Issues List */}
        {allIssues.length > 0 ? (
          <div className={styles.issuesList}>
            {allIssues.map((issue, index) => (
              <IssueCard
                key={`${issue.code}-${index}`}
                issue={issue}
                onApplyFix={onApplyFix}
              />
            ))}
          </div>
        ) : (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>🎉</div>
            <div className={styles.emptyMessage}>No issues found!</div>
            <div className={styles.emptyHint}>
              Your SIWE message is properly formatted and secure
            </div>
          </div>
        )}

        {/* Additional Information */}
        {result.isValid && (
          <div className={styles.quickActions}>
            <div className={styles.quickActionsTitle}>✨ Message Analysis</div>
            <div style={{ fontSize: '0.875rem' }}>
              <div>• Security: {stats.securityIssues === 0 ? '✅ Secure' : `⚠️ ${stats.securityIssues} issues`}</div>
              <div>• Compliance: {stats.complianceIssues === 0 ? '✅ EIP-4361 compliant' : `❌ ${stats.complianceIssues} issues`}</div>
              <div>• Format: {stats.formatIssues === 0 ? '✅ Well-formatted' : `❌ ${stats.formatIssues} issues`}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

interface IssueCardProps {
  issue: ValidationError;
  onApplyFix: (error: ValidationError) => void;
}

const IssueCard: React.FC<IssueCardProps> = ({ issue, onApplyFix }) => {
  const getSeverityClass = (severity: string) => {
    switch (severity) {
      case 'error': return styles.issueError;
      case 'warning': return styles.issueWarning;
      case 'info': return styles.issueInfo;
      default: return styles.issueInfo;
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'info': return '💡';
      default: return '💡';
    }
  };

  const getTypeClass = (severity: string) => {
    switch (severity) {
      case 'error': return styles.issueTypeError;
      case 'warning': return styles.issueTypeWarning;
      case 'info': return styles.issueTypeInfo;
      default: return styles.issueTypeInfo;
    }
  };

  const getCategoryIcon = (type: string) => {
    switch (type) {
      case 'security': return '🔒';
      case 'compliance': return '📋';
      case 'format': return '📝';
      default: return '📝';
    }
  };

  return (
    <div className={`${styles.issue} ${getSeverityClass(issue.severity)}`}>
      <div className={styles.issueHeader}>
        <span className={styles.issueIcon}>
          {getSeverityIcon(issue.severity)}
        </span>
        <span className={`${styles.issueType} ${getTypeClass(issue.severity)}`}>
          {issue.severity}
        </span>
        {/* <span className={styles.issueType} style={{
          background: 'var(--ifm-color-emphasis-200)',
          color: 'white',
          wordBreak: "keep-all",
          wordWrap: "revert"
        }}>
          {getCategoryIcon(issue.type)} {issue.type}
        </span> */}
        <div style={{ flex: 1 }} />
        <span className={styles.issueLocation}>
          {issue.field} • Line {issue.line}
        </span>
      </div>

      <div className={styles.issueMessage}>
        {issue.message}
      </div>

      {issue.suggestion && (
        <div className={styles.issueSuggestion}>
          💡 {issue.suggestion}
        </div>
      )}

      {issue.fixable && (
        <div className={styles.issueActions}>
          <button
            className={styles.fixButton}
            onClick={() => onApplyFix(issue)}
          >
            🔧 Fix This
          </button>
        </div>
      )}
    </div>
  );
};

export default ValidationResults;